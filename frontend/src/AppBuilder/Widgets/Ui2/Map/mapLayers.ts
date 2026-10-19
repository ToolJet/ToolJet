// ToolJet UI 2.0 Map (Map.tsx): the parts that are not markers. A heat layer on a canvas, icons for pins (lucide,
// loaded only when a map uses them), and a polite geocoder client for address search and the picked spot's address.
import { useEffect } from 'react';
import L from 'leaflet';
import { fillUrl, parsePlaces } from './mapGeocoding';
import type { MutableRefObject } from 'react';
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

/** Keeps the Map's heat layer in step with its points: added when heat is shown, updated, removed when it is not. The
 *  canvas carries what it drew as data attributes, for tests and for checking a page. */
export const useHeatLayer = (
  mapRef: MutableRefObject<LeafletMap | null>,
  heatRef: MutableRefObject<HeatLayerInstance | null>,
  shown: boolean,
  heat: HeatPoint[],
  heatRadius: number
): void => {
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!shown) {
      if (heatRef.current) map.removeLayer(heatRef.current);
      heatRef.current = null;
      return;
    }
    if (!heatRef.current) {
      heatRef.current = new HeatLayer(heat, heatRadius);
      heatRef.current.addTo(map);
    } else heatRef.current.setData(heat, heatRadius);
    const canvas = heatRef.current._canvas;
    if (canvas) {
      canvas.setAttribute('data-points', String(heat.length));
      canvas.setAttribute('data-weight', String(Math.round(heat.reduce((t, h) => t + h[2], 0) * 100) / 100));
      canvas.setAttribute('data-radius', String(heatRadius));
    }
  }, [mapRef, heatRef, shown, heat, heatRadius]);
};

// ---- Icons -----------------------------------------------------------------------------------------------------------

const ICON_SVG = new Map<string, string>();
// Icons kept, by name, at most: a map's data can name any icon, and each name it gives is kept.
export const ICON_CACHE_MAX = 500;
// Icons being drawn, by name, so maps asking at once share one drawing (each was drawn again per map).
const ICON_PENDING = new Map<string, Promise<boolean>>();
type IconModules = [
  typeof import('lucide-react'),
  typeof import('react-dom/server'),
  typeof import('react'),
  typeof import('@/AppBuilder/Widgets/Ui2/_display/iconModel')
];
let iconModules: Promise<IconModules> | null = null;

/** lucide and the SVG renderer, loaded once. A failed load is forgotten so the next call loads again: it stayed in the
 *  chain, and no icon loaded until the page was reloaded. */
const loadIconModules = (): Promise<IconModules> => {
  if (iconModules) return iconModules;
  const loading = Promise.all([
    import('lucide-react'),
    import('react-dom/server'),
    import('react'),
    import('@/AppBuilder/Widgets/Ui2/_display/iconModel'),
  ]);
  iconModules = loading;
  loading.catch(() => {
    if (iconModules === loading) iconModules = null;
  });
  return loading;
};

/** The names a map asks for that loadIcons would load and that are not drawn yet (names that are not text, or are
 *  over 64 characters, are never loaded). */
export const missingIcons = (names: unknown[]): string[] =>
  [...new Set(names.filter((n): n is string => typeof n === 'string' && !!n && n.length <= 64))].filter(
    (n) => !ICON_SVG.has(n)
  );

/** Loads lucide and renders each named icon once to SVG text for a pin (white, 14px). Resolves true when icons it
 *  asked for are ready, false when there was nothing to load or the load failed (a later call tries again); names
 *  lucide does not have get its dashed placeholder. */
export const loadIcons = (names: unknown[]): Promise<boolean> => {
  const named = missingIcons(names);
  const fresh = named.filter((n) => !ICON_PENDING.has(n));
  const work = named.filter((n) => ICON_PENDING.has(n)).map((n) => ICON_PENDING.get(n) as Promise<boolean>);
  if (fresh.length) {
    const drawing = loadIconModules().then(([Lucide, Server, React, model]) => {
      const maps = [Lucide.icons, Lucide];
      const fallback = Lucide.CircleDashed || Lucide.Circle;
      fresh.forEach((name) => {
        const Icon = model.resolveIcon(name, maps, fallback);
        const markup = Server.renderToStaticMarkup(
          React.createElement(Icon, { size: 14, strokeWidth: 2.25, color: '#ffffff', 'aria-hidden': 'true' })
        );
        ICON_SVG.set(name, markup);
        const oldest = ICON_SVG.keys().next().value;
        if (ICON_SVG.size > ICON_CACHE_MAX && oldest !== undefined) ICON_SVG.delete(oldest);
      });
      return true;
    });
    const settled = drawing.catch(() => false);
    fresh.forEach((name) => ICON_PENDING.set(name, settled));
    // Only this drawing's own entries are cleared: a name asked for again after it failed belongs to the new drawing.
    settled.then(() =>
      fresh.forEach((name) => {
        if (ICON_PENDING.get(name) === settled) ICON_PENDING.delete(name);
      })
    );
    work.push(settled);
  }
  if (!work.length) return Promise.resolve(false);
  return Promise.all(work).then((ready) => ready.every(Boolean));
};
export const iconSvg = (name: string): string => ICON_SVG.get(name) || '';

// ---- Geocoding -------------------------------------------------------------------------------------------------------

