import { ssoSelector } from "Selectors/manageSSO";
import { fake } from "Fixtures/fake";
import * as common from "Support/utils/common";
import { ssoText } from "Texts/manageSSO";
import * as SSO from "Support/utils/manageSSO";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";

describe("Manage SSO for multi workspace", () => {
  const data = {};
  const envVar = Cypress.env("environment");
  beforeEach(() => {
    cy.defaultWorkspaceLogin();
    SSO.deleteOrganisationSSO("My workspace", ["google", "git"]);
  });
  it("Should verify General settings page elements", () => {
    SSO.resetDomain();
    SSO.setSignupStatus(false);
    SSO.defaultSSO(true);

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
      "Workspace login"
    );
    for (const elements in ssoSelector.generalSettingsElements) {
      cy.get(ssoSelector.workspaceLoginPage[elements]).verifyVisibleElement(
        "have.text",
        ssoText.workspaceLoginPage[elements]
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

    cy.get(ssoSelector.passwordEnableToggle).should("be.visible");
    cy.get(ssoSelector.passwordLoginToggleLbale).verifyVisibleElement(
      "have.text",
      ssoText.passwordLoginToggleLbale
    );
    cy.get(ssoSelector.disablePasswordHelperText).verifyVisibleElement(
      "have.text",
      ssoText.disablePasswordHelperText
    );

    SSO.generalSettings();
  });

  it("Should verify Google SSO page elements", () => {
    common.navigateToManageSSO();
    cy.get(ssoSelector.google).should("be.visible").click();
    cy.get(ssoSelector.cardTitle)
      .eq(1)
      .verifyVisibleElement("have.text", ssoText.googleTitle);
    cy.get(ssoSelector.googleEnableToggle).should("be.visible");
    cy.get(ssoSelector.clientIdLabel).verifyVisibleElement(
      "have.text",
      ssoText.clientIdLabel
    );
    cy.get(ssoSelector.clientIdInput).should("be.visible");
    cy.get(ssoSelector.cancelButton)
      .eq(1)
      .verifyVisibleElement("have.text", ssoText.cancelButton);
    cy.get(ssoSelector.saveButton)
      .eq(1)
      .verifyVisibleElement("have.text", ssoText.saveButton);

    SSO.googleSSOPageElements();
    SSO.defaultSSO(false);
    cy.logoutApi();
    cy.visit("/login/my-workspace");
    cy.get(ssoSelector.googleIcon).should("be.visible");
    cy.get(ssoSelector.googleSSOText).verifyVisibleElement(
      "have.text",
      ssoText.googleSSOText
    );
  });

  it("Should verify Git SSO page elements", () => {
    SSO.defaultSSO(true);

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
    cy.get(ssoSelector.cancelButton)
      .eq(1)
      .verifyVisibleElement("have.text", ssoText.cancelButton);
    cy.get(ssoSelector.saveButton)
      .eq(1)
      .verifyVisibleElement("have.text", ssoText.saveButton);

    SSO.gitSSOPageElements();
    SSO.defaultSSO(false);
    cy.logoutApi();
    cy.visit("/login/my-workspace");

    cy.get(ssoSelector.gitIcon).should("be.visible");
    cy.get(ssoSelector.gitSignInText).verifyVisibleElement(
      "have.text",
      ssoText.gitSignInText
    );
  });
});
