#!/usr/bin/env node
/**
 * UI 2.0 in real browsers: Chromium, WebKit and Firefox on a gallery app of every UI 2.0 widget, in the viewer of a
 * running ToolJet. Not part of jest (npm run test:ui2-browsers, or test:ui2-phone for the phone checks).
 *
 * Desktop (default), per browser, light and dark:
 *   - the page loads every widget with no page error and no "not available" widget;
 *   - axe-core finds no violation (WCAG 2.1 A and AA, colour contrast included, which jsdom cannot check);
 *   - every overlay (select lists, date and time pickers, menus, the dialog...) opens on a press, stays inside the
 *     window, takes focus, has no axe violation, closes on Escape and gives focus back to its widget;
 *   - the Map draws its tiles and markers, and a marker opens its popup.
 * Phone (--phone), Chromium and WebKit as phones at 375 and 414 px wide:
 *   - nothing makes the page scroll sideways, no widget draws outside its box, no text is cut off without an
 *     ellipsis, and every touch target is at least 24 x 24 px or has room around it (WCAG 2.5.8).
 *
 * Setup: a public app holding one of every UI 2.0 widget, named <type>1 (accordion1, select1...), shown on mobile and
 * stacked full width in the mobile layout, with the app mode Auto (the viewer then follows the darkMode this script
 * sets). Playwright: playwright-core with its browsers installed
 * (npx playwright-core install chromium webkit firefox), from this package or from UI2_BROWSER_DEPS.
 *
 * Environment: UI2_BROWSERS_URL (default http://localhost:8082), UI2_GALLERY_APP (the app's id or slug, required),
 * UI2_GALLERY_PAGE (default home), UI2_BROWSERS (default chromium,webkit,firefox), UI2_BROWSERS_OUT (default
 * build/ui2-browsers). Writes report.json and overlay screenshots there; exits 1 on any problem not in KNOWN.
 */
const fs = require('fs');
const path = require('path');

const deps = process.env.UI2_BROWSER_DEPS || process.env.UI2_VISUAL_DEPS;
const playwright = require(deps ? path.join(deps, 'node_modules/playwright-core') : 'playwright-core');

const BASE = process.env.UI2_BROWSERS_URL || 'http://localhost:8082';
const APP = process.env.UI2_GALLERY_APP;
const PAGE = process.env.UI2_GALLERY_PAGE || 'home';
const BROWSERS = (process.env.UI2_BROWSERS || 'chromium,webkit,firefox').split(',');
const OUT = path.resolve(__dirname, '..', process.env.UI2_BROWSERS_OUT || 'build/ui2-browsers');
const PHONE = process.argv.includes('--phone');
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const WIDGETS = 75;

// The overlays, by the gallery widget that opens them, and what to press to open them.
const OVERLAYS = {
  select1: '[role=combobox]',
  combobox1: '[role=combobox]',
  multiselect1: '[role=combobox]',
  datepicker1: 'button',
  datetimepicker1: 'button',
  timepicker1: 'button',
  dropdownmenu1: 'button',
  colorpicker1: 'button',
  phoneinput1: 'button[aria-haspopup]',
  dialog1: 'button',
};
const OVERLAY = '[data-radix-popper-content-wrapper], .modal.show [role=dialog], .modal.show';

