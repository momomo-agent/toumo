import { useEditorStore } from '../store';

const FRAME_PRESETS = [
  { id: 'iphone14', label: 'iPhone 14', size: { width: 390, height: 844 } },
  { id: 'iphone14pro', label: 'iPhone 14 Pro', size: { width: 393, height: 852 } },
  { id: 'iphonese', label: 'iPhone SE', size: { width: 375, height: 667 } },
  { id: 'android', label: 'Android', size: { width: 360, height: 800 } },
  { id: 'ipad', label: 'iPad', size: { width: 820, height: 1180 } },
];

type ToolButton = {
  id: 'select' | 'rectangle' | 'ellipse' | 'text' | 'hand';
  icon: string;
  label: string;
};

const tools: ToolButton[] = [
  { id: 'select', icon: '↖', label: 'Select (V)' },
  { id: 'rectangle', icon: '▢', label: 'Rectangle (R)' },
  { id: 'ellipse', icon: '○', label: 'Ellipse (O)' },
  { id: 'text', icon: 'T', label: 'Text (T)' },
  { id: 'hand', icon: '✋', label: 'Hand (H)' },
];

export function EditorToolbar() {
  const currentTool = useEditorStore((s) => s.currentTool);
  const setCurrentTool = useEditorStore((s) => s.setCurrentTool);
  const frameSize = useEditorStore((s) => s.frameSize);
  const setFrameSize = useEditorStore((s) => s.setFrameSize);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const history = useEditorStore((s) => s.history);
  const historyIndex = useEditorStore((s) => s.historyIndex);

  const activePresetId =
    FRAME_PRESETS.find(
      (preset) => preset.size.width === frameSize.width && preset.size.height === frameSize.height
    )?.id ?? 'custom';

  const handlePresetChange = (id: string) => {
    if (id === 'custom') return;
    const preset = FRAME_PRESETS.find((p) => p.id === id);
    if (preset) {
      setFrameSize(preset.size);
    }
  };

  const handleFrameSizeInputChange = (dimension: 'width' | 'height', value: number) => {
    const numericValue = Number.isFinite(value) ? value : frameSize[dimension];
    const safeValue = Math.max(100, Math.min(2000, numericValue));
    setFrameSize({ ...frameSize, [dimension]: safeValue });
  };

  return (
    <div
      style={{
        height: 48,
        borderBottom: '1px solid #2a2a2a',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 6,
      }}
    >
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setCurrentTool(tool.id)}
          tabIndex={0}
          role="radio"
          aria-checked={currentTool === tool.id}
          aria-label={tool.label}
          title={tool.label}
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: currentTool === tool.id ? '#2563eb' : 'transparent',
            border: 'none',
            borderRadius: 6,
            color: currentTool === tool.id ? '#fff' : '#888',
            cursor: 'pointer',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 2px #2563eb';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseEnter={(e) => {
            if (currentTool !== tool.id) {
              e.currentTarget.style.background = '#1f1f1f';
              e.currentTarget.style.color = '#fff';
            }
          }}
          onMouseLeave={(e) => {
            if (currentTool !== tool.id) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#888';
            }
          }}
        >
          {tool.icon}
        </button>
      ))}
      <div style={{ width: 1, height: 24, background: '#2a2a2a', margin: '0 12px' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: 10, color: '#666', textTransform: 'uppercase' }}>Frame</label>
          <select
            value={activePresetId}
            onChange={(event) => handlePresetChange(event.target.value)}
            style={{
              background: '#111',
              color: '#fff',
              borderRadius: 6,
              border: '1px solid #2a2a2a',
              padding: '4px 8px',
              fontSize: 12,
            }}
          >
            {FRAME_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label} ({preset.size.width}×{preset.size.height})
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#666' }}>W</span>
          <input
            type="number"
            value={frameSize.width}
            onChange={(event) => handleFrameSizeInputChange('width', Number(event.target.value))}
            style={{
              width: 72,
              padding: '6px 8px',
              background: '#101010',
              border: '1px solid #2a2a2a',
              borderRadius: 6,
              color: '#e5e5e5',
            }}
          />
          <span style={{ fontSize: 11, color: '#666' }}>H</span>
          <input
            type="number"
            value={frameSize.height}
            onChange={(event) => handleFrameSizeInputChange('height', Number(event.target.value))}
            style={{
              width: 72,
              padding: '6px 8px',
              background: '#101010',
              border: '1px solid #2a2a2a',
              borderRadius: 6,
              color: '#e5e5e5',
            }}
          />
        </div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#555', marginRight: 4 }}>
          {historyIndex}/{history.length - 1}
        </span>
        <button
          style={{
            border: '1px solid #333',
            borderRadius: 6,
            padding: '6px 10px',
            background: 'transparent',
            color: historyIndex <= 0 ? '#444' : '#888',
            cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer',
            opacity: historyIndex <= 0 ? 0.5 : 1,
          }}
          onClick={undo}
          disabled={historyIndex <= 0}
          title="撤销 (⌘Z)"
        >↩ 撤销</button>
        <button
          style={{
            border: '1px solid #333',
            borderRadius: 6,
            padding: '6px 10px',
            background: 'transparent',
            color: historyIndex >= history.length - 1 ? '#444' : '#888',
            cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer',
            opacity: historyIndex >= history.length - 1 ? 0.5 : 1,
          }}
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          title="重做 (⌘⇧Z)"
        >重做 ↪</button>
      </div>
    </div>
  );
}
