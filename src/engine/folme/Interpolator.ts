/**
 * Interpolator — 缓动函数集合
 * 移植自 kenefe 的 Interpolator.as + Bezier.as
 */

// ─── Bezier (from Bezier.as) ──────────────────────────────────────────
// https://github.com/gre/bezier-easing — MIT License

const NEWTON_ITERATIONS = 4;
const NEWTON_MIN_SLOPE = 0.001;
const SUBDIVISION_PRECISION = 0.0000001;
const SUBDIVISION_MAX_ITERATIONS = 10;
const kSplineTableSize = 11;
const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

function A(aA1: number, aA2: number) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
function B(aA1: number, aA2: number) { return 3.0 * aA2 - 6.0 * aA1; }
function C(aA1: number) { return 3.0 * aA1; }

function calcBezier(aT: number, aA1: number, aA2: number) {
  return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
}

function getSlope(aT: number, aA1: number, aA2: number) {
  return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
}

function binarySubdivide(aX: number, aA: number, aB: number, mX1: number, mX2: number) {
  let currentX: number, currentT: number, i = 0;
  do {
    currentT = aA + (aB - aA) / 2.0;
    currentX = calcBezier(currentT, mX1, mX2) - aX;
    if (currentX > 0.0) aB = currentT;
    else aA = currentT;
  } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
  return currentT!;
}

function newtonRaphsonIterate(aX: number, aGuessT: number, mX1: number, mX2: number) {
  for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
    const currentSlope = getSlope(aGuessT, mX1, mX2);
    if (currentSlope === 0.0) return aGuessT;
    const currentX = calcBezier(aGuessT, mX1, mX2) - aX;
    aGuessT -= currentX / currentSlope;
  }
  return aGuessT;
}

export function bezierEasing(mX1: number, mY1: number, mX2: number, mY2: number): (x: number) => number {
  if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
    throw new Error('bezier x values must be in [0, 1] range');
  }
  if (mX1 === mY1 && mX2 === mY2) return (x) => x;

  const sampleValues = new Float64Array(kSplineTableSize);
  for (let i = 0; i < kSplineTableSize; ++i) {
    sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
  }

  function getTForX(aX: number) {
    let intervalStart = 0.0;
    let currentSample = 1;
    const lastSample = kSplineTableSize - 1;
    for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
      intervalStart += kSampleStepSize;
    }
    --currentSample;

    const dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
    const guessForT = intervalStart + dist * kSampleStepSize;
    const initialSlope = getSlope(guessForT, mX1, mX2);

    if (initialSlope >= NEWTON_MIN_SLOPE) return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
    else if (initialSlope === 0.0) return guessForT;
    else return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
  }

  return function BezierEasing(x: number) {
    if (x === 0 || x === 1) return x;
    return calcBezier(getTForX(x), mY1, mY2);
  };
}

// ─── Ease ratio helper (from Interpolator.as) ─────────────────────────
function getEaseRatio(p: number, type: number, power: number): number {
  let r = (type === 1) ? 1 - p : (type === 2) ? p : (p < 0.5) ? p * 2 : (1 - p) * 2;
  if (power === 1) r *= r;
  else if (power === 2) r *= r * r;
  else if (power === 3) r *= r * r * r;
  else if (power === 4) r *= r * r * r * r;
  return (type === 1) ? 1 - r : (type === 2) ? r : (p < 0.5) ? r / 2 : 1 - (r / 2);
}

// ─── Interpolator functions ───────────────────────────────────────────
export type InterpolatorFn = (per: number) => number;

export const Interpolator = {
  linear: (per: number) => per,

  quadOut: (per: number) => getEaseRatio(per, 1, 1),
  quadIn: (per: number) => getEaseRatio(per, 2, 1),
  quadInOut: (per: number) => getEaseRatio(per, 3, 1),

  cubicOut: (per: number) => getEaseRatio(per, 1, 2),
  cubicIn: (per: number) => getEaseRatio(per, 2, 2),
  cubicInOut: (per: number) => getEaseRatio(per, 3, 2),

  quartOut: (per: number) => getEaseRatio(per, 1, 3),
  quartIn: (per: number) => getEaseRatio(per, 2, 3),
  quartInOut: (per: number) => getEaseRatio(per, 3, 3),

  quintOut: (per: number) => getEaseRatio(per, 1, 4),
  quintIn: (per: number) => getEaseRatio(per, 2, 4),
  quintInOut: (per: number) => getEaseRatio(per, 3, 4),

  sinOut: (per: number) => Math.sin(per * Math.PI / 2),
  sinIn: (per: number) => -Math.cos(per * Math.PI / 2) + 1,
  sinInOut: (per: number) => -0.5 * (Math.cos(Math.PI * per) - 1),

  expoOut: (per: number) => 1 - Math.pow(2, -10 * per),
  expoIn: (per: number) => Math.pow(2, 10 * (per - 1)) - 0.001,
  expoInOut: (per: number) => ((per *= 2) < 1)
    ? 0.5 * Math.pow(2, 10 * (per - 1))
    : 0.5 * (2 - Math.pow(2, -10 * (per - 1))),

  android: (per: number) => {
    const b1 = bezierEasing(0.3, 0, 0.8, 0.15);
    const b2 = bezierEasing(0.05, 0.7, 0.1, 1);
    return per <= 1 / 6
      ? b1(per / (1 / 6)) * 0.4
      : 0.4 + b2((per - 1 / 6) / (5 / 6)) * 0.6;
  },

  bezier: (x1: number, y1: number, x2: number, y2: number): InterpolatorFn => {
    const b = bezierEasing(x1, y1, x2, y2);
    return (per: number) => b(per);
  },
} as const;
