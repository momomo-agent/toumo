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
