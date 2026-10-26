/**
 * Chart: the approved contract at
 * frontend/ee/test/app-builder/widgets/Chart/TESTING.md.
 *
 * Real store, real RenderWidget, real Chart / react-plotly.js / Plotly. Nothing
 * about the widget is mocked — the harness only stubs `canvas.getContext`
 * (see src/test/setupTests.js), which keeps the real Plotly SVG rendering path
 * live in jsdom.
 *
 * Test titles carry their approved scenario ID
 * (frontend/ee/test/app-builder/widgets/Chart/TESTING.md) as a
 * `[Chart-FAMILY-NNN]` prefix, per the widget-testing-contract validator.
 */
import { waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'chart1';
const NAME = 'chart1';

const widget = createWidgetHarness({
  componentType: 'Chart',
  handle: NAME,
  id: ID,
  // Baseline mirrors chart.js's own `definition.properties`/`definition.styles`.
  defaultProperties: {
    title: binding('Test Chart'),
    data: binding('{{ [{ x: "Jan", y: 10 }, { x: "Feb", y: 20 }] }}'),
    type: binding('line'),
    markerColor: binding('#ff0000'),
    showAxes: binding('{{true}}'),
    showGridLines: binding('{{true}}'),
    plotFromJson: binding('{{false}}'),
    jsonDescription: binding('{}'),
    barmode: binding('group'),
    loadingState: binding('{{false}}'),
  },
  defaultStyles: {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('#445566'),
    borderRadius: binding('{{6}}'),
    padding: binding('{{10}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
  },
});

const root = () => document.querySelector('.widget-chart');
const svg = () => document.querySelector('.widget-chart svg.main-svg');
const linePaths = () => document.querySelectorAll('.scatterlayer .js-line');
const pointPaths = () => document.querySelectorAll('.scatterlayer .point');
const pieSlices = () => document.querySelectorAll('.slice');
const sliceLabels = () => [...document.querySelectorAll('text.slicetext')].map((node) => node.textContent);

describe('Chart: default rendering and data', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Chart-RND-001] default line chart renders configured title, data, and marker color', async () => {
    // Break this catches: swapping the x/y mapping in computeChartData, or
    // dropping `marker: { color: modifiedMarkerColor }` from the non-pie branch.
    widget.render();

    await waitFor(() => expect(svg()).toBeTruthy());
    expect(document.querySelector('.gtitle')?.textContent).toBe('Test Chart');
    await waitFor(() => expect(linePaths().length).toBeGreaterThan(0));
    expect(linePaths()[0].getAttribute('style')).toContain('stroke: rgb(255, 0, 0)');
  });

  test('[Chart-RND-002] data and type changes update the rendered trace without remount', async () => {
    // Break this catches: `useMemo`'s dependency array dropping `data`, which
    // would keep rendering the FIRST render's trace forever.
    widget.render();
    await waitFor(() => expect(pointPaths()).toHaveLength(2));

    widget.setComponentProperty(
      ID,
      'data',
      '{{ [{ x: "Jan", y: 1 }, { x: "Feb", y: 2 }, { x: "Mar", y: 3 }] }}',
      'properties'
    );
    await waitFor(() => expect(pointPaths()).toHaveLength(3));
  });

  test('[Chart-RND-002] empty and non-array data render an empty trace instead of throwing', async () => {
    // Break this catches: computeChartData not clamping a non-array resolved
    // value to `[]` before mapping over it, which would throw at render time.
    // A string that parses to a JSON NUMBER (not an array) exercises the
    // `!Array.isArray(rawData)` guard specifically, distinct from the
    // JSON.parse-failure branch above it.
    widget.render({ properties: { data: binding('{{ "42" }}') } });

    await waitFor(() => expect(svg()).toBeTruthy());
    expect(pointPaths()).toHaveLength(0);
  });

  test('[Chart-RND-003] pie chart type reshapes data into values/labels and ignores marker color', async () => {
    // Break this catches: swapping labels/values (x maps to labels, y maps to
    // values) or accidentally applying `modifiedMarkerColor` to pie slices.
    widget.render({ properties: { type: binding('pie') } });

    await waitFor(() => expect(pieSlices()).toHaveLength(2));
    // Plotly's default pie textinfo shows the value's share, not the label —
    // 10/(10+20) and 20/(10+20) prove `values` (not `x`) came from `y`.
    expect(sliceLabels().sort()).toEqual(['33.3%', '66.7%']);
    const sliceFills = [...document.querySelectorAll('.slice path.surface')].map((node) => node.getAttribute('style'));
    expect(sliceFills.some((style) => style.includes('rgb(255, 0, 0)'))).toBe(false);
  });
});

