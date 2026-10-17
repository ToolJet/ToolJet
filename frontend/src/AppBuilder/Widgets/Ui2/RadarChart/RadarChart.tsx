import React, { useMemo } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from 'recharts';
import { tooltipAndLegend, useSeriesInputs } from '@/AppBuilder/Widgets/Ui2/_charts/cartesianParts';
import { withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { seriesColor } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import {
  fieldList,
  hasValues,
  seriesRows,
  resolveChartFields,
  seriesLabel,
  drawnLabelMap,
  seriesSlots,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import { AXIS_FILL, GRID, SafeFrame, animated } from '@/AppBuilder/Widgets/Ui2/_charts/chartParts';
import { clamp, isSet, list, num } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { formatter } from '@/AppBuilder/Widgets/Ui2/_shared/format';

// A radar past this many axes is unreadable, and every axis is a spoke, a grid vertex and a label: 2,000 rows (MAX_ROWS)
// drew over 10,000 nodes.
export const MAX_AXES = 100;

export const ShadRadarChart = (props: WidgetProps) => {
  const p = props.properties;
  const { bound, yFields, seriesLabels, colors } = useSeriesInputs(p);
  // Rows, series and colours are worked out again only when what they read changes, not on every render.
  const { category, series, plotted, empty, names, fills } = useMemo(() => {
    const fields = resolveChartFields(
      list(bound),
      isSet(p.categoryField) ? String(p.categoryField) : undefined,
      fieldList(yFields)
    );
    const rows = seriesRows(bound, fields.x, fields.series).slice(0, MAX_AXES);
    const labels = drawnLabelMap(seriesLabels, fieldList(yFields), fields.series);
    const slots = seriesSlots(fieldList(yFields), fields.series);
    return {
      category: fields.x,
      series: fields.series,
      // A missing score sits at the centre rather than breaking the polygon.
      plotted: rows.map((r) => ({ ...r, ...Object.fromEntries(fields.series.map((s) => [s, r[s] ?? 0])) })),
      empty: !fields.series.length || !hasValues(rows, fields.series),
      names: fields.series.map((s) => seriesLabel(s, labels)),
      fills: fields.series.map((_, i) => seriesColor(colors, slots[i])),
    };
  }, [bound, p.categoryField, yFields, seriesLabels, colors]);
  const max = num(p.maxValue);
  const opacity = clamp(p.fillOpacity, 0, 1, 0.5);
  const full = formatter({ prefix: p.valuePrefix, suffix: p.valueSuffix });
  return (
    <SafeFrame props={props} empty={empty}>
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
          {tooltipAndLegend(full, false, p.showLegend !== false)}
          {series.map((s, i) => (
            <Radar
              key={s}
              dataKey={s}
              name={names[i]}
              stroke={fills[i]}
              strokeWidth={2}
              fill={fills[i]}
              fillOpacity={opacity}
              dot={p.showDots === true ? { r: 3, fillOpacity: 1, fill: fills[i] } : false}
              isAnimationActive={animated(p, plotted.length)}
            />
          ))}
        </RadarChart>
      )}
    </SafeFrame>
  );
};

export default withControlState(ShadRadarChart);
