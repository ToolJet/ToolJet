import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { seedApp } from '@/test/app-builder';
import useTableStore from '../../../../_stores/tableStore';
import { AddNewRow } from '../AddNewRow';

const TABLE_ID = 'addrowform-fixes-table';

const NAME = { id: 'f1', name: 'Name', key: 'name', columnType: 'string' };
const CODE = { id: 'f2', name: 'Code', key: 'code', columnType: 'string', minLength: '3' };
const META = { id: 'f3', name: 'Meta', key: 'meta', columnType: 'json' };

// jsdom has no matchMedia; the form skips its fade-out for users who prefer reduced motion.
beforeEach(() => {
  window.matchMedia = (query) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  });
});

beforeAll(() => {
  Element.prototype.hasPointerCapture ||= () => false;
  Element.prototype.setPointerCapture ||= () => {};
  Element.prototype.releasePointerCapture ||= () => {};
  Element.prototype.scrollIntoView ||= () => {};
});

const rows = () => [...useTableStore.getState().getAllAddNewRowDetails(TABLE_ID).values()];
const draft = () => rows()[0];

function renderForm({
  columns = [NAME, CODE],
  properties = {},
  columnDetails = {},
  fireEvent = jest.fn(),
  hide = jest.fn(),
  wrap = (form) => form,
} = {}) {
  seedApp({});
  const store = useTableStore.getState();
  store.initializeComponent(TABLE_ID);
  store.setTableProperties(TABLE_ID, { allowAddingMultipleRows: false, ...properties });
  const { dynamic = false, columnData = [] } = columnDetails;
  store.setColumnDetails(TABLE_ID, dynamic ? [] : columns, dynamic, columnData, {}, true, [], dynamic);
  const allColumns = store.getColumnProperties(TABLE_ID).map((column) => ({
    columnDef: { accessorKey: column.key || column.name, meta: { columnType: column.columnType } },
  }));
  const user = userEvent.setup();
  const view = render(
    wrap(
      <AddNewRow
        id={TABLE_ID}
        hideAddNewRowPopup={hide}
        darkMode={false}
        allColumns={allColumns}
        fireEvent={fireEvent}
        setExposedVariables={jest.fn()}
      />
    )
  );
  globalThis.__TOOLJET_APP_BUILDER_TEST_SESSIONS__ ||= [];
  globalThis.__TOOLJET_APP_BUILDER_TEST_SESSIONS__.push(async () => view.unmount());
  return { user, fireEvent, hide, ...view };
}

const field = (name) => screen.getByRole('group', { name });
const textbox = (name) => within(field(name)).getByRole('textbox');

describe('Table-ADDROWFORM-051 nested columns can be typed into', () => {
  const NESTED = [NAME, { id: 'n1', name: 'metadata.team', key: 'metadata.team', columnType: 'string' }];

  test('Table-ADDROWFORM-051 every character typed into a nested column stays, and is stored at its path', async () => {
    // Break this catches: only the first character sticking (the store never overwrote a filled nested value), or
    // the field reading the flat key and showing empty.
    const { user } = renderForm({ columns: NESTED });

    await user.type(textbox('metadata.team'), 'Platform');

    expect(textbox('metadata.team')).toHaveValue('Platform');
    expect(draft().metadata).toEqual({ team: 'Platform' });
  });

  test('Table-ADDROWFORM-051 a nested column and a flat one can both be filled in any order', async () => {
    // Break this catches: editing one field wiping the other.
    const { user } = renderForm({ columns: NESTED });

    await user.type(textbox('metadata.team'), 'QA');
    await user.type(textbox('Name'), 'Ada');
    await user.type(textbox('metadata.team'), '!');

    expect(draft()).toEqual({ name: 'Ada', metadata: { team: 'QA!' } });
  });
});

