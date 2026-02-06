// Core types for Toumo

export type Position = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

// Auto Layout types (Figma-style)
export type AutoLayoutDirection = 'horizontal' | 'vertical';
export type AutoLayoutAlign = 'start' | 'center' | 'end' | 'stretch';
export type AutoLayoutJustify = 'start' | 'center' | 'end' | 'space-between';
export type SizingMode = 'fixed' | 'hug' | 'fill';

export type AutoLayoutConfig = {
  enabled: boolean;
  direction: AutoLayoutDirection;
  gap: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  alignItems: AutoLayoutAlign;      // Cross-axis alignment
  justifyContent: AutoLayoutJustify; // Main-axis distribution
  wrap: boolean;                     // Allow wrapping
  // Parent sizing modes (how this container sizes itself)
  primaryAxisSizing: SizingMode;    // Main axis: fixed | hug | fill
  counterAxisSizing: SizingMode;    // Cross axis: fixed | hug | fill
};

export type ChildLayoutConfig = {
  // How this child sizes itself within auto layout parent
  widthMode: SizingMode;   // fixed | hug | fill
  heightMode: SizingMode;  // fixed | hug | fill
  alignSelf?: AutoLayoutAlign; // Override parent's alignItems
};

// Constraints types (Figma-style)
export type HorizontalConstraint = 'left' | 'right' | 'left-right' | 'center' | 'scale';
export type VerticalConstraint = 'top' | 'bottom' | 'top-bottom' | 'center' | 'scale';

export type ConstraintsConfig = {
  horizontal: HorizontalConstraint;
  vertical: VerticalConstraint;
};

export const DEFAULT_CONSTRAINTS: ConstraintsConfig = {
  horizontal: 'left',
  vertical: 'top',
};

export const DEFAULT_AUTO_LAYOUT: AutoLayoutConfig = {
  enabled: false,
  direction: 'vertical',
  gap: 8,
  paddingTop: 8,
  paddingRight: 8,
  paddingBottom: 8,
  paddingLeft: 8,
  alignItems: 'start',
  justifyContent: 'start',
  wrap: false,
  primaryAxisSizing: 'fixed',
  counterAxisSizing: 'fixed',
};

export type ToolType = "select" | "rectangle" | "ellipse" | "text" | "image" | "line" | "frame" | "hand" | "eyedropper" | "pen";

export type ShapeType = "rectangle" | "ellipse" | "text" | "image" | "line" | "frame" | "keyframe-element" | "path";

