/**
 * Listview record styles: List style (Legacy / Bordered / Container / Plain), gap, record colours and the
 * grid record height. Scenarios live in frontend/ee/test/app-builder/widgets/Listview/TESTING.md.
 *
 * Real store, real RenderWidget, real Listview rows. jsdom drops `var(...)` colours and `calc(...)`
 * widths from inline styles, so colours here are rgb literals and the legacy separator is read from its
 * class; real geometry (scroll inside a record) is QA's Listview-BRW-008.
 */
import { waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import { listviewConfig } from '@tooljet/widget-definitions';
import { renderElement } from '@/AppBuilder/RightSideBar/Inspector/Utils';

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

async function mount(options = {}) {
  widget.render({ currentMode: 'view', ...options });
  await waitFor(() => expect(container()).toBeInTheDocument());
  await waitFor(() => expect(rows()).toHaveLength(3));
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

  test('[Listview-STYLE-005] Bordered spaces records by the gap and borders them with the record colour and radius', async () => {
    // Break this catches: ignoring the gap or reading the border colour/radius from the container keys.
    await mount({
      styles: {
        listStyle: binding('bordered'),
        gap: binding('{{12}}'),
        recordBorderColor: binding('rgb(4, 5, 6)'),
        recordBorderRadius: binding('{{8}}'),
      },
    });

    expect(list().style.rowGap).toBe('12px');
    rows().forEach((row) => {
      expect(row.style.border).toBe('1px solid rgb(4, 5, 6)');
      expect(row.style.borderRadius).toBe('8px');
    });
    expect(dividers()).toHaveLength(0);
  });

  test('[Listview-STYLE-005] a new bordered ListView matches Figma 238:1379: padding 12, gap 12, radius 6, record 80', async () => {
    // Break this catches: a non-Legacy list keeping the legacy 7px padding, or the new-look values
    // not reaching the rendered records.
    await mount({
      properties: { rowHeight: binding('80') },
      styles: {
        listStyle: binding('bordered'),
        gap: binding('{{12}}'),
        recordBorderColor: binding('rgb(4, 5, 6)'),
        recordBorderRadius: binding('{{6}}'),
      },
    });

    expect(container().style.padding).toBe('12px');
    expect(list().style.rowGap).toBe('12px');
    expect(rows()[0].style.borderRadius).toBe('6px');
    expect(rows()[0].style.height).toBe('80px');
  });

  test('[Listview-STYLE-006] Container fills records with the record background and draws no divider', async () => {
    // Break this catches: the record background not applied, or a border/divider left on the cards.
    await mount({
      styles: {
        listStyle: binding('container'),
        gap: binding('{{12}}'),
        recordBackgroundColor: binding('rgb(7, 8, 9)'),
        recordBorderColor: binding('rgb(4, 5, 6)'),
        recordDividerColor: binding('rgb(1, 1, 1)'),
      },
    });

    rows().forEach((row) => {
      expect(row.style.backgroundColor).toBe('rgb(7, 8, 9)');
      expect(row.style.border).toBe('');
      expect(row.classList.contains('listview-legacy-divider')).toBe(false);
    });
    expect(dividers()).toHaveLength(0);
  });

  test('[Listview-STYLE-007] Plain separates records with the divider colour and borders none', async () => {
    // Break this catches: a divider after the last record, a border left on the records, or the
    // divider reading the border colour.
    await mount({
      styles: {
        listStyle: binding('plain'),
        gap: binding('{{12}}'),
        recordDividerColor: binding('rgb(1, 2, 3)'),
        recordBorderColor: binding('rgb(4, 5, 6)'),
      },
    });

    rows().forEach((row) => expect(row.style.border).toBe(''));
    expect(dividers()).toHaveLength(2);
    dividers().forEach((divider) => expect(divider.style.borderTop).toBe('1px solid rgb(1, 2, 3)'));
    // Half the gap each side puts the line in the middle of the gap.
    expect(list().style.rowGap).toBe('6px');
  });

  const GRID_BORDERED = { listStyle: binding('bordered'), recordBorderColor: binding('rgb(4, 5, 6)') };

  test('[Listview-STYLE-008] grid records show their border', async () => {
    // Break this catches: the record border applied in list mode only, so grid cells run together.
    await mount({ properties: { mode: binding('grid'), columns: binding('{{3}}') }, styles: GRID_BORDERED });

    rows().forEach((row) => expect(row.style.border).toBe('1px solid rgb(4, 5, 6)'));
  });

  test('[Listview-STYLE-008] hiding the border removes it from grid records', async () => {
    // Break this catches: a grid border that cannot be turned off.
    await mount({
      properties: { mode: binding('grid'), columns: binding('{{3}}'), showBorder: binding('{{false}}') },
      styles: GRID_BORDERED,
    });

    rows().forEach((row) => expect(row.style.border).toBe(''));
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

const RECORD_FIELDS = [
  'gap',
  'recordBackgroundColor',
  'recordBorderColor',
  'recordDividerColor',
  'recordBorderRadius',
  'recordBoxShadow',
];

function visibleRecordFields(listStyle) {
  const definition = {
    properties: {},
    styles: { listStyle: { value: listStyle } },
  };
  const component = { id: ID, component: { component: 'Listview', name: NAME, properties: {}, definition } };
  return ['listStyle', ...RECORD_FIELDS].filter(
    (field) =>
      listviewConfig.styles[field] !== undefined &&
      renderElement(component, listviewConfig, () => {}, [], field, 'styles', {}, {}) !== undefined
  );
}

describe('Listview: the Styles tab follows List style', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test.each([
    ['legacy', ['listStyle']],
    [
      'bordered',
      ['listStyle', 'gap', 'recordBackgroundColor', 'recordBorderColor', 'recordBorderRadius', 'recordBoxShadow'],
    ],
    ['container', ['listStyle', 'gap', 'recordBackgroundColor', 'recordBorderRadius', 'recordBoxShadow']],
    ['plain', ['listStyle', 'gap', 'recordDividerColor']],
  ])('[Listview-STYLE-010] List style %s shows only its own fields', async (listStyle, expected) => {
    // Break this catches: a field shown for a style that does not use it, or one missing for a style
    // that does, so the builder edits a value that changes nothing.
    await mount();

    expect(visibleRecordFields(listStyle)).toEqual(expected);
  });

  test('[Listview-STYLE-010] the List style select offers the four styles, Legacy last', async () => {
    // Break this catches: a style missing from the select, so it can only be reached by editing JSON.
    await mount();
    const { listStyle } = store().getCurrentPageComponents(MODULE_ID)[ID].component.definition.styles;

    expect(listviewConfig.styles.listStyle.options.map((option) => option.value)).toEqual([
      'bordered',
      'container',
      'plain',
      'legacy',
    ]);
    expect(listStyle).toEqual({ value: 'legacy' });
  });
});
