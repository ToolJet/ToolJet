import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { buttonText } from "Texts/button";
import { fake } from "Fixtures/fake";
import { commonText, commonWidgetText } from "Texts/common";

import { openButtonStylesEditorSideBar } from "Support/utils/button";

import {
  openAccordion,
  verifyAndModifyParameter,
  openEditorSidebar,
  verifyAndModifyToggleFx,
  addDefaultEventHandler,
  addAndVerifyTooltip,
  verifyComponentFromInspector,
  verifyAndModifyDataPickerFx,
  verifyWidgetCss,
  selectColourFromColourPicker,
  verifyLoaderColor,
  fillBoxShadowParams,
  verifyBoxShadowCss,
} from "Support/utils/commonWidget";

describe("Editor- Test Button widget", () => {
  const data = {};
  data.alertMessage = fake.randomSentence;
  data.widgetName = fake.widgetName;
  data.appName = fake.companyName;
  data.customMessage = fake.randomSentence;

  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
    cy.dragAndDropWidget(buttonText.widgetName);
  });

  it("should verify the properties of the button widget", () => {
    cy.get(commonWidgetSelector.draggableWidget(buttonText.widgetName)).trigger(
      "mouseover"
    );
    cy.get(
      commonWidgetSelector.widgetConfigHandle(buttonText.defaultWidgetName)
    ).click();

    cy.clearAndType(commonWidgetSelector.WidgetNameInputField, data.widgetName);
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();

    cy.get(commonWidgetSelector.draggableWidget(buttonText.widgetName)).trigger(
      "mouseover"
    );
    cy.get(commonWidgetSelector.widgetConfigHandle(data.widgetName))
      .click()
      .should("have.text", data.widgetName)
      .click();
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
    openAccordion(buttonText.eventsAccordion);
    addDefaultEventHandler(data.alertMessage);
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage);

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionGenaral);
    addAndVerifyTooltip(
      commonWidgetSelector.draggableWidget(data.widgetName),
      fake.randomSentence
    );
    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionLayout);
    verifyAndModifyToggleFx(
      commonWidgetText.parameterShowOnDesktop,
      commonWidgetText.codeMirrorLabelTrue
    );
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).should(
      "not.exist"
    );

    verifyAndModifyToggleFx(
      commonWidgetText.parameterShowOnMobile,
      commonWidgetText.codeMirrorLabelFalse
    );
    cy.get(commonWidgetSelector.changeLayoutButton).click();
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).should(
      "exist"
    );

    cy.get(commonWidgetSelector.changeLayoutButton).click();

    cy.get(commonWidgetSelector.widgetDocumentationLink).should(
      "have.text",
      buttonText.buttonDocumentationLink
    );
  });
  it("should verify the styles of the button widget", () => {
    data.colourHex = fake.randomRgbaHex;
    data.colour = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;

    openButtonStylesEditorSideBar();

    verifyAndModifyDataPickerFx(
      buttonText.backgroundColor,
      buttonText.defaultBackgroundColor,
      data.colourHex
    );

    cy.get(
      commonWidgetSelector.parameterFxButton(buttonText.backgroundColor)
    ).click();

    selectColourFromColourPicker(buttonText.backgroundColor, data.colour);

    verifyWidgetCss(buttonText.widgetName, "background-color", data.colour);

    openButtonStylesEditorSideBar();

    verifyAndModifyDataPickerFx(
      buttonText.textColor,
      buttonText.defaultTextColor,
      data.colourHex
    );

    cy.get(
      commonWidgetSelector.parameterFxButton(buttonText.textColor)
    ).click();

    selectColourFromColourPicker(buttonText.textColor, data.colour);

    verifyWidgetCss(buttonText.widgetName, "color", data.colour);

    openButtonStylesEditorSideBar();

    verifyAndModifyDataPickerFx(
      buttonText.loaderColor,
      buttonText.defaultLoaderColor,
      data.colourHex
    );

    cy.get(
      commonWidgetSelector.parameterFxButton(buttonText.loaderColor)
    ).click();
    selectColourFromColourPicker(buttonText.loaderColor, data.colour);

    verifyLoaderColor(buttonText.widgetName, data.colour);

    openButtonStylesEditorSideBar();
    verifyAndModifyToggleFx(
      commonWidgetText.parameterVisibility,
      commonWidgetText.codeMirrorLabelTrue
    );
    cy.get(commonWidgetSelector.draggableWidget(buttonText.widgetName)).should(
      "not.be.visible"
    );
    cy.get(commonWidgetSelector.parameterTogglebutton("Visibility")).click();

    verifyAndModifyToggleFx(
      commonWidgetText.parameterDisable,
      commonWidgetText.codeMirrorLabelFalse
    );
    cy.get(commonSelectors.autoSave, { timeout: 9000 }).should(
      "have.text",
      commonText.autoSave
    );
    cy.get(commonWidgetSelector.draggableWidget(buttonText.widgetName)).should(
      "have.attr",
      "disabled"
    );

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
    cy.get(commonWidgetSelector.draggableWidget(buttonText.widgetName)).should(
      "have.css",
      "border-radius",
      "20px"
    );

    openButtonStylesEditorSideBar();

    openAccordion(commonWidgetText.accordionGenaral, "1");
    verifyAndModifyDataPickerFx(
      commonWidgetText.parameterBoxShadow,
      commonWidgetText.boxShadowDefaultValue,
      commonWidgetText.boxShadowFxValue
    );
    cy.get(
      commonWidgetSelector.parameterFxButton(
        commonWidgetText.parameterBoxShadow
      )
    ).click();

    cy.get(
      commonWidgetSelector.dataPicker(commonWidgetText.parameterBoxShadow)
    ).click();

    fillBoxShadowParams(
      commonWidgetSelector.boxShadowDefaultParam,
      data.boxShadowParam
    );

    selectColourFromColourPicker(commonWidgetText.boxShadowColor, data.colour);

    verifyBoxShadowCss(buttonText.widgetName, data.colour, data.boxShadowParam);
  });
});
