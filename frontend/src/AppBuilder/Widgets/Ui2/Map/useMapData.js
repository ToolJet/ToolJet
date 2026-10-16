import { useEffect, useMemo, useState } from 'react';
import Supercluster from 'supercluster';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { mapPoints, parseCenter } from './mapModel';
import { areaShapes, heatPoints, markerRoutes, routeRows, statusFill } from './mapShapes';
import { circleCorners } from './mapIcons';
import { loadIcons } from './mapLayers';

// Groups gather the pins within 72px of each other: wide enough that the counts do not overlap one another; price
// pills, about as wide as that, group from further apart.
const CLUSTER = { radius: 72, maxZoom: 16, minPoints: 3 };
const PILL_CLUSTER_RADIUS = 88;

/** The Map's markers, routes, areas, marker groups and heat points from its properties. */
export const useMapData = (p) => {
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

  return {
    points,
    skipped,
    statusColorsKey,
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
