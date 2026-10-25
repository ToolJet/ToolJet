import React, { useMemo, useRef } from 'react';
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
import { useClickHighlight } from '../lib/chartHighlight';
import { mixRgb, tooltipInteraction, useChartTheme, useTooltipLayer, type Theme } from '../lib/chartTheme';
import { useNarrow } from '../lib/fitText';

// DualAxes' right-hand series: the next stock colour, or under a theme the brand's deeper shade (a tint beside the
// brand's columns read faint).
const dualSecond = (theme: Theme) => theme.palette[theme.themed ? 3 : 1];

// Series and slices take theme.palette (lib/chartTheme seriesPalette): stock Ant leads with antd's primary (or the
// component's colorPrimary style), then G2's own palette; an applied app theme draws them all from the theme.

/** Whether the element is narrower than `below` px, followed as it resizes. */
// Samples a fresh drop shows (x and y are the charts' default fields).
const MONTHLY = [{ x: 'Jan', y: 42 }, { x: 'Feb', y: 48 }, { x: 'Mar', y: 45 }, { x: 'Apr', y: 57 }, { x: 'May', y: 61 }, { x: 'Jun', y: 68 }];
const TREND = [{ x: 'Jan', y: 1200 }, { x: 'Feb', y: 1350 }, { x: 'Mar', y: 1280 }, { x: 'Apr', y: 1520 }, { x: 'May', y: 1610 }, { x: 'Jun', y: 1790 }];
const REGIONS = [{ x: 'North', y: 820 }, { x: 'West', y: 640 }, { x: 'South', y: 510 }, { x: 'East', y: 380 }];
const REVENUE_ORDERS = [{ x: 'Jan', y: 42, y2: 310 }, { x: 'Feb', y: 48, y2: 340 }, { x: 'Mar', y: 45, y2: 322 }, { x: 'Apr', y: 57, y2: 395 }, { x: 'May', y: 61, y2: 410 }, { x: 'Jun', y: 68, y2: 452 }];
const STAGES = [{ stage: 'Visited', value: 1200 }, { stage: 'Signed up', value: 540 }, { stage: 'Activated', value: 310 }, { stage: 'Paid', value: 120 }];
const SKILLS = [{ x: 'Speed', y: 80 }, { x: 'Quality', y: 65 }, { x: 'Cost', y: 90 }, { x: 'Support', y: 70 }, { x: 'Reach', y: 75 }];
const POINTS = [{ x: 12, y: 34 }, { x: 18, y: 41 }, { x: 25, y: 38 }, { x: 31, y: 52 }, { x: 38, y: 49 }, { x: 44, y: 63 }, { x: 52, y: 58 }, { x: 60, y: 71 }];

const HIGHLIGHT_HELP = 'Keeps the clicked mark at full strength and fades the rest, until Clear clicked point runs or another is clicked.';

/** Highlight clicked point and the clicked datum (selectedDatum), with the clearClickedPoint action, for every chart that
 *  takes clicks (UI 2.0's Highlight clicked point and Clear clicked point). */
const useClicked = () => {
  const [highlightClicked] = ToolJet.useStateBoolean({ name: 'highlightClicked', label: 'Highlight clicked point', description: HIGHLIGHT_HELP, initialValue: false });
  const [selectedDatum, setSelectedDatum] = ToolJet.useStateObject({ name: 'selectedDatum', initialValue: {}, inspector: 'hidden' });
  const onElementClick = ToolJet.useEventCallback({ name: 'onElementClick' });
  ToolJet.useAction({ name: 'clearClickedPoint', displayName: 'Clear clicked point' }, () => setSelectedDatum({}));
  const highlight = useClickHighlight(highlightClicked, selectedDatum);
  return { highlight, highlightOn: highlightClicked === true, setSelectedDatum, onElementClick };
};

