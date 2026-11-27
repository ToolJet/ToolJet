/**
 * The dynamic height engine and lists whose own code draws their rows: UI 2.0's List view and Kanban, and a
 * component built with the SDK that has rows (a pack list). Each row is the list's canvas drawn at that row, as for
 * the native List view, but the list measures its own height (it is drawn by its code, not by the canvas):
 *
 *   - a UI 2.0 List view row fits its components plus 8px, never below its Row height (ui2Rows.js);
 *   - a UI 2.0 Kanban card does too, and leaves out a component hidden on it;
 *   - a pack list's rows are sized by its host (usePackHost.fittedRowHeight) from the components the engine placed.
 *
 * Runs on the real composed store, seeded through `seedApp`, as engine.spec.js does.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, binding } from '@/test/app-builder';
import { flushDynamicHeight } from '../../engine';
import { uuid, widget } from './dynamicHeightPage';

const s = () => useStore.getState();
const pass = (options) => flushDynamicHeight(useStore.getState, options);
const temps = () => s().temporaryLayouts;

const DH = { dynamicHeight: binding('{{true}}') };
const HIDDEN = { visibility: binding('{{false}}') };

const LIST = uuid(1);

// A row holding a widget that grows (10 from the top) and one 10px under it; a widget 20px under the list.
const rowsPage = (type, listProperties) => ({
  [LIST]: widget(LIST, type, { top: 0, height: 300, properties: listProperties }),
  grows: widget('grows', 'Text', { parent: LIST, top: 10, properties: DH }),
  under: widget('under', 'Text', { parent: LIST, top: 60 }),
  after: widget('after', 'Text', { top: 320 }),
});

describe('dynamic height engine: UI 2.0 List view rows', () => {
  it('[DynamicHeight-ENGINE-045] fits the row a component grew in, and leaves the list to measure itself', () => {
    seedApp(rowsPage('ShadListView'));
    const { patch } = pass({ changes: [{ id: 'grows', contextIndices: [1], height: 100 }] });
    expect(patch).toEqual({
      'grows-1': { top: 10, height: 100 },
      'under-1': { top: 120, height: 40 },
      // The row: its components' bottom plus 8, only its height.
      [`${LIST}-1`]: { height: 168 },
    });
  });

  it('[DynamicHeight-ENGINE-046] never sizes a row below its Row height', () => {
    seedApp(rowsPage('ShadListView', { rowHeight: binding('{{300}}') }));
    pass({ changes: [{ id: 'grows', contextIndices: [0], height: 100 }] });
    expect(temps()[`${LIST}-0`]).toEqual({ height: 300 });
  });

  it('[DynamicHeight-ENGINE-054] keeps every row at the Row height with Dynamic height off', () => {
    seedApp(rowsPage('ShadListView', { dynamicHeight: binding('{{false}}') }));
    pass({ changes: [{ id: 'grows', contextIndices: [0], height: 100 }] });
    // Its components are still placed; the row keeps the default Row height.
    expect(temps()['under-0']).toEqual({ top: 120, height: 40 });
    expect(temps()[`${LIST}-0`]).toEqual({ height: 72 });
  });

  it('[DynamicHeight-ENGINE-055] keeps the room of a component hidden on a row, unlike a Kanban card', () => {
    // Only a card leaves out what is hidden on it; a row keeps a hidden component's space unless it collapses.
    seedApp({
      ...rowsPage('ShadListView'),
      under: widget('under', 'Text', { parent: LIST, top: 60, properties: HIDDEN }),
    });
    pass({ changes: [{ id: 'grows', contextIndices: [0], height: 50 }] });
    // 10 + 50, 10 under it, the hidden 40, plus 8.
    expect(temps()[`${LIST}-0`]).toEqual({ height: 118 });
  });

  it('[DynamicHeight-ENGINE-047] moves what is below the list when the list reports its new height', () => {
    seedApp(rowsPage('ShadListView'));
    pass({ changes: [{ id: LIST, height: 500 }] });
    expect(temps()).toEqual({ [LIST]: { top: 0, height: 500 }, after: { top: 520, height: 40 } });
  });

  it('[DynamicHeight-ENGINE-048] sizes a row that asks for it', () => {
    seedApp(rowsPage('ShadListView'));
    pass({ changes: [{ id: LIST, contextIndices: [0] }] });
    // 10 + 40, 10 under it, 40, plus 8.
    expect(temps()).toEqual({ [`${LIST}-0`]: { height: 108 } });
  });

  it('[DynamicHeight-ENGINE-049] places every row it drew when the whole module is solved', () => {
    seedApp(rowsPage('ShadListView'));
    // The list drew two rows: one exposed slot per row for its components.
    s().initExposedValueArrayForChildren(LIST, 2, 'canvas', []);
    s().setTemporaryLayouts({ 'grows-1': { top: 10, height: 100 } });
    pass({ fullModules: ['canvas'] });
    expect(temps()[`${LIST}-0`]).toEqual({ height: 108 });
    expect(temps()['under-1']).toEqual({ top: 120, height: 40 });
    expect(temps()[`${LIST}-1`]).toEqual({ height: 168 });
    expect(temps()[`${LIST}-2`]).toBeUndefined();
  });
});

describe('dynamic height engine: UI 2.0 Kanban cards', () => {
  it('[DynamicHeight-ENGINE-050] fits a card to its components, never below the card height', () => {
    seedApp(rowsPage('ShadKanban'));
    pass({ changes: [{ id: 'grows', contextIndices: [0], height: 100 }] });
    expect(temps()[`${LIST}-0`]).toEqual({ height: 168 });
    pass({ changes: [{ id: 'grows', contextIndices: [0], height: 10 }] });
    expect(temps()[`${LIST}-0`]).toEqual({ height: 96 });
  });

  it('[DynamicHeight-ENGINE-051] leaves out a component hidden on the card, and may go below the card height', () => {
    // The widget under the one that grows is hidden: the card ends at the one that grows. 10 + 50 + 8.
    seedApp({
      ...rowsPage('ShadKanban'),
      under: widget('under', 'Text', { parent: LIST, top: 60, properties: HIDDEN }),
    });
    pass({ changes: [{ id: 'grows', contextIndices: [0], height: 50 }] });
    expect(temps()[`${LIST}-0`]).toEqual({ height: 68 });
  });

  it('[DynamicHeight-ENGINE-056] decides card by card whether a component is hidden on it', () => {
    // The widget under the one that grows is shown only on cards whose data says so: card 0 shows it, card 1 not.
    seedApp({
      ...rowsPage('ShadKanban'),
      under: widget('under', 'Text', {
        parent: LIST,
        top: 60,
        properties: { visibility: binding('{{cardData.show}}') },
      }),
    });
    s().updateCustomResolvables(LIST, [{ cardData: { show: true } }, { cardData: { show: false } }], 'cardData');
    pass({
      changes: [
        { id: 'grows', contextIndices: [0], height: 50 },
        { id: 'grows', contextIndices: [1], height: 50 },
      ],
    });
    // Card 0: 10 + 50, 10 under it, 40, plus 8. Card 1: 10 + 50 plus 8.
    expect(temps()[`${LIST}-0`]).toEqual({ height: 118 });
    expect(temps()[`${LIST}-1`]).toEqual({ height: 68 });
  });
});

describe('dynamic height engine: a pack list’s rows', () => {
  it('[DynamicHeight-ENGINE-052] places a row’s components and leaves the row to the pack', () => {
    // The host sizes each row from where its components were placed (usePackHost.fittedRowHeight), with the row
    // height the pack's own code chose; the engine does not know it, so it writes no row height.
    seedApp(rowsPage('PackComponent', DH));
    const { patch } = pass({ changes: [{ id: 'grows', contextIndices: [1], height: 100 }] });
    expect(patch).toEqual({ 'grows-1': { top: 10, height: 100 }, 'under-1': { top: 120, height: 40 } });
  });

  it('[DynamicHeight-ENGINE-053] places every row the pack drew when the whole module is solved', () => {
    seedApp(rowsPage('PackComponent', DH));
    s().initExposedValueArrayForChildren(LIST, 2, 'canvas', []);
    s().setTemporaryLayouts({ 'grows-1': { top: 10, height: 100 } });
    pass({ fullModules: ['canvas'] });
    expect(temps()['under-1']).toEqual({ top: 120, height: 40 });
    expect(temps()[`${LIST}-1`]).toBeUndefined();
  });
});
