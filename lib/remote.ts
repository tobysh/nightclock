import { useEffect, useState } from "react";
import type { Settings } from "./settings";
import { REMOTE_SCHEMA } from "./remoteSchema";
import { isTauri } from "./media";

/**
 * Keeps the Rust remote server in sync with the settings:
 *  - starts/stops the server with `settings.remote`
 *  - publishes the current settings so the phone can read them
 *  - applies patches the phone sends back
 * Returns the pairing URL while the server is running.
 */
export function useRemote(settings: Settings, loaded: boolean, apply: (patch: Partial<Settings>) => void): string | null {
  const [url, setUrl] = useState<string | null>(null);
  const enabled = loaded && settings.remote;

  useEffect(() => {
    if (!isTauri() || !loaded) return;
    let cancelled = false;
    import("@tauri-apps/api/core").then(({ invoke }) =>
      invoke<string | null>("remote_enable", { enabled }).then(
        (u) => !cancelled && setUrl(u),
        () => !cancelled && setUrl(null),
      ),
    );
    return () => {
      cancelled = true;
    };
  }, [enabled, loaded]);

  useEffect(() => {
    if (!isTauri() || !enabled) return;
    import("@tauri-apps/api/core").then(({ invoke }) => invoke("remote_publish", { settings, schema: REMOTE_SCHEMA }).catch(() => {}));
  }, [settings, enabled]);

  useEffect(() => {
    if (!isTauri() || !enabled) return;
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    import("@tauri-apps/api/event").then(({ listen }) =>
      listen<Partial<Settings>>("remote-patch", (e) => apply(e.payload)).then((un) => (cancelled ? un() : (unlisten = un))),
    );
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [enabled, apply]);

  return enabled ? url : null;
}
