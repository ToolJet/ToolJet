import L from 'leaflet';
import { clampZoom, parseCenter, pickedValue, popupLines, selection, shapeSelection, viewBounds } from './mapModel';
import {
  clusterIcon,
  escapeHtml,
  hasSize,
  latLngOf,
  paint,
  pickedIcon,
  pinIcon,
  pointTitle,
  popupNode,
  round6,
  startIcon,
} from './mapIcons';
import { geocode, iconSvg } from './mapLayers';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { LeafletMap } from 'leaflet';

import type { Cluster } from './mapIcons';
import type { LatLng, MapPoint, MapShape, PickedLocation, MapRefs, MapLive, MapViewState, DrawItem } from './mapTypes';

interface DrawingArgs {
  refs: MapRefs;
  live: MutableRefObject<MapLive>;
  setSelectedKey: Dispatch<SetStateAction<string | null>>;
  setShape: Dispatch<SetStateAction<MapShape | null>>;
  setPicked: Dispatch<SetStateAction<PickedLocation | null>>;
}

// Area names are drawn on the map for up to this many areas; more show their name on hover.
const LABELLED_AREAS = 30;

/** The functions that draw on the Leaflet map, held in the Map's refs: the view, the popup, the markers, the routes
 *  and areas, the selection and the picked location. They read the latest properties through `live`. */
export const mapDrawing = ({ refs, live, setSelectedKey, setShape, setPicked }: DrawingArgs) => {
  const { hostRef, mapRef, markerLayerRef, shapeLayerRef, markersRef, popupRef, pickedRef, ownMoveRef, closingRef } =
    refs;

  const viewOf = (map: LeafletMap): MapViewState => {
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
  const ownMove = (move: () => void) => {
    ownMoveRef.current = Date.now();
    move();
  };
  /** Tells Leaflet the box changed size; only a real change counts as the widget's move (it ends in a moveend). */
  const resize = (map: LeafletMap) => {
    const host = hostRef.current;
    const was = map.getSize();
    if (!host || (host.clientWidth === was.x && host.clientHeight === was.y)) return;
    ownMove(() => map.invalidateSize({ pan: false }));
  };
  const goTo = (center: LatLng | null | undefined, zoom: unknown, animate = false) => {
    const map = mapRef.current;
    if (!map || !center) return;
    ownMove(() =>
      map.setView([center.lat, center.lng], clampZoom(zoom, map.getZoom()), { animate: animate && hasSize(map) })
    );
  };

  // ---- Popup ----
  const closePopup = () => {
    const map = mapRef.current;
    if (!map || !popupRef.current || !map.hasLayer(popupRef.current)) return;
    closingRef.current = true;
    map.closePopup(popupRef.current);
    closingRef.current = false;
  };
  const openPopup = (point: MapPoint | null) => {
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
    let bbox: [number, number, number, number] = [-180, -85, 180, 85];
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
    const inBox = (pt: MapPoint) => pt.lng >= bbox[0] && pt.lng <= bbox[2] && pt.lat >= bbox[1] && pt.lat <= bbox[3];
    const items: DrawItem[] = !on
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
    const seen = new Set<string>();
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
      const at: [number, number] = item.cluster ? [item.lat, item.lng] : [item.point.lat, item.point.lng];
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
      const at = r.path.map((pt): [number, number] => [pt.lat, pt.lng]);
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

  const zoomIntoCluster = (item: DrawItem & { cluster: Cluster; lat: number; lng: number }) => {
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

  const select = (point: MapPoint | null) => {
    setSelectedKey(point ? point.key : null);
    live.current.selected = point;
    live.current.setExposedVariables(selection(point));
    draw();
    openPopup(point);
  };

  const clickPoint = (key: string) => {
    if (live.current.disabled) return;
    const point = live.current.points.find((pt) => pt.key === key);
    if (!point) return;
    select(point);
    live.current.fireEvent('onMarkerClick');
  };

  const clickShape = (s: MapShape) => {
    if (live.current.disabled) return;
    setShape(s);
    live.current.shape = s;
    live.current.setExposedVariables(shapeSelection(s));
    drawShapes();
    live.current.fireEvent('onShapeClicked');
  };

  // ---- The picked location ----
  /** Places (or clears) the picked pin, exposes it and, unless quiet, fires onLocationPick; then looks up its address. */
  const pick = (at: LatLng | null, { quiet = false, address }: { quiet?: boolean; address?: string } = {}) => {
    const next: PickedLocation | null = at
      ? { lat: round6(at.lat), lng: round6(at.lng), ...(address ? { address } : {}) }
      : null;
    setPicked(next);
    live.current.picked = next;
    live.current.setExposedVariables({ pickedLocation: pickedValue(next) });
    drawPicked();
    if (!quiet && next) live.current.fireEvent('onLocationPicked');
    if (next && !address) lookUpAddress(next);
  };
  // The address lookups this mount started. dispose() (the map unmounting) stops them: an answer that arrived later
  // wrote its address into the store, over the location of the map mounted next (release audit 43).
  const lookups = new Set<AbortController>();
  const lookUpAddress = (at: LatLng) => {
    if (typeof fetch !== 'function') return;
    const lookup = new AbortController();
    lookups.add(lookup);
    geocode(live.current.geocoder.reverse, { lat: at.lat, lng: at.lng }, lookup.signal)
      .then((places) => {
        if (lookup.signal.aborted) return;
        const label = places?.[0]?.label;
        const now = live.current.picked;
        if (!label || !now || now.lat !== at.lat || now.lng !== at.lng) return;
        const next = { ...now, address: label };
        setPicked(next);
        live.current.picked = next;
        live.current.setExposedVariables({ pickedLocation: pickedValue(next) });
      })
      .catch(() => {})
      .finally(() => lookups.delete(lookup));
  };
  const dispose = () => {
    lookups.forEach((lookup) => lookup.abort());
    lookups.clear();
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

  return {
    viewOf,
    ownMove,
    resize,
    goTo,
    closePopup,
    openPopup,
    draw,
    drawShapes,
    select,
    clickShape,
    pick,
    lookUpAddress,
    drawPicked,
    dispose,
  };
};
