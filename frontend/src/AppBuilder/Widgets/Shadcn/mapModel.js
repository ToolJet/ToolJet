// ToolJet UI 2.0 pack: the pure logic of the Map (ShadMap.jsx): markers from rows, their tones, the popup's lines,
// the view that fits the markers, and the tile source. Every function takes whatever the author bound and never
// throws. Web Mercator maths as Leaflet's default CRS (EPSG:3857, 256px tiles), so a view computed here is the view
// Leaflet shows.
import { chipLabel, chipTone } from '../NewTable/_utils/chipTone';
import { recordMetaPart } from './sectionsModel';

const isText = (v) => typeof v === 'string' && v.trim() !== '';
const shown = (v) => (v === null || v === undefined || typeof v === 'object' ? '' : String(v));

export const MAX_LAT = 85.0511287798;
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 18;
// Fitting to one marker (or markers on one spot) stops at a street-level zoom, not the deepest tiles.
export const FIT_MAX_ZOOM = 15;
const TILE = 256;

/** A coordinate from a number or numeric text ('37.77', ' -122.4 '); null otherwise. */
const coordinate = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string' || !/^\s*[+-]?(\d+(\.\d*)?|\.\d+)\s*$/.test(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** A latitude and longitude, or null: in range, and not exactly 0, 0 (a missing location stored as zeros, which
 *  would pin a stop in the Gulf of Guinea). */
export const toLatLng = (lat, lng) => {
  const a = coordinate(lat);
  const b = coordinate(lng);
  if (a === null || b === null || Math.abs(a) > 90 || Math.abs(b) > 180) return null;
  if (a === 0 && b === 0) return null;
  return { lat: a, lng: b };
};

/** A point the author gave as { lat, lng } ({ latitude, longitude } too), [lat, lng] or 'lat, lng'; null otherwise. */
export const parseCenter = (v) => {
  if (Array.isArray(v)) return v.length >= 2 ? toLatLng(v[0], v[1]) : null;
  if (v && typeof v === 'object') return toLatLng(v.lat ?? v.latitude, v.lng ?? v.lon ?? v.longitude);
  if (isText(v)) {
    const parts = v.split(',');
    return parts.length === 2 ? toLatLng(parts[0], parts[1]) : null;
  }
  return null;
};

const TONE_NAMES = { success: 1, warning: 1, danger: 1, info: 1, neutral: 1 };

/** A pin's tone from its status: a tone name as written, else its words, like the pack's badges (Delivered green,
 *  Failed red, Open blue). On a map a late stop still needs attention rather than counting as lost: Delayed and Late
 *  are amber; a zone's Overloaded is red; a listing Under offer or Reserved is amber and Sold or Let grey. No status,
 *  or words with no tone: '' (the pin takes the accent colour). */
export const markerTone = (status) => {
  if (!isText(status)) return '';
  const word = status.trim().toLowerCase();
  if (TONE_NAMES[word]) return word;
  const words = word.replace(/[_-]+/g, ' ');
  // Words maps carry that badges do not: a zone's load, a listing's state.
  if (/\b(overloaded|over capacity|at capacity|closed off|no go)\b/.test(words)) return 'danger';
  if (/\b(delayed|late|running late|behind|under offer|reserved|under contract)\b/.test(words)) return 'warning';
  if (/^(sold|let|rented|closed|archived|inactive|off market)$/.test(words)) return 'neutral';
  const tone = chipTone(status);
  return tone === 'neutral' ? '' : tone;
};

// Where a title is when titleField names nothing the row has.
const TITLE_KEYS = ['name', 'title', 'label'];

/** Keys from ids, one of their own for every marker: a repeated id gets a suffix, so a click selects one marker. */
const uniqueKeys = (points) => {
  const seen = new Set();
  return points.map((p) => {
    let key = p.key;
    for (let n = 1; seen.has(key); n++) key = `${p.key}~${n}`;
    seen.add(key);
    return key === p.key ? p : { ...p, key };
  });
};

/** Markers from rows: each row's coordinates (latField, lngField), title, subtitle, status (and its tone) and id.
 *  Rows without valid coordinates are skipped and counted. The title falls back to name, title or label, then the row's first text field (not its id); unset
 *  fields read the config's defaults (lat, lng, status, id). */
