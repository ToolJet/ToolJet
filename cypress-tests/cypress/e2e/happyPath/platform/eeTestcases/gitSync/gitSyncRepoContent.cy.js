import {
  setupGitSyncSpec,
  loginToGitSyncSpec,
  teardownGitSyncSpec,
  importFixtureAppViaAPI,
  getAppOnBranchViaAPI,
  exportAppViaAPI,
  pushAppViaAPI,
  addAppToFolderViaAPI,
} from "Support/utils/platform/gitSync/gitSyncSeed";
import {
  createBranchViaAPI,
  pushWorkspaceViaAPI,
} from "Support/utils/platform/gitSync/workspaceBranch";
import { waitForCommitMessageViaAPI } from "Support/utils/platform/gitSync/gitHubRepo";
import {
  readResourceFromGit,
  readDataSourceFromGit,
} from "Support/utils/platform/gitSync/gitRepoReader";

// What a push writes to GitHub, compared against the app's own export.
// Layout source: server/ee/app-git/shared/app-git-file-operations.util.ts,
// server/ee/git-sync/data-source-fs.util.ts.
const FIXTURE = "gitSync/fixture-app.json";
// source: cypress/fixtures/gitSync/fixture-app.json (data source "restapi", url {{constants.API_BASE_URL}})
const FIXTURE_DS = "restapi";
const FIXTURE_DS_URL = "{{constants.API_BASE_URL}}";

describe("Git Sync — Repo Content", { retries: 0 }, () => {
  let ctx;

  // Branch + fixture app on it, pushed once. Yields everything a case needs.
  const seedFixtureOnBranch = (slug) => {
    const appName = `rc-${slug}-${Date.now()}`;
    return createBranchViaAPI(`${ctx.prefix}-${slug}`).then((branch) =>
      importFixtureAppViaAPI(FIXTURE, appName, branch.id).then((appId) =>
        getAppOnBranchViaAPI(appId, branch.id).then((app) => {
          const seeded = {
            branch,
            appName,
            appId,
            versionId: app.editing_version.id,
            coRelationId: app.co_relation_id,
          };
          return pushAppViaAPI({ ...seeded, commitMessage: `feat: add ${appName}` }).then(() => seeded);
        }),
      ),
    );
  };

  const push = (s, message) => pushAppViaAPI({ ...s, commitMessage: message });

  before(() => {
    setupGitSyncSpec({ specKey: "content", mode: "multi" }).then((c) => {
      ctx = c;
      cy.apiCreateWorkspaceConstant(
        "API_BASE_URL",
        "https://jsonplaceholder.typicode.com",
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

  it("should write app.json, components, pages, queries and schema matching the app, without timestamps", () => {
    seedFixtureOnBranch("tree").then((s) =>
      exportAppViaAPI(s.appId, s.versionId, s.branch.id).then((appV2) =>
        readResourceFromGit(s.branch.name, "app", s.appName).then(({ app, files }) => {
          expect(app.id, "app.json id is the co_relation_id").to.equal(s.coRelationId);
          const names = (list) => (list || []).map((x) => x.name).sort();
          expect(names(files.components), "components").to.deep.equal(names(appV2.components));
          expect((files.components || []).map((c) => c.type).sort(), "component types").to.deep.equal(
            appV2.components.map((c) => c.type).sort(),
          );
          expect(names(files.pages), "pages").to.deep.equal(names(appV2.pages));
          expect(names(files.queries), "queries").to.deep.equal(names(appV2.dataQueries));
          expect(files.schema?.[0], "schema.json").to.include.keys("multiPages", "multiEnv");

          const all = JSON.stringify(files);
          // source: server/src/modules/git-sync/AGENTS.md (files must not include these)
          ["created_at", "updated_at", "git_tree_sha", "createdAt", "updatedAt", "gitTreeSha"].forEach((key) => {
            expect(all, `no ${key}`).to.not.include(`"${key}"`);
          });
        }),
      ),
    );
  });

  it("should write the data source with every environment and keep constant references as-is", () => {
    seedFixtureOnBranch("ds").then((s) =>
      pushWorkspaceViaAPI({ branchId: s.branch.id, commitMessage: `feat: ds ${s.appName}` }).then(() =>
        readDataSourceFromGit(s.branch.name, FIXTURE_DS).then((ds) => {
          expect(ds, "data-sources/<name>/data-source.json").to.not.equal(null);
          expect(ds.kind).to.equal("restapi");
          expect(ds.options, "one block per environment").to.include.keys("development", "staging", "production");
          expect(JSON.stringify(ds.options.development), "constant reference kept").to.include(FIXTURE_DS_URL);
        }),
      ),
    );
  });

  it("should write a component layout change into the component file", () => {
    const layout = { top: 50, left: 5, width: 40, height: 300 };
    seedFixtureOnBranch("layout").then((s) =>
      exportAppViaAPI(s.appId, s.versionId, s.branch.id).then((appV2) => {
        const table = appV2.components.find((c) => c.type === "Table");
        cy.apiUpdateComponentLayout(s.appId, s.versionId, table.pageId, table.id, layout);
        push(s, `feat: layout ${s.appName}`);
        readResourceFromGit(s.branch.name, "app", s.appName).then(({ files }) => {
          const file = files.components.find((c) => c.name === table.name);
          const desktop = (file.layouts || []).find((l) => l.type === "desktop");
          expect(desktop, "desktop layout record").to.exist;
          expect(desktop, "desktop layout").to.include(layout);
        });
      }),
    );
  });

  it("should remove page, query and component files when they are deleted", () => {
    seedFixtureOnBranch("delete").then((s) =>
      exportAppViaAPI(s.appId, s.versionId, s.branch.id).then((appV2) => {
        const query = appV2.dataQueries[0];
        const component = appV2.components.find((c) => c.type === "Text");
        const extraPageId = crypto.randomUUID();
        cy.apiCreatePage(s.appId, s.versionId, "Extra", extraPageId, 1);
        push(s, `feat: extra page ${s.appName}`);
        readResourceFromGit(s.branch.name, "app", s.appName).then(({ files }) => {
          expect(files.pages.map((p) => p.name), "extra page committed").to.include("Extra");
        });

        cy.apiDeletePage(s.appId, s.versionId, extraPageId);
        cy.apiDeleteQuery(query.id, s.versionId);
        cy.apiDeleteComponent(s.appId, s.versionId, component.id, component.pageId);
        push(s, `chore: delete entities ${s.appName}`);
        readResourceFromGit(s.branch.name, "app", s.appName).then(({ files }) => {
          expect((files.pages || []).map((p) => p.name), "page file removed").to.not.include("Extra");
          expect((files.queries || []).map((q) => q.name), "query file removed").to.not.include(query.name);
          expect((files.components || []).map((c) => c.name), "component file removed").to.not.include(
            component.name,
          );
        });
      }),
    );
  });

  it("should write an app inside a folder under apps/<folder>/<app>", () => {
    const folderName = `rc-folder-${Date.now()}`;
    seedFixtureOnBranch("folder").then((s) =>
      cy.apiCreateFolder(folderName).then((folder) => {
        addAppToFolderViaAPI(folder.id, s.appId, s.branch.id);
        push(s, `feat: move ${s.appName} into ${folderName}`);
        waitForCommitMessageViaAPI(s.branch.name, folderName);
        readResourceFromGit(s.branch.name, "app", s.appName, { folder: folderName }).then((res) => {
          expect(res, "app under its folder").to.not.equal(null);
        });
        readResourceFromGit(s.branch.name, "app", s.appName).then((res) => {
          expect(res, "old root path removed").to.equal(null);
        });
      }),
    );
  });
});
