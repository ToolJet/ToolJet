import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import {
  shadComboChartConfig,
  shadFunnelChartConfig,
  shadHeatmapChartConfig,
  shadScatterChartConfig,
  shadLineChartConfig,
  shadRadarChartConfig,
  shadRadialChartConfig,
  shadSparklineConfig,
} from '../../../WidgetManager/shadcnSource.charts';
import {
  ShadComboChart,
  ShadFunnelChart,
  ShadHeatmapChart,
  ShadLineChart,
  ShadRadarChart,
  ShadRadialChart,
  ShadScatterChart,
  ShadSparkline,
} from '../ShadCharts';

// jsdom has no layout: give the charts a fixed box instead of measuring one.
jest.mock('recharts', () => {
  const actual = jest.requireActual('recharts');
  const React = jest.requireActual('react');
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 480, height: 280 }}>{React.cloneElement(children, { width: 480, height: 280 })}</div>
    ),
  };
});

// The config defaults as ToolJet resolves them ('{{[...]}}' is code).
const defaultsOf = (config) =>
  Object.fromEntries(
    Object.entries(config.definition.properties).map(([key, { value }]) => {
      const m = typeof value === 'string' && value.match(/^\{\{([\s\S]*)\}\}$/);
      // eslint-disable-next-line no-new-func
      return [key, m ? new Function(`return (${m[1]});`)() : value];
    })
  );

const mount = (Widget, config, properties = {}) => {
  const exposed = {};
  const events = [];
  const utils = render(
    <Widget
      id="c1"
      componentType={config.name}
      height={280}
      width={480}
      properties={{ ...defaultsOf(config), animate: false, ...properties }}
      styles={{}}
      setExposedVariables={(values) => Object.assign(exposed, values)}
      setExposedVariable={(key, value) => (exposed[key] = value)}
      fireEvent={(name) => events.push(name)}
    />
  );
  return { ...utils, exposed, events };
};

const JUNK = [
  { data: null },
  { data: 'oops' },
  { data: [null, 3, 'x', [], { month: {}, revenue: 'n/a' }] },
  { data: [{ month: 'Jan', revenue: 'NaN' }], yFields: { a: 1 }, xField: null },
  { yFields: null, categoryField: 42, valueField: undefined, strokeWidth: 'wide', curve: 7, gridShape: {} },
  { value: 'abc', maxValue: -5, startAngle: 'x', endAngle: null, thickness: {}, colors: 'red' },
  { mode: 'categories', data: [{ channel: null, visitors: -10 }, { visitors: '1e309' }] },
  { referenceValue: 'x', yAxisFormat: 'weird', currency: '!!', fillOpacity: 9, dashedFields: [null] },
];

const WIDGETS = [
  ['ShadLineChart', ShadLineChart, shadLineChartConfig],
  ['ShadRadarChart', ShadRadarChart, shadRadarChartConfig],
  ['ShadRadialChart', ShadRadialChart, shadRadialChartConfig],
  ['ShadSparkline', ShadSparkline, shadSparklineConfig],
  ['ShadComboChart', ShadComboChart, shadComboChartConfig],
  ['ShadScatterChart', ShadScatterChart, shadScatterChartConfig],
];

const JUNK_MORE = [
  { barFields: null, lineFields: 7, rightAxisFields: {}, stackBars: 'yes', rightAxisFormat: 9 },
  { sizeField: {}, groupField: [], nameField: null, referenceX: 'x', referenceY: {}, pointSize: -3, xAxisFormat: 1 },
  { stageField: null, valueField: {}, conversionBase: 3, align: [], colorByStage: 'x' },
];

describe.each(WIDGETS)('%s', (name, Widget, config) => {
  it('renders its defaults as a chart', () => {
    const { container } = mount(Widget, config);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.textContent).not.toContain('No data');
  });

  it('shows the empty message for no data', () => {
    const empty = name === 'ShadRadialChart' ? { value: null, data: [] } : { data: [] };
    const { container } = mount(Widget, config, { ...empty, emptyText: 'Nothing yet' });
    expect(container.textContent).toContain('Nothing yet');
  });

  it.each([...JUNK, ...JUNK_MORE].map((junk) => [JSON.stringify(junk), junk]))('never throws on junk %s', (_, junk) => {
    // Not even caught by the chart's error boundary (React reports those as console errors).
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => mount(Widget, config, junk)).not.toThrow();
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('shows the loading look', () => {
    const { container } = mount(Widget, config, { loadingState: true });
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
    expect(container.querySelector('svg')).toBeNull();
  });
});

