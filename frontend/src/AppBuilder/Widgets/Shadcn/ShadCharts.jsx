import React, { useState } from 'react';
import dayjs from 'dayjs';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Label as ChartLabel,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { list, useExposed } from '../packHooks';
import { Shell } from './Shadcn';
import { seriesColor } from './shadcnLook';
import { cn } from './ui';
import {
  arcAngles,
  arcBox,
  bandRange,
  clamp,
  curveOf,
  fieldList,
  formatter,
  hasValues,
  isSet,
  lastPoint,
  num,
  radialRows,
  seriesRows,
  sparkPoints,
  trendOf,
  resolveChartFields,
  seriesLabel,
  highlightIndexes,
  comboSeries,
  funnelStages,
  scatterGroups,
  MAX_ROWS,
  MAX_SERIES,
} from './chartsModel';

export { withControlState } from '../packHooks';

// shadcn/ui pack charts (experiment): Recharts styled the way shadcn/ui's chart component styles it (no axis lines,
// horizontal grid only, a card tooltip, series colours from --sc-chart-1..5, which follow the app theme, or from the
// Chart color style, or from the Series colors list). Grid, axis and legend colours come from the widget's styles
// as variables (shadcnLook.js), else the theme's. Own lazy chunk, so Recharts loads only for apps with a chart.

const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
const full = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const fmt = (p, short) => (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v ?? '');
  return `${p.valuePrefix || ''}${short ? compact.format(n) : full.format(n)}${p.valueSuffix || ''}`;
};
const seriesOf = (p) =>
  (Array.isArray(p.yFields) ? p.yFields : String(p.yFields ?? '').split(','))
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, MAX_SERIES);
// A pie past this many slices is unreadable, and drawing 10k of them freezes the page; bars likewise (a bar each,
// with a cell for its colour, per row and series).
const MAX_SLICES = 100;
const MAX_BARS = 500;
const AXIS = {
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
  tick: { fill: 'var(--lk-axis, var(--sc-muted-foreground))', fontSize: 12 },
};
const GRID = 'var(--lk-grid, var(--sc-border))';

const ChartTooltip = ({ active, payload, label, format }) => {
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

const LegendContent = ({ payload }) => (
  <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs">
    {(payload || []).map((item) => (
      <div key={item.value} className="flex items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: item.color }} />
        <span className="text-[color:var(--lk-legend,var(--sc-muted-foreground))]">{String(item.value)}</span>
      </div>
    ))}
  </div>
);

const ChartFrame = ({ props, empty, children }) => {
  const { properties, setExposedVariables, height } = props;
  const [clicked, setClicked] = useState({});
  useExposed(setExposedVariables, properties, { clickedDatum: clicked });
  const onDatum = (datum) => {
    if (!datum) return;
    setClicked(datum);
    props.setExposedVariable('clickedDatum', datum);
    props.fireEvent('onClick');
  };
  return (
    <Shell {...props}>
      <div style={{ height }} className="w-full text-xs">
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
  const longest = Math.max(...[max, niceCeil(max), min].map((v) => String(format(v) ?? '').length));
  return Math.min(110, Math.max(32, longest * 7 + 12));
};
/** An x axis of ISO dates ("2026-09-10") reads as "10 Sep", the pack's date style; other values are shown as they are. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ][\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?$/;
export const dateTicks = (data, key) => {
  const sample = list(data)
    .map((row) => row?.[key])
    .find((v) => v !== null && v !== undefined && v !== '');
  if (typeof sample !== 'string' || !ISO_DATE.test(sample)) return undefined;
  return (v) => (typeof v === 'string' && ISO_DATE.test(v) ? dayjs(v).format('D MMM') : v);
};

/** A chart drawn under 100px tall (a trend in a KPI tile) has no room for axes, grid or legend: it draws the shape
 *  alone, like a sparkline, instead of squeezing tick labels into it. Taller ones keep their labels (a 135px bar chart
 *  without its category names meant nothing). */
export const isCompactChart = (height) => (Number(height) || 300) < 100;

const categoryAxisWidth = (data, key) => {
  const longest = Math.max(0, ...list(data).map((row) => String(row?.[key] ?? '').length));
  return Math.min(180, Math.max(48, longest * 7 + 16));
};

export const ShadAreaChart = (props) => {
  const p = props.properties;
  const data = list(p.data).slice(0, MAX_ROWS);
  const { x: xField, series } = resolveChartFields(data, p.xField, seriesOf(p));
  const Chart = p.lineOnly === true ? LineChart : AreaChart;
  const compact = isCompactChart(props.height);
  const color = (i) => seriesColor(p.colors, i);
  return (
    <ChartFrame props={props} empty={!data.length || !series.length}>
      {(onDatum) => (
        <Chart
          data={data}
          margin={{ left: 4, right: 12, top: 12 }}
          onClick={(e) => onDatum(e?.activePayload?.[0]?.payload)}
        >
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s} id={`sc-fill-${props.id}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color(i)} stopOpacity={0.6} />
                <stop offset="95%" stopColor={color(i)} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          {compact ? null : <CartesianGrid vertical={false} stroke={GRID} />}
          <XAxis dataKey={xField} {...AXIS} hide={compact} minTickGap={24} tickFormatter={dateTicks(data, xField)} />
          <YAxis
            {...AXIS}
            hide={compact}
            width={valueAxisWidth(data, series, fmt(p, true), p.stack === true && p.lineOnly !== true)}
            tickFormatter={fmt(p, true)}
          />
          <Tooltip cursor={{ stroke: 'var(--sc-border)' }} content={<ChartTooltip format={fmt(p, false)} />} />
          {p.showLegend === true && !compact ? <Legend content={<LegendContent />} /> : null}
          {series.map((s, i) =>
            p.lineOnly === true ? (
              <Line
                key={s}
                dataKey={s}
                name={seriesLabel(s, p.seriesLabels)}
                type={curveOf(p.curve)}
                stroke={color(i)}
                strokeWidth={2}
                dot={false}
              />
            ) : (
              <Area
                key={s}
                dataKey={s}
                name={seriesLabel(s, p.seriesLabels)}
                type={curveOf(p.curve)}
                stroke={color(i)}
                strokeWidth={2}
                fill={`url(#sc-fill-${props.id}-${i})`}
                stackId={p.stack === true ? 'a' : undefined}
              />
            )
          )}
        </Chart>
      )}
    </ChartFrame>
  );
};

