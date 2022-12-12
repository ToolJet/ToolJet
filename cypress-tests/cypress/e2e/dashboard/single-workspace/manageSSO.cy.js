import { ssoSelector } from "Selectors/manageSSO";
import * as common from "Support/utils/common";
import { ssoText } from "Texts/manageSSO";
import * as SSO from "Support/utils/manageSSO";

describe("Manage SSO for single workspace", () => {
  before(() => {
    cy.appUILogin();
  });
  it("Should verify General settings page elements", () => {
    common.navigateToManageSSO();
    cy.get(ssoSelector.pagetitle).verifyVisibleElement(
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
    cy.get(ssoSelector.enableCheckbox).should("be.visible");
    cy.get(ssoSelector.domainInput).should("be.visible");
    cy.get(ssoSelector.cancelButton).verifyVisibleElement(
      "have.text",
      ssoText.cancelButton
    );
    cy.get(ssoSelector.saveButton).verifyVisibleElement(
      "have.text",
      ssoText.saveButton
    );

    SSO.generalSettings();
  });

  it("Should verify Google SSO page elements", () => {
    cy.get(ssoSelector.google).should("be.visible").click();
    cy.get(ssoSelector.cardTitle)
      .should(($el) => {
        expect($el.contents().first().text().trim()).to.eq(ssoText.googleTitle);
      })
      .and("be.visible");
    cy.get(ssoSelector.enableCheckbox).should("be.visible");
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

    SSO.googleSSO();

    cy.get(ssoSelector.redirectUrlLabel).verifyVisibleElement(
      "have.text",
      ssoText.redirectUrlLabel
    );
    cy.get(ssoSelector.redirectUrl).should("be.visible");
    common.logout();
    cy.get(ssoSelector.googleTile).should("be.visible");
    cy.get(ssoSelector.googleIcon).should("be.visible");
    cy.get(ssoSelector.googleSignInText).verifyVisibleElement(
      "have.text",
      ssoText.googleSignInText
    );
  });

  it("Should verify Git SSO page elements", () => {
    cy.appUILogin();
    common.navigateToManageSSO();

    cy.get(ssoSelector.git).should("be.visible").click();
    cy.get(ssoSelector.cardTitle)
      .should(($el) => {
        expect($el.contents().first().text().trim()).to.eq(ssoText.gitTitle);
      })
      .and("be.visible");
    cy.get(ssoSelector.enableCheckbox).should("be.visible");
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

    SSO.gitSSO();

    cy.get(ssoSelector.redirectUrlLabel).verifyVisibleElement(
      "have.text",
      ssoText.redirectUrlLabel
    );
    cy.get(ssoSelector.redirectUrl).should("be.visible");
    common.logout();
    cy.get(ssoSelector.gitTile).should("be.visible");
    cy.get(ssoSelector.gitIcon).should("be.visible");
    cy.get(ssoSelector.gitSignInText).verifyVisibleElement(
      "have.text",
      ssoText.gitSignInText
    );
  });

  it("Should verify Password login page elements", () => {
    cy.appUILogin();
    common.navigateToManageSSO();

    cy.get(ssoSelector.password).should("be.visible").click();
    cy.get(ssoSelector.cardTitle)
      .should(($el) => {
        expect($el.contents().first().text().trim()).to.eq(
          ssoText.passwordTitle
        );
      })
      .and("be.visible");
    cy.get(ssoSelector.enableCheckbox).should("be.visible");

    SSO.password();
  });
});
