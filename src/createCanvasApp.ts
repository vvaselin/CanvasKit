import { CanvasDrawContext } from "./draw.js";
import { MouseInput } from "./mouse.js";
import type { CanvasFrameContext, Size2D } from "./types.js";

export type CanvasAppOptions = {
  maxDpr?: number;
  autoStart?: boolean;
  clearEachFrame?: boolean;
  pauseWhenHidden?: boolean;
  pauseWhenOffscreen?: boolean;
  respectReducedMotion?: boolean;
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
  const pauseWhenOffscreen = options.pauseWhenOffscreen ?? false;
  const respectReducedMotion = options.respectReducedMotion ?? false;
  const draw = new CanvasDrawContext(ctx);
  const mouse = new MouseInput(canvas);

  let size = getCanvasCssSize(canvas);
  let animationFrameId: number | null = null;
  let running = false;
  let pausedByVisibility = false;
  let pausedByIntersection = false;
  let pausedByMotionPreference = false;
  let intersectionObserver: IntersectionObserver | null = null;
  let reducedMotionQuery: MediaQueryList | null = null;
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

    // reduce 中は静止画として1フレームだけ残し、ループは進めません。
    if (pausedByMotionPreference) {
      animationFrameId = null;
      return;
    }

    animationFrameId = requestAnimationFrame(tick);
  };

  const pauseLoop = (): void => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  // rAF は running かつ visible かつ onscreen かつ reduce でないときだけ進みます。
  // stop() 済みの場合は running が false なので、条件が揃っても再開しません。
  const resumeLoopIfReady = (): void => {
    if (
      !running ||
      pausedByVisibility ||
      pausedByIntersection ||
      pausedByMotionPreference
    ) {
      return;
    }

    if (animationFrameId !== null) {
      return;
    }

    // 一時停止中の経過で deltaTime が巨大にならないようにリセットします。
    lastTimeMs = performance.now();
    animationFrameId = requestAnimationFrame(tick);
  };

  const handleVisibilityChange = (): void => {
    if (document.visibilityState === "hidden") {
      pausedByVisibility = true;
      pauseLoop();
      return;
    }

    pausedByVisibility = false;
    resumeLoopIfReady();
  };

  const handleIntersectionChange = (
    entries: IntersectionObserverEntry[],
  ): void => {
    const entry = entries[entries.length - 1];

    if (entry === undefined) {
      return;
    }

    if (!entry.isIntersecting) {
      pausedByIntersection = true;
      pauseLoop();
      return;
    }

    pausedByIntersection = false;
    resumeLoopIfReady();
  };

  const handleReducedMotionChange = (): void => {
    if (reducedMotionQuery === null) {
      return;
    }

    if (reducedMotionQuery.matches) {
      pausedByMotionPreference = true;
      pauseLoop();
      return;
    }

    pausedByMotionPreference = false;
    resumeLoopIfReady();
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

    // hidden / offscreen による一時停止中は、その状態が解けたときに再開します。
    // reduce 中は tick 側の判定で1フレームだけ描画されます(空白キャンバスを防ぐため)。
    if (!pausedByVisibility && !pausedByIntersection) {
      animationFrameId = requestAnimationFrame(tick);
    }
  };

  const stop = (): void => {
    running = false;
    pauseLoop();
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

    if (intersectionObserver !== null) {
      intersectionObserver.disconnect();
      intersectionObserver = null;
    }

    if (reducedMotionQuery !== null) {
      reducedMotionQuery.removeEventListener(
        "change",
        handleReducedMotionChange,
      );
      reducedMotionQuery = null;
    }

    mouse.destroy();
    destroyed = true;
  };

  resize();
  window.addEventListener("resize", resize);

  if (pauseWhenHidden) {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  if (pauseWhenOffscreen) {
    intersectionObserver = new IntersectionObserver(handleIntersectionChange);
    intersectionObserver.observe(canvas);
  }

  if (respectReducedMotion) {
    reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    pausedByMotionPreference = reducedMotionQuery.matches;
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
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
