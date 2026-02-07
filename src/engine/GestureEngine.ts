/**
 * GestureEngine - 手势识别引擎
 * 
 * 功能：
 * - 监听 touch/mouse 事件
 * - 区分 tap/drag (dragThreshold: 10px)
 * - 识别 longPress (500ms)
 * - 触发对应的 Interaction actions
 * - touchInfo 完整触摸信息记录
 * - SpeedTracker 速度追踪
 * 
 * 参考: Folme/MouseAction.as
 */

import type {
  GestureType,
  GestureConfig,
  GestureRecognition,
  SwipeDirection,
} from '../types';
type Interaction = any;

// 默认手势识别配置
const DEFAULT_RECOGNITION: GestureRecognition = {
  dragThreshold: 10,
  longPressDelay: 500,
  doubleTapInterval: 300,
  swipeVelocity: 0.5,
};

// ============ TouchInfo 类型定义 ============

/** 历史轨迹点 */
export interface HistoryPoint {
  x: number;
  y: number;
  time: number;
}

/** 速度信息 */
export interface SpeedInfo {
  x: number;
  y: number;
  total: number;
}

/** 触摸信息 - 参考 MouseAction.as 的 touchInfo */
export interface TouchInfo {
  // 状态标记
  isClick: boolean;
  hasLongClick: boolean;
  hasDown: boolean;
  hasMove: boolean;
  hasUp: boolean;
  
  // 位置信息
  mouseDownX: number;
  mouseDownY: number;
  mouseUpX: number | undefined;
  mouseUpY: number | undefined;
  offsetX: number;
  offsetY: number;
  
  // 方向信息
  direction: boolean | undefined;  // true=横向, false=纵向
  directionPositive: boolean | undefined;  // true=正方向(右/下)
  directionAngle: number;  // 角度 0-360
  
  // 时间信息
  mouseDownTime: number;
  
  // 速度追踪
  speed: SpeedInfo;
  
  // 历史轨迹
  history: HistoryPoint[];
}

// ============ SpeedTracker 速度追踪器 ============

/** 速度追踪器配置 */
interface SpeedTrackerConfig {
  maxHistoryLength: number;  // 最大历史记录数
  minTimeDelta: number;      // 最小时间差 (ms)
  maxTimeDelta: number;      // 最大时间差 (ms)
}

const DEFAULT_SPEED_CONFIG: SpeedTrackerConfig = {
  maxHistoryLength: 50,
  minTimeDelta: 30,
  maxTimeDelta: 100,
};

/**
 * SpeedTracker - 速度追踪器
 * 记录最近几帧的位置，计算瞬时速度
 */
class SpeedTracker {
  private history: HistoryPoint[] = [];
  private config: SpeedTrackerConfig;

  constructor(config?: Partial<SpeedTrackerConfig>) {
    this.config = { ...DEFAULT_SPEED_CONFIG, ...config };
  }

  /** 重置历史记录 */
  reset(): void {
    this.history = [];
  }

  /** 添加位置点 */
  push(x: number, y: number): void {
    const time = Date.now();
    this.history.push({ x, y, time });
    
    // 限制历史记录长度
    while (this.history.length > this.config.maxHistoryLength) {
      this.history.shift();
    }
  }

  /** 获取历史记录 */
  getHistory(): HistoryPoint[] {
    return [...this.history];
  }

