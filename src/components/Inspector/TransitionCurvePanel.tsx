import { useState } from 'react';
import { useEditorStore } from '../../store';
import type { CurveConfig, CurveType } from '../../types';
import { DEFAULT_CURVE_CONFIG } from '../../types';
import { DraggableBezierEditor, SpringCurveGraph, BallPreview, PresetSelector } from '../CurveEditor';

const CURVE_OPTIONS: { value: CurveType; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease', label: 'Ease' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In Out' },
  { value: 'spring', label: 'Spring' },
  { value: 'bezier', label: 'Bezier' },
];

function CurveSelector({
  label,
  curve,
  onChange,
  onRemove,
  inheritedLabel,
}: {
  label: string;
  curve: CurveConfig | undefined;
  onChange: (curve: CurveConfig) => void;
  onRemove?: () => void;
  inheritedLabel?: string;
}) {
  const effective = curve || DEFAULT_CURVE_CONFIG;
  const isOverridden = !!curve;

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 4,
      }}>
        <span style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>{label}</span>
        {inheritedLabel && !isOverridden && (
          <span style={{ fontSize: 10, color: '#666', fontStyle: 'italic' }}>
            ← {inheritedLabel}
          </span>
        )}
        {isOverridden && onRemove && (
          <button
            onClick={onRemove}
            style={{
              fontSize: 10, color: '#f87171', background: 'none', border: 'none',
              cursor: 'pointer', padding: '0 4px',
            }}
          >
            Reset
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <select
          className="figma-select"
          value={effective.type}
          onChange={(e) => onChange({ ...effective, type: e.target.value as CurveType })}
          style={{ flex: 1, fontSize: 11, height: 26 }}
        >
          {CURVE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="number"
          className="figma-input"
          value={effective.duration}
          onChange={(e) => onChange({ ...effective, duration: Number(e.target.value) })}
          style={{ width: 52, fontSize: 11, height: 26 }}
          title="Duration (ms)"
          min={0}
          step={50}
        />
        <input
          type="number"
          className="figma-input"
          value={effective.delay}
          onChange={(e) => onChange({ ...effective, delay: Number(e.target.value) })}
          style={{ width: 44, fontSize: 11, height: 26 }}
          title="Delay (ms)"
          min={0}
          step={50}
        />
      </div>
      {effective.type === 'spring' && (
        <SpringParams curve={effective} onChange={onChange} />
      )}
      {effective.type === 'bezier' && (
        <BezierEditor curve={effective} onChange={onChange} />
      )}
      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center' }}>
        <BallPreview
          bezier={effective.controlPoints}
          spring={effective.type === 'spring' ? {
            damping: effective.damping ?? 26,
            stiffness: effective.stiffness ?? 170,
            mass: effective.mass ?? 1,
          } : undefined}
          duration={effective.duration ?? 300}
        />
      </div>
      <PresetSelector
        currentCurve={effective.type}
        currentBezier={effective.controlPoints}
        currentSpring={effective.type === 'spring' ? {
          damping: effective.damping ?? 26,
          stiffness: effective.stiffness ?? 170,
          mass: effective.mass ?? 1,
        } : undefined}
        onSelectEasing={(preset) => onChange({
          ...effective,
          type: preset.id as CurveType,
          controlPoints: preset.bezier,
        })}
        onSelectSpring={(preset) => onChange({
          ...effective,
          type: 'spring',
          stiffness: preset.stiffness,
          damping: preset.damping,
          mass: preset.mass,
        })}
        onSelectCustom={() => onChange({ ...effective, type: 'bezier' })}
      />
    </div>
  );
}

function BezierEditor({ curve, onChange }: { curve: CurveConfig; onChange: (c: CurveConfig) => void }) {
  const cp = curve.controlPoints || [0.25, 0.1, 0.25, 1.0];
  return (
    <div style={{ marginTop: 4, display: 'flex', justifyContent: 'center' }}>
      <DraggableBezierEditor
        value={cp}
        onChange={(v) => onChange({ ...curve, controlPoints: v })}
        size={120}
      />
    </div>
  );
}

function SpringParams({
  curve,
  onChange,
}: {
  curve: CurveConfig;
  onChange: (c: CurveConfig) => void;
}) {
  return (
    <>
    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
      <div style={{ flex: 1 }}>
        <label style={{ fontSize: 9, color: '#666' }}>Stiffness</label>
        <input
          type="number"
          className="figma-input"
          value={curve.stiffness ?? 170}
          onChange={(e) => onChange({ ...curve, stiffness: Number(e.target.value) })}
          style={{ width: '100%', fontSize: 11, height: 24 }}
          min={1}
        />
      </div>
      <div style={{ flex: 1 }}>
        <label style={{ fontSize: 9, color: '#666' }}>Damping</label>
        <input
          type="number"
          className="figma-input"
          value={curve.damping ?? 26}
          onChange={(e) => onChange({ ...curve, damping: Number(e.target.value) })}
          style={{ width: '100%', fontSize: 11, height: 24 }}
          min={0}
        />
      </div>
      <div style={{ flex: 1 }}>
        <label style={{ fontSize: 9, color: '#666' }}>Mass</label>
        <input
          type="number"
          className="figma-input"
          value={curve.mass ?? 1}
          onChange={(e) => onChange({ ...curve, mass: Number(e.target.value) })}
          style={{ width: '100%', fontSize: 11, height: 24 }}
          min={0.1}
          step={0.1}
        />
      </div>
    </div>
    <div style={{ marginTop: 4, display: 'flex', justifyContent: 'center' }}>
      <SpringCurveGraph
        stiffness={curve.stiffness ?? 170}
        damping={curve.damping ?? 26}
        mass={curve.mass ?? 1}
      />
    </div>
    </>
  );
}

// Generate SVG path for curve preview
function getCurveSVGPath(curve: CurveConfig): string {
  const w = 100, h = 36, y0 = 38, y1 = 2;
  const steps = 50;

  if (curve.type === 'linear') {
    return `M 0 ${y0} L ${w} ${y1}`;
  }

  // Bezier control points for common easing types
  let cp: [number, number, number, number];
  switch (curve.type) {
    case 'ease': cp = [0.25, 0.1, 0.25, 1.0]; break;
    case 'ease-in': cp = [0.42, 0, 1.0, 1.0]; break;
    case 'ease-out': cp = [0, 0, 0.58, 1.0]; break;
    case 'ease-in-out': cp = [0.42, 0, 0.58, 1.0]; break;
    case 'bezier':
      cp = curve.controlPoints || [0.25, 0.1, 0.25, 1.0];
      break;
    case 'spring':
      // Approximate spring with overshoot
      cp = [0.2, 1.2, 0.4, 1.0];
      break;
    default:
      cp = [0.25, 0.1, 0.25, 1.0];
  }

  // Sample cubic bezier
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const y = 3 * u * u * t * cp[1] + 3 * u * t * t * cp[3] + t * t * t;
    const px = (t * w).toFixed(1);
    const py = (y0 - y * h).toFixed(1);
    pts.push(`${i === 0 ? 'M' : 'L'} ${px} ${py}`);
  }
  return pts.join(' ');
}

