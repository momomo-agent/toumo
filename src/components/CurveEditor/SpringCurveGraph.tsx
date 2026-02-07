import { useMemo } from 'react';
import { generateSpringCurve } from '../../data/curvePresets';

interface Props {
  mass: number;
  stiffness: number;
  damping: number;
  width?: number;
  height?: number;
}

/**
 * SVG-based spring curve visualization.
 * Shows the spring response curve with overshoot/oscillation.
 */
export function SpringCurveGraph({
  mass,
  stiffness,
  damping,
  width = 220,
  height = 100,
}: Props) {
  const pad = 12;
  const gw = width - pad * 2;
  const gh = height - pad * 2;

  const { path, overshoot, settleT, minV, maxV } = useMemo(() => {
    const pts = generateSpringCurve(mass, stiffness, damping, 120);

    let mn = 0, mx = 1;
    for (const p of pts) {
      if (p.value < mn) mn = p.value;
      if (p.value > mx) mx = p.value;
    }
    const margin = Math.max((mx - mn) * 0.08, 0.02);
    const vMin = mn - margin;
    const vMax = mx + margin;
    const range = vMax - vMin;

    const sx = (t: number) => pad + t * gw;
    const sy = (v: number) => pad + (1 - (v - vMin) / range) * gh;

    const d = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.t).toFixed(1)},${sy(p.value).toFixed(1)}`)
      .join(' ');

    // Find settle time (last point > threshold from 1.0)
    let sT = 1;
    for (let i = pts.length - 1; i >= 0; i--) {
      if (Math.abs(pts[i].value - 1) > 0.005) {
        sT = Math.min(1, (i + 1) / pts.length);
        break;
      }
    }

    return {
      path: d,
      overshoot: Math.max(0, mx - 1),
      settleT: sT,
      minV: vMin,
      maxV: vMax,
    };
  }, [mass, stiffness, damping, gw, gh]);

  const range = maxV - minV;
  const sy = (v: number) => pad + (1 - (v - minV) / range) * gh;
  const targetY = sy(1);
  const zeroY = sy(0);

  return (
    <div style={{ position: 'relative' }}>
      <svg width={width} height={height} style={{
        display: 'block',
        borderRadius: 6,
        background: '#111112',
        border: '1px solid #2a2a2a',
      }}>
        {/* Grid lines */}
        <line x1={pad} y1={targetY} x2={pad + gw} y2={targetY}
          stroke="#2563eb" strokeWidth={0.5} strokeDasharray="3,3" opacity={0.4} />
        <line x1={pad} y1={zeroY} x2={pad + gw} y2={zeroY}
          stroke="#666" strokeWidth={0.5} strokeDasharray="2,4" opacity={0.3} />

        {/* Settle time marker */}
        {settleT < 0.98 && (
          <line
            x1={pad + settleT * gw} y1={pad}
            x2={pad + settleT * gw} y2={pad + gh}
            stroke="#22c55e" strokeWidth={0.5} strokeDasharray="2,3" opacity={0.4}
          />
        )}

        {/* Spring curve */}
        <path d={path} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" />

        {/* Start dot */}
        <circle cx={pad} cy={zeroY} r={3} fill="#666" />
        {/* End dot */}
        <circle cx={pad + gw} cy={targetY} r={3} fill="#3b82f6" />

        {/* Labels */}
        <text x={pad + 2} y={targetY - 4} fontSize={8} fill="#2563eb" opacity={0.6}>1.0</text>
        <text x={pad + 2} y={zeroY - 4} fontSize={8} fill="#666" opacity={0.5}>0.0</text>
      </svg>

      {/* Info badges */}
      <div style={{
        display: 'flex', gap: 6, marginTop: 6,
        justifyContent: 'center',
      }}>
        {overshoot > 0.01 && (
          <span style={badgeStyle}>
            ↗ {(overshoot * 100).toFixed(0)}% overshoot
          </span>
        )}
        <span style={{ ...badgeStyle, borderColor: '#22c55e40', color: '#22c55e' }}>
          ⏱ {(settleT * 100).toFixed(0)}% settle
        </span>
      </div>
    </div>
  );
}

const badgeStyle: React.CSSProperties = {
  fontSize: 9,
  padding: '2px 6px',
  borderRadius: 4,
  border: '1px solid #2563eb30',
  color: '#60a5fa',
  background: '#0d0d0e',
};

export default SpringCurveGraph;
