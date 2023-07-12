import { toggleSwitchText } from "Texts/toggleSwitch";
import { commonWidgetText } from "Texts/common";
import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { verifyControlComponentAction } from "Support/utils/button";
import {
  openAccordion,
  verifyAndModifyParameter,
  openEditorSidebar,
  verifyAndModifyToggleFx,
  addDefaultEventHandler,
  addAndVerifyTooltip,
  verifyComponentFromInspector,
  verifyAndModifyStylePickerFx,
  verifyWidgetColorCss,
  selectColourFromColourPicker,
  verifyLoaderColor,
  fillBoxShadowParams,
  verifyBoxShadowCss,
  verifyLayout,
  verifyTooltip,
  editAndVerifyWidgetName,
  verifyPropertiesGeneralAccordion,
  verifyStylesGeneralAccordion,
} from "Support/utils/commonWidget";
describe("Editor- Test Button widget", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
    cy.dragAndDropWidget(toggleSwitchText.defaultWidgetText, 500, 500);
  });

  it("should verify the properties of the Toggle Switch widget", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.alertMessage = fake.randomSentence;
    data.widgetName = fake.widgetName;
    data.customMessage = fake.randomSentence;
    data.tooltipText = fake.randomSentence;

    cy.renameApp(data.appName);
    openEditorSidebar(toggleSwitchText.defaultWidgetName);
    editAndVerifyWidgetName(data.widgetName);

    openAccordion(commonWidgetText.accordionProperties);
    verifyAndModifyParameter(toggleSwitchText.label, data.widgetName);
    verifyComponentFromInspector(data.widgetName);

    verifyAndModifyToggleFx(
      toggleSwitchText.defaultStatus,
      commonWidgetText.codeMirrorLabelFalse
    );

    openAccordion(commonWidgetText.accordionEvents);
    addDefaultEventHandler(data.alertMessage);
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage);

    verifyPropertiesGeneralAccordion(data.widgetName, data.tooltipText);

    verifyLayout(data.widgetName);

    cy.get(commonWidgetSelector.changeLayoutToDesktopButton).click();
    cy.get(
      commonWidgetSelector.parameterTogglebutton(
        commonWidgetText.parameterShowOnDesktop
      )
    ).click();

    cy.get(commonWidgetSelector.widgetDocumentationLink).should(
      "have.text",
      toggleSwitchText.toggleSwitchDocumentationLink
    );

    verifyControlComponentAction(data.widgetName, data.customMessage);

    cy.get(commonSelectors.editorPageLogo).click();
    cy.deleteApp(data.appName);
  });

  it("should verify the styles of the Toggle Switch widget", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.textColor = fake.randomRgba;
    data.toggleSwitchColor = fake.randomRgba;
    data.boxShadowColor = fake.randomRgba;
    data.colourHex = fake.randomRgbaHex;
    data.boxShadowParam = fake.boxShadowParam;

    cy.renameApp(data.appName);

    openEditorSidebar(toggleSwitchText.defaultWidgetName);

    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    data.colourHex = fake.randomRgbaHex;

    // verifyAndModifyStylePickerFx(
    //   toggleSwitchText.textColor,
    //   "",
    //   data.colourHex
    // );

    // cy.get(
    //   commonWidgetSelector.parameterFxButton(toggleSwitchText.textColor)
    // ).click();

    // selectColourFromColourPicker(toggleSwitchText.textColor, data.textColor, 1);

    // verifyWidgetColorCss(
    //   toggleSwitchText.defaultWidgetName,
    //   "color",
    //   data.textColor
    // );

    // openEditorSidebar(toggleSwitchText.defaultWidgetName);
    // cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    // data.colourHex = fake.randomRgbaHex;
    // verifyAndModifyStylePickerFx(
    //   toggleSwitchText.toggleSwitchColor,
    //   "",
    //   data.colourHex
    // );

    // cy.get(
    //   commonWidgetSelector.parameterFxButton(toggleSwitchText.toggleSwitchColor)
    // ).click();

    // selectColourFromColourPicker(
    //   toggleSwitchText.toggleSwitchColor,
    //   data.toggleSwitchColor,
    //   2
    // );

    // verifyLoaderColor(
    //   toggleSwitchText.defaultWidgetName,
    //   data.toggleSwitchColor
    // );

    openEditorSidebar(toggleSwitchText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    verifyAndModifyToggleFx(
      commonWidgetText.parameterVisibility,
      commonWidgetText.codeMirrorLabelTrue
    );
    cy.get(
      commonWidgetSelector.draggableWidget(toggleSwitchText.defaultWidgetName)
    ).should("not.be.visible");
    cy.get(commonWidgetSelector.parameterTogglebutton("Visibility")).click();

    cy.get(
      `${commonWidgetSelector.draggableWidget(
        toggleSwitchText.defaultWidgetName
      )} input`
    ).click();

    verifyAndModifyToggleFx(
      commonWidgetText.parameterDisable,
      commonWidgetText.codeMirrorLabelFalse
    );
    cy.waitForAutoSave();
    cy.get(
      `${commonWidgetSelector.draggableWidget(
        toggleSwitchText.defaultWidgetName
      )} input`
    ).should("have.attr", "disabled");

    cy.get(commonWidgetSelector.parameterTogglebutton("Disable")).click();

    openEditorSidebar(toggleSwitchText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    data.colourHex = fake.randomRgbaHex;
    verifyStylesGeneralAccordion(
      toggleSwitchText.defaultWidgetName,
      data.boxShadowParam,
      data.colourHex,
      data.boxShadowColor,
      2
    );

    cy.get(commonSelectors.editorPageLogo).click();
    cy.deleteApp(data.appName);
  });

  it.only("should verify the app preview", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.alertMessage = fake.randomSentence;
    data.widgetName = fake.widgetName;
    data.customMessage = fake.randomSentence;
    data.textColor = fake.randomRgba;
    data.toggleSwitchColor = fake.randomRgba;
    data.boxShadowColor = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;
    data.tooltipText = fake.randomSentence;

    cy.renameApp(data.appName);

    openEditorSidebar(toggleSwitchText.defaultWidgetName);
    verifyAndModifyParameter(toggleSwitchText.label, data.widgetName);

    openAccordion(commonWidgetText.accordionEvents);
    addDefaultEventHandler(data.alertMessage);

    verifyPropertiesGeneralAccordion(
      toggleSwitchText.defaultWidgetName,
      data.tooltipText
    );

    openEditorSidebar(toggleSwitchText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    selectColourFromColourPicker(toggleSwitchText.textColor, data.textColor, 1);

    cy.forceClickOnCanvas();
    openEditorSidebar(toggleSwitchText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    selectColourFromColourPicker(
      toggleSwitchText.toggleSwitchColor,
      data.toggleSwitchColor,
      1
    );

    cy.forceClickOnCanvas();
    openEditorSidebar(toggleSwitchText.defaultWidgetName);
    verifyStylesGeneralAccordion(
      toggleSwitchText.defaultWidgetName,
      data.boxShadowParam,
      data.colourHex,
      data.boxShadowColor,
      1
    );

    verifyControlComponentAction(
      toggleSwitchText.defaultWidgetName,
      data.customMessage
    );

    cy.waitForAutoSave();
    cy.openInCurrentTab(commonWidgetSelector.previewButton);

    cy.get(
      commonWidgetSelector.draggableWidget(toggleSwitchText.defaultWidgetName)
    ).verifyVisibleElement("have.text", data.widgetName);

    cy.get(
      `${commonWidgetSelector.draggableWidget(
        toggleSwitchText.defaultWidgetName
      )} input`
    ).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage);
    cy.get(commonWidgetSelector.draggableWidget("textinput1")).should(
      "have.value",
      data.customMessage
    );

    verifyTooltip(
      commonWidgetSelector.draggableWidget(toggleSwitchText.defaultWidgetName),
      data.tooltipText
    );

    // verifyWidgetColorCss(
    //   toggleSwitchText.defaultWidgetName,
    //   "color",
    //   data.textColor
    // );

    // verifyWidgetColorCss(
    //   toggleSwitchText.defaultWidgetName,
    //   "color",
    //   data.toggleSwitchColor
    // );

    verifyBoxShadowCss(
      toggleSwitchText.defaultWidgetName,
      data.boxShadowColor,
      data.boxShadowParam
    );

    cy.get(commonSelectors.viewerPageLogo).click();
    cy.deleteApp(data.appName);
  });
});
