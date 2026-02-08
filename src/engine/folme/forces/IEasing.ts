/**
 * IEasing — 插值器包装（基于时间的缓动）
 * 移植自 kenefe 的 IEasing.as
 */

import type { InterpolatorFn } from '../Interpolator';

export class IEasing {
  public fromValue = 0;
  public toValue = 1;
  public curTime = 0;
  public duration: number;
  public interpolator: InterpolatorFn;
  public progress = 0;

  constructor(interpolator: InterpolatorFn, duration = 0.3) {
    this.interpolator = interpolator;
    this.duration = duration;
  }

  getValue(deltaTime: number): number {
    this.curTime += deltaTime;
    let per = this.curTime / (1000 * this.duration);
    per = Math.max(0, per);
    per = Math.min(1, per);
    per = this.interpolator(per);
    this.progress = per;
    // valFromPer: from + (to - from) * per
    return this.fromValue + (this.toValue - this.fromValue) * per;
  }

  clone(): IEasing {
    return new IEasing(this.interpolator, this.duration);
  }
}
