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

const COG = { name: 'Configure filters' };

function inspectorComponent(showFilterButton, extraProperties = {}) {
  return {
    id: 't1',
    component: {
      name: 'table1',
      component: 'Table',
      properties: {},
      definition: {
        properties: {
          columns: { value: [{ id: 'c1', name: 'Name', columnType: 'string' }] },
          showFilterButton: { value: showFilterButton },
          showDownloadButton: { value: '{{true}}' },
          ...extraProperties,
        },
        styles: {},
        others: {},
        general: {},
        generalStyles: {},
      },
    },
  };
}

function inspector(showFilterButton, { paramUpdated = jest.fn(), extraProperties } = {}) {
  return (
    <Table
      component={inspectorComponent(showFilterButton, extraProperties)}
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

describe('Table-FILTERUI-033 cog on the Enable filtering toggle', () => {
  test('Table-FILTERUI-033 the cog sits on the Enable filtering toggle while it is on', () => {
    // Break this catches: the cog never being wired into the toggle row.
    render(inspector('{{true}}'));

    expect(within(screen.getByTestId('field-showFilterButton')).getByRole('button', COG)).toBeInTheDocument();
  });

  test('Table-FILTERUI-033 the cog is absent while the toggle is off', () => {
    // Break this catches: configuration offered for a feature that is switched off.
    render(inspector('{{false}}'));

    expect(screen.getByTestId('field-showFilterButton')).toBeInTheDocument();
    expect(screen.queryByRole('button', COG)).not.toBeInTheDocument();
  });

  test('Table-FILTERUI-033 no other toggle gets the cog', () => {
    // Break this catches: the cog leaking onto every toggle in the accordion.
    render(inspector('{{true}}'));

    expect(within(screen.getByTestId('field-showDownloadButton')).queryByRole('button', COG)).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', COG)).toHaveLength(1);
  });

  test('Table-FILTERUI-033 an open popup disappears when the toggle turns off', async () => {
    // Break this catches: a popup left open (and editable) for a feature that was just switched off.
    const user = userEvent.setup();
    const { rerender } = render(inspector('{{true}}'));
    await user.click(screen.getByRole('button', COG));
    expect(screen.getByRole('radio', { name: 'Server side' })).toBeInTheDocument();

    rerender(inspector('{{false}}'));

    expect(screen.queryByRole('radio', { name: 'Server side' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', COG)).not.toBeInTheDocument();
  });
});

describe('Table-FILTERUI-014 the Type control moves into the popup', () => {
  test('Table-FILTERUI-014 the properties panel no longer lists the filter Type row', () => {
    // Break this catches: the same control shown twice, in the panel and in the popup.
    render(inspector('{{true}}'));

    expect(screen.queryByTestId('field-serverSideFilter')).not.toBeInTheDocument();
  });

  test('Table-FILTERUI-014 the popup writes the mode to serverSideFilter', async () => {
    // Break this catches: the popup writing to the wrong property.
    const user = userEvent.setup();
    const paramUpdated = jest.fn();
    render(inspector('{{true}}', { paramUpdated }));

    await user.click(screen.getByRole('button', COG));
    await user.click(screen.getByRole('radio', { name: 'Server side' }));

    expect(paramUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'serverSideFilter' }),
      'value',
      '{{true}}',
      'properties'
    );
  });
});

describe('Table-FILTERUI-013 the popup saves the default filters on the Table', () => {
  test('Table-FILTERUI-013 Add new filter writes defaultFilters through the inspector', async () => {
    // Break this catches: the filters never being saved, so a reload loses them.
    const user = userEvent.setup();
    const paramUpdated = jest.fn();
    render(inspector('{{true}}', { paramUpdated }));

    await user.click(screen.getByRole('button', COG));
    await user.click(screen.getByRole('button', { name: 'Add new filter' }));

    expect(paramUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'defaultFilters' }),
      'value',
      [{ id: expect.any(String), column: 'c1', condition: 'contains', value: '' }],
      'properties'
    );
  });

  test('Table-FILTERUI-013 the saved filters are listed when the popup opens', async () => {
    // Break this catches: a reload showing an empty popup although filters are saved.
    const user = userEvent.setup();
    const saved = [{ id: 'f1', column: 'c1', condition: 'equals', value: 'Ada' }];
    render(inspector('{{true}}', { extraProperties: { defaultFilters: { value: saved } } }));

    await user.click(screen.getByRole('button', COG));

    expect(screen.getByText('Name equals…')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Default value' })).toHaveValue('Ada');
  });
});
