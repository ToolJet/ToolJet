import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import Supercluster from 'supercluster';
import DOMPurify from 'dompurify';
import 'leaflet/dist/leaflet.css';
import { Shell, busy } from './Shadcn';
import { Spinner } from './loadingLook';
import { useHasEvent } from './parity';
import { useExposed } from '../packHooks';
import { stringify } from '../packJson';
import {
  areaShapes,
  clampZoom,
  fitView,
  geocoderUrls,
  heatPoints,
  initialView,
  legendItems,
  mapPoints,
  markerRoutes,
  parseCenter,
  popupLines,
  routeRows,
  statusFill,
  tileSource,
  toLatLng,
  viewBounds,
  viewKey,
} from './mapModel';
import { HeatLayer, geocode, iconSvg, loadIcons } from './mapLayers';
import './shadcn.scss';

export { withControlState } from '../packHooks';

// ToolJet UI 2.0 Map: markers from rows on open raster tiles (Leaflet, no API key), toned by status, grouped into
// counts when they crowd (supercluster), with route lines, areas, a heat layer, a popup, a selection, a picked spot
// with address search, and the view exposed. Config in WidgetManager/shadcnSource.map.js, logic in mapModel.js, the
// heat layer, icons and geocoder in mapLayers.js, style variables in looks/map.js, look in shadcn.scss (.sc-map).
// Leaflet is driven imperatively from effects: the map and its layers live in refs, and every handler reads the latest
// properties through `live`.

// Groups gather the pins within 72px of each other: wide enough that the counts do not overlap one another; price
// pills, about as wide as that, group from further apart.
const CLUSTER = { radius: 72, maxZoom: 16, minPoints: 3 };
const PILL_CLUSTER_RADIUS = 110;
// A move the widget makes (opening, fitting, an action) is not the user's: onBoundsChange skips the moveend it causes.
const OWN_MOVE_MS = 1500;
// Area names are drawn on the map for up to this many areas; more show their name on hover.
const LABELLED_AREAS = 30;
const SEARCH_DELAY_MS = 600;

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const round6 = (n) => Math.round(n * 1e6) / 1e6;
const latLngOf = (ll) => ({ lat: round6(ll.lat), lng: round6(ll.lng) });
const text = (v) => (v === null || v === undefined || typeof v === 'object' ? '' : String(v));
const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');

const PIN_BODY = '<path class="sc-map-pin-body" d="M14 35s11-11.3 11-21.2A11 11 0 0 0 3 13.8C3 23.7 14 35 14 35z"/>';
const PIN_DOT = '<circle class="sc-map-pin-dot" cx="14" cy="13.8" r="4.4"/>';

/** A pin: the teardrop with a dot, a short label (a stop number) or an icon in it; a longer label is a pill (a price)
 *  with a pointer. Colours arrive as the --pin variable, so the pack's !important rules colour it. */
const pinIcon = (point, selected, color) => {
  const style = color ? ` style="--pin:${color}"` : '';
  const attrs = `data-marker="${escapeHtml(point.key)}"${point.tone ? ` data-tone="${point.tone}"` : ''}${
    point.icon ? ` data-icon="${escapeHtml(point.icon)}"` : ''
  }${selected ? ' data-selected="true"' : ''}${style}`;
  const glyph = point.icon ? iconSvg(point.icon) : '';
  if (point.label && point.label.length > 3) {
    const width = Math.round(18 + point.label.length * 7.2 + (glyph ? 16 : 0));
    return L.divIcon({
      className: 'sc-map-marker',
      html: `<span class="sc-map-pill" ${attrs}>${
        glyph ? `<span class="sc-map-pill-icon">${glyph}</span>` : ''
      }${escapeHtml(point.label)}</span>`,
      iconSize: [width, 26],
      iconAnchor: [width / 2, 32],
    });
  }
  const inner = point.label
    ? `<span class="sc-map-pin-label">${escapeHtml(point.label)}</span>`
    : glyph
    ? `<span class="sc-map-pin-glyph">${glyph}</span>`
    : '';
  return L.divIcon({
    className: 'sc-map-marker',
    html: `<span class="sc-map-pin" ${attrs}><svg viewBox="0 0 28 36" width="28" height="36" aria-hidden="true">${PIN_BODY}${
      inner ? '' : PIN_DOT
    }</svg>${inner}</span>`,
    iconSize: [28, 36],
    iconAnchor: [14, 35],
  });
};

