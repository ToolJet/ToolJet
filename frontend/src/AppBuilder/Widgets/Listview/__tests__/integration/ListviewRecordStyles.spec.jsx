/**
 * Listview record styles: List style (Legacy / Bordered / Container / Plain), gap, record colours and the
 * grid record height. Scenarios live in frontend/ee/test/app-builder/widgets/Listview/TESTING.md.
 *
 * Real store, real RenderWidget, real Listview rows. jsdom drops `var(...)` colours and `calc(...)`
 * widths from inline styles, so colours here are rgb literals and the legacy separator is read from its
 * class; real geometry (scroll inside a record) is QA's Listview-BRW-008.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition, seedApp } from '@/test/app-builder';
import { listviewConfig } from '@tooljet/widget-definitions';
import { Inspector } from '@/AppBuilder/RightSideBar/Inspector/Inspector';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager/componentTypes';
import { resolveListviewHeightFromRows } from '@/AppBuilder/_stores/utils/dynamicHeightReflow';

const ID = 'lv1';
const NAME = 'listview1';
const THREE_RECORDS = `{{[{ text: 'Alpha' }, { text: 'Beta' }, { text: 'Gamma' }]}}`;

// WidgetWrapper hides a child without device flags, so every row would be empty without them.
function textChild() {
  const definition = componentDefinition('txt1', 'text1', 'Text', { text: binding('{{listItem.text}}') });
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
    data: binding(THREE_RECORDS),
    mode: binding('list'),
    columns: binding('{{3}}'),
    rowHeight: binding('100'),
    loadingState: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    showBorder: binding('{{true}}'),
    rowsPerPage: binding('{{10}}'),
    enablePagination: binding('{{false}}'),
  },
  defaultStyles: {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-weak-border)'),
    borderRadius: binding('{{6}}'),
  },
  defaultExtraComponents: { txt1: textChild() },
  capabilities: { dnd: true },
  widgetHeight: 624,
  widgetWidth: 600,
});

const container = () => document.getElementById(ID);
const list = () => container().querySelector('[role="list"]');
const rows = () => [...document.querySelectorAll('.list-item')];
const dividers = () => [...container().querySelectorAll('.listview-record-divider')];
const verticalDividers = () => [...container().querySelectorAll('.listview-record-divider-vertical')];
const SIX_RECORDS = `{{[1, 2, 3, 4, 5, 6].map((n) => ({ text: 'R' + n }))}}`;

async function mount(options = {}, recordCount = 3) {
  widget.render({ currentMode: 'view', ...options });
  await waitFor(() => expect(container()).toBeInTheDocument());
  await waitFor(() => expect(rows()).toHaveLength(recordCount));
}

describe('Listview: list styles', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test.each([
    ['on', '{{true}}', true],
    ['off', '{{false}}', false],
  ])(
    '[Listview-STYLE-004] Legacy keeps 7px padding and the bottom separator follows showBorder (%s)',
    async (_label, showBorder, separated) => {
      // Break this catches: the new styles leaking into Legacy, so every saved ListView changes its
      // spacing or loses (or gains) the separator it had.
      await mount({ properties: { showBorder: binding(showBorder) }, styles: { listStyle: binding('legacy') } });

      expect(container().style.padding).toBe('7px');
      expect(list().style.gap).toBe('');
      rows().forEach((row) => {
        expect(row.classList.contains('listview-legacy-divider')).toBe(separated);
        expect(row.style.border).toBe('');
        expect(row.style.backgroundColor).toBe('');
      });
      expect(dividers()).toHaveLength(0);
    }
  );

  test('[Listview-STYLE-005] Bordered fills records, draws no border and centres a divider in each gap', async () => {
    // Break this catches: a border left on the records, the divider reading another colour, a divider
    // after the last record, or a line that is not in the middle of the gap.
    await mount({
      styles: {
        listStyle: binding('bordered'),
        gap: binding('{{12}}'),
        recordBackgroundColor: binding('rgb(7, 8, 9)'),
        recordDividerColor: binding('rgb(1, 2, 3)'),
        recordBorderColor: binding('rgb(4, 5, 6)'),
      },
    });

    rows().forEach((row) => {
      expect(row.style.backgroundColor).toBe('rgb(7, 8, 9)');
      expect(row.style.border).toBe('');
    });
    expect(dividers()).toHaveLength(2);
    dividers().forEach((divider) => expect(divider.style.borderTop).toBe('1px solid rgb(1, 2, 3)'));
    // Half the gap on each side puts the line in the middle of the 12px gap.
    expect(list().style.rowGap).toBe('6px');
    expect(verticalDividers()).toHaveLength(0);
  });

  test('[Listview-STYLE-005] a new bordered ListView matches Figma 238:1379: padding 12, gap 12, record 80', async () => {
    // Break this catches: a non-Legacy list keeping the legacy 7px padding, or the new-look values
    // not reaching the rendered records.
    await mount({
      properties: { rowHeight: binding('80') },
      styles: {
        listStyle: binding('bordered'),
        gap: binding('{{12}}'),
        recordDividerColor: binding('rgb(1, 2, 3)'),
      },
    });

    expect(container().style.padding).toBe('12px');
    // 6px + the 1px line + 6px between two records.
    expect(list().style.rowGap).toBe('6px');
    expect(rows()[0].style.height).toBe('80px');
    expect(rows()[0].style.borderRadius).toBe('');
  });

  test('[Listview-STYLE-006] Container draws each record as a card with no divider', async () => {
    // Break this catches: a card missing its background, border colour or radius, or a divider left
    // between the cards.
    await mount({
      styles: {
        listStyle: binding('container'),
        gap: binding('{{12}}'),
        recordBackgroundColor: binding('rgb(7, 8, 9)'),
        recordBorderColor: binding('rgb(4, 5, 6)'),
        recordBorderRadius: binding('{{8}}'),
        recordDividerColor: binding('rgb(1, 2, 3)'),
      },
    });

    rows().forEach((row) => {
      expect(row.style.backgroundColor).toBe('rgb(7, 8, 9)');
      expect(row.style.border).toBe('1px solid rgb(4, 5, 6)');
      expect(row.style.borderRadius).toBe('8px');
      expect(row.classList.contains('listview-legacy-divider')).toBe(false);
    });
    expect(list().style.rowGap).toBe('12px');
    expect(dividers()).toHaveLength(0);
  });

  test('[Listview-STYLE-007] Plain separates records by the gap only', async () => {
    // Break this catches: a background, border or divider leaking into Plain from the saved record keys.
    await mount({
      styles: {
        listStyle: binding('plain'),
        gap: binding('{{12}}'),
        recordBackgroundColor: binding('rgb(7, 8, 9)'),
        recordDividerColor: binding('rgb(1, 2, 3)'),
        recordBorderColor: binding('rgb(4, 5, 6)'),
      },
    });

    rows().forEach((row) => {
      expect(row.style.backgroundColor).toBe('');
      expect(row.style.border).toBe('');
    });
    expect(dividers()).toHaveLength(0);
    expect(list().style.rowGap).toBe('12px');
  });

  test('[Listview-STYLE-008] grid Bordered draws dividers between rows and between columns', async () => {
    // Break this catches: the divider drawn in list mode only, so grid cells run together (the PRD's
    // "grid column border not visible"), or lines past the last row or column.
    await mount(
      {
        properties: { mode: binding('grid'), columns: binding('{{3}}'), data: binding(SIX_RECORDS) },
        styles: { listStyle: binding('bordered'), gap: binding('{{12}}'), recordDividerColor: binding('rgb(1, 2, 3)') },
      },
      6
    );

    // Two lines of three: one row divider, two column dividers per line.
    expect(dividers()).toHaveLength(1);
    expect(verticalDividers()).toHaveLength(4);
    verticalDividers().forEach((divider) => expect(divider.style.borderLeft).toBe('1px solid rgb(1, 2, 3)'));
    expect(list().style.columnGap).toBe('6px');
    rows().forEach((row) => expect(row.style.border).toBe(''));
  });

  test('[Listview-STYLE-008] grid Bordered ignores showBorder, which stays Legacy-only', async () => {
    // Break this catches: the Legacy toggle hiding the Bordered dividers.
    await mount(
      {
        properties: {
          mode: binding('grid'),
          columns: binding('{{3}}'),
          data: binding(SIX_RECORDS),
          showBorder: binding('{{false}}'),
        },
        styles: { listStyle: binding('bordered'), recordDividerColor: binding('rgb(1, 2, 3)') },
      },
      6
    );

    expect(dividers()).toHaveLength(1);
    expect(verticalDividers()).toHaveLength(4);
  });

  test('[Listview-STYLE-009] Legacy in dark mode keeps the white-to-dark swap behind the records', async () => {
    // Break this catches: a record background painted in Legacy, which covers the dark surface the
    // swap gives a ListView saved with a white background.
    await mount({ styles: { listStyle: binding('legacy'), backgroundColor: binding('#fff') }, darkMode: true });

    expect(container().style.backgroundColor).toBe('rgb(35, 46, 60)');
    rows().forEach((row) => expect(row.style.backgroundColor).toBe(''));
  });
});

describe('Listview: grid record height', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-ROW-004] grid records use gridRecordHeight', async () => {
    // Break this catches: grid reading rowHeight only, so new grids lose their 150px records.
    await mount({
      properties: { mode: binding('grid'), rowHeight: binding('100'), gridRecordHeight: binding('150') },
    });

    rows().forEach((row) => expect(row.style.height).toBe('150px'));
  });

  test('[Listview-ROW-004] grid records without gridRecordHeight use rowHeight', async () => {
    // Break this catches: no fallback, so a saved grid without the key loses its height.
    await mount({ properties: { mode: binding('grid'), rowHeight: binding('100') } });

    rows().forEach((row) => expect(row.style.height).toBe('100px'));
  });

  test('[Listview-ROW-004] list records keep rowHeight when gridRecordHeight is set', async () => {
    // Break this catches: the grid height leaking into list mode.
    await mount({ properties: { rowHeight: binding('80'), gridRecordHeight: binding('150') } });

    rows().forEach((row) => expect(row.style.height).toBe('80px'));
  });
});

/** The real Styles tab for the seeded ListView, as the Inspector builds it. */
function renderStylesTab(listStyle) {
  seedApp({ [ID]: componentDefinition(ID, NAME, 'Listview', {}, { styles: { listStyle: binding(listStyle) } }) });
  const stored = store().getCurrentPageComponents(MODULE_ID)[ID];
  const componentMeta = {
    ...componentTypeDefinitionMap.Listview,
    ...stored.component,
    definition: stored.component.definition,
  };
  const component = { id: ID, component: JSON.parse(JSON.stringify(componentMeta)) };
  return (
    <Inspector.RenderStyleOptions
      componentMeta={componentMeta}
      component={component}
      paramUpdated={() => {}}
      dataQueries={[]}
      currentState={{}}
      allComponents={{}}
      hasCustomStyling={false}
    />
  );
}

