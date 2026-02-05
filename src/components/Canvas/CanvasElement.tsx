import { useEditorStore } from '../../store';
import type { KeyElement } from '../../types';

interface Props {
  element: KeyElement;
  isSelected: boolean;
}

export function CanvasElement({ element, isSelected }: Props) {
  const style = element.style || { fill: '#3b82f6', borderRadius: 8 };
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
        borderRadius: style.borderRadius || 8,
        cursor: 'pointer',
      }}
      onClick={(e) => { 
        e.stopPropagation(); 
        setSelectedElementId(element.id); 
      }}
    />
  );
}