describe('Chart: Plotly-JSON schema mode', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Chart-JSON-001] plotFromJson switches between properties-panel and JSON data sources', async () => {
    // Break this catches: not re-deriving the rendered trace when
    // `plotFromJson` flips, or losing the properties-panel `data` while JSON
    // mode was active.
    widget.render();
    await waitFor(() => expect(pointPaths()).toHaveLength(2));

    widget.setComponentProperty(ID, 'plotFromJson', '{{true}}', 'properties');
    widget.setComponentProperty(
      ID,
      'jsonDescription',
      JSON.stringify({ data: [{ x: ['A', 'B', 'C'], y: [1, 2, 3], type: 'bar' }] }),
      'properties'
    );
    await waitFor(() => expect(document.querySelectorAll('.bars .point')).toHaveLength(3));

    widget.setComponentProperty(ID, 'plotFromJson', '{{false}}', 'properties');
    await waitFor(() => expect(pointPaths()).toHaveLength(2));
  });

  test('[Chart-JSON-002] an invalid Plotly JSON schema characterizes to an empty chart', async () => {
    // Break this catches: an unhandled parse exception crashing the render
    // instead of the widget falling back to an empty chart (per D-02).
    widget.render({
      properties: { plotFromJson: binding('{{true}}'), jsonDescription: binding('{ this is not json') },
    });

    await waitFor(() => expect(svg()).toBeTruthy());
    expect(pointPaths()).toHaveLength(0);
    expect(document.querySelectorAll('.bars .point')).toHaveLength(0);
  });

  test('[Chart-JSON-005] exposed title/axis-title variables follow the Plotly-JSON layout when present', async () => {
    // Break this catches: reading `.title`/`.text` inconsistently between the
    // object and string forms, or exposing axis titles outside JSON mode.
    widget.render();
    await waitFor(() => expect(svg()).toBeTruthy());
    expect(widget.exposed().xAxisTitle).toBeUndefined();

    widget.setComponentProperty(ID, 'plotFromJson', '{{true}}', 'properties');
    widget.setComponentProperty(
      ID,
      'jsonDescription',
      JSON.stringify({
        data: [{ x: ['Jan'], y: [1], type: 'bar' }],
        layout: { title: { text: 'JSON Title' }, xaxis: { title: 'X Axis' }, yaxis: { title: { text: 'Y Axis' } } },
      }),
      'properties'
    );

    await waitFor(() => expect(widget.exposed().chartTitle).toBe('JSON Title'));
    expect(widget.exposed().xAxisTitle).toBe('X Axis');
    expect(widget.exposed().yAxisTitle).toBe('Y Axis');
  });
});

