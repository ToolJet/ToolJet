// shadcn/ui pack (experiment): actions widgets (dropdown menu, button group, navigation, calendar, carousel). The
// components live in Widgets/Shadcn/ShadActions.jsx, their style variables in Widgets/Shadcn/looks/actions.js.
import {
  ANY,
  ARRAY,
  NUMBER,
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

const VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'];
const param = (handle, displayName, defaultValue = '') => ({ handle, displayName, defaultValue });

// ---- Dropdown menu -----------------------------------------------------------------------------------------------

export const shadDropdownMenuConfig = shadConfig({
  name: 'ShadDropdownMenu',
  displayName: 'Dropdown menu',
  description:
    "shadcn/ui dropdown menu: a trigger button (label + variant, or an icon-only '...' trigger) opening a menu of items [{ label, value, icon?: 'IconPencil', description?, shortcut?: '⌘E', disabled?, visible?, destructive?, separator? (line above), group? (heading) }]. On select fires onSelect with lastClickedOption { label, value, description }. Height 36px (sm 32px, lg 40px)",
  defaultSize: { width: 6, height: 36 },
  properties: {
    label: code('Label', STRING, 'Actions'),
    triggerType: choice('Trigger', ['button', 'icon'], 'button', { icon: 'Icon only' }),
    variant: choice('Variant', VARIANTS, 'outline'),
    size: choice('Size', ['sm', 'default', 'lg'], 'default'),
    triggerIcon: code('Trigger icon (Tabler name, e.g. IconDots)', STRING, ''),
    showChevron: toggle('Show chevron', true),
    fullWidth: toggle('Full width'),
    items: code('Items', ARRAY, [], {
      placeholder:
        "[{ label: 'Edit', value: 'edit', icon: 'IconPencil', shortcut: '⌘E' }, { label: 'Delete', value: 'delete', destructive: true, separator: true }]",
    }),
    menuLabel: code('Menu heading', STRING, ''),
    align: choice('Menu align', ['start', 'center', 'end'], 'start'),
    side: choice('Menu side', ['bottom', 'top', 'right', 'left'], 'bottom'),
    optionsLoadingState: toggle('Options loading state'),
  },
  defaults: {
    label: { value: 'Actions' },
    triggerType: { value: 'button' },
    variant: { value: 'outline' },
    size: { value: 'default' },
    triggerIcon: { value: '' },
    showChevron: { value: '{{true}}' },
    fullWidth: { value: '{{false}}' },
    items: {
      value:
        "{{[{ label: 'Edit', value: 'edit', icon: 'IconPencil', shortcut: '⌘E' }, { label: 'Duplicate', value: 'duplicate', icon: 'IconCopy', shortcut: '⌘D' }, { label: 'Archive', value: 'archive', icon: 'IconArchive' }, { label: 'Delete', value: 'delete', icon: 'IconTrash', destructive: true, separator: true }]}}",
    },
    menuLabel: { value: '' },
    align: { value: 'start' },
    side: { value: 'bottom' },
    optionsLoadingState: { value: '{{false}}' },
  },
  styles: {
    backgroundColor: colorStyle('Trigger background'),
    hoverBackgroundColor: colorStyle('Trigger hover background'),
    textColor: colorStyle('Trigger text color'),
    borderColor: colorStyle('Trigger border color'),
    borderRadius: sizeStyle('Trigger radius'),
    menuBackgroundColor: colorStyle('Menu background'),
    menuBorderColor: colorStyle('Menu border color'),
    itemTextColor: colorStyle('Item text color'),
    itemHoverBackgroundColor: colorStyle('Item hover background'),
    itemHoverTextColor: colorStyle('Item hover text color'),
    descriptionColor: colorStyle('Item description and shortcut color'),
    iconColor: colorStyle('Item icon color'),
    destructiveColor: colorStyle('Destructive item color'),
    menuRadius: sizeStyle('Menu radius'),
    menuWidth: sizeStyle('Menu width (px)'),
  },
  events: {
    onSelect: { displayName: 'On select' },
    onOpen: { displayName: 'On open' },
    onClose: { displayName: 'On close' },
  },
  exposedVariables: { lastClickedOption: null, isOpen: false },
  actions: [
    { handle: 'open', displayName: 'Open menu' },
    { handle: 'close', displayName: 'Close menu' },
  ],
});

// ---- Button group ------------------------------------------------------------------------------------------------

export const shadButtonGroupConfig = shadConfig({
  name: 'ShadButtonGroup',
  displayName: 'Button group',
  description:
    "shadcn/ui button group (attached buttons) from buttons [{ label, value, icon?: 'IconBolt', disabled?, variant? }] (label '' with an icon = icon-only). mode: 'actions' (each click fires onClick, exposed lastClicked), 'single' or 'multiple' (a segmented selection: exposed value, values, selected; onChange). Height 36px (sm 32px, lg 40px); add 22px for a label",
  defaultSize: { width: 10, height: 36 },
  withHeight: true,
  properties: {
    label: code('Label', STRING, ''),
    description: code('Help text', STRING, ''),
    buttons: code('Buttons', ARRAY, [], {
      placeholder: "[{ label: 'Day', value: 'day' }, { label: 'Week', value: 'week', icon: 'IconCalendar' }]",
    }),
    mode: choice('Mode', ['actions', 'single', 'multiple'], 'single'),
    defaultValue: code('Default selected (value, or a list when multiple)', ANY, ''),
    allowDeselect: toggle('Allow deselecting (single)'),
    variant: choice('Variant', ['outline', 'secondary', 'default', 'ghost'], 'outline'),
    size: choice('Size', ['sm', 'default', 'lg'], 'default'),
    orientation: choice('Orientation', ['horizontal', 'vertical'], 'horizontal'),
    fullWidth: toggle('Full width'),
  },
  defaults: {
    label: { value: '' },
    description: { value: '' },
    buttons: {
      value:
        "{{[{ label: 'Day', value: 'day' }, { label: 'Week', value: 'week' }, { label: 'Month', value: 'month' }]}}",
    },
    mode: { value: 'single' },
    defaultValue: { value: 'week' },
    allowDeselect: { value: '{{false}}' },
    variant: { value: 'outline' },
    size: { value: 'default' },
    orientation: { value: 'horizontal' },
    fullWidth: { value: '{{false}}' },
  },
  styles: {
    backgroundColor: colorStyle('Button background'),
    hoverBackgroundColor: colorStyle('Button hover background'),
    textColor: colorStyle('Button text color'),
    borderColor: colorStyle('Border and divider color'),
    selectedBackgroundColor: colorStyle('Selected background'),
    selectedTextColor: colorStyle('Selected text color'),
    iconColor: colorStyle('Icon color'),
    labelColor: colorStyle('Label color'),
    borderRadius: sizeStyle('Group radius'),
  },
  validation: choiceValidation,
  events: {
    onClick: { displayName: 'On click' },
    onChange: { displayName: 'On change' },
  },
  exposedVariables: { value: '', values: [], selected: [], lastClicked: null, isValid: true, isMandatory: false },
  actions: [
    { handle: 'setSelected', displayName: 'Set selected', params: [param('selected', 'Value (or list)')] },
    { handle: 'clear', displayName: 'Clear selected' },
  ],
});

// ---- Navigation --------------------------------------------------------------------------------------------------

export const shadNavigationConfig = shadConfig({
  name: 'ShadNavigation',
  displayName: 'Navigation',
  description:
    "shadcn/ui app navigation: a vertical sidebar list or a horizontal top bar from items [{ label, value, icon?: 'IconHome', badge?, disabled?, group? (sidebar heading), children?: [{ label, value }] }] (children open as a dropdown in the top bar, a nested list in the sidebar). variant pills, underline or ghost; defaultValue is the active item; onSelect fires on click with exposed value and activeItem { label, value, parentLabel, parentValue } (wire page switches here); setActive(value). Item height 36px; a top bar is 40px tall, a sidebar fills the widget's height",
  defaultSize: { width: 9, height: 320 },
  properties: {
    items: code('Items', ARRAY, [], {
      placeholder:
        "[{ label: 'Dashboard', value: 'dashboard', icon: 'IconLayoutDashboard' }, { label: 'Orders', value: 'orders', badge: 12 }]",
    }),
    defaultValue: code('Active item (value)', ANY, ''),
    orientation: choice('Orientation', ['vertical', 'horizontal'], 'vertical'),
    variant: choice('Variant', ['pills', 'underline', 'ghost'], 'pills'),
    size: choice('Size', ['sm', 'default', 'lg'], 'default'),
    align: choice('Align (top bar)', ['start', 'center', 'end', 'stretch'], 'start'),
    collapsed: toggle('Collapsed (icon-only sidebar)'),
  },
  defaults: {
    items: {
      value:
        "{{[{ label: 'Dashboard', value: 'dashboard', icon: 'IconLayoutDashboard' }, { label: 'Orders', value: 'orders', icon: 'IconShoppingCart', badge: 12 }, { label: 'Customers', value: 'customers', icon: 'IconUsers' }, { label: 'Reports', value: 'reports', icon: 'IconChartBar', children: [{ label: 'Sales', value: 'sales' }, { label: 'Traffic', value: 'traffic' }] }, { label: 'Settings', value: 'settings', icon: 'IconSettings', group: 'Workspace' }]}}",
    },
    defaultValue: { value: 'dashboard' },
    orientation: { value: 'vertical' },
    variant: { value: 'pills' },
    size: { value: 'default' },
    align: { value: 'start' },
    collapsed: { value: '{{false}}' },
  },
  styles: {
    backgroundColor: colorStyle('Background'),
    textColor: colorStyle('Item text color'),
    iconColor: colorStyle('Item icon color'),
    hoverBackgroundColor: colorStyle('Item hover background'),
    activeBackgroundColor: colorStyle('Active item background'),
    activeTextColor: colorStyle('Active item text color'),
    indicatorColor: colorStyle('Active indicator color (underline)'),
    badgeBackgroundColor: colorStyle('Badge background'),
    badgeTextColor: colorStyle('Badge text color'),
    groupLabelColor: colorStyle('Group heading color'),
    separatorColor: colorStyle('Separator color'),
    itemRadius: sizeStyle('Item radius'),
  },
  events: { onSelect: { displayName: 'On select' } },
  exposedVariables: { value: '', activeItem: null, isCollapsed: false },
  actions: [
    { handle: 'setActive', displayName: 'Set active item', params: [param('value', 'Value')] },
    {
      handle: 'setCollapsed',
      displayName: 'Set collapsed',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '{{true}}', type: 'toggle' }],
    },
  ],
});

