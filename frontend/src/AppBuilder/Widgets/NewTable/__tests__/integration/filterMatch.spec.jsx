/**
 * Match all / any against a real Table: any keeps a row that satisfies one of the filters, all keeps
 * today's behaviour, and a default filter bound to code is resolved before it is applied.
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
  },
});

beforeEach(widget.setup);
afterEach(widget.teardown);

const shownNames = () => (widget.exposed().filteredData ?? []).map((row) => row.name);
const mounted = () => waitFor(() => expect(widget.exposed().currentData?.length).toBe(3));

const BOB_OR_GRACE = [
  { id: 'f1', column: 'c-name', condition: 'equals', value: 'Bob' },
  { id: 'f2', column: 'c-name', condition: 'contains', value: 'ra' },
];
const NAME_AND_ID = [
  { id: 'f1', column: 'c-name', condition: 'contains', value: 'r' },
  { id: 'f2', column: 'c-id', condition: 'equals', value: '2' },
];

describe('Table-FILTERUI-042 matching all or any filters', () => {
  test('Table-FILTERUI-042 all (the default) keeps only the rows that satisfy every filter', async () => {
    // Characterization: passes on arrival. Break this catches: all being changed for apps that never chose.
    widget.render({ currentMode: 'view', properties: { defaultFilters: { value: BOB_OR_GRACE } } });
    await mounted();

    await waitFor(() => expect(shownNames()).toEqual([]));
  });

  test('Table-FILTERUI-042 any keeps the rows that satisfy one of the filters, in their order', async () => {
    // Break this catches: the saved mode never reaching the table.
    widget.render({
      currentMode: 'view',
      properties: { defaultFilters: { value: BOB_OR_GRACE }, filterMatch: { value: 'or' } },
    });
    await mounted();

    await waitFor(() => expect(shownNames()).toEqual(['Bob', 'Grace']));
  });

  test('Table-FILTERUI-042 any works across columns', async () => {
    // Break this catches: any only combining filters that sit on the same column.
    widget.render({
      currentMode: 'view',
      properties: { defaultFilters: { value: NAME_AND_ID }, filterMatch: { value: 'or' } },
    });
    await mounted();

    await waitFor(() => expect(shownNames()).toEqual(['Bob', 'Grace']));
  });

  test('Table-FILTERUI-042 any also applies to filters set with setFilters', async () => {
    // Break this catches: any covering the saved filters but not the ones the app sets.
    widget.render({ currentMode: 'view', properties: { filterMatch: { value: 'or' } } });
    await mounted();

    await widget.act('setFilters', [
      { column: 'Name', condition: 'equals', value: 'Ada' },
      { column: 'Name', condition: 'equals', value: 'Bob' },
    ]);

    await waitFor(() => expect(shownNames()).toEqual(['Ada', 'Bob']));
  });

  test('Table-FILTERUI-042 with server-side filtering the rows are left to the app, whatever the mode', async () => {
    // Break this catches: client-side filtering running although the app filters on the server.
    widget.render({
      currentMode: 'view',
      properties: {
        defaultFilters: { value: BOB_OR_GRACE },
        filterMatch: { value: 'or' },
        serverSideFilter: binding('{{true}}'),
      },
    });
    await mounted();

    await waitFor(() => expect(widget.exposed().filters).toHaveLength(2));
    expect(shownNames()).toEqual(['Ada', 'Bob', 'Grace']);
  });
});

describe('Table-FILTERUI-043 a default filter bound to code', () => {
  test('Table-FILTERUI-043 is resolved before it is applied', async () => {
    // Break this catches: the expression applied as text, so the filter matches nothing.
    widget.render({
      currentMode: 'view',
      properties: {
        defaultFilters: {
          value: [{ id: 'f1', column: 'c-name', condition: 'contains', value: '{{"gr"}}', fx: true }],
        },
      },
    });
    await mounted();

    await waitFor(() => expect(shownNames()).toEqual(['Grace']));
    expect(widget.exposed().filters).toEqual([{ column: 'Name', condition: 'contains', value: 'gr' }]);
  });
});
