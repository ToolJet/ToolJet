/**
 * Listview 2.0 drag-resize of the record height (tj-ee#5560). Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md
 * (Listview-RSZ-001..004). Real store, real RenderWidget, the real handle element and the real, unmocked resize hook.
 *
 * The pointer is driven the way a browser does it: mousedown on the handle, mousemove and mouseup on `document`.
 * jsdom does no layout (clientHeight is 0), so the start height must come from the saved property, not from the DOM.
 */
import { fireEvent, waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';

// Wraps, never replaces: counts how often each record re-renders.
jest.mock('@/_hooks/useDynamicHeight', () => {
  const actual = jest.requireActual('@/_hooks/useDynamicHeight');
  return { ...actual, useDynamicHeight: jest.fn((...args) => actual.useDynamicHeight(...args)) };
});
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';

const ID = 'lv1';
const INNER = 'lv2';
const records = (count) =>
  `{{${JSON.stringify(Array.from({ length: count }, (_, index) => ({ name: `r${index}` })))}}}`;

function child(id, name, type, properties, parent = ID) {
  const definition = componentDefinition(id, name, type, properties);
  definition.component.parent = parent;
  definition.component.definition.styles = {};
  definition.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
  };
  return definition;
}

const baseProperties = {
  dataSourceSelector: binding('rawJson'),
  data: binding(records(7)),
  mode: binding('list'),
  columns: binding('{{1}}'),
  rowHeight: binding('100'),
  loadingState: binding('{{false}}'),
  dynamicHeight: binding('{{false}}'),
  visibility: binding('{{true}}'),
  collapseWhenHidden: binding('{{false}}'),
  disabledState: binding('{{false}}'),
  showBorder: binding('{{true}}'),
  rowsPerPage: binding('{{3}}'),
  enablePagination: binding('{{true}}'),
};
const baseStyles = {
  backgroundColor: binding('var(--cc-surface1-surface)'),
  borderColor: binding('var(--cc-weak-border)'),
};

const textChild = () => child('txt1', 'text1', 'Text', { text: binding('{{listItem.name}}') });

const widget = createWidgetHarness({
  componentType: 'Listview',
  handle: 'listview1',
  id: ID,
  defaultProperties: baseProperties,
  defaultStyles: baseStyles,
  defaultExtraComponents: { txt1: textChild() },
  capabilities: { dnd: true },
  widgetHeight: 800,
  widgetWidth: 600,
});

const NESTED = `{{[{ name: 'o1', items: [{ name: 'a' }, { name: 'b' }] }, { name: 'o2', items: [{ name: 'c' }, { name: 'd' }] }]}}`;
const innerListview = () =>
  child(INNER, 'listview2', 'Listview', {
    ...baseProperties,
    data: binding('{{listItem.items}}'),
    rowsPerPage: binding('{{10}}'),
    enablePagination: binding('{{false}}'),
    rowHeight: binding('100'),
  });
const innerText = () => child('txt2', 'text2', 'Text', { text: binding('{{listItem.name}}') }, INNER);

const nestedWidget = createWidgetHarness({
  componentType: 'Listview',
  handle: 'listview1',
  id: ID,
  defaultProperties: {
    ...baseProperties,
    data: binding(NESTED),
    rowsPerPage: binding('{{1}}'),
    rowHeight: binding('250'),
  },
  defaultStyles: baseStyles,
  defaultExtraComponents: { [INNER]: innerListview(), txt2: innerText() },
  capabilities: { dnd: true },
  widgetHeight: 900,
  widgetWidth: 600,
});

const rows = () => [...document.querySelectorAll('.list-item')];
const handles = () => [...document.querySelectorAll('.list-item .resize-handle')];
const heights = () => rows().map((row) => row.style.height);
const faded = () => rows().map((row) => row.style.opacity === '0.4');
const raw = (key, id = ID) => store().getComponentDefinition(id, MODULE_ID).component.definition.properties[key];