// data is the sample a fresh drop shows, keyed by the default fields.
const useChartProps = (defaults: { x?: string; y?: string; ys?: string[]; data?: Row[] } = {}) => {
  const [rawData] = ToolJet.useStateArray({ name: 'data', label: 'Data', description: 'Rows, one per x value: [{ month, sales }]', initialValue: defaults.data ?? [] });
  const [xField] = ToolJet.useStateString({ name: 'xField', label: 'X field', initialValue: defaults.x ?? 'x' });
  const [yField] = ToolJet.useStateArray({
    name: 'yField',
    label: 'Y field',
    description: "One field ('sales') or several (['sales', 'cost']), each a series.",
    initialValue: defaults.ys ?? [defaults.y ?? 'y'],
  });
  const [colorField] = ToolJet.useStateString({ name: 'colorField', label: 'Color field', description: 'A field naming the series, for long data (one row per x and series).', initialValue: '' });
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: '' });
  const [legend] = ToolJet.useStateEnumeration({ name: 'legend', label: 'Legend', enumDefinition: ['top', 'bottom', 'right', 'none'], initialValue: 'top' });
  const [label] = ToolJet.useStateBoolean({ name: 'label', label: 'Label', description: 'Values on the marks.', initialValue: false });
  const [yFormatter] = ToolJet.useStateEnumeration({ name: 'yFormatter', label: 'Y formatter', enumDefinition: ['auto', 'number', 'currency', 'percent', 'compact'], initialValue: 'compact' });
  const [currency] = ToolJet.useStateString({ name: 'currency', label: 'Currency', initialValue: 'USD', visibleWhen: { key: 'yFormatter', value: 'currency' } });
  const { highlight, highlightOn, setSelectedDatum, onElementClick } = useClicked();
  const { loading } = ToolJet.useControlState();
  return { loading, rawData, xField, yField, colorField, title, legend, label, yFormatter, currency, setSelectedDatum, onElementClick, highlight, highlightOn };
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
  series: { color?: string; y: string },
  tips?: HTMLElement
) => {
  const common = useMemo(() => {
    const fmt = (v: unknown) => {
      const n = toNumber(v);
      return n === null ? str(v) : formatNumber(n, p.yFormatter as 'auto', p.currency);
    };
    const axisStyle = { labelFill: theme.axis, labelFillOpacity: 1, lineStroke: theme.border, tickStroke: theme.border, gridStroke: theme.border, gridStrokeOpacity: 1, titleFill: theme.axis };
    return {
      autoFit: true,
      theme: theme.dark ? 'classicDark' : 'classic',
      scale: { color: { range: theme.palette } },
      axis: { x: { ...axisStyle, grid: false }, y: { ...axisStyle, labelFormatter: fmt } },
      legend: p.legend === 'none' || !series.color ? false : { color: { position: p.legend, itemLabelFill: theme.text } },
      // One y item per series under the x title: a bare { valueFormatter } left G2's default item, which drew the
      // category twice and no value on a Column.
      tooltip: { items: [{ channel: 'y', valueFormatter: fmt }] },
      interaction: tooltipInteraction(tips),
      label: p.label ? { text: (d: Row) => fmt(d[series.y]), fill: theme.text, position: 'inside' } : undefined,
      viewStyle: { viewFill: 'transparent' },
      onEvent: (_chart: unknown, event: { type?: string; data?: { data?: Row } }) => {
        if (event?.type === 'element:click') {
          p.setSelectedDatum(event.data?.data ?? {});
          p.onElementClick();
        }
      },
    };
  }, [p.yFormatter, p.currency, p.legend, p.label, theme, series.color, series.y, tips]);
  // A fresh scale on every render: Ant's charts write into the scale they are given (a Line of all zeros sets
  // y.domainMax 1), and a memoised one kept that limit once the real data came, drawing the lines off the plot.
  // Ant compares configs by content, so a new object with the same content does not redraw the chart.
  return { ...common, scale: { color: { range: theme.palette } } };
};

// Ant's Column (vertical bars): data, xField, yField, colorField, stack, group (side by side when several series),
// radius, legend, label; event onElementClick with selectedDatum exposed.
export const Column = () => {
  const p = useChartProps({ x: 'x', y: 'y', data: MONTHLY });
  const [stack] = ToolJet.useStateBoolean({ name: 'stack', label: 'Stack', description: 'Stack the series instead of grouping them.', initialValue: false });
  const [horizontal] = ToolJet.useStateBoolean({ name: 'horizontal', label: 'Horizontal', description: "Draw as Ant's Bar (horizontal bars).", initialValue: false });
  const [radius] = ToolJet.useStateNumber({ name: 'radius', label: 'Corner radius', initialValue: 4, min: 0, max: 20 });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 32 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const tips = useTooltipLayer(ref, theme.dark);
  const rows = toRows(p.rawData);
  const s = toSeries(rows, p.xField, yFields(p.yField), p.colorField);
  const common = useCommon(p, theme, s, tips);
  const r = Math.max(0, Number(radius) || 0);
  const Chart = horizontal ? AntBar : AntColumn;
  const marked = p.highlight ? { fillOpacity: p.highlight.opacity({ keys: [s.x, s.color] }) } : {};
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
          style={horizontal ? { radiusTopRight: r, radiusBottomRight: r, fill: s.color ? undefined : theme.brand, ...marked } : { radiusTopLeft: r, radiusTopRight: r, fill: s.color ? undefined : theme.brand, ...marked }}
        />
      </Frame>
    </AntProvider>
  );
};

