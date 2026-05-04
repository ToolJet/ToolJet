// ============================================================================
// Git Sync — Version Tagging on GitHub
// ============================================================================
//
// Tag name format (mirrors server branching-business.util.ts):
//   buildTagName(coRelationId, versionName) = `${coRelationId}/${normalizeGitTag(versionName)}`
//   normalizeGitTag(s) = s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
//
// Tag creation message format (server util.service.ts):
//   `${message || `Version ${versionName} saved`} | ${appName}/${versionName}`
//
// Tag rename message format:
//   `Version renamed from ${oldName} to ${newName} | ${app.name}/${newName}`
//   — NOTE: app.name is read from DB at rename time, so renaming the app BEFORE
//     renaming the version embeds the new app name in the renamed tag message.
//     App rename does NOT auto-commit the folder rename to git (platform git sync);
//     the rename is evidenced in git via the tag message.
//
// Block 1 — Full version-tagging lifecycle:
//   1. Create workspace + configure git (API)
//   2. Create branch, import app, push from editor + dashboard (API), PR, merge (API)
//   3. Pull master (API)
//   4. Open editor → save draft v1 from version switcher (UI)
//   5. Create git tag for v1 → verify tag name (co_relation_id/v1) and message format
//   6. Create v2 → tag v2 → verify tag name and message
//   7. Rename app + rename v2 simultaneously → verify:
//      - old v2 tag gone, new v2-renamed tag exists
//      - renamed tag message contains new app name (git evidence of app rename)
//
// Block 2 — Import by version tag + pull renamed version in editor:
//   1. New workspace + configure git (API)
//   2. Import app from git using v1 tag via UI modal (app name shown = renamed name)
//   3. Open editor → pull renamed v2 version via UI pull modal
//
// Block 3 — Import a git branch that doesn't exist in ToolJet yet:
//   1. Re-use second workspace (from Block 2)
//   2. Dashboard Pull → select the test branch from dropdown
//   3. Confirm "Import {branch} from git" dialog → Continue
//   4. Verify branch is imported into ToolJet
// ============================================================================

import { gitSyncSelectors as GS } from "Selectors/platform/gitsync";

