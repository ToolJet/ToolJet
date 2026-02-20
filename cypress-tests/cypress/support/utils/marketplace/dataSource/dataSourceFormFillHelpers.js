import { dsCommonSelector } from "Selectors/marketplace/common";

export const fillDSConnectionTextField = (field) => {
  cy.clearAndType(dsCommonSelector.textField(field.fieldName), field.text);
};

export const fillDSConnectionDropdown = (field) => {
  cy.waitForElement(dsCommonSelector.dropdownField(field.fieldName))
  cy.get(dsCommonSelector.dropdownField(field.fieldName))
    .click();
  cy.contains("[id*=react-select-]", field.text).click();
};

export const toggleDSConnectionButton = (field) => {
  const shouldBeChecked = field.shouldBeChecked !== undefined ? field.shouldBeChecked : true;
  cy.get(dsCommonSelector.toggleInput(field.fieldName)).then(($checkbox) => {
    const isChecked = $checkbox.is(":checked");
    if (isChecked !== shouldBeChecked) {
      cy.wrap($checkbox).click({ force: true });
    }
  });
};

export const selectDSConnectionRadioButton = (field) => {
  const shouldBeSelected = field.shouldBeSelected !== undefined ? field.shouldBeSelected : true;
  cy.get(dsCommonSelector.radioButtonInput(field.fieldName)).then(($radio) => {
    const isSelected = $radio.is(":checked");
    if (isSelected !== shouldBeSelected) {
      cy.wrap($radio).click({ force: true });
    }
  });
};

export const selectDSConnectionCheckbox = (field) => {
  const shouldBeChecked = field.shouldBeChecked !== undefined ? field.shouldBeChecked : true;
  cy.get(dsCommonSelector.checkboxInput(field.fieldName)).then(($checkbox) => {
    const isChecked = $checkbox.is(":checked");
    if (isChecked !== shouldBeChecked) {
      cy.wrap($checkbox).click({ force: true });
    }
  });
};

export const fillDSConnectionKeyValuePairs = (field) => {
  cy.get(dsCommonSelector.subSection(field.fieldName)).within(() => {
    field.keyValueData.forEach((pair, index) => {
      cy.root().then(($section) => {
        const keyFieldExists = $section.find(dsCommonSelector.keyInputField(field.fieldName, index)).length > 0;
        if (!keyFieldExists) {
          cy.get(dsCommonSelector.addButton(field.fieldName))
            .should('be.visible')
            .click();
          cy.wait(500);
        }
      });

      cy.get(dsCommonSelector.keyInputField(field.fieldName, index))
        .should('be.visible')
        .clear()
        .type(pair.key);

      cy.get(dsCommonSelector.valueInputField(field.fieldName, index))
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
  cy.intercept('POST', '**/api/data-sources/*/test-connection').as('testConnection');
  cy.waitForElement('[data-cy="test-connection-button"]', 60000);

  cy.get('[data-cy="test-connection-button"]')
    .should("be.visible")
    .should("contain.text", "Test connection")
    .click();

  // Wait for the API call to complete
  cy.wait('@testConnection', { timeout: 60000 });

  switch (expectedStatus) {
    case "success":
      cy.get('[data-cy="test-connection-verified-text"]')
        .should("be.visible")
        .should("have.text", "connection verified");
      break;

    case "failed":
      cy.waitForElement('[data-cy="test-connection-failed-text"]', 60000);
      cy.get('[data-cy="test-connection-failed-text"]')
        .scrollIntoView()
        .should("be.visible", { timeout: 30000 })
        .should("contain.text", "could not connect");

      cy.get('[data-cy="connection-alert-text"]')
        .scrollIntoView()
        .should("be.visible", { timeout: 40000 })
        .should("contain.text", customMessage);
      break;
  }
};

export const fillDSConnectionEncryptedField = (field) => {
  const fieldSelector = dsCommonSelector.textField(field.fieldName);
  const encrypted = field.encrypted !== undefined ? field.encrypted : true;

  const isJSON = (str) => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  if (encrypted) {
    cy.get(fieldSelector).then(($field) => {
      if ($field.is(':disabled')) {
        cy.get('[data-cy="button-edit"]').should('be.visible').click();
        cy.wait(500);
      }
    });
  }

  // Handle JSON content with special character sequences disabled
  if (field.parseSpecialCharSequences === false || isJSON(field.text)) {
    cy.waitForElement(fieldSelector)
      .scrollIntoView()
      .should("be.visible", { timeout: 10000 })
      .click({ force: true })
      .wait(200)
      .type(`{selectall}{backspace}`, { parseSpecialCharSequences: true })
      .wait(100)
      .type(`{selectall}{backspace}`, { parseSpecialCharSequences: true })
      .wait(100)
      .type(field.text, {
        parseSpecialCharSequences: false,
        delay: 50
      });
  } else {
    cy.clearAndType(fieldSelector, field.text);
  }
};

const processFields = (fields) => {
  fields.forEach((field) => {
    switch (field.type) {
      case 'input':
        fillDSConnectionTextField(field);
        break;
      case 'encrypted':
        fillDSConnectionEncryptedField(field);
        break;
      case 'dropdown':
        fillDSConnectionDropdown(field);
        break;
      case 'toggle':
        toggleDSConnectionButton(field);
        break;
      case 'radio':
        selectDSConnectionRadioButton(field);
        break;
      case 'keyValue':
        fillDSConnectionKeyValuePairs(field);
        break;
      case 'checkbox':
        selectDSConnectionCheckbox(field);
        break;
      default:
        throw new Error(`Unsupported field type: ${field.type}`);
    }
  });
};

export function fillDSConnectionForm (formConfig, invalidFields = []) {
  if (Array.isArray(formConfig) && formConfig.length > 0 && typeof formConfig[0] === 'object' && formConfig[0].type) {
    processFields(formConfig);
    return;
  }

  if (!formConfig || typeof formConfig !== 'object') {
    throw new Error('Invalid formConfig: expected an object');
  }

  if (formConfig.valid && Array.isArray(formConfig.valid)) {
    processFields(formConfig.valid);
  }

  if (invalidFields && invalidFields.length > 0) {
    processFields(invalidFields);
  }
};

export const openDataSourceConnection = (dataSourceName) => {
  cy.visit('/my-workspace/data-sources');
  cy.waitForElement(dsCommonSelector.dataSourceNameButton(dataSourceName));
  cy.get(dsCommonSelector.dataSourceNameButton(dataSourceName)).click();
};