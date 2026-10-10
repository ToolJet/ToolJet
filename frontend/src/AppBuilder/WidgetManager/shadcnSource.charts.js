// shadcn/ui pack (experiment): the Line, Radar, Radial and Sparkline charts (Widgets/Shadcn/ShadCharts.jsx, logic in
// chartsModel.js). Same family as the Area, Bar and Pie charts in shadcnSource.js: data rows, a category field, one or
// many series fields, value prefix and suffix, legend, empty message, series colours, and the chart styles.
import { ARRAY, NUMBER_OR_STRING, STRING, choice, code, colorStyle, shadConfig, toggle } from './shadcnPackHelpers.js';

// Mirrors chartStyles in shadcnSource.js (kept in step by hand: each source module stays standalone).
const chartStyles = {
  chartColor: colorStyle('Chart color (series palette from it)'),
  gridColor: colorStyle('Grid line color'),
  axisTextColor: colorStyle('Axis label color'),
  legendTextColor: colorStyle('Legend text color'),
};
const SERIES_COLORS = code('Series colors (in order)', ARRAY, [], { placeholder: "['#0f766e', '#f59e0b']" });
const SERIES_FIELDS = { type: 'union', schemas: [{ type: 'string' }, { type: 'array' }] };
const OPTIONAL_NUMBER = NUMBER_OR_STRING;
const clickEvents = { onClick: { displayName: 'On click' } };

const common = {
  valuePrefix: code('Value prefix', STRING, ''),
  valueSuffix: code('Value suffix', STRING, ''),
  emptyText: code('Empty message', STRING, 'No data'),
  animate: toggle('Animate', true),
};
const commonDefaults = {
  valuePrefix: { value: '' },
  valueSuffix: { value: '' },
  emptyText: { value: 'No data' },
  animate: { value: '{{true}}' },
};

// ---- Line ----------------------------------------------------------------------------------------------------------

const LINE_DATA =
  "{{[{ month: 'Jan', revenue: 18600, expenses: 8000 }, { month: 'Feb', revenue: 30500, expenses: 20000 }, { month: 'Mar', revenue: 23700, expenses: 12000 }, { month: 'Apr', revenue: 7300, expenses: 19000 }, { month: 'May', revenue: 20900, expenses: 13000 }, { month: 'Jun', revenue: 21400, expenses: 14000 }]}}";

export const shadLineChartConfig = shadConfig({
  name: 'ShadLineChart',
  displayName: 'Line chart',
  description:
    "shadcn/ui line chart for trends: data [{ month: 'Jan', revenue: 18600, expenses: 8000 }], xField 'month', yFields 'revenue,expenses' (one line each); curve monotone/linear/step, dots, strokeWidth, dashedFields, an optional target line (referenceValue, referenceLabel) and yAxisFormat number/currency/percent/compact. Height 200-320 px; clicking a point sets clickedDatum and fires onClick.",
  defaultSize: { width: 20, height: 280 },
  properties: {
    data: code('Data', ARRAY, [], { placeholder: "[{ month: 'Jan', revenue: 18600, expenses: 8000 }]" }),
    xField: code('X field', STRING, 'month'),
    yFields: code('Series fields (one or many)', SERIES_FIELDS, 'revenue'),
    curve: choice('Curve', ['monotone', 'linear', 'step'], 'monotone'),
    showDots: toggle('Dots'),
    strokeWidth: code('Line width (px)', OPTIONAL_NUMBER, 2),
    dashedFields: code('Dashed series (fields)', SERIES_FIELDS, '', { placeholder: "'target' or ['forecast']" }),
    referenceValue: code('Target line value', OPTIONAL_NUMBER, '', { placeholder: '25000' }),
    referenceLabel: code('Target line label', STRING, ''),
    yAxisFormat: choice('Value format', ['number', 'currency', 'percent', 'compact'], 'number'),
    currency: code('Currency code', STRING, 'USD'),
    ...common,
    showGrid: toggle('Grid', true),
    showLegend: toggle('Legend'),
    colors: SERIES_COLORS,
  },
  defaults: {
    data: { value: LINE_DATA },
    xField: { value: 'month' },
    yFields: { value: "{{['revenue', 'expenses']}}" },
    curve: { value: 'monotone' },
    showDots: { value: '{{false}}' },
    strokeWidth: { value: '{{2}}' },
    dashedFields: { value: '' },
    referenceValue: { value: '' },
    referenceLabel: { value: '' },
    yAxisFormat: { value: 'currency' },
    currency: { value: 'USD' },
    ...commonDefaults,
    showGrid: { value: '{{true}}' },
    showLegend: { value: '{{true}}' },
    colors: { value: '{{[]}}' },
  },
  styles: { ...chartStyles, referenceLineColor: colorStyle('Target line color') },
  events: clickEvents,
  exposedVariables: { clickedDatum: {} },
});

