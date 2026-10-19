import { commonSelectors } from 'Selectors/common';
import { versionSwitcherSelectors } from 'Selectors/platform/version';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import {
  RESOURCES,
  TIERS,
  apiAddItemToFolder,
  apiCreateFolder,
  apiCreateItem,
  apiGetItemIdsInFolder,
  apiGrantFolderTier,
  expectFolderMenuAbsent,
  expectFolderMenuOptions,
  loginAs,
  openAll,
  openAppEditor,
  openFolder,
  openList,
  phase,
  uiAddItemToFolder,
  uiRemoveItemFromFolder,
  uiRenameFolder,
} from 'Support/utils/platform/folderPermissions';

// What a module folder grant lets a builder do to the folder itself; tier effects on the modules live in PermissionTiers.
describe('Modules — Folder Granular Access', { retries: 0 }, () => {
  const R = RESOURCES.module;
  let workspaceId, wsName, wsSlug;

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `module-folder-granular-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
    cy.apiDeleteGranularPermission('builder', [R.itemGrantType, R.granularType]);
    cy.apiUpdateGroupPermission('builder', { [R.coarse.create]: false, [R.coarse.delete]: false });
  });

  it('should let an Edit folder grant rename the folder, move modules in and out of it from the UI, and edit the module inside it', () => {
    const attemptId = Date.now();
    const folderName = `EditFolder Module Folder ${attemptId}`;
    const renamed = `${folderName} Renamed`;
    const moduleName = `EditFolder Module ${attemptId}`;
    const looseName = `Loose Module ${attemptId}`;
    const groupName = `QA EditFolder Module Group ${attemptId}`;
    const userEmail = `qa-module-folder-editfolder-${attemptId}@example.com`;
    let folderId, moduleId, looseId;

    apiCreateFolder(R, folderName).then((folder) => {
      folderId = folder.id;
      apiCreateItem(R, moduleName).then((id) => {
        moduleId = id;
        apiAddItemToFolder(R, id, folder.id);
      });
      apiCreateGroup(groupName);
      apiGrantFolderTier(R, groupName, `${groupName} perm`, TIERS.editFolder, [folder.id]);
    });
    cy.apiFullUserOnboarding('QA EditFolder', userEmail, 'builder', 'password', wsName, {}, [groupName]);

    loginAs(userEmail);
    // The user owns this module, which is what lets them move it.
    apiCreateItem(R, looseName).then((id) => {
      looseId = id;
    });

    phase('rename: offered and works; delete stays a coarse right');
    openList(R);
    expectFolderMenuOptions(folderName, { rename: true, remove: false });
    uiRenameFolder(folderName, renamed);

    phase('move a loose module IN through the card menu');
    openAll(R);
    uiAddItemToFolder(looseName, renamed);
    cy.then(() => apiGetItemIdsInFolder(folderId, R.folderType).then((ids) => expect(ids).to.include(looseId)));

    phase('move it back OUT from inside the folder');
    openFolder(renamed);
    uiRemoveItemFromFolder(looseName);
    cy.then(() => apiGetItemIdsInFolder(folderId, R.folderType).then((ids) => expect(ids).to.deep.equal([moduleId])));

    phase('the module already in the folder is editable');
    cy.then(() => {
      cy.apiGetEditingVersionId(moduleId).then((versionId) => cy.apiCreateAppVersion(moduleId, 'v2-folder-edit-allowed', versionId));
      openAppEditor(wsSlug, moduleId);
      cy.get(versionSwitcherSelectors.versionSwitcherButton).should('contain.text', 'v2-folder-edit-allowed');
    });
  });

  it('should list, but not let the user manage, the folder of a module reached only through a direct module grant', () => {
    const attemptId = Date.now();
    const folderName = `Direct Grant Module Folder ${attemptId}`;
    const moduleName = `Direct Grant Module ${attemptId}`;
    const groupName = `QA Module Direct ${attemptId}`;
    const userEmail = `qa-module-direct-${attemptId}@example.com`;

    apiCreateFolder(R, folderName).then((folder) => {
      apiCreateItem(R, moduleName).then((moduleId) => {
        apiAddItemToFolder(R, moduleId, folder.id);
        apiCreateGroup(groupName);
        cy.apiCreateGranularPermission(groupName, `${groupName} module`, R.itemGrantType, { canEdit: false, canView: true }, [moduleId], false);
      });
    });
    cy.apiFullUserOnboarding('QA Direct', userEmail, 'builder', 'password', wsName, {}, [groupName]);

    // A folder is listed when it holds a module the viewer can see, even without a folder grant.
    loginAs(userEmail);
    openList(R);
    expectFolderMenuAbsent(folderName);
    openFolder(folderName);
    cy.get(commonSelectors.appCard(moduleName)).should('be.visible');
  });
});
