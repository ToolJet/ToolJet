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
  TagsV2TypeIcon,
  RadioTypeIcon,
  RatingTypeIcon,
  ButtonTypeIcon,
} from './_assets';

/** Default option rows for select / multiselect / TagsV2 columns (inspector + handlePropertyChange). */
export const DEFAULT_SELECT_COLUMN_OPTIONS = [
  { label: 'Reading', value: 'Reading' },
  { label: 'Traveling', value: 'Traveling' },
  { label: 'Photography', value: 'Photography' },
  { label: 'Music', value: 'Music' },
];

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
    case 'tagsV2':
      return TagsV2TypeIcon;
    case 'rating':
      return RatingTypeIcon;
    case 'button':
      return ButtonTypeIcon;
    default:
      return null;
  }
};
