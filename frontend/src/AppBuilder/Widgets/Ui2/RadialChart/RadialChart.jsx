import React from 'react';
import { Cell, PolarAngleAxis, RadialBar, RadialBarChart, Tooltip } from 'recharts';
import { seriesColor } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { formatter, isSet, num } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import { arcAngles, arcBox, radialRows } from './radialModel';
import { LegendContent, SafeFrame, animated } from '@/AppBuilder/Widgets/Ui2/_charts/chartParts';
import { withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';

export const RadialTip = ({ active, payload, format }) => {
  const item = active ? payload?.[0]?.payload : null;
  if (!item) return null;
  return (
    <div className="tj-shadcn">
      <div className="flex items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
        <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: item.fill }} />
        <span className="text-muted-foreground">{String(item.name)}</span>
        <span className="font-mono font-medium tabular-nums">{format(item.value)}</span>
      </div>
    </div>
  );
};

// Sized by ResponsiveContainer (it passes width and height), so the arc can fill the box: a semicircle gauge sits low
// and wide, a full ring centred.
export const RadialBody = ({ width, height, p, rings, progress, centre, onDatum }) => {
  const w = Number(width) || 0;
  const legend = !progress && p.showLegend !== false;
  const chartHeight = Math.max(0, (Number(height) || 0) - (legend ? 32 : 0));
  const { startAngle, endAngle } = arcAngles(p.startAngle, p.endAngle);
  const box = arcBox(startAngle, endAngle, w, chartHeight);
  const r = box.outerRadius;
  const own = num(p.thickness);
  let inner;
  let barSize;
  if (progress) {
    barSize = Math.max(2, Math.min(r * 0.6, own ?? Math.max(8, Math.min(28, r * 0.16))));
    inner = Math.max(0, r - barSize);
  } else {
    barSize = own !== null ? Math.max(2, own) : undefined;
    inner = barSize ? Math.max(r * 0.15, r - rings.length * (barSize + 4)) : r * 0.32;
  }
  // Categories fill against the larger of Max value and the largest value.
  const max = progress ? rings[0].max : Math.max(num(p.maxValue) ?? 0, ...rings.map((g) => g.value)) || 1;
  const radius = p.rounded !== false ? (barSize ?? ((r - inner) / Math.max(1, rings.length)) * 0.82) / 2 : 0;
  const format = formatter({ prefix: p.valuePrefix, suffix: p.valueSuffix });
  const fontSize = Math.max(14, Math.min(40, inner * 0.42));
  return (
    <div className="relative" style={{ width: w, height }}>
      <RadialBarChart
        width={w}
        height={chartHeight}
        data={rings}
        cx={box.cx}
        cy={box.cy}
        innerRadius={inner}
        outerRadius={r}
        startAngle={startAngle}
        endAngle={endAngle}
        barSize={barSize}
        barCategoryGap={progress ? 0 : '18%'}
      >
        <PolarAngleAxis type="number" domain={[0, max]} tick={false} axisLine={false} />
        {progress ? null : <Tooltip cursor={false} content={<RadialTip format={format} />} />}
        <RadialBar
          dataKey="value"
          background={p.showTrack !== false ? { fill: 'var(--lk-track, var(--sc-muted))' } : false}
          cornerRadius={radius}
          isAnimationActive={animated(p)}
          onClick={(entry) => onDatum(entry?.payload?.row ?? entry?.row)}
        >
          {rings.map((g, i) => (
            <Cell key={i} fill={g.fill} className="cursor-pointer" />
          ))}
        </RadialBar>
      </RadialBarChart>
      {centre.value !== '' || centre.label ? (
        <div
          className="pointer-events-none absolute flex flex-col items-center text-center leading-none"
          style={{
            left: box.cx,
            top: box.cy,
            maxWidth: Math.max(40, inner * 1.8),
            transform: box.textAbove ? 'translate(-50%, calc(-100% - 6px))' : 'translate(-50%, -50%)',
          }}
        >
          {centre.value !== '' ? (
            <span
              className="font-bold tabular-nums tracking-tight text-[color:var(--lk-center-value,var(--sc-foreground))]"
              style={{ fontSize }}
            >
              {centre.value}
            </span>
          ) : null}
          {centre.label ? (
            <span className="mt-1.5 text-xs text-[color:var(--lk-center-label,var(--sc-muted-foreground))]">
              {centre.label}
            </span>
          ) : null}
        </div>
      ) : null}
      {legend ? (
        <LegendContent
          payload={rings
            .slice()
            .reverse()
            .map((g) => ({ value: g.name, color: g.fill }))}
        />
      ) : null}
    </div>
  );
};

export const ShadRadialChart = (props) => {
  const p = props.properties;
  const progress = p.mode !== 'categories';
  const format = formatter({ prefix: p.valuePrefix, suffix: p.valueSuffix });
  let rings = [];
  let centre = { value: '', label: isSet(p.centerLabel) ? String(p.centerLabel) : '' };
  if (progress) {
    const value = num(p.value);
    const maxValue = num(p.maxValue);
    const max = maxValue !== null && maxValue > 0 ? maxValue : 100;
    if (value !== null) {
      rings = [
        {
          name: centre.label || 'Value',
          value: Math.min(max, Math.max(0, value)),
          max,
          fill: seriesColor(p.colors, 0),
          row: { value, maxValue: max },
        },
      ];
      centre.value = isSet(p.centerValue) ? String(p.centerValue) : format(value);
    }
  } else {
    // The first row is the outer ring: concentric bars read from the outside in.
    rings = radialRows(p.data, p.categoryField, p.valueField)
      .map((g, i) => ({ ...g, fill: g.color ?? seriesColor(p.colors, i) }))
      .reverse();
    centre = { ...centre, value: isSet(p.centerValue) ? String(p.centerValue) : '' };
  }
  return (
    <SafeFrame props={props} empty={!rings.length}>
      {(onDatum) => <RadialBody p={p} rings={rings} progress={progress} centre={centre} onDatum={onDatum} />}
    </SafeFrame>
  );
};

export default withControlState(ShadRadialChart);
