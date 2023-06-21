import * as common from "Support/utils/common";
import { ssoText } from "Texts/manageSSO";
import {
  resetAllowPersonalWorkspace,
  verifySSOSignUpPageElements,
  inviteUser,
  VerifyWorkspaceInvitePageElements,
  trunOffAllowPersonalWorkspace,
  WorkspaceInvitationLink,
  enableDefaultSSO,
} from "Support/utils/eeCommon";
import { commonSelectors } from "Selectors/common";
import {
  commonEeSelectors,
  ssoEeSelector,
  instanceSettingsSelector,
} from "Selectors/eeCommon";
import { commonEeText, ssoEeText } from "Texts/eeCommon";
import * as SSO from "Support/utils/manageSSO";
import { confirmInviteElements } from "Support/utils/manageUsers";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";

describe("Verify OIDC user onboarding", () => {
  beforeEach(() => {
    cy.appUILogin();
  });
  it("Verify user onboarding using workspace OIDC", () => {
    common.navigateToManageSSO();
    SSO.disableDefaultSSO();
    SSO.disableSignUp();

    cy.get(ssoEeSelector.oidc).click();

    cy.get(ssoEeSelector.oidcToggle).then(($el) => {
      if (!$el.is(":checked")) {
        cy.get(ssoEeSelector.oidcToggle).check();
      }
    });

    cy.clearAndType(ssoEeSelector.nameInput, "Tooljet OIDC");
    cy.clearAndType(
      ssoEeSelector.clientIdInput,
      "0585e2d6-5876-4514-aaa4-86be73eb9353"
    );
    cy.clearAndType(
      ssoEeSelector.clientSecretInput,
      "dJ98Q~BcaMPE.jcDwYmQ~phJySeNPpu4Aq1fOb0_"
    );
    cy.clearAndType(
      ssoEeSelector.WellKnownUrlInput,
      "http://localhost:8080/.well-known/openid-configuration"
    );
    cy.get(commonEeSelectors.saveButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      ssoEeText.oidcUpdatedToast
    );

    SSO.visitWorkspaceLoginPage();
    cy.get(ssoEeSelector.oidcSSOText).verifyVisibleElement(
      "have.text",
      "Sign in with Tooljet OIDC"
    );
    cy.get(ssoEeSelector.oidcSSOText).realClick();
    cy.get(".superadmin-button").click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Open ID login failed - User does not exist in the workspace"
    );

    cy.appUILogin();
    SSO.enableSignUp();

    SSO.visitWorkspaceLoginPage();
    cy.get(ssoEeSelector.oidcSSOText).realClick();
    cy.get(".superadmin-button").click();

    confirmInviteElements();
    cy.clearAndType(commonSelectors.passwordInputField, "password");
    cy.get(commonSelectors.acceptInviteButton).click();
    common.logout();

    cy.appUILogin();
    common.navigateToManageUsers();
    common.searchUser("superadmin@tooljet.com");
    cy.contains("td", "superadmin@tooljet.com")
      .parent()
      .within(() => {
        cy.get("td small").should("have.text", usersText.activeStatus);
      });

    common.logout();
    cy.login("superadmin@tooljet.com", "password");
  });

  it("Verify invited user onboarding using instance level OIDC", () => {
    enableDefaultSSO();
    resetAllowPersonalWorkspace();
    common.navigateToManageUsers();
    inviteUser("user", "user@tooljet.com");
    VerifyWorkspaceInvitePageElements();
    cy.get(ssoEeSelector.oidcSSOText).realClick();
    cy.get(".user-button").click();
    cy.clearAndType(commonSelectors.passwordInputField, "password");
    cy.get(commonSelectors.acceptInviteButton).click();
    cy.contains("My workspace").should("be.visible");
    //Verify users default workspace
    common.logout();

    cy.appUILogin();
    trunOffAllowPersonalWorkspace();

    common.navigateToManageUsers();
    inviteUser("user two", "usertwo@tooljet.com");
    cy.get(ssoEeSelector.oidcSSOText).realClick();
    cy.get(".user-two-button").click();
    cy.clearAndType(commonSelectors.passwordInputField, "password");
    cy.get(commonSelectors.acceptInviteButton).click();
    cy.contains("My workspace").should("be.visible");
    common.logout();

    cy.appUILogin();
    resetAllowPersonalWorkspace();
    SSO.disableSignUp();

    common.navigateToManageUsers();
    inviteUser("user three", "userthree@tooljet.com");
    cy.get(ssoEeSelector.oidcSSOText).realClick();
    cy.get(".user-four-button").click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Open ID login failed - User does not exist in the workspace"
    );
    cy.appUILogin();
    SSO.enableSignUp();
    WorkspaceInvitationLink("userthree@tooljet.com");

    cy.get(ssoEeSelector.oidcSSOText).realClick();
    cy.get(".user-four-button").click();
    cy.clearAndType(commonSelectors.passwordInputField, "password");
    cy.get(commonSelectors.acceptInviteButton).click();
    common.logout();

    cy.appUILogin();
    cy.get(commonEeSelectors.instanceSettingIcon).click();
    cy.clearAndType(commonSelectors.inputUserSearch, "userfour@tooljet.com");

    cy.get(
      instanceSettingsSelector.userStatus("userfour")
    ).verifyVisibleElement("have.text", usersText.activeStatus);
  });

  it("Verify user onboarding using instance level OIDC", () => {
    resetAllowPersonalWorkspace();
    common.logout();
    cy.get(ssoEeSelector.oidcSSOText).realClick();
    cy.get(".admin-button").click();

    verifySSOSignUpPageElements();
    cy.clearAndType(commonSelectors.passwordInputField, "password");
    cy.get(commonSelectors.acceptInviteButton).click();

    common.logout();
    cy.login("admin@tooljet.com", "password");

    common.logout();
    cy.appUILogin();
    cy.get(commonEeSelectors.instanceSettingIcon).click();
    cy.clearAndType(commonSelectors.inputUserSearch, "admin@tooljet.com");

    cy.get(instanceSettingsSelector.userStatus("admin")).verifyVisibleElement(
      "have.text",
      usersText.activeStatus
    );
  });

  it("Verify archived user login using OIDC", () => {
    trunOffAllowPersonalWorkspace();
    common.navigateToManageUsers();
    common.searchUser("usertwo@tooljet.com");
    cy.contains("td", "usertwo@tooljet.com")
      .parent()
      .within(() => {
        cy.get("td button").click();
        cy.get('[data-cy="user-two-user-status"]', { timeout: 9000 }).should(
          "have.text",
          usersText.archivedStatus
        );
      });

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.archivedToast
    );
    common.logout();

    cy.get(ssoEeSelector.oidcSSOText).realClick();
    cy.get(".user-two-button").click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Open ID login failed - User not included in any workspace or workspace does not supports SSO login"
    );

    cy.appUILogin();
    resetAllowPersonalWorkspace();
    common.logout();

    cy.get(ssoEeSelector.oidcSSOText).realClick();
    cy.get(".user-two-button").click();
  });
});
