/**
 * Listview: the approved contract in
 * frontend/ee/test/app-builder/widgets/Listview/TESTING.md, exercised through
 * the real store and the real RenderWidget. Shared setup lives in
 * Widgets/widgetHarness.js.
 *
 * Real store, real RenderWidget, real Listview + ListviewSubcontainer +
 * AppCanvas/Container + real child widgets rendered inside every row. Nothing
 * about the widget is mocked.
 *
 * Why the RTL layer, and why real children: this widget's whole product is
 * "render N copies of a row template, each scoped to its own record". A row is
 * only meaningful with a real child bound to `{{listItem.x}}` — and the
 * per-row resolution that binding depends on is the highest-recurrence bug
 * family in the App Builder (seven fix commits; see the store-level suite at
 * _stores/slices/__tests__/integration/listViewRowScope.spec.js, which covers
 * the scope machinery itself). These specs cover the widget's own contract
 * through the real DOM instead.
 *
 * `capabilities.dnd` is mandatory here: Container requires the real react-dnd
 * provider, and a Listview is nothing but containers.
 *
 * Deliberately NOT covered here: row separators, dynamic height and the
 * blocking half of `disabledState` — all real-geometry / real-`inert`
 * behaviour that jsdom cannot answer (Listview-BRW-001..003, QA-owned).
 *
 * Test titles carry their approved scenario ID as a `[Listview-FAMILY-NNN]`
 * prefix, per the widget-testing-contract validator.
 */
import { waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';

const ID = 'lv1';
const NAME = 'listview1';
const THREE_RECORDS = `{{[{ text: 'Alpha' }, { text: 'Beta' }, { text: 'Gamma' }]}}`;

/**
 * A row-template child. `others.showOnDesktop` is load-bearing, not decoration:
 * WidgetWrapper hides a component whose device flags are absent, so a child
 * seeded without it renders nothing and every row assertion below would pass
 * against an empty row.
 */
function rowChild(id, name, type, properties) {
  const definition = componentDefinition(id, name, type, properties);
  definition.component.parent = ID;
  definition.component.definition.styles = {};
  definition.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
  };
  return definition;
}

const TEXT_CHILD = () => rowChild('txt1', 'text1', 'Text', { text: binding('{{listItem.text}}') });

const widget = createWidgetHarness({
  componentType: 'Listview',
  handle: NAME,
  id: ID,
  // Baseline is `listview.js`'s own `definition.properties`, copied rather than
  // invented.
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(THREE_RECORDS),
    mode: binding('list'),
    columns: binding('{{3}}'),
    rowHeight: binding('100'),
    loadingState: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    visibility: binding('{{true}}'),
    collapseWhenHidden: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showBorder: binding('{{true}}'),
    rowsPerPage: binding('{{10}}'),
    enablePagination: binding('{{false}}'),
    tooltip: binding(''),
    tooltipFormat: binding('plainText'),
  },
  defaultStyles: {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-weak-border)'),
    borderRadius: binding('{{6}}'),
    boxShadow: binding('0px 0px 0px 0px #00000040'),
  },
  defaultExtraComponents: { txt1: TEXT_CHILD() },
  capabilities: { dnd: true },
  widgetHeight: 450,
  widgetWidth: 600,
});

const user = () => widget.session.user;
const container = () => document.getElementById(ID);
const rows = () => [...document.querySelectorAll('.list-item')];
const rowTexts = () => rows().map((node) => node.textContent);
const pager = () => document.querySelector('[data-cy="next-page-link"]')?.closest('ul');
const spinner = () => document.querySelector('[class*="spinner"]');
const exposed = (key) => widget.exposed()?.[key];

/** Every scenario renders in the viewer: that is where a List View is used. */
async function mount(options = {}) {
  widget.render({ currentMode: 'view', ...options });
  await waitFor(() => expect(container()).toBeInTheDocument());
}

const counting = (eventId, key) => ({
  id: `evt-${eventId}`,
  index: 0,
  sourceId: ID,
  name: `evt-${eventId}`,
  target: 'component',
  event: { eventId, actionId: 'set-custom-variable', key, value: `{{(variables.${key} ?? 0) + 1}}` },
});
const BOTH_EVENTS = [counting('onRecordClicked', 'rec'), counting('onRowClicked', 'row')];
const fired = (key) => store().getVariable(key, MODULE_ID) ?? 0;

