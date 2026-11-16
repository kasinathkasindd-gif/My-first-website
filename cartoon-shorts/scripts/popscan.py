"""Pop scan: mean abs frame-to-frame difference (blurred, 270x480); flag frames above 2.2x the local median."""
import subprocess, sys
import numpy as np, cv2
src = sys.argv[1] if len(sys.argv) > 1 else 'out/preview-half.mp4'
raw = subprocess.run(['ffmpeg', '-nostdin', '-loglevel', 'error', '-i', src, '-vf', 'scale=270:480', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
                     capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, 480, 270).astype(np.float32)
fr = np.stack([cv2.GaussianBlur(f, (5, 5), 0) for f in fr])
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
flags = []
for i in range(len(d)):
    lo, hi = max(0, i - 15), min(len(d), i + 16)
    med = np.median(d[lo:hi])
    if d[i] > 2.2 * max(med, 0.25):
        flags.append((i + 1, d[i], med))
print('frames', len(fr), 'flags', len(flags))
for f, v, m in flags:
    print(f'  frame {f:4d}  t={f / 60:6.2f}s  diff {v:5.2f}  local median {m:5.2f}')
