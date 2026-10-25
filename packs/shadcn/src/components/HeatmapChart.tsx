import React, { useMemo } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { ChartBoundary, ChartNotes, EmptyChart, lookVars, useBoxSize, useChartClick } from '../lib/ui2/charts/chartParts';
import { DIMMED, axisLabel, clamp, formatter, hiddenNote, isRecord, isScalar, isSet, list, num } from '../lib/ui2/charts/chartModel';
import { LoadingFrame, blockLook, useLoadingLook } from '../lib/ui2/loading/look';
import { TOKEN, useThemeColor } from '../lib/styleDefaults';

// A heatmap past this many cells is unreadable and slow to draw.
const MAX_HEAT_COLUMNS = 60;
const MAX_HEAT_ROWS = 40;

const SAMPLE = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].flatMap((day, d) =>
  ['08', '10', '12', '14', '16', '18'].map((hour, h) => ({ day, hour: `${hour}:00`, tickets: Math.round((d < 5 ? 10 : 4) * (1 + Math.sin((h + 1) / 2)) + d) }))
);

/** The grid: column and row labels in order of first appearance (or xOrder / yOrder first), each cell the sum of the
 *  rows landing in it, the smallest and largest cell, and the labels past the drawn grid. Every row is summed. */
const heatmapGrid = (data: unknown, xField: unknown, yField: unknown, valueField: unknown, xOrder: unknown, yOrder: unknown) => {
  const field = (f: unknown) => (isScalar(f) ? String(f) : '');
  const [xf, yf, vf] = [field(xField), field(yField), field(valueField)];
  const label = (v: unknown) => (v === null || v === undefined ? '' : String(axisLabel(v)));
  const ordered = (preset: unknown, cap: number) => new Set((Array.isArray(preset) ? preset.slice(0, cap) : []).filter(isScalar).map((v) => String(v)));
  const xs = ordered(xOrder, MAX_HEAT_COLUMNS);
  const ys = ordered(yOrder, MAX_HEAT_ROWS);
  const cells = new Map<string, number>();
  const hiddenXs = new Set<string>();
  const hiddenYs = new Set<string>();
  list(data)
    .filter(isRecord)
    .forEach((row) => {
      const x = label(row[xf]);
      const y = label(row[yf]);
      const v = num(row[vf]);
      if (x === '' || y === '') return;
      if (!xs.has(x) && xs.size < MAX_HEAT_COLUMNS) xs.add(x);
      if (!ys.has(y) && ys.size < MAX_HEAT_ROWS) ys.add(y);
      if (!xs.has(x)) hiddenXs.add(x);
      if (!ys.has(y)) hiddenYs.add(y);
      if (!xs.has(x) || !ys.has(y) || v === null) return;
      const key = `${y}\u0000${x}`;
      cells.set(key, (cells.get(key) ?? 0) + v);
    });
  const values = [...cells.values()];
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  return {
    xs: [...xs],
    ys: [...ys],
    min,
    max,
    value: (y: string, x: string) => cells.get(`${y}\u0000${x}`) ?? null,
    strength: (v: number | null) => (v === null ? null : max > min ? (v - min) / (max - min) : 1),
    hidden: { columns: hiddenXs.size, rows: hiddenYs.size },
  };
};

const FORMAT_ENUM = ['number', 'currency', 'percent', 'compact'];

/** A grid of cells shaded by value (weekday by hour, region by month): plain HTML, so labels never clip. Each cell
 *  blends the chart colour into the muted surface by its value. */
