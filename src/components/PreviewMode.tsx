import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Transition, KeyElement, TriggerType, Size, InteractionAction, PrototypeLink, PrototypeTransitionType, PrototypeTransitionDirection, PrototypeTransitionEasing } from '../types';
import { clearPreviewHash, type ProjectData } from '../utils/shareUtils';
import { useGestureHandler } from '../hooks/useGestureHandler';
import { useSpringAnimation, SpringPresets } from '../hooks/useSpringAnimation';

// Easing functions for prototype transitions
const prototypeEasings: Record<PrototypeTransitionEasing, string> = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

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
  const { keyframes, transitions, frameSize, canvasBackground, interactions = [], variables = [] } = projectData;
  
  const [currentKeyframeId, setCurrentKeyframeId] = useState<string>(keyframes[0]?.id || '');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState(300);
  const [transitionCurve, setTransitionCurve] = useState('ease-out');
  const [showControls, setShowControls] = useState(true);
  
  // 元素状态管理 (用于交互系统)
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
  
  // Navigation history for "back" functionality
  const navigationHistory = useRef<string[]>([]);

  const currentKeyframe = keyframes.find(kf => kf.id === currentKeyframeId);
  const elements = currentKeyframe?.keyElements || [];
  const availableTransitions = transitions.filter(t => t.from === currentKeyframeId);

  // 状态切换处理
  const handleStateChange = useCallback((elementId: string, stateId: string, animation?: InteractionAction['animation']) => {
    console.log('[Preview] State change:', elementId, '->', stateId);
    setElementStates(prev => {
      const next = new Map(prev);
      next.set(elementId, stateId);
      return next;
    });
    
    // 如果有动画配置，设置过渡
    if (animation) {
      setTransitionDuration(animation.duration);
      setTransitionCurve(animation.easing || 'ease-out');
    }
  }, []);

  // 变量更新处理
  const handleVariableChange = useCallback((variableId: string, value: string | number | boolean) => {
    console.log('[Preview] Variable change:', variableId, '=', value);
    setVariableValues(prev => {
      const next = new Map(prev);
      next.set(variableId, value);
      return next;
    });
  }, []);

  // Prototype link navigation handler
  const handlePrototypeNavigation = useCallback((link: PrototypeLink, fromFrameId: string) => {
    if (!link.enabled || !link.targetFrameId || isTransitioning || prototypeTransition?.active) return;
    
    let targetId = link.targetFrameId;
    
    // Handle "back" navigation
    if (targetId === 'back') {
      const prevFrame = navigationHistory.current.pop();
      if (!prevFrame) return;
      targetId = prevFrame;
    } else {
      // Add current frame to history
      navigationHistory.current.push(fromFrameId);
    }
    
    const targetKeyframe = keyframes.find(kf => kf.id === targetId);
    if (!targetKeyframe) return;
    
    const { type, direction, duration, easing } = link.transition;
    const easingCss = prototypeEasings[easing] || 'ease-out';
    
    // Instant transition
    if (type === 'instant') {
      setCurrentKeyframeId(targetId);
      return;
    }
    
    // Animated transition
    setPrototypeTransition({
      active: true,
      type,
      direction,
      duration,
      easing: easingCss,
      fromFrameId,
      toFrameId: targetId,
      phase: 'out',
    });
    
    // After half duration, switch frame and start "in" phase
    setTimeout(() => {
      setCurrentKeyframeId(targetId);
      setPrototypeTransition(prev => prev ? { ...prev, phase: 'in' } : null);
    }, type === 'dissolve' || type === 'smartAnimate' ? duration / 2 : duration);
    
    // Complete transition
    setTimeout(() => {
      setPrototypeTransition(null);
    }, duration);
  }, [keyframes, isTransitioning, prototypeTransition]);

  // 导航处理 (切换 keyframe)
  const handleNavigate = useCallback((frameId: string) => {
    console.log('[Preview] Navigate to:', frameId);
    const targetKeyframe = keyframes.find(kf => kf.id === frameId);
    if (targetKeyframe) {
      setCurrentKeyframeId(frameId);
    }
  }, [keyframes]);

  // 转换 variables 为 useGestureHandler 需要的格式
  const variablesForHook = useMemo(() => {
    return variables.map(v => ({
      ...v,
      currentValue: variableValues.get(v.id) ?? v.defaultValue,
    }));
  }, [variables, variableValues]);

  // 使用手势处理器
  const { ref: gestureRef, isActive } = useGestureHandler({
    interactions,
    variables: variablesForHook,
    enabled: true,
    onStateChange: handleStateChange,
    onVariableChange: handleVariableChange,
    onNavigate: handleNavigate,
    onOpenUrl: (url, newTab) => {
      if (newTab) {
        window.open(url, '_blank');
      } else {
        window.location.href = url;
      }
    },
    onGesture: (gesture, elementId, x, y) => {
      console.log('[Preview] Gesture:', gesture, 'on', elementId, 'at', x, y);
    },
  });

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

  // Timer triggers
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
    // 从 transitions 获取
    availableTransitions.forEach(t => {
      if (t.triggers?.length) t.triggers.forEach(trigger => hints.push(trigger.type));
      else if (t.trigger) hints.push(t.trigger);
    });
    // 从 interactions 获取
    interactions.forEach(i => {
      if (i.enabled && i.gesture?.type) {
        hints.push(i.gesture.type);
      }
    });
    return [...new Set(hints)];
  };
  const triggerHints = getTriggerHints();

  const handleReset = useCallback(() => {
    setCurrentKeyframeId(keyframes[0]?.id || '');
    setElementStates(new Map());
    setVariableValues(() => {
      const map = new Map();
      variables.forEach(v => map.set(v.id, v.defaultValue));
      return map;
    });
  }, [keyframes, variables]);

  const handleEdit = useCallback(() => { clearPreviewHash(); onEnterEditMode(); }, [onEnterEditMode]);

  // Auto-hide controls
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
      <div style={{ ...controlsStyle, opacity: showControls ? 1 : 0, pointerEvents: showControls ? 'auto' : 'none' }}>
        <div style={controlsInnerStyle}>
          <span style={stateNameStyle}>{currentKeyframe?.name || 'Preview'}</span>
          {isActive && <span style={activeBadgeStyle}>🎯 Interactive</span>}
          {triggerHints.length > 0 && (
            <div style={hintsStyle}>
              {triggerHints.slice(0, 4).map(hint => (
                <span key={hint} style={hintBadgeStyle}>{getTriggerIcon(hint)} {hint}</span>
              ))}
            </div>
          )}
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
  const icons: Record<string, string> = {
    tap: '👆', doubleTap: '👆👆', longPress: '✋',
    hover: '🖱️', hoverEnter: '➡️', hoverLeave: '⬅️',
    drag: '✋', pan: '✋', panStart: '✋', panMove: '↔️', panEnd: '✋',
    swipe: '👉', timer: '⏱️',
    press: '👇', release: '👆',
    pinch: '🤏', rotate: '🔄',
    focus: '🎯', blur: '💨',
  };
  return icons[trigger] || '⚡';
}

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
    { elements, frameSize, canvasBackground, onTrigger, transitionDuration, transitionCurve, availableTriggers, elementStates, hasInteractions, onPrototypeNavigation, currentFrameId, prototypeTransition },
    ref
  ) {
    const [hoveredElement, setHoveredElement] = useState<string | null>(null);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);

    const handleClick = () => { if (availableTriggers.includes('tap')) onTrigger('tap'); };
    const handleMouseEnter = (id: string) => { 
      setHoveredElement(id); 
      if (availableTriggers.includes('hover')) onTrigger('hover'); 
    };
    const handleMouseDown = (e: React.MouseEvent) => { dragStartRef.current = { x: e.clientX, y: e.clientY }; };
    const handleMouseUp = (e: React.MouseEvent) => {
      if (dragStartRef.current && availableTriggers.includes('drag')) {
        const dx = e.clientX - dragStartRef.current.x, dy = e.clientY - dragStartRef.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 20) onTrigger('drag');
      }
      dragStartRef.current = null;
    };

    const scale = Math.min((window.innerWidth * 0.9) / frameSize.width, (window.innerHeight * 0.85) / frameSize.height, 1);
    
    // Calculate transition animation styles
    const getTransitionStyle = (): React.CSSProperties => {
      if (!prototypeTransition?.active) return {};
      
      const { type, direction, duration, easing, phase } = prototypeTransition;
      const isOut = phase === 'out';
      
      switch (type) {
        case 'dissolve':
          return {
            opacity: isOut ? 0 : 1,
            transition: `opacity ${duration / 2}ms ${easing}`,
          };
        case 'moveIn':
        case 'slideIn': {
          if (isOut) return {};
          const offset = direction === 'left' ? '-100%' : direction === 'right' ? '100%' : direction === 'top' ? '-100%' : '100%';
          const axis = direction === 'left' || direction === 'right' ? 'X' : 'Y';
          return {
            transform: `translate${axis}(0)`,
            transition: `transform ${duration}ms ${easing}`,
          };
        }
        case 'moveOut':
        case 'slideOut': {
          if (!isOut) return {};
          const offset = direction === 'left' ? '-100%' : direction === 'right' ? '100%' : direction === 'top' ? '-100%' : '100%';
          const axis = direction === 'left' || direction === 'right' ? 'X' : 'Y';
          return {
            transform: `translate${axis}(${offset})`,
            transition: `transform ${duration}ms ${easing}`,
          };
        }
        case 'push': {
          const offset = direction === 'left' ? '-100%' : direction === 'right' ? '100%' : direction === 'top' ? '-100%' : '100%';
          const axis = direction === 'left' || direction === 'right' ? 'X' : 'Y';
          return {
            transform: isOut ? `translate${axis}(${offset})` : `translate${axis}(0)`,
            transition: `transform ${duration}ms ${easing}`,
          };
        }
        default:
          return {};
      }
    };

    return (
      <div 
        ref={ref}
        style={{ 
          width: frameSize.width, 
          height: frameSize.height, 
          background: canvasBackground, 
          borderRadius: 12, 
          position: 'relative', 
          overflow: 'hidden', 
          transform: `scale(${scale})`, 
          transformOrigin: 'center', 
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', 
          cursor: hasInteractions || availableTriggers.includes('tap') ? 'pointer' : 'default' 
        }}
        onClick={handleClick} 
        onMouseDown={handleMouseDown} 
        onMouseUp={handleMouseUp}
      >
        {elements.map(el => (
          <PreviewElement
            key={el.id}
            element={el}
            isHovered={hoveredElement === el.id}
            currentState={elementStates.get(el.id)}
            transitionDuration={transitionDuration}
            transitionCurve={transitionCurve}
            onMouseEnter={() => handleMouseEnter(el.id)}
            onMouseLeave={() => setHoveredElement(null)}
          />
        ))}
      </div>
    );
  }
);

