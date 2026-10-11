// shadcn/ui pack: page sections (Widgets/Shadcn/ShadSections.jsx): a page hero and a card grid. A section is one
// component with a designed layout inside, so an app reads as a product, and every part of it stays a property the
// visual builder edits (no free-form markup).
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
    "shadcn/ui page hero at the top of a page: eyebrow (small caps line above), title, subtitle, meta facts (['Sun, 11 Oct', '14 bookings'] or [{ label, value }]) and up to two actions (actionLabel, secondaryActionLabel; onActionClick, onSecondaryActionClick). background 'plain' (no panel), 'tint' (a soft panel in the accent), 'gradient' (accent wash), 'image' (imageUrl behind a dark overlay, white text) or 'dark' (deep accent panel, white text); icon (lucide name) in a rounded tile beside the title; align left or center; size compact, default or large. Styles accentColor (else the theme's primary), titleFontFamily ('serif', 'display', ...). Height: grows with its content (about 150px default, 120px compact, 220px large; add 40px for actions)",
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
    "shadcn/ui grid of cards from data, for things with a face (recipes, products, listings, people, rooms): each card shows an image (imageField; without one, a tinted panel with the title's initials), title, subtitle, a badge (badgeField, toned by its words: Available green, Low stock amber, Sold out red), a description (two lines) and a meta line (metaFields, a comma list; 'prep:{} min' puts the value in a label, 'serves:Serves' puts the label first). columns (a number, or 'auto' to fit cards of minCardWidth), imageAspect ('16/9', '4/3', '1/1'), cardStyle 'elevated', 'outline' or 'flat'. A click selects the card (selectedItem, selectedItemId; onCardClick). Height: grows with its rows (about 300px per row with an image, 150px without)",
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
