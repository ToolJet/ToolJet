// Git Sync Custom Commands
// Translated from playwright/git-sync/helpers.js

import { gitSyncSelectors as GS } from "Selectors/platform/gitsync";

// ---------------------------------------------------------------------------
// Utility: get auth cookie + workspace headers
// ---------------------------------------------------------------------------
Cypress.Commands.add('gsGetHeaders', () => {
  return cy.getCookie('tj_auth_token', { log: false }).then((cookie) => {
    return {
      'Tj-Workspace-Id': Cypress.env('workspaceId'),
      Cookie: `tj_auth_token=${cookie.value}`,
    };
  });
});

// ---------------------------------------------------------------------------
// Git sync configuration check + setup via API
// Checks existing config via DB; configures via API if not finalized+enabled.
// ---------------------------------------------------------------------------
Cypress.Commands.add('gitSyncCheckAndConfigure', () => {
  cy.gsGetHeaders().then((headers) => {
    const orgId = Cypress.env('workspaceId');

    // Check current status via ToolJet API
    cy.request({
      method: 'GET',
      url: `${Cypress.env('server_host')}/api/git-sync/${orgId}/status`,
      headers,
      failOnStatusCode: false,
    }).then((res) => {
      const isConfigured = res.status === 200 && res.body?.is_finalized && res.body?.is_enabled;

      if (isConfigured) {
        cy.log('[gitSync] Already configured and enabled — skipping setup');
        return;
      }

      cy.log('[gitSync] Not configured — setting up GitHub HTTPS git sync via API');

      const privateKey = Cypress.env('GITHUB_PRIVATE_KEY');

      cy.request({
        method: 'POST',
        url: `${Cypress.env('server_host')}/api/git-sync/configs`,
        headers,
        body: {
          gitUrl: Cypress.env('GITHUB_REPO_URL'),
          branchName: 'master',
          githubAppId: Cypress.env('GITHUB_APP_ID'),
          githubAppInstallationId: Cypress.env('GITHUB_APP_INSTALLATION_ID'),
          githubAppPrivateKey: privateKey,
          gitType: 'github_https',
        },
      }).then((configRes) => {
        expect(configRes.status, 'Git sync config').to.equal(201);
        cy.log('[gitSync] GitHub HTTPS configured and enabled');
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Workspace branch: get branch ID by name
// ---------------------------------------------------------------------------
Cypress.Commands.add('gitSyncGetBranchId', (branchName) => {
  cy.gsGetHeaders().then((headers) => {
    cy.request({
      method: 'GET',
      url: `${Cypress.env('server_host')}/api/workspace-branches`,
      headers,
    }).then((res) => {
      const branches = Array.isArray(res.body) ? res.body : res.body?.branches || [];
      const branch = branches.find((b) => b?.name === branchName);
      return branch?.id || '';
    });
  });
});

// ---------------------------------------------------------------------------
// Workspace branch: create via API
// ---------------------------------------------------------------------------
Cypress.Commands.add('gitSyncCreateBranchViaApi', (branchName) => {
  cy.gsGetHeaders().then((headers) => {
    cy.request({
      method: 'GET',
      url: `${Cypress.env('server_host')}/api/workspace-branches`,
      headers,
    }).then((res) => {
      const branches = Array.isArray(res.body) ? res.body : res.body?.branches || [];
      const exists = branches.some((b) => b?.name === branchName);

      if (exists) {
        cy.log(`[gitSync] Branch '${branchName}' already exists`);
        return;
      }

      cy.request({
        method: 'POST',
        url: `${Cypress.env('server_host')}/api/workspace-branches`,
        headers,
        body: { name: branchName },
      }).then((branchRes) => {
        expect(branchRes.status, `Create branch '${branchName}'`).to.equal(201);
        cy.log(`[gitSync] Branch '${branchName}' created`);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Import app from fixture file via API (into the given branch)
// Mirrors playwright's importAppViaApi
// ---------------------------------------------------------------------------
Cypress.Commands.add('gitSyncImportAppFromFixture', (fixturePath, appName, branchName) => {
  cy.gsGetHeaders().then((headers) => {
    const orgId = Cypress.env('workspaceId');

    // Get branch ID for the target branch
    cy.request({
      method: 'GET',
      url: `${Cypress.env('server_host')}/api/workspace-branches`,
      headers,
    }).then((branchRes) => {
      const branches = Array.isArray(branchRes.body) ? branchRes.body : branchRes.body?.branches || [];
      const branch = branches.find((b) => b?.name === branchName);
      const branchId = branch?.id || '';

      cy.fixture(fixturePath).then((fixtureData) => {
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

        cy.request({
          method: 'POST',
          url: `${Cypress.env('server_host')}/api/v2/resources/import`,
          headers: {
            tj_auth_token: headers.Cookie.replace('tj_auth_token=', ''),
            'tj-workspace-id': orgId,
          },
          body: fixtureData,
        }).then((importRes) => {
          expect(importRes.status, `Import app '${appName}'`).to.equal(201);
          cy.log(`[gitSync] App '${appName}' imported to branch '${branchName}'`);
        });
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Create workspace constant via API
// ---------------------------------------------------------------------------
Cypress.Commands.add('gitSyncCreateWorkspaceConstant', (name, value) => {
  cy.gsGetHeaders().then((headers) => {
    cy.request({
      method: 'POST',
      url: `${Cypress.env('server_host')}/api/workspace-variables`,
      headers,
      failOnStatusCode: false,
      body: {
        variable_name: name,
        variable_value: value,
        variable_type: 'client',
      },
    }).then((res) => {
      // 201 = created, 409 = already exists (both acceptable)
      expect(res.status, `Create constant '${name}'`).to.be.oneOf([201, 409]);
      cy.log(`[gitSync] Constant '${name}' = '${value}'`);
    });
  });
});

// ---------------------------------------------------------------------------
// Update datasource URL via API (by datasource name)
// ---------------------------------------------------------------------------
Cypress.Commands.add('gitSyncUpdateDatasourceUrl', (dsName, newUrl) => {
  cy.gsGetHeaders().then((headers) => {
    // Find datasource by name
    cy.request({
      method: 'GET',
      url: `${Cypress.env('server_host')}/api/data-sources`,
      headers,
    }).then((res) => {
      const datasources = res.body?.data_sources || res.body || [];
      const ds = datasources.find((d) => d.name === dsName);
      expect(ds, `Datasource '${dsName}' not found`).to.exist;

      const dsId = ds.id;
      const updatedOptions = (ds.options || []).map((opt) => {
        if (opt.key === 'url') return { ...opt, value: newUrl };
        return opt;
      });

      cy.request({
        method: 'PUT',
        url: `${Cypress.env('server_host')}/api/data-sources/${dsId}`,
        headers,
        body: { options: updatedOptions },
      }).then((updateRes) => {
        expect(updateRes.status, `Update datasource '${dsName}'`).to.equal(200);
        cy.log(`[gitSync] Datasource '${dsName}' URL updated to '${newUrl}'`);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// UI: Create feature branch from dashboard branch dropdown
// ---------------------------------------------------------------------------
Cypress.Commands.add('gitSyncCreateBranchViaUI', (branchName) => {
  // Open branch popover only if it is not already open
  cy.get('body').then(($body) => {
    if ($body.find(GS.wsBranchPopover).length === 0) {
      cy.get(GS.wsBranchHeader).click();
    }
  });
  cy.get(GS.wsBranchPopover).should('be.visible');
  cy.get(GS.wsCreateBranchBtn).click();

  cy.get(GS.branchNameInput).should('be.visible').clear().type(branchName);
  cy.contains('button', 'Create branch').click();

  cy.get(GS.branchNameInput).should('not.exist');
  cy.get(GS.wsCurrentBranch).should('contain.text', branchName);
  cy.log(`[gitSync] Branch '${branchName}' created via UI`);
});

// ---------------------------------------------------------------------------
// UI: Switch workspace branch
// ---------------------------------------------------------------------------
Cypress.Commands.add('gitSyncSwitchBranch', (branchName) => {
  cy.get(GS.wsBranchHeader).click();
  cy.get(GS.wsBranchPopover).should('be.visible');
  cy.get(GS.wsSwitchBranchBtn).click();

  cy.get(GS.wsBranchSearchInput).should('be.visible').clear().type(branchName);
  cy.get(GS.wsBranchListItem(branchName)).should('be.visible').click();

  cy.wait(1000);
  cy.get(GS.wsCurrentBranch).should('contain.text', branchName);
  cy.log(`[gitSync] Switched to branch '${branchName}'`);
});

// ---------------------------------------------------------------------------
// UI: Push commit from dashboard (workspace-level commit)
// ---------------------------------------------------------------------------
Cypress.Commands.add('gitSyncDashboardPush', (message) => {
  cy.get(GS.wsBranchHeader).click();
  cy.get(GS.wsBranchPopover).should('be.visible');

  // Push/Commit CTA inside branch popover
  cy.contains(GS.wsBranchPopover + ' button', /commit|push/i).click();

  cy.get(GS.commitMessageInput).should('be.visible');

  // UI checks on modal
  cy.get(GS.commitMessageInput).should('be.visible');
  cy.contains('button', /commit|push/i)
    .filter(':not([disabled])')
    .should('be.disabled'); // disabled when message is empty

  cy.get(GS.commitMessageInput).type(message);

  cy.contains('button', /commit|push/i)
    .filter(':not([disabled])')
    .last()
    .click();

  // Wait for modal to close = success
  cy.get(GS.commitMessageInput, { timeout: 45000 }).should('not.exist');
  cy.log(`[gitSync] Dashboard commit pushed: "${message}"`);
});

// ---------------------------------------------------------------------------
// UI: Pull from git on main branch (dashboard-level pull)
// ---------------------------------------------------------------------------
Cypress.Commands.add('gitSyncDashboardPull', () => {
  // Pull button is visible on master branch only
  cy.contains('button', /^Pull$/i).click();

  cy.get(GS.modalTitle).should('be.visible');

  // Old pull flow: check for updates → pull changes
  cy.get(GS.checkForUpdatesLabel).click();
  cy.contains('button', /pull changes/i, { timeout: 30000 }).should('be.enabled').click();

  cy.get(GS.modalTitle, { timeout: 45000 }).should('not.exist');
  cy.log('[gitSync] Dashboard pull completed');
});

// ---------------------------------------------------------------------------
// UI: Open app in AppBuilder by name
// Mirrors playwright's openAppInBuilder — uses stable data-cy card attribute
// ---------------------------------------------------------------------------
Cypress.Commands.add('gitSyncOpenAppInBuilder', (appName) => {
  cy.get(GS.appCard)
    .contains(appName)
    .closest(GS.appCard)
    .should('be.visible')
    .trigger('mouseover');

  cy.get(GS.appCard)
    .contains(appName)
    .closest(GS.appCard)
    .contains('a', 'Edit')
    .click();

  cy.url({ timeout: 30000 }).should('include', '/apps/');
  cy.waitForAppLoad();
});

// ---------------------------------------------------------------------------
// GitHub API: create PR
// ---------------------------------------------------------------------------
Cypress.Commands.add('gitHubCreatePR', (headBranch, title, baseBranch = 'main') => {
  const owner = Cypress.env('GITHUB_REPO_OWNER');
  const repo = Cypress.env('GITHUB_REPO_NAME');

  cy.request({
    method: 'POST',
    url: `https://api.github.com/repos/${owner}/${repo}/pulls`,
    headers: {
      Authorization: `Bearer ${Cypress.env('GITHUB_TOKEN')}`,
      Accept: 'application/vnd.github+json',
    },
    body: { title, head: headBranch, base: baseBranch },
  }).then((res) => {
    expect(res.status, 'GitHub create PR').to.equal(201);
    Cypress.env('prNumber', res.body.number);
    cy.log(`[gitSync] PR #${res.body.number} created: ${headBranch} → ${baseBranch}`);
    return res.body.number;
  });
});

// ---------------------------------------------------------------------------
// GitHub API: merge PR
// ---------------------------------------------------------------------------
Cypress.Commands.add('gitHubMergePR', (prNumber = Cypress.env('prNumber')) => {
  const owner = Cypress.env('GITHUB_REPO_OWNER');
  const repo = Cypress.env('GITHUB_REPO_NAME');

  cy.request({
    method: 'PUT',
    url: `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/merge`,
    headers: {
      Authorization: `Bearer ${Cypress.env('GITHUB_TOKEN')}`,
      Accept: 'application/vnd.github+json',
    },
    body: { merge_method: 'squash' },
  }).then((res) => {
    expect(res.status, `GitHub merge PR #${prNumber}`).to.equal(200);
    cy.log(`[gitSync] PR #${prNumber} merged to main`);
  });
});

// ---------------------------------------------------------------------------
// GitHub API: delete a single branch
// ---------------------------------------------------------------------------
Cypress.Commands.add('gitHubDeleteBranch', (branchName) => {
  const owner = Cypress.env('GITHUB_REPO_OWNER');
  const repo = Cypress.env('GITHUB_REPO_NAME');

  cy.request({
    method: 'DELETE',
    url: `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branchName}`,
    headers: {
      Authorization: `Bearer ${Cypress.env('GITHUB_TOKEN')}`,
      Accept: 'application/vnd.github+json',
    },
    failOnStatusCode: false,
  }).then((res) => {
    cy.log(`[gitSync] GitHub branch '${branchName}' deleted (${res.status})`);
  });
});

// ---------------------------------------------------------------------------
// GitHub API: cleanup all branches prefixed with 'test-'
// ---------------------------------------------------------------------------
Cypress.Commands.add('gitHubCleanupTestBranches', () => {
  const owner = Cypress.env('GITHUB_REPO_OWNER');
  const repo = Cypress.env('GITHUB_REPO_NAME');

  cy.request({
    method: 'GET',
    url: `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
    headers: {
      Authorization: `Bearer ${Cypress.env('GITHUB_TOKEN')}`,
      Accept: 'application/vnd.github+json',
    },
  }).then((res) => {
    const testBranches = res.body.filter((b) => b.name.startsWith('test-'));
    cy.log(`[gitSync] Cleaning up ${testBranches.length} test branch(es)`);
    testBranches.forEach((branch) => {
      cy.gitHubDeleteBranch(branch.name);
    });
  });
});

// ---------------------------------------------------------------------------
// Navigate to workspace dashboard
// ---------------------------------------------------------------------------
Cypress.Commands.add('gitSyncGoToDashboard', () => {
  const workspace = Cypress.env('workspaceSlug') || '';
  const url = workspace ? `/${workspace}` : '/';
  cy.visit(url);
  cy.wait(3000);
  // Wait for the dashboard header (not app-builder data-queries which don't exist on the dashboard)
  cy.get('[data-cy="dashboard-section-header"]', { timeout: 15000 }).should('be.visible');
});
