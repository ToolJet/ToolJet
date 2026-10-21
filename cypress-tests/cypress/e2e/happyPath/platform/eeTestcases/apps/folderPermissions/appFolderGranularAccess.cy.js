import { commonSelectors } from 'Selectors/common';
import { versionSwitcherSelectors } from 'Selectors/platform/version';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import {
  TIERS,
  apiGetItemIdsInFolder,
  expectFolderMenuAbsent,
  expectFolderMenuOptions,
  loginAs,
  openAllApps,
  openAppEditor,
  openAppsDashboard,
  openFolder,
  phase,
  uiAddItemToFolder,
  uiRemoveItemFromFolder,
  uiRenameFolder,
} from 'Support/utils/platform/folderPermissions';

describe('Apps — Folder Granular Access', { retries: 0 }, () => {
  let workspaceId, wsName, wsSlug;

  const setupFolderAccess = (label, permissions) => {
    const attemptId = Date.now();
    const folderName = `${label} App Folder ${attemptId}`;
    const appName = `${label} App ${attemptId}`;
    const groupName = `QA ${label} App Group ${attemptId}`;
    const userEmail = `qa-app-folder-${label.toLowerCase()}-${attemptId}@example.com`;
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
      .then(() => cy.apiCreateGranularPermission(groupName, `perm ${attemptId}`, 'folder', permissions, [folderId], false))
      .then(() => cy.apiFullUserOnboarding(label, userEmail, 'builder', 'password', wsName, {}, [groupName]))
      .then(() => ({ folderId, appId, folderName, appName, userEmail, groupName }));
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

    // Empty the builder role's folder/app grants and coarse folder flags before it has members, so the custom group is the only source of access.
    cy.apiDeleteGranularPermission('builder', ['app', 'folder']);
    cy.apiUpdateGroupPermission('builder', { folderCreate: false, folderDelete: false });
  });

  it('should let an Edit folder grant rename the folder, move apps in and out of it from the UI, and edit the app inside it', () => {
    setupFolderAccess('EditFolder', TIERS.editFolder).then(({ folderId, appId, folderName, userEmail }) => {
      const renamedFolderName = `${folderName} Renamed`;
      const looseAppName = `Loose App ${Date.now()}`;
      let looseAppId;

      loginAs(userEmail);
      // The user owns this app, which is what lets them move it.
      cy.apiCreateApp(looseAppName).then(() => {
        looseAppId = Cypress.env('appId');
      });

      phase('rename: offered and works; delete stays a coarse right');
      openAppsDashboard();
      expectFolderMenuOptions(folderName, { rename: true, remove: false });
      uiRenameFolder(folderName, renamedFolderName);

      phase('move a loose app IN through the card menu');
      // Rename leaves the renamed folder active, so go back to All apps where the loose app lives.
      openAllApps();
      uiAddItemToFolder(looseAppName, renamedFolderName);
      cy.then(() => apiGetItemIdsInFolder(folderId).then((ids) => expect(ids).to.include(looseAppId)));

      phase('move it back OUT from inside the folder');
      openFolder(renamedFolderName);
      uiRemoveItemFromFolder(looseAppName);
      cy.then(() => apiGetItemIdsInFolder(folderId).then((ids) => expect(ids).to.deep.equal([appId])));

      phase('the app already in the folder is editable');
      cy.apiGetEditingVersionId(appId).then((versionId) =>
        cy.apiCreateAppVersion(appId, 'v2-folder-edit-allowed', versionId)
      );
      openAppEditor(wsSlug, appId);
      cy.get(versionSwitcherSelectors.versionSwitcherButton).should('contain.text', 'v2-folder-edit-allowed');
    });
  });

  it('should list, but not let the user manage, the folder of an app reached only through a direct app grant', () => {
    const attemptId = Date.now();
    const folderName = `Direct Grant App Folder ${attemptId}`;
    const appName = `Direct Grant App ${attemptId}`;
    const groupName = `QA App Direct ${attemptId}`;
    const userEmail = `qa-app-direct-${attemptId}@example.com`;

    cy.apiCreateAppFolder(folderName).then((folder) => {
      cy.apiCreateApp(appName).then(() => {
        const appId = Cypress.env('appId');
        cy.apiAddAppToFolder(folder.id, appId);
        apiCreateGroup(groupName);
        cy.apiCreateGranularPermission(groupName, `${groupName} app`, 'app', { canEdit: false, canView: true }, [appId], false);
        cy.apiFullUserOnboarding('QA Direct', userEmail, 'builder', 'password', wsName, {}, [groupName]);
      });
    });

    loginAs(userEmail);
    openAppsDashboard();

    // A folder is listed when it holds an app the viewer can see, even without a folder grant.
    expectFolderMenuAbsent(folderName);
    openFolder(folderName);
    cy.get(commonSelectors.appCard(appName)).should('be.visible');
    openAllApps();
    cy.get(commonSelectors.appCard(appName)).should('be.visible');
  });
});
