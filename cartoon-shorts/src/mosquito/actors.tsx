import React from 'react';
import {Img, staticFile} from 'remotion';
import {
  DROP_R,
  DROP_ROUND_DY,
  DS,
  DropState,
  Face,
  MosqState,
  PIVOT,
  PL,
  PT,
  poseScale,
  R_HEAD,
} from './choreo';
import {SPRITES} from './sprites';
import * as U from './util';

const INK = '#141414';

// ------------------------------------------------------------------------------------------- cartoon face (SVG)
/** A face drawn in world units around (cx, cy); R is the size reference (the drop's round radius). */
export const FaceSvg: React.FC<{f: Face; cx: number; cy: number; R: number; lidColor: string}> = ({f, cx, cy, R, lidColor}) => {
  const sw = 0.026 * R;
  const ex = 0.34 * R;
  const rx = 0.15 * R;
  const ry = 0.2 * R;
  const eyes = [-1, 1].map((side) => {
    const x = cx + side * ex;
    const y = cy;
    if (f.squeeze) {
      const d = side < 0 ? 1 : -1; // left eye '>' , right eye '<'
      return (
        <path
          key={side}
          d={`M ${x - d * 0.1 * R} ${y - 0.12 * R} L ${x + d * 0.09 * R} ${y} L ${x - d * 0.1 * R} ${y + 0.12 * R}`}
          fill="none"
          stroke={INK}
          strokeWidth={0.06 * R}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }
    const pr = 0.085 * R;
    let lx = f.look[0];
    let ly = f.look[1];
    if (f.dazed !== undefined) {
      const ph = f.dazed * 2 * Math.PI * 1.3 * side;
      lx = 0.7 * Math.cos(ph);
      ly = 0.7 * Math.sin(ph);
    }
    const px = x + lx * (rx - pr - 0.015 * R);
    const py = y + ly * (ry - pr - 0.015 * R);
    const id = `eye${side}${Math.round(cx)}${Math.round(cy)}`;
    // lid: tilted line (angry brows tilt the lids down toward the middle)
    const tilt = f.brow === 'angry' ? 0.07 * R : f.brow === 'worried' ? -0.05 * R : 0;
    const lidY = y - ry + U.clamp(f.lid) * 2 * ry;
    const inner = -side; // direction toward the face centre
    const yIn = lidY + tilt;
    const yOut = lidY - tilt;
    const xa = x - rx * 1.2;
    const xb = x + rx * 1.2;
    const ya = inner < 0 ? yIn : yOut;
    const yb = inner < 0 ? yOut : yIn;
    return (
      <g key={side}>
        <defs>
          <clipPath id={id}>
            <ellipse cx={x} cy={y} rx={rx} ry={ry} />
          </clipPath>
        </defs>
        <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#ffffff" stroke={INK} strokeWidth={sw} />
        <circle cx={px} cy={py} r={pr} fill={INK} clipPath={`url(#${id})`} />
        <circle cx={px - 0.032 * R} cy={py - 0.035 * R} r={0.03 * R} fill="#ffffff" clipPath={`url(#${id})`} />
        {f.lid > 0.02 ? (
          <g clipPath={`url(#${id})`}>
            <path d={`M ${xa} ${y - ry * 1.3} L ${xb} ${y - ry * 1.3} L ${xb} ${yb} L ${xa} ${ya} Z`} fill={lidColor} />
            <path d={`M ${xa} ${ya} L ${xb} ${yb}`} stroke={INK} strokeWidth={sw * 1.1} />
          </g>
        ) : null}
        <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="none" stroke={INK} strokeWidth={sw} />
      </g>
    );
  });
  // brows
  const bw = 0.06 * R;
  const brow = (side: number) => {
    const x = cx + side * ex;
    const y = cy;
    const i = -side; // inner direction
    const xo = x - i * 0.15 * R; // outer end
    const xi = x + i * 0.13 * R; // inner end
    switch (f.brow) {
      case 'relaxed':
        return `M ${xo} ${y - 0.29 * R} Q ${x} ${y - 0.37 * R} ${xi} ${y - 0.3 * R}`;
      case 'angry':
        return `M ${xo} ${y - 0.37 * R} Q ${x} ${y - 0.36 * R} ${xi} ${y - 0.24 * R}`;
      case 'worried':
        return `M ${xo} ${y - 0.27 * R} Q ${x} ${y - 0.33 * R} ${xi} ${y - 0.38 * R}`;
      case 'surprised':
        return `M ${xo} ${y - 0.34 * R} Q ${x} ${y - 0.5 * R} ${xi} ${y - 0.35 * R}`;
      case 'puzzled':
        return side < 0
          ? `M ${xo} ${y - 0.36 * R} Q ${x} ${y - 0.5 * R} ${xi} ${y - 0.38 * R}`
          : `M ${xo} ${y - 0.3 * R} L ${xi} ${y - 0.29 * R}`;
      case 'flat':
        return `M ${xo} ${y - 0.3 * R} L ${xi} ${y - 0.3 * R}`;
      default:
        return '';
    }
  };
  const my = cy + 0.36 * R;
  let mouth: React.ReactNode = null;
  switch (f.mouth) {
    case 'smile':
      mouth = <path d={`M ${cx - 0.11 * R} ${my} Q ${cx} ${my + 0.1 * R} ${cx + 0.11 * R} ${my}`} fill="none" stroke={INK} strokeWidth={bw * 0.8} strokeLinecap="round" />;
      break;
    case 'grin':
      mouth = (
        <path
          d={`M ${cx - 0.16 * R} ${my - 0.02 * R} Q ${cx} ${my + 0.16 * R} ${cx + 0.16 * R} ${my - 0.02 * R} Z`}
          fill="#1d2b3a"
          stroke={INK}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      );
      break;
    case 'frown':
      mouth = <path d={`M ${cx - 0.1 * R} ${my + 0.04 * R} Q ${cx} ${my - 0.06 * R} ${cx + 0.1 * R} ${my + 0.04 * R}`} fill="none" stroke={INK} strokeWidth={bw * 0.8} strokeLinecap="round" />;
      break;
    case 'o':
      mouth = <ellipse cx={cx} cy={my + 0.02 * R} rx={0.06 * R} ry={0.075 * R} fill="#1d2b3a" stroke={INK} strokeWidth={sw} />;
      break;
    case 'flat':
      mouth = <path d={`M ${cx - 0.08 * R} ${my} L ${cx + 0.08 * R} ${my}`} stroke={INK} strokeWidth={bw * 0.8} strokeLinecap="round" />;
      break;
    case 'wobble':
      mouth = (
        <path
          d={`M ${cx - 0.13 * R} ${my} q ${0.0325 * R} ${-0.05 * R} ${0.065 * R} 0 t ${0.065 * R} 0 t ${0.065 * R} 0 t ${0.065 * R} 0`}
          fill="none"
          stroke={INK}
          strokeWidth={bw * 0.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
      break;
    default:
      mouth = null;
  }
  return (
    <g>
      {eyes}
      {f.brow !== 'none'
        ? [-1, 1].map((s) => <path key={`b${s}`} d={brow(s)} fill="none" stroke={INK} strokeWidth={bw} strokeLinecap="round" />)
        : null}
      {mouth}
    </g>
  );
};

// ------------------------------------------------------------------------------------------- raindrop
const DROP_SRC = staticFile('mosquito/sprites/drop.png');
export const DropActor: React.FC<{s: DropState}> = ({s}) => {
  if (!s.visible) return null;
  const D = SPRITES.drop;
  const w = D.w * DS;
  const h = D.h * DS;
  const fcx = 0;
  const fcy = -DROP_ROUND_DY + 0.14 * DROP_R;
  // speed lines above the drop (world units, relative to the bottom point)
  const sl = U.clamp((s.speed - 450) / 1100);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transform: `translate(${s.x}px, ${s.y}px) rotate(${s.rot}deg) scale(${s.sx}, ${s.sy})`, transformOrigin: '0 0'}}>
      {sl > 0.01 ? (
        <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
          {[-0.55, -0.15, 0.3, 0.62].map((fx, i) => {
            const x = fx * DROP_R;
            const top = -DROP_H_OF(h) - 30 - 25 * ((i * 37) % 3);
            const len = (70 + 40 * ((i * 53) % 3)) * sl;
            return (
              <g key={i}>
                <line x1={x} y1={top - len} x2={x} y2={top + 12 - Math.abs(fx) * 60} stroke={INK} strokeWidth={7} strokeLinecap="round" />
                <line x1={x} y1={top - len} x2={x} y2={top + 12 - Math.abs(fx) * 60} stroke="#ffffff" strokeWidth={3.5} strokeLinecap="round" />
              </g>
            );
          })}
        </svg>
      ) : null}
      <Img src={DROP_SRC} style={{position: 'absolute', left: -D.center[0] * DS, top: -D.bottom * DS, width: w, height: h}} />
      <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
        <FaceSvg f={s.face} cx={fcx} cy={fcy} R={DROP_R} lidColor="#3C9BE0" />
      </svg>
    </div>
  );
};
const DROP_H_OF = (h: number) => h * 0.86;

