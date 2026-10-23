import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Area as AntArea,
  Bar as AntBar,
  Column as AntColumn,
  DualAxes as AntDualAxes,
  Funnel as AntFunnel,
  Gauge as AntGauge,
  Heatmap as AntHeatmap,
  Line as AntLine,
  Pie as AntPie,
  Radar as AntRadar,
  Scatter as AntScatter,
} from '@ant-design/plots';
import { Empty, Typography } from 'antd';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, useTokenStyles } from '../lib/AntProvider';
import { ChartLoader } from '../lib/Loading';
import { str, toArray, toRows, type Row } from '../lib/data';
import { formatNumber, toNumber } from '../lib/format';

// G2's (Ant's charting engine) own categorical palette after its first colour, which is antd's primary (or the
// component's colorPrimary style).
const PALETTE = ['#00C9C9', '#F0884D', '#D580FF', '#7863FF', '#60C42D', '#BD8F24', '#FF80CA', '#2491B3', '#17C76F'];

type Theme = { brand: string; text: string; muted: string; border: string; surface: string; dark: boolean };
const LIGHT: Theme = { brand: '#1677ff', text: 'rgba(0, 0, 0, 0.88)', muted: 'rgba(0, 0, 0, 0.45)', border: '#f0f0f0', surface: '#ffffff', dark: false };

// The chart draws on a canvas, which cannot read CSS variables: read antd's tokens off the element (stock Ant, or the
// component's style overrides; dark under .tj-ant-dark), and again when the root's class or style changes.
const useChartTheme = (ref: React.RefObject<HTMLElement>) => {
  const [theme, setTheme] = useState<Theme>(LIGHT);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = (el.closest('.tj-ant-root') as HTMLElement | null) ?? el;
    const read = () => {
      const cs = getComputedStyle(el);
      // Resolve to rgb() through the element itself, so color-mix() comes back as a plain colour.
      const probe = (name: string, fallback: string) => {
        const value = cs.getPropertyValue(name).trim();
        if (!value) return fallback;
        el.style.setProperty('--tj-ant-probe', value);
        el.style.color = 'var(--tj-ant-probe)';
        const out = getComputedStyle(el).color;
        el.style.removeProperty('color');
        el.style.removeProperty('--tj-ant-probe');
        return out || fallback;
      };
      const next: Theme = {
        brand: probe('--ant-color-primary', LIGHT.brand),
        text: probe('--ant-color-text', LIGHT.text),
        muted: probe('--ant-color-text-tertiary', LIGHT.muted),
        border: probe('--ant-color-split', LIGHT.border),
        surface: probe('--ant-color-bg-container', LIGHT.surface),
        dark: root.classList.contains('tj-ant-dark'),
      };
      setTheme((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['class', 'style'] });
    return () => observer.disconnect();
  }, [ref]);
  return theme;
};

const useChartProps = (defaults: { x?: string; y?: string } = {}) => {
  const [rawData] = ToolJet.useStateArray({ name: 'data', label: 'Data', description: 'Rows, one per x value: [{ month, sales }]', initialValue: [] });
  const [xField] = ToolJet.useStateString({ name: 'xField', label: 'X field', initialValue: defaults.x ?? 'x' });
  const [yField] = ToolJet.useStateArray({
    name: 'yField',
    label: 'Y field',
    description: "One field ('sales') or several (['sales', 'cost']), each a series.",
    initialValue: [defaults.y ?? 'y'],
  });
  const [colorField] = ToolJet.useStateString({ name: 'colorField', label: 'Color field', description: 'A field naming the series, for long data (one row per x and series).', initialValue: '' });
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: '' });
  const [legend] = ToolJet.useStateEnumeration({ name: 'legend', label: 'Legend', enumDefinition: ['top', 'bottom', 'right', 'none'], initialValue: 'top' });
  const [label] = ToolJet.useStateBoolean({ name: 'label', label: 'Label', description: 'Values on the marks.', initialValue: false });
  const [yFormatter] = ToolJet.useStateEnumeration({ name: 'yFormatter', label: 'Y formatter', enumDefinition: ['auto', 'number', 'currency', 'percent', 'compact'], initialValue: 'compact' });
  const [currency] = ToolJet.useStateString({ name: 'currency', label: 'Currency', initialValue: 'USD', visibleWhen: { key: 'yFormatter', value: 'currency' } });
  const [, setSelectedDatum] = ToolJet.useStateObject({ name: 'selectedDatum', initialValue: {}, inspector: 'hidden' });
  const onElementClick = ToolJet.useEventCallback({ name: 'onElementClick' });
  const { loading } = ToolJet.useControlState();
  return { loading, rawData, xField, yField, colorField, title, legend, label, yFormatter, currency, setSelectedDatum, onElementClick };
};