export type ShapeStyle = {
  fill: string;
  fillOpacity: number;
  opacity?: number;
  // Gradient
  gradientType?: 'none' | 'linear' | 'radial';
  gradientAngle?: number;
  gradientStops?: { color: string; position: number }[];
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  padding?: number;
  verticalAlign?: 'top' | 'middle' | 'bottom';
  whiteSpace?: 'nowrap' | 'normal' | 'pre-wrap';
  overflow?: 'visible' | 'hidden' | 'scroll';
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  cursor?: 'default' | 'pointer' | 'grab' | 'text';
  pointerEvents?: 'auto' | 'none';
  userSelect?: 'auto' | 'none' | 'text' | 'all';
  transformOrigin?: string;
  scale?: number;
  skewX?: number;
  skewY?: number;
  perspective?: number;
  boxSizing?: 'content-box' | 'border-box';
  outline?: string;
  backdropFilter?: string;
  transition?: string;
  willChange?: string;
  aspectRatio?: string;
  objectFit?: 'fill' | 'contain' | 'cover' | 'none';
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  gap?: number;
  flexDirection?: 'row' | 'column';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  zIndex?: number;
  visibility?: 'visible' | 'hidden';
  isolation?: 'auto' | 'isolate';
  backfaceVisibility?: 'visible' | 'hidden';
  transformStyle?: 'flat' | 'preserve-3d';
  clipPath?: string;
  maskImage?: string;
  textShadow?: string;
  wordBreak?: 'normal' | 'break-all' | 'break-word';
  textOverflow?: 'clip' | 'ellipsis';
  hyphens?: 'none' | 'auto';
  writingMode?: 'horizontal-tb' | 'vertical-rl' | 'vertical-lr';
  textIndent?: number;
  columnCount?: number;
  columnGap?: number;
  listStyle?: string;
  caretColor?: string;
  accentColor?: string;
  scrollBehavior?: 'auto' | 'smooth';
  // Additional CSS properties
  touchAction?: 'auto' | 'none' | 'pan-x' | 'pan-y' | 'manipulation';
  scrollSnapType?: 'none' | 'x mandatory' | 'y mandatory' | 'both mandatory';
  scrollSnapAlign?: 'none' | 'start' | 'center' | 'end';
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: string;
  alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch';
  order?: number;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridArea?: string;
  placeItems?: string;
  placeContent?: string;
  alignContent?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'space-between' | 'space-around';
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'grid' | 'none';
  margin?: string | number;
  outlineWidth?: number;
  outlineOffset?: number;
  outlineStyle?: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  outlineColor?: string;
  transitionProperty?: string;
  transitionDuration?: string | number;
  transitionTimingFunction?: string;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  strokeOpacity: number;
  borderRadius: number;
  // Individual corner radii
  borderRadiusTL?: number;
  borderRadiusTR?: number;
  borderRadiusBR?: number;
  borderRadiusBL?: number;
  rotation?: number;
  flipX?: boolean;
  flipY?: boolean; // degrees
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  letterSpacing?: number;
  lineHeight?: number;
  textAlign?: "left" | "center" | "right";
  textColor?: string;
  // Shadow
  shadowColor?: string;
  shadowX?: number;
  shadowY?: number;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowSpread?: number;
  // Inner shadow
  innerShadowEnabled?: boolean;
  innerShadowColor?: string;
  innerShadowX?: number;
  innerShadowY?: number;
  innerShadowBlur?: number;
  // Filters
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturate?: number;
  hueRotate?: number;
  invert?: number;
  grayscale?: number;
  sepia?: number;
  dropShadowX?: number;
  dropShadowY?: number;
  dropShadowBlur?: number;
  dropShadowColor?: string;
  blendMode?: string;
  backdropBlur?: number;
  fontFamily?: string;
  textTransform?: string;
  aspectRatioLocked?: boolean;
  // Line specific
  lineStartArrow?: boolean;
  lineEndArrow?: boolean;
  // Path specific
  pathData?: string; // SVG path d attribute
  pathPoints?: Array<{ x: number; y: number; type: 'move' | 'line' | 'curve'; cx1?: number; cy1?: number; cx2?: number; cy2?: number }>;
  pathClosed?: boolean;
  // Image specific
  imageSrc?: string;
  imageOriginalWidth?: number;
  imageOriginalHeight?: number;
  objectPosition?: string;
};

export type KeyAttribute = {
  id: string;
  label: string;
  value: string;
  targeted: boolean;
  curve: string;
};

export type KeyElement = {
  id: string;
  name: string;
  category: "content" | "component" | "system";
  isKeyElement: boolean;
  locked?: boolean;
  visible?: boolean;
  constrainProportions?: boolean;
  groupId?: string;
  parentId?: string; // For nested layers
  collapsed?: boolean; // For groups/frames
  zIndex?: number; // Layer order
  attributes: KeyAttribute[];
  position: Position;
  size: Size;
  shapeType?: ShapeType;
  style?: ShapeStyle;
  text?: string;
  // Component instance fields
  componentId?: string; // If this is a component instance
  componentInstanceId?: string; // Unique instance id
  currentStateId?: string; // Current functional state
  styleOverrides?: Record<string, Partial<ShapeStyle>>; // Per-child overrides
  // Auto Layout (Figma-style)
  autoLayout?: AutoLayoutConfig;
  // Child layout settings (when inside auto layout parent)
  layoutChild?: ChildLayoutConfig;
  // Constraints (Figma-style) - how element responds to parent resize
  constraints?: ConstraintsConfig;
  // Prototype link - navigate to another frame on interaction
  prototypeLink?: PrototypeLink;
};

// Prototype Link types (Figma-style)
export type PrototypeLinkTrigger = 'tap' | 'drag' | 'hover' | 'mouseEnter' | 'mouseLeave' | 'mouseDown' | 'mouseUp';

export type PrototypeTransitionType = 
  | 'instant'      // No animation
  | 'dissolve'     // Fade transition
  | 'smartAnimate' // Animate matching layers
  | 'moveIn'       // Slide in from direction
  | 'moveOut'      // Slide out to direction
  | 'push'         // Push current frame out
  | 'slideIn'      // Slide in overlay
  | 'slideOut';    // Slide out overlay

