import { verifyTooltip } from "Support/utils/common";
import { selectDropdownOption, setColorPickerValue } from "./common";
import { commonSelectors } from "Selectors/common";

const getDropdownTrigger = (componentSelector) =>
  cy.get(componentSelector).find(".dropdownV2-widget").first();

const getSelectedValue = (componentSelector) =>
  cy.get(componentSelector).find('[class*="singleValue"]').first();

const getPlaceholder = (componentSelector) =>
  cy.get(componentSelector).find('[class*="placeholder"]').first();

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

const ensureOptionSelected = (componentSelector, optionLabel) => {
  getDropdownTrigger(componentSelector).click();
  cy.get(".dropdown-multiselect-widget-custom-menu-list-body")
    .contains(optionLabel)
    .click();
  getDropdownTrigger(componentSelector).should("contain.text", optionLabel);
};

const toggleOptionSelection = (componentSelector, optionLabel) => {
  getDropdownTrigger(componentSelector).click();
  cy.get(".dropdown-multiselect-widget-custom-menu-list-body")
    .contains(optionLabel)
    .click();
};

export const ensureDropdownCleared = (componentSelector) => {
  cy.get(componentSelector)
    .find(".clear-indicator")
    .click({ force: true });
  getPlaceholder(componentSelector).should("be.visible");
};

export const verifyDropdownLabel = (
  componentSelector,
  inputSelector,
  labelCases,
  tag = "label"
) => {
  labelCases.forEach(({ input }) => {
    cy.get(inputSelector).click().clear().type(input);
    cy.get(componentSelector).find(tag).should("contain.text", input);
  });
};

