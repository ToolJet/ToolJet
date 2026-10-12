// ToolJet UI 2.0: page sections (Widgets/Shadcn/ShadSections.jsx): a page hero, a card grid, a record list and a
// summary strip. A section is one component with a designed layout inside, so an app reads as a product, and every
// part of it stays a property the visual builder edits (no free-form markup).
import {
  ARRAY,
  NUMBER_OR_STRING,
  STRING,
  choice,
  code,
  colorStyle,
  select,
  shadConfig,
  sizeStyle,
  toggle,
} from './shadcnPackHelpers.js';

const ARRAY_OR_STRING = { type: 'union', schemas: [ARRAY, STRING] };
const TYPEFACES = [
  ['theme', 'Theme font'],
  ['sans', 'Sans serif'],
  ['serif', 'Serif'],
  ['display', 'Display serif'],
  ['mono', 'Monospace'],
];

// ---- Hero ------------------------------------------------------------------------------------------------------------

export const shadHeroConfig = shadConfig({
  name: 'ShadHero',
  displayName: 'Hero',
  description:
    "Page hero at the top of a page: eyebrow (small caps line above), title, subtitle, meta facts (['Sun, 11 Oct', '14 bookings'] or [{ label, value }]) and up to two actions (actionLabel, secondaryActionLabel; onActionClick, onSecondaryActionClick). background 'plain' (no panel), 'tint' (a soft panel in the accent), 'gradient' (accent wash), 'image' (imageUrl behind a dark overlay, white text) or 'dark' (deep accent panel, white text); icon (lucide name) in a rounded tile beside the title; align left or center; size compact, default or large. Styles accentColor (else the theme's primary), titleFontFamily ('serif', 'display', ...). Height: grows with its content (about 150px default, 120px compact, 220px large; add 40px for actions)",
  defaultSize: { width: 43, height: 200 },
  withHeight: true,
  properties: {
    eyebrow: code('Eyebrow', STRING, 'Operations'),
    title: code('Title', STRING, 'Good morning, Ada'),
    subtitle: code('Subtitle', STRING, ''),
    meta: code('Meta facts', ARRAY_OR_STRING, [], { placeholder: "['Sun, 11 Oct', '14 bookings']" }),
    actionLabel: code('Primary action label (empty hides it)', STRING, ''),
    secondaryActionLabel: code('Secondary action label (empty hides it)', STRING, ''),
    icon: code('Icon (lucide name, e.g. sparkles)', STRING, ''),
    background: choice('Background', ['plain', 'tint', 'gradient', 'image', 'dark'], 'tint'),
    imageUrl: code('Background image URL (background image)', STRING, ''),
    align: choice('Align', ['left', 'center'], 'left'),
    size: choice('Size', ['compact', 'default', 'large'], 'default'),
  },
  defaults: {
    eyebrow: { value: 'Operations' },
    title: { value: 'Good morning, Ada' },
    subtitle: { value: 'Here is what needs you today.' },
    meta: { value: "{{['Sun, 11 Oct', '14 bookings', '3 need a reply']}}" },
    actionLabel: { value: 'New booking' },
    secondaryActionLabel: { value: '' },
    icon: { value: '' },
    background: { value: 'tint' },
    imageUrl: { value: '' },
    align: { value: 'left' },
    size: { value: 'default' },
  },
  styles: {
    accentColor: colorStyle('Accent color'),
    backgroundColor: colorStyle('Panel background (overrides the background style)'),
    titleColor: colorStyle('Title color'),
    textColor: colorStyle('Subtitle and meta color'),
    borderRadius: sizeStyle('Panel radius'),
    titleFontFamily: select('Title typeface', TYPEFACES, 'theme'),
  },
  styleDefaults: { titleFontFamily: { value: 'theme' } },
  events: {
    onActionClick: { displayName: 'On primary action click' },
    onSecondaryActionClick: { displayName: 'On secondary action click' },
  },
});

// ---- Card grid -------------------------------------------------------------------------------------------------------