describe('Table-ADDROWFORM-052 inside a Form widget', () => {
  // The Form widget renders a <form>; the table (and so this form) can sit inside it.
  const insideForm = (form) => <form onSubmit={(event) => event.preventDefault()}>{form}</form>;

  test('Table-ADDROWFORM-052 Enter in a text field neither cancels nor sends, and keeps what was typed', async () => {
    // Break this catches: Enter clicking a button of the form (they were submit buttons), which cleared the draft
    // and closed the form.
    const { user, hide, fireEvent } = renderForm({ wrap: insideForm });

    await user.type(textbox('Name'), 'Ada{Enter}');

    expect(hide).not.toHaveBeenCalled();
    expect(fireEvent).not.toHaveBeenCalled();
    expect(draft().name).toBe('Ada');
    expect(textbox('Name')).toHaveValue('Ada');
  });

  test('Table-ADDROWFORM-052 none of the form buttons submits the surrounding <form>', async () => {
    // Break this catches: a button without type="button", which submits (and so resets) a Form widget.
    const onSubmit = jest.fn((event) => event.preventDefault());
    const { user } = renderForm({
      wrap: (form) => <form onSubmit={onSubmit}>{form}</form>,
      properties: { allowAddingMultipleRows: true },
    });

    await user.click(screen.getByRole('button', { name: 'Add another row' }));
    await user.click(screen.getByRole('button', { name: /^Row 1/ }));
    await user.click(screen.getByRole('button', { name: 'Remove row' }));
    await user.click(screen.getByRole('button', { name: 'Add row' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('Table-ADDROWFORM-052 Enter in a textarea still adds a line', async () => {
    // Break this catches: the Enter guard also swallowing the newline of a multi-line field.
    const { user } = renderForm({
      columns: [{ id: 't1', name: 'Notes', key: 'notes', columnType: 'text' }],
      wrap: insideForm,
    });

    await user.type(textbox('Notes'), 'a{Enter}b');

    expect(draft().notes).toBe('a\nb');
  });
});

describe('Table-ADDROWFORM-053 JSON field', () => {
  test('Table-ADDROWFORM-053 valid JSON is sent as an object, and a bad one blocks Add row with a message', async () => {
    // Break this catches: JSON text sent as a string, or invalid JSON accepted.
    const { user, fireEvent } = renderForm({ columns: [NAME, META] });

    await user.click(textbox('Meta'));
    await user.paste('{"a": ');
    await user.click(screen.getByRole('button', { name: 'Add row' }));

    expect(fireEvent).not.toHaveBeenCalled();
    expect(within(field('Meta')).getByRole('alert')).toHaveTextContent('Invalid JSON: missing closing }');

    await user.clear(textbox('Meta'));
    await user.click(textbox('Meta'));
    await user.paste('{"a": {"b": [1, 2]}}');
    expect(within(field('Meta')).queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add row' }));

    expect(fireEvent).toHaveBeenCalledWith('onNewRowsAdded');
    expect(draft().meta).toEqual({ a: { b: [1, 2] } });
  });

  test('Table-ADDROWFORM-053 an empty JSON field is fine', async () => {
    // Break this catches: an empty optional JSON field being flagged.
    const { user, fireEvent } = renderForm({ columns: [NAME, META] });

    await user.click(screen.getByRole('button', { name: 'Add row' }));
    expect(fireEvent).toHaveBeenCalledTimes(1);
  });

  test('Table-ADDROWFORM-053 a bare word is flagged', async () => {
    // Break this catches: any text being accepted by a JSON field.
    const { user, fireEvent } = renderForm({ columns: [NAME, META] });

    await user.type(textbox('Meta'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Add row' }));

    expect(fireEvent).not.toHaveBeenCalled();
    expect(within(field('Meta')).getByRole('alert')).toHaveTextContent('Invalid JSON');
  });
});

describe('Table-ADDROWFORM-054 columns to include', () => {
  test('Table-ADDROWFORM-054 an empty saved list shows every column', () => {
    // Break this catches: a form with nothing to fill in.
    renderForm({ properties: { addNewRowColumns: [] } });

    expect(field('Name')).toBeInTheDocument();
    expect(field('Code')).toBeInTheDocument();
  });

  test('Table-ADDROWFORM-054 a saved list that matches no column shows every column', () => {
    // Break this catches: columns deleted or renamed since the list was saved leaving the form empty.
    renderForm({ properties: { addNewRowColumns: ['gone'] } });

    expect(field('Name')).toBeInTheDocument();
    expect(field('Code')).toBeInTheDocument();
  });
});

describe('Table-ADDROWFORM-055 dynamic columns', () => {
  const DYNAMIC = [
    { name: 'sku', key: 'sku', columnType: 'string' },
    { name: 'stock', key: 'stock', columnType: 'number' },
  ];

  test('Table-ADDROWFORM-055 columns that come from the dynamic column setting get a field, like they did in the popup', () => {
    // Break this catches: dynamic columns missing from the form.
    renderForm({ columnDetails: { dynamic: true, columnData: DYNAMIC } });

    expect(field('sku')).toBeInTheDocument();
    expect(field('stock')).toBeInTheDocument();
  });

  test('Table-ADDROWFORM-055 and they are in the rows sent', async () => {
    // Break this catches: dynamic columns' keys missing from newRows.
    const { user } = renderForm({ columnDetails: { dynamic: true, columnData: DYNAMIC } });

    await user.type(textbox('sku'), 'A-1');

    expect(draft()).toEqual({ sku: 'A-1', stock: '' });
  });
});

describe('Table-ADDROWFORM-056 newRows keeps every column', () => {
  test('Table-ADDROWFORM-056 a column left out of the form is still in the row, empty, as before', () => {
    // Break this catches: apps that read newRows[i].code getting undefined because the form hides that column.
    renderForm({ properties: { addNewRowColumns: ['name'] } });

    expect(screen.queryByRole('group', { name: 'Code' })).not.toBeInTheDocument();
    expect(draft()).toEqual({ name: '', code: '' });
  });

  test('Table-ADDROWFORM-056 a row added with + carries the same keys', async () => {
    // Break this catches: later rows built from a different column set than the first.
    const { user } = renderForm({
      properties: { addNewRowColumns: ['name'], allowAddingMultipleRows: true },
    });

    await user.click(screen.getByRole('button', { name: 'Add another row' }));

    expect(rows()).toEqual([
      { name: '', code: '' },
      { name: '', code: '' },
    ]);
  });
});

describe('Table-ADDROWFORM-057 errors belong to the rows that were checked', () => {
  const multi = { properties: { allowAddingMultipleRows: true } };

  test('Table-ADDROWFORM-057 a row added after a failed Add rows starts without errors', async () => {
    // Break this catches: the error state being shared by every row, so a new row opens already red.
    const { user } = renderForm(multi);

    await user.click(screen.getByRole('button', { name: 'Add row' }));
    expect(within(field('Code')).getByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add another row' }));

    expect(screen.getByText('Row 2 of 2')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Row 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Row 1, has errors' })).toBeInTheDocument();
  });

  test('Table-ADDROWFORM-057 row 1 keeps its errors, and the next Add rows checks the new row too', async () => {
    // Break this catches: errors lost on the checked row, or the new row never being checked.
    const { user, fireEvent } = renderForm(multi);

    await user.click(screen.getByRole('button', { name: 'Add row' }));
    await user.click(screen.getByRole('button', { name: 'Add another row' }));
    await user.click(screen.getByRole('button', { name: 'Row 1, has errors' }));
    expect(within(field('Code')).getByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add 2 rows' }));

    expect(fireEvent).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Row 2, has errors' })).toBeInTheDocument();
  });

  test('Table-ADDROWFORM-057 removing a row moves the checked state of the rows after it', async () => {
    // Break this catches: after removing row 1, the checked row 2 (now row 1) opening clean, or row 2 opening red.
    const { user } = renderForm(multi);

    await user.click(screen.getByRole('button', { name: 'Add another row' }));
    await user.type(textbox('Code'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Row 1' }));
    await user.click(screen.getByRole('button', { name: 'Add 2 rows' }));
    // row 1 is invalid and checked, row 2 is valid; drop row 2 and add a fresh one
    await user.click(screen.getByRole('button', { name: 'Row 2' }));
    await user.click(screen.getByRole('button', { name: 'Remove row' }));
    await user.click(screen.getByRole('button', { name: 'Add another row' }));

    expect(screen.getByRole('button', { name: 'Row 1, has errors' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Row 2' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
