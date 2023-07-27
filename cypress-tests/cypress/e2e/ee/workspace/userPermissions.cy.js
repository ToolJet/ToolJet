import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersText } from "Texts/manageUsers";
import * as common from "Support/utils/common";
import { groupsSelector } from "Selectors/manageGroups";
import { commonText } from "Texts/common";
import { adminLogin, addNewUserMW } from "Support/utils/userPermissions";
import { resetDsPermissions, deleteAssignedDatasources } from "Support/utils/eeCommon";
import { eeGroupsSelector } from "Selectors/eeCommon";
import { selectDataSource } from "Support/utils/postgreSql";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { deleteDatasource } from "Support/utils/dataSource";

const data = {};
data.firstName = fake.firstName;
data.email = fake.email.toLowerCase();
data.appName = `${fake.companyName} App`;
data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("User permissions", () => {
  beforeEach(() => {
    cy.appUILogin();
    resetDsPermissions();
    deleteAssignedDatasources();
  });
  before(() => {
    cy.appUILogin();
    addNewUserMW(data.firstName, data.email);
    common.logout();
  })

  it("Should verify the Create and Delete DS permission", () => {
    common.logout();
    cy.login(data.email, usersText.password);
    cy.get(commonSelectors.globalDataSourceIcon).should("not.exist");

    adminLogin();
    cy.get(groupsSelector.permissionsLink).click();
    cy.wait(1000)
    cy.get(eeGroupsSelector.dsCreateCheck).check();
    common.logout();

    cy.login(data.email, usersText.password);
    cy.get(commonSelectors.globalDataSourceIcon).should("exist");

    selectDataSource("bigquery");
    cy.clearAndType(
      '[data-cy="data-source-name-input-filed"]',
      `cypress-${data.lastName}-bigquery`
    );
    cy.get(postgreSqlSelector.buttonSave).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSAdded
    );
    deleteDatasource(`cypress-${data.lastName}-bigquery`);

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "You do not have permissions to perform this action"
    );

    adminLogin();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(eeGroupsSelector.dsDeleteCheck).check();
    common.logout();

    cy.login(data.email, usersText.password);
    cy.get(commonSelectors.globalDataSourceIcon).click();
    deleteDatasource(`cypress-${data.lastName}-bigquery`);
    cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Deleted");

    adminLogin();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(eeGroupsSelector.dsCreateCheck).uncheck();
    common.logout();

    cy.login(data.email, usersText.password);
    cy.get(commonSelectors.globalDataSourceIcon).should("exist");

    selectDataSource("bigquery");
    cy.get(postgreSqlSelector.buttonSave).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "You do not have permissions to perform this action"
    );
    adminLogin();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(eeGroupsSelector.dsDeleteCheck).uncheck();
    common.logout();

    cy.login(data.email, usersText.password);
    cy.get(commonSelectors.globalDataSourceIcon).should("not.exist");
    common.logout();
  });
  it("Should verify the DS View and Edit permission", () => {

    selectDataSource("bigquery");
    cy.clearAndType(
      '[data-cy="data-source-name-input-filed"]',
      `cypress-${data.lastName}-bigquery`
    );
    cy.get(postgreSqlSelector.buttonSave).click();

    common.logout();
    cy.login(data.email, usersText.password);
    cy.get(commonSelectors.globalDataSourceIcon).should("not.exist");

    adminLogin();
    cy.get(eeGroupsSelector.datasourceLink).click();
    cy.wait(500);
    cy.get(
      '[data-cy="datasource-select-search"] >> .rmsc > .dropdown-container > .dropdown-heading > .dropdown-heading-value > .gray'
    ).click();
    cy.contains(`cypress-${data.lastName}-bigquery`).realClick();
    cy.get(eeGroupsSelector.AddDsButton).click();

    common.logout();
    cy.login(data.email, usersText.password);
    cy.get(commonSelectors.globalDataSourceIcon).should("exist").click();
    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(
      `[data-cy="cypress-${data.lastName}-bigquery-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.lastName}-bigquery`);
    cy.get(postgreSqlSelector.buttonSave).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "You do not have permissions to perform this action"
    );

    adminLogin();
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

    common.logout();
    cy.login(data.email, usersText.password);
    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(postgreSqlSelector.buttonSave).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Datasource Saved");

    adminLogin();
    cy.get(eeGroupsSelector.datasourceLink).click();
    cy.get(
      `[data-cy="cypress-${data.lastName}-bigquery-datasource-remove-button-wrap"]`
    )
      .parent()
      .within(() => {
        cy.get('[data-cy="remove-button"]').click();
      });

    common.logout();
    cy.login(data.email, usersText.password);
    cy.get(commonSelectors.globalDataSourceIcon).should("not.exist");
  });
});
