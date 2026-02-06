import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Transition, KeyElement, TriggerType, Size, InteractionAction, PrototypeLink, PrototypeTransitionType, PrototypeTransitionDirection, PrototypeTransitionEasing } from '../types';
import { clearPreviewHash, type ProjectData } from '../utils/shareUtils';
import { useGestureHandler } from '../hooks/useGestureHandler';

// ─── Device Frame Definitions ─────────────────────────────────────────
const DEVICE_FRAMES = [
  { id: 'none', label: 'No Frame', width: 0, height: 0, radius: 0, notch: 'none' as const },
  { id: 'iphone15pro', label: 'iPhone 15 Pro', width: 393, height: 852, radius: 55, notch: 'island' as const },
  { id: 'iphone14', label: 'iPhone 14', width: 390, height: 844, radius: 47, notch: 'notch' as const },
  { id: 'iphonese', label: 'iPhone SE', width: 375, height: 667, radius: 0, notch: 'none' as const },
  { id: 'pixel7', label: 'Pixel 7', width: 412, height: 915, radius: 28, notch: 'punch' as const },
  { id: 'galaxys23', label: 'Galaxy S23', width: 360, height: 780, radius: 24, notch: 'punch' as const },
  { id: 'ipadmini', label: 'iPad Mini', width: 744, height: 1133, radius: 18, notch: 'none' as const },
  { id: 'ipadpro11', label: 'iPad Pro 11"', width: 834, height: 1194, radius: 18, notch: 'none' as const },
] as const;

