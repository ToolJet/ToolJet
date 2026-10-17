// ToolJet UI 2.0: the Map's colours, route lines, areas, legend and heat points (pure, as mapModel.ts): every
// function takes whatever the author bound and never throws.
import { chipLabel } from '@/AppBuilder/Widgets/Ui2/_shared/chipTone';
import { markerTone, parseCenter, toLatLng } from './mapModel';
import type { Row, LatLng, MapPoint } from './mapTypes';
import { isNonBlankString, toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';

/** A route line: through the markers (connectMarkers) or from the routes rows. */
export interface MapRoute {
  key: string;
  name: string;
  path: LatLng[];
  color: string;
  /** Where the line starts, for its description. */
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

/** An area: a polygon, or a circle of radius metres. */
export type MapArea =
  | (AreaBase & { kind: 'polygon'; path: LatLng[] })
  | (AreaBase & { kind: 'circle'; center: LatLng; radius: number });

export interface LegendEntry {
  label: string;
  color: string | null;
}

export interface Legend {
  statuses: (LegendEntry & { count: number })[];
  routes: LegendEntry[];
  areas: LegendEntry[];
}

/** A heat point: [lat, lng, weight]. */
export type HeatPoint = [number, number, number];

// ---- Colours ---------------------------------------------------------------------------------------------------------

// The pack's tone colours as CSS (the .sc-map rules in shadcn.scss define --sc-map-info).
export const TONE_COLORS: Record<string, string> = {
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
export const safeColor = (v: unknown): string | null => {
  if (!isNonBlankString(v)) return null;
  const c = v.trim();
  if (TONE_COLORS[c.toLowerCase()]) return TONE_COLORS[c.toLowerCase()];
  if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(c)) return c;
  if (/^(rgb|rgba|hsl|hsla)\(\s*[-\d.%\s,/]+\)$/i.test(c)) return c;
  if (/^[a-z]{3,20}$/i.test(c)) return c.toLowerCase();
  return null;
};

/** The colour an author gave a value in a map ({ 'Under offer': '#d97706', Open: 'warning' }), matched exactly or
 *  ignoring case; null when the map does not name it. */
export const colorOf = (value: unknown, colors: unknown): string | null => {
  if (!colors || typeof colors !== 'object' || Array.isArray(colors) || !isNonBlankString(toText(value))) return null;
  const text = toText(value);
  const key =
    Object.keys(colors).find((k) => k === text) ??
    Object.keys(colors).find((k) => k.toLowerCase() === text.toLowerCase());
  return key === undefined ? null : safeColor((colors as Row)[key]);
};

/** A status's colour: the author's (statusColors), else its tone's, else null (the accent). */
export const statusFill = (status: unknown, tone: string, statusColors: unknown): string | null =>
  colorOf(status, statusColors) || (tone ? TONE_COLORS[tone] : null);

// ---- Paths, routes and areas -----------------------------------------------------------------------------------------

const MAX_PATH = 5000;

/** A point from [lat, lng], { lat, lng } ({ latitude, longitude }) or, with geo true, a GeoJSON [lng, lat]. */
const pointOf = (v: unknown, geo = false): LatLng | null => {
  if (Array.isArray(v)) return v.length >= 2 ? (geo ? toLatLng(v[1], v[0]) : toLatLng(v[0], v[1])) : null;
  if (v && typeof v === 'object') {
    const o = v as Row;
    return toLatLng(o.lat ?? o.latitude, o.lng ?? o.lon ?? o.longitude);
  }
  return null;
};

/** A line or ring from a list of points ([[lat, lng], ...] or [{ lat, lng }, ...]), a GeoJSON geometry (LineString,
 *  Polygon: [lng, lat] order, its outer ring) or JSON text of either. Invalid points are dropped; null with fewer than
 *  two. */
export const toPath = (value: unknown): LatLng[] | null => {
  let v: unknown = value;
  if (isNonBlankString(v)) {
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
    v = g.type === 'Polygon' ? g.coordinates[0] : g.type === 'MultiPolygon' ? g.coordinates[0]?.[0] : g.coordinates;
  }
  if (!Array.isArray(v)) return null;
  const path = v
    .slice(0, MAX_PATH)
    .map((p) => pointOf(p, geo))
    .filter((p): p is LatLng => p !== null);
  return path.length >= 2 ? path : null;
};

const rowName = (row: Row | null | undefined): string => toText(row?.name ?? row?.title ?? row?.label ?? row?.id);

/** Lines through the markers in order (connectMarkers): one per value of routeField (all markers when it is empty),
 *  sorted by routeOrderField (numbers in numeric order) else in data order, starting at routeStart when given. Each
 *  line takes routeColors[name], else the next palette colour. */
export const markerRoutes = (
  points: MapPoint[],
  {
    routeField,
    routeOrderField,
    routeStart,
    routeColors,
  }: { routeField?: unknown; routeOrderField?: unknown; routeStart?: unknown; routeColors?: unknown } = {}
): MapRoute[] => {
  if (!Array.isArray(points) || points.length < 1) return [];
  const start = parseCenter(routeStart);
  const groups = new Map<string, MapPoint[]>();
  points.forEach((p) => {
    const name = isNonBlankString(routeField) ? toText(p.row?.[routeField]) : '';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)?.push(p);
  });
  const orderOf = (p: MapPoint): number | string | null => {
    const raw = isNonBlankString(routeOrderField) ? p.row?.[routeOrderField] : undefined;
    const n = typeof raw === 'number' ? raw : isNonBlankString(raw) && raw.trim() !== '' ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : isNonBlankString(raw) ? raw : null;
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
export const routeRows = (
  rows: unknown,
  { routeColors, statusColors }: { routeColors?: unknown; statusColors?: unknown } = {}
): MapRoute[] => {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, 500).flatMap((row: Row, index: number): MapRoute[] => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return [];
    const path = toPath(row.path ?? row.points ?? row.coordinates ?? row.geometry);
    if (!path) return [];
    const name = rowName(row);
    const tone = markerTone(toText(row.status));
    const color =
      safeColor(row.color) ||
      colorOf(name, routeColors) ||
      statusFill(row.status, tone, statusColors) ||
      ROUTE_PALETTE[index % ROUTE_PALETTE.length];
    return [{ key: `line:${toText(row.id) || index}`, name: name || `Route ${index + 1}`, path, color, row }];
  });
};

/** Areas: a polygon (areaShapeField: points, a GeoJSON Polygon or JSON text) or a circle (lat, lng and areaRadiusField
 *  in metres), titled by areaTitleField and toned by areaStatusField (statusColors, its words, or the row's color). */
/** The Map's area field properties, as bound. */
export interface AreaFields {
  areaShapeField?: unknown;
  areaTitleField?: unknown;
  areaStatusField?: unknown;
  areaRadiusField?: unknown;
}

export const areaShapes = (rows: unknown, f: AreaFields = {}, statusColors?: unknown): MapArea[] => {
  if (!Array.isArray(rows)) return [];
  const shapeKey = isNonBlankString(f.areaShapeField) ? f.areaShapeField : 'outline';
  const titleKey = isNonBlankString(f.areaTitleField) ? f.areaTitleField : 'name';
  const statusKey = isNonBlankString(f.areaStatusField) ? f.areaStatusField : 'status';
  const radiusKey = isNonBlankString(f.areaRadiusField) ? f.areaRadiusField : 'radius';
  return rows.slice(0, 1000).flatMap((row: Row, index: number): MapArea[] => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return [];
    const status = toText(row[statusKey]);
    const tone = markerTone(status);
    const color = safeColor(row.color) || statusFill(status, tone, statusColors) || null;
    const base = {
      key: `area:${toText(row.id) || index}`,
      title: toText(row[titleKey]) || rowName(row),
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
export const legendItems = ({
  points = [],
  routes = [],
  areas = [],
  statusColors,
}: { points?: MapPoint[]; routes?: MapRoute[]; areas?: MapArea[]; statusColors?: unknown } = {}): Legend => {
  const statuses = new Map<string, LegendEntry & { count: number }>();
  points.forEach((p) => {
    const label = p.statusLabel || '';
    if (!label) return;
    const entry = statuses.get(label) || { label, color: statusFill(p.status, p.tone, statusColors), count: 0 };
    entry.count += 1;
    statuses.set(label, entry);
  });
  const areaStatuses = new Map<string, LegendEntry>();
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
export const heatPoints = (points: MapPoint[], heatField: unknown): HeatPoint[] =>
  (Array.isArray(points) ? points : []).flatMap((p): HeatPoint[] => {
    if (!isNonBlankString(heatField)) return [[p.lat, p.lng, 1]];
    const w = Number(p.row?.[heatField]);
    return Number.isFinite(w) && w > 0 ? [[p.lat, p.lng, w]] : [];
  });
