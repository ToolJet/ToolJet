import { commonSelectors } from "Selectors/common";
import { dashboardSelector } from "Selectors/dashboard";
import { dashboardText } from "Texts/dashboard";
import { commonText } from "Texts/common";
import {
  viewAppCardOptions,
  verifyModal,
  closeModal,
  cancelModal,
} from "Support/utils/common";

export const login = () => {
  cy.visit("/");
  cy.clearAndType(commonSelectors.workEmailInputField, "dev@tooljet.io");
  cy.clearAndType(commonSelectors.passwordInputField, "password");
  cy.get(commonSelectors.loginButton).click();
};

export const modifyAndVerifyAppCardIcon = (appName) => {
  var random = function (obj) {
    var keys = Object.keys(obj);
    return obj[keys[(keys.length * Math.random()) << 0]];
  };
  const randomIcon = random(dashboardText.iconText);

  cy.get(commonSelectors.appCardOptions(commonText.changeIconOption)).click();

  verifyModal(dashboardText.changeIconTitle, dashboardText.changeButton);
  for (const icons in dashboardText.iconText) {
    cy.get(dashboardSelector.appIcon(dashboardText.iconText[icons])).should(
      "be.visible"
    );
  }
  closeModal(commonText.closeButton);

  viewAppCardOptions(appName);
  cy.get(commonSelectors.appCardOptions(commonText.changeIconOption)).click();
  cy.get(".modal-body")
    .parent()
    .within(() => {
      cy.get(dashboardSelector.appIcon(randomIcon)).first().click();
    });
  cancelModal(commonText.cancelButton);

  viewAppCardOptions(appName);
  cy.get(commonSelectors.appCardOptions(commonText.changeIconOption)).click();

  cy.get(".modal-body")
    .parent()
    .within(() => {
      cy.get(dashboardSelector.appIcon(randomIcon)).first().click();
    });
  cy.get(dashboardSelector.changeButton).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    dashboardText.iconUpdatedToast
  );
  cy.get(commonSelectors.appCard(appName)).should("exist");
  cy.get(dashboardText.modalComponent).should("not.exist");
};

export const verifyAppDelete = (appName) => {
  cy.get("body").then(($title) => {
    if (!$title.text().includes(commonText.introductionMessage)) {
      cy.clearAndType(commonSelectors.homePageSearchBar, appName);
      cy.get(commonSelectors.appCard(appName)).should("not.exist");
      cy.get(commonSelectors.homePageSearchBar).clear();
    }
  });
};