export type PrototypeTransitionDirection = 'left' | 'right' | 'top' | 'bottom';

export type PrototypeTransitionEasing = 
  | 'linear'
  | 'ease'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'spring';

export type PrototypeLink = {
  enabled: boolean;
  targetFrameId: string | null;  // null = no link, 'back' = go back
  trigger: PrototypeLinkTrigger;
  // Transition settings
  transition: {
    type: PrototypeTransitionType;
    direction?: PrototypeTransitionDirection;
    duration: number;  // ms
    easing: PrototypeTransitionEasing;
  };
  // Overlay settings (for modals/popups)
  isOverlay?: boolean;
  overlayPosition?: 'center' | 'topLeft' | 'topCenter' | 'topRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight';
  overlayBackground?: 'none' | 'dim';
  closeOnOutsideClick?: boolean;
};

export const DEFAULT_PROTOTYPE_LINK: PrototypeLink = {
  enabled: false,
  targetFrameId: null,
  trigger: 'tap',
  transition: {
    type: 'dissolve',
    duration: 300,
    easing: 'easeOut',
  },
};

export const DEFAULT_STYLE: ShapeStyle = {
  fill: '#3b82f6',
  fillOpacity: 1,
  stroke: '',
  strokeWidth: 0,
  strokeOpacity: 1,
  borderRadius: 8,
};

export type Keyframe = {
  id: string;
  name: string;
  summary: string;
  functionalState?: string;
  keyElements: KeyElement[];
};

// Trigger types for transitions
export type TriggerType = 'tap' | 'drag' | 'scroll' | 'hover' | 'timer' | 'variable';

export type TriggerConfig = {
  type: TriggerType;
  // Drag-specific
  direction?: 'any' | 'horizontal' | 'vertical' | 'up' | 'down' | 'left' | 'right';
  threshold?: number;
  // Scroll-specific
  scrollOffset?: number;
  scrollDirection?: 'up' | 'down';
  // Timer-specific
  timerDelay?: number;
  // Variable-specific
  variableName?: string;
  variableCondition?: 'equals' | 'greater' | 'less' | 'changed';
  variableValue?: string | number;
};

export type Transition = {
  id: string;
  from: string;
  to: string;
  trigger: string; // Legacy simple trigger
  triggers?: TriggerConfig[]; // New: combo triggers
  duration: number;
  delay: number;
  curve: string;
  // Spring parameters
  springDamping?: number;
  springResponse?: number;
  springMass?: number;
  springStiffness?: number;
  // Cubic bezier for custom curves
  cubicBezier?: [number, number, number, number];
  description?: string;
};

// Functional State - for logic/state machine
export type FunctionalState = {
  id: string;
  name: string;
  isInitial: boolean;
  componentId?: string;
};

// Display State mapping
export type DisplayStateMapping = {
  functionalStateId: string;
  displayStateIds: string[]; // keyframe ids
};

// Component with multi-state support
export type Component = {
  id: string;
  name: string;
  functionalStates: FunctionalState[];
  displayStateMappings: DisplayStateMapping[];
  transitions: Transition[];
  // Master element data - the source of truth
  masterElements: KeyElement[];
  // Thumbnail for preview
  thumbnail?: string;
  // Creation timestamp
  createdAt: number;
};

// Component Instance - placed on canvas
export type ComponentInstance = {
  id: string;
  componentId: string;
  // Current functional state
  currentStateId?: string;
  // Style overrides (per element id)
  styleOverrides: Record<string, Partial<ShapeStyle>>;
  // Position overrides
  positionOverride?: Position;
  sizeOverride?: Size;
};

// Variable types for state machine logic
export type VariableType = 'string' | 'number' | 'boolean';

export type Variable = {
  id: string;
  name: string;
  type: VariableType;
  defaultValue: string | number | boolean;
  currentValue?: string | number | boolean;
  description?: string;
};

// ============================================
// 交互系统 - Mobile-First Design
// ============================================

// 手势阶段 (细粒度控制)
export type GesturePhase = 
  | 'start'    // 按下/开始
  | 'move'     // 移动中
  | 'end'      // 抬起/结束
  | 'cancel';  // 取消

