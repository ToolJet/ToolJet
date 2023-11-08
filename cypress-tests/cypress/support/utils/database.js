import {
  databaseSelectors,
  createNewColumnSelectors,
  createNewRowSelectors,
  filterSelectors,
  sortSelectors,
  editRowSelectors,
} from "Selectors/database";
import {
  databaseText,
  createNewColumnText,
  createNewRowText,
  editRowText,
} from "Texts/database";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";

export const verifyAllElementsOfPage = () => {
  cy.get(databaseSelectors.addTableButton).should("be.visible");
  // cy.get(databaseSelectors.tablePageHeader).verifyVisibleElement(
  //   "have.text",
  //   databaseText.tablePageHeader
  // );
  // cy.get(databaseSelectors.doNotHaveTableText).verifyVisibleElement(
  //   "have.text",
  //   databaseText.doNotHaveTableText
  // );
  //cy.get(databaseSelectors.searchTableInputField).should("be.visible");
  cy.get(databaseSelectors.allTablesSection).should("be.visible");
  cy.get(databaseSelectors.allTableSubheader).should("be.visible");
};
export const navigateToTable = (tableName) => {
  cy.get(databaseSelectors.currentTable(tableName))
    .scrollIntoView()
    .should("be.visible");
  cy.get(databaseSelectors.currentTableName(tableName))
    .verifyVisibleElement("have.text", tableName)
    .realClick();
};
export const createTableAndVerifyToastMessage = (
  tableName,
  columnDetails = true,
  columnName = [],
  columnDataType = [],
  defaultValue,
  columnDefaultValue = []
) => {
  cy.get(databaseSelectors.addTableButton).click();
  verifyAllElementsOfAddTableSection();
  cy.clearAndType(databaseSelectors.tableNameInputField, tableName);
  if (columnDetails) {
    for (let i = 0; i < columnName.length; i++) {
      cy.get(databaseSelectors.addMoreColumnsButton).click();
      addNewColumnAndVerify(
        columnName[i],
        columnDataType[i],
        defaultValue,
        columnDefaultValue[i]
      );
    }
  }
  cy.get(commonSelectors.buttonSelector(commonText.createButton)).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    databaseText.tableCreatedSuccessfullyToast(tableName)
  );
  navigateToTable(tableName);
  cy.get(databaseSelectors.idColumnHeader).verifyVisibleElement(
    "contain",
    databaseText.idColumnHeader
  );
  cy.get(databaseSelectors.noRecordsText).verifyVisibleElement(
    "have.text",
    databaseText.noRecordsText
  );
};
export const editTableNameAndVerifyToastMessage = (tableName, newTableName) => {
  cy.get(databaseSelectors.currentTable(tableName))
    .find(databaseSelectors.tableKebabIcon)
    .invoke("show")
    .trigger("mouseover")
    .trigger("mousemove")
    .trigger("mousedown")
    .trigger("mouseup")
    .click();
  cy.get(databaseSelectors.tableEditOption).click();
  cy.get(databaseSelectors.editTableHeader).verifyVisibleElement(
    "have.text",
    databaseText.editTableHeader
  );
  cy.get(databaseSelectors.tableNameLabel).verifyVisibleElement(
    "have.text",
    databaseText.tableNameLabel
  );
  cy.get(databaseSelectors.tableNameInputField).should("be.visible");
  cy.clearAndType(databaseSelectors.tableNameInputField, newTableName);
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
  cy.get(databaseSelectors.currentTableName(newTableName)).verifyVisibleElement(
    "have.text",
    newTableName
  );
};
export const deleteTableAndVerifyToastMessage = (tableName) => {
  cy.get(databaseSelectors.currentTable(tableName))
    .find(databaseSelectors.tableKebabIcon)
    .invoke("show")
    .trigger("mouseover")
    .trigger("mousemove")
    .trigger("mousedown")
    .trigger("mouseup")
    .click();
  cy.get(databaseSelectors.tableDeleteOption).click();
  // cy.on('window:confirm', (ConfirmAlertText) => {
  //   expect(ConfirmAlertText).to.contains(`Are you sure you want to delete the table "${tableName}"?`);
  // });
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    databaseText.tableDeletedSuccessfullyToast(tableName)
  );
};
export const addNewColumnAndVerify = (
  columnName = [],
  columnDataType = [],
  defaultValue = true,
  columnDefaultValue = []
) => {
  cy.clearAndType(databaseSelectors.nameInputField("undefined"), columnName);
  cy.get(databaseSelectors.nameInputField(columnName))
    .should("be.visible")
    .verifyVisibleElement("have.value", columnName)
    .parents(".list-group-item")
    .within(() => {
      cy.get(databaseSelectors.typeInputField).click();
      cy.contains(`[id*="react-select-"]`, columnDataType).click();
      if (defaultValue) {
        cy.clearAndType(
          databaseSelectors.defaultInputField,
          columnDefaultValue
        );
      }

      cy.get(databaseSelectors.typeInputField)
        .should("be.visible")
        .verifyVisibleElement("have.text", columnDataType);
      cy.get(databaseSelectors.defaultInputField)
        .should("be.visible")
        .verifyVisibleElement("have.value", columnDefaultValue);
    });
};
export const createNewColumnAndVerify = (
  tableName,
  columnName,
  columnDataType,
  defaultValue = true,
  columnDefaultValue
) => {
  navigateToTable(tableName);
  cy.get(createNewColumnSelectors.addNewColumnButton)
    .should("be.visible")
    .click();
  cy.get(createNewColumnSelectors.createNewColumnHeader).verifyVisibleElement(
    "have.text",
    createNewColumnText.createNewColumnHeader
  );
  cy.get(createNewColumnSelectors.columnNameLabel).verifyVisibleElement(
    "have.text",
    createNewColumnText.columnNameLabel
  );
  cy.get(createNewColumnSelectors.dataTypeLabel).verifyVisibleElement(
    "have.text",
    createNewColumnText.dataTypeLabel
  );
  cy.get(createNewColumnSelectors.defaultValueLabel).verifyVisibleElement(
    "have.text",
    createNewColumnText.defaultValueLabel
  );
  cy.clearAndType(createNewColumnSelectors.columnNameInputField, columnName);
  cy.get(createNewColumnSelectors.dataTypeDropdown).within(() => {
    cy.contains(`Select data type`).click();
    cy.contains(`[id*="react-select-"]`, columnDataType).click();
  });
  if (defaultValue) {
    cy.clearAndType(
      createNewColumnSelectors.defaultValueInputField,
      columnDefaultValue
    );
    cy.get(createNewColumnSelectors.defaultValueInputField)
      .should("be.visible")
      .verifyVisibleElement("have.value", columnDefaultValue);
  }
  cy.get(createNewColumnSelectors.columnNameInputField)
    .should("be.visible")
    .verifyVisibleElement("have.value", columnName);
  cy.get(createNewColumnSelectors.dataTypeDropdown)
    .should("be.visible")
    .verifyVisibleElement("contain", columnDataType);
  cy.get(commonSelectors.buttonSelector(commonText.cancelButton))
    .should("be.visible")
    .and("have.text", commonText.cancelButton);
  cy.get(commonSelectors.buttonSelector(commonText.createButton))
    .should("be.visible")
    .and("have.text", commonText.createButton)
    .click();
  cy.wait(1000);
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    createNewColumnText.columnCreatedSuccessfullyToast
  );

  cy.get(databaseSelectors.columnHeader(columnName)).verifyVisibleElement(
    "contain",
    `${String(columnName).toLowerCase().replace(/\s+/g, "-")}`
  );
};
export const addNewRowAndVerify = (
  tableName,
  noDefaultValue = true,
  columnName = [],
  columnDefaultValue = []
) => {
  navigateToTable(tableName);
  cy.get(createNewRowSelectors.addNewRowButton).click();
  cy.get(createNewRowSelectors.createNewRowHeader).verifyVisibleElement(
    "have.text",
    createNewRowText.createNewRowHeader
  );
  cy.get(createNewRowSelectors.idColumnNameLabel).verifyVisibleElement(
    "contain",
    databaseText.idColumnHeader
  );
  cy.get(createNewRowSelectors.idColumnInputField).should("be.visible");
  cy.get(commonSelectors.buttonSelector(commonText.cancelButton))
    .should("be.visible")
    .and("have.text", commonText.cancelButton);
  cy.get(commonSelectors.buttonSelector(commonText.createButton))
    .should("be.visible")
    .and("have.text", commonText.createButton);
  cy.get("body")
    .find(".table>>>th")
    .its("length")
    .then((columnLength) => {
      if (columnLength != 2) {
        for (let i = 0; i < columnName.length; i++) {
          if (noDefaultValue) {
            cy.clearAndType(
              createNewRowSelectors.columnNameInputField(columnName[i]),
              columnDefaultValue[i]
            );
          } else {
            cy.get(createNewRowSelectors.columnNameInputField(columnName[i]))
              .invoke("val")
              .then((val) => {
                if (val === "") {
                  cy.clearAndType(
                    createNewRowSelectors.columnNameInputField(columnName[i]),
                    columnDefaultValue[i]
                  );
                }
              });
          }
        }
      }
    });
  cy.get(commonSelectors.buttonSelector(commonText.createButton)).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    createNewRowText.rowCreatedSuccessfullyToast
  );
  cy.get('[data-cy*="-column-id-table-cell"]').should("be.visible");
};
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
  cy.get(databaseSelectors.nameInputField("undefined"))
    .should("be.visible")
    .parents(".list-group-item")
    .within(() => {
      cy.get(databaseSelectors.typeInputField).should("be.visible");
      cy.get(databaseSelectors.defaultInputField).should("be.visible");
      cy.get(databaseSelectors.deleteIcon).should("be.visible").click();
    });
};
export const filterOperation = (
  tableName,
  columnName = [],
  operation = [],
  value = []
) => {
  navigateToTable(tableName);
  cy.intercept("GET", "api/tooljet_db/organizations/**").as("dbLoad");

  cy.get(filterSelectors.filterButton).should("be.visible").click();
  cy.get(filterSelectors.selectColumnField).should("be.visible");
  cy.get(filterSelectors.selectOperationField).should("be.visible");
  cy.get(filterSelectors.valueInputField).should("be.visible");
  cy.get(filterSelectors.deleteIcon).should("be.visible");
  cy.get(filterSelectors.addConditionLink).should("be.visible");

  cy.get(filterSelectors.selectColumnField).click();
  cy.contains(`[id*="react-select-"]`, columnName[0]).click();
  cy.get(filterSelectors.selectOperationField).click();
  cy.contains(`[id*="react-select-"]`, operation[0]).click();
  cy.clearAndType(filterSelectors.valueInputField, value[0]);
  //cy.wait("@dbLoad");

  for (let i = 1; i < columnName.length; i++) {
    cy.get(filterSelectors.addConditionLink).click();
    cy.wait("@dbLoad");
    cy.get(filterSelectors.selectColumnField).last().click();
    cy.contains(
      `[id*="react-select-"]`,
      String(columnName[i]).toLowerCase()
    ).click();

    cy.get(filterSelectors.selectOperationField).last().click();
    cy.contains(`[id*="react-select-"]`, operation[i]).click();
    cy.get(filterSelectors.valueInputField).last().clear().type(value[i]);
    cy.get(filterSelectors.selectColumnField)
      .last()
      .should("have.text", String(columnName[i]).toLowerCase());
    cy.get(filterSelectors.valueInputField)
      .last()
      .should("have.text", value[i]);
    cy.wait("@dbLoad");
  }
  cy.get(".table-responsive").click();
  cy.get(databaseSelectors.idColumnHeader).should("be.visible");
};
export const sortOperation = (tableName, columnName = [], order = []) => {
  navigateToTable(tableName);
  cy.get(sortSelectors.sortButton).should("be.visible").click();
  cy.get(sortSelectors.selectColumnField).should("be.visible");
  cy.get(sortSelectors.selectOrderField).should("be.visible");
  cy.get(sortSelectors.deleteIcon).should("be.visible");
  cy.get(sortSelectors.addConditionLink).should("be.visible");
  cy.get(sortSelectors.selectColumnField).click();
  cy.contains(`[id*="react-select-"]`, columnName[0]).click();
  cy.get(sortSelectors.selectOrderField).click();
  cy.contains(`[id*="react-select-"]`, order[0]).click();

  for (let i = 1; i < columnName.length; i++) {
    cy.get(sortSelectors.addConditionLink).click();
    cy.get(sortSelectors.selectColumnField).last().click();
    cy.contains(
      `[id*="react-select-"]`,
      String(columnName[i]).toLowerCase()
    ).click();
    cy.get(sortSelectors.selectOrderField).last().click();
    cy.contains(`[id*="react-select-"]`, order[0]).click();
  }
  cy.get(sortSelectors.sortButton).click();
  cy.get(databaseSelectors.idColumnHeader).should("be.visible");
};
export const deleteCondition = (selector, columnName = [], deleteIcon) => {
  cy.wait(500);
  cy.get(selector).click();
  cy.get(".card-body").eq(1).should("be.visible");
  for (let i = 0; i < columnName.length; i++) {
    cy.get(deleteIcon).eq(i).click();
  }
};
export const deleteRowAndVerify = (tableName, rowNumber = []) => {
  navigateToTable(tableName);
  cy.wait(1000);
  //cy.wait("@dbLoad");
  cy.get("body")
    .find(".table>>tr")
    .its("length")
    .then(() => {
      for (let i = 0; i < rowNumber.length; i++) {
        cy.get(databaseSelectors.checkboxCell(rowNumber[i])).click();
      }
      cy.get(databaseSelectors.deleteRecordButton).should("be.visible").click();

      cy.on("window:confirm", (ConfirmText) => {
        expect(ConfirmText).to.equal(
          "Are you sure you want to delete the selected rows?"
        );
      });
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        databaseText.deleteRowToast(tableName, rowNumber.length)
      );
    });
};
export const verifyRowData = (rowNumber, columnName = [], rowData = []) => {
  for (let i = 0; i < columnName.length - 1; i++) {
    cy.get(editRowSelectors.getRowData(rowNumber, columnName[i + 1]))
      .invoke("text")
      .then((text) => {
        expect(text).to.contain(rowData[i]);
      });
  }
};
export const editRowAndVerify = (
  tableName,
  rowNumber,
  columnName = [],
  rowFieldData = []
) => {
  cy.reload();
  cy.intercept("GET", "api/tooljet_db/organizations/**").as("dbLoad");
  navigateToTable(tableName);
  cy.wait(1000);
  //cy.wait("@dbLoad");
  cy.get(editRowSelectors.editRowbutton).should("be.visible").click();
  cy.get(editRowSelectors.editRowHeader).verifyVisibleElement(
    "have.text",
    editRowText.editRowHeader
  );
  cy.get(editRowSelectors.idColumnNameLabel).verifyVisibleElement(
    "contain",
    databaseText.idColumnName
  );
  cy.contains(createNewRowText.serialDataTypeLabel).should("be.visible");
  cy.contains(editRowText.selectRowToEditText).should("be.visible");
  cy.get(editRowSelectors.selectRowDropdown).should("be.visible").click();
  cy.get(editRowSelectors.selectRowDropdown).type(rowNumber);
  cy.get(`[id*="react-select-"]`).should("be.visible");
  cy.contains(`[id*="react-select-"]`, rowNumber).click();

  for (let i = 0; i < columnName.length - 1; i++) {
    cy.get(
      createNewRowSelectors.columnNameLabel(columnName[i + 1])
    ).verifyVisibleElement("contain", columnName[i + 1].toLowerCase());
    cy.get(
      createNewRowSelectors.columnNameInputField(columnName[i + 1])
    ).should("be.visible");
    cy.get(createNewRowSelectors.columnNameInputField(columnName[i + 1]))
      .realClick()
      .clear()
      .realType(`${rowFieldData[i]}`);
    cy.wait(500);
    cy.get(createNewRowSelectors.columnNameInputField(columnName[i + 1]))
      .invoke("val")
      .then((text) => {
        expect(text).to.contain(rowFieldData[i]);
      });
  }
  cy.get(
    commonSelectors.buttonSelector(commonText.cancelButton)
  ).verifyVisibleElement("have.text", commonText.cancelButton);
  cy.get(commonSelectors.buttonSelector(commonText.saveChangesButton))
    .verifyVisibleElement("have.text", commonText.saveChangesButton)
    .realClick();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    editRowText.rowEditedSuccessfullyToast
  );
  verifyRowData(rowNumber, columnName, rowFieldData);
};

