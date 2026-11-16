// All motion of the Short as pure functions of time t (composition seconds).
// World units: at Z = 1000 and camera z = 0, 1 world px = 1 screen px (1080 x 1920 comp). y grows downward.
import {PoseName, SPRITES} from './sprites';
import {A, T} from './timing';
import * as U from './util';

// ---------------------------------------------------------------------------------------------- world
export const GROUND_Y = 600;
export const FULCRUM_H = 105;
export const PIVOT = {x: 540, y: GROUND_Y - FULCRUM_H};
export const PL = 620; // plank length
export const PT = 24; // plank thickness
export const THETA_REST = Math.asin(FULCRUM_H / (PL / 2)); // right end up, left end on the ground
export const S_DROP1 = -235; // along the plank
export const S_SEAT = 245;
export const Z_MAIN = 1000;
export const Z_SPLASH = 860;
export const PUDDLE = {x: 610, y: GROUND_Y};

// mosquito scale: hover pose body length (head front -> abdomen tip) = L_BODY world px; every pose gets the same
// head radius so swaps never change the head size
export const L_BODY = 150;
const HV = SPRITES.hover;
export const R_HEAD = (HV.headR * L_BODY) / (HV.body[2] - HV.body[0]);
export const poseScale = (p: PoseName) => R_HEAD / SPRITES[p].headR;
const off = (p: PoseName, px: number, py: number) => {
  const s = poseScale(p);
  return {x: (px - SPRITES[p].head[0]) * s, y: (py - SPRITES[p].head[1]) * s};
};
/** feet minus head (world, facing +1) */
export const feetOff = (p: PoseName) => off(p, SPRITES[p].feet[0], SPRITES[p].feet[1]);
/** back-top contact point minus head (world, facing +1): body-box centre x, body-box top y */
export const backOff = (p: PoseName) => {
  const b = SPRITES[p].body;
  return off(p, (b[0] + b[2]) / 2, b[1]);
};
/** body-box centre minus head (world, facing +1) */
export const bodyOff = (p: PoseName) => {
  const b = SPRITES[p].body;
  return off(p, (b[0] + b[2]) / 2, (b[1] + b[3]) / 2);
};

const DR = SPRITES.drop;
export const DROP_H = 420;
export const DS = DROP_H / (DR.bottom - DR.top);
export const DROP_R = DR.r * DS; // radius of the round part
export const DROP_ROUND_DY = (DR.bottom - DR.center[1]) * DS; // bottom point -> round centre

export const FACE = -1; // the mosquito faces left all film long
export const Y_HOVER = -7180; // mosquito head height in the sky scenes
export const MOSQ_AIR_X = 540;
const BO_SQ = backOff('squished');
export const X_D2 = MOSQ_AIR_X + FACE * BO_SQ.x; // attacking drop x (its bottom lands on the squished back)
export const C = Y_HOVER + BO_SQ.y; // drop bottom height at contact
export const X_TAPE = 770;
export const TAPE_N = 20;

// ---------------------------------------------------------------------------------------------- seesaw
export const seesawTheta = (t: number) => {
  const r = THETA_REST;
  const relaxed = r * 0.3;
  if (t < A.hop) return r;
  if (t < A.hop + 0.12) return U.lerp(r, relaxed, U.easeOutCubic(U.inv(t, A.hop, A.hop + 0.12)));
  if (t < T.fifty) return relaxed;
  if (t < T.fifty + 0.045) return U.lerp(relaxed, r, U.easeInQuad(U.inv(t, T.fifty, T.fifty + 0.045)));
  const x = t - (T.fifty + 0.045); // left end bounces off the ground a little
  return r - 0.12 * r * Math.abs(Math.sin(2 * Math.PI * 2.4 * x)) * Math.exp(-7 * x);
};
export const plankTop = (s: number, th: number) => ({
  x: PIVOT.x + s * Math.cos(th) - PT * Math.sin(th),
  y: PIVOT.y - s * Math.sin(th) - PT * Math.cos(th),
});

