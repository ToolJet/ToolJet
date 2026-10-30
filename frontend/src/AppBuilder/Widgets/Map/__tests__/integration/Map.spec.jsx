import { screen, waitFor, fireEvent } from '@testing-library/react';
// __getMapProps/__resetMapProps are test-only exports of the jest module mock
// (jest.config moduleNameMapper -> __mocks__/reactGoogleMapsApi.jsx). The real
// @react-google-maps/api has no such exports, so the static import/named rule
// (which resolves the real package, not the runtime mock) flags them.
// eslint-disable-next-line import/named
import { __getMapProps, __resetMapProps, __setLoaderState } from '@react-google-maps/api';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  setVariableOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// Engineering scenarios for the Map widget.
// Contract: frontend/ee/test/app-builder/widgets/Map/TESTING.md.
// @react-google-maps/api is mocked at the module boundary (jest.config
// moduleNameMapper -> __mocks__/reactGoogleMapsApi.jsx): the stub renders the
// children and captures the lib callbacks; __getMapProps() exposes the latest
// captured props so scenarios drive the widget's OWN handlers (onLoad, map/marker/
// polygon clicks, drag, search) without a real Google map. Real tiles/geometry/
// Places are QA (BRW-*). Each test is GREEN against current production and proven
// RED by the fault named in its `// Break this catches:` note.

const ID = 'map1';

const widget = createWidgetHarness({
  componentType: 'Map',
  handle: ID,
  id: ID,
  defaultProperties: {
    initialLocation: binding('{{ {"lat": 40.7128, "lng": -73.935242} }}'),
    defaultMarkers: binding('{{ [{"lat": 40.7128, "lng": -73.935242}] }}'),
    polygonPoints: binding(
      '{{ [{"lat": 40.7032, "lng": -73.975242},{"lat": 40.7532, "lng": -73.943242},{"lat": 40.7032, "lng": -73.916242}] }}'
    ),
    addNewMarkers: binding('{{true}}'),
    canSearch: binding('{{true}}'),
    collapseWhenHidden: binding('{{false}}'),
  },
  defaultStyles: {
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
  },
});

const exposed = () => store().getExposedValueOfComponent(ID, MODULE_ID);
const container = () => document.querySelector('.map-widget');
const mapProps = () => __getMapProps().googleMap;

const counter = (event) =>
  setVariableOn(ID, event, { key: `${event}Count`, value: `{{(variables.${event}Count ?? 0) + 1}}` });

// A fake Google map instance for onLoad/onDragEnd (getBounds + center.toJSON).
const fakeGmap = () => ({
  getBounds: () => ({
    getNorthEast: () => ({ toJSON: () => ({ lat: 45, lng: -70 }) }),
    getSouthWest: () => ({ toJSON: () => ({ lat: 40, lng: -75 }) }),
  }),
  center: { toJSON: () => ({ lat: 42, lng: -72 }) },
});

let consoleSpy;
let originalPublicConfig;

