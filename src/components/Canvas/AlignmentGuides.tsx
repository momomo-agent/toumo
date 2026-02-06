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

const GUIDE_COLOR = '#ff3366';
const GUIDE_COLOR_SOFT = 'rgba(255, 51, 102, 0.5)';
const DISTANCE_BG = '#ff3366';

export function AlignmentGuides({ 
  lines, 
  canvasWidth, 
  canvasHeight,
  distanceIndicators = [],
}: AlignmentGuidesProps) {
  // Deduplicate lines by type+position
  const uniqueLines = lines.filter((line, i, arr) =>
    arr.findIndex(l => l.type === line.type && Math.abs(l.position - line.position) < 0.5) === i
  );

  return (
    <>
      {/* 对齐参考线 — dashed style with soft glow */}
      {uniqueLines.map((line, index) => (
        <div
          key={`${line.type}-${index}-${line.position}`}
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 1000,
            ...(line.type === 'vertical'
              ? {
                  left: line.position - 0.5,
                  top: 0,
                  width: 0,
                  height: canvasHeight,
                  borderLeft: `1px dashed ${GUIDE_COLOR}`,
                  filter: `drop-shadow(0 0 2px ${GUIDE_COLOR_SOFT})`,
                }
              : {
                  top: line.position - 0.5,
                  left: 0,
                  width: canvasWidth,
                  height: 0,
                  borderTop: `1px dashed ${GUIDE_COLOR}`,
                  filter: `drop-shadow(0 0 2px ${GUIDE_COLOR_SOFT})`,
                }),
          }}
        />
      ))}
      
      {/* 间距指示器 — polished with arrow endpoints + pill labels */}
      {distanceIndicators.map((indicator, index) => {
        const isH = indicator.type === 'horizontal';
        return (
          <div
            key={`distance-${index}`}
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              zIndex: 1001,
              ...(isH
                ? { left: indicator.x, top: indicator.y - 0.5, width: indicator.length, height: 1 }
                : { left: indicator.x - 0.5, top: indicator.y, width: 1, height: indicator.length }),
            }}
          >
            {/* Main distance line */}
            <div style={{
              position: 'absolute',
              background: GUIDE_COLOR,
              ...(isH
                ? { width: '100%', height: 1, top: 0 }
                : { width: 1, height: '100%', left: 0 }),
            }} />

            {/* Arrow-style endpoint caps */}
            {isH ? (<>
              <div style={{ position: 'absolute', left: 0, top: -4, width: 1, height: 9, background: GUIDE_COLOR }} />
              <div style={{ position: 'absolute', right: 0, top: -4, width: 1, height: 9, background: GUIDE_COLOR }} />
            </>) : (<>
              <div style={{ position: 'absolute', top: 0, left: -4, width: 9, height: 1, background: GUIDE_COLOR }} />
              <div style={{ position: 'absolute', bottom: 0, left: -4, width: 9, height: 1, background: GUIDE_COLOR }} />
            </>)}

            {/* Distance pill label */}
            {indicator.distance > 0 && (
              <div style={{
                position: 'absolute',
                ...(isH
                  ? { left: '50%', top: -20, transform: 'translateX(-50%)' }
                  : { top: '50%', left: 8, transform: 'translateY(-50%)' }),
                background: DISTANCE_BG,
                color: '#fff',
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 10,
                whiteSpace: 'nowrap',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                boxShadow: `0 1px 4px ${GUIDE_COLOR_SOFT}`,
                letterSpacing: 0.3,
              }}>
                {Math.round(indicator.distance)}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export type { AlignmentLine, DistanceIndicator };
