import { useRef, useState } from 'react';
import { useEditorStore } from '../../store';
import type { ToolType } from '../../types';
import { ExportModal } from '../ExportModal';
import { ImportModal } from '../ImportModal';
import { Tooltip } from './Tooltip';

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
  const { currentTool, setCurrentTool, addImageElement } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

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
      
      {/* Export/Import buttons */}
      <div className="toolbar-group">
        <Tooltip label="Export Project" shortcut="">
          <button
            className="tool-btn"
            onClick={() => setShowExportModal(true)}
            style={{ fontSize: 14 }}
          >
            📤
          </button>
        </Tooltip>
        
        <Tooltip label="Import Project" shortcut="">
          <button
            className="tool-btn"
            onClick={() => setShowImportModal(true)}
            style={{ fontSize: 14 }}
          >
            📥
          </button>
        </Tooltip>
      </div>
      
      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}
      
      {showImportModal && (
        <ImportModal onClose={() => setShowImportModal(false)} />
      )}
    </div>
  );
}
