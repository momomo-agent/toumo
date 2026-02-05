import { create } from 'zustand';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface ShapeStyle {
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
}

export interface KeyElement {
  id: string;
  name: string;
  position: Position;
  size: Size;
  style?: ShapeStyle;
  isKeyElement?: boolean;
  locked?: boolean;
  visible?: boolean;
}

export interface Keyframe {
  id: string;
  name: string;
  keyElements: KeyElement[];
}

export interface Transition {
  id: string;
  from: string;
  to: string;
  trigger: string;
  duration: number;
  curve: string;
}

type ToolType = 'select' | 'rectangle' | 'ellipse' | 'text' | 'hand';

interface EditorState {
  keyframes: Keyframe[];
  transitions: Transition[];
  selectedKeyframeId: string;
  selectedElementId: string | null;
  currentTool: ToolType;
}

interface EditorActions {
  setSelectedKeyframeId: (id: string) => void;
  setSelectedElementId: (id: string | null) => void;
  setCurrentTool: (tool: ToolType) => void;
  addKeyframe: () => void;
}

const initialKeyframes: Keyframe[] = [
  {
    id: 'kf-1',
    name: 'Idle',
    keyElements: [
      {
        id: 'el-1',
        name: 'Card',
        position: { x: 40, y: 40 },
        size: { width: 200, height: 120 },
        style: { fill: '#3b82f6', fillOpacity: 1, stroke: '', strokeWidth: 0, borderRadius: 12 },
      },
    ],
  },
  {
    id: 'kf-2',
    name: 'Active',
    keyElements: [
      {
        id: 'el-1',
        name: 'Card',
        position: { x: 40, y: 20 },
        size: { width: 200, height: 140 },
        style: { fill: '#10b981', fillOpacity: 1, stroke: '', strokeWidth: 0, borderRadius: 16 },
      },
    ],
  },
];

const initialTransitions: Transition[] = [
  {
    id: 'tr-1',
    from: 'kf-1',
    to: 'kf-2',
    trigger: 'tap',
    duration: 300,
    curve: 'ease-out',
  },
];

export const useEditorStore = create<EditorState & EditorActions>((set) => ({
  keyframes: initialKeyframes,
  transitions: initialTransitions,
  selectedKeyframeId: 'kf-1',
  selectedElementId: null,
  currentTool: 'select',

  setSelectedKeyframeId: (id) => set({ selectedKeyframeId: id }),
  setSelectedElementId: (id) => set({ selectedElementId: id }),
  setCurrentTool: (tool) => set({ currentTool: tool }),
  addKeyframe: () => set((state) => {
    const newId = `kf-${Date.now()}`;
    return {
      keyframes: [...state.keyframes, {
        id: newId,
        name: `State ${state.keyframes.length + 1}`,
        keyElements: [],
      }],
    };
  }),
}));
