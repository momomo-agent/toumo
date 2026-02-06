import { useEditorStore } from '../../store';
import type { 
  PrototypeLink, 
  PrototypeLinkTrigger, 
  PrototypeTransitionType,
  PrototypeTransitionDirection,
  PrototypeTransitionEasing 
} from '../../types';
import { DEFAULT_PROTOTYPE_LINK } from '../../types';
import { Link, Play } from 'lucide-react';

const TRIGGER_OPTIONS: { value: PrototypeLinkTrigger; label: string }[] = [
  { value: 'tap', label: 'On Tap' },
  { value: 'drag', label: 'On Drag' },
  { value: 'hover', label: 'While Hovering' },
  { value: 'mouseEnter', label: 'Mouse Enter' },
  { value: 'mouseLeave', label: 'Mouse Leave' },
  { value: 'mouseDown', label: 'Mouse Down' },
  { value: 'mouseUp', label: 'Mouse Up' },
];

const TRANSITION_OPTIONS: { value: PrototypeTransitionType; label: string }[] = [
  { value: 'instant', label: 'Instant' },
  { value: 'dissolve', label: 'Dissolve' },
  { value: 'smartAnimate', label: 'Smart Animate' },
  { value: 'moveIn', label: 'Move In' },
  { value: 'moveOut', label: 'Move Out' },
  { value: 'push', label: 'Push' },
  { value: 'slideIn', label: 'Slide In' },
  { value: 'slideOut', label: 'Slide Out' },
];

const DIRECTION_OPTIONS: { value: PrototypeTransitionDirection; label: string }[] = [
  { value: 'left', label: '← Left' },
  { value: 'right', label: '→ Right' },
  { value: 'top', label: '↑ Top' },
  { value: 'bottom', label: '↓ Bottom' },
];

const EASING_OPTIONS: { value: PrototypeTransitionEasing; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease', label: 'Ease' },
  { value: 'easeIn', label: 'Ease In' },
  { value: 'easeOut', label: 'Ease Out' },
  { value: 'easeInOut', label: 'Ease In Out' },
  { value: 'spring', label: 'Spring' },
];

export function PrototypeLinkPanel() {
  const { 
    keyframes, 
    selectedKeyframeId, 
    selectedElementId,
    updateElement,
    pushHistory,
  } = useEditorStore();

  const currentKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const selectedElement = currentKeyframe?.keyElements.find(el => el.id === selectedElementId);

  if (!selectedElement) return null;

  const prototypeLink = selectedElement.prototypeLink || DEFAULT_PROTOTYPE_LINK;
  const needsDirection = ['moveIn', 'moveOut', 'push', 'slideIn', 'slideOut'].includes(
    prototypeLink.transition.type
  );

  // Get available frames (excluding current)
  const availableFrames = keyframes.filter(kf => kf.id !== selectedKeyframeId);

  const updatePrototypeLink = (updates: Partial<PrototypeLink>) => {
    pushHistory();
    const newLink: PrototypeLink = {
      ...prototypeLink,
      ...updates,
    };
    updateElement(selectedElement.id, { prototypeLink: newLink });
  };

  const updateTransition = (updates: Partial<PrototypeLink['transition']>) => {
    updatePrototypeLink({
      transition: {
        ...prototypeLink.transition,
        ...updates,
      },
    });
  };

  return (
    <div className="figma-section">
      <div className="figma-section-header">
        <div className="figma-section-title">
          <Link size={14} />
          <span>Prototype</span>
        </div>
        <label className="figma-toggle">
          <input
            type="checkbox"
            checked={prototypeLink.enabled}
            onChange={(e) => updatePrototypeLink({ enabled: e.target.checked })}
          />
          <span className="figma-toggle-slider" />
        </label>
      </div>

      {prototypeLink.enabled && (
        <div className="figma-section-content">
          {/* Trigger */}
          <div className="figma-row">
            <span className="figma-label">Trigger</span>
            <select
              className="figma-select"
              value={prototypeLink.trigger}
              onChange={(e) => updatePrototypeLink({ 
                trigger: e.target.value as PrototypeLinkTrigger 
              })}
            >
              {TRIGGER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Target Frame */}
          <div className="figma-row">
            <span className="figma-label">Navigate to</span>
            <select
              className="figma-select"
              value={prototypeLink.targetFrameId || ''}
              onChange={(e) => updatePrototypeLink({ 
                targetFrameId: e.target.value || null 
              })}
            >
              <option value="">None</option>
              <option value="back">← Back</option>
              {availableFrames.map(frame => (
                <option key={frame.id} value={frame.id}>
                  {frame.name}
                </option>
              ))}
            </select>
          </div>

          {prototypeLink.targetFrameId && (
            <>
              {/* Transition Type */}
              <div className="figma-row">
                <span className="figma-label">Animation</span>
                <select
                  className="figma-select"
                  value={prototypeLink.transition.type}
                  onChange={(e) => updateTransition({ 
                    type: e.target.value as PrototypeTransitionType 
                  })}
                >
                  {TRANSITION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Direction (for directional transitions) */}
              {needsDirection && (
                <div className="figma-row">
                  <span className="figma-label">Direction</span>
                  <select
                    className="figma-select"
                    value={prototypeLink.transition.direction || 'right'}
                    onChange={(e) => updateTransition({ 
                      direction: e.target.value as PrototypeTransitionDirection 
                    })}
                  >
                    {DIRECTION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Duration */}
              {prototypeLink.transition.type !== 'instant' && (
                <>
                  <div className="figma-row">
                    <span className="figma-label">Duration</span>
                    <input
                      type="number"
                      className="figma-input"
                      value={prototypeLink.transition.duration}
                      min={0}
                      max={5000}
                      step={50}
                      onChange={(e) => updateTransition({ 
                        duration: parseInt(e.target.value) || 300 
                      })}
                    />
                    <span className="figma-unit">ms</span>
                  </div>

                  {/* Easing */}
                  <div className="figma-row">
                    <span className="figma-label">Easing</span>
                    <select
                      className="figma-select"
                      value={prototypeLink.transition.easing}
                      onChange={(e) => updateTransition({ 
                        easing: e.target.value as PrototypeTransitionEasing 
                      })}
                    >
                      {EASING_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Link indicator */}
              <div className="prototype-link-indicator">
                <Play size={12} />
                <span>
                  {prototypeLink.targetFrameId === 'back' 
                    ? 'Go back to previous frame'
                    : `Navigate to "${availableFrames.find(f => f.id === prototypeLink.targetFrameId)?.name || 'Unknown'}"`
                  }
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
