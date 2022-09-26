import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { buttonText } from "Texts/button";
import { fake } from "Fixtures/fake";
import { commonWidgetText } from "Texts/common";

import {
  verifyControlComponentAction,
} from "Support/utils/button";

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
  editAndVerifyWidgetName

} from "Support/utils/commonWidget";

describe("Editor- Test Button widget", () => {

  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
    cy.dragAndDropWidget(buttonText.defaultWidgetText);
  });

  it("should verify the properties of the button widget", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.alertMessage = fake.randomSentence;
    data.widgetName = fake.widgetName;
    data.customMessage = fake.randomSentence;
    data.tooltipText = fake.randomSentence;

    cy.renameApp(data.appName);

    openEditorSidebar(buttonText.defaultWidgetName);
    editAndVerifyWidgetName(data.widgetName)

    openAccordion(commonWidgetText.accordionProperties);
    verifyAndModifyParameter(buttonText.buttonTextLabel, data.widgetName);
    verifyComponentFromInspector(data.widgetName);

    verifyAndModifyToggleFx(
      buttonText.loadingState,
      commonWidgetText.codeMirrorLabelFalse
    );
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).should(
      "have.class",
      "btn-loading"
    );

    cy.get(
      commonWidgetSelector.parameterTogglebutton(buttonText.loadingState)
    ).click();
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).should(
      "not.have.class",
      "btn-loading"
    );

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionEvents);
    addDefaultEventHandler(data.alertMessage);
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage);

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionGenaral);
    addAndVerifyTooltip(
      commonWidgetSelector.draggableWidget(data.widgetName),
      data.tooltipText
    );

    verifyLayout(data.widgetName);

    cy.get(commonWidgetSelector.changeLayoutButton).click();
    cy.get(
      commonWidgetSelector.parameterTogglebutton(
        commonWidgetText.parameterShowOnDesktop
      )
    ).click();

    cy.get(commonWidgetSelector.widgetDocumentationLink).should(
      "have.text",
      buttonText.buttonDocumentationLink
    );

    verifyControlComponentAction(data.widgetName, data.customMessage);

    cy.get(commonSelectors.editorPageLogo).click();
    cy.deleteApp(data.appName);
  });

  it("should verify the styles of the button widget", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.backgroundColor = fake.randomRgba;
    data.textColor = fake.randomRgba;
    data.loaderColor = fake.randomRgba;
    data.boxShadowColor = fake.randomRgba;
    data.colourHex = fake.randomRgbaHex;
    data.boxShadowParam = fake.boxShadowParam;

    cy.renameApp(data.appName);

    openEditorSidebar(buttonText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    verifyAndModifyStylePickerFx(
      buttonText.backgroundColor,
      buttonText.defaultBackgroundColor,
      data.colourHex
    );

    cy.get(
      commonWidgetSelector.parameterFxButton(buttonText.backgroundColor)
    ).click();

    selectColourFromColourPicker(buttonText.backgroundColor, data.backgroundColor);

    verifyWidgetColorCss(
      buttonText.defaultWidgetName,
      "background-color",
      data.backgroundColor
    );

    openEditorSidebar(buttonText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    data.colourHex = fake.randomRgbaHex;
    verifyAndModifyStylePickerFx(
      buttonText.textColor,
      buttonText.defaultTextColor,
      data.colourHex
    );

    cy.get(
      commonWidgetSelector.parameterFxButton(buttonText.textColor)
    ).click();

    selectColourFromColourPicker(buttonText.textColor, data.textColor);

    verifyWidgetColorCss(buttonText.defaultWidgetName, "color", data.textColor);

    openEditorSidebar(buttonText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    data.colourHex = fake.randomRgbaHex;
    verifyAndModifyStylePickerFx(
      buttonText.loaderColor,
      buttonText.defaultLoaderColor,
      data.colourHex
    );

    cy.get(
      commonWidgetSelector.parameterFxButton(buttonText.loaderColor)
    ).click();

    selectColourFromColourPicker(buttonText.loaderColor, data.loaderColor);

    verifyLoaderColor(buttonText.defaultWidgetName, data.loaderColor);

    openEditorSidebar(buttonText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    verifyAndModifyToggleFx(
      commonWidgetText.parameterVisibility,
      commonWidgetText.codeMirrorLabelTrue
    );
    cy.get(
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName)
    ).should("not.be.visible");
    cy.get(commonWidgetSelector.parameterTogglebutton("Visibility")).click();

    verifyAndModifyToggleFx(
      commonWidgetText.parameterDisable,
      commonWidgetText.codeMirrorLabelFalse
    );
    cy.waitForAutoSave();
    cy.get(
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName)
    ).should("have.attr", "disabled");

    cy.get(commonWidgetSelector.parameterTogglebutton("Disable")).click();

    cy.get(
      commonWidgetSelector.parameterFxButton(
        commonWidgetText.parameterBorderRadius
      )
    )
      .last()
      .click();

    verifyAndModifyParameter(
      commonWidgetText.parameterBorderRadius,
      buttonText.borderRadiusInput
    );

    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    cy.get(
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName)
    ).should("have.css", "border-radius", "20px");

    openEditorSidebar(buttonText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    data.colourHex = fake.randomRgbaHex;
    openAccordion(commonWidgetText.accordionGenaral, "1");
    verifyAndModifyStylePickerFx(
      commonWidgetText.parameterBoxShadow,
      commonWidgetText.boxShadowDefaultValue,
     `${(data.boxShadowParam)[0]}px ${(data.boxShadowParam)[1]}px ${(data.boxShadowParam)[2]}px ${(data.boxShadowParam)[3]}px ${data.colourHex}`,
    );
    cy.get(
      commonWidgetSelector.parameterFxButton(
        commonWidgetText.parameterBoxShadow
      )
    ).click();

    cy.get(
      commonWidgetSelector.stylePicker(commonWidgetText.parameterBoxShadow)
    ).click();

    fillBoxShadowParams(
      commonWidgetSelector.boxShadowDefaultParam,
      data.boxShadowParam
    );
    selectColourFromColourPicker(commonWidgetText.boxShadowColor, data.boxShadowColor);

    verifyBoxShadowCss(
      buttonText.defaultWidgetName,
      data.boxShadowColor,
      data.boxShadowParam
    );
    cy.get(commonSelectors.editorPageLogo).click();
    cy.deleteApp(data.appName);
  });

  it("should verify the app preview", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.alertMessage = fake.randomSentence;
    data.widgetName = fake.widgetName;
    data.customMessage = fake.randomSentence;
    data.backgroundColor = fake.randomRgba;
    data.textColor = fake.randomRgba;
    data.loaderColor = fake.randomRgba;
    data.boxShadowColor = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;
    data.tooltipText = fake.randomSentence;

    cy.renameApp(data.appName);

    openEditorSidebar(buttonText.defaultWidgetName);
    verifyAndModifyParameter(buttonText.buttonTextLabel, data.widgetName);

     openAccordion(commonWidgetText.accordionEvents);
    addDefaultEventHandler(data.alertMessage);

    openAccordion(commonWidgetText.accordionGenaral);
    addAndVerifyTooltip(
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName),
      data.tooltipText
    );

    openEditorSidebar(buttonText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    selectColourFromColourPicker(buttonText.backgroundColor, data.backgroundColor);
    
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    openEditorSidebar(buttonText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    selectColourFromColourPicker(buttonText.textColor, data.textColor);

    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    openEditorSidebar(buttonText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    selectColourFromColourPicker(buttonText.loaderColor, data.loaderColor);

    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    openEditorSidebar(buttonText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    cy.get(
      commonWidgetSelector.parameterInputField(
        commonWidgetText.parameterBorderRadius
      )
    )
      .last()
      .clear()
      .type(buttonText.borderRadiusInput);

    openAccordion(commonWidgetText.accordionGenaral, "1");

    cy.get(
      commonWidgetSelector.stylePicker(commonWidgetText.parameterBoxShadow)
    ).click();

    fillBoxShadowParams(
      commonWidgetSelector.boxShadowDefaultParam,
      data.boxShadowParam
    );
    selectColourFromColourPicker(commonWidgetText.boxShadowColor, data.boxShadowColor);

    verifyControlComponentAction(buttonText.defaultWidgetName, data.customMessage);

    cy.waitForAutoSave();
    cy.openInCurrentTab(commonWidgetSelector.previewButton);

    cy.get(
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName)
    ).verifyVisibleElement("have.text", data.widgetName);

    cy.get(commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName)).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage);
    cy.get(commonWidgetSelector.draggableWidget('textinput1')).should(
      "have.value",
      data.customMessage
    );

    verifyTooltip(
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName),
      data.tooltipText
    );

    verifyWidgetColorCss(buttonText.defaultWidgetName, "background-color", data.backgroundColor);
    verifyWidgetColorCss(buttonText.defaultWidgetName, "color", data.textColor);
    verifyLoaderColor(buttonText.defaultWidgetName, data.loaderColor);

    cy.get(commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName)).should(
      "have.css",
      "border-radius",
      "20px"
    );

    verifyBoxShadowCss(buttonText.defaultWidgetName, data.boxShadowColor, data.boxShadowParam);

    cy.get(commonSelectors.viewerPageLogo).click();
    cy.deleteApp(data.appName);
  });
});
