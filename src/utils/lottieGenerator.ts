/**
 * Lottie JSON Generator for Toumo
 *
 * Converts keyframes + transitions into Lottie animation format.
 * Spec: https://lottiefiles.github.io/lottie-docs/
 */

import type { KeyElement, Keyframe, Transition, Size } from '../types';
import {
  matchElementsAcrossKeyframes,
  buildTransitionChain,
  sanitizeName,
} from './exportGenerators';

// ============================================
// Lottie Types (subset)
// ============================================

interface LottieAnimation {
  v: string;          // version
  fr: number;         // framerate
  ip: number;         // in point
  op: number;         // out point (total frames)
  w: number;          // width
  h: number;          // height
  nm: string;         // name
  ddd: number;        // 3d (0 = no)
  assets: LottieAsset[];
  layers: LottieLayer[];
}

interface LottieAsset {
  id: string;
  w?: number;
  h?: number;
  p?: string;   // path / data URI
  u?: string;   // directory
  e?: number;   // embedded (1 = yes)
}

interface LottieLayer {
  ddd: number;
  ind: number;        // index
  ty: number;         // type: 0=precomp, 1=solid, 2=image, 3=null, 4=shape
  nm: string;         // name
  sr: number;         // stretch
  ks: LottieTransform;
  ao: number;         // auto-orient
  ip: number;         // in point
  op: number;         // out point
  st: number;         // start time
  bm: number;         // blend mode
  shapes?: LottieShape[];
  sc?: string;        // solid color
  sw?: number;        // solid width
  sh?: number;        // solid height
  refId?: string;     // asset reference
  t?: LottieTextData; // text data
}

interface LottieTransform {
  o: LottieAnimatedValue;   // opacity
  r: LottieAnimatedValue;   // rotation
  p: LottieAnimatedMulti;   // position
  a: LottieAnimatedMulti;   // anchor
  s: LottieAnimatedMulti;   // scale
}

interface LottieAnimatedValue {
  a: number;  // animated (0=static, 1=animated)
  k: number | LottieKeyframe[];
}

interface LottieAnimatedMulti {
  a: number;
  k: number[] | LottieKeyframeMulti[];
}

interface LottieKeyframe {
  t: number;   // time (frame)
  s: number[];
  e?: number[];
  i?: { x: number[]; y: number[] };  // in tangent
  o?: { x: number[]; y: number[] };  // out tangent
}

interface LottieKeyframeMulti {
  t: number;
  s: number[];
  e?: number[];
  i?: { x: number | number[]; y: number | number[] };
  o?: { x: number | number[]; y: number | number[] };
}

interface LottieShape {
  ty: string;
  // rect
  d?: number;
  p?: { a: number; k: number[] };
  s?: { a: number; k: number[] };
  r?: { a: number; k: number };
  // fill
  c?: { a: number; k: number[] };
  o?: { a: number; k: number };
  // stroke
  w?: { a: number; k: number };
  lc?: number;
  lj?: number;
  // ellipse
  // group
  it?: LottieShape[];
  nm: string;
  mn?: string;
  hd?: boolean;
}

interface LottieTextData {
  d: {
    k: Array<{
      s: {
        s: number;    // font size
        f: string;    // font family
        t: string;    // text content
        j: number;    // justification (0=left, 1=right, 2=center)
        tr: number;   // tracking (letter spacing)
        lh: number;   // line height
        ls: number;   // baseline shift
        fc: number[]; // fill color [r,g,b]
      };
      t: number;      // time
    }>;
  };
}

// ============================================
// Helpers
// ============================================

const FRAMERATE = 30;

/** Convert ms duration to frame count */
function msToFrames(ms: number): number {
  return Math.round((ms / 1000) * FRAMERATE);
}

