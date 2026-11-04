/**
 * Listview 2.0 builder editing and hover rules (tj-ee#5559): only record 1 of page 1 is editable, the others
 * fade and outline around it. Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md
 * (Listview-BLD-001..009). Real store, real RenderWidget, real children in every record.
 *
 * jsdom does no layout and drops var(): visuals are asserted as classes, inline opacity and store state.
 */
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding, store } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import { handleDeactivateTargets, showGridLines } from '@/AppBuilder/AppCanvas/Grid/gridUtils';

// The grid background needs react-dnd's drag layer; jsdom has no drag, so the flag is flipped per test.
const mockDragLayer = { on: false };
jest.mock('react-dnd', () => {
  const actual = jest.requireActual('react-dnd');
  return {
    ...actual,
    useDragLayer: (collect) =>
      mockDragLayer.on ? { isDragging: true, clientOffset: null, draggedItem: null } : actual.useDragLayer(collect),
  };
});

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
  widgetHeight: 600,
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
  widgetHeight: 800,
  widgetWidth: 600,
});

const user = () => widget.session.user;
const rows = () => [...document.querySelectorAll('.list-item')];
const copiesOf = (id) => [...document.querySelectorAll(`.ele-${id}`)];
const editable = (id) => copiesOf(id).map((node) => node.classList.contains('moveable-box'));
const dotted = (id) => copiesOf(id).map((node) => node.classList.contains('listview-copy-outline'));
const faded = () => rows().map((row) => row.style.opacity === '0.4');
const framed = () => rows().map((row) => row.classList.contains('listview-record-moving'));
const gridded = () => rows().map((row) => !!row.querySelector('.show-grid'));
const act = (fn) => widget.session.store.act(fn);

async function mount(harness, options = {}, count = 3) {
  harness.render({ currentMode: 'edit', ...options });
  await waitFor(() => expect(rows()).toHaveLength(count));
}

const serverProperties = {
  data: binding(records(3)),
  serverSidePagination: binding('{{true}}'),
  totalRecords: binding('{{7}}'),
};

afterEach(() => {
  mockDragLayer.on = false;
  store().setDraggingComponentId?.(null);
  store().setResizingComponentId?.(null);
});

describe('Listview builder: only record 1 of page 1 is editable', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-BLD-001] client pagination: record 1 of page 1 is editable, record 1 of page 2 is not', async () => {
    // Break this catches: gating on the page-relative index, so the first record of every page is editable.
    await mount(widget);
    await waitFor(() => expect(editable('txt1')).toEqual([true, false, false]));

    await widget.act('setPage', 2);

    await waitFor(() => expect(document.querySelector('.ele-txt1')?.textContent).toContain('r3'));
    await waitFor(() => expect(editable('txt1')).toEqual([false, false, false]));
  });

  test('[Listview-BLD-002] server pagination: record 1 of page 2 is not editable', async () => {
    // Break this catches: the server rows (whole data, page-relative index) making page 2's first record editable.
    await mount(widget, { properties: serverProperties });
    await waitFor(() => expect(editable('txt1')).toEqual([true, false, false]));

    await widget.act('setPage', 2);

    await waitFor(() => expect(widget.exposed()?.pageIndex).toBe(2));
    await waitFor(() => expect(editable('txt1')).toEqual([false, false, false]));
  });
});

describe('Listview builder: a nested list', () => {
  beforeEach(nestedWidget.setup);
  afterEach(nestedWidget.teardown);

  test('[Listview-BLD-003] a nested list in record 1 of page 2 is read-only; on page 1 only its first record is editable', async () => {
    // Break this catches: the lock reading the outer page-relative index, so page 2's first outer record stays editable.
    await mount(nestedWidget, {}, 3);
    await waitFor(() => expect(editable('txt2')).toEqual([true, false]));

    await nestedWidget.act('setPage', 2);

    await waitFor(() => expect(copiesOf('txt2').map((node) => node.textContent.slice(-1))).toEqual(['c', 'd']));
    await waitFor(() => expect(editable('txt2')).toEqual([false, false]));
  });
});