// ---------------------------------------------------------------------------------------------- the attacking drop
// Velocity profile after contact: pushes the mosquito down 20 body lengths, landing exactly on "lengths",
// then a slow slow-mo drift, then real-time speed so that it hits the ground on "ground".
const VS = 115; // slow drift during line 4
const profile = (v1: number, v5: number): [number, number][] => [
  [A.contact, 0],
  [A.contact + 0.65, v1],
  [9.2, v1],
  [9.7, VS],
  [12.3, VS],
  [13.2, v5],
  [T.ground, v5],
];
const V1 = U.solveParam((v) => U.makePath(profile(v, 0)).pos(T.lengths), TAPE_N * L_BODY, 100, 5000);
const V5 = U.solveParam((v) => U.makePath(profile(V1, v)).pos(T.ground), GROUND_Y - C, 100, 8000);
export const carry = U.makePath(profile(V1, V5));
export const tickTimes = Array.from({length: TAPE_N}, (_, i) =>
  U.solveTime(carry.pos, (i + 1) * L_BODY, A.contact, 9.8),
);

export type Brow = 'none' | 'relaxed' | 'angry' | 'worried' | 'surprised' | 'puzzled' | 'flat';
export type Mouth = 'none' | 'smile' | 'frown' | 'o' | 'flat' | 'wobble' | 'grin';
export type Face = {
  look: [number, number];
  lid: number; // 0 open .. 1 closed
  brow: Brow;
  squeeze?: boolean;
  mouth?: Mouth;
  dazed?: number; // spinning pupils phase
};
export type DropState = {
  visible: boolean;
  x: number; // bottom point
  y: number;
  z: number;
  rot: number;
  sx: number;
  sy: number;
  face: Face;
  speed: number; // world px / s (for speed lines)
};

const SMUG: Face = {look: [0.15, 0.15], lid: 0.42, brow: 'relaxed', mouth: 'smile'};
const blinkLid = (t: number, at: number[]) => {
  for (const b of at) {
    const u = (t - b) / 0.14;
    if (u >= 0 && u <= 1) return Math.sin(Math.PI * u);
  }
  return 0;
};

/** look vector from a face point toward a target, clamped to the unit disc */
export const lookAt = (fx: number, fy: number, tx: number, ty: number, mag = 1): [number, number] => {
  const dx = tx - fx;
  const dy = ty - fy;
  const d = Math.hypot(dx, dy) || 1;
  return [(dx / d) * mag, (dy / d) * mag];
};

export const drop2Y = (t: number) => {
  if (t < A.contact) {
    if (t < 4.62) return U.lerp(C - 1150, C - 110, U.easeInQuad(U.inv(t, A.drop2Enter, 4.62)));
    if (t < 5.05) return U.lerp(C - 110, C - 38, U.easeOutQuad(U.inv(t, 4.62, 5.05)));
    return U.lerp(C - 38, C, U.smooth(U.inv(t, 5.05, A.contact)) * 0.6 + U.inv(t, 5.05, A.contact) * 0.4);
  }
  return C + carry.pos(t);
};
export const drop2X = (t: number) => U.lerp(X_D2, PUDDLE.x, U.easeInOutCubic(U.inv(t, 13.0, 15.6)));
export const drop2Z = (t: number) => U.lerp(Z_MAIN, Z_SPLASH, U.easeInOutCubic(U.inv(t, 13.0, 15.0)));

