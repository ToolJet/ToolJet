/**
 * Listview 2.0 server-side pagination (tj-ee#5557): with Type set to server side the list shows `data`
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
import useStore from '@/AppBuilder/_stores/store';
import { resolveListviewHeightFromRows } from '@/AppBuilder/_stores/utils/dynamicHeightReflow';

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
    serverSidePagination: binding('{{true}}'),
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
const nextButton = () => document.querySelector('[data-cy="pagination-button-to-next"]');
// The shared pager has no last-page button: walk to the end with Next, which is also what proves the page count.
const lastPageLink = async () => {
  for (let step = 0; step < 60 && nextButton() && !nextButton().disabled; step += 1) await user().click(nextButton());
};
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
          serverSidePagination: binding('{{false}}'),
          totalRecords: binding('{{99}}'),
        },
      },
      5
    );

    await lastPageLink();
    await waitFor(() => expect(exposed('pageIndex')).toBe(2));
    expect(rowTexts()[0]).toBe('r5');
    await widget.act('setPage', 9);
    await waitFor(() => expect(exposed('pageIndex')).toBe(2));
  });

  test('[Listview-SRV-004] a saved list without serverSidePagination behaves as client side', async () => {
    // Break this catches: defaulting a missing serverSidePagination to server side.
    await mount(
      { properties: { data: binding(records(10)), serverSidePagination: undefined, totalRecords: undefined } },
      5
    );

    expect(rowTexts()[0]).toBe('r0');
    await lastPageLink();
    await waitFor(() => expect(exposed('pageIndex')).toBe(2));
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

  test('[Listview-SRV-010] dynamic height counts every rendered server row, not one page', async () => {
    // Break this catches: sizing a server list for rowsPerPage rows while it renders every row of data.
    const PAGER_ALLOWANCE = 60;
    await mount({ properties: { data: binding(records(8)) } }, 8);
    const heightNow = () => {
      const state = store();
      return resolveListviewHeightFromRows({
        componentId: ID,
        contextIndices: null,
        component: state.getResolvedComponent(ID),
        currentLayout: 'desktop',
        currentPageComponents: state.getCurrentPageComponents(MODULE_ID),
        temporaryLayouts: {},
        moduleId: MODULE_ID,
      });
    };
    const server = heightNow();
    await setProperty('enablePagination', '{{false}}');
    await waitFor(() => expect(heightNow()).not.toBe(server));

    expect(server).toBe(heightNow() + PAGER_ALLOWANCE);
  });

  test('[Listview-SRV-011] a query run (data and Total records empty, then back) keeps the page', async () => {
    // Break this catches: clamping to page 1 while the bound query runs, which strands the list on page 1.
    await mount({ events: PAGE_EVENTS });
    await widget.act('setPage', 3);
    await waitFor(() => expect(exposed('pageIndex')).toBe(3));
    const seen = [];
    const unsubscribe = useStore.subscribe(() => seen.push(exposed('pageIndex')));

    await setProperty('data', '{{[]}}');
    await setProperty('totalRecords', '{{undefined}}');
    await settle();
    await setData(records(5, 'n'));
    await setProperty('totalRecords', '{{23}}');
    await waitFor(() => expect(rowTexts()[0]).toBe('n0'));
    await settle();
    unsubscribe();

    expect(exposed('pageIndex')).toBe(3);
    expect(seen.filter((page) => page !== undefined && page !== 3)).toEqual([]);
    expect(fired('pageCalls')).toBe(0);
  });

  test('[Listview-SRV-012] with a valid Total records the pager stays while data is empty', async () => {
    // Break this catches: hiding the pager on an empty page, which leaves the user no way back.
    await mount();
    await widget.act('setPage', 3);
    await waitFor(() => expect(exposed('pageIndex')).toBe(3));

    await setData('{{[]}}');

    await waitFor(() => expect(rows()).toHaveLength(0));
    expect(document.querySelector('[data-cy="pagination-button-to-previous"]')).toBeInTheDocument();
    expect(exposed('pageIndex')).toBe(3);
  });

  test.each([
    ['a fraction below one', '{{0.5}}', 1],
    ['a fraction between pages', '{{5.5}}', 2],
  ])(
    '[Listview-SRV-013] Total records %s counts pages like the pager and fires no event',
    async (_label, total, page) => {
      // Break this catches: a page count the shared pager disagrees with, which it then "fixes" as a user page change.
      await mount({ events: PAGE_EVENTS, properties: { totalRecords: binding(total) } });
      await widget.act('setPage', 2);
      await waitFor(() => expect(exposed('pageIndex')).toBe(Math.min(2, page === 1 ? 1 : 2)));
      await settle();

      expect(exposed('pageIndex')).toBe(page === 1 ? 1 : 2);
      expect(fired('pageCalls')).toBe(0);
    }
  );

  test('[Listview-SRV-014] leaving server side clears a selection counted across pages', async () => {
    // Break this catches: an index of 10 left standing on a client list of 5 records.
    await mount();
    await widget.act('setPage', 3);
    await waitFor(() => expect(exposed('pageIndex')).toBe(3));
    await user().click(rows()[0]);
    await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(10));

    await setProperty('serverSidePagination', '{{false}}');

    await waitFor(() => expect(exposed('selectedRecordIndex')).toBeUndefined());
    expect(exposed('selectedRecordId')).toBeUndefined();
    expect(exposed('selectedRecord')).toBeUndefined();
  });

  test('[Listview-SRV-014] turning pagination off clears a selection counted across pages', async () => {
    // Break this catches: the same stale index after the pager is switched off.
    await mount();
    await widget.act('setPage', 3);
    await waitFor(() => expect(exposed('pageIndex')).toBe(3));
    await user().click(rows()[0]);
    await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(10));

    await setProperty('enablePagination', '{{false}}');

    await waitFor(() => expect(exposed('selectedRecordIndex')).toBeUndefined());
    expect(exposed('selectedRecord')).toBeUndefined();
  });
});

describe('Listview: a server-side list nested in a record', () => {
  const NESTED = `{{[{ name: 'o1', items: [{ name: 'a' }, { name: 'b' }] }, { name: 'o2', items: [{ name: 'c' }] }]}}`;
  const inner = () => {
    const definition = componentDefinition('lv2', 'listview2', 'Listview', {
      dataSourceSelector: binding('rawJson'),
      data: binding('{{listItem.items}}'),
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
      serverSidePagination: binding('{{true}}'),
      totalRecords: binding('{{12}}'),
    });
    definition.component.parent = ID;
    definition.component.definition.styles = {};
    definition.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    return definition;
  };
  const innerText = () => {
    const definition = componentDefinition('txt2', 'text2', 'Text', { text: binding('{{listItem.name}}') });
    definition.component.parent = 'lv2';
    definition.component.definition.styles = {};
    definition.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    return definition;
  };
  const nested = createWidgetHarness({
    componentType: 'Listview',
    handle: NAME,
    id: ID,
    defaultProperties: {
      dataSourceSelector: binding('rawJson'),
      data: binding(NESTED),
      mode: binding('list'),
      columns: binding('{{1}}'),
      rowHeight: binding('400'),
      loadingState: binding('{{false}}'),
      dynamicHeight: binding('{{false}}'),
      visibility: binding('{{true}}'),
      collapseWhenHidden: binding('{{false}}'),
      disabledState: binding('{{false}}'),
      showBorder: binding('{{true}}'),
      rowsPerPage: binding('{{10}}'),
      enablePagination: binding('{{false}}'),
    },
    defaultStyles: {
      backgroundColor: binding('var(--cc-surface1-surface)'),
      borderColor: binding('var(--cc-weak-border)'),
    },
    defaultExtraComponents: { lv2: inner(), txt2: innerText() },
    capabilities: { dnd: true },
    widgetHeight: 800,
    widgetWidth: 600,
  });
  const innerRows = () => [...document.querySelectorAll('.list-item .list-item')];
  const innerSelected = () =>
    useStore.getState().resolvedStore.modules[MODULE_ID].exposedValues.components.lv2?.[0]?.selectedRecordIndex;

  beforeEach(nested.setup);
  afterEach(nested.teardown);

  test('[Listview-SRV-015] an unrelated change keeps the inner selection; new outer data clears it', async () => {
    // Break this catches: a fresh inner data reference on every outer update, which wipes the inner selection.
    nested.render({ currentMode: 'view' });
    await waitFor(() => expect(innerRows().length).toBeGreaterThan(0));
    await nested.session.user.click(innerRows()[1]);
    await waitFor(() => expect(innerSelected()).toBe(1));

    await nested.session.store.act(() => {
      store().setVariable('sfx', '!', MODULE_ID);
    });
    await settle();
    expect(innerSelected()).toBe(1);

    await nested.session.store.act(() => {
      nested.setComponentProperty(
        ID,
        'data',
        binding(`{{[{ name: 'o1', items: [{ name: 'x' }, { name: 'y' }] }, { name: 'o2', items: [{ name: 'c' }] }]}}`)
          .value,
        'properties'
      );
    });
    await waitFor(() => expect(innerSelected()).toBeUndefined());
  });
});