// Ant's Line: data, xField, yField, colorField, smooth (shapeField 'smooth'), point; event onElementClick.
export const Line = () => {
  const p = useChartProps({ x: 'x', y: 'y', data: TREND });
  const [smooth] = ToolJet.useStateBoolean({ name: 'smooth', label: 'Smooth', initialValue: true });
  const [point] = ToolJet.useStateBoolean({ name: 'point', label: 'Point', description: 'A dot on every value.', initialValue: false });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 32 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const tips = useTooltipLayer(ref, theme.dark);
  const rows = toRows(p.rawData);
  const s = toSeries(rows, p.xField, yFields(p.yField), p.colorField);
  const common = useCommon(p, theme, s, tips);
  // Highlighted: the clicked line stays and the others fade; a clicked point is marked. With Point off the points are
  // there to be clicked but drawn only once clicked.
  const h = p.highlight;
  const dot = { keys: [s.x, s.y, s.color], rowOnly: true };
  const points = point
    ? { shapeField: 'circle', sizeField: 3, ...(h ? { style: { opacity: h.opacity(dot) } } : {}) }
    : p.highlightOn
      ? { shapeField: 'circle', sizeField: 4, style: { opacity: h ? h.opacity(dot, 1, 0) : 0 } }
      : undefined;
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
          point={points}
          style={{ lineWidth: 2, stroke: s.color ? undefined : theme.brand, ...(h ? { strokeOpacity: h.opacity({ keys: [s.color], series: s.color }) } : {}) }}
        />
      </Frame>
    </AntProvider>
  );
};

// Ant's Area: data, xField, yField, colorField, stack, smooth; event onElementClick.
export const Area = () => {
  const p = useChartProps({ x: 'x', y: 'y', data: TREND });
  const [stack] = ToolJet.useStateBoolean({ name: 'stack', label: 'Stack', initialValue: true });
  const [smooth] = ToolJet.useStateBoolean({ name: 'smooth', label: 'Smooth', initialValue: true });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 32 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const tips = useTooltipLayer(ref, theme.dark);
  const rows = toRows(p.rawData);
  const s = toSeries(rows, p.xField, yFields(p.yField), p.colorField);
  const common = useCommon(p, theme, s, tips);
  // Highlighted: the clicked area (its series) stays and the others fade.
  const h = p.highlight;
  const bySeries = { keys: [s.color], series: s.color };
  const fillOpacity = s.color && !stack ? 0.25 : 0.4;
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
          style={{ fillOpacity: h ? h.opacity(bySeries, fillOpacity) : fillOpacity, fill: s.color ? undefined : theme.brand }}
          line={{ style: { lineWidth: 2, stroke: s.color ? undefined : theme.brand, ...(h ? { strokeOpacity: h.opacity(bySeries) } : {}) } }}
        />
      </Frame>
    </AntProvider>
  );
};

