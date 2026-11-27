/**
 * The App Builder store owns the app's dynamic height scheduler (scheduler.js): one per store, wired to it, so a
 * widget's hook and the store's own actions feed the same frame.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, binding } from '@/test/app-builder';
import { uuid, widget } from './dynamicHeightPage';

const s = () => useStore.getState();
const DH = { dynamicHeight: binding('{{true}}') };

describe('dynamic height: the store’s scheduler', () => {
  it('[DynamicHeight-STORE-001] is one scheduler for the whole store', () => {
    const scheduler = s().getDynamicHeightScheduler();
    expect(scheduler).toBe(s().getDynamicHeightScheduler());
    expect(typeof scheduler.observe).toBe('function');
  });

  it('[DynamicHeight-STORE-002] writes its passes to the store', () => {
    seedApp({
      a: widget('a', 'Text', { top: 0, properties: DH }),
      b: widget('b', 'Text', { top: 60 }),
    });
    const scheduler = s().getDynamicHeightScheduler();
    scheduler.scheduleDynamicHeight({ id: 'a', height: 100 });
    scheduler.flush();
    expect(s().temporaryLayouts).toEqual({ a: { top: 0, height: 100 }, b: { top: 120, height: 40 } });
  });

  // `b` 20 under `a`, which is drawn grown to 100.
  const grownPage = () => {
    seedApp({
      a: widget('a', 'Text', { top: 0, properties: DH }),
      b: widget('b', 'Text', { top: 60 }),
    });
    s().setTemporaryLayouts({ a: { top: 0, height: 100 } });
  };

  it('[DynamicHeight-STORE-003] takes the requests of callers that still ask through scheduleReflow', () => {
    // RenderWidget's collapse when hidden, until B3 moves it.
    grownPage();
    // Seeding is a saved-layout change: that pass runs first, then `b` is put back where nothing placed it.
    s().getDynamicHeightScheduler().flush();
    s().setTemporaryLayouts({ b: { top: 60, height: 40 } });
    s().scheduleReflow('a', 'desktop', false, null, 'canvas');
    s().getDynamicHeightScheduler().flush();
    expect(s().temporaryLayouts.b).toEqual({ top: 120, height: 40 });
  });

  it('[DynamicHeight-STORE-004] places a module again when the builder moves a widget', () => {
    grownPage();
    s().setComponentLayout({ b: { top: 100, left: 0, width: 10, height: 40 } }, undefined, 'canvas', {
      skipUndoRedo: true,
      saveAfterAction: false,
    });
    s().getDynamicHeightScheduler().flush();
    expect(s().temporaryLayouts.b).toEqual({ top: 160, height: 40 });
  });

  it('[DynamicHeight-STORE-005] keeps the row a scheduleReflow request is for', () => {
    // A List view of two rows; row 1 drawn at a height nothing measured.
    const LIST = uuid(1);
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
      rowText: widget('rowText', 'Text', { parent: LIST, top: 0 }),
    });
    s().getDynamicHeightScheduler().flush();
    s().setTemporaryLayouts({ [`${LIST}-1`]: { height: 999 } });
    s().scheduleReflow('rowText', 'desktop', false, [1], 'canvas');
    s().getDynamicHeightScheduler().flush();
    expect(s().temporaryLayouts[`${LIST}-1`]).toEqual({ height: 40 });
  });

  it('[DynamicHeight-STORE-006] puts a List view back at its drawn height once Dynamic height is off', () => {
    // Turning it off changes the list's properties, so the module is placed again: nothing has to clear what was grown.
    const LIST = uuid(2);
    seedApp({
      [LIST]: widget(LIST, 'Listview', {
        top: 0,
        height: 218,
        properties: {
          ...DH,
          dataSourceSelector: binding('rawJson'),
          data: binding('{{[{ "n": 0 }, { "n": 1 }]}}'),
          rowHeight: binding('{{100}}'),
          showBorder: binding('{{false}}'),
        },
      }),
      rowText: widget('rowText', 'Text', { parent: LIST, top: 0, properties: DH }),
    });
    const scheduler = s().getDynamicHeightScheduler();
    scheduler.flush();
    scheduler.scheduleDynamicHeight({ id: 'rowText', contextIndices: [1], height: 300 });
    scheduler.flush();
    expect(s().temporaryLayouts[`${LIST}-1`]).toEqual({ height: 300 });
    expect(s().temporaryLayouts[LIST].height).toBeGreaterThan(218);

    s().setComponentProperty(LIST, 'dynamicHeight', '{{false}}', 'properties', 'value', false, 'canvas', {
      skipUndoRedo: true,
      saveAfterAction: false,
    });
    scheduler.flush();
    // Its rows are drawn at the Row height again by the list itself (ListviewSubcontainer ignores row heights with
    // Dynamic height off).
    expect(s().temporaryLayouts[LIST]).toEqual({ top: 0, height: 218 });
  });
});
