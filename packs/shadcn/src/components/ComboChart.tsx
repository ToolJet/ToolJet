import React, { useMemo } from 'react';
import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, ReferenceDot, Tooltip, XAxis, YAxis } from 'recharts';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { LOCALE_HINT } from '../lib/locale';
import {
  AXIS,
  ChartFrame,
  ChartTooltip,
  GRID,
  LegendContent,
  seriesColor,
  useBoxSize,
  useChartClick,
} from '../lib/ui2/charts/chartParts';
import {
  MAX_BARS,
  MAX_SERIES,
  animated,
  axisWidthFor,
  clamp,
  curveOf,
  dateTicks,
  emphasis,
  fieldList,
  fieldNote,
  formatter,
  hasValues,
  hiddenNote,
  isCompactChart,
  isRecord,
  isSet,
  list,
  percentScale,
  resolveChartFields,
  scaled,
  seriesLabel,
  seriesLabelMap,
  seriesRows,
  seriesSlots,
  wholeNumbers,
  type Row,
} from '../lib/ui2/charts/chartModel';
import { LoadingFrame, blockLook, useLoadingLook } from '../lib/ui2/loading/look';
import { TOKEN, useThemeColor } from '../lib/styleDefaults';

const SAMPLE = [
  { month: 'Jan', revenue: 42000, orders: 310, margin: 31 },
  { month: 'Feb', revenue: 47500, orders: 342, margin: 33 },
  { month: 'Mar', revenue: 45200, orders: 328, margin: 29 },
  { month: 'Apr', revenue: 52800, orders: 371, margin: 34 },
  { month: 'May', revenue: 58100, orders: 402, margin: 36 },
  { month: 'Jun', revenue: 61400, orders: 425, margin: 35 },
];

interface ComboSeries {
  field: string;
  kind: 'bar' | 'line';
  axis: 'left' | 'right';
}

/** The bar fields, then the line fields not already drawn as bars, each on the left axis or the right one. */
const comboSeries = (barFields: unknown, lineFields: unknown, rightFields: unknown): ComboSeries[] => {
  const bars = fieldList(barFields);
  const right = fieldList(rightFields);
  const lines = fieldList(lineFields).filter((f) => !bars.includes(f));
  return [
    ...bars.map((field): ComboSeries => ({ field, kind: 'bar', axis: right.includes(field) ? 'right' : 'left' })),
    ...lines.map((field): ComboSeries => ({ field, kind: 'line', axis: right.includes(field) ? 'right' : 'left' })),
  ].slice(0, MAX_SERIES);
};

const FORMAT_ENUM = ['number', 'currency', 'percent', 'compact'];

