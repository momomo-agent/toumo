import { useState, useMemo } from 'react';
import { useEditorStore } from '../../store';
import './InteractionManager.css';

type Tab = 'states' | 'timeline';

export function InteractionManager() {
  const [tab, setTab] = useState<Tab>('states');
  const { 
    keyframes, 
    transitions, 
    selectedKeyframeId,
    selectedTransitionId,
    setSelectedKeyframeId,
    setSelectedTransitionId,
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
  transitions: { id: string; from: string; to: string; trigger: string }[];
  nodePositions: Record<string, { x: number; y: number }>;
  selectedKeyframeId: string;
  selectedTransitionId: string | null;
  onSelectKeyframe: (id: string) => void;
  onSelectTransition: (id: string | null) => void;
}

function StateGraph({
  keyframes,
  transitions,
  nodePositions,
  selectedKeyframeId,
  selectedTransitionId,
  onSelectKeyframe,
  onSelectTransition,
}: StateGraphProps) {
  const nodeRadius = 28;

  return (
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
          <g
            key={kf.id}
            className={`node ${isSelected ? 'selected' : ''}`}
            onClick={() => {
              onSelectKeyframe(kf.id);
              onSelectTransition(null);
            }}
            style={{ cursor: 'pointer' }}
          >
            <circle cx={pos.x} cy={pos.y} r={nodeRadius} />
            <text x={pos.x} y={pos.y + 4} textAnchor="middle">
              {kf.name.length > 8 ? kf.name.slice(0, 7) + '…' : kf.name}
            </text>
          </g>
        );
      })}
    </svg>
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
