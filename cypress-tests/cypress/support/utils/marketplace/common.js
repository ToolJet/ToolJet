import { dsCommonSelector } from "Selectors/marketplace/common";

export const fillDSConnectionTextField = (fieldName, text) => {
  cy.clearAndType(dsCommonSelector.textField(fieldName), text);
};

const fillDSConnectionDropdown = (fieldName, option) => {
  cy.waitForElement(dsCommonSelector.dropdownField(fieldName))
    .click();
  cy.contains("[id*=react-select-]", option).click();
};

const toggleDSConnectionButton = (buttonName) => {
  cy.get(dsCommonSelector.toggleInput(buttonName)).then(($checkbox) => {
    const isChecked = $checkbox.is(":checked");
    if (isChecked !== shouldBeChecked) {
      cy.wrap($checkbox).click({ force: true });
    }
  });
};

const selectDSConnectionRadioButton = (buttonName) => {
  cy.get(dsCommonSelector.datasourceOption(buttonName))
    .click({ force: true });
};

const fillDSConnectionKeyValuePairs = (data) => {
  data.values.forEach((pair, index) => {
    if (index > 0) {
      cy.get(dsCommonSelector.addMoreButton(data)).click();
    }

    cy.clearAndType(dsCommonSelector.keyInputField(pair.key, index), pair.key);

    cy.clearAndType(dsCommonSelector.valueInputField(pair.value, index), pair.value);
  });
};

const fieldHandlers = {
  input: fillDSConnectionTextField,
  password: fillDSConnectionTextField,
  dropdown: fillDSConnectionDropdown,
  toggle: toggleDSConnectionButton,
  radio: selectDSConnectionRadioButton,
  keyValue: fillDSConnectionKeyValuePairs
};

export function fillToolJetConnectionForm(config) {
  config.fields.forEach((field) => {
    const handler = fieldHandlers[field.type];

    if (!handler) {
      throw new Error(`Unsupported field type: ${field.type}`);
    }

    handler(field);
  });
}

