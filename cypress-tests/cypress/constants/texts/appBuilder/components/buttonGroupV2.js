// Texts for the Button Group (ButtonGroupV2) widget. Config: packages/widget-definitions/src/widgets/buttonGroupV2.js
export const buttonGroupV2Text = {
  displayName: "Button Group", // buttonGroupV2.js:3
  componentType: "ButtonGroupV2", // buttonGroupV2.js:5
  defaultWidgetName: "buttongroup1", // buttonGroupV2.js:2 name 'ButtonGroup' → computeComponentName (appCanvasUtils.js:322)
  widgetPrefix: "buttongroup",

  // Registered default size (buttonGroupV2.js:112-115)
  defaultGridWidth: 12, // buttonGroupV2.js:113
  defaultHeight: 80, // buttonGroupV2.js:114
  gridColumns: 43, // NO_OF_GRIDS (appCanvasConstants.js:1)

  // Static options (buttonGroupV2.js:399-426): three buttons, Button1 is the default
  defaultButtonLabels: ["Button1", "Button2", "Button3"], // buttonGroupV2.js:402,411,420
  defaultSelectedJson: '["1"]', // buttonGroupV2.js:403,407 value '1' default → selected ['1'] (ButtonGroupV2.jsx:87-91)

  // Saved definition defaults — the payload addButtonGroupsViaApi posts (buttonGroupV2.js:383-463)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // buttonGroupV2.js:385
      showOnMobile: { value: "{{false}}" }, // buttonGroupV2.js:386
    },
    properties: {
      label: { value: "Label" }, // buttonGroupV2.js:393
      advanced: { value: "{{false}}" }, // buttonGroupV2.js:394
      options: {
        // buttonGroupV2.js:399-426
        value: [
          { label: "Button1", value: "1", icon: { value: "IconBolt" }, iconVisibility: false, disable: { value: false }, default: { value: true } },
          { label: "Button2", value: "2", icon: { value: "IconBulb" }, iconVisibility: false, disable: { value: false }, default: { value: false } },
          { label: "Button3", value: "3", icon: { value: "IconTag" }, iconVisibility: false, disable: { value: false }, default: { value: false } },
        ],
      },
      multiSelection: { value: "{{false}}" }, // buttonGroupV2.js:427
      layout: { value: "row" }, // buttonGroupV2.js:428
      visibility: { value: "{{true}}" }, // buttonGroupV2.js:429
      dynamicHeight: { value: "{{false}}" }, // buttonGroupV2.js:431
      collapseWhenHidden: { value: "{{false}}" }, // buttonGroupV2.js:432
      disabledState: { value: "{{false}}" }, // buttonGroupV2.js:433
      loadingState: { value: "{{false}}" }, // buttonGroupV2.js:434
      tooltip: { value: "" }, // buttonGroupV2.js:435
      tooltipFormat: { value: "plainText" }, // buttonGroupV2.js:436
    },
    styles: {
      labelColor: { value: "var(--cc-primary-text)" }, // buttonGroupV2.js:440
      labelFontSize: { value: "{{12}}" }, // buttonGroupV2.js:441
      labelWidth: { value: "33" }, // buttonGroupV2.js:442
      auto: { value: "{{true}}" }, // buttonGroupV2.js:443
      direction: { value: "left" }, // buttonGroupV2.js:444
      alignment: { value: "side" }, // buttonGroupV2.js:445
      backgroundColor: { value: "var(--cc-surface1-surface)" }, // buttonGroupV2.js:446
      borderColor: { value: "var(--cc-default-border)" }, // buttonGroupV2.js:447
      textColor: { value: "var(--cc-primary-text)" }, // buttonGroupV2.js:448
      textSize: { value: "{{14}}" }, // buttonGroupV2.js:449
      fontWeight: { value: "normal" }, // buttonGroupV2.js:450
      hoverBackgroundMode: { value: "auto" }, // buttonGroupV2.js:451
      hoverBackgroundColor: { value: "var(--cc-primary-brand)" }, // buttonGroupV2.js:452
      iconColor: { value: "var(--cc-default-icon)" }, // buttonGroupV2.js:453
      errTextColor: { value: "var(--cc-error-systemStatus)" }, // buttonGroupV2.js:454
      selectedBackgroundColor: { value: "var(--cc-primary-brand)" }, // buttonGroupV2.js:455
      selectedTextColor: { value: "#FFFFFF" }, // buttonGroupV2.js:456
      selectedIconColor: { value: "#FFFFFF" }, // buttonGroupV2.js:457
      borderRadius: { value: "{{6}}" }, // buttonGroupV2.js:458
      btnAlignment: { value: "left" }, // buttonGroupV2.js:459
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // buttonGroupV2.js:460
      padding: { value: "default" }, // buttonGroupV2.js:461
    },
  },

  // Layout / alignment enums
  layoutRow: "row", // buttonGroupV2.js:46
  layoutColumn: "column", // buttonGroupV2.js:47
  layoutWrap: "wrap", // buttonGroupV2.js:48
  alignLeft: "left", // buttonGroupV2.js:323 default; ButtonGroupV2.jsx:259 left → start
  alignCenter: "center", // ButtonGroupV2.jsx:259 anything else → center
  alignRight: "right", // ButtonGroupV2.jsx:259 right → end
  labelSide: "side", // buttonGroupV2.js:149
  labelTop: "top", // buttonGroupV2.js:150
  directionLeft: "left", // buttonGroupV2.js:161
  directionRight: "right", // buttonGroupV2.js:162

  // Computed values
  justifyStart: "start", // ButtonGroupV2.jsx:259,324
  justifyCenter: "center", // ButtonGroupV2.jsx:259
  justifyEnd: "end", // ButtonGroupV2.jsx:259
  rowOverflowX: "auto", // ButtonGroupV2.jsx:271 row → 'auto hidden'
  rowOverflowY: "hidden",
  fixedOverflowX: "hidden", // ButtonGroupV2.jsx:271 column/wrap fixed → 'hidden auto'
  fixedOverflowY: "auto",
  dynamicOverflow: "visible", // ButtonGroupV2.jsx:271 dynamic → visible
  selectedTextColor: "rgb(255, 255, 255)", // buttonGroupV2.js:456 '#FFFFFF'
  buttonHeight: 36, // buttonGroupV2.scss:17
  buttonGap: 10, // buttonGroupV2.scss:10
  boxPadding: 2, // RenderWidget.jsx BOX_PADDING (appCanvasConstants.js:57)
  rowReverseClass: "tw-flex-row-reverse", // ButtonGroupV2.jsx:344 side + right
  columnClass: "flex-column", // ButtonGroupV2.jsx:338-342 top alignment with a label
  hiddenClass: "d-none", // ButtonGroupV2.jsx:343 isVisible false

  // Inspector
  dynamicHeightLabel: "Dynamic height", // buttonGroupV2.js:70
};