/** Each Styles tab group as { title, fields } in the order shown. */
const styleGroups = () =>
  [...document.querySelectorAll('.accordion-item')].map((group) => ({
    title: group.querySelector('.accordion-title-text')?.textContent,
    fields: [...group.querySelectorAll('label[data-cy^="label-"]')].map((label) => label.textContent),
  }));
const groupFields = (title) => styleGroups().find((group) => group.title === title)?.fields;

const CONTAINER_FIELDS = ['Background color', 'Border', 'Border radius', 'Box shadow'];

describe('Listview: the Styles tab follows List style', () => {
  test.each([
    ['legacy', ['List style']],
    ['bordered', ['List style', 'Gap', 'Background', 'Divider']],
    ['container', ['List style', 'Gap', 'Background', 'Border', 'Border radius', 'Box shadow']],
    ['plain', ['List style', 'Gap']],
  ])('[Listview-STYLE-010] List style %s shows only its own record fields', (listStyle, expected) => {
    // Break this catches: a field shown for a style that does not use it, or one missing for a style
    // that does, so the builder edits a value that changes nothing.
    render(renderStylesTab(listStyle));

    expect(groupFields('Records')).toEqual(expected);
  });

  test('[Listview-STYLE-010] changing List style swaps the record fields', () => {
    // Break this catches: fields computed once, so switching style keeps the old style's fields.
    const { rerender } = render(renderStylesTab('container'));
    rerender(renderStylesTab('bordered'));

    expect(groupFields('Records')).toEqual(['List style', 'Gap', 'Background', 'Divider']);
  });

  test('[Listview-STYLE-010] the List style select offers the four styles, Legacy last', () => {
    // Break this catches: a style missing from the select, so it can only be reached by editing JSON.
    expect(listviewConfig.styles.listStyle.options.map((option) => option.value)).toEqual([
      'bordered',
      'container',
      'plain',
      'legacy',
    ]);
    expect(listviewConfig.definition.styles.listStyle).toEqual({ value: 'legacy' });
  });

  test('[Listview-STYLE-012] record fields sit under Records and the widget box fields under Container', () => {
    // Break this catches: the record and box fields mixed in one flat list, so two "Background" and
    // two "Border radius" fields cannot be told apart.
    render(renderStylesTab('container'));

    expect(styleGroups().map((group) => group.title)).toEqual(['Records', 'Container']);
    expect(groupFields('Container')).toEqual(CONTAINER_FIELDS);
  });
});

