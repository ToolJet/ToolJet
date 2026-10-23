/**
 * UI 2.0 Radial chart: a progress ring (one value against a maximum, its figure in the centre) or concentric bars,
 * one per category.
 *
 * Real store, real RenderWidget, real widget and real Recharts; nothing about the widget is mocked. jsdom has no
 * layout, so the one box Recharts measures (its ResponsiveContainer) is given the widget's size; every other element
 * measures as jsdom does. Standard control behaviour (visibility, disabled, loading, tooltip) is covered for every
 * UI 2.0 widget in Ui2/__tests__/integration/controlState.spec.jsx. Titles carry [ShadRadialChart-<AREA>-<NNN>] ids.
 */
import { createWidgetHarness, measureChartsAt } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'radial1';
const W = 480;
const H = 280;
const widget = createWidgetHarness({
  componentType: 'ShadRadialChart',
  handle: 'radialChart1',
  id: ID,
  widgetHeight: H,
  widgetWidth: W,
  // Drawn at once: the entrance animation has its own scenario below.
  defaultProperties: { animate: binding('{{false}}') },
});

measureChartsAt(W, H);

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const bars = () => document.querySelectorAll('.recharts-radial-bar-sector');
const tracks = () => document.querySelectorAll('.recharts-radial-bar-background-sector');
const drawn = (count = 1) => waitFor(() => expect(bars()).toHaveLength(count));
const CATEGORIES = { mode: binding('categories'), centerLabel: binding('') };
/** The radii of the arcs in a sector's outline, largest first. */
const radii = (path) =>
  [...new Set([...path.getAttribute('d').matchAll(/A\s*([\d.]+),/g)].map((m) => Number(m[1])))].sort((a, b) => b - a);
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

