import React from 'react';
import { render, act, cleanup } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import FormSignalContext from '@/AppBuilder/Widgets/Form/FormSignalContext';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './packTestEnv';

installBrowserStubs();

// Every component of every first-party pack under the situations an app puts it in, beyond hostile values
// (packFuzz.spec.jsx): mounted and unmounted again and again (pages, tabs, list rows), its host turning disabled,
// loading and back, a burst of property changes in one frame, and a Form clearing it. It must never crash or loop, and
// must leave nothing running once unmounted: an interval, a timeout still pending, a window or document listener or a
// ResizeObserver a component forgets keeps firing on a page that no longer shows it.
//
//   Opt-in: PACK_STRESS=shadcn,antd,mui · PACK_STRESS_ONLY=Select,Carousel · PACK_STRESS_OUT=<file> writes the report.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const PACK_SOURCES = {
  shadcn: () => require('../../../../../../../packs/shadcn/src/index.ts'),
  antd: () => require('../../../../../../../packs/antd/src/index.ts'),
  mui: () => require('../../../../../../../packs/mui/src/index.ts'),
};
const PACKS_DIR = path.resolve(__dirname, '../../../../../../../packs');
const packs = (process.env.PACK_STRESS || '')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean)
  .filter((pack) => fs.existsSync(path.join(PACKS_DIR, pack, 'dist/manifest.json')));
const only = new Set(
  (process.env.PACK_STRESS_ONLY || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
);

const CYCLES = 20;
const BURST = 200;
const LOOP = /Too many re-renders|Maximum update depth/;

// What a component leaves behind: intervals and timeouts not cleared, window/document listeners not removed,
// ResizeObservers not disconnected. Counted between a mount and its unmount, after pending work has had a turn.
const tracker = () => {
  const intervals = new Set();
  const timeouts = new Set();
  const listeners = new Map();
  const observers = new Set();
  const real = {
    setInterval: window.setInterval,
    clearInterval: window.clearInterval,
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout,
    ResizeObserver: window.ResizeObserver,
  };
  const targets = [window, document];
  const realAdd = targets.map((t) => t.addEventListener);
  const realRemove = targets.map((t) => t.removeEventListener);
  let on = false;
  window.setInterval = (...args) => {
    const id = real.setInterval(...args);
    if (on) intervals.add(id);
    return id;
  };
  window.clearInterval = (id) => {
    intervals.delete(id);
    return real.clearInterval(id);
  };
  // A timeout counts as left behind only while it is still pending: one that fired is done.
  window.setTimeout = (fn, ms, ...rest) => {
    let id;
    const run = (...a) => {
      timeouts.delete(id);
      if (typeof fn === 'function') fn(...a);
    };
    id = real.setTimeout(run, ms, ...rest);
    if (on && (Number(ms) || 0) > 0) timeouts.add(id);
    return id;
  };
  window.clearTimeout = (id) => {
    timeouts.delete(id);
    return real.clearTimeout(id);
  };
  targets.forEach((target, i) => {
    const name = target === window ? 'window' : 'document';
    target.addEventListener = function (type, fn, opts) {
      if (on) {
        const key = `${name}:${type}`;
        if (!listeners.has(key)) listeners.set(key, new Set());
        listeners.get(key).add(fn);
      }
      return realAdd[i].call(this, type, fn, opts);
    };
    target.removeEventListener = function (type, fn, opts) {
      listeners.get(`${name}:${type}`)?.delete(fn);
      return realRemove[i].call(this, type, fn, opts);
    };
  });
  // An observer is released once it watches nothing: by disconnect, or by unobserving each element (Radix's useSize).
  window.ResizeObserver = class {
    constructor(cb) {
      this.inner = new real.ResizeObserver(cb);
      this.watched = new Set();
    }
    observe(el) {
      this.watched.add(el);
      if (on) observers.add(this);
      this.inner.observe(el);
    }
    unobserve(el) {
      this.watched.delete(el);
      if (!this.watched.size) observers.delete(this);
      this.inner.unobserve(el);
    }
    disconnect() {
      this.watched.clear();
      observers.delete(this);
      this.inner.disconnect();
    }
  };
  return {
    start() {
      intervals.clear();
      timeouts.clear();
      listeners.clear();
      observers.clear();
      on = true;
    },
    stop() {
      on = false;
    },
    /** What is left at or above `min`: a count that grew with the mounts. */
    leaks(min) {
      const out = [];
      if (intervals.size >= min) out.push(`${intervals.size} interval(s) not cleared`);
      if (timeouts.size >= min) out.push(`${timeouts.size} timeout(s) still pending`);
      for (const [key, fns] of listeners) if (fns.size >= min) out.push(`${fns.size} ${key} listener(s) not removed`);
      if (observers.size >= min) out.push(`${observers.size} ResizeObserver(s) not disconnected`);
      return out;
    },
    restore() {
      Object.assign(window, real);
      targets.forEach((target, i) => {
        target.addEventListener = realAdd[i];
        target.removeEventListener = realRemove[i];
      });
    },
  };
};

class Boundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    this.props.onError(error);
  }
  render() {
    return this.state.error ? null : this.props.children;
  }
}