// Ant's Pie: data, angleField (the value), colorField (the category), innerRadius (0 for a pie, about 0.6 for a
// donut), label (percent on the slices), legend; event onElementClick.
export const Pie = () => {
  const { loading } = ToolJet.useControlState();
  const [rawData] = ToolJet.useStateArray({ name: 'data', label: 'Data', description: '[{ type, value }]', initialValue: [{ type: 'Charter', value: 62 }, { type: 'Day trip', value: 24 }, { type: 'Event', value: 14 }] });
  const [angleField] = ToolJet.useStateString({ name: 'angleField', label: 'Angle field', description: 'The value of each slice.', initialValue: 'value' });
  const [colorField] = ToolJet.useStateString({ name: 'colorField', label: 'Color field', description: 'The category of each slice.', initialValue: 'type' });
  const [innerRadius] = ToolJet.useStateNumber({ name: 'innerRadius', label: 'Inner radius', description: '0 to 0.9', initialValue: 0.6, min: 0, max: 0.9 });
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: '' });
  const [legend] = ToolJet.useStateEnumeration({ name: 'legend', label: 'Legend', enumDefinition: ['right', 'bottom', 'top', 'none'], initialValue: 'right' });
  const [label] = ToolJet.useStateBoolean({ name: 'label', label: 'Label', description: 'Percent on the slices.', initialValue: false });
  const [formatter] = ToolJet.useStateEnumeration({ name: 'formatter', label: 'Formatter', enumDefinition: ['auto', 'number', 'currency', 'percent', 'compact'], initialValue: 'auto' });
  const [currency] = ToolJet.useStateString({ name: 'currency', label: 'Currency', initialValue: 'USD', visibleWhen: { key: 'formatter', value: 'currency' } });
  const { highlight, setSelectedDatum, onElementClick } = useClicked();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 32 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const tips = useTooltipLayer(ref, theme.dark);
  const narrow = useNarrow(ref, 420);
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
          scale={{ color: { range: theme.palette } }}
          // A legend at the right of a narrow pie (a card a quarter of the page wide) left the ring a third of the
          // card; under it, the ring keeps the width.
          legend={legend === 'none' ? false : { color: { position: legend === 'right' && narrow ? 'bottom' : legend, itemLabelFill: theme.text, rowPadding: 6 } }}
          label={label ? { text: (d: Row) => `${Math.round(((d[angleField] as number) / total) * 100)}%`, fill: '#fff', position: 'inside' } : false}
          tooltip={{ title: (d: Row) => str(d[colorField]), items: [{ field: angleField, valueFormatter: fmt }] }}
          interaction={tooltipInteraction(tips)}
          style={{ stroke: theme.surface, lineWidth: 2, ...(highlight ? { fillOpacity: highlight.opacity({ keys: [colorField] }) } : {}) }}
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
  const p = useChartProps({ x: 'x', y: 'y', data: REGIONS });
  const [stack] = ToolJet.useStateBoolean({ name: 'stack', label: 'Stack', initialValue: false });
  const [radius] = ToolJet.useStateNumber({ name: 'radius', label: 'Corner radius', initialValue: 4, min: 0, max: 20 });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 32 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const tips = useTooltipLayer(ref, theme.dark);
  const rows = toRows(p.rawData);
  const s = toSeries(rows, p.xField, yFields(p.yField), p.colorField);
  const common = useCommon(p, theme, s, tips);
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
          style={{ radiusTopRight: r, radiusBottomRight: r, fill: s.color ? undefined : theme.brand, ...(p.highlight ? { fillOpacity: p.highlight.opacity({ keys: [s.x, s.color] }) } : {}) }}
        />
      </Frame>
    </AntProvider>
  );
};

