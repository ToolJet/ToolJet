// ToolJet UI 2.0 Map: the shapes its model, its drawing and its hooks share.
import type { MutableRefObject, RefObject } from 'react';
import type { LayerGroup, LeafletMap, Marker, Popup } from 'leaflet';
import type { HeatLayerInstance } from './mapLayers';
import type { MapArea, MapRoute } from './mapShapes';
import type { Cluster } from './mapIcons';
import type { MarkerIndex } from './useMapData';
import type { Resolved, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

/** A data row as bound: any fields, of any value. */
export type Row = Record<string, unknown>;

export interface LatLng {
  lat: number;
  lng: number;
}

/** A marker from a row (mapPoints). */
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
  row: Row;
  index: number;
}

/** A view: its center and zoom. */
export interface MapView {
  center: LatLng;
  zoom: number;
}

export interface ViewBounds {
  northEast: LatLng;
  southWest: LatLng;
}

/** The Map's marker field properties, as bound. */
export interface PointFields {
  latField?: unknown;
  lngField?: unknown;
  titleField?: unknown;
  subtitleField?: unknown;
  statusField?: unknown;
  idField?: unknown;
  labelField?: unknown;
  iconField?: unknown;
}

/** The tiles to draw: the base layer's URL and credit, how to tone it ('light', 'dark' or null: as drawn), and a
 *  labels layer over it (satellite). */
export interface TileSource {
  url: string;
  attribution: string;
  basemap: 'light' | 'dark' | null;
  labels?: string;
}

/** A route or an area the user selected. */
export interface MapShape {
  type: 'route' | 'area';
  key: string;
  row: Row;
}

/** The picked spot, with its address once looked up. */
export interface PickedLocation extends LatLng {
  address?: string;
}

/** Public config keys the Map reads (window.public_config). */
export type MapConfig = Record<string, unknown>;

/** A place a geocoder found. */
export interface Place extends LatLng {
  label: string;
}

/** The Leaflet map and its layers, made once and kept in the Map's refs. */
export interface MapRefs {
  hostRef: RefObject<HTMLDivElement>;
  mapRef: MutableRefObject<LeafletMap | null>;
  markerLayerRef: MutableRefObject<LayerGroup | null>;
  shapeLayerRef: MutableRefObject<LayerGroup | null>;
  /** The markers drawn, by key, with the signature they were drawn for. */
  markersRef: MutableRefObject<Map<string, { marker: Marker; sig: string }>>;
  popupRef: MutableRefObject<Popup | null>;
  pickedRef: MutableRefObject<Marker | null>;
  heatRef: MutableRefObject<HeatLayerInstance | null>;
  ownMoveRef: MutableRefObject<number>;
  closingRef: MutableRefObject<boolean>;
}

/** Everything Leaflet's handlers read, always current. */
export interface MapLive {
  points: MapPoint[];
  routes: MapRoute[];
  areas: MapArea[];
  index: MarkerIndex | null;
  selected: MapPoint | null;
  shape: MapShape | null;
  picked: PickedLocation | null;
  disabled: boolean;
  showPopup: boolean;
  showMarkers: boolean;
  pickLocation: boolean;
  geocoder: { search: string; reverse: string };
  box: { w: number; h: number };
  p: Resolved;
  fireEvent: WidgetProps['fireEvent'];
  setExposedVariables: WidgetProps['setExposedVariables'];
  hasMarkerClick: boolean;
  colorOfPoint: (pt: MapPoint) => string | null;
  extent: LatLng[];
}

/** The view the map shows, as exposed. */
export type MapViewState = {
  center: LatLng;
  zoom: number;
  bounds: ViewBounds;
};

/** A marker or a group of them, as drawn. */
export type DrawItem =
  | { key: string; cluster: Cluster; lat: number; lng: number; point?: undefined }
  | { key: string; point: MapPoint; cluster?: undefined };
