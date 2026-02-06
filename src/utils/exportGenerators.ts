/**
 * Export Code Generators for Toumo
 * 
 * Generates production-ready code from keyframes and transitions:
 * - CSS Animation (@keyframes)
 * - React / Framer Motion
 * - SVG (static)
 * - HTML/CSS (static snapshot)
 */

import type { KeyElement, Keyframe, Transition, Size } from '../types';

// ============================================
// Shared Helpers
// ============================================

export function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '').replace(/^[0-9]/, '_$&') || 'element';
}

export function toClassName(name: string): string {
  return sanitizeName(name).replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
}

export function toCamelCase(name: string): string {
  const s = sanitizeName(name);
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** Map easing curve name to CSS timing function */
export function curveToCSS(curve: string): string {
  const map: Record<string, string> = {
    'linear': 'linear',
    'ease': 'ease',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
    'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  };
  return map[curve] || curve || 'ease-out';
}

/** Map easing curve to Framer Motion easing */
export function curveToFramer(curve: string): string {
  if (curve === 'spring') return '{ type: "spring", damping: 15, stiffness: 300 }';
  const map: Record<string, string> = {
    'linear': '"linear"',
    'ease': '"easeInOut"',
    'ease-in': '"easeIn"',
    'ease-out': '"easeOut"',
    'ease-in-out': '"easeInOut"',
  };
  return map[curve] || '"easeOut"';
}

/**
 * Match elements across keyframes by name.
 * Returns a map: elementName -> { keyframeId -> KeyElement }
 */
export function matchElementsAcrossKeyframes(
  keyframes: Keyframe[]
): Map<string, Map<string, KeyElement>> {
  const result = new Map<string, Map<string, KeyElement>>();
  for (const kf of keyframes) {
    for (const el of kf.keyElements) {
      if (!result.has(el.name)) {
        result.set(el.name, new Map());
      }
      result.get(el.name)!.set(kf.id, el);
    }
  }
  return result;
}

// ============================================
// CSS Property Builder
// ============================================

/** Build CSS properties from element position/size/style */
export function buildCSSProps(el: KeyElement): Record<string, string> {
  const style = el.style;
  const props: Record<string, string> = {};

  props['position'] = 'absolute';
  props['left'] = `${el.position.x}px`;
  props['top'] = `${el.position.y}px`;
  props['width'] = `${el.size.width}px`;
  props['height'] = `${el.size.height}px`;

  if (!style) return props;

  // Background
  if (style.gradientType && style.gradientType !== 'none' && style.gradientStops?.length) {
    const stops = style.gradientStops.map(s => `${s.color} ${s.position}%`).join(', ');
    if (style.gradientType === 'linear') {
      props['background'] = `linear-gradient(${style.gradientAngle || 180}deg, ${stops})`;
    } else {
      props['background'] = `radial-gradient(circle, ${stops})`;
    }
  } else if (style.fill) {
    props['background-color'] = style.fill;
  }

  // Opacity
  if (style.fillOpacity !== undefined && style.fillOpacity !== 1) {
    props['opacity'] = `${style.fillOpacity}`;
  }

  // Border
  if (style.stroke && style.strokeWidth) {
    props['border'] = `${style.strokeWidth}px ${style.strokeStyle || 'solid'} ${style.stroke}`;
  }

  // Border radius
  if (style.borderRadiusTL != null || style.borderRadiusTR != null ||
      style.borderRadiusBR != null || style.borderRadiusBL != null) {
    const tl = style.borderRadiusTL ?? style.borderRadius ?? 0;
    const tr = style.borderRadiusTR ?? style.borderRadius ?? 0;
    const br = style.borderRadiusBR ?? style.borderRadius ?? 0;
    const bl = style.borderRadiusBL ?? style.borderRadius ?? 0;
    props['border-radius'] = `${tl}px ${tr}px ${br}px ${bl}px`;
  } else if (style.borderRadius) {
    props['border-radius'] = `${style.borderRadius}px`;
  }

  // Shadow
  if (style.shadowBlur || style.shadowOffsetX || style.shadowOffsetY) {
    const x = style.shadowOffsetX || 0;
    const y = style.shadowOffsetY || 0;
    const blur = style.shadowBlur || 0;
    const spread = style.shadowSpread || 0;
    const color = style.shadowColor || 'rgba(0,0,0,0.25)';
    props['box-shadow'] = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
  }

  // Filters
  const filters: string[] = [];
  if (style.blur) filters.push(`blur(${style.blur}px)`);
  if (style.brightness != null && style.brightness !== 1) filters.push(`brightness(${style.brightness})`);
  if (style.contrast != null && style.contrast !== 1) filters.push(`contrast(${style.contrast})`);
  if (style.saturate != null && style.saturate !== 1) filters.push(`saturate(${style.saturate})`);
  if (style.hueRotate) filters.push(`hue-rotate(${style.hueRotate}deg)`);
  if (style.grayscale) filters.push(`grayscale(${style.grayscale})`);
  if (filters.length) props['filter'] = filters.join(' ');

  if (style.backdropBlur) {
    props['backdrop-filter'] = `blur(${style.backdropBlur}px)`;
  }

  // Transform
  const transforms: string[] = [];
  if (style.rotation) transforms.push(`rotate(${style.rotation}deg)`);
  if (style.scale != null && style.scale !== 1) transforms.push(`scale(${style.scale})`);
  if (style.skewX) transforms.push(`skewX(${style.skewX}deg)`);
  if (style.skewY) transforms.push(`skewY(${style.skewY}deg)`);
  if (transforms.length) props['transform'] = transforms.join(' ');

  // Text
  if (el.shapeType === 'text') {
    if (style.fontSize) props['font-size'] = `${style.fontSize}px`;
    if (style.fontWeight) props['font-weight'] = style.fontWeight;
    if (style.color || style.textColor) props['color'] = style.color || style.textColor || '';
    if (style.textAlign) props['text-align'] = style.textAlign;
    if (style.fontFamily) props['font-family'] = style.fontFamily;
    if (style.lineHeight) props['line-height'] = `${style.lineHeight}`;
    if (style.letterSpacing) props['letter-spacing'] = `${style.letterSpacing}px`;
    if (style.fontStyle) props['font-style'] = style.fontStyle;
    if (style.textDecoration && style.textDecoration !== 'none') props['text-decoration'] = style.textDecoration;
    if (style.textTransform) props['text-transform'] = style.textTransform;
  }

  if (style.clipPath) props['clip-path'] = style.clipPath;
  if (style.blendMode) props['mix-blend-mode'] = style.blendMode;

  return props;
}

// ============================================
// Transition Chain Helpers
// ============================================

export function buildTransitionChain(keyframes: Keyframe[], transitions: Transition[]): string[] {
  if (keyframes.length === 0) return [];
  if (transitions.length === 0) return keyframes.map(kf => kf.id);

  const toIds = new Set(transitions.map(t => t.to));
  const startId = keyframes.find(kf => !toIds.has(kf.id))?.id || keyframes[0].id;

  const visited = new Set<string>();
  const chain: string[] = [];
  let current: string | null = startId;

  while (current && !visited.has(current)) {
    visited.add(current);
    chain.push(current);
    const next = transitions.find(t => t.from === current);
    current = next ? next.to : null;
  }

  // Add any keyframes not reached by transitions
  for (const kf of keyframes) {
    if (!visited.has(kf.id)) chain.push(kf.id);
  }

  return chain;
}

function findTransition(transitions: Transition[], fromId: string, toId: string): Transition | undefined {
  return transitions.find(t => t.from === fromId && t.to === toId);
}

export function calcTotalDuration(orderedKfIds: string[], transitions: Transition[]): number {
  let total = 0;
  for (let i = 0; i < orderedKfIds.length - 1; i++) {
    const tr = findTransition(transitions, orderedKfIds[i], orderedKfIds[i + 1]);
    total += (tr?.duration || 300) + (tr?.delay || 0);
  }
  return total;
}

// ============================================
// 1. CSS Animation Export
// ============================================

export function generateCSSAnimation(
  keyframes: Keyframe[],
  transitions: Transition[],
  frameSize: Size,
): string {
  if (keyframes.length === 0) return '/* No keyframes to export */';

  const elementMap = matchElementsAcrossKeyframes(keyframes);
  const orderedKfIds = buildTransitionChain(keyframes, transitions);
  const totalDuration = calcTotalDuration(orderedKfIds, transitions);
  const lines: string[] = [];

  // Container
  lines.push(`.animation-container {`);
  lines.push(`  position: relative;`);
  lines.push(`  width: ${frameSize.width}px;`);
  lines.push(`  height: ${frameSize.height}px;`);
  lines.push(`  overflow: hidden;`);
  lines.push(`}\n`);

  for (const [elName, kfMap] of elementMap) {
    const className = toClassName(elName);
    const firstEl = kfMap.get(orderedKfIds[0]);
    if (!firstEl) continue;

    // Base styles from first keyframe
    const baseProps = buildCSSProps(firstEl);
    lines.push(`.${className} {`);
    for (const [k, v] of Object.entries(baseProps)) {
      lines.push(`  ${k}: ${v};`);
    }
    if (totalDuration > 0 && orderedKfIds.length > 1) {
      lines.push(`  animation: ${className}-anim ${totalDuration}ms ease-in-out infinite both;`);
    }
    lines.push(`}\n`);

    // @keyframes rule
    if (orderedKfIds.length > 1 && totalDuration > 0) {
      lines.push(`@keyframes ${className}-anim {`);
      let elapsed = 0;

      for (let i = 0; i < orderedKfIds.length; i++) {
        const kfId = orderedKfIds[i];
        const el = kfMap.get(kfId);
        if (!el) continue;

        const pct = totalDuration > 0 ? Math.round((elapsed / totalDuration) * 100) : 0;
        const props = buildCSSProps(el);
        delete props['position']; // already on element

        const tr = i > 0 ? findTransition(transitions, orderedKfIds[i - 1], kfId) : null;
        const easing = tr ? curveToCSS(tr.curve) : '';

        lines.push(`  ${pct}% {`);
        for (const [k, v] of Object.entries(props)) {
          lines.push(`    ${k}: ${v};`);
        }
        if (easing && easing !== 'ease-in-out') {
          lines.push(`    animation-timing-function: ${easing};`);
        }
        lines.push(`  }`);

        if (i < orderedKfIds.length - 1) {
          const nextTr = findTransition(transitions, kfId, orderedKfIds[i + 1]);
          elapsed += (nextTr?.duration || 300) + (nextTr?.delay || 0);
        }
      }

      // Ensure we end at 100%
      const lastPct = totalDuration > 0 ? Math.round((elapsed / totalDuration) * 100) : 100;
      if (lastPct < 100) {
        const lastEl = kfMap.get(orderedKfIds[orderedKfIds.length - 1]);
        if (lastEl) {
          const props = buildCSSProps(lastEl);
          delete props['position'];
          lines.push(`  100% {`);
          for (const [k, v] of Object.entries(props)) {
            lines.push(`    ${k}: ${v};`);
          }
          lines.push(`  }`);
        }
      }

      lines.push(`}\n`);
    }
  }

  return lines.join('\n');
}

// ============================================
// 2. React / Framer Motion Export
// ============================================

export function generateFramerMotionCode(
  keyframes: Keyframe[],
  transitions: Transition[],
  frameSize: Size,
): string {
  if (keyframes.length === 0) return '// No keyframes to export';

  const elementMap = matchElementsAcrossKeyframes(keyframes);
  const orderedKfIds = buildTransitionChain(keyframes, transitions);

  const stateNames = orderedKfIds.map(id => {
    const kf = keyframes.find(k => k.id === id);
    return toCamelCase(kf?.name || id);
  });

  const lines: string[] = [];

  // Imports
  lines.push(`import { useState } from 'react';`);
  lines.push(`import { motion } from 'framer-motion';\n`);

  // Variants for each element
  for (const [elName, kfMap] of elementMap) {
    const varName = `${toCamelCase(elName)}Variants`;
    lines.push(`const ${varName} = {`);

    for (let i = 0; i < orderedKfIds.length; i++) {
      const kfId = orderedKfIds[i];
      const el = kfMap.get(kfId);
      if (!el) continue;

      const stateName = stateNames[i];
      const tr = i > 0 ? findTransition(transitions, orderedKfIds[i - 1], kfId) : null;

      lines.push(`  ${stateName}: {`);
      lines.push(`    x: ${el.position.x},`);
      lines.push(`    y: ${el.position.y},`);
      lines.push(`    width: ${el.size.width},`);
      lines.push(`    height: ${el.size.height},`);

      const s = el.style;
      if (s) {
        if (s.fill) lines.push(`    backgroundColor: '${s.fill}',`);
        if (s.fillOpacity != null && s.fillOpacity !== 1) lines.push(`    opacity: ${s.fillOpacity},`);
        if (s.borderRadius) lines.push(`    borderRadius: ${s.borderRadius},`);
        if (s.rotation) lines.push(`    rotate: ${s.rotation},`);
        if (s.scale != null && s.scale !== 1) lines.push(`    scale: ${s.scale},`);
        if (s.shadowBlur || s.shadowOffsetX || s.shadowOffsetY) {
          const bx = s.shadowOffsetX || 0, by = s.shadowOffsetY || 0;
          const bb = s.shadowBlur || 0, bs = s.shadowSpread || 0;
          const bc = s.shadowColor || 'rgba(0,0,0,0.25)';
          lines.push(`    boxShadow: '${bx}px ${by}px ${bb}px ${bs}px ${bc}',`);
        }
      }

      if (tr) {
        const dur = tr.duration / 1000;
        const delay = tr.delay / 1000;
        const easing = curveToFramer(tr.curve);
        lines.push(`    transition: { duration: ${dur}${delay ? `, delay: ${delay}` : ''}, ease: ${easing} },`);
      }

      lines.push(`  },`);
    }
    lines.push(`};\n`);
  }

  // Component
  lines.push(`export function AnimatedDesign() {`);
  lines.push(`  const [state, setState] = useState('${stateNames[0]}');\n`);
  lines.push(`  const nextState = () => {`);
  lines.push(`    const states = [${stateNames.map(s => `'${s}'`).join(', ')}];`);
  lines.push(`    const idx = states.indexOf(state);`);
  lines.push(`    setState(states[(idx + 1) % states.length]);`);
  lines.push(`  };\n`);

  lines.push(`  return (`);
  lines.push(`    <div`);
  lines.push(`      style={{ position: 'relative', width: ${frameSize.width}, height: ${frameSize.height} }}`);
  lines.push(`      onClick={nextState}`);
  lines.push(`    >`);

  for (const [elName, kfMap] of elementMap) {
    const varName = `${toCamelCase(elName)}Variants`;
    const firstEl = [...kfMap.values()][0];
    if (!firstEl) continue;
    const isText = firstEl.shapeType === 'text';

    if (isText) {
      lines.push(`      <motion.div`);
      lines.push(`        variants={${varName}}`);
      lines.push(`        animate={state}`);
      lines.push(`        style={{ position: 'absolute' }}`);
      lines.push(`      >`);
      lines.push(`        ${firstEl.text || ''}`);
      lines.push(`      </motion.div>`);
    } else {
      lines.push(`      <motion.div`);
      lines.push(`        variants={${varName}}`);
      lines.push(`        animate={state}`);
      lines.push(`        style={{ position: 'absolute' }}`);
      lines.push(`      />`);
    }
  }

  lines.push(`    </div>`);
  lines.push(`  );`);
  lines.push(`}`);

  return lines.join('\n');
}
