import { useState, useRef, useCallback } from 'react';
import './GradientEditor.css';

interface GradientStop {
  color: string;
  position: number;
}

interface GradientEditorProps {
  gradientType: 'none' | 'linear' | 'radial';
  gradientAngle: number;
  gradientStops: GradientStop[];
  gradientCenterX: number;
  gradientCenterY: number;
  onChange: (updates: {
    gradientType?: 'none' | 'linear' | 'radial';
    gradientAngle?: number;
    gradientStops?: GradientStop[];
    gradientCenterX?: number;
    gradientCenterY?: number;
  }) => void;
}

const DEFAULT_STOPS: GradientStop[] = [
  { color: '#000000', position: 0 },
  { color: '#ffffff', position: 100 },
];

// --- AngleDial: draggable circular dial for linear gradient angle ---
function AngleDial({ angle, onChange }: { angle: number; onChange: (angle: number) => void }) {
  const dialRef = useRef<HTMLDivElement>(null);

  const calcAngle = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!dialRef.current) return angle;
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rad = Math.atan2(e.clientY - cy, e.clientX - cx);
    let deg = Math.round(rad * (180 / Math.PI) + 90);
    if (deg < 0) deg += 360;
    // Snap to 15° when holding Shift
    if ((e as MouseEvent).shiftKey) {
      deg = Math.round(deg / 15) * 15;
    }
    return deg % 360;
  }, [angle]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onChange(calcAngle(e));
    const onMove = (ev: MouseEvent) => onChange(calcAngle(ev));
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [calcAngle, onChange]);

  // Position of the indicator dot on the dial edge
  const rad = (angle - 90) * (Math.PI / 180);
  const dotX = 50 + Math.cos(rad) * 38;
  const dotY = 50 + Math.sin(rad) * 38;
  const lineDeg = angle;

  return (
    <div className="gradient-angle-section">
      <div className="gradient-angle-dial" ref={dialRef} onMouseDown={handleMouseDown}>
        <div className="gradient-angle-center" />
        <div
          className="gradient-angle-line"
          style={{ transform: `rotate(${lineDeg}deg)` }}
        />
        <div
          className="gradient-angle-dot"
          style={{ left: `${dotX}%`, top: `${dotY}%` }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          type="number"
          className="gradient-angle-input"
          value={angle}
          min={0}
          max={360}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        />
        <span style={{ color: '#888', fontSize: 11 }}>°</span>
      </div>
    </div>
  );
}

// --- CenterPad: draggable XY pad for radial gradient center ---
function CenterPad({
  centerX,
  centerY,
  onChange,
}: {
  centerX: number;
  centerY: number;
  onChange: (updates: { gradientCenterX?: number; gradientCenterY?: number }) => void;
}) {
  const padRef = useRef<HTMLDivElement>(null);

  const calcCenter = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!padRef.current) return { x: centerX, y: centerY };
    const rect = padRef.current.getBoundingClientRect();
    const x = Math.round(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)));
    return { x, y };
  }, [centerX, centerY]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const { x, y } = calcCenter(e);
    onChange({ gradientCenterX: x, gradientCenterY: y });

    const onMove = (ev: MouseEvent) => {
      const pos = calcCenter(ev);
      onChange({ gradientCenterX: pos.x, gradientCenterY: pos.y });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [calcCenter, onChange]);

  return (
    <div className="gradient-center-section">
      <div className="gradient-center-pad" ref={padRef} onMouseDown={handleMouseDown}>
        <div className="gradient-center-crosshair-h" style={{ top: `${centerY}%` }} />
        <div className="gradient-center-crosshair-v" style={{ left: `${centerX}%` }} />
        <div
          className="gradient-center-dot"
          style={{ left: `${centerX}%`, top: `${centerY}%` }}
        />
      </div>
      <div className="gradient-center-inputs">
        <div className="gradient-center-input-row">
          <span className="gradient-center-label">X</span>
          <input
            type="number"
            className="gradient-center-input"
            value={centerX}
            min={0}
            max={100}
            onChange={(e) => onChange({ gradientCenterX: parseInt(e.target.value) || 0 })}
          />
          <span style={{ color: '#666', fontSize: 10 }}>%</span>
        </div>
        <div className="gradient-center-input-row">
          <span className="gradient-center-label">Y</span>
          <input
            type="number"
            className="gradient-center-input"
            value={centerY}
            min={0}
            max={100}
            onChange={(e) => onChange({ gradientCenterY: parseInt(e.target.value) || 0 })}
          />
          <span style={{ color: '#666', fontSize: 10 }}>%</span>
        </div>
      </div>
    </div>
  );
}

