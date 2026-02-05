import { create } from 'zustand';
import type { Keyframe, Transition, KeyElement, ToolType, Position, Size, Component, FunctionalState } from '../types';
import { initialKeyframes, initialTransitions } from './initialData';

interface HistoryEntry {
  keyframes: Keyframe[];
}

const clampElementToFrame = (element: KeyElement, frame: Size): KeyElement => {
  const width = Math.max(1, Math.min(element.size.width, frame.width));
  const height = Math.max(1, Math.min(element.size.height, frame.height));
  const maxX = Math.max(0, frame.width - width);
  const maxY = Math.max(0, frame.height - height);
  const x = Math.max(0, Math.min(element.position.x, maxX));
  const y = Math.max(0, Math.min(element.position.y, maxY));
  return {
    ...element,
    position: { x, y },
    size: { width, height },
  };
};

interface EditorState {
  keyframes: Keyframe[];
  transitions: Transition[];
  functionalStates: FunctionalState[];
  components: Component[];
  selectedKeyframeId: string;
  selectedElementId: string | null;
  selectedElementIds: string[];
  selectedTransitionId: string | null;
  currentTool: ToolType;
  clipboard: KeyElement[];
  canvasOffset: Position;
  canvasScale: number;
  frameSize: Size;
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
  nudgeSelectedElements: (dx: number, dy: number) => void;
  setCurrentTool: (tool: ToolType) => void;
  setCanvasOffset: (offset: Position) => void;
  setCanvasScale: (scale: number) => void;
  setIsDragging: (isDragging: boolean) => void;
  setIsResizing: (isResizing: boolean) => void;
  setIsSelecting: (isSelecting: boolean) => void;
  setSelectionBox: (box: { start: Position; end: Position } | null) => void;
  setFrameSize: (size: Size) => void;
  copySelectedElements: () => void;
  pasteElements: () => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  setSelectedTransitionId: (id: string | null) => void;
  updateTransition: (id: string, updates: Partial<Transition>) => void;
  addTransition: (from: string, to: string) => void;
  deleteTransition: (id: string) => void;
  // Functional state actions
  addFunctionalState: (name: string) => void;
  updateFunctionalState: (id: string, updates: Partial<FunctionalState>) => void;
  deleteFunctionalState: (id: string) => void;
  // Keyframe functional state mapping
  updateKeyframeFunctionalState: (keyframeId: string, functionalStateId: string | undefined) => void;
  // Component actions
  addComponent: (name: string) => void;
  updateComponent: (id: string, updates: Partial<Component>) => void;
  deleteComponent: (id: string) => void;
  // Image actions
  addImageElement: (imageSrc: string, originalWidth: number, originalHeight: number) => void;
}

export type EditorStore = EditorState & EditorActions;

