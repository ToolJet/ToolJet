import React from 'react';
import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, Tooltip } from 'recharts';
import { list, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { seriesColor } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import {
  clamp,
  fieldList,
  formatter,
  hasValues,
  isSet,
  num,
  seriesRows,
  resolveChartFields,
  seriesLabel,
  seriesLabelMap,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import {
  AXIS_FILL,
  ChartTooltip,
  GRID,
  LegendContent,
  SafeFrame,
  animated,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartParts';

export const ShadRadarChart = (props) => {
  const p = props.properties;
  const { x: category, series } = resolveChartFields(
    list(p.data),
    isSet(p.categoryField) ? String(p.categoryField) : undefined,
    fieldList(p.yFields)
  );
  const rows = seriesRows(p.data, category, series);
  // A missing score sits at the centre rather than breaking the polygon.
  const plotted = rows.map((r) => ({ ...r, ...Object.fromEntries(series.map((s) => [s, r[s] ?? 0])) }));
  const max = num(p.maxValue);
  const opacity = clamp(p.fillOpacity, 0, 1, 0.5);
  const full = formatter({ prefix: p.valuePrefix, suffix: p.valueSuffix });
  const color = (i) => seriesColor(p.colors, i);
  return (
    <SafeFrame props={props} empty={!series.length || !hasValues(rows, series)}>
      {(onDatum) => (
        <RadarChart
          data={plotted}
          outerRadius="72%"
          margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
          onClick={(e) => onDatum(e?.activePayload?.[0]?.payload)}
        >
          {p.showGrid !== false ? (
            <PolarGrid gridType={p.gridShape === 'circle' ? 'circle' : 'polygon'} stroke={GRID} />
          ) : null}
          <PolarAngleAxis dataKey={category} tick={{ fill: AXIS_FILL, fontSize: 12 }} />
          <PolarRadiusAxis
            domain={[0, max !== null && max > 0 ? max : 'auto']}
            tick={false}
            axisLine={false}
            allowDataOverflow={false}
          />
          <Tooltip cursor={false} content={<ChartTooltip format={full} />} />
          {p.showLegend !== false ? <Legend content={<LegendContent />} /> : null}
          {series.map((s, i) => (
            <Radar
              key={s}
              dataKey={s}
              name={seriesLabel(s, seriesLabelMap(p.seriesLabels, series))}
              stroke={color(i)}
              strokeWidth={2}
              fill={color(i)}
              fillOpacity={opacity}
              dot={p.showDots === true ? { r: 3, fillOpacity: 1, fill: color(i) } : false}
              isAnimationActive={animated(p)}
            />
          ))}
        </RadarChart>
      )}
    </SafeFrame>
  );
};

export default withControlState(ShadRadarChart);
