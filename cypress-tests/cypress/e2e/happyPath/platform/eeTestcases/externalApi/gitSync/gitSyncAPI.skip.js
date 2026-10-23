import { fake } from "Fixtures/fake";
import { sanitize } from "Support/utils/common";
import {
  configureOrganizationGit,
  createAppFromGit,
  invalidAuthHeader,
  pullAppChangesFromGit,
  pushAppVersionToGit,
  releaseAppFromGit,
  saveAppVersion,
} from "Support/utils/externalApi";

describe("ToolJet: GitSync API Validation", () => {
  const data = {};
  let workspaceId;
  let branchId;
  let appId;
  let versionId;
  let masterAppId;
  let homePageId;
  const branchName = `feature${Date.now()}`;
  const componentId = crypto.randomUUID
    ? crypto.randomUUID()
    : require("uuid").v4();
  const componentName = "gitSyncTestComponent";

  const createOrFindPR = (headBranch, title, baseBranch = "master") => {
    const owner = Cypress.env("GITHUB_REPO_OWNER");
    const repo = Cypress.env("GITHUB_REPO_NAME");
    const ghHeaders = {
      Authorization: `Bearer ${Cypress.env("GITHUB_TOKEN")}`,
      Accept: "application/vnd.github+json",
    };
    return cy
      .request({
        method: "POST",
        url: `https://api.github.com/repos/${owner}/${repo}/pulls`,
        headers: ghHeaders,
        body: { title, head: headBranch, base: baseBranch },
        failOnStatusCode: false,
      })
      .then((res) => {
        if (res.status === 201) {
          return res.body.number;
        }
        const alreadyExists = ((res.body && res.body.errors) || []).some((e) =>
          (e.message || "").includes("already exists"),
        );
        expect(
          alreadyExists,
          `PR create should either succeed or already exist (got ${res.status})`,
        ).to.be.true;
        return cy
          .request({
            method: "GET",
            url: `https://api.github.com/repos/${owner}/${repo}/pulls?head=${owner}:${headBranch}&base=${baseBranch}&state=open`,
            headers: ghHeaders,
          })
          .then((listRes) => {
            expect(
              listRes.body,
              "existing open PR for branch",
            ).to.have.length.greaterThan(0);
            return listRes.body[0].number;
          });
      });
  };

  const mergeIfNotMerged = (prNumber, attempt = 1) => {
    const owner = Cypress.env("GITHUB_REPO_OWNER");
    const repo = Cypress.env("GITHUB_REPO_NAME");
    const ghHeaders = {
      Authorization: `Bearer ${Cypress.env("GITHUB_TOKEN")}`,
      Accept: "application/vnd.github+json",
    };
    return cy
      .request({
        method: "GET",
        url: `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
        headers: ghHeaders,
      })
      .then((prRes) => {
        if (prRes.body.merged) return;

        if (prRes.body.mergeable !== true && attempt < 8) {
          cy.wait(1500, { log: false });
          return mergeIfNotMerged(prNumber, attempt + 1);
        }

        return cy
          .request({
            method: "PUT",
            url: `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/merge`,
            headers: ghHeaders,
            body: { merge_method: "squash" },
            failOnStatusCode: false,
          })
          .then((res) => {
            if (res.status === 200) return;
            // Merge became stale/not-mergeable between the check above and
            // this call (or GitHub still hadn't finished) — retry once more
            // rather than fail outright.
            expect(
              attempt,
              `GitHub merge PR #${prNumber} (final attempt)`,
            ).to.be.lessThan(8);
            cy.wait(1500, { log: false });
            return mergeIfNotMerged(prNumber, attempt + 1);
          });
      });
  };

  const waitForHydratedVersion = (appId, branchId, attempt = 1) => {
    return cy.getAuthHeaders().then((headers) => {
      return cy
        .request({
          method: "GET",
          url: `${Cypress.env("server_host")}/api/apps/${appId}`,
          headers: { ...headers, "x-branch-id": branchId },
        })
        .then((res) => {
          const version = res.body.editing_version;
          if (!version.is_stub) return version.id;
          expect(attempt, "waiting for stub version to hydrate").to.be.lessThan(
            10,
          );
          cy.wait(1500, { log: false });
          return waitForHydratedVersion(appId, branchId, attempt + 1);
        });
    });
  };

  // POST /api/workspace-branches accepts an optional sourceBranchId — when
  // given, the new branch forks from that branch's current HEAD (and its
  // app-stubs are hydrated from that branch's content) instead of the org's
  // default branch. cy.gitSyncCreateBranchViaApi doesn't expose this field,
  // so this raw request is used whenever forking off a non-default branch.
  const createBranchFromSource = (name, sourceBranchId) => {
    return cy.getAuthHeaders().then((headers) => {
      return cy
        .request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/workspace-branches`,
          headers,
          body: { name, sourceBranchId },
        })
        .then((res) => {
          expect(
            res.status,
            `create branch '${name}' from source ${sourceBranchId}`,
          ).to.eq(201);
        });
    });
  };

  const waitForBranchId = (branchName, attempt = 1) => {
    return cy.gitSyncGetBranchId(branchName).then((id) => {
      if (id) return id;
      expect(
        attempt,
        `waiting for branch "${branchName}" to be listed`,
      ).to.be.lessThan(10);
      cy.wait(1500, { log: false });
      return waitForBranchId(branchName, attempt + 1);
    });
  };

  const waitForAppIdOnBranch = (appName, branchId, attempt = 1) => {
    return cy.apiGetAppIdByNameOnBranch(appName, branchId).then((id) => {
      if (id) return id;
      expect(
        attempt,
        `waiting for "${appName}" to be stubbed onto the new branch`,
      ).to.be.lessThan(20);
      cy.wait(2000, { log: false });
      return waitForAppIdOnBranch(appName, branchId, attempt + 1);
    });
  };

  const getVersionAndHomePage = (appId, branchId) => {
    return cy.getAuthHeaders().then((headers) => {
      return cy
        .request({
          method: "GET",
          url: `${Cypress.env("server_host")}/api/apps/${appId}`,
          headers: { ...headers, "x-branch-id": branchId },
        })
        .then((res) => {
          const version = res.body.editing_version;
          return { versionId: version.id, homePageId: version.home_page_id };
        });
    });
  };

  const addComponent = (
    appId,
    versionId,
    branchId,
    pageId,
    componentId,
    componentName,
  ) => {
    return cy.getAuthHeaders().then((headers) => {
      return cy
        .request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/v2/apps/${appId}/versions/${versionId}/components`,
          headers: { ...headers, "x-branch-id": branchId },
          body: {
            is_user_switched_version: false,
            pageId,
            diff: {
              [componentId]: {
                name: componentName,
                layouts: {
                  desktop: { top: 90, left: 9, width: 6, height: 40 },
                  mobile: { top: 90, left: 9, width: 6, height: 40 },
                },
                type: "Text",
                properties: { text: { value: "default" } },
              },
            },
          },
        })
        .then((res) => {
          expect(res.status, `add component ${componentId}`).to.eq(201);
        });
    });
  };

  const gitConfigPayload = (organizationId) => {
    const payload = {
      organizationId,
      gitUrl: Cypress.env("GITHUB_REPO_URL"),
      branchName: Cypress.env("GITSYNC_BRANCH_NAME") || "main",
      githubAppId: String(Cypress.env("GITHUB_APP_ID")),
      githubAppInstallationId: String(
        Cypress.env("GITHUB_APP_INSTALLATION_ID"),
      ),
      githubAppPrivateKey: Cypress.env("GITHUB_PRIVATE_KEY"),
    };
    const enterpriseApiUrl = Cypress.env("GITHUB_API_BASE_URL");
    if (enterpriseApiUrl) {
      payload.githubEnterpriseApiUrl = enterpriseApiUrl;
      payload.githubEnterpriseUrl = enterpriseApiUrl.replace(
        /\/api\/v3\/?$/,
        "",
      );
    }
    return payload;
  };

  after(() => {
    if (!workspaceId) return;
    cy.apiLogin("dev@tooljet.io", "password", workspaceId);
    cy.apiDeleteAllApps();
  });

  it("should configure GitSync via external API and validate negative cases", () => {
    const testId = Date.now();
    data.workspaceName = `${sanitize(fake.lastName)}${testId}`;
    data.appName = `gitsync${testId}`;

    cy.apiLogin();
    cy.apiCreateWorkspace(data.workspaceName, data.workspaceName).then(
      (response) => {
        workspaceId = response.body.organization_id;
        Cypress.env("workspaceId", workspaceId);
      },
    );

    cy.then(() => {
      cy.apiLogin("dev@tooljet.io", "password", workspaceId);

      // EXT-GIT-02: invalid git config payload (missing required fields)
      configureOrganizationGit({
        organizationId: workspaceId,
        gitUrl: Cypress.env("GITHUB_REPO_URL"),
      }).then((response) => {
        expect(response.status).to.eq(400);
      });

      // EXT-GIT-09: invalid auth token rejected
      configureOrganizationGit(
        gitConfigPayload(workspaceId),
        invalidAuthHeader,
      ).then((response) => {
        expect(response.status).to.eq(403);
      });

      // EXT-GIT-01: happy path
      configureOrganizationGit(gitConfigPayload(workspaceId)).then(
        (response) => {
          expect(response.status).to.eq(201);
        },
      );
    });

    cy.gitSyncCreateBranchViaApi(branchName);
    // Branch creation is an async queued job — cy.gitSyncGetBranchId
    // returns "" (not null) while it's still pending, which silently
    // passes a plain `.to.exist` check and sends an empty branchId to
    // apiCreateAppOnBranch. Poll until it's genuinely populated, same as
    // the later blocks do.
    waitForBranchId(branchName).then((id) => {
      branchId = id;
      expect(branchId, "feature branch id").to.exist;

      cy.apiCreateAppOnBranch(data.appName, branchId).then((app) => {
        appId = app.id;

        getVersionAndHomePage(appId, branchId).then((details) => {
          versionId = details.versionId;
          homePageId = details.homePageId;

          addComponent(
            appId,
            versionId,
            branchId,
            homePageId,
            componentId,
            componentName,
          );

          cy.apiEditorPush(
            appId,
            versionId,
            `initial commit ${data.appName}`,
            branchName,
            data.appName,
          );
          cy.gitHubWaitForCommitsAhead(branchName, "master");

          createOrFindPR(branchName, `PR: ${data.appName}`, "master").then(
            (prNumber) => {
              return mergeIfNotMerged(prNumber);
            },
          );
        });
      });
    });
  });

  it("should pull the app from Git via external API and validate negative cases", () => {
    cy.apiLogin("dev@tooljet.io", "password", workspaceId);

    cy.gitSyncGetBranchId(Cypress.env("GITSYNC_BRANCH_NAME") || "master").then(
      (id) => {
        expect(id, "default branch id").to.exist;
      },
    );

    createAppFromGit({
      gitAppName: data.appName,
      gitBranchName: "master",
      organizationId: workspaceId,
    }).then((response) => {
      expect(response.status).to.eq(201);

      masterAppId = response.body.id;
    });

    // Guard case: pulling the SAME app again now correctly rejects it as a
    // duplicate, since the call above just created it. The server returns
    // 409 Conflict here (not 400) — confirmed via a single-attempt run with
    // retries disabled.
    createAppFromGit({
      gitAppName: data.appName,
      gitBranchName: "master",
      organizationId: workspaceId,
    }).then((response) => {
      expect(response.status).to.eq(409);
      expect(response.body.message).to.include("already exists");
    });

    // EXT-GIT: missing required organizationId
    createAppFromGit({ gitAppName: data.appName }).then((response) => {
      expect(response.status).to.eq(400);
    });

    // EXT-GIT: invalid auth token rejected
    createAppFromGit(
      { gitAppName: data.appName, organizationId: workspaceId },
      "?createMode=git",
      invalidAuthHeader,
    ).then((response) => {
      expect(response.status).to.eq(403);
    });
  });

  it("should push an app version to Git via external API and validate negative cases", () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000099";

    // Positive: push a real update commit for the precondition app/version.
    pushAppVersionToGit(appId, versionId, {
      commitMessage: `update commit ${data.appName}`,
    }).then((response) => {
      expect(response.status).to.eq(201);
    });

    // EXT-GIT-04: push with non-existent appId/versionId.

    pushAppVersionToGit(nonExistentId, nonExistentId, {
      commitMessage: "invalid push",
    }).then((response) => {
      expect(response.status).to.eq(500);
    });

    // EXT-GIT: version does not belong to the given app
    pushAppVersionToGit(nonExistentId, versionId, {
      commitMessage: "mismatched app/version",
    }).then((response) => {
      expect(response.status).to.eq(400);
    });

    // EXT-GIT: invalid auth token rejected
    pushAppVersionToGit(
      appId,
      versionId,
      { commitMessage: "invalid auth" },
      invalidAuthHeader,
    ).then((response) => {
      expect(response.status).to.eq(403);
    });
  });

  it("should release/auto-deploy the app via external API and validate negative cases", () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000099";

    const releaseTargetAppId = masterAppId || appId;

    saveAppVersion(releaseTargetAppId, {}).then((saveResponse) => {
      expect(
        saveResponse.status,
        `save-version response body: ${JSON.stringify(saveResponse.body)}`,
      ).to.eq(201);

      releaseAppFromGit(releaseTargetAppId).then((response) => {
        expect(
          response.status,
          `release response body: ${JSON.stringify(response.body)} (releaseTargetAppId=${releaseTargetAppId})`,
        ).to.eq(201);
        expect(response.body, "released app").to.have.property("id");
      });
    });

    // EXT-GIT: non-existent app — app lookup fails before any git logic
    releaseAppFromGit(nonExistentId).then((response) => {
      expect(response.status).to.eq(404);
    });

    // EXT-GIT: invalid auth token rejected
    releaseAppFromGit(releaseTargetAppId, invalidAuthHeader).then(
      (response) => {
        expect(response.status).to.eq(403);
      },
    );
  });

  it("should pull updated changes into the existing app via external API and validate negative cases", () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000099";
    const pullBranchName = `pullbranch${Date.now()}`;
    const updateBranchName = `pullupdate${Date.now()}`;
    const pullAppName = `${data.appName}pull`;
    const pullComponentId = crypto.randomUUID
      ? crypto.randomUUID()
      : require("uuid").v4();
    const pullComponentName = "gitSyncPullTestComponent";
    let pullBranchId;
    let pullAppId;

    cy.apiLogin("dev@tooljet.io", "password", workspaceId);

    cy.gitSyncCreateBranchViaApi(pullBranchName);
    waitForBranchId(pullBranchName).then((id) => {
      pullBranchId = id;
      expect(pullBranchId, "pull-test branch id").to.exist;

      cy.apiCreateAppOnBranch(pullAppName, pullBranchId).then((app) => {
        pullAppId = app.id;

        getVersionAndHomePage(pullAppId, pullBranchId).then((details) => {
          const pullVersionId = details.versionId;
          const pullHomePageId = details.homePageId;

          addComponent(
            pullAppId,
            pullVersionId,
            pullBranchId,
            pullHomePageId,
            pullComponentId,
            pullComponentName,
          );

          cy.apiEditorPush(
            pullAppId,
            pullVersionId,
            `initial commit ${pullAppName}`,
            pullBranchName,
            pullAppName,
          );
          cy.gitHubWaitForCommitsAhead(pullBranchName, "master");

          createBranchFromSource(updateBranchName, pullBranchId);
          waitForBranchId(updateBranchName).then((updateBranchId) => {
            expect(updateBranchId, "update branch id").to.exist;

            waitForAppIdOnBranch(pullAppName, updateBranchId).then(
              (updateAppId) => {
                expect(updateAppId, "app resolved on update branch").to.exist;

                waitForHydratedVersion(updateAppId, updateBranchId).then(
                  (updateVersionId) => {
                    cy.apiDeleteComponent(
                      updateAppId,
                      updateVersionId,
                      pullComponentId,
                      pullHomePageId,
                    );

                    cy.apiEditorPush(
                      updateAppId,
                      updateVersionId,
                      `drop component commit ${pullAppName}`,
                      updateBranchName,
                      pullAppName,
                    );
                    cy.gitHubWaitForCommitsAhead(
                      updateBranchName,
                      pullBranchName,
                    );

                    createOrFindPR(
                      updateBranchName,
                      `PR: update ${pullAppName}`,
                      pullBranchName,
                    )
                      .then((prNumber) => {
                        return mergeIfNotMerged(prNumber);
                      })
                      .then(() => {
                        cy.wait(4000, { log: false });

                        // EXT-GIT: non-existent app
                        pullAppChangesFromGit(nonExistentId).then(
                          (response) => {
                            expect(response.status).to.eq(400);
                          },
                        );

                        // EXT-GIT: invalid auth token rejected
                        pullAppChangesFromGit(
                          pullAppId,
                          "?createMode=git",
                          invalidAuthHeader,
                        ).then((response) => {
                          expect(response.status).to.eq(403);
                        });

                        // Positive case — pull the merged update into the
                        // original branch-created app.
                        pullAppChangesFromGit(pullAppId).then((response) => {
                          expect(
                            response.status,
                            `pull response body: ${JSON.stringify(response.body)}`,
                          ).to.eq(200);

                          cy.getAuthHeaders().then((headers) => {
                            cy.request({
                              method: "GET",
                              url: `${Cypress.env("server_host")}/api/apps/${pullAppId}`,
                              headers: {
                                ...headers,
                                "x-branch-id": pullBranchId,
                              },
                            }).then((appRes) => {
                              const pages = appRes.body.pages || [];
                              const stillHasComponent = pages.some(
                                (page) =>
                                  page.components &&
                                  Object.prototype.hasOwnProperty.call(
                                    page.components,
                                    pullComponentId,
                                  ),
                              );
                              expect(
                                stillHasComponent,
                                "dropped component should no longer exist after pull",
                              ).to.be.false;
                            });
                          });
                        });
                      });
                  },
                );
              },
            );
          });
        });
      });
    });
  });
});
