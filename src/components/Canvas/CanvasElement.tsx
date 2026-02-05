import { useEditorStore } from '../../store';
import { DEFAULT_STYLE } from '../../types';
import type { KeyElement } from '../../types';

interface Props {
  element: KeyElement;
  isSelected: boolean;
}

export function CanvasElement({ element, isSelected }: Props) {
  const style = { ...DEFAULT_STYLE, ...element.style };
  const { setSelectedElementId } = useEditorStore();

  return (
    <div
      className={`canvas-element ${isSelected ? 'selected' : ''}`}
      style={{
        position: 'absolute',
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
        backgroundColor: style.fill,
        borderRadius: element.shapeType === 'ellipse' ? '50%' : style.borderRadius,
        cursor: 'pointer',
      }}
      onClick={(e) => { 
        e.stopPropagation(); 
        setSelectedElementId(element.id); 
      }}
    >
      {element.shapeType === 'text' && (
        <span style={{ color: '#fff' }}>{element.text || 'Text'}</span>
      )}
    </div>
  );
}
