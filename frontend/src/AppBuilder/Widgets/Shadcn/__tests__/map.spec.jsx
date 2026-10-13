import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { ShadMap } from '../ShadMap';
import { shadMapConfig } from '../../../WidgetManager/widgets/shadMap';

// The ToolJet UI 2.0 Map (Leaflet), mounted the way RenderWidget mounts it. jsdom has no layout, so the map is drawn
// for the widget's own size (600 x 420) and every marker in the world counts as in view.

const resolve = (value) => {
  const m = typeof value === 'string' && value.match(/^\{\{([\s\S]*)\}\}$/);
  return m ? new Function(`return (${m[1]});`)() : value; // eslint-disable-line no-new-func
};
const DEFAULTS = Object.fromEntries(
  Object.entries(shadMapConfig.definition.properties).map(([k, v]) => [k, resolve(v.value)])
);

const harness = (properties = {}) => {
  const exposed = {};
  const fired = [];
  const props = (p) => ({
    id: 'w1',
    componentType: 'ShadMap',
    height: 420,
    width: 600,
    properties: { ...DEFAULTS, ...p },
    styles: {},
    setExposedVariables: (v) => Object.assign(exposed, v),
    setExposedVariable: (k, v) => (exposed[k] = v),
    fireEvent: (name) =>
      fired.push([name, JSON.parse(JSON.stringify(exposed, (k, v) => (typeof v === 'function' ? undefined : v)))]),
  });
  const view = render(<ShadMap {...props(properties)} />);
  return {
    view,
    exposed,
    fired,
    rerender: (p) => view.rerender(<ShadMap {...props({ ...properties, ...p })} />),
    pins: () => view.container.querySelectorAll('[data-marker]'),
    groups: () => view.container.querySelectorAll('[data-cluster]'),
    call: async (handle, ...args) => {
      await act(async () => {
        await exposed[handle](...args);
      });
    },
  };
};

const city = (n, { invalid = 0 } = {}) =>
  Array.from({ length: n + invalid }, (_, i) =>
    i < n
      ? {
          id: i + 1,
          name: `Stop ${i + 1}`,
          lat: 37.7 + ((i * 7919) % 1000) / 6000,
          lng: -122.5 + ((i * 104729) % 1000) / 5000,
          status: ['Delivered', 'Delayed', 'Failed', 'Open'][i % 4],
        }
      : { id: `bad-${i}`, name: 'Nowhere', lat: 'unknown', lng: null }
  );

