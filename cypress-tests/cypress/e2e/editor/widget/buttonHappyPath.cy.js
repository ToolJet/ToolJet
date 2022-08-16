import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { buttonText } from "Texts/button";
import { fake } from "Fixtures/fake";
import { commonWidgetText } from "Texts/common";

import {
  openButtonStylesEditorSideBar,
  openButtonPropertiesEditorSideBar,
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
  verifyWidgetCss,
  selectColourFromColourPicker,
  verifyLoaderColor,
  fillBoxShadowParams,
  verifyBoxShadowCss,
  verifyLayout,
  verifyTooltip,
} from "Support/utils/commonWidget";

describe("Editor- Test Button widget", () => {
  const data = {};
  data.alertMessage = fake.randomSentence;
  data.widgetName = fake.widgetName;
  data.customMessage = fake.randomSentence;
  data.colourHex = fake.randomRgbaHex;
  data.colour = fake.randomRgba;
  data.boxShadowParam = fake.boxShadowParam;
  data.appName = `${fake.companyName}-App`;

  beforeEach(() => {
    cy.appUILogin();
    cy.createApp(data.appName);
    cy.dragAndDropWidget(buttonText.defaultWidgetText);
  });

  it("should verify the properties of the button widget", () => {
    openButtonPropertiesEditorSideBar(
      buttonText.defaultWidgetText,
      buttonText.defaultWidgetName
    );

    cy.clearAndType(commonWidgetSelector.WidgetNameInputField, data.widgetName);
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();

    cy.get(
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetText)
    ).trigger("mouseover");
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
      data.customMessage
    );

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionLayout);
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
    openButtonStylesEditorSideBar(
      buttonText.defaultWidgetText,
      buttonText.defaultWidgetName
    );

    verifyAndModifyStylePickerFx(
      buttonText.backgroundColor,
      buttonText.defaultBackgroundColor,
      data.colourHex
    );

    cy.get(
      commonWidgetSelector.parameterFxButton(buttonText.backgroundColor)
    ).click();

    selectColourFromColourPicker(buttonText.backgroundColor, data.colour);

    verifyWidgetCss(
      buttonText.defaultWidgetText,
      "background-color",
      data.colour
    );

    openButtonStylesEditorSideBar(
      buttonText.defaultWidgetText,
      buttonText.defaultWidgetName
    );

    verifyAndModifyStylePickerFx(
      buttonText.textColor,
      buttonText.defaultTextColor,
      data.colourHex
    );

    cy.get(
      commonWidgetSelector.parameterFxButton(buttonText.textColor)
    ).click();

    selectColourFromColourPicker(buttonText.textColor, data.colour);

    verifyWidgetCss(buttonText.defaultWidgetText, "color", data.colour);

    openButtonStylesEditorSideBar(
      buttonText.defaultWidgetText,
      buttonText.defaultWidgetName
    );

    verifyAndModifyStylePickerFx(
      buttonText.loaderColor,
      buttonText.defaultLoaderColor,
      data.colourHex
    );

    cy.get(
      commonWidgetSelector.parameterFxButton(buttonText.loaderColor)
    ).click();
    selectColourFromColourPicker(buttonText.loaderColor, data.colour);

    verifyLoaderColor(buttonText.defaultWidgetText, data.colour);

    openButtonStylesEditorSideBar(
      buttonText.defaultWidgetText,
      buttonText.defaultWidgetName
    );
    verifyAndModifyToggleFx(
      commonWidgetText.parameterVisibility,
      commonWidgetText.codeMirrorLabelTrue
    );
    cy.get(
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetText)
    ).should("not.be.visible");
    cy.get(commonWidgetSelector.parameterTogglebutton("Visibility")).click();

    verifyAndModifyToggleFx(
      commonWidgetText.parameterDisable,
      commonWidgetText.codeMirrorLabelFalse
    );
    cy.save();
    cy.get(
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetText)
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
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetText)
    ).should("have.css", "border-radius", "20px");

    openButtonStylesEditorSideBar(
      buttonText.defaultWidgetText,
      buttonText.defaultWidgetName
    );

    openAccordion(commonWidgetText.accordionGenaral, "1");
    verifyAndModifyStylePickerFx(
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
      commonWidgetSelector.stylePicker(commonWidgetText.parameterBoxShadow)
    ).click();

    fillBoxShadowParams(
      commonWidgetSelector.boxShadowDefaultParam,
      data.boxShadowParam
    );

    selectColourFromColourPicker(commonWidgetText.boxShadowColor, data.colour);

    verifyBoxShadowCss(
      buttonText.defaultWidgetText,
      data.colour,
      data.boxShadowParam
    );
    cy.get(commonSelectors.editorPageLogo).click();
    cy.deleteApp(data.appName);
  });

  it("verify the app preview", () => {
    openButtonPropertiesEditorSideBar(
      buttonText.defaultWidgetText,
      buttonText.defaultWidgetName
    );

    cy.clearAndType(commonWidgetSelector.WidgetNameInputField, data.widgetName);
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();

    openButtonPropertiesEditorSideBar(
      buttonText.defaultWidgetText,
      data.widgetName
    );
    verifyAndModifyParameter(buttonText.buttonTextLabel, data.widgetName);

    openAccordion(buttonText.eventsAccordion);
    addDefaultEventHandler(data.alertMessage);

    openAccordion(commonWidgetText.accordionGenaral);
    addAndVerifyTooltip(
      commonWidgetSelector.draggableWidget(data.widgetName),
      data.customMessage
    );

    openButtonStylesEditorSideBar(data.widgetName, data.widgetName);
    selectColourFromColourPicker(buttonText.backgroundColor, data.colour);

    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    openButtonStylesEditorSideBar(data.widgetName, data.widgetName);
    selectColourFromColourPicker(buttonText.textColor, data.colour);

    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    openButtonStylesEditorSideBar(data.widgetName, data.widgetName);
    selectColourFromColourPicker(buttonText.loaderColor, data.colour);

    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    openButtonStylesEditorSideBar(data.widgetName, data.widgetName);

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

    selectColourFromColourPicker(commonWidgetText.boxShadowColor, data.colour);

    verifyControlComponentAction(data.widgetName, data.customMessage);

    cy.save();
    cy.openInCurrentTab(commonWidgetSelector.previewButton);

    cy.get(
      commonWidgetSelector.draggableWidget(data.widgetName)
    ).verifyVisibleElement("have.text", data.widgetName);

    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage);
    cy.get(commonWidgetSelector.textInputWidget).should(
      "have.value",
      data.customMessage
    );

    verifyTooltip(
      commonWidgetSelector.draggableWidget(data.widgetName),
      data.customMessage
    );

    verifyWidgetCss(data.widgetName, "background-color", data.colour);
    verifyWidgetCss(data.widgetName, "color", data.colour);
    verifyLoaderColor(data.widgetName, data.colour);

    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).should(
      "have.css",
      "border-radius",
      "20px"
    );

    verifyBoxShadowCss(data.widgetName, data.colour, data.boxShadowParam);

    cy.get(commonSelectors.viewerPageLogo).click();
    cy.deleteApp(data.appName);
  });
});