// ---- Radar ---------------------------------------------------------------------------------------------------------

const RADAR_DATA =
  "{{[{ skill: 'Speed', alex: 86, jordan: 65 }, { skill: 'Quality', alex: 72, jordan: 90 }, { skill: 'Support', alex: 64, jordan: 78 }, { skill: 'Pricing', alex: 90, jordan: 58 }, { skill: 'Reach', alex: 58, jordan: 84 }, { skill: 'Design', alex: 75, jordan: 70 }]}}";

export const shadRadarChartConfig = shadConfig({
  name: 'ShadRadarChart',
  displayName: 'Radar chart',
  description:
    "shadcn/ui radar (spider) chart comparing scores across categories: data [{ skill: 'Speed', alex: 86, jordan: 65 }], categoryField 'skill' (one spoke per row), yFields 'alex,jordan' (one filled polygon each); fillOpacity, gridShape polygon/circle, dots, legend, maxValue (blank = auto). Best square, 240-320 px; clicking sets clickedDatum and fires onClick.",
  defaultSize: { width: 12, height: 300 },
  properties: {
    data: code('Data', ARRAY, [], { placeholder: "[{ skill: 'Speed', alex: 86, jordan: 65 }]" }),
    categoryField: code('Category field', STRING, 'skill'),
    yFields: code('Series fields (one or many)', SERIES_FIELDS, 'alex'),
    maxValue: code('Max value (blank = auto)', OPTIONAL_NUMBER, '', { placeholder: '100' }),
    fillOpacity: code('Fill opacity (0 to 1)', OPTIONAL_NUMBER, 0.5),
    gridShape: choice('Grid shape', ['polygon', 'circle'], 'polygon'),
    showGrid: toggle('Grid', true),
    showDots: toggle('Dots'),
    ...common,
    showLegend: toggle('Legend', true),
    colors: SERIES_COLORS,
  },
  defaults: {
    data: { value: RADAR_DATA },
    categoryField: { value: 'skill' },
    yFields: { value: "{{['alex', 'jordan']}}" },
    maxValue: { value: '{{100}}' },
    fillOpacity: { value: '{{0.5}}' },
    gridShape: { value: 'polygon' },
    showGrid: { value: '{{true}}' },
    showDots: { value: '{{false}}' },
    ...commonDefaults,
    showLegend: { value: '{{true}}' },
    colors: { value: '{{[]}}' },
  },
  styles: chartStyles,
  events: clickEvents,
  exposedVariables: { clickedDatum: {} },
});

// ---- Radial --------------------------------------------------------------------------------------------------------

const RADIAL_DATA =
  "{{[{ channel: 'Direct', visitors: 275 }, { channel: 'Search', visitors: 200 }, { channel: 'Social', visitors: 187 }, { channel: 'Email', visitors: 120 }]}}";

