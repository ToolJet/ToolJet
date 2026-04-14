import { commonSelectors } from "Selectors/common";
import { dashboardSelector } from "Selectors/dashboard";
import { dashboardUiSelector } from "Selectors/dashboardUi";
import {
  cancelModal,
  closeFolderDropdown,
  createFolder,
  deleteFolder,
  editFolder,
  navigateToAppEditor,
  openFolderDropdown,
  selectFolderFromDropdown,
  verifyTooltip,
  viewAppCardOptions
} from "Support/utils/common";
import { commonText } from "Texts/common";
import { dashboardText } from "Texts/dashboard";
import { dashboardUiText } from "Texts/dashboardUi";


export const verifyTopBar = () => {
  cy.get(commonSelectors.workspaceName).verifyVisibleElement(
    "have.text",
    "My workspace"
  );
  cy.get(commonSelectors.breadcrumbPageTitle).should(($el) => {
    expect($el.contents().first().text().trim()).to.eq(
      commonText.breadcrumbApplications
    );
  });
  cy.get(commonSelectors.appCreateButton).verifyVisibleElement(
    "have.text",
    dashboardText.createAppButton
  );
  cy.get(dashboardSelector.headerSearchBar).should("be.visible");
  // cy.get(dashboardSelector.buildWithAiButton).should("be.visible");
  cy.get(dashboardSelector.importDropdownMenu).should("be.visible");
};

export const verifyFolderBreadcrumb = () => {
  cy.get(dashboardSelector.folderLabel).should("be.visible");
  cy.get(dashboardSelector.folderLabel).should(($el) => {
    expect($el.contents().first().text().trim()).to.eq("Folders");
  });
  cy.get(commonSelectors.allApplicationsLink).verifyVisibleElement(
    "have.text",
    commonText.allApplicationsLink
  );
  openFolderDropdown();
  cy.get(dashboardSelector.folderDropdownList).should("be.visible");
  cy.get(commonSelectors.createNewFolderButton).should("be.visible");
  closeFolderDropdown();
};

export const verifyContentTabs = () => {
  cy.get(dashboardSelector.contentToolbar).should("be.visible");
  cy.get(dashboardSelector.appsTab).should("be.visible");
  cy.get(dashboardSelector.modulesTab).should("be.visible");
};

export const verifyNotificationsPanel = () => {
  cy.get(commonSelectors.notificationsIcon).should("be.visible").click();
  cy.get(commonSelectors.notificationsCard).should("be.visible");
  cy.get(commonSelectors.notificationsCardTitle).verifyVisibleElement(
    "have.text",
    commonText.notificationsCardTitle
  );
  cy.get(commonSelectors.emptyNotificationIcon).should("be.visible");
  cy.get(commonSelectors.emptyNotificationTitle).verifyVisibleElement(
    "have.text",
    commonText.emptyNotificationTitle
  );
  cy.get(commonSelectors.emptyNotificationSubtitle)
    .should("be.visible")
    .and(($el) => {
      expect($el.contents().first().text().trim()).to.eq(
        commonText.emptyNotificationSubtitle
      );
    });
  cy.get(commonSelectors.notificationsCardFooter).verifyVisibleElement(
    "have.text",
    commonText.viewReadNotifications
  );
};

export const verifyModeToggle = () => {
  cy.get(dashboardSelector.modeToggle).should("be.visible").click();
  cy.get(commonSelectors.mainWrapper)
    .should("have.attr", "class")
    .and("contain", "theme-dark");
  cy.get(dashboardSelector.modeToggle).click();
};

export const verifySettingsMenu = (version) => {
  cy.wait(500);
  cy.get(commonSelectors.settingsIcon).click();
  cy.get(dashboardSelector.versionLabel).verifyVisibleElement(
    "have.text",
    `Version ${version}`
  );
  cy.get(commonSelectors.marketplaceOption).verifyVisibleElement(
    "have.text",
    "Marketplace"
  );
  cy.get(commonSelectors.workspaceSettings).verifyVisibleElement(
    "have.text",
    "Workspace settings"
  );
  cy.get(commonSelectors.profileSettings).verifyVisibleElement(
    "have.text",
    "Profile settings"
  );
  cy.get(commonSelectors.logoutLink).verifyVisibleElement(
    "have.text",
    commonText.logoutLink
  );
};

