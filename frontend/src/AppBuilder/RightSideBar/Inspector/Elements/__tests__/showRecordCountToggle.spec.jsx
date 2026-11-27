/**
 * What the "Show record count" toggle shows in the Table Inspector.
 * A Table saved before the property existed has no key: the toggle matches what the count does.
 */
// Code renders the real CodeMirror editor; only the value the Table panel hands it matters here.
jest.mock('../Code', () => ({
  Code: ({ param, definition }) => <div data-testid={`field-${param.name}`}>{definition?.value ?? ''}</div>,
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { tableConfig } from '@/AppBuilder/WidgetManager/widgets/table';
import { Table } from '../../Components/Table/Table';

const inspectorComponent = (properties) => ({
  id: 't1',
  component: {
    name: 'table1',
    component: 'Table',
    properties: {},
    definition: {
      properties: { columns: { value: [] }, ...properties },
      styles: {},
      others: {},
      general: {},
      generalStyles: {},
    },
  },
});

const renderToggle = (properties) => {
  render(
    <MemoryRouter>
      <Table
        component={inspectorComponent(properties)}
        componentMeta={tableConfig}
        paramUpdated={jest.fn()}
        layoutPropertyChanged={jest.fn()}
        eventsChanged={jest.fn()}
        dataQueries={[]}
        components={{}}
        currentState={{}}
        darkMode={false}
        apps={[]}
        pages={[]}
      />
    </MemoryRouter>
  );
  return screen.getByTestId('field-showRecordCount').textContent;
};

describe('Table-RECCOUNT Show record count toggle in the Inspector', () => {
  test.each([
    ['{{true}}', '{{true}}'],
    ['{{false}}', '{{false}}'],
  ])('Table-RECCOUNT-009 no saved value: pagination %s gives the toggle %s', (pagination, expected) => {
    expect(renderToggle({ enablePagination: { value: pagination } })).toBe(expected);
  });

  test('Table-RECCOUNT-010 no saved value and no pagination key: old client-side paging shows the toggle on', () => {
    expect(renderToggle({ clientSidePagination: { value: '{{true}}' } })).toBe('{{true}}');
  });

  // The old count rule reads these keys without checking enablePagination, so the toggle must too
  test.each([
    ['old client-side key on', { clientSidePagination: { value: '{{true}}' } }, '{{true}}'],
    [
      'old server-side key on',
      { serverSidePagination: { value: '{{true}}' }, totalRecords: { value: '{{42}}' } },
      '{{true}}',
    ],
    [
      'old server-side key on, Total records 0',
      { serverSidePagination: { value: '{{true}}' }, totalRecords: { value: '{{0}}' } },
      '{{false}}',
    ],
  ])('Table-RECCOUNT-012 pagination off, %s: toggle matches the count', (_label, oldKeys, expected) => {
    expect(renderToggle({ enablePagination: { value: '{{false}}' }, ...oldKeys })).toBe(expected);
  });

  const footerButtonsOff = {
    showAddNewRowButton: { value: '{{false}}' },
    showDownloadButton: { value: '{{false}}' },
    showRefreshButton: { value: '{{false}}' },
    hideColumnSelectorButton: { value: '{{true}}' },
  };

  test('Table-RECCOUNT-013 pagination off, old server-side key on, footer hidden: toggle is off', () => {
    const properties = {
      enablePagination: { value: '{{false}}' },
      serverSidePagination: { value: '{{true}}' },
      totalRecords: { value: '{{10}}' },
      ...footerButtonsOff,
    };
    expect(renderToggle(properties)).toBe('{{false}}');
  });

  // With no enablePagination key the store turns pagination on from the old key, so the footer shows
  test('Table-RECCOUNT-014 no pagination key, old client-side key on, footer buttons off: toggle is on', () => {
    expect(renderToggle({ clientSidePagination: { value: '{{true}}' }, ...footerButtonsOff })).toBe('{{true}}');
  });

  test('Table-RECCOUNT-011 a saved value wins over pagination', () => {
    expect(renderToggle({ enablePagination: { value: '{{true}}' }, showRecordCount: { value: '{{false}}' } })).toBe(
      '{{false}}'
    );
  });
});
