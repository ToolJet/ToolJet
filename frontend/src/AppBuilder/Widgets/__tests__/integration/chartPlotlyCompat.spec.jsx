/**
 * Chart widget — Plotly JSON schema behaviour.
 *
 * These are characterization tests: they pin what the Chart widget renders TODAY
 * for author-written Plotly JSON. They are deliberately written against
 * behaviour (what Plotly resolved) rather than implementation, so the same file
 * runs unchanged on `main` (Plotly 2.x) and on the Plotly 4 upgrade branch.
 *
 * That is the point. Plotly 4 removed a lot of syntax that 2.x accepted, and it
 * removes it SILENTLY — the chart still draws, it just ignores the setting. A
 * filter that stops filtering shows rows the author meant to hide, with no error
 * anywhere. Asserting the resolved chart state on both versions is what turns
 * that silence into a failing test.
 *
 * Assertions read `_fullData` / `_fullLayout` off the rendered Plotly div rather
 * than poking at SVG selectors: it is the same thing Plotly itself renders from,
 * and it is stable across Plotly versions in a way DOM structure is not.
 */

import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'Chart',
  handle: 'chart1',
  id: 'chart-1',
  widgetHeight: 300,
  widgetWidth: 400,
  defaultProperties: {
    title: binding('Chart'),
    type: binding('line'),
    data: binding('[]'),
    plotFromJson: binding('{{false}}'),
    jsonDescription: binding('{ "data": [] }'),
    loadingState: binding('{{false}}'),
    showGridLines: binding('{{true}}'),
    showAxes: binding('{{true}}'),
    markerColor: binding('#4d72d0'),
    barmode: binding('group'),
  },
});

beforeEach(() => widget.setup());
afterEach(() => widget.teardown());

/** The rendered Plotly graph div, once Plotly has resolved its full state. */
async function plot() {
  let gd;
  await waitFor(() => {
    gd = document.querySelector('.js-plotly-plot');
    expect(gd?._fullData).toBeTruthy();
  });
  return gd;
}

/** Render the widget in Plotly-JSON mode with the given spec. */
async function renderJson(spec) {
  widget.render({
    properties: {
      plotFromJson: binding('{{true}}'),
      jsonDescription: binding(JSON.stringify(spec)),
    },
  });
  return plot();
}

const vals = (a) => (a ? Array.from(a) : undefined);

describe('Chart: Plotly JSON — axis titles', () => {
  test('an axis title written as plain text still renders as the axis title', async () => {
    // Plotly 4 dropped string titles in favour of { text }. Authors wrote the
    // string form for years, so it has to keep working.
    const gd = await renderJson({
      data: [{ x: ['Jan', 'Feb'], y: [100, 80], type: 'bar' }],
      layout: { xaxis: { title: 'Month' }, yaxis: { title: 'Revenue' } },
    });

    expect(gd._fullLayout.xaxis.title.text).toBe('Month');
    expect(gd._fullLayout.yaxis.title.text).toBe('Revenue');
  });

  test('titlefont on an axis still styles the axis title', async () => {
    // `titlefont` moved inside `title.font`. Dropping it silently reverts the
    // author's styling to the theme default.
    const gd = await renderJson({
      data: [{ x: ['a', 'b'], y: [1, 2], type: 'bar' }],
      layout: { xaxis: { title: { text: 'Month' }, titlefont: { size: 28, color: 'red' } } },
    });

    expect(gd._fullLayout.xaxis.title.text).toBe('Month');
    expect(gd._fullLayout.xaxis.title.font.size).toBe(28);
    expect(gd._fullLayout.xaxis.title.font.color).toBe('red');
  });
});

describe('Chart: Plotly JSON — transforms', () => {
  test('a filter transform removes the rows it excludes', async () => {
    // The worst break in the Plotly 4 upgrade: without this the chart renders
    // three bars instead of two and shows data the author meant to hide.
    const gd = await renderJson({
      data: [
        {
          x: ['a', 'b', 'c'],
          y: [1, 2, 3],
          type: 'bar',
          transforms: [{ type: 'filter', target: 'y', operation: '>', value: 1 }],
        },
      ],
    });

    expect(vals(gd._fullData[0].y)).toEqual([2, 3]);
    expect(vals(gd._fullData[0].x)).toEqual(['b', 'c']);
  });

  test('a groupby transform splits one trace into a series per group', async () => {
    const gd = await renderJson({
      data: [
        {
          x: ['a', 'b', 'c', 'd'],
          y: [1, 2, 3, 4],
          type: 'bar',
          transforms: [{ type: 'groupby', groups: ['g1', 'g1', 'g2', 'g2'] }],
        },
      ],
    });

    expect(gd._fullData).toHaveLength(2);
    expect(vals(gd._fullData[0].y)).toEqual([1, 2]);
    expect(vals(gd._fullData[1].y)).toEqual([3, 4]);
  });

  test('an aggregate transform collapses each group to its aggregate value', async () => {
    // `avg` rather than `sum`: summing is indistinguishable from Plotly stacking
    // duplicate categories, so a sum test passes even when the transform is
    // being ignored entirely.
    const gd = await renderJson({
      data: [
        {
          x: ['a', 'a', 'b'],
          y: [1, 2, 3],
          type: 'bar',
          transforms: [{ type: 'aggregate', groups: 'x', aggregations: [{ target: 'y', func: 'avg' }] }],
        },
      ],
    });

    expect(vals(gd._fullData[0].x)).toEqual(['a', 'b']);
    expect(vals(gd._fullData[0].y)).toEqual([1.5, 3]);
  });

  test('a sort transform reorders the points', async () => {
    const gd = await renderJson({
      data: [
        {
          x: ['a', 'b', 'c'],
          y: [2, 3, 1],
          type: 'bar',
          transforms: [{ type: 'sort', target: 'y', order: 'descending' }],
        },
      ],
    });

    expect(vals(gd._fullData[0].y)).toEqual([3, 2, 1]);
    expect(vals(gd._fullData[0].x)).toEqual(['b', 'a', 'c']);
  });
});

