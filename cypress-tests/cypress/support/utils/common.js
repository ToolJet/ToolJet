// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// common.js
//   navigateToProfile                nav.profile          → common
//   logout                           session.logout       → common
//   navigateToManageUsers            nav.manageUsers      → common
//   navigateToManageGroups           nav.manageGroups     → common
//   navigateToWorkspaceVariable      nav.workspaceVariable → common
//   navigateToManageSSO              nav.manageSSO        → common
//   randomDateOrTime                 -                    → common
//   createFolder                     folder.create        → apps
//   deleteFolder                     folder.delete        → apps
//   deleteDownloadsFolder            -                    → common
//   navigateToAppEditor              app.openEditor       → apps
//   viewAppCardOptions               app.openCardMenu     → apps
//   viewFolderCardOptions            folder.openCardMenu  → apps
//   verifyModal                      modal.verify         → common
//   verifyConfirmationModal          modal.verifyConfirmation → common
//   closeModal                       modal.close          → common
//   cancelModal                      modal.cancel         → common
//   navigateToAuditLogsPage          nav.auditLogs        → common
//   manageUsersPagination            user.paginate        → access
//   searchUser                       user.search          → access
//   selectAppCardOption              app.selectCardOption → apps
//   navigateToDatabase               nav.database         → common
//   randomValue                      -                    → common
//   verifyTooltip                    -                    → common
//   pinInspector                     inspector.pin        → apps
//   navigateToworkspaceConstants     nav.workspaceConstants → workspace
//   releaseApp                       app.release          → apps
//   verifyTooltipDisabled            -                    → common
//   fillInputField                   -                    → common
//   navigateToSettingPage            nav.settings         → common
//   apiUpdateInstanceSettings        instanceSetting.updateApi → superAdmin
//   sanitize                         -                    → common
// └──────────────────────────────────────────────────────────────────┘
import moment from "moment";
import {
  commonSelectors,
  commonWidgetSelector,
  cyParamName,
} from "Selectors/common";
import { commonEeSelectors, multiEnvSelector } from "Selectors/platform/eeCommon";
import { profileSelector } from "Selectors/platform/profile";
import { appPromote } from "Support/utils/platform/multiEnv";
import { commonText, path } from "Texts/common";

/**
 * @tjType   nav.profile
 * @tjBlock  common
 * @tjUsage  navigateToProfile()
 * @tjDom    avatar menu -> profile
 */
export const navigateToProfile = () => {
  cy.get(commonSelectors.settingsIcon).click();
  cy.get(commonSelectors.profileSettings).click();
  cy.url().should("include", "settings");
};

/**
 * @tjType   session.logout
 * @tjBlock  common
 * @tjUsage  logout()
 * @tjDom    avatar menu -> logout
 */
export const logout = () => {
  cy.get(commonSelectors.settingsIcon).click();
  cy.get(commonSelectors.logoutLink).click();
  cy.wait(1000);
};

/**
 * @tjType   nav.manageUsers
 * @tjBlock  common
 * @tjUsage  navigateToManageUsers()
 * @tjDom    workspace settings -> manage users
 */
export const navigateToManageUsers = () => {
  cy.get(commonSelectors.settingsIcon).click();
  cy.get(commonSelectors.workspaceSettings).click();
  cy.get(commonSelectors.manageUsersOption).click({ force: true });
};

/**
 * @tjType   nav.manageGroups
 * @tjBlock  common
 * @tjUsage  navigateToManageGroups()
 * @tjDom    workspace settings -> manage groups
 */
export const navigateToManageGroups = () => {
  cy.get(commonSelectors.settingsIcon).click();
  cy.get(commonSelectors.workspaceSettings).click();
  cy.get(commonSelectors.manageGroupsOption).click();
};

/**
 * @tjType   nav.workspaceVariable
 * @tjBlock  common
 * @tjUsage  navigateToWorkspaceVariable()
 * @tjDom    workspace settings -> variables. [UNREFERENCED 2026-09-06]
 */
export const navigateToWorkspaceVariable = () => {
  cy.get(commonSelectors.settingsIcon).click();
  cy.get(commonSelectors.workspaceSettings).click();
  cy.get(commonSelectors.workspaceVariableOption).click();
};

/**
 * @tjType   nav.manageSSO
 * @tjBlock  common
 * @tjUsage  navigateToManageSSO()
 * @tjDom    workspace settings -> SSO
 */
