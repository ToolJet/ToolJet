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
  test('[Chart-JSON-005] falls back to the properties-panel title when the JSON schema sets none', () => {
    expect(resolveChartTitle({}, 'Panel Title', true)).toBe('Panel Title');
  });

  test('[Chart-JSON-005] a string title in the Plotly JSON schema overrides the properties-panel title', () => {
    expect(resolveChartTitle({ title: 'JSON Title' }, 'Panel Title', true)).toBe('JSON Title');
  });

  test('[Chart-JSON-005] an object-form title in the Plotly JSON schema overrides the properties-panel title with its text', () => {
    expect(resolveChartTitle({ title: { text: 'JSON Title', font: { size: 20 } } }, 'Panel Title', true)).toBe(
      'JSON Title'
    );
  });
});

describe('buildChartLayout', () => {
  test('[Chart-JSON-003] an object-form JSON schema title keeps its own styling instead of being flattened into text', () => {
    const chartLayout = { title: { text: 'JSON Title', font: { size: 20 }, x: 0.5 } };
    const layout = buildChartLayout({ ...baseParams, chartLayout, chartTitle: 'JSON Title' });
    expect(layout.title.text).toBe('JSON Title');
    expect(layout.title.font.size).toBe(20);
    expect(layout.title.x).toBe(0.5);
  });

  test('[Chart-JSON-003] a full margin object from the Plotly JSON schema overrides the padding-derived default', () => {
    const chartLayout = { margin: { l: 40, r: 40, b: 40, t: 40 } };
    const layout = buildChartLayout({ ...baseParams, chartLayout });
    expect(layout.margin).toEqual({ l: 40, r: 40, b: 40, t: 40 });
  });

  test('[Chart-JSON-003] a partial margin object from the Plotly JSON schema merges over the padding-derived default', () => {
    const chartLayout = { margin: { t: 60 } };
    const layout = buildChartLayout({ ...baseParams, chartLayout });
    expect(layout.margin).toEqual({ l: 10, r: 10, b: 10, t: 60 });
  });

  test('[Chart-JSON-003] plot_bgcolor from the Plotly JSON schema is respected', () => {
    const chartLayout = { plot_bgcolor: '#123456' };
    const layout = buildChartLayout({ ...baseParams, chartLayout });
    expect(layout.plot_bgcolor).toBe('#123456');
  });

  test('[Chart-JSON-003] paper_bgcolor from the Plotly JSON schema is respected', () => {
    const chartLayout = { paper_bgcolor: '#654321' };
    const layout = buildChartLayout({ ...baseParams, chartLayout });
    expect(layout.paper_bgcolor).toBe('#654321');
  });

  test('[Chart-JSON-003] with no JSON-supplied background, plot_bgcolor and paper_bgcolor fall back to the widget-computed color', () => {
    // Break this catches: hard-coding a literal instead of reading the
    // `updatedBgColor` parameter, which is how `styles.backgroundColor`
    // actually reaches the Plotly layout.
    const layout = buildChartLayout({ ...baseParams, updatedBgColor: '#112233' });
    expect(layout.plot_bgcolor).toBe('#112233');
    expect(layout.paper_bgcolor).toBe('#112233');
  });

  test('[Chart-JSON-003] autosize: true from the Plotly JSON schema is not overridden by the widget-computed width/height', () => {
    const chartLayout = { autosize: true };
    const layout = buildChartLayout({ ...baseParams, chartLayout });
    expect(layout.autosize).toBe(true);
    expect(layout.width).toBeUndefined();
    expect(layout.height).toBeUndefined();
  });

  test('[Chart-JSON-004] additional xaxisN/yaxisN keys in the JSON layout each receive the computed axis defaults', () => {
    // Break this catches: the `/^(xaxis|yaxis)\d+$/` regex loop being dropped
    // or only merging defaults under the primary `xaxis`/`yaxis` keys.
    const chartLayout = { xaxis2: { title: 'Second X' }, yaxis3: { title: 'Third Y' } };
    const layout = buildChartLayout({ ...baseParams, chartLayout, showGridLines: false, showAxes: false });
    expect(layout.xaxis2).toMatchObject({ showgrid: false, visible: false, title: 'Second X' });
    expect(layout.yaxis3).toMatchObject({ showgrid: false, visible: false, title: 'Third Y' });
    // The defaults still apply to the primary axes too.
    expect(layout.xaxis).toMatchObject({ showgrid: false, visible: false });
  });

  test('[Chart-RND-004] barmode reaches the layout literally, regardless of its own malformed validation schema', () => {
    // Break this catches: `barmode` being dropped or renamed on its way into
    // the layout — its validation schema (chart.js:117-120) has no top-level
    // `type`, so only this direct pass-through keeps it working.
    for (const mode of ['stack', 'group', 'overlay', 'relative']) {
      expect(buildChartLayout({ ...baseParams, barmode: mode }).barmode).toBe(mode);
    }
  });
});