describe('ShadLineChart', () => {
  it('draws a line per series, dashed where asked, and a labelled target line', () => {
    const { container } = mount(ShadLineChart, shadLineChartConfig, {
      dashedFields: 'expenses',
      referenceValue: 25000,
      referenceLabel: 'Target',
    });
    const lines = container.querySelectorAll('.recharts-line-curve');
    expect(lines).toHaveLength(2);
    expect(lines[0].getAttribute('stroke-dasharray')).toBeNull();
    expect(lines[1].getAttribute('stroke-dasharray')).toBe('6 4');
    expect(container.querySelector('.recharts-reference-line')).toBeTruthy();
    expect(container.textContent).toContain('Target');
    // Currency ticks, abbreviated.
    expect(container.textContent).toContain('$32K');
  });

  it('sets clickedDatum and fires onClick for the clicked point', () => {
    const { container, exposed, events } = mount(ShadLineChart, shadLineChartConfig);
    const wrapper = container.querySelector('.recharts-wrapper');
    // jsdom's mouse events have no page coordinates, which Recharts reads.
    const click = new MouseEvent('click', { bubbles: true, clientX: 250, clientY: 120 });
    Object.defineProperties(click, { pageX: { value: 250 }, pageY: { value: 120 } });
    fireEvent(wrapper, click);
    expect(events).toEqual(['onClick']);
    expect(exposed.clickedDatum).toMatchObject({ month: expect.any(String), revenue: expect.any(Number) });
  });
});

describe('ShadRadarChart', () => {
  it('draws a filled polygon per series on a circle grid', () => {
    const { container } = mount(ShadRadarChart, shadRadarChartConfig, { gridShape: 'circle', fillOpacity: 0.3 });
    const polygons = container.querySelectorAll('.recharts-radar-polygon path');
    expect(polygons).toHaveLength(2);
    expect(polygons[0].getAttribute('fill-opacity')).toBe('0.3');
    expect(container.querySelector('.recharts-polar-grid-concentric-circle')).toBeTruthy();
  });
});

describe('ShadRadialChart', () => {
  it('shows the value in the centre of a progress ring', () => {
    const { container } = mount(ShadRadialChart, shadRadialChartConfig);
    expect(container.textContent).toContain('72%');
    expect(container.textContent).toContain('Completed');
  });

  it('draws concentric bars per category with a legend, and reports the clicked one', () => {
    const { container, exposed, events } = mount(ShadRadialChart, shadRadialChartConfig, {
      mode: 'categories',
      centerLabel: '',
    });
    const bars = container.querySelectorAll('.recharts-radial-bar-sector');
    expect(bars).toHaveLength(4);
    expect(container.textContent).toContain('Direct');
    fireEvent.click(bars[3]);
    expect(events).toEqual(['onClick']);
    expect(exposed.clickedDatum).toEqual({ channel: 'Direct', visitors: 275 });
  });
});

describe('ShadSparkline', () => {
  it('exposes the trend and last value, and fires onClick', () => {
    const { container, exposed, events } = mount(ShadSparkline, shadSparklineConfig, {
      data: [5, 4, 2],
      colorByTrend: true,
    });
    expect(exposed).toMatchObject({ trend: 'down', lastValue: 2 });
    expect(container.querySelector('.recharts-area-curve').getAttribute('stroke')).toBe(
      'var(--lk-down, var(--sc-destructive))'
    );
    fireEvent.click(container.querySelector('svg'));
    expect(events).toEqual(['onClick']);
  });

  it('draws a line with an end dot and a band', () => {
    const { container } = mount(ShadSparkline, shadSparklineConfig, {
      type: 'line',
      showBand: true,
      data: [
        { x: 'Mon', y: 3 },
        { x: 'Tue', y: 7 },
      ],
    });
    expect(container.querySelector('.recharts-line-curve')).toBeTruthy();
    expect(container.querySelector('.recharts-reference-area')).toBeTruthy();
    expect(container.querySelectorAll('circle')).toHaveLength(1);
  });
});

