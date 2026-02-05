import { useState, useRef, useEffect } from "react";

type ColorPickerProps = {
  color: string;
  onChange: (color: string) => void;
  label?: string;
};

// Convert hex to HSL
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

// Convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hsl, setHsl] = useState<[number, number, number]>(() => hexToHsl(color));
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHsl(hexToHsl(color));
  }, [color]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const updateColor = (h: number, s: number, l: number) => {
    setHsl([h, s, l]);
    onChange(hslToHex(h, s, l));
  };

  return (
    <div className="color-picker-wrapper" ref={pickerRef}>
      {label && <span className="color-label">{label}</span>}
      <button
        className="color-swatch"
        style={{ backgroundColor: color }}
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <div className="color-picker-popup">
          <div className="color-picker-saturation"
            style={{ background: `linear-gradient(to right, #fff, hsl(${hsl[0]}, 100%, 50%))` }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const s = Math.round(((e.clientX - rect.left) / rect.width) * 100);
              const l = Math.round(100 - ((e.clientY - rect.top) / rect.height) * 50);
              updateColor(hsl[0], s, l);
            }}
          >
            <div className="saturation-overlay" />
            <div className="color-cursor" style={{
              left: `${hsl[1]}%`,
              top: `${(100 - hsl[2]) * 2}%`
            }} />
          </div>
          <input
            type="range"
            className="hue-slider"
            min="0" max="360"
            value={hsl[0]}
            onChange={(e) => updateColor(Number(e.target.value), hsl[1], hsl[2])}
          />
          <input
            type="text"
            className="hex-input"
            value={color}
            onChange={(e) => {
              if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                onChange(e.target.value);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
