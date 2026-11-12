import {
  runPrefix,
  prepareRepoViaAPI,
  deleteBranchesByPrefixViaAPI,
  deleteStaleRunRefsViaAPI,
  mergeBranchViaAPI,
  waitForCommitMessageViaAPI,
} from "Support/utils/platform/gitSync/gitHubRepo";
import { configureGitSyncViaAPI } from "Support/utils/platform/gitSync/gitSyncSetup";
import { pollUntil } from "Support/utils/platform/gitSync/poll";
import {
  switchBranchViaAPI,
  pullWorkspaceViaAPI,
} from "Support/utils/platform/gitSync/workspaceBranch";

/**
 * Composite seeding for git sync specs: one isolated workspace + base branch
 * per spec, plus app seeding and the branch → push → merge → pull round trip.
 */

const tjRequest = (method, path, { body, qs, failOnStatusCode = true } = {}) =>
  cy.getAuthHeaders().then((headers) =>
    cy.request({
      method,
      url: `${Cypress.env("server_host")}/api${path}`,
      headers,
      body,
      qs,
      failOnStatusCode,
    }),
  );

/**
 * Create an isolated workspace configured with git sync on its own base branch.
 * Call in `before()`; pair with `teardownGitSyncSpec()` in `after()`.
 * Pass `baseBranch` to attach a second workspace to an existing base branch
 * (same repo, same default branch — cross-workspace pull/import cases).
 *
 * @tjType gitSyncSpec.setup
 * @tjBlock gitSync
 * @tjUsage setupGitSyncSpec({ specKey: "config", mode: "multi" }).then((c) => (ctx = c))
 * @tjDom none - GitHub ref + POST /api/organizations + git-sync config
 * @param {{specKey:string, mode?:"single"|"multi", baseBranch?:string, skipConfigure?:boolean}} opts
 *   skipConfigure: create + log in to the workspace but leave git sync unconfigured (configure-from-UI cases)
 * @returns {Cypress.Chainable<{prefix, baseBranch, workspaceId, workspaceSlug, orgGitId, defaultBranch}>}
 */
export const setupGitSyncSpec = ({ specKey, mode = "multi", baseBranch, skipConfigure = false }) => {
  const prefix = runPrefix(specKey);
  const ctx = { prefix, baseBranch, workspaceSlug: prefix };
  // Recorded up front so teardown can clean partial setups (see teardownGitSyncSpec).
  Cypress.env("gitSyncCtxs", [...(Cypress.env("gitSyncCtxs") || []), ctx]);

  // Sweep refs leaked by crashed runs first — they slow every branch create/list. A second
  // workspace on an existing base branch (baseBranch given) shares the first one's branch.
  const base = baseBranch
    ? cy.wrap({ baseBranch }, { log: false })
    : deleteStaleRunRefsViaAPI().then(() => prepareRepoViaAPI(prefix));
  return base
    .then((prepared) => {
      ctx.baseBranch = prepared.baseBranch;
    })
    .then(() => cy.apiLogin())
    .then(() => cy.apiCreateWorkspace(prefix, prefix))
    .then((res) => {
      ctx.workspaceId = res.body.organization_id;
      Cypress.env("workspaceSlug", ctx.workspaceSlug);
      return cy.apiLogin(undefined, undefined, ctx.workspaceId);
    })
    .then(() => (skipConfigure ? ctx : configureGitSyncViaAPI({ branchName: ctx.baseBranch, mode })))
    .then((configured) => {
      if (!skipConfigure) {
        ctx.orgGitId = configured.orgGitId;
        ctx.defaultBranch = configured.defaultBranch;
      }
      return ctx;
    });
};

/**
 * Create a workspace with no git config (configure-from-scratch cases). It is
 * registered for `teardownGitSyncSpec()` like any other spec workspace.
 *
 * @tjType gitSyncSpec.plainWorkspace
 * @tjBlock gitSync
 * @tjUsage createPlainWorkspaceViaAPI("cfg-ui").then((ws) => ...)
 * @tjDom none - POST /api/organizations
 * @returns {Cypress.Chainable<{prefix, workspaceId, workspaceSlug}>}
 */
