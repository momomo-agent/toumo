import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useEditorStore } from '../../store';
import type { Transition, KeyElement, TriggerType } from '../../types';
import { useSmartAnimate } from '../../hooks/useSmartAnimate';
import { SpringPresets } from '../../engine/SpringAnimation';

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
  const { keyframes, transitions, selectedKeyframeId, frameSize } = useEditorStore();

  const [deviceFrame, setDeviceFrame] = useState('iphone15pro');
  const [zoom, setZoom] = useState(100);
  const [isZoomLocked, setIsZoomLocked] = useState(false);

  // State machine
  const [currentKeyframeId, setCurrentKeyframeId] = useState<string>(selectedKeyframeId);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState(300);
  const [transitionCurve, setTransitionCurve] = useState('ease-out');

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
  const currentKeyframe = keyframes.find(kf => kf.id === currentKeyframeId);
  const elements = smartAnimateState.isAnimating
    ? smartAnimateState.elements
    : (currentKeyframe?.keyElements || []);
  const device = DEVICE_FRAMES.find(d => d.id === deviceFrame) || DEVICE_FRAMES[0];
  const availableTransitions = transitions.filter(t => t.from === currentKeyframeId);

  // ─── Execute transition ───────────────────────────────────────────
  const executeTransition = useCallback((transition: Transition) => {
    if (isTransitioning || smartAnimateState.isAnimating) return;
    const targetKeyframe = keyframes.find(kf => kf.id === transition.to);
    if (!targetKeyframe) return;

    const shouldUseSmartAnimate = useSmartAnimateMode &&
      (transition.curve === 'spring' || transition.curve === 'spring-gentle' ||
       transition.curve === 'spring-bouncy' || transition.curve === 'spring-stiff');

    if (shouldUseSmartAnimate) {
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
    const initial = keyframes.find(kf => kf.id === 'kf-idle') || keyframes[0];
    if (initial) setCurrentKeyframeId(initial.id);
  }, [keyframes]);

  // ─── Status indicator ─────────────────────────────────────────────
  const isAnimating = isTransitioning || smartAnimateState.isAnimating;
  const statusText = smartAnimateState.isAnimating
    ? '🎬 Animating...'
    : isTransitioning ? '⚡ Transitioning...' : currentKeyframe?.name || '—';
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

// ─── PreviewContent ───────────────────────────────────────────────────
function PreviewContent({
  elements,
  onTrigger,
  transitionDuration,
  transitionCurve,
  availableTriggers,
}: {
  elements: KeyElement[];
  onTrigger: (type: TriggerType, elementId?: string) => void;
  transitionDuration: number;
  transitionCurve: string;
  availableTriggers: string[];
}) {
  const dragStartRef = useRef<{ x: number; y: number; elementId?: string } | null>(null);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent, elementId?: string) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY, elementId };
    isDraggingRef.current = false;
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent, elementId?: string) => {
    if (dragStartRef.current && availableTriggers.includes('drag')) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 20) {
        onTrigger('drag', elementId);
        isDraggingRef.current = true;
      }
    }
    // Only fire tap if it wasn't a drag
    if (!isDraggingRef.current && availableTriggers.includes('tap')) {
      onTrigger('tap', elementId);
    }
    dragStartRef.current = null;
    isDraggingRef.current = false;
  }, [availableTriggers, onTrigger]);

  const handleMouseEnter = useCallback((elementId: string) => {
    if (availableTriggers.includes('hover')) onTrigger('hover', elementId);
  }, [availableTriggers, onTrigger]);

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

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} onWheel={handleWheel}>
      {elements.map(el => (
        <div
          key={el.id}
          onMouseDown={(e) => handleMouseDown(e, el.id)}
          onMouseUp={(e) => handleMouseUp(e, el.id)}
          onMouseEnter={() => handleMouseEnter(el.id)}
          style={{
            position: 'absolute',
            left: el.position.x,
            top: el.position.y,
            width: el.size.width,
            height: el.size.height,
            background: el.style?.fill || '#3b82f6',
            opacity: el.style?.opacity ?? 1,
            borderRadius: el.style?.borderRadius ?? 8,
            border: el.style?.stroke ? `${el.style.strokeWidth || 1}px solid ${el.style.stroke}` : undefined,
            transition: `all ${transitionDuration}ms ${transitionCurve}`,
            cursor: hasDrag ? 'grab' : hasTap ? 'pointer' : hasHover ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {el.text && (
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
      ))}
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