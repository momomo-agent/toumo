import { useState, useCallback, useEffect } from 'react';
import { useEditorStore } from '../../store';
import type { Position, KeyElement } from '../../types';

interface PathEditorProps {
  element: KeyElement;
  canvasOffset: Position;
  canvasScale: number;
  frameLayout: { x: number; y: number } | null;
}

interface PathPoint {
  x: number;
  y: number;
  handleIn?: { x: number; y: number };
  handleOut?: { x: number; y: number };
}

interface DragState {
  type: 'anchor' | 'handleIn' | 'handleOut';
  pointIndex: number;
  startMousePos: { x: number; y: number };
  startPointPos: { x: number; y: number };
  startHandlePos?: { x: number; y: number };
}

export function PathEditor({ element, canvasOffset, canvasScale, frameLayout }: PathEditorProps) {
  const { updateElement } = useEditorStore();
  const [points, setPoints] = useState<PathPoint[]>([]);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  // 从 element 解析路径点
  useEffect(() => {
    if (!element.style?.pathPoints) {
      // 从 pathData 解析（简单解析）
      const pathData = element.style?.pathData || '';
      const parsed = parsePathData(pathData);
      setPoints(parsed);
    } else {
      // 直接使用 pathPoints
      const pts = element.style.pathPoints.map(p => ({
        x: p.x,
        y: p.y,
        handleIn: p.cx1 !== undefined ? { x: p.cx1, y: p.cy1 || 0 } : undefined,
        handleOut: p.cx2 !== undefined ? { x: p.cx2, y: p.cy2 || 0 } : undefined,
      }));
      setPoints(pts);
    }
  }, [element.id, element.style?.pathData, element.style?.pathPoints]);

  // 简单解析 SVG path data
  const parsePathData = (d: string): PathPoint[] => {
    const pts: PathPoint[] = [];
    const commands = d.match(/[MLCQZ][^MLCQZ]*/gi) || [];
    
    for (const cmd of commands) {
      const type = cmd[0].toUpperCase();
      const nums = cmd.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
      
      if (type === 'M' || type === 'L') {
        if (nums.length >= 2) {
          pts.push({ x: nums[0], y: nums[1] });
        }
      } else if (type === 'C') {
        // C cp1x cp1y cp2x cp2y x y
        if (nums.length >= 6) {
          const lastPt = pts[pts.length - 1];
          if (lastPt) {
            lastPt.handleOut = { x: nums[0] - lastPt.x, y: nums[1] - lastPt.y };
          }
          pts.push({
            x: nums[4],
            y: nums[5],
            handleIn: { x: nums[2] - nums[4], y: nums[3] - nums[5] },
          });
        }
      }
    }
    return pts;
  };

  // 生成新的 pathData
  const generatePathData = useCallback((pts: PathPoint[], closed: boolean) => {
    if (pts.length === 0) return '';
    
    let d = `M ${pts[0].x} ${pts[0].y}`;
    
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      
      const hasHandleOut = prev.handleOut && (prev.handleOut.x !== 0 || prev.handleOut.y !== 0);
      const hasHandleIn = curr.handleIn && (curr.handleIn.x !== 0 || curr.handleIn.y !== 0);
      
      if (hasHandleOut || hasHandleIn) {
        const cp1x = prev.x + (prev.handleOut?.x || 0);
        const cp1y = prev.y + (prev.handleOut?.y || 0);
        const cp2x = curr.x + (curr.handleIn?.x || 0);
        const cp2y = curr.y + (curr.handleIn?.y || 0);
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      } else {
        d += ` L ${curr.x} ${curr.y}`;
      }
    }
    
    if (closed && pts.length > 2) {
      const last = pts[pts.length - 1];
      const first = pts[0];
      const hasHandleOut = last.handleOut && (last.handleOut.x !== 0 || last.handleOut.y !== 0);
      const hasHandleIn = first.handleIn && (first.handleIn.x !== 0 || first.handleIn.y !== 0);
      
      if (hasHandleOut || hasHandleIn) {
        const cp1x = last.x + (last.handleOut?.x || 0);
        const cp1y = last.y + (last.handleOut?.y || 0);
        const cp2x = first.x + (first.handleIn?.x || 0);
        const cp2y = first.y + (first.handleIn?.y || 0);
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${first.x} ${first.y}`;
      }
      d += ' Z';
    }
    
    return d;
  }, []);

  // 更新元素
  const updatePath = useCallback((newPoints: PathPoint[]) => {
    const closed = element.style?.pathClosed || false;
    const pathData = generatePathData(newPoints, closed);
    
    const pathPoints = newPoints.map((p, i) => ({
      x: p.x,
      y: p.y,
      type: i === 0 ? 'move' as const : 'curve' as const,
      cx1: p.handleIn?.x,
      cy1: p.handleIn?.y,
      cx2: p.handleOut?.x,
      cy2: p.handleOut?.y,
    }));

    updateElement(element.id, {
      style: {
        ...element.style!,
        pathData,
        pathPoints,
      },
    });
  }, [element.id, element.style, generatePathData, updateElement]);

  // 转换坐标
  const toFrameSpace = useCallback((clientX: number, clientY: number) => {
    if (!frameLayout) return null;
    const x = (clientX - canvasOffset.x) / canvasScale - frameLayout.x;
    const y = (clientY - canvasOffset.y) / canvasScale - frameLayout.y;
    return { x, y };
  }, [canvasOffset, canvasScale, frameLayout]);

  // 开始拖拽
  const handlePointMouseDown = useCallback((e: React.MouseEvent, index: number, type: 'anchor' | 'handleIn' | 'handleOut') => {
    e.stopPropagation();
    e.preventDefault();
    
    const mousePos = toFrameSpace(e.clientX, e.clientY);
    if (!mousePos) return;

    const point = points[index];
    setSelectedPointIndex(index);
    
    let startHandlePos: { x: number; y: number } | undefined;
    if (type === 'handleIn' && point.handleIn) {
      startHandlePos = { ...point.handleIn };
    } else if (type === 'handleOut' && point.handleOut) {
      startHandlePos = { ...point.handleOut };
    }

    setDragState({
      type,
      pointIndex: index,
      startMousePos: mousePos,
      startPointPos: { x: point.x, y: point.y },
      startHandlePos,
    });
  }, [points, toFrameSpace]);

  // 拖拽中
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const mousePos = toFrameSpace(e.clientX, e.clientY);
      if (!mousePos) return;

      const dx = mousePos.x - dragState.startMousePos.x;
      const dy = mousePos.y - dragState.startMousePos.y;

      setPoints(prev => {
        const newPoints = [...prev];
        const point = { ...newPoints[dragState.pointIndex] };

        if (dragState.type === 'anchor') {
          point.x = dragState.startPointPos.x + dx;
          point.y = dragState.startPointPos.y + dy;
        } else if (dragState.type === 'handleIn' && dragState.startHandlePos) {
          point.handleIn = {
            x: dragState.startHandlePos.x + dx,
            y: dragState.startHandlePos.y + dy,
          };
          // Alt 键不对称
          if (!e.altKey && point.handleOut) {
            point.handleOut = {
              x: -(dragState.startHandlePos.x + dx),
              y: -(dragState.startHandlePos.y + dy),
            };
          }
        } else if (dragState.type === 'handleOut' && dragState.startHandlePos) {
          point.handleOut = {
            x: dragState.startHandlePos.x + dx,
            y: dragState.startHandlePos.y + dy,
          };
          if (!e.altKey && point.handleIn) {
            point.handleIn = {
              x: -(dragState.startHandlePos.x + dx),
              y: -(dragState.startHandlePos.y + dy),
            };
          }
        }

        newPoints[dragState.pointIndex] = point;
        return newPoints;
      });
    };

    const handleMouseUp = () => {
      updatePath(points);
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, points, toFrameSpace, updatePath]);

  // 删除选中的点
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPointIndex !== null) {
        if (points.length > 2) {
          const newPoints = points.filter((_, i) => i !== selectedPointIndex);
          setPoints(newPoints);
          updatePath(newPoints);
          setSelectedPointIndex(null);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPointIndex, points, updatePath]);

  if (!frameLayout || points.length === 0) return null;

  return (
    <svg
      style={{
        position: 'absolute',
        left: frameLayout.x * canvasScale + canvasOffset.x + element.position.x * canvasScale,
        top: frameLayout.y * canvasScale + canvasOffset.y + element.position.y * canvasScale,
        width: 4000,
        height: 4000,
        pointerEvents: 'none',
        overflow: 'visible',
        transform: `scale(${canvasScale})`,
        transformOrigin: '0 0',
      }}
    >
      {points.map((p, i) => {
        const isSelected = selectedPointIndex === i;
        const relX = p.x - element.position.x;
        const relY = p.y - element.position.y;
        
        return (
          <g key={i}>
            {/* handleIn */}
            {p.handleIn && (p.handleIn.x !== 0 || p.handleIn.y !== 0) && (
              <>
                <line
                  x1={relX} y1={relY}
                  x2={relX + p.handleIn.x} y2={relY + p.handleIn.y}
                  stroke="#f59e0b" strokeWidth={1 / canvasScale}
                />
                <circle
                  cx={relX + p.handleIn.x} cy={relY + p.handleIn.y}
                  r={4 / canvasScale}
                  fill="#f59e0b" stroke="#fff" strokeWidth={1 / canvasScale}
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  onMouseDown={(e) => handlePointMouseDown(e, i, 'handleIn')}
                />
              </>
            )}
            
            {/* handleOut */}
            {p.handleOut && (p.handleOut.x !== 0 || p.handleOut.y !== 0) && (
              <>
                <line
                  x1={relX} y1={relY}
                  x2={relX + p.handleOut.x} y2={relY + p.handleOut.y}
                  stroke="#f59e0b" strokeWidth={1 / canvasScale}
                />
                <circle
                  cx={relX + p.handleOut.x} cy={relY + p.handleOut.y}
                  r={4 / canvasScale}
                  fill="#f59e0b" stroke="#fff" strokeWidth={1 / canvasScale}
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  onMouseDown={(e) => handlePointMouseDown(e, i, 'handleOut')}
                />
              </>
            )}
            
            {/* 锚点 */}
            <rect
              x={relX - 4 / canvasScale} y={relY - 4 / canvasScale}
              width={8 / canvasScale} height={8 / canvasScale}
              fill={isSelected ? '#2563eb' : '#fff'}
              stroke="#2563eb" strokeWidth={2 / canvasScale}
              style={{ pointerEvents: 'auto', cursor: 'move' }}
              onMouseDown={(e) => handlePointMouseDown(e, i, 'anchor')}
            />
          </g>
        );
      })}
    </svg>
  );
}
