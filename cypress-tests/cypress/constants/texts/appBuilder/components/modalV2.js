// Texts for the Modal (ModalV2) widget. Config: packages/widget-definitions/src/widgets/modalV2.js
// Runtime: frontend/src/AppBuilder/Widgets/ModalV2/ModalV2.jsx, Components/Modal.jsx, Header.jsx, Footer.jsx,
// hooks/useResizeSideEffects.js, helpers/utils.js
export const modalV2Text = {
  displayName: "Modal", // modalV2.js:3
  componentType: "ModalV2", // modalV2.js:5
  defaultWidgetName: "modal1", // modalV2.js:2 name 'Modal' → computeComponentName (appCanvasUtils.js)
  widgetPrefix: "modal",
  defaultSize: { width: 10, height: 40 }, // modalV2.js:6-9

  // Inspector labels
  labelTriggerVisibility: "Modal trigger visibility", // modalV2.js:35
  labelSize: "Width", // modalV2.js:92

  // Defaults a freshly dropped Modal renders
  defaultTriggerLabel: "Launch Modal", // modalV2.js:410
  defaultHeaderTitle: "Modal title", // modalV2.js:155 (defaultChildren header Text)
  defaultFooterButtons: ["Button1", "Button2"], // modalV2.js:187, 208 (defaultChildren footer Buttons)
  defaultChildNames: { title: "text1", cancel: "button1", confirm: "button2" }, // computeComponentName per child type
  defaultModalHeight: 400, // modalV2.js:417
  defaultHeaderHeight: 80, // modalV2.js:418
  defaultFooterHeight: 80, // modalV2.js:419

  // A Modal is copied with its slot children, so the copy toast is the plural one (copyPasteWidgetsUtils.js:110)
  copyToast: "Components copied successfully",
  cloneToast: "Component cloned successfully", // copyPasteWidgetsUtils.js:99

  // size option values (modalV2.js:94-99)
  sizeSmall: "sm",
  sizeMedium: "lg",
  sizeLarge: "xl",
  sizeFullscreen: "fullscreen",
  // react-bootstrap dialog class per size
  fullscreenDialogClass: "modal-fullscreen",
  // slot names a child's `parent` id is suffixed with (appCanvasUtils.js getParentComponentIdByType)
  slots: ["header", "body", "footer"],

  // Saved definition defaults — the payload addModalsViaApi posts (modalV2.js:396-443)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // modalV2.js:398
      showOnMobile: { value: "{{false}}" }, // modalV2.js:399
    },
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
    styles: {
      icon: { value: "IconAlignBoxBottomLeft" }, // modalV2.js:425
      iconVisibility: { value: false }, // modalV2.js:426
      iconColor: { value: "var(--cc-surface1-surface)" }, // modalV2.js:427
      direction: { value: "left" }, // modalV2.js:428
      headerBackgroundColor: { value: "var(--cc-surface1-surface)" }, // modalV2.js:429
      footerBackgroundColor: { value: "var(--cc-surface1-surface)" }, // modalV2.js:430
      bodyBackgroundColor: { value: "var(--cc-surface1-surface)" }, // modalV2.js:431
      triggerButtonBackgroundColor: { value: "var(--cc-primary-brand)" }, // modalV2.js:432
      triggerButtonHoverBackgroundMode: { value: "auto" }, // modalV2.js:433
      triggerButtonHoverBackgroundColor: { value: "var(--cc-primary-brand)" }, // modalV2.js:434
      triggerButtonTextColor: { value: "var(--cc-surface1-surface)" }, // modalV2.js:435
      triggerButtonTextSize: { value: "{{14}}" }, // modalV2.js:436
      triggerButtonFontWeight: { value: "normal" }, // modalV2.js:437
      triggerButtonContentAlignment: { value: "center" }, // modalV2.js:438
      headerDividerColor: { value: "var(--cc-default-border)" }, // modalV2.js:439
      footerDividerColor: { value: "var(--cc-default-border)" }, // modalV2.js:440
    },
  },
};