export const ShadBarChart = (props) => {
  const p = props.properties;
  const data = list(p.data).slice(0, MAX_BARS);
  const { x: xField, series } = resolveChartFields(data, p.xField, seriesOf(p));
  const horizontal = p.horizontal === true;
  const compact = isCompactChart(props.height);
  const color = (i) => seriesColor(p.colors, i);
  // Highlight: the picked bars keep the series colour (or the Highlight color style), the rest draw muted (the Muted
  // bar color style, else the series colour faded), so one month or one site stands out.
  const picked = highlightIndexes(data, xField, series, p.highlight);
  const highlightFill = isSet(props.styles?.highlightColor) ? 'var(--lk-highlight)' : null;
  const mutedFill = isSet(props.styles?.mutedColor) ? 'var(--lk-muted-bar)' : null;
  const cells = (i) =>
    picked
      ? data.map((_, d) =>
          picked.has(d) ? (
            <Cell key={d} fill={highlightFill || color(i)} />
          ) : (
            <Cell key={d} fill={mutedFill || color(i)} fillOpacity={mutedFill ? 1 : 0.32} />
          )
        )
      : null;
  return (
    <ChartFrame props={props} empty={!data.length || !series.length}>
      {(onDatum) => (
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ left: 4, right: 12, top: 12 }}
          onClick={(e) => onDatum(e?.activePayload?.[0]?.payload)}
        >
          {compact ? null : <CartesianGrid vertical={horizontal} horizontal={!horizontal} stroke={GRID} />}
          {horizontal ? (
            <>
              <XAxis type="number" {...AXIS} hide={compact} tickFormatter={fmt(p, true)} />
              <YAxis
                type="category"
                dataKey={xField}
                {...AXIS}
                hide={compact}
                width={categoryAxisWidth(data, xField)}
                // Every bar keeps its name: Recharts thinned the labels of a 6-bar chart to every other one.
                interval={data.length <= 40 ? 0 : 'preserveStartEnd'}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xField}
                {...AXIS}
                hide={compact}
                minTickGap={16}
                tickFormatter={dateTicks(data, xField)}
              />
              <YAxis
                {...AXIS}
                hide={compact}
                width={valueAxisWidth(data, series, fmt(p, true), p.stack === true)}
                tickFormatter={fmt(p, true)}
              />
            </>
          )}
          <Tooltip cursor={{ fill: 'var(--sc-muted)' }} content={<ChartTooltip format={fmt(p, false)} />} />
          {p.showLegend === true && !compact ? <Legend content={<LegendContent />} /> : null}
          {series.map((s, i) => (
            <Bar
              key={s}
              dataKey={s}
              name={seriesLabel(s, p.seriesLabels)}
              fill={color(i)}
              radius={p.stack === true ? 0 : horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              stackId={p.stack === true ? 'a' : undefined}
            >
              {cells(i)}
            </Bar>
          ))}
        </BarChart>
      )}
    </ChartFrame>
  );
};