export const createPlainWorkspaceViaAPI = (specKey) => {
  const prefix = runPrefix(specKey);
  const ctx = { prefix, workspaceSlug: prefix };
  Cypress.env("gitSyncCtxs", [...(Cypress.env("gitSyncCtxs") || []), ctx]);
  return cy
    .apiLogin()
    .then(() => cy.apiCreateWorkspace(prefix, prefix))
    .then((res) => {
      ctx.workspaceId = res.body.organization_id;
      return loginToGitSyncSpec(ctx).then(() => ctx);
    });
};

/**
 * Re-login scoped to the spec workspace. Use in `beforeEach()`.
 *
 * @tjType gitSyncSpec.login
 * @tjBlock gitSync
 * @tjUsage loginToGitSyncSpec(ctx)
 * @tjDom none - POST /api/authenticate/:workspaceId
 */
export const loginToGitSyncSpec = (ctx) => {
  Cypress.env("workspaceSlug", ctx.workspaceSlug);
  return cy.apiLogin(undefined, undefined, ctx.workspaceId);
};

/**
 * Delete every git ref under each set-up workspace's prefix and archive the
 * workspaces created by `setupGitSyncSpec` in this spec. Teardown only.
 *
 * @tjType gitSyncSpec.teardown
 * @tjBlock gitSync
 * @tjUsage teardownGitSyncSpec() - teardown
 * @tjDom none - GitHub ref cleanup + archive workspace
 */
export const teardownGitSyncSpec = () => {
  const ctxs = Cypress.env("gitSyncCtxs") || [];
  Cypress.env("gitSyncCtxs", []);
  ctxs.forEach((ctx) => deleteBranchesByPrefixViaAPI(ctx.prefix));
  cy.apiLogin();
  // Tolerant archive: a case may already have archived its workspace.
  return cy.wrap(ctxs, { log: false }).each((ctx) => {
    if (!ctx.workspaceId) return;
    cy.getAuthHeaders().then((headers) =>
      cy.request({
        method: "PATCH",
        url: `${Cypress.env("server_host")}/api/organizations/archive/${ctx.workspaceId}`,
        headers,
        body: { status: "archived" },
        failOnStatusCode: false,
      }),
    );
  });
};

/**
 * @tjType app.createOnBranch
 * @tjBlock gitSync
 * @tjUsage createAppOnBranchViaAPI(appName, branch.id).then((app) => app.id)
 * @tjDom none - POST /api/apps
 */
export const createAppOnBranchViaAPI = (name, branchId, type = "front-end") =>
  tjRequest("POST", type === "module" ? "/modules" : "/apps", {
    body: { name, icon: "floppydisk", type, branchId },
  }).then((res) => {
    expect(res.status, `create ${type} ${name}`).to.equal(201);
    return res.body;
  });

/**
 * Export one app version (appV2 definition) — the source of truth to compare git files against.
 *
 * @tjType app.export
 * @tjBlock gitSync
 * @tjUsage exportAppViaAPI(appId, versionId, branch.id).then((appV2) => appV2.components)
 * @tjDom none - POST /api/v2/resources/export
 */
export const exportAppViaAPI = (appId, versionId, branchId) =>
  tjRequest("POST", "/v2/resources/export", {
    qs: { branch_id: branchId },
    body: {
      app: [{ id: appId, search_params: { version_id: versionId } }],
      tooljet_database: [],
      organization_id: Cypress.env("workspaceId"),
    },
  }).then((res) => {
    expect(res.status, "export app").to.equal(201);
    return res.body.app[0].definition.appV2;
  });

/**
 * Put an app in a folder on a branch. folder-apps reads the raw `branch_id`
 * query (server/src/modules/folder-apps/service.ts:57-88).
 *
 * @tjType folder.addAppOnBranch
 * @tjBlock gitSync
 * @tjUsage addAppToFolderViaAPI(folderId, appId, branch.id)
 * @tjDom none - POST /api/folder-apps?branch_id=
 */
export const addAppToFolderViaAPI = (folderId, appId, branchId) =>
  tjRequest("POST", "/folder-apps", {
    qs: { branch_id: branchId },
    body: { folder_id: folderId, app_id: appId },
  }).then((res) => {
    expect(res.status, "add app to folder").to.be.oneOf([200, 201]);
  });

