import { create } from 'zustand';
import type { Keyframe, Transition, KeyElement, ToolType, Position, Size } from '../types';
import { initialKeyframes, initialTransitions } from './initialData';

interface HistoryEntry {
  keyframes: Keyframe[];
}

interface EditorState {
  keyframes: Keyframe[];
  transitions: Transition[];
  selectedKeyframeId: string;
  selectedElementId: string | null;
  selectedElementIds: string[];
  selectedTransitionId: string | null;
  currentTool: ToolType;
  clipboard: KeyElement[];
  canvasOffset: Position;
  canvasScale: number;
  history: HistoryEntry[];
  historyIndex: number;
  isDragging: boolean;
  isResizing: boolean;
  isSelecting: boolean;
  selectionBox: { start: Position; end: Position } | null;
}

interface EditorActions {
  setSelectedKeyframeId: (id: string) => void;
  addKeyframe: () => void;
  deleteKeyframe: (id: string) => void;
  setSelectedElementId: (id: string | null) => void;
  setSelectedElementIds: (ids: string[]) => void;
  addElement: (element: KeyElement) => void;
  deleteElement: (id: string) => void;
  deleteSelectedElements: () => void;
  updateElement: (id: string, updates: Partial<KeyElement>) => void;
  updateElementPosition: (id: string, position: Position) => void;
  updateElementSize: (id: string, size: Size) => void;
  updateElementName: (id: string, name: string) => void;
  setCurrentTool: (tool: ToolType) => void;
  setCanvasOffset: (offset: Position) => void;
  setCanvasScale: (scale: number) => void;
  setIsDragging: (isDragging: boolean) => void;
  setIsResizing: (isResizing: boolean) => void;
  setIsSelecting: (isSelecting: boolean) => void;
  setSelectionBox: (box: { start: Position; end: Position } | null) => void;
  copySelectedElements: () => void;
  pasteElements: () => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

export type EditorStore = EditorState & EditorActions;

export const useEditorStore = create<EditorStore>((set, get) => ({
  // Initial state
  keyframes: initialKeyframes,
  transitions: initialTransitions,
  selectedKeyframeId: initialKeyframes[0].id,
  selectedElementId: null,
  selectedElementIds: [],
  selectedTransitionId: null,
  currentTool: 'select',
  clipboard: [],
  canvasOffset: { x: 0, y: 0 },
  canvasScale: 1,
  history: [{ keyframes: initialKeyframes }],
  historyIndex: 0,
  isDragging: false,
  isResizing: false,
  isSelecting: false,
  selectionBox: null,

  // Actions
  setSelectedKeyframeId: (id) => set({ selectedKeyframeId: id }),
  
  addKeyframe: () => set((state) => {
    const newId = `kf-${Date.now()}`;
    const newKeyframe: Keyframe = {
      id: newId,
      name: `State ${state.keyframes.length + 1}`,
      summary: 'New state',
      keyElements: [],
    };
    return {
      keyframes: [...state.keyframes, newKeyframe],
      selectedKeyframeId: newId,
    };
  }),

  deleteKeyframe: (id) => set((state) => {
    if (state.keyframes.length <= 1) return state;
    const newKeyframes = state.keyframes.filter((kf) => kf.id !== id);
    return {
      keyframes: newKeyframes,
      selectedKeyframeId: state.selectedKeyframeId === id 
        ? newKeyframes[0].id 
        : state.selectedKeyframeId,
    };
  }),

  setSelectedElementId: (id) => set({ 
    selectedElementId: id,
    selectedElementIds: id ? [id] : [],
  }),
  
  setSelectedElementIds: (ids) => set({ 
    selectedElementIds: ids,
    selectedElementId: ids.length === 1 ? ids[0] : null,
  }),

  addElement: (element) => {
    get().pushHistory();
    set((state) => ({
      keyframes: state.keyframes.map((kf) =>
        kf.id === state.selectedKeyframeId
          ? { ...kf, keyElements: [...kf.keyElements, element] }
          : kf
      ),
      selectedElementId: element.id,
      selectedElementIds: [element.id],
    }));
  },

  deleteElement: (id) => {
    get().pushHistory();
    set((state) => ({
      keyframes: state.keyframes.map((kf) =>
        kf.id === state.selectedKeyframeId
          ? { ...kf, keyElements: kf.keyElements.filter((el) => el.id !== id) }
          : kf
      ),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
      selectedElementIds: state.selectedElementIds.filter((eid) => eid !== id),
    }));
  },

  deleteSelectedElements: () => {
    const state = get();
    if (state.selectedElementIds.length === 0) return;
    get().pushHistory();
    set((state) => ({
      keyframes: state.keyframes.map((kf) =>
        kf.id === state.selectedKeyframeId
          ? { ...kf, keyElements: kf.keyElements.filter((el) => !state.selectedElementIds.includes(el.id)) }
          : kf
      ),
      selectedElementId: null,
      selectedElementIds: [],
    }));
  },

  updateElement: (id, updates) => set((state) => ({
    keyframes: state.keyframes.map((kf) =>
      kf.id === state.selectedKeyframeId
        ? {
            ...kf,
            keyElements: kf.keyElements.map((el) =>
              el.id === id ? { ...el, ...updates } : el
            ),
          }
        : kf
    ),
  })),

  updateElementPosition: (id, position) => set((state) => ({
    keyframes: state.keyframes.map((kf) =>
      kf.id === state.selectedKeyframeId
        ? {
            ...kf,
            keyElements: kf.keyElements.map((el) =>
              el.id === id ? { ...el, position } : el
            ),
          }
        : kf
    ),
  })),

  updateElementSize: (id, size) => set((state) => ({
    keyframes: state.keyframes.map((kf) =>
      kf.id === state.selectedKeyframeId
        ? {
            ...kf,
            keyElements: kf.keyElements.map((el) =>
              el.id === id ? { ...el, size } : el
            ),
          }
        : kf
    ),
  })),

  updateElementName: (id, name) => set((state) => ({
    keyframes: state.keyframes.map((kf) =>
      kf.id === state.selectedKeyframeId
        ? {
            ...kf,
            keyElements: kf.keyElements.map((el) =>
              el.id === id ? { ...el, name } : el
            ),
          }
        : kf
    ),
  })),

  setCurrentTool: (tool) => set({ currentTool: tool }),
  setCanvasOffset: (offset) => set({ canvasOffset: offset }),
  setCanvasScale: (scale) => set({ canvasScale: scale }),
  setIsDragging: (isDragging) => set({ isDragging }),
  setIsResizing: (isResizing) => set({ isResizing }),
  setIsSelecting: (isSelecting) => set({ isSelecting }),
  setSelectionBox: (selectionBox) => set({ selectionBox }),

  copySelectedElements: () => {
    const state = get();
    const currentKeyframe = state.keyframes.find(kf => kf.id === state.selectedKeyframeId);
    if (!currentKeyframe) return;
    const elementsToCopy = currentKeyframe.keyElements.filter(
      el => state.selectedElementIds.includes(el.id)
    );
    set({ clipboard: elementsToCopy });
  },

  pasteElements: () => {
    const state = get();
    if (state.clipboard.length === 0) return;
    get().pushHistory();
    const newElements = state.clipboard.map(el => ({
      ...el,
      id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: { x: el.position.x + 20, y: el.position.y + 20 },
    }));
    set((state) => ({
      keyframes: state.keyframes.map((kf) =>
        kf.id === state.selectedKeyframeId
          ? { ...kf, keyElements: [...kf.keyElements, ...newElements] }
          : kf
      ),
      selectedElementIds: newElements.map(el => el.id),
      selectedElementId: newElements.length === 1 ? newElements[0].id : null,
    }));
  },

  pushHistory: () => set((state) => {
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push({ keyframes: JSON.parse(JSON.stringify(state.keyframes)) });
    if (newHistory.length > 50) newHistory.shift();
    return {
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };
  }),

  undo: () => set((state) => {
    if (state.historyIndex <= 0) return state;
    const newIndex = state.historyIndex - 1;
    return {
      keyframes: JSON.parse(JSON.stringify(state.history[newIndex].keyframes)),
      historyIndex: newIndex,
    };
  }),

  redo: () => set((state) => {
    if (state.historyIndex >= state.history.length - 1) return state;
    const newIndex = state.historyIndex + 1;
    return {
      keyframes: JSON.parse(JSON.stringify(state.history[newIndex].keyframes)),
      historyIndex: newIndex,
    };
  }),
}));
