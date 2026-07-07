import type { InputState } from "./mouse.js";

export type Vec2 = {
  x: number;
  y: number;
};

export type Size2D = {
  width: number;
  height: number;
  center: Vec2;
};

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Circle = {
  center: Vec2;
  r: number;
};

export type ShapeStyle = {
  fill?: string;
  stroke?: string;
  width?: number;
  alpha?: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
};

export type TextStyle = {
  size?: number;
  font?: string;
  fill?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  alpha?: number;
};

export type EmojiStyle = {
  size?: number;
  font?: string;
  rotation?: number;
  scale?: number;
  mirrored?: boolean;
  alpha?: number;
};

export type DrawContext = {
  clear(color?: string): void;
  circle(pos: Vec2, radius: number, style?: ShapeStyle | string): void;
  rect(rect: Rect, style?: ShapeStyle | string): void;
  roundRect(rect: Rect, radius: number, style?: ShapeStyle | string): void;
  line(from: Vec2, to: Vec2, style?: ShapeStyle | string): void;
  text(text: string, pos: Vec2, style?: TextStyle | string): void;
  emoji(emoji: string, pos: Vec2, style?: EmojiStyle): void;
};

export type CanvasFrameContext = {
  draw: DrawContext;
  time: number;
  deltaTime: number;
  frame: number;
  size: Size2D;
  input: InputState;
};
