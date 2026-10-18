import { useEffect, useState, useSyncExternalStore } from "react";

export interface MediaInfo {
  title: string;
  artist: string;
  album: string;
  art: string | null;
  playing: boolean;
  position_ms: number;
  length_ms: number;
  player: string;
}

export const isTauri = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/** isTauri() that is false during SSR/hydration, then true on the client. */
export function useIsTauri() {
  return useSyncExternalStore(() => () => {}, isTauri, () => false);
}

/** Whether a fullscreen button can work (not on iPhone Safari; installing the PWA gives fullscreen instead). */
export function useCanFullscreen() {
  return useSyncExternalStore(
    () => () => {},
    () => isTauri() || !!document.fullscreenEnabled,
    () => true,
  );
}

/** Currently playing media from the Rust backend; null in a plain browser or when idle. */
export function useMedia(enabled: boolean): MediaInfo | null {
  const [media, setMedia] = useState<MediaInfo | null>(null);

  useEffect(() => {
    if (!enabled || !isTauri()) return;
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      const [{ invoke }, { listen }] = await Promise.all([import("@tauri-apps/api/core"), import("@tauri-apps/api/event")]);
      if (cancelled) return;
      setMedia(await invoke<MediaInfo | null>("media_get").catch(() => null));
      const un = await listen<MediaInfo | null>("media-update", (e) => setMedia(e.payload));
      if (cancelled) un();
      else unlisten = un;
    })();
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [enabled]);

  return enabled ? media : null;
}

export async function mediaControl(action: "play_pause" | "next" | "previous") {
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("media_control", { action }).catch(() => {});
}

export async function toggleWindowFullscreen() {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  const win = getCurrentWindow();
  await win.setFullscreen(!(await win.isFullscreen()));
}
