import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '../../store';
import { FolmeManager } from '../../engine/folme/FolmeManager';
import { Spring } from '../../engine/folme/forces/Spring';
import './InteractionManager.css';

type Tab = 'states' | 'timeline';

const TRIGGER_OPTIONS = ['tap', 'hover', 'drag', 'scroll', 'timer', 'variable'];
const CURVE_OPTIONS = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'spring'];

export function InteractionManager() {
  const [tab, setTab] = useState<Tab>('states');
  const { 
    keyframes, 
    transitions, 
    selectedKeyframeId,
    selectedTransitionId,
    setSelectedKeyframeId,
    setSelectedTransitionId,
    updateTransition,
  } = useEditorStore();

  // Calculate node positions in a simple horizontal layout
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const spacing = 120;
    const startX = 40;
    const centerY = 60;
    
    keyframes.forEach((kf, index) => {
      positions[kf.id] = { x: startX + index * spacing, y: centerY };
    });
    return positions;
  }, [keyframes]);

  return (
    <div className="interaction-manager">
      <div className="im-tabs">
        <button 
          className={tab === 'states' ? 'active' : ''} 
          onClick={() => setTab('states')}
        >
          State Graph
        </button>
        <button 
          className={tab === 'timeline' ? 'active' : ''} 
          onClick={() => setTab('timeline')}
        >
          Timeline
        </button>
      </div>
      <div className="im-content">
        {tab === 'states' && (
          <StateGraph
            keyframes={keyframes}
            transitions={transitions}
            nodePositions={nodePositions}
            selectedKeyframeId={selectedKeyframeId}
            selectedTransitionId={selectedTransitionId}
            onSelectKeyframe={setSelectedKeyframeId}
            onSelectTransition={setSelectedTransitionId}
            onUpdateTransition={updateTransition}
          />
        )}
        {tab === 'timeline' && (
          <Timeline
            keyframes={keyframes}
            transitions={transitions}
            selectedKeyframeId={selectedKeyframeId}
          />
        )}
      </div>
    </div>
  );
}

// State Graph component
interface StateGraphProps {
  keyframes: { id: string; name: string }[];
  transitions: { id: string; from: string; to: string; trigger: string; duration: number; curve: string }[];
  nodePositions: Record<string, { x: number; y: number }>;
  selectedKeyframeId: string;
  selectedTransitionId: string | null;
  onSelectKeyframe: (id: string) => void;
  onSelectTransition: (id: string | null) => void;
  onUpdateTransition: (id: string, updates: { trigger?: string; duration?: number; curve?: string }) => void;
}

/** 单个节点 — folme 驱动 hover/selected 动画 */
function StateGraphNode({
  kf,
  pos,
  isSelected,
  nodeRadius,
  onClick,
}: {
  kf: { id: string; name: string };
  pos: { x: number; y: number };
  isSelected: boolean;
  nodeRadius: number;
  onClick: () => void;
}) {
  const circleRef = useRef<SVGCircleElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const folmeRef = useRef<FolmeManager | null>(null);

  const getFolme = useCallback(() => {
    if (!folmeRef.current) {
      folmeRef.current = new FolmeManager((vals) => {
        const circle = circleRef.current;
        const text = textRef.current;
        if (!circle || !text) return;
        // stroke color: lerp #444 → #3b82f6
        const sr = Math.round(0x44 + (0x3b - 0x44) * vals.sel);
        const sg = Math.round(0x44 + (0x82 - 0x44) * vals.sel);
        const sb = Math.round(0x44 + (0xf6 - 0x44) * vals.sel);
        circle.setAttribute('stroke', `rgb(${sr},${sg},${sb})`);
        // fill: lerp #1a1a1a → #1e3a5f
        const fr = Math.round(0x1a + (0x1e - 0x1a) * vals.sel);
        const fg = Math.round(0x1a + (0x3a - 0x1a) * vals.sel);
        const fb = Math.round(0x1a + (0x5f - 0x1a) * vals.sel);
        circle.setAttribute('fill', `rgb(${fr},${fg},${fb})`);
        // scale
        circle.setAttribute('r', String(nodeRadius * vals.scale));
        // text color: lerp #999 → #e5e5e5
        const tc = Math.round(0x99 + (0xe5 - 0x99) * vals.sel);
        text.setAttribute('fill', `rgb(${tc},${tc},${tc})`);
      });
      folmeRef.current.setTo({ sel: 0, scale: 1 });
    }
    return folmeRef.current;
  }, [nodeRadius]);

  useEffect(() => {
    const spring = new Spring(0.75, 0.25);
    getFolme().to({ sel: isSelected ? 1 : 0 }, spring);
  }, [isSelected, getFolme]);

  useEffect(() => {
    return () => { folmeRef.current?.destroy(); };
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!isSelected) {
      getFolme().to({ scale: 1.08 }, new Spring(0.7, 0.2));
    }
  }, [isSelected, getFolme]);

  const handleMouseLeave = useCallback(() => {
    getFolme().to({ scale: 1 }, new Spring(0.8, 0.25));
  }, [getFolme]);

  return (
    <g
      className="node"
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: 'pointer' }}
    >
      <circle ref={circleRef} cx={pos.x} cy={pos.y} r={nodeRadius} />
      <text ref={textRef} x={pos.x} y={pos.y + 4} textAnchor="middle">
        {kf.name.length > 8 ? kf.name.slice(0, 7) + '…' : kf.name}
      </text>
    </g>
  );
}

