import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FaceSvg} from './actors';
import {GROUND_Y, L_BODY, puddle, slowOverlay, tape, TAPE_N, tickTimes} from './choreo';
import {Svg} from './env';
import * as U from './util';

const INK = '#141414';
const WATER = '#4DB0F0';
const WATER_DEEP = '#2F8FD6';

// ------------------------------------------------------------------------------------------- tape measure
export const TapeMeasure: React.FC<{t: number}> = ({t}) => {
  const tp = tape(t);
  if (!tp) return null;
  const W = 50;
  const x = tp.x;
  const y0 = tp.top + 40;
  const yEnd = tp.zeroY + tp.len;
  const ticks: React.ReactNode[] = [];
  for (let i = 0; i <= TAPE_N; i++) {
    const y = tp.zeroY + i * L_BODY;
    if (y > yEnd + 0.5) break;
    const passed = i === 0 || t >= tickTimes[i - 1];
    const pop = i > 0 ? 1 + 0.9 * (1 - U.inv(t, tickTimes[i - 1], tickTimes[i - 1] + 0.18)) * (t >= tickTimes[i - 1] ? 1 : 0) : 1;
    const major = i % 5 === 0;
    const len = (major ? W : W * 0.55) * pop;
    ticks.push(
      <line key={i} x1={x - W / 2} y1={y} x2={x - W / 2 + len} y2={y} stroke={passed && i === TAPE_N ? '#E2382E' : INK} strokeWidth={major ? 7 : 5} strokeLinecap="round" />,
    );
  }
  // the 20th mark gets a little burst
  const t20 = tickTimes[TAPE_N - 1];
  const burst = t >= t20 && t < t20 + 0.45 && yEnd >= tp.zeroY + TAPE_N * L_BODY - 1 ? U.inv(t, t20, t20 + 0.45) : -1;
  return (
    <Svg>
      <g transform={`translate(${x} ${tp.top}) scale(${tp.pop}) translate(${-x} ${-tp.top})`}>
        {yEnd > y0 ? (
          <>
            <rect x={x - W / 2} y={y0} width={W} height={yEnd - y0} fill="#F5CB3A" stroke={INK} strokeWidth={3.4} />
            <rect x={x + W / 2 - 9} y={y0} width={6} height={yEnd - y0} fill="#DDAE1F" />
            {ticks}
            {/* end hook */}
            <rect x={x - W / 2 - 6} y={yEnd - 6} width={W + 12} height={12} rx={4} fill="#9AA3AD" stroke={INK} strokeWidth={3} />
          </>
        ) : null}
        {/* case */}
        <rect x={x - 58} y={tp.top - 58} width={116} height={104} rx={26} fill="#F5CB3A" stroke={INK} strokeWidth={3.6} />
        <rect x={x - 46} y={tp.top + 14} width={92} height={22} rx={10} fill="#DDAE1F" />
        <circle cx={x} cy={tp.top - 8} r={24} fill="#E9EDF1" stroke={INK} strokeWidth={3.2} />
        <circle cx={x} cy={tp.top - 8} r={7} fill={INK} />
        <rect x={x - 58} y={tp.top - 58} width={116} height={104} rx={26} fill="none" stroke={INK} strokeWidth={3.6} />
      </g>
      {burst >= 0 ? <Star x={x + 30} y={tp.zeroY + TAPE_N * L_BODY} r={70 * Math.sin(Math.PI * burst)} sw={4} /> : null}
    </Svg>
  );
};

// ------------------------------------------------------------------------------------------- star burst
export const Star: React.FC<{x: number; y: number; r: number; sw: number; points?: number; fill?: string}> = ({x, y, r, sw, points = 8, fill = '#FFF4C2'}) => {
  if (r < 0.5) return null;
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.5;
    pts.push(`${x + rr * Math.cos(a)},${y + rr * Math.sin(a)}`);
  }
  return <polygon points={pts.join(' ')} fill={fill} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />;
};

// ------------------------------------------------------------------------------------------- splash
type Droplet = {a: number; v: number; r: number};
const makeDroplets = (seed: number, n: number, vmin: number, vmax: number, rmin: number, rmax: number): Droplet[] => {
  const rnd = U.mulberry32(seed);
  return Array.from({length: n}, () => ({a: -Math.PI * (0.06 + rnd() * 0.88), v: vmin + rnd() * (vmax - vmin), r: rmin + rnd() * (rmax - rmin)}));
};
const BIG = makeDroplets(41, 18, 520, 1350, 7, 15);
const SMALL = makeDroplets(77, 9, 300, 760, 5, 10);

