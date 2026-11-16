# Mosquito vs raindrop — picture prompts

Model `gpt_image_2_5`, `resolution 2k`, `quality medium`, `background transparent` (1 credit each; the account
had 12.25 credits, so 4k/high at 4.25 each was not possible). Poses after the hero pass the hero job as
`image_references`.

## Fixed blocks (same words every time)

CHAR = "The character is a cute cartoon mosquito: a big round head, a small oval chest, a slim tapered abdomen with
three dark stripes, six very long thin noodle legs that bend once and end in tiny rounded feet, two long oval wings
with a flat opaque very pale icy-blue fill and a black outline, a long thin straight needle nose pointing forward from
the middle of the face, small solid black oval eyes, simple curved black eyebrows, a small mouth under the base of the
needle nose. Colours: warm light grey-brown head and body (#A39283), darker brown stripes (#6E5D50), pale icy-blue wings
(#E3F4FC)."

STYLE_HERO = "Flat 2D cartoon in a simple, cute, kid-friendly style: thick smooth black outlines of even weight, flat
colours with a very soft pale shade on one side, clean vector-like linework, no texture, no gradients, no text, no
border. Isolated on a fully transparent background: no sky, no ground, no floor shadow."

STYLE_CHAR = "Exactly the same character and the same flat 2D cartoon drawing style as the reference image: thick smooth
black outlines of even weight, flat colours with a very soft pale shade on one side, clean vector-like linework, no
texture, no gradients, no text, no border. Isolated on a fully transparent background: no sky, no ground, no floor
shadow."

STYLE_OBJ = "Flat 2D cartoon in exactly the same drawing style as the reference image: thick smooth black outlines of
even weight, flat colours with one simple soft shade, clean vector-like linework, no texture, no text, no border, no
characters, no face. Isolated on a fully transparent background: no sky, no ground, no floor shadow."

## Pictures

1. hover (hero, 1:1): "Full body of a cute cartoon mosquito character hovering in the air, side view facing to the
   right, both wings raised above its back, its six long thin legs hanging down relaxed, curious friendly expression:
   eyebrows slightly raised, small closed smile. Whole body in frame with a margin." + CHAR + STYLE_HERO
   -> job 175c76f5-7abe-48d8-b858-320de66e009f (approved; used as `image_references` for every other picture)

2. scared_up (1:1): "Full body of the same cartoon mosquito hovering in the air, side view facing to the right, head
   tilted back looking straight up, scared expression: eyebrows tilted up in the middle, wide eyes looking up, mouth
   wide open in a small oval with a pink tongue, both wings raised, legs stiff and spread a little. Whole body in frame
   with a margin." + CHAR + STYLE_CHAR
3. squished (1:1): "Full body of the same cartoon mosquito being squashed from above as if something heavy is pressing
   down on its back, side view facing to the right, body squashed lower and wider, wings pressed flat back along its
   body, eyes squeezed tightly shut drawn as two black chevrons like > <, mouth a small wobbly frown, its six legs
   splayed out sideways and downward. The top of its back is a smooth even curve. Whole body in frame with a margin."
   + CHAR + STYLE_CHAR
4. tumble (1:1): "Full body of the same cartoon mosquito tumbling through the air, side view facing to the right, all
   six long legs spread wide apart in every direction like a starfish, both wings opened wide, surprised expression:
   eyebrows raised high, round wide eyes, mouth a small round o. Whole body in frame with a margin." + CHAR + STYLE_CHAR
5. smug (1:1): "Full body of the same cartoon mosquito hovering in the air, side view facing to the right, both wings
   raised, smug relaxed expression: half-closed eyelids, relaxed eyebrows, a small confident smile, its two front legs
   folded across its chest like crossed arms, the other legs hanging down relaxed. Whole body in frame with a margin."
   + CHAR + STYLE_CHAR
6. drop (3:4): "A single big cartoon raindrop: classic teardrop shape with a round bottom and a pointed tip at the top,
   flat bright sky-blue fill (#4AB0F0), a slightly darker blue soft shade along the right side and the bottom
   (#2F8FD6), one white glossy highlight curve on the upper left, thick smooth black outline. No face, no eyes, no
   mosquito. Whole drop in frame with a margin." + STYLE_OBJ
