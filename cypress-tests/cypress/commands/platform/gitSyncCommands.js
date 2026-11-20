// Git sync's own ToolJet API commands; each makes one request and yields the cy.request response.

// With `ok`, the status is checked here (so the failure shows the body); without it cy.request checks it.
const tjRequest = (method, path, { body, qs, failOnStatusCode = true, ok, label } = {}) =>
  cy.getAuthHeaders().then((headers) =>
    cy
      .request({
        method,
        url: `${Cypress.env("server_host")}/api${path}`,
        headers,
        body,
        qs,
        failOnStatusCode: ok ? false : failOnStatusCode,
      })
      .then((res) => {
        if (ok && failOnStatusCode) {
          expect(res.status, `${label}: ${JSON.stringify(res.body)}`).to.be.oneOf(ok);
        }
        return res;
      }),
  );

/**
 * @tjCmd   api · create an app (or module) on a workspace branch; pass failOnStatusCode:false for the raw response
 * @tjUsage cy.apiCreateBranchApp(appName, branch.id, { type: "module" }).then((res) => res.body.id)
 */
Cypress.Commands.add(
  "apiCreateBranchApp",
  (name, branchId, { type = "front-end", failOnStatusCode = true } = {}) =>
    tjRequest("POST", type === "module" ? "/modules" : "/apps", {
      body: { name, icon: "floppydisk", type, branchId },
      failOnStatusCode,
      ok: [201],
      label: `create ${type} ${name}`,
    }),
);

/**
 * @tjCmd   api · get an app's metadata on a workspace branch
 * @tjUsage cy.apiGetBranchApp(appId, branch.id).then((res) => res.body.editing_version.id)
 */
Cypress.Commands.add("apiGetBranchApp", (appId, branchId) =>
  tjRequest("GET", `/apps/${appId}`, { qs: { branch_id: branchId } }),
);

/**
 * @tjCmd   api · list the apps (or modules / workflows by type) on a workspace branch
 * @tjUsage cy.apiListBranchApps(branch.id).then((res) => res.body.apps)
 */
Cypress.Commands.add("apiListBranchApps", (branchId, type = "front-end") =>
  tjRequest("GET", "/apps", { qs: { page: 1, type, branch_id: branchId } }),
);

/**
 * @tjCmd   api · list an app's versions on a workspace branch
 * @tjUsage cy.apiListBranchAppVersions(appId, branch.id).then((res) => res.body.versions)
 */
Cypress.Commands.add("apiListBranchAppVersions", (appId, branchId) =>
  tjRequest("GET", `/apps/${appId}/versions`, { qs: { branch_id: branchId } }),
);

/**
 * @tjCmd   api · rename an app on a workspace branch the way the dashboard does (name + editing version)
 * @tjUsage cy.apiRenameBranchApp(appId, "new-name", branch.id, versionId, { failOnStatusCode: false })
 */
Cypress.Commands.add(
  "apiRenameBranchApp",
  (appId, name, branchId, editingVersionId, { failOnStatusCode = true } = {}) =>
    tjRequest("PUT", `/apps/${appId}`, {
      qs: branchId ? { branch_id: branchId } : undefined,
      body: { app: editingVersionId ? { name, editingVersionId } : { name } },
      failOnStatusCode,
    }),
);

/**
 * @tjCmd   api · delete an app on a workspace branch
 * @tjUsage cy.apiDeleteBranchApp(appId, branch.id)
 */
Cypress.Commands.add("apiDeleteBranchApp", (appId, branchId) =>
  tjRequest("DELETE", `/apps/${appId}`, {
    qs: { branch_id: branchId },
    ok: [200, 204],
    label: "delete app on branch",
  }),
);

/**
 * @tjCmd   api · release a saved (non-draft) app version
 * @tjUsage cy.apiReleaseAppVersion(appId, versionId)
 */
Cypress.Commands.add("apiReleaseAppVersion", (appId, versionId, { failOnStatusCode = true } = {}) =>
  tjRequest("PUT", `/apps/${appId}/release`, {
    body: { versionToBeReleased: versionId },
    failOnStatusCode,
    ok: [200, 201],
    label: `release app ${appId} version ${versionId}`,
  }),
);

/**
 * @tjCmd   api · export one app version on a workspace branch (definition.appV2 is the git source of truth)
 * @tjUsage cy.apiExportBranchApp(appId, versionId, branch.id).then((res) => res.body.app[0].definition.appV2)
 */
Cypress.Commands.add("apiExportBranchApp", (appId, versionId, branchId) =>
  tjRequest("POST", "/v2/resources/export", {
    qs: { branch_id: branchId },
    body: {
      app: [{ id: appId, search_params: { version_id: versionId } }],
      tooljet_database: [],
      organization_id: Cypress.env("workspaceId"),
    },
    ok: [201],
    label: "export app",
  }),
);

