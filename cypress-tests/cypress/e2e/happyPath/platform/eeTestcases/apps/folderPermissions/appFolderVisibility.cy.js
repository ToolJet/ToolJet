import { commonSelectors } from 'Selectors/common';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import { openAppsDashboard } from 'Support/utils/platform/folderPermissions';

describe('Apps — Folder & App Visibility', () => {
  let workspaceId, wsName, wsSlug;

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `app-folder-visibility-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    cy.apiDeleteGranularPermission('builder', ['folder']);
  });

  it('a user sees only the (empty) app folders they are authorized to access, and an empty authorized folder still shows up', () => {
    const attemptId = Date.now();
    const authorizedFolderName = `Authorized App Folder ${attemptId}`;
    const unauthorizedFolderName = `Unauthorized App Folder ${attemptId}`;
    const groupName = `QA App Visibility Group ${attemptId}`;
    const userEmail = `app-visibility-scope-${attemptId}@example.com`;

    cy.apiCreateAppFolder(unauthorizedFolderName);
    cy.apiCreateAppFolder(authorizedFolderName).then((folder) => {
      apiCreateGroup(groupName).then(() =>
        cy.apiCreateGranularPermission(
          groupName,
          `folder view ${attemptId}`,
          'folder',
          { canEditFolder: false, canEditApps: false, canViewApps: true },
          [folder.id],
          false
        )
      );
    });

    cy.then(() => {
      cy.apiFullUserOnboarding('QA App Visibility Scope User', userEmail, 'builder', 'password', wsName, {}, [
        groupName,
      ]);

      cy.apiLogin(userEmail, 'password');
      openAppsDashboard();
      cy.get(commonSelectors.folderListcard(authorizedFolderName)).should('exist');
      cy.get(commonSelectors.folderListcard(unauthorizedFolderName)).should('not.exist');

      // The authorized folder is empty and still visible, showing the empty state.
      cy.get(commonSelectors.folderListcard(authorizedFolderName)).click();
      cy.get(commonSelectors.empytyFolderImage).should('be.visible');
    });
  });
});
