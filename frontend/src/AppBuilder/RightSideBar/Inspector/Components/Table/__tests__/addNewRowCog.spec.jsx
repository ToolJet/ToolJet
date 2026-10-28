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
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tableConfig } from '@tooljet/widget-definitions';
import { Table } from '../Table';

const COG = { name: 'Configure add new row' };

function inspectorComponent(showAddNewRowButton) {
  return {
    id: 't1',
    component: {
      name: 'table1',
      component: 'Table',
      properties: {},
      definition: {
        properties: {
          columns: { value: [{ id: 'c1', name: 'Name', columnType: 'string' }] },
          showAddNewRowButton: { value: showAddNewRowButton },
          showDownloadButton: { value: '{{true}}' },
        },
        styles: {},
        others: {},
        general: {},
        generalStyles: {},
      },
    },
  };
}

function inspector(showAddNewRowButton) {
  return (
    <Table
      component={inspectorComponent(showAddNewRowButton)}
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
  );
}

describe('Table-ADDROWFORM-006 cog on the Add new row toggle', () => {
  test('Table-ADDROWFORM-006 the cog sits on the Add new row toggle while it is on', () => {
    // Break this catches: the cog never being wired into the toggle row.
    render(inspector('{{true}}'));

    expect(within(screen.getByTestId('field-showAddNewRowButton')).getByRole('button', COG)).toBeInTheDocument();
  });

  test('Table-ADDROWFORM-006 the cog is absent while the toggle is off', () => {
    // Break this catches: configuration offered for a feature that is switched off.
    render(inspector('{{false}}'));

    expect(screen.getByTestId('field-showAddNewRowButton')).toBeInTheDocument();
    expect(screen.queryByRole('button', COG)).not.toBeInTheDocument();
  });

  test('Table-ADDROWFORM-006 no other toggle gets the cog', () => {
    // Break this catches: the cog leaking onto every toggle in the accordion.
    render(inspector('{{true}}'));

    expect(within(screen.getByTestId('field-showDownloadButton')).queryByRole('button', COG)).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', COG)).toHaveLength(1);
  });
});

describe('Table-ADDROWFORM-010 switching the toggle off closes the popover', () => {
  test('Table-ADDROWFORM-010 an open popover disappears when the toggle turns off', async () => {
    // Break this catches: a popover left open (and editable) for a feature that was just switched off.
    const user = userEvent.setup();
    const { rerender } = render(inspector('{{true}}'));
    await user.click(screen.getByRole('button', COG));
    expect(screen.getByRole('radio', { name: 'Dialog' })).toBeInTheDocument();

    rerender(inspector('{{false}}'));

    expect(screen.queryByRole('radio', { name: 'Dialog' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', COG)).not.toBeInTheDocument();
  });
});
