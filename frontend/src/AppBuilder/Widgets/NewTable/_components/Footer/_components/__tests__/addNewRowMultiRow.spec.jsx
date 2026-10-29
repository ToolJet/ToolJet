import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { seedApp } from '@/test/app-builder';
import useTableStore from '../../../../_stores/tableStore';
import { AddNewRow } from '../AddNewRow';

const TABLE_ID = 'addrowform-multi-table';

const NAME = { id: 'm1', name: 'Name', key: 'name', columnType: 'string' };
const CODE = { id: 'm2', name: 'Code', key: 'code', columnType: 'string', minLength: '3' };
const NOTES = { id: 'm3', name: 'Notes', key: 'notes', columnType: 'string' };

// jsdom has no matchMedia; the form skips its fade-out for users who prefer reduced motion.
function setReducedMotion(reduce) {
  window.matchMedia = (query) => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  });
}
beforeEach(() => setReducedMotion(true));

beforeAll(() => {
  Element.prototype.hasPointerCapture ||= () => false;
  Element.prototype.setPointerCapture ||= () => {};
  Element.prototype.releasePointerCapture ||= () => {};
  Element.prototype.scrollIntoView ||= () => {};
});

const savedRows = () => [...useTableStore.getState().getAllAddNewRowDetails(TABLE_ID).values()];

function renderForm({
  columns = [NAME, NOTES],
  properties = {},
  fireEvent = jest.fn(),
  hide = jest.fn(),
  darkMode = false,
} = {}) {
  seedApp({});
  const store = useTableStore.getState();
  store.initializeComponent(TABLE_ID);
  store.setTableProperties(TABLE_ID, { allowAddingMultipleRows: true, ...properties });
  store.setColumnDetails(TABLE_ID, columns, false, [], {}, false, [], false);
  const allColumns = columns.map((column) => ({
    columnDef: { accessorKey: column.key, meta: { columnType: column.columnType } },
  }));
  const user = userEvent.setup();
  const view = render(
    <AddNewRow
      id={TABLE_ID}
      hideAddNewRowPopup={hide}
      darkMode={darkMode}
      allColumns={allColumns}
      fireEvent={fireEvent}
      setExposedVariables={jest.fn()}
    />
  );
  globalThis.__TOOLJET_APP_BUILDER_TEST_SESSIONS__ ||= [];
  globalThis.__TOOLJET_APP_BUILDER_TEST_SESSIONS__.push(async () => view.unmount());
  return { user, fireEvent, hide, ...view };
}

const field = (name) => screen.getByRole('group', { name });
const textbox = (name) => within(field(name)).getByRole('textbox');
const rowsGroup = () => screen.getByRole('group', { name: 'Rows' });
const chip = (number) => within(rowsGroup()).getByRole('button', { name: new RegExp(`^Row ${number}(,|$)`) });
const addAnother = () => screen.getByRole('button', { name: 'Add another row' });

async function addRows(user, count) {
  for (let i = 0; i < count; i += 1) await user.click(addAnother());
}

describe('Table-ADDROWFORM-037 multi-row off', () => {
  test('Table-ADDROWFORM-037 renders no chips, no + and no Remove row, and keeps the single-row wording', () => {
    // Break this catches: the multi-row controls showing although the builder switched multiple rows off.
    renderForm({ properties: { allowAddingMultipleRows: false } });

    expect(screen.queryByRole('group', { name: 'Rows' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add another row' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove row' })).not.toBeInTheDocument();
    expect(screen.queryByText(/^Row \d+ of \d+$/)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Add row' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add row' })).toBeInTheDocument();
  });

  test('Table-ADDROWFORM-037 an app saved before the setting existed gets the multi-row form', () => {
    // Break this catches: saved apps losing the "add several rows" ability they have today (decision D2).
    seedApp({});
    const store = useTableStore.getState();
    store.initializeComponent(TABLE_ID);
    store.setTableProperties(TABLE_ID, {});
    store.setColumnDetails(TABLE_ID, [NAME], false, [], {}, false, [], false);
    const view = render(
      <AddNewRow
        id={TABLE_ID}
        hideAddNewRowPopup={jest.fn()}
        darkMode={false}
        allColumns={[{ columnDef: { accessorKey: 'name', meta: { columnType: 'string' } } }]}
        fireEvent={jest.fn()}
        setExposedVariables={jest.fn()}
      />
    );
    globalThis.__TOOLJET_APP_BUILDER_TEST_SESSIONS__ ||= [];
    globalThis.__TOOLJET_APP_BUILDER_TEST_SESSIONS__.push(async () => view.unmount());

    expect(screen.getByRole('button', { name: 'Add another row' })).toBeInTheDocument();
  });
});