export const Splash: React.FC<{t: number; t0: number; x: number; big: boolean}> = ({t, t0, x, big}) => {
  const tt = t - t0;
  if (tt < 0 || tt > 1.2) return null;
  const y = GROUND_Y;
  const g = 3600;
  const fingers = big ? 9 : 6;
  const Lmax = big ? 170 : 85;
  const grow = U.easeOutCubic(U.inv(tt, 0, 0.1));
  const fall = U.easeInCubic(U.inv(tt, 0.14, 0.55));
  const L = Lmax * grow * (1 - fall);
  const drops = (big ? BIG : SMALL).map((d, i) => {
    const vx = Math.cos(d.a) * d.v;
    const vy = Math.sin(d.a) * d.v;
    const px = x + vx * tt;
    const py = y - 10 + vy * tt + 0.5 * g * tt * tt;
    const landT = (-vy + Math.sqrt(vy * vy + 2 * g * 10)) / g; // when it comes back to the ground
    if (tt > landT + 0.16) return null;
    if (tt > landT) {
      const s = 1 - (tt - landT) / 0.16;
      return <ellipse key={i} cx={x + vx * landT} cy={y} rx={d.r * 1.6 * s} ry={d.r * 0.45 * s} fill={WATER} stroke={INK} strokeWidth={2.4} />;
    }
    const sp = Math.hypot(vx, vy + g * tt);
    const ang = U.deg(Math.atan2(vy + g * tt, vx));
    const st = 1 + Math.min(1.2, sp / 1400);
    return (
      <g key={i} transform={`translate(${px} ${py}) rotate(${ang})`}>
        <ellipse cx={0} cy={0} rx={d.r * st} ry={d.r / Math.sqrt(st)} fill={WATER} stroke={INK} strokeWidth={2.6} />
        <ellipse cx={-d.r * 0.25} cy={-d.r * 0.3} rx={d.r * 0.35} ry={d.r * 0.18} fill="#ffffff" />
      </g>
    );
  });
  const fingerPaths: string[] = [];
  if (L > 2) {
    for (let i = 0; i < fingers; i++) {
      const a = -Math.PI * (0.1 + (0.8 * i) / (fingers - 1));
      const len = L * (0.75 + 0.25 * Math.sin(i * 2.3 + 1));
      const bw = big ? 26 : 16;
      const tx = x + Math.cos(a) * len;
      const ty = y + Math.sin(a) * len;
      const nx = -Math.sin(a);
      const ny = Math.cos(a);
      const r = bw * 0.42;
      fingerPaths.push(
        `M ${x + nx * bw} ${y + ny * bw} Q ${x + Math.cos(a) * len * 0.5 + nx * bw * 0.3} ${y + Math.sin(a) * len * 0.5 + ny * bw * 0.3} ${tx + nx * r} ${ty + ny * r}` +
          ` A ${r} ${r} 0 1 0 ${tx - nx * r} ${ty - ny * r}` +
          ` Q ${x + Math.cos(a) * len * 0.5 - nx * bw * 0.3} ${y + Math.sin(a) * len * 0.5 - ny * bw * 0.3} ${x - nx * bw} ${y - ny * bw} Z`,
      );
    }
  }
  const star = big ? U.inv(tt, 0, 0.2) : -1;
  return (
    <Svg>
      {star >= 0 && star < 1 ? <Star x={x} y={y - 30} r={165 * Math.sin(Math.PI * star)} sw={4} points={10} /> : null}
      {fingerPaths.map((d, i) => (
        <path key={`o${i}`} d={d} fill={INK} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      ))}
      {fingerPaths.map((d, i) => (
        <path key={`f${i}`} d={d} fill={WATER} />
      ))}
      {drops}
    </Svg>
  );
};

// ------------------------------------------------------------------------------------------- puddle with a face
export const Puddle: React.FC<{t: number}> = ({t}) => {
  const p = puddle(t);
  if (!p || p.rx < 1) return null;
  const R = 92 * p.faceScale;
  return (
    <Svg>
      <ellipse cx={p.x} cy={p.y + 4} rx={p.rx + 4} ry={p.ry + 4} fill={INK} />
      <ellipse cx={p.x} cy={p.y + 4} rx={p.rx} ry={p.ry} fill={WATER_DEEP} />
      <ellipse cx={p.x - p.rx * 0.04} cy={p.y + 1} rx={p.rx * 0.92} ry={p.ry * 0.76} fill={WATER} />
      <path d={`M ${p.x - p.rx * 0.62} ${p.y - p.ry * 0.25} Q ${p.x - p.rx * 0.4} ${p.y - p.ry * 0.62} ${p.x - p.rx * 0.12} ${p.y - p.ry * 0.58}`} stroke="#ffffff" strokeWidth={5} fill="none" strokeLinecap="round" />
      {R > 4 ? <FaceSvg f={p.face} cx={p.x + 6} cy={p.y - 4} R={R} lidColor="#3C9BE0" /> : null}
    </Svg>
  );
};

