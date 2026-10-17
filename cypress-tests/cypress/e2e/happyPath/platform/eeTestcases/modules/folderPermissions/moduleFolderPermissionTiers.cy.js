import { commonSelectors } from 'Selectors/common';
import { apiAddUserToGroup, apiCreateGroup } from 'Support/utils/manageGroups';
import {
  RESOURCES,
  TIERS,
  apiAddItemToFolder,
  apiCreateFolder,
  apiCreateItem,
  apiGrantFolderTier,
  apiPublishV1,
  apiRemoveItemFromFolder,
  expectFolderListed,
  expectFolderMenuAbsent,
  loginAs,
  loginAsAdmin,
  openAll,
  openAppEditor,
  openEditorExpectingRestricted,
  openFolder,
  openList,
  phase,
  uiCreateDraftVersion,
} from 'Support/utils/platform/folderPermissions';

// Module folder tiers (Edit folder > Edit modules > Build with modules): what each grants, how grants combine, and when a change applies.
describe('Modules — Folder Permission Tiers', { retries: 0 }, () => {
  const R = RESOURCES.module;
  let workspaceId, wsName, wsSlug;

  // Folder + a published module inside it + a published module outside every folder + a group holding one tier + a builder in it.
  const setupTier = (label, tier) => {
    const attemptId = Date.now();
    const ctx = {
      folderName: `${label} Tier Module Folder ${attemptId}`,
      insideName: `${label} Inside Module ${attemptId}`,
      outsideName: `${label} Outside Module ${attemptId}`,
      groupName: `QA ${label} Module Tier ${attemptId}`,
      userEmail: `module-tier-${label.toLowerCase()}-${attemptId}@example.com`,
    };

    return apiCreateFolder(R, ctx.folderName)
      .then((folder) => {
        ctx.folderId = folder.id;
        return apiCreateItem(R, ctx.insideName);
      })
      .then((id) => {
        ctx.insideId = id;
        return apiAddItemToFolder(R, id, ctx.folderId);
      })
      .then(() => apiPublishV1(ctx.insideId))
      .then(() => apiCreateItem(R, ctx.outsideName))
      .then((id) => {
        ctx.outsideId = id;
        return apiPublishV1(id);
      })
      .then(() => apiCreateGroup(ctx.groupName))
      .then(() => apiGrantFolderTier(R, ctx.groupName, `${ctx.groupName} perm`, tier, [ctx.folderId]))
      .then(() => cy.apiFullUserOnboarding(label, ctx.userEmail, 'builder', 'password', wsName, {}, [ctx.groupName]))
      .then(() => ctx);
  };

  const asAdmin = (userEmail, changes) => {
    loginAsAdmin();
    changes();
    loginAs(userEmail);
  };

  // There is no update command for a granular permission, so changing a tier means delete + recreate.
  let swapCount = 0;
  const adminChangesTierTo = (ctx, tier, isAll = false) => {
    swapCount += 1;
    asAdmin(ctx.userEmail, () => {
      cy.apiDeleteGranularPermission(ctx.groupName, [R.granularType]);
      apiGrantFolderTier(R, ctx.groupName, `${ctx.groupName} perm ${swapCount}`, tier, isAll ? [] : [ctx.folderId], isAll);
    });
  };

  const expectListedInFolder = (folderName, name) => {
    openList(R);
    openFolder(folderName);
    cy.get(commonSelectors.appCard(name)).should('be.visible');
  };

  const expectNotListed = (name) => {
    openList(R);
    openAll(R);
    cy.get(commonSelectors.appCard(name)).should('not.exist');
  };

  const expectEditable = (id) => openAppEditor(wsSlug, id);
  const expectRestricted = (id) => openEditorExpectingRestricted(wsSlug, id);

  beforeEach(() => {
    wsName = `module-folder-tiers-${Date.now()}`;
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

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  describe('what each tier grants', () => {
    it('should make Build with modules list-only, Edit modules editable, and Edit folder cascade to Edit modules', () => {
      setupTier('Tiers', TIERS.viewItems).then((ctx) => {
        loginAs(ctx.userEmail);

        phase('Build with modules: listed, editor restricted, folder not manageable');
        expectListedInFolder(ctx.folderName, ctx.insideName);
        expectFolderMenuAbsent(ctx.folderName);
        expectRestricted(ctx.insideId);
        expectNotListed(ctx.outsideName);

        phase('Edit modules: the module inside opens and takes a real edit, folder still not manageable');
        adminChangesTierTo(ctx, TIERS.editItems);
        expectEditable(ctx.insideId);
        uiCreateDraftVersion('v2-edit-modules');
        openList(R);
        expectFolderMenuAbsent(ctx.folderName);
        expectRestricted(ctx.outsideId);

        phase('Edit folder: cascades Edit modules');
        adminChangesTierTo(ctx, TIERS.editFolder);
        expectEditable(ctx.insideId);
      });
    });

    it('should reveal only the module folders a grant names, including an empty one', () => {
      const attemptId = Date.now();
      const authorizedName = `Authorized Module Folder ${attemptId}`;
      const unauthorizedName = `Unauthorized Module Folder ${attemptId}`;
      const groupName = `QA Module Visibility Group ${attemptId}`;
      const userEmail = `module-visibility-scope-${attemptId}@example.com`;

      apiCreateFolder(R, unauthorizedName);
      apiCreateFolder(R, authorizedName).then((folder) => {
        apiCreateGroup(groupName);
        apiGrantFolderTier(R, groupName, `folder view ${attemptId}`, TIERS.viewItems, [folder.id]);
      });
      cy.apiFullUserOnboarding('QA Module Visibility', userEmail, 'builder', 'password', wsName, {}, [groupName]);

      loginAs(userEmail);
      openList(R);
      expectFolderListed(authorizedName);
      expectFolderListed(unauthorizedName, false);
      openFolder(authorizedName);
      cy.get(commonSelectors.empytyFolderImage).should('be.visible');
    });
  });

  describe('how grants aggregate', () => {
    it('should let a folder Edit modules grant win over a View-only direct module grant', () => {
      setupTier('Union', TIERS.editItems).then((ctx) => {
        loginAsAdmin();
        cy.apiCreateGranularPermission(ctx.groupName, 'direct view', R.itemGrantType, { canEdit: false, canView: true }, [], true);

        loginAs(ctx.userEmail);
        expectEditable(ctx.insideId);
        uiCreateDraftVersion('v2-union-wins');
      });
    });

    it('should give a user in several groups the highest module folder tier among them', () => {
      setupTier('Multigroup', TIERS.viewItems).then((ctx) => {
        const editGroupName = `${ctx.groupName} Edit`;

        loginAsAdmin();
        apiCreateGroup(editGroupName).then((groupId) => apiAddUserToGroup(groupId, ctx.userEmail));
        apiGrantFolderTier(R, editGroupName, 'folder edit', TIERS.editItems, [ctx.folderId]);

        loginAs(ctx.userEmail);
        expectEditable(ctx.insideId);
        uiCreateDraftVersion('v2-highest-wins');
      });
    });
  });

  describe('when access changes', () => {
    it('should recalculate on the next request, however the change was made', () => {
      setupTier('Recalc', TIERS.editItems).then((ctx) => {
        const viewGroupName = `${ctx.groupName} View`;

        loginAsAdmin();
        apiCreateGroup(viewGroupName).then((groupId) => apiAddUserToGroup(groupId, ctx.userEmail));
        apiGrantFolderTier(R, viewGroupName, 'folder view', TIERS.viewItems, [ctx.folderId]);

        loginAs(ctx.userEmail);
        expectRestricted(ctx.outsideId);

        phase('folder membership: moved in (editable, real edit), then back out');
        asAdmin(ctx.userEmail, () => apiAddItemToFolder(R, ctx.outsideId, ctx.folderId));
        expectEditable(ctx.outsideId);
        uiCreateDraftVersion('v2-after-move');
        asAdmin(ctx.userEmail, () => apiRemoveItemFromFolder(R, ctx.outsideId, ctx.folderId));
        expectRestricted(ctx.outsideId);

        phase('group membership: leaving the Edit group falls back to Build with, re-joining restores it');
        asAdmin(ctx.userEmail, () =>
          cy.apiGetGroupId(ctx.groupName).then((id) => cy.apiRemoveUserFromGroup(id, ctx.userEmail))
        );
        expectRestricted(ctx.insideId);
        expectListedInFolder(ctx.folderName, ctx.insideName);
        asAdmin(ctx.userEmail, () => cy.apiGetGroupId(ctx.groupName).then((id) => apiAddUserToGroup(id, ctx.userEmail)));
        expectEditable(ctx.insideId);

        phase('grant scope: All folders reaches foldered modules only');
        adminChangesTierTo(ctx, TIERS.editItems, true);
        expectEditable(ctx.insideId);
        expectRestricted(ctx.outsideId);

        phase('grant deletion: both groups lose their grant, the folder disappears');
        asAdmin(ctx.userEmail, () => {
          cy.apiDeleteGranularPermission(ctx.groupName, [R.granularType]);
          cy.apiDeleteGranularPermission(viewGroupName, [R.granularType]);
        });
        openList(R);
        expectFolderListed(ctx.folderName, false);
        expectRestricted(ctx.insideId);
      });
    });
  });
});
