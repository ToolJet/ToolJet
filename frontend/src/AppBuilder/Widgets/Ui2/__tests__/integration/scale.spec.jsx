/**
 * UI 2.0 widgets bound to large data draw a bounded amount of it: DOM counts, never times.
 *
 * - Table, 10,000 rows: virtualised, so only the rows in view (plus overscan) are in the DOM.
 * - Kanban, 500 cards over 3 columns: at most 100 cards a column until "Show more".
 * - List view, 1,000 rows: 100 rows until "Show more".
 * - Charts, 5,000 points: a bounded number of nodes; no series animates past MAX_ANIMATED_POINTS drawn points, and
 *   the pie, radial, funnel and radar draw at most their cap of slices, rings, stages or axes.
 * The Map's 2,000 points clustering to a bounded marker count is [ShadMap-PROP-004].
 */
import { createWidgetHarness, measureChartsAt } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { boxOf, defaultsOf } from '@/AppBuilder/Widgets/Ui2/__tests__/packPage';
import { MAX_ROWS } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import { MAX_ANIMATED_POINTS } from '@/AppBuilder/Widgets/Ui2/_charts/chartParts';
import { MAX_SLICES } from '@/AppBuilder/Widgets/Ui2/PieChart/PieChart';
import { MAX_RINGS } from '@/AppBuilder/Widgets/Ui2/RadialChart/radialModel';
import { MAX_STAGES } from '@/AppBuilder/Widgets/Ui2/FunnelChart/funnelModel';
import { MAX_AXES } from '@/AppBuilder/Widgets/Ui2/RadarChart/RadarChart';

measureChartsAt(800, 400);

const harnessFor = (type, box = boxOf(type)) =>
  createWidgetHarness({
    componentType: type,
    handle: 'big1',
    id: 'big1',
    widgetWidth: box.width,
    widgetHeight: box.height,
    capabilities: { dnd: true },
  });
const rowsBinding = (n, row) => binding(`{{Array.from({ length: ${n} }, (_, i) => (${row}))}}`);
const settle = () => act(() => new Promise((r) => setTimeout(r, 50)));

describe('UI 2.0 Table with 10,000 rows', () => {
  const widget = harnessFor('ShadTable', { width: 800, height: 400 });
  let own;
  beforeEach(() => {
    own = Element.prototype.getBoundingClientRect;
    // jsdom has no layout: every box measures 800 x 400, so the virtualiser has a viewport the height of the table.
    // Assigned, not spied on: restoring a second spy would also undo measureChartsAt's.
    Element.prototype.getBoundingClientRect = function measure() {
      return this.tagName === 'DIV'
        ? { x: 0, y: 0, top: 0, left: 0, right: 800, bottom: 400, width: 800, height: 400 }
        : own.call(this);
    };
    return widget.setup();
  });
  afterEach(() => {
    Element.prototype.getBoundingClientRect = own;
    widget.teardown();
  });

  test('[Ui2Scale-TBL-001] mounts only the rows in view, not 10,000', async () => {
    const { container } = widget.render({
      currentMode: 'view',
      properties: { data: rowsBinding(10000, "{ id: i, name: 'Row ' + i, amount: i }") },
    });
    await waitFor(() => expect(container.querySelector('tbody tr')).toBeTruthy());
    await settle();

    const rows = container.querySelectorAll('tbody tr').length;
    // 400 px at about 36 px a row is 12 rows, plus 10 rows of overscan each side; spacer rows aside.
    expect(rows).toBeGreaterThan(5);
    expect(rows).toBeLessThanOrEqual(40);
    expect(widget.exposed().totalRows ?? 10000).toBe(10000);
  });
});

describe('UI 2.0 Kanban with 500 cards', () => {
  const widget = harnessFor('ShadKanban', { width: 900, height: 600 });
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[Ui2Scale-KBN-001] draws at most 100 cards a column', async () => {
    const { container } = widget.render({
      currentMode: 'view',
      properties: {
        data: rowsBinding(500, "{ id: i, title: 'Card ' + i, status: ['todo', 'doing', 'done'][i % 3] }"),
        columns: binding("{{['todo', 'doing', 'done']}}"),
      },
    });
    await waitFor(() => expect(container.textContent).toContain('Card 0'));

    // 167, 167 and 166 cards: 100 drawn in each column, each with its title once.
    const cards = container.textContent.match(/Card \d+/g) || [];
    expect(cards).toHaveLength(300);
    expect(container.textContent).toContain('Show 67 more of 67');
    expect(container.textContent).toContain('Show 66 more of 66');
  });
});