export const drop2 = (t: number): DropState => {
  const visible = t >= A.drop2Enter && t < T.ground + 0.05;
  const y = drop2Y(t);
  const v = (drop2Y(t + 0.004) - drop2Y(t - 0.004)) / 0.008;
  let sx = 1 - 0.05 * U.clamp(v / 1500);
  let sy = 1 + 0.07 * U.clamp(v / 1500);
  if (t >= A.contact && t < A.contact + 1) {
    const a = U.settle(t, A.contact, 1, 3, 4.5);
    sy *= 1 - 0.08 * a;
    sx *= 1 + 0.06 * a;
  }
  if (t >= T.ground) {
    const u = U.inv(t, T.ground, T.ground + 0.045);
    sy = U.lerp(sy, 0.3, u);
    sx = U.lerp(sx, 1.5, u);
  }
  let face: Face;
  if (t < A.contact) face = {look: [-0.15, 0.95], lid: 0.18, brow: 'angry', mouth: 'frown'};
  else if (t < A.contact + 0.7) face = {look: [-0.25, 1], lid: 0, brow: 'surprised', mouth: 'o'};
  else if (t < A.legsSwap) face = {look: [-0.35, 0.95], lid: 0.1, brow: 'puzzled', mouth: 'flat'};
  else if (t < A.separate) {
    const u = U.easeInOutCubic(U.inv(t, A.slideStart, A.separate));
    face = {look: [U.lerp(-0.4, -1, u), U.lerp(0.9, 0.05, u)], lid: 0, brow: 'puzzled', mouth: 'flat'};
  } else if (t < 12.7) face = {look: [-0.9, -0.35], lid: 0, brow: 'surprised', mouth: 'o'};
  else if (t < 15.72) face = {look: [0.05, 1], lid: 0.22, brow: 'angry', mouth: 'frown'};
  else if (t < T.ground) face = {look: [0, 1], lid: 0, brow: 'surprised', mouth: 'o'};
  else face = {look: [0, 0], lid: 0, brow: 'worried', squeeze: true, mouth: 'wobble'};
  return {visible, x: drop2X(t), y, z: drop2Z(t), rot: 0, sx, sy, face, speed: Math.max(0, v)};
};

// ---------------------------------------------------------------------------------------------- seesaw drop
export const drop1 = (t: number, mosq: MosqState): DropState => {
  const th = seesawTheta(t);
  const p = plankTop(S_DROP1, th);
  let hop = 0;
  let sx = 1;
  let sy = 1;
  if (t >= A.hop - 0.08 && t < A.hop) {
    const u = U.smooth(U.inv(t, A.hop - 0.08, A.hop));
    sy = 1 - 0.12 * u;
    sx = 1 + 0.08 * u;
  } else if (t >= A.hop && t < A.hop + 0.11) {
    const u = U.inv(t, A.hop, A.hop + 0.11);
    hop = 70 * U.easeOutQuad(u);
    sy = U.lerp(0.88, 1.08, U.easeOutQuad(u));
    sx = U.lerp(1.08, 0.95, u);
  } else if (t >= A.hop + 0.11 && t < T.fifty) {
    hop = 70 * (1 - U.easeInQuad(U.inv(t, A.hop + 0.11, T.fifty)));
    sy = 1.08;
    sx = 0.95;
  } else if (t >= T.fifty) {
    const a = U.settle(t, T.fifty, 1, 3.2, 7);
    sy = 1 - 0.24 * a;
    sx = 1 + 0.18 * a;
  }
  // face
  const fx = p.x;
  const fy = p.y - hop - DROP_ROUND_DY;
  let face: Face = {...SMUG, lid: Math.max(SMUG.lid, blinkLid(t, [0.72, 21.7]))};
  if (t >= A.hop - 0.12 && t < T.fifty + 0.08) face = {look: [0.75, -0.25], lid: 0.12, brow: 'angry', mouth: 'grin'};
  else if (t >= T.fifty + 0.08 && t < 3.2) face = {look: [0.35, -0.94], lid: 0, brow: 'surprised', mouth: 'smile'};
  else if (t >= 15.45 && t < T.ground) face = {look: [0.3, -0.95], lid: 0, brow: 'worried', mouth: 'o'};
  else if (t >= T.ground && t < T.ground + 0.42) face = {look: [0, 0], lid: 0, brow: 'worried', squeeze: true, mouth: 'wobble'};
  else if (t >= T.ground + 0.42 && t < A.mosqReturn + 0.2) face = {look: [0.75, 0.55], lid: 0.1, brow: 'worried', mouth: 'flat'};
  else if (t >= A.mosqReturn + 0.2 && t < 21.25) {
    const lk = lookAt(fx, fy, mosq.x, mosq.y, 0.95);
    face = {look: lk, lid: 0.08, brow: t > A.smugSwap ? 'relaxed' : 'puzzled', mouth: t > A.smugSwap ? 'smile' : 'flat'};
  }
  return {visible: true, x: p.x, y: p.y - hop, z: Z_MAIN, rot: -U.deg(th) * 0.45, sx, sy, face, speed: 0};
};

