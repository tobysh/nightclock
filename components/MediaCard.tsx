"use client";

import { useEffect, useState } from "react";
import { mediaControl, type MediaInfo } from "@/lib/media";
import type { Palette } from "@/lib/settings";

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export default function MediaCard({ media, palette, showControls }: { media: MediaInfo; palette: Palette; showControls: boolean }) {
  // Position is pushed once a second while playing; interpolate between pushes.
  const [pos, setPos] = useState(media.position_ms);
  useEffect(() => {
    const t0 = Date.now();
    const update = () => setPos(Math.min(media.length_ms || Infinity, media.position_ms + (media.playing ? Date.now() - t0 : 0)));
    update();
    if (!media.playing) return;
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, [media]);

  const pct = media.length_ms ? (pos / media.length_ms) * 100 : 0;

  return (
    <div className="mc" style={{ background: palette.face, color: palette.text }}>
      {media.art ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="mc-art" src={media.art} alt="" />
      ) : (
        <div className="mc-art mc-noart" style={{ background: palette.muted }} />
      )}
      <div className="mc-body">
        <div className="mc-title">{media.title}</div>
        <div className="mc-artist" style={{ color: palette.muted }}>{[media.artist, media.album].filter(Boolean).join(" · ")}</div>
        {media.length_ms > 0 && (
          <div className="mc-bar">
            <span style={{ color: palette.muted }}>{fmt(pos)}</span>
            <div style={{ background: palette.muted + "55" }}><i style={{ width: `${pct}%`, background: palette.accent }} /></div>
            <span style={{ color: palette.muted }}>{fmt(media.length_ms)}</span>
          </div>
        )}
      </div>
      {showControls && (
        <div className="mc-ctl">
          <button type="button" onClick={() => mediaControl("previous")} aria-label="Previous">⏮</button>
          <button type="button" onClick={() => mediaControl("play_pause")} aria-label={media.playing ? "Pause" : "Play"}>{media.playing ? "⏸" : "▶"}</button>
          <button type="button" onClick={() => mediaControl("next")} aria-label="Next">⏭</button>
        </div>
      )}
    </div>
  );
}
