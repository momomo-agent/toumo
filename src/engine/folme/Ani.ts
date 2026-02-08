/**
 * Ani — 单属性动画实例
 * Ported from com.kenefe.folme.Ani
 */
import type { IForce, ForceInfo } from './forces/IForce';
import { Immediate } from './forces/Immediate';
import { IEasing } from './IEasing';

export const AniStatus = {
  PLAYING: 0 as const,
  STOPPED: 1 as const,
};

export class Ani {
  public value = 0;
  public speed = 0;
  public status: number = AniStatus.STOPPED;
  public minVisibleChange = 1e-4;

  public forces: IForce[] | IEasing = [];

  private forceInfo: ForceInfo | null = null;
  private preForceInfo: ForceInfo | null = null;

  private getForceInfo(): ForceInfo {
    if (this.forces instanceof IEasing) {
      return { isEasing: true, targetCount: 0, hasAcceleration: false, hasPerlin: false };
    }

    let immediateTarget: number | undefined;
    let forceTarget: number | undefined;
    let targetCount = 0;
    const hasAcceleration = false;
    const hasPerlin = false;

    for (const force of this.forces) {
      if (force instanceof Immediate) {
        immediateTarget = force.target;
        break;
      } else {
        if (force.target !== undefined) {
          forceTarget = force.target;
          targetCount++;
        }
      }
    }

    return { isEasing: false, immediateTarget, forceTarget, targetCount, hasAcceleration, hasPerlin };
  }

  public updateForceInfo(): void {
    this.preForceInfo = this.forceInfo;
    this.forceInfo = this.getForceInfo();
  }

  public next(deltaTime: number): void {
    if (this.status === AniStatus.STOPPED) return;
    const fi = this.forceInfo!;

    if (fi.immediateTarget !== undefined) {
      this.value = fi.immediateTarget;
      this.speed = 0;
    } else if (fi.isEasing) {
      const easing = this.forces as IEasing;
      this.value = easing.getValue(deltaTime);
      this.speed = 0;
    } else {
      const forces = this.forces as IForce[];
      for (const force of forces) {
        force.getValueAndSpeed(this.value, this.speed, fi, this.preForceInfo);
        this.value = force.resultValue;
        this.speed = force.resultSpeed;
      }
    }
  }

  public nextFinish(): void {
    const fi = this.forceInfo!;

    if (fi.immediateTarget !== undefined) {
      this.status = AniStatus.STOPPED;
    } else if (fi.isEasing) {
      const easing = this.forces as IEasing;
      if (easing.progress >= 1) {
        this.value = easing.toValue;
        this.status = AniStatus.STOPPED;
      }
    } else {
      const forces = this.forces as IForce[];
      if (
        Math.abs(this.speed) < this.getMinVisibleSpeed() &&
        (fi.targetCount === 1 ? this.almost(this.value, fi.forceTarget!) : true) &&
        !fi.hasAcceleration && !fi.hasPerlin
      ) {
        if (forces.length === 1 && forces[0].target !== undefined) {
          this.value = forces[0].target;
        }
        this.status = AniStatus.STOPPED;
      }
    }
  }

  private getMinVisibleSpeed(): number {
    return this.minVisibleChange >= 1 ? this.minVisibleChange : 1e-4;
  }

  private almost(a: number, b: number): boolean {
    return Math.abs(a - b) < 1e-3;
  }
}
