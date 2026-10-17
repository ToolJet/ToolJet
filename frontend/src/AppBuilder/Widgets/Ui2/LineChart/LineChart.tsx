import React, { useMemo } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis } from 'recharts';
import { useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { seriesColor } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import {
  curveOf,
  fieldList,
  hasValues,
  seriesRows,
  resolveChartFields,
  seriesLabel,
  percentScale,
  wholeNumbers,
  wholeTicks,
  seriesLabelMap,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import {
  AXIS,
  GRID,
  SafeFrame,
  animated,
  dateTicks,
  isCompactChart,
  scaled,
  useValueFormat,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartParts';
import { tooltipAndLegend, useSeriesInputs, valueAxis } from '@/AppBuilder/Widgets/Ui2/_charts/cartesianParts';
import { clamp, isSet, list, num } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { formatter } from '@/AppBuilder/Widgets/Ui2/_shared/format';

export const ShadLineChart = (props: WidgetProps) => {
  const p = props.properties;
  const { bound, yFields, seriesLabels, colors } = useSeriesInputs(p);
  const dashedFields = useStable(p.dashedFields);
  const format = useValueFormat(p);
  const target = num(p.referenceValue);
  // Rows, series, colours and the value axis are worked out again only when what they read changes, not on every
  // render of the widget (a hover, a sibling's exposed value).
  const { rows, xField, series, empty, dashed, names, fills, tick, full, yWidth, allowDecimals, ticks, xTicks } =
    useMemo(() => {
      const fields = resolveChartFields(
        list(bound),
        isSet(p.xField) ? String(p.xField) : undefined,
        fieldList(yFields)
      );
      const plotted = seriesRows(bound, fields.x, fields.series);
      // seriesRows makes every series value a number or null.
      const values = plotted.flatMap((r) => fields.series.map((s) => r[s]));
      const lineScale = percentScale(format.format, values);
      const short = scaled(formatter(format, true), lineScale);
      // The y axis is as wide as its longest tick label.
      const extremes = values.filter((v): v is number => v !== null);
      if (target !== null) extremes.push(target);
      const longest = extremes.length
        ? Math.max(String(short(Math.max(...extremes))).length, String(short(Math.min(...extremes))).length)
        : 3;
      const labels = seriesLabelMap(seriesLabels, fields.series);
      return {
        rows: plotted,
        xField: fields.x,
        series: fields.series,
        empty: !fields.series.length || !hasValues(plotted, fields.series),
        dashed: fieldList(dashedFields),
        names: fields.series.map((s) => seriesLabel(s, labels)),
        fills: fields.series.map((_, i) => seriesColor(colors, i)),
        tick: short,
        full: scaled(formatter(format, false), lineScale),
        yWidth: Math.min(88, Math.max(32, longest * 7 + 10)),
        allowDecimals: !wholeNumbers(plotted, fields.series),
        ticks: wholeTicks(
          target !== null && fields.series.length ? [...plotted, { [fields.series[0]]: target }] : plotted,
          fields.series
        ),
        xTicks: dateTicks(plotted, fields.x),
      };
    }, [bound, p.xField, yFields, dashedFields, seriesLabels, colors, format, target]);
  const compact = isCompactChart(props.height);
  const targetLabel = isSet(p.referenceLabel) ? String(p.referenceLabel) : '';
  const strokeWidth = clamp(p.strokeWidth, 0.5, 12, 2);
  const curve = curveOf(p.curve);
  const refColor = 'var(--lk-ref, var(--sc-muted-foreground))';
  return (
    <SafeFrame props={props} empty={empty}>
      {(onDatum) => (
        <LineChart
          data={rows}
          accessibilityLayer
          margin={{ left: 4, right: 12, top: target !== null && targetLabel ? 20 : 8 }}
          onClick={(e) => onDatum(e?.activePayload?.[0]?.payload)}
        >
          {p.showGrid !== false && !compact ? <CartesianGrid vertical={false} stroke={GRID} /> : null}
          <XAxis dataKey={xField} {...AXIS} hide={compact} minTickGap={24} tickFormatter={xTicks} />
          {valueAxis({ yWidth, tick, allowDecimals, ticks }, compact)}
          {tooltipAndLegend(
            full,
            { stroke: 'var(--sc-border)' },
            p.showLegend === true && series.length > 1 && !compact
          )}
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
              name={names[i]}
              type={curve}
              stroke={fills[i]}
              strokeWidth={strokeWidth}
              strokeDasharray={dashed.includes(s) ? '6 4' : undefined}
              dot={p.showDots === true ? { r: 3, fill: fills[i], strokeWidth: 0 } : false}
              activeDot={{ r: 5, strokeWidth: 0 }}
              isAnimationActive={animated(p, rows.length)}
            />
          ))}
        </LineChart>
      )}
    </SafeFrame>
  );
};

export default withControlState(ShadLineChart);
