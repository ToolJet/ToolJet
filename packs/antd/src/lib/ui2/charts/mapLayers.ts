// The Map's Leaflet parts, ported from UI 2.0 (Widgets/Ui2/Map/mapIcons.ts, mapMarkers.ts, mapLayers.ts): pin, image,
// group, start and picked-spot icons, the popup's content, a canvas heat layer, marker grouping and a polite geocoder
// client. UI 2.0 groups markers with supercluster, which the pack does not ship: groups here are a 72px screen grid.
import L from 'leaflet';
import { MAP_REFERRER_POLICY, fillUrl, parsePlaces, type HeatPoint, type MapPoint, type MarkerSize, type Place } from './mapModel';

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (s: unknown): string => String(s).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

// ---- Icons as SVG text -----------------------------------------------------------------------------------------------


/** A lucide icon as white SVG text for a pin, from the icon's own node list (its forwardRef render returns lucide's
 *  base Icon element, which carries it): no renderer needed. '' when lucide has no such icon. */
// Pin icons: the shadcn pack draws lucide icons in its pins; the Ant pack keeps the plain pin (Ant's icons are React
// components, and this builds marker HTML as text).
export const iconSvg = (_name: string, _size = 14): string => '';

// ---- Markers ---------------------------------------------------------------------------------------------------------

const PIN_BODY = '<path class="ui-map-pin-body" d="M14 35s11-11.3 11-21.2A11 11 0 0 0 3 13.8C3 23.7 14 35 14 35z"/>';
const PIN_DOT = '<circle class="ui-map-pin-dot" cx="14" cy="13.8" r="4.4"/>';
const PIN_SIZES: Record<string, [number, number]> = { small: [22, 28], large: [36, 46] };
const IMAGE_SIZES: Record<MarkerSize, number> = { small: 24, medium: 32, large: 44 };
const PIN_POPUP: Record<MarkerSize, number> = { small: -23, medium: -30, large: -38 };

// Icons lucide draws pointing north-east or east: a heading turns them back by that much first, so 0 points up.
const HEADING_OFFSETS: Record<string, number> = {
  navigation: 45,
  plane: 45,
  send: 45,
  rocket: 45,
  arrowupright: 45,
  moveupright: 45,
  arrowright: 90,
  moveright: 90,
  sendhorizontal: 90,
};
const headingOffset = (name: string): number =>
  HEADING_OFFSETS[name.trim().toLowerCase().replace(/[-_\s]+/g, '').replace(/^icon(?=.)/, '')] ?? 0;
const glyphTurn = (p: MapPoint): number | null => (p.heading === null ? null : (((p.heading - headingOffset(p.icon)) % 360) + 360) % 360);

// Images that failed to load draw their pin from then on.
const FAILED = new Set<string>();
const imageShown = (p: MapPoint): string => (p.image && !FAILED.has(p.image) ? p.image : '');

/** A pin (the teardrop with a dot, a short label or an icon in it), a price pill for a longer label, or the row's
 *  image with a ring of its status colour. Colours arrive as --pin. */
