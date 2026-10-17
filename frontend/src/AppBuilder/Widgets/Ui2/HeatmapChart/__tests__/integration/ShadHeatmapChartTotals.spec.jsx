/**
 * UI 2.0 Heatmap totals are complete: a cell sums every row that lands in it, whatever their order, and labels past
 * the drawn grid are reported, not dropped in silence (release audit 66). Titles carry [ShadHeatmapChart-<AREA>-<NNN>].
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { MAX_HEAT_COLUMNS, heatmapGrid } from '@/AppBuilder/Widgets/Ui2/HeatmapChart/heatmapModel';

const FIELDS = { xField: 'hour', yField: 'day', valueField: 'count' };
const ones = (n) => Array.from({ length: n }, () => ({ day: 'Mon', hour: '09:00', count: 1 }));
const LARGE = { day: 'Mon', hour: '09:00', count: 100 };

describe('UI 2.0 Heatmap totals', () => {
  test('[ShadHeatmapChart-TOT-001] a cell sums every row, past 10,000, in any order', () => {
    expect(heatmapGrid([...ones(10000), LARGE], FIELDS).value('Mon', '09:00')).toBe(10100);
    expect(heatmapGrid([LARGE, ...ones(10000)], FIELDS).value('Mon', '09:00')).toBe(10100);
  });

  test('[ShadHeatmapChart-TOT-002] labels past the drawn grid are counted as not shown', () => {
    const rows = Array.from({ length: MAX_HEAT_COLUMNS + 5 }, (_, i) => ({ day: 'Mon', hour: `h${i}`, count: 1 }));
    const grid = heatmapGrid(rows, FIELDS);
    expect(grid.xs).toHaveLength(MAX_HEAT_COLUMNS);
    expect(grid.hidden).toEqual({ columns: 5, rows: 0 });
  });

  describe('in the widget', () => {
    const widget = createWidgetHarness({
      componentType: 'ShadHeatmapChart',
      handle: 'heat1',
      id: 'heat1',
      widgetHeight: 240,
      widgetWidth: 500,
    });
    beforeEach(() => widget.setup());
    afterEach(widget.teardown);
    const render = (data) =>
      widget.render({
        currentMode: 'view',
        properties: {
          data: binding(data),
          xField: binding('hour'),
          yField: binding('day'),
          valueField: binding('count'),
          showLegend: binding('{{false}}'),
        },
      });

    test('[ShadHeatmapChart-TOT-003] the cell title and onClick carry the full total', async () => {
      render(
        `{{[...Array.from({ length: 10000 }, () => ({ day: 'Mon', hour: '09:00', count: 1 })), ${JSON.stringify(
          LARGE
        )}]}}`
      );
      await waitFor(() => expect(screen.getAllByRole('button')).toHaveLength(1));
      const cell = screen.getByRole('button');
      expect(cell).toHaveAttribute('title', 'Mon · 09:00: 10,100');
      widget.setEvents(setVariableOn('heat1', 'onClick', { value: '{{components.heat1.clickedDataPoint}}' }));
      await act(async () => fireEvent.click(cell));
      expect(widget.variables().seen).toEqual({ day: 'Mon', hour: '09:00', count: 10100 });
    });

    test('[ShadHeatmapChart-TOT-004] columns past the drawn grid are named in a note', async () => {
      render(
        `{{Array.from({ length: ${MAX_HEAT_COLUMNS + 5} }, (_, i) => ({ day: 'Mon', hour: 'h' + i, count: 1 }))}}`
      );
      expect(await screen.findByText('5 more columns not shown')).toBeInTheDocument();
    });
  });
});
