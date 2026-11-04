/**
 * List and Grid each remember their own last layout: a switch saves the current desktop layouts of the record
 * canvas's children as that Layout's memory (`properties.recordLayouts`) and restores the target Layout's memory.
 * Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md (Listview-GRID-010..016). Store only.
 */
import { toast } from 'react-hot-toast';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';
import { copyComponents, pasteComponents } from '@/AppBuilder/AppCanvas/copyPasteWidgetsUtils';

jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const MODULE_ID = 'canvas';
const PAGE_ID = 'page-1';
const LV = 'b1b1b1b1-0000-4000-8000-0000000000aa';

const components = () => useStore.getState().getCurrentPageComponents(MODULE_ID);
const layoutOf = (id, layout = 'desktop') => components()[id].layouts[layout];
const modeOf = () => components()[LV].component.definition.properties.mode.value;
const memoryOf = () => components()[LV].component.definition.properties.recordLayouts?.value;
const setMode = (value) =>
  useStore.getState().setComponentProperty(LV, 'mode', value, 'properties', 'value', false, MODULE_ID, {
    saveAfterAction: false,
  });
const moveTo = (id, layout) =>
  useStore.getState().setComponentLayout({ [id]: layout }, undefined, MODULE_ID, {
    skipUndoRedo: true,
    saveAfterAction: false,
  });
const { handleUndo, handleRedo } = {
  handleUndo: () => useStore.getState().handleUndo(),
  handleRedo: () => useStore.getState().handleRedo(),
};

const IMG = { top: 10, left: 3, width: 6, height: 60 };
const TXT = { top: 25, left: 11, width: 12, height: 30 };
const BTN = { top: 25, left: 25, width: 17, height: 30 };

function child(id, name, type, layout, extra = {}) {
  const definition = componentDefinition(id, name, type, {});
  definition.component.parent = LV;
  definition.layouts = { desktop: layout, ...extra };
  return definition;
}

function seed({ mode = 'list', recordLayouts } = {}) {
  seedApp(
    {
      [LV]: componentDefinition(LV, 'listview1', 'Listview', {
        dataSourceSelector: binding('rawJson'),
        data: binding('{{[{ a: 1 }]}}'),
        mode: binding(mode),
        rowHeight: binding('80'),
        gridRecordHeight: binding('150'),
        ...(recordLayouts && { recordLayouts: { value: recordLayouts } }),
      }),
      img: child('img', 'image1', 'Image', IMG),
      txt: child('txt', 'text1', 'Text', TXT),
      btn: child('btn', 'button1', 'Button', BTN),
    },
    { moduleId: MODULE_ID, pageId: PAGE_ID }
  );
}

