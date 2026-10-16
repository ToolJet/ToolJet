import React, { useMemo } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { useExposed, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { clamp, formatter } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import { heatmapGrid } from './heatmapModel';
import {
  ChartBoundary,
  EmptyChart,
  useClickedDatum,
  useValueFormat,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartParts';

// ---- Heatmap -------------------------------------------------------------------------------------------------------

/** A grid of cells shaded by value (weekday by hour, region by month): plain HTML, so labels never clip and the shade
 *  follows the theme's chart colour. Each cell blends the chart colour into the muted surface by its value. */
export const ShadHeatmapChart = (props: WidgetProps) => {
  const p = props.properties;
  const { setExposedVariables, height } = props;
  const click = useClickedDatum(props);
  useExposed(setExposedVariables, p, click.exposed);
  const bound = useStable(p.data);
  const xOrder = useStable(p.xOrder);
  const yOrder = useStable(p.yOrder);
  const options = useValueFormat(p);
  // The grid (a pass over every row) is worked out again only when the data, its fields or the orders change.
  const grid = useMemo(
    () => heatmapGrid(bound, { xField: p.xField, yField: p.yField, valueField: p.valueField, xOrder, yOrder }),
    [bound, p.xField, p.yField, p.valueField, xOrder, yOrder]
  );
  const format = useMemo(() => formatter(options, options.format === 'compact'), [options]);
  const showValues = p.showValues === true;
  const gap = clamp(p.cellGap, 0, 12, 3);
  const empty = !grid.xs.length || !grid.ys.length;
  const emptyView = <EmptyChart text={String(p.emptyText || 'No data')} />;
  // Column labels thin out to about one per 36px so a 24-hour axis stays legible.
  const labelEvery = Math.max(1, Math.ceil(grid.xs.length / Math.max(1, Math.floor((props.width || 600) / 36))));
  const rowLabelWidth = Math.min(160, Math.max(32, Math.max(0, ...grid.ys.map((y) => y.length)) * 7 + 12));
  const shade = (strength: number | null) =>
    strength === null
      ? 'var(--sc-muted)'
      : `color-mix(in srgb, var(--sc-chart-1) ${Math.round(12 + strength * 88)}%, var(--sc-muted))`;
  const onCell = (y: string, x: string, value: number | null) => {
    const datum = { [p.yField || 'y']: y, [p.xField || 'x']: x, [p.valueField || 'value']: value };
    click.pick(datum);
  };
  const columns = `${rowLabelWidth}px repeat(${grid.xs.length}, minmax(0, 1fr))`;
  return (
    <Shell {...props}>
      <div
        style={{ height }}
        className="tw-flex tw-w-full tw-flex-col tw-overflow-hidden tw-text-xs"
        onDoubleClick={click.onDoubleClick}
      >
        {empty ? (
          emptyView
        ) : (
          <ChartBoundary resetKey={p} fallback={emptyView}>
            <div
              className="tw-grid tw-min-h-0 tw-flex-1"
              style={{ gridTemplateColumns: columns, gap, gridAutoRows: '1fr' }}
            >
              {grid.ys.map((y) => (
                <React.Fragment key={y}>
                  <div
                    className="tw-flex tw-items-center tw-truncate tw-pr-2 tw-text-[color:var(--lk-axis,var(--sc-muted-foreground))]"
                    title={y}
                  >
                    {y}
                  </div>
                  {grid.xs.map((x) => {
                    const value = grid.value(y, x);
                    const strength = grid.strength(value);
                    return (
                      <button
                        type="button"
                        key={x}
                        title={`${y} · ${x}: ${value === null ? 'no data' : format(value)}`}
                        data-strength={strength === null ? '' : strength.toFixed(2)}
                        onClick={() => onCell(y, x, value)}
                        // The shade arrives as --heat, which the cell's background class reads.
                        className="tw-flex tw-min-h-0 tw-min-w-0 tw-items-center tw-justify-center tw-rounded-[4px] tw-bg-[color:var(--heat)] tw-text-[11px] tw-tabular-nums tw-text-[color:var(--heat-fg)] tw-outline-none tw-transition-[filter] hover:tw-brightness-95 focus-visible:tw-ring-2 focus-visible:tw-ring-[color:var(--sc-ring)]"
                        style={
                          {
                            '--heat': shade(strength),
                            '--heat-fg':
                              strength !== null && strength > 0.55
                                ? 'var(--sc-primary-foreground)'
                                : 'var(--sc-foreground)',
                          } as React.CSSProperties
                        }
                      >
                        {showValues && value !== null ? format(value) : ''}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            <div className="tw-grid tw-pt-1.5" style={{ gridTemplateColumns: columns, columnGap: gap }}>
              <div />
              {grid.xs.map((x, i) => (
                <div
                  key={x}
                  className="tw-truncate tw-text-center tw-text-[color:var(--lk-axis,var(--sc-muted-foreground))]"
                >
                  {i % labelEvery === 0 ? x : ''}
                </div>
              ))}
            </div>
            {p.showLegend !== false ? (
              <div className="tw-flex tw-items-center tw-justify-end tw-gap-2 tw-pt-2 tw-text-[color:var(--lk-legend,var(--sc-muted-foreground))]">
                <span className="tw-tabular-nums">{format(grid.min)}</span>
                <span
                  className="tw-h-2 tw-w-24 tw-rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${shade(0)}, ${shade(1)})`,
                  }}
                />
                <span className="tw-tabular-nums">{format(grid.max)}</span>
              </div>
            ) : null}
          </ChartBoundary>
        )}
      </div>
    </Shell>
  );
};

export default withControlState(ShadHeatmapChart);
