// UI 2.0 charts, ported for the pack: the parts the Recharts charts share (Widgets/Ui2/_charts/chartParts.tsx and
// cartesianParts.tsx in the UI 2.0 checkout). Recharts styled the way shadcn/ui's chart styles it: no axis lines, a
// horizontal grid only, a card tooltip, series colours from the theme's chart scale (or the Chart color style, or the
// Series colors list). Colours of the grid, axes, legend and centre text come from the widget's styles as --lk-*
// variables on the chart's root, else the theme's (ui2-charts.css).
import React, { useEffect, useRef, useState } from 'react';
import { Legend, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { seriesColors } from '../../charts';
import {
  affixFormatter,
  drawnLabelMap,
  fieldList,
  fieldNote,
  highlightOf,
  isSet,
  resolveChartFields,
  seriesLabel,
  seriesSlots,
  statusColors,
  valueAxisWidth,
  wholeNumbers,
  wholeTicks,
  type Row,
} from './chartModel';
import '../../../styles/ui2-charts.css';

// The SDK as the host provides it (LibraryComponent/inlineRuntime.ts); the installed typings predate the style hooks.
type Setter<T> = (v: T | ((prev: T) => T)) => void;
interface ChartSdk {
  useStateObject(o: { name: string; initialValue?: Record<string, unknown>; inspector?: string }): [Record<string, unknown>, Setter<Record<string, unknown>>];
  useEventCallback(o: { name: string; displayName?: string }): () => void;
  useAction(o: { name: string; displayName?: string }, handler: (...args: unknown[]) => unknown): void;
  useControlState?(): { disabled: boolean; loading: boolean };
}
const TJ = ToolJet as unknown as ChartSdk;

export const AXIS = {
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
  tick: { fill: 'var(--lk-axis, var(--ui-muted-fg))', fontSize: 12 },
};
export const AXIS_FILL = AXIS.tick.fill;
export const GRID = 'var(--lk-grid, var(--ui-border))';
export const REF = 'var(--lk-ref, var(--ui-muted-fg))';
export const CURSOR_FILL = { fill: 'var(--ui-muted)' };
export const CURSOR_LINE = { stroke: 'var(--ui-border)' };

/** The colour of the series at `index`: the author's list where it names one, else the theme's chart scale led by
 *  the Chart color style (the pack palette). */
export const seriesColor = (colors: unknown, chartColor: string, index: number): string => seriesColors(colors, chartColor, index + 1)[index];

/** The widget's colour styles as the --lk-* variables the chart's parts read; unset styles leave the theme's. */
export const lookVars = (looks: Record<string, unknown>): React.CSSProperties =>
  Object.fromEntries(Object.entries(looks).filter(([, v]) => isSet(v) && typeof v !== 'object').map(([k, v]) => [k, String(v)])) as React.CSSProperties;

// ---- Tooltip and legend ----------------------------------------------------------------------------------------------

export interface TooltipItem {
  dataKey?: string | number;
  name?: string | number;
  value?: unknown;
  color?: string;
  payload?: { fill?: string };
}
export interface TooltipContentProps {
  active?: boolean;
  payload?: TooltipItem[];
  label?: unknown;
}

/** The tooltip card: the label, then each series' swatch, name and value in `format` (which also gets the series key). */
export const ChartTooltip = ({
  active,
  payload,
  label,
  format,
  rowFill = true,
  labelFormat,
}: TooltipContentProps & { format: (v: unknown, key: unknown) => string; rowFill?: boolean; labelFormat?: (v: unknown) => string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ui2-chart-tip">
      {label !== undefined && label !== '' ? <div className="ui2-chart-tip-title">{labelFormat ? labelFormat(label) : String(label)}</div> : null}
      {payload.map((item, i) => (
        <div key={String(item.dataKey ?? item.name ?? i)} className="ui2-chart-tip-row">
          <span className="ui2-chart-tip-swatch" style={{ background: rowFill ? item.color || item.payload?.fill : item.color }} />
          <span className="ui2-chart-tip-name">{String(item.name ?? '')}</span>
          <span className="ui2-chart-tip-value">{format(item.value, item.dataKey)}</span>
        </div>
      ))}
    </div>
  );
};

/** A one-line tooltip card (a radial ring, a sparkline point): swatch, name and value. */
export const InlineTip = ({ swatch, name, value }: { swatch?: string; name: string; value: string }) => (
  <div className="ui2-chart-tip is-inline">
    {swatch ? <span className="ui2-chart-tip-swatch" style={{ background: swatch }} /> : null}
    <span className="ui2-chart-tip-name">{name}</span>
    <span className="ui2-chart-tip-value">{value}</span>
  </div>
);

export interface LegendItem {
  value?: string | number;
  color?: string;
}
export const LegendContent = ({ payload }: { payload?: LegendItem[] }) => (
  <div className="ui2-chart-legend">
    {(payload || []).map((item, i) => (
      <div key={i} className="ui2-chart-legend-item">
        <span className="ui2-chart-legend-swatch" style={{ background: item.color }} />
        <span>{String(item.value ?? '')}</span>
      </div>
    ))}
  </div>
);

// ---- Frame -----------------------------------------------------------------------------------------------------------

export const EmptyChart = ({ text, small }: { text: string; small?: boolean }) => (
  <div data-chart-state="empty" className={`ui2-chart-empty${small ? ' is-small' : ''}`}>
    {text}
  </div>
);

const ChartError = () => (
  <div role="alert" data-chart-state="error" className="ui2-chart-empty">
    This chart could not be drawn from its data
  </div>
);

/** The notes under a chart on what it leaves out, one line each. */
export const ChartNotes = ({ notes }: { notes: (string | null | undefined)[] }) => {
  const shown = notes.filter((n): n is string => !!n);
  return shown.length ? (
    <div className="ui2-chart-notes">
      {shown.map((note) => (
        <div key={note} data-chart-note="" title={note}>
          {note}
        </div>
      ))}
    </div>
  ) : null;
};

interface BoundaryProps {
  resetKey: unknown;
  children: React.ReactNode;
}
/** A chart that fails to draw shows the error look instead of taking the app down, and draws again when its inputs
 *  change. */
export class ChartBoundary extends React.Component<BoundaryProps, { failed: boolean }> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(prev: BoundaryProps) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? <ChartError /> : this.props.children;
  }
}

