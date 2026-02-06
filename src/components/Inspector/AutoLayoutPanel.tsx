import { useState } from 'react';
import { useEditorStore } from '../../store';
import type { AutoLayoutDirection, AutoLayoutAlign, AutoLayoutJustify, SizingMode } from '../../types';
import './AutoLayoutPanel.css';

// ============ Child Layout Panel (shown when child of auto layout parent is selected) ============

function ChildLayoutSection() {
  const {
    selectedElementId,
    selectedKeyframeId,
    keyframes,
    setChildSizingMode,
  } = useEditorStore();

  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const selectedElement = selectedKeyframe?.keyElements.find(
    el => el.id === selectedElementId
  );

  // Only show if this element has a parent with auto layout enabled
  if (!selectedElement?.parentId) return null;

  const parent = selectedKeyframe?.keyElements.find(
    el => el.id === selectedElement.parentId
  );
  if (!parent?.autoLayout?.enabled) return null;

  const layoutChild = selectedElement.layoutChild || { widthMode: 'fixed', heightMode: 'fixed' };
  const isHorizontal = parent.autoLayout.direction === 'horizontal';

  const handleWidthChange = (mode: SizingMode) => {
    setChildSizingMode(selectedElement.id, mode, layoutChild.heightMode);
  };

  const handleHeightChange = (mode: SizingMode) => {
    setChildSizingMode(selectedElement.id, layoutChild.widthMode, mode);
  };

  const SizingButton = ({ mode, active, onClick }: { mode: SizingMode; active: boolean; onClick: () => void }) => (
    <button
      className={`child-sizing-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      title={mode === 'fixed' ? 'Fixed size' : mode === 'hug' ? 'Hug contents' : 'Fill container'}
    >
      {mode === 'fixed' ? (
        <FixedIcon active={active} />
      ) : mode === 'hug' ? (
        <HugIcon active={active} />
      ) : (
        <FillIcon active={active} />
      )}
      <span className="child-sizing-label">{mode === 'fixed' ? 'Fixed' : mode === 'hug' ? 'Hug' : 'Fill'}</span>
    </button>
  );

  return (
    <div className="child-layout-section">
      <div className="child-layout-header">
        <ChildLayoutIcon />
        <span className="child-layout-title">Layout Child</span>
        <span className="child-layout-parent-hint">
          in {isHorizontal ? '→' : '↓'} {parent.name}
        </span>
      </div>
      <div className="child-layout-content">
        {/* Width sizing */}
        <div className="child-layout-row">
          <span className="child-layout-label">W</span>
          <div className="child-sizing-group">
            <SizingButton mode="fixed" active={layoutChild.widthMode === 'fixed'} onClick={() => handleWidthChange('fixed')} />
            <SizingButton mode="hug" active={layoutChild.widthMode === 'hug'} onClick={() => handleWidthChange('hug')} />
            <SizingButton mode="fill" active={layoutChild.widthMode === 'fill'} onClick={() => handleWidthChange('fill')} />
          </div>
        </div>
        {/* Height sizing */}
        <div className="child-layout-row">
          <span className="child-layout-label">H</span>
          <div className="child-sizing-group">
            <SizingButton mode="fixed" active={layoutChild.heightMode === 'fixed'} onClick={() => handleHeightChange('fixed')} />
            <SizingButton mode="hug" active={layoutChild.heightMode === 'hug'} onClick={() => handleHeightChange('hug')} />
            <SizingButton mode="fill" active={layoutChild.heightMode === 'fill'} onClick={() => handleHeightChange('fill')} />
          </div>
        </div>
      </div>
    </div>
  );
}

const ChildLayoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1" fill="none" />
    <rect x="4" y="4" width="6" height="6" rx="1" fill="currentColor" opacity="0.5" />
  </svg>
);

// Icons
const AutoLayoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <rect x="3" y="3" width="3" height="8" rx="0.5" fill="currentColor" opacity="0.6" />
    <rect x="7.5" y="3" width="3" height="8" rx="0.5" fill="currentColor" opacity="0.6" />
  </svg>
);

const HorizontalIcon = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="4" width="4" height="8" rx="1" fill={active ? "#3b82f6" : "currentColor"} opacity={active ? 1 : 0.5} />
    <rect x="7" y="4" width="4" height="8" rx="1" fill={active ? "#3b82f6" : "currentColor"} opacity={active ? 1 : 0.5} />
    <path d="M12 8H14M14 8L13 7M14 8L13 9" stroke={active ? "#3b82f6" : "currentColor"} strokeWidth="1.2" />
  </svg>
);

const VerticalIcon = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="4" y="2" width="8" height="4" rx="1" fill={active ? "#3b82f6" : "currentColor"} opacity={active ? 1 : 0.5} />
    <rect x="4" y="7" width="8" height="4" rx="1" fill={active ? "#3b82f6" : "currentColor"} opacity={active ? 1 : 0.5} />
    <path d="M8 12V14M8 14L7 13M8 14L9 13" stroke={active ? "#3b82f6" : "currentColor"} strokeWidth="1.2" />
  </svg>
);

const AlignStartIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <line x1="2" y1="2" x2="2" y2="12" stroke="currentColor" strokeWidth="1.5" />
    <rect x="4" y="3" width="8" height="3" rx="0.5" fill="currentColor" opacity="0.6" />
    <rect x="4" y="8" width="5" height="3" rx="0.5" fill="currentColor" opacity="0.6" />
  </svg>
);

const AlignCenterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1" />
    <rect x="2" y="3" width="10" height="3" rx="0.5" fill="currentColor" opacity="0.6" />
    <rect x="4" y="8" width="6" height="3" rx="0.5" fill="currentColor" opacity="0.6" />
  </svg>
);

const AlignEndIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <line x1="12" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" />
    <rect x="2" y="3" width="8" height="3" rx="0.5" fill="currentColor" opacity="0.6" />
    <rect x="5" y="8" width="5" height="3" rx="0.5" fill="currentColor" opacity="0.6" />
  </svg>
);

const AlignStretchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <line x1="2" y1="2" x2="2" y2="12" stroke="currentColor" strokeWidth="1.5" />
    <line x1="12" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" />
    <rect x="4" y="3" width="6" height="3" rx="0.5" fill="currentColor" opacity="0.6" />
    <rect x="4" y="8" width="6" height="3" rx="0.5" fill="currentColor" opacity="0.6" />
  </svg>
);

const SpaceBetweenIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="2" y="4" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.6" />
    <rect x="9" y="4" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.6" />
    <path d="M6 7H8" stroke="currentColor" strokeWidth="1" strokeDasharray="1 1" />
  </svg>
);

const GapIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect x="1" y="3" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.5" />
    <rect x="8" y="3" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.5" />
    <path d="M5 6H7" stroke="currentColor" strokeWidth="1.2" />
    <path d="M4.5 5L5.5 6L4.5 7" stroke="currentColor" strokeWidth="0.8" fill="none" />
    <path d="M7.5 5L6.5 6L7.5 7" stroke="currentColor" strokeWidth="0.8" fill="none" />
  </svg>
);

const PaddingIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect x="1" y="1" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
    <rect x="3" y="3" width="6" height="6" rx="0.5" fill="currentColor" opacity="0.4" />
  </svg>
);

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" 
    style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
    <path d="M3 2L7 5L3 8" stroke="currentColor" strokeWidth="1.2" fill="none" />
  </svg>
);

// Sizing mode icons
const FixedIcon = ({ active }: { active: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="2" y="2" width="10" height="10" rx="1" stroke={active ? "#3b82f6" : "currentColor"} strokeWidth="1.2" fill="none" />
    <line x1="5" y1="7" x2="9" y2="7" stroke={active ? "#3b82f6" : "currentColor"} strokeWidth="1.2" />
  </svg>
);

const HugIcon = ({ active }: { active: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="3" y="4" width="8" height="6" rx="1" stroke={active ? "#3b82f6" : "currentColor"} strokeWidth="1.2" fill="none" />
    <path d="M1 7H3M11 7H13" stroke={active ? "#3b82f6" : "currentColor"} strokeWidth="1" />
    <path d="M2 6L1 7L2 8" stroke={active ? "#3b82f6" : "currentColor"} strokeWidth="0.8" fill="none" />
    <path d="M12 6L13 7L12 8" stroke={active ? "#3b82f6" : "currentColor"} strokeWidth="0.8" fill="none" />
  </svg>
);

const FillIcon = ({ active }: { active: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="4" width="12" height="6" rx="1" fill={active ? "#3b82f6" : "currentColor"} opacity={active ? 0.3 : 0.2} />
    <rect x="1" y="4" width="12" height="6" rx="1" stroke={active ? "#3b82f6" : "currentColor"} strokeWidth="1.2" fill="none" />
  </svg>
);

export function AutoLayoutPanel() {
  const {
    selectedElementId,
    selectedKeyframeId,
    keyframes,
    toggleAutoLayout,
    setAutoLayoutDirection,
    setAutoLayoutGap,
    setAutoLayoutPadding,
    setAutoLayoutAlign,
    setAutoLayoutJustify,
    updateAutoLayout,
  } = useEditorStore();

  const [expanded, setExpanded] = useState(true);
  const [paddingLinked, setPaddingLinked] = useState(true);

  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const selectedElement = selectedKeyframe?.keyElements.find(
    el => el.id === selectedElementId
  );

  // Only show for frame-like elements (frames, groups, rectangles with children)
  const canHaveAutoLayout = selectedElement && 
    (selectedElement.shapeType === 'frame' || 
     selectedElement.shapeType === 'rectangle' ||
     selectedKeyframe?.keyElements.some(el => el.parentId === selectedElement.id));

  if (!selectedElement || !canHaveAutoLayout) {
    return null;
  }

  const autoLayout = selectedElement.autoLayout;
  const isEnabled = autoLayout?.enabled ?? false;

  const handleToggle = () => {
    toggleAutoLayout(selectedElement.id);
  };

  const handleDirectionChange = (direction: AutoLayoutDirection) => {
    setAutoLayoutDirection(direction);
  };

  const handleGapChange = (gap: number) => {
    setAutoLayoutGap(Math.max(0, gap));
  };

  const handlePaddingChange = (value: number, side?: 'top' | 'right' | 'bottom' | 'left') => {
    if (!autoLayout) return;
    const val = Math.max(0, value);
    
    if (paddingLinked || !side) {
      setAutoLayoutPadding(val, val, val, val);
    } else {
      const { paddingTop, paddingRight, paddingBottom, paddingLeft } = autoLayout;
      const newPadding = {
        top: side === 'top' ? val : paddingTop,
        right: side === 'right' ? val : paddingRight,
        bottom: side === 'bottom' ? val : paddingBottom,
        left: side === 'left' ? val : paddingLeft,
      };
      setAutoLayoutPadding(newPadding.top, newPadding.right, newPadding.bottom, newPadding.left);
    }
  };

  const handleAlignChange = (align: AutoLayoutAlign) => {
    setAutoLayoutAlign(align);
  };

  const handleJustifyChange = (justify: AutoLayoutJustify) => {
    setAutoLayoutJustify(justify);
  };

  const handleSizingChange = (axis: 'primary' | 'counter', mode: SizingMode) => {
    if (axis === 'primary') {
      updateAutoLayout({ primaryAxisSizing: mode });
    } else {
      updateAutoLayout({ counterAxisSizing: mode });
    }
  };

  return (
    <div className="auto-layout-panel">
      <div className="auto-layout-header" onClick={() => setExpanded(!expanded)}>
        <ChevronIcon expanded={expanded} />
        <AutoLayoutIcon />
        <span className="auto-layout-title">Auto Layout</span>
        <button 
          className={`auto-layout-toggle ${isEnabled ? 'enabled' : ''}`}
          onClick={(e) => { e.stopPropagation(); handleToggle(); }}
        >
          {isEnabled ? 'On' : 'Off'}
        </button>
      </div>

      {expanded && isEnabled && autoLayout && (
        <div className="auto-layout-content">
          {/* Direction */}
          <div className="auto-layout-row">
            <span className="auto-layout-label">Direction</span>
            <div className="auto-layout-direction-btns">
              <button
                className={`direction-btn ${autoLayout.direction === 'horizontal' ? 'active' : ''}`}
                onClick={() => handleDirectionChange('horizontal')}
                title="Horizontal"
              >
                <HorizontalIcon active={autoLayout.direction === 'horizontal'} />
              </button>
              <button
                className={`direction-btn ${autoLayout.direction === 'vertical' ? 'active' : ''}`}
                onClick={() => handleDirectionChange('vertical')}
                title="Vertical"
              >
                <VerticalIcon active={autoLayout.direction === 'vertical'} />
              </button>
            </div>
          </div>

          {/* Sizing - Primary Axis */}
          <div className="auto-layout-row">
            <span className="auto-layout-label">
              {autoLayout.direction === 'horizontal' ? 'Width' : 'Height'}
            </span>
            <div className="auto-layout-sizing-btns">
              <button
                className={`sizing-btn ${(autoLayout.primaryAxisSizing || 'fixed') === 'fixed' ? 'active' : ''}`}
                onClick={() => handleSizingChange('primary', 'fixed')}
                title="Fixed size"
              >
                <FixedIcon active={(autoLayout.primaryAxisSizing || 'fixed') === 'fixed'} />
              </button>
              <button
                className={`sizing-btn ${autoLayout.primaryAxisSizing === 'hug' ? 'active' : ''}`}
                onClick={() => handleSizingChange('primary', 'hug')}
                title="Hug contents"
              >
                <HugIcon active={autoLayout.primaryAxisSizing === 'hug'} />
              </button>
              <button
                className={`sizing-btn ${autoLayout.primaryAxisSizing === 'fill' ? 'active' : ''}`}
                onClick={() => handleSizingChange('primary', 'fill')}
                title="Fill container"
              >
                <FillIcon active={autoLayout.primaryAxisSizing === 'fill'} />
              </button>
            </div>
          </div>

          {/* Sizing - Counter Axis */}
          <div className="auto-layout-row">
            <span className="auto-layout-label">
              {autoLayout.direction === 'horizontal' ? 'Height' : 'Width'}
            </span>
            <div className="auto-layout-sizing-btns">
              <button
                className={`sizing-btn ${(autoLayout.counterAxisSizing || 'fixed') === 'fixed' ? 'active' : ''}`}
                onClick={() => handleSizingChange('counter', 'fixed')}
                title="Fixed size"
              >
                <FixedIcon active={(autoLayout.counterAxisSizing || 'fixed') === 'fixed'} />
              </button>
              <button
                className={`sizing-btn ${autoLayout.counterAxisSizing === 'hug' ? 'active' : ''}`}
                onClick={() => handleSizingChange('counter', 'hug')}
                title="Hug contents"
              >
                <HugIcon active={autoLayout.counterAxisSizing === 'hug'} />
              </button>
              <button
                className={`sizing-btn ${autoLayout.counterAxisSizing === 'fill' ? 'active' : ''}`}
                onClick={() => handleSizingChange('counter', 'fill')}
                title="Fill container"
              >
                <FillIcon active={autoLayout.counterAxisSizing === 'fill'} />
              </button>
            </div>
          </div>

          {/* Gap */}
          <div className="auto-layout-row">
            <span className="auto-layout-label">
              <GapIcon /> Gap
            </span>
            <input
              type="number"
              className="auto-layout-input"
              value={autoLayout.gap}
              min={0}
              onChange={(e) => handleGapChange(parseInt(e.target.value) || 0)}
            />
          </div>

          {/* Padding */}
          <div className="auto-layout-row padding-row">
            <span className="auto-layout-label">
              <PaddingIcon /> Padding
            </span>
            <button
              className={`padding-link-btn ${paddingLinked ? 'linked' : ''}`}
              onClick={() => setPaddingLinked(!paddingLinked)}
              title={paddingLinked ? 'Unlink padding' : 'Link padding'}
            >
              {paddingLinked ? '🔗' : '⛓️‍💥'}
            </button>
          </div>

          {paddingLinked ? (
            <div className="auto-layout-row">
              <input
                type="number"
                className="auto-layout-input padding-input"
                value={autoLayout.paddingTop}
                min={0}
                onChange={(e) => handlePaddingChange(parseInt(e.target.value) || 0)}
                placeholder="All"
              />
            </div>
          ) : (
            <div className="padding-grid">
              <div className="padding-input-group">
                <span>T</span>
                <input
                  type="number"
                  value={autoLayout.paddingTop}
                  min={0}
                  onChange={(e) => handlePaddingChange(parseInt(e.target.value) || 0, 'top')}
                />
              </div>
              <div className="padding-input-group">
                <span>R</span>
                <input
                  type="number"
                  value={autoLayout.paddingRight}
                  min={0}
                  onChange={(e) => handlePaddingChange(parseInt(e.target.value) || 0, 'right')}
                />
              </div>
              <div className="padding-input-group">
                <span>B</span>
                <input
                  type="number"
                  value={autoLayout.paddingBottom}
                  min={0}
                  onChange={(e) => handlePaddingChange(parseInt(e.target.value) || 0, 'bottom')}
                />
              </div>
              <div className="padding-input-group">
                <span>L</span>
                <input
                  type="number"
                  value={autoLayout.paddingLeft}
                  min={0}
                  onChange={(e) => handlePaddingChange(parseInt(e.target.value) || 0, 'left')}
                />
              </div>
            </div>
          )}

          {/* Alignment */}
          <div className="auto-layout-row">
            <span className="auto-layout-label">Align</span>
            <div className="auto-layout-align-btns">
              <button
                className={`align-btn ${autoLayout.alignItems === 'start' ? 'active' : ''}`}
                onClick={() => handleAlignChange('start')}
                title="Align start"
              >
                <AlignStartIcon />
              </button>
              <button
                className={`align-btn ${autoLayout.alignItems === 'center' ? 'active' : ''}`}
                onClick={() => handleAlignChange('center')}
                title="Align center"
              >
                <AlignCenterIcon />
              </button>
              <button
                className={`align-btn ${autoLayout.alignItems === 'end' ? 'active' : ''}`}
                onClick={() => handleAlignChange('end')}
                title="Align end"
              >
                <AlignEndIcon />
              </button>
              <button
                className={`align-btn ${autoLayout.alignItems === 'stretch' ? 'active' : ''}`}
                onClick={() => handleAlignChange('stretch')}
                title="Stretch"
              >
                <AlignStretchIcon />
              </button>
            </div>
          </div>

          {/* Justify */}
          <div className="auto-layout-row">
            <span className="auto-layout-label">Distribute</span>
            <div className="auto-layout-justify-btns">
              <button
                className={`justify-btn ${autoLayout.justifyContent === 'start' ? 'active' : ''}`}
                onClick={() => handleJustifyChange('start')}
                title="Pack start"
              >
                Start
              </button>
              <button
                className={`justify-btn ${autoLayout.justifyContent === 'center' ? 'active' : ''}`}
                onClick={() => handleJustifyChange('center')}
                title="Pack center"
              >
                Center
              </button>
              <button
                className={`justify-btn ${autoLayout.justifyContent === 'end' ? 'active' : ''}`}
                onClick={() => handleJustifyChange('end')}
                title="Pack end"
              >
                End
              </button>
              <button
                className={`justify-btn ${autoLayout.justifyContent === 'space-between' ? 'active' : ''}`}
                onClick={() => handleJustifyChange('space-between')}
                title="Space between"
              >
                <SpaceBetweenIcon />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { ChildLayoutSection };