  /**
   * 计算瞬时速度
   * 参考 MouseAction.as 的 pushHistory 算法
   */
  calculateSpeed(): SpeedInfo {
    if (this.history.length < 2) {
      return { x: 0, y: 0, total: 0 };
    }

    const len = this.history.length;
    const last = this.history[len - 1];
    const prev = this.history[len - 2];
    
    const dt1 = last.time - prev.time;
    if (dt1 === 0) {
      return { x: 0, y: 0, total: 0 };
    }

    // 计算最近两帧的速度
    const tmp1X = (last.x - prev.x) / (dt1 / 1000);
    const tmp1Y = (last.y - prev.y) / (dt1 / 1000);

    let speedX: number | null = null;
    let speedY: number | null = null;

    // 查找合适时间范围内的历史点计算更稳定的速度
    for (let i = len - 1; i >= 0; i--) {
      const point = this.history[i];
      const dt = last.time - point.time;
      
      if (dt > this.config.minTimeDelta && dt < this.config.maxTimeDelta) {
        const tmp2X = (last.x - point.x) / (dt / 1000);
        const tmp2Y = (last.y - point.y) / (dt / 1000);

        speedX = tmp2X;
        speedY = tmp2Y;

        // 如果方向一致，取较大值（参考 MouseAction.as）
        if (tmp1X * tmp2X > 0) {
          speedX = tmp2X > 0 ? Math.max(tmp1X, tmp2X) : Math.min(tmp1X, tmp2X);
        }
        if (tmp1Y * tmp2Y > 0) {
          speedY = tmp2Y > 0 ? Math.max(tmp1Y, tmp2Y) : Math.min(tmp1Y, tmp2Y);
        }

        break;
      }
    }

    // 如果没找到合适的历史点，使用最近两帧的速度
    if (speedX === null) speedX = tmp1X;
    if (speedY === null) speedY = tmp1Y;

    const total = Math.sqrt(speedX * speedX + speedY * speedY);

    return { x: speedX, y: speedY, total };
  }
}

// 手势状态
interface GestureState {
  isPressed: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  lastTapTime: number;
  longPressTimer: number | null;
  isDragging: boolean;
  totalDistance: number;
  hasStartMoveTriggered: boolean;  // 是否已触发 startMove
}

// 手势事件回调
export interface GestureCallbacks {
  onTap?: (elementId: string, x: number, y: number) => void;
  onDoubleTap?: (elementId: string, x: number, y: number) => void;
  onLongPress?: (elementId: string, x: number, y: number) => void;
  onPanStart?: (elementId: string, x: number, y: number) => void;
  onPanMove?: (elementId: string, x: number, y: number, deltaX: number, deltaY: number) => void;
  onPanEnd?: (elementId: string, x: number, y: number, velocity: { x: number; y: number }) => void;
  onSwipe?: (elementId: string, direction: SwipeDirection) => void;
  onInteraction?: (interaction: Interaction, gesture: GestureType) => void;
  // 新增: 开始移动事件 (移动超过阈值时触发一次)
  onMouseStartMove?: (elementId: string, touchInfo: TouchInfo) => void;
  // 新增: 移动中事件 (每帧触发)
  onMouseMoving?: (elementId: string, touchInfo: TouchInfo) => void;
  // 新增: 结束移动事件
  onMouseEndMove?: (elementId: string, touchInfo: TouchInfo) => void;
}

export class GestureEngine {
  private element: HTMLElement | null = null;
  private recognition: GestureRecognition;
  private callbacks: GestureCallbacks = {};
  private interactions: Interaction[] = [];
  private state: GestureState;
  private speedTracker: SpeedTracker;
  private touchInfo: TouchInfo;
  private currentElementId: string | null = null;

  constructor(config?: Partial<GestureRecognition>) {
    this.recognition = { ...DEFAULT_RECOGNITION, ...config };
    this.state = this.createInitialState();
    this.speedTracker = new SpeedTracker();
    this.touchInfo = this.createInitialTouchInfo();
  }

  private createInitialState(): GestureState {
    return {
      isPressed: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      startTime: 0,
      lastTapTime: 0,
      longPressTimer: null,
      isDragging: false,
      totalDistance: 0,
      hasStartMoveTriggered: false,
    };
  }

  /** 创建初始 touchInfo */
  private createInitialTouchInfo(): TouchInfo {
    return {
      isClick: false,
      hasLongClick: false,
      hasDown: false,
      hasMove: false,
      hasUp: false,
      mouseDownX: 0,
      mouseDownY: 0,
      mouseUpX: undefined,
      mouseUpY: undefined,
      offsetX: 0,
      offsetY: 0,
      direction: undefined,
      directionPositive: undefined,
      directionAngle: 0,
      mouseDownTime: 0,
      speed: { x: 0, y: 0, total: 0 },
      history: [],
    };
  }

