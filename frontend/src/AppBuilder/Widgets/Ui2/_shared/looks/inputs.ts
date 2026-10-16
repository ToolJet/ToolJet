// ToolJet UI 2.0: style variables and loading looks of the inputs widgets (see shadcnLook.ts and
// Shell's LOADING_LOOK). Style keys match WidgetManager/widgets/shad*.js.
import { px } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import type { LoadingMap, LookEntry, LookMap } from '@/AppBuilder/Widgets/Ui2/_shared/types';

const ACCENT = ['--sc-primary', '--sc-ring'];

// The text-box styles every pack field shares (ShadInput's).
const FIELD: LookEntry[] = [
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
// Lists opening from a field: shadcn's own popover, accent and selection tokens, overridden for the widget (the
// popover gets the same variables, as it renders in the pack's portal root).
const POPOVER: LookEntry[] = [
  ['popoverBackgroundColor', '--sc-popover'],
  ['popoverTextColor', '--sc-popover-foreground'],
  ['hoverColor', '--sc-accent'],
  ['selectedTextColor', '--sc-primary-foreground'],
];

export const LOOKS: LookMap = {
  ShadNumberInput: [
    ...FIELD,
    ['stepperBackgroundColor', '--lk-step-bg'],
    ['stepperIconColor', '--lk-step-fg'],
    ['stepperHoverColor', '--lk-step-hover'],
    ['affixColor', '--lk-affix'],
  ],
  ShadPasswordInput: [
    ...FIELD,
    ['iconColor', '--lk-icon'],
    ['weakColor', '--lk-weak'],
    ['fairColor', '--lk-fair'],
    ['strongColor', '--lk-strong'],
    ['meterTrackColor', '--lk-track'],
  ],
  ShadPhoneInput: [
    ...FIELD,
    ['countryBackgroundColor', '--lk-addon-bg'],
    ['countryTextColor', '--lk-addon-fg'],
    ...POPOVER,
  ],
  ShadCurrencyInput: [
    ...FIELD,
    ['affixColor', '--lk-affix'],
    ['currencyBackgroundColor', '--lk-addon-bg'],
    ['currencyTextColor', '--lk-addon-fg'],
    ...POPOVER,
  ],
  ShadOtpInput: [...FIELD, ['separatorColor', '--lk-sep'], ['slotSize', '--lk-slot', px]],
  ShadTimePicker: [...FIELD, ['iconColor', '--lk-icon'], ...POPOVER],
  ShadDateTimePicker: [...FIELD, ['iconColor', '--lk-icon'], ...POPOVER],
};

export const LOADING: LoadingMap = {
  ShadNumberInput: 'field',
  ShadPasswordInput: 'field',
  ShadPhoneInput: 'field',
  ShadCurrencyInput: 'field',
  ShadOtpInput: 'field',
  ShadTimePicker: 'field',
  ShadDateTimePicker: 'field',
};
