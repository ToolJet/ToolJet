export const buttonSelector={
  buttonWidget: "[data-cy=button-widget]",
  buttonProperties: "[data-rb-event-key=properties]",
  buttonStyles: "[data-rb-event-key=styles]",
  buttonName: "[data-cy=edit-widget-name]",
  propertiesElements:{
    propertiesAccordion: "[data-cy=widget-accordion]:eq(0)",
    buttonTextLabel:"[data-cy=accordion-components]:eq(0)",
    buttonTextInput: '#collapse-0 > .accordion-body > :nth-child(1) > :nth-child(1) > .row > .col > .code-hinter-wrapper > [data-cy=accordion-input] > .CodeMirror >> .CodeMirror-sizer >>.CodeMirror-lines >> .CodeMirror-code >> span',
    loadingState: "[data-cy=accordion-components]:eq(1)",
    eventsAccordion: "[data-cy=widget-accordion]:eq(1)",
    addEventListner: "[data-cy=add-event-handler]",
    noEventHandler: "[data-cy=no-event-handler-message]",
    generalAccordion: "[data-cy=widget-accordion]:eq(2)",
    layoutAccordion: "[data-cy=widget-accordion]:eq(3)",
    showOnDesktopLabel: "[data-cy=accordion-components]:eq(3)",
    showOnMobileLabel: "[data-cy=accordion-components]:eq(4)",
    documentationLink: "[data-cy=widget-documentation-link]",
  },
  loadingStateFx: "[data-cy=fx-button]:eq(3)",
  loadingStateToggle: "[data-cy=toggle-button]:eq(0)",
  desktopFx:"[data-cy=fx-button]:eq(6)",
  desktopToggle:"[data-cy=toggle-button]:eq(1)",
  mobileFx: "[data-cy=fx-button]:eq(8)",
  mobileToggle: "[data-cy=toggle-button]:eq(2)",
  buttonInputField: "[data-cy=accordion-input] > .CodeMirror > .CodeMirror-scroll > .CodeMirror-sizer",
  fxLoadingState:".cm-atom:eq(0)",
  loadingStateInputFx: "[data-cy=fx-button]:eq(2)",
  eventHandler: "[data-cy=event-handler]",
  popoverCard: "[data-cy=popover-card]",
  eventLabel: "[data-cy=event-label]",
  eventSelection: "[data-cy=event-selection] > .select-search > .select-search__value > .select-search__input",
  actionLabel: "[data-cy=action-label]",
  actionSelection: "[data-cy=action-selection] ",
  actionOption: "[data-cy=action-option]",
  messageLabel: "[data-cy=message-label]",
  messageText: "[data-cy=accordion-input] > .CodeMirror > .CodeMirror-scroll > .CodeMirror-sizer >:eq(11)",
  alertTypeLabel: "[data-cy=alert-type-label]",
  alertMessageType: "[data-cy=alert-message-type]",
  fxDesktop:".cm-atom:eq(2)",
  desktopInputFx: "[data-cy=fx-button]:eq(5)",
  mobileInputFx: "[data-cy=fx-button]:eq(7)",
  fxMobile: ".cm-atom:eq(4)",
  stylesElements: {
    backgroundColorLabel: "[data-cy=accordion-components]:eq(5)",
    textColorLabel: "[data-cy=accordion-components]:eq(6)",
    loaderColorLabel: "[data-cy=accordion-components]:eq(7)",
    visibilityLabel: "[data-cy=accordion-components]:eq(8)",
    disableLabel: "[data-cy=accordion-components]:eq(9)",
    borderRadiusLabel: "[data-cy=accordion-components]:eq(10)",
  },
  stylesInput: {
    backgroundColorInputField: "[data-cy=color-picker-input]:eq(0)",
    textColorInputField: "[data-cy=color-picker-input]:eq(1)",
    loaderColorInputField: "[data-cy=color-picker-input]:eq(2)",
    borderRadiusInputField: "[data-cy=border-radius-input]",
  },
  stylesFx:{
    backgroundColor: "[data-cy=fx-button]:eq(10)",
    textColor: "[data-cy=fx-button]:eq(12)",
    loaderColor: "[data-cy=fx-button]:eq(14)",
    visibility: "[data-cy=fx-button]:eq(16)",
    disable: "[data-cy=fx-button]:eq(18)",
    borderRadius: "[data-cy=fx-button]:eq(20)",
  },
  backgroundColorSelector:"[data-cy=color-picker-input] > .col-auto:eq(0)",
  colorPickCard: ".sketch-picker",
  hexLabel:'[style="-webkit-box-flex: 2; flex: 2 1 0%;"] > div > label',
  backgroundColorInput: "[data-cy=accordion-input] > .CodeMirror >> .CodeMirror-sizer .CodeMirror-lines >> .CodeMirror-code >> span:eq(1)",
  backgroundColorCloseFx:"[data-cy=fx-button]:eq(9)",
  backgroundColor:{ 
    inputHex: "#rc-editable-input-1",
    inputR: "#rc-editable-input-2",
    labelR: ":nth-child(2) > div > label",
    inputG: "#rc-editable-input-3",
    labelG:":nth-child(3) > div > label",
    inputB: "#rc-editable-input-4",
    labelB: ":nth-child(4) > div > label",
    inputA: "#rc-editable-input-5",
    labelA: ":nth-child(5) > div > label",
  },
  textColorSelector: "[data-cy=color-picker-input] > .col-auto:eq(1)",
  textColorInput: "[data-cy=accordion-input] > .CodeMirror >> .CodeMirror-sizer .CodeMirror-lines >> .CodeMirror-code >> span:eq(2)",
  textColorCloseFx:  "[data-cy=fx-button]:eq(11)",
  textColor:{
    inputHex: "#rc-editable-input-6",
    inputR: "#rc-editable-input-7",
    labelR: ":nth-child(2) > div > label",
    inputG: "#rc-editable-input-8",
    labelG:":nth-child(3) > div > label",
    inputB: "#rc-editable-input-9",
    labelB: ":nth-child(4) > div > label",
    inputA: "#rc-editable-input-10",
    labelA: ":nth-child(5) > div > label",
  },
  loaderColorSelector: "[data-cy=color-picker-input] > .col-auto:eq(2)",
  loaderColorInput: "[data-cy=accordion-input] > .CodeMirror >> .CodeMirror-sizer .CodeMirror-lines >> .CodeMirror-code >> span:eq(3)",
  loaderColorCloseFx: "[data-cy=fx-button]:eq(13)",
  loaderColor: {
    inputHex: "#rc-editable-input-11",
    inputR: "#rc-editable-input-12",
    labelR: ":nth-child(2) > div > label",
    inputG: "#rc-editable-input-13",
    labelG:":nth-child(3) > div > label",
    inputB: "#rc-editable-input-14",
    labelB: ":nth-child(4) > div > label",
    inputA: "#rc-editable-input-15",
    labelA: ":nth-child(5) > div > label",
  },
  fxVisibility: ".cm-atom:eq(0)",
  fxDisable: ".cm-atom:eq(2)",
  visibilityToggle: "[data-cy=toggle-button]:eq(3)",
  disableToggle: "[data-cy=toggle-button]:eq(4)",
  visibilityCloseFx: "[data-cy=fx-button]:eq(15)",
  disableCloseFx: "[data-cy=fx-button]:eq(17)",
  borderRadiusCloseFx: "[data-cy=fx-button]:eq(15)",
  fxBorderRadius: ".CodeMirror-code > .CodeMirror-line >> .cm-number"
};