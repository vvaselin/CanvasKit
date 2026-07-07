import type {
  DrawContext,
  EmojiStyle,
  Rect,
  ShapeStyle,
  Size2D,
  TextStyle,
  Vec2,
} from "./types.js";

const defaultFill = "#ffffff";
const defaultTextFont = "sans-serif";
const defaultEmojiFont =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

export class CanvasDrawContext implements DrawContext {
  private size: Size2D = {
    width: 0,
    height: 0,
    center: { x: 0, y: 0 },
  };

  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  setSize(size: Size2D): void {
    this.size = size;
  }

  clear(color?: string): void {
    const { ctx } = this;

    ctx.save();
    ctx.clearRect(0, 0, this.size.width, this.size.height);

    if (color !== undefined) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, this.size.width, this.size.height);
    }

    ctx.restore();
  }

  circle(pos: Vec2, radius: number, style?: ShapeStyle | string): void {
    const { ctx } = this;

    ctx.save();
    this.applyShapeStyle(style);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    this.fillAndStroke(style);
    ctx.restore();
  }

  rect(rect: Rect, style?: ShapeStyle | string): void {
    const { ctx } = this;

    ctx.save();
    this.applyShapeStyle(style);
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    this.fillAndStroke(style);
    ctx.restore();
  }

  roundRect(rect: Rect, radius: number, style?: ShapeStyle | string): void {
    const { ctx } = this;

    ctx.save();
    this.applyShapeStyle(style);
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radius);
    this.fillAndStroke(style);
    ctx.restore();
  }

  line(from: Vec2, to: Vec2, style?: ShapeStyle | string): void {
    const { ctx } = this;
    const normalized = normalizeShapeStyle(style);

    ctx.save();
    ctx.globalAlpha = normalized.alpha ?? 1;
    ctx.strokeStyle = normalized.stroke ?? normalized.fill ?? defaultFill;
    ctx.lineWidth = normalized.width ?? 1;

    if (normalized.lineCap !== undefined) {
      ctx.lineCap = normalized.lineCap;
    }

    if (normalized.lineJoin !== undefined) {
      ctx.lineJoin = normalized.lineJoin;
    }

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }

  text(text: string, pos: Vec2, style?: TextStyle | string): void {
    const { ctx } = this;
    const normalized = normalizeTextStyle(style);
    const size = normalized.size ?? 16;
    const font = normalized.font ?? defaultTextFont;

    ctx.save();
    ctx.globalAlpha = normalized.alpha ?? 1;
    ctx.fillStyle = normalized.fill ?? defaultFill;
    ctx.font = `${size}px ${font}`;
    ctx.textAlign = normalized.align ?? "start";
    ctx.textBaseline = normalized.baseline ?? "alphabetic";
    ctx.fillText(text, pos.x, pos.y);
    ctx.restore();
  }

  emoji(emoji: string, pos: Vec2, style: EmojiStyle = {}): void {
    const { ctx } = this;
    const size = style.size ?? 48;
    const font = style.font ?? defaultEmojiFont;
    const rotation = style.rotation ?? 0;
    const scale = style.scale ?? 1;
    const scaleX = style.mirrored === true ? -scale : scale;

    ctx.save();
    ctx.globalAlpha = style.alpha ?? 1;
    ctx.translate(pos.x, pos.y);
    ctx.rotate(rotation);
    ctx.scale(scaleX, scale);
    ctx.font = `${size}px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, 0, 0);
    ctx.restore();
  }

  private applyShapeStyle(style?: ShapeStyle | string): void {
    const { ctx } = this;
    const normalized = normalizeShapeStyle(style);

    ctx.globalAlpha = normalized.alpha ?? 1;

    if (normalized.fill !== undefined) {
      ctx.fillStyle = normalized.fill;
    }

    if (normalized.stroke !== undefined) {
      ctx.strokeStyle = normalized.stroke;
      ctx.lineWidth = normalized.width ?? 1;
    }

    if (normalized.lineCap !== undefined) {
      ctx.lineCap = normalized.lineCap;
    }

    if (normalized.lineJoin !== undefined) {
      ctx.lineJoin = normalized.lineJoin;
    }
  }

  private fillAndStroke(style?: ShapeStyle | string): void {
    const { ctx } = this;
    const normalized = normalizeShapeStyle(style);
    const hasFill = normalized.fill !== undefined;
    const hasStroke = normalized.stroke !== undefined;

    if (!hasFill && !hasStroke) {
      ctx.fillStyle = defaultFill;
      ctx.fill();
      return;
    }

    if (hasFill) {
      ctx.fill();
    }

    if (hasStroke) {
      ctx.stroke();
    }
  }
}

function normalizeShapeStyle(style?: ShapeStyle | string): ShapeStyle {
  return typeof style === "string" ? { fill: style } : (style ?? {});
}

function normalizeTextStyle(style?: TextStyle | string): TextStyle {
  return typeof style === "string" ? { fill: style } : (style ?? {});
}
