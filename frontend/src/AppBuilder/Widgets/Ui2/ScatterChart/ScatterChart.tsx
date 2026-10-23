import React, { useMemo } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import {
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { emphasis } from '@/AppBuilder/Widgets/Ui2/_charts/highlight';
import { seriesColor } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { seriesLabel } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import { scatterGroups, type ScatterPoint } from './scatterModel';
import type { Resolved } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import {
  AXIS,
  AXIS_FILL,
  GRID,
  LegendContent,
  SafeFrame,
  animated,
  axisWidthFor,
  isCompactChart,
  withChartRecovery,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartParts';
import { useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { clamp, isSet, num } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { PLAIN_NUMBER, formatter } from '@/AppBuilder/Widgets/Ui2/_shared/format';

// ---- Scatter -------------------------------------------------------------------------------------------------------

interface ScatterTipProps {
  active?: boolean;
  payload?: Array<{ payload?: ScatterPoint }>;
  p: Resolved;
  fx: (v: unknown) => string;
  fy: (v: unknown) => string;
}

const ScatterTip = ({ active, payload, p, fx, fy }: ScatterTipProps) => {
  const point = active ? payload?.[0]?.payload : null;
  if (!point) return null;
  const label = (key: string, fallback: string) => (isSet(p[key]) ? String(p[key]) : fallback);
  return (
    <div className="tj-shadcn">
      <div className="tw-grid tw-min-w-[8rem] tw-gap-1 tw-rounded-ui2-lg tw-border tw-bg-ui2-background tw-px-2.5 tw-py-1.5 tw-text-xs tw-shadow-xl">
        {point.label ? <div className="tw-font-medium">{String(point.label)}</div> : null}
        {[
          [label('xLabel', seriesLabel(p.xField)), fx(point.x)],
          [label('yLabel', seriesLabel(p.yField)), fy(point.y)],
          ...(point.z !== null && isSet(p.sizeField)
            ? [[label('sizeLabel', seriesLabel(p.sizeField)), PLAIN_NUMBER.format(point.z)]]
            : []),
        ].map(([name, value]) => (
          <div key={name} className="tw-flex tw-items-center tw-gap-2">
            <span className="tw-flex-1 tw-text-ui2-muted-foreground">{name}</span>
            <span className="tw-font-mono tw-font-medium tw-tabular-nums">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ShadScatterChart = (props: WidgetProps) => {
  const p = props.properties;
  const bound = useStable(p.data);
  const colors = useStable(p.colors);
  // The groups, their colours, the formatters and the y axis width are worked out again only when what they read
  // changes, not on every render.
  const { groups, fills, fxTick, fyTick, fx, fy, yWidth } = useMemo(() => {
    const points = scatterGroups(bound, {
      xField: p.xField,
      yField: p.yField,
      sizeField: p.sizeField,
      groupField: p.groupField,
      nameField: p.nameField,
    });
    const xFormat = { format: p.xAxisFormat, currency: p.currency };
    const yFormat = { format: p.yAxisFormat, currency: p.currency, prefix: p.valuePrefix, suffix: p.valueSuffix };
    const yTick = formatter(yFormat, true);
    return {
      groups: points,
      fills: points.map((_, i) => seriesColor(colors, i)),
      fxTick: formatter(xFormat, true),
      fyTick: yTick,
      fx: formatter(xFormat, false),
      fy: formatter(yFormat, false),
      yWidth: axisWidthFor(
        points.flatMap((g) => g.points.map((pt) => pt.y)),
        yTick
      ),
    };
  }, [
    bound,
    colors,
    p.xField,
    p.yField,
    p.sizeField,
    p.groupField,
    p.nameField,
    p.xAxisFormat,
    p.yAxisFormat,
    p.currency,
    p.valuePrefix,
    p.valueSuffix,
  ]);
  const compact = isCompactChart(props.height);
  const bubbles = isSet(p.sizeField);
  const size = clamp(p.pointSize, 2, 40, 6);
  const opacity = clamp(p.fillOpacity, 0.1, 1, bubbles ? 0.6 : 0.85);
  const refX = num(p.referenceX);
  const refY = num(p.referenceY);
  const refColor = 'var(--lk-ref, var(--sc-muted-foreground))';
  const axisTitle = (text: unknown, axis: 'x' | 'y') =>
    isSet(text) && !compact
      ? {
          value: String(text),
          position: axis === 'x' ? ('insideBottom' as const) : ('insideLeft' as const),
          angle: axis === 'x' ? 0 : -90,
          offset: axis === 'x' ? 0 : 10,
          style: { fill: AXIS_FILL, fontSize: 12, textAnchor: 'middle' as const },
        }
      : undefined;
  return (
    <SafeFrame props={props} empty={!groups.length}>
      {(onDatum, highlighted) => (
        <ScatterChart margin={{ left: 4, right: 16, top: 12, bottom: 0 }}>
          {p.showGrid !== false && !compact ? <CartesianGrid stroke={GRID} /> : null}
          <XAxis
            type="number"
            dataKey="x"
            name={String(p.xLabel || p.xField || 'x')}
            {...AXIS}
            hide={compact}
            domain={['auto', 'auto']}
            tickFormatter={fxTick}
            // A titled axis is taller, so the title sits under the tick labels (inside the 30px axis it crossed the
            // middle tick).
            height={isSet(p.xLabel) && !compact ? 46 : 30}
            label={axisTitle(p.xLabel, 'x')}
          />
          <YAxis
            type="number"
            dataKey="y"
            {...AXIS}
            hide={compact}
            domain={['auto', 'auto']}
            width={yWidth + (isSet(p.yLabel) ? 18 : 0)}
            tickFormatter={fyTick}
            label={axisTitle(p.yLabel, 'y')}
          />
          {bubbles ? (
            <ZAxis type="number" dataKey="z" range={[size * 8, size * 120]} />
          ) : (
            <ZAxis range={[size * size * 3, size * size * 3]} />
          )}
          <Tooltip
            cursor={{ strokeDasharray: '3 3', stroke: 'var(--sc-border)' }}
            content={<ScatterTip p={p} fx={fx} fy={fy} />}
          />
          {p.showLegend !== false && groups.length > 1 && !compact ? <Legend content={<LegendContent />} /> : null}
          {refX !== null ? (
            <ReferenceLine x={refX} stroke={refColor} strokeDasharray="4 4" ifOverflow="extendDomain" />
          ) : null}
          {refY !== null ? (
            <ReferenceLine y={refY} stroke={refColor} strokeDasharray="4 4" ifOverflow="extendDomain" />
          ) : null}
          {groups.map((g, i) => (
            <Scatter
              key={g.name || 'points'}
              name={String(g.name || seriesLabel(p.yField))}
              data={g.points}
              fill={fills[i]}
              fillOpacity={opacity}
              stroke={bubbles ? fills[i] : 'none'}
              isAnimationActive={animated(
                p,
                groups.reduce((n, group) => n + group.points.length, 0)
              )}
              onClick={(pt) => onDatum(pt?.payload?.row ?? pt?.row)}
            >
              {/* Highlight clicked point: the clicked point keeps its colour and the others fade. */}
              {highlighted
                ? g.points.map((pt, d) => (
                    <Cell key={d} fill={fills[i]} fillOpacity={opacity * emphasis(pt.row, highlighted)} />
                  ))
                : null}
            </Scatter>
          ))}
        </ScatterChart>
      )}
    </SafeFrame>
  );
};

export default withControlState(withChartRecovery(ShadScatterChart));