describe(
  "Git Sync — Version Tagging on GitHub",
  { retries: 0 },
  () => {
    // ─── Tag name helpers (mirror server branching-business.util.ts) ─────────
    const normalizeForTag = (s) =>
      s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const buildTagName = (coRelationId, versionName) =>
      `${coRelationId}/${normalizeForTag(versionName)}`;

    const testId = Date.now();
    const wsName = `gitsync-tagging-${testId}`;
    const wsSlug = wsName;
    const FIXTURE = "gitSync/fixture-app.json";
    const appName = `app-tag-${testId}`;
    const branchName = `test-tag-${testId}`;

    // Second workspace constants — defined here so Block 3 can reference them
    const secondWsName = `gitsync-tagging-import-${testId}`;
    const secondWsSlug = secondWsName;

    const VERSION_V1 = "v1";
    const VERSION_V2 = "v2";
    const VERSION_V2_RENAMED = "v2-renamed";

    let workspaceId;
    let secondWorkspaceId;
    let appId;
    let masterBranchId;
    let appCoRelationId;
    let v1VersionId;
    let v2VersionId;
    let renamedAppName; // set in Block 1 rename step; used by Blocks 2 & 3

    // ─── Lifecycle ───────────────────────────────────────────────────────────

    before(() => {
      Cypress.config("redirectionLimit", 20);
    });

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
        workspaceId = res.body.organization_id;
        Cypress.env("workspaceId", workspaceId);
        Cypress.env("workspaceSlug", wsSlug);
        cy.log(`[gitSync] Workspace: ${wsName} (${workspaceId})`);
      });
      cy.then(() => cy.apiLogin("dev@tooljet.io", "password", workspaceId));
      cy.gitSyncCheckAndConfigure();
      cy.gitHubResetRepo();

      cy.gitSyncCreateBranchViaApi(branchName);
      cy.gitSyncGetBranchId(branchName).then((branchId) => {
        cy.apiCreateAppOnBranch(appName, branchId).then((app) => {
          appId = app.id;
          cy.apiGetEditingVersionId(appId, branchId).then((versionId) => {
            // Editor push
            cy.apiEditorPush(appId, versionId, `feat: initial push ${appName}`, branchName, appName);
            cy.gitHubWaitForCommitMessage(branchName, appName);

            // Dashboard push
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

      // Capture co_relation_id — prefix for all tag names
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

    // =========================================================================
    // Block 1 — Save v1 from editor UI, verify tag name + message format,
    //           create v2 tag, rename app + version simultaneously,
    //           verify renamed tag and app name embedded in tag message
    // =========================================================================

    it("saves v1 from UI, verifies tag format + message, creates v2 via UI, renames version via UI and verifies git tags", () => {
      // ── Capture editing version ID before UI save ────────────────────────
      cy.apiGetEditingVersionId(appId, masterBranchId).then((vid) => {
        v1VersionId = vid;
        cy.log(`[gitSync] v1VersionId (editing draft): ${vid}`);
      });

      // ── Open editor ───────────────────────────────────────────────────────
      cy.gitSyncGoToDashboard();
      cy.gitSyncOpenAppInBuilder(appName);

      // ── Save v1 from version switcher ─────────────────────────────────────
      cy.get('[data-cy="version-name"]').eq(0).should("be.visible").click();
      cy.wait(300);

      cy.get(`[data-cy="${VERSION_V1}-save-version-button"]`, { timeout: 10000 })
        .should("be.visible")
        .click();

      cy.get('[data-cy="version-name-input-field"]').should("have.value", VERSION_V1);
      cy.get('[data-cy="create-version-save-button"]').click();
      cy.verifyToastMessage(".go3958317564", "Version Created successfully");
      cy.log(`[gitSync] v1 saved from editor UI`);

      const expectedV1TagName = buildTagName(appCoRelationId, VERSION_V1);

      // ── Verify v1 auto-created tag on GitHub ──────────────────────────────
      // Tag creation is fire-and-forget in the UI — wait for it to appear.
      cy.gitHubWaitForTag(expectedV1TagName).then((tag) => {
        expect(tag, `v1 tag auto-created on GitHub`).to.not.be.null;
        expect(tag.message, "v1 tag message contains appName/versionName path").to.include(
          `${appName}/${VERSION_V1}`,
        );
        cy.log(`[gitSync] ✓ v1 auto-tag message: '${tag.message}'`);
      });

      // check-tag: exists + tag name format co_relation_id/normalized_version_name
      cy.apiCheckTagExists(appId, VERSION_V1).then(({ exists, tagName }) => {
        expect(exists, "check-tag: v1 exists").to.equal(true);
        expect(tagName, "check-tag: v1 tagName format").to.equal(expectedV1TagName);
        const [coRelPart, verPart] = tagName.split("/");
        expect(coRelPart, "tag prefix is app co_relation_id UUID").to.equal(appCoRelationId);
        expect(verPart, "version part is normalized").to.equal(normalizeForTag(VERSION_V1));
      });

      // ── Create v2 draft from version switcher UI ──────────────────────────
      cy.get('[data-cy="version-name"]').eq(0).should("be.visible").click();
      cy.wait(300);

      cy.get('[data-cy="create-draft-version-button"]').should("be.visible").click();

      // Select "from v1" in the source dropdown
      cy.get('[data-cy="create-draft-version-from-input-field"]').click();
      cy.contains(`[id*="react-select-"]`, VERSION_V1).click();

      cy.get('[data-cy="version-name-input-field"]').clear().type(VERSION_V2);
      cy.get('[data-cy="create-draft-version-create-button"]').click();
      cy.log(`[gitSync] v2 draft created via UI`);

      // ── Save v2 — auto-triggers tag creation ──────────────────────────────
      cy.get('[data-cy="version-name"]').eq(0).should("be.visible").click();
      cy.wait(300);

      cy.get(`[data-cy="${VERSION_V2}-save-version-button"]`, { timeout: 10000 })
        .should("be.visible")
        .click();

      cy.get('[data-cy="version-name-input-field"]').should("have.value", VERSION_V2);
      cy.get('[data-cy="create-version-save-button"]').click();
      cy.verifyToastMessage(".go3958317564", "Version Created successfully");
      cy.log(`[gitSync] v2 saved from editor UI`);

      // ── Verify v2 auto-created tag on GitHub ──────────────────────────────
      const expectedV2TagName = buildTagName(appCoRelationId, VERSION_V2);

      // Tag creation is fire-and-forget in the UI — wait for it to appear.
      cy.gitHubWaitForTag(expectedV2TagName).then((tag) => {
        expect(tag, `v2 tag auto-created on GitHub`).to.not.be.null;
        expect(tag.message, "v2 tag message contains appName/v2 path").to.include(
          `${appName}/${VERSION_V2}`,
        );
        cy.log(`[gitSync] ✓ v2 auto-tag message: '${tag.message}'`);
      });

      cy.apiCheckTagExists(appId, VERSION_V2).then(({ exists, tagName }) => {
        expect(exists, "check-tag: v2 exists").to.equal(true);
        expect(tagName, "check-tag: v2 tagName format").to.equal(expectedV2TagName);
      });

      // ── Rename app (API) — must happen before version rename so the tag
      //    rename message embeds the new app name (app.name read from DB at
      //    renameGitTag time) ─────────────────────────────────────────────────
      renamedAppName = `${appName}-renamed`;
      cy.apiRenameApp(appId, renamedAppName);

      // ── Rename v2 → v2-renamed via version switcher UI ───────────────────
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
      cy.log(`[gitSync] v2 renamed to '${VERSION_V2_RENAMED}' via UI`);

      // ── Verify renamed tag on GitHub ──────────────────────────────────────
      const oldTagName = buildTagName(appCoRelationId, VERSION_V2);
      const newTagName = buildTagName(appCoRelationId, VERSION_V2_RENAMED);

      // Old v2 tag must be gone (version rename deletes it)
      cy.gitHubWaitForTagGone(oldTagName);

      // New tag must exist — message embeds the renamed app name (git evidence of app rename)
      // Version rename triggers a server-side rename-commit event which is also async.
      cy.gitHubWaitForTag(newTagName).then((tag) => {
        expect(tag, `renamed tag '${newTagName}' exists`).to.not.be.null;
        expect(
          tag.message,
          "renamed tag message contains new version name",
        ).to.include(VERSION_V2_RENAMED);
        expect(
          tag.message,
          "renamed tag message contains renamed app name (git evidence of app rename)",
        ).to.include(`${renamedAppName}/${VERSION_V2_RENAMED}`);
        cy.log(
          `[gitSync] ✓ App+version rename verified on git via tag '${newTagName}': '${tag.message}'`,
        );
      });

      // check-tag: old version name no longer resolves, renamed version resolves correctly
      cy.apiCheckTagExists(appId, VERSION_V2).then(({ exists }) => {
        expect(exists, "check-tag: old v2 tag no longer exists after rename").to.equal(false);
      });
      cy.apiCheckTagExists(appId, VERSION_V2_RENAMED).then(({ exists, tagName }) => {
        expect(exists, "check-tag: v2-renamed exists").to.equal(true);
        expect(tagName, "check-tag: renamed tagName format").to.equal(newTagName);
      });
    });

    // =========================================================================
    // Block 2 — Import app using v1 tag in a new workspace (app name shown
    //           is the renamed name), then pull renamed v2 version in editor
    // =========================================================================

    it.only("imports app using v1 tag (app shows renamed name) and pulls renamed v2 version in editor", () => {
      // ── Phase 1: Create v1 + v2 versions via API and ensure tags exist ────
      // beforeEach leaves app pulled to master with no named versions/tags.
      // apiCreateAppVersion may not trigger auto-tag — check and create explicitly.

      cy.apiGetEditingVersionId(appId, masterBranchId).then((draftVersionId) => {
        cy.apiCreateAppVersion(appId, VERSION_V1, draftVersionId, masterBranchId).then((v1) => {
          v1VersionId = v1.id;
          cy.apiCheckTagExists(appId, VERSION_V1).then(({ exists }) => {
            if (!exists) {
              cy.log("[gitSync] v1 tag not auto-created by API — creating explicitly");
              cy.apiCreateGitTag(appId, v1VersionId);
            }
          });
        });
      });

      // Barrier: v1VersionId is set; create v2
      cy.then(() => {
        cy.apiCreateAppVersion(appId, VERSION_V2, v1VersionId, masterBranchId).then((v2) => {
          v2VersionId = v2.id;
          cy.apiCheckTagExists(appId, VERSION_V2).then(({ exists }) => {
            if (!exists) {
              cy.log("[gitSync] v2 tag not auto-created by API — creating explicitly");
              cy.apiCreateGitTag(appId, v2VersionId);
            }
          });
        });
      });

      // Barrier: rename app before version rename so the tag message embeds
      // the new app name (app.name is read from DB at renameGitTag time),
      // then rename v2 → v2-renamed (triggers git tag rename server-side)
      cy.then(() => {
        renamedAppName = `${appName}-renamed`;
        cy.apiRenameApp(appId, renamedAppName);
        cy.apiRenameAppVersion(appId, v2VersionId, VERSION_V2_RENAMED);
      });

      // Barrier: verify tags are present (server-side) and wait for GitHub
      // propagation before driving the import UI
      cy.then(() => {
        cy.apiCheckTagExists(appId, VERSION_V1).then(({ exists, tagName }) => {
          expect(exists, "v1 tag present before import").to.be.true;
          cy.log(`[gitSync] v1 tag confirmed: ${tagName}`);
        });
        cy.apiCheckTagExists(appId, VERSION_V2_RENAMED).then(({ exists, tagName }) => {
          expect(exists, "v2-renamed tag present before import").to.be.true;
          cy.log(`[gitSync] v2-renamed tag confirmed: ${tagName}`);
        });
        cy.gitHubWaitForTag(buildTagName(appCoRelationId, VERSION_V1));
        cy.gitHubWaitForTag(buildTagName(appCoRelationId, VERSION_V2_RENAMED));
      });

      // ── Phase 2: Create second workspace + configure git ──────────────────
      cy.apiLogin();
      cy.apiCreateWorkspace(secondWsName, secondWsSlug).then((res) => {
        secondWorkspaceId = res.body.organization_id;
        Cypress.env("workspaceId", secondWorkspaceId);
        Cypress.env("workspaceSlug", secondWsSlug);
        cy.log(`[gitSync] Second workspace: ${secondWsName} (${secondWorkspaceId})`);
      });
      cy.then(() => cy.apiLogin("dev@tooljet.io", "password", secondWorkspaceId));
      cy.gitSyncCheckAndConfigure();

      // ── Phase 3: Import app from git using v1 tag — app name = renamed name
      cy.gitSyncGoToDashboard();

      cy.get('[data-cy="import-dropdown-menu"]').click();
      cy.get('[data-cy="import-from-git-button"]').should("be.visible").click();
      cy.contains("Import app from git repository").should("be.visible");

      // Select master branch
      cy.get('[data-cy="branch-select"] .react-select__control').click();
      cy.get(".react-select__option").contains("master").click();

      // App dropdown shows the RENAMED app name (not original appName)
      cy.get('[data-cy="app-select"] .react-select__control', { timeout: 10000 }).click();
      cy.then(() => {
        cy.get(".react-select__option").contains(renamedAppName).click();
      });

      // App name input field defaults to the renamed app name
      cy.then(() => {
        cy.get('[data-cy="modal-body"] input.form-control').should("have.value", renamedAppName);
      });

      // Select v1 tag in the version dropdown
      cy.get('[data-cy="version-select"]', { timeout: 10000 }).should("be.visible");
      cy.get('[data-cy="version-select"] .react-select__control').click();
      cy.get(".react-select__option").contains(VERSION_V1).click();

      cy.contains("button", "Import app").should("be.enabled").click();
      cy.url({ timeout: 30000 }).should("include", "/apps/");
      cy.waitForAppLoad();
      cy.log(`[gitSync] ✓ App imported from git using v1 tag`);

      // ── Phase 4: Pull renamed v2 version in the editor ───────────────────
      cy.contains("button", /^Pull$/i, { timeout: 10000 }).click();
      cy.contains("Pull commit").should("be.visible");

      cy.get('[data-cy="branch-select"] .react-select__control').click();
      cy.get(".react-select__option").contains("master").click();

      cy.get('[data-cy="version-select"] .react-select__control', { timeout: 10000 }).click();
      cy.get(".react-select__option").contains(VERSION_V2_RENAMED).click();

      cy.contains("button", "Pull changes").should("be.enabled").click();
      cy.contains("button", "Pull changes", { timeout: 30000 }).should("not.exist");

      cy.log(`[gitSync] ✓ Editor pulled renamed version '${VERSION_V2_RENAMED}'`);
    });

    // =========================================================================
    // Block 3 — Import the test branch from git into ToolJet
    //
    // The test branch (branchName) was pushed to git in Block 1's setup but
    // does not exist in the second workspace. Selecting it from the Pull Commit
    // modal triggers the "Import {branch} from git" confirmation dialog.
    // =========================================================================

    it("imports test branch from git that does not exist in ToolJet — confirms import dialog and proceeds", () => {
      // ── Re-login to second workspace (created in Block 2) ─────────────────
      cy.then(() => {
        expect(secondWorkspaceId, "secondWorkspaceId set by Block 2").to.be.a(
          "string",
        );
        Cypress.env("workspaceId", secondWorkspaceId);
        Cypress.env("workspaceSlug", secondWsSlug);
      });
      cy.then(() =>
        cy.apiLogin("dev@tooljet.io", "password", secondWorkspaceId),
      );

      cy.gitSyncGoToDashboard();

      // On master: Pull button is visible in the header
      cy.contains("button", /^Pull$/i, { timeout: 10000 }).should("be.visible").click();

      // Pull Commit modal opens
      cy.contains("Pull commit").should("be.visible");

      // Open branch dropdown — shows all branches available in the git repo
      cy.get('[data-cy="branch-select"] .react-select__control').click();

      // Select the test branch that was pushed to git but does not exist in
      // this workspace's ToolJet
      cy.get(".react-select__option", { timeout: 10000 })
        .contains(branchName)
        .click();

      // ── Verify the import confirmation dialog ─────────────────────────────
      // Screenshot 12.29.22: "{branchName} branch does not exist in ToolJet,
      // pulling this will import it as a new branch with the latest commit.
      // Do you want to proceed?"
      cy.contains(`Import ${branchName} from git`).should("be.visible");
      cy.contains(
        "branch does not exist in ToolJet",
        { timeout: 10000 },
      ).should("be.visible");
      cy.contains("pulling this will import it as a new branch").should("be.visible");

      // ── Confirm import ─────────────────────────────────────────────────────
      cy.contains("button", "Continue").should("be.enabled").click();

      // Wait for import to complete (dialog/modal closes)
      cy.contains("button", "Continue", { timeout: 30000 }).should("not.exist");
      cy.wait(3000);

      // ── Verify branch is now available in ToolJet ─────────────────────────
      cy.gitSyncGetBranchId(branchName).then((importedBranchId) => {
        expect(importedBranchId, `'${branchName}' imported into ToolJet`).to.be.a(
          "string",
        );
        expect(importedBranchId, "imported branch has a valid ID").to.not.equal("");
        cy.log(
          `[gitSync] ✓ Branch '${branchName}' imported — id: ${importedBranchId}`,
        );
      });
    });
  },
);