/**
 * @tjCmd   api · import an app export onto a workspace branch under a new app name
 * @tjUsage cy.apiImportBranchApp(exported, appName, branch.id).then((res) => res.body.imports.app[0].id)
 */
Cypress.Commands.add("apiImportBranchApp", (exported, appName, branchId) =>
  // ?branch_id overrides body.branchId, so send both.
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
    ok: [201],
    label: `import ${appName}`,
  }),
);

/**
 * @tjCmd   api · put an app in a folder on a workspace branch (folder-apps reads the raw branch_id query)
 * @tjUsage cy.apiAddBranchAppToFolder(folderId, appId, branch.id)
 */
Cypress.Commands.add("apiAddBranchAppToFolder", (folderId, appId, branchId) =>
  tjRequest("POST", "/folder-apps", {
    qs: { branch_id: branchId },
    body: { folder_id: folderId, app_id: appId },
    ok: [200, 201],
    label: "add app to folder",
  }),
);

/**
 * @tjCmd   api · push an app from the editor to its git branch (body mirrors GitSyncModal appGitPush)
 * @tjUsage cy.apiPushBranchApp({ appId, versionId, appName, branch, commitMessage }, { failOnStatusCode: false })
 */
Cypress.Commands.add(
  "apiPushBranchApp",
  ({ appId, versionId, appName, branch, commitMessage, singleBranch = false }, { failOnStatusCode = true } = {}) =>
    tjRequest("POST", `/app-git/gitpush/${appId}/${versionId}`, {
      qs: { branch_id: branch.id },
      body: {
        gitAppName: appName,
        versionId,
        lastCommitMessage: commitMessage,
        gitVersionName: branch.name,
        ...(singleBranch ? { allowMasterPush: true } : { sourceBranch: branch.name }),
      },
      failOnStatusCode,
      ok: [200, 201, 204],
      label: `push ${appName}`,
    }),
);

/**
 * @tjCmd   api · list the workspace's global data sources on a workspace branch
 * @tjUsage cy.apiListBranchDataSources(branch.id).then((res) => res.body.data_sources)
 */
Cypress.Commands.add("apiListBranchDataSources", (branchId) =>
  tjRequest("GET", `/data-sources/${Cypress.env("workspaceId")}`, { qs: { branch_id: branchId } }),
);

/**
 * @tjCmd   api · read a data source's options for one environment on a workspace branch
 * @tjUsage cy.apiGetBranchDataSourceOptions(dataSourceId, envId, branch.id).then((res) => res.body.options)
 */
Cypress.Commands.add("apiGetBranchDataSourceOptions", (dataSourceId, environmentId, branchId) =>
  tjRequest("GET", `/data-sources/${dataSourceId}/environment/${environmentId}`, {
    qs: { branch_id: branchId },
  }),
);

/**
 * @tjCmd   api · save a data source's options for one environment on a workspace branch
 * @tjUsage cy.apiUpdateBranchDataSource({ dataSourceId, environmentId, branchId, name, options, label: "update restapi" })
 */
Cypress.Commands.add(
  "apiUpdateBranchDataSource",
  ({ dataSourceId, environmentId, branchId, name, options, label = `update ${name}` }) =>
    tjRequest("PUT", `/data-sources/${dataSourceId}`, {
      qs: { environment_id: environmentId, branch_id: branchId },
      body: { name, options },
      ok: [200],
      label,
    }),
);

/**
 * @tjCmd   api · list the workspace branches and the active branch
 * @tjUsage cy.apiListWorkspaceBranches().then((res) => res.body.branches)
 */
Cypress.Commands.add("apiListWorkspaceBranches", () => tjRequest("GET", "/workspace-branches"));

/**
 * @tjCmd   api · request a workspace branch create (runs on the git-sync queue; does not wait for it)
 * @tjUsage cy.apiCreateWorkspaceBranch("bad name", {}, { failOnStatusCode: false }).then((res) => res.status)
 */
Cypress.Commands.add("apiCreateWorkspaceBranch", (name, opts = {}, { failOnStatusCode = true } = {}) =>
  tjRequest("POST", "/workspace-branches", {
    body: { name, ...opts },
    failOnStatusCode,
    ok: [200, 201],
    label: `create branch ${name}`,
  }),
);

/**
 * @tjCmd   api · switch the active workspace branch (optionally resolving an app on it)
 * @tjUsage cy.apiSwitchWorkspaceBranch(branch.id).then((res) => res.body)
 */
Cypress.Commands.add("apiSwitchWorkspaceBranch", (branchId, appId) =>
  tjRequest("PUT", `/workspace-branches/${branchId}/activate`, { body: appId ? { appId } : {} }),
);

/**
 * @tjCmd   api · request a workspace branch delete (runs on the git-sync queue; does not wait for it)
 * @tjUsage cy.apiDeleteWorkspaceBranch(branch.id, { failOnStatusCode: false })
 */
