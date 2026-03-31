import { verifyTooltip } from "Support/utils/common";
import { setColorPickerValue, setNumberInputValue, selectDropdownOption } from "./common";

export const verifyButtonText = (componentSelector, inputSelector, textCases) => {
    textCases.forEach(({ input }) => {
        cy.get(inputSelector).click().clear().type(input);
        cy.get(componentSelector)
            .find("button")
            .should("contain.text", input);
    });
};

export const verifyButtonTooltip = (componentSelector, inputSelector, tooltipCases) => {
    tooltipCases.forEach(({ input, expected = input }) => {
        cy.get(inputSelector).click().clear().type(input);
        verifyTooltip(componentSelector, expected);
        cy.hideTooltip();
    });
};

export const verifyButtonColor = (
    type,
    componentSelector,
    colorPickerSelector,
    colorOptions
) => {
    const configMap = {
        background: {
            target: "button",
            cssProperty: "background-color",
            expectedKey: "expectedBg",
        },
        text: {
            target: "button",
            cssProperty: "color",
            expectedKey: "expectedColor",
        },
        border: {
            target: "button",
            cssProperty: "border-color",
            expectedKey: "expectedBg",
        },
        loader: {
            target: ".tj-widget-loader svg",
            cssProperty: "color",
            expectedKey: "expectedColor",
        },
        icon: {
            target: "button svg",
            cssProperty: "color",
            expectedKey: "expectedColor",
        },
    };

    const config = configMap[type];

    colorOptions.forEach((option) => {
        const { hex } = option;
        const expectedValue =
            option[config.expectedKey] ??
            option.expectedColor ??
            option.expectedBg ??
            option.expected ??
            null;

        setColorPickerValue(colorPickerSelector, hex);

        cy.get(componentSelector)
            .find(config.target)
            .should("have.css", config.cssProperty, expectedValue);
    });
};

export const verifyButtonBoxShadow = (componentSelector, colorPickerSelector, colorOptions) => {
    colorOptions.forEach(({ hex, expectedColor }) => {
        setColorPickerValue(colorPickerSelector, hex);
        cy.get(componentSelector)
            .find("button")
            .should("have.css", "box-shadow")
            .and("include", expectedColor);
    });
};

export const verifyButtonBorderRadius = (componentSelector, inputSelector, cases) => {
    cases.forEach(({ input, expected }) => {
        setNumberInputValue(inputSelector, input);
        cy.get(componentSelector)
            .find("button")
            .should("have.css", "border-radius", expected);
    });
};

export const verifyButtonIconPosition = (
    componentSelector,
    dropdownSelector,
    positionOptions
) => {
    positionOptions.forEach(({ label, expectedPosition }) => {
        cy.get(dropdownSelector).click();
        cy.get('.dropdown-multiselect-widget-search-box')
            .type(label);
        cy.get('.dropdown-multiselect-widget-custom-menu-list-body')
            .contains(label)
            .click();

        cy.get(componentSelector)
            .find("button")
            .then(($btn) => {

                const icon = $btn.find("svg")[0];
                const text = $btn.find("span")[0] || $btn[0];

                const iconRect = icon.getBoundingClientRect();
                const textRect = text.getBoundingClientRect();

                if (expectedPosition === "left") {
                    expect(iconRect.left).to.be.lessThan(textRect.left);
                } else {
                    expect(iconRect.left).to.be.greaterThan(textRect.left);
                }
            });
    });
};

export const verifyButtonPadding = (
    componentSelector,
    dropdownSelector,
    paddingOptions
) => {
    paddingOptions.forEach(({ label, expectedPadding }) => {
        selectDropdownOption(dropdownSelector, label);

        cy.get(componentSelector)
            .should("have.css", "padding", expectedPadding);
    });
};

export const verifyButtonClickEvent = (componentSelector, toastText) => {
    cy.get(componentSelector).find("button").click();
    cy.get(".go3958317564").should("have.text", toastText);
};
