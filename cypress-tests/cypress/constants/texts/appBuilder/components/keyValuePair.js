// Texts for the Key Value Pair widget. Config: packages/widget-definitions/src/widgets/keyValuePair.js
// Runtime: frontend/src/AppBuilder/Widgets/KeyValuePair/KeyValuePair.jsx (+ keyValuePair.scss)
export const keyValuePairText = {
  displayName: "Key Value Pair", // keyValuePair.js:3
  componentType: "KeyValuePair", // keyValuePair.js:5
  defaultWidgetName: "keyvaluepair1", // runtime name: config name lower-cased + 1
  widgetPrefix: "keyvaluepair",
  defaultSize: { width: 10, height: 450 }, // keyValuePair.js:6-9

  // keyValuePair.js:324-481 — the definition fields of a freshly dropped widget, in order
  defaultFieldLabels: ["Name", "Date", "Email", "Website", "Categories", "Tags", "Mobile Number", "Status"],
  defaultNameValue: "Olivia Nguyen", // keyValuePair.js:322 (definition data.name)

  // Inspector › Fields (useListItemManager addItem: `new_field<n>`, key = name, fieldType 'string')
  newFieldName: (n) => `new_field${n}`,

  // KeyValuePair.jsx:15-16, 284-305 — the changeset bar
  ctaTextMinWidth: 200, // CTA_TEXT_MIN_WIDTH: >= floating text bar, < docked icon footer
  cancelText: "Cancel", // KeyValuePair.jsx:292
  saveText: "Save changes", // KeyValuePair.jsx:304
  cancelAria: "Cancel", // KeyValuePair.jsx:290 (also the icon tooltip, :284)
  saveAria: "Save changes", // KeyValuePair.jsx:301 (also the icon tooltip, :295)
  saveIconClass: "lucide-check", // KeyValuePair.jsx:304 <Check/>
  oldSaveIconClass: "lucide-save", // D-08: the floppy icon must be gone
  cancelIconClass: "lucide-x", // KeyValuePair.jsx:292 <X/>

  // keyValuePair.scss — changeset bar geometry
  bar: {
    floatingInset: 8, // keyValuePair.scss:23-24 left/right 8px
    floatingBottom: 10, // keyValuePair.scss:22 bottom 10px
    containerBorder: 1, // KeyValuePair.jsx:90 `1px solid`
    dockedContentPadding: 52, // keyValuePair.scss:160 `.kv-content-docked` padding-bottom
  },

  // keyValuePair.scss:87-92 — disabled Save (BRW-007)
  disabledSave: {
    backgroundVar: "--slate6", // :88
    borderVar: "--slate6", // :89
    colorVar: "--slate9", // :90
    cursor: "not-allowed", // :91
  },
  enabledSave: {
    backgroundVar: "--primary-accent-strong", // :74
    colorVar: "--surfaces-surface-01", // :73
    cursor: "pointer", // :77
    hoverOpacity: "0.9", // :80-82
  },

  // KeyValuePair.jsx:71-72 + useInput getLabelWidthOfInput — label width defaults
  defaultLabelWidthPercent: 33, // keyValuePair.js:505
};
