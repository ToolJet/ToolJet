/**
 * Listview 2.0 empty state (Figma "No data found"): every ListView with no records shows an icon, a title and a
 * subtitle between its header and footer. Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md
 * (Listview-EMPTY-001..005). Real store, real RenderWidget.
 */
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';

const ID = 'b1b1b1b1-0000-4000-8000-0000000000bb';

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
  handle: 'listview1',
  id: ID,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding('{{[]}}'),
    mode: binding('list'),
    columns: binding('{{1}}'),
    rowHeight: binding('80'),
    loadingState: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    showBorder: binding('{{true}}'),
    showHeader: binding('{{true}}'),
    rowsPerPage: binding('{{5}}'),
    enablePagination: binding('{{true}}'),
  },
  defaultStyles: {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-weak-border)'),
    listStyle: binding('bordered'),
    gap: binding('{{12}}'),
  },
  defaultExtraComponents: { txt1: textChild() },
  capabilities: { dnd: true },
  widgetHeight: 600,
  widgetWidth: 600,
});

const container = () => document.getElementById(ID);
const emptyState = () => container()?.querySelector('[data-cy="listview-empty-state"]');
const rows = () => [...document.querySelectorAll('.list-item')];

async function mount(options = {}) {
  widget.render({ currentMode: 'view', ...options });
  await waitFor(() => expect(container()).toBeInTheDocument());
}

describe('Listview: empty state', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-EMPTY-001] no records shows the icon, "No data found" and the subtitle', async () => {
    // Break this catches: a blank box, or Table's "No data" warning look.
    await mount();

    expect(emptyState()).toBeInTheDocument();
    expect(emptyState().textContent).toContain('No data found');
    expect(emptyState().textContent).toContain('Connect your database or use sample data to see results');
    expect(emptyState().querySelector('svg')).toBeInTheDocument();
    expect(rows()).toHaveLength(0);
  });

  test.each([
    ['text', "{{'abc'}}"],
    ['an object', '{{({ a: 1 })}}'],
    ['null', '{{null}}'],
  ])(
    '[Listview-EMPTY-002] data that is %s, not a list of records, shows the same empty state',
    async (_label, data) => {
      // Break this catches: an empty state only for [], so a failed query leaves a blank box.
      await mount({ properties: { data: binding(data) } });

      expect(emptyState()).toBeInTheDocument();
    }
  );

  test('[Listview-EMPTY-003] records hide the empty state', async () => {
    // Break this catches: the empty state drawn under real records.
    await mount({ properties: { data: binding("{{[{ name: 'a' }]}}") } });

    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(emptyState()).toBeNull();
  });

  test('[Listview-EMPTY-004] the header and the footer stay around the empty state, in the builder too', async () => {
    // Break this catches: the empty state replacing the whole widget body, so the header and pager vanish.
    await mount({ currentMode: 'edit' });

    expect(emptyState()).toBeInTheDocument();
    expect(container().querySelector('.listview-header-wrapper')).toBeInTheDocument();
    expect(container().querySelector('[data-cy="container-pagination"]')).toBeInTheDocument();
    expect(container().querySelector('[data-cy="container-pagination"]').style.height).toBe('60px');
  });

  test('[Listview-EMPTY-005] the empty state fills the space between header and footer and centres', async () => {
    // Break this catches: an empty state pinned to the top instead of centred in the free space.
    await mount();

    const node = emptyState();
    expect(node.style.flex).toBe('1 1 0%');
    expect(node.style.justifyContent).toBe('center');
    expect(node.style.alignItems).toBe('center');
  });

  test('[Listview-EMPTY-006] a loading list shows the spinner, not the empty state', async () => {
    // Break this catches: "No data found" flashing while a query is still running.
    await mount({ properties: { loadingState: binding('{{true}}') } });

    expect(emptyState()).toBeNull();
  });
});
