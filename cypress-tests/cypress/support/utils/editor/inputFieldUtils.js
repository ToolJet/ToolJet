import { commonWidgetSelector } from "Selectors/common";
import {
  addAndVerifyTooltip,
  openAccordion,
  openEditorSidebar,
  selectColourFromColourPicker,
  verifyAndModifyParameter,
  verifyAndModifyToggleFx,
  verifyWidgetColorCss,
} from "Support/utils/commonWidget";
import { commonWidgetText, customValidation } from "Texts/common";
import { textInputText } from "Texts/textInput";

export const addValidations = (
  widgetName,
  data,
  min = commonWidgetText.labelMinLength,
  max = commonWidgetText.labelMaxLength
) => {
  openEditorSidebar(widgetName);
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

export const verifyInputFieldColors = (selectorInput, data) => {
  verifyWidgetColorCss(selectorInput, "color", data.textColor);
  verifyWidgetColorCss(selectorInput, "border-color", data.borderColor);
  verifyWidgetColorCss(selectorInput, "background-color", data.bgColor);
  openEditorSidebar(textInputText.defaultWidgetName);
  cy.get('[data-cy="make-this-field-mandatory-toggle-button"]').click();
  cy.get(commonWidgetSelector.draggableWidget("textinput1")).clear();
  cy.forceClickOnCanvas();
  cy.verifyCssProperty(
    '[data-cy="textinput1-invalid-feedback"]',
    "color",
    `rgba(${data.errorTextColor[0]}, ${data.errorTextColor[1]}, ${
      data.errorTextColor[2]
    }, ${data.errorTextColor[3] / 100})`
  );

  cy.get(commonWidgetSelector.draggableWidget("textinput1"))
    .siblings("svg")
    .should(
      "have.css",
      "stroke",
      `rgba(${data.iconColor[0]}, ${data.iconColor[1]}, ${data.iconColor[2]}, ${
        data.iconColor[3] / 100
      })`
    );
};
