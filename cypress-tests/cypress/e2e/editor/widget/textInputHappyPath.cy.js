import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import {
  addDefaultEventHandler,
  closeAccordions,
  editAndVerifyWidgetName,
  openAccordion,
  openEditorSidebar,
  randomNumber,
  verifyAndModifyParameter,
  verifyBoxShadowCss,
  verifyComponentValueFromInspector,
  verifyLayout,
  verifyPropertiesGeneralAccordion,
  verifyStylesGeneralAccordion,
  verifyTooltip,
  verifyContainerElements,
  checkPaddingOfContainer,
  selectColourFromColourPicker,
  verifyWidgetColorCss,
} from "Support/utils/commonWidget";
import {
  addAllInputFieldColors,
  addAndVerifyAdditionalActions,
  addValidations,
  verifyInputFieldColors,
  verifyLabelStyleElements,
  verifyAlignment,
  addCustomWidthOfLabel,
  verifyCustomWidthOfLabel,
} from "Support/utils/editor/inputFieldUtils";
import {
  addSupportCSAData,
  selectCSA,
  selectEvent,
} from "Support/utils/events";
import {
  randomString,
  verifyControlComponentAction,
} from "Support/utils/textInput";
import { buttonText } from "Texts/button";
import { commonWidgetText, customValidation, widgetValue } from "Texts/common";
import { textInputText } from "Texts/textInput";

