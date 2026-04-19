// Git Sync E2E Test
//
// Flow:
//   SETUP   → create fresh workspace → configure git sync → clean GitHub test branches
//   BLOCK 1 → create sub-branch + verify nav bar UI
//   BLOCK 2 → import app → setup datasource + constants → verify app in builder
//   BLOCK 3 → push commit from dashboard → verify in GitHub
//   BLOCK 4 → create+merge PR via GitHub API → switch to master → pull → verify app/ds/constants functional
//   TEARDOWN → delete feature branch from GitHub → archive workspace

import { gitSyncSelectors as GS } from "Selectors/platform/gitsync";

const FIXTURE = 'gitSync/fixture-app.json';

const gitConfig = {
  repoUrl: 'https://github.com/ajith-k-v/git_sync_branching.git',
  repoOwner: 'ajith-k-v',
  repoName: 'git_sync_branching',
  branch: 'master',
  appId: '1571896',
  installationId: '75191473',
  privateKey: Cypress.env('GITHUB_PRIVATE_KEY'),
};

// ---------------------------------------------------------------------------
describe('Git Sync — E2E Flow', () => {
  const testId = Date.now();

  // Unique workspace per run — isolates tests from other workspaces
  const wsName = `gitsync-e2e-${testId}`;
  const wsSlug = wsName;

  const branchName = `test-feature-${testId}`;
  const appName = `git-sync-app-${testId}`;
  const commitMessage = `test: import fixture app [${testId}]`;

  const DS_BASE_URL = 'https://jsonplaceholder.typicode.com/posts';
  const FIXTURE_DS_NAME = 'REST API';

  // Holds the created workspace ID — set in before(), used in beforeEach + after()
  let workspaceId;

  // ---------------------------------------------------------------------------
  before(() => {
    // Step 1: Login with default credentials
    cy.apiLogin();

    // Step 2: Create a fresh isolated workspace for this test run
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
      cy.log(`[gitSync] Workspace created: ${wsName} (${workspaceId})`);
    });

    // Step 3: Configure git sync on the new workspace
    // gitSyncCheckAndConfigure uses Cypress.env('workspaceId') — set above
    cy.gitSyncCheckAndConfigure();

    // Step 4: Clean up any stale test-* branches from previous runs in GitHub
    cy.gitHubCleanupTestBranches();
  });

  // ---------------------------------------------------------------------------
  after(() => {
    // Delete the feature branch created in this run from GitHub
    cy.apiLogin();
    cy.gitHubDeleteBranch(branchName);

    // Archive the test workspace to keep the instance clean
    // cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  // ---------------------------------------------------------------------------
  // BLOCK 1: Create branch + verify nav bar UI
  // ---------------------------------------------------------------------------
  describe('Block 1: Branch Creation and Nav Bar UI', () => {

    beforeEach(() => {
      cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    it.only('creates feature branch from dashboard and verifies nav bar UI', () => {
      cy.gitSyncGoToDashboard();

      // On master: lock banner should be visible
      cy.get(GS.masterLockBanner).should('be.visible');

      // On master: only Pull button visible, no Commit button
      cy.contains('button', /^Pull$/i).should('be.visible');
      cy.contains('button', /^commit$/i).should('not.exist');

      // Branch dropdown shows master
      cy.get(GS.wsBranchHeader).click();
      cy.get(GS.wsBranchPopover).should('be.visible');
      cy.get(GS.wsCurrentBranch).should('contain.text', gitConfig.branch);

      // Create feature branch via UI
      cy.gitSyncCreateBranchViaUI(branchName);

      // Verify UI updated to new branch
      cy.get(GS.wsCurrentBranch).should('contain.text', branchName);

      // On sub-branch: Commit button appears, Pull still visible
      cy.contains('button', /^commit$/i).should('be.visible');
      cy.contains('button', /^pull$/i).should('be.visible');

      // Master lock banner gone on sub-branch
      cy.get(GS.masterLockBanner).should('not.exist');

      cy.gitSyncSwitchBranch(branchName);
      // Import fixture app via API into the feature branch
      cy.gitSyncImportAppFromFixture(FIXTURE, appName, branchName);

      // Verify app card appears in dashboard after reload
      cy.reload();
      cy.wait(2000)
      cy.get(GS.appCard).contains(appName).should('be.visible');

      // Create workspace constants
      cy.apiCreateWorkspaceConstant('API_BASE_URL', DS_BASE_URL);
      cy.apiCreateWorkspaceConstant('TABLE_LIMIT', '10');

      // Update datasource URL to use workspace constant

      cy.gitSyncOpenAppInBuilder(appName);

      // query_status widget shows "Query completed" when the REST API query succeeds
      cy.get(GS.queryStatusWidget, { timeout: 20000 }).should('contain.text', 'Query completed');

      // Open branch dropdown
      cy.get(GS.wsBranchHeader).click();
      cy.get(GS.wsBranchPopover).should('be.visible');

      // Click Commit/Push CTA inside popover
      cy.contains(GS.wsBranchPopover + ' button', /commit|push/i).click();

      // Push modal opens
      cy.get(GS.modalTitle).should('be.visible');

      // UI CHECK: submit disabled when message is empty
      cy.get(GS.commitMessageInput).should('be.visible').and('have.value', '');
      cy.contains('button', /commit|push/i).last().should('be.disabled');

      // Enter commit message — submit becomes enabled
      cy.get(GS.commitMessageInput).type(commitMessage);
      cy.contains('button', /commit|push/i).last().should('be.enabled');

      // Push
      cy.contains('button', /commit|push/i).last().click();

      // Modal closes on success
      cy.get(GS.commitMessageInput, { timeout: 45000 }).should('not.exist');

      // Verify commit landed in GitHub
      cy.request({
        method: 'GET',
        url: `https://api.github.com/repos/${gitConfig.repoOwner}/${gitConfig.repoName}/branches/${branchName}`,
        headers: {
          Authorization: `Bearer ${Cypress.env('GITHUB_TOKEN')}`,
          Accept: 'application/vnd.github+json',
        },
      }).then((res) => {
        expect(res.status).to.equal(200);
        expect(res.body.commit.commit.message).to.include(commitMessage.slice(0, 30));
        cy.log(`[gitSync] ✓ Commit verified in GitHub on branch '${branchName}'`);
      });
    });

  });

});

// ---------------------------------------------------------------------------
// BLOCK 2: Import app → Setup datasource + constants → Verify in builder
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// BLOCK 3: Push commit from dashboard
// ---------------------------------------------------------------------------
describe('Block 3: Dashboard Push', () => {

  beforeEach(() => {
    cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
    Cypress.env('workspaceSlug', wsSlug);
  });


  // ---------------------------------------------------------------------------
  // BLOCK 4: PR + Merge → Pull to master → Verify
  // ---------------------------------------------------------------------------
  describe('Block 4: PR, Merge, Pull, and Verification on Master', () => {

    beforeEach(() => {
      cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    // ── 2.1 Create and merge PR via GitHub API ────────────────────────────────
    it('creates and merges PR from feature branch to master via GitHub API', () => {
      cy.gitHubCreatePR(
        branchName,
        `test: git-sync-app-${testId} fixture import`,
        gitConfig.branch
      ).then(() => {
        cy.log(`[gitSync] PR #${Cypress.env('prNumber')} created`);
        cy.gitHubMergePR(Cypress.env('prNumber'));
      });
    });

    // ── 2.2 Switch to master and pull from git ────────────────────────────────
    it('switches to master branch and pulls from git — verifies UI', () => {
      cy.gitSyncGoToDashboard();

      // Switch to master
      cy.gitSyncSwitchBranch(gitConfig.branch);
      cy.get(GS.wsCurrentBranch).should('contain.text', gitConfig.branch);

      // Lock banner and Pull-only state restored on master
      cy.get(GS.masterLockBanner).should('be.visible');
      cy.contains('button', /^Pull$/i).should('be.visible');
      cy.contains('button', /^commit$/i).should('not.exist');

      // Open pull modal — verify structure
      cy.contains('button', /^Pull$/i).click();
      cy.get(GS.modalTitle).should('be.visible');
      cy.contains(/select branch/i).should('be.visible');

      // Check for updates and pull
      cy.get(GS.checkForUpdatesLabel).click();
      cy.contains('button', /pull changes/i, { timeout: 30000 }).should('be.enabled').click();

      // Modal closes = pull success
      cy.get(GS.modalTitle, { timeout: 45000 }).should('not.exist');
      cy.log('[gitSync] ✓ Pull from master completed');
    });

    // ── 2.3 Verify app landed on master ──────────────────────────────────────
    it('verifies imported app appears on master branch after pull', () => {
      cy.gitSyncGoToDashboard();
      cy.gitSyncSwitchBranch(gitConfig.branch);

      cy.get(GS.appCard).contains(appName).should('be.visible');
      cy.log(`[gitSync] ✓ App '${appName}' visible on master`);
    });

    // ── 2.4 Verify datasource landed on master ────────────────────────────────
    it('verifies datasource was pulled and exists on master', () => {
      cy.gsGetHeaders().then((headers) => {
        cy.request({
          method: 'GET',
          url: `${Cypress.env('server_host')}/api/data-sources`,
          headers,
        }).then((res) => {
          const datasources = res.body?.data_sources || res.body || [];
          const ds = datasources.find((d) => d.name === FIXTURE_DS_NAME);
          expect(ds, `Datasource '${FIXTURE_DS_NAME}' should exist on master`).to.exist;
          cy.log(`[gitSync] ✓ Datasource '${FIXTURE_DS_NAME}' found on master`);
        });
      });
    });

    // ── 2.5 Verify workspace constants landed ─────────────────────────────────
    it('verifies workspace constants were pulled and exist on master', () => {
      cy.gsGetHeaders().then((headers) => {
        cy.request({
          method: 'GET',
          url: `${Cypress.env('server_host')}/api/workspace-variables`,
          headers,
        }).then((res) => {
          const constants = res.body?.variables || res.body || [];
          const apiBaseUrl = constants.find((c) => c.variable_name === 'API_BASE_URL');
          const tableLimit = constants.find((c) => c.variable_name === 'TABLE_LIMIT');

          expect(apiBaseUrl, 'API_BASE_URL constant should exist').to.exist;
          expect(tableLimit, 'TABLE_LIMIT constant should exist').to.exist;
          expect(apiBaseUrl.variable_value).to.equal(DS_BASE_URL);
          expect(tableLimit.variable_value).to.equal('10');
          cy.log('[gitSync] ✓ Workspace constants verified on master');
        });
      });
    });

    // ── 2.6 Verify app is fully functional on master ──────────────────────────
    it('verifies app is fully functional on master after pull', () => {
      cy.gitSyncGoToDashboard();
      cy.gitSyncSwitchBranch(gitConfig.branch);

      cy.gitSyncOpenAppInBuilder(appName);

      // Validates the full chain: constant → datasource URL → REST API query → widget
      cy.get(GS.queryStatusWidget, { timeout: 20000 }).should('contain.text', 'Query completed');

      cy.log('[gitSync] ✓ App functional on master — query ran successfully');
    });
  });
});
