import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { usePressHoldRef } from '../lib/pressHold';
import { Button } from 'antd';
import { AntProvider } from '../lib/AntProvider';
import { THEME_COLOR as T, useThemeColor, useThemeNumber } from '../lib/themeStyles';
import { SpinOver } from '../lib/Loading';
import {
  areaShapes,
  circleCorners,
  clampZoom,
  geocoderUrls,
  heatPoints,
  latLngOf,
  legendItems,
  mapPoints,
  markerRoutes,
  markerSizeOf,
  NOMINATIM,
  parseCenter,
  pickedValue,
  popupLines,
  round6,
  routeRows,
  statusFill,
  tileSource,
  toLatLng,
  toText,
  type LatLng,
  type MapPoint,
  type MapShape,
  type PickedLocation,
  type Place,
} from '../lib/ui2/charts/mapModel';
import {
  clusterIcon,
  drawItems,
  escapeHtml,
  geocode,
  HeatLayer,
  markerIcon,
  markerPopupOffset,
  paint,
  pickedIcon,
  pointTitle,
  popupNode,
  startIcon,
} from '../lib/ui2/charts/mapLayers';
import '../styles/leaflet.css';
import '../styles/map.css';

// Markers from rows on open raster tiles (no API key), toned by status, grouped into counts when they crowd, with route
// lines, areas, a heat layer, a popup, a selection, a picked spot with address search, and the view exposed. Ported
// from UI 2.0's ShadMap (Widgets/Ui2/Map). Leaflet is driven from effects; its handlers read the latest values via `live`.


// A move the widget makes (opening, fitting, an action) is not the user's: onBoundsChange skips the moveend it causes.
const OWN_MOVE_MS = 1500;
const FIT_MAX_ZOOM = 15;
const LABELLED_AREAS = 30;
const SEARCH_DELAY_MS = 600;
const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');

/** Whether the surface behind the map is dark (the theme's surface colour), so the default tiles are inverted. */
const darkSurface = (el: HTMLElement | null): boolean => {
  if (!el) return false;
  const c = getComputedStyle(el).backgroundColor.match(/\d+(\.\d+)?/g);
  if (!c || c.length < 3 || (c.length > 3 && Number(c[3]) === 0)) return false;
  const [r, g, b] = c.map(Number);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 110;
};

/** A point given to an action as (lat, lng), as one { lat, lng } object or as one "lat, lng" text. */
const pointArgs = (lat: unknown, lng: unknown): LatLng | null =>
  (lat && typeof lat === 'object') || (typeof lat === 'string' && lat.includes(',')) ? parseCenter(lat) : toLatLng(lat, lng);

