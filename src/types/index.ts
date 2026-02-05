// Core types for Toumo

export type Position = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type ToolType = "select" | "rectangle" | "ellipse" | "text" | "hand";

export type ShapeType = "rectangle" | "ellipse" | "text" | "keyframe-element";

export type ShapeStyle = {
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  borderRadius: number;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
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
  attributes: KeyAttribute[];
  position: Position;
  size: Size;
  shapeType?: ShapeType;
  style?: ShapeStyle;
  text?: string;
};

export type Keyframe = {
  id: string;
  name: string;
  summary: string;
  functionalState?: string;
  keyElements: KeyElement[];
};

export type FunctionalState = {
  id: string;
  name: string;
  description: string;
};

export type Transition = {
  id: string;
  from: string;
  to: string;
  trigger: string;
  duration: number;
  delay: number;
  curve: string;
  springDamping?: number;
  springResponse?: number;
  description?: string;
};

export const DEFAULT_STYLE: ShapeStyle = {
  fill: "#3b82f6",
  fillOpacity: 1,
  stroke: "#1d4ed8",
  strokeWidth: 0,
  strokeOpacity: 1,
  borderRadius: 8,
  fontSize: 16,
  fontWeight: "normal",
  textAlign: "left",
};
