import { setColorPickerValue, selectDropdownOption } from "./common";
import { commonSelectors } from "Selectors/common";

const getRadioInputs = (componentSelector) =>
    cy.get(componentSelector).find('input[type="radio"]');


export const verifyRadioLabel = (componentSelector, inputSelector, labelCases, tag = "label") => {
    labelCases.forEach(({ input }) => {
        cy.clearAndType(inputSelector, input);
        cy.get(componentSelector)
            .find(tag)
            .should("contain.text", input);
    });
};

export const verifyRadioColor = (
    componentSelector,
    colorPickerSelector,
    targetSelector,
    colorCases,
    cssProperty = "color"
) => {
    colorCases.forEach(({ hex, expectedColor }) => {
        setColorPickerValue(colorPickerSelector, hex);

        cy.get(componentSelector).then(($component) => {
            const $matches = $component.find(targetSelector);
            const $textMatches = $matches.filter(
                (_, el) => Cypress.$(el).text().trim().length > 0
            );
            const $target = ($textMatches.length ? $textMatches : $matches).last();

            expect($target.length).to.be.greaterThan(0);
            cy.wrap($target).should("have.css", cssProperty, expectedColor);
        });
    });
};

export const verifyRadioSelection = (
    componentSelector,
    toastMessage
) => {
    getRadioInputs(componentSelector).should("have.length.at.least", 2);
    getRadioInputs(componentSelector).eq(1).click({ force: true }).should("be.checked");
    getRadioInputs(componentSelector).eq(0).should("not.be.checked");
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            toastMessage
        );

    getRadioInputs(componentSelector).eq(0).click({ force: true }).should("be.checked");
    getRadioInputs(componentSelector).eq(1).should("not.be.checked");
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            toastMessage
        );
};

export const verifyRadioMandatoryTextAndMark = (
    componentSelector,
    mandatoryTextSelector,
    mandatoryToggleSelector,
    textCases,
    requiredIndicatorSelector = '[data-cy$="-label"] p > span',
    errorTextSelector = ".radio-button + div"
) => {
    textCases.forEach(({ input }) => {
        cy.clearAndType(mandatoryTextSelector, input);
        cy.get(mandatoryToggleSelector).click();

        cy.get(componentSelector)
            .find(requiredIndicatorSelector)
            .should("be.visible")
            .and("have.text", "*");

        cy.get(componentSelector)
            .find(errorTextSelector)
            .should("have.class", "d-flex")
            .and("not.have.class", "d-none")
            .and("contain.text", input);

        cy.get(mandatoryToggleSelector).click();

        cy.get(componentSelector)
            .find(requiredIndicatorSelector)
            .should("not.exist");

        cy.get(componentSelector)
            .find(errorTextSelector)
            .should("have.class", "d-none")
            .and("not.contain.text", input);
    });
};

export const verifyRadioButtonAlignment = (
    componentSelector,
    dropdownSelector,
    alignmentOptions
) => {
    alignmentOptions.forEach(
        ({
            label,
            targetSelector,
            cssProperty = "flex-direction",
            expectedValue,
        }) => {
            selectDropdownOption(dropdownSelector, label);
            cy.get(componentSelector)
                .find(targetSelector)
                .first()
                .should("have.css", cssProperty, expectedValue);
        }
    );
};