// ---------------------------------------------------------------------------------------------- demo drop (line 6)
export const MOSQ_DEMO = {x: 640, y: 120};
const SLIDE = 125; // how far the lightly-hit mosquito slides aside
const BO_HV = backOff('hover');
const D3_HIT = {x: MOSQ_DEMO.x + FACE * BO_HV.x, y: MOSQ_DEMO.y + BO_HV.y};
export const drop3 = (t: number): DropState => {
  const visible = t >= A.drop3Enter && t < A.plop;
  let x = D3_HIT.x;
  let y: number;
  let z = Z_MAIN;
  if (t < A.boop) y = U.lerp(D3_HIT.y - 650, D3_HIT.y, U.inv(t, A.drop3Enter, A.boop));
  else {
    const u = U.inv(t, A.boop, A.plop);
    // barely slows: a tiny dip right at the hit, then straight on
    y = U.lerp(D3_HIT.y, GROUND_Y, u) - 10 * Math.sin(Math.PI * U.inv(t, A.boop, A.boop + 0.12));
    const late = U.easeInQuad(U.inv(t, A.plop - 0.14, A.plop));
    x = U.lerp(D3_HIT.x, PUDDLE.x + 5, late);
    z = U.lerp(Z_MAIN, Z_SPLASH, late);
  }
  const glance = t >= A.boop && t < A.boop + 0.3;
  const face: Face = glance
    ? {look: [-0.85, 0.35], lid: 0, brow: 'puzzled', mouth: 'flat'}
    : {look: [0, 0.9], lid: 0.12, brow: 'relaxed', mouth: 'flat'};
  const sq = t >= A.boop ? 0.05 * U.settle(t, A.boop, 1, 4, 8) : 0;
  return {visible, x, y, z, rot: 0, sx: 0.96 + sq, sy: 1.06 - sq, face, speed: 1450};
};

// ---------------------------------------------------------------------------------------------- the mosquito
const LAUNCH_END = A.airArrive - 0.08;
/** head height while launched (eases out like a thrown object) */
export const launchY = (t: number) => {
  const s0 = seatHead(A.launch, 'hover');
  return U.lerp(s0.y, Y_HOVER, U.easeOutCubic(U.inv(t, A.launch, LAUNCH_END)));
};
export type MosqState = {
  visible: boolean;
  pose: PoseName;
  x: number; // head centre
  y: number;
  z: number;
  facing: number;
  rot: number; // deg, clockwise
  sx: number;
  sy: number;
  pivot: 'head' | 'feet' | 'body';
  buzz: number; // 0..1 wings buzzing
  sweat: number; // <0 none, else 0..1 progress
};

const seatHead = (t: number, pose: PoseName) => {
  const f = plankTop(S_SEAT, seesawTheta(t));
  const fo = feetOff(pose);
  return {x: f.x - FACE * fo.x, y: f.y - fo.y};
};
const swapSquash = (t: number, t0: number, amt = 0.14) => {
  if (t < t0 - 0.05) return {sx: 1, sy: 1};
  if (t < t0) {
    const u = U.smooth(U.inv(t, t0 - 0.05, t0));
    return {sx: 1 - amt * 0.6 * u, sy: 1 + amt * 0.2 * u};
  }
  const a = U.settle(t, t0, 1, 3.4, 7);
  return {sx: 1 - amt * 0.6 * a, sy: 1 + amt * 0.2 * a};
};
const bob = (t: number, amp = 4) => amp * Math.sin(2 * Math.PI * 2.1 * t);

