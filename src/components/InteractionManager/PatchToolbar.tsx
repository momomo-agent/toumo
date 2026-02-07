import { useState, useRef } from 'react';
import type { PatchType } from '../../types';
import { useEditorStore } from '../../store/useEditorStore';
import { createPatch } from './PatchCanvas';
// zustand shallow import removed - not needed here

interface PatchCategory {
  label: string;
  color: string;
  items: { type: PatchType; label: string; icon: string }[];
}

const CATEGORIES: PatchCategory[] = [
  {
    label: 'Triggers',
    color: '#2563eb',
    items: [
      { type: 'tap', label: 'Tap', icon: '👆' },
      { type: 'drag', label: 'Drag', icon: '✋' },
      { type: 'hover', label: 'Hover', icon: '🖱' },
      { type: 'scroll', label: 'Scroll', icon: '📜' },
      { type: 'timer', label: 'Timer', icon: '⏱' },
      { type: 'variableChange', label: 'Var Change', icon: '🔄' },
    ],
  },
  {
    label: 'Actions',
    color: '#22c55e',
    items: [
      { type: 'switchDisplayState', label: 'Switch State', icon: '🔀' },
      { type: 'setVariable', label: 'Set Variable', icon: '📝' },
      { type: 'animateProperty', label: 'Animate', icon: '✨' },
    ],
  },
  {
    label: 'Logic',
    color: '#a855f7',
    items: [
      { type: 'condition', label: 'Condition', icon: '❓' },
      { type: 'delay', label: 'Delay', icon: '⏳' },
      { type: 'toggle', label: 'Toggle', icon: '🔁' },
      { type: 'counter', label: 'Counter', icon: '#️⃣' },
      { type: 'optionSwitch', label: 'Option Switch', icon: '🔘' },
    ],
  },
];

export function PatchToolbar() {
  const addPatch = useEditorStore((s) => s.addPatch);
  const setSelectedPatchId = useEditorStore((s) => s.setSelectedPatchId);
  const sharedElements = useEditorStore((s) => s.sharedElements);
  const nextPositionRef = useRef({ x: 40, y: 40 });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [elementMenuOpen, setElementMenuOpen] = useState(false);

  const advancePosition = () => {
    const pos = nextPositionRef.current;
    nextPositionRef.current = {
      x: pos.x + 30 > 400 ? 40 : pos.x + 30,
      y: pos.y + 30 > 300 ? 40 : pos.y + 30,
    };
  };

  const handleAddPatch = (type: PatchType) => {
    const pos = nextPositionRef.current;
    const patch = createPatch(type, pos);
    addPatch(patch);
    setSelectedPatchId(patch.id);
    advancePosition();
  };

  const handleAddTapForElement = (elementId: string, elementName: string) => {
    const pos = nextPositionRef.current;
    const tapPatch = createPatch('tap', pos);
    tapPatch.config = { targetElementId: elementId };
    tapPatch.name = `Tap: ${elementName}`;
    addPatch(tapPatch);
    setSelectedPatchId(tapPatch.id);
    advancePosition();
    setElementMenuOpen(false);
    setExpanded(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 12px',
        borderBottom: '1px solid #2a2a2a',
        background: '#0d0d0d',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 11, color: '#555', marginRight: 8 }}>
        + Add Patch
      </span>

      {/* Element List dropdown */}
      <div style={{ position: 'relative', marginRight: 4 }}>
        <button
          onClick={() => {
            setElementMenuOpen(!elementMenuOpen);
            setExpanded(null);
          }}
          style={{
            padding: '4px 10px',
            background: elementMenuOpen ? '#f59e0b22' : 'transparent',
            border: '1px solid #f59e0b44',
            borderRadius: 4,
            color: '#f59e0b',
            fontSize: 11,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          🎯 Elements
        </button>

        {elementMenuOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: 6,
              padding: 4,
              zIndex: 100,
              minWidth: 180,
              maxHeight: 260,
              overflowY: 'auto',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            }}
          >
            {sharedElements.length === 0 ? (
              <div style={{ padding: '8px 8px', fontSize: 11, color: '#666' }}>
                No elements on canvas
              </div>
            ) : (
              <>
                <div style={{ padding: '4px 8px', fontSize: 10, color: '#666', borderBottom: '1px solid #2a2a2a', marginBottom: 2 }}>
                  Select element → create Tap trigger
                </div>
                {sharedElements.map((el) => (
                  <button
                    key={el.id}
                    onClick={() => handleAddTapForElement(el.id, el.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '6px 8px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 4,
                      color: '#ccc',
                      fontSize: 11,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.background = '#2a2a2a';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <span style={{ fontSize: 10, color: '#888' }}>
                      {el.shapeType === 'rectangle' ? '⬜' : el.shapeType === 'ellipse' ? '⚪' : el.shapeType === 'text' ? '📝' : el.shapeType === 'image' ? '🖼️' : '▫️'}
                    </span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{el.name}</span>
                    <span style={{ fontSize: 9, color: '#555' }}>👆 Tap</span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ width: 1, height: 20, background: '#333', marginRight: 4 }} />

      {CATEGORIES.map((cat) => (
        <div key={cat.label} style={{ position: 'relative' }}>
          <button
            onClick={() => setExpanded(expanded === cat.label ? null : cat.label)}
            style={{
              padding: '4px 10px',
              background: expanded === cat.label ? cat.color + '22' : 'transparent',
              border: `1px solid ${cat.color}44`,
              borderRadius: 4,
              color: cat.color,
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {cat.label}
          </button>

          {expanded === cat.label && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 4,
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: 6,
                padding: 4,
                zIndex: 100,
                minWidth: 140,
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              }}
            >
              {cat.items.map((item) => (
                <button
                  key={item.type}
                  onClick={() => {
                    handleAddPatch(item.type);
                    setExpanded(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '6px 8px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 4,
                    color: '#ccc',
                    fontSize: 11,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.background = '#2a2a2a';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
