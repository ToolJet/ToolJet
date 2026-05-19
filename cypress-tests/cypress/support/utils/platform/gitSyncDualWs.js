import { gitSyncSelectors as GS } from "Selectors/platform/gitsync";

// Helpers for orchestrating Dev → Prod git-sync user flows on a single ToolJet
// instance using two workspaces. They model the gist's dev/prod scenario when
// running locally; the same shape will work cross-instance later by swapping
// `apiLogin` for two URLs + `cy.origin()` blocks.
//
// Each helper reads/writes the same cypress envs (`workspaceId`, `workspaceSlug`)
// the rest of the suite already uses, so no new globals.
export const gitSyncDualWs = {
  // Logs into a workspace and remembers its identifier so dashboard helpers
  // (e.g. gitSyncGoToDashboard, gitSyncDashboardPush) build the right URLs.
  //
  // We deliberately write the workspace **UUID** into `workspaceSlug` — the
  // SPA's `:workspaceId` route segment accepts both slug and UUID, but the
  // slug-based path 404s for freshly-created workspaces because the auth
  // session we just established is scoped by UUID (`/api/authenticate/{uuid}`),
  // not by slug. Using the UUID keeps the URL and the auth scope aligned.
  // `workspaceSlug` is the env name the existing helpers read, hence the
  // (slightly misleading) name kept here for minimal blast radius.
  switchTo: ({ workspaceId, workspaceSlug }) => {
    cy.then(() => cy.apiLogin("dev@tooljet.io", "password", workspaceId));
    cy.then(() => Cypress.env("workspaceSlug", workspaceId));
    cy.then(() => Cypress.env("workspaceName", workspaceSlug));
  },

  // Creates two fresh workspaces (one acts as Dev, one as Prod) and ensures
  // git-sync is configured on both. Returns nothing — the caller passes refs
  // to capture the resulting workspace ids.
  setupDevAndProd: ({ devName, prodName, devIdRef, prodIdRef }) => {
    cy.apiLogin();
    cy.apiCreateWorkspace(devName, devName).then((res) => {
      devIdRef.value = res.body.organization_id;
    });
    cy.apiCreateWorkspace(prodName, prodName).then((res) => {
      prodIdRef.value = res.body.organization_id;
    });

    cy.then(() =>
      gitSyncDualWs.switchTo({
        workspaceId: devIdRef.value,
        workspaceSlug: devName,
      }),
    );
    cy.gitSyncCheckAndConfigure();

    cy.then(() =>
      gitSyncDualWs.switchTo({
        workspaceId: prodIdRef.value,
        workspaceSlug: prodName,
      }),
    );
    cy.gitSyncCheckAndConfigure();
  },

  // Pull master via the dashboard UI. Mirrors the inline helper from
  // gitSyncModuleMerge.cy.js so we don't drift on the modal sequence.
  // The trailing reload + wait gives the SPA a clean read of the
  // newly-synced rows — visiting another page (e.g. /modules) immediately
  // after the modal closes can race the workspace-branches refresh and
  // render an empty list.
  pullMaster: () => {
    cy.gitSyncGoToDashboard();
    cy.gitSyncSwitchBranch("master");
    cy.get(GS.wsGitPullBtn).click();
    cy.get(GS.modalTitle).should("be.visible");
    cy.get(GS.checkForUpdatesLabel).click();
    cy.get(GS.pullModalPullChangesBtn, { timeout: 30000 })
      .should("be.enabled")
      .click();
    cy.get(GS.modalTitle, { timeout: 60000 }).should("not.exist");
    cy.wait(3000);
    cy.reload();
    cy.get('[data-cy="dashboard-section-header"]', { timeout: 30000 }).should(
      "be.visible",
    );
    cy.wait(2000);
  },

  // Cleanup helper — honours CYPRESS_NO_CLEANUP for debugging.
  // Pass the branch name so the GitHub branch is also removed.
  teardown: ({ devIdRef, prodIdRef, branchName }) => {
    if (Cypress.env("CYPRESS_NO_CLEANUP")) {
      cy.log(
        "[cleanup] CYPRESS_NO_CLEANUP set — leaving workspaces + branch in place",
      );
      return;
    }
    cy.apiLogin();
    cy.then(() => devIdRef.value && cy.apiArchiveWorkspace(devIdRef.value));
    cy.then(() => prodIdRef.value && cy.apiArchiveWorkspace(prodIdRef.value));
    if (branchName) cy.gitHubDeleteBranch(branchName);
  },

  // ───────────────────────────────────────────────────────────────────────
  // Authoring helpers (used by flows #7, #9, #10, #11)
  // ───────────────────────────────────────────────────────────────────────

  // Create the same-named DS on both Dev and Prod workspaces with different
  // URLs. Wrapped in cy.then so workspace IDs from setupDevAndProd resolve
  // before the create calls fire.
  createSameNameDsOnBoth: ({
    dsName,
    devUrl,
    prodUrl,
    devIdRef,
    prodIdRef,
    devWsName,
    prodWsName,
    kind = "restapi",
  }) => {
    const opts = (url) => [
      { key: "url", value: url },
      { key: "auth_type", value: "none" },
      { key: "headers", value: [["", ""]] },
    ];
    const createDs = (url) =>
      cy.apiCreateDataSource(
        `${Cypress.env("server_host")}/api/data-sources`,
        dsName,
        kind,
        opts(url),
      );

    cy.then(() =>
      gitSyncDualWs.switchTo({
        workspaceId: devIdRef.value,
        workspaceSlug: devWsName,
      }),
    );
    cy.then(() => createDs(devUrl));
    cy.then(() =>
      gitSyncDualWs.switchTo({
        workspaceId: prodIdRef.value,
        workspaceSlug: prodWsName,
      }),
    );
    cy.then(() => createDs(prodUrl));
  },

  // ── Component-diff helpers ─────────────────────────────────────────────

  // Generate a UUID-shaped id suitable for a components-diff key. The
  // /v2/components endpoint validates these as UUIDs.
  componentId: () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`,

  // Default layout used by the marker / Button / Text widgets we drop on
  // module + app canvases in these specs. Specs can override per-component.
  _defaultLayout: () => ({
    desktop: { top: 30, left: 10, width: 12, height: 40 },
    mobile: { top: 30, left: 10, width: 12, height: 40 },
  }),

  // Build a Text component entry for a diff payload.
  // Names are already-lowercased — ToolJet derives data-cy as
  // `draggable-widget-{name.toLowerCase()}`, so keeping the name lowercase
  // means the test selector matches without guesswork.
  textComponent: ({ name, text, layout }) => ({
    name,
    layouts: layout || gitSyncDualWs._defaultLayout(),
    type: "Text",
    properties: { text: { value: text } },
  }),

  // Build a Button component entry.
  buttonComponent: ({ name, text = "Run query", layout }) => ({
    name,
    layouts: layout || gitSyncDualWs._defaultLayout(),
    type: "Button",
    properties: { text: { value: text } },
  }),

  // Build a ModuleViewer component entry. Defaults to follow-latest (no
  // pinning); pass `moduleVersionId` (a module_reference_id UUID) to pin.
  moduleViewerComponent: ({
    name,
    moduleId,
    moduleVersionId = "",
    layout,
  }) => ({
    name,
    layouts: layout || {
      desktop: { top: 20, left: 5, width: 30, height: 400 },
      mobile: { top: 20, left: 0, width: 12, height: 400 },
    },
    type: "ModuleViewer",
    properties: {
      moduleAppId: { value: moduleId },
      moduleVersionId: { value: moduleVersionId },
      visibility: { value: true },
    },
  }),

  // POST a components diff to an app/module's editing version. Reads the
  // home_page_id from /api/apps/{id} with x-branch-id, then writes the
  // diff. Returns the response body.
  addComponents: ({ appId, versionId, branchId, diff }) =>
    cy.getAuthHeaders().then((headers) => {
      const branchHeaders = { ...headers, "x-branch-id": branchId };
      return cy
        .request({
          method: "GET",
          url: `${Cypress.env("server_host")}/api/apps/${appId}`,
          headers: branchHeaders,
        })
        .then((appRes) => {
          const pageId = appRes.body?.editing_version?.home_page_id;
          expect(pageId, "home page id").to.be.a("string");
          return cy
            .request({
              method: "POST",
              url: `${Cypress.env("server_host")}/api/v2/apps/${appId}/versions/${versionId}/components`,
              headers: branchHeaders,
              body: { is_user_switched_version: false, pageId, diff },
            })
            .then((res) => {
              expect(res.status, "Create components").to.equal(201);
              return res.body;
            });
        });
    }),

  // Create a REST query bound to an existing DS on the given branch.
  // Returns the response body (which includes the new query's id).
  createRestQuery: ({
    appId,
    versionId,
    branchId,
    dsId,
    queryName,
    url = "/users/1",
  }) =>
    cy.getAuthHeaders().then((headers) => {
      const branchHeaders = { ...headers, "x-branch-id": branchId };
      return cy
        .request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/data-queries/data-sources/${dsId}/versions/${versionId}`,
          headers: branchHeaders,
          body: {
            app_id: appId,
            app_version_id: versionId,
            name: queryName,
            kind: "restapi",
            options: {
              method: "get",
              url,
              url_params: [["", ""]],
              headers: [["", ""]],
              body: [["", ""]],
              json_body: null,
              body_toggle: false,
            },
            data_source_id: dsId,
            plugin_id: null,
          },
        })
        .then((res) => {
          expect(res.status, `Create query '${queryName}'`).to.equal(201);
          return res.body;
        });
    }),

  // GitHub round-trip: wait until the feature branch is ahead of master,
  // open a PR, merge it. Encapsulates the 3-line dance we do in every spec.
  mergePr: ({ branchName, message, base = "master" }) => {
    cy.gitHubWaitForCommitsAhead(branchName, base);
    cy.gitHubCreatePR(branchName, message, base).then(() =>
      cy.gitHubMergePR(Cypress.env("prNumber")),
    );
  },

  // ── Prod-side lookup helpers ───────────────────────────────────────────

  // Look up an app (or module) row on Prod by name + organization_id.
  // After git pull, Dev and Prod each have a record with the same name —
  // filtering by org disambiguates. Returns the app id.
  findProdAppId: ({ name, prodOrgId, type = null }) => {
    const typeFilter = type ? ` and type='${type}'` : "";
    return cy
      .task("dbConnection", {
        dbconfig: Cypress.env("app_db"),
        sql: `select id from apps where name='${name}' and organization_id='${prodOrgId}'${typeFilter} limit 1;`,
      })
      .then((resp) => {
        const id = resp.rows[0]?.id;
        expect(id, `Prod copy of '${name}'`).to.be.a("string");
        return id;
      });
  },

  // Read the moduleVersionId pin value from Prod's ModuleViewer component
  // row via DB. Returns the pin string (or undefined if no ModuleViewer).
  readModuleViewerPin: ({ prodAppId }) =>
    cy
      .task("dbConnection", {
        dbconfig: Cypress.env("app_db"),
        sql: `
          select c.properties
          from components c
          join pages p on p.id = c.page_id
          join app_versions av on av.id = p.app_version_id
          where av.app_id = '${prodAppId}'
            and c.type = 'ModuleViewer'
          limit 1;
        `,
      })
      .then((resp) => {
        const props = resp.rows[0]?.properties;
        const parsed = typeof props === "string" ? JSON.parse(props) : props;
        return parsed?.moduleVersionId?.value;
      }),
};
