import React, { useMemo } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { list, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
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
  useAffixes,
  valueAxisWidth,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartParts';

export const ShadAreaChart = (props: WidgetProps) => {
  const p = props.properties;
  const bound = useStable(p.data);
  const yFields = useStable(p.yFields);
  const seriesLabels = useStable(p.seriesLabels);
  const colors = useStable(p.colors);
  const affixes = useAffixes(p);
  const stacked = p.stack === true && p.lineOnly !== true;
  // Rows, series, colours and the value axis are worked out again only when what they read changes, not on every
  // render of the widget (a hover, a sibling's exposed value).
  const { data, xField, series, names, fills, tick, full, xTicks, yWidth, allowDecimals, ticks } = useMemo(() => {
    const rows = list(bound).slice(0, MAX_ROWS);
    const fields = resolveChartFields(rows, p.xField, seriesOf({ yFields }));
    const labels = seriesLabelMap(seriesLabels, fields.series);
    const seriesNames = fields.series.map((s) => seriesLabel(s, labels));
    const states = isSet(colors) ? null : statusColors(seriesNames);
    const short = fmt(affixes, true);
    return {
      data: rows,
      xField: fields.x,
      series: fields.series,
      names: seriesNames,
      fills: fields.series.map((_, i) => states?.[i] ?? seriesColor(colors, i)),
      tick: short,
      full: fmt(affixes, false),
      xTicks: dateTicks(rows, fields.x),
      yWidth: valueAxisWidth(rows, fields.series, short, stacked),
      allowDecimals: !wholeNumbers(rows, fields.series),
      ticks: wholeTicks(rows, fields.series, stacked),
    };
  }, [bound, p.xField, yFields, seriesLabels, colors, affixes, stacked]);
  const Chart = p.lineOnly === true ? LineChart : AreaChart;
  const compact = isCompactChart(props.height);
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
                <stop offset="5%" stopColor={fills[i]} stopOpacity={0.6} />
                <stop offset="95%" stopColor={fills[i]} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          {compact ? null : <CartesianGrid vertical={false} stroke={GRID} />}
          <XAxis dataKey={xField} {...AXIS} hide={compact} minTickGap={24} tickFormatter={xTicks} />
          <YAxis
            {...AXIS}
            hide={compact}
            width={yWidth}
            tickFormatter={tick}
            allowDecimals={allowDecimals}
            {...ticks}
          />
          <Tooltip cursor={{ stroke: 'var(--sc-border)' }} content={<ChartTooltip format={full} />} />
          {p.showLegend === true && series.length > 1 && !compact ? <Legend content={<LegendContent />} /> : null}
          {series.map((s, i) =>
            p.lineOnly === true ? (
              <Line
                key={s}
                dataKey={s}
                name={names[i]}
                type={curveOf(p.curve)}
                stroke={fills[i]}
                strokeWidth={2}
                dot={false}
              />
            ) : (
              <Area
                key={s}
                dataKey={s}
                name={names[i]}
                type={curveOf(p.curve)}
                stroke={fills[i]}
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
