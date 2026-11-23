// Texts for the Text Editor widget (RichTextEditor). Config: packages/widget-definitions/src/widgets/richtextarea.js
export const richTextEditorText = {
  displayName: "Text Editor", // richtextarea.js:3
  defaultWidgetName: "richtexteditor1", // richtextarea.js:2 name lower-cased + 1
  widgetPrefix: "richtexteditor",
  defaultSize: { width: 16, height: 210 }, // richtextarea.js:6-9
  defaultPlaceholder: "Placeholder text", // richtextarea.js:111
  defaultValueInspector: '""', // definition defaultValue '' (richtextarea.js:112)

  // Saved definition defaults — merged under every Text Editor that addRichTextEditorsViaApi posts (richtextarea.js:105-122)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // richtextarea.js:107
      showOnMobile: { value: "{{false}}" }, // richtextarea.js:108
    },
    properties: {
      placeholder: { value: "Placeholder text" }, // richtextarea.js:111
      defaultValue: { value: "" }, // richtextarea.js:112
      loadingState: { value: "{{false}}" }, // richtextarea.js:113
      dynamicHeight: { value: "{{false}}" }, // richtextarea.js:114
      collapseWhenHidden: { value: "{{false}}" }, // richtextarea.js:115
    },
    styles: {
      visibility: { value: "{{true}}" }, // richtextarea.js:119
      disabledState: { value: "{{false}}" }, // richtextarea.js:120
    },
  },

  // Toolbar (DraftEditor.jsx:53-132): heading labels, icon file per block / inline style
  headings: ["H1", "H2", "H3", "H4", "H5", "H6"], // DraftEditor.jsx:53-60
  headingMenuLabel: "Heading", // DraftEditor.jsx:90
  icons: {
    blockquote: "blockquote", // DraftEditor.jsx:64
    ul: "ul", // DraftEditor.jsx:68
    ol: "ol", // DraftEditor.jsx:72
    codeBlock: "codeblock", // DraftEditor.jsx:76
    bold: "bold", // DraftEditor.jsx:121
    italic: "italic", // DraftEditor.jsx:125
    underline: "underline", // DraftEditor.jsx:129
  },

  // disabled widgets: RenderWidget adds `disabled` to the `.canvas-component` grid box (RenderWidget.jsx:328-333), which
  // dims it and turns pointer events off; the editor wrapper inherits pointer-events none (the custom.scss:40
  // `div[data-disabled='true']` rule TESTING.md cites is not in the loaded CSS)
  disabledGridClass: "disabled", // RenderWidget.jsx:332
  disabledPointerEvents: "none",
  // DraftEditor.jsx:303 — fixed (non-dynamic) editor area is `height - 60`; ResizeObserver then sets
  // `height - 46 - controlsHeight` (DraftEditor.jsx:199)
  chromeHeight: 46,
  layoutGap: 20, // gap the seeded layouts leave between a widget and the one below it (px)
};