/** No row children, so dynamic height falls back to the configured record height. */
const bareWidget = createWidgetHarness({
  componentType: 'Listview',
  handle: NAME,
  id: ID,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(THREE_RECORDS),
    rowHeight: binding('100'),
    columns: binding('{{3}}'),
    dynamicHeight: binding('{{true}}'),
  },
  capabilities: { dnd: true },
  widgetHeight: 400,
  widgetWidth: 600,
});

async function dynamicHeightFor({ properties = {}, styles = {} }) {
  bareWidget.render({ currentMode: 'view', properties, styles });
  await waitFor(() => expect(container()).toBeInTheDocument());
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
}

describe('Listview: dynamic height counts the record style', () => {
  beforeEach(bareWidget.setup);
  afterEach(bareWidget.teardown);

  test("[Listview-ROW-006] Legacy keeps today's height: records, bottom borders and 7px padding", async () => {
    // Break this catches: the new allowances leaking into Legacy, which resizes every saved dynamic list.
    const height = await dynamicHeightFor({ styles: { listStyle: binding('legacy') } });

    // 3 x 100 + 3 bottom borders + 18 chrome.
    expect(height).toBe(321);
  });

  test('[Listview-ROW-006] Bordered with gap 12 adds the 12px padding, the 2 gaps and their lines', async () => {
    // Break this catches: a dynamic list sized for 7px padding and no gaps, which cuts off its last record.
    const height = await dynamicHeightFor({ styles: { listStyle: binding('bordered'), gap: binding('{{12}}') } });

    // 3 x 100 + 2 x (12 gap + 1px line) + 28 chrome (12px padding x 2 + borders + safety).
    expect(height).toBe(354);
  });

  const GRID_CONTAINER = { listStyle: binding('container'), gap: binding('{{12}}') };

  test('[Listview-ROW-006] grid uses gridRecordHeight', async () => {
    // Break this catches: grid dynamic height sized from rowHeight, so a 150px grid record is cut off.
    const height = await dynamicHeightFor({
      properties: { mode: binding('grid'), gridRecordHeight: binding('150') },
      styles: GRID_CONTAINER,
    });

    // One line of three records: 150 + 28 chrome, no gap.
    expect(height).toBe(178);
  });

  test('[Listview-ROW-006] grid without gridRecordHeight uses rowHeight', async () => {
    // Break this catches: no fallback, so a saved grid without the key sizes to nothing.
    const height = await dynamicHeightFor({ properties: { mode: binding('grid') }, styles: GRID_CONTAINER });

    expect(height).toBe(128);
  });
});