// --- StopsEditor: draggable color stop bar with add/delete ---
function StopsEditor({
  stops,
  selectedIndex,
  onSelectStop,
  showPicker: _showPicker,
  onTogglePicker: _onTogglePicker,
  gradientType: _gradientType,
  gradientAngle: _gradientAngle,
  onChange,
}: {
  stops: GradientStop[];
  selectedIndex: number;
  onSelectStop: (i: number) => void;
  showPicker: boolean;
  onTogglePicker: (v: boolean) => void;
  gradientType: string;
  gradientAngle: number;
  onChange: GradientEditorProps['onChange'];
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const dragIndexRef = useRef<number | null>(null);

  // Build bar gradient
  const sortedStops = [...stops].sort((a, b) => a.position - b.position);
  const barGradient = `linear-gradient(to right, ${sortedStops.map(s => `${s.color} ${s.position}%`).join(', ')})`;

  const updateStop = useCallback((index: number, updates: Partial<GradientStop>) => {
    const newStops = stops.map((s, i) => i === index ? { ...s, ...updates } : s);
    onChange({ gradientStops: newStops });
  }, [stops, onChange]);

  const deleteStop = useCallback((index: number) => {
    if (stops.length <= 2) return; // minimum 2 stops
    const newStops = stops.filter((_, i) => i !== index);
    onChange({ gradientStops: newStops });
    if (selectedIndex >= newStops.length) onSelectStop(newStops.length - 1);
  }, [stops, selectedIndex, onSelectStop, onChange]);

  // Add stop by clicking on the bar
  const handleBarClick = useCallback((e: React.MouseEvent) => {
    if (!barRef.current || dragIndexRef.current !== null) return;
    const rect = barRef.current.getBoundingClientRect();
    const pos = Math.round(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));

    // Interpolate color at this position
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    let color = sorted[0].color;
    for (let i = 0; i < sorted.length - 1; i++) {
      if (pos >= sorted[i].position && pos <= sorted[i + 1].position) {
        // Simple: pick the nearest stop's color
        const mid = (sorted[i].position + sorted[i + 1].position) / 2;
        color = pos < mid ? sorted[i].color : sorted[i + 1].color;
        break;
      }
    }

    const newStops = [...stops, { color, position: pos }];
    onChange({ gradientStops: newStops });
    onSelectStop(newStops.length - 1);
  }, [stops, onChange, onSelectStop]);

  // Drag a stop handle
  const handleStopMouseDown = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectStop(index);
    dragIndexRef.current = index;

    const onMove = (ev: MouseEvent) => {
      if (!barRef.current || dragIndexRef.current === null) return;
      const rect = barRef.current.getBoundingClientRect();
      const pos = Math.round(Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100)));
      updateStop(dragIndexRef.current, { position: pos });
    };
    const onUp = () => {
      dragIndexRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [onSelectStop, updateStop]);

  const selectedStop = stops[selectedIndex];

  return (
    <div className="gradient-stops-section">
      {/* Stops bar */}
      <div className="gradient-stops-bar" ref={barRef} onClick={handleBarClick}>
        <div className="gradient-stops-bar-inner" style={{ background: barGradient }} />
        {stops.map((stop, i) => (
          <div
            key={i}
            className={`gradient-stop-handle ${i === selectedIndex ? 'selected' : ''}`}
            style={{ left: `${stop.position}%` }}
            onMouseDown={(e) => handleStopMouseDown(e, i)}
          >
            <div className="gradient-stop-arrow" />
            <div className="gradient-stop-swatch" style={{ backgroundColor: stop.color }} />
          </div>
        ))}
      </div>

      {/* Selected stop editor */}
      {selectedStop && (
        <div className="gradient-stop-editor">
          <div
            className="gradient-stop-color-swatch"
            style={{ backgroundColor: selectedStop.color }}
          />
          <input
            type="text"
            className="gradient-stop-color-input"
            value={selectedStop.color.toUpperCase()}
            onChange={(e) => {
              const val = e.target.value;
              if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                updateStop(selectedIndex, { color: val });
              }
            }}
          />
          <input
            type="number"
            className="gradient-stop-pos-input"
            value={selectedStop.position}
            min={0}
            max={100}
            onChange={(e) => updateStop(selectedIndex, { position: parseInt(e.target.value) || 0 })}
          />
          <span style={{ color: '#666', fontSize: 10 }}>%</span>
          {stops.length > 2 && (
            <button
              className="gradient-stop-delete"
              onClick={() => deleteStop(selectedIndex)}
              title="Delete stop"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          )}
        </div>
      )}

      <div className="gradient-stop-hint">Click bar to add stop · Drag to reposition</div>
    </div>
  );
}

