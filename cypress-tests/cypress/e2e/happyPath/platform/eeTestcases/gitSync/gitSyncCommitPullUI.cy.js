import { gitSyncSelectors as GS } from "Selectors/platform/gitSyncSelectors";
import { gitSyncText } from "Texts/platform/gitSync";
import {
  setupGitSyncSpec,
  loginToGitSyncSpec,
  teardownGitSyncSpec,
  createAppOnBranchViaAPI,
  getAppOnBranchViaAPI,
  importFixtureAppViaAPI,
  listAppsOnBranchViaAPI,
  pushAppViaAPI,
} from "Support/utils/platform/gitSync/gitSyncSeed";
import {
  createBranchViaAPI,
  getBranchViaAPI,
  pushWorkspaceViaAPI,
} from "Support/utils/platform/gitSync/workspaceBranch";
import {
  getBranchHeadViaAPI,
  mergeBranchViaAPI,
  waitForCommitMessageViaAPI,
} from "Support/utils/platform/gitSync/gitHubRepo";
import { listGitResources } from "Support/utils/platform/gitSync/gitRepoReader";
import { pollUntil } from "Support/utils/platform/gitSync/poll";
import {
  visitGitSyncPage,
  commitWorkspaceViaUI,
  pullWorkspaceViaUI,
  openAppFromDashboardViaUI,
} from "Support/utils/platform/gitSync/gitSyncUI";

const FIXTURE = "gitSync/fixture-app.json";
// The fixture's REST data source URL is {{constants.API_BASE_URL}}.
const API_BASE_URL = "https://jsonplaceholder.typicode.com";

// The user-facing loop: commit from the app builder, commit data sources from the
// data sources page, then merge on GitHub and pull on the default branch from the UI.
describe("Git Sync — Commit and Pull (UI)", { retries: 0 }, () => {
  let ctx;

  before(() => {
    setupGitSyncSpec({ specKey: "ui", mode: "multi" }).then((c) => {
      ctx = c;
      cy.apiCreateWorkspaceConstant(
        "API_BASE_URL",
        API_BASE_URL,
        ["Global"],
        ["development", "staging", "production"],
      );
    });
  });

  beforeEach(() => {
    loginToGitSyncSpec(ctx);
  });

  after(() => {
    teardownGitSyncSpec();
  });

  it("should commit an app from the app builder on a feature branch", () => {
    const appName = `ui-editor-${Date.now()}`;
    const message = `feat: editor commit ${appName}`;
    createBranchViaAPI(`${ctx.prefix}-editor`).then((branch) =>
      createAppOnBranchViaAPI(appName, branch.id).then(() => {
        openAppFromDashboardViaUI(ctx, branch.name, appName);
        // Commit enables before the modal's app-git config loads (catalogue F-02): wait for it.
        cy.intercept("GET", "**/api/app-git/*/app/*").as("appGitConfig");
        cy.get(GS.lifecycleCta).should("contain.text", "Commit").click();
        cy.wait("@appGitConfig").its("response.statusCode").should("eq", 200);
        cy.get(GS.commitMessageInput).should("be.visible").and("have.value", "");
        cy.get(GS.commitButton).should("be.disabled");
        cy.get(GS.commitMessageInput).type(message);
        cy.get(GS.commitButton).should("be.enabled").click();
        cy.contains(gitSyncText.editorPushSuccess).should("be.visible");
        waitForCommitMessageViaAPI(branch.name, message);
        listGitResources(branch.name).then(({ apps }) => {
          expect(apps, "app folder committed").to.include(appName);
        });
      }),
    );
  });

  it("should commit data sources from the data sources page", () => {
    const appName = `ui-ds-${Date.now()}`;
    const message = `feat: data sources ${appName}`;
    createBranchViaAPI(`${ctx.prefix}-ds`).then((branch) =>
      importFixtureAppViaAPI(FIXTURE, appName, branch.id).then(() => {
        visitGitSyncPage(ctx, { branch: branch.name, page: "data-sources" });
        // Commit only once the branch's data source list has rendered (catalogue F-10).
        // source: cypress/fixtures/gitSync/fixture-app.json (data source "restapi")
        cy.contains("restapi", { timeout: 30000 }).should("be.visible");
        commitWorkspaceViaUI(message);
        cy.contains(gitSyncText.workspacePushSuccess).should("be.visible");
        waitForCommitMessageViaAPI(branch.name, message);
        listGitResources(branch.name).then(({ dataSources }) => {
          expect(dataSources, "data source committed").to.include("restapi");
        });
      }),
    );
  });

  it("should pull merged changes on the default branch from the Pull modal and run the app", () => {
    const appName = `ui-pull-${Date.now()}`;
    createBranchViaAPI(`${ctx.prefix}-pull`).then((branch) =>
      importFixtureAppViaAPI(FIXTURE, appName, branch.id).then((appId) =>
        getAppOnBranchViaAPI(appId, branch.id)
          .then((app) =>
            pushAppViaAPI({
              appId,
              versionId: app.editing_version.id,
              appName,
              branch,
              commitMessage: `feat: add ${appName}`,
            }),
          )
          .then(() => pushWorkspaceViaAPI({ branchId: branch.id, commitMessage: `feat: ds ${appName}` }))
          .then(() => mergeBranchViaAPI(branch.name, ctx.baseBranch))
          .then(() => getBranchHeadViaAPI(ctx.baseBranch))
          .then((mergedHead) => {
            visitGitSyncPage(ctx, { branch: ctx.baseBranch });
            pullWorkspaceViaUI();
            cy.contains(gitSyncText.workspacePullStarted).should("be.visible");
            pollUntil(
              () => getBranchViaAPI(ctx.baseBranch),
              (b) => b?.lastSyncedCommit === mergedHead,
              { label: "UI pull finished" },
            );
            listAppsOnBranchViaAPI(ctx.defaultBranch.id).then((apps) => {
              expect(apps.map((a) => a.name), "app pulled onto default").to.include(appName);
            });
            openAppFromDashboardViaUI(ctx, ctx.baseBranch, appName);
            // A synced app on the locked default branch offers Pull commit, not Commit.
            // source: frontend/src/AppBuilder/Header/LifecycleCTAButton.jsx
            cy.get(GS.lifecycleCta).should("contain.text", "Pull commit");
            // source: cypress/fixtures/gitSync/fixture-app.json (query_status shows the query result)
            cy.get('[data-cy="draggable-widget-query_status"]', { timeout: 30000 }).should(
              "contain.text",
              "Query completed",
            );
          }),
      ),
    );
  });
});
