// Selectors for the PDF widget (frontend/src/AppBuilder/Widgets/PDF.jsx, react-pdf 10 / pdfjs-dist 5).
// Pass the runtime name (e.g. "pdf1"). RenderWidget puts data-cy="draggable-widget-<name>" on the grid node and
// PDF.jsx:215 puts data-cy="<name>" on its own root. Nothing inside the widget carries a data-cy: the card, the
// scroll wrapper, the footer and the download button are reached through their classes / aria-labels.
const widget = (name) => `[data-cy="draggable-widget-${name}"]`;
const root = (name) => `[data-cy="${name}"]`;
// PDF.jsx:216-227 — the bordered card (border / radius / boxShadow)
const card = (name) => `${root(name)} > .flex-column`;
// PDF.jsx:228-236 — the scroll wrapper (id="pdf-wrapper" is repeated by every instance, so it is scoped)
const scroller = (name) => `${card(name)} > .scrollable`;
// PDF.jsx:239-243 — the footer row (only class: border-top)
const footer = (name) => `${card(name)} > .border-top`;

export const pdfSelector = {
  draggableWidget: widget,
  // PDF.jsx:215 — outer root sized `width - 3` x `height` (display from the visibility style)
  root,
  card,
  scroller,
  footer,
  // react-pdf's document node and its pages (data-page-number) / page canvases / text layer
  document: (name) => `${scroller(name)} .react-pdf__Document`,
  page: (name, n) => `${scroller(name)} .react-pdf__Page${n ? `[data-page-number="${n}"]` : ""}`,
  // react-pdf's load-error / no-data message (".react-pdf__message--error")
  errorMessage: (name) => `${scroller(name)} .react-pdf__message--error`,
  // PDF.jsx:248-270 — page controls (accessible names are the only stable hooks)
  pageControls: (name) => `${footer(name)} .pdf-page-controls`,
  prevButton: (name) => `${footer(name)} button[aria-label="Previous page"]`,
  nextButton: (name) => `${footer(name)} button[aria-label="Next page"]`,
  pageIndicator: (name) => `${footer(name)} .pdf-page-controls > span`,
  // PDF.jsx:273-289 — the download "button" (a clickable div, not a <button>)
  downloadButton: (name) => `${footer(name)} .download-icon-outer-wrapper`,
  downloadLabel: (name) => `${footer(name)} .download-icon-outer-wrapper > span`,
  // PDF.jsx:153-172 — the password-prompt-closed state and its Retry button (data-cy is a hard-coded
  // "draggable-widget-button3", so it is scoped by its class instead)
  retryButton: (name) => `${scroller(name)} .pdf-retry-button`,
  // helper widgets
  textInput: (name) => `${widget(name)} input`,
};
