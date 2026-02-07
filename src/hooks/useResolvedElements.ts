import { useMemo } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import type { KeyElement } from '../types';

/**
 * Resolves the final elements array for the current keyframe + display state.
 * 
 * Logic:
 * 1. Read base elements from the selected keyframe's keyElements
 * 2. Find the selected DisplayState's layerOverrides
 * 3. For each element, if there's a matching override with isKey=true,
 *    apply the override properties on top of the base element
 * 4. Return the merged elements array
 */
export function useResolvedElements(): KeyElement[] {
  const keyframes = useEditorStore(s => s.keyframes);
  const selectedKeyframeId = useEditorStore(s => s.selectedKeyframeId);
  const displayStates = useEditorStore(s => s.displayStates);
  const selectedDisplayStateId = useEditorStore(s => s.selectedDisplayStateId);

  return useMemo(() => {
    // 1. Get base elements from selected keyframe
    const kf = keyframes.find(k => k.id === selectedKeyframeId);
    if (!kf) return [];
    const baseElements = kf.keyElements;

    // 2. Find selected display state
    const ds = displayStates.find(d => d.id === selectedDisplayStateId);
    if (!ds || ds.layerOverrides.length === 0) return baseElements;

    // 3. Apply layerOverrides to base elements
    return baseElements.map(el => {
      const override = ds.layerOverrides.find(o => o.layerId === el.id);
      if (!override || !override.isKey) return el;

      const props = override.properties;

      // 4. Merge override properties onto base element
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
          visibility: props.visible === false ? 'hidden' : (props.visible === true ? 'visible' : el.style?.visibility),
        },
      } as KeyElement;
    });
  }, [keyframes, selectedKeyframeId, displayStates, selectedDisplayStateId]);
}
