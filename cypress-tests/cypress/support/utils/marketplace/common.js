import { dsCommonSelector } from "Selectors/marketplace/selectors/common";


const fillTextField = (fieldName) => {
  cy.clearAndType(dsCommonSelector.textField(fieldName));
};

const fillDropdown = (fieldName) => {
  cy.get(dsCommonSelector.dropdownField(fieldName))
    .click();
};

const togglebutton = (buttonName) => {
  cy.get(dsCommonSelector.toggleInput(buttonName)).then(($checkbox) => {
    const isChecked = $checkbox.is(":checked");
    if (isChecked !== shouldBeChecked) {
      cy.wrap($checkbox).click({ force: true });
    }
  });
};

const selectRadioButton = (buttonName) => {
  cy.get(dsCommonSelector.datasourceOption(buttonName))
    .click({ force: true });
};

const fillKeyValuePairs = (data) => {
  data.values.forEach((pair, index) => {
    if (index > 0) {
      cy.get(dsCommonSelector.addMoreButton(data)).click();
    }

    cy.clearAndType(dsCommonSelector.keyInputField(pair.key, index), pair.key);

    cy.clearAndType(dsCommonSelector.valueInputField(pair.value, index), pair.value);
  });
};

const fieldHandlers = {
  input: fillTextField,
  password: fillTextField,
  dropdown: fillDropdown,
  toggle: togglebutton,
  radio: selectRadioButton,
  keyValue: fillKeyValuePairs
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

