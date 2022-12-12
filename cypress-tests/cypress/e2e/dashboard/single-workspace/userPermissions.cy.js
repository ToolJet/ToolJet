import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersText } from "Texts/manageUsers";
import * as common from "Support/utils/common";
import { dashboardText } from "Texts/dashboard";
import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import * as permissions from "Support/utils/userPermissions";
import { usersSelector } from "Selectors/manageUsers";
import { commonText } from "Texts/common";

const data = {};
data.firstName = fake.firstName;
data.lastName = fake.lastName.replaceAll("[^A-Za-z]", "");
data.email = fake.email.toLowerCase();
data.appName = `${fake.companyName} App`;
data.folderName = `${fake.companyName} Folder`;
data.companyName = fake.companyName;

describe("User permissions", () => {
  before(() => {
    cy.appUILogin();
    permissions.reset();
  });

  it("Should verify the create new app permission", () => {
    permissions.addNewUserSW(
      data.firstName,
      data.lastName,
      data.email,
      data.companyName
    );

    cy.get("body").then(($title) => {
      if ($title.text().includes(dashboardText.emptyPageDescription)) {
        cy.get(commonSelectors.emptyAppCreateButton).click();
        cy.verifyToastMessage(
          commonSelectors.toastMessage,
          usersText.createAppPermissionToast
        );
      } else {
        cy.contains(dashboardText.createAppButton).should("not.exist");
        cy.log("The app is created by the admin");
      }
    });
    common.logout();
  });

  it("Should verify the View and Edit permission", () => {
    cy.appUILogin();
    common.navigateToManageUsers();
    common.searchUser(data.email);
    cy.contains("td", data.email)
      .parent()
      .within(() => {
        cy.get("td small").should("have.text", usersText.activeStatus);
      });
    
    cy.intercept('GET', '/api/apps?page=1&folder=&searchKey=').as('homePage');
    cy.get(commonSelectors.homePageLogo).click();
    cy.wait('@homePage');
    cy.createApp();
    cy.renameApp(data.appName);
    cy.get(commonSelectors.backButton).click();
    common.navigateToManageGroups();
    cy.get(groupsSelector.groupName).contains(groupsText.allUsers).click();
    cy.get(groupsSelector.appSearchBox).click();
    cy.get(groupsSelector.searchBoxOptions).contains(data.appName).click();
    cy.get(groupsSelector.addButton).click();
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
      });
    cy.get(commonSelectors.launchButton).should("exist").and("be.disabled");

    permissions.adminLogin();
    cy.contains("tr", data.appName)
      .parent()
      .within(() => {
        cy.get("td input").eq(1).check();
      });

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
    cy.get(commonSelectors.launchButton).should("exist").and("be.disabled");
    cy.get(commonSelectors.editButton).should("exist").and("be.enabled");
  });

  it("Should verify the Create and Delete app permission", () => {
    permissions.adminLogin();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.appsCreateCheck).check();
    cy.get(groupsSelector.appsDeleteCheck).check();

    common.logout();
    cy.login(data.email, usersText.password);
    cy.get(commonSelectors.appCreateButton).should("exist");
    cy.get(commonSelectors.appCardOptionsButton).first().click();
    cy.contains("Delete app").should("exist");

    permissions.adminLogin();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.appsDeleteCheck).uncheck();

    common.logout();
    cy.login(data.email, usersText.password);
    cy.get(commonSelectors.appCardOptionsButton).first().click();
    cy.contains("Delete app").should("not.exist");

    cy.createApp();
    cy.renameApp(data.appName);
    cy.get(commonSelectors.backButton).click();
    cy.get(commonSelectors.appCardOptionsButton).first().click();
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
    permissions.adminLogin();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.foldersCreateCheck).check();

    common.logout();
    cy.login(data.email, usersText.password);

    cy.contains("+ Create new folder").should("exist");

    cy.get(commonSelectors.createNewFolderButton).click();
    cy.clearAndType(commonSelectors.folderNameInput, data.folderName);
    cy.get(commonSelectors.createFolderButton).click();
    cy.contains(data.folderName).should("exist");

    cy.get(commonSelectors.folderCardOptions).click();
    cy.get(commonSelectors.deleteFolderOption).click();
    cy.get(commonSelectors.buttonSelector("Yes")).click();

    permissions.adminLogin();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.foldersCreateCheck).uncheck();

    common.logout();
    cy.login(data.email, usersText.password);
    cy.contains("+ Create new folder").should("not.exist");

    permissions.adminLogin();
    cy.contains("td", data.appName)
      .parent()
      .within(() => {
        cy.get("td a").contains("Delete").click();
      });

    common.logout();
    cy.login(data.email, usersText.password);
    cy.contains(data.appName).should("not.exist");

    common.logout();
    cy.appUILogin();
    cy.deleteApp(data.appName);
  });
});
