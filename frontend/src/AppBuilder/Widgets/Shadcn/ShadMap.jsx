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
  clampZoom,
  fitView,
  initialView,
  mapPoints,
  parseCenter,
  popupLines,
  tileSource,
  toLatLng,
  viewBounds,
  viewKey,
} from './mapModel';
import './shadcn.scss';

export { withControlState } from '../packHooks';

// ToolJet UI 2.0 Map: markers from rows on open raster tiles (Leaflet, no API key), toned by status, grouped into
// counts when they crowd (supercluster), with a popup, a selection, and the view exposed. Config in
// WidgetManager/shadcnSource.map.js, logic in mapModel.js, style variables in looks/map.js, look in shadcn.scss
// (.sc-map). Leaflet is driven imperatively from effects: the map, its tile layer and its markers live in refs, and
// every handler reads the latest properties through `live`.

// Groups gather the pins within 72px of each other: wide enough that the counts do not overlap one another.
const CLUSTER = { radius: 72, maxZoom: 16, minPoints: 3 };
// A move the widget makes (opening, fitting, an action) is not the user's: onBoundsChange skips the moveend it causes.
const OWN_MOVE_MS = 1500;

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const round6 = (n) => Math.round(n * 1e6) / 1e6;
const latLngOf = (ll) => ({ lat: round6(ll.lat), lng: round6(ll.lng) });

const PIN_SVG =
  '<svg viewBox="0 0 28 36" width="28" height="36" aria-hidden="true"><path class="sc-map-pin-body" d="M14 35s11-11.3 11-21.2A11 11 0 0 0 3 13.8C3 23.7 14 35 14 35z"/><circle class="sc-map-pin-dot" cx="14" cy="13.8" r="4.4"/></svg>';

const pinIcon = (point, selected) =>
  L.divIcon({
    className: 'sc-map-marker',
    html: `<span class="sc-map-pin" data-marker="${escapeHtml(point.key)}"${
      point.tone ? ` data-tone="${point.tone}"` : ''
    }${selected ? ' data-selected="true"' : ''}>${PIN_SVG}</span>`,
    iconSize: [28, 36],
    iconAnchor: [14, 35],
  });

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

const pointTitle = (p) => [p.title, p.subtitle, p.statusLabel].filter(Boolean).join(' · ') || 'Location';

/** The popup's content: the title and its status chip, the second line, then the popup fields, one a line. Built as
 *  DOM with text nodes, so row values never become markup. */