Cypress.Commands.add("apiDeleteWorkspaceBranch", (branchId, { failOnStatusCode = true } = {}) =>
  tjRequest("DELETE", `/workspace-branches/${branchId}`, {
    failOnStatusCode,
    ok: [200, 202, 204],
    label: `delete branch ${branchId}`,
  }),
);

/**
 * @tjCmd   api · push workspace resources (data sources) to git; synchronous
 * @tjUsage cy.apiPushWorkspaceBranch({ branchId, commitMessage: "feat: ds" })
 */
Cypress.Commands.add("apiPushWorkspaceBranch", (body, { failOnStatusCode = true } = {}) =>
  tjRequest("POST", "/workspace-branches/push", {
    body,
    failOnStatusCode,
    ok: [200, 201],
    label: "workspace push",
  }),
);

/**
 * @tjCmd   api · request a workspace pull (runs on the git-sync queue; does not wait for it)
 * @tjUsage cy.apiPullWorkspaceBranch(branch.id, { failOnStatusCode: false }).then((res) => res.status)
 */
Cypress.Commands.add("apiPullWorkspaceBranch", (branchId, { failOnStatusCode = true } = {}) =>
  tjRequest("POST", "/workspace-branches/pull", {
    body: branchId ? { branchId } : {},
    failOnStatusCode,
    ok: [200, 201, 202],
    label: `pull ${branchId}`,
  }),
);

/**
 * @tjCmd   api · ask whether the remote git branch has commits ToolJet has not pulled
 * @tjUsage cy.apiCheckWorkspaceBranchUpdates(branch.name).then((res) => res.body.has_updates)
 */
Cypress.Commands.add("apiCheckWorkspaceBranchUpdates", (branchName) =>
  tjRequest("GET", "/workspace-branches/check-updates", { qs: { branch: branchName } }),
);

/**
 * @tjCmd   api · hydrate the stub version a pull created so the app has a real draft
 * @tjUsage cy.apiEnsureBranchAppDraft(appId, branch.id)
 */
Cypress.Commands.add("apiEnsureBranchAppDraft", (appId, branchId) =>
  tjRequest("POST", "/workspace-branches/ensure-draft", { body: { appId, branchId } }),
);

/**
 * @tjCmd   api · read the workspace's git sync config status (404 when not configured)
 * @tjUsage cy.apiGetGitSyncStatus({ failOnStatusCode: false }).then((res) => res.body)
 */
Cypress.Commands.add("apiGetGitSyncStatus", ({ failOnStatusCode = true } = {}) =>
  tjRequest("GET", `/git-sync/${Cypress.env("workspaceId")}/status`, { failOnStatusCode }),
);

/**
 * @tjCmd   api · save a git sync provider config (see githubConfigPayload)
 * @tjUsage cy.apiSaveGitSyncConfig(githubConfigPayload(base), { failOnStatusCode: false })
 */
Cypress.Commands.add("apiSaveGitSyncConfig", (payload, { failOnStatusCode = true } = {}) =>
  tjRequest("POST", "/git-sync/configs", {
    body: payload,
    failOnStatusCode,
    ok: [200, 201],
    label: "save git config",
  }),
);

/**
 * @tjCmd   api · test a git sync provider config without saving it
 * @tjUsage cy.apiTestGitSyncConnection(githubConfigPayload(base), { failOnStatusCode: false })
 */
Cypress.Commands.add("apiTestGitSyncConnection", (payload, { failOnStatusCode = true } = {}) =>
  tjRequest("POST", "/git-sync/test-connection", { body: payload, failOnStatusCode }),
);

/**
 * @tjCmd   api · turn git sync branching (multi-branch mode) on or off
 * @tjUsage cy.apiSetGitSyncBranching(orgGitId, true)
 */
Cypress.Commands.add("apiSetGitSyncBranching", (orgGitId, isBranchingEnabled) =>
  tjRequest("PUT", `/git-sync/${orgGitId}/is-branching-enabled`, { body: { isBranchingEnabled } }),
);

/**
 * @tjCmd   api · turn the git sync provider off, keeping its config
 * @tjUsage cy.apiDisableGitSync(orgGitId)
 */
Cypress.Commands.add("apiDisableGitSync", (orgGitId, gitType = "github_https") =>
  tjRequest("PUT", `/git-sync/status/${orgGitId}`, { body: { isEnabled: false, gitType } }),
);

/**
 * @tjCmd   api · delete the workspace's git sync config
 * @tjUsage cy.apiDeleteGitSyncConfig(orgGitId, "github_https", { failOnStatusCode: false })
 */
Cypress.Commands.add(
  "apiDeleteGitSyncConfig",
  (orgGitId, gitType = "github_https", { failOnStatusCode = true } = {}) =>
    tjRequest("DELETE", `/git-sync/${orgGitId}?gitType=${gitType}`, { failOnStatusCode }),
);
