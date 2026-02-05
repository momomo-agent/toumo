import type { Keyframe, Transition, FunctionalState } from '../types';

export const functionalStates: FunctionalState[] = [
  { id: "idle", name: "Idle", description: "Waiting for user input" },
  { id: "loading", name: "Loading", description: "Async request in progress" },
  { id: "success", name: "Success", description: "Positive API response" },
  { id: "error", name: "Error", description: "Fallback when request fails" },
];

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
  {
    id: "tr-2",
    from: "kf-active",
    to: "kf-complete",
    trigger: "auto",
    duration: 400,
    delay: 200,
    curve: "spring",
  },
];
