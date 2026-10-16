import { useEffect } from 'react';
import L from 'leaflet';
import { clampZoom, selection, shapeSelection } from './mapModel';
import { latLngOf } from './mapIcons';

// A move the widget makes (opening, fitting, an action) is not the user's: onBoundsChange skips the moveend it causes.
const OWN_MOVE_MS = 1500;

/** Makes the Leaflet map once, with its controls, layers and handlers, and removes it on unmount. */
export const useLeafletMap = (
  refs,
  drawing,
  { live, target, setView, setClicked, setSelectedKey, setShape, setWheelHint, setSize }
) => {
  const {
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
  } = refs;
  const { viewOf, resize, draw, drawShapes, pick, drawPicked } = drawing;
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
      live.current.fireEvent('onMapClicked');
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
};