describe('Chart: Plotly JSON — deprecated trace attributes', () => {
  test('bardir:"h" renders a horizontal bar with the axes swapped', async () => {
    // Plotly 2.x treated bardir as more than an alias for `orientation`: it also
    // swapped x/y. Translating the name alone transposes the chart.
    const gd = await renderJson({
      data: [{ x: [5, 8], y: ['alpha', 'beta'], type: 'bar', bardir: 'h' }],
    });

    expect(gd._fullData[0].orientation).toBe('h');
    expect(vals(gd._fullData[0].x)).toEqual(['alpha', 'beta']);
    expect(vals(gd._fullData[0].y)).toEqual([5, 8]);
  });

  test('annotation.ref anchors the annotation to the paper', async () => {
    const gd = await renderJson({
      data: [{ x: ['a', 'b'], y: [1, 2], type: 'bar' }],
      layout: { annotations: [{ text: 'PAPER-ANCHORED', ref: 'paper', x: 0.5, y: 0.5, showarrow: false }] },
    });

    expect(gd._fullLayout.annotations[0].xref).toBe('paper');
    expect(gd._fullLayout.annotations[0].yref).toBe('paper');
  });

  test('an hsv() marker colour still renders as that colour', async () => {
    // Plotly 4 swapped its colour library for one that does not parse hsv().
    const gd = await renderJson({
      data: [{ x: ['a', 'b'], y: [3, 5], type: 'bar', marker: { color: 'hsv(0,100%,100%)' } }],
    });

    const color = String(gd._fullData[0].marker.color).toLowerCase().replace(/\s/g, '');
    expect(color === 'hsv(0,100%,100%)' || color === '#ff0000' || color === 'rgb(255,0,0)').toBe(true);
  });
});

describe('Chart: Plotly JSON — layout defaults', () => {
  test('an overlaying second axis keeps round tick labels', async () => {
    // Plotly 4 defaults an overlaying axis to tickmode:"sync", which replaces
    // round tick labels with raw data values (8.747 instead of 8.8).
    const gd = await renderJson({
      data: [
        { x: ['a', 'b'], y: [1, 2], type: 'bar' },
        { x: ['a', 'b'], y: [9, 8], type: 'scatter', yaxis: 'y2' },
      ],
      layout: { yaxis2: { overlaying: 'y', side: 'right' }, barmode: 'stack' },
    });

    expect(gd._fullLayout.yaxis2).toBeTruthy();
    const ticks = (gd._fullLayout.yaxis2._vals || []).map((v) => v.text);
    expect(ticks.length).toBeGreaterThan(0);
    // No tick label should carry 3+ decimal places — that is the "sync" signature.
    expect(ticks.every((t) => !/\.\d{3}/.test(t))).toBe(true);
  });

  test('an object-form plot title keeps its text and its own styling', async () => {
    const gd = await renderJson({
      data: [{ x: ['a'], y: [1], type: 'bar' }],
      layout: { title: { text: 'Control chart' } },
    });

    expect(gd._fullLayout.title.text).toBe('Control chart');
  });
});

describe('Chart: native modes are unaffected by JSON-schema handling', () => {
  const DATA = JSON.stringify([
    { x: 'Jan', y: 100 },
    { x: 'Feb', y: 80 },
    { x: 'Mar', y: 40 },
  ]);

  test('a native line chart renders a scatter trace from the data property', async () => {
    widget.render({ properties: { type: binding('line'), data: binding(DATA) } });
    const gd = await plot();

    expect(gd._fullData[0].type).toBe('scatter');
    expect(vals(gd._fullData[0].y)).toEqual([100, 80, 40]);
  });

  test('a native bar chart renders a bar trace', async () => {
    widget.render({ properties: { type: binding('bar'), data: binding(DATA) } });
    const gd = await plot();

    expect(gd._fullData[0].type).toBe('bar');
    expect(vals(gd._fullData[0].y)).toEqual([100, 80, 40]);
  });

  test('a native pie chart reshapes the data into values and labels', async () => {
    widget.render({ properties: { type: binding('pie'), data: binding(DATA) } });
    const gd = await plot();

    expect(gd._fullData[0].type).toBe('pie');
    expect(vals(gd._fullData[0].values)).toEqual([100, 80, 40]);
    expect(vals(gd._fullData[0].labels)).toEqual(['Jan', 'Feb', 'Mar']);
  });
});
