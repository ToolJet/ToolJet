/**
 * In the filters panel the value of a filter is entered the way the column is: picked from the column's options
 * (select, multi-select, tags, boolean), from a date (and time) picker, or with the column's rating icons.
 * What is stored stays today's string, so the rows are filtered by the same rules.
 */
import { screen, waitFor, within } from '@testing-library/react';
import { createWidgetHarness, binding } from '../../../__tests__/integration/widgetHarness';

const OPTIONS = [
  { label: 'Design', value: 'design' },
  { label: 'Sales', value: 'sales' },
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
      "{{[{ id: 1, name: 'Jane', team: 'design', tags: 'design', joined: '10/01/2024', score: 2 }, { id: 2, name: 'Bob', team: 'sales', tags: 'sales', joined: '20/02/2024', score: 4 }]}}"
    ),
    columns: {
      value: [
        { id: 'c-name', name: 'Name', key: 'name', columnType: 'string' },
        { id: 'c-team', name: 'Team', key: 'team', columnType: 'select', options: OPTIONS },
        { id: 'c-multi', name: 'Skills', key: 'skills', columnType: 'newMultiSelect', options: OPTIONS },
        { id: 'c-tags', name: 'Tags', key: 'tags', columnType: 'tagsV2', options: OPTIONS },
        {
          id: 'c-joined',
          name: 'Joined',
          key: 'joined',
          columnType: 'datepicker',
          dateFormat: 'DD/MM/YYYY',
          parseDateFormat: 'DD/MM/YYYY',
        },
        {
          id: 'c-seen',
          name: 'Seen',
          key: 'seen',
          columnType: 'datepicker',
          dateFormat: 'DD/MM/YYYY',
          parseDateFormat: 'DD/MM/YYYY',
          isTimeChecked: '{{true}}',
        },
        { id: 'c-score', name: 'Score', key: 'score', columnType: 'rating', maxRating: 7 },
      ],
    },
    autogenerateColumns: binding(false),
    defaultFilters: { value: [] },
  },
});

beforeEach(widget.setup);
afterEach(widget.teardown);

const q = (dataCy) => document.querySelector(`[data-cy="${dataCy}"]`);

async function openPanel(filters, properties = {}) {
  widget.render({ currentMode: 'view', properties });
  await waitFor(() => expect(widget.exposed().currentData?.length).toBe(2));
  await widget.act('setFilters', filters);
  await waitFor(() => expect(q('table1-filter-button')).not.toBeNull());
  await widget.session.user.click(q('table1-filter-button'));
  await waitFor(() => expect(q('table1-filter-panel')).not.toBeNull());
}

describe('Table-FILTERUI-073 select, multi-select, tags and boolean values are picked from a list', () => {
  test('Table-FILTERUI-073 "equals" on a select column offers its options one at a time and applies the pick', async () => {
    // Break this catches: a typed text box where the column only has a fixed set of values.
    await openPanel([{ column: 'Team', condition: 'equals', value: 'design' }]);

    const picker = q('filter-value-input-0');
    expect(picker.tagName).toBe('BUTTON');
    expect(picker).toHaveTextContent('Design');

    await widget.session.user.click(picker);
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Design', 'Sales']);
    await widget.session.user.click(screen.getByRole('option', { name: 'Sales' }));

    await waitFor(() =>
      expect(widget.exposed().filters).toEqual([{ column: 'Team', condition: 'equals', value: 'sales' }])
    );
    expect(q('filter-value-input-0')).toHaveTextContent('Sales');
  });

  test.each([
    ['select', 'Team'],
    ['multi-select', 'Skills'],
    ['tags', 'Tags'],
  ])('Table-FILTERUI-073 "contains" on a %s column takes several options, kept as a list', async (_, column) => {
    // Break this catches: "contains" on an option column allowing one pick, or storing the picks as one text.
    await openPanel([{ column, condition: 'contains', value: 'design' }]);

    const picker = q('filter-value-input-0');
    expect(picker).toHaveTextContent('Design');
    expect(picker).not.toHaveTextContent('+');

    await widget.session.user.click(picker);
    expect(screen.getAllByRole('option').map((option) => option.getAttribute('aria-selected'))).toEqual([
      'true',
      'false',
    ]);
    await widget.session.user.click(screen.getByRole('option', { name: 'Sales' }));

    await waitFor(() =>
      expect(widget.exposed().filters).toEqual([{ column, condition: 'contains', value: ['design', 'sales'] }])
    );
    // the list stays open for more picks, and the field says how many beyond the first
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(q('filter-value-input-0')).toHaveTextContent('Design +1');

    await widget.session.user.click(screen.getByRole('option', { name: 'Design' }));
    await waitFor(() =>
      expect(widget.exposed().filters).toEqual([{ column, condition: 'contains', value: ['sales'] }])
    );
  });

  test('Table-FILTERUI-073 unticking the last option takes the filter off', async () => {
    // Break this catches: an empty list left applied, hiding every row.
    await openPanel([{ column: 'Team', condition: 'contains', value: ['design'] }]);

    await widget.session.user.click(q('filter-value-input-0'));
    await widget.session.user.click(screen.getByRole('option', { name: 'Design' }));

    await waitFor(() => expect(widget.exposed().filters).toEqual([]));
  });

  test('Table-FILTERUI-073 the rows shown are those with any of the picked options', async () => {
    // Break this catches: the picks looking right in the panel but not reaching the rows.
    await openPanel([{ column: 'Team', condition: 'contains', value: ['design', 'sales'] }]);

    await waitFor(() => expect(widget.exposed().filteredData).toHaveLength(2));
  });
});

