import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label as ChartLabel,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { list, useExposed } from '../packHooks';
import { Shell } from './Shadcn';
import { seriesColor } from './shadcnLook';

export { withControlState } from '../packHooks';

// shadcn/ui pack charts (experiment): Recharts styled the way shadcn/ui's chart component styles it (no axis lines,
// horizontal grid only, a card tooltip, series colours from --sc-chart-1..5, which follow the app theme, or from the
// Chart color style, or from the Series colors list). Grid, axis and legend colours come from the widget's styles
// as variables (shadcnLook.js), else the theme's. Own lazy chunk, so Recharts loads only for apps with a chart.

const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
const full = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const fmt = (p, short) => (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v ?? '');
  return `${p.valuePrefix || ''}${short ? compact.format(n) : full.format(n)}${p.valueSuffix || ''}`;
};
const seriesOf = (p) =>
  (Array.isArray(p.yFields) ? p.yFields : String(p.yFields ?? '').split(','))
    .map((s) => String(s).trim())
    .filter(Boolean);
const AXIS = {
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
  tick: { fill: 'var(--lk-axis, var(--sc-muted-foreground))', fontSize: 12 },
};
const GRID = 'var(--lk-grid, var(--sc-border))';

const ChartTooltip = ({ active, payload, label, format }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tj-shadcn">
      <div className="grid min-w-[8rem] gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
        {label !== undefined ? <div className="font-medium">{String(label)}</div> : null}
        {payload.map((item) => (
          <div key={item.dataKey ?? item.name} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ background: item.color || item.payload?.fill }}
            />
            <span className="flex-1 text-muted-foreground">{String(item.name)}</span>
            <span className="font-mono font-medium tabular-nums">{format(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LegendContent = ({ payload }) => (
  <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs">
    {(payload || []).map((item) => (
      <div key={item.value} className="flex items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: item.color }} />
        <span className="text-[color:var(--lk-legend,var(--sc-muted-foreground))]">{String(item.value)}</span>
      </div>
    ))}
  </div>
);

const ChartFrame = ({ props, empty, children }) => {
  const { properties, setExposedVariables, height } = props;
  const [clicked, setClicked] = useState({});
  useExposed(setExposedVariables, properties, { clickedDatum: clicked });
  const onDatum = (datum) => {
    if (!datum) return;
    setClicked(datum);
    props.setExposedVariable('clickedDatum', datum);
    props.fireEvent('onClick');
  };
  return (
    <Shell {...props}>
      <div style={{ height }} className="w-full text-xs">
        {empty ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {String(properties.emptyText || 'No data')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children(onDatum)}
          </ResponsiveContainer>
        )}
      </div>
    </Shell>
  );
};

export const ShadAreaChart = (props) => {
  const p = props.properties;
  const data = list(p.data);
  const series = seriesOf(p);
  const Chart = p.lineOnly === true ? LineChart : AreaChart;
  const color = (i) => seriesColor(p.colors, i);
  return (
    <ChartFrame props={props} empty={!data.length || !series.length}>
      {(onDatum) => (
        <Chart
          data={data}
          margin={{ left: 4, right: 12, top: 8 }}
          onClick={(e) => onDatum(e?.activePayload?.[0]?.payload)}
        >
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s} id={`sc-fill-${props.id}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color(i)} stopOpacity={0.6} />
                <stop offset="95%" stopColor={color(i)} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey={p.xField} {...AXIS} minTickGap={24} />
          <YAxis {...AXIS} width={48} tickFormatter={fmt(p, true)} />
          <Tooltip cursor={{ stroke: 'var(--sc-border)' }} content={<ChartTooltip format={fmt(p, false)} />} />
          {p.showLegend === true ? <Legend content={<LegendContent />} /> : null}
          {series.map((s, i) =>
            p.lineOnly === true ? (
              <Line key={s} dataKey={s} type={p.curve || 'natural'} stroke={color(i)} strokeWidth={2} dot={false} />
            ) : (
              <Area
                key={s}
                dataKey={s}
                type={p.curve || 'natural'}
                stroke={color(i)}
                strokeWidth={2}
                fill={`url(#sc-fill-${props.id}-${i})`}
                stackId={p.stack === true ? 'a' : undefined}
              />
            )
          )}
        </Chart>
      )}
    </ChartFrame>
  );
};

export const ShadBarChart = (props) => {
  const p = props.properties;
  const data = list(p.data);
  const series = seriesOf(p);
  const horizontal = p.horizontal === true;
  const color = (i) => seriesColor(p.colors, i);
  return (
    <ChartFrame props={props} empty={!data.length || !series.length}>
      {(onDatum) => (
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ left: 4, right: 12, top: 8 }}
          onClick={(e) => onDatum(e?.activePayload?.[0]?.payload)}
        >
          <CartesianGrid vertical={horizontal} horizontal={!horizontal} stroke={GRID} />
          {horizontal ? (
            <>
              <XAxis type="number" {...AXIS} tickFormatter={fmt(p, true)} />
              <YAxis type="category" dataKey={p.xField} {...AXIS} width={96} />
            </>
          ) : (
            <>
              <XAxis dataKey={p.xField} {...AXIS} minTickGap={16} />
              <YAxis {...AXIS} width={48} tickFormatter={fmt(p, true)} />
            </>
          )}
          <Tooltip cursor={{ fill: 'var(--sc-muted)' }} content={<ChartTooltip format={fmt(p, false)} />} />
          {p.showLegend === true ? <Legend content={<LegendContent />} /> : null}
          {series.map((s, i) => (
            <Bar
              key={s}
              dataKey={s}
              fill={color(i)}
              radius={p.stack === true ? 0 : horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              stackId={p.stack === true ? 'a' : undefined}
            />
          ))}
        </BarChart>
      )}
    </ChartFrame>
  );
};

export const ShadPieChart = (props) => {
  const p = props.properties;
  const data = list(p.data).map((d, i) => ({ ...d, fill: seriesColor(p.colors, i) }));
  const donut = p.donut !== false;
  const format = fmt(p, false);
  return (
    <ChartFrame props={props} empty={!data.length}>
      {(onDatum) => (
        <PieChart>
          <Tooltip content={<ChartTooltip format={format} />} />
          {p.showLegend !== false ? <Legend content={<LegendContent />} /> : null}
          <Pie
            data={data}
            dataKey={p.valueField}
            nameKey={p.categoryField}
            innerRadius={donut ? '58%' : 0}
            outerRadius="85%"
            strokeWidth={donut ? 4 : 1}
            stroke="var(--lk-slice-border, var(--sc-background))"
            onClick={(slice) => onDatum(slice?.payload)}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.fill} />
            ))}
            {donut && (p.centerValue || p.centerLabel) ? (
              <ChartLabel
                content={({ viewBox }) =>
                  viewBox?.cx !== undefined ? (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        style={{ fill: 'var(--lk-center-value, var(--sc-foreground))', fontSize: 24, fontWeight: 700 }}
                      >
                        {String(p.centerValue ?? '')}
                      </tspan>
                      {p.centerLabel ? (
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy + 22}
                          style={{ fill: 'var(--lk-center-label, var(--sc-muted-foreground))', fontSize: 12 }}
                        >
                          {String(p.centerLabel)}
                        </tspan>
                      ) : null}
                    </text>
                  ) : null
                }
              />
            ) : null}
          </Pie>
        </PieChart>
      )}
    </ChartFrame>
  );
};
