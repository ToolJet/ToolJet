import {
  setupGitSyncSpec,
  loginToGitSyncSpec,
  teardownGitSyncSpec,
  createAppOnBranchViaAPI,
  getAppOnBranchViaAPI,
  listAppsOnBranchViaAPI,
  pushAppViaAPI,
  mergeToDefaultAndPullViaAPI,
  waitForAppOnBranchViaAPI,
  attemptRenameAppViaAPI,
  deleteAppOnBranchViaAPI,
} from "Support/utils/platform/gitSync/gitSyncSeed";
import { createBranchViaAPI } from "Support/utils/platform/gitSync/workspaceBranch";
import { listGitResources } from "Support/utils/platform/gitSync/gitRepoReader";
import { pollUntil } from "Support/utils/platform/gitSync/poll";
import { visitGitSyncPage } from "Support/utils/platform/gitSync/gitSyncUI";

const CARD = '[data-cy$="-card"]';

// Modules sync like apps but live under modules/ in the repo.
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

  // Module created + pushed on its own branch, merged and pulled onto default.
  const seedModuleOnDefault = (slug, moduleName) =>
    createBranchViaAPI(`${ctx.prefix}-${slug}`).then((branch) =>
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
          .then(() => mergeToDefaultAndPullViaAPI(ctx, branch)),
      ),
    );

  // Visit the default branch's Modules page once its list has loaded.
  const visitModulesOnDefault = () => {
    // source: frontend/src/_services/app.service.js:42 (dashboard list request)
    cy.intercept("GET", "**/api/apps?page=*").as("dashboardList");
    visitGitSyncPage(ctx, { branch: ctx.baseBranch, page: "modules" });
    cy.wait("@dashboardList");
  };

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

  it("should show only the new module name on default after a rename on a branch is merged and pulled", () => {
    const stamp = Date.now();
    const oldName = `mod-old-${stamp}`;
    const newName = `mod-new-${stamp}`;
    seedModuleOnDefault("mod-ren", oldName)
      .then(() => createBranchViaAPI(`${ctx.prefix}-mod-ren-2`))
      .then((branch2) =>
        waitForAppOnBranchViaAPI(branch2.id, oldName, "module").then((module) =>
          getAppOnBranchViaAPI(module.id, branch2.id).then((onBranch) =>
            attemptRenameAppViaAPI(module.id, newName, branch2.id, onBranch.editing_version.id)
              .then((res) => expect(res.status, "rename module on feature branch").to.be.oneOf([200, 204]))
              .then(() =>
                pushAppViaAPI({
                  appId: module.id,
                  versionId: onBranch.editing_version.id,
                  appName: newName,
                  branch: branch2,
                  commitMessage: `feat: rename module to ${newName}`,
                }),
              )
              .then(() => listGitResources(branch2.name))
              .then(({ modules }) => {
                expect(modules, "renamed module folder on the branch").to.include(newName);
                expect(modules, "old module folder gone from the branch").to.not.include(oldName);
              })
              .then(() => mergeToDefaultAndPullViaAPI(ctx, branch2)),
          ),
        ),
      )
      .then(() => listGitResources(ctx.baseBranch))
      .then(({ modules }) => {
        expect(modules, "modules/<new> on default").to.include(newName);
        expect(modules, "modules/<old> gone from default").to.not.include(oldName);
      })
      .then(() => listAppsOnBranchViaAPI(ctx.defaultBranch.id, "module"))
      .then((modules) => {
        const names = modules.map((m) => m.name);
        expect(names, "renamed module on default").to.include(newName);
        expect(names, "old module name gone from default").to.not.include(oldName);
      });

    visitModulesOnDefault();
    cy.contains(CARD, newName, { timeout: 30000 }).should("be.visible");
    cy.contains(CARD, oldName).should("not.exist");
  });

  it("should remove a module from default after its deletion on a branch is merged and pulled", () => {
    const moduleName = `mod-del-${Date.now()}`;
    seedModuleOnDefault("mod-del", moduleName)
      .then(() => createBranchViaAPI(`${ctx.prefix}-mod-del-2`))
      .then((branch2) =>
        waitForAppOnBranchViaAPI(branch2.id, moduleName, "module").then((module) => {
          deleteAppOnBranchViaAPI(module.id, branch2.id);
          // The deletion is committed by a queued job (server/ee/workspace-branches/deletion-commit.listener.ts).
          pollUntil(
            () => listGitResources(branch2.name),
            ({ modules }) => !modules.includes(moduleName),
            { label: `${moduleName} removed from ${branch2.name}` },
          );
          mergeToDefaultAndPullViaAPI(ctx, branch2);
        }),
      )
      .then(() => listGitResources(ctx.baseBranch))
      .then(({ modules }) => {
        expect(modules, "module folder gone from default").to.not.include(moduleName);
      })
      .then(() => listAppsOnBranchViaAPI(ctx.defaultBranch.id, "module"))
      .then((modules) => {
        expect(modules.map((m) => m.name), "module gone from default").to.not.include(moduleName);
      });

    visitModulesOnDefault();
    cy.contains(CARD, moduleName).should("not.exist");
  });
});
