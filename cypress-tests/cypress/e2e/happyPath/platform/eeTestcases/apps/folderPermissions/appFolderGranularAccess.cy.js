import { commonSelectors } from 'Selectors/common';
import { dashboardSelector } from 'Selectors/platform/dashboard';
import { versionSwitcherSelectors } from 'Selectors/platform/version';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import { openAppEditor, openAppsDashboard } from 'Support/utils/platform/folderPermissions';

describe('Apps — Folder Granular Access', () => {
  let workspaceId, wsName, wsSlug;

  const setupFolderAccess = (label, permissions) => {
    const attemptId = Date.now();
    const folderName = `${label} App Folder ${attemptId}`;
    const appName = `${label} App ${attemptId}`;
    const groupName = `QA ${label} App Group ${attemptId}`;
    const userEmail = `qa-app-folder-${label.toLowerCase().replace(/\s+/g, '-')}-${attemptId}@example.com`;
    let folderId;
    let appId;

    return cy
      .apiCreateAppFolder(folderName)
      .then((folder) => {
        folderId = folder.id;
        return cy.apiCreateApp(appName);
      })
      .then(() => {
        appId = Cypress.env('appId');
        return cy.apiAddAppToFolder(folderId, appId);
      })
      .then(() => apiCreateGroup(groupName))
      .then(() =>
        cy.apiCreateGranularPermission(groupName, `perm ${attemptId}`, 'folder', permissions, [folderId], false)
      )
      .then(() => cy.apiFullUserOnboarding(label, userEmail, 'builder', 'password', wsName, {}, [groupName]))
      .then(() => ({ folderId, appId, folderName, appName, userEmail }));
  };

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `app-folder-granular-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    cy.apiDeleteGranularPermission('builder', ['app', 'folder']);
  });

  it('user with Edit Folder permission can rename an authorized folder, move apps in and out of it, and edit an app within it — and deleting the folder does not delete the app inside it', () => {
    setupFolderAccess('EditFolder', { canEditFolder: true, canEditApps: false, canViewApps: false }).then(
      ({ folderId, appId, folderName, appName, userEmail }) => {
        const renamedFolderName = `${folderName} Renamed`;
        const looseAppName = `Loose App ${Date.now()}`;
        let looseAppId;

        cy.apiCreateApp(looseAppName).then(() => {
          looseAppId = Cypress.env('appId');
        });

        cy.apiLogin(userEmail, 'password');

        // Rename the authorized folder — via API, verified via UI.
        cy.then(() => cy.apiRenameFolder(folderId, renamedFolderName));
        openAppsDashboard();
        cy.get(commonSelectors.folderListcard(renamedFolderName)).should('exist');
        cy.get(commonSelectors.folderListcard(folderName)).should('not.exist');

        // Add a loose app to the (renamed) folder, then remove it again — via API, verified via UI.
        cy.then(() => cy.apiAddAppToFolder(folderId, looseAppId));
        cy.get(dashboardSelector.folderName(renamedFolderName)).click();
        cy.get(commonSelectors.appCard(looseAppName)).should('be.visible');

        cy.then(() => cy.apiRemoveAppFromFolder(looseAppId, folderId));
        cy.get(dashboardSelector.allApplicationsLink).click({ force: true });
        cy.get(dashboardSelector.folderName(renamedFolderName)).click();
        cy.get(commonSelectors.appCard(looseAppName)).should('not.exist');

        // Edit the app that lives inside the folder — via API, verified via UI.
        cy.then(() =>
          cy
            .apiGetEditingVersionId(appId)
            .then((versionId) => cy.apiCreateAppVersion(appId, 'v2-folder-edit-allowed', versionId))
        );
        openAppEditor(Cypress.env('workspaceSlug'), appId);
        cy.get(versionSwitcherSelectors.versionSwitcherButton).should('contain.text', 'v2-folder-edit-allowed');

        // Deleting the folder (as its owner, admin) does not delete the app inside it.
        cy.apiLogin();
        cy.then(() => cy.apiDeleteFolder(folderId));
        openAppsDashboard();

        cy.get(commonSelectors.folderListcard(renamedFolderName)).should('not.exist');

        cy.get(dashboardSelector.allApplicationsLink).click({ force: true });
        cy.get(commonSelectors.appCard(appName)).should('exist');
      }
    );
  });

  it("non-owner without any folder-level grant cannot rename or manage another user's app folder", () => {
    const attemptId = Date.now();
    const folderName = `Unshared App Folder ${attemptId}`;
    const userEmail = `qa-app-folder-unshared-${attemptId}@example.com`;

    cy.apiCreateAppFolder(folderName);
    cy.apiFullUserOnboarding('QA Unshared App Folder User', userEmail, 'builder', 'password', wsName);

    cy.apiLogin(userEmail, 'password');
    openAppsDashboard();
    cy.get(commonSelectors.folderCardOptions(folderName)).should('not.exist');
  });
});
