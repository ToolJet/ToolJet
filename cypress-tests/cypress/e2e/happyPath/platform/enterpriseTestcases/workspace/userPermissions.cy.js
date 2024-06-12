import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersText } from "Texts/manageUsers";
import * as common from "Support/utils/common";
import { groupsSelector } from "Selectors/manageGroups";
import { commonText } from "Texts/common";
import { addNewUser } from "Support/utils/onboarding";
import {
  resetDsPermissions,
  deleteAssignedDatasources,
} from "Support/utils/eeCommon";
import { eeGroupsSelector } from "Selectors/eeCommon";
import { selectAndAddDataSource } from "Support/utils/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { deleteDatasource } from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";

const data = {};
data.firstName = fake.firstName;
data.email = fake.email.toLowerCase();
data.appName = `${fake.companyName} App`;
data.dsEdit = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("User permissions", () => {
  beforeEach(() => {
    cy.defaultWorkspaceLogin();
    resetDsPermissions();
    deleteAssignedDatasources();
    cy.viewport(1200, 1300);
  });
  before(() => {
    cy.defaultWorkspaceLogin();
    addNewUser(data.firstName, data.email);
    cy.logoutApi();
  });

  it("Should verify the DS View and Edit permission", () => {
    data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

    cy.apiCreateGDS(
      "http://localhost:3000/api/v2/data_sources",
      `cypress-${data.lastName}-bigquery`,
      "postgresql",
      [
        { key: "host", value: "localhost" },
        { key: "port", value: 5432 },
        { key: "database", value: "" },
        { key: "username", value: "dev@tooljet.io" },
        { key: "password", value: "password", encrypted: true },
        { key: "ssl_enabled", value: true, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
      ]
    );

    cy.logoutApi();
    cy.apiLogin(data.email, usersText.password);
    cy.visit("/my-workspace");
    cy.get(commonSelectors.globalDataSourceIcon).should("not.exist");

    cy.logoutApi();
    cy.defaultWorkspaceLogin();
    common.navigateToManageGroups();
    cy.get(eeGroupsSelector.datasourceLink).click();
    cy.wait(500);
    cy.get('[data-cy="datasource-select-search"]>>>>>>').eq(0).click();
    cy.contains(`cypress-${data.lastName}-bigquery`).realClick();
    cy.get(eeGroupsSelector.AddDsButton).click();

    cy.logoutApi();
    cy.apiLogin(data.email, usersText.password);
    cy.visit("/my-workspace");
    cy.get(commonSelectors.globalDataSourceIcon).should("exist").click();

    cy.get(dataSourceSelector.addedDsSearchIcon).click();
    cy.clearAndType(dataSourceSelector.AddedDsSearchBar, data.lastName);
    cy.get(`[data-cy="cypress-${data.lastName}-bigquery-button"]`).click();
    // cy.get(dataSourceSelector.buttonSave).should("not.exist");

    cy.get(`[data-cy="cypress-${data.lastName}-bigquery-button"]`).click();
    cy.get(dataSourceSelector.buttonSave)
      .should("be.disabled")
      .and("be.visible");
    cy.clearAndType('[data-cy="data-source-name-input-filed"]', data.dsEdit);
    cy.get(dataSourceSelector.buttonSave).should("be.enabled").click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "You do not have permissions to perform this action"
    );

    cy.logoutApi();
    cy.defaultWorkspaceLogin();

    common.navigateToManageGroups();
    cy.get(eeGroupsSelector.datasourceLink).click();
    cy.get(
      `[data-cy="cypress-${data.lastName}-bigquery-datasource-view-edit-wrap"]`
    )
      .parent()
      .within(() => {
        cy.get('[data-cy="edit-radio-button"]').click();
      });
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Datasource permissions updated"
    );

    cy.logoutApi();
    cy.apiLogin(data.email, usersText.password);
    cy.visit("/my-workspace");
    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(dataSourceSelector.addedDsSearchIcon).click();
    cy.clearAndType(dataSourceSelector.AddedDsSearchBar, data.lastName);
    cy.get(`[data-cy="cypress-${data.lastName}-bigquery-button"]`).click();
    cy.get(dataSourceSelector.buttonSave)
      .should("be.disabled")
      .and("be.visible");
    cy.clearAndType('[data-cy="data-source-name-input-filed"]', data.dsEdit);
    cy.get(dataSourceSelector.buttonSave).should("be.enabled").click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Saved");

    cy.logoutApi();
    cy.apiLogin();
    cy.visit("/my-workspace");
    common.navigateToManageGroups();
    cy.get(eeGroupsSelector.datasourceLink).click();
    cy.get(`[data-cy="${data.dsEdit}-datasource"]`)
      .parent()
      .within(() => {
        cy.get('[data-cy="remove-button"]').click();
      });

    cy.logoutApi();
    cy.apiLogin(data.email, usersText.password);
    cy.visit("/my-workspace");
    cy.get(commonSelectors.globalDataSourceIcon).should("not.exist");
  });
  it("Should verify the Create and Delete DS permission", () => {
    data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

    cy.logoutApi();
    cy.apiLogin(data.email, usersText.password);
    cy.visit("/my-workspace");
    cy.get(commonSelectors.globalDataSourceIcon).should("not.exist");

    cy.logoutApi();
    cy.apiLogin();
    cy.visit("/my-workspace");
    common.navigateToManageGroups();
    cy.get(groupsSelector.permissionsLink).click();
    cy.wait(1000);
    cy.get(eeGroupsSelector.dsCreateCheck).check();
    cy.get(groupsSelector.appsCreateCheck).check();
    cy.logoutApi();

    cy.apiLogin(data.email, usersText.password);
    cy.apiCreateGDS(
      "http://localhost:3000/api/v2/data_sources",
      `cypress-${data.lastName}-bigquery`,
      "postgresql",
      [
        { key: "host", value: "localhost" },
        { key: "port", value: 5432 },
        { key: "database", value: "" },
        { key: "username", value: "dev@tooljet.io" },
        { key: "password", value: "password", encrypted: true },
        { key: "ssl_enabled", value: true, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
      ]
    );
    cy.visit("/my-workspace");
    cy.get(commonSelectors.globalDataSourceIcon).should("exist");
    cy.get(dataSourceSelector.deleteDSButton(data.lastName)).should(
      "not.exist"
    );

    // cy.get(commonSelectors.dashboardIcon).click();
    cy.apiCreateApp(data.appName);
    cy.openApp();
    cy.waitForAppLoad();
    cy.dragAndDropWidget("Table", 250, 250);
    cy.get('[data-cy="landing-page-add-new-ds-button"]')
      .should("be.visible")
      .click();

    cy.logoutApi();
    cy.apiLogin();
    cy.visit("/my-workspace");
    common.navigateToManageGroups();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(eeGroupsSelector.dsDeleteCheck).check();
    cy.logoutApi();

    cy.apiLogin(data.email, usersText.password);
    cy.visit("/my-workspace");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    deleteDatasource(`cypress-${data.lastName}-bigquery`);
    cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Deleted");

    cy.logoutApi();
    cy.apiLogin();
    cy.visit("/my-workspace");
    common.navigateToManageGroups();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(eeGroupsSelector.dsCreateCheck).uncheck();
    cy.logoutApi();

    cy.apiLogin(data.email, usersText.password);
    cy.visit("/my-workspace");
    cy.get(commonSelectors.globalDataSourceIcon).should("exist");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.wait(1000);
    cy.get('[data-cy="databases-datasource-button"]').click();
    cy.wait(500);
    cy.clearAndType(dataSourceSelector.dataSourceSearchInputField, "bigquery");
    cy.get('[data-cy="data-source-bigquery"]')
      .parent()
      .within(() => {
        cy.get(
          '[data-cy="data-source-bigquery"]>>>.datasource-card-title'
        ).realHover("mouse");
        cy.get('[data-cy="bigquery-add-button"]').click();
      });

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "You do not have permissions to perform this action"
    );
    cy.logoutApi();
    cy.apiLogin();
    cy.visit("/my-workspace");
    common.navigateToManageGroups();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(eeGroupsSelector.dsDeleteCheck).uncheck();
    cy.logoutApi();

    cy.apiLogin(data.email, usersText.password);
    cy.visit("/my-workspace");
    cy.get(commonSelectors.globalDataSourceIcon).should("not.exist");
    cy.logoutApi();
  });
});
