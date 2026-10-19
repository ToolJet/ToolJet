import { commonSelectors } from 'Selectors/common';
import { dashboardSelector } from 'Selectors/platform/dashboard';
import { groupsSelector } from 'Selectors/platform/manageGroups';
import { versionModalSelector } from 'Selectors/platform/eeCommon';
import { versionSwitcherSelectors } from 'Selectors/platform/version';
import { workflowSelector } from 'Selectors/platform/workflows';
import { viewAppCardOptions, viewFolderCardOptions } from 'Support/utils/common';
import { commonText } from 'Texts/common';
import { dashboardText } from 'Texts/platform/dashboard';

export const RESOURCES = {
  app: {
    key: 'app',
    folderType: 'front-end',
    granularType: 'folder',
    itemGrantType: 'app',
    listPath: '',
    allLink: dashboardSelector.allApplicationsLink,
    coarse: { create: 'folderCreate', delete: 'folderDelete' },
    coarseCreateCheck: groupsSelector.foldersCreateCheck,
    labels: { editFolder: 'Edit folder', editItems: 'Edit apps', viewItems: 'View apps' },
    allFoldersText: 'All app folders',
  },
  workflow: {
    key: 'workflow',
    folderType: 'workflow',
    granularType: 'workflow_folder',
    itemGrantType: 'workflow',
    listPath: '/workflows',
    allLink: workflowSelector.allWorkflowsLink,
    coarse: { create: 'workflowFolderCreate', delete: 'workflowFolderDelete' },
    coarseCreateCheck: groupsSelector.workflowFolderCreateCheck,
    labels: { editFolder: 'Edit folder', editItems: 'Edit workflows', viewItems: 'Execute workflows' },
    allFoldersText: 'All workflow folders',
  },
  module: {
    key: 'module',
    folderType: 'module',
    granularType: 'module_folder',
    itemGrantType: 'module',
    listPath: '/modules',
    allLink: dashboardSelector.allModulesLink,
    coarse: { create: 'moduleFolderCreate', delete: 'moduleFolderDelete' },
    coarseCreateCheck: groupsSelector.moduleFolderCreateCheck,
    labels: { editFolder: 'Edit folder', editItems: 'Edit modules', viewItems: 'Build with modules' },
    allFoldersText: 'All module folders',
  },
};

export const TIERS = {
  editFolder: { canEditFolder: true, canEditApps: false, canViewApps: false },
  editItems: { canEditFolder: false, canEditApps: true, canViewApps: false },
  viewItems: { canEditFolder: false, canEditApps: false, canViewApps: true },
};

export const phase = (title) => cy.log(`**— ${title} —**`);

// apiLogin() without a workspace id lands in the admin's default workspace, so every admin switch pins the test workspace.
export const loginAsAdmin = () => cy.then(() => cy.apiLogin(undefined, undefined, Cypress.env('workspaceId')));

export const loginAs = (email) => cy.apiLogin(email, 'password');

export const apiCreateFolder = (resource, folderName) => {
  if (resource.key === 'workflow') return cy.apiCreateWorkflowFolder(folderName);
  if (resource.key === 'module') return cy.apiCreateModuleFolder(folderName);
  return cy.apiCreateAppFolder(folderName);
};

export const apiGetFolderId = (resource, folderName) => {
  if (resource.key === 'workflow') return cy.apiGetWorkflowFolderId(folderName);
  if (resource.key === 'module') return cy.apiGetModuleFolderId(folderName);
  return cy.apiGetAppFolderId(folderName);
};

export const apiCreateItem = (resource, itemName) => {
  if (resource.key === 'workflow') return cy.apiCreateWorkflow(itemName).then(() => Cypress.env('workflowId'));
  if (resource.key === 'module') return cy.apiCreateModule(itemName).then((module) => module.id);
  return cy.apiCreateApp(itemName).then(() => Cypress.env('appId'));
};

export const apiAddItemToFolder = (resource, itemId, folderId) => {
  if (resource.key === 'workflow') return cy.apiAddWorkflowToFolder(itemId, folderId);
  if (resource.key === 'module') return cy.apiAddModuleToFolder(itemId, folderId);
  return cy.apiAddAppToFolder(folderId, itemId);
};

