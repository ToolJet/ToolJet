/**
 * Plotly 2.x -> 4.x compatibility layer — translation rules.
 *
 * `applyPlotlyCompat` rewrites author-written Plotly JSON so specs authored
 * against Plotly 2.x keep working under Plotly 4, which removed a lot of syntax
 * SILENTLY: the chart still draws, it just ignores what it no longer knows. A
 * filter that stops filtering shows rows the author meant to hide, with nothing
 * logged anywhere.
 *
 * These are unit tests of the rules themselves. They are deliberately paired
 * with `__tests__/integration/chartPlotlyCompat.spec.jsx`, which renders through
 * real Plotly — because a unit test can only assert that the output matches what
 * *I believed* Plotly 2.x did. Twice during this work that belief was wrong
 * (`bardir` also swapped x/y; `stddev` defaults to the sample formula, not the
 * population one) and only rendering against the real library caught it. Keep
 * both layers: this one pins the rules, that one pins the behaviour.
 */

import tinycolor from 'tinycolor2';
import { applyPlotlyCompat } from '@/AppBuilder/Widgets/plotlyCompat';

const run = (data, layout = {}) => applyPlotlyCompat(data, layout, tinycolor);

describe('plotlyCompat: deprecated title attributes', () => {
  test('a colorbar title given as text keeps its text and side', () => {
    const { data } = run([{ type: 'heatmap', z: [[1]], colorbar: { title: 'Scale', titleside: 'right' } }]);
    expect(data[0].colorbar.title).toEqual({ text: 'Scale', side: 'right' });
  });

  test('a pie title keeps its text and position', () => {
    const { data } = run([{ type: 'pie', values: [1], labels: ['a'], title: 'P', titleposition: 'top center' }]);
    expect(data[0].title).toEqual({ text: 'P', position: 'top center' });
  });
});

describe('plotlyCompat: transforms are reimplemented', () => {
  test('filter keeps only the rows matching the operation', () => {
    const { data } = run([
      {
        x: ['a', 'b', 'c'],
        y: [1, 2, 3],
        type: 'bar',
        transforms: [{ type: 'filter', target: 'y', operation: '>', value: 1 }],
      },
    ]);
    expect(data[0].x).toEqual(['b', 'c']);
    expect(data[0].y).toEqual([2, 3]);
  });

  test('filter supports range operations', () => {
    const { data } = run([
      {
        x: [1, 2, 3, 4],
        y: [1, 2, 3, 4],
        type: 'bar',
        transforms: [{ type: 'filter', target: 'x', operation: '[]', value: [2, 3] }],
      },
    ]);
    expect(data[0].x).toEqual([2, 3]);
  });

  test('aggregate sums each group', () => {
    const { data } = run([
      {
        x: ['a', 'a', 'b'],
        y: [1, 2, 3],
        type: 'bar',
        transforms: [{ type: 'aggregate', groups: 'x', aggregations: [{ target: 'y', func: 'sum' }] }],
      },
    ]);
    expect(data[0].x).toEqual(['a', 'b']);
    expect(data[0].y).toEqual([3, 3]);
  });

  test('aggregate averages each group', () => {
    const { data } = run([
      {
        x: ['a', 'a', 'b'],
        y: [1, 2, 3],
        type: 'bar',
        transforms: [{ type: 'aggregate', groups: 'x', aggregations: [{ target: 'y', func: 'avg' }] }],
      },
    ]);
    expect(data[0].y).toEqual([1.5, 3]);
  });

  test('stddev uses the sample formula, matching Plotly’s default funcmode', () => {
    // Plotly's `funcmode` defaults to 'sample' (normalise by N-1). Using the
    // population formula puts plausible-but-wrong numbers on a chart, which is
    // exactly the failure this whole layer exists to prevent.
    const { data } = run([
      {
        x: ['a', 'a', 'a'],
        y: [1, 2, 2],
        type: 'bar',
        transforms: [{ type: 'aggregate', groups: 'x', aggregations: [{ target: 'y', func: 'stddev' }] }],
      },
    ]);
    expect(data[0].y[0]).toBeCloseTo(0.5773502691896258, 10);
  });

  test('stddev honours an explicit population funcmode', () => {
    const { data } = run([
      {
        x: ['a', 'a', 'a'],
        y: [1, 2, 2],
        type: 'bar',
        transforms: [
          { type: 'aggregate', groups: 'x', aggregations: [{ target: 'y', func: 'stddev', funcmode: 'population' }] },
        ],
      },
    ]);
    expect(data[0].y[0]).toBeCloseTo(0.4714045207910317, 10);
  });

  test('groupby fans one trace out into a trace per group', () => {
    const { data } = run([
      {
        x: ['a', 'b', 'c', 'd'],
        y: [1, 2, 3, 4],
        type: 'bar',
        transforms: [{ type: 'groupby', groups: ['g1', 'g1', 'g2', 'g2'] }],
      },
    ]);
    expect(data).toHaveLength(2);
    expect(data[0].y).toEqual([1, 2]);
    expect(data[1].y).toEqual([3, 4]);
  });

  test('groupby applies per-group styles', () => {
    const { data } = run([
      {
        x: ['a', 'b'],
        y: [1, 2],
        type: 'bar',
        transforms: [
          { type: 'groupby', groups: ['g1', 'g2'], styles: [{ target: 'g2', value: { marker: { color: 'red' } } }] },
        ],
      },
    ]);
    expect(data[1].marker.color).toBe('red');
  });

  test('sort reorders every parallel array together', () => {
    const { data } = run([
      {
        x: ['a', 'b', 'c'],
        y: [2, 3, 1],
        type: 'bar',
        transforms: [{ type: 'sort', target: 'y', order: 'descending' }],
      },
    ]);
    expect(data[0].y).toEqual([3, 2, 1]);
    expect(data[0].x).toEqual(['b', 'a', 'c']);
  });
});

