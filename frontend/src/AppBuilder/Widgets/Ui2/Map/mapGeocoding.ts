// ToolJet UI 2.0 Map: where address search and the picked spot's address lookup go (pure, as mapModel.ts): the
// geocoder URLs and the places in their answers. The client that calls them is mapLayers.geocode.
import { toLatLng } from './mapModel';
import type { MapConfig, Place } from './mapTypes';
import { isNonBlankString, toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';

// ---- Geocoding -------------------------------------------------------------------------------------------------------

// OpenStreetMap's Nominatim, used politely: searches wait for a pause in typing, at least three characters, one request
// a second at most (its usage policy), and repeated searches come from a cache (mapLayers.geocode).
export const NOMINATIM = {
  search: 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q={query}',
  reverse: 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat}&lon={lng}',
};

/** The search and reverse-lookup URL templates: the widget's own, else the install's (public config MAP_GEOCODER_URL,
 *  MAP_REVERSE_GEOCODER_URL), else Nominatim's. Only http(s) URLs with the placeholder are used. */
export const geocoderUrls = ({
  geocoderUrl,
  reverseGeocoderUrl,
  config,
}: { geocoderUrl?: unknown; reverseGeocoderUrl?: unknown; config?: unknown } = {}): {
  search: string;
  reverse: string;
} => {
  const c: MapConfig = config && typeof config === 'object' ? (config as MapConfig) : {};
  const pick = (own: unknown, installed: unknown, fallback: string, mark: string): string =>
    [own, installed]
      .map((u) => (isNonBlankString(u) ? u.trim() : ''))
      .find((u) => /^https?:\/\//i.test(u) && u.includes(mark)) || fallback;
  return {
    search: pick(geocoderUrl, c.MAP_GEOCODER_URL, NOMINATIM.search, '{query}'),
    reverse: pick(reverseGeocoderUrl, c.MAP_REVERSE_GEOCODER_URL, NOMINATIM.reverse, '{lat}'),
  };
};

export const fillUrl = (template: string, values: Record<string, unknown>): string =>
  template.replace(/\{(query|lat|lng)\}/g, (_, k) => encodeURIComponent(String(values[k] ?? '')));

/** Places from a geocoder's answer: Nominatim's ([{ lat, lon, display_name }] or one such object) or GeoJSON
 *  (Photon, Pelias: features with geometry.coordinates and properties.label or name). */
/** One answer of a geocoder, as it may come: Nominatim's ({ lat, lon, display_name }) or a GeoJSON feature (Photon,
 *  Pelias), or a collection of features. */
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

/** The longest place label kept; a longer one is shortened, ending in an ellipsis so it shows it was (a label's
 *  length had no limit). Nominatim's longest addresses are about 150 characters. */
export const PLACE_LABEL_MAX = 200;
const capLabel = (label: string): string =>
  label.length > PLACE_LABEL_MAX ? `${label.slice(0, PLACE_LABEL_MAX - 1)}…` : label;

export const parsePlaces = (response: unknown): Place[] => {
  const json = response as GeocoderItem | GeocoderItem[] | null | undefined;
  const list: (GeocoderItem | null)[] = Array.isArray(json)
    ? json
    : json && Array.isArray(json.features)
    ? json.features
    : json
    ? [json]
    : [];
  return list.slice(0, 8).flatMap((item): Place[] => {
    if (!item || typeof item !== 'object') return [];
    const coordinates = item.geometry?.coordinates;
    if (item.geometry && Array.isArray(coordinates)) {
      const at = toLatLng(coordinates[1], coordinates[0]);
      const p = item.properties || {};
      const label = toText(
        p.label ?? p.display_name ?? [p.name, p.street, p.city, p.country].filter(Boolean).join(', ')
      );
      return at && label ? [{ ...at, label: capLabel(label) }] : [];
    }
    const at = toLatLng(item.lat, item.lon ?? item.lng);
    const label = toText(item.display_name ?? item.label ?? item.name);
    return at && label ? [{ ...at, label: capLabel(label) }] : [];
  });
};
