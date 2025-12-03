import { dsCommonSelector } from "Selectors/marketplace/common";

export const fillDSConnectionTextField = (fieldName, text) => {
  cy.clearAndType(dsCommonSelector.textField(fieldName), text);
};

export const fillDSConnectionDropdown = (fieldName, option) => {
  cy.waitForElement(dsCommonSelector.dropdownField(fieldName))
    .click();
  cy.contains("[id*=react-select-]", option).click();
};

export const toggleDSConnectionButton = (buttonName, shouldBeChecked = true) => {
  cy.get(dsCommonSelector.toggleInput(buttonName)).then(($checkbox) => {
    const isChecked = $checkbox.is(":checked");
    if (isChecked !== shouldBeChecked) {
      cy.wrap($checkbox).click({ force: true });
    }
  });
};

export const selectDSConnectionRadioButton = (buttonName, shouldBeSelected = true) => {
  cy.get(dsCommonSelector.radioButtonInput(buttonName)).then(($radio) => {
    const isSelected = $radio.is(":checked");
    if (isSelected !== shouldBeSelected) {
      cy.wrap($radio).click({ force: true });
    }
  });
};

export const fillDSConnectionKeyValuePairs = (selector, keyValueData) => {
  keyValueData.forEach((pair, index) => {
    if (index === 0) {
      cy.get('body').then(($body) => {
        const noKeyValueText = $body.find(':contains("There are no key value pairs added")').length > 0;
        const keyFieldExists = $body.find(dsCommonSelector.keyInputField(selector, index)).length > 0;

        if (noKeyValueText || !keyFieldExists) {
          cy.get(dsCommonSelector.addMoreButton(selector)).should("be.visible").click();
          cy.wait(500);
        }
      });
    }

    if (index > 0) {
      cy.get('body').then(($body) => {
        const keyFieldExists = $body.find(dsCommonSelector.keyInputField(selector, index)).length > 0;
        if (!keyFieldExists) {
          cy.get(dsCommonSelector.addMoreButton(selector)).should("be.visible").click();
          cy.wait(500);
        }
      });
    }

    cy.get(dsCommonSelector.keyInputField(selector, index)).should("be.visible");
    cy.get(dsCommonSelector.valueInputField(selector, index)).should("be.visible");

    cy.clearAndType(dsCommonSelector.keyInputField(selector, index), pair.key);
    cy.clearAndType(dsCommonSelector.valueInputField(selector, index), pair.value);
  });
};

export const renameDSName = (newName) => {
  cy.waitForElement(dsCommonSelector.dataSourceNameInputField("data-source-name"))
    .scrollIntoView()
    .should("be.visible");

  cy.clearAndType(dsCommonSelector.dataSourceNameInputField("data-source-name"), newName);

  cy.get(dsCommonSelector.dataSourceNameButton("db-connection-save"))
    .scrollIntoView()
    .should("be.visible")
    .click();

  cy.waitForElement(dsCommonSelector.dataSourceNameButton(newName))
    .should("be.visible");
};

export const saveAndDiscardDSChanges = (button) => {
  cy.get('[data-cy="unsaved-changes-title"]')
    .should("be.visible");
  cy.get('[data-cy="modal-message"]').verifyVisibleElement("have.text", "Datasource has unsaved changes. Are you sure you want to discard them?");
  cy.get(dsCommonSelector.dataSourceNameButton(button)).click();
};

export const verifyDSConnection = () => {
  cy.get(dsCommonSelector.dataSourceNameButton("test-connection"))
    .verifyVisibleElement(
      "have.text",
      "Test connection"
    )
    .click();
  cy.get(dsCommonSelector.text("test-connection-verified")).verifyVisibleElement(
    "have.text",
    "connection verified"
  )
};

export const fillDSConnectionPasswordField = (fieldName, text) => {
  cy.get('body').then(($body) => {
    const editButtonExists = $body.find('[data-cy="button-edit"]').length > 0;
    const passwordFieldDisabled = $body.find(dsCommonSelector.textField(fieldName)).is(':disabled');

    if (editButtonExists || passwordFieldDisabled) {
      cy.get('[data-cy="button-edit"]').should("be.visible").click();
      cy.wait(500);
    }
  });

  cy.waitForElement(dsCommonSelector.textField(fieldName))
    .should("be.visible")
    .should("not.be.disabled");

  cy.clearAndType(dsCommonSelector.textField(fieldName), text);
};

const fieldHandlers = {
  input: fillDSConnectionTextField,
  password: fillDSConnectionPasswordField,
  dropdown: fillDSConnectionDropdown,
  toggle: toggleDSConnectionButton,
  radio: selectDSConnectionRadioButton,
  keyValue: fillDSConnectionKeyValuePairs
};

export function fillDSConnectionForm (config) {
  config.fields.forEach((field) => {
    const handler = fieldHandlers[field.type];

    if (!handler) {
      throw new Error(`Unsupported field type: ${field.type}`);
    }

    switch (field.type) {
      case 'input':
        handler(field.fieldName, field.text);
        break;
      case 'password':
        handler(field.fieldName, field.text);
        break;
      case 'dropdown':
        handler(field.fieldName, field.option);
        break;
      case 'toggle':
        handler(field.buttonName, field.shouldBeChecked);
        break;
      case 'radio':
        handler(field.buttonName, field.shouldBeSelected);
        break;
      case 'keyValue':
        handler(field.selector, field.keyValueData);
        break;
      default:
        handler(field);
    }
  });
}

