import { commonSelectors } from 'Selectors/common';
import { openModulesList } from 'Support/utils/platform/modules';
import { apiCreateGroup } from 'Support/utils/manageGroups';

// Folder-list visibility is filtered server-side (server/src/modules/folder-apps/service.ts
// filterFoldersByPermissions): a builder sees a folder if it's in their editable/viewable
// folder-permission set, if they own it, OR if it contains at least one app they can already
// see (folderApps.length > 0) — that last clause means an unauthorized-but-nonempty folder
// can still surface via its contents. Both tests below keep the inaccessible folder fully
// empty so only the permission grant itself is under test.
describe('Modules — Folder & Module Visibility', () => {
  const testId = Date.now();

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

    // The builder ROLE itself is seeded with canEditFolder:true (All Folders) on
    // module_folder by default (DEFAULT_RESOURCE_PERMISSIONS) — strip it so each
    // test's custom-group grant is the only source of access being verified.
    cy.apiStripRoleFolderDefault('builder', 'module_folder');
  });

  it('a user sees only the (empty) module folders they are authorized to access, and an empty authorized folder still shows up', () => {
    const authorizedFolderName = `Authorized Folder ${testId}`;
    const unauthorizedFolderName = `Unauthorized Folder ${testId}`;
    const groupName = `QA Visibility Group ${testId}`;
    const userEmail = `qa-visibility-scope-${testId}@example.com`;

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
