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

// Overflow Scroll types (Figma/ProtoPie-style)
export type OverflowScrollDirection = 'none' | 'horizontal' | 'vertical' | 'both';

export type OverflowScrollConfig = {
  enabled: boolean;
  direction: OverflowScrollDirection;
  showScrollbar: boolean;
  scrollbarStyle: 'auto' | 'thin' | 'hidden';
  scrollBehavior: 'auto' | 'smooth';
  // Snap scrolling (optional)
  snapEnabled: boolean;
  snapType: 'none' | 'x mandatory' | 'y mandatory' | 'both mandatory' | 'x proximity' | 'y proximity';
};

export const DEFAULT_OVERFLOW_SCROLL: OverflowScrollConfig = {
  enabled: false,
  direction: 'vertical',
  showScrollbar: true,
  scrollbarStyle: 'thin',
  scrollBehavior: 'auto',
  snapEnabled: false,
  snapType: 'none',
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
  gradientCenterX?: number; // 0-100, radial gradient center
  gradientCenterY?: number; // 0-100, radial gradient center
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
  // Overflow scroll (Figma-style) - frame scrollable content
  overflowScroll?: OverflowScrollConfig;
  // Constraints (Figma-style) - how element responds to parent resize
  constraints?: ConstraintsConfig;
  // Prototype link - navigate to another frame on interaction
  prototypeLink?: PrototypeLink;
  // Variable bindings - connect variables to element properties
  variableBindings?: VariableBinding[];
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
export type VariableType = 'string' | 'number' | 'boolean' | 'color';

export type Variable = {
  id: string;
  name: string;
  type: VariableType;
  defaultValue: string | number | boolean;
  currentValue?: string | number | boolean;
  description?: string;
};

// Variable binding - connect a variable to an element property
export type VariableBinding = {
  variableId: string;
  property: string; // e.g. 'style.fill', 'style.opacity', 'text', 'position.x'
  transform?: string; // optional expression, e.g. 'value * 2', 'value + "px"'
};

// Condition rule for conditional logic
export type ConditionRule = {
  id: string;
  variableId: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: string | number | boolean;
  // What to do when condition is true
  actions: ConditionAction[];
};

export type ConditionAction = {
  type: 'setProperty' | 'setVariable' | 'goToState';
  targetElementId?: string;
  property?: string;
  value?: string | number | boolean;
  variableId?: string;
  stateId?: string;
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

// ============================================
// 新数据模型 (PRD v2) - 状态机重构
// ============================================

// 图层属性覆盖 - 某个图层在某个显示状态下的属性差异
export type LayerOverride = {
  layerId: string;
  properties: Partial<LayerProperties>;  // 位置、大小、颜色、透明度等
  isKey: boolean;                         // 是否为关键属性（参与动画）
};

// 图层可动画属性集合
export type LayerProperties = {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  rotation: number;
  scale: number;
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
  // 文本属性
  fontSize: number;
  fontWeight: string;
  color: string;
  letterSpacing: number;
  lineHeight: number;
  // 阴影
  shadowColor: string;
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  // 滤镜
  blur: number;
  brightness: number;
  contrast: number;
  saturate: number;
  // 可见性
  visible: boolean;
};

// 显示状态 = 关键帧（所有关键帧共享同一套图层树）
export type DisplayState = {
  id: string;
  name: string;
  layerOverrides: LayerOverride[];  // 每个图层在此关键帧中的属性覆盖
};

// 命令式动作：switchDisplayState / setVariable
export type Action = {
  type: 'switchDisplayState' | 'setVariable';
  // switchDisplayState 参数
  targetElementId?: string;
  targetDisplayStateId?: string;
  transition?: TransitionConfig;
  // setVariable 参数
  variableId?: string;
  value?: string | number | boolean;
};

// 过渡动画配置
export type TransitionConfig = {
  duration: number;   // ms
  delay: number;      // ms
  curve: string;      // 支持三级覆盖：全局 → 元素 → 属性
  // 弹簧参数（可选）
  springDamping?: number;
  springResponse?: number;
  springMass?: number;
  springStiffness?: number;
  // 自定义贝塞尔（可选）
  cubicBezier?: [number, number, number, number];
};

// 命令式交互规则：当[元素]被[交互]时 → [动作列表]
export type InteractionRule = {
  id: string;
  name: string;
  trigger: InteractionRuleTrigger;
  actions: Action[];              // 一个触发可执行多个动作
};

// 交互规则的触发器
export type InteractionRuleTrigger = {
  elementId: string;              // 触发元素
  type: TriggerType;              // tap/drag/hover/scroll/timer/variable
  condition?: string;             // 可选条件表达式
};

// 新版组件（PRD v2）：拥有自己的图层树、显示状态、变量、交互规则
export type ComponentV2 = {
  id: string;
  name: string;
  layers: KeyElement[];            // 组件自己的图层树
  displayStates: DisplayState[];   // 组件的多个关键帧
  variables: Variable[];           // 组件的功能状态（变量 flag）
  rules: InteractionRule[];        // 组件的命令式交互规则
  // 元数据
  thumbnail?: string;
  createdAt?: number;
};

// 新版项目结构（PRD v2）
export type ProjectV2 = {
  id: string;
  name: string;
  layers: KeyElement[];            // 单一图层树（所有关键帧共享）
  displayStates: DisplayState[];   // 画布级显示状态（关键帧）
  variables: Variable[];           // 功能状态 = 变量 flag
  rules: InteractionRule[];        // 命令式交互规则
  components: ComponentV2[];       // 组件列表
  globalCurve: string;             // 全局默认曲线
};