describe('plotlyCompat: deprecated trace attributes', () => {
  test('bardir:"h" sets orientation AND swaps the data axes', () => {
    // Plotly 2.x's cleanData did both. Renaming the attribute without the swap
    // transposes every horizontal bar chart.
    const { data } = run([{ x: [5, 8], y: ['alpha', 'beta'], type: 'bar', bardir: 'h' }]);
    expect(data[0].orientation).toBe('h');
    expect(data[0].x).toEqual(['alpha', 'beta']);
    expect(data[0].y).toEqual([5, 8]);
    expect(data[0].bardir).toBeUndefined();
  });

  test('bardir:"v" does not swap axes', () => {
    const { data } = run([{ x: ['a', 'b'], y: [1, 2], type: 'bar', bardir: 'v' }]);
    expect(data[0].x).toEqual(['a', 'b']);
    expect(data[0].bardir).toBeUndefined();
  });

  test('error_y.opacity folds into the colour alpha', () => {
    const { data } = run([
      { x: [1], y: [1], type: 'scatter', error_y: { type: 'constant', value: 1, color: '#ff0000', opacity: 0.5 } },
    ]);
    expect(data[0].error_y.opacity).toBeUndefined();
    expect(data[0].error_y.color.replace(/\s/g, '')).toBe('rgba(255,0,0,0.5)');
  });

  test('an hsv() colour is converted to something Plotly 4 can parse', () => {
    const { data } = run([{ x: ['a'], y: [1], type: 'bar', marker: { color: 'hsv(0,100%,100%)' } }]);
    expect(data[0].marker.color).toBe('#ff0000');
  });
});

describe('plotlyCompat: removed trace types', () => {
  test('pointcloud becomes scattergl with marker mode', () => {
    const { data } = run([{ type: 'pointcloud', x: [1], y: [1] }]);
    expect(data[0].type).toBe('scattergl');
    expect(data[0].mode).toBe('markers');
  });

  test('heatmapgl becomes heatmap', () => {
    const { data } = run([{ type: 'heatmapgl', z: [[1, 2]] }]);
    expect(data[0].type).toBe('heatmap');
  });

  test('scattermapbox becomes scattermap and the subplot is renamed', () => {
    // Plotly's own v4 notes prescribe this swap. The replacement renders through
    // maplibre 6.9.0, which carries the GHSA-jrc7-96c5-q579 patch — so keeping
    // map charts working does not reintroduce the vulnerability.
    const { data, layout, unsupported } = run([{ type: 'scattermapbox', lat: [1], lon: [2], mode: 'markers' }], {
      mapbox: { style: 'open-street-map', zoom: 3 },
    });
    expect(data[0].type).toBe('scattermap');
    expect(layout.map.style).toBe('open-street-map');
    expect(layout.mapbox).toBeUndefined();
    expect(unsupported).toHaveLength(0);
  });

  test('choroplethmapbox becomes choroplethmap', () => {
    const { data } = run([{ type: 'choroplethmapbox', locations: ['A'], z: [1] }]);
    expect(data[0].type).toBe('choroplethmap');
  });

  test('a numbered map subplot is renamed alongside its trace', () => {
    const { data, layout } = run([{ type: 'densitymapbox', lat: [1], lon: [1], z: [1], subplot: 'mapbox2' }], {
      mapbox2: { style: 'dark' },
    });
    expect(data[0].type).toBe('densitymap');
    expect(data[0].subplot).toBe('map2');
    expect(layout.map2.style).toBe('dark');
  });
});

describe('plotlyCompat: defaults Plotly 4 changed', () => {
  test('geo.fitbounds is pinned to the 2.x default', () => {
    // Plotly 4 changed this from false to 'locations', so a geo chart that never
    // mentioned fitbounds silently starts auto-zooming to its data.
    const { layout } = run([{ type: 'scattergeo', lat: [1], lon: [1] }]);
    expect(layout.geo.fitbounds).toBe(false);
  });

  test('an explicit fitbounds is left alone', () => {
    const { layout } = run([{ type: 'scattergeo', lat: [1], lon: [1] }], { geo: { fitbounds: 'locations' } });
    expect(layout.geo.fitbounds).toBe('locations');
  });

  test('no geo container is invented for a non-geo chart', () => {
    const { layout } = run([{ x: ['a'], y: [1], type: 'bar' }]);
    expect(layout.geo).toBeUndefined();
  });
});

describe('plotlyCompat: leaves modern specs alone', () => {
  test('a spec with no legacy syntax passes through unchanged', () => {
    const data = [{ x: ['a'], y: [1], type: 'bar' }];
    const layout = { title: { text: 'ok' } };
    const result = run(data, layout);
    expect(result.data).toEqual(data);
    expect(result.layout).toEqual(layout);
    expect(result.warnings).toHaveLength(0);
    expect(result.unsupported).toHaveLength(0);
  });

  test('the caller’s objects are never mutated', () => {
    // The spec handed in comes from resolved store values; rewriting it in place
    // would corrupt what the rest of the app reads.
    const input = [{ x: ['a', 'b'], y: [1, 2], type: 'bar', bardir: 'h' }];
    const layout = { xaxis: { title: 'Month' } };
    run(input, layout);
    expect(input[0].bardir).toBe('h');
    expect(layout.xaxis.title).toBe('Month');
  });

  test('rewrites are reported as warnings, not silently applied', () => {
    const { warnings } = run([{ x: [5], y: ['a'], type: 'bar', bardir: 'h' }]);
    expect(warnings.length).toBeGreaterThan(0);
  });
});