export function TransitionCurvePanel() {
  const {
    globalCurve,
    setGlobalCurve,
    selectedElementId,
    selectedDisplayStateId,
    displayStates,
    setElementCurve,
    setPropertyCurve,
    removeElementCurve,
    removePropertyCurve,
  } = useEditorStore();

  // Find current layer override for selected element in selected display state
  const currentDS = displayStates.find((ds) => ds.id === selectedDisplayStateId);
  const layerOverride = currentDS?.layerOverrides.find(
    (o) => o.layerId === selectedElementId
  );

  const elementCurve = layerOverride?.curveOverride;
  const propertyCurves = layerOverride?.propertyCurveOverrides || {};

  // Key properties that have overrides
  const keyProps = layerOverride?.keyProperties || [];

  // Track which property the user wants to add a curve override for
  const [showPropertyAdd, setShowPropertyAdd] = useState(false);

  // Effective curve for this element (element > global)
  const effectiveCurve = elementCurve || globalCurve;

  return (
    <div className="figma-section" style={{ borderTop: '1px solid #2a2a2a' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 0 4px',
        }}
      >
        <span className="figma-section-title">Transition Curve</span>
      </div>

      {/* Level 1: Global Curve */}
      <CurveSelector
        label="Global Default"
        curve={globalCurve}
        onChange={setGlobalCurve}
      />

      {/* Level 2: Element Curve (only when element + display state selected) */}
      {selectedElementId && selectedDisplayStateId && (
        <CurveSelector
          label="Element Override"
          curve={elementCurve}
          onChange={(c) => setElementCurve(selectedDisplayStateId, selectedElementId, c)}
          onRemove={() => removeElementCurve(selectedDisplayStateId, selectedElementId)}
          inheritedLabel="Global"
        />
      )}

      {/* Level 3: Property Curves */}
      {selectedElementId && selectedDisplayStateId && keyProps.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 4,
          }}>
            <span style={{ fontSize: 10, color: '#888', fontWeight: 500 }}>
              Property Overrides
            </span>
            <button
              onClick={() => setShowPropertyAdd(!showPropertyAdd)}
              style={{
                fontSize: 16, color: '#888', background: 'none', border: 'none',
                cursor: 'pointer', padding: '0 2px', lineHeight: 1,
              }}
            >
              +
            </button>
          </div>

          {/* Existing property curve overrides */}
          {Object.entries(propertyCurves).map(([prop, curve]) => (
            <CurveSelector
              key={prop}
              label={prop}
              curve={curve}
              onChange={(c) =>
                setPropertyCurve(selectedDisplayStateId, selectedElementId, prop, c)
              }
              onRemove={() =>
                removePropertyCurve(selectedDisplayStateId, selectedElementId, prop)
              }
              inheritedLabel="Element"
            />
          ))}

          {/* Add property curve override */}
          {showPropertyAdd && (
            <PropertyCurveAdder
              keyProps={keyProps}
              existingProps={Object.keys(propertyCurves)}
              onAdd={(prop) => {
                setPropertyCurve(
                  selectedDisplayStateId,
                  selectedElementId,
                  prop,
                  { ...effectiveCurve }
                );
                setShowPropertyAdd(false);
              }}
              onCancel={() => setShowPropertyAdd(false)}
            />
          )}
        </div>
      )}

      {/* Effective curve summary */}
      <EffectiveCurveSummary
        globalCurve={globalCurve}
        elementCurve={elementCurve}
        hasPropertyOverrides={Object.keys(propertyCurves).length > 0}
      />
    </div>
  );
}

