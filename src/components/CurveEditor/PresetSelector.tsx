import { useState } from 'react';
import { EASING_PRESETS, EASING_CATEGORIES, SPRING_PRESETS } from '../../data/curvePresets';
import type { EasingPreset, SpringPreset } from '../../data/curvePresets';
import { BallPreview } from './BallPreview';

type Tab = 'easing' | 'spring';

interface Props {
  currentCurve: string;
  currentBezier?: [number, number, number, number];
  currentSpring?: { damping: number; stiffness: number; mass: number };
  onSelectEasing: (preset: EasingPreset) => void;
  onSelectSpring: (preset: SpringPreset) => void;
  onSelectCustom: () => void;
}

export function PresetSelector({
  currentCurve,
  currentBezier,
  currentSpring,
  onSelectEasing,
  onSelectSpring,
  onSelectCustom,
}: Props) {
  const [tab, setTab] = useState<Tab>('easing');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={containerStyle}>
      {/* Tab bar */}
      <div style={tabBarStyle}>
        <TabButton active={tab === 'easing'} onClick={() => setTab('easing')}>
          Easing
        </TabButton>
        <TabButton active={tab === 'spring'} onClick={() => setTab('spring')}>
          Spring
        </TabButton>
        <div style={{ flex: 1 }} />
        <button onClick={onSelectCustom} style={customBtnStyle}>
          Custom
        </button>
      </div>

      {/* Content */}
      {tab === 'easing' ? (
        <EasingTab
          currentCurve={currentCurve}
          currentBezier={currentBezier}
          hoveredId={hoveredId}
          onHover={setHoveredId}
          onSelect={onSelectEasing}
        />
      ) : (
        <SpringTab
          currentCurve={currentCurve}
          currentSpring={currentSpring}
          hoveredId={hoveredId}
          onHover={setHoveredId}
          onSelect={onSelectSpring}
        />
      )}
    </div>
  );
}

// ── Easing Tab ────────────────────────────────────────

