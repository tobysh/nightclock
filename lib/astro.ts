/** Low-precision solar/stellar astronomy (good to ~1 minute / 0.1°), enough for a clock. */

const RAD = Math.PI / 180;
const J2000 = 2451545.0;
const norm = (x: number, m = 360) => ((x % m) + m) % m;

export const toJD = (d: Date) => d.getTime() / 86400000 + 2440587.5;
const fromJD = (jd: number) => new Date((jd - 2440587.5) * 86400000);

/** Greenwich mean sidereal time in degrees. */
const gmst = (jd: number) => norm(280.46061837 + 360.98564736629 * (jd - J2000));

function sunEquatorial(jd: number) {
  const d = jd - J2000;
  const g = norm(357.529 + 0.98560028 * d) * RAD;
  const L = (norm(280.459 + 0.98564736 * d) + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const e = (23.439 - 0.00000036 * d) * RAD;
  return { ra: Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec: Math.asin(Math.sin(e) * Math.sin(L)) };
}

/** Altitude and azimuth (degrees, azimuth clockwise from north) of an RA/Dec point. */
export function altAz(raRad: number, decRad: number, jd: number, lat: number, lon: number) {
  const H = (gmst(jd) + lon) * RAD - raRad;
  const phi = lat * RAD;
  const alt = Math.asin(Math.sin(phi) * Math.sin(decRad) + Math.cos(phi) * Math.cos(decRad) * Math.cos(H));
  const a = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(decRad) * Math.cos(phi));
  return { alt: alt / RAD, az: norm(a / RAD + 180) };
}

export function sunAltitude(date: Date, lat: number, lon: number) {
  const jd = toJD(date);
  const { ra, dec } = sunEquatorial(jd);
  return altAz(ra, dec, jd, lat, lon).alt;
}

interface SunEvent {
  t: number; // Julian date
  type: "rise" | "set";
}

function eventsForDay(n: number, lat: number, lon: number): SunEvent[] {
  const jStar = n + lon / 360;
  const M = norm(357.5291 + 0.98560028 * jStar) * RAD;
  const C = (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) * RAD;
  const lambda = M + C + Math.PI + 102.9372 * RAD;
  const transit = J2000 + jStar + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * lambda);
  const sinDec = Math.sin(lambda) * Math.sin(23.4397 * RAD);
  const cosDec = Math.cos(Math.asin(sinDec));
  const phi = lat * RAD;
  const cosW = (Math.sin(-0.833 * RAD) - Math.sin(phi) * sinDec) / (Math.cos(phi) * cosDec);
  if (Math.abs(cosW) > 1) return []; // polar day / night
  const w = Math.acos(cosW) / (2 * Math.PI);
  return [
    { t: transit - w, type: "rise" },
    { t: transit + w, type: "set" },
  ];
}

export interface SunInfo {
  altitude: number;
  isDay: boolean;
  /** 0..1 progress through the current day (sunrise→sunset) or night (sunset→sunrise). */
  frac: number;
  sunrise: Date | null;
  sunset: Date | null;
}

export function sunInfo(date: Date, lat: number, lon: number): SunInfo {
  const jd = toJD(date);
  const altitude = sunAltitude(date, lat, lon);
  const n0 = Math.round(jd - J2000);
  const events = [-2, -1, 0, 1, 2].flatMap((k) => eventsForDay(n0 + k, lat, lon)).sort((a, b) => a.t - b.t);
  const prev = [...events].reverse().find((e) => e.t <= jd);
  const next = events.find((e) => e.t > jd);

  let isDay = altitude > -0.833;
  let frac = 0;
  if (prev && next) {
    isDay = prev.type === "rise";
    frac = (jd - prev.t) / (next.t - prev.t);
  } else {
    // polar day/night: fall back to a plain 06:00–18:00 / 18:00–06:00 clock
    const h = date.getHours() + date.getMinutes() / 60;
    frac = Math.min(1, Math.max(0, isDay ? (h - 6) / 12 : ((h + 6) % 24) / 12));
  }

  const sameDay = (e: SunEvent) => fromJD(e.t).toDateString() === date.toDateString();
  const pick = (type: SunEvent["type"]) => {
    const e = events.find((x) => x.type === type && sameDay(x));
    return e ? fromJD(e.t) : null;
  };
  return { altitude, isDay, frac, sunrise: pick("rise"), sunset: pick("set") };
}

