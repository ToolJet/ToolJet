// Texts for the Tabs widget. Config: packages/widget-definitions/src/widgets/tabs.js
// Runtime: frontend/src/AppBuilder/Widgets/Tabs/Tabs.jsx, useTabsNavScrollArrows.js, tabs.scss
export const tabsText = {
  displayName: "Tabs", // tabs.js:3
  componentType: "Tabs", // tabs.js:9
  defaultWidgetName: "tabs1", // tabs.js:2 name → computeComponentName (appCanvasUtils.js)
  widgetPrefix: "tabs",
  defaultSize: { width: 15, height: 450 }, // tabs.js:5-8

  // Saved definition defaults — the payload addTabsViaApi posts (tabs.js:400-477). The static tab model
  // (tabItems) is left to the app loader, which fills it from the definition.
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // tabs.js:402
      showOnMobile: { value: "{{false}}" }, // tabs.js:403
    },
    properties: {
      dynamicHeight: { value: "{{false}}" }, // tabs.js:406
      useDynamicOptions: { value: "{{false}}" }, // tabs.js:407
      defaultTab: { value: "0" }, // tabs.js:446
      hideTabs: { value: false }, // tabs.js:447
      renderOnlyActiveTab: { value: false }, // tabs.js:448
      scrollToTopOnTabSwitch: { value: false }, // tabs.js:449
      loadingState: { value: "{{false}}" }, // tabs.js:450
      visibility: { value: "{{true}}" }, // tabs.js:451
      collapseWhenHidden: { value: "{{false}}" }, // tabs.js:453
      disabledState: { value: "{{false}}" }, // tabs.js:454
      tooltip: { value: "" }, // tabs.js:455
      tooltipFormat: { value: "plainText" }, // tabs.js:456
    },
    styles: {
      headerBackground: { value: "var(--cc-surface1-surface)" }, // tabs.js:460
      divider: { value: "var(--cc-default-border)" }, // tabs.js:461
      unselectedText: { value: "var(--cc-placeholder-text)" }, // tabs.js:462
      selectedText: { value: "var(--cc-primary-text)" }, // tabs.js:463
      highlightColor: { value: "var(--cc-primary-brand)" }, // tabs.js:464
      hoverBackground: { value: "#1B1F24" }, // tabs.js:465
      unselectedIcon: { value: "var(--cc-default-icon)" }, // tabs.js:466
      selectedIcon: { value: "var(--cc-default-icon)" }, // tabs.js:467
      accent: { value: "var(--cc-primary-brand)" }, // tabs.js:468
      tabWidth: { value: "auto" }, // tabs.js:469
      transition: { value: "none" }, // tabs.js:470
      borderRadius: { value: "{{6}}" }, // tabs.js:471
      commonBackgroundColor: { value: "var(--cc-surface1-surface)" }, // tabs.js:472
      border: { value: "var(--cc-weak-border)" }, // tabs.js:473
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // tabs.js:474
      padding: { value: "default" }, // tabs.js:475
    },
  },

  // Static tab model a freshly dropped Tabs renders (tabs.js:412-444)
  defaultTabIds: ["t0", "t1", "t2"], // tabs.js:415,425,435
  defaultTabTitles: ["Tab 1", "Tab 2", "Tab 3"], // tabs.js:416,426,436
  defaultActiveTabId: "t0", // defaultTab '0' (tabs.js:446) is not a tab id → first visible tab (Tabs.jsx:121-125)

  // Style option values
  tabWidthAuto: "auto", // tabs.js:247
  tabWidthSplit: "split", // tabs.js:248
  transitionSlide: "slide", // tabs.js:256
  transitionNone: "none", // tabs.js:257

  // Default style values / theme tokens
  defaultHoverBackground: "#1B1F24", // tabs.js:465
  tokenAccent: "--cc-primary-brand", // tabs.js:468 accent var(--cc-primary-brand)

  // Inspector labels
  labelRenderOnlyActiveTab: "Render only active tab", // tabs.js:104
  labelScrollToTop: "Scroll to top on tab switch", // tabs.js:115
  labelDynamicHeight: "Dynamic height", // tabs.js:127

  // Runtime literals
  accentWidth: 2, // Tabs.jsx:372 borderBottom `2px solid ${accent}`
  hoverAlpha: 0.08, // Tabs.jsx:415 tinycolor(hoverBackground).setAlpha(0.08)
  disabledTabOpacity: 0.5, // Tabs.jsx:370
  navSidePadding: 10, // Tabs.jsx:359-360 ul padding-left/right 10px
  navHeight: 49.5, // Tabs.jsx:18 TAB_HEADER_HEIGHT
  transitionMs: 300, // Tabs.jsx:388,512-513
  arrowDimOpacity: 0.5, // Tabs.jsx:337,455
  paneCanvasPadding: 8, // appCanvasConstants.js:73 TAB_CANVAS_PADDING
};
