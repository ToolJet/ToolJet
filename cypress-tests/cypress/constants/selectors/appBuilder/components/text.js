// Selectors for the Text widget (frontend/src/AppBuilder/Widgets/Text.jsx).
// Pass the runtime name (e.g. "text1"). RenderWidget passes dataCy = componentName (RenderWidget.jsx:367).
const widget = (name) => `[data-cy="draggable-widget-${name}"]`;
const root = (name) => `[data-cy="${name}-text"].text-widget`;

export const textSelector = {
  // RenderWidget box (`.canvas-component`, gets the `disabled` class while disabled/loading — RenderWidget.jsx:330-334)
  draggableWidget: widget,
  // Text.jsx:204-217 — the widget root: inline height / display, onClick + onMouseEnter handlers
  root,
  // Text.jsx:219 — `.text-widget-section`: flex column carrying justify-content (vertical alignment) + text-align
  section: (name) => `${root(name)} > .text-widget-section`,
  // Text.jsx:221/224/234 — the per-format content box; it is the element that scrolls (overflow-y from Scroll)
  scroller: (name) => `${root(name)} > .text-widget-section > div`,
  // an element the spec authored inside the widget's markup, by its id
  authored: (name, id) => `${root(name)} #${id}`,
  // Text.jsx:243-249 — the loader shown instead of the content while loading
  loader: (name) => `${root(name)} > div:not(.text-widget-section) center`,
  // the native <input> of a TextInput helper widget
  textInput: (name) => `${widget(name)} input`,
};
