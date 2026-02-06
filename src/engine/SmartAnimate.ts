/**
 * SmartAnimate - 智能动画引擎
 * 
 * 功能：
 * 1. 比较两个状态中相同元素的属性差异
 * 2. 自动生成过渡动画（位置、大小、颜色、透明度）
 * 3. 使用弹簧动画系统
 */

import type { KeyElement, ShapeStyle } from '../types';
import { SpringAnimationEngine, SpringConfig } from './SpringAnimation';

// 可动画的属性类型
export type AnimatableProperty = 
  | 'x' | 'y'           // 位置
  | 'width' | 'height'  // 大小
  | 'opacity'           // 透明度
  | 'fillOpacity'       // 填充透明度
  | 'rotation'          // 旋转
  | 'scale'             // 缩放
  | 'borderRadius'      // 圆角
  | 'strokeWidth'       // 描边宽度
  | 'shadowBlur'        // 阴影模糊
  | 'shadowOffsetX'     // 阴影X偏移
  | 'shadowOffsetY'     // 阴影Y偏移
  | 'blur'              // 模糊滤镜
  | 'brightness'        // 亮度
  | 'contrast'          // 对比度
  | 'saturate'          // 饱和度
  | 'fontSize';         // 字体大小

// 颜色属性
export type ColorProperty = 
  | 'fill'
  | 'stroke'
  | 'shadowColor'
  | 'textColor';

// 元素属性差异
export interface PropertyDiff {
  property: AnimatableProperty | ColorProperty;
  from: number | string;
  to: number | string;
  isColor: boolean;
}

// 元素动画配置
export interface ElementAnimation {
  elementId: string;
  elementName: string;
  diffs: PropertyDiff[];
}

// Smart Animate 结果
export interface SmartAnimateResult {
  matchedElements: ElementAnimation[];
  addedElements: KeyElement[];    // 新增的元素（淡入）
  removedElements: KeyElement[];  // 移除的元素（淡出）
}

/**
 * 解析颜色为 RGBA
 */
function parseColor(color: string): { r: number; g: number; b: number; a: number } | null {
  if (!color) return null;
  
  // 处理 hex 颜色
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1,
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1,
      };
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255,
      };
    }
  }
  
  // 处理 rgb/rgba 颜色
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
    };
  }
  
  return null;
}

/**
 * 插值颜色
 */
