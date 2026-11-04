/**
 * Chips that do not fit in the header collapse into a "+N more" chip; its menu lists the rest, each editable.
 * jsdom has no layout, so the widths of the chips and of their row are supplied.
 */
import { screen, waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '../../../__tests__/integration/widgetHarness';

const CHIP_WIDTH = 120;
const MORE_WIDTH = 60;
const ROW_WIDTH = 400;

const widget = createWidgetHarness({
  componentType: 'Table',
  handle: 'table1',
  id: 't1',
  widgetHeight: 460,
  widgetWidth: 900,
  capabilities: { dnd: true },
  defaultProperties: {
    data: binding("{{[{ id: 1, a: 'x', b: 'y', c: 'z', d: 'w' }]}}"),
    columns: {
      value: ['a', 'b', 'c', 'd'].map((key) => ({
        id: `c-${key}`,
        name: key.toUpperCase(),
        key,
        columnType: 'string',
      })),
    },
    autogenerateColumns: binding(false),
    defaultFilters: {
      value: ['a', 'b', 'c', 'd'].map((key) => ({
        id: `f-${key}`,
        column: `c-${key}`,
        condition: 'contains',
        value: '',
      })),
    },
  },
});

let restoreRect;
beforeEach(() => {
  const original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function () {
    const measure = this.dataset?.chipMeasure;
    const width =
      measure === 'more'
        ? MORE_WIDTH
        : measure !== undefined
          ? CHIP_WIDTH
          : this.dataset?.cy === 'table1-filter-chips'
            ? ROW_WIDTH
            : 0;
    return { ...original.call(this), width, right: width };
  };
  restoreRect = () => (Element.prototype.getBoundingClientRect = original);
  return widget.setup();
});
afterEach(() => {
  restoreRect();
  widget.teardown();
});

const visibleChips = () => [...document.querySelectorAll('[data-cy^="table1-filter-chip-"]')];
const moreChip = () => document.querySelector('[data-cy="table1-filter-more-chip"]');
const chipNames = () => visibleChips().map((chip) => chip.querySelector('input, button')?.getAttribute('aria-label'));

async function renderOverflowing() {
  widget.render({ currentMode: 'view' });
  await waitFor(() => expect(moreChip()).not.toBeNull());
}

describe('Table-FILTERUI-023 chips that do not fit', () => {
  test('Table-FILTERUI-023 collapse into "+N more", with as many chips as fit in front of it', async () => {
    // Break this catches: chips clipped with no sign that more exist.
    await renderOverflowing();

    // 400 wide, 68 kept for the more chip: two 120px chips (248) fit, a third (376) does not
    expect(visibleChips()).toHaveLength(2);
    expect(moreChip()).toHaveTextContent('+2 more');
  });

  test('Table-FILTERUI-023 the measuring copies are not offered as chips', async () => {
    // Break this catches: duplicate (hidden) chips being reachable by keyboard or screen reader.
    await renderOverflowing();

    document.querySelectorAll('[data-chip-measure]').forEach((copy) => {
      expect(copy.closest('[aria-hidden="true"]')).not.toBeNull();
    });
  });

  test('Table-FILTERUI-023 there is no "+N more" when everything fits', async () => {
    // Characterization: Break this catches: a "+0 more" chip, or a dropdown for nothing.
    widget.render({
      currentMode: 'view',
      properties: { defaultFilters: { value: [{ id: 'f-a', column: 'c-a', condition: 'contains', value: '' }] } },
    });
    await waitFor(() => expect(visibleChips()).toHaveLength(1));

    expect(moreChip()).toBeNull();
  });
});

describe('Table-FILTERUI-024 the "+N more" menu', () => {
  test('Table-FILTERUI-024 lists the hidden chips, each editable in place', async () => {
    // Break this catches: filters that exist but can never be reached once the header is full.
    await renderOverflowing();
    await widget.session.user.click(moreChip());

    const hiddenInput = await screen.findByRole('textbox', { name: 'C contains value' });
    // the chips in the menu are not chips of the header
    expect(visibleChips()).toHaveLength(2);
    expect(screen.getByRole('textbox', { name: 'D contains value' })).toBeInTheDocument();

    await widget.session.user.type(hiddenInput, 'z');

    await waitFor(() => expect(widget.exposed().filters).toEqual([{ column: 'C', condition: 'contains', value: 'z' }]));
  });

  test('Table-FILTERUI-024 a hidden chip that gets a value takes a place in the header, and the count stays', async () => {
    // Break this catches: a filter that is applied but invisible, hidden behind the menu.
    await renderOverflowing();
    await widget.session.user.click(moreChip());
    await widget.session.user.type(await screen.findByRole('textbox', { name: 'D contains value' }), 'w');
    await waitFor(() => expect(widget.exposed().filters).toHaveLength(1));
    await widget.session.user.keyboard('{Escape}');

    await waitFor(() => expect(chipNames()).toContain('D contains value'));
    expect(visibleChips()).toHaveLength(2);
    expect(moreChip()).toHaveTextContent('+2 more');
  });
});

describe('Table-FILTERUI-025 the header layout', () => {
  test('Table-FILTERUI-025 the filter button stays first and unshrinkable, the chips fill the room after it', async () => {
    // Break this catches: a full row of chips squeezing the filter button out of the top-left corner.
    await renderOverflowing();

    const button = document.querySelector('[data-cy="table1-filter-button"]');
    const chipRow = document.querySelector('[data-cy="table1-filter-chips"]');
    expect(button.closest('.position-relative')).toHaveClass('tw-shrink-0');
    expect(chipRow).toHaveClass('tw-flex-1', 'tw-min-w-0');
    expect(button.compareDocumentPosition(chipRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(button.closest('.table-card-header').firstElementChild).toContainElement(button);
  });
});

describe('Table-FILTERUI-053 the "+N more" chip', () => {
  test('Table-FILTERUI-053 the count is in the heavier column-name weight and "more" is the grey operator text', async () => {
    // Break this catches: "+2 more" set in one plain weight, where the design bolds the number.
    await renderOverflowing();

    const count = moreChip().querySelector('[data-chip-part="count"]');
    expect(count).toHaveTextContent('+2');
    expect(count).toHaveClass('tw-font-medium');
    expect(count).toHaveClass('tw-text-text-default');
    const label = moreChip().querySelector('[data-chip-part="more-label"]');
    expect(label).toHaveTextContent('more');
    expect(label).toHaveClass('tw-text-text-placeholder');
    expect(label.className).not.toContain('tw-font-medium');
  });
});

describe('Table-FILTERUI-054 the chips in the "+N more" menu', () => {
  test('Table-FILTERUI-054 a menu chip fills the menu width, with its caret at the far end', async () => {
    // Break this catches: carets sitting right after the value in each chip, ragged instead of in a column.
    await renderOverflowing();
    await widget.session.user.click(moreChip());

    const chips = [...document.querySelectorAll('[data-cy^="table1-filter-menu-chip-"]')];
    expect(chips).toHaveLength(2);
    chips.forEach((menuChip) => expect(menuChip).toHaveClass('tw-w-full'));
  });
});
