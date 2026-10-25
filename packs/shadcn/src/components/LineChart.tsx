import React, { useMemo } from 'react';
import { CartesianGrid, Line, LineChart as RLineChart, ReferenceLine, XAxis } from 'recharts';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AXIS, CURSOR_LINE, ChartFrame, GRID, REF, clickedMarks, seriesColor, tooltipAndLegend, useBoxSize, useChartClick, valueAxis } from '../lib/ui2/charts/chartParts';
import {
  animated,
  clamp,
  curveOf,
  dateTicks,
  drawnLabelMap,
  fieldList,
  fieldNote,
  formatter,
  hasValues,
  hiddenNote,
  isCompactChart,
  isRecord,
  isSet,
  list,
  num,
  percentScale,
  resolveChartFields,
  scaled,
  seriesLabel,
  seriesRows,
  seriesSlots,
  wholeNumbers,
  wholeTicks,
} from '../lib/ui2/charts/chartModel';
import { LoadingFrame, blockLook, useLoadingLook } from '../lib/ui2/loading/look';
import { TOKEN, useThemeColor } from '../lib/styleDefaults';

const SAMPLE = [
  { month: 'Jan', revenue: 18600, expenses: 8000 },
  { month: 'Feb', revenue: 30500, expenses: 20000 },
  { month: 'Mar', revenue: 23700, expenses: 12000 },
  { month: 'Apr', revenue: 7300, expenses: 19000 },
  { month: 'May', revenue: 20900, expenses: 13000 },
  { month: 'Jun', revenue: 21400, expenses: 14000 },
];