const START_Y = 300;
// A drag as the browser sends it; `moves` are clientY offsets from the mousedown, the last one is where the button is released.
function drag(handle, moves, { button = 0 } = {}) {
  fireEvent.mouseDown(handle, { clientX: 0, clientY: START_Y, button });
  moves.forEach((delta) => fireEvent.mouseMove(document, { clientX: 0, clientY: START_Y + delta }));
  fireEvent.mouseUp(document, { clientX: 0, clientY: START_Y + (moves[moves.length - 1] ?? 0) });
}

async function mount(harness, options = {}, count = 3) {
  harness.render({ currentMode: 'edit', ...options });
  await waitFor(() => expect(rows()).toHaveLength(count));
}

describe('Listview record resize: the written height', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-RSZ-001] 100 dragged down 33 becomes 130', async () => {
    // Break this catches: no rounding to steps of 10 (133), or no write at all.
    await mount(widget);
    expect(heights()).toEqual(['100px', '100px', '100px']);

    drag(handles()[0], [33]);

    await waitFor(() => expect(raw('rowHeight').value).toBe(130));
    expect(heights()).toEqual(['130px', '130px', '130px']);
  });

  test.each([
    [34, 130],
    [35, 140],
    [-33, 70],
    [-36, 60],
    [-500, 10],
    [900, 1000],
    [1234, 1330],
  ])('[Listview-RSZ-001] 100 dragged by %i becomes %i', async (delta, expected) => {
    // Break this catches: rounding down instead of to the nearest 10, a drag up that grows, or a floor missing at 10 or a cap added above.
    await mount(widget);

    drag(handles()[0], [delta]);

    await waitFor(() => expect(raw('rowHeight').value).toBe(expected));
    expect(heights()[0]).toBe(`${expected}px`);
  });

  test('[Listview-RSZ-001] a record that starts off the 10-step grid snaps from its own height: 104 plus 36 is 140', async () => {
    // Break this catches: snapping the delta (104 + 40) instead of the resulting height, or starting from the DOM (0 in jsdom).
    await mount(widget, { properties: { rowHeight: binding('104') } });

    drag(handles()[0], [36]);

    await waitFor(() => expect(raw('rowHeight').value).toBe(140));
  });

  test('[Listview-RSZ-001] the last move wins, however far the pointer went on the way', async () => {
    // Break this catches: writing the largest move, or the first one.
    await mount(widget);

    drag(handles()[0], [200, -40, 52]);

    await waitFor(() => expect(raw('rowHeight').value).toBe(150));
  });

  test('[Listview-RSZ-001] the value is written as a number, so the Inspector field and the record read the same thing', async () => {
    // Break this catches: a string such as "130px" or "130" in the property.
    await mount(widget);

    drag(handles()[0], [30]);

    await waitFor(() => expect(typeof raw('rowHeight').value).toBe('number'));
  });

  test('[Listview-RSZ-001] a click without a move writes nothing', async () => {
    // Break this catches: a write on mouseup with the DOM height (0 in jsdom), or rewriting the same value.
    await mount(widget);

    drag(handles()[0], []);

    expect(raw('rowHeight')).toEqual({ value: '100' });
    expect(heights()).toEqual(['100px', '100px', '100px']);
  });

  test('[Listview-RSZ-001] dragging out and back to the start height writes nothing', async () => {
    // Break this catches: a write whenever any move happened.
    await mount(widget);

    drag(handles()[0], [60, 2]);

    expect(raw('rowHeight')).toEqual({ value: '100' });
  });

  test('[Listview-RSZ-001] a right-click on the handle does nothing', async () => {
    // Break this catches: a context-menu press starting a resize.
    await mount(widget);

    drag(handles()[0], [60], { button: 2 });

    expect(raw('rowHeight')).toEqual({ value: '100' });
    expect(faded()).toEqual([false, false, false]);
  });

  test('[Listview-RSZ-001] the records show the live height during the drag, and the property is written on release', async () => {
    // Break this catches: only record 1 following the pointer, or a write on every move.
    await mount(widget);
    const handle = handles()[0];

    fireEvent.mouseDown(handle, { clientX: 0, clientY: START_Y, button: 0 });
    fireEvent.mouseMove(document, { clientX: 0, clientY: START_Y + 40 });

    await waitFor(() => expect(heights()).toEqual(['140px', '140px', '140px']));
    expect(raw('rowHeight')).toEqual({ value: '100' });

    fireEvent.mouseUp(document, { clientX: 0, clientY: START_Y + 40 });

    await waitFor(() => expect(raw('rowHeight').value).toBe(140));
    expect(heights()).toEqual(['140px', '140px', '140px']);
  });

  test('[Listview-RSZ-001] one Undo restores the old height and one Redo brings the new one back', async () => {
    // Break this catches: a write that skips the undo stack, or one that leaves two entries for one drag.
    await mount(widget);
    drag(handles()[0], [33]);
    await waitFor(() => expect(raw('rowHeight').value).toBe(130));

    await widget.session.store.act(() => store().handleUndo());

    await waitFor(() => expect(raw('rowHeight').value).toBe('100'));
    await waitFor(() => expect(heights()).toEqual(['100px', '100px', '100px']));

    await widget.session.store.act(() => store().handleRedo());

    await waitFor(() => expect(raw('rowHeight').value).toBe(130));
  });

  test('[Listview-RSZ-001] a click on the handle does not select the record', async () => {
    // Break this catches: the click that ends a drag reaching the record, so a resize also fires Record clicked.
    await mount(widget);

    drag(handles()[0], [30]);
    fireEvent.click(handles()[0]);
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(widget.exposed()?.selectedRecordIndex).toBeUndefined();
  });
});

