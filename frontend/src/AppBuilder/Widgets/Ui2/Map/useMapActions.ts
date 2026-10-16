import { useMemo } from 'react';
import { clampZoom, fitView, initialView, parseCenter, shapeSelection, toLatLng } from './mapModel';
import { hasSize } from './mapIcons';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { LeafletMap } from 'leaflet';
import type { LatLng, MapLive, MapPoint, MapShape } from './mapTypes';

interface ActionArgs {
  live: MutableRefObject<MapLive>;
  mapRef: MutableRefObject<LeafletMap | null>;
  goTo: (center: LatLng | null | undefined, zoom: unknown, animate?: boolean) => void;
  ownMove: (move: () => void) => void;
  select: (point: MapPoint | null) => void;
  setShape: Dispatch<SetStateAction<MapShape | null>>;
  drawShapes: () => void;
  pick: (at: LatLng | null, options?: { quiet?: boolean; address?: string }) => void;
  setStyle: Dispatch<SetStateAction<'streets' | 'satellite'>>;
}

/** A point given to an action as (lat, lng), as one { lat, lng } object or as one "lat, lng" text. */
const pointArgs = (lat: unknown, lng: unknown): LatLng | null =>
  lat && typeof lat === 'object'
    ? parseCenter(lat)
    : typeof lat === 'string' && lat.includes(',')
    ? parseCenter(lat)
    : toLatLng(lat, lng);

/** The Map's component-specific actions. They read `live`, so a call made after a data change sees the new markers. */
export const useMapActions = ({
  live,
  mapRef,
  goTo,
  ownMove,
  select,
  setShape,
  drawShapes,
  pick,
  setStyle,
}: ActionArgs) => {
  const actions = useMemo(
    () => ({
      setCenter: async (lat: unknown, lng: unknown, zoom?: unknown) => {
        const at = pointArgs(lat, lng);
        if (!at) return;
        const z = (lat && typeof lat === 'object') || typeof lat === 'string' ? lng : zoom;
        goTo(at, z === undefined || z === null || z === '' ? undefined : z, true);
      },
      setZoom: async (zoom: unknown) => {
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
      selectMarker: async (markerId: unknown) => {
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
            if (group?.properties.cluster) {
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
      setPickedLocation: async (lat: unknown, lng: unknown) => {
        const at = pointArgs(lat, lng);
        if (at) pick(at, { quiet: true });
      },
      clearPickedLocation: async () => pick(null, { quiet: true }),
      setMapStyle: async (next: unknown) => {
        if (next !== 'streets' && next !== 'satellite') return;
        setStyle(next);
        live.current.setExposedVariables({ mapStyle: next });
      },
    }),
    // All stable: refs, state setters and the Map's memoised drawing functions.
    [live, mapRef, goTo, ownMove, select, setShape, drawShapes, pick, setStyle]
  );
  return actions;
};
