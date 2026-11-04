/**
 * Listview 2.0 server-side pagination (tj-ee#5557): with paginationType serverSide the list shows `data`
 * as-is and counts pages from Total records. Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md
 * (Listview-SRV-001..008). Real store, real RenderWidget.
 */
import { waitFor, act } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';

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
    data: binding(records(5)),
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
    paginationType: binding('serverSide'),
    totalRecords: binding('{{23}}'),
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
const rows = () => [...document.querySelectorAll('.list-item')];
const rowTexts = () => rows().map((node) => node.textContent);
const exposed = (key) => widget.exposed()?.[key];
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 80)));
const fired = (key) => store().getVariable(key, MODULE_ID) ?? 0;
const totalShown = () => document.querySelector('[data-cy="total-count"]')?.textContent;
const lastPageLink = () => user().click(document.querySelector('[data-cy="last-page-link"]'));
const setProperty = (name, value) =>
  widget.session.store.act(() => {
    widget.setComponentProperty(ID, name, binding(value).value, 'properties');
  });
const setData = (value) => setProperty('data', value);

const PAGE_EVENTS = [
  {
    id: 'evt-page',
    index: 0,
    sourceId: ID,
    name: 'evt-page',
    target: 'component',
    event: {
      eventId: 'onPageChanged',
      actionId: 'set-custom-variable',
      key: 'pageCalls',
      value: '{{(variables.pageCalls ?? 0) + 1}}',
    },
  },
];

async function mount(options = {}, rowCount = 5) {
  widget.render({ currentMode: 'view', ...options });
  await waitFor(() => expect(rows()).toHaveLength(rowCount));
}