/**
 * Wait until `appName` is listed on `branchId`. A new branch's row appears
 * before its apps are hydrated from git (server/ee/workspace-branches/service.ts:394 vs :519-520).
 *
 * @tjType app.waitOnBranch
 * @tjBlock gitSync
 * @tjUsage waitForAppOnBranchViaAPI(branch.id, appName).then((app) => app.id)
 * @tjDom none - polls GET /api/apps?branch_id=
 */
export const waitForAppOnBranchViaAPI = (branchId, appName) =>
  pollUntil(
    () => listAppsOnBranchViaAPI(branchId),
    (apps) => apps.some((a) => a.name === appName),
    { label: `${appName} on branch ${branchId}` },
  ).then((apps) => apps.find((a) => a.name === appName));

/**
 * POST an app create without asserting (default-branch lock cases).
 *
 * @tjType app.attemptCreateOnBranch
 * @tjBlock gitSync
 * @tjUsage attemptCreateAppOnBranchViaAPI(name, ctx.defaultBranch.id).then((res) => ...)
 * @tjDom none - POST /api/apps
 */
export const attemptCreateAppOnBranchViaAPI = (name, branchId) =>
  tjRequest("POST", "/apps", {
    body: { name, icon: "floppydisk", type: "front-end", branchId },
    failOnStatusCode: false,
  });

/**
 * Import an exported-app fixture onto a branch.
 *
 * @tjType app.importOnBranch
 * @tjBlock gitSync
 * @tjUsage importFixtureAppViaAPI("gitSync/fixture-app.json", appName, branch.id)
 * @tjDom none - POST /api/v2/resources/import
 */
export const importFixtureAppViaAPI = (fixturePath, appName, branchId) =>
  cy.fixture(fixturePath).then((fixture) =>
    // user.branchId (from ?branch_id) overrides body.branchId
    // (server/src/modules/import-export-resources/controller.ts:45-47), so send both.
    tjRequest("POST", "/v2/resources/import", {
      qs: { branch_id: branchId },
      body: {
        ...fixture,
        organization_id: Cypress.env("workspaceId"),
        branchId,
        app: (fixture.app || []).map((app) => ({
          ...app,
          appName,
          definition: app.definition?.appV2
            ? { ...app.definition, appV2: { ...app.definition.appV2, name: appName } }
            : app.definition,
        })),
      },
    }).then((res) => {
      expect(res.status, `import ${appName}`).to.equal(201);
      return res.body?.imports?.app?.[0]?.id;
    }),
  );

/**
 * @tjType app.getOnBranch
 * @tjBlock gitSync
 * @tjUsage getAppOnBranchViaAPI(appId, branch.id).then((app) => app.editing_version.id)
 * @tjDom none - GET /api/apps/:id?branch_id=
 */
export const getAppOnBranchViaAPI = (appId, branchId) =>
  tjRequest("GET", `/apps/${appId}`, { qs: { branch_id: branchId } }).then((res) => res.body);

/**
 * @tjType app.listOnBranch
 * @tjBlock gitSync
 * @tjUsage listAppsOnBranchViaAPI(branch.id).then((apps) => apps.map((a) => a.name))
 * @tjDom none - GET /api/apps?type=&branch_id=
 */
export const listAppsOnBranchViaAPI = (branchId, type = "front-end") =>
  tjRequest("GET", "/apps", { qs: { page: 1, type, branch_id: branchId } }).then(
    (res) => res.body?.apps || [],
  );

/**
 * Rename an app on a branch the way the dashboard does: name + the current
 * editing version (frontend/src/HomePage/HomePage.jsx:478-489). App metadata is
 * branch-scoped, so `branch_id` is required in multi-branch mode
 * (server/src/modules/apps/service.ts:387). Without `editingVersionId` the server
 * renames the newest version row, which may not be the editing draft.
 *
 * @tjType app.attemptRename
 * @tjBlock gitSync
 * @tjUsage attemptRenameAppViaAPI(appId, "new-name", branch.id, versionId).then((res) => ...)
 * @tjDom none - PUT /api/apps/:id?branch_id=
 */
export const attemptRenameAppViaAPI = (appId, name, branchId, editingVersionId) =>
  tjRequest("PUT", `/apps/${appId}`, {
    qs: branchId ? { branch_id: branchId } : undefined,
    body: { app: editingVersionId ? { name, editingVersionId } : { name } },
    failOnStatusCode: false,
  });

