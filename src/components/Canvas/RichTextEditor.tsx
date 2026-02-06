import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyElement } from '../../types';
import { useEditorStore } from '../../store';

// Available fonts for the editor
const FONT_OPTIONS = [
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times' },
  { value: 'Courier New, monospace', label: 'Courier' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'system-ui, sans-serif', label: 'System' },
];

// Font size options
const FONT_SIZE_OPTIONS = [
  { value: '10px', label: '10' },
  { value: '12px', label: '12' },
  { value: '14px', label: '14' },
  { value: '16px', label: '16' },
  { value: '18px', label: '18' },
  { value: '20px', label: '20' },
  { value: '24px', label: '24' },
  { value: '28px', label: '28' },
  { value: '32px', label: '32' },
  { value: '36px', label: '36' },
  { value: '48px', label: '48' },
  { value: '64px', label: '64' },
];

// Preset colors for quick selection
const PRESET_COLORS = [
  '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ff6b6b', '#4ecdc4',
  '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#636e72',
];

// Rich text segment with formatting
export interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
}

// Parse plain text to segments (initially just one segment)
export function parseTextToSegments(text: string): TextSegment[] {
  if (!text) return [{ text: '' }];
  return [{ text }];
}

// Convert segments back to plain text (for backward compatibility)
export function segmentsToPlainText(segments: TextSegment[]): string {
  return segments.map(s => s.text).join('');
}

interface RichTextEditorProps {
  element: KeyElement;
  onClose: () => void;
}

export function RichTextEditor({ element, onClose }: RichTextEditorProps) {
  const { updateElement, pushHistory } = useEditorStore();
  const editorRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);

  // Initialize content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = element.text || '';
      editorRef.current.focus();
      
      // Select all text initially
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, []);

  // Track selection changes
  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || !editorRef.current) return;
    
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        // Calculate selection offsets
        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(editorRef.current);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        const start = preSelectionRange.toString().length;
        
        setSelection({
          start,
          end: start + range.toString().length,
        });
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  // Apply formatting to selection
  const applyFormat = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      saveAndClose();
      return;
    }

    // Format shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          applyFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          applyFormat('italic');
          break;
        case 'u':
          e.preventDefault();
          applyFormat('underline');
          break;
      }
    }
  }, [applyFormat]);

  // Save content and close editor
  const saveAndClose = useCallback(() => {
    if (editorRef.current) {
      pushHistory();
      const htmlContent = editorRef.current.innerHTML;
      // Store both HTML (for rich text) and plain text (for backward compatibility)
      updateElement(element.id, { 
        text: editorRef.current.innerText,
        style: {
          ...element.style,
          // Store rich text HTML in a custom property
          // @ts-ignore - extending style for rich text
          richTextHtml: htmlContent,
        }
      });
    }
    onClose();
  }, [element.id, element.style, onClose, pushHistory, updateElement]);

  // Handle click outside
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Check if the new focus target is within the toolbar
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget?.closest('.rich-text-toolbar')) {
      return;
    }
    saveAndClose();
  }, [saveAndClose]);

  return (
    <div
      className="rich-text-editor-container"
      style={{
        position: 'absolute',
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        minHeight: element.size.height,
        zIndex: 10000,
      }}
    >
      {/* Formatting Toolbar */}
      <div
        className="rich-text-toolbar"
        style={{
          position: 'absolute',
          top: -40,
          left: 0,
          display: 'flex',
          gap: 4,
          padding: '4px 8px',
          background: '#2a2a2a',
          borderRadius: 6,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          zIndex: 10001,
        }}
        onMouseDown={(e) => e.preventDefault()} // Prevent blur
      >
        <ToolbarButton
          icon="B"
          title="Bold (⌘B)"
          style={{ fontWeight: 'bold' }}
          onClick={() => applyFormat('bold')}
        />
        <ToolbarButton
          icon="I"
          title="Italic (⌘I)"
          style={{ fontStyle: 'italic' }}
          onClick={() => applyFormat('italic')}
        />
        <ToolbarButton
          icon="U"
          title="Underline (⌘U)"
          style={{ textDecoration: 'underline' }}
          onClick={() => applyFormat('underline')}
        />
        <div style={{ width: 1, background: '#444', margin: '0 4px' }} />
        <select
          style={{
            background: '#333',
            border: 'none',
            color: '#fff',
            padding: '2px 4px',
            borderRadius: 4,
            fontSize: 12,
          }}
          onChange={(e) => applyFormat('fontSize', e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <option value="1">12px</option>
          <option value="2">14px</option>
          <option value="3">16px</option>
          <option value="4">18px</option>
          <option value="5">24px</option>
          <option value="6">32px</option>
          <option value="7">48px</option>
        </select>
      </div>

      {/* Editable Content */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        style={{
          width: '100%',
          minHeight: element.size.height,
          padding: element.style?.padding ? `${element.style.padding}px` : '8px',
          color: element.style?.textColor || '#fff',
          fontSize: element.style?.fontSize || 14,
          fontFamily: element.style?.fontFamily || 'Inter, sans-serif',
          fontWeight: element.style?.fontWeight || 'normal',
          textAlign: element.style?.textAlign || 'left',
          lineHeight: element.style?.lineHeight || 1.4,
          letterSpacing: element.style?.letterSpacing || 0,
          outline: 'none',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '2px solid #3b82f6',
          borderRadius: element.style?.borderRadius || 4,
          boxSizing: 'border-box',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          cursor: 'text',
        }}
      />

      {/* Selection info */}
      {selection && selection.start !== selection.end && (
        <div
          style={{
            position: 'absolute',
            bottom: -24,
            left: 0,
            fontSize: 10,
            color: '#888',
            background: '#1a1a1a',
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          Selected: {selection.end - selection.start} chars
        </div>
      )}
    </div>
  );
}

// Toolbar button component
function ToolbarButton({
  icon,
  title,
  style,
  onClick,
  active,
}: {
  icon: string;
  title: string;
  style?: React.CSSProperties;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 24,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active ? '#3b82f6' : 'transparent',
        border: 'none',
        borderRadius: 4,
        color: '#fff',
        fontSize: 12,
        cursor: 'pointer',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = active ? '#3b82f6' : '#444';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = active ? '#3b82f6' : 'transparent';
      }}
    >
      {icon}
    </button>
  );
}
