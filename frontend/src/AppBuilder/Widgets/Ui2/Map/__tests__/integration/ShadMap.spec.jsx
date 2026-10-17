/**
 * UI 2.0 Map (Leaflet on open tiles): pins from rows toned by status, groups, routes, areas, a heat layer, a popup,
 * a picked location with address search, and the view exposed.
 *
 * Real store, real RenderWidget, real widget and real Leaflet; nothing about the widget is mocked. jsdom has no layout,
 * so the map is drawn for the widget's own size and every marker counts as in view; the geocoder's fetch is given
 * answers where a scenario searches. Standard control behaviour (visibility, disabled, loading, tooltip) is covered for
 * every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx. Titles carry [ShadMap-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import React from 'react';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'map1';
const widget = createWidgetHarness({
  componentType: 'ShadMap',
  handle: 'map1',
  id: ID,
  widgetHeight: 424,
  widgetWidth: 600,
  defaultProperties: { clusterMarkers: binding('{{false}}') },
  // Picking a spot looks up its address on the default Nominatim; it answers with no place, so pickedLocation keeps
  // just the spot. The address search scenarios below stub fetch themselves.
  capabilities: { network: [{ url: 'https://nominatim.openstreetmap.org/reverse', json: [] }] },
});

const ROUTE = "{{[{ name: 'Van 1', path: [[37.79, -122.39], [37.76, -122.42]] }]}}";
const AREA = "{ name: 'North', status: 'Overloaded', outline: [[37.8, -122.47], [37.81, -122.4], [37.78, -122.4]] }";
const city = (n, invalid = 0) =>
  `{{Array.from({ length: ${
    n + invalid
  } }, (_, i) => i < ${n} ? ({ id: i + 1, customer: 'Stop ' + (i + 1), lat: 37.7 + ((i * 7919) % 1000) / 6000, lng: -122.5 + ((i * 104729) % 1000) / 5000, status: ['Delivered', 'Delayed', 'Failed', 'Open'][i % 4] }) : ({ id: 'bad-' + i, lat: 'unknown', lng: null }))}}`;
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const q = (selector) => document.querySelector(selector);
const pins = () => document.querySelectorAll('[data-marker]');
const pin = (key) => q(`[data-marker="${key}"]`);
const canvas = () => q('.sc-map-canvas');
const popup = () => q('.sc-map-popup-body');
const exposed = () => widget.exposed() ?? {};
const settle = (ms = 30) => act(() => new Promise((r) => setTimeout(r, ms)));

describe('UI 2.0 Map', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadMap-DEF-001] draws a pin per stop toned by status, fits them, and exposes the view with nothing selected', async () => {
    render();

    await waitFor(() => expect(pins()).toHaveLength(8));
    expect([...pins()].map((p) => p.getAttribute('data-tone'))).toEqual(
      expect.arrayContaining(['success', 'warning', 'danger', 'info'])
    );
    // 12.5 fits; jsdom has no 3D transforms, so Leaflet draws whole zoom steps.
    await waitFor(() => expect(exposed().zoom).toBe(13));
    expect(exposed().center.lat).toBeCloseTo(37.78, 1);
    expect(exposed().bounds.northEast.lat).toBeGreaterThan(exposed().bounds.southWest.lat);
    expect(exposed()).toMatchObject({
      selectedMarker: {},
      selectedMarkerId: null,
      selectedShape: {},
      selectedShapeType: null,
      clickedLocation: {},
      pickedLocation: {},
      mapStyle: 'streets',
    });
    expect(q('.sc-map-legend')).toHaveTextContent('Delivered3');
  });

  test('[ShadMap-EVT-001] a pin click selects the stop, opens its popupFields and fires onMarkerClick with it exposed', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onMarkerClick', { value: '{{components.map1.selectedMarker.customer}}' }));

    await waitFor(() => expect(pin('S-104')).toBeTruthy());
    fireEvent.click(pin('S-104'));

    await waitFor(() => expect(widget.variables().seen).toBe('Sunset Florist'));
    expect(exposed().selectedMarkerId).toBe('S-104');
    expect(popup()).toHaveTextContent('Sunset Florist');
    expect(popup()).toHaveTextContent('Delayed');
    expect(popup()).toHaveTextContent('ETA 11:05 AM');
    expect(popup()).toHaveTextContent('Owen Hart');
    expect(pin('S-104')).toHaveAttribute('data-selected', 'true');
  });

  test('[ShadMap-EVT-002] a map click clears the selection and fires onMapClicked with clickedLocation set', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onMapClicked', { value: '{{components.map1.selectedMarkerId}}' }));

    await waitFor(() => expect(pin('S-101')).toBeTruthy());
    fireEvent.click(pin('S-101'));
    fireEvent.click(canvas());

    await waitFor(() => expect(widget.variables().seen).toBeNull());
    expect(exposed().clickedLocation).toEqual({ lat: expect.any(Number), lng: expect.any(Number) });
    expect(popup()).toBeNull();
  });

  test('[ShadMap-PROP-001] fields map rows: titleField, subtitleField, statusField, idField, labelField, popupFields', async () => {
    render({
      properties: {
        data: binding(
          "{{[{ code: 'A1', site: 'Pier 7', street: '7 Embarcadero', state: 'Late', fee: '$420', x: 37.8, y: -122.4 }]}}"
        ),
        latField: binding('x'),
        lngField: binding('y'),
        idField: binding('code'),
        titleField: binding('site'),
        subtitleField: binding('street'),
        statusField: binding('state'),
        labelField: binding('fee'),
        popupFields: binding('fee:Fee {}'),
      },
    });

    await waitFor(() => expect(pin('A1')).toBeTruthy());
    // A label longer than three characters is a price pill.
    expect(pin('A1')).toHaveClass('sc-map-pill');
    expect(pin('A1')).toHaveTextContent('$420');
    expect(pin('A1')).toHaveAttribute('data-tone', 'warning');
    fireEvent.click(pin('A1'));
    await waitFor(() => expect(popup()).toHaveTextContent('Pier 7'));
    expect(popup()).toHaveTextContent('7 Embarcadero');
    expect(popup()).toHaveTextContent('Fee $420');
  });

  test('[ShadMap-PROP-002] statusColors colour pins and the legend; showLegend off hides it; iconField marks pins', async () => {
    render({ properties: { statusColors: binding("{{({ Delivered: '#e11d48' })}}") } });
    await waitFor(() => expect(pin('S-101').getAttribute('style')).toContain('--pin:#e11d48'));
    expect(q('.sc-map-legend')).toHaveTextContent('Failed1');

    render({
      properties: {
        showLegend: binding('{{false}}'),
        iconField: binding('kind'),
        data: binding("{{[{ id: 1, kind: 'snowflake', lat: 30.27, lng: -97.74 }]}}"),
      },
    });
    await waitFor(() => expect(q('[data-icon="snowflake"]')).toBeTruthy());
    expect(q('.sc-map-legend')).toBeNull();
    // The glyph itself draws once lucide's icons have loaded.
    await waitFor(() => expect(q('.sc-map-pin-glyph svg')).toBeTruthy(), { timeout: 4000 });
  });

  test('[ShadMap-PROP-003] showPopup off selects without a popup', async () => {
    render({ properties: { showPopup: binding('{{false}}') } });

    await waitFor(() => expect(pin('S-101')).toBeTruthy());
    fireEvent.click(pin('S-101'));
    await waitFor(() => expect(exposed().selectedMarkerId).toBe('S-101'));
    expect(popup()).toBeNull();
  });

  test('[ShadMap-PROP-004] clusterMarkers groups 2,000 stops, counts unplaceable rows, and a group click zooms in (onBoundsChange)', async () => {
    render({ properties: { clusterMarkers: binding('{{true}}'), data: binding(city(2000, 3)) } });
    widget.setEvents(setVariableOn(ID, 'onBoundsChange', { value: '{{components.map1.zoom}}' }));

    await waitFor(() => expect(document.querySelectorAll('[data-cluster]').length).toBeGreaterThan(0));
    const groups = document.querySelectorAll('[data-cluster]');
    expect(groups.length + pins().length).toBeLessThan(150);
    expect([...groups].reduce((n, g) => n + Number(g.textContent), 0) + pins().length).toBe(2000);
    expect(q('.sc-map-note')).toHaveTextContent('3 rows not shown: no valid coordinates');
    const before = exposed().zoom;
    fireEvent.click(groups[0]);
    await waitFor(() => expect(widget.variables().seen).toBeGreaterThan(before));
  });

  test('[ShadMap-PROP-005] fitToMarkers off opens on defaultCenter at defaultZoom; emptyText shows with no locations', async () => {
    render({
      properties: {
        fitToMarkers: binding('{{false}}'),
        defaultCenter: binding('{{({ lat: 51.5074, lng: -0.1278 })}}'),
        defaultZoom: binding('{{10}}'),
      },
    });
    await waitFor(() => expect(exposed().center).toEqual({ lat: 51.5074, lng: -0.1278 }));
    expect(exposed().zoom).toBe(10);

    render({ properties: { data: binding('{{[]}}'), emptyText: binding('No stops today') } });
    await waitFor(() => expect(q('.sc-map-empty')).toHaveTextContent('No stops today'));
    expect(exposed().center).toEqual({ lat: 20, lng: 0 });
  });

  test('[ShadMap-PROP-006] connectMarkers draws a route per routeField value in routeOrderField order from routeStart', async () => {
    render({
      properties: {
        connectMarkers: binding('{{true}}'),
        routeField: binding('driver'),
        routeOrderField: binding('customer'),
        routeStart: binding('{{({ lat: 37.79, lng: -122.4 })}}'),
      },
    });

    await waitFor(() => expect(document.querySelectorAll('[data-shape]')).toHaveLength(4));
    expect([...document.querySelectorAll('[data-shape]')].map((b) => b.textContent)).toEqual([
      'Route Maya Chen, 3 points, from the start',
      'Route Owen Hart, 3 points, from the start',
      'Route Priya Nair, 3 points, from the start',
      'Route Leo Martins, 3 points, from the start',
    ]);
    expect(q('.sc-map-legend')).toHaveTextContent('Maya Chen');
  });

  test('[ShadMap-EVT-003] choosing a route or area fires onShapeClicked with selectedShape and selectedShapeType', async () => {
    render({
      properties: {
        routes: binding(ROUTE),
        routeColors: binding("{{({ 'Van 1': '#e11d48' })}}"),
        areas: binding(`{{[${AREA}]}}`),
      },
    });
    widget.setEvents(setVariableOn(ID, 'onShapeClicked', { value: '{{components.map1.selectedShapeType}}' }));

    await waitFor(() => expect(document.querySelectorAll('[data-shape]')).toHaveLength(2));
    const [route, area] = document.querySelectorAll('[data-shape]');
    expect(area).toHaveTextContent('Area North, Overloaded');
    fireEvent.click(area);
    await waitFor(() => expect(widget.variables().seen).toBe('area'));
    expect(exposed().selectedShape).toMatchObject({ name: 'North' });
    fireEvent.click(route);
    await waitFor(() => expect(exposed().selectedShapeType).toBe('route'));
    expect(q('.sc-map-legend')).toHaveTextContent('Van 1');
    fireEvent.click(canvas());
    await waitFor(() => expect(exposed().selectedShapeType).toBeNull());
  });

  test('[ShadMap-PROP-007] areas read areaShapeField, areaTitleField and areaStatusField; areaRadiusField draws circles the view fits', async () => {
    render({
      properties: {
        areas: binding(
          "{{[{ ring: [[37.8, -122.47], [37.81, -122.4], [37.78, -122.4]], label: 'Northern zone', state: 'Busy' }]}}"
        ),
        areaShapeField: binding('ring'),
        areaTitleField: binding('label'),
        areaStatusField: binding('state'),
      },
    });
    await waitFor(() => expect(q('[data-shape]')).toHaveTextContent('Area Northern zone, Busy'));

    render({
      properties: {
        data: binding('{{[]}}'),
        areas: binding("{{[{ name: 'Wide', lat: 37.77, lng: -122.42, r: 20000 }]}}"),
        areaRadiusField: binding('r'),
      },
    });
    await waitFor(() => expect(exposed().zoom).toBeLessThan(11));
    expect(q('.sc-map-empty')).toBeNull();
  });

  test('[ShadMap-PROP-008] display heat draws a heat layer of heatRadius from heatField weights; both keeps the pins', async () => {
    render({ properties: { display: binding('heat'), heatRadius: binding('{{40}}') } });
    await waitFor(() => expect(q('canvas.sc-map-heat')).toHaveAttribute('data-points', '8'));
    expect(q('canvas.sc-map-heat')).toHaveAttribute('data-radius', '40');
    expect(pins()).toHaveLength(0);

    // Rows without a positive weight are left out.
    render({
      properties: {
        display: binding('both'),
        heatField: binding('load'),
        data: binding('{{[{ id: 1, lat: 37.8, lng: -122.4, load: 5 }, { id: 2, lat: 37.7, lng: -122.5, load: 0 }]}}'),
      },
    });
    await waitFor(() => expect(q('canvas.sc-map-heat')).toHaveAttribute('data-points', '1'));
    expect(pins()).toHaveLength(2);
  });

  test('[ShadMap-EVT-004] pickLocation places a pin on click, exposing pickedLocation before onLocationPicked fires', async () => {
    render({ properties: { pickLocation: binding('{{true}}') } });
    widget.setEvents(setVariableOn(ID, 'onLocationPicked', { value: '{{components.map1.pickedLocation.lat}}' }));

    await waitFor(() => expect(q('.sc-map-pick-hint')).toBeTruthy());
    fireEvent.click(canvas());
    await waitFor(() => expect(typeof widget.variables().seen).toBe('number'));
    expect(exposed().pickedLocation).toEqual({ lat: expect.any(Number), lng: expect.any(Number) });
    expect(q('[data-picked]')).toBeTruthy();
  });

  test('[ShadMap-ACT-001] setPickedLocation and clearPickedLocation; defaultPickedLocation applies only while picking', async () => {
    render({ properties: { pickLocation: binding('{{true}}'), defaultPickedLocation: binding('37.79, -122.41') } });
    await waitFor(() => expect(exposed().pickedLocation).toEqual({ lat: 37.79, lng: -122.41 }));
    await widget.act('clearPickedLocation');
    await waitFor(() => expect(exposed().pickedLocation).toEqual({}));
    await widget.act('setPickedLocation', 37.7, -122.5);
    await waitFor(() => expect(exposed().pickedLocation).toEqual({ lat: 37.7, lng: -122.5 }));

    render({ properties: { defaultPickedLocation: binding('37.79, -122.41') } });
    await settle();
    expect(exposed().pickedLocation).toEqual({});
  });

  test('[ShadMap-ACT-002] setCenter, setZoom and fitBounds move the view without firing onBoundsChange', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onBoundsChange'));

    await widget.act('setCenter', 51.5074, -0.1278, 9);
    await waitFor(() => expect(exposed().center).toEqual({ lat: 51.5074, lng: -0.1278 }));
    expect(exposed().zoom).toBe(9);
    await widget.act('setCenter', { lat: 48.8566, lng: 2.3522 });
    await waitFor(() => expect(exposed().center).toEqual({ lat: 48.8566, lng: 2.3522 }));
    await widget.act('setZoom', 4);
    await waitFor(() => expect(exposed().zoom).toBe(4));
    await widget.act('fitBounds');
    await waitFor(() => expect(exposed().zoom).toBe(13));
    expect(widget.variables().seen).toBeUndefined();
  });

  test('[ShadMap-ACT-003] selectMarker opens a stop by id and clearSelection closes it, firing nothing', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onMarkerClick'));

    await widget.act('selectMarker', 'S-106');
    await waitFor(() => expect(exposed().selectedMarker.customer).toBe('Union Square Books'));
    expect(popup()).toHaveTextContent('Failed');
    await widget.act('clearSelection');
    await waitFor(() => expect(exposed().selectedMarkerId).toBeNull());
    expect(popup()).toBeNull();
    expect(widget.variables().seen).toBeUndefined();
  });

  test('[ShadMap-PROP-009] new data refits the view and drops a selection whose row is gone', async () => {
    render();
    await waitFor(() => expect(pin('S-101')).toBeTruthy());
    fireEvent.click(pin('S-101'));

    widget.setComponentProperty(
      ID,
      'data',
      "{{[{ id: 'X', customer: 'Paris office', lat: 48.8566, lng: 2.3522 }]}}",
      'properties'
    );
    await waitFor(() => expect(pins()).toHaveLength(1));
    await waitFor(() => expect(exposed().center).toEqual({ lat: 48.8566, lng: 2.3522 }));
    expect(exposed().selectedMarkerId).toBeNull();
  });

  test('[ShadMap-ACT-004] mapStyle and the style switch (showStyleSwitch) turn on satellite imagery; setMapStyle ignores junk', async () => {
    render({ properties: { showStyleSwitch: binding('{{true}}') } });

    await waitFor(() => expect(canvas()).toHaveAttribute('data-style', 'streets'));
    fireEvent.click(screen.getByRole('radio', { name: 'Satellite' }));
    await waitFor(() => expect(canvas()).toHaveAttribute('data-style', 'satellite'));
    expect(canvas().getAttribute('data-tiles')).toContain('World_Imagery');
    expect(exposed().mapStyle).toBe('satellite');
    await widget.act('setMapStyle', 'streets');
    await waitFor(() => expect(canvas()).toHaveAttribute('data-style', 'streets'));
    await widget.act('setMapStyle', 'junk');
    expect(exposed().mapStyle).toBe('streets');

    render({ properties: { mapStyle: binding('satellite') } });
    await waitFor(() => expect(canvas()).toHaveAttribute('data-style', 'satellite'));
    expect(q('.sc-map-style-switch')).toBeNull();
  });

  test('[ShadMap-KBD-001] the wheel scrolls the page unless Ctrl is held, or scrollWheelZoom is on', async () => {
    render();
    await waitFor(() => expect(exposed().zoom).toBe(13));

    fireEvent.wheel(canvas(), { deltaY: -100 });
    await waitFor(() => expect(q('.sc-map-wheel-hint')).toBeTruthy());
    expect(exposed().zoom).toBe(13);
    fireEvent.wheel(canvas(), { deltaY: -100, ctrlKey: true });
    await waitFor(() => expect(exposed().zoom).toBeGreaterThan(13));

    render({ properties: { scrollWheelZoom: binding('{{true}}') } });
    await waitFor(() => expect(q('.sc-map')).toHaveAttribute('data-wheel-zoom', 'true'));
  });

  test('[ShadMap-KBD-002] showFullscreen fills the window where the browser has no fullscreen; Escape leaves it', async () => {
    render();

    fireEvent.click(await screen.findByRole('button', { name: 'Full screen' }));
    await waitFor(() => expect(q('.sc-map')).toHaveAttribute('data-expanded', 'true'));
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(q('.sc-map')).not.toHaveAttribute('data-expanded'));

    render({ properties: { showFullscreen: binding('{{false}}') } });
    await waitFor(() => expect(canvas()).toBeTruthy());
    expect(q('[data-fullscreen]')).toBeNull();
  });

  test('[ShadMap-PROP-010] tileUrl and tileAttribution draw the app own tiles, the attribution as text, never markup', async () => {
    render({
      properties: {
        tileUrl: binding('https://tiles.example/{z}/{x}/{y}.png'),
        tileAttribution: binding('Example <img src=x onerror=alert(1)>'),
      },
    });

    await waitFor(() => expect(canvas()).toHaveAttribute('data-tiles', 'https://tiles.example/{z}/{x}/{y}.png'));
    expect(q('.leaflet-control-attribution')).toHaveTextContent('Example');
    expect(q('.leaflet-control-attribution img')).toBeNull();
  });

  // Nominatim's usage policy forbids searching as you type against its public service. Real timers: the geocoder's
  // one-request-a-second queue is shared by every map on the page.
  describe('address search', () => {
    let fetchMock;
    const realFetch = global.fetch;
    const calls = (re) => fetchMock.mock.calls.map(([url]) => url).filter((url) => re.test(url));
    beforeEach(() => {
      fetchMock = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
      global.fetch = fetchMock;
    });
    afterEach(() => {
      global.fetch = realFetch;
    });

    test('[ShadMap-PROP-011] showSearch with searchPlaceholder searches the default Nominatim only on Enter', async () => {
      render({ properties: { showSearch: binding('{{true}}'), searchPlaceholder: binding('Find a stop') } });

      const input = await screen.findByRole('searchbox', { name: 'Find a stop' });
      expect(input).toHaveAttribute('placeholder', 'Find a stop');
      fireEvent.change(input, { target: { value: 'Ferry Building' } });
      await settle(900);
      expect(calls(/search/)).toEqual([]);
      expect(q('.sc-map-search-note')).toHaveTextContent('Press Enter to search');
      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => expect(calls(/search/)).toHaveLength(1), { timeout: 4000 });
      expect(calls(/search/)[0]).toContain('nominatim.openstreetmap.org/search');
      expect(calls(/search/)[0]).toContain('Ferry%20Building');
    }, 10000);

    test('[ShadMap-PROP-012] geocoderUrl is the app own geocoder, searched as you type', async () => {
      render({
        properties: {
          showSearch: binding('{{true}}'),
          geocoderUrl: binding('https://photon.komoot.io/api/?q={query}'),
        },
      });

      fireEvent.change(await screen.findByRole('searchbox'), { target: { value: 'Embarcadero' } });
      await waitFor(() => expect(calls(/photon/)).toEqual(['https://photon.komoot.io/api/?q=Embarcadero']), {
        timeout: 4000,
      });
    }, 10000);

    test('[ShadMap-PROP-013] reverseGeocoderUrl looks up the picked spot, adding its address to pickedLocation', async () => {
      fetchMock.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ display_name: 'Pier 39, San Francisco', lat: '37.81', lon: '-122.41' }),
        })
      );
      render({
        properties: {
          pickLocation: binding('{{true}}'),
          reverseGeocoderUrl: binding('https://geo.example/reverse?lat={lat}&lon={lng}'),
        },
      });

      await widget.act('setPickedLocation', 37.81, -122.41);
      await waitFor(() => expect(exposed().pickedLocation.address).toBe('Pier 39, San Francisco'), { timeout: 4000 });
      expect(calls(/geo\.example/)).toEqual(['https://geo.example/reverse?lat=37.81&lon=-122.41']);
    }, 10000);

    // A geocoder that answers each query with "<query> result" at 10, 20. Each scenario has its own URL: the client
    // keeps answers by URL for the whole page.
    const answerByQuery = (url) =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([{ lat: '10', lon: '20', display_name: `${new URL(url).searchParams.get('q')} result` }]),
      });

    test('[ShadMap-EVT-005] Enter on a new query picks nothing from the previous query, then picks the new place', async () => {
      // Release audit 42: Enter during the pause after typing Beta picked Alpha's place and fired onLocationPicked.
      fetchMock.mockImplementation(answerByQuery);
      render({
        properties: {
          showSearch: binding('{{true}}'),
          pickLocation: binding('{{true}}'),
          geocoderUrl: binding('https://geo.example/evt-005/search?q={query}'),
        },
      });
      const input = await screen.findByRole('searchbox');
      fireEvent.change(input, { target: { value: 'Alpha' } });
      await screen.findByRole('button', { name: 'Alpha result' }, { timeout: 4000 });

      fireEvent.change(input, { target: { value: 'Beta' } });
      expect(screen.queryByRole('button', { name: 'Alpha result' })).not.toBeInTheDocument();
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(exposed().pickedLocation).toEqual({});
      expect(input).toHaveValue('Beta');

      await screen.findByRole('button', { name: 'Beta result' }, { timeout: 4000 });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(exposed().pickedLocation).toEqual({ lat: 10, lng: 20, address: 'Beta result' });
    }, 10000);

    test('[ShadMap-ACT-005] an address lookup still running when the map unmounts writes nothing, not even into a new mount', async () => {
      // Release audit 43: the old mount's answer arrived after a remount and wrote its address into the new map.
      let answer;
      fetchMock.mockImplementation(() => new Promise((resolve) => (answer = resolve)));
      const props = {
        properties: {
          pickLocation: binding('{{true}}'),
          reverseGeocoderUrl: binding('https://geo.example/act-005/reverse?lat={lat}&lon={lng}'),
        },
      };
      render(props);
      await widget.act('setPickedLocation', 12, 22);
      await waitFor(() => expect(answer).toBeInstanceOf(Function), { timeout: 4000 });

      act(() => widget.session.render(React.createElement(React.Fragment)));
      render(props);
      expect(exposed().pickedLocation).toEqual({});
      await act(async () =>
        answer({ ok: true, json: () => Promise.resolve([{ lat: '12', lon: '22', display_name: 'Old mount address' }]) })
      );
      await settle();
      expect(exposed().pickedLocation).toEqual({});
    }, 10000);

    test('[ShadMap-ACT-006] repeated setPickedLocation on one spot shares one address lookup', async () => {
      let answer;
      fetchMock.mockImplementation(() => new Promise((resolve) => (answer = resolve)));
      render({
        properties: {
          pickLocation: binding('{{true}}'),
          reverseGeocoderUrl: binding('https://geo.example/act-006/reverse?lat={lat}&lon={lng}'),
        },
      });
      for (let i = 0; i < 5; i++) await widget.act('setPickedLocation', 12, 22);
      await waitFor(() => expect(answer).toBeInstanceOf(Function), { timeout: 4000 });
      await act(async () =>
        answer({ ok: true, json: () => Promise.resolve([{ lat: '12', lon: '22', display_name: 'Shared address' }]) })
      );
      await waitFor(() => expect(exposed().pickedLocation).toEqual({ lat: 12, lng: 22, address: 'Shared address' }));
      // The others would each have waited their turn in the one-a-second queue for the same answer.
      await settle(1500);
      expect(calls(/act-006/)).toHaveLength(1);
    }, 10000);
  });

  test('[ShadMap-STY-001] background, border, accent, cluster colour and radius reach the map as CSS variables', async () => {
    const { container } = render({
      styles: {
        backgroundColor: binding('#f8fafc'),
        borderColor: binding('#cbd5e1'),
        accentColor: binding('#0ea5e9'),
        clusterColor: binding('#7c3aed'),
        borderRadius: binding('{{14}}'),
      },
    });

    const root = container.querySelector('.tj-shadcn');
    await waitFor(() => expect(root.style.getPropertyValue('--lk-cluster')).toBe('#7c3aed'));
    expect(['--lk-bg', '--lk-border', '--lk-accent', '--lk-radius'].map((v) => root.style.getPropertyValue(v))).toEqual(
      ['#f8fafc', '#cbd5e1', '#0ea5e9', '14px']
    );
  });
});