  /** 获取当前 touchInfo (只读副本) */
  getTouchInfo(): TouchInfo {
    return { ...this.touchInfo, speed: { ...this.touchInfo.speed }, history: [...this.touchInfo.history] };
  }

  /**
   * 绑定到 DOM 元素
   */
  bind(element: HTMLElement): void {
    this.element = element;
    this.addEventListeners();
  }

  /**
   * 解绑
   */
  unbind(): void {
    if (this.element) {
      this.removeEventListeners();
      this.element = null;
    }
  }

  /**
   * 设置回调
   */
  setCallbacks(callbacks: GestureCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * 设置交互列表
   */
  setInteractions(interactions: Interaction[]): void {
    this.interactions = interactions.filter(i => i.enabled);
  }

  /**
   * 添加事件监听
   */
  private addEventListeners(): void {
    if (!this.element) return;

    // Touch events
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd);
    this.element.addEventListener('touchcancel', this.handleTouchCancel);

    // Mouse events (for desktop)
    this.element.addEventListener('mousedown', this.handleMouseDown);
    this.element.addEventListener('mousemove', this.handleMouseMove);
    this.element.addEventListener('mouseup', this.handleMouseUp);
    this.element.addEventListener('mouseleave', this.handleMouseLeave);
  }

  /**
   * 移除事件监听
   */
  private removeEventListeners(): void {
    if (!this.element) return;

    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);

