import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditorStore } from '../../store';
import { ColorPicker } from './ColorPicker';
import { GradientEditor } from './GradientEditor';
import { AutoLayoutPanel, ChildLayoutSection } from './AutoLayoutPanel';
import { ConstraintsPanel } from './ConstraintsPanel';
import { OverflowPanel } from './OverflowPanel';
import { PrototypeLinkPanel } from './PrototypeLinkPanel';
import { TextPropertiesPanel } from './TextPropertiesPanel';
import './TextPropertiesPanel.css';
import './DesignPanel.css';

// Icons as SVG components
const LockIcon = ({ locked }: { locked: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    {locked ? (
      <>
        <rect x="2" y="5" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M4 5V3.5C4 2.12 5.12 1 6.5 1h-1C4.12 1 3 2.12 3 3.5V5" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M8 5V3.5C8 2.12 6.88 1 5.5 1h1C7.88 1 9 2.12 9 3.5V5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </>
    ) : (
      <>
        <rect x="2" y="5" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M4 5V3.5C4 2.12 5.12 1 6.5 1h-1C4.12 1 3 2.12 3 3.5V5" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M9 3.5V5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </>
    )}
  </svg>
);

const RotateIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M10 6A4 4 0 1 1 6 2" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <path d="M6 2L8 2L8 4" stroke="currentColor" strokeWidth="1.2" fill="none" />
  </svg>
);

const CornerRadiusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 10V5C2 3.34 3.34 2 5 2H10" stroke="currentColor" strokeWidth="1.2" fill="none" />
  </svg>
);

const IndependentCornersIcon = ({ active }: { active: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M1 4V3C1 1.9 1.9 1 3 1H4" stroke={active ? "#3b82f6" : "currentColor"} strokeWidth="1.2" fill="none" />
    <path d="M8 1H9C10.1 1 11 1.9 11 3V4" stroke={active ? "#3b82f6" : "currentColor"} strokeWidth="1.2" fill="none" />
    <path d="M11 8V9C11 10.1 10.1 11 9 11H8" stroke={active ? "#3b82f6" : "currentColor"} strokeWidth="1.2" fill="none" />
    <path d="M4 11H3C1.9 11 1 10.1 1 9V8" stroke={active ? "#3b82f6" : "currentColor"} strokeWidth="1.2" fill="none" />
  </svg>
);

const EyeIcon = ({ visible }: { visible: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    {visible ? (
      <>
        <path d="M1 7C1 7 3 3 7 3C11 3 13 7 13 7C13 7 11 11 7 11C3 11 1 7 1 7Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </>
    ) : (
      <>
        <path d="M1 7C1 7 3 3 7 3C11 3 13 7 13 7" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.5" />
        <line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.2" />
      </>
    )}
  </svg>
);

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <line x1="6" y1="2" x2="6" y2="10" stroke="currentColor" strokeWidth="1.5" />
    <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const MinusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
    <path d="M3 2L7 5L3 8" stroke="currentColor" strokeWidth="1.2" fill="none" />
  </svg>
);

// Blend mode icon
const BlendModeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <circle cx="5" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.2" fill="none" />
  </svg>
);

// Opacity icon
const OpacityIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <path d="M1 6L11 6" stroke="currentColor" strokeWidth="1.2" />
    <rect x="1" y="6" width="10" height="5" rx="1" fill="currentColor" opacity="0.3" />
  </svg>
);

// Interaction icon
const InteractionIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="4" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <circle cx="10" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <path d="M6.5 7H7.5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M7 5.5L8.5 7L7 8.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
  </svg>
);

// Number input with label + drag-to-adjust
interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}

function NumberInput({ label, value, onChange, min, max, step = 1, unit, disabled }: NumberInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startValue: 0, hasMoved: false });
  const inputRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  const clampValue = useCallback((v: number) => {
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return Math.round(v * 100) / 100;
  }, [min, max]);

  // Drag on label to scrub value
  const handleLabelMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startValue: value, hasMoved: false };

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragRef.current.startX;
      if (Math.abs(dx) > 2) dragRef.current.hasMoved = true;
      if (!dragRef.current.hasMoved) return;

      if (!isDragging) setIsDragging(true);
      const multiplier = ev.shiftKey ? 10 : ev.altKey ? 0.1 : 1;
      const newVal = clampValue(dragRef.current.startValue + dx * step * multiplier);
      onChange(newVal);
    };

    const onUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      // If didn't drag, focus the input for editing
      if (!dragRef.current.hasMoved && inputRef.current) {
        setIsEditing(true);
        setEditValue(String(Math.round(value * 100) / 100));
        setTimeout(() => inputRef.current?.select(), 0);
      }
    };

    document.body.style.cursor = 'ew-resize';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [value, onChange, step, disabled, isDragging, clampValue]);

  // Direct input editing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const commitEdit = () => {
    const val = parseFloat(editValue);
    if (!isNaN(val)) {
      onChange(clampValue(val));
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const multiplier = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      const delta = e.key === 'ArrowUp' ? step * multiplier : -step * multiplier;
      const newVal = clampValue(value + delta);
      onChange(newVal);
      setEditValue(String(Math.round(newVal * 100) / 100));
    }
  };

  const displayValue = Math.round(value * 100) / 100;

  return (
    <div className={`figma-input-group ${isDragging ? 'dragging' : ''}`}>
      <span
        ref={labelRef}
        className={`figma-input-label ${disabled ? '' : 'draggable'}`}
        onMouseDown={handleLabelMouseDown}
      >
        {label}
      </span>
      <input
        ref={inputRef}
        type={isEditing ? 'text' : 'number'}
        className="figma-number-input"
        value={isEditing ? editValue : displayValue}
        onChange={isEditing ? handleInputChange : (e) => {
          const val = parseFloat(e.target.value);
          if (!isNaN(val)) onChange(clampValue(val));
        }}
        onFocus={() => {
          if (!isEditing) {
            setIsEditing(true);
            setEditValue(String(displayValue));
            setTimeout(() => inputRef.current?.select(), 0);
          }
        }}
        onBlur={commitEdit}
        onKeyDown={handleKeyDown}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
      {unit && <span className="figma-input-unit">{unit}</span>}
    </div>
  );
}

