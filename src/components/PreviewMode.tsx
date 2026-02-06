import { useState, useEffect, useCallback, useRef } from 'react';
import type { Transition, KeyElement, TriggerType, Size } from '../types';
import { clearPreviewHash, type ProjectData } from '../utils/shareUtils';

interface PreviewModeProps {
  projectData: ProjectData;
  onEnterEditMode: () => void;
}

const easingFunctions: Record<string, string> = {
  'linear': 'linear',
  'ease': 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  'spring-gentle': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  'spring-bouncy': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

function getTransitionEasing(transition: Transition): string {
  if (transition.cubicBezier) {
    const [x1, y1, x2, y2] = transition.cubicBezier;
    return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
  }
  return easingFunctions[transition.curve] || transition.curve || 'ease-out';
}

export function PreviewMode({ projectData, onEnterEditMode }: PreviewModeProps) {
  const { keyframes, transitions, frameSize, canvasBackground } = projectData;
  
  const [currentKeyframeId, setCurrentKeyframeId] = useState<string>(keyframes[0]?.id || '');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState(300);
  const [transitionCurve, setTransitionCurve] = useState('ease-out');
  const [showControls, setShowControls] = useState(true);
  
  const timerRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const currentKeyframe = keyframes.find(kf => kf.id === currentKeyframeId);
  const elements = currentKeyframe?.keyElements || [];
  const availableTransitions = transitions.filter(t => t.from === currentKeyframeId);

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
    const matchingTransition = availableTransitions.find(t => {
      if (t.triggers && t.triggers.length > 0) {
        return t.triggers.some(trigger => trigger.type === triggerType);
      }
      return t.trigger === triggerType;
    });
    if (matchingTransition) executeTransition(matchingTransition);
  }, [availableTransitions, executeTransition]);

  useEffect(() => {
    timerRefs.current.forEach(timer => clearTimeout(timer));
    timerRefs.current.clear();
    availableTransitions.forEach(transition => {
      const timerTrigger = transition.triggers?.find(t => t.type === 'timer');
      if (timerTrigger && timerTrigger.timerDelay) {
        const timer = setTimeout(() => executeTransition(transition), timerTrigger.timerDelay);
        timerRefs.current.set(transition.id, timer);
      }
    });
    return () => { timerRefs.current.forEach(timer => clearTimeout(timer)); };
  }, [currentKeyframeId, availableTransitions, executeTransition]);

  const getTriggerHints = () => {
    const hints: string[] = [];
    availableTransitions.forEach(t => {
      if (t.triggers?.length) t.triggers.forEach(trigger => hints.push(trigger.type));
      else if (t.trigger) hints.push(t.trigger);
    });
    return [...new Set(hints)];
  };
  const triggerHints = getTriggerHints();

  const handleReset = useCallback(() => setCurrentKeyframeId(keyframes[0]?.id || ''), [keyframes]);
  const handleEdit = useCallback(() => { clearPreviewHash(); onEnterEditMode(); }, [onEnterEditMode]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    timeout = setTimeout(() => setShowControls(false), 3000);
    return () => { window.removeEventListener('mousemove', handleMouseMove); clearTimeout(timeout); };
  }, []);

  return (
    <div style={containerStyle}>
      <PreviewContent elements={elements} frameSize={frameSize} canvasBackground={canvasBackground || '#0d0d0e'}
        onTrigger={handleTrigger} transitionDuration={transitionDuration} transitionCurve={transitionCurve} availableTriggers={triggerHints} />
      <div style={{ ...controlsStyle, opacity: showControls ? 1 : 0, pointerEvents: showControls ? 'auto' : 'none' }}>
        <div style={controlsInnerStyle}>
          <span style={stateNameStyle}>{currentKeyframe?.name || 'Preview'}</span>
          {triggerHints.length > 0 && <div style={hintsStyle}>{triggerHints.map(hint => <span key={hint} style={hintBadgeStyle}>{getTriggerIcon(hint)} {hint}</span>)}</div>}
          <div style={buttonsStyle}>
            <button onClick={handleReset} style={buttonStyle}>↺ Reset</button>
            <button onClick={handleEdit} style={editButtonStyle}>✏️ Edit</button>
          </div>
        </div>
      </div>
      <div style={brandingStyle}>Made with <span style={{ color: '#2563eb' }}>Toumo</span></div>
    </div>
  );
}

