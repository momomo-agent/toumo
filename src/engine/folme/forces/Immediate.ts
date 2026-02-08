/**
 * Immediate — 立即设值
 * 移植自 kenefe 的 force/Immediate.as
 */

import { IForce } from './IForce';
import type { ForceInfo } from './IForce';

export class Immediate extends IForce {
  public override target = 0;

  getValueAndSpeed(
    value: number,
    _speed: number,
    _forceInfo: ForceInfo,
    _preForceInfo: ForceInfo | null,
  ): void {
    this.resultValue = value;
    this.resultSpeed = 0;
  }

  clone(): Immediate {
    return new Immediate();
  }
}
