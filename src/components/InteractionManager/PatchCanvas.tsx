import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Patch, PatchConnection as PatchConnectionType, PatchType, PatchPort } from '../../types';
import { PatchNode } from './PatchNode';
import { PatchConnection, DragConnection } from './PatchConnection';
import { useEditorStore } from '../../store/useEditorStore';

// Default ports for each patch type
function getDefaultPorts(type: PatchType): { inputs: PatchPort[]; outputs: PatchPort[] } {
  switch (type) {
    case 'tap':
      return {
        inputs: [],
        outputs: [
          { id: 'onTap', name: 'onTap', dataType: 'pulse' },
          { id: 'target', name: 'target', dataType: 'any' },
        ],
      };
    case 'drag':
      return {
        inputs: [],
        outputs: [
          { id: 'onStart', name: 'onStart', dataType: 'pulse' },
          { id: 'onMove', name: 'onMove', dataType: 'pulse' },
          { id: 'onEnd', name: 'onEnd', dataType: 'pulse' },
          { id: 'dx', name: 'dx', dataType: 'number' },
          { id: 'dy', name: 'dy', dataType: 'number' },
        ],
      };
    case 'hover':
      return {
        inputs: [],
        outputs: [
          { id: 'onOver', name: 'onOver', dataType: 'pulse' },
          { id: 'onOut', name: 'onOut', dataType: 'pulse' },
          { id: 'isHovered', name: 'isHovered', dataType: 'boolean' },
        ],
      };
    case 'scroll':
      return {
        inputs: [],
        outputs: [
          { id: 'onScroll', name: 'onScroll', dataType: 'pulse' },
          { id: 'scrollY', name: 'scrollY', dataType: 'number' },
        ],
      };
    case 'timer':
      return {
        inputs: [
          { id: 'start', name: 'start', dataType: 'pulse' },
        ],
        outputs: [
          { id: 'onFire', name: 'onFire', dataType: 'pulse' },
        ],
      };
    case 'variableChange':
      return {
        inputs: [],
        outputs: [
          { id: 'onChange', name: 'onChange', dataType: 'pulse' },
          { id: 'value', name: 'value', dataType: 'any' },
        ],
      };
    case 'switchDisplayState':
      return {
        inputs: [
          { id: 'trigger', name: 'trigger', dataType: 'pulse' },
          { id: 'state', name: 'state', dataType: 'displayState' },
        ],
        outputs: [
          { id: 'done', name: 'done', dataType: 'pulse' },
        ],
      };
    case 'setVariable':
      return {
        inputs: [
          { id: 'trigger', name: 'trigger', dataType: 'pulse' },
          { id: 'value', name: 'value', dataType: 'any' },
        ],
        outputs: [
          { id: 'done', name: 'done', dataType: 'pulse' },
        ],
      };
    case 'animateProperty':
      return {
        inputs: [
          { id: 'trigger', name: 'trigger', dataType: 'pulse' },
          { id: 'value', name: 'value', dataType: 'number' },
        ],
        outputs: [
          { id: 'done', name: 'done', dataType: 'pulse' },
        ],
      };
    case 'condition':
      return {
        inputs: [
          { id: 'input', name: 'input', dataType: 'boolean' },
        ],
        outputs: [
          { id: 'true', name: 'true', dataType: 'pulse' },
          { id: 'false', name: 'false', dataType: 'pulse' },
        ],
      };
    case 'delay':
      return {
        inputs: [
          { id: 'trigger', name: 'trigger', dataType: 'pulse' },
        ],
        outputs: [
          { id: 'delayed', name: 'delayed', dataType: 'pulse' },
        ],
      };
    case 'toggle':
      return {
        inputs: [
          { id: 'trigger', name: 'trigger', dataType: 'pulse' },
        ],
        outputs: [
          { id: 'on', name: 'on', dataType: 'pulse' },
          { id: 'off', name: 'off', dataType: 'pulse' },
          { id: 'state', name: 'state', dataType: 'boolean' },
        ],
      };
    case 'counter':
      return {
        inputs: [
          { id: 'increment', name: 'increment', dataType: 'pulse' },
          { id: 'reset', name: 'reset', dataType: 'pulse' },
        ],
        outputs: [
          { id: 'count', name: 'count', dataType: 'number' },
        ],
      };
    case 'optionSwitch': {
      const n = 3; // default 3 options
      return {
        inputs: Array.from({ length: n }, (_, i) => ({ id: `option${i}`, name: `option${i}`, dataType: 'pulse' as const })),
        outputs: Array.from({ length: n }, (_, i) => ({ id: `selected${i}`, name: `selected${i}`, dataType: 'pulse' as const })),
      };
    }
    case 'dragBinding':
      return {
        inputs: [
          { id: 'dragInput', name: 'dragInput', dataType: 'pulse' },
        ],
        outputs: [
          { id: 'value', name: 'value', dataType: 'number' },
        ],
      };
    default:
      return { inputs: [], outputs: [] };
  }
}

