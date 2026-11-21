// Texts for the Horizontal Divider widget. Config: packages/widget-definitions/src/widgets/divider.js
export const dividerText = {
  displayName: "Horizontal Divider", // divider.js:3
  componentType: "Divider", // divider.js:5
  defaultWidgetName: "horizontaldivider1", // divider.js:2 name → computeComponentName (appCanvasUtils.js:322)
  widgetPrefix: "horizontaldivider",

  // Saved definition defaults — the payload addDividersViaApi posts (divider.js:141-161)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // divider.js:143
      showOnMobile: { value: "{{false}}" }, // divider.js:144
    },
    properties: {
      label: { value: "" }, // divider.js:147
      visibility: { value: "{{true}}" }, // divider.js:148
      tooltip: { value: "" }, // divider.js:149
      tooltipFormat: { value: "plainText" }, // divider.js:150
    },
    styles: {
      dividerColor: { value: "var(--cc-default-border)" }, // divider.js:154
      labelAlignment: { value: "center" }, // divider.js:155
      dividerStyle: { value: "solid" }, // divider.js:156
      labelColor: { value: "var(--cc-placeholder-text)" }, // divider.js:157
      textWrap: { value: "wrap" }, // divider.js:158
      padding: { value: "default" }, // divider.js:159
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // divider.js:160
    },
  },

  // Option values
  styleSolid: "solid", // divider.js:75
  styleDashed: "dashed", // divider.js:76
  alignLeft: "left", // divider.js:87
  alignCenter: "center", // divider.js:88
  alignRight: "right", // divider.js:89
  wrap: "wrap", // divider.js:110
  noWrap: "nowrap", // divider.js:111
  defaultBorderVar: "--cc-default-border", // divider.js:64 validation default

  // Runtime literals (Divider.jsx)
  dashWidth: 4, // Divider.jsx:4 DASH_WIDTH
  dashGap: 4, // Divider.jsx:5 DASH_GAP
  lineMinWidthShare: 0.1, // Divider.jsx:20 minWidth '10%'
  labelLineHeight: 16, // Divider.jsx:42
  labelGap: 8, // Divider.jsx:86/102/110 label padding towards the line
  noWrapMaxShareCenter: 0.8, // Divider.jsx:49 maxWidth '80%'
  noWrapMaxShareSide: 0.9, // Divider.jsx:49 maxWidth '90%'

  // Inspector labels
  accordionDivider: "Divider", // divider.js:66 accordian
};
