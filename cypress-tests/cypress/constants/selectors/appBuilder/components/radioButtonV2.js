// Selectors for the Radio Button (V2) widget (frontend/src/AppBuilder/Widgets/RadioButtonV2/RadioButtonV2.jsx).
// Pass the runtime name (e.g. "radiobutton1"). RenderWidget passes dataCy = componentName (RenderWidget.jsx:367).
export const radioButtonV2Selector = {
  // RenderWidget.jsx:340-347 — inner box: BOX_PADDING / padding:none; its parent is the WidgetWrapper (grid box)
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // RadioButtonV2.jsx:240-265 — role=radiogroup root (`invisible` class when hidden)
  root: (name) => `[data-cy="draggable-widget-${name}"] [role="radiogroup"]`,
  // _ui/Label.jsx:98 — the widget label (<label data-cy="<name>-label"> wrapping the coloured <p>)
  label: (name) => `[data-cy="${name}-label"]`,
  labelText: (name) => `[data-cy="${name}-label"] p`,
  // RadioButtonV2.jsx:286-293 — the options scroller (overflow per layout, RadioButtonV2.jsx:234)
  options: (name) => `[data-cy="draggable-widget-${name}"] .radio-button-options`,
  // RadioButtonV2.jsx:299 — one <label> per visible option
  optionContainers: (name) => `[data-cy="draggable-widget-${name}"] label.radio-button-container`,
  // RadioButtonV2.jsx:300-312 — option caption
  optionLabel: (name, index) => `[data-cy="${name}-option-label-${index}"]`,
  // RadioButtonV2.jsx:313-331 — the (visually hidden) native radio input
  optionInput: (name, index) => `[data-cy="${name}-option-input-${index}"]`,
  // RadioButtonV2.jsx:332-346 — the painted circle (the input's next sibling) with its ::after handle
  checkmark: (name, index) => `[data-cy="${name}-option-input-${index}"] + .checkmark`,
  // WidgetTooltip.jsx:69 — Radix tooltip content (portalled); Radix also renders a visually hidden copy
  tooltip: '[data-cy="widget-tooltip"]',
  // WidgetTooltip.jsx:28-36 — one body node per format
  tooltipPlain: '[data-cy="widget-tooltip"] span.tw-whitespace-pre-wrap',
  tooltipMarkdown: '[data-cy="widget-tooltip"] .widget-tooltip-markdown',
  tooltipHtml: '[data-cy="widget-tooltip"] .widget-tooltip-html',
};