export const useEditorStore = create<EditorStore>((set, get) => ({
  // Initial state
  keyframes: initialKeyframes,
  transitions: initialTransitions,
  functionalStates: [
    { id: 'fs-idle', name: 'Idle', isInitial: true },
    { id: 'fs-loading', name: 'Loading', isInitial: false },
    { id: 'fs-success', name: 'Success', isInitial: false },
  ],
  components: [],
  selectedKeyframeId: initialKeyframes[0].id,
  selectedElementId: null,
  selectedElementIds: [],
  selectedTransitionId: null,
  currentTool: 'select',
  clipboard: [],
  canvasOffset: { x: 0, y: 0 },
  canvasScale: 1,
  frameSize: { width: 390, height: 844 }, // iPhone 14 默认尺寸
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
    set((state) => {
      const nextElement = clampElementToFrame(element, state.frameSize);
      return {
        keyframes: state.keyframes.map((kf) =>
          kf.id === state.selectedKeyframeId
            ? { ...kf, keyElements: [...kf.keyElements, nextElement] }
            : kf
        ),
        selectedElementId: nextElement.id,
        selectedElementIds: [nextElement.id],
      };
    });
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
            keyElements: kf.keyElements.map((el) => {
              if (el.id !== id) return el;
              const nextElement = {
                ...el,
                ...updates,
                position: updates.position ?? el.position,
                size: updates.size ?? el.size,
              } as KeyElement;
              return clampElementToFrame(nextElement, state.frameSize);
            }),
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
              el.id === id
                ? clampElementToFrame({ ...el, position }, state.frameSize)
                : el
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
              el.id === id
                ? clampElementToFrame({ ...el, size }, state.frameSize)
                : el
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

  nudgeSelectedElements: (dx, dy) => {
    const state = get();
    if (state.selectedElementIds.length === 0) return;
    get().pushHistory();
    set((state) => ({
      keyframes: state.keyframes.map((kf) =>
        kf.id === state.selectedKeyframeId
          ? {
              ...kf,
              keyElements: kf.keyElements.map((el) =>
                state.selectedElementIds.includes(el.id)
                  ? clampElementToFrame(
                      {
                        ...el,
                        position: {
                          x: el.position.x + dx,
                          y: el.position.y + dy,
                        },
                      },
                      state.frameSize
                    )
                  : el
              ),
            }
          : kf
      ),
    }));
  },

  setCurrentTool: (tool) => set({ currentTool: tool }),
  setCanvasOffset: (offset) => set({ canvasOffset: offset }),
  setCanvasScale: (scale) => set({ canvasScale: scale }),
  setIsDragging: (isDragging) => set({ isDragging }),
  setIsResizing: (isResizing) => set({ isResizing }),
  setIsSelecting: (isSelecting) => set({ isSelecting }),
  setSelectionBox: (selectionBox) => set({ selectionBox }),
  setFrameSize: (frameSize) => set((state) => ({
    frameSize,
    keyframes: state.keyframes.map((kf) => ({
      ...kf,
      keyElements: kf.keyElements.map((el) => clampElementToFrame(el, frameSize)),
    })),
  })),

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
    const timestamp = Date.now();
    const newElements = state.clipboard.map((el, index) =>
      clampElementToFrame(
        {
          ...el,
          id: `el-${timestamp}-${index}`,
          position: { x: el.position.x + 20, y: el.position.y + 20 },
        },
        state.frameSize
      )
    );
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
    const snapshot = JSON.parse(JSON.stringify(state.keyframes)) as Keyframe[];
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push({ keyframes: snapshot });
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

  setSelectedTransitionId: (id) => set({ 
    selectedTransitionId: id,
    // Clear element selection when selecting a transition
    selectedElementId: id ? null : undefined,
    selectedElementIds: id ? [] : undefined,
  }),

  updateTransition: (id, updates) => set((state) => ({
    transitions: state.transitions.map((tr) =>
      tr.id === id ? { ...tr, ...updates } : tr
    ),
  })),

  addTransition: (from, to) => set((state) => {
    const newId = `tr-${Date.now()}`;
    const newTransition: Transition = {
      id: newId,
      from,
      to,
      trigger: 'tap',
      duration: 300,
      delay: 0,
      curve: 'ease-out',
    };
    return {
      transitions: [...state.transitions, newTransition],
      selectedTransitionId: newId,
    };
  }),

  deleteTransition: (id) => set((state) => ({
    transitions: state.transitions.filter((tr) => tr.id !== id),
    selectedTransitionId: state.selectedTransitionId === id ? null : state.selectedTransitionId,
  })),

  // Functional state actions
  addFunctionalState: (name) => set((state) => {
    const newId = `fs-${Date.now()}`;
    const newState: FunctionalState = {
      id: newId,
      name,
      isInitial: state.functionalStates.length === 0,
    };
    return {
      functionalStates: [...state.functionalStates, newState],
    };
  }),

  updateFunctionalState: (id, updates) => set((state) => ({
    functionalStates: state.functionalStates.map((fs) =>
      fs.id === id ? { ...fs, ...updates } : fs
    ),
  })),

  deleteFunctionalState: (id) => set((state) => ({
    functionalStates: state.functionalStates.filter((fs) => fs.id !== id),
    // Also clear references in keyframes
    keyframes: state.keyframes.map((kf) =>
      kf.functionalState === id ? { ...kf, functionalState: undefined } : kf
    ),
  })),

  // Keyframe functional state mapping
  updateKeyframeFunctionalState: (keyframeId, functionalStateId) => set((state) => ({
    keyframes: state.keyframes.map((kf) =>
      kf.id === keyframeId ? { ...kf, functionalState: functionalStateId } : kf
    ),
  })),

  // Component actions
  addComponent: (name) => set((state) => {
    const newId = `comp-${Date.now()}`;
    const newComponent: Component = {
      id: newId,
      name,
      functionalStates: [],
      displayStateMappings: [],
      transitions: [],
    };
    return {
      components: [...state.components, newComponent],
    };
  }),

  updateComponent: (id, updates) => set((state) => ({
    components: state.components.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    ),
  })),

  deleteComponent: (id) => set((state) => ({
    components: state.components.filter((c) => c.id !== id),
  })),

  // Image element
  addImageElement: (imageSrc, originalWidth, originalHeight) => {
    const state = get();
    get().pushHistory();
    
    // Scale image to fit within frame, max 300px
    const maxSize = 300;
    let width = originalWidth;
    let height = originalHeight;
    
    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    
    // Center in frame
    const x = Math.max(0, (state.frameSize.width - width) / 2);
    const y = Math.max(0, (state.frameSize.height - height) / 2);
    
    const newElement: KeyElement = {
      id: `el-img-${Date.now()}`,
      name: 'Image',
      category: 'content',
      isKeyElement: true,
      attributes: [],
      position: { x, y },
      size: { width, height },
      shapeType: 'image',
      style: {
        fill: 'transparent',
        fillOpacity: 1,
        stroke: '',
        strokeWidth: 0,
        strokeOpacity: 1,
        borderRadius: 0,
        imageSrc,
        imageOriginalWidth: originalWidth,
        imageOriginalHeight: originalHeight,
        objectFit: 'cover',
      },
    };
    
    set((state) => ({
      keyframes: state.keyframes.map((kf) =>
        kf.id === state.selectedKeyframeId
          ? { ...kf, keyElements: [...kf.keyElements, newElement] }
          : kf
      ),
      selectedElementId: newElement.id,
      selectedElementIds: [newElement.id],
      currentTool: 'select',
    }));
  },
}));
