// ToolJet UI 2.0: style variables and loading looks of the pickers widgets (see shadcnLook.ts and
// Shell's LOADING_LOOK). Style keys match WidgetManager/widgets/shad*.js.
import type { LoadingMap, LookEntry, LookMap } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { px } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { ACCENT, FIELD } from '@/AppBuilder/Widgets/Ui2/_shared/looks/entries';

// The options menu (it opens in the pack's portal root and takes the widget's variables itself).
const MENU: LookEntry[] = [
  ['menuBackgroundColor', '--lk-menu-bg'],
  ['menuTextColor', '--lk-menu-fg'],
  ['optionHoverColor', '--lk-hl'],
];
const CHIP: LookEntry[] = [
  ['chipBackgroundColor', '--lk-chip-bg'],
  ['chipTextColor', '--lk-chip-fg'],
];

export const LOOKS: LookMap = {
  ShadCombobox: [...FIELD, ...MENU],
  ShadMultiselect: [...FIELD, ...CHIP, ...MENU],
  ShadTagsInput: [...FIELD, ...CHIP, ...MENU],
  ShadColorPicker: [...FIELD.filter(([key]) => key !== 'errorColor'), ['menuBackgroundColor', '--lk-menu-bg']],
  ShadRating: [
    ['filledColor', '--lk-on'],
    ['emptyColor', '--lk-off'],
    ['valueTextColor', '--lk-value'],
    ['labelColor', '--lk-label'],
    ['helpTextColor', '--lk-help'],
    ['accentColor', ['--sc-ring']],
    ['errorColor', '--lk-error'],
  ],
  ShadFileUpload: [
    ['labelColor', '--lk-label'],
    ['helpTextColor', '--lk-help'],
    ['dropzoneBackgroundColor', '--lk-drop-bg'],
    ['dropzoneBorderColor', '--lk-drop-border'],
    ['iconColor', '--lk-icon'],
    ['iconBackgroundColor', '--lk-icon-bg'],
    ['titleColor', '--lk-title'],
    ['hintColor', '--lk-hint'],
    ['accentColor', ACCENT],
    ['fileItemBackgroundColor', '--lk-item-bg'],
    ['fileItemBorderColor', '--lk-item-border'],
    ['errorColor', '--lk-error'],
    ['borderRadius', '--lk-radius', px],
  ],
};

export const LOADING: LoadingMap = {
  ShadCombobox: 'field',
  ShadMultiselect: 'field',
  ShadTagsInput: 'field',
  ShadColorPicker: 'field',
  ShadRating: 'inline',
  ShadFileUpload: 'own',
};