// ------------------------------------------------------------------------------------------- drag lines (line 4)
export const DragLines: React.FC<{t: number; x: number; y: number}> = ({t, x, y}) => {
  const a = U.inv(t, 10.85, 11.1) * (1 - U.inv(t, 11.95, 12.15));
  if (a <= 0.01) return null;
  const items = [
    [-150, 40, 64],
    [-95, -20, 52],
    [-40, 95, 58],
    [35, 70, 46],
    [-185, -60, 44],
    [80, 120, 50],
  ];
  return (
    <Svg>
      <g opacity={a}>
        {items.map(([dx, dy, len], i) => {
          const ph = ((t * 0.55 + i * 0.37) % 1) - 0.5; // slow drift upward (slow motion)
          const yy = y + dy - ph * 120;
          const d = `M ${x + dx} ${yy + len / 2} q ${-10} ${-len / 2} 0 ${-len}`;
          return (
            <g key={i}>
              <path d={d} stroke={INK} strokeWidth={7.5} fill="none" strokeLinecap="round" />
              <path d={d} stroke="#ffffff" strokeWidth={3.6} fill="none" strokeLinecap="round" />
            </g>
          );
        })}
      </g>
    </Svg>
  );
};

// ------------------------------------------------------------------------------------------- screen-space overlays
export const SpeedLines: React.FC<{t: number; vScreen: number}> = ({t, vScreen}) => {
  const a = U.clamp((Math.abs(vScreen) - 1400) / 3500);
  if (a <= 0.01) return null;
  const dir = Math.sign(vScreen); // camera moving down (+) -> world streams up
  const rnd = U.mulberry32(5);
  const lines = Array.from({length: 14}, (_, i) => {
    const x = 40 + ((i + rnd() * 0.8) / 14) * 1000;
    const base = rnd() * 2600;
    const len = U.clamp(Math.abs(vScreen) * 0.07, 80, 620) * (0.6 + rnd() * 0.6);
    const y = ((base - dir * t * Math.abs(vScreen) * 0.55) % 2600 + 2600) % 2600 - 340;
    return <line key={i} x1={x} y1={y} x2={x} y2={y + len} stroke="#ffffff" strokeWidth={6} strokeLinecap="round" />;
  });
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g opacity={0.5 * a}>{lines}</g>
      </svg>
    </AbsoluteFill>
  );
};

export const SlowMoOverlay: React.FC<{t: number}> = ({t}) => {
  const p = slowOverlay(t);
  if (p <= 0.001) return null;
  const m = 64;
  const L = 120;
  const corner = (x: number, y: number, sx: number, sy: number, key: string) => (
    <g key={key}>
      <path d={`M ${x} ${y + sy * L} L ${x} ${y} L ${x + sx * L} ${y}`} stroke={INK} strokeWidth={17} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${x} ${y + sy * L} L ${x} ${y} L ${x + sx * L} ${y}`} stroke="#ffffff" strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
  const blink = Math.floor((t - 5.12) * 2.2) % 2 === 0;
  const s = 1.06 - 0.06 * U.clamp(p);
  return (
    <AbsoluteFill style={{opacity: U.clamp(p), transform: `scale(${s})`}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(30,60,100,0) 55%, rgba(30,60,100,0.22) 100%)'}} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {corner(m, m + 40, 1, 1, 'tl')}
        {corner(1080 - m, m + 40, -1, 1, 'tr')}
        {corner(m, 1920 - m - 40, 1, -1, 'bl')}
        {corner(1080 - m, 1920 - m - 40, -1, -1, 'br')}
        {blink ? <circle cx={m + 70} cy={m + 110} r={21} fill="#E8352B" stroke={INK} strokeWidth={6} /> : null}
        {/* slow-motion mark: a little snail */}
        <g transform={`translate(${1080 - m - 168} ${m + 70})`}>
          <path d="M 4 74 Q 4 58 22 58 L 116 58 Q 130 58 132 70 Q 132 80 116 80 L 14 80 Q 4 80 4 74 Z" fill="#F3D9A4" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <path d="M 112 60 L 118 24 M 124 62 L 136 30" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <circle cx={118} cy={22} r={6} fill={INK} />
          <circle cx={137} cy={28} r={6} fill={INK} />
          <circle cx={58} cy={38} r={34} fill="#E9A04B" stroke={INK} strokeWidth={6} />
          <path d="M 58 38 m 0 -6 a 6 6 0 1 1 -6 6 a 12 12 0 1 1 12 12 a 18 18 0 1 1 -18 -18" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
