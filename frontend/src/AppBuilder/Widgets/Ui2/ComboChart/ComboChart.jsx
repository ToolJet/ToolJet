import React from 'react';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, Tooltip, XAxis, YAxis } from 'recharts';
import { list, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { seriesColor } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import {
  clamp,
  curveOf,
  formatter,
  hasValues,
  isSet,
  seriesRows,
  resolveChartFields,
  seriesLabel,
  percentScale,
  wholeNumbers,
  seriesLabelMap,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import { comboSeries } from './comboModel';
import {
  AXIS,
  GRID,
  LegendContent,
  MAX_BARS,
  SafeFrame,
  animated,
  axisWidthFor,
  dateTicks,
  isCompactChart,
  scaled,
  valueFormat,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartParts';

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
  const valuesOn = (axis) =>
    rows.flatMap((r) => series.filter((s) => s.axis === axis).map((s) => r[s.field])).filter((v) => v !== null);
  // A rate sent as a fraction (a 39% margin as 0.39) reads as a percent, not 0.4%.
  const leftScale = percentScale(p.yAxisFormat, valuesOn('left'));
  const rightScale = percentScale(p.rightAxisFormat, valuesOn('right'));
  const left = scaled(formatter(valueFormat(p), true), leftScale);
  const right = scaled(formatter({ format: p.rightAxisFormat, currency: p.currency }, true), rightScale);
  const leftFull = scaled(formatter(valueFormat(p), false), leftScale);
  const rightFull = scaled(formatter({ format: p.rightAxisFormat, currency: p.currency }, false), rightScale);
  const rightKeys = new Set(series.filter((s) => s.axis === 'right').map((s) => s.field));
  const leftFields = series.filter((s) => s.axis !== 'right').map((s) => s.field);
  const hasRight = rightKeys.size > 0;
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
          <YAxis
            yAxisId="left"
            {...AXIS}
            hide={compact}
            width={axisWidthFor(leftValues, left)}
            tickFormatter={left}
            allowDecimals={!wholeNumbers(rows, leftFields)}
          />
          {hasRight ? (
            <YAxis
              yAxisId="right"
              orientation="right"
              {...AXIS}
              hide={compact}
              width={axisWidthFor(valuesOn('right'), right)}
              tickFormatter={right}
              allowDecimals={!wholeNumbers(rows, [...rightKeys])}
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
                name={seriesLabel(
                  s.field,
                  seriesLabelMap(
                    p.seriesLabels,
                    named.map((n) => n.field)
                  )
                )}
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
                name={seriesLabel(
                  s.field,
                  seriesLabelMap(
                    p.seriesLabels,
                    named.map((n) => n.field)
                  )
                )}
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

export const ComboTip = ({ active, payload, label, format }) => {
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

export default withControlState(ShadComboChart);
