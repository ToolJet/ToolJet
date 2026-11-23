// Selectors for the Button widget (frontend/src/AppBuilder/Widgets/Button.jsx).
// Pass the runtime name (e.g. "button1"). RenderWidget passes dataCy = componentName (RenderWidget.jsx:367).
export const buttonSelector = {
  // RenderWidget.jsx:340-347 — inner box: BOX_PADDING (2px) or padding:none, carries the `disabled` class
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // Button.jsx:212-237 — the real <button class="jet-btn">: background/border/radius/shadow/hover live here
  button: (name) => `[data-cy="${name}-button"]`,
  // Button.jsx:256-269 — the label <p> (font size/weight, text colour)
  label: (name) => `[data-cy="${name}-label"]`,
  // Button.jsx:275-284 — TablerIcon <svg> (rendered only while iconVisibility is on)
  icon: (name) => `[data-cy="${name}-icon"]`,
  // Button.jsx:290 → Loader.jsx:9-20 — no data-cy on the loader; scoped to the button
  loaderSvg: (name) => `[data-cy="${name}-button"] .tj-widget-loader svg`,
  // Styles-tab segmented switch option (Switch.jsx `togglr-button-<value>`)
  switchOption: (value) => `[data-cy="togglr-button-${value}"]`,
};
