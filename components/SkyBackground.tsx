"use client";

import { useEffect, useRef } from "react";
import { altAz, nightFactor, skyColors, sunAltitude, toJD } from "@/lib/astro";
import { getStars } from "@/lib/stars";

interface Props {
  lat: number;
  lon: number;
  gradient: boolean;
  stars: boolean;
  bg: string;
}

/** Full-screen sky: gradient from the real sun altitude, plus a star map for the viewer's location. */
export default function SkyBackground({ lat, lon, gradient, stars, bg }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const date = new Date();
      const alt = sunAltitude(date, lat, lon);

      if (gradient) {
        const { top, bottom } = skyColors(alt);
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, top);
        g.addColorStop(1, bottom);
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = bg;
      }
      ctx.fillRect(0, 0, w, h);

      const vis = stars ? nightFactor(alt) : 0;
      if (vis <= 0.01) return;

      // Planisphere view: zenith at the centre, horizon at the edge, north up, east left.
      const jd = toJD(date);
      const R = Math.hypot(w, h) / 2 * 0.78;
      const cx = w / 2, cy = h / 2;
      for (const s of getStars()) {
        const { alt: a, az } = altAz(s.ra, s.dec, jd, lat, lon);
        if (a < 2) continue;
        const r = ((90 - a) / 90) * R;
        const x = cx - r * Math.sin((az * Math.PI) / 180);
        const y = cy - r * Math.cos((az * Math.PI) / 180);
        if (x < -4 || y < -4 || x > w + 4 || y > h + 4) continue;
        const extinction = Math.min(1, a / 12);
        const alpha = vis * extinction * Math.min(1, Math.max(0.12, 1.15 - s.mag * 0.17));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.mag < 2 ? "#fff6e0" : "#dfe8ff";
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.5, 1.9 - s.mag * 0.25), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    draw();
    const id = setInterval(draw, 1000);
    window.addEventListener("resize", draw);
    return () => {
      clearInterval(id);
      window.removeEventListener("resize", draw);
    };
  }, [lat, lon, gradient, stars, bg]);

  return <canvas ref={ref} className="nc-sky" aria-hidden />;
}
