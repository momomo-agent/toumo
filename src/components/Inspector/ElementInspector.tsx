import { useEditorStore } from '../../store';
import type { ShapeStyle } from '../../types';
import { DEFAULT_STYLE as BASE_STYLE } from '../../types';
import { SectionHeader, Label, inputStyle, selectStyle, alignBtnStyle } from './ui';

const DEFAULT_STYLE: ShapeStyle = {
  ...BASE_STYLE,
  textAlign: 'left',
};

const COLOR_PRESETS = ['#ffffff', '#000000', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7'];

const TEXT_ALIGNMENTS: Array<{ id: NonNullable<ShapeStyle['textAlign']>; label: string }> = [
  { id: 'left', label: 'L' },
  { id: 'center', label: 'C' },
  { id: 'right', label: 'R' },
];

const mergeStyle = (style?: ShapeStyle, overrides: Partial<ShapeStyle> = {}): ShapeStyle => ({
  ...DEFAULT_STYLE,
  ...style,
  ...overrides,
});

export function ElementInspector() {
  const {
    selectedElementId,
    selectedElementIds,
    updateElement,
    deleteElement,
    alignElements,
    distributeElements,
    recentColors,
    addRecentColor,
    copySelectedElements,
    pasteElements,
    frameSize,
  } = useEditorStore();

  const sharedElements = useEditorStore(s => s.sharedElements);
  const selectedElement = sharedElements.find((el) => el.id === selectedElementId);

  const selected = selectedElement;
  if (!selected) return null;

  const currentStyle = mergeStyle(selected.style);
  const handleStyleChange = (overrides: Partial<ShapeStyle>) => {
    updateElement(selected.id, {
      style: mergeStyle(selected.style, overrides),
    });
    if (overrides.fill) addRecentColor(overrides.fill);
  };
  const isTextElement = selected.shapeType === 'text';
  const isLineElement = selected.shapeType === 'line';
  const activeAlign = currentStyle.textAlign ?? 'left';

  return (
<>
  {/* Alignment Tools */}
  {selectedElementIds.length >= 2 && (
    <div style={{ marginBottom: 16 }}>
      <Label>对齐</Label>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <button onClick={() => alignElements('left')} style={alignBtnStyle} title="左对齐">⬅</button>
        <button onClick={() => alignElements('center')} style={alignBtnStyle} title="水平居中">↔</button>
        <button onClick={() => alignElements('right')} style={alignBtnStyle} title="右对齐">➡</button>
        <button onClick={() => alignElements('top')} style={alignBtnStyle} title="顶部对齐">⬆</button>
        <button onClick={() => alignElements('middle')} style={alignBtnStyle} title="垂直居中">↕</button>
        <button onClick={() => alignElements('bottom')} style={alignBtnStyle} title="底部对齐">⬇</button>
      </div>
      {selectedElementIds.length >= 3 && (
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => distributeElements('horizontal')} style={{ ...alignBtnStyle, flex: 1 }}>水平分布</button>
          <button onClick={() => distributeElements('vertical')} style={{ ...alignBtnStyle, flex: 1 }}>垂直分布</button>
        </div>
      )}
    </div>
  )}
  <SectionHeader>元素属性</SectionHeader>
  <div style={{ marginBottom: 16 }}>
    <Label>
      {selected.shapeType === 'rectangle' && '⬜ '}
      {selected.shapeType === 'ellipse' && '⚪ '}
      {selected.shapeType === 'text' && '📝 '}
      {selected.shapeType === 'image' && '🖼️ '}
      {selected.shapeType === 'line' && '📏 '}
      {selected.shapeType === 'frame' && '📐 '}
      名称
    </Label>
    <div style={{ display: 'flex', gap: 8 }}>
      <input
        type="text"
        value={selected.name}
        onChange={(e) => updateElement(selected.id, { name: e.target.value })}
        style={{ ...inputStyle, flex: 1 }}
      />
      <button
        onClick={() => updateElement(selected.id, { locked: !selected.locked })}
        style={{
          padding: '6px 10px',
          background: selected.locked ? '#f59e0b30' : 'transparent',
          border: '1px solid #333',
          borderRadius: 6,
          color: selected.locked ? '#f59e0b' : '#666',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        {selected.locked ? '🔒' : '🔓'}
      </button>
      <button
        onClick={() => updateElement(selected.id, { visible: selected.visible === false ? true : false })}
        style={{
          padding: '6px 10px',
          background: selected.visible === false ? '#ef444430' : 'transparent',
          border: '1px solid #333',
          borderRadius: 6,
          color: selected.visible === false ? '#ef4444' : '#666',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        {selected.visible === false ? '👁️‍🗨️' : '👁️'}
      </button>
      <button
        onClick={() => navigator.clipboard.writeText(selected.id)}
        style={{
          padding: '6px 10px',
          background: 'transparent',
          border: '1px solid #333',
          borderRadius: 6,
          color: '#666',
          fontSize: 10,
          cursor: 'pointer',
        }}
        title="Copy ID"
      >
        ID
      </button>
      <button
        onClick={() => {
          const css = `width: ${selected.size.width}px;\nheight: ${selected.size.height}px;\nbackground: ${selected.style?.fill || '#333'};\nborder-radius: ${selected.style?.borderRadius || 0}px;`;
          navigator.clipboard.writeText(css);
        }}
        style={{
          padding: '6px 10px',
          background: 'transparent',
          border: '1px solid #333',
          borderRadius: 6,
          color: '#888',
          fontSize: 10,
          cursor: 'pointer',
        }}
        title="Copy CSS"
      >
        CSS
      </button>
      <button
        onClick={() => handleStyleChange({ fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 0, borderRadius: 8, fillOpacity: 1 })}
        style={{
          padding: '6px 10px',
          background: 'transparent',
          border: '1px solid #333',
          borderRadius: 6,
          color: '#888',
          fontSize: 10,
          cursor: 'pointer',
        }}
        title="Reset Style"
      >
        ↺
      </button>
      <button
        onClick={() => deleteElement(selected.id)}
        style={{
          padding: '6px 10px',
          background: '#ef444420',
          border: '1px solid #ef4444',
          borderRadius: 6,
          color: '#ef4444',
          fontSize: 10,
          cursor: 'pointer',
        }}
        title="Delete"
      >
        🗑️
      </button>
      <button
        onClick={() => { copySelectedElements(); pasteElements(); }}
        style={{
          padding: '6px 10px',
          background: 'transparent',
          border: '1px solid #333',
          borderRadius: 6,
          color: '#666',
          fontSize: 10,
          cursor: 'pointer',
        }}
        title="Duplicate"
      >
        📋
      </button>
    </div>
  </div>
  <div style={{ marginBottom: 16 }}>
    <Label>图层 (zIndex)</Label>
    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
      <button onClick={() => updateElement(selected.id, { zIndex: 0 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Back</button>
      <button onClick={() => updateElement(selected.id, { zIndex: 50 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Mid</button>
      <button onClick={() => updateElement(selected.id, { zIndex: 100 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Front</button>
    </div>
    <input
      type="number"
      value={selected.zIndex ?? 0}
      onChange={(e) => updateElement(selected.id, { zIndex: Number(e.target.value) })}
      style={inputStyle}
    />
  </div>
  <div style={{ marginBottom: 16 }}>
    <Label>位置</Label>
    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
      <button onClick={() => updateElement(selected.id, { position: { x: 0, y: 0 } })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 10, cursor: 'pointer' }}>↖</button>
      <button onClick={() => updateElement(selected.id, { position: { x: (frameSize.width - selected.size.width) / 2, y: 0 } })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 10, cursor: 'pointer' }}>↑</button>
      <button onClick={() => updateElement(selected.id, { position: { x: frameSize.width - selected.size.width, y: 0 } })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 10, cursor: 'pointer' }}>↗</button>
      <button onClick={() => updateElement(selected.id, { position: { x: (frameSize.width - selected.size.width) / 2, y: (frameSize.height - selected.size.height) / 2 } })} style={{ flex: 1, padding: 4, background: '#2563eb20', border: '1px solid #2563eb', borderRadius: 4, color: '#2563eb', fontSize: 10, cursor: 'pointer' }}>⊙</button>
      <button onClick={() => updateElement(selected.id, { position: { x: (frameSize.width - selected.size.width) / 2, y: frameSize.height - selected.size.height } })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 10, cursor: 'pointer' }}>↓</button>
      <button onClick={() => updateElement(selected.id, { position: { x: 0, y: (frameSize.height - selected.size.height) / 2 } })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 10, cursor: 'pointer' }}>←</button>
      <button onClick={() => updateElement(selected.id, { position: { x: frameSize.width - selected.size.width, y: (frameSize.height - selected.size.height) / 2 } })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 10, cursor: 'pointer' }}>→</button>
    </div>
    <div style={{ display: 'flex', gap: 8 }}>
      <input
        type="number"
        value={selected.position.x}
        onChange={(e) =>
          updateElement(selected.id, {
            position: { ...selected.position, x: Number(e.target.value) },
          })
        }
        style={{ ...inputStyle, flex: 1 }}
      />
      <input
        type="number"
        value={selected.position.y}
        onChange={(e) =>
          updateElement(selected.id, {
            position: { ...selected.position, y: Number(e.target.value) },
          })
        }
        style={{ ...inputStyle, flex: 1 }}
      />
    </div>
  </div>
  <div style={{ marginBottom: 16 }}>
    <Label>尺寸</Label>
    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
      <button onClick={() => updateElement(selected.id, { size: { width: 100, height: 100 } })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 10, cursor: 'pointer' }}>100²</button>
      <button onClick={() => updateElement(selected.id, { size: { width: 200, height: 200 } })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 10, cursor: 'pointer' }}>200²</button>
      <button onClick={() => updateElement(selected.id, { size: { width: 300, height: 200 } })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 10, cursor: 'pointer' }}>3:2</button>
      <button onClick={() => updateElement(selected.id, { size: { width: frameSize.width, height: frameSize.height } })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 10, cursor: 'pointer' }}>Full</button>
    </div>
    <div style={{ display: 'flex', gap: 8 }}>
      <input
        type="number"
        value={selected.size.width}
        onChange={(e) =>
          updateElement(selected.id, {
            size: { ...selected.size, width: Number(e.target.value) },
          })
        }
        style={{ ...inputStyle, flex: 1 }}
      />
      <input
        type="number"
        value={selected.size.height}
        onChange={(e) =>
          updateElement(selected.id, {
            size: { ...selected.size, height: Number(e.target.value) },
          })
        }
        style={{ ...inputStyle, flex: 1 }}
      />
      <button
        onClick={() => updateElement(selected.id, { constrainProportions: !selected.constrainProportions })}
        style={{
          padding: '6px 8px',
          background: selected.constrainProportions ? '#2563eb30' : 'transparent',
          border: '1px solid #333',
          borderRadius: 4,
          color: selected.constrainProportions ? '#2563eb' : '#666',
          fontSize: 10,
          cursor: 'pointer',
        }}
      >
        🔗
      </button>
    </div>
  </div>
  <div style={{ marginBottom: 20 }}>
    <Label>填充</Label>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="color"
        value={currentStyle.fill}
        onChange={(e) => handleStyleChange({ fill: e.target.value })}
        style={{
          width: 34,
          height: 34,
          padding: 0,
          border: '1px solid #2a2a2a',
          borderRadius: 8,
          cursor: 'pointer',
          background: 'transparent',
        }}
      />
      <input
        type="text"
        value={currentStyle.fill}
        onChange={(e) => handleStyleChange({ fill: e.target.value })}
        style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
      />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginTop: 8 }}>
      {COLOR_PRESETS.map((hex) => (
        <button
          key={hex}
          type="button"
          onClick={() => handleStyleChange({ fill: hex })}
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            borderRadius: 6,
            border: currentStyle.fill === hex ? '2px solid #fff' : '1px solid #2a2a2a',
            background: hex,
            cursor: 'pointer',
          }}
        />
      ))}
    </div>
    {recentColors.length > 0 && (
      <div style={{ marginTop: 8 }}>
        <span style={{ fontSize: 10, color: '#666' }}>Recent</span>
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          {recentColors.slice(0, 7).map((c) => (
            <button key={c} onClick={() => handleStyleChange({ fill: c })} style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid #333', background: c, cursor: 'pointer' }} />
          ))}
        </div>
      </div>
    )}
  </div>

  {/* Gradient Control */}
  <div style={{ marginBottom: 20 }}>
    <Label>渐变</Label>
    <select
      value={currentStyle.gradientType || 'none'}
      onChange={(e) => {
        const type = e.target.value as 'none' | 'linear' | 'radial';
        handleStyleChange({
          gradientType: type,
          gradientStops: type !== 'none' && !currentStyle.gradientStops?.length
            ? [{ color: '#3b82f6', position: 0 }, { color: '#8b5cf6', position: 100 }]
            : currentStyle.gradientStops,
        });
      }}
      style={selectStyle}
    >
      <option value="none">None</option>
      <option value="linear">Linear</option>
      <option value="radial">Radial</option>
    </select>
    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
      <button onClick={() => handleStyleChange({ gradientType: 'linear', gradientStops: [{ color: '#3b82f6', position: 0 }, { color: '#8b5cf6', position: 100 }] })} style={{ flex: 1, height: 24, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', border: '1px solid #333', borderRadius: 4, cursor: 'pointer' }} title="Blue-Purple" />
      <button onClick={() => handleStyleChange({ gradientType: 'linear', gradientStops: [{ color: '#f97316', position: 0 }, { color: '#ef4444', position: 100 }] })} style={{ flex: 1, height: 24, background: 'linear-gradient(90deg, #f97316, #ef4444)', border: '1px solid #333', borderRadius: 4, cursor: 'pointer' }} title="Orange-Red" />
      <button onClick={() => handleStyleChange({ gradientType: 'linear', gradientStops: [{ color: '#22c55e', position: 0 }, { color: '#06b6d4', position: 100 }] })} style={{ flex: 1, height: 24, background: 'linear-gradient(90deg, #22c55e, #06b6d4)', border: '1px solid #333', borderRadius: 4, cursor: 'pointer' }} title="Green-Cyan" />
    </div>
    {currentStyle.gradientType === 'linear' && (
      <div style={{ marginTop: 8 }}>
        <span style={{ fontSize: 10, color: '#666' }}>Angle</span>
        <input
          type="range"
          min={0}
          max={360}
          value={currentStyle.gradientAngle ?? 180}
          onChange={(e) => handleStyleChange({ gradientAngle: Number(e.target.value) })}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          <button onClick={() => handleStyleChange({ gradientAngle: 0 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>↑</button>
          <button onClick={() => handleStyleChange({ gradientAngle: 90 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>→</button>
          <button onClick={() => handleStyleChange({ gradientAngle: 180 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>↓</button>
          <button onClick={() => handleStyleChange({ gradientAngle: 270 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>←</button>
          <button onClick={() => handleStyleChange({ gradientAngle: 45 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>↗</button>
        </div>
      </div>
    )}
    {currentStyle.gradientType && currentStyle.gradientType !== 'none' && (
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 10, color: '#666' }}>Start</span>
          <input
            type="color"
            value={currentStyle.gradientStops?.[0]?.color || '#3b82f6'}
            onChange={(e) => {
              const stops = [...(currentStyle.gradientStops || [])];
              stops[0] = { color: e.target.value, position: 0 };
              handleStyleChange({ gradientStops: stops });
            }}
            style={{ width: '100%', height: 28 }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 10, color: '#666' }}>End</span>
          <input
            type="color"
            value={currentStyle.gradientStops?.[1]?.color || '#8b5cf6'}
            onChange={(e) => {
              const stops = [...(currentStyle.gradientStops || [])];
              stops[1] = { color: e.target.value, position: 100 };
              handleStyleChange({ gradientStops: stops });
            }}
            style={{ width: '100%', height: 28 }}
          />
        </div>
      </div>
    )}
  </div>

  {/* Opacity Control */}
  <div style={{ marginBottom: 20 }}>
    <Label>不透明度</Label>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={currentStyle.fillOpacity ?? 1}
        onChange={(e) => handleStyleChange({ fillOpacity: Number(e.target.value) })}
        style={{ flex: 1 }}
      />
      <span style={{ fontSize: 11, color: '#888', width: 40 }}>
        {Math.round((currentStyle.fillOpacity ?? 1) * 100)}%
      </span>
    </div>
    <div style={{ display: 'flex', gap: 4 }}>
      <button onClick={() => handleStyleChange({ fillOpacity: 1 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>100%</button>
      <button onClick={() => handleStyleChange({ fillOpacity: 0.5 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>50%</button>
      <button onClick={() => handleStyleChange({ fillOpacity: 0.25 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>25%</button>
    </div>
  </div>

  {/* Stroke Controls */}
  <div style={{ marginBottom: 20 }}>
    <Label>描边</Label>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <input
        type="color"
        value={currentStyle.stroke || '#ffffff'}
        onChange={(e) => handleStyleChange({ stroke: e.target.value })}
        style={{
          width: 34,
          height: 34,
          padding: 0,
          border: '1px solid #2a2a2a',
          borderRadius: 8,
          cursor: 'pointer',
          background: 'transparent',
        }}
      />
      <input
        type="number"
        min={0}
        value={currentStyle.strokeWidth ?? 0}
        onChange={(e) => handleStyleChange({ strokeWidth: Number(e.target.value) })}
        style={{ ...inputStyle, flex: 1 }}
        placeholder="Width"
      />
    </div>
    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
      <button onClick={() => handleStyleChange({ stroke: '#ffffff' })} style={{ width: 24, height: 24, background: '#ffffff', border: '1px solid #333', borderRadius: 4, cursor: 'pointer' }} />
      <button onClick={() => handleStyleChange({ stroke: '#000000' })} style={{ width: 24, height: 24, background: '#000000', border: '1px solid #333', borderRadius: 4, cursor: 'pointer' }} />
      <button onClick={() => handleStyleChange({ stroke: '#ef4444' })} style={{ width: 24, height: 24, background: '#ef4444', border: '1px solid #333', borderRadius: 4, cursor: 'pointer' }} />
      <button onClick={() => handleStyleChange({ stroke: '#3b82f6' })} style={{ width: 24, height: 24, background: '#3b82f6', border: '1px solid #333', borderRadius: 4, cursor: 'pointer' }} />
    </div>
    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
      <button onClick={() => handleStyleChange({ strokeWidth: 1 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>1</button>
      <button onClick={() => handleStyleChange({ strokeWidth: 2 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>2</button>
      <button onClick={() => handleStyleChange({ strokeWidth: 4 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>4</button>
      <button onClick={() => handleStyleChange({ strokeWidth: 0 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>0</button>
    </div>
    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
      <button onClick={() => handleStyleChange({ strokeDasharray: '' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>—</button>
      <button onClick={() => handleStyleChange({ strokeDasharray: '4 4' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>- -</button>
      <button onClick={() => handleStyleChange({ strokeDasharray: '2 2' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>···</button>
    </div>
    <div style={{ display: 'flex', gap: 6 }}>
      {(['solid', 'dashed', 'dotted'] as const).map(style => (
        <button
          key={style}
          onClick={() => handleStyleChange({ strokeStyle: style })}
          style={{
            flex: 1,
            padding: '4px 0',
            borderRadius: 4,
            border: (currentStyle.strokeStyle ?? 'solid') === style ? '1px solid #2563eb' : '1px solid #2a2a2a',
            background: (currentStyle.strokeStyle ?? 'solid') === style ? '#2563eb20' : 'transparent',
            color: '#fff',
            fontSize: 10,
            cursor: 'pointer',
          }}
        >
          {style}
        </button>
      ))}
    </div>
  </div>

  {/* Shadow Controls */}
  <div style={{ marginBottom: 20 }}>
    <Label>阴影</Label>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <input
        type="color"
        value={currentStyle.shadowColor || '#000000'}
        onChange={(e) => handleStyleChange({ shadowColor: e.target.value })}
        style={{
          width: 34,
          height: 34,
          padding: 0,
          border: '1px solid #2a2a2a',
          borderRadius: 8,
          cursor: 'pointer',
          background: 'transparent',
        }}
      />
      <input
        type="text"
        value={currentStyle.shadowColor || '#000000'}
        onChange={(e) => handleStyleChange({ shadowColor: e.target.value })}
        style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
      />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
      <div>
        <span style={{ fontSize: 10, color: '#666' }}>X Offset</span>
        <input
          type="number"
          value={currentStyle.shadowOffsetX ?? 0}
          onChange={(e) => handleStyleChange({ shadowOffsetX: Number(e.target.value) })}
          style={inputStyle}
        />
      </div>
      <div>
        <span style={{ fontSize: 10, color: '#666' }}>Y Offset</span>
        <input
          type="number"
          value={currentStyle.shadowOffsetY ?? 4}
          onChange={(e) => handleStyleChange({ shadowOffsetY: Number(e.target.value) })}
          style={inputStyle}
        />
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <div>
        <span style={{ fontSize: 10, color: '#666' }}>Blur</span>
        <input
          type="number"
          min={0}
          value={currentStyle.shadowBlur ?? 0}
          onChange={(e) => handleStyleChange({ shadowBlur: Number(e.target.value) })}
          style={inputStyle}
        />
      </div>
      <div>
        <span style={{ fontSize: 10, color: '#666' }}>Spread</span>
        <input
          type="number"
          value={currentStyle.shadowSpread ?? 0}
          onChange={(e) => handleStyleChange({ shadowSpread: Number(e.target.value) })}
          style={inputStyle}
        />
      </div>
    </div>
  </div>

  {/* Inner Shadow Controls */}
  <div style={{ marginBottom: 20 }}>
    <Label>内阴影</Label>
    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
      <button onClick={() => handleStyleChange({ innerShadowEnabled: true, innerShadowX: 0, innerShadowY: 2, innerShadowBlur: 4, innerShadowColor: '#00000040' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Soft</button>
      <button onClick={() => handleStyleChange({ innerShadowEnabled: true, innerShadowX: 0, innerShadowY: 4, innerShadowBlur: 8, innerShadowColor: '#00000060' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Deep</button>
      <button onClick={() => handleStyleChange({ innerShadowEnabled: false })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>None</button>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <input
        type="checkbox"
        checked={currentStyle.innerShadowEnabled ?? false}
        onChange={(e) => handleStyleChange({ innerShadowEnabled: e.target.checked })}
      />
      <input
        type="color"
        value={currentStyle.innerShadowColor || '#000000'}
        onChange={(e) => handleStyleChange({ innerShadowColor: e.target.value })}
        style={{ width: 34, height: 34, border: '1px solid #2a2a2a', borderRadius: 8 }}
      />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
      <div>
        <span style={{ fontSize: 10, color: '#666' }}>X</span>
        <input type="number" value={currentStyle.innerShadowX ?? 0} onChange={(e) => handleStyleChange({ innerShadowX: Number(e.target.value) })} style={inputStyle} />
      </div>
      <div>
        <span style={{ fontSize: 10, color: '#666' }}>Y</span>
        <input type="number" value={currentStyle.innerShadowY ?? 0} onChange={(e) => handleStyleChange({ innerShadowY: Number(e.target.value) })} style={inputStyle} />
      </div>
      <div>
        <span style={{ fontSize: 10, color: '#666' }}>Blur</span>
        <input type="number" min={0} value={currentStyle.innerShadowBlur ?? 4} onChange={(e) => handleStyleChange({ innerShadowBlur: Number(e.target.value) })} style={inputStyle} />
      </div>
    </div>
  </div>

  {/* Filters */}
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Label>滤镜</Label>
      <button
        onClick={() => handleStyleChange({ blur: 0, brightness: 1, contrast: 1, saturate: 1, hueRotate: 0, invert: 0, grayscale: 0, sepia: 0 })}
        style={{ background: 'none', border: 'none', color: '#666', fontSize: 10, cursor: 'pointer' }}
      >
        Reset
      </button>
    </div>
    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
      <button onClick={() => handleStyleChange({ grayscale: 1, saturate: 1 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>B&W</button>
      <button onClick={() => handleStyleChange({ sepia: 0.8, contrast: 1.1 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Vintage</button>
      <button onClick={() => handleStyleChange({ saturate: 1.5, contrast: 1.2 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Vivid</button>
    </div>
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontSize: 10, color: '#666' }}>Blur</span>
      <input
        type="range"
        min={0}
        max={20}
        value={currentStyle.blur ?? 0}
        onChange={(e) => handleStyleChange({ blur: Number(e.target.value) })}
        style={{ width: '100%' }}
      />
    </div>
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontSize: 10, color: '#666' }}>Brightness</span>
      <input
        type="range"
        min={0}
        max={2}
        step={0.1}
        value={currentStyle.brightness ?? 1}
        onChange={(e) => handleStyleChange({ brightness: Number(e.target.value) })}
        style={{ width: '100%' }}
      />
    </div>
    <div>
      <span style={{ fontSize: 10, color: '#666' }}>Contrast</span>
      <input
        type="range"
        min={0}
        max={2}
        step={0.1}
        value={currentStyle.contrast ?? 1}
        onChange={(e) => handleStyleChange({ contrast: Number(e.target.value) })}
        style={{ width: '100%' }}
      />
    </div>
    <div style={{ marginTop: 8 }}>
      <span style={{ fontSize: 10, color: '#666' }}>Saturate</span>
      <input
        type="range"
        min={0}
        max={2}
        step={0.1}
        value={currentStyle.saturate ?? 1}
        onChange={(e) => handleStyleChange({ saturate: Number(e.target.value) })}
        style={{ width: '100%' }}
      />
    </div>
    <div style={{ marginTop: 8 }}>
      <span style={{ fontSize: 10, color: '#666' }}>Hue Rotate</span>
      <input
        type="range"
        min={0}
        max={360}
        value={currentStyle.hueRotate ?? 0}
        onChange={(e) => handleStyleChange({ hueRotate: Number(e.target.value) })}
        style={{ width: '100%' }}
      />
    </div>
    <div style={{ marginTop: 8 }}>
      <span style={{ fontSize: 10, color: '#666' }}>Invert</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.1}
        value={currentStyle.invert ?? 0}
        onChange={(e) => handleStyleChange({ invert: Number(e.target.value) })}
        style={{ width: '100%' }}
      />
    </div>
    <div style={{ marginTop: 8 }}>
      <span style={{ fontSize: 10, color: '#666' }}>Grayscale</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.1}
        value={currentStyle.grayscale ?? 0}
        onChange={(e) => handleStyleChange({ grayscale: Number(e.target.value) })}
        style={{ width: '100%' }}
      />
    </div>
    <div style={{ marginTop: 8 }}>
      <span style={{ fontSize: 10, color: '#666' }}>Sepia</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.1}
        value={currentStyle.sepia ?? 0}
        onChange={(e) => handleStyleChange({ sepia: Number(e.target.value) })}
        style={{ width: '100%' }}
      />
    </div>
  </div>

  {/* Drop Shadow */}
  <div style={{ marginBottom: 20 }}>
    <Label>混合模式</Label>
    <select
      value={currentStyle.blendMode || 'normal'}
      onChange={(e) => handleStyleChange({ blendMode: e.target.value })}
      style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: '6px 8px', color: '#fff', fontSize: 12 }}
    >
      <option value="normal">Normal</option>
      <option value="multiply">Multiply</option>
      <option value="screen">Screen</option>
      <option value="overlay">Overlay</option>
      <option value="darken">Darken</option>
      <option value="lighten">Lighten</option>
      <option value="color-dodge">Color Dodge</option>
      <option value="color-burn">Color Burn</option>
      <option value="difference">Difference</option>
      <option value="exclusion">Exclusion</option>
    </select>
  </div>

  {/* Backdrop Blur */}
  <div style={{ marginBottom: 20 }}>
    <Label>背景模糊</Label>
    <input
      type="range"
      min={0}
      max={30}
      value={currentStyle.backdropBlur ?? 0}
      onChange={(e) => handleStyleChange({ backdropBlur: Number(e.target.value) })}
      style={{ width: '100%' }}
    />
  </div>

  {/* Drop Shadow */}
  <div style={{ marginBottom: 20 }}>
    <Label>投影</Label>
    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
      <button onClick={() => handleStyleChange({ dropShadowX: 0, dropShadowY: 4, dropShadowBlur: 8, dropShadowColor: '#00000040' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Soft</button>
      <button onClick={() => handleStyleChange({ dropShadowX: 0, dropShadowY: 8, dropShadowBlur: 24, dropShadowColor: '#00000060' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Medium</button>
      <button onClick={() => handleStyleChange({ dropShadowX: 0, dropShadowY: 16, dropShadowBlur: 48, dropShadowColor: '#00000080' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Heavy</button>
      <button onClick={() => handleStyleChange({ dropShadowX: 0, dropShadowY: 0, dropShadowBlur: 0, dropShadowColor: '#000000' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>None</button>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <div>
        <span style={{ fontSize: 10, color: '#666' }}>X</span>
        <input type="number" value={currentStyle.dropShadowX ?? 0} onChange={(e) => handleStyleChange({ dropShadowX: Number(e.target.value) })} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, padding: 4, color: '#fff' }} />
      </div>
      <div>
        <span style={{ fontSize: 10, color: '#666' }}>Y</span>
        <input type="number" value={currentStyle.dropShadowY ?? 0} onChange={(e) => handleStyleChange({ dropShadowY: Number(e.target.value) })} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, padding: 4, color: '#fff' }} />
      </div>
      <div>
        <span style={{ fontSize: 10, color: '#666' }}>Blur</span>
        <input type="number" min={0} value={currentStyle.dropShadowBlur ?? 0} onChange={(e) => handleStyleChange({ dropShadowBlur: Number(e.target.value) })} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, padding: 4, color: '#fff' }} />
      </div>
      <div>
        <span style={{ fontSize: 10, color: '#666' }}>Color</span>
        <input type="color" value={currentStyle.dropShadowColor ?? '#000000'} onChange={(e) => handleStyleChange({ dropShadowColor: e.target.value })} style={{ width: '100%', height: 28, border: '1px solid #333', borderRadius: 4, cursor: 'pointer' }} />
      </div>
    </div>
  </div>

  {/* Border Radius Control */}
  <div style={{ marginBottom: 20 }}>
    <Label>圆角</Label>
    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
      <button onClick={() => handleStyleChange({ borderRadius: 0 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 2, color: '#888', fontSize: 10, cursor: 'pointer' }}>0</button>
      <button onClick={() => handleStyleChange({ borderRadius: 8 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 10, cursor: 'pointer' }}>8</button>
      <button onClick={() => handleStyleChange({ borderRadius: 16 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, color: '#888', fontSize: 10, cursor: 'pointer' }}>16</button>
      <button onClick={() => handleStyleChange({ borderRadius: 999 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#888', fontSize: 10, cursor: 'pointer' }}>Full</button>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <input
        type="number"
        min={0}
        value={currentStyle.borderRadius ?? 8}
        onChange={(e) => handleStyleChange({ borderRadius: Number(e.target.value) })}
        style={{ ...inputStyle, flex: 1 }}
        placeholder="All corners"
      />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      <div>
        <span style={{ fontSize: 9, color: '#555' }}>TL</span>
        <input
          type="number"
          min={0}
          value={currentStyle.borderRadiusTL ?? ''}
          onChange={(e) => handleStyleChange({ 
            borderRadiusTL: e.target.value ? Number(e.target.value) : undefined 
          })}
          style={inputStyle}
          placeholder="—"
        />
      </div>
      <div>
        <span style={{ fontSize: 9, color: '#555' }}>TR</span>
        <input
          type="number"
          min={0}
          value={currentStyle.borderRadiusTR ?? ''}
          onChange={(e) => handleStyleChange({ 
            borderRadiusTR: e.target.value ? Number(e.target.value) : undefined 
          })}
          style={inputStyle}
          placeholder="—"
        />
      </div>
      <div>
        <span style={{ fontSize: 9, color: '#555' }}>BL</span>
        <input
          type="number"
          min={0}
          value={currentStyle.borderRadiusBL ?? ''}
          onChange={(e) => handleStyleChange({ 
            borderRadiusBL: e.target.value ? Number(e.target.value) : undefined 
          })}
          style={inputStyle}
          placeholder="—"
        />
      </div>
      <div>
        <span style={{ fontSize: 9, color: '#555' }}>BR</span>
        <input
          type="number"
          min={0}
          value={currentStyle.borderRadiusBR ?? ''}
          onChange={(e) => handleStyleChange({ 
            borderRadiusBR: e.target.value ? Number(e.target.value) : undefined 
          })}
          style={inputStyle}
          placeholder="—"
        />
      </div>
    </div>
  </div>

  {/* Rotation Control */}
  <div style={{ marginBottom: 20 }}>
    <Label>旋转</Label>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="range"
        min={-180}
        max={180}
        value={currentStyle.rotation ?? 0}
        onChange={(e) => handleStyleChange({ rotation: Number(e.target.value) })}
        style={{ flex: 1 }}
      />
      <input
        type="number"
        value={currentStyle.rotation ?? 0}
        onChange={(e) => handleStyleChange({ rotation: Number(e.target.value) })}
        style={{ ...inputStyle, width: 50 }}
      />
      <button
        onClick={() => handleStyleChange({ rotation: 0 })}
        style={{ padding: '4px 8px', background: '#333', border: 'none', borderRadius: 4, color: '#888', fontSize: 10, cursor: 'pointer' }}
      >
        Reset
      </button>
    </div>
    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
      {[45, 90, 180, 270, -45].map(deg => (
        <button
          key={deg}
          onClick={() => handleStyleChange({ rotation: deg })}
          style={{ flex: 1, padding: '4px', background: '#222', border: 'none', borderRadius: 4, color: '#666', fontSize: 10, cursor: 'pointer' }}
        >
          {deg}°
        </button>
      ))}
    </div>
  </div>

  {/* Flip Controls */}
  <div style={{ marginBottom: 20 }}>
    <Label>翻转</Label>
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={() => handleStyleChange({ flipX: !currentStyle.flipX })}
        style={{
          ...alignBtnStyle,
          flex: 1,
          background: currentStyle.flipX ? '#2563eb30' : '#0d0d0e',
        }}
      >
        ↔ Horizontal
      </button>
      <button
        onClick={() => handleStyleChange({ flipY: !currentStyle.flipY })}
        style={{
          ...alignBtnStyle,
          flex: 1,
          background: currentStyle.flipY ? '#2563eb30' : '#0d0d0e',
        }}
      >
        ↕ Vertical
      </button>
    </div>
  </div>

  {selected.shapeType === 'image' && (
    <>
      <div style={{ marginBottom: 16 }}>
        <Label>适应方式</Label>
        <select
          value={currentStyle.objectFit || 'cover'}
          onChange={(e) => handleStyleChange({ objectFit: e.target.value as 'cover' | 'contain' | 'fill' })}
          style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: '6px 8px', color: '#fff', fontSize: 12 }}
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="fill">Fill</option>
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Label>对象位置</Label>
        <select
          value={currentStyle.objectPosition || 'center'}
          onChange={(e) => handleStyleChange({ objectPosition: e.target.value })}
          style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: '6px 8px', color: '#fff', fontSize: 12 }}
        >
          <option value="center">Center</option>
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </div>
    </>
  )}

  {isLineElement && (
    <div style={{ marginBottom: 16 }}>
      <Label>箭头</Label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => handleStyleChange({ lineEndArrow: !currentStyle.lineEndArrow })}
          style={{
            flex: 1,
            padding: '6px',
            background: currentStyle.lineEndArrow ? '#2563eb30' : 'transparent',
            border: '1px solid #333',
            borderRadius: 6,
            color: '#fff',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          End Arrow {currentStyle.lineEndArrow ? '✓' : ''}
        </button>
      </div>
    </div>
  )}

  {isTextElement && (
    <>
      <div style={{ marginBottom: 16 }}>
        <Label>内容</Label>
        <textarea
          value={selected.text || ''}
          onChange={(e) => updateElement(selected.id, { text: e.target.value })}
          style={{
            width: '100%',
            minHeight: 72,
            padding: '8px 10px',
            background: '#0d0d0e',
            border: '1px solid #2a2a2a',
            borderRadius: 6,
            color: '#e5e5e5',
            fontSize: 13,
          }}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>字体</Label>
        <select
          value={currentStyle.fontFamily || 'Inter, sans-serif'}
          onChange={(e) => handleStyleChange({ fontFamily: e.target.value })}
          style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: '6px 8px', color: '#fff', fontSize: 12 }}
        >
          <option value="Inter, sans-serif">Inter</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="monospace">Monospace</option>
          <option value="cursive">Cursive</option>
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Label>字号</Label>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          <button onClick={() => handleStyleChange({ fontSize: 12 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>12</button>
          <button onClick={() => handleStyleChange({ fontSize: 16 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>16</button>
          <button onClick={() => handleStyleChange({ fontSize: 24 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>24</button>
          <button onClick={() => handleStyleChange({ fontSize: 48 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>48</button>
          <button onClick={() => handleStyleChange({ fontSize: 72 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>72</button>
        </div>
        <input
          type="number"
          value={currentStyle.fontSize ?? 18}
          onChange={(e) => handleStyleChange({ fontSize: Number(e.target.value) })}
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>文字颜色</Label>
        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
          <button onClick={() => handleStyleChange({ textColor: '#ffffff' })} style={{ width: 20, height: 20, background: '#ffffff', border: '1px solid #333', borderRadius: 4, cursor: 'pointer' }} />
          <button onClick={() => handleStyleChange({ textColor: '#000000' })} style={{ width: 20, height: 20, background: '#000000', border: '1px solid #333', borderRadius: 4, cursor: 'pointer' }} />
          <button onClick={() => handleStyleChange({ textColor: '#ef4444' })} style={{ width: 20, height: 20, background: '#ef4444', border: '1px solid #333', borderRadius: 4, cursor: 'pointer' }} />
          <button onClick={() => handleStyleChange({ textColor: '#3b82f6' })} style={{ width: 20, height: 20, background: '#3b82f6', border: '1px solid #333', borderRadius: 4, cursor: 'pointer' }} />
        </div>
        <input
          type="color"
          value={currentStyle.textColor || '#ffffff'}
          onChange={(e) => handleStyleChange({ textColor: e.target.value })}
          style={{ width: '100%', height: 32 }}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>内边距</Label>
        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
          <button onClick={() => handleStyleChange({ padding: 0 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>0</button>
          <button onClick={() => handleStyleChange({ padding: 8 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>8</button>
          <button onClick={() => handleStyleChange({ padding: 16 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>16</button>
          <button onClick={() => handleStyleChange({ padding: 24 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>24</button>
        </div>
        <input
          type="number"
          min={0}
          value={currentStyle.padding ?? 0}
          onChange={(e) => handleStyleChange({ padding: Number(e.target.value) })}
          style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, padding: 6, color: '#fff', fontSize: 11 }}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>文字阴影</Label>
        <input
          type="text"
          value={currentStyle.textShadow || ''}
          onChange={(e) => handleStyleChange({ textShadow: e.target.value })}
          placeholder="2px 2px 4px #000"
          style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, padding: 6, color: '#fff', fontSize: 11 }}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>文字变换</Label>
        <select
          value={currentStyle.textTransform || 'none'}
          onChange={(e) => handleStyleChange({ textTransform: e.target.value })}
          style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: '6px 8px', color: '#fff', fontSize: 12 }}
        >
          <option value="none">None</option>
          <option value="uppercase">UPPERCASE</option>
          <option value="lowercase">lowercase</option>
          <option value="capitalize">Capitalize</option>
        </select>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>字重</Label>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => handleStyleChange({ fontWeight: 'normal' })}
            style={{
              flex: 1,
              padding: '6px 0',
              borderRadius: 6,
              border: (currentStyle.fontWeight ?? 'normal') === 'normal' ? '1px solid #2563eb' : '1px solid #2a2a2a',
              background: (currentStyle.fontWeight ?? 'normal') === 'normal' ? '#2563eb20' : 'transparent',
              color: '#fff',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Normal
          </button>
          <button
            onClick={() => handleStyleChange({ fontWeight: 'bold' })}
            style={{
              flex: 1,
              padding: '6px 0',
              borderRadius: 6,
              border: currentStyle.fontWeight === 'bold' ? '1px solid #2563eb' : '1px solid #2a2a2a',
              background: currentStyle.fontWeight === 'bold' ? '#2563eb20' : 'transparent',
              color: '#fff',
              fontSize: 12,
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Bold
          </button>
          <button
            onClick={() => handleStyleChange({ fontStyle: currentStyle.fontStyle === 'italic' ? 'normal' : 'italic' })}
            style={{
              flex: 1,
              padding: '6px 0',
              borderRadius: 6,
              border: currentStyle.fontStyle === 'italic' ? '1px solid #2563eb' : '1px solid #2a2a2a',
              background: currentStyle.fontStyle === 'italic' ? '#2563eb20' : 'transparent',
              color: '#fff',
              fontSize: 12,
              fontStyle: 'italic',
              cursor: 'pointer',
            }}
          >
            Italic
          </button>
          <button
            onClick={() => handleStyleChange({ textDecoration: currentStyle.textDecoration === 'underline' ? 'none' : 'underline' })}
            style={{
              flex: 1,
              padding: '6px 0',
              borderRadius: 6,
              border: currentStyle.textDecoration === 'underline' ? '1px solid #2563eb' : '1px solid #2a2a2a',
              background: currentStyle.textDecoration === 'underline' ? '#2563eb20' : 'transparent',
              color: '#fff',
              fontSize: 12,
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            U
          </button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>字间距</Label>
        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
          <button onClick={() => handleStyleChange({ letterSpacing: 0 })} style={{ flex: 1, padding: 3, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>0</button>
          <button onClick={() => handleStyleChange({ letterSpacing: 1 })} style={{ flex: 1, padding: 3, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>1</button>
          <button onClick={() => handleStyleChange({ letterSpacing: 2 })} style={{ flex: 1, padding: 3, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>2</button>
        </div>
        <input
          type="number"
          value={currentStyle.letterSpacing ?? 0}
          onChange={(e) => handleStyleChange({ letterSpacing: Number(e.target.value) })}
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>行高</Label>
        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
          <button onClick={() => handleStyleChange({ lineHeight: 1 })} style={{ flex: 1, padding: 3, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>1</button>
          <button onClick={() => handleStyleChange({ lineHeight: 1.4 })} style={{ flex: 1, padding: 3, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>1.4</button>
          <button onClick={() => handleStyleChange({ lineHeight: 1.8 })} style={{ flex: 1, padding: 3, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>1.8</button>
        </div>
        <input
          type="number"
          step="0.1"
          value={currentStyle.lineHeight ?? 1.4}
          onChange={(e) => handleStyleChange({ lineHeight: Number(e.target.value) })}
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>对齐</Label>
        <div style={{ display: 'flex', gap: 6 }}>
          {TEXT_ALIGNMENTS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleStyleChange({ textAlign: option.id })}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: 6,
                border: activeAlign === option.id ? '1px solid #2563eb' : '1px solid #2a2a2a',
                background: activeAlign === option.id ? '#2563eb20' : 'transparent',
                color: activeAlign === option.id ? '#fff' : '#888',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>垂直对齐</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ verticalAlign: 'top' })} style={{ flex: 1, padding: 4, background: currentStyle.verticalAlign === 'top' ? '#2563eb20' : '#1a1a1a', border: currentStyle.verticalAlign === 'top' ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Top</button>
          <button onClick={() => handleStyleChange({ verticalAlign: 'middle' })} style={{ flex: 1, padding: 4, background: (currentStyle.verticalAlign ?? 'middle') === 'middle' ? '#2563eb20' : '#1a1a1a', border: (currentStyle.verticalAlign ?? 'middle') === 'middle' ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Mid</button>
          <button onClick={() => handleStyleChange({ verticalAlign: 'bottom' })} style={{ flex: 1, padding: 4, background: currentStyle.verticalAlign === 'bottom' ? '#2563eb20' : '#1a1a1a', border: currentStyle.verticalAlign === 'bottom' ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Bot</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>文字换行</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ whiteSpace: 'nowrap' })} style={{ flex: 1, padding: 4, background: currentStyle.whiteSpace === 'nowrap' ? '#2563eb20' : '#1a1a1a', border: currentStyle.whiteSpace === 'nowrap' ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>No</button>
          <button onClick={() => handleStyleChange({ whiteSpace: 'normal' })} style={{ flex: 1, padding: 4, background: (currentStyle.whiteSpace ?? 'normal') === 'normal' ? '#2563eb20' : '#1a1a1a', border: (currentStyle.whiteSpace ?? 'normal') === 'normal' ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Wrap</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>溢出</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ overflow: 'visible' })} style={{ flex: 1, padding: 4, background: (currentStyle.overflow ?? 'visible') === 'visible' ? '#2563eb20' : '#1a1a1a', border: (currentStyle.overflow ?? 'visible') === 'visible' ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Show</button>
          <button onClick={() => handleStyleChange({ overflow: 'hidden' })} style={{ flex: 1, padding: 4, background: currentStyle.overflow === 'hidden' ? '#2563eb20' : '#1a1a1a', border: currentStyle.overflow === 'hidden' ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Hide</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>光标</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ cursor: 'default' })} style={{ flex: 1, padding: 4, background: (currentStyle.cursor ?? 'default') === 'default' ? '#2563eb20' : '#1a1a1a', border: (currentStyle.cursor ?? 'default') === 'default' ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>↖</button>
          <button onClick={() => handleStyleChange({ cursor: 'pointer' })} style={{ flex: 1, padding: 4, background: currentStyle.cursor === 'pointer' ? '#2563eb20' : '#1a1a1a', border: currentStyle.cursor === 'pointer' ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>👆</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>指针事件</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ pointerEvents: 'auto' })} style={{ flex: 1, padding: 4, background: (currentStyle.pointerEvents ?? 'auto') === 'auto' ? '#2563eb20' : '#1a1a1a', border: (currentStyle.pointerEvents ?? 'auto') === 'auto' ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>On</button>
          <button onClick={() => handleStyleChange({ pointerEvents: 'none' })} style={{ flex: 1, padding: 4, background: currentStyle.pointerEvents === 'none' ? '#2563eb20' : '#1a1a1a', border: currentStyle.pointerEvents === 'none' ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Off</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>文字选择</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ userSelect: 'auto' })} style={{ flex: 1, padding: 4, background: (currentStyle.userSelect ?? 'auto') === 'auto' ? '#2563eb20' : '#1a1a1a', border: (currentStyle.userSelect ?? 'auto') === 'auto' ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>On</button>
          <button onClick={() => handleStyleChange({ userSelect: 'none' })} style={{ flex: 1, padding: 4, background: currentStyle.userSelect === 'none' ? '#2563eb20' : '#1a1a1a', border: currentStyle.userSelect === 'none' ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Off</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>变换原点</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ transformOrigin: 'center' })} style={{ flex: 1, padding: 4, background: (currentStyle.transformOrigin ?? 'center') === 'center' ? '#2563eb20' : '#1a1a1a', border: (currentStyle.transformOrigin ?? 'center') === 'center' ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>⊙</button>
          <button onClick={() => handleStyleChange({ transformOrigin: 'top left' })} style={{ flex: 1, padding: 4, background: currentStyle.transformOrigin === 'top left' ? '#2563eb20' : '#1a1a1a', border: currentStyle.transformOrigin === 'top left' ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>↖</button>
          <button onClick={() => handleStyleChange({ transformOrigin: 'top right' })} style={{ flex: 1, padding: 4, background: currentStyle.transformOrigin === 'top right' ? '#2563eb20' : '#1a1a1a', border: currentStyle.transformOrigin === 'top right' ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>↗</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>缩放</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ scale: 0.5 })} style={{ flex: 1, padding: 4, background: currentStyle.scale === 0.5 ? '#2563eb20' : '#1a1a1a', border: currentStyle.scale === 0.5 ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>50%</button>
          <button onClick={() => handleStyleChange({ scale: 1 })} style={{ flex: 1, padding: 4, background: (currentStyle.scale ?? 1) === 1 ? '#2563eb20' : '#1a1a1a', border: (currentStyle.scale ?? 1) === 1 ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>100%</button>
          <button onClick={() => handleStyleChange({ scale: 1.5 })} style={{ flex: 1, padding: 4, background: currentStyle.scale === 1.5 ? '#2563eb20' : '#1a1a1a', border: currentStyle.scale === 1.5 ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>150%</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>倾斜</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ skewX: -15 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>-15°</button>
          <button onClick={() => handleStyleChange({ skewX: 0, skewY: 0 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>0°</button>
          <button onClick={() => handleStyleChange({ skewX: 15 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>15°</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>透视</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ perspective: 0 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>None</button>
          <button onClick={() => handleStyleChange({ perspective: 500 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>500</button>
          <button onClick={() => handleStyleChange({ perspective: 1000 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>1000</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>盒模型</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ boxSizing: 'border-box' })} style={{ flex: 1, padding: 4, background: (currentStyle.boxSizing ?? 'border-box') === 'border-box' ? '#2563eb20' : '#1a1a1a', border: (currentStyle.boxSizing ?? 'border-box') === 'border-box' ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Border</button>
          <button onClick={() => handleStyleChange({ boxSizing: 'content-box' })} style={{ flex: 1, padding: 4, background: currentStyle.boxSizing === 'content-box' ? '#2563eb20' : '#1a1a1a', border: currentStyle.boxSizing === 'content-box' ? '1px solid #2563eb' : '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Content</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>轮廓</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ outline: 'none' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>None</button>
          <button onClick={() => handleStyleChange({ outline: '2px solid #3b82f6' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Blue</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>背景模糊</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ backdropFilter: 'none' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>0</button>
          <button onClick={() => handleStyleChange({ backdropFilter: 'blur(8px)' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>8</button>
          <button onClick={() => handleStyleChange({ backdropFilter: 'blur(16px)' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>16</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>过渡</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ transition: 'none' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>None</button>
          <button onClick={() => handleStyleChange({ transition: 'all 0.3s ease' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>0.3s</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>宽高比</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ aspectRatio: 'auto' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Auto</button>
          <button onClick={() => handleStyleChange({ aspectRatio: '1/1' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>1:1</button>
          <button onClick={() => handleStyleChange({ aspectRatio: '16/9' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>16:9</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>适应方式</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ objectFit: 'cover' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Cover</button>
          <button onClick={() => handleStyleChange({ objectFit: 'contain' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Contain</button>
          <button onClick={() => handleStyleChange({ objectFit: 'fill' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Fill</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>弹性方向</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ flexDirection: 'row' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Row</button>
          <button onClick={() => handleStyleChange({ flexDirection: 'column' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Col</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>Justify</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ justifyContent: 'flex-start' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Start</button>
          <button onClick={() => handleStyleChange({ justifyContent: 'center' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Center</button>
          <button onClick={() => handleStyleChange({ justifyContent: 'flex-end' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>End</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>Align</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ alignItems: 'flex-start' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Start</button>
          <button onClick={() => handleStyleChange({ alignItems: 'center' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Center</button>
          <button onClick={() => handleStyleChange({ alignItems: 'flex-end' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>End</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>Gap</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ gap: 0 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>0</button>
          <button onClick={() => handleStyleChange({ gap: 8 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>8</button>
          <button onClick={() => handleStyleChange({ gap: 16 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>16</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>Z-Index</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ zIndex: 0 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>0</button>
          <button onClick={() => handleStyleChange({ zIndex: 10 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>10</button>
          <button onClick={() => handleStyleChange({ zIndex: 100 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>100</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>Visibility</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ visibility: 'visible' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Show</button>
          <button onClick={() => handleStyleChange({ visibility: 'hidden' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Hide</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>Isolation</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ isolation: 'auto' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Auto</button>
          <button onClick={() => handleStyleChange({ isolation: 'isolate' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Isolate</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>Backface</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ backfaceVisibility: 'visible' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Show</button>
          <button onClick={() => handleStyleChange({ backfaceVisibility: 'hidden' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Hide</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>Transform Style</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ transformStyle: 'flat' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Flat</button>
          <button onClick={() => handleStyleChange({ transformStyle: 'preserve-3d' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>3D</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>Clip Path</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ clipPath: 'none' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>None</button>
          <button onClick={() => handleStyleChange({ clipPath: 'circle(50%)' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Circle</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>Mask</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ maskImage: 'none' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>None</button>
          <button onClick={() => handleStyleChange({ maskImage: 'linear-gradient(black, transparent)' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Fade</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>文字阴影</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ textShadow: 'none' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>无</button>
          <button onClick={() => handleStyleChange({ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Soft</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>Word Break</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ wordBreak: 'normal' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Normal</button>
          <button onClick={() => handleStyleChange({ wordBreak: 'break-all' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Break</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>Text Overflow</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ textOverflow: 'clip' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Clip</button>
          <button onClick={() => handleStyleChange({ textOverflow: 'ellipsis' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>...</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>Hyphens</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ hyphens: 'none' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>None</button>
          <button onClick={() => handleStyleChange({ hyphens: 'auto' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Auto</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>Writing Mode</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ writingMode: 'horizontal-tb' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>H</button>
          <button onClick={() => handleStyleChange({ writingMode: 'vertical-rl' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>V</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>Text Indent</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ textIndent: 0 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>0</button>
          <button onClick={() => handleStyleChange({ textIndent: 16 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>16</button>
          <button onClick={() => handleStyleChange({ textIndent: 32 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>32</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>Columns</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ columnCount: 1 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>1</button>
          <button onClick={() => handleStyleChange({ columnCount: 2 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>2</button>
          <button onClick={() => handleStyleChange({ columnCount: 3 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>3</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>Column Gap</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ columnGap: 8 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>8</button>
          <button onClick={() => handleStyleChange({ columnGap: 16 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>16</button>
          <button onClick={() => handleStyleChange({ columnGap: 24 })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>24</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>List Style</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ listStyle: 'none' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>None</button>
          <button onClick={() => handleStyleChange({ listStyle: 'disc' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>•</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>Caret Color</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ caretColor: 'auto' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Auto</button>
          <button onClick={() => handleStyleChange({ caretColor: '#3b82f6' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#3b82f6', fontSize: 9, cursor: 'pointer' }}>Blue</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Label>Accent Color</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => handleStyleChange({ accentColor: 'auto' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 9, cursor: 'pointer' }}>Auto</button>
          <button onClick={() => handleStyleChange({ accentColor: '#3b82f6' })} style={{ flex: 1, padding: 4, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#3b82f6', fontSize: 9, cursor: 'pointer' }}>Blue</button>
        </div>
      </div>
    </>
  )}
</>
  );
}
