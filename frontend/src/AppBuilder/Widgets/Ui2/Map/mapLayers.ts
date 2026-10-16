// ToolJet UI 2.0 Map (Map.tsx): the parts that are not markers. A heat layer on a canvas, icons for pins (lucide,
// loaded only when a map uses them), and a polite geocoder client for address search and the picked spot's address.
import L from 'leaflet';
import { fillUrl, parsePlaces } from './mapGeocoding';
import type { LeafletMap } from 'leaflet';
import type { HeatPoint } from './mapShapes';
import type { Place } from './mapTypes';

// ---- Heat layer ------------------------------------------------------------------------------------------------------

// Density from transparent through blue, cyan, green and yellow to red: the reading people expect of a heat map.
const HEAT_STOPS: [number, number[]][] = [
  [0.0, [37, 99, 235, 0]],
  [0.25, [37, 99, 235, 150]],
  [0.45, [6, 182, 212, 190]],
  [0.6, [34, 197, 94, 210]],
  [0.8, [250, 204, 21, 225]],
  [1.0, [220, 38, 38, 235]],
];
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
let PALETTE: Uint8ClampedArray | null = null;

/** What the heat layer keeps on itself. */
interface HeatState {
  _points: HeatPoint[];
  _radius: number;
  _map: LeafletMap | null;
  _canvas: HTMLCanvasElement | null;
}

interface HeatMethods {
  initialize(points: HeatPoint[], radius: number): void;
  setData(points: HeatPoint[], radius: number): unknown;
  onAdd(map: LeafletMap): void;
  onRemove(map: LeafletMap): void;
  _redraw(): void;
}

/** A canvas layer drawing the density of weighted points ([lat, lng, weight]) at a radius in px. Redrawn after each
 *  move; hidden while a zoom animates. Without canvas support (tests) it draws nothing. */
export const HeatLayer = L.Layer.extend<HeatMethods, HeatState>({
  initialize(points, radius) {
    this._points = points || [];
    this._radius = radius || 28;
  },
  setData(points, radius) {
    this._points = points || [];
    this._radius = radius || this._radius;
    this._redraw();
    return this;
  },
  onAdd(map) {
    this._map = map;
    this._canvas = L.DomUtil.create('canvas', 'sc-map-heat leaflet-zoom-hide');
    this._canvas.setAttribute('aria-hidden', 'true');
    map.getPanes().overlayPane.appendChild(this._canvas);
    map.on('moveend resize zoomend', this._redraw, this);
    this._redraw();
  },
  onRemove(map) {
    map.off('moveend resize zoomend', this._redraw, this);
    this._canvas?.remove();
    this._canvas = null;
  },
  _redraw() {
    const map = this._map;
    const canvas = this._canvas;
    if (!map || !canvas) return;
    const size = map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;
    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
    const ctx = size.x > 0 && size.y > 0 && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
    if (!ctx) return;
    const r = this._radius;
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
    const inView = this._points.filter(([lat, lng]) => bounds.contains([lat, lng]));
    const max = Math.max(1, ...inView.map((p) => p[2]).slice(0, 50000));
    ctx.clearRect(0, 0, size.x, size.y);
    inView.slice(0, 50000).forEach(([lat, lng, w]) => {
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
  },
});

/** A heat layer on the map. */
export type HeatLayerInstance = InstanceType<typeof HeatLayer>;

// ---- Icons -----------------------------------------------------------------------------------------------------------

const ICON_SVG = new Map<string, string>();
let iconsLoading: Promise<boolean> | null = null;

/** Loads lucide and renders each named icon once to SVG text for a pin (white, 14px). Resolves when ready; names lucide
 *  does not have get its dashed placeholder. */
export const loadIcons = (names: unknown[]): Promise<boolean> => {
  const wanted = [...new Set(names.filter((n): n is string => typeof n === 'string' && !!n && n.length <= 64))].filter(
    (n) => !ICON_SVG.has(n)
  );
  if (!wanted.length) return Promise.resolve(false);
  iconsLoading = (iconsLoading || Promise.resolve()).then(() =>
    Promise.all([
      import('lucide-react'),
      import('react-dom/server'),
      import('react'),
      import('@/AppBuilder/Widgets/Ui2/_display/iconModel'),
    ]).then(([Lucide, Server, React, model]) => {
      const maps = [Lucide.icons, Lucide];
      const fallback = Lucide.CircleDashed || Lucide.Circle;
      wanted.forEach((name) => {
        const Icon = model.resolveIcon(name, maps, fallback);
        const markup = Server.renderToStaticMarkup(
          React.createElement(Icon, { size: 14, strokeWidth: 2.25, color: '#ffffff', 'aria-hidden': 'true' })
        );
        ICON_SVG.set(name, markup);
      });
      return true;
    })
  );
  return iconsLoading.catch(() => false);
};
export const iconSvg = (name: string): string => ICON_SVG.get(name) || '';

// ---- Geocoding -------------------------------------------------------------------------------------------------------

// One request a second at most, from any map on the page (Nominatim's policy), and the last 100 answers kept.
const MIN_GAP_MS = 1100;
let lastRequest = 0;
let queue: Promise<unknown> = Promise.resolve();
const CACHE = new Map<string, Place[]>();

/** Fetches places for a geocoder URL (search: { query }; reverse: { lat, lng }), at most one request a second, from a
 *  cache when asked before. Rejects on a network or HTTP error; an aborted call resolves to null. */
export const geocode = (
  template: string,
  values: Record<string, unknown>,
  signal?: AbortSignal | null
): Promise<Place[] | null> => {
  const url = fillUrl(template, values);
  if (CACHE.has(url)) return Promise.resolve(CACHE.get(url) ?? null);
  const run = async () => {
    const wait = lastRequest + MIN_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    if (signal?.aborted) return null;
    lastRequest = Date.now();
    const res = await fetch(url, {
      signal,
      headers: { Accept: 'application/json', 'Accept-Language': navigator.language || 'en' },
    });
    if (!res.ok) throw new Error(`geocoder ${res.status}`);
    const places = parsePlaces(await res.json());
    CACHE.set(url, places);
    const oldest = CACHE.keys().next().value;
    if (CACHE.size > 100 && oldest !== undefined) CACHE.delete(oldest);
    return places;
  };
  const next = queue.then(run, run);
  queue = next.catch(() => null);
  return next.catch((e) => (e?.name === 'AbortError' ? null : Promise.reject(e)));
};
