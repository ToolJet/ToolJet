// Texts for the Icon widget. Config: packages/widget-definitions/src/widgets/icon.js
export const iconText = {
  displayName: "Icon", // icon.js:3
  defaultWidgetName: "icon1",
  widgetPrefix: "icon",
  defaultIcon: "IconHome2", // icon.js:20

  // Saved definition defaults — the payload addIconsViaApi posts (icon.js:145-165)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // icon.js:147
      showOnMobile: { value: "{{false}}" }, // icon.js:148
    },
    properties: {
      icon: { value: "IconHome2" }, // icon.js:151
      loadingState: { value: "{{false}}" }, // icon.js:152
      disabledState: { value: "{{false}}" }, // icon.js:153
      visibility: { value: "{{true}}" }, // icon.js:154
      tooltip: { value: "" }, // icon.js:155
      tooltipFormat: { value: "plainText" }, // icon.js:156
    },
    styles: {
      iconColor: { value: "var(--cc-default-icon)" }, // icon.js:160
      iconAlign: { value: "center" }, // icon.js:161
      padding: { value: "default" }, // icon.js:162
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // icon.js:163
    },
  },

  // Option values
  alignLeft: "left", // Icon.jsx:106 iconAlign → justify-content
  alignCenter: "center", // icon.js:95 default
  alignRight: "right", // Icon.jsx:106
  paddingDefault: "default", // icon.js:108
  paddingNone: "none", // icon.js:109
  defaultIconColorVar: "--cc-default-icon", // icon.js:86

  // Runtime literals
  boxPadding: 2, // appCanvasConstants.js:57 BOX_PADDING (RenderWidget.jsx:343)
  eventOnClick: "onClick", // icon.js:77
  eventOnHover: "onHover", // icon.js:78

  // First <path d> of the default glyph — TablerIcon replaces the tabler-icon-<name> class, so the glyph is
  // identified by its path. source: @tabler/icons-react IconHome2 (rendered in Icon.jsx:119)
  home2PathD: "M5 12l-2 0l9 -9l9 9l-2 0",

  // Inspector labels
  disable: "Disable", // icon.js:68
};
