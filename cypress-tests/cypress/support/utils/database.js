import { databaseSelectors } from "Selectors/database";
import { databaseText } from "Texts/database";

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

export const createTable = (tableName) => {
  cy.get(databaseSelectors.addTableButton).click();
  verifyAllElementsOfAddTableSection();
};
export const verifyAllElementsOfAddTableSection = () => {
  cy.get(commonSelectors.buttonSelector(commonText.cancelButton))
    .should("be.visible")
    .and("have.text", commonText.cancelButton);
  cy.get(commonSelectors.buttonSelector(commonText.createButton))
    .should("be.visible")
    .and("have.text", commonText.createButton);
};
