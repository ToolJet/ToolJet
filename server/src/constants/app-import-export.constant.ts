/**
 * Component-type tables used when importing, exporting or cloning an app.
 *
 * These drive migrateProperties() in
 * src/modules/apps/services/app-import-export.service.ts, which reshapes a component's
 * properties/styles/general buckets to match the current widget config. Add new tables here
 * rather than inline in the service.
 */

export type DefaultDataSourceName =
  | 'restapidefault'
  | 'runjsdefault'
  | 'runpydefault'
  | 'tooljetdbdefault'
  | 'workflowsdefault';

export type PartialRevampedComponent = 'CodeEditor' | 'PDF' | 'Calendar' | 'CustomComponent' | 'RadioButtonV2';

export type NewRevampedComponent =
  | 'Text'
  | 'TextInput'
  | 'PasswordInput'
  | 'NumberInput'
  | 'EmailInput'
  | 'DropdownV2'
  | 'Table'
  | 'Button'
  | 'Cascader'
  | 'Checkbox'
  | 'Divider'
  | 'VerticalDivider'
  | 'Link'
  | 'Datepicker'
  | 'DatePickerV2'
  | 'TimePicker'
  | 'DatetimePickerV2'
  | 'DaterangePicker'
  | 'TextArea'
  | 'Container'
  | 'FlexContainer'
  | 'Tabs'
  | 'Form'
  | 'Image'
  | 'FilePicker'
  | 'Icon'
  | 'Steps'
  | 'Statistics'
  | 'StarRating'
  | 'Tags'
  | 'CircularProgressBar'
  | 'Html'
  | 'Chat'
  | 'CurrencyInput'
  | 'PhoneInput'
  | 'IFrame'
  | 'DropdownV2'
  | 'TreeSelect'
  | 'Listview'
  | 'ColorPicker'
  | 'ButtonGroupV2'
  | 'ModalV2'
  | 'PopoverMenu'
  | 'Pagination'
  | 'Timeline'
  | 'Kanban'
  | 'PDF'
  | 'CustomComponent'
  | 'BoundedBox'
  | 'QrScanner'
  | 'Calendar';

export const DefaultDataSourceNames: DefaultDataSourceName[] = [
  'restapidefault',
  'runjsdefault',
  'runpydefault',
  'tooljetdbdefault',
  'workflowsdefault',
];

export const NewRevampedComponents: NewRevampedComponent[] = [
  'Text',
  'TextInput',
  'PasswordInput',
  'NumberInput',
  'EmailInput',
  'DropdownV2',
  'Table',
  'Checkbox',
  'Button',
  'Cascader',
  'Divider',
  'VerticalDivider',
  'Link',
  'Datepicker',
  'DatePickerV2',
  'TimePicker',
  'DatetimePickerV2',
  'DaterangePicker',
  'TextArea',
  'Container',
  'FlexContainer',
  'Tabs',
  'Form',
  'Image',
  'FilePicker',
  'Icon',
  'Steps',
  'Statistics',
  'StarRating',
  'Tags',
  'CircularProgressBar',
  'Html',
  'Chat',
  'CurrencyInput',
  'PhoneInput',
  'IFrame',
  'DropdownV2',
  'TreeSelect',
  'Listview',
  'ColorPicker',
  'ButtonGroupV2',
  'ModalV2',
  'PopoverMenu',
  'Pagination',
  'Timeline',
  'Kanban',
  'PDF',
  'CustomComponent',
  'BoundedBox',
  'QrScanner',
  'Calendar',
];

export const PartialRevampedComponents: PartialRevampedComponent[] = [
  'CodeEditor',
  'PDF',
  'Calendar',
  'CustomComponent',
  'RadioButtonV2',
];

export const INPUT_WIDGET_TYPES = [
  'TextInput',
  'NumberInput',
  'PasswordInput',
  'EmailInput',
  'PhoneInput',
  'CurrencyInput',
  'DatePickerV2',
  'DaterangePicker',
  'TimePicker',
  'DatetimePickerV2',
  'TextArea',
  'DropdownV2',
  'MultiselectV2',
  'RadioButtonV2',
  'RangeSliderV2',
];

export const SHOW_CLEAR_BTN_COMPONENT_TYPES = [
  'TextInput',
  'NumberInput',
  'EmailInput',
  'CurrencyInput',
  'PhoneInput',
  'Datepicker',
  'DatePickerV2',
  'DatetimePickerV2',
  'TimePicker',
  'DaterangePicker',
];

export const PLACEHOLDER_DATE_TIME_COMPONENT: Record<string, string> = {
  Datepicker: 'Select date',
  DatePickerV2: 'Select date',
  DatetimePickerV2: 'Select date and time',
  TimePicker: 'Select time',
  DaterangePicker: 'Select Date Range',
};

