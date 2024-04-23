import * as common from "Support/utils/common";
import { ssoText } from "Texts/manageSSO";
import {
  verifySSOSignUpPageElements,
  inviteUser,
  VerifyWorkspaceInvitePageElements,
  allowPersonalWorkspace,
  WorkspaceInvitationLink,
  enableDefaultSSO,
  disableSSO,
} from "Support/utils/eeCommon";
import { commonSelectors } from "Selectors/common";
import {
  commonEeSelectors,
  ssoEeSelector,
  instanceSettingsSelector,
} from "Selectors/eeCommon";
import { commonEeText, ssoEeText } from "Texts/eeCommon";
import { setSignupStatus, defaultSSO, deleteOrganisationSSO } from "Support/utils/manageSSO";
import { confirmInviteElements } from "Support/utils/manageUsers";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import { verifyOnboardingQuestions } from "Support/utils/onboarding";
import { fake } from "Fixtures/fake";

describe("Verify OIDC user onboarding", () => {
  const envVar = Cypress.env("environment");
  let workspaceName = fake.companyName;

  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/my-workspace");
    cy.intercept("GET", "api/library_apps").as("apps");
    cy.wait(2000);
    defaultSSO(true);
  });

  it("Verify user onboarding using workspace OIDC", () => {
    deleteOrganisationSSO("My workspace", ["openid"]);
    common.navigateToManageSSO();
    defaultSSO(false);
    setSignupStatus(false);
    cy.wait(1000);

    cy.get(ssoEeSelector.oidc).click();
    cy.get(ssoEeSelector.oidcToggle).click()
    cy.clearAndType(ssoEeSelector.nameInput, "Tooljet OIDC");
    cy.clearAndType(
      ssoEeSelector.clientIdInput,
      Cypress.env("SSO_OPENID_CLIENT_ID")
    );
    cy.clearAndType(
      ssoEeSelector.clientSecretInput,
      Cypress.env("SSO_OPENID_CLIENT_SECRET")
    );
    cy.clearAndType(
      ssoEeSelector.WellKnownUrlInput,
      Cypress.env("SSO_OPENID_WELL_KNOWN_URL")
    );
    cy.get(commonEeSelectors.saveButton).eq(1).click();
    cy.get('[data-cy="enable-button"]').click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      ssoText.toggleUpdateToast("OpenID")
    );

    cy.logoutApi();
    cy.visit("/login/my-workspace");
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

    cy.apiLogin();
    setSignupStatus(true);
    cy.logoutApi();

    cy.visit("/login/my-workspace");
    cy.get(ssoEeSelector.oidcSSOText).realClick();
    cy.get(".superadmin-button").click();

    confirmInviteElements();

    cy.get(commonSelectors.acceptInviteButton).click();
    cy.wait("@apps");
    common.logout();

    cy.apiLogin();
    cy.visit("/my-workspace");
    cy.wait(500);
    common.navigateToManageUsers();
    common.searchUser("superadmin@tooljet.com");

    cy.contains("td", "superadmin@tooljet.com")
      .parent()
      .within(() => {
        cy.get("td small").should("have.text", usersText.activeStatus);
      });

    cy.logoutApi();
    cy.visit("/my-workspace");
    cy.get(ssoEeSelector.oidcSSOText).realClick();
    cy.get(".superadmin-button").click();
  });

  it("Verify invited user onboarding using instance level OIDC", () => {
    setSignupStatus(true);

    if (envVar === "Enterprise") {
      allowPersonalWorkspace();
    }
    common.navigateToManageUsers();
    cy.wait(1000);
    cy.get("body").then(($el) => {
      if (!$el.text().includes("user@tooljet.com", { timeout: 2000 })) {
        inviteUser("user", "user@tooljet.com");
      } else {
        WorkspaceInvitationLink("user@tooljet.com");
      }
    });
    VerifyWorkspaceInvitePageElements();
    cy.wait(2000);
    cy.get(ssoEeSelector.oidcSSOText).realClick();
    cy.get(".user-button").click();
    cy.wait(1000);

    cy.get(commonSelectors.acceptInviteButton).click();
    cy.wait("@apps");
    cy.contains("My workspace").should("be.visible");
    common.logout();

    cy.apiLogin();
    cy.visit("/my-workspace");
    cy.wait(1000);
    setSignupStatus(false);

    common.navigateToManageUsers();
    cy.wait(500);
    inviteUser("user", "userthree@tooljet.com");
    cy.wait(2000);
    cy.get(ssoEeSelector.oidcSSOText).realClick();
    cy.get(".user-four-button").click();

    cy.get(commonSelectors.toastMessage)
      .should("be.visible")
      .and(
        "have.text",
        "Open ID login failed - User does not exist in the workspace"
      );
    cy.wait(500);
    cy.apiLogin();
    cy.visit("/my-workspace");
    cy.wait(1000);

    setSignupStatus(true);
    WorkspaceInvitationLink("userthree@tooljet.com");
    cy.wait(2000);
    cy.get(ssoEeSelector.oidcSSOText).realClick();
    cy.get(".user-four-button").click();
    cy.get(commonSelectors.acceptInviteButton).click();
    cy.wait("@apps");

    common.logout();
    if (envVar === "Enterprise") {
      cy.apiLogin();
      cy.visit("/");
      cy.wait(1000);
      cy.get(commonSelectors.settingsIcon).click();
      cy.get(commonEeSelectors.instanceSettingIcon).click();
      cy.clearAndType(commonSelectors.inputUserSearch, "userfour@tooljet.com");

      cy.get(
        instanceSettingsSelector.userStatus("userfour")
      ).verifyVisibleElement("have.text", usersText.activeStatus);
    }
  });

  if (envVar === "Enterprise") {
    it("Verify user onboarding using instance level OIDC", () => {
      allowPersonalWorkspace();
      cy.logoutApi();
      cy.visit("/");
      cy.get(ssoEeSelector.oidcSSOText).realClick();
      cy.get(".admin-button").click();

      verifySSOSignUpPageElements();

      cy.get(commonSelectors.acceptInviteButton).click();
      cy.wait("@apps");
      verifyOnboardingQuestions("Admin", workspaceName);

      common.logout();
      cy.apiLogin();
      cy.visit("/my-workspace");
      cy.wait(500);
      cy.get(commonSelectors.settingsIcon).click();
      cy.get(commonEeSelectors.instanceSettingIcon).click();
      cy.clearAndType(commonSelectors.inputUserSearch, "admin@tooljet.com");

      cy.get(instanceSettingsSelector.userStatus("admin")).verifyVisibleElement(
        "have.text",
        usersText.activeStatus
      );

      cy.logoutApi();
      cy.visit("/");
      cy.get(ssoEeSelector.oidcSSOText).realClick();
      cy.get(".admin-button").click();
    });
  }

  it("Verify archived user login using OIDC", () => {
    setSignupStatus(true);
    if (envVar === "Enterprise") {
      allowPersonalWorkspace(false);
    }
    common.navigateToManageUsers();

    cy.wait(1000);
    inviteUser("user two", "usertwo@tooljet.com");

    cy.wait(2000);
    cy.get(ssoEeSelector.oidcSSOText).realClick();
    cy.get(".user-two-button").click();

    cy.get(commonSelectors.acceptInviteButton).click();
    cy.wait("@apps");
    cy.contains("My workspace").should("be.visible");
    common.logout();

    cy.apiLogin();
    cy.visit("/my-workspace");
    cy.wait(500);
    common.navigateToManageUsers();
    common.searchUser("usertwo@tooljet.com");
    cy.get('[data-cy="user-actions-button"]').click();
    cy.get('[data-cy="archive-button"]').click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.archivedToast
    );
    cy.get(instanceSettingsSelector.userStatus("user two"), {
      timeout: 9000,
    }).should("have.text", usersText.archivedStatus);
    cy.logoutApi();
    cy.visit("/my-workspace");
    cy.wait(2000);
    cy.get(ssoEeSelector.oidcSSOText).realClick();
    cy.get(".user-two-button").click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Open ID login failed - User does not exist in the workspace"
    );

    cy.apiLogin();
    cy.visit("/my-workspace");
    cy.wait(500);
    if (envVar === "Enterprise") {
      allowPersonalWorkspace();
    }
    cy.logoutApi();
    cy.visit("/my-workspace");
    cy.get(ssoEeSelector.oidcSSOText).realClick();
    cy.get(".user-two-button").click();
  });
});
