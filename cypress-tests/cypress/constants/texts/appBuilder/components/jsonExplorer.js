// Texts for the JSON Explorer widget. Config: packages/widget-definitions/src/widgets/jsonExplorer.js
// Runtime: frontend/src/AppBuilder/Widgets/JSONExplorer/JSONExplorer.jsx + jsonExplorer.scss (react-json-tree 0.18)
export const jsonExplorerText = {
  componentType: "JSONExplorer", // jsonExplorer.js:2
  displayName: "JSON Explorer", // jsonExplorer.js:3
  defaultWidgetName: "jsonexplorer1",
  widgetPrefix: "jsonexplorer",
  defaultSize: { width: 15, height: 120 }, // jsonExplorer.js:6-9
  // the definition document (jsonExplorer.js:191) rendered expanded (shouldExpandEntireJSON true — :194) with the
  // root node shown (:195): root + 7 keys + 3 fruits + 2 objectA keys = 13 rows
  defaultRootLabel: "root:",
  defaultFirstKey: "text:",
  defaultFirstValue: '"Hello World"', // jsonExplorer.js:191
  defaultNodeCount: 13,

  // Saved definition defaults — merged under every JSON Explorer that addJsonExplorersViaApi posts
  // (jsonExplorer.js:184-211)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // jsonExplorer.js:186
      showOnMobile: { value: "{{false}}" }, // jsonExplorer.js:187
    },
    properties: {
      value: {
        value: `{{{ \n\ttext : "Hello World", \n\tnumber : 64, \n\tboolean : true, \n\tnullValue : null, \n\tfruits : [\n\t\t"banana",\n\t\t"mango",\n\t\t"grape"\n\t], \n\tobjectA : { \n\t\tvalue : "testing", \n\t\tenabled : false \n\t}, \n\titems : [] \n}}}`, // jsonExplorer.js:191
      },
      theme: { value: "solarized" }, // jsonExplorer.js:193
      shouldExpandEntireJSON: { value: "{{true}}" }, // jsonExplorer.js:194
      shouldShowRootNode: { value: "{{true}}" }, // jsonExplorer.js:195
      loadingState: { value: "{{false}}" }, // jsonExplorer.js:196
      visibility: { value: "{{true}}" }, // jsonExplorer.js:197
      collapseWhenHidden: { value: "{{false}}" }, // jsonExplorer.js:199
      disabledState: { value: "{{false}}" }, // jsonExplorer.js:200
      dynamicHeight: { value: "{{false}}" }, // jsonExplorer.js:201
      tooltip: { value: "" }, // jsonExplorer.js:202
      tooltipFormat: { value: "plainText" }, // jsonExplorer.js:203
    },
    styles: {
      borderRadius: { value: "{{6}}" }, // jsonExplorer.js:207
      borderColor: { value: "var(--cc-weak-border)" }, // jsonExplorer.js:208
      backgroundColor: { value: "var(--cc-surface1-surface)" }, // jsonExplorer.js:209
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // jsonExplorer.js:210
    },
  },

  // The four documented themes (jsonExplorer.js:26-31). Their palettes come from react-base16-styling
  // (getBase16Theme — JSONExplorer.jsx:65), so no colour is pinned here (TESTING.md D-01): the spec asserts
  // contrast against the painted background and that the four palettes differ.
  themes: ["monokai", "solarized", "tomorrow", "bespin"],
  // Readability floor (WCAG 2.x contrast ratio) for every painted text run of the tree — the same 3:1
  // token floor as the sibling JSON Editor's BRW-003.
  contrast: { token: 3 },

  // theme.scss:3851-3854 — the platform rule the RenderWidget `disabled` class turns on
  disabled: { className: "disabled", opacity: "0.5", pointerEvents: "none" },
  layoutGap: 20, // gap the seeded layouts leave between a widget and the one below it (px)
};
