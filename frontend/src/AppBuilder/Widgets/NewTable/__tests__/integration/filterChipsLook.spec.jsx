/**
 * How a chip is typeset: the table's own text is 14px IBM Plex Sans (400, column titles 500), so the chips use
 * the same, and the value is readable.
 */
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '../../../__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'Table',
  handle: 'table1',
  id: 't1',
  widgetHeight: 460,
  widgetWidth: 900,
  capabilities: { dnd: true },
  defaultProperties: {
    data: binding("{{[{ id: 1, name: 'Ada', status: 'active', email: 'a@x.com' }]}}"),
    columns: {
      value: [
        { id: 'c-name', name: 'Name', key: 'name', columnType: 'string' },
        {
          id: 'c-status',
          name: 'Status',
          key: 'status',
          columnType: 'select',
          options: [{ label: 'Active', value: 'active' }],
        },
        { id: 'c-email', name: 'Email', key: 'email', columnType: 'string' },
      ],
    },
    autogenerateColumns: binding(false),
    defaultFilters: {
      value: [
        { id: 'f1', column: 'c-name', condition: 'contains', value: 'Ada Lovelace' },
        { id: 'f2', column: 'c-status', condition: 'equals', value: 'active' },
        { id: 'f3', column: 'c-email', condition: 'isEmpty' },
      ],
    },
  },
});

beforeEach(widget.setup);
afterEach(widget.teardown);

const chip = (index) => document.querySelector(`[data-cy="table1-filter-chip-${index}"]`);

async function renderChips() {
  widget.render({ currentMode: 'view' });
  await waitFor(() => expect(chip(2)).not.toBeNull());
}

describe('Table-FILTERUI-049 the type of a chip matches the table', () => {
  test('Table-FILTERUI-049 every chip is 14px and takes the page font, like the table content', async () => {
    // Break this catches: chips set in 12px while the table content they filter is 14px.
    await renderChips();

    [0, 1, 2].forEach((index) => {
      expect(chip(index)).toHaveClass('tw-text-lg');
      expect(chip(index)).toHaveClass('[font-family:inherit]');
      expect(chip(index).className).not.toContain('tw-text-base');
    });
  });

  test('Table-FILTERUI-049 the column name is weight 500, like the table column titles', async () => {
    // Break this catches: a heavier (or lighter) column name than the titles of the table's own columns.
    await renderChips();

    expect(chip(0).querySelector('[data-chip-part="column"]')).toHaveClass('tw-font-medium');
    expect(chip(0).querySelector('[data-chip-part="column"]').className).not.toContain('tw-font-semibold');
  });

  test('Table-FILTERUI-049 the controls inside a chip do not drop back to the browser font or size', async () => {
    // Break this catches: the value box, the option picker and the on/off chip using the browser's default font.
    await renderChips();

    ['input', 'button[data-chip-part="value"]', 'button[aria-pressed]'].forEach((selector, index) => {
      const control = chip(index).querySelector(selector);
      expect(control).toHaveClass('tw-text-lg');
      expect(control).toHaveClass('[font-family:inherit]');
    });
  });
});

describe('Table-FILTERUI-050 the value in a chip is readable', () => {
  test('Table-FILTERUI-050 a typed value is shown in full width, in the normal text colour', async () => {
    // Break this catches: a value squeezed into a box narrower than its text, or shown as a placeholder.
    await renderChips();

    const input = chip(0).querySelector('input');
    expect(input).toHaveValue('Ada Lovelace');
    expect(input).toHaveAttribute('data-empty', 'false');
    expect(input).toHaveClass('tw-text-text-default');
    // sized to the text (12 characters, plus one), not to the placeholder
    expect(input.style.width).toBe('13ch');
  });

  test('Table-FILTERUI-050 a short value still gets room to be read and edited', async () => {
    // Break this catches: a two-letter value in a box two letters wide.
    widget.render({
      currentMode: 'view',
      properties: { defaultFilters: { value: [{ id: 'f1', column: 'c-name', condition: 'contains', value: 'Al' }] } },
    });
    await waitFor(() => expect(chip(0)).not.toBeNull());

    expect(parseInt(chip(0).querySelector('input').style.width, 10)).toBeGreaterThanOrEqual(6);
  });

  test('Table-FILTERUI-050 a picked value is shown by its label, in the normal text colour', async () => {
    // Break this catches: an option chip showing nothing, or the raw value, where the table shows the label.
    await renderChips();

    const value = chip(1).querySelector('[data-chip-part="value"]');
    expect(value).toHaveTextContent('Active');
    expect(value).toHaveAttribute('data-empty', 'false');
    expect(value).toHaveClass('tw-text-text-default');
  });
});

describe('Table-FILTERUI-052 a chip draws no extra border around its value box', () => {
  test('Table-FILTERUI-052 the value box has no outline of its own, so the global input outline colour has nothing to paint', async () => {
    // Break this catches: the grey rounded box around the typed value (a transparent outline that the global
    // `input[type="text"] { outline-color: ... !important }` rule turns into a visible one).
    await renderChips();

    const input = chip(0).querySelector('input');
    expect(input.getAttribute('style')).toContain('outline: none');
    expect(input.className).not.toContain('tw-outline-none');
  });

  test('Table-FILTERUI-052 the chip itself shows the focus, with the accent border', async () => {
    // Break this catches: no sign of which chip is being edited once the outline is gone.
    await renderChips();

    [0, 1].forEach((index) => expect(chip(index)).toHaveClass('focus-within:tw-border-border-accent-strong'));
  });
});

describe('Table-FILTERUI-066 chips are measured as they are drawn', () => {
  test('Table-FILTERUI-066 the hidden copy used to measure a chip is the chip itself, so it is as wide as the chip', async () => {
    // Break this catches: a plain-text stand-in that leaves out the caret, the cross or the width of the value box,
    // so more chips are kept in the row than fit and the "+N more" chip runs under the search box.
    await renderChips();

    ['f1', 'f2', 'f3'].forEach((id, index) => {
      const real = chip(index);
      const copy = document.querySelector(`[data-chip-measure="${id}"]`);
      expect(copy.closest('[aria-hidden="true"]')).not.toBeNull();
      const drawn = copy.firstElementChild;
      expect(drawn.className).toBe(real.className);
      expect(drawn.querySelectorAll('svg')).toHaveLength(real.querySelectorAll('svg').length);
      expect(drawn.querySelectorAll('button')).toHaveLength(real.querySelectorAll('button').length);
      expect(drawn.querySelector('input')?.style.width).toBe(real.querySelector('input')?.style.width);
      expect(drawn.textContent).toBe(real.textContent);
    });
  });
});
