import React from 'react';
import { CartesianGrid, Legend, ReferenceLine, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import { seriesColor } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { clamp, formatter, isSet, num, seriesLabel } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import { scatterGroups } from './scatterModel';
import {
  AXIS,
  AXIS_FILL,
  GRID,
  LegendContent,
  SafeFrame,
  animated,
  axisWidthFor,
  full,
  isCompactChart,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartParts';
import { withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';

// ---- Scatter -------------------------------------------------------------------------------------------------------

const ScatterTip = ({ active, payload, p, fx, fy }) => {
  const point = active ? payload?.[0]?.payload : null;
  if (!point) return null;
  const label = (key, fallback) => (isSet(p[key]) ? String(p[key]) : fallback);
  return (
    <div className="tj-shadcn">
      <div className="grid min-w-[8rem] gap-1 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
        {point.label ? <div className="font-medium">{String(point.label)}</div> : null}
        {[
          [label('xLabel', seriesLabel(p.xField)), fx(point.x)],
          [label('yLabel', seriesLabel(p.yField)), fy(point.y)],
          ...(point.z !== null && isSet(p.sizeField)
            ? [[label('sizeLabel', seriesLabel(p.sizeField)), full.format(point.z)]]
            : []),
        ].map(([name, value]) => (
          <div key={name} className="flex items-center gap-2">
            <span className="flex-1 text-muted-foreground">{name}</span>
            <span className="font-mono font-medium tabular-nums">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ShadScatterChart = (props) => {
  const p = props.properties;
  const groups = scatterGroups(p.data, {
    xField: p.xField,
    yField: p.yField,
    sizeField: p.sizeField,
    groupField: p.groupField,
    nameField: p.nameField,
  });
  const compact = isCompactChart(props.height);
  const fxTick = formatter({ format: p.xAxisFormat, currency: p.currency }, true);
  const fyTick = formatter(
    { format: p.yAxisFormat, currency: p.currency, prefix: p.valuePrefix, suffix: p.valueSuffix },
    true
  );
  const fx = formatter({ format: p.xAxisFormat, currency: p.currency }, false);
  const fy = formatter(
    { format: p.yAxisFormat, currency: p.currency, prefix: p.valuePrefix, suffix: p.valueSuffix },
    false
  );
  const ys = groups.flatMap((g) => g.points.map((pt) => pt.y));
  const bubbles = isSet(p.sizeField);
  const size = clamp(p.pointSize, 2, 40, 6);
  const opacity = clamp(p.fillOpacity, 0.1, 1, bubbles ? 0.6 : 0.85);
  const refX = num(p.referenceX);
  const refY = num(p.referenceY);
  const refColor = 'var(--lk-ref, var(--sc-muted-foreground))';
  const color = (i) => seriesColor(p.colors, i);
  const axisTitle = (text, axis) =>
    isSet(text) && !compact
      ? {
          value: String(text),
          position: axis === 'x' ? 'insideBottom' : 'insideLeft',
          angle: axis === 'x' ? 0 : -90,
          offset: axis === 'x' ? 0 : 10,
          style: { fill: AXIS_FILL, fontSize: 12, textAnchor: 'middle' },
        }
      : undefined;
  return (
    <SafeFrame props={props} empty={!groups.length}>
      {(onDatum) => (
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
            width={axisWidthFor(ys, fyTick) + (isSet(p.yLabel) ? 18 : 0)}
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
              name={g.name || seriesLabel(p.yField)}
              data={g.points}
              fill={color(i)}
              fillOpacity={opacity}
              stroke={bubbles ? color(i) : 'none'}
              isAnimationActive={animated(p)}
              onClick={(pt) => onDatum(pt?.payload?.row ?? pt?.row)}
            />
          ))}
        </ScatterChart>
      )}
    </SafeFrame>
  );
};

export default withControlState(ShadScatterChart);