// yField is one field name ('sales') or several (['sales', 'cost']).
const yFields = (raw: unknown): string[] =>
  typeof raw === 'string' && raw.trim() && !raw.trim().startsWith('[') ? [raw.trim()] : toArray(raw).map(str).filter(Boolean);

// Wide data ({ month, sales, cost }) with several y fields becomes G2's long form ({ month, series, value }).
const toSeries = (rows: Row[], xField: string, yFields: string[], colorField: string) => {
  if (colorField || yFields.length <= 1) {
    const y = yFields[0] ?? 'y';
    return { data: rows.map((r) => ({ ...r, [y]: toNumber(r[y]) ?? r[y] })), x: xField, y, color: colorField || undefined };
  }
  const data = rows.flatMap((r) => yFields.map((f) => ({ [xField]: r[xField], series: f, value: toNumber(r[f]) })));
  return { data, x: xField, y: 'value', color: 'series' };
};

// While loading, the chart's own loader covers the chart, which stays mounted.
const Frame = ({
  title,
  empty,
  loading,
  chartRef,
  children,
}: {
  title: string;
  empty: boolean;
  loading: boolean;
  chartRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
}) => (
  <div className="tj-ant-chart" ref={chartRef}>
    {title ? (
      <Typography.Title level={5} style={{ margin: 0 }}>
        {title}
      </Typography.Title>
    ) : null}
    <div className="tj-ant-chart-body">
      {empty && !loading ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" /> : children}
      {loading ? <ChartLoader /> : null}
    </div>
  </div>
);

const useCommon = (
  p: ReturnType<typeof useChartProps>,
  theme: Theme,
  series: { color?: string; y: string }
) =>
  useMemo(() => {
    const fmt = (v: unknown) => {
      const n = toNumber(v);
      return n === null ? str(v) : formatNumber(n, p.yFormatter as 'auto', p.currency);
    };
    const axisStyle = { labelFill: theme.muted, labelFillOpacity: 1, lineStroke: theme.border, tickStroke: theme.border, gridStroke: theme.border, gridStrokeOpacity: 1, titleFill: theme.muted };
    return {
      autoFit: true,
      theme: theme.dark ? 'classicDark' : 'classic',
      scale: { color: { range: [theme.brand, ...PALETTE] } },
      axis: { x: { ...axisStyle, grid: false }, y: { ...axisStyle, labelFormatter: fmt } },
      legend: p.legend === 'none' || !series.color ? false : { color: { position: p.legend, itemLabelFill: theme.text } },
      tooltip: { valueFormatter: fmt },
      label: p.label ? { text: (d: Row) => fmt(d[series.y]), fill: theme.text, position: 'inside' } : undefined,
      viewStyle: { viewFill: 'transparent' },
      onEvent: (_chart: unknown, event: { type?: string; data?: { data?: Row } }) => {
        if (event?.type === 'element:click') {
          p.setSelectedDatum(event.data?.data ?? {});
          p.onElementClick();
        }
      },
    };
  }, [p.yFormatter, p.currency, p.legend, p.label, theme, series.color, series.y]);

// Ant's Column (vertical bars): data, xField, yField, colorField, stack, group (side by side when several series),
// radius, legend, label; event onElementClick with selectedDatum exposed.
export const Column = () => {
  const p = useChartProps({ x: 'x', y: 'y' });
  const [stack] = ToolJet.useStateBoolean({ name: 'stack', label: 'Stack', description: 'Stack the series instead of grouping them.', initialValue: false });
  const [horizontal] = ToolJet.useStateBoolean({ name: 'horizontal', label: 'Horizontal', description: "Draw as Ant's Bar (horizontal bars).", initialValue: false });
  const [radius] = ToolJet.useStateNumber({ name: 'radius', label: 'Corner radius', initialValue: 4, min: 0, max: 20 });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 32 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const rows = toRows(p.rawData);
  const s = toSeries(rows, p.xField, yFields(p.yField), p.colorField);
  const common = useCommon(p, theme, s);
  const r = Math.max(0, Number(radius) || 0);
  const Chart = horizontal ? AntBar : AntColumn;
  return (
    <AntProvider tokens={tokens} fill>
      <Frame title={p.title} empty={!rows.length} loading={p.loading} chartRef={ref}>
        <Chart
          {...(common as object)}
          data={s.data}
          xField={s.x}
          yField={s.y}
          colorField={s.color}
          stack={stack && !!s.color}
          group={!stack && !!s.color}
          style={horizontal ? { radiusTopRight: r, radiusBottomRight: r, fill: s.color ? undefined : theme.brand } : { radiusTopLeft: r, radiusTopRight: r, fill: s.color ? undefined : theme.brand }}
        />
      </Frame>
    </AntProvider>
  );
};

// Ant's Line: data, xField, yField, colorField, smooth (shapeField 'smooth'), point; event onElementClick.
export const Line = () => {
  const p = useChartProps({ x: 'x', y: 'y' });
  const [smooth] = ToolJet.useStateBoolean({ name: 'smooth', label: 'Smooth', initialValue: true });
  const [point] = ToolJet.useStateBoolean({ name: 'point', label: 'Point', description: 'A dot on every value.', initialValue: false });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 32 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const rows = toRows(p.rawData);
  const s = toSeries(rows, p.xField, yFields(p.yField), p.colorField);
  const common = useCommon(p, theme, s);
  return (
    <AntProvider tokens={tokens} fill>
      <Frame title={p.title} empty={!rows.length} loading={p.loading} chartRef={ref}>
        <AntLine
          {...(common as object)}
          data={s.data}
          xField={s.x}
          yField={s.y}
          colorField={s.color}
          shapeField={smooth ? 'smooth' : undefined}
          point={point ? { shapeField: 'circle', sizeField: 3 } : undefined}
          style={{ lineWidth: 2, stroke: s.color ? undefined : theme.brand }}
        />
      </Frame>
    </AntProvider>
  );
};

// Ant's Area: data, xField, yField, colorField, stack, smooth; event onElementClick.
export const Area = () => {
  const p = useChartProps({ x: 'x', y: 'y' });
  const [stack] = ToolJet.useStateBoolean({ name: 'stack', label: 'Stack', initialValue: true });
  const [smooth] = ToolJet.useStateBoolean({ name: 'smooth', label: 'Smooth', initialValue: true });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 32 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const rows = toRows(p.rawData);
  const s = toSeries(rows, p.xField, yFields(p.yField), p.colorField);
  const common = useCommon(p, theme, s);
  return (
    <AntProvider tokens={tokens} fill>
      <Frame title={p.title} empty={!rows.length} loading={p.loading} chartRef={ref}>
        <AntArea
          {...(common as object)}
          data={s.data}
          xField={s.x}
          yField={s.y}
          colorField={s.color}
          stack={stack && !!s.color}
          shapeField={smooth ? 'smooth' : undefined}
          style={{ fillOpacity: s.color && !stack ? 0.25 : 0.4, fill: s.color ? undefined : theme.brand }}
          line={{ style: { lineWidth: 2, stroke: s.color ? undefined : theme.brand } }}
        />
      </Frame>
    </AntProvider>
  );
};

// Ant's Pie: data, angleField (the value), colorField (the category), innerRadius (0 for a pie, about 0.6 for a
// donut), label (percent on the slices), legend; event onElementClick.
export const Pie = () => {
  const { loading } = ToolJet.useControlState();
  const [rawData] = ToolJet.useStateArray({ name: 'data', label: 'Data', description: '[{ type, value }]', initialValue: [] });
  const [angleField] = ToolJet.useStateString({ name: 'angleField', label: 'Angle field', description: 'The value of each slice.', initialValue: 'value' });
  const [colorField] = ToolJet.useStateString({ name: 'colorField', label: 'Color field', description: 'The category of each slice.', initialValue: 'type' });
  const [innerRadius] = ToolJet.useStateNumber({ name: 'innerRadius', label: 'Inner radius', description: '0 to 0.9', initialValue: 0.6, min: 0, max: 0.9 });
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: '' });
  const [legend] = ToolJet.useStateEnumeration({ name: 'legend', label: 'Legend', enumDefinition: ['right', 'bottom', 'top', 'none'], initialValue: 'right' });
  const [label] = ToolJet.useStateBoolean({ name: 'label', label: 'Label', description: 'Percent on the slices.', initialValue: false });
  const [formatter] = ToolJet.useStateEnumeration({ name: 'formatter', label: 'Formatter', enumDefinition: ['auto', 'number', 'currency', 'percent', 'compact'], initialValue: 'auto' });
  const [currency] = ToolJet.useStateString({ name: 'currency', label: 'Currency', initialValue: 'USD', visibleWhen: { key: 'formatter', value: 'currency' } });
  const [, setSelectedDatum] = ToolJet.useStateObject({ name: 'selectedDatum', initialValue: {}, inspector: 'hidden' });
  const onElementClick = ToolJet.useEventCallback({ name: 'onElementClick' });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 32 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const rows = toRows(rawData)
    .map((r) => ({ ...r, [angleField]: toNumber(r[angleField]) ?? 0 }))
    .filter((r) => (r[angleField] as number) > 0);
  const total = rows.reduce((a, r) => a + (r[angleField] as number), 0);
  const fmt = (v: unknown) => {
    const n = toNumber(v);
    return n === null ? str(v) : formatNumber(n, formatter as 'auto', currency);
  };
  return (
    <AntProvider tokens={tokens} fill>
      <Frame title={title} empty={!rows.length} loading={loading} chartRef={ref}>
        <AntPie
          autoFit
          theme={theme.dark ? 'classicDark' : 'classic'}
          data={rows}
          angleField={angleField}
          colorField={colorField}
          innerRadius={Math.max(0, Math.min(0.9, Number(innerRadius) || 0))}
          scale={{ color: { range: [theme.brand, ...PALETTE] } }}
          legend={legend === 'none' ? false : { color: { position: legend, itemLabelFill: theme.text, rowPadding: 6 } }}
          label={label ? { text: (d: Row) => `${Math.round(((d[angleField] as number) / total) * 100)}%`, fill: '#fff', position: 'inside' } : false}
          tooltip={{ title: (d: Row) => str(d[colorField]), items: [{ field: angleField, valueFormatter: fmt }] }}
          style={{ stroke: theme.surface, lineWidth: 2 }}
          onEvent={(_chart: unknown, event: { type?: string; data?: { data?: Row } }) => {
            if (event?.type === 'element:click') {
              setSelectedDatum(event.data?.data ?? {});
              onElementClick();
            }
          }}
        />
      </Frame>
    </AntProvider>
  );
};