describe('Map widget', () => {
  beforeEach(() => {
    widget.setup();
    __resetMapProps();
    originalPublicConfig = window.public_config;
    window.public_config = { ...(window.public_config || {}), GOOGLE_MAPS_API_KEY: 'test-key' };
    // Map logs the visibility-parse catch (Map.jsx:43); keep output pristine.
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    window.public_config = originalPublicConfig;
    consoleSpy.mockRestore();
    widget.teardown();
  });

  // --- Exposed state ----------------------------------------------------------

  test('[Map-VAR-001] mount seeds center, markers, and setLocation', async () => {
    // Break this catches: the mount effect not exposing center/markers/setLocation
    // (Map.jsx:146-157), so {{map1.center}}/{{map1.markers}}/setLocation are undefined.
    widget.render({});

    await waitFor(() => expect(exposed().setLocation).toBeInstanceOf(Function));
    expect(exposed().center).toMatchObject({ lat: 40.7128, lng: -73.935242 });
    expect(exposed().center.googleMapUrl).toContain('40.7128');
    expect(exposed().markers).toEqual([{ lat: 40.7128, lng: -73.935242 }]);
  });

  test('[Map-VAR-002] onLoad publishes center from the map instance', async () => {
    // Break this catches: onLoad not publishing center (Map.jsx:131-135), so the
    // map center never reaches the app once the map is ready.
    widget.render({});
    await waitFor(() => expect(typeof mapProps().onLoad).toBe('function'));

    await widget.session.store.act(async () => {
      mapProps().onLoad({ center: { toJSON: () => ({ lat: 10, lng: 20 }) } });
    });

    await waitFor(() => expect(exposed().center).toMatchObject({ lat: 10, lng: 20 }));
    expect(exposed().center.googleMapUrl).toContain('10,20');
  });

  // --- CSA (setLocation) ------------------------------------------------------

  test('[Map-CSA-001] setLocation recenters the map and publishes the exposed center', async () => {
    // Break this catches: setLocation not calling setMapCenter OR not publishing
    // the exposed center (bug-fix batch 2026-10-26, bug 5a: the map moved but
    // {{map1.center}} kept the old value forever).
    widget.render({});
    await waitFor(() => expect(exposed().setLocation).toBeInstanceOf(Function));

    await widget.act('setLocation', 12, 34);

    await waitFor(() => expect(mapProps().center).toMatchObject({ lat: 12, lng: 34 }));
    expect(exposed().center).toMatchObject({ lat: 12, lng: 34 });
    expect(exposed().center.googleMapUrl).toContain('12,34');
  });

  test('[Map-CSA-002] setLocation survives an unrelated re-resolve', async () => {
    // Break this catches: the center effect re-resolving on every render instead of
    // only on an initialLocation change (Map.jsx:113 dep), so an unrelated property
    // change would snap the map back to initialLocation.
    widget.render({});
    await widget.act('setLocation', 12, 34);
    await waitFor(() => expect(mapProps().center).toMatchObject({ lat: 12, lng: 34 }));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'canSearch', '{{false}}', 'properties');
    });

    await waitFor(() => expect(mapProps().center).toMatchObject({ lat: 12, lng: 34 }));
  });

  test('[Map-CSA-003] setLocation accepts 0 coordinates; non-finite input is the no-op', async () => {
    // Break this catches: reintroducing the `if (lat && lng)` falsy guard that
    // rejected the equator/prime meridian (bug-fix batch 2026-10-26, bug 5b:
    // setLocation(0, 10) was silently ignored), or dropping the finite-number
    // guard so garbage would clobber the center.
    widget.render({});
    await widget.act('setLocation', 12, 34);
    await waitFor(() => expect(mapProps().center).toMatchObject({ lat: 12, lng: 34 }));

    await widget.act('setLocation', 0, 10);
    await waitFor(() => expect(mapProps().center).toMatchObject({ lat: 0, lng: 10 }));
    expect(exposed().center).toMatchObject({ lat: 0, lng: 10 });

    await widget.act('setLocation', 'garbage', 10);
    expect(mapProps().center).toMatchObject({ lat: 0, lng: 10 });
  });

  // --- Events -----------------------------------------------------------------

  test('[Map-EVT-001] marker click exposes selectedMarker and fires onMarkerClick', async () => {
    // Break this catches: handleMarkerClick not exposing selectedMarker / not firing
    // onMarkerClick (Map.jsx:139-140), so a clicked marker never reaches the app.
    widget.render({
      properties: { defaultMarkers: binding('{{ [{"lat":1,"lng":2},{"lat":3,"lng":4}] }}') },
      events: counter('onMarkerClick'),
    });
    await waitFor(() => expect(screen.getAllByTestId('map-marker')).toHaveLength(2));

    await widget.session.store.act(async () => {
      fireEvent.click(screen.getAllByTestId('map-marker')[1]);
    });

    await waitFor(() => expect(exposed().selectedMarker).toMatchObject({ lat: 3, lng: 4 }));
    expect(widget.variables().onMarkerClickCount).toBe(1);
  });

  test('[Map-EVT-002] polygon click fires onPolygonClick', async () => {
    // Break this catches: the Polygon onClick not firing onPolygonClick
    // (Map.jsx:216), so clicking the polygon does nothing.
    widget.render({ events: counter('onPolygonClick') });
    await waitFor(() => expect(screen.getByTestId('map-polygon')).toBeInTheDocument());

    await widget.session.store.act(async () => {
      fireEvent.click(screen.getByTestId('map-polygon'));
    });

    expect(widget.variables().onPolygonClickCount).toBe(1);
  });

  test('[Map-EVT-003] map click with addNewMarkers appends a marker and fires onCreateMarker', async () => {
    // Break this catches: handleMapClick not appending/publishing markers or not
    // firing onCreateMarker (Map.jsx:80-86), so a placed marker never reaches the app.
    widget.render({
      properties: { addNewMarkers: binding('{{true}}'), defaultMarkers: binding('{{ [] }}') },
      events: counter('onCreateMarker'),
    });
    await waitFor(() => expect(typeof mapProps().onClick).toBe('function'));

    await widget.session.store.act(async () => {
      mapProps().onClick({ latLng: { lat: () => 1, lng: () => 2 } });
    });

    await waitFor(() => expect(exposed().markers).toContainEqual({ lat: 1, lng: 2 }));
    expect(widget.variables().onCreateMarkerCount).toBe(1);
  });

  test('[Map-EVT-004] map click without addNewMarkers is a no-op', async () => {
    // Break this catches: dropping the `if (!canAddNewMarkers) return` guard
    // (Map.jsx:72-74), so clicks would add markers even when the feature is off.
    widget.render({
      properties: { addNewMarkers: binding('{{false}}'), defaultMarkers: binding('{{ [] }}') },
      events: counter('onCreateMarker'),
    });
    await waitFor(() => expect(typeof mapProps().onClick).toBe('function'));

    await widget.session.store.act(async () => {
      mapProps().onClick({ latLng: { lat: () => 1, lng: () => 2 } });
    });

    expect(exposed().markers).toEqual([]);
    expect(widget.variables().onCreateMarkerCount).toBeUndefined();
  });

  test('[Map-BOUNDS-001] a settled viewport change (idle) publishes bounds + center and fires onBoundsChange', async () => {
    // Break this catches: the viewport listener going back to drag-only (bug-fix
    // batch 2026-10-26, bug 4: zooming never fired On bounds change and bounds
    // stayed empty — the real map fires `idle` after EVERY settled change: drag,
    // zoom, programmatic recenter).
    widget.render({ events: counter('onBoundsChange') });
    await waitFor(() => expect(typeof mapProps().onLoad).toBe('function'));

    await widget.session.store.act(async () => {
      mapProps().onLoad(fakeGmap());
    });
    await waitFor(() => expect(typeof mapProps().onIdle).toBe('function'));
    // first idle = initial load settle: publishes state, no event (see BOUNDS-002)
    await widget.session.store.act(async () => {
      mapProps().onIdle();
    });
    // second idle = a real viewport change (zoom/drag)
    await widget.session.store.act(async () => {
      mapProps().onIdle();
    });

    await waitFor(() =>
      expect(exposed().bounds).toEqual({ northEast: { lat: 45, lng: -70 }, southWest: { lat: 40, lng: -75 } })
    );
    expect(exposed().center).toMatchObject({ lat: 42, lng: -72 });
    expect(widget.variables().onBoundsChangeCount).toBe(1);
  });

  test('[Map-BOUNDS-002] the initial load settle publishes bounds without firing onBoundsChange', async () => {
    // Break this catches: either leaving bounds empty until the user drags (the
    // old behavior — {{map1.bounds}} was undefined at load), or firing a spurious
    // onBoundsChange on mount that apps would see as a phantom user action.
    widget.render({ events: counter('onBoundsChange') });
    await waitFor(() => expect(typeof mapProps().onLoad).toBe('function'));

    await widget.session.store.act(async () => {
      mapProps().onLoad(fakeGmap());
    });
    await widget.session.store.act(async () => {
      mapProps().onIdle();
    });

    await waitFor(() =>
      expect(exposed().bounds).toEqual({ northEast: { lat: 45, lng: -70 }, southWest: { lat: 40, lng: -75 } })
    );
    expect(widget.variables().onBoundsChangeCount).toBeUndefined();
  });

  test('[Map-BOUNDS-003] one settled drag/zoom/pan fires onBoundsChange once; an app recenter still fires once', async () => {
    // Break this catches: handleIdle writing the map's OWN center back into the
    // GoogleMap `center` prop (bug-fix 2026-10-30, QA: On bounds change fired twice
    // for every drag, zoom or keyboard pan). The lib re-applies the new center via
    // map.setCenter and the real SDK settles AGAIN (a second idle) even for unchanged
    // coordinates - live: drag, wheel zoom and arrow pan each fired 2 events. The
    // setLocation half catches a fix that swallows the idle after an app recenter.
    widget.render({ events: counter('onBoundsChange') });
    await waitFor(() => expect(typeof mapProps().onLoad).toBe('function'));

    // SDK-faithful instance: it starts at initialLocation (like the real map);
    // setCenter moves the map, then the SDK settles with `idle` - even when the
    // coordinates did not change (live-verified 2026-10-30).
    let sdkCenter = { lat: 40.7128, lng: -73.935242 };
    const gmap = {
      ...fakeGmap(),
      center: { toJSON: () => ({ ...sdkCenter }) },
      setCenter: (next) => {
        sdkCenter = { lat: next.lat, lng: next.lng };
        mapProps().onIdle();
      },
    };
    await widget.session.store.act(async () => {
      mapProps().onLoad(gmap);
    });
    await widget.session.store.act(async () => {
      mapProps().onIdle(); // initial load settle: publishes, no event
    });

    // A user drag/zoom/pan: the SDK moves the map itself, then settles once.
    sdkCenter = { lat: 43, lng: -71 };
    await widget.session.store.act(async () => {
      mapProps().onIdle();
    });

    await waitFor(() => expect(exposed().center).toMatchObject({ lat: 43, lng: -71 }));
    expect(widget.variables().onBoundsChangeCount).toBe(1);

    // An app-driven recenter: setCenter -> exactly one settle -> exactly one event.
    await widget.act('setLocation', 12, 34);

    await waitFor(() => expect(widget.variables().onBoundsChangeCount).toBeGreaterThanOrEqual(2));
    expect(widget.variables().onBoundsChangeCount).toBe(2);
    expect(exposed().center).toMatchObject({ lat: 12, lng: 34 });
  });

  // --- Search -----------------------------------------------------------------

  test('[Map-SEARCH-001] canSearch gates the search input', async () => {
    // Break this catches: dropping the `canSearch &&` gate (Map.jsx:193), so the
    // search box renders even when search is disabled.
    widget.render({ properties: { canSearch: binding('{{true}}') } });
    await waitFor(() => expect(container()).toBeInTheDocument());
    expect(container().querySelector('.place-search-input')).toBeInTheDocument();

    widget.render({ properties: { canSearch: binding('{{false}}') } });
    await waitFor(() => expect(container()).toBeInTheDocument());
    expect(container().querySelector('.place-search-input')).not.toBeInTheDocument();
  });

  test('[Map-SEARCH-002] a picked place recenters the map and publishes the new center', async () => {
    // Break this catches: onPlaceChanged synchronously reading the STALE map
    // instance (bug-fix batch 2026-10-26, bug 1: the old handleBoundsChange call
    // read gmap.center — still the old location — and clobbered the just-set new
    // center, so picking a place never moved the map and exposed the old centre).
    widget.render({ properties: { canSearch: binding('{{true}}') }, events: counter('onBoundsChange') });
    await waitFor(() => expect(typeof mapProps().onLoad).toBe('function'));

    await widget.session.store.act(async () => {
      mapProps().onLoad(fakeGmap()); // stale instance still centered at 42/-72
    });
    await waitFor(() => expect(typeof __getMapProps().autocomplete.onLoad).toBe('function'));
    await widget.session.store.act(async () => {
      __getMapProps().autocomplete.onLoad({
        getPlace: () => ({ geometry: { location: { toJSON: () => ({ lat: 5, lng: 6 }) } } }),
      });
    });
    await widget.session.store.act(async () => {
      __getMapProps().autocomplete.onPlaceChanged();
    });

    // The map recenters to the PICKED place and the exposed center is the new
    // location — not the stale instance's 42/-72.
    await waitFor(() => expect(mapProps().center).toMatchObject({ lat: 5, lng: 6 }));
    expect(exposed().center).toMatchObject({ lat: 5, lng: 6 });
  });

  test('[Map-SEARCH-003] a searched place with no location is ignored (PR 17594 guard)', async () => {
    // Break this catches: dropping the `if (!location) return` guard (Map.jsx:146),
    // so a place with no geometry.location would recenter/crash instead of no-op.
    widget.render({ properties: { canSearch: binding('{{true}}') }, events: counter('onBoundsChange') });
    await waitFor(() => expect(typeof __getMapProps().autocomplete.onLoad).toBe('function'));

    await widget.session.store.act(async () => {
      __getMapProps().autocomplete.onLoad({ getPlace: () => ({}) });
    });
    const centerBefore = mapProps().center;

    await widget.session.store.act(async () => {
      __getMapProps().autocomplete.onPlaceChanged();
    });

    expect(mapProps().center).toEqual(centerBefore);
    expect(widget.variables().onBoundsChangeCount).toBeUndefined();
  });

  // --- Markers / polygon / bindings ------------------------------------------

  test('[Map-MARK-001] one Marker renders per markers entry', async () => {
    // Break this catches: markers.map not rendering a Marker per entry
    // (Map.jsx:206-210), so configured markers never appear.
    widget.render({
      properties: { defaultMarkers: binding('{{ [{"lat":1,"lng":2},{"lat":3,"lng":4},{"lat":5,"lng":6}] }}') },
    });

    await waitFor(() => expect(screen.getAllByTestId('map-marker')).toHaveLength(3));
  });

  test('[Map-MARK-002] defaultMarkers change republishes markers and re-renders', async () => {
    // Break this catches: the defaultMarkers effect not setMarkers/republishing
    // (Map.jsx:57-59,66-69), so a changed markers binding is ignored.
    widget.render({ properties: { defaultMarkers: binding('{{ [{"lat":1,"lng":2}] }}') } });
    await waitFor(() => expect(screen.getAllByTestId('map-marker')).toHaveLength(1));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'defaultMarkers', '{{ [{"lat":1,"lng":2},{"lat":3,"lng":4}] }}', 'properties');
    });

    await waitFor(() =>
      expect(exposed().markers).toEqual([
        { lat: 1, lng: 2 },
        { lat: 3, lng: 4 },
      ])
    );
    expect(screen.getAllByTestId('map-marker')).toHaveLength(2);
  });

  test('[Map-POLY-001] the polygon renders only with more than one point', async () => {
    // Break this catches: the `polygonPoints.length > 1` gate (Map.jsx:213), so a
    // single/empty polygon would render (or a real one would not).
    widget.render({ properties: { polygonPoints: binding('{{ [{"lat":1,"lng":2},{"lat":3,"lng":4}] }}') } });
    await waitFor(() => expect(screen.getByTestId('map-polygon')).toBeInTheDocument());

    widget.render({ properties: { polygonPoints: binding('{{ [{"lat":1,"lng":2}] }}') } });
    await waitFor(() => expect(container()).toBeInTheDocument());
    expect(screen.queryByTestId('map-polygon')).not.toBeInTheDocument();
  });

  test('[Map-DATA-001] initialLocation change republishes center', async () => {
    // Break this catches: the center effect not republishing center on an
    // initialLocation change (Map.jsx:113-118), so a rebound center is ignored.
    widget.render({});
    await waitFor(() => expect(exposed().setLocation).toBeInstanceOf(Function));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'initialLocation', '{{ {"lat": 1, "lng": 2} }}', 'properties');
    });

    await waitFor(() => expect(exposed().center).toMatchObject({ lat: 1, lng: 2 }));
    expect(exposed().center.googleMapUrl).toContain('1,2');
  });

  // --- Styles / DOM -----------------------------------------------------------

  test('[Map-STYLE-001] visibility=false hides the container', async () => {
    // Break this catches: dropping the `display: visibility ? '' : 'none'` mapping
    // (Map.jsx:160), so a hidden map stays on screen.
    widget.render({ styles: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(container()).toBeInTheDocument());
    expect(container()).toHaveStyle({ display: 'none' });
  });

  test('[Map-STYLE-002] disabledState=true sets data-disabled', async () => {
    // Break this catches: dropping `data-disabled={disabledState}` (Map.jsx:159),
    // so the disabled state never reaches the DOM the platform CSS reads.
    widget.render({ styles: { disabledState: binding('{{true}}') } });

    await waitFor(() => expect(container()).toBeInTheDocument());
    expect(container()).toHaveAttribute('data-disabled', 'true');
  });

  test('[Map-STYLE-003] boxShadow is applied inline', async () => {
    // Break this catches: dropping `boxShadow: styles.boxShadow` (Map.jsx:160), so
    // the configured shadow never renders.
    widget.render({ styles: { boxShadow: binding('0px 1px 2px 0px rgb(10, 20, 30)') } });

    await waitFor(() => expect(container()).toBeInTheDocument());
    expect(container().style.boxShadow).toBe('0px 1px 2px 0px rgb(10, 20, 30)');
  });

  test('[Map-DOM-001] mount renders the container through the mocked lib', async () => {
    // Break this catches: the container not rendering / data-cy dropped
    // (Map.jsx:158-164), so the widget has no mount surface.
    widget.render({});

    await waitFor(() => expect(container()).toBeInTheDocument());
    expect(document.querySelector(`[data-cy="${ID}"]`)).toBeInTheDocument();
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
  });

  // --- Bug-fix batch 2026-10-26 -------------------------------------------------

  test('[Map-CRASH-001] an invalid initial location falls back instead of crashing the widget', async () => {
    // Break this catches: feeding an unsanitized initialLocation straight into
    // GoogleMap (bug-fix batch 2026-10-26, bug 2: {lat:'not-a-number'} threw
    // inside the SDK, killed the widget subtree, and — through LoadScript's
    // unmount cleanup deleting window.google — stopped every other Map on the page).
    widget.render({
      properties: { initialLocation: binding(`{{ {"lat": "not-a-number", "lng": null} }}`) },
    });

    await waitFor(() => expect(container()).toBeInTheDocument());
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
    expect(mapProps().center).toMatchObject({ lat: 0, lng: 0 });
    expect(exposed().center).toMatchObject({ lat: 0, lng: 0 });
  });

  test('[Map-MARK-003] invalid defaultMarkers entries are skipped, valid ones still render', async () => {
    // Break this catches: either the per-element validation schema failing the
    // WHOLE array on one bad entry (the widget then received [] — every marker
    // vanished, QA's actual repro), or rendering entries unfiltered so a bad one
    // reaches the Marker SDK (bug-fix batch 2026-10-26, bug 7).
    widget.render({
      properties: {
        defaultMarkers: binding('{{ [{"lat":1,"lng":2}, null, {"lat":"garbage"}, {"lat":3,"lng":4}] }}'),
      },
    });

    await waitFor(() => expect(screen.getAllByTestId('map-marker')).toHaveLength(2));
    const positions = __getMapProps().markers.map((m) => m.position);
    expect(positions).toEqual([
      { lat: 1, lng: 2 },
      { lat: 3, lng: 4 },
    ]);
  });

  test('[Map-MARK-004] clicking a surviving marker exposes ITS original entry', async () => {
    // Break this catches: indexing the click handler over the UNFILTERED array
    // after the invalid entries are skipped, which would expose the wrong marker
    // (or the invalid one) for every marker after a skipped entry.
    widget.render({
      properties: {
        defaultMarkers: binding('{{ [{"lat":1,"lng":2}, null, {"lat":3,"lng":4,"label":"B"}] }}'),
      },
      events: counter('onMarkerClick'),
    });
    await waitFor(() => expect(screen.getAllByTestId('map-marker')).toHaveLength(2));

    await widget.session.store.act(async () => {
      fireEvent.click(screen.getAllByTestId('map-marker')[1]);
    });

    await waitFor(() => expect(exposed().selectedMarker).toMatchObject({ lat: 3, lng: 4 }));
    expect(widget.variables().onMarkerClickCount).toBe(1);
  });

  test('[Map-DIS-001] a disabled Map blocks marker selection, map clicks, search and place picks', async () => {
    // Break this catches: disabledState only landing as a data attribute (CSS
    // pointer-events) while every handler stays live (bug-fix batch 2026-10-26,
    // bug 6: a disabled Map still selected markers and searched from the keyboard).
    widget.render({
      styles: { disabledState: binding('{{true}}') },
      properties: {
        canSearch: binding('{{true}}'),
        addNewMarkers: binding('{{true}}'),
        defaultMarkers: binding('{{ [{"lat":1,"lng":2}] }}'),
      },
      events: counter('onMarkerClick'),
    });
    await waitFor(() => expect(screen.getAllByTestId('map-marker')).toHaveLength(1));

    // search input is really disabled (keyboard cannot land in it)
    expect(container().querySelector('.place-search-input')).toBeDisabled();

    // marker click guarded (selectedMarker stays at its registered seed)
    const selectedBefore = exposed().selectedMarker;
    await widget.session.store.act(async () => {
      fireEvent.click(screen.getAllByTestId('map-marker')[0]);
    });
    expect(exposed().selectedMarker).toEqual(selectedBefore);
    expect(widget.variables().onMarkerClickCount).toBeUndefined();

    // map click guarded (no marker added)
    await widget.session.store.act(async () => {
      mapProps().onClick({ latLng: { lat: () => 9, lng: () => 9 } });
    });
    expect(screen.getAllByTestId('map-marker')).toHaveLength(1);

    // a place pick is guarded too
    await widget.session.store.act(async () => {
      __getMapProps().autocomplete.onLoad({
        getPlace: () => ({ geometry: { location: { toJSON: () => ({ lat: 5, lng: 6 }) } } }),
      });
    });
    await widget.session.store.act(async () => {
      __getMapProps().autocomplete.onPlaceChanged();
    });
    expect(mapProps().center).toMatchObject({ lat: 40.7128, lng: -73.935242 });
  });

  test('[Map-LOAD-001] the maps SDK loads through the shared singleton loader', async () => {
    // Break this catches: going back to a per-widget <LoadScript> mount (bug-fix
    // batch 2026-10-26, bugs 2+3: the SECOND LoadScript instance — a Map inside a
    // Modal — stayed on "Loading..." forever, and any instance's unmount cleanup
    // deleted window.google for every other Map on the page). useJsApiLoader keyed
    // by a shared id is the lib's own multi-instance mechanism.
    widget.render({});

    await waitFor(() => expect(screen.getByTestId('google-map')).toBeInTheDocument());
    const loader = __getMapProps().loader;
    expect(loader).not.toBeNull();
    expect(typeof loader.id).toBe('string');
    expect(loader.id.length).toBeGreaterThan(0);
    expect(loader.libraries).toContain('places');
  });

  test('[Map-LOAD-002] the not-yet-loaded SDK shows the loading placeholder, not a broken map', async () => {
    // Break this catches: rendering GoogleMap before the SDK is ready (window.google
    // undefined -> SDK throw), instead of the Loading placeholder the old LoadScript
    // showed while fetching.
    __setLoaderState({ isLoaded: false });
    widget.render({});

    await waitFor(() => expect(container()).toBeInTheDocument());
    expect(screen.queryByTestId('google-map')).not.toBeInTheDocument();
    expect(container().textContent).toMatch(/loading/i);
  });
});
