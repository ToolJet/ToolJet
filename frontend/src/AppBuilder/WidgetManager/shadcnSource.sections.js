// ToolJet UI 2.0: page sections (Widgets/Shadcn/ShadSections.jsx): a page hero, a card grid, a record list and a
// summary strip. A section is one component with a designed layout inside, so an app reads as a product, and every
// part of it stays a property the visual builder edits (no free-form markup).
import {
  ARRAY,
  NUMBER,
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
    "Page hero at the top of a page: eyebrow (small caps line above), title, subtitle, meta facts (['Sun, 11 Oct', '14 bookings'] or [{ label, value }]), an aside on the right and up to two actions (actionLabel, secondaryActionLabel; onActionClick, onSecondaryActionClick). The aside is one headline figure (asideValue 12480 or '$12,480', asideLabel 'Revenue today' above it) or a short list of facts (asideValue [{ label: 'Open', value: 14 }, { label: 'Due today', value: 3 }], up to 4, asideLabel as their heading). Greetings and header facts belong in the hero itself: 'Good morning, Ada' as the title, one line of what needs attention as the subtitle, today's date and counts as meta chips, the one number that matters in the aside; never a separate Text or Stat floating beside or over the header. With an aside, the actions sit under the text. background 'plain' (no panel), 'tint' (a soft panel in the accent), 'gradient' (accent wash), 'image' (imageUrl behind a dark overlay, white text) or 'dark' (deep accent panel, white text); icon (lucide name) in a rounded tile beside the title; align left or center (the aside goes under the text); size compact, default or large. Styles accentColor (else the theme's primary), titleFontFamily ('serif', 'display', ...). Height: grows with its content (about 150px default, 120px compact, 220px large; add 40px for actions under the text)",
  defaultSize: { width: 43, height: 200 },
  withHeight: true,
  properties: {
    eyebrow: code('Eyebrow', STRING, 'Operations'),
    title: code('Title', STRING, 'Good morning, Ada'),
    subtitle: code('Subtitle', STRING, ''),
    meta: code('Meta facts', ARRAY_OR_STRING, [], {
      placeholder: "['Sun, 11 Oct', '14 bookings']",
    }),
    actionLabel: code('Primary action label (empty hides it)', STRING, ''),
    secondaryActionLabel: code('Secondary action label (empty hides it)', STRING, ''),
    asideValue: code('Aside: a figure, or a list of facts', { type: 'union', schemas: [STRING, NUMBER, ARRAY] }, '', {
      placeholder: "12480, or [{ label: 'Open', value: 14 }]",
    }),
    asideLabel: code("Aside label (the figure's caption, the facts' heading)", STRING, ''),
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
    asideValue: { value: '' },
    asideLabel: { value: '' },
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
    "Grid of cards from data, for things with a face (recipes, products, listings, people, rooms, projects): each card shows an image when imageField is mapped (a row without a picture gets a tinted panel with the title's initials; no imageField, no picture area), an eyebrow (eyebrowField: a small caps line above the title, such as a category or a code), an avatar beside the title (avatarField: an image URL, else the initials of that field's text; for people and owners), title, subtitle, badges (badgeField, plus badgeFields for more: 'cuisine, diet', at most 4; each toned by its words: Available green, Low stock amber, Sold out red), a description (two lines), a progress bar (progressField: a percentage 0 to 100, as 42 or '42%') and a meta line (metaFields, a comma list; 'prep:{} min' puts the value in a label, 'serves:Serves' puts the label first). layout 'stacked' (image on top) or 'row' (image left, text right: listings, people, a compact catalogue). columns (a number, or 'auto' to fit cards of minCardWidth), imageAspect ('16/9', '4/3', '1/1'; stacked only), cardStyle 'elevated', 'outline' or 'flat'. A click selects the card (selectedItem, selectedItemId; onCardClick). Height: grows with its rows (about 300px per row stacked with an image, 150px without or in rows)",
  defaultSize: { width: 43, height: 620 },
  withHeight: true,
  properties: {
    data: code('Data', ARRAY, [], {
      placeholder: "[{ id: 1, name: 'Lemon roast chicken', cuisine: 'Dinner' }]",
    }),
    titleField: code('Title field', STRING, 'name'),
    subtitleField: code('Subtitle field', STRING, ''),
    imageField: code('Image field (URL)', STRING, ''),
    badgeField: code('Badge field', STRING, ''),
    badgeFields: code("More badge fields (comma list, e.g. 'diet, spice')", ARRAY_OR_STRING, ''),
    eyebrowField: code('Eyebrow field (a small line above the title)', STRING, ''),
    avatarField: code('Avatar field (image URL or a name)', STRING, ''),
    descriptionField: code('Description field', STRING, ''),
    progressField: code('Progress field (a percentage, 0 to 100)', STRING, ''),
    metaFields: code("Meta fields (comma list; 'prep:{} min')", STRING, ''),
    idField: code('Id field', STRING, 'id'),
    layout: choice('Layout', ['stacked', 'row'], 'stacked', {
      stacked: 'Image on top',
      row: 'Image left',
    }),
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
    badgeFields: { value: '' },
    eyebrowField: { value: '' },
    avatarField: { value: '' },
    descriptionField: { value: 'note' },
    progressField: { value: '' },
    metaFields: { value: 'prep:{} min, serves:Serves' },
    idField: { value: 'id' },
    layout: { value: 'stacked' },
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
    "List of records as two-line rows, for a recent-orders, people, tickets or activity panel beside a chart or a table: an avatar (avatarField: an image URL, else the initials of that field's text, else of the title), the title (titleField), a meta line under it (metaFields, a comma list of field specs joined with ' · ': 'city', 'total|currency', 'due|date:Due {}' (value in a label), 'seats:Seats' (label first); formats number, currency, percent, compact, date, datetime), a progress bar under the meta line (progressField: a percentage 0 to 100, as 42 or '42%'; onboarding, a project's completion), a status chip on the right (statusField, toned by its words: Paid green, Pending amber, Overdue red, Open blue) and a trailing value (valueField in valueFormat: currency in currency, date, number, ...). density compact, default or comfortable; showDividers; listStyle 'card' (bordered panel) or 'plain'; avatarShape circle or rounded. A click selects the row (selectedItem, selectedItemId; onRowClicked; the native List view's onRecordClicked, selectedRecord and selectedRecordId, the row's position in data). Draws 100 rows and a Show more button. Height: grows with its rows (about 60px a row at default density)",
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
    progressField: code('Progress field (a percentage, 0 to 100)', STRING, ''),
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
    progressField: { value: '' },
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

// ---- Progress list ---------------------------------------------------------------------------------------------------

export const shadProgressListConfig = shadConfig({
  name: 'ShadProgressList',
  displayName: 'Progress list',
  description:
    "List of progress rows from data, for goals, budgets, quotas, onboarding steps and capacity: each row has a label (labelField), its value against a target ('$18,400 of $25,000': valueField, targetField, in valueFormat: auto, number, currency in currency, percent, compact), a progress bar, an optional status (statusField: a chip toned by its words, On track green, At risk amber, Over budget or Behind red; a status that only names a tone, success, warning, danger, info or neutral, colours the bar without a chip) and an optional trailing caption under the bar ('12 days left': captionField). The percentage is percentField when the data has one (0 to 100), else value / target; a row with a value and no target reads the value as the percentage. autoTone colours bars from their percentage when the row has no status: 'goal' green at 100%, 'limit' (budgets, quotas, storage) amber from 80% and red over 100%. showValues and showPercent pick the figures shown; barSize thin, default or thick; listStyle 'card' (bordered panel) or 'plain'. A click on a row exposes selectedItem and selectedItemId and fires onItemClick (rows look clickable only when it is handled). Use a Stat or a Summary strip for one headline figure, a Progress for a single bar. Height: grows with its rows (about 64px a row, 76px with captions)",
  defaultSize: { width: 20, height: 330 },
  withHeight: true,
  properties: {
    data: code('Data', ARRAY, [], {
      placeholder: "[{ id: 1, label: 'Marketing', spent: 18400, budget: 25000, status: 'On track' }]",
    }),
    labelField: code('Label field', STRING, 'label'),
    valueField: code('Value field', STRING, 'value'),
    targetField: code('Target field', STRING, 'target'),
    percentField: code('Percent field (0 to 100; overrides value / target)', STRING, ''),
    captionField: code('Caption field (a line under the bar)', STRING, ''),
    statusField: code('Status field (a chip, or a tone name)', STRING, ''),
    valueFormat: select(
      'Value format',
      ['auto', 'number', 'currency', 'percent', 'compact'].map((v) => [v, v.charAt(0).toUpperCase() + v.slice(1)]),
      'auto'
    ),
    currency: code('Currency (ISO code, e.g. USD)', STRING, 'USD'),
    idField: code('Id field', STRING, 'id'),
    autoTone: choice('Tone from progress', ['none', 'goal', 'limit'], 'none', {
      limit: 'Limit',
    }),
    showValues: toggle('Show value of target', true),
    showPercent: toggle('Show percentage', true),
    barSize: choice('Bar size', ['thin', 'default', 'thick'], 'default'),
    listStyle: choice('List style', ['card', 'plain'], 'card'),
    emptyText: code('Empty text', STRING, 'Nothing to track yet'),
  },
  defaults: {
    data: {
      value:
        "{{[{ id: 1, label: 'Marketing', spent: 18400, budget: 25000, status: 'On track', note: '12 days left in the quarter' }, { id: 2, label: 'Engineering tools', spent: 9100, budget: 10000, status: 'At risk', note: 'Renewals due in November' }, { id: 3, label: 'Travel', spent: 7600, budget: 6000, status: 'Over budget', note: 'Over by $1,600' }, { id: 4, label: 'Training', spent: 1200, budget: 5000, status: '', note: 'Courses start in November' }]}}",
    },
    labelField: { value: 'label' },
    valueField: { value: 'spent' },
    targetField: { value: 'budget' },
    percentField: { value: '' },
    captionField: { value: 'note' },
    statusField: { value: 'status' },
    valueFormat: { value: 'currency' },
    currency: { value: 'USD' },
    idField: { value: 'id' },
    autoTone: { value: 'none' },
    showValues: { value: '{{true}}' },
    showPercent: { value: '{{true}}' },
    barSize: { value: 'default' },
    listStyle: { value: 'card' },
    emptyText: { value: 'Nothing to track yet' },
  },
  styles: {
    backgroundColor: colorStyle('List background'),
    borderColor: colorStyle('Border and divider color'),
    titleColor: colorStyle('Label and value color'),
    textColor: colorStyle('Caption color'),
    accentColor: colorStyle('Bar color (rows without a tone)'),
    trackColor: colorStyle('Bar track color'),
    borderRadius: sizeStyle('List radius'),
    titleFontFamily: select('Label typeface', TYPEFACES, 'theme'),
  },
  styleDefaults: { titleFontFamily: { value: 'theme' } },
  events: { onItemClick: { displayName: 'On item click' } },
  exposedVariables: { selectedItem: {}, selectedItemId: null },
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
    size: choice('Size', ['sm', 'default', 'lg'], 'default', {
      sm: 'Small',
      lg: 'Large',
    }),
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
