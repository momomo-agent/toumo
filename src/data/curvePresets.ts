// Curve Presets Library for Motion Designers
// Organized by category with preview-friendly data

export type EasingPreset = {
  id: string;
  label: string;
  category: 'basic' | 'material' | 'ios' | 'expressive';
  bezier: [number, number, number, number];
  description: string;
};

export type SpringPreset = {
  id: string;
  label: string;
  damping: number;
  response: number;
  mass: number;
  stiffness: number;
  description: string;
};

// ── Basic Easing Presets ──────────────────────────────
export const EASING_PRESETS: EasingPreset[] = [
  // Basic
  { id: 'linear', label: 'Linear', category: 'basic', bezier: [0, 0, 1, 1], description: 'Constant speed' },
  { id: 'ease', label: 'Ease', category: 'basic', bezier: [0.25, 0.1, 0.25, 1], description: 'Gentle start and end' },
  { id: 'ease-in', label: 'Ease In', category: 'basic', bezier: [0.42, 0, 1, 1], description: 'Slow start, fast end' },
  { id: 'ease-out', label: 'Ease Out', category: 'basic', bezier: [0, 0, 0.58, 1], description: 'Fast start, slow end' },
  { id: 'ease-in-out', label: 'Ease In Out', category: 'basic', bezier: [0.42, 0, 0.58, 1], description: 'Slow start and end' },

  // Material Design
  { id: 'material-standard', label: 'Standard', category: 'material', bezier: [0.2, 0, 0, 1], description: 'Material 3 standard' },
  { id: 'material-decelerate', label: 'Decelerate', category: 'material', bezier: [0, 0, 0, 1], description: 'Material 3 decelerate' },
  { id: 'material-accelerate', label: 'Accelerate', category: 'material', bezier: [0.3, 0, 1, 1], description: 'Material 3 accelerate' },
  { id: 'material-emphasized', label: 'Emphasized', category: 'material', bezier: [0.2, 0, 0, 1], description: 'Material 3 emphasized' },

  // iOS / Apple
  { id: 'ios-default', label: 'Default', category: 'ios', bezier: [0.25, 0.1, 0.25, 1], description: 'iOS default animation' },
  { id: 'ios-spring', label: 'Spring', category: 'ios', bezier: [0.5, 1.8, 0.4, 0.8], description: 'iOS spring-like' },
  { id: 'ios-keyboard', label: 'Keyboard', category: 'ios', bezier: [0.17, 0.59, 0.4, 0.77], description: 'iOS keyboard slide' },

  // Expressive
  { id: 'overshoot', label: 'Overshoot', category: 'expressive', bezier: [0.34, 1.56, 0.64, 1], description: 'Goes past target then settles' },
  { id: 'anticipate', label: 'Anticipate', category: 'expressive', bezier: [0.36, -0.2, 0.7, -0.05], description: 'Pulls back before moving' },
  { id: 'snap', label: 'Snap', category: 'expressive', bezier: [0.1, 0.9, 0.2, 1], description: 'Quick snap into place' },
  { id: 'smooth-out', label: 'Smooth Out', category: 'expressive', bezier: [0.0, 0.0, 0.2, 1], description: 'Very smooth deceleration' },
  { id: 'power-in', label: 'Power In', category: 'expressive', bezier: [0.7, 0, 1, 1], description: 'Strong acceleration' },
];

// ── Spring Presets ────────────────────────────────────
export const SPRING_PRESETS: SpringPreset[] = [
  { id: 'gentle', label: 'Gentle', damping: 1.0, response: 0.8, mass: 1, stiffness: 120, description: 'Soft, no bounce' },
  { id: 'bouncy', label: 'Bouncy', damping: 0.4, response: 0.6, mass: 1, stiffness: 180, description: 'Playful bounce' },
  { id: 'snappy', label: 'Snappy', damping: 0.9, response: 0.3, mass: 0.8, stiffness: 300, description: 'Quick and crisp' },
  { id: 'stiff', label: 'Stiff', damping: 1.2, response: 0.2, mass: 1, stiffness: 400, description: 'Rigid, minimal motion' },
  { id: 'wobbly', label: 'Wobbly', damping: 0.3, response: 0.7, mass: 1.5, stiffness: 150, description: 'Loose and wobbly' },
  { id: 'slow', label: 'Slow', damping: 1.0, response: 1.2, mass: 2, stiffness: 80, description: 'Heavy, slow settle' },
];

// ── Category Labels ───────────────────────────────────
export const EASING_CATEGORIES: Record<EasingPreset['category'], string> = {
  basic: 'Basic',
  material: 'Material 3',
  ios: 'iOS / Apple',
  expressive: 'Expressive',
};

