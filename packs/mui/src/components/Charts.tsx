import React, { useMemo } from 'react';
import { BarChart as MuiBarChart } from '@mui/x-charts/BarChart';
import { LineChart as MuiLineChart } from '@mui/x-charts/LineChart';
import { PieChart as MuiPieChart } from '@mui/x-charts/PieChart';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { MuiProvider, useThemeStyles } from '../lib/MuiProvider';
import { BlockSkeleton, Loading } from '../lib/loading';
import { readField, str, toArray, toRows, type Row } from '../lib/data';
import { formatNumber, toNumber, type NumberFormat } from '../lib/format';

type Series = { dataKey: string; label?: string; color?: string; stack?: string };
type Axis = { dataKey: string; label?: string; scaleType?: string };

const humanize = (k: string) =>
  k
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());

// MUI's xAxis is an array of axes; the first one's dataKey is the category field. A bare field name also works.
const toAxis = (raw: unknown, rows: Row[]): Axis => {
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (typeof first === 'string' && first) return { dataKey: first };
  if (first && typeof first === 'object') {
    const r = first as Row;
    const dataKey = str(r.dataKey ?? r.field ?? r.key);
    if (dataKey) return { dataKey, label: str(r.label) || undefined, scaleType: str(r.scaleType) || undefined };
  }
  const sample = rows[0];
  const key = sample ? Object.keys(sample).find((k) => toNumber(sample[k]) === null) : undefined;
  return { dataKey: key ?? 'x' };
};

// MUI's series [{ dataKey, label, color, stack }]; bare field names also work. None: every numeric field but the axis.
const toSeries = (raw: unknown, rows: Row[], axisKey: string): Series[] => {
  const given = toArray(raw)
    .map((s): Series | null => {
      if (typeof s === 'string') return s ? { dataKey: s } : null;
      if (!s || typeof s !== 'object') return null;
      const r = s as Row;
      const dataKey = str(r.dataKey ?? r.field ?? r.key);
      return dataKey ? { dataKey, label: str(r.label) || undefined, color: str(r.color) || undefined, stack: str(r.stack) || undefined } : null;
    })
    .filter((s): s is Series => !!s);
  if (given.length) return given;
  const sample = rows[0];
  return sample
    ? Object.keys(sample)
        .filter((k) => k !== axisKey && toNumber(sample[k]) !== null)
        .map((k) => ({ dataKey: k }))
    : [];
};

/** The dataset with every series value as a number (null when missing), as MUI's charts need. */
const numericRows = (rows: Row[], series: Series[]) =>
  rows.map((r) => {
    const out: Row = { ...r };
    for (const s of series) out[s.dataKey] = toNumber(readField(r, s.dataKey));
    return out;
  });

const FORMATS = ['auto', 'number', 'currency', 'percent', 'compact'];

/** The props every cartesian chart shares, by MUI's names. */
const useCartesian = () => {
  const [dataset] = ToolJet.useStateArray({ name: 'dataset', label: 'Dataset', description: 'The rows: [{ month, sales, ... }].', initialValue: [] });
  const [xAxis] = ToolJet.useStateArray({
    name: 'xAxis',
    label: 'X axis',
    description: "[{ dataKey, label }], or the category field's name.",
    initialValue: [],
  });
  const [series] = ToolJet.useStateArray({
    name: 'series',
    label: 'Series',
    description: '[{ dataKey, label, color }], or field names; empty: every numeric field.',
    initialValue: [],
  });
  const [stack] = ToolJet.useStateString({
    name: 'stack',
    label: 'Stack',
    description: "A stack id for every series ('total' stacks them); empty for none.",
    initialValue: '',
  });
  const [valueFormat] = ToolJet.useStateEnumeration({ name: 'valueFormat', label: 'Value format', enumDefinition: FORMATS, initialValue: 'auto' });
  const [currency] = ToolJet.useStateString({
    name: 'currency',
    label: 'Currency',
    initialValue: 'USD',
    visibleWhen: { key: 'valueFormat', value: 'currency' },
  });
  const [colors] = ToolJet.useStateArray({
    name: 'colors',
    label: 'Colors',
    description: "The series palette; empty: MUI X Charts' default palette.",
    initialValue: [],
  });
  const [grid] = ToolJet.useStateBoolean({ name: 'grid', label: 'Grid', description: 'Horizontal grid lines.', initialValue: true });
  const [hideLegend] = ToolJet.useStateBoolean({ name: 'hideLegend', label: 'Hide legend', initialValue: false });
  const [, setClickedItem] = ToolJet.useStateObject({ name: 'clickedItem', initialValue: {}, inspector: 'hidden' });
  const { loading } = ToolJet.useControlState();
  const rows = useMemo(() => toRows(dataset), [dataset]);
  const axis = toAxis(xAxis, rows);
  const list = toSeries(series, rows, axis.dataKey);
  const data = useMemo(() => numericRows(rows, list), [rows, JSON.stringify(list)]); // eslint-disable-line react-hooks/exhaustive-deps
  const format = (v: number | null) => (v === null || v === undefined ? '' : formatNumber(v, valueFormat as NumberFormat, currency));
  return { rows, data, axis, list, stack, format, colors: toArray(colors).map(str).filter(Boolean), grid, hideLegend, loading, setClickedItem };
};

