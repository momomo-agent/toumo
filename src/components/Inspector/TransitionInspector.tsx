import { useState, useEffect } from 'react';
import { useEditorStore } from '../../store';
import type { TriggerConfig, TriggerType, KeyElement, ShapeStyle } from '../../types';
import { SPRING_PRESETS as SPRING_PRESETS_DATA } from '../../data/curvePresets';
import type { EasingPreset, SpringPreset } from '../../data/curvePresets';
import { PresetSelector, DraggableBezierEditor, BallPreview, SpringCurveGraph } from '../CurveEditor';

// SVG icon paths for triggers (16x16 viewBox)
const TRIGGER_ICONS: Record<TriggerType, string> = {
  tap: 'M8 2a1 1 0 011 1v4.5l2.3 1.15a1 1 0 01-.9 1.78L7.5 9V3a1 1 0 011-1z',
  drag: 'M8 1l3 3H9v3h3V5l3 3-3 3V9H9v3h2l-3 3-3-3h2V9H4v2l-3-3 3-3v2h3V4H5l3-3z',
  scroll: 'M8 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zm0 2a1 1 0 011 1v2a1 1 0 01-2 0V4a1 1 0 011-1z',
  hover: 'M8 3a5 5 0 100 10A5 5 0 008 3zm0 2a3 3 0 110 6 3 3 0 010-6zm0 1.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z',
  timer: 'M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a5 5 0 110 10A5 5 0 018 3zm-.5 1v4.5l3 1.5',
  variable: 'M2 4h12M2 8h8M2 12h10',
};

const TRIGGER_OPTIONS: { id: TriggerType; label: string }[] = [
  { id: 'tap', label: 'Tap' },
  { id: 'drag', label: 'Drag' },
  { id: 'scroll', label: 'Scroll' },
  { id: 'hover', label: 'Hover' },
  { id: 'timer', label: 'Timer' },
  { id: 'variable', label: 'Variable' },
];

