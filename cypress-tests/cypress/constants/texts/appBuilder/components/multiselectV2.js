// Texts for the Multi Select (MultiselectV2) widget. Config: packages/widget-definitions/src/widgets/multiselectV2.js
export const multiselectV2Text = {
  displayName: "Multi Select", // multiselectV2.js:3
  componentType: "MultiselectV2", // multiselectV2.js:9
  defaultWidgetName: "multiselect1", // multiselectV2.js:2 name 'Multiselect' → computeComponentName (appCanvasUtils.js)
  widgetPrefix: "multiselect",

  // Saved definition defaults — the payload addMultiselectsViaApi posts (multiselectV2.js:413-496)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // multiselectV2.js:415
      showOnMobile: { value: "{{false}}" }, // multiselectV2.js:416
    },
    validation: {
      mandatory: { value: false }, // multiselectV2.js:419
      customRule: { value: null }, // multiselectV2.js:420
    },
    properties: {
      label: { value: "Select" }, // multiselectV2.js:423
      values: { value: ["1", "2"] }, // multiselectV2.js:424
      advanced: { value: "{{false}}" }, // multiselectV2.js:425
      showAllOption: { value: "{{false}}" }, // multiselectV2.js:426
      maxLimit: { value: "" }, // multiselectV2.js:427
      optionsLoadingState: { value: "{{false}}" }, // multiselectV2.js:428
      sort: { value: "none" }, // multiselectV2.js:429
      placeholder: { value: "Select the options" }, // multiselectV2.js:430
      showAllSelectedLabel: { value: "{{true}}" }, // multiselectV2.js:431
      showClearBtn: { value: "{{true}}" }, // multiselectV2.js:432
      showSearchInput: { value: "{{true}}" }, // multiselectV2.js:433
      serverSideSearch: { value: "{{false}}" }, // multiselectV2.js:434
      visibility: { value: "{{true}}" }, // multiselectV2.js:435
      collapseWhenHidden: { value: "{{false}}" }, // multiselectV2.js:437
      disabledState: { value: "{{false}}" }, // multiselectV2.js:438
      loadingState: { value: "{{false}}" }, // multiselectV2.js:439
      options: {
        // multiselectV2.js:444-471
        value: [
          { label: "option1", value: "1", caption: null, disable: { value: false }, visible: { value: true }, default: { value: false } },
          { label: "option2", value: "2", caption: null, disable: { value: false }, visible: { value: true }, default: { value: true } },
          { label: "option3", value: "3", caption: null, disable: { value: false }, visible: { value: true }, default: { value: false } },
        ],
      },
      tooltip: { value: "" }, // multiselectV2.js:472
      tooltipFormat: { value: "plainText" }, // multiselectV2.js:473
    },
    styles: {
      labelColor: { value: "var(--cc-primary-text)" }, // multiselectV2.js:477
      labelFontSize: { value: "{{12}}" }, // multiselectV2.js:478
      labelWidth: { value: "33" }, // multiselectV2.js:479
      auto: { value: "{{true}}" }, // multiselectV2.js:480
      fieldBorderRadius: { value: "6" }, // multiselectV2.js:481
      selectedTextColor: { value: "var(--cc-primary-text)" }, // multiselectV2.js:482
      fieldBorderColor: { value: "var(--cc-default-border)" }, // multiselectV2.js:483
      errTextColor: { value: "var(--cc-error-systemStatus)" }, // multiselectV2.js:484
      fieldBackgroundColor: { value: "var(--cc-surface1-surface)" }, // multiselectV2.js:485
      direction: { value: "left" }, // multiselectV2.js:486
      alignment: { value: "side" }, // multiselectV2.js:487
      padding: { value: "default" }, // multiselectV2.js:488
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // multiselectV2.js:489
      icon: { value: "IconHome2" }, // multiselectV2.js:490
      iconVisibility: { value: false }, // multiselectV2.js:491
      iconColor: { value: "var(--cc-default-icon)" }, // multiselectV2.js:492
      accentColor: { value: "var(--cc-primary-brand)" }, // multiselectV2.js:493
      widthType: { value: "ofComponent" }, // multiselectV2.js:494
    },
  },

  // Definition default options (multiselectV2.js:447/455/463); `values` ['1','2'] selects the first two on mount
  option1: "option1",
  option2: "option2",
  option3: "option3",
  defaultSummary: "option1, option2", // CustomValueContainer.jsx:70 values.join(', ')
  defaultLabel: "Select", // multiselectV2.js:423
  defaultPlaceholder: "Select the options", // multiselectV2.js:430
  selectAllLabel: "Select all", // CustomOption.jsx:29 / MultiselectV2.jsx:137
  allSelectedSummary: "All items are selected.", // CustomValueContainer.jsx:69 (showAllSelectedLabel)

  // Legacy default hexes the colour helpers swap for theme tokens (DropdownV2/utils.js:4,27,35;
  // MultiselectV2.jsx:456)
  legacyBorderHex: "#CCD1D5", // utils.js:27 → var(--cc-default-border)
  legacyAccentHex: "#4368E3", // utils.js:4 → var(--cc-primary-brand)
  legacyTextHex: "#1B1F24", // MultiselectV2.jsx:456 → var(--cc-primary-text)
  legacyBackgroundHex: "#ffffff", // utils.js:35 → var(--cc-surface1-surface)
  borderTokenVar: "--cc-default-border", // utils.js:31
  accentTokenVar: "--cc-primary-brand", // utils.js:7
  textTokenVar: "--cc-primary-text", // MultiselectV2.jsx:456
  surfaceTokenVar: "--cc-surface1-surface", // utils.js:47
  errorBorderVar: "--cc-error-systemStatus", // utils.js:20 invalid border colour
  optionHoverVar: "--interactive-overlays-fill-hover", // MultiselectV2.jsx:492,501
  disabledOptionOpacity: "0.3", // MultiselectV2.jsx:497
  hoverDarkenAmount: 24, // MultiselectV2.jsx:446 getModifiedColor(fieldBorderColor, 24)
  errorMandatory: "Field cannot be empty", // componentsSlice.js validate (mandatory)

  // Runtime constants
  menuPortalZIndex: "1040", // MultiselectV2.jsx:522 menuPortal zIndex
  menuBodyMaxHeight: 300, // CustomMenuList.jsx:117 maxMenuHeight || 300
  minMenuHeight: 300, // MultiselectV2.jsx:646 minMenuHeight used for menuPlacement="auto"

  // ModalV2 definition (packages/widget-definitions/src/widgets/modalV2.js:396-441) — for a modal holding a Multi Select
  modal: {
    componentType: "ModalV2", // modalV2.js:5
    properties: {
      loadingState: { value: "{{false}}" }, // modalV2.js:402
      dynamicHeight: { value: "{{false}}" }, // modalV2.js:403
      visibility: { value: "{{true}}" }, // modalV2.js:404
      collapseWhenHidden: { value: "{{false}}" }, // modalV2.js:406
      disabledTrigger: { value: "{{false}}" }, // modalV2.js:407
      disabledModal: { value: "{{false}}" }, // modalV2.js:408
      useDefaultButton: { value: "{{true}}" }, // modalV2.js:409
      triggerButtonLabel: { value: "Launch Modal" }, // modalV2.js:410
      size: { value: "lg" }, // modalV2.js:411
      showHeader: { value: "{{true}}" }, // modalV2.js:412
      showFooter: { value: "{{true}}" }, // modalV2.js:413
      hideCloseButton: { value: "{{false}}" }, // modalV2.js:414
      hideOnEsc: { value: "{{true}}" }, // modalV2.js:415
      closeOnClickingOutside: { value: "{{false}}" }, // modalV2.js:416
      modalHeight: { value: "{{400}}" }, // modalV2.js:417
      headerHeight: { value: 80 }, // modalV2.js:418
      footerHeight: { value: 80 }, // modalV2.js:419
      tooltipFormat: { value: "plainText" }, // modalV2.js:420
      tooltip: { value: "" }, // modalV2.js:421
    },
    others: {
      showOnDesktop: { value: "{{true}}" }, // modalV2.js:398
      showOnMobile: { value: "{{false}}" }, // modalV2.js:399
    },
  },
};
