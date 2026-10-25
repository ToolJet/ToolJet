import React, { useMemo, useRef } from 'react';
import { RadialBar, Tiny } from '@ant-design/plots';
import { Empty, Progress, Typography } from 'antd';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, useIsDark, useTokenStyles } from '../lib/AntProvider';
import { ChartVeil, SpinOver } from '../lib/Loading';
import { tooltipInteraction, useChartTheme, useTooltipLayer } from '../lib/chartTheme';
import { str, toArray, type Row } from '../lib/data';
import { formatNumber, toNumber } from '../lib/format';
import { useFitSquare, useNarrow } from '../lib/fitText';

// G2's default categorical palette (antd's charts).
const G2 = ['#1783FF', '#00C9C9', '#F0884D', '#D580FF', '#7863FF', '#60C42D', '#BD8F24', '#FF80CA', '#2491B3', '#17C76F'];

const numbersOf = (data: unknown, field: string): number[] =>
  toArray(data)
    .map((d) => (d && typeof d === 'object' ? toNumber((d as Row)[field] ?? (d as Row).value ?? (d as Row).y) : toNumber(d)))
    .filter((n): n is number => n !== null);

// A trend line with no axes, Ant's Tiny chart (@ant-design/plots): data (numbers, or rows with valueField), type (line,
// area, column), smooth, colorByTrend (green up, red down; lowerIsBetter flips it), color, valuePrefix / valueSuffix
// for the tooltip; trend (up, down, flat) and lastValue exposed; events onClick, onDoubleClick.
export const Sparkline = () => {
  const [data] = ToolJet.useStateArray({ name: 'data', label: 'Data', description: '[12, 18, 15, 22] or [{ value }]', initialValue: [12, 18, 15, 22, 19, 26, 24, 31] });
  const [valueField] = ToolJet.useStateString({ name: 'valueField', label: 'Value field', initialValue: 'value' });
  const [type] = ToolJet.useStateEnumeration({ name: 'type', label: 'Type', enumDefinition: ['line', 'area', 'column'], initialValue: 'line' });
  const [smooth] = ToolJet.useStateBoolean({ name: 'smooth', label: 'Smooth', initialValue: true });
  const [colorByTrend] = ToolJet.useStateBoolean({ name: 'colorByTrend', label: 'Color by trend', initialValue: false });
  const [lowerIsBetter] = ToolJet.useStateBoolean({ name: 'lowerIsBetter', label: 'Lower is better', initialValue: false, visibleWhen: { key: 'colorByTrend', value: true } });
  const [color] = ToolJet.useStateString({ name: 'color', label: 'Color', initialValue: '' });
  const [valuePrefix] = ToolJet.useStateString({ name: 'valuePrefix', label: 'Value prefix', initialValue: '' });
  const [valueSuffix] = ToolJet.useStateString({ name: 'valueSuffix', label: 'Value suffix', initialValue: '' });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty text', initialValue: 'No data' });
  const [, setTrend] = ToolJet.useStateString({ name: 'trend', initialValue: '', inspector: 'hidden' });
  const [, setLastValue] = ToolJet.useStateNumber({ name: 'lastValue', initialValue: undefined as unknown as number, inspector: 'hidden' });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const onDoubleClick = ToolJet.useEventCallback({ name: 'onDoubleClick' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 6 });
  const ref = useRef<HTMLDivElement>(null);
  const theme = useChartTheme(ref);
  const tips = useTooltipLayer(ref, theme.dark);
  const values = useMemo(() => numbersOf(data, valueField), [data, valueField]);
  const first = values[0];
  const last = values[values.length - 1];
  const trend = values.length < 2 ? '' : last! > first! ? 'up' : last! < first! ? 'down' : 'flat';
  React.useEffect(() => {
    setTrend(trend);
    setLastValue((last ?? undefined) as number);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trend, last]);
  const good = lowerIsBetter ? trend === 'down' : trend === 'up';
  // The theme's brand, success and error (stock Ant's without a theme), read like the other charts' colours.
  const stroke = color || (colorByTrend && trend && trend !== 'flat' ? (good ? theme.success : theme.error) : theme.brand);
  const Chart = type === 'area' ? Tiny.Area : type === 'column' ? Tiny.Column : Tiny.Line;
  const fmt = (v: unknown) => `${valuePrefix}${formatNumber(toNumber(v) ?? 0)}${valueSuffix}`;
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-spark">
      <ChartVeil loading={loading}>
        <div ref={ref} className="tj-ant-spark-body" onClick={() => onClick()} onDoubleClick={() => onDoubleClick()}>
          {!theme.ready ? null : values.length ? (
            <Chart
              autoFit
              data={values.map((value, i) => ({ i, value }))}
              xField="i"
              yField="value"
              shapeField={smooth && type !== 'column' ? 'smooth' : undefined}
              style={type === 'column' ? { fill: stroke, radiusTopLeft: 2, radiusTopRight: 2 } : type === 'area' ? { fill: stroke, fillOpacity: 0.2, stroke, lineWidth: 2 } : { stroke, lineWidth: 2 }}
              tooltip={{ title: false, items: [{ channel: 'y', valueFormatter: fmt }] } as never}
              interaction={tooltipInteraction(tips) as never}
            />
          ) : (
            <Typography.Text type="secondary">{emptyText}</Typography.Text>
          )}
        </div>
      </ChartVeil>
    </AntProvider>
  );
};

