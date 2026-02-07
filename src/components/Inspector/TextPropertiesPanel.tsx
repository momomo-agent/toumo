import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditorStore } from '../../store';
import { useResolvedElements } from '../../hooks/useResolvedElements';
import type { KeyElement, ShapeStyle } from '../../types';
import { DEFAULT_STYLE } from '../../types';

// System font list (common cross-platform fonts)
const FONT_FAMILIES = [
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'system-ui, sans-serif', label: 'System UI' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica Neue, Helvetica, sans-serif', label: 'Helvetica Neue' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Tahoma, sans-serif', label: 'Tahoma' },
  { value: 'Trebuchet MS, sans-serif', label: 'Trebuchet MS' },
  { value: 'Segoe UI, sans-serif', label: 'Segoe UI' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'SF Pro Display, sans-serif', label: 'SF Pro Display' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Palatino, serif', label: 'Palatino' },
  { value: 'Garamond, serif', label: 'Garamond' },
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Monaco, monospace', label: 'Monaco' },
  { value: 'Menlo, monospace', label: 'Menlo' },
  { value: 'Consolas, monospace', label: 'Consolas' },
  { value: 'PingFang SC, sans-serif', label: 'PingFang SC' },
  { value: 'Microsoft YaHei, sans-serif', label: '微软雅黑' },
  { value: 'Noto Sans SC, sans-serif', label: 'Noto Sans SC' },
];

// Preset font sizes
const FONT_SIZE_PRESETS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96, 128];

