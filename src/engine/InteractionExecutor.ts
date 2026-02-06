/**
 * InteractionExecutor - 交互动作执行器
 * 
 * 执行交互动作：
 * - goToState: 切换 keyframe
 * - setVariable: 更新变量值
 * - haptic: 触觉反馈
 */

import type {
  Interaction,
  InteractionAction,
  InteractionCondition,
  Variable,
  HapticType,
} from '../types';

// 执行上下文
export interface ExecutionContext {
  // 当前变量值
  variables: Map<string, Variable>;
  // 切换状态回调
  onGoToState?: (elementId: string, stateId: string, animation?: InteractionAction['animation']) => void;
  // 更新变量回调
  onSetVariable?: (variableId: string, value: string | number | boolean) => void;
  // 导航回调
  onNavigate?: (frameId: string) => void;
  // 打开弹层回调
  onOpenOverlay?: (overlayId: string, position: string) => void;
  // 关闭弹层回调
  onCloseOverlay?: (overlayId: string) => void;
  // 滚动回调
  onScrollTo?: (targetId: string, offset: number) => void;
  // 打开链接回调
  onOpenUrl?: (url: string, newTab: boolean) => void;
}

export class InteractionExecutor {
  private context: ExecutionContext;

  constructor(context: ExecutionContext) {
    this.context = context;
  }

  /**
   * 更新执行上下文
   */
  updateContext(context: Partial<ExecutionContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * 执行交互
   */
  execute(interaction: Interaction): void {
    // 检查条件
    if (interaction.conditions && !this.checkConditions(interaction.conditions)) {
      return;
    }

    // 执行所有动作
    interaction.actions.forEach(action => {
      this.executeAction(action);
    });
  }

  /**
   * 检查条件
   */
  private checkConditions(conditions: InteractionCondition[]): boolean {
    return conditions.every(condition => this.checkCondition(condition));
  }

  /**
   * 检查单个条件
   */
  private checkCondition(condition: InteractionCondition): boolean {
    const variable = this.context.variables.get(condition.variableId);
    if (!variable) return false;

    const currentValue = variable.currentValue ?? variable.defaultValue;
    const targetValue = condition.value;

    switch (condition.operator) {
      case '==':
        return currentValue === targetValue;
      case '!=':
        return currentValue !== targetValue;
      case '>':
        return Number(currentValue) > Number(targetValue);
      case '<':
        return Number(currentValue) < Number(targetValue);
      case '>=':
        return Number(currentValue) >= Number(targetValue);
      case '<=':
        return Number(currentValue) <= Number(targetValue);
      default:
        return false;
    }
  }

  /**
   * 执行单个动作
   */
  private executeAction(action: InteractionAction): void {
    switch (action.type) {
      case 'goToState':
        this.executeGoToState(action);
        break;
      case 'toggleState':
        this.executeToggleState(action);
        break;
      case 'setVariable':
        this.executeSetVariable(action);
        break;
      case 'navigate':
        this.executeNavigate(action);
        break;
      case 'openOverlay':
        this.executeOpenOverlay(action);
        break;
      case 'closeOverlay':
        this.executeCloseOverlay(action);
        break;
      case 'scrollTo':
        this.executeScrollTo(action);
        break;
      case 'haptic':
        this.executeHaptic(action);
        break;
      case 'openUrl':
        this.executeOpenUrl(action);
        break;
      case 'playSound':
        // TODO: 实现音频播放
        console.log('playSound not implemented yet');
        break;
    }
  }

  /**
   * 切换到指定状态
   */
  private executeGoToState(action: InteractionAction): void {
    if (!action.targetElementId || !action.targetStateId) return;
    this.context.onGoToState?.(
      action.targetElementId,
      action.targetStateId,
      action.animation
    );
  }

  /**
   * 在两个状态间切换
   */
  private executeToggleState(action: InteractionAction): void {
    if (!action.targetElementId || !action.toggleStates) return;
    // 需要知道当前状态才能切换，这里简化处理
    // 实际实现需要从 context 获取当前状态
    this.context.onGoToState?.(
      action.targetElementId,
      action.toggleStates[0],
      action.animation
    );
  }

  /**
   * 设置变量
   */
  private executeSetVariable(action: InteractionAction): void {
    if (!action.variableId) return;

    const variable = this.context.variables.get(action.variableId);
    if (!variable) return;

    let newValue: string | number | boolean;
    const currentValue = variable.currentValue ?? variable.defaultValue;

    switch (action.variableOperation) {
      case 'increment':
        newValue = Number(currentValue) + Number(action.variableValue ?? 1);
        break;
      case 'decrement':
        newValue = Number(currentValue) - Number(action.variableValue ?? 1);
        break;
      case 'toggle':
        newValue = !currentValue;
        break;
      case 'set':
      default:
        newValue = action.variableValue ?? currentValue;
        break;
    }

    this.context.onSetVariable?.(action.variableId, newValue);
  }

  /**
   * 页面导航
   */
  private executeNavigate(action: InteractionAction): void {
    if (!action.targetFrameId) return;
    this.context.onNavigate?.(action.targetFrameId);
  }

  /**
   * 打开弹层
   */
  private executeOpenOverlay(action: InteractionAction): void {
    if (!action.overlayId) return;
    this.context.onOpenOverlay?.(
      action.overlayId,
      action.overlayPosition || 'center'
    );
  }

  /**
   * 关闭弹层
   */
  private executeCloseOverlay(action: InteractionAction): void {
    if (!action.overlayId) return;
    this.context.onCloseOverlay?.(action.overlayId);
  }

  /**
   * 滚动到位置
   */
  private executeScrollTo(action: InteractionAction): void {
    if (!action.scrollTargetId) return;
    this.context.onScrollTo?.(
      action.scrollTargetId,
      action.scrollOffset || 0
    );
  }

  /**
   * 触觉反馈
   */
  private executeHaptic(action: InteractionAction): void {
    if (!action.hapticType) return;
    this.triggerHaptic(action.hapticType);
  }

  /**
   * 触发触觉反馈
   */
  private triggerHaptic(type: HapticType): void {
    if (!navigator.vibrate) {
      console.log('Haptic feedback not supported');
      return;
    }

    // 不同类型的振动模式
    const patterns: Record<HapticType, number | number[]> = {
      light: 10,
      medium: 25,
      heavy: 50,
      success: [10, 50, 30],
      warning: [30, 30, 30],
      error: [50, 50, 50, 50, 50],
    };

    navigator.vibrate(patterns[type]);
  }

  /**
   * 打开链接
   */
  private executeOpenUrl(action: InteractionAction): void {
    if (!action.url) return;
    this.context.onOpenUrl?.(action.url, action.openInNewTab ?? true);
  }
}

export default InteractionExecutor;
