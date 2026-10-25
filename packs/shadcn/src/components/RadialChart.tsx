import React, { useMemo } from 'react';
import { Cell, PolarAngleAxis, RadialBar, RadialBarChart, Tooltip } from 'recharts';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { ChartFrame, InlineTip, LegendContent, seriesColor, useChartClick } from '../lib/ui2/charts/chartParts';
import { animated, axisLabel, emphasis, formatter, hiddenNote, isRecord, isScalar, isSet, list, num, type Row } from '../lib/ui2/charts/chartModel';
import { LoadingFrame, blockLook, useLoadingLook } from '../lib/ui2/loading/look';
import { TOKEN, useThemeColor } from '../lib/styleDefaults';

const MAX_RINGS = 12;

/** A drawn ring: its name, value and colour, the gauge's maximum in progress mode, and the row it came from. */
interface Ring {
  name: string;
  value: number;
  max?: number;
  fill: string;
  row: Row;
}

/** The arc's angles (degrees, counter-clockwise from 3 o'clock). Equal or junk angles give a full circle from the top,
 *  clockwise; the sweep is capped at one turn. */
const arcAngles = (startAngle: unknown, endAngle: unknown) => {
  const s = num(startAngle) ?? 90;
  let e = num(endAngle) ?? -270;
  if (e === s) e = s - 360;
  if (Math.abs(e - s) > 360) e = s + Math.sign(e - s) * 360;
  return { startAngle: s, endAngle: e };
};

/** Where an arc sits in a width x height box so it fills it: centre and outer radius, and whether the centre text sits
 *  above the centre (a gauge with little arc below it). */
const arcBox = (s: number, e: number, w: number, h: number, pad = 0.92) => {
  const lo = Math.min(s, e);
  const hi = Math.max(s, e);
  const at = (a: number): [number, number] => [Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)];
  const pts: [number, number][] = [[0, 0], at(s), at(e)];
  for (let a = Math.ceil(lo / 90) * 90; a <= hi; a += 90) pts.push(at(a));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const r = Math.max(0, Math.min(w / Math.max(maxX - minX, 0.2), h / Math.max(maxY - minY, 0.2)) * pad);
  return { cx: w / 2 - (r * (minX + maxX)) / 2, cy: h / 2 + (r * (minY + maxY)) / 2, outerRadius: r, textAbove: minY > -0.35 };
};

interface BodyProps {
  width?: number;
  height?: number;
  rings: Ring[];
  progress: boolean;
  centre: { value: string; label: string };
  legend: boolean;
  startAngle: unknown;
  endAngle: unknown;
  thickness: unknown;
  maxValue: unknown;
  rounded: boolean;
  showTrack: boolean;
  animate: unknown;
  format: (v: unknown) => string;
  onDatum: (row: unknown) => void;
  highlighted: unknown;
}