// Problems found in code outside the UI 2.0 widgets (each an exact problem string). Delete an entry once it is fixed.
const KNOWN = new Set([
  // The viewer's AI slice fetches the LLM preference for an anonymous viewer of a public app, gets a 401, and rejects
  // with a plain object (aiSlice.js: "Failed to fetch LLM preference").
  'page error: a plain object',
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function openGallery(browserType, { mode, phone }) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext(
    phone
      ? {
          viewport: { width: phone, height: 860 },
          deviceScaleFactor: 2,
          isMobile: true,
          hasTouch: true,
          colorScheme: mode,
        }
      : { viewport: { width: 1440, height: 900 }, colorScheme: mode }
  );
  await context.addInitScript((dark) => localStorage.setItem('darkMode', String(dark)), mode === 'dark');
  const page = await context.newPage();
  const errors = [];
  // A promise rejected with a plain object reads "Object", "[object Object]" or "Object { ... }" by browser.
  const plain = /^(Object|\[object Object\]|Object \{.*\})$/;
  page.on('pageerror', (e) =>
    errors.push(`page error: ${plain.test(e.message) ? 'a plain object' : String(e.message).slice(0, 200)}`)
  );
  await page.goto(`${BASE}/applications/${APP}/${PAGE}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  let shown = 0;
  for (let i = 0; i < 240 && shown < WIDGETS; i += 1) {
    shown = await page.evaluate(() => document.querySelectorAll('[data-cy^="draggable-widget-"]').length);
    if (shown < WIDGETS) await sleep(500);
  }
  await sleep(5000);
  return { browser, page, errors, shown };
}

/** axe over `include` (a selector, default every widget on the page, not the viewer around them): one line per
 *  violation and the widgets it was found in. */
async function axe(page, include) {
  await page.evaluate(AXE);
  return page.evaluate(async (scope) => {
    const result = await window.axe.run(
      { include: [[scope || '[data-cy^="draggable-widget-"]']] },
      {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        rules: { region: { enabled: false } },
      }
    );
    const widgetOf = (target) => {
      const el = document.querySelector(target[0]);
      return el?.closest('[data-cy^="draggable-widget-"]')?.getAttribute('data-cy').replace('draggable-widget-', '');
    };
    return result.violations.map((v) => {
      const where = [...new Set(v.nodes.map((n) => widgetOf(n.target) || n.target.join(' ')))].slice(0, 8);
      const detail = v.id === 'color-contrast' ? v.nodes[0]?.any?.[0]?.message?.slice(0, 160) : '';
      return `${v.id} (${v.impact}): ${where.join(', ')}${detail ? ` [${detail}]` : ''}`;
    });
  }, include || null);
}

async function checkOverlay(page, name, trigger, shots) {
  const problems = [];
  const box = page.locator(`[data-cy="draggable-widget-${name}"]`).first();
  if (!(await box.count())) return [`${name}: not on the page`];
  await box.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const target = box.locator(trigger).first();
  await target.click();
  try {
    await page.waitForSelector(OVERLAY, { state: 'visible', timeout: 4000 });
  } catch {
    return [`${name}: overlay did not open`];
  }
  await sleep(500);
  const state = await page.evaluate(
    ({ selector, widget }) => {
      const overlays = [...document.querySelectorAll(selector)].filter((el) => el.getBoundingClientRect().width > 0);
      const el = overlays[overlays.length - 1];
      const r = el.getBoundingClientRect();
      const inner = el.querySelector('[role=dialog], [role=listbox], [role=menu], .modal-content') || el;
      const ir = inner.getBoundingClientRect();
      const active = document.activeElement;
      return {
        rect: [Math.round(ir.left), Math.round(ir.top), Math.round(ir.right), Math.round(ir.bottom)],
        inside: ir.left >= -1 && ir.top >= -1 && ir.right <= innerWidth + 1 && ir.bottom <= innerHeight + 1,
        focus: !!active && (el.contains(active) || r.width === 0),
        focusOn: active
          ? `${active.tagName.toLowerCase()}${active.getAttribute('role') ? `[${active.getAttribute('role')}]` : ''}`
          : '',
        widgetHasFocus: !!document.querySelector(`[data-cy="draggable-widget-${widget}"]`)?.contains(active),
      };
    },
    { selector: OVERLAY, widget: name }
  );
  if (!state.inside) problems.push(`${name}: overlay outside the window at ${state.rect.join(',')}`);
  if (!state.focus) problems.push(`${name}: overlay opened without focus (focus on ${state.focusOn})`);
  for (const v of await axe(page, OVERLAY)) problems.push(`${name} open: ${v}`);
  await page.screenshot({ path: path.join(shots, `${name}.png`) });
  await page.keyboard.press('Escape');
  await sleep(600);
  const after = await page.evaluate(
    ({ selector, widget }) => ({
      open: [...document.querySelectorAll(selector)].some((el) => el.getBoundingClientRect().width > 0),
      back: !!document.querySelector(`[data-cy="draggable-widget-${widget}"]`)?.contains(document.activeElement),
    }),
    { selector: OVERLAY, widget: name }
  );
  if (after.open) problems.push(`${name}: Escape did not close the overlay`);
  else if (!after.back) problems.push(`${name}: focus did not come back to the widget after Escape`);
  return problems;
}

async function checkMap(page) {
  const box = page.locator('[data-cy="draggable-widget-map1"]').first();
  if (!(await box.count())) return ['map1: not on the page'];
  await box.scrollIntoViewIfNeeded();
  await sleep(3000);
  const state = await box.evaluate((el) => {
    const map = el.querySelector('.leaflet-container');
    const r = map?.getBoundingClientRect();
    return {
      size: r ? [Math.round(r.width), Math.round(r.height)] : [0, 0],
      tiles: el.querySelectorAll('.leaflet-tile-loaded').length,
      markers: el.querySelectorAll('[data-marker], [data-cluster]').length,
    };
  });
  const problems = [];
  if (!state.size[0] || !state.size[1]) problems.push(`map1: map has no size (${state.size.join('x')})`);
  if (!state.tiles) problems.push('map1: no map tiles loaded');
  if (!state.markers) problems.push('map1: no markers drawn');
  const marker = box.locator('[data-marker]').first();
  if (await marker.count()) {
    await marker.click();
    await sleep(800);
    if (!(await box.locator('.leaflet-popup, .sc-map-popup').count()))
      problems.push('map1: a marker click opened no popup');
  }
  return problems;
}

/** Phone checks for every widget on the page: what draws outside its box, cut-off text, small touch targets. */
const phoneProblems = (page) =>
  page.evaluate(() => {
    const out = [];
    const vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > vw + 1)
      out.push(`page scrolls sideways: ${document.documentElement.scrollWidth}px wide at ${vw}px`);
    const visible = (el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return (
        cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0 && r.width > 1 && r.height > 1
      );
    };
    // Inside a box that scrolls or clips sideways (a table's scroll area, a progress track), so not drawn outside.
    const contained = (el, root) => {
      for (let n = el.parentElement; n && n !== root.parentElement; n = n.parentElement) {
        if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(n).overflowX)) return true;
      }
      return false;
    };
    // A control's target is the control and its labels (a label activates its control).
    const targetRect = (el) => {
      const rects = [el.getBoundingClientRect(), ...[...(el.labels || [])].map((l) => l.getBoundingClientRect())];
      const left = Math.min(...rects.map((r) => r.left));
      const top = Math.min(...rects.map((r) => r.top));
      const right = Math.max(...rects.map((r) => r.right));
      const bottom = Math.max(...rects.map((r) => r.bottom));
      return { left, top, right, bottom, width: right - left, height: bottom - top };
    };
    // WCAG 2.5.8's inline exception: a link inside a line of text.
    const inline = (el) =>
      el.tagName === 'A' &&
      getComputedStyle(el).display === 'inline' &&
      [...(el.parentElement?.childNodes || [])].some((n) => n.nodeType === 3 && n.textContent.trim());
    const TARGETS =
      'button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=checkbox], [role=radio], [role=switch], [role=tab], [role=slider], [role=combobox], [role=option], [role=menuitem], [tabindex="0"]';
    for (const box of document.querySelectorAll('[data-cy^="draggable-widget-"]')) {
      const name = box.getAttribute('data-cy').replace('draggable-widget-', '');
      const br = box.getBoundingClientRect();
      if (!br.width) continue;
      if (br.right > vw + 1) out.push(`${name}: widget box ends at ${Math.round(br.right)}px, past the ${vw}px screen`);
      const escaping = new Set();
      const clipped = new Set();
      for (const el of box.querySelectorAll('*')) {
        if (!visible(el) || el.closest('[aria-hidden=true], .sr-only, .leaflet-pane')) continue;
        const r = el.getBoundingClientRect();
        if ((r.right > br.right + 1 || r.left < br.left - 1) && !contained(el, box))
          escaping.add(
            el.tagName.toLowerCase() +
              (el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : '')
          );
        const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        const cs = getComputedStyle(el);
        if (
          ownText &&
          el.scrollWidth > el.clientWidth + 1 &&
          /(hidden|clip)/.test(cs.overflowX) &&
          cs.textOverflow !== 'ellipsis' &&
          cs.webkitLineClamp === 'none'
        )
          clipped.add(el.textContent.trim().slice(0, 30));
      }
      if (escaping.size) out.push(`${name}: draws outside its box: ${[...escaping].slice(0, 4).join(', ')}`);
      if (clipped.size) out.push(`${name}: text cut off without an ellipsis: ${[...clipped].slice(0, 3).join(' | ')}`);
      const targets = [...box.querySelectorAll(TARGETS)].filter(
        (el) => visible(el) && !el.closest('[aria-hidden=true]') && !el.disabled && !inline(el)
      );
      const rects = targets.map(targetRect);
      const small = new Set();
      targets.forEach((el, i) => {
        const r = rects[i];
        if (r.width >= 24 && r.height >= 24) return;
        // WCAG 2.5.8 spacing: a 24 px circle on the target's centre may not reach another target.
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const crowded = rects.some((o, j) => {
          if (j === i || o.width === 0) return false;
          const dx = Math.max(o.left - cx, 0, cx - o.right);
          const dy = Math.max(o.top - cy, 0, cy - o.bottom);
          return Math.hypot(dx, dy) < 12;
        });
        if (crowded) {
          const label = el.getAttribute('aria-label') || el.textContent.trim().slice(0, 16) || el.tagName.toLowerCase();
          small.add(`${label} ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      });
      if (small.size) out.push(`${name}: touch targets under 24px and crowded: ${[...small].slice(0, 4).join(', ')}`);
    }
    return out;
  });

