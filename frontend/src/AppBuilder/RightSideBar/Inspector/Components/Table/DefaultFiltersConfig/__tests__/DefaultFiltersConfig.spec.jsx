// The code editor is the real CodeMirror one; only its value and change hook matter here.
jest.mock('@/AppBuilder/CodeEditor', () => ({
  __esModule: true,
  default: ({ initialValue, onChange }) => (
    <input data-testid="default-value-code" defaultValue={initialValue} onChange={(e) => onChange(e.target.value)} />
  ),
}));

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DefaultFiltersConfig } from '../DefaultFiltersConfig';

const COG = { name: 'Configure filters' };

const columns = [
  { id: 'c-name', name: 'Name', columnType: 'string' },
  {
    id: 'c-status',
    name: 'Status',
    columnType: 'select',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Invited', value: 'invited' },
    ],
  },
  { id: 'c-age', name: 'Age', columnType: 'number' },
  { id: 'c-verified', name: 'Verified', columnType: 'boolean' },
  { id: 'c-open', name: 'Open', columnType: 'button' },
];

const nameFilter = { id: 'f1', column: 'c-name', condition: 'contains', value: 'a' };
const statusFilter = { id: 'f2', column: 'c-status', condition: 'equals', value: 'active' };

async function setup(props = {}) {
  const user = userEvent.setup();
  const onChange = jest.fn();
  const view = render(
    <DefaultFiltersConfig
      columns={columns}
      defaultFilters={[]}
      serverSideFilter={false}
      onChange={onChange}
      darkMode={false}
      {...props}
    />
  );
  await user.click(screen.getByRole('button', COG));
  return { user, onChange, view };
}

const lastFilters = (onChange) => onChange.mock.calls.filter(([name]) => name === 'defaultFilters').pop()[1];

describe('Table-FILTERUI-010 the empty popup and adding a filter', () => {
  test('Table-FILTERUI-010 shows the empty state and the Add new filter button', async () => {
    // Break this catches: an empty list showing a blank popup with nothing to do.
    await setup();

    expect(screen.getByText('No custom filters are added')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add new filter' })).toBeInTheDocument();
  });

  test('Table-FILTERUI-010 Add new filter saves a filter on the first column with contains', async () => {
    // Break this catches: the button not writing the property, or writing a filter that is not usable yet.
    const { user, onChange } = await setup();

    await user.click(screen.getByRole('button', { name: 'Add new filter' }));

    expect(onChange).toHaveBeenCalledWith('defaultFilters', [
      { id: expect.any(String), column: 'c-name', condition: 'contains', value: '' },
    ]);
  });

  test('Table-FILTERUI-010 a new filter is added after the ones already there', async () => {
    // Break this catches: adding a filter replacing the saved ones.
    const { user, onChange } = await setup({ defaultFilters: [nameFilter] });

    await user.click(screen.getByRole('button', { name: 'Add new filter' }));

    expect(lastFilters(onChange)).toHaveLength(2);
    expect(lastFilters(onChange)[0]).toEqual(nameFilter);
  });
});

describe('Table-FILTERUI-011 column, operator and title of a filter', () => {
  test('Table-FILTERUI-011 the card title follows the column and operator', async () => {
    // Break this catches: a title that does not match what the filter does.
    await setup({ defaultFilters: [statusFilter] });

    expect(screen.getByText('Status equals…')).toBeInTheDocument();
  });

  test('Table-FILTERUI-011 the column list holds the filterable columns only', async () => {
    // Break this catches: a button column offered as something to filter on.
    const { user } = await setup({ defaultFilters: [nameFilter] });

    await user.click(screen.getByRole('button', { name: 'Column' }));

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Name',
      'Status',
      'Age',
      'Verified',
    ]);
  });

  test('Table-FILTERUI-011 picking another column keeps the operator and clears the value', async () => {
    // Break this catches: a text value surviving a switch to a column of another type.
    const { user, onChange } = await setup({ defaultFilters: [nameFilter] });

    await user.click(screen.getByRole('button', { name: 'Column' }));
    await user.click(screen.getByRole('option', { name: 'Age' }));

    expect(lastFilters(onChange)).toEqual([{ ...nameFilter, column: 'c-age', value: '' }]);
  });

  test('Table-FILTERUI-011 the operator list holds the existing operators and picking one saves it', async () => {
    // Break this catches: an operator missing from the list, or the pick not reaching the saved filter.
    const { user, onChange } = await setup({ defaultFilters: [nameFilter] });

    await user.click(screen.getByRole('button', { name: 'Operator' }));

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'contains',
      'does not contains',
      'matches',
      'does not match',
      'equals',
      'does not equal',
      'is empty',
      'is not empty',
      'greater than',
      'less than',
      'greater than or equals',
      'less than or equals',
    ]);

    await user.click(screen.getByRole('option', { name: 'greater than' }));

    expect(lastFilters(onChange)).toEqual([{ ...nameFilter, condition: 'gt' }]);
  });
});

