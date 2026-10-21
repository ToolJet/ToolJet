/**
 * UI 2.0 Table with no rows: the header stays, and the empty state is the body's one row under it, one cell across
 * every column, the icon above the message (the Empty message property, else the default). Real store, real
 * RenderWidget, real widget. The native Table's shadcn look drew its empty state in the header row
 * (NewTable/__tests__/emptyState.spec.jsx); this pins the UI 2.0 Table's placement.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { screen } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const COLUMNS =
  "{{['order', 'customer', 'placed', 'delivery', 'items', 'value', 'status'].map((key) => ({ key, name: key.toUpperCase() }))}}";
const widget = createWidgetHarness({
  componentType: 'ShadTable',
  handle: 'orders',
  id: 'orders',
  widgetHeight: 200,
  widgetWidth: 800,
});
const render = (properties = {}) =>
  widget.render({
    currentMode: 'view',
    properties: { data: binding('{{[]}}'), columns: binding(COLUMNS), ...properties },
  });

const placement = (message) => {
  const head = document.querySelector('thead');
  const body = document.querySelector('tbody');
  expect(head.textContent).toContain('DELIVERY');
  expect(head.contains(message)).toBe(false);
  expect(head.querySelector('svg.lucide-inbox')).toBeNull();
  expect(body.contains(message)).toBe(true);
  const cell = message.closest('td');
  expect(cell.colSpan).toBe(head.querySelectorAll('th').length);
  const icon = cell.querySelector('svg');
  expect(icon.compareDocumentPosition(message) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
};

describe('UI 2.0 Table with no rows', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[ShadTable-EMPTY-001] the Empty message shows in the body under the header, across every column', async () => {
    render({ emptyText: binding('No orders yet') });
    placement(await screen.findByText('No orders yet'));
  });

  test('[ShadTable-EMPTY-002] with no Empty message the default shows in the same place', async () => {
    render();
    placement(await screen.findByText('No results.'));
  });
});
