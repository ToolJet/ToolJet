import { commonSelectors } from 'Selectors/common';
import { dashboardSelector } from 'Selectors/platform/dashboard';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import {
  TIERS,
  apiGetItemIdsInFolder,
  loginAs,
  openAllApps,
  openAppsDashboard,
  openFolder,
  uiAddItemToFolder,
  uiOpenAddToFolder,
  uiPickFolder,
  uiSubmitAddToFolder,
} from 'Support/utils/platform/folderPermissions';

describe('Apps — Moving Apps Between Folders', { retries: 0 }, () => {
  let workspaceId, wsName, wsSlug;

  // The apps menu portals to document.body and is multi-select, so it stays open after a pick and overlays the folder select below; clicking the control again toggles it shut.
  const toggleAppsPicker = () => cy.get(dashboardSelector.bulkMoveAppsSelect).click();
  const pickApp = (appName) => cy.contains(dashboardSelector.bulkMoveAppOption, appName).click();

  const setupEditor = (label, folderIds) => {
    const attemptId = Date.now();
    const groupName = `QA App ${label} Group ${attemptId}`;
    const userEmail = `qa-app-${label.toLowerCase()}-${attemptId}@example.com`;

    apiCreateGroup(groupName);
    cy.apiCreateGranularPermission(groupName, `folder edit ${attemptId}`, 'folder', TIERS.editFolder, folderIds, false);
    cy.apiFullUserOnboarding(`QA App ${label}`, userEmail, 'builder', 'password', wsName, {}, [groupName]);
    return cy.wrap(userEmail);
  };

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

  it('should offer only folders the user can edit in the move picker, and move an app the user can edit into one', () => {
    const attemptId = Date.now();
    const editableFolderName = `Editable App Folder ${attemptId}`;
    const inaccessibleFolderName = `Inaccessible App Folder ${attemptId}`;
    const appName = `Move Source App ${attemptId}`;

    cy.apiCreateAppFolder(inaccessibleFolderName);
    cy.apiCreateAppFolder(editableFolderName).then((folder) => {
      setupEditor('Move', [folder.id]).then((userEmail) => {
        loginAs(userEmail);
        cy.apiCreateApp(appName);

        openAppsDashboard();
        uiOpenAddToFolder(appName);
        cy.get(dashboardSelector.selectFolder).click();
        cy.get(commonSelectors.folderList).should('contain.text', editableFolderName);
        cy.get(commonSelectors.folderList).should('not.contain.text', inaccessibleFolderName);
        cy.get(commonSelectors.folderList).contains(editableFolderName).click();
        uiSubmitAddToFolder(editableFolderName);

        openFolder(editableFolderName);
        cy.get(commonSelectors.appCard(appName)).should('be.visible');
      });
    });
  });

  it('should bulk move several apps into an authorized folder in one submit, with the same folder filtering', () => {
    const attemptId = Date.now();
    const editableFolderName = `Bulk Editable Folder ${attemptId}`;
    const inaccessibleFolderName = `Bulk Inaccessible Folder ${attemptId}`;
    const appNames = [`Bulk App A ${attemptId}`, `Bulk App B ${attemptId}`, `Bulk App C ${attemptId}`];

    cy.apiCreateAppFolder(inaccessibleFolderName);
    cy.apiCreateAppFolder(editableFolderName).then((folder) => {
      setupEditor('Bulk', [folder.id]).then((userEmail) => {
        loginAs(userEmail);
        appNames.forEach((appName) => cy.apiCreateApp(appName));

        openAppsDashboard();
        uiOpenAddToFolder(appNames[0]);

        toggleAppsPicker();
        pickApp(appNames[1]);
        pickApp(appNames[2]);
        toggleAppsPicker();
        cy.get(dashboardSelector.bulkMoveSelectedValue).should('contain.text', '3 apps selected');

        cy.get(dashboardSelector.selectFolder).click();
        cy.get(commonSelectors.folderList).should('contain.text', editableFolderName);
        cy.get(commonSelectors.folderList).should('not.contain.text', inaccessibleFolderName);
        cy.get(commonSelectors.folderList).contains(editableFolderName).click();
        uiSubmitAddToFolder(editableFolderName);

        apiGetItemIdsInFolder(folder.id).then((ids) => expect(ids).to.have.length(3));
        openFolder(editableFolderName);
        appNames.forEach((appName) => cy.get(commonSelectors.appCard(appName)).should('be.visible'));
      });
    });
  });

  it('should bulk move every app the user can see with the "All apps" option', () => {
    const attemptId = Date.now();
    const folderName = `Bulk All Folder ${attemptId}`;
    const appNames = [`Bulk All App A ${attemptId}`, `Bulk All App B ${attemptId}`];

    cy.apiCreateAppFolder(folderName).then((folder) => {
      setupEditor('BulkAll', [folder.id]).then((userEmail) => {
        loginAs(userEmail);
        appNames.forEach((appName) => cy.apiCreateApp(appName));

        openAppsDashboard();
        uiOpenAddToFolder(appNames[0]);
        toggleAppsPicker();
        cy.contains(dashboardSelector.bulkMoveAppOption, 'All apps').click();
        toggleAppsPicker();
        cy.get(dashboardSelector.bulkMoveSelectedValue).should('contain.text', 'All apps');

        uiPickFolder(folderName);
        uiSubmitAddToFolder(folderName);

        openFolder(folderName);
        appNames.forEach((appName) => cy.get(commonSelectors.appCard(appName)).should('be.visible'));
      });
    });
  });

  it('should keep an app in one folder only — a single or bulk move relocates it out of its previous folder', () => {
    const attemptId = Date.now();
    const sourceFolderName = `App Source Folder ${attemptId}`;
    const destFolderName = `App Dest Folder ${attemptId}`;
    const singleAppName = `Relocating App ${attemptId}`;
    const bulkAppNames = [`Bulk Relocate A ${attemptId}`, `Bulk Relocate B ${attemptId}`];
    const bulkAppIds = [];
    let singleAppId;

    cy.apiCreateAppFolder(sourceFolderName).then((sourceFolder) => {
      cy.apiCreateAppFolder(destFolderName).then((destFolder) => {
        cy.apiCreateApp(singleAppName).then(() => {
          singleAppId = Cypress.env('appId');
          cy.apiAddAppToFolder(sourceFolder.id, singleAppId);
        });
        bulkAppNames.forEach((appName) =>
          cy.apiCreateApp(appName).then(() => {
            bulkAppIds.push(Cypress.env('appId'));
            cy.apiAddAppToFolder(sourceFolder.id, Cypress.env('appId'));
          })
        );

        // Edit folder on both folders cascades edit to the apps inside, which is what lets the user move them.
        setupEditor('Relocate', [sourceFolder.id, destFolder.id]).then((userEmail) => {
          loginAs(userEmail);

          openAppsDashboard();
          openFolder(sourceFolderName);
          uiAddItemToFolder(singleAppName, destFolderName);

          cy.then(() => cy.apiBulkAddAppsToFolder(destFolder.id, bulkAppIds));

          cy.then(() => {
            apiGetItemIdsInFolder(destFolder.id).then((ids) =>
              expect(ids).to.have.members([singleAppId, ...bulkAppIds])
            );
            apiGetItemIdsInFolder(sourceFolder.id).then((ids) => expect(ids).to.be.empty);
          });

          openAppsDashboard();
          openFolder(destFolderName);
          [singleAppName, ...bulkAppNames].forEach((appName) =>
            cy.get(commonSelectors.appCard(appName)).should('be.visible')
          );
          openAllApps();
          openFolder(sourceFolderName);
          cy.get(commonSelectors.empytyFolderImage).should('be.visible');
        });
      });
    });
  });
});