// ─── Easing helpers ───────────────────────────────────────────────────
const prototypeEasings: Record<PrototypeTransitionEasing, string> = {
  linear: 'linear', ease: 'ease', easeIn: 'ease-in',
  easeOut: 'ease-out', easeInOut: 'ease-in-out',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

const easingFunctions: Record<string, string> = {
  'linear': 'linear', 'ease': 'ease', 'ease-in': 'ease-in',
  'ease-out': 'ease-out', 'ease-in-out': 'ease-in-out',
  'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  'spring-gentle': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  'spring-bouncy': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

function getTransitionEasing(t: Transition): string {
  if (t.cubicBezier) { const [x1,y1,x2,y2] = t.cubicBezier; return `cubic-bezier(${x1},${y1},${x2},${y2})`; }
  return easingFunctions[t.curve] || t.curve || 'ease-out';
}

function getTriggerIcon(trigger: string): string {
  const m: Record<string, string> = {
    tap:'👆', doubleTap:'👆👆', longPress:'✋', hover:'🖱️',
    drag:'✋', pan:'✋', swipe:'👉', timer:'⏱️',
    press:'👇', release:'👆', pinch:'🤏', rotate:'🔄',
  };
  return m[trigger] || '⚡';
}

// ─── Props ────────────────────────────────────────────────────────────
interface PreviewModeProps {
  projectData: ProjectData;
  onEnterEditMode: () => void;
}

// ═══════════════════════════════════════════════════════════════════════
// Main PreviewMode Component
// ═══════════════════════════════════════════════════════════════════════
export function PreviewMode({ projectData, onEnterEditMode }: PreviewModeProps) {
  const { keyframes, transitions, frameSize, canvasBackground, interactions = [], variables = [] } = projectData;

  const [currentKeyframeId, setCurrentKeyframeId] = useState<string>(keyframes[0]?.id || '');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState(300);
  const [transitionCurve, setTransitionCurve] = useState('ease-out');
  const [showControls, setShowControls] = useState(true);
  const [deviceFrame, setDeviceFrame] = useState('iphone15pro');

  // Element state management
  const [elementStates, setElementStates] = useState<Map<string, string>>(new Map());
  const [variableValues, setVariableValues] = useState<Map<string, string | number | boolean>>(() => {
    const map = new Map();
    variables.forEach(v => map.set(v.id, v.defaultValue));
    return map;
  });

  const timerRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Prototype link transition state
  const [prototypeTransition, setPrototypeTransition] = useState<{
    active: boolean;
    type: PrototypeTransitionType;
    direction?: PrototypeTransitionDirection;
    duration: number;
    easing: string;
    fromFrameId: string;
    toFrameId: string;
    phase: 'out' | 'in';
  } | null>(null);

  const navigationHistory = useRef<string[]>([]);

  const currentKeyframe = keyframes.find(kf => kf.id === currentKeyframeId);
  const elements = currentKeyframe?.keyElements || [];
  const availableTransitions = transitions.filter(t => t.from === currentKeyframeId);
  const device: { id: string; label: string; width: number; height: number; radius: number; notch: string } =
    DEVICE_FRAMES.find(d => d.id === deviceFrame) || DEVICE_FRAMES[0];

  // ─── Exit preview ────────────────────────────────────────────────
  const handleEdit = useCallback(() => { clearPreviewHash(); onEnterEditMode(); }, [onEnterEditMode]);

  // ─── Escape key to exit preview ──────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); handleEdit(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleEdit]);

  // ─── Interaction callbacks ───────────────────────────────────────
  const handleStateChange = useCallback((elementId: string, stateId: string, animation?: InteractionAction['animation']) => {
    setElementStates(prev => { const n = new Map(prev); n.set(elementId, stateId); return n; });
    if (animation) { setTransitionDuration(animation.duration); setTransitionCurve(animation.easing || 'ease-out'); }
  }, []);

  const handleVariableChange = useCallback((variableId: string, value: string | number | boolean) => {
    setVariableValues(prev => { const n = new Map(prev); n.set(variableId, value); return n; });
  }, []);

  const handleNavigate = useCallback((frameId: string) => {
    if (keyframes.find(kf => kf.id === frameId)) setCurrentKeyframeId(frameId);
  }, [keyframes]);

  // ─── Prototype link navigation ───────────────────────────────────
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
    setPrototypeTransition({ active: true, type, direction, duration, easing: easingCss, fromFrameId, toFrameId: targetId, phase: 'out' });
    setTimeout(() => {
      setCurrentKeyframeId(targetId);
      setPrototypeTransition(p => p ? { ...p, phase: 'in' } : null);
    }, type === 'dissolve' || type === 'smartAnimate' ? duration / 2 : duration);
    setTimeout(() => setPrototypeTransition(null), duration);
  }, [keyframes, isTransitioning, prototypeTransition]);

  // ─── Gesture handler hook ────────────────────────────────────────
  const variablesForHook = useMemo(() =>
    variables.map(v => ({ ...v, currentValue: variableValues.get(v.id) ?? v.defaultValue })),
    [variables, variableValues],
  );

  const { ref: gestureRef, isActive } = useGestureHandler({
    interactions,
    variables: variablesForHook,
    enabled: true,
    onStateChange: handleStateChange,
    onVariableChange: handleVariableChange,
    onNavigate: handleNavigate,
    onOpenUrl: (url, newTab) => { newTab ? window.open(url, '_blank') : (window.location.href = url); },
  });

  // ─── Transition execution ────────────────────────────────────────
  const executeTransition = useCallback((transition: Transition) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTransitionDuration(transition.duration);
    setTransitionCurve(getTransitionEasing(transition));
    setTimeout(() => {
      setCurrentKeyframeId(transition.to);
      setTimeout(() => setIsTransitioning(false), transition.duration);
    }, transition.delay || 0);
  }, [isTransitioning]);

  const handleTrigger = useCallback((triggerType: TriggerType) => {
    const match = availableTransitions.find(t => {
      if (t.triggers?.length) return t.triggers.some(tr => tr.type === triggerType);
      return t.trigger === triggerType;
    });
    if (match) executeTransition(match);
  }, [availableTransitions, executeTransition]);

  // ─── Timer triggers ──────────────────────────────────────────────
  useEffect(() => {
    timerRefs.current.forEach(t => clearTimeout(t));
    timerRefs.current.clear();
    availableTransitions.forEach(tr => {
      const tt = tr.triggers?.find(t => t.type === 'timer');
      if (tt?.timerDelay) {
        timerRefs.current.set(tr.id, setTimeout(() => executeTransition(tr), tt.timerDelay));
      } else if (tr.trigger === 'timer') {
        timerRefs.current.set(tr.id, setTimeout(() => executeTransition(tr), 1000));
      }
    });
    return () => { timerRefs.current.forEach(t => clearTimeout(t)); };
  }, [currentKeyframeId, availableTransitions, executeTransition]);

  // ─── Trigger hints ───────────────────────────────────────────────
  const triggerHints = useMemo(() => {
    const hints: string[] = [];
    availableTransitions.forEach(t => {
      if (t.triggers?.length) t.triggers.forEach(tr => hints.push(tr.type));
      else if (t.trigger) hints.push(t.trigger);
    });
    interactions.forEach(i => { if (i.enabled && i.gesture?.type) hints.push(i.gesture.type); });
    return [...new Set(hints)];
  }, [availableTransitions, interactions]);

  // ─── Reset ───────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setCurrentKeyframeId(keyframes[0]?.id || '');
    setElementStates(new Map());
    setVariableValues(() => { const m = new Map(); variables.forEach(v => m.set(v.id, v.defaultValue)); return m; });
    navigationHistory.current = [];
  }, [keyframes, variables]);

  // ─── Auto-hide controls ──────────────────────────────────────────
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const onMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener('mousemove', onMove);
    timeout = setTimeout(() => setShowControls(false), 3000);
    return () => { window.removeEventListener('mousemove', onMove); clearTimeout(timeout); };
  }, []);

  // ─── Scale calculation ───────────────────────────────────────────
  const contentWidth = device.id === 'none' ? frameSize.width : device.width;
  const contentHeight = device.id === 'none' ? frameSize.height : device.height;
  const bezel = device.id === 'none' ? 0 : 12;
  const totalW = contentWidth + bezel * 2;
  const totalH = contentHeight + bezel * 2;
  const scale = Math.min(
    (window.innerWidth * 0.9) / totalW,
    (window.innerHeight * 0.85) / totalH,
    1,
  );

  // ═════════════════════════════════════════════════════════════════
  // Render
  // ═════════════════════════════════════════════════════════════════
  return (
    <div style={S.container}>
      {/* Preview area */}
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
        {device.id !== 'none' ? (
          <DeviceFrameShell device={device as any}>
            <PreviewContent
              ref={gestureRef}
              elements={elements}
              frameSize={device.id === 'none' ? frameSize : { width: device.width, height: device.height }}
              canvasBackground={canvasBackground || '#0d0d0e'}
              onTrigger={handleTrigger}
              transitionDuration={transitionDuration}
              transitionCurve={transitionCurve}
              availableTriggers={triggerHints}
              elementStates={elementStates}
              hasInteractions={interactions.length > 0}
              onPrototypeNavigation={handlePrototypeNavigation}
              currentFrameId={currentKeyframeId}
              prototypeTransition={prototypeTransition}
            />
          </DeviceFrameShell>
        ) : (
          <PreviewContent
            ref={gestureRef}
            elements={elements}
            frameSize={frameSize}
            canvasBackground={canvasBackground || '#0d0d0e'}
            onTrigger={handleTrigger}
            transitionDuration={transitionDuration}
            transitionCurve={transitionCurve}
            availableTriggers={triggerHints}
            elementStates={elementStates}
            hasInteractions={interactions.length > 0}
            onPrototypeNavigation={handlePrototypeNavigation}
            currentFrameId={currentKeyframeId}
            prototypeTransition={prototypeTransition}
          />
        )}
      </div>

      {/* ── Controls bar ─────────────────────────────────────────── */}
      <div style={{ ...S.controls, opacity: showControls ? 1 : 0, pointerEvents: showControls ? 'auto' : 'none' }}>
        <div style={S.controlsInner}>
          {/* Frame name */}
          <span style={S.stateName}>{currentKeyframe?.name || 'Preview'}</span>

          {/* Interactive badge */}
          {isActive && <span style={S.activeBadge}>🎯 Interactive</span>}

          {/* Trigger hints */}
          {triggerHints.length > 0 && (
            <div style={S.hints}>
              {triggerHints.slice(0, 4).map(h => (
                <span key={h} style={S.hintBadge}>{getTriggerIcon(h)} {h}</span>
              ))}
            </div>
          )}

          {/* Device frame selector */}
          <select
            value={deviceFrame}
            onChange={e => setDeviceFrame(e.target.value)}
            style={S.deviceSelect}
          >
            {DEVICE_FRAMES.map(d => (
              <option key={d.id} value={d.id}>
                {d.label}{d.width > 0 ? ` ${d.width}×${d.height}` : ''}
              </option>
            ))}
          </select>

          {/* Action buttons */}
          <div style={S.buttons}>
            <button onClick={handleReset} style={S.btn}>↺ Reset</button>
            <button onClick={handleEdit} style={S.editBtn}>✏️ Edit</button>
          </div>
        </div>
      </div>

      {/* Escape hint */}
      <div style={S.escHint}>Press <kbd style={S.kbd}>Esc</kbd> to exit</div>

      {/* Branding */}
      <div style={S.branding}>Made with <span style={{ color: '#2563eb' }}>Toumo</span></div>
    </div>
  );
}

