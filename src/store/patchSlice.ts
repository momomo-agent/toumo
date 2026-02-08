import type { StateCreator } from 'zustand';
import type { Patch, PatchConnection, Position } from '../types';

export interface PatchSlice {
  // State
  patches: Patch[];
  patchConnections: PatchConnection[];
  selectedPatchId: string | null;
  selectedPatchIds: string[];
  activePatchIds: Set<string>;
  selectedConnectionId: string | null;

  // Actions
  addPatch: (patch: Patch) => void;
  removePatch: (id: string) => void;
  updatePatchPosition: (id: string, position: Position) => void;
  renamePatch: (id: string, name: string) => void;
  updatePatchConfig: (id: string, config: Record<string, any>) => void;
  addPatchConnection: (connection: PatchConnection) => void;
  removePatchConnection: (id: string) => void;
  setSelectedPatchId: (id: string | null) => void;
  setSelectedPatchIds: (ids: string[]) => void;
  togglePatchSelection: (id: string) => void;
  removeSelectedPatches: () => void;
  moveSelectedPatches: (dx: number, dy: number) => void;
  duplicatePatch: (id: string) => void;
  flashPatch: (id: string) => void;
  setSelectedConnectionId: (id: string | null) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createPatchSlice: StateCreator<any, [], [], PatchSlice> = (set, get) => ({
  // State
  patches: [
    {
      id: 'patch-tap-btn', type: 'tap' as const, name: 'Tap Button',
      position: { x: 60, y: 80 },
      config: { targetElementId: 'el-button' },
      inputs: [],
      outputs: [
        { id: 'onTap', name: 'onTap', dataType: 'pulse' as const },
        { id: 'target', name: 'target', dataType: 'any' as const },
      ],
    },
    {
      id: 'patch-switch-active', type: 'switchDisplayState' as const,
      name: 'Switch → Active',
      position: { x: 380, y: 80 },
      config: { targetDisplayStateId: 'ds-active' },
      inputs: [
        { id: 'trigger', name: 'trigger', dataType: 'pulse' as const },
        { id: 'state', name: 'state', dataType: 'displayState' as const },
      ],
      outputs: [
        { id: 'done', name: 'done', dataType: 'pulse' as const },
      ],
    },
  ],
  patchConnections: [
    {
      id: 'conn-tap-to-switch',
      fromPatchId: 'patch-tap-btn',
      fromPortId: 'onTap',
      toPatchId: 'patch-switch-active',
      toPortId: 'trigger',
    },
  ],
  selectedPatchId: null,
  selectedPatchIds: [],
  activePatchIds: new Set<string>(),
  selectedConnectionId: null,

  // Actions
  addPatch: (patch: Patch) => {
    set((s: any) => ({ patches: [...s.patches, patch] }));
  },

  removePatch: (id: string) => {
    set((s: any) => ({
      patches: s.patches.filter((p: Patch) => p.id !== id),
      patchConnections: s.patchConnections.filter(
        (c: PatchConnection) => c.fromPatchId !== id && c.toPatchId !== id
      ),
      selectedPatchId: s.selectedPatchId === id ? null : s.selectedPatchId,
    }));
  },

  updatePatchPosition: (id: string, position: Position) => {
    set((s: any) => ({
      patches: s.patches.map((p: Patch) =>
        p.id === id ? { ...p, position } : p
      ),
    }));
  },

  renamePatch: (id: string, name: string) => {
    set((s: any) => ({
      patches: s.patches.map((p: Patch) =>
        p.id === id ? { ...p, name } : p
      ),
    }));
  },

  updatePatchConfig: (id: string, config: Record<string, any>) => {
    set((s: any) => ({
      patches: s.patches.map((p: Patch) =>
        p.id === id ? { ...p, config: { ...p.config, ...config } } : p
      ),
    }));
  },

  addPatchConnection: (connection: PatchConnection) => {
    // Type compatibility check
    const { patches } = get();
    const fromPatch = patches.find((p: Patch) => p.id === connection.fromPatchId);
    const toPatch = patches.find((p: Patch) => p.id === connection.toPatchId);
    if (fromPatch && toPatch) {
      const fromPort = fromPatch.outputs.find((p: any) => p.id === connection.fromPortId);
      const toPort = toPatch.inputs.find((p: any) => p.id === connection.toPortId);
      if (fromPort && toPort && fromPort.dataType !== 'any' && toPort.dataType !== 'any'
          && fromPort.dataType !== toPort.dataType) {
        console.warn(`[Patch] Type mismatch: ${fromPort.dataType} → ${toPort.dataType}`);
        return;
      }
    }
    set((s: any) => ({ patchConnections: [...s.patchConnections, connection] }));
  },

  removePatchConnection: (id: string) => {
    set((s: any) => ({
      patchConnections: s.patchConnections.filter((c: PatchConnection) => c.id !== id),
      selectedConnectionId: s.selectedConnectionId === id ? null : s.selectedConnectionId,
    }));
  },

  setSelectedPatchId: (id: string | null) => {
    set({ selectedPatchId: id });
  },

  setSelectedPatchIds: (ids: string[]) => {
    set({ selectedPatchIds: ids, selectedPatchId: ids[ids.length - 1] || null });
  },

  togglePatchSelection: (id: string) => {
    const cur = get().selectedPatchIds;
    const next = cur.includes(id)
      ? cur.filter((i: string) => i !== id)
      : [...cur, id];
    set({ selectedPatchIds: next, selectedPatchId: next[next.length - 1] || null });
  },

  removeSelectedPatches: () => {
    const { selectedPatchIds, patches, patchConnections } = get();
    if (!selectedPatchIds.length) return;
    const idSet = new Set(selectedPatchIds);
    set({
      patches: patches.filter((p: Patch) => !idSet.has(p.id)),
      patchConnections: patchConnections.filter(
        (c: PatchConnection) => !idSet.has(c.fromPatchId) && !idSet.has(c.toPatchId)
      ),
      selectedPatchIds: [],
      selectedPatchId: null,
    });
  },

  moveSelectedPatches: (dx: number, dy: number) => {
    const { selectedPatchIds, patches } = get();
    if (!selectedPatchIds.length) return;
    const idSet = new Set(selectedPatchIds);
    set({
      patches: patches.map((p: Patch) => idSet.has(p.id)
        ? { ...p, position: { x: p.position.x + dx, y: p.position.y + dy } }
        : p),
    });
  },

  duplicatePatch: (id: string) => {
    const { patches } = get();
    const src = patches.find((p: Patch) => p.id === id);
    if (!src) return;
    const newId = `patch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const clone: Patch = {
      ...JSON.parse(JSON.stringify(src)),
      id: newId,
      name: `${src.name} copy`,
      position: { x: src.position.x + 30, y: src.position.y + 30 },
    };
    set({ patches: [...patches, clone], selectedPatchId: newId });
  },

  flashPatch: (id: string) => {
    const s = get();
    const next = new Set(s.activePatchIds);
    next.add(id);
    set({ activePatchIds: next });
    setTimeout(() => {
      const s2 = get();
      const after = new Set(s2.activePatchIds);
      after.delete(id);
      set({ activePatchIds: after });
    }, 300);
  },

  setSelectedConnectionId: (id: string | null) => {
    set({ selectedConnectionId: id });
  },
});
