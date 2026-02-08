/**
 * FolmeManager — 管理一个元素的所有属性动画
 * Ported from com.kenefe.folme.FolmeManager
 */
import { Ani, AniStatus } from './Ani';
import { Timeline } from './Timeline';
import { IEasing } from './IEasing';
import { Spring } from './forces/Spring';
import type { IForce } from './forces/IForce';

export type FolmeRenderCallback = (values: Record<string, number>) => void;
export type FolmeCompleteCallback = () => void;

export class FolmeManager {
  private anis: Map<string, Ani> = new Map();
  private onRender: FolmeRenderCallback | null = null;
  private onComplete: FolmeCompleteCallback | null = null;
  private _ticking = false;
  private _tickId: number | null = null;

  constructor(onRender?: FolmeRenderCallback) {
    if (onRender) this.onRender = onRender;
  }

  getAni(id: string): Ani {
    let ani = this.anis.get(id);
    if (!ani) {
      ani = new Ani();
      this.anis.set(id, ani);
    }
    return ani;
  }

  /** 动画到目标值 */
  to(
    props: Record<string, number>,
    easing?: IForce | IEasing | IForce[],
    options?: { onComplete?: FolmeCompleteCallback },
  ) {
    if (options?.onComplete) this.onComplete = options.onComplete;

    for (const [key, targetVal] of Object.entries(props)) {
      const ani = this.getAni(key);

      if (easing instanceof IEasing) {
        const e = new IEasing(easing.easingFn, easing.duration);
        e.reset(ani.value, targetVal);
        ani.forces = e;
      } else if (Array.isArray(easing)) {
        const forces = easing.map(f => {
          const c = f.clone();
          c.target = targetVal;
          return c;
        });
        ani.forces = forces;
      } else if (easing) {
        const force = easing.clone();
        force.target = targetVal;
        ani.forces = [force];
      } else {
        // 默认弹簧
        const spring = new Spring(0.95, 0.35);
        spring.target = targetVal;
        ani.forces = [spring];
      }

      ani.status = AniStatus.PLAYING;
      ani.updateForceInfo();
    }

    this._startTick();
  }

  /** 立即设值（无动画） */
  setTo(props: Record<string, number>) {
    for (const [key, val] of Object.entries(props)) {
      const ani = this.getAni(key);
      ani.value = val;
      ani.speed = 0;
      ani.status = AniStatus.STOPPED;
    }
    this._render();
  }

  /** 获取当前所有值 */
  getValues(): Record<string, number> {
    const values: Record<string, number> = {};
    for (const [key, ani] of this.anis) {
      values[key] = ani.value;
    }
    return values;
  }

  isPlaying(): boolean {
    for (const ani of this.anis.values()) {
      if (ani.status === AniStatus.PLAYING) return true;
    }
    return false;
  }

  destroy() {
    this._stopTick();
    this.anis.clear();
    this.onRender = null;
    this.onComplete = null;
  }

  private _tick = (deltaTime: number) => {
    let allStopped = true;

    for (const ani of this.anis.values()) {
      if (ani.status === AniStatus.PLAYING) {
        ani.next(deltaTime);
        ani.nextFinish();
        if (ani.status === AniStatus.PLAYING) allStopped = false;
      }
    }

    this._render();

    if (allStopped) {
      this._stopTick();
      this.onComplete?.();
    }
  };

  private _render() {
    if (this.onRender) {
      this.onRender(this.getValues());
    }
  }

  private _startTick() {
    if (!this._ticking) {
      this._ticking = true;
      this._tickId = Timeline.add(this._tick);
    }
  }

  private _stopTick() {
    if (this._ticking) {
      this._ticking = false;
      if (this._tickId !== null) {
        Timeline.remove(this._tickId);
        this._tickId = null;
      }
    }
  }
}
