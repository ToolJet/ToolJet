import { commonSelectors } from 'Selectors/common';
import { dashboardSelector } from 'Selectors/platform/dashboard';
import { viewAppCardOptions } from 'Support/utils/common';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import { openAppsDashboard } from 'Support/utils/platform/folderPermissions';
import { commonText } from 'Texts/common';
import { dashboardText } from 'Texts/platform/dashboard';

/**
 * Bulk move is the same "Add to folder" modal the single-app move uses: it opens
 * from one app card, but its apps multi-select lets several apps (or "All apps")
 * ride along, and the submit posts app_ids[] in one request
 * (folderService.bulkAddToFolder -> POST /api/folder-apps).
 *
 * These cases cover the permission dimension of that flow — which apps the
 * picker offers, which folders it offers, and what a bulk move does to prior
 * folder membership. The CE happy path lives in the workspace UI suite.
 */
describe('Apps — Bulk Moving Apps Between Folders', () => {
  let workspaceId, wsName, wsSlug;

  // The apps menu portals to document.body and carries no classNamePrefix, so
  // options are addressed by their own markup rather than a react-select class.
  const openAppsPicker = () => {
    cy.get(dashboardSelector.bulkMoveAppsSelect).click();
  };

  const pickApp = (appName) => {
    cy.contains(dashboardSelector.bulkMoveAppOption, appName).click();
  };

  // The menu is multi-select, so it stays open after a pick and — portaled to
  // document.body — overlays the folder select below it. Clicking the apps
  // control again toggles it shut; without this the folder select is covered.
  const closeAppsPicker = () => {
    cy.get(dashboardSelector.bulkMoveAppsSelect).click();
  };

  const pickFolder = (folderName) => {
    cy.get(dashboardSelector.selectFolder).click();
    cy.get(commonSelectors.folderList).contains(folderName).click();
  };

  const openAddToFolderModal = (fromAppName) => {
    viewAppCardOptions(fromAppName);
    cy.get(commonSelectors.appCardOptions(commonText.addToFolderOption)).click();
    cy.get(commonSelectors.modalComponent).should('be.visible');
  };

  const submitAndExpectSuccess = (folderName) => {
    cy.get(dashboardSelector.addToFolderButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, dashboardText.bulkMoveSuccessToast(folderName), false);
  };

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `app-folder-bulkmove-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
    cy.apiDeleteGranularPermission('builder', ['app', 'folder']);
  });

  it('a user with Edit Folder access can bulk move several apps into an authorized folder, and the picker offers only authorized folders', () => {
    const attemptId = Date.now();
    const editableFolderName = `Bulk Editable Folder ${attemptId}`;
    const inaccessibleFolderName = `Bulk Inaccessible Folder ${attemptId}`;
    const appNames = [`Bulk App A ${attemptId}`, `Bulk App B ${attemptId}`, `Bulk App C ${attemptId}`];
    const groupName = `QA App Bulk Group ${attemptId}`;
    const userEmail = `qa-app-bulk-basic-${attemptId}@example.com`;

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
      cy.apiFullUserOnboarding('QA App Bulk User', userEmail, 'builder', 'password', wsName, {}, [groupName]);
      cy.apiLogin(userEmail, 'password');
      // Ownership grants edit access on each app this user creates.
      appNames.forEach((appName) => cy.apiCreateApp(appName));

      openAppsDashboard();
      cy.wait(2000);
      openAddToFolderModal(appNames[0]);

      // The first app rides in pre-selected; add the other two.
      openAppsPicker();
      pickApp(appNames[1]);
      pickApp(appNames[2]);
      closeAppsPicker();
      cy.get(dashboardSelector.bulkMoveSelectedValue).should('contain.text', '3 apps selected');

      // The folder picker is permission-filtered exactly as in the single move.
      cy.get(dashboardSelector.selectFolder).click();
      cy.get(commonSelectors.folderList).should('contain.text', editableFolderName);
      cy.get(commonSelectors.folderList).should('not.contain.text', inaccessibleFolderName);
      cy.get(commonSelectors.folderList).contains(editableFolderName).click();

      submitAndExpectSuccess(editableFolderName);

      // All three apps landed in the folder in one move.
      cy.get(dashboardSelector.folderName(editableFolderName)).click();
      appNames.forEach((appName) => cy.get(commonSelectors.appCard(appName)).should('be.visible'));
    });
  });

  it('the "All apps" option bulk moves every app the user can see into the authorized folder', () => {
    const attemptId = Date.now();
    const folderName = `Bulk All Folder ${attemptId}`;
    const appNames = [`Bulk All App A ${attemptId}`, `Bulk All App B ${attemptId}`];
    const groupName = `QA App BulkAll Group ${attemptId}`;
    const userEmail = `qa-app-bulk-all-${attemptId}@example.com`;

    cy.apiCreateAppFolder(folderName).then((folder) => {
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
      cy.apiFullUserOnboarding('QA App BulkAll User', userEmail, 'builder', 'password', wsName, {}, [groupName]);
      cy.apiLogin(userEmail, 'password');
      appNames.forEach((appName) => cy.apiCreateApp(appName));

      openAppsDashboard();
      cy.wait(2000);
      openAddToFolderModal(appNames[0]);

      // "All apps (N)" selects every option the picker offers.
      openAppsPicker();
      cy.contains(dashboardSelector.bulkMoveAppOption, 'All apps').click();
      closeAppsPicker();
      cy.get(dashboardSelector.bulkMoveSelectedValue).should('contain.text', 'All apps');

      pickFolder(folderName);
      submitAndExpectSuccess(folderName);

      cy.get(dashboardSelector.folderName(folderName)).click();
      appNames.forEach((appName) => cy.get(commonSelectors.appCard(appName)).should('be.visible'));
    });
  });

  it('bulk moving apps that already live in another folder relocates them — they leave the source folder', () => {
    const attemptId = Date.now();
    const sourceFolderName = `Bulk Source Folder ${attemptId}`;
    const destFolderName = `Bulk Dest Folder ${attemptId}`;
    const appNames = [`Bulk Relocate A ${attemptId}`, `Bulk Relocate B ${attemptId}`];
    const groupName = `QA App BulkMove Group ${attemptId}`;
    const userEmail = `qa-app-bulk-relocate-${attemptId}@example.com`;
    const appIds = [];
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

        appNames.forEach((appName) =>
          cy.apiCreateApp(appName).then(() => {
            const appId = Cypress.env('appId');
            appIds.push(appId);
            cy.apiAddAppToFolder(sourceFolder.id, appId);
          })
        );
      });
    });

    cy.then(() => {
      cy.apiFullUserOnboarding('QA App BulkRelocate User', userEmail, 'builder', 'password', wsName, {}, [groupName]);
      cy.apiLogin(userEmail, 'password');

      // Bulk relocate in one request — verified via UI.
      cy.then(() => cy.apiBulkAddAppsToFolder(destFolderId, appIds));

      openAppsDashboard();
      cy.get(dashboardSelector.folderName(destFolderName)).click();
      appNames.forEach((appName) => cy.get(commonSelectors.appCard(appName)).should('be.visible'));

      // An app belongs to one folder at a time, so the source folder is now empty.
      cy.get(dashboardSelector.allApplicationsLink).click({ force: true });
      cy.get(dashboardSelector.folderName(sourceFolderName)).click();
      appNames.forEach((appName) => cy.get(commonSelectors.appCard(appName)).should('not.exist'));
    });
  });
});
