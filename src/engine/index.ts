export { GestureEngine, type GestureCallbacks } from './GestureEngine';
export { InteractionExecutor, type ExecutionContext } from './InteractionExecutor';
export {
  SpringAnimationEngine,
  springEngine,
  animateSpring,
  SpringPresets,
  type SpringConfig,
} from './SpringAnimation';
export {
  lerp,
  Easing,
  SpringInterpolator,
  type EasingFunction,
} from './Interpolator';
export {
  SmartAnimateController,
  smartAnimateController,
  analyzeStateDiff,
  interpolateColor,
  type SmartAnimateResult,
  type ElementAnimation,
  type PropertyDiff,
  type AnimatableProperty,
  type ColorProperty,
} from './SmartAnimate';
export {
  executeTrigger,
  findTapTriggersForElement,
  handleElementTap,
  type PatchActionHandler,
} from './PatchRuntime';
