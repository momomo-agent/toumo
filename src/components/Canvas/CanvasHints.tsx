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
        <h3 className="canvas-hints-title">开始创作</h3>
        <p className="canvas-hints-subtitle">使用快捷键或从工具栏拖拽来创建元素</p>
        <div className="canvas-hints-shortcuts">
          <div className="hint-item">
            <kbd>R</kbd>
            <span>矩形</span>
          </div>
          <div className="hint-item">
            <kbd>O</kbd>
            <span>圆形</span>
          </div>
          <div className="hint-item">
            <kbd>T</kbd>
            <span>文字</span>
          </div>
          <div className="hint-item">
            <kbd>F</kbd>
            <span>画框</span>
          </div>
        </div>
        <div className="canvas-hints-divider" />
        <p className="canvas-hints-tip">
          💡 提示：在画布上拖拽即可绘制，双击文字可编辑
        </p>
      </div>
    </div>
  );
}
