// ToolJet UI 2.0: the pure logic of the Map (Map.tsx): markers from rows, their tones, the popup's lines,
// the view that fits the markers, and the tile source. Every function takes whatever the author bound and never
// throws. Web Mercator maths as Leaflet's default CRS (EPSG:3857, 256px tiles), so a view computed here is the view
// Leaflet shows.
import { chipLabel, chipTone } from '@/AppBuilder/Widgets/Ui2/_shared/chipTone';
import { recordMetaPart } from '@/AppBuilder/Widgets/Ui2/_sections/sectionsModel';
import type {
  Row,
  LatLng,
  MapPoint,
  MapView,
  ViewBounds,
  PointFields,
  TileSource,
  MapShape,
  PickedLocation,
  MapConfig,
} from './mapTypes';
import { isNonBlankString, safeUrl, toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';

export const MAX_LAT = 85.0511287798;
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 18;
// Fitting to one marker (or markers on one spot) stops at a street-level zoom, not the deepest tiles.
export const FIT_MAX_ZOOM = 15;
const TILE = 256;

/** A coordinate from a number or numeric text ('37.77', ' -122.4 '); null otherwise. */
const coordinate = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string' || !/^\s*[+-]?(\d+(\.\d*)?|\.\d+)\s*$/.test(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** A latitude and longitude, or null: in range, and not exactly 0, 0 (a missing location stored as zeros, which
 *  would pin a stop in the Gulf of Guinea). */
export const toLatLng = (lat: unknown, lng: unknown): LatLng | null => {
  const a = coordinate(lat);
  const b = coordinate(lng);
  if (a === null || b === null || Math.abs(a) > 90 || Math.abs(b) > 180) return null;
  if (a === 0 && b === 0) return null;
  return { lat: a, lng: b };
};

/** A point the author gave as { lat, lng } ({ latitude, longitude } too), [lat, lng] or 'lat, lng'; null otherwise. */
export const parseCenter = (v: unknown): LatLng | null => {
  if (Array.isArray(v)) return v.length >= 2 ? toLatLng(v[0], v[1]) : null;
  if (v && typeof v === 'object') {
    const o = v as Row;
    return toLatLng(o.lat ?? o.latitude, o.lng ?? o.lon ?? o.longitude);
  }
  if (isNonBlankString(v)) {
    const parts = v.split(',');
    return parts.length === 2 ? toLatLng(parts[0], parts[1]) : null;
  }
  return null;
};

const TONE_NAMES: Record<string, number> = { success: 1, warning: 1, danger: 1, info: 1, neutral: 1 };

/** A pin's tone from its status: a tone name as written, else its words, like the pack's badges (Delivered green,
 *  Failed red, Open blue). On a map a late stop still needs attention rather than counting as lost: Delayed and Late
 *  are amber; a zone's Overloaded is red; a listing Under offer or Reserved is amber and Sold or Let grey. No status,
 *  or words with no tone: '' (the pin takes the accent colour). */
