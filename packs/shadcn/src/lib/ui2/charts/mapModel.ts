// The Map's pure logic, ported from UI 2.0 (Widgets/Ui2/Map/mapModel.ts, mapShapes.ts, mapGeocoding.ts): markers from
// rows and their tones, popup lines, route lines, areas, the legend, heat points, the tile source and the geocoder
// URLs. Every function takes whatever the author bound and never throws.

import { localeFor, moneyDigits, numberFormat } from '../../locale';

export type Row = Record<string, unknown>;
export interface LatLng {
  lat: number;
  lng: number;
}
export type MarkerSize = 'small' | 'medium' | 'large';

export interface MapPoint extends LatLng {
  key: string;
  id: unknown;
  title: string;
  label: string;
  icon: string;
  subtitle: string;
  status: string;
  statusLabel: string;
  tone: string;
  heading: number | null;
  image: string;
  row: Row;
  index: number;
}

export interface MapRoute {
  key: string;
  name: string;
  path: LatLng[];
  color: string;
  from?: string;
  row: Row;
}
interface AreaBase {
  key: string;
  title: string;
  status: string;
  tone: string;
  color: string | null;
  row: Row;
}
export type MapArea =
  | (AreaBase & { kind: 'polygon'; path: LatLng[] })
  | (AreaBase & { kind: 'circle'; center: LatLng; radius: number });
export interface MapShape {
  type: 'route' | 'area';
  key: string;
  row: Row;
}
export interface PickedLocation extends LatLng {
  address?: string;
}
export interface Place extends LatLng {
  label: string;
}
export interface LegendEntry {
  label: string;
  color: string | null;
}
export interface Legend {
  statuses: (LegendEntry & { count: number })[];
  routes: LegendEntry[];
  areas: LegendEntry[];
}
export type HeatPoint = [number, number, number];

const isText = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
export const toText = (v: unknown): string => (v === null || v === undefined || typeof v === 'object' ? '' : String(v));

// ---- Status tones (UI 2.0's chipTone, NewTable/_utils/chipTone.js) --------------------------------------------------

const TONES: [string, RegExp][] = [
  [
    'danger',
    /\b(overdue|out of stock|failed|failure|error|cancell?ed|rejected|declined|blocked|expired|lost|critical|urgent|high|severe|breach(ed)?|late|delayed|churned|suspended|terminated|refunded|disputed|offline|down|absent|no show|missed|out of service|churn|out of range|alerts?|alarms?|fail|lapsed|detractors?|full(?! time)|sold out)\b/,
  ],
  [
    'warning',
    /\b(pending|unpaid|due|due soon|expiring|expiring soon|waitlist|waitlisted|contraction|downgrade|reorder|low stock|waiting|awaiting|review|on hold|hold|draft|medium|at risk|risk|partial|partially paid|tentative|requested|needs attention|needs [a-z]+|follow up|warning|watch|watching|few spots|few left|passives?|almost full|nearly full|maintenance|busy|trial|missing|incomplete|in repair|repair|in workshop|workshop)\b/,
  ],
  [
    'success',
    /\b(paid|active|done|complete|completed|resolved|approved|confirmed|in stock|won|healthy|available|delivered|shipped|success|successful|passed|live|online|published|ready|accepted|vacant|clean|fulfilled|on track|closed won|signed|settled|given|attached|received|present|in service|on the road|on road|on duty|on shift|in operation|operational|operating|running|deployed|en route|on route|returned|verified|validated|cleared|expansion|upgrade|in range|within range|pass|renewed|promoters?)\b/,
  ],
  [
    'info',
    /\b(new(?! (york|zealand|delhi|jersey|mexico|hampshire|south wales|orleans|brunswick|haven|england|caledonia|guinea|westminster))|open|in progress|scheduled|booked|sent|assigned|processing|planned|upcoming|started|qualified|contacted|proposal|negotiation|checked in|in transit|on the way|en route|dispatched|on site|checked out|on loan|in use|occupied|reserved|held|flying|in flight|airborne|quoted|committed|in testing|testing|in qa|on call|on duty|out for delivery|picked up)\b/,
  ],
];