export const Map = () => {
  const [data] = ToolJet.useStateArray({ name: 'data', label: 'Data (rows with coordinates)', initialValue: [
    {
      id: 'S-101',
      name: 'Harbor Market',
      address: '1 Ferry Building',
      status: 'Delivered',
      eta: '9:10 AM',
      driver: 'Maya Chen',
      lat: 37.7955,
      lng: -122.3937,
    },
    {
      id: 'S-102',
      name: 'Corner Bakery',
      address: '3498 18th St',
      status: 'Delivered',
      eta: '9:40 AM',
      driver: 'Maya Chen',
      lat: 37.7614,
      lng: -122.4269,
    },
    {
      id: 'S-103',
      name: 'Bayside Labs',
      address: '1700 Owens St',
      status: 'In transit',
      eta: '10:25 AM',
      driver: 'Owen Hart',
      lat: 37.7683,
      lng: -122.3934,
    },
    {
      id: 'S-104',
      name: 'Sunset Florist',
      address: '1101 Irving St',
      status: 'Delayed',
      eta: '11:05 AM',
      driver: 'Owen Hart',
      lat: 37.7641,
      lng: -122.4703,
    },
    {
      id: 'S-105',
      name: 'Wharf Seafood',
      address: '2800 Leavenworth St',
      status: 'Scheduled',
      eta: '11:30 AM',
      driver: 'Priya Nair',
      lat: 37.8063,
      lng: -122.4182,
    },
    {
      id: 'S-106',
      name: 'Union Books',
      address: '345 Stockton St',
      status: 'Pending',
      eta: '12:15 PM',
      driver: 'Leo Martins',
      lat: 37.7881,
      lng: -122.4065,
    },
  ] });
  const [latField] = ToolJet.useStateString({ name: 'latField', label: 'Latitude field', initialValue: 'lat' });
  const [lngField] = ToolJet.useStateString({ name: 'lngField', label: 'Longitude field', initialValue: 'lng' });
  const [titleField] = ToolJet.useStateString({ name: 'titleField', label: 'Title field', initialValue: 'name' });
  const [subtitleField] = ToolJet.useStateString({ name: 'subtitleField', label: 'Second line field', initialValue: 'address' });
  const [statusField] = ToolJet.useStateString({ name: 'statusField', label: 'Status field (pin colour, toned by its words)', initialValue: 'status' });
  const [statusColors] = ToolJet.useStateObject({ name: 'statusColors', label: 'Status colours ({ Open: "#2563eb" } or tone names)', initialValue: {} });
  const [idField] = ToolJet.useStateString({ name: 'idField', label: 'Id field', initialValue: 'id' });
  const [labelField] = ToolJet.useStateString({ name: 'labelField', label: 'Pin label field (a stop number, a price)', initialValue: '' });
  const [iconField] = ToolJet.useStateString({ name: 'iconField', label: 'Pin icon field (unused in the Ant pack)', initialValue: '' });
  const [markerIconName] = ToolJet.useStateString({ name: 'markerIcon', label: 'Icon for every pin (unused in the Ant pack)', initialValue: '' });
  const [headingField] = ToolJet.useStateString({ name: 'headingField', label: 'Heading field (degrees, 0 is north; turns the icon)', initialValue: '' });
  const [imageField] = ToolJet.useStateString({ name: 'imageField', label: 'Marker image field (an image URL in place of the pin)', initialValue: '' });
  const [markerSizeValue] = ToolJet.useStateEnumeration({ name: 'markerSize', label: 'Marker size', enumDefinition: ['small', 'medium', 'large'], initialValue: 'medium', inspector: 'switch' });
  const [popupFields] = ToolJet.useStateString({ name: 'popupFields', label: "Popup fields (comma list; 'eta:ETA {}', 'total|currency')", initialValue: 'eta:ETA {}, driver' });
  const [showPopup] = ToolJet.useStateBoolean({ name: 'showPopup', label: 'Show a popup on marker click', initialValue: true });
  const [showLegend] = ToolJet.useStateBoolean({ name: 'showLegend', label: 'Show a legend of the colours', initialValue: true });
  const [clusterMarkers] = ToolJet.useStateBoolean({ name: 'clusterMarkers', label: 'Group nearby markers', initialValue: true });
  const [connectMarkers] = ToolJet.useStateBoolean({ name: 'connectMarkers', label: 'Connect the markers as routes', initialValue: false });
  const [routeField] = ToolJet.useStateString({ name: 'routeField', label: 'Route field (one line per value)', initialValue: '' });
  const [routeOrderField] = ToolJet.useStateString({ name: 'routeOrderField', label: 'Route order field', initialValue: '' });
  const [routeStart] = ToolJet.useStateString({ name: 'routeStart', label: 'Routes start at ({ lat, lng })', initialValue: '' });
  const [routes] = ToolJet.useStateArray({ name: 'routes', label: 'Route lines (rows with a path)', initialValue: [] });
  const [routeColors] = ToolJet.useStateObject({ name: 'routeColors', label: 'Route colours ({ "Van 1": "#4f46e5" })', initialValue: {} });
  const [areas] = ToolJet.useStateArray({ name: 'areas', label: 'Areas (zones, territories, geofences)', initialValue: [] });
  const [areaShapeField] = ToolJet.useStateString({ name: 'areaShapeField', label: 'Area outline field', initialValue: 'outline' });
  const [areaTitleField] = ToolJet.useStateString({ name: 'areaTitleField', label: 'Area title field', initialValue: 'name' });
  const [areaStatusField] = ToolJet.useStateString({ name: 'areaStatusField', label: 'Area status field (fill colour)', initialValue: 'status' });
  const [areaRadiusField] = ToolJet.useStateString({ name: 'areaRadiusField', label: 'Area radius field (metres, with lat and lng)', initialValue: 'radius' });
  const [displayValue] = ToolJet.useStateEnumeration({ name: 'display', label: 'Show', enumDefinition: ['markers', 'heat', 'both'], initialValue: 'markers', inspector: 'switch' });
  const [heatField] = ToolJet.useStateString({ name: 'heatField', label: 'Heat weight field (empty: each row counts once)', initialValue: '' });
  const [heatRadiusValue] = ToolJet.useStateNumber({ name: 'heatRadius', label: 'Heat radius (px)', initialValue: 28 });
  const [pickLocation] = ToolJet.useStateBoolean({ name: 'pickLocation', label: 'Let the user pick a location', initialValue: false });
  const [defaultPickedLocation] = ToolJet.useStateString({ name: 'defaultPickedLocation', label: 'Picked location to start with ({ lat, lng })', initialValue: '' });
  const [showSearch] = ToolJet.useStateBoolean({ name: 'showSearch', label: 'Show an address search box', initialValue: false });
  const [searchPlaceholder] = ToolJet.useStateString({ name: 'searchPlaceholder', label: 'Search placeholder', initialValue: 'Search for an address' });
  const [geocoderUrl] = ToolJet.useStateString({ name: 'geocoderUrl', label: 'Geocoder URL ({query}; empty for OpenStreetMap Nominatim)', initialValue: '' });
  const [reverseGeocoderUrl] = ToolJet.useStateString({ name: 'reverseGeocoderUrl', label: 'Reverse geocoder URL ({lat}, {lng})', initialValue: '' });
  const [fitToMarkers] = ToolJet.useStateBoolean({ name: 'fitToMarkers', label: 'Fit the view to what is drawn', initialValue: true });
  const [defaultCenter] = ToolJet.useStateString({ name: 'defaultCenter', label: 'Default center ({ lat, lng })', initialValue: '' });
  const [defaultZoom] = ToolJet.useStateNumber({ name: 'defaultZoom', label: 'Default zoom (1 to 18)', initialValue: 12 });
  const [mapStyle, setMapStyle] = ToolJet.useStateEnumeration({
    name: 'mapStyle',
    label: 'Map style',
    enumDefinition: ['streets', 'satellite', 'light', 'dark'],
    enumLabels: { streets: 'Streets', satellite: 'Satellite', light: 'Light', dark: 'Dark' },
    initialValue: 'streets',
    inspector: 'switch',
  });
  const [showStyleSwitch] = ToolJet.useStateBoolean({ name: 'showStyleSwitch', label: 'Show a Map | Satellite switch', initialValue: false });
  const [showFullscreen] = ToolJet.useStateBoolean({ name: 'showFullscreen', label: 'Show a fullscreen button', initialValue: true });
  const [scrollWheelZoom] = ToolJet.useStateBoolean({ name: 'scrollWheelZoom', label: 'Zoom with the mouse wheel', initialValue: false });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty text', initialValue: 'No locations to show' });
  const [tileUrl] = ToolJet.useStateString({ name: 'tileUrl', label: 'Tile URL (empty for the default basemap)', initialValue: '' });
  const [tileAttribution] = ToolJet.useStateString({ name: 'tileAttribution', label: 'Tile attribution', initialValue: '' });
  const [, setSelectedMarker] = ToolJet.useStateObject({ name: 'selectedMarker', initialValue: {}, inspector: 'hidden' });
  const [, setSelectedMarkerId] = ToolJet.useStateString({ name: 'selectedMarkerId', initialValue: '', inspector: 'hidden' });
  const [, setSelectedShape] = ToolJet.useStateObject({ name: 'selectedShape', initialValue: {}, inspector: 'hidden' });
  const [, setSelectedShapeType] = ToolJet.useStateString({ name: 'selectedShapeType', initialValue: '', inspector: 'hidden' });
  const [, setClickedLocation] = ToolJet.useStateObject({ name: 'clickedLocation', initialValue: {}, inspector: 'hidden' });
  const [, setPickedLocation] = ToolJet.useStateObject({ name: 'pickedLocation', initialValue: {}, inspector: 'hidden' });
  const [, setCenter] = ToolJet.useStateObject({ name: 'center', initialValue: {}, inspector: 'hidden' });
  const [, setZoom] = ToolJet.useStateNumber({ name: 'zoom', initialValue: 12, inspector: 'hidden' });
  const [, setBounds] = ToolJet.useStateObject({ name: 'bounds', initialValue: {}, inspector: 'hidden' });
  const onMarkerClick = ToolJet.useEventCallback({ name: 'onMarkerClick' });
  const onMapClicked = ToolJet.useEventCallback({ name: 'onMapClicked' });
  const onShapeClicked = ToolJet.useEventCallback({ name: 'onShapeClicked' });
  const onLocationPicked = ToolJet.useEventCallback({ name: 'onLocationPicked' });
  const onBoundsChange = ToolJet.useEventCallback({ name: 'onBoundsChange' });
  const backgroundColor = useThemeColor('backgroundColor', 'Background (behind the tiles)', T.surfaceMuted);
  const borderColor = useThemeColor('borderColor', 'Border color', T.borderWeak);
  const accent = useThemeColor('accentColor', 'Accent (pins without a status, the selection)', T.brand);
  const clusterColor = useThemeColor('clusterColor', 'Group count color', T.text);
  const radius = useThemeNumber('borderRadius', 'Radius', 'Theme radius + 4 (10 in stock Ant)');
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 42 });

  const frameRef = useRef<HTMLDivElement | null>(null);
  const frameHoldRef = usePressHoldRef(frameRef);
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);
  const shapeLayer = useRef<L.LayerGroup | null>(null);
  const drawn = useRef(new globalThis.Map<string, { marker: L.Marker; sig: string }>());
  const popup = useRef<L.Popup | null>(null);
  const pickedMarker = useRef<L.Marker | null>(null);
  const heatLayer = useRef<HeatLayer | null>(null);
  const ownMoveAt = useRef(0);
  const closing = useRef(false);
  const lookup = useRef<AbortController | null>(null);
  // The widget can mount at 0x0 (editor layout, hidden tab); a fit done then zooms to the maximum, so it is redone
  // once the map first gets a real size.
  const fitPending = useRef(false);

  // ---- The data drawn ----
  const dataKey = JSON.stringify([data, latField, lngField, titleField, subtitleField, statusField, idField, labelField, iconField, headingField, imageField, markerIconName]);
  const { points, skipped } = useMemo(
    () => mapPoints(data, { latField, lngField, titleField, subtitleField, statusField, idField, labelField, iconField, headingField, imageField, markerIcon: markerIconName }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataKey]
  );
  const routesKey = JSON.stringify([dataKey, connectMarkers, routeField, routeOrderField, routeStart, routes, routeColors, statusColors]);
  const lines = useMemo(
    () => [
      ...(connectMarkers ? markerRoutes(points, { routeField, routeOrderField, routeStart, routeColors }) : []),
      ...routeRows(routes, { routeColors, statusColors }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routesKey]
  );
  const areasKey = JSON.stringify([areas, areaShapeField, areaTitleField, areaStatusField, areaRadiusField, statusColors]);
  const zones = useMemo(
    () => areaShapes(areas, { areaShapeField, areaTitleField, areaStatusField, areaRadiusField }, statusColors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [areasKey]
  );
  const extent = useMemo(
    () => [...lines.flatMap((r) => r.path), ...zones.flatMap((a) => (a.kind === 'circle' ? circleCorners(a.center, a.radius) : a.path))],
    [lines, zones]
  );
  const display = displayValue === 'heat' || displayValue === 'both' ? displayValue : 'markers';
  const showMarkers = display !== 'heat';
  const heat = useMemo(() => heatPoints(points, heatField), [points, heatField]);
  const heatRadius = Math.max(8, Math.min(120, Number(heatRadiusValue) || 28));
  const markerSize = markerSizeOf(markerSizeValue);
  const colorOfPoint = (pt: MapPoint) => statusFill(pt.status, pt.tone, statusColors);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [shape, setShape] = useState<MapShape | null>(null);
  const [picked, setPicked] = useState<PickedLocation | null>(() => (pickLocation ? parseCenter(defaultPickedLocation) : null));
  const [wheelHint, setWheelHint] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dark, setDark] = useState(false);
  const selected = selectedKey === null ? null : points.find((pt) => pt.key === selectedKey) || null;
  const geocoder = geocoderUrls({ geocoderUrl, reverseGeocoderUrl });
  // Nominatim's usage policy forbids searching as you type against its public service: with it a search runs on Enter.
  const typeAhead = geocoder.search !== NOMINATIM.search;
  const source = tileSource({ tileUrl, tileAttribution, darkMode: dark, mapStyle });

  // Everything Leaflet's handlers read, always current.
  const now = { points, lines, zones, extent, selected, shape, picked, pickLocation, showPopup, showMarkers, clusterMarkers, popupFields, markerSize, scrollWheelZoom, fitToMarkers, defaultCenter, defaultZoom, connectMarkers, routeStart, geocoder, colorOfPoint };
  const live = useRef(now);
  live.current = now;
  const handlers = { onMarkerClick, onMapClicked, onShapeClicked, onLocationPicked, onBoundsChange, setSelectedMarker, setSelectedMarkerId, setSelectedShape, setSelectedShapeType, setClickedLocation, setPickedLocation, setCenter, setZoom, setBounds };
  const events = useRef(handlers);
  events.current = handlers;

  // ---- Drawing: functions over refs and `live`, kept in a ref so Leaflet's handlers call the current ones ----
  const ownMove = (move: () => void) => {
    ownMoveAt.current = Date.now();
    move();
  };
  const hasSize = (m: L.Map | null) => {
    const s = m?.getSize();
    return !!s && s.x > 40 && s.y > 40;
  };
  const report = (m: L.Map) => {
    const e = events.current;
    e.setCenter({ ...latLngOf(m.getCenter()) });
    e.setZoom(m.getZoom());
    const b = m.getBounds();
    // UI 2.0's northEast / southWest, and the pack's earlier north / south / east / west.
    e.setBounds({
      northEast: latLngOf(b.getNorthEast()),
      southWest: latLngOf(b.getSouthWest()),
      north: round6(b.getNorth()),
      south: round6(b.getSouth()),
      east: round6(b.getEast()),
      west: round6(b.getWest()),
    });
  };
  const fit = (animate = false) => {
    const m = map.current;
    if (!m) return;
    if (!hasSize(m)) {
      fitPending.current = true;
      return;
    }
    const { points: pts, extent: ext, fitToMarkers: fitOn, defaultCenter: dc, defaultZoom: dz } = live.current;
    const all = [...pts, ...ext].map((p) => [p.lat, p.lng] as L.LatLngTuple);
    const center = parseCenter(dc);
    ownMove(() => {
      if (fitOn !== false && all.length) m.fitBounds(L.latLngBounds(all), { padding: [48, 48], maxZoom: FIT_MAX_ZOOM, animate });
      else if (center) m.setView([center.lat, center.lng], clampZoom(dz, 12), { animate });
      else if (all.length) m.setView(L.latLngBounds(all).getCenter(), clampZoom(dz, 12), { animate });
      else m.setView([20, 0], 2, { animate });
    });
  };
  const closePopup = () => {
    const m = map.current;
    if (!m || !popup.current || !m.hasLayer(popup.current)) return;
    closing.current = true;
    m.closePopup(popup.current);
    closing.current = false;
  };
  const openPopup = (point: MapPoint | null) => {
    const m = map.current;
    if (!m) return;
    if (!point || !live.current.showPopup) {
      closePopup();
      return;
    }
    if (!popup.current) popup.current = L.popup({ className: 'ui-map-pop', minWidth: 180, maxWidth: 280, closeButton: true, autoPanPadding: [24, 24] });
    const p = popup.current;
    p.options.offset = markerPopupOffset(point, live.current.markerSize);
    p.setLatLng([point.lat, point.lng]).setContent(popupNode(point, popupLines(point.row, live.current.popupFields), live.current.colorOfPoint(point)));
    if (!m.hasLayer(p)) p.openOn(m);
  };
  const drawMarkers = () => {
    const m = map.current;
    const layer = markerLayer.current;
    if (!m || !layer) return;
    const { points: pts, selected: sel, showMarkers: on, clusterMarkers: grouped, markerSize: size, colorOfPoint: colorFor } = live.current;
    const items = on ? drawItems(m, pts, grouped !== false) : [];
    const seen = new Set<string>();
    items.forEach((item) => {
      seen.add(item.key);
      const isSel = 'point' in item && sel?.key === item.key;
      const color = 'point' in item ? colorFor(item.point) : null;
      const sig =
        'point' in item
          ? `${item.point.lat},${item.point.lng}|${item.point.tone}|${color}|${item.point.label}|${item.point.icon}|${pointTitle(item.point)}|${isSel}|${size}|${item.point.heading}|${item.point.image}`
          : `c${item.cluster.count}@${item.lat},${item.lng}`;
      const existing = drawn.current.get(item.key);
      if (existing && existing.sig === sig) return;
      if (existing) layer.removeLayer(existing.marker);
      let marker: L.Marker;
      if ('point' in item) {
        const key = item.key;
        marker = L.marker([item.point.lat, item.point.lng], {
          icon: markerIcon(item.point, isSel, color, size, () => fns.current.drawMarkers()),
          title: pointTitle(item.point),
          riseOnHover: true,
          zIndexOffset: isSel ? 1000 : 0,
        });
        marker.on('click', () => fns.current.clickPoint(key));
      } else {
        const members = item.cluster.members.map((p) => [p.lat, p.lng] as L.LatLngTuple);
        marker = L.marker([item.lat, item.lng], { icon: clusterIcon(item.cluster.count), title: `${item.cluster.count} locations`, riseOnHover: true, zIndexOffset: 500 });
        // The user asked for this move: onBoundsChange fires for it.
        marker.on('click', () => m.fitBounds(L.latLngBounds(members), { padding: [48, 48], maxZoom: 18 }));
      }
      layer.addLayer(marker);
      drawn.current.set(item.key, { marker, sig });
    });
    drawn.current.forEach((entry, key) => {
      if (seen.has(key)) return;
      layer.removeLayer(entry.marker);
      drawn.current.delete(key);
    });
  };
  const drawShapes = () => {
    const m = map.current;
    const group = shapeLayer.current;
    if (!m || !group) return;
    group.clearLayers();
    const { lines: ls, zones: zs, shape: current } = live.current;
    const named = zs.length <= LABELLED_AREAS;
    zs.forEach((a) => {
      const common = { className: 'ui-map-area', weight: 1.5, bubblingMouseEvents: false };
      const layer = a.kind === 'circle' ? L.circle([a.center.lat, a.center.lng], { ...common, radius: a.radius }) : L.polygon(a.path.map((pt) => [pt.lat, pt.lng] as L.LatLngTuple), common);
      layer.on('click', () => fns.current.clickShape({ type: 'area', key: a.key, row: a.row }));
      if (a.title) layer.bindTooltip(escapeHtml(a.title), { permanent: named, direction: 'center', className: 'ui-map-area-label', sticky: !named });
      group.addLayer(layer);
      paint(layer, a.color, current?.key === a.key);
    });
    ls.forEach((r) => {
      const at = r.path.map((pt): L.LatLngTuple => [pt.lat, pt.lng]);
      group.addLayer(L.polyline(at, { className: 'ui-map-route-casing', weight: 8, interactive: false }));
      const line = L.polyline(at, { className: 'ui-map-route', weight: 4, bubblingMouseEvents: false, lineCap: 'round', lineJoin: 'round' });
      line.on('click', () => fns.current.clickShape({ type: 'route', key: r.key, row: r.row }));
      line.bindTooltip(escapeHtml(r.name), { sticky: true, className: 'ui-map-route-label' });
      group.addLayer(line);
      paint(line, r.color, current?.key === r.key);
    });
    const start = live.current.connectMarkers ? parseCenter(live.current.routeStart) : null;
    if (start && ls.length) group.addLayer(L.marker([start.lat, start.lng], { icon: startIcon(), title: 'Start', interactive: false, zIndexOffset: -100 }));
  };
  const select = (point: MapPoint | null) => {
    setSelectedKey(point ? point.key : null);
    live.current.selected = point;
    events.current.setSelectedMarker(point ? point.row : {});
    events.current.setSelectedMarkerId(point && point.id !== null ? String(point.id) : '');
    drawMarkers();
    openPopup(point);
  };
  const clickPoint = (key: string) => {
    const point = live.current.points.find((pt) => pt.key === key);
    if (!point) return;
    select(point);
    events.current.onMarkerClick();
  };
  const setShapeSelection = (s: MapShape | null) => {
    setShape(s);
    live.current.shape = s;
    events.current.setSelectedShape(s ? s.row : {});
    events.current.setSelectedShapeType(s ? s.type : '');
  };
  const clickShape = (s: MapShape) => {
    setShapeSelection(s);
    drawShapes();
    events.current.onShapeClicked();
  };
  // The address lookup of the current pick: each pick, clear or new lookup stops the one before.
  const lookUpAddress = (at: LatLng) => {
    lookup.current?.abort();
    if (typeof fetch !== 'function') return;
    const mine = new AbortController();
    lookup.current = mine;
    geocode(live.current.geocoder.reverse, { lat: at.lat, lng: at.lng }, mine.signal)
      .then((places) => {
        const label = places?.[0]?.label;
        const cur = live.current.picked;
        if (lookup.current !== mine || !label || !cur || cur.lat !== at.lat || cur.lng !== at.lng) return;
        const next = { ...cur, address: label };
        setPicked(next);
        live.current.picked = next;
        events.current.setPickedLocation(pickedValue(next));
      })
      .catch(() => {});
  };
  const drawPicked = () => {
    const m = map.current;
    if (!m) return;
    const at = live.current.pickLocation ? live.current.picked : null;
    if (!at) {
      pickedMarker.current?.remove();
      pickedMarker.current = null;
      return;
    }
    if (!pickedMarker.current) {
      pickedMarker.current = L.marker([at.lat, at.lng], { icon: pickedIcon(), draggable: true, title: 'Picked location', zIndexOffset: 2000, keyboard: false });
      pickedMarker.current.on('dragend', (e) => fns.current.pick((e.target as L.Marker).getLatLng()));
      pickedMarker.current.addTo(m);
    } else pickedMarker.current.setLatLng([at.lat, at.lng]);
  };
  /** Places (or clears) the picked pin, exposes it and, unless quiet, fires onLocationPicked; then looks up its address. */
  const pick = (at: LatLng | null, { quiet = false, address }: { quiet?: boolean; address?: string } = {}) => {
    const next: PickedLocation | null = at ? { lat: round6(at.lat), lng: round6(at.lng), ...(address ? { address } : {}) } : null;
    setPicked(next);
    live.current.picked = next;
    events.current.setPickedLocation(pickedValue(next));
    drawPicked();
    if (!quiet && next) events.current.onLocationPicked();
    if (next && !address) lookUpAddress(next);
    else lookup.current?.abort();
  };
  const drawing = { drawMarkers, drawShapes, clickPoint, clickShape, pick, fit, report, select, drawPicked, closePopup, openPopup, setShapeSelection, lookUpAddress };
  const fns = useRef(drawing);
  fns.current = drawing;

  // ---- Create the map once ----
  useEffect(() => {
    const host = el.current;
    if (!host) return undefined;
    const m = L.map(host, { minZoom: 1, maxZoom: 18, zoomSnap: 0.5, zoomControl: false, worldCopyJump: true, fadeAnimation: false, scrollWheelZoom: false }).setView([20, 0], 2);
    map.current = m;
    L.control.zoom({ position: 'topright', zoomInTitle: 'Zoom in', zoomOutTitle: 'Zoom out' }).addTo(m);
    m.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">Leaflet</a>');
    shapeLayer.current = L.layerGroup().addTo(m);
    markerLayer.current = L.layerGroup().addTo(m);
    m.on('moveend', () => {
      fns.current.report(m);
      fns.current.drawMarkers();
      const own = Date.now() - ownMoveAt.current < OWN_MOVE_MS;
      ownMoveAt.current = 0;
      if (!own) events.current.onBoundsChange();
    });
    m.on('click', (e: L.LeafletMouseEvent) => {
      const at = latLngOf(e.latlng);
      events.current.setClickedLocation({ ...at });
      setSelectedKey(null);
      live.current.selected = null;
      events.current.setSelectedMarker({});
      events.current.setSelectedMarkerId('');
      const hadShape = !!live.current.shape;
      fns.current.setShapeSelection(null);
      fns.current.drawMarkers();
      if (hadShape) fns.current.drawShapes();
      if (live.current.pickLocation) fns.current.pick(at);
      events.current.onMapClicked();
    });
    // The popup's close button (or Escape) ends the selection, as a click on the map does.
    m.on('popupclose', (e: L.PopupEvent) => {
      if (closing.current || e.popup !== popup.current || !live.current.selected) return;
      setSelectedKey(null);
      live.current.selected = null;
      events.current.setSelectedMarker({});
      events.current.setSelectedMarkerId('');
      fns.current.drawMarkers();
    });
    // With wheel zoom off the page scrolls past the map; Ctrl or Cmd with the wheel still zooms it, and a plain wheel
    // shows how.
    let hintTimer: ReturnType<typeof setTimeout> | undefined;
    const onWheel = (e: WheelEvent) => {
      if (live.current.scrollWheelZoom) return;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        m.setZoomAround(m.mouseEventToContainerPoint(e), clampZoom(m.getZoom() + (e.deltaY < 0 ? 1 : -1), m.getZoom()));
        return;
      }
      setWheelHint(true);
      clearTimeout(hintTimer);
      hintTimer = setTimeout(() => setWheelHint(false), 1400);
    };
    host.addEventListener('wheel', onWheel, { passive: false });
    // The widget box can resize after mount (and while hidden in tabs); keep Leaflet's size in sync.
    const ro = new ResizeObserver(() => {
      ownMove(() => m.invalidateSize({ pan: false }));
      if (fitPending.current && hasSize(m)) {
        fitPending.current = false;
        fns.current.fit();
      }
    });
    ro.observe(host);
    setDark(darkSurface(frameRef.current));
    fns.current.drawShapes();
    fns.current.fit();
    fns.current.drawMarkers();
    fns.current.drawPicked();
    fns.current.report(m);
    const opening = live.current.picked;
    if (live.current.pickLocation && opening) {
      events.current.setPickedLocation(pickedValue(opening));
      fns.current.lookUpAddress(opening);
    }
    return () => {
      clearTimeout(hintTimer);
      host.removeEventListener('wheel', onWheel);
      ro.disconnect();
      lookup.current?.abort();
      m.off();
      m.remove();
      map.current = null;
      markerLayer.current = null;
      shapeLayer.current = null;
      popup.current = null;
      pickedMarker.current = null;
      heatLayer.current = null;
      drawn.current = new globalThis.Map();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Tiles follow the style, the theme and the tile properties ----
  useEffect(() => {
    const m = map.current;
    if (!m) return undefined;
    const options: L.TileLayerOptions = { subdomains: 'abc', maxZoom: 19, crossOrigin: true, referrerPolicy: 'strict-origin' };
    const layers = [
      L.tileLayer(source.url, { ...options, attribution: source.attribution }),
      ...(source.labels ? [L.tileLayer(source.labels, { ...options, className: 'ui-map-labels' })] : []),
    ];
    layers.forEach((layer) => layer.addTo(m));
    return () => layers.forEach((layer) => m.hasLayer(layer) && m.removeLayer(layer));
  }, [source.url, source.attribution, source.labels]);

  // ---- The view follows what is drawn when it changes ----
  const viewKey = JSON.stringify([dataKey, routesKey, areasKey, fitToMarkers, defaultCenter, defaultZoom]);
  const shownView = useRef(viewKey);
  useEffect(() => {
    if (shownView.current === viewKey) return;
    shownView.current = viewKey;
    fns.current.fit();
  }, [viewKey]);

  // ---- Markers redraw when their data, grouping, colours or the selection change ----
  const look = JSON.stringify([statusColors, clusterMarkers, showMarkers, markerSize]);
  useEffect(() => {
    fns.current.drawMarkers();
    if (selectedKey !== null && !selected) {
      // The selected row left the data: nothing is selected now.
      setSelectedKey(null);
      fns.current.closePopup();
    }
  }, [points, selected, selectedKey, look]);

  useEffect(() => fns.current.drawShapes(), [lines, zones, connectMarkers, routeStart]);

  useEffect(() => {
    const cur = live.current.selected;
    if (!showPopup) fns.current.closePopup();
    else if (cur && popup.current && map.current?.hasLayer(popup.current)) fns.current.openPopup(cur);
  }, [showPopup, popupFields]);

  // ---- Heat ----
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (display === 'markers') {
      if (heatLayer.current) m.removeLayer(heatLayer.current);
      heatLayer.current = null;
      return;
    }
    if (!heatLayer.current) {
      heatLayer.current = new HeatLayer(heat, heatRadius);
      heatLayer.current.addTo(m);
    } else heatLayer.current.setData(heat, heatRadius);
  }, [display, heat, heatRadius]);

  // ---- The picked location follows its properties ----
  const pickedKey = JSON.stringify([pickLocation, defaultPickedLocation]);
  const firstPick = useRef(true);
  useEffect(() => {
    if (firstPick.current) {
      firstPick.current = false;
      return;
    }
    const start = pickLocation ? parseCenter(defaultPickedLocation) : null;
    setPicked(start);
    live.current.picked = start;
    events.current.setPickedLocation(pickedValue(start));
    fns.current.drawPicked();
    if (start) fns.current.lookUpAddress(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedKey]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (scrollWheelZoom) m.scrollWheelZoom.enable();
    else m.scrollWheelZoom.disable();
  }, [scrollWheelZoom]);

  // ---- Full screen: the browser's when it allows it, else the map fills the window ----
  useEffect(() => {
    const timer = setTimeout(() => map.current && ownMove(() => map.current?.invalidateSize({ pan: false })), 0);
    if (!expanded) return () => clearTimeout(timer);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setExpanded(false);
    const onChange = () => !document.fullscreenElement && setExpanded(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);
  const toggleFullscreen = () => {
    if (expanded) {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      setExpanded(false);
      return;
    }
    setExpanded(true);
    frameRef.current?.requestFullscreen?.().catch(() => {});
  };

  // ---- Address search ----
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<{ query: string; places: Place[] }>({ query: '', places: [] });
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState({ query: '', message: '' });
  const [submitted, setSubmitted] = useState({ query: '', attempt: 0 });
  const chosen = useRef('');
  const results = found.query === query.trim() ? found.places : [];
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3 || query === chosen.current || (!typeAhead && submitted.query !== q)) {
      setFound({ query: '', places: [] });
      setSearching(false);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(
      () => {
        setSearching(true);
        geocode(geocoder.search, { query: q }, controller.signal)
          .then((places) => {
            if (!places) return;
            setFound({ query: q, places });
            setSearchError({ query: q, message: places.length ? '' : 'No places found' });
          })
          .catch(() => setSearchError({ query: q, message: 'Search is unavailable right now' }))
          .finally(() => setSearching(false));
      },
      typeAhead ? SEARCH_DELAY_MS : 0
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, submitted, typeAhead, geocoder.search]);
  const choosePlace = (place: Place) => {
    const m = map.current;
    setFound({ query: '', places: [] });
    chosen.current = place.label;
    setQuery(place.label);
    if (m) ownMove(() => m.setView([place.lat, place.lng], Math.max(m.getZoom(), 16)));
    if (live.current.pickLocation) pick(place, { address: place.label });
  };

  // ---- Actions ----
  ToolJet.useAction(
    {
      name: 'setCenter',
      displayName: 'Set center',
      params: [
        { handle: 'lat', displayName: 'Latitude', defaultValue: '{{37.7749}}' },
        { handle: 'lng', displayName: 'Longitude', defaultValue: '{{-122.4194}}' },
        { handle: 'zoom', displayName: 'Zoom (optional)', defaultValue: '' },
      ],
    },
    (lat, lng, zoom) => {
      const m = map.current;
      const at = pointArgs(lat, lng);
      if (!m || !at) return;
      // One point given as text or an object takes its zoom from the second argument.
      const a = lat as unknown;
      const z = (a && typeof a === 'object') || (typeof a === 'string' && a.includes(',')) ? lng : zoom;
      ownMove(() => m.setView([at.lat, at.lng], clampZoom(z, m.getZoom())));
    }
  );
  ToolJet.useAction({ name: 'setZoom', displayName: 'Set zoom', params: [{ handle: 'zoom', displayName: 'Zoom', defaultValue: '{{14}}' }] }, (z) => {
    const m = map.current;
    if (m) ownMove(() => m.setZoom(clampZoom(z, m.getZoom())));
  });
  ToolJet.useAction({ name: 'fitBounds', displayName: 'Fit to markers' }, () => fns.current.fit(true));
  ToolJet.useAction({ name: 'selectMarker', displayName: 'Select marker', params: [{ handle: 'id', displayName: 'Marker id', defaultValue: '' }] }, (id) => {
    const raw = id as unknown;
    if (raw === undefined || raw === null || typeof raw === 'object') return;
    const want = String(raw);
    const pts = live.current.points;
    const point = pts.find((pt) => pt.id !== null && String(pt.id) === want) || pts.find((pt) => pt.key === want);
    if (!point) return;
    const m = map.current;
    if (m) {
      // Bring it into view, close enough that it stands alone rather than in a group.
      const zoom = live.current.clusterMarkers !== false ? Math.max(m.getZoom(), 17) : m.getZoom();
      if (!m.getBounds().contains([point.lat, point.lng]) || zoom !== m.getZoom()) ownMove(() => m.setView([point.lat, point.lng], zoom));
    }
    fns.current.select(point);
  });
  ToolJet.useAction({ name: 'clearSelection', displayName: 'Clear selection' }, () => {
    fns.current.select(null);
    if (live.current.shape) {
      fns.current.setShapeSelection(null);
      fns.current.drawShapes();
    }
  });
  ToolJet.useAction(
    {
      name: 'setPickedLocation',
      displayName: 'Set picked location',
      params: [
        { handle: 'lat', displayName: 'Latitude', defaultValue: '{{37.7749}}' },
        { handle: 'lng', displayName: 'Longitude', defaultValue: '{{-122.4194}}' },
      ],
    },
    (lat, lng) => {
      const at = pointArgs(lat, lng);
      if (at) fns.current.pick(at, { quiet: true });
    }
  );
  ToolJet.useAction({ name: 'clearPickedLocation', displayName: 'Clear picked location' }, () => fns.current.pick(null, { quiet: true }));
  ToolJet.useAction(
    { name: 'setMapStyle', displayName: 'Set map style', params: [{ handle: 'style', displayName: 'Style (streets or satellite)', defaultValue: 'satellite' }] },
    (s) => {
      if (s === 'streets' || s === 'satellite' || s === 'light' || s === 'dark') setMapStyle(s);
    }
  );

  // ---- Overlays ----
  const empty = !points.length && !lines.length && !zones.length && !(pickLocation && picked);
  const legend = showLegend !== false && showMarkers ? legendItems({ points, routes: lines, areas: zones, statusColors }) : null;
  const legendShown = !!legend && (legend.statuses.length + legend.routes.length + legend.areas.length > 1 || legend.routes.length === 1);
  const swatch = (color: string | null, kind: string) => (
    <span className={`ui-map-legend-swatch is-${kind}`} style={color ? ({ '--swatch': color } as React.CSSProperties) : undefined} />
  );
  const vars: Record<string, string> = {};
  if (backgroundColor) vars['--lk-bg'] = backgroundColor;
  if (borderColor) vars['--lk-border'] = borderColor;
  if (accent) vars['--lk-accent'] = accent;
  if (clusterColor) vars['--lk-cluster'] = clusterColor;
  if (radius !== '' && radius !== null && radius !== undefined && Number.isFinite(Number(radius))) vars['--lk-radius'] = `${Number(radius)}px`;
  const { loading } = ToolJet.useControlState();
  const satelliteOn = mapStyle === 'satellite';

  return (
    <AntProvider fill>
    <SpinOver loading={loading} as="fill">
      <div
        ref={frameHoldRef}
        className="tj-ant ui-map"
        data-expanded={expanded || undefined}
        data-picking={pickLocation || undefined}
        data-display={display}
        data-dark={dark || undefined}
        style={{ ...(accent ? { '--tj-ant-color-primary': accent } : {}), ...vars } as React.CSSProperties}
      >
        <div ref={el} className="ui-map-canvas" data-basemap={source.basemap || undefined} data-style={mapStyle} />
        {showSearch ? (
          <div className="ui-map-search" role="search">
            <input
              type="search"
              value={query}
              placeholder={toText(searchPlaceholder) || 'Search for an address'}
              aria-label={toText(searchPlaceholder) || 'Search for an address'}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  if (results[0]) choosePlace(results[0]);
                  else if (!typeAhead) setSubmitted((s) => ({ query: query.trim(), attempt: s.attempt + 1 }));
                }
                if (e.key === 'Escape') setFound({ query: '', places: [] });
              }}
            />
            {searching ? <span className="ui-map-search-spin" aria-hidden="true" /> : null}
            {results.length ? (
              <ul className="ui-map-search-results" role="listbox">
                {results.map((r, i) => (
                  <li key={`${r.lat},${r.lng},${i}`} role="option" aria-selected={false}>
                    <button type="button" onClick={() => choosePlace(r)}>
                      {r.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : searchError.message && searchError.query === query.trim() && !searching ? (
              <div className="ui-map-search-note">{searchError.message}</div>
            ) : !typeAhead && query.trim().length >= 3 && submitted.query !== query.trim() && query !== chosen.current ? (
              <div className="ui-map-search-note">Press Enter to search</div>
            ) : null}
          </div>
        ) : null}
        {showFullscreen !== false ? (
          <div className="ui-map-tools">
            <button type="button" className="ui-map-tool" onClick={toggleFullscreen} aria-label={expanded ? 'Exit full screen' : 'Full screen'} title={expanded ? 'Exit full screen' : 'Full screen'}>
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                <path
                  d={expanded ? 'M8 3v5H3M21 8h-5V3M3 16h5v5M16 21v-5h5' : 'M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5'}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ) : null}
        {showStyleSwitch ? (
          <div className="ui-map-style-switch" role="radiogroup" aria-label="Map style">
            {(['streets', 'satellite'] as const).map((s) => {
              const on = (s === 'satellite') === satelliteOn;
              return (
                <button key={s} type="button" role="radio" aria-checked={on} data-active={on || undefined} onClick={() => setMapStyle(s)}>
                  {s === 'streets' ? 'Map' : 'Satellite'}
                </button>
              );
            })}
          </div>
        ) : null}
        <div className="ui-map-corner">
          {legendShown && legend ? (
            <div className="ui-map-legend" aria-label="Legend">
              {legend.statuses.map((s) => (
                <span key={`s:${s.label}`} className="ui-map-legend-item">
                  {swatch(s.color, 'pin')}
                  {s.label}
                  <span className="ui-map-legend-count">{s.count}</span>
                </span>
              ))}
              {legend.routes.map((r) => (
                <span key={`r:${r.label}`} className="ui-map-legend-item">
                  {swatch(r.color, 'line')}
                  {r.label}
                </span>
              ))}
              {legend.areas.map((a) => (
                <span key={`a:${a.label}`} className="ui-map-legend-item">
                  {swatch(a.color, 'area')}
                  {a.label}
                </span>
              ))}
            </div>
          ) : null}
          {skipped > 0 ? (
            <div className="ui-map-note" title="Rows need a latitude from -90 to 90 and a longitude from -180 to 180">
              {`${skipped.toLocaleString()} ${skipped === 1 ? 'row' : 'rows'} not shown: no valid coordinates`}
            </div>
          ) : null}
        </div>
        {pickLocation && !picked ? <div className="ui-map-pick-hint">Click the map to place the pin</div> : null}
        {wheelHint ? (
          <div className="ui-map-wheel-hint" role="note">
            {`Hold ${isMac() ? '⌘' : 'Ctrl'} and scroll to zoom the map`}
          </div>
        ) : null}
        {empty ? (
          <div className="ui-map-empty" role="note">
            <span>{toText(emptyText) || 'No locations to show'}</span>
          </div>
        ) : null}
      </div>
    </SpinOver>
    </AntProvider>
  );
};
