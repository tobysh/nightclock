"use client";

import { useState } from "react";

/** One character that rolls (slide + blur) to its new value, like iOS StandBy. */
function RollChar({ ch, animate }: { ch: string; animate: boolean }) {
  const [s, setS] = useState<{ cur: string; prev: string | null; n: number }>({ cur: ch, prev: null, n: 0 });
  if (s.cur !== ch) setS({ cur: ch, prev: s.cur, n: s.n + 1 });
  if (!animate || s.prev === null) return <span>{ch}</span>;
  return (
    <span className="roll">
      <span key={s.n} className="roll-in">{s.cur}</span>
      <span key={`o${s.n}`} className="roll-out" aria-hidden>{s.prev}</span>
    </span>
  );
}

export function Num({ value, animate }: { value: string; animate: boolean }) {
  return (
    <>
      {[...value].map((c, i) => (
        <RollChar key={i} ch={c} animate={animate} />
      ))}
    </>
  );
}