describe('Listview record resize: no upper limit, a floor of 10 that never jumps', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test.each([
    ['600', -5, null],
    ['600', 33, 630],
    ['5', -20, null],
    ['8', -3, null],
    ['5', 33, 40],
  ])('[Listview-RSZ-001] saved %s dragged by %i writes %p', async (saved, delta, expected) => {
    // Break this catches: a cap that pulls 600 down to its limit on the first pixel, or a floor that lifts 5 or 8 to 10 when dragging up.
    await mount(widget, { properties: { rowHeight: binding(saved) } });
    const handle = handles()[0];

    fireEvent.mouseDown(handle, { clientX: 0, clientY: START_Y, button: 0 });
    fireEvent.mouseMove(document, { clientX: 0, clientY: START_Y + delta });
    if (expected === null) expect(heights()[0]).toBe(`${saved}px`);
    fireEvent.mouseUp(document, { clientX: 0, clientY: START_Y + delta });

    if (expected === null) expect(raw('rowHeight')).toEqual({ value: saved });
    else await waitFor(() => expect(raw('rowHeight').value).toBe(expected));
  });

  test('[Listview-RSZ-001] a capitalised Grid layout writes the grid key', async () => {
    // Break this catches: comparing the layout without lower-casing, so "Grid" shows the grid height and writes rowHeight.
    await mount(widget, {
      properties: { mode: binding('Grid'), columns: binding('{{2}}'), gridRecordHeight: binding('150') },
    });

    drag(handles()[0], [33]);

    await waitFor(() => expect(raw('gridRecordHeight').value).toBe(180));
    expect(raw('rowHeight')).toEqual({ value: '100' });
  });
});

describe('Listview record resize: the click that ends a drag', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
  const dragThenRelease = (distance = 30) => {
    fireEvent.mouseDown(handles()[0], { clientX: 0, clientY: START_Y, button: 0 });
    fireEvent.mouseMove(document, { clientX: 0, clientY: START_Y + distance });
    fireEvent.mouseUp(document, { clientX: 0, clientY: START_Y + distance });
  };

  test.each([
    ['the record body', () => rows()[0]],
    ['a child in the record', () => document.querySelector('.ele-txt1')],
  ])('[Listview-RSZ-001] a release over %s does not select record 1', async (_name, target) => {
    // Break this catches: the click a browser sends to the common ancestor of the press and the release reaching the record, so a resize selects it and fires Record clicked.
    await mount(widget);
    dragThenRelease();

    fireEvent.click(target());
    await settle();

    expect(widget.exposed()?.selectedRecordIndex).toBeUndefined();
  });

  test('[Listview-RSZ-001] only that one click is ignored: the next click selects the record', async () => {
    // Break this catches: a guard that stays on, so record 1 can no longer be selected after a resize.
    await mount(widget);
    dragThenRelease();
    fireEvent.click(rows()[0]);
    await settle();

    fireEvent.click(rows()[0]);

    await waitFor(() => expect(widget.exposed()?.selectedRecordIndex).toBe(0));
  });

  test('[Listview-RSZ-001] when no click follows the release, the next press and click select the record', async () => {
    // Break this catches: a guard that waits for a click that never came and eats the next real one.
    await mount(widget);
    dragThenRelease();

    fireEvent.mouseDown(rows()[0], { clientX: 0, clientY: START_Y, button: 0 });
    fireEvent.mouseUp(rows()[0]);
    fireEvent.click(rows()[0]);

    await waitFor(() => expect(widget.exposed()?.selectedRecordIndex).toBe(0));
  });
});

