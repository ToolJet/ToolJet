import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";

import { googleSheetsText } from "Texts/googleSheets";
import { googleSheetsSelector } from "Selectors/googleSheets";

import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import {} from "Support/utils/commonWidget";
import { selectColourFromColourPicker } from "../../../support/utils/commonWidget";
import {
  addQuery,
  fillDataSourceTextField,
  fillConnectionForm,
  selectDataSource,
  openQueryEditor,
  selectQueryMode,
  addGuiQuery,
  addWidgetsToAddUser,
} from "Support/utils/postgreSql";
import { loginbyGoogle } from "Support/utils/manageSSO";
import { fake } from "Fixtures/fake";
import {
  verifyCouldnotConnectWithAlert,
  deleteDatasource,
  closeDSModal,
} from "Support/utils/dataSource";

describe("Data source googlesheet", () => {
  const data = {};
  data.appName = `${fake.companyName}-App`;
  data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
  data.sheetId = "1GYSTLiHKhLatsSN6768VgseLCvLu4sJhgGI9xek8WwM";
  data.range = "A1:Z100";
  data.gid = "0";
  beforeEach(() => {
    let email = "midhun@tooljet.com",
      password = "Idhika@752";
    cy.appUILogin();
    //cy.createApp(data.appName);
    // cy.viewport(1200, 1300);
  });

  it("should verify elements on connection form", () => {
    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();
    cy.get(postgreSqlSelector.allDatasourceLabelAndCount).should(
      "have.text",
      postgreSqlText.allDataSources
    );

    cy.get(postgreSqlSelector.databaseLabelAndCount).should(
      "have.text",
      postgreSqlText.allDatabase
    );
    cy.get(postgreSqlSelector.apiLabelAndCount).should(
      "have.text",
      postgreSqlText.allApis
    );
    cy.get(postgreSqlSelector.cloudStorageLabelAndCount).should(
      "have.text",
      postgreSqlText.allCloudStorage
    );
    selectDataSource(
      "APIs",
      googleSheetsText.dataSourceGoogleSheets,
      data.lastName
    );

    cy.get(googleSheetsSelector.connectionFormHeader).verifyVisibleElement(
      "have.text",
      googleSheetsText.connectionFormHeader
    );
    cy.get(googleSheetsSelector.connectionFormDescription).verifyVisibleElement(
      "have.text",
      googleSheetsText.connectionFormDescription
    );

    cy.get(googleSheetsSelector.checkboxReadonly).should("be.visible");
    cy.get(googleSheetsSelector.labelReadonly).verifyVisibleElement(
      "have.text",
      googleSheetsText.labelReadonly
    );
    cy.get(googleSheetsSelector.subLabelReadonly).verifyVisibleElement(
      "have.text",
      googleSheetsText.subLabelReadonly
    );

    cy.get(googleSheetsSelector.checkboxReadAndWrite).should("be.visible");
    cy.get(googleSheetsSelector.labelReadAndWrite).verifyVisibleElement(
      "have.text",
      googleSheetsText.labelReadAndWrite
    );
    cy.get(googleSheetsSelector.subLabelReadAndWrite).verifyVisibleElement(
      "have.text",
      googleSheetsText.subLabelReadAndWrite
    );
    cy.get('[data-cy="button-connect-gsheet"]').should("be.visible");
  });

  it.skip("should verify connection", () => {
    loginbyGoogle(email, password);
    selectDataSource(
      "APIs",
      googleSheetsText.dataSourceGoogleSheets,
      data.lastName
    );
    cy.get(googleSheetsSelector.checkboxReadAndWrite).click();
    cy.window().then((win) => {
      cy.stub(win, "open").as("windowOpen");
    });
    cy.get('[data-cy="button-connect-gsheet"]').click();
    cy.window("@windowOpen")
      .its("body")
      .then(() => {
        cy.get(".btn");
      });
    cy.visit("@windowOpen");
    cy.wait(5000);
  });

  it.skip("should verify elements on query manager", () => {
    cy.visit("http://localhost:8082/apps/2c63daee-bb03-4ba3-b384-f4647ceb8b5e");
    cy.wait(5000);
    openQueryEditor(googleSheetsText.dataSourceGoogleSheets);
    cy.get('[class="query-pane"]').invoke("css", "height", "calc(95%)");

    selectQueryMode(googleSheetsText.readDataFromSpreadsheet);
    cy.get(googleSheetsSelector.spreadSheetId).verifyVisibleElement(
      "have.text",
      googleSheetsText.spreadSheetId
    );
    cy.get(googleSheetsSelector.spreadSheetIdInputField).should("be.visible");

    cy.get(googleSheetsSelector.labelRange).verifyVisibleElement(
      "have.text",
      googleSheetsText.labelRange
    );
    cy.get(googleSheetsSelector.rangeInputField).should("be.visible");

    cy.get(googleSheetsSelector.labelSheet).verifyVisibleElement(
      "have.text",
      googleSheetsText.labelSheet
    );
    cy.get(googleSheetsSelector.sheetInputField).should("be.visible");

    cy.wait(2000);
    selectQueryMode(googleSheetsText.appendDataToSheet);
    cy.get(googleSheetsSelector.spreadSheetId).verifyVisibleElement(
      "have.text",
      googleSheetsText.spreadSheetId
    );
    cy.get(googleSheetsSelector.spreadSheetIdInputField).should("be.visible");

    cy.get(googleSheetsSelector.labelSheet).verifyVisibleElement(
      "have.text",
      googleSheetsText.labelSheet
    );
    cy.get(googleSheetsSelector.sheetInputField).should("be.visible");

    cy.get(googleSheetsSelector.labelRows).verifyVisibleElement(
      "have.text",
      googleSheetsText.labelRows
    );
    cy.get(googleSheetsSelector.rowsInputField).should("be.visible");

    cy.wait(2000);
    selectQueryMode(googleSheetsText.getSheetInfo);
    cy.get(googleSheetsSelector.spreadSheetId).verifyVisibleElement(
      "have.text",
      googleSheetsText.spreadSheetId
    );
    cy.get(googleSheetsSelector.spreadSheetIdInputField).should("be.visible");

    cy.wait(2000);
    selectQueryMode(googleSheetsText.updateDataToSheet);
    cy.get(googleSheetsSelector.spreadSheetId).verifyVisibleElement(
      "have.text",
      googleSheetsText.spreadSheetId
    );
    cy.get(googleSheetsSelector.spreadSheetIdInputField).should("be.visible");

    cy.get(googleSheetsSelector.labelRange).verifyVisibleElement(
      "have.text",
      googleSheetsText.labelRange
    );
    cy.get(googleSheetsSelector.rangeInputField).should("be.visible");

    cy.get(googleSheetsSelector.labelSheetName).verifyVisibleElement(
      "have.text",
      googleSheetsText.labelSheetName
    );
    cy.get(googleSheetsSelector.sheetInputField).should("be.visible");

    cy.get(googleSheetsSelector.labelWhere).verifyVisibleElement(
      "have.text",
      googleSheetsText.labelWhere
    );
    cy.get(googleSheetsSelector.whereInputField).should("be.visible");

    cy.get(googleSheetsSelector.labelOperator).verifyVisibleElement(
      "have.text",
      googleSheetsText.labelOperator
    );
    cy.get(googleSheetsSelector.whereInputField).should("be.visible");

    cy.get(googleSheetsSelector.labelValue).verifyVisibleElement(
      "have.text",
      googleSheetsText.labelValue
    );
    cy.get(googleSheetsSelector.valueInputField).should("be.visible");

    cy.get(googleSheetsSelector.labelBody).verifyVisibleElement(
      "have.text",
      googleSheetsText.labelBody
    );
    cy.get(googleSheetsSelector.bodyInputField).should("be.visible");

    cy.wait(2000);
    selectQueryMode(googleSheetsText.deleteRowFromSheet);
    cy.get(googleSheetsSelector.spreadSheetId).verifyVisibleElement(
      "have.text",
      googleSheetsText.spreadSheetId
    );
    cy.get(googleSheetsSelector.spreadSheetIdInputField).should("be.visible");

    cy.get(googleSheetsSelector.labelGid).verifyVisibleElement(
      "have.text",
      googleSheetsText.labelGid
    );
    cy.get(googleSheetsSelector.sheetInputField).should("be.visible");

    cy.get(googleSheetsSelector.labelDeleteRowNumber).verifyVisibleElement(
      "have.text",
      googleSheetsText.labelDeleteRowNumber
    );
    cy.get(googleSheetsSelector.deleteRowIndexInputField).should("be.visible");
    cy.wait(1000);
  });
  it.skip("should verify CURD operation on query", () => {
    cy.visit("http://localhost:8082/apps/2c63daee-bb03-4ba3-b384-f4647ceb8b5e");
    cy.wait(5000);
    openQueryEditor("Google Sheets");
    cy.get('[class="query-pane"]').invoke("css", "height", "calc(95%)");

    selectQueryMode(googleSheetsText.readDataFromSpreadsheet); //read data
    cy.get(
      googleSheetsSelector.spreadSheetIdInputField
    ).clearAndTypeOnCodeMirror(data.sheetId);
    cy.get(googleSheetsSelector.rangeInputField).clearAndTypeOnCodeMirror(
      data.range
    );
    cy.get(googleSheetsSelector.sheetInputField); // only needed for two pages/sheets
    cy.get('[data-cy="query-run-button"]').click();
    cy.wait(10000);
    cy.get('[data-cy="query-preview-button"]').click();
    // cy.get('[data-cy="query-preview-tree"]')
    //   .find("li>span")
    //   .each(($x, index) => {
    //     if (index != 0) {
    //       cy.wrap($x).click();
    //     }
    //   });

    cy.get('[data-cy="preview-tab-raw"]').click();
    cy.get('[class="tab-pane active"]').should(
      "have.text",
      '[{"name":"mike","email":"1"},{"name":"steph","email":"2"}]'
    );
    openQueryEditor("Google Sheets");
    selectQueryMode("Append data to a spreadsheet"); //append

    cy.get(
      googleSheetsSelector.spreadSheetIdInputField
    ).clearAndTypeOnCodeMirror(data.sheetId);
    cy.get(googleSheetsSelector.sheetInputField);
    cy.get(googleSheetsSelector.rowsInputField).clearAndTypeOnCodeMirror(
      `[{"name":"mike", "email":"mike@example.com"},{"name":"mike1", "email":"mike1@example.com"},{"name":"mike2", "email":"mike2@example.com"}]`
    );
    cy.get('[data-cy="query-run-button"]').click();

    openQueryEditor("Google Sheets");
    selectQueryMode(googleSheetsText.getSheetInfo); //get info
    cy.get(
      googleSheetsSelector.spreadSheetIdInputField
    ).clearAndTypeOnCodeMirror(data.sheetId);
    cy.get('[data-cy="query-run-button"]').click();

    openQueryEditor("Google Sheets");
    selectQueryMode(googleSheetsText.updateDataToSheet); //update data

    cy.get(
      googleSheetsSelector.spreadSheetIdInputField
    ).clearAndTypeOnCodeMirror(data.sheetId);
    cy.get(googleSheetsSelector.rangeInputField).clearAndTypeOnCodeMirror(
      data.range
    );

    cy.get(googleSheetsSelector.sheetInputField);

    cy.get('[data-cy="where_field-input-field"]').clearAndTypeOnCodeMirror(
      "name"
    );

    cy.get(googleSheetsSelector.valueInputField).clearAndTypeOnCodeMirror(
      "Mike"
    );
    cy.get(googleSheetsSelector.bodyInputField).clearAndTypeOnCodeMirror(
      `{{({"email":"steph@example.com"})`
    );
    cy.get('[data-cy="query-run-button"]').click();

    openQueryEditor("Google Sheets");
    selectQueryMode(googleSheetsText.deleteRowFromSheet); //delete row

    cy.get(
      googleSheetsSelector.spreadSheetIdInputField
    ).clearAndTypeOnCodeMirror(data.sheetId);
    cy.get(googleSheetsSelector.sheetInputField).clearAndTypeOnCodeMirror("0");
    cy.get(
      googleSheetsSelector.deleteRowIndexInputField
    ).clearAndTypeOnCodeMirror("4");
    cy.get('[data-cy="query-run-button"]').click();
  });
  it.skip("should verify the preview", () => {});
});
