import { gitSyncSelectors as GS } from "Selectors/platform/gitsync";
import { fake } from "Fixtures/fake";


describe(
  "Git Sync — App Push from Editor + Branch Pull",
  { retries: 0 },
  () => {
    let data = {}

    const FIXTURE = "gitSync/fixture-app.json";
    const DS_BASE_URL = "https://jsonplaceholder.typicode.com";
    const CONSTANT_NAME = "API_BASE_URL";

    let workspaceId;
    let secondWorkspaceId;

    before(() => {
      Cypress.config("redirectionLimit", 20);
      cy.gitHubResetRepo();
    });

    beforeEach(() => {
      data.testId = fake.firstName.toLowerCase().replace(/\s+/g, "-");
      data.wsName = fake.firstName.toLowerCase().replace(/\s+/g, "-");
      data.wsSlug = `gitsync-editor-push-${data.testId}`;
      data.branchName = `test-editor-push-${data.testId}`;
      data.appName = `app-editor-push-${data.testId}`;
      data.editorMsg = `test: editor push ${data.appName}`;
      data.dsMsg = "feat: update datasource to workspace constant";

      cy.apiLogin();
      cy.apiCreateWorkspace(data.wsName, data.wsSlug).then((res) => {
        workspaceId = res.body.organization_id;
        Cypress.env("workspaceId", workspaceId);
        Cypress.env("workspaceSlug", data.wsSlug);
      });
      cy.then(() => cy.apiLogin("dev@tooljet.io", "password", workspaceId));
      cy.gitSyncCheckAndConfigure();
    });

    afterEach(() => {
      cy.apiLogin();
      cy.then(() => cy.apiArchiveWorkspace(workspaceId));
      cy.then(() => {
        if (secondWorkspaceId) {
          cy.apiArchiveWorkspace(secondWorkspaceId);
          secondWorkspaceId = null;
        }
      });
    });

    it("Configure workspace constant → import + editor push + DS push → PR → merge → master pull → verify app data in editor", () => {

      // ── 1. Add workspace constant via API ─────────────────────────────────
      cy.apiCreateWorkspaceConstant(
        CONSTANT_NAME,
        DS_BASE_URL,
        ["Global"],
        ["development", "staging", "production"],
      );

      // ── 2. Import app + editor push + datasource push (all API) ──────────
      apiSteps({ ...data, fixture: FIXTURE });
      // ── 5. Visit dashboard — verify app card + editor data ────────────────
      cy.gitSyncGoToDashboard();

      // cy.reload();
      cy.wait(3000);
      cy.contains(GS.appCard, data.appName, { timeout: 30000 }).should("be.visible");

      // Open app in builder and confirm the query resolves via workspace constant
      cy.gitSyncOpenAppInBuilder(data.appName);
      cy.get(GS.queryStatusWidget, { timeout: 20000 }).should(
        "contain.text",
        "Query completed",
      );
    });

    it("New workspace → configure git + branch (API) → import app from git via UI modal → verify data in editor", () => {
      const secondWsName = `gitsync-editor-push-second-${data.testId}`;
      const secondWsSlug = secondWsName;

      // ── 1. Add workspace constant + seed git via API (branch → import → push → PR → merge) ──
      cy.apiCreateWorkspaceConstant(
        CONSTANT_NAME,
        DS_BASE_URL,
        ["Global"],
        ["development", "staging", "production"],
      );
      apiSteps({ ...data, fixture: FIXTURE });

      // ── 2. Create second workspace + workspace constant + configure git sync ──
      cy.apiLogin();
      cy.apiCreateWorkspace(secondWsName, secondWsSlug).then((res) => {
        secondWorkspaceId = res.body.organization_id;
        Cypress.env("workspaceId", secondWorkspaceId);
        Cypress.env("workspaceSlug", secondWsSlug);
      });
      cy.then(() => cy.apiLogin("dev@tooljet.io", "password", secondWorkspaceId));
      cy.apiCreateWorkspaceConstant(
        CONSTANT_NAME,
        DS_BASE_URL,
        ["Global"],
        ["development", "staging", "production"],
      );
      cy.gitSyncCheckAndConfigure();

      // ── 3. Go to dashboard + verify on master ─────────────────────────────
      cy.gitSyncGoToDashboard();
      cy.wait(3000);
      cy.get(GS.wsCurrentBranch, { timeout: 10000 }).should("contain.text", "master");

      // ── 4. Open create-app dropdown → click "Import from git repository" ──
      cy.get('[data-cy="import-dropdown-menu"]').click();
      cy.get('[data-cy="import-from-git-button"]').should("be.visible").click();

      // ── 5. Validate modal text and components ─────────────────────────────
      cy.contains("Import app from git repository").should("be.visible");
      cy.get('[data-cy="select-branch-label"]')
        .should("be.visible")
        .and("contain.text", "Select branch");
      cy.get(GS.branchSelect).should("be.visible");
      cy.contains("button", "Import app").should("be.disabled");

      // ── 6. Select branch and app from the modal ───────────────────────────
      cy.get('[data-cy="branch-select"] .react-select__control').click();
      cy.get(".react-select__option").contains(data.branchName).click();

      cy.get('[data-cy="create-app-from-label"]', { timeout: 10000 })
        .should("be.visible")
        .and("contain.text", "Create app from");
      cy.get('[data-cy="app-select"]').should("be.visible");

      cy.get('[data-cy="app-select"] .react-select__control').click();
      cy.get(".react-select__option").contains(data.appName).click();

      // ── 7. Validate remaining modal sections ──────────────────────────────
      cy.get('[data-cy="app-name-label"]')
        .should("be.visible")
        .and("contain.text", "App name");
      cy.get('[data-cy="modal-body"] input.form-control').should("have.value", data.appName);
      cy.contains("Make application editable").should("be.visible");
      cy.contains(
        "Enabling this allows editing and git sync push/pull access in development.",
      ).should("be.visible");
      cy.get('[data-cy="version-select-label"]')
        .should("be.visible")
        .and("contain.text", "Select version to pull from");
      cy.get(GS.versionSelect).should("be.visible");
      cy.get('[data-cy="last-commit-label"]')
        .should("be.visible")
        .and("contain.text", "Last commit");
      cy.get('[data-cy="last-commit-message"]', { timeout: 10000 }).should("be.visible");
      cy.get('[data-cy="author-info"]').should("be.visible");
      cy.contains("button", "Cancel").should("be.visible");
      cy.contains("button", "Import app").should("be.enabled");

      // ── 8. Click "Import app" → verify data in app editor ────────────────
      cy.contains("button", "Import app").click();
      cy.url({ timeout: 30000 }).should("include", "/apps/");
      cy.waitForAppLoad();
      cy.get(GS.queryStatusWidget, { timeout: 20000 }).should("contain.text", "Query completed");
    });
  },
);


