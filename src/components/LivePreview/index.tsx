import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditorStore } from '../../store';
import type { Transition, KeyElement, TriggerType } from '../../types';

const DEVICE_FRAMES = [
  { id: 'none', label: 'No Frame', width: 0, height: 0, radius: 0 },
  { id: 'iphone14', label: 'iPhone 14', width: 390, height: 844, radius: 47 },
  { id: 'iphone14pro', label: 'iPhone 14 Pro', width: 393, height: 852, radius: 55 },
  { id: 'iphone15pro', label: 'iPhone 15 Pro', width: 393, height: 852, radius: 55 },
  { id: 'iphonese', label: 'iPhone SE', width: 375, height: 667, radius: 0 },
  { id: 'pixel7', label: 'Pixel 7', width: 412, height: 915, radius: 28 },
  { id: 'galaxys23', label: 'Galaxy S23', width: 360, height: 780, radius: 24 },
  { id: 'ipadmini', label: 'iPad Mini', width: 744, height: 1133, radius: 18 },
  { id: 'ipadpro11', label: 'iPad Pro 11"', width: 834, height: 1194, radius: 18 },
];

// Easing functions for animations
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

// Get CSS easing from transition config
function getTransitionEasing(transition: Transition): string {
  // Custom cubic bezier takes priority
  if (transition.cubicBezier) {
    const [x1, y1, x2, y2] = transition.cubicBezier;
    return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
  }
  // Then check named easing
  return easingFunctions[transition.curve] || transition.curve || 'ease-out';
}