export const ShadPieChart = (props) => {
  const p = props.properties;
  const data = list(p.data)
    .slice(0, MAX_SLICES)
    .map((d, i) => ({ ...d, fill: seriesColor(p.colors, i) }));
  const donut = p.donut !== false;
  const format = fmt(p, false);
  return (
    <ChartFrame props={props} empty={!data.length}>
      {(onDatum) => (
        <PieChart>
          <Tooltip content={<ChartTooltip format={format} />} />
          {p.showLegend !== false ? <Legend content={<LegendContent />} /> : null}
          <Pie
            data={data}
            dataKey={p.valueField}
            nameKey={p.categoryField}
            innerRadius={donut ? '58%' : 0}
            outerRadius="85%"
            strokeWidth={donut ? 4 : 1}
            stroke="var(--lk-slice-border, var(--sc-background))"
            onClick={(slice) => onDatum(slice?.payload)}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.fill} />
            ))}
            {donut && (p.centerValue || p.centerLabel) ? (
              <ChartLabel
                content={({ viewBox }) =>
                  viewBox?.cx !== undefined ? (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        style={{ fill: 'var(--lk-center-value, var(--sc-foreground))', fontSize: 24, fontWeight: 700 }}
                      >
                        {String(p.centerValue ?? '')}
                      </tspan>
                      {p.centerLabel ? (
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy + 22}
                          style={{ fill: 'var(--lk-center-label, var(--sc-muted-foreground))', fontSize: 12 }}
                        >
                          {String(p.centerLabel)}
                        </tspan>
                      ) : null}
                    </text>
                  ) : null
                }
              />
            ) : null}
          </Pie>
        </PieChart>
      )}
    </ChartFrame>
  );
};

// ---- Line, Radar, Radial and Sparkline (logic in chartsModel.js) ----------------------------------------------------

