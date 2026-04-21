import { gitSyncSelectors as GS } from "Selectors/platform/gitsync";
import {
  apiConfigureGitSync,
  apiDeleteGitSync,
} from "Support/utils/platform/apiUtils/gitSyncApi";

Cypress.Commands.add("apiConfigureGitSync", (config) =>
  apiConfigureGitSync(config),
);
Cypress.Commands.add("apiDeleteGitSync", (orgId) => apiDeleteGitSync(orgId));

Cypress.Commands.add("gitSyncCheckAndConfigure", () => {
  return cy.getAuthHeaders().then((headers) => {
    const orgId = Cypress.env("workspaceId");

    return cy
      .request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/git-sync/${orgId}/status`,
        headers,
        failOnStatusCode: false,
      })
      .then((res) => {
        const isConfigured =
          res.status === 200 && res.body?.is_finalized && res.body?.is_enabled;

        if (isConfigured) {
          Cypress.log({
            message:
              "[gitSync] Already configured and enabled — skipping setup",
          });
          return;
        }

        Cypress.log({
          message:
            "[gitSync] Not configured — setting up GitHub HTTPS git sync via API",
        });

        const privateKey = Cypress.env("GITHUB_PRIVATE_KEY");

        return cy
          .request({
            method: "POST",
            url: `${Cypress.env("server_host")}/api/git-sync/configs`,
            headers,
            body: {
              gitUrl: Cypress.env("GITHUB_REPO_URL"),
              branchName: "master",
              githubEnterpriseUrl: "",
              githubEnterpriseApiUrl: "",
              githubAppId: Cypress.env("GITHUB_APP_ID"),
              githubAppInstallationId: Cypress.env(
                "GITHUB_APP_INSTALLATION_ID",
              ),
              githubAppPrivateKey: privateKey,
              useEnvConfig: false,
              gitType: "github_https",
            },
          })
          .then((configRes) => {
            expect(configRes.status, "Git sync config").to.equal(201);
            Cypress.log({
              message: "[gitSync] GitHub HTTPS configured and enabled",
            });
          });
      });
  });
});

Cypress.Commands.add("gitSyncGetBranchId", (branchName) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/workspace-branches`,
        headers,
      })
      .then((res) => {
        const branches = Array.isArray(res.body)
          ? res.body
          : res.body?.branches || [];
        const branch = branches.find((b) => b?.name === branchName);
        return branch?.id || "";
      });
  });
});

