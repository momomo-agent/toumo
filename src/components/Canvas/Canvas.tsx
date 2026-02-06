import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, DragEvent as ReactDragEvent } from 'react';
import { useEditorStore } from '../../store';
import { useShallow } from 'zustand/react/shallow';
import type { KeyElement, Position, Size, ToolType } from '../../types';
import { DEFAULT_STYLE } from '../../types';
import { CanvasElement, type ResizeHandle } from './CanvasElement';
import { PenTool } from './PenTool';
import { PathEditor } from './PathEditor';
import { SelectionBox } from './SelectionBox';
import { AlignmentGuides, type AlignmentLine, type DistanceIndicator } from './AlignmentGuides';
import { CanvasHints } from './CanvasHints';
import { ZoomControls } from './ZoomControls';
import { GuideLines } from './GuideLines';
import { HorizontalRuler, VerticalRuler, RulerCorner } from '../Ruler';
import { ContextMenu } from '../ContextMenu';
import { useDeleteGhosts } from '../../hooks/useDeleteGhosts';
import { findPresetComponent, createKeyElement } from '../ComponentLibrary';
import { PrototypeLinkOverlay } from './PrototypeLinkOverlay';

const CANVAS_SIZE = 2400;
const SNAP_THRESHOLD = 6;
const MIN_SIZE = 16;
const FRAME_GAP = 200;
const FRAME_MARGIN = 100;

type AlignmentResult = {
  snappedPosition: Position | null;
  snappedSize?: Size | null;
};

