import type { Position } from '../../types';

interface SelectionBoxProps {
  start: Position;
  end: Position;
}

export function SelectionBox({ start, end }: SelectionBoxProps) {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        border: '1px solid #3b82f6',
        background: 'rgba(59, 130, 246, 0.1)',
        pointerEvents: 'none',
      }}
    />
  );
}
