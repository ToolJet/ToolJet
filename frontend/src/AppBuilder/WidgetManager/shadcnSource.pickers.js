// shadcn/ui pack (experiment): pickers widgets (Combobox, Multiselect, Tags input, Color picker, Rating, File upload).
// Components in Widgets/Shadcn/ShadPickers.jsx, style variables in Widgets/Shadcn/looks/pickers.js.
import {
  ANY,
  ARRAY,
  NUMBER_OR_STRING,
  STRING,
  choice,
  choiceValidation,
  code,
  colorStyle,
  select,
  shadConfig,
  sizeStyle,
  toggle,
} from './shadcnPackHelpers.js';

// Form controls carry shadcn's form layout: an optional label above and help text (or the validation error) below.
const fieldProperties = {
  label: code('Label', STRING, ''),
  description: code('Help text', STRING, ''),
};
const fieldDefaults = (label = '') => ({ label: { value: label }, description: { value: '' } });

// Styles, each falling back to the app theme when unset.
const fieldStyles = {
  labelColor: colorStyle('Label color'),
  helpTextColor: colorStyle('Help text color'),
  backgroundColor: colorStyle('Field background'),
  textColor: colorStyle('Field text color'),
  placeholderColor: colorStyle('Placeholder color'),
  borderColor: colorStyle('Field border color'),
  accentColor: colorStyle('Accent (focus ring, checks)'),
  errorColor: colorStyle('Error color (message and border)'),
  borderRadius: sizeStyle('Field radius'),
};
const menuStyles = {
  menuBackgroundColor: colorStyle('Menu background'),
  menuTextColor: colorStyle('Menu text color'),
  optionHoverColor: colorStyle('Highlighted option background'),
};
const chipStyles = {
  chipBackgroundColor: colorStyle('Chip background'),
  chipTextColor: colorStyle('Chip text color'),
};

const OPTIONS_HINT = "['Draft', 'Live'] or [{ label, value, description?, icon?, group?, disabled? }]";
const SEARCH_EVENTS = {
  onSelect: { displayName: 'On select' },
  onChange: { displayName: 'On change' },
  onSearchTextChanged: { displayName: 'On search text changed' },
};
const optionsProperties = {
  options: code('Options', ARRAY, [], { placeholder: OPTIONS_HINT }),
  placeholder: code('Placeholder', STRING, 'Select'),
  searchPlaceholder: code('Search placeholder', STRING, 'Search...'),
  emptyText: code('No results text', STRING, 'No results found.'),
  showSearch: toggle('Show search', true),
  serverSideSearch: toggle('Server-side search (options already filtered by searchText)', false),
  showClearBtn: toggle('Show clear button', true),
  optionsLoadingState: toggle('Options loading state', false),
};
const optionsDefaults = (placeholder, search, empty) => ({
  placeholder: { value: placeholder },
  searchPlaceholder: { value: search },
  emptyText: { value: empty },
  showSearch: { value: '{{true}}' },
  serverSideSearch: { value: '{{false}}' },
  showClearBtn: { value: '{{true}}' },
  optionsLoadingState: { value: '{{false}}' },
});

// ---- Combobox ------------------------------------------------------------------------------------------------------

export const shadComboboxConfig = shadConfig({
  name: 'ShadCombobox',
  displayName: 'Combobox',
  description:
    'shadcn/ui combobox: a searchable single select (popover with a search box). options: plain values or [{ label, ' +
    'value, description?, icon? (Tabler name like IconUser, image URL or emoji), group?, disabled? }]; exposes value, ' +
    'selectedOption, searchText. Height: 64px with a label, 36px without; add 24px for help text',
  defaultSize: { width: 10, height: 64 },
  withHeight: true,
  properties: {
    ...fieldProperties,
    ...optionsProperties,
    defaultValue: code('Default value', ANY, ''),
  },
  defaults: {
    ...fieldDefaults('Country'),
    options: {
      value:
        "{{[{ label: 'United States', value: 'us', group: 'Americas' }, { label: 'Canada', value: 'ca', group: 'Americas' }, { label: 'United Kingdom', value: 'uk', group: 'Europe' }, { label: 'Germany', value: 'de', group: 'Europe' }, { label: 'India', value: 'in', group: 'Asia Pacific' }, { label: 'Japan', value: 'jp', group: 'Asia Pacific' }]}}",
    },
    ...optionsDefaults('Select a country...', 'Search countries...', 'No country found.'),
    defaultValue: { value: '' },
  },
  styles: { ...fieldStyles, ...menuStyles },
  validation: choiceValidation,
  events: SEARCH_EVENTS,
  exposedVariables: { isValid: true, isMandatory: false, value: '', selectedOption: {}, searchText: '', options: [] },
  actions: [
    {
      handle: 'selectOption',
      displayName: 'Select option',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '' }],
    },
    { handle: 'clear', displayName: 'Clear' },
  ],
});

