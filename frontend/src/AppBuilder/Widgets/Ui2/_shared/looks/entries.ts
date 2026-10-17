// ToolJet UI 2.0: the style-to-variable entries several widget groups share (shadcnLook.ts and the group modules).
import type { LookEntry } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { px } from '@/AppBuilder/Widgets/Ui2/_shared/values';

/** Accent styles override shadcn's primary and ring tokens for the widget. */
export const ACCENT = ['--sc-primary', '--sc-ring'];

/** A form control's box: label, control, help text. */
export const FIELD: LookEntry[] = [
  ['labelColor', '--lk-label'],
  ['helpTextColor', '--lk-help'],
  ['backgroundColor', '--lk-bg'],
  ['textColor', '--lk-fg'],
  ['placeholderColor', '--lk-placeholder'],
  ['borderColor', '--lk-border'],
  ['accentColor', ACCENT],
  ['errorColor', '--lk-error'],
  ['borderRadius', '--lk-radius', px],
];

/** A cartesian chart's colours; chartColor overrides --sc-chart-1, from which the theme derives the series palette. */
export const CHART: LookEntry[] = [
  ['chartColor', '--sc-chart-1'],
  ['gridColor', '--lk-grid'],
  ['axisTextColor', '--lk-axis'],
  ['legendTextColor', '--lk-legend'],
];
