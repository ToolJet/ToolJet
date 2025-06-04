export const DATATYPE_TO_COMPONENT = {
  string: 'TextInput',
  number: 'NumberInput',
  date: 'DatePickerV2',
  boolean: 'Checkbox',
  array: 'DropdownV2',
};

export const COMPONENT_WITH_OPTIONS = ['DropdownV2', 'MultiselectV2', 'RadioButtonV2'];

export const JSON_DIFFERENCE = {
  isExisting: [],
  isNew: [],
  isRemoved: [],
};

export const FORM_STATUS = {
  MANAGE_FIELDS: 'manageFields',
  GENERATE_FIELDS: 'generateFields',
  REFRESH_FIELDS: 'refreshFields',
};

export const COMPONENT_LAYOUT_DETAILS = {
  spacing: 10,
  defaultWidth: 37,
  defaultHeight: 30,
  defaultLeft: 3,
};