export const DYNAMIC_HEIGHT_COMPONENT_TYPES = [
  'Accordion',
  'Button',
  'ButtonGroupV2',
  'Cascader',
  'Checkbox',
  'CodeEditor',
  'ColorPicker',
  'Container',
  'FlexContainer',
  'CurrencyInput',
  'DatePickerV2',
  'DaterangePicker',
  'DatetimePickerV2',
  'DropdownV2',
  'EmailInput',
  'Form',
  'Html',
  'Image',
  'JSONEditor',
  'JSONExplorer',
  'KeyValuePair',
  'Listview',
  'ModalV2',
  'MultiselectV2',
  'NumberInput',
  'PasswordInput',
  'PhoneInput',
  'RadioButtonV2',
  'RichTextEditor',
  'StarRating',
  'Table',
  'Tabs',
  'TagsInput',
  'Text',
  'TextArea',
  'TextInput',
  'TimePicker',
  'ToggleSwitchV2',
  'TreeSelect',
];

export const LEGACY_INPUT_SIZE_COMPONENT_TYPES = [
  'TextInput',
  'PasswordInput',
  'EmailInput',
  'PhoneInput',
  'CurrencyInput',
  'NumberInput',
  'Cascader',
  'TextArea',
];

export const PLACEHOLDER_TEXT_COLOR_COMPONENT_TYPES = [
  'TextInput',
  'PasswordInput',
  'NumberInput',
  'DropdownV2',
  'Cascader',
];

export const MAX_LIMIT_COMPONENT_TYPES = ['MultiselectV2'];

export const TOOLTIP_FORMAT_COMPONENT_TYPES = [
  'Accordion',
  'AudioRecorder',
  'Button',
  'ButtonGroupV2',
  'Camera',
  'Cascader',
  'Checkbox',
  'CircularProgressBar',
  'ColorPicker',
  'Container',
  'CurrencyInput',
  'DatePickerV2',
  'DaterangePicker',
  'DatetimePickerV2',
  'Divider',
  'DropdownV2',
  'EmailInput',
  'FileButton',
  'FileInput',
  'FilePicker',
  'Form',
  'Icon',
  'IFrame',
  'Image',
  'JSONEditor',
  'JSONExplorer',
  'Kanban',
  'KeyValuePair',
  'Link',
  'Listview',
  'ModalV2',
  'MultiselectV2',
  'NumberInput',
  'PasswordInput',
  'PhoneInput',
  'PopoverMenu',
  'ProgressBar',
  'RadioButtonV2',
  'RangeSliderV2',
  'ReorderableList',
  'StarRating',
  'Statistics',
  'Tabs',
  'Tags',
  'TagsInput',
  'Text',
  'TextArea',
  'TextInput',
  'TimePicker',
  'Timeline',
  'ToggleSwitchV2',
  'TreeSelect',
  'VerticalDivider',
  'PDF',
  'CustomComponent',
  'BoundedBox',
  'QrScanner',
  'Calendar',
];

// These components gained a Container style section (background / border / border radius / box shadow).
// Their widget configs default the new keys to the standard tokens, which is right for a
// freshly dropped component but wrong for an app exported before the section existed.
// The meta default would give it a surface background, a visible border and rounded corners it never had.
// So pin each absent key to the value that reproduces the pre-revamp rendering.
// Kept in step with data-migrations/*-BackfillContainerStylesForRevampedWidgets.ts, which does the same.
export const LEGACY_CONTAINER_STYLES: Record<string, Record<string, { value: string | number }>> = {
  BoundedBox: {
    backgroundColor: { value: '#ffffff00' },
    borderColor: { value: '#ffffff00' },
    borderRadius: { value: '{{0}}' },
  },
  QrScanner: {
    backgroundColor: { value: '#ffffff00' },
    borderColor: { value: '#ffffff00' },
    borderRadius: { value: '{{0}}' },
  },
  Calendar: {
    backgroundColor: { value: 'var(--cc-surface1-surface)' },
  },
  PDF: {
    backgroundColor: { value: 'var(--cc-surface1-surface)' },
  },
  CustomComponent: {
    backgroundColor: { value: 'var(--cc-surface1-surface)' },
  },
  FilePicker: {
    backgroundColor: { value: 'var(--cc-surface1-surface)' },
    borderColor: { value: '#ffffff00' },
  },
  Html: {
    backgroundColor: { value: 'var(--cc-surface1-surface)' },
    borderColor: { value: '#ffffff00' },
    borderRadius: { value: '{{0}}' },
  },
  IFrame: {
    backgroundColor: { value: 'var(--cc-surface1-surface)' },
    borderColor: { value: '#ffffff00' },
    borderRadius: { value: '{{0}}' },
  },
  Kanban: {
    backgroundColor: { value: '#ffffff00' },
    borderColor: { value: '#ffffff00' },
    borderRadius: { value: '{{0}}' },
  },
};
