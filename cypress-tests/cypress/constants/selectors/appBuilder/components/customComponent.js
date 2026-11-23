// Selectors for the Custom Component widget (frontend/src/AppBuilder/Widgets/CustomComponent/CustomComponent.jsx).
// Pass the runtime name (e.g. "customcomponent1"). RenderWidget passes dataCy = componentName.
const widget = (name) => `[data-cy="draggable-widget-${name}"]`;
const card = (name) => `[data-cy="${name}"].card`;

export const customComponentSelector = {
  // WidgetWrapper grid box — the one the layout engine sizes and moves
  draggableWidget: widget,
  // CustomComponent.jsx:170-183 — the wrapper carrying border / radius / shadow / outline inline styles
  card,
  // CustomComponent.jsx:185-191 — the srcdoc frame that runs the author code (iframe.html)
  frame: (name) => `${card(name)} > iframe`,
  // the native <input> of a TextInput helper widget
  textInput: (name) => `${widget(name)} input`,
  // Inspector/Components/CustomComponent.jsx:33-48 — the Code CodeHinter. It is rendered without a paramLabel,
  // so its data-cy is the literal "undefined-input-field" (data-cy gap); scope through its className instead.
  codeEditor: ".custom-component-inspector-multiline .cm-content",
  codeEditorLines: ".custom-component-inspector-multiline .cm-line",
  // InspectorAccordion title of the Code section (AccordionItem data-cy `label-<title>`)
  codeAccordionLabel: '[data-cy="label-code"]',
  // Styles → Border radius number box
  borderRadiusInput: '[data-cy="border-radius-input"]',
};