// ---- Multiselect ---------------------------------------------------------------------------------------------------

export const shadMultiselectConfig = shadConfig({
  name: 'ShadMultiselect',
  displayName: 'Multiselect',
  description:
    'shadcn/ui multi-select combobox: picked options show as removable chips in the field (+N past maxVisibleChips), ' +
    'with search and select all. options like the Combobox; defaultValue is an array of values; exposes values ' +
    '(array) and selectedOptions. Height: 64px with a label, 36px without (one row of chips; grows with dynamic height)',
  defaultSize: { width: 10, height: 64 },
  withHeight: true,
  properties: {
    ...fieldProperties,
    ...optionsProperties,
    defaultValue: code('Default values', ARRAY, []),
    showSelectAll: toggle('Show select all', true),
    maxVisibleChips: code('Max visible chips (0 shows all)', NUMBER_OR_STRING, 3),
    maxSelections: code('Max selections (0 for no limit)', NUMBER_OR_STRING, 0),
  },
  defaults: {
    ...fieldDefaults('Teams'),
    options: {
      value:
        "{{[{ label: 'Design', value: 'design' }, { label: 'Engineering', value: 'engineering' }, { label: 'Marketing', value: 'marketing' }, { label: 'Sales', value: 'sales' }, { label: 'Support', value: 'support' }]}}",
    },
    ...optionsDefaults('Select teams...', 'Search teams...', 'No team found.'),
    defaultValue: { value: "{{['design', 'engineering']}}" },
    showSelectAll: { value: '{{true}}' },
    maxVisibleChips: { value: '{{3}}' },
    maxSelections: { value: '{{0}}' },
  },
  styles: { ...fieldStyles, ...chipStyles, ...menuStyles },
  validation: choiceValidation,
  events: SEARCH_EVENTS,
  exposedVariables: {
    isValid: true,
    isMandatory: false,
    values: [],
    selectedOptions: [],
    searchText: '',
    options: [],
  },
  actions: [
    {
      handle: 'selectOptions',
      displayName: 'Select options',
      params: [{ handle: 'values', displayName: 'Values', defaultValue: '{{[]}}' }],
    },
    {
      handle: 'deselectOptions',
      displayName: 'Deselect options',
      params: [{ handle: 'values', displayName: 'Values', defaultValue: '{{[]}}' }],
    },
    { handle: 'clear', displayName: 'Clear' },
  ],
});

// ---- Tags input ----------------------------------------------------------------------------------------------------

export const shadTagsInputConfig = shadConfig({
  name: 'ShadTagsInput',
  displayName: 'Tags input',
  description:
    'shadcn/ui tags input: free-form tags typed in the field (Enter or comma adds, Backspace removes the last, x ' +
    'removes one), with optional suggestions, maxTags, duplicate check and a per-tag pattern. Exposes tags (array ' +
    'of text) and value (the same). Height: 64px with a label, 36px without (one row; grows with dynamic height)',
  defaultSize: { width: 10, height: 64 },
  withHeight: true,
  properties: {
    ...fieldProperties,
    placeholder: code('Placeholder', STRING, 'Add a tag...'),
    defaultValue: code('Default tags', ARRAY, []),
    suggestions: code('Suggestions', ARRAY, [], { placeholder: "['urgent', 'billing'] or [{ label, value }]" }),
    allowCustomTags: toggle('Allow tags not in suggestions', true),
    maxTags: code('Max tags (0 for no limit)', NUMBER_OR_STRING, 0),
    caseSensitive: toggle('Case-sensitive duplicate check', false),
    tagPattern: code('Tag pattern (regex)', STRING, '', { placeholder: '^[a-z0-9-]+$' }),
    patternError: code('Pattern error message', STRING, ''),
    addOnBlur: toggle('Add typed text on blur', false),
    showClearBtn: toggle('Show clear button', false),
  },
  defaults: {
    ...fieldDefaults('Tags'),
    placeholder: { value: 'Add a tag...' },
    defaultValue: { value: "{{['react', 'typescript']}}" },
    suggestions: { value: "{{['react', 'typescript', 'node', 'python', 'design', 'devops']}}" },
    allowCustomTags: { value: '{{true}}' },
    maxTags: { value: '{{0}}' },
    caseSensitive: { value: '{{false}}' },
    tagPattern: { value: '' },
    patternError: { value: '' },
    addOnBlur: { value: '{{false}}' },
    showClearBtn: { value: '{{false}}' },
  },
  styles: { ...fieldStyles, ...chipStyles, ...menuStyles },
  validation: choiceValidation,
  events: {
    onChange: { displayName: 'On change' },
    onTagAdded: { displayName: 'On tag added' },
    onTagRemoved: { displayName: 'On tag removed' },
  },
  exposedVariables: {
    isValid: true,
    isMandatory: false,
    tags: [],
    value: [],
    lastAddedTag: '',
    lastRemovedTag: '',
  },
  actions: [
    {
      handle: 'setTags',
      displayName: 'Set tags',
      params: [{ handle: 'tags', displayName: 'Tags', defaultValue: '{{[]}}' }],
    },
    { handle: 'clear', displayName: 'Clear' },
  ],
});

