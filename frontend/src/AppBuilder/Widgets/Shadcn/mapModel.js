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
 *  are amber. No status, or words with no tone: '' (the pin takes the accent colour). */
export const markerTone = (status) => {
  if (!isText(status)) return '';
  const word = status.trim().toLowerCase();
  if (TONE_NAMES[word]) return word;
  if (/\b(delayed|late|running late|behind)\b/.test(word.replace(/[_-]+/g, ' '))) return 'warning';
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

/** The popup's detail lines: popupFields is a comma list of field specs, as the Record list's metaFields ('driver',
 *  'eta|datetime:ETA {}', 'total|currency', 'seats:Seats'). Fields the row lacks or leaves empty are left out. */
export const popupLines = (row, popupFields, currency) => {
  if (!row || typeof row !== 'object' || !isText(popupFields)) return [];
  return popupFields
    .split(',')
    .map((s) => s.trim())
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

export const clampZoom = (z, fallback = 12) => {
  const n = typeof z === 'string' && z.trim() !== '' ? Number(z) : z;
  return typeof n === 'number' && Number.isFinite(n) ? Math.round(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, n))) : fallback;
};

const usable = (n, fallback) => (Number.isFinite(n) && n > 0 ? n : fallback);

/** The view (center, zoom) that shows every point in a box of width x height px, padding px clear of each edge:
 *  the deepest whole zoom where they fit, at most FIT_MAX_ZOOM. Null without points. */
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
  const zoom = Math.max(MIN_ZOOM, Math.min(FIT_MAX_ZOOM, Math.floor(Math.min(zx, zy))));
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
export const initialView = ({ points, fitToMarkers, defaultCenter, defaultZoom, width, height }) => {
  const center = parseCenter(defaultCenter);
  const zoom = clampZoom(defaultZoom);
  if (fitToMarkers !== false && points.length) return fitView(points, width, height);
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

/** The tiles to draw: the widget's own tileUrl, else the install's (public config MAP_TILE_URL, MAP_TILE_URL_DARK for
 *  dark themes, MAP_TILE_ATTRIBUTION), else OpenStreetMap's, toned to the theme: basemap 'light' or 'dark' says which
 *  (null for tiles someone chose, which are drawn as they are). */
export const tileSource = ({ tileUrl, tileAttribution, darkMode, config } = {}) => {
  const c = config && typeof config === 'object' ? config : {};
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
