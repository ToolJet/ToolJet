import { commonWidgetSelector } from "Selectors/common";
import {
  addAndVerifyTooltip,
  openAccordion,
  openEditorSidebar,
  selectColourFromColourPicker,
  verifyAndModifyParameter,
  verifyAndModifyToggleFx,
} from "Support/utils/commonWidget";
import { commonWidgetText, customValidation } from "Texts/common";

export const addValidations = (
  widgetName,
  data,
  min = commonWidgetText.labelMinLength,
  max = commonWidgetText.labelMaxLength
) => {
  openEditorSidebar(widgetName);
  ß;
  openAccordion(commonWidgetText.accordionValidation);
  verifyAndModifyParameter(
    commonWidgetText.labelRegex,
    commonWidgetText.regularExpression
  );
  verifyAndModifyParameter(min, data.minimumLength);
  verifyAndModifyParameter(max, data.maximumLength);
  verifyAndModifyParameter(
    commonWidgetText.labelcustomValidadtion,
    customValidation(data.widgetName, data.customText)
  );
  verifyAndModifyToggleFx("Make this field mandatory", "");
};

export const addAndVerifyAdditionalActions = (widgetName, tooltipText) => {
  openEditorSidebar(widgetName);
  openAccordion("Additional Actions");
  verifyAndModifyToggleFx(
    commonWidgetText.parameterVisibility,
    commonWidgetText.codeMirrorLabelTrue
  );
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).should(
    "not.be.visible"
  );

  cy.get(
    commonWidgetSelector.parameterTogglebutton(
      commonWidgetText.parameterVisibility
    )
  ).click();

  verifyAndModifyToggleFx(
    commonWidgetText.parameterDisable,
    commonWidgetText.codeMirrorLabelFalse
  );
  cy.waitForAutoSave();
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).should(
    "have.attr",
    "disabled"
  );

  cy.get(
    commonWidgetSelector.parameterTogglebutton(
      commonWidgetText.parameterDisable
    )
  ).click();

  verifyAndModifyToggleFx(
    commonWidgetText.loadingState,
    commonWidgetText.codeMirrorLabelFalse
  );
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .parent()
    .within(() => {
      cy.get(".tj-widget-loader").should("be.visible");
    });

  cy.get(
    commonWidgetSelector.parameterTogglebutton(commonWidgetText.loadingState)
  ).click();

  addAndVerifyTooltip(
    commonWidgetSelector.draggableWidget(widgetName),
    tooltipText
  );
};

export const addAllInputFieldColors = (data) => {
  selectColourFromColourPicker("BG color", data.bgColor);
  selectColourFromColourPicker("Border color", data.borderColor);
  selectColourFromColourPicker("Text color", data.textColor);
  selectColourFromColourPicker("Error text color", data.errorTextColor);
  selectColourFromColourPicker("Icon color", data.iconColor);
};

export const addColor = (type, color) => {
  // cy.get(commonWidgetSelector.parameterFxButton(type)).click();

  selectColourFromColourPicker(type, color);
};
