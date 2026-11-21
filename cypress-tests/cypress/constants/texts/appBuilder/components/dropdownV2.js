// Texts for the Dropdown (DropdownV2) widget. Config: packages/widget-definitions/src/widgets/dropdownV2.js
export const dropdownV2Text = {
  displayName: "Dropdown", // dropdownV2.js:3
  componentType: "DropdownV2", // dropdownV2.js:9
  defaultWidgetName: "dropdown1", // dropdownV2.js:2 name → computeComponentName (appCanvasUtils.js)
  widgetPrefix: "dropdown",

  // Saved definition defaults — the payload addDropdownsViaApi posts (dropdownV2.js:393-475)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // dropdownV2.js:395
      showOnMobile: { value: "{{false}}" }, // dropdownV2.js:396
    },
    validation: {
      mandatory: { value: "{{false}}" }, // dropdownV2.js:399
      customRule: { value: null }, // dropdownV2.js:400
    },
    properties: {
      advanced: { value: "{{false}}" }, // dropdownV2.js:403
      options: {
        // dropdownV2.js:408-434 — option2 is the default
        value: [
          { label: "option1", value: "1", caption: null, disable: { value: false }, visible: { value: true }, default: { value: false } },
          { label: "option2", value: "2", caption: null, disable: { value: false }, visible: { value: true }, default: { value: true } },
          { label: "option3", value: "3", caption: null, disable: { value: false }, visible: { value: true }, default: { value: false } },
        ],
      },
      label: { value: "Select" }, // dropdownV2.js:436
      optionsLoadingState: { value: "{{false}}" }, // dropdownV2.js:437
      sort: { value: "none" }, // dropdownV2.js:438
      placeholder: { value: "Select an option" }, // dropdownV2.js:439
      showClearBtn: { value: "{{true}}" }, // dropdownV2.js:440
      showSearchInput: { value: "{{true}}" }, // dropdownV2.js:441
      serverSideSearch: { value: "{{false}}" }, // dropdownV2.js:442
      visibility: { value: "{{true}}" }, // dropdownV2.js:443
      collapseWhenHidden: { value: "{{false}}" }, // dropdownV2.js:445
      disabledState: { value: "{{false}}" }, // dropdownV2.js:446
      loadingState: { value: "{{false}}" }, // dropdownV2.js:447
      tooltip: { value: "" }, // dropdownV2.js:448
      tooltipFormat: { value: "plainText" }, // dropdownV2.js:449
    },
    styles: {
      labelColor: { value: "var(--cc-primary-text)" }, // dropdownV2.js:453
      labelFontSize: { value: "{{12}}" }, // dropdownV2.js:454
      labelWidth: { value: "33" }, // dropdownV2.js:455
      auto: { value: "{{true}}" }, // dropdownV2.js:456
      fieldBorderRadius: { value: "6" }, // dropdownV2.js:457
      selectedTextColor: { value: "var(--cc-primary-text)" }, // dropdownV2.js:458
      placeholderTextColor: { value: "var(--cc-placeholder-text)" }, // dropdownV2.js:459
      fieldBorderColor: { value: "var(--cc-default-border)" }, // dropdownV2.js:460
      errTextColor: { value: "var(--cc-error-systemStatus)" }, // dropdownV2.js:461
      fieldBackgroundColor: { value: "var(--cc-surface1-surface)" }, // dropdownV2.js:462
      direction: { value: "left" }, // dropdownV2.js:463
      alignment: { value: "side" }, // dropdownV2.js:464
      padding: { value: "default" }, // dropdownV2.js:465
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // dropdownV2.js:466
      icon: { value: "IconHome2" }, // dropdownV2.js:467
      iconVisibility: { value: false }, // dropdownV2.js:468
      iconColor: { value: "var(--cc-default-icon)" }, // dropdownV2.js:469
      accentColor: { value: "var(--cc-primary-brand)" }, // dropdownV2.js:470
      widthType: { value: "ofComponent" }, // dropdownV2.js:471
      menuWidthMode: { value: "matchField" }, // dropdownV2.js:472
      menuCustomWidth: { value: "256" }, // dropdownV2.js:473
    },
  },

  // Definition default labels (dropdownV2.js:411 / :419 / :427) — option2 selected on mount
  option1: "option1",
  option2: "option2",
  option3: "option3",
  defaultPlaceholder: "Select an option", // dropdownV2.js:439

  // Option values
  menuWidthMatchField: "matchField", // dropdownV2.js:329
  menuWidthMatchContent: "matchContent", // dropdownV2.js:330
  menuWidthCustom: "custom", // dropdownV2.js:331
  paddingNone: "none", // dropdownV2.js:358

  // Runtime constants
  matchContentCap: 520, // DropdownV2.jsx:368 Math.min(computed, 520); useMenuWidth.js:42 min(520px, …)
  viewportGutter: 24, // useMenuWidth.js:12 calc(100vw - 24px)
  boxPadding: 2, // RenderWidget.jsx BOX_PADDING (padding: 'default')
  iosSearchFontSize: "16px", // CustomMenuList.jsx:76 — iPhone/iPad/iPod user agents
  iPhoneUserAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  errorMandatory: "Field cannot be empty", // componentsSlice.js:934
  errorBorderVar: "--cc-error-systemStatus", // utils.js:20 invalid border colour
};