const muiSeries = (c: ReturnType<typeof useCartesian>, extra: Record<string, unknown> = {}) =>
  c.list.map((s) => ({
    dataKey: s.dataKey,
    label: s.label ?? humanize(s.dataKey),
    color: s.color,
    stack: s.stack ?? (c.stack || undefined),
    valueFormatter: c.format,
    ...extra,
  }));

// MUI X's BarChart: dataset, xAxis (the category axis: [{ dataKey }]), series [{ dataKey, label, color, stack }],
// layout (vertical bars, or horizontal), stack, valueFormat, colors, grid, hideLegend, borderRadius. Event onItemClick
// (a bar), with clickedItem (its row), clickedSeries exposed.
export const BarChart = () => {
  const c = useCartesian();
  const [layout] = ToolJet.useStateEnumeration({
    name: 'layout',
    label: 'Layout',
    enumDefinition: ['vertical', 'horizontal'],
    initialValue: 'vertical',
  });
  const [, setClickedSeries] = ToolJet.useStateString({ name: 'clickedSeries', initialValue: '', inspector: 'hidden' });
  const onItemClick = ToolJet.useEventCallback({ name: 'onItemClick' });
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 30 });
  const horizontal = layout === 'horizontal';
  const band = [{ dataKey: c.axis.dataKey, label: c.axis.label, scaleType: 'band' as const }];
  const values = [{ valueFormatter: (v: number | null) => c.format(v) }];
  return (
    <MuiProvider overrides={overrides} fill>
      <Loading loading={c.loading} fill look={<BlockSkeleton />}>
        <MuiBarChart
          dataset={c.data}
          layout={layout as 'vertical'}
          xAxis={horizontal ? values : band}
          yAxis={horizontal ? [{ ...band[0], width: 90 }] : [{ ...values[0], width: 56 }]}
          series={muiSeries(c)}
          colors={c.colors.length ? c.colors : undefined}
          // The Border radius style rounds the bars (x-charts' borderRadius); none: MUI's square bars.
        borderRadius={overrides.borderRadius ?? 0}
          grid={horizontal ? { vertical: c.grid } : { horizontal: c.grid }}
          hideLegend={c.hideLegend || c.list.length < 2}
          onItemClick={(_, item) => {
            c.setClickedItem(c.rows[item.dataIndex] ?? {});
            setClickedSeries(String(item.seriesId));
            onItemClick();
          }}
        />
      </Loading>
    </MuiProvider>
  );
};

const useLineProps = () => {
  const [curve] = ToolJet.useStateEnumeration({
    name: 'curve',
    label: 'Curve',
    enumDefinition: ['linear', 'monotoneX', 'natural', 'step', 'catmullRom'],
    initialValue: 'monotoneX',
  });
  const [showMark] = ToolJet.useStateBoolean({ name: 'showMark', label: 'Show mark', description: 'A dot at every point.', initialValue: false });
  const [, setClickedIndex] = ToolJet.useStateNumber({ name: 'clickedIndex', initialValue: -1, inspector: 'hidden' });
  const onAxisClick = ToolJet.useEventCallback({ name: 'onAxisClick' });
  return { curve, showMark, setClickedIndex, onAxisClick };
};

const LineView = ({ c, l, area }: { c: ReturnType<typeof useCartesian>; l: ReturnType<typeof useLineProps>; area: boolean }) => (
  <MuiLineChart
    dataset={c.data}
    xAxis={[{ dataKey: c.axis.dataKey, label: c.axis.label, scaleType: (c.axis.scaleType as 'point') || 'point' }]}
    yAxis={[{ valueFormatter: (v: number | null) => c.format(v), width: 56 }]}
    series={muiSeries(c, { curve: l.curve, showMark: l.showMark, area, connectNulls: true })}
    colors={c.colors.length ? c.colors : undefined}
    grid={{ horizontal: c.grid }}
    hideLegend={c.hideLegend || c.list.length < 2}
    onAxisClick={(_, data) => {
      if (!data) return;
      c.setClickedItem(c.rows[data.dataIndex] ?? {});
      l.setClickedIndex(data.dataIndex);
      l.onAxisClick();
    }}
  />
);

// MUI X's LineChart: dataset, xAxis [{ dataKey, scaleType }], series [{ dataKey, label, color }], curve, showMark,
// stack, valueFormat, colors, grid, hideLegend. Event onAxisClick (anywhere on the plot: the nearest x), with
// clickedItem (that row) and clickedIndex exposed.
export const LineChart = () => {
  const c = useCartesian();
  const l = useLineProps();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 30 });
  return (
    <MuiProvider overrides={overrides} fill>
      <Loading loading={c.loading} fill look={<BlockSkeleton />}>
        <LineView c={c} l={l} area={false} />
      </Loading>
    </MuiProvider>
  );
};