Cypress.Commands.add("gitSyncCreateBranchViaApi", (branchName) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/workspace-branches`,
        headers,
      })
      .then((res) => {
        const branches = Array.isArray(res.body)
          ? res.body
          : res.body?.branches || [];
        const exists = branches.some((b) => b?.name === branchName);

        if (exists) {
          Cypress.log({
            message: `[gitSync] Branch '${branchName}' already exists`,
          });
          return;
        }

        return cy
          .request({
            method: "POST",
            url: `${Cypress.env("server_host")}/api/workspace-branches`,
            headers,
            body: { name: branchName },
          })
          .then((branchRes) => {
            expect(branchRes.status, `Create branch '${branchName}'`).to.equal(
              201,
            );
            Cypress.log({
              message: `[gitSync] Branch '${branchName}' created`,
            });
          });
      });
  });
});

Cypress.Commands.add(
  "gitSyncImportAppFromFixture",
  (fixturePath, appName, branchName) => {
    return cy.getAuthHeaders().then((headers) => {
      const orgId = Cypress.env("workspaceId");

      return cy
        .request({
          method: "GET",
          url: `${Cypress.env("server_host")}/api/workspace-branches`,
          headers,
        })
        .then((branchRes) => {
          const branches = Array.isArray(branchRes.body)
            ? branchRes.body
            : branchRes.body?.branches || [];
          const branch = branches.find((b) => b?.name === branchName);
          const branchId = branch?.id || "";

          return cy.fixture(fixturePath).then((fixtureData) => {
            fixtureData.organization_id = orgId;

            // Override app name in fixture
            fixtureData.app = (fixtureData.app || []).map((app) => ({
              ...app,
              appName,
              definition: app.definition?.appV2
                ? {
                    ...app.definition,
                    appV2: { ...app.definition.appV2, name: appName },
                  }
                : app.definition,
            }));

            if (branchId) fixtureData.branchId = branchId;

            return cy
              .request({
                method: "POST",
                url: `${Cypress.env("server_host")}/api/v2/resources/import`,
                headers: {
                  tj_auth_token: headers.Cookie.replace("tj_auth_token=", ""),
                  "tj-workspace-id": orgId,
                },
                body: fixtureData,
              })
              .then((importRes) => {
                expect(importRes.status, `Import app '${appName}'`).to.equal(
                  201,
                );
                const appId = importRes.body?.imports?.app?.[0]?.id;
                Cypress.env("appId", appId);
                Cypress.log({
                  message: `[gitSync] App '${appName}' imported to branch '${branchName}' (id: ${appId})`,
                });
                return appId;
              });
          });
        });
    });
  },
);

Cypress.Commands.add("gitSyncCreateBranchViaUI", (branchName) => {
  cy.get("body").then(($body) => {
    if ($body.find(GS.wsBranchPopover).length === 0) {
      cy.get(GS.wsBranchHeader).click();
    }
  });
  cy.get(GS.wsBranchPopover).should("be.visible");
  cy.get(GS.wsCreateBranchBtn).click();

  cy.get(GS.branchNameInput).should("be.visible").clear().type(branchName);
  cy.contains("button", "Create branch").click();

  cy.get(GS.branchNameInput).should("not.exist");
  cy.get(GS.wsCurrentBranch).should("contain.text", branchName);
  cy.log(`[gitSync] Branch '${branchName}' created via UI`);
});

Cypress.Commands.add("gitSyncSwitchBranch", (branchName) => {
  cy.get(GS.wsBranchHeader).click();
  cy.get(GS.wsBranchPopover).should("be.visible");
  cy.get(GS.wsSwitchBranchBtn).click();

  cy.get(GS.wsBranchSearchInput).should("be.visible").clear().type(branchName);
  cy.get(GS.wsBranchListItem(branchName)).should("be.visible").click();

  cy.wait(1000);
  cy.get(GS.wsCurrentBranch).should("contain.text", branchName);
  cy.log(`[gitSync] Switched to branch '${branchName}'`);
});

Cypress.Commands.add("gitSyncDashboardPush", (message) => {
  cy.get(GS.wsBranchHeader).click();
  cy.get(GS.wsBranchPopover).should("be.visible");

  cy.contains(GS.wsBranchPopover + " button", /commit|push/i).click();

  cy.get(GS.commitMessageInput).should("be.visible");

  // UI checks on modal
  cy.get(GS.commitMessageInput).should("be.visible");
  cy.contains("button", /commit|push/i)
    .filter(":not([disabled])")
    .should("be.disabled"); // disabled when message is empty

  cy.get(GS.commitMessageInput).type(message);

  cy.contains("button", /commit|push/i)
    .filter(":not([disabled])")
    .last()
    .click();

  // Wait for modal to close = success
  cy.get(GS.commitMessageInput, { timeout: 45000 }).should("not.exist");
  cy.log(`[gitSync] Dashboard commit pushed: "${message}"`);
});

Cypress.Commands.add("gitSyncDashboardPull", () => {
  cy.contains("button", /^Pull$/i).click();

  cy.get(GS.modalTitle).should("be.visible");

  // Old pull flow: check for updates → pull changes
  cy.get(GS.checkForUpdatesLabel).click();
  cy.contains("button", /pull changes/i, { timeout: 30000 })
    .should("be.enabled")
    .click();

  cy.get(GS.modalTitle, { timeout: 45000 }).should("not.exist");
  cy.log("[gitSync] Dashboard pull completed");
});

Cypress.Commands.add("gitSyncOpenAppInBuilder", (appName) => {
  cy.get(GS.appCard)
    .contains(appName)
    .closest(GS.appCard)
    .should("be.visible")
    .trigger("mouseover");

  cy.get(GS.appCard)
    .contains(appName)
    .closest(GS.appCard)
    .contains("a", "Edit")
    .click();

  cy.url({ timeout: 30000 }).should("include", "/apps/");
  cy.waitForAppLoad();
});

Cypress.Commands.add(
  "gitHubWaitForCommitsAhead",
  (headBranch, baseBranch = "master", retries = 10) => {
    const owner = Cypress.env("GITHUB_REPO_OWNER");
    const repo = Cypress.env("GITHUB_REPO_NAME");

    const check = (remaining) => {
      return cy
        .request({
          method: "GET",
          url: `https://api.github.com/repos/${owner}/${repo}/compare/${baseBranch}...${headBranch}`,
          headers: {
            Authorization: `Bearer ${Cypress.env("GITHUB_TOKEN")}`,
            Accept: "application/vnd.github+json",
          },
        })
        .then((res) => {
          const aheadBy = res.body.ahead_by;
          if (aheadBy > 0) {
            Cypress.log({
              message: `[gitSync] Branch '${headBranch}' is ${aheadBy} commit(s) ahead of '${baseBranch}'`,
            });
            return;
          }
          if (remaining <= 0) {
            throw new Error(
              `Branch '${headBranch}' has no commits ahead of '${baseBranch}' after waiting`,
            );
          }
          Cypress.log({
            message: `[gitSync] Branch not ahead yet, retrying... (${remaining} left)`,
          });
          return cy.wait(3000).then(() => check(remaining - 1));
        });
    };

    return check(retries);
  },
);

