import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import {
  fillDataSourceTextField,
  selectAndAddDataSource,
  fillConnectionForm,
} from "Support/utils/postgreSql";
import { commonText } from "Texts/common";
import {
  closeDSModal,
  deleteDatasource,
  addQuery,
  addQueryN,
  verifyValueOnInspector,
  resizeQueryPanel,
} from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";
import { dataSourceText } from "Texts/dataSource";
import { addNewUserMW } from "Support/utils/userPermissions";
import { groupsSelector } from "Selectors/manageGroups";
import { eeGroupsSelector } from "Selectors/eeCommon";
import {
  logout,
  navigateToAppEditor,
  navigateToManageGroups,
  pinInspector,
  createGroup,
} from "Support/utils/common";

import { AddDataSourceToGroup } from "Support/utils/eeCommon";
import { addAppToGroup, addUserToGroup } from "Support/utils/manageGroups";

const data = {};
data.userName1 = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.userEmail1 = fake.email.toLowerCase();
data.userName2 = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.userEmail2 = fake.email.toLowerCase();
data.ds1 = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.ds2 = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.appName = `${fake.companyName}-App`;

describe("Global Datasource Manager", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.viewport(1200, 1300);
  });

  before(() => {
    cy.appUILogin();
    cy.createApp();
    cy.renameApp(data.appName);
    cy.dragAndDropWidget("Button", 50, 50);
    cy.get(commonSelectors.editorPageLogo).click();
    cy.reloadAppForTheElement(data.appName);
    addNewUserMW(data.userName1, data.userEmail1);
    logout();
    cy.appUILogin();
    navigateToManageGroups();
    createGroup(data.userName1);
    cy.wait(1000);
    addUserToGroup(data.userName1, data.userEmail1);
    addAppToGroup(data.appName);
    addNewUserMW(data.userName2, data.userEmail2);
    logout();
    cy.appUILogin();
    navigateToManageGroups();
    createGroup(data.userName2);
    cy.wait(1000);
    addAppToGroup(data.appName);
    addUserToGroup(data.userName2, data.userEmail2);
    logout();
  });

  it("Connect Data source and assign to user groups", () => {
    selectAndAddDataSource("databases", dataSourceText.postgreSQL, data.ds1);

    fillConnectionForm(
      {
        Host: Cypress.env("pg_host"),
        Port: "5432",
        "Database Name": Cypress.env("pg_user"),
        Username: Cypress.env("pg_user"),
        Password: Cypress.env("pg_password"),
      },
      ".form-switch"
    );

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(
      `[data-cy="cypress-${data.ds1}-postgresql-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.ds1}-postgresql`);

    selectAndAddDataSource("apis", "rest api", data.ds2);

    cy.clearAndType(
      '[data-cy="base-url-text-field"]',
      "https://reqres.in/api/users?page=2"
    );
    cy.wait(100);
    cy.get(dataSourceSelector.buttonSave).click();
    cy.wait(500);
    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(
      `[data-cy="cypress-${data.ds2}-rest-api-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.ds2}-rest-api`);

    cy.get('[data-cy="icon-dashboard"]').click();
    navigateToAppEditor(data.appName);
    resizeQueryPanel();
    addQuery(
      "table_preview",
      `SELECT * FROM Persons;`,
      `cypress-${data.ds1}-postgresql`
    );
    cy.wait(500);
    cy.intercept("POST", "/api/data_queries/**").as("run");
    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get(".css-1rrkggf-Input").type(data.ds2);
    cy.contains(`[id*="react-select-"]`, data.ds2).click();
    cy.get(dataSourceSelector.queryCreateAndRunButton).click();
    cy.wait("@run");
    cy.get(commonSelectors.editorPageLogo).click();

    AddDataSourceToGroup(data.userName1, `cypress-${data.ds1}-postgresql`);
    AddDataSourceToGroup(data.userName2, `cypress-${data.ds2}-rest-api`);
  });
  it("verify the first user permissions on assigned and unassigned datasource", () => {
    logout();
    cy.login(data.userEmail1, "password");

    navigateToAppEditor(data.appName);

    cy.get('[data-cy="list-query-restapi1"]')
      .verifyVisibleElement("have.text", "restapi1 ")
      .click();
    cy.get(".query-details").should("have.class", "disabled");

    cy.get(".query-row-query-name")
      .contains("restapi1 ")
      .parent()
      .within(() => {
        cy.get(".query-rename-delete-btn").should("not.exist");
      });

    cy.get('[data-cy="list-query-table_preview"]').verifyVisibleElement(
      "have.text",
      "table_preview "
    );

    pinInspector();
    cy.hideTooltip();

    resizeQueryPanel("80");
    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.wait(2000);
    addQueryN(
      "user_query",
      `SELECT * FROM Persons;`,
      `cypress-${data.ds1}-postgresql`
    );

    cy.get('[data-cy="list-query-user_query"]').verifyVisibleElement(
      "have.text",
      "user_query "
    );

    cy.get('[data-cy="list-query-user_query"]').click();
    cy.get(dataSourceSelector.queryCreateAndRunButton).click();
    verifyValueOnInspector("user_query", "7 items ");

    cy.get('[data-cy="list-query-table_preview"]').click();
    cy.get(dataSourceSelector.queryCreateAndRunButton).click();
    verifyValueOnInspector("table_preview", "7 entries ");

    cy.get('[data-cy="list-query-restapi1"]').click();
    cy.get(dataSourceSelector.queryCreateAndRunButton).click();
    verifyValueOnInspector("restapi1", "6 entries ");

    cy.intercept("POST", "/api/data_queries/**").as("run");
    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get(".css-1rrkggf-Input").type(data.ds2);
    cy.contains(`[id*="react-select-"]`, data.ds2).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "You do not have permissions to perform this action"
    );
  });
  it("verify the second user permissions on assigned ansd unassigned datasource", () => {
    logout();
    cy.login(data.userEmail2, "password");

    navigateToAppEditor(data.appName);
    cy.get('[data-cy="list-query-restapi1"]').verifyVisibleElement(
      "have.text",
      "restapi1 "
    );
    cy.get('[data-cy="list-query-table_preview"]')
      .verifyVisibleElement("have.text", "table_preview ")
      .click();
    cy.get(".query-details").should("have.class", "disabled");

    cy.get(".query-row-query-name")
      .contains("table_preview ")
      .parent()
      .within(() => {
        cy.get(".query-rename-delete-btn").should("not.exist");
      });

    pinInspector();
    cy.hideTooltip();

    cy.intercept("POST", "/api/data_queries/**").as("run");
    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get(".css-1rrkggf-Input").type(data.ds2);
    cy.contains(`[id*="react-select-"]`, data.ds2).click();
    cy.get(dataSourceSelector.queryCreateAndRunButton).click();
    cy.wait("@run");
    verifyValueOnInspector("restapi2", "6 entries ");

    cy.get('[data-cy="list-query-table_preview"]').click();
    cy.get(dataSourceSelector.queryCreateAndRunButton).click();
    verifyValueOnInspector("table_preview", "7 items ");

    cy.get('[data-cy="list-query-restapi1"]').click();
    cy.get(dataSourceSelector.queryCreateAndRunButton).click();
    verifyValueOnInspector("restapi1", "6 entries ");

    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get(".css-1rrkggf-Input").type(data.ds1);
    cy.contains(`[id*="react-select-"]`, data.ds1).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "You do not have permissions to perform this action"
    );
  });
});
