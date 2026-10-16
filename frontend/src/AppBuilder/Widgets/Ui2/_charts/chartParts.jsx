import React, { useState } from 'react';
import dayjs from 'dayjs';
import { ResponsiveContainer } from 'recharts';
import { list, useExposed } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { num, MAX_SERIES } from './chartsModel';

// shadcn/ui pack charts (experiment): Recharts styled the way shadcn/ui's chart component styles it (no axis lines,
// horizontal grid only, a card tooltip, series colours from --sc-chart-1..5, which follow the app theme, or from the
// Chart color style, or from the Series colors list). Grid, axis and legend colours come from the widget's styles
// as variables (shadcnLook.js), else the theme's. Own lazy chunk, so Recharts loads only for apps with a chart.

export const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
export const full = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
export const fmt = (p, short) => (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v ?? '');
  return `${p.valuePrefix || ''}${short ? compact.format(n) : full.format(n)}${p.valueSuffix || ''}`;
};
export const seriesOf = (p) =>
  (Array.isArray(p.yFields) ? p.yFields : String(p.yFields ?? '').split(','))
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, MAX_SERIES);

export const MAX_BARS = 500;
export const AXIS = {
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
  tick: { fill: 'var(--lk-axis, var(--sc-muted-foreground))', fontSize: 12 },
};
export const GRID = 'var(--lk-grid, var(--sc-border))';

