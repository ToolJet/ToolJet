// ToolJet UI 2.0: what the cartesian charts (Area, Bar, Line) share: the series a chart plots with their names,
// colours and value formats, and the value axis, tooltip and legend drawn the same way. The parts are functions that
// return Recharts elements, not components: Recharts finds its axes and tooltip among the chart's children by type.
import React from 'react';
import { Legend, Tooltip, YAxis } from 'recharts';
import type { TooltipProps } from 'recharts';
import { seriesColor } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { useStable } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { isSet } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import type { Bound, Resolved } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import {
  drawnLabelMap,
  fieldNote,
  resolveChartFields,
  seriesLabel,
  seriesSlots,
  statusColors,
  wholeNumbers,
  wholeTicks,
} from './chartsModel';
import { AXIS, ChartTooltip, LegendContent, seriesOf, valueAxisWidth } from './chartParts';
import { affixFormatter } from '@/AppBuilder/Widgets/Ui2/_shared/format';

/** The series of a chart and how its values read: names, colours (status colours for state-named series unless the
 *  author set colours), tick and tooltip formats, and the value axis's width and ticks. */
export interface SeriesSetup {
  xField: string | undefined;
  series: string[];
  names: string[];
  fills: string[];
  tick: (v: unknown) => string;
  full: (v: unknown) => string;
  yWidth: number;
  allowDecimals: boolean;
  ticks: ReturnType<typeof wholeTicks>;
  /** The configured fields the data lacks, and what is drawn in their place (fieldNote), or null. */
  fieldNote: string | null;
}

/** What a chart's properties name for its series, as bound. */
export interface SeriesProps {
  xField: string | undefined;
  yFields: unknown;
  seriesLabels: unknown;
  colors: unknown;
  affixes: Resolved;
  stacked: boolean;
}

/** A series chart's bound data and series properties, each kept as the same reference while its content is equal. */
export const useSeriesInputs = (p: Resolved) => ({
  bound: useStable(p.data),
  yFields: useStable(p.yFields),
  seriesLabels: useStable(p.seriesLabels),
  colors: useStable(p.colors),
});

export const seriesSetup = (rows: Bound[], props: SeriesProps): SeriesSetup => {
  const { yFields, seriesLabels, colors, affixes, stacked } = props;
  const configured = seriesOf({ yFields });
  const fields = resolveChartFields(rows, props.xField, configured);
  const labels = drawnLabelMap(seriesLabels, configured, fields.series);
  const names = fields.series.map((s) => seriesLabel(s, labels));
  const states = isSet(colors) ? null : statusColors(names);
  const slots = seriesSlots(configured, fields.series);
  const tick = affixFormatter(affixes, true);
  return {
    xField: fields.x,
    series: fields.series,
    names,
    fills: fields.series.map((_, i) => states?.[i] ?? seriesColor(colors, slots[i])),
    tick,
    full: affixFormatter(affixes, false),
    yWidth: valueAxisWidth(rows, fields.series, tick, stacked),
    allowDecimals: !wholeNumbers(rows, fields.series),
    ticks: wholeTicks(rows, fields.series, stacked),
    fieldNote: fieldNote(fields),
  };
};

/** The value (y) axis: hidden on a compact chart, ticks in the value format, whole numbers when the data is whole. */
export const valueAxis = (
  { yWidth, tick, allowDecimals, ticks }: Pick<SeriesSetup, 'yWidth' | 'tick' | 'allowDecimals' | 'ticks'>,
  hide: boolean
) => <YAxis {...AXIS} hide={hide} width={yWidth} tickFormatter={tick} allowDecimals={allowDecimals} {...ticks} />;

/** The tooltip in the value format, and the legend when asked for, with more than one series, on a chart big enough. */
export const tooltipAndLegend = (
  full: (v: unknown) => string,
  cursor: TooltipProps<number, string>['cursor'],
  legend: boolean
) => (
  <>
    <Tooltip cursor={cursor} content={<ChartTooltip format={full} />} />
    {legend ? <Legend content={<LegendContent />} /> : null}
  </>
);