// ---- Calendar ----------------------------------------------------------------------------------------------------

export const shadCalendarConfig = shadConfig({
  name: 'ShadCalendar',
  displayName: 'Calendar',
  description:
    "shadcn/ui inline month calendar. mode single, multiple or range; defaultValue 'YYYY-MM-DD' (a list for multiple, [start, end] for range); markers [{ date, label?, color? }] draw dots under days (label on hover); minDate, maxDate, disabledDates, disabledDays ([0, 6] = weekends). Exposed value, selectedDate, selectedDates, startDate, endDate, visibleMonth ('YYYY-MM'), visibleStart, visibleEnd; events onSelect, onMonthChange. One month is about 300px tall and 250px wide (fullWidth stretches the days)",
  defaultSize: { width: 10, height: 300 },
  withHeight: true,
  properties: {
    mode: choice('Selection mode', ['single', 'multiple', 'range'], 'single'),
    defaultValue: code('Default value (YYYY-MM-DD, a list, or [start, end])', ANY, ''),
    defaultMonth: code('Month to show (date; default: the selection or today)', STRING, ''),
    markers: code('Markers', ARRAY, [], { placeholder: "[{ date: '2026-10-12', label: 'Launch', color: '#16a34a' }]" }),
    minDate: code('Min date', STRING, ''),
    maxDate: code('Max date', STRING, ''),
    disabledDates: code('Disabled dates', ARRAY, [], { placeholder: "['2026-12-25']" }),
    disabledDays: code('Disabled weekdays (0 = Sunday)', ARRAY, [], { placeholder: '[0, 6]' }),
    weekStartsOn: choice('Week starts on', ['sunday', 'monday'], 'sunday'),
    numberOfMonths: code('Number of months', NUMBER, 1),
    showOutsideDays: toggle('Show outside days', true),
    fixedWeeks: toggle('Always six weeks'),
    fullWidth: toggle('Full width'),
    showBorder: toggle('Show border', true),
  },
  defaults: {
    mode: { value: 'single' },
    defaultValue: { value: '' },
    defaultMonth: { value: '' },
    markers: {
      value:
        "{{[{ date: moment().format('YYYY-MM-DD'), label: 'Stand-up' }, { date: moment().add(3, 'days').format('YYYY-MM-DD'), label: 'Release', color: '#16a34a' }, { date: moment().add(8, 'days').format('YYYY-MM-DD'), label: 'Review', color: '#f59e0b' }]}}",
    },
    minDate: { value: '' },
    maxDate: { value: '' },
    disabledDates: { value: '{{[]}}' },
    disabledDays: { value: '{{[]}}' },
    weekStartsOn: { value: 'sunday' },
    numberOfMonths: { value: '{{1}}' },
    showOutsideDays: { value: '{{true}}' },
    fixedWeeks: { value: '{{false}}' },
    fullWidth: { value: '{{false}}' },
    showBorder: { value: '{{true}}' },
  },
  styles: {
    backgroundColor: colorStyle('Background'),
    borderColor: colorStyle('Border color'),
    textColor: colorStyle('Day text color'),
    headerTextColor: colorStyle('Month title color'),
    mutedTextColor: colorStyle('Weekday and outside day color'),
    accentColor: colorStyle('Selected day background'),
    selectedTextColor: colorStyle('Selected day text color'),
    rangeBackgroundColor: colorStyle('Range background'),
    todayBackgroundColor: colorStyle('Today background'),
    hoverBackgroundColor: colorStyle('Day hover background'),
    markerColor: colorStyle('Marker dot color'),
    borderRadius: sizeStyle('Calendar radius'),
    cellSize: sizeStyle('Day size (px)'),
  },
  events: {
    onSelect: { displayName: 'On select' },
    onMonthChange: { displayName: 'On month change' },
  },
  exposedVariables: {
    value: '',
    selectedDate: '',
    selectedDates: [],
    startDate: '',
    endDate: '',
    visibleMonth: '',
    visibleStart: '',
    visibleEnd: '',
  },
  actions: [
    {
      handle: 'selectDate',
      displayName: 'Select date',
      params: [param('date', 'Date (YYYY-MM-DD)'), param('endDate', 'End date (range)')],
    },
    { handle: 'clear', displayName: 'Clear' },
    { handle: 'setMonth', displayName: 'Show month', params: [param('date', 'Date in the month')] },
  ],
});

