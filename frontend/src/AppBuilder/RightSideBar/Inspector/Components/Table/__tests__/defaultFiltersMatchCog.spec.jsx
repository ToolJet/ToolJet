// Code renders the real CodeMirror editor; only the slot it forwards the cog into matters here.
jest.mock('../../../Elements/Code', () => ({
  Code: ({ param, fieldActions }) => (
    <div data-testid={`field-${param.name}`}>
      {param.name}
      {fieldActions}
    </div>
  ),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tableConfig } from '@tooljet/widget-definitions';
import { Table } from '../Table';

function inspector({ paramUpdated = jest.fn(), extraProperties = {} } = {}) {
  return (
    <Table
      component={{
        id: 't1',
        component: {
          name: 'table1',
          component: 'Table',
          properties: {},
          definition: {
            properties: {
              columns: { value: [{ id: 'c1', name: 'Name', columnType: 'string' }] },
              showFilterButton: { value: '{{true}}' },
              ...extraProperties,
            },
            styles: {},
            others: {},
            general: {},
            generalStyles: {},
          },
        },
      }}
      componentMeta={tableConfig}
      paramUpdated={paramUpdated}
      layoutPropertyChanged={jest.fn()}
      eventsChanged={jest.fn()}
      dataQueries={[]}
      components={{}}
      currentState={{}}
      darkMode={false}
      apps={[]}
      pages={[]}
    />
  );
}

describe('Table-FILTERUI-042 the Match choice on the Table', () => {
  test('Table-FILTERUI-042 choosing Any (or) writes filterMatch through the inspector', async () => {
    // Break this catches: the choice being lost, so a reload opens on All again.
    const user = userEvent.setup();
    const paramUpdated = jest.fn();
    render(inspector({ paramUpdated }));

    await user.click(screen.getByRole('button', { name: 'Configure filters' }));
    await user.click(screen.getByRole('radio', { name: 'Any (or)' }));

    expect(paramUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'filterMatch' }),
      'value',
      'or',
      'properties'
    );
  });

  test('Table-FILTERUI-042 the saved choice is shown when the popup opens', async () => {
    // Break this catches: the saved value not being read back from the Table definition.
    const user = userEvent.setup();
    render(inspector({ extraProperties: { filterMatch: { value: 'or' } } }));

    await user.click(screen.getByRole('button', { name: 'Configure filters' }));

    expect(screen.getByRole('radio', { name: 'Any (or)' })).toBeChecked();
  });
});
