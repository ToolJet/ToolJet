import React, { useMemo } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { Cell, Label as ChartLabel, Legend, Pie, PieChart, Tooltip } from 'recharts';
import { useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { seriesColor } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { statusColors, centreValueFit } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import {
  animated,
  ChartFrame,
  ChartTooltip,
  LegendContent,
  withChartRecovery,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartParts';
import { affixFormatter } from '@/AppBuilder/Widgets/Ui2/_shared/format';
import { isSet, list } from '@/AppBuilder/Widgets/Ui2/_shared/values';

// A pie past this many slices is unreadable, and drawing 10k of them freezes the page; bars likewise (a bar each,
// with a cell for its colour, per row and series).
export const MAX_SLICES = 100;

export const ShadPieChart = (props: WidgetProps) => {
  const p = props.properties;
  const bound = useStable(p.data);
  const colors = useStable(p.colors);
  // The slices and their colours are worked out again only when the data, the category field or the colours change.
  const data = useMemo(() => {
    const slices = list(bound).slice(0, MAX_SLICES);
    const states = isSet(colors) ? null : statusColors(slices.map((d) => d?.[p.categoryField]));
    return slices.map((d, i) => ({ ...d, fill: states?.[i] ?? seriesColor(colors, i) }));
  }, [bound, colors, p.categoryField]);
  const donut = p.donut !== false;
  // Recharts needs a key for a slice's value; an unset or junk field reads `value`, the default rows' own field.
  const valueKey = isSet(p.valueField) && typeof p.valueField !== 'object' ? String(p.valueField) : 'value';
  const format = affixFormatter(p, false);
  return (
    <ChartFrame props={props} empty={!data.length}>
      {(onDatum) => (
        <PieChart>
          <Tooltip content={<ChartTooltip format={format} />} />
          {p.showLegend !== false ? <Legend content={<LegendContent />} /> : null}
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={p.categoryField}
            innerRadius={donut ? '58%' : 0}
            outerRadius="85%"
            strokeWidth={donut ? 4 : 1}
            stroke="var(--lk-slice-border, var(--sc-background))"
            onClick={(slice) => onDatum(slice?.payload)}
            isAnimationActive={animated(p, data.length)}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.fill} />
            ))}
            {donut && (p.centerValue || p.centerLabel) ? (
              <ChartLabel
                content={({ viewBox }) => {
                  // A pie's label is given a polar box: its centre and radii.
                  const box = viewBox && 'cx' in viewBox ? viewBox : undefined;
                  if (box?.cx === undefined) return null;
                  // Sized to the hole, and shortened when even 16px would not fit ("$8.2M", not "$8,196,250.00" over the ring).
                  const fit = centreValueFit(p.centerValue ?? '', box.innerRadius);
                  return (
                    <text x={box.cx} y={box.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan
                        x={box.cx}
                        y={box.cy}
                        style={{
                          fill: 'var(--lk-center-value, var(--sc-foreground))',
                          fontSize: fit.fontSize,
                          fontWeight: 700,
                        }}
                      >
                        <title>{String(p.centerValue ?? '')}</title>
                        {fit.text}
                      </tspan>
                      {p.centerLabel ? (
                        <tspan
                          x={box.cx}
                          y={Number(box.cy) + 22}
                          style={{ fill: 'var(--lk-center-label, var(--sc-muted-foreground))', fontSize: 12 }}
                        >
                          {String(p.centerLabel)}
                        </tspan>
                      ) : null}
                    </text>
                  );
                }}
              />
            ) : null}
          </Pie>
        </PieChart>
      )}
    </ChartFrame>
  );
};

export default withControlState(withChartRecovery(ShadPieChart));