/** Parse hex/rgb color to [r, g, b] normalized 0-1 */
function parseColor(color: string): number[] {
  if (!color) return [0, 0, 0];

  // hex
  const hex = color.replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255,
    ];
  }
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return [
      parseInt(hex[0] + hex[0], 16) / 255,
      parseInt(hex[1] + hex[1], 16) / 255,
      parseInt(hex[2] + hex[2], 16) / 255,
    ];
  }

  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1]) / 255,
      parseInt(rgbMatch[2]) / 255,
      parseInt(rgbMatch[3]) / 255,
    ];
  }

  return [0, 0, 0];
}

/** Map easing curve to Lottie bezier tangents */
function curveToLottieBezier(curve: string): { i: { x: number; y: number }; o: { x: number; y: number } } {
  const presets: Record<string, [number, number, number, number]> = {
    'linear':      [0, 0, 1, 1],
    'ease':        [0.25, 0.1, 0.25, 1],
    'ease-in':     [0.42, 0, 1, 1],
    'ease-out':    [0, 0, 0.58, 1],
    'ease-in-out': [0.42, 0, 0.58, 1],
    'spring':      [0.34, 1.56, 0.64, 1],
  };
  const [ox, oy, ix, iy] = presets[curve] || presets['ease-out'];
  return {
    o: { x: ox, y: oy },
    i: { x: ix, y: iy },
  };
}

// ============================================
// Layer Builders
// ============================================

function buildShapeRect(
  el: KeyElement,
): LottieShape[] {
  const s = el.style;
  const shapes: LottieShape[] = [];

  // Rectangle path
  shapes.push({
    ty: 'rc',
    d: 1,
    s: { a: 0, k: [el.size.width, el.size.height] },
    p: { a: 0, k: [0, 0] },
    r: { a: 0, k: s?.borderRadius || 0 },
    nm: 'Rect',
  });

  // Fill
  const fillColor = parseColor(s?.fill || '#3b82f6');
  shapes.push({
    ty: 'fl',
    c: { a: 0, k: [...fillColor, 1] },
    o: { a: 0, k: (s?.fillOpacity ?? 1) * 100 },
    nm: 'Fill',
  });

  // Stroke (if present)
  if (s?.stroke && s.strokeWidth) {
    const strokeColor = parseColor(s.stroke);
    shapes.push({
      ty: 'st',
      c: { a: 0, k: [...strokeColor, 1] },
      o: { a: 0, k: (s.strokeOpacity ?? 1) * 100 },
      w: { a: 0, k: s.strokeWidth },
      lc: 2,
      lj: 2,
      nm: 'Stroke',
    });
  }

  return shapes;
}

function buildShapeEllipse(
  el: KeyElement,
): LottieShape[] {
  const s = el.style;
  const shapes: LottieShape[] = [];

  // Ellipse path
  shapes.push({
    ty: 'el',
    d: 1,
    s: { a: 0, k: [el.size.width, el.size.height] },
    p: { a: 0, k: [0, 0] },
    nm: 'Ellipse',
  });

  // Fill
  const fillColor = parseColor(s?.fill || '#3b82f6');
  shapes.push({
    ty: 'fl',
    c: { a: 0, k: [...fillColor, 1] },
    o: { a: 0, k: (s?.fillOpacity ?? 1) * 100 },
    nm: 'Fill',
  });

  // Stroke
  if (s?.stroke && s.strokeWidth) {
    const strokeColor = parseColor(s.stroke);
    shapes.push({
      ty: 'st',
      c: { a: 0, k: [...strokeColor, 1] },
      o: { a: 0, k: (s.strokeOpacity ?? 1) * 100 },
      w: { a: 0, k: s.strokeWidth },
      lc: 2,
      lj: 2,
      nm: 'Stroke',
    });
  }

  return shapes;
}