function PropertyCurveAdder({
  keyProps,
  existingProps,
  onAdd,
  onCancel,
}: {
  keyProps: string[];
  existingProps: string[];
  onAdd: (prop: string) => void;
  onCancel: () => void;
}) {
  const available = keyProps.filter((p) => !existingProps.includes(p));

  if (available.length === 0) {
    return (
      <div style={{ fontSize: 10, color: '#666', padding: '4px 0' }}>
        All key properties already have overrides.
        <button onClick={onCancel} style={{
          marginLeft: 8, fontSize: 10, color: '#888', background: 'none',
          border: 'none', cursor: 'pointer', textDecoration: 'underline',
        }}>
          Close
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
      <select
        className="figma-select"
        style={{ flex: 1, fontSize: 11, height: 26 }}
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) onAdd(e.target.value);
        }}
      >
        <option value="" disabled>Select property…</option>
        {available.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <button onClick={onCancel} style={{
        fontSize: 10, color: '#888', background: 'none', border: 'none',
        cursor: 'pointer',
      }}>
        ✕
      </button>
    </div>
  );
}

function EffectiveCurveSummary({
  globalCurve,
  elementCurve,
  hasPropertyOverrides,
}: {
  globalCurve: CurveConfig;
  elementCurve: CurveConfig | undefined;
  hasPropertyOverrides: boolean;
}) {
  const effective = elementCurve || globalCurve;
  const source = elementCurve ? 'Element' : 'Global';

  // Generate SVG curve path
  const curvePath = getCurveSVGPath(effective);

  return (
    <div style={{
      marginTop: 6, padding: '6px 8px', background: '#1a1a2e',
      borderRadius: 4, fontSize: 10, color: '#888',
    }}>
      {/* Curve preview */}
      <svg width="100%" height="40" viewBox="0 0 100 40" style={{ marginBottom: 4 }}>
        <rect x="0" y="0" width="100" height="40" fill="none" />
        <line x1="0" y1="38" x2="100" y2="38" stroke="#333" strokeWidth="0.5" />
        <line x1="0" y1="2" x2="100" y2="2" stroke="#333" strokeWidth="0.5" strokeDasharray="2,2" />
        <path d={curvePath} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Effective: <strong style={{ color: '#ccc' }}>{effective.type}</strong></span>
        <span>{effective.duration}ms{effective.delay > 0 ? ` +${effective.delay}ms` : ''}</span>
      </div>
      <div style={{ marginTop: 2, color: '#666' }}>
        Source: {source}
        {hasPropertyOverrides && ' (some properties overridden)'}
      </div>
    </div>
  );
}
