import { useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { Canvas } from './components/Canvas';
import { InteractionManager } from './components/InteractionManager';
import { StateInspector } from './components/Inspector/StateInspector';
import { TransitionInspector } from './components/Inspector/TransitionInspector';
import { LivePreview } from './components/LivePreview';
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
    transitions,
    functionalStates,
    components,
    selectedKeyframeId,
    setSelectedKeyframeId,
    addKeyframe,
    selectedElementId,
    setSelectedElementId,
    selectedElementIds,
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
    addImageElement,
    groupSelectedElements,
    ungroupSelectedElements,
    alignElements,
    distributeElements,
    loadProject,
    copyStyle,
    pasteStyle,
    nudgeSelectedElements,
    setCanvasScale,
    bringForward,
    sendBackward,
  } = useEditorStore();

  const selectedKeyframe = keyframes.find((kf) => kf.id === selectedKeyframeId);
  const elements = selectedKeyframe?.keyElements || [];
  const selectedElement = elements.find((el) => el.id === selectedElementId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image file upload
  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageSrc = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        addImageElement(imageSrc, img.width, img.height);
      };
      img.src = imageSrc;
    };
    reader.readAsDataURL(file);
  };

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

  const handleSelectKeyframe = (keyframeId: string) => {
    setSelectedKeyframeId(keyframeId);
  };

  const handleAddKeyframe = () => {
    addKeyframe();
  };

  // Export current frame as PNG
  const handleExportPNG = useCallback(async () => {
    const frameElement = document.querySelector(`[data-frame-id="${selectedKeyframeId}"]`) as HTMLElement;
    if (!frameElement) {
      alert('No frame to export');
      return;
    }
    
    try {
      const canvas = await html2canvas(frameElement, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `${selectedKeyframe?.name || 'frame'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed');
    }
  }, [selectedKeyframeId, selectedKeyframe?.name]);

  // Save project as JSON
  const handleSaveProject = useCallback(() => {
    const projectData = {
      version: '1.0',
      keyframes,
      transitions,
      functionalStates,
      components,
      frameSize,
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = 'toumo-project.json';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, [keyframes, transitions, functionalStates, components, frameSize]);

  // Load project from JSON
  const projectInputRef = useRef<HTMLInputElement>(null);
  const handleLoadProject = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.keyframes && data.transitions) {
          loadProject(data);
        }
      } catch (err) {
        alert('Invalid project file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [loadProject]);

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
        if (event.altKey) {
          copyStyle();
        } else {
          copySelectedElements();
        }
        event.preventDefault();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
        if (event.altKey) {
          pasteStyle();
          event.preventDefault();
        } else if (!isTyping) {
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
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'g') {
        if (event.shiftKey) {
          ungroupSelectedElements();
        } else {
          groupSelectedElements();
        }
        event.preventDefault();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
        if (!isTyping && selectedKeyframe) {
          const allIds = selectedKeyframe.keyElements.map(el => el.id);
          useEditorStore.getState().setSelectedElementIds(allIds);
          event.preventDefault();
        }
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
        copySelectedElements();
        pasteElements();
        event.preventDefault();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === '0') {
        setCanvasScale(1);
        event.preventDefault();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === '1') {
        setCanvasScale(1);
        event.preventDefault();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === '=') {
        setCanvasScale(Math.min(3, 1.25));
        event.preventDefault();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === ']') {
        bringForward();
        event.preventDefault();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === '[') {
        sendBackward();
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
        case 'i':
          fileInputRef.current?.click();
          break;
        case 'l':
          setCurrentTool('line');
          break;
        case 'f':
          setCurrentTool('frame');
          break;
        case 'delete':
        case 'backspace':
          deleteSelectedElements();
          break;
        case 'escape':
          setSelectedElementId(null);
          break;
        case 'arrowup':
          nudgeSelectedElements(0, event.shiftKey ? -10 : -1);
          event.preventDefault();
          break;
        case 'arrowdown':
          nudgeSelectedElements(0, event.shiftKey ? 10 : 1);
          event.preventDefault();
          break;
        case 'arrowleft':
          nudgeSelectedElements(event.shiftKey ? -10 : -1, 0);
          event.preventDefault();
          break;
        case 'arrowright':
          nudgeSelectedElements(event.shiftKey ? 10 : 1, 0);
          event.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copySelectedElements, copyStyle, deleteSelectedElements, groupSelectedElements, nudgeSelectedElements, pasteElements, pasteStyle, redo, setCurrentTool, undo, ungroupSelectedElements]);

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
        {/* Alignment Tools */}
        {selectedElementIds.length >= 2 && (
          <div style={{ marginBottom: 16 }}>
            <Label>Align</Label>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              <button onClick={() => alignElements('left')} style={alignBtnStyle} title="Align Left">⬅</button>
              <button onClick={() => alignElements('center')} style={alignBtnStyle} title="Align Center H">↔</button>
              <button onClick={() => alignElements('right')} style={alignBtnStyle} title="Align Right">➡</button>
              <button onClick={() => alignElements('top')} style={alignBtnStyle} title="Align Top">⬆</button>
              <button onClick={() => alignElements('middle')} style={alignBtnStyle} title="Align Center V">↕</button>
              <button onClick={() => alignElements('bottom')} style={alignBtnStyle} title="Align Bottom">⬇</button>
            </div>
            {selectedElementIds.length >= 3 && (
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => distributeElements('horizontal')} style={{ ...alignBtnStyle, flex: 1 }}>Distribute H</button>
                <button onClick={() => distributeElements('vertical')} style={{ ...alignBtnStyle, flex: 1 }}>Distribute V</button>
              </div>
            )}
          </div>
        )}
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

        {/* Gradient Control */}
        <div style={{ marginBottom: 20 }}>
          <Label>Gradient</Label>
          <select
            value={currentStyle.gradientType || 'none'}
            onChange={(e) => {
              const type = e.target.value as 'none' | 'linear' | 'radial';
              handleStyleChange({
                gradientType: type,
                gradientStops: type !== 'none' && !currentStyle.gradientStops?.length
                  ? [{ color: '#3b82f6', position: 0 }, { color: '#8b5cf6', position: 100 }]
                  : currentStyle.gradientStops,
              });
            }}
            style={selectStyle}
          >
            <option value="none">None</option>
            <option value="linear">Linear</option>
            <option value="radial">Radial</option>
          </select>
          {currentStyle.gradientType === 'linear' && (
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 10, color: '#666' }}>Angle</span>
              <input
                type="range"
                min={0}
                max={360}
                value={currentStyle.gradientAngle ?? 180}
                onChange={(e) => handleStyleChange({ gradientAngle: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
          )}
          {currentStyle.gradientType && currentStyle.gradientType !== 'none' && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, color: '#666' }}>Start</span>
                <input
                  type="color"
                  value={currentStyle.gradientStops?.[0]?.color || '#3b82f6'}
                  onChange={(e) => {
                    const stops = [...(currentStyle.gradientStops || [])];
                    stops[0] = { color: e.target.value, position: 0 };
                    handleStyleChange({ gradientStops: stops });
                  }}
                  style={{ width: '100%', height: 28 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, color: '#666' }}>End</span>
                <input
                  type="color"
                  value={currentStyle.gradientStops?.[1]?.color || '#8b5cf6'}
                  onChange={(e) => {
                    const stops = [...(currentStyle.gradientStops || [])];
                    stops[1] = { color: e.target.value, position: 100 };
                    handleStyleChange({ gradientStops: stops });
                  }}
                  style={{ width: '100%', height: 28 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Opacity Control */}
        <div style={{ marginBottom: 20 }}>
          <Label>Opacity</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={currentStyle.fillOpacity ?? 1}
              onChange={(e) => handleStyleChange({ fillOpacity: Number(e.target.value) })}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: 11, color: '#888', width: 40 }}>
              {Math.round((currentStyle.fillOpacity ?? 1) * 100)}%
            </span>
          </div>
        </div>

        {/* Stroke Controls */}
        <div style={{ marginBottom: 20 }}>
          <Label>Stroke</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <input
              type="color"
              value={currentStyle.stroke || '#ffffff'}
              onChange={(e) => handleStyleChange({ stroke: e.target.value })}
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
              type="number"
              min={0}
              value={currentStyle.strokeWidth ?? 0}
              onChange={(e) => handleStyleChange({ strokeWidth: Number(e.target.value) })}
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Width"
            />
          </div>
        </div>

        {/* Shadow Controls */}
        <div style={{ marginBottom: 20 }}>
          <Label>Shadow</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <input
              type="color"
              value={currentStyle.shadowColor || '#000000'}
              onChange={(e) => handleStyleChange({ shadowColor: e.target.value })}
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
              value={currentStyle.shadowColor || '#000000'}
              onChange={(e) => handleStyleChange({ shadowColor: e.target.value })}
              style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 10, color: '#666' }}>X Offset</span>
              <input
                type="number"
                value={currentStyle.shadowOffsetX ?? 0}
                onChange={(e) => handleStyleChange({ shadowOffsetX: Number(e.target.value) })}
                style={inputStyle}
              />
            </div>
            <div>
              <span style={{ fontSize: 10, color: '#666' }}>Y Offset</span>
              <input
                type="number"
                value={currentStyle.shadowOffsetY ?? 4}
                onChange={(e) => handleStyleChange({ shadowOffsetY: Number(e.target.value) })}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <span style={{ fontSize: 10, color: '#666' }}>Blur</span>
              <input
                type="number"
                min={0}
                value={currentStyle.shadowBlur ?? 0}
                onChange={(e) => handleStyleChange({ shadowBlur: Number(e.target.value) })}
                style={inputStyle}
              />
            </div>
            <div>
              <span style={{ fontSize: 10, color: '#666' }}>Spread</span>
              <input
                type="number"
                value={currentStyle.shadowSpread ?? 0}
                onChange={(e) => handleStyleChange({ shadowSpread: Number(e.target.value) })}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Border Radius Control */}
        <div style={{ marginBottom: 20 }}>
          <Label>Border Radius</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <input
              type="number"
              min={0}
              value={currentStyle.borderRadius ?? 8}
              onChange={(e) => handleStyleChange({ borderRadius: Number(e.target.value) })}
              style={{ ...inputStyle, flex: 1 }}
              placeholder="All corners"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div>
              <span style={{ fontSize: 9, color: '#555' }}>TL</span>
              <input
                type="number"
                min={0}
                value={currentStyle.borderRadiusTL ?? ''}
                onChange={(e) => handleStyleChange({ 
                  borderRadiusTL: e.target.value ? Number(e.target.value) : undefined 
                })}
                style={inputStyle}
                placeholder="—"
              />
            </div>
            <div>
              <span style={{ fontSize: 9, color: '#555' }}>TR</span>
              <input
                type="number"
                min={0}
                value={currentStyle.borderRadiusTR ?? ''}
                onChange={(e) => handleStyleChange({ 
                  borderRadiusTR: e.target.value ? Number(e.target.value) : undefined 
                })}
                style={inputStyle}
                placeholder="—"
              />
            </div>
            <div>
              <span style={{ fontSize: 9, color: '#555' }}>BL</span>
              <input
                type="number"
                min={0}
                value={currentStyle.borderRadiusBL ?? ''}
                onChange={(e) => handleStyleChange({ 
                  borderRadiusBL: e.target.value ? Number(e.target.value) : undefined 
                })}
                style={inputStyle}
                placeholder="—"
              />
            </div>
            <div>
              <span style={{ fontSize: 9, color: '#555' }}>BR</span>
              <input
                type="number"
                min={0}
                value={currentStyle.borderRadiusBR ?? ''}
                onChange={(e) => handleStyleChange({ 
                  borderRadiusBR: e.target.value ? Number(e.target.value) : undefined 
                })}
                style={inputStyle}
                placeholder="—"
              />
            </div>
          </div>
        </div>

        {/* Rotation Control */}
        <div style={{ marginBottom: 20 }}>
          <Label>Rotation</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range"
              min={-180}
              max={180}
              value={currentStyle.rotation ?? 0}
              onChange={(e) => handleStyleChange({ rotation: Number(e.target.value) })}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              value={currentStyle.rotation ?? 0}
              onChange={(e) => handleStyleChange({ rotation: Number(e.target.value) })}
              style={{ ...inputStyle, width: 60 }}
            />
            <span style={{ fontSize: 11, color: '#666' }}>°</span>
          </div>
        </div>

        {/* Flip Controls */}
        <div style={{ marginBottom: 20 }}>
          <Label>Flip</Label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handleStyleChange({ flipX: !currentStyle.flipX })}
              style={{
                ...alignBtnStyle,
                flex: 1,
                background: currentStyle.flipX ? '#2563eb30' : '#0d0d0e',
              }}
            >
              ↔ Horizontal
            </button>
            <button
              onClick={() => handleStyleChange({ flipY: !currentStyle.flipY })}
              style={{
                ...alignBtnStyle,
                flex: 1,
                background: currentStyle.flipY ? '#2563eb30' : '#0d0d0e',
              }}
            >
              ↕ Vertical
            </button>
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
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
          handleImageFile(file);
        }
      }}
    >
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleImageFile(file);
            e.target.value = '';
          }
        }}
      />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            ref={projectInputRef}
            type="file"
            accept=".json"
            onChange={handleLoadProject}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => projectInputRef.current?.click()}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: 6,
              color: '#fff',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Load
          </button>
          <button
            onClick={handleSaveProject}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: 6,
              color: '#fff',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Save
          </button>
          <button
            onClick={handleExportPNG}
            style={{
              padding: '6px 12px',
              background: '#2563eb',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Export PNG
          </button>
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
          <LivePreview />
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
      
      {/* Status Bar */}
      <div style={{
        height: 24,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid #2a2a2a',
        background: '#161617',
        fontSize: 11,
        color: '#666',
      }}>
        <span>Tool: {currentTool}</span>
        <span>{selectedElementIds.length > 0 ? `${selectedElementIds.length} selected` : 'No selection'}</span>
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

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: '#0d0d0e',
  border: '1px solid #2a2a2a',
  borderRadius: 6,
  color: '#e5e5e5',
  fontSize: 12,
};

const alignBtnStyle: React.CSSProperties = {
  padding: '6px 8px',
  background: '#0d0d0e',
  border: '1px solid #2a2a2a',
  borderRadius: 4,
  color: '#888',
  fontSize: 11,
  cursor: 'pointer',
};
