// The primary buttons take the app's own brand colour (the one the builder sets in the app theme), as the table's
// old Save button did, not the platform's fixed button colours. Hover and press darken it instead of swapping it.
const BRAND = 'tw-bg-[var(--cc-primary-brand)]';

// Scrolling areas of the form (and its menus) get the table's scrollbar colour, as the table body does (table-component.scss).
export const SCROLL_AREA_CLASS = 'table-add-new-row-scroll';

export const THEME_PRIMARY_BUTTON_CLASS = [
  BRAND,
  `hover:${BRAND}`,
  `active:${BRAND}`,
  `disabled:${BRAND}`,
  'hover:tw-brightness-90',
  'active:tw-brightness-75',
].join(' ');
