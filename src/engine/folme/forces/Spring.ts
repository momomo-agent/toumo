/**
 * Spring — 弹簧力
 * 移植自 kenefe 的 force/Spring.as
 * 
 * response: 响应时间（越小越快）
 * damping: 阻尼（越大越快停止）
 * mass: 质量
 */

import { IForce } from './IForce';
import type { ForceInfo } from './IForce';
import { Timeline } from '../Timeline';

export class Spring extends IForce {
  public response: number;
  public damping: number;
  public override target = 0;
  private _tension: number;
  private _damping: number;
  private mass: number;

  constructor(damping: number, response: number, mass = 1) {
    super();
    this.damping = damping;
    this.response = response;
    this.mass = mass;

    // 从 response/damping 计算 tension/damping
    this._tension = Math.pow(2 * Math.PI / response, 2) * mass;
    this._damping = 4 * Math.PI * damping * mass / response;
    this._damping = Math.min(this._damping, 60);
  }

  getValueAndSpeed(
    value: number,
    speed: number,
    _forceInfo: ForceInfo,
    _preForceInfo: ForceInfo | null,
  ): void {
    let f = 0;
    f -= speed * this._damping;
    f += this._tension * (this.target - value);
    f *= Timeline.deltaTime / 1000;

    speed += f / this.mass;
    value += speed * Timeline.deltaTime / 1000;

    this.resultValue = value;
    this.resultSpeed = speed;
  }

  clone(): Spring {
    return new Spring(this.damping, this.response, this.mass);
  }
}
