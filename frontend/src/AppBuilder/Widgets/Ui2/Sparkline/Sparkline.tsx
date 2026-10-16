import React from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { Area, AreaChart, Line, LineChart, ReferenceArea, Tooltip, XAxis, YAxis, type AreaProps } from 'recharts';
import { clamp, curveOf, formatter } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import {
  bandRange,
  lastPoint,
  sparkPoints,
  trendOf,
  type SparkPoint,
} from '@/AppBuilder/Widgets/Ui2/_charts/sparkModel';
import { SafeFrame, animated } from '@/AppBuilder/Widgets/Ui2/_charts/chartParts';
import { withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';

interface SparkTipProps {
  active?: boolean;
  payload?: Array<{ payload?: SparkPoint }>;
  format: (v: unknown) => string;
}

export const SparkTip = ({ active, payload, format }: SparkTipProps) => {
  const point = active ? payload?.[0]?.payload : null;
  if (!point) return null;
  return (
    <div className="tj-shadcn">
      <div className="tw-flex tw-items-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-ui2-md tw-border tw-bg-ui2-background tw-px-2 tw-py-1 tw-text-xs tw-shadow-md">
        <span className="tw-text-ui2-muted-foreground">{String(point.x)}</span>
        <span className="tw-font-mono tw-font-medium tw-tabular-nums">{format(point.y)}</span>
      </div>
    </div>
  );
};

export const ShadSparkline = (props: WidgetProps) => {
  const p = props.properties;
  const points = sparkPoints(p.data);
  const last = lastPoint(points);
  const trend = trendOf(points, p.lowerIsBetter === true);
  const color =
    p.colorByTrend === true && trend !== 'flat'
      ? trend === 'up'
        ? 'var(--lk-up, var(--sc-success))'
        : 'var(--lk-down, var(--sc-destructive))'
      : 'var(--sc-chart-1)';
  const band = p.showBand === true ? bandRange(points, p.bandMin, p.bandMax) : null;
  const strokeWidth = clamp(p.strokeWidth, 0.5, 6, 2);
  const endDot = p.showEndDot !== false && last;
  const dotRadius = Math.max(2.5, strokeWidth + 1);
  const pad = endDot ? dotRadius + 1.5 : strokeWidth;
  const format = formatter({ prefix: p.valuePrefix, suffix: p.valueSuffix });
  const Chart = p.type === 'line' ? LineChart : AreaChart;
  // Line takes the same props here as Area; one type lets either render as <Series>.
  const Series = (p.type === 'line' ? Line : Area) as React.ComponentType<AreaProps>;
  const dot = endDot
    ? (d: { index: number; cx?: number; cy?: number }) =>
        d.index === endDot.i && Number.isFinite(d.cx) && Number.isFinite(d.cy) ? (
          <circle
            key="end"
            cx={d.cx}
            cy={d.cy}
            r={dotRadius}
            fill={color}
            stroke="var(--sc-background)"
            strokeWidth={1.5}
          />
        ) : (
          <g key={`dot-${d.index}`} />
        )
    : false;
  return (
    <SafeFrame props={props} small clickable={false} empty={!last} exposed={{ trend, lastValue: last ? last.y : null }}>
      {() => (
        <Chart data={points} margin={{ top: pad, bottom: pad, left: Math.max(1, strokeWidth / 2), right: pad }}>
          <defs>
            <linearGradient id={`sc-spark-${props.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="i" hide />
          <YAxis hide domain={['dataMin', 'dataMax']} />
          {band ? (
            <ReferenceArea
              y1={band.y1}
              y2={band.y2}
              fill="var(--lk-band, var(--sc-muted))"
              fillOpacity={1}
              stroke="none"
              ifOverflow="extendDomain"
            />
          ) : null}
          {p.showTooltip === true ? (
            <Tooltip
              cursor={{ stroke: 'var(--sc-border)' }}
              allowEscapeViewBox={{ x: true, y: true }}
              wrapperStyle={{ zIndex: 10 }}
              content={<SparkTip format={format} />}
            />
          ) : null}
          <Series
            dataKey="y"
            type={curveOf(p.curve)}
            stroke={color}
            strokeWidth={strokeWidth}
            fill={p.type === 'line' ? 'none' : `url(#sc-spark-${props.id})`}
            dot={dot}
            activeDot={p.showTooltip === true ? { r: dotRadius, strokeWidth: 0, fill: color } : false}
            connectNulls
            isAnimationActive={animated(p)}
          />
        </Chart>
      )}
    </SafeFrame>
  );
};

export default withControlState(ShadSparkline);
