/**
 * The filters panel of a real Table has two sections: "Quick filters" (the filters the builder saved: column and
 * operator read-only, value editable, the cross clears the value) and "Your filters" (the rows the user adds).
 * What is applied stays what the existing filtering rules say; only where it is edited changes.
 */
import { screen, waitFor, within } from '@testing-library/react';
import { createWidgetHarness, binding, countInvocationsOn, store } from '../../../__tests__/integration/widgetHarness';
import useTableStore from '../../_stores/tableStore';

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
        { id: 'c-id', name: 'Id', key: 'id', columnType: 'number' },
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
const panel = () => q('table1-filter-panel');
const savedFilters = () => useTableStore.getState().getTableProperties('t1')?.defaultFilters;
const shownNames = () => (widget.exposed().filteredData ?? []).map((row) => row.name);
const headerChipInput = (index) => document.querySelector(`[data-cy="table1-filter-chip-${index}"] input`);

// `beforeOpen` sets the table up (filters from outside the panel) before the panel is opened
async function openPanel(properties = {}, beforeOpen) {
  widget.render({ currentMode: 'view', properties });
  await waitFor(() => expect(widget.exposed().currentData?.length).toBe(3));
  if (beforeOpen) await beforeOpen();
  await waitFor(() => expect(q('table1-filter-button')).not.toBeNull());
  await widget.session.user.click(q('table1-filter-button'));
  await waitFor(() => expect(panel()).not.toBeNull());
}

describe('Table-FILTERUI-055 the panel lists the builder filters under "Quick filters"', () => {
  test('Table-FILTERUI-055 one row per builder filter, with column and operator as plain text and a value to edit', async () => {
    // Break this catches: builder filters mixed in with the user's rows, or their column and operator left editable.
    await openPanel();

    expect(q('filter-section-quick')).toHaveTextContent('Quick filters');
    [0, 1, 2].forEach((index) => expect(q(`quick-filter-row-${index}`)).not.toBeNull());
    expect(q('quick-filter-row-3')).toBeNull();

    expect(q('quick-filter-column-0')).toHaveTextContent('Name');
    expect(q('quick-filter-operator-0')).toHaveTextContent('contains');
    expect(q('quick-filter-column-0').querySelector('input, button, select')).toBeNull();
    expect(q('quick-filter-operator-0').querySelector('input, button, select')).toBeNull();

    const nameValue = q('quick-filter-value-0');
    expect(nameValue.tagName).toBe('INPUT');
    expect(nameValue).toHaveValue('');
    expect(nameValue).toHaveAttribute('placeholder', 'Enter text');
    // an option column takes its value from a list
    expect(q('quick-filter-value-1')).toHaveTextContent('Select');
  });

  test('Table-FILTERUI-055 the user\'s own filters are under "Your filters", not among the quick ones', async () => {
    // Break this catches: a filter the user added showing up as a read-only builder row.
    await openPanel({}, () => widget.act('setFilters', [{ column: 'Id', condition: 'equals', value: '2' }]));

    await waitFor(() => expect(q('filter-section-yours')).toHaveTextContent('Your filters'));
    expect(q('select-column-dropdown-0')).not.toBeNull();
    expect(q('filter-value-input-0')).toHaveValue('2');
    expect(q('select-column-dropdown-1')).toBeNull();
    expect(q('quick-filter-row-3')).toBeNull();
  });

  test('Table-FILTERUI-055 a panel with no builder filters has no sections, as before', async () => {
    // Characterization: Break this catches: headings and an empty "Quick filters" section where there is nothing quick.
    await openPanel({ defaultFilters: { value: [] } });

    expect(q('filter-section-quick')).toBeNull();
    expect(q('filter-section-yours')).toBeNull();
    expect(q('no-filters-yet-label')).not.toBeNull();
  });

  test('Table-FILTERUI-055 with builder filters but none of the user\'s, "Your filters" says there are none', async () => {
    // Break this catches: a "Your filters" heading with nothing under it.
    await openPanel();

    expect(q('filter-section-yours')).toHaveTextContent('Your filters');
    expect(q('no-filters-yet-label')).not.toBeNull();
  });

  test('Table-FILTERUI-055 a builder value that is already applied is shown in its row', async () => {
    // Break this catches: the panel opening with an empty value box for a filter that is filtering the table.
    await openPanel({
      defaultFilters: { value: [{ id: 'f1', column: 'c-name', condition: 'contains', value: 'Ja' }] },
    });

    expect(q('quick-filter-value-0')).toHaveValue('Ja');
    expect(q('quick-filter-clear-0')).not.toBeNull();
  });
});

