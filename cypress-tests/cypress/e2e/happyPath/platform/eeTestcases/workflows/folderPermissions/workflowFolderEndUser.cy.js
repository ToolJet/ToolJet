import { commonSelectors } from 'Selectors/common';
import { folderGrantSelectors } from 'Selectors/platform/folderPermissions';
import { groupsSelector } from 'Selectors/platform/manageGroups';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import { openGroupGranularAccess, uiAddUserToGroup } from 'Support/utils/platform/dataSourceFolders';
import { RESOURCES, TIERS, apiCreateFolder, apiGrantFolderTier, loginAsAdmin } from 'Support/utils/platform/folderPermissions';

// End users can hold a workflow folder grant at Execute workflows only; running workflows as an end user is not covered yet.
describe('Workflows — Folder Permissions: End User Role', { retries: 0 }, () => {
  const R = RESOURCES.workflow;
  const grant = folderGrantSelectors.workflow;
  let workspaceId, wsName, wsSlug, testId;

  beforeEach(() => {
    testId = Date.now();
    wsName = `wf-folder-enduser-${testId}`;
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

  it('should offer the default End-user group workflow folders at Execute workflows only, with both edit tiers disabled', () => {
    openGroupGranularAccess('End-user');
    cy.get(groupsSelector.addPermissionButton).click();
    cy.get(grant.addButton).should('be.enabled').click();

    cy.get(grant.editFolderRadio).should('be.disabled').and('not.be.checked');
    cy.get(grant.editItemsRadio).should('be.disabled').and('not.be.checked');
    cy.get(grant.viewItemsRadio).should('be.enabled');
    cy.get(grant.editFolderRadio).parents('label').realHover();
    cy.contains('.tooltip', 'End-user cannot have edit permission').should('be.visible');
  });

  it('should refuse an edit tier on a group holding an end user, and refuse an end user joining a group holding one', () => {
    const groupName = `QA Workflow EndUser Guard ${testId}`;
    const email = `wf-enduser-guard-${testId}@example.com`;
    const editGroupName = `QA Workflow Edit Tier Group ${testId}`;
    const outsider = `wf-enduser-outsider-${testId}@example.com`;

    apiCreateFolder(R, `Guard Workflow Folder ${testId}`).then((folder) => {
      apiCreateGroup(groupName);
      apiGrantFolderTier(R, groupName, `${groupName} perm`, TIERS.viewItems, [folder.id]);
      apiCreateGroup(editGroupName);
      apiGrantFolderTier(R, editGroupName, `${editGroupName} perm`, TIERS.editFolder, [folder.id]);
    });
    cy.apiFullUserOnboarding('QA EndUser', email, 'end-user', 'password', wsName, {}, [groupName]);
    loginAsAdmin();
    cy.apiFullUserOnboarding('QA EndUser2', outsider, 'end-user', 'password', wsName);
    loginAsAdmin();

    // A custom group may hold builders, so its edit tiers stay enabled and the server refuses the save, naming the end user.
    openGroupGranularAccess(groupName);
    cy.get(grant.row).realHover();
    cy.get(grant.editRow).click({ force: true });
    cy.get(grant.editItemsRadio).should('be.enabled').click({ force: true });
    cy.get(groupsSelector.confimButton).click();
    cy.get(commonSelectors.modalComponent).should('contain.text', 'Cannot add this permission to the group');
    cy.get(commonSelectors.modalComponent).should('contain.text', email);
    cy.get(commonSelectors.cancelButton).click();

    cy.visit(`/${wsSlug}/workspace-settings/groups`);
    cy.get(groupsSelector.groupLink(editGroupName)).click();
    uiAddUserToGroup(outsider);
    cy.get(commonSelectors.modalComponent).should('contain.text', 'Cannot add an end-user to this group');
    cy.get(commonSelectors.modalComponent).should('contain.text', outsider);
  });
});
