import React from 'react';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import { list, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { seriesColor } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import {
  clamp,
  curveOf,
  fieldList,
  formatter,
  hasValues,
  isSet,
  num,
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
  ChartTooltip,
  GRID,
  LegendContent,
  SafeFrame,
  animated,
  dateTicks,
  isCompactChart,
  scaled,
  valueFormat,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartParts';

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
  const lineScale = percentScale(
    p.yAxisFormat,
    rows.flatMap((r) => series.map((s) => r[s]))
  );
  const tick = scaled(formatter(valueFormat(p), true), lineScale);
  const full = scaled(formatter(valueFormat(p), false), lineScale);
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
          <YAxis
            {...AXIS}
            hide={compact}
            width={yWidth}
            tickFormatter={tick}
            allowDecimals={!wholeNumbers(rows, series)}
            {...wholeTicks(target !== null && series.length ? [...rows, { [series[0]]: target }] : rows, series)}
          />
          <Tooltip cursor={{ stroke: 'var(--sc-border)' }} content={<ChartTooltip format={full} />} />
          {p.showLegend === true && series.length > 1 && !compact ? <Legend content={<LegendContent />} /> : null}
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
              name={seriesLabel(s, seriesLabelMap(p.seriesLabels, series))}
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

export default withControlState(ShadLineChart);
