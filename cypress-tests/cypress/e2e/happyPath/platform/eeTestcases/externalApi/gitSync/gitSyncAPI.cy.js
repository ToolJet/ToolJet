import {
  configureOrganizationGit,
  pushAppVersionToGit,
  createAppFromGit,
  pullAppChangesFromGit,
  releaseAppFromGit,
  saveAppVersion,
  fetchWorkspaceApps,
} from "Support/utils/externalApi";
import { fake } from "Fixtures/fake";
import { sanitize } from "Support/utils/common";

describe("ToolJet: GitSync API Validation", () => {
  const data = {};
  let sourceWorkspaceId;
  let targetWorkspaceId;

  const gitConfigPayload = (organizationId) => {
    const payload = {
      organizationId,
      gitUrl: Cypress.env("GITHUB_REPO_URL"),
      branchName: Cypress.env("GITSYNC_BRANCH_NAME") || "master",
      githubAppId: String(Cypress.env("GITHUB_APP_ID")),
      githubAppInstallationId: String(Cypress.env("GITHUB_APP_INSTALLATION_ID")),
      githubAppPrivateKey: Cypress.env("GITHUB_PRIVATE_KEY"),
    };
    const enterpriseApiUrl = Cypress.env("GITHUB_API_BASE_URL");
    if (enterpriseApiUrl) {
      payload.githubEnterpriseApiUrl = enterpriseApiUrl;
      payload.githubEnterpriseUrl = enterpriseApiUrl.replace(/\/api\/v3\/?$/, "");
    }
    return payload;
  };

  beforeEach(() => {
    data.sourceWorkspaceName = sanitize(fake.lastName);
    data.sourceWorkspaceSlug = sanitize(fake.lastName);
    data.targetWorkspaceName = sanitize(fake.firstName);
    data.targetWorkspaceSlug = sanitize(fake.firstName);
    data.appName = `gitsync${Date.now()}`;

    cy.apiLogin();
    cy.apiCreateWorkspace(
      data.sourceWorkspaceName,
      data.sourceWorkspaceSlug
    ).then((response) => {
      sourceWorkspaceId = response.body.organization_id;
      Cypress.env("workspaceId", sourceWorkspaceId);
    });

    return cy
      .apiCreateWorkspace(data.targetWorkspaceName, data.targetWorkspaceSlug)
      .then((response) => {
        targetWorkspaceId = response.body.organization_id;
      });
  });

  afterEach(() => {
    // Workspace-scoped login: apiDeleteAllApps hits the internal /api/apps
    // endpoint, which needs a session JWT whose organizationIds actually
    // includes the target workspace — setting Cypress.env("workspaceId")
    // alone only changes the Tj-Workspace-Id header, not the JWT claim.
    cy.apiLogin("dev@tooljet.io", "password", sourceWorkspaceId);
    cy.apiDeleteAllApps();
    cy.apiLogin("dev@tooljet.io", "password", targetWorkspaceId);
    cy.apiDeleteAllApps();
  });

  it("should validate GitSync end-to-end API flows", () => {
    let appId;
    let versionId;
    let targetAppId;

    // Arrange: create the app BEFORE git sync is configured. Once
    // configureOrganizationGit enables branching for the org, the server
    // rejects app creation on the default branch (apps must be created on a
    // feature branch to go through the git-sync review flow) — so an app
    // meant to be pushed via the ext API must already exist first.
    // Workspace-scoped login is required — apiCreateApp hits the internal
    // /api/apps endpoint, which needs a session JWT whose organizationIds
    // includes this workspace.
    cy.apiLogin("dev@tooljet.io", "password", sourceWorkspaceId);
    cy.apiCreateApp(data.appName);

    // POST /api/apps only creates an app shell — no app_versions row yet.
    // The first pushable version must be created explicitly via the
    // SAVE_APP_VERSION endpoint before anything git-sync related can happen.
    //
    // BUG: GET /ext/workspace/:id/apps can never report versions[] for any
    // app — processAllWorkspaceAppsData (ee/external-apis/util.service.ts:594)
    // checks `row.versionid` (lowercase) against a raw SQL row whose actual
    // key is `versionId` (camelCase, from a quoted alias), so the check is
    // always false and versions[] is always []. Capturing appId/versionId
    // directly from apiCreateApp/saveAppVersion's own responses sidesteps
    // this entirely instead of trying to look them up via that endpoint.
    cy.then(() => {
      appId = Cypress.env("appId");
      return saveAppVersion(appId).then((response) => {
        expect(response.status).to.eq(201);
        versionId = response.body.id;
        expect(versionId, "version id of source app").to.exist;
      });
    });

    cy.then(() => {
      // EXT-GIT-01: configure GitHub HTTPS git config on the source workspace
      configureOrganizationGit(gitConfigPayload(sourceWorkspaceId)).then(
        (response) => {
          expect(response.status).to.eq(201);
        }
      );

      // Arrange: configure git on the target workspace so it can pull from the repo
      configureOrganizationGit(gitConfigPayload(targetWorkspaceId)).then(
        (response) => {
          expect(response.status).to.eq(201);
        }
      );

      // EXT-GIT-03: push app version to git
      pushAppVersionToGit(appId, versionId, {
        commitMessage: `initial commit ${data.appName}`,
      }).then((response) => {
        expect(response.status).to.eq(201);
      });

      // EXT-GIT-06: create without createMode is a no-op with an empty response
      createAppFromGit(
        { appId, organizationId: targetWorkspaceId },
        ""
      ).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body, "no-op response body").to.be.empty;
      });

      // EXT-GIT-05: create app from git in the target workspace
      createAppFromGit({ gitAppName: data.appName, organizationId: targetWorkspaceId }).then(
        (response) => {
          expect(response.status).to.eq(201);
        }
      );

      fetchWorkspaceApps(targetWorkspaceId).then((response) => {
        expect(response.status).to.eq(200);
        const targetApps = response.body.apps || response.body;
        const targetApp = targetApps.find((app) => app.name === data.appName);
        expect(targetApp, "app created from git in target workspace").to.exist;
        targetAppId = targetApp.id;

        // EXT-GIT-07: push a new commit from source, then pull into the target app
        pushAppVersionToGit(appId, versionId, {
          commitMessage: `update commit ${data.appName}`,
        }).then((response) => {
          expect(response.status).to.eq(201);
        });

        pullAppChangesFromGit(targetAppId).then((response) => {
          expect(response.status).to.eq(200);
        });

        // EXT-GIT-08: release the synced source app version
        releaseAppFromGit(appId).then((response) => {
          expect(response.status).to.eq(201);
          expect(response.body, "released app").to.have.property("id");
        });
      });
    });
  });

  it("should pull a merged git app into a new workspace and push it via ext API after switching branch", () => {
    const branchName = `feature${Date.now()}`;
    const branchName2 = `feature2${Date.now()}`;
    const appName = `gitscenario${Date.now()}`;
    let appId, branchId;

    // -----------------------------------------------------------------
    // Precondition: build REAL git history on the source workspace using
    // the existing, proven GitSync command library (create branch → app
    // ON that branch → commit → PR → merge). Nothing in the external API
    // alone can produce a branch-type (pushable) version for a brand-new
    // app — every such path is pull-from-remote, never push-from-local
    // (confirmed by tracing hydrateStubApp/createBranch/handleDefault-
    // BranchPublish). So the only way to get a genuinely pushable app is
    // to originate it via a real feature branch, exactly like a real user
    // would in the UI.
    // -----------------------------------------------------------------
    cy.apiLogin("dev@tooljet.io", "password", sourceWorkspaceId);
    cy.then(() => Cypress.env("workspaceId", sourceWorkspaceId));

    configureOrganizationGit(gitConfigPayload(sourceWorkspaceId)).then(
      (response) => {
        expect(response.status).to.eq(201);
      }
    );

    cy.gitSyncCreateBranchViaApi(branchName);
    cy.gitSyncGetBranchId(branchName).then((id) => {
      branchId = id;
      expect(branchId, "feature branch id").to.exist;

      cy.apiCreateAppOnBranch(appName, branchId).then((app) => {
        appId = app.id;

        cy.apiGetEditingVersionId(appId, branchId).then((versionId) => {
          cy.apiEditorPush(
            appId,
            versionId,
            `initial commit ${appName}`,
            branchName,
            appName
          );
          cy.gitHubWaitForCommitsAhead(branchName, "master");

          cy.gitHubCreatePR(branchName, `PR: ${appName}`, "master").then(
            (prNumber) => {
              cy.gitHubMergePR(prNumber);

              // -----------------------------------------------------------
              // Actual test: the external API endpoints we're responsible
              // for — pull the now-merged app into a fresh workspace, then
              // switch to a new branch there and push via the ext API.
              // -----------------------------------------------------------
              cy.apiLogin("dev@tooljet.io", "password", targetWorkspaceId);
              cy.then(() => Cypress.env("workspaceId", targetWorkspaceId));

              configureOrganizationGit(gitConfigPayload(targetWorkspaceId)).then(
                (response) => {
                  expect(response.status).to.eq(201);
                }
              );

              // EXT-GIT-05: pull the merged app into the target workspace
              createAppFromGit({ gitAppName: appName, organizationId: targetWorkspaceId }).then(
                (response) => {
                  expect(response.status).to.eq(201);
                }
              );

              fetchWorkspaceApps(targetWorkspaceId).then((response) => {
                expect(response.status).to.eq(200);
                const targetApps = response.body.apps || response.body;
                const targetApp = targetApps.find((a) => a.name === appName);
                expect(targetApp, "pulled app in target workspace").to.exist;

                // Create a second feature branch on the target workspace —
                // clones from target's default branch (now containing the
                // merged app), producing a genuine BRANCH-type version.
                cy.gitSyncCreateBranchViaApi(branchName2);
                cy.gitSyncGetBranchId(branchName2).then((branchId2) => {
                  expect(branchId2, "second feature branch id").to.exist;

                  cy.apiSwitchBranch(branchId2);
                  cy.apiGetAppIdByNameOnBranch(appName, branchId2).then(
                    (resolvedAppId) => {
                      expect(resolvedAppId, "app resolved on second branch").to
                        .exist;

                      cy.apiGetEditingVersionId(resolvedAppId, branchId2).then(
                        (targetVersionId) => {
                          // EXT-GIT-03: push via OUR external API — this
                          // version genuinely is versionType BRANCH, so the
                          // ext API push endpoint should accept it.
                          pushAppVersionToGit(resolvedAppId, targetVersionId, {
                            commitMessage: `push via ext api ${appName}`,
                          }).then((response) => {
                            expect(response.status).to.eq(201);
                          });
                        }
                      );
                    }
                  );
                });
              });
            }
          );
        });
      });
    });
  });

  it("should validate GitSync negative API flows", () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000099";

    // EXT-GIT-02: invalid git config payload (missing required fields)
    configureOrganizationGit({
      organizationId: sourceWorkspaceId,
      gitUrl: Cypress.env("GITHUB_REPO_URL"),
    }).then((response) => {
      expect(response.status).to.eq(400);
    });

    // EXT-GIT-04: push with non-existent appId/versionId
    pushAppVersionToGit(nonExistentId, nonExistentId, {
      commitMessage: "invalid push",
    }).then((response) => {
      expect(response.status).to.eq(400);
    });

    // EXT-GIT-09: invalid auth token rejected
    configureOrganizationGit(gitConfigPayload(sourceWorkspaceId), {
      Authorization: "Basic xyz",
    }).then((response) => {
      expect(response.status).to.eq(403);
    });
  });
});
