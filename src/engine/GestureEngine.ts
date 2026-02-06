/**
 * GestureEngine - 手势识别引擎
 * 
 * 功能：
 * - 监听 touch/mouse 事件
 * - 区分 tap/drag (dragThreshold: 10px)
 * - 识别 longPress (500ms)
 * - 触发对应的 Interaction actions
 */

import type {
  GestureType,
  GestureConfig,
  GestureRecognition,
  Interaction,
  InteractionAction,
  SwipeDirection,
} from '../types';

// 默认手势识别配置
const DEFAULT_RECOGNITION: GestureRecognition = {
  dragThreshold: 10,
  longPressDelay: 500,
  doubleTapInterval: 300,
  swipeVelocity: 0.5,
};

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
}

export class GestureEngine {
  private element: HTMLElement | null = null;
  private recognition: GestureRecognition;
  private callbacks: GestureCallbacks = {};
  private interactions: Interaction[] = [];
  private state: GestureState;
  private elementStates: Map<string, GestureState> = new Map();

  constructor(config?: Partial<GestureRecognition>) {
    this.recognition = { ...DEFAULT_RECOGNITION, ...config };
    this.state = this.createInitialState();
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
    };
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
    
    this.state.isPressed = true;
    this.state.startX = x;
    this.state.startY = y;
    this.state.currentX = x;
    this.state.currentY = y;
    this.state.startTime = Date.now();
    this.state.isDragging = false;
    this.state.totalDistance = 0;

    // 设置长按定时器
    this.state.longPressTimer = window.setTimeout(() => {
      if (this.state.isPressed && !this.state.isDragging) {
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

    const elementId = this.findElementId(target);
    const deltaX = x - this.state.currentX;
    const deltaY = y - this.state.currentY;
    const distanceFromStart = Math.sqrt(
      Math.pow(x - this.state.startX, 2) + Math.pow(y - this.state.startY, 2)
    );

    this.state.currentX = x;
    this.state.currentY = y;
    this.state.totalDistance += Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 判断是否开始拖拽
    if (!this.state.isDragging && distanceFromStart > this.recognition.dragThreshold) {
      this.state.isDragging = true;
      // 取消长按定时器
      if (this.state.longPressTimer) {
        clearTimeout(this.state.longPressTimer);
        this.state.longPressTimer = null;
      }
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

    const elementId = this.findElementId(target);
    const duration = Date.now() - this.state.startTime;
    const velocity = {
      x: (x - this.state.startX) / duration,
      y: (y - this.state.startY) / duration,
    };

    // 清除长按定时器
    if (this.state.longPressTimer) {
      clearTimeout(this.state.longPressTimer);
      this.state.longPressTimer = null;
    }

    if (this.state.isDragging) {
      // 判断是否为滑动
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      if (speed > this.recognition.swipeVelocity) {
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
    x: number,
    y: number,
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
    this.callbacks = ;
  }
}

export default GestureEngine;
