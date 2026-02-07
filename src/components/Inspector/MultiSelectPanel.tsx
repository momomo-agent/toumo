import { useMemo, useCallback } from 'react';
import { useEditorStore } from '../../store';
import { AlignmentPanel } from './AlignmentPanel';
import type { ShapeStyle, KeyElement } from '../../types';

const MIXED = '__mixed__' as const;

/**
 * For a list of elements, compute the "common" value for a style property.
 * If all elements share the same value → return that value.
 * If they differ → return MIXED sentinel.
 * If none have the property → return undefined.
 */
function getCommonValue<K extends keyof ShapeStyle>(
  elements: KeyElement[],
  key: K,
): ShapeStyle[K] | typeof MIXED | undefined {
  const values = elements
    .map((el) => el.style?.[key])
    .filter((v) => v !== undefined);
  if (values.length === 0) return undefined;
  const first = values[0];
  return values.every((v) => v === first) ? first : MIXED;
}

function getCommonNumericValue(
  elements: KeyElement[],
  key: keyof ShapeStyle,
): number | typeof MIXED | undefined {
  const val = getCommonValue(elements, key);
  if (val === MIXED) return MIXED;
  if (typeof val === 'number') return val;
  return undefined;
}

export function MultiSelectPanel() {
  const {
    selectedElementIds,
    updateElement,
    deleteSelectedElements,
    pushHistory,
  } = useEditorStore();

  const sharedElements = useEditorStore(s => s.sharedElements);
  const selectedElements = useMemo(() => {
    return sharedElements.filter((el) =>
      selectedElementIds.includes(el.id),
    );
  }, [sharedElements, selectedElementIds]);

  // Compute shared properties
  const commonFill = getCommonValue(selectedElements, 'fill');
  const commonOpacity = getCommonNumericValue(selectedElements, 'fillOpacity');
  const commonStroke = getCommonValue(selectedElements, 'stroke');
  const commonStrokeWidth = getCommonNumericValue(selectedElements, 'strokeWidth');
  const commonBorderRadius = getCommonNumericValue(selectedElements, 'borderRadius');

  // Batch update helper
  const batchUpdateStyle = useCallback(
    (overrides: Partial<ShapeStyle>) => {
      pushHistory();
      selectedElementIds.forEach((id) => {
        const el = sharedElements.find((e) => e.id === id);
        if (!el) return;
        updateElement(id, {
          style: { ...(el.style || {}), ...overrides } as ShapeStyle,
        });
      });
    },
    [selectedElementIds, sharedElements, updateElement, pushHistory],
  );

  if (selectedElements.length < 2) return null;

  return (
    <div className="multi-select-panel">
      {/* Header */}
      <div className="figma-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{selectedElementIds.length} Elements Selected</span>
        <button
          onClick={deleteSelectedElements}
          style={{
            background: '#ef444420',
            border: '1px solid #ef4444',
            borderRadius: 6,
            color: '#ef4444',
            fontSize: 11,
            padding: '3px 8px',
            cursor: 'pointer',
          }}
          title="Delete all selected"
        >
          Delete
        </button>
      </div>

      {/* Alignment */}
      <AlignmentPanel />

      {/* Shared Properties */}
      <div style={{ padding: '0 12px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Shared Properties
        </div>

        {/* Fill */}
        <PropertyRow label="Fill">
          {commonFill === MIXED ? (
            <MixedBadge />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              <input
                type="color"
                value={typeof commonFill === 'string' ? commonFill : '#000000'}
                onChange={(e) => batchUpdateStyle({ fill: e.target.value })}
                style={colorInputStyle}
              />
              <input
                type="text"
                value={typeof commonFill === 'string' ? commonFill : ''}
                onChange={(e) => batchUpdateStyle({ fill: e.target.value })}
                style={{ ...textInputStyle, flex: 1, fontFamily: 'monospace' }}
              />
            </div>
          )}
        </PropertyRow>

        {/* Opacity */}
        <PropertyRow label="Opacity">
          {commonOpacity === MIXED ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              <MixedBadge />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                defaultValue={1}
                onChange={(e) => batchUpdateStyle({ fillOpacity: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={commonOpacity ?? 1}
                onChange={(e) => batchUpdateStyle({ fillOpacity: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 11, color: '#888', width: 36, textAlign: 'right' }}>
                {Math.round((commonOpacity ?? 1) * 100)}%
              </span>
            </div>
          )}
        </PropertyRow>

        {/* Stroke */}
        <PropertyRow label="Stroke">
          {commonStroke === MIXED ? (
            <MixedBadge />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              <input
                type="color"
                value={typeof commonStroke === 'string' && commonStroke ? commonStroke : '#ffffff'}
                onChange={(e) => batchUpdateStyle({ stroke: e.target.value })}
                style={colorInputStyle}
              />
              <input
                type="number"
                min={0}
                value={commonStrokeWidth === MIXED ? '' : (commonStrokeWidth ?? 0)}
                placeholder={commonStrokeWidth === MIXED ? 'Mixed' : '0'}
                onChange={(e) => batchUpdateStyle({ strokeWidth: Number(e.target.value) })}
                style={{ ...textInputStyle, width: 48 }}
              />
            </div>
          )}
        </PropertyRow>

        {/* Border Radius */}
        <PropertyRow label="Radius">
          {commonBorderRadius === MIXED ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              <MixedBadge />
              <input
                type="number"
                min={0}
                placeholder="Mixed"
                onChange={(e) => batchUpdateStyle({ borderRadius: Number(e.target.value) })}
                style={{ ...textInputStyle, flex: 1 }}
              />
            </div>
          ) : (
            <input
              type="number"
              min={0}
              value={commonBorderRadius ?? 0}
              onChange={(e) => batchUpdateStyle({ borderRadius: Number(e.target.value) })}
              style={{ ...textInputStyle, flex: 1 }}
            />
          )}
        </PropertyRow>

        {/* Quick opacity presets */}
        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          {[1, 0.75, 0.5, 0.25].map((v) => (
            <button
              key={v}
              onClick={() => batchUpdateStyle({ fillOpacity: v })}
              style={presetBtnStyle}
            >
              {Math.round(v * 100)}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 11, color: '#666', width: 50, flexShrink: 0 }}>{label}</span>
      {children}
    </div>
  );
}

function MixedBadge() {
  return (
    <span
      style={{
        fontSize: 10,
        color: '#888',
        background: '#ffffff10',
        padding: '2px 6px',
        borderRadius: 4,
        fontStyle: 'italic',
      }}
    >
      Mixed
    </span>
  );
}

const colorInputStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  padding: 0,
  border: '1px solid #2a2a2a',
  borderRadius: 6,
  cursor: 'pointer',
  background: 'transparent',
  flexShrink: 0,
};

const textInputStyle: React.CSSProperties = {
  background: '#141416',
  border: '1px solid #2a2a2a',
  borderRadius: 6,
  color: '#e0e0e0',
  fontSize: 12,
  padding: '5px 8px',
  outline: 'none',
};

const presetBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '4px 0',
  background: '#141416',
  border: '1px solid #2a2a2a',
  borderRadius: 4,
  color: '#888',
  fontSize: 10,
  cursor: 'pointer',
};
