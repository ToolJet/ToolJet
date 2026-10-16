import React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Tooltip, XAxis, YAxis } from 'recharts';
import { list, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { seriesColor } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import {
  isSet,
  resolveChartFields,
  seriesLabel,
  statusColors,
  highlightIndexes,
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
  MAX_BARS,
  dateTicks,
  fmt,
  isCompactChart,
  seriesOf,
  valueAxisWidth,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartParts';

/** A category name as at most `lines` lines of `max` characters, broken at spaces; what still does not fit ends in an
 *  ellipsis. Recharts dropped every other name of an 8-bar chart rather than wrap them (expense build, 2026-10-12). */
export const wrapLabel = (value, max, lines = 2) => {
  const cut = (text) => (text.length > max ? `${text.slice(0, Math.max(1, max - 1))}…` : text);
  const out = [];
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
export const keepsEveryCategory = (data, key) => !dateTicks(data, key) && list(data).length <= 24;

/** An x-axis tick that wraps its name to the width of one band (the axis width over the ticks shown). */
export const CategoryTick = ({ x, y, payload, width, visibleTicksCount, angled }) => {
  if (angled) {
    // Drawn at an angle, whole up to 22 letters: ten one-word genres in a half-width chart were cut to "Ficti..."
    // (bookshop, 2026-10-14).
    const text = String(payload?.value ?? '');
    return (
      <text
        x={x}
        y={y + 8}
        textAnchor="end"
        fill={AXIS.tick.fill}
        fontSize={12}
        transform={`rotate(-35, ${x}, ${y + 8})`}
      >
        {text.length > 22 ? `${text.slice(0, 21)}…` : text}
        <title>{text}</title>
      </text>
    );
  }
  const band = (Number(width) || 0) / Math.max(1, Number(visibleTicksCount) || 1);
  const lines = wrapLabel(payload?.value, Math.max(4, Math.floor((band - 6) / 6.6)));
  return (
    <text x={x} y={y + 4} textAnchor="middle" fill={AXIS.tick.fill} fontSize={12}>
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
export const angledCategories = (data, key, widgetWidth) => {
  const rows = list(data);
  if (!rows.length) return false;
  const band = ((Number(widgetWidth) || 640) - 80) / rows.length;
  const longestWord = Math.max(
    0,
    ...rows.flatMap((row) =>
      String(row?.[key] ?? '')
        .split(/\s+/)
        .map((w) => w.length)
    )
  );
  return longestWord * 6.6 > band - 6;
};

/** Room under the bars for two lines when some name will not fit one line of its band (assuming a 560px plot), or for
 *  names at an angle. */
export const categoryAxisHeight = (data, key, angled = false) => {
  const rows = list(data);
  if (angled) {
    const longest = Math.min(22, Math.max(0, ...rows.map((row) => String(row?.[key] ?? '').length)));
    return Math.min(96, Math.ceil(longest * 6.6 * 0.58 + 22));
  }
  const longest = Math.max(0, ...rows.map((row) => String(row?.[key] ?? '').length));
  return longest * 6.6 > 560 / Math.max(1, rows.length) - 6 ? 44 : 30;
};

export const categoryAxisWidth = (data, key) => {
  const longest = Math.max(0, ...list(data).map((row) => String(row?.[key] ?? '').length));
  return Math.min(180, Math.max(48, longest * 7 + 16));
};

export const ShadBarChart = (props) => {
  const p = props.properties;
  const data = list(p.data).slice(0, MAX_BARS);
  const { x: xField, series } = resolveChartFields(data, p.xField, seriesOf(p));
  const horizontal = p.horizontal === true;
  const compact = isCompactChart(props.height);
  const states = isSet(p.colors)
    ? null
    : statusColors(series.map((s) => seriesLabel(s, seriesLabelMap(p.seriesLabels, series))));
  const color = (i) => states?.[i] ?? seriesColor(p.colors, i);
  // Highlight: the picked bars keep the series colour (or the Highlight color style), the rest draw muted (the Muted
  // bar color style, else the series colour faded), so one month or one site stands out.
  const picked = highlightIndexes(data, xField, series, p.highlight);
  const highlightFill = isSet(props.styles?.highlightColor) ? 'var(--lk-highlight)' : null;
  const mutedFill = isSet(props.styles?.mutedColor) ? 'var(--lk-muted-bar)' : null;
  // A colour per category (categoryColors { Won: green, Lost: red }); categories it does not name keep the series'.
  const own =
    p.categoryColors && typeof p.categoryColors === 'object' && !Array.isArray(p.categoryColors)
      ? p.categoryColors
      : {};
  const categoryColor = (row) => {
    const key = row && typeof row === 'object' ? row[xField] : undefined;
    const v = typeof key === 'string' || typeof key === 'number' ? own[key] : undefined;
    return typeof v === 'string' && v.trim() ? v : null;
  };
  const colored = data.some((row) => categoryColor(row));
  const cells = (i) =>
    !picked && colored
      ? data.map((row, d) => <Cell key={d} fill={categoryColor(row) || color(i)} />)
      : picked
      ? data.map((_, d) =>
          picked.has(d) ? (
            <Cell key={d} fill={highlightFill || color(i)} />
          ) : (
            <Cell key={d} fill={mutedFill || color(i)} fillOpacity={mutedFill ? 1 : 0.32} />
          )
        )
      : null;
  return (
    <ChartFrame props={props} empty={!data.length || !series.length}>
      {(onDatum) => (
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          // Names drawn at an angle reach left of their bar: the first one was cut ("me & Mystery", bookshop sales).
          margin={{ left: !horizontal && angledCategories(data, xField, props.width) ? 28 : 4, right: 12, top: 12 }}
          onClick={(e) => onDatum(e?.activePayload?.[0]?.payload)}
        >
          {compact ? null : <CartesianGrid vertical={horizontal} horizontal={!horizontal} stroke={GRID} />}
          {horizontal ? (
            <>
              <XAxis
                type="number"
                {...AXIS}
                hide={compact}
                tickFormatter={fmt(p, true)}
                allowDecimals={!wholeNumbers(data, series)}
                {...wholeTicks(data, series, p.stack === true)}
              />
              <YAxis
                type="category"
                dataKey={xField}
                {...AXIS}
                hide={compact}
                width={categoryAxisWidth(data, xField)}
                // Every bar keeps its name: Recharts thinned the labels of a 6-bar chart to every other one. Past a dozen
                // bars the names can outnumber the lines the chart has room for (26 reps in 240px printed over each
                // other), so every nth name shows, as many as fit.
                // Every name while each bar has a line of its own (about 15px): a 14-region chart with room for all of
                // them showed every other one (wine cellar, 2026-10-14).
                interval={
                  data.length <= 12 || (Number(props.height) - 60) / data.length >= 15 ? 0 : 'equidistantPreserveStart'
                }
                minTickGap={2}
              />
            </>
          ) : (
            <>
              {keepsEveryCategory(data, xField) ? (
                <XAxis
                  dataKey={xField}
                  {...AXIS}
                  hide={compact}
                  interval={0}
                  height={categoryAxisHeight(data, xField, angledCategories(data, xField, props.width))}
                  tick={<CategoryTick angled={angledCategories(data, xField, props.width)} />}
                />
              ) : (
                <XAxis
                  dataKey={xField}
                  {...AXIS}
                  hide={compact}
                  minTickGap={16}
                  tickFormatter={dateTicks(data, xField)}
                />
              )}
              <YAxis
                {...AXIS}
                hide={compact}
                width={valueAxisWidth(data, series, fmt(p, true), p.stack === true)}
                tickFormatter={fmt(p, true)}
                allowDecimals={!wholeNumbers(data, series)}
                {...wholeTicks(data, series, p.stack === true)}
              />
            </>
          )}
          <Tooltip cursor={{ fill: 'var(--sc-muted)' }} content={<ChartTooltip format={fmt(p, false)} />} />
          {p.showLegend === true && series.length > 1 && !compact ? <Legend content={<LegendContent />} /> : null}
          {series.map((s, i) => (
            <Bar
              key={s}
              dataKey={s}
              name={seriesLabel(s, seriesLabelMap(p.seriesLabels, series))}
              fill={color(i)}
              radius={p.stack === true ? 0 : horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              stackId={p.stack === true ? 'a' : undefined}
            >
              {cells(i)}
            </Bar>
          ))}
        </BarChart>
      )}
    </ChartFrame>
  );
};

export default withControlState(ShadBarChart);
