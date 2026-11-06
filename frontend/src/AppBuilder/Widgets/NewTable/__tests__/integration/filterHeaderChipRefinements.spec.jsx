/**
 * Header chips for date and rating columns, a darker chip for the filters the user added, titles in the
 * "+N more" menu, a header too narrow for the "+N more" word, and a plain and / or list in the filters panel.
 */
import { screen, waitFor, within } from '@testing-library/react';
import { createWidgetHarness, binding } from '../../../__tests__/integration/widgetHarness';

const CHIP_WIDTH = 120;
const MORE_WIDTH = 60;
const MORE_COMPACT_WIDTH = 30;
let rowWidth = 900;

const widget = createWidgetHarness({
  componentType: 'Table',
  handle: 'table1',
  id: 't1',
  widgetHeight: 460,
  widgetWidth: 900,
  capabilities: { dnd: true },
  defaultProperties: {
    data: binding("{{[{ id: 1, name: 'Jane', email: 'j@x.com', joined: '10/01/2024', score: 2 }]}}"),
    columns: {
      value: [
        { id: 'c-name', name: 'Name', key: 'name', columnType: 'string' },
        { id: 'c-email', name: 'Email', key: 'email', columnType: 'string' },
        {
          id: 'c-joined',
          name: 'Joined',
          key: 'joined',
          columnType: 'datepicker',
          dateFormat: 'DD/MM/YYYY',
          parseDateFormat: 'DD/MM/YYYY',
        },
        { id: 'c-score', name: 'Score', key: 'score', columnType: 'rating', maxRating: 5 },
      ],
    },
    autogenerateColumns: binding(false),
    defaultFilters: {
      value: [
        { id: 'f1', column: 'c-name', condition: 'contains', value: '' },
        { id: 'f2', column: 'c-joined', condition: 'gt', value: '' },
        { id: 'f3', column: 'c-score', condition: 'gte', value: '' },
      ],
    },
  },
});

let restoreRect;
beforeEach(() => {
  const original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function () {
    const measure = this.dataset?.chipMeasure;
    let width = 0;
    if (measure === 'more') width = MORE_WIDTH;
    else if (measure === 'more-compact') width = MORE_COMPACT_WIDTH;
    else if (measure !== undefined) width = CHIP_WIDTH;
    else if (this.dataset?.cy === 'table1-filter-chips') width = rowWidth;
    return { ...original.call(this), width, right: width };
  };
  restoreRect = () => (Element.prototype.getBoundingClientRect = original);
  return widget.setup();
});
afterEach(() => {
  restoreRect();
  rowWidth = 900;
  widget.teardown();
});

const q = (dataCy) => document.querySelector(`[data-cy="${dataCy}"]`);
const moreChip = () => q('table1-filter-more-chip');

async function renderTable() {
  widget.render({ currentMode: 'view' });
  await waitFor(() => expect(widget.exposed().currentData?.length).toBe(1));
}

describe('Table-FILTERUI-081 date and rating chips in the header', () => {
  test('Table-FILTERUI-081 a date chip has the calendar icon, also while it has no value', async () => {
    // Break this catches: a date chip that is a plain text box with nothing to say it opens a calendar.
    await renderTable();

    const chip = q('table1-filter-chip-1');
    expect(chip.querySelector('[data-chip-part="date-icon"]')).not.toBeNull();
    expect(chip.querySelector('input')).toHaveAttribute('placeholder');
  });

  test('Table-FILTERUI-081 a rating chip shows the column rating icons and a click sets the filter', async () => {
    // Break this catches: a rating column's chip that has to be typed into, with no stars.
    await renderTable();

    const chip = q('table1-filter-chip-2');
    const icons = within(chip).getAllByRole('radio');
    expect(icons).toHaveLength(5);

    await widget.session.user.click(icons[2]);

    await waitFor(() => expect(widget.exposed().filters).toEqual([{ column: 'Score', condition: 'gte', value: '3' }]));
    expect(
      within(q('table1-filter-chip-2'))
        .getAllByRole('radio')
        .filter((icon) => icon.getAttribute('aria-checked') === 'true')
    ).toHaveLength(3);
  });
});

describe('Table-FILTERUI-082 a filter the user added is told apart from a builder one', () => {
  test('Table-FILTERUI-082 its chip has the darker background, a builder chip does not', async () => {
    // Break this catches: user and builder chips looking the same, so the user cannot tell which one the builder owns.
    await renderTable();
    await widget.act('setFilters', [
      { column: 'Name', condition: 'contains', value: 'Ja' },
      { column: 'Name', condition: 'contains', value: 'ne' },
    ]);

    await waitFor(() => expect(q('table1-filter-chip-3')).not.toBeNull());
    expect(q('table1-filter-chip-3')).toHaveClass('tw-bg-background-surface-layer-02');
    expect(q('table1-filter-chip-0')).not.toHaveClass('tw-bg-background-surface-layer-02');
  });
});