/** The widget's box as drawn, for the choices that depend on its size (a compact chart, angled names). */
export const useBoxSize = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const read = () => setSize((s) => (s.width === el.clientWidth && s.height === el.clientHeight ? s : { width: el.clientWidth, height: el.clientHeight }));
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, ...size };
};

/** A chart's name for assistive tech. */
const ChartArea = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div role="img" aria-label={label} className="ui2-chart-area">
    <div aria-hidden="true" className="ui2-chart-area">
      {children}
    </div>
  </div>
);

interface FrameProps {
  empty: boolean;
  emptyText: unknown;
  label: string;
  looks?: Record<string, unknown>;
  notes?: (string | null)[];
  small?: boolean;
  onDoubleClick?: () => void;
  onClick?: () => void;
  resetKey: unknown;
  /** Drawn inside a ResponsiveContainer unless `plain` (the chart then sizes itself). */
  plain?: boolean;
  boxRef?: React.Ref<HTMLDivElement>;
  className?: string;
  children: React.ReactElement | (() => React.ReactNode);
}

/** The chart's box: the empty look, the drawn chart (one image for assistive tech) and the notes under it. */
export const ChartFrame = ({ empty, emptyText, label, looks = {}, notes = [], small, onDoubleClick, onClick, resetKey, plain, boxRef, className, children }: FrameProps) => (
  <div ref={boxRef} className={`ui ui2-chart${className ? ` ${className}` : ''}`} style={lookVars(looks)} onClick={onClick} onDoubleClick={onDoubleClick}>
    <div className="ui2-chart-plot">
      {empty ? (
        <EmptyChart text={String(isSet(emptyText) ? emptyText : 'No data')} small={small} />
      ) : (
        <ChartBoundary resetKey={resetKey}>
          {plain ? (
            (typeof children === 'function' ? children() : children) as React.ReactNode
          ) : (
            <ChartArea label={label}>
              <ResponsiveContainer width="100%" height="100%">
                {(typeof children === 'function' ? children() : children) as React.ReactElement}
              </ResponsiveContainer>
            </ChartArea>
          )}
        </ChartBoundary>
      )}
    </div>
    <ChartNotes notes={notes} />
  </div>
);

// ---- Clicks ----------------------------------------------------------------------------------------------------------

/** The clicked datum and the chart's events and actions: a click on a datum exposes it (clickedDataPoint) and fires
 *  onClick; a double click fires onDoubleClick; clearClickedPoint() empties it. Disabled or loading, the chart takes
 *  no clicks. With Highlight clicked point, `highlighted` is the clicked datum until it is cleared. */
