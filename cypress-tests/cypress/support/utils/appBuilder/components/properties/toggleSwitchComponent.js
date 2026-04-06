import { verifyTooltip } from "Support/utils/common";
import { selectDropdownOption, setColorPickerValue } from "./common";

const getToggleInput = (componentSelector) =>
    cy.get(componentSelector).find('input[type="checkbox"]');

const ensureToggleState = (componentSelector, checked) => {
    getToggleInput(componentSelector).then(($input) => {
        if ($input.prop("checked") !== checked) {
            cy.wrap($input).click({ force: true });
        }
    });

    getToggleInput(componentSelector).should(checked ? "be.checked" : "not.be.checked");
};

export const verifyToggleSwitchLabel = (componentSelector, inputSelector, labelCases) => {
    labelCases.forEach(({ input }) => {
        cy.get(inputSelector).click().clear().type(input);
        cy.get(componentSelector)
            .find("label")
            .should("contain.text", input);
    });
};

export const verifyToggleSwitchTooltip = (componentSelector, inputSelector, tooltipCases) => {
    tooltipCases.forEach(({ input, expected = input }) => {
        cy.get(inputSelector).click().clear().type(input);
        verifyTooltip(componentSelector, expected);
        cy.hideTooltip();
    });
};

export const verifyToggleSwitchColor = (
    type,
    componentSelector,
    colorPickerSelector,
    colorOptions
) => {
    const configMap = {
        text: {
            target: "label",
            cssProperty: "color",
        },
        border: {
            target: 'input[type="checkbox"] + span',
            cssProperty: "outline-color",
        },
        checked: {
            target: 'input[type="checkbox"] + span',
            cssProperty: "background-color",
            checked: true,
        },
        unchecked: {
            target: 'input[type="checkbox"] + span',
            cssProperty: "background-color",
            checked: false,
        },
        handle: {
            target: 'input[type="checkbox"] + span > span',
            cssProperty: "background-color",
        },
    };

    const config = configMap[type];

    colorOptions.forEach(({ hex, expectedColor }) => {
        setColorPickerValue(colorPickerSelector, hex);

        if (typeof config.checked === "boolean") {
            ensureToggleState(componentSelector, config.checked);
        }

        cy.get(componentSelector)
            .find(config.target)
            .should("have.css", config.cssProperty, expectedColor);
    });
};

export const verifyToggleSwitchAlignment = (
    componentSelector,
    dropdownSelector,
    alignmentOptions
) => {
    alignmentOptions.forEach(({ label, expectedClass }) => {
        selectDropdownOption(dropdownSelector, label);
        cy.get(componentSelector)
            .find('[data-cy="toggleswitch"]')
            .should("have.class", expectedClass);
    });
};

export const verifyToggleSwitchClick = (componentSelector) => {
    getToggleInput(componentSelector)
        .should("not.be.checked")
        .click({ force: true })
        .should("be.checked");

    getToggleInput(componentSelector)
        .click({ force: true })
        .should("not.be.checked");
};
