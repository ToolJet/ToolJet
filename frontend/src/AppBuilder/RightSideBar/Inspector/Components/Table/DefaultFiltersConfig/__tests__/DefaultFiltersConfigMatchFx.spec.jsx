// The code editor is the real CodeMirror one; only its value and change hook matter here.
jest.mock('@/AppBuilder/CodeEditor', () => ({
  __esModule: true,
  default: ({ initialValue, onChange }) => (
    <input data-testid="default-value-code" defaultValue={initialValue} onChange={(e) => onChange(e.target.value)} />
  ),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DefaultFiltersConfig } from '../DefaultFiltersConfig';

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
];

const nameFilter = { id: 'f1', column: 'c-name', condition: 'contains', value: 'a' };
const statusFilter = { id: 'f2', column: 'c-status', condition: 'equals', value: 'active' };
const FX = { name: 'Use code for default value' };

async function setup(props = {}) {
  const user = userEvent.setup();
  const onChange = jest.fn();
  render(
    <DefaultFiltersConfig
      columns={columns}
      defaultFilters={[]}
      serverSideFilter={false}
      filterMatch="and"
      onChange={onChange}
      darkMode={false}
      {...props}
    />
  );
  await user.click(screen.getByRole('button', { name: 'Configure filters' }));
  return { user, onChange };
}

const lastFilters = (onChange) => onChange.mock.calls.filter(([name]) => name === 'defaultFilters').pop()[1];

describe('Table-FILTERUI-037 Match all / any', () => {
  test('Table-FILTERUI-037 sits between Type and the quick filters and shows All (and) by default', async () => {
    // Break this catches: the Match row missing, or in the wrong place.
    await setup({ filterMatch: undefined });

    const type = screen.getByRole('radiogroup', { name: 'Type' });
    const match = screen.getByRole('radiogroup', { name: 'Match' });
    const quickFilters = screen.getByText('Quick filters');
    expect(type.compareDocumentPosition(match) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(match.compareDocumentPosition(quickFilters) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'All (and)' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Any (or)' })).not.toBeChecked();
  });

  test('Table-FILTERUI-037 shows the saved choice', async () => {
    // Break this catches: the saved mode ignored, so the popup always opens on All.
    await setup({ filterMatch: 'or' });

    expect(screen.getByRole('radio', { name: 'Any (or)' })).toBeChecked();
  });

  test('Table-FILTERUI-037 choosing a mode saves it to filterMatch', async () => {
    // Break this catches: the choice not reaching the property the table reads.
    const { user, onChange } = await setup({ filterMatch: 'and' });

    await user.click(screen.getByRole('radio', { name: 'Any (or)' }));

    expect(onChange).toHaveBeenCalledWith('filterMatch', 'or');
  });

  test('Table-FILTERUI-037 choosing All again saves and', async () => {
    // Break this catches: the switch only working one way.
    const { user, onChange } = await setup({ filterMatch: 'or' });

    await user.click(screen.getByRole('radio', { name: 'All (and)' }));

    expect(onChange).toHaveBeenCalledWith('filterMatch', 'and');
  });

  test('Table-FILTERUI-037 is also offered with server-side filtering, and saves the same way', async () => {
    // Break this catches: Match disappearing when the builder switches to server side.
    const { user, onChange } = await setup({ serverSideFilter: true, filterMatch: 'and' });

    expect(screen.getByRole('radiogroup', { name: 'Match' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Any (or)' }));

    expect(onChange).toHaveBeenCalledWith('filterMatch', 'or');
  });
});

describe('Table-FILTERUI-038 fx on each default filter', () => {
  test('Table-FILTERUI-038 every filter that takes a value has an fx button, off by default', async () => {
    // Break this catches: no way to bind a default value to code in client-side mode.
    await setup({ defaultFilters: [nameFilter, statusFilter] });

    const buttons = screen.getAllByRole('button', FX);
    expect(buttons).toHaveLength(2);
    buttons.forEach((button) => expect(button).toHaveAttribute('aria-pressed', 'false'));
  });

  test('Table-FILTERUI-038 turning fx on keeps the value and swaps the field for the code editor', async () => {
    // Break this catches: fx wiping what the builder typed, or leaving the plain field in place.
    const { user, onChange } = await setup({ defaultFilters: [nameFilter] });

    await user.click(screen.getByRole('button', FX));

    expect(lastFilters(onChange)).toEqual([{ ...nameFilter, fx: true }]);
  });

  test('Table-FILTERUI-038 an fx filter shows the code editor, not the plain field', async () => {
    // Break this catches: a code value shown (and edited) in a plain text box.
    await setup({ defaultFilters: [{ ...nameFilter, value: '{{1 + 1}}', fx: true }] });

    expect(screen.getByRole('button', FX)).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('default-value-code')).toHaveValue('{{1 + 1}}');
    expect(screen.queryByRole('textbox', { name: 'Default value' })).not.toBeInTheDocument();
  });

  test('Table-FILTERUI-038 turning fx off clears the code value', async () => {
    // Break this catches: a code expression left behind as a plain text value.
    const { user, onChange } = await setup({ defaultFilters: [{ ...nameFilter, value: '{{1 + 1}}', fx: true }] });

    await user.click(screen.getByRole('button', FX));

    expect(lastFilters(onChange)).toEqual([{ ...nameFilter, value: '', fx: false }]);
  });

  test('Table-FILTERUI-038 typing in the code editor saves the code', async () => {
    // Break this catches: the editor not writing back.
    const { user, onChange } = await setup({ defaultFilters: [{ ...nameFilter, value: 'a', fx: true }] });

    await user.type(screen.getByTestId('default-value-code'), 'b');

    expect(lastFilters(onChange)).toEqual([{ ...nameFilter, value: 'ab', fx: true }]);
  });

  test.each(['isEmpty', 'isNotEmpty'])(
    'Table-FILTERUI-038 %s has no fx button, as it has no value',
    async (condition) => {
      // Break this catches: an fx toggle for a value the operator ignores.
      await setup({ defaultFilters: [{ ...nameFilter, condition }] });

      expect(screen.queryByRole('button', FX)).not.toBeInTheDocument();
    }
  );
});

describe('Table-FILTERUI-039 server side filtering takes the default value as code only', () => {
  test('Table-FILTERUI-039 the value is the code editor for every column type, with fx locked on', async () => {
    // Break this catches: a text box or option picker for a value the app has to supply (we know nothing about it).
    await setup({ serverSideFilter: true, defaultFilters: [nameFilter, statusFilter] });

    expect(screen.getAllByTestId('default-value-code')).toHaveLength(2);
    expect(screen.queryByRole('textbox', { name: 'Default value' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Default value' })).not.toBeInTheDocument();
    screen.getAllByRole('button', FX).forEach((button) => {
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(button).toBeDisabled();
    });
  });
});

describe('Table-FILTERUI-040 dropdown lists keep their row height', () => {
  test('Table-FILTERUI-040 rows do not shrink to fit the list: it scrolls instead', async () => {
    // Break this catches: twelve operators squeezed to ~20px rows because the list shrinks them to its max height.
    const { user } = await setup({ defaultFilters: [nameFilter] });

    await user.click(screen.getByRole('button', { name: 'Operator' }));

    const list = screen.getByRole('listbox');
    expect(list).toHaveClass('tw-max-h-60');
    expect(list).toHaveClass('tw-overflow-y-auto');
    screen.getAllByRole('option').forEach((option) => {
      expect(option).toHaveClass('tw-h-8');
      expect(option).toHaveClass('tw-shrink-0');
    });
  });

  test('Table-FILTERUI-040 the list has 8px of padding around its rows, as in the design', async () => {
    // Break this catches: rows touching the edge of the list.
    const { user } = await setup({ defaultFilters: [nameFilter] });

    await user.click(screen.getByRole('button', { name: 'Operator' }));

    expect(screen.getByRole('listbox').closest('[data-slot="popover-content"]')).toHaveClass('tw-p-2');
  });
});