describe('Listview record resize: cleanup and rendering', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-RSZ-001] unmounting during a drag drops the listeners, so a later release writes nothing', async () => {
    // Break this catches: document listeners that outlive the ListView and write from a stale render.
    await mount(widget);
    const view = widget.render({ currentMode: 'edit' });
    fireEvent.mouseDown(handles()[0], { clientX: 0, clientY: START_Y, button: 0 });
    fireEvent.mouseMove(document, { clientX: 0, clientY: START_Y + 40 });

    view.unmount();
    fireEvent.mouseMove(document, { clientX: 0, clientY: START_Y + 80 });
    fireEvent.mouseUp(document, { clientX: 0, clientY: START_Y + 80 });

    expect(raw('rowHeight')).toEqual({ value: '100' });
  });

  test('[Listview-RSZ-001] the page shows a resize cursor for the whole drag and not after it', async () => {
    // Break this catches: the cursor falling back to the default once the pointer leaves the 8px handle.
    await mount(widget);
    expect(document.body.classList.contains('listview-record-resizing')).toBe(false);

    fireEvent.mouseDown(handles()[0], { clientX: 0, clientY: START_Y, button: 0 });
    await waitFor(() => expect(document.body.classList.contains('listview-record-resizing')).toBe(true));
    fireEvent.mouseUp(document);

    await waitFor(() => expect(document.body.classList.contains('listview-record-resizing')).toBe(false));
  });

  test('[Listview-RSZ-001] a ListView re-render that changes nothing for record 1 does not re-render record 1', async () => {
    // Break this catches: a fresh handle object per render, which defeats the record's memo on every hover.
    await mount(widget);
    const recordOneRenders = () =>
      useDynamicHeight.mock.calls.filter(([options]) => options.subContainerIndex === 0).length;
    const before = recordOneRenders();

    fireEvent.mouseEnter(rows()[2]);
    fireEvent.mouseEnter(rows()[0]);
    await waitFor(() => expect(faded()).toEqual([false, true, true]));

    expect(recordOneRenders()).toBe(before);
  });
});

describe.each(['legacy', 'bordered', 'container', 'plain'])('Listview record resize: %s style', (listStyle) => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test(`[Listview-RSZ-001] ${listStyle}: a 33 drag writes the snapped 130, not the DOM height`, async () => {
    // Break this catches: writing clientHeight, which a Container card's 2px border makes 128 (and 0 in jsdom).
    await mount(widget, { styles: { listStyle: binding(listStyle) } });

    drag(handles()[0], [33]);

    await waitFor(() => expect(raw('rowHeight').value).toBe(130));
    expect(heights()).toEqual(['130px', '130px', '130px']);
  });
});

