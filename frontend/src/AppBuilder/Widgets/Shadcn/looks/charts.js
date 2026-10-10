// shadcn/ui pack (experiment): style variables and loading looks of the Line, Radar, Radial and Sparkline charts
// (see shadcnLook.js and Shell's LOADING_LOOK). Chart color overrides --sc-chart-1, from which the theme derives the
// rest of the series palette (--sc-chart-2..5), so every series follows it.

const CHART = [
  ['chartColor', '--sc-chart-1'],
  ['gridColor', '--lk-grid'],
  ['axisTextColor', '--lk-axis'],
  ['legendTextColor', '--lk-legend'],
];

export const LOOKS = {
  ShadLineChart: [...CHART, ['referenceLineColor', '--lk-ref']],
  ShadRadarChart: CHART,
  ShadComboChart: CHART,
  ShadScatterChart: [...CHART, ['referenceLineColor', '--lk-ref']],
  ShadHeatmapChart: [
    ['chartColor', '--sc-chart-1'],
    ['axisTextColor', '--lk-axis'],
    ['legendTextColor', '--lk-legend'],
  ],
  ShadFunnelChart: [
    ['chartColor', '--sc-chart-1'],
    ['axisTextColor', '--lk-axis'],
  ],
  ShadRadialChart: [
    ['chartColor', '--sc-chart-1'],
    ['trackColor', '--lk-track'],
    ['legendTextColor', '--lk-legend'],
    ['centerValueColor', '--lk-center-value'],
    ['centerLabelColor', '--lk-center-label'],
  ],
  ShadSparkline: [
    ['chartColor', '--sc-chart-1'],
    ['positiveColor', '--lk-up'],
    ['negativeColor', '--lk-down'],
    ['bandColor', '--lk-band'],
  ],
};

// A skeleton block at the widget's size.
export const LOADING = {
  ShadLineChart: 'block',
  ShadRadarChart: 'block',
  ShadComboChart: 'block',
  ShadScatterChart: 'block',
  ShadFunnelChart: 'block',
  ShadHeatmapChart: 'block',
  ShadRadialChart: 'block',
  ShadSparkline: 'block',
};
