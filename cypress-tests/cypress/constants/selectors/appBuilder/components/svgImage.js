// Selectors for the Svg Image widget (frontend/src/AppBuilder/Widgets/SvgImage.jsx).
// Pass the runtime name (e.g. "svgimage1").
const widget = (name) => `[data-cy="draggable-widget-${name}"]`;
// SvgImage.jsx:8 — the widget's own container (`overflow: hidden`, height = widgetHeight - 4); RenderWidget.jsx:367
// passes the component name as its data-cy
const container = (name) => `${widget(name)} [data-cy="${name}"]`;

export const svgImageSelector = {
  draggableWidget: widget,
  container,
  // SvgImage.jsx:9-14 — the role="img" flex box holding the sanitised markup
  image: (name) => `${container(name)} > [role="img"]`,
  // the rendered <svg> root
  svg: (name) => `${container(name)} > [role="img"] > svg`,
};