export const HeatmapChart = () => {
  const [data] = ToolJet.useStateArray({ name: 'data', label: 'Data', initialValue: SAMPLE });
  const [xField] = ToolJet.useStateString({ name: 'xField', label: 'Column field', initialValue: 'hour' });
  const [yField] = ToolJet.useStateString({ name: 'yField', label: 'Row field', initialValue: 'day' });
  const [valueField] = ToolJet.useStateString({ name: 'valueField', label: 'Value field', initialValue: 'tickets' });
  const [xOrder] = ToolJet.useStateArray({ name: 'xOrder', label: 'Column order', initialValue: [] });
  const [yOrder] = ToolJet.useStateArray({ name: 'yOrder', label: 'Row order', initialValue: [] });
  const [showValues] = ToolJet.useStateBoolean({ name: 'showValues', label: 'Show values', initialValue: false });
  const [cellGap] = ToolJet.useStateNumber({ name: 'cellGap', label: 'Cell gap (px)', initialValue: 3 });
  const [yAxisFormat] = ToolJet.useStateEnumeration({ name: 'yAxisFormat', label: 'Value format', enumDefinition: FORMAT_ENUM, initialValue: 'number', inspector: 'switch' });
  const [currency] = ToolJet.useStateString({ name: 'currency', label: 'Currency code', initialValue: 'USD' });
  const [valuePrefix] = ToolJet.useStateString({ name: 'valuePrefix', label: 'Value prefix', initialValue: '' });
  const [valueSuffix] = ToolJet.useStateString({ name: 'valueSuffix', label: 'Value suffix', initialValue: '' });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty message', initialValue: 'No data' });
  const [showLegend] = ToolJet.useStateBoolean({ name: 'showLegend', label: 'Legend', initialValue: true });
  const [highlightClicked] = ToolJet.useStateBoolean({ name: 'highlightClicked', label: 'Highlight clicked point', description: 'Outlines the clicked cell until Clear clicked point runs or another is clicked.', initialValue: false });
  const click = useChartClick(highlightClicked);
  const chartColor = useThemeColor('chartColor', 'Chart color (the strongest cell)', TOKEN.brand);
  const axisTextColor = useThemeColor('axisTextColor', 'Label color', TOKEN.mutedText);
  const legendTextColor = useThemeColor('legendTextColor', 'Legend text color', TOKEN.mutedText);
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 24, defaultHeight: 28 });
  const box = useBoxSize();

  const grid = useMemo(() => heatmapGrid(data, xField, yField, valueField, xOrder, yOrder), [data, xField, yField, valueField, xOrder, yOrder]);
  const format = useMemo(
    () => formatter({ format: yAxisFormat, currency, prefix: valuePrefix, suffix: valueSuffix }, yAxisFormat === 'compact'),
    [yAxisFormat, currency, valuePrefix, valueSuffix]
  );
  const gap = clamp(cellGap, 0, 12, 3);
  const empty = !grid.xs.length || !grid.ys.length;
  // Column labels thin out to about one per 36px so a 24-hour axis stays legible.
  const labelEvery = Math.max(1, Math.ceil(grid.xs.length / Math.max(1, Math.floor((box.width || 600) / 36))));
  const rowLabelWidth = Math.min(160, Math.max(32, Math.max(0, ...grid.ys.map((y) => y.length)) * 7 + 12));
  const strong = isSet(chartColor) ? chartColor : 'var(--sc-chart-1, var(--ui-primary))';
  const shade = (strength: number | null) => (strength === null ? 'var(--ui-muted)' : `color-mix(in srgb, ${strong} ${Math.round(12 + strength * 88)}%, var(--ui-muted))`);
  const xKey = isSet(xField) ? String(xField) : 'x';
  const yKey = isSet(yField) ? String(yField) : 'y';
  const vKey = isSet(valueField) ? String(valueField) : 'value';
  const highlighted = click.highlighted as Record<string, unknown> | null;
  const isClicked = (y: string, x: string) => !!highlighted && highlighted[yKey] === y && highlighted[xKey] === x;
  const columns = `${rowLabelWidth}px repeat(${grid.xs.length}, minmax(0, 1fr))`;

  return (
    <LoadingFrame loading={ld.loading} look={blockLook(ld.skeleton)}>
      <div ref={box.ref} className="ui ui2-heatmap" style={lookVars({ '--lk-axis': axisTextColor, '--lk-legend': legendTextColor })} onDoubleClick={click.doubleClick}>
        {empty ? (
          <EmptyChart text={String(isSet(emptyText) ? emptyText : 'No data')} />
        ) : (
          <ChartBoundary resetKey={[data, xField, yField, valueField]}>
            <div className="ui2-heatmap-grid" style={{ gridTemplateColumns: columns, gap }}>
              {grid.ys.map((y) => (
                <React.Fragment key={y}>
                  <div className="ui2-heatmap-row-label" title={y}>
                    {y}
                  </div>
                  {grid.xs.map((x) => {
                    const value = grid.value(y, x);
                    const strength = grid.strength(value);
                    const clicked = isClicked(y, x);
                    return (
                      <button
                        type="button"
                        key={x}
                        className="ui2-heatmap-cell"
                        title={`${y} · ${x}: ${value === null ? 'no data' : format(value)}`}
                        data-strength={strength === null ? '' : strength.toFixed(2)}
                        data-clicked={clicked || undefined}
                        onClick={() => click.pick({ [yKey]: y, [xKey]: x, [vKey]: value })}
                        style={
                          {
                            opacity: highlighted && !clicked ? DIMMED : undefined,
                            boxShadow: clicked ? '0 0 0 2px var(--ui-fg)' : undefined,
                            '--heat': shade(strength),
                            '--heat-fg': strength !== null && strength > 0.55 ? 'var(--ui-primary-fg)' : 'var(--ui-fg)',
                          } as React.CSSProperties
                        }
                      >
                        {showValues === true && value !== null ? format(value) : ''}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            <div className="ui2-heatmap-columns" style={{ gridTemplateColumns: columns, columnGap: gap }}>
              <div />
              {grid.xs.map((x, i) => (
                <div key={x} className="ui2-heatmap-col-label">
                  {i % labelEvery === 0 ? x : ''}
                </div>
              ))}
            </div>
            <ChartNotes notes={[hiddenNote(grid.hidden.columns, 'column'), hiddenNote(grid.hidden.rows, 'row')]} />
            {showLegend !== false ? (
              <div className="ui2-heatmap-legend">
                <span>{format(grid.min)}</span>
                <span className="ui2-heatmap-scale" style={{ background: `linear-gradient(to right, ${shade(0)}, ${shade(1)})` }} />
                <span>{format(grid.max)}</span>
              </div>
            ) : null}
          </ChartBoundary>
        )}
      </div>
    </LoadingFrame>
  );
};
