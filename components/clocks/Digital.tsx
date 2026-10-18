import { useState, type CSSProperties } from "react";
import type { Settings } from "@/lib/settings";
import { timeParts } from "@/lib/time";
import { Num } from "../Roll";
import Solar from "./Solar";

interface Props {
  now: Date;
  settings: Settings;
}

const font: CSSProperties = { fontFamily: "var(--font-outfit), sans-serif" };
const vmin = (n: number) => `calc(${n}vmin * var(--scale))`;

/* ---------- 7-segment ---------- */

const SEGMENTS: Record<string, string> = {
  "0": "abcdef", "1": "bc", "2": "abdeg", "3": "abcdg", "4": "bcfg",
  "5": "acdfg", "6": "acdefg", "7": "abc", "8": "abcdefg", "9": "abcdfg",
};
const W = 50, H = 90, T = 9, GAP = 2.2;

const hSeg = (cy: number) => {
  const x1 = T / 2 + GAP, x2 = W - T / 2 - GAP;
  return `${x1},${cy} ${x1 + T / 2},${cy - T / 2} ${x2 - T / 2},${cy - T / 2} ${x2},${cy} ${x2 - T / 2},${cy + T / 2} ${x1 + T / 2},${cy + T / 2}`;
};
const vSeg = (cx: number, top: boolean) => {
  const y1 = (top ? T / 2 : H / 2) + GAP, y2 = (top ? H / 2 : H - T / 2) - GAP;
  return `${cx},${y1} ${cx + T / 2},${y1 + T / 2} ${cx + T / 2},${y2 - T / 2} ${cx},${y2} ${cx - T / 2},${y2 - T / 2} ${cx - T / 2},${y1 + T / 2}`;
};
const SEG_POINTS: Record<string, string> = {
  a: hSeg(T / 2), g: hSeg(H / 2), d: hSeg(H - T / 2),
  f: vSeg(T / 2, true), b: vSeg(W - T / 2, true),
  e: vSeg(T / 2, false), c: vSeg(W - T / 2, false),
};

function Segment({ text, height, settings }: { text: string; height: number; settings: Settings }) {
  const { text: fg, accent } = settings.palette;
  let x = 0;
  const items = [...text].map((ch, i) => {
    if (ch === ":") {
      const el = (
        <g key={i} transform={`translate(${x},0)`} fill={accent}>
          <rect x={6} y={H * 0.28} width={T} height={T} />
          <rect x={6} y={H * 0.62} width={T} height={T} />
        </g>
      );
      x += 22;
      return el;
    }
    const lit = ch === " " ? "" : SEGMENTS[ch] ?? "";
    const el = (
      <g key={i} transform={`translate(${x},0)`}>
        {Object.entries(SEG_POINTS).map(([k, pts]) => (
          <polygon key={k} points={pts} fill={fg} opacity={lit.includes(k) ? 1 : ch === " " ? 0 : 0.07} />
        ))}
      </g>
    );
    x += W + 10;
    return el;
  });
  const total = x - 10;
  return (
    <svg
      viewBox={`0 0 ${total} ${H}`}
      style={{ height: vmin(height), width: `calc(${vmin(height)} * ${total / H})`, overflow: "visible" }}
      aria-hidden
    >
      {items}
    </svg>
  );
}

/* ---------- Words ---------- */

