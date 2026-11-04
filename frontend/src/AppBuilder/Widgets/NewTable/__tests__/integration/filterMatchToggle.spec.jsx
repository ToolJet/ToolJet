/**
 * Flipping Match all / any on a Table that already shows filtered rows: the rows must follow at once, not
 * only when the filters next change.
 */
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '../../../__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'Table',
  handle: 'table1',
  id: 't1',
  widgetHeight: 460,
  widgetWidth: 750,
  capabilities: { dnd: true },
  defaultProperties: {
    data: binding("{{[{ id: 1, name: 'Ada' }, { id: 2, name: 'Bob' }, { id: 3, name: 'Grace' }]}}"),
    columns: {
      value: [
        { id: 'c-id', name: 'Id', key: 'id', columnType: 'number' },
        { id: 'c-name', name: 'Name', key: 'name', columnType: 'string' },
      ],
    },
    autogenerateColumns: binding(false),
    defaultFilters: {
      value: [
        { id: 'f1', column: 'c-name', condition: 'equals', value: 'Bob' },
        { id: 'f2', column: 'c-name', condition: 'contains', value: 'ra' },
      ],
    },
  },
});

beforeEach(widget.setup);
afterEach(widget.teardown);

const shownNames = () => (widget.exposed().filteredData ?? []).map((row) => row.name);
const mounted = () => waitFor(() => expect(widget.exposed().currentData?.length).toBe(3));

describe('Table-FILTERUI-044 flipping Match on a filtered table', () => {
  test('Table-FILTERUI-044 switching to any shows the rows that match one filter, without touching the filters', async () => {
    // Break this catches: the filtered rows staying cached from the previous mode, so any looks like all.
    widget.render({ currentMode: 'edit' });
    await mounted();
    await waitFor(() => expect(shownNames()).toEqual([]));

    widget.setComponentProperty('t1', 'filterMatch', 'or', 'properties');

    await waitFor(() => expect(shownNames()).toEqual(['Bob', 'Grace']));
  });

  test('Table-FILTERUI-044 switching back to all narrows the rows again', async () => {
    // Break this catches: the switch only working in one direction.
    widget.render({ currentMode: 'edit', properties: { filterMatch: { value: 'or' } } });
    await mounted();
    await waitFor(() => expect(shownNames()).toEqual(['Bob', 'Grace']));

    widget.setComponentProperty('t1', 'filterMatch', 'and', 'properties');

    await waitFor(() => expect(shownNames()).toEqual([]));
  });

  test('Table-FILTERUI-044 flipping Match does not run the filter handlers', async () => {
    // Break this catches: a builder's toggle being reported to the app as if a user had changed a filter.
    widget.render({ currentMode: 'edit' });
    await mounted();
    const before = widget.exposed().filters;

    widget.setComponentProperty('t1', 'filterMatch', 'or', 'properties');
    await waitFor(() => expect(shownNames()).toEqual(['Bob', 'Grace']));

    expect(widget.exposed().filters).toEqual(before);
  });
});
