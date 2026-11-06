/**
 * A Table that remounts (a page switch and back) applies the builder's default filters again, as on the
 * first mount, and does not run the app's filter handlers for it.
 */
import React from 'react';
import { waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import {
  createWidgetHarness,
  binding,
  countInvocationsOn,
  store,
  widgetProps,
} from '../../../__tests__/integration/widgetHarness';

const ID = 't1';
const SIZE = { widgetHeight: 460, widgetWidth: 750 };

const widget = createWidgetHarness({
  componentType: 'Table',
  handle: 'table1',
  id: ID,
  ...SIZE,
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
    defaultFilters: { value: [{ id: 'f1', column: 'c-name', condition: 'contains', value: 'a' }] },
  },
});

beforeEach(widget.setup);
afterEach(widget.teardown);

const shownNames = () => (widget.exposed().filteredData ?? []).map((row) => row.name);

describe('Table-FILTERUI-009 builder filters when the table remounts', () => {
  test('Table-FILTERUI-009 are applied again, without running the filter handlers', async () => {
    // Break this catches: the filters being lost, or the app's filter handlers running, when the table remounts.
    widget.render({ currentMode: 'view', events: countInvocationsOn(ID, 'onFilterChanged') });
    await waitFor(() => expect(shownNames()).toEqual(['Ada', 'Grace']));

    await widget.session.render(<div />);
    await widget.session.render(<RenderWidget {...widgetProps(ID, 'Table', { ...SIZE, currentMode: 'view' })} />);

    await waitFor(() => expect(widget.exposed().currentData?.length).toBe(3));
    await waitFor(() => expect(shownNames()).toEqual(['Ada', 'Grace']));
    // the exposed values of the first mount are still in the store, so check again once the new mount has settled
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(shownNames()).toEqual(['Ada', 'Grace']);
    expect(widget.exposed().filters).toEqual([{ column: 'Name', condition: 'contains', value: 'a' }]);
    expect(store().getVariable('calls', 'canvas')).toBeUndefined();
  });
});