/** A ListView exported before 2.0: none of the 2.0 keys. */
const PRE_TWO_ZERO_EXPORT = {
  properties: {
    data: { value: "{{[{ text: 'a' }]}}" },
    rowHeight: { value: '100' },
    showBorder: { value: '{{true}}' },
  },
  styles: { backgroundColor: { value: 'var(--cc-surface1-surface)' } },
};

// The harness seeds the config `definition` under the export, as the server does on import and load.
const importedWidget = createWidgetHarness({
  componentType: 'Listview',
  handle: NAME,
  id: ID,
  defaultProperties: PRE_TWO_ZERO_EXPORT.properties,
  defaultStyles: PRE_TWO_ZERO_EXPORT.styles,
  capabilities: { dnd: true },
  widgetHeight: 300,
  widgetWidth: 600,
});

describe('Listview: an export from before 2.0', () => {
  beforeEach(importedWidget.setup);
  afterEach(importedWidget.teardown);

  test('[Listview-COMPAT-003] loads with the old look once the config defaults are merged under it', async () => {
    // Break this catches: a config default for a 2.0 key set to the new look, which restyles every
    // imported ListView on its first load.
    importedWidget.render({ currentMode: 'view' });
    await waitFor(() => expect(rows()).toHaveLength(1));

    const { properties, styles } = store().getCurrentPageComponents(MODULE_ID)[ID].component.definition;
    expect(styles.listStyle).toEqual({ value: 'legacy' });
    expect(properties.showHeader).toEqual({ value: '{{false}}' });
    expect(properties.rowHeight).toEqual({ value: '100' });
    expect(properties.gridRecordHeight).toBeUndefined();
    expect(container().style.padding).toBe('7px');
    expect(rows()[0].style.height).toBe('100px');
  });
});
