import { ANALOG_STYLES, CYCLE_INTERVALS, DIGITAL_STYLES, PRESETS, SOLAR_VARIANTS } from "./settings";

/**
 * Description of the controls the phone remote renders. The remote page is
 * plain HTML served by Rust, so it builds its UI from this JSON.
 * Keys use dots for nested fields ("palette.bg").
 */
const opts = (list: readonly { id: string; label: string }[]) => list.map(({ id, label }) => ({ id, label }));

export const REMOTE_SCHEMA = {
  sections: [
    {
      title: "Clock",
      controls: [
        { type: "seg", key: "mode", options: [{ id: "analog", label: "Analogue" }, { id: "digital", label: "Digital" }, { id: "both", label: "Both" }] },
        { type: "seg", key: "analogStyle", options: opts(ANALOG_STYLES), showIf: { key: "mode", in: ["analog", "both"] } },
        { type: "seg", key: "digitalStyle", options: opts(DIGITAL_STYLES), showIf: { key: "mode", in: ["digital", "both"] } },
        { type: "seg", key: "solarVariant", label: "Solar variant", options: opts(SOLAR_VARIANTS), showIf: { key: "digitalStyle", in: ["solar"] } },
        { type: "toggle", key: "solarDateBelow", label: "Date below the time", showIf: { key: "digitalStyle", in: ["solar"] } },
      ],
    },
    {
      title: "Auto-cycle",
      controls: [
        { type: "toggle", key: "cycle", label: "Cycle through styles" },
        { type: "seg", key: "cycleEvery", label: "Every", numeric: true, options: opts(CYCLE_INTERVALS), showIf: { key: "cycle", in: [true] } },
        { type: "seg", key: "cycleScope", options: [{ id: "current", label: "Current type" }, { id: "mixed", label: "Analogue + digital" }], showIf: { key: "cycle", in: [true] } },
      ],
    },
    {
      title: "Colours",
      controls: [
        { type: "presets", options: PRESETS.map((p) => ({ id: p.id, label: p.label, palette: p.palette })) },
        { type: "color", key: "palette.bg", label: "Background" },
        { type: "color", key: "palette.face", label: "Clock face / cards" },
        { type: "color", key: "palette.text", label: "Digits & hands" },
        { type: "color", key: "palette.accent", label: "Accent" },
        { type: "color", key: "palette.muted", label: "Secondary" },
      ],
    },
    {
      title: "Sky",
      controls: [
        { type: "toggle", key: "skyBackground", label: "Sky gradient background" },
        { type: "toggle", key: "stars", label: "Stars at night" },
      ],
    },
    {
      title: "Display",
      controls: [
        { type: "range", key: "brightness", label: "Brightness", min: 0.03, max: 1, step: 0.01, percent: true },
        { type: "range", key: "scale", label: "Size", min: 0.4, max: 1.4, step: 0.05, percent: true },
      ],
    },
    {
      title: "Night mode",
      controls: [{ type: "seg", key: "nightMode", options: [{ id: "off", label: "Off" }, { id: "auto", label: "Scheduled" }, { id: "always", label: "Always" }] }],
    },
    {
      title: "Options",
      controls: [
        { type: "toggle", key: "hour12", label: "12-hour time" },
        { type: "toggle", key: "showSeconds", label: "Show seconds" },
        { type: "toggle", key: "showDate", label: "Show date" },
        { type: "toggle", key: "animate", label: "Animations" },
        { type: "toggle", key: "smooth", label: "Smooth sweeping hands" },
        { type: "toggle", key: "showMedia", label: "Show now playing" },
      ],
    },
  ],
};
