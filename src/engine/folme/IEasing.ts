/**
 * IEasing — 插值器包装（基于时间的缓动）
 * Ported from com.kenefe.folme.IEasing
 */
import type { InterpolatorFn } from './Interpolator';

export class IEasing {
  public easingFn: InterpolatorFn;
  public duration: number; // seconds
  public fromValue = 0;
  public toValue = 0;
  public progress = 0;
  private elapsed = 0;

  constructor(easingFn: InterpolatorFn, duration = 0.3) {
    this.easingFn = easingFn;
    this.duration = duration;
  }

  reset(from: number, to: number) {
    this.fromValue = from;
    this.toValue = to;
    this.elapsed = 0;
    this.progress = 0;
  }

  getValue(deltaTime: number): number {
    this.elapsed += deltaTime / 1000;
    this.progress = Math.min(this.elapsed / this.duration, 1);
    const easedProgress = this.easingFn(this.progress);
    return this.fromValue + (this.toValue - this.fromValue) * easedProgress;
  }
}
