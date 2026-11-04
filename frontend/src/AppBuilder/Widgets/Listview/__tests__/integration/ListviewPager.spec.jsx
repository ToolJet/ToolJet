/**
 * Listview 2.0 pager: every List View shows Table's pager (no « », no "Showing x of y") in a 60px footer
 * that is a normal part of the layout. Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md
 * (Listview-PAG-010..015). Real store, real RenderWidget.
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
const records = (count) =>
  `{{${JSON.stringify(Array.from({ length: count }, (_, index) => ({ name: `r${index}` })))}}}`;

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
    data: binding(records(40)),
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
const exposed = (key) => widget.exposed()?.[key];
const container = () => document.getElementById(ID);
const rows = () => [...document.querySelectorAll('.list-item')];
const rowTexts = () => rows().map((node) => node.textContent);
const cy = (name) => document.querySelector(`[data-cy="${name}"]`);
const cyAll = (name) => [...document.querySelectorAll(`[data-cy="${name}"]`)];
const pageLabels = () => cyAll('pagination-button-go-to-page').map((node) => node.textContent.trim());
const footer = () => cy('container-pagination');
const fired = (key) => store().getVariable(key, MODULE_ID) ?? 0;

const PAGE_EVENT = {
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
};

async function mount(options = {}) {
  widget.render({ currentMode: 'view', ...options });
  await waitFor(() => expect(rows().length).toBeGreaterThan(0));
}

describe('Listview: pager', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-PAG-010] the pager is Table\'s: previous, numbers, more, next; no first, last or "Showing"', async () => {
    // Break this catches: the old Bootstrap pager with « » and "Showing x to y of z".
    await mount();

    expect(cy('pagination-section')).toBeInTheDocument();
    expect(cy('pagination-button-to-previous')).toBeDisabled();
    expect(cy('pagination-button-to-next')).toBeEnabled();
    expect(pageLabels()).toEqual(['1', '2', '3']);
    expect(cy('pagination-button-more-pages')).toBeInTheDocument();
    expect(cy('pagination-button-to-first')).toBeNull();
    expect(cy('pagination-button-to-last')).toBeNull();
    expect(footer().textContent).not.toMatch(/Showing/i);
    expect(document.querySelector('.pagination')).toBeNull();
  });

  test.each([
    [300, ['1', '2', '3'], true],
    [220, ['1', '2', '3'], true],
    [219, ['1'], true],
    [180, ['1'], true],
    [160, ['1'], true],
    [159, ['1'], false],
    [140, ['1'], false],
  ])(
    '[Listview-PAG-011] a %ipx list shows numbers %j and the page list button: %s',
    async (widgetWidth, numbers, more) => {
      // Break this catches: one rule for every width; Figma shows ‹ 1 2 3 ••• › at 260, ‹ 1 ••• › at 180 and ‹ 1 › at 140.
      await mount({ widgetWidth });

      expect(pageLabels()).toEqual(numbers);
      expect(!!cy('pagination-button-more-pages')).toBe(more);
      expect(cy('pagination-button-to-previous')).toBeInTheDocument();
      expect(cy('pagination-button-to-next')).toBeInTheDocument();
    }
  );

  test('[Listview-PAG-012] the footer is a 60px flex item, not fixed to the bottom, and the list keeps its full height', async () => {
    // Break this catches: the fixed-bottom footer and the 54px taken off the list height.
    await mount();

    expect(footer().style.height).toBe('60px');
    expect(footer().className).not.toContain('fixed-bottom');
    expect(footer().style.position).not.toBe('fixed');
    // The canvas hands a widget its box minus 4px; nothing more comes off for the pager.
    expect(container().style.height).toBe('596px');
    expect(container().contains(footer())).toBe(true);
    expect(footer().style.justifyContent).toBe('center');
  });

  test('[Listview-PAG-013] a Legacy list gets the same pager', async () => {
    // Break this catches: keeping the old pager for saved lists.
    await mount({ styles: { listStyle: binding('legacy') } });

    expect(cy('pagination-section')).toBeInTheDocument();
    expect(cy('pagination-button-to-first')).toBeNull();
    expect(footer().style.height).toBe('60px');
  });

  test('[Listview-PAG-014] next, a number and the page list change the page and fire On page change', async () => {
    // Break this catches: a pager that moves the list without the event, or a page list that goes nowhere.
    await mount({ events: [PAGE_EVENT] });

    await user().click(cy('pagination-button-to-next'));
    await waitFor(() => expect(exposed('pageIndex')).toBe(2));
    expect(rowTexts()[0]).toBe('r5');
    await user().click(cyAll('pagination-button-go-to-page').find((node) => node.textContent.trim() === '3'));
    await waitFor(() => expect(exposed('pageIndex')).toBe(3));
    await user().click(cy('pagination-button-to-previous'));
    await waitFor(() => expect(exposed('pageIndex')).toBe(2));
    await waitFor(() => expect(fired('pageCalls')).toBe(3));
  });

  test('[Listview-PAG-015] with pagination on and no records the footer stays, empty', async () => {
    // Break this catches: the footer collapsing, so the list resizes when data arrives.
    widget.render({ currentMode: 'view', properties: { data: binding('{{[]}}') } });
    await waitFor(() => expect(container()).toBeInTheDocument());

    expect(footer()).toBeInTheDocument();
    expect(footer().style.height).toBe('60px');
    expect(cy('pagination-section')).toBeNull();
  });
});
