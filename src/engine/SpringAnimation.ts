/**
 * SpringAnimation - 弹簧动画引擎
 * 现在由 Folme 力学引擎驱动
 */

import { SpringPresets, Easing } from './Interpolator';
import { FolmeManager } from './folme/FolmeManager';
import { Spring as FolmeSpring } from './folme/forces/Spring';
import { IEasing } from './folme/IEasing';

// 动画配置
export interface SpringConfig {
  damping?: number;
  response?: number;
  duration?: number;
  easing?: string | ((t: number) => number);
  useSpring?: boolean;
}

const DEFAULT_CONFIG: Required<SpringConfig> = {
  damping: 0.8,
  response: 0.4,
  duration: 0.3,
  easing: 'linear',
  useSpring: true,
};

/**
 * 弹簧动画引擎 — 由 Folme 力学引擎驱动
 */
export class SpringAnimationEngine {
  private managers: Map<string, FolmeManager> = new Map();

  animate(
    from: Record<string, number>,
    to: Record<string, number>,
    config?: SpringConfig,
    onUpdate?: (values: Record<string, number>) => void,
    onComplete?: () => void,
  ): string {
    const id = `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const merged = { ...DEFAULT_CONFIG, ...config };

    const mgr = new FolmeManager((values) => {
      onUpdate?.(values);
    });

    mgr.setTo(from);

    let easing: FolmeSpring | IEasing;
    if (merged.useSpring) {
      easing = new FolmeSpring(merged.damping, merged.response);
    } else {
      const fn = typeof merged.easing === 'function'
        ? merged.easing
        : (Easing as any)[merged.easing] || Easing.linear;
      easing = new IEasing(fn, merged.duration);
    }

    this.managers.set(id, mgr);
    mgr.to(to, easing, {
      onComplete: () => {
        this.managers.delete(id);
        onComplete?.();
      },
    });

    return id;
  }

  stop(id: string): void {
    const mgr = this.managers.get(id);
    if (mgr) {
      mgr.destroy();
      this.managers.delete(id);
    }
  }

  stopAll(): void {
    for (const mgr of this.managers.values()) {
      mgr.destroy();
    }
    this.managers.clear();
  }
}

// 全局单例
export const springEngine = new SpringAnimationEngine();

// 便捷函数
export function animateSpring(
  from: Record<string, number>,
  to: Record<string, number>,
  config?: SpringConfig,
): Promise<void> {
  return new Promise((resolve) => {
    springEngine.animate(from, to, config, undefined, resolve);
  });
}

export { SpringPresets };
