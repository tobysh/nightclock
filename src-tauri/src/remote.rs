//! LAN remote control: a tiny HTTP server that serves a phone-friendly
//! controller page and relays setting changes to the desktop UI.
//!
//! The desktop frontend owns the settings (localStorage); it publishes a copy
//! here so the phone can read it, and phone edits come back as `remote-patch`
//! events. Every request must carry the secret token (`?k=`), which is
//! persisted so a bookmarked/paired phone keeps working across launches.

use serde_json::{json, Value};
use std::io::Read;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager, State};
use tiny_http::{Header, Method, Request, Response, Server};

const PAGE: &str = include_str!("remote.html");

#[derive(Default)]
pub struct RemoteState {
    settings: Value,
    schema: Value,
    version: u64,
    token: String,
    server: Option<Arc<Server>>,
    url: Option<String>,
}

pub type Shared = Arc<Mutex<RemoteState>>;

fn load_or_create_token(app: &AppHandle) -> String {
    let path = app.path().app_config_dir().ok().map(|d| d.join("remote_token"));
    if let Some(p) = &path {
        if let Ok(t) = std::fs::read_to_string(p) {
            let t = t.trim().to_string();
            if t.len() >= 8 {
                return t;
            }
        }
    }
    let mut buf = [0u8; 9];
    getrandom::fill(&mut buf).expect("system randomness unavailable");
    let token: String = buf.iter().map(|b| format!("{b:02x}")).collect();
    if let Some(p) = path {
        let _ = std::fs::create_dir_all(p.parent().unwrap());
        let _ = std::fs::write(p, &token);
    }
    token
}

fn merge_patch(settings: &mut Value, patch: &Value) {
    let (Some(s), Some(p)) = (settings.as_object_mut(), patch.as_object()) else { return };
    for (k, v) in p {
        if k == "palette" {
            if let (Some(dst), Some(src)) = (s.entry(k.clone()).or_insert(json!({})).as_object_mut(), v.as_object()) {
                for (pk, pv) in src {
                    dst.insert(pk.clone(), pv.clone());
                }
            }
        } else {
            s.insert(k.clone(), v.clone());
        }
    }
}

fn header(name: &str, value: &str) -> Header {
    Header::from_bytes(name.as_bytes(), value.as_bytes()).unwrap()
}

fn json_response(v: &Value) -> Response<std::io::Cursor<Vec<u8>>> {
    Response::from_string(v.to_string()).with_header(header("Content-Type", "application/json")).with_header(header("Cache-Control", "no-store"))
}

fn handle(mut req: Request, app: &AppHandle, shared: &Shared) {
    let url = req.url().to_string();
    let (path, query) = url.split_once('?').unwrap_or((&url, ""));
    let token_ok = {
        let st = shared.lock().unwrap();
        query.split('&').any(|kv| kv.strip_prefix("k=") == Some(st.token.as_str()))
    };
    if !token_ok {
        let _ = req.respond(Response::from_string("Forbidden").with_status_code(403));
        return;
    }

    let method = req.method().clone();
    let response = match (method, path) {
        (Method::Get, "/") => Response::from_string(PAGE).with_header(header("Content-Type", "text/html; charset=utf-8")).with_header(header("Cache-Control", "no-store")),
        (Method::Get, "/api/state") => {
            let st = shared.lock().unwrap();
            json_response(&json!({
                "version": st.version,
                "settings": st.settings,
                "schema": st.schema,
                // art can be a large data: URI, so it's fetched separately via /api/art
                "media": crate::media::current().map(|m| {
                    let mut v = serde_json::to_value(&m).unwrap_or(Value::Null);
                    v["art"] = json!(m.art.is_some());
                    v
                }),
            }))
        }
        (Method::Get, "/api/art") => {
            let art = crate::media::current().and_then(|m| m.art).unwrap_or_default();
            Response::from_string(art).with_header(header("Content-Type", "text/plain")).with_header(header("Cache-Control", "no-store"))
        }
        (Method::Post, "/api/settings") => {
            let mut body = String::new();
            let _ = req.as_reader().take(64 * 1024).read_to_string(&mut body);
            match serde_json::from_str::<Value>(&body) {
                Ok(patch) if patch.is_object() => {
                    {
                        let mut st = shared.lock().unwrap();
                        merge_patch(&mut st.settings, &patch);
                        st.version += 1;
                    }
                    let _ = app.emit("remote-patch", &patch);
                    json_response(&json!({ "ok": true }))
                }
                _ => Response::from_string("{\"ok\":false}").with_status_code(400).with_header(header("Content-Type", "application/json")),
            }
        }
        (Method::Post, p) if p.starts_with("/api/media/") => {
            let r = crate::media::control(&p["/api/media/".len()..]);
            json_response(&json!({ "ok": r.is_ok() }))
        }
        _ => Response::from_string("Not found").with_status_code(404),
    };
    let _ = req.respond(response);
}

#[tauri::command]
pub fn remote_publish(state: State<Shared>, settings: Value, schema: Value) {
    let mut st = state.lock().unwrap();
    if st.settings != settings {
        st.version += 1;
    }
    st.settings = settings;
    st.schema = schema;
}

/// Starts or stops the server. Returns the pairing URL when running.
#[tauri::command]
pub fn remote_enable(app: AppHandle, state: State<Shared>, enabled: bool) -> Result<Option<String>, String> {
    let shared: Shared = state.inner().clone();
    let mut st = shared.lock().unwrap();

    if !enabled {
        if let Some(server) = st.server.take() {
            server.unblock();
        }
        st.url = None;
        return Ok(None);
    }
    if st.url.is_some() {
        return Ok(st.url.clone());
    }

    if st.token.is_empty() {
        st.token = load_or_create_token(&app);
    }
    let (server, port) = (7878u16..7900)
        .find_map(|p| Server::http(("0.0.0.0", p)).ok().map(|s| (s, p)))
        .ok_or("no free port in 7878-7899")?;
    let server = Arc::new(server);
    let ip = local_ip_address::local_ip().map(|i| i.to_string()).unwrap_or_else(|_| "localhost".into());
    let url = format!("http://{ip}:{port}/?k={}", st.token);
    st.server = Some(server.clone());
    st.url = Some(url.clone());
    drop(st);

    let app2 = app.clone();
    std::thread::spawn(move || {
        for req in server.incoming_requests() {
            let (app, shared) = (app2.clone(), shared.clone());
            std::thread::spawn(move || handle(req, &app, &shared));
        }
    });
    Ok(Some(url))
}