function buildTransformKeyframes(
  el: KeyElement,
  kfMap: Map<string, KeyElement>,
  orderedKfIds: string[],
  transitions: Transition[],
): LottieTransform {
  // If only one keyframe, return static transform
  if (orderedKfIds.length <= 1 || kfMap.size <= 1) {
    const s = el.style;
    return {
      o: { a: 0, k: (s?.fillOpacity ?? 1) * 100 },
      r: { a: 0, k: s?.rotation || 0 },
      p: {
        a: 0,
        k: [
          el.position.x + el.size.width / 2,
          el.position.y + el.size.height / 2,
          0,
        ],
      },
      a: { a: 0, k: [0, 0, 0] },
      s: {
        a: 0,
        k: [(s?.scale ?? 1) * 100, (s?.scale ?? 1) * 100, 100],
      },
    };
  }

  // Build animated keyframes
  const posKfs: LottieKeyframeMulti[] = [];
  const opKfs: LottieKeyframe[] = [];
  const rotKfs: LottieKeyframe[] = [];
  const scaleKfs: LottieKeyframeMulti[] = [];

  let currentFrame = 0;

  for (let i = 0; i < orderedKfIds.length; i++) {
    const kfId = orderedKfIds[i];
    const kfEl = kfMap.get(kfId);
    if (!kfEl) {
      // Element doesn't exist in this keyframe, skip but advance time
      if (i < orderedKfIds.length - 1) {
        const tr = findTransitionByIds(transitions, kfId, orderedKfIds[i + 1]);
        currentFrame += msToFrames((tr?.duration || 300) + (tr?.delay || 0));
      }
      continue;
    }

    const s = kfEl.style;
    const cx = kfEl.position.x + kfEl.size.width / 2;
    const cy = kfEl.position.y + kfEl.size.height / 2;

    // Get easing for transition TO this keyframe
    const tr = i > 0 ? findTransitionByIds(transitions, orderedKfIds[i - 1], kfId) : null;
    const bezier = tr ? curveToLottieBezier(tr.curve) : curveToLottieBezier('ease-out');

    // Position
    posKfs.push({
      t: currentFrame,
      s: [cx, cy, 0],
      i: { x: bezier.i.x, y: bezier.i.y },
      o: { x: bezier.o.x, y: bezier.o.y },
    });

    // Opacity
    opKfs.push({
      t: currentFrame,
      s: [(s?.fillOpacity ?? 1) * 100],
      i: { x: [bezier.i.x], y: [bezier.i.y] },
      o: { x: [bezier.o.x], y: [bezier.o.y] },
    });

    // Rotation
    rotKfs.push({
      t: currentFrame,
      s: [s?.rotation || 0],
      i: { x: [bezier.i.x], y: [bezier.i.y] },
      o: { x: [bezier.o.x], y: [bezier.o.y] },
    });

    // Scale
    const sc = (s?.scale ?? 1) * 100;
    scaleKfs.push({
      t: currentFrame,
      s: [sc, sc, 100],
      i: { x: bezier.i.x, y: bezier.i.y },
      o: { x: bezier.o.x, y: bezier.o.y },
    });

    // Advance frame counter
    if (i < orderedKfIds.length - 1) {
      const nextTr = findTransitionByIds(transitions, kfId, orderedKfIds[i + 1]);
      currentFrame += msToFrames((nextTr?.duration || 300) + (nextTr?.delay || 0));
    }
  }

  const hasAnimation = posKfs.length > 1;

  return {
    o: hasAnimation ? { a: 1, k: opKfs } : { a: 0, k: opKfs[0]?.s[0] ?? 100 },
    r: hasAnimation ? { a: 1, k: rotKfs } : { a: 0, k: rotKfs[0]?.s[0] ?? 0 },
    p: hasAnimation ? { a: 1, k: posKfs } : { a: 0, k: posKfs[0]?.s ?? [0, 0, 0] },
    a: { a: 0, k: [0, 0, 0] },
    s: hasAnimation ? { a: 1, k: scaleKfs } : { a: 0, k: scaleKfs[0]?.s ?? [100, 100, 100] },
  };
}

function findTransitionByIds(
  transitions: Transition[],
  fromId: string,
  toId: string,
): Transition | undefined {
  return transitions.find(t => t.from === fromId && t.to === toId);
}