describe('Listview record resize: which record has the handle', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-RSZ-001] only record 1 has a handle, inside the record', async () => {
    // Break this catches: a handle on every record.
    await mount(widget);

    expect(handles()).toHaveLength(1);
    expect(rows()[0].contains(handles()[0])).toBe(true);
  });

  test('[Listview-RSZ-001] page 2 has no handle, not even on its first record', async () => {
    // Break this catches: gating on the page-relative index, so record 1 of every page can be resized.
    await mount(widget);
    await widget.act('setPage', 2);
    await waitFor(() => expect(document.querySelector('.ele-txt1')?.textContent).toContain('r3'));

    expect(handles()).toHaveLength(0);
  });

  test('[Listview-RSZ-001] preview has no handle', async () => {
    // Break this catches: the builder handle shown in the viewer.
    await mount(widget, { currentMode: 'view' });

    expect(handles()).toHaveLength(0);
  });

  test('[Listview-RSZ-001] the handle is only for the layout key that is saved: an expression in the other key does not hide it', async () => {
    // Break this catches: any expression in the properties hiding the handle.
    await mount(widget, { properties: { gridRecordHeight: binding('{{150}}') } });

    expect(handles()).toHaveLength(1);
  });
});

describe('Listview record resize: Record height holds an expression', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const expressionHeight = {
    properties: { rowHeight: binding('{{components.text2.text}}') },
    extraComponents: { txt2: { ...child('txt2', 'text2', 'Text', { text: binding('120') }, 'canvas') } },
  };

  test('[Listview-RSZ-002] there is no handle, and the expression and the height are unchanged', async () => {
    // Break this catches: a handle on a dynamic height, which would overwrite the expression with a number.
    await mount(widget, expressionHeight);

    expect(handles()).toHaveLength(0);
    expect(raw('rowHeight')).toEqual({ value: '{{components.text2.text}}' });
  });

  test('[Listview-RSZ-002] pressing, moving and releasing on any element of record 1 leaves the expression alone', async () => {
    // Break this catches: any element of the record, not only the handle, starting a resize that overwrites the expression.
    await mount(widget, expressionHeight);

    [rows()[0], ...rows()[0].querySelectorAll('*')].forEach((node) => {
      fireEvent.mouseDown(node, { clientX: 0, clientY: START_Y, button: 0 });
      fireEvent.mouseMove(document, { clientX: 0, clientY: START_Y + 50 });
      fireEvent.mouseUp(document, { clientX: 0, clientY: START_Y + 50 });
    });

    expect(raw('rowHeight')).toEqual({ value: '{{components.text2.text}}' });
    expect(faded()).toEqual([false, false, false]);
  });

  test('[Listview-RSZ-002] a grid that falls back to an expression in Record height has no handle either', async () => {
    // Break this catches: reading only gridRecordHeight, so a grid showing rowHeight's expression gets a handle that would shadow it.
    await mount(widget, {
      properties: { ...expressionHeight.properties, mode: binding('grid'), columns: binding('{{2}}') },
      extraComponents: expressionHeight.extraComponents,
    });

    expect(handles()).toHaveLength(0);
  });
});

describe('Listview record resize: the other records fade', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-RSZ-003] records 2..K fade from mousedown to mouseup and not before or after', async () => {
    // Break this catches: no fade, a fade on record 1, a fade that starts on the first move, or one that sticks after release.
    await mount(widget);
    expect(faded()).toEqual([false, false, false]);

    fireEvent.mouseDown(handles()[0], { clientX: 0, clientY: START_Y, button: 0 });
    await waitFor(() => expect(faded()).toEqual([false, true, true]));

    fireEvent.mouseMove(document, { clientX: 0, clientY: START_Y + 30 });
    expect(faded()).toEqual([false, true, true]);

    fireEvent.mouseUp(document, { clientX: 0, clientY: START_Y + 30 });
    await waitFor(() => expect(faded()).toEqual([false, false, false]));
  });

  test('[Listview-RSZ-003] a click without a move fades for the press and then restores', async () => {
    // Break this catches: the fade cleared only when a height was written.
    await mount(widget);

    fireEvent.mouseDown(handles()[0], { clientX: 0, clientY: START_Y, button: 0 });
    await waitFor(() => expect(faded()).toEqual([false, true, true]));
    fireEvent.mouseUp(document);

    await waitFor(() => expect(faded()).toEqual([false, false, false]));
  });
});

