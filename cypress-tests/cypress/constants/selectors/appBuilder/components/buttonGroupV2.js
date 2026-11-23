// Selectors for the Button Group widget (frontend/src/AppBuilder/Widgets/ButtonGroupV2/ButtonGroupV2.jsx).
// Pass the runtime name (e.g. "buttongroup1"). RenderWidget passes dataCy = componentName (RenderWidget.jsx:367).
export const buttonGroupV2Selector = {
  // RenderWidget.jsx — inner box (BOX_PADDING); its parent is the WidgetWrapper (`.ele-<id>`, grid height)
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // ButtonGroupV2.jsx:336-355 — role=group root (d-none when hidden, tw-flex-row-reverse / flex-column label layout)
  root: (name) => `[data-cy="draggable-widget-${name}"] .button-group-widget[data-cy="${name}"]`,
  // Label.jsx:83-98 — `<label data-cy="<name>-label">`
  label: (name) => `[data-cy="draggable-widget-${name}"] [data-cy="${name}-label"]`,
  // ButtonGroupV2.jsx:372 — the scroll/height wrapper (inline height / min-height / overflow / justify-content)
  contentWrapper: (name) => `[data-cy="draggable-widget-${name}"] .button-group-content-wrapper`,
  // ButtonGroupV2.jsx:380 — the flex group of buttons (direction / wrap)
  content: (name) => `[data-cy="draggable-widget-${name}"] .button-group-content`,
  // ButtonGroupV2.jsx:382-383 — one native <button data-cy="<name>-button-<index>"> per option
  button: (name, index) => `[data-cy="draggable-widget-${name}"] [data-cy="${name}-button-${index}"]`,
  buttons: (name) => `[data-cy="draggable-widget-${name}"] button.button-group-button`,
};
