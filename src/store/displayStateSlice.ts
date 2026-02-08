import type { StateCreator } from 'zustand';
import type { DisplayState, LayerProperties, CurveConfig, KeyElement, LayerOverride } from '../types';

/**
 * Check if the current display state is the default (first) one.
 * Returns true if we should write to sharedElements directly.
 */
export const isDefaultDisplayState = (state: { displayStates: DisplayState[]; selectedDisplayStateId: string | null }): boolean => {
  const defaultDsId = state.displayStates[0]?.id;
  return !state.selectedDisplayStateId || state.selectedDisplayStateId === defaultDsId;
};

/**
 * Convert KeyElement updates (position/size/style/rotation) into flat LayerProperties.
 * Used when writing to layerOverrides for non-default display states.
 */
export const updatesToLayerProperties = (updates: Partial<KeyElement>): Partial<LayerProperties> => {
  const props: Partial<LayerProperties> = {};
  if (updates.position) {
    props.x = updates.position.x;
    props.y = updates.position.y;
  }
  if (updates.size) {
    props.width = updates.size.width;
    props.height = updates.size.height;
  }
  if (updates.style) {
    const s = updates.style;
    if (s.opacity !== undefined) props.opacity = s.opacity;
    if (s.fill !== undefined) props.fill = s.fill;
    if (s.fillOpacity !== undefined) props.fillOpacity = s.fillOpacity;
    if (s.stroke !== undefined) props.stroke = s.stroke;
    if (s.strokeWidth !== undefined) props.strokeWidth = s.strokeWidth;
    if (s.borderRadius !== undefined) props.borderRadius = s.borderRadius;
    if (s.fontSize !== undefined) props.fontSize = s.fontSize;
    if (s.fontWeight !== undefined) props.fontWeight = s.fontWeight;
    if (s.color !== undefined) props.color = s.color;
    if (s.letterSpacing !== undefined) props.letterSpacing = s.letterSpacing;
    if (s.lineHeight !== undefined) props.lineHeight = s.lineHeight;
    if (s.shadowColor !== undefined) props.shadowColor = s.shadowColor;
    if (s.shadowX !== undefined) props.shadowX = s.shadowX;
    if (s.shadowY !== undefined) props.shadowY = s.shadowY;
    if (s.shadowBlur !== undefined) props.shadowBlur = s.shadowBlur;
    if (s.blur !== undefined) props.blur = s.blur;
    if (s.brightness !== undefined) props.brightness = s.brightness;
    if (s.contrast !== undefined) props.contrast = s.contrast;
    if (s.saturate !== undefined) props.saturate = s.saturate;
    if (s.rotation !== undefined) props.rotation = s.rotation;
    if (s.scale !== undefined) props.scale = s.scale;
    if (s.visibility !== undefined) props.visible = s.visibility !== 'hidden';
  }
  return props;
};

/**
 * Write properties to a display state's layerOverrides for a given layer.
 * Merges with existing override and auto-tracks keyProperties.
 */
export const writeToLayerOverride = (
  displayStates: DisplayState[],
  displayStateId: string,
  layerId: string,
  newProperties: Partial<LayerProperties>,
): DisplayState[] => {
  if (Object.keys(newProperties).length === 0) return displayStates;

  return displayStates.map(ds => {
    if (ds.id !== displayStateId) return ds;
    const existing = ds.layerOverrides.find(o => o.layerId === layerId);
    const mergedProps = { ...(existing?.properties || {}), ...newProperties };
    const mergedKeys = [...new Set([
      ...(existing?.keyProperties || []),
      ...Object.keys(newProperties),
    ])];
    const newOverride: LayerOverride = {
      layerId,
      isKey: true,
      properties: mergedProps,
      keyProperties: mergedKeys,
    };
    return {
      ...ds,
      layerOverrides: [
        ...ds.layerOverrides.filter(o => o.layerId !== layerId),
        newOverride,
      ],
    };
  });
};

export interface DisplayStateSlice {
  // State
  displayStates: DisplayState[];
  selectedDisplayStateId: string | null;

