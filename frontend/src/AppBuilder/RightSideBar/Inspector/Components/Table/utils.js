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
  BadgeTypeIcon,
  TagsTypeIcon,
  RadioTypeIcon,
} from './_assets';

export const getColumnIcon = (columnType) => {
  switch (columnType) {
    case 'default':
    case 'string':
      return StringTypeIcon;
    case 'number':
      return NumberTypeIcon;
    case 'text':
      return TextTypeIcon;
    case 'datepicker':
      return DatepickerTypeIcon;
    case 'dropdown':
    case 'select':
      return SelectTypeIcon;
    case 'multiselect':
    case 'newMultiSelect':
      return MultiselectTypeIcon;
    case 'boolean':
    case 'toggle':
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
    case 'radio':
      return RadioTypeIcon;
    case 'badges':
      return BadgeTypeIcon;
    case 'badge':
      return BadgeTypeIcon;
    case 'tags':
      return TagsTypeIcon;
    default:
      return null;
  }
};
