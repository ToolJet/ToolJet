
export const verifyElemtsNoGds = (option) => {
  cy.get('[data-cy="label-select-datasource"]').verifyVisibleElement(
    "have.text",
    "Connect to a Data Source"
  );
  cy.get('[data-cy="querymanager-description"]').verifyVisibleElement(
    "contain.text",
    "Select a Data Source to start creating a new query. To know more about queries in ToolJet, you can read our"
  );
  cy.get('[data-cy="querymanager-doc-link"]').verifyVisibleElement(
    "have.text",
    "documentation"
  );

  cy.get('[data-cy="landing-page-label-default"]').verifyVisibleElement(
    "have.text",
    "Default"
  );
  cy.get('[data-cy="restapi-add-query-card"]').verifyVisibleElement(
    "have.text",
    " REST API"
  );
  cy.get('[data-cy="runjs-add-query-card"]').verifyVisibleElement(
    "have.text",
    " JavaScript"
  );
  cy.get('[data-cy="runpy-add-query-card"]').verifyVisibleElement(
    "contain.text",
    " Python"
  );
  cy.get('[data-cy="tooljetdb-add-query-card"]').verifyVisibleElement(
    "have.text",
    " ToolJet DB"
  );

  cy.get('[data-cy="label-avilable-ds"]').verifyVisibleElement(
    "have.text",
    "Available data sources 0"
  );
  cy.get('[data-cy="landing-page-add-new-ds-button"]').verifyVisibleElement(
    "have.text",
    "Add new"
  );
  cy.get('[data-cy="label-no-ds-added"]').verifyVisibleElement(
    "have.text",
    "No global data sources have been added yet."
  );
};

export const verifyElemtsWithGds = (option) => { };


const validateLabel = (fieldName) => {
  cy.get(dsCommonSelector.labelFieldName(fieldName)).verifyVisibleElement("have.text", fieldName);
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
      case 'codeMirror':
        fillDataOnCodeMirrorInput(field.selector, field.data);
        break;
      default:
        throw new Error(`Unsupported field type: ${field.type}`);
    }
  });
};
