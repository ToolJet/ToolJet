/**
 * The dynamic height scheduler: collects height changes (from widgets, from the height registry, from saved-layout
 * edits) and runs the engine once per browser frame.
 *
 * Runs on the real composed store and the real engine. Only the browser is faked: its animation frames (each spec
 * runs them one at a time with `nextFrame`), its ResizeObserver, and the drawn width of a box.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, binding } from '@/test/app-builder';
import { createDynamicHeightScheduler, readWrapperWidth } from '../../scheduler';
import { bootModule, uuid, widget } from './dynamicHeightPage';

const s = () => useStore.getState();
const temps = () => s().temporaryLayouts;

const DH = { dynamicHeight: binding('{{true}}') };
const LIST = uuid(1);
const FLEX = uuid(6);
const INSTANCE = uuid(50);

// The browser's animation frames, run by hand: `nextFrame` runs every callback asked for before it.
const createFrames = () => {
  const callbacks = [];
  return {
    request: jest.fn((callback) => callbacks.push(callback)),
    next: () => callbacks.splice(0).forEach((callback) => callback()),
    pending: () => callbacks.length,
  };
};

// The browser's ResizeObserver (as in heightRegistry.spec.js): `report` delivers one frame's size reports.
class FakeResizeObserver {
  static instance = null;

  constructor(callback) {
    this.callback = callback;
    FakeResizeObserver.instance = this;
  }

  observe() {}

  unobserve() {}

  report(sizes) {
    this.callback(sizes.map(([target, blockSize]) => ({ target, borderBoxSize: [{ blockSize }] })));
  }
}
const reportSizes = (...sizes) => FakeResizeObserver.instance.report(sizes);

// `a` grows; `b` sits 20 under it; `c` is beside them (columns 20 on) and grows on its own.
const page = () => ({
  a: widget('a', 'Text', { top: 0, properties: DH }),
  b: widget('b', 'Text', { top: 60 }),
  c: widget('c', 'Text', { top: 0, left: 20, properties: DH }),
});

// How many times the store's rendered layouts were written: the engine writes once per pass.
const countWrites = () => {
  const writes = { count: 0 };
  writes.stop = useStore.subscribe((state, previous) => {
    if (state.temporaryLayouts !== previous.temporaryLayouts) writes.count += 1;
  });
  return writes;
};

const inProduction = (run) => {
  const environment = process.env.NODE_ENV;
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    process.env.NODE_ENV = 'production';
    run();
  } finally {
    process.env.NODE_ENV = environment;
    log.mockRestore();
  }
};

describe('dynamic height scheduler', () => {
  let frames;
  let scheduler;
  const create = (options) =>
    createDynamicHeightScheduler({
      getState: useStore.getState,
      requestFrame: frames.request,
      ResizeObserver: FakeResizeObserver,
      ...options,
    });

  beforeEach(() => {
    frames = createFrames();
    FakeResizeObserver.instance = null;
    scheduler = create();
  });

  describe('one pass per frame', () => {
    it('[DynamicHeight-SCHED-001] runs nothing until the next frame, then everything asked for in one pass', () => {
      seedApp(page());
      const writes = countWrites();
      scheduler.scheduleDynamicHeight({ id: 'a', height: 100 });
      scheduler.scheduleDynamicHeight({ id: 'c', height: 70 });
      expect(temps()).toEqual({});
      expect(frames.request).toHaveBeenCalledTimes(1);

      frames.next();
      expect(temps()).toEqual({ a: { top: 0, height: 100 }, b: { top: 120, height: 40 }, c: { top: 0, height: 70 } });
      expect(writes.count).toBe(1);
      expect(frames.pending()).toBe(0);
      writes.stop();
    });

    it('[DynamicHeight-SCHED-002] solves a widget asked about twice in a frame with its latest height', () => {
      seedApp(page());
      scheduler.scheduleDynamicHeight({ id: 'a', height: 100 });
      scheduler.scheduleDynamicHeight({ id: 'a', height: 150 });
      // Asked about again without a height (its visibility changed, say): the height measured last still holds.
      scheduler.scheduleDynamicHeight({ id: 'a' });
      frames.next();
      expect(temps()).toEqual({ a: { top: 0, height: 150 }, b: { top: 170, height: 40 } });
    });

    it('[DynamicHeight-SCHED-003] keeps the same widget apart in each row of a list', () => {
      // Each row draws its own box of the widget: one row's height does not overwrite another's.
      seedApp({
        [LIST]: widget(LIST, 'Listview', {
          top: 0,
          height: 218,
          properties: {
            ...DH,
            dataSourceSelector: binding('rawJson'),
            data: binding('{{[{ "n": 0 }, { "n": 1 }]}}'),
            rowHeight: binding('{{100}}'),
          },
        }),
        rowText: widget('rowText', 'Text', { parent: LIST, top: 0, properties: DH }),
      });
      scheduler.scheduleDynamicHeight({ id: 'rowText', contextIndices: [0], height: 150 });
      scheduler.scheduleDynamicHeight({ id: 'rowText', contextIndices: [1], height: 200 });
      frames.next();
      expect(temps()['rowText-0']).toEqual({ top: 0, height: 150 });
      expect(temps()['rowText-1']).toEqual({ top: 0, height: 200 });
    });

    it('[DynamicHeight-SCHED-020] keeps the same widget apart in each module instance', () => {
      // A module used on the page shares its component ids with the main canvas's, not its boxes.
      seedApp(page());
      bootModule(INSTANCE);
      seedApp(page(), { moduleId: INSTANCE });
      scheduler.scheduleDynamicHeight({ id: 'a', height: 100 });
      scheduler.scheduleDynamicHeight({ id: 'a', moduleId: INSTANCE, height: 150 });
      frames.next();
      expect(temps().b).toEqual({ top: 120, height: 40 });
      expect(temps()[`${INSTANCE}::b`]).toEqual({ top: 170, height: 40 });
    });

    it('[DynamicHeight-SCHED-004] runs what is pending at once when flushed, and the frame then has nothing to do', () => {
      seedApp(page());
      const writes = countWrites();
      scheduler.scheduleDynamicHeight({ id: 'a', height: 100 });
      scheduler.flush();
      expect(temps().b).toEqual({ top: 120, height: 40 });
      frames.next();
      expect(writes.count).toBe(1);
      writes.stop();
    });
  });

  describe('heights the browser measured', () => {
    it('[DynamicHeight-SCHED-005] solves the heights the registry reports on the next frame', () => {
      seedApp(page());
      const element = document.createElement('div');
      scheduler.observe(element, { key: 'a', id: 'a', contextIndices: null, moduleId: 'canvas' });
      reportSizes([element, 100]);
      expect(temps()).toEqual({});
      frames.next();
      expect(temps()).toEqual({ a: { top: 0, height: 100 }, b: { top: 120, height: 40 } });
    });

    it('[DynamicHeight-SCHED-006] waits for a widget that just started being watched to report its first size', () => {
      // A container that just mounted is sized once, from its children's real heights.
      seedApp(page());
      const [a, c] = [document.createElement('div'), document.createElement('div')];
      scheduler.observe(a, { key: 'a', id: 'a', contextIndices: null, moduleId: 'canvas' });
      scheduler.observe(c, { key: 'c', id: 'c', contextIndices: null, moduleId: 'canvas' });
      reportSizes([a, 100]);
      frames.next();
      expect(temps()).toEqual({});

      reportSizes([c, 70]);
      frames.next();
      expect(temps()).toEqual({ a: { top: 0, height: 100 }, b: { top: 120, height: 40 }, c: { top: 0, height: 70 } });
    });

    it('[DynamicHeight-SCHED-007] stops waiting after three frames, and does not wait for that widget again', () => {
      seedApp(page());
      const [a, lost] = [document.createElement('div'), document.createElement('div')];
      scheduler.observe(a, { key: 'a', id: 'a', contextIndices: null, moduleId: 'canvas' });
      scheduler.observe(lost, { key: 'c', id: 'c', contextIndices: null, moduleId: 'canvas' });
      reportSizes([a, 100]);
      frames.next();
      frames.next();
      frames.next();
      expect(temps()).toEqual({});
      frames.next();
      expect(temps().b).toEqual({ top: 120, height: 40 });

      scheduler.scheduleDynamicHeight({ id: 'a', height: 150 });
      frames.next();
      expect(temps().b).toEqual({ top: 170, height: 40 });
    });

    it('[DynamicHeight-SCHED-021] waits again, the same three frames, for a widget watched later', () => {
      seedApp(page());
      const [a, lost, c] = ['a', 'lost', 'c'].map(() => document.createElement('div'));
      scheduler.observe(a, { key: 'a', id: 'a', contextIndices: null, moduleId: 'canvas' });
      scheduler.observe(lost, { key: 'lost', id: 'lost', contextIndices: null, moduleId: 'canvas' });
      reportSizes([a, 100]);
      [1, 2, 3, 4].forEach(() => frames.next());
      expect(temps().b).toEqual({ top: 120, height: 40 });

      scheduler.observe(c, { key: 'c', id: 'c', contextIndices: null, moduleId: 'canvas' });
      scheduler.scheduleDynamicHeight({ id: 'a', height: 150 });
      frames.next();
      expect(temps().b).toEqual({ top: 120, height: 40 });
      reportSizes([c, 70]);
      frames.next();
      expect(temps().b).toEqual({ top: 170, height: 40 });
    });
  });

  describe('a whole module solved again', () => {
    it('[DynamicHeight-SCHED-008] places every widget of the module again on the next frame', () => {
      seedApp(page());
      s().setTemporaryLayouts({ a: { top: 0, height: 100 } });
      scheduler.scheduleFullSolve('canvas');
      expect(temps().b).toBeUndefined();
      frames.next();
      expect(temps().b).toEqual({ top: 120, height: 40 });
    });

    it('[DynamicHeight-SCHED-009] solves the module again once when the builder moves a widget', () => {
      seedApp(page());
      scheduler.scheduleDynamicHeight({ id: 'a', height: 100 });
      frames.next();
      const stop = useStore.subscribe(scheduler.watchSavedLayouts);
      const writes = countWrites();

      // `b` is moved 40px down: it is still pushed by the grown `a`, from its new place.
      s().setComponentLayout({ b: { top: 100, left: 0, width: 10, height: 40 } }, undefined, 'canvas', {
        skipUndoRedo: true,
        saveAfterAction: false,
      });
      expect(frames.request).toHaveBeenCalledTimes(2);
      frames.next();
      expect(temps().b).toEqual({ top: 160, height: 40 });
      expect(writes.count).toBe(1);
      stop();
      writes.stop();
    });

    it('[DynamicHeight-SCHED-010] asks for nothing when the store changes something other than a saved layout', () => {
      seedApp(page());
      const stop = useStore.subscribe(scheduler.watchSavedLayouts);
      s().setTemporaryLayouts({ a: { top: 0, height: 100 } });
      s().setSelectedComponents(['a']);
      s().setExposedValue('a', 'text', 'Hello');
      expect(frames.request).not.toHaveBeenCalled();
      stop();
    });

    it('[DynamicHeight-SCHED-011] solves every module again when the builder switches to the mobile layout', () => {
      // `b` is 20 under `a` on desktop, 160 under it on mobile. `a` is 100 high in both.
      seedApp({
        a: widget('a', 'Text', { top: 0, properties: DH, mobile: { top: 0, left: 0, width: 10, height: 40 } }),
        b: widget('b', 'Text', { top: 60, mobile: { top: 200, left: 0, width: 10, height: 40 } }),
      });
      const element = document.createElement('div');
      scheduler.observe(element, { key: 'a', id: 'a', contextIndices: null, moduleId: 'canvas' });
      reportSizes([element, 100]);
      frames.next();
      expect(temps().b).toEqual({ top: 120, height: 40 });

      // The switch clears the rendered layouts, and `a` does not report again: its height did not change.
      const stop = useStore.subscribe(scheduler.watchSavedLayouts);
      s().setCurrentLayout('mobile');
      frames.next();
      expect(temps().b).toEqual({ top: 260, height: 40 });
      stop();
    });

    it('[DynamicHeight-SCHED-019] places everything again, at the heights last measured, when the rendered layouts are cleared', () => {
      // Switching page, or changing which components show on mobile, clears them too.
      seedApp(page());
      const element = document.createElement('div');
      scheduler.observe(element, { key: 'a', id: 'a', contextIndices: null, moduleId: 'canvas' });
      reportSizes([element, 100]);
      frames.next();

      const stop = useStore.subscribe(scheduler.watchSavedLayouts);
      s().clearTemporaryLayouts();
      frames.next();
      expect(temps()).toEqual({ a: { top: 0, height: 100 }, b: { top: 120, height: 40 } });
      stop();
    });

    it('[DynamicHeight-SCHED-022] keeps the height last measured for a widget asked about without one in that frame', () => {
      // Its visibility changed, say, in the same frame the rendered layouts were cleared.
      seedApp(page());
      const element = document.createElement('div');
      scheduler.observe(element, { key: 'a', id: 'a', contextIndices: null, moduleId: 'canvas' });
      reportSizes([element, 100]);
      frames.next();

      const stop = useStore.subscribe(scheduler.watchSavedLayouts);
      s().clearTemporaryLayouts();
      scheduler.scheduleDynamicHeight({ id: 'a' });
      frames.next();
      expect(temps()).toEqual({ a: { top: 0, height: 100 }, b: { top: 120, height: 40 } });
      stop();
    });

    it('[DynamicHeight-SCHED-024] places a widget at the height given in that frame over the one measured before', () => {
      seedApp(page());
      const element = document.createElement('div');
      scheduler.observe(element, { key: 'a', id: 'a', contextIndices: null, moduleId: 'canvas' });
      reportSizes([element, 100]);
      frames.next();

      scheduler.scheduleFullSolve('canvas');
      scheduler.scheduleDynamicHeight({ id: 'a', height: 150 });
      frames.next();
      expect(temps().b).toEqual({ top: 170, height: 40 });
    });

    it('[DynamicHeight-SCHED-023] solves every module again on a layout switch, even when nothing had grown', () => {
      // `a` is measured at its desktop height, so nothing is written there; on mobile it is drawn 20 high and grows.
      seedApp({
        a: widget('a', 'Text', { top: 0, properties: DH, mobile: { top: 0, left: 0, width: 10, height: 20 } }),
        b: widget('b', 'Text', { top: 60, mobile: { top: 40, left: 0, width: 10, height: 40 } }),
      });
      const element = document.createElement('div');
      scheduler.observe(element, { key: 'a', id: 'a', contextIndices: null, moduleId: 'canvas' });
      reportSizes([element, 40]);
      frames.next();
      expect(temps().b).toBeUndefined();

      const stop = useStore.subscribe(scheduler.watchSavedLayouts);
      s().setCurrentLayout('mobile');
      frames.next();
      expect(temps().b).toEqual({ top: 60, height: 40 });
      stop();
    });

    it('[DynamicHeight-SCHED-012] solves a module again when another of its pages is shown', () => {
      seedApp(page());
      s().setPages(
        [
          { id: 'page-1', handle: 'home', name: 'Home', components: page() },
          { id: 'page-2', handle: 'other', name: 'Other', components: { b: widget('b', 'Text', { top: 300 }) } },
        ],
        'canvas'
      );
      const stop = useStore.subscribe(scheduler.watchSavedLayouts);
      s().setTemporaryLayouts({ b: { top: 120, height: 40 } });
      s().setCurrentPageId('page-2', 'canvas');
      frames.next();
      expect(temps().b).toEqual({ top: 300, height: 40 });
      stop();
    });
  });

  describe('modules being edited (until dynamic height runs in the editor, Phase C)', () => {
    it('[DynamicHeight-SCHED-025] leaves a module alone while it is edited', () => {
      seedApp(page());
      s().setCurrentMode('edit', 'canvas');
      const stop = useStore.subscribe(scheduler.watchSavedLayouts);
      s().setComponentLayout({ b: { top: 100, left: 0, width: 10, height: 40 } }, undefined, 'canvas', {
        skipUndoRedo: true,
        saveAfterAction: false,
      });
      s().setTemporaryLayouts({ a: { top: 0, height: 100 } });
      s().clearTemporaryLayouts();
      expect(frames.request).not.toHaveBeenCalled();
      stop();
    });

    it('[DynamicHeight-SCHED-026] places a module whole when it is shown in the viewer (preview)', () => {
      seedApp(page());
      s().setCurrentMode('edit', 'canvas');
      s().setTemporaryLayouts({ a: { top: 0, height: 100 } });
      const stop = useStore.subscribe(scheduler.watchSavedLayouts);

      s().setCurrentMode('view', 'canvas');
      expect(frames.request).toHaveBeenCalledTimes(1);
      frames.next();
      expect(temps().b).toEqual({ top: 120, height: 40 });
      stop();
    });
  });

  describe('a pass that fails', () => {
    // A FlexContainer whose width cannot be read: sizing it throws, whether it is asked about or its module is
    // placed whole (its canvas holds a widget, so its height is worked out again).
    const failingPage = () => ({
      ...page(),
      [FLEX]: widget(FLEX, 'FlexContainer', {
        top: 300,
        properties: { ...DH, direction: binding('row'), flexWrap: binding('{{true}}') },
      }),
      inFlex: widget('inFlex', 'Text', { parent: FLEX, top: 0 }),
    });
    const failure = new Error('width not readable');
    const unreadableWidth = () => {
      throw failure;
    };

    it('[DynamicHeight-SCHED-013] throws from its frame outside production, and the next frame still runs', () => {
      seedApp(failingPage());
      scheduler = create({ measureWidth: unreadableWidth });
      scheduler.scheduleDynamicHeight({ id: FLEX });
      expect(() => frames.next()).toThrow(failure);

      scheduler.scheduleDynamicHeight({ id: 'a', height: 100 });
      frames.next();
      expect(temps().b).toEqual({ top: 120, height: 40 });
    });

    it('[DynamicHeight-SCHED-014] in production, solves the failing module again once, not on every frame', () => {
      seedApp(failingPage());
      scheduler = create({ measureWidth: unreadableWidth });
      inProduction(() => {
        scheduler.scheduleDynamicHeight({ id: FLEX });
        frames.next();
        // Solved again on the next frame, and it fails again: no third try.
        expect(frames.pending()).toBe(1);
        frames.next();
        expect(frames.pending()).toBe(0);
      });
    });

    it('[DynamicHeight-SCHED-015] tries a module again once more after one of its passes worked', () => {
      seedApp(failingPage());
      let readable = false;
      scheduler = create({ measureWidth: () => (readable ? 1288 : unreadableWidth()) });
      inProduction(() => {
        scheduler.scheduleDynamicHeight({ id: FLEX });
        frames.next();
        frames.next();
        readable = true;
        scheduler.scheduleDynamicHeight({ id: FLEX });
        frames.next();
        readable = false;
        scheduler.scheduleDynamicHeight({ id: FLEX });
        frames.next();
        expect(frames.pending()).toBe(1);
      });
    });
  });

  describe('the drawn width of a FlexContainer', () => {
    // Three 600px cards in a wrapping row, 12px padding, 8px gap: at 1288 wide two fit on a line (ENGINE-025).
    const flexPage = () => ({
      [FLEX]: widget(FLEX, 'FlexContainer', {
        top: 0,
        properties: {
          ...DH,
          layoutVersion: binding('2'),
          padding: binding('12'),
          gap: binding('8'),
          direction: binding('row'),
          flexWrap: binding('{{true}}'),
        },
      }),
      ...Object.fromEntries(
        ['c1', 'c2', 'c3'].map((id) => [
          id,
          widget(id, 'Text', { parent: FLEX, top: 0, height: 50, layout: { widthPx: 600, fillWidth: false } }),
        ])
      ),
    });
    const drawBox = (className, width, attributes = {}) => {
      const box = document.createElement('div');
      box.className = className;
      box.setAttribute('data-layout-context', attributes.context ?? 'root');
      box.setAttribute('data-module-id', attributes.moduleId ?? 'canvas');
      Object.defineProperty(box, 'clientWidth', { value: width });
      document.body.appendChild(box);
      return box;
    };

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('[DynamicHeight-SCHED-016] wraps a flex row at the width its box is drawn at', () => {
      seedApp(flexPage());
      drawBox(`ele-${FLEX}`, 1288);
      scheduler.scheduleDynamicHeight({ id: FLEX });
      frames.next();
      expect(temps()[FLEX]).toEqual({ top: 0, height: 50 + 8 + 50 + 30 });
    });

    it('[DynamicHeight-SCHED-017] reads the box of that widget in that row and module only', () => {
      drawBox(`ele-${FLEX}`, 1288);
      drawBox(`ele-${FLEX}`, 900, { context: '1' });
      drawBox(`ele-${FLEX}`, 700, { moduleId: uuid(50) });
      expect(readWrapperWidth(FLEX, null, 'canvas')).toBe(1288);
      expect(readWrapperWidth(FLEX, [1], 'canvas')).toBe(900);
      expect(readWrapperWidth(FLEX, null, uuid(50))).toBe(700);
    });

    it('[DynamicHeight-SCHED-018] knows no width for a box that is not drawn', () => {
      // Not on the page, or drawn 0 wide (a hidden tab): the engine then lays it out on one line.
      expect(readWrapperWidth(FLEX, null, 'canvas')).toBeNull();
      drawBox(`ele-${FLEX}`, 0);
      expect(readWrapperWidth(FLEX, null, 'canvas')).toBeNull();
    });
  });
});