export const navigateToManageSSO = () => {
  cy.get(commonSelectors.settingsIcon).click();
  cy.get(commonSelectors.workspaceSettings).click();
  cy.get(commonSelectors.manageSSOOption).click();
};

/**
 * @tjType   -
 * @tjBlock  common
 * @tjUsage  randomDateOrTime('DD/MM/YYYY')
 * @tjDom    none - data generator. [UNREFERENCED 2026-09-06]
 */
export const randomDateOrTime = (format = "DD/MM/YYYY") => {
  let endDate = new Date();
  let startDate = new Date(2018, 0, 1);
  startDate = new Date(
    startDate.getTime() +
    Math.random() * (endDate.getTime() - startDate.getTime())
  );
  return moment(startDate).format(format);
};

/**
 * @tjType   folder.create
 * @tjBlock  apps
 * @tjUsage  createFolder('QA folder')
 * @tjDom    dashboard -> create folder modal
 */
export const createFolder = (folderName) => {
  cy.intercept("POST", "/api/folders").as("folderCreated");
  cy.get(commonSelectors.createNewFolderButton).click();
  cy.clearAndType(commonSelectors.folderNameInput, folderName);
  cy.get(commonSelectors.buttonSelector(commonText.createFolderButton)).click();
  cy.wait("@folderCreated");
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    commonText.folderCreatedToast
  );
};

/**
 * @tjType   folder.delete
 * @tjBlock  apps
 * @tjUsage  deleteFolder('QA folder')
 * @tjDom    folder card menu -> delete -> confirm
 */
export const deleteFolder = (folderName) => {
  viewFolderCardOptions(folderName);
  cy.get(commonSelectors.deleteFolderOption(folderName)).click();
  cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
  cy.wait("@folderDeleted");
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    commonText.folderDeletedToast
  );
};

/**
 * @tjType   -
 * @tjBlock  common
 * @tjUsage  deleteDownloadsFolder()
 * @tjDom    none - clears cypress/downloads
 */
export const deleteDownloadsFolder = () => {
  cy.exec("cd ./cypress/downloads/ && rm -rf *", {
    failOnNonZeroExit: false,
  });
};

/**
 * @tjType   app.openEditor
 * @tjBlock  apps
 * @tjUsage  navigateToAppEditor('MyApp')
 * @tjDom    dashboard -> app card -> edit
 */
export const navigateToAppEditor = (appName) => {
  cy.get(commonSelectors.appCard(appName))
    .trigger("mousehover")
    .trigger("mouseenter")
    .find(commonSelectors.editButton)
    .click({ force: true });
  if (Cypress.env("environment") === "Community") {
    cy.intercept("GET", "/api/data-sources").as("appDs");
    cy.wait("@appDs", { timeout: 15000 });
    cy.skipEditorPopover();
  } else {
    cy.intercept("GET", "/api/app-environments/**").as("appDs");
    cy.wait("@appDs", { timeout: 15000 });
    cy.skipEditorPopover();
  }
};

/**
 * @tjType   app.openCardMenu
 * @tjBlock  apps
 * @tjUsage  viewAppCardOptions('MyApp')
 * @tjDom    app card hover -> kebab menu
 */
export const viewAppCardOptions = (appName) => {
  if (Cypress.env("environment") !== "Community") {
    // cy.waitForElement('[data-cy="ai-icon"]');
    cy.wait(3000)
  }
  cy.contains(".homepage-app-card", appName, { timeout: 20000 }).within(() => {
    cy.get(`[data-cy="${appName.toLowerCase()}-card"]`).parent().realHover();
    cy.get('[data-cy="app-card-menu-icon"]')
      .should("be.visible")
      .should("not.be.disabled");
    // .click({ timeout: 10000 });
    cy.get(`[data-cy="${appName.toLowerCase()}-card"]`).click().realHover();
    cy.get('[data-cy="app-card-menu-icon"]').click();
  });
};

/**
 * @tjType   folder.openCardMenu
 * @tjBlock  apps
 * @tjUsage  viewFolderCardOptions('QA folder')
 * @tjDom    folder card hover -> kebab menu
 */
export const viewFolderCardOptions = (folderName) => {
  cy.get(commonSelectors.folderListcard(folderName))
    .parent()
    .within(() => {
      cy.get(commonSelectors.folderCardOptions(folderName)).invoke("click");
    });
};

/**
 * @tjType   modal.verify
 * @tjBlock  common
 * @tjUsage  verifyModal('Create app', 'Create', inputSelector)
 * @tjDom    generic modal: title, button, input
 */
