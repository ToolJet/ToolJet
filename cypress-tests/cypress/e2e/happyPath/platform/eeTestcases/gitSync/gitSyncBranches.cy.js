import { gitSyncSelectors as GS } from "Selectors/platform/gitSyncSelectors";
import { gitSyncText } from "Texts/platform/gitSync";
import {
  setupGitSyncSpec,
  loginToGitSyncSpec,
  teardownGitSyncSpec,
  createAppOnBranchViaAPI,
  listAppsOnBranchViaAPI,
} from "Support/utils/platform/gitSync/gitSyncSeed";
import {
  attemptCreateBranchViaAPI,
  createBranchViaAPI,
  deleteBranchViaAPI,
  getBranchViaAPI,
} from "Support/utils/platform/gitSync/workspaceBranch";
import {
  createRemoteBranchViaAPI,
  getBranchHeadViaAPI,
  waitForRemoteBranchViaAPI,
} from "Support/utils/platform/gitSync/gitHubRepo";
import { pollUntil } from "Support/utils/platform/gitSync/poll";
import {
  visitGitSyncPage,
  fillCreateBranchViaUI,
  switchBranchViaUI,
} from "Support/utils/platform/gitSync/gitSyncUI";

describe("Git Sync — Branches", { retries: 0 }, () => {
  let ctx;

  before(() => {
    setupGitSyncSpec({ specKey: "branch", mode: "multi" }).then((c) => {
      ctx = c;
    });
  });

  beforeEach(() => {
    loginToGitSyncSpec(ctx);
  });

  after(() => {
    teardownGitSyncSpec();
  });

  it("should create a branch from the dashboard and list it once ready", () => {
    const name = `${ctx.prefix}-ui-create`;
    visitGitSyncPage(ctx, { branch: ctx.baseBranch });
    fillCreateBranchViaUI(name);
    cy.get(GS.createBranchButton).should("be.enabled").click();
    cy.contains(gitSyncText.branchCreating).should("be.visible");

    waitForRemoteBranchViaAPI(name);
    pollUntil(() => getBranchViaAPI(name), (b) => !!b, { label: `${name} listed` }).then(
      (branch) => {
        expect(branch.isDefault, "new branch is not default").to.equal(false);
        expect(branch.sourceBranchId, "created from the default branch").to.equal(
          ctx.defaultBranch.id,
        );
      },
    );
  });

  it("should create the GitHub branch from the default branch head", () => {
    const name = `${ctx.prefix}-from-default`;
    getBranchHeadViaAPI(ctx.baseBranch).then((baseHead) =>
      createBranchViaAPI(name).then(() =>
        getBranchHeadViaAPI(name).then((head) => {
          expect(head, "new branch starts at the default branch head").to.equal(baseHead);
        }),
      ),
    );
  });

  it("should switch branches from the dashboard and keep the branch across a reload", () => {
    const name = `${ctx.prefix}-switch`;
    createBranchViaAPI(name);
    visitGitSyncPage(ctx, { branch: ctx.baseBranch });
    switchBranchViaUI(name);
    cy.contains(gitSyncText.switchedTo(name)).should("be.visible");
    cy.get(GS.wsCurrentBranch).should("contain.text", name);
    cy.url().should("include", `branch=${encodeURIComponent(name)}`);
    cy.reload();
    cy.get(GS.wsCurrentBranch, { timeout: 30000 }).should("contain.text", name);
  });

  it("should show the lock banner on the default branch and drop it on a feature branch", () => {
    visitGitSyncPage(ctx, { branch: ctx.baseBranch });
    // source: frontend/src/AppBuilder/Header/LockedBranchBanner.jsx
    cy.get(GS.lockedBanner).should("be.visible").and("contain.text", gitSyncText.lockBanner(ctx.baseBranch, "apps"));
    cy.get(GS.wsCommitButton).should("not.exist");

    const name = `${ctx.prefix}-unlocked`;
    createBranchViaAPI(name);
    visitGitSyncPage(ctx, { branch: name });
    cy.get(GS.wsCurrentBranch).should("contain.text", name);
    cy.get(GS.lockedBanner).should("not.exist");
    cy.get(GS.wsPullButton).should("be.visible");
  });

  it("should import a branch that exists only on GitHub after confirmation", () => {
    const name = `${ctx.prefix}-remote-only`;
    createRemoteBranchViaAPI(name, ctx.baseBranch);

    attemptCreateBranchViaAPI(name).then((res) => {
      expect(res.status).to.equal(409);
      // source: server/ee/workspace-branches/service.ts (needsImportConfirmation)
      expect(JSON.parse(res.body.message)).to.deep.equal({ needsImportConfirmation: true, name });
    });

    createBranchViaAPI(name, { confirmImport: true }).then((branch) => {
      expect(branch.name).to.equal(name);
    });
  });

  it("should keep apps isolated between two feature branches before merge", () => {
    const appA = `iso-a-${Date.now()}`;
    const appB = `iso-b-${Date.now()}`;
    createBranchViaAPI(`${ctx.prefix}-iso-a`).then((branchA) =>
      createBranchViaAPI(`${ctx.prefix}-iso-b`).then((branchB) => {
        createAppOnBranchViaAPI(appA, branchA.id);
        createAppOnBranchViaAPI(appB, branchB.id);
        listAppsOnBranchViaAPI(branchA.id).then((apps) => {
          const names = apps.map((a) => a.name);
          expect(names, "branch A has app A").to.include(appA);
          expect(names, "branch A lacks app B").to.not.include(appB);
        });
        listAppsOnBranchViaAPI(branchB.id).then((apps) => {
          const names = apps.map((a) => a.name);
          expect(names, "branch B has app B").to.include(appB);
          expect(names, "branch B lacks app A").to.not.include(appA);
        });
      }),
    );
  });

  it("should delete a feature branch in ToolJet and on GitHub", () => {
    createBranchViaAPI(`${ctx.prefix}-delete`).then((branch) => deleteBranchViaAPI(branch));
  });
});
