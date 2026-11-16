import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {DropActor, MosquitoActor, SeesawSvg} from './actors';
import {camAt, drop1, drop2, drop3, kOf, mosquito, PUDDLE, seesawTheta, shake, Z_MAIN, Z_SPLASH} from './choreo';
import {Bushes, Clouds, Flowers, GroundBand, GroundSplashes, Hills, Layer, RAIN, Rain, Sky, Tufts} from './env';
import {DragLines, Puddle, SlowMoOverlay, Splash, SpeedLines, TapeMeasure} from './fx';
import {SoundTrack} from './sound';
import {A, FPS, T} from './timing';

type L = {z: number; key: string; node: React.ReactNode; blur?: number};

export const MosquitoRain: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = camAt(t);
  const c0 = camAt(t - 1 / FPS);
  const c1 = camAt(t + 1 / FPS);
  const camV = {x: ((c1.x - c0.x) * FPS) / 2, y: ((c1.y - c0.y) * FPS) / 2};
  const k = kOf(cam.z);
  const sh = shake(t);
  const m = mosquito(t);
  const d1 = drop1(t, m);
  const d2 = drop2(t);
  const d3 = drop3(t);
  const th = seesawTheta(t);
  // depth of field: soften the far sky while the camera is close on the action
  const dof = Math.max(0, Math.min(1, (k - 1.45) / 0.4)) * 2.6;

  const ls: L[] = [];
  ls.push({z: 4200, key: 'cloudsFar', node: <Clouds cam={cam} z={4200} far t={t} />, blur: dof});
  ls.push({z: 3200, key: 'hills', node: <Hills cam={cam} z={3200} />, blur: dof});
  ls.push({z: 2600, key: 'cloudsMid', node: <Clouds cam={cam} z={2600} far={false} t={t} />, blur: dof * 0.8});
  for (const r of RAIN) ls.push({z: r.z, key: `rain${r.z}`, node: <Rain cam={cam} camV={camV} spec={r} t={t} />});
  ls.push({
    z: 1800,
    key: 'ground1800',
    node: (
      <>
        <GroundBand cam={cam} z={1800} />
        <Bushes items={[[-520, 1.1], [60, 0.8], [1380, 1.0], [1720, 1.2]]} />
        <GroundSplashes t={t} seed={3} x0={-600} x1={1700} perSec={7} scale={1.6} />
      </>
    ),
  });
  ls.push({
    z: Z_MAIN,
    key: 'ground1000',
    node: (
      <>
        <GroundBand cam={cam} z={Z_MAIN} />
        <Tufts items={[[110, 0.9], [215, 0.7], [960, 1.0], [1050, 0.75], [-80, 1.1]]} sw={3.2} />
        <Flowers items={[[40, 0.75, '#F7B7D2'], [1005, 0.7, '#ffffff']]} />
        <GroundSplashes t={t} seed={5} x0={-200} x1={1250} perSec={6} scale={1.1} />
        <SeesawSvg theta={th} />
      </>
    ),
  });
  ls.push({z: Z_MAIN, key: 'drop1', node: <DropActor s={d1} />});
  ls.push({z: Z_MAIN, key: 'tape', node: <TapeMeasure t={t} />});
  ls.push({z: d2.z, key: 'drop2', node: <DropActor s={d2} />});
  ls.push({z: d3.z, key: 'drop3', node: <DropActor s={d3} />});
  ls.push({z: m.z, key: 'mosq', node: <MosquitoActor s={m} t={t} frame={frame} />});
  ls.push({z: Z_MAIN, key: 'drag', node: <DragLines t={t} x={m.x} y={m.y} />});
  ls.push({
    z: Z_SPLASH,
    key: 'ground860',
    node: (
      <>
        <GroundBand cam={cam} z={Z_SPLASH} />
        <Tufts items={[[300, 1.0], [880, 1.15], [1010, 0.8], [40, 0.9]]} sw={3} />
        <Flowers items={[[180, 0.9, '#ffffff'], [925, 0.8, '#ffffff'], [420, 0.7, '#F7B7D2']]} />
        <GroundSplashes t={t} seed={8} x0={-100} x1={1200} perSec={4} scale={0.95} />
        <Puddle t={t} />
        <Splash t={t} t0={T.ground} x={PUDDLE.x} big />
        <Splash t={t} t0={A.plop} x={PUDDLE.x + 10} big={false} />
      </>
    ),
  });
  ls.push({z: 650, key: 'fore', node: <Tufts items={[[40, 2.0], [150, 1.3], [985, 1.7], [1080, 2.2]]} sw={3} color="#56A63C" />});
  // far -> near (stable for equal depths)
  const sorted = ls.map((l, i) => ({...l, i})).sort((a, b) => b.z - a.z || a.i - b.i);
  return (
    <AbsoluteFill style={{backgroundColor: '#9DB8CB', overflow: 'hidden'}}>
      <Sky cam={cam} />
      <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px)`}}>
        {sorted.map((l) => (
          <Layer key={l.key} cam={cam} z={l.z} blur={l.blur}>
            {l.node}
          </Layer>
        ))}
      </AbsoluteFill>
      <SpeedLines t={t} vScreen={camV.y * k} />
      <SlowMoOverlay t={t} />
      <SoundTrack />
    </AbsoluteFill>
  );
};
