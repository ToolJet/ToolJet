/**
 * Listview 2.0 variables, actions and events (tj-ee#5555): selectedRecordIndex, pageIndex, setPage,
 * On page change, Record hovered and the visibility/disable/loading actions. Contract:
 * frontend/ee/test/app-builder/widgets/Listview/TESTING.md. Real store, real RenderWidget.
 */
import { waitFor, act, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import useStore from '@/AppBuilder/_stores/store';

const ID = 'lv1';
const NAME = 'listview1';
const records = (count, prefix = 'r') =>
  `{{${JSON.stringify(Array.from({ length: count }, (_, index) => ({ name: `${prefix}${index}` })))}}}`;

function textChild() {
  const definition = componentDefinition('txt1', 'text1', 'Text', { text: binding('{{listItem.name}}') });
  definition.component.parent = ID;
  definition.component.definition.styles = {};
  definition.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
  };
  return definition;
}

const widget = createWidgetHarness({
  componentType: 'Listview',
  handle: NAME,
  id: ID,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(records(10)),
    mode: binding('list'),
    columns: binding('{{1}}'),
    rowHeight: binding('100'),
    loadingState: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    visibility: binding('{{true}}'),
    collapseWhenHidden: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showBorder: binding('{{true}}'),
    rowsPerPage: binding('{{5}}'),
    enablePagination: binding('{{true}}'),
  },
  defaultStyles: {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-weak-border)'),
  },
  defaultExtraComponents: { txt1: textChild() },
  capabilities: { dnd: true },
  widgetHeight: 600,
  widgetWidth: 600,
});

const user = () => widget.session.user;
const container = () => document.getElementById(ID);
const rows = () => [...document.querySelectorAll('.list-item')];
const rowTexts = () => rows().map((node) => node.textContent);
const exposed = (key) => widget.exposed()?.[key];
const nextPage = () => user().click(document.querySelector('[data-cy="next-page-link"]'));
const previousPage = () => user().click(document.querySelector('[data-cy="previous-page-link"]'));
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 80)));
const recordsEqualTo10 = () => `{{${records(10).slice(2, -2)}.map((record) => ({ ...record }))}}`;
const fired = (key) => store().getVariable(key, MODULE_ID) ?? 0;
const setData = (value) =>
  widget.session.store.act(() => {
    widget.setComponentProperty(ID, 'data', binding(value).value, 'properties');
  });
const setProperty = (name, value) =>
  widget.session.store.act(() => {
    widget.setComponentProperty(ID, name, binding(value).value, 'properties');
  });

const handler = (eventId, index, key, value) => ({
  id: `evt-${eventId}-${index}`,
  index,
  sourceId: ID,
  name: `evt-${eventId}-${index}`,
  target: 'component',
  event: { eventId, actionId: 'set-custom-variable', key, value },
});
// The page the exposed state held when the handler ran: proves pageIndex updates before the event.
const PAGE_EVENTS = [
  handler('onPageChanged', 0, 'pageCalls', '{{(variables.pageCalls ?? 0) + 1}}'),
  handler('onPageChanged', 1, 'pageAtEvent', `{{components.${NAME}.pageIndex}}`),
];
const HOVER_EVENTS = [
  handler('onRecordHovered', 0, 'hoverCalls', '{{(variables.hoverCalls ?? 0) + 1}}'),
  handler('onRecordHovered', 1, 'hoverItem', '{{listItem.name}}'),
];

async function mount(options = {}) {
  widget.render({ currentMode: 'view', ...options });
  await waitFor(() => expect(rows()).toHaveLength(5));
}

async function onPageTwo() {
  await mount();
  await nextPage();
  await waitFor(() => expect(rowTexts()[0]).toContain('r5'));
}

