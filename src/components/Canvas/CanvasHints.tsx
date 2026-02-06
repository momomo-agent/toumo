import { useEditorStore } from '../../store';
import './CanvasHints.css';

export function CanvasHints() {
  const { keyframes, selectedKeyframeId } = useEditorStore();
  
  const currentKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const elements = currentKeyframe?.keyElements || [];
  
  // Only show hints when canvas is empty
  if (elements.length > 0) {
    return null;
  }

  return (
    <div className="canvas-hints">
      <div className="canvas-hints-content">
        <div className="canvas-hints-icon">✨</div>
        <h3 className="canvas-hints-title">Start Creating</h3>
        <div className="canvas-hints-shortcuts">
          <div className="hint-item">
            <kbd>R</kbd>
            <span>Rectangle</span>
          </div>
          <div className="hint-item">
            <kbd>O</kbd>
            <span>Ellipse</span>
          </div>
          <div className="hint-item">
            <kbd>T</kbd>
            <span>Text</span>
          </div>
          <div className="hint-item">
            <kbd>F</kbd>
            <span>Frame</span>
          </div>
        </div>
        <p className="canvas-hints-tip">
          Or drag from the toolbar to create shapes
        </p>
      </div>
    </div>
  );
}
