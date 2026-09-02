// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// inputField.js
//   addValidations                   -                    → properties
//   addAndVerifyAdditionalActions    -                    → properties
//   addAllInputFieldColors           colorSwatches        → styles
//   verifyInputFieldColors           colorSwatches        → styles
//   verifyLabelStyleElements         -                    → styles
//   verifyAlignment                  -                    → styles
//   verifyCustomWidthOfLabel         -                    → styles
//   addCustomWidthOfLabel            -                    → styles
// └──────────────────────────────────────────────────────────────────┘
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

/**
 * MODULE — appBuilder/components/inputField: shared input-widget helpers
 * (text/number/email/password/etc).
 * FOR AI: configure & verify the parts common to input fields — validation rules
 * (addValidations), Additional Actions toggles + tooltip (addAndVerifyAdditionalActions),
 * the input colour swatches (addAllInputFieldColors / verifyInputFieldColors), and
 * the label style block (verifyLabelStyleElements, verifyAlignment,
 * verifyCustomWidthOfLabel, addCustomWidthOfLabel).
 * PRECONDITION: several helpers call openEditorSidebar(widgetName) themselves; the
 * colour/label helpers assume the Styles tab is already open.
 * NOT here: generic properties → appBuilder/properties.js · generic styles → appBuilder/styles.js.
 */

/**
 * @tjBlock  properties
 * @tjUsage  addValidations('input1', data)
 * @tjDom    Validation accordion → regex/min/max/custom params + mandatory toggle fx
 */
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

/**
 * @tjBlock  properties
 * @tjUsage  addAndVerifyAdditionalActions('input1', 'help text')
 * @tjDom    Additional Actions accordion → visibility/disable/loading toggle fx + tooltip
 */
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

/**
 * @tjType   colorSwatches
 * @tjBlock  styles
 * @tjUsage  addAllInputFieldColors(data)
 * @tjDom    Background/Border/Text/Error text/icon style swatches → colour picker
 */
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

/**
 * @tjType   colorSwatches
 * @tjBlock  styles
 * @tjUsage  verifyInputFieldColors('[data-cy="..."]', data)
 * @tjDom    asserts computed text/border/bg + invalid-feedback + icon stroke css
 */
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

/**
 * @tjBlock  styles
 * @tjUsage  verifyLabelStyleElements()
 * @tjDom    Label style accordion — asserts label/alignment/width/auto-width controls
 */
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

/**
 * @tjBlock  styles
 * @tjUsage  verifyAlignment('input1', 'topLeft', side)
 * @tjDom    asserts label-<name> layout class + label justify-content css
 */
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

/**
 * @tjBlock  styles
 * @tjUsage  verifyCustomWidthOfLabel('input1', 50)
 * @tjDom    asserts label style attr includes width: <width>%
 */
export const verifyCustomWidthOfLabel = (componentName, width) => {
  cy.get(`[data-cy="label-${componentName.toLowerCase()}"]`)
    .children("label")
    .should("have.attr", "style")
    .and("include", `width: ${width}%`);
};

/**
 * @tjBlock  styles
 * @tjUsage  addCustomWidthOfLabel(50)
 * @tjDom    toggles auto-width-checkbox, types width into width-input-field
 */
export const addCustomWidthOfLabel = (width) => {
  cy.get('[data-cy="auto-width-checkbox"]').click();
  cy.get('[data-cy="width-input-field"]')
    .eq(0)
    .type(`{selectAll}{backspace}${width}`, { force: true });
};
