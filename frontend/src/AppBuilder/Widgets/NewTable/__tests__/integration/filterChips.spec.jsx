/**
 * The header of a real Table: the builder's quick filters as chips beside the filter button, and the filters
 * panel opened from that button.
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
    data: binding("{{[{ id: 1, name: 'Ada', email: 'a@x.com' }, { id: 2, name: 'Bob', email: '' }]}}"),
    columns: {
      value: [
        { id: 'c-name', name: 'Name', key: 'name', columnType: 'string' },
        { id: 'c-email', name: 'Email', key: 'email', columnType: 'string' },
      ],
    },
    autogenerateColumns: binding(false),
  },
});

beforeEach(widget.setup);
afterEach(widget.teardown);

const chips = () => [...document.querySelectorAll('[data-cy^="table1-filter-chip-"]')];
// A chip is a few parts spaced by CSS (spans, and an input or a button for the value), so read them as words
const chipText = (chip) =>
  [...chip.querySelectorAll('[data-chip-part]')]
    .map((part) => (part.matches('input') ? part.value || part.placeholder : part.textContent.trim()))
    .join(' ');
const filterButton = () => document.querySelector('[data-cy="table1-filter-button"]');

const SAVED = [
  { id: 'f1', column: 'c-name', condition: 'contains', value: 'a' },
  { id: 'f2', column: 'c-email', condition: 'isEmpty' },
];

describe('Table-FILTERUI-016 chips in the table header', () => {
  test('Table-FILTERUI-016 each quick filter is a chip beside the filter button, with its applied value', async () => {
    // Break this catches: the saved filters never reaching the header.
    widget.render({ currentMode: 'view', properties: { defaultFilters: { value: SAVED } } });

    await waitFor(() => expect(chips()).toHaveLength(2));
    expect(chipText(chips()[0])).toBe('Name contains a');
    expect(chipText(chips()[1])).toBe('Email is empty');
    expect(filterButton().compareDocumentPosition(chips()[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('Table-FILTERUI-016 a quick filter without a value shows its placeholder', async () => {
    // Break this catches: an empty chip with nothing to say what it expects.
    widget.render({
      currentMode: 'view',
      properties: { defaultFilters: { value: [{ id: 'f1', column: 'c-name', condition: 'contains', value: '' }] } },
    });

    await waitFor(() => expect(chips()).toHaveLength(1));
    expect(chipText(chips()[0])).toBe('Name contains value');
    expect(chips()[0].querySelector('[data-cy="filter-chip-value"]')).toHaveAttribute('data-empty', 'true');
  });

  test('Table-FILTERUI-016 a cleared filter keeps its chip, back to the placeholder', async () => {
    // Break this catches: clearing the filters removing the chips that let the user fill them in again.
    widget.render({ currentMode: 'view', properties: { defaultFilters: { value: SAVED.slice(0, 1) } } });
    await waitFor(() => expect(chipText(chips()[0])).toBe('Name contains a'));

    await widget.act('clearFilters');

    await waitFor(() => expect(chipText(chips()[0])).toBe('Name contains value'));
  });

  test('Table-FILTERUI-016 there are no chips without saved filters', async () => {
    // Characterization: passes on arrival. Break this catches: an empty chip row taking space in every table.
    widget.render({ currentMode: 'view' });
    await waitFor(() => expect(filterButton()).not.toBeNull());

    expect(chips()).toHaveLength(0);
  });

  test('Table-FILTERUI-016 there are no chips while filtering is switched off', async () => {
    // Break this catches: chips for a feature the builder disabled.
    widget.render({
      currentMode: 'view',
      properties: { defaultFilters: { value: SAVED }, showFilterButton: binding('{{false}}') },
    });
    await waitFor(() =>
      expect(document.querySelector('[data-cy="table1-header-section"], .table-card-header')).not.toBeNull()
    );

    expect(chips()).toHaveLength(0);
  });
});

describe('Table-FILTERUI-018 the existing hooks stay', () => {
  test('Table-FILTERUI-018 the filter button and its applied-state dot are unchanged', async () => {
    // Characterization: passes on arrival. Break this catches: the revamp renaming hooks the Cypress specs use.
    widget.render({ currentMode: 'view', properties: { defaultFilters: { value: SAVED.slice(0, 1) } } });

    await waitFor(() => expect(filterButton()).not.toBeNull());
    await waitFor(() => expect(document.querySelector('[data-cy="table1-filter-applied-state"]')).not.toBeNull());
  });
});