// Ant's Bar (horizontal bars): data, xField (the category, down the side), yField (one or several), colorField, stack,
// radius; event onElementClick.
export const Bar = () => {
  const p = useChartProps({ x: 'x', y: 'y' });
  const [stack] = ToolJet.useStateBoolean({ name: 'stack', label: 'Stack', initialValue: false });
  const [radius] = ToolJet.useStateNumber({ name: 'radius', label: 'Corner radius', initialValue: 4, min: 0, max: 20 });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 32 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const rows = toRows(p.rawData);
  const s = toSeries(rows, p.xField, yFields(p.yField), p.colorField);
  const common = useCommon(p, theme, s);
  const r = Math.max(0, Number(radius) || 0);
  return (
    <AntProvider tokens={tokens} fill>
      <Frame title={p.title} empty={!rows.length} loading={p.loading} chartRef={ref}>
        <AntBar
          {...(common as object)}
          data={s.data}
          xField={s.x}
          yField={s.y}
          colorField={s.color}
          stack={stack && !!s.color}
          group={!stack && !!s.color}
          style={{ radiusTopRight: r, radiusBottomRight: r, fill: s.color ? undefined : theme.brand }}
        />
      </Frame>
    </AntProvider>
  );
};

// Ant's DualAxes: two measures on their own y axes over one x. data, xField, yField [left, right], geometry
// [left, right] each column or line (Ant 1.x geometryOptions), yFormatter; event onElementClick.
export const DualAxes = () => {
  const p = useChartProps({ x: 'x', y: 'y' });
  const [geometry] = ToolJet.useStateArray({ name: 'geometry', label: 'Geometry', description: "[left, right]: 'column' or 'line'", initialValue: ['column', 'line'] });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 24, defaultHeight: 32 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const rows = toRows(p.rawData);
  const [left = 'y', right = ''] = yFields(p.yField);
  const kinds = toArray(geometry).map(str);
  const common = useCommon(p, theme, { y: left });
  const fmt = (v: unknown) => {
    const n = toNumber(v);
    return n === null ? str(v) : formatNumber(n, p.yFormatter as 'auto', p.currency);
  };
  const axisStyle = { labelFill: theme.muted, labelFillOpacity: 1, lineStroke: theme.border, tickStroke: theme.border, gridStroke: theme.border, gridStrokeOpacity: 1, labelFormatter: fmt };
  const layer = (field: string, kind: string, color: string, side: 'left' | 'right') =>
    kind === 'line'
      ? { type: 'line', yField: field, shapeField: 'smooth', style: { stroke: color, lineWidth: 2 }, scale: { y: { independent: side === 'right' } }, axis: { y: { position: side, ...axisStyle, grid: side === 'left' } } }
      : { type: 'interval', yField: field, style: { fill: color, radiusTopLeft: 4, radiusTopRight: 4, maxWidth: 40 }, scale: { y: { independent: side === 'right' } }, axis: { y: { position: side, ...axisStyle, grid: side === 'left' } } };
  const data = rows.map((r) => ({ ...r, [left]: toNumber(r[left]), ...(right ? { [right]: toNumber(r[right]) } : {}) }));
  return (
    <AntProvider tokens={tokens} fill>
      <Frame title={p.title} empty={!rows.length} loading={p.loading} chartRef={ref}>
        <AntDualAxes
          autoFit
          theme={(common as { theme: string }).theme}
          data={data}
          xField={p.xField}
          axis={{ x: { labelFill: theme.muted, labelFillOpacity: 1, lineStroke: theme.border, tickStroke: theme.border } }}
          legend={p.legend === 'none' ? false : { color: { position: p.legend, itemLabelFill: theme.text } }}
          onEvent={(common as { onEvent: unknown }).onEvent as never}
          children={[layer(left, kinds[0] || 'column', theme.brand, 'left'), ...(right ? [layer(right, kinds[1] || 'line', PALETTE[0], 'right')] : [])] as never}
        />
      </Frame>
    </AntProvider>
  );
};

