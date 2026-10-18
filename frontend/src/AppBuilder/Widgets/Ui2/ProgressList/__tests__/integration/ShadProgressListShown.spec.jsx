/**
 * UI 2.0 Progress list past its first page of rows (release audit round 2): a row's figures are formatted when it is
 * drawn, not for every row of the binding before the visible-row limit applies, while selection and keys still read
 * the whole list. Titles carry [ShadProgressList-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { formatValue } from '@/AppBuilder/Widgets/Ui2/_shared/format';

jest.mock('@/AppBuilder/Widgets/Ui2/_shared/format', () => {
  const actual = jest.requireActual('@/AppBuilder/Widgets/Ui2/_shared/format');
  return { ...actual, formatValue: jest.fn(actual.formatValue) };
});

const widget = createWidgetHarness({
  componentType: 'ShadProgressList',
  handle: 'progress1',
  id: 'pl1',
  widgetHeight: 400,
  widgetWidth: 520,
});
const ROWS = Array.from({ length: 1000 }, (_, i) => ({ key: `g${i}`, name: `Goal ${i}`, done: i, goal: 1000 }));

describe('UI 2.0 Progress list rows shown', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadProgressList-SHOWN-001] formats the drawn rows only, and the next ones when shown', async () => {
    formatValue.mockClear();
    widget.render({
      currentMode: 'view',
      properties: {
        data: binding(`{{${JSON.stringify(ROWS)}}}`),
        labelField: binding('name'),
        valueField: binding('done'),
        targetField: binding('goal'),
        idField: binding('key'),
        valueFormat: binding('number'),
      },
    });
    expect(document.querySelectorAll('li')).toHaveLength(100);
    expect(formatValue.mock.calls.length).toBeLessThanOrEqual(2 * 100);
    formatValue.mockClear();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Show 100 more of 900' })));
    expect(document.querySelectorAll('li')).toHaveLength(200);
    expect(formatValue.mock.calls.length).toBeLessThanOrEqual(2 * 200);
    expect(screen.getByText('Goal 199')).toBeInTheDocument();
  });
});