function getTriggerIcon(trigger: string): string {
  switch (trigger) { case 'tap': return '👆'; case 'hover': return '🖱️'; case 'drag': return '✋'; case 'timer': return '⏱️'; default: return '⚡'; }
}

interface PreviewContentProps {
  elements: KeyElement[];
  frameSize: Size;
  canvasBackground: string;
  onTrigger: (type: TriggerType) => void;
  transitionDuration: number;
  transitionCurve: string;
  availableTriggers: string[];
}

function PreviewContent({ elements, frameSize, canvasBackground, onTrigger, transitionDuration, transitionCurve, availableTriggers }: PreviewContentProps) {
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleClick = () => { if (availableTriggers.includes('tap')) onTrigger('tap'); };
  const handleMouseEnter = (id: string) => { setHoveredElement(id); if (availableTriggers.includes('hover')) onTrigger('hover'); };
  const handleMouseDown = (e: React.MouseEvent) => { dragStartRef.current = { x: e.clientX, y: e.clientY }; };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStartRef.current && availableTriggers.includes('drag')) {
      const dx = e.clientX - dragStartRef.current.x, dy = e.clientY - dragStartRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 20) onTrigger('drag');
    }
    dragStartRef.current = null;
  };

  const scale = Math.min((window.innerWidth * 0.9) / frameSize.width, (window.innerHeight * 0.85) / frameSize.height, 1);

  return (
    <div style={{ width: frameSize.width, height: frameSize.height, background: canvasBackground, borderRadius: 12, position: 'relative', overflow: 'hidden', transform: `scale(${scale})`, transformOrigin: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', cursor: availableTriggers.includes('tap') ? 'pointer' : 'default' }}
      onClick={handleClick} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
      {elements.map(el => (
        <div key={el.id} onMouseEnter={() => handleMouseEnter(el.id)} onMouseLeave={() => setHoveredElement(null)}
          style={{ position: 'absolute', left: el.position.x, top: el.position.y, width: el.size.width, height: el.size.height, background: el.style?.fill || '#3b82f6', opacity: el.style?.fillOpacity ?? 1, borderRadius: el.shapeType === 'ellipse' ? '50%' : (el.style?.borderRadius || 8), transition: `all ${transitionDuration}ms ${transitionCurve}`, transform: hoveredElement === el.id ? 'scale(1.02)' : 'scale(1)' }}>
          {el.shapeType === 'text' && el.text && <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: el.style?.textColor || '#fff', fontSize: el.style?.fontSize || 14 }}>{el.text}</div>}
        </div>
      ))}
    </div>
  );
}

// Styles
const containerStyle: React.CSSProperties = {
  width: '100vw',
  height: '100vh',
  background: '#0a0a0b',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
};

const controlsStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 24,
  left: '50%',
  transform: 'translateX(-50%)',
  transition: 'opacity 0.3s ease',
  zIndex: 100,
};

const controlsInnerStyle: React.CSSProperties = {
  background: 'rgba(26, 26, 27, 0.95)',
  backdropFilter: 'blur(12px)',
  borderRadius: 12,
  border: '1px solid #333',
  padding: '12px 20px',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
};

const stateNameStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#fff',
};

const hintsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
};

const hintBadgeStyle: React.CSSProperties = {
  padding: '4px 10px',
  background: '#1e3a5f',
  borderRadius: 6,
  fontSize: 11,
  color: '#60a5fa',
};

const buttonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
};

const buttonStyle: React.CSSProperties = {
  padding: '8px 14px',
  background: '#2a2a2a',
  border: '1px solid #444',
  borderRadius: 6,
  color: '#ccc',
  fontSize: 12,
  cursor: 'pointer',
};

const editButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: '#2563eb',
  border: 'none',
  borderRadius: 6,
  color: '#fff',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

const brandingStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 24,
  right: 24,
  fontSize: 11,
  color: '#666',
};