describe('Listview: selectedRecordIndex', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-SEL-003] the first record on page two is selectedRecordIndex 5 and selectedRecordId 0', async () => {
    // Break this catches: a page-relative index, so an app cannot tell page two's record 0 from page one's.
    await onPageTwo();

    await user().click(rows()[0]);

    await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(5));
    expect(exposed('selectedRecordId')).toBe(0);
  });

  test('[Listview-SEL-004] a page change keeps selectedRecordIndex', async () => {
    // Break this catches: resetting the selection when the page turns.
    await onPageTwo();
    await user().click(rows()[0]);
    await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(5));

    await previousPage();

    await waitFor(() => expect(rowTexts()[0]).toContain('r0'));
    expect(exposed('selectedRecordIndex')).toBe(5);
  });

  test('[Listview-SEL-005] a data change clears selectedRecordIndex but not selectedRecordId', async () => {
    // Break this catches: keeping an index that no longer points at the record the user picked.
    await onPageTwo();
    await user().click(rows()[0]);
    await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(5));

    await setData(records(10, 'x'));

    await waitFor(() => expect(exposed('selectedRecordIndex')).toBeUndefined());
    expect(exposed('selectedRecordId')).toBe(0);
  });

  test('[Listview-SEL-005] new data with equal content also clears selectedRecordIndex', async () => {
    // Break this catches: a deep-equality guard that keeps the index when a query re-runs with the same rows.
    await onPageTwo();
    await user().click(rows()[0]);
    await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(5));

    await setData(recordsEqualTo10());

    await waitFor(() => expect(exposed('selectedRecordIndex')).toBeUndefined());
  });

  test('[Listview-SEL-005] a re-render that does not change data keeps selectedRecordIndex', async () => {
    // Break this catches: clearing the index on every render instead of on a new data value.
    await onPageTwo();
    await user().click(rows()[0]);
    await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(5));

    await setProperty('rowHeight', '90');
    await settle();

    expect(exposed('selectedRecordIndex')).toBe(5);
  });

  test('[Listview-SEL-006] the older variables keep their values after a click', async () => {
    // Break this catches: changing a released variable while adding the new ones.
    await onPageTwo();

    await user().click(rows()[1]);

    await waitFor(() => expect(exposed('selectedRowId')).toBe(1));
    expect(exposed('selectedRow')).toEqual(exposed('selectedRecord'));
    expect(exposed('selectedRow')?.text1?.text).toBe('r6');
    expect(exposed('data')?.[1]?.text1?.text).toBe('r6');
  });
});

describe('Listview: page index, Set page and On page change', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-PAGE-009] pageIndex is 1 on first render', async () => {
    // Break this catches: leaving pageIndex unset until the first page change.
    await mount();

    await waitFor(() => expect(exposed('pageIndex')).toBe(1));
  });

  test('[Listview-PAGE-006] setPage(2) shows page two, sets pageIndex 2 and fires no On page change', async () => {
    // Break this catches: firing On page change for the action, which Table does not do.
    await mount({ events: PAGE_EVENTS });

    await widget.act('setPage', 2);

    await waitFor(() => expect(rowTexts()[0]).toContain('r5'));
    await waitFor(() => expect(exposed('pageIndex')).toBe(2));
    await settle();
    expect(fired('pageCalls')).toBe(0);
  });

  test('[Listview-PAGE-006] a pager click fires On page change exactly once with the new pageIndex', async () => {
    // Break this catches: not firing for the pager, or firing twice.
    await mount({ events: PAGE_EVENTS });

    await nextPage();

    await waitFor(() => expect(fired('pageCalls')).toBe(1));
    await settle();
    expect(fired('pageCalls')).toBe(1);
    expect(fired('pageAtEvent')).toBe(2);
    expect(exposed('pageIndex')).toBe(2);
  });

  test('[Listview-PAGE-007] setPage clamps out-of-range numbers to the first and last page', async () => {
    // Break this catches: letting the page run past the data (even for one render) or below one.
    await mount();
    const seen = [];
    const unsubscribe = useStore.subscribe(() => seen.push(exposed('pageIndex')));

    await widget.act('setPage', 9);
    await waitFor(() => expect(exposed('pageIndex')).toBe(2));
    await settle();
    unsubscribe();
    expect(seen).not.toContain(3);
    expect(rowTexts()[0]).toContain('r5');

    await widget.act('setPage', 0);
    await waitFor(() => expect(exposed('pageIndex')).toBe(1));
    expect(rowTexts()[0]).toContain('r0');
  });

  test('[Listview-PAGE-008] a clamp after data shrinks moves the page and fires no On page change', async () => {
    // Break this catches: reporting a silent clamp as a user page change.
    await mount({ events: PAGE_EVENTS });
    await widget.act('setPage', 2);
    await waitFor(() => expect(exposed('pageIndex')).toBe(2));

    await setData(records(3));

    await waitFor(() => expect(rows()).toHaveLength(3));
    await waitFor(() => expect(exposed('pageIndex')).toBe(1));
    await settle();
    expect(fired('pageCalls')).toBe(0);
  });

  test('[Listview-PAGE-008] a rowsPerPage change that removes the current page moves to page 1 and fires no event', async () => {
    // Break this catches: leaving the clamp to the pager, which reports it as a user page change.
    await mount({ events: PAGE_EVENTS });
    await widget.act('setPage', 2);
    await waitFor(() => expect(exposed('pageIndex')).toBe(2));

    await setProperty('rowsPerPage', '{{10}}');

    await waitFor(() => expect(rows()).toHaveLength(10));
    await waitFor(() => expect(exposed('pageIndex')).toBe(1));
    await settle();
    expect(fired('pageCalls')).toBe(0);
  });

  test('[Listview-PAGE-008] turning pagination off moves to page 1, so the first record is selectedRecordIndex 0', async () => {
    // Break this catches: keeping page two after the pager is gone, which offsets every record index by a page.
    await mount({ events: PAGE_EVENTS });
    await widget.act('setPage', 2);
    await waitFor(() => expect(exposed('pageIndex')).toBe(2));

    await setProperty('enablePagination', '{{false}}');

    await waitFor(() => expect(rows()).toHaveLength(10));
    await waitFor(() => expect(exposed('pageIndex')).toBe(1));
    await user().click(rows()[0]);
    await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(0));
    await settle();
    expect(fired('pageCalls')).toBe(0);
  });
});