export const markerIcon = (point: MapPoint, selected: boolean, color: string | null, size: MarkerSize, onImageError: () => void): L.DivIcon => {
  const url = imageShown(point);
  if (url) {
    const box = document.createElement('span');
    box.className = 'ui-map-image';
    box.setAttribute('data-marker', point.key);
    if (point.tone) box.setAttribute('data-tone', point.tone);
    if (selected) box.setAttribute('data-selected', 'true');
    if (size !== 'medium') box.setAttribute('data-size', size);
    if (color) {
      box.setAttribute('data-ring', 'true');
      box.style.setProperty('--pin', color);
    }
    const img = document.createElement('img');
    img.alt = '';
    img.draggable = false;
    if (point.heading !== null) img.style.transform = `rotate(${point.heading}deg)`;
    img.addEventListener(
      'error',
      () => {
        if (FAILED.size > 500) FAILED.clear();
        FAILED.add(url);
        onImageError();
      },
      { once: true }
    );
    img.src = url;
    box.appendChild(img);
    const px = IMAGE_SIZES[size];
    return L.divIcon({ className: 'ui-map-mark', html: box, iconSize: [px, px], iconAnchor: [px / 2, px / 2] });
  }
  const style = color ? ` style="--pin:${escapeHtml(color)}"` : '';
  const attrs = `data-marker="${escapeHtml(point.key)}"${point.tone ? ` data-tone="${point.tone}"` : ''}${selected ? ' data-selected="true"' : ''}${style}`;
  const glyph = point.icon ? iconSvg(point.icon, size === 'small' ? 11 : size === 'large' ? 18 : 14) : '';
  const turn = glyphTurn(point);
  const turned = turn !== null ? ` style="transform:rotate(${turn}deg)"` : '';
  if (point.label && point.label.length > 3) {
    const width = Math.round(18 + point.label.length * 7.2 + (glyph ? 16 : 0));
    return L.divIcon({
      className: 'ui-map-mark',
      html: `<span class="ui-map-pill" ${attrs}>${glyph ? `<span class="ui-map-pill-icon"${turned}>${glyph}</span>` : ''}${escapeHtml(point.label)}</span>`,
      iconSize: [width, 26],
      iconAnchor: [width / 2, 32],
    });
  }
  const inner = point.label
    ? `<span class="ui-map-pin-label">${escapeHtml(point.label)}</span>`
    : glyph
      ? `<span class="ui-map-pin-glyph"${turned}>${glyph}</span>`
      : '';
  const sized = PIN_SIZES[size];
  const [w, h] = sized || [28, 36];
  return L.divIcon({
    className: 'ui-map-mark',
    html: `<span class="ui-map-pin" ${attrs}${sized ? ` data-size="${size}"` : ''}><svg viewBox="0 0 28 36" width="${w}" height="${h}" aria-hidden="true">${PIN_BODY}${inner ? '' : PIN_DOT}</svg>${inner}</span>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h - 1],
  });
};

export const markerPopupOffset = (point: MapPoint, size: MarkerSize): [number, number] => {
  if (imageShown(point)) return [0, -(IMAGE_SIZES[size] / 2 + 2)];
  if (point.label.length > 3) return [0, -30];
  return [0, PIN_POPUP[size]];
};

export const clusterIcon = (count: number): L.DivIcon => {
  const size = count < 10 ? 30 : count < 100 ? 34 : count < 1000 ? 40 : 46;
  const label = count >= 10000 ? `${Math.round(count / 1000)}k` : String(count);
  return L.divIcon({
    className: 'ui-map-mark',
    html: `<span class="ui-map-cluster" style="width:${size}px;height:${size}px">${label}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};
export const startIcon = (): L.DivIcon => L.divIcon({ className: 'ui-map-mark', html: '<span class="ui-map-start"></span>', iconSize: [16, 16] });
export const pickedIcon = (): L.DivIcon =>
  L.divIcon({
    className: 'ui-map-mark',
    html: `<span class="ui-map-picked"><svg viewBox="0 0 28 36" width="30" height="38" aria-hidden="true">${PIN_BODY}${PIN_DOT}</svg></span>`,
    iconSize: [30, 38],
    iconAnchor: [15, 37],
  });

export const pointTitle = (p: MapPoint): string => [p.title, p.subtitle, p.statusLabel].filter(Boolean).join(' · ') || 'Location';

/** The popup's content: the title and its status chip, the second line, then the popup fields, one a line. Built as
 *  DOM with text nodes, so row values never become markup. */
export const popupNode = (point: MapPoint, lines: string[], color: string | null): HTMLDivElement => {
  const root = document.createElement('div');
  root.className = 'ui-map-popup-body';
  const head = document.createElement('div');
  head.className = 'ui-map-popup-head';
  const title = document.createElement('span');
  title.className = 'ui-map-popup-title';
  title.textContent = point.title || 'Location';
  head.appendChild(title);
  if (point.statusLabel) {
    const chip = document.createElement('span');
    chip.className = 'ui-map-chip';
    if (point.tone) chip.setAttribute('data-tone', point.tone);
    if (color) chip.style.setProperty('--chip', color);
    chip.textContent = point.statusLabel;
    head.appendChild(chip);
  }
  root.appendChild(head);
  if (point.subtitle) {
    const sub = document.createElement('div');
    sub.className = 'ui-map-popup-sub';
    sub.textContent = point.subtitle;
    root.appendChild(sub);
  }
  if (lines.length) {
    const list = document.createElement('ul');
    list.className = 'ui-map-popup-lines';
    lines.forEach((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      list.appendChild(li);
    });
    root.appendChild(list);
  }
  return root;
};

/** Sets a path's colour as a CSS variable (an SVG attribute cannot hold var()), once it is in the DOM. */
export const paint = (layer: L.Path, color: string | null, selected: boolean): void => {
  const el = layer.getElement?.() as SVGElement | undefined;
  if (!el) return;
  if (color) el.style.setProperty('--shape', color);
  else el.style.removeProperty('--shape');
  if (selected) el.setAttribute('data-selected', 'true');
  else el.removeAttribute('data-selected');
};

// ---- Grouping --------------------------------------------------------------------------------------------------------

export type DrawItem = { key: string; point: MapPoint } | { key: string; cluster: { count: number; members: MapPoint[] }; lat: number; lng: number };

const CLUSTER_RADIUS = 72;
const PILL_CLUSTER_RADIUS = 88;
const CLUSTER_MAX_ZOOM = 16;
const CLUSTER_MIN_POINTS = 3;

/** The markers to draw at the map's zoom: points in a padded view, crowded ones (3 or more in a 72px cell, 88px with
 *  price pills) as a group at their centre, up to zoom 16. */
export const drawItems = (map: L.Map, points: MapPoint[], cluster: boolean): DrawItem[] => {
  const size = map.getSize();
  const bounds = size.x > 0 && size.y > 0 ? map.getBounds().pad(0.5) : null;
  const inView = bounds && bounds.getEast() - bounds.getWest() < 360 ? points.filter((p) => bounds.contains([p.lat, p.lng])) : points;
  const zoom = Math.round(map.getZoom());
  if (!cluster || zoom > CLUSTER_MAX_ZOOM || inView.length < CLUSTER_MIN_POINTS) return inView.map((p) => ({ key: p.key, point: p }));
  const radius = points.some((p) => p.label.length > 3) ? PILL_CLUSTER_RADIUS : CLUSTER_RADIUS;
  const cells = new Map<string, MapPoint[]>();
  inView.forEach((p) => {
    const at = map.project([p.lat, p.lng], zoom);
    const cell = `${Math.floor(at.x / radius)}:${Math.floor(at.y / radius)}`;
    if (!cells.has(cell)) cells.set(cell, []);
    cells.get(cell)?.push(p);
  });
  const items: DrawItem[] = [];
  cells.forEach((members, cell) => {
    if (members.length < CLUSTER_MIN_POINTS) members.forEach((p) => items.push({ key: p.key, point: p }));
    else {
      const lat = members.reduce((s, p) => s + p.lat, 0) / members.length;
      const lng = members.reduce((s, p) => s + p.lng, 0) / members.length;
      items.push({ key: `cluster:${zoom}:${cell}`, cluster: { count: members.length, members }, lat, lng });
    }
  });
  return items;
};

// ---- Heat layer ------------------------------------------------------------------------------------------------------

// Density from transparent through blue, cyan, green and yellow to red.
const HEAT_STOPS: [number, number[]][] = [
  [0.0, [37, 99, 235, 0]],
  [0.25, [37, 99, 235, 150]],
  [0.45, [6, 182, 212, 190]],
  [0.6, [34, 197, 94, 210]],
  [0.8, [250, 204, 21, 225]],
  [1.0, [220, 38, 38, 235]],
];
let PALETTE: Uint8ClampedArray | null = null;
const heatPalette = () => {
  const out = new Uint8ClampedArray(256 * 4);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    const k = HEAT_STOPS.findIndex(([at]) => at >= t);
    const [a0, c0] = HEAT_STOPS[Math.max(0, k - 1)];
    const [a1, c1] = HEAT_STOPS[Math.max(0, k)];
    const f = a1 === a0 ? 0 : (t - a0) / (a1 - a0);
    for (let j = 0; j < 4; j++) out[i * 4 + j] = c0[j] + (c1[j] - c0[j]) * f;
  }
  return out;
};

/** A canvas layer drawing the density of weighted points at a radius in px, redrawn after each move. */
export class HeatLayer extends L.Layer {
  private points: HeatPoint[];
  private radius: number;
  private canvas: HTMLCanvasElement | null = null;
  private host: L.Map | null = null;
  constructor(points: HeatPoint[], radius: number) {
    super();
    this.points = points;
    this.radius = radius;
  }
  setData(points: HeatPoint[], radius: number) {
    this.points = points;
    this.radius = radius;
    this.redraw();
  }
  onAdd(map: L.Map) {
    this.host = map;
    this.canvas = L.DomUtil.create('canvas', 'ui-map-heat leaflet-zoom-hide');
    map.getPanes().overlayPane.appendChild(this.canvas);
    map.on('moveend resize zoomend', this.redraw, this);
    this.redraw();
    return this;
  }
  onRemove(map: L.Map) {
    map.off('moveend resize zoomend', this.redraw, this);
    this.canvas?.remove();
    this.canvas = null;
    return this;
  }
  redraw() {
    const map = this.host;
    const canvas = this.canvas;
    if (!map || !canvas) return;
    const size = map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;
    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
    const ctx = size.x > 0 && size.y > 0 ? canvas.getContext('2d') : null;
    if (!ctx) return;
    const r = this.radius;
    const blur = r * 0.6;
    const stamp = document.createElement('canvas');
    stamp.width = stamp.height = (r + blur) * 2;
    const s = stamp.getContext('2d');
    if (!s) return;
    s.shadowOffsetX = s.shadowOffsetY = stamp.width * 2;
    s.shadowBlur = blur;
    s.shadowColor = 'black';
    s.beginPath();
    s.arc(-stamp.width * 2 + r + blur, -stamp.width * 2 + r + blur, r, 0, Math.PI * 2);
    s.fill();
    // Weights scale to the heaviest point in view, so the colours use the whole range wherever the map is.
    const bounds = map.getBounds().pad(0.2);
    const inView = this.points.filter(([lat, lng]) => bounds.contains([lat, lng])).slice(0, 50000);
    const max = inView.reduce((m, p) => Math.max(m, p[2]), 1);
    ctx.clearRect(0, 0, size.x, size.y);
    inView.forEach(([lat, lng, w]) => {
      const pt = map.latLngToContainerPoint([lat, lng]);
      ctx.globalAlpha = Math.min(1, Math.max(0.06, w / max));
      ctx.drawImage(stamp, pt.x - r - blur, pt.y - r - blur);
    });
    PALETTE = PALETTE || heatPalette();
    const image = ctx.getImageData(0, 0, size.x, size.y);
    const px = image.data;
    for (let i = 3; i < px.length; i += 4) {
      const a = px[i];
      if (!a) continue;
      const o = a * 4;
      px[i - 3] = PALETTE[o];
      px[i - 2] = PALETTE[o + 1];
      px[i - 1] = PALETTE[o + 2];
      px[i] = Math.min(PALETTE[o + 3], a * 1.4);
    }
    ctx.putImageData(image, 0, 0);
  }
}

// ---- Geocoding -------------------------------------------------------------------------------------------------------

// One request a second at most from any map on the page (Nominatim's policy), the last 100 answers kept, a request
// given up after 10 s, answers over 256 KB refused.
const MIN_GAP_MS = 1100;
const TIMEOUT_MS = 10000;
const MAX_BYTES = 256 * 1024;
let lastRequest = 0;
let queue: Promise<unknown> = Promise.resolve();
const CACHE = new Map<string, Place[]>();

/** Places for a geocoder URL template (search { query }; reverse { lat, lng }); null when the signal aborts. */
export const geocode = (template: string, values: Record<string, unknown>, signal?: AbortSignal): Promise<Place[] | null> => {
  const url = fillUrl(template, values);
  if (CACHE.has(url)) return Promise.resolve(CACHE.get(url) ?? null);
  const run = async (): Promise<Place[] | null> => {
    const wait = lastRequest + MIN_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    if (signal?.aborted) return null;
    lastRequest = Date.now();
    const stop = new AbortController();
    const abort = () => stop.abort();
    signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: stop.signal,
        referrerPolicy: MAP_REFERRER_POLICY,
        headers: { Accept: 'application/json', 'Accept-Language': navigator.language || 'en' },
      });
      if (!res.ok) throw new Error(`geocoder ${res.status}`);
      const body = await res.text();
      if (body.length > MAX_BYTES) throw new Error('geocoder answer too large');
      const places = parsePlaces(JSON.parse(body));
      CACHE.set(url, places);
      if (CACHE.size > 100) CACHE.delete(CACHE.keys().next().value as string);
      return places;
    } catch (e) {
      if (signal?.aborted) return null;
      throw e;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  };
  const answer = queue.then(run, run);
  queue = answer.catch(() => null);
  return answer;
};
