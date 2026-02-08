/**
 * Timeline — 基于 requestAnimationFrame 的主循环
 * 移植自 kenefe 的 Timeline.as
 * 
 * 核心职责：
 * - deltaTime 计算
 * - 管理所有活跃的动画回调
 * - ticker 循环
 */

export type TickCallback = (deltaTime: number) => void;

export class Timeline {
  // ─── 静态状态 ─────────────────────────────────────────────────────
  static deltaTime = 1000 / 60; // ms
  static currentTime = 0;

  // @ts-ignore used by setFrameRate
  private static _frameRate = 60;
  private static _timeScale = 1;
  private static _rafId: number | null = null;
  private static _lastTimestamp: number | null = null;

  // 回调列表（用 Map 方便增删）
  private static _callbacks = new Map<number, TickCallback>();
  private static _nextId = 0;

  // ─── 配置 ─────────────────────────────────────────────────────────
  static setFrameRate(val: number) {
    Timeline._frameRate = val;
  }

  static setTimeScale(val: number) {
    Timeline._timeScale = val;
  }

  // ─── 回调管理 ─────────────────────────────────────────────────────
  static add(callback: TickCallback): number {
    const id = Timeline._nextId++;
    Timeline._callbacks.set(id, callback);
    Timeline._ensureRunning();
    return id;
  }

  static remove(id: number) {
    Timeline._callbacks.delete(id);
    if (Timeline._callbacks.size === 0) {
      Timeline._stop();
    }
  }

  // ─── 内部循环 ─────────────────────────────────────────────────────
  private static _ensureRunning() {
    if (Timeline._rafId !== null) return;
    Timeline._lastTimestamp = null;
    Timeline._rafId = requestAnimationFrame(Timeline._tick);
  }

  private static _stop() {
    if (Timeline._rafId !== null) {
      cancelAnimationFrame(Timeline._rafId);
      Timeline._rafId = null;
      Timeline._lastTimestamp = null;
    }
  }

  private static _tick = (timestamp: number) => {
    if (Timeline._lastTimestamp === null) {
      Timeline._lastTimestamp = timestamp;
    }

    // 计算 deltaTime，限制最大值防止跳帧
    let dt = timestamp - Timeline._lastTimestamp;
    dt = Math.min(dt, 64); // 最大 ~4帧 的补偿
    dt /= Timeline._timeScale;
    Timeline._lastTimestamp = timestamp;

    Timeline.deltaTime = dt;
    Timeline.currentTime += dt;

    // 执行所有回调
    Timeline._callbacks.forEach((cb) => {
      cb(dt);
    });

    // 继续循环
    if (Timeline._callbacks.size > 0) {
      Timeline._rafId = requestAnimationFrame(Timeline._tick);
    } else {
      Timeline._rafId = null;
    }
  };
}