export function interpolateColor(from: string, to: string, t: number): string {
  const fromColor = parseColor(from);
  const toColor = parseColor(to);
  
  if (!fromColor || !toColor) return to;
  
  const r = Math.round(fromColor.r + (toColor.r - fromColor.r) * t);
  const g = Math.round(fromColor.g + (toColor.g - fromColor.g) * t);
  const b = Math.round(fromColor.b + (toColor.b - fromColor.b) * t);
  const a = fromColor.a + (toColor.a - fromColor.a) * t;
  
  if (a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * 比较两个元素的属性差异
 */
function compareElements(from: KeyElement, to: KeyElement): PropertyDiff[] {
  const diffs: PropertyDiff[] = [];
  
  // 位置差异
  if (from.position.x !== to.position.x) {
    diffs.push({ property: 'x', from: from.position.x, to: to.position.x, isColor: false });
  }
  if (from.position.y !== to.position.y) {
    diffs.push({ property: 'y', from: from.position.y, to: to.position.y, isColor: false });
  }
  
  // 大小差异
  if (from.size.width !== to.size.width) {
    diffs.push({ property: 'width', from: from.size.width, to: to.size.width, isColor: false });
  }
  if (from.size.height !== to.size.height) {
    diffs.push({ property: 'height', from: from.size.height, to: to.size.height, isColor: false });
  }
  
  // 样式差异
  const fromStyle = from.style || {};
  const toStyle = to.style || {};
  
  // 数值属性
  const numericProps: Array<{ key: keyof ShapeStyle; prop: AnimatableProperty }> = [
    { key: 'fillOpacity', prop: 'fillOpacity' },
    { key: 'opacity', prop: 'opacity' },
    { key: 'rotation', prop: 'rotation' },
    { key: 'scale', prop: 'scale' },
    { key: 'borderRadius', prop: 'borderRadius' },
    { key: 'strokeWidth', prop: 'strokeWidth' },
    { key: 'shadowBlur', prop: 'shadowBlur' },
    { key: 'shadowOffsetX', prop: 'shadowOffsetX' },
    { key: 'shadowOffsetY', prop: 'shadowOffsetY' },
    { key: 'blur', prop: 'blur' },
    { key: 'brightness', prop: 'brightness' },
    { key: 'contrast', prop: 'contrast' },
    { key: 'saturate', prop: 'saturate' },
    { key: 'fontSize', prop: 'fontSize' },
  ];
  
  for (const { key, prop } of numericProps) {
    const fromVal = fromStyle[key] as number | undefined;
    const toVal = toStyle[key] as number | undefined;
    if (fromVal !== toVal && (fromVal !== undefined || toVal !== undefined)) {
      diffs.push({
        property: prop,
        from: fromVal ?? getDefaultValue(prop),
        to: toVal ?? getDefaultValue(prop),
        isColor: false,
      });
    }
  }
  
  // 颜色属性
  const colorProps: Array<{ key: keyof ShapeStyle; prop: ColorProperty }> = [
    { key: 'fill', prop: 'fill' },
    { key: 'stroke', prop: 'stroke' },
    { key: 'shadowColor', prop: 'shadowColor' },
    { key: 'textColor', prop: 'textColor' },
  ];
  
  for (const { key, prop } of colorProps) {
    const fromVal = fromStyle[key] as string | undefined;
    const toVal = toStyle[key] as string | undefined;
    if (fromVal !== toVal && (fromVal || toVal)) {
      diffs.push({
        property: prop,
        from: fromVal || 'transparent',
        to: toVal || 'transparent',
        isColor: true,
      });
    }
  }
  
  return diffs;
}

/**
 * 获取属性默认值
 */
function getDefaultValue(prop: AnimatableProperty): number {
  switch (prop) {
    case 'opacity':
    case 'fillOpacity':
    case 'scale':
    case 'brightness':
    case 'contrast':
    case 'saturate':
      return 1;
    default:
      return 0;
  }
}

/**
 * 通过 ID 或名称匹配元素
 */
function findMatchingElement(element: KeyElement, elements: KeyElement[]): KeyElement | undefined {
  // 优先通过 ID 匹配
  const byId = elements.find(e => e.id === element.id);
  if (byId) return byId;
  
  // 其次通过名称匹配
  const byName = elements.find(e => e.name === element.name);
  if (byName) return byName;
  
  return undefined;
}

/**
 * 分析两个状态之间的差异
 */
export function analyzeStateDiff(
  fromElements: KeyElement[],
  toElements: KeyElement[]
): SmartAnimateResult {
  const matchedElements: ElementAnimation[] = [];
  const addedElements: KeyElement[] = [];
  const removedElements: KeyElement[] = [];
  const matchedToIds = new Set<string>();
  
  // 遍历 from 状态的元素
  for (const fromEl of fromElements) {
    const toEl = findMatchingElement(fromEl, toElements);
    
    if (toEl) {
      matchedToIds.add(toEl.id);
      const diffs = compareElements(fromEl, toEl);
      
      if (diffs.length > 0) {
        matchedElements.push({
          elementId: fromEl.id,
          elementName: fromEl.name,
          diffs,
        });
      }
    } else {
      // 元素在目标状态中不存在，需要淡出
      removedElements.push(fromEl);
    }
  }
  
  // 找出新增的元素
  for (const toEl of toElements) {
    if (!matchedToIds.has(toEl.id) && !findMatchingElement(toEl, fromElements)) {
      addedElements.push(toEl);
    }
  }
  
  return {
    matchedElements,
    addedElements,
    removedElements,
  };
}

// 动画状态
interface AnimatingElement {
  element: KeyElement;
  currentValues: Record<string, number | string>;
  targetValues: Record<string, number | string>;
}

/**
 * Smart Animate 控制器
 */
export class SmartAnimateController {
  private springEngine: SpringAnimationEngine;
  private animatingElements: Map<string, AnimatingElement> = new Map();
  private animationIds: string[] = [];
  
  constructor() {
    this.springEngine = new SpringAnimationEngine();
  }
  
  /**
   * 执行 Smart Animate
   */
  animate(
    fromElements: KeyElement[],
    toElements: KeyElement[],
    config: SpringConfig = {},
    onUpdate: (elements: KeyElement[]) => void,
    onComplete?: () => void
  ): void {
    // 停止之前的动画
    this.stop();
    
    // 分析差异
    const result = analyzeStateDiff(fromElements, toElements);
    
    // 创建元素映射
    const elementMap = new Map<string, KeyElement>();
    for (const el of fromElements) {
      elementMap.set(el.id, { ...el, style: { ...el.style }, position: { ...el.position }, size: { ...el.size } });
    }
    
    // 添加新元素（初始透明）
    for (const el of result.addedElements) {
      const newEl = { 
        ...el, 
        style: { ...el.style, fillOpacity: 0 }, 
        position: { ...el.position }, 
        size: { ...el.size } 
      };
      elementMap.set(el.id, newEl);
    }
    
    let completedCount = 0;
    const totalAnimations = result.matchedElements.length + 
                          result.addedElements.length + 
                          result.removedElements.length;
    
    if (totalAnimations === 0) {
      onUpdate(toElements);
      onComplete?.();
      return;
    }
    
    const checkComplete = () => {
      completedCount++;
      if (completedCount >= totalAnimations) {
        onComplete?.();
      }
    };
    
    // 动画匹配的元素
    for (const anim of result.matchedElements) {
      const element = elementMap.get(anim.elementId);
      if (!element) continue;
      
      const from: Record<string, number> = {};
      const to: Record<string, number> = {};
      const colorAnims: Array<{ prop: string; from: string; to: string }> = [];
      
      for (const diff of anim.diffs) {
        if (diff.isColor) {
          colorAnims.push({
            prop: diff.property,
            from: diff.from as string,
            to: diff.to as string,
          });
        } else {
          from[diff.property] = diff.from as number;
          to[diff.property] = diff.to as number;
        }
      }
      
      // 数值动画
      if (Object.keys(to).length > 0) {
        const animId = this.springEngine.animate(
          from,
          to,
          config,
          (values) => {
            this.applyValues(element, values, colorAnims, 0);
            onUpdate(Array.from(elementMap.values()));
          },
          checkComplete
        );
        this.animationIds.push(animId);
      }
      
      // 颜色动画（使用进度回调）
      if (colorAnims.length > 0 && Object.keys(to).length === 0) {
        const animId = this.springEngine.animate(
          { progress: 0 },
          { progress: 1 },
          config,
          (values) => {
            this.applyValues(element, {}, colorAnims, values.progress);
            onUpdate(Array.from(elementMap.values()));
          },
          checkComplete
        );
        this.animationIds.push(animId);
      }
    }
    
    // 淡入新元素
    for (const el of result.addedElements) {
      const element = elementMap.get(el.id);
      if (!element) continue;
      
      const targetOpacity = el.style?.fillOpacity ?? 1;
      
      const animId = this.springEngine.animate(
        { fillOpacity: 0 },
        { fillOpacity: targetOpacity },
        config,
        (values) => {
          if (element.style) {
            element.style.fillOpacity = values.fillOpacity;
          }
          onUpdate(Array.from(elementMap.values()));
        },
        checkComplete
      );
      this.animationIds.push(animId);
    }
    
    // 淡出移除的元素
    for (const el of result.removedElements) {
      const element = elementMap.get(el.id);
      if (!element) continue;
      
      const animId = this.springEngine.animate(
        { fillOpacity: element.style?.fillOpacity ?? 1 },
        { fillOpacity: 0 },
        config,
        (values) => {
          if (element.style) {
            element.style.fillOpacity = values.fillOpacity;
          }
          onUpdate(Array.from(elementMap.values()));
        },
        () => {
          // 动画完成后移除元素
          elementMap.delete(el.id);
          onUpdate(Array.from(elementMap.values()));
          checkComplete();
        }
      );
      this.animationIds.push(animId);
    }
  }
  
  /**
   * 应用动画值到元素
   */
  private applyValues(
    element: KeyElement,
    values: Record<string, number>,
    colorAnims: Array<{ prop: string; from: string; to: string }>,
    colorProgress: number
  ): void {
    // 应用数值
    for (const [key, value] of Object.entries(values)) {
      switch (key) {
        case 'x':
          element.position.x = value;
          break;
        case 'y':
          element.position.y = value;
          break;
        case 'width':
          element.size.width = value;
          break;
        case 'height':
          element.size.height = value;
          break;
        default:
          if (element.style) {
            (element.style as Record<string, number>)[key] = value;
          }
      }
    }
    
    // 应用颜色
    for (const colorAnim of colorAnims) {
      const interpolated = interpolateColor(colorAnim.from, colorAnim.to, colorProgress);
      if (element.style) {
        (element.style as Record<string, string>)[colorAnim.prop] = interpolated;
      }
    }
  }
  
  /**
   * 停止所有动画
   */
  stop(): void {
    for (const id of this.animationIds) {
      this.springEngine.stop(id);
    }
    this.animationIds = [];
    this.animatingElements.clear();
  }
}

// 导出单例
export const smartAnimateController = new SmartAnimateController();
