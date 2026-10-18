import { ANALOG_STYLES, DIGITAL_STYLES, type Settings } from "./settings";

/**
 * Picks the style to show right now when auto-cycling. Purely a function of the
 * wall clock, so every viewer (and a reload) lands on the same style.
 */
export function applyCycle(settings: Settings, nowMs: number): Settings {
  if (!settings.cycle) return settings;
  const step = Math.floor(nowMs / 1000 / settings.cycleEvery);

  if (settings.cycleScope === "mixed") {
    const total = ANALOG_STYLES.length + DIGITAL_STYLES.length;
    const i = step % total;
    return i < ANALOG_STYLES.length
      ? { ...settings, mode: "analog", analogStyle: ANALOG_STYLES[i].id }
      : { ...settings, mode: "digital", digitalStyle: DIGITAL_STYLES[i - ANALOG_STYLES.length].id };
  }

  return {
    ...settings,
    analogStyle: ANALOG_STYLES[step % ANALOG_STYLES.length].id,
    digitalStyle: DIGITAL_STYLES[step % DIGITAL_STYLES.length].id,
  };
}
