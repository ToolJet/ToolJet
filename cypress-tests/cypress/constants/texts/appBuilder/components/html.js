// Texts for the HTML Viewer widget. Config: packages/widget-definitions/src/widgets/html.js
export const htmlText = {
  displayName: "HTML Viewer", // html.js:3
  defaultWidgetName: "html1",
  widgetPrefix: "html",
  defaultSize: { width: 10, height: 310 }, // html.js:6-9
  // html.js:132-133 — the definition rawHtml of a freshly dropped widget renders this hero text
  heroText: "You can build your custom HTML-CSS template here",

  // Saved definition defaults — merged under every Html that addHtmlWidgetsViaApi posts (html.js:125-148)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // html.js:127
      showOnMobile: { value: "{{false}}" }, // html.js:128
    },
    properties: {
      rawHtml: { value: "<body><div><h1>Hello World</h1></div></body>" }, // html.js:16 (validation default)
      dynamicHeight: { value: "{{false}}" }, // html.js:135
      visibility: { value: "{{true}}" }, // html.js:136
      collapseWhenHidden: { value: "{{false}}" }, // html.js:137
      disabledState: { value: "{{false}}" }, // html.js:138
      loadingState: { value: "{{false}}" }, // html.js:139
      tooltip: { value: "" }, // html.js:140
      tooltipFormat: { value: "plainText" }, // html.js:141
    },
    styles: {
      backgroundColor: { value: "" }, // html.js:145
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // html.js:146
    },
  },

  // html.scss — scroll ownership
  scroll: {
    hiddenScrollbarWidth: "none", // html.scss:21-23 `.viewer .html-widget-container`
    shownScrollbarWidth: "auto", // html.scss:24-26 `&:hover` (and the browser default outside the viewer)
    fixedOverflowY: "auto", // html.scss:3
    dynamicOverflowY: "visible", // html.scss:8
    dynamicScrollbarColor: "auto", // html.scss:9
    thumbColorVar: "--interactive-selected", // html.scss:4
  },
  layoutGap: 20, // gap the seeded layouts leave between a widget and the one below it (px)
};