export function LivePreview() {
  const { keyframes, transitions, selectedKeyframeId, frameSize } = useEditorStore();
  
  const [deviceFrame, setDeviceFrame] = useState('iphone14');
  const [zoom, setZoom] = useState(100);
  const [isZoomLocked, setIsZoomLocked] = useState(false);
  
  // State machine state
  const [currentKeyframeId, setCurrentKeyframeId] = useState<string>(selectedKeyframeId);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState(300);
  const [transitionCurve, setTransitionCurve] = useState('ease-out');
  
  // Timer refs for timer triggers
  const timerRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  
  // Sync with editor selection when not in preview mode
  useEffect(() => {
    if (!isTransitioning) {
      setCurrentKeyframeId(selectedKeyframeId);
    }
  }, [selectedKeyframeId, isTransitioning]);

  const currentKeyframe = keyframes.find(kf => kf.id === currentKeyframeId);
  const elements = currentKeyframe?.keyElements || [];
  const device = DEVICE_FRAMES.find(d => d.id === deviceFrame) || DEVICE_FRAMES[0];

  // Find available transitions from current state
  const availableTransitions = transitions.filter(t => t.from === currentKeyframeId);

  // Execute a transition
  const executeTransition = useCallback((transition: Transition) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setTransitionDuration(transition.duration);
    setTransitionCurve(getTransitionEasing(transition));
    
    // Apply delay if specified
    setTimeout(() => {
      setCurrentKeyframeId(transition.to);
      
      // Reset transitioning state after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, transition.duration);
    }, transition.delay || 0);
  }, [isTransitioning]);

  // Find and execute transition by trigger type
  const handleTrigger = useCallback((triggerType: TriggerType, _elementId?: string) => {
    const matchingTransition = availableTransitions.find(t => {
      // Check new triggers array first
      if (t.triggers && t.triggers.length > 0) {
        return t.triggers.some(trigger => trigger.type === triggerType);
      }
      // Fall back to legacy trigger field
      return t.trigger === triggerType;
    });
    
    if (matchingTransition) {
      executeTransition(matchingTransition);
    }
  }, [availableTransitions, executeTransition]);

  // Setup timer triggers
  useEffect(() => {
    // Clear existing timers
    timerRefs.current.forEach(timer => clearTimeout(timer));
    timerRefs.current.clear();
    
    // Setup new timer triggers
    availableTransitions.forEach(transition => {
      const timerTrigger = transition.triggers?.find(t => t.type === 'timer');
      if (timerTrigger && timerTrigger.timerDelay) {
        const timer = setTimeout(() => {
          executeTransition(transition);
        }, timerTrigger.timerDelay);
        timerRefs.current.set(transition.id, timer);
      } else if (transition.trigger === 'timer') {
        // Legacy timer support
        const timer = setTimeout(() => {
          executeTransition(transition);
        }, 1000);
        timerRefs.current.set(transition.id, timer);
      }
    });
    
    return () => {
      timerRefs.current.forEach(timer => clearTimeout(timer));
    };
  }, [currentKeyframeId, availableTransitions, executeTransition]);

  // Calculate scale to fit preview area
  const containerWidth = 288;
  const containerHeight = 480;
  
  const contentWidth = device.id === 'none' ? frameSize.width : device.width;
  const contentHeight = device.id === 'none' ? frameSize.height : device.height;
  
  const autoScale = Math.min(
    containerWidth / contentWidth,
    containerHeight / contentHeight,
    1
  );
  
  const effectiveScale = (zoom / 100) * autoScale;

  // Intercept browser zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if ((e.metaKey || e.ctrlKey) && !isZoomLocked) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoom(prev => Math.max(25, Math.min(200, prev + delta)));
    }
  }, [isZoomLocked]);

  useEffect(() => {
    const container = document.getElementById('live-preview-container');
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Reset to initial state
  const handleReset = useCallback(() => {
    const initialKeyframe = keyframes.find(kf => kf.id === 'kf-idle') || keyframes[0];
    if (initialKeyframe) {
      setCurrentKeyframeId(initialKeyframe.id);
    }
  }, [keyframes]);

  // Get trigger hints for UI
  const getTriggerHints = () => {
    const hints: string[] = [];
    availableTransitions.forEach(t => {
      if (t.triggers && t.triggers.length > 0) {
        t.triggers.forEach(trigger => hints.push(trigger.type));
      } else if (t.trigger) {
        hints.push(t.trigger);
      }
    });
    return [...new Set(hints)];
  };

  const triggerHints = getTriggerHints();

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span>Live Preview</span>
        <span style={{ fontSize: 10, color: isTransitioning ? '#22c55e' : '#666' }}>
          {isTransitioning ? '⚡ Transitioning...' : currentKeyframe?.name}
        </span>
      </div>

      {/* Device Frame Selector */}
      <div style={controlsStyle}>
        <select
          value={deviceFrame}
          onChange={(e) => setDeviceFrame(e.target.value)}
          style={selectStyle}
        >
          {DEVICE_FRAMES.map(d => (
            <option key={d.id} value={d.id}>
              {d.label} {d.width > 0 ? `(${d.width}×${d.height})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Trigger Hints */}
      {triggerHints.length > 0 && (
        <div style={triggerHintsStyle}>
          {triggerHints.map(hint => (
            <span key={hint} style={triggerBadgeStyle}>
              {getTriggerIcon(hint)} {hint}
            </span>
          ))}
        </div>
      )}

      {/* Preview Area */}
      <div 
        id="live-preview-container"
        style={previewAreaStyle}
      >
        <div style={{
          transform: `scale(${effectiveScale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.15s ease',
        }}>
          {/* Device Frame */}
          {device.id !== 'none' ? (
            <DeviceFrame device={device}>
              <PreviewContent 
                elements={elements}
                onTrigger={handleTrigger}
                transitionDuration={transitionDuration}
                transitionCurve={transitionCurve}
                availableTriggers={triggerHints}
              />
            </DeviceFrame>
          ) : (
            <div style={{
              width: frameSize.width,
              height: frameSize.height,
              background: '#050506',
              borderRadius: 8,
              border: '1px solid #333',
              position: 'relative',
              overflow: 'hidden',
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

      {/* Zoom Controls */}
      <div style={zoomControlsStyle}>
        <button
          onClick={() => setZoom(prev => Math.max(25, prev - 25))}
          style={zoomButtonStyle}
        >
          −
        </button>
        <input
          type="range"
          min="25"
          max="200"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={sliderStyle}
        />
        <button
          onClick={() => setZoom(prev => Math.min(200, prev + 25))}
          style={zoomButtonStyle}
        >
          +
        </button>
        <span style={zoomLabelStyle}>{zoom}%</span>
        <button
          onClick={() => setIsZoomLocked(!isZoomLocked)}
          style={{
            ...lockButtonStyle,
            background: isZoomLocked ? '#f59e0b20' : 'transparent',
            borderColor: isZoomLocked ? '#f59e0b' : '#333',
          }}
          title={isZoomLocked ? 'Unlock zoom' : 'Lock zoom'}
        >
          {isZoomLocked ? '🔒' : '🔓'}
        </button>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8 }}>
        <button
          onClick={handleReset}
          style={resetButtonStyle}
        >
          ↺ Reset
        </button>
        <button
          onClick={() => setZoom(100)}
          style={resetButtonStyle}
        >
          100%
        </button>
      </div>
    </div>
  );
}

// Helper function for trigger icons
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

// Device Frame Component
function DeviceFrame({ 
  device, 
  children 
}: { 
  device: typeof DEVICE_FRAMES[0]; 
  children: React.ReactNode;
}) {
  const isIPhone = device.id.startsWith('iphone');
  const isIPad = device.id.startsWith('ipad');
  
  return (
    <div style={{
      position: 'relative',
      padding: isIPhone ? 12 : 8,
      background: '#1a1a1a',
      borderRadius: device.radius + (isIPhone ? 8 : 4),
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    }}>
      {/* Notch for iPhone */}
      {isIPhone && device.id !== 'iphonese' && (
        <div style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 120,
          height: 34,
          background: '#000',
          borderRadius: 20,
          zIndex: 10,
        }} />
      )}
      
      {/* Screen */}
      <div style={{
        width: device.width,
        height: device.height,
        background: '#000',
        borderRadius: device.radius,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {children}
      </div>
      
      {/* Home indicator for modern iPhones */}
      {isIPhone && device.id !== 'iphonese' && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 134,
          height: 5,
          background: '#fff',
          borderRadius: 3,
          opacity: 0.3,
        }} />
      )}
      
      {/* iPad home button area */}
      {isIPad && (
        <div style={{
          position: 'absolute',
          bottom: -4,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 40,
          height: 4,
          background: '#333',
          borderRadius: 2,
        }} />
      )}
    </div>
  );
}

// Preview Content Component with interaction support
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
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleClick = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    if (availableTriggers.includes('tap')) {
      onTrigger('tap', elementId);
    }
  };

  const handleMouseEnter = (elementId: string) => {
    setHoveredElement(elementId);
    if (availableTriggers.includes('hover')) {
      onTrigger('hover', elementId);
    }
  };

  const handleMouseLeave = () => {
    setHoveredElement(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStartRef.current && availableTriggers.includes('drag')) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 20) { // Minimum drag distance
        onTrigger('drag');
      }
    }
    dragStartRef.current = null;
  };

  const handleContainerClick = () => {
    if (availableTriggers.includes('tap')) {
      onTrigger('tap');
    }
  };

  // Get CSS easing
  // transitionCurve is already a valid CSS easing value
  const cssEasing = transitionCurve;

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        cursor: availableTriggers.includes('tap') ? 'pointer' : 'default',
      }}
      onClick={handleContainerClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {elements.map((el) => (
        <div
          key={el.id}
          onClick={(e) => handleClick(e, el.id)}
          onMouseEnter={() => handleMouseEnter(el.id)}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'absolute',
            left: el.position.x,
            top: el.position.y,
            width: el.size.width,
            height: el.size.height,
            background: el.style?.fill || '#3b82f6',
            opacity: el.style?.fillOpacity ?? 1,
            borderRadius: el.shapeType === 'ellipse' 
              ? '50%' 
              : (el.style?.borderRadius || 8),
            border: el.style?.stroke 
              ? `${el.style.strokeWidth || 1}px solid ${el.style.stroke}`
              : 'none',
            boxShadow: el.style?.shadowColor 
              ? `${el.style.shadowOffsetX || 0}px ${el.style.shadowOffsetY || 0}px ${el.style.shadowBlur || 0}px ${el.style.shadowColor}`
              : undefined,
            // Animation transition
            transition: `all ${transitionDuration}ms ${cssEasing}`,
            // Hover effect
            transform: hoveredElement === el.id ? 'scale(1.02)' : 'scale(1)',
            cursor: availableTriggers.includes('tap') ? 'pointer' : 'default',
          }}
        >
          {/* Text content */}
          {el.shapeType === 'text' && el.text && (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: el.style?.textColor || '#fff',
              fontSize: el.style?.fontSize || 14,
              fontWeight: el.style?.fontWeight || 400,
              fontFamily: el.style?.fontFamily || 'Inter, sans-serif',
              textAlign: (el.style?.textAlign as React.CSSProperties['textAlign']) || 'center',
              padding: el.style?.padding || 0,
            }}>
              {el.text}
            </div>
          )}
          
          {/* Image content */}
          {el.shapeType === 'image' && el.style?.imageSrc && (
            <img 
              src={el.style.imageSrc} 
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: el.style?.objectFit || 'cover',
                borderRadius: 'inherit',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Styles
const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
};

const headerStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #2a2a2a',
  fontSize: 11,
  fontWeight: 600,
  color: '#888',
  textTransform: 'uppercase',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const controlsStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderBottom: '1px solid #2a2a2a',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: '#0d0d0e',
  border: '1px solid #2a2a2a',
  borderRadius: 6,
  color: '#e5e5e5',
  fontSize: 11,
};

const triggerHintsStyle: React.CSSProperties = {
  padding: '6px 16px',
  borderBottom: '1px solid #2a2a2a',
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
};

const triggerBadgeStyle: React.CSSProperties = {
  padding: '2px 8px',
  background: '#1e3a5f',
  borderRadius: 4,
  fontSize: 10,
  color: '#60a5fa',
};

const previewAreaStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#0a0a0b',
  overflow: 'hidden',
  position: 'relative',
};

const zoomControlsStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderTop: '1px solid #2a2a2a',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const zoomButtonStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  background: '#0d0d0e',
  border: '1px solid #333',
  borderRadius: 4,
  color: '#888',
  fontSize: 14,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const sliderStyle: React.CSSProperties = {
  flex: 1,
  height: 4,
  accentColor: '#2563eb',
};

const zoomLabelStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#666',
  minWidth: 36,
  textAlign: 'right',
};

const lockButtonStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  background: 'transparent',
  border: '1px solid #333',
  borderRadius: 4,
  fontSize: 12,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const resetButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 0',
  background: 'transparent',
  border: '1px solid #333',
  borderRadius: 6,
  color: '#666',
  fontSize: 10,
  cursor: 'pointer',
};
