import { databaseSelectors } from "Selectors/database";
import { databaseText } from "Texts/database";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";

export const verifyAllElementsOfPage = () => {
  cy.get(databaseSelectors.addTableButton).should("be.visible");
  cy.get(databaseSelectors.tablePageHeader).verifyVisibleElement(
    "have.text",
    databaseText.tablePageHeader
  );
  cy.get(databaseSelectors.doNotHaveTableText).verifyVisibleElement(
    "have.text",
    databaseText.doNotHaveTableText
  );
  cy.get(databaseSelectors.searchTableInputField).should("be.visible");
  cy.get(databaseSelectors.allTablesSection).should("be.visible");
  cy.get(databaseSelectors.allTableSubheader).should("be.visible");
};

export const createTableAndVerifyToastMessage = (tableName) => {
  cy.get(databaseSelectors.addTableButton).click();
  verifyAllElementsOfAddTableSection();
  cy.get(databaseSelectors.tableNameInputField).clear().type(tableName);
  cy.get(commonSelectors.buttonSelector(commonText.createButton)).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    databaseText.tableCreatedSuccessfullyToast(tableName)
  );
  cy.get(databaseSelectors.currentTable(tableName)).should("be.visible")
  cy.get(databaseSelectors.currentTableName(tableName)).verifyVisibleElement("have.text", tableName);
};

export const editTableNameAndVerifyToastMessage = (tableName, newTableName) => {
  cy.get(databaseSelectors.currentTable(tableName))
    .find(databaseSelectors.tableKebabIcon).invoke('show')
    .trigger('mouseover')
    .trigger('mousemove')
    .trigger('mousedown')
    .trigger('mouseup').click();
  cy.get(databaseSelectors.tableEditOption).click();
  cy.get(databaseSelectors.editTableHeader).verifyVisibleElement("have.text", databaseText.editTableHeader);
  cy.get(databaseSelectors.tableNameLabel).verifyVisibleElement(
    "have.text",
    databaseText.tableNameLabel
  );
  cy.get(databaseSelectors.tableNameInputField).should("be.visible");
  cy.get(databaseSelectors.tableNameInputField).clear().type(newTableName);
  cy.get(commonSelectors.buttonSelector(commonText.cancelButton))
    .should("be.visible")
    .and("have.text", commonText.cancelButton);
  cy.get(commonSelectors.buttonSelector(commonText.saveChangesButton))
    .should("be.visible")
    .and("have.text", commonText.saveChangesButton);
  cy.get(commonSelectors.buttonSelector(commonText.saveChangesButton)).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    databaseText.tableEditedSuccessfullyToast(newTableName)
  );
  cy.get(databaseSelectors.currentTableName(newTableName)).verifyVisibleElement("have.text", newTableName);
};
export const deleteTableAndVerifyToastMessage = (tableName) => {
  cy.get(databaseSelectors.currentTable(tableName))
    .find(databaseSelectors.tableKebabIcon).invoke('show')
    .trigger('mouseover')
    .trigger('mousemove')
    .trigger('mousedown')
    .trigger('mouseup').click();
  cy.get(databaseSelectors.tableDeleteOption).click();
  cy.on('window:confirm', (ConfirmAlertText) => {
    expect(ConfirmAlertText).to.contains(`Are you sure you want to delete the table "${tableName}"?`);
  });
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    databaseText.tableDeletedSuccessfullyToast(tableName)
  );
};

export const addNewColumn = () => {

}
export const addNewRow = () => {

}
export const verifyAllElementsOfAddTableSection = () => {
  cy.get(databaseSelectors.tableNameLabel).verifyVisibleElement(
    "have.text",
    databaseText.tableNameLabel
  );
  cy.get(databaseSelectors.tableNameInputField).should("be.visible");
  cy.get(databaseSelectors.addColumnsHeader).verifyVisibleElement(
    "have.text",
    databaseText.addColumnHeader
  );
  cy.get(databaseSelectors.nameLabel).verifyVisibleElement(
    "have.text",
    databaseText.nameLabel
  );
  cy.get(databaseSelectors.typeLabel).verifyVisibleElement(
    "have.text",
    databaseText.typeLabel
  );
  cy.get(databaseSelectors.defaultLabel).verifyVisibleElement(
    "have.text",
    databaseText.defaultLabel
  );
  cy.get(databaseSelectors.idInputField).should("be.visible");
  cy.get(databaseSelectors.typeInputField).should("be.visible");
  cy.get(databaseSelectors.defaultInputField).should("be.visible");
  cy.get(databaseSelectors.addMoreColumnsButton).should("be.visible");

  cy.get(commonSelectors.buttonSelector(commonText.cancelButton))
    .should("be.visible")
    .and("have.text", commonText.cancelButton);
  cy.get(commonSelectors.buttonSelector(commonText.createButton))
    .should("be.visible")
    .and("have.text", commonText.createButton);

  cy.get(databaseSelectors.addMoreColumnsButton).click();
  cy.get(databaseSelectors.nameInputField("undefined")).should("be.visible")
    .parents(".list-group-item")
    .within(() => {
      cy.get(databaseSelectors.typeInputField).should("be.visible");
      cy.get(databaseSelectors.defaultInputField).should("be.visible");
      cy.get(databaseSelectors.deleteIcon).should("be.visible");
    });
};