// ------------------------------------------------------------------------------------------- mosquito
const MOSQ_SRC = Object.fromEntries(
  (['hover', 'scared_up', 'squished', 'tumble', 'smug'] as const).map((p) => [p, staticFile(`mosquito/sprites/${p}.png`)]),
) as Record<string, string>;

export const MosquitoActor: React.FC<{s: MosqState; t: number; frame: number}> = ({s, t, frame}) => {
  if (!s.visible) return null;
  const sp = SPRITES[s.pose];
  const k = poseScale(s.pose);
  const [hx, hy] = sp.head;
  // pivot in the flipped local frame (head = origin)
  let P = {x: 0, y: 0};
  if (s.pivot === 'feet') P = {x: (sp.feet[0] - hx) * k * s.facing, y: (sp.feet[1] - hy) * k};
  if (s.pivot === 'body') P = {x: (((sp.body[0] + sp.body[2]) / 2 - hx) * k) * s.facing, y: ((sp.body[1] + sp.body[3]) / 2 - hy) * k};
  const tf = `translate(${P.x}px, ${P.y}px) rotate(${s.rot}deg) scale(${s.sx}, ${s.sy}) translate(${-P.x}px, ${-P.y}px) scale(${s.facing}, 1)`;
  // buzz marks near the wing tips, alternating every 2 frames
  const alt = Math.floor(frame / 2) % 2;
  const wt = {x: (sp.wingTop[0] - hx) * k, y: (sp.wingTop[1] - hy) * k};
  const wl = {x: (sp.wingLeft[0] - hx) * k, y: (sp.wingLeft[1] - hy) * k};
  const arc = (x: number, y: number, ang: number, key: string) => {
    const r = 15;
    const a0 = ang - 0.55;
    const a1 = ang + 0.55;
    return (
      <path
        key={key}
        d={`M ${x + r * Math.cos(a0)} ${y + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${x + r * Math.cos(a1)} ${y + r * Math.sin(a1)}`}
        fill="none"
        stroke={INK}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    );
  };
  const buzz =
    s.buzz > 0.05 ? (
      <g opacity={s.buzz}>
        {alt === 0
          ? [arc(wt.x - 6, wt.y - 9, -Math.PI / 2 - 0.5, 'a'), arc(wl.x - 10, wl.y - 2, Math.PI + 0.35, 'b')]
          : [arc(wt.x + 9, wt.y - 7, -Math.PI / 2 + 0.25, 'c'), arc(wl.x - 7, wl.y + 9, Math.PI - 0.15, 'd')]}
      </g>
    ) : null;
  // sweat drop on the back of the head (local frame: the face is on +x before the flip)
  let sweat: React.ReactNode = null;
  if (s.sweat >= 0) {
    const pop = U.easeOutBack(U.inv(s.sweat, 0, 0.08), 2.2) * (1 - U.easeInCubic(U.inv(s.sweat, 0.93, 1)));
    const u = U.easeInOutCubic(U.inv(s.sweat, 0.05, 0.9));
    const x = -R_HEAD * U.lerp(0.78, 0.98, u);
    const y = -R_HEAD * U.lerp(0.62, 0.05, u);
    const r = 11 * pop;
    sweat = pop > 0.01 ? (
      <g transform={`translate(${x} ${y})`}>
        <path d={`M 0 ${-r * 2.1} C ${r * 0.6} ${-r * 1.1} ${r} ${-r * 0.4} ${r} 0 A ${r} ${r} 0 0 1 ${-r} 0 C ${-r} ${-r * 0.4} ${-r * 0.6} ${-r * 1.1} 0 ${-r * 2.1} Z`} fill="#A9DDFF" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
        <circle cx={-r * 0.35} cy={-r * 0.25} r={r * 0.22} fill="#ffffff" />
      </g>
    ) : null;
  }
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformOrigin: '0 0', transform: `translate(${s.x}px, ${s.y}px) ${tf}`}}>
      <Img src={MOSQ_SRC[s.pose]} style={{position: 'absolute', left: -hx * k, top: -hy * k, width: sp.w * k, height: sp.h * k}} />
      <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
        {buzz}
        {sweat}
      </svg>
    </div>
  );
};