let sepCache: {x: number; y: number} | null = null;
const sepPoint = () => {
  if (!sepCache) {
    const s = slideHead(A.separate);
    sepCache = {x: s.x, y: s.y};
  }
  return sepCache;
};
/** the tumbling mosquito sliding around the drop's round bottom (line 4) */
const slideHead = (t: number) => {
  const phi = (95 * Math.PI) / 180 * U.easeInOutCubic(U.inv(t, A.slideStart, A.separate));
  const xd = drop2X(t);
  const yd = drop2Y(t);
  const cx = xd;
  const cy = yd - DROP_R;
  const px = cx - DROP_R * Math.sin(phi);
  const py = cy + DROP_R * Math.cos(phi);
  const bo = backOff('tumble');
  const rx = -FACE * bo.x; // head - back (world), before rotation
  const ry = -bo.y;
  return {
    x: px + rx * Math.cos(phi) - ry * Math.sin(phi),
    y: py + rx * Math.sin(phi) + ry * Math.cos(phi),
    rot: U.deg(phi),
  };
};

export const mosquito = (t: number): MosqState => {
  const base = {visible: true, z: Z_MAIN, facing: FACE, rot: 0, sx: 1, sy: 1, buzz: 0, sweat: -1};
  // 1. sitting on the seesaw (frame 0) until launched
  if (t < A.launch) {
    const h = seatHead(t, 'hover');
    const breathe = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
    let sy = breathe;
    let sx = 1;
    if (t > T.fifty - 0.02) {
      const u = U.inv(t, T.fifty - 0.02, A.launch);
      sy = 1 - 0.16 * Math.sin(Math.PI * u);
      sx = 1 + 0.08 * Math.sin(Math.PI * u);
    }
    return {...base, pose: 'hover', x: h.x, y: h.y, rot: -U.deg(seesawTheta(t)) * 0.3, sx, sy, pivot: 'feet'};
  }
  // 2. launched into the sky, tumbling
  if (t < A.airArrive) {
    const s0 = seatHead(A.launch, 'hover');
    const u = U.inv(t, A.launch, LAUNCH_END);
    const e = U.easeOutCubic(u);
    const st = 1 + 0.25 * Math.exp(-9 * (t - A.launch));
    return {
      ...base,
      pose: 'tumble',
      x: U.lerp(s0.x, MOSQ_AIR_X, U.easeOutQuad(u)),
      y: launchY(t),
      rot: 720 * e,
      sx: 1 / Math.sqrt(st),
      sy: st,
      pivot: 'body',
    };
  }
  // 3. hovering in the sky
  if (t < A.scared) {
    const sq = swapSquash(t, A.airArrive);
    return {
      ...base,
      pose: 'hover',
      x: MOSQ_AIR_X,
      y: Y_HOVER + bob(t),
      rot: 10 * U.wobble(t, A.airArrive, 2.2, 4),
      ...sq,
      pivot: 'head',
      buzz: 1,
    };
  }
  // 4. scared, looking up at the falling drop; slow motion from ~5 s
  if (t < A.contact) {
    const sq = swapSquash(t, A.scared);
    const slow = U.inv(t, A.slowIn, A.slowIn + 0.25);
    const tremble = U.lerp(1.6 * Math.sin(2 * Math.PI * 14 * t), 1.2 * Math.sin(2 * Math.PI * 2.5 * t), slow);
    return {
      ...base,
      pose: 'scared_up',
      x: MOSQ_AIR_X + tremble,
      y: Y_HOVER + bob(t, U.lerp(3, 0.6, slow)),
      rot: 9 * U.easeOutCubic(U.inv(t, A.scared, A.scared + 0.25)),
      ...sq,
      pivot: 'head',
      buzz: 1 - slow,
      sweat: t >= A.sweat ? U.inv(t, A.sweat, A.contact) : -1,
    };
  }
  // 5. squashed under the drop and carried down
  if (t < A.legsSwap) {
    const a = U.settle(t, A.contact, 1, 2.6, 4);
    return {
      ...base,
      pose: 'squished',
      x: drop2X(t) - FACE * BO_SQ.x,
      y: drop2Y(t) - BO_SQ.y,
      sx: 1 + 0.1 * a,
      sy: 1 - 0.16 * a,
      pivot: 'body',
    };
  }
  // 6. legs and wings out: drag tips it around the drop's round front
  if (t < A.separate) {
    const s = slideHead(t);
    const sq = swapSquash(t, A.legsSwap, 0.18);
    return {...base, pose: 'tumble', x: s.x, y: s.y, rot: s.rot, ...sq, pivot: 'head'};
  }
  // 7. free: flips upright and stays behind while the drop falls on
  if (t < 14.2) {
    const p = sepPoint();
    const u = U.inv(t, A.separate, A.separate + 0.7);
    const flip = U.inv(t, A.separate, A.separate + 0.38);
    const pose: PoseName = t < A.separate + 0.2 ? 'tumble' : 'hover';
    const sq = swapSquash(t, A.separate + 0.2);
    return {
      ...base,
      pose,
      x: p.x - 95 * U.easeOutCubic(u),
      y: p.y + 30 * U.easeOutCubic(u) + (t > A.overlayOff ? bob(t) : 0),
      rot: 95 * (1 - U.easeOutBack(flip, 1.4)),
      ...sq,
      pivot: 'head',
      buzz: t > A.overlayOff ? 1 : 0,
      visible: t < 14.2,
    };
  }
  if (t < A.mosqReturn) return {...base, visible: false, pose: 'hover', x: 0, y: 0, pivot: 'head'};
  // 8. flies back in
  if (t < A.mosqArrive) {
    const e = U.easeInOutCubic(U.inv(t, A.mosqReturn, A.mosqArrive));
    return {
      ...base,
      pose: 'hover',
      x: U.lerp(1250, MOSQ_DEMO.x, e),
      y: U.lerp(-380, MOSQ_DEMO.y, e) + bob(t),
      rot: -12 * Math.sin(Math.PI * e),
      pivot: 'head',
      buzz: 1,
    };
  }
  // 9. hovering; 10. the light hit: a small push, slides off, wobbles, shakes it off
  if (t < A.smugSwap) {
    let x = MOSQ_DEMO.x;
    let y = MOSQ_DEMO.y + bob(t);
    let rot = 0;
    let sx = 1;
    let sy = 1;
    if (t >= A.boop) {
      const push = U.easeOutQuad(U.inv(t, A.boop, A.boop + 0.09)) - 0.45 * U.easeInOutCubic(U.inv(t, A.boop + 0.09, A.boop + 0.6));
      y += 36 * push;
      x -= SLIDE * U.easeOutCubic(U.inv(t, A.boop + 0.01, A.boop + 0.22));
      rot = -20 * U.wobble(t, A.boop, 2.3, 3.4) + 9 * U.wobble(t, 19.9, 5, 6);
      const a = U.settle(t, A.boop, 1, 3.5, 7);
      sx = 1 + 0.08 * a;
      sy = 1 - 0.14 * a;
    }
    return {...base, pose: 'hover', x, y, rot, sx, sy, pivot: 'head', buzz: 1};
  }
  // 11. smug, glides down onto the seesaw
  const from = {x: MOSQ_DEMO.x - SLIDE, y: MOSQ_DEMO.y + 36 * 0.55};
  if (t < A.land) {
    const e = U.easeInOutCubic(U.inv(t, A.smugSwap + 0.06, A.land));
    const to = seatHead(A.land, 'smug');
    const sq = swapSquash(t, A.smugSwap);
    return {
      ...base,
      pose: 'smug',
      x: U.lerp(from.x, to.x, e),
      y: U.lerp(from.y + bob(t), to.y, e),
      ...sq,
      pivot: 'head',
      buzz: 1,
    };
  }
  // 12. landed (smug), 13. back to the frame-0 pose for the loop
  const pose: PoseName = t < A.finalSwap ? 'smug' : 'hover';
  const h = seatHead(t, pose);
  const land = U.settle(t, A.land, 1, 3.2, 7);
  const sq = t >= A.finalSwap ? swapSquash(t, A.finalSwap, 0.1) : {sx: 1 + 0.06 * land, sy: 1 - 0.1 * land};
  const breathe = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
  return {
    ...base,
    pose,
    x: h.x,
    y: h.y,
    rot: -U.deg(seesawTheta(t)) * 0.3,
    sx: sq.sx,
    sy: sq.sy * breathe,
    pivot: 'feet',
  };
};