  // Actions
  addDisplayState: (name: string) => void;
  removeDisplayState: (id: string) => void;
  renameDisplayState: (id: string, name: string) => void;
  setSelectedDisplayStateId: (id: string | null) => void;
  setLayerOverride: (displayStateId: string, layerId: string, properties: Partial<LayerProperties>, isKey: boolean) => void;
  removeLayerOverride: (displayStateId: string, layerId: string) => void;
  toggleKeyProperty: (displayStateId: string, layerId: string, property: string) => void;
  setElementCurve: (displayStateId: string, layerId: string, curve: CurveConfig) => void;
  setPropertyCurve: (displayStateId: string, layerId: string, property: string, curve: CurveConfig) => void;
  removeElementCurve: (displayStateId: string, layerId: string) => void;
  removePropertyCurve: (displayStateId: string, layerId: string, property: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createDisplayStateSlice: StateCreator<any, [], [], DisplayStateSlice> = (set, _get) => ({
  // State
  displayStates: [
    { id: 'ds-default', name: 'Default', layerOverrides: [] },
    { id: 'ds-active', name: 'Active', layerOverrides: [
      { layerId: 'el-card', properties: { y: 20, fillColor: '#3b82f6' }, isKey: true },
      { layerId: 'el-button', properties: { fillColor: '#22c55e', fillOpacity: 0.9 }, isKey: true },
    ] },
  ],
  selectedDisplayStateId: 'ds-default',

  // Actions
  addDisplayState: (name: string) => set((state: any) => {
    const newId = `ds-${Date.now()}`;
    const newDS: DisplayState = { id: newId, name, layerOverrides: [] };
    return {
      displayStates: [...state.displayStates, newDS],
      selectedDisplayStateId: newId,
    };
  }),

  removeDisplayState: (id: string) => set((state: any) => {
    if (state.displayStates.length <= 1) return state;
    const next = state.displayStates.filter((ds: DisplayState) => ds.id !== id);
    return {
      displayStates: next,
      selectedDisplayStateId: state.selectedDisplayStateId === id
        ? next[0].id
        : state.selectedDisplayStateId,
    };
  }),

  renameDisplayState: (id: string, name: string) => set((state: any) => ({
    displayStates: state.displayStates.map((ds: DisplayState) =>
      ds.id === id ? { ...ds, name } : ds
    ),
  })),

  setSelectedDisplayStateId: (id: string | null) => set({ selectedDisplayStateId: id }),

  setLayerOverride: (displayStateId: string, layerId: string, properties: Partial<LayerProperties>, isKey: boolean) => set((state: any) => ({
    displayStates: state.displayStates.map((ds: DisplayState) => {
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

  removeLayerOverride: (displayStateId: string, layerId: string) => set((state: any) => ({
    displayStates: state.displayStates.map((ds: DisplayState) =>
      ds.id === displayStateId
        ? { ...ds, layerOverrides: ds.layerOverrides.filter((o) => o.layerId !== layerId) }
        : ds
    ),
  })),

  toggleKeyProperty: (displayStateId: string, layerId: string, property: string) => set((state: any) => ({
    displayStates: state.displayStates.map((ds: DisplayState) => {
      if (ds.id !== displayStateId) return ds;
      const existingOverride = ds.layerOverrides.find((o) => o.layerId === layerId);
      if (existingOverride) {
        const currentKeys = existingOverride.keyProperties || [];
        const hasKey = currentKeys.includes(property);
        const newKeys = hasKey
          ? currentKeys.filter((k: string) => k !== property)
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
      return {
        ...ds,
        layerOverrides: [
          ...ds.layerOverrides,
          { layerId, properties: {}, isKey: true, keyProperties: [property] },
        ],
      };
    }),
  })),

  // === Three-level curve override actions (element & property level) ===

  setElementCurve: (displayStateId: string, layerId: string, curve: CurveConfig) => set((state: any) => ({
    displayStates: state.displayStates.map((ds: DisplayState) => {
      if (ds.id !== displayStateId) return ds;
      const existing = ds.layerOverrides.find((o) => o.layerId === layerId);
      if (existing) {
        return {
          ...ds,
          layerOverrides: ds.layerOverrides.map((o) =>
            o.layerId === layerId ? { ...o, curveOverride: curve } : o
          ),
        };
      }
      return {
        ...ds,
        layerOverrides: [
          ...ds.layerOverrides,
          { layerId, properties: {}, isKey: false, curveOverride: curve },
        ],
      };
    }),
  })),

  setPropertyCurve: (displayStateId: string, layerId: string, property: string, curve: CurveConfig) => set((state: any) => ({
    displayStates: state.displayStates.map((ds: DisplayState) => {
      if (ds.id !== displayStateId) return ds;
      const existing = ds.layerOverrides.find((o) => o.layerId === layerId);
      if (existing) {
        return {
          ...ds,
          layerOverrides: ds.layerOverrides.map((o) =>
            o.layerId === layerId
              ? { ...o, propertyCurveOverrides: { ...o.propertyCurveOverrides, [property]: curve } }
              : o
          ),
        };
      }
      return {
        ...ds,
        layerOverrides: [
          ...ds.layerOverrides,
          { layerId, properties: {}, isKey: false, propertyCurveOverrides: { [property]: curve } },
        ],
      };
    }),
  })),

  removeElementCurve: (displayStateId: string, layerId: string) => set((state: any) => ({
    displayStates: state.displayStates.map((ds: DisplayState) => {
      if (ds.id !== displayStateId) return ds;
      return {
        ...ds,
        layerOverrides: ds.layerOverrides.map((o) =>
          o.layerId === layerId ? { ...o, curveOverride: undefined } : o
        ),
      };
    }),
  })),

  removePropertyCurve: (displayStateId: string, layerId: string, property: string) => set((state: any) => ({
    displayStates: state.displayStates.map((ds: DisplayState) => {
      if (ds.id !== displayStateId) return ds;
      return {
        ...ds,
        layerOverrides: ds.layerOverrides.map((o) => {
          if (o.layerId !== layerId) return o;
          const newOverrides = { ...o.propertyCurveOverrides };
          delete newOverrides[property];
          return { ...o, propertyCurveOverrides: Object.keys(newOverrides).length > 0 ? newOverrides : undefined };
        }),
      };
    }),
  })),
});
