/** [name, RA hours, Dec degrees, apparent magnitude] – approximate J2000 positions of bright stars. */
const BRIGHT: [string, number, number, number][] = [
  ["Sirius", 6.752, -16.72, -1.46], ["Canopus", 6.399, -52.7, -0.74], ["Rigil Kent", 14.66, -60.83, -0.27],
  ["Arcturus", 14.261, 19.18, -0.05], ["Vega", 18.616, 38.78, 0.03], ["Capella", 5.278, 46.0, 0.08],
  ["Rigel", 5.242, -8.2, 0.13], ["Procyon", 7.655, 5.22, 0.34], ["Achernar", 1.629, -57.24, 0.46],
  ["Betelgeuse", 5.92, 7.41, 0.5], ["Hadar", 14.064, -60.37, 0.61], ["Altair", 19.846, 8.87, 0.76],
  ["Acrux", 12.443, -63.1, 0.77], ["Aldebaran", 4.599, 16.51, 0.85], ["Antares", 16.49, -26.43, 1.06],
  ["Spica", 13.42, -11.16, 1.04], ["Pollux", 7.755, 28.03, 1.14], ["Fomalhaut", 22.961, -29.62, 1.16],
  ["Deneb", 20.69, 45.28, 1.25], ["Mimosa", 12.795, -59.69, 1.25], ["Regulus", 10.14, 11.97, 1.35],
  ["Adhara", 6.977, -28.97, 1.5], ["Castor", 7.577, 31.89, 1.58], ["Gacrux", 12.519, -57.11, 1.63],
  ["Shaula", 17.56, -37.1, 1.62], ["Bellatrix", 5.419, 6.35, 1.64], ["Elnath", 5.438, 28.6, 1.65],
  ["Miaplacidus", 9.22, -69.72, 1.67], ["Alnilam", 5.604, -1.2, 1.69], ["Alnair", 22.137, -46.96, 1.74],
  ["Alnitak", 5.679, -1.94, 1.74], ["Alioth", 12.9, 55.96, 1.77], ["Dubhe", 11.062, 61.75, 1.79],
  ["Mirfak", 3.405, 49.86, 1.8], ["Wezen", 7.14, -26.39, 1.83], ["Sargas", 17.622, -43.0, 1.87],
  ["Kaus Australis", 18.403, -34.38, 1.85], ["Avior", 8.375, -59.51, 1.86], ["Alkaid", 13.792, 49.31, 1.86],
  ["Menkalinan", 5.992, 44.95, 1.9], ["Atria", 16.811, -69.03, 1.91], ["Alhena", 6.629, 16.4, 1.93],
  ["Peacock", 20.427, -56.74, 1.94], ["Alsephina", 8.745, -54.71, 1.93], ["Mirzam", 6.378, -17.96, 1.98],
  ["Alphard", 9.46, -8.66, 1.98], ["Polaris", 2.53, 89.26, 1.98], ["Hamal", 2.12, 23.46, 2.0],
  ["Algieba", 10.333, 19.84, 2.01], ["Diphda", 0.726, -17.99, 2.04], ["Mizar", 13.399, 54.93, 2.04],
  ["Nunki", 18.921, -26.3, 2.05], ["Menkent", 14.111, -36.37, 2.06], ["Mirach", 1.162, 35.62, 2.05],
  ["Alpheratz", 0.14, 29.09, 2.06], ["Rasalhague", 17.582, 12.56, 2.07], ["Kochab", 14.845, 74.16, 2.08],
  ["Saiph", 5.796, -9.67, 2.06], ["Denebola", 11.818, 14.57, 2.14], ["Algol", 3.136, 40.96, 2.12],
  ["Tiaki", 22.71, -46.88, 2.1], ["Muhlifain", 12.692, -48.96, 2.17], ["Aspidiske", 9.285, -59.28, 2.21],
  ["Suhail", 9.133, -43.43, 2.21], ["Alphecca", 15.578, 26.71, 2.23], ["Mintaka", 5.533, -0.3, 2.23],
  ["Sadr", 20.37, 40.26, 2.23], ["Eltanin", 17.943, 51.49, 2.23], ["Schedar", 0.675, 56.54, 2.24],
  ["Naos", 8.06, -40.0, 2.25], ["Almach", 2.065, 42.33, 2.26], ["Caph", 0.153, 59.15, 2.27],
  ["Izar", 14.75, 27.07, 2.35], ["Dschubba", 16.0, -22.62, 2.29], ["Larawag", 16.836, -34.29, 2.29],
  ["Merak", 11.031, 56.38, 2.37], ["Enif", 21.736, 9.88, 2.39], ["Ankaa", 0.438, -42.3, 2.39],
  ["Phecda", 11.897, 53.69, 2.44], ["Sabik", 17.173, -15.72, 2.43], ["Scheat", 23.063, 28.08, 2.42],
  ["Alderamin", 21.31, 62.59, 2.45], ["Aludra", 7.402, -29.3, 2.45], ["Markab", 23.079, 15.2, 2.49],
  ["Menkar", 3.038, 4.09, 2.53], ["Graffias", 16.09, -19.8, 2.56], ["Zubeneschamali", 15.283, -9.38, 2.61],
  ["Megrez", 12.257, 57.03, 3.31], ["Arneb", 5.545, -17.82, 2.58], ["Tarazed", 19.771, 10.61, 2.72],
  ["Unukalhai", 15.738, 6.43, 2.63], ["Sheratan", 1.911, 20.81, 2.64], ["Nihal", 5.47, -20.76, 2.84],
];

export interface Star {
  ra: number; // radians
  dec: number; // radians
  mag: number;
}

const RAD = Math.PI / 180;

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let cache: Star[] | null = null;

/** Real bright stars plus a deterministic scatter of fainter ones (not real positions). */
export function getStars(): Star[] {
  if (cache) return cache;
  const stars: Star[] = BRIGHT.map(([, raH, dec, mag]) => ({ ra: raH * 15 * RAD, dec: dec * RAD, mag }));
  const rnd = mulberry32(20261018);
  for (let i = 0; i < 1800; i++) {
    stars.push({
      ra: rnd() * 2 * Math.PI,
      dec: Math.asin(2 * rnd() - 1),
      mag: 3.2 + Math.pow(rnd(), 0.6) * 3.3,
    });
  }
  return (cache = stars);
}
