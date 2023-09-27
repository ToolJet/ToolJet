import { ssoSelector } from "Selectors/manageSSO";
import { fake } from "Fixtures/fake";
import * as common from "Support/utils/common";
import { ssoText } from "Texts/manageSSO";
import {
  oidcSSOPageElements,
  defaultWorkspace,
  disableSSO,
} from "Support/utils/eeCommon";
import { commonSelectors } from "Selectors/common";
import { commonEeSelectors, ssoEeSelector } from "Selectors/eeCommon";
import { commonEeText, ssoEeText } from "Texts/eeCommon";
import * as SSO from "Support/utils/manageSSO";

describe("Manage SSO for multi workspace", () => {
  const data = {};
  beforeEach(() => {
    cy.appUILogin();
  });

  it("Should verify the workspace login page", () => {
    common.navigateToManageSSO();
    disableSSO(ssoSelector.google, ssoSelector.googleEnableToggle);
    disableSSO(ssoSelector.git, ssoSelector.gitEnableToggle);
    disableSSO(ssoEeSelector.oidc, ssoEeSelector.oidcToggle);
    disableSSO('[data-cy="ldap-list-item"]', ssoEeSelector.ldapToggle);


    SSO.visitWorkspaceLoginPage();
    SSO.workspaceLoginPageElements("My workspace");

    SSO.workspaceLogin("My workspace");
    SSO.disableDefaultSSO();
    SSO.visitWorkspaceLoginPage();
    cy.notVisible(ssoSelector.googleSSOText);
    cy.notVisible(ssoSelector.gitSSOText);
    cy.notVisible(ssoEeSelector.oidcSSOText);
    SSO.passwordLoginVisible();

    SSO.workspaceLogin("My workspace");
    common.navigateToManageSSO();
    cy.get(ssoSelector.google).should("be.visible").click();

    cy.get(ssoSelector.googleEnableToggle).check();
    cy.get(ssoSelector.statusLabel).verifyVisibleElement(
      "have.text",
      ssoText.enabledLabel
    );

    SSO.visitWorkspaceLoginPage();
    cy.get(ssoSelector.googleSSOText).verifyVisibleElement(
      "have.text",
      ssoText.googleSSOText
    );
    cy.notVisible(ssoSelector.gitSSOText);
    cy.notVisible(ssoEeSelector.oidcSSOText);
    SSO.passwordLoginVisible();

    SSO.workspaceLogin("My workspace");
    common.navigateToManageSSO();
    cy.get(ssoSelector.google).should("be.visible").click();
    cy.get(ssoSelector.googleEnableToggle).uncheck();
    cy.get(ssoSelector.statusLabel).verifyVisibleElement(
      "have.text",
      ssoText.disabledLabel
    );

    cy.get(ssoSelector.git).should("be.visible").click();
    cy.get(ssoSelector.gitEnableToggle).check();
    cy.get(ssoSelector.statusLabel).verifyVisibleElement(
      "have.text",
      ssoText.enabledLabel
    );
    SSO.visitWorkspaceLoginPage();
    cy.get(ssoSelector.gitSSOText).verifyVisibleElement(
      "have.text",
      ssoText.gitSignInText
    );
    SSO.passwordLoginVisible();

    SSO.workspaceLogin("My workspace");
    common.navigateToManageSSO();
    cy.get(ssoSelector.git).should("be.visible").click();
    cy.get(ssoSelector.gitEnableToggle).uncheck();
    cy.get(ssoSelector.statusLabel).verifyVisibleElement(
      "have.text",
      ssoText.disabledLabel
    );

    cy.get(ssoEeSelector.oidc).should("be.visible").dblclick();
    cy.get(ssoEeSelector.oidcToggle).check();
    cy.get(ssoEeSelector.statusLabel).verifyVisibleElement(
      "have.text",
      ssoText.enabledLabel
    );
    SSO.visitWorkspaceLoginPage();
    cy.get(ssoEeSelector.oidcSSOText).verifyVisibleElement(
      "have.text",
      "Sign in with Open ID"
    );
    SSO.passwordLoginVisible();

    SSO.workspaceLogin("My workspace");
    common.navigateToManageSSO();
    cy.get(ssoSelector.google).should("be.visible").click();

    cy.get(ssoSelector.googleEnableToggle).check();
    cy.get(ssoSelector.statusLabel).verifyVisibleElement(
      "have.text",
      ssoText.enabledLabel
    );

    cy.get(ssoSelector.git).should("be.visible").click();
    cy.get(ssoSelector.gitEnableToggle).check();
    cy.get(ssoSelector.statusLabel).verifyVisibleElement(
      "have.text",
      ssoText.enabledLabel
    );
    SSO.visitWorkspaceLoginPage();
    SSO.workspaceLoginPageElements("My workspace");

    SSO.workspaceLogin("My workspace");
    common.navigateToManageSSO();
    cy.get(ssoSelector.passwordEnableToggle).uncheck();
    cy.get(commonSelectors.buttonSelector("Yes")).click();

    SSO.visitWorkspaceLoginPage();
    cy.get(ssoSelector.googleSSOText).verifyVisibleElement(
      "have.text",
      ssoText.googleSSOText
    );
    cy.get(ssoSelector.gitSSOText).verifyVisibleElement(
      "have.text",
      ssoText.gitSignInText
    );
    cy.get(ssoEeSelector.oidcSSOText).verifyVisibleElement(
      "have.text",
      "Sign in with Open ID"
    );

    cy.notVisible(commonSelectors.workEmailInputField);
    cy.notVisible(commonSelectors.passwordInputField);
    cy.notVisible(commonSelectors.loginButton);

    cy.appUILogin();
    cy.wait(2000)
    SSO.disableDefaultSSO();
    cy.get(ssoSelector.google).click();
    cy.get(ssoSelector.googleEnableToggle).uncheck();
    cy.get(ssoSelector.git).click();
    cy.get(ssoSelector.gitEnableToggle).uncheck();
    cy.get(ssoEeSelector.oidc).dblclick()
    cy.get(ssoEeSelector.oidcToggle).uncheck();

    SSO.visitWorkspaceLoginPage();
    cy.get(ssoSelector.noLoginMethodWarning).verifyVisibleElement(
      "have.text",
      ssoText.noLoginMethodWarning
    );
    cy.appUILogin();
    cy.wait(2000)
    common.navigateToManageSSO();
    cy.get(ssoSelector.passwordEnableToggle).check();
    SSO.enableDefaultSSO();
    common.navigateToManageSSO();
    disableSSO(ssoSelector.google, ssoSelector.googleEnableToggle);
    disableSSO(ssoSelector.git, ssoSelector.gitEnableToggle);
    disableSSO(ssoEeSelector.oidc, ssoEeSelector.oidcToggle);

    defaultWorkspace();
  });
  it("Should verify openID settings page elements", () => {
    common.navigateToManageSSO();
    cy.wait(1000)
    cy.get(ssoEeSelector.oidc).dblclick()

    cy.get(ssoEeSelector.oidcToggle).should("be.visible");

    cy.get(ssoEeSelector.oidcToggle).then(($el) => {
      if (!$el.is(":checked")) {
        cy.get(ssoEeSelector.oidcToggle).check();
      }
    });
    cy.get(ssoEeSelector.statusLabel).should("be.visible");

    for (const elements in ssoEeSelector.oidcPageElements) {
      cy.get(ssoEeSelector.oidcPageElements[elements]).verifyVisibleElement(
        "have.text",
        ssoEeText.oidcPageElements[elements]
      );
    }
    cy.get(ssoEeSelector.nameInput).should("be.visible");
    cy.get(ssoEeSelector.clientIdInput).should("be.visible");
    cy.get(ssoEeSelector.clientSecretInput).should("be.visible");
    cy.get(ssoEeSelector.WellKnownUrlInput).should("be.visible");
    cy.get(ssoEeSelector.redirectUrl).should("be.visible");

    cy.get(commonEeSelectors.cancelButton).verifyVisibleElement(
      "have.text",
      commonEeText.cancelButton
    );
    cy.get(commonEeSelectors.saveButton).verifyVisibleElement(
      "have.text",
      commonEeText.saveButton
    );

    oidcSSOPageElements();
    cy.get(ssoEeSelector.oidcToggle).then(($el) => {
      if ($el.is(":checked")) {
        cy.get(ssoEeSelector.oidcToggle).uncheck();
      }
    });
  });
});