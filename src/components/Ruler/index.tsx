import { useEditorStore } from '../../store';

export function HorizontalRuler() {
  const { canvasScale, canvasOffset, frameSize } = useEditorStore();
  const ticks = [];
  const step = 50;
  
  for (let i = 0; i <= frameSize.width; i += step) {
    ticks.push(
      <div key={i} style={{ position: 'absolute', left: i * canvasScale + canvasOffset.x, fontSize: 9, color: '#666' }}>
        {i}
      </div>
    );
  }
  
  return (
    <div style={{ position: 'absolute', top: 0, left: 240, right: 280, height: 20, background: '#1a1a1a', borderBottom: '1px solid #333', overflow: 'hidden' }}>
      {ticks}
    </div>
  );
}

export function VerticalRuler() {
  const { canvasScale, canvasOffset, frameSize } = useEditorStore();
  const ticks = [];
  const step = 50;
  
  for (let i = 0; i <= frameSize.height; i += step) {
    ticks.push(
      <div key={i} style={{ position: 'absolute', top: i * canvasScale + canvasOffset.y, fontSize: 9, color: '#666', transform: 'rotate(-90deg)', transformOrigin: 'left top' }}>
        {i}
      </div>
    );
  }
  
  return (
    <div style={{ position: 'absolute', top: 60, left: 240, width: 20, bottom: 0, background: '#1a1a1a', borderRight: '1px solid #333', overflow: 'hidden' }}>
      {ticks}
    </div>
  );
}
