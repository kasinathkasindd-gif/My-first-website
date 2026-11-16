# Cartoon Shorts (cut-out style)

Vertical 2D cut-out cartoon Shorts: Higgsfield GPT Image 2.5 transparent cut-outs + an ElevenLabs voice (via
Higgsfield) + Remotion code for the camera, posing, physics, effects and sound.

## Mosquito vs raindrop (`MosquitoRain`)

Script (68 words, ~21 s of voice):

> A raindrop can weigh up to 50 times more than a mosquito. So why doesn't one crush it? Slow-motion video shows
> the drop carrying it for up to 20 body lengths. Then its long legs and wings tip it off. Raindrops only hit hard
> when something stops them, like the ground. A mosquito is so light it barely slows the drop, so it only takes a
> small hit.

Sources: Dickerson, Shankles, Madhavan & Hu, "Mosquitoes survive raindrop collisions by virtue of their low mass",
PNAS 2012 (https://www.pnas.org/doi/10.1073/pnas.1205446109) and the Georgia Tech release "Mosquitoes Fly in Rain
Thanks to Low Mass" (https://coe.gatech.edu/news/2012/06/mosquitoes-fly-rain-thanks-low-mass).

Output: 1080x1920 composition at 60 fps, rendered at scale 2 -> 2160x3840 H.264 (PNG frames, CRF 16, x264 preset
`faster`, yuv420p), 22.0 s.

### Beat sheet

| time (s) | words | on screen | pictures | sound |
|---|---|---|---|---|
| 0.0 | "A raindrop can weigh..." | frame 0: smug drop on the low end of a seesaw, mosquito on the high end, rain | drop, hover | rain bed |
| 1.44-1.70 | "...fifty times more..." | drop hops and slams; seesaw flicks; mosquito launched | tumble | boing, whoosh |
| 1.8-3.55 | "...than a mosquito." | camera whips up and locks on the tumbling mosquito; it settles in the sky | tumble -> hover | |
| 3.85-4.98 | "So why doesn't one crush it?" | an angry drop falls at it; mosquito looks up scared, sweat drop | scared_up | whistle, pop |
| 4.98-6.55 | (pause) "Slow-motion video..." | time slows (rain hangs as dots), REC frame + snail badge, slow push-in | | slow-mo whomp |
| 6.55-9.44 | "...shows the drop carrying it for up to twenty body lengths." | contact squash; tape measure unrolls 20 body lengths; camera pulls back to reveal it | squished | squish, 19 ticks + ding |
| 9.95-12.44 | "Then its long legs and wings tip it off." | tape zips back; legs and wings spread, drag lines; it slides round the drop's front and flips free | tumble -> hover | flip |
| 12.3-16.12 | "Raindrops only hit hard when something stops them, like the ground." | slow-mo ends; camera chases the drop down, overtakes to the ground; SPLASH on "ground" | | speed-up, whooshes, splash in the pause |
| 16.8-19.6 | "A mosquito is so light it barely slows the drop," | mosquito flies back; another drop boops it (small push), keeps falling, plops into the dazed puddle | hover | buzz, boop, plop |
| 19.7-22.0 | "so it only takes a small hit." | shakes it off, smug, lands on the seesaw -> same picture as frame 0 (loops) | smug -> hover | tap |

### Files

- `images/mosquito/prompts.md` - every picture prompt (fixed CHAR/STYLE blocks) and the job ids.
- `images/mosquito/raw/` - the six Higgsfield cut-outs as generated (2k, medium, transparent).
- `images/mosquito/prep.py` - trims to alpha + 12 px, measures head (largest inscribed disc of the body-coloured
  region), body box, feet and wing tips -> `src/mosquito/sprites.ts`; then `thin_drop.py` thins the raindrop's baked
  outline (32 -> 15 px) so its line weight matches the mosquito at world scale.
- `images/mosquito/sfx.py` - trims/normalises the two Higgsfield water sounds and synthesises the rest.
- `src/mosquito/timing.ts` - beat times from the voice (RMS pauses + syllable onsets).
- `src/mosquito/choreo.ts` - all motion as functions of time: camera path, seesaw, the drops, the mosquito, tape,
  puddle, slow-motion time warp, shake.
- `src/mosquito/{actors,env,fx,sound}.tsx`, `MosquitoRain.tsx` - drawing and the mix.
- `scripts/stills.mjs`, `scripts/sheet.py` (contact sheets), `scripts/render.mjs` (`final|preview|audio`),
  `scripts/popscan.py` (frame-difference pop scan).

### Re-render

```bash
npm install
python3 -m venv .venv && .venv/bin/pip install numpy pillow opencv-python-headless scipy
node scripts/render.mjs final      # -> out/mosquito-rain-4K.mp4
node scripts/render.mjs preview    # -> out/preview-half.mp4 (540x960)
.venv/bin/python scripts/popscan.py out/preview-half.mp4
```

`scripts/*.mjs` use the pre-installed headless shell at `/opt/pw-browsers/...`; change `BROWSER` elsewhere.

### Notes / deviations from the method

- Pictures were made at `2k / medium` (1 credit each) instead of `4k / high` (4.25): the Higgsfield account had
  12.25 credits. The sprites are still >= 1:1 at their largest size in the 4K frame.
- No ElevenLabs connector was available, so the voice is ElevenLabs through Higgsfield `text2speech_v2`
  (`variant: elevenlabs`, preset voice "Mark", median pitch ~115 Hz). Word times come from loudness pauses and
  syllable onsets (faster-whisper's model host was not reachable).
- Sound effects: only the big splash and the small plop are Higgsfield `seed_audio` (0.5 credit each); the rain bed,
  buzz, boing, whooshes, whistle, slow-mo whomp/speed-up, squish, ticks, ding, flip, boop, tap and pop are synthesised.
- Actors are placed with CSS `transform: translate(...)`, never `left/top`: Chrome pixel-snaps `left/top` in the
  layer's unscaled space, which the multiplane scale then turns into 1-2 px judder on slow camera moves.
- Depth of field: while the camera is close (k > 1.45 on the character plane) the far cloud layer gets a CSS blur of
  up to 3.6 px and the mid clouds lose contrast. Only one layer is blurred because a 4K blur costs ~1 s a layer per
  frame on this CPU-only renderer (3 blurred layers: 4.4 s/frame; 1 layer: 2.3 s; none: 1.1 s). Layers are clipped to
  the frame + 80 px (room for the screen shake).