describe('Listview: each Layout remembers its own layout', () => {
  test('[Listview-GRID-010] List to Grid and back restores the exact List layout', () => {
    // Break this catches: a rebuild on the way back (the Button would come back at the card's width, the row squeezed), or no memory saved.
    seed();
    moveTo('txt', { top: 40, left: 20, width: 9, height: 30 });

    setMode('grid');
    expect(layoutOf('txt').left).toBe(1);
    setMode('list');

    expect(layoutOf('img')).toEqual(IMG);
    expect(layoutOf('txt')).toEqual({ top: 40, left: 20, width: 9, height: 30 });
    expect(layoutOf('btn')).toEqual(BTN);
    expect(modeOf()).toBe('list');
  });

  test('[Listview-GRID-011] an edit made in Grid comes back when the list returns to Grid', () => {
    // Break this catches: the Grid layout rebuilt on every switch, so the hand-made card is lost.
    seed();
    setMode('grid');
    moveTo('btn', { top: 100, left: 20, width: 15, height: 30 });

    setMode('list');
    expect(layoutOf('btn')).toEqual(BTN);
    setMode('grid');

    expect(layoutOf('btn')).toEqual({ top: 100, left: 20, width: 15, height: 30 });
  });

  test('[Listview-GRID-011] a ListView that opens in Grid remembers it: Grid, List, Grid keeps the first Grid layout', () => {
    // Break this catches: memory kept for List only.
    seed({ mode: 'grid' });
    moveTo('img', { top: 0, left: 30, width: 6, height: 60 });

    setMode('list');
    setMode('grid');

    expect(layoutOf('img')).toEqual({ top: 0, left: 30, width: 6, height: 60 });
  });

  test('[Listview-GRID-012] a child added in Grid goes after the row in List; one added in List goes under the stack in Grid', () => {
    // Break this catches: a new child dropped at its Grid position, on top of the restored row, or at the top of the stack.
    seed();
    moveTo('btn', { top: 25, left: 25, width: 8, height: 30 });
    setMode('grid');
    useStore.getState().addComponentToCurrentPage(
      [
        {
          ...child('new1', 'button2', 'Button', { top: 200, left: 1, width: 5, height: 30 }),
          id: 'new1',
          name: 'button2',
        },
      ],
      MODULE_ID,
      { saveAfterAction: false, skipUndoRedo: true }
    );

    setMode('list');

    expect(layoutOf('img')).toEqual(IMG);
    expect(layoutOf('txt')).toEqual(TXT);
    expect(layoutOf('btn')).toEqual({ top: 25, left: 25, width: 8, height: 30 });
    expect(layoutOf('new1').left).toBeGreaterThanOrEqual(33);

    useStore.getState().addComponentToCurrentPage(
      [
        {
          ...child('new2', 'button3', 'Button', { top: 30, left: 40, width: 3, height: 30 }),
          id: 'new2',
          name: 'button3',
        },
      ],
      MODULE_ID,
      { saveAfterAction: false, skipUndoRedo: true }
    );
    setMode('grid');

    const stackBottom = Math.max(...['img', 'txt', 'btn', 'new1'].map((id) => layoutOf(id).top + layoutOf(id).height));
    expect(layoutOf('new2').top).toBeGreaterThanOrEqual(stackBottom);
    expect(layoutOf('new2').left).toBe(1);
  });

  test('[Listview-GRID-013] one undo of a switch restores the Layout and every child position, and the memory agrees with them', () => {
    // Break this catches: an undo that flips the Layout but leaves the children stacked, two undo steps for one switch, or a memory that disagrees with the restored page.
    seed();
    setMode('grid');
    setMode('list');
    moveTo('txt', { top: 40, left: 20, width: 9, height: 30 });

    setMode('grid');
    expect(layoutOf('txt').left).toBe(1);
    handleUndo();

    expect(modeOf()).toBe('list');
    expect(layoutOf('img')).toEqual(IMG);
    expect(layoutOf('txt')).toEqual({ top: 40, left: 20, width: 9, height: 30 });
    expect(layoutOf('btn')).toEqual(BTN);
    expect(memoryOf().list.txt).toEqual({ top: 40, left: 20, width: 9, height: 30 });

    handleRedo();
    expect(modeOf()).toBe('grid');
    expect(layoutOf('txt').left).toBe(1);
    expect(memoryOf().list.txt).toEqual({ top: 40, left: 20, width: 9, height: 30 });

    handleUndo();
    setMode('grid');
    handleUndo();
    expect(modeOf()).toBe('list');
  });

  test('[Listview-GRID-013] undoing the first switch restores the List layout, and switching again then behaves like the first time', () => {
    // Break this catches: an undo that leaves the children stacked, or a memory that makes the second try differ from the first.
    seed();
    setMode('grid');
    const stacked = ['img', 'txt', 'btn'].map((id) => layoutOf(id));
    handleUndo();

    expect(modeOf()).toBe('list');
    expect(layoutOf('img')).toEqual(IMG);
    expect(layoutOf('txt')).toEqual(TXT);
    expect(layoutOf('btn')).toEqual(BTN);

    setMode('grid');
    expect(['img', 'txt', 'btn'].map((id) => layoutOf(id))).toEqual(stacked);
  });

  test('[Listview-GRID-014] a deleted child is not restored and its id leaves the memory', () => {
    // Break this catches: a restore that recreates the child, a crash on a stale id, or a stale id kept for ever.
    seed();
    setMode('grid');
    useStore.getState().deleteComponents(['txt'], MODULE_ID, { saveAfterAction: false, skipUndoRedo: true });

    expect(() => setMode('list')).not.toThrow();

    expect(components().txt).toBeUndefined();
    expect(layoutOf('img')).toEqual(IMG);
    expect(layoutOf('btn')).toEqual(BTN);
    expect(Object.keys(memoryOf().grid)).toEqual(expect.not.arrayContaining(['txt']));
    expect(Object.keys(memoryOf().list)).toEqual(['img', 'txt', 'btn']);
    setMode('grid');
    expect(Object.keys(memoryOf().list)).toEqual(['img', 'btn']);
  });

  test('[Listview-GRID-014] an id in the memory that is no child at all is ignored', () => {
    // Break this catches: a restore that throws on, or writes a layout for, an id the page does not have.
    seed({
      mode: 'grid',
      recordLayouts: { list: { ghost: IMG, img: { top: 1, left: 2, width: 6, height: 60 } } },
    });

    setMode('list');

    expect(components().ghost).toBeUndefined();
    expect(layoutOf('img')).toEqual({ top: 1, left: 2, width: 6, height: 60 });
    expect(layoutOf('txt').top).toBeGreaterThanOrEqual(0);
  });

  test('[Listview-GRID-015] a ListView without memory arranges as before on its first switch, and the mobile layouts stay', () => {
    // Break this catches: a first switch that restores nothing and arranges nothing, or one that writes the mobile layouts.
    seed();
    const mobile = { top: 5, left: 5, width: 10, height: 30 };
    components().img.layouts.mobile = mobile;
    expect(memoryOf()).toBeUndefined();

    setMode('grid');

    expect(layoutOf('img').left).toBe(1);
    expect(layoutOf('txt').width).toBe(41);
    expect(layoutOf('img', 'mobile')).toEqual(mobile);
    expect(memoryOf().list.img).toEqual(IMG);
    expect(memoryOf().list.img.mobile).toBeUndefined();
  });

  test('[Listview-GRID-015] a switch made in the mobile view neither saves nor restores desktop layouts', () => {
    // Break this catches: the memory read from or written to the mobile layouts, or the desktop layouts moved from the mobile view.
    seed();
    components().img.layouts.mobile = { top: 5, left: 5, width: 10, height: 30 };
    useStore.getState().setCurrentLayout('mobile');

    setMode('grid');

    expect(memoryOf()).toBeUndefined();
    expect(layoutOf('img')).toEqual(IMG);
    expect(layoutOf('txt')).toEqual(TXT);
    useStore.getState().setCurrentLayout('desktop');
  });

  test('[Listview-GRID-015] choosing the Layout the list already has writes no memory', () => {
    // Break this catches: a memory write on every Layout write.
    seed();

    setMode('list');

    expect(memoryOf()).toBeUndefined();
  });
});

