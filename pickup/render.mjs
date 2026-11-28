// node render.mjs <workdir> <out.mp4> [--seconds 4.8] [--fps 30] [--stills 0.2,1.6,4.5] [--frames N]
// Serves <workdir>/index.html, steps the page's timeline (hf-seek) frame by frame, screenshots each one and encodes with ffmpeg.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process'; import { createRequire } from 'node:module';
const [work, out, ...rest] = process.argv.slice(2);
const arg = (k, d) => { const i = rest.indexOf('--' + k); return i < 0 ? d : rest[i + 1]; };
const SEC = +arg('seconds', 4.8), FPS = +arg('fps', 30), MAXF = +arg('frames', 0), STILLS = arg('stills', '');
const require = createRequire(path.resolve(process.env.KIT || '.claude/kit') + '/');
const { chromium } = require('playwright');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const f = path.join(work, q.url.split('?')[0] === '/' ? 'index.html' : decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; r.end(); return; } r.setHeader('content-type', types[path.extname(f)] || 'application/octet-stream'); r.end(d); }); });
await new Promise((ok) => srv.listen(0, ok));
const port = srv.address().port;
const opts = { args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
if (process.env.CHROME_PATH) opts.executablePath = process.env.CHROME_PATH;
const browser = await chromium.launch(opts);
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', (e) => console.log('page error:', e.message));
await page.goto(`http://localhost:${port}/`); await page.waitForTimeout(2500);
const seek = (t) => page.evaluate((t) => window.dispatchEvent(new CustomEvent('hf-seek', { detail: { time: t } })), t);
if (STILLS) { for (const t of STILLS.split(',')) { await seek(+t); await page.waitForTimeout(250); await page.screenshot({ path: `${out.replace(/\.mp4$/, '')}-${t}.png` }); } }
else {
  const dir = path.join(work, 'frames'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
  const n = MAXF || Math.round(SEC * FPS);
  for (let i = 0; i < n; i++) { await seek(i / FPS); await page.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.png`) }); if (i % 20 === 0) console.log(`frame ${i}/${n}`); }
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', path.join(dir, 'f%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', out], { stdio: 'inherit' });
  if (r.status) process.exit(r.status); console.log('wrote', out);
}
await browser.close(); srv.close();