export const apiRemoveItemFromFolder = (resource, itemId, folderId) => {
  if (resource.key === 'workflow') return cy.apiRemoveWorkflowFromFolder(itemId, folderId);
  if (resource.key === 'module') return cy.apiRemoveModuleFromFolder(itemId, folderId);
  return cy.apiRemoveAppFromFolder(itemId, folderId);
};

export const apiGrantFolderTier = (resource, groupName, name, tier, folderIds, isAll = false) =>
  cy.apiCreateGranularPermission(groupName, name, resource.granularType, tier, folderIds, isAll);

// "Create draft version" only renders once a saved version exists.
export const apiPublishV1 = (itemId) =>
  cy.apiGetEditingVersionId(itemId).then((versionId) => {
    Cypress.env('appId', itemId);
    Cypress.env('editingVersionId', versionId);
    cy.apiPublishDraftVersion('v1');
  });

export const apiGetItemIdsInFolder = (folderId, folderType = RESOURCES.app.folderType) =>
  cy.getAuthHeaders().then((headers) =>
    cy
      .request({
        method: 'GET',
        url: `${Cypress.env('server_host')}/api/apps?page=1&folder=${folderId}&searchKey=&type=${folderType}`,
        headers,
        log: false,
      })
      .then((response) => {
        expect(response.status).to.equal(200);
        return (response.body.apps || []).map((app) => app.id);
      })
  );

export const apiGetGranularPermissions = (groupId) =>
  cy.getAuthHeaders().then((headers) =>
    cy
      .request({
        method: 'GET',
        url: `${Cypress.env('server_host')}/api/v2/group-permissions/${groupId}/granular-permissions`,
        headers,
      })
      .then((response) => {
        expect(response.status).to.equal(200);
        return response.body;
      })
  );

// The folder section renders for every viewer, so it is the readiness signal once the folder list has loaded.
const openDashboard = (path) => {
  cy.intercept('GET', '/api/folder-apps*').as('dashboardFolders');
  cy.visit(`/${Cypress.env('workspaceSlug')}${path}`);
  cy.wait('@dashboardFolders', { timeout: 50000 });
  cy.get(dashboardSelector.folderLabel, { timeout: 50000 }).should('be.visible');
};

export const openList = (resource) => openDashboard(resource.listPath);

export const openAppsDashboard = () => openList(RESOURCES.app);

export const openWorkflowsList = () => openList(RESOURCES.workflow);

export const openFolder = (folderName) => {
  cy.intercept('GET', '/api/apps*').as('folderContents');
  cy.get(dashboardSelector.folderName(folderName)).click();
  cy.wait('@folderContents');
};

export const openAll = (resource) => {
  cy.intercept('GET', '/api/apps*').as('allItems');
  cy.get(resource.allLink).click({ force: true });
  cy.wait('@allItems');
};

export const openAllApps = () => openAll(RESOURCES.app);

export const expectFolderListed = (folderName, listed = true) =>
  cy.get(commonSelectors.folderListcard(folderName)).should(listed ? 'exist' : 'not.exist');

// Asserts the folder is listed and has no menu, so it can never pass vacuously.
export const expectFolderMenuAbsent = (folderName) => {
  expectFolderListed(folderName);
  cy.get(commonSelectors.folderCardOptions(folderName)).should('not.exist');
};

export const expectFolderMenuOptions = (folderName, { rename, remove }) => {
  viewFolderCardOptions(folderName);
  cy.get(commonSelectors.editFolderOption(folderName)).should(rename ? 'exist' : 'not.exist');
  cy.get(commonSelectors.deleteFolderOption(folderName)).should(remove ? 'exist' : 'not.exist');
  cy.get('body').type('{esc}');
};

export const uiCreateFolder = (folderName) => {
  cy.intercept('POST', '/api/folders').as('createFolder');
  cy.get(commonSelectors.createNewFolderButton).click();
  cy.clearAndType(commonSelectors.folderNameInput, folderName);
  cy.get(commonSelectors.createFolderButton).click();
  cy.wait('@createFolder');
  cy.verifyToastMessage(commonSelectors.toastMessage, commonText.folderCreatedToast);
  expectFolderListed(folderName);
};

export const uiRenameFolder = (folderName, newName) => {
  viewFolderCardOptions(folderName);
  cy.get(commonSelectors.editFolderOption(folderName)).click();
  cy.clearAndType(commonSelectors.folderNameInput, newName);
  cy.get(commonSelectors.buttonSelector('update folder')).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, 'Folder has been updated.');
  expectFolderListed(newName);
  expectFolderListed(folderName, false);
};