const chipTone = (value: unknown): string => {
  if (typeof value !== 'string') return 'neutral';
  const t = value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return 'neutral';
  if (/^not\b/.test(t)) return TONES[2][1].test(t.slice(3)) ? 'warning' : 'neutral';
  if (/^(in|under) review$/.test(t)) return 'info';
  if (/^(out|on hire|hired out|lent out)$/.test(t)) return 'info';
  for (const [tone, words] of TONES) if (words.test(t)) return tone;
  return 'neutral';
};

/** A status as a label: lowercase values ("in_progress") in sentence case, others as written. */
export const chipLabel = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (!/^[a-z][a-z0-9 _-]*$/.test(s)) return s;
  const words = s.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const TONE_NAMES = new Set(['success', 'warning', 'danger', 'info', 'neutral']);

/** A pin's tone from its status: a tone name as written, else its words (Delivered green, Delayed amber, Failed red,
 *  Open blue). '' for none: the pin takes the accent colour. */
export const markerTone = (status: unknown): string => {
  if (!isText(status)) return '';
  const word = status.trim().toLowerCase();
  if (TONE_NAMES.has(word)) return word;
  const words = word.replace(/[_-]+/g, ' ');
  if (/\b(overloaded|over capacity|at capacity|closed off|no go)\b/.test(words)) return 'danger';
  if (/\b(delayed|late|running late|behind|under offer|reserved|under contract)\b/.test(words)) return 'warning';
  if (/^(sold|let|rented|closed|archived|inactive|off market)$/.test(words)) return 'neutral';
  const tone = chipTone(status);
  return tone === 'neutral' ? '' : tone;
};

// ---- Colours ---------------------------------------------------------------------------------------------------------

export const TONE_COLORS: Record<string, string> = {
  success: 'var(--ui-success)',
  warning: 'var(--ui-map-warning)',
  danger: 'var(--ui-destructive)',
  info: 'var(--ui-map-info)',
  neutral: 'var(--ui-muted-fg)',
};
export const ROUTE_PALETTE = ['#4f46e5', '#db2777', '#0891b2', '#7c3aed', '#ea580c', '#0d9488', '#65a30d', '#475569'];

/** A colour safe for an inline style (hex, rgb()/hsl(), a named colour or a tone name), else null. */
export const safeColor = (v: unknown): string | null => {
  if (!isText(v)) return null;
  const c = v.trim();
  if (TONE_COLORS[c.toLowerCase()]) return TONE_COLORS[c.toLowerCase()];
  if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(c)) return c;
  if (/^(rgb|rgba|hsl|hsla)\(\s*[-\d.%\s,/]+\)$/i.test(c)) return c;
  if (/^[a-z]{3,20}$/i.test(c)) return c.toLowerCase();
  return null;
};

/** The author's colour for a value ({ 'Under offer': '#d97706', Open: 'warning' }), exact or ignoring case. */
export const colorOf = (value: unknown, colors: unknown): string | null => {
  if (!colors || typeof colors !== 'object' || Array.isArray(colors) || !isText(toText(value))) return null;
  const t = toText(value);
  const key = Object.keys(colors).find((k) => k === t) ?? Object.keys(colors).find((k) => k.toLowerCase() === t.toLowerCase());
  return key === undefined ? null : safeColor((colors as Row)[key]);
};

export const statusFill = (status: unknown, tone: string, statusColors: unknown): string | null =>
  colorOf(status, statusColors) || (tone ? TONE_COLORS[tone] : null);

// ---- Points ----------------------------------------------------------------------------------------------------------

const coordinate = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string' || !/^\s*[+-]?(\d+(\.\d*)?|\.\d+)\s*$/.test(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const headingOf = (v: unknown): number | null => {
  const n = coordinate(v);
  return n === null ? null : ((n % 360) + 360) % 360;
};

/** In range, and not exactly 0, 0 (a missing location stored as zeros). */
export const toLatLng = (lat: unknown, lng: unknown): LatLng | null => {
  const a = coordinate(lat);
  const b = coordinate(lng);
  if (a === null || b === null || Math.abs(a) > 90 || Math.abs(b) > 180) return null;
  if (a === 0 && b === 0) return null;
  return { lat: a, lng: b };
};

