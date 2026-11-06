/**
 * A failure while drawing the chips must not take the whole Table down: the chip row is isolated, and the
 * rest of the table (filter button, rows) keeps working.
 */
jest.mock('../../_components/Header/_components/FilterChips', () => ({
  FilterChips: () => {
    throw new Error('chip row failed');
  },
}));

import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '../../../__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'Table',
  handle: 'table1',
  id: 't1',
  widgetHeight: 460,
  widgetWidth: 900,
  capabilities: { dnd: true },
  defaultProperties: {
    data: binding("{{[{ id: 1, name: 'Ada' }, { id: 2, name: 'Bob' }]}}"),
    columns: { value: [{ id: 'c-name', name: 'Name', key: 'name', columnType: 'string' }] },
    autogenerateColumns: binding(false),
    defaultFilters: { value: [{ id: 'f1', column: 'c-name', condition: 'contains', value: '' }] },
  },
});

beforeEach(widget.setup);
afterEach(widget.teardown);

describe('Table-FILTERUI-047 a failing chip row', () => {
  test('Table-FILTERUI-047 leaves the filter button and the table working', async () => {
    // Break this catches: one broken chip blanking the whole Table with "Something went wrong".
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    widget.render({ currentMode: 'view' });

    await waitFor(() => expect(widget.exposed().currentData?.length).toBe(2));
    expect(document.querySelector('[data-cy="table1-filter-button"]')).not.toBeNull();
    expect(document.querySelectorAll('[data-cy="table1-filter-button"]')).toHaveLength(1);
    expect(document.querySelector('[data-cy^="table1-filter-chip-"]')).toBeNull();
    spy.mockRestore();
  });
});