export const verifyEmptyState = () => {
  cy.get(dashboardSelector.emptyPageContainer).should("be.visible");
  cy.get(dashboardSelector.emptyPageImage).should("be.visible");
  cy.get(dashboardSelector.emptyPageHeader).verifyVisibleElement(
    "have.text",
    dashboardText.emptyPageHeader
  );
  cy.get(dashboardSelector.emptyPageDescription).verifyVisibleElement(
    "have.text",
    dashboardText.emptyPageDescription
  );
  cy.get(dashboardSelector.emptyPageContainer)
    .find('[data-cy="create-an-app-button"]')
    .should("be.visible");
};

export const verifyImportDropdown = () => {
  cy.get(dashboardSelector.importDropdownMenu).click();
  cy.get(dashboardSelector.importAppButton).should("be.visible");
  cy.get(dashboardSelector.importAppButton)
    .invoke("text")
    .then((text) => {
      expect(text.trim()).equal(dashboardText.importAppButton);
    });
  cy.get(dashboardSelector.chooseFromTemplate).should("be.visible");
  cy.get(commonSelectors.breadcrumbPageTitle).click({ force: true });
};

export const verifySidebarIcons = () => {
  const env = Cypress.env("environment");
  verifyTooltip(dashboardSelector.modeToggle, "Mode");
  if (env === "Enterprise" || env === "Cloud") {
    cy.get(commonSelectors.homePageLogo).should("be.visible");
    verifyTooltip(commonSelectors.homePageIcon, "Home");
    verifyTooltip(commonSelectors.globalWorkFlowsIcon, "Workflows");
  }
  verifyTooltip(commonSelectors.dashboardIcon, "Apps");
  verifyTooltip(commonSelectors.databaseIcon, "ToolJet Database");
  verifyTooltip(commonSelectors.globalDataSourceIcon, "Data sources");
  verifyTooltip(commonSelectors.workspaceConstantsIcon, "Workspace constants");
  verifyTooltip(commonSelectors.notificationsIcon, "Comment notifications");
  
};

export const verifyPagination = () => {
  cy.get(dashboardSelector.paginationShowingLabel).should("be.visible");
  cy.get(dashboardSelector.paginationAppsCount).should("be.visible");
  cy.get(dashboardSelector.paginationPreviousButton).should("be.visible");
  cy.get(dashboardSelector.paginationNextButton).should("be.visible");
};

export const modifyAndVerifyAppCardIcon = (appName) => {
  // Open Change Icon dialog
  viewAppCardOptions(appName);
  cy.get(commonSelectors.appCardOptions(commonText.changeIconOption)).click();

  // Verify dialog structure
  cy.get(dashboardSelector.createAppTitle).should("not.exist"); // ensure it's the icon dialog
  cy.get('[data-cy="change-icon-title"]').verifyVisibleElement("have.text", dashboardText.changeIconTitle);
  cy.get(dashboardSelector.changeIconSearch).should("be.visible");
  cy.get(commonSelectors.buttonSelector(commonText.cancelButton)).should("be.visible");
  cy.get(dashboardSelector.changeButton).should("be.visible");

  // Cancel — should not change icon
  cancelModal(commonText.cancelButton);
  cy.get('[data-cy="change-icon-title"]').should("not.exist");

  // Reopen, search "Home", click first result, cancel again
  viewAppCardOptions(appName);
  cy.get(commonSelectors.appCardOptions(commonText.changeIconOption)).click();
  cy.clearAndType(dashboardSelector.changeIconSearch, "Home");
  cy.get('[data-index="0"] > div').click();
  cancelModal(commonText.cancelButton);

  // Reopen, search "Home", click first result, confirm change
  viewAppCardOptions(appName);
  cy.get(commonSelectors.appCardOptions(commonText.changeIconOption)).click();
  cy.clearAndType(dashboardSelector.changeIconSearch, "Home");
  cy.wait(1000)
  cy.get('[data-index="0"] > div').click();
  cy.get(dashboardSelector.changeButton).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, dashboardText.iconUpdatedToast);

  cy.get(commonSelectors.appCard(appName)).should("exist");
  cy.get('[data-cy="app-card-IconBrandGoogleHome-icon"]').should("exist");


  cy.get('[data-cy="change-icon-title"]').should("not.exist");

};

