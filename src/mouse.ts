import type { Vec2 } from "./types.js";

export type MouseButtonState = {
  pressed: boolean;
  down: boolean;
  up: boolean;
};

export type MouseState = {
  position: Vec2;
  delta: Vec2;
  left: MouseButtonState;
};

export type InputState = {
  mouse: MouseState;
};

export class MouseInput {
  readonly input: InputState = {
    mouse: {
      position: { x: 0, y: 0 },
      delta: { x: 0, y: 0 },
      left: {
        pressed: false,
        down: false,
        up: false,
      },
    },
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    this.updatePosition(event);
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.updatePosition(event);

    if (event.button === 0) {
      this.input.mouse.left.pressed = true;
      this.input.mouse.left.down = true;
    }
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    this.updatePosition(event);

    if (event.button === 0) {
      this.input.mouse.left.pressed = false;
      this.input.mouse.left.up = true;
    }
  };

  private readonly onPointerLeave = (event: PointerEvent): void => {
    this.updatePosition(event);

    if (this.input.mouse.left.pressed) {
      this.input.mouse.left.up = true;
    }

    this.input.mouse.left.pressed = false;
  };

  constructor(private readonly canvas: HTMLCanvasElement) {
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointerleave", this.onPointerLeave);
  }

  resetFrameState(): void {
    this.input.mouse.delta.x = 0;
    this.input.mouse.delta.y = 0;
    this.input.mouse.left.down = false;
    this.input.mouse.left.up = false;
  }

  destroy(): void {
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
  }

  private updatePosition(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const next = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const mouse = this.input.mouse;

    mouse.delta.x += next.x - mouse.position.x;
    mouse.delta.y += next.y - mouse.position.y;
    mouse.position = next;
  }
}
