// shadcn/ui pack (experiment): style variables and loading looks of the pickers widgets (see shadcnLook.js and
// Shell's LOADING_LOOK). Style keys match WidgetManager/shadcnSource.pickers.js.
import { px } from '../kanbanLook';

const ACCENT = ['--sc-primary', '--sc-ring'];

// A form control's box: label, control, help text (the same variables as the pack's other fields).
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
// The options menu (it opens in the pack's portal root and takes the widget's variables itself).
const MENU = [
  ['menuBackgroundColor', '--lk-menu-bg'],
  ['menuTextColor', '--lk-menu-fg'],
  ['optionHoverColor', '--lk-hl'],
];
const CHIP = [
  ['chipBackgroundColor', '--lk-chip-bg'],
  ['chipTextColor', '--lk-chip-fg'],
];

export const LOOKS = {
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

export const LOADING = {
  ShadCombobox: 'field',
  ShadMultiselect: 'field',
  ShadTagsInput: 'field',
  ShadColorPicker: 'field',
  ShadRating: 'inline',
  ShadFileUpload: 'own',
};
