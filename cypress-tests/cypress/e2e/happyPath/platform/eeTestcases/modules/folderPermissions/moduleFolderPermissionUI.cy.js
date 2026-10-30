import { commonSelectors } from 'Selectors/common';
import { dataSourceFolderPermissionSelectors as dsFolderPerm } from 'Selectors/platform/dataSourceFolders';
import { commonEeSelectors } from 'Selectors/platform/eeCommon';
import { folderGrantSelectors } from 'Selectors/platform/folderPermissions';
import { groupsSelector } from 'Selectors/platform/manageGroups';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import { openGroupThreeDotMenu } from 'Support/utils/platform/customGroups';
import { openGroupGranularAccess, uiSelectGrantFolders } from 'Support/utils/platform/dataSourceFolders';
import {
  RESOURCES,
  TIERS,
  apiCreateFolder,
  apiGetGranularPermissions,
  apiGrantFolderTier,
} from 'Support/utils/platform/folderPermissions';

describe('Modules — Folder Permission and Modal UI', { retries: 0 }, () => {
  const R = RESOURCES.module;
  const grant = folderGrantSelectors.module;
  let workspaceId, testId, wsName, wsSlug;

  beforeEach(() => {
    testId = Date.now();
    wsName = `module-folder-ui-${testId}`;
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

  const uiOpenEditGrant = () => {
    cy.get(grant.row).realHover();
    cy.get(grant.editRow).click({ force: true });
  };

  it('should expose module folders on the granular access page with three single-select tiers', () => {
    const groupName = `QA Module Folder UI Group ${testId}`;

    apiCreateGroup(groupName);
    apiCreateFolder(R, `UI Module Folder ${testId}`);

    openGroupGranularAccess(groupName);
    cy.get(groupsSelector.addPermissionButton).click();
    cy.get(grant.addButton).should('be.visible').click();

    cy.get(grant.editFolderLabel).should('have.text', R.labels.editFolder);
    cy.get(grant.editItemsLabel).should('have.text', R.labels.editItems);
    cy.get(grant.viewItemsLabel).should('have.text', R.labels.viewItems);
    cy.get(grant.allFoldersLabel).should('have.text', R.allFoldersText);

    cy.get(grant.editFolderRadio).click();
    cy.get(grant.editFolderRadio).should('be.checked');
    cy.get(grant.editItemsRadio).click();
    cy.get(grant.editItemsRadio).should('be.checked');
    cy.get(grant.editFolderRadio).should('not.be.checked');
    cy.get(grant.viewItemsRadio).click();
    cy.get(grant.viewItemsRadio).should('be.checked');
    cy.get(grant.editItemsRadio).should('not.be.checked');

    cy.get(commonSelectors.cancelButton).click();
    cy.get(commonSelectors.modalComponent).should('not.exist');
    cy.get(grant.row).should('not.exist');
  });

  it('should require a folder for a Custom grant, keep it on reopen, and switch a saved grant to All', () => {
    const groupName = `QA Module Grant Scope ${testId}`;
    const folderName = `Grant Scope Module Folder ${testId}`;

    apiCreateGroup(groupName);
    apiCreateFolder(R, folderName);

    openGroupGranularAccess(groupName);
    cy.get(groupsSelector.addPermissionButton).click();
    cy.get(grant.addButton).click();
    cy.get(grant.viewItemsRadio).click();
    cy.get(groupsSelector.permissionNameInput).type(`scoped ${testId}`);
    cy.get(groupsSelector.customRadio).check();
    cy.get(groupsSelector.confimButton).should('be.disabled');

    uiSelectGrantFolders([folderName]);
    cy.get(groupsSelector.confimButton).should('not.be.disabled').click();
    cy.verifyToastMessage(commonSelectors.toastMessage, 'Permission created successfully!');

    uiOpenEditGrant();
    cy.get(groupsSelector.customRadio).should('be.checked');
    cy.get(dsFolderPerm.sharedModalSelectedResource).should('contain.text', folderName);
    cy.get(groupsSelector.allAppsRadio).check();
    cy.get(groupsSelector.confimButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, 'Permission updated successfully');
    cy.apiGetGroupId(groupName).then((groupId) =>
      apiGetGranularPermissions(groupId).then((permissions) => {
        const saved = permissions.find((perm) => perm.type === R.granularType);
        expect(saved.isAll, 'grant switched to All module folders').to.equal(true);
      })
    );
  });

  it('should copy the exact folders and tier flags when a group with a module folder grant is duplicated', () => {
    const groupName = `QA Module Config Group ${testId}`;
    let folderId;

    apiCreateFolder(R, `Module Config Folder ${testId}`).then((folder) => {
      folderId = folder.id;
      apiCreateGroup(groupName);
      apiGrantFolderTier(R, groupName, `folder edit ${testId}`, TIERS.editItems, [folder.id]);
    });

    cy.visit(`/${wsSlug}/workspace-settings/groups`);
    openGroupThreeDotMenu(groupName);
    cy.get(groupsSelector.duplicateOption).click();
    cy.get(commonEeSelectors.confirmButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, 'Group duplicated successfully');

    cy.apiGetGroupId(`${groupName}_copy`).then((copyId) =>
      apiGetGranularPermissions(copyId).then((permissions) => {
        const copied = permissions.filter((perm) => perm.type === R.granularType);
        expect(copied, 'exactly one module folder grant copied').to.have.length(1);
        const { canEditFolder, canEditApps, canViewApps, groupFolders } = copied[0].foldersGroupPermissions;
        expect({ canEditFolder, canEditApps, canViewApps }).to.deep.equal(TIERS.editItems);
        expect(groupFolders.map((gf) => gf.folderId)).to.deep.equal([folderId]);
      })
    );
  });
});
