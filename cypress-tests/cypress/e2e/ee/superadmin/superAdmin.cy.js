import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersText } from "Texts/manageUsers";
import * as common from "Support/utils/common";
import {
  userSignUp,
  resetAllowPersonalWorkspace,
  addNewUser,
} from "Support/utils/eeCommon";
import { addNewUserMW, updateWorkspaceName } from "Support/utils/userPermissions";
import { usersSelector } from "Selectors/manageUsers";
import {
  commonEeSelectors,
  instanceSettingsSelector,
} from "Selectors/eeCommon";
import { commonEeText, instanceSettingsText } from "Texts/eeCommon";
import { ssoSelector } from "Selectors/manageSSO";
import { ssoText } from "Texts/manageSSO";


let invitationToken,
  organizationId,
  url = "";
const data = {};
data.firstName = fake.firstName;
data.email = fake.email.toLowerCase();
data.appName = `${fake.companyName} App`;
data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.workspaceName = `${fake.companyName}-workspace`;

describe("dashboard", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.intercept("GET", "/api/folders?searchKey=&type=front-end").as("homePage");
    resetAllowPersonalWorkspace();
  });
  it("Verify elements of the instance settings page", () => {
    cy.get(commonEeSelectors.instanceSettingIcon).click();
    cy.get(instanceSettingsSelector.allUsersTab).realClick();
    cy.get(commonEeSelectors.pageTitle).verifyVisibleElement(
      "have.text",
      instanceSettingsText.pageTitle
    );
    cy.get(instanceSettingsSelector.allUsersTab).verifyVisibleElement(
      "have.text",
      instanceSettingsText.allUsersTab
    );
    cy.get(
      instanceSettingsSelector.manageInstanceSettings
    ).verifyVisibleElement(
      "have.text",
      instanceSettingsText.manageInstanceSettings
    );

    cy.get(commonSelectors.breadcrumbTitle).should(($el) => {
      expect($el.contents().first().text().trim()).to.eq(
        instanceSettingsText.pageTitle
      );
    });
    cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
      "have.text",
      " All users"
    );
    cy.get(usersSelector.usersPageTitle).should(($el) => {
      expect($el.contents().last().text().trim()).to.eq(
        "Manage All Users"
      );
    });

    for (const element in usersSelector.usersElements) {
      cy.get(usersSelector.usersElements[element]).verifyVisibleElement(
        "have.text",
        usersText.usersElements[element]
      );
    }
    cy.get(usersSelector.userFilterInput).should("be.visible");
    cy.get(instanceSettingsSelector.typeColumnHeader).verifyVisibleElement(
      "have.text",
      instanceSettingsText.typeColumnHeader
    );
    cy.get(instanceSettingsSelector.workspaceColumnHeader).verifyVisibleElement(
      "have.text",
      instanceSettingsText.workspaceColumnHeader
    );

    cy.get(commonSelectors.avatarImage).should("be.visible");

    cy.get(
      instanceSettingsSelector.userName("The developer")
    ).verifyVisibleElement("have.text", usersText.adminUserName);
    cy.get(
      instanceSettingsSelector.userEmail("The developer")
    ).verifyVisibleElement("have.text", usersText.adminUserEmail);
    cy.get(
      instanceSettingsSelector.userType("The developer")
    ).verifyVisibleElement("have.text", instanceSettingsText.superAdminType);
    cy.get(
      instanceSettingsSelector.userStatus("The developer")
    ).verifyVisibleElement("have.text", usersText.activeStatus);
    cy.get(instanceSettingsSelector.viewButton("The developer")).should(
      ($el) => {
        expect($el.contents().first().text().trim()).to.eq("View (");
      }
    );

    cy.get(
      instanceSettingsSelector.editButton("The developer")
    ).verifyVisibleElement("have.text", "Edit");

    cy.get(instanceSettingsSelector.viewButton("The developer")).click();
    cy.get(commonEeSelectors.modalTitle).verifyVisibleElement(
      "have.text",
      instanceSettingsText.viewModalTitle
    );
    cy.get(commonEeSelectors.modalCloseButton).should("be.visible");

    cy.get(
      instanceSettingsSelector.viewModalNoColumnHeader
    ).verifyVisibleElement("have.text", "NO");
    cy.get(
      instanceSettingsSelector.viewModalNameColumnHeader
    ).verifyVisibleElement("have.text", "Name");
    cy.get(
      instanceSettingsSelector.viewModalStatusColumnHeader
    ).verifyVisibleElement("have.text", "Status");
    cy.get(instanceSettingsSelector.archiveAllButton).verifyVisibleElement(
      "have.text",
      instanceSettingsText.archiveAllButton
    );
    cy.get(instanceSettingsSelector.viewModalRow(commonEeText.defaultWorkspace))
      .eq(0)
      .verifyVisibleElement("have.text", "1");

    cy.get(
      instanceSettingsSelector.workspaceName(commonEeText.defaultWorkspace)
    ).verifyVisibleElement("have.text", commonEeText.defaultWorkspace);
    cy.get(instanceSettingsSelector.viewModalRow(commonEeText.defaultWorkspace))
      .parent()
      .within(() => {
        cy.get("td small").verifyVisibleElement(
          "have.text",
          usersText.activeStatus
        );
        cy.get(
          instanceSettingsSelector.userStatusChangeButton
        ).verifyVisibleElement("have.text", instanceSettingsText.archiveState);
      });

    cy.get(commonEeSelectors.modalCloseButton).click();
    cy.get(instanceSettingsSelector.editButton("The developer")).click();

    cy.get(commonEeSelectors.modalTitle).verifyVisibleElement(
      "have.text",
      instanceSettingsText.editModalTitle
    );

    cy.get(instanceSettingsSelector.superAdminToggleLabel).verifyVisibleElement(
      "have.text",
      instanceSettingsText.superAdminToggleLabel
    );
    cy.get(instanceSettingsSelector.superAdminToggle).should("be.visible");
    cy.get(commonSelectors.cancelButton).verifyVisibleElement(
      "have.text",
      commonEeText.closeButton
    );
    cy.get(commonEeSelectors.saveButton).verifyVisibleElement(
      "have.text",
      instanceSettingsText.saveButton
    );
    cy.get(commonEeSelectors.modalCloseButton).should("be.visible").click();

    cy.get(instanceSettingsSelector.manageInstanceSettings).click();

    cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
      "have.text",
      " Manage instance settings"
    );

    cy.get(commonEeSelectors.cardTitle).verifyVisibleElement(
      "have.text",
      "Instance Settings"
    );
    cy.get(instanceSettingsSelector.allowWorkspaceToggle).should("be.visible");
    cy.get(
      instanceSettingsSelector.allowWorkspaceToggleLabel
    ).verifyVisibleElement(
      "have.text",
      instanceSettingsText.allowWorkspaceToggleLabel
    );
    cy.get(
      instanceSettingsSelector.allowWorkspaceHelperText
    ).verifyVisibleElement(
      "have.text",
      instanceSettingsText.allowWorkspaceHelperText
    );

    cy.get(commonSelectors.cancelButton).verifyVisibleElement(
      "have.text",
      commonEeText.cancelButton
    );
    cy.get(commonEeSelectors.saveButton).verifyVisibleElement(
      "have.text",
      instanceSettingsText.saveButton
    );
  });

  it("Verify invite user, Archive, Archive All functionality", () => {
    addNewUserMW(data.firstName, data.email);
    common.logout();

    cy.appUILogin();
    cy.wait(2000)
    cy.get(commonEeSelectors.instanceSettingIcon).click();
    cy.clearAndType(commonSelectors.inputUserSearch, data.email);
    cy.get(
      instanceSettingsSelector.userName(data.firstName)
    ).verifyVisibleElement("have.text", data.firstName);
    cy.get(
      instanceSettingsSelector.userEmail(data.firstName)
    ).verifyVisibleElement("have.text", data.email);
    cy.get(
      instanceSettingsSelector.userType(data.firstName)
    ).verifyVisibleElement("have.text", "workspace");
    cy.get(
      instanceSettingsSelector.userStatus(data.firstName)
    ).verifyVisibleElement("have.text", usersText.activeStatus);

    cy.get(instanceSettingsSelector.viewButton(data.firstName)).click();

    cy.get(
      instanceSettingsSelector.workspaceName(commonEeText.defaultWorkspace)
    ).verifyVisibleElement("have.text", commonEeText.defaultWorkspace);
    cy.get(instanceSettingsSelector.viewModalRow(commonEeText.defaultWorkspace))
      .parent()
      .within(() => {
        cy.get("td small").verifyVisibleElement(
          "have.text",
          usersText.activeStatus
        );
      });
    cy.get(commonEeSelectors.modalCloseButton).click();

    common.logout();
    cy.login(data.email, usersText.password);
    cy.get(commonEeSelectors.instanceSettingIcon).should("not.exist");
    cy.contains("My workspace").click();
    cy.wait(500);
    cy.contains(data.email).click();
    cy.wait("@homePage");
    cy.get(commonEeSelectors.instanceSettingIcon).should("not.exist");
    cy.contains(data.email).click();
    cy.wait("@homePage");

    common.logout();
    cy.appUILogin();
    cy.wait(2000)
    cy.get(commonEeSelectors.instanceSettingIcon).click();
    cy.clearAndType(commonSelectors.inputUserSearch, data.email);
    cy.get(instanceSettingsSelector.viewButton(data.firstName)).click();

    cy.get(instanceSettingsSelector.viewModalRow(commonEeText.defaultWorkspace))
      .parent()
      .within(() => {
        cy.get(instanceSettingsSelector.userStatusChangeButton).click();
        cy.get(
          instanceSettingsSelector.userStatusChangeButton
        ).verifyVisibleElement("have.text", "Unarchive");
      });
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.archivedToast
    );
    cy.get(commonEeSelectors.modalCloseButton).click();
    common.logout();
    cy.login(data.email, usersText.password);
    cy.contains(data.email).click();
    cy.contains(commonEeText.defaultWorkspace).should("not.exist");

    common.logout();
    cy.appUILogin();
    cy.wait(2000)
    cy.get(commonEeSelectors.instanceSettingIcon).click();
    cy.clearAndType(commonSelectors.inputUserSearch, data.email);
    cy.get(instanceSettingsSelector.viewButton(data.firstName)).click();
    cy.get(instanceSettingsSelector.viewModalRow(data.email))
      .parent()
      .within(() => {
        cy.get(instanceSettingsSelector.userStatusChangeButton).click();
        cy.get(
          instanceSettingsSelector.userStatusChangeButton
        ).verifyVisibleElement("have.text", "Unarchive");
      });
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.archivedToast
    );
    cy.get(commonEeSelectors.modalCloseButton).click();
    common.logout();

    cy.login(data.email, usersText.password);
    cy.get(commonSelectors.workspaceName).should("contain", "My workspace");
    common.logout();

    cy.appUILogin();
    cy.wait(2000)
    cy.get(commonEeSelectors.instanceSettingIcon).click();
    cy.clearAndType(commonSelectors.inputUserSearch, data.email);
    cy.get(instanceSettingsSelector.viewButton(data.firstName)).click();
    cy.get(instanceSettingsSelector.archiveAllButton).click();
    cy.get(commonEeSelectors.modalCloseButton).click();
    cy.wait(1000)
    cy.get(
      instanceSettingsSelector.userStatus(data.firstName)
    ).verifyVisibleElement("have.text", "archived");
    common.logout();
    cy.visit('/')

    cy.clearAndType(commonSelectors.workEmailInputField, data.email);
    cy.clearAndType(commonSelectors.passwordInputField, usersText.password);
    cy.get(commonSelectors.signInButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "The user has been archived, please contact the administrator to activate the account"
    );
  });

  it("Verify user sign up, archive and unarchive functionality", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase();
    data.workspaceName = `${fake.companyName}-workspace`;

    common.logout();
    userSignUp(data.firstName, data.email, data.workspaceName);
    updateWorkspaceName(data.email)

    common.logout();
    cy.appUILogin();
    cy.wait(2000)
    cy.get(commonEeSelectors.instanceSettingIcon).click();
    cy.clearAndType(commonSelectors.inputUserSearch, data.email);
    cy.get(
      instanceSettingsSelector.userName(data.firstName)
    ).verifyVisibleElement("have.text", data.firstName);
    cy.get(
      instanceSettingsSelector.userEmail(data.firstName)
    ).verifyVisibleElement("have.text", data.email);
    cy.get(
      instanceSettingsSelector.userType(data.firstName)
    ).verifyVisibleElement("have.text", "workspace");
    cy.get(
      instanceSettingsSelector.userStatus(data.firstName)
    ).verifyVisibleElement("have.text", usersText.activeStatus);

    cy.get(instanceSettingsSelector.viewButton(data.firstName)).click();
    cy.get(instanceSettingsSelector.userStatusChangeButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.archivedToast
    );
    cy.get(commonEeSelectors.modalCloseButton).click();
    common.logout();

    cy.appUILogin();
    cy.wait(2000)
    cy.get(commonEeSelectors.instanceSettingIcon).click();
    cy.get(instanceSettingsSelector.manageInstanceSettings).click();
    cy.get(instanceSettingsSelector.allowWorkspaceToggle).then(($el) => {
      if ($el.is(":checked")) {
        cy.get(instanceSettingsSelector.allowWorkspaceToggle).click();
        cy.get(commonEeSelectors.saveButton).click();
        cy.verifyToastMessage(
          commonSelectors.toastMessage,
          "Instance settings have been updated"
        );
      }
    });
    common.logout();

    cy.visit('/')
    cy.clearAndType(commonSelectors.workEmailInputField, data.email);
    cy.clearAndType(commonSelectors.passwordInputField, usersText.password);
    cy.get(commonSelectors.signInButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "User is not assigned to any workspaces"
    );
    cy.appUILogin();
    cy.wait(2000)
    cy.get(commonEeSelectors.instanceSettingIcon).click();
    cy.clearAndType(commonSelectors.inputUserSearch, data.email);
    cy.get(instanceSettingsSelector.viewButton(data.firstName)).click();
    cy.get(instanceSettingsSelector.userStatusChangeButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.unarchivedToast
    );
    cy.get(commonEeSelectors.modalCloseButton).click();
    common.logout();
    cy.task("updateId", {
      dbconfig: Cypress.env("app_db"),
      sql: `select id from organizations where name='${data.email}';`,
    }).then((resp) => {
      organizationId = resp.rows[0].id;
      cy.task("updateId", {
        dbconfig: Cypress.env("app_db"),
        sql: `select invitation_token from organization_users where organization_id='${organizationId}';`,
      }).then((resp) => {
        invitationToken = resp.rows[0].invitation_token;
        url = `/organization-invitations/${invitationToken}`;
        cy.visit(url);
      });
    });

    cy.get(commonSelectors.acceptInviteButton).click();
    cy.login(data.email, usersText.password);
    cy.contains(data.email).should("be.visible");
  });

  it("Verify instance settings functionality", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase();

    cy.get(commonEeSelectors.instanceSettingIcon).click();
    cy.get(instanceSettingsSelector.manageInstanceSettings).click();

    cy.get(instanceSettingsSelector.allowWorkspaceToggle).then(($el) => {
      if ($el.is(":checked")) {
        cy.get(instanceSettingsSelector.allowWorkspaceToggle).uncheck();
        cy.get(commonEeSelectors.saveButton).click();
        cy.verifyToastMessage(
          commonSelectors.toastMessage,
          "Instance settings have been updated"
        );
      }
    });
    common.logout();
    cy.visit('/')
    cy.get(commonSelectors.createAnAccountLink).should("not.exist");

    cy.appUILogin();
    cy.wait(2000)
    addNewUser(data.firstName, data.email);
    cy.get(commonSelectors.workspaceName).click();
    cy.contains(data.email).should("not.exist");
    cy.get(".add-new-workspace-icon-wrap").should("not.exist");

    common.logout();
    cy.appUILogin();
    cy.wait(2000)
    cy.get(commonEeSelectors.instanceSettingIcon).click();
    cy.clearAndType(commonSelectors.inputUserSearch, data.email);
    cy.get(
      instanceSettingsSelector.userName(data.firstName)
    ).verifyVisibleElement("have.text", data.firstName);
    cy.get(
      instanceSettingsSelector.userEmail(data.firstName)
    ).verifyVisibleElement("have.text", data.email);
    cy.get(
      instanceSettingsSelector.userType(data.firstName)
    ).verifyVisibleElement("have.text", "workspace");
    cy.get(
      instanceSettingsSelector.userStatus(data.firstName)
    ).verifyVisibleElement("have.text", usersText.activeStatus);

    cy.get(instanceSettingsSelector.viewButton(data.firstName)).click();
    cy.get(
      instanceSettingsSelector.workspaceName(commonEeText.defaultWorkspace)
    ).verifyVisibleElement("have.text", commonEeText.defaultWorkspace);
    cy.get(instanceSettingsSelector.viewModalRow(commonEeText.defaultWorkspace))
      .parent()
      .within(() => {
        cy.get("td small").verifyVisibleElement(
          "have.text",
          usersText.activeStatus
        );
      });
    cy.get(commonEeSelectors.modalCloseButton).click();
  });

  it("Verify superadmin privilages", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase();
    data.workspaceName = `${fake.companyName}-workspace`;

    common.logout();
    userSignUp(data.firstName, data.email, data.workspaceName);
    updateWorkspaceName(data.email)
    common.logout();

    cy.appUILogin();
    cy.wait(2000)
    cy.get(commonEeSelectors.instanceSettingIcon).click();
    cy.clearAndType(commonSelectors.inputUserSearch, data.email);
    cy.get(instanceSettingsSelector.editButton(data.firstName)).click();
    cy.get(instanceSettingsSelector.superAdminToggle).check();
    cy.get(commonEeSelectors.saveButton).click();
    common.logout();

    cy.login(data.email, usersText.password);
    common.navigateToManageSSO();
    cy.get(ssoSelector.passwordEnableToggle).uncheck();
    cy.get(commonSelectors.buttonSelector("Yes")).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      ssoText.passwordDisabledToast
    );
    cy.get(commonEeSelectors.saveButton).click();

    common.logout();
    cy.login(data.email, usersText.password);
    cy.contains(data.email).should("be.visible");
  });
});
