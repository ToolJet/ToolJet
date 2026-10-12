import { commonSelectors } from 'Selectors/common';
import { dashboardSelector } from 'Selectors/platform/dashboard';
import { versionModalSelector } from 'Selectors/platform/eeCommon';
import { versionSwitcherSelectors } from 'Selectors/platform/version';
import { viewAppCardOptions } from 'Support/utils/common';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import {
  openAppEditor,
  openAppsDashboard,
  openEditorExpectingRestricted,
} from 'Support/utils/platform/folderPermissions';
import { commonText } from 'Texts/common';
import { dashboardText } from 'Texts/platform/dashboard';

describe('Apps — Moving Apps Between Folders', () => {
  let workspaceId, wsName, wsSlug;

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `app-folder-move-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
    cy.apiDeleteGranularPermission('builder', ['app', 'folder']);
  });

  it('user with Edit Folder access sees only authorized folders in the move picker, and can move an app they can edit into one', () => {
    const attemptId = Date.now();
    const editableFolderName = `Editable App Folder ${attemptId}`;
    const inaccessibleFolderName = `Inaccessible App Folder ${attemptId}`;
    const appName = `Move Source App ${attemptId}`;
    const groupName = `QA App Move Group ${attemptId}`;
    const userEmail = `qa-app-move-basic-${attemptId}@example.com`;

    cy.apiCreateAppFolder(inaccessibleFolderName);
    cy.apiCreateAppFolder(editableFolderName).then((folder) => {
      apiCreateGroup(groupName).then(() =>
        cy.apiCreateGranularPermission(
          groupName,
          `folder edit ${attemptId}`,
          'folder',
          { canEditFolder: true, canEditApps: false, canViewApps: false },
          [folder.id],
          false
        )
      );
    });
    cy.then(() => {
      cy.apiFullUserOnboarding('QA App Move Basic User', userEmail, 'builder', 'password', wsName, {}, [groupName]);
      cy.apiLogin(userEmail, 'password');
      // Ownership grants edit access on the app itself.
      cy.apiCreateApp(appName);

      openAppsDashboard();
      cy.wait(2000);
      viewAppCardOptions(appName);
      cy.get(commonSelectors.appCardOptions(commonText.addToFolderOption)).click();
      cy.get(dashboardSelector.selectFolder).click();

      // The picker only lists folders this user has Edit Folder access to.
      cy.get(commonSelectors.folderList).should('contain.text', editableFolderName);
      cy.get(commonSelectors.folderList).should('not.contain.text', inaccessibleFolderName);

      cy.get(commonSelectors.folderList).contains(editableFolderName).click();
      cy.get(dashboardSelector.addToFolderButton).click();
      cy.verifyToastMessage(commonSelectors.toastMessage, dashboardText.bulkMoveSuccessToast(editableFolderName), false);

      cy.get(dashboardSelector.folderName(editableFolderName)).click();
      cy.get(commonSelectors.appCard(appName)).should('be.visible');
    });
  });

  it('an app can belong to only one folder — moving it to another folder removes it from the previous one', () => {
    const attemptId = Date.now();
    const sourceFolderName = `App Source Folder ${attemptId}`;
    const destFolderName = `App Dest Folder ${attemptId}`;
    const appName = `Relocating App ${attemptId}`;
    const groupName = `QA App Relocate Group ${attemptId}`;
    const userEmail = `qa-app-move-relocate-${attemptId}@example.com`;
    let appId;
    let destFolderId;

    cy.apiCreateAppFolder(sourceFolderName).then((sourceFolder) => {
      cy.apiCreateAppFolder(destFolderName).then((destFolder) => {
        destFolderId = destFolder.id;
        apiCreateGroup(groupName).then(() =>
          cy.apiCreateGranularPermission(
            groupName,
            `folder edit ${attemptId}`,
            'folder',
            { canEditFolder: true, canEditApps: false, canViewApps: false },
            [sourceFolder.id, destFolder.id],
            false
          )
        );

        cy.apiCreateApp(appName).then(() => {
          appId = Cypress.env('appId');
          cy.apiAddAppToFolder(sourceFolder.id, appId);
        });
      });
    });

    cy.then(() => {
      cy.apiFullUserOnboarding('QA App Relocate User', userEmail, 'builder', 'password', wsName, {}, [groupName]);
      cy.apiLogin(userEmail, 'password');

      // Move it into the destination folder — via API, verified via UI.
      cy.then(() => cy.apiAddAppToFolder(destFolderId, appId));

      openAppsDashboard();
      cy.get(dashboardSelector.folderName(destFolderName)).click();
      cy.get(commonSelectors.appCard(appName)).should('be.visible');

      cy.get(dashboardSelector.allApplicationsLink).click({ force: true });
      cy.get(dashboardSelector.folderName(sourceFolderName)).click();
      cy.get(commonSelectors.appCard(appName)).should('not.exist');
    });
  });

  it("an app's effective permission recalculates immediately once it's moved into a folder that grants access", () => {
    const attemptId = Date.now();
    const folderName = `App Recalc Folder ${attemptId}`;
    const appName = `Recalc App ${attemptId}`;
    const groupName = `QA App Recalc Group ${attemptId}`;
    const userEmail = `qa-app-move-recalc-${attemptId}@example.com`;
    let appId;
    let folderId;

    cy.apiCreateAppFolder(folderName).then((folder) => {
      folderId = folder.id;
      apiCreateGroup(groupName).then(() =>
        cy.apiCreateGranularPermission(
          groupName,
          `folder edit ${attemptId}`,
          'folder',
          { canEditFolder: false, canEditApps: true, canViewApps: false },
          [folderId],
          false
        )
      );
      cy.apiCreateApp(appName).then(() => {
        appId = Cypress.env('appId');
      });
    });

    cy.then(() => {
      // "Create draft version" only renders once a saved version exists
      // (VersionManagerDropdown.jsx: showCreateDraftButton = savedVersions.length > 0).
      cy.apiGetEditingVersionId(appId).then((versionId) => {
        Cypress.env('appId', appId);
        Cypress.env('editingVersionId', versionId);
        cy.apiPublishDraftVersion('v1');
      });

      cy.apiFullUserOnboarding('QA App Recalc User', userEmail, 'builder', 'password', wsName, {}, [groupName]);
      openEditorExpectingRestricted(wsSlug, appId);

      // Move it into the folder (as admin) — no re-login for the test user needed.
      cy.apiLogin();
      cy.apiAddAppToFolder(folderId, appId);

      // After the move: same user, fresh visit, now editable via the folder grant.
      cy.apiLogin(userEmail, 'password');
      openAppEditor(wsSlug, appId);
      cy.get(versionSwitcherSelectors.versionSwitcherButton).click();
      cy.get(commonSelectors.buttonSelector('create draft version')).click();
      cy.get(versionModalSelector.versionNameInput).type('v2-after-move');
      cy.get(versionModalSelector.createDraftVersionModal.createButton).click();
      cy.get(commonSelectors.toastMessage).should('not.exist');
      cy.get(versionSwitcherSelectors.versionSwitcherButton).should('contain.text', 'v2-after-move');
    });
  });
});