// 手势类型 (移动端优先)
export type GestureType = 
  | 'tap'           // 点击 (按下+抬起)
  | 'doubleTap'     // 双击
  | 'longPress'     // 长按
  | 'press'         // 按下 (touchstart)
  | 'release'       // 抬起 (touchend)
  | 'swipe'         // 滑动 (快速)
  | 'pan'           // 拖拽 (持续)
  | 'panStart'      // 拖拽开始
  | 'panMove'       // 拖拽移动中
  | 'panEnd'        // 拖拽结束
  | 'pinch'         // 捏合缩放
  | 'pinchStart'    // 捏合开始
  | 'pinchMove'     // 捏合中
  | 'pinchEnd'      // 捏合结束
  | 'rotate'        // 旋转手势
  | 'hover'         // 悬停 (桌面端)
  | 'hoverEnter'    // 进入悬停
  | 'hoverLeave'    // 离开悬停
  | 'focus'         // 聚焦
  | 'blur';         // 失焦

// 滑动方向
export type SwipeDirection = 'up' | 'down' | 'left' | 'right' | 'any';

// 手势识别配置 (区分点击和拖拽)
export type GestureRecognition = {
  // 移动多少像素后判定为拖拽 (默认 10px)
  dragThreshold: number;
  // 按下多久后判定为长按 (默认 500ms)
  longPressDelay: number;
  // 双击间隔 (默认 300ms)
  doubleTapInterval: number;
  // 滑动速度阈值 (px/ms)
  swipeVelocity: number;
};

// 拖拽区域触发条件
export type DragZoneTrigger = {
  // 区域类型
  type: 'distance' | 'position' | 'element' | 'threshold';
  // 距离触发 (拖拽超过多少像素)
  distance?: number;
  // 位置触发 (拖拽到某个坐标范围)
  position?: { x?: [number, number]; y?: [number, number] };
  // 元素触发 (拖拽到某个元素上方)
  targetElementId?: string;
  // 阈值触发 (拖拽百分比)
  percentage?: number;
  // 方向限制
  direction?: SwipeDirection;
};

// 手势配置
export type GestureConfig = {
  type: GestureType;
  // 滑动方向
  direction?: SwipeDirection;
  // 长按时长 (ms)
  duration?: number;
  // 移动阈值 (超过此值判定为拖拽而非点击)
  moveThreshold?: number;
  // 滑动距离阈值
  threshold?: number;
  // 拖拽过程中的区域触发
  dragZones?: DragZoneTrigger[];
  // 是否跟随手指位置更新变量
  trackPosition?: boolean;
  // 位置映射到变量
  positionVariable?: {
    x?: string;
    y?: string;
  };
};

// 动作类型
export type InteractionActionType = 
  | 'goToState'      // 切换到指定状态
  | 'toggleState'    // 在两个状态间切换
  | 'setVariable'    // 设置变量
  | 'navigate'       // 页面跳转
  | 'openOverlay'    // 打开弹层
  | 'closeOverlay'   // 关闭弹层
  | 'scrollTo'       // 滚动到位置
  | 'playSound'      // 播放声音
  | 'haptic'         // 触觉反馈
  | 'openUrl';       // 打开链接

// 触觉反馈类型
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

// 动作定义
export type InteractionAction = {
  id: string;
  type: InteractionActionType;
  // goToState / toggleState
  targetElementId?: string;
  targetStateId?: string;
  toggleStates?: [string, string];
  // setVariable
  variableId?: string;
  variableValue?: string | number | boolean;
  variableOperation?: 'set' | 'increment' | 'decrement' | 'toggle';
  // navigate
  targetFrameId?: string;
  // overlay
  overlayId?: string;
  overlayPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  // scrollTo
  scrollTargetId?: string;
  scrollOffset?: number;
  // haptic
  hapticType?: HapticType;
  // openUrl
  url?: string;
  openInNewTab?: boolean;
  // 动画配置
  animation?: {
    duration: number;
    easing: string;
    delay?: number;
  };
};

// 条件判断
export type InteractionCondition = {
  variableId: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: string | number | boolean;
};

// 交互定义
export type Interaction = {
  id: string;
  name?: string;
  elementId: string;        // 触发元素
  gesture: GestureConfig;   // 手势配置
  conditions?: InteractionCondition[];  // 触发条件
  actions: InteractionAction[];         // 执行动作
  enabled: boolean;
};

// 交互组 - 用于管理相关交互
export type InteractionGroup = {
  id: string;
  name: string;
  interactions: Interaction[];
};