Cypress.Commands.add(
  "gitHubCreatePR",
  (headBranch, title, baseBranch = "master") => {
    const owner = Cypress.env("GITHUB_REPO_OWNER");
    const repo = Cypress.env("GITHUB_REPO_NAME");

    return cy
      .request({
        method: "POST",
        url: `https://api.github.com/repos/${owner}/${repo}/pulls`,
        headers: {
          Authorization: `Bearer ${Cypress.env("GITHUB_TOKEN")}`,
          Accept: "application/vnd.github+json",
        },
        body: { title, head: headBranch, base: baseBranch },
      })
      .then((res) => {
        expect(res.status, "GitHub create PR").to.equal(201);
        Cypress.env("prNumber", res.body.number);
        Cypress.log({
          message: `[gitSync] PR #${res.body.number} created: ${headBranch} → ${baseBranch}`,
        });
        return res.body.number;
      });
  },
);

Cypress.Commands.add("gitHubMergePR", (prNumber = Cypress.env("prNumber")) => {
  const owner = Cypress.env("GITHUB_REPO_OWNER");
  const repo = Cypress.env("GITHUB_REPO_NAME");

  return cy
    .request({
      method: "PUT",
      url: `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/merge`,
      headers: {
        Authorization: `Bearer ${Cypress.env("GITHUB_TOKEN")}`,
        Accept: "application/vnd.github+json",
      },
      body: { merge_method: "squash" },
    })
    .then((res) => {
      expect(res.status, `GitHub merge PR #${prNumber}`).to.equal(200);
      Cypress.log({ message: `[gitSync] PR #${prNumber} merged to main` });
    });
});

Cypress.Commands.add("gitHubDeleteBranch", (branchName) => {
  const owner = Cypress.env("GITHUB_REPO_OWNER");
  const repo = Cypress.env("GITHUB_REPO_NAME");

  return cy
    .request({
      method: "DELETE",
      url: `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branchName}`,
      headers: {
        Authorization: `Bearer ${Cypress.env("GITHUB_TOKEN")}`,
        Accept: "application/vnd.github+json",
      },
      failOnStatusCode: false,
    })
    .then((res) => {
      Cypress.log({
        message: `[gitSync] GitHub branch '${branchName}' deleted (${res.status})`,
      });
    });
});

Cypress.Commands.add("gitHubResetRepo", (defaultBranch = "master") => {
  const owner = Cypress.env("GITHUB_REPO_OWNER");
  const repo = Cypress.env("GITHUB_REPO_NAME");
  const ghHeaders = {
    Authorization: `Bearer ${Cypress.env("GITHUB_TOKEN")}`,
    Accept: "application/vnd.github+json",
  };

  // Step 1: delete all test-* branches
  cy.request({
    method: "GET",
    url: `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
    headers: ghHeaders,
  }).then((res) => {
    const testBranches = res.body.filter((b) => b.name.startsWith("test-"));
    Cypress.log({
      message: `[gitSync] Deleting ${testBranches.length} test branch(es)`,
    });
    testBranches.forEach((branch) => {
      cy.gitHubDeleteBranch(branch.name);
    });
  });

  // Step 2: clear master contents via empty-tree commit.
  // Git's empty tree SHA is a universal constant — exists in every repo,
  // no need to POST /git/trees (which rejects an empty array with 422).
  const EMPTY_TREE_SHA = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

  cy.request({
    method: "GET",
    url: `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`,
    headers: ghHeaders,
  }).then((refRes) => {
    const parentSha = refRes.body.object.sha;

    cy.request({
      method: "POST",
      url: `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      headers: ghHeaders,
      body: {
        message: "chore: clear repo contents for test isolation",
        tree: EMPTY_TREE_SHA,
        parents: [parentSha],
      },
    }).then((commitRes) => {
      cy.request({
        method: "PATCH",
        url: `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`,
        headers: ghHeaders,
        body: { sha: commitRes.body.sha, force: true },
      }).then((updateRes) => {
        expect(updateRes.status).to.equal(200);
        Cypress.log({
          message: `[gitSync] '${defaultBranch}' cleared (commit: ${commitRes.body.sha.slice(0, 7)})`,
        });
      });
    });
  });
});

Cypress.Commands.add("gitSyncGoToDashboard", () => {
  const workspace = Cypress.env("workspaceSlug") || "";
  const url = workspace ? `/${workspace}` : "/";
  cy.visit(url);
  cy.wait(3000);
  cy.get('[data-cy="dashboard-section-header"]', { timeout: 15000 }).should(
    "be.visible",
  );
});
