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
  mergeToDefaultAndPullViaAPI,
  getDataSourceOnBranchViaAPI,
  updateDataSourceOnBranchViaAPI,
} from "Support/utils/platform/gitSync/gitSyncSeed";
import {
  createBranchViaAPI,
  getBranchViaAPI,
  pushWorkspaceViaAPI,
} from "Support/utils/platform/gitSync/workspaceBranch";
import {
  getBranchHeadViaAPI,
  getTreeShaViaAPI,
  mergeBranchViaAPI,
  waitForCommitMessageViaAPI,
} from "Support/utils/platform/gitSync/gitHubRepo";
import { listGitResources, readDataSourceFromGit } from "Support/utils/platform/gitSync/gitRepoReader";
import { getVersionSyncStateViaDB } from "Support/utils/platform/gitSync/gitSyncDb";
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
    const stagingUrl = `${API_BASE_URL}/staging-${Date.now()}`;
    createBranchViaAPI(`${ctx.prefix}-ds`).then((branch) =>
      importFixtureAppViaAPI(FIXTURE, appName, branch.id).then(() => {
        updateDataSourceOnBranchViaAPI({
          name: "restapi",
          branchId: branch.id,
          envName: "staging",
          values: { url: stagingUrl },
        });
        visitGitSyncPage(ctx, { branch: branch.name, page: "data-sources" });
        // Commit only after the data source list renders (catalogue F-10).
        cy.contains("restapi", { timeout: 30000 }).should("be.visible");
        commitWorkspaceViaUI(message);
        cy.contains(gitSyncText.workspacePushSuccess).should("be.visible");
        waitForCommitMessageViaAPI(branch.name, message);
        listGitResources(branch.name).then(({ dataSources }) => {
          expect(dataSources, "data source committed").to.include("restapi");
        });
        // source: server/ee/git-sync/workspace-git-sync-adapter.ts:683-698 (options keyed by environment name)
        readDataSourceFromGit(branch.name, "restapi").then((ds) => {
          expect(JSON.stringify(ds.options.staging), "staging option committed").to.include(stagingUrl);
          expect(JSON.stringify(ds.options.development), "development option untouched").to.not.include(stagingUrl);
        });

        mergeToDefaultAndPullViaAPI(ctx, branch);
        readDataSourceFromGit(ctx.baseBranch, "restapi").then((ds) => {
          expect(JSON.stringify(ds.options.staging), "staging option merged").to.include(stagingUrl);
        });
        getDataSourceOnBranchViaAPI("restapi", ctx.defaultBranch.id, "staging").then((ds) => {
          expect(ds.options?.url?.value, "staging url pulled onto default").to.equal(stagingUrl);
        });
        getDataSourceOnBranchViaAPI("restapi", ctx.defaultBranch.id, "development").then((ds) => {
          expect(ds.options?.url?.value, "development url unchanged on default").to.not.equal(stagingUrl);
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
            ).then((pulled) => {
              // Category tree SHAs are stored on pull and must equal GitHub's tree SHAs.
              getTreeShaViaAPI(ctx.baseBranch, "apps").then((sha) => {
                expect(pulled.appsGitTreeSha, "appsGitTreeSha = GitHub apps/ tree").to.equal(sha);
              });
              getTreeShaViaAPI(ctx.baseBranch, "data-sources").then((sha) => {
                expect(pulled.dataSourcesGitTreeSha, "dataSourcesGitTreeSha = GitHub data-sources/ tree").to.equal(sha);
              });
            });
            listAppsOnBranchViaAPI(ctx.defaultBranch.id).then((apps) => {
              expect(apps.map((a) => a.name), "app pulled onto default").to.include(appName);
            });
            // A first-time pulled app is a lazy stub row until it is opened in the editor.
            getTreeShaViaAPI(ctx.baseBranch, `apps/${appName}`).then((appTreeSha) => {
              expect(appTreeSha, `apps/${appName} on GitHub`).to.be.a("string");
              getVersionSyncStateViaDB({ appId, branchId: ctx.defaultBranch.id }).then((rows) => {
                expect(rows, "pulled version rows on default").to.not.be.empty;
                rows.forEach((row) => {
                  expect(row.isStub, "stub before the app is opened").to.equal(true);
                  expect(row.isSynced, "stub is synced").to.equal(true);
                  expect(row.gitTreeSha, "stub git_tree_sha = GitHub apps/<name> tree").to.equal(appTreeSha);
                });
              });
              cy.wrap(appTreeSha, { log: false }).as("appTreeSha");
            });
            openAppFromDashboardViaUI(ctx, ctx.baseBranch, appName);
            // A synced app on the locked default offers Pull commit, not Commit (LifecycleCTAButton.jsx).
            cy.get(GS.lifecycleCta).should("contain.text", "Pull commit");
            // source: cypress/fixtures/gitSync/fixture-app.json (query_status shows the query result)
            cy.get('[data-cy="draggable-widget-query_status"]', { timeout: 30000 }).should(
              "contain.text",
              "Query completed",
            );
            // Opening the app hydrates the stub; the change token stays the app's tree SHA.
            cy.get("@appTreeSha").then((appTreeSha) =>
              pollUntil(
                () => getVersionSyncStateViaDB({ appId, branchId: ctx.defaultBranch.id }),
                (rows) => rows.length > 0 && rows.every((r) => r.isStub === false),
                { label: `${appName} hydrated on default` },
              ).then((rows) => {
                rows.forEach((row) => {
                  expect(row.isSynced, "hydrated version is synced").to.equal(true);
                  expect(row.gitTreeSha, "hydrated git_tree_sha = GitHub apps/<name> tree").to.equal(appTreeSha);
                });
              }),
            );

            // No new commits: the server skips the pull and the modal says so.
            cy.intercept("POST", "**/api/workspace-branches/pull").as("pullAgain");
            visitGitSyncPage(ctx, { branch: ctx.baseBranch });
            pullWorkspaceViaUI();
            cy.wait("@pullAgain").its("response.body.upToDate").should("eq", true);
            cy.contains(gitSyncText.workspacePullUpToDate(ctx.baseBranch)).should("be.visible");
            getBranchViaAPI(ctx.baseBranch).then((b) => {
              expect(b.lastSyncedCommit, "lastSyncedCommit unchanged").to.equal(mergedHead);
            });
          }),
      ),
    );
  });
});
