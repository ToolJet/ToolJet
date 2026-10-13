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
    expect(m.exposed.zoom).toBe(12);
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
    expect(m.exposed.zoom).toBe(12);
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
});