describe('Listview builder: fade around the main record', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-BLD-005] hovering the main record fades records 2..K to 40% and leaving restores them', async () => {
    // Break this catches: no fade, a fade on the main record, or one that sticks after the pointer leaves.
    await mount(widget);
    expect(faded()).toEqual([false, false, false]);

    await user().hover(rows()[0]);
    await waitFor(() => expect(faded()).toEqual([false, true, true]));

    await user().unhover(rows()[0]);
    await waitFor(() => expect(faded()).toEqual([false, false, false]));
  });

  test('[Listview-BLD-005] hovering record 2 or 3 does nothing', async () => {
    // Break this catches: any record, not only the main one, starting the fade.
    await mount(widget);

    await user().hover(rows()[1]);

    expect(faded()).toEqual([false, false, false]);
    expect(framed()).toEqual([false, false, false]);
  });

  test('[Listview-BLD-005] the fade holds for the whole drag and resize of a component in the main record', async () => {
    // Break this catches: the fade tied to the pointer only, so it drops the moment the drag leaves record 1.
    await mount(widget);

    await act(() => store().setDraggingComponentId('txt1'));
    await waitFor(() => expect(faded()).toEqual([false, true, true]));
    await act(() => store().setDraggingComponentId(null));
    await waitFor(() => expect(faded()).toEqual([false, false, false]));

    await act(() => store().setResizingComponentId('txt1'));
    await waitFor(() => expect(faded()).toEqual([false, true, true]));
    await act(() => store().setResizingComponentId(null));
    await waitFor(() => expect(faded()).toEqual([false, false, false]));
  });

  test('[Listview-BLD-005] dragging a component that is not in the list does not fade it', async () => {
    // Break this catches: any drag on the page fading every list.
    await mount(widget);

    await act(() => store().setDraggingComponentId('somewhere-else'));

    expect(faded()).toEqual([false, false, false]);
  });

  test('[Listview-BLD-005] on page 2 there is no main record, so nothing fades', async () => {
    // Break this catches: the first record of page 2 acting as the main record.
    await mount(widget);
    await widget.act('setPage', 2);
    await waitFor(() => expect(document.querySelector('.ele-txt1')?.textContent).toContain('r3'));

    await user().hover(rows()[0]);
    await act(() => store().setDraggingComponentId('txt1'));

    expect(faded()).toEqual([false, false, false]);
    expect(framed()).toEqual([false, false, false]);
  });

  test('[Listview-BLD-005] moving or resizing inside record 1 gives it a thin outline that adds no layout', async () => {
    // Break this catches: no frame around the record being edited, or one drawn as a border that shifts the layout.
    await mount(widget);
    expect(framed()).toEqual([false, false, false]);

    await act(() => store().setDraggingComponentId('txt1'));

    await waitFor(() => expect(framed()).toEqual([true, false, false]));
    expect(rows()[0].style.border).toBe('');
  });
});

describe('Listview builder: outlines on copies', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-BLD-006] a component selected in record 1 keeps its solid outline and its copies get the dotted one', async () => {
    // Break this catches: copies with no dotted outline, a dotted outline on the main one, or one left after deselect.
    await mount(widget);
    expect(dotted('txt1')).toEqual([false, false, false]);

    await act(() => store().setSelectedComponents(['txt1']));

    await waitFor(() => expect(dotted('txt1')).toEqual([false, true, true]));
    expect(copiesOf('txt1')[0].classList.contains('active-target')).toBe(true);

    await act(() => store().setSelectedComponents([]));
    await waitFor(() => expect(dotted('txt1')).toEqual([false, false, false]));
  });

  test('[Listview-BLD-007] hovering a component in record 3 outlines only that one, and hovering the record does not', async () => {
    // Break this catches: the hover outlining every copy of the component, or the record itself.
    await mount(widget);

    await user().hover(rows()[2]);
    expect(dotted('txt1')).toEqual([false, false, false]);

    await user().hover(copiesOf('txt1')[2]);
    await waitFor(() => expect(dotted('txt1')).toEqual([false, false, true]));

    await user().unhover(copiesOf('txt1')[2]);
    await waitFor(() => expect(dotted('txt1')).toEqual([false, false, false]));
  });

  test('[Listview-BLD-007] clicking a component in record 3 leaves the selection unchanged', async () => {
    // Break this catches: a click on a copy selecting it (or clearing the selection).
    await mount(widget);
    await act(() => store().setSelectedComponents(['txt1']));

    await user().click(copiesOf('txt1')[2]);

    expect(store().selectedComponents).toEqual(['txt1']);

    await act(() => store().setSelectedComponents([]));
    await user().click(copiesOf('txt1')[2]);
    expect(store().selectedComponents).toEqual([]);
  });
});