function StateGraph({
  keyframes,
  transitions,
  nodePositions,
  selectedKeyframeId,
  selectedTransitionId,
  onSelectKeyframe,
  onSelectTransition,
  onUpdateTransition,
}: StateGraphProps) {
  const nodeRadius = 28;
  const selectedTr = transitions.find(t => t.id === selectedTransitionId);

  return (
    <div className="state-graph-container">
      <svg className="state-graph" width="100%" height="140">
      {/* Render edges (transitions) */}
      {transitions.map((tr) => {
        const fromPos = nodePositions[tr.from];
        const toPos = nodePositions[tr.to];
        if (!fromPos || !toPos) return null;

        const isSelected = selectedTransitionId === tr.id;
        const dx = toPos.x - fromPos.x;
        const dy = toPos.y - fromPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nx = dx / dist;
        const ny = dy / dist;

        // Start and end points offset by node radius
        const x1 = fromPos.x + nx * nodeRadius;
        const y1 = fromPos.y + ny * nodeRadius;
        const x2 = toPos.x - nx * (nodeRadius + 8);
        const y2 = toPos.y - ny * (nodeRadius + 8);

        return (
          <g key={tr.id} className="edge-group">
            {/* Clickable area (wider) */}
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="transparent"
              strokeWidth={12}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectTransition(tr.id)}
            />
            {/* Visible line */}
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              className={`edge ${isSelected ? 'selected' : ''}`}
              markerEnd="url(#arrowhead)"
            />
            {/* Trigger label */}
            <text
              x={(x1 + x2) / 2}
              y={(y1 + y2) / 2 - 8}
              className="edge-label"
            >
              {tr.trigger}
            </text>
          </g>
        );
      })}

      {/* Arrow marker definition */}
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
      </defs>

      {/* Render nodes (keyframes) */}
      {keyframes.map((kf) => {
        const pos = nodePositions[kf.id];
        if (!pos) return null;
        const isSelected = selectedKeyframeId === kf.id;

        return (
          <StateGraphNode
            key={kf.id}
            kf={kf}
            pos={pos}
            isSelected={isSelected}
            nodeRadius={nodeRadius}
            onClick={() => {
              onSelectKeyframe(kf.id);
              onSelectTransition(null);
            }}
          />
        );
      })}
    </svg>
    
    {/* Inline Transition Editor */}
    {selectedTr && (
      <div className="transition-editor">
        <div className="te-field">
          <label>Trigger</label>
          <select
            value={selectedTr.trigger}
            onChange={(e) => onUpdateTransition(selectedTr.id, { trigger: e.target.value })}
          >
            {TRIGGER_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="te-field">
          <label>Duration</label>
          <input
            type="number"
            value={selectedTr.duration}
            min={0}
            step={50}
            onChange={(e) => onUpdateTransition(selectedTr.id, { duration: parseInt(e.target.value) || 0 })}
          />
          <span className="te-unit">ms</span>
        </div>
        <div className="te-field">
          <label>Curve</label>
          <select
            value={selectedTr.curve}
            onChange={(e) => onUpdateTransition(selectedTr.id, { curve: e.target.value })}
          >
            {CURVE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>
    )}
    </div>
  );
}

// Timeline component with placeholder rows
interface TimelineProps {
  keyframes: { id: string; name: string }[];
  transitions: { id: string; from: string; to: string; duration: number }[];
  selectedKeyframeId: string;
}

function Timeline({ keyframes, transitions }: TimelineProps) {
  // Create placeholder timeline rows for each keyframe
  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <div className="timeline-label-col">State</div>
        <div className="timeline-track-col">
          <div className="time-markers">
            <span>0ms</span>
            <span>100ms</span>
            <span>200ms</span>
            <span>300ms</span>
            <span>400ms</span>
          </div>
        </div>
      </div>
      <div className="timeline-rows">
        {keyframes.map((kf) => {
          // Find transitions from this keyframe
          const outgoing = transitions.filter(t => t.from === kf.id);
          
          return (
            <div key={kf.id} className="timeline-row">
              <div className="timeline-label-col">{kf.name}</div>
              <div className="timeline-track-col">
                <div className="timeline-track">
                  {/* Keyframe marker */}
                  <div className="keyframe-marker" style={{ left: 0 }} />
                  {/* Transition bars */}
                  {outgoing.map((tr) => (
                    <div
                      key={tr.id}
                      className="transition-bar"
                      style={{
                        left: 0,
                        width: `${Math.min(tr.duration / 400 * 100, 100)}%`,
                      }}
                      title={`${tr.duration}ms`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
