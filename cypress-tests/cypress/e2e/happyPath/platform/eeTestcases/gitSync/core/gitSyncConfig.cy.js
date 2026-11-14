import {
  createPlainWorkspaceViaAPI,
  loginToGitSyncSpec,
  setupGitSyncSpec,
  teardownGitSyncSpec,
} from "Support/utils/platform/gitSync/gitSyncSeed";
import {
  attemptTestConnectionViaAPI,
  getGitSyncStatusViaAPI,
  githubConfigPayload,
  setBranchingViaAPI,
} from "Support/utils/platform/gitSync/gitSyncSetup";
import {
  fillGithubConfigViaUI,
  openGithubConfigModal,
} from "Support/utils/platform/gitSync/gitSyncUI";
import { pollUntil } from "Support/utils/platform/gitSync/poll";
import { listBranchesViaAPI } from "Support/utils/platform/gitSync/workspaceBranch";
import { gitSyncText } from "Texts/platform/gitSync";

const SAVE = '[data-cy="save-config-button"]';
const TEST_CONNECTION = '[data-cy="test-connection-button"]';
const DELETE_CONFIG = '[data-cy="delete-config-button"]';
const GITHUB_TOGGLE = '[data-cy="github-toggle"]';

describe("Git Sync — Configuration", () => {
  let ctx;

  beforeEach(() => {
    setupGitSyncSpec({ specKey: "config", mode: "multi" }).then((c) => {
      ctx = c;
    });
  });

  beforeEach(() => {
    loginToGitSyncSpec(ctx);
  });

  afterEach(() => {
    teardownGitSyncSpec();
  });

  it("should connect to GitHub from the configure git page, enable the provider and seed the default branch", () => {
    createPlainWorkspaceViaAPI("cfg-save").then((ws) => {
      openGithubConfigModal(ws);
      fillGithubConfigViaUI(githubConfigPayload(ctx.baseBranch));
      cy.get(TEST_CONNECTION).click();
      cy.contains(gitSyncText.testConnectionVerified).should("be.visible");
      cy.get(SAVE).should("be.enabled").click();
      cy.get(SAVE).should("not.exist");
      cy.get(GITHUB_TOGGLE).should("be.checked");

      getGitSyncStatusViaAPI().then((status) => {
        expect(status.is_git_sync_configured, "configured").to.equal(true);
        expect(status.default_git_branch, "default branch").to.equal(ctx.baseBranch);
      });

      openGithubConfigModal(ws);
      cy.get('input[placeholder="Enter HTTPS repo URL"]').should(
        "have.value",
        githubConfigPayload(ctx.baseBranch).gitUrl,
      );
      cy.get('input[placeholder="Enter Branch Name"]').should("have.value", ctx.baseBranch);

      // A new connection starts in single-branch mode; enabling branching flips it.
      listBranchesViaAPI().then(({ isMultiBranchingEnabled }) => {
        expect(isMultiBranchingEnabled, "new config is single-branch").to.equal(false);
      });
      getGitSyncStatusViaAPI().then((status) => setBranchingViaAPI(status.id, true));
      listBranchesViaAPI().then(({ isMultiBranchingEnabled }) => {
        expect(isMultiBranchingEnabled, "branching enabled").to.equal(true);
      });
    });
  });

  it("should verify the connection for valid GitHub App credentials", () => {
    attemptTestConnectionViaAPI(githubConfigPayload(ctx.baseBranch)).then((res) => {
      expect(res.status, JSON.stringify(res.body)).to.be.oneOf([200, 201]);
    });
  });

  it("should reject a wrong installation id without echoing the private key", () => {
    attemptTestConnectionViaAPI(
      githubConfigPayload(ctx.baseBranch, { githubAppInstallationId: "1" }),
    ).then((res) => {
      expect(res.status).to.equal(400);
      expect(res.body.message, "error message").to.be.a("string").and.not.be.empty;
      expect(JSON.stringify(res.body), "no private key in error").to.not.include("PRIVATE KEY");
    });
  });

  it("should not return the private key from the config API", () => {
    cy.getAuthHeaders().then((headers) =>
      cy
        .request({
          method: "GET",
          url: `${Cypress.env("server_host")}/api/git-sync/${ctx.workspaceId}?gitType=github_https`,
          headers,
        })
        .then((res) => {
          expect(res.status).to.equal(200);
          expect(JSON.stringify(res.body), "no PEM in response").to.not.include("PRIVATE KEY");
        }),
    );
  });

  it("should expose only the default branch while branching is turned off", () => {
    setBranchingViaAPI(ctx.orgGitId, false);
    listBranchesViaAPI().then(({ branches, isMultiBranchingEnabled }) => {
      expect(isMultiBranchingEnabled, "single-branch mode").to.equal(false);
      expect(branches.map((b) => b.name), "default only").to.deep.equal([ctx.baseBranch]);
    });
    setBranchingViaAPI(ctx.orgGitId, true);
    listBranchesViaAPI().then(({ isMultiBranchingEnabled }) => {
      expect(isMultiBranchingEnabled, "multi-branch mode restored").to.equal(true);
    });
  });

  it("should delete the config from the configure git page", () => {
    setupGitSyncSpec({ specKey: "cfg-del", baseBranch: ctx.baseBranch }).then((ws) => {
      openGithubConfigModal(ws);
      cy.get(DELETE_CONFIG).click();
      cy.get('[data-cy="yes-button"]').click();
      cy.contains(gitSyncText.configDeleted).should("be.visible");
      cy.get(GITHUB_TOGGLE).should("not.be.checked");
      pollUntil(
        () => getGitSyncStatusViaAPI(),
        (status) => !status?.is_git_sync_configured,
        { label: "config removed" },
      );
    });
  });
});