    this.element.removeEventListener('mousedown', this.handleMouseDown);
    this.element.removeEventListener('mousemove', this.handleMouseMove);
    this.element.removeEventListener('mouseup', this.handleMouseUp);
    this.element.removeEventListener('mouseleave', this.handleMouseLeave);
  }

  /**
   * 获取触摸/鼠标位置
   */
  private getPosition(e: TouchEvent | MouseEvent): { x: number; y: number } {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  }

  /**
   * 查找触发元素的 ID
   */
  private findElementId(target: EventTarget | null): string | null {
    let el = target as HTMLElement | null;
    while (el && el !== this.element) {
      const id = el.dataset.elementId;
      if (id) return id;
      el = el.parentElement;
    }
    return null;
  }

  /**
   * 开始按下
   */
  private handleStart(x: number, y: number, target: EventTarget | null): void {
    const elementId = this.findElementId(target);
    this.currentElementId = elementId;
    
    this.state.isPressed = true;
    this.state.startX = x;
    this.state.startY = y;
    this.state.currentX = x;
    this.state.currentY = y;
    this.state.startTime = Date.now();
    this.state.isDragging = false;
    this.state.totalDistance = 0;
    this.state.hasStartMoveTriggered = false;

    // 初始化 touchInfo
    this.touchInfo = {
      isClick: false,
      hasLongClick: false,
      hasDown: true,
      hasMove: false,
      hasUp: false,
      mouseDownX: x,
      mouseDownY: y,
      mouseUpX: undefined,
      mouseUpY: undefined,
      offsetX: 0,
      offsetY: 0,
      direction: undefined,
      directionPositive: undefined,
      directionAngle: 0,
      mouseDownTime: Date.now(),
      speed: { x: 0, y: 0, total: 0 },
      history: [],
    };

    // 初始化速度追踪器
    this.speedTracker.reset();
    this.speedTracker.push(x, y);
    this.touchInfo.history = this.speedTracker.getHistory();

    // 设置长按定时器
    this.state.longPressTimer = window.setTimeout(() => {
      if (this.state.isPressed && !this.state.isDragging) {
        this.touchInfo.hasLongClick = true;
        this.triggerGesture('longPress', elementId, x, y);
        this.callbacks.onLongPress?.(elementId || '', x, y);
      }
    }, this.recognition.longPressDelay);
  }

  /**
   * 移动中
   */
  private handleMove(x: number, y: number, target: EventTarget | null): void {
    if (!this.state.isPressed) return;

    const elementId = this.findElementId(target) || this.currentElementId;
    const deltaX = x - this.state.currentX;
    const deltaY = y - this.state.currentY;
    const dx = x - this.state.startX;
    const dy = y - this.state.startY;
    const distanceFromStart = Math.sqrt(dx * dx + dy * dy);

    this.state.currentX = x;
    this.state.currentY = y;
    this.state.totalDistance += Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 更新速度追踪
    this.speedTracker.push(x, y);
    this.touchInfo.speed = this.speedTracker.calculateSpeed();
    this.touchInfo.history = this.speedTracker.getHistory();

    // 触发 onMouseMoving (每帧)
    this.callbacks.onMouseMoving?.(elementId || '', this.touchInfo);

    // 判断是否第一次超过移动阈值 (onMouseStartMove)
    if (!this.state.hasStartMoveTriggered && distanceFromStart > this.recognition.dragThreshold) {
      this.state.hasStartMoveTriggered = true;
      this.touchInfo.hasMove = true;
      
      // 计算方向
      this.touchInfo.direction = Math.abs(dx) > Math.abs(dy);  // true=横向
      this.touchInfo.directionPositive = this.touchInfo.direction ? dx > 0 : dy > 0;

      // 触发 onMouseStartMove (只触发一次)
      this.callbacks.onMouseStartMove?.(elementId || '', this.touchInfo);

      // 取消长按定时器
      if (this.state.longPressTimer) {
        clearTimeout(this.state.longPressTimer);
        this.state.longPressTimer = null;
      }
    }

    // 判断是否开始拖拽 (panStart)
    if (!this.state.isDragging && distanceFromStart > this.recognition.dragThreshold) {
      this.state.isDragging = true;
      this.triggerGesture('panStart', elementId, this.state.startX, this.state.startY);
      this.callbacks.onPanStart?.(elementId || '', this.state.startX, this.state.startY);
    }

    if (this.state.isDragging) {
      this.triggerGesture('panMove', elementId, x, y);
      this.callbacks.onPanMove?.(elementId || '', x, y, deltaX, deltaY);
    }
  }

  /**
   * 结束
   */
  private handleEnd(x: number, y: number, target: EventTarget | null): void {
    if (!this.state.isPressed) return;

    const elementId = this.findElementId(target) || this.currentElementId;
    const duration = Date.now() - this.state.startTime;
    
    // 最后更新一次速度
    this.speedTracker.push(x, y);
    const speed = this.speedTracker.calculateSpeed();
    
    const velocity = {
      x: speed.x,
      y: speed.y,
    };

    // 更新 touchInfo
    this.touchInfo.hasDown = false;
    this.touchInfo.hasUp = true;
    this.touchInfo.mouseUpX = x;
    this.touchInfo.mouseUpY = y;
    this.touchInfo.offsetX = x - this.touchInfo.mouseDownX;
    this.touchInfo.offsetY = y - this.touchInfo.mouseDownY;
    this.touchInfo.speed = speed;
    this.touchInfo.history = this.speedTracker.getHistory();
    
    // 计算方向角度 (0-360)
    this.touchInfo.directionAngle = Math.atan2(speed.y, speed.x) * 180 / Math.PI;
    if (this.touchInfo.directionAngle < 0) {
      this.touchInfo.directionAngle = 360 + this.touchInfo.directionAngle;
    }

    // 清除长按定时器
    if (this.state.longPressTimer) {
      clearTimeout(this.state.longPressTimer);
      this.state.longPressTimer = null;
    }

    // 判断是否为点击
    this.touchInfo.isClick = !this.touchInfo.hasMove && duration < this.recognition.longPressDelay;

    if (this.state.isDragging) {
      // 触发 onMouseEndMove
      if (!this.touchInfo.isClick) {
        this.callbacks.onMouseEndMove?.(elementId || '', this.touchInfo);
      }

      // 判断是否为滑动
      if (speed.total > this.recognition.swipeVelocity) {
        const direction = this.getSwipeDirection(velocity.x, velocity.y);
        this.triggerGesture('swipe', elementId, x, y, direction);
        this.callbacks.onSwipe?.(elementId || '', direction);
      }
      
      this.triggerGesture('panEnd', elementId, x, y);
      this.callbacks.onPanEnd?.(elementId || '', x, y, velocity);
    } else {
      // 判断是否为双击
      const now = Date.now();
      if (now - this.state.lastTapTime < this.recognition.doubleTapInterval) {
        this.triggerGesture('doubleTap', elementId, x, y);
        this.callbacks.onDoubleTap?.(elementId || '', x, y);
        this.state.lastTapTime = 0;
      } else {
        // 单击
        this.triggerGesture('tap', elementId, x, y);
        this.callbacks.onTap?.(elementId || '', x, y);
        this.state.lastTapTime = now;
      }
    }

    this.state.isPressed = false;
    this.state.isDragging = false;
    this.currentElementId = null;
  }

  /**
   * 取消
   */
  private handleCancel(): void {
    if (this.state.longPressTimer) {
      clearTimeout(this.state.longPressTimer);
      this.state.longPressTimer = null;
    }
    this.state.isPressed = false;
    this.state.isDragging = false;
  }

  /**
   * 获取滑动方向
   */
  private getSwipeDirection(vx: number, vy: number): SwipeDirection {
    const absX = Math.abs(vx);
    const absY = Math.abs(vy);

    if (absX > absY) {
      return vx > 0 ? 'right' : 'left';
    } else {
      return vy > 0 ? 'down' : 'up';
    }
  }

  /**
   * 触发手势，匹配交互
   */
  private triggerGesture(
    gesture: GestureType,
    elementId: string | null,
    _x: number,
    _y: number,
    direction?: SwipeDirection
  ): void {
    if (!elementId) return;

    // 查找匹配的交互
    const matchedInteractions = this.interactions.filter(interaction => {
      if (interaction.elementId !== elementId) return false;
      if (!this.matchGesture(interaction.gesture, gesture, direction)) return false;
      return true;
    });

    // 触发回调
    matchedInteractions.forEach(interaction => {
      this.callbacks.onInteraction?.(interaction, gesture);
    });
  }

  /**
   * 匹配手势配置
   */
  private matchGesture(
    config: GestureConfig,
    gesture: GestureType,
    direction?: SwipeDirection
  ): boolean {
    // 直接匹配
    if (config.type === gesture) {
      // 如果是滑动，检查方向
      if (gesture === 'swipe' && config.direction && config.direction !== 'any') {
        return config.direction === direction;
      }
      return true;
    }

    // pan 系列匹配 drag
    if (config.type === 'pan' && (gesture === 'panStart' || gesture === 'panMove' || gesture === 'panEnd')) {
      return true;
    }

    return false;
  }

  // Touch event handlers
  private handleTouchStart = (e: TouchEvent): void => {
    const pos = this.getPosition(e);
    this.handleStart(pos.x, pos.y, e.target);
  };

  private handleTouchMove = (e: TouchEvent): void => {
    const pos = this.getPosition(e);
    this.handleMove(pos.x, pos.y, e.target);
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    const pos = this.getPosition(e);
    this.handleEnd(pos.x, pos.y, e.target);
  };

  private handleTouchCancel = (): void => {
    this.handleCancel();
  };

  // Mouse event handlers
  private handleMouseDown = (e: MouseEvent): void => {
    const pos = this.getPosition(e);
    this.handleStart(pos.x, pos.y, e.target);
  };

  private handleMouseMove = (e: MouseEvent): void => {
    const pos = this.getPosition(e);
    this.handleMove(pos.x, pos.y, e.target);
  };

  private handleMouseUp = (e: MouseEvent): void => {
    const pos = this.getPosition(e);
    this.handleEnd(pos.x, pos.y, e.target);
  };

  private handleMouseLeave = (): void => {
    if (this.state.isPressed) {
      this.handleCancel();
    }
  };

  /**
   * 销毁引擎
   */
  destroy(): void {
    this.unbind();
    this.handleCancel();
    this.interactions = [];
    this.callbacks = {};
  }
}

export default GestureEngine;