export const uiDeleteFolder = (folderName) => {
  cy.intercept('DELETE', '/api/folders/*').as('folderDeleted');
  viewFolderCardOptions(folderName);
  cy.get(commonSelectors.deleteFolderOption(folderName)).click();
  cy.get(commonSelectors.yesButton).click();
  cy.wait('@folderDeleted');
  cy.verifyToastMessage(commonSelectors.toastMessage, commonText.folderDeletedToast);
  expectFolderListed(folderName, false);
};

export const uiOpenAddToFolder = (itemName) => {
  viewAppCardOptions(itemName);
  cy.get(commonSelectors.appCardOptions(commonText.addToFolderOption)).click();
  cy.get(commonSelectors.modalComponent).should('be.visible');
};

export const uiPickFolder = (folderName) => {
  cy.get(dashboardSelector.selectFolder).click();
  cy.get(commonSelectors.folderList).contains(folderName).click();
};

export const uiSubmitAddToFolder = (folderName) => {
  cy.intercept('POST', '/api/folder-apps*').as('addToFolder');
  cy.get(dashboardSelector.addToFolderButton).click();
  cy.wait('@addToFolder');
  cy.verifyToastMessage(commonSelectors.toastMessage, dashboardText.bulkMoveSuccessToast(folderName), false);
};

export const uiAddItemToFolder = (itemName, folderName) => {
  uiOpenAddToFolder(itemName);
  uiPickFolder(folderName);
  uiSubmitAddToFolder(folderName);
};

// Must be called from inside the folder the item sits in.
export const uiRemoveItemFromFolder = (itemName) => {
  cy.intercept('PUT', '/api/folder-apps/*').as('removeFromFolder');
  viewAppCardOptions(itemName);
  cy.get(commonSelectors.appCardOptions('Remove from folder')).click();
  cy.get(commonSelectors.yesButton).click();
  cy.wait('@removeFromFolder');
  cy.verifyToastMessage(commonSelectors.toastMessage, 'Application removed from folder successfully!');
};

// The apps multi-select is shared by every resource and stays open after a pick, so clicking it again closes it.
export const toggleItemsPicker = () => cy.get(dashboardSelector.bulkMoveAppsSelect).click();

export const pickItem = (itemName) => cy.contains(dashboardSelector.bulkMoveAppOption, itemName).click();

// The editor and the restricted redirect are both decided after a chain of boot calls, so each open waits on a readiness signal.
const EDITOR_BOOT_TIMEOUT = 120000;

const visitEditor = (workspaceSlug, resourceId) =>
  cy.visit(`/${workspaceSlug}/apps/${resourceId}`, { failOnStatusCode: false });

// Apps and modules: the version switcher is empty until versions load.
export const openAppEditor = (workspaceSlug, appId) => {
  visitEditor(workspaceSlug, appId);
  cy.get(versionSwitcherSelectors.versionSwitcherButton, { timeout: EDITOR_BOOT_TIMEOUT })
    .should('be.visible')
    .and('not.have.text', '');
};

// Workflows have no version switcher; the canvas start node is the readiness signal.
export const openWorkflowEditor = (workspaceSlug, workflowId) => {
  visitEditor(workspaceSlug, workflowId);
  cy.get(workflowSelector.startNode, { timeout: EDITOR_BOOT_TIMEOUT }).should('be.visible');
};

export const openItemEditor = (resource, workspaceSlug, itemId) =>
  resource.key === 'workflow' ? openWorkflowEditor(workspaceSlug, itemId) : openAppEditor(workspaceSlug, itemId);

export const uiCreateDraftVersion = (versionName) => {
  cy.get(versionSwitcherSelectors.versionSwitcherButton).click();
  cy.get(commonSelectors.buttonSelector('create draft version')).click();
  cy.get(versionModalSelector.versionNameInput).type(versionName);
  cy.get(versionModalSelector.createDraftVersionModal.createButton).click();
  cy.get(versionSwitcherSelectors.versionSwitcherButton).should('contain.text', versionName);
};

export const openEditorExpectingRestricted = (workspaceSlug, resourceId) => {
  visitEditor(workspaceSlug, resourceId);
  cy.url({ timeout: EDITOR_BOOT_TIMEOUT }).should('include', '/error/restricted');
};
