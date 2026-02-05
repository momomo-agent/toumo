import { useState } from 'react';
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
  } = useEditorStore();

  const [tool, setTool] = useState<Tool>('select');

  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const elements = selectedKeyframe?.keyElements || [];
  const selectedElement = elements.find(el => el.id === selectedElementId);

  const tools: { id: Tool; icon: string; key: string }[] = [
    { id: 'select', icon: '↖', key: 'V' },
    { id: 'rectangle', icon: '▢', key: 'R' },
    { id: 'ellipse', icon: '○', key: 'O' },
    { id: 'text', icon: 'T', key: 'T' },
    { id: 'hand', icon: '✋', key: 'H' },
  ];

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
        {/* Toolbar */}
        <div style={{
          width: 48,
          background: '#161617',
          borderRight: '1px solid #2a2a2a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 0',
          gap: 4,
        }}>
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              style={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: tool === t.id ? '#2563eb' : 'transparent',
                border: 'none',
                borderRadius: 8,
                color: tool === t.id ? '#fff' : '#888',
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              {t.icon}
            </button>
          ))}
        </div>

        {/* Layers Panel */}
        <div style={{
          width: 240,
          background: '#161617',
          borderRight: '1px solid #2a2a2a',
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
          <div style={{ padding: 8 }}>
            {elements.map(el => (
              <div
                key={el.id}
                onClick={() => setSelectedElementId(el.id)}
                style={{
                  padding: '8px 12px',
                  background: selectedElementId === el.id ? '#2563eb20' : 'transparent',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 2,
                }}
              >
                <span style={{
                  width: 16, height: 16,
                  background: el.style?.fill || '#3b82f6',
                  borderRadius: 3,
                }} />
                <span>{el.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0d0d0e' }}>
          {/* Keyframe tabs */}
          <div style={{
            height: 40,
            borderBottom: '1px solid #2a2a2a',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 8,
          }}>
            {keyframes.map(kf => (
              <button
                key={kf.id}
                onClick={() => setSelectedKeyframeId(kf.id)}
                style={{
                  padding: '6px 14px',
                  background: kf.id === selectedKeyframeId ? '#2a2a2a' : 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  color: kf.id === selectedKeyframeId ? '#fff' : '#888',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {kf.name}
              </button>
            ))}
            <button onClick={addKeyframe} style={{
              padding: '6px 10px',
              background: 'transparent',
              border: '1px dashed #444',
              borderRadius: 6,
              color: '#666',
              fontSize: 12,
              cursor: 'pointer',
            }}>+</button>
          </div>

          {/* Canvas */}
          <div style={{
            flex: 1,
            position: 'relative',
            background: 'linear-gradient(#1a1a1b 1px, transparent 1px), linear-gradient(90deg, #1a1a1b 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}>
            {elements.map(el => (
              <div
                key={el.id}
                onClick={() => setSelectedElementId(el.id)}
                style={{
                  position: 'absolute',
                  left: el.position.x,
                  top: el.position.y,
                  width: el.size.width,
                  height: el.size.height,
                  background: el.style?.fill || '#3b82f6',
                  borderRadius: el.style?.borderRadius || 8,
                  cursor: 'move',
                  boxShadow: selectedElementId === el.id ? '0 0 0 2px #2563eb' : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* Inspector */}
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
                  <input type="text" value={selectedElement.name} readOnly style={{
                    width: '100%', padding: '8px 10px', background: '#0d0d0e',
                    border: '1px solid #2a2a2a', borderRadius: 6, color: '#e5e5e5',
                  }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Position</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" value={`X: ${selectedElement.position.x}`} readOnly style={{
                      flex: 1, padding: '8px', background: '#0d0d0e',
                      border: '1px solid #2a2a2a', borderRadius: 6, color: '#e5e5e5',
                    }} />
                    <input type="text" value={`Y: ${selectedElement.position.y}`} readOnly style={{
                      flex: 1, padding: '8px', background: '#0d0d0e',
                      border: '1px solid #2a2a2a', borderRadius: 6, color: '#e5e5e5',
                    }} />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Fill</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 32, height: 32,
                      background: selectedElement.style?.fill || '#3b82f6',
                      borderRadius: 6, border: '1px solid #2a2a2a',
                    }} />
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
