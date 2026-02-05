import { useRef, useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '../../store';
import type { Transition } from '../../types';

interface NodePosition {
  id: string;
  x: number;
  y: number;
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

  const {
    keyframes,
    transitions,
    selectedKeyframeId,
    selectedTransitionId,
    setSelectedKeyframeId,
    setSelectedTransitionId,
    updateTransition,
    deleteTransition,
  } = useEditorStore();

  // Initialize node positions
  useEffect(() => {
    if (nodePositions.length === 0 && keyframes.length > 0) {
      const positions = keyframes.map((kf, index) => ({
        id: kf.id,
        x: 80 + index * 160,
        y: 60 + (index % 2) * 40,
      }));
      setNodePositions(positions);
    }
  }, [keyframes, nodePositions.length]);

  // Add new nodes when keyframes are added
  useEffect(() => {
    const existingIds = new Set(nodePositions.map(n => n.id));
    const newKeyframes = keyframes.filter(kf => !existingIds.has(kf.id));
    if (newKeyframes.length > 0) {
      setNodePositions(prev => [
        ...prev,
        ...newKeyframes.map((kf, i) => ({
          id: kf.id,
          x: 80 + (prev.length + i) * 160,
          y: 60,
        })),
      ]);
    }
  }, [keyframes, nodePositions]);

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

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingNode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(40, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - 100));
    const y = Math.max(20, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 40));
    setNodePositions(prev =>
      prev.map(n => (n.id === draggingNode ? { ...n, x, y } : n))
    );
  }, [draggingNode, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
  }, []);

  useEffect(() => {
    if (draggingNode) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingNode, handleMouseMove, handleMouseUp]);

  const handleNodeClick = (e: React.MouseEvent, kfId: string) => {
    e.stopPropagation();
    setSelectedKeyframeId(kfId);
    setSelectedTransitionId(null);
  };

  const handleTransitionClick = (e: React.MouseEvent, trId: string) => {
    e.stopPropagation();
    setSelectedTransitionId(trId);
  };

  const handleBackgroundClick = () => {
    setSelectedTransitionId(null);
  };

  const selectedTransition = transitions.find(t => t.id === selectedTransitionId);

  // Calculate edge path with curve
  const getEdgePath = (from: NodePosition, to: NodePosition) => {
    const dx = to.x - from.x;
    const cx1 = from.x + dx * 0.4;
    const cy1 = from.y;
    const cx2 = from.x + dx * 0.6;
    const cy2 = to.y;
    return `M ${from.x + 60} ${from.y + 16} C ${cx1 + 60} ${cy1 + 16}, ${cx2} ${cy2 + 16}, ${to.x} ${to.y + 16}`;
  };

  // Get midpoint for transition label
  const getEdgeMidpoint = (from: NodePosition, to: NodePosition) => {
    return {
      x: (from.x + 60 + to.x) / 2,
      y: (from.y + to.y) / 2 + 16,
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
        borderRadius: 8,
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
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
          </marker>
          <marker
            id="arrowhead-selected"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#2563eb" />
          </marker>
        </defs>
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
                stroke={isSelected ? '#2563eb' : '#444'}
                strokeWidth={isSelected ? 2.5 : 2}
                markerEnd={isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'}
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                onClick={(e) => handleTransitionClick(e, tr.id)}
              />
              {/* Clickable hit area */}
              <path
                d={getEdgePath(fromPos, toPos)}
                fill="none"
                stroke="transparent"
                strokeWidth={16}
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                onClick={(e) => handleTransitionClick(e, tr.id)}
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
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              width: 120,
              padding: '8px 12px',
              background: isSelected ? '#1e3a5f' : '#1a1a1b',
              border: `2px solid ${isSelected ? '#2563eb' : '#333'}`,
              borderRadius: 8,
              cursor: draggingNode === kf.id ? 'grabbing' : 'grab',
              userSelect: 'none',
              zIndex: isSelected ? 10 : 1,
            }}
          >
            {isInitial && (
              <div
                style={{
                  position: 'absolute',
                  top: -8,
                  left: 8,
                  background: '#22c55e',
                  color: '#000',
                  fontSize: 9,
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontWeight: 600,
                }}
              >
                START
              </div>
            )}
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
              {kf.name}
            </div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
              {kf.functionalState || 'state'}
            </div>
          </div>
        );
      })}

      {/* Inline transition editor */}
      {selectedTransition && (
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

      {/* Add transition hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          fontSize: 11,
          color: '#555',
        }}
      >
        Drag nodes to reposition • Click edge to edit transition
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
