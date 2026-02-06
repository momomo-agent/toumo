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
