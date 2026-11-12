import { fake } from "Fixtures/fake";
import {
  setupGitSyncSpec,
  loginToGitSyncSpec,
  teardownGitSyncSpec,
  seedPushedAppViaAPI,
  mergeToDefaultAndPullViaAPI,
  listAppsOnBranchViaAPI,
} from "Support/utils/platform/gitSync/gitSyncSeed";
import { getGitSyncStatusViaAPI } from "Support/utils/platform/gitSync/gitSyncSetup";
import {
  createBranchViaAPI,
  listBranchesViaAPI,
} from "Support/utils/platform/gitSync/workspaceBranch";
import { readResourceFromGit } from "Support/utils/platform/gitSync/gitRepoReader";

// Fast gate for the suite (and for pr-qa): config, the background worker (branch jobs),
// push to GitHub, and the PR merge → pull round trip, all on an isolated base branch.
describe("Git Sync — Smoke", { retries: 0 }, () => {
  let ctx;

  before(() => {
    setupGitSyncSpec({ specKey: "smoke", mode: "multi" }).then((c) => {
      ctx = c;
    });
  });

  beforeEach(() => {
    loginToGitSyncSpec(ctx);
  });

  after(() => {
    teardownGitSyncSpec();
  });

  it("should configure git sync with the isolated base branch as default", () => {
    getGitSyncStatusViaAPI().then((status) => {
      expect(status.is_git_sync_configured, "configured").to.equal(true);
      expect(status.default_git_branch, "default branch").to.equal(ctx.baseBranch);
      expect(status.is_branching_enabled, "branching on").to.equal(true);
    });
    listBranchesViaAPI().then(({ branches, isMultiBranchingEnabled }) => {
      expect(isMultiBranchingEnabled, "multi-branch mode").to.equal(true);
      const defaults = branches.filter((b) => b.isDefault);
      expect(defaults.map((b) => b.name), "single default branch").to.deep.equal([ctx.baseBranch]);
    });
  });

  it("should create a feature branch once the background job finishes", () => {
    const name = `${ctx.prefix}-${fake.firstName.toLowerCase()}`;
    createBranchViaAPI(name).then((branch) => {
      expect(branch.name).to.equal(name);
      expect(branch.isDefault, "feature branch is not default").to.equal(false);
    });
  });

  it("should push an app from a feature branch and write app/app.json to GitHub", () => {
    const appName = `smoke-push-${Date.now()}`;
    createBranchViaAPI(`${ctx.prefix}-push`).then((branch) =>
      seedPushedAppViaAPI({ branch, appName }).then(({ coRelationId }) =>
        readResourceFromGit(branch.name, "app", appName).then((resource) => {
          expect(resource, "app folder in git").to.not.equal(null);
          expect(resource.app.id, "app.json id is the co_relation_id").to.equal(coRelationId);
        }),
      ),
    );
  });

  it("should bring a merged app onto the default branch after pull", () => {
    const appName = `smoke-merge-${Date.now()}`;
    createBranchViaAPI(`${ctx.prefix}-merge`).then((branch) =>
      seedPushedAppViaAPI({ branch, appName })
        .then(() => mergeToDefaultAndPullViaAPI(ctx, branch))
        .then(() => listAppsOnBranchViaAPI(ctx.defaultBranch.id))
        .then((apps) => {
          expect(apps.map((a) => a.name), "app on default branch").to.include(appName);
        }),
    );
  });
});