export const markerTone = (status: unknown): string => {
  if (!isNonBlankString(status)) return '';
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

/** Keys from ids, one of their own for every marker: a repeated id gets a suffix, so a click selects one marker. Each
 *  id remembers the next suffix to try: searching from ~1 again for every repeat made 2,000 equal ids 2,001,000 key
 *  checks. A suffix an id already has is still skipped. */
const uniqueKeys = (points: MapPoint[]): MapPoint[] => {
  const seen = new Set<string>();
  const nextSuffix = new Map<string, number>();
  return points.map((p) => {
    let key = p.key;
    if (seen.has(key)) {
      let n = nextSuffix.get(p.key) ?? 1;
      while (seen.has(`${p.key}~${n}`)) n++;
      key = `${p.key}~${n}`;
      nextSuffix.set(p.key, n + 1);
    }
    seen.add(key);
    return key === p.key ? p : { ...p, key };
  });
};

/** Markers from rows: each row's coordinates (latField, lngField), title, subtitle, status (and its tone) and id.
 *  Rows without valid coordinates are skipped and counted. The title falls back to name, title or label, then the row's first text field (not its id); unset
 *  fields read the config's defaults (lat, lng, status, id). */
export const mapPoints = (
  data: unknown,
  fields: PointFields = {}
): { points: MapPoint[]; skipped: number; rows: number } => {
  if (!Array.isArray(data)) return { points: [], skipped: 0, rows: 0 };
  const f = fields || {};
  const latKey = isNonBlankString(f.latField) ? f.latField : 'lat';
  const lngKey = isNonBlankString(f.lngField) ? f.lngField : 'lng';
  let skipped = 0;
  const points: MapPoint[] = [];
  data.forEach((row: Row, index: number) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      skipped += 1;
      return;
    }
    const at = toLatLng(row[latKey], row[lngKey]);
    if (!at) {
      skipped += 1;
      return;
    }
    const idKey = isNonBlankString(f.idField) ? f.idField : 'id';
    const titleKey =
      isNonBlankString(f.titleField) && f.titleField in row
        ? f.titleField
        : TITLE_KEYS.find((k) => isNonBlankString(row[k])) ||
          Object.keys(row).find((k) => isNonBlankString(row[k]) && ![latKey, lngKey, idKey].includes(k));
    const id = row[idKey];
    // Unset (a widget made with only some properties) reads the default field; '' means no status.
    const statusKey = f.statusField === undefined || f.statusField === null ? 'status' : f.statusField;
    const status = isNonBlankString(statusKey) ? toText(row[statusKey]) : '';
    points.push({
      key: toText(id) || `#${index}`,
      id: id === undefined || id === null || typeof id === 'object' ? null : id,
      lat: at.lat,
      lng: at.lng,
      title: titleKey ? toText(row[titleKey]) : '',
      label: isNonBlankString(f.labelField) ? toText(row[f.labelField]).trim().slice(0, 24) : '',
      icon: isNonBlankString(f.iconField) ? toText(row[f.iconField]).trim() : '',
      subtitle: isNonBlankString(f.subtitleField) ? toText(row[f.subtitleField]) : '',
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
export const popupLines = (row: Row, popupFields: unknown, currency?: unknown): string[] => {
  const specs: string[] = Array.isArray(popupFields)
    ? popupFields.filter(isNonBlankString)
    : isNonBlankString(popupFields)
    ? popupFields.split(',')
    : [];
  if (!row || typeof row !== 'object' || !specs.length) return [];
  return specs
    .map((s) => String(s).trim())
    .filter(Boolean)
    .map((spec) => recordMetaPart(row, spec, currency))
    .filter(Boolean);
};

/** The exposed selection values: the selected marker's row and id, the selected shape's row and type, the picked spot. */
export const selection = (point: MapPoint | null) => ({
  selectedMarker: point ? point.row : {},
  selectedMarkerId: point ? point.id ?? null : null,
});
export const shapeSelection = (s: MapShape | null) => ({
  selectedShape: s ? s.row : {},
  selectedShapeType: s ? s.type : null,
});
export const pickedValue = (at: PickedLocation | null) =>
  at ? { lat: at.lat, lng: at.lng, ...(at.address ? { address: at.address } : {}) } : {};

// ---- Web Mercator ----------------------------------------------------------------------------------------------------

const clampLat = (lat: number): number => Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
/** A point's world pixel position at zoom 0 (0 to 256 on each axis). */
export const project = ({ lat, lng }: LatLng): { x: number; y: number } => {
  const s = Math.sin((clampLat(lat) * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * TILE,
    y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * TILE,
  };
};
export const unproject = ({ x, y }: { x: number; y: number }): LatLng => ({
  lat: (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / TILE))) * 180) / Math.PI,
  lng: (x / TILE) * 360 - 180,
});
const round6 = (n: number): number => Math.round(n * 1e6) / 1e6;
const roundPoint = (p: LatLng): LatLng => ({ lat: round6(p.lat), lng: round6(p.lng) });

/** A zoom in half steps (the map snaps to halves), within the tiles there are. */
export const clampZoom = <F = number>(z: unknown, fallback: F | number = 12): number | F => {
  const n = typeof z === 'string' && z.trim() !== '' ? Number(z) : z;
  return typeof n === 'number' && Number.isFinite(n)
    ? Math.round(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, n)) * 2) / 2
    : fallback;
};

const usable = (n: unknown, fallback: number): number =>
  typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : fallback;