export function TextPropertiesPanel() {
  const {
    selectedElementId,
    updateElement,
  } = useEditorStore();

  const resolvedElements = useResolvedElements();
  const selectedElement = resolvedElements.find(
    (el: KeyElement) => el.id === selectedElementId
  );

  // Only show for text elements
  if (!selectedElement || selectedElement.shapeType !== 'text') {
    return null;
  }

  const style: ShapeStyle = { ...DEFAULT_STYLE, ...selectedElement.style };

  // Helper: merge partial style updates into the full style object
  const updateStyle = (patch: Partial<ShapeStyle>) => {
    updateElement(selectedElement.id, {
      style: { ...style, ...patch },
    });
  };

  return (
    <div className="text-props-panel">
      <div className="text-props-header">
        <TextIcon />
        <span className="figma-section-title">Text</span>
      </div>

      {/* Row 1: Font Family */}
      <FontFamilySelector
        value={style.fontFamily || 'Inter, sans-serif'}
        onChange={(v) => updateStyle({ fontFamily: v })}
      />

      {/* Row 2: Font Size + Font Weight */}
      <div className="text-props-row">
        <FontSizeInput
          value={style.fontSize || 14}
          onChange={(v) => updateStyle({ fontSize: v })}
        />
        <FontWeightSelector
          value={style.fontWeight || 'normal'}
          onChange={(v) => updateStyle({ fontWeight: v })}
        />
      </div>

      {/* Row 3: Bold / Italic / Underline / Strikethrough */}
      <div className="text-props-row text-format-row">
        <FormatButton
          icon="B"
          title="Bold"
          active={style.fontWeight === 'bold' || style.fontWeight === '700'}
          style={{ fontWeight: 'bold' }}
          onClick={() => {
            const isBold = style.fontWeight === 'bold' || style.fontWeight === '700';
            updateStyle({ fontWeight: isBold ? 'normal' : 'bold' });
          }}
        />
        <FormatButton
          icon="I"
          title="Italic"
          active={style.fontStyle === 'italic'}
          style={{ fontStyle: 'italic' }}
          onClick={() => {
            updateStyle({ fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' });
          }}
        />
        <FormatButton
          icon="U"
          title="Underline"
          active={style.textDecoration === 'underline'}
          style={{ textDecoration: 'underline' }}
          onClick={() => {
            updateStyle({ textDecoration: style.textDecoration === 'underline' ? 'none' : 'underline' });
          }}
        />
        <FormatButton
          icon="S"
          title="Strikethrough"
          active={style.textDecoration === 'line-through'}
          style={{ textDecoration: 'line-through' }}
          onClick={() => {
            updateStyle({ textDecoration: style.textDecoration === 'line-through' ? 'none' : 'line-through' });
          }}
        />
      </div>

      {/* Row 4: Text Alignment */}
      <div className="text-props-row text-align-row">
        <AlignButton
          icon={<AlignLeftIcon />}
          title="Align Left"
          active={!style.textAlign || style.textAlign === 'left'}
          onClick={() => updateStyle({ textAlign: 'left' })}
        />
        <AlignButton
          icon={<AlignCenterIcon />}
          title="Align Center"
          active={style.textAlign === 'center'}
          onClick={() => updateStyle({ textAlign: 'center' })}
        />
        <AlignButton
          icon={<AlignRightIcon />}
          title="Align Right"
          active={style.textAlign === 'right'}
          onClick={() => updateStyle({ textAlign: 'right' })}
        />
      </div>

      {/* Row 5: Line Height + Letter Spacing */}
      <div className="text-props-row">
        <DragNumberInput
          label={<LineHeightIcon />}
          title="Line Height"
          value={style.lineHeight || 1.4}
          onChange={(v) => updateStyle({ lineHeight: v })}
          min={0.5}
          max={5}
          step={0.1}
        />
        <DragNumberInput
          label={<LetterSpacingIcon />}
          title="Letter Spacing"
          value={style.letterSpacing || 0}
          onChange={(v) => updateStyle({ letterSpacing: v })}
          min={-10}
          max={50}
          step={0.5}
        />
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

/** Font family dropdown with preview */
function FontFamilySelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const currentLabel = FONT_FAMILIES.find(f => f.value === value)?.label || value.split(',')[0];
  const filtered = FONT_FAMILIES.filter(f =>
    f.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="text-font-selector" ref={ref}>
      <button
        className="text-font-selector-btn"
        onClick={() => setOpen(!open)}
        style={{ fontFamily: value }}
      >
        <span className="text-font-selector-label">{currentLabel}</span>
        <ChevronDownIcon />
      </button>
      {open && (
        <div className="text-font-dropdown">
          <input
            className="text-font-search"
            placeholder="Search fonts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="text-font-list">
            {filtered.map(f => (
              <button
                key={f.value}
                className={`text-font-option ${f.value === value ? 'active' : ''}`}
                style={{ fontFamily: f.value }}
                onClick={() => { onChange(f.value); setOpen(false); setSearch(''); }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Font size input with dropdown presets */
function FontSizeInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [showPresets, setShowPresets] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setEditValue(String(value)); }, [value]);

  useEffect(() => {
    if (!showPresets) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowPresets(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPresets]);

  const commit = () => {
    const v = parseFloat(editValue);
    if (!isNaN(v) && v > 0) onChange(Math.round(v));
  };

  return (
    <div className="text-fontsize-input" ref={ref}>
      <FontSizeIcon />
      <input
        className="text-fontsize-field"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'ArrowUp') { e.preventDefault(); onChange(value + 1); }
          if (e.key === 'ArrowDown') { e.preventDefault(); onChange(Math.max(1, value - 1)); }
        }}
      />
      <button className="text-fontsize-dropdown-btn" onClick={() => setShowPresets(!showPresets)}>
        <ChevronDownIcon />
      </button>
      {showPresets && (
        <div className="text-fontsize-presets">
          {FONT_SIZE_PRESETS.map(s => (
            <button
              key={s}
              className={`text-fontsize-preset ${s === value ? 'active' : ''}`}
              onClick={() => { onChange(s); setShowPresets(false); }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Font weight selector */
function FontWeightSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      className="text-weight-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="100">Thin</option>
      <option value="200">Extra Light</option>
      <option value="300">Light</option>
      <option value="normal">Regular</option>
      <option value="500">Medium</option>
      <option value="600">Semi Bold</option>
      <option value="bold">Bold</option>
      <option value="800">Extra Bold</option>
      <option value="900">Black</option>
    </select>
  );
}

/** Format toggle button (B/I/U/S) */
function FormatButton({ icon, title, active, style, onClick }: {
  icon: string;
  title: string;
  active: boolean;
  style?: React.CSSProperties;
  onClick: () => void;
}) {
  return (
    <button
      className={`text-format-btn ${active ? 'active' : ''}`}
      title={title}
      onClick={onClick}
    >
      <span style={style}>{icon}</span>
    </button>
  );
}

/** Alignment button */
function AlignButton({ icon, title, active, onClick }: {
  icon: React.ReactNode;
  title: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`text-align-btn ${active ? 'active' : ''}`}
      title={title}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

/** Drag-to-adjust number input with icon label */
function DragNumberInput({ label, title, value, onChange, min, max, step = 1 }: {
  label: React.ReactNode;
  title: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const [editValue, setEditValue] = useState(String(Math.round(value * 100) / 100));
  const dragRef = useRef({ startX: 0, startValue: 0, dragging: false });

  useEffect(() => {
    setEditValue(String(Math.round(value * 100) / 100));
  }, [value]);

  const clamp = useCallback((v: number) => {
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return Math.round(v * 100) / 100;
  }, [min, max]);

  const handleLabelMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startValue: value, dragging: false };

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragRef.current.startX;
      if (Math.abs(dx) > 2) dragRef.current.dragging = true;
      if (!dragRef.current.dragging) return;
      const mult = ev.shiftKey ? 10 : ev.altKey ? 0.1 : 1;
      onChange(clamp(dragRef.current.startValue + dx * step * mult * 0.1));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
    };
    document.body.style.cursor = 'ew-resize';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [value, onChange, step, clamp]);

  const commit = () => {
    const v = parseFloat(editValue);
    if (!isNaN(v)) onChange(clamp(v));
  };

  return (
    <div className="text-drag-input" title={title}>
      <span className="text-drag-label" onMouseDown={handleLabelMouseDown}>
        {label}
      </span>
      <input
        className="text-drag-field"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'ArrowUp') { e.preventDefault(); onChange(clamp(value + step)); }
          if (e.key === 'ArrowDown') { e.preventDefault(); onChange(clamp(value - step)); }
        }}
      />
    </div>
  );
}

// ─── SVG Icons ───────────────────────────────────────────

function TextIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 3H11V5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M7 3V11" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 11H9" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function FontSizeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 10L6 2L10 10" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M3.5 7H8.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2.5 3.5L5 6.5L7.5 3.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function AlignLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 3H12" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 6H9" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 9H11" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 12H7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 3H12" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 6H10.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 9H11.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.5 12H9.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 3H12" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 6H12" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 9H12" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 12H12" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function LineHeightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M4 2H10" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 6H10" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 10H10" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 3L2 9" stroke="currentColor" strokeWidth="1" />
      <path d="M1 4L2 2.5L3 4" stroke="currentColor" strokeWidth="0.8" fill="none" />
      <path d="M1 8L2 9.5L3 8" stroke="currentColor" strokeWidth="0.8" fill="none" />
    </svg>
  );
}

function LetterSpacingIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 3L6 9" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 3L6 9" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 7H8" stroke="currentColor" strokeWidth="1" />
      <path d="M1 11H11" stroke="currentColor" strokeWidth="0.8" />
      <path d="M2 10L0.5 11L2 12" stroke="currentColor" strokeWidth="0.8" fill="none" />
      <path d="M10 10L11.5 11L10 12" stroke="currentColor" strokeWidth="0.8" fill="none" />
    </svg>
  );
}