// Sized by ResponsiveContainer (it passes width and height), so the arc fills the box: a semicircle gauge sits low and
// wide, a full ring centred.
const RadialBody = ({ width, height, rings, progress, centre, legend, startAngle, endAngle, thickness, maxValue, rounded, showTrack, animate, format, onDatum, highlighted }: BodyProps) => {
  const w = Number(width) || 0;
  const chartHeight = Math.max(0, (Number(height) || 0) - (legend ? 32 : 0));
  const angles = arcAngles(startAngle, endAngle);
  const box = arcBox(angles.startAngle, angles.endAngle, w, chartHeight);
  const r = box.outerRadius;
  const own = num(thickness);
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
  const max = progress ? rings[0].max ?? 100 : Math.max(num(maxValue) ?? 0, ...rings.map((g) => g.value)) || 1;
  const radius = rounded ? (barSize ?? ((r - inner) / Math.max(1, rings.length)) * 0.82) / 2 : 0;
  const fontSize = Math.max(14, Math.min(40, inner * 0.42));
  return (
    <div className="ui2-radial" style={{ width: w, height }}>
      <RadialBarChart
        width={w}
        height={chartHeight}
        data={rings}
        cx={box.cx}
        cy={box.cy}
        innerRadius={inner}
        outerRadius={r}
        startAngle={angles.startAngle}
        endAngle={angles.endAngle}
        barSize={barSize}
        barCategoryGap={progress ? 0 : '18%'}
      >
        <PolarAngleAxis type="number" domain={[0, max]} tick={false} axisLine={false} />
        {progress ? null : (
          <Tooltip
            cursor={false}
            content={({ active, payload }: { active?: boolean; payload?: { payload?: Ring }[] }) => {
              const item = active ? payload?.[0]?.payload : null;
              return item ? <InlineTip swatch={item.fill} name={item.name} value={format(item.value)} /> : null;
            }}
          />
        )}
        <RadialBar
          dataKey="value"
          background={showTrack ? { fill: 'var(--lk-track, var(--ui-muted))' } : false}
          cornerRadius={radius}
          isAnimationActive={animated(animate, rings.length)}
          onClick={(entry: { payload?: Ring; row?: Row }) => onDatum(entry?.payload?.row ?? entry?.row)}
        >
          {rings.map((g, i) => (
            <Cell key={i} fill={g.fill} fillOpacity={emphasis(g.row, highlighted)} />
          ))}
        </RadialBar>
      </RadialBarChart>
      {centre.value !== '' || centre.label ? (
        <div
          className="ui2-radial-centre"
          style={{ left: box.cx, top: box.cy, maxWidth: Math.max(40, inner * 1.8), transform: box.textAbove ? 'translate(-50%, calc(-100% - 6px))' : 'translate(-50%, -50%)' }}
        >
          {centre.value !== '' ? (
            <span className="ui2-radial-value" style={{ fontSize }}>
              {centre.value}
            </span>
          ) : null}
          {centre.label ? <span className="ui2-radial-label">{centre.label}</span> : null}
        </div>
      ) : null}
      {legend ? <LegendContent payload={rings.slice().reverse().map((g) => ({ value: g.name, color: g.fill }))} /> : null}
    </div>
  );
};

