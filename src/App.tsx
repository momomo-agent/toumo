import { useState, useEffect } from 'react';
import { useEditorStore } from './store';

type Tool = 'select' | 'rectangle' | 'ellipse' | 'text' | 'hand';

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

  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const elements = selectedKeyframe?.keyElements || [];
  const selectedElement = elements.find(el => el.id === selectedElementId);

  // 获取预览状态的元素
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#0a0a0b',
      color: '#e5e5e5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: 13,
    }}>
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
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Live Preview */}
        <div style={{
          width: 320,
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
          {/* Preview Canvas */}
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
          {/* State Switcher */}
          <div style={{ padding: 16, borderTop: '1px solid #2a2a2a' }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>State</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {keyframes.map(kf => (
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

        {/* Center: Layers + Keyframes */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Toolbar */}
          <div style={{
            height: 48,
            borderBottom: '1px solid #2a2a2a',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            gap: 4,
          }}>
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

          {/* Layers Panel (Global) */}
          <div style={{
            height: 120,
            borderBottom: '1px solid #2a2a2a',
            padding: 12,
          }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
              Layers (shared across keyframes)
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {elements.map(el => (
                <button
                  key={el.id}
                  onClick={() => setSelectedElementId(el.id)}
                  style={{
                    padding: '6px 12px',
                    background: selectedElementId === el.id ? '#2563eb' : '#2a2a2a',
                    border: 'none',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{
                    width: 12, height: 12,
                    background: el.style?.fill || '#3b82f6',
                    borderRadius: 2,
                  }} />
                  {el.name}
                </button>
              ))}
            </div>
          </div>

          {/* Keyframes - 平铺展示 */}
          <div style={{
            flex: 1,
            padding: 24,
            display: 'flex',
            gap: 24,
            overflowX: 'auto',
            background: '#0d0d0e',
          }}>
            {keyframes.map(kf => {
              const kfElements = kf.keyElements || [];
              return (
                <div
                  key={kf.id}
                  onClick={() => setSelectedKeyframeId(kf.id)}
                  style={{
                    flexShrink: 0,
                    width: 280,
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
                    fontSize: 13,
                  }}>
                    {kf.name}
                  </div>
                  <div style={{
                    height: 200,
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
                        style={{
                          position: 'absolute',
                          left: el.position.x * 0.6,
                          top: el.position.y * 0.6,
                          width: el.size.width * 0.6,
                          height: el.size.height * 0.6,
                          background: el.style?.fill || '#3b82f6',
                          borderRadius: el.shapeType === 'ellipse' ? '50%' : (el.style?.borderRadius || 8) * 0.6,
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            {/* Add Keyframe */}
            <button
              onClick={addKeyframe}
              style={{
                flexShrink: 0,
                width: 120,
                height: 240,
                background: 'transparent',
                border: '2px dashed #444',
                borderRadius: 12,
                color: '#666',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Right: Inspector */}
        <div style={{
          width: 280,
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
            {selectedElement ? (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Name</label>
                  <input 
                    type="text" 
                    value={selectedElement.name} 
                    onChange={(e) => updateElement(selectedElement.id, { name: e.target.value })}
                    style={{
                      width: '100%', padding: '8px 10px', background: '#0d0d0e',
                      border: '1px solid #2a2a2a', borderRadius: 6, color: '#e5e5e5',
                    }} 
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Position</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      type="number" 
                      value={selectedElement.position.x} 
                      onChange={(e) => updateElement(selectedElement.id, { 
                        position: { ...selectedElement.position, x: Number(e.target.value) }
                      })}
                      style={{
                        flex: 1, padding: '8px', background: '#0d0d0e',
                        border: '1px solid #2a2a2a', borderRadius: 6, color: '#e5e5e5',
                      }} 
                    />
                    <input 
                      type="number" 
                      value={selectedElement.position.y} 
                      onChange={(e) => updateElement(selectedElement.id, { 
                        position: { ...selectedElement.position, y: Number(e.target.value) }
                      })}
                      style={{
                        flex: 1, padding: '8px', background: '#0d0d0e',
                        border: '1px solid #2a2a2a', borderRadius: 6, color: '#e5e5e5',
                      }} 
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Size</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      type="number" 
                      value={selectedElement.size.width} 
                      onChange={(e) => updateElement(selectedElement.id, { 
                        size: { ...selectedElement.size, width: Number(e.target.value) }
                      })}
                      style={{
                        flex: 1, padding: '8px', background: '#0d0d0e',
                        border: '1px solid #2a2a2a', borderRadius: 6, color: '#e5e5e5',
                      }} 
                    />
                    <input 
                      type="number" 
                      value={selectedElement.size.height} 
                      onChange={(e) => updateElement(selectedElement.id, { 
                        size: { ...selectedElement.size, height: Number(e.target.value) }
                      })}
                      style={{
                        flex: 1, padding: '8px', background: '#0d0d0e',
                        border: '1px solid #2a2a2a', borderRadius: 6, color: '#e5e5e5',
                      }} 
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Fill</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="color"
                      value={selectedElement.style?.fill || '#3b82f6'}
                      onChange={(e) => updateElement(selectedElement.id, { 
                        style: { 
                          fill: e.target.value,
                          fillOpacity: 1,
                          stroke: '',
                          strokeWidth: 0,
                          strokeOpacity: 1,
                          borderRadius: selectedElement.style?.borderRadius ?? 8,
                        }
                      })}
                      style={{
                        width: 32, height: 32,
                        padding: 0, border: '1px solid #2a2a2a',
                        borderRadius: 6, cursor: 'pointer',
                      }}
                    />
                    <span style={{ color: '#888', fontSize: 12 }}>
                      {selectedElement.style?.fill || '#3b82f6'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#555' }}>Select a layer</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
