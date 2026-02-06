import { useRef, useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '../../store';
import type { Transition } from '../../types';

interface NodePosition {
  id: string;
  x: number;
  y: number;
}

interface DragConnection {
  fromId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

const CURVE_OPTIONS = [
  { id: 'linear', label: 'Linear' },
  { id: 'ease', label: 'Ease' },
  { id: 'ease-in', label: 'Ease In' },
  { id: 'ease-out', label: 'Ease Out' },
  { id: 'ease-in-out', label: 'Ease In Out' },
  { id: 'spring', label: 'Spring' },
];

const TRIGGER_OPTIONS = [
  { id: 'tap', label: 'Tap' },
  { id: 'hover', label: 'Hover' },
  { id: 'drag', label: 'Drag' },
  { id: 'scroll', label: 'Scroll' },
  { id: 'timer', label: 'Timer' },
  { id: 'variable', label: 'Variable' },
];

export function StateGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodePositions, setNodePositions] = useState<NodePosition[]>([]);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragConnection, setDragConnection] = useState<DragConnection | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; transitionId: string } | null>(null);

  const {
    keyframes,
    transitions,
    selectedKeyframeId,
    selectedTransitionId,
    setSelectedKeyframeId,
    setSelectedTransitionId,
    updateTransition,
    addTransition,
    deleteTransition,
  } = useEditorStore();

  // Initialize node positions
  useEffect(() => {
    if (keyframes.length === 0) return;
    
    setNodePositions(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const keyframeIds = new Set(keyframes.map(kf => kf.id));
      
      // Keep existing positions for keyframes that still exist
      const kept = prev.filter(n => keyframeIds.has(n.id));
      
      // Add new positions for new keyframes
      const newKeyframes = keyframes.filter(kf => !existingIds.has(kf.id));
      const newPositions = newKeyframes.map((kf, i) => ({
        id: kf.id,
        x: 80 + (kept.length + i) * 200,
        y: 60 + ((kept.length + i) % 2) * 50,
      }));
      
      return [...kept, ...newPositions];
    });
  }, [keyframes]);

  const getNodePosition = (id: string): NodePosition => {
    return nodePositions.find(n => n.id === id) || { id, x: 0, y: 0 };
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const pos = getNodePosition(nodeId);
    setDraggingNode(nodeId);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  // Handle connection drag start (from node edge)
  const handleConnectionDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const pos = getNodePosition(nodeId);
    
    setDragConnection({
      fromId: nodeId,
      fromX: pos.x + 140, // Right edge of node
      fromY: pos.y + 16,
      toX: e.clientX - rect.left,
      toY: e.clientY - rect.top,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (draggingNode) {
      const x = Math.max(40, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - 100));
      const y = Math.max(20, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 40));
      setNodePositions(prev =>
        prev.map(n => (n.id === draggingNode ? { ...n, x, y } : n))
      );
    }

    if (dragConnection) {
      setDragConnection(prev => prev ? {
        ...prev,
        toX: e.clientX - rect.left,
        toY: e.clientY - rect.top,
      } : null);
    }
  }, [draggingNode, dragOffset, dragConnection]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (dragConnection && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Check if dropped on a node
      const targetNode = nodePositions.find(n => {
        return mouseX >= n.x && mouseX <= n.x + 140 &&
               mouseY >= n.y && mouseY <= n.y + 44;
      });
      
      if (targetNode && targetNode.id !== dragConnection.fromId) {
        // Check if transition already exists
        const exists = transitions.some(
          t => t.from === dragConnection.fromId && t.to === targetNode.id
        );
        if (!exists) {
          addTransition(dragConnection.fromId, targetNode.id);
        }
      }
    }
    
    setDraggingNode(null);
    setDragConnection(null);
  }, [dragConnection, nodePositions, transitions, addTransition]);

  useEffect(() => {
    if (draggingNode || dragConnection) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingNode, dragConnection, handleMouseMove, handleMouseUp]);

  const handleNodeClick = (e: React.MouseEvent, kfId: string) => {
    e.stopPropagation();
    setSelectedKeyframeId(kfId);
    setSelectedTransitionId(null);
    setContextMenu(null);
  };

  const handleTransitionClick = (e: React.MouseEvent, trId: string) => {
    e.stopPropagation();
    setSelectedTransitionId(trId);
    setContextMenu(null);
  };

  const handleTransitionContextMenu = (e: React.MouseEvent, trId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setContextMenu({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      transitionId: trId,
    });
  };

  const handleBackgroundClick = () => {
    setSelectedTransitionId(null);
    setContextMenu(null);
  };

  const selectedTransition = transitions.find(t => t.id === selectedTransitionId);

  // Calculate edge path with curve
  const getEdgePath = (from: NodePosition, to: NodePosition) => {
    const dx = to.x - from.x;
    const cx1 = from.x + dx * 0.4;
    const cy1 = from.y;
    const cx2 = from.x + dx * 0.6;
    const cy2 = to.y;
    return `M ${from.x + 140} ${from.y + 20} C ${cx1 + 70} ${cy1 + 20}, ${cx2} ${cy2 + 20}, ${to.x} ${to.y + 20}`;
  };

  // Get midpoint for transition label
  const getEdgeMidpoint = (from: NodePosition, to: NodePosition) => {
    return {
      x: (from.x + 140 + to.x) / 2,
      y: (from.y + to.y) / 2 + 20,
    };
  };

  return (
    <div
      ref={containerRef}
      onClick={handleBackgroundClick}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#0a0a0b',
        backgroundImage: 'radial-gradient(circle, #1a1a1d 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {/* SVG for edges */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <defs>
          {/* Glow filter for selected edges */}
          <filter id="edge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0.5 L 7 3 L 0 5.5 L 1.5 3 Z" fill="#555" />
          </marker>
          <marker
            id="arrowhead-selected"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0.5 L 7 3 L 0 5.5 L 1.5 3 Z" fill="#60a5fa" />
          </marker>
          <marker
            id="arrowhead-drag"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0.5 L 7 3 L 0 5.5 L 1.5 3 Z" fill="#4ade80" />
          </marker>
        </defs>

        {/* Existing transitions */}
        {transitions.map(tr => {
          const fromPos = getNodePosition(tr.from);
          const toPos = getNodePosition(tr.to);
          const isSelected = tr.id === selectedTransitionId;
          const midpoint = getEdgeMidpoint(fromPos, toPos);
          
          return (
            <g key={tr.id}>
              <path
                d={getEdgePath(fromPos, toPos)}
                fill="none"
                stroke={isSelected ? '#3b82f6' : '#3a3a3e'}
                strokeWidth={isSelected ? 2.5 : 1.5}
                strokeLinecap="round"
                markerEnd={isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'}
                filter={isSelected ? 'url(#edge-glow)' : undefined}
                style={{
                  pointerEvents: 'stroke',
                  cursor: 'pointer',
                  transition: 'stroke 0.2s, stroke-width 0.2s',
                }}
                onClick={(e) => handleTransitionClick(e, tr.id)}
                onContextMenu={(e) => handleTransitionContextMenu(e, tr.id)}
              />
              {/* Clickable hit area */}
              <path
                d={getEdgePath(fromPos, toPos)}
                fill="none"
                stroke="transparent"
                strokeWidth={16}
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                onClick={(e) => handleTransitionClick(e, tr.id)}
                onContextMenu={(e) => handleTransitionContextMenu(e, tr.id)}
              />
              {/* Transition label */}
              <text
                x={midpoint.x}
                y={midpoint.y - 8}
                textAnchor="middle"
                fill={isSelected ? '#2563eb' : '#888'}
                fontSize={10}
                style={{ pointerEvents: 'none' }}
              >
                {tr.trigger}
              </text>
            </g>
          );
        })}

        {/* Drag connection preview */}
        {dragConnection && (
          <line
            x1={dragConnection.fromX}
            y1={dragConnection.fromY}
            x2={dragConnection.toX}
            y2={dragConnection.toY}
            stroke="#22c55e"
            strokeWidth={2}
            strokeDasharray="5,5"
            markerEnd="url(#arrowhead-drag)"
          />
        )}
      </svg>

      {/* State nodes */}
      {keyframes.map(kf => {
        const pos = getNodePosition(kf.id);
        const isSelected = kf.id === selectedKeyframeId;
        const isInitial = kf.id === keyframes[0]?.id;

        return (
          <div
            key={kf.id}
            onMouseDown={(e) => handleNodeMouseDown(e, kf.id)}
            onClick={(e) => handleNodeClick(e, kf.id)}
            onMouseEnter={(e) => {
              const handle = e.currentTarget.querySelector('[data-handle]') as HTMLElement;
              if (handle) handle.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              const handle = e.currentTarget.querySelector('[data-handle]') as HTMLElement;
              if (handle) { handle.style.opacity = '0'; handle.style.transform = 'translateY(-50%) scale(1)'; }
            }}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              width: 140,
              padding: '10px 14px',
              background: isSelected
                ? 'linear-gradient(135deg, #1e3a5f 0%, #1a2e4a 100%)'
                : 'linear-gradient(135deg, #1e1e20 0%, #161618 100%)',
              border: `2px solid ${isSelected ? '#3b82f6' : '#2a2a2d'}`,
              borderRadius: 12,
              cursor: draggingNode === kf.id ? 'grabbing' : 'grab',
              userSelect: 'none',
              zIndex: isSelected ? 10 : 1,
              boxShadow: isSelected
                ? '0 0 20px rgba(59,130,246,0.25), 0 4px 16px rgba(0,0,0,0.4)'
                : '0 2px 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {isInitial && (
              <div
                style={{
                  position: 'absolute',
                  top: -9,
                  left: 10,
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff',
                  fontSize: 9,
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  boxShadow: '0 2px 6px rgba(34,197,94,0.35)',
                }}
              >
                START
              </div>
            )}
            <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f0', letterSpacing: '0.2px' }}>
              {kf.name}
            </div>
            <div style={{ fontSize: 10, color: '#777', marginTop: 3 }}>
              {kf.functionalState || 'state'}
            </div>
            
            {/* Connection handle (right side) */}
            <div
              data-handle
              onMouseDown={(e) => handleConnectionDragStart(e, kf.id)}
              style={{
                position: 'absolute',
                right: -7,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 14,
                height: 14,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                borderRadius: '50%',
                cursor: 'crosshair',
                border: '2px solid #0a0a0b',
                opacity: 0,
                transition: 'opacity 0.2s, transform 0.2s',
                boxShadow: '0 0 8px rgba(34,197,94,0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
              title="Drag to create transition"
            />
          </div>
        );
      })}

      {/* Context menu for transitions */}
      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: contextMenu.x,
            top: contextMenu.y,
            background: '#1a1a1b',
            border: '1px solid #333',
            borderRadius: 6,
            padding: 4,
            zIndex: 200,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          <button
            onClick={() => {
              setSelectedTransitionId(contextMenu.transitionId);
              setContextMenu(null);
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '6px 12px',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 11,
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Edit Transition
          </button>
          <button
            onClick={() => {
              deleteTransition(contextMenu.transitionId);
              setContextMenu(null);
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '6px 12px',
              background: 'transparent',
              border: 'none',
              color: '#dc2626',
              fontSize: 11,
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Delete Transition
          </button>
        </div>
      )}

      {/* Inline transition editor */}
      {selectedTransition && !contextMenu && (
        <TransitionEditor
          transition={selectedTransition}
          onUpdate={(updates) => updateTransition(selectedTransition.id, updates)}
          onDelete={() => deleteTransition(selectedTransition.id)}
          position={getEdgeMidpoint(
            getNodePosition(selectedTransition.from),
            getNodePosition(selectedTransition.to)
          )}
        />
      )}

      {/* Help text */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          fontSize: 11,
          color: '#555',
        }}
      >
        Drag nodes to reposition • Drag green handle to create transition • Right-click edge to delete
      </div>
    </div>
  );
}

interface TransitionEditorProps {
  transition: Transition;
  onUpdate: (updates: Partial<Transition>) => void;
  onDelete: () => void;
  position: { x: number; y: number };
}

function TransitionEditor({ transition, onUpdate, onDelete, position }: TransitionEditorProps) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        left: position.x - 140,
        top: position.y + 16,
        width: 280,
        background: '#1a1a1b',
        border: '1px solid #2563eb',
        borderRadius: 10,
        padding: 14,
        zIndex: 100,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ fontSize: 11, color: '#888', marginBottom: 10, textTransform: 'uppercase' }}>
        Edit Transition
      </div>

      {/* Trigger */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>
          Trigger
        </label>
        <select
          value={transition.trigger}
          onChange={(e) => onUpdate({ trigger: e.target.value })}
          style={{
            width: '100%',
            padding: '6px 8px',
            background: '#0d0d0e',
            border: '1px solid #333',
            borderRadius: 6,
            color: '#fff',
            fontSize: 12,
          }}
        >
          {TRIGGER_OPTIONS.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Duration & Delay */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>
            Duration (ms)
          </label>
          <input
            type="number"
            value={transition.duration}
            onChange={(e) => onUpdate({ duration: Number(e.target.value) })}
            style={{
              width: '100%',
              padding: '6px 8px',
              background: '#0d0d0e',
              border: '1px solid #333',
              borderRadius: 6,
              color: '#fff',
              fontSize: 12,
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>
            Delay (ms)
          </label>
          <input
            type="number"
            value={transition.delay}
            onChange={(e) => onUpdate({ delay: Number(e.target.value) })}
            style={{
              width: '100%',
              padding: '6px 8px',
              background: '#0d0d0e',
              border: '1px solid #333',
              borderRadius: 6,
              color: '#fff',
              fontSize: 12,
            }}
          />
        </div>
      </div>

      {/* Curve */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>
          Easing Curve
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {CURVE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => onUpdate({ curve: opt.id })}
              style={{
                padding: '4px 8px',
                background: transition.curve === opt.id ? '#2563eb' : '#0d0d0e',
                border: '1px solid #333',
                borderRadius: 4,
                color: transition.curve === opt.id ? '#fff' : '#888',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spring params (if spring curve) */}
      {transition.curve === 'spring' && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>
              Damping
            </label>
            <input
              type="number"
              step="0.1"
              value={transition.springDamping ?? 0.8}
              onChange={(e) => onUpdate({ springDamping: Number(e.target.value) })}
              style={{
                width: '100%',
                padding: '6px 8px',
                background: '#0d0d0e',
                border: '1px solid #333',
                borderRadius: 6,
                color: '#fff',
                fontSize: 12,
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>
              Response
            </label>
            <input
              type="number"
              step="0.1"
              value={transition.springResponse ?? 0.5}
              onChange={(e) => onUpdate({ springResponse: Number(e.target.value) })}
              style={{
                width: '100%',
                padding: '6px 8px',
                background: '#0d0d0e',
                border: '1px solid #333',
                borderRadius: 6,
                color: '#fff',
                fontSize: 12,
              }}
            />
          </div>
        </div>
      )}

      {/* Delete button */}
      <button
        onClick={onDelete}
        style={{
          width: '100%',
          padding: '6px 0',
          background: 'transparent',
          border: '1px solid #dc2626',
          borderRadius: 6,
          color: '#dc2626',
          fontSize: 11,
          cursor: 'pointer',
        }}
      >
        Delete Transition
      </button>
    </div>
  );
}
