// Texts for the Cascader widget. Config: packages/widget-definitions/src/widgets/cascader.js
// Static option node shape (cascader.js:434-479): { label, value, visible: { value }, disable: { value }, children? }
const node = (label, value, children) => ({
  label,
  value,
  visible: { value: true },
  disable: { value: false },
  ...(children ? { children } : {}),
});

export const cascaderText = {
  displayName: "Cascader", // cascader.js:3
  componentType: "Cascader", // cascader.js:9
  defaultWidgetName: "cascader1", // cascader.js:2 name → computeComponentName (appCanvasUtils.js)
  widgetPrefix: "cascader",
  defaultPlaceholder: "Select an option", // cascader.js:418
  defaultLabel: "Select", // cascader.js:417
  defaultSeparator: "/", // cascader.js:420

  // Default static tree (cascader.js:434-479) — values used by the dropped-widget smoke cases
  defaultTree: {
    asia: "Asia", // cascader.js:437
    china: "China", // cascader.js:443
    beijing: "Beijing", // cascader.js:448
    japan: "Japan", // cascader.js:452
    europe: "Europe", // cascader.js:467
    africa: "Africa", // cascader.js:477
  },

  // Saved definition defaults — the payload addCascadersViaApi posts (cascader.js:406-505)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // cascader.js:408
      showOnMobile: { value: "{{false}}" }, // cascader.js:409
    },
    properties: {
      legacyInputSize: { value: "{{false}}" }, // cascader.js:416
      label: { value: "Select" }, // cascader.js:417
      placeholder: { value: "Select an option" }, // cascader.js:418
      value: { value: "" }, // cascader.js:419
      pathSeparator: { value: "/" }, // cascader.js:420
      advanced: { value: "{{false}}" }, // cascader.js:421
      optionsLoadingState: { value: "{{false}}" }, // cascader.js:426
      showClearBtn: { value: "{{true}}" }, // cascader.js:427
      visibility: { value: "{{true}}" }, // cascader.js:428
      collapseWhenHidden: { value: "{{false}}" }, // cascader.js:429
      disabledState: { value: "{{false}}" }, // cascader.js:430
      loadingState: { value: "{{false}}" }, // cascader.js:431
      tooltip: { value: "" }, // cascader.js:432
      tooltipFormat: { value: "plainText" }, // cascader.js:433
      options: {
        // cascader.js:434-479
        value: [
          node("Asia", "asia", [
            node("China", "china", [node("Beijing", "beijing"), node("Shanghai", "shanghai")]),
            node("Japan", "japan"),
            node("India", "india", [node("Delhi", "delhi"), node("Mumbai", "mumbai"), node("Bengaluru", "bengaluru")]),
          ]),
          node("Europe", "europe", [node("France", "france"), node("Spain", "spain"), node("England", "england")]),
          node("Africa", "africa"),
        ],
      },
    },
    styles: {
      labelColor: { value: "var(--cc-primary-text)" }, // cascader.js:483
      labelFontSize: { value: "{{12}}" }, // cascader.js:484
      labelWidth: { value: "33" }, // cascader.js:485
      auto: { value: "{{true}}" }, // cascader.js:486
      fieldBorderRadius: { value: "6" }, // cascader.js:487
      selectedTextColor: { value: "var(--cc-primary-text)" }, // cascader.js:488
      placeholderTextColor: { value: "var(--cc-placeholder-text)" }, // cascader.js:489
      fieldBorderColor: { value: "var(--cc-default-border)" }, // cascader.js:490
      errTextColor: { value: "var(--cc-error-systemStatus)" }, // cascader.js:491
      fieldBackgroundColor: { value: "var(--cc-surface1-surface)" }, // cascader.js:492
      direction: { value: "left" }, // cascader.js:493
      alignment: { value: "side" }, // cascader.js:494
      padding: { value: "default" }, // cascader.js:495
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // cascader.js:496
      icon: { value: "IconHome2" }, // cascader.js:497
      iconVisibility: { value: false }, // cascader.js:498
      iconColor: { value: "var(--cc-default-icon)" }, // cascader.js:499
      accentColor: { value: "var(--cc-primary-brand)" }, // cascader.js:500
      widthType: { value: "ofComponent" }, // cascader.js:501
      menuWidthMode: { value: "matchField" }, // cascader.js:502
      menuCustomWidth: { value: "256" }, // cascader.js:503
    },
  },

  // CSA handles (cascader.js:376-404)
  actions: { setValue: "setValue", clearValue: "clearValue" },
  // events (cascader.js:159-163)
  events: { onSelect: "onSelect", onFocus: "onFocus", onBlur: "onBlur" },

  menuMaxHeight: 260, // CascaderMenu.tsx:177 — option list maxHeight
  menuZIndex: "1040", // Cascader.tsx:406 — popover z-index
  // CascaderMenu.tsx:216-220 — inline background token of the keyboard/hover-highlighted row
  highlightToken: "var(--interactive-overlays-fill-hover)",
};
