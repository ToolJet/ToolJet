import { commonSelectors } from 'Selectors/common';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import { openWorkflowsList } from 'Support/utils/platform/folderPermissions';

describe('Workflows — Folder & Workflow Visibility', () => {
  let workspaceId, wsName, wsSlug;

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `wf-folder-visibility-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    cy.apiDeleteGranularPermission('builder', ['workflow_folder']);
  });

  it('a user sees only the (empty) workflow folders they are authorized to access, and an empty authorized folder still shows up', () => {
    const attemptId = Date.now();
    const authorizedFolderName = `Authorized Workflow Folder ${attemptId}`;
    const unauthorizedFolderName = `Unauthorized Workflow Folder ${attemptId}`;
    const groupName = `QA Workflow Visibility Group ${attemptId}`;
    const userEmail = `wf-visibility-scope-${attemptId}@example.com`;

    cy.apiCreateWorkflowFolder(unauthorizedFolderName);
    cy.apiCreateWorkflowFolder(authorizedFolderName).then((folder) => {
      apiCreateGroup(groupName).then(() =>
        cy.apiCreateGranularPermission(
          groupName,
          `folder view ${attemptId}`,
          'workflow_folder',
          { canEditFolder: false, canEditApps: false, canViewApps: true },
          [folder.id],
          false
        )
      );
    });

    cy.then(() => {
      cy.apiFullUserOnboarding('QA Workflow Visibility Scope User', userEmail, 'builder', 'password', wsName, {}, [
        groupName,
      ]);

      cy.apiLogin(userEmail, 'password');
      openWorkflowsList();
      cy.get(commonSelectors.folderListcard(authorizedFolderName)).should('exist');
      cy.get(commonSelectors.folderListcard(unauthorizedFolderName)).should('not.exist');

      // The authorized folder is empty and still visible, showing the empty state.
      cy.get(commonSelectors.folderListcard(authorizedFolderName)).click();
      cy.get(commonSelectors.empytyFolderImage).should('be.visible');
    });
  });
});
