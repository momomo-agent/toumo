/**
 * Interpolator - 插值器模块
 * 提供各种插值和缓动函数
 */

// 线性插值
export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

// 缓动函数类型
export type EasingFunction = (t: number) => number;

// 内置缓动函数
export const Easing = {
  // 线性
  linear: (t: number) => t,

  // Ease In (加速)
  easeInQuad: (t: number) => t * t,
  easeInCubic: (t: number) => t * t * t,
  easeInQuart: (t: number) => t * t * t * t,
  easeInQuint: (t: number) => t * t * t * t * t,
  easeInSine: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  easeInExpo: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  easeInCirc: (t: number) => 1 - Math.sqrt(1 - t * t),

  // Ease Out (减速)
  easeOutQuad: (t: number) => 1 - (1 - t) * (1 - t),
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  easeOutQuint: (t: number) => 1 - Math.pow(1 - t, 5),
  easeOutSine: (t: number) => Math.sin((t * Math.PI) / 2),
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeOutCirc: (t: number) => Math.sqrt(1 - Math.pow(t - 1, 2)),

  // Ease In Out (先加速后减速)
  easeInOutQuad: (t: number) =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeInOutQuart: (t: number) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInOutExpo: (t: number) =>
    t === 0
      ? 0
      : t === 1
        ? 1
        : t < 0.5
          ? Math.pow(2, 20 * t - 10) / 2
          : (2 - Math.pow(2, -20 * t + 10)) / 2,

  // Bounce
  easeOutBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },

  // Back (带回弹)
  easeInBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  // Elastic (弹性)
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

/**
 * 弹簧插值器 - 基于 Folme FakeSpring
 * 使用阻尼振荡公式模拟弹簧效果
 */
export class SpringInterpolator {
  private m = 1.0; // 质量
  private k: number; // 刚度
  private c: number; // 阻尼系数
  private w: number; // 角频率
  private r: number; // 衰减率
  private c1: number; // 系数1
  private c2: number; // 系数2
  
  damping: number;
  response: number;

  constructor(damping: number = 0.8, response: number = 0.4) {
    this.damping = damping;
    this.response = response;
    const mInitial = -1.0;

    // 计算弹簧参数
    this.k = Math.pow((2.0 * Math.PI) / response, 2.0) * this.m;
    this.c = (4.0 * Math.PI * damping * this.m) / response;
    this.w = Math.sqrt(4.0 * this.m * this.k - this.c * this.c) / (2.0 * this.m);
    this.r = -(this.c / (2 * this.m));
    this.c1 = mInitial;
    this.c2 = (0 - this.r * mInitial) / this.w;
  }

  /**
   * 计算弹簧插值
   * @param t 进度 0-1
   * @returns 插值后的进度（可能超过1或小于0，因为弹簧会过冲）
   */
  getValue(t: number): number {
    if (t <= 0) return 0;
    if (t >= 1) return 1;

    // 弹簧公式: e^(rt) * (c1*cos(wt) + c2*sin(wt)) + 1
    const result =
      Math.pow(Math.E, this.r * t) *
        (this.c1 * Math.cos(this.w * t) + this.c2 * Math.sin(this.w * t)) +
      1.0;

    return result;
  }
}

// 预设弹簧配置
export const SpringPresets = {
  // 默认 - 平滑自然
  default: { damping: 0.8, response: 0.4 },
  // 弹性 - 明显回弹
  bouncy: { damping: 0.5, response: 0.5 },
  // 僵硬 - 快速无回弹
  stiff: { damping: 1.0, response: 0.2 },
  // 柔软 - 缓慢平滑
  gentle: { damping: 0.9, response: 0.6 },
  // 快速 - 迅速响应
  snappy: { damping: 0.85, response: 0.25 },
};
