/**
 * The dynamic height engine's core pass: measured heights and requests go in, one `temporaryLayouts` write comes out.
 *
 * Runs on the real composed store, seeded through `seedApp`. A pass reads the store and writes it synchronously, so
 * React is never rendered (as in moduleScope.spec.js).
 *
 * Widgets are 10 columns wide at column 0 unless a spec says otherwise, so each one sits under the one above it.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, binding } from '@/test/app-builder';
import { ROOT_CANVAS, flushDynamicHeight } from '../../engine';
import { bootModule, uuid, widget } from './dynamicHeightPage';

const s = () => useStore.getState();
const pass = (changes) => flushDynamicHeight(useStore.getState, { changes });
const temps = () => s().temporaryLayouts;

const DH = { dynamicHeight: binding('{{true}}') };
const NO_DH = { dynamicHeight: binding('{{false}}') };
// Containers here have no header, so their chrome is a flat 20px (containerChrome.js).
const NO_HEADER = { showHeader: binding('{{false}}') };

const BOX = uuid(1);
const OUTER = uuid(2);
const MIDDLE = uuid(3);

// Records the store writes a pass makes.
const recordWrites = () => {
  const writes = [];
  const unsubscribe = useStore.subscribe((state, previous) => {
    if (state.temporaryLayouts !== previous.temporaryLayouts) writes.push('layouts');
    if (state.triggerCanvasUpdater !== previous.triggerCanvasUpdater) writes.push('canvas');
  });
  return { writes, unsubscribe };
};

// a grows; b sits 20px under it; `side` is in other columns.
const COLUMN = {
  a: widget('a', 'Text', { top: 0, properties: DH }),
  b: widget('b', 'Text', { top: 60 }),
  side: widget('side', 'Text', { top: 0, left: 20, properties: DH }),
};

// A Container (drawn 200 high) holding two stacked widgets, and a widget 20px under the Container.
const boxPage = (boxProperties = DH) => ({
  [BOX]: widget(BOX, 'Container', { top: 0, height: 200, properties: { ...boxProperties, ...NO_HEADER } }),
  inner: widget('inner', 'Text', { parent: BOX, top: 0, properties: DH }),
  under: widget('under', 'Text', { parent: BOX, top: 60 }),
  after: widget('after', 'Text', { top: 220 }),
});

describe('dynamic height engine: one pass', () => {
  it('[DynamicHeight-ENGINE-001] moves what is below a grown widget, keeping the gap drawn between them', () => {
    seedApp(COLUMN);
    pass([{ id: 'a', height: 100 }]);
    // Only what changed is written, and only its top and height. `side` is in other columns and stays.
    expect(temps()).toEqual({ a: { top: 0, height: 100 }, b: { top: 120, height: 40 } });
  });

  it('[DynamicHeight-ENGINE-002] writes every change of a pass at once, and tells the canvas once', () => {
    seedApp(COLUMN);
    const { writes, unsubscribe } = recordWrites();
    pass([
      { id: 'a', height: 100 },
      { id: 'side', height: 90 },
    ]);
    unsubscribe();
    expect(writes).toEqual(['layouts', 'canvas']);
    expect(temps().side).toEqual({ top: 0, height: 90 });
  });

  it('[DynamicHeight-ENGINE-003] writes nothing when nothing moves', () => {
    seedApp(COLUMN);
    const { writes, unsubscribe } = recordWrites();
    const { patch } = pass([{ id: 'a', height: 40 }]);
    unsubscribe();
    expect(patch).toEqual({});
    expect(writes).toEqual([]);
  });

  it('[DynamicHeight-ENGINE-004] ignores a measurement of a widget with Dynamic height off', () => {
    seedApp(COLUMN);
    pass([{ id: 'b', height: 200 }]);
    expect(temps()).toEqual({});
  });

  it('[DynamicHeight-ENGINE-005] only ever writes a top and a height, replacing what an older write left', () => {
    // A layout written before this engine carried every saved field; a column left there would win over a later move.
    seedApp(COLUMN);
    s().setTemporaryLayouts({ a: { top: 0, left: 5, width: 3, height: 40 } });
    pass([{ id: 'a', height: 100 }]);
    expect(temps().a).toEqual({ top: 0, height: 100 });
  });

  it('[DynamicHeight-ENGINE-006] draws a widget with Dynamic height off at its drawn height again', () => {
    // b was left at 120 by an earlier pass, from when it had Dynamic height.
    seedApp(COLUMN);
    s().setTemporaryLayouts({ b: { top: 60, height: 120 } });
    pass([{ id: 'a', height: 100 }]);
    expect(temps().b).toEqual({ top: 120, height: 40 });
  });
});

describe('dynamic height engine: containers', () => {
  it('[DynamicHeight-ENGINE-007] grows a container to its content, and moves what is below it', () => {
    seedApp(boxPage());
    pass([{ id: 'inner', height: 300 }]);
    expect(temps()).toEqual({
      inner: { top: 0, height: 300 },
      under: { top: 320, height: 40 },
      // content bottom 360 + 20px of Container chrome
      [BOX]: { top: 0, height: 380 },
      after: { top: 400, height: 40 },
    });
  });

  it('[DynamicHeight-ENGINE-008] sizes inner containers before outer ones, solving each canvas once', () => {
    seedApp({
      [OUTER]: widget(OUTER, 'Container', { top: 0, height: 100, properties: { ...DH, ...NO_HEADER } }),
      [MIDDLE]: widget(MIDDLE, 'Container', { parent: OUTER, top: 0, height: 60, properties: { ...DH, ...NO_HEADER } }),
      left: widget('left', 'Text', { parent: MIDDLE, top: 0, properties: DH }),
      right: widget('right', 'Text', { parent: MIDDLE, top: 0, left: 20, properties: DH }),
      after: widget('after', 'Text', { top: 120 }),
    });
    const { solvedSlots } = pass([
      { id: 'left', height: 100 },
      { id: 'right', height: 150 },
    ]);
    expect(solvedSlots).toEqual([MIDDLE, OUTER, ROOT_CANVAS]);
    // Side by side, the taller one sizes MIDDLE: 150 + 20 = 170; OUTER: 170 + 20 = 190.
    expect(temps()[MIDDLE]).toEqual({ top: 0, height: 170 });
    expect(temps()[OUTER]).toEqual({ top: 0, height: 190 });
    expect(temps().after).toEqual({ top: 210, height: 40 });
  });

  it('[DynamicHeight-ENGINE-009] stops at a container whose height does not change', () => {
    // inner grows to 100, still inside the Container's drawn 200: nothing outside it is solved again.
    seedApp(boxPage());
    const { writes, unsubscribe } = recordWrites();
    const { solvedSlots } = pass([{ id: 'inner', height: 100 }]);
    unsubscribe();
    expect(solvedSlots).toEqual([BOX]);
    expect(writes).toEqual(['layouts']);
    expect(temps()).toEqual({ inner: { top: 0, height: 100 }, under: { top: 120, height: 40 } });
  });

  it('[DynamicHeight-ENGINE-010] keeps a container with Dynamic height off at its drawn height, its content still placed', () => {
    seedApp(boxPage(NO_DH));
    pass([{ id: 'inner', height: 300 }]);
    expect(temps()).toEqual({ inner: { top: 0, height: 300 }, under: { top: 320, height: 40 } });
  });

  it('[DynamicHeight-ENGINE-011] brings a container back to its drawn height when asked, and what is below it back up', () => {
    // It grew with Dynamic height on, then Dynamic height was turned off.
    seedApp(boxPage(NO_DH));
    s().setTemporaryLayouts({ [BOX]: { top: 0, height: 380 }, after: { top: 400, height: 40 } });
    pass([{ id: BOX }]);
    expect(temps()[BOX]).toEqual({ top: 0, height: 200 });
    expect(temps().after).toEqual({ top: 220, height: 40 });
  });

  it('[DynamicHeight-ENGINE-015] keeps a hidden container at its drawn height, its content still placed', () => {
    seedApp(boxPage());
    s().setExposedValue(BOX, 'isVisible', false);
    pass([{ id: 'inner', height: 300 }]);
    expect(temps()).toEqual({ inner: { top: 0, height: 300 }, under: { top: 320, height: 40 } });
  });
});

describe('dynamic height engine: visibility, modules and missing widgets', () => {
  it('[DynamicHeight-ENGINE-012] closes the space of a hidden widget that collapses when hidden', () => {
    const page = (collapseWhenHidden) => ({
      a: widget('a', 'Text', { top: 0, properties: { collapseWhenHidden: binding(collapseWhenHidden) } }),
      b: widget('b', 'Text', { top: 60 }),
    });
    seedApp(page('{{true}}'));
    // Visible, it keeps its space.
    pass([{ id: 'a' }]);
    expect(temps()).toEqual({});

    s().setExposedValue('a', 'isVisible', false);
    // Asked after its visibility changed: its height did not change, its space did.
    pass([{ id: 'a' }]);
    expect(temps()).toEqual({ b: { top: 0, height: 40 } });

    // Without "Collapse when hidden" it keeps its space.
    seedApp(page('{{false}}'));
    useStore.setState({ temporaryLayouts: {} });
    s().setExposedValue('a', 'isVisible', false);
    pass([{ id: 'a' }]);
    expect(temps()).toEqual({});
  });

  it('[DynamicHeight-ENGINE-013] keeps a module to its own keys, apart from the app', () => {
    const INSTANCE = uuid(50);
    seedApp({
      [INSTANCE]: widget(INSTANCE, 'ModuleViewer', { top: 0, height: 300 }),
      m2: widget('m2', 'Text', { top: 320 }),
    });
    bootModule(INSTANCE);
    seedApp(
      { m1: widget('m1', 'Text', { top: 0, properties: DH }), m2: widget('m2', 'Text', { top: 60 }) },
      { moduleId: INSTANCE }
    );
    pass([{ id: 'm1', moduleId: INSTANCE, height: 100 }]);
    expect(temps()).toEqual({
      [`${INSTANCE}::m1`]: { top: 0, height: 100 },
      [`${INSTANCE}::m2`]: { top: 120, height: 40 },
    });
  });

  it('[DynamicHeight-ENGINE-014] leaves alone a widget no longer on the page, or whose container is not', () => {
    seedApp({ ...COLUMN, orphan: widget('orphan', 'Text', { parent: uuid(99), top: 0, properties: DH }) });
    const { patch } = pass([
      { id: 'gone', height: 100 },
      { id: 'orphan', height: 100 },
    ]);
    expect(patch).toEqual({});
  });
});
