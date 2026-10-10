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
    seriesLabels: code(
      'Series labels ({ field: label })',
      { type: 'object' },
      {},
      { placeholder: "{ food_cost_pct: 'Food cost', target_pct: 'Target' }" }
    ),
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
    seriesLabels: { value: '{{{} }}' },
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
    seriesLabels: code(
      'Series labels ({ field: label })',
      { type: 'object' },
      {},
      { placeholder: "{ food_cost_pct: 'Food cost', target_pct: 'Target' }" }
    ),
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
    seriesLabels: { value: '{{{} }}' },
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

// ---- Combo ---------------------------------------------------------------------------------------------------------

const COMBO_DATA =
  "{{[{ month: 'Jan', revenue: 42000, orders: 310, margin: 31 }, { month: 'Feb', revenue: 47500, orders: 342, margin: 33 }, { month: 'Mar', revenue: 45200, orders: 328, margin: 29 }, { month: 'Apr', revenue: 52800, orders: 371, margin: 34 }, { month: 'May', revenue: 58100, orders: 402, margin: 36 }, { month: 'Jun', revenue: 61400, orders: 425, margin: 35 }]}}";

export const shadComboChartConfig = shadConfig({
  name: 'ShadComboChart',
  displayName: 'Combo chart',
  description:
    "shadcn/ui bar and line chart on one axis pair: data [{ month: 'Jan', revenue: 42000, margin: 31 }], xField 'month', barFields 'revenue' (bars), lineFields 'margin' (lines), rightAxisFields 'margin' (those series on a second, right axis with its own rightAxisFormat, e.g. percent); stackBars, curve, dots, yAxisFormat number/currency/percent/compact. Height 240-340 px; clicking sets clickedDatum and fires onClick.",
  defaultSize: { width: 20, height: 300 },
  properties: {
    data: code('Data', ARRAY, [], { placeholder: "[{ month: 'Jan', revenue: 42000, margin: 31 }]" }),
    xField: code('X field', STRING, 'month'),
    barFields: code('Bar series (fields)', SERIES_FIELDS, 'revenue'),
    lineFields: code('Line series (fields)', SERIES_FIELDS, 'margin'),
    rightAxisFields: code('Right axis series (fields)', SERIES_FIELDS, '', { placeholder: "'margin'" }),
    stackBars: toggle('Stack bars'),
    curve: choice('Line curve', ['monotone', 'linear', 'step'], 'monotone'),
    showDots: toggle('Line dots', true),
    strokeWidth: code('Line width (px)', OPTIONAL_NUMBER, 2),
    yAxisFormat: choice('Value format', ['number', 'currency', 'percent', 'compact'], 'number'),
    rightAxisFormat: choice('Right axis format', ['number', 'currency', 'percent', 'compact'], 'percent'),
    currency: code('Currency code', STRING, 'USD'),
    ...common,
    showGrid: toggle('Grid', true),
    showLegend: toggle('Legend', true),
    seriesLabels: code(
      'Series labels ({ field: label })',
      { type: 'object' },
      {},
      { placeholder: "{ revenue: 'Revenue', margin: 'Margin %' }" }
    ),
    colors: SERIES_COLORS,
  },
  defaults: {
    data: { value: COMBO_DATA },
    xField: { value: 'month' },
    barFields: { value: "{{['revenue']}}" },
    lineFields: { value: "{{['margin']}}" },
    rightAxisFields: { value: "{{['margin']}}" },
    stackBars: { value: '{{false}}' },
    curve: { value: 'monotone' },
    showDots: { value: '{{true}}' },
    strokeWidth: { value: '{{2}}' },
    yAxisFormat: { value: 'currency' },
    rightAxisFormat: { value: 'percent' },
    currency: { value: 'USD' },
    ...commonDefaults,
    showGrid: { value: '{{true}}' },
    showLegend: { value: '{{true}}' },
    seriesLabels: { value: "{{{ revenue: 'Revenue', margin: 'Margin' }}}" },
    colors: { value: '{{[]}}' },
  },
  styles: chartStyles,
  events: clickEvents,
  exposedVariables: { clickedDatum: {} },
});

// ---- Scatter -------------------------------------------------------------------------------------------------------

const SCATTER_DATA =
  "{{[{ account: 'Northwind', spend: 12, revenue: 48, seats: 40, segment: 'Mid-market' }, { account: 'Globex', spend: 30, revenue: 95, seats: 120, segment: 'Enterprise' }, { account: 'Initech', spend: 8, revenue: 21, seats: 15, segment: 'SMB' }, { account: 'Umbrella', spend: 26, revenue: 61, seats: 90, segment: 'Enterprise' }, { account: 'Hooli', spend: 18, revenue: 70, seats: 55, segment: 'Mid-market' }, { account: 'Vandelay', spend: 5, revenue: 14, seats: 10, segment: 'SMB' }, { account: 'Stark', spend: 34, revenue: 128, seats: 150, segment: 'Enterprise' }, { account: 'Wonka', spend: 14, revenue: 33, seats: 30, segment: 'SMB' }]}}";