describe('Table-FILTERUI-056 editing a quick filter in the panel', () => {
  test('Table-FILTERUI-056 typing a value applies the filter, and the chip in the header shows it', async () => {
    // Break this catches: a value box that looks editable but never reaches the table.
    await openPanel();
    await waitFor(() => expect(shownNames()).toEqual(['Bob']));

    await widget.session.user.type(q('quick-filter-value-0'), 'Bo');

    await waitFor(() =>
      expect(widget.exposed().filters).toContainEqual({ column: 'Name', condition: 'contains', value: 'Bo' })
    );
    expect(shownNames()).toEqual(['Bob']);
    expect(headerChipInput(0)).toHaveValue('Bo');
    expect(savedFilters()).toEqual(SAVED);
  });

  test('Table-FILTERUI-056 the cross clears the value and keeps the row', async () => {
    // Break this catches: the cross deleting a builder filter, which the user cannot do.
    await openPanel({
      defaultFilters: {
        value: [
          { id: 'f1', column: 'c-name', condition: 'contains', value: 'Ja' },
          { id: 'f3', column: 'c-email', condition: 'isEmpty' },
        ],
      },
    });
    await waitFor(() => expect(widget.exposed().filters).toHaveLength(2));

    await widget.session.user.click(q('quick-filter-clear-0'));

    expect(q('quick-filter-row-0')).not.toBeNull();
    expect(q('quick-filter-value-0')).toHaveValue('');
    expect(q('quick-filter-clear-0')).toBeNull();
    await waitFor(() => expect(widget.exposed().filters.map(({ column }) => column)).toEqual(['Email']));
    expect(savedFilters()).toHaveLength(2);
  });

  test("Table-FILTERUI-056 an option row picks its value from the column's options", async () => {
    // Break this catches: a free-text box for a select column, where only the listed options are valid.
    await openPanel();

    await widget.session.user.click(q('quick-filter-value-1'));
    await widget.session.user.click(await screen.findByRole('option', { name: 'Invited' }));

    await waitFor(() =>
      expect(widget.exposed().filters).toContainEqual({ column: 'Status', condition: 'equals', value: 'invited' })
    );
    expect(q('quick-filter-value-1')).toHaveTextContent('Invited');
  });

  test('Table-FILTERUI-056 a row whose operator takes no value is a switch that turns the filter on and off', async () => {
    // Break this catches: "is empty" showing an empty value box, or no way to switch it off.
    await openPanel();
    const toggle = q('quick-filter-switch-2');
    expect(toggle).toHaveAttribute('role', 'switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(q('quick-filter-value-2')).toBeNull();

    await widget.session.user.click(toggle);

    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await waitFor(() => expect(widget.exposed().filters).toEqual([]));

    await widget.session.user.click(toggle);

    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await waitFor(() => expect(widget.exposed().filters.map(({ column }) => column)).toEqual(['Email']));
  });

  test('Table-FILTERUI-056 typing in a quick row does not move it into "Your filters"', async () => {
    // Break this catches: a row jumping sections, and losing focus, as soon as its text makes it a complete filter.
    await openPanel();

    await widget.session.user.type(q('quick-filter-value-0'), 'Jam');

    expect(q('quick-filter-row-0')).not.toBeNull();
    expect(q('quick-filter-value-0')).toHaveValue('Jam');
    expect(q('select-column-dropdown-0')).toBeNull();
    expect(q('no-filters-yet-label')).not.toBeNull();
  });
});

describe('Table-FILTERUI-057 "Your filters"', () => {
  test('Table-FILTERUI-057 Add filter adds a row under "Your filters", leaving the quick rows alone', async () => {
    // Break this catches: Add filter adding to the builder's rows.
    await openPanel();

    await widget.session.user.click(q('button-add-filter'));

    expect(q('select-column-dropdown-0')).not.toBeNull();
    expect(q('filter-value-input-0')).not.toBeNull();
    expect(q('no-filters-yet-label')).toBeNull();
    expect(q('quick-filter-row-3')).toBeNull();
    // the quick section sits above the user's
    expect(
      q('filter-section-quick').compareDocumentPosition(q('filter-section-yours')) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  test('Table-FILTERUI-057 a user row typed to match a builder filter stays a user row', async () => {
    // Break this catches: the row jumping into "Quick filters" the moment it matches a builder column and operator.
    await openPanel({}, () => widget.act('setFilters', [{ column: 'Id', condition: 'equals', value: '2' }]));
    await waitFor(() => expect(q('select-column-dropdown-0')).not.toBeNull());

    const columnSelect = within(q('select-column-dropdown-0')).getByRole('combobox');
    await widget.session.user.click(columnSelect);
    await widget.session.user.type(columnSelect, 'Name{Enter}');
    await widget.session.user.click(within(q('select-operation-dropdown-0')).getByRole('combobox'));
    await widget.session.user.type(within(q('select-operation-dropdown-0')).getByRole('combobox'), 'contains{Enter}');
    await widget.session.user.clear(q('filter-value-input-0'));
    await widget.session.user.type(q('filter-value-input-0'), 'J');

    expect(q('filter-value-input-0')).toHaveValue('J');
    expect(q('select-column-dropdown-0')).not.toBeNull();
    expect(q('quick-filter-value-0')).toHaveValue('');
  });

  test('Table-FILTERUI-057 Clear all filters clears the quick values (the rows stay) and removes the user rows', async () => {
    // Break this catches: clearing deleting builder rows, or leaving the user's rows behind.
    await openPanel({}, () =>
      widget.act('setFilters', [
        { column: 'Name', condition: 'contains', value: 'Ja' },
        { column: 'Id', condition: 'equals', value: '1' },
      ])
    );
    await waitFor(() => expect(q('select-column-dropdown-0')).not.toBeNull());
    expect(q('quick-filter-value-0')).toHaveValue('Ja');

    await widget.session.user.click(q('button-clear-filters'));

    expect(q('select-column-dropdown-0')).toBeNull();
    [0, 1, 2].forEach((index) => expect(q(`quick-filter-row-${index}`)).not.toBeNull());
    expect(q('quick-filter-value-0')).toHaveValue('');
    await waitFor(() => expect(widget.exposed().filters).toEqual([]));
    expect(savedFilters()).toEqual(SAVED);
  });
});

describe('Table-FILTERUI-058 how the panel closes', () => {
  test('Table-FILTERUI-058 Escape closes the panel and keeps what is applied', async () => {
    // Break this catches: a panel that can only be closed with the mouse.
    await openPanel();
    await widget.session.user.type(q('quick-filter-value-0'), 'Bo');
    await waitFor(() => expect(widget.exposed().filters).toContainEqual(expect.objectContaining({ value: 'Bo' })));

    await widget.session.user.keyboard('{Escape}');

    expect(panel()).toBeNull();
    expect(widget.exposed().filters).toContainEqual(expect.objectContaining({ value: 'Bo' }));
  });

  test('Table-FILTERUI-058 a row added but not filled in is dropped when the panel closes', async () => {
    // Break this catches: an empty draft row coming back the next time the panel is opened.
    await openPanel();
    await widget.session.user.click(q('button-add-filter'));
    expect(q('select-column-dropdown-0')).not.toBeNull();

    await widget.session.user.click(q('close-filters-button'));
    await widget.session.user.click(q('table1-filter-button'));
    await waitFor(() => expect(panel()).not.toBeNull());

    expect(q('select-column-dropdown-0')).toBeNull();
  });

  test('Table-FILTERUI-058 a value typed in the panel is in the quick row when the panel is opened again', async () => {
    // Break this catches: the panel forgetting what it applied.
    await openPanel();
    await widget.session.user.type(q('quick-filter-value-0'), 'Bo');
    await waitFor(() => expect(widget.exposed().filters).toContainEqual(expect.objectContaining({ value: 'Bo' })));
    await widget.session.user.click(q('close-filters-button'));

    await widget.session.user.click(q('table1-filter-button'));
    await waitFor(() => expect(panel()).not.toBeNull());

    expect(q('quick-filter-value-0')).toHaveValue('Bo');
  });
});

describe('Table-FILTERUI-059 the connector between rows follows Match', () => {
  test('Table-FILTERUI-059 rows are joined by "and" by default and by "or" when the builder chose Any', async () => {
    // Break this catches: "and" between rows that are being combined with "or".
    await openPanel({}, () => widget.act('setFilters', [{ column: 'Id', condition: 'equals', value: '2' }]));
    await waitFor(() => expect(q('select-column-dropdown-0')).not.toBeNull());

    expect(q('quick-filter-connector-0')).toHaveTextContent('where');
    expect(q('quick-filter-connector-1')).toHaveTextContent('and');
    expect(q('quick-filter-connector-2')).toHaveTextContent('and');
    // the user's first row joins the quick ones
    expect(q('filter-row-0')).toHaveTextContent('and');
  });

  test('Table-FILTERUI-059 Any shows "or"', async () => {
    // Break this catches: the connector label ignoring the Match setting.
    await openPanel({ filterMatch: { value: 'or' } });

    expect(q('quick-filter-connector-0')).toHaveTextContent('where');
    expect(q('quick-filter-connector-1')).toHaveTextContent('or');
    expect(q('quick-filter-connector-2')).toHaveTextContent('or');
  });
});

describe('Table-FILTERUI-060 the panel only changes the filters when something is changed in it', () => {
  test('Table-FILTERUI-060 opening it, with builder and user filters applied, does not run the filter handlers', async () => {
    // Break this catches: the panel re-applying the filters as it opens (marks of its own on them make them differ),
    // which would run the app's onFilterChanged queries every time the panel is looked at.
    widget.render({ currentMode: 'view', events: countInvocationsOn('t1', 'onFilterChanged') });
    await waitFor(() => expect(widget.exposed().currentData?.length).toBe(3));
    await widget.act('setFilters', [
      { column: 'Name', condition: 'contains', value: 'Ja' },
      { column: 'Id', condition: 'equals', value: '1' },
    ]);
    await waitFor(() => expect(store().getVariable('calls', 'canvas')).toBe(1));

    await widget.session.user.click(q('table1-filter-button'));
    await waitFor(() => expect(panel()).not.toBeNull());
    await new Promise((resolve) => setTimeout(resolve, 700));

    expect(q('quick-filter-value-0')).toHaveValue('Ja');
    expect(store().getVariable('calls', 'canvas')).toBe(1);
  });
});

const TWO_USER_ROWS = [
  { column: 'Id', condition: 'equals', value: '2' },
  { column: 'Id', condition: 'gt', value: '0' },
];

describe('Table-FILTERUI-061 the and/or choice in "Your filters"', () => {
  test("Table-FILTERUI-061 the first of the user's rows has an and/or select; the rows after it say the same in plain text", async () => {
    // Break this catches: no way for the user to change how the rows are joined, or a select on every row.
    await openPanel({}, () => widget.act('setFilters', TWO_USER_ROWS));
    await waitFor(() => expect(q('filter-row-1')).not.toBeNull());

    expect(document.querySelectorAll('[data-cy="filter-connector-select"]')).toHaveLength(1);
    expect(q('filter-row-0').contains(q('filter-connector-select'))).toBe(true);
    expect(q('filter-connector-select')).toHaveTextContent('and');
    expect(q('filter-row-1')).toHaveTextContent('and');
    expect(q('filter-row-1').querySelector('[data-cy="filter-connector-select"]')).toBeNull();
    // the quick rows keep plain text
    expect(q('quick-filter-row-1').querySelector('[data-cy="filter-connector-select"]')).toBeNull();
  });

  test('Table-FILTERUI-061 without quick filters the select is on the second row, the one that joins the first', async () => {
    // Break this catches: a select on a row that has nothing before it to join.
    await openPanel({ defaultFilters: { value: [] } }, () => widget.act('setFilters', TWO_USER_ROWS));
    await waitFor(() => expect(q('filter-row-1')).not.toBeNull());

    expect(q('filter-row-0').querySelector('[data-cy="filter-connector-select"]')).toBeNull();
    expect(q('filter-row-1').contains(q('filter-connector-select'))).toBe(true);
  });

  test('Table-FILTERUI-061 choosing "or" combines the rows with or, for this user only', async () => {
    // Break this catches: a select that changes only its own label, or one that rewrites what the builder saved.
    await openPanel(
      { defaultFilters: { value: [{ id: 'f1', column: 'c-name', condition: 'contains', value: 'Ja' }] } },
      () =>
        widget.act('setFilters', [
          { column: 'Name', condition: 'contains', value: 'Ja' },
          { column: 'Id', condition: 'equals', value: '2' },
        ])
    );
    await waitFor(() => expect(shownNames()).toEqual([]));

    await widget.session.user.click(q('filter-connector-select'));
    await widget.session.user.click(await screen.findByRole('option', { name: 'or' }));

    expect(q('filter-connector-select')).toHaveTextContent('or');
    await waitFor(() => expect(shownNames()).toEqual(['Jane', 'Bob', 'Jamal']));
    expect(useTableStore.getState().getTableProperties('t1')?.filterMatch).not.toBe('or');
    expect(savedFilters()).toHaveLength(1);
  });

  test('Table-FILTERUI-061 the choice is still there when the panel is opened again', async () => {
    // Break this catches: the choice living in the panel, and lost when it closes.
    await openPanel({}, () => widget.act('setFilters', TWO_USER_ROWS));
    await widget.session.user.click(q('filter-connector-select'));
    await widget.session.user.click(await screen.findByRole('option', { name: 'or' }));
    await widget.session.user.click(q('close-filters-button'));

    await widget.session.user.click(q('table1-filter-button'));
    await waitFor(() => expect(panel()).not.toBeNull());

    expect(q('filter-connector-select')).toHaveTextContent('or');
    expect(q('filter-row-1')).toHaveTextContent('or');
  });

  test("Table-FILTERUI-061 the builder changing Match takes the user's choice back", async () => {
    // Break this catches: a choice made in one session outliving the builder's own setting.
    await openPanel({}, () => widget.act('setFilters', TWO_USER_ROWS));
    await widget.session.user.click(q('filter-connector-select'));
    await widget.session.user.click(await screen.findByRole('option', { name: 'or' }));
    expect(q('filter-connector-select')).toHaveTextContent('or');

    // the builder tries Any, then settles on All: that is what everyone gets, whatever this user had picked
    widget.setComponentProperty('t1', 'filterMatch', 'or', 'properties');
    await waitFor(() => expect(q('filter-connector-select')).toHaveTextContent('or'));
    await widget.session.user.click(q('filter-connector-select'));
    await widget.session.user.click(await screen.findByRole('option', { name: 'and' }));
    await widget.session.user.click(q('filter-connector-select'));
    await widget.session.user.click(await screen.findByRole('option', { name: 'or' }));
    widget.setComponentProperty('t1', 'filterMatch', 'and', 'properties');

    await waitFor(() => expect(q('filter-connector-select')).toHaveTextContent('and'));
  });

  test("Table-FILTERUI-061 the select shows the builder's Match when it is Any", async () => {
    // Break this catches: a select that says "and" while the table is combining with "or".
    await openPanel({ filterMatch: { value: 'or' } }, () => widget.act('setFilters', TWO_USER_ROWS));

    expect(q('filter-connector-select')).toHaveTextContent('or');
  });

  test('Table-FILTERUI-061 with filtering done by the server there is no select, as the table does not combine the rows', async () => {
    // Break this catches: a control that does nothing.
    await openPanel({ serverSideFilter: { value: true } });
    await widget.session.user.click(q('button-add-filter'));

    expect(q('filter-row-0')).not.toBeNull();
    expect(q('filter-connector-select')).toBeNull();
    expect(q('filter-row-0')).toHaveTextContent('and');
  });
});

describe('Table-FILTERUI-062 clearing a builder filter from the panel', () => {
  test('Table-FILTERUI-062 a row switched on has a cross that switches it off and keeps the row', async () => {
    // Break this catches: no way to take an "is empty" builder filter off from the panel except its switch.
    await openPanel();
    expect(q('quick-filter-clear-2')).not.toBeNull();

    await widget.session.user.click(q('quick-filter-clear-2'));

    expect(q('quick-filter-row-2')).not.toBeNull();
    expect(q('quick-filter-switch-2')).toHaveAttribute('aria-checked', 'false');
    expect(q('quick-filter-clear-2')).toBeNull();
    await waitFor(() => expect(widget.exposed().filters).toEqual([]));
  });

  test('Table-FILTERUI-062 a row with nothing to clear has no cross', async () => {
    // Break this catches: a cross that does nothing.
    await openPanel();

    expect(q('quick-filter-clear-0')).toBeNull();
    expect(q('quick-filter-clear-1')).toBeNull();
  });
});

describe('Table-FILTERUI-063 Clear all filters and closing', () => {
  test('Table-FILTERUI-063 clearing and closing straight away still clears the table', async () => {
    // Break this catches: the clear waiting out the 500ms pause, and being dropped when the panel closes first.
    await openPanel({}, () =>
      widget.act('setFilters', [
        { column: 'Name', condition: 'contains', value: 'Ja' },
        { column: 'Id', condition: 'equals', value: '1' },
      ])
    );
    await waitFor(() => expect(widget.exposed().filters).toHaveLength(2));

    await widget.session.user.click(q('button-clear-filters'));
    // at once, not after the pause the typed values wait for
    await waitFor(() => expect(widget.exposed().filters).toEqual([]), { timeout: 250 });
    await widget.session.user.click(q('close-filters-button'));

    await waitFor(() => expect(widget.exposed().filters).toEqual([]));
    expect(shownNames()).toEqual(['Jane', 'Bob', 'Jamal']);
  });

  test('Table-FILTERUI-063 typing and closing straight away still applies what was typed', async () => {
    // Break this catches: a value typed just before closing being thrown away.
    await openPanel();

    await widget.session.user.type(q('quick-filter-value-0'), 'Bo');
    await widget.session.user.click(q('close-filters-button'));

    await waitFor(() =>
      expect(widget.exposed().filters).toContainEqual({ column: 'Name', condition: 'contains', value: 'Bo' })
    );
  });
});

describe('Table-FILTERUI-064 the panel is set in the same type as the table and spaced as designed', () => {
  test('Table-FILTERUI-064 the text in the rows and the footer is 14px, the section titles 12px', async () => {
    // Break this catches: connector labels and value boxes in the small browser default instead of the table's 14px.
    await openPanel({}, () => widget.act('setFilters', [{ column: 'Id', condition: 'equals', value: '2' }]));
    await waitFor(() => expect(q('filter-row-0')).not.toBeNull());

    ['quick-filter-connector-0', 'quick-filter-column-0', 'quick-filter-operator-0', 'quick-filter-value-0'].forEach(
      (dataCy) => expect(q(dataCy)).toHaveClass('tw-text-lg')
    );
    expect(q('filter-connector-select')).toHaveClass('tw-text-lg');
    expect(q('filter-value-input-0')).toHaveClass('tw-text-lg');
    expect(q('button-clear-filters')).toHaveClass('tw-text-lg');
    expect(q('button-add-filter')).toHaveClass('tw-text-lg');
    expect(q('filter-section-quick')).toHaveClass('tw-text-base');
    expect(q('filter-section-yours')).toHaveClass('tw-text-base');
    // the selects are react-select: what they draw is 14px too
    const chosen = within(q('select-column-dropdown-0')).getByText('Id');
    expect(window.getComputedStyle(chosen).fontSize).toBe('14px');
  });

  test('Table-FILTERUI-064 rows are a grid with 8px gaps, a 60px connector column and 36px controls', async () => {
    // Break this catches: the old 30px bootstrap gutters between the fields, or 32px controls.
    await openPanel({}, () => widget.act('setFilters', [{ column: 'Id', condition: 'equals', value: '2' }]));
    await waitFor(() => expect(q('filter-row-0')).not.toBeNull());

    [q('quick-filter-row-0'), q('filter-row-0')].forEach((row) => {
      expect(row).toHaveClass('tw-grid', 'tw-gap-2');
      expect(row.className).toContain('tw-grid-cols-[60px_');
    });
    expect(q('quick-filter-column-0')).toHaveClass('tw-h-9');
    expect(q('quick-filter-value-0')).toHaveClass('tw-h-9');
    expect(q('filter-value-input-0').parentElement).toHaveClass('tw-h-9');
  });

  test('Table-FILTERUI-064 the body and the footer have 16px padding and 32px buttons', async () => {
    // Break this catches: the old 20px body padding and 36px footer buttons.
    await openPanel();

    expect(panel().querySelector('.card-body').style.padding).toBe('16px');
    expect(panel().querySelector('.card-footer').style.padding).toBe('16px');
    expect(q('button-clear-filters')).toHaveClass('tw-h-8');
    expect(q('button-add-filter')).toHaveClass('tw-h-8');
  });

  test('Table-FILTERUI-064 the connector labels are grey and right-aligned over the 60px column', async () => {
    // Break this catches: "where" and "and" drawn left-aligned in the dark text colour.
    await openPanel();

    expect(q('quick-filter-connector-0')).toHaveClass('tw-text-right', 'tw-text-text-placeholder');
  });
});

describe('Table-FILTERUI-065 the panel title', () => {
  test('Table-FILTERUI-065 "Filters" is 16px, weight 500', async () => {
    // Break this catches: the title set in the 14px body size, no bigger than the rows under it.
    await openPanel();

    expect(q('filter-header')).toHaveClass('tw-text-xl', 'tw-font-medium');
    expect(q('filter-header').className).not.toContain('tw-text-lg');
  });
});
