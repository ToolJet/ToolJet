import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { numberInputText } from "Texts/numberInput";

import {
  addTextWidgetToVerifyValue,
  editAndVerifyWidgetName,
  fillBoxShadowParams,
  openAccordion,
  openEditorSidebar,
  randomNumber,
  selectColourFromColourPicker,
  verifyAndModifyParameter,
  verifyBoxShadowCss,
  verifyComponentValueFromInspector,
  verifyLayout,
  verifyPropertiesGeneralAccordion,
  verifyStylesGeneralAccordion,
  verifyTooltip,
} from "Support/utils/commonWidget";
import {
  addAllInputFieldColors,
  addAndVerifyAdditionalActions,
  addValidations,
  verifyInputFieldColors,
} from "Support/utils/editor/inputFieldUtils";

import {
  addDefaultEventHandler,
  closeAccordions,
} from "Support/utils/commonWidget";
import { verifyControlComponentAction } from "Support/utils/textInput";
import { widgetValue } from "Texts/common";

describe("Number Input", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-numberInput-App`);
    cy.openApp();
    cy.dragAndDropWidget("Number Input");
  });
  afterEach(() => {
    cy.apiDeleteApp();
  });

  it.only("should verify the properties of the text input widget", () => {
    const data = {};
    data.widgetName = fake.widgetName;
    data.tooltipText = fake.randomSentence;
    data.minimumLength = randomNumber(1, 4);
    data.maximumLength = randomNumber(8, 10);
    data.customText = randomNumber(12);
    data.customNumber = randomNumber(12);

    openEditorSidebar(numberInputText.defaultWidgetName);
    closeAccordions([
      "Properties",
      "Validation",
      "Additional Actions",
      "Devices",
      "Events",
    ]);
    editAndVerifyWidgetName(data.widgetName, [
      "Properties",
      "Validation",
      "Additional Actions",
      "Devices",
      "Events",
    ]);
    openAccordion(commonWidgetText.accordionProperties, [
      "Properties",
      "Validation",
      "Additional Actions",
      "Devices",
      "Events",
    ]);
    verifyAndModifyParameter(
      commonWidgetText.labelDefaultValue,
      data.customText
    );
    cy.forceClickOnCanvas();
    cy.get(
      commonWidgetSelector.draggableWidget(data.widgetName)
    ).verifyVisibleElement("have.value", data.customText);

    verifyComponentValueFromInspector(data.widgetName, data.customText);
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).clear();

    data.customText = fake.randomSentence;
    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionProperties, [
      "Properties",
      "Validation",
      "Additional Actions",
      "Devices",
      "Events",
    ]);
    verifyAndModifyParameter(
      commonWidgetText.labelPlaceHolder,
      data.customText
    );
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName))
      .invoke("attr", "placeholder")
      .should("contain", data.customText);

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionEvents, ["Validation", "Devices"]);
    addDefaultEventHandler(widgetValue(data.widgetName));
    cy.get(commonWidgetSelector.eventSelection).type("On Enter Pressed{Enter}");
    cy.log("---------------------");

    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).type(
      `${data.customNumber}{Enter}`
    );
    cy.verifyToastMessage(commonSelectors.toastMessage, data.customNumber);
    cy.forceClickOnCanvas();

    // cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).clear();

    addValidations(data.widgetName, data, "Min value", "Max value");

    cy.clearAndType(
      commonWidgetSelector.draggableWidget(data.widgetName),
      data.customText
    );
    cy.forceClickOnCanvas();
    cy.get(
      commonWidgetSelector.validationFeedbackMessage(data.widgetName)
    ).verifyVisibleElement("have.text", commonWidgetText.regexValidationError);

    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).clear();
    cy.get(
      commonWidgetSelector.parameterInputField(commonWidgetText.labelRegex)
    ).clearCodeMirror();

    cy.forceClickOnCanvas();
    cy.get(
      commonWidgetSelector.validationFeedbackMessage(data.widgetName)
    ).verifyVisibleElement(
      "have.text",
      commonWidgetText.minLengthValidationError(data.minimumLength)
    );

    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).clear();
    cy.get(
      commonWidgetSelector.parameterInputField(commonWidgetText.labelMinLength)
    ).clearCodeMirror();

    cy.forceClickOnCanvas();
    cy.clearAndType(
      commonWidgetSelector.draggableWidget(data.widgetName),
      data.customText
    );
    cy.get(
      commonWidgetSelector.validationFeedbackMessage(data.widgetName)
    ).verifyVisibleElement(
      "have.text",
      commonWidgetText.maxLengthValidationError(data.maximumLength)
    );
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).clear();
    cy.get(
      commonWidgetSelector.validationFeedbackMessage(data.widgetName)
    ).verifyVisibleElement("have.text", data.customText);

    cy.get(
      commonWidgetSelector.accordion(commonWidgetText.accordionProperties)
    ).click();
    cy.get(
      commonWidgetSelector.accordion(commonWidgetText.accordionValidation)
    ).click();
    addAndVerifyAdditionalActions(data.widgetName, data.tooltipText);

    openEditorSidebar(data.widgetName);
    cy.get(
      commonWidgetSelector.accordion(commonWidgetText.accordionProperties)
    ).click();
    cy.get(
      commonWidgetSelector.accordion(commonWidgetText.accordionValidation)
    ).click();
    verifyLayout(data.widgetName, "Devices");

    cy.get(commonWidgetSelector.changeLayoutToDesktopButton).click();
    cy.get(
      commonWidgetSelector.parameterTogglebutton(
        commonWidgetText.parameterShowOnDesktop
      )
    ).click();

    cy.get(commonWidgetSelector.widgetDocumentationLink).should(
      "have.text",
      numberInputText.textInputDocumentationLink
    );
    data.customText = fake.firstName;
    verifyControlComponentAction(data.widgetName, data.customText);
  });
  it("should verify the styles of the text input widget", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.colourHex = fake.randomRgbaHex;
    data.boxShadowColor = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;
    data.bgColor = fake.randomRgba;
    data.borderColor = fake.randomRgba;
    data.textColor = fake.randomRgba;
    data.errorTextColor = fake.randomRgba;
    data.iconColor = fake.randomRgba;

    openEditorSidebar(numberInputText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    addAllInputFieldColors(data);

    cy.clearAndType('[data-cy="border-radius-input"]', "20");
    cy.get('[data-cy="icon-visibility-button"]').click();

    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    cy.get(
      commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)
    ).should("have.css", "border-radius", "20px");

    verifyInputFieldColors("textinput1", data);

    verifyStylesGeneralAccordion(
      numberInputText.defaultWidgetName,
      data.boxShadowParam,
      data.colourHex,
      data.boxShadowColor,
      4
    );
  });

  it("should verify the app preview", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.tooltipText = fake.randomSentence;
    data.colourHex = fake.randomRgbaHex;
    data.boxShadowColor = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;
    data.randomNumber = randomNumber(10, 99);
    data.minimumvalue = randomNumber(5, 10);
    data.maximumValue = randomNumber(90, 99);

    openEditorSidebar(numberInputText.defaultWidgetName);
    verifyAndModifyParameter(
      commonWidgetText.labelDefaultValue,
      data.randomNumber
    );
    verifyAndModifyParameter(
      commonWidgetText.labelMinimumValue,
      `${data.minimumvalue}`
    );
    verifyAndModifyParameter(
      commonWidgetText.labelMaximumValue,
      `${data.maximumValue}`
    );
    verifyAndModifyParameter(
      commonWidgetText.labelPlaceHolder,
      data.randomNumber
    );

    verifyPropertiesGeneralAccordion(
      numberInputText.defaultWidgetName,
      data.tooltipText
    );

    openEditorSidebar(numberInputText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    verifyAndModifyParameter(
      commonWidgetText.parameterBorderRadius,
      commonWidgetText.borderRadiusInput
    );
    cy.forceClickOnCanvas();

    openEditorSidebar(numberInputText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion(commonWidgetText.accordionGenaral, [], 1);
    cy.get(commonWidgetSelector.boxShadowColorPicker).click();

    fillBoxShadowParams(
      commonWidgetSelector.boxShadowDefaultParam,
      data.boxShadowParam
    );
    selectColourFromColourPicker(
      commonWidgetText.boxShadowColor,
      data.boxShadowColor,
      3
    );
    addTextWidgetToVerifyValue("components.numberinput1.value");

    cy.waitForAutoSave();
    cy.openInCurrentTab(commonWidgetSelector.previewButton);

    cy.get(
      commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)
    ).verifyVisibleElement("have.value", data.randomNumber);

    cy.clearAndType(
      commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName),
      randomNumber(1, 4)
    );
    cy.forceClickOnCanvas();
    cy.get(
      commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)
    ).verifyVisibleElement("have.value", `${data.minimumvalue}`);
    cy.clearAndType(
      commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName),
      randomNumber(100, 110)
    );
    cy.forceClickOnCanvas();
    cy.get(
      commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)
    ).verifyVisibleElement("have.value", `${data.maximumValue}`);
    cy.get(
      commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)
    )
      .invoke("attr", "placeholder")
      .should("contain", data.randomNumber);

    verifyTooltip(
      commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName),
      data.tooltipText
    );
    cy.get(
      commonWidgetSelector.draggableWidget(commonWidgetText.text1)
    ).verifyVisibleElement("have.text", data.maximumValue);

    cy.get(
      commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)
    ).should("have.css", "border-radius", "20px");
    verifyBoxShadowCss(
      numberInputText.defaultWidgetName,
      data.boxShadowColor,
      data.boxShadowParam
    );
  });
});
