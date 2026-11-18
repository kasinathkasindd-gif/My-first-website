---
name: "cutout-cartoon-shorts"
description: "Make 9:16 cut-out cartoon Shorts with the cheapest Higgsfield settings that still work (about 1.75 credits a Short): fact-checked script, a few transparent character poses, a low-cost voice, Remotion animation with code-made sound effects, 1080x1920 render (4K only on request). Use for animated science/fact Shorts with a cartoon character, especially when credits are limited. This repo copy is the current version: prefer it over any other copy with the same name."
---

# Cut-out cartoon Shorts (Higgsfield + Remotion)

A vertical 2D cartoon Short in the "cut-out" style: a few transparent character poses made on Higgsfield, a narrated voice, and all motion, camera, physics, effects and sound written as Remotion code. The reference build is *Mosquito vs raindrop* (22 s, 1080x1920 @ 60 fps): a raindrop launches a mosquito off a seesaw, a second drop hits it in slow motion, a tape measure counts 20 body lengths, it flips free, the drop splashes on the ground, and the last frame matches frame 0 so the Short loops.

Use this instead of the stickman skill when the user wants a richer cartoon character with poses, a moving multiplane camera and hand-timed gags, and is fine with a code-rendered video.

Why this approach: AI video models drift on character, physics and timing in a 20-second gag. Generating only *stills* (a hero pose at 0.5 credit and 2-3 more at 0.25) and animating them in code gives exact timing to the voice, a consistent character, repeatable renders, and edits that cost nothing.

## Credit saver (the default)

The owner of this skill wants every Short made with the cheapest settings that still work. Only Higgsfield generations cost credits; animation, rendering, synthesised sound and every fix made in code are free. So credits go only where code can't help (the character pictures and the voice), every generation starts at its cheapest setting, and only an asset that fails a check steps up.

What the spend has looked like so far:

- The reference *Mosquito vs raindrop* cost 9.3 credits: 6 pictures at 2k/medium, an ElevenLabs voice at 1.2, and 2 generated sound effects at 2.1. Far more than needed.
- A Short made on 17 November 2026 cost **2.80**: 5 GPT Image 2.6 pictures (2 at 0.5, 3 at 0.25), a voice-over at 1.05, and no generated sound. The 0.25 pictures (1k/low) were good enough, so low quality works for poses made from a reference.

**Default plan: about 1.75 credits. Hard cap: 3**, unless the user names another amount in the current request.

| Item | Default | Credits |
|---|---|---|
| Hero pose | GPT Image 2.6, 1k, medium, transparent | 0.5 |
| Other poses | at most 3: 1k, low, transparent, hero as reference | 3 x 0.25 = 0.75 |
| Voice | `text2speech_v2`, variant `cozy_voice`: one test line, then one take | 0.1 + about 0.4 |
| Sound effects | synthesised in code or reused | 0 |
| Render | 1080x1920 @ 60 fps | 0 |
| **Total** | | **about 1.75** |

Step up only on failure, and only for that one asset. A low-quality pose that comes out messy (broken outlines, the wrong style, extra limbs) is redone once at 1k/medium (0.5). A Cozy Voice test line that fails its check moves the voice to ElevenLabs (1.05-1.2). With both fallbacks the Short costs about 3, so if anything else fails, drop a pose or ask the user rather than go over the cap.

Prices checked with `get_cost` in November 2026. They change, so preflight again:

- **Pictures** (transparent; GPT Image 2.5 and 2.6 cost the same): 1k/low 0.25, 1k/medium 0.5, 2k/low 0.5, 2k/medium 1.0, 4k/high 4.25.
- **Voice** for a 68-word script: Cozy Voice 0.4, Seed Speech 0.8, Vibe Voice 0.8, ElevenLabs 1.2, MiniMax 1.2, Seed Audio 2.4. The price grows with the length of the text: one 11-word line costs 0.1 on Cozy Voice and 0.3 on ElevenLabs.
- **Sound effects**: Mirelo (`mirelo_text_to_audio`) 0.25 per second. Seed Audio charged 0.9 and 1.2 for two short effects although its cost check said 0.5.

How to keep to it:

