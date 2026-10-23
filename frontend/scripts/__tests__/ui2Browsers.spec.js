/**
 * The UI 2.0 browser runner (scripts/ui2-browsers.js) reports every page error, including those raised while it runs
 * its checks, and lets a plain-object error through as known only when it is the viewer's LLM preference request.
 * The script runs in a vm with stand-ins for Playwright, the file system and the widget registry: no browser, app or
 * file is touched.
 *
 * Release audit 016 (BROWSER-RELEASE-GATE-BLIND-SPOTS-016c13d): the gate passed with nothing tested (--phone with
 * only Firefox selected planned no runs and exited 0), counted widget boxes rather than the widgets (75 boxes with a
 * duplicate standing in for a missing widget, or one crashed into its error fallback, passed), and once the LLM
 * preference failed, let every plain-object page error through. RPT-003 to RPT-007 cover them.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SOURCE = path.join(__dirname, '..', 'ui2-browsers.js');

// The registry the stand-in serves: three widgets, so a gallery of select1, map1 and dialog1.
const REGISTRY = ['ShadSelect', 'ShadMap', 'ShadDialog'];
const GALLERY = ['select1', 'map1', 'dialog1'];

/** Runs the script once (Chromium unless `env` says otherwise), with `events` driving its page: onLoad and
 *  duringChecks raise errors, inventory(names) gives how many of each gallery widget are on the page (one each by
 *  default), and fallbacks the number of crashed widgets. Resolves the exit code and the written report. */
const runScript = (events, { env = {}, argv = [] } = {}) =>
  new Promise((resolve) => {
    let report = null;
    const page = {
      handlers: {},
      on(kind, fn) {
        this.handlers[kind] = fn;
      },
      error(e) {
        this.handlers.pageerror?.(e);
      },
      console(text) {
        this.handlers.console?.({ type: () => 'error', text: () => text });
      },
      async goto() {
        events.onLoad?.(page);
      },
      async evaluate(fn, arg) {
        if (typeof fn === 'string') return undefined;
        if (fn.toString().includes('window.axe.run')) {
          events.duringChecks?.(page);
          return [];
        }
        if (Array.isArray(arg)) return events.inventory?.(arg) ?? arg.map(() => 1);
        return []; // the phone checks find nothing
      },
      locator: (selector) => ({
        count: async () => (selector.includes('error-boundary-fallback') ? events.fallbacks ?? 0 : 0),
        first() {
          return this;
        },
      }),
      screenshot: async () => {},
      mouse: { move: async () => {} },
      keyboard: { press: async () => {} },
    };
    const browser = {
      newContext: async () => ({ addInitScript: async () => {}, newPage: async () => page }),
      close: async () => {},
    };
    const fakeFs = {
      readFileSync: () => '',
      mkdirSync: () => {},
      writeFileSync: (_path, data) => {
        report = JSON.parse(data);
      },
    };
    let launched = 0;
    const launcher = { launch: async () => (launched++, browser) };
    const fakeRequire = (name) => {
      if (name === 'fs') return fakeFs;
      if (name === 'path') return path;
      if (name.endsWith('/widgets/shadcn')) return { shadcnConfigs: REGISTRY.map((n) => ({ name: n })) };
      if (name.endsWith('ui2-require-hook')) return {};
      return { chromium: launcher, webkit: launcher, firefox: launcher };
    };
    fakeRequire.resolve = () => '/inert/axe.min.js';
    vm.runInNewContext(fs.readFileSync(SOURCE, 'utf8'), {
      require: fakeRequire,
      __dirname: path.dirname(SOURCE),
      console: { log() {}, error: (e) => resolve({ code: 'error', error: e, report, launched }) },
      process: {
        env: { UI2_GALLERY_APP: 'inert-fixture', UI2_BROWSERS: 'chromium', ...env },
        argv,
        stdout: { write() {} },
        exit: (code) => resolve({ code, report, launched }),
      },
      setTimeout: (fn) => {
        queueMicrotask(fn);
        return 1;
      },
    });
  });

const problemsIn = (report) => Object.values(report).flat();