/** { lat, lng } ({ latitude, longitude } too), [lat, lng] or 'lat, lng'; null otherwise. */
export const parseCenter = (v: unknown): LatLng | null => {
  if (Array.isArray(v)) return v.length >= 2 ? toLatLng(v[0], v[1]) : null;
  if (v && typeof v === 'object') {
    const o = v as Row;
    return toLatLng(o.lat ?? o.latitude, o.lng ?? o.lon ?? o.longitude);
  }
  if (isText(v)) {
    const parts = v.split(',');
    return parts.length === 2 ? toLatLng(parts[0], parts[1]) : null;
  }
  return null;
};

const schemeOf = (url: string): string | null =>
  // eslint-disable-next-line no-control-regex
  url.replace(/[\s\u0000-\u001f]/g, '').match(/^([a-z][a-z0-9+.-]*):/i)?.[1].toLowerCase() ?? null;

/** A row's marker image as a URL an <img> may load: http(s), a path on this site, or a PNG, JPEG, GIF, WebP or SVG
 *  data URI; '' for anything else, so the pin shows. */
export const markerImageUrl = (v: unknown): string => {
  const url = typeof v === 'string' ? v.trim() : '';
  if (!url) return '';
  const scheme = schemeOf(url);
  if (scheme === 'data') return /^data:image\/(png|jpeg|gif|webp|svg\+xml)[;,]/i.test(url) ? url : '';
  if (scheme === null) return /^[/\\]{2}/.test(url) ? '' : url;
  return scheme === 'http' || scheme === 'https' ? url : '';
};

export interface PointFields {
  latField?: unknown;
  lngField?: unknown;
  titleField?: unknown;
  subtitleField?: unknown;
  statusField?: unknown;
  idField?: unknown;
  labelField?: unknown;
  iconField?: unknown;
  headingField?: unknown;
  imageField?: unknown;
  markerIcon?: unknown;
}

const TITLE_KEYS = ['name', 'title', 'label'];

/** Markers from rows; rows without valid coordinates are skipped and counted. Repeated ids get a suffix. */
export const mapPoints = (data: unknown, f: PointFields = {}): { points: MapPoint[]; skipped: number } => {
  if (!Array.isArray(data)) return { points: [], skipped: 0 };
  const latKey = isText(f.latField) ? f.latField : 'lat';
  const lngKey = isText(f.lngField) ? f.lngField : 'lng';
  const idKey = isText(f.idField) ? f.idField : 'id';
  const everyIcon = isText(f.markerIcon) ? f.markerIcon.trim() : '';
  const statusKey = f.statusField === undefined || f.statusField === null ? 'status' : f.statusField;
  let skipped = 0;
  const seen = new Set<string>();
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
    const titleKey =
      isText(f.titleField) && f.titleField in row
        ? f.titleField
        : TITLE_KEYS.find((k) => isText(row[k])) || Object.keys(row).find((k) => isText(row[k]) && ![latKey, lngKey, idKey].includes(k));
    const id = row[idKey];
    const status = isText(statusKey) ? toText(row[statusKey]) : '';
    let key = toText(id) || `#${index}`;
    for (let n = 1; seen.has(key); n++) key = `${toText(id) || `#${index}`}~${n}`;
    seen.add(key);
    points.push({
      key,
      id: id === undefined || id === null || typeof id === 'object' ? null : id,
      lat: at.lat,
      lng: at.lng,
      title: titleKey ? toText(row[titleKey]) : '',
      label: isText(f.labelField) ? toText(row[f.labelField]).trim().slice(0, 24) : '',
      icon: (isText(f.iconField) ? toText(row[f.iconField]).trim() : '') || everyIcon,
      heading: isText(f.headingField) ? headingOf(row[f.headingField]) : null,
      image: isText(f.imageField) ? markerImageUrl(row[f.imageField]) : '',
      subtitle: isText(f.subtitleField) ? toText(row[f.subtitleField]) : '',
      status,
      statusLabel: chipLabel(status),
      tone: markerTone(status),
      row,
      index,
    });
  });
  return { points, skipped };
};

