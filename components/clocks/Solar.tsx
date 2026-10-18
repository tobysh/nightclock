import type { CSSProperties } from "react";
import type { Settings } from "@/lib/settings";
import { resolveLocation, sunInfo } from "@/lib/astro";
import { formatDate } from "@/lib/time";
import { Num } from "../Roll";

const font: CSSProperties = { fontFamily: "var(--font-outfit), sans-serif" };
const vmin = (n: number) => `calc(${n}vmin * var(--scale))`;
const hm = (d: Date | null, hour12: boolean) =>
  d ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12 }) : "--:--";

interface Props {
  now: Date;
  settings: Settings;
  hStr: string;
  mStr: string;
}

function Body({ x, y, day, color, glow, r = 7 }: { x: number; y: number; day: boolean; color: string; glow: string; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={day ? r * 3.6 : r * 2.4} fill={glow} />
      <circle cx={x} cy={y} r={day ? r : r * 0.8} fill={color} />
    </g>
  );
}

/** Time, with the date as a smaller line beneath when "date below time" is on. */
function TimeText({ now, settings, hStr, mStr, size }: { now: Date; settings: Settings; hStr: string; mStr: string; size: number }) {
  const { text, accent, muted } = settings.palette;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: vmin(size * 0.12) }}>
      <span style={{ ...font, color: text, fontSize: vmin(size), fontWeight: 600, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", whiteSpace: "nowrap", lineHeight: 1 }}>
        <Num value={hStr} animate={settings.animate} />
        <span style={{ color: accent }}>:</span>
        <Num value={mStr} animate={settings.animate} />
      </span>
      {settings.showDate && settings.solarDateBelow && (
        <span style={{ ...font, color: muted, fontSize: vmin(Math.max(2.6, size * 0.2)), fontWeight: 300, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
          {formatDate(now)}
        </span>
      )}
    </div>
  );
}

export default function Solar({ now, settings, hStr, mStr }: Props) {
  const { text, accent, muted, face } = settings.palette;
  const { lat, lon } = resolveLocation(settings.lat, settings.lon);
  const sun = sunInfo(now, lat, lon);
  const body = sun.isDay ? accent : text;
  const glowId = "solar-glow";
  const defs = (
    <defs>
      <radialGradient id={glowId}>
        <stop offset="0" stopColor={body} stopOpacity="0.85" />
        <stop offset="1" stopColor={body} stopOpacity="0" />
      </radialGradient>
    </defs>
  );
  const glow = `url(#${glowId})`;
  const times = (
    <>
      <span>{hm(sun.sunrise, settings.hour12)}</span>
      <span>{hm(sun.sunset, settings.hour12)}</span>
    </>
  );

  if (settings.solarVariant === "horizon") {
    // wide landscape: sun / moon travels over a hill silhouette
    const x = 15 + 170 * sun.frac;
    const y = 88 - 68 * Math.sin(Math.PI * sun.frac);
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: vmin(2) }}>
        <TimeText now={now} settings={settings} hStr={hStr} mStr={mStr} size={18} />
        <svg viewBox="0 0 200 110" style={{ width: vmin(92), overflow: "visible" }} aria-hidden>
          {defs}
          <path
            d={`M15,88 Q100,${88 - 68 * 2} 185,88`}
            fill="none" stroke={muted} strokeOpacity={0.45} strokeWidth={0.8} strokeDasharray="1 4" strokeLinecap="round"
          />
          <Body x={x} y={y} day={sun.isDay} color={body} glow={glow} r={6} />
          <path d="M0,110 L0,92 Q22,80 44,90 T88,86 T132,92 T170,84 T200,90 L200,110 Z" fill={face} />
          <line x1={0} x2={200} y1={96} y2={96} stroke={muted} strokeOpacity={0.35} strokeWidth={0.6} />
        </svg>
        <div style={{ ...font, display: "flex", justifyContent: "space-between", width: vmin(80), color: muted, fontSize: vmin(3.2) }}>{times}</div>
      </div>
    );
  }

  if (settings.solarVariant === "bar") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: vmin(4) }}>
        <TimeText now={now} settings={settings} hStr={hStr} mStr={mStr} size={30} />
        <svg viewBox="0 0 200 20" style={{ width: vmin(80), overflow: "visible" }} aria-hidden>
          {defs}
          <line x1={6} x2={194} y1={10} y2={10} stroke={muted} strokeOpacity={0.4} strokeWidth={1.2} strokeLinecap="round" />
          <line x1={6} x2={6 + 188 * sun.frac} y1={10} y2={10} stroke={body} strokeWidth={1.6} strokeLinecap="round" />
          <Body x={6 + 188 * sun.frac} y={10} day={sun.isDay} color={body} glow={glow} r={4} />
        </svg>
        <div style={{ ...font, display: "flex", justifyContent: "space-between", width: vmin(80), color: muted, fontSize: vmin(3.2) }}>
          {sun.isDay ? times : (
            <>
              <span>{hm(sun.sunset, settings.hour12)}</span>
              <span>{hm(sun.sunrise, settings.hour12)}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  // arc (default): the sun rides the upper half of the dial by day, the lower half by night
  const R = 84;
  const ang = Math.PI * sun.frac;
  const sx = sun.isDay ? 100 - R * Math.cos(ang) : 100 + R * Math.cos(ang);
  const sy = sun.isDay ? 100 - R * Math.sin(ang) : 100 + R * Math.sin(ang);
  const trail = sun.isDay
    ? `M${100 - R},100 A${R},${R} 0 0 1 ${sx.toFixed(2)},${sy.toFixed(2)}`
    : `M${100 + R},100 A${R},${R} 0 0 1 ${sx.toFixed(2)},${sy.toFixed(2)}`;
  return (
    <div style={{ position: "relative", width: vmin(74), aspectRatio: "1" }}>
      <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%", overflow: "visible" }} aria-hidden>
        {defs}
        <circle cx={100} cy={100} r={R} fill="none" stroke={muted} strokeOpacity={0.35} strokeWidth={1} strokeDasharray="1 5" strokeLinecap="round" />
        <line x1={4} x2={196} y1={100} y2={100} stroke={muted} strokeOpacity={0.5} strokeWidth={1} />
        {sun.frac > 0.01 && <path d={trail} fill="none" stroke={body} strokeOpacity={0.6} strokeWidth={2.4} strokeLinecap="round" />}
        <Body x={sx} y={sy} day={sun.isDay} color={body} glow={glow} />
        <text x={4} y={112} fill={muted} fontSize={7} style={font}>{hm(sun.sunrise, settings.hour12)}</text>
        <text x={196} y={112} fill={muted} fontSize={7} textAnchor="end" style={font}>{hm(sun.sunset, settings.hour12)}</text>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", paddingTop: "28%" }}>
        <TimeText now={now} settings={settings} hStr={hStr} mStr={mStr} size={15} />
      </div>
    </div>
  );
}
