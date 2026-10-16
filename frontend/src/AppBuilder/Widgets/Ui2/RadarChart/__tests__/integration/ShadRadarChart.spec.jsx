/**
 * UI 2.0 Radar chart: a filled polygon per series over a ring of categories.
 *
 * Real store, real RenderWidget, real widget and real Recharts; nothing about the widget is mocked. jsdom has no
 * layout, so the one box Recharts measures (its ResponsiveContainer) is given the widget's size; every other element
 * measures as jsdom does. Standard control behaviour (visibility, disabled, loading, tooltip) is covered for every
 * UI 2.0 widget in Ui2/__tests__/integration/controlState.spec.jsx. Titles carry [ShadRadarChart-<AREA>-<NNN>] ids.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  setVariableOn,
  countInvocationsOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'radar1';
const W = 480;
const H = 280;
const widget = createWidgetHarness({
  componentType: 'ShadRadarChart',
  handle: 'radarChart1',
  id: ID,
  widgetHeight: H,
  widgetWidth: W,
  // Drawn at once: the entrance animation has its own scenario below.
  defaultProperties: { animate: binding('{{false}}') },
});

let measure;
beforeAll(() => {
  const own = Element.prototype.getBoundingClientRect;
  measure = jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function rect() {
    return this.classList?.contains('recharts-responsive-container')
      ? { x: 0, y: 0, top: 0, left: 0, right: W, bottom: H, width: W, height: H }
      : own.call(this);
  });
});
afterAll(() => measure.mockRestore());

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const polygons = () => document.querySelectorAll('.recharts-radar-polygon path');
const drawn = () => waitFor(() => expect(polygons().length).toBeGreaterThan(0));
const legend = () => document.querySelector('.recharts-legend-wrapper');
/** Mouse events at a point of the chart (jsdom's carry no page coordinates, which Recharts reads). */
const pointer = (types, x = 250, y = 120) =>
  act(async () => {
    const wrapper = document.querySelector('.recharts-wrapper');
    for (const type of types) {
      const e = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y });
      Object.defineProperties(e, { pageX: { value: x }, pageY: { value: y } });
      fireEvent(wrapper, e);
    }
  });
/** How wide a polygon is drawn: the spread of the x coordinates in its path. */
const spread = (path) => {
  const xs = [...path.getAttribute('d').matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => Number(m[1]));
  return Math.max(...xs) - Math.min(...xs);
};
/** The isAnimationActive each drawn series got, read from React's fiber tree (jsdom draws both the same). */
const animationFlags = () => {
  const flags = new Set();
  for (const el of document.querySelectorAll('svg *')) {
    const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
    for (let f = key ? el[key] : null; f; f = f.return) {
      if (f.memoizedProps && 'isAnimationActive' in f.memoizedProps) {
        flags.add(f.memoizedProps.isAnimationActive);
        break;
      }
    }
  }
  return [...flags];
};

