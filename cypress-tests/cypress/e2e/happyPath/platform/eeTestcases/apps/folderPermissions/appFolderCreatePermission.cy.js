import { commonSelectors } from 'Selectors/common';
import { groupsSelector } from 'Selectors/platform/manageGroups';
import { navigateToManageGroups } from 'Support/utils/common';
import { apiAddUserToGroup, apiCreateGroup } from 'Support/utils/manageGroups';
import { openAppsDashboard } from 'Support/utils/platform/folderPermissions';
import { groupsText } from 'Texts/platform/manageGroups';

describe('Apps — Folder Permissions: Custom Group Create Override', () => {
  // Regenerated per attempt: a Cypress retry reruns this beforeEach, and a
  // describe-level id would collide on the unique workspace slug (409),
  // masking whatever made the first attempt fail.
  let testId, wsName, wsSlug;

  let workspaceId, groupId1;

  beforeEach(() => {
    testId = Date.now();
    wsName = `app-folder-create-${testId}`;
    wsSlug = wsName;
    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
    // Strip the builder ROLE's own folderCreate so the only route to the
    // affordance is the custom group this test grants.
    cy.apiUpdateGroupPermission('builder', { folderCreate: false });
  });

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  it('custom group with folderCreate OFF blocks the builder from creating an app folder', () => {
    const groupName = `QA App Folder ${testId}`;
    const userEmail = `app-folder-create-${testId}@example.com`;

    cy.apiFullUserOnboarding('QA', userEmail, 'builder', 'password', wsName);
    cy.apiLogout();

    cy.apiLogin();

    apiCreateGroup(groupName).then((groupId) => {
      groupId1 = groupId;
      apiAddUserToGroup(groupId1, userEmail);
    });
    cy.apiLogout();

    cy.apiLogin(userEmail, 'password');
    openAppsDashboard();
    cy.get(commonSelectors.createNewFolderButton).should('not.exist');
    cy.apiLogout();

    cy.apiLogin();
    cy.visit(`/${wsSlug}`);

    navigateToManageGroups();
    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.foldersCreateCheck).check();
    cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.permissionUpdatedToast);

    cy.apiLogout();

    cy.apiLogin(userEmail, 'password');
    openAppsDashboard();
    cy.get(commonSelectors.createNewFolderButton).should('be.visible');
  });
});