// ---- Color picker --------------------------------------------------------------------------------------------------

export const shadColorPickerConfig = shadConfig({
  name: 'ShadColorPicker',
  displayName: 'Color picker',
  description:
    'shadcn/ui color picker: a swatch-and-hex field opening a popover with a saturation/hue picker, a hex input and ' +
    'preset swatches (array of hex). Exposes value (#rrggbb, or #rrggbbaa with allowAlpha), rgb and rgba. Height: ' +
    '64px with a label, 36px without',
  defaultSize: { width: 8, height: 64 },
  withHeight: true,
  properties: {
    ...fieldProperties,
    defaultValue: code('Default color', STRING, '#6366f1'),
    placeholder: code('Placeholder', STRING, 'Pick a color'),
    swatches: code('Preset swatches', ARRAY, [], { placeholder: "['#0f172a', '#6366f1', '#22c55e']" }),
    showSwatches: toggle('Show swatches', true),
    showPicker: toggle('Show saturation and hue picker', true),
    allowAlpha: toggle('Allow transparency (alpha)', false),
    triggerStyle: choice('Trigger', ['field', 'swatch'], 'field', { field: 'Swatch and hex', swatch: 'Swatch only' }),
  },
  defaults: {
    ...fieldDefaults('Brand color'),
    defaultValue: { value: '#6366f1' },
    placeholder: { value: 'Pick a color' },
    swatches: {
      value:
        "{{['#0f172a', '#64748b', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899']}}",
    },
    showSwatches: { value: '{{true}}' },
    showPicker: { value: '{{true}}' },
    allowAlpha: { value: '{{false}}' },
    triggerStyle: { value: 'field' },
  },
  styles: {
    labelColor: fieldStyles.labelColor,
    helpTextColor: fieldStyles.helpTextColor,
    backgroundColor: fieldStyles.backgroundColor,
    textColor: fieldStyles.textColor,
    placeholderColor: fieldStyles.placeholderColor,
    borderColor: fieldStyles.borderColor,
    accentColor: colorStyle('Accent (focus ring)'),
    borderRadius: fieldStyles.borderRadius,
    menuBackgroundColor: colorStyle('Popover background'),
  },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { value: '', rgb: '', rgba: '' },
  actions: [
    {
      handle: 'setColor',
      displayName: 'Set color',
      params: [{ handle: 'color', displayName: 'Color', defaultValue: '#6366f1' }],
    },
  ],
});

// ---- Rating --------------------------------------------------------------------------------------------------------

export const shadRatingConfig = shadConfig({
  name: 'ShadRating',
  displayName: 'Rating',
  description:
    'shadcn/ui rating: a row of 1 to 10 icons (star, heart or circle) with optional half steps and read-only mode; ' +
    'keyboard accessible. Exposes value (number, 0 for none). Height: 24px for the default size (32px for lg), ' +
    'plus 22px with a label',
  defaultSize: { width: 6, height: 24 },
  withHeight: true,
  properties: {
    ...fieldProperties,
    defaultValue: code('Default value', NUMBER_OR_STRING, 4),
    max: code('Number of icons (1 to 10)', NUMBER_OR_STRING, 5),
    icon: choice('Icon', ['star', 'heart', 'circle'], 'star'),
    size: choice('Size', ['sm', 'default', 'lg'], 'default', { sm: 'Small', default: 'Medium', lg: 'Large' }),
    allowHalf: toggle('Allow half values', false),
    allowClear: toggle('Click the current value to clear', true),
    readOnly: toggle('Read only', false),
    showValue: toggle('Show value text', false),
    valueLabels: code('Value labels (one per icon)', ARRAY, [], {
      placeholder: "['Poor', 'Fair', 'Good', 'Great', 'Excellent']",
    }),
  },
  defaults: {
    ...fieldDefaults(''),
    defaultValue: { value: '{{4}}' },
    max: { value: '{{5}}' },
    icon: { value: 'star' },
    size: { value: 'default' },
    allowHalf: { value: '{{false}}' },
    allowClear: { value: '{{true}}' },
    readOnly: { value: '{{false}}' },
    showValue: { value: '{{false}}' },
    valueLabels: { value: '{{[]}}' },
  },
  styles: {
    filledColor: colorStyle('Filled icon color'),
    emptyColor: colorStyle('Empty icon color'),
    valueTextColor: colorStyle('Value text color'),
    labelColor: colorStyle('Label color'),
    helpTextColor: colorStyle('Help text color'),
    accentColor: colorStyle('Focus ring color'),
    errorColor: colorStyle('Error color'),
  },
  validation: choiceValidation,
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { isValid: true, isMandatory: false, value: 0 },
  actions: [
    {
      handle: 'setValue',
      displayName: 'Set value',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '{{3}}' }],
    },
    { handle: 'clear', displayName: 'Clear' },
  ],
});

