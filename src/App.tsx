import { useState, useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { InteractionManager } from './components/InteractionManager';
import { StateInspector } from './components/Inspector/StateInspector';
import { TransitionInspector } from './components/Inspector/TransitionInspector';
import { useEditorStore } from './store';
import type { ShapeStyle } from './types';
import { DEFAULT_STYLE as BASE_STYLE } from './types';

const DEFAULT_STYLE: ShapeStyle = {
  ...BASE_STYLE,
  textAlign: 'left',
};

const COLOR_PRESETS = ['#6366f1', '#22d3ee', '#22c55e', '#f97316', '#f43f5e', '#eab308', '#a855f7'];

const TEXT_ALIGNMENTS: Array<{ id: NonNullable<ShapeStyle['textAlign']>; label: string }> = [
  { id: 'left', label: 'L' },
  { id: 'center', label: 'C' },
  { id: 'right', label: 'R' },
];

const FRAME_PRESETS = [
  { id: 'iphone14', label: 'iPhone 14', size: { width: 390, height: 844 } },
  { id: 'iphone14pro', label: 'iPhone 14 Pro', size: { width: 393, height: 852 } },
  { id: 'iphonese', label: 'iPhone SE', size: { width: 375, height: 667 } },
  { id: 'android', label: 'Android', size: { width: 360, height: 800 } },
  { id: 'ipad', label: 'iPad', size: { width: 820, height: 1180 } },
];

const mergeStyle = (style?: ShapeStyle, overrides: Partial<ShapeStyle> = {}): ShapeStyle => ({
  ...DEFAULT_STYLE,
  ...style,
  ...overrides,
});

type ToolButton = {
  id: 'select' | 'rectangle' | 'ellipse' | 'text' | 'hand';
  icon: string;
  label: string;
};

export default function App() {
  const {
    keyframes,
    selectedKeyframeId,
    setSelectedKeyframeId,
    addKeyframe,
    selectedElementId,
    setSelectedElementId,
    selectedTransitionId,
    deleteSelectedElements,
    currentTool,
    setCurrentTool,
    copySelectedElements,
    pasteElements,
    undo,
    redo,
    updateElement,
    frameSize,
    setFrameSize,
  } = useEditorStore();

  const [previewState, setPreviewState] = useState(keyframes[0]?.id ?? 'kf-idle');

  const selectedKeyframe = keyframes.find((kf) => kf.id === selectedKeyframeId);
  const elements = selectedKeyframe?.keyElements || [];
  const selectedElement = elements.find((el) => el.id === selectedElementId);

  const previewKeyframe = keyframes.find((kf) => kf.id === previewState);
  const previewElements = previewKeyframe?.keyElements || [];

  const activePresetId = FRAME_PRESETS.find(
    (preset) => preset.size.width === frameSize.width && preset.size.height === frameSize.height
  )?.id ?? 'custom';

  const handlePresetChange = (id: string) => {
    if (id === 'custom') return;
    const preset = FRAME_PRESETS.find((preset) => preset.id === id);
    if (preset) {
      setFrameSize(preset.size);
    }
  };

  const handleFrameSizeInputChange = (dimension: 'width' | 'height', value: number) => {
    const numericValue = Number.isFinite(value) ? value : frameSize[dimension];
    const safeValue = Math.max(100, Math.min(2000, numericValue));
    setFrameSize({ ...frameSize, [dimension]: safeValue });
  };

  const previewScale = Math.min(
    (320 - 40) / frameSize.width,
    520 / frameSize.height,
    1
  );

  const handleSelectKeyframe = (keyframeId: string) => {
    setSelectedKeyframeId(keyframeId);
    setPreviewState(keyframeId);
  };

  const handleAddKeyframe = () => {
    addKeyframe();
  };

  const tools: ToolButton[] = [
    { id: 'select', icon: '↖', label: 'Select (V)' },
    { id: 'rectangle', icon: '▢', label: 'Rectangle (R)' },
    { id: 'ellipse', icon: '○', label: 'Ellipse (O)' },
    { id: 'text', icon: 'T', label: 'Text (T)' },
    { id: 'hand', icon: '✋', label: 'Hand (H)' },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
        copySelectedElements();
        event.preventDefault();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
        if (!isTyping) {
          pasteElements();
          event.preventDefault();
        }
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        event.preventDefault();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
        redo();
        event.preventDefault();
        return;
      }

      if (isTyping) return;

      switch (event.key.toLowerCase()) {
        case 'v':
          setCurrentTool('select');
          break;
        case 'r':
          setCurrentTool('rectangle');
          break;
        case 'o':
          setCurrentTool('ellipse');
          break;
        case 't':
          setCurrentTool('text');
          break;
        case 'h':
          setCurrentTool('hand');
          break;
        case 'delete':
        case 'backspace':
          deleteSelectedElements();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copySelectedElements, deleteSelectedElements, pasteElements, redo, setCurrentTool, undo]);

  useEffect(() => {
    if (!keyframes.find((kf) => kf.id === previewState) && keyframes[0]) {
      setPreviewState(keyframes[0].id);
    }
  }, [keyframes, previewState]);

  useEffect(() => {
    if (selectedKeyframeId && previewState !== selectedKeyframeId) {
      setPreviewState(selectedKeyframeId);
    }
  }, [previewState, selectedKeyframeId]);

  // Render element properties inspector
  const renderElementInspector = () => {
    const selected = selectedElement;
    if (!selected) return null;

    const currentStyle = mergeStyle(selected.style);
    const handleStyleChange = (overrides: Partial<ShapeStyle>) => {
      updateElement(selected.id, {
        style: mergeStyle(selected.style, overrides),
      });
    };
    const isTextElement = selected.shapeType === 'text';
    const activeAlign = currentStyle.textAlign ?? 'left';

    return (
      <>
        <SectionHeader>Element Properties</SectionHeader>
        <div style={{ marginBottom: 16 }}>
          <Label>Name</Label>
          <input
            type="text"
            value={selected.name}
            onChange={(e) => updateElement(selected.id, { name: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Label>Position</Label>
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
          <Label>Size</Label>
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
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <Label>Fill</Label>
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
        </div>

        {isTextElement && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Label>Content</Label>
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
            <div style={{ marginBottom: 16 }}>
              <Label>Font Size</Label>
              <input
                type="number"
                value={currentStyle.fontSize ?? 18}
                onChange={(e) => handleStyleChange({ fontSize: Number(e.target.value) })}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <Label>Alignment</Label>
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
          </>
        )}
      </>
    );
  };

  // Determine what to show in inspector
  const renderInspector = () => {
    // If a transition is selected, show transition inspector
    if (selectedTransitionId) {
      return <TransitionInspector />;
    }
    
    // If an element is selected, show element properties + state mapping
    if (selectedElement) {
      return (
        <>
          {renderElementInspector()}
          <div style={{ marginTop: 24 }}>
            <StateInspector />
          </div>
        </>
      );
    }
    
    // Default: show state mapping for current keyframe
    return <StateInspector />;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#0a0a0b',
        color: '#e5e5e5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: 13,
      }}
    >
      {/* Header */}
      <header
        style={{
          height: 48,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #2a2a2a',
          background: '#161617',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Toumo</span>
          <span style={{ color: '#666', fontSize: 12 }}>Motion Editor</span>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Live Preview Panel */}
        <div
          style={{
            width: 320,
            background: '#161617',
            borderRight: '1px solid #2a2a2a',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #2a2a2a',
              fontSize: 11,
              fontWeight: 600,
              color: '#888',
              textTransform: 'uppercase',
            }}
          >
            Live Preview
          </div>
          <div
            style={{
              flex: 1,
              margin: 16,
              background: '#0d0d0e',
              borderRadius: 12,
              position: 'relative',
              border: '1px solid #2a2a2a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: frameSize.width * previewScale,
                height: frameSize.height * previewScale,
                position: 'relative',
                borderRadius: 28,
                border: '1px solid #2f2f2f',
                background: '#050506',
                boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
                overflow: 'hidden',
              }}
            >
              {previewElements.map((el) => (
                <div
                  key={el.id}
                  style={{
                    position: 'absolute',
                    left: el.position.x * previewScale,
                    top: el.position.y * previewScale,
                    width: el.size.width * previewScale,
                    height: el.size.height * previewScale,
                    background: el.style?.fill || '#3b82f6',
                    borderRadius: el.shapeType === 'ellipse'
                      ? '50%'
                      : (el.style?.borderRadius || 8) * previewScale,
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Toolbar */}
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
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button style={{ border: '1px solid #333', borderRadius: 6, padding: '6px 10px', background: 'transparent', color: '#fff' }} onClick={undo}>Undo</button>
              <button style={{ border: '1px solid #333', borderRadius: 6, padding: '6px 10px', background: 'transparent', color: '#fff' }} onClick={redo}>Redo</button>
            </div>
          </div>

          {/* Editor Content */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Layer Manager */}
            <aside
              style={{
                width: 220,
                borderRight: '1px solid #2a2a2a',
                background: '#151515',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: 16, borderBottom: '1px solid #2a2a2a' }}>
                <h3 style={{ fontSize: 11, textTransform: 'uppercase', color: '#666', margin: 0, marginBottom: 8 }}>Layers</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {elements.length === 0 ? (
                    <span style={{ fontSize: 12, color: '#555' }}>No layers yet</span>
                  ) : (
                    elements.map((el) => (
                      <button
                        key={el.id}
                        onClick={() => setSelectedElementId(el.id)}
                        style={{
                          padding: '6px 10px',
                          background: selectedElementId === el.id ? '#2563eb30' : 'transparent',
                          border: '1px solid #2a2a2a',
                          borderRadius: 6,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              width: 12,
                              height: 12,
                              background: el.style?.fill || '#3b82f6',
                              borderRadius: 2,
                            }}
                          />
                          {el.name}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
                <h3 style={{ fontSize: 11, textTransform: 'uppercase', color: '#666', margin: 0, marginBottom: 8 }}>Display States</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {keyframes.map((kf) => (
                    <button
                      key={kf.id}
                      onClick={() => handleSelectKeyframe(kf.id)}
                      style={{
                        padding: '10px 12px',
                        background: selectedKeyframeId === kf.id ? '#2563eb20' : 'transparent',
                        border: selectedKeyframeId === kf.id ? '1px solid #2563eb' : '1px solid #2a2a2a',
                        borderRadius: 8,
                        color: '#fff',
                        textAlign: 'left',
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: 12 }}>{kf.name}</strong>
                      <span style={{ fontSize: 10, color: '#666' }}>
                        {kf.functionalState ? `→ ${kf.functionalState}` : 'No mapping'}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={handleAddKeyframe}
                    style={{
                      padding: '10px 12px',
                      border: '1px dashed #333',
                      borderRadius: 8,
                      color: '#999',
                      background: 'transparent',
                    }}
                  >
                    + Add Display State
                  </button>
                </div>
              </div>
            </aside>

            {/* Canvas + Interaction Manager */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Canvas Header */}
              <div
                style={{
                  borderBottom: '1px solid #2a2a2a',
                  padding: '0 20px',
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: 14 }}>{selectedKeyframe?.name ?? 'Untitled state'}</h2>
                  <span style={{ fontSize: 11, color: '#777' }}>{selectedKeyframe?.summary}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={copySelectedElements} style={{ border: '1px solid #333', padding: '6px 12px', borderRadius: 6, background: 'transparent', color: '#fff', fontSize: 11 }}>Copy</button>
                  <button onClick={pasteElements} style={{ border: '1px solid #333', padding: '6px 12px', borderRadius: 6, background: 'transparent', color: '#fff', fontSize: 11 }}>Paste</button>
                </div>
              </div>

              {/* Canvas Area */}
              <div style={{ flex: 1, padding: 16, minHeight: 0 }}>
                <div
                  style={{
                    height: '100%',
                    border: '1px solid #222',
                    borderRadius: 12,
                    background: '#0d0d0e',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Canvas />
                </div>
              </div>

              {/* Interaction Manager */}
              <div
                style={{
                  height: 220,
                  borderTop: '1px solid #2a2a2a',
                  background: '#111',
                }}
              >
                <InteractionManager />
              </div>
            </div>
          </div>
        </div>

        {/* Inspector Panel */}
        <div
          style={{
            width: 280,
            background: '#161617',
            borderLeft: '1px solid #2a2a2a',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #2a2a2a',
              fontSize: 11,
              fontWeight: 600,
              color: '#888',
              textTransform: 'uppercase',
            }}
          >
            Inspector
          </div>
          <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
            {renderInspector()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: '#888',
        textTransform: 'uppercase',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: '1px solid #2a2a2a',
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: '#0d0d0e',
  border: '1px solid #2a2a2a',
  borderRadius: 6,
  color: '#e5e5e5',
  fontSize: 12,
};