// ─── DeviceFrameShell ─────────────────────────────────────────────────
function DeviceFrameShell({ device, children }: { device: { id: string; width: number; height: number; radius: number; notch: string }; children: React.ReactNode }) {
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
        {device.notch === 'island' && (
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            width: 120, height: 36, borderRadius: 18, background: '#000', zIndex: 100,
          }} />
        )}
        {device.notch === 'notch' && (
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: 160, height: 34, borderRadius: '0 0 20px 20px', background: '#000', zIndex: 100,
          }} />
        )}
        {device.notch === 'punch' && (
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            width: 12, height: 12, borderRadius: '50%', background: '#000', zIndex: 100,
          }} />
        )}
        {children}
      </div>
    </div>
  );
}

// ─── PreviewContent ───────────────────────────────────────────────────
interface PreviewContentProps {
  elements: KeyElement[];
  frameSize: Size;
  canvasBackground: string;
  onTrigger: (type: TriggerType) => void;
  transitionDuration: number;
  transitionCurve: string;
  availableTriggers: string[];
  elementStates: Map<string, string>;
  hasInteractions: boolean;
  onPrototypeNavigation: (link: PrototypeLink, fromFrameId: string) => void;
  currentFrameId: string;
  prototypeTransition: {
    active: boolean;
    type: PrototypeTransitionType;
    direction?: PrototypeTransitionDirection;
    duration: number;
    easing: string;
    phase: 'out' | 'in';
  } | null;
}

