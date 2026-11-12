import {
  setupGitSyncSpec,
  loginToGitSyncSpec,
  teardownGitSyncSpec,
  getAppOnBranchViaAPI,
  listAppsOnBranchViaAPI,
  seedPushedAppViaAPI,
  pushAppViaAPI,
  mergeToDefaultAndPullViaAPI,
  attemptRenameAppViaAPI,
  deleteAppOnBranchViaAPI,
  waitForAppOnBranchViaAPI,
} from "Support/utils/platform/gitSync/gitSyncSeed";
import {
  createBranchViaAPI,
  pullWorkspaceViaAPI,
} from "Support/utils/platform/gitSync/workspaceBranch";
import { listGitResources } from "Support/utils/platform/gitSync/gitRepoReader";
import { pollUntil } from "Support/utils/platform/gitSync/poll";

// Branch → push → GitHub PR merge → pull, for the changes a team makes most:
// add, rename and delete an app, two branches merged in turn, and a second workspace.
describe("Git Sync — Push and Pull", { retries: 0 }, () => {
  let ctx;

  before(() => {
    setupGitSyncSpec({ specKey: "pushpull", mode: "multi" }).then((c) => {
      ctx = c;
    });
  });

  beforeEach(() => {
    loginToGitSyncSpec(ctx);
  });

  after(() => {
    teardownGitSyncSpec();
  });

  it("should merge two branches one after another and keep both apps on default", () => {
    const appA = `pp-seq-a-${Date.now()}`;
    const appB = `pp-seq-b-${Date.now()}`;
    createBranchViaAPI(`${ctx.prefix}-seq-a`).then((branchA) =>
      createBranchViaAPI(`${ctx.prefix}-seq-b`).then((branchB) =>
        seedPushedAppViaAPI({ branch: branchA, appName: appA })
          .then(() => seedPushedAppViaAPI({ branch: branchB, appName: appB }))
          .then(() => mergeToDefaultAndPullViaAPI(ctx, branchA))
          .then(() => mergeToDefaultAndPullViaAPI(ctx, branchB))
          .then(() => listAppsOnBranchViaAPI(ctx.defaultBranch.id))
          .then((apps) => {
            const names = apps.map((a) => a.name);
            expect(names, "first merged app").to.include(appA);
            expect(names, "second merged app").to.include(appB);
          }),
      ),
    );
  });

  it("should show only the new name on default after a rename is merged", () => {
    const appName = `pp-rename-${Date.now()}`;
    const renamed = `${appName}-renamed`;
    createBranchViaAPI(`${ctx.prefix}-rename`).then((branch) =>
      seedPushedAppViaAPI({ branch, appName })
        .then(() => mergeToDefaultAndPullViaAPI(ctx, branch))
        .then(() => createBranchViaAPI(`${ctx.prefix}-rename-2`))
        .then((branch2) =>
          waitForAppOnBranchViaAPI(branch2.id, appName).then((app) =>
            getAppOnBranchViaAPI(app.id, branch2.id).then((onBranch) =>
              attemptRenameAppViaAPI(app.id, renamed, branch2.id, onBranch.editing_version.id)
                .then((res) => expect(res.status, "rename on feature branch").to.be.oneOf([200, 204]))
                .then(() =>
                  pushAppViaAPI({
                    appId: app.id,
                    versionId: onBranch.editing_version.id,
                    appName: renamed,
                    branch: branch2,
                    commitMessage: `feat: rename to ${renamed}`,
                  }),
                )
                .then(() => mergeToDefaultAndPullViaAPI(ctx, branch2))
                .then(() => listAppsOnBranchViaAPI(ctx.defaultBranch.id))
                .then((defaultApps) => {
                  const names = defaultApps.map((a) => a.name);
                  expect(names, "renamed app on default").to.include(renamed);
                  expect(names, "old name gone from default").to.not.include(appName);
                }),
            ),
          ),
        ),
    );
  });

  it("should remove an app from default after its deletion on a branch is merged", () => {
    const appName = `pp-delete-${Date.now()}`;
    createBranchViaAPI(`${ctx.prefix}-del`).then((branch) =>
      seedPushedAppViaAPI({ branch, appName })
        .then(() => mergeToDefaultAndPullViaAPI(ctx, branch))
        .then(() => createBranchViaAPI(`${ctx.prefix}-del-2`))
        .then((branch2) =>
          waitForAppOnBranchViaAPI(branch2.id, appName).then((app) => {
            deleteAppOnBranchViaAPI(app.id, branch2.id);
            // The deletion is committed by a queued job (server/ee/workspace-branches/deletion-commit.listener.ts).
            pollUntil(
              () => listGitResources(branch2.name),
              ({ apps: dirs }) => !dirs.includes(appName),
              { label: `${appName} removed from ${branch2.name}` },
            );
            mergeToDefaultAndPullViaAPI(ctx, branch2);
            listAppsOnBranchViaAPI(ctx.defaultBranch.id).then((defaultApps) => {
              expect(defaultApps.map((a) => a.name), "app gone from default").to.not.include(appName);
            });
          }),
        ),
    );
  });

  it("should pull a merged app into a second workspace connected to the same branch", () => {
    const appName = `pp-second-${Date.now()}`;
    createBranchViaAPI(`${ctx.prefix}-second`).then((branch) =>
      seedPushedAppViaAPI({ branch, appName })
        .then(() => mergeToDefaultAndPullViaAPI(ctx, branch))
        .then(() => setupGitSyncSpec({ specKey: "pp2", baseBranch: ctx.baseBranch }))
        .then((second) =>
          pullWorkspaceViaAPI(second.defaultBranch)
            .then(() => listAppsOnBranchViaAPI(second.defaultBranch.id))
            .then((apps) => {
              expect(apps.map((a) => a.name), "app in second workspace").to.include(appName);
            }),
        ),
    );
  });
});
