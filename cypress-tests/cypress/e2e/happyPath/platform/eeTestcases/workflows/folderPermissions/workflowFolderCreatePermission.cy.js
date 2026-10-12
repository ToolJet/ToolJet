import { commonSelectors } from 'Selectors/common';
import { groupsSelector } from 'Selectors/platform/manageGroups';
import { navigateToManageGroups } from 'Support/utils/common';
import { apiAddUserToGroup, apiCreateGroup } from 'Support/utils/manageGroups';
import { openWorkflowsList } from 'Support/utils/platform/folderPermissions';
import { groupsText } from 'Texts/platform/manageGroups';

describe('Workflows — Folder Permissions: Custom Group Create Override', () => {
  // Regenerated per attempt: a Cypress retry reruns this beforeEach, and a
  // describe-level id would collide on the unique workspace slug (409),
  // masking whatever made the first attempt fail.
  let testId, wsName, wsSlug;

  let workspaceId, groupId1;

  beforeEach(() => {
    testId = Date.now();
    wsName = `wf-folder-create-${testId}`;
    wsSlug = wsName;
    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
    // Strip the builder ROLE's own workflowFolderCreate so the only route to the
    // affordance is the custom group this test grants.
    cy.apiUpdateGroupPermission('builder', { workflowFolderCreate: false });
  });

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  it('custom group with workflowFolderCreate OFF blocks the builder from creating a workflow folder', () => {
    const groupName = `QA Workflow Folder ${testId}`;
    const userEmail = `wf-folder-create-${testId}@example.com`;

    cy.apiFullUserOnboarding('QA', userEmail, 'builder', 'password', wsName);
    cy.apiLogout();

    cy.apiLogin();

    apiCreateGroup(groupName).then((groupId) => {
      groupId1 = groupId;
      apiAddUserToGroup(groupId1, userEmail);
    });
    cy.apiLogout();

    cy.apiLogin(userEmail, 'password');
    openWorkflowsList();
    cy.get(commonSelectors.createNewFolderButton).should('not.exist');
    cy.apiLogout();

    cy.apiLogin();
    cy.visit(`/${wsSlug}`);

    navigateToManageGroups();
    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.workflowFolderCreateCheck).check();
    cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.permissionUpdatedToast);

    cy.apiLogout();

    cy.apiLogin(userEmail, 'password');
    openWorkflowsList();
    cy.get(commonSelectors.createNewFolderButton).should('be.visible');
  });
});
