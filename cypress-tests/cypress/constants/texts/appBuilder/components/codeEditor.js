// Texts for the Code Editor widget. Config: packages/widget-definitions/src/widgets/codeEditor.js
export const codeEditorText = {
  displayName: "Code Editor", // codeEditor.js:3
  defaultWidgetName: "codeeditor1", // codeEditor.js:2 name lower-cased + 1
  widgetPrefix: "codeeditor",
  defaultSize: { width: 15, height: 120 }, // codeEditor.js:6-9
  defaultValueInspector: '""', // exposedVariables.value '' (codeEditor.js:105)

  // Saved definition defaults — merged under every Code Editor that addCodeEditorsViaApi posts (codeEditor.js:114-134)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // codeEditor.js:116
      showOnMobile: { value: "{{false}}" }, // codeEditor.js:117
    },
    properties: {
      dynamicHeight: { value: "{{false}}" }, // codeEditor.js:120
      collapseWhenHidden: { value: "{{false}}" }, // codeEditor.js:121
      enableLineNumber: { value: "{{true}}" }, // codeEditor.js:122
      mode: { value: "javascript" }, // codeEditor.js:123
      placeholder: { value: "" }, // codeEditor.js:124
    },
    styles: {
      visibility: { value: "{{true}}" }, // codeEditor.js:128
      disabledState: { value: "{{false}}" }, // codeEditor.js:129
      borderRadius: { value: "{{6}}" }, // codeEditor.js:130
      borderColor: { value: "var(--cc-weak-border)" }, // codeEditor.js:131
      backgroundColor: { value: "var(--cc-surface1-surface)" }, // codeEditor.js:132
    },
  },

  // the five modes the runtime registers (CodeEditor.jsx:15-21); the spec uses three distinct grammars
  modes: { javascript: "javascript", python: "python", sql: "sql" },

  // codeEditor.scss (D-07) — gutter / horizontal-scroll contract
  gutterMinWidth: 42, // codeEditor.scss:20 `.cm-gutters { min-width: 42px }`
  overscrollX: "none", // codeEditor.scss:26 `.cm-scroller { overscroll-behavior-x: none }`
  fixedMaxHeight: "320px", // CodeEditor.jsx:111 `maxHeight: '320px'` without dynamic height

  layoutGap: 20, // gap the seeded layouts leave between a widget and the one below it (px)
  // readability floors (WCAG 2.x relative-luminance contrast): body text AA, highlighted tokens / line numbers the
  // large-text / non-text minimum
  contrast: { text: 4.5, token: 3 },
};
