import {
  setupGitSyncSpec,
  loginToGitSyncSpec,
  teardownGitSyncSpec,
  seedPushedAppViaAPI,
} from "Support/utils/platform/gitSync/gitSyncSeed";
import { createBranchViaAPI } from "Support/utils/platform/gitSync/workspaceBranch";
import {
  getBranchHeadViaAPI,
  getTagViaAPI,
  waitForTagViaAPI,
  deleteTagsByPrefixViaAPI,
} from "Support/utils/platform/gitSync/gitHubRepo";
import { pollUntil } from "Support/utils/platform/gitSync/poll";
import { gitSyncText } from "Texts/platform/gitSync";

// Saving a version creates the GitHub tag `<co_relation_id>/<version name>`.
describe("Git Sync — Version Tags", { retries: 0 }, () => {
  let ctx;
  const coRelIds = [];

  const tjRequest = (method, path, opts = {}) =>
    cy.getAuthHeaders().then((headers) =>
      cy.request({ method, url: `${Cypress.env("server_host")}/api${path}`, headers, failOnStatusCode: false, ...opts }),
    );

  // Save a version the way the app builder does (PUT /app-git/:appId/versions/:versionId).
  const saveVersionViaAPI = (appId, versionId, name, branchId, description) =>
    tjRequest("PUT", `/app-git/${appId}/versions/${versionId}`, {
      qs: { branch_id: branchId },
      body: { name, status: "PUBLISHED", is_user_switched_version: false, ...(description ? { description } : {}) },
    }).then((res) => {
      expect(res.status, `save version ${name}: ${JSON.stringify(res.body)}`).to.be.oneOf([200, 201]);
    });

  const listVersionsViaAPI = (appId, branchId) =>
    tjRequest("GET", `/apps/${appId}/versions`, { qs: { branch_id: branchId } }).then((res) => res.body?.versions || []);

  const checkTagViaAPI = (appId, versionName) =>
    tjRequest("GET", `/app-git/${appId}/check-tag`, { qs: { versionName } }).then((res) => res.body);

  const waitForVersionOnDefault = (appId, name) =>
    pollUntil(
      () => listVersionsViaAPI(appId, ctx.defaultBranch.id),
      (versions) => versions.some((v) => v.name === name),
      { label: `${name} on default branch` },
    ).then((versions) => versions.find((v) => v.name === name));

  // Feature branch with a pushed app; yields ids + the branch draft to save from.
  const seedBranchApp = (slug) => {
    const appName = `vt-${slug}-${Date.now()}`;
    return createBranchViaAPI(`${ctx.prefix}-${slug}`).then((branch) =>
      seedPushedAppViaAPI({ branch, appName }).then(({ appId, versionId, coRelationId }) => {
        coRelIds.push(coRelationId);
        return { branch, appName, appId, versionId, coRelationId };
      }),
    );
  };

  before(() => {
    setupGitSyncSpec({ specKey: "versions", mode: "multi" }).then((c) => {
      ctx = c;
    });
  });

  beforeEach(() => {
    loginToGitSyncSpec(ctx);
  });

  after(() => {
    coRelIds.forEach((id) => deleteTagsByPrefixViaAPI(id));
    teardownGitSyncSpec();
  });

  it("should tag the feature branch head on GitHub when a version is saved", () => {
    seedBranchApp("tag").then((s) =>
      getBranchHeadViaAPI(s.branch.name).then((head) => {
        checkTagViaAPI(s.appId, "v1").then((body) => {
          expect(body.exists, "no tag before save").to.equal(false);
        });
        saveVersionViaAPI(s.appId, s.versionId, "v1", s.branch.id);
        waitForTagViaAPI(`${s.coRelationId}/v1`).then((tag) => {
          expect(tag.sha, "tag points at the feature branch head").to.equal(head);
          // source: server/ee/app-git/services/versions.service.ts (default message `Version ${dto.name} created`)
          expect(tag.message, "default tag message").to.include("Version v1 created");
        });
        checkTagViaAPI(s.appId, "v1").then((body) => {
          expect(body.exists, "tag exists after save").to.equal(true);
          expect(body.tagName ?? body.tag_name, "tag name").to.equal(`${s.coRelationId}/v1`);
        });
      }),
    );
  });

  it("should use the version description as the tag message", () => {
    const description = `release notes ${Date.now()}`;
    seedBranchApp("desc").then((s) => {
      saveVersionViaAPI(s.appId, s.versionId, "v1", s.branch.id, description);
      waitForTagViaAPI(`${s.coRelationId}/v1`).then((tag) => {
        expect(tag.message, "tag message from description").to.include(description);
      });
    });
  });

  it("should list the saved version on the default branch as published", () => {
    seedBranchApp("main").then((s) => {
      saveVersionViaAPI(s.appId, s.versionId, "v1", s.branch.id);
      waitForVersionOnDefault(s.appId, "v1").then((v1) => {
        expect(v1.status, "saved version is published").to.equal("PUBLISHED");
      });
    });
  });

  // Saved versions can't be renamed (versions/service.ts:441), so the tag must stay as saved.
  it("should keep the GitHub tag unchanged when renaming a saved version is rejected", () => {
    const renamed = "v1-renamed";
    seedBranchApp("rename").then((s) => {
      saveVersionViaAPI(s.appId, s.versionId, "v1", s.branch.id);
      waitForTagViaAPI(`${s.coRelationId}/v1`).then((savedTag) => {
        waitForVersionOnDefault(s.appId, "v1").then((v1) => {
          tjRequest("PUT", `/v2/apps/${s.appId}/versions/${v1.id}`, {
            qs: { branch_id: ctx.defaultBranch.id },
            body: { name: renamed },
          }).then((res) => {
            expect(res.status, `rename v1: ${JSON.stringify(res.body)}`).to.equal(400);
            expect(JSON.stringify(res.body), "rename rejected").to.include(gitSyncText.savedVersionRenameBlocked);
          });
          listVersionsViaAPI(s.appId, ctx.defaultBranch.id).then((versions) => {
            const names = versions.map((v) => v.name);
            expect(names, "saved version keeps its name").to.include("v1");
            expect(names, "no renamed version").to.not.include(renamed);
          });
        });
        getTagViaAPI(`${s.coRelationId}/v1`).then((tag) => {
          expect(tag, "original tag kept").to.not.equal(null);
          expect(tag.sha, "original tag still on the saved commit").to.equal(savedTag.sha);
        });
        getTagViaAPI(`${s.coRelationId}/${renamed}`).then((tag) => {
          expect(tag, "no tag for the rejected name").to.equal(null);
        });
      });
    });
  });

  it("should remove the GitHub tag when the saved version is deleted on the default branch", () => {
    seedBranchApp("tagdel").then((s) => {
      saveVersionViaAPI(s.appId, s.versionId, "v1", s.branch.id);
      waitForTagViaAPI(`${s.coRelationId}/v1`);
      waitForVersionOnDefault(s.appId, "v1").then((v1) => {
        // A branch's only version cannot be deleted, so give the default branch a second one first.
        tjRequest("POST", `/apps/${s.appId}/versions`, {
          qs: { branch_id: ctx.defaultBranch.id },
          body: { versionName: "v2", versionFromId: v1.id },
        }).then((res) => expect(res.status, `create v2: ${JSON.stringify(res.body)}`).to.be.oneOf([200, 201]));
        tjRequest("DELETE", `/app-git/${s.appId}/versions/${v1.id}`, {
          qs: { branch_id: ctx.defaultBranch.id },
        }).then((res) => {
          expect(res.status, `delete v1: ${JSON.stringify(res.body)}`).to.be.oneOf([200, 204]);
        });
        waitForTagViaAPI(`${s.coRelationId}/v1`, { exists: false });
        getTagViaAPI(`${s.coRelationId}/v1`).then((tag) => expect(tag, "tag gone").to.equal(null));
      });
    });
  });
});