export function Canvas() {
  // Split store access into precise selectors to prevent unnecessary re-renders
  const {
    keyframes, selectedKeyframeId, selectedElementIds,
    currentTool, canvasOffset, canvasScale,
    selectionBox, frameSize, canvasBackground,
    snapToGrid, gridSize, editingGroupId,
    isDragging, isResizing, showRulers,
  } = useEditorStore(useShallow((s) => ({
    keyframes: s.keyframes,
    selectedKeyframeId: s.selectedKeyframeId,
    selectedElementIds: s.selectedElementIds,
    currentTool: s.currentTool,
    canvasOffset: s.canvasOffset,
    canvasScale: s.canvasScale,
    selectionBox: s.selectionBox,
    frameSize: s.frameSize,
    canvasBackground: s.canvasBackground,
    snapToGrid: s.snapToGrid,
    gridSize: s.gridSize,
    editingGroupId: s.editingGroupId,
    isDragging: s.isDragging,
    showRulers: s.showRulers,
    isResizing: s.isResizing,
  })));

  // Actions don't cause re-renders — grab them once via getState or stable selectors
  const setSelectedElementId = useEditorStore((s) => s.setSelectedElementId);
  const setSelectedElementIds = useEditorStore((s) => s.setSelectedElementIds);
  const setSelectedKeyframeId = useEditorStore((s) => s.setSelectedKeyframeId);
  const setCanvasOffset = useEditorStore((s) => s.setCanvasOffset);
  const setCanvasScale = useEditorStore((s) => s.setCanvasScale);
  const zoomToFit = useEditorStore((s) => s.zoomToFit);
  const addElement = useEditorStore((s) => s.addElement);
  const setSelectionBox = useEditorStore((s) => s.setSelectionBox);
  const setIsSelecting = useEditorStore((s) => s.setIsSelecting);
  const nudgeSelectedElements = useEditorStore((s) => s.nudgeSelectedElements);
  const copySelectedElements = useEditorStore((s) => s.copySelectedElements);
  const cutSelectedElements = useEditorStore((s) => s.cutSelectedElements);
  const pasteElements = useEditorStore((s) => s.pasteElements);
  const duplicateSelectedElements = useEditorStore((s) => s.duplicateSelectedElements);
  const setCurrentTool = useEditorStore((s) => s.setCurrentTool);
  const instantiateComponent = useEditorStore((s) => s.instantiateComponent);
  const enterGroupEditMode = useEditorStore((s) => s.enterGroupEditMode);
  const exitGroupEditMode = useEditorStore((s) => s.exitGroupEditMode);
  const addImageElement = useEditorStore((s) => s.addImageElement);

  const canvasRef = useRef<HTMLDivElement>(null);
  const drawStartRef = useRef<Position | null>(null);
  const marqueeShiftRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ pointerX: number; pointerY: number; startX: number; startY: number } | null>(null);
  const [alignmentLines, setAlignmentLines] = useState<AlignmentLine[]>([]);
  const [distanceIndicators, setDistanceIndicators] = useState<DistanceIndicator[]>([]);
  const [canvasContextMenu, setCanvasContextMenu] = useState<{ x: number; y: number; canvasPos: { x: number; y: number } } | null>(null);
  const handOverrideRef = useRef(false);
  const previousToolRef = useRef<ToolType>(currentTool);
  // Live preview while drawing shapes
  const [drawPreview, setDrawPreview] = useState<{ x: number; y: number; width: number; height: number; tool: string } | null>(null);
  // File drag-over visual feedback
  const [fileDragOver, setFileDragOver] = useState(false);
  const fileDragCounterRef = useRef(0);
  // Zoom percentage toast (two-phase: visible → fading → hidden)
  const [zoomToastVisible, setZoomToastVisible] = useState(false);
  const [zoomToastFading, setZoomToastFading] = useState(false);
  const zoomToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zoomToastFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevScaleRef = useRef(canvasScale);

  // Show zoom toast when scale changes (with fade-out)
  useEffect(() => {
    if (canvasScale !== prevScaleRef.current) {
      prevScaleRef.current = canvasScale;
      setZoomToastVisible(true);
      setZoomToastFading(false);
      if (zoomToastTimerRef.current) clearTimeout(zoomToastTimerRef.current);
      if (zoomToastFadeRef.current) clearTimeout(zoomToastFadeRef.current);
      zoomToastTimerRef.current = setTimeout(() => {
        setZoomToastFading(true);
        zoomToastFadeRef.current = setTimeout(() => setZoomToastVisible(false), 300);
      }, 600);
    }
  }, [canvasScale]);

  const currentKeyframe = keyframes.find((kf) => kf.id === selectedKeyframeId);
  const elements = currentKeyframe?.keyElements || [];
  const { ghosts: deleteGhosts } = useDeleteGhosts(elements);

  const frameLayouts = useMemo(() => {
    return keyframes.map((kf, index) => ({
      id: kf.id,
      x: index * (frameSize.width + FRAME_GAP) + FRAME_MARGIN,
      y: FRAME_MARGIN,
      width: frameSize.width,
      height: frameSize.height,
    }));
  }, [frameSize.height, frameSize.width, keyframes]);

  const frameLayoutMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number; width: number; height: number }>();
    frameLayouts.forEach((layout) => map.set(layout.id, layout));
    return map;
  }, [frameLayouts]);

  const clampPointToFrame = useCallback((point: Position) => ({
    x: Math.max(0, Math.min(point.x, frameSize.width)),
    y: Math.max(0, Math.min(point.y, frameSize.height)),
  }), [frameSize.height, frameSize.width]);

  const isInsideFrame = useCallback((point: Position) => {
    return point.x >= 0 && point.x <= frameSize.width && point.y >= 0 && point.y <= frameSize.height;
  }, [frameSize.height, frameSize.width]);

  const getFrameUnderPoint = useCallback((point: Position) => {
    return frameLayouts.find(
      (layout) =>
        point.x >= layout.x &&
        point.x <= layout.x + layout.width &&
        point.y >= layout.y &&
        point.y <= layout.y + layout.height,
    );
  }, [frameLayouts]);

  const activeFrameLayout = selectedKeyframeId ? frameLayoutMap.get(selectedKeyframeId) : undefined;

  const stageWidth = frameLayouts.length
    ? frameLayouts[frameLayouts.length - 1].x + frameSize.width + FRAME_MARGIN
    : Math.max(CANVAS_SIZE, frameSize.width + FRAME_MARGIN * 2);
  const stageHeight = frameSize.height + FRAME_MARGIN * 2 + 80;

  const toCanvasSpace = (event: ReactMouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (event.clientX - rect.left - canvasOffset.x) / canvasScale,
      y: (event.clientY - rect.top - canvasOffset.y) / canvasScale,
    };
  };

  const toCanvasSpaceFromDrag = (event: ReactDragEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (event.clientX - rect.left - canvasOffset.x) / canvasScale,
      y: (event.clientY - rect.top - canvasOffset.y) / canvasScale,
    };
  };

  const translateToFrameSpace = (point: Position, layout?: { x: number; y: number }) => {
    if (!layout) return point;
    return {
      x: point.x - layout.x,
      y: point.y - layout.y,
    };
  };

  const checkAlignment = useCallback((
    draggedId: string,
    position: Position,
    size: Size,
    options?: { mode?: 'move' | 'resize'; handle?: ResizeHandle }
  ): AlignmentResult => {
    const mode = options?.mode ?? 'move';
    const handle = options?.handle;
    const isResize = mode === 'resize';

    const lines: AlignmentLine[] = [];
    const draggedRight = position.x + size.width;
    const draggedBottom = position.y + size.height;
    const draggedCenterX = position.x + size.width / 2;
    const draggedCenterY = position.y + size.height / 2;

    let snapDeltaX: number | null = null;
    let snapDeltaY: number | null = null;

    type Edge = 'left' | 'right' | 'top' | 'bottom';
    type EdgeSnap = { target: number; delta: number };
    const edgeSnaps: Record<Edge, EdgeSnap | null> = {
      left: null,
      right: null,
      top: null,
      bottom: null,
    };

    const updateEdgeSnap = (edge: Edge, target: number, delta: number) => {
      const current = edgeSnaps[edge];
      if (!current || Math.abs(delta) < Math.abs(current.delta)) {
        edgeSnaps[edge] = { target, delta };
      }
    };

    const considerSnap = (
      target: number,
      current: number,
      axis: 'x' | 'y',
      line: AlignmentLine,
      resizeEdge?: Edge,
    ) => {
      const delta = target - current;
      if (Math.abs(delta) > SNAP_THRESHOLD) return;

      lines.push(line);

      if (!isResize) {
        if (axis === 'x') {
          if (snapDeltaX === null || Math.abs(delta) < Math.abs(snapDeltaX)) {
            snapDeltaX = delta;
          }
        } else {
          if (snapDeltaY === null || Math.abs(delta) < Math.abs(snapDeltaY)) {
            snapDeltaY = delta;
          }
        }
      } else if (resizeEdge) {
        updateEdgeSnap(resizeEdge, target, delta);
      }
    };

    const trackLeft = !isResize || handle?.includes('w');
    const trackRight = !isResize || handle?.includes('e');
    const trackTop = !isResize || handle?.includes('n');
    const trackBottom = !isResize || handle?.includes('s');
    const allowCenterX = !isResize;
    const allowCenterY = !isResize;

    // --- Frame boundary snapping (snap to frame edges + center) ---
    const frameCenterX = frameSize.width / 2;
    const frameCenterY = frameSize.height / 2;

    if (trackLeft) {
      considerSnap(0, position.x, 'x', { type: 'vertical', position: 0 }, isResize && handle?.includes('w') ? 'left' : undefined);
    }
    if (trackRight) {
      considerSnap(frameSize.width, draggedRight, 'x', { type: 'vertical', position: frameSize.width }, isResize && handle?.includes('e') ? 'right' : undefined);
    }
    if (trackTop) {
      considerSnap(0, position.y, 'y', { type: 'horizontal', position: 0 }, isResize && handle?.includes('n') ? 'top' : undefined);
    }
    if (trackBottom) {
      considerSnap(frameSize.height, draggedBottom, 'y', { type: 'horizontal', position: frameSize.height }, isResize && handle?.includes('s') ? 'bottom' : undefined);
    }
    if (allowCenterX) {
      considerSnap(frameCenterX, draggedCenterX, 'x', { type: 'vertical', position: frameCenterX });
    }
    if (allowCenterY) {
      considerSnap(frameCenterY, draggedCenterY, 'y', { type: 'horizontal', position: frameCenterY });
    }

    // --- Element-to-element snapping (edges + center + cross-edge) ---
    elements.forEach((element) => {
      if (element.id === draggedId) return;

      const elRight = element.position.x + element.size.width;
      const elBottom = element.position.y + element.size.height;
      const elCenterX = element.position.x + element.size.width / 2;
      const elCenterY = element.position.y + element.size.height / 2;

      // Same-edge snapping (left-left, right-right)
      if (trackLeft) {
        considerSnap(element.position.x, position.x, 'x', { type: 'vertical', position: element.position.x }, isResize && handle?.includes('w') ? 'left' : undefined);
      }
      if (trackRight) {
        considerSnap(elRight, draggedRight, 'x', { type: 'vertical', position: elRight }, isResize && handle?.includes('e') ? 'right' : undefined);
      }
      if (trackTop) {
        considerSnap(element.position.y, position.y, 'y', { type: 'horizontal', position: element.position.y }, isResize && handle?.includes('n') ? 'top' : undefined);
      }
      if (trackBottom) {
        considerSnap(elBottom, draggedBottom, 'y', { type: 'horizontal', position: elBottom }, isResize && handle?.includes('s') ? 'bottom' : undefined);
      }

      // Cross-edge snapping (left-to-right, right-to-left, top-to-bottom, bottom-to-top)
      if (trackLeft) {
        considerSnap(elRight, position.x, 'x', { type: 'vertical', position: elRight }, isResize && handle?.includes('w') ? 'left' : undefined);
      }
      if (trackRight) {
        considerSnap(element.position.x, draggedRight, 'x', { type: 'vertical', position: element.position.x }, isResize && handle?.includes('e') ? 'right' : undefined);
      }
      if (trackTop) {
        considerSnap(elBottom, position.y, 'y', { type: 'horizontal', position: elBottom }, isResize && handle?.includes('n') ? 'top' : undefined);
      }
      if (trackBottom) {
        considerSnap(element.position.y, draggedBottom, 'y', { type: 'horizontal', position: element.position.y }, isResize && handle?.includes('s') ? 'bottom' : undefined);
      }

      // Center snapping
      if (allowCenterX) {
        considerSnap(elCenterX, draggedCenterX, 'x', { type: 'vertical', position: elCenterX });
      }
      if (allowCenterY) {
        considerSnap(elCenterY, draggedCenterY, 'y', { type: 'horizontal', position: elCenterY });
      }
    });

    // Snap to user guides
    const { guides, snapToGuides } = useEditorStore.getState();
    if (snapToGuides) {
      guides.forEach((guide) => {
        if (guide.orientation === 'vertical') {
          if (trackLeft) considerSnap(guide.position, position.x, 'x', { type: 'vertical', position: guide.position }, isResize && handle?.includes('w') ? 'left' : undefined);
          if (trackRight) considerSnap(guide.position, draggedRight, 'x', { type: 'vertical', position: guide.position }, isResize && handle?.includes('e') ? 'right' : undefined);
          if (allowCenterX) considerSnap(guide.position, draggedCenterX, 'x', { type: 'vertical', position: guide.position });
        } else {
          if (trackTop) considerSnap(guide.position, position.y, 'y', { type: 'horizontal', position: guide.position }, isResize && handle?.includes('n') ? 'top' : undefined);
          if (trackBottom) considerSnap(guide.position, draggedBottom, 'y', { type: 'horizontal', position: guide.position }, isResize && handle?.includes('s') ? 'bottom' : undefined);
          if (allowCenterY) considerSnap(guide.position, draggedCenterY, 'y', { type: 'horizontal', position: guide.position });
        }
      });
    }

    // 计算间距指示器 + 等间距吸附
    const indicators: DistanceIndicator[] = [];
    
    if (!isResize) {
      // --- 基础间距指示器 ---
      elements.forEach((el) => {
        if (el.id === draggedId) return;
        const elR = el.position.x + el.size.width;
        const elB = el.position.y + el.size.height;

        // 水平间距（垂直方向有重叠时）
        const vOverlap = !(draggedBottom <= el.position.y || position.y >= elB);
        if (vOverlap) {
          const midY = (Math.max(position.y, el.position.y) + Math.min(draggedBottom, elB)) / 2;
          if (position.x >= elR) {
            const d = position.x - elR;
            if (d > 0 && d < 200) indicators.push({ type: 'horizontal', x: elR, y: midY, length: d, distance: d });
          }
          if (draggedRight <= el.position.x) {
            const d = el.position.x - draggedRight;
            if (d > 0 && d < 200) indicators.push({ type: 'horizontal', x: draggedRight, y: midY, length: d, distance: d });
          }
        }

        // 垂直间距（水平方向有重叠时）
        const hOverlap = !(draggedRight <= el.position.x || position.x >= elR);
        if (hOverlap) {
          const midX = (Math.max(position.x, el.position.x) + Math.min(draggedRight, elR)) / 2;
          if (position.y >= elB) {
            const d = position.y - elB;
            if (d > 0 && d < 200) indicators.push({ type: 'vertical', x: midX, y: elB, length: d, distance: d });
          }
          if (draggedBottom <= el.position.y) {
            const d = el.position.y - draggedBottom;
            if (d > 0 && d < 200) indicators.push({ type: 'vertical', x: midX, y: draggedBottom, length: d, distance: d });
          }
        }
      });

      // --- 等间距检测 + 吸附 ---
      const EQUAL_SPACING_THRESHOLD = 4;
      const otherEls = elements.filter(el => el.id !== draggedId);

      // 水平等间距：按 x 排序，检测相邻元素间距是否相等
      const hSorted = [...otherEls].sort((a, b) => a.position.x - b.position.x);
      // 收集所有相邻间距
      const hGaps: { left: number; right: number; gap: number; midY: number }[] = [];
      for (let i = 0; i < hSorted.length - 1; i++) {
        const a = hSorted[i];
        const b = hSorted[i + 1];
        const aR = a.position.x + a.size.width;
        const gap = b.position.x - aR;
        if (gap > 0) {
          const midY = (Math.min(a.position.y + a.size.height, b.position.y + b.size.height)
            + Math.max(a.position.y, b.position.y)) / 2;
          hGaps.push({ left: aR, right: b.position.x, gap, midY });
        }
      }

      // 检查拖拽元素与左右邻居的间距是否匹配已有间距
      for (const el of otherEls) {
        const elR = el.position.x + el.size.width;
        // 拖拽元素在 el 右边
        const gapRight = position.x - elR;
        if (gapRight > 0 && gapRight < 300) {
          for (const hg of hGaps) {
            if (Math.abs(gapRight - hg.gap) < EQUAL_SPACING_THRESHOLD) {
              // 吸附到等间距
              const snapTarget = elR + hg.gap;
              const delta = snapTarget - position.x;
              if (Math.abs(delta) <= SNAP_THRESHOLD) {
                if (snapDeltaX === null || Math.abs(delta) < Math.abs(snapDeltaX)) {
                  snapDeltaX = delta;
                }
                const midY = (position.y + draggedBottom) / 2;
                indicators.push({ type: 'horizontal', x: elR, y: midY, length: hg.gap, distance: hg.gap, isEqualSpacing: true });
                indicators.push({ type: 'horizontal', x: hg.left, y: hg.midY, length: hg.gap, distance: hg.gap, isEqualSpacing: true });
              }
            }
          }
        }
        // 拖拽元素在 el 左边
        const gapLeft = el.position.x - draggedRight;
        if (gapLeft > 0 && gapLeft < 300) {
          for (const hg of hGaps) {
            if (Math.abs(gapLeft - hg.gap) < EQUAL_SPACING_THRESHOLD) {
              const snapTarget = el.position.x - size.width - hg.gap;
              const delta = snapTarget - position.x;
              if (Math.abs(delta) <= SNAP_THRESHOLD) {
                if (snapDeltaX === null || Math.abs(delta) < Math.abs(snapDeltaX)) {
                  snapDeltaX = delta;
                }
                const midY = (position.y + draggedBottom) / 2;
                indicators.push({ type: 'horizontal', x: snapTarget + size.width, y: midY, length: hg.gap, distance: hg.gap, isEqualSpacing: true });
                indicators.push({ type: 'horizontal', x: hg.left, y: hg.midY, length: hg.gap, distance: hg.gap, isEqualSpacing: true });
              }
            }
          }
        }
      }

      // 垂直等间距：按 y 排序
      const vSorted = [...otherEls].sort((a, b) => a.position.y - b.position.y);
      const vGaps: { top: number; bottom: number; gap: number; midX: number }[] = [];
      for (let i = 0; i < vSorted.length - 1; i++) {
        const a = vSorted[i];
        const b = vSorted[i + 1];
        const aB = a.position.y + a.size.height;
        const gap = b.position.y - aB;
        if (gap > 0) {
          const midX = (Math.min(a.position.x + a.size.width, b.position.x + b.size.width)
            + Math.max(a.position.x, b.position.x)) / 2;
          vGaps.push({ top: aB, bottom: b.position.y, gap, midX });
        }
      }

      for (const el of otherEls) {
        const elB = el.position.y + el.size.height;
        // 拖拽元素在 el 下方
        const gapBelow = position.y - elB;
        if (gapBelow > 0 && gapBelow < 300) {
          for (const vg of vGaps) {
            if (Math.abs(gapBelow - vg.gap) < EQUAL_SPACING_THRESHOLD) {
              const snapTarget = elB + vg.gap;
              const delta = snapTarget - position.y;
              if (Math.abs(delta) <= SNAP_THRESHOLD) {
                if (snapDeltaY === null || Math.abs(delta) < Math.abs(snapDeltaY)) {
                  snapDeltaY = delta;
                }
                const midX = (position.x + draggedRight) / 2;
                indicators.push({ type: 'vertical', x: midX, y: elB, length: vg.gap, distance: vg.gap, isEqualSpacing: true });
                indicators.push({ type: 'vertical', x: vg.midX, y: vg.top, length: vg.gap, distance: vg.gap, isEqualSpacing: true });
              }
            }
          }
        }
        // 拖拽元素在 el 上方
        const gapAbove = el.position.y - draggedBottom;
        if (gapAbove > 0 && gapAbove < 300) {
          for (const vg of vGaps) {
            if (Math.abs(gapAbove - vg.gap) < EQUAL_SPACING_THRESHOLD) {
              const snapTarget = el.position.y - size.height - vg.gap;
              const delta = snapTarget - position.y;
              if (Math.abs(delta) <= SNAP_THRESHOLD) {
                if (snapDeltaY === null || Math.abs(delta) < Math.abs(snapDeltaY)) {
                  snapDeltaY = delta;
                }
                const midX = (position.x + draggedRight) / 2;
                indicators.push({ type: 'vertical', x: midX, y: snapTarget + size.height, length: vg.gap, distance: vg.gap, isEqualSpacing: true });
                indicators.push({ type: 'vertical', x: vg.midX, y: vg.top, length: vg.gap, distance: vg.gap, isEqualSpacing: true });
              }
            }
          }
        }
      }
    }

    setAlignmentLines(lines);
    setDistanceIndicators(indicators);

    if (isResize) {
      let nextX = position.x;
      let nextY = position.y;
      let nextWidth = size.width;
      let nextHeight = size.height;

      const rightEdge = position.x + size.width;
      const bottomEdge = position.y + size.height;

      if (handle?.includes('w') && edgeSnaps.left) {
        nextX = edgeSnaps.left.target;
        nextWidth = Math.max(MIN_SIZE, rightEdge - nextX);
      }

      if (handle?.includes('e') && edgeSnaps.right) {
        const newRight = edgeSnaps.right.target;
        nextWidth = Math.max(MIN_SIZE, newRight - nextX);
      }

      if (handle?.includes('n') && edgeSnaps.top) {
        nextY = edgeSnaps.top.target;
        nextHeight = Math.max(MIN_SIZE, bottomEdge - nextY);
      }

      if (handle?.includes('s') && edgeSnaps.bottom) {
        const newBottom = edgeSnaps.bottom.target;
        nextHeight = Math.max(MIN_SIZE, newBottom - nextY);
      }

      const posChanged = nextX !== position.x || nextY !== position.y;
      const sizeChanged = nextWidth !== size.width || nextHeight !== size.height;

      return {
        snappedPosition: posChanged ? { x: nextX, y: nextY } : null,
        snappedSize: sizeChanged ? { width: nextWidth, height: nextHeight } : undefined,
      };
    }

    if (snapDeltaX === null && snapDeltaY === null) {
      return { snappedPosition: null };
    }

    return {
      snappedPosition: {
        x: position.x + (snapDeltaX ?? 0),
        y: position.y + (snapDeltaY ?? 0),
      },
    };
  }, [elements, frameSize]);

  useEffect(() => {
    const clear = () => {
      setAlignmentLines([]);
      setDistanceIndicators([]);
    };
    document.addEventListener('mouseup', clear);
    document.addEventListener('mouseleave', clear);
    return () => {
      document.removeEventListener('mouseup', clear);
      document.removeEventListener('mouseleave', clear);
    };
  }, []);

  useEffect(() => {
    if (!handOverrideRef.current) {
      previousToolRef.current = currentTool;
    }
  }, [currentTool]);

  const handleCanvasMouseDown = useCallback((event: ReactMouseEvent) => {
    const stagePoint = toCanvasSpace(event);
    const hitFrame = getFrameUnderPoint(stagePoint);

    if (hitFrame && hitFrame.id !== selectedKeyframeId) {
      setSelectedKeyframeId(hitFrame.id);
      setSelectedElementId(null);
    }

    if (currentTool === 'hand') {
      isPanningRef.current = true;
      panStartRef.current = {
        pointerX: event.clientX,
        pointerY: event.clientY,
        startX: canvasOffset.x,
        startY: canvasOffset.y,
      };
      return;
    }

    const activeLayout = hitFrame && hitFrame.id === selectedKeyframeId ? hitFrame : activeFrameLayout;
    if (!activeLayout) return;

    const framePoint = translateToFrameSpace(stagePoint, activeLayout);

    if (currentTool === 'select') {
      // 点击空白处时退出编组编辑模式
      if (editingGroupId) {
        exitGroupEditMode();
      }
      // Track whether Shift is held — additive marquee selection
      marqueeShiftRef.current = event.shiftKey;
      if (!event.shiftKey) {
        setSelectedElementId(null);
      }
      setIsSelecting(true);
      setSelectionBox({ start: clampPointToFrame(framePoint), end: clampPointToFrame(framePoint) });
      return;
    }

    if (['rectangle', 'ellipse', 'text', 'line', 'frame'].includes(currentTool)) {
      if (!isInsideFrame(framePoint)) return;
      drawStartRef.current = clampPointToFrame(framePoint);
    }
  }, [activeFrameLayout, canvasOffset.x, canvasOffset.y, canvasScale, clampPointToFrame, currentTool, getFrameUnderPoint, isInsideFrame, selectedKeyframeId, setSelectedElementId, setSelectedKeyframeId, setSelectionBox, setIsSelecting]);

  const handleCanvasMouseMove = useCallback((event: ReactMouseEvent) => {
    const stagePoint = toCanvasSpace(event);

    if (isPanningRef.current && panStartRef.current) {
      const dx = event.clientX - panStartRef.current.pointerX;
      const dy = event.clientY - panStartRef.current.pointerY;
      setCanvasOffset({ x: panStartRef.current.startX + dx, y: panStartRef.current.startY + dy });
      return;
    }

    if (selectionBox && activeFrameLayout) {
      const framePoint = translateToFrameSpace(stagePoint, activeFrameLayout);
      setSelectionBox({ ...selectionBox, end: clampPointToFrame(framePoint) });
      return;
    }

    // Live preview while drawing shapes
    if (drawStartRef.current && activeFrameLayout && ['rectangle', 'ellipse', 'text', 'line', 'frame'].includes(currentTool)) {
      const framePoint = translateToFrameSpace(stagePoint, activeFrameLayout);
      const clamped = clampPointToFrame(framePoint);
      const start = drawStartRef.current;
      setDrawPreview({
        x: Math.min(start.x, clamped.x),
        y: Math.min(start.y, clamped.y),
        width: Math.abs(clamped.x - start.x),
        height: Math.abs(clamped.y - start.y),
        tool: currentTool,
      });
    }
  }, [activeFrameLayout, clampPointToFrame, currentTool, selectionBox, setCanvasOffset, setSelectionBox]);

  const handleCanvasMouseUp = useCallback((event: ReactMouseEvent) => {
    const stagePoint = toCanvasSpace(event);

    if (isPanningRef.current) {
      isPanningRef.current = false;
      panStartRef.current = null;
      return;
    }

    if (!activeFrameLayout) return;
    const framePoint = translateToFrameSpace(stagePoint, activeFrameLayout);

    if (selectionBox) {
      const minX = Math.min(selectionBox.start.x, selectionBox.end.x);
      const maxX = Math.max(selectionBox.start.x, selectionBox.end.x);
      const minY = Math.min(selectionBox.start.y, selectionBox.end.y);
      const maxY = Math.max(selectionBox.start.y, selectionBox.end.y);

      // Only select top-level elements (skip children inside groups)
      const marqueeIds = elements
        .filter((el) => {
          if (el.parentId) return false; // skip group children
          const elRight = el.position.x + el.size.width;
          const elBottom = el.position.y + el.size.height;
          return el.position.x < maxX && elRight > minX && el.position.y < maxY && elBottom > minY;
        })
        .map((el) => el.id);

      // Shift+drag → add to existing selection (toggle)
      if (marqueeShiftRef.current) {
        const prev = useEditorStore.getState().selectedElementIds;
        const merged = new Set(prev);
        marqueeIds.forEach((id) => merged.add(id));
        setSelectedElementIds(Array.from(merged));
      } else {
        setSelectedElementIds(marqueeIds);
      }

      setSelectionBox(null);
      setIsSelecting(false);
      return;
    }

    if (drawStartRef.current && ['rectangle', 'ellipse', 'text', 'line', 'frame'].includes(currentTool)) {
      const start = drawStartRef.current;
      const clampedEnd = clampPointToFrame(framePoint);
      const width = Math.abs(clampedEnd.x - start.x);
      const height = Math.abs(clampedEnd.y - start.y);

      if (width < 5 && height < 5) {
        drawStartRef.current = null;
        setDrawPreview(null);
        return;
      }

      const baseStyle = { ...DEFAULT_STYLE };
      const shapeType = currentTool as KeyElement['shapeType'];
      
      const getElementName = () => {
        if (shapeType === 'ellipse') return 'Ellipse';
        if (shapeType === 'text') return 'Text';
        if (shapeType === 'line') return 'Line';
        if (shapeType === 'frame') return 'Frame';
        if (shapeType === 'path') return 'Path';
        return 'Rectangle';
      };
      
      const newElement: KeyElement = {
        id: `el-${Date.now()}`,
        name: getElementName(),
        category: 'content',
        isKeyElement: true,
        attributes: [],
        position: {
          x: Math.min(start.x, clampedEnd.x),
          y: Math.min(start.y, clampedEnd.y),
        },
        size: {
          width: Math.max(width, shapeType === 'text' ? 140 : shapeType === 'line' ? 2 : 48),
          height: Math.max(height, shapeType === 'text' ? 40 : shapeType === 'line' ? 2 : shapeType === 'frame' ? 100 : 48),
        },
        shapeType,
        style: {
          ...baseStyle,
          borderRadius: shapeType === 'ellipse' ? Math.max(width, height) : shapeType === 'line' ? 0 : baseStyle.borderRadius,
          fontSize: shapeType === 'text' ? 18 : baseStyle.fontSize,
          // Line specific
          ...(shapeType === 'line' ? {
            fill: '#ffffff',
            stroke: '#ffffff',
            strokeWidth: 2,
          } : {}),
          // Frame specific - transparent container
          ...(shapeType === 'frame' ? {
            fill: '#1a1a1a',
            fillOpacity: 1,
            stroke: '#333',
            strokeWidth: 1,
          } : {}),
        },
        text: shapeType === 'text' ? 'Text' : undefined,
      };

      if (shapeType === 'text') {
        newElement.style = {
          fill: 'transparent',
          fillOpacity: 1,
          stroke: 'transparent',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: baseStyle.borderRadius,
          fontSize: 18,
          fontWeight: '500',
          textAlign: 'left',
        };
      }

      addElement(newElement);
      drawStartRef.current = null;
      setDrawPreview(null);
    }
  }, [activeFrameLayout, addElement, clampPointToFrame, currentTool, elements, selectionBox, setIsSelecting, setSelectedElementIds, setSelectionBox]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (event.code === 'Space' && !handOverrideRef.current && !isTyping) {
        handOverrideRef.current = true;
        previousToolRef.current = currentTool;
        setCurrentTool('hand');
        event.preventDefault();
        return;
      }

      // Zoom shortcuts: Cmd+0 (reset), Cmd++ (zoom in), Cmd+- (zoom out)
      if (event.metaKey || event.ctrlKey) {
        if (event.key === '0') {
          event.preventDefault();
          zoomToFit();
          return;
        }
        if (event.key === '=' || event.key === '+') {
          event.preventDefault();
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const originX = (cx - canvasOffset.x) / canvasScale;
            const originY = (cy - canvasOffset.y) / canvasScale;
            const nextScale = Math.min(4, canvasScale * 1.25);
            setCanvasScale(nextScale);
            setCanvasOffset({ x: cx - originX * nextScale, y: cy - originY * nextScale });
          }
          return;
        }
        if (event.key === '-') {
          event.preventDefault();
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const originX = (cx - canvasOffset.x) / canvasScale;
            const originY = (cy - canvasOffset.y) / canvasScale;
            const nextScale = Math.max(0.1, canvasScale * 0.8);
            setCanvasScale(nextScale);
            setCanvasOffset({ x: cx - originX * nextScale, y: cy - originY * nextScale });
          }
          return;
        }
        // Copy/Paste/Cut/Duplicate shortcuts
        if (event.key === 'c') {
          event.preventDefault();
          copySelectedElements();
          return;
        }
        if (event.key === 'v') {
          event.preventDefault();
          pasteElements();
          return;
        }
        if (event.key === 'x') {
          event.preventDefault();
          cutSelectedElements();
          return;
        }
        if (event.key === 'd') {
          event.preventDefault();
          duplicateSelectedElements();
          return;
        }
      }

      if (isTyping) return;

      const step = event.shiftKey ? 10 : 1;
      switch (event.key) {
        case 'ArrowUp':
          nudgeSelectedElements(0, -step);
          event.preventDefault();
          break;
        case 'ArrowDown':
          nudgeSelectedElements(0, step);
          event.preventDefault();
          break;
        case 'ArrowLeft':
          nudgeSelectedElements(-step, 0);
          event.preventDefault();
          break;
        case 'ArrowRight':
          nudgeSelectedElements(step, 0);
          event.preventDefault();
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space' && handOverrideRef.current) {
        handOverrideRef.current = false;
        const nextTool = previousToolRef.current ?? 'select';
        setCurrentTool(nextTool);
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentTool, nudgeSelectedElements, setCurrentTool, canvasScale, canvasOffset, setCanvasScale, setCanvasOffset, zoomToFit]);

  // Handle paste event for images
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isTyping) return;

      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          event.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;

          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if (!dataUrl) return;

            const img = new Image();
            img.onload = () => {
              // Center the image in the frame
              addImageElement(dataUrl, img.width, img.height);
            };
            img.src = dataUrl;
          };
          reader.readAsDataURL(file);
          break; // Only handle first image
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [addImageElement]);

  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    // Pinch-to-zoom (trackpad) or Ctrl/Cmd+scroll → zoom at mouse position
    if (event.ctrlKey || event.metaKey) {
      const originX = (pointerX - canvasOffset.x) / canvasScale;
      const originY = (pointerY - canvasOffset.y) / canvasScale;

      const factor = event.deltaY < 0 ? 1.06 : 1 / 1.06;
      const nextScale = Math.min(4, Math.max(0.1, canvasScale * factor));

      setCanvasScale(nextScale);
      setCanvasOffset({
        x: pointerX - originX * nextScale,
        y: pointerY - originY * nextScale,
      });
      return;
    }

    // Plain scroll → pan canvas
    setCanvasOffset({
      x: canvasOffset.x - event.deltaX,
      y: canvasOffset.y - event.deltaY,
    });
  }, [canvasOffset.x, canvasOffset.y, canvasScale, setCanvasOffset, setCanvasScale]);

  useEffect(() => {
    const node = canvasRef.current;
    if (!node) return;
    node.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      node.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Handle component drag over
  const handleDragEnter = useCallback((event: ReactDragEvent) => {
    if (event.dataTransfer.types.includes('Files')) {
      fileDragCounterRef.current++;
      setFileDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((event: ReactDragEvent) => {
    if (event.dataTransfer.types.includes('Files')) {
      fileDragCounterRef.current--;
      if (fileDragCounterRef.current <= 0) {
        fileDragCounterRef.current = 0;
        setFileDragOver(false);
      }
    }
  }, []);

  const handleDragOver = useCallback((event: ReactDragEvent) => {
    // Support component drag
    if (event.dataTransfer.types.includes('application/toumo-component')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      return;
    }
    // Support library component drag
    if (event.dataTransfer.types.includes('application/toumo-library-component')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      return;
    }
    // Support image file drag
    if (event.dataTransfer.types.includes('Files')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  // Handle component drop
  const handleDrop = useCallback((event: ReactDragEvent) => {
    // Reset file drag overlay
    fileDragCounterRef.current = 0;
    setFileDragOver(false);

    // Handle component drop
    const componentId = event.dataTransfer.getData('application/toumo-component');
    if (componentId) {
      event.preventDefault();
      
      const stagePoint = toCanvasSpaceFromDrag(event);
      const hitFrame = getFrameUnderPoint(stagePoint);
      
      if (hitFrame) {
        if (hitFrame.id !== selectedKeyframeId) {
          setSelectedKeyframeId(hitFrame.id);
        }
        
        const framePoint = translateToFrameSpace(stagePoint, hitFrame);
        instantiateComponent(componentId, {
          x: Math.max(0, framePoint.x - 50),
          y: Math.max(0, framePoint.y - 50),
        });
      }
      return;
    }

    // Handle library preset component drop
    const libraryComponentId = event.dataTransfer.getData('application/toumo-library-component');
    if (libraryComponentId) {
      event.preventDefault();
      const preset = findPresetComponent(libraryComponentId);
      if (!preset) return;

      const stagePoint = toCanvasSpaceFromDrag(event);
      const hitFrame = getFrameUnderPoint(stagePoint);

      if (hitFrame) {
        if (hitFrame.id !== selectedKeyframeId) {
          setSelectedKeyframeId(hitFrame.id);
        }

        const framePoint = translateToFrameSpace(stagePoint, hitFrame);
        const elementsData = preset.createElements();

        // Calculate bounding box to center on drop point
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        elementsData.forEach((el) => {
          const pos = el.position || { x: 0, y: 0 };
          minX = Math.min(minX, pos.x);
          minY = Math.min(minY, pos.y);
          maxX = Math.max(maxX, pos.x + el.size.width);
          maxY = Math.max(maxY, pos.y + el.size.height);
        });
        const totalW = maxX - minX;
        const totalH = maxY - minY;

        elementsData.forEach((elData) => {
          const basePos = elData.position || { x: 0, y: 0 };
          const offsetX = framePoint.x - totalW / 2 + (basePos.x - minX);
          const offsetY = framePoint.y - totalH / 2 + (basePos.y - minY);
          const keyElement = createKeyElement(elData, {
            x: Math.max(0, offsetX),
            y: Math.max(0, offsetY),
          });
          addElement(keyElement);
        });
      }
      return;
    }
    
    // Handle image file drop
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      event.preventDefault();
      
      const stagePoint = toCanvasSpaceFromDrag(event);
      const hitFrame = getFrameUnderPoint(stagePoint);
      
      // Use hit frame, or fall back to currently selected frame
      const targetFrame = hitFrame || (selectedKeyframeId ? keyframes.find(kf => kf.id === selectedKeyframeId) : null) || keyframes[0];
      
      if (targetFrame) {
        if (targetFrame.id !== selectedKeyframeId) {
          setSelectedKeyframeId(targetFrame.id);
        }
        
        let dropPosition: Position | undefined;
        if (hitFrame) {
          const framePoint = translateToFrameSpace(stagePoint, hitFrame);
          dropPosition = framePoint;
        }
        // If no hitFrame, dropPosition stays undefined → addImageElement will center it
        
        // Process each image file
        Array.from(files).forEach((file) => {
          if (!file.type.startsWith('image/')) return;
          
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if (!dataUrl) return;
            
            // Get image dimensions
            const img = new Image();
            img.onload = () => {
              if (dropPosition) {
                addImageElement(dataUrl, img.width, img.height, {
                  x: Math.max(0, dropPosition.x - Math.min(150, img.width / 2)),
                  y: Math.max(0, dropPosition.y - Math.min(150, img.height / 2)),
                });
              } else {
                // Center in frame (no position override)
                addImageElement(dataUrl, img.width, img.height);
              }
            };
            img.src = dataUrl;
          };
          reader.readAsDataURL(file);
        });
      }
    }
  }, [getFrameUnderPoint, instantiateComponent, selectedKeyframeId, setSelectedKeyframeId, addImageElement, keyframes]);

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onContextMenu={(e) => {
        // Only show canvas context menu when clicking on blank area (not on elements)
        const target = e.target as HTMLElement;
        const isOnElement = target.closest('[data-element-id]');
        if (!isOnElement) {
          e.preventDefault();
          const stagePoint = (() => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return { x: 0, y: 0 };
            return {
              x: (e.clientX - rect.left - canvasOffset.x) / canvasScale,
              y: (e.clientY - rect.top - canvasOffset.y) / canvasScale,
            };
          })();
          const hitFrame = getFrameUnderPoint(stagePoint);
          const layout = hitFrame && hitFrame.id === selectedKeyframeId ? hitFrame : activeFrameLayout;
          const framePoint = layout
            ? { x: stagePoint.x - layout.x, y: stagePoint.y - layout.y }
            : stagePoint;
          setCanvasContextMenu({ x: e.clientX, y: e.clientY, canvasPos: framePoint });
        }
      }}
      className="canvas-stage"
      style={{ cursor: currentTool === 'hand' ? 'grab' : currentTool === 'select' ? 'default' : 'crosshair' }}
    >
      {/* Dot-grid background — small dots + larger dots every 5 cells */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px),
            radial-gradient(circle, rgba(255,255,255,0.06) 0.5px, transparent 0.5px)
          `,
          backgroundSize: `${100 * canvasScale}px ${100 * canvasScale}px, ${20 * canvasScale}px ${20 * canvasScale}px`,
          backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px, ${canvasOffset.x}px ${canvasOffset.y}px`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          width: stageWidth,
          height: stageHeight,
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
          transformOrigin: '0 0',
        }}
      >
        {frameLayouts.map((layout, index) => {
          const keyframe = keyframes[index];
          if (!keyframe) return null;
          const isActive = keyframe.id === selectedKeyframeId;
          const frameElements = keyframe.keyElements || [];
          return (
            <div key={keyframe.id} style={{ position: 'absolute', left: layout.x, top: layout.y - 60, width: layout.width }}>
              <button
                onClick={() => setSelectedKeyframeId(keyframe.id)}
                style={{
                  width: '100%',
                  border: 'none',
                  borderRadius: 12,
                  padding: '8px 12px',
                  marginBottom: 12,
                  textAlign: 'left',
                  background: isActive ? '#2563eb30' : '#141416',
                  color: '#fff',
                  borderColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{keyframe.name}</div>
                  <div style={{ fontSize: 11, color: '#7d7d7d' }}>{keyframe.summary ?? 'State description'}</div>
                </div>
                {isActive && <span style={{ fontSize: 11, color: '#8ab4ff' }}>Editing</span>}
              </button>
              <div
                data-frame-id={keyframe.id}
                style={{
                  width: layout.width,
                  height: layout.height,
                  position: 'relative',
                  background: canvasBackground,
                  backgroundImage: snapToGrid
                    ? `radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`
                    : undefined,
                  backgroundSize: snapToGrid ? `${gridSize}px ${gridSize}px` : undefined,
                  borderRadius: 32,
                  border: '1px solid #2f2f2f',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
                  overflow: 'hidden',
                  cursor: isActive ? 'default' : 'pointer',
                }}
              >
                {/* Canvas hints for empty state */}
                {isActive && frameElements.length === 0 && <CanvasHints />}
                {isActive
                  ? (() => {
                      // 分离顶层元素和子元素
                      const topLevelElements = frameElements.filter(el => !el.parentId);
                      const getChildren = (parentId: string) => 
                        frameElements.filter(el => el.parentId === parentId);
                      
                      return topLevelElements.map((element) => {
                        const children = getChildren(element.id);
                        const isGroupElement = children.length > 0;
                        const isEditingThisGroup = editingGroupId === element.id;
                        
                        if (isGroupElement) {
                          // 渲染编组 - 使用 Fragment 包裹编组元素和子元素
                          return (
                            <div key={element.id}>
                              {/* 编组本身 - 用于选择和拖拽 */}
                              {!isEditingThisGroup && (
                                <CanvasElement
                                  element={element}
                                  allElements={frameElements}
                                  scale={canvasScale}
                                  isSelected={selectedElementIds.includes(element.id)}
                                  onAlignmentCheck={checkAlignment}
                                  isGroup={true}
                                  onDoubleClick={() => enterGroupEditMode(element.id)}
                                />
                              )}
                              {/* 编辑模式边框 */}
                              {isEditingThisGroup && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    left: element.position.x - 1,
                                    top: element.position.y - 1,
                                    width: element.size.width + 2,
                                    height: element.size.height + 2,
                                    border: '2px dashed #3b82f6',
                                    borderRadius: 4,
                                    pointerEvents: 'none',
                                  }}
                                />
                              )}
                              {/* 子元素 - 使用绝对位置（相对于编组） */}
                              {children.map((child) => {
                                // 计算子元素的绝对位置
                                const absoluteChild = {
                                  ...child,
                                  position: {
                                    x: child.position.x + element.position.x,
                                    y: child.position.y + element.position.y,
                                  },
                                };
                                return (
                                  <CanvasElement
                                    key={child.id}
                                    element={absoluteChild}
                                    allElements={frameElements}
                                    scale={canvasScale}
                                    isSelected={isEditingThisGroup && selectedElementIds.includes(child.id)}
                                    onAlignmentCheck={checkAlignment}
                                    isInEditingGroup={isEditingThisGroup}
                                    groupOffset={element.position}
                                  />
                                );
                              })}
                            </div>
                          );
                        }
                        
                        // 普通元素
                        return (
                          <CanvasElement
                            key={element.id}
                            element={element}
                            allElements={frameElements}
                            scale={canvasScale}
                            isSelected={selectedElementIds.includes(element.id)}
                            onAlignmentCheck={checkAlignment}
                          />
                        );
                      });
                    })()
                  : frameElements.map((element) => (
                      <div
                        key={element.id}
                        style={{
                          position: 'absolute',
                          left: element.position.x,
                          top: element.position.y,
                          width: element.size.width,
                          height: element.size.height,
                          background: element.style?.fill || '#3b82f6',
                          borderRadius: element.shapeType === 'ellipse' ? '50%' : element.style?.borderRadius || 8,
                          opacity: 0.7,
                        }}
                      />
                    ))}
                {/* Delete fade-out ghosts */}
                {isActive && deleteGhosts.map(({ element }) => (
                  <div
                    key={`ghost-${element.id}`}
                    className="canvas-element-exit"
                    style={{
                      position: 'absolute',
                      left: element.position.x,
                      top: element.position.y,
                      width: element.size.width,
                      height: element.size.height,
                      background: element.shapeType === 'text' ? 'transparent' : (element.style?.fill || '#3b82f6'),
                      borderRadius: element.shapeType === 'ellipse' ? '50%' : (element.style?.borderRadius || 8),
                      pointerEvents: 'none',
                    }}
                  />
                ))}
                {/* Live draw preview ghost */}
                {isActive && drawPreview && drawPreview.width > 2 && drawPreview.height > 2 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: drawPreview.x,
                      top: drawPreview.y,
                      width: drawPreview.width,
                      height: drawPreview.height,
                      background: drawPreview.tool === 'text' ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.15)',
                      border: '1.5px dashed #3b82f6',
                      borderRadius: drawPreview.tool === 'ellipse' ? '50%' : drawPreview.tool === 'line' ? 0 : 8,
                      pointerEvents: 'none',
                      zIndex: 999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* Size label */}
                    <span style={{
                      fontSize: 10,
                      color: '#3b82f6',
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      background: 'rgba(0,0,0,0.6)',
                      padding: '1px 5px',
                      borderRadius: 4,
                      whiteSpace: 'nowrap',
                    }}>
                      {Math.round(drawPreview.width)} × {Math.round(drawPreview.height)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {activeFrameLayout && (
          <div style={{ position: 'absolute', left: activeFrameLayout.x, top: activeFrameLayout.y }}>
            <AlignmentGuides 
              lines={alignmentLines} 
              canvasWidth={frameSize.width} 
              canvasHeight={frameSize.height}
              distanceIndicators={distanceIndicators}
            />
            {selectionBox && <SelectionBox start={selectionBox.start} end={selectionBox.end} />}
            {/* Position tooltip while dragging */}
            {isDragging && selectedElementIds.length > 0 && (() => {
              const el = elements.find(e => e.id === selectedElementIds[0]);
              if (!el) return null;
              return (
                <div style={{
                  position: 'absolute',
                  left: el.position.x + el.size.width / 2,
                  top: el.position.y - 28,
                  transform: 'translateX(-50%)',
                  background: 'rgba(59,130,246,0.92)',
                  color: '#fff',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 1000,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}>
                  X: {Math.round(el.position.x)}  Y: {Math.round(el.position.y)}
                </div>
              );
            })()}
            {/* Size tooltip while resizing */}
            {isResizing && selectedElementIds.length > 0 && (() => {
              const el = elements.find(e => e.id === selectedElementIds[0]);
              if (!el) return null;
              return (
                <div style={{
                  position: 'absolute',
                  left: el.position.x + el.size.width / 2,
                  top: el.position.y + el.size.height + 12,
                  transform: 'translateX(-50%)',
                  background: 'rgba(139,92,246,0.92)',
                  color: '#fff',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 1000,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}>
                  {Math.round(el.size.width)} × {Math.round(el.size.height)}
                </div>
              );
            })()}
          </div>
        )}
        
        {/* Prototype Link Arrows */}
        <PrototypeLinkOverlay
          keyframes={keyframes}
          frameLayouts={frameLayouts}
          selectedKeyframeId={selectedKeyframeId}
          selectedElementIds={selectedElementIds}
        />

        {/* Pen Tool */}
        {/* Multi-select bounding box */}
        {currentTool === 'select' && selectedElementIds.length >= 2 && (() => {
          const sel = elements.filter(e => selectedElementIds.includes(e.id));
          if (sel.length < 2) return null;
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          sel.forEach(e => {
            minX = Math.min(minX, e.position.x);
            minY = Math.min(minY, e.position.y);
            maxX = Math.max(maxX, e.position.x + e.size.width);
            maxY = Math.max(maxY, e.position.y + e.size.height);
          });
          const w = maxX - minX;
          const h = maxY - minY;
          return (
            <div style={{
              position: 'absolute',
              left: minX - 1,
              top: minY - 1,
              width: w + 2,
              height: h + 2,
              border: '1.5px dashed rgba(59,130,246,0.5)',
              borderRadius: 2,
              pointerEvents: 'none',
              zIndex: 998,
            }} />
          );
        })()}

        <PenTool
          isActive={currentTool === 'pen'}
          canvasOffset={canvasOffset}
          canvasScale={canvasScale}
          frameLayout={activeFrameLayout || null}
        />
        
        {/* Path Editor - 编辑已有路径的锚点 */}
        {currentTool === 'select' && selectedElementIds.length === 1 && (() => {
          const selectedEl = elements.find(el => el.id === selectedElementIds[0]);
          if (selectedEl?.shapeType === 'path' && activeFrameLayout) {
            return (
              <PathEditor
                element={selectedEl}
                canvasOffset={canvasOffset}
                canvasScale={canvasScale}
                frameLayout={activeFrameLayout}
              />
            );
          }
          return null;
        })()}
      </div>
      
      {/* Zoom Percentage Toast */}
      {zoomToastVisible && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontSize: 28,
            fontWeight: 700,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '12px 28px',
            borderRadius: 12,
            pointerEvents: 'none',
            zIndex: 200,
            letterSpacing: '-0.5px',
            opacity: zoomToastFading ? 0 : 1,
            transition: 'opacity 0.3s ease-out',
          }}
        >
          {Math.round(canvasScale * 100)}%
        </div>
      )}

      {/* Guide Lines (rendered in canvas space) */}
      <GuideLines stageRect={canvasRef.current?.getBoundingClientRect() ?? null} />

      {/* Rulers */}
      {showRulers && (
        <>
          <HorizontalRuler />
          <VerticalRuler />
          <RulerCorner />
        </>
      )}

      {/* Zoom Controls */}
      <ZoomControls />

      {/* Canvas Context Menu (right-click on blank area) */}
      {canvasContextMenu && (
        <ContextMenu
          mode="canvas"
          x={canvasContextMenu.x}
          y={canvasContextMenu.y}
          canvasPosition={canvasContextMenu.canvasPos}
          onClose={() => setCanvasContextMenu(null)}
        />
      )}

      {/* File Drag-Over Overlay */}
      {fileDragOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(59, 130, 246, 0.08)',
            border: '2px dashed rgba(59, 130, 246, 0.5)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
            pointerEvents: 'none',
          }}
        >
          <div style={{
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            padding: '16px 32px',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: 24 }}>🖼</span>
            Drop image to import
          </div>
        </div>
      )}
    </div>
  );
}
