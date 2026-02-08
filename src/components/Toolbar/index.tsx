import { useRef } from 'react';
import { useEditorStore } from '../../store';
import type { ToolType } from '../../types';
import { Tooltip } from './Tooltip';

// Undo/Redo icons
const UndoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);

const RedoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
  </svg>
);

// Alignment icons (compact versions for toolbar)
const AlignLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="2" height="12" fill="currentColor" />
    <rect x="5" y="4" width="8" height="3" fill="currentColor" opacity="0.6" />
    <rect x="5" y="9" width="5" height="3" fill="currentColor" opacity="0.6" />
  </svg>
);

const AlignCenterHIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="7" y="2" width="2" height="12" fill="currentColor" />
    <rect x="3" y="4" width="10" height="3" fill="currentColor" opacity="0.6" />
    <rect x="5" y="9" width="6" height="3" fill="currentColor" opacity="0.6" />
  </svg>
);

const AlignRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="12" y="2" width="2" height="12" fill="currentColor" />
    <rect x="3" y="4" width="8" height="3" fill="currentColor" opacity="0.6" />
    <rect x="6" y="9" width="5" height="3" fill="currentColor" opacity="0.6" />
  </svg>
);

const AlignTopIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="12" height="2" fill="currentColor" />
    <rect x="4" y="5" width="3" height="8" fill="currentColor" opacity="0.6" />
    <rect x="9" y="5" width="3" height="5" fill="currentColor" opacity="0.6" />
  </svg>
);

const AlignCenterVIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="7" width="12" height="2" fill="currentColor" />
    <rect x="4" y="3" width="3" height="10" fill="currentColor" opacity="0.6" />
    <rect x="9" y="5" width="3" height="6" fill="currentColor" opacity="0.6" />
  </svg>
);

const AlignBottomIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="12" width="12" height="2" fill="currentColor" />
    <rect x="4" y="3" width="3" height="8" fill="currentColor" opacity="0.6" />
    <rect x="9" y="6" width="3" height="5" fill="currentColor" opacity="0.6" />
  </svg>
);

interface ToolConfig {
  id: ToolType;
  icon: string;
  label: string;
  shortcut: string;
}

// 工具分组
const toolGroups: { name: string; tools: ToolConfig[] }[] = [
  {
    name: 'selection',
    tools: [
      { id: 'select', icon: '↖', label: 'Select', shortcut: 'V' },
      { id: 'hand', icon: '✋', label: 'Hand', shortcut: 'H' },
    ],
  },
  {
    name: 'shapes',
    tools: [
      { id: 'rectangle', icon: '▢', label: 'Rectangle', shortcut: 'R' },
      { id: 'ellipse', icon: '○', label: 'Ellipse', shortcut: 'O' },
      { id: 'line', icon: '╱', label: 'Line', shortcut: 'L' },
    ],
  },
  {
    name: 'content',
    tools: [
      { id: 'text', icon: 'T', label: 'Text', shortcut: 'T' },
      { id: 'image', icon: '🖼', label: 'Image', shortcut: '' },
      { id: 'frame', icon: '⬚', label: 'Frame', shortcut: 'F' },
    ],
  },
  {
    name: 'other',
    tools: [
      { id: 'pen', icon: '✒️', label: 'Pen', shortcut: 'P' },
      { id: 'eyedropper', icon: '💧', label: 'Eyedropper', shortcut: 'I' },
    ],
  },
];

function ToolDivider() {
  return <div className="toolbar-divider" />;
}

