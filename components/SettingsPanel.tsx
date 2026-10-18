"use client";

import { useEffect, useState, type ReactNode } from "react";
import QRCode from "qrcode";
import {
  ANALOG_STYLES,
  CYCLE_INTERVALS,
  SOLAR_VARIANTS,
  DEFAULT_SETTINGS,
  DIGITAL_STYLES,
  PRESETS,
  type Palette,
  type Settings,
} from "@/lib/settings";
import { useCanFullscreen, useIsTauri } from "@/lib/media";

interface Props {
  open: boolean;
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
  onFullscreen: () => void;
  remoteUrl: string | null;
  locationEstimated: boolean;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="sp-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: readonly { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="sp-seg">
      {options.map((o) => (
        <button key={o.id} type="button" className={o.id === value ? "on" : ""} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="sp-row">
      <span>{label}</span>
      <input type="checkbox" className="sp-switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function Slider({ label, value, min, max, step, format, onChange }: { label: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <label className="sp-slider">
      <span className="sp-row">
        <span>{label}</span>
        <output>{format(value)}</output>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function HourSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <select className="sp-select" value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {Array.from({ length: 24 }, (_, h) => (
        <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
      ))}
    </select>
  );
}

function CoordInput({ value, min, max, onChange }: { value: number | null; min: number; max: number; onChange: (v: number | null) => void }) {
  const [text, setText] = useState(value === null ? "" : String(value));
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    setText(value === null ? "" : String(value));
  }
  return (
    <input
      className="sp-input"
      inputMode="decimal"
      placeholder="auto"
      value={text}
      onChange={(e) => {
        const t = e.target.value;
        setText(t);
        if (t.trim() === "") {
          setSeen(null);
          onChange(null);
        } else {
          const n = Number(t);
          if (Number.isFinite(n) && n >= min && n <= max) {
            setSeen(n);
            onChange(n);
          }
        }
      }}
    />
  );
}

function QrCode({ text }: { text: string }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let cancelled = false;
    QRCode.toString(text, { type: "svg", margin: 0 }).then((s) => !cancelled && setSvg(s));
    return () => {
      cancelled = true;
    };
  }, [text]);
  return <div className="sp-qr" dangerouslySetInnerHTML={{ __html: svg }} />;
}

const COLOR_FIELDS: { key: keyof Palette; label: string }[] = [
  { key: "bg", label: "Background" },
  { key: "face", label: "Clock face / cards" },
  { key: "text", label: "Digits & hands" },
  { key: "accent", label: "Accent" },
  { key: "muted", label: "Secondary" },
];

