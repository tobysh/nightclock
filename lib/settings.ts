export type Mode = "analog" | "digital" | "both";

export const ANALOG_STYLES = [
  { id: "pixel", label: "Pixel" },
  { id: "classic", label: "Classic" },
  { id: "minimal", label: "Minimal" },
  { id: "modern", label: "Modern" },
  { id: "dots", label: "Dots" },
  { id: "ring", label: "Ring" },
  { id: "standby", label: "StandBy" },
] as const;

export const DIGITAL_STYLES = [
  { id: "standard", label: "Standard" },
  { id: "stacked", label: "Pixel stacked" },
  { id: "segment", label: "7-segment" },
  { id: "flip", label: "Flip cards" },
  { id: "neon", label: "Neon" },
  { id: "thin", label: "Ultra thin" },
  { id: "word", label: "Words" },
  { id: "binary", label: "Binary" },
  { id: "bold", label: "StandBy bold" },
  { id: "float", label: "Float" },
  { id: "solar", label: "Solar" },
] as const;

export const SOLAR_VARIANTS = [
  { id: "arc", label: "Arc" },
  { id: "horizon", label: "Horizon" },
  { id: "bar", label: "Day bar" },
] as const;
export type SolarVariant = (typeof SOLAR_VARIANTS)[number]["id"];

export const CYCLE_INTERVALS = [
  { id: "10", label: "10 s" },
  { id: "30", label: "30 s" },
  { id: "60", label: "1 min" },
  { id: "300", label: "5 min" },
  { id: "900", label: "15 min" },
  { id: "3600", label: "1 hr" },
] as const;

export type AnalogStyle = (typeof ANALOG_STYLES)[number]["id"];
export type DigitalStyle = (typeof DIGITAL_STYLES)[number]["id"];

export interface Palette {
  bg: string;
  face: string;
  text: string;
  accent: string;
  muted: string;
}

export interface Settings {
  mode: Mode;
  analogStyle: AnalogStyle;
  digitalStyle: DigitalStyle;
  hour12: boolean;
  showSeconds: boolean;
  showDate: boolean;
  animate: boolean;
  nightMode: "off" | "auto" | "always";
  nightStart: number;
  nightEnd: number;
  solarVariant: SolarVariant;
  solarDateBelow: boolean;
  skyBackground: boolean;
  stars: boolean;
  lat: number | null;
  lon: number | null;
  cycle: boolean;
  cycleEvery: number;
  cycleScope: "current" | "mixed";
  remote: boolean;
  showMedia: boolean;
  mediaControls: boolean;
  smooth: boolean;
  scale: number;
  brightness: number;
  drift: boolean;
  wakeLock: boolean;
  presetId: string;
  palette: Palette;
}

export interface Preset {
  id: string;
  label: string;
  palette: Palette;
}

export const PRESETS: Preset[] = [
  { id: "ember", label: "Ember", palette: { bg: "#000000", face: "#1a0505", text: "#ff3b30", accent: "#ff8a65", muted: "#6b1a14" } },
  { id: "amber", label: "Amber", palette: { bg: "#000000", face: "#1a1000", text: "#ffb000", accent: "#ffd966", muted: "#6b4a00" } },
  { id: "pixel", label: "Pixel", palette: { bg: "#0b0d12", face: "#1f2a44", text: "#d3e3fd", accent: "#8ab4f8", muted: "#5b6b8c" } },
  { id: "forest", label: "Forest", palette: { bg: "#000000", face: "#07140a", text: "#7dff9a", accent: "#c6ff7d", muted: "#256b35" } },
  { id: "violet", label: "Violet", palette: { bg: "#05000d", face: "#170a2e", text: "#c9a7ff", accent: "#ff7ad9", muted: "#4d3a7a" } },
  { id: "ocean", label: "Ocean", palette: { bg: "#00060d", face: "#05202e", text: "#5ce1e6", accent: "#38b6ff", muted: "#1a5566" } },
  { id: "sunset", label: "Sunset", palette: { bg: "#0d0408", face: "#2a0f1c", text: "#ffb59a", accent: "#ff5c8a", muted: "#7a3a4d" } },
  { id: "mono", label: "Mono", palette: { bg: "#000000", face: "#141414", text: "#e8e8e8", accent: "#ffffff", muted: "#555555" } },
  { id: "paper", label: "Paper", palette: { bg: "#f4efe6", face: "#ffffff", text: "#1c1c1c", accent: "#e8412c", muted: "#a8a095" } },
];

/** Red-only palette, like iOS StandBy night mode. */
export const NIGHT_PALETTE: Palette = { bg: "#000000", face: "#140404", text: "#ff3b30", accent: "#ff6b5e", muted: "#6b1a14" };

export function isNight(s: Settings, hour: number) {
  if (s.nightMode === "always") return true;
  if (s.nightMode === "off") return false;
  return s.nightStart > s.nightEnd ? hour >= s.nightStart || hour < s.nightEnd : hour >= s.nightStart && hour < s.nightEnd;
}

export const DEFAULT_SETTINGS: Settings = {
  mode: "analog",
  analogStyle: "pixel",
  digitalStyle: "standard",
  hour12: true,
  showSeconds: true,
  showDate: true,
  animate: true,
  nightMode: "off",
  nightStart: 22,
  nightEnd: 7,
  solarVariant: "arc",
  solarDateBelow: true,
  skyBackground: false,
  stars: false,
  lat: null,
  lon: null,
  cycle: false,
  cycleEvery: 60,
  cycleScope: "current",
  remote: false,
  showMedia: true,
  mediaControls: true,
  smooth: true,
  scale: 1,
  brightness: 0.6,
  drift: true,
  wakeLock: false,
  presetId: "pixel",
  palette: PRESETS[2].palette,
};

const STORAGE_KEY = "nightclock:settings:v1";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      palette: { ...DEFAULT_SETTINGS.palette, ...parsed.palette },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // storage unavailable (private mode, quota) – settings just won't persist
  }
}