function EasingTab({
  currentCurve,
  currentBezier,
  hoveredId,
  onHover,
  onSelect,
}: {
  currentCurve: string;
  currentBezier?: [number, number, number, number];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (p: EasingPreset) => void;
}) {
  const categories = Object.keys(EASING_CATEGORIES) as EasingPreset['category'][];

  // Find which preset is hovered for preview
  const hoveredPreset = hoveredId
    ? EASING_PRESETS.find(p => p.id === hoveredId)
    : null;

  // Show preview for hovered or current
  const previewBezier = hoveredPreset?.bezier ?? currentBezier ?? [0.25, 0.1, 0.25, 1] as [number, number, number, number];

  return (
    <div>
      {/* Ball preview */}
      <div style={{ padding: '8px 10px 4px' }}>
        <BallPreview bezier={previewBezier} width={220} height={32} />
      </div>

      {/* Categories */}
      <div style={scrollAreaStyle}>
        {categories.map(cat => {
          const presets = EASING_PRESETS.filter(p => p.category === cat);
          return (
            <div key={cat} style={{ marginBottom: 8 }}>
              <div style={catLabelStyle}>{EASING_CATEGORIES[cat]}</div>
              <div style={presetGridStyle}>
                {presets.map(preset => {
                  const isActive = currentCurve === preset.id ||
                    (currentBezier && arrEq(currentBezier, preset.bezier));
                  return (
                    <PresetChip
                      key={preset.id}
                      label={preset.label}
                      active={!!isActive}
                      onMouseEnter={() => onHover(preset.id)}
                      onMouseLeave={() => onHover(null)}
                      onClick={() => onSelect(preset)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Spring Tab ────────────────────────────────────────

function SpringTab({
  currentCurve,
  currentSpring,
  hoveredId,
  onHover,
  onSelect,
}: {
  currentCurve: string;
  currentSpring?: { damping: number; stiffness: number; mass: number };
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (p: SpringPreset) => void;
}) {
  const hoveredPreset = hoveredId
    ? SPRING_PRESETS.find(p => p.id === hoveredId)
    : null;

  const previewSpring = hoveredPreset
    ? { damping: hoveredPreset.damping, stiffness: hoveredPreset.stiffness, mass: hoveredPreset.mass }
    : currentSpring ?? { damping: 0.8, stiffness: 200, mass: 1 };

  return (
    <div>
      {/* Ball preview */}
      <div style={{ padding: '8px 10px 4px' }}>
        <BallPreview spring={previewSpring} duration={1200} width={220} height={32} />
      </div>

      <div style={scrollAreaStyle}>
        <div style={presetGridStyle}>
          {SPRING_PRESETS.map(preset => {
            const isActive = currentCurve === 'spring' && currentSpring &&
              currentSpring.damping === preset.damping &&
              currentSpring.stiffness === preset.stiffness &&
              currentSpring.mass === preset.mass;
            return (
              <SpringChip
                key={preset.id}
                preset={preset}
                active={!!isActive}
                onMouseEnter={() => onHover(preset.id)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onSelect(preset)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Helper Components ─────────────────────────────────

function TabButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px',
        background: active ? '#1e3a5f' : 'transparent',
        border: '1px solid',
        borderColor: active ? '#2563eb' : 'transparent',
        borderRadius: 5,
        color: active ? '#60a5fa' : '#777',
        fontSize: 11,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </button>
  );
}

function PresetChip({ label, active, onMouseEnter, onMouseLeave, onClick }: {
  label: string; active: boolean;
  onMouseEnter: () => void; onMouseLeave: () => void; onClick: () => void;
}) {
  return (
    <button
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{
        padding: '4px 10px',
        background: active ? '#2563eb' : '#161617',
        border: '1px solid',
        borderColor: active ? '#2563eb' : '#2a2a2a',
        borderRadius: 5,
        color: active ? '#fff' : '#999',
        fontSize: 10,
        cursor: 'pointer',
        transition: 'all 0.12s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

function SpringChip({ preset, active, onMouseEnter, onMouseLeave, onClick }: {
  preset: SpringPreset; active: boolean;
  onMouseEnter: () => void; onMouseLeave: () => void; onClick: () => void;
}) {
  return (
    <button
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{
        padding: '6px 10px',
        background: active ? '#2563eb' : '#161617',
        border: '1px solid',
        borderColor: active ? '#2563eb' : '#2a2a2a',
        borderRadius: 6,
        color: active ? '#fff' : '#999',
        fontSize: 10,
        cursor: 'pointer',
        transition: 'all 0.12s ease',
        textAlign: 'left' as const,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 2,
      }}
    >
      <span style={{ fontWeight: 500 }}>{preset.label}</span>
      <span style={{ fontSize: 9, color: active ? '#ffffffaa' : '#666' }}>
        {preset.description}
      </span>
    </button>
  );
}

// ── Utility ───────────────────────────────────────────

function arrEq(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 0.001);
}

// ── Styles ────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  background: '#0d0d0e',
  border: '1px solid #2a2a2a',
  borderRadius: 8,
  overflow: 'hidden',
};

const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  padding: '8px 10px',
  borderBottom: '1px solid #2a2a2a',
  alignItems: 'center',
};

const customBtnStyle: React.CSSProperties = {
  padding: '3px 10px',
  background: 'transparent',
  border: '1px solid #333',
  borderRadius: 5,
  color: '#888',
  fontSize: 10,
  cursor: 'pointer',
};

const scrollAreaStyle: React.CSSProperties = {
  padding: '8px 10px',
  maxHeight: 240,
  overflowY: 'auto',
};

const catLabelStyle: React.CSSProperties = {
  fontSize: 9,
  color: '#555',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  marginBottom: 6,
  fontWeight: 600,
};

const presetGridStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 4,
};

export default PresetSelector;
