import { CanvasDrawContext } from "./draw.js";
import { MouseInput } from "./mouse.js";
import type { CanvasFrameContext, Size2D } from "./types.js";

export type CanvasAppOptions = {
  maxDpr?: number;
  autoStart?: boolean;
  clearEachFrame?: boolean;
  pauseWhenHidden?: boolean;
};

export type CanvasApp = {
  start(): void;
  stop(): void;
  destroy(): void;
};

export type CanvasFrame = (context: CanvasFrameContext) => void;

export type CanvasSource = HTMLCanvasElement | string;

export function createCanvasApp(
  canvasOrSelector: CanvasSource,
  frame: CanvasFrame,
  options: CanvasAppOptions = {},
): CanvasApp {
  const canvas = resolveCanvas(canvasOrSelector);
  const ctx = canvas.getContext("2d");

  if (ctx === null) {
    throw new Error("createCanvasApp: failed to get CanvasRenderingContext2D.");
  }

  const maxDpr = options.maxDpr ?? Infinity;

  if (Number.isNaN(maxDpr) || maxDpr <= 0) {
    throw new Error("createCanvasApp: maxDpr must be greater than 0.");
  }

  const autoStart = options.autoStart ?? false;
  const clearEachFrame = options.clearEachFrame ?? false;
  const pauseWhenHidden = options.pauseWhenHidden ?? false;
  const draw = new CanvasDrawContext(ctx);
  const mouse = new MouseInput(canvas);

  let size = getCanvasCssSize(canvas);
  let animationFrameId: number | null = null;
  let running = false;
  let pausedByVisibility = false;
  let destroyed = false;
  let startTimeMs = 0;
  let lastTimeMs = 0;
  let frameIndex = 0;

  const resize = (): void => {
    size = getCanvasCssSize(canvas);
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const pixelWidth = Math.round(size.width * dpr);
    const pixelHeight = Math.round(size.height * dpr);

    if (canvas.width !== pixelWidth) {
      canvas.width = pixelWidth;
    }

    if (canvas.height !== pixelHeight) {
      canvas.height = pixelHeight;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw.setSize(size);
  };

  const tick = (nowMs: number): void => {
    if (!running) {
      return;
    }

    resize();

    const time = (nowMs - startTimeMs) / 1000;
    const deltaTime = (nowMs - lastTimeMs) / 1000;
    lastTimeMs = nowMs;

    if (clearEachFrame) {
      draw.clear();
    }

    frame({
      draw,
      time,
      deltaTime,
      frame: frameIndex,
      size,
      input: mouse.input,
    });

    mouse.resetFrameState();
    frameIndex += 1;
    animationFrameId = requestAnimationFrame(tick);
  };

  const handleVisibilityChange = (): void => {
    if (document.visibilityState === "hidden") {
      if (running && animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        pausedByVisibility = true;
      }

      return;
    }

    // stop() 済みの場合は running が false なので、visible に戻っても再開しません。
    if (running && pausedByVisibility) {
      pausedByVisibility = false;
      // 一時停止中の経過で deltaTime が巨大にならないようにリセットします。
      lastTimeMs = performance.now();
      animationFrameId = requestAnimationFrame(tick);
    }
  };

  const start = (): void => {
    if (destroyed) {
      throw new Error("createCanvasApp: cannot start a destroyed app.");
    }

    if (running) {
      return;
    }

    resize();
    running = true;
    startTimeMs = performance.now();
    lastTimeMs = startTimeMs;
    frameIndex = 0;
    animationFrameId = requestAnimationFrame(tick);
  };

  const stop = (): void => {
    running = false;
    pausedByVisibility = false;

    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  const destroy = (): void => {
    if (destroyed) {
      return;
    }

    stop();
    window.removeEventListener("resize", resize);

    if (pauseWhenHidden) {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }

    mouse.destroy();
    destroyed = true;
  };

  resize();
  window.addEventListener("resize", resize);

  if (pauseWhenHidden) {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  if (autoStart) {
    start();
  }

  return {
    start,
    stop,
    destroy,
  };
}

function resolveCanvas(canvasOrSelector: CanvasSource): HTMLCanvasElement {
  if (typeof canvasOrSelector !== "string") {
    return canvasOrSelector;
  }

  if (typeof document === "undefined") {
    throw new Error("createCanvasApp: document is not available.");
  }

  const element = document.querySelector(canvasOrSelector);

  if (element === null) {
    throw new Error(
      `createCanvasApp: canvas selector "${canvasOrSelector}" did not match any element.`,
    );
  }

  if (!(element instanceof HTMLCanvasElement)) {
    throw new Error(
      `createCanvasApp: selector "${canvasOrSelector}" matched a non-canvas element.`,
    );
  }

  return element;
}

function getCanvasCssSize(canvas: HTMLCanvasElement): Size2D {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  return {
    width,
    height,
    center: {
      x: width / 2,
      y: height / 2,
    },
  };
}