// A ring chart: mode progress (one value of a maximum: Ant's Progress, type dashboard or circle) or categories (Ant's
// RadialBar of data with categoryField and valueField). centerValue / centerLabel, strokeWidth, gapDegree (the
// dashboard's opening), showLegend, colors; onClick with clickedDataPoint exposed; action clearClickedPoint.
export const RadialChart = () => {
  const [mode] = ToolJet.useStateEnumeration({ name: 'mode', label: 'Mode', enumDefinition: ['progress', 'categories'], initialValue: 'progress' });
  const [value] = ToolJet.useStateNumber({ name: 'value', label: 'Value', initialValue: 68, visibleWhen: { key: 'mode', value: 'progress' } });
  const [maxValue] = ToolJet.useStateNumber({ name: 'maxValue', label: 'Max value', initialValue: 100, visibleWhen: { key: 'mode', value: 'progress' } });
  const [data] = ToolJet.useStateArray({ name: 'data', label: 'Data', initialValue: [{ name: 'Charter', value: 62 }, { name: 'Day trip', value: 24 }, { name: 'Event', value: 14 }], visibleWhen: { key: 'mode', value: 'categories' } });
  const [categoryField] = ToolJet.useStateString({ name: 'categoryField', label: 'Category field', initialValue: 'name', visibleWhen: { key: 'mode', value: 'categories' } });
  const [valueField] = ToolJet.useStateString({ name: 'valueField', label: 'Value field', initialValue: 'value', visibleWhen: { key: 'mode', value: 'categories' } });
  const [centerValue] = ToolJet.useStateString({ name: 'centerValue', label: 'Center value', description: 'Empty shows the percent.', initialValue: '' });
  const [centerLabel] = ToolJet.useStateString({ name: 'centerLabel', label: 'Center label', initialValue: '' });
  const [type] = ToolJet.useStateEnumeration({ name: 'type', label: 'Type', enumDefinition: ['circle', 'dashboard'], initialValue: 'dashboard' });
  const [strokeWidth] = ToolJet.useStateNumber({ name: 'strokeWidth', label: 'Stroke width', initialValue: 8, min: 2, max: 30 });
  const [showLegend] = ToolJet.useStateBoolean({ name: 'showLegend', label: 'Show legend', initialValue: true });
  const [colors] = ToolJet.useStateArray({ name: 'colors', label: 'Colors', initialValue: [] });
  const [, setClickedDataPoint] = ToolJet.useStateObject({ name: 'clickedDataPoint', initialValue: {}, inspector: 'hidden' });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 24 });
  ToolJet.useAction({ name: 'clearClickedPoint', displayName: 'Clear clicked point' }, () => setClickedDataPoint({}));
  const palette = toArray(colors).map(str).filter(Boolean);
  // The progress ring is Ant's default 120px, or the largest square the box has room for (it was cut in a narrow box).
  const [ringBox, ringPx] = useFitSquare<HTMLDivElement>(120);
  if (mode === 'categories') {
    const rows = toArray(data)
      .map((d) => (d && typeof d === 'object' ? { name: str((d as Row)[categoryField]), value: toNumber((d as Row)[valueField]) ?? 0 } : null))
      .filter((r): r is { name: string; value: number } => !!r && !!r.name);
    return (
      <AntProvider tokens={tokens} fill className="tj-ant-chart-frame">
        <ChartVeil loading={loading}>
          <RadialCategories rows={rows} palette={palette.length ? palette : G2} showLegend={showLegend} onPick={(d) => { setClickedDataPoint(d); onClick(); }} />
        </ChartVeil>
      </AntProvider>
    );
  }
  const max = Math.max(1, toNumber(maxValue) ?? 100);
  const pct = Math.max(0, Math.min(100, ((toNumber(value) ?? 0) / max) * 100));
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-ring tj-ant-ring--fill">
      <SpinOver loading={loading} as="fill">
        <div
          ref={ringBox}
          className="tj-ant-ring-box tj-ant-ring-fit"
          onClick={() => {
            setClickedDataPoint({ value: toNumber(value) ?? 0, maxValue: max, percent: pct });
            onClick();
          }}
        >
          <Progress
            type={type as 'dashboard'}
            percent={Math.round(pct * 10) / 10}
            size={ringPx}
            strokeWidth={Math.max(2, Math.min(30, Number(strokeWidth) || 8))}
            strokeColor={palette[0] || undefined}
            format={() => (
              <span className="tj-ant-ring-center">
                <span>{centerValue || `${Math.round(pct)}%`}</span>
                {centerLabel ? <small>{centerLabel}</small> : null}
              </span>
            )}
          />
        </div>
      </SpinOver>
    </AntProvider>
  );
};

const RadialCategories = ({ rows, palette, showLegend, onPick }: { rows: { name: string; value: number }[]; palette: string[]; showLegend: boolean; onPick: (d: Row) => void }) => {
  const dark = useIsDark();
  // A legend at the right of a narrow box left the rings a sliver; under them, the rings keep the width (as the Pie's).
  const ref = useRef<HTMLDivElement>(null);
  const narrow = useNarrow(ref, 320);
  // The box is drawn while empty too: it is measured once, on mount.
  return (
    <div ref={ref} className="tj-ant-chart-fill">
      {!rows.length ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />
      ) : (
        <RadialBar
          autoFit
          theme={dark ? 'classicDark' : 'classic'}
          data={rows}
          xField="name"
          yField="value"
          colorField="name"
          maxAngle={270}
          radius={1}
          innerRadius={0.25}
          scale={{ color: { range: palette } }}
          legend={showLegend ? { color: { position: narrow ? 'bottom' : 'right' } } : false}
          style={{ radius: 26 }}
          onEvent={(_c: unknown, e: { type?: string; data?: { data?: Row } }) => {
            if (e?.type === 'element:click') onPick(e.data?.data ?? {});
          }}
        />
      )}
    </div>
  );
};