export const verifyModal = (title, buttonText, inputFiledSelector) => {
  cy.get(commonSelectors.modalComponent).should("be.visible");
  cy.get(commonSelectors.modalTitle(title))
    .should("be.visible")
    .and("have.text", title);
  cy.get(commonSelectors.buttonSelector(commonText.closeButton)).should(
    "be.visible"
  );
  cy.get(commonSelectors.buttonSelector(commonText.cancelButton))
    .should("be.visible")
    .and("have.text", commonText.cancelButton);
  cy.get(commonSelectors.buttonSelector(buttonText))
    .first()
    .should("be.visible")
    .and("have.text", buttonText);

  if (inputFiledSelector) {
    cy.get(inputFiledSelector).should("be.visible");
  }
};

/**
 * @tjType   modal.verifyConfirmation
 * @tjBlock  common
 * @tjUsage  verifyConfirmationModal('Are you sure?')
 * @tjDom    confirmation modal message
 */
export const verifyConfirmationModal = (messagse) => {
  cy.get(commonSelectors.modalComponent).should("be.visible");
  cy.get(commonSelectors.modalMessage)
    .should("be.visible")
    .and("have.text", messagse);
  cy.get(commonSelectors.buttonSelector(commonText.cancelButton))
    .should("be.visible")
    .and("have.text", commonText.cancelButton);
  cy.get(commonSelectors.buttonSelector(commonText.modalYesButton))
    .should("be.visible")
    .and("have.text", commonText.modalYesButton);
};

/**
 * @tjType   modal.close
 * @tjBlock  common
 * @tjUsage  closeModal('Cancel')
 * @tjDom    modal close/cancel button
 */
export const closeModal = (buttonText) => {
  cy.get(commonSelectors.buttonSelector(buttonText)).click();
  cy.get(commonSelectors.modalComponent).should("not.exist");
};

/**
 * @tjType   modal.cancel
 * @tjBlock  common
 * @tjUsage  cancelModal('Cancel')
 * @tjDom    modal cancel button
 */
export const cancelModal = (buttonText) => {
  cy.get(commonSelectors.buttonSelector(buttonText)).click();
  cy.get(commonSelectors.modalComponent).should("not.exist");
};

/**
 * @tjType   nav.auditLogs
 * @tjBlock  common
 * @tjUsage  navigateToAuditLogsPage()
 * @tjDom    workspace settings -> audit logs. [UNREFERENCED 2026-09-06]
 */
export const navigateToAuditLogsPage = () => {
  cy.get(profileSelector.profileDropdown).invoke("show");
  cy.contains("Audit Logs").click();
  cy.url().should("include", path.auditLogsPath, { timeout: 1000 });
};

/**
 * @tjType   user.paginate
 * @tjBlock  access
 * @tjUsage  manageUsersPagination(userEmail)
 * @tjDom    manage users -> pagination until the user is found
 */
export const manageUsersPagination = (email) => {
  cy.wait(200);
  cy.get("body").then(($email) => {
    if ($email.text().includes(email)) {
      cy.log("First page");
    } else {
      cy.get(commonSelectors.nextPageArrow).click();
      manageUsersPagination(email);
    }
  });
};

/**
 * @tjType   user.search
 * @tjBlock  access
 * @tjUsage  searchUser(userEmail)
 * @tjDom    manage users -> search field
 */
export const searchUser = (email) => {
  cy.clearAndType(commonSelectors.inputUserSearch, email);
  cy.wait(1000);
};

/**
 * @tjType   app.selectCardOption
 * @tjBlock  apps
 * @tjUsage  selectAppCardOption('MyApp', 'Rename')
 * @tjDom    app card menu -> named option
 */
export const selectAppCardOption = (appName, appCardOption) => {
  viewAppCardOptions(appName);
  cy.get(appCardOption).should("be.visible").click();
};

/**
 * @tjType   nav.database
 * @tjBlock  common
 * @tjUsage  navigateToDatabase()
 * @tjDom    left nav -> ToolJet database. Used by marketplace specs only
 */
export const navigateToDatabase = () => {
  cy.get(commonSelectors.databaseIcon).click();
  cy.url().should("include", path.database);
};
/**
 * @tjType   -
 * @tjBlock  common
 * @tjUsage  randomValue()
 * @tjDom    none - data generator. [UNREFERENCED 2026-09-06]
 */
export const randomValue = () => {
  return Math.floor(Math.random() * (1000 - 100) + 100) / 100;
};

/**
 * @tjType   -
 * @tjBlock  common
 * @tjUsage  verifyTooltip(selector, 'Copy')
 * @tjDom    hovers an element and asserts its tooltip
 */