// ============================================
// Main Generator
// ============================================

export function generateLottieJSON(
  keyframes: Keyframe[],
  transitions: Transition[],
  frameSize: Size,
): LottieAnimation {
  const elementMap = matchElementsAcrossKeyframes(keyframes);
  const orderedKfIds = buildTransitionChain(keyframes, transitions);

  // Calculate total duration in frames
  let totalFrames = 0;
  for (let i = 0; i < orderedKfIds.length - 1; i++) {
    const tr = findTransitionByIds(transitions, orderedKfIds[i], orderedKfIds[i + 1]);
    totalFrames += msToFrames((tr?.duration || 300) + (tr?.delay || 0));
  }
  // Minimum 1 second
  if (totalFrames < FRAMERATE) totalFrames = FRAMERATE;

  const layers: LottieLayer[] = [];
  let layerIndex = 0;

  for (const [elName, kfMap] of elementMap) {
    const firstEl = kfMap.get(orderedKfIds[0]) || [...kfMap.values()][0];
    if (!firstEl) continue;

    const transform = buildTransformKeyframes(
      firstEl,
      kfMap,
      orderedKfIds,
      transitions,
    );

    const isText = firstEl.shapeType === 'text';
    const isEllipse = firstEl.shapeType === 'ellipse';
    const isImage = firstEl.shapeType === 'image';

    if (isText) {
      // Text layer (ty=5)
      const s = firstEl.style;
      const fc = parseColor(s?.textColor || s?.color || s?.fill || '#ffffff');
      layers.push({
        ddd: 0,
        ind: layerIndex++,
        ty: 5,
        nm: sanitizeName(elName),
        sr: 1,
        ks: transform,
        ao: 0,
        ip: 0,
        op: totalFrames,
        st: 0,
        bm: 0,
        t: {
          d: {
            k: [{
              s: {
                s: s?.fontSize || 14,
                f: s?.fontFamily || 'Arial',
                t: firstEl.text || '',
                j: s?.textAlign === 'center' ? 2 : s?.textAlign === 'right' ? 1 : 0,
                tr: (s?.letterSpacing || 0) * 10,
                lh: (s?.lineHeight || 1.2) * (s?.fontSize || 14),
                ls: 0,
                fc,
              },
              t: 0,
            }],
          },
        },
      });
    } else if (isImage && firstEl.style?.imageSrc) {
      // Image layer (ty=2) — reference asset
      // We skip images for now (would need base64 embedding)
      // Fall back to a solid placeholder
      const s = firstEl.style;
      layers.push({
        ddd: 0,
        ind: layerIndex++,
        ty: 1,
        nm: sanitizeName(elName),
        sr: 1,
        ks: transform,
        ao: 0,
        ip: 0,
        op: totalFrames,
        st: 0,
        bm: 0,
        sc: s?.fill || '#cccccc',
        sw: firstEl.size.width,
        sh: firstEl.size.height,
      });
    } else {
      // Shape layer (ty=4)
      const shapes = isEllipse
        ? buildShapeEllipse(firstEl)
        : buildShapeRect(firstEl);

      // Wrap in a group
      const group: LottieShape = {
        ty: 'gr',
        it: [
          ...shapes,
          {
            ty: 'tr',
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
            nm: 'Transform',
          } as unknown as LottieShape,
        ],
        nm: sanitizeName(elName),
      };

      layers.push({
        ddd: 0,
        ind: layerIndex++,
        ty: 4,
        nm: sanitizeName(elName),
        sr: 1,
        ks: transform,
        ao: 0,
        shapes: [group],
        ip: 0,
        op: totalFrames,
        st: 0,
        bm: 0,
      });
    }
  }

  return {
    v: '5.7.4',
    fr: FRAMERATE,
    ip: 0,
    op: totalFrames,
    w: frameSize.width,
    h: frameSize.height,
    nm: 'Toumo Export',
    ddd: 0,
    assets: [],
    layers,
  };
}
