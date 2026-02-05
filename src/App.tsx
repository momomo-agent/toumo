import { useState, useRef, useCallback, useEffect } from 'react';
import type { CSSProperties } from 'react';
import './App.css';
import { useEditorStore } from './store';
import type { ShapeStyle } from './types';
import { DEFAULT_STYLE } from './types';

type Tool = 'select' | 'rectangle' | 'ellipse' | 'text' | 'hand';

type TextAlign = NonNullable<ShapeStyle['textAlign']>;

const TOOLBAR: { id: Tool; icon: string; key: string; label: string }[] = [
  { id: 'select', icon: '↖', key: 'V', label: 'Select' },
  { id: 'rectangle', icon: '▢', key: 'R', label: 'Rectangle' },
  { id: 'ellipse', icon: '○', key: 'O', label: 'Ellipse' },
  { id: 'text', icon: 'T', key: 'T', label: 'Text' },
  { id: 'hand', icon: '✋', key: 'H', label: 'Hand' },
];

const COLOR_SWATCHES = ['#6366f1', '#22d3ee', '#22c55e', '#f59e0b', '#f87171', '#f472b6', '#a855f7'];

const TEXT_ALIGNMENT: { id: TextAlign; label: string }[] = [
  { id: 'left', label: 'L' },
  { id: 'center', label: 'C' },
  { id: 'right', label: 'R' },
];

const mergeStyle = (style?: ShapeStyle, overrides: Partial<ShapeStyle> = {}): ShapeStyle => ({
  fill: style?.fill ?? DEFAULT_STYLE.fill,
  fillOpacity: style?.fillOpacity ?? DEFAULT_STYLE.fillOpacity,
  stroke: style?.stroke ?? DEFAULT_STYLE.stroke,
  strokeWidth: style?.strokeWidth ?? DEFAULT_STYLE.strokeWidth,
  strokeOpacity: style?.strokeOpacity ?? DEFAULT_STYLE.strokeOpacity,
  borderRadius: style?.borderRadius ?? DEFAULT_STYLE.borderRadius,
  fontSize: style?.fontSize,
  fontWeight: style?.fontWeight,
  textAlign: style?.textAlign,
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
    const isTextTool = tool === 'text';

    const newElement = {
      id: `el-${Date.now()}`,
      name: isTextTool ? 'Text Layer' : tool === 'rectangle' ? 'Rectangle' : 'Ellipse',
      category: 'content' as const,
      isKeyElement: true,
      attributes: [],
      position: { x, y },
      size: isTextTool ? { width: 240, height: 64 } : { width: 120, height: 96 },
      shapeType: tool as 'rectangle' | 'ellipse' | 'text',
      style: mergeStyle(undefined, {
        fill: isTextTool ? '#fafafa' : '#6366f1',
        borderRadius: isTextTool ? 6 : tool === 'ellipse' ? 999 : 12,
        fontSize: isTextTool ? 18 : undefined,
        fontWeight: isTextTool ? '500' : undefined,
        textAlign: isTextTool ? 'left' : undefined,
      }),
      text: isTextTool ? 'New text block' : undefined,
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
            {elements.map((element) => {
              const isTextElement = element.shapeType === 'text';
              const fillColor = element.style?.fill || '#6366f1';
              const textAlign = element.style?.textAlign ?? 'left';
              return (
                <div
                  key={element.id}
                  className={`canvas-element ${selectedElementId === element.id ? 'is-selected' : ''} ${isTextElement ? 'is-text' : ''}`}
                  onMouseDown={(event) => handleMouseDown(event, element.id)}
                  onClick={(event) => event.stopPropagation()}
                  style={{
                    left: element.position.x,
                    top: element.position.y,
                    width: element.size.width,
                    height: element.size.height,
                    background: isTextElement ? 'transparent' : fillColor,
                    color: isTextElement ? fillColor : undefined,
                    borderRadius: element.shapeType === 'ellipse' ? '50%' : (element.style?.borderRadius ?? 12),
                    display: isTextElement ? 'flex' : undefined,
                    alignItems: isTextElement ? 'center' : undefined,
                    justifyContent: isTextElement
                      ? textAlign === 'center'
                        ? 'center'
                        : textAlign === 'right'
                          ? 'flex-end'
                          : 'flex-start'
                      : undefined,
                    padding: isTextElement ? '0 16px' : undefined,
                    fontSize: isTextElement ? element.style?.fontSize ?? 18 : undefined,
                    fontWeight: isTextElement ? element.style?.fontWeight ?? '500' : undefined,
                    border: isTextElement ? '1px dashed var(--border-default)' : undefined,
                  }}
                >
                  {isTextElement && (
                    <span className="canvas-text">{element.text ?? 'Text'}</span>
                  )}
                  {renderResizeHandles(element.id)}
                </div>
              );
            })}
          </div>
        </section>

        <section className="inspector-panel">
          <div className="panel-heading">Inspector</div>
          <div className="inspector-content">
            {selectedElement ? ((() => {
              const currentStyle = mergeStyle(selectedElement.style);
              const isTextElement = selectedElement.shapeType === 'text';
              return (
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
                        value={currentStyle.fill}
                        onChange={(event) => updateElement(selectedElement.id, {
                          style: mergeStyle(selectedElement.style, { fill: event.target.value }),
                        })}
                      />
                      <input
                        className="input-control"
                        type="text"
                        value={currentStyle.fill}
                        onChange={(event) => updateElement(selectedElement.id, {
                          style: mergeStyle(selectedElement.style, { fill: event.target.value }),
                        })}
                      />
                    </div>
                    <div className="color-swatches">
                      {COLOR_SWATCHES.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`swatch ${currentStyle.fill === color ? 'is-active' : ''}`}
                          style={{ background: color }}
                          onClick={() => updateElement(selectedElement.id, {
                            style: mergeStyle(selectedElement.style, { fill: color }),
                          })}
                        />
                      ))}
                    </div>
                  </div>

                  {isTextElement && (
                    <>
                      <div className="field-group">
                        <label>Content</label>
                        <textarea
                          className="input-control textarea-control"
                          rows={3}
                          value={selectedElement.text ?? ''}
                          onChange={(event) => updateElement(selectedElement.id, { text: event.target.value })}
                        />
                      </div>

                      <div className="field-group">
                        <label>Font Size</label>
                        <input
                          className="input-control"
                          type="number"
                          value={currentStyle.fontSize ?? 18}
                          onChange={(event) => updateElement(selectedElement.id, {
                            style: mergeStyle(selectedElement.style, { fontSize: Number(event.target.value) }),
                          })}
                        />
                      </div>

                      <div className="field-group">
                        <label>Alignment</label>
                        <div className="segmented-control">
                          {TEXT_ALIGNMENT.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              className={`segment ${currentStyle.textAlign === option.id ? 'is-active' : ''}`}
                              onClick={() => updateElement(selectedElement.id, {
                                style: mergeStyle(selectedElement.style, { textAlign: option.id }),
                              })}
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
              <p className="empty-placeholder">Select an element to edit its properties.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
