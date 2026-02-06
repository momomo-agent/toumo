import { useState, useRef, useEffect, useCallback } from 'react';
import './ColorPicker.css';

type ColorFormat = 'HEX' | 'RGB' | 'HSL';

interface ColorPickerProps {
  color: string;
  opacity: number;
  onChange: (color: string, opacity: number) => void;
  onClose: () => void;
}

// Preset colors (Figma-style palette)
const PRESET_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
  '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#9900FF', '#FF00FF', '#FF6666', '#FFB366',
  '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6FA8DC', '#8E7CC3', '#C27BA0', '#CC0000', '#E69138',
];

// Convert hex to HSV
function hexToHsv(hex: string): { h: number; s: number; v: number } {
  // Sanitize input
  if (!hex || hex.length < 7) return { h: 0, s: 0, v: 0 };
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

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  if (!hex || hex.length < 7) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

// Convert hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  if (!hex || hex.length < 7) return { h: 0, s: 0, l: 0 };
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Format color string based on format
function formatColor(hex: string, format: ColorFormat): string {
  switch (format) {
    case 'HEX': return hex.toUpperCase();
    case 'RGB': { const { r, g, b } = hexToRgb(hex); return `${r}, ${g}, ${b}`; }
    case 'HSL': { const { h, s, l } = hexToHsl(hex); return `${h}°, ${s}%, ${l}%`; }
  }
}

// Recent colors - stored in localStorage
const RECENT_COLORS_KEY = 'toumo-recent-colors';
const MAX_RECENT_COLORS = 10;

function getRecentColors(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function addRecentColor(color: string) {
  const recent = getRecentColors().filter(c => c.toUpperCase() !== color.toUpperCase());
  recent.unshift(color.toUpperCase());
  if (recent.length > MAX_RECENT_COLORS) recent.pop();
  localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(recent));
}

export function ColorPicker({ color, opacity, onChange, onClose }: ColorPickerProps) {
  const [hsv, setHsv] = useState(() => hexToHsv(color));
  const [hexInput, setHexInput] = useState(color.toUpperCase());
  const [localOpacity, setLocalOpacity] = useState(Math.round(opacity * 100));
  const [colorFormat, setColorFormat] = useState<ColorFormat>('HEX');
  const [recentColors, setRecentColors] = useState<string[]>(() => getRecentColors());
  const [eyeDropperSupported] = useState(() => 'EyeDropper' in window);
  const satValRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const opacityRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Sync external opacity changes
  useEffect(() => {
    setLocalOpacity(Math.round(opacity * 100));
  }, [opacity]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use setTimeout to avoid closing immediately on the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const currentColor = hsvToHex(hsv.h, hsv.s, hsv.v);

  // Save to recent colors when closing
  useEffect(() => {
    return () => {
      addRecentColor(hsvToHex(hsv.h, hsv.s, hsv.v));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // EyeDropper handler
  const handleEyeDropper = useCallback(async () => {
    if (!('EyeDropper' in window)) return;
    try {
      // @ts-expect-error EyeDropper API not yet in TS lib
      const dropper = new window.EyeDropper();
      const result = await dropper.open();
      const picked = result.sRGBHex as string;
      setHsv(hexToHsv(picked));
      setHexInput(picked.toUpperCase());
      onChange(picked, localOpacity / 100);
      addRecentColor(picked);
      setRecentColors(getRecentColors());
    } catch {
      // User cancelled
    }
  }, [localOpacity, onChange]);

  // Cycle color format
  const cycleFormat = useCallback(() => {
    setColorFormat(f => f === 'HEX' ? 'RGB' : f === 'RGB' ? 'HSL' : 'HEX');
  }, []);

  const handleSatValChange = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!satValRef.current) return;
    const rect = satValRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    const newHsv = { ...hsv, s: x * 100, v: (1 - y) * 100 };
    setHsv(newHsv);
    const newColor = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    setHexInput(newColor.toUpperCase());
    onChange(newColor, localOpacity / 100);
  }, [hsv, localOpacity, onChange]);

  const handleHueChange = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    
    const newHsv = { ...hsv, h: x * 360 };
    setHsv(newHsv);
    const newColor = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    setHexInput(newColor.toUpperCase());
    onChange(newColor, localOpacity / 100);
  }, [hsv, localOpacity, onChange]);

  const handleOpacitySliderChange = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!opacityRef.current) return;
    const rect = opacityRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newOpacity = Math.round(x * 100);
    setLocalOpacity(newOpacity);
    onChange(currentColor, newOpacity / 100);
  }, [currentColor, onChange]);

  const makeDraggable = (handler: (e: React.MouseEvent | MouseEvent) => void) => {
    return (e: React.MouseEvent) => {
      handler(e);
      const onMove = (ev: MouseEvent) => handler(ev);
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };
  };

  const handleHexChange = (value: string) => {
    setHexInput(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setHsv(hexToHsv(value));
      onChange(value, localOpacity / 100);
    }
  };

  const handleOpacityInputChange = (value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setLocalOpacity(clamped);
    onChange(currentColor, clamped / 100);
  };

  const handlePresetClick = (presetColor: string) => {
    setHsv(hexToHsv(presetColor));
    setHexInput(presetColor.toUpperCase());
    onChange(presetColor, localOpacity / 100);
  };

  return (
    <div className="figma-color-picker" ref={popupRef}>
      {/* Color preview + eyedropper */}
      <div className="figma-cp-preview-row">
        <div className="figma-cp-preview-swatch">
          <div className="figma-cp-checkerboard" />
          <div
            className="figma-cp-preview-color"
            style={{ backgroundColor: currentColor, opacity: localOpacity / 100 }}
          />
        </div>
        <div className="figma-cp-preview-hex">{formatColor(currentColor, colorFormat)}</div>
        {eyeDropperSupported && (
          <button
            className="figma-cp-eyedropper"
            onClick={handleEyeDropper}
            title="Pick color from screen"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.354 3.354l-.708-.708-2.293 2.293-1.06-1.06 2.293-2.293-.708-.708a.5.5 0 00-.707 0L8.293 2.957 7.586 2.25a.5.5 0 00-.707 0L5.172 3.957a.5.5 0 000 .707l.543.543L2.04 8.882a2 2 0 00-.476.883l-.61 2.438a.5.5 0 00.606.607l2.438-.61a2 2 0 00.883-.476l3.675-3.675.543.543a.5.5 0 00.707 0l1.707-1.707a.5.5 0 000-.707l-.707-.707 2.293-2.293a.5.5 0 000-.707z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Saturation/Value picker */}
      <div
        ref={satValRef}
        className="figma-cp-satval"
        style={{ backgroundColor: hsvToHex(hsv.h, 100, 100) }}
        onMouseDown={makeDraggable(handleSatValChange)}
      >
        <div className="figma-cp-satval-white" />
        <div className="figma-cp-satval-black" />
        <div
          className="figma-cp-cursor"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
            backgroundColor: currentColor,
          }}
        />
      </div>

      {/* Sliders row */}
      <div className="figma-cp-sliders">
        {/* Hue slider */}
        <div
          ref={hueRef}
          className="figma-cp-hue"
          onMouseDown={makeDraggable(handleHueChange)}
        >
          <div
            className="figma-cp-hue-cursor"
            style={{ left: `${(hsv.h / 360) * 100}%` }}
          />
        </div>

        {/* Opacity slider */}
        <div
          ref={opacityRef}
          className="figma-cp-opacity-slider"
          onMouseDown={makeDraggable(handleOpacitySliderChange)}
        >
          <div className="figma-cp-checkerboard" />
          <div
            className="figma-cp-opacity-gradient"
            style={{
              background: `linear-gradient(to right, transparent, ${currentColor})`,
            }}
          />
          <div
            className="figma-cp-opacity-cursor"
            style={{ left: `${localOpacity}%` }}
          />
        </div>
      </div>

      {/* Inputs with format switcher */}
      <div className="figma-cp-inputs">
        <div className="figma-cp-input-group">
          <button className="figma-cp-format-btn" onClick={cycleFormat} title="Switch format">
            {colorFormat}
          </button>
          <input
            type="text"
            className="figma-cp-hex-input"
            value={colorFormat === 'HEX' ? hexInput : formatColor(currentColor, colorFormat)}
            onChange={(e) => colorFormat === 'HEX' && handleHexChange(e.target.value)}
            readOnly={colorFormat !== 'HEX'}
            onFocus={(e) => e.target.select()}
          />
        </div>
        <div className="figma-cp-input-group">
          <span className="figma-cp-label">A</span>
          <input
            type="number"
            className="figma-cp-opacity-input"
            value={localOpacity}
            min={0}
            max={100}
            onChange={(e) => handleOpacityInputChange(parseInt(e.target.value) || 0)}
            onFocus={(e) => e.target.select()}
          />
          <span className="figma-cp-unit">%</span>
        </div>
      </div>

      {/* Preset colors */}
      <div className="figma-cp-presets">
        {PRESET_COLORS.map((c, i) => (
          <button
            key={i}
            className={`figma-cp-preset ${c.toUpperCase() === currentColor.toUpperCase() ? 'active' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => handlePresetClick(c)}
            title={c}
          />
        ))}
      </div>

      {/* Recent colors */}
      {recentColors.length > 0 && (
        <div className="figma-cp-recent">
          <span className="figma-cp-recent-label">Recent</span>
          <div className="figma-cp-recent-colors">
            {recentColors.map((c, i) => (
              <button
                key={i}
                className={`figma-cp-preset ${c.toUpperCase() === currentColor.toUpperCase() ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => handlePresetClick(c)}
                title={c}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
