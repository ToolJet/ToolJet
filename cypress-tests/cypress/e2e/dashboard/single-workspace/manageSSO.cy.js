import { ssoSelector } from "Selectors/manageSSO";
import * as common from "Support/utils/common";
import { ssoText } from "Texts/manageSSO";
import * as SSO from "Support/utils/manageSSO";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";

describe("Manage SSO for single workspace", () => {
  beforeEach(() => {
    cy.appUILogin();
  });
  it("Should verify General settings page elements", () => {
    common.navigateToManageSSO();
    // cy.get(ssoSelector.pagetitle).verifyVisibleElement("have.text", "SSO");
    cy.get(ssoSelector.cardTitle).verifyVisibleElement(
      "have.text",
      ssoText.generalSettingsElements.generalSettings
    );

    cy.get(
      ssoSelector.generalSettingsElements.generalSettings
    ).verifyVisibleElement(
      "have.text",
      ssoText.generalSettingsElements.generalSettings
    );
    cy.get(
      ssoSelector.generalSettingsElements.enableSignupLabel
    ).verifyVisibleElement(
      "have.text",
      ssoText.generalSettingsElements.enableSignupLabel
    );
    cy.get(ssoSelector.generalSettingsElements.helperText).verifyVisibleElement(
      "have.text",
      ssoText.generalSettingsElements.helperText
    );
    cy.get(
      ssoSelector.generalSettingsElements.allowedDomainLabel
    ).verifyVisibleElement(
      "have.text",
      ssoText.generalSettingsElements.allowedDomainLabel
    );
    cy.get(
      ssoSelector.generalSettingsElements.allowedDomainHelperText
    ).verifyVisibleElement(
      "have.text",
      ssoText.generalSettingsElements.allowedDomainHelperText
    );

    cy.get(ssoSelector.enableSignUpToggle).should("be.visible");
    cy.get(ssoSelector.allowedDomainInput).should("be.visible");
    cy.get(ssoSelector.cancelButton).verifyVisibleElement(
      "have.text",
      ssoText.cancelButton
    );
    cy.get(ssoSelector.saveButton).verifyVisibleElement(
      "have.text",
      ssoText.saveButton
    );

    SSO.generalSettingsSW();
  });

  it("Should verify Google SSO page elements", () => {
    common.navigateToManageSSO();
    cy.get(ssoSelector.google).should("be.visible").click();
    cy.get(ssoSelector.cardTitle)
      .should(($el) => {
        expect($el.contents().first().text().trim()).to.eq(ssoText.googleTitle);
      })
      .and("be.visible");
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

    cy.get(ssoSelector.redirectUrlLabel).verifyVisibleElement(
      "have.text",
      ssoText.redirectUrlLabel
    );
    cy.get(ssoSelector.redirectUrl).should("be.visible");
    common.logout();
    cy.get(ssoSelector.googleIcon).should("be.visible");
    cy.get(ssoSelector.googleSSOText).verifyVisibleElement(
      "have.text",
      ssoText.googleSSOText
    );
  });

  it("Should verify Git SSO page elements", () => {
    common.navigateToManageSSO();

    cy.get(ssoSelector.git).should("be.visible").click();
    cy.get(ssoSelector.cardTitle)
      .should(($el) => {
        expect($el.contents().first().text().trim()).to.eq(ssoText.gitTitle);
      })
      .and("be.visible");
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
    cy.get(ssoSelector.hostNameLabel).verifyVisibleElement(
      "have.text",
      ssoText.hostNameLabel
    );
    cy.get(ssoSelector.hostNameInput).should("be.visible");
    cy.get(ssoSelector.hostNameHelpText).verifyVisibleElement(
      "have.text",
      ssoText.hostNameHelpText
    );
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

    cy.get(ssoSelector.redirectUrlLabel).verifyVisibleElement(
      "have.text",
      ssoText.redirectUrlLabel
    );
    cy.get(ssoSelector.redirectUrl).should("be.visible");
    common.logout();
    cy.get(ssoSelector.gitTile).should("be.visible");
    cy.get(ssoSelector.gitIcon).should("be.visible");
    cy.get(ssoSelector.gitSSOText).verifyVisibleElement(
      "have.text",
      ssoText.gitSignInText
    );
  });

  it("Should verify Password login page elements", () => {
    common.navigateToManageSSO();

    cy.get(ssoSelector.password).should("be.visible").click();
    cy.get(ssoSelector.cardTitle)
      .should(($el) => {
        expect($el.contents().first().text().trim()).to.eq(
          ssoText.passwordTitle
        );
      })
      .and("be.visible");
    cy.get(ssoSelector.passwordEnableToggle).should("be.visible");

    SSO.passwordPageElements();
    common.logout();
  });

  it("Should verify the login and sign up page", () => {
    common.logout();
    SSO.signInPageElements();
    cy.appUILogin();

    common.navigateToManageSSO();
    cy.get(ssoSelector.enableSignUpToggle).then(($el) => {
      if (!$el.is(":checked")) {
        cy.get(ssoSelector.enableSignUpToggle).check();
      }
    });
    cy.get(ssoSelector.saveButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.ssoToast);

    common.logout();
    SSO.signInPageElements();
    cy.get(commonSelectors.signInSubHeader).verifyVisibleElement(
      "have.text",
      commonText.signInSubHeader
    );
    cy.get(commonSelectors.createAnAccountLink).click();
    SSO.SignUpPageElements();

    cy.get(commonSelectors.signInRedirectLink).click();
    cy.get(ssoSelector.signInHeader).verifyVisibleElement(
      "have.text",
      ssoText.signInHeader
    );
    cy.appUILogin();

    common.navigateToManageSSO();
    cy.get(ssoSelector.google).click();
    cy.get(ssoSelector.googleEnableToggle).uncheck();
    common.logout();
    cy.get(commonSelectors.createAnAccountLink).click();
    cy.notVisible(ssoSelector.googleSSOText);

    cy.get(commonSelectors.signInRedirectLink).click();
    cy.appUILogin();

    common.navigateToManageSSO();
    cy.get(ssoSelector.git).click();
    cy.get(ssoSelector.gitEnableToggle).uncheck();
    common.logout();
    cy.get(commonSelectors.createAnAccountLink).click();
    cy.notVisible(ssoSelector.googleSSOText);
    cy.notVisible(ssoSelector.gitSSOText);

    cy.get(commonSelectors.signInRedirectLink).click();
    cy.appUILogin();

    common.navigateToManageSSO();
    cy.get(ssoSelector.enableSignUpToggle).uncheck();
    cy.get(ssoSelector.saveButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.ssoToast);
    common.logout();
    cy.notVisible(commonSelectors.signInSubHeader);
  });
});