export const shadCardGridConfig = shadConfig({
  name: 'ShadCardGrid',
  displayName: 'Card grid',
  description:
    "Grid of cards from data, for things with a face (recipes, products, listings, people, rooms): each card shows an image when imageField is mapped (a row without a picture gets a tinted panel with the title's initials; no imageField, no picture area), title, subtitle, a badge (badgeField, toned by its words: Available green, Low stock amber, Sold out red), a description (two lines) and a meta line (metaFields, a comma list; 'prep:{} min' puts the value in a label, 'serves:Serves' puts the label first). columns (a number, or 'auto' to fit cards of minCardWidth), imageAspect ('16/9', '4/3', '1/1'), cardStyle 'elevated', 'outline' or 'flat'. A click selects the card (selectedItem, selectedItemId; onCardClick). Height: grows with its rows (about 300px per row with an image, 150px without)",
  defaultSize: { width: 43, height: 620 },
  withHeight: true,
  properties: {
    data: code('Data', ARRAY, [], { placeholder: "[{ id: 1, name: 'Lemon roast chicken', cuisine: 'Dinner' }]" }),
    titleField: code('Title field', STRING, 'name'),
    subtitleField: code('Subtitle field', STRING, ''),
    imageField: code('Image field (URL)', STRING, ''),
    badgeField: code('Badge field', STRING, ''),
    descriptionField: code('Description field', STRING, ''),
    metaFields: code("Meta fields (comma list; 'prep:{} min')", STRING, ''),
    idField: code('Id field', STRING, 'id'),
    columns: code("Columns (a number or 'auto')", NUMBER_OR_STRING, 3),
    minCardWidth: code('Minimum card width (px)', NUMBER_OR_STRING, 240),
    imageAspect: choice('Image shape', ['16/9', '4/3', '1/1'], '4/3'),
    showImage: toggle('Show image', true),
    cardStyle: choice('Card style', ['elevated', 'outline', 'flat'], 'elevated'),
    highlightSelected: toggle('Highlight the selected card', true),
    emptyText: code('Empty text', STRING, 'Nothing here yet'),
  },
  defaults: {
    data: {
      value:
        "{{[{ id: 1, name: 'Lemon herb roast chicken', cuisine: 'Dinner', prep: 20, serves: 4, note: 'Crisp skin, bright pan sauce' }, { id: 2, name: 'Miso glazed salmon', cuisine: 'Dinner', prep: 15, serves: 2, note: 'Sweet, salty, ten minutes under the grill' }, { id: 3, name: 'Blueberry oat pancakes', cuisine: 'Breakfast', prep: 10, serves: 3, note: 'Fluffy, no buttermilk needed' }]}}",
    },
    titleField: { value: 'name' },
    subtitleField: { value: '' },
    imageField: { value: '' },
    badgeField: { value: 'cuisine' },
    descriptionField: { value: 'note' },
    metaFields: { value: 'prep:{} min, serves:Serves' },
    idField: { value: 'id' },
    columns: { value: '{{3}}' },
    minCardWidth: { value: '{{240}}' },
    imageAspect: { value: '4/3' },
    showImage: { value: '{{true}}' },
    cardStyle: { value: 'elevated' },
    highlightSelected: { value: '{{true}}' },
    emptyText: { value: 'Nothing here yet' },
  },
  styles: {
    cardBackground: colorStyle('Card background'),
    borderColor: colorStyle('Card border color'),
    titleColor: colorStyle('Title color'),
    textColor: colorStyle('Subtitle and meta color'),
    accentColor: colorStyle('Selected card accent'),
    borderRadius: sizeStyle('Card radius'),
    titleFontFamily: select('Title typeface', TYPEFACES, 'theme'),
  },
  styleDefaults: { titleFontFamily: { value: 'theme' } },
  events: { onCardClick: { displayName: 'On card click' } },
  exposedVariables: { selectedItem: {}, selectedItemId: null },
});

// ---- Record list -----------------------------------------------------------------------------------------------------

const VALUE_FORMATS = ['auto', 'number', 'currency', 'percent', 'compact', 'date', 'datetime'];