export function GradientEditor({
  gradientType,
  gradientAngle,
  gradientStops,
  gradientCenterX,
  gradientCenterY,
  onChange,
}: GradientEditorProps) {
  const stops = gradientStops.length >= 2 ? gradientStops : DEFAULT_STOPS;
  const [selectedStopIndex, setSelectedStopIndex] = useState(0);
  const [showStopPicker, setShowStopPicker] = useState(false);

  // Build CSS gradient string for preview
  const buildGradientCSS = useCallback(() => {
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const stopsStr = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');
    if (gradientType === 'linear') {
      return `linear-gradient(${gradientAngle}deg, ${stopsStr})`;
    }
    if (gradientType === 'radial') {
      return `radial-gradient(circle at ${gradientCenterX}% ${gradientCenterY}%, ${stopsStr})`;
    }
    return stops[0]?.color || '#000';
  }, [gradientType, gradientAngle, stops, gradientCenterX, gradientCenterY]);

  return (
    <div className="gradient-editor">
      {/* Type selector */}
      <div className="gradient-type-row">
        {(['none', 'linear', 'radial'] as const).map(type => (
          <button
            key={type}
            className={`gradient-type-btn ${gradientType === type ? 'active' : ''}`}
            onClick={() => {
              const updates: Parameters<typeof onChange>[0] = { gradientType: type };
              if (type !== 'none' && stops.length < 2) {
                updates.gradientStops = DEFAULT_STOPS;
              }
              onChange(updates);
            }}
          >
            {type === 'none' ? 'Solid' : type === 'linear' ? 'Linear' : 'Radial'}
          </button>
        ))}
      </div>

      {gradientType !== 'none' && (
        <>
          {/* Preview */}
          <div
            className="gradient-preview"
            style={{ background: buildGradientCSS() }}
          />

          {/* Angle dial for linear */}
          {gradientType === 'linear' && (
            <AngleDial angle={gradientAngle} onChange={(a) => onChange({ gradientAngle: a })} />
          )}

          {/* Center point for radial */}
          {gradientType === 'radial' && (
            <CenterPad
              centerX={gradientCenterX}
              centerY={gradientCenterY}
              onChange={onChange}
            />
          )}

          {/* Color stops */}
          <StopsEditor
            stops={stops}
            selectedIndex={selectedStopIndex}
            onSelectStop={setSelectedStopIndex}
            showPicker={showStopPicker}
            onTogglePicker={setShowStopPicker}
            gradientType={gradientType}
            gradientAngle={gradientAngle}
            onChange={onChange}
          />
        </>
      )}
    </div>
  );
}
