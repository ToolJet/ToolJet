// Instruments the jsdom window for the UI 2.0 leak suites: what a widget can leave behind after it unmounts.
//  - window and document listeners: live registrations, keyed as the DOM keys them (type, listener, capture), so a
//    repeated add is one registration; an AbortSignal's abort removes it.
//  - ResizeObserver and IntersectionObserver: counting fakes; an instance still observing a target is live. Like a
//    browser, a ResizeObserver reports each target once after observe() (with the widget's own size), so a chart's
//    ResponsiveContainer draws its chart.
//  - setTimeout and setInterval: every timer scheduled while the probes are on, until it runs or is cleared.
//  - Leaflet: every map made and removed (L.Map's initialize and remove) and every grid (tile) layer added and removed.
// Each probe records where the thing was made, so a failure names the code that leaked it.
import L from 'leaflet';

const OWN_FILE = /__tests__\/leaks\//;
/** The first frames of the current stack outside this suite and jest. */
export const whereFrom = () =>
  (new Error().stack || '')
    .split('\n')
    .slice(2)
    .map((line) => line.trim())
    .filter((line) => !OWN_FILE.test(line) && !/node_modules\/(jest|@jest|expect|jsdom)\//.test(line))
    .slice(0, 6)
    .map((line) => line.replace(/^at /, '').replace(/\(?\/.*?\/frontend\//, '('))
    .join(' < ');

const replace = (target, key, value) => {
  const own = Object.getOwnPropertyDescriptor(target, key);
  Object.defineProperty(target, key, { configurable: true, writable: true, value });
  return () => (own ? Object.defineProperty(target, key, own) : delete target[key]);
};

const captureOf = (options) => (typeof options === 'boolean' ? options : !!options?.capture);

const listenerProbe = (restores) => {
  const live = [];
  for (const [label, target] of [
    ['window', window],
    ['document', document],
  ]) {
    const add = target.addEventListener;
    const remove = target.removeEventListener;
    const find = (type, listener, capture) =>
      live.findIndex((r) => r.target === target && r.type === type && r.listener === listener && r.capture === capture);
    const drop = (type, listener, capture) => {
      const i = find(type, listener, capture);
      if (i >= 0) live.splice(i, 1);
    };
    restores.push(
      replace(target, 'addEventListener', function addEventListener(type, listener, options) {
        const capture = captureOf(options);
        const from = whereFrom();
        // jsdom's selector engine listens for :hover once per document; that is the test DOM, not the page.
        if (listener && find(type, listener, capture) < 0 && !options?.signal?.aborted && !/nwsapi/.test(from)) {
          live.push({ target, label, type, listener, capture, from });
          options?.signal?.addEventListener?.('abort', () => drop(type, listener, capture), { once: true });
        }
        return add.call(this, type, listener, options);
      })
    );
    restores.push(
      replace(target, 'removeEventListener', function removeEventListener(type, listener, options) {
        drop(type, listener, captureOf(options));
        return remove.call(this, type, listener, options);
      })
    );
  }
  return {
    count: () => live.length,
    describe: (list) => list.map((r) => `${r.label} '${r.type}'${r.capture ? ' (capture)' : ''} from ${r.from}`),
    snapshot: () => [...live],
    newSince: (before) => live.filter((r) => !before.includes(r)),
  };
};

const observerProbe = (restores, size) => {
  const all = new Set();
  const fake = (kind, reports) =>
    class {
      constructor(callback) {
        this.kind = kind;
        this.callback = callback;
        this.targets = new Set();
        this.from = whereFrom();
        all.add(this);
      }
      observe(target) {
        this.targets.add(target);
        if (!reports) return;
        const { width, height } = size();
        const box = [{ inlineSize: width, blockSize: height }];
        const contentRect = { x: 0, y: 0, top: 0, left: 0, right: width, bottom: height, width, height };
        queueMicrotask(() => {
          if (this.targets.has(target))
            this.callback([{ target, contentRect, borderBoxSize: box, contentBoxSize: box }], this);
        });
      }
      unobserve(target) {
        this.targets.delete(target);
      }
      disconnect() {
        this.targets.clear();
      }
      takeRecords() {
        return [];
      }
    };
  restores.push(replace(window, 'ResizeObserver', fake('ResizeObserver', true)));
  restores.push(replace(window, 'IntersectionObserver', fake('IntersectionObserver', false)));
  const live = () => [...all].filter((o) => o.targets.size > 0);
  return {
    live,
    count: () => live().length,
    describe: (list) => list.map((o) => `${o.kind} observing ${o.targets.size} node(s), made from ${o.from}`),
  };
};

// Work a cleanup defers to the next tick (Radix's FocusScope returns focus that way) is not left behind; anything
// longer, any interval, and any timer the mounted widget scheduled and its cleanup did not clear, is. settle() lets
// that next-tick work run, so the other probes see what it does, for at most SETTLE_ROUNDS rounds of it (a cleanup
// timer may schedule another); whatever is still scheduled after that is left behind too.
const NEXT_TICK_MS = 16;
const SETTLE_ROUNDS = 3;

const timerProbe = (restores) => {
  const realSetTimeout = window.setTimeout;
  const realClearTimeout = window.clearTimeout;
  const realSetInterval = window.setInterval;
  const realClearInterval = window.clearInterval;
  const pending = new Map();
  const settled = [];
  let cycle = 0;
  let unmounting = false;
  restores.push(
    replace(window, 'setTimeout', function setTimeout(fn, delay, ...args) {
      const id = realSetTimeout.call(
        window,
        (...a) => {
          pending.delete(id);
          if (typeof fn === 'function') fn(...a);
        },
        delay,
        ...args
      );
      pending.set(id, { kind: 'setTimeout', delay: Number(delay) || 0, cycle, unmounting, from: whereFrom() });
      return id;
    })
  );
  restores.push(
    replace(window, 'setInterval', function setInterval(fn, delay, ...args) {
      const id = realSetInterval.call(window, fn, delay, ...args);
      pending.set(id, { kind: 'setInterval', delay: Number(delay) || 0, cycle, unmounting, from: whereFrom() });
      return id;
    })
  );
  restores.push(
    replace(window, 'clearTimeout', function clearTimeout(id) {
      pending.delete(id);
      return realClearTimeout.call(window, id);
    })
  );
  restores.push(
    replace(window, 'clearInterval', function clearInterval(id) {
      pending.delete(id);
      return realClearInterval.call(window, id);
    })
  );
  return {
    /** Starts a cycle: timers scheduled from now on belong to it. */
    begin: () => {
      cycle += 1;
      unmounting = false;
      settled.length = 0;
    },
    /** From now on, timers are scheduled by the unmount (cleanups). */
    unmounting: () => {
      unmounting = true;
    },
    /** Lets the unmount's next-tick timers run; the cycle's other timers are left behind, and are reported and cleared
     *  now, so they do not run in the wait. Call leftovers() after it. */
    settle: async () => {
      const nextTick = (t) => t.unmounting && t.kind === 'setTimeout' && t.delay <= NEXT_TICK_MS;
      for (const [id, t] of pending) {
        if (t.cycle !== cycle || nextTick(t)) continue;
        settled.push(t);
        pending.delete(id);
        if (t.kind === 'setInterval') realClearInterval.call(window, id);
        else realClearTimeout.call(window, id);
      }
      for (let round = 0; round < SETTLE_ROUNDS; round += 1) {
        const waiting = [...pending.values()].filter((t) => t.cycle === cycle && nextTick(t));
        if (!waiting.length) return;
        // Past the longest of them: a timer runs no earlier than its delay, and in order of when it is due.
        const wait = Math.max(...waiting.map((t) => t.delay)) + 1;
        await new Promise((resolve) => realSetTimeout.call(window, resolve, wait));
      }
    },
    /** The cycle's timers left behind: those settle() set aside, and every one of the cycle's still scheduled (a
     *  next-tick timer that did not get to run, or that kept scheduling more). Clears them all. */
    leftovers: () => {
      const left = settled.splice(0);
      for (const [id, t] of pending) {
        if (t.cycle !== cycle) continue;
        left.push(t);
        pending.delete(id);
        if (t.kind === 'setInterval') realClearInterval.call(window, id);
        else realClearTimeout.call(window, id);
      }
      return left;
    },
    realSetTimeout: (fn, ms) => realSetTimeout.call(window, fn, ms),
  };
};

const leafletProbe = (restores) => {
  const maps = new Set();
  const removedMaps = new Set();
  const tiles = new Set();
  const MapProto = L.Map.prototype;
  const GridProto = L.GridLayer.prototype;
  const { initialize, remove } = MapProto;
  const { onAdd, onRemove } = GridProto;
  restores.push(
    replace(MapProto, 'initialize', function initializeMap(...args) {
      maps.add(this);
      return initialize.apply(this, args);
    })
  );
  restores.push(
    replace(MapProto, 'remove', function removeMap(...args) {
      removedMaps.add(this);
      return remove.apply(this, args);
    })
  );
  restores.push(
    replace(GridProto, 'onAdd', function addGrid(...args) {
      tiles.add(this);
      return onAdd.apply(this, args);
    })
  );
  restores.push(
    replace(GridProto, 'onRemove', function removeGrid(...args) {
      tiles.delete(this);
      return onRemove.apply(this, args);
    })
  );
  return {
    made: () => maps.size,
    removed: () => [...maps].filter((m) => removedMaps.has(m)).length,
    liveTiles: () => tiles.size,
  };
};

/** Installs every probe; `size()` gives the box a ResizeObserver reports. Call `restore()` when done. */
export const installProbes = ({ size }) => {
  const restores = [];
  const probes = {
    listeners: listenerProbe(restores),
    observers: observerProbe(restores, size),
    timers: timerProbe(restores),
    leaflet: leafletProbe(restores),
    subscriptions: () => globalThis.__ui2LeakCounts?.subscriptions ?? null,
    bodyChildren: () => document.body.children.length,
    bodyElements: () => document.body.getElementsByTagName('*').length,
    // What a modal overlay changes outside itself: the body's attributes and the style properties a scroll lock or a
    // modal layer sets, and the nodes hidden from assistive tech or made inert while it was open. An emptied attribute
    // counts as absent. padding-right is left out: jsdom keeps it when it is set back to '' (react-bootstrap's scrollbar
    // compensation restores it that way), which a browser does not.
    bodyState: () => {
      const { body } = document;
      const attributes = [...body.attributes]
        .filter((a) => a.name !== 'style' && a.value !== '')
        .map((a) => `${a.name}=${a.value}`)
        .sort();
      const style = ['overflow', 'pointer-events', 'position', 'top', 'touch-action', 'user-select']
        .map((p) => [p, body.style.getPropertyValue(p)])
        .filter(([, v]) => v)
        .map(([p, v]) => `${p}:${v}`);
      const hidden = document.querySelectorAll(
        '[data-aria-hidden], [aria-hidden="true"]:not(#recharts_measurement_span), [inert]'
      );
      return JSON.stringify({ attributes, style, hidden: hidden.length });
    },
    headChildren: () => document.head.children.length,
    restore: () => {
      while (restores.length) restores.pop()();
    },
  };
  return probes;
};
