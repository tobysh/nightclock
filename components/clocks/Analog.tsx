import type { ReactNode } from "react";
import type { Settings } from "@/lib/settings";

interface Props {
  now: Date;
  settings: Settings;
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Scalloped "cookie" dial like the Pixel clock widget. */
function cookiePath(radius: number, lobes: number, amplitude: number) {
  const steps = 240;
  const pts = range(steps).map((i) => {
    const t = (i / steps) * Math.PI * 2;
    const r = radius + amplitude * Math.cos(lobes * t);
    return `${(r * Math.sin(t)).toFixed(2)},${(-r * Math.cos(t)).toFixed(2)}`;
  });
  return `M${pts.join("L")}Z`;
}
const COOKIE = cookiePath(90, 12, 4);

interface HandProps {
  angle: number;
  length: number;
  width: number;
  tail?: number;
  color: string;
}

function Hand({ angle, length, width, tail = 0, color }: HandProps) {
  return (
    <line
      x1={0}
      y1={tail}
      x2={0}
      y2={-length}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      transform={`rotate(${angle})`}
    />
  );
}

/** Tapered hand polygon for the modern style. */
function TaperHand({ angle, length, base, tip, tail, color }: { angle: number; length: number; base: number; tip: number; tail: number; color: string }) {
  const d = `M${-base / 2},${tail} L${-tip / 2},${-length} L${tip / 2},${-length} L${base / 2},${tail} Z`;
  return <path d={d} fill={color} transform={`rotate(${angle})`} strokeLinejoin="round" stroke={color} strokeWidth={1} />;
}

export default function Analog({ now, settings }: Props) {
  const { palette: c, analogStyle: style, showSeconds, smooth } = settings;

  const ms = now.getMilliseconds();
  const sec = now.getSeconds() + (smooth ? ms / 1000 : 0);
  const min = now.getMinutes() + sec / 60;
  const hr = (now.getHours() % 12) + min / 60;
  // Ticking seconds hand: epoch seconds never wrap, so it always turns forward;
  // the easing overshoots slightly like a quartz movement.
  const epoch = Math.floor(now.getTime() / 1000);
  const easeOutBack = (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;
  const sA = smooth
    ? sec * 6
    : settings.animate
      ? (epoch - 1 + easeOutBack(Math.min(ms / 350, 1))) * 6
      : epoch * 6;
  const mA = min * 6;
  const hA = hr * 30;

  let face: ReactNode;
  let hands: ReactNode;

  switch (style) {
    case "pixel":
      face = <path d={COOKIE} fill={c.face} />;
      hands = (
        <>
          <Hand angle={hA} length={42} width={15} color={c.text} />
          <Hand angle={mA} length={64} width={11} color={c.text} />
          {showSeconds && <Hand angle={sA} length={72} width={3} tail={16} color={c.accent} />}
          <circle r={showSeconds ? 6 : 0} fill={c.accent} />
          <circle r={3.5} fill={c.face} />
        </>
      );
      break;

    case "standby":
      face = (
        <>
          <circle r={96} fill={c.face} />
          {range(12).map((i) => {
            const n = i === 0 ? 12 : i;
            const a = (i * 30 * Math.PI) / 180;
            return (
              <text
                key={i}
                x={Math.sin(a) * 76}
                y={-Math.cos(a) * 76}
                fill={c.text}
                fontSize={19}
                fontWeight={600}
                textAnchor="middle"
                dominantBaseline="central"
                style={{ fontFamily: "var(--font-outfit), sans-serif" }}
              >
                {n}
              </text>
            );
          })}
        </>
      );
      hands = (
        <>
          <Hand angle={hA} length={46} width={7} color={c.text} />
          <Hand angle={mA} length={72} width={5} color={c.text} />
          <circle r={7} fill={c.text} />
          {showSeconds && <Hand angle={sA} length={84} width={2} tail={20} color={c.accent} />}
          <circle r={4} fill={c.accent} />
          <circle r={1.6} fill={c.face} />
        </>
      );
      break;

    case "classic":
      face = (
        <>
          <circle r={96} fill={c.face} stroke={c.muted} strokeWidth={1.5} />
          {range(60).map((i) => (
            <line
              key={i}
              y1={i % 5 === 0 ? -84 : -88}
              y2={-92}
              stroke={i % 5 === 0 ? c.text : c.muted}
              strokeWidth={i % 5 === 0 ? 2.5 : 1}
              transform={`rotate(${i * 6})`}
            />
          ))}
          {range(12).map((i) => {
            const n = i + 1;
            const a = (n * 30 * Math.PI) / 180;
            return (
              <text
                key={n}
                x={Math.sin(a) * 68}
                y={-Math.cos(a) * 68}
                fill={c.text}
                fontSize={15}
                fontWeight={500}
                textAnchor="middle"
                dominantBaseline="central"
                style={{ fontFamily: "var(--font-outfit), sans-serif" }}
              >
                {n}
              </text>
            );
          })}
        </>
      );
      hands = (
        <>
          <Hand angle={hA} length={44} width={5.5} tail={8} color={c.text} />
          <Hand angle={mA} length={64} width={3.5} tail={10} color={c.text} />
          {showSeconds && <Hand angle={sA} length={78} width={1.6} tail={18} color={c.accent} />}
          <circle r={4.5} fill={c.accent} />
        </>
      );
      break;

    case "minimal":
      face = (
        <>
          <circle r={96} fill={c.face} />
          {[0, 90, 180, 270].map((a) => (
            <line key={a} y1={-82} y2={-90} stroke={c.muted} strokeWidth={3} strokeLinecap="round" transform={`rotate(${a})`} />
          ))}
        </>
      );
      hands = (
        <>
          <Hand angle={hA} length={46} width={4} color={c.text} />
          <Hand angle={mA} length={70} width={4} color={c.text} />
          {showSeconds && <Hand angle={sA} length={76} width={1.2} color={c.accent} />}
          <circle r={3} fill={c.bg} stroke={c.text} strokeWidth={1.5} />
        </>
      );
      break;

    case "modern":
      face = (
        <>
          <circle r={96} fill={c.face} />
          {range(12).map((i) => (
            <line
              key={i}
              y1={i % 3 === 0 ? -76 : -82}
              y2={-91}
              stroke={i === 0 ? c.accent : i % 3 === 0 ? c.text : c.muted}
              strokeWidth={i % 3 === 0 ? 4 : 2.2}
              transform={`rotate(${i * 30})`}
            />
          ))}
        </>
      );
      hands = (
        <>
          <TaperHand angle={hA} length={48} base={8} tip={4} tail={10} color={c.text} />
          <TaperHand angle={mA} length={74} base={6} tip={2.5} tail={12} color={c.text} />
          {showSeconds && <Hand angle={sA} length={80} width={1.4} tail={22} color={c.accent} />}
          <circle r={4.5} fill={c.accent} />
        </>
      );
      break;

    case "dots":
      face = (
        <>
          <circle r={96} fill={c.face} />
          {range(60).map((i) => {
            const a = (i * 6 * Math.PI) / 180;
            const big = i % 5 === 0;
            return <circle key={i} cx={Math.sin(a) * 86} cy={-Math.cos(a) * 86} r={big ? 3.2 : 1.2} fill={big ? c.text : c.muted} />;
          })}
        </>
      );
      hands = (
        <>
          <Hand angle={hA} length={44} width={4.5} color={c.text} />
          <Hand angle={mA} length={66} width={3.2} color={c.text} />
          {showSeconds && <circle cx={Math.sin((sA * Math.PI) / 180) * 86} cy={-Math.cos((sA * Math.PI) / 180) * 86} r={5} fill={c.accent} />}
          <circle r={4} fill={c.text} />
        </>
      );
      break;

    case "ring":
    default: {
      const circ = 2 * Math.PI * 90;
      face = (
        <>
          <circle r={96} fill={c.face} />
          <circle r={90} fill="none" stroke={c.muted} strokeOpacity={0.35} strokeWidth={4} />
          {showSeconds && (
            <circle
              r={90}
              fill="none"
              stroke={c.accent}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={`${(sec / 60) * circ} ${circ}`}
              transform="rotate(-90)"
            />
          )}
          {range(12).map((i) => {
            const a = (i * 30 * Math.PI) / 180;
            return <circle key={i} cx={Math.sin(a) * 74} cy={-Math.cos(a) * 74} r={i % 3 === 0 ? 2.6 : 1.4} fill={i % 3 === 0 ? c.text : c.muted} />;
          })}
        </>
      );
      hands = (
        <>
          <Hand angle={hA} length={38} width={8} color={c.text} />
          <Hand angle={mA} length={58} width={5.5} color={c.text} />
          <circle r={4.5} fill={c.bg} />
        </>
      );
    }
  }

  return (
    <svg
      viewBox="-100 -100 200 200"
      style={{ width: "calc(min(78vmin, 640px) * var(--scale))", height: "auto", aspectRatio: "1", overflow: "visible" }}
      role="img"
      aria-label="Analogue clock"
    >
      {face}
      {hands}
    </svg>
  );
}