// ---- Carousel ----------------------------------------------------------------------------------------------------

export const shadCarouselConfig = shadConfig({
  name: 'ShadCarousel',
  displayName: 'Carousel',
  description:
    "shadcn/ui carousel of slides [{ image, title?, description?, link? }] (or image URLs) with arrows and dots, loop, autoplay (interval ms, pauses on hover), slidesPerView 1 to 4, aspectRatio ('16/9', '4/3', '1/1', '21/9' or 'fill' to fill the widget's height), imageFit cover or contain, captions as an overlay or below. Exposed currentIndex, currentSlide and clickedSlide (with its index); events onSlideChange, onSlideClick (a slide's link also opens in a new tab); actions next, previous, goTo(index). Height follows the width and ratio (+28px for dots, +52px for captions below)",
  defaultSize: { width: 20, height: 320 },
  withHeight: true,
  properties: {
    slides: code('Slides', ARRAY, [], {
      placeholder: "[{ image: 'https://…/1.jpg', title: 'Summer sale', description: 'Up to 40% off', link: '' }]",
    }),
    defaultIndex: code('Start at slide (0-based)', NUMBER, 0),
    aspectRatio: select(
      'Aspect ratio',
      [
        ['16/9', '16:9'],
        ['4/3', '4:3'],
        ['3/2', '3:2'],
        ['1/1', 'Square'],
        ['21/9', '21:9'],
        ['3/4', '3:4 (portrait)'],
        ['fill', "Fill the widget's height"],
      ],
      '16/9'
    ),
    imageFit: choice('Image fit', ['cover', 'contain'], 'cover'),
    captionPosition: choice('Caption', ['overlay', 'below', 'none'], 'overlay'),
    slidesPerView: code('Slides per view (1 to 4)', NUMBER, 1),
    showArrows: toggle('Show arrows', true),
    showDots: toggle('Show dots', true),
    loop: toggle('Loop', true),
    autoplay: toggle('Autoplay'),
    interval: code('Autoplay interval (ms)', NUMBER, 5000),
    pauseOnHover: toggle('Pause on hover', true),
  },
  defaults: {
    slides: {
      value:
        "{{[{ image: 'https://picsum.photos/seed/tj-coast/1200/675', title: 'Coastal routes', description: 'Plan deliveries along the shoreline' }, { image: 'https://picsum.photos/seed/tj-city/1200/675', title: 'City hubs', description: 'Twelve depots, one dashboard' }, { image: 'https://picsum.photos/seed/tj-hills/1200/675', title: 'Mountain passes', description: 'Seasonal schedules at a glance' }]}}",
    },
    defaultIndex: { value: '{{0}}' },
    aspectRatio: { value: '16/9' },
    imageFit: { value: 'cover' },
    captionPosition: { value: 'overlay' },
    slidesPerView: { value: '{{1}}' },
    showArrows: { value: '{{true}}' },
    showDots: { value: '{{true}}' },
    loop: { value: '{{true}}' },
    autoplay: { value: '{{false}}' },
    interval: { value: '{{5000}}' },
    pauseOnHover: { value: '{{true}}' },
  },
  styles: {
    slideBackgroundColor: colorStyle('Slide background'),
    arrowBackgroundColor: colorStyle('Arrow background'),
    arrowColor: colorStyle('Arrow icon color'),
    dotColor: colorStyle('Dot color'),
    activeDotColor: colorStyle('Active dot color'),
    captionBackgroundColor: colorStyle('Caption overlay background'),
    captionTextColor: colorStyle('Caption overlay text color'),
    titleColor: colorStyle('Caption title color (below)'),
    descriptionColor: colorStyle('Caption description color (below)'),
    borderRadius: sizeStyle('Slide radius'),
    gap: sizeStyle('Gap between slides (px)'),
  },
  events: {
    onSlideChange: { displayName: 'On slide change' },
    onSlideClick: { displayName: 'On slide click' },
  },
  exposedVariables: { currentIndex: 0, currentSlide: {}, clickedSlide: {} },
  actions: [
    { handle: 'next', displayName: 'Next slide' },
    { handle: 'previous', displayName: 'Previous slide' },
    { handle: 'goTo', displayName: 'Go to slide', params: [param('index', 'Index (0-based)', '{{0}}')] },
  ],
});
