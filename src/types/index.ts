// Core types for Toumo

export type Position = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type ToolType = "select" | "rectangle" | "ellipse" | "text" | "image" | "line" | "frame" | "hand";

export type ShapeType = "rectangle" | "ellipse" | "text" | "image" | "line" | "frame" | "keyframe-element";

export type ShapeStyle = {
  fill: string;
  fillOpacity: number;
  // Gradient
  gradientType?: 'none' | 'linear' | 'radial';
  gradientAngle?: number;
  gradientStops?: { color: string; position: number }[];
  stroke: string;
  strokeWidth: number;
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
  textAlign?: "left" | "center" | "right";
  textColor?: string;
  // Shadow
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  shadowSpread?: number;
  // Image specific
  imageSrc?: string;
  imageOriginalWidth?: number;
  imageOriginalHeight?: number;
  objectFit?: "cover" | "contain" | "fill";
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
};