const apiSteps = ({ fixture, branchName, appName, editorMsg, dsMsg }) => {
      cy.gitSyncCreateBranchViaApi(branchName);
      cy.gitSyncImportAppFromFixture(fixture, appName, branchName).then(
        (appId) => {
          cy.log(`[gitSync] appId: ${appId}`);

          cy.gitSyncGetBranchId(branchName).then((branchId) => {
            cy.log(`[gitSync] branchId: ${branchId}`);

            cy.apiGetEditingVersionId(appId, branchId).then((versionId) => {
              cy.log(`[gitSync] versionId: ${versionId}`);

              // Editor push — writes apps/{appName}/ folder to git
              cy.apiEditorPush(
                appId,
                versionId,
                editorMsg,
                branchName,
                appName,
              );
              cy.gitHubWaitForCommitMessage(branchName, appName);

              // Dashboard push — writes data-sources/{id}.json to git
              // Note: this push may be a no-op if datasource content is already
              // in git (e.g. when the editor push already serialized the DS).
              // We do NOT assert a "datasource" commit here — instead we rely on
              // gitHubWaitForCommitsAhead below to confirm the branch is ahead.
              cy.apiGitSyncPush(dsMsg, branchId);

              // ── 3. Create PR → merge ──────────────────────────────────────
              cy.gitHubWaitForCommitsAhead(branchName, "master");
              cy.gitHubCreatePR(branchName, `PR: ${appName}`, "master").then(
                (prNumber) => {
                  cy.log(`[gitSync] prNumber: ${prNumber}`);
                  cy.gitHubMergePR(prNumber);
                },
              );

              // ── 4. Switch to master + pull ────────────────────────────────
              cy.gitSyncGetBranchId("master").then((masterBranchId) => {
                cy.apiSwitchBranch(masterBranchId);
                cy.apiGitSyncPull(masterBranchId);
              });
            });
          });
        },
      );

}