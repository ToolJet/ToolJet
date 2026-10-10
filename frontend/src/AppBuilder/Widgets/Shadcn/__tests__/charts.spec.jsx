import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import {
  shadLineChartConfig,
  shadRadarChartConfig,
  shadRadialChartConfig,
  shadSparklineConfig,
} from '../../../WidgetManager/shadcnSource.charts';
import { ShadLineChart, ShadRadarChart, ShadRadialChart, ShadSparkline } from '../ShadCharts';

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

  it.each(JUNK.map((junk) => [JSON.stringify(junk), junk]))('never throws on junk %s', (_, junk) => {
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
