export function rgb(r: number, g: number, b: number): string {
  assertInRange("rgb", "r", r, 0, 255);
  assertInRange("rgb", "g", g, 0, 255);
  assertInRange("rgb", "b", b, 0, 255);

  return `rgb(${r} ${g} ${b})`;
}

export function rgba(r: number, g: number, b: number, a: number): string {
  assertInRange("rgba", "r", r, 0, 255);
  assertInRange("rgba", "g", g, 0, 255);
  assertInRange("rgba", "b", b, 0, 255);
  assertInRange("rgba", "a", a, 0, 1);

  return `rgb(${r} ${g} ${b} / ${a})`;
}

export function hsl(h: number, s: number, l: number): string {
  assertFinite("hsl", "h", h);
  assertInRange("hsl", "s", s, 0, 100);
  assertInRange("hsl", "l", l, 0, 100);

  return `hsl(${h} ${s}% ${l}%)`;
}

export function hsla(h: number, s: number, l: number, a: number): string {
  assertFinite("hsla", "h", h);
  assertInRange("hsla", "s", s, 0, 100);
  assertInRange("hsla", "l", l, 0, 100);
  assertInRange("hsla", "a", a, 0, 1);

  return `hsl(${h} ${s}% ${l}% / ${a})`;
}

export class Color {
  private constructor(
    readonly r: number,
    readonly g: number,
    readonly b: number,
    readonly a: number,
  ) {}

  static rgb(r: number, g: number, b: number): Color {
    assertInRange("Color.rgb", "r", r, 0, 255);
    assertInRange("Color.rgb", "g", g, 0, 255);
    assertInRange("Color.rgb", "b", b, 0, 255);

    return new Color(r, g, b, 1);
  }

  static rgba(r: number, g: number, b: number, a: number): Color {
    assertInRange("Color.rgba", "r", r, 0, 255);
    assertInRange("Color.rgba", "g", g, 0, 255);
    assertInRange("Color.rgba", "b", b, 0, 255);
    assertInRange("Color.rgba", "a", a, 0, 1);

    return new Color(r, g, b, a);
  }

  static hsl(h: number, s: number, l: number): Color {
    assertFinite("Color.hsl", "h", h);
    assertInRange("Color.hsl", "s", s, 0, 100);
    assertInRange("Color.hsl", "l", l, 0, 100);

    return Color.fromHsl(h, s, l, 1);
  }

  static hsla(h: number, s: number, l: number, a: number): Color {
    assertFinite("Color.hsla", "h", h);
    assertInRange("Color.hsla", "s", s, 0, 100);
    assertInRange("Color.hsla", "l", l, 0, 100);
    assertInRange("Color.hsla", "a", a, 0, 1);

    return Color.fromHsl(h, s, l, a);
  }

  static lerp(a: Color, b: Color, t: number): Color {
    assertInRange("Color.lerp", "t", t, 0, 1);

    return new Color(
      a.r + (b.r - a.r) * t,
      a.g + (b.g - a.g) * t,
      a.b + (b.b - a.b) * t,
      a.a + (b.a - a.a) * t,
    );
  }

  withAlpha(alpha: number): Color {
    assertInRange("color.withAlpha", "alpha", alpha, 0, 1);

    return new Color(this.r, this.g, this.b, alpha);
  }

  toString(): string {
    return `rgb(${this.r} ${this.g} ${this.b} / ${this.a})`;
  }

  private static fromHsl(h: number, s: number, l: number, a: number): Color {
    const normalizedHue = ((h % 360) + 360) % 360;
    const saturation = s / 100;
    const lightness = l / 100;
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const huePrime = normalizedHue / 60;
    const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
    const match = lightness - chroma / 2;

    let r1 = 0;
    let g1 = 0;
    let b1 = 0;

    if (huePrime < 1) {
      r1 = chroma;
      g1 = x;
    } else if (huePrime < 2) {
      r1 = x;
      g1 = chroma;
    } else if (huePrime < 3) {
      g1 = chroma;
      b1 = x;
    } else if (huePrime < 4) {
      g1 = x;
      b1 = chroma;
    } else if (huePrime < 5) {
      r1 = x;
      b1 = chroma;
    } else {
      r1 = chroma;
      b1 = x;
    }

    return new Color(
      (r1 + match) * 255,
      (g1 + match) * 255,
      (b1 + match) * 255,
      a,
    );
  }
}

function assertFinite(fn: string, name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${fn}: ${name} must be a finite number.`);
  }
}

function assertInRange(
  fn: string,
  name: string,
  value: number,
  min: number,
  max: number,
): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(
      `${fn}: ${name} must be a finite number in the range ${min}-${max}.`,
    );
  }
}