/* ---------- location ---------- */

const TZ_GUESS: Record<string, [number, number]> = {
  "Europe/London": [51.5, -0.12], "Europe/Dublin": [53.35, -6.26], "Europe/Paris": [48.86, 2.35],
  "Europe/Berlin": [52.52, 13.4], "Europe/Madrid": [40.42, -3.7], "Europe/Rome": [41.9, 12.5],
  "Europe/Amsterdam": [52.37, 4.9], "Europe/Stockholm": [59.33, 18.07], "Europe/Helsinki": [60.17, 24.94],
  "Europe/Athens": [37.98, 23.73], "Europe/Moscow": [55.75, 37.62], "Europe/Istanbul": [41.01, 28.98],
  "America/New_York": [40.71, -74.0], "America/Chicago": [41.88, -87.63], "America/Denver": [39.74, -104.99],
  "America/Los_Angeles": [34.05, -118.24], "America/Toronto": [43.65, -79.38], "America/Vancouver": [49.28, -123.12],
  "America/Mexico_City": [19.43, -99.13], "America/Sao_Paulo": [-23.55, -46.63], "America/Argentina/Buenos_Aires": [-34.6, -58.38],
  "Asia/Tokyo": [35.68, 139.69], "Asia/Seoul": [37.57, 126.98], "Asia/Shanghai": [31.23, 121.47],
  "Asia/Hong_Kong": [22.32, 114.17], "Asia/Singapore": [1.35, 103.82], "Asia/Kolkata": [28.61, 77.21],
  "Asia/Dubai": [25.2, 55.27], "Australia/Sydney": [-33.87, 151.21], "Australia/Melbourne": [-37.81, 144.96],
  "Australia/Perth": [-31.95, 115.86], "Pacific/Auckland": [-36.85, 174.76], "Africa/Johannesburg": [-26.2, 28.05],
  "Africa/Cairo": [30.04, 31.24], "Africa/Lagos": [6.52, 3.38],
};

export interface Location {
  lat: number;
  lon: number;
  /** true when guessed from the time zone rather than set by the user */
  estimated: boolean;
}

export function resolveLocation(lat: number | null, lon: number | null): Location {
  if (lat !== null && lon !== null) return { lat, lon, estimated: false };
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const hit = TZ_GUESS[tz];
  if (hit) return { lat: hit[0], lon: hit[1], estimated: true };
  // Unknown zone: longitude from the UTC offset, a mid-latitude guess.
  return { lat: 40, lon: -new Date().getTimezoneOffset() / 4, estimated: true };
}

/* ---------- sky colours ---------- */

type RGB = [number, number, number];
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;

// [sun altitude°, zenith colour, horizon colour]
const SKY: [number, RGB, RGB][] = [
  [-18, hex("#02040d"), hex("#070b1f")],
  [-12, hex("#0a1233"), hex("#1b2552")],
  [-6, hex("#1c2a5e"), hex("#8a5a8c")],
  [-1, hex("#34508f"), hex("#f08a5d")],
  [5, hex("#4a7ac4"), hex("#f7c58f")],
  [15, hex("#4a8ad8"), hex("#a9d3f0")],
  [40, hex("#2f78d0"), hex("#8cc6f0")],
];

const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as RGB;
const css = (c: RGB) => `rgb(${c[0]},${c[1]},${c[2]})`;

/** Zenith (top) and horizon (bottom) colours for a given sun altitude. */
export function skyColors(alt: number): { top: string; bottom: string } {
  if (alt <= SKY[0][0]) return { top: css(SKY[0][1]), bottom: css(SKY[0][2]) };
  if (alt >= SKY[SKY.length - 1][0]) return { top: css(SKY[SKY.length - 1][1]), bottom: css(SKY[SKY.length - 1][2]) };
  const i = SKY.findIndex((k) => k[0] > alt);
  const [a0, t0, b0] = SKY[i - 1];
  const [a1, t1, b1] = SKY[i];
  const t = (alt - a0) / (a1 - a0);
  return { top: css(mix(t0, t1, t)), bottom: css(mix(b0, b1, t)) };
}

/** 0 in daylight, 1 once it's properly dark. */
export const nightFactor = (alt: number) => Math.min(1, Math.max(0, (-alt - 3) / 12));
