import React, { useMemo } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import { useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { hiddenNote, highlightIndexes, type Row } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import {
  animated,
  AXIS,
  ChartFrame,
  dateTicks,
  GRID,
  isCompactChart,
  MAX_BARS,
  useAffixes,
  withChartRecovery,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartParts';
import {
  seriesSetup,
  tooltipAndLegend,
  useSeriesInputs,
  valueAxis,
} from '@/AppBuilder/Widgets/Ui2/_charts/cartesianParts';
import { isRecord, isSet, list } from '@/AppBuilder/Widgets/Ui2/_shared/values';

/** A category name as at most `lines` lines of `max` characters, broken at spaces; what still does not fit ends in an
 *  ellipsis. Recharts dropped every other name of an 8-bar chart rather than wrap them. */
export const wrapLabel = (value: unknown, max: number, lines = 2): string[] => {
  const cut = (text: string) => (text.length > max ? `${text.slice(0, Math.max(1, max - 1))}…` : text);
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
  // The last line carries the rest of the name, so it ends in an ellipsis where the name was cut.
  return [...out.slice(0, lines - 1), out.slice(lines - 1).join(' ')].map(cut);
};

/** A bar chart over categories (not dates) of up to 24 bars names every bar. */
export const keepsEveryCategory = (data: unknown, key: string | undefined): boolean =>
  !dateTicks(data, key) && list(data).length <= 24;

/** An x-axis tick that wraps its name to the width of one band (the axis width over the ticks shown). */
/** The props Recharts gives a custom tick (it clones the element with them), and whether names draw at an angle. */
interface CategoryTickProps {
  x?: number;
  y?: number;
  payload?: { value?: unknown };
  width?: number;
  visibleTicksCount?: number;
  angled: boolean;
}

export const CategoryTick = ({ x, y, payload, width, visibleTicksCount, angled }: CategoryTickProps) => {
  if (angled) {
    // Drawn at an angle, whole up to 22 letters: ten one-word genres in a half-width chart were cut to "Ficti...".
    const text = String(payload?.value ?? '');
    return (
      <text
        x={x}
        y={Number(y) + 8}
        textAnchor="end"
        fill={AXIS.tick.fill}
        fontSize={12}
        transform={`rotate(-35, ${x}, ${Number(y) + 8})`}
      >
        {text.length > 22 ? `${text.slice(0, 21)}…` : text}
        <title>{text}</title>
      </text>
    );
  }
  const band = (Number(width) || 0) / Math.max(1, Number(visibleTicksCount) || 1);
  const lines = wrapLabel(payload?.value, Math.max(4, Math.floor((band - 6) / 6.6)));
  return (
    <text x={x} y={Number(y) + 4} textAnchor="middle" fill={AXIS.tick.fill} fontSize={12}>
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? '0.71em' : '1.2em'}>
          {line}
        </tspan>
      ))}
      <title>{String(payload?.value ?? '')}</title>
    </text>
  );
};

/** Category names drawn at an angle: when a word of some name is wider than its band, it could only be cut. The plot is
 *  the widget less about 80px of value axis and margins. */
