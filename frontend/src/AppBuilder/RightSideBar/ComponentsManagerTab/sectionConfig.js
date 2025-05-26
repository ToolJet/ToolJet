const sectionConfig = {
  commonlyUsed: {
    title: 'Commonly used',
    valueSet: new Set(['Table', 'Button', 'Text', 'TextInput', 'DatetimePickerV2', 'Form']),
  },
  buttons: {
    title: 'Buttons',
    valueSet: new Set(['Button', 'ButtonGroup']),
  },
  data: {
    title: 'Data',
    valueSet: new Set(['Table', 'Chart']),
  },
  layouts: {
    title: 'Layouts',
    valueSet: new Set(['Form', 'ModalV2', 'Container', 'Tabs', 'Listview', 'Kanban', 'Calendar']),
  },
  textInputs: {
    title: 'Text inputs',
    valueSet: new Set(['TextInput', 'TextArea', 'EmailInput', 'PasswordInput', 'RichTextEditor']),
  },
  numberInputs: {
    title: 'Number inputs',
    valueSet: new Set(['NumberInput', 'PhoneInput', 'CurrencyInput', 'RangeSlider', 'StarRating']),
  },
  selectInputs: {
    title: 'Select inputs',
    valueSet: new Set(['Dropdown', 'MultiselectV2', 'ToggleSwitchV2', 'RadioButtonV2', 'Checkbox', 'TreeSelect']),
  },
  dateTimeInputs: {
    title: 'Date and time inputs',
    valueSet: new Set(['DaterangePicker', 'DatePickerV2', 'TimePicker', 'DatetimePickerV2']),
  },
  navigation: {
    title: 'Navigation',
    valueSet: new Set(['Link', 'Pagination', 'Steps']),
  },
  media: {
    title: 'Media',
    valueSet: new Set(['Icon', 'Image', 'SvgImage', 'PDF', 'Map']),
  },
  presentation: {
    title: 'Presentation',
    valueSet: new Set([
      'Text',
      'Tags',
      'CircularProgressBar',
      'Timeline',
      'Divider',
      'VerticalDivider',
      'Spinner',
      'Statistics',
      'Timer',
    ]),
  },
  custom: {
    title: 'Custom',
    valueSet: new Set(['CustomComponent', 'Html', 'IFrame']),
  },
  miscellaneous: {
    title: 'Miscellaneous',
    valueSet: new Set(['FilePicker', 'CodeEditor', 'ColorPicker', 'BoundedBox', 'QrScanner']),
  },
  legacy: {
    title: 'Legacy',
    valueSet: new Set(['Modal', 'Datepicker', 'RadioButton', 'ToggleSwitch', 'DropDown', 'Multiselect']),
  },
};

export default sectionConfig;