const clusterSize = (count) => (count < 10 ? 30 : count < 100 ? 34 : count < 1000 ? 40 : 46);
const clusterIcon = (cluster) => {
  const size = clusterSize(cluster.count);
  const label = cluster.count >= 10000 ? `${Math.round(cluster.count / 1000)}k` : String(cluster.count);
  return L.divIcon({
    className: 'sc-map-marker',
    html: `<span class="sc-map-cluster" data-cluster="${cluster.id}" style="width:${size}px;height:${size}px">${label}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};
const startIcon = () =>
  L.divIcon({
    className: 'sc-map-marker',
    html: '<span class="sc-map-start" data-route-start=""></span>',
    iconSize: [16, 16],
  });
const pickedIcon = () =>
  L.divIcon({
    className: 'sc-map-marker',
    html: `<span class="sc-map-picked" data-picked=""><svg viewBox="0 0 28 36" width="30" height="38" aria-hidden="true">${PIN_BODY}${PIN_DOT}</svg></span>`,
    iconSize: [30, 38],
    iconAnchor: [15, 37],
  });

const pointTitle = (p) => [p.title, p.subtitle, p.statusLabel].filter(Boolean).join(' · ') || 'Location';

/** The popup's content: the title and its status chip, the second line, then the popup fields, one a line. Built as
 *  DOM with text nodes, so row values never become markup. */
const popupNode = (point, lines, color) => {
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

const hasSize = (map) => {
  const size = map?.getSize?.();
  return !!size && size.x > 0 && size.y > 0;
};

/** Points that bound a circle (its box corners), so fitting the view takes it in. */
const circleCorners = (c, radius) => {
  const dLat = radius / 111320;
  const dLng = radius / (111320 * Math.max(0.05, Math.cos((c.lat * Math.PI) / 180)));
  return [
    { lat: Math.max(-85, c.lat - dLat), lng: Math.max(-180, c.lng - dLng) },
    { lat: Math.min(85, c.lat + dLat), lng: Math.min(180, c.lng + dLng) },
  ];
};

/** Sets a path's colour as a CSS variable (an SVG attribute cannot hold var()), once it is in the DOM. */
const paint = (layer, color, selected) => {
  const el = layer.getElement?.();
  if (!el) return;
  if (color) el.style.setProperty('--shape', color);
  else el.style.removeProperty('--shape');
  if (selected) el.setAttribute('data-selected', 'true');
  else el.removeAttribute('data-selected');
};

export const ShadMap = (props) => {
  const { properties: p, setExposedVariables, fireEvent, id, darkMode } = props;
  const frameRef = useRef(null);
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const shapeLayerRef = useRef(null);
  const markersRef = useRef(new Map()); // key -> { marker, sig }
  const popupRef = useRef(null);
  const pickedRef = useRef(null);
  const heatRef = useRef(null);
  const ownMoveRef = useRef(0);
  const closingRef = useRef(false);

  const fields = {
    latField: p.latField,
    lngField: p.lngField,
    titleField: p.titleField,
    subtitleField: p.subtitleField,
    statusField: p.statusField,
    idField: p.idField,
    labelField: p.labelField,
    iconField: p.iconField,
  };
  const dataKey = stringify(p.data ?? null);
  const { points, skipped } = useMemo(
    () => mapPoints(p.data, fields),
    [dataKey, stringify(fields)] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const statusColorsKey = stringify(p.statusColors ?? null);
  const routeColorsKey = stringify(p.routeColors ?? null);
  const routes = useMemo(
    () => [
      ...(p.connectMarkers === true
        ? markerRoutes(points, {
            routeField: p.routeField,
            routeOrderField: p.routeOrderField,
            routeStart: p.routeStart,
            routeColors: p.routeColors,
          })
        : []),
      ...routeRows(p.routes, { routeColors: p.routeColors, statusColors: p.statusColors }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      points,
      p.connectMarkers,
      p.routeField,
      p.routeOrderField,
      stringify(p.routeStart ?? null),
      stringify(p.routes ?? null),
      routeColorsKey,
      statusColorsKey,
    ]
  );
  const routeStart = p.connectMarkers === true ? parseCenter(p.routeStart) : null;
  const areas = useMemo(
    () =>
      areaShapes(
        p.areas,
        {
          areaShapeField: p.areaShapeField,
          areaTitleField: p.areaTitleField,
          areaStatusField: p.areaStatusField,
          areaRadiusField: p.areaRadiusField,
        },
        p.statusColors
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      stringify(p.areas ?? null),
      p.areaShapeField,
      p.areaTitleField,
      p.areaStatusField,
      p.areaRadiusField,
      statusColorsKey,
    ]
  );
  const shapeExtent = useMemo(
    () => [
      ...routes.flatMap((r) => r.path),
      ...areas.flatMap((a) => (a.kind === 'circle' ? circleCorners(a.center, a.radius) : a.path)),
    ],
    [routes, areas]
  );
  const display = ['heat', 'both'].includes(p.display) ? p.display : 'markers';
  const showMarkers = display !== 'heat';
  const cluster = p.clusterMarkers !== false;
  const index = useMemo(() => {
    if (!cluster || points.length < CLUSTER.minPoints) return null;
    const pills = points.some((pt) => pt.label.length > 3);
    const sc = new Supercluster(pills ? { ...CLUSTER, radius: PILL_CLUSTER_RADIUS } : CLUSTER);
    sc.load(
      points.map((pt, i) => ({
        type: 'Feature',
        properties: { i },
        geometry: { type: 'Point', coordinates: [pt.lng, pt.lat] },
      }))
    );
    return sc;
  }, [points, cluster]);
  const heat = useMemo(() => heatPoints(points, p.heatField), [points, p.heatField]);
  const heatRadius = Math.max(8, Math.min(120, Number(p.heatRadius) || 28));
  const colorOfPoint = (pt) => statusFill(pt.status, pt.tone, p.statusColors);

  // Icons for the pins load once, the first time a map names one; the pins draw again when they arrive.
  const [iconsReady, setIconsReady] = useState(0);
  const iconNames = useMemo(() => [...new Set(points.map((pt) => pt.icon).filter(Boolean))], [points]);
  useEffect(() => {
    if (!iconNames.length) return undefined;
    let alive = true;
    loadIcons(iconNames).then((loaded) => alive && loaded && setIconsReady((n) => n + 1));
    return () => {
      alive = false;
    };
  }, [iconNames.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  // The box the map fills: the measured one in a browser, the widget's own size until it is measured (and in tests).
  const [size, setSize] = useState({ w: 0, h: 0 });
  const box = size.w > 0 && size.h > 0 ? size : { w: Number(props.width) || 600, h: Number(props.height) || 420 };
  const frameHeight = Math.max(120, Number(props.height) || 420);

  const target = useMemo(
    () =>
      initialView({
        points,
        extra: shapeExtent,
        fitToMarkers: p.fitToMarkers,
        defaultCenter: p.defaultCenter,
        defaultZoom: p.defaultZoom,
        width: box.w,
        height: box.h,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points, shapeExtent, p.fitToMarkers, stringify(p.defaultCenter ?? null), p.defaultZoom, box.w, box.h]
  );

  const [view, setView] = useState(() => ({
    center: target.center,
    zoom: target.zoom,
    bounds: viewBounds(target.center, target.zoom, box.w, box.h),
  }));
  const [selectedKey, setSelectedKey] = useState(null);
  const [shape, setShape] = useState(null); // { type: 'route' | 'area', key, row }
  const [clicked, setClicked] = useState({});
  const pickLocation = p.pickLocation === true;
  const [picked, setPicked] = useState(() => (pickLocation ? parseCenter(p.defaultPickedLocation) || null : null));
  const [style, setStyle] = useState(p.mapStyle === 'satellite' ? 'satellite' : 'streets');
  useEffect(() => setStyle(p.mapStyle === 'satellite' ? 'satellite' : 'streets'), [p.mapStyle]);
  const [expanded, setExpanded] = useState(false);
  const [wheelHint, setWheelHint] = useState(false);
  const selected = selectedKey === null ? null : points.find((pt) => pt.key === selectedKey) || null;
  const disabled = busy(p);
  const showPopup = p.showPopup !== false;
  const hasMarkerClick = useHasEvent(id, 'onMarkerClick');

  const config = typeof window !== 'undefined' ? window.public_config : undefined;
  const source = useMemo(
    () =>
      tileSource({
        tileUrl: p.tileUrl,
        tileAttribution: p.tileAttribution,
        darkMode: !!darkMode,
        config,
        mapStyle: style,
      }),
    [p.tileUrl, p.tileAttribution, darkMode, style] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const geocoder = geocoderUrls({ geocoderUrl: p.geocoderUrl, reverseGeocoderUrl: p.reverseGeocoderUrl, config });

  // Everything Leaflet's handlers read, always current.
  const live = useRef({});
  live.current = {
    points,
    routes,
    areas,
    index,
    selected,
    shape,
    picked,
    disabled,
    showPopup,
    showMarkers,
    pickLocation,
    geocoder,
    box,
    p,
    fireEvent,
    setExposedVariables,
    hasMarkerClick,
    colorOfPoint,
    extent: shapeExtent,
  };

  const viewOf = (map) => {
    const center = latLngOf(map.getCenter());
    const zoom = map.getZoom();
    if (hasSize(map)) {
      const b = map.getBounds();
      return {
        center,
        zoom,
        bounds: { northEast: latLngOf(b.getNorthEast()), southWest: latLngOf(b.getSouthWest()) },
      };
    }
    return { center, zoom, bounds: viewBounds(center, zoom, live.current.box.w, live.current.box.h) };
  };

  /** Runs a move the widget makes, so its moveend does not count as the user's. */
  const ownMove = (move) => {
    ownMoveRef.current = Date.now();
    move();
  };
  /** Tells Leaflet the box changed size; only a real change counts as the widget's move (it ends in a moveend). */
  const resize = (map) => {
    const host = hostRef.current;
    const was = map.getSize();
    if (!host || (host.clientWidth === was.x && host.clientHeight === was.y)) return;
    ownMove(() => map.invalidateSize({ pan: false }));
  };
  const goTo = (center, zoom, animate = false) => {
    const map = mapRef.current;
    if (!map || !center) return;
    ownMove(() =>
      map.setView([center.lat, center.lng], clampZoom(zoom, map.getZoom()), { animate: animate && hasSize(map) })
    );
  };

  const selection = (point) => ({
    selectedMarker: point ? point.row : {},
    selectedMarkerId: point ? point.id ?? null : null,
  });
  const shapeSelection = (s) => ({
    selectedShape: s ? s.row : {},
    selectedShapeType: s ? s.type : null,
  });
  const pickedValue = (at) => (at ? { lat: at.lat, lng: at.lng, ...(at.address ? { address: at.address } : {}) } : {});

  // ---- Popup ----
  const closePopup = () => {
    const map = mapRef.current;
    if (!map || !popupRef.current || !map.hasLayer(popupRef.current)) return;
    closingRef.current = true;
    map.closePopup(popupRef.current);
    closingRef.current = false;
  };
  const openPopup = (point) => {
    const map = mapRef.current;
    if (!map) return;
    if (!point || !live.current.showPopup) {
      closePopup();
      return;
    }
    if (!popupRef.current) {
      popupRef.current = L.popup({
        className: 'sc-map-popup',
        offset: [0, -30],
        minWidth: 180,
        maxWidth: 280,
        closeButton: true,
        autoPanPadding: [24, 24],
      });
    }
    const popup = popupRef.current;
    popup.options.autoPan = hasSize(map);
    popup
      .setLatLng([point.lat, point.lng])
      .setContent(
        popupNode(point, popupLines(point.row, live.current.p.popupFields), live.current.colorOfPoint(point))
      );
    if (!map.hasLayer(popup)) popup.openOn(map);
  };

  // ---- Markers ----
  /** Draws the markers (or groups) in and around the view, reusing the ones already drawn. */
  const draw = () => {
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!map || !layer) return;
    const {
      points: pts,
      index: idx,
      selected: sel,
      disabled: off,
      showMarkers: on,
      colorOfPoint: colorFor,
    } = live.current;
    const zoom = Math.round(map.getZoom());
    let bbox = [-180, -85, 180, 85];
    if (hasSize(map)) {
      const b = map.getBounds().pad(0.5);
      bbox = [
        Math.max(-180, b.getWest()),
        Math.max(-85, b.getSouth()),
        Math.min(180, b.getEast()),
        Math.min(85, b.getNorth()),
      ];
      // A view across the antimeridian or wider than the world: everything.
      if (b.getEast() - b.getWest() >= 360) bbox = [-180, -85, 180, 85];
    }
    const inBox = (pt) => pt.lng >= bbox[0] && pt.lng <= bbox[2] && pt.lat >= bbox[1] && pt.lat <= bbox[3];
    const items = !on
      ? []
      : idx
      ? idx.getClusters(bbox, zoom).map((f) =>
          f.properties.cluster
            ? {
                key: `cluster:${f.properties.cluster_id}`,
                cluster: { id: f.properties.cluster_id, count: f.properties.point_count },
                lat: f.geometry.coordinates[1],
                lng: f.geometry.coordinates[0],
              }
            : { key: pts[f.properties.i].key, point: pts[f.properties.i] }
        )
      : pts.filter(inBox).map((pt) => ({ key: pt.key, point: pt }));
    const seen = new Set();
    const drawn = markersRef.current;
    items.forEach((item) => {
      seen.add(item.key);
      const isSelected = !!item.point && sel?.key === item.key;
      const color = item.point ? colorFor(item.point) : null;
      const glyph = item.point?.icon ? iconSvg(item.point.icon).length : 0;
      const sig = item.cluster
        ? `c${item.cluster.count}@${item.lat},${item.lng}|${off}`
        : `${item.point.lat},${item.point.lng}|${item.point.tone}|${color}|${item.point.label}|${
            item.point.icon
          }:${glyph}|${pointTitle(item.point)}|${isSelected}|${off}`;
      const existing = drawn.get(item.key);
      if (existing && existing.sig === sig) return;
      if (existing) layer.removeLayer(existing.marker);
      const at = item.cluster ? [item.lat, item.lng] : [item.point.lat, item.point.lng];
      const marker = L.marker(at, {
        icon: item.cluster ? clusterIcon(item.cluster) : pinIcon(item.point, isSelected, color),
        title: item.cluster ? `${item.cluster.count} locations` : pointTitle(item.point),
        keyboard: !off,
        interactive: !off,
        riseOnHover: true,
        zIndexOffset: isSelected ? 1000 : item.cluster ? 500 : 0,
      });
      if (item.cluster) marker.on('click', () => zoomIntoCluster(item));
      else marker.on('click', () => clickPoint(item.key));
      layer.addLayer(marker);
      drawn.set(item.key, { marker, sig });
    });
    drawn.forEach((entry, key) => {
      if (seen.has(key)) return;
      layer.removeLayer(entry.marker);
      drawn.delete(key);
    });
  };

  // ---- Routes and areas ----
  /** Draws the route lines (with a light casing, so they read on any tiles), the routes' start and the areas. */
  const drawShapes = () => {
    const map = mapRef.current;
    const group = shapeLayerRef.current;
    if (!map || !group) return;
    group.clearLayers();
    // Lines and areas need SVG (every browser has it; jsdom does not): without it they are only in the shape list.
    if (!L.Browser.svg) return;
    const { routes: lines, areas: zones, shape: current, disabled: off } = live.current;
    const named = zones.length <= LABELLED_AREAS;
    zones.forEach((a) => {
      const common = { className: 'sc-map-area', weight: 1.5, interactive: !off, bubblingMouseEvents: false };
      const layer =
        a.kind === 'circle'
          ? L.circle([a.center.lat, a.center.lng], { ...common, radius: a.radius })
          : L.polygon(
              a.path.map((pt) => [pt.lat, pt.lng]),
              common
            );
      layer.on('click', () => clickShape({ type: 'area', key: a.key, row: a.row }));
      if (a.title) {
        layer.bindTooltip(escapeHtml(a.title), {
          permanent: named,
          direction: 'center',
          className: 'sc-map-area-label',
          sticky: !named,
        });
      }
      group.addLayer(layer);
      paint(layer, a.color, current?.key === a.key);
      layer.getElement?.()?.setAttribute('data-area', a.key);
    });
    lines.forEach((r) => {
      const at = r.path.map((pt) => [pt.lat, pt.lng]);
      group.addLayer(L.polyline(at, { className: 'sc-map-route-casing', weight: 8, interactive: false }));
      const line = L.polyline(at, {
        className: 'sc-map-route',
        weight: 4,
        interactive: !off,
        bubblingMouseEvents: false,
        lineCap: 'round',
        lineJoin: 'round',
      });
      line.on('click', () => clickShape({ type: 'route', key: r.key, row: r.row }));
      line.bindTooltip(escapeHtml(r.name), { sticky: true, className: 'sc-map-route-label' });
      group.addLayer(line);
      paint(line, r.color, current?.key === r.key);
      line.getElement?.()?.setAttribute('data-route', r.key);
    });
    const start = live.current.p.connectMarkers === true ? parseCenter(live.current.p.routeStart) : null;
    if (start && lines.length) {
      group.addLayer(
        L.marker([start.lat, start.lng], { icon: startIcon(), title: 'Start', interactive: false, zIndexOffset: -100 })
      );
    }
  };

  const zoomIntoCluster = (item) => {
    const map = mapRef.current;
    const idx = live.current.index;
    if (!map || !idx || live.current.disabled) return;
    let zoom = map.getZoom() + 2;
    try {
      zoom = idx.getClusterExpansionZoom(item.cluster.id);
    } catch {
      // A cluster from an index rebuilt since it was drawn: zoom in a little instead.
    }
    // The user asked for this move: onBoundsChange fires for it.
    map.setView([item.lat, item.lng], clampZoom(zoom, map.getZoom()), { animate: hasSize(map) });
  };

  const select = (point) => {
    setSelectedKey(point ? point.key : null);
    live.current.selected = point;
    live.current.setExposedVariables(selection(point));
    draw();
    openPopup(point);
  };

  const clickPoint = (key) => {
    if (live.current.disabled) return;
    const point = live.current.points.find((pt) => pt.key === key);
    if (!point) return;
    select(point);
    live.current.fireEvent('onMarkerClick');
  };

  const clickShape = (s) => {
    if (live.current.disabled) return;
    setShape(s);
    live.current.shape = s;
    live.current.setExposedVariables(shapeSelection(s));
    drawShapes();
    live.current.fireEvent('onShapeClick');
  };

  // ---- The picked location ----
  /** Places (or clears) the picked pin, exposes it and, unless quiet, fires onLocationPick; then looks up its address. */
  const pick = (at, { quiet = false, address } = {}) => {
    const next = at ? { lat: round6(at.lat), lng: round6(at.lng), ...(address ? { address } : {}) } : null;
    setPicked(next);
    live.current.picked = next;
    live.current.setExposedVariables({ pickedLocation: pickedValue(next) });
    drawPicked();
    if (!quiet && next) live.current.fireEvent('onLocationPick');
    if (next && !address) lookUpAddress(next);
  };
  const lookUpAddress = (at) => {
    if (typeof fetch !== 'function') return;
    geocode(live.current.geocoder.reverse, { lat: at.lat, lng: at.lng })
      .then((places) => {
        const label = places?.[0]?.label;
        const now = live.current.picked;
        if (!label || !now || now.lat !== at.lat || now.lng !== at.lng) return;
        const next = { ...now, address: label };
        setPicked(next);
        live.current.picked = next;
        live.current.setExposedVariables({ pickedLocation: pickedValue(next) });
      })
      .catch(() => {});
  };
  const drawPicked = () => {
    const map = mapRef.current;
    if (!map) return;
    const at = live.current.pickLocation ? live.current.picked : null;
    if (!at) {
      if (pickedRef.current) {
        map.removeLayer(pickedRef.current);
        pickedRef.current = null;
      }
      return;
    }
    if (!pickedRef.current) {
      pickedRef.current = L.marker([at.lat, at.lng], {
        icon: pickedIcon(),
        draggable: !live.current.disabled,
        title: 'Picked location',
        zIndexOffset: 2000,
        keyboard: false,
      });
      pickedRef.current.on('dragend', (e) => pick(e.target.getLatLng()));
      pickedRef.current.addTo(map);
    } else {
      pickedRef.current.setLatLng([at.lat, at.lng]);
    }
  };

  // ---- Actions (read `live`, so a call made after a data change sees the new markers) ----
  const pointArgs = (lat, lng) =>
    lat && typeof lat === 'object'
      ? parseCenter(lat)
      : typeof lat === 'string' && lat.includes(',')
      ? parseCenter(lat)
      : toLatLng(lat, lng);
  const actions = useMemo(
    () => ({
      setCenter: async (lat, lng, zoom) => {
        const at = pointArgs(lat, lng);
        if (!at) return;
        const z = (lat && typeof lat === 'object') || typeof lat === 'string' ? lng : zoom;
        goTo(at, z === undefined || z === null || z === '' ? undefined : z, true);
      },
      setZoom: async (zoom) => {
        const map = mapRef.current;
        const z = clampZoom(zoom, null);
        if (!map || z === null) return;
        ownMove(() => map.setZoom(z, { animate: hasSize(map) }));
      },
      fitBounds: async () => {
        const { points: pts, box: b, p: props_, extent } = live.current;
        const all = [...pts, ...extent];
        const next = all.length
          ? fitView(all, b.w, b.h)
          : initialView({
              points: pts,
              fitToMarkers: false,
              defaultCenter: props_.defaultCenter,
              defaultZoom: props_.defaultZoom,
            });
        if (next) goTo(next.center, next.zoom, true);
      },
      selectMarker: async (markerId) => {
        if (markerId === undefined || markerId === null || typeof markerId === 'object') return;
        const want = String(markerId);
        const pts = live.current.points;
        const point = pts.find((pt) => pt.id !== null && String(pt.id) === want) || pts.find((pt) => pt.key === want);
        if (!point) return;
        // Bring it into view: out of the view, centre on it; inside a group, zoom until it stands alone.
        const map = mapRef.current;
        if (map) {
          let zoom = map.getZoom();
          const idx = live.current.index;
          if (idx) {
            const z = Math.round(zoom);
            const near = idx.getClusters([point.lng - 1e-6, point.lat - 1e-6, point.lng + 1e-6, point.lat + 1e-6], z);
            const group = near.find((f) => f.properties.cluster);
            if (group) {
              try {
                zoom = Math.max(zoom, idx.getClusterExpansionZoom(group.properties.cluster_id));
              } catch {
                zoom = Math.min(18, zoom + 2);
              }
            }
          }
          const inside = hasSize(map) && map.getBounds().contains([point.lat, point.lng]);
          if (!inside || zoom !== map.getZoom()) goTo(point, zoom, true);
        }
        select(point);
      },
      clearSelection: async () => {
        select(null);
        if (live.current.shape) {
          setShape(null);
          live.current.shape = null;
          live.current.setExposedVariables(shapeSelection(null));
          drawShapes();
        }
      },
      setPickedLocation: async (lat, lng) => {
        const at = pointArgs(lat, lng);
        if (at) pick(at, { quiet: true });
      },
      clearPickedLocation: async () => pick(null, { quiet: true }),
      setMapStyle: async (next) => {
        if (next !== 'streets' && next !== 'satellite') return;
        setStyle(next);
        live.current.setExposedVariables({ mapStyle: next });
      },
    }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useExposed(setExposedVariables, p, {
    ...selection(selected),
    ...shapeSelection(shape),
    clickedLocation: clicked,
    pickedLocation: pickedValue(pickLocation ? picked : null),
    mapStyle: style,
    center: view.center,
    zoom: view.zoom,
    bounds: view.bounds,
    ...actions,
  });

  // ---- The map: made once, removed on unmount ----
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const map = L.map(host, {
      center: [target.center.lat, target.center.lng],
      zoom: target.zoom,
      minZoom: 1,
      maxZoom: 18,
      zoomSnap: 0.5,
      zoomControl: false,
      worldCopyJump: true,
      fadeAnimation: false,
      scrollWheelZoom: false,
    });
    mapRef.current = map;
    L.control.zoom({ position: 'topright', zoomInTitle: 'Zoom in', zoomOutTitle: 'Zoom out' }).addTo(map);
    map.attributionControl.setPrefix(
      '<a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">Leaflet</a>'
    );
    shapeLayerRef.current = L.layerGroup().addTo(map);
    markerLayerRef.current = L.layerGroup().addTo(map);

    map.on('moveend', () => {
      const next = viewOf(map);
      setView(next);
      draw();
      const own = Date.now() - ownMoveRef.current < OWN_MOVE_MS;
      ownMoveRef.current = 0;
      if (own) return;
      live.current.setExposedVariables(next);
      live.current.fireEvent('onBoundsChange');
    });
    map.on('click', (e) => {
      if (live.current.disabled) return;
      const at = latLngOf(e.latlng);
      setClicked(at);
      setSelectedKey(null);
      live.current.selected = null;
      const hadShape = !!live.current.shape;
      setShape(null);
      live.current.shape = null;
      live.current.setExposedVariables({ clickedLocation: at, ...selection(null), ...shapeSelection(null) });
      draw();
      if (hadShape) drawShapes();
      if (live.current.pickLocation) pick(at);
      live.current.fireEvent('onMapClick');
    });
    // The popup's close button (or Escape) ends the selection, as a click on the map does.
    map.on('popupclose', (e) => {
      if (closingRef.current || e.popup !== popupRef.current || !live.current.selected) return;
      setSelectedKey(null);
      live.current.selected = null;
      live.current.setExposedVariables(selection(null));
      draw();
    });

    // With wheel zoom off the page scrolls past the map; Ctrl or Cmd with the wheel still zooms it, and a plain wheel
    // shows how.
    let hintTimer;
    const onWheel = (e) => {
      if (live.current.p.scrollWheelZoom === true || live.current.disabled) return;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const step = e.deltaY < 0 ? 1 : -1;
        map.setZoomAround(map.mouseEventToContainerPoint(e), clampZoom(map.getZoom() + step, map.getZoom()));
        return;
      }
      setWheelHint(true);
      clearTimeout(hintTimer);
      hintTimer = setTimeout(() => setWheelHint(false), 1400);
    };
    host.addEventListener('wheel', onWheel, { passive: false });

    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        const w = host.clientWidth;
        const h = host.clientHeight;
        if (!w || !h) return;
        resize(map);
        setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
      });
      observer.observe(host);
    }
    drawShapes();
    draw();
    drawPicked();
    // The view as the map holds it (it snaps the zoom to the steps the browser can draw).
    setView(viewOf(map));
    return () => {
      clearTimeout(hintTimer);
      host.removeEventListener('wheel', onWheel);
      observer?.disconnect();
      map.off();
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      shapeLayerRef.current = null;
      popupRef.current = null;
      pickedRef.current = null;
      heatRef.current = null;
      markersRef.current = new Map();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Tiles: the source follows the theme, the style and the tile properties ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    const layers = [
      L.tileLayer(source.url, {
        attribution: DOMPurify.sanitize(source.attribution || '', { ALLOWED_TAGS: ['a', 'span', 'b', 'strong'] }),
        subdomains: 'abc',
        maxZoom: 19,
        crossOrigin: true,
      }),
      ...(source.labels
        ? [L.tileLayer(source.labels, { maxZoom: 19, crossOrigin: true, className: 'sc-map-labels' })]
        : []),
    ];
    layers.forEach((layer) => layer.addTo(map));
    return () => {
      // Removed before its listeners go: the attribution control drops the layer's credit on its 'remove' event.
      layers.forEach((layer) => {
        if (mapRef.current) map.removeLayer(layer);
        layer.off();
      });
    };
  }, [source.url, source.attribution, source.labels]);

  // ---- The view follows the markers (or the default center) when they change ----
  const targetKey = viewKey(target);
  const shownTarget = useRef(targetKey);
  useEffect(() => {
    if (shownTarget.current === targetKey) return;
    shownTarget.current = targetKey;
    goTo(target.center, target.zoom);
  }, [targetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Markers redraw when their data, grouping, colours or the selection change ----
  useEffect(() => {
    draw();
    if (selectedKey !== null && !selected) {
      // The selected row left the data: nothing is selected now.
      setSelectedKey(null);
      closePopup();
    } else if (selected && popupRef.current && mapRef.current?.hasLayer(popupRef.current)) {
      openPopup(selected);
    }
  }, [points, index, selected, disabled, showMarkers, statusColorsKey, iconsReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    drawShapes();
  }, [routes, areas, disabled, routeStart?.lat, routeStart?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!showPopup) closePopup();
    else if (selected) openPopup(selected);
  }, [showPopup, p.popupFields]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Heat ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (display === 'markers') {
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
  }, [display, heat, heatRadius]);

  // ---- The picked location follows its properties ----
  const defaultPickKey = stringify(p.defaultPickedLocation ?? null);
  const firstPick = useRef(true);
  useEffect(() => {
    if (firstPick.current) {
      firstPick.current = false;
      drawPicked();
      if (pickLocation && picked && !picked.address) lookUpAddress(picked);
      return;
    }
    const start = pickLocation ? parseCenter(p.defaultPickedLocation) : null;
    setPicked(start);
    live.current.picked = start;
    drawPicked();
    if (start) lookUpAddress(start);
  }, [pickLocation, defaultPickKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Interaction follows the disabled and loading states, and the wheel setting ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    ['dragging', 'touchZoom', 'doubleClickZoom', 'boxZoom', 'keyboard'].forEach((handler) =>
      disabled ? map[handler]?.disable() : map[handler]?.enable()
    );
    if (!disabled && p.scrollWheelZoom === true) map.scrollWheelZoom.enable();
    else map.scrollWheelZoom.disable();
    if (pickedRef.current?.dragging) {
      if (disabled) pickedRef.current.dragging.disable();
      else pickedRef.current.dragging.enable();
    }
  }, [disabled, p.scrollWheelZoom]);

  // ---- Fullscreen: the browser's when it allows it, else the map fills the window ----
  useEffect(() => {
    const map = mapRef.current;
    if (map) setTimeout(() => mapRef.current && resize(mapRef.current), 0);
    if (!expanded) return undefined;
    const onKey = (e) => e.key === 'Escape' && setExpanded(false);
    const onChange = () => !document.fullscreenElement && setExpanded(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onChange);
    };
  }, [expanded]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggleFullscreen = () => {
    const frame = frameRef.current;
    if (expanded) {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      setExpanded(false);
      return;
    }
    setExpanded(true);
    frame?.requestFullscreen?.().catch(() => {});
  };

  // ---- Address search ----
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  // The label of the place just chosen fills the box; it is not searched for again.
  const chosenRef = useRef('');
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3 || typeof fetch !== 'function' || query === chosenRef.current) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => {
      setSearching(true);
      geocode(live.current.geocoder.search, { query: q }, controller?.signal)
        .then((places) => {
          if (places) {
            setResults(places);
            setSearchError(places.length ? '' : 'No places found');
          }
        })
        .catch(() => setSearchError('Search is unavailable right now'))
        .finally(() => setSearching(false));
    }, SEARCH_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller?.abort();
    };
  }, [query]);
  const choosePlace = (place) => {
    const map = mapRef.current;
    setResults([]);
    setSearchError('');
    chosenRef.current = place.label;
    setQuery(place.label);
    if (map) map.setView([place.lat, place.lng], Math.max(map.getZoom(), 16), { animate: hasSize(map) });
    if (live.current.pickLocation) pick(place, { address: place.label });
  };

  // ---- Overlays ----
  const empty = !p.loadingState && !points.length && !routes.length && !areas.length && !(pickLocation && picked);
  const emptyText = typeof p.emptyText === 'string' || typeof p.emptyText === 'number' ? String(p.emptyText) : '';
  const legend =
    p.showLegend !== false && showMarkers ? legendItems({ points, routes, areas, statusColors: p.statusColors }) : null;
  const legendShown =
    legend && (legend.statuses.length + legend.routes.length + legend.areas.length > 1 || legend.routes.length === 1);
  const swatch = (color, kind) => (
    <span
      className={`sc-map-legend-swatch${kind ? ` is-${kind}` : ''}`}
      style={color ? { '--swatch': color } : undefined}
    />
  );
  return (
    <Shell {...props}>
      <div
        ref={frameRef}
        className="sc-map"
        style={{ height: frameHeight }}
        data-disabled={disabled || undefined}
        data-clickable={hasMarkerClick || undefined}
        data-expanded={expanded || undefined}
        data-picking={pickLocation || undefined}
        data-display={display}
        data-wheel-zoom={p.scrollWheelZoom === true || undefined}
      >
        <div
          ref={hostRef}
          className="sc-map-canvas"
          data-tiles={source.url}
          data-basemap={source.basemap || undefined}
          data-style={style}
        />
        {routes.length || areas.length ? (
          // The routes and areas as a list for keyboards and screen readers (their lines on the map take no focus):
          // hidden until it holds focus, a button selects the shape as a click on it does.
          <ul className="sc-map-shapes" aria-label="Routes and areas">
            {[
              ...routes.map((r) => ({
                key: r.key,
                type: 'route',
                row: r.row,
                label: `Route ${r.name}, ${r.path.length} points${r.from ? `, from ${r.from}` : ''}`,
              })),
              ...areas.map((a) => ({
                key: a.key,
                type: 'area',
                row: a.row,
                label: `Area ${a.title || 'unnamed'}${a.status ? `, ${a.status}` : ''}`,
              })),
            ]
              .slice(0, 60)
              .map((s) => (
                <li key={s.key}>
                  <button
                    type="button"
                    data-shape={s.key}
                    aria-pressed={shape?.key === s.key}
                    disabled={disabled}
                    onClick={() => clickShape({ type: s.type, key: s.key, row: s.row })}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
          </ul>
        ) : null}
        {p.showSearch === true ? (
          <div className="sc-map-search" role="search">
            <input
              type="search"
              value={query}
              disabled={disabled}
              placeholder={text(p.searchPlaceholder) || 'Search for an address'}
              aria-label={text(p.searchPlaceholder) || 'Search for an address'}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results[0]) choosePlace(results[0]);
                if (e.key === 'Escape') setResults([]);
              }}
            />
            {searching ? <Spinner className="sc-map-search-spin h-3.5 w-3.5" /> : null}
            {results.length ? (
              <ul className="sc-map-search-results" role="listbox">
                {results.map((r, i) => (
                  <li key={`${r.lat},${r.lng},${i}`} role="option" aria-selected={false}>
                    <button type="button" onClick={() => choosePlace(r)}>
                      {r.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : searchError && query.trim().length >= 3 && !searching ? (
              <div className="sc-map-search-note">{searchError}</div>
            ) : null}
          </div>
        ) : null}
        {p.showFullscreen !== false || p.showStyleSwitch === true ? (
          <div className="sc-map-tools">
            {p.showFullscreen !== false ? (
              <button
                type="button"
                className="sc-map-tool"
                onClick={toggleFullscreen}
                aria-label={expanded ? 'Exit full screen' : 'Full screen'}
                title={expanded ? 'Exit full screen' : 'Full screen'}
                data-fullscreen=""
              >
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
            ) : null}
          </div>
        ) : null}
        {p.showStyleSwitch === true ? (
          <div className="sc-map-style-switch" role="radiogroup" aria-label="Map style">
            {['streets', 'satellite'].map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={style === s}
                data-active={style === s || undefined}
                onClick={() => actions.setMapStyle(s)}
              >
                {s === 'streets' ? 'Map' : 'Satellite'}
              </button>
            ))}
          </div>
        ) : null}
        <div className="sc-map-corner">
          {legendShown ? (
            <div className="sc-map-legend" aria-label="Legend">
              {legend.statuses.map((s) => (
                <span key={`s:${s.label}`} className="sc-map-legend-item">
                  {swatch(s.color, 'pin')}
                  {s.label}
                  <span className="sc-map-legend-count">{s.count}</span>
                </span>
              ))}
              {legend.routes.map((r) => (
                <span key={`r:${r.label}`} className="sc-map-legend-item">
                  {swatch(r.color, 'line')}
                  {r.label}
                </span>
              ))}
              {legend.areas.map((a) => (
                <span key={`a:${a.label}`} className="sc-map-legend-item">
                  {swatch(a.color, 'area')}
                  {a.label}
                </span>
              ))}
            </div>
          ) : null}
          {skipped > 0 && !p.loadingState ? (
            <div className="sc-map-note" title="Rows need a latitude from -90 to 90 and a longitude from -180 to 180">
              {`${skipped.toLocaleString()} ${skipped === 1 ? 'row' : 'rows'} not shown: no valid coordinates`}
            </div>
          ) : null}
        </div>
        {pickLocation && !picked && !disabled ? (
          <div className="sc-map-pick-hint">Click the map to place the pin</div>
        ) : null}
        {wheelHint ? (
          <div className="sc-map-wheel-hint" role="note">
            {`Hold ${isMac() ? '⌘' : 'Ctrl'} and scroll to zoom the map`}
          </div>
        ) : null}
        {empty ? (
          <div className="sc-map-empty" role="note">
            <span>{emptyText || 'No locations to show'}</span>
          </div>
        ) : null}
        {p.loadingState ? (
          <div className="sc-map-veil">
            <Spinner className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </Shell>
  );
};
