import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useEditorStore } from '../../store';
import type { KeyElement, PrototypeTransitionType, PrototypeTransitionDirection, PrototypeTransitionEasing } from '../../types';
// Legacy types removed from types/index.ts — define locally
type Transition = any;
type PrototypeLink = any;
type TriggerType = string;
import { useSmartAnimate } from '../../hooks/useSmartAnimate';
import { SpringPresets } from '../../engine/SpringAnimation';
import { solveSpringRK4 } from '../../data/curvePresets';
import { handleElementTap, handleElementHover, handleElementDrag, startAllTimerTriggers, handleVariableChange, handleScroll } from '../../engine/PatchRuntime';
import type { DragPhase } from '../../engine/PatchRuntime';
import { resolveElementsForState } from '../../hooks/useResolvedElements';
import { DeviceFrame } from './DeviceFrame';

// ─── Prototype easing map ─────────────────────────────────────────────
const prototypeEasings: Record<PrototypeTransitionEasing, string> = {
  linear: 'linear', ease: 'ease', easeIn: 'ease-in',
  easeOut: 'ease-out', easeInOut: 'ease-in-out',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

// ─── Easing ───────────────────────────────────────────────────────────
const easingFunctions: Record<string, string> = {
  'linear': 'linear',
  'ease': 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  'spring-gentle': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  'spring-bouncy': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  'spring-stiff': 'cubic-bezier(0.5, 1.8, 0.5, 0.8)',
};

function getTransitionEasing(transition: Transition): string {
  if (transition.cubicBezier) {
    const [x1, y1, x2, y2] = transition.cubicBezier;
    return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
  }
  return easingFunctions[transition.curve] || transition.curve || 'ease-out';
}

function getSpringConfigFromCurve(curve: string) {
  switch (curve) {
    case 'spring-bouncy': return { ...SpringPresets.bouncy, useSpring: true };
    case 'spring-stiff': return { ...SpringPresets.stiff, useSpring: true };
    case 'spring-gentle': return { ...SpringPresets.gentle, useSpring: true };
    default: return { ...SpringPresets.default, useSpring: true };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Main LivePreview Component
// ═══════════════════════════════════════════════════════════════════════
export function LivePreview() {
  const {
    keyframes, transitions, selectedKeyframeId, frameSize,
    previewTransitionId, setPreviewTransitionId,
    patches, patchConnections, displayStates, selectedDisplayStateId,
    setSelectedDisplayStateId,
  } = useEditorStore();
  const deviceFrame = useEditorStore(s => s.deviceFrame);
  const globalCurve = useEditorStore(s => s.globalCurve);

  // State machine
  const [currentKeyframeId, setCurrentKeyframeId] = useState<string>(selectedKeyframeId);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState(300);
  const [transitionCurve, setTransitionCurve] = useState('ease-out');

  // Apply globalCurve to default transition settings
  useEffect(() => {
    if (globalCurve) {
      setTransitionDuration(globalCurve.duration || 300);
      if (globalCurve.type === 'spring') {
        setTransitionCurve('spring');
      } else if (globalCurve.controlPoints) {
        const [x1, y1, x2, y2] = globalCurve.controlPoints;
        setTransitionCurve(`cubic-bezier(${x1},${y1},${x2},${y2})`);
      } else {
        setTransitionCurve(globalCurve.type || 'ease-out');
      }
    }
  }, [globalCurve]);

  // DisplayState tracking for Patch-driven preview
  const [previewDisplayStateId, setPreviewDisplayStateId] = useState<string | null>(
    selectedDisplayStateId,
  );

  // Sync preview display state when editor selection changes
  useEffect(() => {
    setPreviewDisplayStateId(selectedDisplayStateId);
  }, [selectedDisplayStateId]);

  // Shared Patch action handlers
  const patchHandlers = useMemo(() => ({
    switchDisplayState: (targetId: string) => {
      const targetKf = keyframes.find(kf => kf.displayStateId === targetId);
      if (targetKf) {
        const targetDs = displayStates.find(ds => ds.id === targetId);
        const toElements = resolveElementsForState(
          useEditorStore.getState().sharedElements, targetDs || null
        );
        smartAnimateRef.current.animateTo(toElements);
        setCurrentKeyframeId(targetKf.id);
      }
      setPreviewDisplayStateId(targetId);
      setSelectedDisplayStateId(targetId);
    },
    setVariable: (variableId: string, value: any) => {
      const { setVariableValue } = useEditorStore.getState();
      setVariableValue(variableId, value);
      const state = useEditorStore.getState();
      handleVariableChange(variableId, value, state.patches, state.patchConnections, patchHandlersRef.current);
    },
    animateProperty: (elementId: string, property: string, toValue: any) => {
      // Build target elements with the property change applied
      const currentEls = useEditorStore.getState().sharedElements;
      const targetEls = currentEls.map((el: any) => {
        if (el.id !== elementId) return el;
        return { ...el, style: { ...el.style, [property]: toValue } };
      });
      smartAnimateRef.current.animateTo(targetEls);
    },
    getVariableValue: (variableId: string) => {
      const vars = useEditorStore.getState().variables;
      const v = vars.find((v: any) => v.id === variableId);
      return v?.currentValue ?? v?.defaultValue;
    },
  }), [setSelectedDisplayStateId, keyframes, displayStates]);
  const patchHandlersRef = useRef(patchHandlers);
  patchHandlersRef.current = patchHandlers;

  // Patch runtime: handle tap on element → switchDisplayState
  const handlePatchTap = useCallback((elementId: string) => {
    // Flash triggered patches
    const { flashPatch } = useEditorStore.getState();
    patches.filter(p => p.type === 'tap' && p.config?.targetElementId === elementId).forEach(p => flashPatch(p.id));
    return handleElementTap(elementId, patches, patchConnections, patchHandlers);
  }, [patches, patchConnections, patchHandlers]);

  // Patch runtime: handle hover on element → onHoverIn / onHoverOut
  const handlePatchHover = useCallback((elementId: string, phase: 'in' | 'out') => {
    const { flashPatch } = useEditorStore.getState();
    patches.filter(p => p.type === 'hover' && p.config?.targetElementId === elementId).forEach(p => flashPatch(p.id));
    return handleElementHover(elementId, phase, patches, patchConnections, patchHandlers);
  }, [patches, patchConnections, patchHandlers]);

  // Patch runtime: handle drag on element → onDragStart / onDragMove / onDragEnd
  const handlePatchDrag = useCallback((elementId: string, phase: DragPhase, delta: { dx: number; dy: number }) => {
    if (phase === 'start') {
      const { flashPatch } = useEditorStore.getState();
      patches.filter(p => p.type === 'drag' && p.config?.targetElementId === elementId).forEach(p => flashPatch(p.id));
    }
    return handleElementDrag(elementId, phase, delta, patches, patchConnections, patchHandlers);
  }, [patches, patchConnections, patchHandlers]);

  const handlePatchScroll = useCallback(() => {
    return handleScroll(patches, patchConnections, patchHandlers);
  }, [patches, patchConnections, patchHandlers]);

  // Smart Animate
  const [useSmartAnimateMode, _setUseSmartAnimateMode] = useState(true);
  const [smartAnimateState, smartAnimateActions] = useSmartAnimate([], {
    springConfig: { ...SpringPresets.default, duration: 0.4, useSpring: true },
    enabled: true,
  });
  const smartAnimateRef = useRef(smartAnimateActions);
  smartAnimateRef.current = smartAnimateActions;

  const timerRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 288, height: 480 });

  // ─── Responsive container measurement ─────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setContainerSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ─── Prototype link navigation state ──────────────────────────────
  const navigationHistory = useRef<string[]>([]);
  const [prototypeTransition, setPrototypeTransition] = useState<{
    active: boolean;
    type: PrototypeTransitionType;
    direction?: PrototypeTransitionDirection;
    duration: number;
    easing: string;
    phase: 'out' | 'in';
  } | null>(null);

  const handlePrototypeNavigation = useCallback((link: PrototypeLink, fromFrameId: string) => {
    if (!link.enabled || !link.targetFrameId || isTransitioning || prototypeTransition?.active) return;
    let targetId = link.targetFrameId;
    if (targetId === 'back') {
      const prev = navigationHistory.current.pop();
      if (!prev) return;
      targetId = prev;
    } else {
      navigationHistory.current.push(fromFrameId);
    }
    const target = keyframes.find(kf => kf.id === targetId);
    if (!target) return;
    const { type, direction, duration, easing } = link.transition;
    const easingCss = prototypeEasings[easing as PrototypeTransitionEasing] || 'ease-out';
    if (type === 'instant') { setCurrentKeyframeId(targetId); return; }
    setPrototypeTransition({ active: true, type, direction, duration, easing: easingCss, phase: 'out' });
    setTimeout(() => {
      setCurrentKeyframeId(targetId);
      setPrototypeTransition(p => p ? { ...p, phase: 'in' } : null);
    }, type === 'dissolve' || type === 'smartAnimate' ? duration / 2 : duration);
    setTimeout(() => setPrototypeTransition(null), duration);
  }, [keyframes, isTransitioning, prototypeTransition]);

  // ─── Sync with editor selection ───────────────────────────────────
  useEffect(() => {
    if (!isTransitioning && !smartAnimateState.isAnimating) {
      setCurrentKeyframeId(selectedKeyframeId);
    }
  }, [selectedKeyframeId, isTransitioning, smartAnimateState.isAnimating]);

  // ─── Init smart animate elements on keyframe change ───────────────
  useEffect(() => {
    const kf = keyframes.find(k => k.id === currentKeyframeId);
    if (kf && !smartAnimateState.isAnimating) {
      smartAnimateActions.setElements(useEditorStore.getState().sharedElements);
    }
  }, [currentKeyframeId, keyframes]);

  // ─── Derived state ────────────────────────────────────────────────
  const currentKeyframe = useMemo(() => keyframes.find(kf => kf.id === currentKeyframeId), [keyframes, currentKeyframeId]);
  const baseElements = useMemo(() =>
    smartAnimateState.isAnimating
      ? smartAnimateState.elements
      : useEditorStore.getState().sharedElements,
    [smartAnimateState.isAnimating, smartAnimateState.elements, currentKeyframe],
  );

  // Apply DisplayState layer overrides to elements using the shared resolver
  // (respects isKey flag, consistent with Canvas and Inspector)
  const currentDisplayState = displayStates.find(ds => ds.id === previewDisplayStateId);
  const elements = useMemo(() => {
    return resolveElementsForState(baseElements, currentDisplayState);
  }, [baseElements, currentDisplayState]);

  const availableTransitions = useMemo(() => transitions.filter(t => t.from === currentKeyframeId), [transitions, currentKeyframeId]);

  // ─── Spring RAF animation ref ──────────────────────────────────────
  const springRafRef = useRef<number>(0);

  // ─── Execute transition ───────────────────────────────────────────
  const executeTransition = useCallback((transition: Transition) => {
    if (isTransitioning || smartAnimateState.isAnimating) return;
    const targetKeyframe = keyframes.find(kf => kf.id === transition.to);
    if (!targetKeyframe) return;
    const fromKeyframe = keyframes.find(kf => kf.id === transition.from);
    if (!fromKeyframe) return;

    const isSpring = transition.curve === 'spring';

    if (isSpring) {
      // Real spring physics: animate each element property frame-by-frame
      const mass = transition.springMass ?? 1;
      const stiffness = transition.springStiffness ?? 200;
      const damping = transition.springDamping ?? 0.8;
      const dur = transition.duration || 800;

      setIsTransitioning(true);

      const startPlay = () => {
        const startTime = performance.now();
        const fromEls = useEditorStore.getState().sharedElements;
        const toEls = useEditorStore.getState().sharedElements;

        const tick = () => {
          const elapsed = performance.now() - startTime;
          const t = Math.min(elapsed / dur, 1);
          const springT = solveSpringRK4(t, mass, stiffness, damping);

          // Interpolate elements
          const interpolated = fromEls.map(fromEl => {
            const toEl = toEls.find(e => e.id === fromEl.id);
            if (!toEl) return fromEl;
            return {
              ...fromEl,
              position: {
                x: fromEl.position.x + (toEl.position.x - fromEl.position.x) * springT,
                y: fromEl.position.y + (toEl.position.y - fromEl.position.y) * springT,
              },
              size: {
                width: fromEl.size.width + (toEl.size.width - fromEl.size.width) * springT,
                height: fromEl.size.height + (toEl.size.height - fromEl.size.height) * springT,
              },
              style: {
                ...fromEl.style,
                opacity: ((fromEl.style?.opacity ?? 1) + ((toEl.style?.opacity ?? 1) - (fromEl.style?.opacity ?? 1)) * springT),
                borderRadius: ((fromEl.style?.borderRadius ?? 0) + ((toEl.style?.borderRadius ?? 0) - (fromEl.style?.borderRadius ?? 0)) * springT),
                rotation: ((fromEl.style?.rotation ?? 0) + ((toEl.style?.rotation ?? 0) - (fromEl.style?.rotation ?? 0)) * springT),
                scale: ((fromEl.style?.scale ?? 1) + ((toEl.style?.scale ?? 1) - (fromEl.style?.scale ?? 1)) * springT),
              },
            } as KeyElement;
          });

          smartAnimateActions.setElements(interpolated);

          if (t < 1) {
            springRafRef.current = requestAnimationFrame(tick);
          } else {
            smartAnimateActions.setElements(toEls);
            setCurrentKeyframeId(transition.to);
            setIsTransitioning(false);
          }
        };

        springRafRef.current = requestAnimationFrame(tick);
      };

      if (transition.delay) {
        setTimeout(startPlay, transition.delay);
      } else {
        startPlay();
      }
    } else if (useSmartAnimateMode && (
      transition.curve === 'spring-gentle' ||
      transition.curve === 'spring-bouncy' ||
      transition.curve === 'spring-stiff'
    )) {
      const springConfig = getSpringConfigFromCurve(transition.curve);
      setIsTransitioning(true);
      setTimeout(() => {
        smartAnimateActions.animateTo(useEditorStore.getState().sharedElements, {
          springConfig: { ...springConfig, duration: transition.duration / 1000 },
        });
        setCurrentKeyframeId(transition.to);
        setTimeout(() => setIsTransitioning(false), transition.duration);
      }, transition.delay || 0);
    } else {
      setIsTransitioning(true);
      setTransitionDuration(transition.duration);
      setTransitionCurve(getTransitionEasing(transition));
      setTimeout(() => {
        setCurrentKeyframeId(transition.to);
        setTimeout(() => setIsTransitioning(false), transition.duration);
      }, transition.delay || 0);
    }
  }, [isTransitioning, smartAnimateState.isAnimating, keyframes, useSmartAnimateMode, smartAnimateActions]);

  // ─── Trigger handler ──────────────────────────────────────────────
  const handleTrigger = useCallback((triggerType: TriggerType, _elementId?: string) => {
    const match = availableTransitions.find((t: any) => {
      if (t.triggers?.length) return t.triggers.some((tr: any) => tr.type === triggerType);
      return t.trigger === triggerType;
    });
    if (match) executeTransition(match);
  }, [availableTransitions, executeTransition]);

  // ─── Timer triggers ───────────────────────────────────────────────
  useEffect(() => {
    timerRefs.current.forEach((t: any) => clearTimeout(t));
    timerRefs.current.clear();
    availableTransitions.forEach(transition => {
      const timerTrigger = transition.triggers?.find((t: any) => t.type === 'timer');
      if (timerTrigger?.timerDelay) {
        timerRefs.current.set(transition.id, setTimeout(() => executeTransition(transition), timerTrigger.timerDelay));
      } else if (transition.trigger === 'timer') {
        timerRefs.current.set(transition.id, setTimeout(() => executeTransition(transition), 1000));
      }
    });
    return () => { timerRefs.current.forEach(t => clearTimeout(t)); };
  }, [currentKeyframeId, availableTransitions, executeTransition]);

  // ─── Patch-based timer triggers ───────────────────────────────────
  useEffect(() => {
    if (patches.length === 0) return;
    const cleanup = startAllTimerTriggers(patches, patchConnections, patchHandlers);
    return cleanup;
  }, [patches, patchConnections, patchHandlers]);

  // ─── Preview transition (triggered from TransitionInspector) ──────
  useEffect(() => {
    if (!previewTransitionId) return;
    const transition = transitions.find(t => t.id === previewTransitionId);
    if (!transition) { setPreviewTransitionId(null); return; }

    // Jump to the "from" keyframe first, then play the transition
    setCurrentKeyframeId(transition.from);
    smartAnimateActions.setElements(
      useEditorStore.getState().sharedElements
    );

    const playTimer = setTimeout(() => {
      executeTransition(transition);
    }, 120); // small delay so the "from" state renders first

    const clearTimer = setTimeout(() => {
      setPreviewTransitionId(null);
    }, 120 + (transition.delay || 0) + transition.duration + 100);

    return () => { clearTimeout(playTimer); clearTimeout(clearTimer); };
  }, [previewTransitionId]);

  // ─── Trigger hints ────────────────────────────────────────────────
  const triggerHints = useMemo(() => {
    const hints: string[] = [];
    availableTransitions.forEach((t: any) => {
      if (t.triggers?.length) t.triggers.forEach((tr: any) => hints.push(tr.type));
      else if (t.trigger) hints.push(t.trigger);
    });
    return [...new Set(hints)];
  }, [availableTransitions]);

  // ─── Scale calculation (fit frameSize into container) ──────────────
  const padding = 16;
  const fitScale = Math.min(
    (containerSize.width - padding * 2) / frameSize.width,
    (containerSize.height - padding * 2) / frameSize.height,
    1,
  );

  void springRafRef; // used by transition logic

  // ─── Status indicator ─────────────────────────────────────────────
  const isAnimating = isTransitioning || smartAnimateState.isAnimating;
  const displayStateName = currentDisplayState?.name;
  const statusText = smartAnimateState.isAnimating
    ? '🎬 Animating...'
    : isTransitioning ? '⚡ Transitioning...'
    : displayStateName ? `◆ ${displayStateName}` : currentKeyframe?.name || '—';
  const statusColor = isAnimating ? '#22c55e' : '#71717a';

  // ═════════════════════════════════════════════════════════════════════
  // Render
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div style={styles.container}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerDot} />
          <span style={styles.headerTitle}>Preview</span>
        </div>
        <select
          value={deviceFrame}
          onChange={e => useEditorStore.getState().setDeviceFrame(e.target.value as any)}
          style={{
            background: '#1a1a1a', border: '1px solid #333', borderRadius: 4,
            color: '#ccc', fontSize: 10, padding: '2px 4px', cursor: 'pointer',
          }}
        >
          <option value="none">No Frame</option>
          <option value="iphone-14-pro">iPhone 14 Pro</option>
          <option value="iphone-14">iPhone 14</option>
          <option value="iphone-se">iPhone SE</option>
          <option value="android">Android</option>
          <option value="ipad">iPad</option>
        </select>
        <span style={{ ...styles.headerStatus, color: statusColor }}>
          {statusText}
        </span>
      </div>

      {/* ── Preview Area (fit to container) ─────────────────────────── */}
      <div
        id="live-preview-container"
        ref={containerRef}
        style={styles.previewArea}
      >
        <div style={{
          transform: `scale(${fitScale})`,
          transformOrigin: 'center center',
        }}>
          <DeviceFrame type={deviceFrame} width={frameSize.width} height={frameSize.height}>
          <div style={{
            width: frameSize.width,
            height: frameSize.height,
            background: '#050506',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <PreviewContent
              elements={elements}
              onTrigger={handleTrigger}
              transitionDuration={transitionDuration}
              transitionCurve={transitionCurve}
              availableTriggers={triggerHints}
              onPrototypeNavigation={handlePrototypeNavigation}
              currentFrameId={currentKeyframeId}
              prototypeTransition={prototypeTransition}
              onPatchTap={handlePatchTap}
              onPatchHover={handlePatchHover}
              onPatchDrag={handlePatchDrag}
              onPatchScroll={handlePatchScroll}
              displayStateId={previewDisplayStateId}
            />
          </div>
          </DeviceFrame>
        </div>
      </div>
    </div>
  );
}

// ─── Trigger icon helper ──────────────────────────────────────────────
// ─── Element style helpers (match CanvasElement rendering) ────────────
function computeElementBackground(el: KeyElement): string {
  const isText = el.shapeType === 'text';
  const isImage = el.shapeType === 'image';
  const isLine = el.shapeType === 'line';
  const isPath = el.shapeType === 'path';
  if (isText || isImage || isLine || isPath) return 'transparent';

  const style = el.style;
  if (style?.gradientType && style.gradientType !== 'none' && style.gradientStops?.length) {
    const stops = style.gradientStops.map(s => `${s.color} ${s.position}%`).join(', ');
    if (style.gradientType === 'linear') {
      return `linear-gradient(${style.gradientAngle ?? 180}deg, ${stops})`;
    }
    if (style.gradientType === 'radial') {
      const cx = style.gradientCenterX ?? 50;
      const cy = style.gradientCenterY ?? 50;
      return `radial-gradient(circle at ${cx}% ${cy}%, ${stops})`;
    }
  }
  return style?.fill || '#3b82f6';
}

function computeBorderRadius(el: KeyElement): string | number {
  if (el.shapeType === 'ellipse') return '50%';
  const style = el.style;
  if (style?.borderRadiusTL !== undefined || style?.borderRadiusTR !== undefined ||
      style?.borderRadiusBR !== undefined || style?.borderRadiusBL !== undefined) {
    const tl = style.borderRadiusTL ?? style.borderRadius ?? 0;
    const tr = style.borderRadiusTR ?? style.borderRadius ?? 0;
    const br = style.borderRadiusBR ?? style.borderRadius ?? 0;
    const bl = style.borderRadiusBL ?? style.borderRadius ?? 0;
    return `${tl}px ${tr}px ${br}px ${bl}px`;
  }
  return style?.borderRadius ?? 8;
}

function computeBoxShadow(el: KeyElement): string {
  const shadows: string[] = [];
  if (el.style?.shadowColor && el.style.shadowBlur) {
    const x = el.style.shadowOffsetX || 0;
    const y = el.style.shadowOffsetY || 0;
    const blur = el.style.shadowBlur || 0;
    const spread = el.style.shadowSpread || 0;
    shadows.push(`${x}px ${y}px ${blur}px ${spread}px ${el.style.shadowColor}`);
  }
  if (el.style?.innerShadowEnabled && el.style.innerShadowColor) {
    const x = el.style.innerShadowX || 0;
    const y = el.style.innerShadowY || 0;
    const blur = el.style.innerShadowBlur || 4;
    shadows.push(`inset ${x}px ${y}px ${blur}px ${el.style.innerShadowColor}`);
  }
  return shadows.length > 0 ? shadows.join(', ') : 'none';
}

function computeTransform(el: KeyElement): string | undefined {
  return [
    el.style?.rotation ? `rotate(${el.style.rotation}deg)` : '',
    el.style?.flipX ? 'scaleX(-1)' : '',
    el.style?.flipY ? 'scaleY(-1)' : '',
    el.style?.scale && el.style.scale !== 1 ? `scale(${el.style.scale})` : '',
    el.style?.skewX ? `skewX(${el.style.skewX}deg)` : '',
    el.style?.skewY ? `skewY(${el.style.skewY}deg)` : '',
  ].filter(Boolean).join(' ') || undefined;
}

function computeFilter(el: KeyElement): string | undefined {
  return [
    el.style?.blur ? `blur(${el.style.blur}px)` : '',
    el.style?.brightness ? `brightness(${el.style.brightness})` : '',
    el.style?.contrast ? `contrast(${el.style.contrast})` : '',
    el.style?.saturate ? `saturate(${el.style.saturate})` : '',
    el.style?.hueRotate ? `hue-rotate(${el.style.hueRotate}deg)` : '',
    el.style?.invert ? `invert(${el.style.invert})` : '',
    el.style?.grayscale ? `grayscale(${el.style.grayscale})` : '',
    el.style?.sepia ? `sepia(${el.style.sepia})` : '',
    el.style?.dropShadowX !== undefined ? `drop-shadow(${el.style.dropShadowX || 0}px ${el.style.dropShadowY || 0}px ${el.style.dropShadowBlur || 0}px ${el.style.dropShadowColor || '#000'})` : '',
  ].filter(Boolean).join(' ') || undefined;
}

function computeStroke(el: KeyElement): string | undefined {
  if (el.shapeType === 'text') return undefined;
  if (el.style?.strokeWidth && el.style.stroke) {
    const style = el.style.strokeStyle || 'solid';
    return `${el.style.strokeWidth}px ${style} ${el.style.stroke}`;
  }
  return undefined;
}

// ─── PreviewContent ───────────────────────────────────────────────────
function PreviewContent({
  elements,
  onTrigger,
  transitionDuration,
  transitionCurve,
  availableTriggers,
  onPrototypeNavigation,
  currentFrameId,
  prototypeTransition,
  onPatchTap,
  onPatchHover,
  onPatchDrag,
  onPatchScroll: onPatchScroll,
  displayStateId: _displayStateId,
}: {
  elements: KeyElement[];
  onTrigger: (type: TriggerType, elementId?: string) => void;
  transitionDuration: number;
  transitionCurve: string;
  availableTriggers: string[];
  onPrototypeNavigation?: (link: PrototypeLink, fromFrameId: string) => void;
  currentFrameId?: string;
  prototypeTransition?: {
    active: boolean;
    type: PrototypeTransitionType;
    direction?: PrototypeTransitionDirection;
    duration: number;
    easing: string;
    phase: 'out' | 'in';
  } | null;
  onPatchTap?: (elementId: string) => boolean;
  onPatchHover?: (elementId: string, phase: 'in' | 'out') => boolean;
  onPatchDrag?: (elementId: string, phase: 'start' | 'move' | 'end', delta: { dx: number; dy: number }) => boolean;
  onPatchScroll?: () => boolean;
  displayStateId?: string | null;
}) {
  const dragStartRef = useRef<{ x: number; y: number; elementId?: string } | null>(null);
  const isDraggingRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, elementId?: string) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY, elementId };
    isDraggingRef.current = false;
    // Fire Patch drag start
    if (elementId && onPatchDrag) {
      onPatchDrag(elementId, 'start', { dx: 0, dy: 0 });
    }
    // Long press detection
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    if (elementId) {
      longPressTimerRef.current = setTimeout(() => {
        if (!isDraggingRef.current && dragStartRef.current?.elementId === elementId) {
          const store = useEditorStore.getState();
          const lp = store.patches.filter((p: any) => p.type === 'tap' && p.config?.targetElementId === elementId);
          lp.forEach((p: any) => {
            const conn = store.patchConnections.find((c: any) => c.fromPatchId === p.id && c.fromPortId === 'onLongPress');
            if (conn) store.flashPatch(p.id);
          });
        }
      }, 500);
    }
  }, [onPatchDrag]);

  const handleMouseUp = useCallback((e: React.MouseEvent, elementId?: string) => {
    // Clear longPress timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 20) {
        isDraggingRef.current = true;
        // Legacy drag trigger
        if (availableTriggers.includes('drag')) {
          onTrigger('drag', elementId);
        }
        // Patch drag end
        if (elementId && onPatchDrag) {
          onPatchDrag(elementId, 'end', { dx, dy });
        }
      }
    }
    // Only fire tap if it wasn't a drag
    if (!isDraggingRef.current) {
      // Try Patch-driven tap first
      const patchHandled = elementId && onPatchTap ? onPatchTap(elementId) : false;
      // Fall back to legacy transition triggers
      if (!patchHandled && availableTriggers.includes('tap')) {
        onTrigger('tap', elementId);
      }
    }
    dragStartRef.current = null;
    isDraggingRef.current = false;
  }, [availableTriggers, onTrigger, onPatchTap, onPatchDrag]);

  const handleMouseEnter = useCallback((elementId: string) => {
    // Patch hover in
    if (onPatchHover) onPatchHover(elementId, 'in');
    // Legacy hover trigger
    if (availableTriggers.includes('hover')) onTrigger('hover', elementId);
  }, [availableTriggers, onTrigger, onPatchHover]);

  const handleMouseLeave = useCallback((elementId: string) => {
    // Patch hover out
    if (onPatchHover) onPatchHover(elementId, 'out');
  }, [onPatchHover]);

  // Scroll trigger (debounced)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleWheel = useCallback((_e: React.WheelEvent) => {
    if (scrollTimerRef.current) return; // debounce
    // Try Patch-driven scroll first
    const patchHandled = onPatchScroll ? onPatchScroll() : false;
    // Fall back to legacy trigger
    if (!patchHandled && availableTriggers.includes('scroll')) {
      onTrigger('scroll');
    }
    scrollTimerRef.current = setTimeout(() => { scrollTimerRef.current = null; }, 500);
  }, [availableTriggers, onTrigger, onPatchScroll]);

  const hasDrag = availableTriggers.includes('drag');
  const hasTap = availableTriggers.includes('tap');
  const hasHover = availableTriggers.includes('hover');

  // Transition animation style for prototype links
  const contentStyle: React.CSSProperties = (() => {
    if (!prototypeTransition?.active) return {};
    const { type, direction, duration, easing, phase } = prototypeTransition;
    const base: React.CSSProperties = { transition: `all ${duration}ms ${easing}` };
    if (type === 'dissolve') return { ...base, opacity: phase === 'out' ? 0 : 1 };
    if (type === 'slideIn' || type === 'push') {
      const dirMap: Record<string, string> = {
        left: phase === 'in' ? 'translateX(100%)' : 'translateX(-100%)',
        right: phase === 'in' ? 'translateX(-100%)' : 'translateX(100%)',
        top: phase === 'in' ? 'translateY(100%)' : 'translateY(-100%)',
        bottom: phase === 'in' ? 'translateY(-100%)' : 'translateY(100%)',
      };
      return { ...base, transform: phase === 'out' ? (dirMap[direction || 'left']) : 'translate(0,0)' };
    }
    return base;
  })();

  // Separate top-level elements and children for group rendering
  const topLevelElements = elements.filter(el => !el.parentId);
  const getChildren = (parentId: string) => elements.filter(el => el.parentId === parentId);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', ...contentStyle }} onWheel={handleWheel}>
      {topLevelElements.map(el => {
        if (el.visible === false) return null;
        const children = getChildren(el.id);
        const isGroupEl = children.length > 0;

        return (
          <PreviewElement
            key={el.id}
            el={el}
            isGroupEl={isGroupEl}
            transitionDuration={transitionDuration}
            transitionCurve={transitionCurve}
            hasDrag={hasDrag}
            hasTap={hasTap}
            hasHover={hasHover}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onPatchDrag={onPatchDrag}
            onPrototypeNavigation={onPrototypeNavigation}
            currentFrameId={currentFrameId}
            dragStartRef={dragStartRef}
          >
            {isGroupEl && children.map(child => {
              if (child.visible === false) return null;
              return (
                <PreviewElement
                  key={child.id}
                  el={child}
                  isGroupEl={false}
                  transitionDuration={transitionDuration}
                  transitionCurve={transitionCurve}
                  hasDrag={hasDrag}
                  hasTap={hasTap}
                  hasHover={hasHover}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onPatchDrag={onPatchDrag}
                  onPrototypeNavigation={onPrototypeNavigation}
                  currentFrameId={currentFrameId}
                  dragStartRef={dragStartRef}
                />
              );
            })}
          </PreviewElement>
        );
      })}
    </div>
  );
}

