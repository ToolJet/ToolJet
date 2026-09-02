// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// dropdown.js
//   selectFromDropDown               -                    → canvas
//   clearSelection                   -                    → canvas
//   verifySelectedOptionOnDropdown   -                    → canvas
//   verifyOptionOnSidePanel          -                    → inspector
//   deleteOption                     -                    → inspector
//   addNewOption                     -                    → inspector
//   updateOptionLabelAndValue        -                    → inspector
//   verifyOptionOnDropdown           -                    → canvas
//   verifyOptionMenuElements         -                    → inspector
// └──────────────────────────────────────────────────────────────────┘
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { openAccordion, openEditorSidebar } from "Support/utils/commonWidget";
import { buttonText } from "Texts/button";
import { commonWidgetText } from "Texts/common";
import {
  addDefaultEventHandler,
  selectColourFromColourPicker,
  verifyAndModifyParameter,
  verifyBoxShadowCss,
  verifyLoaderColor,
  verifyPropertiesGeneralAccordion,
  verifyStylesGeneralAccordion,
  verifyTooltip,
  verifyWidgetColorCss,
} from "Support/utils/commonWidget";

/**
 * MODULE — appBuilder/components/dropdown: Dropdown / Select widget helpers.
 * FOR AI: two facets live here. (1) CANVAS interaction with a rendered dropdown —
 * open it and pick/clear/verify options (selectFromDropDown, clearSelection,
 * verifySelectedOptionOnDropdown, verifyOptionOnDropdown). (2) INSPECTOR option-list
 * management on the Properties side panel — add/delete/edit option rows and assert the
 * option menu labels (addNewOption, deleteOption, updateOptionLabelAndValue,
 * verifyOptionOnSidePanel, verifyOptionMenuElements). Selectors are `dropdown-input-<name>`
 * for the rendered control and `options-*` for the side-panel rows.
 * NOT here: generic property/style/event drivers → appBuilder/properties.js · styles.js ·
 * events.js.
 */
/**
 * @tjBlock  canvas
 * @tjUsage  selectFromDropDown('dropdown1', 'Option A')
 * @tjDom    rendered dropdown-input-<name> control → react-select option list
 */
export const selectFromDropDown = (dropdownName, option, index = 3) => {
  cy.get(`[data-cy="dropdown-input-${dropdownName.toLowerCase()}"]`).click(
    "center"
  );
  cy.wait(100);
  cy.contains(`[id*='react-select-${index}-option-']`, option).click();
};

/**
 * @tjBlock  canvas
 * @tjUsage  clearSelection('dropdown1')
 * @tjDom    rendered dropdown-input-<name> control → clear-indicator (2nd child)
 */
export const clearSelection = (dropdownName) => {
  cy.get(`[data-cy=dropdown-input-${dropdownName.toLowerCase()}]>>>>`)
    .eq(1)
    .click();
};

/**
 * @tjBlock  canvas
 * @tjUsage  verifySelectedOptionOnDropdown('dropdown1', 'Option A')
 * @tjDom    rendered dropdown-input-<name> control → selected value (1st child)
 */
export const verifySelectedOptionOnDropdown = (dropdownName, option) => {
  cy.get(`[data-cy=dropdown-input-${dropdownName.toLowerCase()}]>>>>`)
    .eq(0)
    .verifyVisibleElement("have.text", option);
};

/**
 * @tjBlock  inspector
 * @tjUsage  verifyOptionOnSidePanel('Option A')
 * @tjDom    Properties side panel options-label-<option> row
 */
export const verifyOptionOnSidePanel = (option) => {
  cy.get(
    `[data-cy="options-label-${option.toLowerCase()}"]`
  ).verifyVisibleElement("have.text", option);
};

/**
 * @tjBlock  inspector
 * @tjUsage  deleteOption('Option A')
 * @tjDom    Properties side panel options-label-<option> row → its delete-icon
 */
export const deleteOption = (option) => {
  cy.get(`[data-cy="options-label-${option.toLowerCase()}"]`).realHover();
  cy.get(
    `[data-cy="options-${option.toLowerCase()}-delete-icon"]>span`
  ).click();
  cy.notVisible(`[data-cy="options-label-${option.toLowerCase()}"]`);
};

/**
 * @tjBlock  inspector
 * @tjUsage  addNewOption()
 * @tjDom    Properties side panel add-new-dropdown-option button
 */
export const addNewOption = () => {
  cy.get('[data-cy="add-new-dropdown-option"]').click();
};

/**
 * @tjBlock  inspector
 * @tjUsage  updateOptionLabelAndValue('Option A', 'New label', 'newValue')
 * @tjDom    options-label-<option> row → option-label-input-field / option-value-input-field code editors
 */
export const updateOptionLabelAndValue = (option, label, value) => {
  cy.get(`[data-cy="options-label-${option.toLowerCase()}"]`).click();
  cy.get(`[data-cy="option-label-input-field"]`).clearAndTypeOnCodeMirror(
    label
  );
  cy.get(`[data-cy="option-value-input-field"]`).clearAndTypeOnCodeMirror(
    value
  );
};

/**
 * @tjBlock  canvas
 * @tjUsage  verifyOptionOnDropdown('dropdown1', ['Option A', 'Option B'])
 * @tjDom    rendered dropdown-input-<name> control → react-select-3-option-<i> list items
 */
export const verifyOptionOnDropdown = (dropdownName, options) => {
  cy.get(`[data-cy="dropdown-input-${dropdownName.toLowerCase()}"]`).click(
    "center"
  );
  options.forEach((option, i) => {
    cy.get(`#react-select-3-option-${i} > .d-flex`).verifyVisibleElement(
      "have.text",
      option
    );
  });
};

/**
 * @tjBlock  inspector
 * @tjUsage  verifyOptionMenuElements('Option A', [])
 * @tjDom    options-label-<option> row → expanded option menu labels (Option label/value, default, visibility, disable)
 */
export const verifyOptionMenuElements = (option, options) => {
  cy.get(`[data-cy="options-label-${option.toLowerCase()}"]`).click();

  cy.get(`[data-cy="label-option-label"]`).verifyVisibleElement(
    "have.text",
    "Option label"
  );
  cy.get(`[data-cy="label-option-value"]`).verifyVisibleElement(
    "have.text",
    "Option value"
  );

  cy.get('[data-cy="label-mark-this-as-default-option"]').verifyVisibleElement(
    "have.text",
    "Mark this as default option"
  );
  cy.get('[data-cy="label-visibility"]')
    .eq(1)
    .verifyVisibleElement("have.text", "Visibility");
  cy.get('[data-cy="label-disable"]')
    .eq(1)
    .verifyVisibleElement("have.text", "Disable");
};