async function run() {
  if (!APP) throw new Error('Set UI2_GALLERY_APP to the id or slug of a public app holding every UI 2.0 widget.');
  fs.mkdirSync(OUT, { recursive: true });
  const report = {};
  const runs = PHONE
    ? BROWSERS.filter((b) => b !== 'firefox').flatMap((b) => [375, 414].map((w) => ({ b, mode: 'light', phone: w })))
    : BROWSERS.flatMap((b) => ['light', 'dark'].map((mode) => ({ b, mode })));
  for (const { b, mode, phone } of runs) {
    const key = phone ? `${b} ${phone}px` : `${b} ${mode}`;
    process.stdout.write(`${key}... `);
    const { browser, page, errors, shown } = await openGallery(playwright[b], { mode, phone });
    const problems = [...errors];
    try {
      if (shown < WIDGETS) problems.push(`only ${shown} of ${WIDGETS} widgets on the page`);
      const unavailable = await page.locator('[data-cy="unavailable-widget"]').count();
      if (unavailable) problems.push(`${unavailable} widgets not available`);
      if (phone) {
        problems.push(...(await phoneProblems(page)));
        await page.screenshot({ path: path.join(OUT, `phone-${b}-${phone}.png`), fullPage: true });
      } else {
        problems.push(...(await axe(page)));
        const shots = path.join(OUT, `${b}-${mode}`);
        fs.mkdirSync(shots, { recursive: true });
        for (const [name, trigger] of Object.entries(OVERLAYS)) {
          problems.push(
            ...(await checkOverlay(page, name, trigger, shots).catch((e) => [`${name}: ${e.message.split('\n')[0]}`]))
          );
        }
        problems.push(...(await checkMap(page).catch((e) => [`map1: ${e.message.split('\n')[0]}`])));
      }
    } finally {
      await browser.close();
    }
    report[key] = problems;
    const fresh = problems.filter((p) => !KNOWN.has(p));
    console.log(fresh.length ? `${fresh.length} problems` : 'ok');
    for (const p of fresh) console.log(`  - ${p}`);
  }
  fs.writeFileSync(path.join(OUT, PHONE ? 'phone-report.json' : 'report.json'), JSON.stringify(report, null, 1));
  const failed = Object.values(report).some((list) => list.some((p) => !KNOWN.has(p)));
  process.exit(failed ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(2);
});
