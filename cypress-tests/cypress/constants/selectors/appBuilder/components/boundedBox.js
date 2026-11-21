// Selectors for the Bounded Box widget (frontend/src/AppBuilder/Widgets/BoundedBox/).
// Pass the runtime name (e.g. "boundedbox1"). The widget renders no data-cy of its own: everything below the
// grid wrapper is reached through its class names and DOM structure (react-image-annotation@0.9.10 Annotation.js:
// Container > [Img, Items, Target, Overlay, editor]).
const widget = (name) => `[data-cy="draggable-widget-${name}"]`;

export const boundedBoxSelector = {
  draggableWidget: widget,
  // BoundedBox.jsx:184-188 — the widget root (display/height/boxShadow)
  root: (name) => `${widget(name)} .bounded-box`,
  // Annotation.js Img — the annotated <img src={imageUrl}>
  img: (name) => `${widget(name)} .bounded-box img`,
  // RenderEditor.jsx:25-35 — the label picker of the annotation being created (a direct child of the Container)
  editor: (name) => `${widget(name)} .bounded-box > div > .col`,
  editorControl: (name) => `${widget(name)} .bounded-box > div > .col .react-select__control`,
  // RenderHighlight.jsx:34-45 — one row per committed annotation: [delete span, label select]
  highlightRow: (name) => `${widget(name)} .bounded-box .row.m-0`,
  highlightDelete: (name) => `${widget(name)} .bounded-box .row.m-0 > span`,
  highlightControl: (name) => `${widget(name)} .bounded-box .row.m-0 .react-select__control`,
  highlightInput: (name) => `${widget(name)} .bounded-box .row.m-0 input`,
  // _ui/Select menu (useMenuPortal → rendered under <body>)
  option: ".react-select__option",
  menu: ".react-select__menu",
};
