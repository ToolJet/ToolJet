// Texts for the Pagination widget. Config: packages/widget-definitions/src/widgets/pagination.js
// Runtime: frontend/src/AppBuilder/Widgets/Pagination/Pagination.jsx
export const paginationText = {
  displayName: "Pagination", // pagination.js:3
  componentType: "Pagination", // pagination.js:5
  defaultWidgetName: "pagination1", // pagination.js:2 name → computeComponentName
  widgetPrefix: "pagination",

  // Saved definition defaults — the payload addPaginationsViaApi posts (pagination.js:107-129)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // pagination.js:110
      showOnMobile: { value: "{{false}}" }, // pagination.js:111
    },
    properties: {
      numberOfPages: { value: "{{5}}" }, // pagination.js:114-116
      defaultPageIndex: { value: "{{1}}" }, // pagination.js:117-119
      loadingState: { value: "{{false}}" }, // pagination.js:120
      visibility: { value: "{{true}}" }, // pagination.js:121
      disabledState: { value: "{{false}}" }, // pagination.js:122
    },
    styles: {
      alignment: { value: "left" }, // pagination.js:126
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // pagination.js:127
    },
  },
  defaultSize: { width: 10, height: 30 }, // pagination.js:6-9 (grid columns × px)
  defaultNumberOfPages: 5, // pagination.js:115
  defaultPageIndex: 1, // pagination.js:118

  // Operator aria-labels, in row order (Pagination.jsx:225-237, 175-210)
  operators: {
    first: "Go to first page", // Pagination.jsx:228
    previous: "Go to previous page", // Pagination.jsx:232
    next: "Go to next page", // Pagination.jsx:234
    last: "Go to last page", // Pagination.jsx:230
  },
  rootAriaLabel: "Pagination", // Pagination.jsx:152
  ellipsis: "...", // Pagination.jsx:409,427
  activeClass: "active", // Pagination.jsx:395
  disabledClass: "disabled", // Pagination.jsx:324-326 (boundary operator) / RenderWidget inner node (Disable)
  operatorWidth: 28, // Pagination.jsx:358 — operator CSS minimum (1.25rem icon + .25rem padding each side)
  sixItemFloor: 168, // D-07: <<, <, ..., last page, >, >> at 28px each — below it the row's right end is clipped
  enabledCursor: "pointer", // Pagination.jsx:336 inline cursor on operators; .page-link on page numbers
};