export const addAppToFolder = (appName, folderName) => {
  viewAppCardOptions(appName);
  cy.get('[data-cy="add-to-folder-card-option"]').click();
  cy.get(dashboardSelector.selectFolder).should("be.visible");
  cy.clearAndType('[data-cy="search-folder-input"]', folderName);
  cy.get('[data-cy="folder-list"] li[role="button"]').first().click();
  cy.get(dashboardSelector.addToFolderButton).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    commonText.AddedToFolderToast,
    false
  );
};

export const renameApp = (appName, newAppName) => {
  viewAppCardOptions(appName);
  cy.get('[data-cy="rename-app-card-option"]').click();
  cy.clearAndType(commonSelectors.appNameInput, newAppName);
  cy.get('[data-cy="rename-front-end-button"]').click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    commonText.appRenamedToast,
    false
  );
};

export const cloneApp = (appName) => {
  viewAppCardOptions(appName);
  cy.get('[data-cy="clone-app-card-option"]').click();
  cy.get('[data-cy="clone-front-end-button"]').click();
};

export const deleteApp = (appName) => {
  viewAppCardOptions(appName);
  cy.get('[data-cy="delete-app-card-option"]').click();
  cy.get(commonSelectors.modalMessage).should("be.visible");
  cy.get('[data-cy="delete-front-end-button"]').click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    commonText.appDeletedToast,
    false
  );
};



export const verifyRenameAppDialog = (appName, renamedAppName) => {
  viewAppCardOptions(appName);
  cy.get('[data-cy="rename-app-card-option"]').click();

  cy.get(commonSelectors.modalComponent).should("be.visible");
  cy.get(commonSelectors.renameApptitle).verifyVisibleElement(
    "have.text",
    "Rename app"
  );
  cy.get(commonSelectors.appNameLabel).verifyVisibleElement(
    "have.text",
    "App name"
  );
  cy.get(commonSelectors.appNameInput).should("have.value", appName);
  cy.get(commonSelectors.appNameErrorLabel).verifyVisibleElement(
    "have.text",
    "App name must be unique and max 50 characters"
  );
  cy.get(
    commonSelectors.buttonSelector(commonText.cancelButton)
  ).verifyVisibleElement("have.text", commonText.cancelButton);
  cy.get('[data-cy="rename-front-end-button"]').should("be.disabled");

  cy.clearAndType(commonSelectors.appNameInput, renamedAppName);
  cy.get('[data-cy="rename-front-end-button"]').should("not.be.disabled");
  cancelModal(commonText.cancelButton);
  cy.get(commonSelectors.appCard(appName)).should("be.visible");
  cy.get(commonSelectors.appCard(renamedAppName)).should("not.exist");
};

export const verifyRenameAndCleanup = (appName, renamedAppName) => {
  renameApp(appName, renamedAppName);
  cy.get(commonSelectors.appCard(renamedAppName)).should("be.visible");
  cy.get(commonSelectors.appTitle(renamedAppName)).first().should("have.text", renamedAppName);
  cy.get(commonSelectors.appCard(appName)).should("not.exist");

  deleteApp(renamedAppName);
  cy.get(commonSelectors.appCard(renamedAppName)).should("not.exist");
};

