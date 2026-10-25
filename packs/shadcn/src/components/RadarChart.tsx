import React, { useMemo } from 'react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart as RRadarChart } from 'recharts';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AXIS_FILL, ChartFrame, GRID, seriesColor, tooltipAndLegend, useChartClick } from '../lib/ui2/charts/chartParts';
import {
  animated,
  clamp,
  drawnLabelMap,
  fieldList,
  fieldNote,
  formatter,
  hasValues,
  hiddenNote,
  isRecord,
  isSet,
  list,
  num,
  resolveChartFields,
  sameDatum,
  seriesLabel,
  seriesRows,
  seriesSlots,
} from '../lib/ui2/charts/chartModel';
import { LoadingFrame, blockLook, useLoadingLook } from '../lib/ui2/loading/look';
import { TOKEN, useThemeColor } from '../lib/styleDefaults';

// A radar past this many axes is unreadable: every axis is a spoke, a grid vertex and a label.
const MAX_AXES = 100;

export const RadarChart = () => {
  const [data] = ToolJet.useStateArray({
    name: 'data',
    label: 'Data',
    initialValue: [
      { skill: 'Speed', alex: 86, jordan: 65 },
      { skill: 'Quality', alex: 72, jordan: 90 },
      { skill: 'Support', alex: 64, jordan: 78 },
      { skill: 'Pricing', alex: 90, jordan: 58 },
      { skill: 'Reach', alex: 58, jordan: 84 },
      { skill: 'Design', alex: 75, jordan: 70 },
    ],
  });
  const [categoryField] = ToolJet.useStateString({ name: 'categoryField', label: 'Category field', initialValue: 'skill' });
  const [yFields] = ToolJet.useStateString({ name: 'yFields', label: 'Series fields (one or many)', description: 'A field, a list, or comma-separated.', initialValue: 'alex, jordan' });
  const [maxValue] = ToolJet.useStateString({ name: 'maxValue', label: 'Max value (blank = auto)', initialValue: '100' });
  const [fillOpacity] = ToolJet.useStateNumber({ name: 'fillOpacity', label: 'Fill opacity (0 to 1)', initialValue: 0.5 });
  const [gridShape] = ToolJet.useStateEnumeration({ name: 'gridShape', label: 'Grid shape', enumDefinition: ['polygon', 'circle'], initialValue: 'polygon', inspector: 'switch' });
  const [showGrid] = ToolJet.useStateBoolean({ name: 'showGrid', label: 'Grid', initialValue: true });
  const [showDots] = ToolJet.useStateBoolean({ name: 'showDots', label: 'Dots', initialValue: false });
  const [valuePrefix] = ToolJet.useStateString({ name: 'valuePrefix', label: 'Value prefix', initialValue: '' });
  const [valueSuffix] = ToolJet.useStateString({ name: 'valueSuffix', label: 'Value suffix', initialValue: '' });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty message', initialValue: 'No data' });
  const [animate] = ToolJet.useStateBoolean({ name: 'animate', label: 'Animate', initialValue: true });
  const [showLegend] = ToolJet.useStateBoolean({ name: 'showLegend', label: 'Legend', initialValue: true });
  const [seriesLabels] = ToolJet.useStateObject({ name: 'seriesLabels', label: 'Series labels ({ field: label })', initialValue: {} });
  const [colors] = ToolJet.useStateArray({ name: 'colors', label: 'Series colors (in order)', initialValue: [] });
  const [highlightClicked] = ToolJet.useStateBoolean({ name: 'highlightClicked', label: 'Highlight clicked point', description: 'Draws the clicked point emphasised until Clear clicked point runs or another is clicked.', initialValue: false });
  const click = useChartClick(highlightClicked);
  const chartColor = useThemeColor('chartColor', 'Chart color (series palette from it)', TOKEN.brand);
  const gridColor = useThemeColor('gridColor', 'Grid line color', TOKEN.border);
  const axisTextColor = useThemeColor('axisTextColor', 'Axis label color', TOKEN.mutedText);
  const legendTextColor = useThemeColor('legendTextColor', 'Legend text color', TOKEN.mutedText);
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 12, defaultHeight: 30 });

  const m = useMemo(() => {
    const configured = fieldList(yFields);
    const fields = resolveChartFields(list(data).filter(isRecord).slice(0, MAX_AXES), isSet(categoryField) ? String(categoryField) : undefined, configured);
    const rows = seriesRows(data, fields.x, fields.series).slice(0, MAX_AXES);
    const labels = drawnLabelMap(seriesLabels, configured, fields.series);
    const slots = seriesSlots(configured, fields.series);
    return {
      category: fields.x,
      series: fields.series,
      // A missing score sits at the centre rather than breaking the polygon.
      plotted: rows.map((r) => ({ ...r, ...Object.fromEntries(fields.series.map((s) => [s, r[s] ?? 0])) })),
      empty: !fields.series.length || !hasValues(rows, fields.series),
      notes: [fieldNote(fields), hiddenNote(list(data).filter(isRecord).length - rows.length, 'axis', 'axes')],
      names: fields.series.map((s) => seriesLabel(s, labels)),
      fills: fields.series.map((_, i) => seriesColor(colors, chartColor, slots[i])),
    };
  }, [data, categoryField, yFields, seriesLabels, colors, chartColor]);
  const max = num(maxValue);
  const opacity = clamp(fillOpacity, 0, 1, 0.5);
  const full = formatter({ prefix: valuePrefix, suffix: valueSuffix });
  const highlighted = click.highlighted;

  return (
    <LoadingFrame loading={ld.loading} look={blockLook(ld.skeleton)}>
      <ChartFrame
        empty={m.empty}
        emptyText={emptyText}
        label="Radar chart"
        resetKey={[data, categoryField, yFields]}
        looks={{ '--lk-grid': gridColor, '--lk-axis': axisTextColor, '--lk-legend': legendTextColor }}
        notes={m.notes}
        onDoubleClick={click.doubleClick}
      >
        <RRadarChart
          data={m.plotted}
          outerRadius="72%"
          margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
          onClick={(e: { activePayload?: { payload?: unknown }[] } | null) => click.pick(e?.activePayload?.[0]?.payload)}
        >
          {showGrid !== false ? <PolarGrid gridType={gridShape === 'circle' ? 'circle' : 'polygon'} stroke={GRID} /> : null}
          <PolarAngleAxis dataKey={m.category} tick={{ fill: AXIS_FILL, fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, max !== null && max > 0 ? max : 'auto']} tick={false} axisLine={false} allowDataOverflow={false} />
          {tooltipAndLegend(full, false, showLegend !== false)}
          {m.series.map((s, i) => (
            <Radar
              key={s}
              dataKey={s}
              name={m.names[i]}
              stroke={m.fills[i]}
              strokeWidth={2}
              fill={m.fills[i]}
              fillOpacity={opacity}
              dot={
                highlighted
                  ? // Highlight clicked point: the clicked category's point is ringed on each series.
                    (((d: { cx: number; cy: number; index: number; key?: string }) =>
                      sameDatum(m.plotted[d.index], highlighted) ? (
                        <circle key={d.key} cx={d.cx} cy={d.cy} r={6} fill={m.fills[i]} stroke="var(--ui-bg)" strokeWidth={2} />
                      ) : showDots === true ? (
                        <circle key={d.key} cx={d.cx} cy={d.cy} r={3} fill={m.fills[i]} />
                      ) : (
                        <g key={d.key} />
                      )) as never)
                  : showDots === true
                  ? { r: 3, fillOpacity: 1, fill: m.fills[i] }
                  : false
              }
              isAnimationActive={animated(animate, m.plotted.length)}
            />
          ))}
        </RRadarChart>
      </ChartFrame>
    </LoadingFrame>
  );
};
