// Texts for the Timeline widget. Config: packages/widget-definitions/src/widgets/timeline.js
export const timelineText = {
  displayName: "Timeline", // timeline.js:3
  componentType: "Timeline", // timeline.js:5
  defaultWidgetName: "timeline1", // timeline.js:2 name → computeComponentName (appCanvasUtils.js:322)
  widgetPrefix: "timeline",

  // Registered default size (timeline.js:64-67)
  defaultGridWidth: 20, // timeline.js:65
  defaultHeight: 270, // timeline.js:66
  gridColumns: 43, // NO_OF_GRIDS (appCanvasConstants.js:1)
  defaultItemCount: 3, // timeline.js:95 default data has three items

  // Saved definition defaults — the payload addTimelinesViaApi posts (timeline.js:87-108)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // timeline.js:89
      showOnMobile: { value: "{{false}}" }, // timeline.js:90
    },
    properties: {
      hideDate: { value: "{{false}}" }, // timeline.js:97
      dynamicHeight: { value: "{{false}}" }, // timeline.js:98
      collapseWhenHidden: { value: "{{false}}" }, // timeline.js:99
      visibility: { value: "{{true}}" }, // timeline.js:100
      tooltip: { value: "" }, // timeline.js:101
      tooltipFormat: { value: "plainText" }, // timeline.js:102
    },
    styles: {
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // timeline.js:106
    },
  },

  // Inspector
  dynamicHeightLabel: "Dynamic height", // timeline.js:24
  boxShadowLabel: "Box shadow", // timeline.js:76
  boxShadowColorLabel: "Box shadow Color", // BoxShadow inspector colour row (see checkbox/styles.cy.js)
  containerAccordion: "container", // timeline.js:81 accordian

  // Computed values
  defaultShadowComputed: "rgba(0, 0, 0, 0.25) 0px 0px 0px 0px", // timeline.js:106 '0px 0px 0px 0px #00000040'
  fixedOverflow: "auto", // Timeline.jsx:47 non-dynamic path scrolls
  dynamicOverflow: "visible", // Timeline.jsx:47 dynamic path never scrolls
  simpleListClass: "list-timeline-simple", // Timeline.jsx:55 hideDate=true
  boxPadding: 2, // RenderWidget.jsx BOX_PADDING (appCanvasConstants.js:57)
  emptyValueJson: "{}", // timeline.js:84-86 exposedVariables.value = {} (never updated — Timeline.jsx)
};
