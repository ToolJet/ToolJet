import { ssoSelector } from "Selectors/manageSSO";
import { fake } from "Fixtures/fake";
import * as common from "Support/utils/common";
import { ssoText } from "Texts/manageSSO";
import * as SSO from "Support/utils/manageSSO";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";

describe("Manage SSO for multi workspace", () => {
  const data = {};
  beforeEach(() => {
    cy.appUILogin();
  });
  it("Should verify General settings page elements", () => {
    common.navigateToManageSSO();

    cy.get(commonSelectors.breadcrumbTitle).should(($el) => {
      expect($el.contents().first().text().trim()).to.eq(
        commonText.breadcrumbworkspaceSettingTitle
      );
    });
    cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
      "have.text",
      ssoText.pagetitle
    );

    cy.get(ssoSelector.cardTitle).verifyVisibleElement(
      "have.text",
      ssoText.generalSettingsElements.generalSettings
    );
    for (const elements in ssoSelector.generalSettingsElements) {
      cy.get(
        ssoSelector.generalSettingsElements[elements]
      ).verifyVisibleElement(
        "have.text",
        ssoText.generalSettingsElements[elements]
      );
    }
    cy.get(ssoSelector.enableSignUpToggle).should("be.visible");
    cy.get(ssoSelector.allowedDomainInput).should("be.visible");
    cy.get(ssoSelector.workspaceLoginUrl).should("be.visible");
    cy.get(commonSelectors.copyIcon).should("be.visible");

    cy.get(ssoSelector.cancelButton).verifyVisibleElement(
      "have.text",
      ssoText.cancelButton
    );
    cy.get(ssoSelector.saveButton).verifyVisibleElement(
      "have.text",
      ssoText.saveButton
    );

    SSO.generalSettings();

    cy.get(ssoSelector.alertText).verifyVisibleElement(
      "have.text",
      ssoText.alertText
    );
    cy.get(ssoSelector.passwordEnableToggle).should("be.visible");
    cy.get(ssoSelector.passwordLoginToggleLbale).verifyVisibleElement(
      "have.text",
      ssoText.passwordLoginToggleLbale
    );
    cy.get(ssoSelector.disablePasswordHelperText).verifyVisibleElement(
      "have.text",
      ssoText.disablePasswordHelperText
    );

    SSO.passwordPageElements();
  });

  it("Should verify Google SSO page elements", () => {
    common.navigateToManageSSO();
    cy.get(ssoSelector.google).should("be.visible").click();
    cy.get(ssoSelector.cardTitle).verifyVisibleElement(
      "have.text",
      ssoText.googleTitle
    );
    cy.get(ssoSelector.googleEnableToggle).should("be.visible");
    cy.get(ssoSelector.clientIdLabel).verifyVisibleElement(
      "have.text",
      ssoText.clientIdLabel
    );
    cy.get(ssoSelector.clientIdInput).should("be.visible");
    cy.get(ssoSelector.cancelButton).verifyVisibleElement(
      "have.text",
      ssoText.cancelButton
    );
    cy.get(ssoSelector.saveButton).verifyVisibleElement(
      "have.text",
      ssoText.saveButton
    );

    SSO.googleSSOPageElements();
    SSO.disableDefaultSSO();
    SSO.visitWorkspaceLoginPage();

    cy.get(ssoSelector.googleIcon).should("be.visible");
    cy.get(ssoSelector.googleSSOText).verifyVisibleElement(
      "have.text",
      ssoText.googleSSOText
    );
  });

  it("Should verify Git SSO page elements", () => {
    common.navigateToManageSSO();

    cy.get(ssoSelector.git).should("be.visible").click();
    cy.get(ssoSelector.githubLabel).verifyVisibleElement(
      "have.text",
      ssoText.gitTitle
    );

    cy.get(ssoSelector.hostNameLabel).verifyVisibleElement(
      "have.text",
      ssoText.hostNameLabel
    );
    cy.get(ssoSelector.hostNameInput).should("be.visible");
    cy.get(ssoSelector.hostNameHelpText).verifyVisibleElement(
      "have.text",
      ssoText.hostNameHelpText
    );
    cy.get(ssoSelector.gitEnableToggle).should("be.visible");
    cy.get(ssoSelector.clientIdLabel).verifyVisibleElement(
      "have.text",
      ssoText.clientIdLabel
    );
    cy.get(ssoSelector.clientIdInput).should("be.visible");
    cy.get(ssoSelector.clientSecretLabel)
      .should(($el) => {
        expect($el.contents().first().text().trim()).to.eq(
          ssoText.clientSecretLabel
        );
      })
      .and("be.visible");
    cy.get(ssoSelector.encriptedLabel).verifyVisibleElement(
      "have.text",
      ssoText.encriptedLabel
    );
    cy.get(ssoSelector.clientSecretInput).should("be.visible");
    cy.get(ssoSelector.cancelButton).verifyVisibleElement(
      "have.text",
      ssoText.cancelButton
    );
    cy.get(ssoSelector.saveButton).verifyVisibleElement(
      "have.text",
      ssoText.saveButton
    );

    SSO.gitSSOPageElements();
    SSO.visitWorkspaceLoginPage();

    cy.get(ssoSelector.googleIcon).should("be.visible");
    cy.get(ssoSelector.googleSSOText).verifyVisibleElement(
      "have.text",
      ssoText.googleSSOText
    );
  });

  it("Should verify the workspace login page", () => {
    data.workspaceName = fake.companyName;

    common.createWorkspace(data.workspaceName);
    common.navigateToManageSSO();
    SSO.visitWorkspaceLoginPage();
    SSO.workspaceLoginPageElements(data.workspaceName);

    SSO.workspaceLogin(data.workspaceName);
    SSO.disableDefaultSSO();
    SSO.visitWorkspaceLoginPage();
    cy.notVisible(ssoSelector.googleSSOText);
    cy.notVisible(ssoSelector.gitSSOText);
    SSO.passwordLoginVisible();

    SSO.workspaceLogin(data.workspaceName);
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
    SSO.passwordLoginVisible();

    SSO.workspaceLogin(data.workspaceName);
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

    SSO.workspaceLogin(data.workspaceName);
    common.navigateToManageSSO();
    cy.get(ssoSelector.google).should("be.visible").click();

    cy.get(ssoSelector.googleEnableToggle).check();
    cy.get(ssoSelector.statusLabel).verifyVisibleElement(
      "have.text",
      ssoText.enabledLabel
    );
    SSO.visitWorkspaceLoginPage();
    SSO.workspaceLoginPageElements(data.workspaceName);

    SSO.workspaceLogin(data.workspaceName);
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
    cy.notVisible(commonSelectors.workEmailInputField);
    cy.notVisible(commonSelectors.passwordInputField);
    cy.notVisible(commonSelectors.loginButton);

    data.workspaceName = fake.companyName;
    cy.appUILogin();
    common.createWorkspace(data.workspaceName);
    cy.wait(300);
    SSO.disableDefaultSSO();
    cy.get(ssoSelector.passwordEnableToggle).uncheck();
    cy.get(commonSelectors.buttonSelector("Yes")).click();
    SSO.visitWorkspaceLoginPage();
    cy.get(ssoSelector.noLoginMethodWarning).verifyVisibleElement(
      "have.text",
      ssoText.noLoginMethodWarning
    );
  });
});
