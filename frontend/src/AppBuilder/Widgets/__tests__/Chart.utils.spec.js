import { resolveChartTitle, buildChartLayout } from '../Chart.utils';

const baseParams = {
  chartLayout: {},
  chartTitle: 'Panel Title',
  width: 400,
  height: 300,
  padding: 10,
  updatedBgColor: '#fff',
  modifiedTextColor: '#000',
  fontColor: '#000',
  modifiedGridLines: '#eee',
  modifiedAxisColor: '#ccc',
  showGridLines: true,
  showAxes: true,
  barmode: 'group',
};

describe('resolveChartTitle', () => {
  test('falls back to the properties-panel title when the JSON schema sets none', () => {
    expect(resolveChartTitle({}, 'Panel Title', true)).toBe('Panel Title');
  });

  test('a string title in the Plotly JSON schema overrides the properties-panel title', () => {
    expect(resolveChartTitle({ title: 'JSON Title' }, 'Panel Title', true)).toBe('JSON Title');
  });

  test('an object-form title in the Plotly JSON schema overrides the properties-panel title with its text', () => {
    expect(resolveChartTitle({ title: { text: 'JSON Title', font: { size: 20 } } }, 'Panel Title', true)).toBe(
      'JSON Title'
    );
  });
});

describe('buildChartLayout', () => {
  test('an object-form JSON schema title keeps its own styling instead of being flattened into text', () => {
    const chartLayout = { title: { text: 'JSON Title', font: { size: 20 }, x: 0.5 } };
    const layout = buildChartLayout({ ...baseParams, chartLayout, chartTitle: 'JSON Title' });
    expect(layout.title.text).toBe('JSON Title');
    expect(layout.title.font.size).toBe(20);
    expect(layout.title.x).toBe(0.5);
  });

  test('a full margin object from the Plotly JSON schema overrides the padding-derived default', () => {
    const chartLayout = { margin: { l: 40, r: 40, b: 40, t: 40 } };
    const layout = buildChartLayout({ ...baseParams, chartLayout });
    expect(layout.margin).toEqual({ l: 40, r: 40, b: 40, t: 40 });
  });

  test('a partial margin object from the Plotly JSON schema merges over the padding-derived default', () => {
    const chartLayout = { margin: { t: 60 } };
    const layout = buildChartLayout({ ...baseParams, chartLayout });
    expect(layout.margin).toEqual({ l: 10, r: 10, b: 10, t: 60 });
  });

  test('plot_bgcolor from the Plotly JSON schema is respected', () => {
    const chartLayout = { plot_bgcolor: '#123456' };
    const layout = buildChartLayout({ ...baseParams, chartLayout });
    expect(layout.plot_bgcolor).toBe('#123456');
  });

  test('paper_bgcolor from the Plotly JSON schema is respected', () => {
    const chartLayout = { paper_bgcolor: '#654321' };
    const layout = buildChartLayout({ ...baseParams, chartLayout });
    expect(layout.paper_bgcolor).toBe('#654321');
  });

  test('autosize: true from the Plotly JSON schema is not overridden by the widget-computed width/height', () => {
    const chartLayout = { autosize: true };
    const layout = buildChartLayout({ ...baseParams, chartLayout });
    expect(layout.autosize).toBe(true);
    expect(layout.width).toBeUndefined();
    expect(layout.height).toBeUndefined();
  });
});
