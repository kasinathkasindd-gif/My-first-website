export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
/** 0..1 progress of t between a and b */
export const inv = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const easeInOutCubic = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const easeOutCubic = (u: number) => 1 - Math.pow(1 - u, 3);
export const easeInCubic = (u: number) => u * u * u;
export const easeInQuad = (u: number) => u * u;
export const easeOutQuad = (u: number) => 1 - (1 - u) * (1 - u);
export const easeOutBack = (u: number, s = 1.70158) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2);
export const smooth = (u: number) => u * u * (3 - 2 * u);
export const logLerp = (a: number, b: number, u: number) => Math.exp(lerp(Math.log(a), Math.log(b), u));
export const deg = (r: number) => (r * 180) / Math.PI;

/** damped oscillation that starts at 0 at t0 (an impulse response) */
export const wobble = (t: number, t0: number, freq = 4, damp = 5) =>
  t < t0 ? 0 : Math.exp(-damp * (t - t0)) * Math.sin(2 * Math.PI * freq * (t - t0));
/** settles from `from` to 0 with a damped cosine (a step response) */
export const settle = (t: number, t0: number, from: number, freq = 4, damp = 6) =>
  t < t0 ? from : from * Math.exp(-damp * (t - t0)) * Math.cos(2 * Math.PI * freq * (t - t0));

export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Position from a piecewise-linear velocity profile [[t, v], ...] (exact trapezoid integral). */
export const makePath = (pts: [number, number][]) => {
  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const [t0, v0] = pts[i - 1];
    const [t1, v1] = pts[i];
    cum.push(cum[i - 1] + ((v0 + v1) / 2) * (t1 - t0));
  }
  const pos = (t: number) => {
    if (t <= pts[0][0]) return 0;
    for (let i = 1; i < pts.length; i++) {
      const [t0, v0] = pts[i - 1];
      const [t1, v1] = pts[i];
      if (t <= t1) {
        const dt = t - t0;
        const v = v0 + ((v1 - v0) * dt) / (t1 - t0);
        return cum[i - 1] + ((v0 + v) / 2) * dt;
      }
    }
    const [tl, vl] = pts[pts.length - 1];
    return cum[cum.length - 1] + vl * (t - tl);
  };
  const vel = (t: number) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      const [t0, v0] = pts[i - 1];
      const [t1, v1] = pts[i];
      if (t <= t1) return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
    }
    return pts[pts.length - 1][1];
  };
  return {pos, vel};
};

/** first t in [a, b] where f(t) >= target (f increasing) */
export const solveTime = (f: (t: number) => number, target: number, a: number, b: number) => {
  let lo = a;
  let hi = b;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (f(m) >= target) hi = m;
    else lo = m;
  }
  return hi;
};

/** solve x so that g(x) = target, g increasing in x */
export const solveParam = (g: (x: number) => number, target: number, a: number, b: number) => {
  let lo = a;
  let hi = b;
  for (let i = 0; i < 80; i++) {
    const m = (lo + hi) / 2;
    if (g(m) >= target) hi = m;
    else lo = m;
  }
  return (lo + hi) / 2;
};