describe('Listview builder: grid background while dragging', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-BLD-001] only record 1 of page 1 shows the grid while dragging, never record 1 of page 2', async () => {
    // Break this catches: the grid gate reading the page-relative index, so page 2's first record shows the grid.
    mockDragLayer.on = true;
    await mount(widget);
    expect(gridded()).toEqual([true, false, false]);

    await widget.act('setPage', 2);
    await waitFor(() => expect(document.querySelector('.ele-txt1')?.textContent).toContain('r3'));

    expect(gridded()).toEqual([false, false, false]);
  });

  test('[Listview-BLD-008] preview shows no grid while dragging', async () => {
    // Break this catches: the grid shown outside the builder.
    mockDragLayer.on = true;
    await mount(widget, { currentMode: 'view' });

    expect(gridded()).toEqual([false, false, false]);
  });

  test('[Listview-BLD-001] the record background sits on the record, under a transparent canvas, so the grid lines show', async () => {
    // Break this catches: a record background painted on the canvas itself, which hides the grid lines.
    mockDragLayer.on = true;
    await mount(widget, { styles: { listStyle: binding('bordered'), recordBackgroundColor: binding('#ff0000') } });

    const canvas = rows()[0].querySelector('.show-grid');
    expect(rows()[0].style.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(canvas.style.backgroundColor).toBe('transparent');
  });
});

const HEADER_CHILD = () => child('hdr1', 'title1', 'Text', { text: binding('Title') }, `${ID}-header`);
const withHeader = { showHeader: binding('{{true}}') };

describe('Listview builder: a drag in the header does not fade the records', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-BLD-005] dragging or selecting a header component fades nothing and frames nothing', async () => {
    // Break this catches: the header slot counting as a record, so editing the header fades every record.
    await mount(widget, { properties: withHeader, extraComponents: { hdr1: HEADER_CHILD() } });

    await act(() => store().setDraggingComponentId('hdr1'));
    expect(faded()).toEqual([false, false, false]);
    expect(framed()).toEqual([false, false, false]);

    await act(() => {
      store().setDraggingComponentId(null);
      store().setSelectedComponents(['hdr1']);
    });
    expect(faded()).toEqual([false, false, false]);
  });
});

describe('Listview builder: fade while a record 1 component is selected', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-BLD-005] records 2..K stay faded while a record 1 component is selected, pointer elsewhere', async () => {
    // Break this catches: the fade tied to hover and drag only, so selecting a component leaves the copies at full strength.
    await mount(widget);

    await act(() => store().setSelectedComponents(['txt1']));
    await waitFor(() => expect(faded()).toEqual([false, true, true]));

    await act(() => store().setSelectedComponents([]));
    await waitFor(() => expect(faded()).toEqual([false, false, false]));
  });

  test('[Listview-BLD-005] selecting something that is not in the list does not fade it', async () => {
    // Break this catches: any selection fading every list.
    await mount(widget);

    await act(() => store().setSelectedComponents(['somewhere-else']));

    expect(faded()).toEqual([false, false, false]);
  });

  test('[Listview-BLD-005] a selection kept while the pager shows page 2 fades nothing', async () => {
    // Break this catches: page 2's first record being treated as the main record.
    await mount(widget);
    await act(() => store().setSelectedComponents(['txt1']));
    await widget.act('setPage', 2);
    await waitFor(() => expect(document.querySelector('.ele-txt1')?.textContent).toContain('r3'));

    expect(faded()).toEqual([false, false, false]);
  });

  test('[Listview-BLD-005] the fade does not come back from a hover that ended while record 1 was gone', async () => {
    // Break this catches: a stale hover flag when record 1 unmounts under the pointer (no mouseleave ever fires).
    await mount(widget);
    await user().hover(rows()[0]);
    await waitFor(() => expect(faded()).toEqual([false, true, true]));

    await act(() => {
      widget.setComponentProperty(ID, 'data', binding(records(0)).value, 'properties');
    });
    await waitFor(() => expect(rows()).toHaveLength(0));
    await act(() => {
      widget.setComponentProperty(ID, 'data', binding(records(7)).value, 'properties');
    });
    await waitFor(() => expect(rows()).toHaveLength(3));

    expect(faded()).toEqual([false, false, false]);
  });
});

describe('Listview builder: dotted copies on another page', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-BLD-006] with a record 1 component selected and page 2 shown, the first record of the page is not dotted', async () => {
    // Break this catches: every copy dotted, so page 2's first record looks like a copy of the selection.
    await mount(widget);
    await act(() => store().setSelectedComponents(['txt1']));
    await widget.act('setPage', 2);
    await waitFor(() => expect(document.querySelector('.ele-txt1')?.textContent).toContain('r3'));

    expect(dotted('txt1')).toEqual([false, true, true]);
  });

  test('[Listview-BLD-006] the dotted outline survives the drag clean-up that strips other outlines', async () => {
    // Break this catches: reusing the class that handleDeactivateTargets removes, so a drop clears the copies' outline.
    await mount(widget);
    await act(() => store().setSelectedComponents(['txt1']));
    await waitFor(() => expect(dotted('txt1')).toEqual([false, true, true]));

    handleDeactivateTargets();

    expect(dotted('txt1')).toEqual([false, true, true]);
  });

  test('[Listview-BLD-006] the outline is the same dotted style as a non-dragging component', () => {
    // Break this catches: a new look instead of the existing token and style.
    const css = require('fs').readFileSync(
      require('path').resolve(__dirname, '../../../../AppCanvas/Grid/Grid.css'),
      'utf8'
    );
    expect(css).toMatch(
      /\.non-dragging-component,\s*\.listview-copy-outline\s*\{[^}]*dotted var\(--border-accent-weak\)/
    );
  });
});

