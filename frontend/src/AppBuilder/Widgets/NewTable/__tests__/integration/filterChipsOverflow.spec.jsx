/**
 * Chips that do not fit in the header collapse into a "+N more" chip; its menu lists the rest, each editable.
 * jsdom has no layout, so the widths of the chips and of their row are supplied.
 */
import { act, screen, waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '../../../__tests__/integration/widgetHarness';

const CHIP_WIDTH = 120;
const MORE_WIDTH = 60;
const ROW_WIDTH = 400;
let chipWidth = CHIP_WIDTH;
let observed = [];

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
          ? chipWidth
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
  chipWidth = CHIP_WIDTH;
  observed = [];
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

describe('Table-FILTERUI-066 the "+N more" chip is measured as it is drawn', () => {
  test('Table-FILTERUI-066 its hidden copy has the bold count and the grey word, like the real chip', async () => {
    // Break this catches: a copy set in one weight, narrower than the chip it stands for.
    await renderOverflowing();

    const copy = document.querySelector('[data-chip-measure="more"]');
    expect(copy.querySelector('[data-chip-part="count"]')).toHaveClass('tw-font-medium');
    expect(copy.querySelector('[data-chip-part="more-label"]')).toHaveClass('tw-text-text-placeholder');
    expect(copy.className).toBe(moreChip().className);
  });
});

// jsdom has no ResizeObserver: this one only records what is watched, and runs its callbacks when told to. It is
// installed from a beforeEach of the describe, after the harness's own setup (which installs one of its own)
function installResizeObserver() {
  global.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
      this.targets = [];
      observed.push(this);
    }
    observe(target) {
      this.targets.push(target);
    }
    unobserve(target) {
      this.targets = this.targets.filter((candidate) => candidate !== target);
    }
    disconnect() {
      this.targets = [];
    }
  };
}

const resized = () => act(() => observed.forEach((observer) => observer.callback([])));

describe('Table-FILTERUI-067 the "+N more" chip stays in view', () => {
  // after the harness's own setup, which installs a ResizeObserver of its own
  beforeEach(installResizeObserver);

  test('Table-FILTERUI-067 it sits beside the clipped chips, not inside the area that clips', async () => {
    // Break this catches: the more chip being the last thing in a clipped row, so any chip wider than measured
    // pushes it out of sight (or under the search box).
    await renderOverflowing();

    const more = moreChip();
    const firstChip = visibleChips()[0];
    expect(more).toHaveClass('tw-shrink-0');
    expect(firstChip.parentElement).not.toBe(more.parentElement);
    expect(firstChip.parentElement).toHaveClass('tw-overflow-hidden', 'tw-min-w-0');
    expect(more.parentElement).toBe(firstChip.parentElement.parentElement);
    expect(more.parentElement.contains(more)).toBe(true);
    expect(firstChip.parentElement.contains(more)).toBe(false);
  });

  test('Table-FILTERUI-067 chips are measured again when their copies change width (a web font arriving late)', async () => {
    // Break this catches: widths measured once, with the fallback font, and never again once the real font changes them.
    await renderOverflowing();
    expect(visibleChips()).toHaveLength(2);
    const watched = observed.flatMap((observer) => observer.targets);
    expect(watched.some((target) => target.hasAttribute('data-chip-measure-root'))).toBe(true);

    chipWidth = 200;
    await resized();

    // 400 wide, 68 kept for the more chip: one 200px chip fits, two (408) do not
    await waitFor(() => expect(visibleChips()).toHaveLength(1));
    expect(moreChip()).toHaveTextContent('+3 more');
  });
});

describe('Table-FILTERUI-068 a chip that does not fit whole moves into the "+N more" chip', () => {
  // What the chips really take is not always what their hidden copies said (fonts, values being typed): the
  // clipping area reports its content wider than itself, as a browser does
  const REAL_GAP = 8;
  let realChipWidth;
  let restoreSizes;
  beforeEach(() => {
    installResizeObserver();
    realChipWidth = CHIP_WIDTH;
    const scroll = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollWidth');
    const client = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
    Object.defineProperty(Element.prototype, 'scrollWidth', {
      configurable: true,
      get() {
        if (!this.hasAttribute('data-chip-area')) return 0;
        const count = this.querySelectorAll('[data-cy^="table1-filter-chip-"]').length;
        return count * realChipWidth + Math.max(0, count - 1) * REAL_GAP;
      },
    });
    Object.defineProperty(Element.prototype, 'clientWidth', {
      configurable: true,
      // the row, less the more chip and the gap before it
      get() {
        return this.hasAttribute('data-chip-area') ? ROW_WIDTH - MORE_WIDTH - REAL_GAP : 0;
      },
    });
    restoreSizes = () => {
      Object.defineProperty(Element.prototype, 'scrollWidth', scroll);
      Object.defineProperty(Element.prototype, 'clientWidth', client);
    };
  });
  afterEach(() => restoreSizes());

  test('Table-FILTERUI-068 the last chip that sticks out goes into the menu, and the others stay whole', async () => {
    // Break this catches: a chip cut off at the edge of the row, with its value out of sight, beside the more chip.
    // measured at 120 each, two chips are placed (248 of 332); really they are 200 each (408), so one has to go
    realChipWidth = 200;
    await renderOverflowing();

    await waitFor(() => expect(visibleChips()).toHaveLength(1));
    expect(chipNames()).toEqual(['A contains value']);
    expect(moreChip()).toHaveTextContent('+3 more');
  });

  test('Table-FILTERUI-068 a chip too wide for the row on its own is only in the menu', async () => {
    // Break this catches: one very wide chip left clipped in a narrow table.
    realChipWidth = 400;
    await renderOverflowing();

    await waitFor(() => expect(visibleChips()).toHaveLength(0));
    expect(moreChip()).toHaveTextContent('+4 more');
    await widget.session.user.click(moreChip());
    expect(document.querySelectorAll('[data-cy^="table1-filter-menu-chip-"]')).toHaveLength(4);
  });

  test('Table-FILTERUI-068 a chip being typed in is not the one that goes', async () => {
    // Break this catches: the chip under the user\'s cursor disappearing while they type, taking the focus with it.
    realChipWidth = 200;
    widget.render({ currentMode: 'view' });
    await waitFor(() => expect(moreChip() ?? visibleChips()[0]).toBeTruthy());
    await waitFor(() => expect(visibleChips()).toHaveLength(1));
    // the second chip comes back when there is room, and is then the one in use
    realChipWidth = CHIP_WIDTH;
    await resized();
    await waitFor(() => expect(visibleChips()).toHaveLength(2));
    const last = visibleChips()[1].querySelector('input');
    last.focus();
    realChipWidth = 200;

    await resized();

    await waitFor(() => expect(visibleChips()).toHaveLength(1));
    expect(chipNames()).toEqual(['B contains value']);
  });

  test('Table-FILTERUI-068 when everything fits whole, nothing is moved', async () => {
    // Characterization: Break this catches: chips being taken out of the row that fit.
    await renderOverflowing();

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(visibleChips()).toHaveLength(2);
    expect(moreChip()).toHaveTextContent('+2 more');
  });
});
