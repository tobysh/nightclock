import { useEffect, useState } from "react";

/** Current time, or null until mounted (avoids SSR hydration mismatch). */
export function useNow(smooth: boolean): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (smooth) {
      let raf = 0;
      const loop = () => {
        setNow(new Date());
        raf = requestAnimationFrame(loop);
      };
      loop();
      return () => cancelAnimationFrame(raf);
    }
    const tick = () =>
      setNow((prev) => {
        const d = new Date();
        return prev && Math.floor(prev.getTime() / 1000) === Math.floor(d.getTime() / 1000) ? prev : d;
      });
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [smooth]);

  return now;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function timeParts(now: Date, hour12: boolean) {
  const h24 = now.getHours();
  const h = hour12 ? h24 % 12 || 12 : h24;
  return {
    h: hour12 ? String(h) : pad(h),
    hPadded: pad(h),
    m: pad(now.getMinutes()),
    s: pad(now.getSeconds()),
    ampm: h24 < 12 ? "AM" : "PM",
  };
}

export function formatDate(now: Date) {
  return now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}
