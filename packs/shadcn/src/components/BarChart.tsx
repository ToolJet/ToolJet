import React, { useMemo } from 'react';
import { Bar, BarChart as RBarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import { ToolJet } from '@tooljet/custom-component-sdk';
import {
  AXIS,
  ChartFrame,
  CURSOR_FILL,
  GRID,
  seriesSetup,
  tooltipAndLegend,
  useBoxSize,
  useChartClick,
  valueAxis,
} from '../lib/ui2/charts/chartParts';
import {
  MAX_BARS,
  animated,
  dateTicks,
  emphasis,
  hiddenNote,
  highlightIndexes,
  isCompactChart,
  isRecord,
  isSet,
  list,
  type Row,
} from '../lib/ui2/charts/chartModel';
import { LoadingFrame, blockLook, useLoadingLook } from '../lib/ui2/loading/look';
import { TOKEN, useDrawnNumber, useThemeColor } from '../lib/styleDefaults';

const SAMPLE = [
  { month: 'Jun', revenue: 182000 },
  { month: 'Jul', revenue: 246000 },
  { month: 'Aug', revenue: 268000 },
  { month: 'Sep', revenue: 197000 },
  { month: 'Oct', revenue: 121000 },
];

/** A category name as at most `lines` lines of `max` characters, broken at spaces, the rest cut with an ellipsis. */
const wrapLabel = (value: unknown, max: number, lines = 2): string[] => {
  const cut = (t: string) => (t.length > max ? `${t.slice(0, Math.max(1, max - 1))}…` : t);
  const out: string[] = [];
  for (const word of String(value ?? '')
    .split(/\s+/)
    .filter(Boolean)) {
    const last = out[out.length - 1];
    if (last !== undefined && `${last} ${word}`.length <= max) out[out.length - 1] = `${last} ${word}`;
    else out.push(word);
  }
  if (!out.length) return [''];
  if (out.length <= lines) return out.map(cut);
  return [...out.slice(0, lines - 1), out.slice(lines - 1).join(' ')].map(cut);
};

/** An x-axis tick that wraps its name to its band, or draws it at an angle when a word would not fit. */
const CategoryTick = ({
  x,
  y,
  payload,
  width,
  visibleTicksCount,
  angled,
}: {
  x?: number;
  y?: number;
  payload?: { value?: unknown };
  width?: number;
  visibleTicksCount?: number;
  angled: boolean;
}) => {
  const full = String(payload?.value ?? '');
  if (angled)
    return (
      <text
        x={x}
        y={Number(y) + 8}
        textAnchor="end"
        fill={AXIS.tick.fill}
        fontSize={12}
        transform={`rotate(-35, ${x}, ${Number(y) + 8})`}
      >
        {full.length > 22 ? `${full.slice(0, 21)}…` : full}
        <title>{full}</title>
      </text>
    );
  const band = (Number(width) || 0) / Math.max(1, Number(visibleTicksCount) || 1);
  const lines = wrapLabel(payload?.value, Math.max(4, Math.floor((band - 6) / 6.6)));
  return (
    <text x={x} y={Number(y) + 4} textAnchor="middle" fill={AXIS.tick.fill} fontSize={12}>
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? '0.71em' : '1.2em'}>
          {line}
        </tspan>
      ))}
      <title>{full}</title>
    </text>
  );
};

const angledCategories = (rows: Row[], key: string | undefined, width: number): boolean => {
  if (!rows.length) return false;
  const band = ((width || 640) - 80) / rows.length;
  const longestWord = Math.max(
    0,
    ...rows.flatMap((row) =>
      String(row?.[String(key)] ?? '')
        .split(/\s+/)
        .map((w) => w.length)
    )
  );
  return longestWord * 6.6 > band - 6;
};

const categoryAxisHeight = (rows: Row[], key: string | undefined, angled: boolean): number => {
  const longest = Math.max(0, ...rows.map((row) => String(row?.[String(key)] ?? '').length));
  if (angled) return Math.min(96, Math.ceil(Math.min(22, longest) * 6.6 * 0.58 + 22));
  return longest * 6.6 > 560 / Math.max(1, rows.length) - 6 ? 44 : 30;
};

