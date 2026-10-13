import {
  FIT_MAX_ZOOM,
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
} from '../mapModel';

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
  });

  describe('Web Mercator', () => {
    it('projects and unprojects a point', () => {
      const p = { lat: 37.7749, lng: -122.4194 };
      const back = unproject(project(p));
      expect(back.lat).toBeCloseTo(p.lat, 6);
      expect(back.lng).toBeCloseTo(p.lng, 6);
      expect(project({ lat: 0, lng: 0 })).toEqual({ x: 128, y: 128 });
    });

    it('fits points to a box: the deepest whole zoom where they fit', () => {
      const stops = [
        { lat: 37.8063, lng: -122.4662 },
        { lat: 37.7614, lng: -122.3934 },
      ];
      const view = fitView(stops, 600, 420);
      expect(view.zoom).toBe(12);
      expect(view.center.lat).toBeCloseTo(37.7839, 2);
      expect(view.center.lng).toBeCloseTo(-122.4298, 3);
      // A narrower box, a wider view.
      expect(fitView(stops, 300, 420).zoom).toBe(11);
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
      expect(view.zoom).toBe(1);
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
      expect(initialView({ points, defaultZoom: 3, width: 600, height: 420 }).zoom).toBe(12);
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
});