interface PreviewElementProps {
  element: KeyElement;
  isHovered: boolean;
  currentState?: string;
  transitionDuration: number;
  transitionCurve: string;
  useSpring?: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function PreviewElement({ 
  element: el, 
  isHovered, 
  currentState: _currentState,
  transitionDuration, 
  transitionCurve,
  useSpring = true,
  onMouseEnter,
  onMouseLeave,
}: PreviewElementProps) {
  // 弹簧动画 hook
  const { values, animateTo } = useSpringAnimation({
    initialValues: {
      x: el.position.x,
      y: el.position.y,
      width: el.size.width,
      height: el.size.height,
      opacity: el.style?.fillOpacity ?? 1,
      scale: 1,
    },
    config: {
      ...SpringPresets.default,
      duration: transitionDuration / 1000,
    },
  });

  // 当 hover 状态变化时触发弹簧动画
  useEffect(() => {
    if (useSpring) {
      animateTo({
        x: el.position.x,
        y: el.position.y,
        width: el.size.width,
        height: el.size.height,
        opacity: el.style?.fillOpacity ?? 1,
        scale: isHovered ? 1.02 : 1,
      });
    }
  }, [isHovered, el.position.x, el.position.y, el.size.width, el.size.height, el.style?.fillOpacity, useSpring, animateTo]);

  // 使用弹簧动画值或 CSS transition
  const style: React.CSSProperties = useSpring ? {
    position: 'absolute',
    left: values.x ?? el.position.x,
    top: values.y ?? el.position.y,
    width: values.width ?? el.size.width,
    height: values.height ?? el.size.height,
    background: el.style?.fill || '#3b82f6',
    opacity: values.opacity ?? 1,
    borderRadius: el.shapeType === 'ellipse' ? '50%' : (el.style?.borderRadius || 8),
    transform: `scale(${values.scale ?? 1})`,
    cursor: 'pointer',
  } : {
    position: 'absolute',
    left: el.position.x,
    top: el.position.y,
    width: el.size.width,
    height: el.size.height,
    background: el.style?.fill || '#3b82f6',
    opacity: el.style?.fillOpacity ?? 1,
    borderRadius: el.shapeType === 'ellipse' ? '50%' : (el.style?.borderRadius || 8),
    transition: `all ${transitionDuration}ms ${transitionCurve}`,
    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
    cursor: 'pointer',
  };

  return (
    <div 
      data-element-id={el.id}
      onMouseEnter={onMouseEnter} 
      onMouseLeave={onMouseLeave}
      style={style}
    >
      {el.shapeType === 'text' && el.text && (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: el.style?.textColor || '#fff', 
          fontSize: el.style?.fontSize || 14,
          pointerEvents: 'none',
        }}>
          {el.text}
        </div>
      )}
    </div>
  );
}

// Need to import React for forwardRef
import React from 'react';

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

const activeBadgeStyle: React.CSSProperties = {
  padding: '4px 8px',
  background: '#166534',
  borderRadius: 6,
  fontSize: 11,
  color: '#4ade80',
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
