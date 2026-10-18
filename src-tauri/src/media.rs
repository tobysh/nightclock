//! Currently-playing media. Implemented on Linux via MPRIS (D-Bus); other
//! platforms report "nothing playing" for now.

use serde::Serialize;
use tauri::AppHandle;

#[derive(Serialize, Clone, PartialEq, Debug)]
pub struct MediaInfo {
    pub title: String,
    pub artist: String,
    pub album: String,
    /// data: URI for local art, or the remote URL as-is.
    pub art: Option<String>,
    pub playing: bool,
    pub position_ms: u64,
    pub length_ms: u64,
    pub player: String,
}

#[cfg(target_os = "linux")]
mod imp {
    use super::MediaInfo;
    use base64::Engine;
    use mpris::{PlaybackStatus, Player, PlayerFinder};
    use std::sync::Mutex;

    /// Art is re-read only when the URL changes.
    static ART_CACHE: Mutex<Option<(String, Option<String>)>> = Mutex::new(None);

    fn art_for(url: &str) -> Option<String> {
        let mut cache = ART_CACHE.lock().ok()?;
        if let Some((u, data)) = cache.as_ref() {
            if u == url {
                return data.clone();
            }
        }
        let data = if let Some(path) = url.strip_prefix("file://") {
            let path = percent_decode(path);
            std::fs::read(&path).ok().map(|bytes| {
                let mime = match path.rsplit('.').next().map(str::to_lowercase).as_deref() {
                    Some("png") => "image/png",
                    Some("webp") => "image/webp",
                    _ => "image/jpeg",
                };
                format!("data:{mime};base64,{}", base64::engine::general_purpose::STANDARD.encode(bytes))
            })
        } else if url.starts_with("http://") || url.starts_with("https://") {
            Some(url.to_string())
        } else {
            None
        };
        *cache = Some((url.to_string(), data.clone()));
        data
    }

    fn percent_decode(s: &str) -> String {
        let b = s.as_bytes();
        let mut out = Vec::with_capacity(b.len());
        let mut i = 0;
        while i < b.len() {
            if b[i] == b'%' && i + 2 < b.len() {
                let hex = std::str::from_utf8(&b[i + 1..i + 3]).ok();
                if let Some(v) = hex.and_then(|h| u8::from_str_radix(h, 16).ok()) {
                    out.push(v);
                    i += 3;
                    continue;
                }
            }
            out.push(b[i]);
            i += 1;
        }
        String::from_utf8_lossy(&out).into_owned()
    }

    fn pick(finder: &PlayerFinder) -> Option<Player> {
        // Prefer a player that is actually playing, else any player with metadata.
        let players = finder.find_all().ok()?;
        let mut fallback = None;
        for p in players {
            match p.get_playback_status() {
                Ok(PlaybackStatus::Playing) => return Some(p),
                Ok(_) if fallback.is_none() => fallback = Some(p),
                _ => {}
            }
        }
        fallback
    }

    pub fn current() -> Option<MediaInfo> {
        let finder = PlayerFinder::new().ok()?;
        let player = pick(&finder)?;
        let meta = player.get_metadata().ok()?;
        let title = meta.title().unwrap_or("").to_string();
        if title.is_empty() {
            return None;
        }
        let playing = matches!(player.get_playback_status(), Ok(PlaybackStatus::Playing));
        Some(MediaInfo {
            title,
            artist: meta.artists().map(|a| a.join(", ")).unwrap_or_default(),
            album: meta.album_name().unwrap_or("").to_string(),
            art: meta.art_url().and_then(art_for),
            playing,
            position_ms: player.get_position().map(|d| d.as_millis() as u64).unwrap_or(0),
            length_ms: meta.length().map(|d| d.as_millis() as u64).unwrap_or(0),
            player: player.identity().to_string(),
        })
    }

    pub fn control(action: &str) -> Result<(), String> {
        let finder = PlayerFinder::new().map_err(|e| e.to_string())?;
        let player = pick(&finder).ok_or("no media player running")?;
        let r = match action {
            "play_pause" => player.play_pause(),
            "next" => player.next(),
            "previous" => player.previous(),
            other => return Err(format!("unknown action: {other}")),
        };
        r.map_err(|e| e.to_string())
    }
}

#[cfg(not(target_os = "linux"))]
mod imp {
    use super::MediaInfo;
    pub fn current() -> Option<MediaInfo> {
        None
    }
    pub fn control(_: &str) -> Result<(), String> {
        Err("media control is only supported on Linux (MPRIS) for now".into())
    }
}

pub fn current() -> Option<MediaInfo> {
    imp::current()
}

pub fn control(action: &str) -> Result<(), String> {
    imp::control(action)
}

/// Poll once a second and push `media-update` to the frontend when anything
/// visible changes (position only counts while playing).
pub fn spawn_watcher(app: AppHandle) {
    use tauri::Emitter;
    std::thread::spawn(move || {
        let mut last: Option<Option<MediaInfo>> = None;
        loop {
            let now = imp::current();
            if last.as_ref() != Some(&now) {
                let _ = app.emit("media-update", &now);
                last = Some(now);
            }
            std::thread::sleep(std::time::Duration::from_millis(1000));
        }
    });
}
