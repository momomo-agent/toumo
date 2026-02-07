import { useMemo } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import type { KeyElement, DisplayState } from '../types';

/**
 * Pure function: resolve elements for a specific display state.
 * Used by Canvas to render each frame with its own layerOverrides.
 */
export function resolveElementsForState(
  sharedElements: KeyElement[],
  displayState?: DisplayState | null
): KeyElement[] {
  if (!sharedElements.length) return [];
  if (!displayState || displayState.layerOverrides.length === 0) return sharedElements;

  return sharedElements.map(el => {
    const override = displayState.layerOverrides.find(o => o.layerId === el.id);
    if (!override || !override.isKey) return el;

    const props = override.properties;
    return {
      ...el,
      position: {
        x: props.x ?? el.position.x,
        y: props.y ?? el.position.y,
      },
      size: {
        width: props.width ?? el.size.width,
        height: props.height ?? el.size.height,
      },
      style: {
        ...el.style,
        opacity: props.opacity ?? el.style?.opacity,
        fill: props.fill ?? el.style?.fill,
        fillOpacity: props.fillOpacity ?? el.style?.fillOpacity,
        stroke: props.stroke ?? el.style?.stroke,
        strokeWidth: props.strokeWidth ?? el.style?.strokeWidth,
        borderRadius: props.borderRadius ?? el.style?.borderRadius,
        fontSize: props.fontSize ?? el.style?.fontSize,
        fontWeight: props.fontWeight ?? el.style?.fontWeight,
        color: props.color ?? el.style?.color,
        letterSpacing: props.letterSpacing ?? el.style?.letterSpacing,
        lineHeight: props.lineHeight ?? el.style?.lineHeight,
        shadowColor: props.shadowColor ?? el.style?.shadowColor,
        shadowX: props.shadowX ?? el.style?.shadowX,
        shadowY: props.shadowY ?? el.style?.shadowY,
        shadowBlur: props.shadowBlur ?? el.style?.shadowBlur,
        blur: props.blur ?? el.style?.blur,
        brightness: props.brightness ?? el.style?.brightness,
        contrast: props.contrast ?? el.style?.contrast,
        saturate: props.saturate ?? el.style?.saturate,
        rotation: props.rotation ?? el.style?.rotation,
        scale: props.scale ?? el.style?.scale,
        visibility: props.visible === false ? 'hidden' : (props.visible === true ? 'visible' : el.style?.visibility),
      },
    } as KeyElement;
  });
}

/**
 * Hook: resolves elements for the currently selected display state.
 * Also expands component instances into their internal layers.
 */
export function useResolvedElements(): KeyElement[] {
  const sharedElements = useEditorStore(s => s.sharedElements);
  const displayStates = useEditorStore(s => s.displayStates);
  const selectedDisplayStateId = useEditorStore(s => s.selectedDisplayStateId);
  const componentsV2 = useEditorStore(s => s.componentsV2);

  return useMemo(() => {
    const ds = displayStates.find(d => d.id === selectedDisplayStateId);
    const resolved = resolveElementsForState(sharedElements, ds);

    // Expand component instances
    const expanded: KeyElement[] = [];
    for (const el of resolved) {
      if (el.componentId) {
        const comp = componentsV2.find(c => c.id === el.componentId);
        if (comp) {
          const stateId = el.currentStateId || comp.displayStates[0]?.id;
          const compDs = comp.displayStates.find(s => s.id === stateId);
          const compElements = resolveElementsForState(comp.layers, compDs);
          // Offset component layers by instance position
          for (const cel of compElements) {
            expanded.push({
              ...cel,
              id: `${el.id}::${cel.id}`,
              position: {
                x: el.position.x + cel.position.x,
                y: el.position.y + cel.position.y,
              },
            });
          }
        }
      }
      expanded.push(el);
    }
    return expanded;
  }, [sharedElements, displayStates, selectedDisplayStateId, componentsV2]);
}
