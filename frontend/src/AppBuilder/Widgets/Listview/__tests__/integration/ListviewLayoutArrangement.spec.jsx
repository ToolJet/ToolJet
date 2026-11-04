/**
 * Changing a ListView's Layout re-arranges every child of the record canvas: a row in List, a stack in Grid, in
 * one undo step. Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md (Listview-GRID-005..008).
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';

const MODULE_ID = 'canvas';
const LV = 'lv1';
const OTHER = 'lv2';

const layoutOf = (id) => useStore.getState().getCurrentPageComponents(MODULE_ID)[id].layouts.desktop;
const modeOf = (id = LV) =>
  useStore.getState().getCurrentPageComponents(MODULE_ID)[id].component.definition.properties.mode.value;
const setMode = (value, id = LV) =>
  useStore.getState().setComponentProperty(id, 'mode', value, 'properties', 'value', false, MODULE_ID, {
    saveAfterAction: false,
  });

function child(id, name, type, layout, parent = LV) {
  const definition = componentDefinition(id, name, type, {});
  definition.component.parent = parent;
  definition.layouts = { desktop: layout };
  return definition;
}

function seed({ mode = 'list', withChildren = true } = {}) {
  const lv = componentDefinition(LV, 'listview1', 'Listview', {
    dataSourceSelector: binding('rawJson'),
    data: binding('{{[{ a: 1 }]}}'),
    mode: binding(mode),
    rowHeight: binding('80'),
    gridRecordHeight: binding('150'),
  });
  const other = componentDefinition(OTHER, 'listview2', 'Listview', {
    mode: binding('list'),
    rowHeight: binding('80'),
  });
  seedApp(
    {
      [LV]: lv,
      [OTHER]: other,
      ...(withChildren && {
        img: child('img', 'image1', 'Image', { top: 10, left: 3, width: 6, height: 60 }),
        txt: child('txt', 'text1', 'Text', { top: 25, left: 11, width: 12, height: 30 }),
        btn: child('btn', 'button1', 'Button', { top: 25, left: 25, width: 17, height: 30 }),
      }),
      hdr: child('hdr', 'title1', 'Text', { top: 10, left: 1, width: 20, height: 40 }, `${LV}-header`),
      oth: child('oth', 'text2', 'Text', { top: 5, left: 5, width: 10, height: 30 }, OTHER),
    },
    { moduleId: MODULE_ID }
  );
}

describe('Listview: Layout change re-arranges the record canvas', () => {
  test('[Listview-GRID-005] List to Grid stacks every child, the moved ones too, and leaves the header and other lists alone', () => {
    // Break this catches: a card that keeps the list row's side-by-side children.
    seed();
    useStore.getState().setComponentLayout({ btn: { top: 25, left: 0, width: 17, height: 30 } }, undefined, MODULE_ID, {
      skipUndoRedo: true,
      saveAfterAction: false,
    });

    setMode('grid');

    const stack = ['btn', 'img', 'txt'].map((id) => layoutOf(id));
    stack.forEach((layout) => expect(layout).toMatchObject({ left: 1, width: 41 }));
    expect(stack[0].top).toBeLessThan(stack[1].top);
    expect(stack[1].top).toBeLessThan(stack[2].top);
    expect(layoutOf('hdr')).toEqual({ top: 10, left: 1, width: 20, height: 40 });
    expect(layoutOf('oth')).toEqual({ top: 5, left: 5, width: 10, height: 30 });
    expect(modeOf()).toBe('grid');
  });

  test('[Listview-GRID-006] Grid to List puts the children in one row again', () => {
    // Break this catches: children left stacked and full width in a list.
    seed();
    setMode('grid');
    expect(layoutOf('txt').left).toBe(1);

    setMode('list');

    expect(layoutOf('img')).toEqual({ top: 10, left: 3, width: 6, height: 60 });
    expect(layoutOf('txt')).toEqual({ top: 25, left: 11, width: 12, height: 30 });
    expect(layoutOf('btn')).toEqual({ top: 25, left: 25, width: 17, height: 30 });
  });

  test('[Listview-GRID-007] one undo restores the old Layout and every child position', () => {
    // Break this catches: an undo that flips the switch back but leaves the children stacked, or the reverse.
    seed();

    setMode('grid');
    expect(layoutOf('txt').left).toBe(1);
    useStore.getState().handleUndo();

    expect(modeOf()).toBe('list');
    expect(layoutOf('img')).toEqual({ top: 10, left: 3, width: 6, height: 60 });
    expect(layoutOf('txt')).toEqual({ top: 25, left: 11, width: 12, height: 30 });
    expect(layoutOf('btn')).toEqual({ top: 25, left: 25, width: 17, height: 30 });
    useStore.getState().handleRedo();
    expect(modeOf()).toBe('grid');
    expect(layoutOf('txt').left).toBe(1);
  });

  test('[Listview-GRID-008] choosing the Layout the list already has moves nothing', () => {
    // Break this catches: a re-arrange on every write of the Layout, which would undo a hand-made row.
    seed();
    useStore
      .getState()
      .setComponentLayout({ txt: { top: 40, left: 20, width: 12, height: 30 } }, undefined, MODULE_ID, {
        skipUndoRedo: true,
        saveAfterAction: false,
      });

    setMode('list');

    expect(layoutOf('txt')).toEqual({ top: 40, left: 20, width: 12, height: 30 });
  });

  test('[Listview-GRID-008] a record with no children changes Layout without error', () => {
    // Break this catches: a crash on a ListView whose record canvas is empty.
    seed({ withChildren: false });

    expect(() => setMode('grid')).not.toThrow();
    expect(modeOf()).toBe('grid');
  });
});