1. **Check before spending.** Call `balance` first. Preflight every generation with `get_cost: true` (free; it submits nothing) and keep a running total. If the plan is over budget, shrink it (fewer poses, cheaper settings) before generating anything. If the balance can't cover the plan, stop before the first generation and tell the user how many credits are missing: half a set of pictures is wasted money.
2. **Older briefs.** A brief that asks for 4K, "high quality" pictures, many poses or ElevenLabs but says nothing about credits was most likely written before this budget existed. Make the credit-saver version, and say in the final summary what you changed and what the premium version would have cost, so the user can ask for it. Go over budget only when the current request says so (a bigger budget, "ignore the budget", "4K anyway").
3. **One result per call.** Never ask for variants (`count` 2-4 multiplies the cost). Don't regenerate to fix what code can fix (line weight, colour, mirroring, small clean-up); regenerate only when the pose itself is wrong.
4. **Reuse first.** Earlier Shorts in the project (`images/*/raw/`, `public/*/sprites/`, `public/*/sfx/`) are free assets. A recurring channel character whose pose library is made once is the cheapest long-term setup.
5. **Free generations.** If a generation call returns `unlim_choice`, the account has free unlimited generations for that model: ask the user once, then use them (`use_unlim: true`) for 0 credits.
6. **Report the real spend** from the transaction log at the end, next to the plan and the 2.80 benchmark, because charges can differ from cost checks. If a Short beats 2.80 and still looks right, say so, so its settings can become the new default.

## 0. Before starting

- Ask (or infer) the topic, the character, the duration (15-30 s) and the language. If the user gives only a topic, propose 3 hooks and pick one with them.
- Check the Higgsfield balance and write the cost plan (see Credit saver). The Short to beat is the 17 November one at 2.80; the default plan is about 1.75. Higgsfield tools change, so call `get_workflow_instructions` / read each tool's schema rather than assuming parameter names. Expect occasional 429 rate limits: a 429 creates no job, so resubmit only that request.
- Tooling: Node + Remotion 4, Python 3 with numpy, pillow, opencv-python-headless, plus ffmpeg. Remotion needs a Chromium headless shell. Set `BROWSER` to whatever exists on the machine (the reference used `/opt/pw-browsers/.../chrome-headless-shell`). If package installs are blocked, say which package is missing and use what is installed.

## 1. Script and fact-check (before any credits)

- 55-75 words for about 20 s of voice (about 3.3 words a second). Pattern: surprising claim, then a question, then a mechanism shown visually, then the reason, then a payoff that returns to the opening image.
- Every number must come from a primary source (paper, agency release). Put the sources in the README and in the video description. The reference script came from Dickerson et al., *PNAS* 2012, "Mosquitoes survive raindrop collisions by virtue of their low mass", and the Georgia Tech release. Phrase numbers the way the source does ("up to 50 times", "up to 20 body lengths").
- Write a **beat sheet** table: time | words | on screen | pose(s) | sound. Every spoken phrase gets a visible action, and every action lands on a word. Make the final frame return to the first picture so the Short loops.
- Lock the script before the voice is generated: the wording, how numbers are written ("fifty" or "50") and any names. Every retake costs the full voice price again, and a shorter script costs less.

## 2. Character and pictures (Higgsfield)

Fix the wording in reusable blocks so every picture matches. Never paraphrase them between prompts.

- **CHAR**: the exact anatomy and colours with hex codes (head shape, eyes, limbs, wings, palette).
- **STYLE_HERO**: "Flat 2D cartoon in a simple, cute, kid-friendly style: thick smooth black outlines of even weight, flat colours with a very soft pale shade on one side, clean vector-like linework, no texture, no gradients, no text, no border. Isolated on a fully transparent background: no sky, no ground, no floor shadow."
- **STYLE_CHAR**: the same, but starting "Exactly the same character and the same flat 2D cartoon drawing style as the reference image: ...".
- **STYLE_OBJ**: for props, "...in exactly the same drawing style as the reference image ... no characters, no face."

**Fewer pictures.** Every pose is a picture you pay for, so poses should differ only in what code can't fake: body shape (squished, tumbling, limbs spread). Code does the rest for free: mirroring (`scaleX(-1)`), tilting, squash and stretch, and the face.

- **Face in code** (best for simple faces, such as oval eyes and a line mouth): describe the head in CHAR as "a plain head with no face drawn: no eyes, no mouth", and draw the face in SVG at the measured head circle, like the prop faces. Expressions, blinks and glances then cost nothing.
- **Face baked in** (for detailed faces): keep to at most 4 poses and add emotion with code overlays (sweat drops, brows or "!" above the head, motion lines).

Order:

1. Generate the **hero pose** (1:1, side view, whole body filling the frame with a small margin, transparent background) at 1k/medium (0.5). It is the style anchor for every later picture, so it gets the better quality. Show it and get approval before anything else.
2. Generate the other poses (at most 3 more) at 1k/low (0.25) with the hero job as `image_references`: the reference carries the style, so low quality is enough. Check each one on a coloured background; redo a messy one once at 1k/medium, and fix small flaws in code. Each prompt states the pose, the facing direction (keep one direction for the whole film and mirror in code), the expression if the face is baked in (brows, eyes, mouth described concretely, such as "eyes squeezed shut drawn as two chevrons > <"), and "Whole body filling the frame with a small margin." Typical set: the hero (neutral/hover), squished, tumble (limbs spread), plus one pose the topic needs. Draw props in code where you can.
3. Resolution: 1k for the default 1080x1920 render. In the reference no pose was shown taller than about 950 px in a 1080x1920 frame, and a 1k pose that fills its square is about that tall, so keep close-ups at or below the sprite's own pixel size (check it in the contact sheet). Use 2k (hero 2k/medium 1.0, other poses 2k/low 0.5) only for a 4K render. This flat style never needs 4k/high (4.25).
4. Save the raw files to `images/<slug>/raw/` and every prompt plus job id to `images/<slug>/prompts.md`.

Faces on props (the angry raindrop) are drawn in SVG in code, not generated, so they can blink, squint and look anywhere.

## 3. Prepare sprites: trim and measure anchors

Code must place poses by **anatomy**, not by image box. Otherwise pose swaps jump. For each pose, trim to alpha + 12 px and measure:

- **Head**: the largest inscribed circle (`cv2.distanceTransform`, argmax) of the hole-filled *body-coloured* mask. Use the body colour, not the silhouette, because big wings or props would capture the circle. Every pose is then scaled so its head radius is equal, so swaps never change head size.
- **Body box**: the body-colour mask after a morphological opening that removes thin parts (nose, legs). Use it for body length and contact points.
- **Feet**: the mean x of opaque pixels in the bottom 3.5% of rows, plus the max y.
- **Props**: the round-part centre and radius (distance-transform max), plus top, bottom, left and right.
- **Face anchor** (when the face is drawn in code): the face centre, size and angle relative to the head circle, tuned on the debug overlay, so the face sits right on the head in every pose.

Write these as `src/<slug>/sprites.ts` (`export const SPRITES = {...} as const`) and save a debug overlay per pose (head circle, body box, feet dot) to `images/<slug>/qa/`. **Look at the overlays.** Colour thresholds are character-specific, so tune them per character.

Match line weights: if a prop's baked outline is much thicker than the character's at world scale, thin it. Remove the inner ink beyond the target width (distance to transparency), inpaint with the fill (`cv2.inpaint`), and blend the seam with a smoothstep.

## 4. Voice and timing

- **Voice:** the cheapest engine that sounds natural. Default: `text2speech_v2` with variant `cozy_voice` (about 0.4 for 68 words). Choose a preset from `list_voices` that fits the requested gender and tone (the previews are free to play); if an engine rejects a voice id, pick another. With a new engine or voice, generate one test line first (about 0.1) and check it: 2.5-3.8 words a second, no clipping, no odd gaps, and a pitch that suits the voice asked for (the reference male narrator had a median of about 115 Hz). Send it to the user if they are following along. If it fails, go straight to `elevenlabs` (1.05-1.2 for 60-70 words; it worked in the reference Short). The middle engines (`seed_speech`, `vibe_voice`, 0.8) would save at most about 0.3 and need a test of their own. Don't use `seed_audio` for narration (2.4). Record the approved engine and voice in the project README so later Shorts reuse it without a test. Generate the full script in one take, keep it as `public/<slug>/vo/take1.mp3` and start it at 0.1 s.
- Beat times: measure them. Don't guess. Run this pause finder, then place word times inside each phrase from syllable onsets (loudness rises), or with faster-whisper word timestamps if its model can be downloaded.

```python
# pauses.py <voice.mp3>: RMS every 20 ms; silence < -42 dB for >= 0.1 s
import subprocess, sys
import numpy as np
src = sys.argv[1]; SR = 16000; HOP = int(0.02 * SR)
raw = subprocess.run(['ffmpeg','-nostdin','-loglevel','error','-i',src,'-f','f32le','-ac','1','-ar',str(SR),'-'],
                     capture_output=True, check=True).stdout
x = np.frombuffer(raw, np.float32); n = len(x) // HOP
rms = np.sqrt((x[:n*HOP].reshape(n, HOP)**2).mean(1) + 1e-12)
db = 20*np.log10(rms/(np.abs(x).max()+1e-9)); quiet = db < -42
spans, start = [], None
for i, q in enumerate(np.append(quiet, False)):
    if q and start is None: start = i
    if not q and start is not None:
        if (i-start)*0.02 >= 0.1: spans.append((start*0.02, i*0.02))
        start = None
v = np.where(~quiet)[0]
print(f'speech {v[0]*0.02:.2f} - {(v[-1]+1)*0.02:.2f} s')
for a, b in spans:
    if v[0]*0.02 < a and b < v[-1]*0.02: print(f'pause {a:.2f} - {b:.2f}')
```