export const verifyFolderAddAndRemove = (appName, folderName, type='applications') => {
  addAppToFolder(appName, folderName);

  cy.wait(1000)
  openFolderDropdown();
  cy.get(dashboardSelector.folderName(folderName)).verifyVisibleElement(
    "have.text",
    folderName
  );

  selectFolderFromDropdown(folderName);
  cy.wait(1000)
  cy.get(commonSelectors.appCard(appName))
    .contains(appName)
    .should("be.visible");

  viewAppCardOptions(appName);

  cy.get(commonSelectors.appCardOptions(commonText.removeFromFolderOption))
    .verifyVisibleElement("have.text", commonText.removeFromFolderOption)
    .click();
  cy.get(commonSelectors.modalComponent).should("be.visible");
  cy.get(commonSelectors.modalMessage).verifyVisibleElement(
    "have.text",
    commonText.appRemovedFromFolderMessage
  );
  cy.get(commonSelectors.buttonSelector(commonText.cancelButton))
    .should("be.visible")
    .and("have.text", commonText.cancelButton);
  cy.get('[data-cy="remove-app-from-folder-button"]')
    .should("be.visible")
    .and("have.text", "Remove app from folder");

  cancelModal(commonText.cancelButton);

  viewAppCardOptions(appName);
  cy.get(
    commonSelectors.appCardOptions(commonText.removeFromFolderOption)
  ).click();
  cy.get('[data-cy="remove-app-from-folder-button"]').click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    commonText.appRemovedFromFolderTaost,
    false
  );

  cy.get(commonSelectors.modalComponent).should("not.exist");

  //There is a bug uncomment after bug fix
  // cy.get(commonSelectors.empytyFolderImage).should("be.visible");
  cy.wait(1000);
  // cy.get(commonSelectors.emptyFolderText).verifyVisibleElement(
  //   "have.text",
  //   commonText.emptyFolderText
  // );

  selectFolderFromDropdown(`all ${type}`);
  deleteFolder(folderName);

  selectFolderFromDropdown(`all ${type}`);
};

export const verifyExportApp = (appName) => {
  cy.wait(1000);
  viewAppCardOptions(appName);
  cy.get(commonSelectors.appCardOptions(commonText.exportAppOption)).click();
  cy.get(commonSelectors.exportAllButton).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    'App has been exported successfully!',
    false
  );
  cy.wait(3000)


  cy.exec("ls ./cypress/downloads/").then((result) => {
    const downloadedAppExportFileName = result.stdout.split("\n")[0];
    expect(downloadedAppExportFileName).to.contain.string("app");
  });
};

export const verifyCloneApp = (appName, cloneAppName) => {
  cloneApp(appName);
  cy.get(".go3958317564")
    .should("be.visible")
    .and("have.text", dashboardText.appClonedToast);
  cy.wait(3000);

  cy.get(commonSelectors.editorAppNameInput).click();
  cy.clearAndType(commonSelectors.appNameInput, cloneAppName);
  cy.get('[data-cy="rename-app"]').click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    commonText.appRenamedToast
  );

  cy.backToApps();
  cy.wait("@appLibrary");
  cy.wait(2000);

  cy.get(commonSelectors.appCard(cloneAppName)).should("be.visible");

  cy.wait(1000);

  viewAppCardOptions(cloneAppName);

  cy.get(commonSelectors.deleteAppOption).click();
  cy.get(commonSelectors.modalMessage).verifyVisibleElement(
    "have.text",
    commonText.deleteAppModalMessage(cloneAppName)
  );
  cy.get(
    commonSelectors.buttonSelector(commonText.cancelButton)
  ).verifyVisibleElement("have.text", commonText.cancelButton);
  cy.get('[data-cy="delete-front-end-button"]').verifyVisibleElement(
    "have.text",
    "Delete app"
  );
  cancelModal(commonText.cancelButton);

  deleteApp(cloneAppName);

  cy.get(commonSelectors.appCard(cloneAppName)).should("not.exist");
  cy.wait("@appLibrary");
};

export const verifyAppDelete = (appName) => {
  cy.get("body").should("exist").and("be.visible");
  cy.get('[data-cy="dashboard-section-header"]').should("be.visible");
  cy.get("body").then(($title) => {
    if (!$title.text().includes(commonText.introductionMessage)) {
      cy.clearAndType(commonSelectors.homePageSearchBar, appName);
      cy.get(commonSelectors.appCard(appName)).should("not.exist");
      cy.get(commonSelectors.homePageSearchBar).clear();
    }
  });
};

