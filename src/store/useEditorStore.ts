import { create } from 'zustand';
import type { Keyframe, Transition, KeyElement, ToolType, Position, Size, Component, FunctionalState, ShapeStyle, Variable } from '../types';
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
  copiedStyle: ShapeStyle | null;
  canvasOffset: Position;
  canvasScale: number;
  recentColors: string[];
  canvasBackground: string;
  showRulers: boolean;
  snapToGrid: boolean;
  gridSize: number;
  frameSize: Size;
  frameBackground: string;
  history: HistoryEntry[];
  historyIndex: number;
  isDragging: boolean;
  isResizing: boolean;
  isSelecting: boolean;
  selectionBox: { start: Position; end: Position } | null;
  // Component edit mode
  editingComponentId: string | null;
  editingInstanceId: string | null;
  // Variables for state machine logic
  variables: Variable[];
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
  zoomToFit: () => void;
  zoomTo100: () => void;
  duplicateSelectedElements: () => void;
  selectAllElements: () => void;
  addRecentColor: (color: string) => void;
  setCanvasBackground: (color: string) => void;
  toggleRulers: () => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
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
  createComponentFromSelection: () => void;
  instantiateComponent: (componentId: string, position: Position) => void;
  enterComponentEditMode: (instanceId: string) => void;
  exitComponentEditMode: () => void;
  syncComponentInstances: (componentId: string) => void;
  // Image actions
  addImageElement: (imageSrc: string, originalWidth: number, originalHeight: number) => void;
  // Group actions
  groupSelectedElements: () => void;
  ungroupSelectedElements: () => void;
  // Alignment actions
  alignElements: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeElements: (direction: 'horizontal' | 'vertical') => void;
  // Layer order
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  flipHorizontal: () => void;
  flipVertical: () => void;
  rotate90: () => void;
  resetTransform: () => void;
  toggleLock: () => void;
  toggleVisibility: () => void;
  nudgeElement: (dx: number, dy: number) => void;
  centerElement: () => void;
  fitToFrame: () => void;
  matchWidth: () => void;
  matchHeight: () => void;
  spaceEvenlyH: () => void;
  spaceEvenlyV: () => void;
  swapSize: () => void;
  setOpacity: (opacity: number) => void;
  setBlur: (blur: number) => void;
  setShadow: (shadow: { x: number; y: number; blur: number; color: string } | null) => void;
  renameElement: (name: string) => void;
  cloneKeyframe: () => void;
  renameKeyframe: (name: string) => void;
  reorderKeyframes: (fromIndex: number, toIndex: number) => void;
  clearCanvas: () => void;
  resetProject: () => void;
  setFrameBackground: (color: string) => void;
  setCornerRadius: (radius: number) => void;
  setStrokeWidth: (width: number) => void;
  setFillColor: (color: string) => void;
  setStrokeColor: (color: string) => void;
  setFontSize: (size: number) => void;
  setTextAlign: (align: 'left' | 'center' | 'right') => void;
  setFontWeight: (weight: string) => void;
  setTextColor: (color: string) => void;
  setGradient: (type: 'none' | 'linear' | 'radial', stops?: { color: string; position: number }[]) => void;
  setPosition: (x: number, y: number) => void;
  setSize: (width: number, height: number) => void;
  setRotation: (angle: number) => void;
  setScale: (scale: number) => void;
  setSkew: (skewX: number, skewY: number) => void;
  setPerspective: (perspective: number) => void;
  setBorder: (width: number, color: string, style?: string) => void;
  setInnerShadow: (enabled: boolean, color?: string, x?: number, y?: number, blur?: number) => void;
  setFilter: (filter: { blur?: number; brightness?: number; contrast?: number; saturate?: number; grayscale?: number }) => void;
  setBackdropBlur: (blur: number) => void;
  setBlendMode: (mode: string) => void;
  setClipPath: (path: string) => void;
  setLetterSpacing: (spacing: number) => void;
  setLineHeight: (height: number) => void;
  setFontFamily: (family: string) => void;
  // Variable actions
  addVariable: (variable: Variable) => void;
  updateVariable: (id: string, updates: Partial<Variable>) => void;
  deleteVariable: (id: string) => void;
  setVariableValue: (id: string, value: string | number | boolean) => void;
  // Project actions
  loadProject: (data: { keyframes: Keyframe[]; transitions: Transition[]; functionalStates: FunctionalState[]; components: Component[]; frameSize: Size; canvasBackground?: string }) => void;
  // Style clipboard
  copiedStyle: ShapeStyle | null;
  copyStyle: () => void;
  pasteStyle: () => void;
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
  variables: [],
  selectedKeyframeId: initialKeyframes[0].id,
  selectedElementId: null,
  selectedElementIds: [],
  selectedTransitionId: null,
  currentTool: 'select',
  clipboard: [],
  copiedStyle: null,
  canvasOffset: { x: 0, y: 0 },
  canvasScale: 1,
  recentColors: [],
  canvasBackground: '#0d0d0e',
  showRulers: false,
  snapToGrid: false,
  gridSize: 10,
  frameSize: { width: 390, height: 844 }, // iPhone 14 默认尺寸
  frameBackground: '#1a1a1a',
  history: [{ keyframes: initialKeyframes }],
  historyIndex: 0,
  isDragging: false,
  isResizing: false,
  isSelecting: false,
  selectionBox: null,
  editingComponentId: null,
  editingInstanceId: null,

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
  
  zoomToFit: () => set((state) => {
    const containerWidth = 800;
    const containerHeight = 600;
    const scale = Math.min(
      containerWidth / state.frameSize.width,
      containerHeight / state.frameSize.height,
      1
    ) * 0.9;
    return { canvasScale: scale };
  }),
  
  zoomTo100: () => set({ canvasScale: 1 }),
  
  duplicateSelectedElements: () => {
    const state = get();
    if (state.selectedElementIds.length === 0) return;
    
    const currentKeyframe = state.keyframes.find(kf => kf.id === state.selectedKeyframeId);
    if (!currentKeyframe) return;
    
    get().pushHistory();
    
    const newIds: string[] = [];
    const duplicates: KeyElement[] = [];
    
    state.selectedElementIds.forEach(id => {
      const el = currentKeyframe.keyElements.find(e => e.id === id);
      if (!el) return;
      const newId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      newIds.push(newId);
      duplicates.push({
        ...el,
        id: newId,
        name: `${el.name} copy`,
        position: { x: el.position.x + 20, y: el.position.y + 20 },
      });
    });
    
    set((s) => ({
      keyframes: s.keyframes.map(kf => 
        kf.id === s.selectedKeyframeId 
          ? { ...kf, keyElements: [...kf.keyElements, ...duplicates] }
          : kf
      ),
      selectedElementIds: newIds,
      selectedElementId: newIds.length === 1 ? newIds[0] : null,
    }));
  },
  
  selectAllElements: () => {
    const state = get();
    const currentKeyframe = state.keyframes.find(kf => kf.id === state.selectedKeyframeId);
    if (!currentKeyframe) return;
    const allIds = currentKeyframe.keyElements.map(el => el.id);
    set({
      selectedElementIds: allIds,
      selectedElementId: allIds.length === 1 ? allIds[0] : null,
    });
  },
  
  addRecentColor: (color: string) => set((state) => ({
    recentColors: [color, ...state.recentColors.filter(c => c !== color)].slice(0, 10)
  })),
  setCanvasBackground: (color: string) => set({ canvasBackground: color }),
  toggleRulers: () => set((state) => ({ showRulers: !state.showRulers })),
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  setGridSize: (size: number) => set({ gridSize: size }),
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
      masterElements: [],
      createdAt: Date.now(),
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

  deleteComponent: (id) => set((state) => {
    // Also remove all instances of this component from keyframes
    const newKeyframes = state.keyframes.map(kf => ({
      ...kf,
      keyElements: kf.keyElements.filter(el => el.componentId !== id),
    }));
    return {
      components: state.components.filter((c) => c.id !== id),
      keyframes: newKeyframes,
    };
  }),

  // Create component from selected elements
  createComponentFromSelection: () => {
    const state = get();
    if (state.selectedElementIds.length === 0) return;
    
    const currentKeyframe = state.keyframes.find(kf => kf.id === state.selectedKeyframeId);
    if (!currentKeyframe) return;
    
    const selectedElements = currentKeyframe.keyElements.filter(
      el => state.selectedElementIds.includes(el.id)
    );
    if (selectedElements.length === 0) return;
    
    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selectedElements.forEach(el => {
      minX = Math.min(minX, el.position.x);
      minY = Math.min(minY, el.position.y);
      maxX = Math.max(maxX, el.position.x + el.size.width);
      maxY = Math.max(maxY, el.position.y + el.size.height);
    });
    
    // Normalize element positions relative to bounding box
    const normalizedElements: KeyElement[] = selectedElements.map(el => ({
      ...el,
      id: `master-${el.id}`,
      position: {
        x: el.position.x - minX,
        y: el.position.y - minY,
      },
    }));
    
    const componentId = `comp-${Date.now()}`;
    const newComponent: Component = {
      id: componentId,
      name: `Component ${state.components.length + 1}`,
      functionalStates: [
        { id: `cfs-${Date.now()}`, name: 'Default', isInitial: true, componentId },
      ],
      displayStateMappings: [],
      transitions: [],
      masterElements: normalizedElements,
      createdAt: Date.now(),
    };
    
    // Create instance element to replace selected elements
    const instanceId = `inst-${Date.now()}`;
    const instanceElement: KeyElement = {
      id: instanceId,
      name: newComponent.name,
      category: 'component',
      isKeyElement: true,
      attributes: [],
      position: { x: minX, y: minY },
      size: { width: maxX - minX, height: maxY - minY },
      shapeType: 'rectangle',
      componentId,
      componentInstanceId: instanceId,
      currentStateId: newComponent.functionalStates[0].id,
      styleOverrides: {},
    };
    
    get().pushHistory();
    set((state) => ({
      components: [...state.components, newComponent],
      keyframes: state.keyframes.map(kf => {
        if (kf.id !== state.selectedKeyframeId) return kf;
        // Remove selected elements and add instance
        const remainingElements = kf.keyElements.filter(
          el => !state.selectedElementIds.includes(el.id)
        );
        return {
          ...kf,
          keyElements: [...remainingElements, instanceElement],
        };
      }),
      selectedElementId: instanceId,
      selectedElementIds: [instanceId],
    }));
  },

  // Instantiate component at position
  instantiateComponent: (componentId, position) => {
    const state = get();
    const component = state.components.find(c => c.id === componentId);
    if (!component) return;
    
    // Calculate size from master elements
    let maxX = 0, maxY = 0;
    component.masterElements.forEach(el => {
      maxX = Math.max(maxX, el.position.x + el.size.width);
      maxY = Math.max(maxY, el.position.y + el.size.height);
    });
    
    const instanceId = `inst-${Date.now()}`;
    const instanceElement: KeyElement = {
      id: instanceId,
      name: component.name,
      category: 'component',
      isKeyElement: true,
      attributes: [],
      position,
      size: { width: maxX || 100, height: maxY || 100 },
      shapeType: 'rectangle',
      componentId,
      componentInstanceId: instanceId,
      currentStateId: component.functionalStates[0]?.id,
      styleOverrides: {},
    };
    
    get().pushHistory();
    set((state) => ({
      keyframes: state.keyframes.map(kf => {
        if (kf.id !== state.selectedKeyframeId) return kf;
        return {
          ...kf,
          keyElements: [...kf.keyElements, instanceElement],
        };
      }),
      selectedElementId: instanceId,
      selectedElementIds: [instanceId],
    }));
  },

  // Enter component edit mode
  enterComponentEditMode: (instanceId) => {
    const state = get();
    const currentKeyframe = state.keyframes.find(kf => kf.id === state.selectedKeyframeId);
    const instance = currentKeyframe?.keyElements.find(el => el.id === instanceId);
    if (!instance?.componentId) return;
    
    set({
      editingComponentId: instance.componentId,
      editingInstanceId: instanceId,
      selectedElementId: null,
      selectedElementIds: [],
    });
  },

  // Exit component edit mode
  exitComponentEditMode: () => {
    set({
      editingComponentId: null,
      editingInstanceId: null,
    });
  },

  // Sync all instances of a component after editing
  syncComponentInstances: (componentId) => {
    const state = get();
    const component = state.components.find(c => c.id === componentId);
    if (!component) return;
    
    // Calculate new size from master elements
    let maxX = 0, maxY = 0;
    component.masterElements.forEach(el => {
      maxX = Math.max(maxX, el.position.x + el.size.width);
      maxY = Math.max(maxY, el.position.y + el.size.height);
    });
    
    // Update all instances in all keyframes
    set((state) => ({
      keyframes: state.keyframes.map(kf => ({
        ...kf,
        keyElements: kf.keyElements.map(el => {
          if (el.componentId !== componentId) return el;
          return {
            ...el,
            name: component.name,
            size: { width: maxX || el.size.width, height: maxY || el.size.height },
          };
        }),
      })),
    }));
  },

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

  // Group selected elements
  groupSelectedElements: () => {
    const state = get();
    if (state.selectedElementIds.length < 2) return;
    
    get().pushHistory();
    const groupId = `group-${Date.now()}`;
    
    // Find selected elements
    const currentKeyframe = state.keyframes.find(kf => kf.id === state.selectedKeyframeId);
    if (!currentKeyframe) return;
    
    const selectedElements = currentKeyframe.keyElements.filter(
      el => state.selectedElementIds.includes(el.id)
    );
    
    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selectedElements.forEach(el => {
      minX = Math.min(minX, el.position.x);
      minY = Math.min(minY, el.position.y);
      maxX = Math.max(maxX, el.position.x + el.size.width);
      maxY = Math.max(maxY, el.position.y + el.size.height);
    });
    
    // Create group element
    const groupElement: KeyElement = {
      id: groupId,
      name: 'Group',
      category: 'content',
      isKeyElement: true,
      attributes: [],
      position: { x: minX, y: minY },
      size: { width: maxX - minX, height: maxY - minY },
      shapeType: 'rectangle',
      style: {
        fill: 'transparent',
        fillOpacity: 0,
        stroke: '',
        strokeWidth: 0,
        strokeOpacity: 0,
        borderRadius: 0,
      },
    };
    
    set((state) => ({
      keyframes: state.keyframes.map((kf) => {
        if (kf.id !== state.selectedKeyframeId) return kf;
        
        // Update children to have parentId
        const updatedElements = kf.keyElements.map(el => {
          if (state.selectedElementIds.includes(el.id)) {
            return {
              ...el,
              parentId: groupId,
              position: {
                x: el.position.x - minX,
                y: el.position.y - minY,
              },
            };
          }
          return el;
        });
        
        return {
          ...kf,
          keyElements: [groupElement, ...updatedElements],
        };
      }),
      selectedElementId: groupId,
      selectedElementIds: [groupId],
    }));
  },

  // Ungroup selected elements
  ungroupSelectedElements: () => {
    const state = get();
    if (state.selectedElementIds.length !== 1) return;
    
    const groupId = state.selectedElementIds[0];
    const currentKeyframe = state.keyframes.find(kf => kf.id === state.selectedKeyframeId);
    if (!currentKeyframe) return;
    
    const groupElement = currentKeyframe.keyElements.find(el => el.id === groupId);
    if (!groupElement) return;
    
    // Find children
    const children = currentKeyframe.keyElements.filter(el => el.parentId === groupId);
    if (children.length === 0) return;
    
    get().pushHistory();
    
    set((state) => ({
      keyframes: state.keyframes.map((kf) => {
        if (kf.id !== state.selectedKeyframeId) return kf;
        
        // Remove group, update children positions
        const updatedElements = kf.keyElements
          .filter(el => el.id !== groupId)
          .map(el => {
            if (el.parentId === groupId) {
              return {
                ...el,
                parentId: undefined,
                position: {
                  x: el.position.x + groupElement.position.x,
                  y: el.position.y + groupElement.position.y,
                },
              };
            }
            return el;
          });
        
        return { ...kf, keyElements: updatedElements };
      }),
      selectedElementIds: children.map(c => c.id),
      selectedElementId: children.length === 1 ? children[0].id : null,
    }));
  },

  // Align elements
  alignElements: (alignment) => {
    const state = get();
    if (state.selectedElementIds.length < 2) return;
    
    const currentKeyframe = state.keyframes.find(kf => kf.id === state.selectedKeyframeId);
    if (!currentKeyframe) return;
    
    const selected = currentKeyframe.keyElements.filter(
      el => state.selectedElementIds.includes(el.id)
    );
    
    get().pushHistory();
    
    let targetValue: number;
    switch (alignment) {
      case 'left':
        targetValue = Math.min(...selected.map(el => el.position.x));
        selected.forEach(el => get().updateElementPosition(el.id, { ...el.position, x: targetValue }));
        break;
      case 'right':
        targetValue = Math.max(...selected.map(el => el.position.x + el.size.width));
        selected.forEach(el => get().updateElementPosition(el.id, { ...el.position, x: targetValue - el.size.width }));
        break;
      case 'center':
        const minX = Math.min(...selected.map(el => el.position.x));
        const maxX = Math.max(...selected.map(el => el.position.x + el.size.width));
        const centerX = (minX + maxX) / 2;
        selected.forEach(el => get().updateElementPosition(el.id, { ...el.position, x: centerX - el.size.width / 2 }));
        break;
      case 'top':
        targetValue = Math.min(...selected.map(el => el.position.y));
        selected.forEach(el => get().updateElementPosition(el.id, { ...el.position, y: targetValue }));
        break;
      case 'bottom':
        targetValue = Math.max(...selected.map(el => el.position.y + el.size.height));
        selected.forEach(el => get().updateElementPosition(el.id, { ...el.position, y: targetValue - el.size.height }));
        break;
      case 'middle':
        const minY = Math.min(...selected.map(el => el.position.y));
        const maxY = Math.max(...selected.map(el => el.position.y + el.size.height));
        const centerY = (minY + maxY) / 2;
        selected.forEach(el => get().updateElementPosition(el.id, { ...el.position, y: centerY - el.size.height / 2 }));
        break;
    }
  },

  // Distribute elements
  distributeElements: (direction) => {
    const state = get();
    if (state.selectedElementIds.length < 3) return;
    
    const currentKeyframe = state.keyframes.find(kf => kf.id === state.selectedKeyframeId);
    if (!currentKeyframe) return;
    
    const selected = currentKeyframe.keyElements
      .filter(el => state.selectedElementIds.includes(el.id))
      .sort((a, b) => direction === 'horizontal' 
        ? a.position.x - b.position.x 
        : a.position.y - b.position.y
      );
    
    get().pushHistory();
    
    if (direction === 'horizontal') {
      const first = selected[0];
      const last = selected[selected.length - 1];
      const totalWidth = selected.reduce((sum, el) => sum + el.size.width, 0);
      const totalSpace = (last.position.x + last.size.width) - first.position.x - totalWidth;
      const gap = totalSpace / (selected.length - 1);
      
      let currentX = first.position.x + first.size.width + gap;
      for (let i = 1; i < selected.length - 1; i++) {
        get().updateElementPosition(selected[i].id, { ...selected[i].position, x: currentX });
        currentX += selected[i].size.width + gap;
      }
    } else {
      const first = selected[0];
      const last = selected[selected.length - 1];
      const totalHeight = selected.reduce((sum, el) => sum + el.size.height, 0);
      const totalSpace = (last.position.y + last.size.height) - first.position.y - totalHeight;
      const gap = totalSpace / (selected.length - 1);
      
      let currentY = first.position.y + first.size.height + gap;
      for (let i = 1; i < selected.length - 1; i++) {
        get().updateElementPosition(selected[i].id, { ...selected[i].position, y: currentY });
        currentY += selected[i].size.height + gap;
      }
    }
  },

  // Load project
  loadProject: (data) => {
    set({
      keyframes: data.keyframes,
      transitions: data.transitions,
      functionalStates: data.functionalStates,
      components: data.components,
      frameSize: data.frameSize,
      canvasBackground: data.canvasBackground || '#0d0d0e',
      selectedKeyframeId: data.keyframes[0]?.id || '',
      selectedElementId: null,
      selectedElementIds: [],
      history: [{ keyframes: data.keyframes }],
      historyIndex: 0,
    });
  },

  // Copy style from selected element
  copyStyle: () => {
    const state = get();
    if (!state.selectedElementId) return;
    
    const currentKeyframe = state.keyframes.find(kf => kf.id === state.selectedKeyframeId);
    const element = currentKeyframe?.keyElements.find(el => el.id === state.selectedElementId);
    if (element?.style) {
      set({ copiedStyle: { ...element.style } });
    }
  },

  // Paste style to selected elements
  pasteStyle: () => {
    const state = get();
    if (!state.copiedStyle || state.selectedElementIds.length === 0) return;
    
    get().pushHistory();
    state.selectedElementIds.forEach(id => {
      get().updateElement(id, { style: { ...state.copiedStyle! } });
    });
  },

  // Bring forward (increase zIndex)
  bringForward: () => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el) {
      get().updateElement(state.selectedElementId, { zIndex: (el.zIndex ?? 0) + 1 });
    }
  },

  // Send backward (decrease zIndex)
  sendBackward: () => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el) {
      get().updateElement(state.selectedElementId, { zIndex: (el.zIndex ?? 0) - 1 });
    }
  },

  bringToFront: () => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const kf = state.keyframes.find(k => k.id === state.selectedKeyframeId);
    const maxZ = Math.max(...(kf?.keyElements.map(e => e.zIndex ?? 0) || [0]));
    get().updateElement(state.selectedElementId, { zIndex: maxZ + 1 });
  },

  sendToBack: () => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const kf = state.keyframes.find(k => k.id === state.selectedKeyframeId);
    const minZ = Math.min(...(kf?.keyElements.map(e => e.zIndex ?? 0) || [0]));
    get().updateElement(state.selectedElementId, { zIndex: minZ - 1 });
  },

  flipHorizontal: () => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, flipX: !el.style.flipX } 
      });
    }
  },

  flipVertical: () => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, flipY: !el.style.flipY } 
      });
    }
  },

  rotate90: () => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      const currentRotation = el.style.rotation ?? 0;
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, rotation: (currentRotation + 90) % 360 } 
      });
    }
  },

  resetTransform: () => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, rotation: 0, flipX: false, flipY: false, scale: 1 } 
      });
    }
  },

  toggleLock: () => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el) {
      get().updateElement(state.selectedElementId, { locked: !el.locked });
    }
  },

  toggleVisibility: () => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el) {
      get().updateElement(state.selectedElementId, { visible: el.visible === false ? true : false });
    }
  },

  nudgeElement: (dx: number, dy: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && !el.locked) {
      get().updateElement(state.selectedElementId, { 
        position: { x: el.position.x + dx, y: el.position.y + dy } 
      });
    }
  },

  centerElement: () => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && !el.locked) {
      const x = (state.frameSize.width - el.size.width) / 2;
      const y = (state.frameSize.height - el.size.height) / 2;
      get().updateElement(state.selectedElementId, { position: { x, y } });
    }
  },

  fitToFrame: () => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    get().updateElement(state.selectedElementId, { 
      position: { x: 0, y: 0 },
      size: { width: state.frameSize.width, height: state.frameSize.height }
    });
  },

  matchWidth: () => {
    const state = get();
    if (state.selectedElementIds.length < 2) return;
    get().pushHistory();
    const kf = state.keyframes.find(k => k.id === state.selectedKeyframeId);
    const first = kf?.keyElements.find(e => e.id === state.selectedElementIds[0]);
    if (!first) return;
    state.selectedElementIds.slice(1).forEach(id => {
      get().updateElement(id, { size: { width: first.size.width, height: kf?.keyElements.find(e => e.id === id)?.size.height || 0 } });
    });
  },

  matchHeight: () => {
    const state = get();
    if (state.selectedElementIds.length < 2) return;
    get().pushHistory();
    const kf = state.keyframes.find(k => k.id === state.selectedKeyframeId);
    const first = kf?.keyElements.find(e => e.id === state.selectedElementIds[0]);
    if (!first) return;
    state.selectedElementIds.slice(1).forEach(id => {
      get().updateElement(id, { size: { width: kf?.keyElements.find(e => e.id === id)?.size.width || 0, height: first.size.height } });
    });
  },

  spaceEvenlyH: () => {
    const state = get();
    if (state.selectedElementIds.length < 3) return;
    get().pushHistory();
    const kf = state.keyframes.find(k => k.id === state.selectedKeyframeId);
    const els = state.selectedElementIds.map(id => kf?.keyElements.find(e => e.id === id)).filter(Boolean) as KeyElement[];
    els.sort((a, b) => a.position.x - b.position.x);
    const minX = els[0].position.x;
    const maxX = els[els.length - 1].position.x;
    const gap = (maxX - minX) / (els.length - 1);
    els.forEach((el, i) => {
      if (i > 0 && i < els.length - 1) {
        get().updateElement(el.id, { position: { x: minX + gap * i, y: el.position.y } });
      }
    });
  },

  spaceEvenlyV: () => {
    const state = get();
    if (state.selectedElementIds.length < 3) return;
    get().pushHistory();
    const kf = state.keyframes.find(k => k.id === state.selectedKeyframeId);
    const els = state.selectedElementIds.map(id => kf?.keyElements.find(e => e.id === id)).filter(Boolean) as KeyElement[];
    els.sort((a, b) => a.position.y - b.position.y);
    const minY = els[0].position.y;
    const maxY = els[els.length - 1].position.y;
    const gap = (maxY - minY) / (els.length - 1);
    els.forEach((el, i) => {
      if (i > 0 && i < els.length - 1) {
        get().updateElement(el.id, { position: { x: el.position.x, y: minY + gap * i } });
      }
    });
  },

  swapSize: () => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el) {
      get().updateElement(state.selectedElementId, { 
        size: { width: el.size.height, height: el.size.width } 
      });
    }
  },

  setOpacity: (opacity: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, opacity } 
      });
    }
  },

  setBlur: (blur: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, blur } 
      });
    }
  },

  setShadow: (shadow) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { 
          ...el.style, 
          shadowX: shadow?.x ?? 0,
          shadowY: shadow?.y ?? 0,
          shadowBlur: shadow?.blur ?? 0,
          shadowColor: shadow?.color ?? 'transparent'
        } 
      });
    }
  },

  renameElement: (name: string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().updateElement(state.selectedElementId, { name });
  },

  cloneKeyframe: () => {
    const state = get();
    const kf = state.keyframes.find(k => k.id === state.selectedKeyframeId);
    if (!kf) return;
    get().pushHistory();
    const newId = `kf-${Date.now()}`;
    const cloned: Keyframe = {
      ...kf,
      id: newId,
      name: `${kf.name} copy`,
      keyElements: kf.keyElements.map(el => ({
        ...el,
        id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      })),
    };
    set((s) => ({
      keyframes: [...s.keyframes, cloned],
      selectedKeyframeId: newId,
    }));
  },

  renameKeyframe: (name: string) => {
    const state = get();
    set((s) => ({
      keyframes: s.keyframes.map(kf => 
        kf.id === state.selectedKeyframeId ? { ...kf, name } : kf
      ),
    }));
  },

  reorderKeyframes: (fromIndex: number, toIndex: number) => {
    set((s) => {
      const kfs = [...s.keyframes];
      const [moved] = kfs.splice(fromIndex, 1);
      kfs.splice(toIndex, 0, moved);
      return { keyframes: kfs };
    });
  },

  clearCanvas: () => {
    get().pushHistory();
    set((s) => ({
      keyframes: s.keyframes.map(kf => 
        kf.id === s.selectedKeyframeId ? { ...kf, keyElements: [] } : kf
      ),
      selectedElementIds: [],
      selectedElementId: null,
    }));
  },

  resetProject: () => {
    const defaultKfId = `kf-${Date.now()}`;
    set({
      keyframes: [{
        id: defaultKfId,
        name: 'Frame 1',
        summary: '',
        keyElements: [],
      }],
      selectedKeyframeId: defaultKfId,
      selectedElementIds: [],
      selectedElementId: null,
      transitions: [],
      components: [],
      variables: [],
      history: [],
      historyIndex: -1,
    });
  },

  setFrameBackground: (color: string) => {
    set({ frameBackground: color });
  },

  setCornerRadius: (radius: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, borderRadius: radius } 
      });
    }
  },

  setStrokeWidth: (width: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, strokeWidth: width } 
      });
    }
  },

  setFillColor: (color: string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, fill: color } 
      });
    }
  },

  setStrokeColor: (color: string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, stroke: color } 
      });
    }
  },

  setFontSize: (size: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, fontSize: size } 
      });
    }
  },

  setTextAlign: (align) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, textAlign: align } 
      });
    }
  },

  setFontWeight: (weight: string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, fontWeight: weight } 
      });
    }
  },

  setTextColor: (color: string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, color } 
      });
    }
  },

  setGradient: (type, stops) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, gradientType: type, gradientStops: stops } 
      });
    }
  },

  setPosition: (x: number, y: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    get().updateElement(state.selectedElementId, { position: { x, y } });
  },

  setSize: (width: number, height: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    get().updateElement(state.selectedElementId, { size: { width, height } });
  },

  setRotation: (angle: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, rotation: angle } 
      });
    }
  },

  setScale: (scale: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, scale } 
      });
    }
  },

  setSkew: (skewX: number, skewY: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, skewX, skewY } 
      });
    }
  },

  setPerspective: (perspective: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, perspective } 
      });
    }
  },

  setBorder: (width: number, color: string, style?: string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { 
          ...el.style, 
          strokeWidth: width, 
          stroke: color,
          strokeStyle: (style as 'solid' | 'dashed' | 'dotted') || 'solid'
        } 
      });
    }
  },

  setInnerShadow: (enabled: boolean, color?: string, x?: number, y?: number, blur?: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { 
          ...el.style, 
          innerShadowEnabled: enabled,
          ...(color && { innerShadowColor: color }),
          ...(x !== undefined && { innerShadowX: x }),
          ...(y !== undefined && { innerShadowY: y }),
          ...(blur !== undefined && { innerShadowBlur: blur }),
        } 
      });
    }
  },

  setFilter: (filter) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, ...filter } 
      });
    }
  },

  setBackdropBlur: (blur: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, backdropBlur: blur } 
      });
    }
  },

  setBlendMode: (mode: string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, blendMode: mode } 
      });
    }
  },

  setClipPath: (path: string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, clipPath: path } 
      });
    }
  },

  setLetterSpacing: (spacing: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, letterSpacing: spacing } 
      });
    }
  },

  setLineHeight: (height: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, lineHeight: height } 
      });
    }
  },

  setFontFamily: (family: string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.keyframes.find(kf => kf.id === state.selectedKeyframeId)
      ?.keyElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, fontFamily: family } 
      });
    }
  },

  // Variable actions
  addVariable: (variable: Variable) => set((state) => ({
    variables: [...state.variables, variable],
  })),

  updateVariable: (id: string, updates: Partial<Variable>) => set((state) => ({
    variables: state.variables.map(v => 
      v.id === id ? { ...v, ...updates } : v
    ),
  })),

  deleteVariable: (id: string) => set((state) => ({
    variables: state.variables.filter(v => v.id !== id),
  })),

  setVariableValue: (id: string, value: string | number | boolean) => set((state) => ({
    variables: state.variables.map(v =>
      v.id === id ? { ...v, currentValue: value } : v
    ),
  })),

  // Import actions
  importKeyframes: (keyframes: Keyframe[]) => set(() => ({
    keyframes,
    selectedKeyframeId: keyframes[0]?.id || '',
  })),

  importTransitions: (transitions: Transition[]) => set(() => ({
    transitions,
  })),

}));