export const mapPoints = (data, fields = {}) => {
  if (!Array.isArray(data)) return { points: [], skipped: 0, rows: 0 };
  const f = fields || {};
  const latKey = isText(f.latField) ? f.latField : 'lat';
  const lngKey = isText(f.lngField) ? f.lngField : 'lng';
  let skipped = 0;
  const points = [];
  data.forEach((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      skipped += 1;
      return;
    }
    const at = toLatLng(row[latKey], row[lngKey]);
    if (!at) {
      skipped += 1;
      return;
    }
    const idKey = isText(f.idField) ? f.idField : 'id';
    const titleKey =
      isText(f.titleField) && f.titleField in row
        ? f.titleField
        : TITLE_KEYS.find((k) => isText(row[k])) ||
          Object.keys(row).find((k) => isText(row[k]) && ![latKey, lngKey, idKey].includes(k));
    const id = row[idKey];
    // Unset (a widget made with only some properties) reads the default field; '' means no status.
    const statusKey = f.statusField === undefined || f.statusField === null ? 'status' : f.statusField;
    const status = isText(statusKey) ? shown(row[statusKey]) : '';
    points.push({
      key: shown(id) || `#${index}`,
      id: id === undefined || id === null || typeof id === 'object' ? null : id,
      lat: at.lat,
      lng: at.lng,
      title: titleKey ? shown(row[titleKey]) : '',
      label: isText(f.labelField) ? shown(row[f.labelField]).trim().slice(0, 24) : '',
      icon: isText(f.iconField) ? shown(row[f.iconField]).trim() : '',
      subtitle: isText(f.subtitleField) ? shown(row[f.subtitleField]) : '',
      status,
      statusLabel: chipLabel(status),
      tone: markerTone(status),
      row,
      index,
    });
  });
  return { points: uniqueKeys(points), skipped, rows: data.length };
};

/** The popup's detail lines: popupFields is a comma list (or a list) of field specs, as the Record list's metaFields ('driver',
 *  'eta|datetime:ETA {}', 'total|currency', 'seats:Seats'). Fields the row lacks or leaves empty are left out. */
export const popupLines = (row, popupFields, currency) => {
  const specs = Array.isArray(popupFields)
    ? popupFields.filter(isText)
    : isText(popupFields)
    ? popupFields.split(',')
    : [];
  if (!row || typeof row !== 'object' || !specs.length) return [];
  return specs
    .map((s) => String(s).trim())
    .filter(Boolean)
    .map((spec) => recordMetaPart(row, spec, currency))
    .filter(Boolean);
};

// ---- Web Mercator ----------------------------------------------------------------------------------------------------

const clampLat = (lat) => Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
/** A point's world pixel position at zoom 0 (0 to 256 on each axis). */
export const project = ({ lat, lng }) => {
  const s = Math.sin((clampLat(lat) * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * TILE,
    y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * TILE,
  };
};
export const unproject = ({ x, y }) => ({
  lat: (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / TILE))) * 180) / Math.PI,
  lng: (x / TILE) * 360 - 180,
});
const round6 = (n) => Math.round(n * 1e6) / 1e6;
const roundPoint = (p) => ({ lat: round6(p.lat), lng: round6(p.lng) });

/** A zoom in half steps (the map snaps to halves), within the tiles there are. */
export const clampZoom = (z, fallback = 12) => {
  const n = typeof z === 'string' && z.trim() !== '' ? Number(z) : z;
  return typeof n === 'number' && Number.isFinite(n)
    ? Math.round(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, n)) * 2) / 2
    : fallback;
};

const usable = (n, fallback) => (Number.isFinite(n) && n > 0 ? n : fallback);

/** The view (center, zoom) that shows every point in a box of width x height px, padding px clear of each edge:
 *  the deepest half zoom step where they fit, at most FIT_MAX_ZOOM. Null without points. */
export const fitView = (points, width, height, padding = 48) => {
  if (!Array.isArray(points) || !points.length) return null;
  const w = Math.max(32, usable(width, 600) - padding * 2);
  const h = Math.max(32, usable(height, 400) - padding * 2);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    const { x, y } = project(p);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const dx = maxX - minX;
  const dy = maxY - minY;
  const zx = dx > 0 ? Math.log2(w / dx) : Infinity;
  const zy = dy > 0 ? Math.log2(h / dy) : Infinity;
  const zoom = Math.max(MIN_ZOOM, Math.min(FIT_MAX_ZOOM, Math.floor(Math.min(zx, zy) * 2) / 2));
  return { center: roundPoint(unproject({ x: (minX + maxX) / 2, y: (minY + maxY) / 2 })), zoom };
};

