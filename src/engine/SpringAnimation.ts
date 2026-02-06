/**
 * SpringAnimation - 弹簧动画引擎
 * 基于 Folme 的弹簧物理模拟
 */

import { lerp, SpringInterpolator, SpringPresets, Easing, EasingFunction } from './Interpolator';

// 动画状态
export enum AnimationStatus {
  STOPPED = 'stopped',
  PLAYING = 'playing',
  PAUSED = 'paused',
}

// 动画配置
export interface SpringConfig {
  damping?: number;      // 阻尼 0-1，越大越快停止
  response?: number;     // 响应时间，越小越快
  duration?: number;     // 持续时间 (秒)
  easing?: keyof typeof Easing | EasingFunction;
  useSpring?: boolean;   // 是否使用弹簧，默认 true
}

// 单个属性的动画
interface PropertyAnimation {
  from: number;
  to: number;
  current: number;
}

// 动画实例
export interface Animation {
  id: string;
  properties: Record<string, PropertyAnimation>;
  config: Required<SpringConfig>;
  status: AnimationStatus;
  progress: number;
  startTime: number;
  interpolator: SpringInterpolator | null;
  onUpdate?: (values: Record<string, number>) => void;
  onComplete?: () => void;
}

// 默认配置
const DEFAULT_CONFIG: Required<SpringConfig> = {
  damping: 0.8,
  response: 0.4,
  duration: 0.3,
  easing: 'linear',
  useSpring: true,
};

/**
 * 弹簧动画引擎
 */
export class SpringAnimationEngine {
  private animations: Map<string, Animation> = new Map();
  private rafId: number | null = null;
  private lastTime: number = 0;

  /**
   * 创建动画
   */
  animate(
    from: Record<string, number>,
    to: Record<string, number>,
    config?: SpringConfig,
    onUpdate?: (values: Record<string, number>) => void,
    onComplete?: () => void
  ): string {
    const id = `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };

    // 构建属性动画
    const properties: Record<string, PropertyAnimation> = {};
    for (const key of Object.keys(to)) {
      properties[key] = {
        from: from[key] ?? 0,
        to: to[key],
        current: from[key] ?? 0,
      };
    }

    // 创建插值器
    const interpolator = mergedConfig.useSpring
      ? new SpringInterpolator(mergedConfig.damping, mergedConfig.response)
      : null;

    const animation: Animation = {
      id,
      properties,
      config: mergedConfig,
      status: AnimationStatus.PLAYING,
      progress: 0,
      startTime: performance.now(),
      interpolator,
      onUpdate,
      onComplete,
    };

    this.animations.set(id, animation);
    this.startLoop();

    return id;
  }

  /**
   * 停止动画
   */
  stop(id: string): void {
    const anim = this.animations.get(id);
    if (anim) {
      anim.status = AnimationStatus.STOPPED;
      this.animations.delete(id);
    }
  }

  /**
   * 停止所有动画
   */
  stopAll(): void {
    this.animations.clear();
    this.stopLoop();
  }

  /**
   * 启动动画循环
   */
  private startLoop(): void {
    if (this.rafId !== null) return;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }

  /**
   * 停止动画循环
   */
  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * 动画帧更新
   */
  private tick(currentTime: number): void {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    const completedIds: string[] = [];

    for (const [id, anim] of this.animations) {
      if (anim.status !== AnimationStatus.PLAYING) continue;

      // 计算进度
      const elapsed = currentTime - anim.startTime;
      const rawProgress = Math.min(elapsed / (anim.config.duration * 1000), 1);

      // 应用插值
      let interpolatedProgress: number;
      if (anim.interpolator) {
        interpolatedProgress = anim.interpolator.getValue(rawProgress);
      } else {
        const easingFn = typeof anim.config.easing === 'function'
          ? anim.config.easing
          : Easing[anim.config.easing] || Easing.linear;
        interpolatedProgress = easingFn(rawProgress);
      }

      anim.progress = rawProgress;

      // 更新所有属性
      const values: Record<string, number> = {};
      for (const [key, prop] of Object.entries(anim.properties)) {
        prop.current = lerp(prop.from, prop.to, interpolatedProgress);
        values[key] = prop.current;
      }

      // 回调
      anim.onUpdate?.(values);

      // 检查完成
      if (rawProgress >= 1) {
        completedIds.push(id);
      }
    }

    // 处理完成的动画
    for (const id of completedIds) {
      const anim = this.animations.get(id);
      if (anim) {
        anim.status = AnimationStatus.STOPPED;
        anim.onComplete?.();
        this.animations.delete(id);
      }
    }

    // 继续循环或停止
    if (this.animations.size > 0) {
      this.rafId = requestAnimationFrame(this.tick.bind(this));
    } else {
      this.rafId = null;
    }
  }
}

// 全局单例
export const springEngine = new SpringAnimationEngine();

// 便捷函数
export function animateSpring(
  from: Record<string, number>,
  to: Record<string, number>,
  config?: SpringConfig
): Promise<void> {
  return new Promise((resolve) => {
    springEngine.animate(from, to, config, undefined, resolve);
  });
}

// 导出预设
export { SpringPresets };
