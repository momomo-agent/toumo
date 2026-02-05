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
