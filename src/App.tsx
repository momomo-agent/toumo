import './App.css';
import { useEditorStore } from './store';

export default function App() {
  const { 
    keyframes, 
    selectedKeyframeId, 
    setSelectedKeyframeId,
    addKeyframe,
    selectedElementId,
    setSelectedElementId,
  } = useEditorStore();

  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const elements = selectedKeyframe?.keyElements || [];
  const selectedElement = elements.find(el => el.id === selectedElementId);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        height: 48,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderBottom: '1px solid #222',
        background: '#111',
      }}>
        <span style={{ fontWeight: 600, fontSize: 18 }}>Toumo</span>
        <span style={{ color: '#666' }}>Motion Editor</span>
      </header>

      {/* Main Layout */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
      }}>
        {/* Left: Live Preview */}
        <aside style={{
          width: 300,
          borderRight: '1px solid #222',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          <h3 style={{ margin: 0, fontSize: 14, color: '#888' }}>Live Preview</h3>
          <div style={{
            flex: 1,
            background: '#1a1a1a',
            borderRadius: 12,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {elements.map(el => (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: el.position.x * 0.6,
                  top: el.position.y * 0.6,
                  width: el.size.width * 0.6,
                  height: el.size.height * 0.6,
                  background: el.style?.fill || '#3b82f6',
                  borderRadius: (el.style?.borderRadius || 8) * 0.6,
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            State: {selectedKeyframe?.name}
          </div>
        </aside>

        {/* Center: Workspace */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Layers */}
          <div style={{
            height: 120,
            borderBottom: '1px solid #222',
            padding: 16,
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#888' }}>Layers</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {elements.map(el => (
                <button
                  key={el.id}
                  onClick={() => setSelectedElementId(el.id)}
                  style={{
                    padding: '8px 16px',
                    background: selectedElementId === el.id ? '#3b82f6' : '#222',
                    border: 'none',
                    borderRadius: 6,
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  {el.name}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas: Keyframes horizontal */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #222',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 14, color: '#888' }}>Keyframes</span>
              <button
                onClick={addKeyframe}
                style={{
                  padding: '6px 12px',
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                + Add Keyframe
              </button>
            </div>
            
            {/* Keyframe cards - horizontal scroll */}
            <div style={{
              flex: 1,
              padding: 24,
              display: 'flex',
              gap: 24,
              overflowX: 'auto',
              background: '#0d0d0d',
            }}>
              {keyframes.map(kf => {
                const kfElements = kf.keyElements || [];
                return (
                  <div
                    key={kf.id}
                    onClick={() => setSelectedKeyframeId(kf.id)}
                    style={{
                      flexShrink: 0,
                      width: 320,
                      background: '#1a1a1a',
                      border: `2px solid ${kf.id === selectedKeyframeId ? '#3b82f6' : '#333'}`,
                      borderRadius: 12,
                      cursor: 'pointer',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #333',
                      fontWeight: 500,
                    }}>
                      {kf.name}
                    </div>
                    <div style={{
                      height: 280,
                      position: 'relative',
                      background: `
                        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
                      `,
                      backgroundSize: '20px 20px',
                    }}>
                      {kfElements.map(el => (
                        <div
                          key={el.id}
                          style={{
                            position: 'absolute',
                            left: el.position.x * 0.8,
                            top: el.position.y * 0.8,
                            width: el.size.width * 0.8,
                            height: el.size.height * 0.8,
                            background: el.style?.fill || '#3b82f6',
                            borderRadius: (el.style?.borderRadius || 8) * 0.8,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Inspector */}
        <aside style={{
          width: 280,
          borderLeft: '1px solid #222',
          padding: 16,
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#888' }}>Inspector</h3>
          {selectedElement ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Name</label>
                <input
                  type="text"
                  value={selectedElement.name}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: 6,
                    color: '#fff',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Position</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={`X: ${selectedElement.position.x}`}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: 6,
                      color: '#fff',
                    }}
                  />
                  <input
                    type="text"
                    value={`Y: ${selectedElement.position.y}`}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: 6,
                      color: '#fff',
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Size</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={`W: ${selectedElement.size.width}`}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: 6,
                      color: '#fff',
                    }}
                  />
                  <input
                    type="text"
                    value={`H: ${selectedElement.size.height}`}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: 6,
                      color: '#fff',
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: '#666', fontSize: 13 }}>Select a layer to edit</p>
          )}
        </aside>
      </div>
    </div>
  );
}