// Ant's Funnel: data [{ stage, value }], xField (the stage), yField (the value), label (value and share of the
// first stage); event onElementClick.
export const Funnel = () => {
  const p = useChartProps({ x: 'stage', y: 'value' });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 32 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const y = yFields(p.yField)[0] ?? 'value';
  const rows = toRows(p.rawData).map((r) => ({ ...r, [y]: toNumber(r[y]) ?? 0 }));
  const first = (rows[0]?.[y] as number) || 1;
  const fmt = (v: unknown) => {
    const n = toNumber(v);
    return n === null ? str(v) : formatNumber(n, p.yFormatter as 'auto', p.currency);
  };
  return (
    <AntProvider tokens={tokens} fill>
      <Frame title={p.title} empty={!rows.length} loading={p.loading} chartRef={ref}>
        <AntFunnel
          autoFit
          theme={theme.dark ? 'classicDark' : 'classic'}
          data={rows}
          xField={p.xField}
          yField={y}
          scale={{ color: { range: [theme.brand, ...PALETTE] } }}
          legend={false}
          label={{ text: (d: Row) => `${str(d[p.xField])}  ${fmt(d[y])} (${Math.round(((d[y] as number) / first) * 100)}%)`, fill: '#fff', position: 'inside' }}
          tooltip={{ items: [{ field: y, valueFormatter: fmt }] }}
          onEvent={(_c: unknown, e: { type?: string; data?: { data?: Row } }) => {
            if (e?.type === 'element:click') {
              p.setSelectedDatum(e.data?.data ?? {});
              p.onElementClick();
            }
          }}
        />
      </Frame>
    </AntProvider>
  );
};

