import { commonSelectors } from 'Selectors/common';
import { dashboardSelector } from 'Selectors/platform/dashboard';
import { groupsSelector } from 'Selectors/platform/manageGroups';
import { apiAddUserToGroup, apiCreateGroup } from 'Support/utils/manageGroups';
import {
  apiGetItemIdsInFolder,
  expectFolderMenuOptions,
  loginAs,
  loginAsAdmin,
  openAllApps,
  openAppsDashboard,
  phase,
  uiCreateFolder,
  uiDeleteFolder,
  uiRenameFolder,
} from 'Support/utils/platform/folderPermissions';
import { groupsText } from 'Texts/platform/manageGroups';

// Who can create, rename and delete app folders by default, and how a custom group overrides the coarse (Permissions tab) folderCreate / folderDelete flags once the builder role's own flags are switched off.
describe('Apps — Folder Permissions: Default Role Access', { retries: 0 }, () => {
  let workspaceId, testId, wsName, wsSlug;

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    testId = Date.now();
    wsName = `app-folder-role-${testId}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
  });

  const verifyFolderCreateRenameDelete = (folderName) => {
    const renamedFolderName = `${folderName} Renamed`;

    openAppsDashboard();
    uiCreateFolder(folderName);
    uiRenameFolder(folderName, renamedFolderName);
    uiDeleteFolder(renamedFolderName);
  };

  it('should give each role its default folder access, and never delete an app with its folder', () => {
    const adminEmail = `app-folder-admin-${testId}@example.com`;
    const builderEmail = `app-folder-builder-${testId}@example.com`;
    const endUserEmail = `app-folder-enduser-${testId}@example.com`;
    const folderName = `Survivor App Folder ${testId}`;
    const keptAppName = `Kept App ${testId}`;
    const removedAppName = `Removed App ${testId}`;
    const appIds = {};

    phase('admin: create, rename and delete');
    cy.apiFullUserOnboarding('QA', adminEmail, 'admin', 'password', wsName);
    loginAs(adminEmail);
    verifyFolderCreateRenameDelete(`Admin App Folder ${testId}`);

    phase('builder: create, rename and delete');
    loginAsAdmin();
    cy.apiFullUserOnboarding('QA', builderEmail, 'builder', 'password', wsName);
    loginAs(builderEmail);
    verifyFolderCreateRenameDelete(`Builder App Folder ${testId}`);

    phase('end user: no folder-create affordance');
    loginAsAdmin();
    cy.apiFullUserOnboarding('QA', endUserEmail, 'end-user', 'password', wsName);
    loginAs(endUserEmail);
    openAppsDashboard();
    cy.get(dashboardSelector.folderLabel).should('be.visible');
    cy.get(commonSelectors.createNewFolderButton).should('not.exist');

    phase('removing an app from a folder, or deleting the folder, keeps the app');
    loginAsAdmin();
    cy.apiCreateAppFolder(folderName).then((folder) => {
      cy.apiCreateApp(keptAppName).then(() => {
        appIds.kept = Cypress.env('appId');
        cy.apiAddAppToFolder(folder.id, appIds.kept);
      });
      cy.apiCreateApp(removedAppName).then(() => {
        appIds.removed = Cypress.env('appId');
        cy.apiAddAppToFolder(folder.id, appIds.removed);
      });

      cy.then(() => {
        apiGetItemIdsInFolder(folder.id).then((ids) => expect(ids).to.have.members([appIds.kept, appIds.removed]));

        cy.apiRemoveAppFromFolder(appIds.removed, folder.id);
        apiGetItemIdsInFolder(folder.id).then((ids) => expect(ids).to.deep.equal([appIds.kept]));

        // Deleting the folder (as its owner) does not delete the app still inside it.
        openAppsDashboard();
        uiDeleteFolder(folderName);
        openAllApps();
        cy.get(commonSelectors.appCard(keptAppName)).should('exist');
        cy.get(commonSelectors.appCard(removedAppName)).should('exist');
      });
    });
  });

  it("should let a custom group give back folder create and delete once the builder role loses them, while an owner can always delete their own folder", () => {
    const groupName = `QA App Folder Coarse Group ${testId}`;
    const userEmail = `app-folder-coarse-${testId}@example.com`;
    const adminFolderName = `Admin Owned App Folder ${testId}`;
    const builderFolderName = `Builder Own App Folder ${testId}`;

    // Strip the builder ROLE's own flags before it has members, so the custom group is the only route back.
    cy.apiUpdateGroupPermission('builder', { folderCreate: false, folderDelete: false });
    cy.apiCreateAppFolder(adminFolderName);
    cy.apiFullUserOnboarding('QA', userEmail, 'builder', 'password', wsName);
    loginAsAdmin();
    apiCreateGroup(groupName).then((groupId) => apiAddUserToGroup(groupId, userEmail));

    phase('builder role without create and delete: no create button, no delete on a folder they do not own');
    // The custom group starts with both flags OFF, so it does not give them back yet.
    loginAs(userEmail);
    openAppsDashboard();
    cy.get(commonSelectors.createNewFolderButton).should('not.exist');
    // The builder role's default Edit-folder grant still offers Rename; Delete is absent.
    expectFolderMenuOptions(adminFolderName, { rename: true, remove: false });

    phase('custom group grants folder create from the Permissions tab');
    loginAsAdmin();
    cy.visit(`/${wsSlug}/workspace-settings/groups`);
    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.foldersCreateCheck).check();
    cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.permissionUpdatedToast);

    loginAs(userEmail);
    openAppsDashboard();
    cy.get(commonSelectors.createNewFolderButton).should('be.visible');

    phase('ownership overrides the missing delete flag');
    uiCreateFolder(builderFolderName);
    uiDeleteFolder(builderFolderName);

    phase("custom group grants folder delete: another user's folder can now be deleted");
    loginAsAdmin();
    cy.apiUpdateGroupPermission(groupName, { folderDelete: true });

    loginAs(userEmail);
    openAppsDashboard();
    uiDeleteFolder(adminFolderName);
  });
});
