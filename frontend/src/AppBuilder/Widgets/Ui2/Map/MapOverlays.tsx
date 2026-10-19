import React from 'react';
import type { Legend, MapArea, MapRoute } from './mapShapes';
import type { MapShape } from './mapTypes';
import type { StyleWithVars } from '@/AppBuilder/Widgets/Ui2/_shared/types';

/** The routes and areas as a list for keyboards and screen readers (their lines on the map take no focus): hidden
 *  until it holds focus, a button selects the shape as a click on it does. */
export const MapShapeList = ({
  routes,
  areas,
  shape,
  disabled,
  clickShape,
}: {
  routes: MapRoute[];
  areas: MapArea[];
  shape: MapShape | null;
  disabled: boolean;
  clickShape: (s: MapShape) => void;
}) => (
  <ul className="sc-map-shapes" aria-label="Routes and areas">
    {[
      ...routes.map((r) => ({
        key: r.key,
        type: 'route' as const,
        row: r.row,
        label: `Route ${r.name}, ${r.path.length} points${r.from ? `, from ${r.from}` : ''}`,
      })),
      ...areas.map((a) => ({
        key: a.key,
        type: 'area' as const,
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
);

export const MapTools = ({
  showFullscreen,
  showStyleSwitch,
  expanded,
  toggleFullscreen,
  style,
  setMapStyle,
  disabled,
}: {
  showFullscreen: unknown;
  showStyleSwitch: unknown;
  expanded: boolean;
  toggleFullscreen: () => void;
  style: string;
  setMapStyle: (style: string) => void;
  /** Disabled or loading: the style switch sits outside the tools the busy state hides, so its buttons are disabled
   *  too. The setMapStyle action still works. */
  disabled: boolean;
}) => (
  <>
    {showFullscreen !== false || showStyleSwitch === true ? (
      <div className="sc-map-tools">
        {showFullscreen !== false ? (
          <button
            type="button"
            className="sc-map-tool"
            // Leaving full screen stays possible: a map that turned busy while expanded would otherwise hold the window.
            disabled={disabled ? !expanded : false}
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
    {showStyleSwitch === true ? (
      <div className="sc-map-style-switch" role="radiogroup" aria-label="Map style">
        {['streets', 'satellite'].map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={style === s}
            data-active={style === s || undefined}
            disabled={disabled}
            onClick={() => setMapStyle(s)}
          >
            {s === 'streets' ? 'Map' : 'Satellite'}
          </button>
        ))}
      </div>
    ) : null}
  </>
);

const swatch = (color: string | null, kind: string) => (
  <span
    className={`sc-map-legend-swatch${kind ? ` is-${kind}` : ''}`}
    style={color ? ({ '--swatch': color } as StyleWithVars) : undefined}
  />
);

export const MapCorner = ({
  legend,
  legendShown,
  skipped,
  loadingState,
}: {
  legend: Legend | null;
  legendShown: boolean;
  skipped: number;
  loadingState: unknown;
}) => (
  <div className="sc-map-corner">
    {legendShown && legend ? (
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
    {skipped > 0 && !loadingState ? (
      <div className="sc-map-note" title="Rows need a latitude from -90 to 90 and a longitude from -180 to 180">
        {`${skipped.toLocaleString()} ${skipped === 1 ? 'row' : 'rows'} not shown: no valid coordinates`}
      </div>
    ) : null}
  </div>
);
