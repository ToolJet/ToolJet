/**
 * The dynamic height engine and List view rows: each row is the list's canvas drawn at that row (its context ends in
 * the row's index), as tall as its own content; the list is its rows stacked. Also how a pass fails.
 *
 * Runs on the real composed store, seeded through `seedApp`, as engine.spec.js does.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, binding } from '@/test/app-builder';
import { ROOT_CANVAS, flushDynamicHeight } from '../../engine';
import { bootModule, uuid, widget } from './dynamicHeightPage';

const s = () => useStore.getState();
const pass = (options) => flushDynamicHeight(useStore.getState, options);
const temps = () => s().temporaryLayouts;

const DH = { dynamicHeight: binding('{{true}}') };

const LIST = uuid(1);
const INNER = uuid(2);
const FLEX = uuid(3);

// A List view with `rows` rows of data, rows 100 high, no border or pagination: its chrome is 18px (listviewHeight.js).
const listProperties = (rows) => ({
  ...DH,
  dataSourceSelector: binding('rawJson'),
  // Rows as objects, as a List view's data is (the store resolves a list of plain numbers to no rows).
  data: binding(`{{${JSON.stringify(Array.from({ length: rows }, (_, n) => ({ n })))}}}`),
  rowHeight: binding('{{100}}'),
  showBorder: binding('{{false}}'),
});

// Three rows, each holding a widget that grows and one 20px under it (a row's content fills 100); the list is drawn at
// its rows' height, 3 × 100 + 18, with a widget 20px under it.
const listPage = (belowTop = 60) => ({
  [LIST]: widget(LIST, 'Listview', { top: 0, height: 318, properties: listProperties(3) }),
  rowText: widget('rowText', 'Text', { parent: LIST, top: 0, properties: DH }),
  rowBelow: widget('rowBelow', 'Text', { parent: LIST, top: belowTop }),
  after: widget('after', 'Text', { top: 338 }),
});

describe('dynamic height engine: List view rows', () => {
  it('[DynamicHeight-ENGINE-028] grows only the row a component grew in, then the list, then what is below it', () => {
    seedApp(listPage());
    pass({ changes: [{ id: 'rowText', contextIndices: [1], height: 200 }] });
    expect(temps()).toEqual({
      'rowText-1': { top: 0, height: 200 },
      'rowBelow-1': { top: 220, height: 40 },
      // The row: only its height (the List view draws its rows itself).
      [`${LIST}-1`]: { height: 260 },
      // Rows not sized yet take what the row's components fill as drawn: 100 + 260 + 100 + 18.
      [LIST]: { top: 0, height: 478 },
      after: { top: 498, height: 40 },
    });

    // Row 0 grows later: row 1 keeps the height it was given. 210 + 260 + 100 + 18.
    pass({ changes: [{ id: 'rowText', contextIndices: [0], height: 150 }] });
    expect(temps()[LIST]).toEqual({ top: 0, height: 588 });
  });

  it('[DynamicHeight-ENGINE-029] sizes a row that asks for it', () => {
    seedApp(listPage());
    pass({ changes: [{ id: LIST, contextIndices: [0] }] });
    expect(temps()).toEqual({ [`${LIST}-0`]: { height: 100 } });
    // Asked again at the same height: nothing to write.
    expect(pass({ changes: [{ id: LIST, contextIndices: [0] }] }).patch).toEqual({});
  });

  it('[DynamicHeight-ENGINE-035] gives a row with nothing on it the Row height', () => {
    seedApp({ [LIST]: widget(LIST, 'Listview', { top: 0, height: 318, properties: listProperties(3) }) });
    pass({ changes: [{ id: LIST, contextIndices: [0] }] });
    expect(temps()).toEqual({ [`${LIST}-0`]: { height: 100 } });
  });

  it('[DynamicHeight-ENGINE-030] carries a change in a nested list out through every row around it', () => {
    // An outer list of 2 rows, each holding an inner list (drawn 300 high) of 2 rows of one widget.
    seedApp({
      [LIST]: widget(LIST, 'Listview', { top: 0, height: 218, properties: listProperties(2) }),
      [INNER]: widget(INNER, 'Listview', { parent: LIST, top: 0, height: 300, properties: listProperties(2) }),
      deep: widget('deep', 'Text', { parent: INNER, top: 0, properties: DH }),
    });
    pass({ changes: [{ id: 'deep', contextIndices: [1, 0], height: 100 }] });
    expect(temps()).toEqual({
      'deep-1.0': { top: 0, height: 100 },
      [`${INNER}-1.0`]: { height: 100 },
      // Inside a row the inner list fits its rows both ways, below its drawn 300: 100 + 40 (its unsized row) + 18.
      [`${INNER}-1`]: { top: 0, height: 158 },
      [`${LIST}-1`]: { height: 158 },
      // The outer list's unsized row takes its template (the inner list as drawn, 300): 300 + 158 + 18.
      [LIST]: { top: 0, height: 476 },
    });
  });

  it('[DynamicHeight-ENGINE-031] places every row again after a saved layout changed', () => {
    seedApp(listPage());
    pass({ changes: [{ id: 'rowText', contextIndices: [1], height: 200 }] });

    // The builder moves the lower widget 40px down.
    seedApp(listPage(100));
    const { solvedSlots } = pass({ fullModules: ['canvas'] });
    expect(solvedSlots).toEqual([`${LIST}-0`, `${LIST}-1`, `${LIST}-2`, ROOT_CANVAS]);
    expect(temps()['rowBelow-1']).toEqual({ top: 260, height: 40 });
    expect(temps()[`${LIST}-0`]).toEqual({ height: 140 });
    expect(temps()[`${LIST}-1`]).toEqual({ height: 300 });
    expect(temps()[LIST]).toEqual({ top: 0, height: 140 + 300 + 140 + 18 });
  });

  it('[DynamicHeight-ENGINE-036] places the rows of each module instance by its own row count', () => {
    // One module used twice: the same List view id in both, with 2 rows in one and 3 in the other.
    const FIRST = uuid(50);
    const SECOND = uuid(51);
    seedApp({
      [FIRST]: widget(FIRST, 'ModuleViewer', { top: 0, height: 300 }),
      [SECOND]: widget(SECOND, 'ModuleViewer', { top: 320, height: 300 }),
    });
    for (const [instance, rows] of [
      [FIRST, 2],
      [SECOND, 3],
    ]) {
      bootModule(instance);
      seedApp(
        {
          [LIST]: widget(LIST, 'Listview', { top: 0, height: 318, properties: listProperties(rows) }),
          rowText: widget('rowText', 'Text', { parent: LIST, top: 0, properties: DH }),
        },
        { moduleId: instance }
      );
    }
    const { solvedSlots } = pass({ fullModules: [FIRST, SECOND] });
    const rowsOf = (instance) => solvedSlots.filter((slot) => slot.startsWith(`${instance}::${LIST}-`));
    expect(rowsOf(FIRST)).toHaveLength(2);
    expect(rowsOf(SECOND)).toHaveLength(3);
  });

  it('[DynamicHeight-ENGINE-032] leaves alone a component of a List view asked about without its row', () => {
    seedApp(listPage());
    const { patch } = pass({ changes: [{ id: 'rowText', height: 200 }] });
    expect(patch).toEqual({});
  });
});

describe('dynamic height engine: a failing pass', () => {
  // `measureWidth` is the caller's: here it fails for the FlexContainer, so sizing it throws.
  const failingPage = () => ({
    [FLEX]: widget(FLEX, 'FlexContainer', {
      top: 0,
      properties: { ...DH, direction: binding('row'), flexWrap: binding('{{true}}') },
    }),
    inFlex: widget('inFlex', 'Text', { parent: FLEX, top: 0 }),
    a: widget('a', 'Text', { top: 0, left: 20, properties: DH }),
    b: widget('b', 'Text', { top: 60, left: 20 }),
  });
  const failure = new Error('width not readable');
  const failingPass = (options) =>
    pass({
      changes: [{ id: FLEX }, { id: 'a', height: 100 }],
      measureWidth: () => {
        throw failure;
      },
      ...options,
    });

  it('[DynamicHeight-ENGINE-033] throws outside production, and writes nothing', () => {
    seedApp(failingPage());
    expect(() => failingPass()).toThrow(failure);
    expect(temps()).toEqual({});
  });

  it('[DynamicHeight-ENGINE-034] in production, writes the rest of the pass, logs the failure and reports its module once', () => {
    seedApp(failingPage());
    const environment = process.env.NODE_ENV;
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    const onError = jest.fn();
    let logged;
    try {
      process.env.NODE_ENV = 'production';
      failingPass({ onError });
    } finally {
      process.env.NODE_ENV = environment;
      logged = log.mock.calls; // read before mockRestore, which clears them
      log.mockRestore();
    }
    expect(temps()).toEqual({ a: { top: 0, height: 100 }, b: { top: 120, height: 40 } });
    expect(logged).toEqual([['dynamic height: could not size', FLEX, failure]]);
    expect(onError.mock.calls).toEqual([['canvas', failure]]);
  });
});
