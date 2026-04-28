import { gitSyncSelectors as GS } from "Selectors/platform/gitsync";

describe(
  "Git Sync — App Push from Editor + Branch Pull",
  { retries: 0 },
  () => {
    const testId = Date.now();
    const wsName = `gitsync-editor-push-${testId}`;
    const wsSlug = wsName;
    const FIXTURE = "gitSync/fixture-app.json";
    const DS_BASE_URL = "https://jsonplaceholder.typicode.com";
    const CONSTANT_NAME = "API_BASE_URL";

    let workspaceId;
    let secondWorkspaceId;

    let seededAppName;
    let seededBranchName;

    before(() => {
      Cypress.config("redirectionLimit", 20);
    });

    before(() => {
      cy.apiLogin();
      cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
        workspaceId = res.body.organization_id;
        Cypress.env("workspaceId", workspaceId);
        Cypress.env("workspaceSlug", wsSlug);
        cy.log(`[gitSync] Workspace: ${wsName} (${workspaceId})`);
      });
      cy.then(() => cy.apiLogin("dev@tooljet.io", "password", workspaceId));
      cy.gitSyncCheckAndConfigure();
      cy.gitHubResetRepo();
    });

    beforeEach(() => {
      cy.then(() => cy.apiLogin("dev@tooljet.io", "password", workspaceId));
    });

    after(() => {
      cy.apiLogin();
      cy.then(() => cy.apiArchiveWorkspace(workspaceId));
      cy.then(() => {
        if (secondWorkspaceId) cy.apiArchiveWorkspace(secondWorkspaceId);
      });
    });

    it("Configure workspace constant → import + editor push + DS push → PR → merge → master pull → verify app data in editor", () => {
      const branchName = `test-editor-push-${testId}`;
      const appName = `app-editor-push-${testId}`;
      const editorMsg = `test: editor push ${appName}`;
      const dsMsg = "feat: update datasource to workspace constant";

      seededAppName = appName;
      seededBranchName = branchName;

      // ── 1. Add workspace constant via API ─────────────────────────────────
      cy.apiCreateWorkspaceConstant(
        CONSTANT_NAME,
        DS_BASE_URL,
        ["Global"],
        ["development", "staging", "production"],
      );

      // ── 2. Import app + editor push + datasource push (all API) ──────────
      cy.gitSyncCreateBranchViaApi(branchName);
      cy.gitSyncImportAppFromFixture(FIXTURE, appName, branchName).then(
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
              cy.apiGitSyncPush(dsMsg, branchId);
              cy.gitHubWaitForCommitMessage(branchName, "datasource");

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
                cy.log(`[gitSync] masterBranchId: ${masterBranchId}`);
                cy.apiSwitchBranch(masterBranchId);
                cy.apiGitSyncPull(masterBranchId);
              });
            });
          });
        },
      );

      // ── 5. Visit dashboard — verify app card + editor data ────────────────
      cy.gitSyncGoToDashboard();

      // cy.reload();
      cy.wait(3000);
      cy.contains(GS.appCard, appName, { timeout: 30000 }).should("be.visible");

      // Open app in builder and confirm the query resolves via workspace constant
      cy.gitSyncOpenAppInBuilder(appName);
      cy.get(GS.queryStatusWidget, { timeout: 20000 }).should(
        "contain.text",
        "Query completed",
      );
    });

    it("New workspace → configure git + branch (API) → import app from git via UI modal → verify data in editor", () => {
      const secondWsName = `gitsync-editor-push-second-${testId}`;
      const secondWsSlug = secondWsName;
      const importBranch = `test-git-import-${testId}`;

      cy.apiLogin();
      cy.then(() => {
        if (secondWorkspaceId) {
          Cypress.env("workspaceId", secondWorkspaceId);
          Cypress.env("workspaceSlug", secondWsSlug);
          cy.log(
            `[gitSync] Reusing second workspace from prior attempt: ${secondWsName} (${secondWorkspaceId})`,
          );
          cy.then(() =>
            cy.apiLogin("dev@tooljet.io", "password", secondWorkspaceId),
          );
        } else {
          cy.apiCreateWorkspace(secondWsName, secondWsSlug).then((res) => {
            secondWorkspaceId = res.body.organization_id;
            Cypress.env("workspaceId", secondWorkspaceId);
            Cypress.env("workspaceSlug", secondWsSlug);
            cy.log(
              `[gitSync] Second workspace: ${secondWsName} (${secondWorkspaceId})`,
            );
          });
          cy.then(() =>
            cy.apiLogin("dev@tooljet.io", "password", secondWorkspaceId),
          );
          cy.apiCreateWorkspaceConstant(
            CONSTANT_NAME,
            DS_BASE_URL,
            ["Global"],
            ["development", "staging", "production"],
          );
        }
      });

      cy.gitSyncCheckAndConfigure();

      cy.gitSyncGoToDashboard();
      cy.wait(3000);
      cy.get(GS.wsCurrentBranch, { timeout: 10000 }).should(
        "contain.text",
        "master",
      );

      // ── 4. Open create-app dropdown → click "Import from git repository"
      cy.get('[data-cy="import-dropdown-menu"]').click();
      cy.get('[data-cy="import-from-git-button"]').should("be.visible").click();

      // ── 5. Validate modal text and components
      // Modal title
      cy.contains("Import app from git repository").should("be.visible");

      // "Select branch" label + dropdown
      cy.get('[data-cy="select-branch-label"]')
        .should("be.visible")
        .and("contain.text", "Select branch");
      cy.get('[data-cy="branch-select"]').should("be.visible");

      // "Import app" button disabled until branch + app are selected
      cy.contains("button", "Import app").should("be.disabled");

      // ── 6. Select branch and app from the modal ───────────────────────────
      // react-select renders its options list into a document.body portal —
      // click the control to open, then select the option from .react-select__option
      cy.get('[data-cy="branch-select"] .react-select__control').click();
      cy.get(".react-select__option").contains(seededBranchName).click();

      // "Create app from" label + app dropdown appear after branch selection
      cy.get('[data-cy="create-app-from-label"]', { timeout: 10000 })
        .should("be.visible")
        .and("contain.text", "Create app from");
      cy.get('[data-cy="app-select"]').should("be.visible");

      // Select the app committed in Block 1
      cy.get('[data-cy="app-select"] .react-select__control').click();
      cy.get(".react-select__option").contains(seededAppName).click();

      // After app selection: validate remaining modal sections
      // App name label + input
      cy.get('[data-cy="app-name-label"]')
        .should("be.visible")
        .and("contain.text", "App name");
      cy.get('[data-cy="modal-body"] input.form-control').should(
        "have.value",
        seededAppName,
      );

      // "Make application editable" checkbox + helper text
      cy.contains("Make application editable").should("be.visible");
      cy.contains(
        "Enabling this allows editing and git sync push/pull access in development.",
      ).should("be.visible");

      // "Select version to pull from" label + dropdown
      cy.get('[data-cy="version-select-label"]')
        .should("be.visible")
        .and("contain.text", "Select version to pull from");
      cy.get('[data-cy="version-select"]').should("be.visible");

      // "Last commit" label + commit message present
      cy.get('[data-cy="last-commit-label"]')
        .should("be.visible")
        .and("contain.text", "Last commit");
      cy.get('[data-cy="last-commit-message"]', { timeout: 10000 }).should(
        "be.visible",
      );
      cy.get('[data-cy="auther-info"]').should("be.visible");

      // Cancel button present
      cy.contains("button", "Cancel").should("be.visible");

      // Import app button is now enabled
      cy.contains("button", "Import app").should("be.enabled");

      // ── 7. Click "Import app" → verify data in app editor ────────────────
      cy.contains("button", "Import app").click();

      // Wait for the import to complete and the app editor to load
      cy.url({ timeout: 30000 }).should("include", "/apps/");
      cy.waitForAppLoad();

      cy.get(GS.queryStatusWidget, { timeout: 20000 }).should(
        "contain.text",
        "Query completed",
      );
    });
  },
);
