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

  // Sweep refs leaked by crashed runs first; a second workspace on an existing base branch shares it.
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
 * @tjUsage waitForAppOnBranchViaAPI(branch.id, appName[, "module"]).then((app) => app.id)
 * @tjDom none - polls GET /api/apps?branch_id=
 */
export const waitForAppOnBranchViaAPI = (branchId, appName, type = "front-end") =>
  pollUntil(
    () => listAppsOnBranchViaAPI(branchId, type),
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
export const importExportViaAPI = (exported, appName, branchId) =>
  // ?branch_id overrides body.branchId (import-export-resources/controller.ts:45-47), so send both.
  tjRequest("POST", "/v2/resources/import", {
    qs: { branch_id: branchId },
    body: {
      ...exported,
      organization_id: Cypress.env("workspaceId"),
      branchId,
      app: (exported.app || []).map((app) => ({
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
  });

export const importFixtureAppViaAPI = (fixturePath, appName, branchId) =>
  cy.fixture(fixturePath).then((fixture) => importExportViaAPI(fixture, appName, branchId));

const COMPLETE_FLOW = "gitSync/complete-flow";

const replaceIds = (exported, ids) =>
  JSON.parse(
    Object.entries(ids).reduce((text, [from, to]) => text.split(from).join(to), JSON.stringify(exported)),
  );

/**
 * Import the complete-flow fixture (cypress/fixtures/gitSync/complete-flow, rebuilt by
 * tools/gitsync-fixtures/build-complete-flow.mjs) onto a branch under unique names, and put the
 * app in its own folder. The app's module is imported with the app; the workflow is imported
 * first because app exports don't carry workflows.
 *
 * @tjType gitSyncSpec.importCompleteFlow
 * @tjBlock gitSync
 * @tjUsage importCompleteFlowViaAPI(branch, "mb1").then((flow) => flow.names.app)
 * @tjDom none - POST /api/v2/resources/import (workflow, then app) + folder
 * @returns {Cypress.Chainable<{appId, workflowId, coRel:{module, workflow}, names:{app, module, workflow, folder, dataSource}}>}
 */
export const importCompleteFlowViaAPI = (branch, suffix) => {
  const names = {
    app: `cf-app-${suffix}`,
    module: `cf-mod-${suffix}`,
    workflow: `cf-wf-${suffix}`,
    folder: `cf-folder-${suffix}`,
    dataSource: `cf-rest-${suffix}`,
  };
  const flow = { names };
  // The workflow and the app share one global data source: same fresh id and name in both imports.
  const dataSourceIds = {};

  return cy
    .fixture(`${COMPLETE_FLOW}/workflow.json`)
    .then((workflowExport) => {
      const wf = workflowExport.app[0].definition.appV2;
      const ds = wf.dataSources.find((d) => d.name === "cf-rest");
      Object.assign(dataSourceIds, { [ds.id]: crypto.randomUUID(), '"cf-rest"': `"${names.dataSource}"` });
      // Fresh ids so imports in one workspace never share a slug or a git identity.
      flow.fixtureWorkflowCoRel = wf.co_relation_id;
      const fresh = replaceIds(workflowExport, {
        ...dataSourceIds,
        [wf.id]: crypto.randomUUID(),
        [wf.co_relation_id]: crypto.randomUUID(),
      });
      return importExportViaAPI(fresh, names.workflow, branch.id);
    })
    .then((workflowId) => {
      flow.workflowId = workflowId;
      return getAppOnBranchViaAPI(workflowId, branch.id);
    })
    .then((workflow) => cy.fixture(`${COMPLETE_FLOW}/app.json`).then((appExport) => ({ workflow, appExport })))
    .then(({ workflow, appExport }) => {
      const app = appExport.app[0].definition.appV2;
      const mod = app.modules[0].appV2;
      flow.coRel = { module: crypto.randomUUID(), workflow: workflow.co_relation_id };
      const fresh = replaceIds(appExport, {
        ...dataSourceIds,
        [app.id]: crypto.randomUUID(),
        [app.co_relation_id]: crypto.randomUUID(),
        [mod.id]: crypto.randomUUID(),
        [mod.co_relation_id]: flow.coRel.module,
        [flow.fixtureWorkflowCoRel]: workflow.co_relation_id,
      });
      fresh.app[0].definition.appV2.modules[0].appV2.name = names.module;
      return importExportViaAPI(fresh, names.app, branch.id);
    })
    .then((appId) => {
      flow.appId = appId;
      return cy.apiCreateFolder(names.folder);
    })
    .then((folder) => addAppToFolderViaAPI(folder.id, flow.appId, branch.id))
    .then(() => flow);
};

/**
 * Push everything the complete-flow import created on `branch`: the app (its module and
 * workflow are written with it the first time) and the workspace (data sources).
 *
 * @tjType gitSyncSpec.pushCompleteFlow
 * @tjBlock gitSync
 * @tjUsage pushCompleteFlowViaAPI(flow, branch)
 * @tjDom none - POST /api/app-git/gitpush + POST /api/workspace-branches/push
 */
export const pushCompleteFlowViaAPI = (flow, branch, { singleBranch = false } = {}) =>
  getAppOnBranchViaAPI(flow.appId, branch.id)
    .then((app) =>
      pushAppViaAPI({
        appId: flow.appId,
        versionId: app.editing_version.id,
        appName: flow.names.app,
        branch,
        singleBranch,
        commitMessage: `feat: add ${flow.names.app}`,
      }),
    )
    .then(() =>
      tjRequest("POST", "/workspace-branches/push", {
        body: { branchId: branch.id, commitMessage: `feat: workspace ${flow.names.app}` },
        failOnStatusCode: false,
      }),
    )
    .then((res) => {
      expect(res.status, `workspace push: ${JSON.stringify(res.body)}`).to.be.oneOf([200, 201]);
    });

/**
 * @tjType app.getOnBranch
 * @tjBlock gitSync
 * @tjUsage getAppOnBranchViaAPI(appId, branch.id).then((app) => app.editing_version.id)
 * @tjDom none - GET /api/apps/:id?branch_id=
 */
export const getAppOnBranchViaAPI = (appId, branchId) =>
  tjRequest("GET", `/apps/${appId}`, { qs: { branch_id: branchId } }).then((res) => res.body);

/**
 * Release a saved (non-draft) version of an app on a branch. Yields the app's slug for the
 * released URL `/applications/<slug>`.
 *
 * @tjType app.releaseSavedVersion
 * @tjBlock gitSync
 * @tjUsage releaseSavedVersionViaAPI(appName, ctx.defaultBranch, "v1").then((slug) => ...)
 * @tjDom none - GET /api/apps/:id/versions + PUT /api/apps/:id/release
 */
export const releaseSavedVersionViaAPI = (appName, branch, versionName) =>
  listAppsOnBranchViaAPI(branch.id).then((apps) => {
    const app = apps.find((a) => a.name === appName);
    expect(app, `${appName} on ${branch.name}`).to.exist;
    return tjRequest("GET", `/apps/${app.id}/versions`, { qs: { branch_id: branch.id } })
      .then((res) => {
        const version = (res.body.versions || []).find((v) => v.name === versionName && v.status !== "DRAFT");
        expect(version, `saved ${versionName} of ${appName} on ${branch.name}`).to.exist;
        return tjRequest("PUT", `/apps/${app.id}/release`, {
          body: { versionToBeReleased: version.id },
          failOnStatusCode: false,
        });
      })
      .then((res) => {
        expect(res.status, `release ${appName} ${versionName}: ${JSON.stringify(res.body)}`).to.be.oneOf([200, 201]);
        return getAppOnBranchViaAPI(app.id, branch.id).then((body) => body.slug);
      });
  });

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
 * Global data source on a branch, read for one environment: options are
 * `{ <key>: { value, encrypted, credential_id? } }`.
 * source: server/src/modules/data-sources/controller.ts:45-53, :119-129
 *
 * @tjType dataSource.getOnBranch
 * @tjBlock gitSync
 * @tjUsage getDataSourceOnBranchViaAPI("restapi", branch.id, "staging").then((ds) => ds.options.url.value)
 * @tjDom none - GET /api/data-sources/:orgId?branch_id= + GET /api/data-sources/:id/environment/:envId?branch_id=
 */
export const getDataSourceOnBranchViaAPI = (name, branchId, envName) =>
  cy.apiGetEnvironments().then((environments) => {
    const env = environments.find((e) => e.name === envName);
    expect(env, `environment ${envName}`).to.exist;
    return tjRequest("GET", `/data-sources/${Cypress.env("workspaceId")}`, { qs: { branch_id: branchId } })
      .then((res) => {
        const ds = (res.body?.data_sources || []).find((d) => d.name === name);
        expect(ds, `data source ${name} on branch`).to.exist;
        return tjRequest("GET", `/data-sources/${ds.id}/environment/${env.id}`, { qs: { branch_id: branchId } });
      })
      .then((res) => ({ ...res.body, environmentId: env.id }));
  });

/**
 * Change option values of a data source for one environment on a branch, the way the
 * data source form saves: every current option is sent back (encrypted values left
 * empty keep their stored credential — server/src/modules/data-sources/util.service.ts:918-952).
 *
 * @tjType dataSource.updateOnBranch
 * @tjBlock gitSync
 * @tjUsage updateDataSourceOnBranchViaAPI({ name: "restapi", branchId, envName: "staging", values: { url: "https://x" } })
 * @tjDom none - PUT /api/data-sources/:id?environment_id=&branch_id=
 */
export const updateDataSourceOnBranchViaAPI = ({ name, branchId, envName, values }) =>
  getDataSourceOnBranchViaAPI(name, branchId, envName).then((ds) => {
    const options = Object.entries({ ...ds.options, ...values }).map(([key, opt]) =>
      key in values
        ? { key, value: values[key], encrypted: !!ds.options?.[key]?.encrypted }
        : { key, value: opt?.encrypted ? "" : opt?.value, encrypted: !!opt?.encrypted },
    );
    return tjRequest("PUT", `/data-sources/${ds.id}`, {
      qs: { environment_id: ds.environmentId, branch_id: branchId },
      body: { name, options },
    }).then((res) => {
      expect(res.status, `update ${name} (${envName})`).to.equal(200);
    });
  });

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
