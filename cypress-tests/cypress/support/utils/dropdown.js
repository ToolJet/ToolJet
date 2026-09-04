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
export const selectFromDropDown = (dropdownName, option, index = 3) => {
  cy.get(`[data-cy="dropdown-input-${dropdownName.toLowerCase()}"]`).click(
    "center"
  );
  cy.wait(100);
  cy.contains(`[id*='react-select-${index}-option-']`, option).click();
};

export const clearSelection = (dropdownName) => {
  cy.get(`[data-cy=dropdown-input-${dropdownName.toLowerCase()}]>>>>`)
    .eq(1)
    .click();
};

export const verifySelectedOptionOnDropdown = (dropdownName, option) => {
  cy.get(`[data-cy=dropdown-input-${dropdownName.toLowerCase()}]>>>>`)
    .eq(0)
    .verifyVisibleElement("have.text", option);
};

export const verifyOptionOnSidePanel = (option) => {
  cy.get(
    `[data-cy="options-label-${option.toLowerCase()}"]`
  ).verifyVisibleElement("have.text", option);
};

export const deleteOption = (option) => {
  cy.get(`[data-cy="options-label-${option.toLowerCase()}"]`).realHover();
  cy.get(
    `[data-cy="options-${option.toLowerCase()}-delete-icon"]>span`
  ).click();
  cy.notVisible(`[data-cy="options-label-${option.toLowerCase()}"]`);
};

export const addNewOption = () => {
  cy.get('[data-cy="add-new-dropdown-option"]').click();
};

export const updateOptionLabelAndValue = (option, label, value) => {
  cy.get(`[data-cy="options-label-${option.toLowerCase()}"]`).click();
  cy.get(`[data-cy="option-label-input-field"]`).clearAndTypeOnCodeMirror(
    label
  );
  cy.get(`[data-cy="option-value-input-field"]`).clearAndTypeOnCodeMirror(
    value
  );
};

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
