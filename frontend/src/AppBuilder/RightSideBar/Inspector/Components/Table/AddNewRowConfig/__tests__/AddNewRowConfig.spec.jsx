import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddNewRowConfig } from '../AddNewRowConfig';

const columns = [
  { name: 'Name', columnType: 'string' },
  { key: 'email', name: 'Email', columnType: 'string' },
  { name: 'Role', columnType: 'string' },
  { name: 'Open', columnType: 'button' },
];

function setup(props = {}) {
  const onChange = jest.fn();
  const user = userEvent.setup();
  render(
    <AddNewRowConfig
      addNewRowIn="table"
      allowAddingMultipleRows={true}
      columns={columns}
      selectedColumns={null}
      onChange={onChange}
      {...props}
    />
  );
  return { onChange, user };
}

async function openPopover(user) {
  await user.click(screen.getByRole('button', { name: 'Configure add new row' }));
}

describe('Table-ADDROWFORM-007 add new row placement control', () => {
  test('Table-ADDROWFORM-007 choosing Dialog writes addNewRowIn = dialog', async () => {
    // Break this catches: the control writing the wrong value, or the wrong property.
    const { onChange, user } = setup({ addNewRowIn: 'table' });
    await openPopover(user);

    await user.click(screen.getByRole('radio', { name: 'Dialog' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('addNewRowIn', 'dialog');
  });

  test('Table-ADDROWFORM-007 the current placement is the selected option', async () => {
    // Break this catches: the control always showing Table regardless of the saved value.
    const { user } = setup({ addNewRowIn: 'dialog' });
    await openPopover(user);

    expect(screen.getByRole('radio', { name: 'Dialog' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Table' })).not.toBeChecked();
  });
});

describe('Table-ADDROWFORM-008 allow adding multiple rows toggle', () => {
  test('Table-ADDROWFORM-008 turning it off writes {{false}}', async () => {
    // Break this catches: the toggle writing a non-binding value the property can't resolve, or the wrong key.
    const { onChange, user } = setup({ allowAddingMultipleRows: true });
    await openPopover(user);

    await user.click(screen.getByRole('switch', { name: 'Allow adding multiple rows' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('allowAddingMultipleRows', '{{false}}');
  });

  test('Table-ADDROWFORM-008 turning it on writes {{true}}', async () => {
    // Break this catches: the toggle only ever writing one direction.
    const { onChange, user } = setup({ allowAddingMultipleRows: false });
    await openPopover(user);

    const toggle = screen.getByRole('switch', { name: 'Allow adding multiple rows' });
    expect(toggle).not.toBeChecked();
    await user.click(toggle);

    expect(onChange).toHaveBeenCalledWith('allowAddingMultipleRows', '{{true}}');
  });
});

describe('Table-ADDROWFORM-009 columns to include', () => {
  test('Table-ADDROWFORM-009 lists every eligible column, all checked when nothing is stored, without button columns', async () => {
    // Break this catches: an action column offered in the list, or a saved app opening with nothing ticked.
    const { user } = setup({ selectedColumns: null });
    await openPopover(user);

    for (const name of ['Name', 'Email', 'Role']) {
      expect(screen.getByRole('checkbox', { name })).toBeChecked();
    }
    expect(screen.queryByRole('checkbox', { name: 'Open' })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select all' })).toBeChecked();
  });

  test('Table-ADDROWFORM-009 unticking one column stores the rest, in column order', async () => {
    // Break this catches: a deselect storing the clicked column, or the wrong keys (key vs name).
    const { onChange, user } = setup({ selectedColumns: null });
    await openPopover(user);

    await user.click(screen.getByRole('checkbox', { name: 'Role' }));

    expect(onChange).toHaveBeenCalledWith('addNewRowColumns', ['Name', 'email']);
  });

  test('Table-ADDROWFORM-009 ticking a column adds it in column order', async () => {
    // Break this catches: selection order leaking into the stored list.
    const { onChange, user } = setup({ selectedColumns: ['Role'] });
    await openPopover(user);

    await user.click(screen.getByRole('checkbox', { name: 'Name' }));

    expect(onChange).toHaveBeenCalledWith('addNewRowColumns', ['Name', 'Role']);
  });

  test('Table-ADDROWFORM-009 Select all is indeterminate for a partial selection and ticking it clears the stored list', async () => {
    // Break this catches: a partial selection looking fully selected, or "all" stored as a list that
    // would leave later-added columns out.
    const { onChange, user } = setup({ selectedColumns: ['email'] });
    await openPopover(user);

    const selectAll = screen.getByRole('checkbox', { name: 'Select all' });
    expect(selectAll).toHaveAttribute('aria-checked', 'mixed');

    await user.click(selectAll);

    expect(onChange).toHaveBeenCalledWith('addNewRowColumns', null);
  });

  test('Table-ADDROWFORM-009 unticking Select all while everything is selected stores an empty list', async () => {
    // Break this catches: Select all being a one-way action.
    const { onChange, user } = setup({ selectedColumns: null });
    await openPopover(user);

    await user.click(screen.getByRole('checkbox', { name: 'Select all' }));

    expect(onChange).toHaveBeenCalledWith('addNewRowColumns', []);
  });

  test('Table-ADDROWFORM-009 searching narrows the visible columns, case-insensitively, without changing the selection', async () => {
    // Break this catches: search being case-sensitive, or typing in it altering the stored selection.
    const { onChange, user } = setup({ selectedColumns: null });
    await openPopover(user);

    await user.type(screen.getByPlaceholderText('Search columns'), 'RO');

    expect(screen.getByRole('checkbox', { name: 'Role' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Name' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Email' })).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Table-ADDROWFORM-029 popover chrome', () => {
  test('Table-ADDROWFORM-029 the header close button closes the popover', async () => {
    // Break this catches: a popover with no visible way to dismiss it, as drawn in the design.
    const { user } = setup();
    await openPopover(user);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('Table-ADDROWFORM-029 the popover sits on the inspector layer, above the properties panel', async () => {
    // Break this catches: the popover rendering behind the properties panel. jsdom has no layout, so the
    // stacking contract is asserted through the layer class the event popovers in the same panel use.
    const { user } = setup();
    await openPopover(user);

    expect(screen.getByRole('dialog')).toHaveClass('tw-z-[1042]');
  });

  test('Table-ADDROWFORM-029 it follows the editor theme, since it renders outside the themed tree', async () => {
    // Break this catches: a light popover over a dark editor.
    const { user } = setup({ darkMode: true });
    await openPopover(user);

    expect(screen.getByRole('dialog')).toHaveClass('dark-theme');
  });

  test('Table-ADDROWFORM-029 it has no dark theme class in light mode', async () => {
    // Break this catches: the dark class applied unconditionally.
    const { user } = setup({ darkMode: false });
    await openPopover(user);

    expect(screen.getByRole('dialog')).not.toHaveClass('dark-theme');
  });
});