describe('Table-FILTERUI-076 the header chip of an option column takes several options too', () => {
  test('Table-FILTERUI-076 shows the first option and how many more, and picks more from a list', async () => {
    // Break this catches: the header chip showing only one option, or the raw list.
    widget.render({ currentMode: 'view' });
    await waitFor(() => expect(widget.exposed().currentData?.length).toBe(2));
    await widget.act('setFilters', [{ column: 'Team', condition: 'contains', value: ['design', 'sales'] }]);

    const chip = await screen.findByRole('button', { name: 'Team contains value' });
    expect(chip).toHaveTextContent('Design +1');

    await widget.session.user.click(chip);
    await widget.session.user.click(screen.getByRole('option', { name: 'Sales' }));

    await waitFor(() =>
      expect(widget.exposed().filters).toEqual([{ column: 'Team', condition: 'contains', value: ['design'] }])
    );
  });
});

describe('Table-FILTERUI-074 a date column gets a date picker', () => {
  test("Table-FILTERUI-074 the field shows the saved date in the column's format with a calendar to pick another", async () => {
    // Break this catches: a date typed by hand as plain text, with no calendar.
    await openPanel([{ column: 'Joined', condition: 'gt', value: '10/01/2024' }]);

    const field = within(q('filter-row-0')).getByDisplayValue('10/01/2024');
    expect(q('filter-value-input-0')).not.toBeNull();

    await widget.session.user.click(field);
    const day = await waitFor(() => {
      const found = [
        ...document.querySelectorAll('.react-datepicker__day:not(.react-datepicker__day--outside-month)'),
      ].find((element) => element.textContent === '15');
      expect(found).toBeTruthy();
      return found;
    });
    await widget.session.user.click(day);

    await waitFor(() =>
      expect(widget.exposed().filters).toEqual([{ column: 'Joined', condition: 'gt', value: '15/01/2024' }])
    );
  });

  test('Table-FILTERUI-074 a column with a time gets the time list beside the calendar', async () => {
    // Break this catches: a "date and time" column that can only pick a day.
    await openPanel([{ column: 'Seen', condition: 'gt', value: '10/01/2024 09:00 AM' }]);

    await widget.session.user.click(within(q('filter-row-0')).getByDisplayValue('10/01/2024 9:00 AM'));

    await waitFor(() => expect(document.querySelector('.react-datepicker__time-list')).not.toBeNull());
  });

  test('Table-FILTERUI-074 an empty date field says the format it takes', async () => {
    // Break this catches: an empty date field with no hint of the format.
    await openPanel([{ column: 'Joined', condition: 'gt', value: '10/01/2024' }]);
    await widget.session.user.click(q('button-add-filter'));
    await widget.session.user.click(q('select-column-dropdown-1').querySelector('input'));
    const menu = await waitFor(() => {
      const found = document.querySelector('.react-select__menu');
      expect(found).not.toBeNull();
      return found;
    });
    await widget.session.user.click(within(menu).getByText('Joined'));

    await waitFor(() => expect(q('filter-row-1').querySelector('input[placeholder="dd/mm/yyyy"]')).not.toBeNull());
  });
});

describe('Table-FILTERUI-075 a rating column gets its rating icons', () => {
  test('Table-FILTERUI-075 as many icons as the column allows, the saved rating filled, a click sets the rating', async () => {
    // Break this catches: a text box for a rating, or five icons on a column set to seven.
    await openPanel([{ column: 'Score', condition: 'gte', value: '2' }]);

    const group = within(q('filter-row-0')).getByRole('radiogroup');
    expect(group).toHaveAccessibleName('Rating widget, stars from 1 to 7');
    const icons = within(group).getAllByRole('radio');
    expect(icons).toHaveLength(7);
    expect(icons.filter((icon) => icon.getAttribute('aria-checked') === 'true')).toHaveLength(2);

    await widget.session.user.click(icons[3]);

    await waitFor(() => expect(widget.exposed().filters).toEqual([{ column: 'Score', condition: 'gte', value: '4' }]));
    expect(
      within(q('filter-row-0'))
        .getAllByRole('radio')
        .filter((icon) => icon.getAttribute('aria-checked') === 'true')
    ).toHaveLength(4);
  });

  test('Table-FILTERUI-075 a builder filter on a rating column is rated in its quick row', async () => {
    // Break this catches: the quick row of a rating filter still being a text box.
    await openPanel([], { defaultFilters: { value: [{ id: 'f1', column: 'c-score', condition: 'gte', value: '' }] } });

    const group = within(q('quick-filter-row-0')).getByRole('radiogroup');
    // a column default rating is not a filter: nothing is filled until the user picks
    expect(
      within(group)
        .getAllByRole('radio')
        .filter((icon) => icon.getAttribute('aria-checked') === 'true')
    ).toHaveLength(0);

    await widget.session.user.click(within(group).getAllByRole('radio')[2]);

    await waitFor(() => expect(widget.exposed().filters).toEqual([{ column: 'Score', condition: 'gte', value: '3' }]));
  });
});