// Collapsible section with animated expand/collapse
interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  onAdd?: () => void;
}

function Section({ title, children, defaultExpanded = true, onAdd }: SectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  // Animate height on expand/collapse
  useEffect(() => {
    const el = contentRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;

    if (expanded) {
      // Expanding: measure target height, animate from 0
      const targetHeight = inner.scrollHeight;
      el.style.height = '0px';
      el.style.opacity = '0';
      // Force reflow
      el.offsetHeight;
      el.style.height = `${targetHeight}px`;
      el.style.opacity = '1';

      const onEnd = () => {
        el.style.height = 'auto';
        el.removeEventListener('transitionend', onEnd);
      };
      el.addEventListener('transitionend', onEnd);
    } else {
      // Collapsing: set explicit height first, then animate to 0
      const currentHeight = el.scrollHeight;
      el.style.height = `${currentHeight}px`;
      el.style.opacity = '1';
      // Force reflow
      el.offsetHeight;
      el.style.height = '0px';
      el.style.opacity = '0';
    }
  }, [expanded]);

  return (
    <div className="figma-section">
      <div className="figma-section-header" onClick={() => setExpanded(!expanded)}>
        <ChevronIcon expanded={expanded} />
        <span className="figma-section-title">{title}</span>
        {onAdd && (
          <button className="figma-icon-btn" onClick={(e) => { e.stopPropagation(); onAdd(); }}>
            <PlusIcon />
          </button>
        )}
      </div>
      <div
        ref={contentRef}
        className="figma-section-collapse"
        style={{ height: defaultExpanded ? 'auto' : 0, opacity: defaultExpanded ? 1 : 0 }}
      >
        <div ref={innerRef} className="figma-section-content">
          {children}
        </div>
      </div>
    </div>
  );
}

// Fill item component
interface FillItemProps {
  fill: {
    id: string;
    color: string;
    opacity: number;
    visible: boolean;
  };
  onUpdate: (updates: Partial<FillItemProps['fill']>) => void;
  onRemove: () => void;
}

