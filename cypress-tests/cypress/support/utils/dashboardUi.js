import { commonSelectors } from "Selectors/common";
import { dashboardSelector } from "Selectors/dashboard";
import { dashboardUiSelector } from "Selectors/dashboardUi";
import {
  cancelModal,
  openFolderDropdown,
  selectFolderFromDropdown,
  viewAppCardOptions,
} from "Support/utils/common";
import { commonText } from "Texts/common";
import { dashboardUiText } from "Texts/dashboardUi";

export const verifyTopBarForType = (config) => {
  cy.get(commonSelectors.breadcrumbPageTitle).should(($el) => {
    expect($el.contents().first().text().trim()).to.eq(config.breadcrumbTitle);
  });
  cy.get(dashboardSelector.headerSearchBar).should("be.visible");
  cy.get(dashboardSelector.importDropdownMenu).should("be.visible");
};

export const verifyFolderBreadcrumbForType = (config) => {
  cy.get(dashboardSelector.folderLabel).should("be.visible");
  cy.get(dashboardSelector.folderLabel).should(($el) => {
    expect($el.contents().first().text().trim()).to.eq(commonText.folderInfo);
  });
  cy.get(commonSelectors.allApplicationsLink).verifyVisibleElement(
    "have.text",
    config.allItemsLinkText
  );
  openFolderDropdown();
  cy.get(dashboardSelector.folderDropdownList).should("be.visible");
  cy.get(commonSelectors.createNewFolderButton).should("be.visible");
  cy.get(commonSelectors.allApplicationsLink).click({ force: true });
};

export const verifyEmptyStateForType = (config) => {
  cy.get(config.emptyStateSelector).should("be.visible");
  cy.get(config.emptyStateImageSelector).should("be.visible");
  cy.get(config.emptyStateHeaderSelector).verifyVisibleElement(
    "have.text",
    config.emptyStateHeaderText
  );
  cy.get(config.emptyStateDescSelector).verifyVisibleElement(
    "have.text",
    config.emptyStateDescText
  );
  cy.get(config.emptyStateSelector)
    .find(config.createButtonSelector)
    .should("be.visible");
};

export const verifyImportDropdownForType = (config) => {
  cy.get(dashboardSelector.importDropdownMenu).click();
  cy.get(dashboardSelector.importAppButton).should("be.visible");
  cy.get(dashboardSelector.importAppButton)
    .invoke("text")
    .then((text) => {
      expect(text.trim()).equal(dashboardUiText.importFromDeviceLabel);
    });
  if (config.hasTemplateImport) {
    cy.get(dashboardSelector.chooseFromTemplate).should("be.visible");
  } else {
    cy.get(dashboardSelector.chooseFromTemplate).should("not.exist");
  }
  cy.get(commonSelectors.breadcrumbPageTitle).click({ force: true });
};

export const verifyCardOptionsForType = (itemName, config) => {
  viewAppCardOptions(itemName);

  cy.get(config.renameOptionSelector).verifyVisibleElement(
    "have.text",
    config.renameOptionText
  );
  cy.get(
    commonSelectors.appCardOptions(commonText.changeIconOption)
  ).verifyVisibleElement("have.text", commonText.changeIconOption);
  cy.get(
    commonSelectors.appCardOptions(commonText.addToFolderOption)
  ).verifyVisibleElement("have.text", commonText.addToFolderOption);

  if (config.hasClone) {
    cy.get(config.cloneOptionSelector).verifyVisibleElement(
      "have.text",
      config.cloneOptionText
    );
  } else {
    cy.get(dashboardUiSelector.cloneAppCardOption).should("not.exist");
    cy.get(dashboardUiSelector.cloneWorkflowCardOption).should("not.exist");
  }

  cy.get(config.exportOptionSelector).verifyVisibleElement(
    "have.text",
    config.exportOptionText
  );
  cy.get(config.deleteOptionSelector).verifyVisibleElement(
    "have.text",
    config.deleteOptionText
  );

  // Dismiss the menu
  cy.get(commonSelectors.allApplicationsLink).click({ force: true });
};

