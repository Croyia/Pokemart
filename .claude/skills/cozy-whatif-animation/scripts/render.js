#!/usr/bin/env node
// Render a cozy-scene HTML file to a still PNG or to PNG frames + MP4.
//
//   node render.js <scene.html> <outDir> --still <seconds>
//   node render.js <scene.html> <outDir> [--duration 16] [--fps 30] [--width 1920] [--height 1080]
//
// All CSS/Web animations are paused and seeked to each frame's time, so output is
// frame-exact regardless of machine speed. MP4 encoding needs ffmpeg on PATH.

const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

function parseArgs(argv) {
  const [input, outDir, ...rest] = argv;
  if (!input || !outDir) {
    console.error('usage: render.js <scene.html> <outDir> [--still s] [--duration s] [--fps n] [--width px] [--height px]');
    process.exit(1);
  }
  const opts = { input, outDir, duration: 16, fps: 30, width: 1920, height: 1080, still: null };
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i].replace(/^--/, '');
    if (!(key in opts)) throw new Error(`unknown option --${key}`);
    opts[key] = Number(rest[i + 1]);
  }
  return opts;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  fs.mkdirSync(o.outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: o.width, height: o.height } });
  await page.goto(pathToFileURL(path.resolve(o.input)).href, { waitUntil: 'networkidle' }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);

  const seek = (ms) => page.evaluate((t) => {
    for (const a of document.getAnimations()) { a.pause(); a.currentTime = t; }
  }, ms);

  if (o.still !== null) {
    await seek(o.still * 1000);
    const file = path.join(o.outDir, 'still.png');
    await page.screenshot({ path: file });
    console.log(file);
  } else {
    const framesDir = path.join(o.outDir, 'frames');
    fs.rmSync(framesDir, { recursive: true, force: true });
    fs.mkdirSync(framesDir, { recursive: true });
    const total = Math.round(o.duration * o.fps);
    for (let f = 0; f < total; f++) {
      await seek((f / o.fps) * 1000);
      await page.screenshot({ path: path.join(framesDir, String(f).padStart(5, '0') + '.png') });
      if (f % o.fps === 0) process.stdout.write(`\rframe ${f}/${total}`);
    }
    process.stdout.write(`\rframe ${total}/${total}\n`);
    const video = path.join(o.outDir, 'video.mp4');
    try {
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(o.fps),
        '-i', path.join(framesDir, '%05d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
        '-crf', '18', video], { stdio: 'inherit' });
      console.log(video);
    } catch (e) {
      console.warn('ffmpeg not available or failed; frames are in', framesDir);
    }
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
