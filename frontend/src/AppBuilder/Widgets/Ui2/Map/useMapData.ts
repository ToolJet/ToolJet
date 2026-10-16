import { useEffect, useMemo, useState } from 'react';
import Supercluster from 'supercluster';
import { useStable } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { mapPoints, parseCenter } from './mapModel';
import { areaShapes, heatPoints, markerRoutes, routeRows, statusFill } from './mapShapes';
import { circleCorners } from './mapIcons';
import { loadIcons } from './mapLayers';

import type { Resolved } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import type { MapPoint } from './mapTypes';

/** The marker groups' index: each feature holds its marker's position in the points (i). */
export type MarkerIndex = Supercluster<{ i: number; cluster?: false }>;

/** What the Map draws: markers, heat or both. */
export type MapDisplay = 'markers' | 'heat' | 'both';

// Groups gather the pins within 72px of each other: wide enough that the counts do not overlap one another; price
// pills, about as wide as that, group from further apart.
const CLUSTER = { radius: 72, maxZoom: 16, minPoints: 3 };
const PILL_CLUSTER_RADIUS = 88;

/** The Map's markers, routes, areas, marker groups and heat points from its properties. */
export const useMapData = (p: Resolved) => {
  // Bound values keep their reference while their content is the same, so the shapes below rebuild only on a change.
  const data = useStable(p.data);
  const fields = useStable({
    latField: p.latField,
    lngField: p.lngField,
    titleField: p.titleField,
    subtitleField: p.subtitleField,
    statusField: p.statusField,
    idField: p.idField,
    labelField: p.labelField,
    iconField: p.iconField,
  });
  const statusColors = useStable(p.statusColors);
  const routeColors = useStable(p.routeColors);
  const routeStartValue = useStable(p.routeStart);
  const routeData = useStable(p.routes);
  const areaData = useStable(p.areas);
  const { points, skipped } = useMemo(() => mapPoints(data, fields), [data, fields]);
  const routes = useMemo(
    () => [
      ...(p.connectMarkers === true
        ? markerRoutes(points, {
            routeField: p.routeField,
            routeOrderField: p.routeOrderField,
            routeStart: routeStartValue,
            routeColors,
          })
        : []),
      ...routeRows(routeData, { routeColors, statusColors }),
    ],
    [points, p.connectMarkers, p.routeField, p.routeOrderField, routeStartValue, routeData, routeColors, statusColors]
  );
  const routeStart = p.connectMarkers === true ? parseCenter(p.routeStart) : null;
  const areas = useMemo(
    () =>
      areaShapes(
        areaData,
        {
          areaShapeField: p.areaShapeField,
          areaTitleField: p.areaTitleField,
          areaStatusField: p.areaStatusField,
          areaRadiusField: p.areaRadiusField,
        },
        statusColors
      ),
    [areaData, p.areaShapeField, p.areaTitleField, p.areaStatusField, p.areaRadiusField, statusColors]
  );
  const shapeExtent = useMemo(
    () => [
      ...routes.flatMap((r) => r.path),
      ...areas.flatMap((a) => (a.kind === 'circle' ? circleCorners(a.center, a.radius) : a.path)),
    ],
    [routes, areas]
  );
  const display: MapDisplay = ['heat', 'both'].includes(p.display) ? p.display : 'markers';
  const showMarkers = display !== 'heat';
  const cluster = p.clusterMarkers !== false;
  const index = useMemo((): MarkerIndex | null => {
    if (!cluster || points.length < CLUSTER.minPoints) return null;
    const pills = points.some((pt) => pt.label.length > 3);
    const sc: MarkerIndex = new Supercluster(pills ? { ...CLUSTER, radius: PILL_CLUSTER_RADIUS } : CLUSTER);
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
  const colorOfPoint = (pt: MapPoint) => statusFill(pt.status, pt.tone, statusColors);

  // Icons for the pins load once, the first time a map names one; the pins draw again when they arrive.
  const [iconsReady, setIconsReady] = useState(0);
  const iconNames = useStable(useMemo(() => [...new Set(points.map((pt) => pt.icon).filter(Boolean))], [points]));
  useEffect(() => {
    if (!iconNames.length) return undefined;
    let alive = true;
    loadIcons(iconNames).then((loaded) => alive && loaded && setIconsReady((n) => n + 1));
    return () => {
      alive = false;
    };
  }, [iconNames]);

  return {
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
  };
};
