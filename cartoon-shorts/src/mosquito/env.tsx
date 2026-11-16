import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Cam, GROUND_Y, sceneTime, warp} from './choreo';
import * as U from './util';

const INK = '#141414';

// ------------------------------------------------------------------------------------------- layer
/** One flat multiplane layer at depth z: scale k = 1000 / (z - cam.z). Children use world coordinates. */
export const Layer: React.FC<{cam: Cam; z: number; blur?: number; children: React.ReactNode}> = ({cam, z, blur = 0, children}) => {
  const d = z - cam.z;
  if (d < 250) return null;
  const k = 1000 / d;
  return (
    <AbsoluteFill style={{filter: blur > 0.05 ? `blur(${blur}px)` : undefined}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          transformOrigin: '0 0',
          transform: `translate(540px, 960px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
export const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
    {children}
  </svg>
);
/** visible world rectangle of a layer at depth z (with margin) */
export const view = (cam: Cam, z: number, margin = 200) => {
  const k = 1000 / (z - cam.z);
  return {x0: cam.x - 540 / k - margin, x1: cam.x + 540 / k + margin, y0: cam.y - 960 / k - margin, y1: cam.y + 960 / k + margin, k};
};

// ------------------------------------------------------------------------------------------- sky (screen space)
export const Sky: React.FC<{cam: Cam}> = ({cam}) => {
  const alt = U.clamp(-cam.y / 7000); // 0 at the ground, 1 high up
  const top = mix('#6E94B0', '#86AECB', alt);
  const bot = mix('#B9CEDB', '#D2E2EC', alt);
  return <AbsoluteFill style={{background: `linear-gradient(180deg, ${top} 0%, ${bot} 100%)`}} />;
};
const mix = (a: string, b: string, u: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(U.lerp(v, pb[i], u))).join(',')})`;
};

// ------------------------------------------------------------------------------------------- clouds
type Cloud = {x: number; y: number; puffs: [number, number, number][]};
const makeClouds = (seed: number, n: number, x0: number, x1: number, y0: number, y1: number, size: number): Cloud[] => {
  const rnd = U.mulberry32(seed);
  const out: Cloud[] = [];
  for (let i = 0; i < n; i++) {
    const w = size * (0.7 + rnd() * 0.8);
    const m = 5 + Math.floor(rnd() * 4);
    const puffs: [number, number, number][] = [];
    for (let j = 0; j < m; j++) {
      const u = j / (m - 1) - 0.5;
      const r = w * (0.2 + 0.16 * Math.cos(u * Math.PI) + rnd() * 0.07);
      puffs.push([u * w * 1.5, -r * 0.55 + rnd() * w * 0.06, r]);
    }
    puffs.push([0, -w * 0.32, w * 0.3]);
    out.push({x: x0 + rnd() * (x1 - x0), y: y0 + ((i + rnd() * 0.8) / n) * (y1 - y0), puffs});
  }
  return out;
};
const CLOUDS_FAR = makeClouds(11, 30, -2400, 3600, -12500, -900, 900);
const CLOUDS_MID = makeClouds(23, 30, -1400, 2600, -10200, -1300, 520);

/** soft (0..1): depth-of-field stand-in while the camera is close - outlines fade toward the fill, fills toward haze */
export const Clouds: React.FC<{cam: Cam; z: number; far: boolean; t: number; soft?: number}> = ({cam, z, far, t, soft = 0}) => {
  const v = view(cam, z, far ? 1400 : 900);
  const list = far ? CLOUDS_FAR : CLOUDS_MID;
  const drift = sceneTime(t) * (far ? 5 : 9);
  const sw = far ? 10 : 7;
  const haze = '#C6D6E1';
  const fill = mix(far ? '#BCCAD5' : '#A9B9C7', haze, 0.35 * soft);
  const shade = mix(far ? '#A9B8C5' : '#93A4B3', haze, 0.35 * soft);
  const ink = mix(far ? '#39444E' : '#141414', far ? '#A9B8C5' : '#93A4B3', 0.62 * soft);
  const vis = list.filter((c) => c.x + drift > v.x0 && c.x + drift < v.x1 && c.y > v.y0 && c.y < v.y1);
  return (
    <Svg>
      {vis.map((c, i) => (
        <g key={i} transform={`translate(${c.x + drift} ${c.y})`}>
          {c.puffs.map(([x, y, r], j) => (
            <circle key={`i${j}`} cx={x} cy={y} r={r + sw} fill={ink} />
          ))}
          {c.puffs.map(([x, y, r], j) => (
            <circle key={`s${j}`} cx={x} cy={y} r={r} fill={shade} />
          ))}
          {c.puffs.map(([x, y, r], j) => (
            <circle key={`f${j}`} cx={x - r * 0.06} cy={y - r * 0.14} r={r * 0.86} fill={fill} />
          ))}
        </g>
      ))}
    </Svg>
  );
};

// ------------------------------------------------------------------------------------------- hills + ground bands
const hillY = (x: number) => GROUND_Y - (70 + 55 * Math.sin(x / 520 + 0.6) + 32 * Math.sin(x / 233 + 2.1) + 20 * Math.sin(x / 97));
export const Hills: React.FC<{cam: Cam; z: number}> = ({cam, z}) => {
  const v = view(cam, z, 600);
  if (v.y1 < GROUND_Y - 260) return null;
  const pts: string[] = [];
  for (let x = Math.floor(v.x0 / 40) * 40; x <= v.x1 + 40; x += 40) pts.push(`${x} ${hillY(x).toFixed(1)}`);
  const top = `M ${pts.join(' L ')}`;
  const x0 = Math.floor(v.x0 / 40) * 40;
  const x1 = x0 + (pts.length - 1) * 40;
  return (
    <Svg>
      <path d={`${top} L ${x1} ${GROUND_Y + 40000} L ${x0} ${GROUND_Y + 40000} Z`} fill="#93C98A" />
      <path d={top} fill="none" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      <rect x={x0} y={GROUND_Y + 25} width={x1 - x0} height={40000} fill="#86C66D" />
      <path d={`M ${x0} ${GROUND_Y + 25} L ${x1} ${GROUND_Y + 25}`} stroke={INK} strokeWidth={9} />
    </Svg>
  );
};
export const GroundBand: React.FC<{cam: Cam; z: number}> = ({cam, z}) => {
  const v = view(cam, z, 400);
  if (v.y1 < GROUND_Y) return null;
  return (
    <Svg>
      <rect x={v.x0} y={GROUND_Y} width={v.x1 - v.x0} height={Math.max(10, v.y1 - GROUND_Y + 400)} fill="#7DC562" />
    </Svg>
  );
};

// grass tufts / bushes (outlined, flat)
const tuftPath = (x: number, y: number, s: number) =>
  `M ${x - 26 * s} ${y} Q ${x - 22 * s} ${y - 24 * s} ${x - 30 * s} ${y - 44 * s} Q ${x - 12 * s} ${y - 26 * s} ${x - 8 * s} ${y - 10 * s}` +
  ` Q ${x - 6 * s} ${y - 40 * s} ${x + 2 * s} ${y - 62 * s} Q ${x + 10 * s} ${y - 36 * s} ${x + 9 * s} ${y - 10 * s}` +
  ` Q ${x + 16 * s} ${y - 28 * s} ${x + 32 * s} ${y - 40 * s} Q ${x + 24 * s} ${y - 20 * s} ${x + 26 * s} ${y} Z`;
export const Tufts: React.FC<{items: [number, number][]; sw: number; color?: string}> = ({items, sw, color = '#5FAE45'}) => (
  <Svg>
    {items.map(([x, s], i) => (
      <path key={i} d={tuftPath(x, GROUND_Y + 2, s)} fill={color} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    ))}
  </Svg>
);
export const Bushes: React.FC<{items: [number, number][]}> = ({items}) => (
  <Svg>
    {items.map(([x, s], i) => {
      const puffs: [number, number, number][] = [
        [-50, -30, 42],
        [0, -52, 54],
        [52, -30, 40],
        [26, -14, 34],
        [-28, -12, 34],
      ];
      return (
        <g key={i} transform={`translate(${x} ${GROUND_Y + 6}) scale(${s})`}>
          {puffs.map(([px, py, r], j) => (
            <circle key={`o${j}`} cx={px} cy={py} r={r + 6} fill={INK} />
          ))}
          {puffs.map(([px, py, r], j) => (
            <circle key={`s${j}`} cx={px} cy={py} r={r} fill="#4F9A3E" />
          ))}
          {puffs.map(([px, py, r], j) => (
            <circle key={`f${j}`} cx={px - 4} cy={py - 6} r={r * 0.84} fill="#63B24C" />
          ))}
        </g>
      );
    })}
  </Svg>
);

// ------------------------------------------------------------------------------------------- rain
type RainSpec = {z: number; n: number; tw: number; th: number; len: number; w: number; alpha: number; seed: number};
export const RAIN: RainSpec[] = [
  {z: 2400, n: 60, tw: 2600, th: 4400, len: 70, w: 6, alpha: 0.42, seed: 3},
  {z: 1500, n: 34, tw: 1700, th: 2900, len: 56, w: 4.6, alpha: 0.5, seed: 5},
  {z: 1000, n: 22, tw: 1300, th: 2200, len: 46, w: 3.6, alpha: 0.6, seed: 7},
  {z: 700, n: 7, tw: 1000, th: 1600, len: 40, w: 3.2, alpha: 0.65, seed: 9},
];
const rainBase = new Map<number, [number, number, number][]>();
const getBase = (r: RainSpec) => {
  if (!rainBase.has(r.seed)) {
    const rnd = U.mulberry32(r.seed);
    rainBase.set(
      r.seed,
      Array.from({length: r.n}, () => [rnd() * r.tw, rnd() * r.th, 0.75 + rnd() * 0.5] as [number, number, number]),
    );
  }
  return rainBase.get(r.seed)!;
};
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Rain streaks: world-space, wrap in tiles; in slow motion they shrink to hanging drops; long when the camera rushes. */
export const Rain: React.FC<{cam: Cam; camV: {x: number; y: number}; spec: RainSpec; t: number}> = ({cam, camV, spec, t}) => {
  const v = view(cam, spec.z, 120);
  const S = sceneTime(t);
  const w = warp(t);
  const vy = 2300;
  const vx = -330;
  const dl = Math.hypot(vx, vy);
  const dx = vx / dl;
  const dy = vy / dl;
  const base = getBase(spec);
  const lines: React.ReactNode[] = [];
  const ix0 = Math.floor(v.x0 / spec.tw);
  const ix1 = Math.floor(v.x1 / spec.tw);
  const iy0 = Math.floor(v.y0 / spec.th);
  const iy1 = Math.floor(v.y1 / spec.th);
  const len = spec.len * (0.16 + 0.84 * w);
  // the world streams past the camera: stretch streaks along the camera's motion (one frame of travel)
  const sx = (camV.x / 60) * 0.9;
  const sy = (camV.y / 60) * 0.9;
  for (let ix = ix0; ix <= ix1; ix++) {
    for (let iy = iy0; iy <= iy1; iy++) {
      base.forEach(([bx, by, sc], j) => {
        const x = ix * spec.tw + mod(bx + vx * S * sc, spec.tw);
        const y = iy * spec.th + mod(by + vy * S * sc, spec.th);
        if (x < v.x0 || x > v.x1 || y < v.y0 || y > v.y1) return;
        const L = len * sc;
        lines.push(
          <line
            key={`${ix}_${iy}_${j}`}
            x1={x}
            y1={y}
            x2={x - dx * L - sx}
            y2={y - dy * L - sy}
            stroke="#F1F8FF"
            strokeWidth={spec.w}
            strokeLinecap="round"
          />,
        );
      });
    }
  }
  return (
    <Svg>
      <g opacity={spec.alpha}>{lines}</g>
    </Svg>
  );
};

/** little splash marks where rain hits the ground (only drawn when the ground is in view) */
export const GroundSplashes: React.FC<{t: number; seed: number; x0: number; x1: number; perSec: number; scale: number}> = ({t, seed, x0, x1, perSec, scale}) => {
  const out: React.ReactNode[] = [];
  const life = 0.22;
  const n0 = Math.floor((t - life) * perSec);
  const n1 = Math.floor(t * perSec);
  for (let n = n0; n <= n1; n++) {
    const rnd = U.mulberry32(seed * 1000 + n * 7919);
    const at = n / perSec + rnd() * (1 / perSec);
    const u = (t - at) / life;
    if (u < 0 || u > 1) continue;
    const x = x0 + rnd() * (x1 - x0);
    const s = scale * (0.8 + rnd() * 0.5) * Math.sin(Math.PI * u);
    out.push(
      <g key={n} transform={`translate(${x} ${GROUND_Y + 4})`} opacity={1 - u * 0.4}>
        <path d={`M ${-14 * s} ${-2} q ${-6 * s} ${-16 * s} ${-12 * s} ${-20 * s}`} stroke="#F1F8FF" strokeWidth={3.2 * scale} fill="none" strokeLinecap="round" />
        <path d={`M ${14 * s} ${-2} q ${6 * s} ${-16 * s} ${12 * s} ${-20 * s}`} stroke="#F1F8FF" strokeWidth={3.2 * scale} fill="none" strokeLinecap="round" />
        <path d={`M 0 ${-4} l 0 ${-22 * s}`} stroke="#F1F8FF" strokeWidth={3.2 * scale} strokeLinecap="round" />
      </g>,
    );
  }
  return <Svg>{out}</Svg>;
};

/** small daisies on the ground (flat, outlined) */
export const Flowers: React.FC<{items: [number, number, string][]}> = ({items}) => (
  <Svg>
    {items.map(([x, s, c], i) => (
      <g key={i} transform={`translate(${x} ${GROUND_Y + 6}) scale(${s})`}>
        <path d="M 0 0 Q 3 -18 0 -34" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
        <path d="M 0 0 Q 3 -18 0 -34" stroke="#4E9A3A" strokeWidth={3} fill="none" strokeLinecap="round" />
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx={0} cy={-46} rx={7} ry={11} transform={`rotate(${a} 0 -34) translate(0 0)`} fill={c} stroke={INK} strokeWidth={2.6} />
        ))}
        <circle cx={0} cy={-34} r={7} fill="#F6C443" stroke={INK} strokeWidth={2.6} />
      </g>
    ))}
  </Svg>
);
