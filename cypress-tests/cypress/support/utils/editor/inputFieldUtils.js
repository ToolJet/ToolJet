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
  selectColourFromColourPicker("Background", data.bgColor);
  selectColourFromColourPicker("Border", data.borderColor);
  selectColourFromColourPicker("Text", data.textColor);
  selectColourFromColourPicker("Error text", data.errorTextColor);
  selectColourFromColourPicker("", data.iconColor);
  cy.forceClickOnCanvas();
  openEditorSidebar(data.widgetName);
  cy.get('[data-cy="make-this-field-mandatory-toggle-button"]').click();
  cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
};

export const verifyInputFieldColors = (selectorInput, data) => {
  verifyWidgetColorCss(selectorInput, "color", data.textColor);
  verifyWidgetColorCss(selectorInput, "border-color", data.borderColor);
  verifyWidgetColorCss(selectorInput, "background-color", data.bgColor);
  cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).clear();
  cy.forceClickOnCanvas();
  cy.verifyCssProperty(
    `[data-cy="${data.widgetName}-invalid-feedback"]`,
    "color",
    `rgba(${data.errorTextColor[0]}, ${data.errorTextColor[1]}, ${
      data.errorTextColor[2]
    }, ${data.errorTextColor[3] / 100})`
  );

  cy.get(commonWidgetSelector.draggableWidget(data.widgetName))
    .siblings("svg")
    .should(
      "have.css",
      "stroke",
      `rgba(${data.iconColor[0]}, ${data.iconColor[1]}, ${data.iconColor[2]}, ${
        data.iconColor[3] / 100
      })`
    );
};

export const verifyLabelStyleElements = () => {
  cy.get('[data-cy="widget-accordion-label"]').verifyVisibleElement(
    "have.text",
    "label"
  );
  cy.get('[data-cy="label-alignment"]').verifyVisibleElement(
    "have.text",
    "Alignment"
  );
  cy.get('[data-cy="label-width"]').verifyVisibleElement("have.text", "Width");
  cy.get('[data-cy="width-input-field"]')
    .eq(0)
    .should("have.value", "33")
    .siblings("label")
    .should("have.text", "% of the field");
  cy.get('[data-cy="auto-width-label"]').verifyVisibleElement(
    "have.text",
    "Auto width"
  );
};

export const verifyAlignment = (componentName, position, side) => {
  const alignments = {
    topLeft: { y: "flex-column", x: "flex-start" },
    topRight: { y: "flex-column", x: "flex-end" },
    sideLeft: { y: "align-items-center", x: "flex-start" },
    sideRight: { y: "align-items-center", x: "flex-end" },
  };

  const { y, x } = alignments[position];

  cy.get(`[data-cy="label-${componentName.toLowerCase()}"]`)
    .should("have.class", y)
    .children("label")
    .should("have.css", "justify-content", x);
};

export const verifyCustomWidthOfLabel = (componentName, width) => {
  cy.get(`[data-cy="label-${componentName.toLowerCase()}"]`)
    .children("label")
    .should("have.attr", "style")
    .and("include", `width: ${width}%`);
  //
  // .should("have.css", "width", `${width}%`);
};

export const addCustomWidthOfLabel = (width) => {
  cy.get('[data-cy="auto-width-checkbox"]').click();
  cy.get('[data-cy="width-input-field"]')
    .eq(0)
    .type(`{selectAll}{backspace}${width}`, { force: true });
};