/** The view (center, zoom) that shows every point in a box of width x height px, padding px clear of each edge:
 *  the deepest half zoom step where they fit, at most FIT_MAX_ZOOM. Null without points. */
export const fitView = (points: LatLng[], width: unknown, height: unknown, padding = 48): MapView | null => {
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
export const viewBounds = (center: LatLng, zoom: unknown, width: unknown, height: unknown): ViewBounds => {
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
export const initialView = ({
  points,
  fitToMarkers,
  defaultCenter,
  defaultZoom,
  width,
  height,
  extra = [],
}: {
  points: LatLng[];
  fitToMarkers?: unknown;
  defaultCenter?: unknown;
  defaultZoom?: unknown;
  width?: unknown;
  height?: unknown;
  extra?: LatLng[];
}): MapView => {
  const center = parseCenter(defaultCenter);
  const zoom = clampZoom(defaultZoom);
  // Fitting takes in everything drawn: the markers, and the route lines and areas (extra points).
  const fitted =
    fitToMarkers !== false && (points.length || extra.length) ? fitView([...points, ...extra], width, height) : null;
  if (fitted) return fitted;
  if (center) return { center, zoom };
  // The markers' middle (fitView is null without markers).
  const middle = fitView(points, width, height);
  if (middle) return { center: middle.center, zoom };
  return { center: { lat: 20, lng: 0 }, zoom: 2 };
};

/** A view's identity, to tell a new target view from the one already shown. */
export const viewKey = (view: MapView | null | undefined): string =>
  view ? `${round6(view.center.lat)},${round6(view.center.lng)}@${view.zoom}` : '';

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

/** A tile URL Leaflet can draw from: it names the tile's zoom, x and y. Anything else (about:blank, one image, a page)
 *  would draw no tiles, so the widget's own tileUrl counts as unset unless it is one. */
const isTileTemplate = (url: unknown): url is string =>
  isNonBlankString(url) && url.includes('{z}') && url.includes('{x}') && /\{-?y\}/.test(url);

/** The tiles to draw: the widget's own tileUrl, else the install's (public config MAP_TILE_URL, MAP_TILE_URL_DARK for
 *  dark themes, MAP_TILE_ATTRIBUTION), else OpenStreetMap's, toned to the theme: basemap 'light' or 'dark' says which
 *  (null for tiles someone chose, which are drawn as they are). mapStyle 'satellite' draws imagery (the install's
 *  MAP_SATELLITE_TILE_URL, else Esri's) with place names over it. */
export const tileSource = ({
  tileUrl,
  tileAttribution,
  darkMode,
  config,
  mapStyle,
}: {
  tileUrl?: unknown;
  tileAttribution?: unknown;
  darkMode?: boolean;
  config?: unknown;
  mapStyle?: string;
} = {}): TileSource => {
  const c: MapConfig = config && typeof config === 'object' ? (config as MapConfig) : {};
  if (mapStyle === 'satellite') {
    const own = isNonBlankString(c.MAP_SATELLITE_TILE_URL) ? c.MAP_SATELLITE_TILE_URL.trim() : '';
    return own
      ? {
          url: own,
          attribution: isNonBlankString(c.MAP_SATELLITE_ATTRIBUTION) ? c.MAP_SATELLITE_ATTRIBUTION.trim() : '',
          basemap: null,
          labels: '',
        }
      : { url: SATELLITE.url, attribution: SATELLITE.attribution, basemap: null, labels: SATELLITE.labels };
  }
  const own = isTileTemplate(tileUrl) ? safeUrl(tileUrl) : '';
  const installed = (darkMode && isNonBlankString(c.MAP_TILE_URL_DARK) ? c.MAP_TILE_URL_DARK : c.MAP_TILE_URL) || '';
  const attribution = isNonBlankString(tileAttribution)
    ? tileAttribution.trim()
    : !own && isNonBlankString(installed) && isNonBlankString(c.MAP_TILE_ATTRIBUTION)
    ? c.MAP_TILE_ATTRIBUTION.trim()
    : '';
  if (own) return { url: own, attribution, basemap: null };
  if (isNonBlankString(installed)) return { url: installed.trim(), attribution, basemap: null };
  return { url: OSM.url, attribution: attribution || OSM.attribution, basemap: darkMode ? 'dark' : 'light' };
};