describe('Listview: rendering records', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-DATA-001] renders one row per record, in order', async () => {
    // Break this catches: rendering the template once instead of per record, or
    // reordering the rows away from the data's own order.
    await mount();

    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(rowTexts()).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  test('[Listview-DATA-002] a `{{listItem.x}}` binding resolves to its own row s record', async () => {
    // Break this catches: the row-scope regression family — every row showing
    // the FIRST record's value, or `undefined`, because the per-row resolvable
    // was not scoped to the row being rendered.
    await mount({
      properties: { data: binding(`{{[{ text: 'first' }, { text: 'second' }]}}`) },
    });

    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(rows()[0].textContent).toBe('first');
    expect(rows()[1].textContent).toBe('second');
  });

  test('[Listview-DATA-003] publishes each row s child values as `data`, keyed by row index and component name', async () => {
    // Break this catches: publishing a flat (non-per-row) shape, which is what
    // `{{components.listview1.data["0"].text1.text}}` in the docs reads.
    await mount();
    await waitFor(() => expect(rows()).toHaveLength(3));

    await waitFor(() => expect(exposed('data')?.[0]?.text1?.text).toBe('Alpha'));
    expect(exposed('data')[1].text1.text).toBe('Beta');
    expect(exposed('data')[2].text1.text).toBe('Gamma');
  });

  test('[Listview-DATA-004] publishes each row s child components, with their actions, as `children`', async () => {
    // Break this catches: dropping the per-row `children` publication, which is
    // the ONLY way an app can control a component inside a row — the widget
    // registers no CSAs of its own.
    await mount();
    await waitFor(() => expect(rows()).toHaveLength(3));

    await waitFor(() => expect(exposed('children')?.[0]?.text1).toBeDefined());
    expect(exposed('children')[0].text1.text).toBe('Alpha');
    expect(typeof exposed('children')[0].text1.setText).toBe('function');
    expect(typeof exposed('children')[2].text1.setVisibility).toBe('function');
  });

  test('[Listview-DATA-005] an empty data array renders no rows and no error', async () => {
    // Break this catches: rendering a phantom row for an empty result set, or
    // throwing while a query has returned nothing.
    await mount({ properties: { data: binding('{{[]}}') } });

    expect(rows()).toHaveLength(0);
    expect(container()).toBeInTheDocument();
  });

  test('[Listview-DATA-006] data that is not an array renders no rows and no error', async () => {
    // Break this catches: removing the isArray guard, so a still-loading query
    // binding (null/undefined/an object) crashes the canvas.
    await mount({ properties: { data: binding('{{null}}') } });

    expect(rows()).toHaveLength(0);
    expect(container()).toBeInTheDocument();
  });

  test('[Listview-DATA-007] rebinding the data re-renders the rows and re-resolves every row binding', async () => {
    // Break this catches: a stale diff guard around updateCustomResolvables, so
    // refreshed query results leave rows bound to the previous records.
    await mount();
    await waitFor(() => expect(rows()).toHaveLength(3));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'data', `{{[{ text: 'Delta' }, { text: 'Epsilon' }]}}`, 'properties');
    });

    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(rowTexts()).toEqual(['Delta', 'Epsilon']);
  });

  test('[Listview-DATA-008] a non-rawJson data source uses the selector s own value as the list data', async () => {
    // Break this catches: always reading `properties.data`, which would render
    // the Raw JSON sample instead of the selected query's rows.
    await mount({
      properties: { dataSourceSelector: binding(`{{[{ text: 'FromQuery' }, { text: 'AlsoQuery' }]}}`) },
    });

    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(rowTexts()).toEqual(['FromQuery', 'AlsoQuery']);
  });
});

describe('Listview: row layout', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-ROW-001] Row height applies the configured height to every row', async () => {
    // Break this catches: reading the height from the wrong property, which
    // silently collapses or stretches every row of every list.
    await mount({ properties: { rowHeight: binding('{{60}}') } });

    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(rows()[0].style.height).toBe('60px');
    expect(rows()[2].style.height).toBe('60px');
  });

  test('[Listview-ROW-002] Grid mode divides the row width by the configured column count', async () => {
    // Break this catches: the grid-mode arithmetic — a wrong divisor puts the
    // wrong number of cards per line for every grid list.
    await mount({ properties: { mode: binding('grid'), columns: binding('{{2}}') } });

    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(rows()[0].style.width).toBe('50%');
  });

  test('[Listview-ROW-003] a column count below 1 is clamped to a single column', async () => {
    // Break this catches: removing the clamp, so a binding that resolves to 0
    // divides by zero and renders zero-width (invisible) rows.
    await mount({ properties: { mode: binding('grid'), columns: binding('{{0}}') } });

    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(rows()[0].style.width).toBe('100%');
  });
});

