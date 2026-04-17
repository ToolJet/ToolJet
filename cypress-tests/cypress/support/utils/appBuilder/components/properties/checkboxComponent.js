import { verifyTooltip } from "Support/utils/common";
import { selectDropdownOption, setColorPickerValue } from "./common";

const getCheckboxInput = (componentSelector) =>
    cy.get(componentSelector).find('input[type="checkbox"]').first();

const ensureCheckboxState = (componentSelector, checked) => {
    getCheckboxInput(componentSelector).then(($input) => {
        if ($input.prop("checked") !== checked) {
            cy.wrap($input).click({ force: true });
        }
    });

    getCheckboxInput(componentSelector).should(checked ? "be.checked" : "not.be.checked");
};

export const verifyCheckboxLabel = (
    componentSelector,
    inputSelector,
    labelCases,
    targetSelector = ".form-check-label, label, span"
) => {
    labelCases.forEach(({ input }) => {
        cy.get(inputSelector).click().clear().type(input);
        cy.get(componentSelector)
            .find(targetSelector)
            .filter((_, el) => Cypress.$(el).text().trim().length > 0)
            .first()
            .should("contain.text", input);
    });
};

export const verifyCheckboxTooltip = (componentSelector, inputSelector, tooltipCases) => {
    tooltipCases.forEach(({ input, expected = input }) => {
        cy.get(inputSelector).click().clear().type(input);
        verifyTooltip(componentSelector, expected);
        cy.hideTooltip();
    });
};

export const verifyCheckboxColor = (
    type,
    componentSelector,
    colorPickerSelector,
    colorOptions
) => {
    const configMap = {
        text: {
            target: ".form-check-label, label, span",
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
            .should("have.css", config.cssProperty, expectedColor);
    });
};

export const verifyCheckboxDefaultValue = (
    componentSelector,
    controlSelector,
    stateCases
) => {
    const derivedDefaults = {
        on: {
            expectedChecked: true,
        },
        off: {
            expectedChecked: false,
        },
    };

    stateCases.forEach((option) => {
        const {
            label,
            expectedChecked,
        } = {
            ...derivedDefaults[option.label],
            ...option,
        };

        cy.get(controlSelector).then(($control) => {
            const $checkbox =
                $control.is('input[type="checkbox"]')
                    ? $control
                    : $control.find('input[type="checkbox"]').first();

            if ($checkbox.length) {
                if ($checkbox.prop("checked") !== expectedChecked) {
                    cy.wrap($checkbox).click({ force: true });
                }
            } else {
                selectDropdownOption(controlSelector, label);
            }
        });

        getCheckboxInput(componentSelector).should(
            expectedChecked ? "be.checked" : "not.be.checked"
        );
    });
};

export const verifyCheckboxClick = (componentSelector, toastMessage) => {
    ensureCheckboxState(componentSelector, false);
    getCheckboxInput(componentSelector).click({ force: true }).should("be.checked");

    if (toastMessage) {
        cy.contains(toastMessage).should("be.visible");
    }

    getCheckboxInput(componentSelector).click({ force: true }).should("not.be.checked");
};

export const verifyCheckboxCsaToggle = (componentSelector, csaToggleSelector) => {
    ensureCheckboxState(componentSelector, false);

    cy.get(csaToggleSelector).find('input[type="checkbox"]').click({ force: true });
    getCheckboxInput(componentSelector).should("be.checked");

    cy.get(csaToggleSelector).find('input[type="checkbox"]').click({ force: true });
    getCheckboxInput(componentSelector).should("not.be.checked");
};

export const verifyCheckboxSetValue = (componentSelector, csaSetValueToggle) => {
    cy.get(csaSetValueToggle).click();
    getCheckboxInput(componentSelector).should("be.checked");

    cy.get(csaSetValueToggle).click();
    getCheckboxInput(componentSelector).should("be.checked");
};

export const verifyCheckboxMandatoryTextAndMark = (
    componentSelector,
    mandatoryTextSelector,
    mandatoryToggleSelector,
    textCases,
    invalidFeedbackSelector,
    requiredIndicatorSelector = 'span') => {

    getCheckboxInput(componentSelector).click({ force: true }).should("be.checked");
    getCheckboxInput(componentSelector).click({ force: true }).should("not.be.checked");

    cy.clearAndType(mandatoryTextSelector, "");

    cy.get(mandatoryToggleSelector).click({ force: true });

    cy.get(componentSelector)
        .find(requiredIndicatorSelector)
        .filter((_, el) => Cypress.$(el).text().trim() === "*")
        .first()
        .should("be.visible");

    cy.get(invalidFeedbackSelector).should("contain.text", "Field cannot be empty");

    textCases.forEach(({ input }) => {
        cy.clearAndType(mandatoryTextSelector, input || "");

        cy.get(componentSelector)
            .find(requiredIndicatorSelector)
            .filter((_, el) => Cypress.$(el).text().trim() === "*")
            .first()
            .should("be.visible");

        cy.get(invalidFeedbackSelector).should(
            "contain.text",
            input || "Field cannot be empty"
        );
    });

    getCheckboxInput(componentSelector).click({ force: true }).should("be.checked");

    cy.get(componentSelector).should(($component) => {
        const asteriskSpans = Cypress.$($component)
            .find(requiredIndicatorSelector)
            .filter((_, el) => Cypress.$(el).text().trim() === "*");
        expect(asteriskSpans.length).to.equal(0);
    });
    cy.get(mandatoryToggleSelector).click({ force: true });
     getCheckboxInput(componentSelector).click({ force: true }).should("not.be.checked");
};