export const shadRecordListConfig = shadConfig({
  name: 'ShadRecordList',
  displayName: 'Record list',
  description:
    "List of records as two-line rows, for a recent-orders, people, tickets or activity panel beside a chart or a table: an avatar (avatarField: an image URL, else the initials of that field's text, else of the title), the title (titleField), a meta line under it (metaFields, a comma list of field specs joined with ' · ': 'city', 'total|currency', 'due|date:Due {}' (value in a label), 'seats:Seats' (label first); formats number, currency, percent, compact, date, datetime), a status chip on the right (statusField, toned by its words: Paid green, Pending amber, Overdue red, Open blue) and a trailing value (valueField in valueFormat: currency in currency, date, number, ...). density compact, default or comfortable; showDividers; listStyle 'card' (bordered panel) or 'plain'; avatarShape circle or rounded. A click selects the row (selectedItem, selectedItemId; onRowClicked; the native List view's onRecordClicked, selectedRecord and selectedRecordId, the row's position in data). Draws 100 rows and a Show more button. Height: grows with its rows (about 60px a row at default density)",
  defaultSize: { width: 20, height: 340 },
  withHeight: true,
  properties: {
    data: code('Data', ARRAY, [], {
      placeholder: "[{ id: 1, customer: 'Harbor Bistro', contact: 'Maya Chen', status: 'Paid', total: 1240 }]",
    }),
    titleField: code('Title field', STRING, 'customer'),
    avatarField: code('Avatar field (image URL or a name; empty uses the title)', STRING, ''),
    metaFields: code("Meta fields (comma list; 'total|currency', 'due|date:Due {}')", STRING, ''),
    statusField: code('Status field (a chip toned by its words)', STRING, ''),
    valueField: code('Trailing value field', STRING, ''),
    valueFormat: select(
      'Trailing value format',
      VALUE_FORMATS.map((v) => [v, v === 'datetime' ? 'Date and time' : v.charAt(0).toUpperCase() + v.slice(1)]),
      'auto'
    ),
    currency: code('Currency (ISO code, e.g. USD)', STRING, 'USD'),
    idField: code('Id field', STRING, 'id'),
    showAvatar: toggle('Show avatar', true),
    avatarShape: choice('Avatar shape', ['circle', 'rounded'], 'circle'),
    density: choice('Density', ['compact', 'default', 'comfortable'], 'default'),
    showDividers: toggle('Show dividers', true),
    listStyle: choice('List style', ['card', 'plain'], 'card'),
    highlightSelected: toggle('Highlight the selected row', true),
    emptyText: code('Empty text', STRING, 'Nothing here yet'),
  },
  defaults: {
    data: {
      value:
        "{{[{ id: 1, customer: 'Harbor Bistro', contact: 'Maya Chen', due: '2026-10-14', status: 'Paid', total: 1240 }, { id: 2, customer: 'Northwind Florists', contact: 'Owen Hart', due: '2026-10-16', status: 'Pending', total: 386.5 }, { id: 3, customer: 'Juniper Dental', contact: 'Priya Nair', due: '2026-10-09', status: 'Overdue', total: 2915 }, { id: 4, customer: 'Copper Kettle Cafe', contact: 'Leo Martins', due: '2026-10-21', status: 'Draft', total: 742 }]}}",
    },
    titleField: { value: 'customer' },
    avatarField: { value: '' },
    metaFields: { value: 'contact, due|date:Due {}' },
    statusField: { value: 'status' },
    valueField: { value: 'total' },
    valueFormat: { value: 'currency' },
    currency: { value: 'USD' },
    idField: { value: 'id' },
    showAvatar: { value: '{{true}}' },
    avatarShape: { value: 'circle' },
    density: { value: 'default' },
    showDividers: { value: '{{true}}' },
    listStyle: { value: 'card' },
    highlightSelected: { value: '{{true}}' },
    emptyText: { value: 'Nothing here yet' },
  },
  styles: {
    backgroundColor: colorStyle('List background'),
    borderColor: colorStyle('Border and divider color'),
    titleColor: colorStyle('Title and value color'),
    textColor: colorStyle('Meta line color'),
    accentColor: colorStyle('Selected row accent'),
    borderRadius: sizeStyle('List radius'),
    titleFontFamily: select('Title typeface', TYPEFACES, 'theme'),
  },
  styleDefaults: { titleFontFamily: { value: 'theme' } },
  // The native List view's names as well: onRecordClicked, selectedRecord and selectedRow (the clicked row's data),
  // selectedRecordId and selectedRowId (its position in data).
  events: {
    onRowClicked: { displayName: 'On row clicked' },
    onRecordClicked: { displayName: 'Record clicked' },
  },
  exposedVariables: {
    selectedItem: {},
    selectedItemId: null,
    selectedRecord: {},
    selectedRecordId: null,
    selectedRow: {},
    selectedRowId: null,
  },
});

