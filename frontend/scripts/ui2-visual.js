#!/usr/bin/env node
// Backward compatibility, layer 3: what every UI 2.0 widget looks like. Builds the gallery page
// (Widgets/Ui2/__tests__/visual/gallery.jsx: each widget as a new widget is created, default, loading and disabled),
// opens it in Chromium in the light and the dark theme, screenshots each widget's row and compares it with the
// committed baseline (Widgets/Ui2/__tests__/visual/baselines/<platform>/<theme>/<Type>.png). Text renders differently
// on macOS and Linux, so each platform has its own set; CI writes the Linux set when run with --update and uploads it.
//
//   npm run test:ui2-visual                       build, compare, exit 1 on a difference over the threshold
//   npm run test:ui2-visual -- --update           write the baselines (all, or those given with --only)
//   npm run test:ui2-visual -- --repeat 3         compare three times, reporting the largest difference per widget
//   options: --only ShadSelect,ShadTable  --no-build  --threshold 0.003 (share of pixels allowed to differ)
//
// Needs playwright-core (not a dependency of the app): `npm install --no-save playwright-core@1.63.0` in CI, or point
// UI2_VISUAL_DEPS at a folder whose node_modules has it. Chromium: `npx playwright-core install chromium`, or
// UI2_VISUAL_CHROME=<path to a Chromium binary>. Differences are written to build/ui2-visual/diff.
const fs = require('fs');
const path = require('path');
const http = require('http');
const { PNG } = require('pngjs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'build/ui2-visual');
const BASELINES = path.join(ROOT, 'src/AppBuilder/Widgets/Ui2/__tests__/visual/baselines', process.platform);
const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const update = args.includes('--update');
const repeat = Number(option('--repeat', 1));
const only = option('--only')?.split(',');
const threshold = Number(option('--threshold', 0.003));
const THEMES = ['light', 'dark'];

// A pixel differs when a channel moves by more than this (0-255): anti-aliasing and sub-pixel text stay under it.
const CHANNEL_TOLERANCE = 40;

function requirePlaywright() {
  const from = process.env.UI2_VISUAL_DEPS ? [path.resolve(process.env.UI2_VISUAL_DEPS, 'node_modules')] : [];
  try {
    return require(require.resolve('playwright-core', { paths: [...from, ROOT] }));
  } catch {
    console.error(
      'playwright-core is not installed. In CI: npm install --no-save playwright-core@1.63.0. Locally, without ' +
        'touching node_modules: UI2_VISUAL_DEPS=<folder with playwright-core in its node_modules>.'
    );
    process.exit(2);
  }
}

async function build() {
  const webpack = require('webpack');
  const config = require('./ui2-visual.webpack');
  await new Promise((resolve, reject) =>
    webpack(config, (error, stats) => {
      if (error) return reject(error);
      if (stats.hasErrors()) return reject(new Error(stats.toString({ all: false, errors: true })));
      resolve();
    })
  );
}

/** Serves the built gallery, and the app's /assets (fonts, icons the styles reference). */
function serve() {
  const TYPES = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml' };
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const file = url.startsWith('/assets/') ? path.join(ROOT, url) : path.join(OUT, url === '/' ? 'index.html' : url);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// What makes two runs of one build differ: animations, a blinking caret, the clock, and anything off this machine
// (map tiles, remote images), which is answered with one grey pixel.
const STILL = `*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }`;
const GREY = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mO8+x8AAuMB8ZlJ0NIAAAAASUVORK5CYII=',
  'base64'
);

/** Screenshots of every row, after the page has stopped changing (auto-height widgets settle over a few frames). */
async function capture(browser, origin, theme) {
  const context = await browser.newContext({
    viewport: { width: 1840, height: 1000 },
    deviceScaleFactor: 1,
    timezoneId: 'UTC',
    locale: 'en-US',
    colorScheme: theme,
  });
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date('2026-06-15T09:00:00Z'));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) =>
    route.request().resourceType() === 'image' ? route.fulfill({ contentType: 'image/png', body: GREY }) : route.abort()
  );
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${origin}/?theme=${theme}${only ? `&only=${only.join(',')}` : ''}`);
  await page.waitForFunction(() => window.__ui2Gallery?.ready || window.__ui2Gallery?.error, null, { timeout: 120000 });
  const failure = await page.evaluate(() => window.__ui2Gallery.error);
  if (failure) throw new Error(`The gallery did not load: ${failure}`);
  await page.addStyleTag({ content: STILL });
  await page.evaluate(() => document.fonts.ready);

  // Settled: two full-page screenshots 400 ms apart are identical (or 30 tries pass).
  let previous;
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(400);
    const shot = await page.screenshot({ fullPage: true });
    if (previous && shot.equals(previous)) break;
    previous = shot;
  }
  const shots = {};
  for (const type of await page.evaluate(() => window.__ui2Gallery.cells)) {
    shots[type] = await page.locator(`[data-cell="${type}"]`).screenshot();
  }
  await context.close();
  return { shots, errors };
}

/** The share of pixels that differ, and a picture of where (red over a faded copy of the baseline). */
function compare(baseline, actual) {
  const a = PNG.sync.read(baseline);
  const b = PNG.sync.read(actual);
  if (a.width !== b.width || a.height !== b.height)
    return { ratio: 1, reason: `size ${a.width}x${a.height} became ${b.width}x${b.height}` };
  const diff = new PNG({ width: a.width, height: a.height });
  let differing = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const moved = [0, 1, 2, 3].some((c) => Math.abs(a.data[i + c] - b.data[i + c]) > CHANNEL_TOLERANCE);
    if (moved) differing++;
    const grey = 255 - (255 - (a.data[i] + a.data[i + 1] + a.data[i + 2]) / 3) * 0.25;
    diff.data.set(moved ? [230, 30, 40, 255] : [grey, grey, grey, 255], i);
  }
  return { ratio: differing / (a.width * a.height), diff: PNG.sync.write(diff) };
}

async function main() {
  if (!args.includes('--no-build')) {
    const started = Date.now();
    console.log('Building the gallery...');
    await build();
    console.log(`Built in ${Math.round((Date.now() - started) / 1000)} s.`);
  }
  const { chromium } = requirePlaywright();
  const browser = await chromium.launch(
    process.env.UI2_VISUAL_CHROME ? { executablePath: process.env.UI2_VISUAL_CHROME } : {}
  );
  const server = await serve();
  const origin = `http://127.0.0.1:${server.address().port}`;
  fs.rmSync(path.join(OUT, 'diff'), { recursive: true, force: true });

  const worst = {}; // `${theme}/${type}` -> largest share of differing pixels over the runs
  const failures = [];
  try {
    for (let run = 1; run <= (update ? 1 : repeat); run++) {
      for (const theme of THEMES) {
        const { shots, errors } = await capture(browser, origin, theme);
        if (errors.length) failures.push(`${theme}: the page threw: ${errors.join('; ')}`);
        for (const [type, shot] of Object.entries(shots)) {
          const file = path.join(BASELINES, theme, `${type}.png`);
          const key = `${theme}/${type}`;
          if (update) {
            fs.mkdirSync(path.dirname(file), { recursive: true });
            fs.writeFileSync(file, PNG.sync.write(PNG.sync.read(shot), { deflateLevel: 9 }));
            continue;
          }
          if (!fs.existsSync(file)) {
            failures.push(
              `${key}: no ${process.platform} baseline. Write it with npm run test:ui2-visual -- --update --only ${type}`
            );
            continue;
          }
          const { ratio, reason, diff } = compare(fs.readFileSync(file), shot);
          worst[key] = Math.max(worst[key] ?? 0, ratio);
          if (ratio > threshold) {
            const out = path.join(OUT, 'diff', theme);
            fs.mkdirSync(out, { recursive: true });
            fs.writeFileSync(path.join(out, `${type}.actual.png`), shot);
            if (diff) fs.writeFileSync(path.join(out, `${type}.diff.png`), diff);
            failures.push(
              `${key} (run ${run}): ${reason ?? `${(ratio * 100).toFixed(2)}% of pixels differ`}; see ` +
                path.relative(ROOT, path.join(out, `${type}.diff.png`))
            );
          }
        }
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (update) {
    console.log(`Baselines written to ${path.relative(ROOT, BASELINES)}.`);
    return;
  }
  const noisy = Object.entries(worst)
    .filter(([, r]) => r > 0)
    .sort(([, a], [, b]) => b - a);
  console.log(
    `${Object.keys(worst).length} rows compared over ${repeat} run(s); ${noisy.length} with any differing pixel` +
      (noisy.length
        ? `, largest: ${noisy
            .slice(0, 8)
            .map(([k, r]) => `${k} ${(r * 100).toFixed(3)}%`)
            .join(', ')}`
        : '')
  );
  if (failures.length) {
    console.error(
      `\nUI 2.0 visual check: ${failures.length} difference(s) over ${(threshold * 100).toFixed(2)}% of a row.\n  ` +
        failures.join('\n  ') +
        '\nIf the change is intended, update those baselines (--update --only <Type>) and commit them with the change.'
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
