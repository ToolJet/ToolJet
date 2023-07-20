import { filterSelectors, sortSelectors } from "Selectors/database";
import { databaseText, filterText, sortText } from "Texts/database";
import { navigateToDatabase } from "Support/utils/common";
import {
  verifyAllElementsOfPage,
  createTableAndVerifyToastMessage,
  editTableNameAndVerifyToastMessage,
  deleteTableAndVerifyToastMessage,
  createNewColumnAndVerify,
  navigateToTable,
  addNewRowAndVerify,
  filterOperation,
  sortOperation,
  deleteCondition,
  deleteRowAndVerify,
  editRowWithInvalidData,
  editRowAndVerify,
} from "Support/utils/database";
import { fake } from "Fixtures/fake";
import { randomNumber } from "Support/utils/commonWidget";
import { randomString } from "Support/utils/textInput";

describe("Database Functionality", () => {
  const data = {};
  data.tableName = fake.tableName;
  data.newTableName = fake.tableName;
  data.editTableName = fake.tableName;
  data.maximumLength = randomNumber(8, 10);
  data.dataType = ["varchar", "int", "float", "boolean"];
  const columnDetails = () => {
    let column = {
      name: fake.firstName,
      defaultValueDoublePrecision:
        Math.floor(Math.random() * (1000 - 100) + 100) / 100,
      defaultValueInt: randomNumber(10, 99),
      defaultValueVarchar: randomString(data.maximumLength),
    };
    return column;
  };
  let column1 = columnDetails();
  let column2 = columnDetails();

  const rowData = () => {
    let row = {
      varcharData: randomString(data.maximumLength),
      doublePrecisionData: Math.floor(Math.random() * (1000 - 100) + 100) / 100,
      intData: randomNumber(10, 99),
    };
    return row;
  };
  let row1 = rowData();
  let row2 = rowData();
  let row3 = rowData();
  let row4 = rowData();

  beforeEach(() => {
    cy.appUILogin();
  });
  it("Verify that all elements of the table page", () => {
    navigateToDatabase();
    verifyAllElementsOfPage();
    createTableAndVerifyToastMessage(data.tableName, false);
    createTableAndVerifyToastMessage(
      data.newTableName,
      true,
      [column1.name, column2.name],
      [data.dataType[0], data.dataType[1]],
      true,
      [column1.defaultValueVarchar, column1.defaultValueInt]
    );
  });
  it("Verify all operations of table", () => {
    navigateToDatabase();
    cy.screenshot();
    navigateToTable(data.tableName);
    cy.screenshot();
    editTableNameAndVerifyToastMessage(data.newTableName, data.editTableName);
    cy.screenshot();
    deleteTableAndVerifyToastMessage(data.editTableName);
    createNewColumnAndVerify(
      data.tableName,
      column1.name,
      data.dataType[0],
      true,
      column1.defaultValueVarchar
    );
    cy.screenshot();
    addNewRowAndVerify(data.tableName, false);
    cy.screenshot();
    addNewRowAndVerify(data.tableName, false, [column1.name], true, [
      row1.varcharData,
    ]);
    cy.screenshot();
    createNewColumnAndVerify(
      data.tableName,
      column2.name,
      data.dataType[1],
      false
    );
    addNewRowAndVerify(
      data.tableName,
      false,
      [column1.name, column2.name],
      [row2.varcharData, row2.intData]
    );
    cy.screenshot();
    addNewRowAndVerify(
      data.tableName,
      true,
      [column1.name, column2.name],
      [row3.varcharData, row3.intData]
    );
    cy.screenshot();
    filterOperation(
      data.tableName,
      [databaseText.idColumnName],
      [filterText.operation.greaterThan],
      ["2"]
    );
    deleteCondition(
      filterSelectors.filterButton,
      [databaseText.idColumnName],
      filterSelectors.deleteIcon
    );
    sortOperation(
      data.tableName,
      [databaseText.idColumnName],
      [sortText.order.descending]
    );
    deleteCondition(
      sortSelectors.sortButton,
      [databaseText.idColumnName],
      sortSelectors.deleteIcon
    );
    cy.reload();
    deleteRowAndVerify(data.tableName, ["1", "2"]);
    editRowWithInvalidData(data.tableName, "3", column2.name, row4.varcharData);
    editRowAndVerify(
      data.tableName,
      "3",
      [databaseText.idColumnName, column1.name, column2.name],
      [row4.varcharData, row4.intData]
    );
  });
});