// Ant's DualAxes: two measures on their own y axes over one x. data, xField, yField [left, right], geometry
// [left, right] each column or line (Ant 1.x geometryOptions), yFormatter; event onElementClick.
export const DualAxes = () => {
  const p = useChartProps({ x: 'x', y: 'y', ys: ['y', 'y2'], data: REVENUE_ORDERS });
  const [geometry] = ToolJet.useStateArray({ name: 'geometry', label: 'Geometry', description: "[left, right]: 'column' or 'line'", initialValue: ['column', 'line'] });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 24, defaultHeight: 32 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const tips = useTooltipLayer(ref, theme.dark);
  const rows = toRows(p.rawData);
  const [left = 'y', right = ''] = yFields(p.yField);
  const kinds = toArray(geometry).map(str);
  const common = useCommon(p, theme, { y: left }, tips);
  const fmt = (v: unknown) => {
    const n = toNumber(v);
    return n === null ? str(v) : formatNumber(n, p.yFormatter as 'auto', p.currency);
  };
  const axisStyle = { labelFill: theme.axis, labelFillOpacity: 1, lineStroke: theme.border, tickStroke: theme.border, gridStroke: theme.border, gridStrokeOpacity: 1, labelFormatter: fmt };
  const layer = (field: string, kind: string, color: string, side: 'left' | 'right') =>
    kind === 'line'
      ? { type: 'line', yField: field, shapeField: 'smooth', style: { stroke: color, lineWidth: 2 }, scale: { y: { independent: side === 'right' } }, axis: { y: { position: side, ...axisStyle, grid: side === 'left' } } }
      : { type: 'interval', yField: field, style: { fill: color, radiusTopLeft: 4, radiusTopRight: 4, maxWidth: 40, ...(p.highlight ? { fillOpacity: p.highlight.opacity({ keys: [p.xField] }) } : {}) }, scale: { y: { independent: side === 'right' } }, axis: { y: { position: side, ...axisStyle, grid: side === 'left' } } };
  const data = rows.map((r) => ({ ...r, [left]: toNumber(r[left]), ...(right ? { [right]: toNumber(r[right]) } : {}) }));
  return (
    <AntProvider tokens={tokens} fill>
      <Frame title={p.title} empty={!rows.length} loading={p.loading} chartRef={ref}>
        <AntDualAxes
          autoFit
          theme={(common as { theme: string }).theme}
          data={data}
          xField={p.xField}
          axis={{ x: { labelFill: theme.axis, labelFillOpacity: 1, lineStroke: theme.border, tickStroke: theme.border } }}
          legend={p.legend === 'none' ? false : { color: { position: p.legend, itemLabelFill: theme.text } }}
          // The legend's markers come from the colour scale (one entry per y field, in layer order); the layers set
          // their colours only through style, so the left series' marker was G2's default blue next to brand bars.
          scale={{ color: { range: [theme.brand, dualSecond(theme)] } }}
          interaction={tooltipInteraction(tips)}
          onEvent={(common as { onEvent: unknown }).onEvent as never}
          children={[layer(left, kinds[0] || 'column', theme.brand, 'left'), ...(right ? [layer(right, kinds[1] || 'line', dualSecond(theme), 'right')] : [])] as never}
        />
      </Frame>
    </AntProvider>
  );
};

// Ant's Funnel: data [{ stage, value }], xField (the stage), yField (the value), label (value and share of the
// first stage); event onElementClick.
export const Funnel = () => {
  const p = useChartProps({ x: 'stage', y: 'value', data: STAGES });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 32 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const tips = useTooltipLayer(ref, theme.dark);
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
          scale={{ color: { range: theme.palette } }}
          legend={false}
          label={{ text: (d: Row) => `${str(d[p.xField])}  ${fmt(d[y])} (${Math.round(((d[y] as number) / first) * 100)}%)`, fill: '#fff', position: 'inside' }}
          tooltip={{ items: [{ field: y, valueFormatter: fmt }] }}
          interaction={tooltipInteraction(tips)}
          style={p.highlight ? { fillOpacity: p.highlight.opacity({ keys: [p.xField] }) } : undefined}
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
  const [target] = ToolJet.useStateNumber({ name: 'target', label: 'Target', description: 'The value the needle shows.', initialValue: 72 });
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
          scale={{ color: { range: bands.length > 1 ? (theme.themed ? [theme.error, theme.warning, theme.success, theme.brand] : ['#F4664A', '#FAAD14', '#30BF78', theme.brand]).slice(0, bands.length) : [theme.brand] } }}
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
  const p = useChartProps({ x: 'x', y: 'y', data: SKILLS });
  const [area] = ToolJet.useStateBoolean({ name: 'area', label: 'Area', description: 'Fill each series.', initialValue: true });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 32 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const tips = useTooltipLayer(ref, theme.dark);
  const rows = toRows(p.rawData);
  const s = toSeries(rows, p.xField, yFields(p.yField), p.colorField);
  const common = useCommon(p, theme, s, tips);
  // Highlighted: the clicked series stays and the others fade; a clicked point stays and the other points fade.
  const h = p.highlight;
  return (
    <AntProvider tokens={tokens} fill>
      <Frame title={p.title} empty={!rows.length} loading={p.loading} chartRef={ref}>
        <AntRadar
          {...(common as object)}
          data={s.data}
          xField={s.x}
          yField={s.y}
          colorField={s.color}
          area={area ? { style: { fillOpacity: h ? h.opacity({ keys: [s.color], series: s.color }, 0.2) : 0.2 } } : undefined}
          // One series: points in the brand like its line (they had no colour and drew G2's default blue).
          point={{ size: 3, style: { ...(s.color ? {} : { fill: theme.brand, stroke: theme.brand }), ...(h ? { opacity: h.opacity({ keys: [s.x, s.y, s.color], rowOnly: true }) } : {}) } }}
          scale={{ x: { padding: 0.5, align: 0 }, y: { nice: true }, color: { range: theme.palette } }}
          axis={{ x: { grid: true, gridStroke: theme.border, labelFill: theme.axis, labelFillOpacity: 1 }, y: { gridStroke: theme.border, labelFill: theme.axis, labelFillOpacity: 1, gridLineWidth: 1 } }}
          style={{ lineWidth: 2, stroke: s.color ? undefined : theme.brand, fill: s.color ? undefined : theme.brand, ...(h ? { strokeOpacity: h.opacity({ keys: [s.color], series: s.color }) } : {}) }}
        />
      </Frame>
    </AntProvider>
  );
};

