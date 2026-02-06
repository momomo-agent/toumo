type AlignmentLine = {
  type: 'vertical' | 'horizontal';
  position: number;
  // 用于显示间距的额外信息
  fromElement?: { x: number; y: number; width: number; height: number };
  toElement?: { x: number; y: number; width: number; height: number };
};

type DistanceIndicator = {
  type: 'horizontal' | 'vertical';
  x: number;
  y: number;
  length: number;
  distance: number;
};

interface AlignmentGuidesProps {
  lines: AlignmentLine[];
  canvasWidth: number;
  canvasHeight: number;
  distanceIndicators?: DistanceIndicator[];
}

export function AlignmentGuides({ 
  lines, 
  canvasWidth, 
  canvasHeight,
  distanceIndicators = [],
}: AlignmentGuidesProps) {
  return (
    <>
      {/* 对齐参考线 */}
      {lines.map((line, index) => (
        <div
          key={`${line.type}-${index}-${line.position}`}
          style={{
            position: 'absolute',
            background: '#f43f5e',
            pointerEvents: 'none',
            zIndex: 1000,
            ...(line.type === 'vertical'
              ? { left: line.position, top: 0, width: 1, height: canvasHeight }
              : { top: line.position, left: 0, width: canvasWidth, height: 1 }),
          }}
        />
      ))}
      
      {/* 间距指示器 */}
      {distanceIndicators.map((indicator, index) => (
        <div
          key={`distance-${index}`}
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 1001,
            ...(indicator.type === 'horizontal'
              ? {
                  left: indicator.x,
                  top: indicator.y - 0.5,
                  width: indicator.length,
                  height: 1,
                }
              : {
                  left: indicator.x - 0.5,
                  top: indicator.y,
                  width: 1,
                  height: indicator.length,
                }),
          }}
        >
          {/* 间距线 */}
          <div
            style={{
              position: 'absolute',
              background: '#f43f5e',
              ...(indicator.type === 'horizontal'
                ? { width: '100%', height: 1, top: 0 }
                : { width: 1, height: '100%', left: 0 }),
            }}
          />
          
          {/* 端点标记 */}
          {indicator.type === 'horizontal' ? (
            <>
              <div style={{
                position: 'absolute',
                left: 0,
                top: -3,
                width: 1,
                height: 7,
                background: '#f43f5e',
              }} />
              <div style={{
                position: 'absolute',
                right: 0,
                top: -3,
                width: 1,
                height: 7,
                background: '#f43f5e',
              }} />
            </>
          ) : (
            <>
              <div style={{
                position: 'absolute',
                top: 0,
                left: -3,
                width: 7,
                height: 1,
                background: '#f43f5e',
              }} />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: -3,
                width: 7,
                height: 1,
                background: '#f43f5e',
              }} />
            </>
          )}
          
          {/* 间距数值标签 */}
          {indicator.distance > 0 && (
            <div
              style={{
                position: 'absolute',
                ...(indicator.type === 'horizontal'
                  ? {
                      left: '50%',
                      top: -18,
                      transform: 'translateX(-50%)',
                    }
                  : {
                      top: '50%',
                      left: 6,
                      transform: 'translateY(-50%)',
                    }),
                background: '#f43f5e',
                color: '#fff',
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 4px',
                borderRadius: 3,
                whiteSpace: 'nowrap',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {Math.round(indicator.distance)}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export type { AlignmentLine, DistanceIndicator };
