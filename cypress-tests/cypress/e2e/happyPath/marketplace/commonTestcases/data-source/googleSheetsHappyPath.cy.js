import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { GoogleSheets } from "Texts/GoogleSheets";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import {
  fillDataSourceTextField,
  selectAndAddDataSource,
  selectAndAddDataSourceGoogleSheet,
} from "Support/utils/postgreSql";
import {
  verifyCouldnotConnectWithAlert,
  deleteDatasource,
  closeDSModal,
} from "Support/utils/dataSource";

const data = {};

describe("Data source googlesheet", () => {
    const sheetId = "YOUR_GOOGLE_SHEET_ID"; 
  const range = "Sheet1!A1:B10"; 

  beforeEach(() => {
    cy.appUILogin();
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("Should verify elements on google sheets connection form", () => {
    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    cy.get(postgreSqlSelector.allDatasourceLabelAndCount).should(
      "have.text",
      postgreSqlText.allDataSources()
    );
    cy.get(postgreSqlSelector.commonlyUsedLabelAndCount).should(
      "have.text",
      postgreSqlText.commonlyUsed
    );
    cy.get(postgreSqlSelector.databaseLabelAndCount).should(
      "have.text",
      postgreSqlText.allDatabase()
    );
    cy.get(postgreSqlSelector.apiLabelAndCount).should(
      "have.text",
      postgreSqlText.allApis
    );
    cy.get(postgreSqlSelector.cloudStorageLabelAndCount).should(
      "have.text",
      postgreSqlText.allCloudStorage
    );

    selectAndAddDataSourceGoogleSheet("databases", GoogleSheets.GoogleSheets, data.dataSourceName);

   
   cy.get('[data-cy="read-only-label"]').should("have.text", "Read only Your ToolJet apps can only read data from Google sheets");
   cy.window().then((win) => {
    cy.stub(win, "open").callsFake((url) => {
      win.location.href = url; // Forces navigation in the same tab
    });
  });
  
  cy.get('[data-cy="button-connect-gsheet"]').click();
  cy.pause();
//    cy.get('[data-cy="read-and-write-label"]').should("have.text", "Read and write Your ToolJet apps can read data from sheets, modify sheets, and more.");
//    cy.get('[data-cy="button-connect-gsheet"]').should("have.text", "Reconnect to Google Sheets").click();

    // deleteDatasource(`cypress-${data.dataSourceName}-redis`);
    cy.request({
        method: "POST",
        url: "https://sheets.googleapis.com/v4/spreadsheets",
        headers: {
          Authorization: `Bearer ${Cypress.env("googleAccessToken")}`,
          "Content-Type": "application/json"
        },
        body: {
          properties: {
            title: "Cypress Test Spreadsheet" // Name of the sheet
          }
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        spreadsheetId = response.body.spreadsheetId; // Save the Sheet ID
        cy.log("Spreadsheet Created:", spreadsheetId);
      });
    });
  
    it("Verifies the spreadsheet exists", () => {
      cy.request({
        method: "GET",
        url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
        headers: {
          Authorization: `Bearer ${Cypress.env("googleAccessToken")}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.properties.title).to.eq("Cypress Test Spreadsheet");
        cy.log("Spreadsheet Verified:", response.body);
      });
    });
});