// ── Utility: compute bezier value at t ────────────────
export function cubicBezierAt(t: number, p1x: number, p1y: number, p2x: number, p2y: number): number {
  // Newton-Raphson to find t for given x, then compute y
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;

  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  function sampleX(tt: number) { return ((ax * tt + bx) * tt + cx) * tt; }
  function sampleY(tt: number) { return ((ay * tt + by) * tt + cy) * tt; }
  function sampleDerivX(tt: number) { return (3 * ax * tt + 2 * bx) * tt + cx; }

  // Newton-Raphson iteration
  let guessT = t;
  for (let i = 0; i < 8; i++) {
    const currentX = sampleX(guessT) - t;
    if (Math.abs(currentX) < 1e-7) break;
    const deriv = sampleDerivX(guessT);
    if (Math.abs(deriv) < 1e-7) break;
    guessT -= currentX / deriv;
  }

  return sampleY(Math.max(0, Math.min(1, guessT)));
}

// ── Utility: generate SVG path for a bezier curve ─────
export function bezierToSvgPath(
  bezier: [number, number, number, number],
  width: number,
  height: number,
  padding = 0,
): string {
  const [x1, y1, x2, y2] = bezier;
  const sx = (v: number) => padding + v * width;
  const sy = (v: number) => padding + (1 - v) * height;
  return `M${sx(0)},${sy(0)} C${sx(x1)},${sy(y1)} ${sx(x2)},${sy(y2)} ${sx(1)},${sy(1)}`;
}

// ── Real Spring Physics Solver (RK4 integration) ──────
/**
 * Solve spring ODE: m*x'' + c*x' + k*(x - target) = 0
 * Uses 4th-order Runge-Kutta for accuracy.
 * Returns position at normalized time t ∈ [0, 1].
 */
export function solveSpringRK4(
  t: number,
  mass: number,
  stiffness: number,
  damping: number,
  from = 0,
  to = 1,
): number {
  if (t <= 0) return from;
  if (t >= 1) return to;

  // Simulate for ~2 seconds of physical time mapped to t ∈ [0,1]
  const totalTime = 2.0;
  const physTime = t * totalTime;
  const dt = 1 / 240; // 240 Hz simulation
  const steps = Math.ceil(physTime / dt);

  let x = 0; // displacement from target (starts at -1, target = 0)
  let v = 0; // velocity

  // We model: position starts at `from`, target is `to`
  // Normalized: x=0 means at `from`, x=1 means at `to`
  // Spring pulls toward x=1

  const accel = (pos: number, vel: number) => {
    const springF = -stiffness * (pos - 1); // pull toward 1
    const dampF = -damping * vel;
    return (springF + dampF) / mass;
  };

  for (let i = 0; i < steps; i++) {
    // RK4
    const k1v = accel(x, v);
    const k1x = v;

    const k2v = accel(x + k1x * dt * 0.5, v + k1v * dt * 0.5);
    const k2x = v + k1v * dt * 0.5;

    const k3v = accel(x + k2x * dt * 0.5, v + k2v * dt * 0.5);
    const k3x = v + k2v * dt * 0.5;

    const k4v = accel(x + k3x * dt, v + k3v * dt);
    const k4x = v + k3v * dt;

    x += (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    v += (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
  }

  return from + x * (to - from);
}

/**
 * Generate an array of spring curve sample points for SVG rendering.
 * Returns array of { t, value } where t ∈ [0,1] and value is the spring output.
 */
export function generateSpringCurve(
  mass: number,
  stiffness: number,
  damping: number,
  samples = 100,
): { t: number; value: number }[] {
  const points: { t: number; value: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const value = solveSpringRK4(t, mass, stiffness, damping);
    points.push({ t, value });
  }
  return points;
}

/**
 * Convert spring curve points to an SVG polyline path string.
 */
export function springCurveToSvgPath(
  mass: number,
  stiffness: number,
  damping: number,
  width: number,
  height: number,
  padding = 0,
  samples = 100,
): string {
  const points = generateSpringCurve(mass, stiffness, damping, samples);
  // Find min/max for vertical scaling (spring can overshoot)
  let minV = 0, maxV = 1;
  for (const p of points) {
    if (p.value < minV) minV = p.value;
    if (p.value > maxV) maxV = p.value;
  }
  const range = Math.max(maxV - minV, 0.01);
  const margin = range * 0.1;
  const vMin = minV - margin;
  const vMax = maxV + margin;

  const sx = (t: number) => padding + t * width;
  const sy = (v: number) => padding + (1 - (v - vMin) / (vMax - vMin)) * height;

  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.t).toFixed(1)},${sy(p.value).toFixed(1)}`)
    .join(' ');
}

/**
 * Estimate how long (in normalized t) a spring takes to settle within threshold.
 */
export function springSettleTime(
  mass: number,
  stiffness: number,
  damping: number,
  threshold = 0.001,
): number {
  const points = generateSpringCurve(mass, stiffness, damping, 200);
  for (let i = points.length - 1; i >= 0; i--) {
    if (Math.abs(points[i].value - 1) > threshold) {
      return Math.min(1, (i + 1) / 200);
    }
  }
  return 0;
}