describe('Listview: the layout memory follows a copy', () => {
  let clipboard;

  beforeEach(() => {
    clipboard = null;
    Object.assign(navigator, { clipboard: { writeText: jest.fn((value) => (clipboard = value)) } });
    seed({
      mode: 'grid',
      recordLayouts: {
        list: { img: IMG, txt: TXT, btn: BTN, gone: { top: 0, left: 0, width: 3, height: 10 } },
      },
    });
    useStore.getState().setSelectedComponents([LV]);
  });

  afterEach(() => {
    useStore.getState().clearSelectedComponents();
    jest.clearAllMocks();
  });

  test('[Listview-GRID-016] a pasted ListView remembers its List layout under the new child ids, and drops ids that were not copied', async () => {
    // Break this catches: a memory keyed by the old ids (the copy would restore nothing) or one that carries a foreign id over.
    copyComponents({ isCut: false, isCloning: false });
    const before = new Set(Object.keys(components()));

    await pasteComponents(undefined, JSON.parse(clipboard));

    const added = Object.entries(components()).filter(([id]) => !before.has(id));
    const newLv = added.find(([, entry]) => entry.component.component === 'Listview')[0];
    const byType = (type) => added.find(([, entry]) => entry.component.component === type)[0];
    const copied = components()[newLv].component.definition.properties.recordLayouts.value;
    expect(Object.keys(copied.list).sort()).toEqual([byType('Image'), byType('Text'), byType('Button')].sort());
    expect(copied.list[byType('Image')]).toEqual(IMG);
    expect(copied.list[byType('Button')]).toEqual(BTN);
    expect(copied.list.gone).toBeUndefined();
    // The original is untouched.
    expect(Object.keys(memoryOf().list)).toEqual(['img', 'txt', 'btn', 'gone']);
  });
});
