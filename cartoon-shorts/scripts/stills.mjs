// Render stills at given times (seconds) into out/stills/, bundling once into build/bundle.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const times = process.argv.slice(2).map(Number);
const scale = Number(process.env.SCALE || 0.5);
const outDir = path.resolve(process.env.OUT || 'out/stills');
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = process.env.SERVE_URL || (await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build/bundle')}));
const composition = await selectComposition({serveUrl, id: 'MosquitoRain', browserExecutable: BROWSER});
for (const t of times) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(t * composition.fps));
  const output = path.join(outDir, `t${t.toFixed(2).padStart(5, '0')}.png`);
  await renderStill({composition, serveUrl, output, frame, scale, browserExecutable: BROWSER, logLevel: 'error'});
  console.log('still', t, '->', output);
}
