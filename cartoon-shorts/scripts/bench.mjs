import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = path.resolve('build/bundle');
const composition = await selectComposition({serveUrl, id: 'MosquitoRain', browserExecutable: BROWSER});
for (const fmt of ['png', 'jpeg']) {
  for (const t of [0, 6.0, 9.5]) {
    const t0 = Date.now();
    await renderStill({composition, serveUrl, output: `out/bench-${fmt}-${t}.${fmt === 'png' ? 'png' : 'jpg'}`, frame: Math.round(t * 60), scale: 2, imageFormat: fmt, ...(fmt === 'jpeg' ? {jpegQuality: 95} : {}), browserExecutable: BROWSER, logLevel: 'error', chromiumOptions: {gl: 'swangle'}});
    console.log(fmt, t, ((Date.now() - t0) / 1000).toFixed(2), 's');
  }
}
