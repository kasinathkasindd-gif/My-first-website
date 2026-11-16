"""Thin the raindrop's baked black outline (32 px -> ~15 px at sprite size) so that, at the drop's world
scale, its outline sits in the same weight family as the mosquito's. Inner ink is in-painted with the fill."""
import os
import numpy as np, cv2
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
P = os.path.abspath(os.path.join(ROOT, '..', '..', 'public', 'mosquito', 'sprites', 'drop.png'))
TARGET = 15.0
im = np.array(Image.open(P).convert('RGBA'))
rgb = im[..., :3].copy(); a = im[..., 3]
dist_out = cv2.distanceTransform((a > 128).astype(np.uint8), cv2.DIST_L2, 5)  # distance to transparency
lum = rgb.astype(int).sum(2) / 3
ink = (a > 200) & (lum < 90)
remove = ink & (dist_out > TARGET - 1.5)
# grow the removal a little into the anti-aliased inner edge of the old outline
edge = cv2.dilate(remove.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool) & (lum < 150) & (dist_out > TARGET - 1.5)
mask = (remove | edge).astype(np.uint8) * 255
bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
filled = cv2.cvtColor(cv2.inpaint(bgr, mask, 6, cv2.INPAINT_TELEA), cv2.COLOR_BGR2RGB)
# soft seam between the kept outline and the in-painted fill
w = np.clip((dist_out - (TARGET - 1.5)) / 2.5, 0, 1)[..., None]
w = w * w * (3 - 2 * w)
out_rgb = np.where(mask[..., None] > 0, (rgb * (1 - w) + filled * w), rgb).astype(np.uint8)
Image.fromarray(np.dstack([out_rgb, a])).save(P, optimize=True)
print('thinned', int(remove.sum()), 'px of inner outline')
