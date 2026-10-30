import React, { useEffect, useMemo } from 'react';
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ReferenceArea, Tooltip, XAxis, YAxis } from 'recharts';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { ChartFrame, InlineTip, useSvgId } from '../lib/ui2/charts/chartParts';
import {
  MAX_ROWS,
  animated,
  axisLabel,
  clamp,
  curveOf,
  formatter,
  isRecord,
  isSet,
  num,
} from '../lib/ui2/charts/chartModel';
import { LoadingFrame, blockLook, useLoadingLook } from '../lib/ui2/loading/look';
import { TOKEN, useThemeColor } from '../lib/styleDefaults';

interface SparkPoint {
  i: number;
  x: string | number;
  y: number | null;
}

/** Points from [3, 5, 4], '3,5,4' or [{ x, y }] (also { label, value }); the last MAX_ROWS are kept. */
const sparkPoints = (data: unknown): SparkPoint[] => {
  const raw: unknown[] = Array.isArray(data) ? data : typeof data === 'string' ? data.split(',') : [];
  return raw.slice(-MAX_ROWS).map((d, i) => {
    if (isRecord(d)) {
      const x = d.x !== undefined ? d.x : d.label;
      return { i, x: isSet(x) ? axisLabel(x) : i + 1, y: num(d.y !== undefined ? d.y : d.value) };
    }
    return { i, x: i + 1, y: num(d) };
  });
};

const finite = (points: SparkPoint[]) => points.filter((p): p is SparkPoint & { y: number } => p.y !== null);

/** 'up', 'down' or 'flat': the last value against the first. With lowerIsBetter, a fall counts as up (good). */
const trendOf = (points: SparkPoint[], lowerIsBetter: boolean): 'up' | 'down' | 'flat' => {
  const ys = finite(points);
  if (ys.length < 2) return 'flat';
  const diff = ys[ys.length - 1].y - ys[0].y;
  if (diff === 0) return 'flat';
  return diff > 0 !== lowerIsBetter ? 'up' : 'down';
};

/** The band's y range: the author's bounds where set, else the data's min and max. */
const bandRange = (points: SparkPoint[], bandMin: unknown, bandMax: unknown): { y1: number; y2: number } | null => {
  const ys = finite(points).map((p) => p.y);
  const lo = num(bandMin) ?? (ys.length ? Math.min(...ys) : null);
  const hi = num(bandMax) ?? (ys.length ? Math.max(...ys) : null);
  if (lo === null || hi === null) return null;
  return lo <= hi ? { y1: lo, y2: hi } : { y1: hi, y2: lo };
};

type ControlSdk = { useControlState?: () => { disabled: boolean; loading: boolean } };

