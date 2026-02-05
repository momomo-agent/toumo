import type { Keyframe, Transition } from '../types';

export const initialKeyframes: Keyframe[] = [
  {
    id: "kf-idle",
    name: "Idle",
    summary: "Default state",
    functionalState: "idle",
    keyElements: [],
  },
  {
    id: "kf-active",
    name: "Active", 
    summary: "Active state",
    functionalState: "loading",
    keyElements: [],
  },
  {
    id: "kf-complete",
    name: "Complete",
    summary: "Complete state",
    functionalState: "success",
    keyElements: [],
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
