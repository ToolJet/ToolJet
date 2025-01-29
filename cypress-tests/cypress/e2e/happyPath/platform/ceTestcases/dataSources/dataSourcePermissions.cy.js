import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import {
  selectAndAddDataSource,
  fillConnectionForm,
} from "Support/utils/postgreSql";
import { commonText } from "Texts/common";
import {
  deleteDatasource,
  addQuery,
  verifyValueOnInspector,
} from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";
import { dataSourceText } from "Texts/dataSource";
import {
  navigateToManageGroups,
  pinInspector,
  navigateToManageUsers,
} from "Support/utils/common";
import { inviteUserBasedOnRole } from "Support/utils/manageGroups";

const data = {};
data.firstName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.email = fake.email.toLowerCase();

describe("Datasource Manager", () => {
  const workspaceName = fake.firstName;
  const workspaceSlug = fake.firstName.toLowerCase().replace(/[^A-Za-z]/g, "");
  beforeEach(() => {
    cy.apiLogin();
    cy.visit(`${workspaceSlug}`);
    cy.viewport(1200, 1300);
    cy.skipWalkthrough();
  });

  before(() => {
    cy.defaultWorkspaceLogin();
    cy.apiCreateWorkspace(workspaceName, workspaceSlug);
    cy.apiLogout();
  });

  it("Should verify the data source manager UI", () => {
    data.dsName1 = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.dsName2 = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(commonSelectors.pageSectionHeader).verifyVisibleElement(
      "have.text",
      "Data sources"
    );
    cy.get(dataSourceSelector.allDatasourceLabelAndCount).verifyVisibleElement(
      "have.text",
      dataSourceText.allDataSources
    );
    cy.get(commonSelectors.breadcrumbTitle).should(($el) => {
      expect($el.contents().first().text().trim()).to.eq("Data sources");
    });

    const categories = [
      {
        selector: dataSourceSelector.commonDsLabelAndCount,
        text: "Commonly used (5)",
        title: " Commonly used",
      },
      {
        selector: dataSourceSelector.databaseLabelAndCount,
        text: dataSourceText.allDatabase,
        title: " Databases",
      },
      {
        selector: dataSourceSelector.apiLabelAndCount,
        text: dataSourceText.allApis,
        title: " APIs",
      },
      {
        selector: dataSourceSelector.cloudStorageLabelAndCount,
        text: dataSourceText.allCloudStorage,
        title: " Cloud Storages",
      },
      {
        selector: dataSourceSelector.pluginsLabelAndCount,
        text: dataSourceText.pluginsLabelAndCount,
        title: " Plugins",
      },
    ];

    categories.forEach(({ selector, text, title }) => {
      cy.get(selector).verifyVisibleElement("have.text", text).click();
      cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
        "have.text",
        title
      );
    });

    cy.get('[data-cy="added-ds-label"]').should(($el) => {
      expect($el.contents().first().text().trim()).to.eq("Data sources added");
    });
    cy.get(dataSourceSelector.addedDsSearchIcon).should("be.visible").click();
    cy.get(dataSourceSelector.AddedDsSearchBar)
      .invoke("attr", "placeholder")
      .should("eq", "Search for Data sources");

    selectAndAddDataSource(
      "databases",
      dataSourceText.postgreSQL,
      data.dsName1
    );

    cy.clearAndType(
      dataSourceSelector.dsNameInputField,
      `cypress-${data.dsName1}-postgresql1`
    );

    cy.get(dataSourceSelector.databaseLabelAndCount).click();

    cy.get(commonSelectors.modalComponent).should("be.visible");
    cy.get(dataSourceSelector.unSavedModalTitle).verifyVisibleElement(
      "have.text",
      dataSourceText.unSavedModalTitle
    );
    cy.get(commonWidgetSelector.modalCloseButton).should("be.visible");
    cy.get(commonSelectors.cancelButton)
      .should("be.visible")
      .and("have.text", commonText.saveChangesButton);
    cy.get(commonSelectors.yesButton).verifyVisibleElement(
      "have.text",
      "Discard"
    );

    cy.get(commonWidgetSelector.modalCloseButton).click();
    cy.get(dataSourceSelector.buttonSave).should("be.enabled");

    cy.get(dataSourceSelector.databaseLabelAndCount).click();
    cy.get(commonSelectors.yesButton).click();
    cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
      "have.text",
      " Databases"
    );
    cy.get(`[data-cy="cypress-${data.dsName1}-postgresql-button"]`).click();
    cy.clearAndType(
      dataSourceSelector.dsNameInputField,
      `cypress-${data.dsName1}-postgresql1`
    );
    cy.get(commonSelectors.dashboardIcon).click();
    cy.get(commonSelectors.yesButton).click();

    cy.get(commonSelectors.appCreateButton).should("be.visible");
    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(`[data-cy="cypress-${data.dsName1}-postgresql-button"]`).click();
    cy.clearAndType(
      dataSourceSelector.dsNameInputField,
      `cypress-${data.dsName1}-postgresql1`
    );
    cy.get(commonSelectors.dashboardIcon).click();
    cy.get(commonSelectors.cancelButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      dataSourceText.toastDSSaved
    );

    cy.get(
      `[data-cy="cypress-${data.dsName1}-postgresql1-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.dsName1}-postgresql1`);

    deleteDatasource(`cypress-${data.dsName1}-postgresql1`);
  });

  it("Should verify the Datasource connection and query creation using global data source", () => {
    data.dsName1 = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.dsName2 = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

    data.appName = `${fake.companyName}-App`;

    selectAndAddDataSource(
      "databases",
      dataSourceText.postgreSQL,
      data.dsName1
    );

    cy.intercept("GET", "/api/v2/data_sources").as("datasource");
    fillConnectionForm(
      {
        Host: Cypress.env("pg_host"),
        Port: "5432",
        "Database name": Cypress.env("pg_user"),
        Username: Cypress.env("pg_user"),
        Password: Cypress.env("pg_password"),
      },
      ".form-switch"
    );
    cy.wait("@datasource");

    cy.apiCreateApp(data.appName);
    cy.openApp();
    pinInspector();

    addQuery(
      "table_preview",
      `SELECT * FROM persons;`,
      `cypress-${data.dsName1}-postgresql`
    );

    cy.get('[data-cy="list-query-table_preview"]').verifyVisibleElement(
      "have.text",
      "table_preview "
    );

    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(dataSourceSelector.queryCreateAndRunButton).click();
    verifyValueOnInspector("table_preview", "7 items ");
    cy.get('[data-cy="show-ds-popover-button"]').click();

    cy.get(".p-2 > .tj-base-btn")
      .should("be.visible")
      .and("have.text", "+ Add new Data source");
    cy.get(".p-2 > .tj-base-btn").click();
    cy.get('[data-cy="databases-datasource-button"]').should("be.visible");

    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/v2/data_sources`,
      `cypress-${data.dsName2}-postgresql`,
      "postgresql",
      [
        { key: "connection_type", value: "manual", encrypted: false },
        { key: "host", value: Cypress.env("pg_host") },
        { key: "port", value: 5432 },
        { key: "database", value: "pg_ds" },
        { key: "username", value: Cypress.env("pg_user") },
        { key: "password", value: Cypress.env("pg_password"), encrypted: true },
        { key: "ssl_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
      ]
    );

    //scope changing
    cy.openApp();
    cy.get(
      ".w-100 > .react-select__control > .react-select__value-container > .react-select__single-value"
    ).click();
    cy.get("#react-select-4-listbox")
      .contains(`cypress-${data.dsName2}-postgresql`)
      .click();
    cy.waitForAutoSave();
    cy.get(dataSourceSelector.queryCreateAndRunButton).click();
    verifyValueOnInspector("table_preview", "4 items ");
  });

  it.skip("Should verify the query creation and scope changing functionality.", () => {
    data.appName = `${fake.companyName}-App`;

    navigateToManageUsers();
    inviteUserBasedOnRole(data.firstName, data.email, "Builder");

    cy.apiCreateApp(data.appName);
    cy.openApp();

    addQuery(
      "table_preview",
      `SELECT * FROM persons;`,
      `cypress-${data.dsName1}-postgresql`
    );

    cy.get('[data-cy="list-query-table_preview"]').verifyVisibleElement(
      "have.text",
      "table_preview "
    );

    pinInspector();

    cy.get(dataSourceSelector.queryCreateAndRunButton).click();
    verifyValueOnInspector("table_preview", "7 items ");

    //scope changing is pending
  });
});