if (!packs.length) test.skip('pack stress (set PACK_STRESS=shadcn,antd,mui to run it)', () => {});

// jest's .each throws on an empty table, so with nothing to run only the skipped test above is declared.
(packs.length ? describe.each(packs) : () => () => {})('the %s pack under stress', (pack) => {
  const manifest = JSON.parse(fs.readFileSync(path.join(PACKS_DIR, pack, 'dist/manifest.json'), 'utf8'));
  const source = PACK_SOURCES[pack]();
  const names = Object.keys(manifest.components).filter((name) => !only.size || only.has(name));
  const failures = [];
  let track;
  beforeAll(() => {
    track = tracker();
  });
  afterAll(() => {
    track.restore();
    if (process.env.PACK_STRESS_OUT)
      fs.appendFileSync(process.env.PACK_STRESS_OUT, JSON.stringify({ pack, failures }) + '\n');
  });

  test.each(names)(
    '%s',
    async (name) => {
      const Component = source[name];
      expect(Component).toBeDefined();
      loadLibraryModule.mockResolvedValue({ [name]: Component });
      const entry = manifest.components[name];
      const defaults = Object.fromEntries(
        (entry.props ?? []).filter((p) => p.default !== undefined).map((p) => [p.name, p.default])
      );
      const problems = [];
      const errors = [];
      const consoleError = jest.spyOn(console, 'error').mockImplementation((...args) => {
        const text = args.map(String).join(' ');
        if (LOOP.test(text)) errors.push(text.slice(0, 200));
      });
      const base = makeHost(name, entry);
      const view = (props, hostState = {}, clearCount = 0) => (
        <Boundary onError={(error) => errors.push(String(error?.message ?? error).slice(0, 200))}>
          <FormSignalContext.Provider value={{ clearCount, submitAttemptCount: 0 }}>
            <InlineLibraryComponent
              bundleUrl={`${pack}-${name}.js`}
              cssUrl={`${pack}-${name}.css`}
              cacheKey={`stress-${pack}-${name}`}
              componentName={name}
              componentProps={props}
              componentStyles={{}}
              renderSlot={() => null}
              setExposedVariable={() => {}}
              fireEvent={() => {}}
              actions={new Map()}
              host={{ ...base, ...hostState, formField: true }}
              dataCy="stress"
            />
          </FormSignalContext.Provider>
        </Boundary>
      );
      const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
      const note = (label) => {
        if (errors.length) problems.push(`${label}: ${[...new Set(errors)].join(' | ')}`);
        errors.length = 0;
      };

      // 1. Mount and unmount, again and again; nothing may outlive the unmount. Counted over all the cycles, so a
      // library's one-time setup (React's document selectionchange listener, a shared tooltip listener) is not a leak,
      // while what each mount leaves behind adds up.
      track.start();
      for (let i = 0; i < CYCLES; i++) {
        let r;
        await act(async () => {
          r = render(view(defaults));
          await settle();
        });
        // A cycle that never drew the component would prove nothing about its cleanup.
        const drawn =
          document.querySelector('[data-cy="stress"]')?.shadowRoot?.querySelector('.tj-cc-root')?.childElementCount ??
          0;
        if (!drawn) problems.push(`mount cycle ${i + 1}: drew nothing`);
        await act(async () => {
          r.unmount();
          await settle();
        });
        note(`mount cycle ${i + 1}`);
      }
      track.stop();
      const leaks = track.leaks(CYCLES / 2);
      if (leaks.length) problems.push(`after ${CYCLES} mounts and unmounts: ${leaks.join(', ')}`);

      // 2. The host changing under it: disabled, loading, then both back, then hidden by its parent (unmounted).
      let rendered;
      await act(async () => {
        rendered = render(view(defaults));
        await settle();
      });
      for (const [label, state] of [
        ['disabled', { disabled: true }],
        ['loading', { loading: true }],
        ['disabled and loading', { disabled: true, loading: true }],
        ['enabled again', {}],
      ]) {
        await act(async () => {
          rendered.rerender(view(defaults, state));
          await settle();
        });
        note(`host ${label}`);
      }

      // 3. A burst of property changes in one frame (a query refreshing every binding at once).
      const props = entry.props ?? [];
      await act(async () => {
        for (let i = 0; i < BURST; i++) {
          const prop = props[i % Math.max(1, props.length)];
          const value = i % 2 ? defaults[prop?.name] : i % 3 ? null : '';
          rendered.rerender(view(prop ? { ...defaults, [prop.name]: value } : defaults));
        }
        rendered.rerender(view(defaults));
        await settle();
      });
      note('burst of changes');

      // 4. A Form around it clears, twice (clearForm on a Form that holds it).
      for (const clearCount of [1, 2]) {
        await act(async () => {
          rendered.rerender(view(defaults, {}, clearCount));
          await settle();
        });
        note(`form clear ${clearCount}`);
      }

      consoleError.mockRestore();
      cleanup();
      if (problems.length) failures.push({ component: name, problems });
      expect(problems).toEqual([]);
    },
    300000
  );
});