export const verifyExportForType = (itemName, config, type) => {
  cy.wait(1000);
  viewAppCardOptions(itemName);
  cy.get(config.exportOptionSelector).click();
  if(type=="workflow"){
    cy.get(commonSelectors.exportAllButton).click();
  }
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    config.exportToast,
    false
  );
  cy.wait(3000);
  cy.exec("ls ./cypress/downloads/").then((result) => {
    const downloadedFileName = result.stdout.split("\n")[0];
    if (config.exportFileContains) {
      expect(downloadedFileName).to.contain.string(config.exportFileContains);
    } else {
      // Module: just verify extension
      expect(downloadedFileName).to.match(/\.(json|zip)$/);
    }
  });
};

export const verifyCloneForType = (itemName, cloneItemName, config) => {
  viewAppCardOptions(itemName);
  cy.get(config.cloneOptionSelector).click();

  if (config.cloneNameInputSelector) {
    // Module-style clone: name input modal
    cy.clearAndType(config.cloneNameInputSelector, cloneItemName);
    cy.get(config.cloneConfirmButtonSelector).click();
    cy.url().should("include", "/apps/");
    cy.wait(3000);

    cy.visit(config.listingUrl);
    cy.wait(1500);
    cy.get(commonSelectors.appCard(cloneItemName), { timeout: 10000 }).should("be.visible");

    cy.wait(1000);
    viewAppCardOptions(cloneItemName);
    cy.get(config.deleteOptionSelector).click();
    cy.get(commonSelectors.modalMessage).should("be.visible");
    cy.get(
      commonSelectors.buttonSelector(commonText.cancelButton)
    ).verifyVisibleElement("have.text", commonText.cancelButton);
    cy.get(config.deleteConfirmSelector).verifyVisibleElement(
      "have.text",
      config.deleteOptionText
    );
    cancelModal(commonText.cancelButton);

    deleteItemForType(cloneItemName, config);
    cy.get(commonSelectors.appCard(cloneItemName)).should("not.exist");
  } else {
    // App-style clone: auto-navigate to editor
    cy.get(commonSelectors.toastMessage)
      .should("be.visible")
      .and("have.text", config.cloneToast);
    cy.wait(3000);

    cy.get(commonSelectors.editorAppNameInput).click();
    cy.renameApp(cloneItemName);
    cy.apiAddComponentToApp(cloneItemName, "button", 25, 25);
    cy.backToApps();
    cy.wait(1000);

    cy.get(commonSelectors.appCard(cloneItemName)).should("be.visible");
    cy.wait(1000);

    viewAppCardOptions(cloneItemName);
    cy.get(commonSelectors.deleteAppOption).click();
    cy.get(commonSelectors.modalMessage).verifyVisibleElement(
      "have.text",
      commonText.deleteAppModalMessage(cloneItemName)
    );
    cy.get(
      commonSelectors.buttonSelector(commonText.cancelButton)
    ).verifyVisibleElement("have.text", commonText.cancelButton);
    cy.get(config.deleteConfirmSelector).verifyVisibleElement(
      "have.text",
      config.deleteOptionText
    );
    cancelModal(commonText.cancelButton);

    deleteItemForType(cloneItemName, config);
    cy.get(commonSelectors.appCard(cloneItemName)).should("not.exist");
  }
};

export const deleteItemForType = (itemName, config) => {
  viewAppCardOptions(itemName);
  cy.get(config.deleteOptionSelector).click();
  cy.get(config.deleteConfirmSelector).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    config.deleteToast,
    false
  );
  cy.get(commonSelectors.appCard(itemName)).should("not.exist");
};

export const verifyFolderEmptyStateForType = (folderName, config) => {
  openFolderDropdown();
  cy.get(dashboardSelector.folderName(folderName)).verifyVisibleElement(
    "have.text",
    folderName
  );
  selectFolderFromDropdown(folderName);
  cy.get(config.folderEmptyStateImageSelector).should("be.visible");
  cy.get(config.folderEmptyStateHeaderSelector).verifyVisibleElement(
    "have.text",
    config.folderEmptyStateHeaderText
  );
};