describe('ShadComboChart', () => {
  it('draws bars and a line, the line on a right percent axis', () => {
    const { container } = mount(ShadComboChart, shadComboChartConfig);
    expect(container.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(6);
    expect(container.querySelectorAll('.recharts-line-curve')).toHaveLength(1);
    expect(container.querySelectorAll('.recharts-yAxis')).toHaveLength(2);
    expect(container.textContent).toContain('%');
    expect(container.textContent).toContain('$');
  });

  it('has one axis when nothing is on the right', () => {
    const { container } = mount(ShadComboChart, shadComboChartConfig, { rightAxisFields: [] });
    expect(container.querySelectorAll('.recharts-yAxis')).toHaveLength(1);
  });
});

describe('ShadScatterChart', () => {
  it('draws a point per row, one legend entry per group', () => {
    const { container } = mount(ShadScatterChart, shadScatterChartConfig);
    expect(container.querySelectorAll('.recharts-scatter-symbol')).toHaveLength(8);
    expect(container.textContent).toContain('Enterprise');
    expect(container.textContent).toContain('Revenue ($k)');
  });
});

describe('ShadFunnelChart', () => {
  it('draws a stage per row with its value and conversion from the one before', () => {
    const { container } = mount(ShadFunnelChart, shadFunnelChartConfig);
    const stages = container.querySelectorAll('button');
    expect(stages).toHaveLength(5);
    expect(stages[0].textContent).toContain('Visited');
    expect(stages[0].textContent).toContain('12,480');
    expect(stages[1].textContent).toContain('31.4%');
  });

  it('measures conversion from the first stage when asked', () => {
    const { container } = mount(ShadFunnelChart, shadFunnelChartConfig, { conversionBase: 'first' });
    expect(container.querySelectorAll('button')[4].textContent).toContain('3.3%');
  });

  it('sets clickedDatum to the clicked stage row and fires onClick', () => {
    const { container, exposed, events } = mount(ShadFunnelChart, shadFunnelChartConfig);
    fireEvent.click(container.querySelectorAll('button')[2]);
    expect(exposed.clickedDatum).toEqual({ stage: 'Activated', count: 2210 });
    expect(events).toEqual(['onClick']);
  });

  it('shows the empty message and never throws on junk', () => {
    const { container } = mount(ShadFunnelChart, shadFunnelChartConfig, { data: [], emptyText: 'Nothing yet' });
    expect(container.textContent).toContain('Nothing yet');
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
    [...JUNK, ...JUNK_MORE].forEach((junk) => mount(ShadFunnelChart, shadFunnelChartConfig, junk));
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });
});

describe('ShadHeatmapChart', () => {
  it('draws a cell per row and column, the strongest in the chart colour', () => {
    const { container } = mount(ShadHeatmapChart, shadHeatmapChartConfig);
    const cells = container.querySelectorAll('button');
    expect(cells).toHaveLength(7 * 6);
    expect(container.textContent).toContain('Mon');
    expect([...cells].some((c) => c.dataset.strength === '1.00')).toBe(true);
    expect([...cells].some((c) => c.dataset.strength === '0.00')).toBe(true);
  });

  it('prints values when asked and sets clickedDatum to the clicked cell', () => {
    const data = [
      { day: 'Mon', hour: '09:00', tickets: 4 },
      { day: 'Tue', hour: '09:00', tickets: 9 },
    ];
    const { container, exposed, events } = mount(ShadHeatmapChart, shadHeatmapChartConfig, { data, showValues: true });
    expect(container.textContent).toContain('9');
    fireEvent.click(container.querySelectorAll('button')[1]);
    expect(exposed.clickedDatum).toEqual({ day: 'Tue', hour: '09:00', tickets: 9 });
    expect(events).toEqual(['onClick']);
  });

  it('shows the empty message and never throws on junk', () => {
    const { container } = mount(ShadHeatmapChart, shadHeatmapChartConfig, { data: [], emptyText: 'Nothing yet' });
    expect(container.textContent).toContain('Nothing yet');
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
    [...JUNK, ...JUNK_MORE, { xOrder: 'x', yOrder: {}, cellGap: 'big', showValues: 'yes' }].forEach((junk) =>
      mount(ShadHeatmapChart, shadHeatmapChartConfig, junk)
    );
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });
});