// ---------------------------------------------------------------------------------------------- puddle + splashes
export const puddle = (t: number) => {
  if (t < T.ground || t > A.puddleGone) return null;
  const grow = U.easeOutBack(U.inv(t, T.ground, T.ground + 0.2), 1.6);
  const shrink = 1 - U.easeInCubic(U.inv(t, A.puddleShrink, A.puddleGone));
  const bulge = t >= A.plop ? U.wobble(t, A.plop, 3, 5) : 0;
  let face: Face;
  if (t < T.ground + 0.75) face = {look: [0, 0], lid: 0, brow: 'worried', squeeze: true, mouth: 'wobble'};
  else if (t < A.plop) face = {look: [0, 0], lid: 0.25, brow: 'worried', mouth: 'wobble', dazed: t};
  else if (t < A.plop + 0.5) face = {look: [0, 0], lid: 0, brow: 'worried', squeeze: true, mouth: 'wobble'};
  else face = {look: [-0.55, -0.6], lid: 0.48, brow: 'flat', mouth: 'flat'};
  return {
    x: PUDDLE.x,
    y: PUDDLE.y,
    rx: 178 * grow * shrink * (1 + 0.06 * bulge),
    ry: 30 * grow * shrink * (1 - 0.25 * bulge),
    face,
    faceScale: grow * shrink,
  };
};

