interface RulerProps {
  direction: 'horizontal' | 'vertical';
  size: number;
  offset: number;
  scale: number;
}

export function Ruler({ direction, size, offset, scale }: RulerProps) {
  const isHorizontal = direction === 'horizontal';
  const tickInterval = scale > 0.5 ? 50 : 100;
  const ticks: number[] = [];
  
  const start = Math.floor(-offset / scale / tickInterval) * tickInterval;
  const end = Math.ceil((size - offset) / scale / tickInterval) * tickInterval;
  
  for (let i = start; i <= end; i += tickInterval) {
    ticks.push(i);
  }

  return (
    <div style={{
      position: 'absolute',
      background: '#1a1a1a',
      [isHorizontal ? 'left' : 'top']: 20,
      [isHorizontal ? 'top' : 'left']: 0,
      [isHorizontal ? 'width' : 'height']: size - 20,
      [isHorizontal ? 'height' : 'width']: 20,
      overflow: 'hidden',
      fontSize: 9,
      color: '#666',
      zIndex: 10,
    }}>
      {ticks.map(tick => {
        const pos = tick * scale + offset;
        if (pos < 0 || pos > size) return null;
        return (
          <div key={tick} style={{
            position: 'absolute',
            [isHorizontal ? 'left' : 'top']: pos - 20,
            [isHorizontal ? 'bottom' : 'right']: 0,
          }}>
            <span style={{ 
              display: 'block',
              [isHorizontal ? 'marginLeft' : 'marginTop']: 2,
            }}>{tick}</span>
          </div>
        );
      })}
    </div>
  );
}
