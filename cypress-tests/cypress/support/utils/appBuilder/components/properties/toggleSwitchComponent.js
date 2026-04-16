import { verifyTooltip } from "Support/utils/common";
import { selectDropdownOption, setColorPickerValue } from "./common";
import { commonSelectors } from "Selectors/common";

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

export const verifyToggleSwitchLabel = (componentSelector, inputSelector, labelCases, tag="label") => {
    labelCases.forEach(({ input }) => {
        cy.get(inputSelector).click().clear().type(input);
        cy.get(componentSelector)
            .find(tag)
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
            target: "label, span",
            cssProperty: "color",
            filterTextNodes: true,
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
        toggleswitch: {
             target: 'input[type="checkbox"]',
                cssProperty: "background-color",
            checked: true,
        }
    };

    const config = configMap[type];

    colorOptions.forEach(({ hex, expectedColor }) => {
        setColorPickerValue(colorPickerSelector, hex);

        if (typeof config.checked === "boolean") {
            ensureToggleState(componentSelector, config.checked);
        }

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

export const verifyToggleDefaultValue = (
    componentSelector,
    controlSelector,
    styleOptions
) => {
    const derivedDefaults = {
        on: {
            expectedChecked: true,
        },
        off: {
            expectedChecked: false,
        },
    };

    styleOptions.forEach((option) => {
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

        getToggleInput(componentSelector).should(
            expectedChecked ? "be.checked" : "not.be.checked"
        );
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

export const verifyToggleSwitchClick = (componentSelector, toastMessage) => {
    getToggleInput(componentSelector)
        .should("not.be.checked")
        .click({ force: true })
        .should("be.checked");
    cy.verifyToastMessage(
    commonSelectors.toastMessage,
   toastMessage
  );

    getToggleInput(componentSelector)
        .click({ force: true })
        .should("not.be.checked");
};
