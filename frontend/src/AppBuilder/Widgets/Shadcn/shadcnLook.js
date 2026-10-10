// shadcn/ui pack (experiment): every pack widget's styles as CSS variables, set on the widget's root (Shell) and read
// by its classes with the app theme as the fallback, e.g. `text-[color:var(--lk-label,var(--sc-foreground))]`. The
// pack's utilities are !important, so inline colours would lose to them; variables do not. Accent-like styles override
// shadcn's own tokens for the widget (`--sc-primary`, `--sc-ring`, `--sc-chart-1`), so everything drawn in them
// (checked states, focus rings, the progress bar, the chart palette) follows at once. Kanban keeps its own module
// (kanbanLook.js). Style keys match the configs in WidgetManager/shadcnSource.js.
import { isSet, px } from './kanbanLook';
import { GROUP_LOOKS } from './looks';
import { fontStack, fontWeight, textCase } from './typeLook';

const ACCENT = ['--sc-primary', '--sc-ring'];

// Form controls with a box: label, control, help text.
const FIELD = [
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
// Controls beside a label: checkbox, switch, radio group.
const CHOICE = [
  ['accentColor', ACCENT],
  ['labelColor', '--lk-label'],
  ['helpTextColor', '--lk-help'],
];
// Typeface styles of the text widgets (typeLook.js); shadcn.scss classes read these variables.
const TYPE = [
  ['fontFamily', '--lk-font', fontStack],
  ['fontWeight', '--lk-weight', fontWeight],
  ['letterSpacing', '--lk-tracking', px],
  ['textTransform', '--lk-case', textCase],
  ['fontSize', '--lk-size', px],
];
const CHART = [
  ['chartColor', '--sc-chart-1'],
  ['gridColor', '--lk-grid'],
  ['axisTextColor', '--lk-axis'],
  ['legendTextColor', '--lk-legend'],
];

/** Style key -> CSS variable(s) (and how to write the value) for each pack widget. */
export const LOOKS = {
  ShadButton: [
    ['backgroundColor', '--lk-bg'],
    ['hoverBackgroundColor', '--lk-hover'],
    ['textColor', '--lk-fg'],
    ['borderColor', '--lk-border'],
    ['borderRadius', '--lk-radius', px],
  ],
  ShadAlert: [
    ['backgroundColor', '--lk-bg'],
    ['borderColor', '--lk-border'],
    ['titleColor', '--lk-title'],
    ['textColor', '--lk-fg'],
    ['borderRadius', '--lk-radius', px],
  ],
  ShadBreadcrumb: [
    ['textColor', '--lk-fg'],
    ['currentColor', '--lk-current'],
    ['separatorColor', '--lk-sep'],
  ],
  ShadHeading: [['textColor', '--lk-fg'], ...TYPE],
  ShadText: [['textColor', '--lk-fg'], ...TYPE],
  ShadTable: [
    ['accentColor', ACCENT],
    ['mutedTextColor', '--lk-muted'],
    ['stripedRowColor', '--lk-striped'],
    ['backgroundColor', '--lk-bg'],
    ['headerBackgroundColor', '--lk-head-bg'],
    ['headerTextColor', '--lk-head-fg'],
    ['textColor', '--lk-fg'],
    ['borderColor', '--lk-border'],
    ['rowHoverColor', '--lk-hover'],
    ['selectedRowColor', '--lk-selected'],
    ['borderRadius', '--lk-radius', px],
  ],
  ShadStat: [
    ['backgroundColor', '--lk-bg'],
    ['borderColor', '--lk-border'],
    ['labelColor', '--lk-label'],
    ['valueColor', '--lk-value'],
    ['footnoteColor', '--lk-help'],
    ['borderRadius', '--lk-radius', px],
    ['valueFontFamily', '--lk-value-font', fontStack],
    ['labelTextTransform', '--lk-label-case', textCase],
    ['labelLetterSpacing', '--lk-label-tracking', px],
  ],
  ShadBadge: [
    ['backgroundColor', '--lk-bg'],
    ['textColor', '--lk-fg'],
    ['borderColor', '--lk-border'],
    ['borderRadius', '--lk-radius', px],
  ],
  ShadAvatar: [
    ['backgroundColor', '--lk-bg'],
    ['textColor', '--lk-fg'],
    ['ringColor', '--lk-ring'],
  ],
  ShadProgress: [
    ['barColor', '--sc-primary'],
    ['trackColor', '--lk-track'],
    ['labelColor', '--lk-label'],
    ['valueColor', '--lk-help'],
    ['barHeight', '--lk-height', px],
  ],
  ShadSeparator: [
    ['lineColor', '--lk-line'],
    ['thickness', '--lk-thick', px],
  ],
  ShadSkeleton: [['placeholderColor', '--lk-bg']],
  ShadAccordion: [
    ['titleColor', '--lk-title'],
    ['textColor', '--lk-fg'],
    ['dividerColor', '--lk-border'],
    ['iconColor', '--lk-icon'],
  ],
  ShadEmpty: [
    ['backgroundColor', '--lk-bg'],
    ['borderColor', '--lk-border'],
    ['iconBackgroundColor', '--lk-icon-bg'],
    ['iconColor', '--lk-icon'],
    ['titleColor', '--lk-title'],
    ['textColor', '--lk-fg'],
    ['borderRadius', '--lk-radius', px],
  ],
  ShadInput: FIELD,
  ShadTextarea: FIELD,
  ShadSelect: FIELD,
  ShadDatePicker: FIELD,
  ShadCheckbox: [...CHOICE, ['borderColor', '--lk-border'], ['errorColor', '--lk-error']],
  ShadSwitch: [...CHOICE, ['offColor', '--lk-off']],
  ShadRadioGroup: [...CHOICE, ['optionTextColor', '--lk-fg'], ['errorColor', '--lk-error']],
  ShadSlider: [...CHOICE, ['trackColor', '--lk-track']],
  ShadToggleGroup: [
    ['backgroundColor', '--lk-bg'],
    ['textColor', '--lk-fg'],
    ['selectedBackgroundColor', '--lk-on-bg'],
    ['selectedTextColor', '--lk-on-fg'],
    ['borderRadius', '--lk-radius', px],
  ],
  ShadAreaChart: CHART,
  ShadBarChart: [...CHART, ['highlightColor', '--lk-highlight'], ['mutedColor', '--lk-muted-bar']],
  ShadPieChart: [
    ...CHART.filter(([key]) => key !== 'gridColor' && key !== 'axisTextColor'),
    ['sliceBorderColor', '--lk-slice-border'],
    ['centerValueColor', '--lk-center-value'],
    ['centerLabelColor', '--lk-center-label'],
  ],
  // The widget groups with their own modules (looks/).
  ...GROUP_LOOKS,
};

/** The CSS variables for a widget's set styles; unset styles add nothing, so the theme's values apply. */
export const lookVars = (componentType, styles = {}) =>
  Object.fromEntries(
    (LOOKS[componentType] || [])
      .filter(([key]) => isSet(styles?.[key]))
      .flatMap(([key, names, toCss = String]) => [].concat(names).map((name) => [name, toCss(styles[key])]))
      // A style whose value resolves to nothing (the theme font, an unknown casing) leaves the theme's value.
      .filter(([, value]) => value !== '')
  );

/** The series colour at `index`: the author's list where it names one, else the theme palette (--sc-chart-1..5,
 *  derived from the Chart color style when set). */
export const seriesColor = (colors, index) => {
  const own = Array.isArray(colors) ? colors[index] : undefined;
  return isSet(own) ? String(own) : `var(--sc-chart-${(index % 5) + 1})`;
};

/** Classes that apply only when the author set the style: for widgets whose variants each have their own colours,
 *  where one theme fallback cannot stand in for all of them. */
export const whenSet = (styles, key, classes) => (isSet(styles?.[key]) ? classes : undefined);