const HOURS = ["twelve", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven"];
const PHRASES: Record<number, string> = {
  0: "", 5: "five past", 10: "ten past", 15: "quarter past", 20: "twenty past", 25: "twenty-five past",
  30: "half past", 35: "twenty-five to", 40: "twenty to", 45: "quarter to", 50: "ten to", 55: "five to",
};

function Words({ now, settings }: Props) {
  const { text, accent, muted } = settings.palette;
  let m5 = Math.round(now.getMinutes() / 5) * 5;
  let h = now.getHours();
  if (m5 === 60) { m5 = 0; h += 1; }
  if (m5 > 30) h += 1;
  const hour = HOURS[h % 12];
  return (
    <div style={{ ...font, textAlign: "center", fontSize: vmin(9), lineHeight: 1.25, fontWeight: 300 }}>
      <div style={{ color: muted }}>it&apos;s</div>
      {PHRASES[m5] && <div style={{ color: accent, fontWeight: 500 }}>{PHRASES[m5]}</div>}
      <div style={{ color: text, fontSize: vmin(15), fontWeight: 600, lineHeight: 1.1 }}>{hour}</div>
      {m5 === 0 && <div style={{ color: accent, fontWeight: 500 }}>o&apos;clock</div>}
    </div>
  );
}

/* ---------- Binary ---------- */

function Binary({ now, settings }: Props) {
  const { text, accent, muted } = settings.palette;
  const { hPadded, m, s } = timeParts(now, settings.hour12);
  const digits = [...hPadded, ...m, ...(settings.showSeconds ? s : "")];
  const bits = [8, 4, 2, 1];
  const size = vmin(6.5);
  return (
    <div style={{ display: "flex", gap: vmin(2.5) }}>
      {digits.map((d, i) => {
        const n = Number(d);
        const max = i === 0 ? 2 : i % 2 === 0 ? 5 : 9; // highest digit value in this column
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: vmin(1.6), marginRight: i % 2 === 1 && i < digits.length - 1 ? vmin(3) : 0 }}>
            {bits.map((b) => {
              const visible = b <= (max >= 8 ? 8 : max >= 4 ? 4 : max >= 2 ? 2 : 1);
              const on = (n & b) !== 0;
              return (
                <span
                  key={b}
                  style={{
                    width: size, height: size, borderRadius: "50%",
                    visibility: visible ? "visible" : "hidden",
                    background: on ? (i >= 4 ? accent : text) : muted,
                    opacity: on ? 1 : 0.2,
                    boxShadow: on ? `0 0 ${vmin(2)} ${i >= 4 ? accent : text}` : "none",
                  }}
                />
              );
            })}
            <span style={{ ...font, color: muted, fontSize: vmin(3.5), marginTop: vmin(0.5) }}>{d}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Flip cards ---------- */

function FlipDigit({ ch, settings }: { ch: string; settings: Settings }) {
  const { face, text, bg } = settings.palette;
  const [s, setS] = useState<{ cur: string; prev: string | null; n: number }>({ cur: ch, prev: null, n: 0 });
  if (s.cur !== ch) setS({ cur: ch, prev: s.cur, n: s.n + 1 });
  const flipping = settings.animate && s.prev !== null;
  const half = (v: string, bottom: boolean, cls = "") => (
    <div className={`fh ${bottom ? "fb" : "ft"} ${cls}`} style={{ background: face }}>
      <span>{v}</span>
    </div>
  );
  return (
    <div className="fc" style={{ ...font, color: text, width: vmin(17), height: vmin(25), fontSize: vmin(19), ["--r" as string]: vmin(2) }}>
      {half(s.cur, false)}
      {half(flipping ? s.prev! : s.cur, true)}
      {flipping && (
        <div key={s.n} style={{ display: "contents" }}>
          {half(s.prev!, false, "flap-top")}
          {half(s.cur, true, "flap-bottom")}
        </div>
      )}
      <i className="fline" style={{ background: bg, height: vmin(0.6) }} />
    </div>
  );
}

function FlipCard({ value, settings }: { value: string; settings: Settings }) {
  return (
    <div style={{ display: "flex", gap: vmin(0.8) }}>
      {[...value].map((ch, i) => (
        <FlipDigit key={i} ch={ch} settings={settings} />
      ))}
    </div>
  );
}

/* ---------- Main ---------- */

export default function Digital({ now, settings }: Props) {
  const { text, accent, muted } = settings.palette;
  const { h, hPadded, m, s, ampm } = timeParts(now, settings.hour12);
  const showAmPm = settings.hour12;
  const N = (v: string) => <Num value={v} animate={settings.animate} />;
  const colonOn = settings.showSeconds ? true : now.getSeconds() % 2 === 0;

  switch (settings.digitalStyle) {
    case "stacked":
      return (
        <div style={{ ...font, textAlign: "center", lineHeight: 0.82, fontWeight: 600, letterSpacing: "-0.02em" }}>
          <div style={{ color: text, fontSize: vmin(42) }}>{N(hPadded)}</div>
          <div style={{ color: accent, fontSize: vmin(42) }}>{N(m)}</div>
          <div style={{ color: muted, fontSize: vmin(6), fontWeight: 400, letterSpacing: "0.1em", marginTop: vmin(3), lineHeight: 1 }}>
            {settings.showSeconds && <span>{s}</span>}
            {showAmPm && <span style={{ marginLeft: settings.showSeconds ? vmin(2) : 0 }}>{ampm}</span>}
          </div>
        </div>
      );

    case "segment": {
      const str = `${settings.hour12 && h.length === 1 ? " " : ""}${h}:${m}`;
      return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: vmin(3) }}>
          <Segment text={str} height={26} settings={settings} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: vmin(1) }}>
            {showAmPm && <span style={{ ...font, color: muted, fontSize: vmin(4) }}>{ampm}</span>}
            {settings.showSeconds && <Segment text={s} height={10} settings={settings} />}
          </div>
        </div>
      );
    }

    case "flip":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: vmin(2.5), flexWrap: "wrap", justifyContent: "center" }}>
          <FlipCard value={hPadded} settings={settings} />
          <FlipCard value={m} settings={settings} />
          {settings.showSeconds && <FlipCard value={s} settings={settings} />}
          {showAmPm && <span style={{ ...font, color: muted, fontSize: vmin(4) }}>{ampm}</span>}
        </div>
      );

    case "neon": {
      const glow = `0 0 ${vmin(1)} ${text}, 0 0 ${vmin(3)} ${text}, 0 0 ${vmin(7)} ${accent}, 0 0 ${vmin(12)} ${accent}`;
      return (
        <div style={{ ...font, color: text, fontSize: vmin(20), fontWeight: 300, textShadow: glow, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
          {N(h)}
          <span style={{ opacity: colonOn ? 1 : 0.25 }}>:</span>
          {N(m)}
          {settings.showSeconds && <span style={{ fontSize: "0.4em", marginLeft: "0.2em" }}>{s}</span>}
          {showAmPm && <span style={{ fontSize: "0.22em", marginLeft: "0.3em" }}>{ampm}</span>}
        </div>
      );
    }

    case "thin":
      return (
        <div style={{ ...font, color: text, fontSize: vmin(28), fontWeight: 100, letterSpacing: "0.02em", whiteSpace: "nowrap", lineHeight: 1 }}>
          {N(h)}
          <span style={{ color: accent, opacity: colonOn ? 1 : 0.3 }}>:</span>
          {N(m)}
          {(settings.showSeconds || showAmPm) && (
            <span style={{ fontSize: "0.22em", color: muted, marginLeft: "0.4em", fontWeight: 300 }}>
              {settings.showSeconds && s} {showAmPm && ampm}
            </span>
          )}
        </div>
      );

    case "bold":
      return (
        <div style={{ ...font, textAlign: "center", color: text, fontWeight: 700, lineHeight: 0.9, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          <div style={{ fontSize: vmin(36) }}>
            {N(h)}
            <span style={{ color: accent, opacity: colonOn ? 1 : 0.35 }}>:</span>
            {N(m)}
          </div>
          {(settings.showSeconds || showAmPm) && (
            <div style={{ fontSize: vmin(6), fontWeight: 500, letterSpacing: "0.12em", color: muted, marginTop: vmin(3) }}>
              {settings.showSeconds && N(s)} {showAmPm && ampm}
            </div>
          )}
        </div>
      );

    case "float": {
      const cols = [text, accent, accent, text];
      const chars = [...hPadded, ...m];
      return (
        <div className="float-wrap" style={{ ...font, fontSize: vmin(30), fontWeight: 700, lineHeight: 0.95 }}>
          <i className="float-blob" style={{ background: text, left: "-20%", top: "-10%" }} />
          <i className="float-blob b2" style={{ background: accent, right: "-20%", bottom: "-10%" }} />
          {[0, 2].map((row) => (
            <div key={row} style={{ display: "flex", justifyContent: "center", gap: "0.08em" }}>
              {chars.slice(row, row + 2).map((c, i) => (
                <span
                  key={i}
                  className={settings.animate ? "float-digit" : undefined}
                  style={{ color: cols[row + i], animationDelay: `${-(row + i) * 1.7}s`, textShadow: `0 0 ${vmin(6)} ${cols[row + i]}66` }}
                >
                  {N(c)}
                </span>
              ))}
            </div>
          ))}
        </div>
      );
    }

    case "solar":
      return <Solar now={now} settings={settings} hStr={h} mStr={m} />;

    case "word":
      return <Words now={now} settings={settings} />;

    case "binary":
      return <Binary now={now} settings={settings} />;

    case "standard":
    default:
      return (
        <div style={{ ...font, color: text, fontSize: vmin(24), fontWeight: 500, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", lineHeight: 1, letterSpacing: "-0.02em" }}>
          {N(h)}
          <span style={{ color: accent, opacity: colonOn ? 1 : 0.3 }}>:</span>
          {N(m)}
          {(settings.showSeconds || showAmPm) && (
            <span style={{ display: "inline-flex", flexDirection: "column", fontSize: "0.24em", lineHeight: 1.15, marginLeft: "0.35em", verticalAlign: "baseline", letterSpacing: "0.02em" }}>
              {settings.showSeconds && <span style={{ color: accent }}>{s}</span>}
              {showAmPm && <span style={{ color: muted }}>{ampm}</span>}
            </span>
          )}
        </div>
      );
  }
}
