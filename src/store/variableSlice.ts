import type { StateCreator } from 'zustand';
import type { Variable, ConditionRule } from '../types';

// Legacy type
type Interaction = any;

export interface VariableSlice {
  // State
  variables: Variable[];
  interactions: Interaction[];
  conditionRules: ConditionRule[];

  // Variable actions
  addVariable: (variable: Variable) => void;
  updateVariable: (id: string, updates: Partial<Variable>) => void;
  deleteVariable: (id: string) => void;
  setVariableValue: (id: string, value: string | number | boolean) => void;

  // Interaction actions
  addInteraction: (interaction: Interaction) => void;
  updateInteraction: (id: string, updates: Partial<Interaction>) => void;
  deleteInteraction: (id: string) => void;
  duplicateInteraction: (id: string) => void;
  getInteractionsForElement: (elementId: string) => Interaction[];

  // Condition rule actions
  addConditionRule: (rule: ConditionRule) => void;
  updateConditionRule: (id: string, updates: Partial<ConditionRule>) => void;
  deleteConditionRule: (id: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createVariableSlice: StateCreator<any, [], [], VariableSlice> = (set, get) => ({
  // State
  variables: [],
  interactions: [],
  conditionRules: [],

  // Variable actions
  addVariable: (variable: Variable) => set((state: any) => ({
    variables: [...state.variables, variable],
  })),

  updateVariable: (id: string, updates: Partial<Variable>) => set((state: any) => ({
    variables: state.variables.map((v: Variable) =>
      v.id === id ? { ...v, ...updates } : v
    ),
  })),

  deleteVariable: (id: string) => set((state: any) => ({
    variables: state.variables.filter((v: Variable) => v.id !== id),
  })),

  setVariableValue: (id: string, value: string | number | boolean) => set((state: any) => ({
    variables: state.variables.map((v: Variable) =>
      v.id === id ? { ...v, currentValue: value } : v
    ),
  })),

  // Interaction actions
  addInteraction: (interaction: Interaction) => set((state: any) => ({
    interactions: [...state.interactions, interaction],
  })),

  updateInteraction: (id: string, updates: Partial<Interaction>) => set((state: any) => ({
    interactions: state.interactions.map((i: Interaction) =>
      i.id === id ? { ...i, ...updates } : i
    ),
  })),

  deleteInteraction: (id: string) => set((state: any) => ({
    interactions: state.interactions.filter((i: Interaction) => i.id !== id),
  })),

  duplicateInteraction: (id: string) => set((state: any) => {
    const interaction = state.interactions.find((i: Interaction) => i.id === id);
    if (!interaction) return state;
    const newInteraction = {
      ...interaction,
      id: `interaction-${Date.now()}`,
      name: interaction.name ? `${interaction.name} (copy)` : undefined,
    };
    return { interactions: [...state.interactions, newInteraction] };
  }),

  getInteractionsForElement: (elementId: string) => {
    return get().interactions.filter((i: Interaction) => i.elementId === elementId);
  },

  // Condition rule actions
  addConditionRule: (rule: ConditionRule) => set((state: any) => ({
    conditionRules: [...state.conditionRules, rule],
  })),

  updateConditionRule: (id: string, updates: Partial<ConditionRule>) => set((state: any) => ({
    conditionRules: state.conditionRules.map((r: ConditionRule) =>
      r.id === id ? { ...r, ...updates } : r
    ),
  })),

  deleteConditionRule: (id: string) => set((state: any) => ({
    conditionRules: state.conditionRules.filter((r: ConditionRule) => r.id !== id),
  })),
});
