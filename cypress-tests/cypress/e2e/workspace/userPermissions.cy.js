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
data.firstName = fake.firstName;
data.lastName = fake.lastName.replaceAll("[^A-Za-z]", "");
data.email = fake.email.toLowerCase();
data.appName = `${fake.companyName}-App`;
data.folderName = `${fake.companyName.toLowerCase()}-folder`;

describe("User permissions", () => {
  before(() => {
    cy.intercept("GET", "/api/apps?page=1&folder=&searchKey=").as("homePage");
    cy.appUILogin();
    permissions.reset();
    cy.get(commonSelectors.homePageLogo).click();
    cy.wait("@homePage");
    cy.createApp();
    cy.renameApp(data.appName);
    cy.dragAndDropWidget("Table", 250, 250);
    cy.get(commonSelectors.editorPageLogo).click();
    cy.reloadAppForTheElement(data.appName);
    permissions.addNewUserMW(data.firstName, data.email);
    common.logout();
  });
  beforeEach(() => {
    cy.appUILogin();
    cy.visitTheWorkspace("My workspace");
  });

  it("Should verify the create new app permission", () => {
    common.logout();
    cy.login(data.email, usersText.password);
    cy.get("body").then(($title) => {
      if ($title.text().includes(dashboardText.emptyPageDescription)) {
        cy.get(commonSelectors.dashboardAppCreateButton).click();
        cy.verifyToastMessage(
          commonSelectors.toastMessage,
          usersText.createAppPermissionToast
        );
      } else {
        cy.contains(dashboardText.createAppButton).should("not.exist");
      }
    });
    common.logout();
  });

  it("Should verify the View and Edit permission", () => {
    common.navigateToManageGroups();
    cy.get(groupsSelector.appSearchBox).click();
    cy.get(groupsSelector.searchBoxOptions).contains(data.appName).click();
    cy.get(groupsSelector.selectAddButton).click();
    cy.get("table").contains("td", data.appName);
    cy.contains("td", data.appName)
      .parent()
      .within(() => {
        cy.get("td input").first().should("be.checked");
      });

    common.logout();
    cy.login(data.email, usersText.password);
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

    permissions.adminLogin();
    cy.contains("tr", data.appName)
      .parent()
      .within(() => {
        cy.get("td input").eq(1).check();
      });
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "App permissions updated"
    );

    common.logout();
    cy.login(data.email, usersText.password);
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

    cy.get(commonSelectors.workspaceName).click();
    cy.contains(`${data.email}`).click();
    cy.contains(data.appName).should("not.exist");

    cy.get(commonSelectors.workspaceName).click();
    cy.contains("My workspace").should("be.visible").click();
    cy.wait(200);
  });

  it("Should verify the Create and Delete app permission", () => {
    common.navigateToManageGroups();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.appsCreateCheck).check();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.appsDeleteCheck).check();

    common.logout();
    cy.login(data.email, usersText.password);
    cy.get(commonSelectors.appCreateButton).should("exist");
    common.viewAppCardOptions(data.appName);
    cy.contains("Delete app").should("exist");

    permissions.adminLogin();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.appsDeleteCheck).uncheck();

    common.logout();
    cy.login(data.email, usersText.password);
    common.viewAppCardOptions(data.appName);
    cy.contains("Delete app").should("not.exist");

    cy.createApp();
    cy.renameApp(data.email);
    cy.dragAndDropWidget("Table", 50, 50);
    cy.get(commonSelectors.editorPageLogo).click();
    cy.reloadAppForTheElement(data.email);
    common.viewAppCardOptions(data.email);
    cy.contains("Delete app").should("exist");
    cy.get(commonSelectors.appCardOptions(commonText.deleteAppOption)).click();
    cy.get(commonSelectors.buttonSelector("Yes")).click();

    permissions.adminLogin();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.appsCreateCheck).uncheck();

    common.logout();
    cy.login(data.email, usersText.password);
    cy.contains("Create new application").should("not.exist");
  });

  it("Should verify Create/Update/Delete folder permission", () => {
    common.navigateToManageGroups();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.foldersCreateCheck).check();

    common.logout();
    cy.login(data.email, usersText.password);

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

    permissions.adminLogin();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.foldersCreateCheck).uncheck();

    common.logout();
    cy.login(data.email, usersText.password);

    permissions.adminLogin();
    cy.contains("td", data.appName)
      .parent()
      .within(() => {
        cy.get("td a").contains("Remove").click();
      });

    common.logout();
    cy.login(data.email, usersText.password);
    cy.contains(data.appName).should("not.exist");

    common.logout();
    cy.appUILogin();
    cy.deleteApp(data.appName);
  });

  it("Should verify Create/Update/Delete workspace variable permission", () => {
    common.navigateToWorkspaceVariable();
    cy.get('[data-cy="alert-info-text"]>>.text-muted').verifyVisibleElement(
      "have.text",
      "There are no Workspace variables. Workspace variables are being deprecated soon, so please use Workspace constants instead."
    );
    cy.get(
      '[data-cy="go-to-workspace-constants-option-button"]'
    ).verifyVisibleElement("have.text", "Go to workspace constants");
    common.logout();

    cy.login(data.email, usersText.password);
    common.navigateToWorkspaceVariable();
    cy.get('[data-cy="alert-info-text"]>>.text-muted').verifyVisibleElement(
      "have.text",
      "There are no Workspace variables. Workspace variables are being deprecated soon, so please use Workspace constants instead."
    );
    cy.get(
      '[data-cy="go-to-workspace-constants-option-button"]'
    ).verifyVisibleElement("have.text", "Go to workspace constants");
  });
});
