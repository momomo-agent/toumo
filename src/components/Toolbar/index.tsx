import { useEditorStore } from '../../store';
import type { ToolType } from '../../types';

const tools: { id: ToolType; icon: string; label: string }[] = [
  { id: 'select', icon: '↖', label: 'Select (V)' },
  { id: 'rectangle', icon: '▢', label: 'Rectangle (R)' },
  { id: 'ellipse', icon: '○', label: 'Ellipse (O)' },
  { id: 'text', icon: 'T', label: 'Text (T)' },
  { id: 'hand', icon: '✋', label: 'Hand (H)' },
];

export function Toolbar() {
  const { currentTool, setCurrentTool } = useEditorStore();

  return (
    <div className="toolbar">
      {tools.map((tool) => (
        <button
          key={tool.id}
          className={`tool-btn ${currentTool === tool.id ? 'active' : ''}`}
          onClick={() => setCurrentTool(tool.id)}
          title={tool.label}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}
