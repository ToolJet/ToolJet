// A component pack's components in the palette the way ToolJet's own widgets are: in the same sections, with the
// widget icons. A pack component declares its role in the manifest (v2: what UI 2.0 widget it stands for), which
// places it here; a library without roles keeps the plain list.

// Section order, titles as in sectionConfig, plus Charts (packs bring many).
export const PACK_SECTIONS = [
  ['buttons', 'Buttons'],
  ['data', 'Data'],
  ['charts', 'Charts'],
  ['layouts', 'Layouts'],
  ['textInputs', 'Text inputs'],
  ['numberInputs', 'Number inputs'],
  ['selectInputs', 'Select inputs'],
  ['dateTimeInputs', 'Date and time inputs'],
  ['navigation', 'Navigation'],
  ['media', 'Media'],
  ['presentation', 'Presentation'],
  ['miscellaneous', 'Miscellaneous'],
];

// role -> [section, widget icon name (assets/images/icons/widgets)].
const ROLE_PALETTE = {
  button: ['buttons', 'button'],
  buttongroup: ['buttons', 'buttongroup'],
  dropdownmenu: ['buttons', 'popovermenu'],
  togglegroup: ['buttons', 'buttongroup'],

  table: ['data', 'table'],
  keyvalue: ['data', 'jsonexplorer'],
  listview: ['data', 'listview'],
  recordlist: ['data', 'listview'],
  tree: ['data', 'treeselect'],
  transfer: ['data', 'listview'],

  areachart: ['charts', 'chart'],
  barchart: ['charts', 'chart'],
  horizontalbarchart: ['charts', 'chart'],
  combochart: ['charts', 'chart'],
  funnelchart: ['charts', 'chart'],
  heatmapchart: ['charts', 'chart'],
  linechart: ['charts', 'chart'],
  piechart: ['charts', 'chart'],
  radarchart: ['charts', 'chart'],
  radialchart: ['charts', 'chart'],
  scatterchart: ['charts', 'chart'],
  sparkline: ['charts', 'chart'],
  gauge: ['charts', 'circularprogressbar'],

  card: ['layouts', 'container'],
  cardgrid: ['layouts', 'flexcontainer'],
  accordion: ['layouts', 'accordion'],
  'accordion-container': ['layouts', 'accordion'],
  tabs: ['layouts', 'tabs'],
  dialog: ['layouts', 'modal'],
  drawer: ['layouts', 'modal'],
  form: ['layouts', 'form'],
  kanban: ['layouts', 'kanban'],
  calendar: ['layouts', 'calendar'],
  schedule: ['layouts', 'calendar'],
  'split-pane': ['layouts', 'flexcontainer'],
  hero: ['layouts', 'container'],
  questionnaire: ['layouts', 'form'],

  input: ['textInputs', 'textinput'],
  textarea: ['textInputs', 'textarea'],
  passwordinput: ['textInputs', 'passwordinput'],
  otpinput: ['textInputs', 'passwordinput'],

  numberinput: ['numberInputs', 'numberinput'],
  phoneinput: ['numberInputs', 'phoneinput'],
  currencyinput: ['numberInputs', 'currencyinput'],
  slider: ['numberInputs', 'rangeslider'],
  rating: ['numberInputs', 'starrating'],

  select: ['selectInputs', 'dropdownv2'],
  combobox: ['selectInputs', 'dropdownv2'],
  autocomplete: ['selectInputs', 'dropdownv2'],
  multiselect: ['selectInputs', 'multiselectv2'],
  tagsinput: ['selectInputs', 'tagsinput'],
  radio: ['selectInputs', 'radiobuttonv2'],
  radiogroup: ['selectInputs', 'radiobuttonv2'],
  checkbox: ['selectInputs', 'checkbox'],
  switch: ['selectInputs', 'toggleswitchv2'],
  treeselect: ['selectInputs', 'treeselect'],
  cascader: ['selectInputs', 'cascader'],
  fileupload: ['selectInputs', 'filepicker'],
  filepicker: ['selectInputs', 'filepicker'],
  colorpicker: ['selectInputs', 'colorpicker'],

  datepicker: ['dateTimeInputs', 'datepicker'],
  daterangepicker: ['dateTimeInputs', 'daterangepicker'],
  datetimepicker: ['dateTimeInputs', 'datetimepickerv2'],
  timepicker: ['dateTimeInputs', 'timepicker'],

  navigation: ['navigation', 'navigation'],
  breadcrumb: ['navigation', 'navigation'],
  link: ['navigation', 'link'],
  pagination: ['navigation', 'pagination'],
  steps: ['navigation', 'steps'],
  stepper: ['navigation', 'steps'],

  image: ['media', 'image'],
  icon: ['media', 'icon'],
  avatar: ['media', 'image'],
  carousel: ['media', 'image'],
  map: ['media', 'map'],
  qrcode: ['media', 'qrscanner'],

  text: ['presentation', 'text'],
  heading: ['presentation', 'text'],
  badge: ['presentation', 'tags'],
  tags: ['presentation', 'tags'],
  status: ['presentation', 'tags'],
  stat: ['presentation', 'statistics'],
  summarystrip: ['presentation', 'statistics'],
  progress: ['presentation', 'progressbar'],
  progresslist: ['presentation', 'progressbar'],
  circularprogress: ['presentation', 'circularprogressbar'],
  timeline: ['presentation', 'timeline'],
  separator: ['presentation', 'divider'],
  spinner: ['presentation', 'spinner'],
  skeleton: ['presentation', 'spinner'],
  alert: ['presentation', 'text'],
  empty: ['presentation', 'text'],
  result: ['presentation', 'text'],

  chat: ['miscellaneous', 'chat'],
};

/** Where a pack component sits in the palette and its icon; a role this map does not know is Miscellaneous. */
export const paletteFor = (role) => {
  const [section, icon] = ROLE_PALETTE[role] ?? ['miscellaneous', undefined];
  return { section, icon };
};

/**
 * The library's components in palette sections ([{ key, title, items: [[exportName, config]] }]), or null when its
 * components declare no roles (a plain custom library: the flat list).
 * @param {Array<[string, { role?: string }]>} components
 */
export const groupPackComponents = (components) => {
  if (!components?.length || !components.some(([, config]) => config?.role)) return null;
  const bySection = new Map(PACK_SECTIONS.map(([key]) => [key, []]));
  for (const entry of components) bySection.get(paletteFor(entry[1]?.role).section).push(entry);
  return PACK_SECTIONS.filter(([key]) => bySection.get(key).length).map(([key, title]) => ({
    key,
    title,
    items: bySection.get(key),
  }));
};