// ---- Popup lines -----------------------------------------------------------------------------------------------------

const FORMATS = ['auto', 'number', 'currency', 'percent', 'compact', 'date', 'datetime'];

const formatFigure = (value: unknown, format: string, currency?: unknown, locale?: unknown): string => {
  if (value === null || value === undefined || typeof value === 'object') return '';
  if (typeof value === 'number' && !Number.isFinite(value)) return '';
  if (format === 'date' || format === 'datetime') {
    const s = String(value).trim();
    const day = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const d = typeof value === 'number' ? new Date(value) : day ? new Date(+day[1], +day[2] - 1, +day[3]) : new Date(s);
    if (Number.isNaN(d.getTime())) return String(value);
    const sameYear = d.getFullYear() === new Date().getFullYear();
    return new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'short',
      ...(sameYear ? {} : { year: 'numeric' }),
      ...(format === 'datetime' ? { hour: 'numeric', minute: '2-digit' } : {}),
    }).format(d);
  }
  const numeric = typeof value === 'number' || (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value.trim()));
  if (!numeric) return String(value);
  const n = Number(value);
  const code = isText(currency) && /^[A-Za-z]{3}$/.test(currency.trim()) ? currency.trim().toUpperCase() : 'USD';
  const where = localeFor(currency, locale);
  try {
    if (format === 'currency') return numberFormat(where, { style: 'currency', currency: code, ...moneyDigits(n, where) }).format(n);
    if (format === 'percent') return `${numberFormat(where, { maximumFractionDigits: 1 }).format(n)}%`;
    if (format === 'compact') return numberFormat(where, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
    if (format === 'number' || typeof value === 'number') return numberFormat(where, { maximumFractionDigits: 2 }).format(n);
  } catch {
    return String(value);
  }
  return String(value);
};

const sameName = (a: string, b: string) => a.toLowerCase().replace(/[\s_-]+/g, '') === b.toLowerCase().replace(/[\s_-]+/g, '');

/** One popup line from a spec: 'driver', 'eta:ETA {}', 'total|currency', 'seats:Seats'. */
const metaPart = (row: Row, spec: string, currency?: unknown, locale?: unknown): string => {
  const [head, label] = spec.split(/:(.*)/s).map((s) => (s ?? '').trim());
  const [name, format] = head.split('|').map((s) => s.trim());
  if (!name || !(name in row)) return '';
  const value = formatFigure(row[name], FORMATS.includes(format) ? format : 'auto', currency, locale);
  if (!value) return '';
  return !label || sameName(label, name) ? value : label.includes('{}') ? label.replace('{}', value) : `${label} ${value}`;
};

/** The popup's lines; 'total|currency' figures in the currency and locale (blank locale follows the currency). */
export const popupLines = (row: Row, popupFields: unknown, { currency, locale }: { currency?: unknown; locale?: unknown } = {}): string[] => {
  const specs: string[] = Array.isArray(popupFields) ? popupFields.filter(isText) : isText(popupFields) ? popupFields.split(',') : [];
  if (!row || typeof row !== 'object' || !specs.length) return [];
  return specs.map((s) => String(s).trim()).filter(Boolean).map((spec) => metaPart(row, spec, currency, locale)).filter(Boolean);
};

// ---- Routes and areas ------------------------------------------------------------------------------------------------

const pointOf = (v: unknown, geo = false): LatLng | null => {
  if (Array.isArray(v)) return v.length >= 2 ? (geo ? toLatLng(v[1], v[0]) : toLatLng(v[0], v[1])) : null;
  if (v && typeof v === 'object') {
    const o = v as Row;
    return toLatLng(o.lat ?? o.latitude, o.lng ?? o.lon ?? o.longitude);
  }
  return null;
};

/** A line or ring from [[lat, lng], ...], [{ lat, lng }, ...], a GeoJSON LineString or Polygon, or JSON text of
 *  either; null with fewer than two valid points. */
