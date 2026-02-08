import type { StateCreator } from 'zustand';
import type { CurveConfig } from '../types';
import { DEFAULT_CURVE_CONFIG } from '../types';

export interface CurveSlice {
  // State — Three-level curve override system (level 1: global)
  globalCurve: CurveConfig;

  // Actions
  setGlobalCurve: (curve: CurveConfig) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createCurveSlice: StateCreator<any, [], [], CurveSlice> = (set) => ({
  // State
  globalCurve: { ...DEFAULT_CURVE_CONFIG },

  // Actions
  setGlobalCurve: (curve: CurveConfig) => set({ globalCurve: curve }),
});
