import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';

export function PatchInspector() {
  const selectedPatchId = useEditorStore(s => s.selectedPatchId);
  const patches = useEditorStore(s => s.patches);
  const sharedElements = useEditorStore(s => s.sharedElements);
  const displayStates = useEditorStore(s => s.displayStates);
  const variables = useEditorStore(s => s.variables);
  const updatePatchConfig = useEditorStore(s => s.updatePatchConfig);

  const patch = patches.find(p => p.id === selectedPatchId);
  if (!patch) return null;

  const isTrigger = ['tap', 'drag', 'hover', 'scroll'].includes(patch.type);
  const isAction = ['switchDisplayState', 'setVariable', 'animateProperty'].includes(patch.type);

  return (
    <section className="inspector-panel figma-style" style={{ padding: 16 }}>
      <div className="figma-panel-header">Patch Config</div>

      {/* Patch name */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Name</label>
        <input
          value={patch.name}
          onChange={e => {
            // Name is stored on patch directly, not in config
            const newName = e.target.value;
            useEditorStore.setState(s => ({
              patches: s.patches.map(p => p.id === patch.id ? { ...p, name: newName } : p),
            }));
          }}
          style={inputStyle}
        />
      </div>

      {/* Patch type badge */}
      <div style={{ marginBottom: 12 }}>
        <span style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 4,
          background: isTrigger ? '#1e3a5f' : isAction ? '#3b1f5e' : '#333',
          color: isTrigger ? '#60a5fa' : isAction ? '#c084fc' : '#aaa',
        }}>
          {patch.type}
        </span>
      </div>

      {/* Target element (for trigger patches) */}
      {isTrigger && (
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Target Element</label>
          <select
            value={patch.config?.targetElementId || ''}
            onChange={e => updatePatchConfig(patch.id, {
              targetElementId: e.target.value || undefined,
            })}
            style={inputStyle}
          >
            <option value="">— Any —</option>
            {sharedElements.map(el => (
              <option key={el.id} value={el.id}>{el.name || el.id}</option>
            ))}
          </select>
        </div>
      )}

      {/* Target display state (for switchDisplayState) */}
      {patch.type === 'switchDisplayState' && (
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Target State</label>
          <select
            value={patch.config?.targetDisplayStateId || ''}
            onChange={e => updatePatchConfig(patch.id, {
              targetDisplayStateId: e.target.value,
            })}
            style={inputStyle}
          >
            <option value="">— Select —</option>
            {displayStates.map(ds => (
              <option key={ds.id} value={ds.id}>{ds.name}</option>
            ))}
          </select>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 11, color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="checkbox"
                checked={!!patch.config?.autoReverse}
                onChange={e => updatePatchConfig(patch.id, { autoReverse: e.target.checked })}
              />
              Auto-Reverse
            </label>
            {patch.config?.autoReverse && (
              <input
                type="number"
                value={patch.config?.reverseDelay ?? 200}
                onChange={e => updatePatchConfig(patch.id, { reverseDelay: Number(e.target.value) })}
                style={{ ...inputStyle, width: 60 }}
                min={50}
                step={50}
              />
            )}
          </div>
        </div>
      )}

      {/* Variable selector (for setVariable) */}
      {patch.type === 'setVariable' && (
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Variable</label>
          <select
            value={patch.config?.variableId || ''}
            onChange={e => updatePatchConfig(patch.id, {
              variableId: e.target.value,
            })}
            style={inputStyle}
          >
            <option value="">— Select —</option>
            {variables.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <label style={{ ...labelStyle, marginTop: 8 }}>Value</label>
          <input
            value={patch.config?.value ?? ''}
            onChange={e => updatePatchConfig(patch.id, {
              value: e.target.value,
            })}
            style={inputStyle}
            placeholder="Value to set"
          />
        </div>
      )}

      {/* Animate Property config */}
      {patch.type === 'animateProperty' && (
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Target Element</label>
          <input
            value={patch.config?.targetElementId || ''}
            onChange={e => updatePatchConfig(patch.id, {
              targetElementId: e.target.value,
            })}
            style={inputStyle}
            placeholder="Element ID"
          />
          <label style={{ ...labelStyle, marginTop: 8 }}>Property</label>
          <select
            value={patch.config?.property || ''}
            onChange={e => updatePatchConfig(patch.id, {
              property: e.target.value,
            })}
            style={inputStyle}
          >
            <option value="">— Select —</option>
            <option value="opacity">Opacity</option>
            <option value="x">X Position</option>
            <option value="y">Y Position</option>
            <option value="width">Width</option>
            <option value="height">Height</option>
            <option value="rotation">Rotation</option>
            <option value="scale">Scale</option>
            <option value="borderRadius">Border Radius</option>
            <option value="backgroundColor">Background Color</option>
          </select>
          <label style={{ ...labelStyle, marginTop: 8 }}>To Value</label>
          <input
            value={patch.config?.toValue ?? ''}
            onChange={e => updatePatchConfig(patch.id, {
              toValue: e.target.value,
            })}
            style={inputStyle}
            placeholder="Target value"
          />
        </div>
      )}

      {/* DragBinding config */}
      {patch.type === 'dragBinding' && (
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Target Element</label>
          <input
            value={patch.config?.targetElementId || ''}
            onChange={e => updatePatchConfig(patch.id, { targetElementId: e.target.value })}
            style={inputStyle}
            placeholder="Element ID"
          />
          <label style={{ ...labelStyle, marginTop: 8 }}>Property</label>
          <select
            value={patch.config?.property || 'y'}
            onChange={e => updatePatchConfig(patch.id, { property: e.target.value })}
            style={inputStyle}
          >
            <option value="x">X</option>
            <option value="y">Y</option>
            <option value="opacity">Opacity</option>
            <option value="rotation">Rotation</option>
            <option value="scale">Scale</option>
          </select>
          <label style={{ ...labelStyle, marginTop: 8 }}>Axis</label>
          <select
            value={patch.config?.axis || 'y'}
            onChange={e => updatePatchConfig(patch.id, { axis: e.target.value })}
            style={inputStyle}
          >
            <option value="x">Horizontal (X)</option>
            <option value="y">Vertical (Y)</option>
          </select>
          <label style={{ ...labelStyle, marginTop: 8 }}>Multiplier</label>
          <input
            type="number"
            value={patch.config?.multiplier ?? 1}
            onChange={e => updatePatchConfig(patch.id, { multiplier: Number(e.target.value) })}
            style={inputStyle}
            step={0.1}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Min</label>
              <input
                type="number"
                value={patch.config?.min ?? ''}
                onChange={e => updatePatchConfig(patch.id, { min: e.target.value ? Number(e.target.value) : undefined })}
                style={inputStyle}
                placeholder="—"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Max</label>
              <input
                type="number"
                value={patch.config?.max ?? ''}
                onChange={e => updatePatchConfig(patch.id, { max: e.target.value ? Number(e.target.value) : undefined })}
                style={inputStyle}
                placeholder="—"
              />
            </div>
          </div>
        </div>
      )}

      {/* OptionSwitch config */}
      {patch.type === 'optionSwitch' && (
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Option Count</label>
          <input
            type="number"
            value={patch.config?.optionCount ?? 2}
            onChange={e => updatePatchConfig(patch.id, { optionCount: Math.max(2, Number(e.target.value)) })}
            style={inputStyle}
            min={2}
            max={10}
          />
          <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
            Current: Option {(patch.config?._selectedIndex ?? 0)}
          </div>
        </div>
      )}

      {/* Toggle state display */}
      {patch.type === 'toggle' && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#888' }}>
            State: {patch.config?._toggleState ? '✅ ON' : '⬜ OFF'}
          </div>
        </div>
      )}

      {/* Counter config */}
      {patch.type === 'counter' && (
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Step</label>
          <input
            type="number"
            value={patch.config?.step ?? 1}
            onChange={e => updatePatchConfig(patch.id, { step: Number(e.target.value) })}
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Min</label>
              <input
                type="number"
                value={patch.config?.min ?? 0}
                onChange={e => updatePatchConfig(patch.id, { min: Number(e.target.value) })}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Max</label>
              <input
                type="number"
                value={patch.config?.max ?? ''}
                onChange={e => updatePatchConfig(patch.id, { max: e.target.value ? Number(e.target.value) : undefined })}
                style={inputStyle}
                placeholder="∞"
              />
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
            Count: {patch.config?._count ?? 0}
          </div>
        </div>
      )}

      {/* Timer duration */}
      {patch.type === 'timer' && (
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Duration (ms)</label>
          <input
            type="number"
            value={patch.config?.duration ?? 1000}
            onChange={e => updatePatchConfig(patch.id, {
              duration: Number(e.target.value),
            })}
            style={inputStyle}
          />
        </div>
      )}

      {/* Delay duration */}
      {patch.type === 'delay' && (
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Delay (ms)</label>
          <input
            type="number"
            value={patch.config?.delay ?? 300}
            onChange={e => updatePatchConfig(patch.id, {
              delay: Number(e.target.value),
            })}
            style={inputStyle}
          />
        </div>
      )}

      {/* Ports info */}
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Ports</label>
        {patch.outputs.length > 0 && (
          <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
            Out: {patch.outputs.map(p => p.name).join(', ')}
          </div>
        )}
        {patch.inputs.length > 0 && (
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
            In: {patch.inputs.map(p => p.name).join(', ')}
          </div>
        )}
      </div>
    </section>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: '#888',
  marginBottom: 4, fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 8px', fontSize: 12,
  background: '#1a1a1e', border: '1px solid #333',
  borderRadius: 6, color: '#fff', outline: 'none',
};