describe('the UI 2.0 browser runner', () => {
  test('[Ui2Browsers-RPT-001] reports a page error raised during its checks, not only during the page load', async () => {
    const { code, report } = await runScript({
      onLoad: (page) => page.error(new Error('early-render-error')),
      duringChecks: (page) => page.error(new Error('late-interaction-error')),
    });
    const all = problemsIn(report);
    expect(all.filter((p) => p.includes('early-render-error'))).toHaveLength(2); // light and dark
    expect(all.filter((p) => p.includes('late-interaction-error'))).toHaveLength(2);
    expect(code).toBe(1);
  });

  test('[Ui2Browsers-RPT-002] a plain-object page error is known only beside the LLM preference failure', async () => {
    const unexplained = problemsIn((await runScript({ onLoad: (page) => page.error({ message: 'Object' }) })).report);
    expect(unexplained).toContain('page error: a plain object');

    const explained = problemsIn(
      (
        await runScript({
          onLoad: (page) => {
            page.console('aiSlice.js (1383:10) Failed to fetch LLM preference: {error: Unauthorized, statusCode: 401}');
            page.error({ message: 'Object' });
          },
        })
      ).report
    );
    expect(explained).toContain('page error: a plain object, after the viewer failed to fetch the LLM preference');
    expect(explained).not.toContain('page error: a plain object');
  });

  test('[Ui2Browsers-RPT-003] a selection that leaves nothing to run fails, it does not pass untested', async () => {
    const result = await runScript({}, { env: { UI2_BROWSERS: 'firefox' }, argv: ['--phone'] });
    expect(result.code).not.toBe(0);
    expect(String(result.error)).toMatch(/Nothing to run/);
    expect(result.launched).toBe(0);

    const unknown = await runScript({}, { env: { UI2_BROWSERS: 'chrome' } });
    expect(String(unknown.error)).toMatch(/Unknown browser in UI2_BROWSERS: chrome/);
  });

  test('[Ui2Browsers-RPT-004] every registered widget is on the page, each once by its gallery name', async () => {
    // The stand-in page has no overlays or map to press, so only the inventory lines are looked at.
    const inventoryLines = (report) =>
      problemsIn(report).filter((p) => /widgets not on the page|more than once/.test(p));
    expect(inventoryLines((await runScript({})).report)).toEqual([]);

    // As many boxes as widgets, but select1 twice and map1 missing.
    const swapped = await runScript({ inventory: (names) => names.map((n) => ({ select1: 2, map1: 0 }[n] ?? 1)) });
    expect(inventoryLines(swapped.report)).toEqual([
      '1 of 3 widgets not on the page: map1',
      'widgets on the page more than once: select1 (2)',
      '1 of 3 widgets not on the page: map1',
      'widgets on the page more than once: select1 (2)',
    ]);
    expect(swapped.code).toBe(1);
    expect(GALLERY).toHaveLength(REGISTRY.length);
  });

  test('[Ui2Browsers-RPT-005] a widget that crashed into its error fallback fails the page', async () => {
    const { code, report } = await runScript({ fallbacks: 1 });
    expect(problemsIn(report)).toContain('1 widgets crashed into their error fallback');
    expect(code).toBe(1);
  });

  test('[Ui2Browsers-RPT-006] one LLM preference failure explains one plain-object error, not every one', async () => {
    const { code, report } = await runScript({
      onLoad: (page) => {
        page.console('aiSlice.js (1383:10) Failed to fetch LLM preference: {error: Unauthorized, statusCode: 401}');
        page.error({ message: '[object Object]' });
        page.error({ message: 'Object { syntheticUnexpected: true }' });
      },
    });
    const all = problemsIn(report);
    expect(all.filter((p) => p === 'page error: a plain object')).toHaveLength(2); // light and dark
    expect(code).toBe(1);
  });

  test('[Ui2Browsers-RPT-007] a run per planned browser and mode, or the gate fails', async () => {
    const { report, launched } = await runScript({}, { env: { UI2_BROWSERS: 'chromium,webkit' } });
    expect(Object.keys(report)).toEqual(['chromium light', 'chromium dark', 'webkit light', 'webkit dark']);
    expect(launched).toBe(4);
    const phone = await runScript({}, { env: { UI2_BROWSERS: 'firefox,webkit' }, argv: ['--phone'] });
    expect(Object.keys(phone.report)).toEqual(['webkit 375px', 'webkit 414px']);
  });
});