const popupNode = (point, lines) => {
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

export const ShadMap = (props) => {
  const { properties: p, setExposedVariables, fireEvent, id, darkMode } = props;
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const markersRef = useRef(new Map()); // key -> { marker, sig }
  const popupRef = useRef(null);
  const ownMoveRef = useRef(0);
  const closingRef = useRef(false);

  const fields = {
    latField: p.latField,
    lngField: p.lngField,
    titleField: p.titleField,
    subtitleField: p.subtitleField,
    statusField: p.statusField,
    idField: p.idField,
  };
  const dataKey = stringify(p.data ?? null);
  const { points, skipped } = useMemo(
    () => mapPoints(p.data, fields),
    [dataKey, stringify(fields)] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const cluster = p.clusterMarkers !== false;
  const index = useMemo(() => {
    if (!cluster || points.length < CLUSTER.minPoints) return null;
    const sc = new Supercluster(CLUSTER);
    sc.load(
      points.map((pt, i) => ({
        type: 'Feature',
        properties: { i },
        geometry: { type: 'Point', coordinates: [pt.lng, pt.lat] },
      }))
    );
    return sc;
  }, [points, cluster]);

  // The box the map fills: the measured one in a browser, the widget's own size until it is measured (and in tests).
  const [size, setSize] = useState({ w: 0, h: 0 });
  const box = size.w > 0 && size.h > 0 ? size : { w: Number(props.width) || 600, h: Number(props.height) || 420 };
  const frameHeight = Math.max(120, Number(props.height) || 420);

  const target = useMemo(
    () =>
      initialView({
        points,
        fitToMarkers: p.fitToMarkers,
        defaultCenter: p.defaultCenter,
        defaultZoom: p.defaultZoom,
        width: box.w,
        height: box.h,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points, p.fitToMarkers, stringify(p.defaultCenter ?? null), p.defaultZoom, box.w, box.h]
  );

  const [view, setView] = useState(() => ({
    center: target.center,
    zoom: target.zoom,
    bounds: viewBounds(target.center, target.zoom, box.w, box.h),
  }));
  const [selectedKey, setSelectedKey] = useState(null);
  const [clicked, setClicked] = useState({});
  const selected = selectedKey === null ? null : points.find((pt) => pt.key === selectedKey) || null;
  const disabled = busy(p);
  const showPopup = p.showPopup !== false;
  const hasMarkerClick = useHasEvent(id, 'onMarkerClick');

  const source = useMemo(
    () =>
      tileSource({
        tileUrl: p.tileUrl,
        tileAttribution: p.tileAttribution,
        darkMode: !!darkMode,
        config: typeof window !== 'undefined' ? window.public_config : undefined,
      }),
    [p.tileUrl, p.tileAttribution, darkMode]
  );

  // Everything Leaflet's handlers read, always current.
  const live = useRef({});
  live.current = {
    points,
    index,
    selected,
    disabled,
    showPopup,
    box,
    p,
    fireEvent,
    setExposedVariables,
    hasMarkerClick,
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
      .setContent(popupNode(point, popupLines(point.row, live.current.p.popupFields)));
    if (!map.hasLayer(popup)) popup.openOn(map);
  };

  // ---- Markers ----
  /** Draws the markers (or groups) in and around the view, reusing the ones already drawn. */
  const draw = () => {
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!map || !layer) return;
    const { points: pts, index: idx, selected: sel, disabled: off } = live.current;
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
    const items = idx
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
      const sig = item.cluster
        ? `c${item.cluster.count}@${item.lat},${item.lng}|${off}`
        : `${item.point.lat},${item.point.lng}|${item.point.tone}|${pointTitle(item.point)}|${isSelected}|${off}`;
      const existing = drawn.get(item.key);
      if (existing && existing.sig === sig) return;
      if (existing) layer.removeLayer(existing.marker);
      const at = item.cluster ? [item.lat, item.lng] : [item.point.lat, item.point.lng];
      const marker = L.marker(at, {
        icon: item.cluster ? clusterIcon(item.cluster) : pinIcon(item.point, isSelected),
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

  // ---- Actions (read `live`, so a call made after a data change sees the new markers) ----
  const actions = useMemo(
    () => ({
      setCenter: async (lat, lng, zoom) => {
        const objectForm = lat && typeof lat === 'object';
        const at = objectForm || (typeof lat === 'string' && lat.includes(',')) ? parseCenter(lat) : toLatLng(lat, lng);
        if (!at) return;
        const z = objectForm || typeof lat === 'string' ? lng : zoom;
        goTo(at, z === undefined || z === null || z === '' ? undefined : z, true);
      },
      setZoom: async (zoom) => {
        const map = mapRef.current;
        const z = clampZoom(zoom, null);
        if (!map || z === null) return;
        ownMove(() => map.setZoom(z, { animate: hasSize(map) }));
      },
      fitBounds: async () => {
        const { points: pts, box: b, p: props_ } = live.current;
        const next = pts.length
          ? fitView(pts, b.w, b.h)
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
      clearSelection: async () => select(null),
    }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useExposed(setExposedVariables, p, {
    ...selection(selected),
    clickedLocation: clicked,
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
      zoomControl: false,
      worldCopyJump: true,
      fadeAnimation: false,
    });
    mapRef.current = map;
    L.control.zoom({ position: 'topright', zoomInTitle: 'Zoom in', zoomOutTitle: 'Zoom out' }).addTo(map);
    map.attributionControl.setPrefix(
      '<a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">Leaflet</a>'
    );
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
      live.current.setExposedVariables({ clickedLocation: at, ...selection(null) });
      draw();
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

    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        const w = host.clientWidth;
        const h = host.clientHeight;
        if (!w || !h) return;
        ownMove(() => map.invalidateSize({ pan: false }));
        setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
      });
      observer.observe(host);
    }
    draw();
    return () => {
      observer?.disconnect();
      map.off();
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      popupRef.current = null;
      markersRef.current = new Map();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Tiles: the source follows the theme and the tile properties ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    const layer = L.tileLayer(source.url, {
      attribution: DOMPurify.sanitize(source.attribution || '', { ALLOWED_TAGS: ['a', 'span', 'b', 'strong'] }),
      subdomains: 'abc',
      maxZoom: 19,
      crossOrigin: true,
    });
    layer.addTo(map);
    return () => {
      // Removed before its listeners go: the attribution control drops the layer's credit on its 'remove' event.
      if (mapRef.current) map.removeLayer(layer);
      layer.off();
    };
  }, [source.url, source.attribution]);

  // ---- The view follows the markers (or the default center) when they change ----
  const targetKey = viewKey(target);
  const shownTarget = useRef(targetKey);
  useEffect(() => {
    if (shownTarget.current === targetKey) return;
    shownTarget.current = targetKey;
    goTo(target.center, target.zoom);
  }, [targetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Markers redraw when their data, grouping or the selection change ----
  useEffect(() => {
    draw();
    if (selectedKey !== null && !selected) {
      // The selected row left the data: nothing is selected now.
      setSelectedKey(null);
      closePopup();
    } else if (selected && popupRef.current && mapRef.current?.hasLayer(popupRef.current)) {
      openPopup(selected);
    }
  }, [points, index, selected, disabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!showPopup) closePopup();
    else if (selected) openPopup(selected);
  }, [showPopup, p.popupFields]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Interaction follows the disabled and loading states ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    ['dragging', 'touchZoom', 'doubleClickZoom', 'scrollWheelZoom', 'boxZoom', 'keyboard'].forEach((handler) =>
      disabled ? map[handler]?.disable() : map[handler]?.enable()
    );
  }, [disabled]);

  const empty = !p.loadingState && !points.length;
  const emptyText = typeof p.emptyText === 'string' || typeof p.emptyText === 'number' ? String(p.emptyText) : '';
  return (
    <Shell {...props}>
      <div
        className="sc-map"
        style={{ height: frameHeight }}
        data-disabled={disabled || undefined}
        data-clickable={hasMarkerClick || undefined}
      >
        <div
          ref={hostRef}
          className="sc-map-canvas"
          data-tiles={source.url}
          data-basemap={source.basemap || undefined}
        />
        {empty ? (
          <div className="sc-map-empty" role="note">
            <span>{emptyText || 'No locations to show'}</span>
          </div>
        ) : null}
        {skipped > 0 && !p.loadingState ? (
          <div className="sc-map-note" title="Rows need a latitude from -90 to 90 and a longitude from -180 to 180">
            {`${skipped.toLocaleString()} ${skipped === 1 ? 'row' : 'rows'} not shown: no valid coordinates`}
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
