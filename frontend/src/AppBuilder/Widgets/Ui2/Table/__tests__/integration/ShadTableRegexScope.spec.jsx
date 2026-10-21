/**
 * UI 2.0 Table, release audit round 6 (Codex R6-03): a "too complex" regex verdict was kept module-wide per pattern,
 * so one Table whose data had a pathological row turned the same conditional style, button rule and filter off for
 * every other Table on the page. Real store, real RenderWidget, two real Tables: the poisoned one styles, disables
 * and keeps no row; the safe one, rendered after it, still does on its own rows.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, within } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';

const PATTERN = '^(?=a)(a+)+$|^mountedScope712$';
const LONG = `${'a'.repeat(28)}!`;
const RED = 'rgb(220, 38, 38)';
const w = createWidgetHarness({
  componentType: 'ShadTable',
  id: 'poisoned',
  handle: 'poisoned',
  widgetWidth: 800,
  widgetHeight: 400,
});
let warn;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  return w.setup();
});
afterEach(() => {
  w.teardown();
  warn.mockRestore();
});

const tableProps = (rows) => ({
  data: binding(rows),
  columns: binding([
    {
      key: 'value',
      name: 'Value',
      columnType: 'string',
      conditionalStyles: [{ condition: 'matches', value: PATTERN, textColor: '#dc2626' }],
    },
    {
      key: 'actions',
      name: 'Actions',
      columnType: 'button',
      buttons: [
        { id: 'approve', label: 'Approve', disabledWhen: { key: 'value', condition: 'matches', value: PATTERN } },
      ],
    },
  ]),
});
test('a poisoned Table does not turn the same pattern off in a safe Table rendered after it', async () => {
  w.render({
    currentMode: 'view',
    properties: tableProps([
      { id: 'long', value: LONG },
      { id: 'short', value: 'aaa' },
    ]),
    extraComponents: {
      safe: componentDefinition('safe', 'safe', 'ShadTable', tableProps([{ id: 'short', value: 'aaa' }])),
    },
    also: [{ id: 'safe', componentType: 'ShadTable', widgetWidth: 800, widgetHeight: 400 }],
  });
  await waitFor(() => expect(screen.getAllByText('aaa')).toHaveLength(2));
  const [poisonedCell, safeCell] = screen.getAllByText('aaa').map((el) => el.closest('td'));
  // Within the poisoned Table the pattern holds for no row, whatever the row order.
  expect(poisonedCell.style.color).toBe('');
  expect(screen.getByText(LONG).closest('td').style.color).toBe('');
  // The safe Table checks its own rows: aaa matches, styled red, its button disabled.
  expect(safeCell.style.color).toBe(RED);
  expect(within(safeCell.closest('tr')).getByRole('button', { name: 'Approve' })).toBeDisabled();
  expect(within(poisonedCell.closest('tr')).getByRole('button', { name: 'Approve' })).not.toBeDisabled();

  const filters = [{ column: 'value', condition: 'matches', value: PATTERN }];
  await w.act('setFilters', filters);
  await act(async () => {
    await w.exposed('safe').setFilters(filters);
  });
  expect(w.exposed().filteredData).toEqual([]);
  expect(w.exposed('safe').filteredData.map((r) => r.id)).toEqual(['short']);
});