describe('Listview builder: hover outlines the innermost copy only', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-BLD-007] hovering a child inside a Container copy outlines the child, not the Container', async () => {
    // Break this catches: the parent staying outlined once the pointer moves onto its child.
    const box = child('cont1', 'container1', 'Container', {});
    const inner = child('txt3', 'text3', 'Text', { text: binding('In box') }, 'cont1');
    await mount(widget, { extraComponents: { cont1: box, txt3: inner } });
    await waitFor(() => expect(copiesOf('txt3')).toHaveLength(3));

    await user().hover(copiesOf('cont1')[2]);
    await waitFor(() => expect(dotted('cont1')).toEqual([false, false, true]));

    await user().hover(copiesOf('txt3')[2]);

    await waitFor(() => expect(dotted('txt3')).toEqual([false, false, true]));
    expect(dotted('cont1')).toEqual([false, false, false]);
    expect(dotted('txt3')).toEqual([false, false, true]);
  });

  test('[Listview-BLD-007] hovering a copy does not stop the event reaching ancestors', async () => {
    // Break this catches: stopPropagation on mouseover, which hides the hover from every ancestor handler.
    let seen = 0;
    const onOver = () => {
      seen += 1;
    };
    await mount(widget);
    document.body.addEventListener('mouseover', onOver);
    await user().hover(copiesOf('txt1')[2]);
    document.body.removeEventListener('mouseover', onOver);

    expect(seen).toBeGreaterThan(0);
  });
});

describe('Listview builder: grid lines on a move', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-BLD-001] a component move turns the grid on in record 1 of page 1 only', async () => {
    // Break this catches: showGridLines (run on every move start) painting the grid on every record.
    await mount(widget);

    showGridLines();

    expect(gridded()).toEqual([true, false, false]);

    await widget.act('setPage', 2);
    await waitFor(() => expect(document.querySelector('.ele-txt1')?.textContent).toContain('r3'));
    showGridLines();
    expect(gridded()).toEqual([false, false, false]);
  });
});

describe('Listview builder: nested header on a copy record', () => {
  const innerHeaderChild = () => child('hdr2', 'title2', 'Text', { text: binding('Inner') }, `${INNER}-header`);
  const harness = createWidgetHarness({
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
    defaultExtraComponents: {
      [INNER]: child(INNER, 'listview2', 'Listview', {
        ...baseProperties,
        data: binding('{{listItem.items}}'),
        rowsPerPage: binding('{{10}}'),
        enablePagination: binding('{{false}}'),
        showHeader: binding('{{true}}'),
      }),
      txt2: innerText(),
      hdr2: innerHeaderChild(),
    },
    capabilities: { dnd: true },
    widgetHeight: 800,
    widgetWidth: 600,
  });
  beforeEach(harness.setup);
  afterEach(harness.teardown);

  test('[Listview-BLD-003] the header of a nested list in record 1 of page 2 is read-only', async () => {
    // Break this catches: the header context dropping the copy flag, so page 2's nested header stays editable.
    await mount(harness, {}, 3);
    await waitFor(() => expect(editable('hdr2')).toEqual([true]));

    await harness.act('setPage', 2);

    await waitFor(() => expect(copiesOf('txt2').map((node) => node.textContent.slice(-1))).toEqual(['c', 'd']));
    await waitFor(() => expect(editable('hdr2')).toEqual([false]));
  });
});

describe('Listview builder: preview shows no builder highlights', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-BLD-008] no fade, outline or dotted copies in preview', async () => {
    // Break this catches: a builder rule running in view mode (fade, record frame, dotted copies).
    await mount(widget, { currentMode: 'view' });

    await user().hover(rows()[0]);
    await act(() => {
      store().setSelectedComponents(['txt1']);
      store().setDraggingComponentId('txt1');
    });
    await user().hover(copiesOf('txt1')[2]);

    expect(faded()).toEqual([false, false, false]);
    expect(framed()).toEqual([false, false, false]);
    expect(dotted('txt1')).toEqual([false, false, false]);
  });
});
