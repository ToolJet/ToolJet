import React from 'react';

/** The routes and areas as a list for keyboards and screen readers (their lines on the map take no focus): hidden
 *  until it holds focus, a button selects the shape as a click on it does. */
export const MapShapeList = ({ routes, areas, shape, disabled, clickShape }) => (
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
);

export const MapTools = ({ showFullscreen, showStyleSwitch, expanded, toggleFullscreen, style, setMapStyle }) => (
  <>
    {showFullscreen !== false || showStyleSwitch === true ? (
      <div className="sc-map-tools">
        {showFullscreen !== false ? (
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
    {showStyleSwitch === true ? (
      <div className="sc-map-style-switch" role="radiogroup" aria-label="Map style">
        {['streets', 'satellite'].map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={style === s}
            data-active={style === s || undefined}
            onClick={() => setMapStyle(s)}
          >
            {s === 'streets' ? 'Map' : 'Satellite'}
          </button>
        ))}
      </div>
    ) : null}
  </>
);

const swatch = (color, kind) => (
  <span
    className={`sc-map-legend-swatch${kind ? ` is-${kind}` : ''}`}
    style={color ? { '--swatch': color } : undefined}
  />
);

export const MapCorner = ({ legend, legendShown, skipped, loadingState }) => (
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
    {skipped > 0 && !loadingState ? (
      <div className="sc-map-note" title="Rows need a latitude from -90 to 90 and a longitude from -180 to 180">
        {`${skipped.toLocaleString()} ${skipped === 1 ? 'row' : 'rows'} not shown: no valid coordinates`}
      </div>
    ) : null}
  </div>
);
