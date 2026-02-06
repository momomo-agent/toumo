import { useState, useCallback, useEffect, useRef } from 'react';
import { useEditorStore } from '../../store';
import type { Position } from '../../types';

interface PenToolProps {
  isActive: boolean;
  canvasOffset: Position;
  canvasScale: number;
  frameLayout: { x: number; y: number } | null;
}

// 路径点类型
export interface PathPoint {
  x: number;
  y: number;
  // 入控制点 (相对于锚点)
  handleIn?: { x: number; y: number };
  // 出控制点 (相对于锚点)
  handleOut?: { x: number; y: number };
}

interface DragState {
  type: 'anchor' | 'handleIn' | 'handleOut';
  pointIndex: number;
  startPos: { x: number; y: number };
}

export function PenTool({ isActive, canvasOffset, canvasScale, frameLayout }: PenToolProps) {
  const { addElement, setCurrentTool } = useEditorStore();
  const [points, setPoints] = useState<PathPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [previewPoint, setPreviewPoint] = useState<{ x: number; y: number } | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 转换到 frame 坐标系
  const toFrameSpace = useCallback((clientX: number, clientY: number) => {
    if (!frameLayout) return null;
    const x = (clientX - canvasOffset.x) / canvasScale - frameLayout.x;
    const y = (clientY - canvasOffset.y) / canvasScale - frameLayout.y;
    return { x, y };
  }, [canvasOffset, canvasScale, frameLayout]);

  // 生成 SVG path data
  const generatePathData = useCallback((pts: PathPoint[], closed: boolean) => {
    if (pts.length === 0) return '';
    
    let d = `M ${pts[0].x} ${pts[0].y}`;
    
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      
      const hasHandleOut = prev.handleOut && (prev.handleOut.x !== 0 || prev.handleOut.y !== 0);
      const hasHandleIn = curr.handleIn && (curr.handleIn.x !== 0 || curr.handleIn.y !== 0);
      
      if (hasHandleOut || hasHandleIn) {
        // 贝塞尔曲线
        const cp1x = prev.x + (prev.handleOut?.x || 0);
        const cp1y = prev.y + (prev.handleOut?.y || 0);
        const cp2x = curr.x + (curr.handleIn?.x || 0);
        const cp2y = curr.y + (curr.handleIn?.y || 0);
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      } else {
        // 直线
        d += ` L ${curr.x} ${curr.y}`;
      }
    }
    
    // 闭合路径
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

  // 检查是否点击了起点（用于闭合路径）
  const isNearFirstPoint = useCallback((x: number, y: number) => {
    if (points.length < 2) return false;
    const first = points[0];
    const dist = Math.sqrt((x - first.x) ** 2 + (y - first.y) ** 2);
    return dist < 10 / canvasScale;
  }, [points, canvasScale]);

  // 点击添加锚点
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isActive || !frameLayout) return;
    if (e.button !== 0) return; // 只响应左键
    
    const point = toFrameSpace(e.clientX, e.clientY);
    if (!point) return;

    // 检查是否点击了闭合点
    if (isDrawing && isNearFirstPoint(point.x, point.y)) {
      setIsClosed(true);
      finishPath(true);
      return;
    }

    if (!isDrawing) {
      setIsDrawing(true);
      setPoints([{ x: point.x, y: point.y }]);
    } else {
      setPoints(prev => [...prev, { x: point.x, y: point.y }]);
    }
    
    // 准备拖拽创建控制柄
    setIsDraggingHandle(true);
    setDragState({
      type: 'handleOut',
      pointIndex: points.length, // 新添加的点的索引
      startPos: point,
    });
  }, [isActive, isDrawing, frameLayout, toFrameSpace, points.length, isNearFirstPoint]);

  // 拖拽创建贝塞尔控制柄
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!frameLayout) return;
    
    const point = toFrameSpace(e.clientX, e.clientY);
    if (!point) return;

    // 更新预览点
    if (isDrawing && !isDraggingHandle) {
      setPreviewPoint(point);
    }

    // 拖拽控制柄
    if (isDraggingHandle && dragState) {
      const idx = dragState.pointIndex;
      const dx = point.x - dragState.startPos.x;
      const dy = point.y - dragState.startPos.y;
      
      setPoints(prev => {
        const newPoints = [...prev];
        if (idx < newPoints.length) {
          const p = { ...newPoints[idx] };
          // 对称控制柄
          p.handleOut = { x: dx, y: dy };
          p.handleIn = { x: -dx, y: -dy };
          newPoints[idx] = p;
        }
        return newPoints;
      });
    }
  }, [frameLayout, toFrameSpace, isDrawing, isDraggingHandle, dragState]);

  // 松开鼠标
  const handleMouseUp = useCallback(() => {
    setIsDraggingHandle(false);
    setDragState(null);
  }, []);

  // 完成路径
  const finishPath = useCallback((closed: boolean = false) => {
    if (points.length < 2) {
      setPoints([]);
      setIsDrawing(false);
      setIsClosed(false);
      return;
    }

    const pathData = generatePathData(points, closed);

    // 计算边界
    const allX = points.map(p => p.x);
    const allY = points.map(p => p.y);
    const minX = Math.min(...allX);
    const minY = Math.min(...allY);
    const maxX = Math.max(...allX);
    const maxY = Math.max(...allY);

    // 转换为 pathPoints 格式存储
    const pathPoints = points.map((p, i) => ({
      x: p.x,
      y: p.y,
      type: i === 0 ? 'move' as const : 'curve' as const,
      // 存储控制点
      cx1: p.handleIn?.x,
      cy1: p.handleIn?.y,
      cx2: p.handleOut?.x,
      cy2: p.handleOut?.y,
    }));

    addElement({
      id: `el-${Date.now()}`,
      name: 'Path',
      category: 'content',
      isKeyElement: true,
      attributes: [],
      position: { x: minX, y: minY },
      size: { width: Math.max(maxX - minX, 10), height: Math.max(maxY - minY, 10) },
      shapeType: 'path',
      style: {
        fill: closed ? '#3b82f6' : 'transparent',
        fillOpacity: closed ? 0.5 : 1,
        stroke: '#ffffff',
        strokeWidth: 2,
        strokeOpacity: 1,
        borderRadius: 0,
        pathData,
        pathPoints,
        pathClosed: closed,
      },
    });

    setPoints([]);
    setIsDrawing(false);
    setIsClosed(false);
    setPreviewPoint(null);
    setCurrentTool('select');
  }, [points, generatePathData, addElement, setCurrentTool]);

  // 双击完成路径
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 移除最后一个点（双击会先触发 click 添加一个点）
    if (points.length > 1) {
      setPoints(prev => prev.slice(0, -1));
    }
    finishPath(isClosed);
  }, [points.length, finishPath, isClosed]);

  // ESC 取消绘制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawing) {
        setPoints([]);
        setIsDrawing(false);
        setIsClosed(false);
        setPreviewPoint(null);
      } else if (e.key === 'Enter' && isDrawing) {
        finishPath(isClosed);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, isClosed, finishPath]);

  if (!isActive || !frameLayout) return null;

  // 渲染预览路径
  const renderPreviewPath = () => {
    if (points.length === 0) return null;
    
    const pathData = generatePathData(points, false);
    
    return (
      <path
        d={pathData}
        fill="none"
        stroke="#2563eb"
        strokeWidth={2}
        strokeDasharray="4 4"
      />
    );
  };

  // 渲染预览线（到鼠标位置）
  const renderPreviewLine = () => {
    if (!previewPoint || points.length === 0 || isDraggingHandle) return null;
    
    const last = points[points.length - 1];
    const hasHandle = last.handleOut && (last.handleOut.x !== 0 || last.handleOut.y !== 0);
    
    if (hasHandle) {
      // 贝塞尔预览
      const cp1x = last.x + (last.handleOut?.x || 0);
      const cp1y = last.y + (last.handleOut?.y || 0);
      return (
        <path
          d={`M ${last.x} ${last.y} Q ${cp1x} ${cp1y}, ${previewPoint.x} ${previewPoint.y}`}
          fill="none"
          stroke="#2563eb"
          strokeWidth={1}
          strokeDasharray="2 2"
          opacity={0.5}
        />
      );
    }
    
    return (
      <line
        x1={last.x}
        y1={last.y}
        x2={previewPoint.x}
        y2={previewPoint.y}
        stroke="#2563eb"
        strokeWidth={1}
        strokeDasharray="2 2"
        opacity={0.5}
      />
    );
  };

  // 渲染锚点和控制柄
  const renderPoints = () => {
    return points.map((p, i) => {
      const isFirst = i === 0;
      const showCloseHint = isFirst && points.length > 2 && previewPoint && isNearFirstPoint(previewPoint.x, previewPoint.y);
      
      return (
        <g key={i}>
          {/* 控制柄线 - handleIn */}
          {p.handleIn && (p.handleIn.x !== 0 || p.handleIn.y !== 0) && (
            <>
              <line
                x1={p.x}
                y1={p.y}
                x2={p.x + p.handleIn.x}
                y2={p.y + p.handleIn.y}
                stroke="#f59e0b"
                strokeWidth={1}
              />
              <circle
                cx={p.x + p.handleIn.x}
                cy={p.y + p.handleIn.y}
                r={4}
                fill="#f59e0b"
                stroke="#fff"
                strokeWidth={1}
              />
            </>
          )}
          
          {/* 控制柄线 - handleOut */}
          {p.handleOut && (p.handleOut.x !== 0 || p.handleOut.y !== 0) && (
            <>
              <line
                x1={p.x}
                y1={p.y}
                x2={p.x + p.handleOut.x}
                y2={p.y + p.handleOut.y}
                stroke="#f59e0b"
                strokeWidth={1}
              />
              <circle
                cx={p.x + p.handleOut.x}
                cy={p.y + p.handleOut.y}
                r={4}
                fill="#f59e0b"
                stroke="#fff"
                strokeWidth={1}
              />
            </>
          )}
          
          {/* 锚点 */}
          <circle
            cx={p.x}
            cy={p.y}
            r={showCloseHint ? 8 : 5}
            fill={isFirst ? '#2563eb' : '#fff'}
            stroke={showCloseHint ? '#10b981' : '#2563eb'}
            strokeWidth={2}
          />
        </g>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        cursor: 'crosshair',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      <svg
        style={{
          position: 'absolute',
          left: frameLayout.x * canvasScale + canvasOffset.x,
          top: frameLayout.y * canvasScale + canvasOffset.y,
          width: 4000,
          height: 4000,
          pointerEvents: 'none',
          overflow: 'visible',
          transform: `scale(${canvasScale})`,
          transformOrigin: '0 0',
        }}
      >
        {renderPreviewPath()}
        {renderPreviewLine()}
        {renderPoints()}
      </svg>
      
      {/* 提示信息 */}
      {isDrawing && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 12,
            pointerEvents: 'none',
          }}
        >
          点击添加锚点 | 拖拽创建曲线 | 点击起点闭合 | Enter 完成 | ESC 取消
        </div>
      )}
    </div>
  );
}