export const useChartClick = (highlightClicked: unknown) => {
  const [clicked, setClicked] = TJ.useStateObject({ name: 'clickedDataPoint', initialValue: {}, inspector: 'hidden' });
  const onClick = TJ.useEventCallback({ name: 'onClick' });
  const onDoubleClick = TJ.useEventCallback({ name: 'onDoubleClick' });
  const control = TJ.useControlState?.() ?? { disabled: false, loading: false };
  const inactive = control.disabled || control.loading;
  TJ.useAction({ name: 'clearClickedPoint', displayName: 'Clear clicked point' }, () => setClicked({}));
  return {
    pick: (datum: unknown) => {
      if (inactive || !datum || typeof datum !== 'object') return;
      setClicked(datum as Record<string, unknown>);
      onClick();
    },
    click: () => (inactive ? undefined : onClick()),
    doubleClick: () => (inactive ? undefined : onDoubleClick()),
    highlighted: highlightClicked === true ? highlightOf(clicked) : null,
  };
};

// ---- Cartesian series ------------------------------------------------------------------------------------------------

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
  fieldNote: string | null;
}

/** The series of an Area or Bar chart and how its values read: names, colours (status colours for state-named series
 *  unless the author set colours), compact ticks and full tooltip values with the prefix and suffix. */
export const seriesSetup = (
  rows: Row[],
  p: { xField: unknown; yFields: unknown; seriesLabels: unknown; colors: unknown; chartColor: string; valuePrefix: unknown; valueSuffix: unknown; stacked: boolean }
): SeriesSetup => {
  const configured = fieldList(p.yFields);
  const fields = resolveChartFields(rows, isSet(p.xField) ? String(p.xField) : undefined, configured);
  const labels = drawnLabelMap(p.seriesLabels, configured, fields.series);
  const names = fields.series.map((s) => seriesLabel(s, labels));
  const states = Array.isArray(p.colors) && p.colors.length ? null : statusColors(names);
  const slots = seriesSlots(configured, fields.series);
  const tick = affixFormatter(p, true);
  return {
    xField: fields.x,
    series: fields.series,
    names,
    fills: fields.series.map((_, i) => states?.[i] ?? seriesColor(p.colors, p.chartColor, slots[i])),
    tick,
    full: affixFormatter(p, false),
    yWidth: valueAxisWidth(rows, fields.series, tick, p.stacked),
    allowDecimals: !wholeNumbers(rows, fields.series),
    ticks: wholeTicks(rows, fields.series, p.stacked),
    fieldNote: fieldNote(fields),
  };
};

/** The value (y) axis: hidden on a compact chart, ticks in the value format, whole numbers when the data is whole.
 *  An element, not a component: Recharts finds its axes among the chart's children by type. */
export const valueAxis = ({ yWidth, tick, allowDecimals, ticks }: Pick<SeriesSetup, 'yWidth' | 'tick' | 'allowDecimals' | 'ticks'>, hide: boolean, extra: Record<string, unknown> = {}) => (
  <YAxis {...AXIS} hide={hide} width={yWidth} tickFormatter={tick} allowDecimals={allowDecimals} {...ticks} {...extra} />
);

export const tooltipAndLegend = (full: (v: unknown, key?: unknown) => string, cursor: unknown, legend: boolean, labelFormat?: (v: unknown) => string) => [
  <Tooltip key="tip" cursor={cursor as never} content={<ChartTooltip format={full} labelFormat={labelFormat} />} />,
  legend ? <Legend key="legend" content={<LegendContent />} /> : null,
];

/** Highlight clicked point on a line or area chart: a line through the clicked category and a ringed dot on each series
 *  there (at its stacked height when the series stack). */
export const clickedMarks = (highlighted: unknown, xField: string | undefined, series: string[], fills: string[], stacked = false, yAxisId?: string): React.ReactElement[] => {
  const row = highlighted as Row | null;
  if (!row || !xField || row[xField] === undefined) return [];
  let base = 0;
  const dots = series.flatMap((s, i) => {
    const value = Number(row[s]);
    if (!Number.isFinite(value)) return [];
    const y = stacked ? (base += value) : value;
    return [<ReferenceDot key={`clicked-${s}`} {...(yAxisId ? { yAxisId } : {})} x={row[xField] as string} y={y} r={6} fill={fills[i]} stroke="var(--ui-bg)" strokeWidth={2} ifOverflow="extendDomain" />];
  });
  return [<ReferenceLine key="clicked-x" {...(yAxisId ? { yAxisId } : {})} x={row[xField] as string} stroke="var(--ui-muted-fg)" strokeDasharray="3 3" />, ...dots];
};

/** A unique SVG id per rendered chart (gradients), so charts in list rows do not share one. */
export const useSvgId = (prefix: string): string => `${prefix}-${React.useId().replace(/[^\w-]/g, '')}`;
