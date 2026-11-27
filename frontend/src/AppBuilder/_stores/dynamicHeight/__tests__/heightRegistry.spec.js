import { createHeightRegistry } from '../heightRegistry';

// A stand-in for the browser's ResizeObserver: records what is observed and lets
// a test deliver the size reports the browser would send after layout.
class FakeResizeObserver {
  static instances = [];

  constructor(callback) {
    this.callback = callback;
    this.observed = new Map(); // element → options
    this.disconnected = false;
    FakeResizeObserver.instances.push(this);
  }

  observe(element, options) {
    this.observed.set(element, options);
  }

  unobserve(element) {
    this.observed.delete(element);
  }

  disconnect() {
    this.observed.clear();
    this.disconnected = true;
  }

  // Delivers one batch of reports, as the browser does once per frame. Only
  // elements still observed are reported, like the real observer.
  report(sizes) {
    const entries = sizes
      .filter(([element]) => this.observed.has(element))
      .map(([element, height]) => ({ target: element, borderBoxSize: [{ blockSize: height, inlineSize: 100 }] }));
    if (entries.length) this.callback(entries, this);
  }
}

const widget = (key, extra = {}) => ({ key, id: key, contextIndices: null, moduleId: 'canvas', ...extra });

describe('dynamic height: height registry', () => {
  let reports;
  let registry;
  // The registry's current observer: a new one is made once the last widget was let go (REG-017).
  const observer = () => FakeResizeObserver.instances.at(-1);
  const reportSizes = (...sizes) => observer().report(sizes);

  beforeEach(() => {
    FakeResizeObserver.instances = [];
    reports = [];
    registry = createHeightRegistry({
      report: (changes) => reports.push(changes),
      ResizeObserver: FakeResizeObserver,
    });
  });

  it('[DynamicHeight-REG-001] watches every widget with one observer for the whole app', () => {
    const [a, b] = [document.createElement('div'), document.createElement('div')];
    registry.observe(a, widget('a'));
    registry.observe(b, widget('b'));
    expect(FakeResizeObserver.instances).toHaveLength(1);
    expect([...observer().observed.keys()]).toEqual([a, b]);
  });

  it('[DynamicHeight-REG-002] creates no observer until the first widget is watched', () => {
    expect(FakeResizeObserver.instances).toHaveLength(0);
  });

  it('[DynamicHeight-REG-003] watches the border box, the size the widget takes on the canvas', () => {
    const element = document.createElement('div');
    registry.observe(element, widget('a'));
    expect(observer().observed.get(element)).toEqual({ box: 'border-box' });
  });

  it('[DynamicHeight-REG-004] reports a widget height with the widget it belongs to, in one batch per frame', () => {
    const [a, b] = [document.createElement('div'), document.createElement('div')];
    registry.observe(a, widget('a', { layout: 'desktop' }));
    registry.observe(b, widget('b-1', { id: 'b', contextIndices: [1] }));
    reportSizes([a, 120], [b, 64]);
    expect(reports).toEqual([
      [
        { ...widget('a', { layout: 'desktop' }), height: 120 },
        { ...widget('b-1', { id: 'b', contextIndices: [1] }), height: 64 },
      ],
    ]);
  });

  it('[DynamicHeight-REG-005] rounds heights to whole pixels', () => {
    const [a, b] = [document.createElement('div'), document.createElement('div')];
    registry.observe(a, widget('a'));
    registry.observe(b, widget('b'));
    reportSizes([a, 40.4], [b, 40.6]);
    expect(reports[0].map(({ key, height }) => [key, height])).toEqual([
      ['a', 40],
      ['b', 41],
    ]);
  });

  it('[DynamicHeight-REG-006] drops a report when the height did not change', () => {
    const element = document.createElement('div');
    registry.observe(element, widget('a'));
    reportSizes([element, 80]);
    reportSizes([element, 80.2]); // a sub-pixel wobble rounds to the same height
    reportSizes([element, 90]);
    expect(reports.map((batch) => batch.map(({ height }) => height))).toEqual([[80], [90]]);
  });

  it('[DynamicHeight-REG-007] drops 0 and 1 px reports, so a widget keeps its height while it is not drawn', () => {
    // 0: inside a hidden tab, a closed modal or a collapsed accordion. 1: the
    // editor's strip for a hidden widget (a 0 px box with a 1 px border).
    const element = document.createElement('div');
    registry.observe(element, widget('a'));
    reportSizes([element, 80]);
    reportSizes([element, 0]);
    reportSizes([element, 1]);
    reportSizes([element, 80]); // shown again at its last height: nothing to report
    expect(reports.map((batch) => batch.map(({ height }) => height))).toEqual([[80]]);
  });

  it('[DynamicHeight-REG-008] ignores a frozen widget until it is unfrozen', () => {
    // A widget showing a loading state is frozen so it keeps its last height.
    const element = document.createElement('div');
    registry.observe(element, widget('a'));
    reportSizes([element, 300]);
    registry.setFrozen('a', true);
    reportSizes([element, 40]);
    registry.setFrozen('a', false);
    reportSizes([element, 320]);
    expect(reports.map((batch) => batch.map(({ height }) => height))).toEqual([[300], [320]]);
  });

  it('[DynamicHeight-REG-009] stops reporting a widget once it is no longer watched, and forgets its height', () => {
    const element = document.createElement('div');
    registry.observe(element, widget('a'));
    reportSizes([element, 80]);
    registry.unobserve(element);
    expect(observer().observed.has(element)).toBe(false);
    reportSizes([element, 90]);
    // Watched again (remounted): its first height is reported even if it matches the old one.
    registry.observe(element, widget('a'));
    reportSizes([element, 80]);
    expect(reports.map((batch) => batch.map(({ height }) => height))).toEqual([[80], [80]]);
  });

  it('[DynamicHeight-REG-010] ignores reports for elements it does not know', () => {
    const element = document.createElement('div');
    registry.observe(element, widget('a'));
    observer().callback([{ target: document.createElement('div'), borderBoxSize: [{ blockSize: 50 }] }]);
    expect(reports).toEqual([]);
  });

  it('[DynamicHeight-REG-011] knows which watched widgets have not been measured yet', () => {
    // The scheduler waits a few frames for these, so a container that just
    // mounted is sized once from real heights instead of from defaults first.
    const [a, b] = [document.createElement('div'), document.createElement('div')];
    registry.observe(a, widget('a'));
    registry.observe(b, widget('b'));
    expect(registry.isAwaitingMeasurement()).toBe(true);
    reportSizes([a, 0]); // any report counts, even one that is dropped
    expect(registry.isAwaitingMeasurement()).toBe(true);
    registry.unobserve(b); // unmounted before it was measured
    expect(registry.isAwaitingMeasurement()).toBe(false);
  });

  it('[DynamicHeight-REG-012] can stop waiting for widgets that never get a size', () => {
    registry.observe(document.createElement('div'), widget('a'));
    registry.forgetAwaitedMeasurements();
    expect(registry.isAwaitingMeasurement()).toBe(false);
  });

  it('[DynamicHeight-REG-014] reads the drawn height where a report carries no border box size', () => {
    // Browsers before borderBoxSize (Safari 15.3 and older) send only the target.
    const element = document.createElement('div');
    Object.defineProperty(element, 'offsetHeight', { value: 72 });
    registry.observe(element, widget('a'));
    observer().callback([{ target: element }]);
    expect(reports).toEqual([[{ ...widget('a'), height: 72 }]]);
  });

  it('[DynamicHeight-REG-013] does nothing where the browser has no ResizeObserver', () => {
    const bare = createHeightRegistry({ report: (changes) => reports.push(changes), ResizeObserver: undefined });
    const element = document.createElement('div');
    expect(() => bare.observe(element, widget('a'))).not.toThrow();
    expect(bare.isAwaitingMeasurement()).toBe(false); // nothing will ever report, so nothing is awaited
    expect(() => bare.unobserve(element)).not.toThrow();
  });

  it('[DynamicHeight-REG-015] remembers the last height of each watched widget, until it is unobserved', () => {
    // The browser reports only changes, so a pass that has lost its rendered layouts (a layout switch clears them)
    // gets the widgets' heights from here.
    const [a, b] = [document.createElement('div'), document.createElement('div')];
    registry.observe(a, widget('a', { contextIndices: [1] }));
    registry.observe(b, widget('b'));
    reportSizes([a, 100], [b, 50]);
    reportSizes([a, 120]);
    // Not drawn, and frozen: the last real height is kept.
    reportSizes([b, 0]);
    registry.setFrozen('a', true);
    reportSizes([a, 300]);
    expect([...registry.measuredHeights()]).toEqual([
      { ...widget('a', { contextIndices: [1] }), height: 120 },
      { ...widget('b'), height: 50 },
    ]);

    registry.unobserve(a);
    expect([...registry.measuredHeights()]).toEqual([{ ...widget('b'), height: 50 }]);
  });

  it('[DynamicHeight-REG-016] takes the ResizeObserver the page has when it first watches a widget', () => {
    // A registry made before a ResizeObserver exists (the store is created when the app loads; a polyfill or a test
    // may install one later) still watches widgets once there is one.
    const original = globalThis.ResizeObserver;
    try {
      delete globalThis.ResizeObserver;
      const late = createHeightRegistry({ report: (changes) => reports.push(changes) });
      globalThis.ResizeObserver = FakeResizeObserver;
      late.observe(document.createElement('div'), widget('a'));
      expect(FakeResizeObserver.instances).toHaveLength(1);
    } finally {
      globalThis.ResizeObserver = original;
    }
  });

  it('[DynamicHeight-REG-017] lets its observer go once it watches no widget, and makes a new one for the next', () => {
    const [a, b] = [document.createElement('div'), document.createElement('div')];
    registry.observe(a, widget('a'));
    registry.observe(b, widget('b'));
    registry.unobserve(a);
    expect(observer().disconnected).toBe(false);
    registry.unobserve(b);
    expect(observer().disconnected).toBe(true);

    registry.observe(a, widget('a'));
    expect(FakeResizeObserver.instances).toHaveLength(2);
    expect([...FakeResizeObserver.instances[1].observed.keys()]).toEqual([a]);
  });

  it('[DynamicHeight-REG-018] counts a widget watched twice once, so letting it go lets the observer go', () => {
    const element = document.createElement('div');
    registry.observe(element, widget('a'));
    registry.observe(element, widget('a'));
    registry.unobserve(element);
    expect(observer().disconnected).toBe(true);
  });
});