describe('Table-FILTERUI-012 the Default field follows the column', () => {
  test('Table-FILTERUI-012 a text column gets a text input that saves what is typed', async () => {
    // Break this catches: the typed value never reaching the saved filter.
    const { user, onChange } = await setup({ defaultFilters: [nameFilter] });

    const input = screen.getByRole('textbox', { name: 'Default value' });
    expect(input).toHaveValue('a');
    await user.type(input, 'b');

    expect(lastFilters(onChange)).toEqual([{ ...nameFilter, value: 'ab' }]);
  });

  test('Table-FILTERUI-012 a select column offers its options and saves the option value', async () => {
    // Break this catches: the label being saved instead of the value the table compares with.
    const { user, onChange } = await setup({ defaultFilters: [statusFilter] });

    await user.click(screen.getByRole('button', { name: 'Default value' }));
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Active', 'Invited']);
    await user.click(screen.getByRole('option', { name: 'Invited' }));

    expect(lastFilters(onChange)).toEqual([{ ...statusFilter, value: 'invited' }]);
  });

  test('Table-FILTERUI-012 a select column shows the label of the saved value', async () => {
    // Break this catches: the raw value ("active") shown where the builder expects "Active".
    await setup({ defaultFilters: [statusFilter] });

    expect(within(screen.getByRole('button', { name: 'Default value' })).getByText('Active')).toBeInTheDocument();
  });

  test('Table-FILTERUI-012 a boolean column offers True and False', async () => {
    // Break this catches: a boolean filter that can only be typed as free text.
    const { user, onChange } = await setup({
      defaultFilters: [{ id: 'f3', column: 'c-verified', condition: 'equals', value: '' }],
    });

    await user.click(screen.getByRole('button', { name: 'Default value' }));
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['True', 'False']);
    await user.click(screen.getByRole('option', { name: 'True' }));

    expect(lastFilters(onChange)[0].value).toBe('true');
  });

  test.each(['isEmpty', 'isNotEmpty'])('Table-FILTERUI-012 %s has no Default field', async (condition) => {
    // Break this catches: a value box for an operator that ignores the value.
    await setup({ defaultFilters: [{ ...nameFilter, condition }] });

    expect(screen.queryByRole('textbox', { name: 'Default value' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Default value' })).not.toBeInTheDocument();
  });
});

describe('Table-FILTERUI-013 deleting a filter', () => {
  test('Table-FILTERUI-013 removes that filter only', async () => {
    // Break this catches: the wrong filter, or all of them, being removed.
    const { user, onChange } = await setup({ defaultFilters: [nameFilter, statusFilter] });

    await user.click(screen.getAllByRole('button', { name: 'Delete filter' })[0]);

    expect(lastFilters(onChange)).toEqual([statusFilter]);
  });

  test('Table-FILTERUI-013 each filter has a handle to drag it by', async () => {
    // Break this catches: no way to reorder. The drag itself needs a real browser and is checked by hand.
    await setup({ defaultFilters: [nameFilter, statusFilter] });

    expect(screen.getAllByLabelText('Drag to reorder')).toHaveLength(2);
  });
});

describe('Table-FILTERUI-014 Client side / Server side in the popup', () => {
  test('Table-FILTERUI-014 the Type control shows the saved mode and saves a change', async () => {
    // Break this catches: the mode not reaching serverSideFilter, which the table reads.
    const { user, onChange } = await setup({ serverSideFilter: false });

    expect(screen.getByRole('radio', { name: 'Client side' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Server side' }));

    expect(onChange).toHaveBeenCalledWith('serverSideFilter', '{{true}}');
  });

  test('Table-FILTERUI-014 switching back to Client side saves false', async () => {
    // Break this catches: the switch only working one way.
    const { user, onChange } = await setup({ serverSideFilter: true });

    expect(screen.getByRole('radio', { name: 'Server side' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Client side' }));

    expect(onChange).toHaveBeenCalledWith('serverSideFilter', '{{false}}');
  });

  test('Table-FILTERUI-014 server side makes the Default a code field and the button "Add new custom filter"', async () => {
    // Break this catches: a server-side filter whose value cannot be a binding.
    const { user, onChange } = await setup({ serverSideFilter: true, defaultFilters: [nameFilter] });

    expect(screen.queryByRole('textbox', { name: 'Default value' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add new custom filter' })).toBeInTheDocument();
    await user.type(screen.getByTestId('default-value-code'), 'x');

    expect(lastFilters(onChange)[0].value).toBe('ax');
  });
});

describe('Table-FILTERUI-015 the popup itself', () => {
  test('Table-FILTERUI-015 sits on the inspector layer and follows the dark theme', async () => {
    // Break this catches: the popup opening behind the properties panel, or light on a dark editor.
    await setup({ darkMode: true });

    const popup = screen.getByTestId('default-filters-config-popover');
    expect(popup.className).toContain('tw-z-[1042]');
    expect(popup.className).toContain('dark-theme');
  });

  test('Table-FILTERUI-015 stays light in the light theme', async () => {
    // Break this catches: dark styling forced on every editor.
    await setup({ darkMode: false });

    expect(screen.getByTestId('default-filters-config-popover').className).not.toContain('dark-theme');
  });

  test('Table-FILTERUI-015 has a close button that closes it', async () => {
    // Break this catches: a popup that can only be dismissed by clicking elsewhere.
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByTestId('default-filters-config-popover')).not.toBeInTheDocument();
  });
});
