/**
 * useSpringAnimation - React hook for spring animations
 * 在 React 组件中使用弹簧动画
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  SpringAnimationEngine, 
  SpringPresets 
} from '../engine/SpringAnimation';
import type { SpringConfig } from '../engine/SpringAnimation';

export interface AnimatedValues {
  [key: string]: number;
}

export interface UseSpringAnimationOptions {
  /** 初始值 */
  initialValues?: AnimatedValues;
  /** 弹簧配置 */
  config?: SpringConfig;
  /** 动画完成回调 */
  onComplete?: () => void;
}

export interface UseSpringAnimationReturn {
  /** 当前动画值 */
  values: AnimatedValues;
  /** 是否正在动画 */
  isAnimating: boolean;
  /** 开始动画到目标值 */
  animateTo: (target: AnimatedValues, config?: SpringConfig) => void;
  /** 立即设置值（无动画） */
  setValue: (values: AnimatedValues) => void;
  /** 停止当前动画 */
  stop: () => void;
}

/**
 * 弹簧动画 Hook
 */
export function useSpringAnimation(
  options: UseSpringAnimationOptions = {}
): UseSpringAnimationReturn {
  const { initialValues = {}, config, onComplete } = options;
  
  const [values, setValues] = useState<AnimatedValues>(initialValues);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const engineRef = useRef<SpringAnimationEngine | null>(null);
  const animationIdRef = useRef<string | null>(null);

  // 初始化引擎
  useEffect(() => {
    engineRef.current = new SpringAnimationEngine();
    return () => {
      engineRef.current?.stopAll();
    };
  }, []);

  // 开始动画
  const animateTo = useCallback((
    target: AnimatedValues, 
    overrideConfig?: SpringConfig
  ) => {
    if (!engineRef.current) return;

    // 停止之前的动画
    if (animationIdRef.current) {
      engineRef.current.stop(animationIdRef.current);
    }

    setIsAnimating(true);

    const mergedConfig = { ...config, ...overrideConfig };
    
    animationIdRef.current = engineRef.current.animate(
      values,
      target,
      mergedConfig,
      (newValues) => {
        setValues({ ...newValues });
      },
      () => {
        setIsAnimating(false);
        animationIdRef.current = null;
        onComplete?.();
      }
    );
  }, [values, config, onComplete]);

  // 立即设置值
  const setValue = useCallback((newValues: AnimatedValues) => {
    if (animationIdRef.current && engineRef.current) {
      engineRef.current.stop(animationIdRef.current);
      animationIdRef.current = null;
    }
    setIsAnimating(false);
    setValues(newValues);
  }, []);

  // 停止动画
  const stop = useCallback(() => {
    if (animationIdRef.current && engineRef.current) {
      engineRef.current.stop(animationIdRef.current);
      animationIdRef.current = null;
    }
    setIsAnimating(false);
  }, []);

  return {
    values,
    isAnimating,
    animateTo,
    setValue,
    stop,
  };
}

/**
 * 简化版：单值弹簧动画
 */
export function useSpringValue(
  initialValue: number = 0,
  config?: SpringConfig
): [number, (target: number) => void, boolean] {
  const { values, animateTo, isAnimating } = useSpringAnimation({
    initialValues: { value: initialValue },
    config,
  });

  const animate = useCallback((target: number) => {
    animateTo({ value: target });
  }, [animateTo]);

  return [values.value ?? initialValue, animate, isAnimating];
}

// 导出预设
export { SpringPresets };
