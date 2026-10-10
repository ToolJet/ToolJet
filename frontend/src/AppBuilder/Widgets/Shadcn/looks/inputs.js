// shadcn/ui pack (experiment): style variables and loading looks of the inputs widgets (see shadcnLook.js and
// Shell's LOADING_LOOK). Style keys match WidgetManager/shadcnSource.inputs.js.
import { px } from '../kanbanLook';

const ACCENT = ['--sc-primary', '--sc-ring'];

// The text-box styles every pack field shares (ShadInput's).
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
// Lists opening from a field: shadcn's own popover, accent and selection tokens, overridden for the widget (the
// popover gets the same variables, as it renders in the pack's portal root).
const POPOVER = [
  ['popoverBackgroundColor', '--sc-popover'],
  ['popoverTextColor', '--sc-popover-foreground'],
  ['hoverColor', '--sc-accent'],
  ['selectedTextColor', '--sc-primary-foreground'],
];

export const LOOKS = {
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

export const LOADING = {
  ShadNumberInput: 'field',
  ShadPasswordInput: 'field',
  ShadPhoneInput: 'field',
  ShadCurrencyInput: 'field',
  ShadOtpInput: 'field',
  ShadTimePicker: 'field',
  ShadDateTimePicker: 'field',
};
