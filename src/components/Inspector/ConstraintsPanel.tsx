import { useState, useEffect } from 'react';
import { useEditorStore } from '../../store';
import type { HorizontalConstraint, VerticalConstraint } from '../../types';
import { DEFAULT_CONSTRAINTS } from '../../types';
import './ConstraintsPanel.css';

// Constraint options
const HORIZONTAL_OPTIONS: { value: HorizontalConstraint; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'left-right', label: 'Left and Right' },
  { value: 'center', label: 'Center' },
  { value: 'scale', label: 'Scale' },
];

const VERTICAL_OPTIONS: { value: VerticalConstraint; label: string }[] = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'top-bottom', label: 'Top and Bottom' },
  { value: 'center', label: 'Center' },
  { value: 'scale', label: 'Scale' },
];

export function ConstraintsPanel() {
  const { 
    selectedElementId,
    selectedKeyframeId,
    keyframes,
    updateElement,
  } = useEditorStore();

  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const selectedElement = selectedKeyframe?.keyElements.find(
    (el: { id: string }) => el.id === selectedElementId
  );

  const [horizontal, setHorizontal] = useState<HorizontalConstraint>('left');
  const [vertical, setVertical] = useState<VerticalConstraint>('top');

  // Sync with element constraints
  useEffect(() => {
    if (selectedElement) {
      const constraints = selectedElement.constraints || DEFAULT_CONSTRAINTS;
      setHorizontal(constraints.horizontal);
      setVertical(constraints.vertical);
    }
  }, [selectedElement?.id, selectedElement?.constraints]);

  if (!selectedElement) return null;

  const handleHorizontalChange = (value: HorizontalConstraint) => {
    setHorizontal(value);
    updateElement(selectedElement.id, {
      constraints: {
        horizontal: value,
        vertical,
      }
    });
  };

  const handleVerticalChange = (value: VerticalConstraint) => {
    setVertical(value);
    updateElement(selectedElement.id, {
      constraints: {
        horizontal,
        vertical: value,
      }
    });
  };

  return (
    <div className="constraints-panel">
      <div className="constraints-header">
        <span className="constraints-title">Constraints</span>
      </div>
      
      <div className="constraints-content">
        {/* Visual Preview */}
        <div className="constraints-preview">
          <ConstraintVisual horizontal={horizontal} vertical={vertical} />
        </div>

        {/* Dropdowns */}
        <div className="constraints-controls">
          <div className="constraint-row">
            <span className="constraint-label">H</span>
            <select
              className="constraint-select"
              value={horizontal}
              onChange={(e) => handleHorizontalChange(e.target.value as HorizontalConstraint)}
            >
              {HORIZONTAL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <div className="constraint-row">
            <span className="constraint-label">V</span>
            <select
              className="constraint-select"
              value={vertical}
              onChange={(e) => handleVerticalChange(e.target.value as VerticalConstraint)}
            >
              {VERTICAL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// Visual representation of constraints (like Figma's constraint preview)
function ConstraintVisual({ 
  horizontal, 
  vertical 
}: { 
  horizontal: HorizontalConstraint; 
  vertical: VerticalConstraint;
}) {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="constraint-visual-svg">
      {/* Parent frame */}
      <rect 
        x="4" y="4" 
        width="72" height="72" 
        fill="none" 
        stroke="var(--figma-border)" 
        strokeWidth="1"
        rx="2"
      />
      
      {/* Child element */}
      <rect 
        x="28" y="28" 
        width="24" height="24" 
        fill="var(--figma-accent)" 
        fillOpacity="0.3"
        stroke="var(--figma-accent)" 
        strokeWidth="1.5"
        rx="2"
      />
      
      {/* Horizontal constraints visualization */}
      {horizontal === 'left' && (
        <line x1="4" y1="40" x2="28" y2="40" stroke="var(--figma-accent)" strokeWidth="2" />
      )}
      {horizontal === 'right' && (
        <line x1="52" y1="40" x2="76" y2="40" stroke="var(--figma-accent)" strokeWidth="2" />
      )}
      {horizontal === 'left-right' && (
        <>
          <line x1="4" y1="40" x2="28" y2="40" stroke="var(--figma-accent)" strokeWidth="2" />
          <line x1="52" y1="40" x2="76" y2="40" stroke="var(--figma-accent)" strokeWidth="2" />
        </>
      )}
      {horizontal === 'center' && (
        <>
          <line x1="4" y1="40" x2="28" y2="40" stroke="var(--figma-accent)" strokeWidth="1" strokeDasharray="3,2" />
          <line x1="52" y1="40" x2="76" y2="40" stroke="var(--figma-accent)" strokeWidth="1" strokeDasharray="3,2" />
        </>
      )}
      {horizontal === 'scale' && (
        <>
          <line x1="4" y1="40" x2="28" y2="40" stroke="var(--figma-accent)" strokeWidth="1" strokeDasharray="1,2" />
          <line x1="52" y1="40" x2="76" y2="40" stroke="var(--figma-accent)" strokeWidth="1" strokeDasharray="1,2" />
        </>
      )}
      
      {/* Vertical constraints visualization */}
      {vertical === 'top' && (
        <line x1="40" y1="4" x2="40" y2="28" stroke="var(--figma-accent)" strokeWidth="2" />
      )}
      {vertical === 'bottom' && (
        <line x1="40" y1="52" x2="40" y2="76" stroke="var(--figma-accent)" strokeWidth="2" />
      )}
      {vertical === 'top-bottom' && (
        <>
          <line x1="40" y1="4" x2="40" y2="28" stroke="var(--figma-accent)" strokeWidth="2" />
          <line x1="40" y1="52" x2="40" y2="76" stroke="var(--figma-accent)" strokeWidth="2" />
        </>
      )}
      {vertical === 'center' && (
        <>
          <line x1="40" y1="4" x2="40" y2="28" stroke="var(--figma-accent)" strokeWidth="1" strokeDasharray="3,2" />
          <line x1="40" y1="52" x2="40" y2="76" stroke="var(--figma-accent)" strokeWidth="1" strokeDasharray="3,2" />
        </>
      )}
      {vertical === 'scale' && (
        <>
          <line x1="40" y1="4" x2="40" y2="28" stroke="var(--figma-accent)" strokeWidth="1" strokeDasharray="1,2" />
          <line x1="40" y1="52" x2="40" y2="76" stroke="var(--figma-accent)" strokeWidth="1" strokeDasharray="1,2" />
        </>
      )}
    </svg>
  );
}
