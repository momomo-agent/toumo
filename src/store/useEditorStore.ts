import { create } from 'zustand';
import type { Keyframe, KeyElement, Position, Size, ComponentV2, ShapeStyle, Variable, AutoLayoutConfig, ChildLayoutConfig, AutoLayoutDirection, AutoLayoutAlign, AutoLayoutJustify, SizingMode, ConditionRule, VariableBinding, Patch, PatchConnection, DisplayState } from '../types';
import { createCanvasSlice, type CanvasSlice } from './canvasSlice';
import { createSelectionSlice, type SelectionSlice } from './selectionSlice';
import { createPatchSlice, type PatchSlice } from './patchSlice';
import { createDisplayStateSlice, type DisplayStateSlice, isDefaultDisplayState, updatesToLayerProperties, writeToLayerOverride } from './displayStateSlice';
import { createCurveSlice, type CurveSlice } from './curveSlice';
import { createVariableSlice, type VariableSlice } from './variableSlice';
// Legacy types removed — using any temporarily
type Transition = any;
type Component = any;

// Device presets (PRD §6)
export const DEVICE_PRESETS = [
  { name: 'iPhone 14 Pro', width: 393, height: 852 },
  { name: 'iPhone 14', width: 390, height: 844 },
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'Android', width: 360, height: 800 },
  { name: 'iPad', width: 820, height: 1180 },
] as const;
type Interaction = any;
import { initialKeyframes, initialTransitions, initialSharedElements } from './initialData';
import { DEFAULT_AUTO_LAYOUT } from '../types';
import { applyConstraints } from '../utils/constraintsUtils';
import { performBooleanOperation, canPerformBooleanOperation } from '../utils/booleanOperations';
import { SUGAR_PRESETS, type SugarResult } from '../engine/SugarPresets';

interface HistoryEntry {
  keyframes: Keyframe[];
  sharedElements: KeyElement[];
  displayStates: DisplayState[];
  patches: Patch[];
  patchConnections: PatchConnection[];
  componentsV2: ComponentV2[];
  description: string;
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
  components: Component[];
  selectedKeyframeId: string;
  clipboard: KeyElement[];
  copiedStyle: ShapeStyle | null;
  frameSize: Size;
  history: HistoryEntry[];
  historyIndex: number;
  // Component edit mode
  editingComponentId: string | null;
  editingInstanceId: string | null;
  // Group edit mode
  editingGroupId: string | null;
  // Shared layer tree — single source of truth for all keyframes
  sharedElements: KeyElement[];
  // Shared layer tree + display states (PRD v2)
  displayStates: DisplayState[];
  selectedDisplayStateId: string | null;
  // Component V2 (PRD v2)
  componentsV2: ComponentV2[];
}