export const shadScatterChartConfig = shadConfig({
  name: 'ShadScatterChart',
  displayName: 'Scatter chart',
  description:
    "shadcn/ui scatter or bubble chart relating two measures: data [{ account: 'Globex', spend: 30, revenue: 95, seats: 120, segment: 'Enterprise' }], xField 'spend', yField 'revenue', optional sizeField (bubbles), groupField (one colour and legend entry per value), nameField (tooltip title), xLabel/yLabel axis titles, referenceX/referenceY dashed quadrant lines, x and y formats. Height 260-360 px; clicking a point sets clickedDatum to its row and fires onClick.",
  defaultSize: { width: 16, height: 320 },
  properties: {
    data: code('Data', ARRAY, [], { placeholder: "[{ account: 'Globex', spend: 30, revenue: 95 }]" }),
    xField: code('X field', STRING, 'spend'),
    yField: code('Y field', STRING, 'revenue'),
    sizeField: code('Size field (bubbles)', STRING, '', { placeholder: 'seats' }),
    groupField: code('Group field (one colour each)', STRING, '', { placeholder: 'segment' }),
    nameField: code('Name field (tooltip title)', STRING, '', { placeholder: 'account' }),
    xLabel: code('X axis title', STRING, ''),
    yLabel: code('Y axis title', STRING, ''),
    xAxisFormat: choice('X format', ['number', 'currency', 'percent', 'compact'], 'number'),
    yAxisFormat: choice('Y format', ['number', 'currency', 'percent', 'compact'], 'number'),
    currency: code('Currency code', STRING, 'USD'),
    referenceX: code('Vertical line at x', OPTIONAL_NUMBER, '', { placeholder: '20' }),
    referenceY: code('Horizontal line at y', OPTIONAL_NUMBER, '', { placeholder: '60' }),
    pointSize: code('Point size (px)', OPTIONAL_NUMBER, 6),
    fillOpacity: code('Fill opacity (0 to 1)', OPTIONAL_NUMBER, '', { placeholder: '0.7' }),
    ...common,
    showGrid: toggle('Grid', true),
    showLegend: toggle('Legend', true),
    colors: SERIES_COLORS,
  },
  defaults: {
    data: { value: SCATTER_DATA },
    xField: { value: 'spend' },
    yField: { value: 'revenue' },
    sizeField: { value: 'seats' },
    groupField: { value: 'segment' },
    nameField: { value: 'account' },
    xLabel: { value: 'Marketing spend ($k)' },
    yLabel: { value: 'Revenue ($k)' },
    xAxisFormat: { value: 'number' },
    yAxisFormat: { value: 'number' },
    currency: { value: 'USD' },
    referenceX: { value: '' },
    referenceY: { value: '' },
    pointSize: { value: '{{6}}' },
    fillOpacity: { value: '' },
    ...commonDefaults,
    showGrid: { value: '{{true}}' },
    showLegend: { value: '{{true}}' },
    colors: { value: '{{[]}}' },
  },
  styles: { ...chartStyles, referenceLineColor: colorStyle('Reference line color') },
  events: clickEvents,
  exposedVariables: { clickedDatum: {} },
});

// ---- Funnel --------------------------------------------------------------------------------------------------------

const FUNNEL_DATA =
  "{{[{ stage: 'Visited', count: 12480 }, { stage: 'Signed up', count: 3920 }, { stage: 'Activated', count: 2210 }, { stage: 'Trial', count: 1180 }, { stage: 'Paid', count: 412 }]}}";

export const shadFunnelChartConfig = shadConfig({
  name: 'ShadFunnelChart',
  displayName: 'Funnel chart',
  description:
    "shadcn/ui funnel of stages in order: data [{ stage: 'Visited', count: 12480 }, { stage: 'Paid', count: 412 }], stageField 'stage', valueField 'count'; one bar per stage sized to the widest, its value, and its conversion % from the stage before (conversionBase 'previous') or from the first ('first'); align center/left, colorByStage (palette per stage, else one colour fading down), yAxisFormat for values. About 44 px per stage; clicking a stage sets clickedDatum to its row and fires onClick.",
  defaultSize: { width: 16, height: 240 },
  properties: {
    data: code('Data', ARRAY, [], { placeholder: "[{ stage: 'Visited', count: 12480 }]" }),
    stageField: code('Stage field', STRING, 'stage'),
    valueField: code('Value field', STRING, 'count'),
    showConversion: toggle('Conversion %', true),
    conversionBase: choice('Conversion from', ['previous', 'first'], 'previous'),
    align: choice('Bar alignment', ['center', 'left'], 'center'),
    colorByStage: toggle('Colour per stage'),
    yAxisFormat: choice('Value format', ['number', 'currency', 'percent', 'compact'], 'number'),
    currency: code('Currency code', STRING, 'USD'),
    ...common,
    colors: SERIES_COLORS,
  },
  defaults: {
    data: { value: FUNNEL_DATA },
    stageField: { value: 'stage' },
    valueField: { value: 'count' },
    showConversion: { value: '{{true}}' },
    conversionBase: { value: 'previous' },
    align: { value: 'center' },
    colorByStage: { value: '{{false}}' },
    yAxisFormat: { value: 'number' },
    currency: { value: 'USD' },
    ...commonDefaults,
    colors: { value: '{{[]}}' },
  },
  styles: {
    chartColor: colorStyle('Chart color (series palette from it)'),
    axisTextColor: colorStyle('Stage label color'),
  },
  events: clickEvents,
  exposedVariables: { clickedDatum: {} },
});