describe('Listview: server-side pagination', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-SRV-001] total 23 and 5 per page gives 5 pages and shows every data record unsliced', async () => {
    // Break this catches: counting pages from data.length, or slicing server data to the page.
    await mount({ properties: { data: binding(records(8)) } }, 8);

    expect(rowTexts()).toEqual(Array.from({ length: 8 }, (_, index) => `r${index}`));
    expect(totalShown()).toBe('23');
    await lastPageLink();
    await waitFor(() => expect(exposed('pageIndex')).toBe(5));
    expect(rows()).toHaveLength(8);
  });

  test('[Listview-SRV-001] a page past the data length still shows the data as-is', async () => {
    // Break this catches: slicing server data by page, which leaves page 3 of an 8-record result empty.
    await mount({ properties: { data: binding(records(8)) } }, 8);

    await widget.act('setPage', 3);

    await waitFor(() => expect(exposed('pageIndex')).toBe(3));
    expect(rowTexts()).toEqual(Array.from({ length: 8 }, (_, index) => `r${index}`));
  });

  test('[Listview-SRV-002] new rows on page 3 keep the list on page 3', async () => {
    // Break this catches: a clamp against data.length, which snaps the list to page 1 after each query.
    await mount();
    await widget.act('setPage', 3);
    await waitFor(() => expect(exposed('pageIndex')).toBe(3));

    await setData(records(5, 'n'));

    await waitFor(() => expect(rowTexts()[0]).toBe('n0'));
    await settle();
    expect(exposed('pageIndex')).toBe(3);
  });

  test('[Listview-SRV-003] the first record on server page 3 is selectedRecordIndex 10', async () => {
    // Break this catches: a page-relative index on a server page.
    await mount();
    await widget.act('setPage', 3);
    await waitFor(() => expect(exposed('pageIndex')).toBe(3));

    await user().click(rows()[0]);

    await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(10));
    expect(exposed('selectedRecordId')).toBe(0);
  });

  test('[Listview-SRV-004] client side ignores Total records: slices the data and counts pages from it', async () => {
    // Break this catches: treating every list as server side, or a client list reading Total records.
    await mount(
      {
        properties: {
          data: binding(records(10)),
          paginationType: binding('clientSide'),
          totalRecords: binding('{{99}}'),
        },
      },
      5
    );

    expect(totalShown()).toBe('10');
    await lastPageLink();
    await waitFor(() => expect(exposed('pageIndex')).toBe(2));
    expect(rowTexts()[0]).toBe('r5');
    await widget.act('setPage', 9);
    await waitFor(() => expect(exposed('pageIndex')).toBe(2));
  });

  test('[Listview-SRV-004] a saved list without paginationType behaves as client side', async () => {
    // Break this catches: defaulting a missing paginationType to server side.
    await mount({ properties: { data: binding(records(10)), paginationType: undefined, totalRecords: undefined } }, 5);

    expect(totalShown()).toBe('10');
    expect(rowTexts()[0]).toBe('r0');
  });

  test('[Listview-SRV-005] a clamp after Total records shrinks moves the page and fires no On page change', async () => {
    // Break this catches: reporting a silent clamp as a user page change.
    await mount({ events: PAGE_EVENTS });
    await widget.act('setPage', 5);
    await waitFor(() => expect(exposed('pageIndex')).toBe(5));

    await setProperty('totalRecords', '{{11}}');

    await waitFor(() => expect(exposed('pageIndex')).toBe(3));
    await settle();
    expect(fired('pageCalls')).toBe(0);
  });

  test.each([
    ['empty', "{{''}}"],
    ['negative', '{{-4}}'],
    ['not a number', "{{'abc'}}"],
  ])('[Listview-SRV-006] Total records %s falls back to data.length for the page count', async (_label, total) => {
    // Break this catches: a NaN or negative page count, or trusting a value that is not a count.
    await mount({ properties: { data: binding(records(8)), totalRecords: binding(total) } }, 8);

    expect(totalShown()).toBe('8');
    await lastPageLink();
    await waitFor(() => expect(exposed('pageIndex')).toBe(2));
  });

  test('[Listview-SRV-007] a new page of data clears selectedRecordIndex, selectedRecordId and selectedRecord', async () => {
    // Break this catches: keeping a selection that points at a record of the previous page.
    await mount();
    await user().click(rows()[1]);
    await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(1));

    await setData(records(5, 'n'));

    await waitFor(() => expect(exposed('selectedRecordIndex')).toBeUndefined());
    expect(exposed('selectedRecordId')).toBeUndefined();
    expect(exposed('selectedRecord')).toBeUndefined();
  });

  test('[Listview-SRV-007] a new data value with equal content also clears the selection', async () => {
    // Break this catches: comparing content, so re-loading the same page leaves a stale selection.
    await mount();
    await user().click(rows()[1]);
    await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(1));

    await setData(`{{${records(5).slice(2, -2)}.map((record) => ({ ...record }))}}`);

    await waitFor(() => expect(exposed('selectedRecordIndex')).toBeUndefined());
    expect(exposed('selectedRecordId')).toBeUndefined();
    expect(exposed('selectedRecord')).toBeUndefined();
  });

  test('[Listview-SRV-007] a re-render that does not change data keeps the selection', async () => {
    // Guard: the clear is tied to a new data value, not to every render.
    await mount();
    await user().click(rows()[1]);
    await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(1));

    await setProperty('rowHeight', '90');
    await settle();

    expect(exposed('selectedRecordIndex')).toBe(1);
  });

  test('[Listview-SRV-008] setPage clamps against Total records, not data.length', async () => {
    // Break this catches: clamping setPage to the page of data, which makes later server pages unreachable.
    await mount();

    await widget.act('setPage', 9);
    await waitFor(() => expect(exposed('pageIndex')).toBe(5));
    await widget.act('setPage', 0);
    await waitFor(() => expect(exposed('pageIndex')).toBe(1));
    await setProperty('totalRecords', '{{11}}');
    await widget.act('setPage', 9);
    await waitFor(() => expect(exposed('pageIndex')).toBe(3));
  });
});