export const verifyDropdownTooltip = (
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

export const verifyDropdownColor = (
  type,
  componentSelector,
  colorPickerSelector,
  colorOptions
) => {
  const configMap = {
    text: {
      target: '[class*="singleValue"]',
      cssProperty: "color",
    },
    border: {
      target: '[class*="control"]',
      cssProperty: "border-color",
    },
    background: {
      target: '[class*="control"]',
      cssProperty: "background-color",
    },
    accent: {
      target: '[class*="control"]',
      cssProperty: "border-color",
      triggerFocus: true,
    },
    placeholderText: {
      target: '[class*="placeholder"]',
      cssProperty: "color",
    },
    errorText: {
      target: ".d-flex",
      cssProperty: "color",
      needsInvalidState: true,
    },
    labelColor: {
      target: "label",
      cssProperty: "color",
      filterTextNodes: true,
    },
  };

  const config = configMap[type];

  colorOptions.forEach(({ hex, expectedColor }) => {
    setColorPickerValue(colorPickerSelector, hex);

    if (config.filterTextNodes) {
      cy.get(componentSelector).then(($component) => {
        const $target = $component
          .find(config.target)
          .filter((_, el) => Cypress.$(el).text().trim().length > 0)
          .first();
        expect($target.length).to.be.greaterThan(0);
        cy.wrap($target).should("have.css", config.cssProperty, expectedColor);
      });
      return;
    }

    cy.get(componentSelector)
      .find(config.target)
      .first()
      .should("have.css", config.cssProperty, expectedColor);
  });
};

export const verifyDropdownSelection = (
  componentSelector,
  optionCases,
  toastMessage
) => {
  optionCases.forEach(({ label }) => {
    ensureOptionSelected(componentSelector, label);
    if (toastMessage) {
      cy.verifyToastMessage(commonSelectors.toastMessage, toastMessage);
    }
  });
};

export const verifyDropdownClearSelection = (
  componentSelector,
  clearToggle
) => {
  cy.get(clearToggle)
    .find('input[type="checkbox"]')
    .check({ force: true });

  ensureOptionSelected(componentSelector, "option2");

  cy.get(componentSelector)
    .find(".clear-indicator")
    .should("be.visible")
    .click({ force: true });

  getPlaceholder(componentSelector).should("be.visible");
};

const getInvalidFeedback = (componentSelector, invalidFeedbackSelector) => {
  if (invalidFeedbackSelector) {
    return cy.get(invalidFeedbackSelector);
  }

  return cy.get(`${componentSelector} > div:not(.dropdown-widget)`);
};

const assertInvalidFeedbackHidden = (
  componentSelector,
  invalidFeedbackSelector
) => {
  if (invalidFeedbackSelector) {
    cy.get("body").find(invalidFeedbackSelector).should("not.exist");
    return;
  }

  cy.get("body")
    .find(`${componentSelector} > div:not(.dropdown-widget)`)
    .should("not.exist");
};

export const verifyDropdownMandatoryTextAndMark = (
  componentSelector,
  mandatoryTextSelector,
  mandatoryToggleSelector,
  textCases,
  invalidFeedbackSelector,
  requiredIndicatorSelector = "span"
) => {
  cy.get(mandatoryToggleSelector).click({ force: true });

  cy.get(componentSelector)
    .find(requiredIndicatorSelector)
    .filter((_, el) => Cypress.$(el).text().trim() === "*")
    .first()
    .should("be.visible");
      ensureOptionSelected(componentSelector, "option2");

  textCases.forEach(({ input }) => {
    const expectedErrorText = input || "Field cannot be empty";

    cy.clearAndType(mandatoryTextSelector, input || "");

    cy.get(componentSelector)
      .find(requiredIndicatorSelector)
      .filter((_, el) => Cypress.$(el).text().trim() === "*")
      .first()
      .should("be.visible");

    getInvalidFeedback(componentSelector, invalidFeedbackSelector).should(
      "contain.text",
      expectedErrorText
    );
  });

  cy.get(componentSelector).should(($component) => {
    const asteriskSpans = Cypress.$($component)
      .find(requiredIndicatorSelector)
      .filter((_, el) => Cypress.$(el).text().trim() === "*");
    expect(asteriskSpans.length).to.equal(1);
  });

  cy.get(mandatoryToggleSelector).click({ force: true });

  cy.get(componentSelector).should(($component) => {
    const asteriskSpans = Cypress.$($component)
      .find(requiredIndicatorSelector)
      .filter((_, el) => Cypress.$(el).text().trim() === "*");
    expect(asteriskSpans.length).to.equal(0);
  });
};

export const verifyDropdownDefaultState = (
  componentSelector,
  controlSelector,
  stateCases
) => {
  stateCases.forEach(({ label, expectedHasValue }) => {
    selectDropdownOption(controlSelector, label);
    if (expectedHasValue) {
      getSelectedValue(componentSelector).should("be.visible");
    } else {
      getPlaceholder(componentSelector).should("be.visible");
    }
  });
};

export const verifyDropdownSearchOption = (
  componentSelector,
  searchToggle,
  optionLabel
) => {
  ensurePropertyToggleState(searchToggle, true);

  getDropdownTrigger(componentSelector).click();
  cy.get(".dropdown-multiselect-widget-search-box").should("be.visible");
  cy.get(".dropdown-multiselect-widget-search-box").type(optionLabel);
  cy.get(".dropdown-multiselect-widget-custom-menu-list-body")
    .find(`[role="option"] [title="${optionLabel}"]`)
    .first()
    .click({ force: true });

  getSelectedValue(componentSelector).should("contain.text", optionLabel);
};

export const verifyDropdownDynamicOptions = (
  componentSelector,
  dynamicToggle,
  expectedOptions
) => {
  ensurePropertyToggleState(dynamicToggle, true);

  getDropdownTrigger(componentSelector).click();
  expectedOptions.forEach((option) => {
    const normalizedOption =
      typeof option === "string"
        ? { label: option, visible: true, disable: false }
        : option;

    const { label, visible = true, disable = false } = normalizedOption;
    const optionSelector = `[role="option"] [title="${label}"]`;

    if (!visible) {
      cy.get(".dropdown-multiselect-widget-custom-menu-list-body")
        .find(optionSelector)
        .should("not.exist");
      return;
    }

    cy.get(".dropdown-multiselect-widget-custom-menu-list-body")
      .find(optionSelector)
      .should("be.visible")
      .parents('[role="option"]')
      .first()
      .should("have.attr", "aria-disabled", disable ? "true" : "false");
  });
  cy.get("body").click(0, 0);

  ensurePropertyToggleState(dynamicToggle, false);
};

export const verifyDropdownCsaClear = (componentSelector, csaClearToggle) => {
  ensureOptionSelected(componentSelector, "option2");

  cy.get(csaClearToggle).click();

  getPlaceholder(componentSelector).should("be.visible");
};

export const verifyDropdownAlignment = (
  componentSelector,
  alignmentSelector,
  alignmentCases
) => {
  alignmentCases.forEach(({ label, targetSelector, cssProperty, expectedValue }) => {
    selectDropdownOption(alignmentSelector, label);
    cy.get(componentSelector)
      .find(targetSelector)
      .first()
      .should("have.css", cssProperty, expectedValue);
  });
};

export const verifyDropdownPadding = (
  componentSelector,
  paddingSelector,
  paddingCases
) => {
  paddingCases.forEach(({ label, cssProperty, expectedValue }) => {
  selectDropdownOption(paddingSelector, label);
    cy.get(componentSelector)
      .find(".dropdownV2-widget")
      .first()
      .should("have.css", cssProperty, expectedValue);
  });
};
