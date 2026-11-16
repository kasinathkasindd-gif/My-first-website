import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {tickTimes} from './choreo';
import {A, DURATION, FPS, T, VO_AT} from './timing';

type Cue = {f: string; at: number; db: number; dur?: number; loop?: boolean; keys?: [number, number][]};

// One cue list: file, start (composition s), level in dB, optional dB keys over composition time.
const CUES: Cue[] = [
  {f: 'rain_bed', at: 0, db: -27, dur: DURATION, keys: [[0, -27], [A.slowIn, -27], [A.slowIn + 0.25, -37], [12.2, -37], [12.5, -27], [DURATION - 0.4, -27], [DURATION, -40]]},
  {f: 'boing', at: T.fifty - 0.005, db: -13},
  {f: 'whoosh_up', at: 1.62, db: -19},
  {f: 'buzz', at: A.airArrive - 0.05, db: -27, dur: A.contact - A.airArrive + 0.05, loop: true, keys: [[A.airArrive - 0.05, -40], [A.airArrive + 0.15, -27], [A.slowIn, -27], [A.slowIn + 0.3, -46]]},
  {f: 'pop', at: A.sweat, db: -22},
  {f: 'whistle_fall', at: 3.82, db: -25},
  {f: 'slowmo_in', at: A.slowIn, db: -11},
  {f: 'squish', at: A.contact, db: -12},
  ...tickTimes.slice(0, -1).map((at) => ({f: 'tick', at, db: -21})),
  {f: 'ding', at: tickTimes[tickTimes.length - 1], db: -17},
  {f: 'flip', at: A.tapeRetract, db: -25},
  {f: 'flip', at: T.tip - 0.05, db: -18},
  {f: 'slowmo_out', at: 12.2, db: -15},
  {f: 'buzz', at: A.separate + 0.2, db: -30, dur: 1.3, loop: true, keys: [[A.separate + 0.2, -46], [12.45, -30], [13.0, -32], [13.5, -50]]},
  {f: 'whoosh_down', at: 13.0, db: -23},
  {f: 'whoosh_down', at: 14.85, db: -20},
  {f: 'splash_big', at: T.ground - 0.01, db: -5},
  {f: 'buzz', at: A.mosqReturn, db: -29, dur: A.land - A.mosqReturn + 0.1, loop: true, keys: [[A.mosqReturn, -50], [A.mosqReturn + 0.6, -29], [A.land - 0.15, -29], [A.land + 0.1, -50]]},
  {f: 'boop', at: A.boop, db: -13},
  {f: 'plop_small', at: A.plop, db: -11},
  {f: 'tap', at: A.land, db: -17},
];

const dbAt = (c: Cue, t: number) => {
  if (!c.keys) return c.db;
  const k = c.keys;
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      const u = (t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
      return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * u;
    }
  }
  return k[k.length - 1][1];
};

export const SoundTrack: React.FC = () => (
  <>
    <Sequence from={Math.round(VO_AT * FPS)} layout="none">
      <Audio src={staticFile('mosquito/vo/take1.mp3')} />
    </Sequence>
    {CUES.map((c, i) => {
      const from = Math.round(c.at * FPS);
      return (
        <Sequence key={i} from={from} durationInFrames={c.dur ? Math.round(c.dur * FPS) : undefined} layout="none">
          <Audio src={staticFile(`mosquito/sfx/${c.f}.wav`)} loop={c.loop} volume={(f) => 10 ** (dbAt(c, (from + f) / FPS) / 20)} />
        </Sequence>
      );
    })}
  </>
);