// ------------------------------------------------------------------------------------------- seesaw (SVG, world units)
export const SeesawSvg: React.FC<{theta: number}> = ({theta}) => {
  const sw = 3.4;
  const fx = PIVOT.x;
  const fy = PIVOT.y;
  const base = fy + 105;
  const half = 78;
  const angle = -U.deg(theta);
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      {/* contact shadow + fulcrum */}
      <ellipse cx={fx} cy={base + 2} rx={half + 26} ry={10} fill="rgba(52,74,40,0.28)" style={{filter: 'blur(3px)'}} />
      <path d={`M ${fx} ${fy - 4} L ${fx + half} ${base} L ${fx - half} ${base} Z`} fill="#E25B4E" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <path d={`M ${fx + 4} ${fy + 6} L ${fx + half - 8} ${base - 3} L ${fx + 18} ${base - 3} Z`} fill="#C4463B" />
      <path d={`M ${fx} ${fy - 4} L ${fx + half} ${base} L ${fx - half} ${base} Z`} fill="none" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      {/* plank */}
      <g transform={`translate(${fx} ${fy}) rotate(${angle})`}>
        <rect x={-PL / 2} y={-PT} width={PL} height={PT} rx={9} fill="#C98B4E" />
        <rect x={-PL / 2 + 6} y={-PT + 4} width={PL - 12} height={6} rx={3} fill="#DFA867" />
        <rect x={-PL / 2} y={-6} width={PL} height={6} rx={3} fill="#A86F38" />
        {[-200, -60, 90, 210].map((x) => (
          <path key={x} d={`M ${x} ${-PT + 9} q 16 3 34 0`} fill="none" stroke="#8E5A2B" strokeWidth={2} strokeLinecap="round" />
        ))}
        <rect x={-PL / 2} y={-PT} width={PL} height={PT} rx={9} fill="none" stroke={INK} strokeWidth={sw} />
      </g>
      <circle cx={fx} cy={fy - 2} r={7} fill="#9AA3AD" stroke={INK} strokeWidth={2.4} />
    </svg>
  );
};
