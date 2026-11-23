// Texts for the JSON Editor widget. Config: packages/widget-definitions/src/widgets/jsonEditor.js
// Runtime: frontend/src/AppBuilder/Widgets/JSONEditor/JSONEditor.jsx + jsonEditor.scss
export const jsonEditorText = {
  componentType: "JSONEditor", // jsonEditor.js:2
  displayName: "JSON Editor", // jsonEditor.js:3
  defaultWidgetName: "jsoneditor1",
  widgetPrefix: "jsoneditor",
  defaultSize: { width: 15, height: 120 }, // jsonEditor.js:6-9
  // the definition document's first key/value (jsonEditor.js:186) — what a freshly dropped widget shows
  defaultDocumentText: '"text": "Hello World"',

  // Saved definition defaults — merged under every JSON Editor that addJsonWidgetsViaApi posts
  // (jsonEditor.js:179-205)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // jsonEditor.js:181
      showOnMobile: { value: "{{false}}" }, // jsonEditor.js:182
    },
    properties: {
      value: {
        value: `{{{ \n\ttext : "Hello World", \n\tnumber : 64, \n\tboolean : true, \n\tnullValue : null, \n\tfruits : [\n\t\t"banana",\n\t\t"mango",\n\t\t"grape"\n\t], \n\tobjectA : { \n\t\tvalue : "testing", \n\t\tenabled : false \n\t}, \n\titems : [] \n}}}`, // jsonEditor.js:186
      },
      theme: { value: "solarized" }, // jsonEditor.js:188
      shouldExpandEntireJSON: { value: "{{true}}" }, // jsonEditor.js:189
      loadingState: { value: "{{false}}" }, // jsonEditor.js:190
      visibility: { value: "{{true}}" }, // jsonEditor.js:191
      collapseWhenHidden: { value: "{{false}}" }, // jsonEditor.js:193
      disabledState: { value: "{{false}}" }, // jsonEditor.js:194
      dynamicHeight: { value: "{{false}}" }, // jsonEditor.js:195
      tooltip: { value: "" }, // jsonEditor.js:196
      tooltipFormat: { value: "plainText" }, // jsonEditor.js:197
    },
    styles: {
      borderRadius: { value: "{{6}}" }, // jsonEditor.js:201
      borderColor: { value: "var(--cc-weak-border)" }, // jsonEditor.js:202
      backgroundColor: { value: "var(--cc-surface1-surface)" }, // jsonEditor.js:203
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // jsonEditor.js:204
    },
  },

  // The four documented themes (jsonEditor.js:27-30) and the CodeMirror theme each one loads
  // (loadCodeMirrorTheme — JSONEditor.jsx:16-30). `background` is that theme's own editor background, the
  // proof that the async import settled and the theme was applied.
  themes: {
    monokai: { background: "rgb(39, 40, 34)" }, // @uiw/codemirror-theme-monokai/src/color.ts:2 '#272822'
    solarized: { background: "rgb(0, 43, 54)" }, // @uiw/codemirror-theme-solarized/src/dark-color.ts:2 '#002B36'
    tomorrow: { background: "rgb(0, 36, 81)" }, // @uiw/codemirror-theme-tomorrow-night-blue/src/color.ts:2 '#002451'
    bespin: { background: "rgb(40, 33, 28)" }, // @uiw/codemirror-theme-bespin/src/index.ts:12 '#28211c'
  },

  // Readability floors (WCAG 2.x contrast ratio): syntax tokens use the 3:1 floor (AA large text / UI);
  // the lint tooltip is prose and uses the 4.5:1 body-text floor.
  contrast: { token: 3, tooltip: 4.5 },

  // jsonEditor.scss
  gutter: {
    minWidth: 42, // jsonEditor.scss:15 `min-width: 42px` (D-09: width auto + 42px floor)
    position: "sticky", // CodeMirror base theme `.cm-gutters` — pinned to the scroller's left edge
    // the pre-D-09 rule: the gutter pinned to 42px (used only as an in-test control that must make numbers spill)
    pinnedWidthCss: ".canvas-component .json-editor-widget .cm-gutters.cm-gutters { width: 42px !important; }",
  },
  scroller: {
    overflowX: "auto", // jsonEditor.scss:25 (D-08: was hidden)
    overscrollBehaviorX: "none", // jsonEditor.scss:27 (D-08 overscroll note)
  },
  // theme.scss:3851-3854 — the platform rule the RenderWidget `disabled` class turns on
  disabled: { className: "disabled", opacity: "0.5", pointerEvents: "none" },
  // CodeMirror's JSON linter debounce is ~750ms (TESTING.md D-03) — wait past it before reading lint state
  lintSettleMs: 1500,
  layoutGap: 20, // gap the seeded layouts leave between a widget and the one below it (px)
};
