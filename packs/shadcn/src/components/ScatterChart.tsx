import React, { useMemo } from 'react';
import { CartesianGrid, Cell, Legend, ReferenceLine, Scatter, ScatterChart as RScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AXIS, AXIS_FILL, ChartFrame, GRID, LegendContent, REF, seriesColor, useBoxSize, useChartClick } from '../lib/ui2/charts/chartParts';
import { MAX_SERIES, PLAIN_NUMBER, animated, axisLabel, axisWidthFor, clamp, emphasis, formatter, isCompactChart, isRecord, isSet, list, num, seriesLabel, type Row } from '../lib/ui2/charts/chartModel';
import { LoadingFrame, blockLook, useLoadingLook } from '../lib/ui2/loading/look';
import { TOKEN, useThemeColor } from '../lib/styleDefaults';

// A point is an SVG symbol with its own handlers: past this many the chart is a blot and slow to draw.
const MAX_POINTS = 1000;
const FORMAT_ENUM = ['number', 'currency', 'percent', 'compact'];

interface Point {
  x: number;
  y: number;
  z: number | null;
  label: string | number;
  row: Row;
}

/** Points grouped by groupField in order of first appearance; rows without both numbers are left out. When the data
 *  has neither named axis field, its first two numeric fields are used. */
const scatterGroups = (data: unknown, f: { xField: string; yField: string; sizeField: string; groupField: string; nameField: string }) => {
  const rows = list(data).filter(isRecord).slice(0, MAX_POINTS);
  if (!rows.length) return [];
  let xKey: string | undefined = isSet(f.xField) ? f.xField : undefined;
  let yKey: string | undefined = isSet(f.yField) ? f.yField : undefined;
  const present = (key: string | undefined) => key !== undefined && rows.some((row) => num(row[key]) !== null);
  if (!present(xKey) && !present(yKey)) [xKey, yKey] = [...new Set(rows.slice(0, 50).flatMap((row) => Object.keys(row)))].filter(present);
  const groups = new Map<string | number, Point[]>();
  rows.forEach((row) => {
    const x = num(row[String(xKey)]);
    const y = num(row[String(yKey)]);
    if (x === null || y === null) return;
    const name = isSet(f.groupField) ? axisLabel(row[f.groupField]) || 'Other' : '';
    const points = groups.get(name) ?? [];
    groups.set(name, points);
    points.push({ x, y, z: isSet(f.sizeField) ? num(row[f.sizeField]) ?? 0 : null, label: isSet(f.nameField) ? axisLabel(row[f.nameField]) : '', row });
  });
  return [...groups.entries()].slice(0, MAX_SERIES).map(([name, points]) => ({ name, points }));
};

const ScatterTip = ({ active, payload, rows }: { active?: boolean; payload?: { payload?: Point }[]; rows: (point: Point) => [string, string][] }) => {
  const point = active ? payload?.[0]?.payload : null;
  if (!point) return null;
  return (
    <div className="ui2-chart-tip">
      {point.label !== '' ? <div className="ui2-chart-tip-title">{String(point.label)}</div> : null}
      {rows(point).map(([name, value]) => (
        <div key={name} className="ui2-chart-tip-row">
          <span className="ui2-chart-tip-name">{name}</span>
          <span className="ui2-chart-tip-value">{value}</span>
        </div>
      ))}
    </div>
  );
};