const categoryAxisWidth = (rows: Row[], key: string | undefined): number =>
  Math.min(180, Math.max(48, Math.max(0, ...rows.map((row) => String(row?.[String(key)] ?? '').length)) * 7 + 16));

export const BarChart = () => {
  const [data] = ToolJet.useStateArray({ name: 'data', label: 'Data', initialValue: SAMPLE });
  const [xField] = ToolJet.useStateString({ name: 'xField', label: 'X field', initialValue: 'month' });
  const [yFields] = ToolJet.useStateString({
    name: 'yFields',
    label: 'Series fields (one or many)',
    description: 'A field, a list, or comma-separated.',
    initialValue: 'revenue',
  });
  const [valuePrefix] = ToolJet.useStateString({ name: 'valuePrefix', label: 'Value prefix', initialValue: '' });
  const [valueSuffix] = ToolJet.useStateString({ name: 'valueSuffix', label: 'Value suffix', initialValue: '' });
  const [showLegend] = ToolJet.useStateBoolean({ name: 'showLegend', label: 'Legend', initialValue: false });
  const [seriesLabels] = ToolJet.useStateObject({
    name: 'seriesLabels',
    label: 'Series labels ({ field: label })',
    initialValue: {},
  });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty message', initialValue: 'No data' });
  const [colors] = ToolJet.useStateArray({ name: 'colors', label: 'Series colors (in order)', initialValue: [] });
  const [horizontal] = ToolJet.useStateBoolean({ name: 'horizontal', label: 'Horizontal bars', initialValue: false });
  const [stack] = ToolJet.useStateBoolean({ name: 'stack', label: 'Stack series', initialValue: false });
  const [highlight] = ToolJet.useStateString({
    name: 'highlight',
    label: 'Highlight (category values, or first, last, max, min)',
    description: 'Other bars are muted.',
    initialValue: '',
  });
  const [categoryColors] = ToolJet.useStateObject({
    name: 'categoryColors',
    label: 'Category colors ({ category: color })',
    initialValue: {},
  });
  const [highlightClicked] = ToolJet.useStateBoolean({
    name: 'highlightClicked',
    label: 'Highlight clicked point',
    description: 'Draws the clicked bar emphasised until Clear clicked point runs or another is clicked.',
    initialValue: false,
  });
  const click = useChartClick(highlightClicked);
  const chartColor = useThemeColor('chartColor', 'Chart color (series palette from it)', TOKEN.brand);
  const gridColor = useThemeColor('gridColor', 'Grid line color', TOKEN.border);
  const axisTextColor = useThemeColor('axisTextColor', 'Axis label color', TOKEN.mutedText);
  const legendTextColor = useThemeColor('legendTextColor', 'Legend text color', TOKEN.mutedText);
  const highlightColor = useThemeColor(
    'highlightColor',
    'Highlighted bar color (default: the series color)',
    TOKEN.brand
  );
  const mutedColor = useThemeColor(
    'mutedColor',
    'Other bars color when highlighting (default: the series color, faded)',
    TOKEN.brand
  );
  const barRadius = useDrawnNumber('barRadius', 'Bar radius', 4);
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ role: 'barchart', fit: false, loading: 'own', defaultWidth: 20, defaultHeight: 28 });
  const box = useBoxSize();

  const stacked = stack === true;
  const { rows, setup, picked, rowFills } = useMemo(() => {
    const drawn = list(data).slice(0, MAX_BARS);
    const fields = seriesSetup(drawn, {
      xField,
      yFields,
      seriesLabels,
      colors,
      chartColor,
      valuePrefix,
      valueSuffix,
      stacked,
    });
    const own: Row = isRecord(categoryColors) ? categoryColors : {};
    return {
      rows: drawn,
      setup: fields,
      picked: highlightIndexes(drawn, fields.xField, fields.series, highlight),
      rowFills: drawn.map((row) => {
        const key = isRecord(row) ? row[String(fields.xField)] : undefined;
        const v = typeof key === 'string' || typeof key === 'number' ? own[key] : undefined;
        return typeof v === 'string' && v.trim() ? v : null;
      }),
    };
  }, [
    data,
    xField,
    yFields,
    seriesLabels,
    colors,
    chartColor,
    valuePrefix,
    valueSuffix,
    stacked,
    highlight,
    categoryColors,
  ]);
  const { xField: x, series, names, fills, tick, allowDecimals, ticks } = setup;
  const angled = angledCategories(rows, x, box.width);
  const everyName = !dateTicks(rows, x) && rows.length <= 24;
  const compact = box.height > 0 && isCompactChart(box.height);
  const radius = Number(barRadius);
  const r = isSet(barRadius) && Number.isFinite(radius) ? radius : 4;
  const highlighted = click.highlighted;
  const colored = rowFills.some(Boolean);
  // Highlight: the picked bars keep the series colour (or Highlight color), the rest draw muted; a clicked bar keeps
  // its colour and the others fade, over any other highlight.
  const cells = (i: number) =>
    highlighted
      ? rows.map((row, d) => <Cell key={d} fill={rowFills[d] || fills[i]} fillOpacity={emphasis(row, highlighted)} />)
      : !picked && colored
        ? rowFills.map((fill, d) => <Cell key={d} fill={fill || fills[i]} />)
        : picked
          ? rows.map((_, d) =>
              picked.has(d) ? (
                <Cell key={d} fill={highlightColor || fills[i]} />
              ) : (
                <Cell key={d} fill={mutedColor || fills[i]} fillOpacity={mutedColor ? 1 : 0.32} />
              )
            )
          : null;

  return (
    <LoadingFrame loading={ld.loading} look={blockLook(ld.skeleton)}>
      <ChartFrame
        boxRef={box.ref}
        empty={!rows.length || !series.length}
        emptyText={emptyText}
        label="Bar chart"
        resetKey={[data, xField, yFields]}
        looks={{ '--lk-grid': gridColor, '--lk-axis': axisTextColor, '--lk-legend': legendTextColor }}
        notes={[setup.fieldNote, hiddenNote(list(data).length - rows.length, 'bar')]}
        onDoubleClick={click.doubleClick}
      >
        <RBarChart
          data={rows}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ left: !horizontal && angled ? 28 : 4, right: 12, top: 12 }}
          onClick={(e: { activePayload?: { payload?: unknown }[] } | null) =>
            click.pick(e?.activePayload?.[0]?.payload)
          }
        >
          {compact ? null : <CartesianGrid vertical={horizontal} horizontal={!horizontal} stroke={GRID} />}
          {horizontal ? (
            <>
              <XAxis
                type="number"
                {...AXIS}
                hide={compact}
                tickFormatter={tick}
                allowDecimals={allowDecimals}
                {...ticks}
              />
              <YAxis
                type="category"
                dataKey={x}
                {...AXIS}
                hide={compact}
                width={categoryAxisWidth(rows, x)}
                interval={rows.length <= 12 || (box.height - 60) / rows.length >= 15 ? 0 : 'equidistantPreserveStart'}
                minTickGap={2}
              />
            </>
          ) : (
            <>
              {everyName ? (
                <XAxis
                  dataKey={x}
                  {...AXIS}
                  hide={compact}
                  interval={0}
                  height={categoryAxisHeight(rows, x, angled)}
                  tick={<CategoryTick angled={angled} />}
                />
              ) : (
                <XAxis dataKey={x} {...AXIS} hide={compact} minTickGap={16} tickFormatter={dateTicks(rows, x)} />
              )}
              {valueAxis(setup, compact)}
            </>
          )}
          {tooltipAndLegend(setup.full, CURSOR_FILL, showLegend === true && series.length > 1 && !compact)}
          {series.map((s, i) => (
            <Bar
              key={s}
              dataKey={s}
              name={names[i]}
              fill={fills[i]}
              radius={stacked ? 0 : horizontal ? [0, r, r, 0] : [r, r, 0, 0]}
              stackId={stacked ? 'a' : undefined}
              isAnimationActive={animated(true, rows.length)}
            >
              {cells(i)}
            </Bar>
          ))}
        </RBarChart>
      </ChartFrame>
    </LoadingFrame>
  );
};
