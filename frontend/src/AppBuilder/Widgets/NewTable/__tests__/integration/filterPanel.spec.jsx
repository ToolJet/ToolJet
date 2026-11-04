/**
 * The filters panel of a real Table, opened from the filter button: its title bar, footer, size and the dimmed
 * table behind it, with the existing behaviour of its rows kept.
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
    data: binding("{{[{ id: 1, name: 'Ada' }, { id: 2, name: 'Bob' }]}}"),
    columns: {
      value: [
        { id: 'c-id', name: 'Id', key: 'id', columnType: 'number' },
        { id: 'c-name', name: 'Name', key: 'name', columnType: 'string' },
      ],
    },
    autogenerateColumns: binding(false),
  },
});

beforeEach(widget.setup);
afterEach(widget.teardown);

const q = (dataCy) => document.querySelector(`[data-cy="${dataCy}"]`);
const panel = () => q('table1-filter-panel');
const filterButton = () => q('table1-filter-button');

async function openPanel(properties = {}) {
  widget.render({ currentMode: 'view', properties });
  await waitFor(() => expect(filterButton()).not.toBeNull());
  await widget.session.user.click(filterButton());
  await waitFor(() => expect(panel()).not.toBeNull());
}

describe('Table-FILTERUI-045 the filters panel shell', () => {
  test('Table-FILTERUI-045 has the title "Filters" and a close icon that closes it', async () => {
    // Break this catches: a panel without a title bar, or one that cannot be closed.
    await openPanel();

    expect(q('filter-header')).toHaveTextContent('Filters');
    const close = q('close-filters-button');
    expect(close).toHaveAttribute('aria-label', 'Close filters');
    expect(close.querySelector('svg')).not.toBeNull();

    await widget.session.user.click(close);

    expect(panel()).toBeNull();
    expect(q('filter-overlay')).toBeNull();
  });

  test('Table-FILTERUI-067 the title bar has a bottom border, like the footer has a top one', async () => {
    // Break this catches: the title running into the rows with no line between them (the generic card header rule
    // takes its border off, so the bar must not be a `.card-header`).
    await openPanel();

    expect(q('filter-header').parentElement).toHaveClass('tw-border-b', 'tw-border-solid', 'tw-border-border-default');
    expect(q('filter-header').parentElement.className).not.toContain('card-header');
  });

  test('Table-FILTERUI-045 the footer has Clear all filters on the left and Add filter on the right', async () => {
    // Break this catches: the footer buttons swapped, or still labelled as before.
    await openPanel();

    const clear = q('button-clear-filters');
    const add = q('button-add-filter');
    expect(clear).toHaveTextContent('Clear all filters');
    expect(add).toHaveTextContent('Add filter');
    expect(clear.compareDocumentPosition(add) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('Table-FILTERUI-045 Add filter takes the app theme colour', async () => {
    // Break this catches: the primary button ignoring the primary colour a builder sets in the app theme.
    await openPanel();

    expect(q('button-add-filter').className).toContain('cc-primary-brand');
  });

  test('Table-FILTERUI-045 is centred in the table at 68% of its width, at most 674px', async () => {
    // Break this catches: the old right-aligned 300px panel.
    await openPanel();

    expect(panel().style.width).toBe('68%');
    expect(panel().style.maxWidth).toBe('674px');
    expect(panel().style.left).toBe('50%');
    expect(panel().style.transform).toBe('translateX(-50%)');
  });

  test('Table-FILTERUI-045 the table behind it is dimmed and a click on the dimming does not close the panel', async () => {
    // Break this catches: a half-edited filter being thrown away by a stray click.
    await openPanel();

    const overlay = q('filter-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay.className).toContain('tw-bg-black/50');

    await widget.session.user.click(overlay);

    expect(panel()).not.toBeNull();
  });
});

describe('Table-FILTERUI-046 the rows of the panel behave as before', () => {
  test('Table-FILTERUI-046 an empty panel says there are no filters yet', async () => {
    // Characterization: passes on arrival. Break this catches: the empty state being lost in the restyle.
    await openPanel();

    expect(q('no-filters-yet-label')).not.toBeNull();
  });

  test('Table-FILTERUI-046 Add filter adds an editable row', async () => {
    // Characterization: passes on arrival. Break this catches: the restyled footer no longer adding rows.
    await openPanel();

    await widget.session.user.click(q('button-add-filter'));

    expect(q('select-column-dropdown-0')).not.toBeNull();
    expect(q('filter-value-input-0')).not.toBeNull();
    expect(q('no-filters-yet-label')).toBeNull();
  });

  test('Table-FILTERUI-046 Clear all filters removes the rows and clears the applied filters', async () => {
    // Characterization: passes on arrival. Break this catches: the restyled footer no longer clearing.
    await openPanel({
      defaultFilters: { value: [{ id: 'f1', column: 'c-name', condition: 'contains', value: 'a' }] },
    });
    await waitFor(() => expect(widget.exposed().filters).toHaveLength(1));
    // the builder's filter is a quick row (its value box is the quick one), and it stays after clearing, empty
    expect(q('quick-filter-value-0')).toHaveValue('a');

    await widget.session.user.click(q('button-clear-filters'));

    expect(q('quick-filter-value-0')).toHaveValue('');
    expect(q('filter-value-input-0')).toBeNull();
    await waitFor(() => expect(widget.exposed().filters).toEqual([]));
  });
});
