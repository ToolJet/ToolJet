// Texts for the Text widget. Config: packages/widget-definitions/src/widgets/text.js
export const textText = {
  displayName: "Text", // text.js:3
  defaultWidgetName: "text1",
  widgetPrefix: "text",
  defaultSize: { width: 6, height: 40 }, // text.js:101-104
  // text.js:305 — the drop-time text greets the current user: "Hello <firstName>👋"
  greetingPrefix: "Hello ",
  greetingSuffix: "👋",

  // Saved definition defaults — merged under every Text that addTextsViaApi posts (text.js:297-336)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // text.js:299
      showOnMobile: { value: "{{false}}" }, // text.js:300
    },
    properties: {
      textFormat: { value: "html" }, // text.js:303
      dynamicHeight: { value: "{{false}}" }, // text.js:304
      text: { value: "Hello" }, // text.js:305 (greeting binding dropped: posted widgets always set their own text)
      loadingState: { value: "{{false}}" }, // text.js:306
      disabledState: { value: "{{false}}" }, // text.js:307
      visibility: { value: "{{true}}" }, // text.js:308
      collapseWhenHidden: { value: "{{false}}" }, // text.js:310
      tooltipFormat: { value: "plainText" }, // text.js:311
      tooltip: { value: "" }, // text.js:312
    },
    styles: {
      backgroundColor: { value: "#fff00000" }, // text.js:316
      textColor: { value: "var(--cc-primary-text)" }, // text.js:317
      textSize: { value: "{{14}}" }, // text.js:318
      textAlign: { value: "left" }, // text.js:319
      fontWeight: { value: "normal" }, // text.js:320
      decoration: { value: "none" }, // text.js:321
      transformation: { value: "none" }, // text.js:322
      fontStyle: { value: "normal" }, // text.js:323
      lineHeight: { value: "{{1.5}}" }, // text.js:324
      textIndent: { value: "{{0}}" }, // text.js:325
      letterSpacing: { value: "{{0}}" }, // text.js:326
      wordSpacing: { value: "{{0}}" }, // text.js:327
      fontVariant: { value: "normal" }, // text.js:328
      verticalAlignment: { value: "center" }, // text.js:329
      padding: { value: "default" }, // text.js:330
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // text.js:331
      borderColor: { value: "#ffffff00" }, // text.js:332
      borderRadius: { value: "{{6}}" }, // text.js:333
      isScrollRequired: { value: "enabled" }, // text.js:334
    },
  },

  // Option values
  formats: { plainText: "plainText", markdown: "markdown", html: "html" }, // text.js:15-17
  horizontalAlignments: ["left", "center", "right", "justify"], // text.js:160-168, AlignButtons.jsx:24,45,66,87
  verticalAlignments: ["top", "center", "bottom"], // text.js:176-178
  scrollEnabled: "enabled", // text.js:153
  scrollDisabled: "disabled", // text.js:154

  // Runtime literals
  // Text.jsx:194-200 — the content scroller's overflow-y: `auto` when Scroll is enabled (never `scroll`, which
  // reserves a scrollbar on classic-scrollbar platforms — commit 0f1f32d01d), `hidden` when disabled
  scrollerOverflowEnabled: "auto",
  scrollerOverflowDisabled: "hidden",
  // RenderWidget.jsx:330-334 + theme.scss `.disabled` — the disabled/loading interaction gate
  disabledClass: "disabled",
  disabledPointerEvents: "none",
  layoutGap: 10, // dynamic: vertical gap (px) the specs leave between stacked widgets
};