// Bars and lines on one chart, with an optional right axis (revenue bars and a margin % line).
export const ComboChart = () => {
  const [data] = ToolJet.useStateArray({ name: 'data', label: 'Data', initialValue: SAMPLE });
  const [xField] = ToolJet.useStateString({ name: 'xField', label: 'X field', initialValue: 'month' });
  const [barFields] = ToolJet.useStateString({
    name: 'barFields',
    label: 'Bar series (fields)',
    initialValue: 'revenue',
  });
  const [lineFields] = ToolJet.useStateString({
    name: 'lineFields',
    label: 'Line series (fields)',
    initialValue: 'margin',
  });
  const [rightAxisFields] = ToolJet.useStateString({
    name: 'rightAxisFields',
    label: 'Right axis series (fields)',
    initialValue: 'margin',
  });
  const [stackBars] = ToolJet.useStateBoolean({ name: 'stackBars', label: 'Stack bars', initialValue: false });
  const [curve] = ToolJet.useStateEnumeration({
    name: 'curve',
    label: 'Line curve',
    enumDefinition: ['monotone', 'linear', 'step'],
    initialValue: 'monotone',
    inspector: 'switch',
  });
  const [showDots] = ToolJet.useStateBoolean({ name: 'showDots', label: 'Line dots', initialValue: true });
  const [strokeWidth] = ToolJet.useStateNumber({ name: 'strokeWidth', label: 'Line width (px)', initialValue: 2 });
  const [yAxisFormat] = ToolJet.useStateEnumeration({
    name: 'yAxisFormat',
    label: 'Value format',
    enumDefinition: FORMAT_ENUM,
    initialValue: 'number',
    inspector: 'switch',
  });
  const [rightAxisFormat] = ToolJet.useStateEnumeration({
    name: 'rightAxisFormat',
    label: 'Right axis format',
    enumDefinition: FORMAT_ENUM,
    initialValue: 'percent',
    inspector: 'switch',
  });
  const [currency] = ToolJet.useStateString({ name: 'currency', label: 'Currency code', initialValue: 'USD' });
  const [locale] = ToolJet.useStateString({
    name: 'locale',
    label: 'Locale',
    description: LOCALE_HINT,
    initialValue: '',
  });
  const [valuePrefix] = ToolJet.useStateString({ name: 'valuePrefix', label: 'Value prefix', initialValue: '' });
  const [valueSuffix] = ToolJet.useStateString({ name: 'valueSuffix', label: 'Value suffix', initialValue: '' });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty message', initialValue: 'No data' });
  const [animate] = ToolJet.useStateBoolean({ name: 'animate', label: 'Animate', initialValue: true });
  const [showGrid] = ToolJet.useStateBoolean({ name: 'showGrid', label: 'Grid', initialValue: true });
  const [showLegend] = ToolJet.useStateBoolean({ name: 'showLegend', label: 'Legend', initialValue: true });
  const [seriesLabels] = ToolJet.useStateObject({
    name: 'seriesLabels',
    label: 'Series labels ({ field: label })',
    initialValue: { revenue: 'Revenue', margin: 'Margin' },
  });
  const [colors] = ToolJet.useStateArray({ name: 'colors', label: 'Series colors (in order)', initialValue: [] });
  const [highlightClicked] = ToolJet.useStateBoolean({
    name: 'highlightClicked',
    label: 'Highlight clicked point',
    description: 'Draws the clicked point or bar emphasised until Clear clicked point runs or another is clicked.',
    initialValue: false,
  });
  const click = useChartClick(highlightClicked);
  const chartColor = useThemeColor('chartColor', 'Chart color (series palette from it)', TOKEN.brand);
  const gridColor = useThemeColor('gridColor', 'Grid line color', TOKEN.border);
  const axisTextColor = useThemeColor('axisTextColor', 'Axis label color', TOKEN.mutedText);
  const legendTextColor = useThemeColor('legendTextColor', 'Legend text color', TOKEN.mutedText);
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ role: 'combochart', fit: false, loading: 'own', defaultWidth: 20, defaultHeight: 30 });
  const box = useBoxSize();

  const stacked = stackBars === true;
  const m = useMemo(() => {
    const named = comboSeries(barFields, lineFields, rightAxisFields);
    const drawn = list(data).filter(isRecord).slice(0, MAX_BARS);
    const fields = resolveChartFields(drawn, isSet(xField) ? String(xField) : undefined, []);
    const x = fields.x;
    // Empty data lacks nothing (a query that has not run yet): only rows can miss a series.
    const lacking = drawn.length ? named.filter((s) => !drawn.some((row) => s.field in row)).map((s) => s.field) : [];
    const series = named.filter((s) => !lacking.includes(s.field));
    const rows = seriesRows(
      drawn,
      x,
      series.map((s) => s.field)
    );
    const valuesOn = (axis: 'left' | 'right') =>
      rows
        .flatMap((r) => series.filter((s) => s.axis === axis).map((s) => r[s.field]))
        .filter((v): v is number => typeof v === 'number');
    // A rate sent as a fraction (0.39 for 39%) reads as a percent.
    const leftScale = percentScale(yAxisFormat, valuesOn('left'));
    const rightScale = percentScale(rightAxisFormat, valuesOn('right'));
    const leftFormat = { format: yAxisFormat, currency, locale, prefix: valuePrefix, suffix: valueSuffix };
    const rightFormat = { format: rightAxisFormat, currency, locale };
    const left = scaled(formatter(leftFormat, true), leftScale);
    const right = scaled(formatter(rightFormat, true), rightScale);
    const leftFull = scaled(formatter(leftFormat, false), leftScale);
    const rightFull = scaled(formatter(rightFormat, false), rightScale);
    const rightKeys = new Set(series.filter((s) => s.axis === 'right').map((s) => s.field));
    const leftValues = stacked
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
      x,
      series,
      rows,
      notes: [
        fieldNote({ missing: [...fields.missing, ...lacking], substitutes: fields.substitutes }),
        hiddenNote(list(data).filter(isRecord).length - rows.length, 'row'),
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
      ).map((slot) => seriesColor(colors, chartColor, slot)),
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
      xTicks: dateTicks(rows, x),
      tipFormat: (v: unknown, key: unknown) =>
        typeof key === 'string' && rightKeys.has(key) ? rightFull(v) : leftFull(v),
    };
  }, [
    data,
    xField,
    barFields,
    lineFields,
    rightAxisFields,
    seriesLabels,
    colors,
    chartColor,
    yAxisFormat,
    rightAxisFormat,
    currency,
    locale,
    valuePrefix,
    valueSuffix,
    stacked,
  ]);
  const compact = box.height > 0 && isCompactChart(box.height);
  const highlighted = click.highlighted as Row | null;
  const width = clamp(strokeWidth, 0.5, 12, 2);

  return (
    <LoadingFrame loading={ld.loading} look={blockLook(ld.skeleton)}>
      <ChartFrame
        boxRef={box.ref}
        empty={m.empty}
        emptyText={emptyText}
        label="Combo chart"
        resetKey={[data, xField, barFields, lineFields]}
        looks={{ '--lk-grid': gridColor, '--lk-axis': axisTextColor, '--lk-legend': legendTextColor }}
        notes={m.notes}
        onDoubleClick={click.doubleClick}
      >
        <ComposedChart
          data={m.rows}
          margin={{ left: 4, right: m.hasRight ? 4 : 12, top: 12 }}
          onClick={(e: { activePayload?: { payload?: unknown }[] } | null) =>
            click.pick(e?.activePayload?.[0]?.payload)
          }
        >
          {showGrid !== false && !compact ? <CartesianGrid vertical={false} stroke={GRID} /> : null}
          <XAxis dataKey={m.x} {...AXIS} hide={compact} minTickGap={16} tickFormatter={m.xTicks} />
          <YAxis
            yAxisId="left"
            {...AXIS}
            hide={compact}
            width={m.leftWidth}
            tickFormatter={m.left}
            allowDecimals={m.leftDecimals}
          />
          {m.hasRight ? (
            <YAxis
              yAxisId="right"
              orientation="right"
              {...AXIS}
              hide={compact}
              width={m.rightWidth}
              tickFormatter={m.right}
              allowDecimals={m.rightDecimals}
            />
          ) : null}
          <Tooltip
            cursor={{ fill: 'var(--ui-muted)', fillOpacity: 0.6 }}
            content={<ChartTooltip format={m.tipFormat} rowFill={false} />}
          />
          {showLegend !== false && !compact ? <Legend content={<LegendContent />} /> : null}
          {m.series.map((s, i) =>
            s.kind === 'bar' ? (
              <Bar
                key={s.field}
                yAxisId={s.axis}
                dataKey={s.field}
                name={m.names[i]}
                fill={m.fills[i]}
                radius={stacked ? 0 : [4, 4, 0, 0]}
                stackId={stacked ? 'bars' : undefined}
                maxBarSize={56}
                isAnimationActive={animated(animate, m.rows.length)}
              >
                {highlighted
                  ? m.rows.map((row, d) => <Cell key={d} fill={m.fills[i]} fillOpacity={emphasis(row, highlighted)} />)
                  : null}
              </Bar>
            ) : (
              <Line
                key={s.field}
                yAxisId={s.axis}
                dataKey={s.field}
                name={m.names[i]}
                type={curveOf(curve)}
                stroke={m.fills[i]}
                strokeWidth={width}
                dot={showDots !== false ? { r: 3, fill: m.fills[i], strokeWidth: 0 } : false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                isAnimationActive={animated(animate, m.rows.length)}
              />
            )
          )}
          {/* Highlight clicked point: the other bars fade (above) and each line's point at the clicked category is ringed. */}
          {highlighted && m.x
            ? m.series
                .filter((s) => s.kind !== 'bar' && Number.isFinite(Number(highlighted[s.field])))
                .map((s) => (
                  <ReferenceDot
                    key={`clicked-${s.field}`}
                    yAxisId={s.axis}
                    x={highlighted[m.x as string] as string}
                    y={Number(highlighted[s.field])}
                    r={6}
                    fill={m.fills[m.series.indexOf(s)]}
                    stroke="var(--ui-bg)"
                    strokeWidth={2}
                  />
                ))
            : null}
        </ComposedChart>
      </ChartFrame>
    </LoadingFrame>
  );
};