// Ant's Scatter: data, xField, yField (numbers), colorField (a group), sizeField (bubble size), shapeField;
// event onElementClick.
export const Scatter = () => {
  const p = useChartProps({ x: 'x', y: 'y', data: POINTS });
  const [sizeField] = ToolJet.useStateString({ name: 'sizeField', label: 'Size field', description: 'A number field for bubble size.', initialValue: '' });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 32 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const tips = useTooltipLayer(ref, theme.dark);
  const y = yFields(p.yField)[0] ?? 'y';
  const rows = toRows(p.rawData).map((r) => ({ ...r, [p.xField]: toNumber(r[p.xField]) ?? r[p.xField], [y]: toNumber(r[y]) ?? r[y] }));
  const common = useCommon(p, theme, { color: p.colorField || undefined, y }, tips);
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
          style={{ fillOpacity: p.highlight ? p.highlight.opacity({ keys: [p.xField, y, p.colorField] }, 0.7) : 0.7, lineWidth: 0, fill: p.colorField ? undefined : theme.brand }}
        />
      </Frame>
    </AntProvider>
  );
};

// Ant's Heatmap (cells): data [{ x, y, value }], xField, yField (categories), colorField (the value), label;
// event onElementClick.
export const Heatmap = () => {
  const { loading } = ToolJet.useControlState();
  const [rawData] = ToolJet.useStateArray({ name: 'data', label: 'Data', description: '[{ day, hour, value }]', initialValue: [
    { x: 'Mon', y: 'Morning', value: 12 },
    { x: 'Mon', y: 'Afternoon', value: 18 },
    { x: 'Mon', y: 'Evening', value: 9 },
    { x: 'Tue', y: 'Morning', value: 15 },
    { x: 'Tue', y: 'Afternoon', value: 22 },
    { x: 'Tue', y: 'Evening', value: 11 },
    { x: 'Wed', y: 'Morning', value: 20 },
    { x: 'Wed', y: 'Afternoon', value: 27 },
    { x: 'Wed', y: 'Evening', value: 14 },
    { x: 'Thu', y: 'Morning', value: 17 },
    { x: 'Thu', y: 'Afternoon', value: 24 },
    { x: 'Thu', y: 'Evening', value: 10 },
    { x: 'Fri', y: 'Morning', value: 25 },
    { x: 'Fri', y: 'Afternoon', value: 31 },
    { x: 'Fri', y: 'Evening', value: 19 },
  ] });
  const [xField] = ToolJet.useStateString({ name: 'xField', label: 'X field', initialValue: 'x' });
  const [yField] = ToolJet.useStateString({ name: 'yField', label: 'Y field', initialValue: 'y' });
  const [colorField] = ToolJet.useStateString({ name: 'colorField', label: 'Color field', description: 'The value that sets the shade.', initialValue: 'value' });
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: '' });
  const [label] = ToolJet.useStateBoolean({ name: 'label', label: 'Label', initialValue: false });
  const { highlight, setSelectedDatum, onElementClick } = useClicked();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 32 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const tips = useTooltipLayer(ref, theme.dark);
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
          scale={{ color: { range: [theme.themed ? mixRgb(theme.brand, theme.surface, 0.1) : theme.dark ? '#1f2937' : '#eef2ff', theme.brand] } }}
          style={highlight ? { inset: 1, fillOpacity: highlight.opacity({ keys: [xField, yField] }) } : { inset: 1 }}
          axis={{ x: { labelFill: theme.axis, labelFillOpacity: 1, tick: false, line: false }, y: { labelFill: theme.axis, labelFillOpacity: 1, tick: false, line: false } }}
          legend={{ color: { itemLabelFill: theme.text } }}
          interaction={tooltipInteraction(tips)}
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
