import React from 'react';
import {Composition} from 'remotion';
import {MosquitoRain} from './mosquito/MosquitoRain';
import {DURATION, FPS} from './mosquito/timing';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="MosquitoRain"
    component={MosquitoRain}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={Math.round(DURATION * FPS)}
  />
);