export const verifyCreateFolderDialog = (folderName) => {
  openFolderDropdown();
  cy.get(commonSelectors.createNewFolderButton).click();
  cy.get(commonSelectors.modalComponent).should("be.visible");
  cy.get('[data-cy="create-folder-title"]').should("be.visible").and("have.text", "Create folder");
  cy.get(commonSelectors.folderNameInput).should("be.visible");
  cy.get(commonSelectors.buttonSelector(commonText.cancelButton)).should("be.visible");
  cy.get('[data-cy="create-folder-button"]').should("be.visible");
  cancelModal(commonText.cancelButton);
  cy.contains(folderName).should("not.exist");

  openFolderDropdown();
  cy.get(commonSelectors.createNewFolderButton).click();
  cy.clearAndType(commonSelectors.folderNameInput, folderName);
  cancelModal(commonText.cancelButton);
  cy.contains(folderName).should("not.exist");

  // Create folder
  createFolder(folderName);
  cy.get(commonSelectors.modalComponent).should("not.exist");
};

export const verifyFolderEmptyState = (folderName) => {
  openFolderDropdown();
  cy.get(dashboardSelector.folderName(folderName)).verifyVisibleElement(
    "have.text",
    dashboardText.folderName(folderName)
  );
  selectFolderFromDropdown(folderName);
  cy.get(commonSelectors.empytyFolderImage).should("be.visible");
  cy.get(commonSelectors.emptyFolderText).verifyVisibleElement(
    "have.text",
    commonText.emptyFolderText
  );
};

export const verifyFolderEditAndRename = (folderName, updatedFolderName) => {
  cy.reloadAppForTheElement(folderName);
  selectFolderFromDropdown(folderName);
  openFolderDropdown();
  cy.get('[data-cy="edit-folder-icon-button"]').should("be.visible");
  cy.get('[data-cy="delete-folder-icon-button"]').should("be.visible");

  cy.get('[data-cy="edit-folder-icon-button"]').click();
  cy.get(commonSelectors.modalComponent).should("be.visible");
  cy.get('[data-cy="edit-folder-title"]')
    .should("be.visible")
    .and("have.text", "Edit folder");
  cy.get(commonSelectors.folderNameInput).should("be.visible");
  cy.get(commonSelectors.buttonSelector(commonText.cancelButton))
    .should("be.visible")
    .and("have.text", commonText.cancelButton);
  cy.get('[data-cy="edit-folder-button"]')
    .should("be.visible")
    .and("have.text", "Edit folder");
  cy.clearAndType(commonSelectors.folderNameInput, updatedFolderName);
  cancelModal(commonText.cancelButton);

  openFolderDropdown();
  cy.get(dashboardSelector.folderName(updatedFolderName)).should("not.exist");

  editFolder(folderName, updatedFolderName);
  cy.get(commonSelectors.modalComponent).should("not.exist");

  openFolderDropdown();
  cy.get(dashboardSelector.folderName(updatedFolderName))
    .should("exist")
    .and("be.visible");
};

export const verifyFolderDeleteDialog = (updatedFolderName) => {
  cy.reloadAppForTheElement(updatedFolderName);
  selectFolderFromDropdown(updatedFolderName);
  openFolderDropdown();
  cy.get('[data-cy="delete-folder-icon-button"]').click();
  cy.get(commonSelectors.modalComponent).should("be.visible");
  cy.get(commonSelectors.modalMessage).verifyVisibleElement(
    "have.text",
    commonText.folderDeleteModalMessage
  );
  cancelModal(commonText.cancelButton);

  openFolderDropdown();
  cy.get(dashboardSelector.folderName(updatedFolderName))
    .should("exist")
    .and("be.visible");
};

// ── dashboardUi utilities (type-agnostic, driven by config objects) ──────────

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
  if (type == "workflow") {
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
      expect(downloadedFileName).to.match(/\.(json|zip)$/);
    }
  });
};

export const verifyCloneForType = (itemName, cloneItemName, config, type = "app") => {
  viewAppCardOptions(itemName, type);
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