// MUI X's LineChart with area series (MUI has no separate area chart): the LineChart's props; stack 'total' stacks the
// areas. Event onAxisClick.
export const AreaChart = () => {
  const c = useCartesian();
  const l = useLineProps();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 30 });
  return (
    <MuiProvider overrides={overrides} fill>
      <Loading loading={c.loading} fill look={<BlockSkeleton />}>
        <LineView c={c} l={l} area />
      </Loading>
    </MuiProvider>
  );
};

// MUI X's PieChart: data (MUI's [{ id, value, label }], or any rows with labelKey / valueKey), innerRadius (0 for a
// pie, e.g. 60 for a donut), outerRadius, paddingAngle, cornerRadius, arcLabel (none, value, label, percent),
// valueFormat, colors, hideLegend. Event onItemClick (a slice) with clickedItem exposed.
export const PieChart = () => {
  const [rawData] = ToolJet.useStateArray({
    name: 'data',
    label: 'Data',
    description: '[{ id, value, label }], or rows read with labelKey / valueKey.',
    initialValue: [],
  });
  const [labelKey] = ToolJet.useStateString({ name: 'labelKey', label: 'Label key', initialValue: 'label' });
  const [valueKey] = ToolJet.useStateString({ name: 'valueKey', label: 'Value key', initialValue: 'value' });
  const [innerRadius] = ToolJet.useStateNumber({
    name: 'innerRadius',
    label: 'Inner radius',
    description: '0 for a pie; a donut otherwise.',
    initialValue: 0,
    min: 0,
  });
  const [outerRadius] = ToolJet.useStateNumber({
    name: 'outerRadius',
    label: 'Outer radius',
    description: '0 to fill the box.',
    initialValue: 0,
    min: 0,
  });
  const [paddingAngle] = ToolJet.useStateNumber({ name: 'paddingAngle', label: 'Padding angle', initialValue: 0, min: 0, max: 20 });
  const [cornerRadius] = ToolJet.useStateNumber({ name: 'cornerRadius', label: 'Corner radius', initialValue: 0, min: 0, max: 30 });
  const [arcLabel] = ToolJet.useStateEnumeration({
    name: 'arcLabel',
    label: 'Arc label',
    enumDefinition: ['none', 'value', 'label', 'percent'],
    initialValue: 'none',
  });
  const [valueFormat] = ToolJet.useStateEnumeration({ name: 'valueFormat', label: 'Value format', enumDefinition: FORMATS, initialValue: 'auto' });
  const [currency] = ToolJet.useStateString({
    name: 'currency',
    label: 'Currency',
    initialValue: 'USD',
    visibleWhen: { key: 'valueFormat', value: 'currency' },
  });
  const [colors] = ToolJet.useStateArray({ name: 'colors', label: 'Colors', initialValue: [] });
  const [hideLegend] = ToolJet.useStateBoolean({ name: 'hideLegend', label: 'Hide legend', initialValue: false });
  const [, setClickedItem] = ToolJet.useStateObject({ name: 'clickedItem', initialValue: {}, inspector: 'hidden' });
  const onItemClick = ToolJet.useEventCallback({ name: 'onItemClick' });
  const { loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 30 });
  const rows = toRows(rawData);
  const lk = str(labelKey) || 'label';
  const vk = str(valueKey) || 'value';
  const slices = rows
    .map((r, i) => ({
      id: str(r.id) || i,
      label: str(readField(r, lk) ?? r.label ?? r.name),
      value: toNumber(readField(r, vk) ?? r.value) ?? 0,
      row: r,
    }))
    .filter((s) => s.value > 0);
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const format = (v: number) => formatNumber(v, valueFormat as NumberFormat, currency);
  const arc =
    arcLabel === 'none'
      ? undefined
      : (s: { value: number; label?: string | ((loc: 'tooltip' | 'legend') => string) }) =>
          arcLabel === 'label'
            ? str(typeof s.label === 'function' ? s.label('legend') : s.label)
            : arcLabel === 'percent'
              ? `${Math.round((s.value / (total || 1)) * 100)}%`
              : format(s.value);
  return (
    <MuiProvider overrides={overrides} fill>
      <Loading loading={loading} fill look={<BlockSkeleton />}>
        <MuiPieChart
          colors={toArray(colors).map(str).filter(Boolean).length ? toArray(colors).map(str).filter(Boolean) : undefined}
          hideLegend={hideLegend}
          series={[
            {
              data: slices.map(({ id, label, value }) => ({ id, label, value })),
              innerRadius: Number(innerRadius) || 0,
              outerRadius: Number(outerRadius) > 0 ? Number(outerRadius) : undefined,
              paddingAngle: Number(paddingAngle) || 0,
              cornerRadius: Number(cornerRadius) || 0,
              arcLabel: arc,
              arcLabelMinAngle: 18,
              highlightScope: { fade: 'global', highlight: 'item' },
              valueFormatter: (v) => format(v.value),
            },
          ]}
          onItemClick={(_, item) => {
            setClickedItem(slices[item.dataIndex]?.row ?? {});
            onItemClick();
          }}
        />
      </Loading>
    </MuiProvider>
  );
};
