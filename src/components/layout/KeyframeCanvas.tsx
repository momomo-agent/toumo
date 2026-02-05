import { ReactNode } from 'react';
import './KeyframeCanvas.css';

interface Keyframe {
  id: string;
  name: string;
}

interface KeyframeCanvasProps {
  keyframes: Keyframe[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  renderKeyframe: (kf: Keyframe) => ReactNode;
}

export function KeyframeCanvas({
  keyframes,
  selectedId,
  onSelect,
  onAdd,
  renderKeyframe,
}: KeyframeCanvasProps) {
  return (
    <div className="keyframe-canvas">
      {/* 关键帧横向排列区域 */}
      <div className="keyframe-scroll">
        <div className="keyframe-track">
          {keyframes.map((kf) => (
            <div
              key={kf.id}
              className={`keyframe-panel ${kf.id === selectedId ? 'selected' : ''}`}
              onClick={() => onSelect(kf.id)}
            >
              <div className="keyframe-header">
                <span className="keyframe-name">{kf.name}</span>
              </div>
              <div className="keyframe-content">
                {renderKeyframe(kf)}
              </div>
            </div>
          ))}
          
          {/* 添加关键帧按钮 */}
          <button className="keyframe-add" onClick={onAdd}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Keyframe</span>
          </button>
        </div>
      </div>
    </div>
  );
}