describe('Listview record resize: grid layout', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const grid = (extra = {}) => ({
    properties: { mode: binding('grid'), columns: binding('{{2}}'), rowHeight: binding('90'), ...extra },
  });

  test('[Listview-RSZ-004] a grid resize writes gridRecordHeight and leaves rowHeight', async () => {
    // Break this catches: the grid drag writing rowHeight.
    await mount(widget, grid({ gridRecordHeight: binding('150') }));
    expect(heights()[0]).toBe('150px');

    drag(handles()[0], [33]);

    await waitFor(() => expect(raw('gridRecordHeight').value).toBe(180));
    expect(raw('rowHeight')).toEqual({ value: '90' });
    expect(heights()[0]).toBe('180px');
  });

  test('[Listview-RSZ-004] a saved grid without gridRecordHeight starts from rowHeight and adds gridRecordHeight', async () => {
    // Break this catches: starting from a missing key (NaN) or writing the fallback back into rowHeight.
    await mount(widget, grid());
    expect(heights()[0]).toBe('90px');

    drag(handles()[0], [40]);

    await waitFor(() => expect(raw('gridRecordHeight').value).toBe(130));
    expect(raw('rowHeight')).toEqual({ value: '90' });
  });

  test('[Listview-RSZ-004] a list resize leaves gridRecordHeight alone', async () => {
    // Break this catches: the list drag writing both keys.
    await mount(widget, { properties: { gridRecordHeight: binding('150') } });

    drag(handles()[0], [33]);

    await waitFor(() => expect(raw('rowHeight').value).toBe(130));
    expect(raw('gridRecordHeight')).toEqual({ value: '150' });
  });
});

describe('Listview record resize: nested ListView', () => {
  beforeEach(nestedWidget.setup);
  afterEach(nestedWidget.teardown);

  // The inner handle sits in a record that is itself inside the outer record.
  const outerHandle = () => handles().find((handle) => !handle.parentElement.parentElement.closest('.list-item'));
  const innerHandle = () => handles().find((handle) => handle.parentElement.parentElement.closest('.list-item'));

  test('[Listview-RSZ-001] each ListView has one handle, on its own main record', async () => {
    // Break this catches: a handle on every inner record, or none on the inner list.
    nestedWidget.render({ currentMode: 'edit' });
    await waitFor(() => expect(document.querySelectorAll('.ele-txt2')).toHaveLength(2));

    expect(handles()).toHaveLength(2);
    expect(outerHandle()).toBeDefined();
    expect(innerHandle()).toBeDefined();
  });

  test('[Listview-RSZ-001] resizing the inner record writes only the inner key', async () => {
    // Break this catches: the inner drag writing the outer ListView's Record height.
    nestedWidget.render({ currentMode: 'edit' });
    await waitFor(() => expect(document.querySelectorAll('.ele-txt2')).toHaveLength(2));

    drag(innerHandle(), [30]);

    await waitFor(() => expect(raw('rowHeight', INNER).value).toBe(130));
    expect(raw('rowHeight')).toEqual({ value: '250' });
  });

  test('[Listview-RSZ-001] resizing the outer record writes only the outer key', async () => {
    // Break this catches: the outer drag writing the inner ListView's Record height.
    nestedWidget.render({ currentMode: 'edit' });
    await waitFor(() => expect(document.querySelectorAll('.ele-txt2')).toHaveLength(2));

    drag(outerHandle(), [50]);

    await waitFor(() => expect(raw('rowHeight').value).toBe(300));
    expect(raw('rowHeight', INNER)).toEqual({ value: '100' });
  });

  test('[Listview-RSZ-001] on outer page 2 the inner list is a copy and has no handle', async () => {
    // Break this catches: the inner lock reading the page-relative outer index.
    nestedWidget.render({ currentMode: 'edit' });
    await waitFor(() => expect(document.querySelectorAll('.ele-txt2')).toHaveLength(2));

    await nestedWidget.act('setPage', 2);
    await waitFor(() => expect(copyTexts()).toEqual(['c', 'd']));

    expect(handles()).toHaveLength(0);
  });
});

const copyTexts = () => [...document.querySelectorAll('.ele-txt2')].map((node) => node.textContent.slice(-1));