// ---- Summary strip ---------------------------------------------------------------------------------------------------

export const shadSummaryStripConfig = shadConfig({
  name: 'ShadSummaryStrip',
  displayName: 'Summary strip',
  description:
    "Strip of 3 to 6 headline figures in one row with hairline separators (no card per figure), to sit above or beside a table or a chart: items [{ label, value, format, delta, deltaFormat, tone, lowerIsBetter, caption }] (at most 6 shown). value formats in the item's format, else valueFormat (auto: currency for money labels such as Revenue or Average order, a grouped number otherwise; number, currency in currency, percent, compact, date). delta: a number is signed and shown in deltaFormat (percent: 12.5 shows +12.5%; number; currency), text shows as written ('+3 this week'); its colour is the item's tone (positive, negative, neutral), else its sign (up green, down red; lowerIsBetter flips it for churn, refunds, wait times). caption is a small line under the figure ('vs last month'). appearance 'panel' (one bordered panel) or 'plain'; size sm, default or lg; align left or center. Narrow widths wrap figures into rows. Height: about 90px (sm 70px, lg 110px) a row, plus 18px with captions",
  defaultSize: { width: 43, height: 100 },
  withHeight: true,
  properties: {
    items: code('Figures', ARRAY, [], {
      placeholder: "[{ label: 'Revenue', value: 48210, delta: 12.4, caption: 'vs last month' }]",
    }),
    valueFormat: select(
      'Value format',
      VALUE_FORMATS.filter((v) => v !== 'datetime').map((v) => [v, v.charAt(0).toUpperCase() + v.slice(1)]),
      'auto'
    ),
    currency: code('Currency (ISO code, e.g. USD)', STRING, 'USD'),
    deltaFormat: choice('Change format (numbers)', ['percent', 'number', 'currency'], 'percent'),
    appearance: choice('Appearance', ['panel', 'plain'], 'panel'),
    size: choice('Size', ['sm', 'default', 'lg'], 'default', { sm: 'Small', lg: 'Large' }),
    align: choice('Align', ['left', 'center'], 'left'),
  },
  defaults: {
    items: {
      value:
        "{{[{ label: 'Revenue', value: 48210, delta: 12.4, caption: 'vs last month' }, { label: 'Orders', value: 1284, format: 'number', delta: 5.1, caption: 'vs last month' }, { label: 'Average order', value: 37.55, delta: -2.3, caption: 'vs last month' }, { label: 'Refund rate', value: 2.1, format: 'percent', delta: -0.4, deltaFormat: 'number', lowerIsBetter: true, caption: 'points' }]}}",
    },
    valueFormat: { value: 'auto' },
    currency: { value: 'USD' },
    deltaFormat: { value: 'percent' },
    appearance: { value: 'panel' },
    size: { value: 'default' },
    align: { value: 'left' },
  },
  styles: {
    backgroundColor: colorStyle('Panel background'),
    borderColor: colorStyle('Border and separator color'),
    labelColor: colorStyle('Label and caption color'),
    valueColor: colorStyle('Figure color'),
    positiveColor: colorStyle('Positive change color'),
    negativeColor: colorStyle('Negative change color'),
    borderRadius: sizeStyle('Panel radius'),
    valueFontFamily: select('Figure typeface', TYPEFACES, 'theme'),
  },
  styleDefaults: { valueFontFamily: { value: 'theme' } },
});
