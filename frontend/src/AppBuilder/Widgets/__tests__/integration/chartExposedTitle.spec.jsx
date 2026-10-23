/**
 * Chart — the exposed `chartTitle` follows the title property.
 *
 * The effect that re-exposes it listed `JSON.stringify(chartLayout, chartTitle)` as its dependency, which passes the
 * title as JSON.stringify's replacer (ignored) instead of depending on it: a chart not built from JSON never
 * re-exposed a changed title.
 */
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding, drain } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'Chart',
  handle: 'chart1',
  id: 'chart-1',
  widgetHeight: 300,
  widgetWidth: 400,
  defaultProperties: {
    title: binding('First'),
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

describe('Chart: exposed chartTitle', () => {
  test('a changed title is exposed, for a chart not built from JSON', async () => {
    widget.render();
    await waitFor(() => expect(widget.exposed().chartTitle).toBe('First'));

    widget.setComponentProperty('chart-1', 'title', 'Second', 'properties');
    await drain();
    await waitFor(() => expect(widget.exposed().chartTitle).toBe('Second'));
  });

  test('a changed layout title is exposed, for a chart built from JSON, as before', async () => {
    widget.render({
      properties: {
        plotFromJson: binding('{{true}}'),
        jsonDescription: binding(JSON.stringify({ data: [], layout: { title: 'From JSON' } })),
      },
    });
    await waitFor(() => expect(widget.exposed().chartTitle).toBe('From JSON'));

    widget.setComponentProperty(
      'chart-1',
      'jsonDescription',
      JSON.stringify({ data: [], layout: { title: 'Changed' } }),
      'properties'
    );
    await drain();
    await waitFor(() => expect(widget.exposed().chartTitle).toBe('Changed'));
  });
});
