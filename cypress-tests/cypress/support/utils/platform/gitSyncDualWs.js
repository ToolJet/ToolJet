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
};
