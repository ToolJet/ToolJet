/**
 * What the user adds in the filters panel is also a chip in the table's header, edited and removed there, and
 * text that is cut off in the panel and on the chips can be read in full by hovering it.
 */
import { screen, waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '../../../__tests__/integration/widgetHarness';

const SAVED = [
  { id: 'f1', column: 'c-name', condition: 'contains', value: '' },
  { id: 'f2', column: 'c-status', condition: 'equals', value: '' },
  { id: 'f3', column: 'c-email', condition: 'isEmpty' },
];

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
    defaultFilters: { value: SAVED },
  },
});

beforeEach(widget.setup);
afterEach(widget.teardown);

const q = (dataCy) => document.querySelector(`[data-cy="${dataCy}"]`);
const shownNames = () => (widget.exposed().filteredData ?? []).map((row) => row.name);
const emailChipInput = () => screen.queryByRole('textbox', { name: 'Email contains value' });

async function renderTable(beforeOpen) {
  widget.render({ currentMode: 'view' });
  await waitFor(() => expect(widget.exposed().currentData?.length).toBe(3));
  if (beforeOpen) await beforeOpen();
}

const USER_EMAIL = [{ column: 'Email', condition: 'contains', value: 'x.com' }];

describe('Table-FILTERUI-071 a filter the user added is a chip in the header', () => {
  test('Table-FILTERUI-071 it shows after the builder chips, with its column, operator and value', async () => {
    // Break this catches: the quick view in the header leaving out what the user filtered by.
    await renderTable(() => widget.act('setFilters', USER_EMAIL));

    await waitFor(() => expect(emailChipInput()).not.toBeNull());
    expect(emailChipInput()).toHaveValue('x.com');
    expect(q('table1-filter-chip-3')).toContainElement(emailChipInput());
    // the builder chips are where they were
    expect(q('table1-filter-chip-0')).toContainElement(screen.getByRole('textbox', { name: 'Name contains value' }));
  });

  test('Table-FILTERUI-071 a filter that is a builder chip is not drawn a second time', async () => {
    // Break this catches: one filter showing as a builder chip and again as a user chip.
    await renderTable(() => widget.act('setFilters', [{ column: 'Name', condition: 'contains', value: 'Ja' }]));

    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Name contains value' })).toHaveValue('Ja'));
    expect(screen.getAllByRole('textbox', { name: 'Name contains value' })).toHaveLength(1);
    expect(q('table1-filter-chip-3')).toBeNull();
  });

  test('Table-FILTERUI-071 typing in it changes that filter in place and the rows follow', async () => {
    // Break this catches: a user chip that looks editable but does nothing, or one that adds a second filter.
    await renderTable(() => widget.act('setFilters', USER_EMAIL));
    await waitFor(() => expect(emailChipInput()).not.toBeNull());

    await widget.session.user.type(emailChipInput(), 'x');

    await waitFor(() =>
      expect(widget.exposed().filters).toEqual([{ column: 'Email', condition: 'contains', value: 'x.comx' }])
    );
    expect(shownNames()).toEqual([]);
  });

  test('Table-FILTERUI-071 the cross removes the filter, and the chip goes with it', async () => {
    // Break this catches: a user chip that stays after its filter is gone, as a builder chip would.
    await renderTable(() => widget.act('setFilters', USER_EMAIL));
    await waitFor(() => expect(emailChipInput()).not.toBeNull());

    await widget.session.user.click(screen.getByRole('button', { name: 'Clear Email filter' }));

    await waitFor(() => expect(widget.exposed().filters).toEqual([]));
    expect(emailChipInput()).toBeNull();
    expect(q('table1-filter-chip-3')).toBeNull();
    expect(shownNames()).toEqual(['Jane', 'Bob', 'Jamal']);
  });

  test('Table-FILTERUI-071 a filter picked from a list is edited from a list', async () => {
    // Break this catches: a select column's user filter turning into a free text box.
    await renderTable(() => widget.act('setFilters', [{ column: 'Status', condition: 'ne', value: 'active' }]));

    const chip = await screen.findByRole('button', { name: 'Status does not equal value' });
    expect(chip).toHaveTextContent('Active');
    await widget.session.user.click(chip);
    await widget.session.user.click(screen.getByRole('option', { name: 'Invited' }));

    await waitFor(() =>
      expect(widget.exposed().filters).toEqual([{ column: 'Status', condition: 'ne', value: 'invited' }])
    );
  });
});

describe('Table-FILTERUI-072 hovering text that is cut off shows all of it', () => {
  // jsdom lays nothing out: once the chips are drawn, every box reports 200px of text in 50px
  let scrollWidth;
  let clientWidth;
  const clipEverything = () => {
    scrollWidth = jest.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(200);
    clientWidth = jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(50);
  };
  afterEach(() => {
    scrollWidth?.mockRestore();
    clientWidth?.mockRestore();
  });

  const openPanel = async () => {
    await renderTable(() => widget.act('setFilters', [{ column: 'Email', condition: 'doesNotContains', value: 'a' }]));
    await waitFor(() => expect(q('table1-filter-button')).not.toBeNull());
    await widget.session.user.click(q('table1-filter-button'));
    await waitFor(() => expect(q('select-operation-dropdown-0')).not.toBeNull());
    clipEverything();
  };

  test('Table-FILTERUI-072 the operator chosen in a panel row', async () => {
    // Break this catches: "does ..." in the panel with no way to read the operator.
    await openPanel();

    // the pointer lands on the search input that sits over the value, so the box holding both shows the title
    const box = q('select-operation-dropdown-0').querySelector('.react-select__value-container');
    await widget.session.user.hover(box);

    expect(box).toHaveAttribute('title', 'does not contains');
  });

  test('Table-FILTERUI-072 the column chosen in a panel row', async () => {
    // Break this catches: a long column name cut off in the panel with no tooltip.
    await openPanel();

    // the pointer lands on the search input that sits over the value, so the box holding both shows the title
    const box = q('select-column-dropdown-0').querySelector('.react-select__value-container');
    await widget.session.user.hover(box);

    expect(box).toHaveAttribute('title', 'Email');
  });

  test('Table-FILTERUI-072 the column and operator of a quick row', async () => {
    // Break this catches: the read-only cells of a quick row cutting text off silently.
    await openPanel();

    const cell = q('quick-filter-column-0');
    await widget.session.user.hover(cell);

    expect(cell).toHaveAttribute('title', 'Name');
  });

  test('Table-FILTERUI-072 the value of a picked chip in the header', async () => {
    // Break this catches: a long option label on a chip with no way to read it.
    await renderTable();

    const chip = await screen.findByRole('button', { name: 'Status equals value' });
    clipEverything();
    const label = chip.querySelector('span');
    await widget.session.user.hover(label);

    expect(label).toHaveAttribute('title', 'Select');
  });

  test('Table-FILTERUI-072 a typed value in a chip', async () => {
    // Break this catches: a long typed value cut off in a chip with no tooltip.
    await renderTable(() => widget.act('setFilters', USER_EMAIL));
    await waitFor(() => expect(emailChipInput()).not.toBeNull());
    clipEverything();

    await widget.session.user.hover(emailChipInput());

    expect(emailChipInput()).toHaveAttribute('title', 'x.com');
  });
});
