import moment from "moment";
import { datePickerSelector } from "Selectors/datePicker";
import { datePickerText } from "Texts/datePicker";
import { commonText, commonWidgetText } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { randomDateOrTime } from "Support/utils/common";
import { multiselectSelector } from "Selectors/multiselect";

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
  fillBoxShadowParams,
  selectColourFromColourPicker,
  addTextWidgetToVerifyValue,
  verifyBoxShadowCss,
  verifyTooltip,
  verifyWidgetText,
  closeAccordions,
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

    openEditorSidebar(datePickerText.datepicker1);
    editAndVerifyWidgetName(data.widgetName);

    openAccordion(commonWidgetText.accordionProperties, [
      "Events",
      "Validation",
      "Properties",
      "General",
    ]);
    verifyAndModifyParameter(datePickerText.labelDefaultValue, data.date);
    verifyComponentValueFromInspector(data.widgetName, data.date);

    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    verifyDate(data.widgetName, data.date);
    data.date = randomDateOrTime();
    selectAndVerifyDate(data.widgetName, data.date);

    openEditorSidebar(data.widgetName);
    verifyAndModifyParameter(datePickerText.labelformat, "DD/MM/YY");
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    verifyDate(data.widgetName, data.date, "DD/MM/YY");
    verifyComponentValueFromInspector(data.widgetName, data.date);
    cy.get(commonSelectors.canvas).click({ force: true });

    openEditorSidebar(data.widgetName);

    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    // verifyDate(data.widgetName, "");
    openEditorSidebar(data.widgetName);
    verifyAndModifyToggleFx(
      datePickerText.labelEnableDateSection,
      commonWidgetText.codeMirrorLabelTrue,
      true
    );

    verifyAndModifyToggleFx(
      datePickerText.labelEnableTimeSection,
      commonWidgetText.codeMirrorLabelFalse,
      true
    );
    openEditorSidebar(data.widgetName);

    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    verifyDate(data.widgetName, datePickerText.defaultTime, "hh:mm A");
    selectAndVerifyTime(data.widgetName, data.randomTime);
    verifyAndModifyToggleFx(
      datePickerText.labelEnableTimeSection,
      commonWidgetText.codeMirrorLabelTrue
    );

    openEditorSidebar(data.widgetName);
    verifyAndModifyParameter(datePickerText.labelDisabledDates, [
      "{{",
      "[05-01]}}",
    ]); //WIP
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    openEditorSidebar(data.widgetName);

    openAccordion(commonWidgetText.accordionProperties, [
      "Events",
      "Validation",
      "Properties",
      "General",
    ]);
    cy.get(
      commonWidgetSelector.parameterTogglebutton(
        datePickerText.labelEnableDateSection
      )
    ).click();

    openAccordion(commonWidgetText.accordionEvents);
    cy.get(commonWidgetSelector.noEventHandlerMessage).should(
      "have.text",
      datePickerText.noEventMessage
    );
    addDefaultEventHandler(data.alertMessage);
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    data.date = randomDateOrTime();
    selectAndVerifyDate(data.widgetName, data.date, "DD/MM/YY");
    cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage);

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionGenaral);
    addAndVerifyTooltip(
      commonWidgetSelector.draggableWidget(data.widgetName),
      fake.randomSentence
    );

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionValidation);
    verifyAndModifyParameter(
      commonWidgetText.parameterCustomValidation,
      datePickerText.customValidation(data.widgetName, data.customMessage)
    );
    data.date = randomDateOrTime();
    selectAndVerifyDate(data.widgetName, data.date, "DD/MM/YY");
    cy.get(datePickerSelector.validationFeedbackMessage).should(
      "have.text",
      data.customMessage
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

    // verifyAndModifyToggleFx(
    //   commonWidgetText.parameterShowOnMobile,
    //   commonWidgetText.codeMirrorLabelFalse
    // );
    // cy.get(commonWidgetSelector.changeLayoutButton).click();
    // cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).should(
    //   "exist"
    // );
  });

  it("should verify the styles of the date picker widget", () => {
    openEditorSidebar(datePickerText.datepicker1);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    cy.get(commonWidgetSelector.widgetDocumentationLink).should(
      "have.text",
      commonWidgetText.datepickerDocumentationLink
    );

    verifyAndModifyToggleFx(
      commonWidgetText.parameterVisibility,
      commonWidgetText.codeMirrorLabelTrue
    );
    cy.get(
      commonWidgetSelector.draggableWidget(datePickerText.datepicker1)
    ).should("not.be.visible");
    cy.get(commonWidgetSelector.parameterTogglebutton("Visibility")).click();

    verifyAndModifyToggleFx(
      commonWidgetText.parameterDisable,
      commonWidgetText.codeMirrorLabelFalse
    );
    cy.get(commonSelectors.autoSave, { timeout: 9000 }).should(
      "have.text",
      commonText.autoSave
    );
    cy.get(commonWidgetSelector.draggableWidget(datePickerText.datepicker1))
      .find("input")
      .should("have.css", "pointer-events", "none");

    verifyAndModifyParameter(
      commonWidgetText.parameterBorderRadius,
      commonWidgetText.borderRadiusInput
    );
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    cy.get(commonWidgetSelector.draggableWidget(datePickerText.datepicker1))
      .find("input")
      .should("have.css", "border-radius", "20px");
  });

  it("should verify widget in preview", () => {
    const data = {};
    data.alertMessage = fake.randomSentence;
    data.widgetName = fake.widgetName;
    data.date = randomDateOrTime();
    data.customMessage = fake.randomSentence;
    data.tooltipText = fake.randomSentence;
    data.randomTime = randomDateOrTime("hh:mm");
    data.colour = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;

    openEditorSidebar(datePickerText.datepicker1);
    editAndVerifyWidgetName(data.widgetName);

    openAccordion(commonWidgetText.accordionProperties, [
      "Events",
      "Validation",
      "Properties",
      "General",
    ]);
    verifyAndModifyParameter(datePickerText.labelDefaultValue, data.date);
    verifyAndModifyParameter(datePickerText.labelformat, "DD/MM/YY");

    cy.get(
      `${commonWidgetSelector.parameterFxButton(
        datePickerText.labelEnableDateSection
      )}:eq(1)`
    ).click();
    cy.get(
      commonWidgetSelector.parameterInputField(
        datePickerText.labelEnableDateSection
      )
    ).clearAndTypeOnCodeMirror([
      `{{`,
      `!components.${commonWidgetText.toggleswitch1}.value}}`,
    ]);

    cy.get(
      `${commonWidgetSelector.parameterFxButton(
        datePickerText.labelEnableTimeSection
      )}:eq(1)`
    ).click();
    cy.get(
      commonWidgetSelector.parameterInputField(
        datePickerText.labelEnableTimeSection
      )
    ).clearAndTypeOnCodeMirror([
      `{{`,
      `components.${commonWidgetText.toggleswitch1}.value}}`,
    ]);

    openAccordion(commonWidgetText.accordionEvents);
    addDefaultEventHandler(data.alertMessage);

    openAccordion(commonWidgetText.accordionGenaral);
    addAndVerifyTooltip(
      commonWidgetSelector.draggableWidget(data.widgetName),
      data.tooltipText
    );

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionValidation);
    verifyAndModifyParameter(
      commonWidgetText.parameterCustomValidation,
      datePickerText.customValidation(data.widgetName, data.customMessage)
    );

    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    verifyAndModifyParameter(
      commonWidgetText.parameterBorderRadius,
      commonWidgetText.borderRadiusInput
    );

    openAccordion(commonWidgetText.accordionGenaral, []);

    cy.get(
      commonWidgetSelector.stylePicker(commonWidgetText.parameterBoxShadow)
    ).click();

    fillBoxShadowParams(
      commonWidgetSelector.boxShadowDefaultParam,
      data.boxShadowParam
    );
    selectColourFromColourPicker(commonWidgetText.boxShadowColor, data.colour);

    addTextWidgetToVerifyValue(`components.${data.widgetName}.value`);
    cy.dragAndDropWidget(commonWidgetText.toggleSwitch, 600, 160);
    cy.waitForAutoSave()

    cy.openInCurrentTab(commonWidgetSelector.previewButton);

    /*  verifyDate(data.widgetName, data.date, "DD/MM/YY");
    verifyWidgetText(
      commonWidgetText.text1,
      moment(data.date, "DD/MM/YYYY").format("DD/MM/YY")
    );*/

    data.date = randomDateOrTime();
    selectAndVerifyDate(data.widgetName, data.date, "DD/MM/YY");
    verifyWidgetText(
      commonWidgetText.text1,
      moment(data.date, "DD/MM/YYYY").format("DD/MM/YY")
    );

    cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage);

    verifyTooltip(
      commonWidgetSelector.draggableWidget(data.widgetName),
      data.tooltipText
    );

    cy.get(datePickerSelector.validationFeedbackMessage).should(
      "have.text",
      data.customMessage
    );

    cy.get(commonWidgetSelector.draggableWidget(data.widgetName))
      .find("input")
      .should("have.css", "border-radius", "20px");

    verifyBoxShadowCss(data.widgetName, data.colour, data.boxShadowParam);

    cy.get(commonWidgetSelector.draggableWidget(commonWidgetText.toggleswitch1))
      .find(".form-check-input")
      .click();

    verifyDate(data.widgetName, datePickerText.defaultTime, "hh:mm A");
    // verifyWidgetText(commonWidgetText.text1, datePickerText.defaultTime);

    selectAndVerifyTime(data.widgetName, data.randomTime);
    verifyWidgetText(
      commonWidgetText.text1,
      moment(data.randomTime, "hh:mm").format("h:mm A")
    );
  });
});
