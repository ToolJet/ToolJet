import React, { useMemo } from 'react';
import { Area, AreaChart as RAreaChart, CartesianGrid, Line, LineChart as RLineChart, XAxis } from 'recharts';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AXIS, CURSOR_LINE, ChartFrame, GRID, clickedMarks, seriesSetup, tooltipAndLegend, useBoxSize, useChartClick, useSvgId, valueAxis } from '../lib/ui2/charts/chartParts';
import { MAX_ROWS, animated, curveOf, dateTicks, hiddenNote, isCompactChart, list } from '../lib/ui2/charts/chartModel';
import { LoadingFrame, blockLook, useLoadingLook } from '../lib/ui2/loading/look';

const SAMPLE = [
  { month: 'Jun', revenue: 182000 },
  { month: 'Jul', revenue: 246000 },
  { month: 'Aug', revenue: 268000 },
  { month: 'Sep', revenue: 197000 },
  { month: 'Oct', revenue: 121000 },
];

export const AreaChart = () => {
  const [data] = ToolJet.useStateArray({ name: 'data', label: 'Data', initialValue: SAMPLE });
  const [xField] = ToolJet.useStateString({ name: 'xField', label: 'X field', initialValue: 'month' });
  const [yFields] = ToolJet.useStateString({ name: 'yFields', label: 'Series fields (one or many)', description: 'A field, a list, or comma-separated.', initialValue: 'revenue' });
  const [valuePrefix] = ToolJet.useStateString({ name: 'valuePrefix', label: 'Value prefix', initialValue: '' });
  const [valueSuffix] = ToolJet.useStateString({ name: 'valueSuffix', label: 'Value suffix', initialValue: '' });
  const [showLegend] = ToolJet.useStateBoolean({ name: 'showLegend', label: 'Legend', initialValue: false });
  const [seriesLabels] = ToolJet.useStateObject({ name: 'seriesLabels', label: 'Series labels ({ field: label })', initialValue: {} });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty message', initialValue: 'No data' });
  const [colors] = ToolJet.useStateArray({ name: 'colors', label: 'Series colors (in order)', initialValue: [] });
  const [lineOnly] = ToolJet.useStateBoolean({ name: 'lineOnly', label: 'Line only (no fill)', initialValue: false });
  const [stack] = ToolJet.useStateBoolean({ name: 'stack', label: 'Stack series', initialValue: false });
  const [curve] = ToolJet.useStateEnumeration({ name: 'curve', label: 'Curve', enumDefinition: ['monotone', 'natural', 'linear', 'step'], initialValue: 'monotone', inspector: 'switch' });
  const [highlightClicked] = ToolJet.useStateBoolean({ name: 'highlightClicked', label: 'Highlight clicked point', description: 'Draws the clicked point emphasised until Clear clicked point runs or another is clicked.', initialValue: false });
  const click = useChartClick(highlightClicked);
  const chartColor = ToolJet.useStyleString({ name: 'chartColor', label: 'Chart color (series palette from it)', inspector: 'color', initialValue: '' });
  const gridColor = ToolJet.useStyleString({ name: 'gridColor', label: 'Grid line color', inspector: 'color', initialValue: '' });
  const axisTextColor = ToolJet.useStyleString({ name: 'axisTextColor', label: 'Axis label color', inspector: 'color', initialValue: '' });
  const legendTextColor = ToolJet.useStyleString({ name: 'legendTextColor', label: 'Legend text color', inspector: 'color', initialValue: '' });
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 28 });
  const box = useBoxSize();
  const fillId = useSvgId('ui2-area');

  const stacked = stack === true && lineOnly !== true;
  const { rows, setup, xTicks } = useMemo(() => {
    const drawn = list(data).slice(0, MAX_ROWS);
    const fields = seriesSetup(drawn, { xField, yFields, seriesLabels, colors, chartColor, valuePrefix, valueSuffix, stacked });
    return { rows: drawn, setup: fields, xTicks: dateTicks(drawn, fields.xField) };
  }, [data, xField, yFields, seriesLabels, colors, chartColor, valuePrefix, valueSuffix, stacked]);
  const { xField: x, series, names, fills } = setup;
  const compact = box.height > 0 && isCompactChart(box.height);
  const Chart = lineOnly === true ? RLineChart : RAreaChart;

  return (
    <LoadingFrame loading={ld.loading} look={blockLook(ld.skeleton)}>
      <ChartFrame
        boxRef={box.ref}
        empty={!rows.length || !series.length}
        emptyText={emptyText}
        label="Area chart"
        resetKey={[data, xField, yFields]}
        looks={{ '--lk-grid': gridColor, '--lk-axis': axisTextColor, '--lk-legend': legendTextColor }}
        notes={[setup.fieldNote, hiddenNote(list(data).length - rows.length, 'row')]}
        onDoubleClick={click.doubleClick}
      >
        <Chart data={rows} margin={{ left: 4, right: 12, top: 12 }} onClick={(e: { activePayload?: { payload?: unknown }[] } | null) => click.pick(e?.activePayload?.[0]?.payload)}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s} id={`${fillId}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={fills[i]} stopOpacity={0.6} />
                <stop offset="95%" stopColor={fills[i]} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          {compact ? null : <CartesianGrid vertical={false} stroke={GRID} />}
          <XAxis dataKey={x} {...AXIS} hide={compact} minTickGap={24} tickFormatter={xTicks} />
          {valueAxis(setup, compact)}
          {tooltipAndLegend(setup.full, CURSOR_LINE, showLegend === true && series.length > 1 && !compact)}
          {series.map((s, i) =>
            lineOnly === true ? (
              <Line key={s} dataKey={s} name={names[i]} type={curveOf(curve)} stroke={fills[i]} strokeWidth={2} dot={false} isAnimationActive={animated(true, rows.length)} />
            ) : (
              <Area
                key={s}
                dataKey={s}
                name={names[i]}
                type={curveOf(curve)}
                stroke={fills[i]}
                strokeWidth={2}
                fill={`url(#${fillId}-${i})`}
                stackId={stack === true ? 'a' : undefined}
                isAnimationActive={animated(true, rows.length)}
              />
            )
          )}
          {clickedMarks(click.highlighted, x, series, fills, stacked)}
        </Chart>
      </ChartFrame>
    </LoadingFrame>
  );
};
