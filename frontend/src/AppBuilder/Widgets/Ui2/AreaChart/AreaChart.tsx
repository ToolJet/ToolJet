import React, { useMemo } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import { withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { curveOf, hiddenNote, MAX_ROWS } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import {
  animated,
  AXIS,
  ChartFrame,
  dateTicks,
  GRID,
  isCompactChart,
  useAffixes,
  withChartRecovery,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartParts';
import {
  seriesSetup,
  tooltipAndLegend,
  useSeriesInputs,
  valueAxis,
} from '@/AppBuilder/Widgets/Ui2/_charts/cartesianParts';
import { list } from '@/AppBuilder/Widgets/Ui2/_shared/values';

export const ShadAreaChart = (props: WidgetProps) => {
  const p = props.properties;
  const { bound, yFields, seriesLabels, colors } = useSeriesInputs(p);
  const affixes = useAffixes(p);
  const stacked = p.stack === true && p.lineOnly !== true;
  // Rows, series, colours and the value axis are worked out again only when what they read changes, not on every
  // render of the widget (a hover, a sibling's exposed value).
  const { data, setup, xTicks } = useMemo(() => {
    const rows = list(bound).slice(0, MAX_ROWS);
    const fields = seriesSetup(rows, { xField: p.xField, yFields, seriesLabels, colors, affixes, stacked });
    return { data: rows, setup: fields, xTicks: dateTicks(rows, fields.xField) };
  }, [bound, p.xField, yFields, seriesLabels, colors, affixes, stacked]);
  const { xField, series, names, fills } = setup;
  const Chart = p.lineOnly === true ? LineChart : AreaChart;
  const compact = isCompactChart(props.height);
  return (
    <ChartFrame
      props={props}
      empty={!data.length || !series.length}
      notes={[setup.fieldNote, hiddenNote(list(bound).length - data.length, 'row')]}
    >
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
          {valueAxis(setup, compact)}
          {tooltipAndLegend(
            setup.full,
            { stroke: 'var(--sc-border)' },
            p.showLegend === true && series.length > 1 && !compact
          )}
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
                isAnimationActive={animated(p, data.length)}
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
                isAnimationActive={animated(p, data.length)}
              />
            )
          )}
        </Chart>
      )}
    </ChartFrame>
  );
};

export default withControlState(withChartRecovery(ShadAreaChart));
