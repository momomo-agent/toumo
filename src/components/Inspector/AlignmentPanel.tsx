import { useEditorStore } from '../../store';
import './AlignmentPanel.css';

// Alignment icons
const AlignLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="2" height="12" fill="currentColor" />
    <rect x="5" y="4" width="8" height="3" fill="currentColor" opacity="0.6" />
    <rect x="5" y="9" width="5" height="3" fill="currentColor" opacity="0.6" />
  </svg>
);

const AlignCenterHIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="7" y="2" width="2" height="12" fill="currentColor" />
    <rect x="3" y="4" width="10" height="3" fill="currentColor" opacity="0.6" />
    <rect x="5" y="9" width="6" height="3" fill="currentColor" opacity="0.6" />
  </svg>
);

const AlignRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="12" y="2" width="2" height="12" fill="currentColor" />
    <rect x="3" y="4" width="8" height="3" fill="currentColor" opacity="0.6" />
    <rect x="6" y="9" width="5" height="3" fill="currentColor" opacity="0.6" />
  </svg>
);

const AlignTopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="12" height="2" fill="currentColor" />
    <rect x="4" y="5" width="3" height="8" fill="currentColor" opacity="0.6" />
    <rect x="9" y="5" width="3" height="5" fill="currentColor" opacity="0.6" />
  </svg>
);

const AlignCenterVIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="7" width="12" height="2" fill="currentColor" />
    <rect x="4" y="3" width="3" height="10" fill="currentColor" opacity="0.6" />
    <rect x="9" y="5" width="3" height="6" fill="currentColor" opacity="0.6" />
  </svg>
);

const AlignBottomIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="12" width="12" height="2" fill="currentColor" />
    <rect x="4" y="3" width="3" height="8" fill="currentColor" opacity="0.6" />
    <rect x="9" y="6" width="3" height="5" fill="currentColor" opacity="0.6" />
  </svg>
);

const DistributeHIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="1.5" height="12" fill="currentColor" />
    <rect x="12.5" y="2" width="1.5" height="12" fill="currentColor" />
    <rect x="5" y="4" width="2" height="8" fill="currentColor" opacity="0.6" />
    <rect x="9" y="4" width="2" height="8" fill="currentColor" opacity="0.6" />
  </svg>
);

const DistributeVIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="12" height="1.5" fill="currentColor" />
    <rect x="2" y="12.5" width="12" height="1.5" fill="currentColor" />
    <rect x="4" y="5" width="8" height="2" fill="currentColor" opacity="0.6" />
    <rect x="4" y="9" width="8" height="2" fill="currentColor" opacity="0.6" />
  </svg>
);

export function AlignmentPanel() {
  const { selectedElementIds, alignElements, distributeElements } = useEditorStore();
  
  const hasMultipleSelected = selectedElementIds.length >= 2;
  const canDistribute = selectedElementIds.length >= 3;

  return (
    <div className="alignment-panel">
      <div className="alignment-section">
        <div className="alignment-label">Align</div>
        <div className="alignment-buttons">
          <button
            className="alignment-btn"
            onClick={() => alignElements('left')}
            disabled={!hasMultipleSelected}
            title="Align left"
          >
            <AlignLeftIcon />
          </button>
          <button
            className="alignment-btn"
            onClick={() => alignElements('center')}
            disabled={!hasMultipleSelected}
            title="Align center horizontally"
          >
            <AlignCenterHIcon />
          </button>
          <button
            className="alignment-btn"
            onClick={() => alignElements('right')}
            disabled={!hasMultipleSelected}
            title="Align right"
          >
            <AlignRightIcon />
          </button>
          <button
            className="alignment-btn"
            onClick={() => alignElements('top')}
            disabled={!hasMultipleSelected}
            title="Align top"
          >
            <AlignTopIcon />
          </button>
          <button
            className="alignment-btn"
            onClick={() => alignElements('middle')}
            disabled={!hasMultipleSelected}
            title="Align center vertically"
          >
            <AlignCenterVIcon />
          </button>
          <button
            className="alignment-btn"
            onClick={() => alignElements('bottom')}
            disabled={!hasMultipleSelected}
            title="Align bottom"
          >
            <AlignBottomIcon />
          </button>
        </div>
      </div>
      
      <div className="alignment-section">
        <div className="alignment-label">Distribute</div>
        <div className="alignment-buttons distribute-buttons">
          <button
            className="alignment-btn"
            onClick={() => distributeElements('horizontal')}
            disabled={!canDistribute}
            title="Distribute horizontally (3+ elements)"
          >
            <DistributeHIcon />
          </button>
          <button
            className="alignment-btn"
            onClick={() => distributeElements('vertical')}
            disabled={!canDistribute}
            title="Distribute vertically (3+ elements)"
          >
            <DistributeVIcon />
          </button>
        </div>
      </div>
      
      {!hasMultipleSelected && (
        <div className="alignment-hint">
          Select 2+ elements to align
        </div>
      )}
    </div>
  );
}