describe('Listview: record clicks', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-EVT-001] clicking a row fires Record clicked once', async () => {
    // Break this catches: a second path into fireEvent('onRecordClicked') — the
    // row wrapper and the canvas below it both see the click — which would
    // double-run a builder's query.
    await mount({ events: BOTH_EVENTS });
    await waitFor(() => expect(rows()).toHaveLength(3));

    await user().click(rows()[1]);

    await waitFor(() => expect(fired('rec')).toBe(1));
  });

  test('[Listview-EVT-002] clicking a row also fires the deprecated Row clicked once', async () => {
    // Break this catches: dropping the deprecated event, which silently stops
    // every app still wired to Row clicked.
    await mount({ events: BOTH_EVENTS });
    await waitFor(() => expect(rows()).toHaveLength(3));

    await user().click(rows()[1]);

    await waitFor(() => expect(fired('row')).toBe(1));
    expect(fired('rec')).toBe(1);
  });

  test('[Listview-EVT-003] clicking a component inside a row registers the record click for that row', async () => {
    // Break this catches: the row-click routing regression — an interaction
    // with a child reporting the wrong record, or no record at all.
    await mount({ events: BOTH_EVENTS });
    await waitFor(() => expect(rows()).toHaveLength(3));

    const childInSecondRow = rows()[1].querySelector('[data-cy*="text1"]') ?? rows()[1].firstElementChild;
    await user().click(childInSecondRow);

    await waitFor(() => expect(fired('rec')).toBe(1));
    expect(exposed('selectedRecordId')).toBe(1);
  });

  test('[Listview-SEL-001] a record click publishes `selectedRecordId` and `selectedRecord`', async () => {
    // Break this catches: publishing the row's raw record instead of its child
    // values, or an index that is off by one.
    await mount();
    await waitFor(() => expect(rows()).toHaveLength(3));

    await user().click(rows()[2]);

    await waitFor(() => expect(exposed('selectedRecordId')).toBe(2));
    expect(exposed('selectedRecord')?.text1?.text).toBe('Gamma');
  });

  test('[Listview-SEL-002] the deprecated `selectedRowId`/`selectedRow` mirror the new variables', async () => {
    // Break this catches: updating only the new pair, which silently breaks
    // apps reading the deprecated ones.
    await mount();
    await waitFor(() => expect(rows()).toHaveLength(3));

    await user().click(rows()[1]);

    await waitFor(() => expect(exposed('selectedRowId')).toBe(1));
    expect(exposed('selectedRowId')).toBe(exposed('selectedRecordId'));
    expect(exposed('selectedRow')).toEqual(exposed('selectedRecord'));
  });
});

describe('Listview: pagination', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-PAGE-001] pagination renders only the configured number of rows per page', async () => {
    // Break this catches: an off-by-one in the slice window, or rendering the
    // whole data set while showing a pager.
    await mount({ properties: { enablePagination: binding('{{true}}'), rowsPerPage: binding('{{2}}') } });

    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(rowTexts()).toEqual(['Alpha', 'Beta']);
    expect(pager()).toBeTruthy();
  });

  test('[Listview-PAGE-002] moving to the next page shows the next slice and reports the index within that page', async () => {
    // Break this catches: a slice window that does not advance with the page,
    // and pins that `selectedRecordId` is the index WITHIN the rendered page.
    await mount({
      properties: { enablePagination: binding('{{true}}'), rowsPerPage: binding('{{2}}') },
      events: BOTH_EVENTS,
    });
    await waitFor(() => expect(rows()).toHaveLength(2));

    await user().click(document.querySelector('[data-cy="next-page-link"]'));

    await waitFor(() => expect(rowTexts()).toEqual(['Gamma']));

    await user().click(rows()[0]);

    await waitFor(() => expect(exposed('selectedRecordId')).toBe(0));
    expect(exposed('selectedRecord')?.text1?.text).toBe('Gamma');
  });

  test('[Listview-PAGE-003] an invalid rows-per-page falls back to ten', async () => {
    // Break this catches: dropping the fallback, so a binding that resolves to
    // 0 renders an empty list with a pager that can never reach the records.
    await mount({ properties: { enablePagination: binding('{{true}}'), rowsPerPage: binding('{{0}}') } });

    await waitFor(() => expect(rows()).toHaveLength(3));
  });

  test('[Listview-PAGE-004] with pagination off every record renders and no pager is shown', async () => {
    // Break this catches: rendering the pager (and its slice) regardless of the
    // property, which would silently truncate long lists.
    await mount({ properties: { enablePagination: binding('{{false}}'), rowsPerPage: binding('{{2}}') } });

    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(pager()).toBeFalsy();
  });

  test('[Listview-PAGE-005] shrinking the data below the current page still renders the records that remain', async () => {
    // Break this catches: leaving the view on a page index the data no longer
    // reaches, which strands the user on a blank page after a query refresh.
    await mount({ properties: { enablePagination: binding('{{true}}'), rowsPerPage: binding('{{2}}') } });
    await waitFor(() => expect(rows()).toHaveLength(2));
    await user().click(document.querySelector('[data-cy="next-page-link"]'));
    await waitFor(() => expect(rowTexts()).toEqual(['Gamma']));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'data', `{{[{ text: 'OnlyOne' }]}}`, 'properties');
    });

    await waitFor(() => expect(rowTexts()).toEqual(['OnlyOne']));
  });
});

