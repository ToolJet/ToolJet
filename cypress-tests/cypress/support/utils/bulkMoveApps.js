import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { dashboardSelector } from "Selectors/dashboard";
import { viewAppCardOptions } from "Support/utils/common";

export const openAddToFolderModal = (appName) => {
  viewAppCardOptions(appName);
  cy.get(commonSelectors.appCardOptions(commonText.addToFolderOption)).click();
  cy.get(commonSelectors.modalComponent).should("be.visible");
};

export const addAppsToMultiSelect = (...appNames) => {
  appNames.forEach((name) => {
    cy.get(dashboardSelector.appsMultiSelectControl)
      .find('input')
      .click({ force: true })
      .type(name, { force: true });
    cy.get(commonSelectors.folderList).contains(name).click();
  });
};

export const selectDestinationFolder = (folderName) => {
  cy.get(dashboardSelector.selectFolder).click();
  cy.get(commonSelectors.folderList).contains(folderName).click();
};
