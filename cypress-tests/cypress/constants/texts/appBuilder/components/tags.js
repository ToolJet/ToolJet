// Texts for the Tags display widget. Config: packages/widget-definitions/src/widgets/tags.js
// Inspector: frontend/src/AppBuilder/RightSideBar/Inspector/Components/Tags.jsx
export const tagsText = {
  displayName: "Tags", // tags.js:3
  defaultWidgetName: "tags1",
  widgetPrefix: "tags",

  // definition.properties.options default titles, in order (tags.js:189,197,205,213)
  defaultTitles: ["success", "info", "warning", "danger"],
  defaultAuthoredHeight: 30, // tags.js:8 defaultSize.height

  // Inspector labels
  accordionOptions: "Options",
  accordionAdditionalActions: "Additional Actions",
  addNewOption: "Add new option", // Inspector Tags.jsx:392
  newTagTitle: (n) => `Tag ${n}`, // Inspector Tags.jsx:104
  newTagIcon: "IconHome", // Inspector Tags.jsx:113

  // Inspector Tags.jsx:78-92 — rotating palette; option i gets palette[i % 13], background = hex + '1A'
  palette: [
    "#40474D",
    "#CE2761",
    "#6745E2",
    "#2576CE",
    "#1A9C6D",
    "#69AF20",
    "#F35717",
    "#EB2E39",
    "#A438C0",
    "#405DE6",
    "#1E8FA3",
    "#34A947",
    "#F19119",
  ],
  paletteBackgroundAlphaHex: "1A", // Inspector Tags.jsx:96

  // Styles defaults (tags.js:233-237)
  defaultBorderRadius: "8",
};