export const toPath = (value: unknown): LatLng[] | null => {
  let v: unknown = value;
  if (isText(v)) {
    try {
      v = JSON.parse(v);
    } catch {
      return null;
    }
  }
  let geo = false;
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const o = v as Row;
    const g = (o.type === 'Feature' ? o.geometry : o) as { type?: unknown; coordinates?: unknown } | null;
    if (!g || typeof g !== 'object' || !Array.isArray(g.coordinates)) return null;
    geo = true;
    v = g.type === 'Polygon' ? g.coordinates[0] : g.type === 'MultiPolygon' ? (g.coordinates[0] as unknown[])?.[0] : g.coordinates;
  }
  if (!Array.isArray(v)) return null;
  const path = v
    .slice(0, 5000)
    .map((p) => pointOf(p, geo))
    .filter((p): p is LatLng => p !== null);
  return path.length >= 2 ? path : null;
};

const rowName = (row: Row | null | undefined): string => toText(row?.name ?? row?.title ?? row?.label ?? row?.id);

/** Lines through the markers (connectMarkers): one per routeField value, in routeOrderField order, from routeStart. */
export const markerRoutes = (
  points: MapPoint[],
  { routeField, routeOrderField, routeStart, routeColors }: { routeField?: unknown; routeOrderField?: unknown; routeStart?: unknown; routeColors?: unknown } = {}
): MapRoute[] => {
  if (!points.length) return [];
  const start = parseCenter(routeStart);
  const groups = new Map<string, MapPoint[]>();
  points.forEach((p) => {
    const name = isText(routeField) ? toText(p.row?.[routeField]) : '';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)?.push(p);
  });
  const orderOf = (p: MapPoint): number | string | null => {
    const raw = isText(routeOrderField) ? p.row?.[routeOrderField] : undefined;
    const n = typeof raw === 'number' ? raw : isText(raw) ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : isText(raw) ? raw : null;
  };
  let i = 0;
  return [...groups.entries()].flatMap(([name, members]): MapRoute[] => {
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
    const from = start ? 'the start' : sorted[0]?.title || '';
    i += 1;
    return path.length >= 2 ? [{ key: `route:${name || 'all'}`, name: name || 'Route', path, color, from, row: { name, stops: members.length } }] : [];
  });
};

/** Lines from the routes rows: { name, path (or points, coordinates, geometry), color or status }. */
export const routeRows = (rows: unknown, { routeColors, statusColors }: { routeColors?: unknown; statusColors?: unknown } = {}): MapRoute[] => {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, 500).flatMap((row: Row, index: number): MapRoute[] => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return [];
    const path = toPath(row.path ?? row.points ?? row.coordinates ?? row.geometry);
    if (!path) return [];
    const name = rowName(row);
    const color =
      safeColor(row.color) ||
      colorOf(name, routeColors) ||
      statusFill(row.status, markerTone(toText(row.status)), statusColors) ||
      ROUTE_PALETTE[index % ROUTE_PALETTE.length];
    return [{ key: `line:${toText(row.id) || index}`, name: name || `Route ${index + 1}`, path, color, row }];
  });
};

export interface AreaFields {
  areaShapeField?: unknown;
  areaTitleField?: unknown;
  areaStatusField?: unknown;
  areaRadiusField?: unknown;
}

/** Areas: a polygon (areaShapeField) or a circle (lat, lng and areaRadiusField in metres). */
export const areaShapes = (rows: unknown, f: AreaFields = {}, statusColors?: unknown): MapArea[] => {
  if (!Array.isArray(rows)) return [];
  const shapeKey = isText(f.areaShapeField) ? f.areaShapeField : 'outline';
  const titleKey = isText(f.areaTitleField) ? f.areaTitleField : 'name';
  const statusKey = isText(f.areaStatusField) ? f.areaStatusField : 'status';
  const radiusKey = isText(f.areaRadiusField) ? f.areaRadiusField : 'radius';
  return rows.slice(0, 1000).flatMap((row: Row, index: number): MapArea[] => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return [];
    const status = toText(row[statusKey]);
    const tone = markerTone(status);
    const color = safeColor(row.color) || statusFill(status, tone, statusColors) || null;
    const base = { key: `area:${toText(row.id) || index}`, title: toText(row[titleKey]) || rowName(row), status, tone, color, row };
    const ring = toPath(row[shapeKey] ?? row.geometry);
    if (ring && ring.length >= 3) return [{ ...base, kind: 'polygon', path: ring }];
    const center = toLatLng(row.lat ?? row.latitude, row.lng ?? row.lon ?? row.longitude);
    const r = Number(row[radiusKey]);
    if (center && Number.isFinite(r) && r > 0) return [{ ...base, kind: 'circle', center, radius: Math.min(r, 2e6) }];
    return [];
  });
};