describe('UI 2.0 List view with 1,000 rows', () => {
  const widget = harnessFor('ShadListView', { width: 600, height: 500 });
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[Ui2Scale-LST-001] draws 100 rows, then a "Show more"', async () => {
    const { container } = widget.render({
      currentMode: 'view',
      properties: { data: rowsBinding(1000, "{ id: i, name: 'Row ' + i }"), enablePagination: binding('{{false}}') },
    });
    await waitFor(() => expect(container.textContent).toContain('Show 100 more of 900'));

    expect(container.querySelectorAll('[role=listitem]')).toHaveLength(100);
  });
});

// Every chart with rows, fed 5,000 rows shaped like its own sample data. The charts that draw a point per row stop
// animating past MAX_ANIMATED_POINTS; the others cap what they draw (slices, rings, stages, axes) well below it.
const UNANIMATED = [
  'ShadLineChart',
  'ShadAreaChart',
  'ShadBarChart',
  'ShadComboChart',
  'ShadScatterChart',
  'ShadHeatmapChart',
  'ShadSparkline',
];
const CAPPED = {
  ShadPieChart: MAX_SLICES,
  ShadRadialChart: MAX_RINGS,
  ShadFunnelChart: MAX_STAGES,
  ShadRadarChart: MAX_AXES,
};
/** n rows cycling the sample's rows, its first text field (the category) numbered so categories stay distinct. */
const manyLike = (sample, n) =>
  Array.from({ length: n }, (_, i) => {
    const row = sample[i % sample.length];
    if (typeof row !== 'object' || row === null) return Number(row) + i;
    const category = Object.keys(row).find((k) => typeof row[k] === 'string');
    return Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k, k === category ? `${v} ${i}` : typeof v === 'number' ? v + (i % 97) : v])
    );
  });
/** Each drawn Recharts series, read through React's fibers from the drawn shapes: whether it animates, and how many
 *  data points it was handed (its own data, else its chart's). */
const seriesOf = (container) => {
  const found = new Map();
  for (const el of container.querySelectorAll('svg *')) {
    const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
    for (let f = key ? el[key] : null; f; f = f.return) {
      if (f.memoizedProps && 'isAnimationActive' in f.memoizedProps) {
        let data = f.memoizedProps.data;
        for (let up = f; !Array.isArray(data) && up; up = up.return) data = up.memoizedProps?.data;
        found.set(f.stateNode || f.type, { animates: f.memoizedProps.isAnimationActive, points: data?.length ?? 0 });
        break;
      }
    }
  }
  return [...found.values()];
};
/** The rows handed to the Recharts chart component itself (its `data` prop), read from the drawn svg's fiber. */
const chartRows = (container) => {
  const svg = container.querySelector('svg');
  const key = svg && Object.keys(svg).find((k) => k.startsWith('__reactFiber$'));
  for (let f = key ? svg[key] : null; f; f = f.return)
    if (Array.isArray(f.memoizedProps?.data)) return f.memoizedProps.data.length;
  return 0;
};
// What a capped chart drew, by chart: the funnel's HTML bars (each with its grow-in animation while Animate is on), the
// radial chart's rings (the chart's rows), and for the others the points handed to each series.
const drawnBy = {
  ShadFunnelChart: (container) => [container.querySelectorAll('span[style*="animation"]').length],
  ShadRadialChart: (container) => [chartRows(container)],
};

describe.each([...UNANIMATED, ...Object.keys(CAPPED)])('UI 2.0 %s with 5,000 points', (type) => {
  const widget = harnessFor(type, { width: 800, height: 400 });
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test(`[${type}-SCALE-001] draws a bounded number of nodes, without animation past ${MAX_ANIMATED_POINTS} points`, async () => {
    const { container } = widget.render({
      currentMode: 'view',
      properties: {
        data: binding(`{{${JSON.stringify(manyLike(defaultsOf(type).data, 5000))}}}`),
        animate: binding('{{true}}'),
        // The radial chart draws its data as rings in categories mode (its default is one value as a gauge).
        ...(type === 'ShadRadialChart' && { mode: binding('categories') }),
      },
    });
    await waitFor(() => expect(container.querySelector('svg, [data-funnel], .tj-shadcn span')).toBeTruthy());
    await settle();

    // A drawn point is a few nodes (shape, label, hit area); never one per row past MAX_ROWS.
    expect(container.querySelectorAll('*').length).toBeLessThan(MAX_ROWS * 4);
    const series = seriesOf(container);
    if (CAPPED[type]) {
      const drawn = drawnBy[type]?.(container) ?? series.map((s) => s.points);
      expect(Math.min(...drawn)).toBeGreaterThan(0);
      expect(Math.max(...drawn)).toBe(CAPPED[type]);
      expect(CAPPED[type]).toBeLessThanOrEqual(MAX_ANIMATED_POINTS);
    } else {
      expect(series.length).toBeGreaterThan(type === 'ShadHeatmapChart' ? -1 : 0);
      expect(series.filter((s) => s.animates)).toEqual([]);
      expect(container.querySelector('[style*="animation"]')).toBeNull();
    }
  });
});
