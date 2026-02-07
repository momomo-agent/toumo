import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useEditorStore } from '../../store';
import type { Transition, KeyElement, TriggerType, PrototypeLink, PrototypeTransitionType, PrototypeTransitionDirection, PrototypeTransitionEasing } from '../../types';
import { useSmartAnimate } from '../../hooks/useSmartAnimate';
import { SpringPresets } from '../../engine/SpringAnimation';
import { solveSpringRK4 } from '../../data/curvePresets';
import { handleElementTap, handleElementHover, handleElementDrag, startAllTimerTriggers } from '../../engine/PatchRuntime';
import type { DragPhase } from '../../engine/PatchRuntime';

// ─── Prototype easing map ─────────────────────────────────────────────
const prototypeEasings: Record<PrototypeTransitionEasing, string> = {
  linear: 'linear', ease: 'ease', easeIn: 'ease-in',
  easeOut: 'ease-out', easeInOut: 'ease-in-out',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

// ─── Device Definitions ───────────────────────────────────────────────
const DEVICE_FRAMES = [
  { id: 'none', label: 'No Frame', width: 0, height: 0, radius: 0, notch: 'none' as const },
  { id: 'iphone15pro', label: 'iPhone 15 Pro', width: 393, height: 852, radius: 55, notch: 'island' as const },
  { id: 'iphone14pro', label: 'iPhone 14 Pro', width: 393, height: 852, radius: 55, notch: 'island' as const },
  { id: 'iphone14', label: 'iPhone 14', width: 390, height: 844, radius: 47, notch: 'notch' as const },
  { id: 'iphonese', label: 'iPhone SE', width: 375, height: 667, radius: 0, notch: 'none' as const },
  { id: 'pixel7', label: 'Pixel 7', width: 412, height: 915, radius: 28, notch: 'punch' as const },
  { id: 'galaxys23', label: 'Galaxy S23', width: 360, height: 780, radius: 24, notch: 'punch' as const },
  { id: 'ipadmini', label: 'iPad Mini', width: 744, height: 1133, radius: 18, notch: 'none' as const },
  { id: 'ipadpro11', label: 'iPad Pro 11"', width: 834, height: 1194, radius: 18, notch: 'none' as const },
] as const;

type DeviceFrameDef = typeof DEVICE_FRAMES[number];

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

  const [deviceFrame, setDeviceFrame] = useState('iphone15pro');
  const [zoom, setZoom] = useState(100);
  const [isZoomLocked, setIsZoomLocked] = useState(false);

  // State machine
  const [currentKeyframeId, setCurrentKeyframeId] = useState<string>(selectedKeyframeId);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState(300);
  const [transitionCurve, setTransitionCurve] = useState('ease-out');

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
      setPreviewDisplayStateId(targetId);
      setSelectedDisplayStateId(targetId);
    },
  }), [setSelectedDisplayStateId]);

  // Patch runtime: handle tap on element → switchDisplayState
  const handlePatchTap = useCallback((elementId: string) => {
    return handleElementTap(elementId, patches, patchConnections, patchHandlers);
  }, [patches, patchConnections, patchHandlers]);

  // Patch runtime: handle hover on element → onHoverIn / onHoverOut
  const handlePatchHover = useCallback((elementId: string, phase: 'in' | 'out') => {
    return handleElementHover(elementId, phase, patches, patchConnections, patchHandlers);
  }, [patches, patchConnections, patchHandlers]);

  // Patch runtime: handle drag on element → onDragStart / onDragMove / onDragEnd
  const handlePatchDrag = useCallback((elementId: string, phase: DragPhase, delta: { dx: number; dy: number }) => {
    return handleElementDrag(elementId, phase, delta, patches, patchConnections, patchHandlers);
  }, [patches, patchConnections, patchHandlers]);

  // Smart Animate
  const [useSmartAnimateMode, setUseSmartAnimateMode] = useState(true);
  const [smartAnimateState, smartAnimateActions] = useSmartAnimate([], {
    springConfig: { ...SpringPresets.default, duration: 0.4, useSpring: true },
    enabled: true,
  });

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
    const easingCss = prototypeEasings[easing] || 'ease-out';
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
      smartAnimateActions.setElements(kf.keyElements);
    }
  }, [currentKeyframeId, keyframes]);

  // ─── Derived state ────────────────────────────────────────────────
  const currentKeyframe = useMemo(() => keyframes.find(kf => kf.id === currentKeyframeId), [keyframes, currentKeyframeId]);
  const baseElements = useMemo(() =>
    smartAnimateState.isAnimating
      ? smartAnimateState.elements
      : (currentKeyframe?.keyElements || []),
    [smartAnimateState.isAnimating, smartAnimateState.elements, currentKeyframe],
  );

  // Apply DisplayState layer overrides to elements
  const currentDisplayState = displayStates.find(ds => ds.id === previewDisplayStateId);
  const elements = useMemo(() => {
    if (!currentDisplayState || currentDisplayState.layerOverrides.length === 0) {
      return baseElements;
    }
    return baseElements.map(el => {
      const override = currentDisplayState.layerOverrides.find(o => o.layerId === el.id);
      if (!override) return el;
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
          rotation: props.rotation ?? el.style?.rotation,
          scale: props.scale ?? el.style?.scale,
          fill: props.fill ?? el.style?.fill,
          borderRadius: props.borderRadius ?? el.style?.borderRadius,
          visibility: props.visible === false ? 'hidden' as const : el.style?.visibility,
        },
      } as KeyElement;
    });
  }, [baseElements, currentDisplayState]);

  const device = useMemo(() => DEVICE_FRAMES.find(d => d.id === deviceFrame) || DEVICE_FRAMES[0], [deviceFrame]);
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
        const fromEls = fromKeyframe.keyElements;
        const toEls = targetKeyframe.keyElements;

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
        smartAnimateActions.animateTo(targetKeyframe.keyElements, {
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
    const match = availableTransitions.find(t => {
      if (t.triggers?.length) return t.triggers.some(tr => tr.type === triggerType);
      return t.trigger === triggerType;
    });
    if (match) executeTransition(match);
  }, [availableTransitions, executeTransition]);

  // ─── Timer triggers ───────────────────────────────────────────────
  useEffect(() => {
    timerRefs.current.forEach(t => clearTimeout(t));
    timerRefs.current.clear();
    availableTransitions.forEach(transition => {
      const timerTrigger = transition.triggers?.find(t => t.type === 'timer');
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
      keyframes.find(k => k.id === transition.from)?.keyElements || []
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
    availableTransitions.forEach(t => {
      if (t.triggers?.length) t.triggers.forEach(tr => hints.push(tr.type));
      else if (t.trigger) hints.push(t.trigger);
    });
    return [...new Set(hints)];
  }, [availableTransitions]);

  // ─── Scale calculation ────────────────────────────────────────────
  const contentWidth = device.id === 'none' ? frameSize.width : device.width;
  const contentHeight = device.id === 'none' ? frameSize.height : device.height;
  const padding = device.id === 'none' ? 16 : 24; // extra padding for device bezel
  const autoScale = Math.min(
    (containerSize.width - padding * 2) / (contentWidth + (device.id !== 'none' ? 24 : 0)),
    (containerSize.height - padding * 2) / (contentHeight + (device.id !== 'none' ? 24 : 0)),
    1,
  );
  const effectiveScale = (zoom / 100) * autoScale;

  // ─── Wheel zoom ───────────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    if ((e.metaKey || e.ctrlKey) && !isZoomLocked) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoom(prev => Math.max(25, Math.min(200, prev + delta)));
    }
  }, [isZoomLocked]);

  useEffect(() => {
    const el = document.getElementById('live-preview-container');
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // ─── Reset ────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    if (springRafRef.current) cancelAnimationFrame(springRafRef.current);
    setIsTransitioning(false);
    const initial = keyframes.find(kf => kf.id === 'kf-idle') || keyframes[0];
    if (initial) setCurrentKeyframeId(initial.id);
  }, [keyframes]);

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
        <span style={{ ...styles.headerStatus, color: statusColor }}>
          {statusText}
        </span>
      </div>

      {/* ── Controls Row ───────────────────────────────────────────── */}
      <div style={styles.controlsRow}>
        <select
          value={deviceFrame}
          onChange={(e) => setDeviceFrame(e.target.value)}
          style={styles.select}
        >
          {DEVICE_FRAMES.map(d => (
            <option key={d.id} value={d.id}>
              {d.label}{d.width > 0 ? ` ${d.width}×${d.height}` : ''}
            </option>
          ))}
        </select>
        <label style={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={useSmartAnimateMode}
            onChange={(e) => setUseSmartAnimateMode(e.target.checked)}
            style={styles.checkbox}
          />
          <span style={{ fontSize: 10, color: '#a1a1aa' }}>Smart</span>
        </label>
      </div>

      {/* ── Trigger Hints ──────────────────────────────────────────── */}
      {triggerHints.length > 0 && (
        <div style={styles.triggerRow}>
          {triggerHints.map(hint => (
            <span key={hint} style={styles.triggerBadge}>
              {getTriggerIcon(hint)} {hint}
            </span>
          ))}
        </div>
      )}

      {/* ── Preview Area ───────────────────────────────────────────── */}
      <div
        id="live-preview-container"
        ref={containerRef}
        style={styles.previewArea}
      >
        {/* Subtle dot grid background */}
        <div style={styles.dotGrid} />

        <div style={{
          transform: `scale(${effectiveScale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {device.id !== 'none' ? (
            <DeviceFrameShell device={device}>
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
                displayStateId={previewDisplayStateId}
              />
            </DeviceFrameShell>
          ) : (
            <div style={{
              width: frameSize.width,
              height: frameSize.height,
              background: '#050506',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
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
                displayStateId={previewDisplayStateId}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Zoom Controls ──────────────────────────────────────────── */}
      <div style={styles.zoomRow}>
        <button onClick={() => setZoom(p => Math.max(25, p - 25))} style={styles.zoomBtn}>−</button>
        <input
          type="range" min="25" max="200" value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={styles.slider}
        />
        <button onClick={() => setZoom(p => Math.min(200, p + 25))} style={styles.zoomBtn}>+</button>
        <span style={styles.zoomLabel}>{zoom}%</span>
        <button
          onClick={() => setIsZoomLocked(!isZoomLocked)}
          style={{
            ...styles.zoomBtn,
            background: isZoomLocked ? 'rgba(245,158,11,0.12)' : 'transparent',
            borderColor: isZoomLocked ? '#f59e0b' : 'rgba(255,255,255,0.10)',
          }}
          title={isZoomLocked ? 'Unlock zoom' : 'Lock zoom'}
        >
          {isZoomLocked ? '🔒' : '🔓'}
        </button>
      </div>

      {/* ── Action Buttons ─────────────────────────────────────────── */}
      <div style={styles.actionRow}>
        <button onClick={handleReset} style={styles.actionBtn}>↺ Reset</button>
        <button onClick={() => setZoom(100)} style={styles.actionBtn}>1:1</button>
      </div>
    </div>
  );
}

// ─── Trigger icon helper ──────────────────────────────────────────────
function getTriggerIcon(trigger: string): string {
  switch (trigger) {
    case 'tap': return '👆';
    case 'hover': return '🖱️';
    case 'drag': return '✋';
    case 'scroll': return '📜';
    case 'timer': return '⏱️';
    case 'variable': return '📊';
    default: return '⚡';
  }
}

// ─── DeviceFrameShell ─────────────────────────────────────────────────
function DeviceFrameShell({ device, children }: { device: DeviceFrameDef; children: React.ReactNode }) {
  const bezel = 12;
  return (
    <div style={{
      width: device.width + bezel * 2,
      height: device.height + bezel * 2,
      borderRadius: device.radius + bezel,
      background: '#1a1a1a',
      border: '2px solid rgba(255,255,255,0.12)',
      padding: bezel,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        width: device.width,
        height: device.height,
        borderRadius: device.radius,
        background: '#050506',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Notch / Dynamic Island */}
        {device.notch === 'island' && (
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            width: 120, height: 36, borderRadius: 18,
            background: '#000', zIndex: 100,
          }} />
        )}
        {device.notch === 'notch' && (
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: 160, height: 34, borderRadius: '0 0 20px 20px',
            background: '#000', zIndex: 100,
          }} />
        )}
        {device.notch === 'punch' && (
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            width: 12, height: 12, borderRadius: '50%',
            background: '#000', zIndex: 100,
          }} />
        )}
        {children}
      </div>
    </div>
  );
}

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
  displayStateId?: string | null;
}) {
  const dragStartRef = useRef<{ x: number; y: number; elementId?: string } | null>(null);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent, elementId?: string) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY, elementId };
    isDraggingRef.current = false;
    // Fire Patch drag start
    if (elementId && onPatchDrag) {
      onPatchDrag(elementId, 'start', { dx: 0, dy: 0 });
    }
  }, [onPatchDrag]);

  const handleMouseUp = useCallback((e: React.MouseEvent, elementId?: string) => {
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
    if (!availableTriggers.includes('scroll')) return;
    if (scrollTimerRef.current) return; // debounce
    onTrigger('scroll');
    scrollTimerRef.current = setTimeout(() => { scrollTimerRef.current = null; }, 500);
  }, [availableTriggers, onTrigger]);

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

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', ...contentStyle }} onWheel={handleWheel}>
      {elements.map(el => {
        if (el.visible === false) return null;
        const hasProtoLink = el.prototypeLink?.enabled && el.prototypeLink?.targetFrameId;
        const handleElClick = (e: React.MouseEvent) => {
          if (hasProtoLink && onPrototypeNavigation && currentFrameId) {
            e.stopPropagation();
            onPrototypeNavigation(el.prototypeLink!, currentFrameId);
          }
        };

        const isText = el.shapeType === 'text';
        const isImage = el.shapeType === 'image';
        const isLine = el.shapeType === 'line';
        const isPath = el.shapeType === 'path';
        const bg = computeElementBackground(el);
        const br = computeBorderRadius(el);
        const shadow = computeBoxShadow(el);
        const transformStr = computeTransform(el);
        const filterStr = computeFilter(el);
        const strokeBorder = computeStroke(el);

        return (
          <div
            key={el.id}
            onMouseDown={(e) => handleMouseDown(e, el.id)}
            onMouseUp={(e) => handleMouseUp(e, el.id)}
            onMouseEnter={() => handleMouseEnter(el.id)}
            onMouseLeave={() => handleMouseLeave(el.id)}
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
              opacity: el.style?.fillOpacity ?? 1,
              borderRadius: br,
              border: strokeBorder,
              transform: transformStr,
              transformOrigin: el.style?.transformOrigin || 'center',
              boxShadow: shadow,
              filter: filterStr,
              backdropFilter: el.style?.backdropFilter || (el.style?.backdropBlur ? `blur(${el.style.backdropBlur}px)` : undefined),
              mixBlendMode: el.style?.blendMode as React.CSSProperties['mixBlendMode'],
              clipPath: el.style?.clipPath || undefined,
              maskImage: el.style?.maskImage || undefined,
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
              overflow: el.style?.overflow || 'hidden',
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
            {!isText && el.text && (
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
          </div>
        );
      })}
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