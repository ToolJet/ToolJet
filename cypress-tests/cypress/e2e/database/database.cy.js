import { filterSelectors, sortSelectors } from "Selectors/database";
import { filterText, sortText } from "Texts/database";
import { navigateToDatabase } from "Support/utils/common";
import {
  verifyAllElementsOfPage, createTableAndVerifyToastMessage, editTableNameAndVerifyToastMessage,
  deleteTableAndVerifyToastMessage,
  createNewColumnAndVerify,
  navigateToTable,
  addNewRowAndVerify,
  filterOperation,
  sortOperation,
  deleteCondition,
  deleteRowAndVerify
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
      defaultValueDoublePrecision: Math.floor(Math.random() * (1000 - 100) + 100) / 100,
      defaultValueInt: randomNumber(10, 99),
      defaultValueVarchar: randomString(data.maximumLength)
    };
    return column;
  };
  let column1 = columnDetails();
  let column2 = columnDetails();
  let column3 = columnDetails();
  let column4 = columnDetails();

  let rowData = {
    varcharData: randomString(data.maximumLength),
    doublePrecisionData: Math.floor(Math.random() * (1000 - 100) + 100) / 100,
    intData: randomNumber(10, 99),
  };

  beforeEach(() => {
    cy.appUILogin();
  });
  it("Verify that all elements of the table page", () => {
    navigateToDatabase();
    verifyAllElementsOfPage();
    createTableAndVerifyToastMessage(data.tableName, false);
    createTableAndVerifyToastMessage(data.newTableName, true, [column1.name, column2.name], [data.dataType[0], data.dataType[1]], true, [column1.defaultValueVarchar, column1.defaultValueInt]);
  });
  it("Verify all operations of table", () => {
    navigateToDatabase();
    navigateToTable(data.tableName);
    editTableNameAndVerifyToastMessage(data.newTableName, data.editTableName);
    deleteTableAndVerifyToastMessage(data.editTableName);
    createNewColumnAndVerify(data.tableName, column1.name, data.dataType[0], true, column1.defaultValueVarchar);
    addNewRowAndVerify(data.tableName, false)

    addNewRowAndVerify(data.tableName, false, [column1.name], true, [rowData.varcharData])
    createNewColumnAndVerify(data.tableName, column2.name, data.dataType[1], false);
    addNewRowAndVerify(data.tableName, false, [column1.name, column2.name], [rowData.varcharData, rowData.intData]);
    addNewRowAndVerify(data.tableName, true, [column1.name, column2.name], [rowData.varcharData, rowData.intData]);
    filterOperation(data.tableName, ["id"], [filterText.operation.greaterThan], ["2"]);
    deleteCondition(filterSelectors.filterButton, ["id"], filterSelectors.deleteIcon)
    sortOperation(data.tableName, ["id"], [sortText.order.descending])
    deleteCondition(sortSelectors.sortButton, ["id"], sortSelectors.deleteIcon)
    deleteRowAndVerify(data.tableName, ["1", "2"]);
  });
});
