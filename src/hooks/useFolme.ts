/**
 * useFolme — React hook for folme physics animation
 * 桥接 folme 引擎和 React 状态
 */
import { useRef, useCallback, useEffect } from 'react';
import { FolmeManager } from '../engine/folme/FolmeManager';
import { Spring } from '../engine/folme/forces/Spring';
import { IEasing } from '../engine/folme/IEasing';
import { Interpolator } from '../engine/folme/Interpolator';
import type { CurveConfig } from '../types';

export function useFolme(
  onRender: (values: Record<string, number>) => void,
) {
  const managerRef = useRef<FolmeManager | null>(null);

  if (!managerRef.current) {
    managerRef.current = new FolmeManager(onRender);
  }

  // 更新 render callback
  useEffect(() => {
    if (managerRef.current) {
      (managerRef.current as any).onRender = onRender;
    }
  }, [onRender]);

  const animateTo = useCallback((
    props: Record<string, number>,
    curve?: CurveConfig,
    onComplete?: () => void,
  ) => {
    const mgr = managerRef.current;
    if (!mgr) return;

    let easing;
    if (curve?.type === 'spring') {
      easing = new Spring(
        curve.damping ?? 0.95,
        curve.stiffness ? (1 / Math.sqrt(curve.stiffness / (curve.mass ?? 1))) : 0.35,
        curve.mass ?? 1,
      );
    } else if (curve?.type === 'bezier' && curve.controlPoints) {
      const [x1, y1, x2, y2] = curve.controlPoints;
      const fn = Interpolator.bezier(x1, y1, x2, y2);
      easing = new IEasing(fn, (curve.duration ?? 300) / 1000);
    } else {
      // 默认弹簧
      easing = new Spring(0.95, 0.35);
    }

    mgr.to(props, easing, { onComplete });
  }, []);

  const setTo = useCallback((props: Record<string, number>) => {
    managerRef.current?.setTo(props);
  }, []);

  useEffect(() => {
    return () => {
      managerRef.current?.destroy();
    };
  }, []);

  return { animateTo, setTo, manager: managerRef };
}
