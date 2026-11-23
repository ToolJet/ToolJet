// Texts for the Link widget. Config: packages/widget-definitions/src/widgets/link.js
export const linkText = {
  displayName: "Link", // link.js:3
  defaultWidgetName: "link1",
  widgetPrefix: "link",
  defaultLinkText: "Click here", // link.js:232
  defaultLinkTarget: "https://dev.to/", // link.js:231

  // Inspector labels
  visibility: "Visibility", // link.js:50
  disable: "Disable", // link.js:59
  dynamicHeight: "Dynamic height", // link.js:65
  collapseWhenHidden: "Collapse when hidden", // link.js:71
  accordionAdditionalActions: "Additional Actions",

  // Saved definition defaults — the payload addLinksViaApi posts (link.js:225-253)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // link.js:227
      showOnMobile: { value: "{{false}}" }, // link.js:228
    },
    properties: {
      linkTarget: { value: "https://dev.to/" }, // link.js:231
      linkText: { value: "Click here" }, // link.js:232
      targetType: { value: "new" }, // link.js:233
      visibility: { value: "{{true}}" }, // link.js:234
      disabledState: { value: "{{false}}" }, // link.js:235
      dynamicHeight: { value: "{{false}}" }, // link.js:236
      collapseWhenHidden: { value: "{{false}}" }, // link.js:237
      tooltip: { value: "" }, // link.js:238
      tooltipFormat: { value: "plainText" }, // link.js:239
      loadingState: { value: "{{false}}" }, // link.js:240
    },
    styles: {
      textColor: { value: "var(--cc-primary-brand)" }, // link.js:244
      textSize: { value: "{{14}}" }, // link.js:245
      underline: { value: "on-hover" }, // link.js:246
      verticalAlignment: { value: "center" }, // link.js:247
      horizontalAlignment: { value: "left" }, // link.js:248
      padding: { value: "default" }, // link.js:249
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // link.js:250
      icon: { value: "IconLink" }, // link.js:251
      iconVisibility: { value: false }, // link.js:252
    },
  },

  // Option values
  targetNew: "new", // link.js:35
  targetSame: "same", // link.js:36
  underlineOnHover: "on-hover", // link.js:160
  alignTop: "top", // link.js:140
  alignCenter: "center", // link.js:141
  alignBottom: "bottom", // link.js:142

  // Runtime literals
  blankTarget: "_blank", // Link.jsx:161 target={targetType === 'new' && '_blank'}
  hoverColorVar: "--link-hover-color", // Link.jsx:64
  brandTokenVar: "--cc-primary-brand", // link.js:244
  iconGap: 4, // Link.jsx:197 marginRight: '4px'
  iconSizeExtra: 2, // Link.jsx:66 iconSize = textSize + 2
};
