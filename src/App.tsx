import { useState, useEffect } from 'react';
import { useEditorStore } from './store';
import type { ShapeStyle } from './types';

type Tool = 'select' | 'rectangle' | 'ellipse' | 'text' | 'hand';

const DEFAULT_STYLE: ShapeStyle = {
  fill: '#3b82f6',
  fillOpacity: 1,
  stroke: '',
  strokeWidth: 0,
  strokeOpacity: 1,
  borderRadius: 8,
};

const COLOR_PALETTE = ['#6366f1', '#22d3ee', '#22c55e', '#f97316', '#f43f5e', '#eab308', '#a855f7'];

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

export default function App() {
  const { 
    keyframes, 
    selectedKeyframeId, 
    setSelectedKeyframeId,
    addKeyframe,
    selectedElementId,
    setSelectedElementId,
    updateElement,
    deleteElement,
  } = useEditorStore();

  const [tool, setTool] = useState<Tool>('select');
  const [previewState, setPreviewState] = useState('kf-idle');
  const [interactionTab, setInteractionTab] = useState<'states' | 'timeline'>('states');
  
  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: 0, y: 0 });

  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const elements = selectedKeyframe?.keyElements || [];
  const selectedElement = elements.find(el => el.id === selectedElementId);
  const previewKeyframe = keyframes.find(kf => kf.id === previewState);
  const previewElements = previewKeyframe?.keyElements || [];

  const tools: { id: Tool; icon: string; key: string }[] = [
    { id: 'select', icon: '↖', key: 'V' },
    { id: 'rectangle', icon: '▢', key: 'R' },
    { id: 'ellipse', icon: '○', key: 'O' },
    { id: 'text', icon: 'T', key: 'T' },
    { id: 'hand', icon: '✋', key: 'H' },
  ];

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key.toLowerCase()) {
        case 'v': setTool('select'); break;
        case 'r': setTool('rectangle'); break;
        case 'o': setTool('ellipse'); break;
        case 't': setTool('text'); break;
        case 'h': setTool('hand'); break;
        case 'delete':
        case 'backspace':
          if (selectedElementId) deleteElement(selectedElementId);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, deleteElement]);

  // 拖拽处理
  const handleElementMouseDown = (e: React.MouseEvent, elId: string, _scale: number) => {
    e.stopPropagation();
    const el = elements.find(el => el.id === elId);
    if (!el) return;
    setSelectedElementId(elId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ x: el.position.x, y: el.position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return;
    const scale = 0.55; // 关键帧内的缩放比例
    const dx = (e.clientX - dragStart.x) / scale;
    const dy = (e.clientY - dragStart.y) / scale;
    updateElement(selectedElement.id, {
      position: {
        x: Math.max(0, Math.round(elementStart.x + dx)),
        y: Math.max(0, Math.round(elementStart.y + dy))
      }
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
        userSelect: 'none',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header */}
      <header style={{
        height: 48,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #2a2a2a',
        background: '#161617',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Toumo</span>
          <span style={{ color: '#666', fontSize: 12 }}>Motion Editor</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              style={{
                width: 32, height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: tool === t.id ? '#2563eb' : 'transparent',
                border: 'none',
                borderRadius: 6,
                color: tool === t.id ? '#fff' : '#888',
                cursor: 'pointer',
              }}
            >
              {t.icon}
            </button>
          ))}
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Live Preview */}
        <div style={{
          width: 300,
          background: '#161617',
          borderRight: '1px solid #2a2a2a',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #2a2a2a',
            fontSize: 11,
            fontWeight: 600,
            color: '#888',
            textTransform: 'uppercase',
          }}>
            Live Preview
          </div>
          <div style={{
            flex: 1,
            margin: 16,
            background: '#0d0d0e',
            borderRadius: 12,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {previewElements.map(el => (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: el.position.x * 0.65,
                  top: el.position.y * 0.65,
                  width: el.size.width * 0.65,
                  height: el.size.height * 0.65,
                  background: el.style?.fill || '#3b82f6',
                  borderRadius: el.shapeType === 'ellipse' 
                    ? '50%' 
                    : (el.style?.borderRadius || 8) * 0.65,
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
          <div style={{ padding: 12, borderTop: '1px solid #2a2a2a' }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>State</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {keyframes.map(kf => (
                <button
                  key={kf.id}
                  onClick={() => setPreviewState(kf.id)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: previewState === kf.id ? '#2563eb' : '#2a2a2a',
                    border: 'none',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 10,
                    cursor: 'pointer',
                  }}
                >
                  {kf.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Layers Panel - Figma 风格图层树 */}
        <div style={{
          width: 200,
          background: '#161617',
          borderRight: '1px solid #2a2a2a',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #2a2a2a',
            fontSize: 11,
            fontWeight: 600,
            color: '#888',
            textTransform: 'uppercase',
          }}>
            Layers
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
            {elements.map(el => (
              <div
                key={el.id}
                onClick={() => setSelectedElementId(el.id)}
                style={{
                  padding: '8px 12px',
                  background: selectedElementId === el.id 
                    ? '#2563eb20' : 'transparent',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 2,
                }}
              >
                <span style={{
                  width: 14, height: 14,
                  background: el.style?.fill || '#3b82f6',
                  borderRadius: 3,
                }} />
                <span style={{ fontSize: 12 }}>{el.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas + Interaction Manager */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          background: '#0d0d0e',
        }}>
          {/* Canvas - 关键帧平铺 */}
          <div style={{
            flex: 1,
            padding: 20,
            display: 'flex',
            gap: 20,
            overflowX: 'auto',
          }}>
            {keyframes.map(kf => {
              const kfElements = kf.keyElements || [];
              return (
                <div
                  key={kf.id}
                  onClick={() => setSelectedKeyframeId(kf.id)}
                  style={{
                    flexShrink: 0,
                    width: 260,
                    background: '#1a1a1a',
                    border: `2px solid ${kf.id === selectedKeyframeId ? '#2563eb' : '#333'}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid #333',
                    fontWeight: 500,
                    fontSize: 12,
                  }}>
                    {kf.name}
                  </div>
                  <div style={{
                    height: 180,
                    position: 'relative',
                    background: `
                      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
                    `,
                    backgroundSize: '16px 16px',
                  }}>
                    {kfElements.map(el => (
                      <div
                        key={el.id}
                        onMouseDown={(e) => handleElementMouseDown(e, el.id, 0.55)}
                        style={{
                          position: 'absolute',
                          left: el.position.x * 0.55,
                          top: el.position.y * 0.55,
                          width: el.size.width * 0.55,
                          height: el.size.height * 0.55,
                          background: el.style?.fill || '#3b82f6',
                          borderRadius: el.shapeType === 'ellipse' 
                            ? '50%' 
                            : (el.style?.borderRadius || 8) * 0.55,
                          cursor: 'move',
                          boxShadow: selectedElementId === el.id 
                            ? '0 0 0 2px #2563eb' : 'none',
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            <button
              onClick={addKeyframe}
              style={{
                flexShrink: 0,
                width: 100,
                background: 'transparent',
                border: '2px dashed #444',
                borderRadius: 12,
                color: '#666',
                cursor: 'pointer',
                fontSize: 20,
              }}
            >
              +
            </button>
          </div>

          {/* Interaction Manager */}
          <div style={{
            height: 140,
            borderTop: '1px solid #2a2a2a',
            background: '#161617',
          }}>
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #2a2a2a',
            }}>
              <button
                onClick={() => setInteractionTab('states')}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: interactionTab === 'states' 
                    ? '2px solid #2563eb' : '2px solid transparent',
                  color: interactionTab === 'states' ? '#fff' : '#666',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                State Machine
              </button>
              <button
                onClick={() => setInteractionTab('timeline')}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: interactionTab === 'timeline' 
                    ? '2px solid #2563eb' : '2px solid transparent',
                  color: interactionTab === 'timeline' ? '#fff' : '#666',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Timeline
              </button>
            </div>
            <div style={{ padding: 16 }}>
              {interactionTab === 'states' ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12 
                }}>
                  {keyframes.map((kf, i) => (
                    <div key={kf.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        padding: '8px 16px',
                        background: previewState === kf.id ? '#2563eb' : '#2a2a2a',
                        borderRadius: 8,
                        fontSize: 11,
                      }}>
                        {kf.name}
                      </div>
                      {i < keyframes.length - 1 && (
                        <span style={{ color: '#666' }}>→</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#666', fontSize: 11 }}>
                  Timeline view coming soon...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inspector */}
        <div style={{
          width: 260,
          background: '#161617',
          borderLeft: '1px solid #2a2a2a',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #2a2a2a',
            fontSize: 11,
            fontWeight: 600,
            color: '#888',
            textTransform: 'uppercase',
          }}>
            Inspector
          </div>
          <div style={{ padding: 16 }}>
            {selectedElement ? ((() => {
              const currentStyle = mergeStyle(selectedElement.style);
              const handleStyleChange = (overrides: Partial<ShapeStyle>) => {
                updateElement(selectedElement.id, {
                  style: mergeStyle(selectedElement.style, overrides),
                });
              };
              const isTextElement = selectedElement.shapeType === 'text';
              const activeAlign = currentStyle.textAlign ?? 'left';

              return (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Name</label>
                    <input 
                      type="text" 
                      value={selectedElement.name} 
                      onChange={(e) => updateElement(selectedElement.id, { name: e.target.value })}
                      style={{
                        width: '100%', padding: '8px 10px', background: '#0d0d0e',
                        border: '1px solid #2a2a2a', borderRadius: 6, color: '#e5e5e5', fontSize: 12,
                      }} 
                    />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Position</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="number" value={selectedElement.position.x} 
                        onChange={(e) => updateElement(selectedElement.id, { 
                          position: { ...selectedElement.position, x: Number(e.target.value) }
                        })}
                        style={{ flex: 1, padding: '8px', background: '#0d0d0e',
                          border: '1px solid #2a2a2a', borderRadius: 6, color: '#e5e5e5', fontSize: 12,
                        }} />
                      <input type="number" value={selectedElement.position.y} 
                        onChange={(e) => updateElement(selectedElement.id, { 
                          position: { ...selectedElement.position, y: Number(e.target.value) }
                        })}
                        style={{ flex: 1, padding: '8px', background: '#0d0d0e',
                          border: '1px solid #2a2a2a', borderRadius: 6, color: '#e5e5e5', fontSize: 12,
                        }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Size</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="number" value={selectedElement.size.width} 
                        onChange={(e) => updateElement(selectedElement.id, { 
                          size: { ...selectedElement.size, width: Number(e.target.value) }
                        })}
                        style={{ flex: 1, padding: '8px', background: '#0d0d0e',
                          border: '1px solid #2a2a2a', borderRadius: 6, color: '#e5e5e5', fontSize: 12,
                        }} />
                      <input type="number" value={selectedElement.size.height} 
                        onChange={(e) => updateElement(selectedElement.id, { 
                          size: { ...selectedElement.size, height: Number(e.target.value) }
                        })}
                        style={{ flex: 1, padding: '8px', background: '#0d0d0e',
                          border: '1px solid #2a2a2a', borderRadius: 6, color: '#e5e5e5', fontSize: 12,
                        }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Fill</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="color"
                        value={currentStyle.fill}
                        onChange={(e) => handleStyleChange({ fill: e.target.value })}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          border: '1px solid #2a2a2a',
                          background: 'transparent',
                          padding: 0,
                          cursor: 'pointer',
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
                      {COLOR_PALETTE.map((hex) => (
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
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Content</label>
                        <textarea
                          value={selectedElement.text || ''}
                          onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                          style={{
                            width: '100%',
                            minHeight: 72,
                            background: '#0d0d0e',
                            border: '1px solid #2a2a2a',
                            borderRadius: 6,
                            color: '#e5e5e5',
                            fontSize: 13,
                            fontFamily: 'inherit',
                            padding: '8px 10px',
                          }}
                        />
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Font Size</label>
                        <input
                          type="number"
                          value={currentStyle.fontSize ?? 16}
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
            })()) : (
              <div style={{ color: '#555', fontSize: 12 }}>Select a layer</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
