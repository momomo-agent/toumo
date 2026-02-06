import { useRef, useState } from 'react';
import { useEditorStore } from '../../store';
import type { ToolType } from '../../types';
import { ExportModal } from '../ExportModal';
import { ImportModal } from '../ImportModal';

const tools: { id: ToolType; icon: string; label: string }[] = [
  { id: 'select', icon: '↖', label: 'Select (V)' },
  { id: 'rectangle', icon: '▢', label: 'Rectangle (R)' },
  { id: 'ellipse', icon: '○', label: 'Ellipse (O)' },
  { id: 'text', icon: 'T', label: 'Text (T)' },
  { id: 'image', icon: '🖼', label: 'Image (I)' },
  { id: 'line', icon: '╱', label: 'Line (L)' },
  { id: 'frame', icon: '⬚', label: 'Frame (F)' },
  { id: 'hand', icon: '✋', label: 'Hand (H)' },
  { id: 'eyedropper', icon: '💧', label: 'Eyedropper (E)' },
];

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
    
    // Reset input so same file can be selected again
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
      {tools.map((tool) => (
        <button
          key={tool.id}
          className={`tool-btn ${currentTool === tool.id ? 'active' : ''}`}
          onClick={() => handleToolClick(tool.id)}
          title={tool.label}
        >
          {tool.icon}
        </button>
      ))}
      
      {/* Divider */}
      <div style={{ width: 1, height: 24, background: '#333', margin: '0 8px' }} />
      
      {/* Export button */}
      <button
        className="tool-btn"
        onClick={() => setShowExportModal(true)}
        title="Export Project"
        style={{ fontSize: 14 }}
      >
        📤
      </button>
      
      {/* Import button */}
      <button
        className="tool-btn"
        onClick={() => setShowImportModal(true)}
        title="Import Project"
        style={{ fontSize: 14 }}
      >
        📥
      </button>
      
      {/* Export Modal */}
      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}
      
      {/* Import Modal */}
      {showImportModal && (
        <ImportModal onClose={() => setShowImportModal(false)} />
      )}
    </div>
  );
}
