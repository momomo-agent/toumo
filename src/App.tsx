import { useEffect, useRef, useCallback, useState } from 'react';
import { useAutoSave } from './hooks/useAutoSave';
import { useFileOperations } from './hooks/useFileOperations';
import { Canvas } from './components/Canvas';
import { InteractionManager } from './components/InteractionManager';
import { StateInspector } from './components/Inspector/StateInspector';
import { ElementInspector } from './components/Inspector/ElementInspector';
import { TransitionInspector } from './components/Inspector/TransitionInspector';
import { LivePreview } from './components/LivePreview';
import { PreviewMode } from './components/PreviewMode';
import { isPreviewUrl, getProjectFromUrl, type ProjectData } from './utils/shareUtils';
import { EmptyState } from './components/EmptyState';
import { LayerPanel } from './components/LayerPanel';
import { ContextMenu } from './components/ContextMenu';
import type { ContextMenuProps } from './components/ContextMenu';
import { useEditorStore } from './store';
import type { ShapeStyle } from './types';
import { useResizablePanel } from './hooks/useResizablePanel';
import { useResponsiveLayout } from './hooks/useResponsiveLayout';
import { ResizeHandle } from './components/ResizeHandle';
import { CollapseToggle } from './components/CollapseToggle';

const FRAME_PRESETS = [
  { id: 'iphone14', label: 'iPhone 14', size: { width: 390, height: 844 } },
  { id: 'iphone14pro', label: 'iPhone 14 Pro', size: { width: 393, height: 852 } },
  { id: 'iphonese', label: 'iPhone SE', size: { width: 375, height: 667 } },
  { id: 'android', label: 'Android', size: { width: 360, height: 800 } },
  { id: 'ipad', label: 'iPad', size: { width: 820, height: 1180 } },
];

type ToolButton = {
  id: 'select' | 'rectangle' | 'ellipse' | 'text' | 'hand';
  icon: string;
  label: string;
};

