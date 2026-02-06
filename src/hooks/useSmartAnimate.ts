/**
 * useSmartAnimate - Smart Animate React Hook
 * 
 * 在状态切换时自动执行智能动画
 */

import { useState, useCallback, useRef } from 'react';
import type { KeyElement } from '../types';
import { SmartAnimateController, type SpringConfig } from '../engine';
import { SpringPresets } from '../engine/SpringAnimation';

export interface SmartAnimateOptions {
  // 弹簧配置
  springConfig?: SpringConfig;
  // 动画持续时间 (ms)
  duration?: number;
  // 是否启用
  enabled?: boolean;
}

export interface SmartAnimateState {
  // 当前渲染的元素
  elements: KeyElement[];
  // 是否正在动画中
  isAnimating: boolean;
  // 动画进度 0-1
  progress: number;
}

export interface SmartAnimateActions {
  // 执行状态切换动画
  animateTo: (toElements: KeyElement[], options?: SmartAnimateOptions) => void;
  // 立即切换（无动画）
  setElements: (elements: KeyElement[]) => void;
  // 停止动画
  stop: () => void;
}

const DEFAULT_OPTIONS: SmartAnimateOptions = {
  springConfig: {
    ...SpringPresets.default,
    duration: 0.4,
    useSpring: true,
  },
  enabled: true,
};

/**
 * Smart Animate Hook
 */
export function useSmartAnimate(
  initialElements: KeyElement[] = [],
  options: SmartAnimateOptions = {}
): [SmartAnimateState, SmartAnimateActions] {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  const [elements, setElementsState] = useState<KeyElement[]>(initialElements);
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const controllerRef = useRef<SmartAnimateController | null>(null);
  const fromElementsRef = useRef<KeyElement[]>(initialElements);
  
  // 获取或创建控制器
  const getController = useCallback(() => {
    if (!controllerRef.current) {
      controllerRef.current = new SmartAnimateController();
    }
    return controllerRef.current;
  }, []);
  
  // 执行动画
  const animateTo = useCallback((
    toElements: KeyElement[],
    animOptions?: SmartAnimateOptions
  ) => {
    const opts = { ...mergedOptions, ...animOptions };
    
    if (!opts.enabled) {
      setElementsState(toElements);
      fromElementsRef.current = toElements;
      return;
    }
    
    const controller = getController();
    const fromElements = fromElementsRef.current;
    
    setIsAnimating(true);
    setProgress(0);
    
    controller.animate(
      fromElements,
      toElements,
      {
        ...opts.springConfig,
        duration: (opts.duration || 400) / 1000,
      },
      (updatedElements) => {
        setElementsState([...updatedElements]);
      },
      () => {
        setIsAnimating(false);
        setProgress(1);
        fromElementsRef.current = toElements;
        setElementsState(toElements);
      }
    );
  }, [mergedOptions, getController]);
  
  // 立即设置（无动画）
  const setElements = useCallback((newElements: KeyElement[]) => {
    const controller = getController();
    controller.stop();
    setElementsState(newElements);
    fromElementsRef.current = newElements;
    setIsAnimating(false);
    setProgress(0);
  }, [getController]);
  
  // 停止动画
  const stop = useCallback(() => {
    const controller = getController();
    controller.stop();
    setIsAnimating(false);
  }, [getController]);
  
  return [
    { elements, isAnimating, progress },
    { animateTo, setElements, stop },
  ];
}

export default useSmartAnimate;