describe('Table-ADDROWFORM-038 adding rows', () => {
  test('Table-ADDROWFORM-038 opens on row 1 of 1 with one chip and the +, and no Remove row', () => {
    // Break this catches: the picker missing at the start, or Remove row offered for the only row.
    renderForm();

    expect(screen.getByRole('heading', { name: 'Add rows' })).toBeInTheDocument();
    expect(screen.getByText('Row 1 of 1')).toBeInTheDocument();
    expect(chip(1)).toHaveAttribute('aria-current', 'true');
    expect(addAnother()).toHaveAttribute('data-cy', 'add-another-row-button');
    expect(screen.queryByRole('button', { name: 'Remove row' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add row' })).toBeInTheDocument();
  });

  test('Table-ADDROWFORM-038 + adds an empty row, selects it and moves focus to its first field', async () => {
    // Break this catches: the new row not being selected, or its fields keeping the previous row's values.
    const { user } = renderForm();
    await user.type(textbox('Name'), 'Amy');

    await user.click(addAnother());

    expect(screen.getByText('Row 2 of 2')).toBeInTheDocument();
    expect(chip(2)).toHaveAttribute('aria-current', 'true');
    expect(chip(1)).not.toHaveAttribute('aria-current');
    expect(textbox('Name')).toHaveValue('');
    expect(textbox('Name')).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Add 2 rows' })).toBeInTheDocument();
    expect(savedRows()).toHaveLength(2);
  });

  test('Table-ADDROWFORM-038 typing goes to the selected row, and switching chips brings each row back as typed', async () => {
    // Break this catches: values written to the wrong row, or lost when moving between rows.
    const { user } = renderForm();
    await user.type(textbox('Name'), 'Amy');
    await user.click(addAnother());
    await user.type(textbox('Name'), 'Zed');

    await user.click(chip(1));
    expect(screen.getByText('Row 1 of 2')).toBeInTheDocument();
    expect(textbox('Name')).toHaveValue('Amy');
    expect(document.querySelector('[data-cy="add-new-row-0"]')).toBeInTheDocument();

    await user.click(chip(2));
    expect(textbox('Name')).toHaveValue('Zed');
    expect(document.querySelector('[data-cy="add-new-row-1"]')).toBeInTheDocument();
    expect(savedRows().map((row) => row.name)).toEqual(['Amy', 'Zed']);
  });

  test('Table-ADDROWFORM-038 the button and the saving text count the rows', async () => {
    // Break this catches: "Add rows" without a number, or a stale count after adding.
    const { user } = renderForm();

    await addRows(user, 2);

    expect(screen.getByText('Row 3 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add 3 rows' })).toBeInTheDocument();
  });

  test('Table-ADDROWFORM-038 Cancel with several rows fires the cancel event once and throws every row away', async () => {
    // Break this catches: rows other than the first surviving a cancel and reappearing next time.
    const { user, fireEvent, hide } = renderForm();
    await user.type(textbox('Name'), 'Amy');
    await addRows(user, 1);
    await user.type(textbox('Name'), 'Zed');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(fireEvent).toHaveBeenCalledTimes(1);
    expect(fireEvent).toHaveBeenCalledWith('onAddNewRowCancelled');
    expect(hide).toHaveBeenCalledTimes(1);
    // the mocked hide leaves the form mounted, so it seeds one blank row again, as it does when it opens;
    // nothing that was typed may survive
    expect(savedRows().filter((row) => row.name)).toHaveLength(0);
    expect(savedRows().length).toBeLessThanOrEqual(1);
  });
});

describe('Table-ADDROWFORM-038 the selected row after the draft is cleared', () => {
  test('Table-ADDROWFORM-038 a form that stays mounted after Cancel shows row 1 of 1, not an empty box', async () => {
    // Break this catches: the selection still pointing at row 3 after the draft shrank to one row, blanking the form.
    const { user } = renderForm();
    await addRows(user, 2);
    expect(screen.getByText('Row 3 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(textbox('Name')).toBeInTheDocument();
    expect(screen.getByText('Row 1 of 1')).toBeInTheDocument();
  });
});

describe('Table-ADDROWFORM-039 many rows', () => {
  test('Table-ADDROWFORM-039 12 rows show chips 1-9, a "…" menu and the last chip', async () => {
    // Break this catches: twelve chips overflowing the form, or the last row hidden.
    const { user } = renderForm();

    await addRows(user, 11);

    const names = within(rowsGroup())
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'));
    expect(names).toEqual([
      'Row 1',
      'Row 2',
      'Row 3',
      'Row 4',
      'Row 5',
      'Row 6',
      'Row 7',
      'Row 8',
      'Row 9',
      'More rows',
      'Row 12',
      'Add another row',
    ]);
    expect(screen.getByText('Row 12 of 12')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add 12 rows' })).toBeInTheDocument();
  });

  test('Table-ADDROWFORM-039 the "…" menu lists only the hidden rows, and picking one shows it in place of row 9', async () => {
    // Break this catches: the picked row staying hidden, or the menu repeating rows that already have a chip.
    const { user } = renderForm();
    await addRows(user, 11);

    await user.click(screen.getByRole('button', { name: 'More rows' }));
    const items = screen.getAllByRole('menuitem').map((item) => item.getAttribute('aria-label'));
    expect(items).toEqual(['Row 10', 'Row 11']);

    await user.click(screen.getByRole('menuitem', { name: 'Row 11' }));

    expect(screen.getByText('Row 11 of 12')).toBeInTheDocument();
    expect(chip(11)).toHaveAttribute('aria-current', 'true');
    expect(within(rowsGroup()).queryByRole('button', { name: /^Row 9$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });
});

describe('Table-ADDROWFORM-040 removing a row', () => {
  const typeNames = async (user, names) => {
    for (const [index, name] of names.entries()) {
      if (index > 0) await user.click(addAnother());
      await user.type(textbox('Name'), name);
    }
  };

  test('Table-ADDROWFORM-040 Remove row on a middle row renumbers the rest and keeps the order', async () => {
    // Break this catches: the wrong row going, or rows keeping their old numbers after a remove.
    const { user } = renderForm();
    await typeNames(user, ['A', 'B', 'C']);
    await user.click(chip(2));

    await user.click(screen.getByRole('button', { name: 'Remove row' }));

    expect(screen.getByText('Row 2 of 2')).toBeInTheDocument();
    expect(textbox('Name')).toHaveValue('C');
    expect(savedRows().map((row) => row.name)).toEqual(['A', 'C']);
    expect(screen.getByRole('button', { name: 'Add 2 rows' })).toBeInTheDocument();
    expect(within(rowsGroup()).queryByRole('button', { name: /^Row 3$/ })).not.toBeInTheDocument();
  });

  test('Table-ADDROWFORM-040 removing the last chip moves the selection to the row before it', async () => {
    // Break this catches: the selection pointing at a row that no longer exists, so the form shows nothing.
    const { user } = renderForm();
    await typeNames(user, ['A', 'B']);

    await user.click(screen.getByRole('button', { name: 'Remove row' }));

    expect(screen.getByText('Row 1 of 1')).toBeInTheDocument();
    expect(textbox('Name')).toHaveValue('A');
    expect(savedRows().map((row) => row.name)).toEqual(['A']);
  });

  test('Table-ADDROWFORM-040 the only row cannot be removed, however many were removed before', async () => {
    // Break this catches: the form ending up with no row at all.
    const { user } = renderForm();
    await typeNames(user, ['A', 'B']);

    await user.click(screen.getByRole('button', { name: 'Remove row' }));

    expect(screen.queryByRole('button', { name: 'Remove row' })).not.toBeInTheDocument();
    expect(savedRows()).toHaveLength(1);
  });
});

describe('Table-ADDROWFORM-041 validation across rows', () => {
  const columns = [NAME, CODE];

  async function threeRowsWithRowTwoInvalid(user) {
    await user.type(textbox('Name'), 'One');
    await user.type(textbox('Code'), 'abc');
    await user.click(addAnother());
    await user.type(textbox('Name'), 'Two');
    await user.type(textbox('Code'), 'x');
    await user.click(addAnother());
    await user.type(textbox('Name'), 'Three');
    await user.type(textbox('Code'), 'xyz');
  }

  test('Table-ADDROWFORM-041 an invalid row blocks the whole save, selects that row and marks its chip', async () => {
    // Break this catches: valid rows being sent while another row is invalid, or the error hidden on another row.
    const { user, fireEvent, hide } = renderForm({ columns });
    await threeRowsWithRowTwoInvalid(user);

    await user.click(screen.getByRole('button', { name: 'Add 3 rows' }));

    expect(fireEvent).not.toHaveBeenCalled();
    expect(hide).not.toHaveBeenCalled();
    expect(screen.getByText('Row 2 of 3')).toBeInTheDocument();
    expect(chip(2)).toHaveAttribute('data-invalid', 'true');
    expect(chip(2)).toHaveAccessibleName('Row 2, has errors');
    expect(chip(1)).not.toHaveAttribute('data-invalid');
    expect(chip(3)).not.toHaveAttribute('data-invalid');
    expect(within(field('Code')).getByRole('alert')).toHaveTextContent('Minimum 3 characters is needed');
    expect(textbox('Code')).toHaveFocus();
  });

  test('Table-ADDROWFORM-041 every invalid row is marked, and the first of them is the one shown', async () => {
    // Break this catches: only one invalid row being flagged, or the form jumping to the last one.
    const { user } = renderForm({ columns });
    await threeRowsWithRowTwoInvalid(user);
    await user.click(chip(3));
    await user.clear(textbox('Code'));
    await user.type(textbox('Code'), 'z');

    await user.click(screen.getByRole('button', { name: 'Add 3 rows' }));

    expect(chip(2)).toHaveAttribute('data-invalid', 'true');
    expect(chip(3)).toHaveAttribute('data-invalid', 'true');
    expect(chip(1)).not.toHaveAttribute('data-invalid');
    expect(screen.getByText('Row 2 of 3')).toBeInTheDocument();
  });

  test('Table-ADDROWFORM-041 nothing is marked before the first Add rows click', async () => {
    // Break this catches: chips turning red while the user is still typing the first row.
    const { user } = renderForm({ columns });
    await user.type(textbox('Name'), 'One');
    await user.click(addAnother());

    expect(chip(1)).not.toHaveAttribute('data-invalid');
    expect(chip(2)).not.toHaveAttribute('data-invalid');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('Table-ADDROWFORM-041 fixing the row clears its chip, and then every row is sent once, in order', async () => {
    // Break this catches: a stale red chip after the fix, or rows sent more than once or out of order.
    const { user, fireEvent, hide } = renderForm({ columns });
    await threeRowsWithRowTwoInvalid(user);
    await user.click(screen.getByRole('button', { name: 'Add 3 rows' }));

    await user.type(textbox('Code'), 'yz');
    expect(chip(2)).not.toHaveAttribute('data-invalid');

    await user.click(screen.getByRole('button', { name: 'Add 3 rows' }));

    expect(fireEvent).toHaveBeenCalledTimes(1);
    expect(fireEvent).toHaveBeenCalledWith('onNewRowsAdded');
    expect(hide).toHaveBeenCalledTimes(1);
    expect(savedRows()).toEqual([
      { name: 'One', code: 'abc' },
      { name: 'Two', code: 'xyz' },
      { name: 'Three', code: 'xyz' },
    ]);
  });

  test('Table-ADDROWFORM-041 a hidden invalid row turns the "…" chip red and its row can be reached from the menu', async () => {
    // Break this catches: an invalid row hidden in the "…" menu with no sign that it needs attention.
    const { user, fireEvent } = renderForm({ columns: [CODE] });
    await user.type(textbox('Code'), 'abc');
    for (let i = 0; i < 11; i += 1) {
      await user.click(addAnother());
      await user.type(textbox('Code'), i === 3 ? 'x' : 'abc');
    }
    // row 5 is invalid and has its own chip; now make row 11 invalid too, which sits behind "…"
    await user.click(screen.getByRole('button', { name: 'More rows' }));
    await user.click(screen.getByRole('menuitem', { name: 'Row 11' }));
    await user.clear(textbox('Code'));
    await user.type(textbox('Code'), 'q');
    await user.click(chip(12));

    await user.click(screen.getByRole('button', { name: 'Add 12 rows' }));

    expect(fireEvent).not.toHaveBeenCalled();
    // the first invalid row (row 5) is shown; row 11 is still hidden behind "…"
    expect(screen.getByText('Row 5 of 12')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More rows, has errors' })).toHaveAttribute('data-invalid', 'true');
  });
});

describe('Table-ADDROWFORM-042 saving several rows', () => {
  test('Table-ADDROWFORM-042 shows "Adding 2 rows…" and locks the row picker while the app handles the event', async () => {
    // Break this catches: switching, adding or removing rows while they are being sent.
    let release;
    const fireEvent = jest.fn(() => new Promise((resolve) => (release = resolve)));
    const { user, hide } = renderForm({ fireEvent });
    await user.type(textbox('Name'), 'A');
    await addRows(user, 1);
    await user.type(textbox('Name'), 'B');

    await user.click(screen.getByRole('button', { name: 'Add 2 rows' }));

    expect(screen.getByRole('button', { name: 'Adding 2 rows…' })).toBeDisabled();
    expect(
      within(rowsGroup())
        .getAllByRole('button')
        .every((button) => button.disabled)
    ).toBe(true);
    expect(screen.getByRole('button', { name: 'Remove row' })).toBeDisabled();
    expect(hide).not.toHaveBeenCalled();
    expect(fireEvent).toHaveBeenCalledTimes(1);

    await act(async () => release());
    await waitFor(() => expect(hide).toHaveBeenCalledTimes(1));
  });
});

describe('Table-ADDROWFORM-043 dark mode', () => {
  const PLAN = {
    id: 'm4',
    name: 'Plan',
    key: 'plan',
    columnType: 'select',
    options: [{ label: 'Free', value: 'free' }],
  };

  test('Table-ADDROWFORM-043 the "…" menu and a select menu, which render in a portal, follow the app theme', async () => {
    // Break this catches: menus opening in light colours over a dark form, because a portal leaves the themed tree.
    const { user } = renderForm({ columns: [PLAN], darkMode: true });
    await addRows(user, 11);

    await user.click(screen.getByRole('button', { name: 'More rows' }));
    expect(screen.getByRole('menu')).toHaveClass('dark-theme');
    await user.keyboard('{Escape}');

    await user.click(within(field('Plan')).getByRole('combobox'));
    expect(screen.getByRole('listbox').closest('[data-radix-popper-content-wrapper]')).toBeInTheDocument();
    expect(screen.getByRole('listbox').closest('.dark-theme')).toBeInTheDocument();
  });

  test('Table-ADDROWFORM-043 in light mode nothing is themed dark', async () => {
    // Break this catches: the dark class being applied unconditionally.
    const { user } = renderForm({ columns: [PLAN], darkMode: false });
    await addRows(user, 11);

    await user.click(screen.getByRole('button', { name: 'More rows' }));

    expect(screen.getByRole('menu')).not.toHaveClass('dark-theme');
  });
});

describe('Table-ADDROWFORM-044 keyboard order', () => {
  test('Table-ADDROWFORM-044 Tab walks the form in reading order: chips, +, Remove row, fields, Cancel, Add rows', async () => {
    // Break this catches: the picker or the footer sitting in the wrong place in the tab order.
    const { user } = renderForm({ columns: [NAME, NOTES] });
    await addRows(user, 1);
    await user.click(chip(1));
    const stops = [];
    const nameOf = (element) =>
      element.getAttribute('aria-label') ||
      element.textContent.trim() ||
      within(element.closest('[role="group"][aria-labelledby]')).getByText(/./, { selector: 'span' }).textContent;

    for (let i = 0; i < 8; i += 1) {
      await user.tab();
      stops.push(nameOf(document.activeElement));
    }

    expect(stops).toEqual([
      'Row 2',
      'Add another row',
      'Remove row',
      'Name',
      'Notes',
      'Cancel',
      'Add 2 rows',
      expect.anything(),
    ]);
  });
});
