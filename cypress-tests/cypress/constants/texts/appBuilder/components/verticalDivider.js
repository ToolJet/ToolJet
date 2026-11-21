// Texts for the Vertical Divider widget. Config: packages/widget-definitions/src/widgets/verticalDivider.js
export const verticalDividerText = {
  displayName: "Vertical divider", // verticalDivider.js:3
  componentType: "VerticalDivider", // verticalDivider.js:5
  defaultWidgetName: "verticaldivider1", // verticalDivider.js:2 name → computeComponentName (appCanvasUtils.js:322)
  widgetPrefix: "verticaldivider",

  // Registered default size (verticalDivider.js:6-9): one grid column wide, 100 rows tall
  defaultGridWidth: 1, // verticalDivider.js:7
  defaultHeight: 100, // verticalDivider.js:8
  gridColumns: 43, // NO_OF_GRIDS (appCanvasConstants.js:1)

  // Saved definition defaults — the payload addDividersViaApi posts (verticalDivider.js:98-115)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // verticalDivider.js:100
      showOnMobile: { value: "{{false}}" }, // verticalDivider.js:101
    },
    properties: {
      visibility: { value: "{{true}}" }, // verticalDivider.js:104
      tooltip: { value: "" }, // verticalDivider.js:105
      tooltipFormat: { value: "plainText" }, // verticalDivider.js:106
    },
    styles: {
      dividerColor: { value: "var(--cc-default-border)" }, // verticalDivider.js:110
      dividerStyle: { value: "solid" }, // verticalDivider.js:111
      padding: { value: "default" }, // verticalDivider.js:112
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // verticalDivider.js:113
    },
  },

  // Option values
  styleSolid: "solid", // verticalDivider.js:68
  styleDashed: "dashed", // verticalDivider.js:69
  defaultBorderVar: "--cc-default-border", // verticalDivider.js:57 validation default
  defaultShadowComputed: "rgba(0, 0, 0, 0.25) 0px 0px 0px 0px", // verticalDivider.js:78 '0px 0px 0px 0px #00000040'

  // Runtime literals (VerticalDivider.jsx)
  dashWidth: 4, // VerticalDivider.jsx:2 DASH_WIDTH
  dashGap: 4, // VerticalDivider.jsx:3 DASH_GAP
  lineWidth: 1, // VerticalDivider.jsx:19 width '1px'
  boxPadding: 2, // RenderWidget.jsx:343 BOX_PADDING (appCanvasConstants.js:57)
};