export const LineChart = () => {
  const [data] = ToolJet.useStateArray({ name: 'data', label: 'Data', initialValue: SAMPLE });
  const [xField] = ToolJet.useStateString({ name: 'xField', label: 'X field', initialValue: 'month' });
  const [yFields] = ToolJet.useStateString({ name: 'yFields', label: 'Series fields (one or many)', description: 'A field, a list, or comma-separated.', initialValue: 'revenue, expenses' });
  const [curve] = ToolJet.useStateEnumeration({ name: 'curve', label: 'Curve', enumDefinition: ['monotone', 'linear', 'step'], initialValue: 'monotone', inspector: 'switch' });
  const [showDots] = ToolJet.useStateBoolean({ name: 'showDots', label: 'Dots', initialValue: false });
  const [strokeWidth] = ToolJet.useStateNumber({ name: 'strokeWidth', label: 'Line width (px)', initialValue: 2 });
  const [dashedFields] = ToolJet.useStateString({ name: 'dashedFields', label: 'Dashed series (fields)', initialValue: '' });
  const [referenceValue] = ToolJet.useStateString({ name: 'referenceValue', label: 'Target line value', initialValue: '' });
  const [referenceLabel] = ToolJet.useStateString({ name: 'referenceLabel', label: 'Target line label', initialValue: '' });
  const [yAxisFormat] = ToolJet.useStateEnumeration({ name: 'yAxisFormat', label: 'Value format', enumDefinition: ['number', 'currency', 'percent', 'compact'], initialValue: 'number', inspector: 'switch' });
  const [currency] = ToolJet.useStateString({ name: 'currency', label: 'Currency code', initialValue: 'USD' });
  const [valuePrefix] = ToolJet.useStateString({ name: 'valuePrefix', label: 'Value prefix', initialValue: '' });
  const [valueSuffix] = ToolJet.useStateString({ name: 'valueSuffix', label: 'Value suffix', initialValue: '' });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty message', initialValue: 'No data' });
  const [animate] = ToolJet.useStateBoolean({ name: 'animate', label: 'Animate', initialValue: true });
  const [showGrid] = ToolJet.useStateBoolean({ name: 'showGrid', label: 'Grid', initialValue: true });
  const [showLegend] = ToolJet.useStateBoolean({ name: 'showLegend', label: 'Legend', initialValue: true });
  const [seriesLabels] = ToolJet.useStateObject({ name: 'seriesLabels', label: 'Series labels ({ field: label })', initialValue: {} });
  const [colors] = ToolJet.useStateArray({ name: 'colors', label: 'Series colors (in order)', initialValue: [] });
  const [highlightClicked] = ToolJet.useStateBoolean({ name: 'highlightClicked', label: 'Highlight clicked point', description: 'Draws the clicked point emphasised until Clear clicked point runs or another is clicked.', initialValue: false });
  const click = useChartClick(highlightClicked);
  const chartColor = useThemeColor('chartColor', 'Chart color (series palette from it)', TOKEN.brand);
  const gridColor = useThemeColor('gridColor', 'Grid line color', TOKEN.border);
  const axisTextColor = useThemeColor('axisTextColor', 'Axis label color', TOKEN.mutedText);
  const legendTextColor = useThemeColor('legendTextColor', 'Legend text color', TOKEN.mutedText);
  const referenceLineColor = useThemeColor('referenceLineColor', 'Target line color', TOKEN.mutedText);
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 28 });
  const box = useBoxSize();

  const target = num(referenceValue);
  const m = useMemo(() => {
    const configured = fieldList(yFields);
    const fields = resolveChartFields(list(data), isSet(xField) ? String(xField) : undefined, configured);
    const plotted = seriesRows(data, fields.x, fields.series);
    const values = plotted.flatMap((r) => fields.series.map((s) => r[s]));
    const format = { format: yAxisFormat, currency, prefix: valuePrefix, suffix: valueSuffix };
    const lineScale = percentScale(yAxisFormat, values);
    const short = scaled(formatter(format, true), lineScale);
    const extremes = values.filter((v): v is number => typeof v === 'number');
    if (target !== null) extremes.push(target);
    const longest = extremes.length ? Math.max(String(short(Math.max(...extremes))).length, String(short(Math.min(...extremes))).length) : 3;
    const labels = drawnLabelMap(seriesLabels, configured, fields.series);
    const slots = seriesSlots(configured, fields.series);
    return {
      rows: plotted,
      x: fields.x,
      series: fields.series,
      empty: !fields.series.length || !hasValues(plotted, fields.series),
      notes: [fieldNote(fields), hiddenNote(list(data).filter(isRecord).length - plotted.length, 'row')],
      dashed: fieldList(dashedFields),
      names: fields.series.map((s) => seriesLabel(s, labels)),
      fills: fields.series.map((_, i) => seriesColor(colors, chartColor, slots[i])),
      tick: short,
      full: scaled(formatter(format, false), lineScale),
      yWidth: Math.min(88, Math.max(32, longest * 7 + 10)),
      allowDecimals: !wholeNumbers(plotted, fields.series),
      ticks: wholeTicks(target !== null && fields.series.length ? [...plotted, { [fields.series[0]]: target }] : plotted, fields.series),
      xTicks: dateTicks(plotted, fields.x),
    };
  }, [data, xField, yFields, dashedFields, seriesLabels, colors, chartColor, yAxisFormat, currency, valuePrefix, valueSuffix, target]);
  const compact = box.height > 0 && isCompactChart(box.height);
  const targetLabel = isSet(referenceLabel) ? String(referenceLabel) : '';
  const width = clamp(strokeWidth, 0.5, 12, 2);

  return (
    <LoadingFrame loading={ld.loading} look={blockLook(ld.skeleton)}>
      <ChartFrame
        boxRef={box.ref}
        empty={m.empty}
        emptyText={emptyText}
        label="Line chart"
        resetKey={[data, xField, yFields]}
        looks={{ '--lk-grid': gridColor, '--lk-axis': axisTextColor, '--lk-legend': legendTextColor, '--lk-ref': referenceLineColor }}
        notes={m.notes}
        onDoubleClick={click.doubleClick}
      >
        <RLineChart
          data={m.rows}
          margin={{ left: 4, right: 12, top: target !== null && targetLabel ? 20 : 8 }}
          onClick={(e: { activePayload?: { payload?: unknown }[] } | null) => click.pick(e?.activePayload?.[0]?.payload)}
        >
          {showGrid !== false && !compact ? <CartesianGrid vertical={false} stroke={GRID} /> : null}
          <XAxis dataKey={m.x} {...AXIS} hide={compact} minTickGap={24} tickFormatter={m.xTicks} />
          {valueAxis(m, compact)}
          {tooltipAndLegend(m.full, CURSOR_LINE, showLegend !== false && m.series.length > 1 && !compact)}
          {target !== null ? (
            <ReferenceLine
              y={target}
              stroke={REF}
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
              label={targetLabel ? { value: targetLabel, position: 'insideTopRight', fill: REF, fontSize: 12, offset: 6 } : undefined}
            />
          ) : null}
          {m.series.map((s, i) => (
            <Line
              key={s}
              dataKey={s}
              name={m.names[i]}
              type={curveOf(curve)}
              stroke={m.fills[i]}
              strokeWidth={width}
              strokeDasharray={m.dashed.includes(s) ? '6 4' : undefined}
              dot={showDots === true ? { r: 3, fill: m.fills[i], strokeWidth: 0 } : false}
              activeDot={{ r: 5, strokeWidth: 0 }}
              isAnimationActive={animated(animate, m.rows.length)}
            />
          ))}
          {clickedMarks(click.highlighted, m.x, m.series, m.fills)}
        </RLineChart>
      </ChartFrame>
    </LoadingFrame>
  );
};