describe('Listview: loading, visibility and disabled', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-STATE-001] Loading state replaces the rows with a spinner', async () => {
    // Break this catches: rendering the spinner BESIDE the rows, which would
    // mount every child component against stale data while a query is running.
    await mount({ properties: { loadingState: binding('{{true}}') } });

    expect(rows()).toHaveLength(0);
    expect(spinner()).toBeTruthy();
  });

  test('[Listview-STATE-002] Visibility off hides the list', async () => {
    // Break this catches: leaving a "hidden" list on screen and clickable.
    await mount({ properties: { visibility: binding('{{false}}') } });

    expect(container()).toHaveStyle({ display: 'none' });
  });

  test('[Listview-STATE-003] Disable marks the list disabled and inert', async () => {
    // Break this catches: dropping the `inert` property (the mechanism that
    // takes every row out of the tab order and blocks pointer input in a
    // browser) or the `data-disabled` marker styling depends on. Whether the
    // browser then actually blocks the interaction is Listview-BRW-003.
    await mount({ properties: { disabledState: binding('{{true}}') } });

    expect(container()).toHaveAttribute('data-disabled', 'true');
    expect(container().inert).toBe(true);
  });
});

describe('Listview: styles', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-STYLE-001] background, border colour and border radius apply to the list container', async () => {
    // Break this catches: reading any of the three from the wrong style key, so
    // a themed list renders with defaults.
    await mount({
      styles: {
        backgroundColor: binding('rgb(1, 2, 3)'),
        borderColor: binding('rgb(4, 5, 6)'),
        borderRadius: binding('{{12}}'),
      },
    });

    expect(container().style.backgroundColor).toBe('rgb(1, 2, 3)');
    expect(container().style.borderColor).toBe('rgb(4, 5, 6)');
    expect(container().style.borderRadius).toBe('12px');
  });

  test('[Listview-STYLE-002] a legacy white background becomes the dark surface in dark mode', async () => {
    // Break this catches: dropping the shim, which puts a white block in the
    // middle of every dark-mode app saved before custom themes.
    await mount({ styles: { backgroundColor: binding('#fff') }, darkMode: true });

    expect(container().style.backgroundColor).toBe('rgb(35, 46, 60)');
  });
});

describe('Listview: compatibility', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-COMPAT-001] a definition predating pagination, dynamic height and mode still renders its rows', async () => {
    // Break this catches: treating any of the newer keys as required, which
    // would break every list saved before they existed.
    legacyWidget.setup();
    legacyWidget.render({ currentMode: 'view' });
    await waitFor(() => expect(container()).toBeInTheDocument());

    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(rowTexts()).toEqual(['Alpha', 'Beta', 'Gamma']);

    await legacyWidget.session.user.click(rows()[1]);

    await waitFor(() => expect(legacyWidget.exposed()?.selectedRecordId).toBe(1));
    legacyWidget.teardown();
  });
});

/**
 * A definition saved before `enablePagination`/`rowsPerPage`/`dynamicHeight`/
 * `mode`/`columns`/`showBorder` existed: those keys are ABSENT, not falsy.
 */
const legacyWidget = createWidgetHarness({
  componentType: 'Listview',
  handle: NAME,
  id: ID,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(THREE_RECORDS),
    rowHeight: binding('100'),
    loadingState: binding('{{false}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
  },
  defaultStyles: {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-weak-border)'),
  },
  defaultExtraComponents: { txt1: TEXT_CHILD() },
  capabilities: { dnd: true },
  widgetHeight: 450,
  widgetWidth: 600,
});