/** The bounds a view shows in a box of width x height px, as the native Map exposes them. */
export const viewBounds = (center, zoom, width, height) => {
  const scale = 2 ** clampZoom(zoom);
  const c = project(center);
  const halfW = usable(width, 600) / 2 / scale;
  const halfH = usable(height, 400) / 2 / scale;
  const ne = unproject({ x: c.x + halfW, y: Math.max(0, c.y - halfH) });
  const sw = unproject({ x: c.x - halfW, y: Math.min(TILE, c.y + halfH) });
  return {
    northEast: roundPoint({ lat: ne.lat, lng: Math.min(180, ne.lng) }),
    southWest: roundPoint({ lat: sw.lat, lng: Math.max(-180, sw.lng) }),
  };
};

/** The view a map opens on: fitted to the markers (fitToMarkers, the default), else defaultCenter at defaultZoom; with
 *  no center given, the markers' middle at defaultZoom, and with no markers either, the whole world. */
export const initialView = ({ points, fitToMarkers, defaultCenter, defaultZoom, width, height, extra = [] }) => {
  const center = parseCenter(defaultCenter);
  const zoom = clampZoom(defaultZoom);
  // Fitting takes in everything drawn: the markers, and the route lines and areas (extra points).
  if (fitToMarkers !== false && (points.length || extra.length)) return fitView([...points, ...extra], width, height);
  if (center) return { center, zoom };
  if (points.length) return { center: fitView(points, width, height).center, zoom };
  return { center: { lat: 20, lng: 0 }, zoom: 2 };
};

/** A view's identity, to tell a new target view from the one already shown. */
export const viewKey = (view) => (view ? `${round6(view.center.lat)},${round6(view.center.lng)}@${view.zoom}` : '');

// ---- Tiles -----------------------------------------------------------------------------------------------------------

// The default basemap is OpenStreetMap's own raster tiles: the one public basemap that needs no key (CARTO's now draw
// "API key required" on every tile, 2026-10). It is drawn muted in light themes and inverted in dark ones (the
// .sc-map-canvas[data-basemap] rules in shadcn.scss), so it follows the app theme. Heavy production use belongs on a
// tile provider of the install's own: public config MAP_TILE_URL.
export const OSM = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

// Satellite imagery with no key: Esri's World Imagery, with its place-name layer on top. Esri asks for attribution and
// reserves terms for heavy use; an install can set its own (public config MAP_SATELLITE_TILE_URL).
export const SATELLITE = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  labels:
    'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
};

/** The tiles to draw: the widget's own tileUrl, else the install's (public config MAP_TILE_URL, MAP_TILE_URL_DARK for
 *  dark themes, MAP_TILE_ATTRIBUTION), else OpenStreetMap's, toned to the theme: basemap 'light' or 'dark' says which
 *  (null for tiles someone chose, which are drawn as they are). mapStyle 'satellite' draws imagery (the install's
 *  MAP_SATELLITE_TILE_URL, else Esri's) with place names over it. */
export const tileSource = ({ tileUrl, tileAttribution, darkMode, config, mapStyle } = {}) => {
  const c = config && typeof config === 'object' ? config : {};
  if (mapStyle === 'satellite') {
    const own = isText(c.MAP_SATELLITE_TILE_URL) ? c.MAP_SATELLITE_TILE_URL.trim() : '';
    return own
      ? {
          url: own,
          attribution: isText(c.MAP_SATELLITE_ATTRIBUTION) ? c.MAP_SATELLITE_ATTRIBUTION.trim() : '',
          basemap: null,
          labels: '',
        }
      : { url: SATELLITE.url, attribution: SATELLITE.attribution, basemap: null, labels: SATELLITE.labels };
  }
  const own = isText(tileUrl) ? tileUrl.trim() : '';
  const installed = (darkMode && isText(c.MAP_TILE_URL_DARK) ? c.MAP_TILE_URL_DARK : c.MAP_TILE_URL) || '';
  const attribution = isText(tileAttribution)
    ? tileAttribution.trim()
    : !own && isText(installed) && isText(c.MAP_TILE_ATTRIBUTION)
    ? c.MAP_TILE_ATTRIBUTION.trim()
    : '';
  if (own) return { url: own, attribution, basemap: null };
  if (isText(installed)) return { url: installed.trim(), attribution, basemap: null };
  return { url: OSM.url, attribution: attribution || OSM.attribution, basemap: darkMode ? 'dark' : 'light' };
};