// Ant's Gauge: target (the value), total (the scale's end), name, thresholds (where the colour bands end, e.g.
// [40, 70, 100] reads red, amber, green), formatter.
export const Gauge = () => {
  const { loading } = ToolJet.useControlState();
  const [target] = ToolJet.useStateNumber({ name: 'target', label: 'Target', description: 'The value the needle shows.', initialValue: 0 });
  const [total] = ToolJet.useStateNumber({ name: 'total', label: 'Total', initialValue: 100, min: 1 });
  const [name] = ToolJet.useStateString({ name: 'name', label: 'Name', initialValue: '' });
  const [thresholds] = ToolJet.useStateArray({ name: 'thresholds', label: 'Thresholds', description: 'Ends of the colour bands, e.g. [40, 70, 100]; empty for one brand band.', initialValue: [] });
  const [formatter] = ToolJet.useStateEnumeration({ name: 'formatter', label: 'Formatter', enumDefinition: ['auto', 'number', 'currency', 'percent', 'compact'], initialValue: 'auto' });
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: '' });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 12, defaultHeight: 28 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const t = toNumber(target) ?? 0;
  const max = Math.max(1, toNumber(total) ?? 100);
  const bands = toArray(thresholds).map((v) => toNumber(v)).filter((v): v is number => v !== null);
  const shown = formatter === 'percent' ? formatNumber(t / max, 'percent') : formatNumber(t, formatter as 'auto');
  return (
    <AntProvider tokens={tokens} fill>
      <Frame title={title} empty={false} loading={loading} chartRef={ref}>
        <AntGauge
          autoFit
          theme={theme.dark ? 'classicDark' : 'classic'}
          data={{ target: t, total: max, name: name || 'value', ...(bands.length ? { thresholds: bands } : {}) }}
          scale={{ color: { range: bands.length > 1 ? ['#F4664A', '#FAAD14', '#30BF78', theme.brand].slice(0, bands.length) : [theme.brand] } }}
          style={{ textContent: () => shown, textFill: theme.text, textFontSize: 28 }}
          legend={false}
        />
      </Frame>
    </AntProvider>
  );
};

