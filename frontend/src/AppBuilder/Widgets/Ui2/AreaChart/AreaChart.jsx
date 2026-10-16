import React from 'react';
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { list, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { seriesColor } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import {
  curveOf,
  isSet,
  resolveChartFields,
  seriesLabel,
  statusColors,
  MAX_ROWS,
  wholeNumbers,
  wholeTicks,
  seriesLabelMap,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import {
  AXIS,
  ChartFrame,
  ChartTooltip,
  GRID,
  LegendContent,
  dateTicks,
  fmt,
  isCompactChart,
  seriesOf,
  valueAxisWidth,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartParts';

export const ShadAreaChart = (props) => {
  const p = props.properties;
  const data = list(p.data).slice(0, MAX_ROWS);
  const { x: xField, series } = resolveChartFields(data, p.xField, seriesOf(p));
  const Chart = p.lineOnly === true ? LineChart : AreaChart;
  const compact = isCompactChart(props.height);
  const states = isSet(p.colors)
    ? null
    : statusColors(series.map((s) => seriesLabel(s, seriesLabelMap(p.seriesLabels, series))));
  const color = (i) => states?.[i] ?? seriesColor(p.colors, i);
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
            allowDecimals={!wholeNumbers(data, series)}
            {...wholeTicks(data, series, p.stack === true && p.lineOnly !== true)}
          />
          <Tooltip cursor={{ stroke: 'var(--sc-border)' }} content={<ChartTooltip format={fmt(p, false)} />} />
          {p.showLegend === true && series.length > 1 && !compact ? <Legend content={<LegendContent />} /> : null}
          {series.map((s, i) =>
            p.lineOnly === true ? (
              <Line
                key={s}
                dataKey={s}
                name={seriesLabel(s, seriesLabelMap(p.seriesLabels, series))}
                type={curveOf(p.curve)}
                stroke={color(i)}
                strokeWidth={2}
                dot={false}
              />
            ) : (
              <Area
                key={s}
                dataKey={s}
                name={seriesLabel(s, seriesLabelMap(p.seriesLabels, series))}
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

export default withControlState(ShadAreaChart);