// ---- Colours ---------------------------------------------------------------------------------------------------------

// The pack's tone colours as CSS (the .sc-map rules in shadcn.scss define --sc-map-info).
export const TONE_COLORS = {
  success: 'var(--sc-success)',
  warning: 'var(--sc-warning)',
  danger: 'var(--sc-destructive)',
  info: 'var(--sc-map-info)',
  neutral: 'var(--sc-muted-foreground)',
};
// Route lines, one hue each: apart from the status tones (green, amber, red), so a line never reads as a state.
export const ROUTE_PALETTE = ['#4f46e5', '#db2777', '#0891b2', '#7c3aed', '#ea580c', '#0d9488', '#65a30d', '#475569'];

/** A colour safe to place in an inline style: hex, rgb()/hsl() with plain numbers, a named colour or a tone name;
 *  anything else (a url(), an expression, junk) is null. */
export const safeColor = (v) => {
  if (!isText(v)) return null;
  const c = v.trim();
  if (TONE_COLORS[c.toLowerCase()]) return TONE_COLORS[c.toLowerCase()];
  if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(c)) return c;
  if (/^(rgb|rgba|hsl|hsla)\(\s*[-\d.%\s,/]+\)$/i.test(c)) return c;
  if (/^[a-z]{3,20}$/i.test(c)) return c.toLowerCase();
  return null;
};

/** The colour an author gave a value in a map ({ 'Under offer': '#d97706', Open: 'warning' }), matched exactly or
 *  ignoring case; null when the map does not name it. */
export const colorOf = (value, colors) => {
  if (!colors || typeof colors !== 'object' || Array.isArray(colors) || !isText(shown(value))) return null;
  const text = shown(value);
  const key =
    Object.keys(colors).find((k) => k === text) ??
    Object.keys(colors).find((k) => k.toLowerCase() === text.toLowerCase());
  return key === undefined ? null : safeColor(colors[key]);
};

/** A status's colour: the author's (statusColors), else its tone's, else null (the accent). */
export const statusFill = (status, tone, statusColors) =>
  colorOf(status, statusColors) || (tone ? TONE_COLORS[tone] : null);

// ---- Paths, routes and areas -----------------------------------------------------------------------------------------

const MAX_PATH = 5000;

/** A point from [lat, lng], { lat, lng } ({ latitude, longitude }) or, with geo true, a GeoJSON [lng, lat]. */
const pointOf = (v, geo = false) => {
  if (Array.isArray(v)) return v.length >= 2 ? (geo ? toLatLng(v[1], v[0]) : toLatLng(v[0], v[1])) : null;
  if (v && typeof v === 'object') return toLatLng(v.lat ?? v.latitude, v.lng ?? v.lon ?? v.longitude);
  return null;
};

/** A line or ring from a list of points ([[lat, lng], ...] or [{ lat, lng }, ...]), a GeoJSON geometry (LineString,
 *  Polygon: [lng, lat] order, its outer ring) or JSON text of either. Invalid points are dropped; null with fewer than
 *  two. */
export const toPath = (value) => {
  let v = value;
  if (isText(v)) {
    try {
      v = JSON.parse(v);
    } catch {
      return null;
    }
  }
  let geo = false;
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const g = v.type === 'Feature' ? v.geometry : v;
    if (!g || typeof g !== 'object' || !Array.isArray(g.coordinates)) return null;
    geo = true;
    v = g.type === 'Polygon' ? g.coordinates[0] : g.type === 'MultiPolygon' ? g.coordinates[0]?.[0] : g.coordinates;
  }
  if (!Array.isArray(v)) return null;
  const path = v
    .slice(0, MAX_PATH)
    .map((p) => pointOf(p, geo))
    .filter(Boolean);
  return path.length >= 2 ? path : null;
};

