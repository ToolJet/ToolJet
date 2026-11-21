// Selectors for the Circular Progressbar widget (frontend/src/AppBuilder/Widgets/CircularProgressBar/CirularProgressbar.jsx).
// Pass the runtime name (e.g. "circularprogressbar1"). RenderWidget passes dataCy = componentName (RenderWidget.jsx:367).
export const circularProgressBarSelector = {
  // RenderWidget.jsx:339-346 — inner box: BOX_PADDING / padding:none
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // CirularProgressbar.jsx:132 — outer root: display flex/none + box-shadow (stays still while loading)
  root: (name) => `[data-cy="draggable-widget-${name}"] [data-cy="${name}"]`,
  // CirularProgressbar.jsx:133 — inner flex container: justify-content = alignment, rotates while loading
  inner: (name) => `[data-cy="draggable-widget-${name}"] [data-cy="${name}"] > div`,
  // react-circular-progressbar root <svg class="CircularProgressbar"> (dist/index.js:109)
  svg: (name) => `[data-cy="draggable-widget-${name}"] [data-cy="${name}"] svg.CircularProgressbar`,
  label: (name) => `[data-cy="draggable-widget-${name}"] [data-cy="${name}"] .CircularProgressbar-text`,
};
