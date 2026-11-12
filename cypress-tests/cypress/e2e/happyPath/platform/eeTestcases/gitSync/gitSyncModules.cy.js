import {
  setupGitSyncSpec,
  loginToGitSyncSpec,
  teardownGitSyncSpec,
  createAppOnBranchViaAPI,
  getAppOnBranchViaAPI,
  listAppsOnBranchViaAPI,
  pushAppViaAPI,
  mergeToDefaultAndPullViaAPI,
} from "Support/utils/platform/gitSync/gitSyncSeed";
import { createBranchViaAPI } from "Support/utils/platform/gitSync/workspaceBranch";
import { listGitResources } from "Support/utils/platform/gitSync/gitRepoReader";

// Modules sync like apps but live under modules/ in the repo
// (server/ee/app-git/shared/app-git-file-operations.util.ts MODULES_FOLDER).
describe("Git Sync — Modules", { retries: 0 }, () => {
  let ctx;

  before(() => {
    setupGitSyncSpec({ specKey: "modules", mode: "multi" }).then((c) => {
      ctx = c;
    });
  });

  beforeEach(() => {
    loginToGitSyncSpec(ctx);
  });

  after(() => {
    teardownGitSyncSpec();
  });

  it("should push a module under modules/ and bring it onto the default branch after merge and pull", () => {
    const moduleName = `mod-${Date.now()}`;
    createBranchViaAPI(`${ctx.prefix}-module`).then((branch) =>
      createAppOnBranchViaAPI(moduleName, branch.id, "module").then((created) =>
        getAppOnBranchViaAPI(created.id, branch.id)
          .then((module) =>
            pushAppViaAPI({
              appId: created.id,
              versionId: module.editing_version.id,
              appName: moduleName,
              branch,
              commitMessage: `feat: add module ${moduleName}`,
            }),
          )
          .then(() => listGitResources(branch.name))
          .then(({ modules, apps }) => {
            expect(modules, "module folder under modules/").to.include(moduleName);
            expect(apps, "not written under apps/").to.not.include(moduleName);
          })
          .then(() => mergeToDefaultAndPullViaAPI(ctx, branch))
          .then(() => listAppsOnBranchViaAPI(ctx.defaultBranch.id, "module"))
          .then((modules) => {
            expect(modules.map((m) => m.name), "module on default branch").to.include(moduleName);
          }),
      ),
    );
  });
});
