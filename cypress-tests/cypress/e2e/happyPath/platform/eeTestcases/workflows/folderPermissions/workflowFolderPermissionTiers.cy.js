import { commonSelectors } from 'Selectors/common';
import { apiAddUserToGroup, apiCreateGroup } from 'Support/utils/manageGroups';
import {
  RESOURCES,
  TIERS,
  apiAddItemToFolder,
  apiCreateFolder,
  apiCreateItem,
  apiGrantFolderTier,
  apiRemoveItemFromFolder,
  expectFolderListed,
  expectFolderMenuAbsent,
  loginAs,
  loginAsAdmin,
  openAll,
  openEditorExpectingRestricted,
  openFolder,
  openList,
  openWorkflowEditor,
  phase,
} from 'Support/utils/platform/folderPermissions';

describe('Workflows — Folder Permission Tiers', { retries: 0 }, () => {
  const R = RESOURCES.workflow;
  let workspaceId, wsName, wsSlug;

  const setupTier = (label, tier) => {
    const attemptId = Date.now();
    const ctx = {
      folderName: `${label} Tier Workflow Folder ${attemptId}`,
      insideName: `${label} Inside Workflow ${attemptId}`,
      outsideName: `${label} Outside Workflow ${attemptId}`,
      groupName: `QA ${label} Workflow Tier ${attemptId}`,
      userEmail: `wf-tier-${label.toLowerCase()}-${attemptId}@example.com`,
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
      .then(() => apiCreateItem(R, ctx.outsideName))
      .then((id) => {
        ctx.outsideId = id;
        return apiCreateGroup(ctx.groupName);
      })
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

  const expectEditable = (id) => openWorkflowEditor(wsSlug, id);
  const expectRestricted = (id) => openEditorExpectingRestricted(wsSlug, id);

  beforeEach(() => {
    wsName = `wf-folder-tiers-${Date.now()}`;
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
    it('should make Execute workflows list-only, Edit workflows editable, and Edit folder cascade to Edit workflows', () => {
      setupTier('Tiers', TIERS.viewItems).then((ctx) => {
        loginAs(ctx.userEmail);

        phase('Execute workflows: listed, editor restricted, folder not manageable');
        expectListedInFolder(ctx.folderName, ctx.insideName);
        expectFolderMenuAbsent(ctx.folderName);
        expectRestricted(ctx.insideId);
        expectNotListed(ctx.outsideName);

        phase('Edit workflows: the workflow inside opens in the editor, folder still not manageable');
        adminChangesTierTo(ctx, TIERS.editItems);
        expectEditable(ctx.insideId);
        openList(R);
        expectFolderMenuAbsent(ctx.folderName);
        expectRestricted(ctx.outsideId);

        phase('Edit folder: cascades Edit workflows');
        adminChangesTierTo(ctx, TIERS.editFolder);
        expectEditable(ctx.insideId);
      });
    });

    it('should reveal only the workflow folders a grant names, including an empty one', () => {
      const attemptId = Date.now();
      const authorizedName = `Authorized Workflow Folder ${attemptId}`;
      const unauthorizedName = `Unauthorized Workflow Folder ${attemptId}`;
      const groupName = `QA Workflow Visibility Group ${attemptId}`;
      const userEmail = `wf-visibility-scope-${attemptId}@example.com`;

      apiCreateFolder(R, unauthorizedName);
      apiCreateFolder(R, authorizedName).then((folder) => {
        apiCreateGroup(groupName);
        apiGrantFolderTier(R, groupName, `folder view ${attemptId}`, TIERS.viewItems, [folder.id]);
      });
      cy.apiFullUserOnboarding('QA Workflow Visibility', userEmail, 'builder', 'password', wsName, {}, [groupName]);

      loginAs(userEmail);
      openList(R);
      expectFolderListed(authorizedName);
      expectFolderListed(unauthorizedName, false);
      openFolder(authorizedName);
      cy.get(commonSelectors.empytyFolderImage).should('be.visible');
    });
  });

  describe('how grants aggregate', () => {
    it('should let a folder Edit workflows grant win over a View-only direct workflow grant', () => {
      setupTier('Union', TIERS.editItems).then((ctx) => {
        loginAsAdmin();
        cy.apiCreateGranularPermission(ctx.groupName, 'direct view', R.itemGrantType, { canEdit: false, canView: true }, [], true);

        loginAs(ctx.userEmail);
        expectEditable(ctx.insideId);
      });
    });

    it('should give a user in several groups the highest workflow folder tier among them', () => {
      setupTier('Multigroup', TIERS.viewItems).then((ctx) => {
        const editGroupName = `${ctx.groupName} Edit`;

        loginAsAdmin();
        apiCreateGroup(editGroupName).then((groupId) => apiAddUserToGroup(groupId, ctx.userEmail));
        apiGrantFolderTier(R, editGroupName, 'folder edit', TIERS.editItems, [ctx.folderId]);

        loginAs(ctx.userEmail);
        expectEditable(ctx.insideId);
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

        phase('folder membership: moved in, then back out');
        asAdmin(ctx.userEmail, () => apiAddItemToFolder(R, ctx.outsideId, ctx.folderId));
        expectEditable(ctx.outsideId);
        asAdmin(ctx.userEmail, () => apiRemoveItemFromFolder(R, ctx.outsideId, ctx.folderId));
        expectRestricted(ctx.outsideId);

        phase('group membership: leaving the Edit group falls back to Execute, re-joining restores it');
        asAdmin(ctx.userEmail, () =>
          cy.apiGetGroupId(ctx.groupName).then((id) => cy.apiRemoveUserFromGroup(id, ctx.userEmail))
        );
        expectRestricted(ctx.insideId);
        expectListedInFolder(ctx.folderName, ctx.insideName);
        asAdmin(ctx.userEmail, () => cy.apiGetGroupId(ctx.groupName).then((id) => apiAddUserToGroup(id, ctx.userEmail)));
        expectEditable(ctx.insideId);

        phase('grant scope: All folders reaches foldered workflows only');
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