export const editRowWithInvalidData = (
  tableName,
  rowNumber,
  columnName,
  rowFieldData
) => {
  cy.intercept("GET", "api/tooljet_db/organizations/**").as("dbLoad");
  navigateToTable(tableName);
  //cy.wait("@dbLoad");

  cy.get(editRowSelectors.editRowbutton).should("be.visible").click();
  cy.get(editRowSelectors.editRowHeader).verifyVisibleElement(
    "have.text",
    editRowText.editRowHeader
  );
  cy.contains(editRowText.selectRowToEditText).should("be.visible");
  cy.get(editRowSelectors.selectRowDropdown).should("be.visible").click();
  cy.get(editRowSelectors.selectRowDropdown).type(rowNumber);
  cy.get(`[id*="react-select-"]`).should("be.visible");
  cy.contains(`[id*="react-select-"]`, rowNumber).click();

  cy.get(
    createNewRowSelectors.columnNameLabel(columnName)
  ).verifyVisibleElement("contain", columnName.toLowerCase());
  cy.get(createNewRowSelectors.columnNameInputField(columnName)).should(
    "be.visible"
  );
  cy.get(createNewRowSelectors.columnNameInputField(columnName))
    .realClick()
    .clear()
    .realType(`${rowFieldData}`);
  cy.wait(500);
  cy.get(createNewRowSelectors.columnNameInputField(columnName))
    .invoke("val")
    .then((text) => {
      expect(text).to.contain(rowFieldData);
    });
  cy.get(
    commonSelectors.buttonSelector(commonText.cancelButton)
  ).verifyVisibleElement("have.text", commonText.cancelButton);
  cy.get(commonSelectors.buttonSelector(commonText.saveChangesButton))
    .verifyVisibleElement("have.text", commonText.saveChangesButton)
    .click();
  cy.get(commonSelectors.buttonSelector(commonText.saveChangesButton)).should(
    "be.disabled"
  );
  cy.get(commonSelectors.buttonSelector(commonText.cancelButton)).click();
};
