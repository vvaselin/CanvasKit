import type {
  DrawContext,
  EmojiStyle,
  ImageStyle,
  Rect,
  RenderState2D,
  Shape,
  ShapeStyle,
  Size2D,
  TextStyle,
  Transform2D,
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

  withTransform(transform: Transform2D, callback: () => void): void {
    const { ctx } = this;
    const { translate, rotate, scale } = transform;

    // Canvas 2D は非有限値の変換を黙って無視するため、ここで明示的に検証します。
    if (translate !== undefined) {
      assertFiniteTransform("translate.x", translate.x);
      assertFiniteTransform("translate.y", translate.y);
    }

    if (rotate !== undefined) {
      assertFiniteTransform("rotate", rotate);
    }

    const scaleVec =
      scale === undefined
        ? undefined
        : typeof scale === "number"
          ? { x: scale, y: scale }
          : scale;

    if (scaleVec !== undefined) {
      assertFiniteTransform("scale.x", scaleVec.x);
      assertFiniteTransform("scale.y", scaleVec.y);
    }

    ctx.save();

    try {
      if (translate !== undefined) {
        ctx.translate(translate.x, translate.y);
      }

      if (rotate !== undefined) {
        ctx.rotate(rotate);
      }

      if (scaleVec !== undefined) {
        ctx.scale(scaleVec.x, scaleVec.y);
      }

      callback();
    } finally {
      ctx.restore();
    }
  }

  withState(state: RenderState2D, callback: () => void): void {
    const { ctx } = this;
    const {
      alpha,
      blend,
      shadowBlur,
      shadowColor,
      shadowOffset,
      filter,
      lineCap,
      lineJoin,
    } = state;

    if (alpha !== undefined && (!Number.isFinite(alpha) || alpha < 0 || alpha > 1)) {
      throw new RangeError(
        "draw.withState: alpha must be a finite number in the range 0-1.",
      );
    }

    if (
      shadowBlur !== undefined &&
      (!Number.isFinite(shadowBlur) || shadowBlur < 0)
    ) {
      throw new RangeError(
        "draw.withState: shadowBlur must be a finite number greater than or equal to 0.",
      );
    }

    if (shadowOffset !== undefined) {
      if (!Number.isFinite(shadowOffset.x) || !Number.isFinite(shadowOffset.y)) {
        throw new RangeError(
          "draw.withState: shadowOffset must contain finite numbers.",
        );
      }
    }

    ctx.save();

    try {
      // alpha は置き換えではなく乗算です。withState の入れ子や
      // style.alpha との組み合わせが自然に合成されます。
      if (alpha !== undefined) {
        ctx.globalAlpha = ctx.globalAlpha * alpha;
      }

      if (blend !== undefined) {
        ctx.globalCompositeOperation = blend;
      }

      if (shadowBlur !== undefined) {
        ctx.shadowBlur = shadowBlur;
      }

      if (shadowColor !== undefined) {
        ctx.shadowColor = shadowColor;
      }

      if (shadowOffset !== undefined) {
        ctx.shadowOffsetX = shadowOffset.x;
        ctx.shadowOffsetY = shadowOffset.y;
      }

      if (filter !== undefined) {
        ctx.filter = filter;
      }

      if (lineCap !== undefined) {
        ctx.lineCap = lineCap;
      }

      if (lineJoin !== undefined) {
        ctx.lineJoin = lineJoin;
      }

      callback();
    } finally {
      ctx.restore();
    }
  }

  shape(shape: Shape, style?: ShapeStyle | string): void {
    if (shape === null || typeof shape !== "object" || !("kind" in shape)) {
      throw new Error("draw.shape: unsupported shape kind.");
    }

    switch (shape.kind) {
      case "circle":
        this.circle(shape.center, shape.r, style);
        return;
      case "rect":
        this.rect(shape, style);
        return;
      case "line":
        this.line(shape.from, shape.to, style);
        return;
      default:
        throw new Error("draw.shape: unsupported shape kind.");
    }
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

  ellipse(
    pos: Vec2,
    radiusX: number,
    radiusY: number,
    style?: ShapeStyle | string,
  ): void {
    const { ctx } = this;

    ctx.save();
    this.applyShapeStyle(style);
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, radiusX, radiusY, 0, 0, Math.PI * 2);
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

  triangle(
    p1: Vec2,
    p2: Vec2,
    p3: Vec2,
    style?: ShapeStyle | string,
  ): void {
    const { ctx } = this;

    ctx.save();
    this.applyShapeStyle(style);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    this.fillAndStroke(style);
    ctx.restore();
  }

  polygon(points: Vec2[], style?: ShapeStyle | string): void {
    if (points.length < 3) {
      throw new Error("draw.polygon: points must contain at least 3 points.");
    }

    const { ctx } = this;
    const first = points[0]!;

    ctx.save();
    this.applyShapeStyle(style);
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);

    for (let i = 1; i < points.length; i += 1) {
      const point = points[i]!;
      ctx.lineTo(point.x, point.y);
    }

    ctx.closePath();
    this.fillAndStroke(style);
    ctx.restore();
  }

  line(from: Vec2, to: Vec2, style?: ShapeStyle | string): void {
    const { ctx } = this;

    ctx.save();
    this.applyLineStyle(style);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }

  polyline(points: Vec2[], style?: ShapeStyle | string): void {
    if (points.length < 2) {
      throw new Error("draw.polyline: points must contain at least 2 points.");
    }

    const { ctx } = this;
    const first = points[0]!;

    ctx.save();
    this.applyLineStyle(style);
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);

    for (let i = 1; i < points.length; i += 1) {
      const point = points[i]!;
      ctx.lineTo(point.x, point.y);
    }

    ctx.stroke();
    ctx.restore();
  }

  arc(
    pos: Vec2,
    radius: number,
    startAngle: number,
    endAngle: number,
    style?: ShapeStyle | string,
  ): void {
    const { ctx } = this;

    ctx.save();
    this.applyLineStyle(style);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, startAngle, endAngle);
    ctx.stroke();
    ctx.restore();
  }

  text(text: string, pos: Vec2, style?: TextStyle | string): void {
    const { ctx } = this;
    const normalized = normalizeTextStyle(style);
    const size = normalized.size ?? 16;
    const lineHeight = normalized.lineHeight ?? 1.2;
    const font = normalized.font ?? defaultTextFont;
    const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

    if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
      throw new RangeError(
        "draw.text: lineHeight must be a finite number greater than 0.",
      );
    }

    ctx.save();
    ctx.globalAlpha = ctx.globalAlpha * (normalized.alpha ?? 1);
    ctx.fillStyle = normalized.fill ?? defaultFill;
    ctx.font = `${size}px ${font}`;
    ctx.textAlign = normalized.align ?? "start";
    ctx.textBaseline = normalized.baseline ?? "alphabetic";

    for (let i = 0; i < lines.length; i += 1) {
      ctx.fillText(lines[i]!, pos.x, pos.y + i * size * lineHeight);
    }

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
    ctx.globalAlpha = ctx.globalAlpha * (style.alpha ?? 1);
    ctx.translate(pos.x, pos.y);
    ctx.rotate(rotation);
    ctx.scale(scaleX, scale);
    ctx.font = `${size}px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, 0, 0);
    ctx.restore();
  }

  image(image: CanvasImageSource, pos: Vec2, style: ImageStyle = {}): void {
    const { ctx } = this;
    const natural = getImageSize(image);
    const width = style.width ?? natural.width;
    const height = style.height ?? natural.height;
    const scale = style.scale ?? 1;
    const rotation = style.rotation ?? 0;

    assertPositiveFinite("width", width);
    assertPositiveFinite("height", height);
    assertFiniteImageValue("scale", scale);
    assertFiniteImageValue("rotation", rotation);

    const scaleX = style.mirrored === true ? -scale : scale;

    ctx.save();
    ctx.globalAlpha = ctx.globalAlpha * (style.alpha ?? 1);
    ctx.translate(pos.x, pos.y);
    ctx.rotate(rotation);
    ctx.scale(scaleX, scale);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
  }

  private applyShapeStyle(style?: ShapeStyle | string): void {
    const { ctx } = this;
    const normalized = normalizeShapeStyle(style);

    // withState({ alpha }) の中では外側の alpha と乗算で合成されます。
    ctx.globalAlpha = ctx.globalAlpha * (normalized.alpha ?? 1);

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

    if (normalized.dash !== undefined) {
      ctx.setLineDash(normalized.dash);
    }
  }

  private applyLineStyle(style?: ShapeStyle | string): void {
    const { ctx } = this;
    const normalized = normalizeShapeStyle(style);

    ctx.globalAlpha = ctx.globalAlpha * (normalized.alpha ?? 1);
    ctx.strokeStyle = normalized.stroke ?? normalized.fill ?? defaultFill;
    ctx.lineWidth = normalized.width ?? 1;

    if (normalized.lineCap !== undefined) {
      ctx.lineCap = normalized.lineCap;
    }

    if (normalized.lineJoin !== undefined) {
      ctx.lineJoin = normalized.lineJoin;
    }

    if (normalized.dash !== undefined) {
      ctx.setLineDash(normalized.dash);
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

// 未ロード画像やサイズ0のsourceは、Canvas 2D では黙って何も描かれません。
// 暗黙の失敗を避けるため、ここで明示的に検証して throw します。
function getImageSize(source: CanvasImageSource): {
  width: number;
  height: number;
} {
  if (
    typeof HTMLImageElement !== "undefined" &&
    source instanceof HTMLImageElement
  ) {
    if (!source.complete || source.naturalWidth === 0) {
      throw new Error(
        "draw.image: image is not loaded yet. Use loadImage() or wait for the load event.",
      );
    }

    return { width: source.naturalWidth, height: source.naturalHeight };
  }

  if (
    typeof HTMLCanvasElement !== "undefined" &&
    source instanceof HTMLCanvasElement
  ) {
    if (source.width === 0 || source.height === 0) {
      throw new Error("draw.image: canvas source has zero size.");
    }

    return { width: source.width, height: source.height };
  }

  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
    if (source.width === 0 || source.height === 0) {
      throw new Error("draw.image: ImageBitmap source has zero size.");
    }

    return { width: source.width, height: source.height };
  }

  if (
    typeof HTMLVideoElement !== "undefined" &&
    source instanceof HTMLVideoElement
  ) {
    if (source.videoWidth === 0 || source.videoHeight === 0) {
      throw new Error("draw.image: video source is not ready yet.");
    }

    return { width: source.videoWidth, height: source.videoHeight };
  }

  if (
    typeof OffscreenCanvas !== "undefined" &&
    source instanceof OffscreenCanvas
  ) {
    if (source.width === 0 || source.height === 0) {
      throw new Error("draw.image: OffscreenCanvas source has zero size.");
    }

    return { width: source.width, height: source.height };
  }

  throw new Error("draw.image: unsupported image source.");
}

function assertPositiveFinite(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(
      `draw.image: ${name} must be a finite number greater than 0.`,
    );
  }
}

function assertFiniteImageValue(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`draw.image: ${name} must be a finite number.`);
  }
}

function assertFiniteTransform(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(
      `draw.withTransform: ${name} must be a finite number.`,
    );
  }
}

function normalizeShapeStyle(style?: ShapeStyle | string): ShapeStyle {
  return typeof style === "string" ? { fill: style } : (style ?? {});
}

function normalizeTextStyle(style?: TextStyle | string): TextStyle {
  return typeof style === "string" ? { fill: style } : (style ?? {});
}
