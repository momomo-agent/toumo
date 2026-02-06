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

type DeviceFrame = typeof DEVICE_FRAMES[number];

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

// ─── Helper: build CSS background from element style ──────────────────
function buildBackground(el: KeyElement): string {
  const style = el.style;
  if (!style) return '#3b82f6';

  // Gradient takes priority
  if (style.gradientType && style.gradientType !== 'none' && style.gradientStops?.length) {
    const stops = style.gradientStops.map(s => `${s.color} ${s.position}%`).join(', ');
    if (style.gradientType === 'radial') return `radial-gradient(circle, ${stops})`;
    const angle = style.gradientAngle ?? 180;
    return `linear-gradient(${angle}deg, ${stops})`;
  }

  return style.fill || '#3b82f6';
}

// ─── Helper: build CSS filter string ──────────────────────────────────
function buildFilter(el: KeyElement): string | undefined {
  const s = el.style;
  if (!s) return undefined;
  const parts: string[] = [];
  if (s.blur) parts.push(`blur(${s.blur}px)`);
  if (s.brightness != null && s.brightness !== 1) parts.push(`brightness(${s.brightness})`);
  if (s.contrast != null && s.contrast !== 1) parts.push(`contrast(${s.contrast})`);
  if (s.saturate != null && s.saturate !== 1) parts.push(`saturate(${s.saturate})`);
  if (s.hueRotate) parts.push(`hue-rotate(${s.hueRotate}deg)`);
  if (s.grayscale) parts.push(`grayscale(${s.grayscale})`);
  if (s.sepia) parts.push(`sepia(${s.sepia})`);
  if (s.invert) parts.push(`invert(${s.invert})`);
  return parts.length ? parts.join(' ') : undefined;
}

// ─── Helper: build CSS transform string ───────────────────────────────
function buildTransform(el: KeyElement, hovered: boolean): string {
  const s = el.style;
  const parts: string[] = [];
  if (s?.rotation) parts.push(`rotate(${s.rotation}deg)`);
  if (s?.scale != null && s.scale !== 1) parts.push(`scale(${s.scale})`);
  if (s?.skewX) parts.push(`skewX(${s.skewX}deg)`);
  if (s?.skewY) parts.push(`skewY(${s.skewY}deg)`);
  if (s?.flipX) parts.push('scaleX(-1)');
  if (s?.flipY) parts.push('scaleY(-1)');
  if (hovered) parts.push('scale(1.02)');
  return parts.length ? parts.join(' ') : 'none';
}

// ─── Helper: build border-radius ──────────────────────────────────────
function buildBorderRadius(el: KeyElement): string | number {
  const s = el.style;
  if (el.shapeType === 'ellipse') return '50%';
  if (!s) return 8;
  // Per-corner radii
  const tl = s.borderRadiusTL ?? s.borderTopLeftRadius ?? s.borderRadius ?? 8;
  const tr = s.borderRadiusTR ?? s.borderTopRightRadius ?? s.borderRadius ?? 8;
  const br = s.borderRadiusBR ?? s.borderBottomRightRadius ?? s.borderRadius ?? 8;
  const bl = s.borderRadiusBL ?? s.borderBottomLeftRadius ?? s.borderRadius ?? 8;
  if (tl === tr && tr === br && br === bl) return tl;
  return `${tl}px ${tr}px ${br}px ${bl}px`;
}

// ─── Helper: build box-shadow ─────────────────────────────────────────
function buildBoxShadow(el: KeyElement): string | undefined {
  const s = el.style;
  if (!s) return undefined;
  const parts: string[] = [];
  if (s.shadowColor && (s.shadowBlur || s.shadowOffsetX || s.shadowOffsetY)) {
    parts.push(`${s.shadowOffsetX || 0}px ${s.shadowOffsetY || 0}px ${s.shadowBlur || 0}px ${s.shadowSpread || 0}px ${s.shadowColor}`);
  }
  if (s.innerShadowEnabled && s.innerShadowColor) {
    parts.push(`inset ${s.innerShadowX || 0}px ${s.innerShadowY || 0}px ${s.innerShadowBlur || 4}px ${s.innerShadowColor}`);
  }
  return parts.length ? parts.join(', ') : undefined;
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