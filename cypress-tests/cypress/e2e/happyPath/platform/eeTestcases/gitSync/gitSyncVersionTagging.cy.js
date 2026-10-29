import { gitSyncSelectors as GS } from "Selectors/platform/gitsync";

describe(
  "Git Sync — Version Tagging on GitHub",
  { retries: 0 },
  () => {
    const normalizeForTag = (s) =>
      s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const buildTagName = (coRelationId, versionName) =>
      `${coRelationId}/${normalizeForTag(versionName)}`;

    // testRunIndex ensures unique slugs per test to avoid 409 conflicts on re-runs
    const testId = Date.now();
    let testRunIndex = 0;

    let wsName;
    let wsSlug;
    let appName;
    let branchName;
    let secondWsName;
    let secondWsSlug;

    const FIXTURE = "gitSync/fixture-app.json";

    const VERSION_V1 = "v1";
    const VERSION_V2 = "v2";
    const VERSION_V2_RENAMED = "v2-renamed";

    let workspaceId;
    let secondWorkspaceId;
    let savedSecondWsSlug; // persists across tests; beforeEach overwrites secondWsSlug each run
    let appId;
    let masterBranchId;
    let appCoRelationId;
    let v1VersionId;
    let v2VersionId;
    let renamedAppName;

    before(() => {
      Cypress.config("redirectionLimit", 20);
    });

    beforeEach(() => {
      const runId = `${testId}-${testRunIndex++}`;
      wsName = `gitsync-tagging-${runId}`;
      wsSlug = wsName;
      appName = `app-tag-${runId}`;
      branchName = `test-tag-${runId}`;
      secondWsName = `gitsync-tagging-import-${runId}`;
      secondWsSlug = secondWsName;

      cy.apiLogin();
      cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
        workspaceId = res.body.organization_id;
        Cypress.env("workspaceId", workspaceId);
        Cypress.env("workspaceSlug", wsSlug);
      });
      cy.then(() => cy.apiLogin("dev@tooljet.io", "password", workspaceId));
      cy.gitSyncCheckAndConfigure();
      cy.gitHubResetRepo();

      cy.gitSyncCreateBranchViaApi(branchName);
      cy.gitSyncGetBranchId(branchName).then((branchId) => {
        cy.apiCreateAppOnBranch(appName, branchId).then((app) => {
          appId = app.id;
          cy.apiGetEditingVersionId(appId, branchId).then((versionId) => {
            cy.apiEditorPush(appId, versionId, `feat: initial push ${appName}`, branchName, appName);
            cy.gitHubWaitForCommitMessage(branchName, appName);
            cy.apiGitSyncPush(`feat: dashboard push ${appName}`, branchId);
            cy.gitHubWaitForCommitMessage(branchName, "dashboard push");
          });
        });
      });

      // PR + merge
      cy.gitHubWaitForCommitsAhead(branchName, "master");
      cy.gitHubCreatePR(branchName, `PR: ${appName}`, "master").then((pr) =>
        cy.gitHubMergePR(pr),
      );

      // Switch to master + pull
      cy.gitSyncGetBranchId("master").then((mId) => {
        masterBranchId = mId;
        cy.apiSwitchBranch(masterBranchId);
        cy.apiGitSyncPull(masterBranchId);
      });

      // co_relation_id prefixes all git tag names
      cy.then(() => {
        cy.apiGetAppDefinition(appId).then((appV2) => {
          appCoRelationId = appV2.co_relation_id || appV2.id;
          cy.log(`[gitSync] appCoRelationId: ${appCoRelationId}`);
        });
      });
    });

    after(() => {
      cy.apiLogin();
      cy.then(() => cy.apiArchiveWorkspace(workspaceId));
      cy.then(() => {
        if (secondWorkspaceId) cy.apiArchiveWorkspace(secondWorkspaceId);
      });
    });

    it("saves v1 from UI, verifies tag format + message, creates v2 via UI, renames version via UI and verifies git tags", () => {
      cy.apiGetEditingVersionId(appId, masterBranchId).then((vid) => {
        v1VersionId = vid;
        cy.log(`[gitSync] v1VersionId: ${vid}`);
      });

      cy.gitSyncGoToDashboard();
      cy.gitSyncOpenAppInBuilder(appName);

      // Save v1
      cy.get('[data-cy="version-name"]').eq(0).should("be.visible").click();
      cy.wait(300);
      cy.get(`[data-cy="${VERSION_V1}-save-version-button"]`, { timeout: 10000 })
        .should("be.visible")
        .click();
      cy.get('[data-cy="version-name-input-field"]').should("have.value", VERSION_V1);
      cy.get('[data-cy="create-version-save-button"]').click();
      cy.verifyToastMessage(".go3958317564", "Version Created successfully");

      const expectedV1TagName = buildTagName(appCoRelationId, VERSION_V1);

      // Tag creation is async — poll until it appears
      cy.gitHubWaitForTag(expectedV1TagName).then((tag) => {
        expect(tag, `v1 tag auto-created on GitHub`).to.not.be.null;
        expect(tag.message, "v1 tag message contains appName/versionName path").to.include(
          `${appName}/${VERSION_V1}`,
        );
      });

      cy.apiCheckTagExists(appId, VERSION_V1).then(({ exists, tagName }) => {
        expect(exists, "v1 exists").to.equal(true);
        expect(tagName, "v1 tagName format").to.equal(expectedV1TagName);
        const [coRelPart, verPart] = tagName.split("/");
        expect(coRelPart, "tag prefix is co_relation_id").to.equal(appCoRelationId);
        expect(verPart, "version part is normalized").to.equal(normalizeForTag(VERSION_V1));
      });

      // Create v2 draft
      cy.get('[data-cy="version-name"]').eq(0).should("be.visible").click();
      cy.wait(300);
      cy.get('[data-cy="create-draft-version-button"]').should("be.visible").click();
      cy.get('[data-cy="create-draft-version-from-input-field"]').click();
      cy.contains(`[id*="react-select-"]`, VERSION_V1).click();
      cy.get('[data-cy="version-name-input-field"]').clear().type(VERSION_V2);
      cy.get('[data-cy="create-draft-version-create-button"]').click();

      // Save v2
      cy.get('[data-cy="version-name"]').eq(0).should("be.visible").click();
      cy.wait(300);
      cy.get(`[data-cy="${VERSION_V2}-save-version-button"]`, { timeout: 10000 })
        .should("be.visible")
        .click();
      cy.get('[data-cy="version-name-input-field"]').should("have.value", VERSION_V2);
      cy.get('[data-cy="create-version-save-button"]').click();
      cy.verifyToastMessage(".go3958317564", "Version Created successfully");

      const expectedV2TagName = buildTagName(appCoRelationId, VERSION_V2);

      cy.gitHubWaitForTag(expectedV2TagName).then((tag) => {
        expect(tag, `v2 tag auto-created on GitHub`).to.not.be.null;
        expect(tag.message, "v2 tag message contains appName/v2 path").to.include(
          `${appName}/${VERSION_V2}`,
        );
      });

      cy.apiCheckTagExists(appId, VERSION_V2).then(({ exists, tagName }) => {
        expect(exists, "v2 exists").to.equal(true);
        expect(tagName, "v2 tagName format").to.equal(expectedV2TagName);
      });

      // Rename app before version rename — tag message reads app.name from DB at rename time
      renamedAppName = `${appName}-renamed`;
      cy.apiRenameApp(appId, renamedAppName);

      // Rename v2 → v2-renamed
      cy.get('[data-cy="version-name"]').eq(0).should("be.visible").click();
      cy.wait(300);
      cy.get(`[data-cy="${VERSION_V2}-version-more-menu-button"]`, { timeout: 10000 })
        .should("be.visible")
        .click();
      cy.get(`[data-cy="${VERSION_V2}-edit-version-button"]`).should("be.visible").click();
      cy.get('[data-cy="edit-version-name-input-field"]', { timeout: 10000 })
        .should("be.visible")
        .clear()
        .type(VERSION_V2_RENAMED);
      cy.get('[data-cy="save-button"]').click();

      const oldTagName = buildTagName(appCoRelationId, VERSION_V2);
      const newTagName = buildTagName(appCoRelationId, VERSION_V2_RENAMED);

      // Old tag is deleted by the version rename
      cy.gitHubWaitForTagGone(oldTagName);

      // version-rename-commit event is async — poll until new tag appears
      cy.gitHubWaitForTag(newTagName).then((tag) => {
        expect(tag, `renamed tag '${newTagName}' exists`).to.not.be.null;
        expect(tag.message, "renamed tag message contains new version name").to.include(VERSION_V2_RENAMED);
        expect(tag.message, "renamed tag message contains renamed app name").to.include(
          `${renamedAppName}/${VERSION_V2_RENAMED}`,
        );
      });

      cy.apiCheckTagExists(appId, VERSION_V2).then(({ exists }) => {
        expect(exists, "old v2 tag gone after rename").to.equal(false);
      });
      cy.apiCheckTagExists(appId, VERSION_V2_RENAMED).then(({ exists, tagName }) => {
        expect(exists, "v2-renamed exists").to.equal(true);
        expect(tagName, "renamed tagName format").to.equal(newTagName);
      });
    });

    it("imports app using v1 tag (app shows renamed name) and pulls renamed v2 version in editor", () => {
      // Stub versions are lazily hydrated when the editor opens. Call ensure-draft
      // explicitly so the API-only flow gets a real DRAFT before apiGetEditingVersionId.
      cy.apiEnsureAppDraft(appId, masterBranchId);

      // Use apiSaveAppVersion (PUT) not apiCreateAppVersion (POST) — branching mode
      // only allows one draft per branch at a time.
      cy.apiGetEditingVersionId(appId, masterBranchId).then((draftVersionId) => {
        cy.apiSaveAppVersion(appId, draftVersionId, VERSION_V1, masterBranchId).then((v1) => {
          v1VersionId = v1.id;
          cy.apiCheckTagExists(appId, VERSION_V1).then(({ exists }) => {
            if (!exists) {
              cy.log("[gitSync] v1 tag not auto-created — creating explicitly");
              cy.apiCreateGitTag(appId, v1VersionId);
            }
          });
        });
      });

      // v1 is now PUBLISHED — POST /versions is allowed (no active non-BRANCH DRAFT remains)
      cy.then(() => {
        cy.apiCreateAppVersion(appId, VERSION_V2, v1VersionId, masterBranchId).then((v2Draft) => {
          v2VersionId = v2Draft.id;
          cy.apiCheckTagExists(appId, VERSION_V2).then(({ exists }) => {
            if (!exists) {
              cy.log("[gitSync] v2 tag not auto-created — creating explicitly");
              cy.apiCreateGitTag(appId, v2VersionId);
            }
          });
        });
      });

      // Rename app before version rename — tag message reads app.name from DB at rename time
      cy.then(() => {
        renamedAppName = `${appName}-renamed`;
        cy.apiRenameApp(appId, renamedAppName);
        cy.apiRenameAppVersion(appId, v2VersionId, VERSION_V2_RENAMED);
      });

      // v2-renamed tag propagation is async — wait for GitHub before importing
      cy.then(() => {
        cy.apiCheckTagExists(appId, VERSION_V1).then(({ exists }) => {
          expect(exists, "v1 tag present before import").to.be.true;
        });
        cy.gitHubWaitForTag(buildTagName(appCoRelationId, VERSION_V2_RENAMED)).then((tag) => {
          expect(tag, "v2-renamed tag present on GitHub before import").to.not.be.null;
        });
        cy.gitHubWaitForTag(buildTagName(appCoRelationId, VERSION_V1));
      });

      // Create second workspace + configure git sync
      cy.apiLogin();
      cy.apiCreateWorkspace(secondWsName, secondWsSlug).then((res) => {
        secondWorkspaceId = res.body.organization_id;
        savedSecondWsSlug = secondWsSlug;
        Cypress.env("workspaceId", secondWorkspaceId);
        Cypress.env("workspaceSlug", secondWsSlug);
      });
      cy.then(() => cy.apiLogin("dev@tooljet.io", "password", secondWorkspaceId));
      cy.gitSyncCheckAndConfigure();

      // Import app from git using v1 tag
      cy.gitSyncGoToDashboard();
      cy.get('[data-cy="import-dropdown-menu"]').click();
      cy.get('[data-cy="import-from-git-button"]').should("be.visible");
      cy.wait(500);
      cy.get('[data-cy="import-from-git-button"]').click();
      cy.contains("Import app from git repository").should("be.visible");

      cy.get('[data-cy="branch-select"] .react-select__control').click();
      cy.get(".react-select__option").contains("master").click();

      // App dropdown lists by git folder name (original name at push time — app rename
      // does not auto-commit a folder rename)
      cy.get('[data-cy="app-select"] .react-select__control', { timeout: 10000 }).click();
      cy.then(() => {
        cy.get(".react-select__option").contains(appName).click();
      });

      // App name input defaults to the original folder name from git
      cy.then(() => {
        cy.get('[data-cy="modal-body"] input.form-control').should("have.value", appName);
      });

      cy.get('[data-cy="version-select"]', { timeout: 10000 }).should("be.visible");
      cy.get('[data-cy="version-select"] .react-select__control').click();
      cy.get(".react-select__option").contains(VERSION_V1).click();

      cy.contains("button", "Import app").should("be.enabled").click();
      cy.url({ timeout: 30000 }).should("include", "/apps/");
      cy.waitForAppLoad();

      // Pull renamed v2 version in editor
      cy.get(GS.lifecycleCTABtn).click();
      cy.contains("Pull commit").should("be.visible");
      cy.get(GS.checkForUpdatesLabel, { timeout: 10000 }).should("be.visible").click();

      cy.get(GS.branchSelect, { timeout: 20000 }).should("be.visible").click();
      cy.contains('[role="option"]', "master").click();

      // Version dropdown appears only after branch matches the configured branch
      cy.get(GS.versionSelect, { timeout: 10000 }).should("be.visible").click();
      cy.contains('[role="option"]', VERSION_V2_RENAMED).click();

      cy.get(GS.pullModalPullChangesBtn).should("be.enabled").click();
      cy.get(GS.pullModalPullChangesBtn, { timeout: 30000 }).should("not.exist");
    });

    it("imports test branch from git that does not exist in ToolJet — confirms import dialog and proceeds", () => {
      cy.then(() => {
        expect(secondWorkspaceId, "secondWorkspaceId set by prior test").to.be.a("string");
        Cypress.env("workspaceId", secondWorkspaceId);
        // Use savedSecondWsSlug — beforeEach overwrites secondWsSlug each run
        Cypress.env("workspaceSlug", savedSecondWsSlug);
      });
      cy.then(() => cy.apiLogin("dev@tooljet.io", "password", secondWorkspaceId));

      cy.gitSyncGoToDashboard();
      cy.get(GS.wsGitPullBtn).should("be.visible").click();
      cy.contains("Pull Commit").should("be.visible");

      // Update check required before branch dropdown appears
      cy.get(GS.checkForUpdatesLabel, { timeout: 10000 }).should("be.visible").click();

      cy.get(GS.branchSelect, { timeout: 20000 }).should("be.visible").click();
      cy.contains('[role="option"]', branchName, { timeout: 10000 }).click();

      // Import confirmation dialog
      cy.contains(`Import ${branchName} from git`).should("be.visible");
      cy.contains("branch does not exist in ToolJet", { timeout: 10000 }).should("be.visible");
      cy.contains("pulling this will import it as a new branch").should("be.visible");

      cy.get(GS.modalContinueBtn).should("be.enabled").click();
      cy.get(GS.modalContinueBtn, { timeout: 30000 }).should("not.exist");
      cy.wait(3000);

      // Verify branch imported into ToolJet
      cy.gitSyncGetBranchId(branchName).then((importedBranchId) => {
        expect(importedBranchId, `'${branchName}' imported into ToolJet`).to.be.a("string");
        expect(importedBranchId, "imported branch has a valid ID").to.not.equal("");
      });
    });
  },
);