// ---------------------------------------------------------------------------------------------- tape measure
export const tape = (t: number) => {
  if (t < A.contact - 0.08 || t > A.tapeRetract + 0.62) return null;
  const pop = U.easeOutBack(U.inv(t, A.contact - 0.08, A.contact + 0.1), 2) * (1 - U.easeInCubic(U.inv(t, A.tapeRetract + 0.45, A.tapeRetract + 0.62)));
  const full = TAPE_N * L_BODY;
  let len = Math.min(carry.pos(t), full);
  if (t > A.tapeRetract) len = U.lerp(full, 0, U.easeInCubic(U.inv(t, A.tapeRetract, A.tapeRetract + 0.4)));
  return {x: X_TAPE, top: C - 70, zeroY: C, len, pop};
};

// ---------------------------------------------------------------------------------------------- slow motion
// time-warp factor for ambient motion (rain); 1 = real time
const warpPts: [number, number][] = [
  [0, 1],
  [A.slowIn, 1],
  [A.slowIn + 0.22, 0.04],
  [12.2, 0.04],
  [12.45, 1],
  [40, 1],
];
const warpPath = U.makePath(warpPts);
export const sceneTime = (t: number) => warpPath.pos(t);
export const warp = (t: number) => warpPath.vel(t);
export const slowOverlay = (t: number) => {
  if (t < A.overlayOn || t > A.overlayOff + 0.12) return 0;
  return U.easeOutBack(U.inv(t, A.overlayOn, A.overlayOn + 0.16), 2) * (1 - U.inv(t, A.overlayOff, A.overlayOff + 0.12));
};