const PATCH_LABELS: Record<PatchType, string> = {
  tap: 'Tap',
  drag: 'Drag',
  hover: 'Hover',
  scroll: 'Scroll',
  timer: 'Timer',
  variableChange: 'Var Change',
  switchDisplayState: 'Switch State',
  setVariable: 'Set Variable',
  animateProperty: 'Animate',
  condition: 'Condition',
  delay: 'Delay',
  toggle: 'Toggle',
  counter: 'Counter',
  optionSwitch: 'Option Switch',
  dragBinding: 'Drag Binding',
};

interface DragState {
  type: 'node' | 'port';
  patchId: string;
  portId?: string;
  isOutput?: boolean;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
}

export function PatchCanvas() {
  const patches = useEditorStore((s) => s.patches);
  const connections = useEditorStore((s) => s.patchConnections);
  const selectedPatchId = useEditorStore((s) => s.selectedPatchId);
  const activePatchIds = useEditorStore((s) => s.activePatchIds);
  const selectedConnectionId = useEditorStore((s) => s.selectedConnectionId);
  const updatePatchPosition = useEditorStore((s) => s.updatePatchPosition);
  const removePatch = useEditorStore((s) => s.removePatch);
  const addPatch = useEditorStore((s) => s.addPatch);
  const addPatchConnection = useEditorStore((s) => s.addPatchConnection);
  const removePatchConnection = useEditorStore((s) => s.removePatchConnection);
  const setSelectedPatchId = useEditorStore((s) => s.setSelectedPatchId);
  const setSelectedConnectionId = useEditorStore((s) => s.setSelectedConnectionId);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [dragLine, setDragLine] = useState<{ fromX: number; fromY: number; toX: number; toY: number } | null>(null);
  const [_contextMenu, setContextMenu] = useState<{ x: number; y: number; patchId?: string; connectionId?: string } | null>(null);
  // Tick counter to force connection re-render during node drag
  const [, setRenderTick] = useState(0);

  // Force a re-render after mount so connections can find port DOM elements
  useEffect(() => {
    const frame = requestAnimationFrame(() => setRenderTick(t => t + 1));
    return () => cancelAnimationFrame(frame);
  }, [patches.length, connections.length]);

  // Get port position in canvas coordinates
  const getPortPosition = useCallback((patchId: string, portId: string, isOutput: boolean): { x: number; y: number } | null => {
    if (!containerRef.current) return null;
    const portEl = containerRef.current.querySelector(
      `[data-patch-id="${patchId}"][data-port-id="${portId}"][data-port-output="${isOutput}"]`
    );
    if (!portEl) return null;
    const containerRect = containerRef.current.getBoundingClientRect();
    const portRect = portEl.getBoundingClientRect();
    return {
      x: portRect.left + portRect.width / 2 - containerRect.left + containerRef.current.scrollLeft,
      y: portRect.top + portRect.height / 2 - containerRect.top + containerRef.current.scrollTop,
    };
  }, []);

  // Node drag
  const handleNodeDragStart = useCallback((patchId: string, e: React.MouseEvent) => {
    const patch = patches.find(p => p.id === patchId);
    if (!patch) return;
    dragRef.current = {
      type: 'node',
      patchId,
      startX: e.clientX,
      startY: e.clientY,
      origX: patch.position.x,
      origY: patch.position.y,
    };
  }, [patches]);

  // Port drag (start connection)
  const handlePortDragStart = useCallback((patchId: string, portId: string, isOutput: boolean, e: React.MouseEvent) => {
    const pos = getPortPosition(patchId, portId, isOutput);
    if (!pos) return;
    dragRef.current = {
      type: 'port',
      patchId,
      portId,
      isOutput,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
    setDragLine({ fromX: pos.x, fromY: pos.y, toX: pos.x, toY: pos.y });
  }, [getPortPosition]);

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      if (drag.type === 'node') {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        updatePatchPosition(drag.patchId, {
          x: Math.max(0, drag.origX + dx),
          y: Math.max(0, drag.origY + dy),
        });
        // Force connection lines to re-render while dragging nodes
        setRenderTick(t => t + 1);
      } else if (drag.type === 'port' && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        setDragLine({
          fromX: drag.origX,
          fromY: drag.origY,
          toX: e.clientX - containerRect.left + containerRef.current.scrollLeft,
          toY: e.clientY - containerRect.top + containerRef.current.scrollTop,
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (drag?.type === 'port' && containerRef.current) {
        // Check if we dropped on a port
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (target) {
          const portEl = target.closest('[data-port-id]') as HTMLElement | null;
          if (portEl) {
            const toPatchId = portEl.getAttribute('data-patch-id');
            const toPortId = portEl.getAttribute('data-port-id');
            const toIsOutput = portEl.getAttribute('data-port-output') === 'true';

            // Only connect output → input (or input → output)
            if (toPatchId && toPortId && drag.isOutput !== toIsOutput && toPatchId !== drag.patchId) {
              const fromPatchId = drag.isOutput ? drag.patchId : toPatchId;
              const fromPortId = drag.isOutput ? drag.portId! : toPortId;
              const targetPatchId = drag.isOutput ? toPatchId : drag.patchId;
              const targetPortId = drag.isOutput ? toPortId : drag.portId!;

              // Check for duplicate
              const exists = connections.some(
                c => c.fromPatchId === fromPatchId && c.fromPortId === fromPortId
                  && c.toPatchId === targetPatchId && c.toPortId === targetPortId
              );
              if (!exists) {
                // Type compatibility check
                const fromPatchObj = patches.find(p => p.id === fromPatchId);
                const toPatchObj = patches.find(p => p.id === targetPatchId);
                const fromPort = fromPatchObj?.outputs.find(p => p.id === fromPortId);
                const toPort = toPatchObj?.inputs.find(p => p.id === targetPortId);
                const compatible = !fromPort || !toPort
                  || fromPort.dataType === toPort.dataType
                  || fromPort.dataType === 'any' || toPort.dataType === 'any'
                  || fromPort.dataType === 'pulse' || toPort.dataType === 'pulse';
                if (compatible) {
                  addPatchConnection({
                    id: `conn_${Date.now()}`,
                    fromPatchId,
                    fromPortId,
                    toPatchId: targetPatchId,
                    toPortId: targetPortId,
                  });
                }
              }
            }
          }
        }
      }
      dragRef.current = null;
      setDragLine(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [patches, connections, updatePatchPosition, addPatchConnection, getPortPosition]);

  // Handle delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedPatchId) {
          removePatch(selectedPatchId);
        } else if (selectedConnectionId) {
          removePatchConnection(selectedConnectionId);
        }
      }
      // Cmd+D: duplicate selected patch
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedPatchId) {
        e.preventDefault();
        const src = patches.find(p => p.id === selectedPatchId);
        if (src) {
          const newId = `patch-dup-${Date.now()}`;
          addPatch({
            ...src,
            id: newId,
            name: src.name + ' Copy',
            position: { x: src.position.x + 30, y: src.position.y + 30 },
            inputs: src.inputs.map(p => ({ ...p, id: `${newId}-${p.name}` })),
            outputs: src.outputs.map(p => ({ ...p, id: `${newId}-${p.name}` })),
          });
          setSelectedPatchId(newId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPatchId, selectedConnectionId, removePatch, removePatchConnection]);

  // Fit all nodes into view
  const handleFitAll = useCallback(() => {
    if (!containerRef.current || patches.length === 0) return;
    const minX = Math.min(...patches.map(p => p.position.x));
    const minY = Math.min(...patches.map(p => p.position.y));
    const offsetX = Math.max(0, 60 - minX);
    const offsetY = Math.max(0, 60 - minY);
    if (offsetX > 0 || offsetY > 0) {
      patches.forEach(p => {
        updatePatchPosition(p.id, {
          x: p.position.x + offsetX,
          y: p.position.y + offsetY,
        });
      });
    }
    containerRef.current.scrollTo(0, 0);
  }, [patches, updatePatchPosition]);

  // Compute connection positions
  const connectionLines = connections.map(conn => {
    const fromPos = getPortPosition(conn.fromPatchId, conn.fromPortId, true);
    const toPos = getPortPosition(conn.toPatchId, conn.toPortId, false);
    if (!fromPos || !toPos) return null;
    // Find data type from source port
    const fromPatch = patches.find(p => p.id === conn.fromPatchId);
    const fromPort = fromPatch?.outputs.find(p => p.id === conn.fromPortId);
    return { conn, fromPos, toPos, dataType: fromPort?.dataType || 'any' };
  }).filter(Boolean) as { conn: PatchConnectionType; fromPos: { x: number; y: number }; toPos: { x: number; y: number }; dataType: string }[];

  return (
    <div
      ref={containerRef}
      onClick={() => { setSelectedPatchId(null); setSelectedConnectionId(null); }}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'auto',
        background: '#0a0a0a',
        backgroundImage: 'radial-gradient(circle, #1a1a1a 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Fit All button */}
      <button
        onClick={(e) => { e.stopPropagation(); handleFitAll(); }}
        style={{
          position: 'absolute', top: 8, right: 8, zIndex: 20,
          padding: '4px 8px', background: '#333', border: '1px solid #555',
          borderRadius: 4, color: '#ccc', fontSize: 10, cursor: 'pointer',
        }}
      >
        ⊞ Fit All
      </button>
      {/* SVG layer for connections */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4000px',
          height: '4000px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <g style={{ pointerEvents: 'auto' }}>
          {connectionLines.map(({ conn, fromPos, toPos, dataType }) => (
            <PatchConnection
              key={conn.id}
              id={conn.id}
              fromX={fromPos.x}
              fromY={fromPos.y}
              toX={toPos.x}
              toY={toPos.y}
              dataType={dataType}
              selected={selectedConnectionId === conn.id}
              onSelect={setSelectedConnectionId}
              onDelete={removePatchConnection}
            />
          ))}
          {dragLine && (
            <DragConnection
              fromX={dragLine.fromX}
              fromY={dragLine.fromY}
              toX={dragLine.toX}
              toY={dragLine.toY}
            />
          )}
        </g>
      </svg>

      {/* DOM layer for nodes */}
      {patches.map(patch => (
        <PatchNode
          key={patch.id}
          patch={patch}
          selected={selectedPatchId === patch.id}
          isActive={activePatchIds.has(patch.id)}
          onSelect={setSelectedPatchId}
          onDragStart={handleNodeDragStart}
          onPortDragStart={handlePortDragStart}
          getPortPosition={getPortPosition}
          onContextMenu={(e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({ x: e.clientX, y: e.clientY, patchId: patch.id });
          }}
        />
      ))}

      {/* Empty state */}
      {patches.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#444',
            fontSize: 13,
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔌</div>
          <div>Add patches from the toolbar above</div>
          <div style={{ fontSize: 11, marginTop: 4, color: '#333' }}>
            Connect outputs → inputs to create interactions
          </div>
        </div>
      )}

      {/* Patch Context Menu */}
      {_contextMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setContextMenu(null)} />
          <div style={{
            position: 'fixed', left: _contextMenu.x, top: _contextMenu.y, zIndex: 999,
            background: '#1e1e1e', border: '1px solid #333', borderRadius: 6,
            padding: 4, minWidth: 140, boxShadow: '0 4px 16px rgba(0,0,0,.5)',
          }}>
            {_contextMenu.patchId && (
              <>
                <CtxItem label="Duplicate" onClick={() => {
                  const p = patches.find(x => x.id === _contextMenu.patchId);
                  if (p) {
                    const dup = createPatch(p.type, { x: p.position.x + 30, y: p.position.y + 30 });
                    dup.config = { ...p.config };
                    dup.name = p.name + ' copy';
                    addPatch(dup);
                  }
                  setContextMenu(null);
                }} />
                <CtxItem label="Delete" danger onClick={() => {
                  if (_contextMenu.patchId) removePatch(_contextMenu.patchId);
                  setContextMenu(null);
                }} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Export helper for creating patches
export function createPatch(type: PatchType, position: { x: number; y: number }): Patch {
  const ports = getDefaultPorts(type);
  return {
    id: `patch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    name: PATCH_LABELS[type] || type,
    position,
    config: {},
    inputs: ports.inputs,
    outputs: ports.outputs,
  };
}

function CtxItem({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      style={{
        padding: '6px 12px', cursor: 'pointer', borderRadius: 3,
        fontSize: 12, color: danger ? '#ef4444' : '#ddd',
      }}
    >{label}</div>
  );
}