// One request a second at most, from any map on the page (Nominatim's policy), and the last 100 answers kept.
const MIN_GAP_MS = 1100;
// A request with no answer by then is given up: one that never settled held the queue for every map on the page.
export const GEOCODE_TIMEOUT_MS = 10000;
let lastRequest = 0;
let queue: Promise<unknown> = Promise.resolve();
const CACHE = new Map<string, Place[]>();
// The largest geocoder answer read: five Nominatim places are a few kilobytes. An answer was read and parsed whole,
// whatever its size.
export const GEOCODE_MAX_ANSWER_BYTES = 256 * 1024;

/** A geocoder answer over GEOCODE_MAX_ANSWER_BYTES, refused rather than read on: the address search says so. */
export class GeocoderAnswerTooLarge extends Error {
  constructor() {
    super(`geocoder answer over ${GEOCODE_MAX_ANSWER_BYTES / 1024} KB`);
    this.name = 'GeocoderAnswerTooLarge';
    Object.setPrototypeOf(this, GeocoderAnswerTooLarge.prototype);
  }
}

/** A geocoder answer as JSON, read up to GEOCODE_MAX_ANSWER_BYTES: refused at once when it declares more, and when it
 *  streams past the limit, without reading the rest. */
const readAnswer = async (res: Response): Promise<unknown> => {
  if (Number(res.headers?.get?.('content-length')) > GEOCODE_MAX_ANSWER_BYTES) {
    // Cancelled, not just left unread: the download went on in the background.
    res.body?.cancel?.().catch(() => {});
    throw new GeocoderAnswerTooLarge();
  }
  const reader = res.body?.getReader?.();
  if (!reader) return res.json();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > GEOCODE_MAX_ANSWER_BYTES) {
      reader.cancel().catch(() => {});
      throw new GeocoderAnswerTooLarge();
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  chunks.reduce((at, chunk) => (bytes.set(chunk, at), at + chunk.byteLength), 0);
  return JSON.parse(new TextDecoder().decode(bytes));
};

/** A request on its way, shared by every caller asking for its URL meanwhile: five setPickedLocation calls on one spot
 *  made five requests a second apart for one answer. It is cancelled when the last caller stops waiting. */
interface SharedRequest {
  answer: Promise<Place[] | null>;
  waiting: number;
  stop: AbortController;
}
const IN_FLIGHT = new Map<string, SharedRequest>();

const request = (url: string): SharedRequest => {
  const stop = new AbortController();
  const run = async (): Promise<Place[] | null> => {
    const wait = lastRequest + MIN_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    if (stop.signal.aborted) return null;
    lastRequest = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        stop.abort();
        reject(new Error('geocoder did not answer'));
      }, GEOCODE_TIMEOUT_MS);
    });
    const fetched = (async () => {
      const res = await fetch(url, {
        signal: stop.signal,
        headers: { Accept: 'application/json', 'Accept-Language': navigator.language || 'en' },
      });
      if (!res.ok) throw new Error(`geocoder ${res.status}`);
      return parsePlaces(await readAnswer(res));
    })();
    try {
      const places = await Promise.race([fetched, deadline]);
      CACHE.set(url, places);
      const oldest = CACHE.keys().next().value;
      if (CACHE.size > 100 && oldest !== undefined) CACHE.delete(oldest);
      return places;
    } finally {
      clearTimeout(timer);
      fetched.catch(() => null);
    }
  };
  const answer = queue.then(run, run);
  queue = answer.catch(() => null);
  const shared: SharedRequest = { answer, waiting: 0, stop };
  answer.then(
    () => IN_FLIGHT.get(url) === shared && IN_FLIGHT.delete(url),
    () => IN_FLIGHT.get(url) === shared && IN_FLIGHT.delete(url)
  );
  return shared;
};

/** Fetches places for a geocoder URL (search: { query }; reverse: { lat, lng }), at most one request a second, from a
 *  cache when asked before, sharing a request already on its way. Rejects on a network or HTTP error, or no answer in
 *  GEOCODE_TIMEOUT_MS; a call whose signal aborts resolves to null. */
export const geocode = (
  template: string,
  values: Record<string, unknown>,
  signal?: AbortSignal | null
): Promise<Place[] | null> => {
  // A caller that stopped waiting gets null, whether or not the answer is kept (a kept answer came back to it).
  if (signal?.aborted) return Promise.resolve(null);
  const url = fillUrl(template, values);
  if (CACHE.has(url)) return Promise.resolve(CACHE.get(url) ?? null);
  const shared = IN_FLIGHT.get(url) ?? request(url);
  IN_FLIGHT.set(url, shared);
  shared.waiting += 1;
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = () => {
      done = true;
      signal?.removeEventListener('abort', leave);
      shared.waiting -= 1;
    };
    // The last caller to stop waiting cancels the request; a later call for the URL starts a new one.
    function leave() {
      if (done) return;
      finish();
      if (shared.waiting === 0) {
        if (IN_FLIGHT.get(url) === shared) IN_FLIGHT.delete(url);
        shared.stop.abort();
      }
      resolve(null);
    }
    signal?.addEventListener('abort', leave, { once: true });
    shared.answer.then(
      (places) => {
        if (done) return;
        finish();
        resolve(places);
      },
      (e) => {
        if (done) return;
        finish();
        if (e?.name === 'AbortError') resolve(null);
        else reject(e);
      }
    );
  });
};