function FillItem({ fill, onUpdate, onRemove }: FillItemProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="figma-fill-item">
      <button 
        className="figma-icon-btn visibility-btn"
        onClick={() => onUpdate({ visible: !fill.visible })}
      >
        <EyeIcon visible={fill.visible} />
      </button>
      <div 
        className="figma-color-swatch"
        style={{ backgroundColor: fill.color, opacity: fill.opacity }}
        onClick={() => setShowPicker(!showPicker)}
      />
      <input
        type="text"
        className="figma-color-input"
        value={fill.color.toUpperCase()}
        onChange={(e) => onUpdate({ color: e.target.value })}
      />
      <input
        type="number"
        className="figma-opacity-input"
        value={Math.round(fill.opacity * 100)}
        min={0}
        max={100}
        onChange={(e) => onUpdate({ opacity: parseInt(e.target.value) / 100 })}
      />
      <span className="figma-input-unit">%</span>
      <button className="figma-icon-btn remove-btn" onClick={onRemove}>
        <MinusIcon />
      </button>
      {showPicker && (
        <ColorPicker
          color={fill.color}
          opacity={fill.opacity}
          onChange={(color, opacity) => onUpdate({ color, opacity })}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

// Stroke position options
const STROKE_POSITIONS = [
  { value: 'center', label: 'Center' },
  { value: 'inside', label: 'Inside' },
  { value: 'outside', label: 'Outside' },
];

// Blend modes
const BLEND_MODES = [
  { value: 'normal', label: 'Pass through' },
  { value: 'normal', label: 'Normal' },
  { value: 'darken', label: 'Darken' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'screen', label: 'Screen' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' },
  { value: 'hue', label: 'Hue' },
  { value: 'saturation', label: 'Saturation' },
  { value: 'color', label: 'Color' },
  { value: 'luminosity', label: 'Luminosity' },
];

// Stroke item component
interface StrokeItemProps {
  stroke: {
    id: string;
    color: string;
    width: number;
    position: string;
    dashArray?: string;
    visible: boolean;
  };
  onUpdate: (updates: Partial<StrokeItemProps['stroke']>) => void;
  onRemove: () => void;
}

function StrokeItem({ stroke, onUpdate, onRemove }: StrokeItemProps) {
  return (
    <div className="figma-stroke-item">
      <div className="figma-stroke-row">
        <button 
          className="figma-icon-btn visibility-btn"
          onClick={() => onUpdate({ visible: !stroke.visible })}
        >
          <EyeIcon visible={stroke.visible} />
        </button>
        <div 
          className="figma-color-swatch"
          style={{ backgroundColor: stroke.color }}
        />
        <input
          type="text"
          className="figma-color-input"
          value={stroke.color.toUpperCase()}
          onChange={(e) => onUpdate({ color: e.target.value })}
        />
        <input
          type="number"
          className="figma-stroke-width-input"
          value={stroke.width}
          min={0}
          onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 0 })}
        />
        <button className="figma-icon-btn remove-btn" onClick={onRemove}>
          <MinusIcon />
        </button>
      </div>
      <div className="figma-stroke-options">
        <select
          className="figma-select"
          value={stroke.position}
          onChange={(e) => onUpdate({ position: e.target.value })}
        >
          {STROKE_POSITIONS.map(pos => (
            <option key={pos.value} value={pos.value}>{pos.label}</option>
          ))}
        </select>
        <input
          type="text"
          className="figma-dash-input"
          placeholder="Dash"
          value={stroke.dashArray || ''}
          onChange={(e) => onUpdate({ dashArray: e.target.value })}
        />
      </div>
    </div>
  );
}

// Effect types
const EFFECT_TYPES = [
  { value: 'dropShadow', label: 'Drop Shadow' },
  { value: 'innerShadow', label: 'Inner Shadow' },
  { value: 'layerBlur', label: 'Layer Blur' },
  { value: 'backgroundBlur', label: 'Background Blur' },
];

// Shadow presets
const SHADOW_PRESETS = [
  { label: 'Subtle', offsetX: 0, offsetY: 1, blur: 3, spread: 0, color: '#00000026' },
  { label: 'Medium', offsetX: 0, offsetY: 4, blur: 12, spread: -2, color: '#00000040' },
  { label: 'Heavy', offsetX: 0, offsetY: 12, blur: 32, spread: -4, color: '#00000066' },
  { label: 'Glow', offsetX: 0, offsetY: 0, blur: 20, spread: 4, color: '#3b82f680' },
];

// Effect item component
interface EffectItemProps {
  effect: {
    id: string;
    type: string;
    visible: boolean;
    color?: string;
    offsetX?: number;
    offsetY?: number;
    blur?: number;
    spread?: number;
  };
  onUpdate: (updates: Partial<EffectItemProps['effect']>) => void;
  onRemove: () => void;
}

function EffectItem({ effect, onUpdate, onRemove }: EffectItemProps) {
  const isShadow = effect.type === 'dropShadow' || effect.type === 'innerShadow';
  const isBlur = effect.type === 'layerBlur' || effect.type === 'backgroundBlur';
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`figma-effect-item ${!effect.visible ? 'disabled' : ''}`}>
      <div className="figma-effect-header">
        <button 
          className="figma-icon-btn visibility-btn"
          onClick={() => onUpdate({ visible: !effect.visible })}
        >
          <EyeIcon visible={effect.visible} />
        </button>
        <select
          className="figma-select effect-type-select"
          value={effect.type}
          onChange={(e) => {
            const newType = e.target.value;
            // When switching between shadow types, preserve values
            if ((newType === 'dropShadow' || newType === 'innerShadow') && !isShadow) {
              onUpdate({ type: newType, color: '#00000040', offsetX: 0, offsetY: 4, blur: 8, spread: 0 });
            } else {
              onUpdate({ type: newType });
            }
          }}
        >
          {EFFECT_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        {isShadow && (
          <button
            className="figma-icon-btn"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            <ChevronIcon expanded={expanded} />
          </button>
        )}
        <button className="figma-icon-btn remove-btn" onClick={onRemove}>
          <MinusIcon />
        </button>
      </div>
      {isShadow && expanded && (
        <div className="figma-effect-details">
          {/* Shadow presets */}
          <div className="figma-effect-presets-row">
            <button
              className="figma-preset-toggle"
              onClick={() => setShowPresets(!showPresets)}
            >
              Presets ▾
            </button>
            {showPresets && (
              <div className="figma-preset-menu">
                {SHADOW_PRESETS.map(preset => (
                  <button
                    key={preset.label}
                    className="figma-preset-option"
                    onClick={() => {
                      onUpdate({
                        offsetX: preset.offsetX,
                        offsetY: preset.offsetY,
                        blur: preset.blur,
                        spread: preset.spread,
                        color: preset.color,
                      });
                      setShowPresets(false);
                    }}
                  >
                    <span
                      className="figma-preset-preview"
                      style={{
                        boxShadow: `${effect.type === 'innerShadow' ? 'inset ' : ''}${preset.offsetX}px ${preset.offsetY}px ${preset.blur}px ${preset.spread}px ${preset.color}`,
                      }}
                    />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Color + offsets */}
          <div className="figma-effect-row">
            <div className="figma-color-swatch-wrapper">
              <div 
                className="figma-color-swatch small"
                style={{ backgroundColor: effect.color || '#000000' }}
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="Click to change color"
              />
              {showColorPicker && (
                <ColorPicker
                  color={effect.color || '#000000'}
                  opacity={1}
                  onChange={(color) => onUpdate({ color })}
                  onClose={() => setShowColorPicker(false)}
                />
              )}
            </div>
            <NumberInput label="X" value={effect.offsetX || 0} onChange={(v) => onUpdate({ offsetX: v })} />
            <NumberInput label="Y" value={effect.offsetY || 0} onChange={(v) => onUpdate({ offsetY: v })} />
          </div>
          {/* Blur + Spread */}
          <div className="figma-effect-row">
            <NumberInput label="Blur" value={effect.blur || 0} onChange={(v) => onUpdate({ blur: v })} min={0} />
            <NumberInput label="Spread" value={effect.spread || 0} onChange={(v) => onUpdate({ spread: v })} />
          </div>
        </div>
      )}
      {isBlur && (
        <div className="figma-effect-details">
          <NumberInput label="Blur" value={effect.blur || 0} onChange={(v) => onUpdate({ blur: v })} min={0} />
        </div>
      )}
    </div>
  );
}

// Parse CSS box-shadow string into structured shadow objects
function parseBoxShadow(value: string): { inset: boolean; offsetX: number; offsetY: number; blur: number; spread: number; color: string }[] {
  if (!value || value === 'none') return [];
  
  const results: { inset: boolean; offsetX: number; offsetY: number; blur: number; spread: number; color: string }[] = [];
  
  // Split by comma but respect parentheses (for rgba/hsla)
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());

  for (const part of parts) {
    const inset = part.includes('inset');
    const cleaned = part.replace('inset', '').trim();
    
    // Extract color (rgba, hsla, hex, or named)
    let color = '#00000040';
    const rgbaMatch = cleaned.match(/rgba?\([^)]+\)/);
    const hslaMatch = cleaned.match(/hsla?\([^)]+\)/);
    const hexMatch = cleaned.match(/#[0-9a-fA-F]{3,8}/);
    
    if (rgbaMatch) color = rgbaMatch[0];
    else if (hslaMatch) color = hslaMatch[0];
    else if (hexMatch) color = hexMatch[0];
    
    // Extract numeric values (px)
    const nums = cleaned
      .replace(/rgba?\([^)]+\)/, '')
      .replace(/hsla?\([^)]+\)/, '')
      .replace(/#[0-9a-fA-F]{3,8}/, '')
      .match(/-?\d+(?:\.\d+)?/g);
    
    const offsetX = nums?.[0] ? parseFloat(nums[0]) : 0;
    const offsetY = nums?.[1] ? parseFloat(nums[1]) : 0;
    const blur = nums?.[2] ? parseFloat(nums[2]) : 0;
    const spread = nums?.[3] ? parseFloat(nums[3]) : 0;
    
    results.push({ inset, offsetX, offsetY, blur, spread, color });
  }
  
  return results;
}

// Main Design Panel
export function DesignPanel() {
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

  // Local state for aspect ratio lock
  const [aspectLocked, setAspectLocked] = useState(false);
  const [_aspectRatio, setAspectRatio] = useState(1);

  // Local state for fills, strokes, effects (synced with element)
  const [fills, setFills] = useState<FillItemProps['fill'][]>([]);
  const [strokes, setStrokes] = useState<StrokeItemProps['stroke'][]>([]);
  const [effects, setEffects] = useState<EffectItemProps['effect'][]>([]);

  // Corner radius state
  const [cornerRadius, setCornerRadius] = useState(0);
  const [independentCorners, setIndependentCorners] = useState(false);
  const [corners, setCorners] = useState({ tl: 0, tr: 0, br: 0, bl: 0 });

  // Rotation state
  const [rotation, setRotation] = useState(0);

  // Layer opacity and blend mode
  const [layerOpacity, setLayerOpacity] = useState(100);
  const [blendMode, setBlendMode] = useState('normal');

  // Image replace file input ref
  const imageReplaceRef = useRef<HTMLInputElement>(null);

  if (!selectedElement) {
    return (
      <div className="figma-design-panel">
        <div className="figma-empty-state">
          <p>Select a layer to see its properties</p>
        </div>
      </div>
    );
  }

  const element = selectedElement as {
    id: string;
    shapeType?: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    style?: {
      fill?: string;
      fillOpacity?: number;
      opacity?: number;
      borderRadius?: number;
      borderRadiusTL?: number;
      borderRadiusTR?: number;
      borderRadiusBR?: number;
      borderRadiusBL?: number;
      stroke?: string;
      strokeWidth?: number;
      strokeOpacity?: number;
      strokeDasharray?: string;
      rotation?: number;
      blendMode?: string;
      boxShadow?: string;
      filter?: string;
      gradientType?: 'none' | 'linear' | 'radial';
      gradientAngle?: number;
      gradientStops?: { color: string; position: number }[];
      gradientCenterX?: number;
      gradientCenterY?: number;
      // Image properties
      imageSrc?: string;
      imageOriginalWidth?: number;
      imageOriginalHeight?: number;
      objectFit?: 'fill' | 'contain' | 'cover' | 'none';
      objectPosition?: string;
    };
  };

  // Sync local state with element when selection changes
  useEffect(() => {
    if (element?.style) {
      setRotation(element.style.rotation || 0);
      setLayerOpacity(Math.round((element.style.opacity ?? 1) * 100));
      setBlendMode(element.style.blendMode || 'normal');
      
      // Corner radius
      const hasIndependent = element.style.borderRadiusTL !== undefined ||
        element.style.borderRadiusTR !== undefined ||
        element.style.borderRadiusBL !== undefined ||
        element.style.borderRadiusBR !== undefined;
      
      if (hasIndependent) {
        setIndependentCorners(true);
        setCorners({
          tl: element.style.borderRadiusTL || 0,
          tr: element.style.borderRadiusTR || 0,
          bl: element.style.borderRadiusBL || 0,
          br: element.style.borderRadiusBR || 0,
        });
      } else {
        setIndependentCorners(false);
        setCornerRadius(element.style.borderRadius || 0);
      }

      // Initialize fills from element style
      if (element.style.fill) {
        setFills([{
          id: 'fill-0',
          color: element.style.fill,
          opacity: element.style.fillOpacity ?? 1,
          visible: true,
        }]);
      } else {
        setFills([]);
      }

      // Initialize strokes from element style
      if (element.style.stroke) {
        setStrokes([{
          id: 'stroke-0',
          color: element.style.stroke,
          width: element.style.strokeWidth ?? 1,
          position: 'center',
          dashArray: element.style.strokeDasharray || '',
          visible: true,
        }]);
      } else {
        setStrokes([]);
      }

      // Initialize effects from element style - parse actual boxShadow values
      const newEffects: EffectItemProps['effect'][] = [];
      if (element.style.boxShadow) {
        const parsed = parseBoxShadow(element.style.boxShadow);
        parsed.forEach((s, i) => {
          newEffects.push({
            id: `effect-shadow-${i}`,
            type: s.inset ? 'innerShadow' : 'dropShadow',
            visible: true,
            color: s.color,
            offsetX: s.offsetX,
            offsetY: s.offsetY,
            blur: s.blur,
            spread: s.spread,
          });
        });
      }
      if (element.style.filter) {
        const blurMatch = element.style.filter.match(/blur\((\d+(?:\.\d+)?)px\)/);
        newEffects.push({
          id: 'effect-blur-0',
          type: 'layerBlur',
          visible: true,
          blur: blurMatch ? parseFloat(blurMatch[1]) : 4,
        });
      }
      setEffects(newEffects);
    }
  }, [element?.id]);

  // Update element style helper
  const updateStyle = useCallback((updates: Record<string, unknown>) => {
    updateElement(element.id, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style: { ...element.style, ...updates } as any
    });
  }, [element?.id, element?.style, updateElement]);

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    updateElement(element.id, {
      position: { ...element.position, [axis]: value }
    });
  };

  const handleSizeChange = (dim: 'width' | 'height', value: number) => {
    if (aspectLocked) {
      const ratio = element.size.width / element.size.height;
      if (dim === 'width') {
        updateElement(element.id, {
          size: { width: value, height: value / ratio }
        });
      } else {
        updateElement(element.id, {
          size: { width: value * ratio, height: value }
        });
      }
    } else {
      updateElement(element.id, {
        size: { ...element.size, [dim]: value }
      });
    }
  };

  // Sync effects array to element style (boxShadow + filter)
  const syncEffectsToStyle = useCallback((effs: EffectItemProps['effect'][]) => {
    const shadows = effs
      .filter(e => e.visible && (e.type === 'dropShadow' || e.type === 'innerShadow'))
      .map(e => {
        const inset = e.type === 'innerShadow' ? 'inset ' : '';
        return `${inset}${e.offsetX || 0}px ${e.offsetY || 0}px ${e.blur || 0}px ${e.spread || 0}px ${e.color || '#00000040'}`;
      });
    const blurs = effs
      .filter(e => e.visible && (e.type === 'layerBlur' || e.type === 'backgroundBlur'))
      .map(e => `blur(${e.blur || 0}px)`);

    updateStyle({
      boxShadow: shadows.length > 0 ? shadows.join(', ') : undefined,
      filter: blurs.length > 0 ? blurs.join(' ') : undefined,
    });
  }, [updateStyle]);

  const addFill = () => {
    const newFill = { id: Date.now().toString(), color: '#808080', opacity: 1, visible: true };
    const newFills = [...fills, newFill];
    setFills(newFills);
    // If this is the first fill, sync to element
    if (fills.length === 0) {
      updateStyle({ fill: newFill.color, fillOpacity: newFill.opacity });
    }
  };

  const addStroke = () => {
    const newStroke = { id: Date.now().toString(), color: '#000000', width: 1, position: 'center', visible: true };
    const newStrokes = [...strokes, newStroke];
    setStrokes(newStrokes);
    if (strokes.length === 0) {
      updateStyle({ stroke: newStroke.color, strokeWidth: newStroke.width });
    }
  };

  const addEffect = () => {
    const newEffect = {
      id: Date.now().toString(),
      type: 'dropShadow',
      visible: true,
      color: '#00000040',
      offsetX: 0,
      offsetY: 4,
      blur: 8,
      spread: 0
    };
    const newEffects = [...effects, newEffect];
    setEffects(newEffects);
    syncEffectsToStyle(newEffects);
  };

  return (
    <div className="figma-design-panel">
      {/* Auto Layout Section */}
      <AutoLayoutPanel />

      {/* Child Layout Section (when child of auto layout parent is selected) */}
      <ChildLayoutSection />

      {/* Constraints Section */}
      <ConstraintsPanel />

      {/* Overflow Scroll Section (Frame only) */}
      <OverflowPanel />

      {/* Layer Section - Opacity & Blend Mode */}
      <Section title="Layer" defaultExpanded={true}>
        <div className="figma-layer-row">
          <div className="figma-input-group with-icon">
            <BlendModeIcon />
            <select
              className="figma-select blend-mode-select"
              value={blendMode}
              onChange={(e) => {
                setBlendMode(e.target.value);
                updateStyle({ blendMode: e.target.value });
              }}
            >
              {BLEND_MODES.map((mode, index) => (
                <option key={`${mode.value}-${index}`} value={mode.value}>{mode.label}</option>
              ))}
            </select>
          </div>
          <div className="figma-input-group with-icon opacity-group">
            <OpacityIcon />
            <input
              type="number"
              className="figma-number-input"
              value={layerOpacity}
              min={0}
              max={100}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setLayerOpacity(val);
                updateStyle({ opacity: val / 100 });
              }}
            />
            <span className="figma-input-unit">%</span>
          </div>
        </div>
      </Section>

      {/* Position & Size Section */}
      <Section title="Frame" defaultExpanded={true}>
        <div className="figma-position-grid">
          <NumberInput 
            label="X" 
            value={element.position.x} 
            onChange={(v) => handlePositionChange('x', v)} 
          />
          <NumberInput 
            label="Y" 
            value={element.position.y} 
            onChange={(v) => handlePositionChange('y', v)} 
          />
          <NumberInput 
            label="W" 
            value={element.size.width} 
            onChange={(v) => handleSizeChange('width', v)} 
          />
          <div className="figma-input-with-lock">
            <NumberInput 
              label="H" 
              value={element.size.height} 
              onChange={(v) => handleSizeChange('height', v)} 
            />
            <button 
              className={`figma-lock-btn ${aspectLocked ? 'locked' : ''}`}
              onClick={() => {
                if (!aspectLocked) {
                  setAspectRatio(element.size.width / element.size.height);
                }
                setAspectLocked(!aspectLocked);
              }}
            >
              <LockIcon locked={aspectLocked} />
            </button>
          </div>
        </div>
        <div className="figma-transform-row">
          <div className="figma-input-group with-icon">
            <RotateIcon />
            <input
              type="number"
              className="figma-number-input"
              value={rotation}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setRotation(val);
                updateStyle({ rotation: val });
              }}
            />
            <span className="figma-input-unit">°</span>
          </div>
          <div className="figma-input-group with-icon">
            <CornerRadiusIcon />
            <input
              type="number"
              className="figma-number-input"
              placeholder={independentCorners && !(corners.tl === corners.tr && corners.tr === corners.br && corners.br === corners.bl) ? 'Mixed' : undefined}
              value={independentCorners ? (corners.tl === corners.tr && corners.tr === corners.br && corners.br === corners.bl ? corners.tl : '') : cornerRadius}
              min={0}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                if (independentCorners) {
                  // In independent mode, main input controls all four corners together
                  const newCorners = { tl: val, tr: val, br: val, bl: val };
                  setCorners(newCorners);
                  updateStyle({
                    borderRadiusTL: val,
                    borderRadiusTR: val,
                    borderRadiusBR: val,
                    borderRadiusBL: val,
                  });
                } else {
                  setCornerRadius(val);
                  updateStyle({ borderRadius: val });
                }
              }}
            />
            <button 
              className={`figma-icon-btn ${independentCorners ? 'active' : ''}`}
              onClick={() => {
                if (!independentCorners) {
                  // Switching to independent: populate all four from current uniform value
                  setCorners({ tl: cornerRadius, tr: cornerRadius, br: cornerRadius, bl: cornerRadius });
                  updateStyle({
                    borderRadiusTL: cornerRadius,
                    borderRadiusTR: cornerRadius,
                    borderRadiusBR: cornerRadius,
                    borderRadiusBL: cornerRadius,
                  });
                } else {
                  // Switching back to linked: use TL as the uniform value, clear individual overrides
                  const uniformVal = corners.tl;
                  setCornerRadius(uniformVal);
                  updateStyle({
                    borderRadius: uniformVal,
                    borderRadiusTL: undefined,
                    borderRadiusTR: undefined,
                    borderRadiusBR: undefined,
                    borderRadiusBL: undefined,
                  });
                }
                setIndependentCorners(!independentCorners);
              }}
              title="Independent corners"
            >
              <IndependentCornersIcon active={independentCorners} />
            </button>
          </div>
        </div>
        {independentCorners && (
          <div className="figma-corners-grid">
            <NumberInput label="TL" value={corners.tl} onChange={(v) => {
              const newCorners = { ...corners, tl: v };
              setCorners(newCorners);
              updateStyle({ borderRadiusTL: v });
            }} min={0} />
            <NumberInput label="TR" value={corners.tr} onChange={(v) => {
              const newCorners = { ...corners, tr: v };
              setCorners(newCorners);
              updateStyle({ borderRadiusTR: v });
            }} min={0} />
            <NumberInput label="BL" value={corners.bl} onChange={(v) => {
              const newCorners = { ...corners, bl: v };
              setCorners(newCorners);
              updateStyle({ borderRadiusBL: v });
            }} min={0} />
            <NumberInput label="BR" value={corners.br} onChange={(v) => {
              const newCorners = { ...corners, br: v };
              setCorners(newCorners);
              updateStyle({ borderRadiusBR: v });
            }} min={0} />
          </div>
        )}
      </Section>

      {/* Text Properties Section (only for text elements) */}
      <TextPropertiesPanel />

      {/* Fill Section */}
      <Section title="Fill" onAdd={addFill}>
        {fills.length === 0 ? (
          <div className="figma-empty-hint">Click + to add a fill</div>
        ) : (
          fills.map((fill, index) => (
            <FillItem
              key={fill.id}
              fill={fill}
              onUpdate={(updates) => {
                const newFills = [...fills];
                newFills[index] = { ...fill, ...updates };
                setFills(newFills);
                // Sync first visible fill back to element style
                const updated = newFills[index];
                if (index === 0) {
                  updateStyle({ fill: updated.color, fillOpacity: updated.opacity });
                }
              }}
              onRemove={() => {
                const remaining = fills.filter(f => f.id !== fill.id);
                setFills(remaining);
                if (remaining.length === 0) {
                  updateStyle({ fill: undefined, fillOpacity: undefined });
                } else {
                  updateStyle({ fill: remaining[0].color, fillOpacity: remaining[0].opacity });
                }
              }}
            />
          ))
        )}
        {/* Gradient Editor - always show when there's at least one fill */}
        {fills.length > 0 && (
          <GradientEditor
            gradientType={element.style?.gradientType || 'none'}
            gradientAngle={element.style?.gradientAngle ?? 180}
            gradientStops={element.style?.gradientStops || []}
            gradientCenterX={element.style?.gradientCenterX ?? 50}
            gradientCenterY={element.style?.gradientCenterY ?? 50}
            onChange={(updates) => updateStyle(updates)}
          />
        )}
      </Section>

      {/* Image Fit Mode Section */}
      {element.shapeType === 'image' && element.style?.imageSrc && (
        <Section title="Image" defaultExpanded={true}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Fit Mode Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#999', minWidth: 36 }}>Fit</span>
              <div style={{
                display: 'flex',
                flex: 1,
                background: '#2a2a2a',
                borderRadius: 6,
                overflow: 'hidden',
              }}>
                {(['fill', 'cover', 'contain'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateStyle({ objectFit: mode })}
                    style={{
                      flex: 1,
                      padding: '5px 0',
                      fontSize: 11,
                      fontWeight: (element.style?.objectFit || 'cover') === mode ? 600 : 400,
                      color: (element.style?.objectFit || 'cover') === mode ? '#fff' : '#888',
                      background: (element.style?.objectFit || 'cover') === mode ? '#3b82f6' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: 'all 0.15s',
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Object Position */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#999', minWidth: 36 }}>Pos</span>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 2,
                background: '#2a2a2a',
                borderRadius: 6,
                padding: 3,
              }}>
                {[
                  'top left', 'top center', 'top right',
                  'center left', 'center', 'center right',
                  'bottom left', 'bottom center', 'bottom right',
                ].map((pos) => (
                  <button
                    key={pos}
                    onClick={() => updateStyle({ objectPosition: pos })}
                    title={pos}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 3,
                      border: 'none',
                      cursor: 'pointer',
                      background: (element.style?.objectPosition || 'center') === pos
                        ? '#3b82f6' : '#444',
                      transition: 'all 0.15s',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Original dimensions info */}
            {element.style?.imageOriginalWidth && (
              <div style={{ fontSize: 10, color: '#666', paddingLeft: 44 }}>
                Original: {element.style.imageOriginalWidth} × {element.style.imageOriginalHeight}px
              </div>
            )}

            {/* Replace Image */}
            <button
              onClick={() => imageReplaceRef.current?.click()}
              style={{
                width: '100%',
                padding: '6px 0',
                fontSize: 11,
                color: '#aaa',
                background: '#2a2a2a',
                border: '1px solid #333',
                borderRadius: 6,
                cursor: 'pointer',
                marginTop: 2,
              }}
            >
              Replace Image…
            </button>
            <input
              ref={imageReplaceRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const dataUrl = ev.target?.result as string;
                  if (!dataUrl) return;
                  const img = new window.Image();
                  img.onload = () => {
                    updateStyle({
                      imageSrc: dataUrl,
                      imageOriginalWidth: img.width,
                      imageOriginalHeight: img.height,
                    });
                  };
                  img.src = dataUrl;
                };
                reader.readAsDataURL(file);
                e.target.value = '';
              }}
            />
          </div>
        </Section>
      )}

      {/* Stroke Section */}
      <Section title="Stroke" onAdd={addStroke}>
        {strokes.length === 0 ? (
          <div className="figma-empty-hint">Click + to add a stroke</div>
        ) : (
          strokes.map((stroke, index) => (
            <StrokeItem
              key={stroke.id}
              stroke={stroke}
              onUpdate={(updates) => {
                const newStrokes = [...strokes];
                newStrokes[index] = { ...stroke, ...updates };
                setStrokes(newStrokes);
                if (index === 0) {
                  const updated = newStrokes[0];
                  updateStyle({
                    stroke: updated.color,
                    strokeWidth: updated.width,
                    strokeDasharray: updated.dashArray || undefined,
                  });
                }
              }}
              onRemove={() => {
                const remaining = strokes.filter(s => s.id !== stroke.id);
                setStrokes(remaining);
                if (remaining.length === 0) {
                  updateStyle({ stroke: undefined, strokeWidth: undefined, strokeDasharray: undefined });
                } else {
                  updateStyle({ stroke: remaining[0].color, strokeWidth: remaining[0].width });
                }
              }}
            />
          ))
        )}
      </Section>

      {/* Effects Section */}
      <Section title="Effects" onAdd={addEffect}>
        {effects.length === 0 ? (
          <div className="figma-empty-hint">Click + to add an effect</div>
        ) : (
          effects.map((effect, index) => (
            <EffectItem
              key={effect.id}
              effect={effect}
              onUpdate={(updates) => {
                const newEffects = [...effects];
                newEffects[index] = { ...effect, ...updates };
                setEffects(newEffects);
                syncEffectsToStyle(newEffects);
              }}
              onRemove={() => {
                const remaining = effects.filter(e => e.id !== effect.id);
                setEffects(remaining);
                syncEffectsToStyle(remaining);
              }}
            />
          ))
        )}
      </Section>

      {/* Prototype Link Section */}
      <PrototypeLinkPanel />

      {/* Interactions Section */}
      <InteractionsSection
        keyframeId={selectedKeyframeId || ''}
        keyframes={keyframes}
      />
    </div>
  );
}