// Ant's Radar: data (wide rows, one per axis: [{ skill, alice, bob }], or long with colorField), xField (the axis
// name), yField (one or several series), area (filled); event onElementClick.
export const Radar = () => {
  const p = useChartProps({ x: 'x', y: 'y' });
  const [area] = ToolJet.useStateBoolean({ name: 'area', label: 'Area', description: 'Fill each series.', initialValue: true });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 32 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const rows = toRows(p.rawData);
  const s = toSeries(rows, p.xField, yFields(p.yField), p.colorField);
  const common = useCommon(p, theme, s);
  return (
    <AntProvider tokens={tokens} fill>
      <Frame title={p.title} empty={!rows.length} loading={p.loading} chartRef={ref}>
        <AntRadar
          {...(common as object)}
          data={s.data}
          xField={s.x}
          yField={s.y}
          colorField={s.color}
          area={area ? { style: { fillOpacity: 0.2 } } : undefined}
          point={{ size: 3 }}
          scale={{ x: { padding: 0.5, align: 0 }, y: { nice: true }, color: { range: [theme.brand, ...PALETTE] } }}
          axis={{ x: { grid: true, gridStroke: theme.border, labelFill: theme.muted, labelFillOpacity: 1 }, y: { gridStroke: theme.border, labelFill: theme.muted, gridLineWidth: 1 } }}
          style={{ lineWidth: 2, stroke: s.color ? undefined : theme.brand, fill: s.color ? undefined : theme.brand }}
        />
      </Frame>
    </AntProvider>
  );
};

