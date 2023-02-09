import { commonSelectors } from "Selectors/common";
import { databaseSelectors } from "Selectors/database";
import { databaseText } from "Texts/database";
import {
  closeModal,
  navigateToDatabase,
  selectAppCardOption,
} from "Support/utils/common";
import {
  verifyAllElementsOfPage, createTableAndVerifyToastMessage, editTableNameAndVerifyToastMessage,
  deleteTableAndVerifyToastMessage
} from "Support/utils/database";
import { commonText } from "Texts/common";
import { fake } from "Fixtures/fake";
import { buttonText } from "Texts/button";

describe("Database Functionality", () => {
  const data = {};
  data.tableName = "test1" //fake.tableName;
  data.newTableName = fake.tableName;
  beforeEach(() => {
    cy.appUILogin();
  });
  it("Verify that all elements of the table page", () => {
    navigateToDatabase();
    verifyAllElementsOfPage();
    createTableAndVerifyToastMessage(data.tableName);
    //editTableNameAndVerifyToastMessage(data.tableName, data.newTableName);
    //deleteTableAndVerifyToastMessage(data.tableName)
  });
});
