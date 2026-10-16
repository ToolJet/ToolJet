/**
 * UI 2.0 Sparkline: a small trend line or area with no axes, which exposes its trend and its last value.
 *
 * Real store, real RenderWidget, real widget and real Recharts; nothing about the widget is mocked. jsdom has no
 * layout, so the one box Recharts measures (its ResponsiveContainer) is given the widget's size; every other element
 * measures as jsdom does. Standard control behaviour (visibility, disabled, loading, tooltip) is covered for every
 * UI 2.0 widget in Ui2/__tests__/integration/controlState.spec.jsx. Titles carry [ShadSparkline-<AREA>-<NNN>] ids.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  countInvocationsOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'spark1';
const W = 240;
const H = 80;
const widget = createWidgetHarness({
  componentType: 'ShadSparkline',
  handle: 'sparkline1',
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
const curve = () => document.querySelector('.recharts-area-curve, .recharts-line-curve');
const drawn = () => waitFor(() => expect(curve()).toBeInTheDocument());
const band = () => document.querySelector('.recharts-reference-area-rect');
/** Mouse events at a point of the chart (jsdom's carry no page coordinates, which Recharts reads). */
const pointer = (types, x = W / 2, y = H / 2) =>
  act(async () => {
    const wrapper = document.querySelector('.recharts-wrapper');
    for (const type of types) {
      const e = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y });
      Object.defineProperties(e, { pageX: { value: x }, pageY: { value: y } });
      fireEvent(wrapper, e);
    }
  });
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

