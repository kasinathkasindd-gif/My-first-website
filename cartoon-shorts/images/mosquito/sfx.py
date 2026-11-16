"""Build the sound-effect files in public/mosquito/sfx/.

The two water sounds come from Higgsfield seed_audio (sfx_raw/); the rest are synthesized here
(credits were short): rain bed, mosquito buzz, boing, whooshes, falling whistle, slow-mo whomp,
squish, tape ticks, flip swish, boop, landing tap. Every file is peak-normalised to -1 dBFS.
"""
import os, subprocess
import numpy as np

SR = 48000
ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(ROOT, '..', '..', 'public', 'mosquito', 'sfx'))
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def save(name, x):
    x = np.asarray(x, np.float32)
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (-1 / 20)
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2').tobytes()
    subprocess.run(['ffmpeg', '-nostdin', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-',
                    os.path.join(OUT, name + '.wav')], input=pcm, check=True)


def load(path):
    raw = subprocess.run(['ffmpeg', '-nostdin', '-loglevel', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def t(d):
    return np.arange(int(d * SR)) / SR


def lp(x, fc):  # one-pole low-pass
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)):
        s = (1 - a) * x[i] + a * s; y[i] = s
    return y


def bandnoise(n, lo, hi):
    X = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, n)


def sweep_noise(d, f0, f1, q=0.35):
    """noise through a moving band-pass (STFT-free: sum of short band-limited grains)."""
    n = int(d * SR); out = np.zeros(n); g = int(0.04 * SR); hop = g // 2
    win = np.hanning(g)
    for i in range(0, n - g, hop):
        u = i / n; fc = f0 * (f1 / f0) ** u
        out[i:i + g] += bandnoise(g, fc * (1 - q), fc * (1 + q)) * win
    return out


def env_adsr(n, a, r, curve=2.0):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na); e[-nr:] = np.linspace(1, 0, nr) ** curve
    return e


# --- water sounds from Higgsfield: trim to the useful part ---------------------------------------
sp = load(os.path.join(ROOT, 'sfx_raw', 'splash_big.wav'))
on = np.argmax(np.abs(sp) > 0.05 * np.abs(sp).max())
sp = sp[max(0, on - int(0.01 * SR)): on + int(1.2 * SR)]
sp *= np.r_[np.ones(len(sp) - int(0.3 * SR)), np.linspace(1, 0, int(0.3 * SR))]
save('splash_big', sp)
pl = load(os.path.join(ROOT, 'sfx_raw', 'plop_small.wav'))
on = np.argmax(np.abs(pl) > 0.08 * np.abs(pl).max())
pl = pl[max(0, on - int(0.005 * SR)): on + int(0.6 * SR)]
pl *= np.r_[np.ones(len(pl) - int(0.15 * SR)), np.linspace(1, 0, int(0.15 * SR))]
save('plop_small', pl)

# --- rain bed: soft pink-ish noise + scattered droplet ticks (22 s) ------------------------------
d = 22.5; n = int(d * SR)
w = rng.standard_normal(n)
pink = lp(w, 2500) - 0.6 * lp(w, 300)
drops = np.zeros(n)
for k in rng.integers(0, n - 2000, 2600):
    m = int(rng.integers(150, 600)); fr = rng.uniform(2200, 6000)
    drops[k:k + m] += rng.uniform(0.15, 0.6) * np.sin(2 * np.pi * fr * np.arange(m) / SR) * np.exp(-np.arange(m) / (m / 5))
