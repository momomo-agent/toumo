/**
 * Export Code Generators for Toumo
 * 
 * Generates production-ready code from keyframes and transitions:
 * - CSS Animation (@keyframes)
 * - React / Framer Motion
 * - SVG (static)
 * - HTML/CSS (static snapshot)
 */

import type { KeyElement, Keyframe, Size } from '../types';
type Transition = any;
import { useEditorStore } from '../store/useEditorStore';

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
  const sharedElements = useEditorStore.getState().sharedElements;
  for (const kf of keyframes) {
    for (const el of sharedElements) {
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

// ============================================
// 3. SVG Export
// ============================================

export function generateSVGCode(
  _keyframe: Keyframe,
  frameSize: Size,
  canvasBackground: string,
): string {
  const elements = useEditorStore.getState().sharedElements;
  const lines: string[] = [];
  const defs: string[] = [];
  let defId = 0;

  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${frameSize.width}" height="${frameSize.height}" viewBox="0 0 ${frameSize.width} ${frameSize.height}">`);

  if (canvasBackground && canvasBackground !== 'transparent') {
    lines.push(`  <rect width="100%" height="100%" fill="${canvasBackground}" />`);
  }

  for (const el of elements) {
    const style = el.style;
    const gradId = style?.gradientType && style.gradientType !== 'none' ? `grad-${++defId}` : null;
    const shadId = (style?.shadowBlur || style?.shadowOffsetX || style?.shadowOffsetY) ? `shadow-${++defId}` : null;
    const clipId = el.shapeType === 'image' && style?.borderRadius ? `clip-${++defId}` : null;

    // Gradient defs
    if (gradId && style?.gradientStops?.length) {
      if (style.gradientType === 'linear') {
        const ang = style.gradientAngle || 180;
        const rad = (ang - 90) * Math.PI / 180;
        const x1 = 50 - Math.cos(rad) * 50;
        const y1 = 50 - Math.sin(rad) * 50;
        const x2 = 50 + Math.cos(rad) * 50;
        const y2 = 50 + Math.sin(rad) * 50;
        defs.push(`    <linearGradient id="${gradId}" x1="${x1.toFixed(1)}%" y1="${y1.toFixed(1)}%" x2="${x2.toFixed(1)}%" y2="${y2.toFixed(1)}%">`);
        for (const stop of style.gradientStops) {
          defs.push(`      <stop offset="${stop.position}%" stop-color="${stop.color}" />`);
        }
        defs.push(`    </linearGradient>`);
      } else {
        defs.push(`    <radialGradient id="${gradId}">`);
        for (const stop of style.gradientStops!) {
          defs.push(`      <stop offset="${stop.position}%" stop-color="${stop.color}" />`);
        }
        defs.push(`    </radialGradient>`);
      }
    }

    // Shadow filter
    if (shadId && style) {
      const dx = style.shadowOffsetX || 0;
      const dy = style.shadowOffsetY || 0;
      const blur = style.shadowBlur || 0;
      const color = style.shadowColor || 'rgba(0,0,0,0.25)';
      defs.push(`    <filter id="${shadId}" x="-20%" y="-20%" width="140%" height="140%">`);
      defs.push(`      <feDropShadow dx="${dx}" dy="${dy}" stdDeviation="${blur / 2}" flood-color="${color}" />`);
      defs.push(`    </filter>`);
    }

    // Clip path for images with border radius
    if (clipId && style?.borderRadius) {
      defs.push(`    <clipPath id="${clipId}">`);
      defs.push(`      <rect x="${el.position.x}" y="${el.position.y}" width="${el.size.width}" height="${el.size.height}" rx="${style.borderRadius}" />`);
      defs.push(`    </clipPath>`);
    }

    const fill = gradId ? `url(#${gradId})` : (style?.fill || 'none');
    const opAttr = style?.fillOpacity != null && style.fillOpacity !== 1 ? ` opacity="${style.fillOpacity}"` : '';
    const stAttr = style?.stroke ? ` stroke="${style.stroke}" stroke-width="${style.strokeWidth || 1}"` : '';
    const fiAttr = shadId ? ` filter="url(#${shadId})"` : '';
    const ecx = el.position.x + el.size.width / 2;
    const ecy = el.position.y + el.size.height / 2;
    const trAttr = style?.rotation ? ` transform="rotate(${style.rotation} ${ecx} ${ecy})"` : '';

    renderSVGElement(el, lines, fill, opAttr, stAttr, fiAttr, trAttr, ecx, ecy, clipId);
  }

  if (defs.length > 0) {
    lines.splice(1, 0, `  <defs>\n${defs.join('\n')}\n  </defs>`);
  }

  lines.push(`</svg>`);
  return lines.join('\n');
}

function renderSVGElement(
  el: KeyElement,
  lines: string[],
  fill: string,
  opAttr: string,
  stAttr: string,
  fiAttr: string,
  trAttr: string,
  ecx: number,
  ecy: number,
  clipId: string | null,
): void {
  const style = el.style;

  switch (el.shapeType) {
    case 'ellipse': {
      const rx = el.size.width / 2;
      const ry = el.size.height / 2;
      lines.push(`  <ellipse cx="${ecx}" cy="${ecy}" rx="${rx}" ry="${ry}" fill="${fill}"${opAttr}${stAttr}${fiAttr}${trAttr} />`);
      break;
    }
    case 'text': {
      const tc = style?.textColor || style?.color || '#ffffff';
      const fs = style?.fontSize || 14;
      const fw = style?.fontWeight || 'normal';
      const ff = style?.fontFamily || 'sans-serif';
      const anchor = style?.textAlign === 'center' ? 'middle' : style?.textAlign === 'right' ? 'end' : 'start';
      const tx = style?.textAlign === 'center' ? ecx : style?.textAlign === 'right' ? el.position.x + el.size.width : el.position.x;
      lines.push(`  <text x="${tx}" y="${ecy}" fill="${tc}" font-size="${fs}" font-weight="${fw}" font-family="${ff}" text-anchor="${anchor}" dominant-baseline="middle"${opAttr}${trAttr}>${el.text || ''}</text>`);
      break;
    }
    case 'line': {
      const x2 = el.position.x + el.size.width;
      const y2 = el.position.y + el.size.height;
      const ls = style?.stroke || '#ffffff';
      const lw = style?.strokeWidth || 1;
      lines.push(`  <line x1="${el.position.x}" y1="${el.position.y}" x2="${x2}" y2="${y2}" stroke="${ls}" stroke-width="${lw}"${opAttr}${trAttr} />`);
      break;
    }
    case 'path': {
      if (style?.pathData) {
        lines.push(`  <path d="${style.pathData}" fill="${fill}"${opAttr}${stAttr}${fiAttr}${trAttr} />`);
      }
      break;
    }
    case 'image': {
      if (style?.imageSrc) {
        const clip = clipId ? ` clip-path="url(#${clipId})"` : '';
        lines.push(`  <image href="${style.imageSrc}" x="${el.position.x}" y="${el.position.y}" width="${el.size.width}" height="${el.size.height}"${opAttr}${clip}${trAttr} />`);
      }
      break;
    }
    default: {
      const rx = style?.borderRadius ? ` rx="${style.borderRadius}"` : '';
      lines.push(`  <rect x="${el.position.x}" y="${el.position.y}" width="${el.size.width}" height="${el.size.height}" fill="${fill}"${rx}${opAttr}${stAttr}${fiAttr}${trAttr} />`);
      break;
    }
  }
}

// ============================================
// 4. Static HTML/CSS Export
// ============================================

export function generateStaticHTML(
  keyframe: Keyframe,
  frameSize: Size,
  canvasBackground: string,
): string {
  const elements = keyframe.keyElements || [];
  const lines: string[] = [];

  lines.push(`<!DOCTYPE html>`);
  lines.push(`<html lang="en">`);
  lines.push(`<head>`);
  lines.push(`  <meta charset="UTF-8">`);
  lines.push(`  <meta name="viewport" content="width=device-width, initial-scale=1.0">`);
  lines.push(`  <title>${keyframe.name || 'Design Export'}</title>`);
  lines.push(`  <style>`);
  lines.push(`    * { margin: 0; padding: 0; box-sizing: border-box; }`);
  lines.push(`    .container {`);
  lines.push(`      position: relative;`);
  lines.push(`      width: ${frameSize.width}px;`);
  lines.push(`      height: ${frameSize.height}px;`);
  lines.push(`      margin: 40px auto;`);
  if (canvasBackground) {
    lines.push(`      background: ${canvasBackground};`);
  }
  lines.push(`      overflow: hidden;`);
  lines.push(`    }`);

  for (const el of elements) {
    const className = toClassName(el.name);
    const props = buildCSSProps(el);
    lines.push(`    .${className} {`);
    for (const [k, v] of Object.entries(props)) {
      lines.push(`      ${k}: ${v};`);
    }
    lines.push(`    }`);
  }

  lines.push(`  </style>`);
  lines.push(`</head>`);
  lines.push(`<body>`);
  lines.push(`  <div class="container">`);

  for (const el of elements) {
    const className = toClassName(el.name);
    if (el.shapeType === 'text') {
      lines.push(`    <div class="${className}">${el.text || ''}</div>`);
    } else if (el.shapeType === 'image' && el.style?.imageSrc) {
      lines.push(`    <img class="${className}" src="${el.style.imageSrc}" alt="${el.name}" />`);
    } else {
      lines.push(`    <div class="${className}"></div>`);
    }
  }

  lines.push(`  </div>`);
  lines.push(`</body>`);
  lines.push(`</html>`);

  return lines.join('\n');
}
