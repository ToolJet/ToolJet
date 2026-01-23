import { dsCommonSelector, cyParamName } from "Selectors/marketplace/common";

export const verifyConnectionFormHeader = (data) => {
    cy.waitForElement('[data-cy="data-source-name-input-field"]')
        .should('have.value', data.dataSourceName);
    data.environments.forEach((environment) => {
        cy.get(`[data-cy="${cyParamName(environment)}-label"]`)
            .verifyVisibleElement('have.text', environment);
    });
}

export const verifyConnectionFormFooter = (data) => {
    cy.waitForElement(`[data-cy="white-list-ip-text"]`)
        .should('have.text', 'Please white-list our IP address if the data source is not publicly accessible');
    cy.get(`[data-cy="button-copy-ip"]`).verifyVisibleElement('have.text', 'Copy');
    cy.get(`[data-cy="link-read-documentation"]`)
        .verifyVisibleElement('have.text', 'Read documentation')
        .and('have.attr', 'href', data.documentationLink);
    cy.get(`[data-cy="test-connection-button"]`).verifyVisibleElement('have.text', 'Test connection');
    cy.get(`[data-cy="db-connection-save-button"]`).verifyVisibleElement('have.text', 'Save');
}

const validateLabel = (fieldName) => {
    cy.get(dsCommonSelector.labelFieldName(fieldName)).should('be.visible');
};

const validateRequiredIndicator = (isRequired) => {
    if (isRequired) {
        cy.get('[data-cy="required-indicator"]').should('be.visible');
    }
};

const validatePlaceholder = (selector, placeholder) => {
    if (placeholder !== undefined) {
        cy.get(selector).should('have.attr', 'placeholder', placeholder);
    }
};

const validateValue = (selector, value) => {
    if (value !== undefined) {
        cy.get(selector).should('have.value', value);
    }
};

const validateDisabledState = (selector, disabled) => {
    if (disabled !== undefined) {
        cy.get(selector).should(disabled ? 'be.disabled' : 'not.be.disabled');
    }
};

const validateCheckedState = (selector, checked) => {
    if (checked !== undefined) {
        cy.get(selector).should(checked ? 'be.checked' : 'not.be.checked');
    }
};

export const verifyInputFieldUI = (field) => {
    const { fieldName, validations = {} } = field;

    cy.get(dsCommonSelector.subSection(fieldName)).within(() => {
        validateLabel(fieldName);
        validateRequiredIndicator(validations.isRequired);

        const textFieldSelector = dsCommonSelector.textField(fieldName);
        validatePlaceholder(textFieldSelector, validations.placeholder);
        validateValue(textFieldSelector, validations.value);
        validateValue(textFieldSelector, validations.defaultValue);
        validateDisabledState(textFieldSelector, validations.disabled);
    });
};

export const verifyEncryptedFieldUI = (field) => {
    const { fieldName, validations = {} } = field;

    cy.get(dsCommonSelector.subSection(fieldName)).within(() => {
        validateLabel(fieldName);
        validateRequiredIndicator(validations.isRequired);

        if (validations.hasEditButton) {
            cy.get('[data-cy="button-edit"]').should('be.visible').and('have.text', 'Edit');
        }
        if (validations.showEncrypted) {
            cy.get('[data-cy="encrypted-text"]').should('be.visible').and('contain.text', 'Encrypted');
        }
        if (validations.hasEyeIcon) {
            cy.get('[data-cy="icon-hidden"]').should('exist');
        }

        const textFieldSelector = dsCommonSelector.textField(fieldName);
        validatePlaceholder(textFieldSelector, validations.placeholder);
        validateValue(textFieldSelector, validations.value);
        validateValue(textFieldSelector, validations.defaultValue);
        validateDisabledState(textFieldSelector, validations.disabled);
    });
};

export const verifyDropdownFieldUI = (field) => {
    const { fieldName, validations = {} } = field;

    cy.get(dsCommonSelector.subSection(fieldName)).within(() => {
        cy.get(dsCommonSelector.dropdownLabel(fieldName)).should('be.visible');
        validateRequiredIndicator(validations.isRequired);

        const dropdownSelector = dsCommonSelector.dropdownField(fieldName);

        if (validations.placeholder !== undefined) {
            cy.get(dropdownSelector).should('contain.text', validations.placeholder);
        }
        if (validations.value !== undefined) {
            cy.get(dropdownSelector).should('contain.text', validations.value);
        }
        if (validations.defaultValue !== undefined) {
            cy.get(dropdownSelector).should('contain.text', validations.defaultValue);
        }
        if (validations.disabled !== undefined) {
            const assertion = validations.disabled ? 'have.class' : 'not.have.class';
            cy.get(dropdownSelector).should(assertion, 'disabled');
        }
    });
};