describe('ShadMap', () => {
  it('draws a pin per stop, toned by status, and exposes the view without firing anything', () => {
    const m = harness({ clusterMarkers: false });
    expect(m.pins()).toHaveLength(8);
    const tones = [...m.pins()].map((p) => p.getAttribute('data-tone'));
    expect(tones).toEqual(expect.arrayContaining(['success', 'warning', 'danger', 'info']));
    // 12.5 fits; jsdom has no 3D transforms, so Leaflet draws whole zoom steps there.
    expect(m.exposed.zoom).toBe(13);
    expect(m.exposed.center.lat).toBeCloseTo(37.78, 1);
    expect(m.exposed.bounds.northEast.lat).toBeGreaterThan(m.exposed.bounds.southWest.lat);
    expect(m.exposed.selectedMarker).toEqual({});
    expect(m.fired).toEqual([]);
  });

  it('selects a stop on click, opens its popup and fires onMarkerClick with the selection already exposed', () => {
    const m = harness({ clusterMarkers: false });
    const pin = m.view.container.querySelector('[data-marker="S-104"]');
    act(() => {
      fireEvent.click(pin);
    });
    expect(m.fired.map(([name]) => name)).toEqual(['onMarkerClick']);
    expect(m.fired[0][1].selectedMarkerId).toBe('S-104');
    expect(m.fired[0][1].selectedMarker.customer).toBe('Sunset Florist');
    const popup = m.view.container.querySelector('.sc-map-popup-body');
    expect(popup.textContent).toContain('Sunset Florist');
    expect(popup.textContent).toContain('Delayed');
    expect(popup.textContent).toContain('ETA 11:05 AM');
    expect(popup.textContent).toContain('Owen Hart');
    expect(m.view.container.querySelector('[data-marker="S-104"]').getAttribute('data-selected')).toBe('true');
  });

  it('clears the selection on a map click, exposing where it was clicked', () => {
    const m = harness({ clusterMarkers: false });
    act(() => {
      fireEvent.click(m.view.container.querySelector('[data-marker="S-101"]'));
    });
    act(() => {
      fireEvent.click(m.view.container.querySelector('.sc-map-canvas'));
    });
    expect(m.fired.map(([name]) => name)).toEqual(['onMarkerClick', 'onMapClick']);
    expect(m.fired[1][1].selectedMarkerId).toBeNull();
    expect(m.fired[1][1].clickedLocation).toEqual({ lat: expect.any(Number), lng: expect.any(Number) });
    expect(m.view.container.querySelector('.sc-map-popup-body')).toBeNull();
  });

  it('keeps 2,000 stops smooth by grouping them, and counts the rows it could not place', () => {
    const started = Date.now();
    const m = harness({ data: city(2000, { invalid: 3 }), titleField: 'name' });
    const took = Date.now() - started;
    expect(m.groups().length).toBeGreaterThan(0);
    expect(m.groups().length + m.pins().length).toBeLessThan(150);
    const total = [...m.groups()].reduce((n, g) => n + Number(g.textContent), 0) + m.pins().length;
    expect(total).toBe(2000);
    expect(m.view.container.querySelector('.sc-map-note').textContent).toBe('3 rows not shown: no valid coordinates');
    expect(took).toBeLessThan(3000);
  });

  it('zooms into a group on click (a move the user makes, so onBoundsChange fires)', () => {
    const m = harness({ data: city(2000), titleField: 'name' });
    const before = m.exposed.zoom;
    act(() => {
      fireEvent.click(m.groups()[0]);
    });
    expect(m.exposed.zoom).toBeGreaterThan(before);
    expect(m.fired.map(([name]) => name)).toEqual(['onBoundsChange']);
  });

  it('shows the empty text over the map with no locations', () => {
    const m = harness({ data: [], emptyText: 'No stops today' });
    expect(m.view.container.querySelector('.sc-map-empty').textContent).toBe('No stops today');
    expect(m.exposed.center).toEqual({ lat: 20, lng: 0 });
  });

  it('opens on the default center when it does not fit the markers', () => {
    const m = harness({ fitToMarkers: false, defaultCenter: { lat: 51.5074, lng: -0.1278 }, defaultZoom: 10 });
    expect(m.exposed.center).toEqual({ lat: 51.5074, lng: -0.1278 });
    expect(m.exposed.zoom).toBe(10);
  });

  it('runs its actions: center, zoom, fit, select and clear, none of them firing onBoundsChange', async () => {
    const m = harness({ clusterMarkers: false });
    await m.call('setCenter', 51.5074, -0.1278, 9);
    expect(m.exposed.center).toEqual({ lat: 51.5074, lng: -0.1278 });
    expect(m.exposed.zoom).toBe(9);
    await m.call('setCenter', { lat: 48.8566, lng: 2.3522 });
    expect(m.exposed.center).toEqual({ lat: 48.8566, lng: 2.3522 });
    await m.call('setZoom', 4);
    expect(m.exposed.zoom).toBe(4);
    await m.call('fitBounds');
    expect(m.exposed.zoom).toBe(13);
    await m.call('selectMarker', 'S-106');
    expect(m.exposed.selectedMarker.customer).toBe('Union Square Books');
    expect(m.view.container.querySelector('.sc-map-popup-body').textContent).toContain('Failed');
    await m.call('clearSelection');
    expect(m.exposed.selectedMarkerId).toBeNull();
    expect(m.view.container.querySelector('.sc-map-popup-body')).toBeNull();
    expect(m.fired).toEqual([]);
  });

  it('refits when the data changes, and drops a selection whose row is gone', () => {
    const m = harness({ clusterMarkers: false });
    act(() => {
      fireEvent.click(m.view.container.querySelector('[data-marker="S-101"]'));
    });
    m.rerender({ data: [{ id: 'X', customer: 'Paris office', lat: 48.8566, lng: 2.3522 }] });
    expect(m.pins()).toHaveLength(1);
    expect(m.exposed.center).toEqual({ lat: 48.8566, lng: 2.3522 });
    expect(m.exposed.selectedMarkerId).toBeNull();
  });

  it('draws no popup when showPopup is off', () => {
    const m = harness({ clusterMarkers: false, showPopup: false });
    act(() => {
      fireEvent.click(m.view.container.querySelector('[data-marker="S-101"]'));
    });
    expect(m.exposed.selectedMarkerId).toBe('S-101');
    expect(m.view.container.querySelector('.sc-map-popup-body')).toBeNull();
  });

  it('ignores clicks while disabled', () => {
    const m = harness({ clusterMarkers: false, disabledState: true });
    act(() => {
      fireEvent.click(m.view.container.querySelector('.sc-map-canvas'));
    });
    expect(m.fired).toEqual([]);
  });

  it('shows a spinner over the map while loading', () => {
    const m = harness({ loadingState: true });
    expect(m.view.container.querySelector('.sc-map-veil [role=status]')).not.toBeNull();
  });

  it("draws the widget's own tiles, with its attribution as text, never script", () => {
    const m = harness({
      tileUrl: 'https://tiles.example/{z}/{x}/{y}.png',
      tileAttribution: 'Example <img src=x onerror=alert(1)>',
    });
    expect(m.view.container.querySelector('.sc-map-canvas').getAttribute('data-tiles')).toBe(
      'https://tiles.example/{z}/{x}/{y}.png'
    );
    const attribution = m.view.container.querySelector('.leaflet-control-attribution');
    expect(attribution.textContent).toContain('Example');
    expect(attribution.querySelector('img')).toBeNull();
  });

  // ---- Options added for real apps (dispatch, field service, listings) ----

  it('puts a short label in the pin and a longer one in a price pill', () => {
    const m = harness({ clusterMarkers: false, labelField: 'id' });
    expect(m.view.container.querySelector('[data-marker="S-101"]').classList.contains('sc-map-pill')).toBe(true);
    expect(m.view.container.querySelector('[data-marker="S-101"]').textContent).toBe('S-101');
    const n = harness({
      clusterMarkers: false,
      data: [{ id: 'a', stop: 7, lat: 41.9, lng: -87.6 }],
      labelField: 'stop',
    });
    expect(n.view.container.querySelector('.sc-map-pin-label').textContent).toBe('7');
  });

  it('colours pins by the status colours given, and lists them with counts in the legend', () => {
    const m = harness({ clusterMarkers: false, statusColors: { Delivered: '#e11d48' } });
    expect(m.view.container.querySelector('[data-marker="S-101"]').getAttribute('style')).toContain('--pin:#e11d48');
    const legend = m.view.container.querySelector('.sc-map-legend').textContent;
    expect(legend).toContain('Delivered3');
    expect(legend).toContain('Failed1');
    const off = harness({ clusterMarkers: false, showLegend: false });
    expect(off.view.container.querySelector('.sc-map-legend')).toBeNull();
  });

  it('marks pins with their icon, and draws it once lucide has loaded', async () => {
    const m = harness({
      clusterMarkers: false,
      data: [{ id: 1, kind: 'snowflake', lat: 30.27, lng: -97.74 }],
      iconField: 'kind',
    });
    expect(m.view.container.querySelector('[data-icon="snowflake"]')).not.toBeNull();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 1500));
    });
    expect(m.view.container.querySelector('.sc-map-pin-glyph svg')).not.toBeNull();
  });

  it('connects the markers as one route per driver, in stop order from the start, and lists them', () => {
    const m = harness({
      clusterMarkers: false,
      connectMarkers: true,
      routeField: 'driver',
      routeOrderField: 'customer',
      routeStart: { lat: 37.79, lng: -122.4 },
    });
    const shapes = [...m.view.container.querySelectorAll('[data-shape]')].map((b) => b.textContent);
    expect(shapes).toEqual([
      'Route Maya Chen, 3 points, from the start',
      'Route Owen Hart, 3 points, from the start',
      'Route Priya Nair, 3 points, from the start',
      'Route Leo Martins, 3 points, from the start',
    ]);
    expect(m.view.container.querySelector('.sc-map-legend').textContent).toContain('Maya Chen');
  });

  it('selects a route or an area from the list, firing onShapeClick with the shape exposed', () => {
    const m = harness({
      clusterMarkers: false,
      routes: [
        {
          name: 'Van 1',
          path: [
            [37.79, -122.39],
            [37.76, -122.42],
          ],
        },
      ],
      areas: [
        {
          name: 'North',
          status: 'Overloaded',
          outline: [
            [37.8, -122.47],
            [37.81, -122.4],
            [37.78, -122.4],
          ],
        },
      ],
    });
    const [route, area] = m.view.container.querySelectorAll('[data-shape]');
    expect(area.textContent).toBe('Area North, Overloaded');
    act(() => {
      fireEvent.click(area);
    });
    expect(m.fired.map(([n]) => n)).toEqual(['onShapeClick']);
    expect(m.fired[0][1]).toMatchObject({ selectedShapeType: 'area', selectedShape: { name: 'North' } });
    act(() => {
      fireEvent.click(route);
    });
    expect(m.exposed.selectedShapeType).toBe('route');
    act(() => {
      fireEvent.click(m.view.container.querySelector('.sc-map-canvas'));
    });
    expect(m.exposed.selectedShapeType).toBeNull();
  });

  it('fits the view to the routes and areas too', () => {
    const m = harness({ data: [], areas: [{ name: 'Wide', lat: 37.77, lng: -122.42, radius: 20000 }] });
    expect(m.exposed.zoom).toBeLessThan(11);
    expect(m.view.container.querySelector('.sc-map-empty')).toBeNull();
  });

  it('lets the user pick a location by a click, exposing it before onLocationPick fires', async () => {
    const m = harness({ clusterMarkers: false, pickLocation: true });
    expect(m.view.container.querySelector('.sc-map-pick-hint')).not.toBeNull();
    act(() => {
      fireEvent.click(m.view.container.querySelector('.sc-map-canvas'));
    });
    expect(m.fired.map(([n]) => n)).toEqual(['onLocationPick', 'onMapClick']);
    expect(m.fired[0][1].pickedLocation).toEqual({ lat: expect.any(Number), lng: expect.any(Number) });
    expect(m.view.container.querySelector('[data-picked]')).not.toBeNull();
    await m.call('clearPickedLocation');
    expect(m.exposed.pickedLocation).toEqual({});
    await m.call('setPickedLocation', 37.79, -122.41);
    expect(m.exposed.pickedLocation).toEqual({ lat: 37.79, lng: -122.41 });
  });

  it('starts with the default picked location, only while picking is on', () => {
    expect(harness({ pickLocation: true, defaultPickedLocation: '37.79, -122.41' }).exposed.pickedLocation).toEqual({
      lat: 37.79,
      lng: -122.41,
    });
    expect(harness({ pickLocation: false, defaultPickedLocation: '37.79, -122.41' }).exposed.pickedLocation).toEqual(
      {}
    );
  });

  it('draws a heat layer instead of pins, or with them', () => {
    const heat = harness({ display: 'heat', heatRadius: 40 });
    expect(heat.pins()).toHaveLength(0);
    const canvas = heat.view.container.querySelector('canvas.sc-map-heat');
    expect(canvas.getAttribute('data-points')).toBe('8');
    expect(canvas.getAttribute('data-radius')).toBe('40');
    const both = harness({ display: 'both', clusterMarkers: false });
    expect(both.pins()).toHaveLength(8);
    expect(both.view.container.querySelector('canvas.sc-map-heat')).not.toBeNull();
  });

  it('switches to satellite imagery from the style switch or the action, exposing the style', async () => {
    const m = harness({ showStyleSwitch: true });
    const canvas = () => m.view.container.querySelector('.sc-map-canvas');
    expect(canvas().getAttribute('data-style')).toBe('streets');
    act(() => {
      fireEvent.click(m.view.container.querySelector('.sc-map-style-switch [role=radio]:last-child'));
    });
    expect(canvas().getAttribute('data-style')).toBe('satellite');
    expect(canvas().getAttribute('data-tiles')).toContain('World_Imagery');
    expect(m.exposed.mapStyle).toBe('satellite');
    await m.call('setMapStyle', 'streets');
    expect(canvas().getAttribute('data-style')).toBe('streets');
    await m.call('setMapStyle', 'junk');
    expect(m.exposed.mapStyle).toBe('streets');
  });

  it('leaves the wheel to the page, zooming only with Ctrl or Cmd held, unless wheel zoom is on', () => {
    const m = harness({ clusterMarkers: false });
    const canvas = m.view.container.querySelector('.sc-map-canvas');
    const before = m.exposed.zoom;
    act(() => {
      fireEvent.wheel(canvas, { deltaY: -100 });
    });
    expect(m.view.container.querySelector('.sc-map-wheel-hint')).not.toBeNull();
    expect(m.exposed.zoom).toBe(before);
    act(() => {
      fireEvent.wheel(canvas, { deltaY: -100, ctrlKey: true });
    });
    expect(m.exposed.zoom).toBeGreaterThan(before);
    expect(
      harness({ scrollWheelZoom: true }).view.container.querySelector('.sc-map').getAttribute('data-wheel-zoom')
    ).toBe('true');
  });

  it('fills the window from the fullscreen button where the browser has no fullscreen, and Escape leaves it', () => {
    const m = harness({});
    const frame = () => m.view.container.querySelector('.sc-map');
    act(() => {
      fireEvent.click(m.view.container.querySelector('[data-fullscreen]'));
    });
    expect(frame().getAttribute('data-expanded')).toBe('true');
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(frame().getAttribute('data-expanded')).toBeNull();
    expect(harness({ showFullscreen: false }).view.container.querySelector('[data-fullscreen]')).toBeNull();
  });

  it('shows the address search box with its placeholder', () => {
    const m = harness({ showSearch: true, searchPlaceholder: 'Find a stop' });
    expect(m.view.container.querySelector('.sc-map-search input').getAttribute('placeholder')).toBe('Find a stop');
  });
});