describe('UI 2.0 Radial chart', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadRadialChart-DEF-001] shows the value in the centre of a progress ring drawn over its track', async () => {
    render();

    await drawn(1);
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(tracks()).toHaveLength(1);
    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({}));
  });

  test('[ShadRadialChart-PROP-001] value is filled against maxValue: 30 of 60 draws the same arc as 50 of 100', async () => {
    render({ properties: { value: binding('{{50}}'), maxValue: binding('{{100}}') } });
    await drawn(1);
    const half = bars()[0].getAttribute('d');

    render({ properties: { value: binding('{{30}}'), maxValue: binding('{{60}}') } });
    await waitFor(() => expect(screen.getByText('30%')).toBeInTheDocument());
    expect(bars()[0].getAttribute('d')).toBe(half);
  });

  test('[ShadRadialChart-PROP-002] centerValue replaces the figure, centerLabel names it, valuePrefix and valueSuffix wrap it', async () => {
    render({ properties: { centerValue: binding('On track'), centerLabel: binding('Sprint 12') } });
    await drawn(1);
    expect(screen.getByText('On track')).toBeInTheDocument();
    expect(screen.getByText('Sprint 12')).toBeInTheDocument();

    render({ properties: { valuePrefix: binding('~'), valueSuffix: binding(' pts') } });
    expect(await screen.findByText('~72 pts')).toBeInTheDocument();
  });

  test('[ShadRadialChart-PROP-003] startAngle and endAngle of a half circle make a gauge with its figure above the centre', async () => {
    render();
    await drawn(1);
    expect(screen.getByText('72%').parentElement.style.transform).toBe('translate(-50%, -50%)');

    render({ properties: { startAngle: binding('{{180}}'), endAngle: binding('{{0}}') } });
    await drawn(1);
    expect(screen.getByText('72%').parentElement.style.transform).toBe('translate(-50%, calc(-100% - 6px))');
  });

  test('[ShadRadialChart-PROP-004] thickness sets how wide the ring is drawn', async () => {
    const ringWidth = () => {
      const [outer, inner] = radii(tracks()[0]);
      return outer - inner;
    };
    render({ properties: { thickness: binding('{{10}}') } });
    await drawn(1);
    const thin = ringWidth();

    render({ properties: { thickness: binding('{{30}}') } });
    await drawn(1);
    expect(ringWidth() / thin).toBeCloseTo(3, 1);
  });

  test('[ShadRadialChart-PROP-005] rounded off draws square bar ends, and showTrack off removes the track', async () => {
    const arcs = () => (bars()[0].getAttribute('d').match(/A/g) || []).length;
    render();
    await drawn(1);
    // Two arcs for the ring's sides, plus four rounded corners.
    expect(arcs()).toBe(6);

    render({ properties: { rounded: binding('{{false}}'), showTrack: binding('{{false}}') } });
    await drawn(1);
    expect(arcs()).toBe(2);
    expect(tracks()).toHaveLength(0);
  });

  test('[ShadRadialChart-PROP-006] mode categories draws a ring per row of data, named by categoryField, with a legend', async () => {
    render({ properties: CATEGORIES });

    await drawn(4);
    expect(document.body).toHaveTextContent('DirectSearchSocialEmail');
  });

  test('[ShadRadialChart-PROP-007] categoryField and valueField choose the names and values; showLegend off hides the names', async () => {
    const data = binding(
      "{{[{ kind: 'Ads', channel: 'Direct', visitors: 5, other: 90 }, { kind: 'Mail', visitors: 90, other: 5 }]}}"
    );
    const square = { ...CATEGORIES, data, rounded: binding('{{false}}') };
    // Whether a ring sweeps more than half way round (the large-arc flag of its outer edge). The first row is the
    // outer ring, drawn last.
    const pastHalf = () => [...bars()].map((b) => /A\s*[\d.]+,\s*[\d.]+,\s*0,\s*(\d)/.exec(b.getAttribute('d'))[1]);
    render({ properties: square });
    await drawn(2);
    expect(pastHalf()).toEqual(['1', '0']); // Mail 90 of 100, Ads 5

    render({ properties: { ...square, categoryField: binding('kind'), valueField: binding('other') } });
    await drawn(2);
    expect(screen.getByText('Ads')).toBeInTheDocument();
    expect(pastHalf()).toEqual(['0', '1']); // Mail 5, Ads 90

    render({ properties: { ...CATEGORIES, data, categoryField: binding('kind'), showLegend: binding('{{false}}') } });
    await drawn(2);
    expect(screen.queryByText('Ads')).toBeNull();
  });

  test('[ShadRadialChart-PROP-008] colors sets the ring colours', async () => {
    render({ properties: { ...CATEGORIES, colors: binding("{{['#111111', '#222222', '#333333', '#444444']}}") } });

    await drawn(4);
    // The first row is the outer ring, drawn last.
    expect([...bars()].map((b) => b.getAttribute('fill'))).toEqual(['#444444', '#333333', '#222222', '#111111']);
  });

  test('[ShadRadialChart-PROP-009] emptyText is shown when there is nothing to draw', async () => {
    render({ properties: { ...CATEGORIES, data: binding('{{[]}}'), emptyText: binding('Nothing yet') } });

    expect(await screen.findByText('Nothing yet')).toBeInTheDocument();
  });

  test('[ShadRadialChart-PROP-010] animate turns the ring entrance animation on, and off', async () => {
    render({ properties: { animate: binding('{{true}}') } });
    await waitFor(() => expect(animationFlags()).toEqual([true]));

    render({ properties: { animate: binding('{{false}}') } });
    await drawn(1);
    expect(animationFlags()).toEqual([false]);
  });

  test('[ShadRadialChart-DEF-002] junk properties draw the chart or the empty message, never an error', async () => {
    for (const properties of [
      { value: binding('abc'), maxValue: binding('{{-5}}'), startAngle: binding('x'), endAngle: binding('{{null}}') },
      { mode: binding('categories'), data: binding("{{[{ channel: null, visitors: -10 }, { visitors: '1e309' }]}}") },
      { thickness: binding('{{{}}}'), colors: binding('red') },
    ]) {
      render({ properties });
      await waitFor(() => expect(document.querySelector('svg, button') || screen.queryByText('No data')).toBeTruthy());
      expect(screen.queryByText(/something went wrong/i)).toBeNull();
    }
  });

  test('[ShadRadialChart-STY-001] chartColor, trackColor, legendTextColor and the centre colours reach the chart as CSS variables', async () => {
    render({
      styles: {
        chartColor: binding('#e11d48'),
        trackColor: binding('#f4f4f5'),
        legendTextColor: binding('#3f3f46'),
        centerValueColor: binding('#18181b'),
        centerLabelColor: binding('#71717a'),
      },
    });

    await drawn(1);
    const root = document.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--sc-chart-1')).toBe('#e11d48');
    expect(root.style.getPropertyValue('--lk-track')).toBe('#f4f4f5');
    expect(root.style.getPropertyValue('--lk-legend')).toBe('#3f3f46');
    expect(root.style.getPropertyValue('--lk-center-value')).toBe('#18181b');
    expect(root.style.getPropertyValue('--lk-center-label')).toBe('#71717a');
  });

  test('[ShadRadialChart-EVT-001] clicking a ring exposes its row as clickedDataPoint and fires onClick, whose handler reads it', async () => {
    render({ properties: CATEGORIES });
    widget.setEvents(setVariableOn(ID, 'onClick', { value: '{{components.radialChart1.clickedDataPoint.channel}}' }));
    await drawn(4);

    await act(async () => fireEvent.click(bars()[3]));

    await waitFor(() => expect(widget.variables().seen).toBe('Direct'));
    expect(exposed().clickedDataPoint).toEqual({ channel: 'Direct', visitors: 275 });
  });

  test('[ShadRadialChart-EVT-002] a double click fires onDoubleClick once', async () => {
    render({ properties: CATEGORIES });
    widget.setEvents(countInvocationsOn(ID, 'onDoubleClick'));
    await drawn(4);

    await act(async () => fireEvent.doubleClick(bars()[0]));

    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ShadRadialChart-ACT-001] clearClickedPoint empties clickedDataPoint', async () => {
    render({ properties: CATEGORIES });
    await drawn(4);
    await act(async () => fireEvent.click(bars()[3]));
    await waitFor(() => expect(exposed().clickedDataPoint).toMatchObject({ channel: 'Direct' }));

    await widget.act('clearClickedPoint');

    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({}));
  });

  test('[ShadRadialChart-PROP-020] Highlight clicked point fades the other rings until the clicked point is cleared', async () => {
    render({ properties: { ...CATEGORIES, highlightClicked: binding('{{true}}') } });
    await drawn(4);
    const faded = () =>
      [...document.querySelectorAll('.recharts-radial-bar-sector')].filter(
        (b) => b.getAttribute('fill-opacity') === '0.35'
      ).length;
    await act(async () => fireEvent.click(bars()[3]));
    await waitFor(() => expect(faded()).toBe(3));
    await widget.act('clearClickedPoint');
    await waitFor(() => expect(faded()).toBe(0));
  });
});