describe('UI 2.0 Radar chart', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadRadarChart-DEF-001] draws a polygon per series on a polygon grid, with the categories round it and a legend', async () => {
    render();

    await waitFor(() => expect(polygons()).toHaveLength(2));
    expect(document.querySelector('.recharts-polar-grid-concentric-polygon')).toBeInTheDocument();
    expect(screen.getByText('Speed')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(legend()).toHaveTextContent('AlexJordan');
    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({}));
  });

  test('[ShadRadarChart-PROP-001] data, categoryField and yFields choose the categories and the series', async () => {
    render({
      properties: {
        data: binding("{{[{ area: 'North', q1: 3 }, { area: 'South', q1: 5 }, { area: 'East', q1: 4 }]}}"),
        categoryField: binding('area'),
        yFields: binding("{{['q1']}}"),
      },
    });

    await waitFor(() => expect(polygons()).toHaveLength(1));
    expect(screen.getByText('North')).toBeInTheDocument();
    expect(screen.getByText('East')).toBeInTheDocument();
  });

  test('[ShadRadarChart-PROP-002] gridShape circle draws a circle grid, and fillOpacity sets how solid the polygons are', async () => {
    render({ properties: { gridShape: binding('circle'), fillOpacity: binding('{{0.3}}') } });

    await drawn();
    expect(polygons()[0].getAttribute('fill-opacity')).toBe('0.3');
    expect(document.querySelector('.recharts-polar-grid-concentric-circle')).toBeInTheDocument();
  });

  test('[ShadRadarChart-PROP-003] showGrid off removes the grid, and showDots marks every score', async () => {
    render({ properties: { showGrid: binding('{{false}}'), showDots: binding('{{true}}') } });

    await drawn();
    expect(document.querySelector('.recharts-polar-grid')).toBeNull();
    expect(document.querySelectorAll('.recharts-radar-dots circle')).toHaveLength(12);
  });

  test('[ShadRadarChart-PROP-004] maxValue sets the outer ring: a larger maximum draws the same scores smaller', async () => {
    render({ properties: { maxValue: binding('{{100}}') } });
    await drawn();
    const atHundred = spread(polygons()[0]);

    render({ properties: { maxValue: binding('{{200}}') } });
    await drawn();
    expect(spread(polygons()[0])).toBeLessThan(atHundred * 0.6);
  });

  test('[ShadRadarChart-PROP-005] valuePrefix and valueSuffix wrap the scores in the hover tooltip', async () => {
    render({ properties: { valuePrefix: binding('~'), valueSuffix: binding(' pts') } });
    await drawn();

    await pointer(['mousemove']);

    expect(await screen.findByText('~86 pts')).toBeInTheDocument();
  });

  test('[ShadRadarChart-PROP-006] seriesLabels rename series and colors sets their colours; showLegend off removes the legend', async () => {
    render({
      properties: { seriesLabels: binding("{{{ alex: 'Alex R.' }}}"), colors: binding("{{['#111111', '#222222']}}") },
    });
    await drawn();
    expect(legend()).toHaveTextContent('Alex R.');
    expect([...polygons()].map((p) => p.getAttribute('fill'))).toEqual(['#111111', '#222222']);

    render({ properties: { showLegend: binding('{{false}}') } });
    await drawn();
    expect(legend()).toBeNull();
  });

  test('[ShadRadarChart-PROP-007] emptyText is shown when there is nothing to draw', async () => {
    render({ properties: { data: binding('{{[]}}'), emptyText: binding('Nothing yet') } });

    expect(await screen.findByText('Nothing yet')).toBeInTheDocument();
  });

  test('[ShadRadarChart-PROP-008] animate turns every series entrance animation on, and off', async () => {
    render({ properties: { animate: binding('{{true}}') } });
    await drawn();
    expect(animationFlags()).toEqual([true]);

    render({ properties: { animate: binding('{{false}}') } });
    await drawn();
    expect(animationFlags()).toEqual([false]);
  });

  test('[ShadRadarChart-DEF-002] junk properties draw the chart or the empty message, never an error', async () => {
    for (const properties of [
      { data: binding("{{[null, 3, 'x', [], { skill: {}, alex: 'n/a' }]}}") },
      {
        gridShape: binding('{{{}}}'),
        maxValue: binding('{{-5}}'),
        fillOpacity: binding('{{9}}'),
        yFields: binding('{{null}}'),
      },
    ]) {
      render({ properties });
      await waitFor(() => expect(document.querySelector('svg, button') || screen.queryByText('No data')).toBeTruthy());
      expect(screen.queryByText(/something went wrong/i)).toBeNull();
    }
  });

  test('[ShadRadarChart-STY-001] chartColor, gridColor, axisTextColor and legendTextColor reach the chart as CSS variables', async () => {
    render({
      styles: {
        chartColor: binding('#e11d48'),
        gridColor: binding('#d4d4d8'),
        axisTextColor: binding('#52525b'),
        legendTextColor: binding('#3f3f46'),
      },
    });

    await drawn();
    const root = document.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--sc-chart-1')).toBe('#e11d48');
    expect(root.style.getPropertyValue('--lk-grid')).toBe('#d4d4d8');
    expect(root.style.getPropertyValue('--lk-axis')).toBe('#52525b');
    expect(root.style.getPropertyValue('--lk-legend')).toBe('#3f3f46');
  });

  test('[ShadRadarChart-EVT-001] clicking a category exposes its row as clickedDataPoint and fires onClick, whose handler reads it', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onClick', { value: '{{components.radarChart1.clickedDataPoint.skill}}' }));
    await drawn();

    await pointer(['mousemove', 'click']);

    await waitFor(() => expect(widget.variables().seen).toBe('Speed'));
    expect(exposed().clickedDataPoint).toMatchObject({ skill: 'Speed', alex: 86, jordan: 65 });
  });

  test('[ShadRadarChart-EVT-002] a double click fires onDoubleClick once', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onDoubleClick'));
    await drawn();

    await pointer(['mousemove', 'click', 'click', 'dblclick']);

    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ShadRadarChart-ACT-001] clearClickedPoint empties clickedDataPoint', async () => {
    render();
    await drawn();
    await pointer(['mousemove', 'click']);
    await waitFor(() => expect(exposed().clickedDataPoint).toMatchObject({ skill: 'Speed' }));

    await widget.act('clearClickedPoint');

    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({}));
  });
});
