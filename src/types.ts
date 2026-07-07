import type { InputState } from "./mouse.js";
import type { Rect, Shape, Vec2 } from "./geometry.js";

export type { Circle, Line, Rect, Shape, Vec2 } from "./geometry.js";

export type Size2D = {
  width: number;
  height: number;
  center: Vec2;
};

export type Transform2D = {
  translate?: Vec2;
  rotate?: number;
  scale?: number | Vec2;
};

export type ShapeStyle = {
  fill?: string;
  stroke?: string;
  width?: number;
  alpha?: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
  dash?: number[];
};

export type TextStyle = {
  size?: number;
  font?: string;
  fill?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  alpha?: number;
};

export type ImageStyle = {
  width?: number;
  height?: number;
  scale?: number;
  rotation?: number;
  mirrored?: boolean;
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
  withTransform(transform: Transform2D, callback: () => void): void;
  shape(shape: Shape, style?: ShapeStyle | string): void;
  circle(pos: Vec2, radius: number, style?: ShapeStyle | string): void;
  ellipse(
    pos: Vec2,
    radiusX: number,
    radiusY: number,
    style?: ShapeStyle | string,
  ): void;
  rect(rect: Rect, style?: ShapeStyle | string): void;
  roundRect(rect: Rect, radius: number, style?: ShapeStyle | string): void;
  triangle(
    p1: Vec2,
    p2: Vec2,
    p3: Vec2,
    style?: ShapeStyle | string,
  ): void;
  polygon(points: Vec2[], style?: ShapeStyle | string): void;
  line(from: Vec2, to: Vec2, style?: ShapeStyle | string): void;
  polyline(points: Vec2[], style?: ShapeStyle | string): void;
  arc(
    pos: Vec2,
    radius: number,
    startAngle: number,
    endAngle: number,
    style?: ShapeStyle | string,
  ): void;
  text(text: string, pos: Vec2, style?: TextStyle | string): void;
  emoji(emoji: string, pos: Vec2, style?: EmojiStyle): void;
  image(image: CanvasImageSource, pos: Vec2, style?: ImageStyle): void;
};

export type CanvasFrameContext = {
  draw: DrawContext;
  time: number;
  deltaTime: number;
  frame: number;
  size: Size2D;
  input: InputState;
};
