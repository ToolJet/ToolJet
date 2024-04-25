import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersText } from "Texts/manageUsers";
import * as common from "Support/utils/common";
import { dashboardText, emptyDashboardText } from "Texts/dashboard";
import { groupsSelector } from "Selectors/manageGroups";
import * as permissions from "Support/utils/userPermissions";
import { commonText } from "Texts/common";
import { workspaceVarSelectors } from "Selectors/workspaceVariable";
import { workspaceVarText } from "Texts/workspacevarText";

const data = {};

describe("User permissions", () => {
  beforeEach(() => {
    cy.defaultWorkspaceLogin();
    cy.removeAssignedApps();
    permissions.reset();
    cy.skipWalkthrough();
  });
  it("Should verify the Create and Delete app permission", () => {
    data.appName = `${fake.companyName}-App`;

    cy.logoutApi();
    cy.apiLogin("test@tooljet.com", usersText.password);
    cy.visit("/my-workspace");
    cy.get(commonSelectors.dashboardAppCreateButton).should("be.disabled");
    cy.logoutApi();

    cy.apiLogin();
    cy.apiCreateApp(data.appName);
    cy.visit("/my-workspace");
    cy.wait(500);

    common.navigateToManageGroups();
    cy.get(groupsSelector.appsLink).click();
    cy.get(groupsSelector.appSearchBox).click();
    cy.get(groupsSelector.searchBoxOptions).contains(data.appName).click();
    cy.get(groupsSelector.selectAddButton).click();
    cy.get("table").contains("td", data.appName);
    cy.contains("td", data.appName)
      .parent()
      .within(() => {
        cy.get("td input").first().should("be.checked");
      });
    cy.wait(1000);
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.appsCreateCheck).check();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.appsDeleteCheck).check();

    cy.logoutApi();
    cy.apiLogin("test@tooljet.com", usersText.password);
    cy.visit("/my-workspace");
    cy.get(commonSelectors.appCreateButton).should("exist");
    common.viewAppCardOptions(data.appName);
    cy.contains("Delete app").should("exist");

    common.logout();
    cy.defaultWorkspaceLogin();
    common.navigateToManageGroups();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.appsDeleteCheck).uncheck();

    cy.logoutApi();
    cy.apiLogin("test@tooljet.com", usersText.password);
    cy.visit("/my-workspace");
    cy.wait(1000);
    common.viewAppCardOptions(data.appName);
    cy.contains("Delete app").should("not.exist");

    data.appName = `${fake.companyName}-App`;
    cy.createApp(data.appName);

    cy.dragAndDropWidget("Table", 50, 50);
    cy.backToApps();
    common.viewAppCardOptions(data.appName);
    cy.contains("Delete app").should("exist");
    cy.get(commonSelectors.appCardOptions(commonText.deleteAppOption)).click();
    cy.get(commonSelectors.buttonSelector("Yes")).click();

    common.logout();
    cy.defaultWorkspaceLogin();
    common.navigateToManageGroups();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.appsCreateCheck).uncheck();

    cy.logoutApi();
    cy.apiLogin("test@tooljet.com", usersText.password);
    cy.visit("/my-workspace");
    cy.wait(1000);
    cy.contains("Create new application").should("not.exist");
  });

  it("Should verify the View and Edit permission", () => {
    data.appName = `${fake.companyName}-App`;

    cy.apiCreateApp(data.appName);
    cy.reload();
    common.navigateToManageGroups();
    cy.wait(1000);
    cy.get(groupsSelector.appsLink).click();
    cy.get(groupsSelector.appSearchBox).click();
    cy.get(groupsSelector.searchBoxOptions).contains(data.appName).click();
    cy.get(groupsSelector.selectAddButton).click();
    cy.get("table").contains("td", data.appName);
    cy.contains("td", data.appName)
      .parent()
      .within(() => {
        cy.get("td input").first().should("be.checked");
      });

    cy.logoutApi();
    cy.apiLogin("test@tooljet.com", usersText.password);
    cy.visit("/my-workspace");
    cy.wait(500);
    cy.contains(data.appName).should("exist");
    cy.get(commonSelectors.appCard(data.appName)).should(
      "contain.text",
      data.appName
    );
    cy.contains("div", data.appName)
      .parent()
      .within(() => {
        cy.get(commonSelectors.appTitle(data.appName)).trigger("mouseover");
        cy.get(commonSelectors.launchButton).should(
          "have.class",
          "tj-disabled-btn"
        );
      });
    common.logout();

    cy.defaultWorkspaceLogin();
    common.navigateToManageGroups();
    cy.get(groupsSelector.appsLink).click();
    cy.wait(500);
    cy.contains("tr", data.appName)
      .parent()
      .within(() => {
        cy.get("td input").eq(1).check();
      });
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "App permissions updated"
    );

    cy.logoutApi();
    cy.apiLogin("test@tooljet.com", usersText.password);
    cy.visit("/my-workspace");
    cy.wait(500);
    cy.get(commonSelectors.appCard(data.appName)).should(
      "contain.text",
      data.appName
    );
    cy.contains("div", data.appName)
      .parent()
      .within(() => {
        cy.get(commonSelectors.appTitle(data.appName)).trigger("mouseover");
      });
    cy.get(commonSelectors.launchButton).should(
      "have.class",
      "tj-disabled-btn"
    );
    cy.get(commonSelectors.editButton).should("exist").and("be.enabled");
  });

  it("Should verify Create/Update/Delete folder permission", () => {
    data.folderName = `${fake.companyName.toLowerCase()}-folder`;

    common.navigateToManageGroups();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.foldersCreateCheck).check();

    cy.logoutApi();
    cy.apiLogin("test@tooljet.com", usersText.password);
    cy.visit("/my-workspace");
    cy.wait(500);

    cy.get(commonSelectors.createNewFolderButton).click();
    cy.clearAndType(commonSelectors.folderNameInput, data.folderName);
    cy.get(commonSelectors.createFolderButton).click();
    cy.contains(data.folderName).should("exist");

    cy.contains("div", data.folderName)
      .parent()
      .within(() => {
        cy.get(commonSelectors.folderCardOptions(data.folderName)).invoke(
          "click"
        );
      });
    cy.get(commonSelectors.deleteFolderOption(data.folderName)).click();
    cy.get(commonSelectors.buttonSelector("Yes")).click();
    common.logout();

    cy.defaultWorkspaceLogin();
    common.navigateToManageGroups();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.foldersCreateCheck).uncheck();

    common.logout();
    cy.apiLogin("test@tooljet.com", usersText.password);
    cy.visit("/my-workspace");
    cy.get(commonSelectors.createNewFolderButton).should("not.exist");
  });

  it("Should verify Create/Update/Delete workspace variable permission", () => {
    common.navigateToWorkspaceVariable();
    cy.get('[data-cy="alert-info-text"]>>.text-muted').verifyVisibleElement(
      "have.text", "Can't add or edit workspace variables as we are deprecating them soon. Please use Workspace constant instead."
    );
    cy.get(
      '[data-cy="go-to-workspace-constants-option-button"]'
    ).verifyVisibleElement("have.text", "Go to workspace constants");
    cy.logoutApi();
  });
});