- Write `timing.ts` with `FPS = 60`, `VO_AT`, `DURATION` (speech end + about 0.9 s), `T` = word times (composition seconds, with VO_AT added), and `A` = derived action times (`launch: T.fifty + 0.04`, and so on). Everything downstream refers to `T` and `A`, so a new voice take only means re-measuring.

## 5. Choreography: motion as pure functions of time

`choreo.ts` holds every motion as `f(t)`, with no state and no frame-to-frame accumulation, so any frame renders on its own and scrubbing is exact.

- **World units:** at depth Z = 1000 with camera z = 0, 1 world px = 1 screen px; y grows downward. Character scale comes from one number (body length in world px), with `poseScale(p) = R_HEAD / SPRITES[p].headR`.
- **Anchor maths:** place a pose by its head, then derive feet, back-contact and body-centre offsets from the measured anchors (`feetOff`, `backOff`, `bodyOff`). Contacts then line up exactly, for example a drop's bottom on the squished back.
- **Helpers** (keep in `util.ts`): `clamp`, `lerp`, `inv(t,a,b)` (0..1 progress), the eases (`easeInOutCubic`, `easeOutBack`, ...), `smooth`, `logLerp` (use it for zoom), `wobble(t,t0,freq,damp)` (impulse response for squash/jiggle), `settle(t,t0,from,...)` (step response), `mulberry32(seed)` (deterministic rain and splashes), `makePath([[t,v],...])` (position from a piecewise-linear velocity profile, an exact trapezoid integral, so a fall can be tuned to land on a word), and `solveTime` / `solveParam` (bisection: "which speed makes it hit the ground exactly on T.ground?").
- **Slow motion:** a time-warp `warp(t)` from a velocity profile drives ambient motion (rain hangs as dots). `sceneTime(t)` is its integral. Characters on screen follow the narrative clock.
- **Pose swaps** happen on a frame where motion hides them (a squash, a whoosh, a turn), and always keep the head fixed.
- **Camera** `camAt(t) = {x, y, z}`; zoom `k = 1000/(1000 - z)`; interpolate zoom with `logLerp(k)` so push-ins feel even. Add screen shake as a separate damped offset.

## 6. Drawing: a multiplane camera in Remotion

Each depth layer gets a `Layer` with its own parallax scale:

```tsx
export const Layer: React.FC<{cam: Cam; z: number; blur?: number; children: React.ReactNode}> = ({cam, z, blur = 0, children}) => {
  const d = z - cam.z;
  if (d < 250) return null;               // behind / too close to the camera
  const k = 1000 / d;
  return (
    <div style={{position: 'absolute', left: -CLIP, top: -CLIP, width: 1080 + 2 * CLIP, height: 1920 + 2 * CLIP,
                 overflow: 'hidden', filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformOrigin: '0 0',
                   transform: `translate(${540 + CLIP}px, ${960 + CLIP}px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`}}>
        {children}
      </div>
    </div>
  );
};
```

- Build a list `{z, key, node, blur?}` for sky, far clouds, hills, mid clouds, rain layers, ground bands at several depths, actors, foreground tufts. Sort far to near (stable for equal z) and render inside an `AbsoluteFill` that carries the shake transform. Screen-space overlays (speed lines, a slow-mo REC frame, captions) go on top.
- **Place actors with `transform: translate(...)`, never `left/top`.** Chrome pixel-snaps left/top in the layer's unscaled space, and the parallax scale turns that into 1-2 px judder on slow camera moves.
- **Clip each layer** to the frame + CLIP (about 80 px, room for shake). Without clipping, a blur filter is computed over everything the layer paints.
- **Depth of field is expensive.** A 4K CSS blur costs about 1 s per layer per frame on a CPU renderer (3 blurred layers 4.4 s/frame, 1 layer 2.3 s, none 1.1 s). Blur only the farthest layer, and only while the camera is close (for example k > 1.45). Lower the contrast of mid layers instead.
- Draw environment, props, effects (tape measure, splash, puddle, drag and speed lines, sweat drop) and prop faces in SVG with the same ink colour (`#141414`) and stroke weight family as the sprites.

## 7. Sound

Use one cue list: file, start time, level in dB, optional loop, optional dB keyframes over composition time.

```tsx
type Cue = {f: string; at: number; db: number; dur?: number; loop?: boolean; keys?: [number, number][]};
// <Sequence from={Math.round(c.at*FPS)} durationInFrames={c.dur ? Math.round(c.dur*FPS) : undefined} layout="none">
//   <Audio src={staticFile(`<slug>/sfx/${c.f}.wav`)} loop={c.loop} volume={(f) => 10 ** (dbAt(c, (from+f)/FPS) / 20)} />
```

- Voice in its own `Sequence` at `VO_AT`.
- Typical levels: voice 0 dB; hits and splashes -5 to -13; whooshes -19 to -25; ambience beds -27 (duck to -37 under slow motion); loops fade in/out with keys.
- **Generate no sound effects by default.** Synthesise them in numpy, with every file peak-normalised to -1 dBFS and written with ffmpeg, and reuse effects from earlier Shorts in the project (the reference left a generated big splash and small plop plus 14 synthesised effects in `public/mosquito/sfx/`). Recipes: rain bed = band-passed noise with random droplet ticks; buzz = a sawtooth around 500-600 Hz with vibrato; whoosh = noise through a moving band-pass; boing = a pitch-bent sine with decay; slow-mo whomp = a low sine sweep down plus reverb tail; ticks = short clicks; ding = a decaying sine pair. If one sound truly can't be synthesised or reused and the budget has room, generate it with Mirelo (`mirelo_text_to_audio`, 0.25 per second, 1-2 s long), not Seed Audio.
- No licensed music: it costs Shorts revenue share.

## 8. Check, then render

Check before every full render, because a full render is slow:

1. **Stills at key times** with `renderStill` (scale 0.5, bundle once), then a **contact sheet** (7 columns, time labels) to look at with the Read tool: framing, line weights, contacts, pose swaps, and sprites shown larger than their own pixels.
2. **Preview:** `renderMedia` h264, scale 0.5, CRF 23, JPEG frames. Watch for timing against the voice.
3. **Pop scan:** find unwanted jumps. Downscale frames to 270x480 grey, Gaussian blur, compute the mean absolute frame difference, and flag frames above 2.2x the local median (±15 frames, floor 0.25). Each flag is either an intended hit (a splash, a swap on a whoosh) or a bug to fix.
4. **Final:** composition 1080x1920 @ 60 fps rendered at `scale: 1` (1080x1920, the standard Shorts size), h264, CRF 16, `x264Preset: 'faster'` (a slower preset makes the person wait 2-3x as long for little gain), `pixelFormat: 'yuv420p'`, PNG frames, `chromiumOptions: {gl: 'swangle'}`, concurrency = CPU count. Render at `scale: 2` (2160x3840) only when the user asks for 4K and the pictures were made at 2k: it has 4x the pixels, and the 4K reference took about 64 minutes on a CPU. Optionally render `audio` mode to a WAV to check the mix.

A `scripts/render.mjs final|preview|audio` wrapper (bundle with `@remotion/bundler`, `selectComposition`, `renderMedia`) keeps this repeatable.

## 9. Project layout and deliverables

```
<project>/
  README.md                 script, sources, beat sheet, render steps, voice used, credit spend, deviations
  src/index.ts, src/Root.tsx  (Composition id, 1080x1920, FPS, DURATION)
  src/<slug>/{timing.ts, choreo.ts, sprites.ts, util.ts, actors.tsx, env.tsx, fx.tsx, sound.tsx, <Name>.tsx}
  images/<slug>/{prompts.md, raw/, qa/, prep.py, sfx.py, sfx_raw/}
  public/<slug>/{sprites/, vo/take1.mp3, sfx/*.wav}
  scripts/{render.mjs, stills.mjs, sheet.py, popscan.py}
```

Deliver the final MP4 (send it to the user), a 540x960 preview, the README with sources and the beat sheet, and the credit spend taken from the Higgsfield transaction log, next to the cost plan and what the premium version (2k pictures with a 4K render, ElevenLabs voice) would have cost. Record every deviation from this method in the README, such as a premium setting the user asked for, or a synthesised sound where generation failed.

For the next video, reuse `util.ts`, `Layer`, the sound component, the scripts, the STYLE blocks, the sound effects, the approved voice and any poses that fit. Write a new CHAR (if the character is new), a new beat sheet and new choreography. Keep each Short's structure different (a new gag mechanism, not the seesaw again) so the channel doesn't read as templated.
