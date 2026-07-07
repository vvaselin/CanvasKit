export function deg(value: number): number {
  return (value * Math.PI) / 180;
}

export function rad(value: number): number {
  return (value * 180) / Math.PI;
}

export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new Error("clamp: min must be less than or equal to max.");
  }

  return Math.min(Math.max(value, min), max);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function inverseLerp(a: number, b: number, value: number): number {
  if (a === b) {
    throw new Error("inverseLerp: a and b must not be equal.");
  }

  return (value - a) / (b - a);
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return lerp(outMin, outMax, inverseLerp(inMin, inMax, value));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp(inverseLerp(edge0, edge1, x), 0, 1);
  return t * t * (3 - 2 * t);
}

export function pingPong(time: number, length: number): number {
  if (length <= 0) {
    throw new Error("pingPong: length must be greater than 0.");
  }

  const cycle = length * 2;
  const wrapped = ((time % cycle) + cycle) % cycle;
  return length - Math.abs(wrapped - length);
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
