// Selectors for the Library component widget (frontend/src/AppBuilder/Widgets/LibraryComponent.jsx).
// Pass the runtime name (e.g. "focusprobe1"). RenderWidget passes dataCy = componentName, and
// LibraryComponent puts it on the <iframe> (configured) or on the Slot placeholder (unconfigured).
const widget = (name) => `[data-cy="draggable-widget-${name}"]`;

export const libraryComponentSelector = {
  // WidgetWrapper grid box — the one the layout engine sizes and moves
  draggableWidget: widget,
  // RenderWidget.jsx:337-347 — the padded inner box the widget renders into
  innerBox: (name) => `.canvas-component${widget(name)}`,
  // LibraryComponent.jsx:273-284 — the sandboxed shell iframe
  iframe: (name) => `${widget(name)} iframe[data-cy="${name}"]`,

  // Components panel › library picker on the Components tab (LibraryPicker.jsx); a custom library's choice is
  // `lib:<id>` with every non-alphanumeric run turned into '-' (componentLibrary.js libraryChoices)
  libraryPicker: '[data-cy="component-library-picker"]',
  libraryChoice: (libraryId) => `[data-cy="component-library-${`lib:${libraryId}`.replace(/[^a-z0-9]+/gi, "-")}"]`,
  librarySection: (slug) => `[data-cy="custom-library-${slug}"]`, // CustomComponentsTab.jsx:137
  versionChip: (slug) => `[data-cy="custom-library-version-${slug}"]`, // CustomComponentsTab.jsx:211
  versionMenuRow: ".custom-library-version-menu .version-menu-row", // CustomComponentsTab.jsx:218
  componentCard: (exportName) => `[data-cy="custom-component-${exportName.toLowerCase()}"]`, // CustomComponentsTab.jsx:340

  // Inspector accordions (_ui/Accordion/AccordionItem.js: data-cy="widget-accordion-<title kebab>")
  accordion: (title) => `[data-cy="widget-accordion-${String(title).toLowerCase().replace(/\s+/g, "-")}"]`,
};
