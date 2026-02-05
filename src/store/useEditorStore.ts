import { create } from 'zustand';
import type { Keyframe, Transition, KeyElement, ToolType, Position } from '../types';
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
}

interface EditorActions {
  setSelectedKeyframeId: (id: string) => void;
  addKeyframe: () => void;
  deleteKeyframe: (id: string) => void;
  setSelectedElementId: (id: string | null) => void;
  setSelectedElementIds: (ids: string[]) => void;
  addElement: (element: KeyElement) => void;
  deleteElement: (id: string) => void;
  updateElementName: (id: string, name: string) => void;
  setCurrentTool: (tool: ToolType) => void;
  setCanvasOffset: (offset: Position) => void;
  setCanvasScale: (scale: number) => void;
}

export type EditorStore = EditorState & EditorActions;

export const useEditorStore = create<EditorStore>((set) => ({
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
}));