describe('Listview: Record hovered', () => {
  beforeEach(widget.setup);
  afterEach(() => {
    jest.useRealTimers();
    widget.teardown();
  });

  test('[Listview-EVT-005] entering a record and moving over its children fires once with that record', async () => {
    // Break this catches: firing on mouseover (every child move) or sending the wrong record.
    await mount({ events: HOVER_EVENTS });

    const row = rows()[3];
    // user-event sends no relatedTarget, which React reads as a fresh entry on every move.
    fireEvent.mouseOver(row, { relatedTarget: document.body });
    fireEvent.mouseOver(row.querySelector('p, div'), { relatedTarget: row });
    fireEvent.mouseOver(row, { relatedTarget: row.querySelector('p, div') });

    await waitFor(() => expect(fired('hoverCalls')).toBe(1));
    expect(store().getVariable('hoverItem', MODULE_ID)).toBe('r3');
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(fired('hoverCalls')).toBe(1);
  });

  test('[Listview-EVT-006] a fast move across records ends with the last record', async () => {
    // Break this catches: a throttle without a trailing call, which drops the record the pointer ends on.
    await mount({ events: HOVER_EVENTS });
    jest.useFakeTimers();

    [0, 1, 2, 3, 4].forEach((index) => fireEvent.mouseOver(rows()[index], { relatedTarget: document.body }));
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    jest.useRealTimers();

    await waitFor(() => expect(store().getVariable('hoverItem', MODULE_ID)).toBe('r4'));
    expect(fired('hoverCalls')).toBe(2);
  });
});

describe('Listview: visibility, disable and loading actions', () => {
  // What the rendered list shows for each variable, so a variable cannot agree with a widget that disagrees.
  const widgetState = (variable) =>
    ({
      isVisible: () => container().style.display !== 'none',
      isDisabled: () => container().getAttribute('data-disabled') === 'true',
      isLoading: () => rows().length === 0,
    })[variable]();

  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-CSA-001] setVisibility, setDisable and setLoading change the widget and the variables', async () => {
    // Break this catches: an action that updates the variable but not the widget, or the reverse.
    await mount();
    expect(exposed('isVisible')).toBe(true);
    expect(exposed('isDisabled')).toBe(false);
    expect(exposed('isLoading')).toBe(false);

    await widget.act('setVisibility', false);
    await waitFor(() => expect(exposed('isVisible')).toBe(false));
    expect(container()).toHaveStyle({ display: 'none' });

    await widget.act('setDisable', true);
    await waitFor(() => expect(exposed('isDisabled')).toBe(true));
    expect(container()).toHaveAttribute('data-disabled', 'true');

    await widget.act('setLoading', true);
    await waitFor(() => expect(exposed('isLoading')).toBe(true));
    expect(rows()).toHaveLength(0);
    expect(document.querySelector('[class*="spinner"]')).toBeTruthy();
  });

  test.each([
    ['setVisibility', 'visibility', 'isVisible', false],
    ['setDisable', 'disabledState', 'isDisabled', true],
    ['setLoading', 'loadingState', 'isLoading', true],
  ])(
    '[Listview-CSA-002] %s survives an unrelated change and yields to a changed property',
    async (action, property, variable, actionValue) => {
      // Break this catches: an action that a re-resolution silently undoes, or one the property can never override.
      await mount();
      await widget.act(action, actionValue);
      await waitFor(() => expect(exposed(variable)).toBe(actionValue));

      await setProperty('rowHeight', '90');
      expect(exposed(variable)).toBe(actionValue);
      expect(widgetState(variable)).toBe(actionValue);

      await setProperty(property, `{{${actionValue}}}`);
      await setProperty(property, `{{${!actionValue}}}`);
      await waitFor(() => expect(exposed(variable)).toBe(!actionValue));
      expect(widgetState(variable)).toBe(!actionValue);
    }
  );
});
