import { commonSelectors } from 'Selectors/common';
import { groupsSelector } from 'Selectors/platform/manageGroups';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import { openGroupGranularAccess, uiAddUserToGroup } from 'Support/utils/platform/dataSourceFolders';
import {
  TIERS,
  expectFolderListed,
  expectFolderMenuAbsent,
  loginAs,
  loginAsAdmin,
  openAppsDashboard,
  openFolder,
} from 'Support/utils/platform/folderPermissions';

// End users and app folders.
describe('Apps — Folder Permissions: End User Role', { retries: 0 }, () => {
  let workspaceId, wsName, wsSlug, testId;
  const editTierTooltip = 'End-user cannot have edit permission';

  beforeEach(() => {
    testId = Date.now();
    wsName = `app-folder-enduser-${testId}`;
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

  const uiOpenEditFolderGrant = () => {
    cy.get(groupsSelector.folderGranularAccessRow).realHover();
    cy.get(groupsSelector.editFolderGranularAccess).click({ force: true });
  };

  it('should offer the default End-user group app folders at View apps only, with both edit tiers disabled', () => {
    openGroupGranularAccess('End-user');
    cy.get(groupsSelector.addPermissionButton).click();
    cy.get(groupsSelector.addFolderButton).should('be.enabled').click();

    // Only the tiers are role-gated; the scope radios are not asserted (the shared verifyGranularPermissionModalStates 'enduser' preset expects All disabled, which no longer holds).
    cy.get(groupsSelector.editFolderRadio).should('be.disabled').and('not.be.checked');
    cy.get(groupsSelector.editAppRadio).should('be.disabled').and('not.be.checked');
    cy.get(groupsSelector.viewAppRadio).should('be.enabled').and('be.checked');

    cy.get(groupsSelector.editFolderRadio).parents('label').realHover();
    cy.contains('.tooltip', editTierTooltip).should('be.visible');
  });

  it('should let a View apps grant reveal the folder and its apps to an end user, and nothing beyond it', () => {
    const folderName = `End User App Folder ${testId}`;
    const otherFolderName = `Other App Folder ${testId}`;
    const appName = `End User App ${testId}`;
    const groupName = `QA EndUser View ${testId}`;
    const email = `app-enduser-view-${testId}@example.com`;

    // Strip the End-user role's own app/folder grants so the custom group is the only way in.
    cy.apiDeleteGranularPermission('end-user', ['app', 'folder']);
    cy.apiCreateAppFolder(otherFolderName);
    cy.apiCreateAppFolder(folderName).then((folder) => {
      cy.apiCreateApp(appName).then(() => cy.apiAddAppToFolder(folder.id, Cypress.env('appId')));
      apiCreateGroup(groupName);
      cy.apiCreateGranularPermission(groupName, `${groupName} perm`, 'folder', TIERS.viewItems, [folder.id], false);
    });
    cy.apiFullUserOnboarding('QA EndUser', email, 'end-user', 'password', wsName, {}, [groupName]);

    loginAs(email);
    openAppsDashboard();
    expectFolderMenuAbsent(folderName);
    expectFolderListed(otherFolderName, false);
    openFolder(folderName);
    cy.get(commonSelectors.appCard(appName)).should('be.visible');
  });

  it('should refuse an edit tier on a group holding an end user, and refuse an end user joining a group holding one', () => {
    const groupName = `QA EndUser Guard ${testId}`;
    const email = `app-enduser-guard-${testId}@example.com`;
    const editGroupName = `QA Edit Tier Group ${testId}`;
    const outsider = `app-enduser-outsider-${testId}@example.com`;

    cy.apiCreateAppFolder(`Guard App Folder ${testId}`).then((folder) => {
      apiCreateGroup(groupName);
      cy.apiCreateGranularPermission(groupName, `${groupName} perm`, 'folder', TIERS.viewItems, [folder.id], false);
      apiCreateGroup(editGroupName);
      cy.apiCreateGranularPermission(editGroupName, `${editGroupName} perm`, 'folder', TIERS.editFolder, [folder.id], false);
    });
    cy.apiFullUserOnboarding('QA EndUser', email, 'end-user', 'password', wsName, {}, [groupName]);
    // Onboarding leaves the browser logged in as the new user, so re-login before the next invite.
    loginAsAdmin();
    cy.apiFullUserOnboarding('QA EndUser2', outsider, 'end-user', 'password', wsName);
    loginAsAdmin();

    // 1 — on a custom group the edit tiers stay enabled (it could hold builders), so the server is the guard: promoting the grant names the end user and refuses.
    openGroupGranularAccess(groupName);
    uiOpenEditFolderGrant();
    cy.get(groupsSelector.editAppRadio).should('be.enabled').click({ force: true });
    cy.get(groupsSelector.confimButton).click();
    cy.get(commonSelectors.modalComponent).should('contain.text', 'Cannot add this permission to the group');
    cy.get(commonSelectors.modalComponent).should('contain.text', email);
    cy.get(commonSelectors.cancelButton).click();

    // 2 — mirror guard: an end user cannot join a group that already holds an edit tier.
    cy.visit(`/${wsSlug}/workspace-settings/groups`);
    cy.get(groupsSelector.groupLink(editGroupName)).click();
    uiAddUserToGroup(outsider);
    cy.get(commonSelectors.modalComponent).should('contain.text', 'Cannot add an end-user to this group');
    cy.get(commonSelectors.modalComponent).should('contain.text', outsider);
  });
});