const PreviewContent = React.forwardRef<HTMLDivElement, PreviewContentProps>(
  function PreviewContent(
    { elements, frameSize, canvasBackground, onTrigger, transitionDuration, transitionCurve,
      availableTriggers, elementStates: _elementStates, hasInteractions, onPrototypeNavigation,
      currentFrameId, prototypeTransition },
    ref,
  ) {
    const [_hoveredElement, setHoveredElement] = useState<string | null>(null);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);

    const handleClick = () => { if (availableTriggers.includes('tap')) onTrigger('tap'); };
    const handleMouseEnter = (id: string) => {
      setHoveredElement(id);
      if (availableTriggers.includes('hover')) onTrigger('hover');
    };
    const handleMouseDown = (e: React.MouseEvent) => {
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseUp = (e: React.MouseEvent) => {
      if (dragStartRef.current && availableTriggers.includes('drag')) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 20) onTrigger('drag');
      }
      dragStartRef.current = null;
    };

    // Scroll trigger (debounced)
    const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleWheel = (_e: React.WheelEvent) => {
      if (!availableTriggers.includes('scroll')) return;
      if (scrollTimerRef.current) return;
      onTrigger('scroll');
      scrollTimerRef.current = setTimeout(() => { scrollTimerRef.current = null; }, 500);
    };

    // Transition animation style
    const contentStyle: React.CSSProperties = (() => {
      if (!prototypeTransition?.active) return {};
      const { type, direction, duration, easing, phase } = prototypeTransition;
      const base: React.CSSProperties = { transition: `all ${duration}ms ${easing}` };
      if (type === 'dissolve') return { ...base, opacity: phase === 'out' ? 0 : 1 };
      if (type === 'slideIn' || type === 'push') {
        const dirMap: Record<string, string> = {
          left: phase === 'in' ? 'translateX(100%)' : 'translateX(-100%)',
          right: phase === 'in' ? 'translateX(-100%)' : 'translateX(100%)',
          up: phase === 'in' ? 'translateY(100%)' : 'translateY(-100%)',
          down: phase === 'in' ? 'translateY(-100%)' : 'translateY(100%)',
        };
        return { ...base, transform: phase === 'out' ? (dirMap[direction || 'left']) : 'translate(0,0)' };
      }
      return base;
    })();

    return (
      <div
        ref={ref}
        style={{
          width: frameSize.width,
          height: frameSize.height,
          background: canvasBackground,
          position: 'relative',
          overflow: 'hidden',
          cursor: hasInteractions ? 'pointer' : 'default',
          ...contentStyle,
        }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {elements.map(el => {
          const s = el.style;
          const elStyle: React.CSSProperties = {
            position: 'absolute',
            left: el.position.x,
            top: el.position.y,
            width: el.size.width,
            height: el.size.height,
            opacity: s?.opacity ?? 1,
            borderRadius: s?.borderRadius ?? 0,
            backgroundColor: s?.fill || 'transparent',
            transition: `all ${transitionDuration}ms ${transitionCurve}`,
            overflow: s?.overflow || 'hidden',
          };
          if (s?.rotation) elStyle.transform = `rotate(${s.rotation}deg)`;
          if (s?.shadowColor && s?.shadowBlur) {
            elStyle.boxShadow = `${s.shadowX ?? 0}px ${s.shadowY ?? 0}px ${s.shadowBlur}px ${s.shadowSpread ?? 0}px ${s.shadowColor}`;
          }
          if (s?.stroke && s?.strokeWidth) {
            elStyle.border = `${s.strokeWidth}px solid ${s.stroke}`;
          }

          const isImage = el.shapeType === 'image' || !!s?.imageSrc;
          const isText = el.shapeType === 'text' || (el.text != null && el.text !== '');

          const handleElClick = (e: React.MouseEvent) => {
            if (el.prototypeLink?.enabled) {
              e.stopPropagation();
              onPrototypeNavigation(el.prototypeLink, currentFrameId);
            }
          };

          return (
            <div
              key={el.id}
              style={elStyle}
              onClick={handleElClick}
              onMouseEnter={() => handleMouseEnter(el.id)}
              onMouseLeave={() => setHoveredElement(null)}
            >
              {isImage && s?.imageSrc && (
                <img src={s.imageSrc} alt={el.name || ''} style={{ width: '100%', height: '100%', objectFit: s?.objectFit || 'cover' }} draggable={false} />
              )}
              {isText && (
                <div style={{ fontSize: s?.fontSize || 16, color: s?.color || '#000', fontWeight: s?.fontWeight, textAlign: s?.textAlign as any, padding: s?.padding ?? 4, whiteSpace: 'pre-wrap' }}>
                  {el.text || el.name}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  },
);

// ─── Styles ───────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: '#0a0a0b',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column',
  },
  controls: {
    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
    transition: 'opacity 0.3s ease',
    zIndex: 10000,
  },
  controlsInner: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'rgba(30,30,32,0.95)',
    backdropFilter: 'blur(12px)',
    borderRadius: 16, padding: '10px 20px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  stateName: {
    color: '#fff', fontWeight: 600, fontSize: 14,
    whiteSpace: 'nowrap',
  },
  activeBadge: {
    background: 'rgba(37,99,235,0.2)', color: '#60a5fa',
    padding: '4px 10px', borderRadius: 8, fontSize: 12,
    whiteSpace: 'nowrap',
  },
  hints: {
    display: 'flex', gap: 6,
  },
  hintBadge: {
    background: 'rgba(255,255,255,0.08)', color: '#aaa',
    padding: '4px 8px', borderRadius: 6, fontSize: 11,
    whiteSpace: 'nowrap',
  },
  deviceSelect: {
    background: 'rgba(255,255,255,0.08)', color: '#ccc',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, padding: '6px 10px', fontSize: 12,
    outline: 'none', cursor: 'pointer',
  },
  buttons: {
    display: 'flex', gap: 8,
  },
  btn: {
    background: 'rgba(255,255,255,0.08)', color: '#ccc',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, padding: '6px 14px', fontSize: 12,
    cursor: 'pointer',
  },
  editBtn: {
    background: 'rgba(37,99,235,0.3)', color: '#93bbfc',
    border: '1px solid rgba(37,99,235,0.4)',
    borderRadius: 8, padding: '6px 14px', fontSize: 12,
    cursor: 'pointer',
  },
  escHint: {
    position: 'fixed', top: 16, right: 20,
    color: 'rgba(255,255,255,0.3)', fontSize: 12,
    zIndex: 10000,
  },
  kbd: {
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 4, padding: '2px 6px',
    border: '1px solid rgba(255,255,255,0.15)',
    fontSize: 11,
  },
  branding: {
    position: 'fixed', bottom: 8, right: 16,
    color: 'rgba(255,255,255,0.2)', fontSize: 11,
    zIndex: 10000,
  },
};