const rowName = (row) => shown(row?.name ?? row?.title ?? row?.label ?? row?.id);

/** Lines through the markers in order (connectMarkers): one per value of routeField (all markers when it is empty),
 *  sorted by routeOrderField (numbers in numeric order) else in data order, starting at routeStart when given. Each
 *  line takes routeColors[name], else the next palette colour. */
export const markerRoutes = (points, { routeField, routeOrderField, routeStart, routeColors } = {}) => {
  if (!Array.isArray(points) || points.length < 1) return [];
  const start = parseCenter(routeStart);
  const groups = new Map();
  points.forEach((p) => {
    const name = isText(routeField) ? shown(p.row?.[routeField]) : '';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(p);
  });
  const orderOf = (p) => {
    const raw = isText(routeOrderField) ? p.row?.[routeOrderField] : undefined;
    const n = typeof raw === 'number' ? raw : isText(raw) && raw.trim() !== '' ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : isText(raw) ? raw : null;
  };
  let i = 0;
  return [...groups.entries()].flatMap(([name, members]) => {
    const sorted = members
      .map((p, at) => ({ p, at, o: orderOf(p) }))
      .sort((a, b) => {
        if (a.o === null || b.o === null) return a.o === null && b.o === null ? a.at - b.at : a.o === null ? 1 : -1;
        if (typeof a.o === 'number' && typeof b.o === 'number') return a.o - b.o || a.at - b.at;
        return String(a.o).localeCompare(String(b.o), undefined, { numeric: true }) || a.at - b.at;
      })
      .map((x) => x.p);
    const path = [...(start ? [start] : []), ...sorted.map((p) => ({ lat: p.lat, lng: p.lng }))];
    const color = colorOf(name, routeColors) || ROUTE_PALETTE[i % ROUTE_PALETTE.length];
    // Where the line starts, for its description: the start (a depot), else its first stop.
    const from = start ? 'the start' : sorted[0]?.title || '';
    i += 1;
    return path.length >= 2
      ? [
          {
            key: `route:${name || 'all'}`,
            name: name || 'Route',
            path,
            color,
            from,
            row: { name, stops: members.length },
          },
        ]
      : [];
  });
};

/** Lines from a second dataset (routes): rows with path (or points, coordinates, geometry), name and color or status. */
export const routeRows = (rows, { routeColors, statusColors } = {}) => {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, 500).flatMap((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return [];
    const path = toPath(row.path ?? row.points ?? row.coordinates ?? row.geometry);
    if (!path) return [];
    const name = rowName(row);
    const tone = markerTone(shown(row.status));
    const color =
      safeColor(row.color) ||
      colorOf(name, routeColors) ||
      statusFill(row.status, tone, statusColors) ||
      ROUTE_PALETTE[index % ROUTE_PALETTE.length];
    return [{ key: `line:${shown(row.id) || index}`, name: name || `Route ${index + 1}`, path, color, row }];
  });
};

/** Areas: a polygon (areaShapeField: points, a GeoJSON Polygon or JSON text) or a circle (lat, lng and areaRadiusField
 *  in metres), titled by areaTitleField and toned by areaStatusField (statusColors, its words, or the row's color). */
export const areaShapes = (rows, f = {}, statusColors) => {
  if (!Array.isArray(rows)) return [];
  const shapeKey = isText(f.areaShapeField) ? f.areaShapeField : 'outline';
  const titleKey = isText(f.areaTitleField) ? f.areaTitleField : 'name';
  const statusKey = isText(f.areaStatusField) ? f.areaStatusField : 'status';
  const radiusKey = isText(f.areaRadiusField) ? f.areaRadiusField : 'radius';
  return rows.slice(0, 1000).flatMap((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return [];
    const status = shown(row[statusKey]);
    const tone = markerTone(status);
    const color = safeColor(row.color) || statusFill(status, tone, statusColors) || null;
    const base = {
      key: `area:${shown(row.id) || index}`,
      title: shown(row[titleKey]) || rowName(row),
      status,
      tone,
      color,
      row,
    };
    const ring = toPath(row[shapeKey] ?? row.geometry);
    if (ring && ring.length >= 3) return [{ ...base, kind: 'polygon', path: ring }];
    const center = toLatLng(row.lat ?? row.latitude, row.lng ?? row.lon ?? row.longitude);
    const r = Number(row[radiusKey]);
    if (center && Number.isFinite(r) && r > 0) return [{ ...base, kind: 'circle', center, radius: Math.min(r, 2e6) }];
    return [];
  });
};