export const ScatterChart = () => {
  const [data] = ToolJet.useStateArray({
    name: 'data',
    label: 'Data',
    initialValue: [
      { account: 'Northwind', spend: 12, revenue: 48, seats: 40, segment: 'Mid-market' },
      { account: 'Globex', spend: 30, revenue: 95, seats: 120, segment: 'Enterprise' },
      { account: 'Initech', spend: 8, revenue: 21, seats: 15, segment: 'SMB' },
      { account: 'Umbrella', spend: 26, revenue: 61, seats: 90, segment: 'Enterprise' },
      { account: 'Hooli', spend: 18, revenue: 70, seats: 55, segment: 'Mid-market' },
      { account: 'Vandelay', spend: 5, revenue: 14, seats: 10, segment: 'SMB' },
      { account: 'Stark', spend: 34, revenue: 128, seats: 150, segment: 'Enterprise' },
      { account: 'Wonka', spend: 14, revenue: 33, seats: 30, segment: 'SMB' },
    ],
  });
  const [xField] = ToolJet.useStateString({ name: 'xField', label: 'X field', initialValue: 'spend' });
  const [yField] = ToolJet.useStateString({ name: 'yField', label: 'Y field', initialValue: 'revenue' });
  const [sizeField] = ToolJet.useStateString({ name: 'sizeField', label: 'Size field (bubbles)', initialValue: 'seats' });
  const [groupField] = ToolJet.useStateString({ name: 'groupField', label: 'Group field (one colour each)', initialValue: 'segment' });
  const [nameField] = ToolJet.useStateString({ name: 'nameField', label: 'Name field (tooltip title)', initialValue: 'account' });
  const [xLabel] = ToolJet.useStateString({ name: 'xLabel', label: 'X axis title', initialValue: 'Marketing spend ($k)' });
  const [yLabel] = ToolJet.useStateString({ name: 'yLabel', label: 'Y axis title', initialValue: 'Revenue ($k)' });
  const [xAxisFormat] = ToolJet.useStateEnumeration({ name: 'xAxisFormat', label: 'X format', enumDefinition: FORMAT_ENUM, initialValue: 'number', inspector: 'switch' });
  const [yAxisFormat] = ToolJet.useStateEnumeration({ name: 'yAxisFormat', label: 'Y format', enumDefinition: FORMAT_ENUM, initialValue: 'number', inspector: 'switch' });
  const [currency] = ToolJet.useStateString({ name: 'currency', label: 'Currency code', initialValue: 'USD' });
  const [referenceX] = ToolJet.useStateString({ name: 'referenceX', label: 'Vertical line at x', initialValue: '' });
  const [referenceY] = ToolJet.useStateString({ name: 'referenceY', label: 'Horizontal line at y', initialValue: '' });
  const [pointSize] = ToolJet.useStateNumber({ name: 'pointSize', label: 'Point size (px)', initialValue: 6 });
  const [fillOpacity] = ToolJet.useStateString({ name: 'fillOpacity', label: 'Fill opacity (0 to 1)', description: 'Blank: 0.6 for bubbles, 0.85 for points.', initialValue: '' });
  const [valuePrefix] = ToolJet.useStateString({ name: 'valuePrefix', label: 'Value prefix', initialValue: '' });
  const [valueSuffix] = ToolJet.useStateString({ name: 'valueSuffix', label: 'Value suffix', initialValue: '' });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty message', initialValue: 'No data' });
  const [animate] = ToolJet.useStateBoolean({ name: 'animate', label: 'Animate', initialValue: true });
  const [showGrid] = ToolJet.useStateBoolean({ name: 'showGrid', label: 'Grid', initialValue: true });
  const [showLegend] = ToolJet.useStateBoolean({ name: 'showLegend', label: 'Legend', initialValue: true });
  const [colors] = ToolJet.useStateArray({ name: 'colors', label: 'Series colors (in order)', initialValue: [] });
  const [highlightClicked] = ToolJet.useStateBoolean({ name: 'highlightClicked', label: 'Highlight clicked point', description: 'Draws the clicked point emphasised until Clear clicked point runs or another is clicked.', initialValue: false });
  const click = useChartClick(highlightClicked);
  const chartColor = useThemeColor('chartColor', 'Chart color (series palette from it)', TOKEN.brand);
  const gridColor = useThemeColor('gridColor', 'Grid line color', TOKEN.border);
  const axisTextColor = useThemeColor('axisTextColor', 'Axis label color', TOKEN.mutedText);
  const legendTextColor = useThemeColor('legendTextColor', 'Legend text color', TOKEN.mutedText);
  const referenceLineColor = useThemeColor('referenceLineColor', 'Reference line color', TOKEN.mutedText);
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 32 });
  const box = useBoxSize();

  const m = useMemo(() => {
    const groups = scatterGroups(data, { xField, yField, sizeField, groupField, nameField });
    const xFormat = { format: xAxisFormat, currency };
    const yFormat = { format: yAxisFormat, currency, prefix: valuePrefix, suffix: valueSuffix };
    const yTick = formatter(yFormat, true);
    return {
      groups,
      fills: groups.map((_, i) => seriesColor(colors, chartColor, i)),
      fxTick: formatter(xFormat, true),
      fyTick: yTick,
      fx: formatter(xFormat, false),
      fy: formatter(yFormat, false),
      yWidth: axisWidthFor(groups.flatMap((g) => g.points.map((pt) => pt.y)), yTick),
    };
  }, [data, colors, chartColor, xField, yField, sizeField, groupField, nameField, xAxisFormat, yAxisFormat, currency, valuePrefix, valueSuffix]);
  const compact = box.height > 0 && isCompactChart(box.height);
  const bubbles = isSet(sizeField);
  const size = clamp(pointSize, 2, 40, 6);
  const opacity = clamp(fillOpacity, 0.1, 1, bubbles ? 0.6 : 0.85);
  const refX = num(referenceX);
  const refY = num(referenceY);
  const total = m.groups.reduce((n, g) => n + g.points.length, 0);
  const title = (t: unknown, fallback: string) => (isSet(t) ? String(t) : fallback);
  const tipRows = (pt: Point): [string, string][] => [
    [title(xLabel, seriesLabel(xField)), m.fx(pt.x)],
    [title(yLabel, seriesLabel(yField)), m.fy(pt.y)],
    ...(pt.z !== null && bubbles ? [[seriesLabel(sizeField), PLAIN_NUMBER.format(pt.z)] as [string, string]] : []),
  ];
  const axisTitle = (t: unknown, axis: 'x' | 'y') =>
    isSet(t) && !compact
      ? {
          value: String(t),
          position: axis === 'x' ? ('insideBottom' as const) : ('insideLeft' as const),
          angle: axis === 'x' ? 0 : -90,
          offset: axis === 'x' ? 0 : 10,
          style: { fill: AXIS_FILL, fontSize: 12, textAnchor: 'middle' as const },
        }
      : undefined;

  return (
    <LoadingFrame loading={ld.loading} look={blockLook(ld.skeleton)}>
      <ChartFrame
        boxRef={box.ref}
        empty={!m.groups.length}
        emptyText={emptyText}
        label="Scatter chart"
        resetKey={[data, xField, yField]}
        looks={{ '--lk-grid': gridColor, '--lk-axis': axisTextColor, '--lk-legend': legendTextColor, '--lk-ref': referenceLineColor }}
        onDoubleClick={click.doubleClick}
      >
        <RScatterChart margin={{ left: 4, right: 16, top: 12, bottom: 0 }}>
          {showGrid !== false && !compact ? <CartesianGrid stroke={GRID} /> : null}
          <XAxis
            type="number"
            dataKey="x"
            name={String(xLabel || xField || 'x')}
            {...AXIS}
            hide={compact}
            domain={['auto', 'auto']}
            tickFormatter={m.fxTick}
            height={isSet(xLabel) && !compact ? 46 : 30}
            label={axisTitle(xLabel, 'x')}
          />
          <YAxis type="number" dataKey="y" {...AXIS} hide={compact} domain={['auto', 'auto']} width={m.yWidth + (isSet(yLabel) ? 18 : 0)} tickFormatter={m.fyTick} label={axisTitle(yLabel, 'y')} />
          {bubbles ? <ZAxis type="number" dataKey="z" range={[size * 8, size * 120]} /> : <ZAxis range={[size * size * 3, size * size * 3]} />}
          <Tooltip cursor={{ strokeDasharray: '3 3', stroke: 'var(--ui-border)' }} content={<ScatterTip rows={tipRows} />} />
          {showLegend !== false && m.groups.length > 1 && !compact ? <Legend content={<LegendContent />} /> : null}
          {refX !== null ? <ReferenceLine x={refX} stroke={REF} strokeDasharray="4 4" ifOverflow="extendDomain" /> : null}
          {refY !== null ? <ReferenceLine y={refY} stroke={REF} strokeDasharray="4 4" ifOverflow="extendDomain" /> : null}
          {m.groups.map((g, i) => (
            <Scatter
              key={String(g.name) || 'points'}
              name={String(g.name || seriesLabel(yField))}
              data={g.points}
              fill={m.fills[i]}
              fillOpacity={opacity}
              stroke={bubbles ? m.fills[i] : 'none'}
              className="ui2-pointer"
              isAnimationActive={animated(animate, total)}
              onClick={(pt: { payload?: Point; row?: Row }) => click.pick(pt?.payload?.row ?? pt?.row)}
            >
              {click.highlighted ? g.points.map((pt, d) => <Cell key={d} fill={m.fills[i]} fillOpacity={opacity * emphasis(pt.row, click.highlighted)} />) : null}
            </Scatter>
          ))}
        </RScatterChart>
      </ChartFrame>
    </LoadingFrame>
  );
};
