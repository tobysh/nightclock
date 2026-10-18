"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Analog from "./clocks/Analog";
import Digital from "./clocks/Digital";
import MediaCard from "./MediaCard";
import SkyBackground from "./SkyBackground";
import SettingsPanel from "./SettingsPanel";
import { DEFAULT_SETTINGS, NIGHT_PALETTE, isNight, loadSettings, saveSettings, type Settings } from "@/lib/settings";
import { isTauri, toggleWindowFullscreen, useMedia } from "@/lib/media";
import { applyCycle } from "@/lib/cycle";
import { resolveLocation } from "@/lib/astro";
import { useRemote } from "@/lib/remote";
import { formatDate, useNow } from "@/lib/time";

export default function NightClock() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const media = useMedia(settings.showMedia);
  const now = useNow(settings.mode !== "digital" && (settings.smooth || settings.animate));

  useEffect(() => {
    // localStorage is only readable on the client, so hydrate after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(loadSettings());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveSettings(settings);
  }, [settings, loaded]);

  const update = useCallback(
    (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch, palette: { ...s.palette, ...patch.palette } })),
    [],
  );
  const remoteUrl = useRemote(settings, loaded, update);

  const toggleFullscreen = useCallback(() => {
    if (isTauri()) toggleWindowFullscreen();
    else if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  // Fade the settings button out when idle.
  const wake = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setControlsVisible(false), 4000);
  }, []);

  useEffect(() => {
    idleTimer.current = setTimeout(() => setControlsVisible(false), 4000);
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement).tagName === "INPUT" && (e.target as HTMLInputElement).type !== "checkbox" && (e.target as HTMLInputElement).type !== "range") return;
      if (e.key === "s" || e.key === "S") setPanelOpen((o) => !o);
      else if (e.key === "f" || e.key === "F") toggleFullscreen();
      else if (e.key === "Escape") setPanelOpen(false);
      wake();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointermove", wake);
    window.addEventListener("pointerdown", wake);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("pointerdown", wake);
      clearTimeout(idleTimer.current);
    };
  }, [wake, toggleFullscreen]);

  // Screen wake lock
  useEffect(() => {
    if (!settings.wakeLock || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = () =>
      navigator.wakeLock.request("screen").then((l) => {
        if (cancelled) l.release();
        else lock = l;
      }).catch(() => {});
    const onVisible = () => document.visibilityState === "visible" && request();
    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, [settings.wakeLock]);

  // Night mode swaps to a red-only palette and caps brightness.
  const night = !!now && isNight(settings, now.getHours());
  const cycled = now ? applyCycle(settings, now.getTime()) : settings;
  const view: Settings = night
    ? { ...cycled, palette: NIGHT_PALETTE, brightness: Math.min(cycled.brightness, 0.4) }
    : cycled;
  const loc = resolveLocation(settings.lat, settings.lon);
  const showSky = loaded && !night && (settings.skyBackground || settings.stars);

  // Keep the page chrome in sync with the chosen background.
  useEffect(() => {
    document.documentElement.style.background = view.palette.bg;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", view.palette.bg);
  }, [view.palette.bg]);

  // Small per-minute offset so static pixels don't burn into OLED screens.
  const minute = now ? Math.floor(now.getTime() / 60000) : 0;
  const drift = settings.drift
    ? { x: Math.sin(minute * 12.9898) * 3, y: Math.cos(minute * 78.233) * 3 }
    : { x: 0, y: 0 };

  const { palette } = view;
  const stageStyle = {
    "--scale": settings.scale,
    background: palette.bg,
    filter: `brightness(${view.brightness})`,
  } as CSSProperties;

  return (
    <main className={`nc-root ${controlsVisible || panelOpen ? "" : "idle"}`} style={{ background: palette.bg }}>
      <div className="nc-stage" style={stageStyle}>
        {showSky && <SkyBackground lat={loc.lat} lon={loc.lon} gradient={settings.skyBackground} stars={settings.stars} bg={palette.bg} />}
        {now && loaded && (
          <div
            className="nc-clock"
            style={{ transform: `translate(${drift.x}vmin, ${drift.y}vmin)` }}
            onDoubleClick={toggleFullscreen}
          >
            <div key={`${view.mode}-${view.analogStyle}-${view.digitalStyle}`} className="nc-swap">
            {view.mode === "both" ? (
              <div className="nc-both" style={{ "--scale": view.scale * 0.62 } as CSSProperties}>
                <Analog now={now} settings={view} />
                <Digital now={now} settings={view} />
              </div>
            ) : view.mode === "analog" ? (
              <Analog now={now} settings={view} />
            ) : (
              <Digital now={now} settings={view} />
            )}
            </div>
            {settings.showDate && !(view.mode !== "analog" && view.digitalStyle === "solar" && view.solarDateBelow) && (
              <div className="nc-date" style={{ color: palette.muted }}>
                {formatDate(now)}
              </div>
            )}
          </div>
        )}
        {media && (
          <div className="nc-media" style={{ transform: `translate(${drift.x}vmin, ${drift.y}vmin)` }}>
            <MediaCard media={media} palette={palette} showControls={settings.mediaControls} />
          </div>
        )}
      </div>

      <button
        type="button"
        className={`nc-gear ${controlsVisible && !panelOpen ? "show" : ""}`}
        onClick={() => setPanelOpen(true)}
        aria-label="Open settings"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      </button>

      <SettingsPanel
        open={panelOpen}
        settings={settings}
        onChange={update}
        onClose={() => setPanelOpen(false)}
        onFullscreen={toggleFullscreen}
        remoteUrl={remoteUrl}
        locationEstimated={loc.estimated}
      />
    </main>
  );
}