// Tiny trend for KPI cards, no axes or grid.
export const Sparkline = () => {
  const [data] = ToolJet.useStateArray({
    name: 'data',
    label: 'Data',
    description: 'Numbers, or { x, y } objects.',
    initialValue: [12, 18, 15, 22, 19, 26, 24, 31],
  });
  const [type] = ToolJet.useStateEnumeration({
    name: 'type',
    label: 'Type',
    enumDefinition: ['line', 'area', 'bar'],
    initialValue: 'area',
    inspector: 'switch',
  });
  const [curve] = ToolJet.useStateEnumeration({
    name: 'curve',
    label: 'Curve',
    enumDefinition: ['monotone', 'linear', 'step'],
    initialValue: 'monotone',
    inspector: 'switch',
  });
  const [strokeWidth] = ToolJet.useStateNumber({ name: 'strokeWidth', label: 'Line width (px)', initialValue: 2 });
  const [showEndDot] = ToolJet.useStateBoolean({ name: 'showEndDot', label: 'End dot', initialValue: true });
  const [colorByTrend] = ToolJet.useStateBoolean({
    name: 'colorByTrend',
    label: 'Color by trend',
    initialValue: false,
  });
  const [lowerIsBetter] = ToolJet.useStateBoolean({
    name: 'lowerIsBetter',
    label: 'Lower is better',
    initialValue: false,
  });
  const [showBand] = ToolJet.useStateBoolean({ name: 'showBand', label: 'Min/max band', initialValue: false });
  const [bandMin] = ToolJet.useStateString({
    name: 'bandMin',
    label: 'Band from (blank = data min)',
    initialValue: '',
  });
  const [bandMax] = ToolJet.useStateString({ name: 'bandMax', label: 'Band to (blank = data max)', initialValue: '' });
  const [showTooltip] = ToolJet.useStateBoolean({ name: 'showTooltip', label: 'Tooltip', initialValue: false });
  const [valuePrefix] = ToolJet.useStateString({ name: 'valuePrefix', label: 'Value prefix', initialValue: '' });
  const [valueSuffix] = ToolJet.useStateString({ name: 'valueSuffix', label: 'Value suffix', initialValue: '' });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty message', initialValue: 'No data' });
  const [animate] = ToolJet.useStateBoolean({ name: 'animate', label: 'Animate', initialValue: true });
  const [, setTrend] = ToolJet.useStateString({ name: 'trend', initialValue: 'flat', inspector: 'hidden' });
  const [, setLastValue] = ToolJet.useStateNumber({
    name: 'lastValue',
    initialValue: null as unknown as number,
    inspector: 'hidden',
  });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const onDoubleClick = ToolJet.useEventCallback({ name: 'onDoubleClick' });
  const control = (ToolJet as unknown as ControlSdk).useControlState?.() ?? { disabled: false, loading: false };
  const chartColor = useThemeColor('chartColor', 'Line color', TOKEN.brand);
  const positiveColor = useThemeColor('positiveColor', 'Color when trend is up', TOKEN.success);
  const negativeColor = useThemeColor('negativeColor', 'Color when trend is down', TOKEN.error);
  const bandColor = useThemeColor('bandColor', 'Band color', TOKEN.muted);
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ role: 'sparkline', fit: false, loading: 'own', defaultWidth: 8, defaultHeight: 4 });
  const fillId = useSvgId('ui2-spark');

  const { points, last, trend } = useMemo(() => {
    const parsed = sparkPoints(data);
    const ys = finite(parsed);
    return {
      points: parsed,
      last: ys.length ? ys[ys.length - 1] : null,
      trend: trendOf(parsed, lowerIsBetter === true),
    };
  }, [data, lowerIsBetter]);
  useEffect(() => {
    setTrend(trend);
    setLastValue((last ? last.y : null) as unknown as number);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trend, last?.y]);

  const line = isSet(chartColor) ? chartColor : 'var(--sc-chart-1, var(--ui-primary))';
  const color =
    colorByTrend === true && trend !== 'flat'
      ? trend === 'up'
        ? isSet(positiveColor)
          ? positiveColor
          : 'var(--sc-success, var(--ui-success))'
        : isSet(negativeColor)
          ? negativeColor
          : 'var(--sc-destructive, var(--ui-destructive))'
      : line;
  const band = showBand === true ? bandRange(points, bandMin, bandMax) : null;
  const width = clamp(strokeWidth, 0.5, 6, 2);
  const endDot = showEndDot !== false && last;
  const dotRadius = Math.max(2.5, width + 1);
  const pad = endDot ? dotRadius + 1.5 : width;
  const format = formatter({ prefix: valuePrefix, suffix: valueSuffix });
  const inactive = control.disabled || control.loading;
  const dot = endDot
    ? (d: { index: number; cx?: number; cy?: number }) =>
        d.index === endDot.i && Number.isFinite(d.cx) && Number.isFinite(d.cy) ? (
          <circle key="end" cx={d.cx} cy={d.cy} r={dotRadius} fill={color} stroke="var(--ui-bg)" strokeWidth={1.5} />
        ) : (
          <g key={`dot-${d.index}`} />
        )
    : false;
  const margin = { top: pad, bottom: pad, left: Math.max(1, width / 2), right: pad };
  const shared = [
    <XAxis key="x" dataKey="i" hide />,
    <YAxis key="y" hide domain={type === 'bar' ? [0, 'dataMax'] : ['dataMin', 'dataMax']} />,
    band ? (
      <ReferenceArea
        key="band"
        y1={band.y1}
        y2={band.y2}
        fill={isSet(bandColor) ? bandColor : 'var(--ui-muted)'}
        fillOpacity={1}
        stroke="none"
        ifOverflow="extendDomain"
      />
    ) : null,
    showTooltip === true ? (
      <Tooltip
        key="tip"
        cursor={type === 'bar' ? { fill: 'var(--ui-muted)' } : { stroke: 'var(--ui-border)' }}
        allowEscapeViewBox={{ x: true, y: true }}
        wrapperStyle={{ zIndex: 10 }}
        content={({ active, payload }: { active?: boolean; payload?: { payload?: SparkPoint }[] }) => {
          const point = active ? payload?.[0]?.payload : null;
          return point ? <InlineTip name={String(point.x)} value={format(point.y)} /> : null;
        }}
      />
    ) : null,
  ];
  const isAnimationActive = animated(animate, points.length);

  return (
    <LoadingFrame loading={ld.loading} look={blockLook(ld.skeleton)}>
      <ChartFrame
        empty={!last}
        small
        emptyText={emptyText}
        label={`Sparkline, trend ${trend}`}
        resetKey={data}
        className="ui2-sparkline"
        onClick={() => (inactive ? undefined : onClick())}
        onDoubleClick={() => (inactive ? undefined : onDoubleClick())}
      >
        {type === 'bar' ? (
          <BarChart data={points} margin={margin}>
            {shared}
            <Bar dataKey="y" fill={color} radius={[2, 2, 0, 0]} isAnimationActive={isAnimationActive} />
          </BarChart>
        ) : type === 'line' ? (
          <LineChart data={points} margin={margin}>
            {shared}
            <Line
              dataKey="y"
              type={curveOf(curve)}
              stroke={color}
              strokeWidth={width}
              dot={dot}
              activeDot={showTooltip === true ? { r: dotRadius, strokeWidth: 0, fill: color } : false}
              connectNulls
              isAnimationActive={isAnimationActive}
            />
          </LineChart>
        ) : (
          <AreaChart data={points} margin={margin}>
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            {shared}
            <Area
              dataKey="y"
              type={curveOf(curve)}
              stroke={color}
              strokeWidth={width}
              fill={`url(#${fillId})`}
              dot={dot}
              activeDot={showTooltip === true ? { r: dotRadius, strokeWidth: 0, fill: color } : false}
              connectNulls
              isAnimationActive={isAnimationActive}
            />
          </AreaChart>
        )}
      </ChartFrame>
    </LoadingFrame>
  );
};