export default function SettingsPanel({ open, settings, onChange, onClose, onFullscreen, remoteUrl, locationEstimated }: Props) {
  const inApp = useIsTauri();
  const canFullscreen = useCanFullscreen();
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const locate = () => {
    setGeoMsg("Locating…");
    if (!navigator.geolocation) return setGeoMsg("Location isn't available here — enter it manually.");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        onChange({ lat: Math.round(p.coords.latitude * 100) / 100, lon: Math.round(p.coords.longitude * 100) / 100 });
        setGeoMsg(null);
      },
      () => setGeoMsg("Couldn't get your location — enter it manually."),
      { timeout: 10000 },
    );
  };
  const setColor = (key: keyof Palette, value: string) =>
    onChange({ palette: { ...settings.palette, [key]: value }, presetId: "custom" });

  return (
    <aside className={`sp ${open ? "open" : ""}`} aria-hidden={!open} inert={!open}>
      <header>
        <h2>Settings</h2>
        <button type="button" className="sp-close" onClick={onClose} aria-label="Close settings">×</button>
      </header>

      <Section title="Clock type">
        <Segmented
          value={settings.mode}
          options={[{ id: "analog", label: "Analogue" }, { id: "digital", label: "Digital" }, { id: "both", label: "Both" }]}
          onChange={(mode) => onChange({ mode })}
        />
        {settings.mode !== "digital" && (
          <Segmented value={settings.analogStyle} options={ANALOG_STYLES} onChange={(analogStyle) => onChange({ analogStyle })} />
        )}
        {settings.mode !== "analog" && (
          <Segmented value={settings.digitalStyle} options={DIGITAL_STYLES} onChange={(digitalStyle) => onChange({ digitalStyle })} />
        )}
      </Section>

      <Section title="Auto-cycle styles">
        <Toggle label="Cycle through styles" checked={settings.cycle} onChange={(cycle) => onChange({ cycle })} />
        {settings.cycle && (
          <>
            <Segmented
              value={String(settings.cycleEvery)}
              options={CYCLE_INTERVALS}
              onChange={(v) => onChange({ cycleEvery: Number(v) })}
            />
            <Segmented
              value={settings.cycleScope}
              options={[{ id: "current", label: "Current type" }, { id: "mixed", label: "Analogue + digital" }]}
              onChange={(cycleScope) => onChange({ cycleScope })}
            />
          </>
        )}
      </Section>

      <Section title="Colours">
        <div className="sp-presets">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={settings.presetId === p.id ? "on" : ""}
              onClick={() => onChange({ palette: p.palette, presetId: p.id })}
              title={p.label}
            >
              <span style={{ background: p.palette.bg, borderColor: p.palette.muted }}>
                <i style={{ background: p.palette.text }} />
                <i style={{ background: p.palette.accent }} />
              </span>
              {p.label}
            </button>
          ))}
        </div>
        {COLOR_FIELDS.map(({ key, label }) => (
          <label key={key} className="sp-row sp-color">
            <span>{label}</span>
            <code>{settings.palette[key]}</code>
            <input type="color" value={settings.palette[key]} onChange={(e) => setColor(key, e.target.value)} />
          </label>
        ))}
      </Section>

      <Section title="Solar & sky">
        {settings.mode !== "analog" && settings.digitalStyle === "solar" && (
          <>
            <Segmented value={settings.solarVariant} options={SOLAR_VARIANTS} onChange={(solarVariant) => onChange({ solarVariant })} />
            <Toggle label="Date below the time (smaller)" checked={settings.solarDateBelow} onChange={(solarDateBelow) => onChange({ solarDateBelow })} />
          </>
        )}
        <Toggle label="Sky gradient background" checked={settings.skyBackground} onChange={(skyBackground) => onChange({ skyBackground })} />
        <Toggle label="Stars at night" checked={settings.stars} onChange={(stars) => onChange({ stars })} />
        <div className="sp-row"><span>Latitude</span><CoordInput value={settings.lat} min={-90} max={90} onChange={(lat) => onChange({ lat })} /></div>
        <div className="sp-row"><span>Longitude</span><CoordInput value={settings.lon} min={-180} max={180} onChange={(lon) => onChange({ lon })} /></div>
        <button type="button" className="sp-btn" onClick={locate}>Use my location</button>
        <p className="sp-hint" style={{ margin: 0 }}>
          {geoMsg ?? (locationEstimated ? "Location is a rough guess from your time zone. Set it for accurate sunrise, sunset and stars." : "Sun and star positions use this location.")}
        </p>
      </Section>

      <Section title="Display">
        <Slider label="Brightness" value={settings.brightness} min={0.03} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(brightness) => onChange({ brightness })} />
        <Slider label="Size" value={settings.scale} min={0.4} max={1.4} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(scale) => onChange({ scale })} />
      </Section>

      <Section title="Night mode">
        <Segmented
          value={settings.nightMode}
          options={[{ id: "off", label: "Off" }, { id: "auto", label: "Scheduled" }, { id: "always", label: "Always" }]}
          onChange={(nightMode) => onChange({ nightMode })}
        />
        {settings.nightMode === "auto" && (
          <div className="sp-row">
            <span>From</span>
            <HourSelect value={settings.nightStart} onChange={(nightStart) => onChange({ nightStart })} />
            <span>to</span>
            <HourSelect value={settings.nightEnd} onChange={(nightEnd) => onChange({ nightEnd })} />
          </div>
        )}
        <p className="sp-hint" style={{ margin: 0 }}>Turns everything red and dims it, like iPhone StandBy.</p>
      </Section>

      <Section title="Options">
        <Toggle label="Animations (digit roll, ticking hand)" checked={settings.animate} onChange={(animate) => onChange({ animate })} />
        <Toggle label="12-hour time" checked={settings.hour12} onChange={(hour12) => onChange({ hour12 })} />
        <Toggle label="Show seconds" checked={settings.showSeconds} onChange={(showSeconds) => onChange({ showSeconds })} />
        <Toggle label="Show date" checked={settings.showDate} onChange={(showDate) => onChange({ showDate })} />
        {inApp && <Toggle label="Show now playing" checked={settings.showMedia} onChange={(showMedia) => onChange({ showMedia })} />}
        {inApp && <Toggle label="Media controls" checked={settings.mediaControls} onChange={(mediaControls) => onChange({ mediaControls })} />}
        <Toggle label="Smooth sweeping hands" checked={settings.smooth} onChange={(smooth) => onChange({ smooth })} />
        <Toggle label="Burn-in drift (nudge each minute)" checked={settings.drift} onChange={(drift) => onChange({ drift })} />
        <Toggle label="Keep screen awake" checked={settings.wakeLock} onChange={(wakeLock) => onChange({ wakeLock })} />
      </Section>

      {inApp && (
        <Section title="Phone remote">
          <Toggle label="Control from my phone" checked={settings.remote} onChange={(remote) => onChange({ remote })} />
          {settings.remote && remoteUrl && (
            <>
              <QrCode text={remoteUrl} />
              <div className="sp-url">{remoteUrl}</div>
              <p className="sp-hint" style={{ margin: 0 }}>Scan with your phone (same Wi-Fi). Anyone with this link can control the clock, so keep it private.</p>
            </>
          )}
        </Section>
      )}

      <div className="sp-actions">
        {canFullscreen && <button type="button" onClick={onFullscreen}>Fullscreen</button>}
        <button type="button" onClick={() => onChange({ ...DEFAULT_SETTINGS })}>Reset all</button>
      </div>
      <p className="sp-hint">Shortcuts: <kbd>S</kbd> settings · <kbd>F</kbd> fullscreen · <kbd>Esc</kbd> close</p>
    </aside>
  );
}
