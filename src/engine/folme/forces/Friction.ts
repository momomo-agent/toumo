/**
 * Friction — 摩擦力（指数衰减）
 * 移植自 kenefe 的 force/Friction.as
 */

import { IForce } from './IForce';
import type { ForceInfo } from './IForce';
import { Timeline } from '../Timeline';

export class Friction extends IForce {
  public friction: number;
  public sourceFriction: number;

  constructor(friction = 1 / 2.1) {
    super();
    this.sourceFriction = friction;
    const dragLog = friction * -4.2;
    const drag = Math.pow(Math.E, dragLog);
    this.friction = drag;
  }

  getValueAndSpeed(
    value: number,
    speed: number,
    _forceInfo: ForceInfo,
    _preForceInfo: ForceInfo | null,
  ): void {
    const preSpeed = speed;
    speed = speed * Math.pow(this.friction, Timeline.deltaTime / 1000);
    value += (preSpeed + speed) / 2 * Timeline.deltaTime / 1000;

    this.resultValue = value;
    this.resultSpeed = speed;
  }

  clone(): Friction {
    return new Friction(this.sourceFriction);
  }
}