/** Points that bound a circle (its box corners), so fitting the view takes it in. */
export const circleCorners = (c: LatLng, radius: number): LatLng[] => {
  const dLat = radius / 111320;
  const dLng = radius / (111320 * Math.max(0.05, Math.cos((c.lat * Math.PI) / 180)));
  return [
    { lat: Math.max(-85, c.lat - dLat), lng: Math.max(-180, c.lng - dLng) },
    { lat: Math.min(85, c.lat + dLat), lng: Math.min(180, c.lng + dLng) },
  ];
};

/** The legend: each pin status with its colour and count, then the route lines and the area statuses (12 a group). */
export const legendItems = ({ points, routes, areas, statusColors }: { points: MapPoint[]; routes: MapRoute[]; areas: MapArea[]; statusColors?: unknown }): Legend => {
  const statuses = new Map<string, LegendEntry & { count: number }>();
  points.forEach((p) => {
    if (!p.statusLabel) return;
    const entry = statuses.get(p.statusLabel) || { label: p.statusLabel, color: statusFill(p.status, p.tone, statusColors), count: 0 };
    entry.count += 1;
    statuses.set(p.statusLabel, entry);
  });
  const areaStatuses = new Map<string, LegendEntry>();
  areas.forEach((a) => {
    if (a.status && !areaStatuses.has(a.status)) areaStatuses.set(a.status, { label: chipLabel(a.status), color: a.color });
  });
  return {
    statuses: [...statuses.values()].slice(0, 12),
    routes: routes.filter((r) => r.name).slice(0, 12).map((r) => ({ label: r.name, color: r.color })),
    areas: [...areaStatuses.values()].slice(0, 12),
  };
};

/** Heat points [lat, lng, weight]: weight from heatField (a positive number), else 1. */
export const heatPoints = (points: MapPoint[], heatField: unknown): HeatPoint[] =>
  points.flatMap((p): HeatPoint[] => {
    if (!isText(heatField)) return [[p.lat, p.lng, 1]];
    const w = Number(p.row?.[heatField]);
    return Number.isFinite(w) && w > 0 ? [[p.lat, p.lng, w]] : [];
  });

// ---- Tiles -----------------------------------------------------------------------------------------------------------

// OpenStreetMap's own raster tiles: the one public basemap that needs no key. Drawn muted in light themes and inverted
// in dark ones (data-basemap rules in ui2-charts-map.css).
export const OSM = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};
// Satellite imagery with no key: Esri's World Imagery, with its place-name layer on top.
export const SATELLITE = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
};
// Tile and geocoder requests send the app's origin as Referer: OSM's servers block tiles requested without one.
export const MAP_REFERRER_POLICY = 'strict-origin';

export interface TileSource {
  url: string;
  attribution: string;
  basemap: 'light' | 'dark' | null;
  labels: string;
}

/** The tiles to draw: satellite imagery, the author's tileUrl (a {z}/{x}/{y} https template), or OSM toned to the theme
 *  ('light' and 'dark' force the tone). */
