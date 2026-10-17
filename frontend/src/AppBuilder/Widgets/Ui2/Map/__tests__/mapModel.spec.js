import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import {
  FIT_MAX_ZOOM,
  SATELLITE,
  OSM,
  clampZoom,
  fitView,
  initialView,
  mapPoints,
  markerTone,
  parseCenter,
  popupLines,
  project,
  tileSource,
  toLatLng,
  unproject,
  viewBounds,
} from '@/AppBuilder/Widgets/Ui2/Map/mapModel';
import { NOMINATIM, fillUrl, geocoderUrls, parsePlaces } from '@/AppBuilder/Widgets/Ui2/Map/mapGeocoding';
import {
  ROUTE_PALETTE,
  TONE_COLORS,
  areaShapes,
  colorOf,
  heatPoints,
  legendItems,
  markerRoutes,
  routeRows,
  safeColor,
  statusFill,
  toPath,
} from '@/AppBuilder/Widgets/Ui2/Map/mapShapes';

describe('mapModel', () => {
  describe('coordinates', () => {
    it('reads numbers and numeric text, and rejects the rest', () => {
      expect(toLatLng(37.77, -122.41)).toEqual({ lat: 37.77, lng: -122.41 });
      expect(toLatLng(' 37.77 ', '-122.41')).toEqual({ lat: 37.77, lng: -122.41 });
      expect(toLatLng(91, 0.5)).toBeNull();
      expect(toLatLng(10, 181)).toBeNull();
      expect(toLatLng('', 3)).toBeNull();
      expect(toLatLng(null, 3)).toBeNull();
      expect(toLatLng(NaN, 3)).toBeNull();
      expect(toLatLng('1e3', 3)).toBeNull();
      expect(toLatLng('12 N', 3)).toBeNull();
      expect(toLatLng(true, 3)).toBeNull();
    });

    it('skips exactly 0, 0 (a missing location stored as zeros)', () => {
      expect(toLatLng(0, 0)).toBeNull();
      expect(toLatLng(0, 12)).toEqual({ lat: 0, lng: 12 });
    });

    it('takes a center as an object, a pair or text', () => {
      expect(parseCenter({ lat: 51.5, lng: -0.12 })).toEqual({ lat: 51.5, lng: -0.12 });
      expect(parseCenter({ latitude: 51.5, longitude: -0.12 })).toEqual({ lat: 51.5, lng: -0.12 });
      expect(parseCenter([51.5, -0.12])).toEqual({ lat: 51.5, lng: -0.12 });
      expect(parseCenter('51.5, -0.12')).toEqual({ lat: 51.5, lng: -0.12 });
      expect(parseCenter('London')).toBeNull();
      expect(parseCenter('')).toBeNull();
      expect(parseCenter([1])).toBeNull();
      expect(parseCenter(undefined)).toBeNull();
    });
  });

  describe('markers from rows', () => {
    const rows = [
      { id: 1, name: 'Ferry Building', lat: 37.7955, lng: -122.3937, status: 'Delivered', address: '1 Ferry Bldg' },
      { id: 2, name: 'No location', lat: null, lng: null, status: 'Open' },
      { id: 3, name: 'Union Square', lat: '37.788', lng: '-122.4075', status: 'Delayed' },
      'not a row',
      { id: 3, name: 'Same id', lat: 37.7, lng: -122.4 },
      { name: 'No id', lat: 37.71, lng: -122.41, status: 'in_transit' },
    ];

    it('keeps rows with valid coordinates and counts the rest', () => {
      const { points, skipped, rows: total } = mapPoints(rows, { titleField: 'name', subtitleField: 'address' });
      expect(points.map((p) => p.title)).toEqual(['Ferry Building', 'Union Square', 'Same id', 'No id']);
      expect(skipped).toBe(2);
      expect(total).toBe(6);
      expect(points[0]).toMatchObject({ lat: 37.7955, lng: -122.3937, subtitle: '1 Ferry Bldg', tone: 'success' });
      expect(points[1]).toMatchObject({ lat: 37.788, lng: -122.4075, tone: 'warning' });
    });

    it('gives every marker a key of its own: repeated ids get a suffix, rows without one their position', () => {
      const { points } = mapPoints(rows, { titleField: 'name' });
      expect(points.map((p) => p.key)).toEqual(['1', '3', '3~1', '#5']);
      expect(points.map((p) => p.id)).toEqual([1, 3, 3, null]);
    });

    it('keys repeated ids in linear work, keeping suffixes clear of ids that already have one', () => {
      // Release audit 54: each repeat searched its suffix from ~1 again, 2,001,000 key checks for 2,000 equal ids.
      const same = Array.from({ length: 2000 }, () => ({ id: 'A', lat: 1, lng: 2 }));
      const has = jest.spyOn(Set.prototype, 'has');
      const { points } = mapPoints(same);
      const probes = has.mock.calls.length;
      has.mockRestore();
      expect(probes).toBeLessThan(10 * same.length);
      expect(new Set(points.map((p) => p.key)).size).toBe(2000);
      expect(points.slice(0, 3).map((p) => p.key)).toEqual(['A', 'A~1', 'A~2']);

      const suffixed = [{ id: 'A' }, { id: 'A~1' }, { id: 'A' }, { id: 'A' }, { id: 'A~1' }].map((r) => ({
        ...r,
        lat: 1,
        lng: 2,
      }));
      expect(mapPoints(suffixed).points.map((p) => p.key)).toEqual(['A', 'A~1', 'A~2', 'A~3', 'A~1~1']);
    });

    it('reads the fields it is told to', () => {
      const data = [{ code: 'A', y: 10, x: 20, state: 'Failed' }];
      const { points } = mapPoints(data, { latField: 'y', lngField: 'x', titleField: 'code', statusField: 'state' });
      expect(points[0]).toMatchObject({ lat: 10, lng: 20, title: 'A', status: 'Failed', tone: 'danger' });
      expect(mapPoints(data, { latField: 'lat', lngField: 'lng' }).skipped).toBe(1);
      // An empty status field means no status; an unset one reads 'status'.
      const toned = [{ lat: 1, lng: 2, status: 'Failed' }];
      expect(mapPoints(toned, { statusField: '' }).points[0].tone).toBe('');
      expect(mapPoints(toned, {}).points[0].tone).toBe('danger');
    });

    it('never throws on junk', () => {
      for (const junk of [null, undefined, 'x', 42, {}, [null, [], 3], [{ lat: {}, lng: [] }]]) {
        expect(() => mapPoints(junk, { latField: {}, titleField: 7 })).not.toThrow();
      }
      expect(mapPoints('rows').points).toEqual([]);
    });

    it('handles 10,000 rows quickly', () => {
      const many = Array.from({ length: 10000 }, (_, i) => ({ id: i, lat: 37 + (i % 100) / 100, lng: -122 + i / 1e4 }));
      const started = Date.now();
      const { points } = mapPoints(many, {});
      expect(points).toHaveLength(10000);
      expect(Date.now() - started).toBeLessThan(500);
    });
  });

  describe('pin tones', () => {
    it('tones a status by its words, like the badges, with late stops amber', () => {
      expect(markerTone('Delivered')).toBe('success');
      expect(markerTone('Delayed')).toBe('warning');
      expect(markerTone('running_late')).toBe('warning');
      expect(markerTone('Pending')).toBe('warning');
      expect(markerTone('Failed')).toBe('danger');
      expect(markerTone('Open')).toBe('info');
      expect(markerTone('In transit')).toBe('info');
      expect(markerTone('danger')).toBe('danger');
      expect(markerTone('Stop 4')).toBe('');
      expect(markerTone('Overloaded')).toBe('danger');
      expect(markerTone('Under offer')).toBe('warning');
      expect(markerTone('Sold')).toBe('neutral');
      expect(markerTone('')).toBe('');
      expect(markerTone(undefined)).toBe('');
    });
  });

  describe('popup lines', () => {
    it('reads field specs as the Record list does', () => {
      const row = { eta: '9:10 AM', driver: 'Maya Chen', total: 1250, empty: '' };
      expect(popupLines(row, 'eta:ETA {}, driver, total|currency, empty, missing')).toEqual([
        'ETA 9:10 AM',
        'Maya Chen',
        '$1,250',
      ]);
      expect(popupLines(row, '')).toEqual([]);
      expect(popupLines(null, 'eta')).toEqual([]);
    });
    // A list of names, as models write metaFields, reached the widget as '' and showed nothing (2026-10-14).
    it('takes a list of specs too', () => {
      expect(popupLines({ eta: '9:10 AM', driver: 'Maya Chen' }, ['eta:ETA {}', 'driver'])).toEqual([
        'ETA 9:10 AM',
        'Maya Chen',
      ]);
    });
  });

  describe('Web Mercator', () => {
    it('projects and unprojects a point', () => {
      const p = { lat: 37.7749, lng: -122.4194 };
      const back = unproject(project(p));
      expect(back.lat).toBeCloseTo(p.lat, 6);
      expect(back.lng).toBeCloseTo(p.lng, 6);
      expect(project({ lat: 0, lng: 0 })).toEqual({ x: 128, y: 128 });
    });

    it('fits points to a box: the deepest half zoom step where they fit', () => {
      const stops = [
        { lat: 37.8063, lng: -122.4662 },
        { lat: 37.7614, lng: -122.3934 },
      ];
      const view = fitView(stops, 600, 420);
      expect(view.zoom).toBe(12.5);
      expect(view.center.lat).toBeCloseTo(37.7839, 2);
      expect(view.center.lng).toBeCloseTo(-122.4298, 3);
      // A narrower box, a wider view.
      expect(fitView(stops, 300, 420).zoom).toBe(11.5);
      // A taller one, closer in: the height bound the zoom here.
      expect(fitView(stops, 600, 800).zoom).toBe(13);
    });

    it('fits one point at a street zoom, not the deepest tiles', () => {
      expect(fitView([{ lat: 51.5, lng: -0.12 }], 600, 400)).toEqual({
        center: { lat: 51.5, lng: -0.12 },
        zoom: FIT_MAX_ZOOM,
      });
    });

    it('fits points across the world at a world zoom', () => {
      const view = fitView(
        [
          { lat: 60, lng: -150 },
          { lat: -40, lng: 170 },
        ],
        800,
        400
      );
      expect(view.zoom).toBe(1.5);
    });

    it('gives the bounds of a view', () => {
      const b = viewBounds({ lat: 0, lng: 0 }, 2, 512, 512);
      expect(b.northEast.lng).toBeCloseTo(90, 6);
      expect(b.southWest.lng).toBeCloseTo(-90, 6);
      expect(b.northEast.lat).toBeCloseTo(-b.southWest.lat, 6);
    });

    it('clamps zooms to the tiles there are', () => {
      expect(clampZoom(40)).toBe(18);
      expect(clampZoom(-3)).toBe(1);
      expect(clampZoom('7')).toBe(7);
      expect(clampZoom(7.3)).toBe(7.5);
      expect(clampZoom('x')).toBe(12);
      expect(clampZoom(NaN, null)).toBeNull();
    });
  });

  describe('the opening view', () => {
    const points = [
      { lat: 37.8063, lng: -122.4662 },
      { lat: 37.7614, lng: -122.3934 },
    ];
    it('fits the markers by default', () => {
      expect(initialView({ points, defaultZoom: 3, width: 600, height: 420 }).zoom).toBe(12.5);
    });
    it('opens on the default center without fitting', () => {
      expect(
        initialView({
          points,
          fitToMarkers: false,
          defaultCenter: '51.5, -0.12',
          defaultZoom: 9,
          width: 600,
          height: 420,
        })
      ).toEqual({ center: { lat: 51.5, lng: -0.12 }, zoom: 9 });
    });
    it("opens on the markers' middle at the default zoom without a center", () => {
      const view = initialView({ points, fitToMarkers: false, defaultZoom: 11, width: 600, height: 420 });
      expect(view.zoom).toBe(11);
      expect(view.center.lng).toBeCloseTo(-122.4298, 3);
    });
    it('shows the world with no markers and no center', () => {
      expect(initialView({ points: [], defaultZoom: 11 })).toEqual({ center: { lat: 20, lng: 0 }, zoom: 2 });
    });
  });

  describe('tiles', () => {
    it("draws OpenStreetMap's tiles by default, toned to the theme", () => {
      expect(tileSource({ darkMode: false })).toMatchObject({ url: OSM.url, basemap: 'light' });
      expect(tileSource({ darkMode: true })).toMatchObject({ url: OSM.url, basemap: 'dark' });
      expect(tileSource({}).attribution).toMatch(/OpenStreetMap/);
    });

    it("uses the install's tiles from public config, dark ones in dark themes", () => {
      const config = {
        MAP_TILE_URL: 'https://tiles.internal/{z}/{x}/{y}.png',
        MAP_TILE_URL_DARK: 'https://tiles.internal/dark/{z}/{x}/{y}.png',
        MAP_TILE_ATTRIBUTION: 'Internal tiles',
      };
      expect(tileSource({ config })).toMatchObject({
        url: config.MAP_TILE_URL,
        attribution: 'Internal tiles',
        basemap: null,
      });
      expect(tileSource({ config, darkMode: true }).url).toBe(config.MAP_TILE_URL_DARK);
      expect(tileSource({ config: { MAP_TILE_URL: config.MAP_TILE_URL }, darkMode: true }).url).toBe(
        config.MAP_TILE_URL
      );
    });

    it("prefers the widget's own tiles over everything", () => {
      const own = tileSource({
        tileUrl: ' https://a.tile.example/{z}/{x}/{y}.png ',
        tileAttribution: 'Example',
        config: { MAP_TILE_URL: 'https://tiles.internal/{z}/{x}/{y}.png', MAP_TILE_ATTRIBUTION: 'Internal' },
      });
      expect(own).toMatchObject({
        url: 'https://a.tile.example/{z}/{x}/{y}.png',
        attribution: 'Example',
        basemap: null,
      });
    });
  });

  describe('a tileUrl that is not a tile template', () => {
    // An AI build set tileUrl to about:blank (2026-10-17): the map drew no tiles at all, only its pins.
    it.each(['about:blank', 'https://tiles.example/map.png', 'https://example.com/{z}/{x}.png'])(
      'treats %s as unset, so the install tiles or the default draw',
      (tileUrl) => {
        const config = { MAP_TILE_URL: 'https://tiles.internal/{z}/{x}/{y}.png', MAP_TILE_ATTRIBUTION: 'Internal' };
        expect(tileSource({ tileUrl, config })).toMatchObject({ url: config.MAP_TILE_URL, attribution: 'Internal' });
        expect(tileSource({ tileUrl }).url).toBe(tileSource({}).url);
      }
    );

    it('keeps a template with subdomains or a flipped y', () => {
      expect(tileSource({ tileUrl: 'https://{s}.tiles.example/{z}/{x}/{-y}.png' }).url).toBe(
        'https://{s}.tiles.example/{z}/{x}/{-y}.png'
      );
    });
  });

  describe('colours', () => {
    it('accepts only safe CSS colours: hex, rgb() and hsl(), a colour name or a tone name', () => {
      expect(safeColor('#e11d48')).toBe('#e11d48');
      expect(safeColor('rgb(10, 20, 30)')).toBe('rgb(10, 20, 30)');
      expect(safeColor('Teal')).toBe('teal');
      expect(safeColor('warning')).toBe(TONE_COLORS.warning);
      expect(safeColor('red;background:url(x)')).toBeNull();
      expect(safeColor('url(javascript:alert(1))')).toBeNull();
      expect(safeColor('var(--x)')).toBeNull();
      expect(safeColor(42)).toBeNull();
    });

    it("takes the author's colour for a status, matched exactly or ignoring case, else its tone's", () => {
      const colors = { 'Under offer': '#d97706', open: 'warning', Bad: 'expression(1)' };
      expect(colorOf('Under offer', colors)).toBe('#d97706');
      expect(colorOf('Open', colors)).toBe(TONE_COLORS.warning);
      expect(colorOf('Bad', colors)).toBeNull();
      expect(colorOf('Sold', colors)).toBeNull();
      expect(statusFill('Sold', '', colors)).toBeNull();
      expect(statusFill('Delivered', 'success', {})).toBe(TONE_COLORS.success);
      expect(statusFill('Open', 'info', colors)).toBe(TONE_COLORS.warning);
    });
  });

  describe('paths', () => {
    it('reads points, pairs, GeoJSON (lng, lat) and JSON text', () => {
      expect(
        toPath([
          [1, 2],
          [3, 4],
        ])
      ).toEqual([
        { lat: 1, lng: 2 },
        { lat: 3, lng: 4 },
      ]);
      expect(
        toPath([
          { lat: 1, lng: 2 },
          { latitude: 3, longitude: 4 },
        ])
      ).toEqual([
        { lat: 1, lng: 2 },
        { lat: 3, lng: 4 },
      ]);
      expect(
        toPath({
          type: 'LineString',
          coordinates: [
            [2, 1],
            [4, 3],
          ],
        })
      ).toEqual([
        { lat: 1, lng: 2 },
        { lat: 3, lng: 4 },
      ]);
      expect(
        toPath({
          type: 'Polygon',
          coordinates: [
            [
              [2, 1],
              [4, 3],
              [6, 5],
            ],
          ],
        })
      ).toHaveLength(3);
      expect(toPath('[[1, 2], [3, 4]]')).toHaveLength(2);
      expect(
        toPath([
          [1, 2],
          ['x', 4],
          [3, 4],
        ])
      ).toHaveLength(2);
      expect(toPath([[1, 2]])).toBeNull();
      expect(toPath('nope')).toBeNull();
      expect(toPath(null)).toBeNull();
    });
  });

  describe('routes', () => {
    const { points } = mapPoints(
      [
        { id: 1, name: 'B', driver: 'Ann', stop: 2, lat: 41.9, lng: -87.6 },
        { id: 2, name: 'A', driver: 'Ann', stop: 1, lat: 41.8, lng: -87.7 },
        { id: 3, name: 'C', driver: 'Bo', stop: '10', lat: 41.7, lng: -87.6 },
        { id: 4, name: 'D', driver: 'Bo', stop: '9', lat: 41.75, lng: -87.65 },
      ],
      { titleField: 'name' }
    );

    it('connects the markers per route value in stop order, from the start when given', () => {
      const lines = markerRoutes(points, {
        routeField: 'driver',
        routeOrderField: 'stop',
        routeStart: { lat: 41.88, lng: -87.65 },
      });
      expect(lines.map((l) => l.name)).toEqual(['Ann', 'Bo']);
      expect(lines[0].path).toEqual([
        { lat: 41.88, lng: -87.65 },
        { lat: 41.8, lng: -87.7 },
        { lat: 41.9, lng: -87.6 },
      ]);
      // '9' before '10': stop numbers stored as text sort as numbers.
      expect(lines[1].path.slice(1).map((p) => p.lat)).toEqual([41.75, 41.7]);
      expect(lines[0].from).toBe('the start');
      expect(lines.map((l) => l.color)).toEqual(ROUTE_PALETTE.slice(0, 2));
    });

    it('draws one line through every marker without a route field, in data order', () => {
      const [line] = markerRoutes(points, {});
      expect(line.path).toHaveLength(4);
      expect(line.from).toBe('B');
    });

    it('takes route colours by name, and lines from rows with a path', () => {
      expect(markerRoutes(points, { routeField: 'driver', routeColors: { Bo: '#111111' } })[1].color).toBe('#111111');
      const rows = routeRows(
        [
          {
            id: 'r1',
            name: 'Van 1',
            path: [
              [1, 2],
              [3, 4],
            ],
          },
          {
            name: 'Late van',
            status: 'Delayed',
            coordinates: [
              [1, 2],
              [3, 4],
            ],
          },
          { name: 'No path' },
          'junk',
        ],
        {}
      );
      expect(rows.map((r) => [r.name, r.color])).toEqual([
        ['Van 1', ROUTE_PALETTE[0]],
        ['Late van', TONE_COLORS.warning],
      ]);
    });
  });

  describe('areas', () => {
    it('reads outlines and circles, named and toned', () => {
      const shapes = areaShapes(
        [
          {
            name: 'North',
            status: 'Overloaded',
            outline: [
              [1, 2],
              [3, 4],
              [5, 6],
            ],
          },
          { name: 'Depot', lat: 41.8, lng: -87.6, radius: 500, color: '#123456' },
          {
            name: 'Too thin',
            outline: [
              [1, 2],
              [3, 4],
            ],
          },
          { name: 'Zero radius', lat: 1, lng: 2, radius: 0 },
        ],
        {}
      );
      expect(shapes.map((a) => [a.title, a.kind])).toEqual([
        ['North', 'polygon'],
        ['Depot', 'circle'],
      ]);
      expect(shapes[0].color).toBe(TONE_COLORS.danger);
      expect(shapes[1].color).toBe('#123456');
      expect(shapes[1].radius).toBe(500);
    });

    it('reads the fields it is told to', () => {
      const [a] = areaShapes(
        [
          {
            label: 'Zone A',
            state: 'Busy',
            zone: [
              [1, 2],
              [3, 4],
              [5, 6],
            ],
          },
        ],
        {
          areaShapeField: 'zone',
          areaTitleField: 'label',
          areaStatusField: 'state',
        }
      );
      expect(a).toMatchObject({ title: 'Zone A', status: 'Busy', tone: 'warning' });
    });
  });

  describe('legend', () => {
    it('lists the statuses with counts in order of appearance, then the lines and the area statuses', () => {
      const { points } = mapPoints(
        [
          { lat: 1, lng: 2, status: 'Open' },
          { lat: 1, lng: 3, status: 'Done' },
          { lat: 1, lng: 4, status: 'Open' },
          { lat: 1, lng: 5 },
        ],
        {}
      );
      const legend = legendItems({
        points,
        routes: [{ name: 'Van 1', color: '#4f46e5' }],
        areas: [{ status: 'Busy', color: TONE_COLORS.warning }],
        statusColors: { Done: '#16a34a' },
      });
      expect(legend.statuses).toEqual([
        { label: 'Open', color: TONE_COLORS.info, count: 2 },
        { label: 'Done', color: '#16a34a', count: 1 },
      ]);
      expect(legend.routes).toEqual([{ label: 'Van 1', color: '#4f46e5' }]);
      expect(legend.areas).toEqual([{ label: 'Busy', color: TONE_COLORS.warning }]);
    });
  });

  describe('heat', () => {
    it('weights each point by the heat field, or counts it once', () => {
      const { points } = mapPoints(
        [
          { lat: 1, lng: 2, n: 3 },
          { lat: 1, lng: 3, n: 'x' },
          { lat: 1, lng: 4, n: -1 },
        ],
        {}
      );
      expect(heatPoints(points, '')).toEqual([
        [1, 2, 1],
        [1, 3, 1],
        [1, 4, 1],
      ]);
      expect(heatPoints(points, 'n')).toEqual([[1, 2, 3]]);
    });
  });

  describe('geocoding', () => {
    it("uses the widget's geocoder, else the install's, else Nominatim; only http(s) templates with the placeholder", () => {
      expect(geocoderUrls({})).toEqual(NOMINATIM);
      expect(geocoderUrls({ geocoderUrl: 'https://photon.komoot.io/api/?q={query}' }).search).toBe(
        'https://photon.komoot.io/api/?q={query}'
      );
      expect(geocoderUrls({ geocoderUrl: 'javascript:alert({query})' }).search).toBe(NOMINATIM.search);
      expect(geocoderUrls({ geocoderUrl: 'https://geo.example/search' }).search).toBe(NOMINATIM.search);
      expect(
        geocoderUrls({
          config: {
            MAP_GEOCODER_URL: 'https://geo.internal/s?q={query}',
            MAP_REVERSE_GEOCODER_URL: 'https://geo.internal/r?a={lat}&b={lng}',
          },
        })
      ).toEqual({ search: 'https://geo.internal/s?q={query}', reverse: 'https://geo.internal/r?a={lat}&b={lng}' });
      expect(fillUrl(NOMINATIM.search, { query: 'Rua Augusta & 2' })).toContain('q=Rua%20Augusta%20%26%202');
    });

    it("reads Nominatim's and GeoJSON (Photon, Pelias) answers", () => {
      expect(parsePlaces([{ lat: '38.71', lon: '-9.14', display_name: 'Rua Augusta, Lisboa' }])).toEqual([
        { lat: 38.71, lng: -9.14, label: 'Rua Augusta, Lisboa' },
      ]);
      expect(parsePlaces({ lat: '38.71', lon: '-9.14', display_name: 'One place' })).toHaveLength(1);
      expect(
        parsePlaces({
          features: [{ geometry: { coordinates: [-9.14, 38.71] }, properties: { name: 'Chiado', city: 'Lisboa' } }],
        })
      ).toEqual([{ lat: 38.71, lng: -9.14, label: 'Chiado, Lisboa' }]);
      expect(parsePlaces(null)).toEqual([]);
      expect(parsePlaces([{ lat: 'x', lon: 1, display_name: 'bad' }])).toEqual([]);
    });
  });

  describe('satellite', () => {
    it("draws Esri's imagery with place names, or the install's own", () => {
      expect(tileSource({ mapStyle: 'satellite' })).toMatchObject({
        url: SATELLITE.url,
        labels: SATELLITE.labels,
        basemap: null,
      });
      expect(
        tileSource({
          mapStyle: 'satellite',
          config: { MAP_SATELLITE_TILE_URL: 'https://sat.internal/{z}/{x}/{y}.jpg' },
        })
      ).toMatchObject({
        url: 'https://sat.internal/{z}/{x}/{y}.jpg',
        labels: '',
      });
    });
  });
});
