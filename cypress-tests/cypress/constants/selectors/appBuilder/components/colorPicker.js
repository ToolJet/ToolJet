// Selectors for the Color Picker widget (frontend/src/AppBuilder/Widgets/ColorPicker/ColorPicker.jsx).
// Pass the runtime name (e.g. "colorpicker1"). RenderWidget passes dataCy = componentName (RenderWidget.jsx:367).
export const colorPickerSelector = {
  // RenderWidget.jsx box around the widget
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // ColorPicker.jsx:312-329 — widget root `.color-picker-widget` (data-cy = component name)
  root: (name) => `[data-cy="${name}"]`,
  // ColorPicker.jsx:353-367 — the Radix Popover trigger button
  button: (name) => `[data-cy="${name}-button"]`,
  // ColorPicker.jsx:375-379 — swatch + displayed color code inside the button
  preview: (name) => `[data-cy="${name}-button"] .color-preview`,
  colorCode: (name) => `[data-cy="${name}-button"] .color-code`,
  // ColorPicker.jsx:402-413 — portalled popover content
  popover: (name) => `[data-cy="${name}-popover"]`,
  // ColorPicker.jsx:414-421 — react-color SketchPicker inside the popover
  sketchPicker: (name) => `[data-cy="${name}-popover"] .sketch-picker`,
  // react-color common/Saturation.js:159 — the saturation/value square (absolute, fills its pointer-tracking container)
  saturation: (name) => `[data-cy="${name}-popover"] .saturation-white`,
  // react-color common/Hue.js:119 — the horizontal hue strip (its own pointer-tracking container)
  hue: (name) => `[data-cy="${name}-popover"] .hue-horizontal`,
};