export const ChartTooltip = ({ active, payload, label, format }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tj-shadcn">
      <div className="grid min-w-[8rem] gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
        {label !== undefined ? <div className="font-medium">{String(label)}</div> : null}
        {payload.map((item) => (
          <div key={item.dataKey ?? item.name} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ background: item.color || item.payload?.fill }}
            />
            <span className="flex-1 text-muted-foreground">{String(item.name)}</span>
            <span className="font-mono font-medium tabular-nums">{format(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const LegendContent = ({ payload }) => (
  <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs">
    {(payload || []).map((item) => (
      <div key={item.value} className="flex items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: item.color }} />
        <span className="text-[color:var(--lk-legend,var(--sc-muted-foreground))]">{String(item.value)}</span>
      </div>
    ))}
  </div>
);

/** The clicked datum and the native Chart's events and actions: a click on a datum exposes it (clickedDataPoint) and
 *  fires onClick; a double click fires onDoubleClick (the datum is the one its
 *  first click picked); clearClickedPoint() empties it. */
export const useClickedDatum = (props) => {
  const [clicked, setClicked] = useState({});
  const pick = (datum) => {
    setClicked(datum);
    props.setExposedVariables?.({ clickedDataPoint: datum });
    props.fireEvent?.('onClick');
  };
  return {
    pick,
    exposed: { clickedDataPoint: clicked, clearClickedPoint: async () => setClicked({}) },
    onDoubleClick: () => props.fireEvent?.('onDoubleClick'),
  };
};

export const ChartFrame = ({ props, empty, children }) => {
  const { properties, setExposedVariables, height } = props;
  const click = useClickedDatum(props);
  useExposed(setExposedVariables, properties, click.exposed);
  const onDatum = (datum) => {
    if (!datum) return;
    click.pick(datum);
  };
  return (
    <Shell {...props}>
      <div style={{ height }} className="w-full text-xs" onDoubleClick={click.onDoubleClick}>
        {empty ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {String(properties.emptyText || 'No data')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children(onDatum)}
          </ResponsiveContainer>
        )}
      </div>
    </Shell>
  );
};

/** A value axis as wide as its longest tick label (a suffix such as " seats" or a currency needs more than a fixed
 *  48px, or the labels wrap and the top one clips). The top tick is the max rounded up the way the axis rounds it. */
const niceCeil = (v) => {
  if (!(v > 0)) return v;
  const step = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / step) * step;
};
export const valueAxisWidth = (data, series, format, stacked = false) => {
  const values = list(data).flatMap((row) => {
    const nums = series.map((key) => Number(row?.[key])).filter((n) => Number.isFinite(n));
    return stacked ? [nums.reduce((a, b) => a + b, 0)] : nums;
  });
  if (!values.length) return 40;
  const max = Math.max(...values);
  const min = Math.min(0, ...values);
  // The ticks between the ends too (quarters of the nice top): "1.5K km" and "4.5K km" outran a "5K km" top and were
  // cut to ".5K km" (fleet distance chart, 2026-10-14).
  const top = niceCeil(max);
  const ticks = [max, top, min, top * 0.25, top * 0.5, top * 0.75, top * 0.9, top * 0.3, top * 0.7];
  const longest = Math.max(...ticks.map((v) => String(format(v) ?? '').length));
  return Math.min(110, Math.max(32, longest * 7 + 12));
};
/** An x axis of ISO dates ("2026-09-10") reads as "10 Sep", the pack's date style; other values are shown as they are. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ][\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?$/;
const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
export const dateTicks = (data, key) => {
  const sample = list(data)
    .map((row) => row?.[key])
    .find((v) => v !== null && v !== undefined && v !== '');
  if (typeof sample === 'string' && YEAR_MONTH.test(sample)) {
    // Year-months ("2026-03", a monthly rollup's key) read "Mar", or "Mar '26" when the axis spans two years.
    const years = new Set(
      list(data)
        .map((row) => row?.[key])
        .filter((v) => typeof v === 'string' && YEAR_MONTH.test(v))
        .map((v) => v.slice(0, 4))
    );
    const shape = years.size > 1 ? "MMM 'YY" : 'MMM';
    return (v) => (typeof v === 'string' && YEAR_MONTH.test(v) ? dayjs(`${v}-01`).format(shape) : v);
  }
  if (typeof sample !== 'string' || !ISO_DATE.test(sample)) return undefined;
  return (v) => (typeof v === 'string' && ISO_DATE.test(v) ? dayjs(v).format('D MMM') : v);
};

/** A chart drawn under 100px tall (a trend in a KPI tile) has no room for axes, grid or legend: it draws the shape
 *  alone, like a sparkline, instead of squeezing tick labels into it. Taller ones keep their labels (a 135px bar chart
 *  without its category names meant nothing). */
export const isCompactChart = (height) => (Number(height) || 300) < 100;

// ---- Line, Radar, Radial and Sparkline (logic in chartsModel.js) ----------------------------------------------------

// A chart that fails to draw (data no normaliser foresaw) shows the empty state instead of taking the app down; it
// retries when the properties change.
export class ChartBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(prev) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export const EmptyChart = ({ text, small }) => (
  <div
    className={cn(
      'flex h-full w-full items-center justify-center text-[color:var(--sc-muted-foreground)]',
      small ? 'text-xs' : 'text-sm'
    )}
  >
    {text}
  </div>
);

/** ChartFrame with an empty state, an error boundary and the widget's own exposed values. `clickable`: clicking a
 *  datum sets clickedDataPoint and fires onClick; otherwise a click anywhere fires onClick. */
export const SafeFrame = ({ props, empty, small, exposed = {}, clickable = true, children }) => {
  const { properties, setExposedVariables, height } = props;
  const click = useClickedDatum(props);
  useExposed(setExposedVariables, properties, clickable ? { ...click.exposed, ...exposed } : exposed);
  const onDatum = (datum) => {
    if (!datum || typeof datum !== 'object') return;
    click.pick(datum);
  };
  const emptyView = <EmptyChart text={String(properties.emptyText || 'No data')} small={small} />;
  return (
    <Shell {...props}>
      <div
        style={{ height }}
        className="w-full text-xs"
        onClick={clickable ? undefined : () => props.fireEvent?.('onClick')}
        onDoubleClick={click.onDoubleClick}
      >
        {empty ? (
          emptyView
        ) : (
          <ChartBoundary resetKey={properties} fallback={emptyView}>
            <ResponsiveContainer width="100%" height="100%">
              {children(onDatum)}
            </ResponsiveContainer>
          </ChartBoundary>
        )}
      </div>
    </Shell>
  );
};

export const AXIS_FILL = AXIS.tick.fill;
export const animated = (p) => p.animate !== false;
/** A formatter that multiplies by scale first (a percent axis over fractions, percentScale). */
export const scaled = (format, scale) =>
  scale === 1
    ? format
    : (v) => {
        const n = num(v);
        return format(n === null ? v : n * scale);
      };
export const valueFormat = (p) => ({
  format: p.yAxisFormat,
  currency: p.currency,
  prefix: p.valuePrefix,
  suffix: p.valueSuffix,
});

// ---- Combo ---------------------------------------------------------------------------------------------------------

/** Width of a value axis for the given values under the given tick formatter. */
export const axisWidthFor = (values, tick) => {
  if (!values.length) return 40;
  const max = Math.max(...values);
  const min = Math.min(...values);
  // The in-between ticks carry decimals the ends do not (0.8% between 0% and 1%), so they are measured too.
  const top = niceCeil(max);
  const samples = [max, min, top, top * 0.25, top * 0.5, top * 0.75, top * 0.3, top * 0.8];
  const longest = Math.max(...samples.map((v) => String(tick(v)).length));
  return Math.min(96, Math.max(32, longest * 7 + 12));
};