export const shadRadialChartConfig = shadConfig({
  name: 'ShadRadialChart',
  displayName: 'Radial chart',
  description:
    "shadcn/ui radial bar chart. Mode 'progress': one value against maxValue as a ring with a large centre figure (centerValue, blank = the value) and centerLabel. Mode 'categories': concentric bars from data [{ channel: 'Direct', visitors: 275 }] with categoryField and valueField, a row's fill or color wins. startAngle/endAngle in degrees (90/-270 full ring, 180/0 semicircle gauge); thickness in px. Ring 160-240 px square, gauge about twice as wide as tall.",
  defaultSize: { width: 10, height: 220 },
  properties: {
    mode: choice('Mode', ['progress', 'categories'], 'progress', {
      progress: 'Single value',
      categories: 'Categories',
    }),
    value: code('Value', OPTIONAL_NUMBER, 72),
    maxValue: code('Max value', OPTIONAL_NUMBER, 100),
    data: code('Data (categories mode)', ARRAY, [], { placeholder: "[{ channel: 'Direct', visitors: 275 }]" }),
    categoryField: code('Category field', STRING, 'channel'),
    valueField: code('Value field', STRING, 'visitors'),
    centerValue: code('Center figure (blank = the value)', STRING, ''),
    centerLabel: code('Center caption', STRING, ''),
    startAngle: code('Start angle', OPTIONAL_NUMBER, 90),
    endAngle: code('End angle', OPTIONAL_NUMBER, -270),
    thickness: code('Ring thickness (px, blank = auto)', OPTIONAL_NUMBER, ''),
    rounded: toggle('Rounded ends', true),
    showTrack: toggle('Track', true),
    ...common,
    showLegend: toggle('Legend (categories mode)', true),
    colors: SERIES_COLORS,
  },
  defaults: {
    mode: { value: 'progress' },
    value: { value: '{{72}}' },
    maxValue: { value: '{{100}}' },
    data: { value: RADIAL_DATA },
    categoryField: { value: 'channel' },
    valueField: { value: 'visitors' },
    centerValue: { value: '' },
    centerLabel: { value: 'Completed' },
    startAngle: { value: '{{90}}' },
    endAngle: { value: '{{-270}}' },
    thickness: { value: '' },
    rounded: { value: '{{true}}' },
    showTrack: { value: '{{true}}' },
    ...commonDefaults,
    valueSuffix: { value: '%' },
    showLegend: { value: '{{true}}' },
    colors: { value: '{{[]}}' },
  },
  styles: {
    chartColor: chartStyles.chartColor,
    trackColor: colorStyle('Track color'),
    legendTextColor: chartStyles.legendTextColor,
    centerValueColor: colorStyle('Center figure color'),
    centerLabelColor: colorStyle('Center caption color'),
  },
  events: clickEvents,
  exposedVariables: { clickedDatum: {} },
});

// ---- Sparkline -----------------------------------------------------------------------------------------------------

export const shadSparklineConfig = shadConfig({
  name: 'ShadSparkline',
  displayName: 'Sparkline',
  description:
    "Tiny shadcn/ui line or area trend for KPI cards, no axes or grid: data [12, 18, 15, 22] or [{ x: 'Mon', y: 12 }]; type line/area, curve, end dot, colorByTrend (last vs first value, positiveColor/negativeColor styles; lowerIsBetter flips it), optional min/max band. Height 24-64 px (40 typical), placed under a Stat; exposes trend ('up' | 'down' | 'flat') and lastValue.",
  defaultSize: { width: 8, height: 40 },
  properties: {
    data: code('Data', ARRAY, [], { placeholder: "[12, 18, 15, 22] or [{ x: 'Mon', y: 12 }]" }),
    type: choice('Type', ['line', 'area'], 'area'),
    curve: choice('Curve', ['monotone', 'linear', 'step'], 'monotone'),
    strokeWidth: code('Line width (px)', OPTIONAL_NUMBER, 2),
    showEndDot: toggle('End dot', true),
    colorByTrend: toggle('Color by trend'),
    lowerIsBetter: toggle('Lower is better'),
    showBand: toggle('Min/max band'),
    bandMin: code('Band from (blank = data min)', OPTIONAL_NUMBER, ''),
    bandMax: code('Band to (blank = data max)', OPTIONAL_NUMBER, ''),
    showTooltip: toggle('Tooltip'),
    valuePrefix: common.valuePrefix,
    valueSuffix: common.valueSuffix,
    emptyText: common.emptyText,
    animate: common.animate,
  },
  defaults: {
    data: { value: '{{[12, 18, 15, 22, 19, 26, 24, 31]}}' },
    type: { value: 'area' },
    curve: { value: 'monotone' },
    strokeWidth: { value: '{{2}}' },
    showEndDot: { value: '{{true}}' },
    colorByTrend: { value: '{{false}}' },
    lowerIsBetter: { value: '{{false}}' },
    showBand: { value: '{{false}}' },
    bandMin: { value: '' },
    bandMax: { value: '' },
    showTooltip: { value: '{{false}}' },
    ...commonDefaults,
  },
  styles: {
    chartColor: colorStyle('Line color'),
    positiveColor: colorStyle('Color when trend is up'),
    negativeColor: colorStyle('Color when trend is down'),
    bandColor: colorStyle('Band color'),
  },
  events: clickEvents,
  exposedVariables: { trend: 'flat', lastValue: null },
});
