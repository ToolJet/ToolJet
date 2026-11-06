/**
 * Chips in the header of a real Table are editable in place: typing or picking a value applies the filter,
 * the cross clears the value and keeps the chip, and none of it touches what the builder saved.
 */
import { screen, waitFor } from '@testing-library/react';
import { createWidgetHarness, binding, countInvocationsOn, store } from '../../../__tests__/integration/widgetHarness';
import useTableStore from '../../_stores/tableStore';

const widget = createWidgetHarness({
  componentType: 'Table',
  handle: 'table1',
  id: 't1',
  widgetHeight: 460,
  widgetWidth: 900,
  capabilities: { dnd: true },
  defaultProperties: {
    data: binding(
      "{{[{ id: 1, name: 'Jane', status: 'active', email: 'j@x.com' }, { id: 2, name: 'Bob', status: 'invited', email: '' }, { id: 3, name: 'Jamal', status: 'invited', email: 'm@x.com' }]}}"
    ),
    columns: {
      value: [
        { id: 'c-name', name: 'Name', key: 'name', columnType: 'string' },
        {
          id: 'c-status',
          name: 'Status',
          key: 'status',
          columnType: 'select',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Invited', value: 'invited' },
          ],
        },
        { id: 'c-email', name: 'Email', key: 'email', columnType: 'string' },
      ],
    },
    autogenerateColumns: binding(false),
    defaultFilters: {
      value: [
        { id: 'f1', column: 'c-name', condition: 'contains', value: '' },
        { id: 'f2', column: 'c-status', condition: 'equals', value: '' },
        { id: 'f3', column: 'c-email', condition: 'isEmpty' },
      ],
    },
  },
});

beforeEach(widget.setup);
afterEach(widget.teardown);

const shownNames = () => (widget.exposed().filteredData ?? []).map((row) => row.name);
const savedFilters = () => useTableStore.getState().getTableProperties('t1')?.defaultFilters;
const SAVED = [
  { id: 'f1', column: 'c-name', condition: 'contains', value: '' },
  { id: 'f2', column: 'c-status', condition: 'equals', value: '' },
  { id: 'f3', column: 'c-email', condition: 'isEmpty' },
];

const nameInput = () => screen.getByRole('textbox', { name: 'Name contains value' });
const statusPicker = () => screen.getByRole('button', { name: 'Status equals value' });
const emailChip = () => screen.getByRole('button', { name: 'Email is empty' });

async function renderChips(extra = {}) {
  widget.render({ currentMode: 'view', ...extra });
  await waitFor(() => expect(widget.exposed().currentData?.length).toBe(3));
  await screen.findByRole('textbox', { name: 'Name contains value' });
}

describe('Table-FILTERUI-019 typing into a chip', () => {
  test('Table-FILTERUI-019 applies the filter once typing pauses, and the rows follow', async () => {
    // Break this catches: the chip value never reaching the table, so it looks editable but does nothing.
    await renderChips();
    await waitFor(() => expect(shownNames()).toEqual(['Bob']));

    await widget.session.user.click(emailChip());
    await widget.session.user.type(nameInput(), 'Ja');

    await waitFor(() =>
      expect(widget.exposed().filters).toEqual([{ column: 'Name', condition: 'contains', value: 'Ja' }])
    );
    expect(shownNames()).toEqual(['Jane', 'Bob', 'Jamal'].filter((name) => name.includes('Ja')));
  });

  test('Table-FILTERUI-019 the filter handlers run once for a burst of typing, not once per key', async () => {
    // Break this catches: every keystroke running the app's filter handlers (and its queries).
    await renderChips({ events: countInvocationsOn('t1', 'onFilterChanged') });

    await widget.session.user.type(nameInput(), 'Jam');

    await waitFor(() => expect(widget.exposed().filters).toHaveLength(2));
    await new Promise((resolve) => setTimeout(resolve, 700));
    expect(store().getVariable('calls', 'canvas')).toBe(1);
  });

  test('Table-FILTERUI-019 editing an applied value changes it in place', async () => {
    // Break this catches: an edit adding a second filter instead of changing the first.
    await renderChips();
    await widget.session.user.click(emailChip());
    await widget.session.user.type(nameInput(), 'Ja');
    await waitFor(() => expect(widget.exposed().filters).toHaveLength(1));

    await widget.session.user.type(nameInput(), 'm');

    await waitFor(() =>
      expect(widget.exposed().filters).toEqual([{ column: 'Name', condition: 'contains', value: 'Jam' }])
    );
    expect(shownNames()).toEqual(['Jamal']);
  });
});

describe('Table-FILTERUI-020 picking a value on an option chip', () => {
  test('Table-FILTERUI-020 offers the column options, applies the pick and shows its label', async () => {
    // Break this catches: a select chip that cannot be filled in, or one that shows the raw value.
    await renderChips();
    await widget.session.user.click(emailChip());

    await widget.session.user.click(statusPicker());
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Active', 'Invited']);
    await widget.session.user.click(screen.getByRole('option', { name: 'Invited' }));

    await waitFor(() =>
      expect(widget.exposed().filters).toEqual([{ column: 'Status', condition: 'equals', value: 'invited' }])
    );
    expect(screen.getByRole('button', { name: 'Status equals value' })).toHaveTextContent('Invited');
    expect(shownNames()).toEqual(['Bob', 'Jamal']);
  });
});

describe('Table-FILTERUI-021 the cross on a chip', () => {
  test('Table-FILTERUI-021 clears the value and keeps the chip, with its placeholder back', async () => {
    // Break this catches: the cross deleting the chip, which a builder filter must never allow.
    await renderChips();
    await widget.session.user.click(emailChip());
    await widget.session.user.type(nameInput(), 'Ja');
    await waitFor(() => expect(widget.exposed().filters).toHaveLength(1));

    await widget.session.user.click(screen.getByRole('button', { name: 'Clear Name filter' }));

    await waitFor(() => expect(widget.exposed().filters).toEqual([]));
    expect(nameInput()).toHaveValue('');
    expect(shownNames()).toEqual(['Jane', 'Bob', 'Jamal']);
    expect(screen.queryByRole('button', { name: 'Clear Name filter' })).not.toBeInTheDocument();
  });

  test('Table-FILTERUI-021 a chip with no value box is switched off and on by clicking it', async () => {
    // Break this catches: an is empty chip that cannot be taken off, or put back on.
    await renderChips();
    expect(emailChip()).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() =>
      expect(widget.exposed().filters).toEqual([expect.objectContaining({ column: 'Email', condition: 'isEmpty' })])
    );

    await widget.session.user.click(emailChip());
    await waitFor(() => expect(widget.exposed().filters).toEqual([]));
    expect(emailChip()).toHaveAttribute('aria-pressed', 'false');

    await widget.session.user.click(emailChip());
    await waitFor(() => expect(widget.exposed().filters).toHaveLength(1));
    expect(emailChip()).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Table-FILTERUI-032 what the user does is not saved', () => {
  test("Table-FILTERUI-032 typing, picking and clearing leave the builder's saved filters as they were", async () => {
    // Break this catches: a user's session edits being written back to the Table's saved filters.
    await renderChips();

    await widget.session.user.type(nameInput(), 'Ja');
    await widget.session.user.click(await screen.findByRole('button', { name: 'Clear Name filter' }));
    await widget.session.user.click(emailChip());

    expect(savedFilters()).toEqual(SAVED);
  });
});
