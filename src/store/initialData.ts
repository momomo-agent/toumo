import type { Keyframe, Transition, KeyElement } from '../types';

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

// Active state - card expanded, button highlighted
const cardElementActive: KeyElement = {
  ...cardElement,
  id: "el-card-active",
  position: { x: 80, y: 60 },
  size: { width: 240, height: 160 },
  style: {
    ...cardElement.style!,
    fill: "#22c55e",
  },
};

const buttonElementActive: KeyElement = {
  ...buttonElement,
  id: "el-button-active",
  position: { x: 130, y: 180 },
  size: { width: 160, height: 36 },
  style: {
    ...buttonElement.style!,
    fill: "#16a34a",
  },
};

// Complete state
const cardElementComplete: KeyElement = {
  ...cardElement,
  id: "el-card-complete",
  position: { x: 100, y: 80 },
  size: { width: 200, height: 120 },
  style: {
    ...cardElement.style!,
    fill: "#a855f7",
  },
};

const buttonElementComplete: KeyElement = {
  ...buttonElement,
  id: "el-button-complete",
  position: { x: 130, y: 160 },
  size: { width: 140, height: 32 },
  style: {
    ...buttonElement.style!,
    fill: "#7c3aed",
  },
};

export const initialKeyframes: Keyframe[] = [
  {
    id: "kf-idle",
    name: "Idle",
    summary: "Default state",
    functionalState: "idle",
    keyElements: [cardElement, buttonElement],
  },
  {
    id: "kf-active",
    name: "Active", 
    summary: "Active state",
    functionalState: "loading",
    keyElements: [cardElementActive, buttonElementActive],
  },
  {
    id: "kf-complete",
    name: "Complete",
    summary: "Complete state",
    functionalState: "success",
    keyElements: [cardElementComplete, buttonElementComplete],
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
