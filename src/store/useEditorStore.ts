import { create } from 'zustand';
import type { 
  Keyframe, 
  Transition, 
  KeyElement, 
  ToolType,
  Position,
  ShapeStyle,
} from '../types';
import { DEFAULT_STYLE } from '../types';
import { initialKeyframes, initialTransitions } from './initialData';

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
  editingTextId: string | null;
  showHelp: boolean;
}

interface EditorActions {
  setSelectedKeyframeId: (id: string) => void;
  addKeyframe: () => void;
  deleteKeyframe: (id: string) => void;
  updateKeyframeMeta: (field: 'name' | 'summary' | 'functionalState', value: string) => void;
  setSelectedElementId: (id: string | null) => void;
  setSelectedElementIds: (ids: string[]) => void;
  addElement: (element: KeyElement) => void;
  deleteElement: (id: string) => void;
  updateElementPosition: (id: string, position: Position) => void;
  updateElementSize: (id: string, size: { width: number; height: number }) => void;
  updateElementStyle: (id: string, key: keyof ShapeStyle, value: string | number) => void;
  updateElementName: (id: string, name: string) => void;
  updateElementText: (id: string, text: string) => void;
  toggleElementKeyStatus: (id: string) => void;
  toggleElementLock: (id: string) => void;
  toggleElementVisibility: (id: string) => void;
  duplicateElement: (id: string) => void;
  setCurrentTool: (tool: ToolType) => void;
  setClipboard: (elements: KeyElement[]) => void;
  setCanvasOffset: (offset: Position) => void;
  setCanvasScale: (scale: number) => void;
  setSelectedTransitionId: (id: string | null) => void;
  addTransition: () => void;
  deleteTransition: (id: string) => void;
  updateTransition: (id: string, field: string, value: string | number) => void;
  setEditingTextId: (id: string | null) => void;
  setShowHelp: (show: boolean) => void;
  setKeyframes: (updater: (prev: Keyframe[]) => Keyframe[]) => void;
  setTransitions: (updater: (prev: Transition[]) => Transition[]) => void;
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
  editingTextId: null,
  showHelp: false,

  // Keyframe actions
  setSelectedKeyframeId: (id) => set({ selectedKeyframeId: id }),
  
  addKeyframe: () => set((state) => {
    const newId = `kf-${Date.now()}`;
    const newKeyframe: Keyframe = {
      id: newId,
      name: `State ${state.keyframes.length + 1}`,
      summary: 'New state',
      functionalState: 'idle',
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
      transitions: state.transitions.filter(
        (t) => t.from !== id && t.to !== id
      ),
    };
  }),

  updateKeyframeMeta: (field, value) => set((state) => ({
    keyframes: state.keyframes.map((kf) =>
      kf.id === state.selectedKeyframeId ? { ...kf, [field]: value } : kf
    ),
  })),

  // Element actions
  setSelectedElementId: (id) => set({ selectedElementId: id }),
  setSelectedElementIds: (ids) => set({ selectedElementIds: ids }),

  addElement: (element) => set((state) => ({
    keyframes: state.keyframes.map((kf) =>
      kf.id === state.selectedKeyframeId
        ? { ...kf, keyElements: [...kf.keyElements, element] }
        : kf
    ),
    selectedElementId: element.id,
  })),

  deleteElement: (id) => set((state) => ({
    keyframes: state.keyframes.map((kf) =>
      kf.id === state.selectedKeyframeId
        ? { ...kf, keyElements: kf.keyElements.filter((el) => el.id !== id) }
        : kf
    ),
    selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    selectedElementIds: state.selectedElementIds.filter((eid) => eid !== id),
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

  updateElementStyle: (id, key, value) => set((state) => ({
    keyframes: state.keyframes.map((kf) =>
      kf.id === state.selectedKeyframeId
        ? {
            ...kf,
            keyElements: kf.keyElements.map((el) =>
              el.id === id
                ? { ...el, style: { ...DEFAULT_STYLE, ...el.style, [key]: value } }
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

  updateElementText: (id, text) => set((state) => ({
    keyframes: state.keyframes.map((kf) =>
      kf.id === state.selectedKeyframeId
        ? {
            ...kf,
            keyElements: kf.keyElements.map((el) =>
              el.id === id ? { ...el, text } : el
            ),
          }
        : kf
    ),
  })),

  toggleElementKeyStatus: (id) => set((state) => ({
    keyframes: state.keyframes.map((kf) =>
      kf.id === state.selectedKeyframeId
        ? {
            ...kf,
            keyElements: kf.keyElements.map((el) =>
              el.id === id ? { ...el, isKeyElement: !el.isKeyElement } : el
            ),
          }
        : kf
    ),
  })),

  toggleElementLock: (id) => set((state) => ({
    keyframes: state.keyframes.map((kf) =>
      kf.id === state.selectedKeyframeId
        ? {
            ...kf,
            keyElements: kf.keyElements.map((el) =>
              el.id === id ? { ...el, locked: !el.locked } : el
            ),
          }
        : kf
    ),
  })),

  toggleElementVisibility: (id) => set((state) => ({
    keyframes: state.keyframes.map((kf) =>
      kf.id === state.selectedKeyframeId
        ? {
            ...kf,
            keyElements: kf.keyElements.map((el) =>
              el.id === id ? { ...el, visible: el.visible === false } : el
            ),
          }
        : kf
    ),
  })),

  duplicateElement: (id) => set((state) => {
    const kf = state.keyframes.find((k) => k.id === state.selectedKeyframeId);
    const el = kf?.keyElements.find((e) => e.id === id);
    if (!el) return state;
    
    const newEl: KeyElement = {
      ...el,
      id: `el-${Date.now()}`,
      name: `${el.name} copy`,
      position: { x: el.position.x + 20, y: el.position.y + 20 },
    };
    
    return {
      keyframes: state.keyframes.map((k) =>
        k.id === state.selectedKeyframeId
          ? { ...k, keyElements: [...k.keyElements, newEl] }
          : k
      ),
      selectedElementId: newEl.id,
    };
  }),

  // Tool actions
  setCurrentTool: (tool) => set({ currentTool: tool }),
  setClipboard: (elements) => set({ clipboard: elements }),

  // Canvas actions
  setCanvasOffset: (offset) => set({ canvasOffset: offset }),
  setCanvasScale: (scale) => set({ canvasScale: scale }),

  // Transition actions
  setSelectedTransitionId: (id) => set({ selectedTransitionId: id }),

  addTransition: () => set((state) => {
    const newId = `tr-${Date.now()}`;
    const newTransition: Transition = {
      id: newId,
      from: state.selectedKeyframeId,
      to: state.keyframes[0]?.id || '',
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
    transitions: state.transitions.filter((t) => t.id !== id),
    selectedTransitionId: state.selectedTransitionId === id 
      ? null 
      : state.selectedTransitionId,
  })),

  updateTransition: (id, field, value) => set((state) => ({
    transitions: state.transitions.map((t) =>
      t.id === id ? { ...t, [field]: value } : t
    ),
  })),

  // UI actions
  setEditingTextId: (id) => set({ editingTextId: id }),
  setShowHelp: (show) => set({ showHelp: show }),

  // Bulk updaters
  setKeyframes: (updater) => set((state) => ({
    keyframes: updater(state.keyframes),
  })),
  setTransitions: (updater) => set((state) => ({
    transitions: updater(state.transitions),
  })),
}));
