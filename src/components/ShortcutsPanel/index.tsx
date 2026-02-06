import { useState } from 'react';

const shortcuts = [
  { key: 'V', desc: 'Select tool' },
  { key: 'R', desc: 'Rectangle tool' },
  { key: 'O', desc: 'Ellipse tool' },
  { key: 'T', desc: 'Text tool' },
  { key: 'L', desc: 'Line tool' },
  { key: 'I', desc: 'Image tool' },
  { key: 'F', desc: 'Frame tool' },
  { key: 'H', desc: 'Hand tool' },
  { key: 'E', desc: 'Eyedropper tool' },
  { key: '⌘C', desc: 'Copy' },
  { key: '⌘V', desc: 'Paste' },
  { key: '⌘D', desc: 'Duplicate' },
  { key: '⌘A', desc: 'Select all' },
  { key: '⌘Z', desc: 'Undo' },
  { key: '⇧⌘Z', desc: 'Redo' },
  { key: '⌘G', desc: 'Group' },
  { key: '⇧⌘G', desc: 'Ungroup' },
  { key: '⌘]', desc: 'Bring forward' },
  { key: '⌘[', desc: 'Send backward' },
  { key: '⌥⌘C', desc: 'Copy style' },
  { key: '⌥⌘V', desc: 'Paste style' },
  { key: '↑↓←→', desc: 'Nudge 1px' },
  { key: '⇧+Arrow', desc: 'Nudge 10px' },
  { key: 'Esc', desc: 'Deselect' },
  { key: 'Del', desc: 'Delete' },
  { key: '1-9', desc: 'Set opacity 10-90%' },
  { key: '0', desc: 'Set opacity 100%' },
  { key: '⇧H', desc: 'Toggle visibility' },
  { key: '⇧L', desc: 'Toggle lock' },
  { key: '⌥H', desc: 'Align center horizontal' },
  { key: '⌥V', desc: 'Align center vertical' },
  { key: '⌘E', desc: 'Export PNG' },
];

export function ShortcutsPanel() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 40,
          right: 16,
          padding: '6px 12px',
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: 6,
          color: '#888',
          fontSize: 11,
          cursor: 'pointer',
          zIndex: 100,
        }}
      >
        ? Shortcuts
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 40,
      right: 16,
      width: 240,
      maxHeight: 400,
      background: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: 8,
      padding: 12,
      zIndex: 100,
      overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: '#fff', fontWeight: 600 }}>Shortcuts</span>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>×</button>
      </div>
      {shortcuts.map(s => (
        <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11 }}>
          <span style={{ color: '#888' }}>{s.desc}</span>
          <span style={{ color: '#fff', fontFamily: 'monospace' }}>{s.key}</span>
        </div>
      ))}
    </div>
  );
}