// ─── PreviewElement ───────────────────────────────────────────────────
function PreviewElement({
  el,
  isGroupEl,
  transitionDuration,
  transitionCurve,
  hasDrag,
  hasTap,
  hasHover,
  onMouseDown,
  onMouseUp,
  onMouseEnter,
  onMouseLeave,
  onPatchDrag,
  onPrototypeNavigation,
  currentFrameId,
  dragStartRef,
  children,
}: {
  el: KeyElement;
  isGroupEl: boolean;
  transitionDuration: number;
  transitionCurve: string;
  hasDrag: boolean;
  hasTap: boolean;
  hasHover: boolean;
  onMouseDown: (e: React.MouseEvent, id?: string) => void;
  onMouseUp: (e: React.MouseEvent, id?: string) => void;
  onMouseEnter: (id: string) => void;
  onMouseLeave: (id: string) => void;
  onPatchDrag?: (id: string, phase: 'start' | 'move' | 'end', delta: { dx: number; dy: number }) => boolean;
  onPrototypeNavigation?: (link: any, fromFrameId: string) => void;
  currentFrameId?: string;
  dragStartRef: React.MutableRefObject<{ x: number; y: number; elementId?: string } | null>;
  children?: React.ReactNode;
}) {
  const hasProtoLink = (el as any)?.prototypeLink?.enabled && (el as any)?.prototypeLink?.targetFrameId;
  const handleElClick = (e: React.MouseEvent) => {
    if (hasProtoLink && onPrototypeNavigation && currentFrameId) {
      e.stopPropagation();
      onPrototypeNavigation((el as any)?.prototypeLink!, currentFrameId);
    }
  };

  const isText = el.shapeType === 'text';
  const isImage = el.shapeType === 'image';
  const isLine = el.shapeType === 'line';
  const isPath = el.shapeType === 'path';
  const bg = isGroupEl ? 'transparent' : computeElementBackground(el);
  const br = isGroupEl ? 0 : computeBorderRadius(el);
  const shadow = isGroupEl ? 'none' : computeBoxShadow(el);
  const transformStr = computeTransform(el);
  const filterStr = isGroupEl ? undefined : computeFilter(el);
  const strokeBorder = isGroupEl ? undefined : computeStroke(el);

  return (
    <div
      onMouseDown={(e) => onMouseDown(e, el.id)}
      onMouseUp={(e) => onMouseUp(e, el.id)}
      onMouseEnter={() => onMouseEnter(el.id)}
      onMouseLeave={() => onMouseLeave(el.id)}
      onMouseMove={(e) => {
        if (dragStartRef.current && dragStartRef.current.elementId === el.id) {
          const dx = e.clientX - dragStartRef.current.x;
          const dy = e.clientY - dragStartRef.current.y;
          if (Math.sqrt(dx * dx + dy * dy) > 10 && onPatchDrag) {
            onPatchDrag(el.id, 'move', { dx, dy });
          }
        }
      }}
      onClick={handleElClick}
      style={{
        position: 'absolute',
        left: el.position.x,
        top: el.position.y,
        width: el.size.width,
        height: el.size.height,
        background: bg,
        opacity: isGroupEl ? 1 : (el.style?.fillOpacity ?? 1),
        borderRadius: br,
        border: strokeBorder,
        transform: transformStr,
        transformOrigin: el.style?.transformOrigin || 'center',
        boxShadow: shadow,
        filter: filterStr,
        backdropFilter: isGroupEl ? undefined : (el.style?.backdropFilter || (el.style?.backdropBlur ? `blur(${el.style.backdropBlur}px)` : undefined)),
        mixBlendMode: el.style?.blendMode as React.CSSProperties['mixBlendMode'],
        clipPath: isGroupEl ? undefined : (el.style?.clipPath || undefined),
        maskImage: isGroupEl ? undefined : (el.style?.maskImage || undefined),
        transition: `all ${transitionDuration}ms ${transitionCurve}`,
        cursor: hasProtoLink ? 'pointer' : hasDrag ? 'grab' : hasTap ? 'pointer' : hasHover ? 'pointer' : 'default',
        display: 'flex',
        alignItems: isText ? undefined : 'center',
        justifyContent: isText ? undefined : 'center',
        color: el.style?.textColor || '#fff',
        fontSize: el.style?.fontSize || 14,
        fontWeight: el.style?.fontWeight || 'normal',
        fontStyle: el.style?.fontStyle || 'normal',
        textDecoration: el.style?.textDecoration || 'none',
        fontFamily: el.style?.fontFamily || 'Inter, sans-serif',
        letterSpacing: el.style?.letterSpacing ?? 0,
        lineHeight: el.style?.lineHeight ?? 1.4,
        overflow: isGroupEl ? 'visible' : (el.style?.overflow || 'hidden'),
        userSelect: 'none',
      }}
    >
      {/* Image element */}
      {isImage && el.style?.imageSrc && (
        <img
          src={el.style.imageSrc}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: el.style.objectFit || 'cover',
            objectPosition: el.style.objectPosition || 'center',
            borderRadius: br,
            pointerEvents: 'none',
          }}
          draggable={false}
        />
      )}
      {/* Line element */}
      {isLine && (
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
          <line
            x1="0" y1="0"
            x2={el.size.width} y2={el.size.height}
            stroke={el.style?.stroke || '#ffffff'}
            strokeWidth={el.style?.strokeWidth || 2}
            strokeLinecap="round"
          />
        </svg>
      )}
      {/* Path element */}
      {isPath && el.style?.pathData && (
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
          <path
            d={el.style.pathData}
            fill={el.style?.pathClosed ? (el.style?.fill || 'transparent') : 'none'}
            stroke={el.style?.stroke || '#ffffff'}
            strokeWidth={el.style?.strokeWidth || 2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {/* Text element */}
      {isText && (
        <div
          style={{
            padding: el.style?.padding ? `${el.style.padding}px` : '0 8px',
            width: '100%',
            textAlign: el.style?.textAlign || 'center',
            display: 'flex',
            alignItems: el.style?.verticalAlign === 'top' ? 'flex-start' : el.style?.verticalAlign === 'bottom' ? 'flex-end' : 'center',
            justifyContent: el.style?.textAlign || 'center',
            height: '100%',
            whiteSpace: el.style?.whiteSpace || 'normal',
            textTransform: el.style?.textTransform as React.CSSProperties['textTransform'],
            textShadow: el.style?.textShadow || undefined,
          }}
          dangerouslySetInnerHTML={
            (el.style as any)?.richTextHtml
              ? { __html: (el.style as any).richTextHtml }
              : undefined
          }
        >
          {!(el.style as any)?.richTextHtml && (el.text ?? 'Text')}
        </div>
      )}
      {/* Non-text element with text content */}
      {!isText && !isGroupEl && el.text && (
        <span style={{
          color: el.style?.textColor || '#fff',
          fontSize: el.style?.fontSize || 14,
          fontFamily: el.style?.fontFamily || 'Inter, sans-serif',
          fontWeight: el.style?.fontWeight || 'normal',
          textAlign: (el.style?.textAlign as React.CSSProperties['textAlign']) || 'center',
          padding: 4,
          userSelect: 'none',
        }}>
          {el.text}
        </span>
      )}
      {/* Group children */}
      {children}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#0a0a0b',
    borderLeft: '1px solid rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#22c55e',
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#e4e4e7',
    letterSpacing: '0.02em',
  },
  headerStatus: {
    fontSize: 10,
    fontWeight: 500,
  },
  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    flexShrink: 0,
  },
  select: {
    flex: 1,
    background: '#18181b',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 6,
    color: '#a1a1aa',
    fontSize: 11,
    padding: '4px 8px',
    outline: 'none',
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
  },
  checkbox: {
    width: 14,
    height: 14,
    accentColor: '#3b82f6',
  },
  triggerRow: {
    display: 'flex',
    gap: 4,
    padding: '4px 12px',
    flexWrap: 'wrap' as const,
    flexShrink: 0,
  },
  triggerBadge: {
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 10,
    background: 'rgba(59,130,246,0.10)',
    color: '#60a5fa',
    border: '1px solid rgba(59,130,246,0.15)',
  },
  previewArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    overflow: 'hidden',
    background: '#050506',
  },
  dotGrid: {
    position: 'absolute' as const,
    inset: 0,
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
    backgroundSize: '20px 20px',
    pointerEvents: 'none' as const,
  },
  zoomRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  zoomBtn: {
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 6,
    color: '#a1a1aa',
    fontSize: 14,
    cursor: 'pointer',
  },
  slider: {
    flex: 1,
    height: 4,
    accentColor: '#3b82f6',
  },
  zoomLabel: {
    fontSize: 10,
    color: '#71717a',
    minWidth: 32,
    textAlign: 'center' as const,
  },
  actionRow: {
    display: 'flex',
    gap: 6,
    padding: '6px 12px 8px',
    flexShrink: 0,
  },
  actionBtn: {
    flex: 1,
    padding: '5px 0',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    color: '#a1a1aa',
    fontSize: 11,
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
};