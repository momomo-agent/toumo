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

export const DEFAULT_STYLE: ShapeStyle = {
  fill: '#3b82f6',
  fillOpacity: 1,
  stroke: '',
  strokeWidth: 0,
  strokeOpacity: 1,
  borderRadius: 8,
};
