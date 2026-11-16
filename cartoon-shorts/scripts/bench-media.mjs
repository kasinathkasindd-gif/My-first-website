import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = path.resolve(process.env.BUNDLE || 'build/bundle');
const composition = await selectComposition({serveUrl, id: 'MosquitoRain', browserExecutable: BROWSER});
const [fmt, preset, conc, f0, f1] = process.argv.slice(2);
const t0 = Date.now();
await renderMedia({
  composition, serveUrl, browserExecutable: BROWSER, logLevel: 'error', codec: 'h264', scale: 2, crf: 16, pixelFormat: 'yuv420p',
  imageFormat: fmt, ...(fmt === 'jpeg' ? {jpegQuality: 95} : {}), x264Preset: preset, concurrency: Number(conc),
  frameRange: [Number(f0), Number(f1)], outputLocation: `out/bench-${fmt}-${preset}-${conc}.mp4`, muted: true,
  chromiumOptions: {gl: 'swangle'},
});
console.log(fmt, preset, 'conc', conc, 'frames', f0, '-', f1, ((Date.now() - t0) / 1000).toFixed(1), 's');
