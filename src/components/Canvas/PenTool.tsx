import { useState, useCallback } from 'react';
import { useEditorStore } from '../../store';
import type { Position } from '../../types';

interface PenToolProps {
  isActive: boolean;
  canvasOffset: Position;
  canvasScale: number;
  frameLayout: { x: number; y: number } | null;
}

interface PathPoint {
  x: number;
  y: number;
  type: 'move' | 'line';
}

export function PenTool({ isActive, canvasOffset, canvasScale, frameLayout }: PenToolProps) {
  const { addElement, setCurrentTool } = useEditorStore();
  const [points, setPoints] = useState<PathPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const toFrameSpace = useCallback((clientX: number, clientY: number) => {
    if (!frameLayout) return null;
    const x = (clientX - canvasOffset.x) / canvasScale - frameLayout.x;
    const y = (clientY - canvasOffset.y) / canvasScale - frameLayout.y;
    return { x, y };
  }, [canvasOffset, canvasScale, frameLayout]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!isActive || !frameLayout) return;
    
    const point = toFrameSpace(e.clientX, e.clientY);
    if (!point) return;

    if (!isDrawing) {
      setIsDrawing(true);
      setPoints([{ ...point, type: 'move' }]);
    } else {
      setPoints(prev => [...prev, { ...point, type: 'line' }]);
    }
  }, [isActive, isDrawing, frameLayout, toFrameSpace]);

  const handleDoubleClick = useCallback(() => {
    if (points.length < 2) {
      setPoints([]);
      setIsDrawing(false);
      return;
    }

    // Create path element
    const pathData = points.map((p, i) => 
      i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
    ).join(' ');

    const minX = Math.min(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxX = Math.max(...points.map(p => p.x));
    const maxY = Math.max(...points.map(p => p.y));

    addElement({
      id: `el-${Date.now()}`,
      name: 'Path',
      category: 'content',
      isKeyElement: true,
      attributes: [],
      position: { x: minX, y: minY },
      size: { width: maxX - minX || 10, height: maxY - minY || 10 },
      shapeType: 'path',
      style: {
        fill: 'transparent',
        fillOpacity: 1,
        stroke: '#ffffff',
        strokeWidth: 2,
        strokeOpacity: 1,
        borderRadius: 0,
        pathData,
      },
    });

    setPoints([]);
    setIsDrawing(false);
    setCurrentTool('select');
  }, [points, addElement, setCurrentTool]);

  if (!isActive || !frameLayout) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: isDrawing ? 'auto' : 'none',
        cursor: 'crosshair',
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {points.length > 0 && (
        <svg
          style={{
            position: 'absolute',
            left: frameLayout.x * canvasScale + canvasOffset.x,
            top: frameLayout.y * canvasScale + canvasOffset.y,
            width: 2000,
            height: 2000,
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          <path
            d={points.map((p, i) => 
              i === 0 ? `M ${p.x * canvasScale} ${p.y * canvasScale}` 
                      : `L ${p.x * canvasScale} ${p.y * canvasScale}`
            ).join(' ')}
            fill="none"
            stroke="#2563eb"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x * canvasScale}
              cy={p.y * canvasScale}
              r={4}
              fill={i === 0 ? '#2563eb' : '#fff'}
              stroke="#2563eb"
              strokeWidth={2}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
