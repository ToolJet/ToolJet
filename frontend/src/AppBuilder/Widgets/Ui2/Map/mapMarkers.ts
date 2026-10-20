// ToolJet UI 2.0 Map (Map.tsx): a marker's look beyond its row's pin. Its size (markerSize), the heading its icon or image
// points to (headingField), and an image in place of the pin (imageField). The image is an <img> made as DOM, its URL
// set as a property and never written into markup; a browser runs no script in an image, so an SVG holding one is
// only a picture.
import L from 'leaflet';
import { pinIcon } from './mapIcons';
import { own } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import type { Icon } from 'leaflet';
import type { MapPoint, MarkerSize } from './mapTypes';

/** markerSize as bound: small or large, anything else medium (the pin's own size). */
export const markerSizeOf = (v: unknown): MarkerSize => (v === 'small' || v === 'large' ? v : 'medium');

// Icons lucide draws pointing somewhere other than north, by the degrees they already turn clockwise: these point
// north-east (or east), so a heading turns them back by that much first and 0 points up. Icons drawn from the side
// (car, bike, truck) or with no direction turn by the heading as they are.
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
  sendhorizonal: 90,
};

/** How far an icon already turns from north, read as the icon resolver reads its name ('arrow-up-right', 'Plane',
 *  ToolJet's 'IconPlane'); 0 for every other icon. */
export const headingOffset = (name: unknown): number => {
  if (typeof name !== 'string') return 0;
  const key = name
    .trim()
    .toLowerCase()
    .replace(/[-_\s]+/g, '')
    .replace(/^icon(?=.)/, '');
  return own(HEADING_OFFSETS, key) ?? 0;
};

const wrap = (deg: number): number => ((deg % 360) + 360) % 360;

/** The turn of a pin's icon for its heading, in degrees clockwise; null without a heading (upright). */
export const glyphTurn = (point: MapPoint): number | null =>
  point.heading === null ? null : wrap(point.heading - headingOffset(point.icon));

// ---- Images ----------------------------------------------------------------------------------------------------------

/** An image marker's width and height in px, per size. */
export const IMAGE_SIZES: Record<MarkerSize, number> = { small: 24, medium: 32, large: 44 };

// Images that failed to load, by URL, at most this many: those rows draw their pin instead from then on.
const FAILED_MAX = 500;
const FAILED = new Set<string>();
export const markerImageFailed = (url: string): boolean => FAILED.has(url);
const imageShown = (point: MapPoint): string => (point.image && !FAILED.has(point.image) ? point.image : '');

// A short key per image URL for a marker's signature: a data URI can run to kilobytes, and the signature is compared on
// every redraw. Kept per URL (each data row holds the same text), at most KEYS_MAX.
const KEYS_MAX = 2000;
const KEYS = new Map<string, string>();
/** The image a marker shows, as a short key ('' for the pin): a changed image or one that failed draws it again. */
export const markerImageKey = (point: MapPoint): string => {
  const url = imageShown(point);
  if (!url) return '';
  let key = KEYS.get(url);
  if (key === undefined) {
    // FNV-1a over the URL's characters.
    let h = 0x811c9dc5;
    for (let i = 0; i < url.length; i++) h = Math.imul(h ^ url.charCodeAt(i), 0x01000193);
    key = `${url.length}:${(h >>> 0).toString(36)}`;
    KEYS.set(url, key);
    const oldest = KEYS.keys().next().value;
    if (KEYS.size > KEYS_MAX && oldest !== undefined) KEYS.delete(oldest);
  }
  return key;
};

/** An image marker: the row's image centred on its spot, a ring of its status colour when it has one, a heading turning
 *  the image (the ring and selection outline stay put). A failed load is remembered and reported once. */
const imageIcon = (
  point: MapPoint,
  url: string,
  selected: boolean,
  color: string | null,
  size: MarkerSize,
  onImageError?: (url: string) => void
): Icon => {
  const box = document.createElement('span');
  box.className = 'sc-map-image';
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
  img.decoding = 'async';
  if (point.heading !== null) {
    img.setAttribute('data-heading', String(point.heading));
    img.style.transform = `rotate(${point.heading}deg)`;
  }
  img.addEventListener(
    'error',
    () => {
      FAILED.add(url);
      const oldest = FAILED.values().next().value;
      if (FAILED.size > FAILED_MAX && oldest !== undefined) FAILED.delete(oldest);
      onImageError?.(url);
    },
    { once: true }
  );
  img.src = url;
  box.appendChild(img);
  const px = IMAGE_SIZES[size];
  return L.divIcon({ className: 'sc-map-marker', html: box, iconSize: [px, px], iconAnchor: [px / 2, px / 2] });
};

/** The look of a marker beyond its row: its size and what to do when its image fails. */
export interface MarkerLook {
  size?: unknown;
  onImageError?: (url: string) => void;
}

/** A marker for a point: its image when it has one that has not failed, else its pin (sized, its icon turned to the
 *  heading). With no options set it is exactly pinIcon's pin. */
export const markerIcon = (point: MapPoint, selected: boolean, color: string | null, look: MarkerLook = {}): Icon => {
  const size = markerSizeOf(look.size);
  const url = imageShown(point);
  if (url) return imageIcon(point, url, selected, color, size, look.onImageError);
  return pinIcon(point, selected, color, { size, turn: glyphTurn(point) });
};

// How far above its spot a popup opens, per pin size (the pin's head).
const PIN_POPUP: Record<MarkerSize, number> = { small: -23, medium: -30, large: -38 };

/** The popup's offset for a marker: above the pin's head, above an image, or above a price pill. */
export const markerPopupOffset = (point: MapPoint, size: unknown): [number, number] => {
  const s = markerSizeOf(size);
  if (imageShown(point)) return [0, -(IMAGE_SIZES[s] / 2 + 2)];
  if (point.label.length > 3) return [0, -30];
  return [0, PIN_POPUP[s]];
};
