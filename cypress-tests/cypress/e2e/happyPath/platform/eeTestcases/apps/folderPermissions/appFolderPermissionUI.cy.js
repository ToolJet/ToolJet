import { commonSelectors } from 'Selectors/common';
import {
  dataSourceFolderSelectors as dsFolder,
  dataSourceFolderPermissionSelectors as dsFolderPerm,
} from 'Selectors/platform/dataSourceFolders';
import { dashboardSelector } from 'Selectors/platform/dashboard';
import { commonEeSelectors } from 'Selectors/platform/eeCommon';
import { groupsSelector } from 'Selectors/platform/manageGroups';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import { openGroupThreeDotMenu } from 'Support/utils/platform/customGroups';
import { openGroupGranularAccess, uiSelectGrantFolders } from 'Support/utils/platform/dataSourceFolders';
import {
  TIERS,
  apiGetGranularPermissions,
  expectFolderListed,
  openAppsDashboard,
  openFolder,
  uiCreateFolder,
  uiDeleteFolder,
} from 'Support/utils/platform/folderPermissions';
import { verifyGranularPermissionModalUI } from 'Support/utils/platform/groupsUI';

describe('Apps — Folder Permission and Modal UI', { retries: 0 }, () => {
  let workspaceId, testId, wsName, wsSlug;

  beforeEach(() => {
    testId = Date.now();
    wsName = `app-folder-ui-${testId}`;
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

  it('should expose app folders on the granular access page with three single-select tiers', () => {
    const groupName = `QA App Folder UI Group ${testId}`;

    apiCreateGroup(groupName);
    cy.apiCreateAppFolder(`UI App Folder ${testId}`);

    openGroupGranularAccess(groupName);
    cy.get(groupsSelector.addPermissionButton).click();
    cy.get(groupsSelector.addFolderButton).should('be.visible').click();

    // Several modal shells share data-cy="modal-title"; address the visible one by its copy.
    cy.contains(dsFolder.modalTitle, 'Add app folders permissions').should('be.visible');
    verifyGranularPermissionModalUI('folder');

    cy.get(groupsSelector.viewAppRadio).should('be.checked');
    cy.get(groupsSelector.editFolderRadio).click();
    cy.get(groupsSelector.editFolderRadio).should('be.checked');
    cy.get(groupsSelector.viewAppRadio).should('not.be.checked');
    cy.get(groupsSelector.editAppRadio).click();
    cy.get(groupsSelector.editAppRadio).should('be.checked');
    cy.get(groupsSelector.editFolderRadio).should('not.be.checked');

    cy.get(commonSelectors.cancelButton).click();
    cy.get(commonSelectors.modalComponent).should('not.exist');
    cy.get(groupsSelector.folderGranularAccessRow).should('not.exist');
  });

  it('should require a folder for a Custom grant, keep it on reopen, and switch a saved grant to All', () => {
    const groupName = `QA App Grant Scope ${testId}`;
    const folderName = `Grant Scope App Folder ${testId}`;

    apiCreateGroup(groupName);
    cy.apiCreateAppFolder(folderName);

    openGroupGranularAccess(groupName);
    cy.get(groupsSelector.addPermissionButton).click();
    cy.get(groupsSelector.addFolderButton).click();
    cy.get(groupsSelector.viewAppRadio).click();

    cy.get(groupsSelector.permissionNameInput).type(`scoped ${testId}`);
    cy.get(groupsSelector.customRadio).check();
    cy.get(groupsSelector.confimButton).should('be.disabled');

    uiSelectGrantFolders([folderName]);
    cy.get(groupsSelector.confimButton).should('not.be.disabled').click();
    cy.verifyToastMessage(commonSelectors.toastMessage, 'Permission created successfully!');

    uiOpenEditFolderGrant();
    cy.get(groupsSelector.customRadio).should('be.checked');
    cy.get(dsFolderPerm.sharedModalSelectedResource).should('contain.text', folderName);
    cy.get(groupsSelector.viewAppRadio).should('be.checked');
    cy.get(groupsSelector.allAppsRadio).check();
    cy.intercept('GET', '/api/v2/group-permissions/*/granular-permissions').as('granularRefetch');
    cy.get(groupsSelector.confimButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, 'Permission updated successfully');
    cy.wait('@granularRefetch');
    cy.apiGetGroupId(groupName).then((groupId) =>
      apiGetGranularPermissions(groupId).then((permissions) => {
        const grant = permissions.find((perm) => perm.type === 'folder');
        expect(grant.isAll, 'grant switched to All app folders').to.equal(true);
      })
    );

    uiOpenEditFolderGrant();
    cy.get(groupsSelector.allAppsRadio).should('be.checked');
    cy.get(commonSelectors.cancelButton).click();
  });

  it('should copy the exact folders and tier flags when a group with an app-folder grant is duplicated', () => {
    const groupName = `QA App Config Group ${testId}`;
    const duplicatedGroupName = `${groupName}_copy`;
    let folderId;

    cy.apiCreateAppFolder(`App Config Folder ${testId}`).then((folder) => {
      folderId = folder.id;
      apiCreateGroup(groupName);
      cy.apiCreateGranularPermission(groupName, `folder edit ${testId}`, 'folder', TIERS.editItems, [folder.id], false);
    });

    cy.visit(`/${wsSlug}/workspace-settings/groups`);
    openGroupThreeDotMenu(groupName);
    cy.get(groupsSelector.duplicateOption).click();
    cy.get(commonEeSelectors.confirmButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, 'Group duplicated successfully');

    cy.apiGetGroupId(duplicatedGroupName).then((duplicatedGroupId) =>
      apiGetGranularPermissions(duplicatedGroupId).then((permissions) => {
        const copied = permissions.filter((perm) => perm.type === 'folder');
        expect(copied, 'exactly one app-folder grant copied').to.have.length(1);
        const { canEditFolder, canEditApps, canViewApps, groupFolders } = copied[0].foldersGroupPermissions;
        expect({ canEditFolder, canEditApps, canViewApps }).to.deep.equal(TIERS.editItems);
        expect(groupFolders.map((gf) => gf.folderId)).to.deep.equal([folderId]);
      })
    );
  });

  it('should list folders alphabetically, filter them by search, show an empty state, and allow reusing a deleted name', () => {
    const names = [`beta ${testId}`, `Alpha ${testId}`, `charlie ${testId}`];
    names.forEach((name) => cy.apiCreateAppFolder(name));

    openAppsDashboard();

    cy.get(dashboardSelector.anyFolderRow)
      .filter((_, el) => /^(alpha|beta|charlie)-/.test(el.dataset.cy))
      .then(($rows) => {
        const shown = [...$rows].map((el) => el.innerText.trim());
        expect(shown).to.deep.equal([`Alpha ${testId}`, `beta ${testId}`, `charlie ${testId}`]);
      });

    cy.get(dashboardSelector.folderSearchIcon).click();
    cy.get(dashboardSelector.folderSearchInput).type('charlie');
    expectFolderListed(`charlie ${testId}`);
    expectFolderListed(`Alpha ${testId}`, false);
    expectFolderListed(`beta ${testId}`, false);

    openAppsDashboard();
    openFolder(`beta ${testId}`);
    cy.get(commonSelectors.empytyFolderImage).should('be.visible');

    cy.apiGetAppFolderId(`beta ${testId}`).then((firstId) => {
      uiDeleteFolder(`beta ${testId}`);
      uiCreateFolder(`beta ${testId}`);
      cy.apiGetAppFolderId(`beta ${testId}`).then((secondId) => {
        expect(secondId, 're-created folder is a new folder').to.not.equal(firstId);
      });
    });
  });

  it('should validate the folder name in the create and rename modals and gate their submit buttons', () => {
    const folderName = `Modal App Folder ${testId}`;

    openAppsDashboard();

    cy.get(commonSelectors.createNewFolderButton).click();
    cy.get(commonSelectors.createFolderButton).should('be.disabled');

    cy.get(commonSelectors.folderNameInput).type('    ');
    cy.get(dsFolder.folderNameError).should('have.text', "Folder name can't be empty");
    cy.get(commonSelectors.createFolderButton).should('be.disabled');

    cy.clearAndType(commonSelectors.folderNameInput, 'a'.repeat(51));
    cy.get(commonSelectors.folderNameInput).invoke('val').should('have.length', 50);
    cy.get(commonSelectors.createFolderButton).should('not.be.disabled');

    cy.intercept('POST', '/api/folders').as('createFolder');
    cy.clearAndType(commonSelectors.folderNameInput, `  Modal   App Folder  ${testId}  `);
    cy.get(commonSelectors.createFolderButton).click();
    cy.wait('@createFolder').its('request.body.name').should('equal', folderName);
    expectFolderListed(folderName);

    cy.get(commonSelectors.createNewFolderButton).click();
    cy.clearAndType(commonSelectors.folderNameInput, folderName);
    cy.get(commonSelectors.createFolderButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, 'This folder name is already taken.');
    cy.get(commonSelectors.cancelButton).click();

    cy.get(commonSelectors.folderListcard(folderName)).parent().within(() => {
      cy.get(commonSelectors.folderCardOptions(folderName)).invoke('click');
    });
    cy.get(commonSelectors.editFolderOption(folderName)).click();
    cy.get(commonSelectors.folderNameInput).should('have.value', folderName);
    cy.get(commonSelectors.buttonSelector('update folder')).should('be.disabled');
    cy.clearAndType(commonSelectors.folderNameInput, `${folderName} Edited`);
    cy.get(commonSelectors.buttonSelector('update folder')).should('not.be.disabled');

    cy.get(commonSelectors.cancelButton).click();
    expectFolderListed(folderName);
    expectFolderListed(`${folderName} Edited`, false);
  });
});