describe('Table-FILTERUI-083 the "+N more" menu has titles', () => {
  test('Table-FILTERUI-083 quick filters and your filters are listed under their own titles', async () => {
    // Break this catches: builder filters and the user's own mixed in one list in the menu.
    rowWidth = 130;
    await renderTable();
    await widget.act('setFilters', [{ column: 'Email', condition: 'contains', value: 'x' }]);
    await waitFor(() => expect(moreChip()).not.toBeNull());
    await widget.session.user.click(moreChip());

    await waitFor(() => expect(q('table1-filter-menu-title-quick')).toHaveTextContent('Quick filters'));
    expect(q('table1-filter-menu-title-yours')).toHaveTextContent('Your filters');
    expect(q('table1-filter-menu-section-quick')).toContainElement(screen.getByRole('radiogroup'));
    expect(q('table1-filter-menu-section-yours')).toContainElement(
      screen.getByRole('textbox', { name: 'Email contains value' })
    );
  });

  test('Table-FILTERUI-083 a title is only there when its group has chips in the menu', async () => {
    // Break this catches: an empty "Your filters" title when the user has added nothing.
    rowWidth = 130;
    await renderTable();
    await waitFor(() => expect(moreChip()).not.toBeNull());
    await widget.session.user.click(moreChip());

    await waitFor(() => expect(q('table1-filter-menu-title-quick')).not.toBeNull());
    expect(q('table1-filter-menu-title-yours')).toBeNull();
  });
});

describe('Table-FILTERUI-084 a header too narrow for the "+N more" word', () => {
  test('Table-FILTERUI-084 the more chip is only the count', async () => {
    // Break this catches: the more chip cut off at the edge of a narrow header.
    rowWidth = 50;
    await renderTable();

    await waitFor(() => expect(moreChip()).toHaveTextContent('+3'));
    expect(moreChip()).not.toHaveTextContent('more');
  });

  test('Table-FILTERUI-084 narrower than the count itself, the more chip is not shown at all', async () => {
    // Break this catches: a "+N" chip left cut off by the search box when the header has no room for it.
    rowWidth = MORE_COMPACT_WIDTH - 10;
    await renderTable();

    await waitFor(() => expect(q('table1-filter-chip-0')).toBeNull());
    expect(moreChip()).toBeNull();
  });
});

describe('Table-FILTERUI-085 the and / or list of the filters panel', () => {
  test('Table-FILTERUI-085 its options are not bold, also the chosen one', async () => {
    // Break this catches: the chosen option of the and / or list picked out in bold.
    await renderTable();
    await widget.act('setFilters', [
      { column: 'Name', condition: 'contains', value: 'a' },
      { column: 'Name', condition: 'contains', value: 'b' },
    ]);
    await widget.session.user.click(q('table1-filter-button'));
    await waitFor(() => expect(q('filter-connector-select')).not.toBeNull());
    await widget.session.user.click(q('filter-connector-select'));

    const option = await waitFor(() => {
      const found = q('filter-connector-option-and');
      expect(found).not.toBeNull();
      return found;
    });
    expect(option).toHaveAttribute('aria-selected', 'true');
    expect(option.className).not.toMatch(/font-medium|font-bold|font-semibold/);
  });
});

describe('Table-FILTERUI-086 scrollbars show on hover only', () => {
  const HOVER_ONLY = 'tw-scrollbar-on-hover';

  test('Table-FILTERUI-086 the filters panel body and its column list draw their scrollbar on hover', async () => {
    // Break this catches: a scrollbar that is always drawn in the filters panel and in its dropdowns.
    await renderTable();
    await widget.act('setFilters', [{ column: 'Email', condition: 'contains', value: 'a' }]);
    await widget.session.user.click(q('table1-filter-button'));
    await waitFor(() => expect(q('table1-filter-panel')).not.toBeNull());

    expect(q('table1-filter-panel').querySelector('.card-body')).toHaveClass(HOVER_ONLY);

    await widget.session.user.click(within(q('select-column-dropdown-0')).getByRole('combobox'));
    await waitFor(() => expect(document.querySelector('.react-select__menu-list')).not.toBeNull());
    expect(document.querySelector('.react-select__menu-list')).toHaveClass(HOVER_ONLY);
  });
});