interface EditorActions {
  setSelectedKeyframeId: (id: string) => void;
  addKeyframe: () => void;
  deleteKeyframe: (id: string) => void;
  removeKeyframe: (id: string) => void;
  addElement: (element: KeyElement) => void;
  deleteElement: (id: string) => void;
  deleteSelectedElements: () => void;
  updateElement: (id: string, updates: Partial<KeyElement>) => void;
  updateElementPosition: (id: string, position: Position) => void;
  updateElementSize: (id: string, size: Size) => void;
  updateElementName: (id: string, name: string) => void;
  nudgeSelectedElements: (dx: number, dy: number) => void;
  duplicateSelectedElements: () => void;
  selectAllElements: () => void;
  setFrameSize: (size: Size) => void;
  copySelectedElements: () => void;
  cutSelectedElements: () => void;
  pasteElements: () => void;
  undo: () => void;
  redo: () => void;
  pushHistory: (description?: string) => void;
  updateTransition: (id: string, updates: Partial<Transition>) => void;
  addTransition: (from: string, to: string) => void;
  deleteTransition: (id: string) => void;
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
  addImageElement: (imageSrc: string, originalWidth: number, originalHeight: number, position?: Position) => void;
  // Group actions
  groupSelectedElements: () => void;
  ungroupSelectedElements: () => void;
  enterGroupEditMode: (groupId: string) => void;
  exitGroupEditMode: () => void;
  resizeGroup: (groupId: string, newSize: Size, newPosition: Position) => void;
  // Alignment actions
  alignElements: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeElements: (direction: 'horizontal' | 'vertical') => void;
  // Layer order
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  // Align functions
  alignLeft: () => void;
  alignCenterH: () => void;
  alignRight: () => void;
  alignTop: () => void;
  alignCenterV: () => void;
  alignBottom: () => void;
  distributeH: () => void;
  distributeV: () => void;
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
  setTextDecoration: (decoration: 'none' | 'underline' | 'line-through') => void;
  setFontStyle: (style: 'normal' | 'italic') => void;
  setTextTransform: (transform: 'none' | 'uppercase' | 'lowercase' | 'capitalize') => void;
  setVisibility: (visible: boolean) => void;
  setCursor: (cursor: string) => void;
  setZIndex: (zIndex: number) => void;
  setAspectRatio: (ratio: string | null) => void;
  setOverflow: (overflow: 'visible' | 'hidden' | 'scroll') => void;
  setPointerEvents: (enabled: boolean) => void;
  setTransformOrigin: (origin: string) => void;
  setDropShadow: (x: number, y: number, blur: number, color: string) => void;
  setTextShadow: (x: number, y: number, blur: number, color: string) => void;
  setObjectFit: (fit: 'fill' | 'contain' | 'cover' | 'none') => void;
  setFlexLayout: (direction: 'row' | 'column', gap?: number) => void;
  setJustifyContent: (justify: 'flex-start' | 'center' | 'flex-end' | 'space-between') => void;
  setAlignItems: (align: 'flex-start' | 'center' | 'flex-end' | 'stretch') => void;
  setPadding: (padding: number | { top?: number; right?: number; bottom?: number; left?: number }) => void;
  setIndividualCornerRadius: (tl: number, tr: number, br: number, bl: number) => void;
  setStrokeOpacity: (opacity: number) => void;
  setFillOpacity: (opacity: number) => void;
  setStrokeDasharray: (dasharray: string) => void;
  setHueRotate: (degrees: number) => void;
  setInvert: (amount: number) => void;
  setSepia: (amount: number) => void;
  setBrightness: (amount: number) => void;
  setContrast: (amount: number) => void;
  setSaturate: (amount: number) => void;
  setGrayscale: (amount: number) => void;
  setFlip: (flipX: boolean, flipY: boolean) => void;
  setVerticalAlign: (align: 'top' | 'middle' | 'bottom') => void;
  setWhiteSpace: (ws: 'nowrap' | 'normal' | 'pre-wrap') => void;
  setWordBreak: (wb: 'normal' | 'break-all' | 'break-word') => void;
  setTextOverflow: (overflow: 'clip' | 'ellipsis') => void;
  setMinSize: (minWidth?: number, minHeight?: number) => void;
  setMaxSize: (maxWidth?: number, maxHeight?: number) => void;
  setBoxSizing: (sizing: 'content-box' | 'border-box') => void;
  setIsolation: (isolation: 'auto' | 'isolate') => void;
  setBackfaceVisibility: (visibility: 'visible' | 'hidden') => void;
  setWillChange: (property: string) => void;
  setUserSelect: (select: 'none' | 'auto' | 'text' | 'all') => void;
  setTouchAction: (action: 'auto' | 'none' | 'pan-x' | 'pan-y' | 'manipulation') => void;
  setScrollBehavior: (behavior: 'auto' | 'smooth') => void;
  setScrollSnapType: (type: 'none' | 'x mandatory' | 'y mandatory' | 'both mandatory') => void;
  setScrollSnapAlign: (align: 'none' | 'start' | 'center' | 'end') => void;
  setGap: (gap: number) => void;
  setFlexWrap: (wrap: 'nowrap' | 'wrap' | 'wrap-reverse') => void;
  setFlexGrow: (grow: number) => void;
  setFlexShrink: (shrink: number) => void;
  setFlexBasis: (basis: string) => void;
  setAlignSelf: (align: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch') => void;
  setOrder: (order: number) => void;
  setGridTemplate: (columns: string, rows: string) => void;
  setGridArea: (area: string) => void;
  setPlaceItems: (place: 'start' | 'center' | 'end' | 'stretch') => void;
  setPlaceContent: (place: 'start' | 'center' | 'end' | 'stretch' | 'space-between' | 'space-around') => void;
  setAlignContent: (align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'space-between' | 'space-around') => void;
  setCssPosition: (position: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky') => void;
  setInset: (top?: number, right?: number, bottom?: number, left?: number) => void;
  setDisplay: (display: 'block' | 'inline' | 'flex' | 'grid' | 'none' | 'inline-block') => void;
  setMargin: (margin: number | string) => void;
  setIndividualMargin: (top?: number, right?: number, bottom?: number, left?: number) => void;
  setIndividualPadding: (top?: number, right?: number, bottom?: number, left?: number) => void;
  setOutline: (width: number, style: 'none' | 'solid' | 'dashed' | 'dotted' | 'double', color: string) => void;
  setOutlineOffset: (offset: number) => void;
  setTransition: (property: string, duration: number, easing: string) => void;
  setTransitionDelay: (delay: number) => void;
  // Variable binding actions (cross-slice: stays in main store)
  addVariableBinding: (elementId: string, binding: VariableBinding) => void;
  removeVariableBinding: (elementId: string, variableId: string, property: string) => void;
  // Project actions
  loadProject: (data: { keyframes: Keyframe[]; transitions: Transition[]; components: Component[]; frameSize: Size; canvasBackground?: string; interactions?: Interaction[]; variables?: Variable[]; conditionRules?: ConditionRule[]; sharedElements?: KeyElement[]; displayStates?: DisplayState[]; patches?: Patch[]; patchConnections?: PatchConnection[]; componentsV2?: ComponentV2[] }) => void;
  exportProject: () => string;
  // Style clipboard
  copiedStyle: ShapeStyle | null;
  copyStyle: () => void;
  pasteStyle: () => void;
  // Auto Layout actions
  toggleAutoLayout: (elementId?: string) => void;
  setAutoLayoutDirection: (direction: AutoLayoutDirection) => void;
  setAutoLayoutGap: (gap: number) => void;
  setAutoLayoutPadding: (top: number, right: number, bottom: number, left: number) => void;
  setAutoLayoutAlign: (align: AutoLayoutAlign) => void;
  setAutoLayoutJustify: (justify: AutoLayoutJustify) => void;
  setAutoLayoutWrap: (wrap: boolean) => void;
  updateAutoLayout: (config: Partial<AutoLayoutConfig>) => void;
  setChildSizingMode: (elementId: string, widthMode: SizingMode, heightMode: SizingMode) => void;
  applyAutoLayout: (parentId: string) => void;
  // Boolean operations
  booleanUnion: () => void;
  booleanSubtract: () => void;
  booleanIntersect: () => void;
  booleanExclude: () => void;
  // Patch editor actions (applySugar stays — cross-slice dependency)
  applySugar: (elementId: string, presetId: string) => void;
  // Component V2 actions
  createComponentV2: (name: string) => void;
  deleteComponentV2: (id: string) => void;
  updateComponentV2: (id: string, updates: Partial<ComponentV2>) => void;
  addComponentDisplayState: (componentId: string, name: string) => void;
  removeComponentDisplayState: (componentId: string, stateId: string) => void;
  addComponentPatch: (componentId: string, patch: Patch) => void;
  removeComponentPatch: (componentId: string, patchId: string) => void;
  addComponentConnection: (componentId: string, conn: PatchConnection) => void;
  removeComponentConnection: (componentId: string, connId: string) => void;
}

export type EditorStore = EditorState & EditorActions & CanvasSlice & SelectionSlice & PatchSlice & DisplayStateSlice & CurveSlice & VariableSlice;

/**
 * Adapter layer: sync sharedElements → all keyframes.keyElements
 * This is the core of the shared layer tree strategy.
 * All element mutations write to sharedElements, then call this to propagate.
 */
const syncToAllKeyframes = (sharedElements: KeyElement[], keyframes: Keyframe[]): Keyframe[] =>
  keyframes.map(kf => ({ ...kf, keyElements: sharedElements }));

export const useEditorStore = create<EditorStore>((set, get) => ({
  // Canvas slice (canvasOffset, canvasScale, guides, etc.)
  ...createCanvasSlice(set, get, { setState: set, getState: get, getInitialState: get, subscribe: () => () => {} } as any),
  // Selection slice (selectedElementId, currentTool, isDragging, etc.)
  ...createSelectionSlice(set, get, { setState: set, getState: get, getInitialState: get, subscribe: () => () => {} } as any),
  // Initial state — sharedElements is the single source of truth
  sharedElements: [...initialSharedElements],
  keyframes: initialKeyframes,
  transitions: initialTransitions,
  components: [],
  // Variable slice (variables, interactions, conditionRules)
  ...createVariableSlice(set, get, { setState: set, getState: get, getInitialState: get, subscribe: () => () => {} } as any),
  // Patch slice
  ...createPatchSlice(set, get, { setState: set, getState: get, getInitialState: get, subscribe: () => () => {} } as any),
  // DisplayState slice (PRD v2 - shared layer tree)
  ...createDisplayStateSlice(set, get, { setState: set, getState: get, getInitialState: get, subscribe: () => () => {} } as any),
  // Curve slice (three-level curve override system - global level)
  ...createCurveSlice(set, get, { setState: set, getState: get, getInitialState: get, subscribe: () => () => {} } as any),
  // Component V2 (PRD v2)
  componentsV2: [],
  selectedKeyframeId: initialKeyframes[0].id,
  clipboard: [],
  copiedStyle: null,
  frameSize: { width: 390, height: 844 }, // iPhone 14 默认尺寸
  history: [{ keyframes: initialKeyframes, sharedElements: initialSharedElements, displayStates: [], patches: [], patchConnections: [], componentsV2: [], description: '初始状态' }],
  historyIndex: 0,
  editingComponentId: null,
  editingInstanceId: null,
  // Group editing mode
  editingGroupId: null as string | null,

  // Actions
  setSelectedKeyframeId: (id) => set((state) => {
    const kf = state.keyframes.find(k => k.id === id);
    return {
      selectedKeyframeId: id,
      selectedDisplayStateId: kf?.displayStateId || state.selectedDisplayStateId,
    };
  }),
  
  addKeyframe: () => set((state) => {
    const newKfId = `kf-${Date.now()}`;
    const newDsId = `ds-${Date.now()}`;
    const newKeyframe: Keyframe = {
      id: newKfId,
      name: `State ${state.keyframes.length + 1}`,
      summary: 'New state',
      displayStateId: newDsId,
      keyElements: state.sharedElements,
    };
    const newDisplayState: DisplayState = {
      id: newDsId,
      name: `State ${state.keyframes.length + 1}`,
      layerOverrides: [],
    };
    return {
      keyframes: [...state.keyframes, newKeyframe],
      displayStates: [...state.displayStates, newDisplayState],
      selectedKeyframeId: newKfId,
      selectedDisplayStateId: newDsId,
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

  removeKeyframe: (id) => set((state) => {
    if (state.keyframes.length <= 1) return state;
    const kfToRemove = state.keyframes.find(kf => kf.id === id);
    if (!kfToRemove) return state;
    const newKeyframes = state.keyframes.filter(kf => kf.id !== id);
    // Also remove the linked displayState
    const newDisplayStates = kfToRemove.displayStateId
      ? state.displayStates.filter(ds => ds.id !== kfToRemove.displayStateId)
      : state.displayStates;
    // If we're deleting the currently selected keyframe, switch to the first one
    const needSwitch = state.selectedKeyframeId === id;
    const nextKfId = needSwitch ? newKeyframes[0].id : state.selectedKeyframeId;
    const nextDsId = needSwitch
      ? newKeyframes[0].displayStateId || newDisplayStates[0]?.id || null
      : state.selectedDisplayStateId;
    return {
      keyframes: newKeyframes,
      displayStates: newDisplayStates,
      selectedKeyframeId: nextKfId,
      selectedDisplayStateId: nextDsId,
    };
  }),

  addElement: (element) => {
    get().pushHistory();
    set((state) => {
      const nextElement = clampElementToFrame(element, state.frameSize);
      const newShared = [...state.sharedElements, nextElement];
      return {
        sharedElements: newShared,
        keyframes: syncToAllKeyframes(newShared, state.keyframes),
        selectedElementId: nextElement.id,
        selectedElementIds: [nextElement.id],
      };
    });
    // If element has a parent with auto layout, re-apply it
    if (element.parentId) {
      get().applyAutoLayout(element.parentId);
    }
  },

  deleteElement: (id) => {
    const state = get();
    const element = state.sharedElements.find(el => el.id === id);
    const parentId = element?.parentId;
    
    get().pushHistory();
    set((state) => {
      const newShared = state.sharedElements.filter((el) => el.id !== id);
      return {
        sharedElements: newShared,
        keyframes: syncToAllKeyframes(newShared, state.keyframes),
        selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
        selectedElementIds: state.selectedElementIds.filter((eid) => eid !== id),
      };
    });
    
    // If element had a parent with auto layout, re-apply it
    if (parentId) {
      get().applyAutoLayout(parentId);
    }
  },

  deleteSelectedElements: () => {
    const state = get();
    if (state.selectedElementIds.length === 0) return;
    get().pushHistory();
    set((state) => {
      const newShared = state.sharedElements.filter((el) => !state.selectedElementIds.includes(el.id));
      return {
        sharedElements: newShared,
        keyframes: syncToAllKeyframes(newShared, state.keyframes),
        selectedElementId: null,
        selectedElementIds: [],
      };
    });
  },

  updateElement: (id, updates) => set((state) => {
    if (isDefaultDisplayState(state)) {
      // Default keyframe: write directly to sharedElements (base values)
      const newShared = state.sharedElements.map((el) => {
        if (el.id !== id) return el;
        const nextElement = {
          ...el,
          ...updates,
          position: updates.position ?? el.position,
          size: updates.size ?? el.size,
          // Merge style shallowly so callers can pass only changed props
          style: updates.style ? { ...el.style, ...updates.style } : el.style,
        } as KeyElement;
        return clampElementToFrame(nextElement, state.frameSize);
      });
      return {
        sharedElements: newShared,
        keyframes: syncToAllKeyframes(newShared, state.keyframes),
      };
    } else {
      // Non-default keyframe: write to layerOverrides
      const newProperties = updatesToLayerProperties(updates);
      return {
        displayStates: writeToLayerOverride(
          state.displayStates,
          state.selectedDisplayStateId!,
          id,
          newProperties,
        ),
      };
    }
  }),

  updateElementPosition: (id, position) => set((state) => {
    if (isDefaultDisplayState(state)) {
      const newShared = state.sharedElements.map((el) =>
        el.id === id ? clampElementToFrame({ ...el, position }, state.frameSize) : el
      );
      return {
        sharedElements: newShared,
        keyframes: syncToAllKeyframes(newShared, state.keyframes),
      };
    } else {
      return {
        displayStates: writeToLayerOverride(
          state.displayStates,
          state.selectedDisplayStateId!,
          id,
          { x: position.x, y: position.y },
        ),
      };
    }
  }),

  updateElementSize: (id, size) => set((state) => {
    if (isDefaultDisplayState(state)) {
      const targetElement = state.sharedElements.find(el => el.id === id);
      const oldSize = targetElement?.size;

      const newShared = state.sharedElements.map((el) => {
        if (el.id === id) {
          return clampElementToFrame({ ...el, size }, state.frameSize);
        }
        // Apply constraints to children of the resized element
        if (el.parentId === id && oldSize) {
          const { position, size: newSize } = applyConstraints(el, oldSize, size);
          return { ...el, position, size: newSize };
        }
        return el;
      });
      return {
        sharedElements: newShared,
        keyframes: syncToAllKeyframes(newShared, state.keyframes),
      };
    } else {
      return {
        displayStates: writeToLayerOverride(
          state.displayStates,
          state.selectedDisplayStateId!,
          id,
          { width: size.width, height: size.height },
        ),
      };
    }
  }),

  updateElementName: (id, name) => set((state) => {
    const newShared = state.sharedElements.map((el) =>
      el.id === id ? { ...el, name } : el
    );
    return {
      sharedElements: newShared,
      keyframes: syncToAllKeyframes(newShared, state.keyframes),
    };
  }),

  nudgeSelectedElements: (dx, dy) => {
    const state = get();
    if (state.selectedElementIds.length === 0) return;
    get().pushHistory();
    if (isDefaultDisplayState(state)) {
      set((state) => {
        const newShared = state.sharedElements.map((el) =>
          state.selectedElementIds.includes(el.id)
            ? clampElementToFrame(
                { ...el, position: { x: el.position.x + dx, y: el.position.y + dy } },
                state.frameSize
              )
            : el
        );
        return {
          sharedElements: newShared,
          keyframes: syncToAllKeyframes(newShared, state.keyframes),
        };
      });
    } else {
      // Non-default keyframe: nudge via layerOverrides
      // We need resolved positions to compute the new position
      const resolvePos = (el: KeyElement) => {
        const ds = state.displayStates.find(d => d.id === state.selectedDisplayStateId);
        const override = ds?.layerOverrides.find(o => o.layerId === el.id);
        return {
          x: override?.properties.x ?? el.position.x,
          y: override?.properties.y ?? el.position.y,
        };
      };
      set((s) => {
        let dsList = s.displayStates;
        for (const id of s.selectedElementIds) {
          const el = s.sharedElements.find(e => e.id === id);
          if (!el) continue;
          const pos = resolvePos(el);
          dsList = writeToLayerOverride(dsList, s.selectedDisplayStateId!, id, {
            x: pos.x + dx,
            y: pos.y + dy,
          });
        }
        return { displayStates: dsList };
      });
    }
  },

  duplicateSelectedElements: () => {
    const state = get();
    if (state.selectedElementIds.length === 0) return;
    
    get().pushHistory();
    
    const newIds: string[] = [];
    const duplicates: KeyElement[] = [];
    
    state.selectedElementIds.forEach(id => {
      const el = state.sharedElements.find(e => e.id === id);
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
    
    set((s) => {
      const newShared = [...s.sharedElements, ...duplicates];
      return {
        sharedElements: newShared,
        keyframes: syncToAllKeyframes(newShared, s.keyframes),
        selectedElementIds: newIds,
        selectedElementId: newIds.length === 1 ? newIds[0] : null,
      };
    });
  },
  
  selectAllElements: () => {
    const state = get();
    const allIds = state.sharedElements.map(el => el.id);
    set({
      selectedElementIds: allIds,
      selectedElementId: allIds.length === 1 ? allIds[0] : null,
    });
  },
  
  setFrameSize: (frameSize) => set((state) => {
    const oldFrameSize = state.frameSize;
    const newShared = state.sharedElements.map((el) => {
      if (!el.parentId) {
        const { position, size } = applyConstraints(el, oldFrameSize, frameSize);
        return clampElementToFrame({ ...el, position, size }, frameSize);
      }
      return el;
    });
    return {
      frameSize,
      sharedElements: newShared,
      keyframes: syncToAllKeyframes(newShared, state.keyframes),
    };
  }),

  copySelectedElements: () => {
    const state = get();
    const elementsToCopy = state.sharedElements.filter(
      el => state.selectedElementIds.includes(el.id)
    );
    set({ clipboard: elementsToCopy });
  },

  cutSelectedElements: () => {
    const state = get();
    const elementsToCut = state.sharedElements.filter(
      el => state.selectedElementIds.includes(el.id)
    );
    if (elementsToCut.length === 0) return;
    get().pushHistory();
    const cutIds = new Set(state.selectedElementIds);
    set((s) => {
      const newShared = s.sharedElements.filter(el => !cutIds.has(el.id));
      return {
        clipboard: elementsToCut,
        sharedElements: newShared,
        keyframes: syncToAllKeyframes(newShared, s.keyframes),
        selectedElementIds: [],
        selectedElementId: null,
      };
    });
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
          position: { x: el.position.x + 10, y: el.position.y + 10 },
        },
        state.frameSize
      )
    );
    // Update clipboard positions so next paste offsets again
    set(() => ({ clipboard: newElements }));
    set((state) => {
      const newShared = [...state.sharedElements, ...newElements];
      return {
        sharedElements: newShared,
        keyframes: syncToAllKeyframes(newShared, state.keyframes),
        selectedElementIds: newElements.map(el => el.id),
        selectedElementId: newElements.length === 1 ? newElements[0].id : null,
      };
    });
  },

  pushHistory: (description?: string) => set((state) => {
    const snapshot = {
      keyframes: JSON.parse(JSON.stringify(state.keyframes)) as Keyframe[],
      sharedElements: JSON.parse(JSON.stringify(state.sharedElements)) as KeyElement[],
      displayStates: JSON.parse(JSON.stringify(state.displayStates)) as DisplayState[],
      patches: JSON.parse(JSON.stringify(state.patches)) as Patch[],
      patchConnections: JSON.parse(JSON.stringify(state.patchConnections)) as PatchConnection[],
      componentsV2: JSON.parse(JSON.stringify(state.componentsV2)) as ComponentV2[],
      description: description || '',
    };
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(snapshot);
    if (newHistory.length > 50) newHistory.shift();
    return {
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };
  }),

  undo: () => set((state) => {
    if (state.historyIndex <= 0) return state;
    const newIndex = state.historyIndex - 1;
    const entry = state.history[newIndex];
    return {
      keyframes: JSON.parse(JSON.stringify(entry.keyframes)),
      sharedElements: JSON.parse(JSON.stringify(entry.sharedElements)),
      displayStates: JSON.parse(JSON.stringify(entry.displayStates)),
      patches: JSON.parse(JSON.stringify(entry.patches)),
      patchConnections: JSON.parse(JSON.stringify(entry.patchConnections)),
      componentsV2: JSON.parse(JSON.stringify(entry.componentsV2)),
      historyIndex: newIndex,
    };
  }),

  redo: () => set((state) => {
    if (state.historyIndex >= state.history.length - 1) return state;
    const newIndex = state.historyIndex + 1;
    const entry = state.history[newIndex];
    return {
      keyframes: JSON.parse(JSON.stringify(entry.keyframes)),
      sharedElements: JSON.parse(JSON.stringify(entry.sharedElements)),
      displayStates: JSON.parse(JSON.stringify(entry.displayStates)),
      patches: JSON.parse(JSON.stringify(entry.patches)),
      patchConnections: JSON.parse(JSON.stringify(entry.patchConnections)),
      componentsV2: JSON.parse(JSON.stringify(entry.componentsV2)),
      historyIndex: newIndex,
    };
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
  // Component actions
  addComponent: (name) => set((state) => {
    const newId = `comp-${Date.now()}`;
    const newComponent: Component = {
      id: newId,
      name,
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
    const newShared = state.sharedElements.filter(el => el.componentId !== id);
    return {
      components: state.components.filter((c) => c.id !== id),
      sharedElements: newShared,
      keyframes: syncToAllKeyframes(newShared, state.keyframes),
    };
  }),

  // Create component from selected elements
  createComponentFromSelection: () => {
    const state = get();
    if (state.selectedElementIds.length === 0) return;
    
    const selectedElements = state.sharedElements.filter(
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
    const componentName = `Component ${state.components.length + 1}`;
    const newComponent: Component = {
      id: componentId,
      name: componentName,
      transitions: [],
      masterElements: normalizedElements,
      createdAt: Date.now(),
    };

    // Also create a ComponentV2 so the canvas renders a keyframe row
    const newComponentV2: ComponentV2 = {
      id: componentId,
      name: componentName,
      layers: normalizedElements,
      displayStates: [
        {
          id: `ds-${componentId}-default`,
          name: 'Default',
          layerOverrides: [],
        },
      ],
      variables: [],
      rules: [],
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
      currentStateId: undefined,
      styleOverrides: {},
    };
    
    get().pushHistory();
    set((state) => {
      const newShared = [
        ...state.sharedElements.filter(el => !state.selectedElementIds.includes(el.id)),
        instanceElement,
      ];
      return {
        components: [...state.components, newComponent],
        componentsV2: [...state.componentsV2, newComponentV2],
        sharedElements: newShared,
        keyframes: syncToAllKeyframes(newShared, state.keyframes),
        selectedElementId: instanceId,
        selectedElementIds: [instanceId],
      };
    });
  },

  // Instantiate component at position
  instantiateComponent: (componentId, position) => {
    const state = get();
    const component = state.components.find(c => c.id === componentId);
    if (!component) return;
    
    // Calculate size from master elements
    let maxX = 0, maxY = 0;
    component.masterElements.forEach((el: any) => {
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
      currentStateId: undefined,
      styleOverrides: {},
    };
    
    get().pushHistory();
    set((state) => {
      const newShared = [...state.sharedElements, instanceElement];
      return {
        sharedElements: newShared,
        keyframes: syncToAllKeyframes(newShared, state.keyframes),
        selectedElementId: instanceId,
        selectedElementIds: [instanceId],
      };
    });
  },

  // Enter component edit mode
  enterComponentEditMode: (instanceId) => {
    const state = get();
    const instance = state.sharedElements.find(el => el.id === instanceId);
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
    component.masterElements.forEach((el: any) => {
      maxX = Math.max(maxX, el.position.x + el.size.width);
      maxY = Math.max(maxY, el.position.y + el.size.height);
    });
    
    // Update all instances in sharedElements
    set((state) => {
      const newShared = state.sharedElements.map(el => {
        if (el.componentId !== componentId) return el;
        return {
          ...el,
          name: component.name,
          size: { width: maxX || el.size.width, height: maxY || el.size.height },
        };
      });
      return {
        sharedElements: newShared,
        keyframes: syncToAllKeyframes(newShared, state.keyframes),
      };
    });
  },

  // Image element
  addImageElement: (imageSrc, originalWidth, originalHeight, customPosition) => {
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
    
    // Use custom position or center in frame
    const x = customPosition?.x ?? Math.max(0, (state.frameSize.width - width) / 2);
    const y = customPosition?.y ?? Math.max(0, (state.frameSize.height - height) / 2);
    
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
    
    set((state) => {
      const newShared = [...state.sharedElements, newElement];
      return {
        sharedElements: newShared,
        keyframes: syncToAllKeyframes(newShared, state.keyframes),
        selectedElementId: newElement.id,
        selectedElementIds: [newElement.id],
        currentTool: 'select',
      };
    });
  },

  // Group selected elements
  groupSelectedElements: () => {
    const state = get();
    if (state.selectedElementIds.length < 2) return;
    
    get().pushHistory();
    const groupId = `group-${Date.now()}`;
    
    // Find selected elements
    const selectedElements = state.sharedElements.filter(
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
    
    set((state) => {
      // Update children to have parentId
      const updatedElements = state.sharedElements.map(el => {
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
      const newShared = [groupElement, ...updatedElements];
      return {
        sharedElements: newShared,
        keyframes: syncToAllKeyframes(newShared, state.keyframes),
        selectedElementId: groupId,
        selectedElementIds: [groupId],
      };
    });
  },

  // Ungroup selected elements
  ungroupSelectedElements: () => {
    const state = get();
    if (state.selectedElementIds.length !== 1) return;
    
    const groupId = state.selectedElementIds[0];
    const groupElement = state.sharedElements.find(el => el.id === groupId);
    if (!groupElement) return;
    
    // Find children
    const children = state.sharedElements.filter(el => el.parentId === groupId);
    if (children.length === 0) return;
    
    get().pushHistory();
    
    set((state) => {
      // Remove group, update children positions
      const newShared = state.sharedElements
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
      return {
        sharedElements: newShared,
        keyframes: syncToAllKeyframes(newShared, state.keyframes),
        selectedElementIds: children.map(c => c.id),
        selectedElementId: children.length === 1 ? children[0].id : null,
      };
    });
  },

  // Enter group edit mode (double-click on group)
  enterGroupEditMode: (groupId: string) => {
    const state = get();
    if (!state.selectedKeyframeId) return;
    
    // Verify it's a valid group (has children)
    const children = state.sharedElements.filter(el => el.parentId === groupId);
    if (children.length === 0) return;
    
    set({
      editingGroupId: groupId,
      selectedElementIds: [],
      selectedElementId: null,
    });
  },

  // Exit group edit mode (click outside group)
  exitGroupEditMode: () => {
    const state = get();
    if (!state.editingGroupId) return;
    
    set({
      editingGroupId: null,
      selectedElementIds: [state.editingGroupId],
      selectedElementId: state.editingGroupId,
    });
  },

  // Resize group with proportional scaling of children
  resizeGroup: (groupId: string, newSize: Size, newPosition: Position) => {
    const state = get();
    if (!state.selectedKeyframeId) return;
    
    const groupElement = state.sharedElements.find(el => el.id === groupId);
    if (!groupElement) return;
    
    const children = state.sharedElements.filter(el => el.parentId === groupId);
    if (children.length === 0) return;
    
    // Calculate scale factors
    const scaleX = newSize.width / groupElement.size.width;
    const scaleY = newSize.height / groupElement.size.height;
    
    set((state) => {
      const newShared = state.sharedElements.map((el) => {
        if (el.id === groupId) {
          return { ...el, size: newSize, position: newPosition };
        }
        if (el.parentId === groupId) {
          return {
            ...el,
            position: {
              x: Math.round(el.position.x * scaleX),
              y: Math.round(el.position.y * scaleY),
            },
            size: {
              width: Math.round(el.size.width * scaleX),
              height: Math.round(el.size.height * scaleY),
            },
          };
        }
        return el;
      });
      return {
        sharedElements: newShared,
        keyframes: syncToAllKeyframes(newShared, state.keyframes),
      };
    });
  },

  // Align elements
  alignElements: (alignment) => {
    const state = get();
    if (state.selectedElementIds.length < 2) return;
    
    if (!state.selectedKeyframeId) return;
    
    const selected = state.sharedElements.filter(
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
    
    if (!state.selectedKeyframeId) return;
    
    const selected = state.sharedElements
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
      components: data.components,
      frameSize: data.frameSize,
      canvasBackground: data.canvasBackground || '#0d0d0e',
      interactions: data.interactions || [],
      variables: data.variables || [],
      conditionRules: data.conditionRules || [],
      sharedElements: data.sharedElements || get().sharedElements,
      displayStates: data.displayStates || get().displayStates,
      patches: data.patches || get().patches,
      patchConnections: data.patchConnections || get().patchConnections,
      componentsV2: data.componentsV2 || get().componentsV2,
      selectedKeyframeId: data.keyframes[0]?.id || '',
      selectedDisplayStateId: (data.displayStates || get().displayStates)[0]?.id || null,
      selectedElementId: null,
      selectedElementIds: [],
      history: [{ keyframes: data.keyframes, sharedElements: data.sharedElements || get().sharedElements, displayStates: data.displayStates || get().displayStates, patches: data.patches || get().patches, patchConnections: data.patchConnections || get().patchConnections, componentsV2: data.componentsV2 || get().componentsV2, description: '项目加载' }],
      historyIndex: 0,
    });
  },

  exportProject: () => {
    const s = get();
    return JSON.stringify({
      version: 1,
      keyframes: s.keyframes,
      transitions: s.transitions,
      components: s.components,
      sharedElements: s.sharedElements,
      displayStates: s.displayStates,
      patches: s.patches,
      patchConnections: s.patchConnections,
      componentsV2: s.componentsV2,
      variables: s.variables,
      conditionRules: s.conditionRules,
      frameSize: s.frameSize,
      canvasBackground: s.canvasBackground,
      deviceFrame: s.deviceFrame,
    }, null, 2);
  },

  // Copy style from selected element
  copyStyle: () => {
    const state = get();
    if (!state.selectedElementId) return;
    
    const element = state.sharedElements.find(el => el.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el) {
      get().updateElement(state.selectedElementId, { zIndex: (el.zIndex ?? 0) + 1 });
    }
  },

  // Send backward (decrease zIndex)
  sendBackward: () => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el) {
      get().updateElement(state.selectedElementId, { zIndex: (el.zIndex ?? 0) - 1 });
    }
  },

  bringToFront: () => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const maxZ = Math.max(...(state.sharedElements.map(e => e.zIndex ?? 0) || [0]));
    get().updateElement(state.selectedElementId, { zIndex: maxZ + 1 });
  },

  sendToBack: () => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const minZ = Math.min(...(state.sharedElements.map(e => e.zIndex ?? 0) || [0]));
    get().updateElement(state.selectedElementId, { zIndex: minZ - 1 });
  },

  // Align functions
  alignLeft: () => {
    const state = get();
    const ids = state.selectedElementIds;
    if (ids.length < 2) return;
    get().pushHistory();
    const els = state.sharedElements.filter(e => ids.includes(e.id)) || [];
    const minX = Math.min(...els.map(e => e.position.x));
    els.forEach(el => get().updateElement(el.id, { position: { ...el.position, x: minX } }));
  },

  alignCenterH: () => {
    const state = get();
    const ids = state.selectedElementIds;
    if (ids.length < 2) return;
    get().pushHistory();
    const els = state.sharedElements.filter(e => ids.includes(e.id)) || [];
    const centers = els.map(e => e.position.x + e.size.width / 2);
    const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
    els.forEach(el => get().updateElement(el.id, { 
      position: { ...el.position, x: avgCenter - el.size.width / 2 } 
    }));
  },

  alignRight: () => {
    const state = get();
    const ids = state.selectedElementIds;
    if (ids.length < 2) return;
    get().pushHistory();
    const els = state.sharedElements.filter(e => ids.includes(e.id)) || [];
    const maxRight = Math.max(...els.map(e => e.position.x + e.size.width));
    els.forEach(el => get().updateElement(el.id, { 
      position: { ...el.position, x: maxRight - el.size.width } 
    }));
  },

  alignTop: () => {
    const state = get();
    const ids = state.selectedElementIds;
    if (ids.length < 2) return;
    get().pushHistory();
    const els = state.sharedElements.filter(e => ids.includes(e.id)) || [];
    const minY = Math.min(...els.map(e => e.position.y));
    els.forEach(el => get().updateElement(el.id, { position: { ...el.position, y: minY } }));
  },

  alignCenterV: () => {
    const state = get();
    const ids = state.selectedElementIds;
    if (ids.length < 2) return;
    get().pushHistory();
    const els = state.sharedElements.filter(e => ids.includes(e.id)) || [];
    const centers = els.map(e => e.position.y + e.size.height / 2);
    const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
    els.forEach(el => get().updateElement(el.id, { 
      position: { ...el.position, y: avgCenter - el.size.height / 2 } 
    }));
  },

  alignBottom: () => {
    const state = get();
    const ids = state.selectedElementIds;
    if (ids.length < 2) return;
    get().pushHistory();
    const els = state.sharedElements.filter(e => ids.includes(e.id)) || [];
    const maxBottom = Math.max(...els.map(e => e.position.y + e.size.height));
    els.forEach(el => get().updateElement(el.id, { 
      position: { ...el.position, y: maxBottom - el.size.height } 
    }));
  },

  distributeH: () => {
    const state = get();
    const ids = state.selectedElementIds;
    if (ids.length < 3) return;
    get().pushHistory();
    const els = (state.sharedElements.filter(e => ids.includes(e.id)) || [])
      .sort((a, b) => a.position.x - b.position.x);
    const first = els[0], last = els[els.length - 1];
    const totalWidth = (last.position.x + last.size.width) - first.position.x;
    const gap = (totalWidth - els.reduce((s, e) => s + e.size.width, 0)) / (els.length - 1);
    let x = first.position.x;
    els.forEach(el => {
      get().updateElement(el.id, { position: { ...el.position, x } });
      x += el.size.width + gap;
    });
  },

  distributeV: () => {
    const state = get();
    const ids = state.selectedElementIds;
    if (ids.length < 3) return;
    get().pushHistory();
    const els = (state.sharedElements.filter(e => ids.includes(e.id)) || [])
      .sort((a, b) => a.position.y - b.position.y);
    const first = els[0], last = els[els.length - 1];
    const totalHeight = (last.position.y + last.size.height) - first.position.y;
    const gap = (totalHeight - els.reduce((s, e) => s + e.size.height, 0)) / (els.length - 1);
    let y = first.position.y;
    els.forEach(el => {
      get().updateElement(el.id, { position: { ...el.position, y } });
      y += el.size.height + gap;
    });
  },

  flipHorizontal: () => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el) {
      get().updateElement(state.selectedElementId, { locked: !el.locked });
    }
  },

  toggleVisibility: () => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el) {
      get().updateElement(state.selectedElementId, { visible: el.visible === false ? true : false });
    }
  },

  nudgeElement: (dx: number, dy: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const first = state.sharedElements.find(e => e.id === state.selectedElementIds[0]);
    if (!first) return;
    state.selectedElementIds.slice(1).forEach(id => {
      get().updateElement(id, { size: { width: first.size.width, height: state.sharedElements.find(e => e.id === id)?.size.height || 0 } });
    });
  },

  matchHeight: () => {
    const state = get();
    if (state.selectedElementIds.length < 2) return;
    get().pushHistory();
    const first = state.sharedElements.find(e => e.id === state.selectedElementIds[0]);
    if (!first) return;
    state.selectedElementIds.slice(1).forEach(id => {
      get().updateElement(id, { size: { width: state.sharedElements.find(e => e.id === id)?.size.width || 0, height: first.size.height } });
    });
  },

  spaceEvenlyH: () => {
    const state = get();
    if (state.selectedElementIds.length < 3) return;
    get().pushHistory();
    const els = state.selectedElementIds.map(id => state.sharedElements.find(e => e.id === id)).filter(Boolean) as KeyElement[];
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
    const els = state.selectedElementIds.map(id => state.sharedElements.find(e => e.id === id)).filter(Boolean) as KeyElement[];
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
      keyElements: state.sharedElements,
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
    const emptyElements: KeyElement[] = [];
    set((s) => ({
      sharedElements: emptyElements,
      keyframes: syncToAllKeyframes(emptyElements, s.keyframes),
      selectedElementIds: [],
      selectedElementId: null,
    }));
  },

  resetProject: () => {
    const defaultKfId = `kf-${Date.now()}`;
    const emptyElements: KeyElement[] = [];
    set({
      sharedElements: emptyElements,
      keyframes: [{
        id: defaultKfId,
        name: 'Frame 1',
        summary: '',
        keyElements: emptyElements,
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

  setCornerRadius: (radius: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
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
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, fontFamily: family } 
      });
    }
  },

  setTextDecoration: (decoration: 'none' | 'underline' | 'line-through') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, textDecoration: decoration } 
      });
    }
  },

  setFontStyle: (style: 'normal' | 'italic') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, fontStyle: style } 
      });
    }
  },

  setTextTransform: (transform: 'none' | 'uppercase' | 'lowercase' | 'capitalize') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, textTransform: transform } 
      });
    }
  },

  setVisibility: (visible: boolean) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, visibility: visible ? 'visible' : 'hidden' } 
      });
    }
  },

  setCursor: (cursor: string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, cursor: cursor as 'default' | 'pointer' | 'grab' | 'text' } 
      });
    }
  },

  setZIndex: (zIndex: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, zIndex } 
      });
    }
  },

  setAspectRatio: (ratio: string | null) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, aspectRatio: ratio || undefined } 
      });
    }
  },

  setOverflow: (overflow: 'visible' | 'hidden' | 'scroll') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, overflow } 
      });
    }
  },

  setPointerEvents: (enabled: boolean) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, pointerEvents: enabled ? 'auto' : 'none' } 
      });
    }
  },

  setTransformOrigin: (origin: string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, transformOrigin: origin } 
      });
    }
  },

  setDropShadow: (x: number, y: number, blur: number, color: string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { 
          ...el.style, 
          dropShadowX: x,
          dropShadowY: y,
          dropShadowBlur: blur,
          dropShadowColor: color
        } 
      });
    }
  },

  setTextShadow: (x: number, y: number, blur: number, color: string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, textShadow: `${x}px ${y}px ${blur}px ${color}` } 
      });
    }
  },

  setObjectFit: (fit: 'fill' | 'contain' | 'cover' | 'none') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, objectFit: fit } 
      });
    }
  },

  setFlexLayout: (direction: 'row' | 'column', gap?: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { 
          ...el.style, 
          flexDirection: direction,
          ...(gap !== undefined && { gap })
        } 
      });
    }
  },

  setJustifyContent: (justify: 'flex-start' | 'center' | 'flex-end' | 'space-between') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, justifyContent: justify } 
      });
    }
  },

  setAlignItems: (align: 'flex-start' | 'center' | 'flex-end' | 'stretch') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, alignItems: align } 
      });
    }
  },

  setPadding: (padding) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      const p = typeof padding === 'number' ? padding : padding;
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, padding: typeof p === 'number' ? p : undefined } 
      });
    }
  },

  setIndividualCornerRadius: (tl: number, tr: number, br: number, bl: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { 
          ...el.style, 
          borderRadiusTL: tl,
          borderRadiusTR: tr,
          borderRadiusBR: br,
          borderRadiusBL: bl
        } 
      });
    }
  },

  setStrokeOpacity: (opacity: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, strokeOpacity: opacity } 
      });
    }
  },

  setFillOpacity: (opacity: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, fillOpacity: opacity } 
      });
    }
  },

  setStrokeDasharray: (dasharray: string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, strokeDasharray: dasharray } 
      });
    }
  },

  setHueRotate: (degrees: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, hueRotate: degrees } 
      });
    }
  },

  setInvert: (amount: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, invert: amount } 
      });
    }
  },

  setSepia: (amount: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, sepia: amount } 
      });
    }
  },

  setBrightness: (amount: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, brightness: amount } 
      });
    }
  },

  setContrast: (amount: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, contrast: amount } 
      });
    }
  },

  setSaturate: (amount: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, saturate: amount } 
      });
    }
  },

  setGrayscale: (amount: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, grayscale: amount } 
      });
    }
  },

  setFlip: (flipX: boolean, flipY: boolean) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, flipX, flipY } 
      });
    }
  },

  setVerticalAlign: (align: 'top' | 'middle' | 'bottom') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, verticalAlign: align } 
      });
    }
  },

  setWhiteSpace: (ws: 'nowrap' | 'normal' | 'pre-wrap') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, whiteSpace: ws } 
      });
    }
  },

  setWordBreak: (wb: 'normal' | 'break-all' | 'break-word') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, wordBreak: wb } 
      });
    }
  },

  setTextOverflow: (overflow: 'clip' | 'ellipsis') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, textOverflow: overflow } 
      });
    }
  },

  setMinSize: (minWidth?: number, minHeight?: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { 
          ...el.style, 
          ...(minWidth !== undefined && { minWidth }),
          ...(minHeight !== undefined && { minHeight })
        } 
      });
    }
  },

  setMaxSize: (maxWidth?: number, maxHeight?: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { 
          ...el.style, 
          ...(maxWidth !== undefined && { maxWidth }),
          ...(maxHeight !== undefined && { maxHeight })
        } 
      });
    }
  },

  setBoxSizing: (sizing: 'content-box' | 'border-box') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, boxSizing: sizing } 
      });
    }
  },

  setIsolation: (isolation: 'auto' | 'isolate') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, isolation } 
      });
    }
  },

  setBackfaceVisibility: (visibility: 'visible' | 'hidden') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, backfaceVisibility: visibility } 
      });
    }
  },

  setWillChange: (property: string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, willChange: property } 
      });
    }
  },

  setUserSelect: (select: 'none' | 'auto' | 'text' | 'all') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, userSelect: select } 
      });
    }
  },

  setTouchAction: (action: 'auto' | 'none' | 'pan-x' | 'pan-y' | 'manipulation') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, touchAction: action } 
      });
    }
  },

  setScrollBehavior: (behavior: 'auto' | 'smooth') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, scrollBehavior: behavior } 
      });
    }
  },

  setScrollSnapType: (type: 'none' | 'x mandatory' | 'y mandatory' | 'both mandatory') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, scrollSnapType: type } 
      });
    }
  },

  setScrollSnapAlign: (align: 'none' | 'start' | 'center' | 'end') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, scrollSnapAlign: align } 
      });
    }
  },

  setGap: (gap: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, gap } 
      });
    }
  },

  setFlexWrap: (wrap: 'nowrap' | 'wrap' | 'wrap-reverse') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, flexWrap: wrap } 
      });
    }
  },

  setFlexGrow: (grow: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, flexGrow: grow } 
      });
    }
  },

  setFlexShrink: (shrink: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, flexShrink: shrink } 
      });
    }
  },

  setFlexBasis: (basis: string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, flexBasis: basis } 
      });
    }
  },

  setAlignSelf: (align: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, alignSelf: align } 
      });
    }
  },

  setOrder: (order: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, order } 
      });
    }
  },

  setGridTemplate: (columns: string, rows: string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { 
          ...el.style, 
          gridTemplateColumns: columns,
          gridTemplateRows: rows 
        } 
      });
    }
  },

  setGridArea: (area: string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, gridArea: area } 
      });
    }
  },

  setPlaceItems: (place: 'start' | 'center' | 'end' | 'stretch') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, placeItems: place } 
      });
    }
  },

  setPlaceContent: (place: 'start' | 'center' | 'end' | 'stretch' | 'space-between' | 'space-around') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, placeContent: place } 
      });
    }
  },

  setAlignContent: (align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'space-between' | 'space-around') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, alignContent: align } 
      });
    }
  },

  setCssPosition: (position: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, position } 
      });
    }
  },

  setInset: (top?: number, right?: number, bottom?: number, left?: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { 
          ...el.style,
          ...(top !== undefined && { top }),
          ...(right !== undefined && { right }),
          ...(bottom !== undefined && { bottom }),
          ...(left !== undefined && { left })
        } 
      });
    }
  },

  setDisplay: (display: 'block' | 'inline' | 'flex' | 'grid' | 'none' | 'inline-block') => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, display } 
      });
    }
  },

  setMargin: (margin: number | string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, margin } 
      });
    }
  },

  setIndividualMargin: (top?: number, right?: number, bottom?: number, left?: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { 
          ...el.style,
          ...(top !== undefined && { marginTop: top }),
          ...(right !== undefined && { marginRight: right }),
          ...(bottom !== undefined && { marginBottom: bottom }),
          ...(left !== undefined && { marginLeft: left })
        } 
      });
    }
  },

  setIndividualPadding: (top?: number, right?: number, bottom?: number, left?: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { 
          ...el.style,
          ...(top !== undefined && { paddingTop: top }),
          ...(right !== undefined && { paddingRight: right }),
          ...(bottom !== undefined && { paddingBottom: bottom }),
          ...(left !== undefined && { paddingLeft: left })
        } 
      });
    }
  },

  setOutline: (width: number, style: 'none' | 'solid' | 'dashed' | 'dotted' | 'double', color: string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { 
          ...el.style,
          outlineWidth: width,
          outlineStyle: style,
          outlineColor: color
        } 
      });
    }
  },

  setOutlineOffset: (offset: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { ...el.style, outlineOffset: offset } 
      });
    }
  },

  setTransition: (property: string, duration: number, easing: string) => {
    const state = get();
    if (!state.selectedElementId) return;
    get().pushHistory();
    const el = state.sharedElements.find(e => e.id === state.selectedElementId);
    if (el && el.style) {
      get().updateElement(state.selectedElementId, { 
        style: { 
          ...el.style,
          transitionProperty: property,
          transitionDuration: duration,
          transitionTimingFunction: easing
        } 
      });
    }
  },

  // Variable binding actions (cross-slice: depends on sharedElements + syncToAllKeyframes)
  addVariableBinding: (elementId: string, binding: VariableBinding) => set((state) => {
    const newShared = state.sharedElements.map(el =>
      el.id === elementId
        ? { ...el, variableBindings: [...(el.variableBindings || []), binding] }
        : el
    );
    return {
      sharedElements: newShared,
      keyframes: syncToAllKeyframes(newShared, state.keyframes),
    };
  }),

  removeVariableBinding: (elementId: string, variableId: string, property: string) => set((state) => {
    const newShared = state.sharedElements.map(el =>
      el.id === elementId
        ? {
            ...el,
            variableBindings: (el.variableBindings || []).filter(
              b => !(b.variableId === variableId && b.property === property)
            ),
          }
        : el
    );
    return {
      sharedElements: newShared,
      keyframes: syncToAllKeyframes(newShared, state.keyframes),
    };
  }),

  // Import actions
  importKeyframes: (keyframes: Keyframe[]) => set(() => ({
    keyframes,
    selectedKeyframeId: keyframes[0]?.id || '',
  })),

  importTransitions: (transitions: Transition[]) => set(() => ({
    transitions,
  })),

  setTransitionDelay: (delay: number) => set((state) => {
    const selectedId = state.selectedTransitionId;
    if (!selectedId) return state;
    return {
      transitions: state.transitions.map(t =>
        t.id === selectedId ? { ...t, delay } : t
      ),
    };
  }),

  // Auto Layout actions
  toggleAutoLayout: (elementId?: string) => {
    const state = get();
    const targetId = elementId || state.selectedElementId;
    if (!targetId) return;
    
    get().pushHistory();
    const element = state.sharedElements.find(el => el.id === targetId);
    if (!element) return;
    
    const isEnabled = element.autoLayout?.enabled ?? false;
    const newAutoLayout: AutoLayoutConfig = isEnabled 
      ? { ...DEFAULT_AUTO_LAYOUT, enabled: false }
      : { ...DEFAULT_AUTO_LAYOUT, enabled: true };
    
    get().updateElement(targetId, { autoLayout: newAutoLayout });
    
    // Apply auto layout if enabling
    if (!isEnabled) {
      get().applyAutoLayout(targetId);
    }
  },

  setAutoLayoutDirection: (direction: AutoLayoutDirection) => {
    const state = get();
    if (!state.selectedElementId) return;
    
    get().pushHistory();
    const element = state.sharedElements.find(el => el.id === state.selectedElementId);
    if (!element?.autoLayout?.enabled) return;
    
    get().updateElement(state.selectedElementId, {
      autoLayout: { ...element.autoLayout, direction }
    });
    get().applyAutoLayout(state.selectedElementId);
  },

  setAutoLayoutGap: (gap: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    
    get().pushHistory();
    const element = state.sharedElements.find(el => el.id === state.selectedElementId);
    if (!element?.autoLayout?.enabled) return;
    
    get().updateElement(state.selectedElementId, {
      autoLayout: { ...element.autoLayout, gap }
    });
    get().applyAutoLayout(state.selectedElementId);
  },

  setAutoLayoutPadding: (top: number, right: number, bottom: number, left: number) => {
    const state = get();
    if (!state.selectedElementId) return;
    
    get().pushHistory();
    const element = state.sharedElements.find(el => el.id === state.selectedElementId);
    if (!element?.autoLayout?.enabled) return;
    
    get().updateElement(state.selectedElementId, {
      autoLayout: { 
        ...element.autoLayout, 
        paddingTop: top,
        paddingRight: right,
        paddingBottom: bottom,
        paddingLeft: left
      }
    });
    get().applyAutoLayout(state.selectedElementId);
  },

  setAutoLayoutAlign: (align: AutoLayoutAlign) => {
    const state = get();
    if (!state.selectedElementId) return;
    
    get().pushHistory();
    const element = state.sharedElements.find(el => el.id === state.selectedElementId);
    if (!element?.autoLayout?.enabled) return;
    
    get().updateElement(state.selectedElementId, {
      autoLayout: { ...element.autoLayout, alignItems: align }
    });
    get().applyAutoLayout(state.selectedElementId);
  },

  setAutoLayoutJustify: (justify: AutoLayoutJustify) => {
    const state = get();
    if (!state.selectedElementId) return;
    
    get().pushHistory();
    const element = state.sharedElements.find(el => el.id === state.selectedElementId);
    if (!element?.autoLayout?.enabled) return;
    
    get().updateElement(state.selectedElementId, {
      autoLayout: { ...element.autoLayout, justifyContent: justify }
    });
    get().applyAutoLayout(state.selectedElementId);
  },

  setAutoLayoutWrap: (wrap: boolean) => {
    const state = get();
    if (!state.selectedElementId) return;
    
    get().pushHistory();
    const element = state.sharedElements.find(el => el.id === state.selectedElementId);
    if (!element?.autoLayout?.enabled) return;
    
    get().updateElement(state.selectedElementId, {
      autoLayout: { ...element.autoLayout, wrap }
    });
    get().applyAutoLayout(state.selectedElementId);
  },

  updateAutoLayout: (config: Partial<AutoLayoutConfig>) => {
    const state = get();
    if (!state.selectedElementId) return;
    
    get().pushHistory();
    const element = state.sharedElements.find(el => el.id === state.selectedElementId);
    if (!element?.autoLayout) return;
    
    get().updateElement(state.selectedElementId, {
      autoLayout: { ...element.autoLayout, ...config }
    });
    if (element.autoLayout.enabled) {
      get().applyAutoLayout(state.selectedElementId);
    }
  },

  setChildSizingMode: (elementId: string, widthMode: SizingMode, heightMode: SizingMode) => {
    const state = get();
    get().pushHistory();
    
    const element = state.sharedElements.find(el => el.id === elementId);
    if (!element) return;
    
    const layoutChild: ChildLayoutConfig = {
      widthMode,
      heightMode,
    };
    
    get().updateElement(elementId, { layoutChild });
    
    // Re-apply parent's auto layout if element has a parent
    if (element.parentId) {
      get().applyAutoLayout(element.parentId);
    }
  },

  applyAutoLayout: (parentId: string) => {
    const state = get();
    if (!state.selectedKeyframeId) return;
    
    const parent = state.sharedElements.find(el => el.id === parentId);
    if (!parent?.autoLayout?.enabled) return;
    
    const { 
      direction, gap, paddingTop, paddingRight, paddingBottom, paddingLeft, 
      alignItems, justifyContent,
      primaryAxisSizing = 'fixed',
      counterAxisSizing = 'fixed'
    } = parent.autoLayout;
    
    // Find children
    const children = state.sharedElements.filter(el => el.parentId === parentId);
    if (children.length === 0) return;
    
    const isHorizontal = direction === 'horizontal';
    
    // ========== HUG CONTENTS LOGIC ==========
    // Calculate children's total size for hug mode
    const totalChildrenMainSize = children.reduce((sum, child) => {
      return sum + (isHorizontal ? child.size.width : child.size.height);
    }, 0);
    const totalGaps = (children.length - 1) * gap;
    
    // Find max cross-axis size among children
    const maxChildCrossSize = Math.max(...children.map(child => 
      isHorizontal ? child.size.height : child.size.width
    ));
    
    // Calculate new parent size based on sizing modes
    let newParentWidth = parent.size.width;
    let newParentHeight = parent.size.height;
    
    if (isHorizontal) {
      // Horizontal layout: primary axis = width, counter axis = height
      if (primaryAxisSizing === 'hug') {
        newParentWidth = totalChildrenMainSize + totalGaps + paddingLeft + paddingRight;
      }
      if (counterAxisSizing === 'hug') {
        newParentHeight = maxChildCrossSize + paddingTop + paddingBottom;
      }
    } else {
      // Vertical layout: primary axis = height, counter axis = width
      if (primaryAxisSizing === 'hug') {
        newParentHeight = totalChildrenMainSize + totalGaps + paddingTop + paddingBottom;
      }
      if (counterAxisSizing === 'hug') {
        newParentWidth = maxChildCrossSize + paddingLeft + paddingRight;
      }
    }
    
    // Update parent size if changed (hug mode)
    if (newParentWidth !== parent.size.width || newParentHeight !== parent.size.height) {
      set((state) => {
        const newShared = state.sharedElements.map(el => {
          if (el.id !== parentId) return el;
          return { ...el, size: { width: newParentWidth, height: newParentHeight } };
        });
        return {
          sharedElements: newShared,
          keyframes: syncToAllKeyframes(newShared, state.keyframes),
        };
      });
    }
    
    // Use the (possibly updated) parent size for content area
    const contentWidth = newParentWidth - paddingLeft - paddingRight;
    const contentHeight = newParentHeight - paddingTop - paddingBottom;
    
    // Calculate starting position based on justifyContent
    let mainAxisOffset = isHorizontal ? paddingLeft : paddingTop;
    const availableSpace = (isHorizontal ? contentWidth : contentHeight) - totalChildrenMainSize - totalGaps;
    
    if (justifyContent === 'center') {
      mainAxisOffset += availableSpace / 2;
    } else if (justifyContent === 'end') {
      mainAxisOffset += availableSpace;
    } else if (justifyContent === 'space-between' && children.length > 1) {
      // gap will be recalculated
    }
    
    const spaceBetweenGap = justifyContent === 'space-between' && children.length > 1
      ? availableSpace / (children.length - 1)
      : 0;
    
    // Position each child
    children.forEach((child) => {
      const childLayoutConfig = child.layoutChild || { widthMode: 'fixed', heightMode: 'fixed' };
      
      // Calculate child size based on sizing mode
      let childWidth = child.size.width;
      let childHeight = child.size.height;
      
      if (childLayoutConfig.widthMode === 'fill') {
        childWidth = isHorizontal 
          ? (contentWidth - totalGaps) / children.length 
          : contentWidth;
      }
      if (childLayoutConfig.heightMode === 'fill') {
        childHeight = isHorizontal 
          ? contentHeight 
          : (contentHeight - totalGaps) / children.length;
      }
      
      // Calculate cross-axis position based on alignItems
      let crossAxisOffset: number;
      const crossAxisSize = isHorizontal ? contentHeight : contentWidth;
      const childCrossSize = isHorizontal ? childHeight : childWidth;
      
      switch (alignItems) {
        case 'center':
          crossAxisOffset = (crossAxisSize - childCrossSize) / 2;
          break;
        case 'end':
          crossAxisOffset = crossAxisSize - childCrossSize;
          break;
        case 'stretch':
          crossAxisOffset = 0;
          if (isHorizontal) {
            childHeight = contentHeight;
          } else {
            childWidth = contentWidth;
          }
          break;
        default: // 'start'
          crossAxisOffset = 0;
      }
      
      // Calculate position
      const x = isHorizontal 
        ? mainAxisOffset 
        : paddingLeft + crossAxisOffset;
      const y = isHorizontal 
        ? paddingTop + crossAxisOffset 
        : mainAxisOffset;
      
      // Update child
      set((state) => {
        const newShared = state.sharedElements.map(el => {
          if (el.id !== child.id) return el;
          return {
            ...el,
            position: { x, y },
            size: { width: childWidth, height: childHeight },
          };
        });
        return {
          sharedElements: newShared,
          keyframes: syncToAllKeyframes(newShared, state.keyframes),
        };
      });
      
      // Update main axis offset for next child
      const actualGap = justifyContent === 'space-between' ? spaceBetweenGap : gap;
      mainAxisOffset += (isHorizontal ? childWidth : childHeight) + actualGap;
    });
  },

  // Boolean operations
  booleanUnion: () => {
    const state = get();
    if (state.selectedElementIds.length < 2) return;
    
    if (!state.selectedKeyframeId) return;
    
    const selectedElements = state.selectedElementIds
      .map(id => state.sharedElements.find(el => el.id === id))
      .filter((el): el is KeyElement => el !== undefined);
    
    if (!canPerformBooleanOperation(selectedElements)) return;
    
    const result = performBooleanOperation('union', selectedElements);
    if (!result) return;
    
    get().pushHistory();
    
    set((s) => {
      const newShared = [
        ...s.sharedElements.filter(el => !s.selectedElementIds.includes(el.id)),
        result,
      ];
      return {
        sharedElements: newShared,
        keyframes: syncToAllKeyframes(newShared, s.keyframes),
        selectedElementIds: [result.id],
        selectedElementId: result.id,
      };
    });
  },

  booleanSubtract: () => {
    const state = get();
    if (state.selectedElementIds.length < 2) return;
    
    if (!state.selectedKeyframeId) return;
    
    const selectedElements = state.selectedElementIds
      .map(id => state.sharedElements.find(el => el.id === id))
      .filter((el): el is KeyElement => el !== undefined);
    
    if (!canPerformBooleanOperation(selectedElements)) return;
    
    const result = performBooleanOperation('subtract', selectedElements);
    if (!result) return;
    
    get().pushHistory();
    
    set((s) => {
      const newShared = [
        ...s.sharedElements.filter(el => !s.selectedElementIds.includes(el.id)),
        result,
      ];
      return {
        sharedElements: newShared,
        keyframes: syncToAllKeyframes(newShared, s.keyframes),
        selectedElementIds: [result.id],
        selectedElementId: result.id,
      };
    });
  },

  booleanIntersect: () => {
    const state = get();
    if (state.selectedElementIds.length < 2) return;
    
    if (!state.selectedKeyframeId) return;
    
    const selectedElements = state.selectedElementIds
      .map(id => state.sharedElements.find(el => el.id === id))
      .filter((el): el is KeyElement => el !== undefined);
    
    if (!canPerformBooleanOperation(selectedElements)) return;
    
    const result = performBooleanOperation('intersect', selectedElements);
    if (!result) return;
    
    get().pushHistory();
    
    set((s) => {
      const newShared = [
        ...s.sharedElements.filter(el => !s.selectedElementIds.includes(el.id)),
        result,
      ];
      return {
        sharedElements: newShared,
        keyframes: syncToAllKeyframes(newShared, s.keyframes),
        selectedElementIds: [result.id],
        selectedElementId: result.id,
      };
    });
  },

  booleanExclude: () => {
    const state = get();
    if (state.selectedElementIds.length < 2) return;
    
    if (!state.selectedKeyframeId) return;
    
    const selectedElements = state.selectedElementIds
      .map(id => state.sharedElements.find(el => el.id === id))
      .filter((el): el is KeyElement => el !== undefined);
    
    if (!canPerformBooleanOperation(selectedElements)) return;
    
    const result = performBooleanOperation('exclude', selectedElements);
    if (!result) return;
    
    get().pushHistory();
    
    set((s) => {
      const newShared = [
        ...s.sharedElements.filter(el => !s.selectedElementIds.includes(el.id)),
        result,
      ];
      return {
        sharedElements: newShared,
        keyframes: syncToAllKeyframes(newShared, s.keyframes),
        selectedElementIds: [result.id],
        selectedElementId: result.id,
      };
    });
  },

  // Patch editor actions
  applySugar: (elementId: string, presetId: string) => {
    const preset = SUGAR_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const state = get();
    const element = state.sharedElements.find((e) => e.id === elementId);
    if (!element) return;
    const result: SugarResult = preset.create(elementId, element.name || 'Element');

    // Add display states (use preset's IDs directly so Patch references match)
    // Also create matching keyframes + apply layerOverrides
    set((s) => {
      let newDisplayStates = s.displayStates;
      let newKeyframes = s.keyframes;

      if (result.displayStates) {
        // Merge overrides into display states
        const dsWithOverrides = result.displayStates.map((ds) => {
          const overridesForDs = result.overrides?.[ds.id];
          if (!overridesForDs) return ds;
          const layerOverrides = Object.entries(overridesForDs).map(
            ([elId, props]) => ({
              layerId: elId,
              properties: props,
              isKey: true,
            })
          );
          return { ...ds, layerOverrides };
        });
        newDisplayStates = [...s.displayStates, ...dsWithOverrides];
        newKeyframes = [
          ...s.keyframes,
          ...dsWithOverrides.map((ds) => ({
            id: `kf-${ds.id}`,
            name: ds.name,
            summary: `Sugar: ${ds.name}`,
            displayStateId: ds.id,
            keyElements: s.sharedElements,
          })),
        ];
      }

      // Add sugar-created elements to sharedElements
      const newSharedElements = result.elements
        ? [...s.sharedElements, ...result.elements]
        : s.sharedElements;

      return {
        sharedElements: newSharedElements,
        displayStates: newDisplayStates,
        keyframes: newKeyframes,
        patches: [...s.patches, ...result.patches],
        patchConnections: [...s.patchConnections, ...result.connections],
      };
    });

    get().pushHistory(`Sugar: ${preset.name}`);
  },

  // === DisplayState actions (PRD v2 - shared layer tree) ===

  addDisplayState: (name: string) => set((state) => {
    const newId = `ds-${Date.now()}`;
    const newDS: DisplayState = { id: newId, name, layerOverrides: [] };
    return {
      displayStates: [...state.displayStates, newDS],
      selectedDisplayStateId: newId,
    };
  }),

  removeDisplayState: (id: string) => set((state) => {
    if (state.displayStates.length <= 1) return state;
    const next = state.displayStates.filter((ds) => ds.id !== id);
    return {
      displayStates: next,
      selectedDisplayStateId: state.selectedDisplayStateId === id
        ? next[0].id
        : state.selectedDisplayStateId,
    };
  }),

  renameDisplayState: (id: string, name: string) => set((state) => ({
    displayStates: state.displayStates.map((ds) =>
      ds.id === id ? { ...ds, name } : ds
    ),
  })),

  setSelectedDisplayStateId: (id: string | null) => set({ selectedDisplayStateId: id }),

  setLayerOverride: (displayStateId, layerId, properties, isKey) => set((state) => ({
    displayStates: state.displayStates.map((ds) => {
      if (ds.id !== displayStateId) return ds;
      const existing = ds.layerOverrides.find((o) => o.layerId === layerId);
      if (existing) {
        return {
          ...ds,
          layerOverrides: ds.layerOverrides.map((o) =>
            o.layerId === layerId
              ? { ...o, properties: { ...o.properties, ...properties }, isKey }
              : o
          ),
        };
      }
      return {
        ...ds,
        layerOverrides: [...ds.layerOverrides, { layerId, properties, isKey }],
      };
    }),
  })),

  removeLayerOverride: (displayStateId, layerId) => set((state) => ({
    displayStates: state.displayStates.map((ds) =>
      ds.id === displayStateId
        ? { ...ds, layerOverrides: ds.layerOverrides.filter((o) => o.layerId !== layerId) }
        : ds
    ),
  })),

  toggleKeyProperty: (displayStateId, layerId, property) => set((state) => ({
    displayStates: state.displayStates.map((ds) => {
      if (ds.id !== displayStateId) return ds;
      const existingOverride = ds.layerOverrides.find((o) => o.layerId === layerId);
      if (existingOverride) {
        // Toggle property in keyProperties array
        const currentKeys = existingOverride.keyProperties || [];
        const hasKey = currentKeys.includes(property);
        const newKeys = hasKey
          ? currentKeys.filter((k) => k !== property)
          : [...currentKeys, property];
        return {
          ...ds,
          layerOverrides: ds.layerOverrides.map((o) =>
            o.layerId === layerId
              ? { ...o, keyProperties: newKeys, isKey: newKeys.length > 0 }
              : o
          ),
        };
      }
      // No override yet — create one with this property marked as key
      return {
        ...ds,
        layerOverrides: [
          ...ds.layerOverrides,
          { layerId, properties: {}, isKey: true, keyProperties: [property] },
        ],
      };
    }),
  })),

  // ── Component V2 actions ──────────────────────────────────────────

  createComponentV2: (name) => set((state) => {
    const id = `compv2-${Date.now()}`;
    const defaultDisplayState: DisplayState = {
      id: `ds-${Date.now()}`,
      name: 'Default',
      layerOverrides: [],
    };
    const newComponent: ComponentV2 = {
      id,
      name,
      layers: [],
      displayStates: [defaultDisplayState],
      variables: [],
      rules: [],
      createdAt: Date.now(),
    };
    return { componentsV2: [...state.componentsV2, newComponent] };
  }),

  deleteComponentV2: (id) => set((state) => ({
    componentsV2: state.componentsV2.filter((c) => c.id !== id),
  })),

  updateComponentV2: (id, updates) => set((state) => ({
    componentsV2: state.componentsV2.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    ),
  })),

  addComponentDisplayState: (componentId, name) => set((state) => ({
    componentsV2: state.componentsV2.map((c) => {
      if (c.id !== componentId) return c;
      const newState: DisplayState = {
        id: `ds-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        layerOverrides: [],
      };
      return { ...c, displayStates: [...c.displayStates, newState] };
    }),
  })),

  removeComponentDisplayState: (componentId, stateId) => set((state) => ({
    componentsV2: state.componentsV2.map((c) => {
      if (c.id !== componentId) return c;
      return {
        ...c,
        displayStates: c.displayStates.filter((ds) => ds.id !== stateId),
      };
    }),
  })),

  // Component Patch management
  addComponentPatch: (componentId: string, patch: Patch) => set((state) => ({
    componentsV2: state.componentsV2.map((c) =>
      c.id === componentId ? { ...c, patches: [...(c.patches || []), patch] } : c
    ),
  })),

  removeComponentPatch: (componentId: string, patchId: string) => set((state) => ({
    componentsV2: state.componentsV2.map((c) =>
      c.id === componentId ? {
        ...c,
        patches: (c.patches || []).filter(p => p.id !== patchId),
        connections: (c.connections || []).filter(cn =>
          cn.fromPatchId !== patchId && cn.toPatchId !== patchId
        ),
      } : c
    ),
  })),

  addComponentConnection: (componentId: string, conn: PatchConnection) => set((state) => ({
    componentsV2: state.componentsV2.map((c) =>
      c.id === componentId ? { ...c, connections: [...(c.connections || []), conn] } : c
    ),
  })),

  removeComponentConnection: (componentId: string, connId: string) => set((state) => ({
    componentsV2: state.componentsV2.map((c) =>
      c.id === componentId ? {
        ...c,
        connections: (c.connections || []).filter(cn => cn.id !== connId),
      } : c
    ),
  })),

}));

// Bidirectional auto-sync between sharedElements and keyframes.keyElements
// Direction 1: sharedElements changed → sync to all keyframes
// Direction 2: keyframes.keyElements changed (legacy actions) → sync back to sharedElements
let _syncing = false;
useEditorStore.subscribe((state) => {
  if (_syncing) return;
  _syncing = true;
  try {
    // Ensure all keyframes.keyElements point to sharedElements
    const needsSync = state.keyframes.some(kf => kf.keyElements !== state.sharedElements);
    if (needsSync) {
      useEditorStore.setState({
        keyframes: syncToAllKeyframes(state.sharedElements, state.keyframes),
      });
    }
  } finally {
    _syncing = false;
  }
});
