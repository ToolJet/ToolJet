import { datePickerSelector } from "Selectors/datePicker";
import { datePickerText } from "Texts/datePicker";
import { commonText, commonWidgetText } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { randomDateOrTime } from "Support/utils/common";

import {
  selectAndVerifyDate,
  selectAndVerifyTime,
  verifyDate,
} from "Support/utils/datePickerWidget";
import {
  openAccordion,
  verifyAndModifyParameter,
  openEditorSidebar,
  verifyAndModifyToggleFx,
  addDefaultEventHandler,
  addAndVerifyTooltip,
  editAndVerifyWidgetName,
  verifyComponentValueFromInspector,
} from "Support/utils/commonWidget";

describe("Date Picker widget", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
    cy.dragAndDropWidget("Date Picker");
  });

  it("should verify the properties of the date picker widget", () => {
    const data = {};
    data.alertMessage = fake.randomSentence;
    data.widgetName = fake.widgetName;
    data.date = randomDateOrTime();
    data.customMessage = fake.randomSentence;
    data.randomTime = randomDateOrTime("hh:mm");

    openEditorSidebar(
      datePickerSelector.draggableDatePicker,
      datePickerText.datepicker1
    );
    editAndVerifyWidgetName(
      datePickerSelector.draggableDatePicker,
      data.widgetName
    );

    openAccordion(commonWidgetText.accordionProperties);
    verifyAndModifyParameter(datePickerText.labelDefaultValue, data.date);
    verifyComponentValueFromInspector(data.widgetName, data.date);

    verifyDate(data.date);
    data.date = randomDateOrTime();
    selectAndVerifyDate(data.date);

    openEditorSidebar(datePickerSelector.draggableDatePicker, data.widgetName);
    verifyAndModifyParameter(datePickerText.labelformat, "DD/MM/YY");
    verifyDate(data.date, "DD/MM/YY");
    verifyComponentValueFromInspector(data.widgetName, data.date, "opened");
    cy.get(commonSelectors.canvas).click({ force: true });

    openEditorSidebar(datePickerSelector.draggableDatePicker, data.widgetName);
    verifyAndModifyParameter(
      datePickerText.labelEnableDateSection,
      commonWidgetText.codeMirrorInputFalse
    );
    verifyDate("");

    openEditorSidebar(datePickerSelector.draggableDatePicker, data.widgetName);
    verifyAndModifyParameter(
      datePickerText.labelEnableTimeSection,
      commonWidgetText.codeMirrorInputTrue
    );
    verifyDate(datePickerText.defaultTime, "hh:mm A");
    selectAndVerifyTime(data.randomTime);

    openEditorSidebar(datePickerSelector.draggableDatePicker, data.widgetName);
    verifyAndModifyParameter(datePickerText.labelDisabledDates, [
      "{{",
      "[05-01]}}",
    ]); //WIP
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    openEditorSidebar(datePickerSelector.draggableDatePicker, data.widgetName);

    openAccordion(commonWidgetText.accordionEvents);
    cy.get(
      commonWidgetSelector.parameterInputField(
        datePickerText.labelEnableDateSection
      )
    ).clearAndTypeOnCodeMirror(commonWidgetText.codeMirrorInputTrue);
    cy.get(
      commonWidgetSelector.parameterInputField(
        datePickerText.labelEnableTimeSection
      )
    ).clearAndTypeOnCodeMirror(commonWidgetText.codeMirrorInputFalse);

    cy.get(commonWidgetSelector.noEventHandlerMessage).should(
      "have.text",
      datePickerText.noEventMessage
    );
    addDefaultEventHandler(data.alertMessage);
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    data.date = randomDateOrTime();
    selectAndVerifyDate(data.date, "DD/MM/YY");
    cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage);

    openEditorSidebar(datePickerSelector.draggableDatePicker, data.widgetName);
    openAccordion(commonWidgetText.accordionGenaral);
    addAndVerifyTooltip(
      datePickerSelector.draggableDatePicker,
      fake.randomSentence
    );

    openEditorSidebar(datePickerSelector.draggableDatePicker, data.widgetName);
    openAccordion(commonWidgetText.accordionValidation);
    verifyAndModifyParameter(
      commonWidgetText.parameterCustomValidation,
      datePickerText.customValidation(data.widgetName, data.customMessage)
    );
    data.date = randomDateOrTime();
    selectAndVerifyDate(data.date, "DD/MM/YY");
    cy.get(datePickerSelector.validationFeedbackMessage).should(
      "have.text",
      data.customMessage
    );

    openEditorSidebar(datePickerSelector.draggableDatePicker, data.widgetName);
    openAccordion(commonWidgetText.accordionLayout);
    verifyAndModifyToggleFx(
      commonWidgetText.parameterShowOnDesktop,
      commonWidgetText.codeMirrorLabelTrue
    );
    cy.get(datePickerSelector.draggableDatePicker).should("not.exist");

    verifyAndModifyToggleFx(
      commonWidgetText.parameterShowOnMobile,
      commonWidgetText.codeMirrorLabelFalse
    );
    cy.get(commonWidgetSelector.changeLayoutButton).click();
    cy.get(datePickerSelector.draggableDatePicker).should("exist");
  });

  it("should verify the styles of the date picker widget", () => {
    openEditorSidebar(
      datePickerSelector.draggableDatePicker,
      datePickerText.datepicker1
    );
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    cy.get(commonWidgetSelector.widgetDocumentationLink).should(
      "have.text",
      commonWidgetText.datepickerDocumentationLink
    );

    verifyAndModifyToggleFx(
      commonWidgetText.parameterVisibility,
      commonWidgetText.codeMirrorLabelTrue
    );
    cy.get(datePickerSelector.draggableDatePicker).should("not.be.visible");
    cy.get(commonWidgetSelector.parameterTogglebutton("Visibility")).click();

    verifyAndModifyToggleFx(
      commonWidgetText.parameterDisable,
      commonWidgetText.codeMirrorLabelFalse
    );
    cy.get(commonSelectors.autoSave, { timeout: 9000 }).should(
      "have.text",
      commonText.autoSave
    );
    cy.get(datePickerSelector.draggableDatePicker)
      .find("input")
      .should("have.css", "pointer-events", "none");

    verifyAndModifyParameter(
      commonWidgetText.parameterBorderRadius,
      commonWidgetText.borderRadiusInput
    );
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    cy.get(datePickerSelector.draggableDatePicker)
      .find("input")
      .should("have.css", "border-radius", "20px");
  });
});
