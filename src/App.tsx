import { useState, useRef, useCallback, useEffect } from 'react';
import type { CSSProperties } from 'react';
import './App.css';
import { useEditorStore } from './store';

type Tool = 'select' | 'rectangle' | 'ellipse' | 'text' | 'hand';

const TOOLBAR: { id: Tool; icon: string; key: string; label: string }[] = [
  { id: 'select', icon: '↖', key: 'V', label: 'Select' },
  { id: 'rectangle', icon: '▢', key: 'R', label: 'Rectangle' },
  { id: 'ellipse', icon: '○', key: 'O', label: 'Ellipse' },
  { id: 'text', icon: 'T', key: 'T', label: 'Text' },
  { id: 'hand', icon: '✋', key: 'H', label: 'Hand' },
];

export default function App() {
  const {
    keyframes,
    selectedKeyframeId,
    setSelectedKeyframeId,
    addKeyframe,
    selectedElementId,
    setSelectedElementId,
    updateElement,
    addElement,
    deleteElement,
  } = useEditorStore();

  const [tool, setTool] = useState<Tool>('select');
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedKeyframe = keyframes.find((kf) => kf.id === selectedKeyframeId);
  const elements = selectedKeyframe?.keyElements || [];
  const selectedElement = elements.find((el) => el.id === selectedElementId);

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (tool === 'select' || tool === 'hand') {
      setSelectedElementId(null);
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newElement = {
      id: `el-${Date.now()}`,
      name: tool === 'rectangle' ? 'Rectangle' : tool === 'ellipse' ? 'Ellipse' : 'Text',
      category: 'content' as const,
      isKeyElement: true,
      attributes: [],
      position: { x, y },
      size: { width: 120, height: 96 },
      shapeType: tool as 'rectangle' | 'ellipse' | 'text',
      style: {
        fill: '#6366f1',
        fillOpacity: 1,
        stroke: '',
        strokeWidth: 0,
        strokeOpacity: 1,
        borderRadius: tool === 'ellipse' ? 999 : 12,
      },
    };

    addElement(newElement);
    setTool('select');
  }, [tool, addElement, setSelectedElementId, setTool]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isInputTarget = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
      const key = event.key.toLowerCase();

      if (key === 'delete' || key === 'backspace') {
        if (!isInputTarget && selectedElementId) {
          deleteElement(selectedElementId);
          event.preventDefault();
        }
        return;
      }

      if (isInputTarget) return;

      switch (key) {
        case 'v': setTool('select'); break;
        case 'r': setTool('rectangle'); break;
        case 'o': setTool('ellipse'); break;
        case 't': setTool('text'); break;
        case 'h': setTool('hand'); break;
        default: break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, deleteElement, setTool]);

  const handleMouseDown = useCallback((event: React.MouseEvent, elementId: string, handle?: string) => {
    event.stopPropagation();
    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    setSelectedElementId(elementId);
    setDragStart({ x: event.clientX, y: event.clientY });
    setElementStart({
      x: element.position.x,
      y: element.position.y,
      w: element.size.width,
      h: element.size.height,
    });

    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
  }, [elements, setSelectedElementId]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!selectedElement || (!isDragging && !isResizing)) return;

    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;

    if (isDragging) {
      updateElement(selectedElement.id, {
        position: {
          x: Math.max(0, elementStart.x + dx),
          y: Math.max(0, elementStart.y + dy),
        },
      });
      return;
    }

    if (isResizing && resizeHandle) {
      let newWidth = elementStart.w;
      let newHeight = elementStart.h;
      let newX = elementStart.x;
      let newY = elementStart.y;

      if (resizeHandle.includes('e')) newWidth = Math.max(20, elementStart.w + dx);
      if (resizeHandle.includes('w')) {
        newWidth = Math.max(20, elementStart.w - dx);
        newX = elementStart.x + dx;
      }
      if (resizeHandle.includes('s')) newHeight = Math.max(20, elementStart.h + dy);
      if (resizeHandle.includes('n')) {
        newHeight = Math.max(20, elementStart.h - dy);
        newY = elementStart.y + dy;
      }

      updateElement(selectedElement.id, {
        position: { x: newX, y: newY },
        size: { width: newWidth, height: newHeight },
      });
    }
  }, [dragStart, elementStart, isDragging, isResizing, resizeHandle, selectedElement, updateElement]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  const renderResizeHandles = (elementId: string) => {
    if (selectedElementId !== elementId) return null;
    const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;
    const positions: Record<string, CSSProperties> = {
      nw: { top: -5, left: -5, cursor: 'nwse-resize' },
      n: { top: -5, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
      ne: { top: -5, right: -5, cursor: 'nesw-resize' },
      e: { top: '50%', right: -5, transform: 'translateY(-50%)', cursor: 'ew-resize' },
      se: { bottom: -5, right: -5, cursor: 'nwse-resize' },
      s: { bottom: -5, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
      sw: { bottom: -5, left: -5, cursor: 'nesw-resize' },
      w: { top: '50%', left: -5, transform: 'translateY(-50%)', cursor: 'ew-resize' },
    };

    return handles.map((handleKey) => (
      <div
        key={handleKey}
        className="resize-handle"
        style={positions[handleKey]}
        onMouseDown={(event) => handleMouseDown(event, elementId, handleKey)}
      />
    ));
  };

  return (
    <div
      className="app-shell"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <header className="app-header">
        <div className="app-brand">
          <span className="logo-mark">
            Toumo
            <span>Beta</span>
          </span>
          <span className="logo-subtitle">Motion Editor</span>
        </div>
        <div className="header-actions">
          <span className="pill">State Machine</span>
          <button className="primary-btn">Publish</button>
        </div>
      </header>

      <div className="editor-shell">
        <aside className="toolbar">
          {TOOLBAR.map((item) => (
            <button
              key={item.id}
              className={`toolbar-btn ${tool === item.id ? 'is-active' : ''}`}
              onClick={() => setTool(item.id)}
              aria-pressed={tool === item.id}
              title={`${item.label} (${item.key})`}
            >
              {item.icon}
            </button>
          ))}
        </aside>

        <section className="layers-panel">
          <div className="panel-heading">Layers</div>
          <div className="layers-list">
            {elements.length === 0 && (
              <p className="empty-placeholder">Use R, O, or T to start drawing on the canvas.</p>
            )}
            {elements.map((element) => (
              <button
                key={element.id}
                className={`layer-item ${selectedElementId === element.id ? 'is-active' : ''}`}
                onClick={() => setSelectedElementId(element.id)}
              >
                <span
                  className="layer-swatch"
                  style={{ background: element.style?.fill || '#6366f1' }}
                />
                <span>{element.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="canvas-panel">
          <div className="keyframe-tabs">
            {keyframes.map((kf) => (
              <button
                key={kf.id}
                className={`keyframe-tab ${kf.id === selectedKeyframeId ? 'is-active' : ''}`}
                onClick={() => setSelectedKeyframeId(kf.id)}
              >
                {kf.name}
              </button>
            ))}
            <button className="keyframe-add" onClick={addKeyframe} aria-label="Add keyframe">
              +
            </button>
          </div>

          <div
            ref={canvasRef}
            className="canvas-surface"
            onClick={handleCanvasClick}
          >
            {elements.map((element) => (
              <div
                key={element.id}
                className={`canvas-element ${selectedElementId === element.id ? 'is-selected' : ''}`}
                onMouseDown={(event) => handleMouseDown(event, element.id)}
                style={{
                  left: element.position.x,
                  top: element.position.y,
                  width: element.size.width,
                  height: element.size.height,
                  background: element.style?.fill || '#6366f1',
                  borderRadius: element.shapeType === 'ellipse' ? '50%' : (element.style?.borderRadius ?? 12),
                }}
              >
                {renderResizeHandles(element.id)}
              </div>
            ))}
          </div>
        </section>

        <section className="inspector-panel">
          <div className="panel-heading">Inspector</div>
          <div className="inspector-content">
            {selectedElement ? (
              <>
                <div className="field-group">
                  <label>Name</label>
                  <input
                    className="input-control"
                    type="text"
                    value={selectedElement.name}
                    onChange={(event) => updateElement(selectedElement.id, { name: event.target.value })}
                  />
                </div>

                <div className="field-group">
                  <label>Position</label>
                  <div className="field-row">
                    <input
                      className="input-control"
                      type="number"
                      value={selectedElement.position.x}
                      onChange={(event) => updateElement(selectedElement.id, {
                        position: { ...selectedElement.position, x: Number(event.target.value) },
                      })}
                    />
                    <input
                      className="input-control"
                      type="number"
                      value={selectedElement.position.y}
                      onChange={(event) => updateElement(selectedElement.id, {
                        position: { ...selectedElement.position, y: Number(event.target.value) },
                      })}
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label>Size</label>
                  <div className="field-row">
                    <input
                      className="input-control"
                      type="number"
                      value={selectedElement.size.width}
                      onChange={(event) => updateElement(selectedElement.id, {
                        size: { ...selectedElement.size, width: Number(event.target.value) },
                      })}
                    />
                    <input
                      className="input-control"
                      type="number"
                      value={selectedElement.size.height}
                      onChange={(event) => updateElement(selectedElement.id, {
                        size: { ...selectedElement.size, height: Number(event.target.value) },
                      })}
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label>Fill</label>
                  <div className="color-control">
                    <input
                      type="color"
                      value={selectedElement.style?.fill || '#6366f1'}
                      onChange={(event) => updateElement(selectedElement.id, {
                        style: {
                          fill: event.target.value,
                          fillOpacity: selectedElement.style?.fillOpacity ?? 1,
                          stroke: selectedElement.style?.stroke ?? '',
                          strokeWidth: selectedElement.style?.strokeWidth ?? 0,
                          strokeOpacity: selectedElement.style?.strokeOpacity ?? 1,
                          borderRadius: selectedElement.style?.borderRadius ?? 12,
                        },
                      })}
                    />
                    <input
                      className="input-control"
                      type="text"
                      value={selectedElement.style?.fill || '#6366f1'}
                      onChange={(event) => updateElement(selectedElement.id, {
                        style: {
                          fill: event.target.value,
                          fillOpacity: selectedElement.style?.fillOpacity ?? 1,
                          stroke: selectedElement.style?.stroke ?? '',
                          strokeWidth: selectedElement.style?.strokeWidth ?? 0,
                          strokeOpacity: selectedElement.style?.strokeOpacity ?? 1,
                          borderRadius: selectedElement.style?.borderRadius ?? 12,
                        },
                      })}
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="empty-placeholder">Select an element to edit its properties.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
