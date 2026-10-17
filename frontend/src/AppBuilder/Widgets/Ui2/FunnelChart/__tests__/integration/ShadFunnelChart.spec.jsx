/**
 * UI 2.0 Funnel chart: a bar per stage, widest first, with each stage's value and its conversion from the stage before
 * (or from the first). Plain HTML, so it needs no layout to draw.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in
 * Ui2/__tests__/integration/controlState.spec.jsx. Titles carry [ShadFunnelChart-<AREA>-<NNN>] ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'funnel1';
const widget = createWidgetHarness({
  componentType: 'ShadFunnelChart',
  handle: 'funnelChart1',
  id: ID,
  widgetHeight: 280,
  widgetWidth: 480,
  defaultProperties: { animate: binding('{{false}}') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const stages = () => screen.queryAllByRole('button');
const drawn = (count = 5) => waitFor(() => expect(stages()).toHaveLength(count));
const barOf = (stage) => stage.querySelector('.tw-rounded-\\[6px\\]');

describe('UI 2.0 Funnel chart', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadFunnelChart-DEF-001] draws a stage per row, widest first, with its value and its conversion from the one before', async () => {
    render();

    await drawn(5);
    expect(stages()[0]).toHaveTextContent('Visited');
    expect(stages()[0]).toHaveTextContent('12,480');
    expect(stages()[1]).toHaveTextContent('31.4%');
    expect(barOf(stages()[0]).style.width).toBe('100%');
    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({}));
  });

  test('[ShadFunnelChart-PROP-001] data, stageField and valueField choose the stages and their values', async () => {
    render({
      properties: {
        data: binding("{{[{ step: 'Cart', n: 200, other: 1 }, { step: 'Paid', n: 50, other: 1 }]}}"),
        stageField: binding('step'),
        valueField: binding('n'),
      },
    });

    await drawn(2);
    expect(stages()[1]).toHaveTextContent('Paid');
    expect(stages()[1]).toHaveTextContent('25%');
    expect(barOf(stages()[1]).style.width).toBe('25%');
  });

  test('[ShadFunnelChart-PROP-002] conversionBase first measures from the first stage; showConversion off hides conversions', async () => {
    render({ properties: { conversionBase: binding('first') } });
    await drawn(5);
    expect(stages()[4]).toHaveTextContent('3.3%');

    render({ properties: { showConversion: binding('{{false}}') } });
    await drawn(5);
    expect(stages().some((s) => s.textContent.includes('%'))).toBe(false);
  });

  test('[ShadFunnelChart-PROP-003] align left anchors the bars at the left; by default they are centred', async () => {
    render();
    await drawn(5);
    expect(barOf(stages()[1]).parentElement).toHaveClass('tw-justify-center');

    render({ properties: { align: binding('left') } });
    await drawn(5);
    expect(barOf(stages()[1]).parentElement).toHaveClass('tw-justify-start');
  });

  test('[ShadFunnelChart-PROP-004] colors sets the bar colour, fading stage by stage; colorByStage gives each stage its own', async () => {
    // (jsdom drops a var() background, so the colours here are plain hex.)
    const colors = binding("{{['#111111', '#222222']}}");
    render({ properties: { colors } });
    await drawn(5);
    expect(stages().every((s) => barOf(s).style.background === 'rgb(17, 17, 17)')).toBe(true);
    expect(Number(barOf(stages()[4]).style.opacity)).toBeLessThan(1);

    render({ properties: { colors, colorByStage: binding('{{true}}') } });
    await drawn(5);
    expect(barOf(stages()[0]).style.background).toBe('rgb(17, 17, 17)');
    expect(barOf(stages()[1]).style.background).toBe('rgb(34, 34, 34)');
    expect(barOf(stages()[4]).style.opacity).toBe('1');
  });

  test('[ShadFunnelChart-PROP-005] yAxisFormat and currency format the values, wrapped in valuePrefix and valueSuffix', async () => {
    render({ properties: { yAxisFormat: binding('currency'), currency: binding('EUR') } });
    await drawn(5);
    expect(stages()[0]).toHaveTextContent('€12,480');

    render({
      properties: { yAxisFormat: binding('compact'), valuePrefix: binding('~'), valueSuffix: binding(' visits') },
    });
    await drawn(5);
    expect(stages()[0]).toHaveTextContent('~12.5K visits');
  });

  test('[ShadFunnelChart-PROP-006] emptyText is shown when there is nothing to draw', async () => {
    render({ properties: { data: binding('{{[]}}'), emptyText: binding('Nothing yet') } });

    expect(await screen.findByText('Nothing yet')).toBeInTheDocument();
  });

  test('[ShadFunnelChart-PROP-007] animate grows each bar in after the one above; off, the bars are drawn at once', async () => {
    render({ properties: { animate: binding('{{true}}') } });
    await drawn(5);
    expect(stages().every((s) => barOf(s).style.animation.includes('tj-funnel-grow'))).toBe(true);

    render({ properties: { animate: binding('{{false}}') } });
    await drawn(5);
    expect(stages().every((s) => barOf(s).style.animation === '')).toBe(true);
  });

  test('[ShadFunnelChart-DEF-002] junk properties draw the chart or the empty message, never an error', async () => {
    for (const properties of [
      {
        stageField: binding('{{null}}'),
        valueField: binding('{{{}}}'),
        conversionBase: binding('{{3}}'),
        align: binding('{{[]}}'),
      },
      { data: binding("{{[null, 3, 'x', [], { stage: {}, count: 'n/a' }]}}"), colorByStage: binding('x') },
    ]) {
      render({ properties });
      await waitFor(() => expect(document.querySelector('svg, button') || screen.queryByText('No data')).toBeTruthy());
      expect(screen.queryByText(/something went wrong/i)).toBeNull();
    }
  });

  test('[ShadFunnelChart-STY-001] chartColor and axisTextColor reach the chart as CSS variables', async () => {
    render({ styles: { chartColor: binding('#e11d48'), axisTextColor: binding('#52525b') } });

    await drawn(5);
    const root = document.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--sc-chart-1')).toBe('#e11d48');
    expect(root.style.getPropertyValue('--lk-axis')).toBe('#52525b');
  });

  test('[ShadFunnelChart-EVT-001] clicking a stage exposes its row as clickedDataPoint and fires onClick, whose handler reads it', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onClick', { value: '{{components.funnelChart1.clickedDataPoint.stage}}' }));
    await drawn(5);

    await act(async () => fireEvent.click(stages()[2]));

    await waitFor(() => expect(widget.variables().seen).toBe('Activated'));
    expect(exposed().clickedDataPoint).toEqual({ stage: 'Activated', count: 2210 });
  });

  test('[ShadFunnelChart-EVT-002] a double click fires onDoubleClick once', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onDoubleClick'));
    await drawn(5);

    await act(async () => fireEvent.doubleClick(stages()[1]));

    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ShadFunnelChart-ACT-001] clearClickedPoint empties clickedDataPoint', async () => {
    render();
    await drawn(5);
    await act(async () => fireEvent.click(stages()[1]));
    await waitFor(() => expect(exposed().clickedDataPoint).toMatchObject({ stage: 'Signed up' }));

    await widget.act('clearClickedPoint');

    await waitFor(() => expect(exposed().clickedDataPoint).toEqual({}));
  });
});
