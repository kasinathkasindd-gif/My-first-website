// node scripts/render.mjs final|preview|audio
// final: 2160x3840 (scale 2), 60 fps, PNG frames, CRF 16, yuv420p.  preview: 540x960 (scale 0.5).  audio: WAV only.
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const mode = process.argv[2] || 'preview';
const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
fs.mkdirSync('out', {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build/bundle')});
const composition = await selectComposition({serveUrl, id: 'MosquitoRain', browserExecutable: BROWSER});
const common = {composition, serveUrl, browserExecutable: BROWSER, logLevel: 'error', concurrency: Number(process.env.CONC || os.cpus().length)};
let last = -1;
const onProgress = ({progress}) => {
  const p = Math.floor(progress * 20);
  if (p !== last) {
    last = p;
    console.log(`${mode} ${Math.round(progress * 100)}%`);
  }
};
const t0 = Date.now();
if (mode === 'audio') {
  await renderMedia({...common, codec: 'wav', outputLocation: 'out/mix.wav', onProgress});
} else if (mode === 'preview') {
  await renderMedia({...common, codec: 'h264', scale: 0.5, crf: 23, imageFormat: 'jpeg', outputLocation: 'out/preview-half.mp4', onProgress});
} else {
  await renderMedia({
    ...common,
    codec: 'h264',
    scale: 2,
    crf: 16,
    x264Preset: 'faster',
    pixelFormat: 'yuv420p',
    imageFormat: 'png',
    chromiumOptions: {gl: 'swangle'},
    outputLocation: 'out/mosquito-rain-4K.mp4',
    onProgress,
  });
}
console.log(`done ${mode} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
