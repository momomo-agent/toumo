import type { StateCreator } from 'zustand';
import type { ToolType, Position } from '../types';

export interface SelectionSlice {
  // State
  selectedElementId: string | null;
  selectedElementIds: string[];
  selectedTransitionId: string | null;
  previewTransitionId: string | null;
  currentTool: ToolType;
  hoveredElementId: string | null;
  isDragging: boolean;
  isResizing: boolean;
  isSelecting: boolean;
  selectionBox: { start: Position; end: Position } | null;

  // Actions
  setSelectedElementId: (id: string | null) => void;
  setSelectedElementIds: (ids: string[]) => void;
  setSelectedTransitionId: (id: string | null) => void;
  setPreviewTransitionId: (id: string | null) => void;
  setCurrentTool: (tool: ToolType) => void;
  setHoveredElementId: (id: string | null) => void;
  setIsDragging: (isDragging: boolean) => void;
  setIsResizing: (isResizing: boolean) => void;
  setIsSelecting: (isSelecting: boolean) => void;
  setSelectionBox: (box: { start: Position; end: Position } | null) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createSelectionSlice: StateCreator<any, [], [], SelectionSlice> = (set) => ({
  // State
  selectedElementId: null,
  selectedElementIds: [],
  selectedTransitionId: null,
  previewTransitionId: null,
  currentTool: 'select' as ToolType,
  hoveredElementId: null,
  isDragging: false,
  isResizing: false,
  isSelecting: false,
  selectionBox: null,

  // Actions
  setSelectedElementId: (id: string | null) => set({
    selectedElementId: id,
    selectedElementIds: id ? [id] : [],
  }),

  setSelectedElementIds: (ids: string[]) => set({
    selectedElementIds: ids,
    selectedElementId: ids.length === 1 ? ids[0] : null,
  }),

  setSelectedTransitionId: (id: string | null) => set({
    selectedTransitionId: id,
    selectedElementId: id ? null : undefined,
    selectedElementIds: id ? [] : undefined,
  }),

  setPreviewTransitionId: (id: string | null) => set({ previewTransitionId: id }),

  setCurrentTool: (tool: ToolType) => set({ currentTool: tool }),

  setHoveredElementId: (id: string | null) => set({ hoveredElementId: id }),

  setIsDragging: (isDragging: boolean) => set({ isDragging }),
  setIsResizing: (isResizing: boolean) => set({ isResizing }),
  setIsSelecting: (isSelecting: boolean) => set({ isSelecting }),
  setSelectionBox: (selectionBox: { start: Position; end: Position } | null) => set({ selectionBox }),
});