// Interactions Section Component
function InteractionsSection({ keyframeId, keyframes }: { 
  keyframeId: string; 
  keyframes: { id: string; name: string }[];
}) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const { transitions, addTransition, setSelectedTransitionId } = useEditorStore();
  
  const outgoingTransitions = transitions.filter(t => t.from === keyframeId);
  const otherKeyframes = keyframes.filter(kf => kf.id !== keyframeId);

  return (
    <div className="figma-section interactions-section">
      <div className="figma-section-header" style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <InteractionIcon />
          <span className="figma-section-title">Interactions</span>
        </div>
        <button 
          className="figma-icon-btn add-interaction-btn"
          onClick={() => setShowAddMenu(!showAddMenu)}
          title="Add interaction"
        >
          <PlusIcon />
        </button>
      </div>

      {showAddMenu && otherKeyframes.length > 0 && (
        <div className="interaction-add-menu">
          <div className="interaction-add-label">Navigate to:</div>
          {otherKeyframes.map(kf => (
            <button
              key={kf.id}
              className="interaction-add-option"
              onClick={() => {
                addTransition(keyframeId, kf.id);
                setShowAddMenu(false);
              }}
            >
              → {kf.name}
            </button>
          ))}
        </div>
      )}

      {outgoingTransitions.length === 0 ? (
        <div className="figma-empty-hint">
          No interactions. Click + to add.
        </div>
      ) : (
        <div className="interaction-list">
          {outgoingTransitions.map(tr => {
            const toKf = keyframes.find(kf => kf.id === tr.to);
            return (
              <button
                key={tr.id}
                className="interaction-item"
                onClick={() => setSelectedTransitionId(tr.id)}
              >
                <span className="interaction-trigger">{tr.trigger}</span>
                <span className="interaction-arrow">→</span>
                <span className="interaction-target">{toKf?.name || '?'}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
