import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import DOMPurify from 'dompurify';
import 'leaflet/dist/leaflet.css';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Spinner } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { useHasEvent } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { missingIsGone, useExposed, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import {
  initialView,
  parseCenter,
  pickedValue,
  selection,
  shapeSelection,
  tileSource,
  viewBounds,
  viewKey,
} from './mapModel';
import { NOMINATIM, geocoderUrls } from './mapGeocoding';
import { legendItems } from './mapShapes';
import { useHeatLayer } from './mapLayers';
import { useMapData } from './useMapData';
import { mapDrawing } from './mapDrawing';
import { useMapActions } from './useMapActions';
import { useLeafletMap } from './useLeafletMap';
import { useMapFullscreen } from './useMapFullscreen';
import { MapSearch, useMapSearch } from './MapSearch';
import { MapCorner, MapShapeList, MapTools } from './MapOverlays';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';
import type { LayerGroup, LeafletMap, Marker, Popup } from 'leaflet';
import type { HeatLayerInstance } from './mapLayers';
import type { LatLng, MapConfig, MapLive, MapShape, MapViewState, PickedLocation } from './mapTypes';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';

// ToolJet UI 2.0 Map: markers from rows on open raster tiles (Leaflet, no API key), toned by status, grouped into
// counts when they crowd (supercluster), with route lines, areas, a heat layer, a popup, a selection, a picked spot
// with address search, and the view exposed. Config in WidgetManager/widgets/shad*.js, logic in mapModel.ts and
// mapShapes.ts, the heat layer, icons and geocoder in mapLayers.ts, style variables in looks/map.ts, look in
// shadcn.scss (.sc-map). Leaflet is driven imperatively from effects: the map is made in useLeafletMap.ts, its layers
// live in refs and are drawn by mapDrawing.ts, and every handler reads the latest properties through `live`.

/** The install's settings (tile and geocoder URLs); set once when the app loads. */
const publicConfig = (): MapConfig | undefined =>
  typeof window !== 'undefined' ? (window as Window & { public_config?: MapConfig }).public_config : undefined;
const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');

export const ShadMap = (props: WidgetProps) => {
  const { properties: p, setExposedVariables, fireEvent, id, darkMode } = props;
  const frameRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const shapeLayerRef = useRef<LayerGroup | null>(null);
  const markersRef = useRef(new Map<string, { marker: Marker; sig: string }>()); // key -> { marker, sig }
  const popupRef = useRef<Popup | null>(null);
  const pickedRef = useRef<Marker | null>(null);
  const heatRef = useRef<HeatLayerInstance | null>(null);
  const ownMoveRef = useRef(0);
  const closingRef = useRef(false);
  const {
    points,
    skipped,
    statusColors,
    routes,
    routeStart,
    areas,
    shapeExtent,
    display,
    showMarkers,
    index,
    heat,
    heatRadius,
    colorOfPoint,
    iconsReady,
    markerSize,
  } = useMapData(p);

  // The box the map fills: the measured one in a browser, the widget's own size until it is measured (and in tests).
  const [size, setSize] = useState({ w: 0, h: 0 });
  const box = size.w > 0 && size.h > 0 ? size : { w: Number(props.width) || 600, h: Number(props.height) || 420 };
  const frameHeight = Math.max(120, Number(props.height) || 420);

  const defaultCenter = useStable(p.defaultCenter);
  const target = useMemo(
    () =>
      initialView({
        points,
        extra: shapeExtent,
        fitToMarkers: p.fitToMarkers,
        defaultCenter,
        defaultZoom: p.defaultZoom,
        width: box.w,
        height: box.h,
      }),
    [points, shapeExtent, p.fitToMarkers, defaultCenter, p.defaultZoom, box.w, box.h]
  );

  const [view, setView] = useState<MapViewState>(() => ({
    center: target.center,
    zoom: target.zoom,
    bounds: viewBounds(target.center, target.zoom, box.w, box.h),
  }));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [shape, setShape] = useState<MapShape | null>(null);
  const [clicked, setClicked] = useState<LatLng | Record<string, never>>({});
  const pickLocation = p.pickLocation === true;
  const [picked, setPicked] = useState<PickedLocation | null>(() =>
    pickLocation ? parseCenter(p.defaultPickedLocation) || null : null
  );
  const [style, setStyle] = useState<'streets' | 'satellite'>(p.mapStyle === 'satellite' ? 'satellite' : 'streets');
  useEffect(() => setStyle(p.mapStyle === 'satellite' ? 'satellite' : 'streets'), [p.mapStyle]);
  const [wheelHint, setWheelHint] = useState(false);
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
        config: publicConfig(),
        mapStyle: style,
      }),
    [p.tileUrl, p.tileAttribution, darkMode, style]
  );
  const geocoder = geocoderUrls({
    geocoderUrl: p.geocoderUrl,
    reverseGeocoderUrl: p.reverseGeocoderUrl,
    config: publicConfig(),
  });
  // Nominatim's usage policy forbids searching as you type against its public service, so with the default geocoder
  // a search runs on Enter; an install's or app's own geocoder (Photon, Pelias) searches as you type.
  const typeAhead = geocoder.search !== NOMINATIM.search;

  // Everything Leaflet's handlers read, always current.
  const liveNow: MapLive = {
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
  const live = useRef(liveNow);
  live.current = liveNow;

  // The drawing functions read only refs, `live` and state setters, so one set serves every render, and effects can
  // list them as dependencies.
  const refs = useMemo(
    () => ({
      hostRef,
      mapRef,
      markerLayerRef,
      shapeLayerRef,
      markersRef,
      popupRef,
      pickedRef,
      heatRef,
      ownMoveRef,
      closingRef,
    }),
    []
  );
  const drawing = useMemo(() => mapDrawing({ refs, live, setSelectedKey, setShape, setPicked }), [refs]);
  const {
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
  } = drawing;
  const actions = useMapActions({ live, mapRef, goTo, ownMove, select, setShape, drawShapes, pick, setStyle });

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

  useLeafletMap(refs, drawing, { live, target, setView, setClicked, setSelectedKey, setShape, setWheelHint, setSize });
  // Work this mount started ends with it: a late address answer must not write into the next mount's location.
  useEffect(() => drawing.dispose, [drawing]);

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
      // Removed before its listeners go: the attribution control drops the layer's credit on its 'remove' event. On
      // unmount the map has already been removed (useLeafletMap's cleanup runs first), and with it its layers.
      layers.forEach((layer) => {
        if (map.hasLayer(layer)) map.removeLayer(layer);
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
  }, [target, targetKey, goTo]);

  // ---- Markers redraw when their data, grouping, colours or the selection change ----
  useEffect(() => {
    draw();
    if (selectedKey !== null && !selected && missingIsGone(points.length)) {
      // The selected row left the data: nothing is selected now.
      setSelectedKey(null);
      closePopup();
    } else if (selected && popupRef.current && mapRef.current?.hasLayer(popupRef.current)) {
      openPopup(selected);
    }
  }, [
    points,
    index,
    selected,
    selectedKey,
    disabled,
    showMarkers,
    statusColors,
    iconsReady,
    markerSize,
    draw,
    closePopup,
    openPopup,
  ]);

  useEffect(() => {
    drawShapes();
  }, [routes, areas, disabled, routeStart?.lat, routeStart?.lng, drawShapes]);

  // The popup follows its settings. Selecting a marker opens its popup itself, so the selection is read through `live`.
  const popupFields = useStable(p.popupFields);
  useEffect(() => {
    const now = live.current.selected;
    if (!showPopup) closePopup();
    else if (now) openPopup(now);
  }, [showPopup, popupFields, closePopup, openPopup]);

  useHeatLayer(mapRef, heatRef, display !== 'markers', heat, heatRadius);

  // ---- The picked location follows its properties ----
  // A pick made on the map stays until these properties change, so the current pick is read through `live`.
  const defaultPicked = useStable(p.defaultPickedLocation);
  const firstPick = useRef(true);
  useEffect(() => {
    if (firstPick.current) {
      firstPick.current = false;
      drawPicked();
      const opening = live.current.picked;
      if (pickLocation && opening && !opening.address) lookUpAddress(opening);
      return;
    }
    const start = pickLocation ? parseCenter(defaultPicked) : null;
    setPicked(start);
    live.current.picked = start;
    drawPicked();
    if (start) lookUpAddress(start);
  }, [pickLocation, defaultPicked, drawPicked, lookUpAddress]);

  // ---- Interaction follows the disabled and loading states, and the wheel setting ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    (['dragging', 'touchZoom', 'doubleClickZoom', 'boxZoom', 'keyboard'] as const).forEach((handler) =>
      disabled ? map[handler]?.disable() : map[handler]?.enable()
    );
    if (!disabled && p.scrollWheelZoom === true) map.scrollWheelZoom.enable();
    else map.scrollWheelZoom.disable();
    if (pickedRef.current?.dragging) {
      if (disabled) pickedRef.current.dragging.disable();
      else pickedRef.current.dragging.enable();
    }
  }, [disabled, p.scrollWheelZoom]);

  const { expanded, toggleFullscreen } = useMapFullscreen({ frameRef, mapRef, resize });

  const search = useMapSearch({ live, mapRef, pick, typeAhead });

  // ---- Overlays ----
  const empty = !p.loadingState && !points.length && !routes.length && !areas.length && !(pickLocation && picked);
  const emptyText = typeof p.emptyText === 'string' || typeof p.emptyText === 'number' ? String(p.emptyText) : '';
  const legend =
    p.showLegend !== false && showMarkers ? legendItems({ points, routes, areas, statusColors: p.statusColors }) : null;
  const legendShown =
    !!legend && (legend.statuses.length + legend.routes.length + legend.areas.length > 1 || legend.routes.length === 1);
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
          <MapShapeList routes={routes} areas={areas} shape={shape} disabled={disabled} clickShape={clickShape} />
        ) : null}
        {p.showSearch === true ? (
          <MapSearch
            search={search}
            disabled={disabled}
            placeholder={toText(p.searchPlaceholder)}
            typeAhead={typeAhead}
          />
        ) : null}
        <MapTools
          showFullscreen={p.showFullscreen}
          showStyleSwitch={p.showStyleSwitch}
          expanded={expanded}
          toggleFullscreen={toggleFullscreen}
          style={style}
          setMapStyle={actions.setMapStyle}
          disabled={disabled}
        />
        <MapCorner legend={legend} legendShown={legendShown} skipped={skipped} loadingState={p.loadingState} />
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
            <Spinner className="tw-h-5 tw-w-5" />
          </div>
        ) : null}
      </div>
    </Shell>
  );
};

export default withControlState(ShadMap);
