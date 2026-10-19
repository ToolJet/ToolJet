import { commonSelectors } from 'Selectors/common';
import { dashboardSelector } from 'Selectors/platform/dashboard';
import { groupsSelector } from 'Selectors/platform/manageGroups';
import { apiAddUserToGroup, apiCreateGroup } from 'Support/utils/manageGroups';
import {
  RESOURCES,
  TIERS,
  apiAddItemToFolder,
  apiCreateFolder,
  apiCreateItem,
  apiGetItemIdsInFolder,
  apiGrantFolderTier,
  apiRemoveItemFromFolder,
  expectFolderMenuOptions,
  loginAs,
  loginAsAdmin,
  openAll,
  openList,
  phase,
  uiCreateFolder,
  uiDeleteFolder,
  uiRenameFolder,
} from 'Support/utils/platform/folderPermissions';
import { groupsText } from 'Texts/platform/manageGroups';

// Default role access to module folders, and custom group overrides of the coarse create / delete flags.
describe('Modules — Folder Permissions: Default Role Access', { retries: 0 }, () => {
  const R = RESOURCES.module;
  let workspaceId, testId, wsName, wsSlug;

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    testId = Date.now();
    wsName = `module-folder-role-${testId}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
  });

  const verifyFolderCreateRenameDelete = (folderName) => {
    openList(R);
    uiCreateFolder(folderName);
    uiRenameFolder(folderName, `${folderName} Renamed`);
    uiDeleteFolder(`${folderName} Renamed`);
  };

  it('should give each role its default module folder access, and never delete a module with its folder', () => {
    const adminEmail = `module-folder-admin-${testId}@example.com`;
    const builderEmail = `module-folder-builder-${testId}@example.com`;
    const endUserEmail = `module-folder-enduser-${testId}@example.com`;
    const folderName = `Survivor Module Folder ${testId}`;
    const keptName = `Kept Module ${testId}`;
    const removedName = `Removed Module ${testId}`;
    const ids = {};

    phase('admin: create, rename and delete');
    cy.apiFullUserOnboarding('QA', adminEmail, 'admin', 'password', wsName);
    loginAs(adminEmail);
    verifyFolderCreateRenameDelete(`Admin Module Folder ${testId}`);

    phase('builder: create, rename and delete');
    loginAsAdmin();
    cy.apiFullUserOnboarding('QA', builderEmail, 'builder', 'password', wsName);
    loginAs(builderEmail);
    verifyFolderCreateRenameDelete(`Builder Module Folder ${testId}`);

    phase('end user: no folder-create affordance');
    loginAsAdmin();
    cy.apiFullUserOnboarding('QA', endUserEmail, 'end-user', 'password', wsName);
    loginAs(endUserEmail);
    openList(R);
    cy.get(dashboardSelector.folderLabel).should('be.visible');
    cy.get(commonSelectors.createNewFolderButton).should('not.exist');

    phase('removing a module from a folder, or deleting the folder, keeps the module');
    loginAsAdmin();
    apiCreateFolder(R, folderName).then((folder) => {
      apiCreateItem(R, keptName).then((id) => {
        ids.kept = id;
        apiAddItemToFolder(R, id, folder.id);
      });
      apiCreateItem(R, removedName).then((id) => {
        ids.removed = id;
        apiAddItemToFolder(R, id, folder.id);
      });

      cy.then(() => {
        apiRemoveItemFromFolder(R, ids.removed, folder.id);
        apiGetItemIdsInFolder(folder.id, R.folderType).then((inFolder) => expect(inFolder).to.deep.equal([ids.kept]));
        openList(R);
        uiDeleteFolder(folderName);
        openAll(R);
        cy.get(commonSelectors.appCard(keptName)).should('exist');
        cy.get(commonSelectors.appCard(removedName)).should('exist');
      });
    });
  });

  it('should let a custom group give back module folder create and delete once the builder role loses them, while an owner can always delete their own folder', () => {
    const groupName = `QA Module Folder Coarse Group ${testId}`;
    const userEmail = `module-folder-coarse-${testId}@example.com`;
    const adminFolderName = `Admin Owned Module Folder ${testId}`;
    const builderFolderName = `Builder Own Module Folder ${testId}`;

    // Builder flags are stripped before the role has members; an Edit folder grant makes the admin folder's menu render.
    cy.apiUpdateGroupPermission('builder', { [R.coarse.create]: false, [R.coarse.delete]: false });
    apiCreateFolder(R, adminFolderName).then((folder) => {
      apiCreateGroup(groupName);
      apiGrantFolderTier(R, groupName, `${groupName} perm`, TIERS.editFolder, [folder.id]);
    });
    cy.apiFullUserOnboarding('QA', userEmail, 'builder', 'password', wsName);
    loginAsAdmin();
    cy.apiGetGroupId(groupName).then((groupId) => apiAddUserToGroup(groupId, userEmail));

    phase('builder role without create and delete: no create button, no delete on a folder they do not own');
    loginAs(userEmail);
    openList(R);
    cy.get(commonSelectors.createNewFolderButton).should('not.exist');
    expectFolderMenuOptions(adminFolderName, { rename: true, remove: false });

    phase('custom group grants module folder create from the Permissions tab');
    loginAsAdmin();
    cy.visit(`/${wsSlug}/workspace-settings/groups`);
    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(R.coarseCreateCheck).check();
    cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.permissionUpdatedToast);

    loginAs(userEmail);
    openList(R);
    cy.get(commonSelectors.createNewFolderButton).should('be.visible');

    phase('ownership overrides the missing delete flag');
    uiCreateFolder(builderFolderName);
    uiDeleteFolder(builderFolderName);

    phase("custom group grants module folder delete: another user's folder can now be deleted");
    loginAsAdmin();
    cy.apiUpdateGroupPermission(groupName, { [R.coarse.delete]: true });
    loginAs(userEmail);
    openList(R);
    uiDeleteFolder(adminFolderName);
  });
});