export const verifyTooltip = (selector, message) => {
  cy.get(selector)
    .trigger("mouseover", { timeout: 2000 })
    .trigger("mouseover")
    .then(() => {
      cy.get(".tooltip-inner").last().should("have.text", message);
    });
};

/**
 * @tjType   inspector.pin
 * @tjBlock  apps
 * @tjUsage  pinInspector()
 * @tjDom    app editor -> pin the inspector panel
 */
export const pinInspector = () => {
  cy.get(commonWidgetSelector.sidebarinspector).click();
  cy.get(commonSelectors.inspectorPinIcon).click();
  cy.wait(500);

  cy.get("body").then(($body) => {
    if (!$body.find(commonSelectors.inspectorPinIcon).length > 0) {
      cy.get(commonWidgetSelector.sidebarinspector).click();
      cy.get(commonSelectors.inspectorPinIcon).click();
    }
  });
  cy.hideTooltip();
};

/**
 * @tjType   nav.workspaceConstants
 * @tjBlock  workspace
 * @tjUsage  navigateToworkspaceConstants()
 * @tjDom    workspace settings -> constants. [UNREFERENCED 2026-09-06]
 */
export const navigateToworkspaceConstants = () => {
  cy.get(commonSelectors.workspaceSettingsIcon).click();
  cy.get(commonSelectors.workspaceConstantsOption).click();
};

/**
 * @tjType   app.release
 * @tjBlock  apps
 * @tjUsage  releaseApp()
 * @tjDom    editor header -> release -> confirm
 */
export const releaseApp = () => {
  cy.ifEnv("Enterprise", () => {
    appPromote("development", "production");
    cy.waitForElement(multiEnvSelector.environmentsTag("production"));
    cy.get(multiEnvSelector.environmentsTag("production")).click();
  });
  cy.ifEnv("Community", () => {
    cy.waitForElement(multiEnvSelector.environmentsTag("development"));
    cy.get(multiEnvSelector.environmentsTag("development")).click();
  });

  cy.waitForElement(commonSelectors.releaseButton);
  cy.get(commonSelectors.releaseButton).click();
  cy.get(commonSelectors.yesButton).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, "Version v1 released");
  cy.wait(1000);
};

/**
 * @tjType   -
 * @tjBlock  common
 * @tjUsage  verifyTooltipDisabled(selector, 'No permission')
 * @tjDom    hovers a disabled control and asserts its tooltip
 */
export const verifyTooltipDisabled = (selector, message) => {
  cy.get(selector)
    .trigger("mouseover", { force: true })
    .then(() => {
      cy.get(".tooltip-inner").last().should("have.text", message);
    });
};

/**
 * @tjType   -
 * @tjBlock  common
 * @tjUsage  fillInputField(data)
 * @tjDom    types into a labelled input
 */
export const fillInputField = (data) => {
  Object.entries(data).forEach(([key, value]) => {
    const labelSelector = `[data-cy="${cyParamName(key)}-label"]`;
    const inputSelector = `[data-cy="${cyParamName(key)}-input"]`;
    cy.get(labelSelector).should("contain", key);
    cy.get(inputSelector).type(`{selectall}{backspace}${value}`);
  });
};

/**
 * @tjType   nav.settings
 * @tjBlock  common
 * @tjUsage  navigateToSettingPage()
 * @tjDom    avatar menu -> settings
 */
export const navigateToSettingPage = () => {
  cy.get(commonSelectors.settingsIcon).click();
  cy.get(commonEeSelectors.instanceSettingIcon).click();
  cy.get(commonSelectors.pageSectionHeader).should("be.visible");
};

/**
 * @tjType   instanceSetting.updateApi
 * @tjBlock  superAdmin
 * @tjUsage  apiUpdateInstanceSettings(variables)
 * @tjDom    none - PATCH instance settings
 */
export const apiUpdateInstanceSettings = (variables) => {
  cy.getAuthHeaders().then((headers) => {
    cy.request({
      method :"PATCH", 
      url:`${Cypress.env("server_host")}/api/login-configs/instance-general`,
      headers: headers,
      body: {
        ...variables
      }
    }).then((response) => {
      expect(response.status).to.equal(200);
    });
  })
}

/**
 * @tjType   -
 * @tjBlock  common
 * @tjUsage  sanitize(str)
 * @tjDom    none - string helper
 */
export const sanitize = (str) => str.toLowerCase().replace(/[^A-Za-z]/g, "");
