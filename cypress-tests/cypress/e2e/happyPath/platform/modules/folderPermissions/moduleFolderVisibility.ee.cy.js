import { commonSelectors } from 'Selectors/common';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import { openModulesList } from 'Support/utils/platform/modules';


describe('Modules — Folder & Module Visibility', () => {
  let workspaceId, wsName, wsSlug;

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `modules-folder-visibility-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });


    cy.apiDeleteGranularPermission('builder', ['module_folder']);
  });

  it('a user sees only the (empty) module folders they are authorized to access, and an empty authorized folder still shows up', () => {
    const attemptId = Date.now();
    const authorizedFolderName = `Authorized Folder ${attemptId}`;
    const unauthorizedFolderName = `Unauthorized Folder ${attemptId}`;
    const groupName = `QA Visibility Group ${attemptId}`;
    const userEmail = `qa-visibility-scope-${attemptId}@example.com`;

    cy.apiCreateModuleFolder(unauthorizedFolderName);
    cy.apiCreateModuleFolder(authorizedFolderName).then((folder) => {
      apiCreateGroup(groupName).then(() =>
        cy.apiCreateGranularPermission(
          groupName,
          `${groupName} folder view`,
          'module_folder',
          { canEditFolder: false, canEditApps: false, canViewApps: true },
          [folder.id],
          false
        )
      );
    });

    cy.then(() => {
      cy.apiFullUserOnboarding('QA Visibility Scope User', userEmail, 'builder', 'password', wsName, {}, [
        groupName,
      ]);

      cy.apiLogin(userEmail, 'password');
      openModulesList();
      cy.get(commonSelectors.folderListcard(authorizedFolderName)).should('exist');
      cy.get(commonSelectors.folderListcard(unauthorizedFolderName)).should('not.exist');

      // The authorized folder is empty and still visible, showing the empty state.
      cy.get(commonSelectors.folderListcard(authorizedFolderName)).click();
      cy.get(commonSelectors.empytyFolderImage).should('be.visible');
    });
  });
});
