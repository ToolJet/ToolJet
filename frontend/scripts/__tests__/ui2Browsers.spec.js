/**
 * The UI 2.0 browser runner (scripts/ui2-browsers.js) reports every page error, including those raised while it runs
 * its checks, and lets a plain-object error through as known only when it is the viewer's LLM preference request.
 * The script runs in a vm with stand-ins for Playwright and the file system: no browser, app or file is touched.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SOURCE = path.join(__dirname, '..', 'ui2-browsers.js');

/** Runs the script once in Chromium, with `events(page)` driving its page; resolves the written report. */
const runScript = (events) =>
  new Promise((resolve, reject) => {
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
      async evaluate(fn) {
        if (typeof fn === 'string') return undefined;
        if (fn.toString().includes('window.axe.run')) {
          events.duringChecks?.(page);
          return [];
        }
        return 75;
      },
      locator: () => ({
        count: async () => 0,
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
    const fakeRequire = (name) =>
      name === 'fs' ? fakeFs : name === 'path' ? path : { chromium: { launch: async () => browser } };
    fakeRequire.resolve = () => '/inert/axe.min.js';
    vm.runInNewContext(fs.readFileSync(SOURCE, 'utf8'), {
      require: fakeRequire,
      __dirname: path.dirname(SOURCE),
      console: { log() {}, error: reject },
      process: {
        env: { UI2_GALLERY_APP: 'inert-fixture', UI2_BROWSERS: 'chromium' },
        argv: [],
        stdout: { write() {} },
        exit: (code) => resolve({ code, report }),
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
});
