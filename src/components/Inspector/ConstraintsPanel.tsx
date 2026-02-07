import { useState, useEffect, useCallback } from 'react';
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

  const handleHorizontalChange = useCallback((value: HorizontalConstraint) => {
    setHorizontal(value);
    if (selectedElement) {
      updateElement(selectedElement.id, {
        constraints: { horizontal: value, vertical }
      });
    }
  }, [selectedElement, vertical, updateElement]);

  const handleVerticalChange = useCallback((value: VerticalConstraint) => {
    setVertical(value);
    if (selectedElement) {
      updateElement(selectedElement.id, {
        constraints: { horizontal, vertical: value }
      });
    }
  }, [selectedElement, horizontal, updateElement]);

  if (!selectedElement) return null;

  // Constraints apply when parent resizes — show for all elements

  return (
    <div className="constraints-panel">
      <div className="constraints-header">
        <span className="constraints-title">Constraints</span>
      </div>
      
      <div className="constraints-content">
        {/* Interactive Cross Selector */}
        <ConstraintCrossSelector
          horizontal={horizontal}
          vertical={vertical}
          onHorizontalChange={handleHorizontalChange}
          onVerticalChange={handleVerticalChange}
        />

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

/**
 * Interactive Figma-style cross constraint selector.
 * 
 * Layout: a square box representing the parent frame, with a small
 * rectangle in the center representing the child element.
 * 
 * Clickable edges/lines:
 * - Left edge line: toggles left constraint
 * - Right edge line: toggles right constraint
 * - Top edge line: toggles top constraint
 * - Bottom edge line: toggles bottom constraint
 * 
 * The visual shows solid lines for pinned edges, dashed for center,
 * and dotted for scale.
 */
function ConstraintCrossSelector({
  horizontal,
  vertical,
  onHorizontalChange,
  onVerticalChange,
}: {
  horizontal: HorizontalConstraint;
  vertical: VerticalConstraint;
  onHorizontalChange: (v: HorizontalConstraint) => void;
  onVerticalChange: (v: VerticalConstraint) => void;
}) {
  // Derive which edges are "pinned"
  const leftPinned = horizontal === 'left' || horizontal === 'left-right';
  const rightPinned = horizontal === 'right' || horizontal === 'left-right';
  const topPinned = vertical === 'top' || vertical === 'top-bottom';
  const bottomPinned = vertical === 'bottom' || vertical === 'top-bottom';

  // Toggle left edge
  const toggleLeft = () => {
    if (horizontal === 'left') onHorizontalChange('right');
    else if (horizontal === 'right') onHorizontalChange('left-right');
    else if (horizontal === 'left-right') onHorizontalChange('right');
    else if (horizontal === 'center') onHorizontalChange('left');
    else if (horizontal === 'scale') onHorizontalChange('left');
  };

  // Toggle right edge
  const toggleRight = () => {
    if (horizontal === 'right') onHorizontalChange('left');
    else if (horizontal === 'left') onHorizontalChange('left-right');
    else if (horizontal === 'left-right') onHorizontalChange('left');
    else if (horizontal === 'center') onHorizontalChange('right');
    else if (horizontal === 'scale') onHorizontalChange('right');
  };

  // Toggle top edge
  const toggleTop = () => {
    if (vertical === 'top') onVerticalChange('bottom');
    else if (vertical === 'bottom') onVerticalChange('top-bottom');
    else if (vertical === 'top-bottom') onVerticalChange('bottom');
    else if (vertical === 'center') onVerticalChange('top');
    else if (vertical === 'scale') onVerticalChange('top');
  };

  // Toggle bottom edge
  const toggleBottom = () => {
    if (vertical === 'bottom') onVerticalChange('top');
    else if (vertical === 'top') onVerticalChange('top-bottom');
    else if (vertical === 'top-bottom') onVerticalChange('top');
    else if (vertical === 'center') onVerticalChange('bottom');
    else if (vertical === 'scale') onVerticalChange('bottom');
  };

  // SVG dimensions
  const size = 80;
  const pad = 6;       // padding from SVG edge to parent rect
  const parentX = pad;
  const parentY = pad;
  const parentW = size - pad * 2;
  const parentH = size - pad * 2;

  // Child rect (centered)
  const childW = 20;
  const childH = 20;
  const childX = (size - childW) / 2;
  const childY = (size - childH) / 2;

  // Line positions
  const midY = size / 2;
  const midX = size / 2;

  // Colors
  const activeColor = 'var(--accent)';
  const inactiveColor = 'var(--border-default)';

  // Get line style based on constraint type
  const getHLineStyle = (side: 'left' | 'right') => {
    const pinned = side === 'left' ? leftPinned : rightPinned;
    if (pinned) return { stroke: activeColor, strokeWidth: 2, dasharray: 'none' };
    if (horizontal === 'center') return { stroke: inactiveColor, strokeWidth: 1, dasharray: '3,2' };
    if (horizontal === 'scale') return { stroke: inactiveColor, strokeWidth: 1, dasharray: '1,2' };
    return { stroke: inactiveColor, strokeWidth: 1, dasharray: 'none' };
  };

  const getVLineStyle = (side: 'top' | 'bottom') => {
    const pinned = side === 'top' ? topPinned : bottomPinned;
    if (pinned) return { stroke: activeColor, strokeWidth: 2, dasharray: 'none' };
    if (vertical === 'center') return { stroke: inactiveColor, strokeWidth: 1, dasharray: '3,2' };
    if (vertical === 'scale') return { stroke: inactiveColor, strokeWidth: 1, dasharray: '1,2' };
    return { stroke: inactiveColor, strokeWidth: 1, dasharray: 'none' };
  };

  const leftStyle = getHLineStyle('left');
  const rightStyle = getHLineStyle('right');
  const topStyle = getVLineStyle('top');
  const bottomStyle = getVLineStyle('bottom');

  return (
    <div className="constraint-cross-selector">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="constraint-cross-svg"
      >
        {/* Parent frame border */}
        <rect
          x={parentX}
          y={parentY}
          width={parentW}
          height={parentH}
          fill="none"
          stroke="var(--border-default)"
          strokeWidth="1"
          rx="3"
        />

        {/* Left constraint line */}
        <line
          x1={parentX}
          y1={midY}
          x2={childX}
          y2={midY}
          stroke={leftStyle.stroke}
          strokeWidth={leftStyle.strokeWidth}
          strokeDasharray={leftStyle.dasharray}
          className="constraint-line"
        />

        {/* Right constraint line */}
        <line
          x1={childX + childW}
          y1={midY}
          x2={parentX + parentW}
          y2={midY}
          stroke={rightStyle.stroke}
          strokeWidth={rightStyle.strokeWidth}
          strokeDasharray={rightStyle.dasharray}
          className="constraint-line"
        />

        {/* Top constraint line */}
        <line
          x1={midX}
          y1={parentY}
          x2={midX}
          y2={childY}
          stroke={topStyle.stroke}
          strokeWidth={topStyle.strokeWidth}
          strokeDasharray={topStyle.dasharray}
          className="constraint-line"
        />

        {/* Bottom constraint line */}
        <line
          x1={midX}
          y1={childY + childH}
          x2={midX}
          y2={parentY + parentH}
          stroke={bottomStyle.stroke}
          strokeWidth={bottomStyle.strokeWidth}
          strokeDasharray={bottomStyle.dasharray}
          className="constraint-line"
        />

        {/* Child element rect */}
        <rect
          x={childX}
          y={childY}
          width={childW}
          height={childH}
          fill="var(--accent-subtle)"
          stroke="var(--accent)"
          strokeWidth="1.5"
          rx="2"
        />

        {/* Clickable hit areas (invisible, larger for easier clicking) */}
        {/* Left hit area */}
        <rect
          x={parentX}
          y={midY - 10}
          width={childX - parentX}
          height={20}
          fill="transparent"
          className="constraint-hit-area"
          onClick={toggleLeft}
        />
        {/* Right hit area */}
        <rect
          x={childX + childW}
          y={midY - 10}
          width={parentX + parentW - childX - childW}
          height={20}
          fill="transparent"
          className="constraint-hit-area"
          onClick={toggleRight}
        />
        {/* Top hit area */}
        <rect
          x={midX - 10}
          y={parentY}
          width={20}
          height={childY - parentY}
          fill="transparent"
          className="constraint-hit-area"
          onClick={toggleTop}
        />
        {/* Bottom hit area */}
        <rect
          x={midX - 10}
          y={childY + childH}
          width={20}
          height={parentY + parentH - childY - childH}
          fill="transparent"
          className="constraint-hit-area"
          onClick={toggleBottom}
        />
      </svg>
    </div>
  );
}
