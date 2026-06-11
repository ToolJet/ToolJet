import {
  TextTypeIcon,
  DatepickerTypeIcon,
  SelectTypeIcon,
  MultiselectTypeIcon,
  BooleanTypeIcon,
  ImageTypeIcon,
  LinkTypeIcon,
  JSONTypeIcon,
  MarkdownTypeIcon,
  HTMLTypeIcon,
  NumberTypeIcon,
  StringTypeIcon,
} from '../Table/_assets';

export const getFieldIcon = (fieldType) => {
  switch (fieldType) {
    case 'string':
      return StringTypeIcon;
    case 'number':
      return NumberTypeIcon;
    case 'text':
      return TextTypeIcon;
    case 'datepicker':
      return DatepickerTypeIcon;
    case 'select':
      return SelectTypeIcon;
    case 'newMultiSelect':
      return MultiselectTypeIcon;
    case 'boolean':
      return BooleanTypeIcon;
    case 'image':
      return ImageTypeIcon;
    case 'link':
      return LinkTypeIcon;
    case 'json':
      return JSONTypeIcon;
    case 'markdown':
      return MarkdownTypeIcon;
    case 'html':
      return HTMLTypeIcon;
    default:
      return StringTypeIcon;
  }
};

export const FIELD_TYPE_OPTIONS = [
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Text', value: 'text' },
  { label: 'Date Picker', value: 'datepicker' },
  { label: 'Select', value: 'select' },
  { label: 'MultiSelect', value: 'newMultiSelect' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Image', value: 'image' },
  { label: 'Link', value: 'link' },
  { label: 'JSON', value: 'json' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'HTML', value: 'html' },
];