describe('UI 2.0 Sparkline', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadSparkline-DEF-001] draws an area in the chart colour with a dot on the last point, and exposes an upward trend', async () => {
    render();

    await drawn();
    expect(curve()).toHaveClass('recharts-area-curve');
    expect(curve().getAttribute('stroke')).toBe('var(--sc-chart-1)');
    expect(document.querySelectorAll('svg circle')).toHaveLength(1);
    expect(document.querySelector('.recharts-cartesian-axis-tick-value')).toBeNull();
    await waitFor(() => expect(exposed()).toMatchObject({ trend: 'up', lastValue: 31 }));
  });

  test('[ShadSparkline-EXP-001] trend compares the last value with the first and lastValue is the last number', async () => {
    render({ properties: { data: binding('{{[5, 4, 2]}}') } });
    await waitFor(() => expect(exposed()).toMatchObject({ trend: 'down', lastValue: 2 }));

    render({ properties: { data: binding('{{[3, 5, 3]}}') } });
    await waitFor(() => expect(exposed()).toMatchObject({ trend: 'flat', lastValue: 3 }));
    // Points as { x, y } rows; an empty point is skipped.
    render({ properties: { data: binding("{{[{ x: 'Mon', y: 3 }, { x: 'Tue', y: 7 }, { x: 'Wed', y: null }]}}") } });
    await waitFor(() => expect(exposed()).toMatchObject({ trend: 'up', lastValue: 7 }));
  });

  test('[ShadSparkline-PROP-001] colorByTrend colours a fall red, and lowerIsBetter counts a fall as good', async () => {
    render({ properties: { data: binding('{{[5, 4, 2]}}'), colorByTrend: binding('{{true}}') } });
    await drawn();
    expect(curve().getAttribute('stroke')).toBe('var(--lk-down, var(--sc-destructive))');

    render({
      properties: {
        data: binding('{{[5, 4, 2]}}'),
        colorByTrend: binding('{{true}}'),
        lowerIsBetter: binding('{{true}}'),
      },
    });
    await waitFor(() => expect(exposed().trend).toBe('up'));
    expect(curve().getAttribute('stroke')).toBe('var(--lk-up, var(--sc-success))');
  });

  test('[ShadSparkline-PROP-002] type line draws a line, and showBand shades the band the values run between', async () => {
    render({ properties: { type: binding('line'), showBand: binding('{{true}}') } });

    await drawn();
    expect(curve()).toHaveClass('recharts-line-curve');
    expect(band()).toBeInTheDocument();
    expect(document.querySelectorAll('svg circle')).toHaveLength(1);
  });

  test('[ShadSparkline-PROP-003] bandMin and bandMax set the shaded band, narrower than the full range', async () => {
    const height = () => Number(band().getAttribute('height'));
    render({ properties: { showBand: binding('{{true}}') } });
    await drawn();
    const full = height();

    render({ properties: { showBand: binding('{{true}}'), bandMin: binding('{{18}}'), bandMax: binding('{{24}}') } });
    await drawn();
    expect(height()).toBeLessThan(full / 2);
  });

  test('[ShadSparkline-PROP-004] showEndDot off drops the end dot, and strokeWidth sets the line weight', async () => {
    render({ properties: { showEndDot: binding('{{false}}'), strokeWidth: binding('{{4}}') } });

    await drawn();
    expect(document.querySelectorAll('svg circle')).toHaveLength(0);
    expect(curve().getAttribute('stroke-width')).toBe('4');
  });

  test('[ShadSparkline-PROP-005] curve linear draws straight segments; the default monotone curve bends', async () => {
    render();
    await drawn();
    expect(curve().getAttribute('d')).toContain('C');

    render({ properties: { curve: binding('linear') } });
    await drawn();
    expect(curve().getAttribute('d')).not.toContain('C');
  });

  test('[ShadSparkline-PROP-006] showTooltip shows the hovered point, wrapped in valuePrefix and valueSuffix', async () => {
    render({ properties: { showTooltip: binding('{{true}}'), valuePrefix: binding('~'), valueSuffix: binding(' k') } });
    await drawn();

    await pointer(['mousemove']);

    expect(await screen.findByText(/^~\d+ k$/)).toBeInTheDocument();
  });

  test('[ShadSparkline-PROP-007] emptyText is shown when there are no numbers to draw', async () => {
    render({ properties: { data: binding('{{[]}}'), emptyText: binding('Nothing yet') } });

    expect(await screen.findByText('Nothing yet')).toBeInTheDocument();
    await waitFor(() => expect(exposed()).toMatchObject({ trend: 'flat', lastValue: null }));
  });

  test('[ShadSparkline-PROP-008] animate turns the entrance animation on, and off', async () => {
    render({ properties: { animate: binding('{{true}}') } });
    await drawn();
    expect(animationFlags()).toEqual([true]);

    render({ properties: { animate: binding('{{false}}') } });
    await drawn();
    expect(animationFlags()).toEqual([false]);
  });

  test('[ShadSparkline-DEF-002] junk properties draw the chart or the empty message, never an error', async () => {
    for (const properties of [
      { data: binding("{{[null, 'x', {}, [], { y: 'n/a' }]}}") },
      { strokeWidth: binding('wide'), curve: binding('{{7}}'), bandMin: binding('x'), showBand: binding('{{true}}') },
    ]) {
      render({ properties });
      await waitFor(() => expect(document.querySelector('svg, button') || screen.queryByText('No data')).toBeTruthy());
      expect(screen.queryByText(/something went wrong/i)).toBeNull();
    }
  });

  test('[ShadSparkline-STY-001] chartColor, positiveColor, negativeColor and bandColor reach the sparkline as CSS variables', async () => {
    render({
      styles: {
        chartColor: binding('#e11d48'),
        positiveColor: binding('#16a34a'),
        negativeColor: binding('#dc2626'),
        bandColor: binding('#f4f4f5'),
      },
    });

    await drawn();
    const root = document.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--sc-chart-1')).toBe('#e11d48');
    expect(root.style.getPropertyValue('--lk-up')).toBe('#16a34a');
    expect(root.style.getPropertyValue('--lk-down')).toBe('#dc2626');
    expect(root.style.getPropertyValue('--lk-band')).toBe('#f4f4f5');
  });

  test('[ShadSparkline-EVT-001] a click anywhere on the sparkline fires onClick once', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onClick'));
    await drawn();

    await act(async () => fireEvent.click(document.querySelector('svg')));

    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ShadSparkline-EVT-002] a double click fires onDoubleClick once', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onDoubleClick'));
    await drawn();

    await act(async () => fireEvent.doubleClick(document.querySelector('svg')));

    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });
});
