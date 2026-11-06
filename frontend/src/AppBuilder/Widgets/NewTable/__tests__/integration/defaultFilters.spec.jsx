/**
 * Builder default filters against a real Table: they are applied when the table mounts, reach the
 * `filters` exposed variable, stay quiet on mount, and can be cleared by the user for the session
 * without touching what the builder saved.
 *
 * Rows are read from the exposed `filteredData` (what the table's filter keeps): body rows are
 * virtualised and do not render under jsdom.
 */
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding, countInvocationsOn, store } from '../../../__tests__/integration/widgetHarness';
import useTableStore from '../../_stores/tableStore';

const ID = 't1';

const widget = createWidgetHarness({
  componentType: 'Table',
  handle: 'table1',
  id: ID,
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
  },
});

beforeEach(widget.setup);
afterEach(widget.teardown);

const BUILDER_FILTERS = [{ id: 'f1', column: 'c-name', condition: 'contains', value: 'a' }];
const withBuilderFilters = (extra = {}) => ({ defaultFilters: { value: BUILDER_FILTERS }, ...extra });

const appliedFilters = () => widget.exposed().filters;
const shownNames = () => (widget.exposed().filteredData ?? []).map((row) => row.name);
const savedFilters = () => useTableStore.getState().getTableProperties(ID)?.defaultFilters;

/** The table has mounted with its data, so what the filters did can be read. */
const mounted = () => waitFor(() => expect(widget.exposed().currentData?.length).toBe(3));

describe('Table-FILTERUI-001 a saved app without default filters', () => {
  test('Table-FILTERUI-001 shows every row and exposes no filters, as before', async () => {
    // Characterization: passes on arrival. Break this catches: the seeding hiding rows on an app without the property.
    widget.render({ currentMode: 'view' });
    await mounted();

    expect(shownNames()).toEqual(['Ada', 'Bob', 'Grace']);
    expect(appliedFilters()).toEqual([]);
  });
});

describe('Table-FILTERUI-003 builder filters are applied when the table mounts', () => {
  test('Table-FILTERUI-003 only the matching rows are kept and the filter is exposed as column, condition and value', async () => {
    // Break this catches: the saved filters never reaching the table, or reaching it in the wrong shape.
    widget.render({ currentMode: 'view', properties: withBuilderFilters() });
    await mounted();

    await waitFor(() => expect(shownNames()).toEqual(['Ada', 'Grace']));
    expect(appliedFilters()).toEqual([{ column: 'Name', condition: 'contains', value: 'a' }]);
  });
});

describe('Table-FILTERUI-004 seeding is not a filter change', () => {
  test('Table-FILTERUI-004 onFilterChanged is not fired on mount, and fires once for the first user change', async () => {
    // Break this catches: seeding after mount, which would run the app's filter handlers on every page load.
    widget.render({
      currentMode: 'view',
      properties: withBuilderFilters(),
      events: countInvocationsOn(ID, 'onFilterChanged'),
    });
    await mounted();
    await waitFor(() => expect(shownNames()).toEqual(['Ada', 'Grace']));
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(store().getVariable('calls', 'canvas')).toBeUndefined();

    await widget.act('setFilters', [{ column: 'Name', condition: 'contains', value: 'r' }]);

    await waitFor(() => expect(store().getVariable('calls', 'canvas')).toBe(1));
  });
});

describe('Table-FILTERUI-005 a builder filter without a value', () => {
  test('Table-FILTERUI-005 is not applied, so every row is kept', async () => {
    // Break this catches: an empty builder filter hiding every row until a user types into it.
    widget.render({
      currentMode: 'view',
      properties: { defaultFilters: { value: [{ id: 'f1', column: 'c-name', condition: 'contains', value: '' }] } },
    });
    await mounted();

    expect(shownNames()).toEqual(['Ada', 'Bob', 'Grace']);
    expect(appliedFilters()).toEqual([]);
  });
});

describe('Table-FILTERUI-007 builder filters with server-side filtering', () => {
  test('Table-FILTERUI-007 are exposed in filters and the rows are left to the app', async () => {
    // Break this catches: client-side filtering running although the app filters on the server.
    widget.render({ currentMode: 'view', properties: withBuilderFilters({ serverSideFilter: binding('{{true}}') }) });
    await mounted();

    await waitFor(() => expect(appliedFilters()).toEqual([{ column: 'Name', condition: 'contains', value: 'a' }]));
    expect(shownNames()).toEqual(['Ada', 'Bob', 'Grace']);
  });
});

describe('Table-FILTERUI-008 the filter actions with builder filters', () => {
  test('Table-FILTERUI-008 clearFilters clears them for the session and leaves what the builder saved', async () => {
    // Break this catches: the user's clear being written back to the saved filters, or not clearing them at all.
    widget.render({ currentMode: 'view', properties: withBuilderFilters() });
    await mounted();
    await waitFor(() => expect(appliedFilters()).toHaveLength(1));

    await widget.act('clearFilters');

    await waitFor(() => expect(shownNames()).toEqual(['Ada', 'Bob', 'Grace']));
    expect(appliedFilters()).toEqual([]);
    expect(savedFilters()).toEqual(BUILDER_FILTERS);
  });

  test('Table-FILTERUI-008 setFilters replaces them for the session and leaves what the builder saved', async () => {
    // Break this catches: setFilters merging with, or rewriting, the builder's filters.
    widget.render({ currentMode: 'view', properties: withBuilderFilters() });
    await mounted();
    await waitFor(() => expect(appliedFilters()).toHaveLength(1));

    await widget.act('setFilters', [{ column: 'Name', condition: 'equals', value: 'Bob' }]);

    await waitFor(() => expect(shownNames()).toEqual(['Bob']));
    expect(appliedFilters()).toEqual([{ column: 'Name', condition: 'equals', value: 'Bob' }]);
    expect(savedFilters()).toEqual(BUILDER_FILTERS);
  });
});