export const verifyToggleFieldUI = (field) => {
    const { fieldName, validations = {} } = field;

    cy.get(dsCommonSelector.subSection(fieldName)).within(() => {
        cy.get(`[data-cy="label-${cyParamName(fieldName)}"]`).should('be.visible');

        const toggleSelector = dsCommonSelector.toggleInput(fieldName);
        validateCheckedState(toggleSelector, validations.value);
        validateCheckedState(toggleSelector, validations.defaultValue);
        validateDisabledState(toggleSelector, validations.disabled);
    });
};

export const verifyRadioButtonFieldUI = (field) => {
    const { fieldName, validations = {} } = field;

    cy.get(dsCommonSelector.subSection(fieldName)).within(() => {
        cy.get(`[data-cy="label-${cyParamName(fieldName)}"]`).should('be.visible');

        const radioSelector = dsCommonSelector.radioButtonInput(fieldName);
        validateCheckedState(radioSelector, validations.value);
        validateCheckedState(radioSelector, validations.defaultValue);
        validateDisabledState(radioSelector, validations.disabled);
    });
};

export const verifyKeyValueFieldUI = (field) => {
    const { fieldName, validations = {} } = field;

    cy.get(dsCommonSelector.subSection(fieldName)).within(() => {
        cy.get(`[data-cy="label-${cyParamName(fieldName)}"]`).should('be.visible');

        if (validations.isEmpty) {
            cy.contains('There are no key value pairs added').should('be.visible');
        }

        if (validations.rowCount !== undefined) {
            cy.get('[data-cy*="key-input-field"]').should('have.length', validations.rowCount);
        }

        if (validations.hasAddButton) {
            cy.get(dsCommonSelector.addMoreButton(fieldName))
                .should('be.visible')
                .and('contain.text', 'Add');
        }

        if (validations.rows) {
            validations.rows.forEach((row, index) => {
                if (row.key !== undefined) {
                    cy.get(dsCommonSelector.keyInputField(fieldName, index))
                        .should('be.visible')
                        .and('have.value', row.key);
                }
                if (row.value !== undefined) {
                    cy.get(dsCommonSelector.valueInputField(fieldName, index))
                        .should('be.visible')
                        .and('have.value', row.value);
                }
                if (row.hasDeleteButton) {
                    cy.get(dsCommonSelector.deleteKeyValueButton(fieldName, index)).should('be.visible');
                }
                if (row.keyPlaceholder !== undefined) {
                    cy.get(dsCommonSelector.keyInputField(fieldName, index))
                        .should('have.attr', 'placeholder', row.keyPlaceholder);
                }
                if (row.valuePlaceholder !== undefined) {
                    cy.get(dsCommonSelector.valueInputField(fieldName, index))
                        .should('have.attr', 'placeholder', row.valuePlaceholder);
                }
            });
        }
    });
};
export const verifyCheckboxFieldUI = (field) => {
    const { fieldName, validations = {} } = field;

    cy.get(dsCommonSelector.subSection(fieldName)).within(() => {
        cy.get(dsCommonSelector.labelFieldName(fieldName)).should('be.visible');

        const checkboxSelector = dsCommonSelector.checkboxInput(fieldName);
        validateCheckedState(checkboxSelector, validations.value);
        validateCheckedState(checkboxSelector, validations.defaultValue);
        validateDisabledState(checkboxSelector, validations.disabled);
    });
};

export const verifyConnectionFormUI = (fields) => {
    fields.forEach((field) => {
        switch (field.type) {
            case 'input':
                verifyInputFieldUI(field);
                break;
            case 'encrypted':
            case 'password':
                verifyEncryptedFieldUI(field);
                break;
            case 'dropdown':
                verifyDropdownFieldUI(field);
                break;
            case 'toggle':
                verifyToggleFieldUI(field);
                break;
            case 'radio':
                verifyRadioButtonFieldUI(field);
                break;
            case 'keyValue':
                verifyKeyValueFieldUI(field);
                break;
            case 'checkbox':
                verifyCheckboxFieldUI(field);
                break;
            default:
                throw new Error(`Unsupported field type: ${field.type}`);
        }
    });
};

const examplePostgresUIConfig = {
    fields: [
        {
            type: "input",
            fieldName: "Host",
            validations: {
                isRequired: true,
                placeholder: "Enter host",
                defaultValue: "localhost",
                disabled: false
            }
        },
        {
            type: "toggle",
            fieldName: "SSL",
            validations: {
                defaultValue: true,
                disabled: false
            }
        },
        {
            type: "encrypted",
            fieldName: "Password",
            validations: {
                isRequired: true,
                placeholder: "**************",
                disabled: true,
                hasEditButton: true,
                showEncrypted: true,
                hasEyeIcon: true
            }
        },
        {
            type: "keyValue",
            selector: "Connection options",
            validations: {
                hasAddButton: true,
                rows: [
                    {
                        key: "",
                        value: "",
                        keyPlaceholder: "Key",
                        valuePlaceholder: "Value",
                        hasDeleteButton: true
                    }
                ]
            }
        }
    ]
};