export const tileSource = ({ tileUrl, tileAttribution, darkMode, mapStyle }: { tileUrl?: unknown; tileAttribution?: unknown; darkMode?: boolean; mapStyle?: string }): TileSource => {
  if (mapStyle === 'satellite') return { url: SATELLITE.url, attribution: SATELLITE.attribution, basemap: null, labels: SATELLITE.labels };
  const own = isText(tileUrl) && /^https?:\/\//i.test(tileUrl.trim()) && tileUrl.includes('{z}') && tileUrl.includes('{x}') && /\{-?y\}/.test(tileUrl) ? tileUrl.trim() : '';
  const attribution = isText(tileAttribution) ? tileAttribution.trim() : '';
  if (own) return { url: own, attribution, basemap: null, labels: '' };
  const tone = mapStyle === 'dark' ? 'dark' : mapStyle === 'light' ? 'light' : darkMode ? 'dark' : 'light';
  return { url: OSM.url, attribution: attribution || OSM.attribution, basemap: tone, labels: '' };
};

// ---- Geocoding -------------------------------------------------------------------------------------------------------

export const NOMINATIM = {
  search: 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q={query}',
  reverse: 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat}&lon={lng}',
};

/** The search and reverse-lookup URL templates: the widget's own (http(s) with the placeholder), else Nominatim's. */
export const geocoderUrls = ({ geocoderUrl, reverseGeocoderUrl }: { geocoderUrl?: unknown; reverseGeocoderUrl?: unknown }) => {
  const pick = (own: unknown, fallback: string, mark: string) => {
    const u = isText(own) ? own.trim() : '';
    return /^https?:\/\//i.test(u) && u.includes(mark) ? u : fallback;
  };
  return { search: pick(geocoderUrl, NOMINATIM.search, '{query}'), reverse: pick(reverseGeocoderUrl, NOMINATIM.reverse, '{lat}') };
};

export const fillUrl = (template: string, values: Record<string, unknown>): string =>
  template.replace(/\{(query|lat|lng)\}/g, (_, k) => encodeURIComponent(String(values[k] ?? '')));

const capLabel = (label: string): string => (label.length > 200 ? `${label.slice(0, 199)}…` : label);

interface GeocoderItem {
  lat?: unknown;
  lon?: unknown;
  lng?: unknown;
  display_name?: unknown;
  label?: unknown;
  name?: unknown;
  geometry?: { coordinates?: unknown };
  properties?: Record<string, unknown>;
  features?: unknown;
}

/** Places from Nominatim's answer or GeoJSON (Photon, Pelias). */
export const parsePlaces = (response: unknown): Place[] => {
  const json = response as GeocoderItem | GeocoderItem[] | null | undefined;
  const list: (GeocoderItem | null)[] = Array.isArray(json) ? json : json && Array.isArray(json.features) ? (json.features as GeocoderItem[]) : json ? [json] : [];
  return list.slice(0, 8).flatMap((item): Place[] => {
    if (!item || typeof item !== 'object') return [];
    const coordinates = item.geometry?.coordinates;
    if (item.geometry && Array.isArray(coordinates)) {
      const at = toLatLng(coordinates[1], coordinates[0]);
      const p = item.properties || {};
      const label = toText(p.label ?? p.display_name ?? [p.name, p.street, p.city, p.country].filter(Boolean).join(', '));
      return at && label ? [{ ...at, label: capLabel(label) }] : [];
    }
    const at = toLatLng(item.lat, item.lon ?? item.lng);
    const label = toText(item.display_name ?? item.label ?? item.name);
    return at && label ? [{ ...at, label: capLabel(label) }] : [];
  });
};

// ---- Exposed values --------------------------------------------------------------------------------------------------

export const round6 = (n: number): number => Math.round(n * 1e6) / 1e6;
export const latLngOf = (ll: LatLng): LatLng => ({ lat: round6(ll.lat), lng: round6(ll.lng) });
export const pickedValue = (at: PickedLocation | null): Record<string, unknown> =>
  at ? { lat: at.lat, lng: at.lng, ...(at.address ? { address: at.address } : {}) } : {};
export const markerSizeOf = (v: unknown): MarkerSize => (v === 'small' || v === 'large' ? v : 'medium');
export const clampZoom = (z: unknown, fallback: number): number => {
  const n = typeof z === 'string' && z.trim() !== '' ? Number(z) : z;
  return typeof n === 'number' && Number.isFinite(n) ? Math.round(Math.max(1, Math.min(18, n)) * 2) / 2 : fallback;
};
