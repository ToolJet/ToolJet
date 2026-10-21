/**
 * The Map's tiles showed OpenStreetMap's "Access blocked" image. ToolJet serves its pages with Referrer-Policy:
 * no-referrer (helmet, server/src/helpers/bootstrap.helper.ts), so every tile request went with no Referer, and
 * OpenStreetMap's tile servers refuse those: their usage policy requires one. Every tile layer now sets the image's
 * own referrerpolicy to strict-origin, which sends the app's origin (never a page path). Real store, RenderWidget, widget
 * and Leaflet; the layer options are read off Leaflet's tileLayer.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import L from 'leaflet';
import { waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'ShadMap',
  handle: 'map1',
  id: 'map1',
  widgetHeight: 400,
  widgetWidth: 600,
  capabilities: { network: [{ url: 'https://nominatim.openstreetmap.org/reverse', json: [] }] },
});

describe('UI 2.0 Map tiles', () => {
  let tileLayer;
  beforeEach(async () => {
    await widget.setup();
    tileLayer = jest.spyOn(L, 'tileLayer');
  });
  afterEach(() => {
    tileLayer.mockRestore();
    widget.teardown();
  });

  test.each([
    ['the default OpenStreetMap tiles', {}, 'tile.openstreetmap.org', 1],
    ['satellite imagery and its place names', { mapStyle: binding('satellite') }, 'World_Imagery', 2],
    ['a tile URL of the builder', { tileUrl: binding('https://tiles.example/{z}/{x}/{y}.png') }, 'tiles.example', 1],
  ])(
    '%s send the app origin as the Referer',
    async (_, properties, host, layers) => {
      widget.render({ currentMode: 'view', properties });
      // The map draws its tiles once Leaflet has a size; under a loaded test run that takes longer than the default 1s.
      await waitFor(() => expect(tileLayer.mock.calls.some(([url]) => url.includes(host))).toBe(true), {
        timeout: 10000,
      });
      const from = tileLayer.mock.calls.findIndex(([url]) => url.includes(host));
      const calls = tileLayer.mock.calls.slice(from, from + layers);
      expect(calls).toHaveLength(layers);
      calls.forEach(([, options]) =>
        expect(options).toMatchObject({ referrerPolicy: 'strict-origin', crossOrigin: true, maxZoom: 19 })
      );
    },
    20000
  );
});
