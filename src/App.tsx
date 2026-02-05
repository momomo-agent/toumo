import { useState, useRef, useCallback, useEffect } from 'react';
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
  } = useEditorStore();

  const [tool, setTool] = useState<Tool>('select');
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 拖拽开始
  const handleMouseDown = useCallback((e: React.MouseEvent, elId: string, handle?: string) => {
    e.stopPropagation();
    const el = elements.find(el => el.id === elId);
    if (!el) return;
    
    setSelectedElementId(elId);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ 
      x: el.position.x, 
      y: el.position.y,
      w: el.size.width,
      h: el.size.height
    });
    
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
  }, [elements, setSelectedElementId]);

  // 拖拽中
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!selectedElement || (!isDragging && !isResizing)) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (isDragging) {
      updateElement(selectedElement.id, {
        position: {
          x: Math.max(0, elementStart.x + dx),
          y: Math.max(0, elementStart.y + dy)
        }
      });
    } else if (isResizing && resizeHandle) {
      let newW = elementStart.w;
      let newH = elementStart.h;
      let newX = elementStart.x;
      let newY = elementStart.y;

      if (resizeHandle.includes('e')) newW = Math.max(20, elementStart.w + dx);
      if (resizeHandle.includes('w')) {
        newW = Math.max(20, elementStart.w - dx);
        newX = elementStart.x + dx;
      }
      if (resizeHandle.includes('s')) newH = Math.max(20, elementStart.h + dy);
      if (resizeHandle.includes('n')) {
        newH = Math.max(20, elementStart.h - dy);
        newY = elementStart.y + dy;
      }

      updateElement(selectedElement.id, {
        position: { x: newX, y: newY },
        size: { width: newW, height: newH }
      });
    }
  }, [isDragging, isResizing, resizeHandle, dragStart, elementStart, selectedElement, selectedKeyframeId, updateElement]);

  // 拖拽结束
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Resize handles
  const renderResizeHandles = (elId: string) => {
    if (selectedElementId !== elId) return null;
    const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    const positions: Record<string, React.CSSProperties> = {
      nw: { top: -4, left: -4, cursor: 'nwse-resize' },
      n: { top: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
      ne: { top: -4, right: -4, cursor: 'nesw-resize' },
      e: { top: '50%', right: -4, transform: 'translateY(-50%)', cursor: 'ew-resize' },
      se: { bottom: -4, right: -4, cursor: 'nwse-resize' },
      s: { bottom: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
      sw: { bottom: -4, left: -4, cursor: 'nesw-resize' },
      w: { top: '50%', left: -4, transform: 'translateY(-50%)', cursor: 'ew-resize' },
    };
    return handles.map(h => (
      <div
        key={h}
        onMouseDown={(e) => handleMouseDown(e, elId, h)}
        style={{
          position: 'absolute',
          width: 8,
          height: 8,
          background: '#fff',
          border: '1px solid #2563eb',
          borderRadius: 2,
          ...positions[h],
        }}
      />
    ));
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
              title={`${t.key}`}
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
              cursor: 'pointer',
            }}>+</button>
          </div>

          {/* Canvas */}
          <div 
            ref={canvasRef}
            onClick={() => setSelectedElementId(null)}
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              background: `
                linear-gradient(#1a1a1b 1px, transparent 1px),
                linear-gradient(90deg, #1a1a1b 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          >
            {elements.map(el => (
              <div
                key={el.id}
                onMouseDown={(e) => handleMouseDown(e, el.id)}
                style={{
                  position: 'absolute',
                  left: el.position.x,
                  top: el.position.y,
                  width: el.size.width,
                  height: el.size.height,
                  background: el.style?.fill || '#3b82f6',
                  borderRadius: el.style?.borderRadius || 8,
                  cursor: 'move',
                  boxShadow: selectedElementId === el.id 
                    ? '0 0 0 2px #2563eb' 
                    : 'none',
                }}
              >
                {renderResizeHandles(el.id)}
              </div>
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
                    <input type="number" value={selectedElement.position.x} readOnly style={{
                      flex: 1, padding: '8px', background: '#0d0d0e',
                      border: '1px solid #2a2a2a', borderRadius: 6, color: '#e5e5e5',
                    }} />
                    <input type="number" value={selectedElement.position.y} readOnly style={{
                      flex: 1, padding: '8px', background: '#0d0d0e',
                      border: '1px solid #2a2a2a', borderRadius: 6, color: '#e5e5e5',
                    }} />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Size</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="number" value={selectedElement.size.width} readOnly style={{
                      flex: 1, padding: '8px', background: '#0d0d0e',
                      border: '1px solid #2a2a2a', borderRadius: 6, color: '#e5e5e5',
                    }} />
                    <input type="number" value={selectedElement.size.height} readOnly style={{
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
