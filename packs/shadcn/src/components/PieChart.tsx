import React, { useMemo } from 'react';
import { Cell, Label, Legend, Pie, PieChart as RPieChart, Tooltip } from 'recharts';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { ChartFrame, ChartTooltip, LegendContent, seriesColor, useChartClick } from '../lib/ui2/charts/chartParts';
import { affixFormatter, animated, centreValueFit, emphasis, hiddenNote, isRecord, isSet, list, statusColors } from '../lib/ui2/charts/chartModel';
import { LoadingFrame, blockLook, useLoadingLook } from '../lib/ui2/loading/look';
import { TOKEN, useThemeColor } from '../lib/styleDefaults';

// A pie past this many slices is unreadable, and drawing thousands freezes the page.
const MAX_SLICES = 100;

export const PieChart = () => {
  const [data] = ToolJet.useStateArray({
    name: 'data',
    label: 'Data',
    initialValue: [
      { type: 'Charter', value: 62 },
      { type: 'Day trip', value: 24 },
      { type: 'Event', value: 14 },
    ],
  });
  const [categoryField] = ToolJet.useStateString({ name: 'categoryField', label: 'Category field', initialValue: 'type' });
  const [valueField] = ToolJet.useStateString({ name: 'valueField', label: 'Value field', initialValue: 'value' });
  const [donut] = ToolJet.useStateBoolean({ name: 'donut', label: 'Donut', initialValue: true });
  const [centerValue] = ToolJet.useStateString({ name: 'centerValue', label: 'Center figure', initialValue: '' });
  const [centerLabel] = ToolJet.useStateString({ name: 'centerLabel', label: 'Center caption', initialValue: '' });
  const [showLegend] = ToolJet.useStateBoolean({ name: 'showLegend', label: 'Legend', initialValue: true });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty message', initialValue: 'No data' });
  const [colors] = ToolJet.useStateArray({ name: 'colors', label: 'Series colors (in order)', initialValue: [] });
  const [valuePrefix] = ToolJet.useStateString({ name: 'valuePrefix', label: 'Value prefix', initialValue: '' });
  const [valueSuffix] = ToolJet.useStateString({ name: 'valueSuffix', label: 'Value suffix', initialValue: '' });
  const [highlightClicked] = ToolJet.useStateBoolean({ name: 'highlightClicked', label: 'Highlight clicked point', description: 'Draws the clicked slice emphasised until Clear clicked point runs or another is clicked.', initialValue: false });
  const click = useChartClick(highlightClicked);
  const chartColor = useThemeColor('chartColor', 'Chart color (series palette from it)', TOKEN.brand);
  const legendTextColor = useThemeColor('legendTextColor', 'Legend text color', TOKEN.mutedText);
  const sliceBorderColor = useThemeColor('sliceBorderColor', 'Slice border color', TOKEN.surface);
  const centerValueColor = useThemeColor('centerValueColor', 'Center figure color', TOKEN.text);
  const centerLabelColor = useThemeColor('centerLabelColor', 'Center caption color', TOKEN.mutedText);
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 12, defaultHeight: 28 });

  const slices = useMemo(() => {
    const drawn = list(data).filter(isRecord).slice(0, MAX_SLICES);
    const states = Array.isArray(colors) && colors.length ? null : statusColors(drawn.map((d) => d[categoryField]));
    return drawn.map((d, i) => ({ ...d, fill: states?.[i] ?? seriesColor(colors, chartColor, i) }));
  }, [data, colors, chartColor, categoryField]);
  const isDonut = donut !== false;
  const valueKey = isSet(valueField) && typeof valueField !== 'object' ? String(valueField) : 'value';
  const format = affixFormatter({ valuePrefix, valueSuffix }, false);
  const highlighted = click.highlighted;

  return (
    <LoadingFrame loading={ld.loading} look={blockLook(ld.skeleton)}>
      <ChartFrame
        empty={!slices.length}
        emptyText={emptyText}
        label={['Pie chart', centerLabel, centerValue].filter(Boolean).join(', ')}
        resetKey={[data, categoryField, valueField]}
        looks={{ '--lk-legend': legendTextColor, '--lk-slice-border': sliceBorderColor, '--lk-center-value': centerValueColor, '--lk-center-label': centerLabelColor }}
        notes={[hiddenNote(list(data).length - slices.length, 'slice')]}
        onDoubleClick={click.doubleClick}
      >
        <RPieChart>
          <Tooltip content={<ChartTooltip format={format} />} />
          {showLegend !== false ? <Legend content={<LegendContent />} /> : null}
          <Pie
            rootTabIndex={-1}
            data={slices}
            dataKey={valueKey}
            nameKey={categoryField}
            innerRadius={isDonut ? '58%' : 0}
            outerRadius="85%"
            strokeWidth={isDonut ? 4 : 1}
            stroke="var(--lk-slice-border, var(--ui-bg))"
            onClick={(slice: { payload?: unknown }) => click.pick(slice?.payload)}
            isAnimationActive={animated(true, slices.length)}
          >
            {slices.map((d, i) => (
              <Cell key={i} fill={d.fill} fillOpacity={emphasis(d, highlighted)} className="ui2-pointer" />
            ))}
            {isDonut && (centerValue || centerLabel) ? (
              <Label
                content={({ viewBox }) => {
                  const vb = viewBox as { cx?: number; cy?: number; innerRadius?: number } | undefined;
                  if (vb?.cx === undefined || vb.cy === undefined) return null;
                  // Sized to the hole, and shortened when even 16px would not fit ("$8.2M" over the ring).
                  const fit = centreValueFit(centerValue ?? '', vb.innerRadius);
                  const cy = centerValue ? vb.cy : vb.cy - 11;
                  return (
                    <text x={vb.cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                      {centerValue ? (
                        <tspan x={vb.cx} y={cy} style={{ fill: 'var(--lk-center-value, var(--ui-fg))', fontSize: fit.fontSize, fontWeight: 700 }}>
                          <title>{String(centerValue)}</title>
                          {fit.text}
                        </tspan>
                      ) : null}
                      {centerLabel ? (
                        <tspan x={vb.cx} y={cy + 22} style={{ fill: 'var(--lk-center-label, var(--ui-muted-fg))', fontSize: 12 }}>
                          {String(centerLabel)}
                        </tspan>
                      ) : null}
                    </text>
                  );
                }}
              />
            ) : null}
          </Pie>
        </RPieChart>
      </ChartFrame>
    </LoadingFrame>
  );
};
