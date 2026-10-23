// ToolJet UI 2.0: style variables and loading looks of the inputs widgets (see shadcnLook.ts and
// Shell's LOADING_LOOK). Style keys match WidgetManager/widgets/shad*.js.
import type { LoadingMap, LookEntry, LookMap } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { px } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { FIELD } from '@/AppBuilder/Widgets/Ui2/_shared/looks/entries';

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
