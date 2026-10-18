import React, { useMemo } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, Tooltip, XAxis, YAxis } from 'recharts';
import { useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { seriesColor } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import {
  curveOf,
  fieldNote,
  hasValues,
  hiddenNote,
  seriesRows,
  resolveChartFields,
  seriesLabel,
  percentScale,
  wholeNumbers,
  seriesLabelMap,
  seriesSlots,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import { comboSeries } from './comboModel';
import {
  AXIS,
  ChartTooltip,
  GRID,
  LegendContent,
  MAX_BARS,
  SafeFrame,
  animated,
  axisWidthFor,
  dateTicks,
  isCompactChart,
  scaled,
  useValueFormat,
  withChartRecovery,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartParts';
import { clamp, isRecord, isSet, list } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { formatter } from '@/AppBuilder/Widgets/Ui2/_shared/format';

export const ShadComboChart = (props: WidgetProps) => {
  const p = props.properties;
  const bound = useStable(p.data);
  const barFields = useStable(p.barFields);
  const lineFields = useStable(p.lineFields);
  const rightAxisFields = useStable(p.rightAxisFields);
  const seriesLabels = useStable(p.seriesLabels);
  const colors = useStable(p.colors);
  const format = useValueFormat(p);
  const stackedBars = p.stackBars === true;
  // Rows, series, colours and both value axes are worked out again only when what they read changes, not on every
  // render of the widget (a hover, a sibling's exposed value).
  const {
    xField,
    series,
    rows,
    notes,
    empty,
    names,
    fills,
    hasRight,
    left,
    right,
    leftWidth,
    rightWidth,
    leftDecimals,
    rightDecimals,
    xTicks,
    tipFormat,
  } = useMemo(() => {
    const named = comboSeries(barFields, lineFields, rightAxisFields);
    // The fields are read from the rows drawn, the first MAX_BARS.
    const drawn = list(bound).filter(isRecord).slice(0, MAX_BARS);
    const fields = resolveChartFields(drawn, isSet(p.xField) ? String(p.xField) : undefined, []);
    const xField = fields.x;
    // Empty data lacks nothing (a query that has not run yet): only rows can miss a series, as in resolveChartFields.
    const lacking = drawn.length ? named.filter((s) => !drawn.some((row) => s.field in row)).map((s) => s.field) : [];
    const series = named.filter((s) => !lacking.includes(s.field));
    const rows = seriesRows(
      bound,
      xField,
      series.map((s) => s.field)
    ).slice(0, MAX_BARS);
    // seriesRows makes every series value a number or null.
    const valuesOn = (axis: 'left' | 'right') =>
      rows
        .flatMap((r) => series.filter((s) => s.axis === axis).map((s) => r[s.field]))
        .filter((v): v is number => v !== null);
    // A rate sent as a fraction (a 39% margin as 0.39) reads as a percent, not 0.4%.
    const leftScale = percentScale(format.format, valuesOn('left'));
    const rightScale = percentScale(p.rightAxisFormat, valuesOn('right'));
    const rightFormat = { format: p.rightAxisFormat, currency: format.currency };
    const left = scaled(formatter(format, true), leftScale);
    const right = scaled(formatter(rightFormat, true), rightScale);
    const leftFull = scaled(formatter(format, false), leftScale);
    const rightFull = scaled(formatter(rightFormat, false), rightScale);
    const rightKeys = new Set(series.filter((s) => s.axis === 'right').map((s) => s.field));
    const leftValues = stackedBars
      ? [
          ...rows.map((r) =>
            series
              .filter((s) => s.kind === 'bar' && s.axis === 'left')
              .reduce((sum, s) => sum + ((r[s.field] as number | null) ?? 0), 0)
          ),
          ...valuesOn('left'),
        ]
      : valuesOn('left');
    const labels = seriesLabelMap(
      seriesLabels,
      named.map((n) => n.field)
    );
    return {
      xField,
      series,
      rows,
      notes: [
        fieldNote({ missing: [...fields.missing, ...lacking], substitutes: fields.substitutes }),
        hiddenNote(list(bound).filter(isRecord).length - rows.length, 'row'),
      ],
      empty:
        !series.length ||
        !hasValues(
          rows,
          series.map((s) => s.field)
        ),
      names: series.map((s) => seriesLabel(s.field, labels)),
      fills: seriesSlots(
        named.map((n) => n.field),
        series.map((s) => s.field)
      ).map((slot) => seriesColor(colors, slot)),
      hasRight: rightKeys.size > 0,
      left,
      right,
      leftWidth: axisWidthFor(leftValues, left),
      rightWidth: axisWidthFor(valuesOn('right'), right),
      leftDecimals: !wholeNumbers(
        rows,
        series.filter((s) => s.axis !== 'right').map((s) => s.field)
      ),
      rightDecimals: !wholeNumbers(rows, [...rightKeys]),
      xTicks: dateTicks(rows, xField),
      tipFormat: (v: unknown, key: unknown) =>
        typeof key === 'string' && rightKeys.has(key) ? rightFull(v) : leftFull(v),
    };
  }, [
    bound,
    p.xField,
    barFields,
    lineFields,
    rightAxisFields,
    seriesLabels,
    colors,
    format,
    p.rightAxisFormat,
    stackedBars,
  ]);
  const compact = isCompactChart(props.height);
  const curve = curveOf(p.curve);
  return (
    <SafeFrame props={props} empty={empty} notes={notes}>
      {(onDatum) => (
        <ComposedChart
          data={rows}
          accessibilityLayer
          margin={{ left: 4, right: hasRight ? 4 : 12, top: 12 }}
          onClick={(e) => onDatum(e?.activePayload?.[0]?.payload)}
        >
          {p.showGrid !== false && !compact ? <CartesianGrid vertical={false} stroke={GRID} /> : null}
          <XAxis dataKey={xField} {...AXIS} hide={compact} minTickGap={16} tickFormatter={xTicks} />
          <YAxis
            yAxisId="left"
            {...AXIS}
            hide={compact}
            width={leftWidth}
            tickFormatter={left}
            allowDecimals={leftDecimals}
          />
          {hasRight ? (
            <YAxis
              yAxisId="right"
              orientation="right"
              {...AXIS}
              hide={compact}
              width={rightWidth}
              tickFormatter={right}
              allowDecimals={rightDecimals}
            />
          ) : null}
          <Tooltip
            cursor={{ fill: 'var(--sc-muted)', fillOpacity: 0.6 }}
            content={<ChartTooltip format={tipFormat} rowFill={false} />}
          />
          {p.showLegend !== false && !compact ? <Legend content={<LegendContent />} /> : null}
          {series.map((s, i) =>
            s.kind === 'bar' ? (
              <Bar
                key={s.field}
                yAxisId={s.axis}
                dataKey={s.field}
                name={names[i]}
                fill={fills[i]}
                radius={stackedBars ? 0 : [4, 4, 0, 0]}
                stackId={stackedBars ? 'bars' : undefined}
                maxBarSize={56}
                isAnimationActive={animated(p, rows.length)}
              />
            ) : (
              <Line
                key={s.field}
                yAxisId={s.axis}
                dataKey={s.field}
                name={names[i]}
                type={curve}
                stroke={fills[i]}
                strokeWidth={clamp(p.strokeWidth, 0.5, 12, 2)}
                dot={p.showDots !== false ? { r: 3, fill: fills[i], strokeWidth: 0 } : false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                isAnimationActive={animated(p, rows.length)}
              />
            )
          )}
        </ComposedChart>
      )}
    </SafeFrame>
  );
};

export default withControlState(withChartRecovery(ShadComboChart));
