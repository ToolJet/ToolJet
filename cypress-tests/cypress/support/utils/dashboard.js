import { commonSelectors } from "Selectors/common";
import { dashboardSelector } from "Selectors/dashboard";
import { dashboardText } from "Texts/dashboard";
import { loginSelectors } from "Selectors/login";
import { commonText } from "Texts/common";

export const login = () => {
  cy.visit("/");
  cy.clearAndType(loginSelectors.emailField, "dev@tooljet.io");
  cy.clearAndType(loginSelectors.passwordField, "password");
  cy.get(loginSelectors.signInButton).click();
};

export const modifyAndVerifyAppCardIcon = () => {
  var random = function (obj) {
    var keys = Object.keys(obj);
    return obj[keys[(keys.length * Math.random()) << 0]];
  };
  const randomIcon = random(dashboardText.iconText);

  cy.get(commonSelectors.changeIconOption).click();
  cy.get(commonSelectors.modalComponent).should("be.visible");
  cy.get(dashboardSelector.changeIconTitle)
    .should("be.visible")
    .and("have.text", dashboardText.changeIconTitle);
  cy.get(commonSelectors.modalCloseButton).should("be.visible");
  for (const icons in dashboardText.iconText) {
    cy.get(dashboardSelector.appIcon(dashboardText.iconText[icons])).should(
      "be.visible"
    );
  }
  cy.get(commonSelectors.cancelButton)
    .should("be.visible")
    .and("have.text", commonText.cancelButton);
  cy.get(dashboardSelector.changeButton)
    .should("be.visible")
    .and("have.text", dashboardText.changeButton);

  cy.get(commonSelectors.modalCloseButton).click();
  cy.get(dashboardSelector.appCardDefaultIcon).should("exist");
  cy.get(dashboardText.modalComponent).should("not.exist");

  cy.get(commonSelectors.appCardOptions).first().click();
  cy.get(commonSelectors.changeIconOption).click();
  cy.get(dashboardSelector.appIcon(randomIcon)).click();
  cy.get(commonSelectors.cancelButton).click();
  cy.get(dashboardSelector.appCardDefaultIcon).should("exist");
  cy.get(dashboardText.modalComponent).should("not.exist");

  cy.get(commonSelectors.appCardOptions).first().click();
  cy.get(commonSelectors.changeIconOption).click();

  cy.get(dashboardSelector.appIcon(randomIcon)).click();
  cy.get(dashboardSelector.changeButton).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    dashboardText.iconUpdatedToast
  );
  cy.get(dashboardSelector.appCardIcon(randomIcon)).should("exist");
  cy.get(dashboardText.modalComponent).should("not.exist");
};

export const verifyAppDelete = (appName) => {
  cy.get("body").then(($title) => {
    if ($title.text().includes(commonText.introductionMessage)) {
      cy.log("dashboard is empty");
    } else {
      cy.get(commonSelectors.appCard).contains(appName).should("not.exist");
    }
  });
};
