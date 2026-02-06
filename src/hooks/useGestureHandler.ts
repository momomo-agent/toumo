/**
 * useGestureHandler - React Hook 封装手势引擎
 * 
 * 用法：
 * const { ref, isPreviewMode } = useGestureHandler({
 *   interactions,
 *   variables,
 *   onStateChange,
 *   onVariableChange,
 * });
 * 
 * <div ref={ref}>...</div>
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { GestureEngine, type GestureCallbacks } from '../engine/GestureEngine';
import { InteractionExecutor, type ExecutionContext } from '../engine/InteractionExecutor';
import type {
  Interaction,
  Variable,
  GestureType,
  InteractionAction,
} from '../types';

export interface UseGestureHandlerOptions {
  // 交互列表
  interactions: Interaction[];
  // 变量列表
  variables: Variable[];
  // 是否启用预览模式
  enabled?: boolean;
  // 状态切换回调
  onStateChange?: (elementId: string, stateId: string, animation?: InteractionAction['animation']) => void;
  // 变量更新回调
  onVariableChange?: (variableId: string, value: string | number | boolean) => void;
  // 导航回调
  onNavigate?: (frameId: string) => void;
  // 弹层回调
  onOpenOverlay?: (overlayId: string, position: string) => void;
  onCloseOverlay?: (overlayId: string) => void;
  // 滚动回调
  onScrollTo?: (targetId: string, offset: number) => void;
  // 链接回调
  onOpenUrl?: (url: string, newTab: boolean) => void;
  // 手势回调（用于调试或自定义处理）
  onGesture?: (gesture: GestureType, elementId: string, x: number, y: number) => void;
}

export interface UseGestureHandlerResult {
  // 绑定到元素的 ref
  ref: React.RefObject<HTMLDivElement>;
  // 当前是否在预览模式
  isActive: boolean;
  // 手动触发交互
  triggerInteraction: (interactionId: string) => void;
  // 更新变量
  updateVariable: (variableId: string, value: string | number | boolean) => void;
}

export function useGestureHandler(
  options: UseGestureHandlerOptions
): UseGestureHandlerResult {
  const {
    interactions,
    variables,
    enabled = true,
    onStateChange,
    onVariableChange,
    onNavigate,
    onOpenOverlay,
    onCloseOverlay,
    onScrollTo,
    onOpenUrl,
    onGesture,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GestureEngine | null>(null);
  const executorRef = useRef<InteractionExecutor | null>(null);
  const [isActive, setIsActive] = useState(false);

  // 创建变量 Map
  const variablesMap = useCallback(() => {
    const map = new Map<string, Variable>();
    variables.forEach(v => map.set(v.id, v));
    return map;
  }, [variables]);

  // 初始化执行器
  useEffect(() => {
    const context: ExecutionContext = {
      variables: variablesMap(),
      onGoToState: onStateChange,
      onSetVariable: onVariableChange,
      onNavigate,
      onOpenOverlay,
      onCloseOverlay,
      onScrollTo,
      onOpenUrl,
    };

    executorRef.current = new InteractionExecutor(context);

    return () => {
      executorRef.current = null;
    };
  }, [
    variablesMap,
    onStateChange,
    onVariableChange,
    onNavigate,
    onOpenOverlay,
    onCloseOverlay,
    onScrollTo,
    onOpenUrl,
  ]);

  // 更新执行器上下文
  useEffect(() => {
    if (executorRef.current) {
      executorRef.current.updateContext({
        variables: variablesMap(),
      });
    }
  }, [variablesMap]);

  // 初始化手势引擎
  useEffect(() => {
    if (!enabled || !ref.current) {
      setIsActive(false);
      return;
    }

    const engine = new GestureEngine({
      dragThreshold: 10,
      longPressDelay: 500,
      doubleTapInterval: 300,
      swipeVelocity: 0.5,
    });

    const callbacks: GestureCallbacks = {
      onTap: (elementId, x, y) => {
        onGesture?.('tap', elementId, x, y);
      },
      onDoubleTap: (elementId, x, y) => {
        onGesture?.('doubleTap', elementId, x, y);
      },
      onLongPress: (elementId, x, y) => {
        onGesture?.('longPress', elementId, x, y);
      },
      onPanStart: (elementId, x, y) => {
        onGesture?.('panStart', elementId, x, y);
      },
      onPanMove: (elementId, x, y) => {
        onGesture?.('panMove', elementId, x, y);
      },
      onPanEnd: (elementId, x, y) => {
        onGesture?.('panEnd', elementId, x, y);
      },
      onSwipe: (elementId, _direction) => {
        onGesture?.('swipe', elementId, 0, 0);
      },
      onInteraction: (interaction, _gesture) => {
        if (executorRef.current) {
          executorRef.current.execute(interaction);
        }
      },
    };

    engine.setCallbacks(callbacks);
    engine.setInteractions(interactions);
    engine.bind(ref.current);

    engineRef.current = engine;
    setIsActive(true);

    return () => {
      engine.destroy();
      engineRef.current = null;
      setIsActive(false);
    };
  }, [enabled, interactions, onGesture]);

  // 更新交互列表
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setInteractions(interactions);
    }
  }, [interactions]);

  // 手动触发交互
  const triggerInteraction = useCallback((interactionId: string) => {
    const interaction = interactions.find(i => i.id === interactionId);
    if (interaction && executorRef.current) {
      executorRef.current.execute(interaction);
    }
  }, [interactions]);

  // 更新变量
  const updateVariable = useCallback((
    variableId: string,
    value: string | number | boolean
  ) => {
    onVariableChange?.(variableId, value);
  }, [onVariableChange]);

  return {
    ref: ref as React.RefObject<HTMLDivElement>,
    isActive,
    triggerInteraction,
    updateVariable,
  };
}

export default useGestureHandler;