/** The legend: each status the pins show with its colour and count (in order of first appearance), then the route
 *  lines and the area statuses. At most 12 entries a group. */
export const legendItems = ({ points = [], routes = [], areas = [], statusColors } = {}) => {
  const statuses = new Map();
  points.forEach((p) => {
    const label = p.statusLabel || '';
    if (!label) return;
    const entry = statuses.get(label) || { label, color: statusFill(p.status, p.tone, statusColors), count: 0 };
    entry.count += 1;
    statuses.set(label, entry);
  });
  const areaStatuses = new Map();
  areas.forEach((a) => {
    if (!a.status) return;
    if (!areaStatuses.has(a.status)) areaStatuses.set(a.status, { label: chipLabel(a.status), color: a.color });
  });
  return {
    statuses: [...statuses.values()].slice(0, 12),
    routes: routes
      .filter((r) => r.name)
      .slice(0, 12)
      .map((r) => ({ label: r.name, color: r.color })),
    areas: [...areaStatuses.values()].slice(0, 12),
  };
};

// ---- Heat ------------------------------------------------------------------------------------------------------------

/** Heat points [lat, lng, weight]: weight from heatField (a positive number), else 1. */
export const heatPoints = (points, heatField) =>
  (Array.isArray(points) ? points : []).flatMap((p) => {
    if (!isText(heatField)) return [[p.lat, p.lng, 1]];
    const w = Number(p.row?.[heatField]);
    return Number.isFinite(w) && w > 0 ? [[p.lat, p.lng, w]] : [];
  });

// ---- Geocoding -------------------------------------------------------------------------------------------------------

// OpenStreetMap's Nominatim, used politely: searches wait for a pause in typing, at least three characters, one request
// a second at most (its usage policy), and repeated searches come from a cache (mapLayers.geocode).
export const NOMINATIM = {
  search: 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q={query}',
  reverse: 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat}&lon={lng}',
};

/** The search and reverse-lookup URL templates: the widget's own, else the install's (public config MAP_GEOCODER_URL,
 *  MAP_REVERSE_GEOCODER_URL), else Nominatim's. Only http(s) URLs with the placeholder are used. */
export const geocoderUrls = ({ geocoderUrl, reverseGeocoderUrl, config } = {}) => {
  const c = config && typeof config === 'object' ? config : {};
  const pick = (own, installed, fallback, mark) =>
    [own, installed].map((u) => (isText(u) ? u.trim() : '')).find((u) => /^https?:\/\//i.test(u) && u.includes(mark)) ||
    fallback;
  return {
    search: pick(geocoderUrl, c.MAP_GEOCODER_URL, NOMINATIM.search, '{query}'),
    reverse: pick(reverseGeocoderUrl, c.MAP_REVERSE_GEOCODER_URL, NOMINATIM.reverse, '{lat}'),
  };
};

export const fillUrl = (template, values) =>
  template.replace(/\{(query|lat|lng)\}/g, (_, k) => encodeURIComponent(String(values[k] ?? '')));

/** Places from a geocoder's answer: Nominatim's ([{ lat, lon, display_name }] or one such object) or GeoJSON
 *  (Photon, Pelias: features with geometry.coordinates and properties.label or name). */
export const parsePlaces = (json) => {
  const list = Array.isArray(json) ? json : json && Array.isArray(json.features) ? json.features : json ? [json] : [];
  return list.slice(0, 8).flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    if (item.geometry && Array.isArray(item.geometry.coordinates)) {
      const at = toLatLng(item.geometry.coordinates[1], item.geometry.coordinates[0]);
      const p = item.properties || {};
      const label = shown(
        p.label ?? p.display_name ?? [p.name, p.street, p.city, p.country].filter(Boolean).join(', ')
      );
      return at && label ? [{ ...at, label }] : [];
    }
    const at = toLatLng(item.lat, item.lon ?? item.lng);
    const label = shown(item.display_name ?? item.label ?? item.name);
    return at && label ? [{ ...at, label }] : [];
  });
};
