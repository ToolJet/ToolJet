import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersText } from "Texts/manageUsers";
import * as common from "Support/utils/common";
import {
  userSignUp,
  allowPersonalWorkspace,
  openInstanceSettings,
  openUserActionMenu,
  addNewUserEE,
  InstanceSSO,
  passwordToggle,
} from "Support/utils/eeCommon";
import { updateWorkspaceName } from "Support/utils/userPermissions";
import { usersSelector } from "Selectors/manageUsers";
import {
  commonEeSelectors,
  instanceSettingsSelector,
} from "Selectors/eeCommon";
import { commonEeText, instanceSettingsText } from "Texts/eeCommon";
import { ssoSelector } from "Selectors/manageSSO";
import { ssoText } from "Texts/manageSSO";
import { addNewUser } from "Support/utils/onboarding";

let invitationToken,
  organizationId,
  url = "";
const data = {};

data.appName = `${fake.companyName} App`;
data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.workspaceName = `${fake.companyName}-workspace`;

describe("Superadmin", () => {
  beforeEach(() => {
    InstanceSSO(true, true, true);
    cy.defaultWorkspaceLogin();
  });
  after(() => {
    cy.defaultWorkspaceLogin();
    passwordToggle(true);
  });
  it("Verify elements of the instance settings page", () => {
    openInstanceSettings();
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
      expect($el.contents().last().text().trim()).to.eq("Manage All Users");
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
    ).verifyVisibleElement("have.text", "active");
    cy.get(instanceSettingsSelector.viewButton("The developer")).should(
      ($el) => {
        expect($el.contents().first().text().trim()).to.eq("View (");
      }
    );

    openUserActionMenu("dev@tooljet.io");
    cy.get('[data-cy="edit-user-details-button"]').verifyVisibleElement(
      "have.text",
      "Edit user details"
    );
    cy.get('[data-cy="archive-button"]').verifyVisibleElement(
      "have.text",
      "Archive user"
    );

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

    cy.get(instanceSettingsSelector.viewModalRow(commonEeText.defaultWorkspace))
      .eq(0)
      .verifyVisibleElement("have.text", "1");

    cy.get(
      instanceSettingsSelector.workspaceName(commonEeText.defaultWorkspace)
    ).verifyVisibleElement("have.text", commonEeText.defaultWorkspace);
    cy.get(instanceSettingsSelector.viewModalRow(commonEeText.defaultWorkspace))
      .parent()
      .within(() => {
        cy.get("td small").verifyVisibleElement("have.text", "Active");
        cy.get(
          instanceSettingsSelector.userStatusChangeButton
        ).verifyVisibleElement("have.text", instanceSettingsText.archiveState);
      });

    cy.get(commonEeSelectors.modalCloseButton).click();
    openUserActionMenu("dev@tooljet.io");
    cy.get('[data-cy="edit-user-details-button"]').click();

    cy.get(commonEeSelectors.modalTitle).verifyVisibleElement(
      "have.text",
      instanceSettingsText.editModalTitle
    );
    cy.verifyLabel("Name");
    cy.get('[data-cy="input-field-full-name"]').verifyVisibleElement(
      "have.value",
      "The Developer"
    );
    cy.get('[data-cy="input-field-email"]');
    cy.verifyLabel("Email address");

    cy.get(instanceSettingsSelector.superAdminToggleLabel).verifyVisibleElement(
      "have.text",
      instanceSettingsText.superAdminToggleLabel
    );
    cy.get(instanceSettingsSelector.superAdminToggle).should("be.visible");
    cy.get(commonSelectors.cancelButton).verifyVisibleElement(
      "have.text",
      commonEeText.cancelButton
    );
    cy.get('[data-cy="update-button"]').verifyVisibleElement(
      "have.text",
      "Update"
    );
    cy.get(commonEeSelectors.modalCloseButton).should("be.visible").click();

    cy.get(instanceSettingsSelector.manageInstanceSettings).click();

    cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
      "have.text",
      " Manage instance settings"
    );

    cy.get(commonEeSelectors.cardTitle).verifyVisibleElement(
      "have.text",
      "Manage instance settings"
    );

    cy.get(instanceSettingsSelector.allowWorkspaceToggle)
      .eq(2)
      .should("be.visible");
    cy.get(instanceSettingsSelector.allowWorkspaceToggleLabel)
      .eq(2)
      .verifyVisibleElement("have.text", "Comments");
    cy.get(instanceSettingsSelector.allowWorkspaceHelperText)
      .eq(2)
      .verifyVisibleElement(
        "have.text",
        "Collaborate with others by adding comments anywhere on the canvas"
      );

    cy.get(instanceSettingsSelector.allowWorkspaceToggle)
      .eq(1)
      .should("be.visible");
    cy.get(instanceSettingsSelector.allowWorkspaceToggleLabel)
      .eq(1)
      .verifyVisibleElement("have.text", "Multiplayer editing");
    cy.get(instanceSettingsSelector.allowWorkspaceHelperText)
      .eq(1)
      .verifyVisibleElement(
        "have.text",
        "Work collaboratively and edit applications in real-time with multi-player editing"
      );

    cy.get(instanceSettingsSelector.allowWorkspaceToggle)
      .eq(0)
      .should("be.visible");
    cy.get(instanceSettingsSelector.allowWorkspaceToggleLabel)
      .eq(0)
      .verifyVisibleElement(
        "have.text",
        instanceSettingsText.allowWorkspaceToggleLabel
      );
    cy.get(instanceSettingsSelector.allowWorkspaceHelperText)
      .eq(0)
      .verifyVisibleElement(
        "have.text",
        instanceSettingsText.allowWorkspaceHelperText
      );

    cy.get(commonSelectors.cancelButton).verifyVisibleElement(
      "have.text",
      commonEeText.cancelButton
    );
    cy.get(commonEeSelectors.saveButton).verifyVisibleElement(
      "have.text",
      "Save changes"
    );
  });

  it("Verify invite user, Archive, Archive All functionality", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase();

    cy.intercept("GET", "/api/folders?searchKey=&type=front-end").as(
      "homePage"
    );
    addNewUser(data.firstName, data.email);
    cy.logoutApi();

    cy.defaultWorkspaceLogin();

    openInstanceSettings();
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
    ).verifyVisibleElement("have.text", "active");

    cy.get(instanceSettingsSelector.viewButton(data.firstName)).click();

    cy.get(
      instanceSettingsSelector.workspaceName(commonEeText.defaultWorkspace)
    ).verifyVisibleElement("have.text", commonEeText.defaultWorkspace);
    cy.get(instanceSettingsSelector.viewModalRow(commonEeText.defaultWorkspace))
      .parent()
      .within(() => {
        cy.get("td small").verifyVisibleElement("have.text", "Active");
      });
    cy.get(commonEeSelectors.modalCloseButton).click();

    cy.logoutApi();
    cy.apiLogin(data.email, "password");
    cy.visit("/my-workspace");
    cy.wait(500);
    cy.get(commonEeSelectors.instanceSettingIcon).should("not.exist");
    cy.contains("My workspace").click();
    cy.wait(500);
    cy.contains(data.email).click();
    cy.wait("@homePage");
    cy.get(commonEeSelectors.instanceSettingIcon).should("not.exist");
    cy.contains(data.email).click();
    cy.wait("@homePage");

    common.logout();
    cy.defaultWorkspaceLogin();
    openInstanceSettings();
    cy.clearAndType(commonSelectors.inputUserSearch, data.email);
    cy.get(instanceSettingsSelector.viewButton(data.firstName)).click();

    cy.get(instanceSettingsSelector.viewModalRow(commonEeText.defaultWorkspace))
      .parent()
      .within(() => {
        cy.get(instanceSettingsSelector.userStatusChangeButton).click();
        cy.wait(1000);
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
    cy.apiLogin(data.email, usersText.password);
    cy.visit("/");
    cy.contains(data.email).click();
    cy.contains(commonEeText.defaultWorkspace).should("not.exist");

    common.logout();
    cy.defaultWorkspaceLogin();
    openInstanceSettings();
    cy.clearAndType(commonSelectors.inputUserSearch, data.email);
    cy.get(instanceSettingsSelector.viewButton(data.firstName)).click();
    cy.get(instanceSettingsSelector.viewModalRow(data.email))
      .parent()
      .within(() => {
        cy.get(instanceSettingsSelector.userStatusChangeButton).click();
        cy.wait(1000);
        cy.get(
          instanceSettingsSelector.userStatusChangeButton
        ).verifyVisibleElement("have.text", "Unarchive");
      });
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.archivedToast
    );
    cy.get(commonEeSelectors.modalCloseButton).click();
    cy.logoutApi();

    cy.apiLogin(data.email, "password");
    cy.visit("/");
    cy.wait(500);
    cy.get(commonSelectors.workspaceName).should("contain", "My workspace");
    common.logout();

    cy.apiLogin();
    cy.visit("/my-workspace");
    cy.wait(500);
    openInstanceSettings();
    cy.clearAndType(commonSelectors.inputUserSearch, data.email);
    cy.get(instanceSettingsSelector.viewButton(data.firstName)).click();
    cy.get(commonEeSelectors.modalCloseButton).click();

    cy.get('[data-cy="user-actions-button"]').click();
    cy.get('[data-cy="archive-button"]').click();

    cy.get('[data-cy="modal-title"] :eq(1)').verifyVisibleElement(
      "have.text",
      "Archive user"
    );
    cy.get('[data-cy="user-email"]').verifyVisibleElement(
      "have.text",
      data.email
    );
    cy.get('[data-cy="modal-close-button"]').should("be.visible");
    cy.get('[data-cy="modal-message"]').verifyVisibleElement(
      "have.text",
      "Archiving the user will restrict their access to all their workspaces and exclude them from the count of users covered by your plan. Are you sure you want to continue?"
    );
    cy.get('[data-cy="cancel-button"]').verifyVisibleElement(
      "have.text",
      "Cancel"
    );
    cy.get('[data-cy="confirm-button"]')
      .verifyVisibleElement("have.text", "Archive")
      .click();

    cy.wait(1000);
    cy.get(
      instanceSettingsSelector.userStatus(data.firstName)
    ).verifyVisibleElement("have.text", "archived");
    cy.logoutApi();
    cy.visit("/");

    cy.clearAndType(commonSelectors.workEmailInputField, data.email);
    cy.clearAndType(commonSelectors.passwordInputField, usersText.password);
    cy.get(commonSelectors.signInButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "You have been archived from this instance. Contact super admin to know more."
    );
  });

  it("Verify user sign up, archive and unarchive functionality", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase();
    data.workspaceName = `${fake.companyName}-workspace`;

    cy.logoutApi();
    cy.visit("/");
    userSignUp(data.firstName, data.email, data.workspaceName);
    updateWorkspaceName(data.email);
    cy.wait(1000);
    common.logout();

    cy.defaultWorkspaceLogin();
    InstanceSSO(false, false, true);
    openInstanceSettings();
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
    ).verifyVisibleElement("have.text", "active");

    cy.get(instanceSettingsSelector.viewButton(data.firstName)).click();
    cy.get(instanceSettingsSelector.userStatusChangeButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.archivedToast
    );
    cy.get(commonEeSelectors.modalCloseButton).click();
    cy.logoutApi();

    cy.defaultWorkspaceLogin();
    openInstanceSettings();
    cy.get(instanceSettingsSelector.manageInstanceSettings).click();
    cy.get(instanceSettingsSelector.allowWorkspaceToggle)
      .eq(0)
      .then(($el) => {
        if ($el.is(":checked")) {
          cy.get(instanceSettingsSelector.allowWorkspaceToggle).eq(0).click();
          cy.get(commonEeSelectors.saveButton).click();
          cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Instance settings have been updated"
          );
        }
      });
    cy.logoutApi();

    cy.visit("/");
    cy.clearAndType(commonSelectors.workEmailInputField, data.email);
    cy.clearAndType(commonSelectors.passwordInputField, usersText.password);
    cy.get(commonSelectors.signInButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "User is not assigned to any workspaces"
    );

    cy.defaultWorkspaceLogin();
    openInstanceSettings();
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

    InstanceSSO(false, false, true);
    cy.reload();
    openInstanceSettings();
    cy.get(instanceSettingsSelector.manageInstanceSettings).click();
    cy.get(instanceSettingsSelector.allowWorkspaceToggle).eq(0).check();
    cy.get(commonEeSelectors.saveButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Instance settings have been updated"
    );
    cy.get(instanceSettingsSelector.allowWorkspaceToggle).eq(0).uncheck();
    cy.get(commonEeSelectors.saveButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Instance settings have been updated"
    );

    cy.logoutApi();
    cy.visit("/");
    cy.get(commonSelectors.createAnAccountLink).should("not.exist");

    cy.defaultWorkspaceLogin();
    addNewUserEE(data.firstName, data.email);
    cy.get(commonSelectors.workspaceName).click();
    cy.contains(data.email).should("not.exist");
    cy.get(".add-new-workspace-icon-wrap").should("not.exist");
    cy.logoutApi();

    cy.defaultWorkspaceLogin();
    openInstanceSettings();
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
    ).verifyVisibleElement("have.text", "active");

    cy.get(instanceSettingsSelector.viewButton(data.firstName)).click();
    cy.get(
      instanceSettingsSelector.workspaceName(commonEeText.defaultWorkspace)
    ).verifyVisibleElement("have.text", commonEeText.defaultWorkspace);
    cy.get(instanceSettingsSelector.viewModalRow(commonEeText.defaultWorkspace))
      .parent()
      .within(() => {
        cy.get("td small").verifyVisibleElement("have.text", "Active");
      });
    cy.get(commonEeSelectors.modalCloseButton).click();
  });

  it("Verify superadmin privilages", () => {
    passwordToggle(false);
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase();
    data.workspaceName = `${fake.companyName}-workspace`;

    cy.logoutApi();
    userSignUp(data.firstName, data.email, data.workspaceName);
    updateWorkspaceName(data.email);
    common.logout();

    cy.defaultWorkspaceLogin();
    openInstanceSettings();
    openUserActionMenu(data.email);
    cy.get('[data-cy="edit-user-details-button"]').click();
    cy.get(instanceSettingsSelector.superAdminToggle).check();
    cy.get('[data-cy="update-button"]').click();
    cy.wait(1000);
    cy.logoutApi();

    cy.login(data.email, "password");
    common.navigateToManageSSO();
    cy.wait(500);
    cy.get(ssoSelector.passwordEnableToggle).uncheck();
    cy.get(commonSelectors.confirmationButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      ssoText.passwordDisabledToast
    );

    common.logout();
    cy.login(data.email, "password");
    cy.contains(data.email).should("be.visible");
  });
});
