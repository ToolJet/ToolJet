// Pure data: which events each page type fires, and how the page settings UI titles them.
// Single source of truth shared with backend validation - the server mirror lives in
// server/src/modules/app-validation/catalog/pages.json and
// frontend/src/AppBuilder/__tests__/validationCatalogParity.spec.js fails on any drift.
// Page types url/app/group fire no events on purpose.
export const PAGE_EVENTS_META = {
  default: {
    title: 'Page events',
    events: { onPageLoad: { displayName: 'On page load' } },
  },
  custom: {
    title: 'Events',
    events: { onClick: { displayName: 'On click' } },
  },
};
