import type { Keyframe, Transition, KeyElement } from '../types';

// Shared elements — all keyframes reference the same layer tree
const cardElement: KeyElement = {
  id: "el-card",
  name: "Card",
  category: "component",
  isKeyElement: true,
  attributes: [],
  position: { x: 100, y: 80 },
  size: { width: 200, height: 120 },
  shapeType: "rectangle",
  style: {
    fill: "#3b82f6",
    fillOpacity: 1,
    stroke: "",
    strokeWidth: 0,
    strokeOpacity: 1,
    borderRadius: 12,
  },
};

const buttonElement: KeyElement = {
  id: "el-button",
  name: "Button",
  category: "component",
  isKeyElement: true,
  attributes: [],
  position: { x: 130, y: 160 },
  size: { width: 140, height: 32 },
  shapeType: "rectangle",
  style: {
    fill: "#1d4ed8",
    fillOpacity: 1,
    stroke: "",
    strokeWidth: 0,
    strokeOpacity: 1,
    borderRadius: 6,
  },
};

// Single shared elements array — all keyframes point to this
export const initialSharedElements: KeyElement[] = [cardElement, buttonElement];

export const initialKeyframes: Keyframe[] = [
  {
    id: "kf-idle",
    name: "Idle",
    summary: "Default state",
    functionalState: "idle",
    displayStateId: "ds-default",
    keyElements: initialSharedElements,
  },
  {
    id: "kf-active",
    name: "Active", 
    summary: "Active state",
    functionalState: "loading",
    displayStateId: "ds-active",
    keyElements: initialSharedElements,
  },
  {
    id: "kf-complete",
    name: "Complete",
    summary: "Complete state",
    functionalState: "success",
    keyElements: initialSharedElements,
  },
];

export const initialTransitions: Transition[] = [
  {
    id: "tr-1",
    from: "kf-idle",
    to: "kf-active",
    trigger: "tap",
    duration: 300,
    delay: 0,
    curve: "ease-out",
  },
];
