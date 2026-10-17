import { commonSelectors } from 'Selectors/common';
import { apiAddUserToGroup, apiCreateGroup } from 'Support/utils/manageGroups';
import {
  TIERS,
  apiPublishV1,
  expectFolderListed,
  expectFolderMenuAbsent,
  loginAs,
  loginAsAdmin,
  openAllApps,
  openAppEditor,
  openAppsDashboard,
  openEditorExpectingRestricted,
  openFolder,
  phase,
  uiCreateDraftVersion,
} from 'Support/utils/platform/folderPermissions';

// An app folder grant has three tiers — Edit folder > Edit apps > View apps — and this spec owns WHAT each grants, WHERE it is enforced (dashboard listing, folder menu, the /apps/:id editor route) and WHEN a change takes effect.
describe('Apps — Folder Permission Tiers', { retries: 0 }, () => {
  let workspaceId, wsName, wsSlug;

  // fixture

  // Folder + a published app inside it + a published app outside every folder + a group holding one tier + a builder in it.
  const setupTier = (label, permissions) => {
    const attemptId = Date.now();
    const ctx = {
      folderName: `${label} Tier Folder ${attemptId}`,
      insideName: `${label} Inside App ${attemptId}`,
      outsideName: `${label} Outside App ${attemptId}`,
      groupName: `QA ${label} Tier ${attemptId}`,
      userEmail: `app-tier-${label.toLowerCase()}-${attemptId}@example.com`,
    };

    return cy
      .apiCreateAppFolder(ctx.folderName)
      .then((folder) => {
        ctx.folderId = folder.id;
        return cy.apiCreateApp(ctx.insideName);
      })
      .then(() => {
        ctx.insideId = Cypress.env('appId');
        return cy.apiAddAppToFolder(ctx.folderId, ctx.insideId);
      })
      .then(() => apiPublishV1(ctx.insideId))
      .then(() => cy.apiCreateApp(ctx.outsideName))
      .then(() => {
        ctx.outsideId = Cypress.env('appId');
        return apiPublishV1(ctx.outsideId);
      })
      .then(() => apiCreateGroup(ctx.groupName))
      .then(() =>
        cy.apiCreateGranularPermission(ctx.groupName, `${ctx.groupName} perm`, 'folder', permissions, [ctx.folderId], false)
      )
      .then(() => cy.apiFullUserOnboarding(label, ctx.userEmail, 'builder', 'password', wsName, {}, [ctx.groupName]))
      .then(() => ctx);
  };

  // admin-side manipulation

  // Applies an admin change, then logs the test user back in — no cached session survives.
  const asAdmin = (userEmail, changes) => {
    loginAsAdmin();
    changes();
    loginAs(userEmail);
  };

  // There is no update command for a granular permission, so changing a tier means delete + recreate.
  let swapCount = 0;
  const adminChangesTierTo = (ctx, permissions, isAll = false) => {
    swapCount += 1;
    asAdmin(ctx.userEmail, () => {
      cy.apiDeleteGranularPermission(ctx.groupName, ['folder']);
      cy.apiCreateGranularPermission(
        ctx.groupName,
        `${ctx.groupName} perm ${swapCount}`,
        'folder',
        permissions,
        isAll ? [] : [ctx.folderId],
        isAll
      );
    });
  };

  // assertions

  const expectListedInFolder = (folderName, appName) => {
    openAppsDashboard();
    openFolder(folderName);
    cy.get(commonSelectors.appCard(appName)).should('be.visible');
  };

  // Unreachable apps are absent from the dashboard, not rendered disabled.
  const expectNotListed = (appName) => {
    openAppsDashboard();
    openAllApps();
    cy.get(commonSelectors.appCard(appName)).should('not.exist');
  };

  const expectEditable = (appId) => openAppEditor(wsSlug, appId);

  const expectRestricted = (appId) => openEditorExpectingRestricted(wsSlug, appId);

  // hooks

  beforeEach(() => {
    wsName = `app-folder-tiers-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    // Empty the builder role so only the custom group can grant access.
    cy.apiDeleteGranularPermission('builder', ['app', 'folder']);
    cy.apiUpdateGroupPermission('builder', { folderCreate: false, folderDelete: false });
  });

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  // cases

  describe('what each tier grants', () => {
    it('should make View apps list-only, Edit apps editable, and Edit folder cascade to Edit apps', () => {
      setupTier('Tiers', TIERS.viewItems).then((ctx) => {
        loginAs(ctx.userEmail);

        phase('View apps: listed, not editable, folder not manageable');
        expectListedInFolder(ctx.folderName, ctx.insideName);
        expectFolderMenuAbsent(ctx.folderName);
        expectRestricted(ctx.insideId);
        expectNotListed(ctx.outsideName);

        phase('Edit apps: the app inside opens in the editor, folder still not manageable');
        adminChangesTierTo(ctx, TIERS.editItems);
        expectEditable(ctx.insideId);
        openAppsDashboard();
        expectFolderMenuAbsent(ctx.folderName);
        expectRestricted(ctx.outsideId);

        phase('Edit folder: cascades Edit apps');
        adminChangesTierTo(ctx, TIERS.editFolder);
        expectEditable(ctx.insideId);
      });
    });

    it('should reveal only the folders a grant names, including an empty one', () => {
      const attemptId = Date.now();
      const authorizedFolderName = `Authorized App Folder ${attemptId}`;
      const unauthorizedFolderName = `Unauthorized App Folder ${attemptId}`;
      const groupName = `QA App Visibility Group ${attemptId}`;
      const userEmail = `app-visibility-scope-${attemptId}@example.com`;

      cy.apiCreateAppFolder(unauthorizedFolderName);
      cy.apiCreateAppFolder(authorizedFolderName).then((folder) => {
        apiCreateGroup(groupName);
        cy.apiCreateGranularPermission(groupName, `folder view ${attemptId}`, 'folder', TIERS.viewItems, [folder.id], false);
      });
      cy.apiFullUserOnboarding('QA App Visibility', userEmail, 'builder', 'password', wsName, {}, [groupName]);

      loginAs(userEmail);
      openAppsDashboard();
      expectFolderListed(authorizedFolderName);
      expectFolderListed(unauthorizedFolderName, false);

      // The authorized folder is empty and still visible, showing the empty state.
      openFolder(authorizedFolderName);
      cy.get(commonSelectors.empytyFolderImage).should('be.visible');
    });
  });

  describe('how grants aggregate', () => {
    it('should let a folder Edit apps grant win over a View-only direct app grant', () => {
      setupTier('Union', TIERS.editItems).then((ctx) => {
        loginAsAdmin();
        cy.apiCreateGranularPermission(ctx.groupName, 'direct view', 'app', { canEdit: false, canView: true }, [], true);

        loginAs(ctx.userEmail);
        expectEditable(ctx.insideId);
        uiCreateDraftVersion('v2-union-wins');
      });
    });

    it('should give a user in several groups the highest folder tier among them', () => {
      setupTier('Multigroup', TIERS.viewItems).then((ctx) => {
        const editGroupName = `${ctx.groupName} Edit`;

        loginAsAdmin();
        apiCreateGroup(editGroupName).then((groupId) => apiAddUserToGroup(groupId, ctx.userEmail));
        cy.apiCreateGranularPermission(editGroupName, 'folder edit', 'folder', TIERS.editItems, [ctx.folderId], false);

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
        cy.apiCreateGranularPermission(viewGroupName, 'folder view', 'folder', TIERS.viewItems, [ctx.folderId], false);

        loginAs(ctx.userEmail);
        expectRestricted(ctx.outsideId);

        phase('folder membership: moved in (editable, real edit), then back out');
        asAdmin(ctx.userEmail, () => cy.apiAddAppToFolder(ctx.folderId, ctx.outsideId));
        expectEditable(ctx.outsideId);
        uiCreateDraftVersion('v2-after-move');
        asAdmin(ctx.userEmail, () => cy.apiRemoveAppFromFolder(ctx.outsideId, ctx.folderId));
        expectRestricted(ctx.outsideId);

        phase('group membership: leaving the Edit group falls back to the View group, re-joining restores it');
        asAdmin(ctx.userEmail, () =>
          cy.apiGetGroupId(ctx.groupName).then((id) => cy.apiRemoveUserFromGroup(id, ctx.userEmail))
        );
        expectRestricted(ctx.insideId);
        expectListedInFolder(ctx.folderName, ctx.insideName);
        asAdmin(ctx.userEmail, () =>
          cy.apiGetGroupId(ctx.groupName).then((id) => apiAddUserToGroup(id, ctx.userEmail))
        );
        expectEditable(ctx.insideId);

        phase('grant scope: All folders reaches foldered apps only');
        adminChangesTierTo(ctx, TIERS.editItems, true);
        expectEditable(ctx.insideId);
        expectRestricted(ctx.outsideId);

        phase('grant deletion: both groups lose their grant, the folder disappears');
        asAdmin(ctx.userEmail, () => {
          cy.apiDeleteGranularPermission(ctx.groupName, ['folder']);
          cy.apiDeleteGranularPermission(viewGroupName, ['folder']);
        });
        openAppsDashboard();
        expectFolderListed(ctx.folderName, false);
        expectRestricted(ctx.insideId);
      });
    });
  });
});
