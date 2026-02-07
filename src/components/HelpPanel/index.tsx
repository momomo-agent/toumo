import { useState } from 'react';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type HelpTab = 'basics' | 'patches' | 'shortcuts';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 13, color: '#fff', marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  );
}

function BasicsHelp() {
  return (
    <>
      <Section title="🎯 Core Concept">
        <p>Toumo uses a <strong>state machine</strong> model.</p>
        <p><strong>Display State</strong> = visual snapshot</p>
        <p><strong>Variable</strong> = logic flag</p>
        <p><strong>Patch</strong> = wired node</p>
      </Section>
      <Section title="🖌️ Canvas">
        <p><strong>R</strong> Rectangle · <strong>O</strong> Ellipse · <strong>T</strong> Text</p>
        <p>Select elements → edit in Inspector.</p>
      </Section>
      <Section title="▶️ Preview">
        <p>Live Preview updates in real-time. Click ▶️ for fullscreen.</p>
      </Section>
    </>
  );
}

function PatchesHelp() {
  return (
    <>
      <Section title="🔌 Patches">
        <p>Triggers (left) → Actions (right), connected by wires.</p>
      </Section>
      <Section title="Triggers">
        <p>Tap · Hover · Drag · Scroll · Timer · Variable Change</p>
      </Section>
      <Section title="Actions">
        <p>Switch Display State · Set Variable · Animate Property</p>
      </Section>
      <Section title="Logic">
        <p>Condition · Toggle · Counter · Delay · Option Switch · Drag Binding</p>
      </Section>
    </>
  );
}

function ShortcutsHelp() {
  const keys: [string, string][] = [
    ['V', 'Select tool'],
    ['R', 'Rectangle'],
    ['O', 'Ellipse'],
    ['T', 'Text'],
    ['H', 'Hand/Pan'],
    ['Space', 'Temporary hand'],
    ['Delete', 'Delete selected'],
    ['⌘C/V', 'Copy / Paste'],
    ['⌘Z', 'Undo'],
    ['⌘⇧Z', 'Redo'],
    ['⌘D', 'Duplicate Patch'],
    ['⌘0', 'Zoom to fit'],
    ['⌘+/−', 'Zoom in/out'],
    ['Arrows', 'Nudge 1px'],
    ['⇧+Arrow', 'Nudge 10px'],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '6px 12px' }}>
      {keys.map(([key, desc]) => (
        <div key={key} style={{ display: 'contents' }}>
          <span style={{ color: '#3b82f6', fontFamily: 'monospace', fontSize: 11 }}>{key}</span>
          <span style={{ color: '#ccc', fontSize: 12 }}>{desc}</span>
        </div>
      ))}
    </div>
  );
}

export function HelpPanel({ isOpen, onClose }: HelpPanelProps) {
  const [tab, setTab] = useState<HelpTab>('basics');
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,.6)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#1a1a1a', border: '1px solid #333',
        borderRadius: 12, width: 560, maxHeight: '80vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #333',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ margin: 0, fontSize: 16, color: '#fff' }}>📖 Toumo Help</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#888',
            fontSize: 18, cursor: 'pointer',
          }}>×</button>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
          {([['basics', '🎨 Basics'], ['patches', '🔌 Patches'], ['shortcuts', '⌨️ Shortcuts']] as [HelpTab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: '10px',
              background: tab === id ? '#2a2a2a' : 'transparent',
              border: 'none',
              borderBottom: tab === id ? '2px solid #3b82f6' : '2px solid transparent',
              color: tab === id ? '#fff' : '#888',
              fontSize: 12, cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1, fontSize: 12, color: '#ccc', lineHeight: 1.8 }}>
          {tab === 'basics' && <BasicsHelp />}
          {tab === 'patches' && <PatchesHelp />}
          {tab === 'shortcuts' && <ShortcutsHelp />}
        </div>
      </div>
    </div>
  );
}
