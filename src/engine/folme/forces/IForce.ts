/**
 * IForce — 力的抽象基类
 * 移植自 kenefe 的 force/IForce.as
 */

export interface ForceInfo {
  isEasing: boolean;
  immediateTarget?: number;
  forceTarget?: number;
  targetCount: number;
  hasAcceleration: boolean;
  hasPerlin: boolean;
}

export abstract class IForce {
  public resultValue = 0;
  public resultSpeed = 0;
  public target?: number;

  abstract getValueAndSpeed(
    value: number,
    speed: number,
    forceInfo: ForceInfo,
    preForceInfo: ForceInfo | null,
  ): void;

  abstract clone(): IForce;
}
