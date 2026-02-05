import { useState, useEffect } from 'react';
import { Canvas } from './components/Canvas';
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
    deleteSelectedElements,
    currentTool,
    setCurrentTool,
    copySelectedElements,
    pasteElements,
    undo,
    redo,
    updateElement,
  } = useEditorStore();

  const [previewState, setPreviewState] = useState(keyframes[0]?.id ?? 'kf-idle');

  const selectedKeyframe = keyframes.find((kf) => kf.id === selectedKeyframeId);
  const elements = selectedKeyframe?.keyElements || [];
  const selectedElement = elements.find((el) => el.id === selectedElementId);

  const previewKeyframe = keyframes.find((kf) => kf.id === previewState);
  const previewElements = previewKeyframe?.keyElements || [];

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

  const renderInspector = () => {
    const selected = selectedElement;
    if (!selected) {
      return <div style={{ color: '#555' }}>Select a layer</div>;
    }

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
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Name</label>
          <input
            type="text"
            value={selected.name}
            onChange={(e) => updateElement(selected.id, { name: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: '#0d0d0e',
              border: '1px solid #2a2a2a',
              borderRadius: 6,
              color: '#e5e5e5',
            }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Position</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              value={selected.position.x}
              onChange={(e) =>
                updateElement(selected.id, {
                  position: { ...selected.position, x: Number(e.target.value) },
                })
              }
              style={{
                flex: 1,
                padding: '8px',
                background: '#0d0d0e',
                border: '1px solid #2a2a2a',
                borderRadius: 6,
                color: '#e5e5e5',
              }}
            />
            <input
              type="number"
              value={selected.position.y}
              onChange={(e) =>
                updateElement(selected.id, {
                  position: { ...selected.position, y: Number(e.target.value) },
                })
              }
              style={{
                flex: 1,
                padding: '8px',
                background: '#0d0d0e',
                border: '1px solid #2a2a2a',
                borderRadius: 6,
                color: '#e5e5e5',
              }}
            />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Size</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              value={selected.size.width}
              onChange={(e) =>
                updateElement(selected.id, {
                  size: { ...selected.size, width: Number(e.target.value) },
                })
              }
              style={{
                flex: 1,
                padding: '8px',
                background: '#0d0d0e',
                border: '1px solid #2a2a2a',
                borderRadius: 6,
                color: '#e5e5e5',
              }}
            />
            <input
              type="number"
              value={selected.size.height}
              onChange={(e) =>
                updateElement(selected.id, {
                  size: { ...selected.size, height: Number(e.target.value) },
                })
              }
              style={{
                flex: 1,
                padding: '8px',
                background: '#0d0d0e',
                border: '1px solid #2a2a2a',
                borderRadius: 6,
                color: '#e5e5e5',
              }}
            />
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Fill</label>
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
              style={{
                flex: 1,
                padding: '8px 10px',
                background: '#0d0d0e',
                border: '1px solid #2a2a2a',
                borderRadius: 6,
                color: '#e5e5e5',
                fontFamily: 'monospace',
                fontSize: 12,
              }}
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
              <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Content</label>
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
              <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Font Size</label>
              <input
                type="number"
                value={currentStyle.fontSize ?? 18}
                onChange={(e) => handleStyleChange({ fontSize: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: '#0d0d0e',
                  border: '1px solid #2a2a2a',
                  borderRadius: 6,
                  color: '#e5e5e5',
                  fontSize: 12,
                }}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Alignment</label>
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
              overflow: 'hidden',
            }}
          >
            {previewElements.map((el) => (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: el.position.x * 0.7,
                  top: el.position.y * 0.7,
                  width: el.size.width * 0.7,
                  height: el.size.height * 0.7,
                  background: el.style?.fill || '#3b82f6',
                  borderRadius: el.shapeType === 'ellipse' ? '50%' : (el.style?.borderRadius || 8) * 0.7,
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
          <div style={{ padding: 16, borderTop: '1px solid #2a2a2a' }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>State</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {keyframes.map((kf) => (
                <button
                  key={kf.id}
                  onClick={() => setPreviewState(kf.id)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: previewState === kf.id ? '#2563eb' : '#2a2a2a',
                    border: 'none',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {kf.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button style={{ border: '1px solid #333', borderRadius: 6, padding: '6px 10px', background: 'transparent', color: '#fff' }} onClick={undo}>Undo</button>
              <button style={{ border: '1px solid #333', borderRadius: 6, padding: '6px 10px', background: 'transparent', color: '#fff' }} onClick={redo}>Redo</button>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex' }}>
            <aside
              style={{
                width: 260,
                borderRight: '1px solid #2a2a2a',
                background: '#151515',
                display: 'flex',
                flexDirection: 'column',
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
              <div style={{ padding: 16, overflowY: 'auto' }}>
                <h3 style={{ fontSize: 11, textTransform: 'uppercase', color: '#666', margin: 0, marginBottom: 8 }}>Keyframes</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {keyframes.map((kf) => (
                    <button
                      key={kf.id}
                      onClick={() => setSelectedKeyframeId(kf.id)}
                      style={{
                        padding: '10px 12px',
                        background: selectedKeyframeId === kf.id ? '#2563eb20' : 'transparent',
                        border: '1px solid #2a2a2a',
                        borderRadius: 8,
                        color: '#fff',
                        textAlign: 'left',
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: 12 }}>{kf.name}</strong>
                      <span style={{ fontSize: 11, color: '#777' }}>{kf.summary}</span>
                    </button>
                  ))}
                  <button
                    onClick={addKeyframe}
                    style={{
                      padding: '10px 12px',
                      border: '1px dashed #333',
                      borderRadius: 8,
                      color: '#999',
                      background: 'transparent',
                    }}
                  >
                    + Add Keyframe
                  </button>
                </div>
              </div>
            </aside>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  borderBottom: '1px solid #2a2a2a',
                  padding: '0 20px',
                  height: 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: 14 }}>{selectedKeyframe?.name ?? 'Untitled state'}</h2>
                  <span style={{ fontSize: 12, color: '#777' }}>{selectedKeyframe?.summary}</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={copySelectedElements} style={{ border: '1px solid #333', padding: '6px 12px', borderRadius: 6, background: 'transparent', color: '#fff' }}>Copy</button>
                  <button onClick={pasteElements} style={{ border: '1px solid #333', padding: '6px 12px', borderRadius: 6, background: 'transparent', color: '#fff' }}>Paste</button>
                </div>
              </div>
              <div style={{ flex: 1, padding: 20, display: 'flex' }}>
                <div
                  style={{
                    flex: 1,
                    border: '1px solid #222',
                    borderRadius: 16,
                    background: '#0d0d0e',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Canvas />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            width: 280,
            background: '#161617',
            borderLeft: '1px solid #2a2a2a',
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
          <div style={{ padding: 16 }}>{renderInspector()}</div>
        </div>
      </div>
    </div>
  );
}