// "progress": one value against Max value as a ring or gauge. "categories": concentric bars, one per data row.
export const RadialChart = () => {
  const [mode] = ToolJet.useStateEnumeration({ name: 'mode', label: 'Mode', enumDefinition: ['progress', 'categories'], initialValue: 'progress', inspector: 'switch' });
  const [value] = ToolJet.useStateNumber({ name: 'value', label: 'Value', initialValue: 72 });
  const [maxValue] = ToolJet.useStateNumber({ name: 'maxValue', label: 'Max value', initialValue: 100 });
  const [data] = ToolJet.useStateArray({
    name: 'data',
    label: 'Data (categories mode)',
    initialValue: [
      { channel: 'Direct', visitors: 275 },
      { channel: 'Search', visitors: 200 },
      { channel: 'Social', visitors: 187 },
      { channel: 'Email', visitors: 120 },
    ],
  });
  const [categoryField] = ToolJet.useStateString({ name: 'categoryField', label: 'Category field', initialValue: 'channel' });
  const [valueField] = ToolJet.useStateString({ name: 'valueField', label: 'Value field', initialValue: 'visitors' });
  const [centerValue] = ToolJet.useStateString({ name: 'centerValue', label: 'Center figure (blank = the value)', initialValue: '' });
  const [centerLabel] = ToolJet.useStateString({ name: 'centerLabel', label: 'Center caption', initialValue: 'Completed' });
  const [startAngle] = ToolJet.useStateNumber({ name: 'startAngle', label: 'Start angle', description: '90 / -270: full ring. 180 / 0: semicircle gauge.', initialValue: 90 });
  const [endAngle] = ToolJet.useStateNumber({ name: 'endAngle', label: 'End angle', initialValue: -270 });
  const [thickness] = ToolJet.useStateString({ name: 'thickness', label: 'Ring thickness (px, blank = auto)', initialValue: '' });
  const [rounded] = ToolJet.useStateBoolean({ name: 'rounded', label: 'Rounded ends', initialValue: true });
  const [showTrack] = ToolJet.useStateBoolean({ name: 'showTrack', label: 'Track', initialValue: true });
  const [valuePrefix] = ToolJet.useStateString({ name: 'valuePrefix', label: 'Value prefix', initialValue: '' });
  const [valueSuffix] = ToolJet.useStateString({ name: 'valueSuffix', label: 'Value suffix', initialValue: '%' });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty message', initialValue: 'No data' });
  const [animate] = ToolJet.useStateBoolean({ name: 'animate', label: 'Animate', initialValue: true });
  const [showLegend] = ToolJet.useStateBoolean({ name: 'showLegend', label: 'Legend (categories mode)', initialValue: true });
  const [colors] = ToolJet.useStateArray({ name: 'colors', label: 'Series colors (in order)', initialValue: [] });
  const [highlightClicked] = ToolJet.useStateBoolean({ name: 'highlightClicked', label: 'Highlight clicked point', description: 'Draws the clicked ring emphasised until Clear clicked point runs or another is clicked.', initialValue: false });
  const click = useChartClick(highlightClicked);
  const chartColor = useThemeColor('chartColor', 'Chart color (series palette from it)', TOKEN.brand);
  const trackColor = useThemeColor('trackColor', 'Track color', TOKEN.muted);
  const legendTextColor = useThemeColor('legendTextColor', 'Legend text color', TOKEN.mutedText);
  const centerValueColor = useThemeColor('centerValueColor', 'Center figure color', TOKEN.text);
  const centerLabelColor = useThemeColor('centerLabelColor', 'Center caption color', TOKEN.mutedText);
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 22 });

  const progress = mode !== 'categories';
  const format = formatter({ prefix: valuePrefix, suffix: valueSuffix });
  const { rings, centre } = useMemo(() => {
    const label = isSet(centerLabel) ? String(centerLabel) : '';
    if (!progress) {
      // The first row is the outer ring: concentric bars read from the outside in.
      const rows: Ring[] = list(data)
        .filter(isRecord)
        .slice(0, MAX_RINGS)
        .map((row, i) => {
          const own = isSet(row.fill) && isScalar(row.fill) ? row.fill : isSet(row.color) && isScalar(row.color) ? row.color : null;
          const name = isSet(categoryField) ? axisLabel(row[String(categoryField)]) : '';
          return { name: name === '' ? `Item ${i + 1}` : String(name), value: Math.max(0, num(row[String(valueField)]) ?? 0), fill: own === null ? seriesColor(colors, chartColor, i) : String(own), row };
        })
        .reverse();
      return { rings: rows, centre: { value: isSet(centerValue) ? String(centerValue) : '', label } };
    }
    const v = num(value);
    if (v === null) return { rings: [] as Ring[], centre: { value: '', label } };
    const m = num(maxValue);
    const max = m !== null && m > 0 ? m : 100;
    return {
      rings: [{ name: label || 'Value', value: Math.min(max, Math.max(0, v)), max, fill: seriesColor(colors, chartColor, 0), row: { value: v, maxValue: max } }],
      centre: { value: isSet(centerValue) ? String(centerValue) : format(v), label },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, data, colors, chartColor, categoryField, valueField, value, maxValue, centerLabel, centerValue, valuePrefix, valueSuffix]);

  return (
    <LoadingFrame loading={ld.loading} look={blockLook(ld.skeleton)}>
      <ChartFrame
        empty={!rings.length}
        emptyText={emptyText}
        // The centre figure is part of the drawing: a gauge reads as its label and value.
        label={['Radial chart', centre.label, centre.value].filter(Boolean).join(', ')}
        notes={progress ? [] : [hiddenNote(list(data).filter(isRecord).length - rings.length, 'ring')]}
        resetKey={[data, value, mode]}
        looks={{ '--lk-track': trackColor, '--lk-legend': legendTextColor, '--lk-center-value': centerValueColor, '--lk-center-label': centerLabelColor }}
        onDoubleClick={click.doubleClick}
      >
        <RadialBody
          rings={rings}
          progress={progress}
          centre={centre}
          legend={!progress && showLegend !== false}
          startAngle={startAngle}
          endAngle={endAngle}
          thickness={thickness}
          maxValue={maxValue}
          rounded={rounded !== false}
          showTrack={showTrack !== false}
          animate={animate}
          format={format}
          onDatum={click.pick}
          highlighted={click.highlighted}
        />
      </ChartFrame>
    </LoadingFrame>
  );
};
