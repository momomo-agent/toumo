import { useState, useRef, useEffect } from 'react';
import './ColorPicker.css';

interface ColorPickerProps {
  color: string;
  opacity: number;
  onChange: (color: string, opacity: number) => void;
  onClose: () => void;
}

// Convert hex to HSV
function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, v: v * 100 };
}

// Convert HSV to hex
function hsvToHex(h: number, s: number, v: number): string {
  h = h / 360;
  s = s / 100;
  v = v / 100;

  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function ColorPicker({ color, opacity, onChange, onClose }: ColorPickerProps) {
  const [hsv, setHsv] = useState(() => hexToHsv(color));
  const [hexInput, setHexInput] = useState(color.toUpperCase());
  const satValRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSatValChange = (e: React.MouseEvent | MouseEvent) => {
    if (!satValRef.current) return;
    const rect = satValRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    const newHsv = { ...hsv, s: x * 100, v: (1 - y) * 100 };
    setHsv(newHsv);
    const newColor = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    setHexInput(newColor.toUpperCase());
    onChange(newColor, opacity);
  };

  const handleHueChange = (e: React.MouseEvent | MouseEvent) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    
    const newHsv = { ...hsv, h: x * 360 };
    setHsv(newHsv);
    const newColor = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    setHexInput(newColor.toUpperCase());
    onChange(newColor, opacity);
  };

  const handleHexChange = (value: string) => {
    setHexInput(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setHsv(hexToHsv(value));
      onChange(value, opacity);
    }
  };

  const handleOpacityChange = (value: number) => {
    onChange(color, value / 100);
  };

  return (
    <div className="figma-color-picker" ref={popupRef}>
      {/* Saturation/Value picker */}
      <div
        ref={satValRef}
        className="figma-cp-satval"
        style={{ backgroundColor: hsvToHex(hsv.h, 100, 100) }}
        onMouseDown={(e) => {
          handleSatValChange(e);
          const onMove = (ev: MouseEvent) => handleSatValChange(ev);
          const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
          };
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        }}
      >
        <div className="figma-cp-satval-white" />
        <div className="figma-cp-satval-black" />
        <div
          className="figma-cp-cursor"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
          }}
        />
      </div>

      {/* Hue slider */}
      <div
        ref={hueRef}
        className="figma-cp-hue"
        onMouseDown={(e) => {
          handleHueChange(e);
          const onMove = (ev: MouseEvent) => handleHueChange(ev);
          const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
          };
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        }}
      >
        <div
          className="figma-cp-hue-cursor"
          style={{ left: `${(hsv.h / 360) * 100}%` }}
        />
      </div>

      {/* Inputs */}
      <div className="figma-cp-inputs">
        <div className="figma-cp-input-group">
          <span className="figma-cp-label">Hex</span>
          <input
            type="text"
            className="figma-cp-hex-input"
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
          />
        </div>
        <div className="figma-cp-input-group">
          <span className="figma-cp-label">Opacity</span>
          <input
            type="number"
            className="figma-cp-opacity-input"
            value={Math.round(opacity * 100)}
            min={0}
            max={100}
            onChange={(e) => handleOpacityChange(parseInt(e.target.value) || 0)}
          />
          <span className="figma-cp-unit">%</span>
        </div>
      </div>
    </div>
  );
}