rain = pink * 0.8 + drops * 0.5
rain *= np.r_[np.linspace(0, 1, SR // 2), np.ones(n - SR // 2)]
save('rain_bed', rain)

# --- mosquito buzz (2.0 s, starts/ends soft so it can be layered) --------------------------------
tt = t(2.0); f = 610 + 18 * np.sin(2 * np.pi * 5.3 * tt) + 9 * np.sin(2 * np.pi * 13 * tt)
ph = 2 * np.pi * np.cumsum(f) / SR
saw = sum(np.sin(k * ph) / k for k in range(1, 9))
buzz = saw * (0.75 + 0.25 * np.sin(2 * np.pi * 31 * tt)) * env_adsr(len(tt), 0.08, 0.25)
save('buzz', buzz)

# --- seesaw: wooden thunk + spring boing ---------------------------------------------------------
tt = t(0.75)
thunk = bandnoise(len(tt), 80, 900) * np.exp(-tt / 0.03) * 1.4 + np.sin(2 * np.pi * 95 * tt) * np.exp(-tt / 0.06)
fb = 210 + 230 * (1 - np.exp(-tt / 0.06)) + 40 * np.sin(2 * np.pi * 14 * tt) * np.exp(-tt / 0.25)
boing = np.sin(2 * np.pi * np.cumsum(fb) / SR) * np.exp(-tt / 0.22) * env_adsr(len(tt), 0.01, 0.1)
save('boing', thunk * 0.9 + boing * 0.8)

# --- whooshes ------------------------------------------------------------------------------------
x = sweep_noise(1.1, 350, 2600); x *= np.sin(np.pi * np.linspace(0, 1, len(x))) ** 1.6
save('whoosh_up', x)
x = sweep_noise(1.5, 2200, 300); x *= np.sin(np.pi * np.linspace(0, 1, len(x))) ** 1.4
save('whoosh_down', x)
x = sweep_noise(0.4, 900, 3200, 0.5); x *= np.sin(np.pi * np.linspace(0, 1, len(x))) ** 2
save('flip', x)

# --- falling whistle (1.1 s) ---------------------------------------------------------------------
tt = t(1.1); fw = 1900 * (650 / 1900) ** (tt / 1.1)
save('whistle_fall', np.sin(2 * np.pi * np.cumsum(fw) / SR) * env_adsr(len(tt), 0.05, 0.12))

# --- slow-mo whomp (tape-stop) and speed-up ------------------------------------------------------
tt = t(0.9); fs = 220 * (38 / 220) ** (tt / 0.9)
wh = (np.sin(2 * np.pi * np.cumsum(fs) / SR) + 0.35 * np.sin(4 * np.pi * np.cumsum(fs) / SR)) * env_adsr(len(tt), 0.01, 0.35)
wh += sweep_noise(0.9, 1800, 120, 0.6) * 0.6 * env_adsr(len(tt), 0.01, 0.4)
save('slowmo_in', wh)
tt = t(0.6); fs = 50 * (260 / 50) ** (tt / 0.6)
up = np.sin(2 * np.pi * np.cumsum(fs) / SR) * env_adsr(len(tt), 0.15, 0.12) + sweep_noise(0.6, 200, 2400, 0.6) * 0.5 * env_adsr(len(tt), 0.2, 0.1)
save('slowmo_out', up)

# --- squish (slowed, deep) -----------------------------------------------------------------------
tt = t(0.9)
fsq = 150 * (55 / 150) ** (tt / 0.9)
sq = np.sin(2 * np.pi * np.cumsum(fsq) / SR) * np.exp(-tt / 0.28)
wet = bandnoise(len(tt), 120, 1400) * np.exp(-tt / 0.12) * 0.6
bub = np.zeros(len(tt))
for k0 in [int(0.05 * SR), int(0.16 * SR), int(0.3 * SR)]:
    m = int(0.09 * SR); tb = np.arange(m) / SR; fbb = 260 + 500 * tb / 0.09
    bub[k0:k0 + m] += 0.35 * np.sin(2 * np.pi * np.cumsum(fbb) / SR) * np.sin(np.pi * tb / 0.09)
save('squish', sq + wet + bub)

# --- tape tick and the 20th 'ding' ---------------------------------------------------------------
tt = t(0.06)
tick = bandnoise(len(tt), 1500, 7000) * np.exp(-tt / 0.004) + 0.5 * np.sin(2 * np.pi * 2600 * tt) * np.exp(-tt / 0.012)
save('tick', tick)
tt = t(0.7)
ding = sum(np.sin(2 * np.pi * f0 * tt) * np.exp(-tt / dd) for f0, dd in [(1568, 0.35), (3136, 0.18), (2349, 0.25)])
save('ding', ding * env_adsr(len(tt), 0.003, 0.1))

# --- small boop (light hit) and landing tap ------------------------------------------------------
tt = t(0.22); fbp = 620 * (360 / 620) ** (tt / 0.22)
save('boop', np.sin(2 * np.pi * np.cumsum(fbp) / SR) * env_adsr(len(tt), 0.006, 0.12) + 0.15 * bandnoise(len(tt), 300, 2000) * np.exp(-tt / 0.02))
tt = t(0.12)
save('tap', bandnoise(len(tt), 600, 5000) * np.exp(-tt / 0.008) + 0.6 * np.sin(2 * np.pi * 950 * tt) * np.exp(-tt / 0.03))

# --- pop (sweat drop / small pops) ---------------------------------------------------------------
tt = t(0.09); fpp = 400 + 1400 * tt / 0.09
save('pop', np.sin(2 * np.pi * np.cumsum(fpp) / SR) * np.sin(np.pi * tt / 0.09) ** 2)
print('ok', sorted(os.listdir(OUT)))
