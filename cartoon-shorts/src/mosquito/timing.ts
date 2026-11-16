// Beat times in composition seconds. The voice (public/mosquito/vo/take1.mp3) starts at VO_AT.
// Measured from the voice: sentence/comma pauses by loudness (RMS every 20 ms, silence < -42 dB) and
// syllable onsets inside each phrase (see images/mosquito/README.md).
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 22.0;

export const T = {
  // 1 "A raindrop can weigh up to fifty times more than a mosquito."   0.15 - 3.56
  weigh: 1.18,
  fifty: 1.66,
  mosquito1: 2.8,
  l1End: 3.56,
  // 2 "So why doesn't one crush it?"                                    3.80 - 4.98
  l2: 3.82,
  crush: 4.6,
  l2End: 4.98,
  // 3 "Slow-motion video shows the drop carrying it for up to twenty body lengths."   5.62 - 9.66
  l3: 5.62,
  shows: 6.77,
  carrying: 7.43,
  twenty: 8.55,
  lengths: 9.44,
  l3End: 9.66,
  // 4 "Then its long legs and wings tip it off."                        9.92 - 12.44
  l4: 9.95,
  legs: 10.8,
  wings: 11.4,
  tip: 11.74,
  off: 12.1,
  l4End: 12.44,
  // 5 "Raindrops only hit hard when something stops them, like the ground."   12.94 - 16.46
  l5: 12.98,
  hard: 14.1,
  stops: 15.1,
  like: 15.78,
  ground: 16.12,
  l5End: 16.46,
  // 6 "A mosquito is so light it barely slows the drop, so it only takes a small hit."   16.76 - 21.14
  l6: 16.76,
  light: 18.08,
  barely: 18.33,
  slows: 18.77,
  small: 20.64,
  hit: 20.97,
  l6End: 21.14,
} as const;

// Derived action times
export const A = {
  hop: 1.44, // seesaw drop starts its hop
  launch: T.fifty + 0.04, // mosquito leaves the plank
  camRise: 1.8,
  airArrive: 3.38, // tumble -> hover at altitude
  camAir: 3.55,
  drop2Enter: 3.85,
  scared: 4.08,
  sweat: 4.3,
  slowIn: 4.98, // time-warp starts (sound)
  overlayOn: 5.12,
  pushInEnd: 6.4,
  contact: 6.55,
  wide: 9.5,
  tapeRetract: 9.95,
  pushIn2: 9.85,
  pushIn2End: 10.8,
  legsSwap: 10.82,
  slideStart: 11.0,
  separate: 12.02,
  overlayOff: 12.36,
  slowOut: 12.3,
  camGlide: 15.0,
  camGlideEnd: 16.0,
  mosqReturn: 16.55,
  mosqArrive: 17.85,
  drop3Enter: 17.92,
  boop: T.barely,
  plop: 18.75,
  smugSwap: 20.48,
  land: T.hit,
  puddleShrink: 20.2,
  puddleGone: 21.35,
  finalSwap: 21.55,
} as const;