// Ant's Scatter: data, xField, yField (numbers), colorField (a group), sizeField (bubble size), shapeField;
// event onElementClick.
export const Scatter = () => {
  const p = useChartProps({ x: 'x', y: 'y' });
  const [sizeField] = ToolJet.useStateString({ name: 'sizeField', label: 'Size field', description: 'A number field for bubble size.', initialValue: '' });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 32 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const y = yFields(p.yField)[0] ?? 'y';
  const rows = toRows(p.rawData).map((r) => ({ ...r, [p.xField]: toNumber(r[p.xField]) ?? r[p.xField], [y]: toNumber(r[y]) ?? r[y] }));
  const common = useCommon(p, theme, { color: p.colorField || undefined, y });
  return (
    <AntProvider tokens={tokens} fill>
      <Frame title={p.title} empty={!rows.length} loading={p.loading} chartRef={ref}>
        <AntScatter
          {...(common as object)}
          data={rows}
          xField={p.xField}
          yField={y}
          colorField={p.colorField || undefined}
          sizeField={sizeField || undefined}
          shapeField="point"
          axis={{ ...(common as { axis: Record<string, object> }).axis, x: { ...(common as { axis: Record<string, object> }).axis.x, grid: true } }}
          style={{ fillOpacity: 0.7, lineWidth: 0, fill: p.colorField ? undefined : theme.brand }}
        />
      </Frame>
    </AntProvider>
  );
};

// Ant's Heatmap (cells): data [{ x, y, value }], xField, yField (categories), colorField (the value), label;
// event onElementClick.
export const Heatmap = () => {
  const { loading } = ToolJet.useControlState();
  const [rawData] = ToolJet.useStateArray({ name: 'data', label: 'Data', description: '[{ day, hour, value }]', initialValue: [] });
  const [xField] = ToolJet.useStateString({ name: 'xField', label: 'X field', initialValue: 'x' });
  const [yField] = ToolJet.useStateString({ name: 'yField', label: 'Y field', initialValue: 'y' });
  const [colorField] = ToolJet.useStateString({ name: 'colorField', label: 'Color field', description: 'The value that sets the shade.', initialValue: 'value' });
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: '' });
  const [label] = ToolJet.useStateBoolean({ name: 'label', label: 'Label', initialValue: false });
  const [, setSelectedDatum] = ToolJet.useStateObject({ name: 'selectedDatum', initialValue: {}, inspector: 'hidden' });
  const onElementClick = ToolJet.useEventCallback({ name: 'onElementClick' });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 32 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const rows = toRows(rawData).map((r) => ({ ...r, [colorField]: toNumber(r[colorField]) ?? 0 }));
  return (
    <AntProvider tokens={tokens} fill>
      <Frame title={title} empty={!rows.length} loading={loading} chartRef={ref}>
        <AntHeatmap
          autoFit
          theme={theme.dark ? 'classicDark' : 'classic'}
          data={rows}
          xField={xField}
          yField={yField}
          colorField={colorField}
          mark="cell"
          scale={{ color: { range: [theme.dark ? '#1f2937' : '#eef2ff', theme.brand] } }}
          style={{ inset: 1 }}
          axis={{ x: { labelFill: theme.muted, labelFillOpacity: 1, tick: false, line: false }, y: { labelFill: theme.muted, labelFillOpacity: 1, tick: false, line: false } }}
          legend={{ color: { itemLabelFill: theme.text } }}
          label={label ? { text: colorField, fill: theme.text, position: 'inside' } : undefined}
          onEvent={(_c: unknown, e: { type?: string; data?: { data?: Row } }) => {
            if (e?.type === 'element:click') {
              setSelectedDatum(e.data?.data ?? {});
              onElementClick();
            }
          }}
        />
      </Frame>
    </AntProvider>
  );
};
