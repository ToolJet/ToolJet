// Texts for the Spinner widget. Config: packages/widget-definitions/src/widgets/spinner.js
export const spinnerText = {
  displayName: "Spinner", // spinner.js:3
  componentType: "Spinner", // spinner.js:5
  defaultWidgetName: "spinner1", // spinner.js:2 name → computeComponentName (appCanvasUtils.js)
  widgetPrefix: "spinner",

  // Saved definition defaults — the payload addSpinnersViaApi posts (spinner.js:47-58)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // spinner.js:49
      showOnMobile: { value: "{{false}}" }, // spinner.js:50
    },
    properties: {}, // spinner.js:52
    styles: {
      visibility: { value: "{{true}}" }, // spinner.js:55
      size: { value: "sm" }, // spinner.js:56
      colour: { value: "var(--cc-primary-brand)" }, // spinner.js:57
    },
  },

  // Size option values / inspector labels (spinner.js:33-43)
  sizeSmall: "sm", // spinner.js:37
  sizeLarge: "lg", // spinner.js:38
  sizeSmallLabel: "small", // spinner.js:37
  sizeLargeLabel: "large", // spinner.js:38
  parameterSize: "Size", // spinner.js:35
  sizeClassPrefix: "spinner-border-", // Spinner.jsx:14 className `spinner-border spinner-border-${size}`

  // Computed geometry (frontend/src/_styles/tabler.scss)
  smDiameter: 16, // tabler.scss:6156-6158 .spinner-border-sm { width/height: 1rem }
  lgDiameter: 24, // tabler.scss:6129-6132 .spinner-border { width/height: 1.5rem } (no .spinner-border-lg rule)
  boxPadding: 2, // RenderWidget.jsx:343 BOX_PADDING
};
