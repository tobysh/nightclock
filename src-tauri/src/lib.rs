mod media;
mod remote;

use media::MediaInfo;
use tauri::Manager;

#[tauri::command]
fn media_get() -> Option<MediaInfo> {
    media::current()
}

#[tauri::command]
fn media_control(action: String) -> Result<(), String> {
    media::control(&action)
}

pub fn run() {
    // WebKitGTK's DMABUF renderer triggers "Error 71 (Protocol error)" on many
    // Wayland setups; fall back to the stable path unless the user overrides it.
    #[cfg(target_os = "linux")]
    if std::env::var_os("WEBKIT_DISABLE_DMABUF_RENDERER").is_none() {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }

    tauri::Builder::default()
        .manage(remote::Shared::default())
        .setup(|app| {
            media::spawn_watcher(app.handle().clone());
            // Make sure the main window exists before the watcher emits.
            let _ = app.get_webview_window("main");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![media_get, media_control, remote::remote_publish, remote::remote_enable])
        .run(tauri::generate_context!())
        .expect("error while running Night Clock");
}
