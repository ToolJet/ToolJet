import { verifyTooltip } from "Support/utils/common";
import { commonSelectors } from "Selectors/common";
import {
  selectDropdownOption,
  setColorPickerValue,
  setNumberInputValue,
} from "./common";

const getLegacyDropdownTrigger = (componentSelector) =>
  cy.get(componentSelector).find('[class*="-control"]').first();

const getLegacySelectedValue = (componentSelector) =>
  cy.get(componentSelector).find('[class*="-singleValue"]').first();

const getLegacyLabel = (componentSelector) =>
  cy.get(componentSelector).find("label").first();

const getLegacyValueContainer = (componentSelector) =>
  getLegacyDropdownTrigger(componentSelector).find("> div").first();

const getLegacyLoadingIndicator = (componentSelector) =>
  cy.get(componentSelector).find('[class*="loadingIndicator"]').first();

const ensurePropertyToggleState = (toggleSelector, checked) => {
  cy.get(toggleSelector).then(($toggle) => {
    const $checkbox = $toggle.is('input[type="checkbox"]')
      ? $toggle
      : $toggle.find('input[type="checkbox"]').first();

    expect($checkbox.length).to.be.greaterThan(0);

    if ($checkbox.prop("checked") !== checked) {
      cy.wrap($checkbox).click({ force: true });
    }
  });
};

export const selectLegacyDropdownOption = (componentSelector, optionLabel) => {
  getLegacyDropdownTrigger(componentSelector).click({ force: true });
  cy.contains('[id*="-option-"]', optionLabel).click({ force: true });
};

export const verifyLegacyDropdownLabel = (
  componentSelector,
  inputSelector,
  labelCases
) => {
  labelCases.forEach(({ input }) => {
    cy.get(inputSelector).click().clear().type(input);
    getLegacyLabel(componentSelector).should("contain.text", input);
  });
};

export const verifyLegacyDropdownTooltip = (
  componentSelector,
  inputSelector,
  tooltipCases
) => {
  tooltipCases.forEach(({ input, expected = input }) => {
    cy.get(inputSelector).click().clear().type(input);
    verifyTooltip(componentSelector, expected);
    cy.hideTooltip();
  });
};

export const verifyLegacyDropdownInvalidFeedback = (
  componentSelector,
  mandatoryTextSelector,
  feedbackCases
) => {
  feedbackCases.forEach(({ input, triggerOption = "one" }) => {
    cy.get(mandatoryTextSelector).click().clear().type(input);
    selectLegacyDropdownOption(componentSelector, triggerOption);
    cy.get(componentSelector)
      .find(".invalid-feedback")
      .should("have.class", "d-flex")
      .and("contain.text", input);
  });
};

export const verifyLegacyDropdownTextColor = (
  componentSelector,
  colorPickerSelector,
  colorOptions
) => {
  colorOptions.forEach(({ hex, expectedColor }) => {
    setColorPickerValue(colorPickerSelector, hex);
    getLegacySelectedValue(componentSelector).should(
      "have.css",
      "color",
      expectedColor
    );
  });
};

export const verifyLegacyDropdownBorderRadius = (
  componentSelector,
  inputSelector,
  borderRadiusCases
) => {
  borderRadiusCases.forEach(({ input, expectedValue }) => {
    setNumberInputValue(inputSelector, input);
    getLegacyDropdownTrigger(componentSelector).should(
      "have.css",
      "border-radius",
      expectedValue
    );
  });
};

export const verifyLegacyDropdownAlignment = (
  componentSelector,
  dropdownSelector,
  alignmentCases
) => {
  alignmentCases.forEach(({ label, expectedValue }) => {
    selectDropdownOption(dropdownSelector, label);
    getLegacyValueContainer(componentSelector).should(
      "have.css",
      "justify-content",
      expectedValue
    );
  });
};

export const verifyLegacyDropdownDisabled = (
  componentSelector,
  toggleSelector
) => {
  ensurePropertyToggleState(toggleSelector, true);
  cy.get(componentSelector)
    .find('[aria-disabled="true"]')
    .should("exist");

  ensurePropertyToggleState(toggleSelector, false);
  cy.get(componentSelector)
    .find('[aria-disabled="true"]')
    .should("not.exist");
};

export const verifyLegacyDropdownLoading = (
  componentSelector,
  toggleSelector
) => {
  ensurePropertyToggleState(toggleSelector, true);
  getLegacyLoadingIndicator(componentSelector).should("be.visible");

  ensurePropertyToggleState(toggleSelector, false);
  cy.get(componentSelector)
    .find('[class*="loadingIndicator"]')
    .should("not.exist");
};

export const verifyLegacyDropdownDefaultValue = (
  componentSelector,
  expectedLabel
) => {
  getLegacySelectedValue(componentSelector).should("contain.text", expectedLabel);
};

export const verifyLegacyDropdownAdvancedOptions = (
  componentSelector,
  toggleSelector,
  expectedOptions
) => {
  ensurePropertyToggleState(toggleSelector, true);

  getLegacyDropdownTrigger(componentSelector).click({ force: true });
  expectedOptions.forEach(({ label, visible = true, disable = false }) => {
    const option = cy.contains('[id*="-option-"]', label);

    if (!visible) {
      option.should("not.exist");
      return;
    }

    option
      .should("be.visible")
      .should("have.attr", "aria-disabled", disable ? "true" : "false");
  });
  cy.get("body").click(0, 0);

  ensurePropertyToggleState(toggleSelector, false);
};

export const verifyLegacyDropdownCsaSelection = (
  componentSelector,
  toggleSelector,
  expectedLabel
) => {
  ensurePropertyToggleState(toggleSelector, true);
  getLegacySelectedValue(componentSelector).should("contain.text", expectedLabel);
};

export const verifyLegacyDropdownSelection = (
  componentSelector,
  optionCases,
  toastMessage
) => {
  optionCases.forEach(({ label }) => {
    selectLegacyDropdownOption(componentSelector, label);
    getLegacySelectedValue(componentSelector).should("contain.text", label);

    if (toastMessage) {
      cy.verifyToastMessage(commonSelectors.toastMessage, toastMessage);
    }
  });
};
