import { commonSelectors, commonWidgetSelector, cyParamName } from 'Selectors/common';
import { moduleSelectors } from 'Selectors/platform/modules';
import { versionModalSelector } from 'Selectors/eeCommon';

export const openModulesList = () => {
  cy.intercept('GET', '/api/library_apps').as('libraryApps');
  cy.visit(`/${Cypress.env('workspaceSlug')}/modules`);
  cy.wait(2000);

  if (!Cypress.env('libraryAppsRequestSeen')) {
    cy.wait('@libraryApps');
    Cypress.env('libraryAppsRequestSeen', true);
  }
  cy.get(commonSelectors.pageSectionHeader, { timeout: 50000 }).should('contain.text', 'Modules');
};

export const createModuleViaAPI = (moduleName) => {
  return cy.apiCreateModule(moduleName).then((module) => {
    Cypress.env('user_id', module.user_id);
    return cy.openApp('', Cypress.env('workspaceId'), module.id, moduleSelectors.blankModuleContent).then(() => module);
  });
};

export const createModuleViaUI = (moduleName) => {
  openModulesList();

  cy.get(commonSelectors.buttonSelector('create new modules')).first().click();
  cy.get(moduleSelectors.moduleNameInput).type(moduleName);
  cy.get(moduleSelectors.createModuleSubmitButton).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, 'Module created successfully!');
  cy.url({ timeout: 15000 }).should('include', '/apps/');
};

export const dropModuleComponent = (widgetName = 'Text') => {
  cy.get(moduleSelectors.blankModuleContent).should('be.visible');
  cy.dragAndDropWidget(widgetName);
  cy.get(moduleSelectors.blankModuleContent).should('not.exist');
};

export const defineModuleContract = () => {
  cy.get(moduleSelectors.moduleContainerWidget).click();
  cy.get(commonWidgetSelector.widgetConfigHandle('modulecontainer')).click();

  cy.get(commonWidgetSelector.accordion('input')).next().find('[data-cy="button-add-column"]').click();
  cy.get(moduleSelectors.inputItem('input1')).should('exist');

  cy.get(commonWidgetSelector.accordion('output')).next().find('[data-cy="button-add-column"]').click();
  cy.get(moduleSelectors.outputItem('output1')).should('exist');
};

export const authorModuleContract = () => {
  dropModuleComponent();
  defineModuleContract();
};

export const createModuleDraftVersion = (draftVersionName, fromVersion) => {
  cy.get(moduleSelectors.versionSwitcherButton).click();
  cy.get('body').then(($body) => {
    const saveVersionBtn = $body.find('[data-cy$="-save-version-button"]');
    if (saveVersionBtn.length > 0) {
      cy.wrap(saveVersionBtn).click();
      cy.get(commonSelectors.buttonSelector('create version save')).click();
      cy.get(commonSelectors.toastMessage).should('be.visible');
      cy.get(moduleSelectors.versionLockBanner, { timeout: 15000 }).should('be.visible');
      cy.get(moduleSelectors.versionSwitcherButton).click();
    }
  });
  cy.get(commonSelectors.buttonSelector('create draft version')).click();
  if (fromVersion) {
    cy.get(versionModalSelector.createDraftVersionModal.createDraftVersionFromInput).click();
    cy.contains(`[id*="react-select-"]`, fromVersion).click();
  }
  cy.get(commonWidgetSelector.parameterInputField('version name')).clear().type(draftVersionName);
  cy.get(commonSelectors.buttonSelector('create draft version create')).click();
  cy.get(commonSelectors.buttonSelector('create draft version create')).should('not.exist');
};

export const publishModuleVersion = (currentVersionName, newVersionName) => {
  cy.get(moduleSelectors.versionSwitcherButton).click();
  cy.get(commonSelectors.buttonSelector(`${currentVersionName} save version`)).click();
  cy.get(commonWidgetSelector.parameterInputField('version name')).clear().type(newVersionName);
  cy.get(commonSelectors.buttonSelector('create version save')).click();
  cy.get(commonSelectors.toastMessage).should('be.visible');
  cy.get(moduleSelectors.versionLockBanner, { timeout: 15000 }).should('be.visible');
};

export const ensureVersionSwitcherOpen = () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy$="-version-name"]').length === 0) {
      cy.get(moduleSelectors.versionSwitcherButton).click();
    }
  });
};

export const switchModuleEditorVersion = (versionName) => {
  cy.get(moduleSelectors.versionSwitcherButton).click();
  cy.get(`[data-cy="${cyParamName(versionName)}-version-name"]`).click();
};

export const renameModuleFromList = (currentModuleName, newModuleName) => {
  cy.get(commonSelectors.appCard(currentModuleName))
    .trigger('mousehover')
    .trigger('mouseenter')
    .find(moduleSelectors.appCardMenuIcon)
    .click({ force: true });
  cy.get(commonSelectors.appCardOptions('rename module')).click();
  cy.get(moduleSelectors.moduleNameInput).clear().type(newModuleName);
  cy.get(moduleSelectors.renameModuleSubmitButton).click();
};

export const attemptDeleteModuleFromList = (moduleName) => {
  cy.get(commonSelectors.appCard(moduleName))
    .trigger('mousehover')
    .trigger('mouseenter')
    .find(moduleSelectors.appCardMenuIcon)
    .click({ force: true });
  cy.get(commonSelectors.appCardOptions('delete module')).click();
  cy.get(commonSelectors.yesButton).should('be.visible').click();
};

export const attemptDeleteModuleVersion = (versionName) => {
  cy.get(moduleSelectors.versionSwitcherButton).click();
  cy.get(commonSelectors.buttonSelector(`${versionName} version more menu`)).click();
  cy.get(commonSelectors.buttonSelector(`${versionName} delete version`)).click();
  cy.get(commonSelectors.yesButton).click();
};

export const dragModuleIntoCanvas = (moduleName, positionX = 100, positionY = 100) => {
  cy.get('body').then(($body) => {
    if ($body.find('[role="tab"]:contains("Modules")').length === 0) {
      cy.get(commonSelectors.rightSidebarPlusButton).click();
    }
  });

  cy.contains('[role="tab"]', 'Modules').should('be.visible').click({ force: true });

  cy.get(commonSelectors.searchField).filter(':visible').should('be.visible').clear().type(moduleName);
  const sourceSelector = `.draggable-box[draggable="true"]:has(${moduleSelectors.moduleManagerCardTitle(moduleName)})`;
  cy.get(sourceSelector, { timeout: 15000 }).should('exist');
  cy.realDragInit();
  cy.wait(300);
  cy.realDragAndDrop(sourceSelector, '#real-canvas', {
    targetX: positionX,
    targetY: positionY,
  });
  cy.waitForAutoSave();
};

export const selectModuleViewerPinnedVersion = (versionName) => {
  cy.contains('label', 'Version').parent().find('.react-select__control').click();
  cy.get('.react-select__menu-list').contains(versionName).click();
};
