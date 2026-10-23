import React, { useMemo } from 'react';
import type { Resolved, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { Cell, PolarAngleAxis, RadialBar, RadialBarChart, Tooltip } from 'recharts';
import { emphasis } from '@/AppBuilder/Widgets/Ui2/_charts/highlight';
import { seriesColor } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { type Row } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import { arcAngles, arcBox, radialRows } from './radialModel';
import {
  LegendContent,
  SafeFrame,
  animated,
  chartName,
  withChartRecovery,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartParts';
import { useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { formatter } from '@/AppBuilder/Widgets/Ui2/_shared/format';
import { isSet, num } from '@/AppBuilder/Widgets/Ui2/_shared/values';

/** A drawn ring: its name, value and colour, the gauge's maximum in progress mode, and the row it came from. */
interface Ring {
  name: string;
  value: number;
  max?: number;
  fill: string;
  row: Row;
}

interface RadialTipProps {
  active?: boolean;
  payload?: Array<{ payload?: Ring }>;
  format: (v: unknown) => string;
}

export const RadialTip = ({ active, payload, format }: RadialTipProps) => {
  const item = active ? payload?.[0]?.payload : null;
  if (!item) return null;
  return (
    <div className="tj-shadcn">
      <div className="tw-flex tw-items-center tw-gap-2 tw-rounded-ui2-lg tw-border tw-bg-ui2-background tw-px-2.5 tw-py-1.5 tw-text-xs tw-shadow-xl">
        <span className="tw-h-2.5 tw-w-2.5 tw-shrink-0 tw-rounded-[2px]" style={{ background: item.fill }} />
        <span className="tw-text-ui2-muted-foreground">{String(item.name)}</span>
        <span className="tw-font-mono tw-font-medium tw-tabular-nums">{format(item.value)}</span>
      </div>
    </div>
  );
};

// Sized by ResponsiveContainer (it passes width and height), so the arc can fill the box: a semicircle gauge sits low
// and wide, a full ring centred.
interface RadialBodyProps {
  width?: number;
  height?: number;
  p: Resolved;
  rings: Ring[];
  progress: boolean;
  centre: { value: string; label: string };
  onDatum: (datum: unknown) => void;
  /** Highlight clicked point: the clicked ring's row, or null. */
  highlighted?: unknown;
}

export const RadialBody = ({ width, height, p, rings, progress, centre, onDatum, highlighted }: RadialBodyProps) => {
  const w = Number(width) || 0;
  const legend = !progress && p.showLegend !== false;
  const chartHeight = Math.max(0, (Number(height) || 0) - (legend ? 32 : 0));
  const { startAngle, endAngle } = arcAngles(p.startAngle, p.endAngle);
  const box = arcBox(startAngle, endAngle, w, chartHeight);
  const r = box.outerRadius;
  const own = num(p.thickness);
  let inner: number;
  let barSize: number | undefined;
  if (progress) {
    barSize = Math.max(2, Math.min(r * 0.6, own ?? Math.max(8, Math.min(28, r * 0.16))));
    inner = Math.max(0, r - barSize);
  } else {
    barSize = own !== null ? Math.max(2, own) : undefined;
    inner = barSize ? Math.max(r * 0.15, r - rings.length * (barSize + 4)) : r * 0.32;
  }
  // Categories fill against the larger of Max value and the largest value.
  const max = progress ? rings[0].max ?? 100 : Math.max(num(p.maxValue) ?? 0, ...rings.map((g) => g.value)) || 1;
  const radius = p.rounded !== false ? (barSize ?? ((r - inner) / Math.max(1, rings.length)) * 0.82) / 2 : 0;
  const format = formatter({ prefix: p.valuePrefix, suffix: p.valueSuffix });
  const fontSize = Math.max(14, Math.min(40, inner * 0.42));
  return (
    <div className="tw-relative" style={{ width: w, height }}>
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
          isAnimationActive={animated(p, rings.length)}
          onClick={(entry) => onDatum(entry?.payload?.row ?? entry?.row)}
        >
          {rings.map((g, i) => (
            <Cell key={i} fill={g.fill} fillOpacity={emphasis(g.row, highlighted)} className="tw-cursor-pointer" />
          ))}
        </RadialBar>
      </RadialBarChart>
      {centre.value !== '' || centre.label ? (
        <div
          className="tw-pointer-events-none tw-absolute tw-flex tw-flex-col tw-items-center tw-text-center tw-leading-none"
          style={{
            left: box.cx,
            top: box.cy,
            maxWidth: Math.max(40, inner * 1.8),
            transform: box.textAbove ? 'translate(-50%, calc(-100% - 6px))' : 'translate(-50%, -50%)',
          }}
        >
          {centre.value !== '' ? (
            <span
              className="tw-font-bold tw-tabular-nums tw-tracking-tight tw-text-[color:var(--lk-center-value,var(--sc-foreground))]"
              style={{ fontSize }}
            >
              {centre.value}
            </span>
          ) : null}
          {centre.label ? (
            <span className="tw-mt-1.5 tw-text-xs tw-text-[color:var(--lk-center-label,var(--sc-muted-foreground))]">
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

export const ShadRadialChart = (props: WidgetProps) => {
  const p = props.properties;
  const progress = p.mode !== 'categories';
  const bound = useStable(p.data);
  const colors = useStable(p.colors);
  // The rings and the centre text are worked out again only when what they read changes, not on every render.
  const { rings, centre } = useMemo(() => {
    const label = isSet(p.centerLabel) ? String(p.centerLabel) : '';
    if (!progress) {
      // The first row is the outer ring: concentric bars read from the outside in.
      const rows: Ring[] = radialRows(bound, p.categoryField, p.valueField)
        .map((g, i) => ({ ...g, fill: g.color ?? seriesColor(colors, i) }))
        .reverse();
      return { rings: rows, centre: { value: isSet(p.centerValue) ? String(p.centerValue) : '', label } };
    }
    const value = num(p.value);
    if (value === null) return { rings: [], centre: { value: '', label } };
    const maxValue = num(p.maxValue);
    const max = maxValue !== null && maxValue > 0 ? maxValue : 100;
    const format = formatter({ prefix: p.valuePrefix, suffix: p.valueSuffix });
    return {
      rings: [
        {
          name: label || 'Value',
          value: Math.min(max, Math.max(0, value)),
          max,
          fill: seriesColor(colors, 0),
          row: { value, maxValue: max },
        },
      ],
      centre: { value: isSet(p.centerValue) ? String(p.centerValue) : format(value), label },
    };
  }, [
    progress,
    bound,
    colors,
    p.categoryField,
    p.valueField,
    p.value,
    p.maxValue,
    p.centerLabel,
    p.centerValue,
    p.valuePrefix,
    p.valueSuffix,
  ]);
  return (
    <SafeFrame
      props={props}
      empty={!rings.length}
      // The centre figure is part of the drawing: in the name, a gauge reads as its label and value.
      label={[chartName(props.componentType), centre.label, centre.value].filter(Boolean).join(', ')}
    >
      {(onDatum, highlighted) => (
        <RadialBody
          p={p}
          rings={rings}
          progress={progress}
          centre={centre}
          onDatum={onDatum}
          highlighted={highlighted}
        />
      )}
    </SafeFrame>
  );
};

export default withControlState(withChartRecovery(ShadRadialChart));
