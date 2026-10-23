// ToolJet UI 2.0 Map (Map.tsx): the Leaflet icons for pins, groups, the route start and the picked spot, the popup's
// content, and small helpers the map's layers share.
import L from 'leaflet';
import { iconSvg } from './mapLayers';
import type { Icon, LeafletMap, Path } from 'leaflet';
import type { LatLng, MapPoint, MarkerSize } from './mapTypes';

/** A group of markers drawn as a count. */
export interface Cluster {
  id: number;
  count: number;
}

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escapeHtml = (s: unknown): string => String(s).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
export const round6 = (n: number): number => Math.round(n * 1e6) / 1e6;
export const latLngOf = (ll: LatLng): LatLng => ({ lat: round6(ll.lat), lng: round6(ll.lng) });

const PIN_BODY = '<path class="sc-map-pin-body" d="M14 35s11-11.3 11-21.2A11 11 0 0 0 3 13.8C3 23.7 14 35 14 35z"/>';
const PIN_DOT = '<circle class="sc-map-pin-dot" cx="14" cy="13.8" r="4.4"/>';

/** How a pin is drawn beyond its row (mapMarkers.ts): its size, and how far its icon turns, in degrees clockwise (null
 *  or unset: upright). */
export interface PinLook {
  size?: MarkerSize;
  turn?: number | null;
}

// Pin sizes other than medium (28 x 36, the pin's own): width and height in px, the drawing scaled to them.
const PIN_SIZES: Record<string, [number, number]> = { small: [22, 28], large: [36, 46] };

/** A pin: the teardrop with a dot, a short label (a stop number) or an icon in it; a longer label is a pill (a price)
 *  with a pointer. Colours arrive as the --pin variable, which shadcn.scss's pin rules read. A size other than medium
 *  is a data-size the stylesheet reads; a turn rotates the icon only, so the pin and any label stay upright. */
export const pinIcon = (point: MapPoint, selected: boolean, color: string | null, look: PinLook = {}): Icon => {
  const style = color ? ` style="--pin:${color}"` : '';
  const attrs = `data-marker="${escapeHtml(point.key)}"${point.tone ? ` data-tone="${point.tone}"` : ''}${
    point.icon ? ` data-icon="${escapeHtml(point.icon)}"` : ''
  }${selected ? ' data-selected="true"' : ''}${style}`;
  const glyph = point.icon ? iconSvg(point.icon) : '';
  const turned =
    typeof look.turn === 'number' && Number.isFinite(look.turn)
      ? ` data-heading="${escapeHtml(point.heading)}" style="transform:rotate(${look.turn}deg)"`
      : '';
  if (point.label && point.label.length > 3) {
    const width = Math.round(18 + point.label.length * 7.2 + (glyph ? 16 : 0));
    return L.divIcon({
      className: 'sc-map-marker',
      html: `<span class="sc-map-pill" ${attrs}>${
        glyph ? `<span class="sc-map-pill-icon"${turned}>${glyph}</span>` : ''
      }${escapeHtml(point.label)}</span>`,
      iconSize: [width, 26],
      iconAnchor: [width / 2, 32],
    });
  }
  const inner = point.label
    ? `<span class="sc-map-pin-label">${escapeHtml(point.label)}</span>`
    : glyph
    ? `<span class="sc-map-pin-glyph"${turned}>${glyph}</span>`
    : '';
  const sized = look.size ? PIN_SIZES[look.size] : undefined;
  const [w, h] = sized || [28, 36];
  return L.divIcon({
    className: 'sc-map-marker',
    html: `<span class="sc-map-pin" ${attrs}${
      sized ? ` data-size="${look.size}"` : ''
    }><svg viewBox="0 0 28 36" width="${w}" height="${h}" aria-hidden="true">${PIN_BODY}${
      inner ? '' : PIN_DOT
    }</svg>${inner}</span>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h - 1],
  });
};

const clusterSize = (count: number): number => (count < 10 ? 30 : count < 100 ? 34 : count < 1000 ? 40 : 46);
export const clusterIcon = (cluster: Cluster): Icon => {
  const size = clusterSize(cluster.count);
  const label = cluster.count >= 10000 ? `${Math.round(cluster.count / 1000)}k` : String(cluster.count);
  return L.divIcon({
    className: 'sc-map-marker',
    html: `<span class="sc-map-cluster" data-cluster="${cluster.id}" style="width:${size}px;height:${size}px">${label}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};
export const startIcon = (): Icon =>
  L.divIcon({
    className: 'sc-map-marker',
    html: '<span class="sc-map-start" data-route-start=""></span>',
    iconSize: [16, 16],
  });
export const pickedIcon = (): Icon =>
  L.divIcon({
    className: 'sc-map-marker',
    html: `<span class="sc-map-picked" data-picked=""><svg viewBox="0 0 28 36" width="30" height="38" aria-hidden="true">${PIN_BODY}${PIN_DOT}</svg></span>`,
    iconSize: [30, 38],
    iconAnchor: [15, 37],
  });

export const pointTitle = (p: MapPoint): string =>
  [p.title, p.subtitle, p.statusLabel].filter(Boolean).join(' · ') || 'Location';

/** The popup's content: the title and its status chip, the second line, then the popup fields, one a line. Built as
 *  DOM with text nodes, so row values never become markup. */
export const popupNode = (point: MapPoint, lines: string[], color: string | null): HTMLDivElement => {
  const root = document.createElement('div');
  root.className = 'sc-map-popup-body';
  const head = document.createElement('div');
  head.className = 'sc-map-popup-head';
  const title = document.createElement('span');
  title.className = 'sc-map-popup-title';
  title.textContent = point.title || 'Location';
  head.appendChild(title);
  if (point.statusLabel) {
    const chip = document.createElement('span');
    chip.className = 'sc-map-chip';
    if (point.tone) chip.setAttribute('data-tone', point.tone);
    if (color) chip.style.setProperty('--chip', color);
    chip.textContent = point.statusLabel;
    head.appendChild(chip);
  }
  root.appendChild(head);
  if (point.subtitle) {
    const sub = document.createElement('div');
    sub.className = 'sc-map-popup-sub';
    sub.textContent = point.subtitle;
    root.appendChild(sub);
  }
  if (lines.length) {
    const list = document.createElement('ul');
    list.className = 'sc-map-popup-lines';
    lines.forEach((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      list.appendChild(li);
    });
    root.appendChild(list);
  }
  return root;
};

export const hasSize = (map: LeafletMap | null | undefined): boolean => {
  const size = map?.getSize?.();
  return !!size && size.x > 0 && size.y > 0;
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

/** Sets a path's colour as a CSS variable (an SVG attribute cannot hold var()), once it is in the DOM. */
export const paint = (layer: Path, color: string | null, selected: boolean): void => {
  const el = layer.getElement?.();
  if (!el) return;
  if (color) el.style.setProperty('--shape', color);
  else el.style.removeProperty('--shape');
  if (selected) el.setAttribute('data-selected', 'true');
  else el.removeAttribute('data-selected');
};