export function Toolbar() {
  const { 
    currentTool, 
    setCurrentTool, 
    addImageElement,
    selectedElementIds,
    alignElements,
    undo,
    redo,
    historyIndex,
    history,
  } = useEditorStore();
  
  const hasMultipleSelected = selectedElementIds.length >= 2;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    
    e.target.value = '';
  };

  const handleToolClick = (toolId: ToolType) => {
    if (toolId === 'image') {
      fileInputRef.current?.click();
    } else {
      setCurrentTool(toolId);
    }
  };

  return (
    <div className="toolbar">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
      
      {toolGroups.map((group, groupIndex) => (
        <div key={group.name} className="toolbar-group">
          {group.tools.map((tool) => (
            <Tooltip
              key={tool.id}
              label={tool.label}
              shortcut={tool.shortcut}
            >
              <button
                className={`tool-btn ${currentTool === tool.id ? 'active' : ''}`}
                onClick={() => handleToolClick(tool.id)}
              >
                {tool.icon}
              </button>
            </Tooltip>
          ))}
          {groupIndex < toolGroups.length - 1 && <ToolDivider />}
        </div>
      ))}
      
      <ToolDivider />
      
      {/* Alignment buttons - always visible */}
      <div className="toolbar-group alignment-group">
        <Tooltip 
          label={hasMultipleSelected ? "Align Left" : "Align Left (select 2+ elements)"} 
          shortcut=""
        >
          <button
            className={`tool-btn align-btn ${!hasMultipleSelected ? 'disabled' : ''}`}
            onClick={() => hasMultipleSelected && alignElements('left')}
            disabled={!hasMultipleSelected}
          >
            <AlignLeftIcon />
          </button>
        </Tooltip>
        <Tooltip 
          label={hasMultipleSelected ? "Align Center" : "Align Center (select 2+ elements)"} 
          shortcut=""
        >
          <button
            className={`tool-btn align-btn ${!hasMultipleSelected ? 'disabled' : ''}`}
            onClick={() => hasMultipleSelected && alignElements('center')}
            disabled={!hasMultipleSelected}
          >
            <AlignCenterHIcon />
          </button>
        </Tooltip>
        <Tooltip 
          label={hasMultipleSelected ? "Align Right" : "Align Right (select 2+ elements)"} 
          shortcut=""
        >
          <button
            className={`tool-btn align-btn ${!hasMultipleSelected ? 'disabled' : ''}`}
            onClick={() => hasMultipleSelected && alignElements('right')}
            disabled={!hasMultipleSelected}
          >
            <AlignRightIcon />
          </button>
        </Tooltip>
        <Tooltip 
          label={hasMultipleSelected ? "Align Top" : "Align Top (select 2+ elements)"} 
          shortcut=""
        >
          <button
            className={`tool-btn align-btn ${!hasMultipleSelected ? 'disabled' : ''}`}
            onClick={() => hasMultipleSelected && alignElements('top')}
            disabled={!hasMultipleSelected}
          >
            <AlignTopIcon />
          </button>
        </Tooltip>
        <Tooltip 
          label={hasMultipleSelected ? "Align Middle" : "Align Middle (select 2+ elements)"} 
          shortcut=""
        >
          <button
            className={`tool-btn align-btn ${!hasMultipleSelected ? 'disabled' : ''}`}
            onClick={() => hasMultipleSelected && alignElements('middle')}
            disabled={!hasMultipleSelected}
          >
            <AlignCenterVIcon />
          </button>
        </Tooltip>
        <Tooltip 
          label={hasMultipleSelected ? "Align Bottom" : "Align Bottom (select 2+ elements)"} 
          shortcut=""
        >
          <button
            className={`tool-btn align-btn ${!hasMultipleSelected ? 'disabled' : ''}`}
            onClick={() => hasMultipleSelected && alignElements('bottom')}
            disabled={!hasMultipleSelected}
          >
            <AlignBottomIcon />
          </button>
        </Tooltip>
      </div>
      
      <ToolDivider />
      
      {/* Undo/Redo buttons */}
      <div className="toolbar-group">
        <Tooltip label="Undo" shortcut="⌘Z">
          <button
            className={`tool-btn ${historyIndex <= 0 ? 'disabled' : ''}`}
            onClick={undo}
            disabled={historyIndex <= 0}
            style={{ opacity: historyIndex <= 0 ? 0.35 : 1, cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer' }}
          >
            <UndoIcon />
          </button>
        </Tooltip>
        <Tooltip label="Redo" shortcut="⌘⇧Z">
          <button
            className={`tool-btn ${historyIndex >= history.length - 1 ? 'disabled' : ''}`}
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            style={{ opacity: historyIndex >= history.length - 1 ? 0.35 : 1, cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer' }}
          >
            <RedoIcon />
          </button>
        </Tooltip>
      </div>
      
    </div>
  );
}