/**
 * @tjType app.deleteOnBranch
 * @tjBlock gitSync
 * @tjUsage deleteAppOnBranchViaAPI(appId, branch.id)
 * @tjDom none - DELETE /api/apps/:id?branch_id=
 */
export const deleteAppOnBranchViaAPI = (appId, branchId) =>
  tjRequest("DELETE", `/apps/${appId}`, { qs: { branch_id: branchId } }).then((res) => {
    expect(res.status, "delete app on branch").to.be.oneOf([200, 204]);
  });

/**
 * POST an editor push without asserting. Body mirrors the app builder's commit
 * (frontend/ee/modules/Appbuilder/components/GitSyncManager/GitSyncModal.jsx `appGitPush`).
 *
 * @tjType app.attemptPush
 * @tjBlock gitSync
 * @tjUsage attemptPushAppViaAPI({ appId, versionId, appName, branch, commitMessage })
 * @tjDom none - POST /api/app-git/gitpush/:appId/:versionId?branch_id=
 * @param {{appId, versionId, appName, branch:{id,name}, commitMessage, singleBranch?:boolean}} p
 */
export const attemptPushAppViaAPI = ({ appId, versionId, appName, branch, commitMessage, singleBranch = false }) =>
  tjRequest("POST", `/app-git/gitpush/${appId}/${versionId}`, {
    qs: { branch_id: branch.id },
    body: {
      gitAppName: appName,
      versionId,
      lastCommitMessage: commitMessage,
      gitVersionName: branch.name,
      ...(singleBranch ? { allowMasterPush: true } : { sourceBranch: branch.name }),
    },
    failOnStatusCode: false,
  });

/**
 * Push an app from the editor and wait for the commit on the remote branch.
 *
 * @tjType app.push
 * @tjBlock gitSync
 * @tjUsage pushAppViaAPI({ appId, versionId, appName, branch, commitMessage })
 * @tjDom none - POST /api/app-git/gitpush/:appId/:versionId
 */
export const pushAppViaAPI = (params) =>
  attemptPushAppViaAPI(params)
    .then((res) => {
      expect(res.status, `push ${params.appName}: ${JSON.stringify(res.body)}`).to.be.oneOf([200, 201, 204]);
    })
    .then(() => waitForCommitMessageViaAPI(params.branch.name, params.commitMessage));

/**
 * Seed an app on a feature branch and push it. Yields ids for the case.
 *
 * @tjType app.seedPushed
 * @tjBlock gitSync
 * @tjUsage seedPushedAppViaAPI({ branch, appName }).then(({ appId, versionId }) => ...)
 * @tjDom none - create/import app + editor push
 * @param {{branch:{id,name}, appName:string, fixture?:string, commitMessage?:string}} p
 */
export const seedPushedAppViaAPI = ({ branch, appName, fixture, commitMessage = `feat: add ${appName}` }) => {
  const created = fixture
    ? importFixtureAppViaAPI(fixture, appName, branch.id)
    : createAppOnBranchViaAPI(appName, branch.id).then((app) => app.id);

  return created.then((appId) =>
    getAppOnBranchViaAPI(appId, branch.id).then((app) => {
      const versionId = app.editing_version?.id;
      expect(versionId, `editing version of ${appName}`).to.be.a("string");
      return pushAppViaAPI({ appId, versionId, appName, branch, commitMessage }).then(() => ({
        appId,
        versionId,
        coRelationId: app.co_relation_id,
      }));
    }),
  );
};

/**
 * PR `featureBranch` into the spec's base branch, merge it, switch to the
 * default branch and pull until ToolJet is on the merged head.
 *
 * @tjType gitSyncSpec.mergeToDefault
 * @tjBlock gitSync
 * @tjUsage mergeToDefaultAndPullViaAPI(ctx, feature)
 * @tjDom none - GitHub PR + PUT activate + POST pull
 */
export const mergeToDefaultAndPullViaAPI = (ctx, featureBranch) =>
  mergeBranchViaAPI(featureBranch.name, ctx.baseBranch)
    .then(() => switchBranchViaAPI(ctx.defaultBranch.id))
    .then(() => pullWorkspaceViaAPI(ctx.defaultBranch));
