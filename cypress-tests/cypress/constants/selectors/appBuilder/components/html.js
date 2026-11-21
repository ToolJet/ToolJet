// Selectors for the HTML Viewer widget (frontend/src/AppBuilder/Widgets/Html.jsx).
// Pass the runtime name (e.g. "html1"). RenderWidget passes dataCy = componentName.
const widget = (name) => `[data-cy="draggable-widget-${name}"]`;
const container = (name) => `[data-cy="${name}"].html-widget-container`;

export const htmlSelector = {
  // WidgetWrapper grid box — the one the layout engine sizes and moves
  draggableWidget: widget,
  // Html.jsx:178-202 — the widget root: `overflow-y` scroller (html.scss:2-11), `dynamic-height` class,
  // inline display/height/minHeight, aria-disabled + inert while disabled
  container,
  // Html.jsx:206-211 — the content root that carries the background and the sanitized authored markup
  content: (name) => `${container(name)} > div`,
  // an element the spec authored inside the widget's raw HTML, by its id
  authored: (name, id) => `${container(name)} #${id}`,
  // the native <input> of a TextInput helper widget
  textInput: (name) => `${widget(name)} input`,
  // Container.jsx:302 — the inner canvas of a FlexContainer (appCanvas.scss:161 scrollbar rules)
  flexCanvas: (flexName) => `${widget(flexName)} .real-canvas.flex-container-canvas`,
};