describe('Chart: styles, visibility, disabled, and loading', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Chart-STY-001] border color and border radius apply to the widget root', async () => {
    // Break this catches: reading the wrong style keys into `computedStyles`,
    // or a state toggle elsewhere in the component clobbering the root style.
    widget.render();
    await waitFor(() => expect(root()).toBeTruthy());
    expect(root().getAttribute('style')).toContain('border: 1px solid #445566');
    expect(root().getAttribute('style')).toContain('border-radius: 6px');

    widget.setComponentProperty(ID, 'disabledState', '{{true}}', 'styles');
    await waitFor(() => expect(root()).toHaveAttribute('data-disabled', 'true'));
    expect(root().getAttribute('style')).toContain('border: 1px solid #445566');
  });

  test('[Chart-VIS-001] visibility hides the chart without unmounting it', async () => {
    // Break this catches: conditionally unmounting the Plot component on
    // `visibility` instead of only toggling `display`, which would lose or
    // remount Plotly's internal state.
    widget.render();
    await waitFor(() => expect(svg()).toBeTruthy());
    const mountedSvg = svg();
    expect(document.querySelector('.gtitle')?.textContent).toBe('Test Chart');

    widget.setComponentProperty(ID, 'visibility', '{{false}}', 'styles');
    await waitFor(() => expect(root()).toHaveAttribute('style', expect.stringContaining('display: none')));
    expect(svg()).toBe(mountedSvg);

    widget.setComponentProperty(ID, 'visibility', '{{true}}', 'styles');
    await waitFor(() => expect(root().getAttribute('style')).not.toContain('display: none'));
    expect(document.querySelector('.gtitle')?.textContent).toBe('Test Chart');
  });

  test('[Chart-DIS-001] disabled state exposes data-disabled independent of click delivery', async () => {
    // Break this catches: `disabledState` not reaching the root attribute, or
    // being conflated with hiding/unmounting the chart.
    widget.render();
    await waitFor(() => expect(root()).toHaveAttribute('data-disabled', 'false'));

    widget.setComponentProperty(ID, 'disabledState', '{{true}}', 'styles');
    await waitFor(() => expect(root()).toHaveAttribute('data-disabled', 'true'));
    expect(svg()).toBeTruthy();
  });

  test('[Chart-LOAD-001] loading state shows a spinner instead of the Plotly chart', async () => {
    // Break this catches: the loader/chart ternary reading the wrong flag, or
    // the `properties.loadingState` -> internal state sync effect being dropped.
    widget.render({ properties: { loadingState: binding('{{true}}') } });
    await waitFor(() => expect(document.querySelector('.spinner-border')).toBeTruthy());
    expect(svg()).toBeNull();

    widget.setComponentProperty(ID, 'loadingState', '{{false}}', 'properties');
    await waitFor(() => expect(svg()).toBeTruthy());
    expect(document.querySelector('.spinner-border')).toBeNull();
  });
});

describe('Chart: exposed variables and CSA', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Chart-EVT-001] clickedDataPoint initializes empty and resets via clearClickedPoint', async () => {
    // Break this catches: `clearClickedPoint` resetting to something other
    // than `{}` (e.g. `null`/`undefined`), or the action not being registered.
    widget.render();
    await waitFor(() => expect(svg()).toBeTruthy());
    expect(widget.exposed().clickedDataPoint).toEqual({});

    widget.setExposedValue(ID, 'clickedDataPoint', { xAxisLabel: 'Jan', dataValue: 10 });
    await waitFor(() => expect(widget.exposed().clickedDataPoint).toEqual({ xAxisLabel: 'Jan', dataValue: 10 }));

    await widget.act('clearClickedPoint');
    await waitFor(() => expect(widget.exposed().clickedDataPoint).toEqual({}));
  });
});

describe('Chart: instance isolation', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Chart-ISO-001] two Chart instances keep independent data, title, and click state', async () => {
    // Break this catches: a module-level cache in `computeChartData`/
    // `PlotComponent`'s memo comparator leaking state between two mounted
    // Chart instances.
    const chart2 = componentDefinition('chart2', 'chart2', 'Chart', {
      title: binding('Second Chart'),
      data: binding('{{ [{ x: "X", y: 99 }] }}'),
      type: binding('line'),
    });

    widget.render({
      extraComponents: { chart2 },
      also: [{ id: 'chart2', componentType: 'Chart' }],
    });

    await waitFor(() => expect(document.querySelectorAll('.widget-chart .js-plotly-plot')).toHaveLength(2));
    const titles = [...document.querySelectorAll('.gtitle')].map((node) => node.textContent);
    expect(titles.sort()).toEqual(['Second Chart', 'Test Chart']);

    // Same `type` ('line'), different `data` — a shared-by-type cache in
    // computeChartData would collapse these to the same point count.
    const plots = document.querySelectorAll('.widget-chart .js-plotly-plot');
    expect(plots[0].querySelectorAll('.point')).toHaveLength(2);
    expect(plots[1].querySelectorAll('.point')).toHaveLength(1);

    widget.setExposedValue(ID, 'clickedDataPoint', { xAxisLabel: 'Jan' });
    await waitFor(() => expect(widget.exposed('chart1').clickedDataPoint).toEqual({ xAxisLabel: 'Jan' }));
    expect(widget.exposed('chart2').clickedDataPoint).toEqual({});
  });
});