export default function App() {
  useAutoSave();
  const {
    projectInputRef,
    handleImageFile,
    handleExportPNG,
    handleSaveProject,
    handleLoadProject,
  } = useFileOperations();
  // Preview mode state
  const [isPreviewMode, setIsPreviewMode] = useState(() => isPreviewUrl());
  const [previewData, setPreviewData] = useState<ProjectData | null>(() => getProjectFromUrl());
  const [contextMenu, _setContextMenu] = useState<ContextMenuProps | null>(null);

  const {
    keyframes,
    transitions,
    components,
    selectedKeyframeId,
    setSelectedKeyframeId,
    addKeyframe,
    selectedElementId,
    setSelectedElementId,
    selectedElementIds,
    setSelectedElementIds,
    selectedTransitionId,
    deleteSelectedElements,
    currentTool,
    setCurrentTool,
    copySelectedElements,
    duplicateSelectedElements,
    pasteElements,
    undo,
    redo,
    updateElement,
    frameSize,
    setFrameSize,
    groupSelectedElements,
    ungroupSelectedElements,
    alignElements,
    loadProject,
    copyStyle,
    pasteStyle,
    setCanvasScale,
    bringForward,
    sendBackward,
    canvasScale,
    canvasBackground,
    setCanvasBackground,
    showRulers,
    toggleRulers,
    snapToGrid,
    toggleSnapToGrid,
    setCanvasOffset,
    interactions,
    variables,
    history,
    historyIndex,
  } = useEditorStore();

  const selectedKeyframe = keyframes.find((kf) => kf.id === selectedKeyframeId);
  const sharedElements = useEditorStore(s => s.sharedElements);
  const elements = sharedElements;
  const selectedElement = elements.find((el) => el.id === selectedElementId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resizable & collapsible panels
  const { isSmall } = useResponsiveLayout();
  const leftPanel = useResizablePanel({
    defaultWidth: 220,
    minWidth: 160,
    maxWidth: 400,
    storageKey: 'toumo-left-panel-width',
    side: 'left',
  });
  const rightPanel = useResizablePanel({
    defaultWidth: 280,
    minWidth: 200,
    maxWidth: 480,
    storageKey: 'toumo-right-panel-width',
    side: 'right',
  });

  // Auto-collapse on small screens
  useEffect(() => {
    if (isSmall) {
      leftPanel.setCollapsed(true);
      rightPanel.setCollapsed(true);
    }
  }, [isSmall]);

  // Handle entering edit mode from preview
  const handleEnterEditMode = useCallback(() => {
    if (previewData) {
      loadProject(previewData);
    }
    setIsPreviewMode(false);
    setPreviewData(null);
  }, [previewData, loadProject]);

  // Handle entering preview mode from editor
  const handleEnterPreviewMode = useCallback(() => {
    const data: ProjectData = {
      version: '1.0',
      keyframes,
      transitions,
      components,
      frameSize,
      canvasBackground,
      interactions,
      variables,
    };
    setPreviewData(data);
    setIsPreviewMode(true);
  }, [keyframes, transitions, components, frameSize, canvasBackground, interactions, variables]);

  // If in preview mode, render PreviewMode component
  if (isPreviewMode && previewData) {
    return (
      <PreviewMode
        projectData={previewData}
        onEnterEditMode={handleEnterEditMode}
      />
    );
  }

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

      // --- Cmd/Ctrl combos (work even when typing, except where noted) ---

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
        if (event.altKey) {
          // Alt+Cmd+C → copy style (always)
          copyStyle();
          event.preventDefault();
        } else if (!isTyping) {
          // Cmd+C → copy elements (only when not typing)
          copySelectedElements();
          event.preventDefault();
        }
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'x') {
        if (!isTyping) {
          // Cmd+X → cut elements (copy + delete)
          copySelectedElements();
          deleteSelectedElements();
          event.preventDefault();
        }
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
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
        if (!isTyping) {
          duplicateSelectedElements();
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
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'e') {
        handleExportPNG();
        event.preventDefault();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        handleSaveProject();
        event.preventDefault();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
        if (!isTyping) {
          const allIds = elements.map(e => e.id);
          setSelectedElementIds(allIds);
          event.preventDefault();
        }
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

      // Zoom: handled by Canvas.tsx (Cmd+0, Cmd+=, Cmd+-), no duplicate here

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
          if (event.altKey && selectedElementIds.length > 0) {
            alignElements('middle');
          } else {
            setCurrentTool('select');
          }
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
          if (event.shiftKey && selectedElementIds.length > 0) {
            selectedElementIds.forEach(id => {
              const el = elements.find(e => e.id === id);
              if (el) updateElement(id, { visible: !el.visible });
            });
          } else if (event.altKey && selectedElementIds.length > 0) {
            alignElements('center');
          } else {
            setCurrentTool('hand');
          }
          break;
        case 'e':
          setCurrentTool('eyedropper');
          break;
        case 'p':
          setCurrentTool('pen');
          break;
        case 'i':
          fileInputRef.current?.click();
          break;
        case 'l':
          if (event.shiftKey && selectedElementIds.length > 0) {
            selectedElementIds.forEach(id => {
              const el = elements.find(e => e.id === id);
              if (el) updateElement(id, { locked: !el.locked });
            });
          } else {
            setCurrentTool('line');
          }
          break;
        case 'f':
          setCurrentTool('frame');
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          if (selectedElementIds.length > 0) {
            const opacity = Number(event.key) / 10;
            selectedElementIds.forEach(id => {
              const el = elements.find(e => e.id === id);
              if (el?.style) updateElement(id, { style: { ...el.style, fillOpacity: opacity } as ShapeStyle });
            });
          }
          break;
        case '0':
          if (selectedElementIds.length > 0) {
            selectedElementIds.forEach(id => {
              const el = elements.find(e => e.id === id);
              if (el?.style) updateElement(id, { style: { ...el.style, fillOpacity: 1 } as ShapeStyle });
            });
          }
          break;
        case 'delete':
        case 'backspace':
          deleteSelectedElements();
          break;
        case 'escape':
          setSelectedElementId(null);
          break;
        // Arrow keys for nudging are handled in Canvas.tsx to avoid double-fire
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copySelectedElements, copyStyle, deleteSelectedElements, duplicateSelectedElements, groupSelectedElements, pasteElements, pasteStyle, redo, setCurrentTool, undo, ungroupSelectedElements, handleExportPNG, handleSaveProject, elements, selectedElementIds, setSelectedElementIds, bringForward, sendBackward, setSelectedElementId, updateElement, alignElements, setCanvasScale, canvasScale]);

  // Determine what to show in inspector
  const renderInspector = () => {
    // If a transition is selected, show transition inspector
    if (selectedTransitionId) {
      return <TransitionInspector />;
    }
    
    // Multi-selection info
    if (selectedElementIds.length > 1 && !selectedElement) {
      return (
        <div style={{ padding: 16, color: '#888', textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>📦</div>
          <div>{selectedElementIds.length} elements selected</div>
          <div style={{ fontSize: 11, marginTop: 8 }}>Use alignment tools or group them</div>
        </div>
      );
    }
    
    // If an element is selected, show element properties + state mapping
    if (selectedElement) {
      return (
        <>
          <ElementInspector />
          <div style={{ marginTop: 24 }}>
            <StateInspector />
          </div>
        </>
      );
    }
    
    // Default: show state mapping for current keyframe
    return (
      <>
        <div style={{ padding: 16, color: '#666', textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 11 }}>Select an element to edit</div>
        </div>
        <StateInspector />
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
            onClick={() => {
              const w = prompt('Width:', String(frameSize.width));
              const h = prompt('Height:', String(frameSize.height));
              if (w && h) setFrameSize({ width: Number(w), height: Number(h) });
            }}
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
            Resize
          </button>
          <input
            type="color"
            value={canvasBackground}
            onChange={(e) => setCanvasBackground(e.target.value)}
            title="Canvas Background"
            style={{ width: 32, height: 32, border: '1px solid #333', borderRadius: 6, cursor: 'pointer' }}
          />
          <button
            onClick={() => toggleRulers()}
            style={{
              padding: '6px 12px',
              background: showRulers ? '#2563eb20' : 'transparent',
              border: showRulers ? '1px solid #2563eb' : '1px solid #333',
              borderRadius: 6,
              color: showRulers ? '#2563eb' : '#fff',
              fontSize: 12,
              cursor: 'pointer',
            }}
            title="Toggle Rulers"
          >
            📏
          </button>
          <button
            onClick={() => toggleSnapToGrid()}
            style={{
              padding: '6px 12px',
              background: snapToGrid ? '#2563eb20' : 'transparent',
              border: snapToGrid ? '1px solid #2563eb' : '1px solid #333',
              borderRadius: 6,
              color: snapToGrid ? '#2563eb' : '#fff',
              fontSize: 12,
              cursor: 'pointer',
            }}
            title="Snap to Grid"
          >
            #
          </button>
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
          <button
            onClick={() => {
              if (!selectedKeyframe) return;
              const els = useEditorStore.getState().sharedElements;
              let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${frameSize.width}" height="${frameSize.height}">`;
              svg += `<rect width="100%" height="100%" fill="${canvasBackground}"/>`;
              els.forEach(el => {
                if (el.shapeType === 'rectangle') {
                  svg += `<rect x="${el.position.x}" y="${el.position.y}" width="${el.size.width}" height="${el.size.height}" fill="${el.style?.fill || '#333'}" rx="${el.style?.borderRadius || 0}"/>`;
                } else if (el.shapeType === 'ellipse') {
                  const cx = el.position.x + el.size.width / 2;
                  const cy = el.position.y + el.size.height / 2;
                  svg += `<ellipse cx="${cx}" cy="${cy}" rx="${el.size.width / 2}" ry="${el.size.height / 2}" fill="${el.style?.fill || '#333'}"/>`;
                } else if (el.shapeType === 'text') {
                  svg += `<text x="${el.position.x + el.size.width / 2}" y="${el.position.y + el.size.height / 2}" fill="${el.style?.textColor || '#fff'}" font-size="${el.style?.fontSize || 14}" text-anchor="middle" dominant-baseline="middle">${el.text || ''}</text>`;
                }
              });
              svg += '</svg>';
              const blob = new Blob([svg], { type: 'image/svg+xml' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'toumo-export.svg';
              a.click();
              URL.revokeObjectURL(url);
            }}
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
            Export SVG
          </button>
          <button
            onClick={handleEnterPreviewMode}
            style={{
              padding: '6px 12px',
              background: '#8b5cf6',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ▶️ Preview
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
                tabIndex={0}
                role="radio"
                aria-checked={currentTool === tool.id}
                aria-label={tool.label}
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
                  // folme
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px #2563eb';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onMouseEnter={(e) => {
                  if (currentTool !== tool.id) {
                    e.currentTarget.style.background = '#1f1f1f';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentTool !== tool.id) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#888';
                  }
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
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#555', marginRight: 4 }}>
                {historyIndex}/{history.length - 1}
              </span>
              <button 
                style={{ 
                  border: '1px solid #333', 
                  borderRadius: 6, 
                  padding: '6px 10px', 
                  background: 'transparent', 
                  color: historyIndex <= 0 ? '#444' : '#888', 
                  cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer', 
                  // folme
                  opacity: historyIndex <= 0 ? 0.5 : 1,
                }} 
                onClick={undo}
                disabled={historyIndex <= 0}
                title="撤销 (⌘Z)"
              >↩ 撤销</button>
              <button 
                style={{ 
                  border: '1px solid #333', 
                  borderRadius: 6, 
                  padding: '6px 10px', 
                  background: 'transparent', 
                  color: historyIndex >= history.length - 1 ? '#444' : '#888', 
                  cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer', 
                  // folme
                  opacity: historyIndex >= history.length - 1 ? 0.5 : 1,
                }} 
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                title="重做 (⌘⇧Z)"
              >重做 ↪</button>
            </div>
          </div>

          {/* Editor Content */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Left Panel: Variants + Layers (Figma style) */}
            <aside
              style={{
                width: leftPanel.collapsed ? 0 : leftPanel.width,
                minWidth: leftPanel.collapsed ? 0 : undefined,
                borderRight: leftPanel.collapsed ? 'none' : '1px solid #2a2a2a',
                background: '#151515',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                // folme
                position: 'relative',
              }}
            >
              <CollapseToggle collapsed={leftPanel.collapsed} onToggle={leftPanel.toggleCollapse} side="left" label="图层" />
              

              {/* Variants (top) */}
              <div style={{ padding: 12, borderBottom: '1px solid #2a2a2a' }}>
                <h3 style={{ fontSize: 11, textTransform: 'uppercase', color: '#666', margin: 0, marginBottom: 8, letterSpacing: '0.5px' }}>Variants</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {keyframes.map((kf) => (
                    <button
                      key={kf.id}
                      onClick={() => handleSelectKeyframe(kf.id)}
                      style={{
                        padding: '8px 10px',
                        background: selectedKeyframeId === kf.id ? '#2563eb20' : 'transparent',
                        border: selectedKeyframeId === kf.id ? '1px solid #2563eb' : '1px solid #2a2a2a',
                        borderRadius: 6,
                        color: '#fff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        // folme
                      }}
                      onMouseEnter={(e) => {
                        if (selectedKeyframeId !== kf.id) {
                          e.currentTarget.style.background = '#1a1a1a';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedKeyframeId !== kf.id) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: 12 }}>{kf.name}</strong>
                      <span style={{ fontSize: 10, color: '#666' }}>
                        {kf.displayStateId ? `→ ${kf.displayStateId}` : 'No mapping'}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={handleAddKeyframe}
                    style={{
                      padding: '8px 10px',
                      border: '1px dashed #333',
                      borderRadius: 6,
                      color: '#666',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 11,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#999'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#666'; }}
                  >
                    + Add State
                  </button>
                </div>
              </div>
              
              {/* Layers Panel (bottom, flex: 1) */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <LayerPanel />
              </div>
            </aside>

            {/* Left resize handle */}
            {!leftPanel.collapsed && (
              <ResizeHandle onMouseDown={leftPanel.handleMouseDown} isDragging={leftPanel.isDragging} side="left" />
            )}

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
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Canvas />
                  {elements.length === 0 && <EmptyState />}
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

        {/* Right resize handle */}
        {!rightPanel.collapsed && (
          <ResizeHandle onMouseDown={rightPanel.handleMouseDown} isDragging={rightPanel.isDragging} side="right" />
        )}

        {/* Inspector Panel */}
        <div
          style={{
            width: rightPanel.collapsed ? 0 : rightPanel.width,
            minWidth: rightPanel.collapsed ? 0 : undefined,
            background: '#161617',
            borderLeft: rightPanel.collapsed ? 'none' : '1px solid #2a2a2a',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            // folme
            position: 'relative',
          }}
        >
          <CollapseToggle collapsed={rightPanel.collapsed} onToggle={rightPanel.toggleCollapse} side="right" label="检查器" />
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
        <span>🔧 {
          ({
            select: '选择工具 (V)',
            rectangle: '矩形工具 (R)',
            ellipse: '椭圆工具 (O)',
            text: '文字工具 (T)',
            hand: '手型工具 (H)',
            eyedropper: '取色器 (E)',
            pen: '钢笔工具 (P)',
            line: '线条工具 (L)',
            frame: '画板工具 (F)',
          } as Record<string, string>)[currentTool] || currentTool
        }</span>
        <span>{frameSize.width} × {frameSize.height}</span>
        <span>Zoom: {Math.round(canvasScale * 100)}%</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { label: '50%', scale: 0.5 },
            { label: '100%', scale: 1 },
            { label: '200%', scale: 2 },
          ].map(({ label, scale }) => (
            <button
              key={label}
              onClick={() => setCanvasScale(scale)}
              style={{
                padding: '2px 6px',
                background: canvasScale === scale ? '#2563eb20' : '#1a1a1a',
                border: `1px solid ${canvasScale === scale ? '#2563eb50' : '#333'}`,
                borderRadius: 4,
                color: canvasScale === scale ? '#3b82f6' : '#888',
                fontSize: 10,
                cursor: 'pointer',
                // folme
              }}
              onMouseEnter={(e) => {
                if (canvasScale !== scale) {
                  e.currentTarget.style.borderColor = '#555';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (canvasScale !== scale) {
                  e.currentTarget.style.borderColor = '#333';
                  e.currentTarget.style.color = '#888';
                }
              }}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setCanvasScale(Math.min(0.8, 600 / frameSize.width))}
            style={{ padding: '2px 6px', background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 10, cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#888'; }}
          >Fit</button>
          <button
            onClick={() => setCanvasOffset({ x: 0, y: 0 })}
            style={{ padding: '2px 6px', background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 10, cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#888'; }}
          >⊙</button>
        </div>
        <span>{selectedElementIds.length === 1 && sharedElements.find(e => e.id === selectedElementIds[0]) 
          ? `X: ${Math.round(sharedElements.find(e => e.id === selectedElementIds[0])!.position.x)} Y: ${Math.round(sharedElements.find(e => e.id === selectedElementIds[0])!.position.y)}`
          : selectedElementIds.length > 0 ? `${selectedElementIds.length} selected` : 'No selection'}</span>
      </div>
      {contextMenu && <ContextMenu {...contextMenu} />}
    </div>
  );
}