// ---------------------------------------------------------------------------------------------- camera
export type Cam = {x: number; y: number; z: number};
export const zOf = (k: number) => 1000 - 1000 / k; // camera z giving scale k on the Z=1000 plane
export const kOf = (z: number) => 1000 / (1000 - z);
export const CAM0: Cam = {x: 505, y: 330, z: zOf(1.45)};
const CAM_AIR: Cam = {x: 560, y: Y_HOVER - 150, z: zOf(1.7)};
const CAM_CLOSE: Cam = {x: 600, y: Y_HOVER - 60, z: zOf(2.2)};
const WIDE_K = 0.54;
const CAM_WIDE: Cam = {x: 660, y: C + 1510, z: zOf(WIDE_K)};
const lerpCam = (a: Cam, b: Cam, e: number): Cam => ({
  x: U.lerp(a.x, b.x, e),
  y: U.lerp(a.y, b.y, e),
  z: zOf(U.logLerp(kOf(a.z), kOf(b.z), e)),
});
const trackS5 = (t: number): Cam => ({x: drop2X(t) - 20, y: drop2Y(t) - 120, z: zOf(1.25)});

export const camAt = (t: number): Cam => {
  if (t < A.camRise) return CAM0;
  if (t < A.camAir) {
    const w = U.smooth(U.inv(t, A.camRise, A.camRise + 0.4));
    const offY = U.lerp(230, CAM_AIR.y - Y_HOVER, U.easeInOutCubic(U.inv(t, 2.7, A.camAir)));
    const follow: Cam = {x: CAM_AIR.x, y: launchY(t) + offY, z: CAM_AIR.z};
    return lerpCam(CAM0, follow, w);
  }
  if (t < 4.55) return CAM_AIR;
  if (t < A.pushInEnd) return lerpCam(CAM_AIR, CAM_CLOSE, U.easeInOutCubic(U.inv(t, 4.55, A.pushInEnd)));
  if (t < A.contact) return CAM_CLOSE;
  if (t < A.wide) {
    const e = U.easeInOutCubic(U.inv(t, A.contact, A.wide));
    const track: Cam = {x: CAM_CLOSE.x, y: drop2Y(t) - BO_SQ.y - 60, z: CAM_CLOSE.z};
    return lerpCam(track, CAM_WIDE, e);
  }
  if (t < A.pushIn2) return CAM_WIDE;
  if (t < A.pushIn2End) {
    const e = U.easeInOutCubic(U.inv(t, A.pushIn2, A.pushIn2End));
    return lerpCam(CAM_WIDE, {x: 548, y: drop2Y(t) - 70, z: zOf(1.6)}, e);
  }
  if (t < 12.35) return {x: 548, y: drop2Y(t) - 70, z: zOf(1.6)};
  if (t < 13.2) {
    const e = U.easeInOutCubic(U.inv(t, 12.35, 13.2));
    return lerpCam({x: 548, y: drop2Y(t) - 70, z: zOf(1.6)}, trackS5(t), e);
  }
  if (t < A.camGlide) return trackS5(t);
  if (t < A.camGlideEnd) return lerpCam(trackS5(t), CAM0, U.easeInOutCubic(U.inv(t, A.camGlide, A.camGlideEnd)));
  return CAM0;
};

/** screen shake (screen px), sums of sines times envelopes */
export const shake = (t: number) => {
  const env = (t0: number, amp: number, d: number) => (t >= t0 ? amp * Math.exp(-d * (t - t0)) : 0);
  const e = env(T.fifty, 9, 8) + env(A.contact, 3, 6) + env(T.ground, 22, 6) + env(A.plop, 4, 9) + env(A.boop, 2.5, 9);
  return {
    x: (e * (Math.sin(2 * Math.PI * 13.3 * t) + 0.5 * Math.sin(2 * Math.PI * 7.1 * t + 1))) / 1.5,
    y: (e * (Math.sin(2 * Math.PI * 11.7 * t + 0.7) + 0.5 * Math.sin(2 * Math.PI * 5.3 * t + 2))) / 1.5,
  };
};