const DRAG_DIRECTIONS = [
  { id: 'any', label: 'Any' },
  { id: 'horizontal', label: 'Horizontal' },
  { id: 'vertical', label: 'Vertical' },
  { id: 'up', label: 'Up' },
  { id: 'down', label: 'Down' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
];

export function TransitionInspector() {
  const {
    keyframes,
    transitions,
    selectedTransitionId,
    updateTransition,
    deleteTransition,
    previewTransitionId,
    setPreviewTransitionId,
  } = useEditorStore();

  const transition = transitions.find((t) => t.id === selectedTransitionId);

  if (!transition) {
    return (
      <div style={{ color: '#555', fontSize: 12 }}>
        Select a transition to edit
      </div>
    );
  }

  const fromKeyframe = keyframes.find((kf) => kf.id === transition.from);
  const toKeyframe = keyframes.find((kf) => kf.id === transition.to);

  // Get triggers array (convert legacy single trigger if needed)
  const triggers: TriggerConfig[] = transition.triggers || [{ type: transition.trigger as TriggerType }];

  const handleAddTrigger = () => {
    const newTriggers = [...triggers, { type: 'tap' as TriggerType }];
    updateTransition(transition.id, { triggers: newTriggers });
  };

  const handleRemoveTrigger = (index: number) => {
    if (triggers.length <= 1) return;
    const newTriggers = triggers.filter((_, i) => i !== index);
    updateTransition(transition.id, { triggers: newTriggers });
  };

  const handleUpdateTrigger = (index: number, updates: Partial<TriggerConfig>) => {
    const newTriggers = triggers.map((t, i) => 
      i === index ? { ...t, ...updates } : t
    );
    updateTransition(transition.id, { triggers: newTriggers });
  };

  return (
    <div>
      <SectionHeader>Transition</SectionHeader>

      {/* From → To display + Preview button */}
      <div style={flowBoxStyle}>
        <StateChip name={fromKeyframe?.name || 'Unknown'} />
        <ArrowIcon />
        <StateChip name={toKeyframe?.name || 'Unknown'} />
      </div>
      <button
        onClick={() => setPreviewTransitionId(transition.id)}
        disabled={previewTransitionId === transition.id}
        style={{
          ...previewButtonStyle,
          opacity: previewTransitionId === transition.id ? 0.5 : 1,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M4 2.5v11l9-5.5-9-5.5z" fill="currentColor" />
        </svg>
        {previewTransitionId === transition.id ? 'Playing…' : 'Preview Transition'}
      </button>

      {/* Timeline Visualization */}
      {fromKeyframe && toKeyframe && (
        <TransitionTimeline
          fromElements={useEditorStore.getState().sharedElements}
          toElements={useEditorStore.getState().sharedElements}
          duration={transition.duration}
          delay={transition.delay}
          isPlaying={previewTransitionId === transition.id}
        />
      )}

      {/* Triggers Section */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Label>Triggers</Label>
          <button onClick={handleAddTrigger} style={smallButtonStyle}>+ Add</button>
        </div>
        
        {triggers.map((trigger, index) => (
          <TriggerEditor
            key={index}
            trigger={trigger}
            index={index}
            canRemove={triggers.length > 1}
            onUpdate={(updates) => handleUpdateTrigger(index, updates)}
            onRemove={() => handleRemoveTrigger(index)}
          />
        ))}
        
        {triggers.length > 1 && (
          <div style={comboHintStyle}>
            Combo: All triggers must fire to activate
          </div>
        )}
      </div>

      {/* Timing Section */}
      <SectionHeader>Timing</SectionHeader>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <Label>Duration</Label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              value={transition.duration}
              onChange={(e) => updateTransition(transition.id, { duration: Number(e.target.value) })}
              style={inputStyle}
              min={0}
              step={50}
            />
            <span style={unitStyle}>ms</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <Label>Delay</Label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              value={transition.delay}
              onChange={(e) => updateTransition(transition.id, { delay: Number(e.target.value) })}
              style={inputStyle}
              min={0}
              step={50}
            />
            <span style={unitStyle}>ms</span>
          </div>
        </div>
      </div>

      {/* Duration presets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[100, 200, 300, 500, 800].map((ms) => (
          <button
            key={ms}
            onClick={() => updateTransition(transition.id, { duration: ms })}
            style={{
              ...presetButtonStyle,
              background: transition.duration === ms ? '#2563eb' : '#0d0d0e',
              color: transition.duration === ms ? '#fff' : '#888',
            }}
          >
            {ms}
          </button>
        ))}
      </div>

      {/* Easing Section */}
      <SectionHeader>Easing</SectionHeader>

      {/* Preset Selector (easing + spring tabs with ball preview) */}
      <div style={{ marginBottom: 14 }}>
        <PresetSelector
          currentCurve={transition.curve}
          currentBezier={transition.cubicBezier}
          currentSpring={transition.curve === 'spring' ? {
            damping: transition.springDamping ?? 0.8,
            stiffness: transition.springStiffness ?? 200,
            mass: transition.springMass ?? 1,
          } : undefined}
          onSelectEasing={(preset: EasingPreset) => {
            updateTransition(transition.id, {
              curve: preset.id,
              cubicBezier: preset.bezier,
            });
          }}
          onSelectSpring={(preset: SpringPreset) => {
            updateTransition(transition.id, {
              curve: 'spring',
              springDamping: preset.damping,
              springResponse: preset.response,
              springMass: preset.mass,
              springStiffness: preset.stiffness,
            });
          }}
          onSelectCustom={() => {
            updateTransition(transition.id, {
              curve: 'custom',
              cubicBezier: transition.cubicBezier || [0.25, 0.1, 0.25, 1],
            });
          }}
        />
      </div>

      {/* Spring Parameters (expanded when spring selected) */}
      {transition.curve === 'spring' && (
        <SpringEditor transition={transition} onUpdate={updateTransition} />
      )}

      {/* Custom Bezier Editor with draggable control points */}
      {transition.curve === 'custom' && (
        <CustomBezierSection transition={transition} onUpdate={updateTransition} />
      )}

      {/* Delete */}
      <button
        onClick={() => deleteTransition(transition.id)}
        style={deleteButtonStyle}
      >
        Delete Transition
      </button>
    </div>
  );
}

// ─── Diff helper: find changed properties between two keyframe element sets ───
type PropertyChange = {
  elementName: string;
  property: string;
  from: string | number;
  to: string | number;
  color: string;
};

const PROP_COLORS: Record<string, string> = {
  x: '#3b82f6',
  y: '#8b5cf6',
  width: '#f59e0b',
  height: '#ef4444',
  opacity: '#22c55e',
  fill: '#ec4899',
  borderRadius: '#06b6d4',
  rotation: '#a855f7',
  fontSize: '#f97316',
  scale: '#14b8a6',
};

function diffElements(fromEls: KeyElement[], toEls: KeyElement[]): PropertyChange[] {
  const changes: PropertyChange[] = [];
  for (const fromEl of fromEls) {
    const toEl = toEls.find(e => e.id === fromEl.id);
    if (!toEl) continue;
    const name = fromEl.name || fromEl.id;
    // Position
    if (fromEl.position.x !== toEl.position.x)
      changes.push({ elementName: name, property: 'x', from: Math.round(fromEl.position.x), to: Math.round(toEl.position.x), color: PROP_COLORS.x });
    if (fromEl.position.y !== toEl.position.y)
      changes.push({ elementName: name, property: 'y', from: Math.round(fromEl.position.y), to: Math.round(toEl.position.y), color: PROP_COLORS.y });
    // Size
    if (fromEl.size.width !== toEl.size.width)
      changes.push({ elementName: name, property: 'width', from: Math.round(fromEl.size.width), to: Math.round(toEl.size.width), color: PROP_COLORS.width });
    if (fromEl.size.height !== toEl.size.height)
      changes.push({ elementName: name, property: 'height', from: Math.round(fromEl.size.height), to: Math.round(toEl.size.height), color: PROP_COLORS.height });
    // Style props
    const fStyle: Partial<ShapeStyle> = fromEl.style ?? {};
    const tStyle: Partial<ShapeStyle> = toEl.style ?? {};
    if ((fStyle.opacity ?? 1) !== (tStyle.opacity ?? 1))
      changes.push({ elementName: name, property: 'opacity', from: fStyle.opacity ?? 1, to: tStyle.opacity ?? 1, color: PROP_COLORS.opacity });
    if (fStyle.fill !== tStyle.fill)
      changes.push({ elementName: name, property: 'fill', from: fStyle.fill || '—', to: tStyle.fill || '—', color: PROP_COLORS.fill });
    if ((fStyle.borderRadius ?? 0) !== (tStyle.borderRadius ?? 0))
      changes.push({ elementName: name, property: 'borderRadius', from: fStyle.borderRadius ?? 0, to: tStyle.borderRadius ?? 0, color: PROP_COLORS.borderRadius });
    if ((fStyle.rotation ?? 0) !== (tStyle.rotation ?? 0))
      changes.push({ elementName: name, property: 'rotation', from: `${fStyle.rotation ?? 0}°`, to: `${tStyle.rotation ?? 0}°`, color: PROP_COLORS.rotation });
    if ((fStyle.scale ?? 1) !== (tStyle.scale ?? 1))
      changes.push({ elementName: name, property: 'scale', from: fStyle.scale ?? 1, to: tStyle.scale ?? 1, color: PROP_COLORS.scale });
  }
  return changes;
}

// ─── TransitionTimeline Component ─────────────────────────────────────
function TransitionTimeline({
  fromElements, toElements, duration, delay, isPlaying,
}: {
  fromElements: KeyElement[];
  toElements: KeyElement[];
  duration: number;
  delay: number;
  isPlaying: boolean;
}) {
  const changes = diffElements(fromElements, toElements);
  const [progress, setProgress] = useState(0);

  // Animate progress bar when playing
  useEffect(() => {
    if (!isPlaying) { setProgress(0); return; }
    const totalMs = delay + duration;
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const p = Math.min(elapsed / totalMs, 1);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, duration, delay]);

  if (changes.length === 0) {
    return (
      <div style={timelineBoxStyle}>
        <div style={{ fontSize: 10, color: '#555', textAlign: 'center', padding: '8px 0' }}>
          No property changes detected
        </div>
      </div>
    );
  }

  const totalMs = delay + duration;
  const delayPct = totalMs > 0 ? (delay / totalMs) * 100 : 0;
  const durationPct = totalMs > 0 ? (duration / totalMs) * 100 : 100;

  return (
    <div style={timelineBoxStyle}>
      <div style={{ fontSize: 10, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Timeline · {changes.length} change{changes.length > 1 ? 's' : ''}
      </div>

      {/* Time ruler */}
      <div style={timeRulerStyle}>
        <span>0ms</span>
        {delay > 0 && <span style={{ position: 'absolute', left: `${delayPct}%`, transform: 'translateX(-50%)' }}>{delay}ms</span>}
        <span style={{ marginLeft: 'auto' }}>{totalMs}ms</span>
      </div>

      {/* Playhead */}
      {isPlaying && (
        <div style={{
          position: 'absolute', top: 28, bottom: 4,
          left: `${progress * 100}%`, width: 1,
          background: '#fff', zIndex: 10, opacity: 0.6,
          transition: 'left 16ms linear',
        }} />
      )}

      {/* Property rows */}
      {changes.map((ch, i) => (
        <div key={`${ch.elementName}-${ch.property}-${i}`} style={timelineRowStyle}>
          <div style={timelineLabelStyle}>
            <span style={{ color: '#aaa', fontSize: 10, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ch.elementName}
            </span>
            <span style={{ color: ch.color, fontSize: 10, fontWeight: 600 }}>.{ch.property}</span>
          </div>
          <div style={timelineTrackStyle}>
            {/* Delay gap */}
            {delay > 0 && (
              <div style={{ width: `${delayPct}%`, height: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '3px 0 0 3px' }} />
            )}
            {/* Active bar */}
            <div style={{
              width: `${durationPct}%`, height: '100%',
              background: `${ch.color}30`, border: `1px solid ${ch.color}60`,
              borderRadius: delay > 0 ? '0 3px 3px 0' : 3,
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Fill animation */}
              <div style={{
                position: 'absolute', inset: 0,
                background: `${ch.color}50`,
                transformOrigin: 'left',
                transform: isPlaying
                  ? `scaleX(${Math.max(0, (progress * totalMs - delay) / duration)})`
                  : 'scaleX(0)',
                transition: isPlaying ? 'transform 16ms linear' : 'none',
              }} />
            </div>
          </div>
          <div style={timelineValueStyle}>
            <span style={{ color: '#666' }}>{String(ch.from)}</span>
            <span style={{ color: '#444' }}>→</span>
            <span style={{ color: ch.color }}>{String(ch.to)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Trigger Editor Component
interface TriggerEditorProps {
  trigger: TriggerConfig;
  index: number;
  canRemove: boolean;
  onUpdate: (updates: Partial<TriggerConfig>) => void;
  onRemove: () => void;
}

function TriggerEditor({ trigger, index, canRemove, onUpdate, onRemove }: TriggerEditorProps) {
  return (
    <div style={triggerBoxStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: '#666' }}>Trigger {index + 1}</span>
        {canRemove && (
          <button onClick={onRemove} style={removeButtonStyle}>×</button>
        )}
      </div>
      
      {/* Trigger Type Selection */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {TRIGGER_OPTIONS.map((opt) => {
          const isActive = trigger.type === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onUpdate({ type: opt.id })}
              style={{
                ...triggerTypeButtonStyle,
                background: isActive ? '#1e3a5f' : '#161617',
                borderColor: isActive ? '#2563eb' : '#2a2a2a',
                color: isActive ? '#60a5fa' : '#888',
              }}
            >
              <TriggerIcon type={opt.id} active={isActive} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Type-specific options */}
      {trigger.type === 'drag' && (
        <DragOptions trigger={trigger} onUpdate={onUpdate} />
      )}
      {trigger.type === 'scroll' && (
        <ScrollOptions trigger={trigger} onUpdate={onUpdate} />
      )}
      {trigger.type === 'timer' && (
        <TimerOptions trigger={trigger} onUpdate={onUpdate} />
      )}
      {trigger.type === 'variable' && (
        <VariableOptions trigger={trigger} onUpdate={onUpdate} />
      )}
    </div>
  );
}

// Drag Options
function DragOptions({ trigger, onUpdate }: { trigger: TriggerConfig; onUpdate: (u: Partial<TriggerConfig>) => void }) {
  return (
    <div style={{ marginTop: 8 }}>
      <Label>Direction</Label>
      <select
        value={trigger.direction || 'any'}
        onChange={(e) => onUpdate({ direction: e.target.value as TriggerConfig['direction'] })}
        style={selectStyle}
      >
        {DRAG_DIRECTIONS.map((d) => (
          <option key={d.id} value={d.id}>{d.label}</option>
        ))}
      </select>
      <div style={{ marginTop: 8 }}>
        <Label>Threshold (px)</Label>
        <input
          type="number"
          value={trigger.threshold || 50}
          onChange={(e) => onUpdate({ threshold: Number(e.target.value) })}
          style={inputStyle}
          min={0}
        />
      </div>
    </div>
  );
}

// Scroll Options
function ScrollOptions({ trigger, onUpdate }: { trigger: TriggerConfig; onUpdate: (u: Partial<TriggerConfig>) => void }) {
  return (
    <div style={{ marginTop: 8 }}>
      <Label>Scroll Direction</Label>
      <select
        value={trigger.scrollDirection || 'down'}
        onChange={(e) => onUpdate({ scrollDirection: e.target.value as 'up' | 'down' })}
        style={selectStyle}
      >
        <option value="down">Down</option>
        <option value="up">Up</option>
      </select>
      <div style={{ marginTop: 8 }}>
        <Label>Offset (px)</Label>
        <input
          type="number"
          value={trigger.scrollOffset || 100}
          onChange={(e) => onUpdate({ scrollOffset: Number(e.target.value) })}
          style={inputStyle}
          min={0}
        />
      </div>
    </div>
  );
}

// Timer Options
function TimerOptions({ trigger, onUpdate }: { trigger: TriggerConfig; onUpdate: (u: Partial<TriggerConfig>) => void }) {
  return (
    <div style={{ marginTop: 8 }}>
      <Label>Auto-trigger after (ms)</Label>
      <input
        type="number"
        value={trigger.timerDelay || 1000}
        onChange={(e) => onUpdate({ timerDelay: Number(e.target.value) })}
        style={inputStyle}
        min={0}
        step={100}
      />
    </div>
  );
}

// Variable Options
function VariableOptions({ trigger, onUpdate }: { trigger: TriggerConfig; onUpdate: (u: Partial<TriggerConfig>) => void }) {
  return (
    <div style={{ marginTop: 8 }}>
      <Label>Variable Name</Label>
      <input
        type="text"
        value={trigger.variableName || ''}
        onChange={(e) => onUpdate({ variableName: e.target.value })}
        style={inputStyle}
        placeholder="e.g., isLoading"
      />
      <div style={{ marginTop: 8 }}>
        <Label>Condition</Label>
        <select
          value={trigger.variableCondition || 'equals'}
          onChange={(e) => onUpdate({ variableCondition: e.target.value as TriggerConfig['variableCondition'] })}
          style={selectStyle}
        >
          <option value="equals">Equals</option>
          <option value="greater">Greater than</option>
          <option value="less">Less than</option>
          <option value="changed">Changed</option>
        </select>
      </div>
      {trigger.variableCondition !== 'changed' && (
        <div style={{ marginTop: 8 }}>
          <Label>Value</Label>
          <input
            type="text"
            value={trigger.variableValue ?? ''}
            onChange={(e) => onUpdate({ variableValue: e.target.value })}
            style={inputStyle}
            placeholder="true, false, or number"
          />
        </div>
      )}
    </div>
  );
}

// Spring Editor Component (uses centralized presets + real physics visualization)
function SpringEditor({ transition, onUpdate }: { transition: { id: string; springDamping?: number; springResponse?: number; springMass?: number; springStiffness?: number }; onUpdate: (id: string, updates: Record<string, unknown>) => void }) {
  const [previewMode, setPreviewMode] = useState<'horizontal' | 'bounce'>('bounce');

  const sDamping = transition.springDamping ?? 0.8;
  const sStiffness = transition.springStiffness ?? 200;
  const sMass = transition.springMass ?? 1;

  const currentPreset = SPRING_PRESETS_DATA.find(p =>
    p.damping === sDamping &&
    p.response === (transition.springResponse ?? 0.5) &&
    p.mass === sMass &&
    p.stiffness === sStiffness
  );

  const applyPreset = (preset: typeof SPRING_PRESETS_DATA[0]) => {
    onUpdate(transition.id, {
      springDamping: preset.damping,
      springResponse: preset.response,
      springMass: preset.mass,
      springStiffness: preset.stiffness,
    });
  };

  // Compute damping ratio for display
  const dampingRatio = sDamping / (2 * Math.sqrt(sStiffness * sMass));
  const dampingLabel = dampingRatio < 0.4 ? 'Underdamped (bouncy)'
    : dampingRatio < 1 ? 'Underdamped'
    : dampingRatio === 1 ? 'Critically damped'
    : 'Overdamped';

  return (
    <div style={springBoxStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Spring Physics
        </div>
        {/* Preview mode toggle */}
        <div style={{ display: 'flex', gap: 2 }}>
          <button
            onClick={() => setPreviewMode('horizontal')}
            style={{
              ...miniToggleStyle,
              background: previewMode === 'horizontal' ? '#1e3a5f' : 'transparent',
              color: previewMode === 'horizontal' ? '#60a5fa' : '#555',
            }}
            title="Horizontal slide"
          >→</button>
          <button
            onClick={() => setPreviewMode('bounce')}
            style={{
              ...miniToggleStyle,
              background: previewMode === 'bounce' ? '#1e3a5f' : 'transparent',
              color: previewMode === 'bounce' ? '#60a5fa' : '#555',
            }}
            title="Bounce drop"
          >↓</button>
        </div>
      </div>

      {/* Spring Presets */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
        {SPRING_PRESETS_DATA.map((preset) => (
          <button
            key={preset.id}
            onClick={() => applyPreset(preset)}
            style={{
              padding: '4px 10px',
              background: currentPreset?.id === preset.id ? '#2563eb' : '#161617',
              border: '1px solid',
              borderColor: currentPreset?.id === preset.id ? '#2563eb' : '#333',
              borderRadius: 4,
              color: currentPreset?.id === preset.id ? '#fff' : '#888',
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Spring Curve Graph (SVG visualization) */}
      <div style={{ marginBottom: 8 }}>
        <SpringCurveGraph
          mass={sMass}
          stiffness={sStiffness}
          damping={sDamping}
          width={220}
          height={90}
        />
      </div>

      {/* Ball Preview Animation (horizontal or bounce) */}
      <BallPreview
        spring={{ damping: sDamping, stiffness: sStiffness, mass: sMass }}
        duration={1200}
        width={220}
        height={previewMode === 'bounce' ? 80 : 36}
        mode={previewMode}
      />

      {/* Damping ratio indicator */}
      <div style={{
        marginTop: 8, padding: '4px 8px',
        background: '#161617', borderRadius: 4,
        border: '1px solid #2a2a2a',
        fontSize: 9, color: '#666', textAlign: 'center',
        fontFamily: 'monospace',
      }}>
        ζ = {dampingRatio.toFixed(2)} · {dampingLabel}
      </div>

      {/* Parameter Sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
        <SpringSlider
          label="Mass"
          icon="⚖️"
          min={0.1} max={5} step={0.1}
          value={sMass}
          onChange={(v) => onUpdate(transition.id, { springMass: v })}
          color="#f59e0b"
        />
        <SpringSlider
          label="Stiffness"
          icon="🔩"
          min={10} max={500} step={5}
          value={sStiffness}
          onChange={(v) => onUpdate(transition.id, { springStiffness: v })}
          color="#3b82f6"
        />
        <SpringSlider
          label="Damping"
          icon="🛑"
          min={0.1} max={40} step={0.1}
          value={sDamping}
          onChange={(v) => onUpdate(transition.id, { springDamping: v })}
          color="#ef4444"
        />
        <SpringSlider
          label="Response"
          icon="⚡"
          min={0.1} max={2} step={0.1}
          value={transition.springResponse ?? 0.5}
          onChange={(v) => onUpdate(transition.id, { springResponse: v })}
          color="#22c55e"
        />
      </div>
    </div>
  );
}

// Spring slider with value display, color accent, and icon
function SpringSlider({ label, icon, min, max, step, value, onChange, color }: {
  label: string; icon?: string; min: number; max: number; step: number; value: number;
  onChange: (v: number) => void; color?: string;
}) {
  const accentColor = color || '#60a5fa';
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Label>{icon ? `${icon} ` : ''}{label}</Label>
        <span style={{ fontSize: 10, color: accentColor, fontFamily: 'monospace' }}>{value}</span>
      </div>
      <div style={{ position: 'relative', height: 4 }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: '#2a2a2a', borderRadius: 2,
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, height: 4,
          width: `${pct}%`,
          background: accentColor, borderRadius: 2, opacity: 0.5,
        }} />
        <input
          type="range"
          min={min} max={max} step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ ...rangeStyle, position: 'relative', zIndex: 1 }}
        />
      </div>
    </div>
  );
}

// (SpringPreview replaced by BallPreview from CurveEditor)

// Custom Bezier Section with draggable editor + ball preview
function CustomBezierSection({ transition, onUpdate }: { transition: { id: string; cubicBezier?: [number, number, number, number] }; onUpdate: (id: string, updates: Record<string, unknown>) => void }) {
  const bezier = (transition.cubicBezier || [0.25, 0.1, 0.25, 1]) as [number, number, number, number];

  const setBezier = (newBezier: [number, number, number, number]) => {
    onUpdate(transition.id, { cubicBezier: newBezier });
  };

  return (
    <div style={springBoxStyle}>
      <div style={{ fontSize: 10, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Custom Bezier
      </div>

      {/* Ball preview */}
      <div style={{ marginBottom: 10 }}>
        <BallPreview bezier={bezier} width={220} height={32} />
      </div>

      {/* Draggable curve editor */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <DraggableBezierEditor value={bezier} onChange={setBezier} size={140} padding={14} />
      </div>

      {/* Number inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
        {(['x1', 'y1', 'x2', 'y2'] as const).map((label, i) => (
          <div key={label}>
            <Label>{label.toUpperCase()}</Label>
            <input
              type="number"
              min={i % 2 === 0 ? 0 : -0.5}
              max={i % 2 === 0 ? 1 : 1.5}
              step="0.05"
              value={bezier[i]}
              onChange={(e) => {
                const nb = [...bezier] as [number, number, number, number];
                nb[i] = Number(e.target.value);
                setBezier(nb);
              }}
              style={{ ...inputStyle, padding: '6px 4px', textAlign: 'center' as const, fontSize: 11 }}
            />
          </div>
        ))}
      </div>

      {/* CSS output */}
      <div style={{
        marginTop: 10, padding: '6px 10px',
        background: '#161617', borderRadius: 4,
        border: '1px solid #2a2a2a', textAlign: 'center',
        fontSize: 10, color: '#666', fontFamily: 'monospace',
      }}>
        cubic-bezier({bezier.map(v => v.toFixed(2)).join(', ')})
      </div>
    </div>
  );
}

// Helper Components
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 600,
      color: '#888',
      textTransform: 'uppercase',
      marginBottom: 12,
      paddingBottom: 8,
      borderBottom: '1px solid #2a2a2a',
    }}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>
      {children}
    </label>
  );
}

function StateChip({ name }: { name: string }) {
  return (
    <span style={{
      padding: '5px 10px',
      background: '#1a1a2e',
      border: '1px solid #2563eb40',
      borderRadius: 6,
      fontSize: 11,
      color: '#e5e5e5',
      fontWeight: 500,
    }}>
      {name}
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M10 5l3 3-3 3" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TriggerIcon({ type, active }: { type: TriggerType; active: boolean }) {
  const path = TRIGGER_ICONS[type];
  const isStroke = type === 'variable' || type === 'timer';
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path
        d={path}
        fill={isStroke ? 'none' : (active ? '#60a5fa' : '#888')}
        stroke={isStroke ? (active ? '#60a5fa' : '#888') : 'none'}
        strokeWidth={isStroke ? '2' : '0'}
        strokeLinecap="round"
      />
    </svg>
  );
}

// (CurveButton removed - replaced by PresetSelector)

// Styles
const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: '#0d0d0e',
  border: '1px solid #2a2a2a',
  borderRadius: 6,
  color: '#e5e5e5',
  fontSize: 12,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: '#0d0d0e',
  border: '1px solid #2a2a2a',
  borderRadius: 6,
  color: '#e5e5e5',
  fontSize: 12,
};

const flowBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: 12,
  background: '#0d0d0e',
  borderRadius: 8,
  marginBottom: 16,
};

const deleteButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 0',
  background: 'transparent',
  border: '1px solid #3a2020',
  borderRadius: 6,
  color: '#f87171',
  fontSize: 11,
  cursor: 'pointer',
  marginTop: 20,
  transition: 'all 0.15s ease',
};

const smallButtonStyle: React.CSSProperties = {
  padding: '2px 8px',
  background: '#2563eb',
  border: 'none',
  borderRadius: 4,
  color: '#fff',
  fontSize: 10,
  cursor: 'pointer',
};

const triggerBoxStyle: React.CSSProperties = {
  padding: 10,
  background: '#0d0d0e',
  border: '1px solid #2a2a2a',
  borderRadius: 8,
  marginBottom: 8,
};

const triggerTypeButtonStyle: React.CSSProperties = {
  padding: '5px 8px',
  border: '1px solid #2a2a2a',
  borderRadius: 6,
  color: '#fff',
  fontSize: 10,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  transition: 'all 0.15s ease',
};

const removeButtonStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  padding: 0,
  background: '#dc262620',
  border: '1px solid #dc2626',
  borderRadius: 4,
  color: '#dc2626',
  fontSize: 12,
  cursor: 'pointer',
  lineHeight: 1,
};

const presetButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '5px 0',
  border: '1px solid #2a2a2a',
  borderRadius: 6,
  fontSize: 10,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  fontFamily: 'monospace',
};

const comboHintStyle: React.CSSProperties = {
  padding: '6px 10px',
  background: '#2563eb15',
  border: '1px solid #2563eb40',
  borderRadius: 6,
  fontSize: 10,
  color: '#60a5fa',
  textAlign: 'center',
};

const springBoxStyle: React.CSSProperties = {
  padding: 12,
  background: '#0d0d0e',
  border: '1px solid #2a2a2a',
  borderRadius: 8,
  marginBottom: 16,
};

const rangeStyle: React.CSSProperties = {
  width: '100%',
  height: 4,
  appearance: 'none',
  WebkitAppearance: 'none',
  background: 'transparent',
  borderRadius: 2,
  outline: 'none',
  cursor: 'pointer',
};

const miniToggleStyle: React.CSSProperties = {
  width: 22,
  height: 18,
  padding: 0,
  border: '1px solid #333',
  borderRadius: 4,
  fontSize: 10,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const unitStyle: React.CSSProperties = {
  position: 'absolute',
  right: 10,
  top: '50%',
  transform: 'translateY(-50%)',
  fontSize: 10,
  color: '#666',
  pointerEvents: 'none',
};

const previewButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 0',
  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
  border: 'none',
  borderRadius: 6,
  color: '#fff',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  marginBottom: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  transition: 'opacity 0.15s ease',
};

const timelineBoxStyle: React.CSSProperties = {
  padding: 10,
  background: '#0d0d0e',
  border: '1px solid #2a2a2a',
  borderRadius: 8,
  marginBottom: 16,
  position: 'relative',
  overflow: 'hidden',
};

const timeRulerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 9,
  color: '#555',
  fontFamily: 'monospace',
  marginBottom: 6,
  position: 'relative',
};

const timelineRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 4,
};

const timelineLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  minWidth: 80,
  maxWidth: 80,
  overflow: 'hidden',
};

const timelineTrackStyle: React.CSSProperties = {
  flex: 1,
  height: 14,
  background: 'rgba(255,255,255,0.02)',
  borderRadius: 3,
  display: 'flex',
  overflow: 'hidden',
};

const timelineValueStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  fontSize: 9,
  fontFamily: 'monospace',
  minWidth: 70,
  justifyContent: 'flex-end',
};