describe("Text Input", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Textinput-App`);
    cy.openApp();
    cy.dragAndDropWidget("Text Input", 500, 500);
  });
  afterEach(() => {
    cy.apiDeleteApp();
  });

  it("should verify the properties of the text input widget", () => {
    const data = {};
    data.widgetName = fake.widgetName;
    data.tooltipText = fake.randomSentence;
    data.minimumLength = randomNumber(1, 4);
    data.maximumLength = randomNumber(8, 10);
    data.customText = randomString(12);

    openEditorSidebar(textInputText.defaultWidgetName);
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

    cy.clearAndType(
      commonWidgetSelector.draggableWidget(data.widgetName),
      `${data.customText}{Enter}`
    );
    cy.verifyToastMessage(commonSelectors.toastMessage, data.customText);
    cy.forceClickOnCanvas();

    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).clear();

    addValidations(data.widgetName, data);

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
      textInputText.textInputDocumentationLink
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
    data.labelColor = fake.randomRgba;

    openEditorSidebar(textInputText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    addAllInputFieldColors(data);

    cy.clearAndType('[data-cy="border-radius-input"]', "20");
    cy.get('[data-cy="icon-visibility-button"]').click();

    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    cy.get(
      commonWidgetSelector.draggableWidget(textInputText.defaultWidgetName)
    ).should("have.css", "border-radius", "20px");

    verifyInputFieldColors("textinput1", data);

    verifyStylesGeneralAccordion(
      textInputText.defaultWidgetName,
      data.boxShadowParam,
      data.colourHex,
      data.boxShadowColor,
      4
    );

    openEditorSidebar(textInputText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    verifyContainerElements();
    checkPaddingOfContainer(textInputText.defaultWidgetName, 1);
    cy.get('[data-cy="togglr-button-none"]').click();
    checkPaddingOfContainer(textInputText.defaultWidgetName, 0);

    verifyLabelStyleElements();
    verifyAlignment(textInputText.defaultWidgetName, "sideLeft");
    cy.get('[data-cy="togglr-button-top"]').click();
    verifyAlignment(textInputText.defaultWidgetName, "topLeft");
    cy.get('[data-cy="togglr-button-right"]').click();
    verifyAlignment(textInputText.defaultWidgetName, "topRight");
    cy.get('[data-cy="togglr-button-side"]').click();
    verifyAlignment(textInputText.defaultWidgetName, "sideRight");
    cy.get('[data-cy="togglr-button-left"]').click();
    verifyAlignment(textInputText.defaultWidgetName, "sideLeft");
    addCustomWidthOfLabel("50");
    verifyCustomWidthOfLabel(textInputText.defaultWidgetName, "50");
    selectColourFromColourPicker(
      "Text",
      data.labelColor,
      0,
      commonWidgetSelector.colourPickerParent,
      "0"
    );
    verifyWidgetColorCss(
      `[data-cy="label-${textInputText.defaultWidgetName}"]>label`,
      "color",
      data.labelColor,
      true
    );
  });

  it.skip("should verify the app preview", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.widgetName = fake.widgetName;
    data.tooltipText = fake.randomSentence;
    data.maxLengthErrText = fake.randomSentence;
    data.colourHex = fake.randomRgbaHex;
    data.boxShadowColor = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;
    data.minimumLength = randomNumber(1, 4);
    data.maximumLength = randomNumber(8, 10);
    data.customText = randomString(12);
    data.maxLengthText = randomString(data.maximumLength);

    openEditorSidebar(textInputText.defaultWidgetName);
    verifyAndModifyParameter(
      commonWidgetText.labelDefaultValue,
      data.customText
    );

    verifyAndModifyParameter(
      commonWidgetText.labelPlaceHolder,
      data.customText
    );

    openAccordion(commonWidgetText.accordionEvents, ["Validation", "Devices"]);
    addDefaultEventHandler(widgetValue(textInputText.defaultWidgetName));
    cy.get(commonWidgetSelector.eventSelection).type("On Enter Pressed{Enter}");

    openAccordion(commonWidgetText.accordionValidation);
    verifyAndModifyParameter(
      commonWidgetText.labelRegex,
      commonWidgetText.regularExpression
    );
    verifyAndModifyParameter(
      commonWidgetText.labelMinLength,
      data.minimumLength
    );
    verifyAndModifyParameter(
      commonWidgetText.labelMaxLength,
      data.maximumLength
    );
    verifyAndModifyParameter(
      commonWidgetText.labelcustomValidadtion,
      customValidation(textInputText.defaultWidgetName, data.customText)
    );
    verifyPropertiesGeneralAccordion(
      textInputText.defaultWidgetName,
      data.tooltipText
    );

    verifyControlComponentAction(
      textInputText.defaultWidgetName,
      data.customText
    );

    openEditorSidebar(textInputText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    verifyAndModifyParameter(
      commonWidgetText.parameterBorderRadius,
      commonWidgetText.borderRadiusInput
    );
    verifyStylesGeneralAccordion(
      textInputText.defaultWidgetName,
      data.boxShadowParam,
      data.colourHex,
      data.boxShadowColor,
      4
    );

    cy.waitForAutoSave();
    cy.openInCurrentTab(commonWidgetSelector.previewButton);

    cy.get(
      commonWidgetSelector.draggableWidget(textInputText.defaultWidgetName)
    ).verifyVisibleElement("have.value", data.customText);
    cy.get(
      commonWidgetSelector.draggableWidget(textInputText.defaultWidgetName)
    )
      .invoke("attr", "placeholder")
      .should("contain", data.customText);

    cy.get(
      commonWidgetSelector.draggableWidget(textInputText.defaultWidgetName)
    )
      .type(`{selectAll}{backspace}{enter}`)
      .type(data.customText);
    cy.forceClickOnCanvas();
    cy.get(
      commonWidgetSelector.validationFeedbackMessage(
        textInputText.defaultWidgetName
      )
    ).verifyVisibleElement("have.text", commonWidgetText.regexValidationError);
    cy.get(
      commonWidgetSelector.draggableWidget(textInputText.defaultWidgetName)
    ).clear();
    cy.get(
      commonWidgetSelector.validationFeedbackMessage(
        textInputText.defaultWidgetName
      )
    ).verifyVisibleElement(
      "have.text",
      commonWidgetText.minLengthValidationError(data.minimumLength)
    );

    cy.clearAndType(
      commonWidgetSelector.draggableWidget(textInputText.defaultWidgetName),
      data.customText.toUpperCase()
    );
    cy.get(
      commonWidgetSelector.validationFeedbackMessage(
        textInputText.defaultWidgetName
      )
    ).verifyVisibleElement(
      "have.text",
      commonWidgetText.maxLengthValidationError(data.maximumLength)
    );

    cy.clearAndType(
      commonWidgetSelector.draggableWidget(textInputText.defaultWidgetName),
      `${data.maxLengthText.toUpperCase()}{Enter}`
    );
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      data.maxLengthText.toUpperCase()
    );
    cy.get(
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName)
    ).should("have.text", data.maxLengthText.toUpperCase());

    cy.get(
      commonWidgetSelector.draggableWidget(textInputText.defaultWidgetName)
    ).should("have.css", "border-radius", "20px");

    verifyBoxShadowCss(
      textInputText.defaultWidgetName,
      data.boxShadowColor,
      data.boxShadowParam
    );

    verifyTooltip(
      commonWidgetSelector.draggableWidget(textInputText.defaultWidgetName),
      data.tooltipText
    );
  });

  it("should verify CSA", () => {
    const data = {};
    data.customText = randomString(12);

    cy.forceClickOnCanvas();
    cy.dragAndDropWidget(buttonText.defaultWidgetText, 50, 500);
    selectEvent("On click", "Control Component");
    selectCSA("textinput1", "Visibility");

    cy.forceClickOnCanvas();
    cy.dragAndDropWidget("Text input", 50, 50);
    selectEvent("On change", "Control Component");
    cy.wait(500);
    selectCSA("textinput1", "Set text", "500");
    cy.wait(500);
    addSupportCSAData("text", "{{components.textinput2.value");

    cy.forceClickOnCanvas();
    cy.dragAndDropWidget(buttonText.defaultWidgetText, 150, 400);
    selectEvent("On click", "Control Component");
    selectCSA("textinput1", "Clear", "500");

    cy.forceClickOnCanvas();
    cy.dragAndDropWidget(buttonText.defaultWidgetText, 250, 400);
    selectEvent("On click", "Control Component");
    selectCSA("textinput1", "Disable", "500");
    cy.wait(500);
    cy.get('[data-cy="event-Value-fx-button"]').click();
    cy.get('[data-cy="event-Value-input-field"]').clearAndTypeOnCodeMirror(
      "{{true"
    );

    cy.forceClickOnCanvas();
    cy.dragAndDropWidget(buttonText.defaultWidgetText, 350, 400);
    selectEvent("On click", "Control Component");
    selectCSA("textinput1", "Set blur", "500");

    cy.forceClickOnCanvas();
    cy.dragAndDropWidget(buttonText.defaultWidgetText, 450, 400);
    selectEvent("On click", "Control Component");
    selectCSA("textinput1", "Set focus");

    cy.forceClickOnCanvas();
    cy.dragAndDropWidget(buttonText.defaultWidgetText, 550, 400);
    selectEvent("On click", "Control Component");
    selectCSA("textinput1", "Set disable", "500");

    cy.forceClickOnCanvas();
    cy.dragAndDropWidget(buttonText.defaultWidgetText, 650, 400);
    selectEvent("On click", "Control Component");
    selectCSA("textinput1", "Set visibility", "500");
    cy.wait(500);
    cy.get('[data-cy="event-Value-fx-button"]').click();
    cy.get('[data-cy="event-Value-input-field"]').clearAndTypeOnCodeMirror(
      "{{true"
    );

    cy.forceClickOnCanvas();
    cy.dragAndDropWidget(buttonText.defaultWidgetText, 300, 300);
    selectEvent("On click", "Control Component");
    selectCSA("textinput1", "Set loading", "500");
    cy.wait(500);
    cy.get('[data-cy="event-Value-fx-button"]').click();
    cy.get('[data-cy="event-Value-input-field"]').clearAndTypeOnCodeMirror(
      "{{true"
    );

    cy.clearAndType(
      commonWidgetSelector.draggableWidget("textinput2"),
      data.customText
    );
    cy.get(
      commonWidgetSelector.draggableWidget("textinput1")
    ).verifyVisibleElement("have.value", data.customText);

    cy.get(commonWidgetSelector.draggableWidget("button2")).click();
    cy.get(
      commonWidgetSelector.draggableWidget("textinput1")
    ).verifyVisibleElement("have.value", "");

    cy.get(commonWidgetSelector.draggableWidget("button5")).click();
    cy.realType(data.customText);
    cy.get(
      commonWidgetSelector.draggableWidget("textinput1")
    ).verifyVisibleElement("have.value", data.customText);
    cy.get(commonWidgetSelector.draggableWidget("button4")).click();
    cy.realType("not working");
    cy.get(
      commonWidgetSelector.draggableWidget("textinput1")
    ).verifyVisibleElement("have.value", data.customText);

    cy.get(commonWidgetSelector.draggableWidget("button3")).click();
    cy.get(commonWidgetSelector.draggableWidget("textinput1"))
      .parent()
      .should("have.attr", "data-disabled", "true");

    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.get(commonWidgetSelector.draggableWidget("textinput1")).should(
      "not.be.visible"
    );

    cy.get(commonWidgetSelector.draggableWidget("button7")).click();
    cy.get(commonWidgetSelector.draggableWidget("textinput1")).should(
      "be.visible"
    );

    cy.get(commonWidgetSelector.draggableWidget("button6")).click();
    cy.get(commonWidgetSelector.draggableWidget("textinput1"))
      .parent()
      .should("not.have.attr", "data-disabled", "true");

    cy.get(commonWidgetSelector.draggableWidget("button8")).click();
    cy.get(commonWidgetSelector.draggableWidget("textinput1"))
      .parent()
      .within(() => {
        cy.get(".tj-widget-loader").should("be.visible");
      });
  });
});