// A chart that fails to draw (data no normaliser foresaw) shows the empty state instead of taking the app down; it
// retries when the properties change.
class ChartBoundary extends React.Component {
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

const EmptyChart = ({ text, small }) => (
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
 *  datum sets clickedDatum and fires onClick; otherwise a click anywhere fires onClick. */
const SafeFrame = ({ props, empty, small, exposed = {}, clickable = true, children }) => {
  const { properties, setExposedVariables, height } = props;
  const [clicked, setClicked] = useState({});
  useExposed(setExposedVariables, properties, clickable ? { clickedDatum: clicked, ...exposed } : exposed);
  const onDatum = (datum) => {
    if (!datum || typeof datum !== 'object') return;
    setClicked(datum);
    props.setExposedVariable?.('clickedDatum', datum);
    props.fireEvent?.('onClick');
  };
  const emptyView = <EmptyChart text={String(properties.emptyText || 'No data')} small={small} />;
  return (
    <Shell {...props}>
      <div
        style={{ height }}
        className="w-full text-xs"
        onClick={clickable ? undefined : () => props.fireEvent?.('onClick')}
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

const AXIS_FILL = AXIS.tick.fill;
const animated = (p) => p.animate !== false;
const valueFormat = (p) => ({
  format: p.yAxisFormat,
  currency: p.currency,
  prefix: p.valuePrefix,
  suffix: p.valueSuffix,
});

export const ShadLineChart = (props) => {
  const p = props.properties;
  const { x: xField, series } = resolveChartFields(
    list(p.data),
    isSet(p.xField) ? String(p.xField) : undefined,
    fieldList(p.yFields)
  );
  const rows = seriesRows(p.data, xField, series);
  const dashed = fieldList(p.dashedFields);
  const compact = isCompactChart(props.height);
  const tick = formatter(valueFormat(p), true);
  const full = formatter(valueFormat(p), false);
  const target = num(p.referenceValue);
  const targetLabel = isSet(p.referenceLabel) ? String(p.referenceLabel) : '';
  const strokeWidth = clamp(p.strokeWidth, 0.5, 12, 2);
  const curve = curveOf(p.curve);
  const color = (i) => seriesColor(p.colors, i);
  // The y axis is as wide as its longest tick label.
  const values = rows.flatMap((r) => series.map((s) => r[s])).filter((v) => v !== null);
  if (target !== null) values.push(target);
  const longest = values.length
    ? Math.max(String(tick(Math.max(...values))).length, String(tick(Math.min(...values))).length)
    : 3;
  const yWidth = Math.min(88, Math.max(32, longest * 7 + 10));
  const refColor = 'var(--lk-ref, var(--sc-muted-foreground))';
  return (
    <SafeFrame props={props} empty={!series.length || !hasValues(rows, series)}>
      {(onDatum) => (
        <LineChart
          data={rows}
          accessibilityLayer
          margin={{ left: 4, right: 12, top: target !== null && targetLabel ? 20 : 8 }}
          onClick={(e) => onDatum(e?.activePayload?.[0]?.payload)}
        >
          {p.showGrid !== false && !compact ? <CartesianGrid vertical={false} stroke={GRID} /> : null}
          <XAxis dataKey={xField} {...AXIS} hide={compact} minTickGap={24} tickFormatter={dateTicks(rows, xField)} />
          <YAxis {...AXIS} hide={compact} width={yWidth} tickFormatter={tick} />
          <Tooltip cursor={{ stroke: 'var(--sc-border)' }} content={<ChartTooltip format={full} />} />
          {p.showLegend === true && !compact ? <Legend content={<LegendContent />} /> : null}
          {target !== null ? (
            <ReferenceLine
              y={target}
              stroke={refColor}
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
              label={
                targetLabel
                  ? { value: targetLabel, position: 'insideTopRight', fill: refColor, fontSize: 12, offset: 6 }
                  : undefined
              }
            />
          ) : null}
          {series.map((s, i) => (
            <Line
              key={s}
              dataKey={s}
              name={seriesLabel(s, p.seriesLabels)}
              type={curve}
              stroke={color(i)}
              strokeWidth={strokeWidth}
              strokeDasharray={dashed.includes(s) ? '6 4' : undefined}
              dot={p.showDots === true ? { r: 3, fill: color(i), strokeWidth: 0 } : false}
              activeDot={{ r: 5, strokeWidth: 0 }}
              isAnimationActive={animated(p)}
            />
          ))}
        </LineChart>
      )}
    </SafeFrame>
  );
};

export const ShadRadarChart = (props) => {
  const p = props.properties;
  const { x: category, series } = resolveChartFields(
    list(p.data),
    isSet(p.categoryField) ? String(p.categoryField) : undefined,
    fieldList(p.yFields)
  );
  const rows = seriesRows(p.data, category, series);
  // A missing score sits at the centre rather than breaking the polygon.
  const plotted = rows.map((r) => ({ ...r, ...Object.fromEntries(series.map((s) => [s, r[s] ?? 0])) }));
  const max = num(p.maxValue);
  const opacity = clamp(p.fillOpacity, 0, 1, 0.5);
  const full = formatter({ prefix: p.valuePrefix, suffix: p.valueSuffix });
  const color = (i) => seriesColor(p.colors, i);
  return (
    <SafeFrame props={props} empty={!series.length || !hasValues(rows, series)}>
      {(onDatum) => (
        <RadarChart
          data={plotted}
          outerRadius="72%"
          margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
          onClick={(e) => onDatum(e?.activePayload?.[0]?.payload)}
        >
          {p.showGrid !== false ? (
            <PolarGrid gridType={p.gridShape === 'circle' ? 'circle' : 'polygon'} stroke={GRID} />
          ) : null}
          <PolarAngleAxis dataKey={category} tick={{ fill: AXIS_FILL, fontSize: 12 }} />
          <PolarRadiusAxis
            domain={[0, max !== null && max > 0 ? max : 'auto']}
            tick={false}
            axisLine={false}
            allowDataOverflow={false}
          />
          <Tooltip cursor={false} content={<ChartTooltip format={full} />} />
          {p.showLegend !== false ? <Legend content={<LegendContent />} /> : null}
          {series.map((s, i) => (
            <Radar
              key={s}
              dataKey={s}
              name={seriesLabel(s, p.seriesLabels)}
              stroke={color(i)}
              strokeWidth={2}
              fill={color(i)}
              fillOpacity={opacity}
              dot={p.showDots === true ? { r: 3, fillOpacity: 1, fill: color(i) } : false}
              isAnimationActive={animated(p)}
            />
          ))}
        </RadarChart>
      )}
    </SafeFrame>
  );
};

const RadialTip = ({ active, payload, format }) => {
  const item = active ? payload?.[0]?.payload : null;
  if (!item) return null;
  return (
    <div className="tj-shadcn">
      <div className="flex items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
        <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: item.fill }} />
        <span className="text-muted-foreground">{String(item.name)}</span>
        <span className="font-mono font-medium tabular-nums">{format(item.value)}</span>
      </div>
    </div>
  );
};

// Sized by ResponsiveContainer (it passes width and height), so the arc can fill the box: a semicircle gauge sits low
// and wide, a full ring centred.
const RadialBody = ({ width, height, p, rings, progress, centre, onDatum }) => {
  const w = Number(width) || 0;
  const legend = !progress && p.showLegend !== false;
  const chartHeight = Math.max(0, (Number(height) || 0) - (legend ? 32 : 0));
  const { startAngle, endAngle } = arcAngles(p.startAngle, p.endAngle);
  const box = arcBox(startAngle, endAngle, w, chartHeight);
  const r = box.outerRadius;
  const own = num(p.thickness);
  let inner;
  let barSize;
  if (progress) {
    barSize = Math.max(2, Math.min(r * 0.6, own ?? Math.max(8, Math.min(28, r * 0.16))));
    inner = Math.max(0, r - barSize);
  } else {
    barSize = own !== null ? Math.max(2, own) : undefined;
    inner = barSize ? Math.max(r * 0.15, r - rings.length * (barSize + 4)) : r * 0.32;
  }
  // Categories fill against the larger of Max value and the largest value.
  const max = progress ? rings[0].max : Math.max(num(p.maxValue) ?? 0, ...rings.map((g) => g.value)) || 1;
  const radius = p.rounded !== false ? (barSize ?? ((r - inner) / Math.max(1, rings.length)) * 0.82) / 2 : 0;
  const format = formatter({ prefix: p.valuePrefix, suffix: p.valueSuffix });
  const fontSize = Math.max(14, Math.min(40, inner * 0.42));
  return (
    <div className="relative" style={{ width: w, height }}>
      <RadialBarChart
        width={w}
        height={chartHeight}
        data={rings}
        cx={box.cx}
        cy={box.cy}
        innerRadius={inner}
        outerRadius={r}
        startAngle={startAngle}
        endAngle={endAngle}
        barSize={barSize}
        barCategoryGap={progress ? 0 : '18%'}
      >
        <PolarAngleAxis type="number" domain={[0, max]} tick={false} axisLine={false} />
        {progress ? null : <Tooltip cursor={false} content={<RadialTip format={format} />} />}
        <RadialBar
          dataKey="value"
          background={p.showTrack !== false ? { fill: 'var(--lk-track, var(--sc-muted))' } : false}
          cornerRadius={radius}
          isAnimationActive={animated(p)}
          onClick={(entry) => onDatum(entry?.payload?.row ?? entry?.row)}
        >
          {rings.map((g, i) => (
            <Cell key={i} fill={g.fill} className="cursor-pointer" />
          ))}
        </RadialBar>
      </RadialBarChart>
      {centre.value !== '' || centre.label ? (
        <div
          className="pointer-events-none absolute flex flex-col items-center text-center leading-none"
          style={{
            left: box.cx,
            top: box.cy,
            maxWidth: Math.max(40, inner * 1.8),
            transform: box.textAbove ? 'translate(-50%, calc(-100% - 6px))' : 'translate(-50%, -50%)',
          }}
        >
          {centre.value !== '' ? (
            <span
              className="font-bold tabular-nums tracking-tight text-[color:var(--lk-center-value,var(--sc-foreground))]"
              style={{ fontSize }}
            >
              {centre.value}
            </span>
          ) : null}
          {centre.label ? (
            <span className="mt-1.5 text-xs text-[color:var(--lk-center-label,var(--sc-muted-foreground))]">
              {centre.label}
            </span>
          ) : null}
        </div>
      ) : null}
      {legend ? (
        <LegendContent
          payload={rings
            .slice()
            .reverse()
            .map((g) => ({ value: g.name, color: g.fill }))}
        />
      ) : null}
    </div>
  );
};

export const ShadRadialChart = (props) => {
  const p = props.properties;
  const progress = p.mode !== 'categories';
  const format = formatter({ prefix: p.valuePrefix, suffix: p.valueSuffix });
  let rings = [];
  let centre = { value: '', label: isSet(p.centerLabel) ? String(p.centerLabel) : '' };
  if (progress) {
    const value = num(p.value);
    const maxValue = num(p.maxValue);
    const max = maxValue !== null && maxValue > 0 ? maxValue : 100;
    if (value !== null) {
      rings = [
        {
          name: centre.label || 'Value',
          value: Math.min(max, Math.max(0, value)),
          max,
          fill: seriesColor(p.colors, 0),
          row: { value, maxValue: max },
        },
      ];
      centre.value = isSet(p.centerValue) ? String(p.centerValue) : format(value);
    }
  } else {
    // The first row is the outer ring: concentric bars read from the outside in.
    rings = radialRows(p.data, p.categoryField, p.valueField)
      .map((g, i) => ({ ...g, fill: g.color ?? seriesColor(p.colors, i) }))
      .reverse();
    centre = { ...centre, value: isSet(p.centerValue) ? String(p.centerValue) : '' };
  }
  return (
    <SafeFrame props={props} empty={!rings.length}>
      {(onDatum) => <RadialBody p={p} rings={rings} progress={progress} centre={centre} onDatum={onDatum} />}
    </SafeFrame>
  );
};

const SparkTip = ({ active, payload, format }) => {
  const point = active ? payload?.[0]?.payload : null;
  if (!point) return null;
  return (
    <div className="tj-shadcn">
      <div className="flex items-center gap-1.5 whitespace-nowrap rounded-md border bg-background px-2 py-1 text-xs shadow-md">
        <span className="text-muted-foreground">{String(point.x)}</span>
        <span className="font-mono font-medium tabular-nums">{format(point.y)}</span>
      </div>
    </div>
  );
};

export const ShadSparkline = (props) => {
  const p = props.properties;
  const points = sparkPoints(p.data);
  const last = lastPoint(points);
  const trend = trendOf(points, p.lowerIsBetter === true);
  const color =
    p.colorByTrend === true && trend !== 'flat'
      ? trend === 'up'
        ? 'var(--lk-up, var(--sc-success))'
        : 'var(--lk-down, var(--sc-destructive))'
      : 'var(--sc-chart-1)';
  const band = p.showBand === true ? bandRange(points, p.bandMin, p.bandMax) : null;
  const strokeWidth = clamp(p.strokeWidth, 0.5, 6, 2);
  const endDot = p.showEndDot !== false && last;
  const dotRadius = Math.max(2.5, strokeWidth + 1);
  const pad = endDot ? dotRadius + 1.5 : strokeWidth;
  const format = formatter({ prefix: p.valuePrefix, suffix: p.valueSuffix });
  const Chart = p.type === 'line' ? LineChart : AreaChart;
  const Series = p.type === 'line' ? Line : Area;
  const dot = endDot
    ? (d) =>
        d.index === last.i && Number.isFinite(d.cx) && Number.isFinite(d.cy) ? (
          <circle
            key="end"
            cx={d.cx}
            cy={d.cy}
            r={dotRadius}
            fill={color}
            stroke="var(--sc-background)"
            strokeWidth={1.5}
          />
        ) : (
          <g key={`dot-${d.index}`} />
        )
    : false;
  return (
    <SafeFrame props={props} small clickable={false} empty={!last} exposed={{ trend, lastValue: last ? last.y : null }}>
      {() => (
        <Chart data={points} margin={{ top: pad, bottom: pad, left: Math.max(1, strokeWidth / 2), right: pad }}>
          <defs>
            <linearGradient id={`sc-spark-${props.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="i" hide />
          <YAxis hide domain={['dataMin', 'dataMax']} />
          {band ? (
            <ReferenceArea
              y1={band.y1}
              y2={band.y2}
              fill="var(--lk-band, var(--sc-muted))"
              fillOpacity={1}
              stroke="none"
              ifOverflow="extendDomain"
            />
          ) : null}
          {p.showTooltip === true ? (
            <Tooltip
              cursor={{ stroke: 'var(--sc-border)' }}
              allowEscapeViewBox={{ x: true, y: true }}
              wrapperStyle={{ zIndex: 10 }}
              content={<SparkTip format={format} />}
            />
          ) : null}
          <Series
            dataKey="y"
            type={curveOf(p.curve)}
            stroke={color}
            strokeWidth={strokeWidth}
            fill={p.type === 'line' ? 'none' : `url(#sc-spark-${props.id})`}
            dot={dot}
            activeDot={p.showTooltip === true ? { r: dotRadius, strokeWidth: 0, fill: color } : false}
            connectNulls
            isAnimationActive={animated(p)}
          />
        </Chart>
      )}
    </SafeFrame>
  );
};

// ---- Combo ---------------------------------------------------------------------------------------------------------

/** Width of a value axis for the given values under the given tick formatter. */
const axisWidthFor = (values, tick) => {
  if (!values.length) return 40;
  const longest = Math.max(...[Math.max(...values), Math.min(...values)].map((v) => String(tick(v)).length));
  return Math.min(96, Math.max(32, longest * 7 + 10));
};

export const ShadComboChart = (props) => {
  const p = props.properties;
  const named = comboSeries(p.barFields, p.lineFields, p.rightAxisFields);
  const { x: xField } = resolveChartFields(list(p.data), isSet(p.xField) ? String(p.xField) : undefined, []);
  const series = named.filter((s) => list(p.data).some((row) => row && typeof row === 'object' && s.field in row));
  const rows = seriesRows(
    p.data,
    xField,
    series.map((s) => s.field)
  ).slice(0, MAX_BARS);
  const compact = isCompactChart(props.height);
  const left = formatter(valueFormat(p), true);
  const right = formatter({ format: p.rightAxisFormat, currency: p.currency }, true);
  const leftFull = formatter(valueFormat(p), false);
  const rightFull = formatter({ format: p.rightAxisFormat, currency: p.currency }, false);
  const rightKeys = new Set(series.filter((s) => s.axis === 'right').map((s) => s.field));
  const hasRight = rightKeys.size > 0;
  const valuesOn = (axis) =>
    rows.flatMap((r) => series.filter((s) => s.axis === axis).map((s) => r[s.field])).filter((v) => v !== null);
  const stackedBars = p.stackBars === true;
  const leftValues = stackedBars
    ? [
        ...rows.map((r) =>
          series.filter((s) => s.kind === 'bar' && s.axis === 'left').reduce((sum, s) => sum + (r[s.field] ?? 0), 0)
        ),
        ...valuesOn('left'),
      ]
    : valuesOn('left');
  const tipFormat = (v, key) => (rightKeys.has(key) ? rightFull(v) : leftFull(v));
  const color = (i) => seriesColor(p.colors, i);
  const curve = curveOf(p.curve);
  return (
    <SafeFrame
      props={props}
      empty={
        !series.length ||
        !hasValues(
          rows,
          series.map((s) => s.field)
        )
      }
    >
      {(onDatum) => (
        <ComposedChart
          data={rows}
          accessibilityLayer
          margin={{ left: 4, right: hasRight ? 4 : 12, top: 12 }}
          onClick={(e) => onDatum(e?.activePayload?.[0]?.payload)}
        >
          {p.showGrid !== false && !compact ? <CartesianGrid vertical={false} stroke={GRID} /> : null}
          <XAxis dataKey={xField} {...AXIS} hide={compact} minTickGap={16} tickFormatter={dateTicks(rows, xField)} />
          <YAxis yAxisId="left" {...AXIS} hide={compact} width={axisWidthFor(leftValues, left)} tickFormatter={left} />
          {hasRight ? (
            <YAxis
              yAxisId="right"
              orientation="right"
              {...AXIS}
              hide={compact}
              width={axisWidthFor(valuesOn('right'), right)}
              tickFormatter={right}
            />
          ) : null}
          <Tooltip cursor={{ fill: 'var(--sc-muted)', fillOpacity: 0.6 }} content={<ComboTip format={tipFormat} />} />
          {p.showLegend !== false && !compact ? <Legend content={<LegendContent />} /> : null}
          {series.map((s, i) =>
            s.kind === 'bar' ? (
              <Bar
                key={s.field}
                yAxisId={s.axis}
                dataKey={s.field}
                name={seriesLabel(s.field, p.seriesLabels)}
                fill={color(i)}
                radius={stackedBars ? 0 : [4, 4, 0, 0]}
                stackId={stackedBars ? 'bars' : undefined}
                maxBarSize={56}
                isAnimationActive={animated(p)}
              />
            ) : (
              <Line
                key={s.field}
                yAxisId={s.axis}
                dataKey={s.field}
                name={seriesLabel(s.field, p.seriesLabels)}
                type={curve}
                stroke={color(i)}
                strokeWidth={clamp(p.strokeWidth, 0.5, 12, 2)}
                dot={p.showDots !== false ? { r: 3, fill: color(i), strokeWidth: 0 } : false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                isAnimationActive={animated(p)}
              />
            )
          )}
        </ComposedChart>
      )}
    </SafeFrame>
  );
};

const ComboTip = ({ active, payload, label, format }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tj-shadcn">
      <div className="grid min-w-[8rem] gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
        {label !== undefined ? <div className="font-medium">{String(label)}</div> : null}
        {payload.map((item) => (
          <div key={item.dataKey ?? item.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: item.color }} />
            <span className="flex-1 text-muted-foreground">{String(item.name)}</span>
            <span className="font-mono font-medium tabular-nums">{format(item.value, item.dataKey)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---- Scatter -------------------------------------------------------------------------------------------------------

const ScatterTip = ({ active, payload, p, fx, fy }) => {
  const point = active ? payload?.[0]?.payload : null;
  if (!point) return null;
  const label = (key, fallback) => (isSet(p[key]) ? String(p[key]) : fallback);
  return (
    <div className="tj-shadcn">
      <div className="grid min-w-[8rem] gap-1 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
        {point.label ? <div className="font-medium">{String(point.label)}</div> : null}
        {[
          [label('xLabel', seriesLabel(p.xField)), fx(point.x)],
          [label('yLabel', seriesLabel(p.yField)), fy(point.y)],
          ...(point.z !== null && isSet(p.sizeField)
            ? [[label('sizeLabel', seriesLabel(p.sizeField)), full.format(point.z)]]
            : []),
        ].map(([name, value]) => (
          <div key={name} className="flex items-center gap-2">
            <span className="flex-1 text-muted-foreground">{name}</span>
            <span className="font-mono font-medium tabular-nums">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ShadScatterChart = (props) => {
  const p = props.properties;
  const groups = scatterGroups(p.data, {
    xField: p.xField,
    yField: p.yField,
    sizeField: p.sizeField,
    groupField: p.groupField,
    nameField: p.nameField,
  });
  const compact = isCompactChart(props.height);
  const fxTick = formatter({ format: p.xAxisFormat, currency: p.currency }, true);
  const fyTick = formatter(
    { format: p.yAxisFormat, currency: p.currency, prefix: p.valuePrefix, suffix: p.valueSuffix },
    true
  );
  const fx = formatter({ format: p.xAxisFormat, currency: p.currency }, false);
  const fy = formatter(
    { format: p.yAxisFormat, currency: p.currency, prefix: p.valuePrefix, suffix: p.valueSuffix },
    false
  );
  const ys = groups.flatMap((g) => g.points.map((pt) => pt.y));
  const bubbles = isSet(p.sizeField);
  const size = clamp(p.pointSize, 2, 40, 6);
  const opacity = clamp(p.fillOpacity, 0.1, 1, bubbles ? 0.6 : 0.85);
  const refX = num(p.referenceX);
  const refY = num(p.referenceY);
  const refColor = 'var(--lk-ref, var(--sc-muted-foreground))';
  const color = (i) => seriesColor(p.colors, i);
  const axisTitle = (text, axis) =>
    isSet(text) && !compact
      ? {
          value: String(text),
          position: axis === 'x' ? 'insideBottom' : 'insideLeft',
          angle: axis === 'x' ? 0 : -90,
          offset: axis === 'x' ? -2 : 10,
          style: { fill: AXIS_FILL, fontSize: 12, textAnchor: 'middle' },
        }
      : undefined;
  return (
    <SafeFrame props={props} empty={!groups.length}>
      {(onDatum) => (
        <ScatterChart margin={{ left: 4, right: 16, top: 12, bottom: isSet(p.xLabel) && !compact ? 12 : 0 }}>
          {p.showGrid !== false && !compact ? <CartesianGrid stroke={GRID} /> : null}
          <XAxis
            type="number"
            dataKey="x"
            name={String(p.xLabel || p.xField || 'x')}
            {...AXIS}
            hide={compact}
            domain={['auto', 'auto']}
            tickFormatter={fxTick}
            label={axisTitle(p.xLabel, 'x')}
          />
          <YAxis
            type="number"
            dataKey="y"
            {...AXIS}
            hide={compact}
            domain={['auto', 'auto']}
            width={axisWidthFor(ys, fyTick) + (isSet(p.yLabel) ? 18 : 0)}
            tickFormatter={fyTick}
            label={axisTitle(p.yLabel, 'y')}
          />
          {bubbles ? (
            <ZAxis type="number" dataKey="z" range={[size * 8, size * 120]} />
          ) : (
            <ZAxis range={[size * size * 3, size * size * 3]} />
          )}
          <Tooltip
            cursor={{ strokeDasharray: '3 3', stroke: 'var(--sc-border)' }}
            content={<ScatterTip p={p} fx={fx} fy={fy} />}
          />
          {p.showLegend !== false && groups.length > 1 && !compact ? <Legend content={<LegendContent />} /> : null}
          {refX !== null ? (
            <ReferenceLine x={refX} stroke={refColor} strokeDasharray="4 4" ifOverflow="extendDomain" />
          ) : null}
          {refY !== null ? (
            <ReferenceLine y={refY} stroke={refColor} strokeDasharray="4 4" ifOverflow="extendDomain" />
          ) : null}
          {groups.map((g, i) => (
            <Scatter
              key={g.name || 'points'}
              name={g.name || seriesLabel(p.yField)}
              data={g.points}
              fill={color(i)}
              fillOpacity={opacity}
              stroke={bubbles ? color(i) : 'none'}
              isAnimationActive={animated(p)}
              onClick={(pt) => onDatum(pt?.payload?.row ?? pt?.row)}
            />
          ))}
        </ScatterChart>
      )}
    </SafeFrame>
  );
};

// ---- Funnel --------------------------------------------------------------------------------------------------------

/** Stages as centred (or left-aligned) bars, widest first, with each stage's value and its conversion from the stage
 *  before (or from the first). Plain HTML rather than an SVG: labels never clip, and the bars follow the theme. */
export const ShadFunnelChart = (props) => {
  const p = props.properties;
  const { setExposedVariables, height } = props;
  const [clicked, setClicked] = useState({});
  useExposed(setExposedVariables, p, { clickedDatum: clicked });
  const stages = funnelStages(p.data, p.stageField, p.valueField).slice(0, 24);
  const format = formatter(valueFormat(p), p.yAxisFormat === 'compact');
  const base = p.conversionBase === 'first' ? 'ofFirst' : 'ofPrevious';
  const centred = p.align !== 'left';
  const showConversion = p.showConversion !== false;
  const byStage = p.colorByStage === true;
  const fade = (i) => (stages.length > 1 ? 1 - (i / (stages.length - 1)) * 0.45 : 1);
  const onStage = (stage) => {
    setClicked(stage.row);
    props.setExposedVariable?.('clickedDatum', stage.row);
    props.fireEvent?.('onClick');
  };
  const labelWidth = Math.min(180, Math.max(56, Math.max(0, ...stages.map((s) => String(s.label).length)) * 7 + 12));
  const valueWidth =
    Math.max(40, Math.max(0, ...stages.map((s) => String(format(s.value)).length)) * 7.5 + 4) +
    (showConversion ? 52 : 0);
  const empty = !stages.length || stages.every((s) => s.value === null);
  const emptyView = <EmptyChart text={String(p.emptyText || 'No data')} />;
  return (
    <Shell {...props}>
      <div style={{ height }} className="w-full overflow-hidden text-xs">
        {empty ? (
          emptyView
        ) : (
          <ChartBoundary resetKey={p} fallback={emptyView}>
            <div className="flex h-full flex-col justify-center gap-1.5 py-1">
              {stages.map((stage, i) => {
                const conversion = i > 0 ? stage[base] : null;
                return (
                  <button
                    type="button"
                    key={`${stage.label}-${i}`}
                    onClick={() => onStage(stage)}
                    className="group flex min-h-0 w-full flex-1 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sc-ring)]"
                    style={{ maxHeight: 52 }}
                  >
                    <span
                      className="shrink-0 truncate text-[13px] text-[color:var(--lk-axis,var(--sc-muted-foreground))]"
                      style={{ width: labelWidth }}
                      title={String(stage.label)}
                    >
                      {String(stage.label)}
                    </span>
                    <span
                      className={cn(
                        'flex h-full min-w-0 flex-1 items-center',
                        centred ? 'justify-center' : 'justify-start'
                      )}
                    >
                      <span
                        className="h-full min-h-[10px] rounded-[6px] transition-opacity group-hover:opacity-90"
                        style={{
                          width: `${Math.max(stage.value ? 1.5 : 0, stage.width * 100)}%`,
                          background: byStage ? seriesColor(p.colors, i) : seriesColor(p.colors, 0),
                          opacity: byStage ? 1 : fade(i),
                          // Animate: each bar grows in from its anchor, a stage after the one above it.
                          ...(animated(p)
                            ? {
                                animation: `tj-funnel-grow 600ms ease-out ${i * 60}ms both`,
                                transformOrigin: centred ? 'center' : 'left',
                              }
                            : {}),
                        }}
                      />
                    </span>
                    <span
                      className="flex shrink-0 items-baseline justify-end gap-2 tabular-nums"
                      style={{ width: valueWidth }}
                    >
                      <span className="text-[13px] font-medium text-[color:var(--sc-foreground)]">
                        {format(stage.value)}
                      </span>
                      {showConversion ? (
                        <span className="w-[44px] text-right text-[color:var(--sc-muted-foreground)]">
                          {conversion === null ? '' : `${conversion}%`}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </ChartBoundary>
        )}
      </div>
    </Shell>
  );
};
