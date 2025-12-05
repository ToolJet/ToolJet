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

export const fillDSConnectionKeyValuePairs = (section, keyValueData) => {
  cy.get(dsCommonSelector.subSection(section)).within(() => {
    keyValueData.forEach((pair, index) => {
      cy.root().then(($section) => {
        const keyFieldExists = $section.find(dsCommonSelector.keyInputField(section, index)).length > 0;
        if (!keyFieldExists) {
          cy.get(dsCommonSelector.addButton(section))
            .should('be.visible')
            .click();
          cy.wait(500);
        }
      });

      cy.get(dsCommonSelector.keyInputField(section, index))
        .should('be.visible')
        .clear()
        .type(pair.key);

      cy.get(dsCommonSelector.valueInputField(section, index))
        .should('be.visible')
        .clear()
        .type(pair.value);
    });
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

export const saveAndDiscardDSChanges = (option) => {
  cy.get('[data-cy="unsaved-changes-title"]')
    .should("be.visible");
  cy.get('[data-cy="modal-message"]').verifyVisibleElement("have.text", "Datasource has unsaved changes. Are you sure you want to discard them?");
  cy.get(dsCommonSelector.dataSourceNameButton(option)).click();
};

export const verifyDSConnection = (expectedStatus = "success", customMessage = null) => {
  cy.get('[data-cy="test-connection-button"]')
    .should("be.visible")
    .should("contain.text", "Test connection")
    .click();

  switch (expectedStatus) {
    case "success":
      cy.get('[data-cy="test-connection-verified-text"]')
        .should("be.visible")
        .should("have.text", "connection verified");
      break;

    case "failed":
      cy.get('[data-cy="test-connection-failed-text"]')
        .should("be.visible")
        .should("contain.text", "could not connect");
      cy.get('[data-cy="connection-alert-text"]').verifyVisibleElement("have.text", customMessage);
      break;
  }
};

export const fillDSConnectionEncryptedField = (fieldName, text, encrypted = true) => {
  const fieldSelector = dsCommonSelector.textField(fieldName);

  if (encrypted) {
    cy.get(fieldSelector).then(($field) => {
      if ($field.is(':disabled')) {
        cy.get('[data-cy="button-edit"]').should('be.visible').click();
        cy.wait(500);
      }
    });
  }

  cy.clearAndType(fieldSelector, text);
};

export function fillDSConnectionForm (config) {
  config.fields.forEach((field) => {
    switch (field.type) {
      case 'input':
        fillDSConnectionTextField(field.fieldName, field.text);
        break;

      case 'encryptedInput':
        fillDSConnectionEncryptedField(field.fieldName, field.text, field.encrypted);
        break;

      case 'dropdown':
        fillDSConnectionDropdown(field.fieldName, field.option);
        break;

      case 'toggle':
        toggleDSConnectionButton(field.buttonName, field.shouldBeChecked);
        break;

      case 'radio':
        selectDSConnectionRadioButton(field.buttonName, field.shouldBeSelected);
        break;

      case 'keyValue':
        fillDSConnectionKeyValuePairs(field.section, field.keyValueData);
        break;

      default:
        throw new Error(`Unsupported field type: ${field.type}`);
    }
  });
}

