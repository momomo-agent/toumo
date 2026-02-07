import { useState, useEffect } from 'react';
import { useEditorStore } from '../../store';
import type { OverflowScrollConfig, OverflowScrollDirection } from '../../types';
import { DEFAULT_OVERFLOW_SCROLL } from '../../types';
import './OverflowPanel.css';

const DIRECTION_OPTIONS: { value: OverflowScrollDirection; label: string; icon: string }[] = [
  { value: 'none', label: 'None', icon: '⊘' },
  { value: 'horizontal', label: 'Horizontal', icon: '↔' },
  { value: 'vertical', label: 'Vertical', icon: '↕' },
  { value: 'both', label: 'Both', icon: '⤡' },
];

const SCROLLBAR_STYLES = [
  { value: 'auto', label: 'Auto' },
  { value: 'thin', label: 'Thin' },
  { value: 'hidden', label: 'Hidden' },
] as const;

const SCROLL_BEHAVIORS = [
  { value: 'auto', label: 'Auto' },
  { value: 'smooth', label: 'Smooth' },
] as const;

const SNAP_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'x mandatory', label: 'X Mandatory' },
  { value: 'y mandatory', label: 'Y Mandatory' },
  { value: 'both mandatory', label: 'Both Mandatory' },
  { value: 'x proximity', label: 'X Proximity' },
  { value: 'y proximity', label: 'Y Proximity' },
] as const;

export function OverflowPanel() {
  const {
    selectedElementId,
    updateElement,
  } = useEditorStore();

  const sharedElements = useEditorStore(s => s.sharedElements);
  const selectedElement = sharedElements.find(
    (el: { id: string }) => el.id === selectedElementId
  );

  const [config, setConfig] = useState<OverflowScrollConfig>(DEFAULT_OVERFLOW_SCROLL);

  // Sync with element
  useEffect(() => {
    if (selectedElement) {
      setConfig(selectedElement.overflowScroll || DEFAULT_OVERFLOW_SCROLL);
    }
  }, [selectedElement?.id, selectedElement?.overflowScroll]);

  // Only show for frame elements
  if (!selectedElement || selectedElement.shapeType !== 'frame') return null;

  const updateConfig = (updates: Partial<OverflowScrollConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    // Sync overflow style property along with config
    const overflowValue: 'visible' | 'hidden' | 'scroll' = newConfig.enabled
      ? getOverflowCSS(newConfig.direction)
      : 'hidden';
    updateElement(selectedElement.id, {
      overflowScroll: newConfig,
      style: { ...(selectedElement.style || {}), overflow: overflowValue } as any,
    });
  };

  const handleToggle = () => {
    updateConfig({ enabled: !config.enabled });
  };

  return (
    <div className="figma-section">
      <div className="figma-section-header">
        <span className="figma-section-title">Overflow</span>
      </div>
      <div className="overflow-panel">
        {/* Enable toggle */}
        <div className="overflow-toggle-row">
          <span className="overflow-toggle-label">
            <span className="overflow-toggle-icon">📜</span>
            Scroll
          </span>
          <button
            className={`overflow-toggle-switch ${config.enabled ? 'active' : ''}`}
            onClick={handleToggle}
          />
        </div>

        {config.enabled && (
          <>
            {/* Direction selector */}
            <div className="overflow-direction-row">
              {DIRECTION_OPTIONS.filter(o => o.value !== 'none').map(opt => (
                <button
                  key={opt.value}
                  className={`overflow-direction-btn ${config.direction === opt.value ? 'active' : ''}`}
                  onClick={() => updateConfig({ direction: opt.value })}
                  title={opt.label}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Options */}
            <div className="overflow-options">
              <div className="overflow-option-row">
                <span className="overflow-option-label">Scrollbar</span>
                <select
                  className="overflow-select"
                  value={config.scrollbarStyle}
                  onChange={e => updateConfig({ scrollbarStyle: e.target.value as OverflowScrollConfig['scrollbarStyle'] })}
                >
                  {SCROLLBAR_STYLES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-option-row">
                <span className="overflow-option-label">Behavior</span>
                <select
                  className="overflow-select"
                  value={config.scrollBehavior}
                  onChange={e => updateConfig({ scrollBehavior: e.target.value as OverflowScrollConfig['scrollBehavior'] })}
                >
                  {SCROLL_BEHAVIORS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Snap section */}
              <div className="overflow-snap-section">
                <div className="overflow-snap-header">
                  <span className="overflow-snap-label">
                    🧲 Scroll Snap
                  </span>
                  <button
                    className={`overflow-toggle-switch ${config.snapEnabled ? 'active' : ''}`}
                    onClick={() => updateConfig({ snapEnabled: !config.snapEnabled })}
                  />
                </div>
                {config.snapEnabled && (
                  <div className="overflow-option-row">
                    <span className="overflow-option-label">Type</span>
                    <select
                      className="overflow-select"
                      value={config.snapType}
                      onChange={e => updateConfig({ snapType: e.target.value as OverflowScrollConfig['snapType'] })}
                    >
                      {SNAP_TYPES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Convert direction config to CSS overflow value */
function getOverflowCSS(direction: OverflowScrollDirection): 'visible' | 'hidden' | 'scroll' {
  switch (direction) {
    case 'horizontal':
    case 'vertical':
    case 'both':
      return 'scroll';
    default:
      return 'hidden';
  }
}
