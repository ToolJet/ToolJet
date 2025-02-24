import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { pluginSelectors, baserowSelectors } from "Selectors/plugins";
import { postgreSqlText } from "Texts/postgreSql";
import { amazonSesText } from "Texts/amazonSes";
import { baseRowText } from "Texts/baseRow";
import { amazonAthenaText } from "Texts/amazonAthena";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";

import {
  fillDataSourceTextField,
  selectAndAddDataSource,
} from "Support/utils/postgreSql";

import {
  verifyCouldnotConnectWithAlert,
  deleteDatasource,
  closeDSModal,
  addQuery,
  addDsAndAddQuery,
} from "Support/utils/dataSource";

import { openQueryEditor } from "Support/utils/dataSource";
import { dataSourceSelector } from "../../../../../constants/selectors/dataSource";

const data = {};
data.dsName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Data source baserow", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.defaultWorkspaceLogin();
    cy.intercept("POST", "/api/data_queries").as("createQuery");
  });

  it("Should verify elements on baserow connection form", () => {
    const Apikey = Cypress.env("baserow_apikey");

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

    selectAndAddDataSource("databases", baseRowText.baserow, data.dsName);

    fillDataSourceTextField(
      baseRowText.lableApiToken,
      "**************",
      Apikey
    );

    cy.get(".react-select__control").eq(1).click();

    cy.get(".react-select__option").contains("Baserow Cloud").click();

    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    deleteDatasource(`cypress-${data.dsName}-baserow`);
  });

  it("Should verify the functionality of baserow connection form.", () => {
    const Apikey = Cypress.env("baserow_apikey");

    selectAndAddDataSource("databases", baseRowText.baserow, data.dsName);

    fillDataSourceTextField(
      baseRowText.lableApiToken,
      "**************",
      Apikey
    );

    cy.get(".react-select__control").eq(1).click();

    cy.get(".react-select__option").contains("Baserow Cloud").click();

    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );
    deleteDatasource(`cypress-${data.dsName}-baserow`);
  });

  it("Should be able to run the query with a valid connection", () => {
    const baserowTableID = Cypress.env("baserow_tableid");
    const baserowRowID = Cypress.env("baserow_rowid");
    const Apikey = Cypress.env("baserow_apikey");
    
    selectAndAddDataSource("databases", baseRowText.baserow, data.dsName);

      fillDataSourceTextField(baseRowText.lableApiToken, "**************", Apikey);

      cy.get(".react-select__control").eq(1).click();
      cy.get(".react-select__option").contains("Baserow Cloud").click();

      cy.get(postgreSqlSelector.buttonSave)
        .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
        .click();
      cy.verifyToastMessage(commonSelectors.toastMessage, postgreSqlText.toastDSSaved);

      cy.get(commonSelectors.globalDataSourceIcon).click();
      cy.get(`[data-cy="cypress-${data.dsName}-baserow-button"]`)
        .verifyVisibleElement("have.text", `cypress-${data.dsName}-baserow`);
      cy.wait(1000);

    cy.log("Baserow Table ID:", baserowTableID);
    cy.log("Row ID:", baserowRowID);
    cy.log("API Key:", Apikey);

    if (!baserowTableID || !Apikey) {
      throw new Error("Missing required environment variables!");
    }

    cy.request({
      method: "POST",
      url: `https://api.baserow.io/api/database/rows/table/${baserowTableID}/`,
      headers: { Authorization: `Token ${Apikey}` },
      body: {
        field_1: "Sample Data",
        field_2: "Another Value"
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      const rowId = response.body.id;


      cy.get(commonSelectors.dashboardIcon).click();
      cy.get(commonSelectors.appCreateButton).click();
      cy.get(commonSelectors.appNameInput).click().type(data.dsName);
      cy.get(commonSelectors.createAppButton).click();
      cy.skipWalkthrough();

      cy.get('[data-cy="show-ds-popover-button"]').click();
      cy.get(".css-4e90k9").type(`${data.dsName}`);
      cy.contains(`[id*="react-select-"]`, data.dsName).click();
      cy.get('[data-cy="query-rename-input"]').clear().type(data.dsName);

      // Verify delete operation (Need to uncomment after bug fixes)

    //   cy.get('[data-cy="operation-select-dropdown"]').click();
    //   cy.get(".react-select__option").contains("Delete row").click();
      
    //   cy.get(baserowSelectors.baserowTabelId).clearAndTypeOnCodeMirror(baserowTableID);
    //   cy.get(baserowSelectors.baserow_rowIdinputfield).clearAndTypeOnCodeMirror(rowId.toString());

    //   cy.get(dataSourceSelector.queryPreviewButton).click();
    //   cy.verifyToastMessage(commonSelectors.toastMessage, `Query (${data.dsName}) completed.`);
    });

    // Verify other operations
    const operations = [
      "List fields",
      "List rows",
      "Get row",
      "Create row",
      "Update row",
      "Move row"
    ];

    operations.forEach((operation) => {
      cy.get('[data-cy="operation-select-dropdown"]').click();
      cy.get(".react-select__option").contains(operation).click();
      cy.get(baserowSelectors.baserowTabelId).clearAndTypeOnCodeMirror(baserowTableID);
      
      if (operation === "Get row") {
        cy.get(baserowSelectors.baserow_rowIdinputfield).clearAndTypeOnCodeMirror(baserowRowID);
      }
      if (operation === "Move row") {
        cy.get('[data-cy="before_id-input-field"]').clearAndTypeOnCodeMirror("1");
      }

      cy.get(dataSourceSelector.queryPreviewButton).click();
      cy.verifyToastMessage(commonSelectors.toastMessage, `Query (${data.dsName}) completed.`);
    });
  });
});

