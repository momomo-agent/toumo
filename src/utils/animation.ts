import { getEasing } from './easing';

export interface AnimationConfig {
  duration: number;
  delay?: number;
  easing?: string;
}

export interface AnimatableValue {
  from: number;
  to: number;
}

export function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

export function interpolateColor(from: string, to: string, progress: number): string {
  // 简单的颜色插值（hex）
  const fromRgb = hexToRgb(from);
  const toRgb = hexToRgb(to);
  
  if (!fromRgb || !toRgb) return progress < 0.5 ? from : to;
  
  const r = Math.round(interpolate(fromRgb.r, toRgb.r, progress));
  const g = Math.round(interpolate(fromRgb.g, toRgb.g, progress));
  const b = Math.round(interpolate(fromRgb.b, toRgb.b, progress));
  
  return rgbToHex(r, g, b);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}
