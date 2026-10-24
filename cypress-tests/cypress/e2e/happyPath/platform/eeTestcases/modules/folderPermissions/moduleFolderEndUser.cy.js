import { commonSelectors } from 'Selectors/common';
import { dataSourceFolderSelectors as dsFolder } from 'Selectors/platform/dataSourceFolders';
import { folderGrantSelectors } from 'Selectors/platform/folderPermissions';
import { groupsSelector } from 'Selectors/platform/manageGroups';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import { openGroupGranularAccess, uiAddUserToGroup } from 'Support/utils/platform/dataSourceFolders';
import { RESOURCES, TIERS, apiCreateFolder, apiGrantFolderTier, loginAsAdmin } from 'Support/utils/platform/folderPermissions';

describe('Modules — Folder Permissions: End User Role', { retries: 0 }, () => {
  const R = RESOURCES.module;
  const grant = folderGrantSelectors.module;
  let workspaceId, wsName, wsSlug, testId;

  beforeEach(() => {
    testId = Date.now();
    wsName = `module-folder-enduser-${testId}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
  });

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  it('should not let the default End-user group add module folders at all', () => {
    openGroupGranularAccess('End-user');
    cy.get(groupsSelector.addPermissionButton).click();
    cy.get(grant.addButton).should('be.disabled');
    cy.get(grant.addButton).realHover();
    cy.contains('.tooltip', 'End-user cannot access module folders').should('be.visible');
  });

  it('should refuse any module folder tier on a group holding an end user, and refuse an end user joining a group holding one', () => {
    const groupName = `QA Module EndUser Guard ${testId}`;
    const email = `module-enduser-guard-${testId}@example.com`;
    const tieredGroupName = `QA Module Tier Group ${testId}`;
    const outsider = `module-enduser-outsider-${testId}@example.com`;

    apiCreateFolder(R, `Guard Module Folder ${testId}`).then((folder) => {
      apiCreateGroup(groupName);
      apiCreateGroup(tieredGroupName);
      apiGrantFolderTier(R, tieredGroupName, `${tieredGroupName} perm`, TIERS.viewItems, [folder.id]);
    });
    cy.apiFullUserOnboarding('QA EndUser', email, 'end-user', 'password', wsName, {}, [groupName]);
    loginAsAdmin();
    cy.apiFullUserOnboarding('QA EndUser2', outsider, 'end-user', 'password', wsName);
    loginAsAdmin();

    // Even the lowest tier is a builder-level grant, so the server refuses it and names the end user.
    openGroupGranularAccess(groupName);
    cy.get(groupsSelector.addPermissionButton).click();
    cy.get(grant.addButton).click();
    cy.get(groupsSelector.permissionNameInput).type(`module folder ${testId}`);
    cy.get(grant.viewItemsRadio).click({ force: true });
    cy.get(groupsSelector.confimButton).click();
    // The server refuses a Module folder grant without an error type, so the frontend shows the
    // generic ErrorModal here rather than the role-change dialog used for the add-user refusal.
    cy.get(dsFolder.errorModalHeader).should('have.text', 'Cannot add this permission to the group');
    cy.get(dsFolder.errorModalMessage).should('contain.text', 'End-users cannot have Module folder permissions');
    cy.get(dsFolder.errorModal).should('contain.text', email);
    cy.get(dsFolder.errorModalClose).click();

    cy.visit(`/${wsSlug}/workspace-settings/groups`);
    cy.get(groupsSelector.groupLink(tieredGroupName)).click();
    uiAddUserToGroup(outsider);
    cy.get(dsFolder.roleConflictModal).should('contain.text', 'Cannot add an end-user to this group');
    cy.get(dsFolder.roleConflictModal).should('contain.text', outsider);
  });
});