// ---- File upload ---------------------------------------------------------------------------------------------------

export const shadFileUploadConfig = shadConfig({
  name: 'ShadFileUpload',
  displayName: 'File upload',
  description:
    'shadcn/ui file upload: a dashed dropzone (drag and drop or click to browse) with a file list. accept is a MIME ' +
    "or extension list like 'image/*,.pdf'; maxSize and minSize in bytes. Exposes files [{ name, type, size, " +
    'content (text), base64Data, dataURL, parsedData }] like the native File picker. Height: about 160px for the ' +
    'dropzone, 180px with a label; the list adds about 66px per file (dynamic height)',
  defaultSize: { width: 12, height: 180 },
  withHeight: true,
  properties: {
    ...fieldProperties,
    title: code('Title', STRING, 'Drag & drop files here'),
    hint: code('Hint (empty: accepted types and size)', STRING, ''),
    accept: code('Accept file types', STRING, '', { placeholder: 'image/*,application/pdf,.csv' }),
    multiple: toggle('Allow multiple files', true),
    maxFiles: code('Max files', NUMBER_OR_STRING, 5),
    maxSize: code('Max size (bytes, 0 for no limit)', NUMBER_OR_STRING, 5242880),
    minSize: code('Min size (bytes)', NUMBER_OR_STRING, 0),
    showPreview: toggle('Show image thumbnails', true),
    parseContent: toggle('Parse content (CSV, TSV, Excel, JSON)', false),
    parseFileType: select(
      'Parse as',
      [
        ['auto-detect', 'Autodetect from type'],
        ['csv', 'CSV'],
        ['tsv', 'TSV'],
        ['vnd.ms-excel', 'Excel (xls)'],
        ['vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Excel (xlsx)'],
        ['json', 'JSON'],
      ],
      'auto-detect'
    ),
    delimiter: code('CSV delimiter', STRING, ','),
  },
  defaults: {
    ...fieldDefaults('Attachments'),
    title: { value: 'Drag & drop files here' },
    hint: { value: '' },
    accept: { value: 'image/*,application/pdf' },
    multiple: { value: '{{true}}' },
    maxFiles: { value: '{{5}}' },
    maxSize: { value: '{{5242880}}' },
    minSize: { value: '{{0}}' },
    showPreview: { value: '{{true}}' },
    parseContent: { value: '{{false}}' },
    parseFileType: { value: 'auto-detect' },
    delimiter: { value: ',' },
  },
  styles: {
    labelColor: colorStyle('Label color'),
    helpTextColor: colorStyle('Help text color'),
    dropzoneBackgroundColor: colorStyle('Dropzone background'),
    dropzoneBorderColor: colorStyle('Dropzone border color'),
    iconColor: colorStyle('Upload icon color'),
    iconBackgroundColor: colorStyle('Upload icon background'),
    titleColor: colorStyle('Title color'),
    hintColor: colorStyle('Hint color'),
    accentColor: colorStyle('Accent (drag over, browse link)'),
    fileItemBackgroundColor: colorStyle('File row background'),
    fileItemBorderColor: colorStyle('File row border color'),
    errorColor: colorStyle('Error color'),
    borderRadius: sizeStyle('Radius'),
  },
  validation: choiceValidation,
  events: {
    onFileSelected: { displayName: 'On file selected' },
    onFileDeselected: { displayName: 'On file deselected' },
  },
  exposedVariables: { isValid: true, isMandatory: false, files: [], fileSize: 0, isParsing: false },
  actions: [{ handle: 'clearFiles', displayName: 'Clear files' }],
});
