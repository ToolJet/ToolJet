// Selectors for the Image widget (frontend/src/AppBuilder/Widgets/Image/Image.jsx).
// Pass the runtime name (e.g. "image1"). `draggable-widget-<name>` matches the grid `.canvas-component`
// first (the box the layout engine sizes) and Image.jsx:353's own `.image-widget-wrapper` second.
const widget = (name) => `[data-cy="draggable-widget-${name}"]`;

export const imageSelector = {
  draggableWidget: widget,
  // Image.jsx:361 — the widget's own root (height 'auto' + minHeight when dynamic height is on)
  wrapper: (name) => `${widget(name)} .image-widget-wrapper`,
  // Image.jsx:200-202 — the rendered <img>
  img: (name) => `${widget(name)} img.zoom-image-wrap`,
  // Image.jsx:179 — LazyLoad placeholder shown until the top-level image mounts
  placeholder: (name) => `${widget(name)} .skeleton-image`,
  // Image.jsx:317-326 — zoom pointer surface (hover/click/drag handlers)
  zoomSurface: (name) => `${widget(name)} .transform-component-wrapper`,
  // react-zoom-pan-pinch TransformComponent content — carries `translate(x, y) scale(s)`
  zoomContent: (name) => `${widget(name)} .react-transform-component`,
  // viewer scroll container; Image.jsx:370 LazyLoad scrollContainer
  canvasScroller: ".canvas-content",
};