export const angledCategories = (data: unknown, key: string | undefined, widgetWidth: unknown): boolean => {
  const rows = list(data);
  if (!rows.length) return false;
  const band = ((Number(widgetWidth) || 640) - 80) / rows.length;
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

/** Room under the bars for two lines when some name will not fit one line of its band (assuming a 560px plot), or for
 *  names at an angle. */
export const categoryAxisHeight = (data: unknown, key: string | undefined, angled = false): number => {
  const rows = list(data);
  if (angled) {
    const longest = Math.min(22, Math.max(0, ...rows.map((row) => String(row?.[String(key)] ?? '').length)));
    return Math.min(96, Math.ceil(longest * 6.6 * 0.58 + 22));
  }
  const longest = Math.max(0, ...rows.map((row) => String(row?.[String(key)] ?? '').length));
  return longest * 6.6 > 560 / Math.max(1, rows.length) - 6 ? 44 : 30;
};

export const categoryAxisWidth = (data: unknown, key: string | undefined): number => {
  const longest = Math.max(0, ...list(data).map((row) => String(row?.[String(key)] ?? '').length));
  return Math.min(180, Math.max(48, longest * 7 + 16));
};

/** A colour per category (categoryColors { Won: green, Lost: red }): the colour named for each row's category, or null
 *  where it names none (the row keeps the series' colour). */
export const categoryFills = (
  data: unknown[],
  xField: string | undefined,
  categoryColors: unknown
): (string | null)[] => {
  const own: Row = isRecord(categoryColors) ? categoryColors : {};
  return data.map((row) => {
    const key = row && typeof row === 'object' ? (row as Row)[String(xField)] : undefined;
    const v = typeof key === 'string' || typeof key === 'number' ? own[key] : undefined;
    return typeof v === 'string' && v.trim() ? v : null;
  });
};

export const ShadBarChart = (props: WidgetProps) => {
  const p = props.properties;
  const { bound, yFields, seriesLabels, colors } = useSeriesInputs(p);
  const highlight = useStable(p.highlight);
  const categoryColors = useStable(p.categoryColors);
  const affixes = useAffixes(p);
  const stacked = p.stack === true;
  // Rows, series, colours and the value axis are worked out again only when what they read changes, not on every
  // render of the widget (a hover, a sibling's exposed value).
  const { data, setup, picked, rowFills } = useMemo(() => {
    const rows = list(bound).slice(0, MAX_BARS);
    const fields = seriesSetup(rows, { xField: p.xField, yFields, seriesLabels, colors, affixes, stacked });
    return {
      data: rows,
      setup: fields,
      picked: highlightIndexes(rows, fields.xField, fields.series, highlight),
      rowFills: categoryFills(rows, fields.xField, categoryColors),
    };
  }, [bound, p.xField, yFields, seriesLabels, colors, highlight, categoryColors, affixes, stacked]);
  const { xField, series, names, fills, tick, allowDecimals, ticks } = setup;
  // The category axis: whether names are drawn at an angle depends on the widget's width as well.
  const categoryAxis = useMemo(() => {
    const angled = angledCategories(data, xField, props.width);
    return {
      angled,
      everyName: keepsEveryCategory(data, xField),
      height: categoryAxisHeight(data, xField, angled),
      width: categoryAxisWidth(data, xField),
      dates: dateTicks(data, xField),
    };
  }, [data, xField, props.width]);
  const horizontal = p.horizontal === true;
  const compact = isCompactChart(props.height);
  // Highlight: the picked bars keep the series colour (or the Highlight color style), the rest draw muted (the Muted
  // bar color style, else the series colour faded), so one month or one site stands out.
  const highlightFill = isSet(props.styles?.highlightColor) ? 'var(--lk-highlight)' : null;
  const mutedFill = isSet(props.styles?.mutedColor) ? 'var(--lk-muted-bar)' : null;
  const colored = rowFills.some(Boolean);
  const cells = (i: number) =>
    !picked && colored
      ? rowFills.map((fill, d) => <Cell key={d} fill={fill || fills[i]} />)
      : picked
      ? data.map((_, d) =>
          picked.has(d) ? (
            <Cell key={d} fill={highlightFill || fills[i]} />
          ) : (
            <Cell key={d} fill={mutedFill || fills[i]} fillOpacity={mutedFill ? 1 : 0.32} />
          )
        )
      : null;
  return (
    <ChartFrame
      props={props}
      empty={!data.length || !series.length}
      notes={[setup.fieldNote, hiddenNote(list(bound).length - data.length, 'bar')]}
    >
      {(onDatum) => (
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          // Names drawn at an angle reach left of their bar: the first one was cut ("me & Mystery").
          margin={{ left: !horizontal && categoryAxis.angled ? 28 : 4, right: 12, top: 12 }}
          onClick={(e) => onDatum(e?.activePayload?.[0]?.payload)}
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
                dataKey={xField}
                {...AXIS}
                hide={compact}
                width={categoryAxis.width}
                // Every bar keeps its name: Recharts thinned the labels of a 6-bar chart to every other one. Past a dozen
                // bars the names can outnumber the lines the chart has room for (26 reps in 240px printed over each
                // other), so every nth name shows, as many as fit.
                // Every name while each bar has a line of its own (about 15px): a 14-region chart with room for all of
                // them showed every other one.
                interval={
                  data.length <= 12 || (Number(props.height) - 60) / data.length >= 15 ? 0 : 'equidistantPreserveStart'
                }
                minTickGap={2}
              />
            </>
          ) : (
            <>
              {categoryAxis.everyName ? (
                <XAxis
                  dataKey={xField}
                  {...AXIS}
                  hide={compact}
                  interval={0}
                  height={categoryAxis.height}
                  tick={<CategoryTick angled={categoryAxis.angled} />}
                />
              ) : (
                <XAxis dataKey={xField} {...AXIS} hide={compact} minTickGap={16} tickFormatter={categoryAxis.dates} />
              )}
              {valueAxis(setup, compact)}
            </>
          )}
          {tooltipAndLegend(
            setup.full,
            { fill: 'var(--sc-muted)' },
            p.showLegend === true && series.length > 1 && !compact
          )}
          {series.map((s, i) => (
            <Bar
              key={s}
              dataKey={s}
              name={names[i]}
              fill={fills[i]}
              radius={stacked ? 0 : horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              stackId={stacked ? 'a' : undefined}
              isAnimationActive={animated(p, data.length)}
            >
              {cells(i)}
            </Bar>
          ))}
        </BarChart>
      )}
    </ChartFrame>
  );
};

export default withControlState(withChartRecovery(ShadBarChart));
