import { INestApplication } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { createUser, initTestApp, logout, login, closeTestApp, ensureAppEnvironments } from 'test-helper';
import * as request from 'supertest';

// Real configuration pointing at a local Gitea / GitHub Enterprise instance.
// Tests in the save+retrieve block and the App git life cycle hit this
// server for real (no stubs). All URLs are derived from TEST_GIT_BASE_URL +
// TEST_GIT_REPO_PATH so changing the host needs only one override.
// Required environment variables for this suite. No defaults: a missing or
// empty value is a hard error so misconfigured CI fails loudly instead of
// silently hitting the wrong host or sending placeholder credentials.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Single source of truth for the Gitea / GitHub Enterprise test server.
// Set TEST_GIT_BASE_URL to point at the host; everything else (repo URL,
// enterprise URL, API URL, reset/merge admin endpoints, the {owner, repo}
// pair used in admin merges) is derived from these two values.
const GIT_BASE_URL = requireEnv('TEST_GIT_BASE_URL').replace(/\/$/, '');
const GIT_REPO_PATH = (process.env.TEST_GIT_REPO_PATH || 'gsmithun4/e2e').replace(/^\/|\/$/g, '');
const [GIT_REPO_OWNER, GIT_REPO_NAME] = GIT_REPO_PATH.split('/');

// GitHub App credentials — read from env, no fallbacks.
const GITHUB_HTTPS_PAYLOAD = {
  gitUrl: `${GIT_BASE_URL}/${GIT_REPO_PATH}`,
  branchName: process.env.TEST_GIT_HTTPS_BRANCH || 'main',
  githubEnterpriseUrl: GIT_BASE_URL,
  githubEnterpriseApiUrl: `${GIT_BASE_URL}/api/v3`,
  githubAppId: requireEnv('TOOLJET_GITHUB_APP_ID'),
  githubAppInstallationId: requireEnv('TOOLJET_GITHUB_INSTALLATION_ID'),
  // PEM keys stored in .env carry literal "\n" escapes (dotenv doesn't unescape
  // them). The server parses the key as-is via forge.pki.privateKeyFromPem, so
  // restore real newlines here or PEM parsing fails with a 400.
  githubAppPrivateKey: requireEnv('TOOLJET_GITHUB_APP_PRIVATE_KEY').replace(/\\n/g, '\n'),
  gitType: 'github_https',
};

// Basic-auth header for the Gitea simulator admin endpoints (reset / merge /
// files). Credentials come from env with no defaults.
requireEnv('TOOLJET_GIT_ADMIN_USER');
requireEnv('TOOLJET_GIT_ADMIN_PASSWORD');
const BASIC =
  'Basic ' +
  Buffer.from(`${process.env.TOOLJET_GIT_ADMIN_USER}:${process.env.TOOLJET_GIT_ADMIN_PASSWORD}`).toString('base64');

/**
 * @group platform
 */
describe('GitSyncController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let tokenCookie: string;
    let orgId: string;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      const { organization } = await createUser(app, {
        email: 'admin@tooljet.io',
        firstName: 'user',
        lastName: 'name',
      });
      orgId = organization.id;
      const { tokenCookie: tokenCookieData } = await login(app);
      tokenCookie = tokenCookieData;
    });

    afterEach(async () => {
      await logout(app, tokenCookie, orgId);
      jest.resetAllMocks();
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60000);

    describe('GET /api/git-sync/:id | Get organization git config', () => {
      it('should return 401 if the auth token is missing', async () => {
        await request
          .agent(app.getHttpServer())
          .get(`/api/git-sync/${orgId}`)
          .set('tj-workspace-id', orgId)
          .expect(401);
      });

      it('should return 401 if the user is not in the specific organization', async () => {
        const { organization } = await createUser(app, {
          email: 'admin2@tooljet.io',
          firstName: 'user',
          lastName: 'name',
        });

        await request
          .agent(app.getHttpServer())
          .get(`/api/git-sync/${organization.id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', organization.id)
          .expect(401);
      });

      it('should return the organization git config for a valid session', async () => {
        await request
          .agent(app.getHttpServer())
          .get(`/api/git-sync/${orgId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
      });
    });

    describe('GET /api/git-sync/:id/status | Get organization git status', () => {
      it('should return 401 if the auth token is missing', async () => {
        await request
          .agent(app.getHttpServer())
          .get(`/api/git-sync/${orgId}/status`)
          .set('tj-workspace-id', orgId)
          .expect(401);
      });

      it('should return the organization git status for a valid session', async () => {
        await request
          .agent(app.getHttpServer())
          .get(`/api/git-sync/${orgId}/status`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
      });
    });

    describe('POST /api/git-sync | Create organization git', () => {
      it('should return 401 if the auth token is missing', async () => {
        await request
          .agent(app.getHttpServer())
          .post('/api/git-sync')
          .set('tj-workspace-id', orgId)
          .send({ gitType: 'github_https' })
          .expect(401);
      });

      it('should return 400 when gitType is missing in the body', async () => {
        await request
          .agent(app.getHttpServer())
          .post('/api/git-sync')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({})
          .expect(400);
      });

      it('should create an organization git record for github_https', async () => {
        await request
          .agent(app.getHttpServer())
          .post('/api/git-sync')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ gitType: 'github_https' })
          .expect(201);
      });
    });

    describe('PUT /api/git-sync/:id | Update organization git', () => {
      it('should return 401 if the auth token is missing', async () => {
        await request
          .agent(app.getHttpServer())
          .put(`/api/git-sync/${orgId}`)
          .set('tj-workspace-id', orgId)
          .send({ autoCommit: true })
          .expect(401);
      });
    });

    describe('PUT /api/git-sync/status/:id | Change organization git status', () => {
      it('should return 401 if the auth token is missing', async () => {
        await request
          .agent(app.getHttpServer())
          .put(`/api/git-sync/status/${orgId}`)
          .set('tj-workspace-id', orgId)
          .send({ isEnabled: true, gitType: 'github_https' })
          .expect(401);
      });

      it('should return 400 when gitType is missing in the body', async () => {
        await request
          .agent(app.getHttpServer())
          .put(`/api/git-sync/status/${orgId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ isEnabled: true })
          .expect(400);
      });
    });

    describe('DELETE /api/git-sync/:id | Delete organization git config', () => {
      it('should return 401 if the auth token is missing', async () => {
        await request
          .agent(app.getHttpServer())
          .delete(`/api/git-sync/${orgId}`)
          .set('tj-workspace-id', orgId)
          .expect(401);
      });
    });

    describe('PATCH /api/git-sync/env-configs | Toggle env provider config', () => {
      it('should return 401 if the auth token is missing', async () => {
        await request
          .agent(app.getHttpServer())
          .patch('/api/git-sync/env-configs')
          .set('tj-workspace-id', orgId)
          .send({ useEnvConfig: true, provider: 'github_https' })
          .expect(401);
      });

      it('should return 400 when the provider is not a valid GITConnectionType', async () => {
        await request
          .agent(app.getHttpServer())
          .patch('/api/git-sync/env-configs')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ useEnvConfig: true, provider: 'unsupported-provider' })
          .expect(400);
      });
    });

    describe('Github HTTPS save + retrieve flow', () => {
      // No stubs. test-connection + saveProviderConfig hit the real Git server
      // configured by GITHUB_HTTPS_PAYLOAD (Gitea / GitHub Enterprise). The
      // server must be reachable and the App credentials must be valid for
      // these tests to pass.

      it('POST /api/git-sync/test-connection | should return 401 when unauthenticated', async () => {
        await request
          .agent(app.getHttpServer())
          .post('/api/git-sync/test-connection')
          .set('tj-workspace-id', orgId)
          .send({ ...GITHUB_HTTPS_PAYLOAD, useEnvConfig: false, hasStoredConfig: false })
          .expect(401);
      });

      it('POST /api/git-sync/test-connection | should pass for a valid payload', async () => {
        const res = await request
          .agent(app.getHttpServer())
          .post('/api/git-sync/test-connection')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ ...GITHUB_HTTPS_PAYLOAD, useEnvConfig: false, hasStoredConfig: false });
        if (res.status !== 201) {
          // Surface the server's reason — usually a malformed key/url or an
          // unreachable Git host — instead of a bare "expected 201, got 400".
          process.stdout.write(`    test-connection failed: ${res.status} ${JSON.stringify(res.body)}\n`);
        }
        expect(res.status).toBe(201);
      });

      it('POST /api/git-sync/configs | should return 401 when unauthenticated', async () => {
        await request
          .agent(app.getHttpServer())
          .post('/api/git-sync/configs')
          .set('tj-workspace-id', orgId)
          .send({ ...GITHUB_HTTPS_PAYLOAD, useEnvConfig: false })
          .expect(401);
      });

      it('POST /api/git-sync/configs then GET /api/git-sync/:id | should persist the config and not expose the private key', async () => {
        await request
          .agent(app.getHttpServer())
          .post('/api/git-sync/configs')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ ...GITHUB_HTTPS_PAYLOAD, useEnvConfig: false })
          .expect(201);

        const response = await request
          .agent(app.getHttpServer())
          .get(`/api/git-sync/${orgId}`)
          .query({ gitType: 'github_https' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);

        const organizationGit = response.body?.organization_git;
        expect(organizationGit).toBeDefined();
        expect(organizationGit.git_type).toBe('github_https');
        expect(organizationGit.organization_id).toBe(orgId);

        const gitHttps = organizationGit.git_https;
        expect(gitHttps).toBeDefined();
        expect(gitHttps.https_url).toBe(GITHUB_HTTPS_PAYLOAD.gitUrl);
        expect(gitHttps.github_branch).toBe(GITHUB_HTTPS_PAYLOAD.branchName);
        expect(gitHttps.github_app_id).toBe(GITHUB_HTTPS_PAYLOAD.githubAppId);
        expect(gitHttps.github_installation_id).toBe(GITHUB_HTTPS_PAYLOAD.githubAppInstallationId);
        expect(gitHttps.github_enterprise_url).toBe(GITHUB_HTTPS_PAYLOAD.githubEnterpriseUrl);
        expect(gitHttps.github_enterprise_api_url).toBe(GITHUB_HTTPS_PAYLOAD.githubEnterpriseApiUrl);
        expect(gitHttps.is_enabled).toBe(true);
        expect(gitHttps.is_finalized).toBe(true);

        // Security: the private key must not be returned to the client.
        expect(gitHttps.github_private_key).toBeUndefined();
        expect(gitHttps.githubPrivateKey).toBeUndefined();
        expect(JSON.stringify(response.body)).not.toContain(GITHUB_HTTPS_PAYLOAD.githubAppPrivateKey);
        expect(JSON.stringify(response.body)).not.toContain('BEGIN RSA PRIVATE KEY');

        // Saving provider configs auto-seeds the workspace branch table with
        // the configured branch (main) as the default. GET /api/workspace-branches
        // should return that single branch and surface its id as activeBranchId.
        const branchesResp = await request
          .agent(app.getHttpServer())
          .get('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);

        expect(branchesResp.body.branches).toHaveLength(1);
        const [mainBranch] = branchesResp.body.branches;
        expect(mainBranch.name).toBe(GITHUB_HTTPS_PAYLOAD.branchName);
        expect(mainBranch.isDefault).toBe(true);
        expect(mainBranch.organizationId).toBe(orgId);
        expect(mainBranch.sourceBranchId).toBeNull();
        expect(branchesResp.body.activeBranchId).toBe(mainBranch.id);
        const mainBranchId = mainBranch.id;

        // Once the config is enabled + finalized, GET /api/git-sync/:id/status
        // surfaces the active provider details. Active branch is now tracked
        // client-side, so the server reports null for active_branch_id/name.
        const statusResp = await request
          .agent(app.getHttpServer())
          .get(`/api/git-sync/${orgId}/status`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);

        expect(statusResp.body.is_enabled).toBe(true);
        expect(statusResp.body.is_finalized).toBe(true);
        expect(statusResp.body.is_branching_enabled).toBe(true);
        expect(statusResp.body.id).toBe(organizationGit.id);
        expect(statusResp.body.active_branch_id).toBeNull();
        expect(statusResp.body.active_branch_name).toBeNull();
        expect(statusResp.body.default_git_branch).toBe(GITHUB_HTTPS_PAYLOAD.branchName);
        expect(statusResp.body.repo_url).toBe(GITHUB_HTTPS_PAYLOAD.gitUrl);
        expect(statusResp.body.git_type).toBe('github_https');

        // Fresh workspace — no apps yet on the main branch. The list endpoint
        // should return an empty apps array and zero-valued meta counts.
        const appsResp = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);

        expect(appsResp.body.apps).toEqual([]);
        expect(appsResp.body.meta.total_count).toBe(0);
        expect(appsResp.body.meta.folder_count).toBe(0);
      });
    });

    describe('App git life cycle', () => {
      // End-to-end pull → branch → app create → commit → merge → re-pull cycle
      // against the real Gitea server. Run as a single it block because each
      // step depends on the previous step's state (savepoints isolate per-it).
      //
      // PRE-REQ: a Gitea admin reset endpoint must exist to wipe the test repo
      // back to a clean state before the test runs. The endpoint shape is the
      // one captured below — wire it up before running this test.
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;
      const MERGE_URL = `${GIT_BASE_URL}/admin/merge`;

      it('should complete the full app git life cycle', async () => {
        // Progress logger — writes directly to stdout so jest's
        // file/line-annotated console output doesn't drown out the steps.
        const step = (n: number, label: string) => {
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        };

        // App creation requires the workspace to have app environments seeded.
        // Production seeds these via OnboardingService; in tests we seed
        // explicitly.
        await ensureAppEnvironments(app, orgId);

        step(0, 'reset Gitea repo to clean state');
        // 0. Reset the Gitea repo to a clean state before the run.
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });

        step(1, 'save provider configs & load main branch');
        // 1. Save provider configs — bootstraps the org_git_sync row and
        //    auto-seeds the main branch.
        await request
          .agent(app.getHttpServer())
          .post('/api/git-sync/configs')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ ...GITHUB_HTTPS_PAYLOAD, useEnvConfig: false })
          .expect(201);

        const initialBranches = await request
          .agent(app.getHttpServer())
          .get('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        const mainBranchId: string = initialBranches.body.activeBranchId;
        expect(mainBranchId).toBeDefined();

        step(2, 'list remote branches → only main exists');
        // 2. List remote branches → only main exists after reset.
        const remoteAfterReset = await request
          .agent(app.getHttpServer())
          .get('/api/workspace-branches/remote')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(remoteAfterReset.body).toEqual([{ name: 'main' }]);

        step(3, 'check-updates on main → hasUpdates');
        // 3. Check for updates on main — initial commit is fresher than the
        //    seeded workspace state, so hasUpdates is true with commit info.
        const checkUpdatesResp = await request
          .agent(app.getHttpServer())
          .get('/api/workspace-branches/check-updates')
          .query({ branch: 'main' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(checkUpdatesResp.body.hasUpdates).toBe(true);
        expect(checkUpdatesResp.body.latestCommit).toMatchObject({
          message: expect.any(String),
          author: expect.any(String),
          date: expect.any(String),
          sha: expect.any(String),
        });

        step(4, 'pull main');
        // 4. Pull main → 201.
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(201);

        step(5, 'create feat-e2e branch off main');
        // 5. Create a feature branch off main.
        const createBranchResp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e', sourceBranchId: mainBranchId })
          .expect(201);
        expect(createBranchResp.body).toMatchObject({
          name: 'feat-e2e',
          isDefault: false,
          sourceBranchId: mainBranchId,
          organizationId: orgId,
          appMetaHash: null,
          dataSourceMetaHash: null,
          moduleMetaHash: null,
        });
        const featBranchId: string = createBranchResp.body.id;
        expect(featBranchId).toBeDefined();

        step(6, 'list workspace branches → main + feat-e2e');
        // 6. List branches → main + feat-e2e; active is still main.
        const twoBranchesResp = await request
          .agent(app.getHttpServer())
          .get('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(twoBranchesResp.body.branches).toHaveLength(2);
        expect(twoBranchesResp.body.activeBranchId).toBe(mainBranchId);
        const featInList = twoBranchesResp.body.branches.find((b: any) => b.id === featBranchId);
        expect(featInList).toMatchObject({ name: 'feat-e2e', isDefault: false, sourceBranchId: mainBranchId });

        step(7, 'GET apps on feat-e2e → empty');
        // 7. GET apps on the brand-new feature branch → still empty.
        const appsOnFeat = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: featBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', featBranchId)
          .expect(200);
        expect(appsOnFeat.body.apps).toEqual([]);
        expect(appsOnFeat.body.meta.total_count).toBe(0);

        step(8, 'list remote branches → main + feat-e2e');
        // 8. Remote branches now include the freshly created feat-e2e too.
        const remoteAfterCreate = await request
          .agent(app.getHttpServer())
          .get('/api/workspace-branches/remote')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', featBranchId)
          .expect(200);
        expect(remoteAfterCreate.body.length).toBeGreaterThanOrEqual(2);
        const remoteNames = remoteAfterCreate.body.map((b: any) => b.name);
        expect(remoteNames).toEqual(expect.arrayContaining(['main', 'feat-e2e']));

        step(9, 'create app on feat-e2e (and reject create on main)');
        // 9a. Negative case: creating an app directly on the default branch
        //     must be rejected — branching enabled means apps are only
        //     authored on feature branches.
        await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ icon: 'home', name: 'testing-app-1', type: 'front-end', branchId: mainBranchId })
          .expect(400);

        // 9b. Happy path on the feature branch.

        const createAppResp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', featBranchId)
          .send({ icon: 'home', name: 'testing-app-1', type: 'front-end', branchId: featBranchId })
          .expect(201);
        expect(createAppResp.body).toMatchObject({
          name: 'testing-app-1',
          type: 'front-end',
          organization_id: orgId,
        });
        const appId: string = createAppResp.body.id;

        step(10, 'app-git branches → feat-e2e + main');
        // 10. App-git branches → feat-e2e (from git) + main (from workspace).
        const appGitBranchesResp = await request
          .agent(app.getHttpServer())
          .get(`/api/app-git/${orgId}/app/${appId}/branches`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', featBranchId)
          .expect(200);
        expect(appGitBranchesResp.body.active_branch_id).toBe(mainBranchId);
        const branchNames = appGitBranchesResp.body.branches.map((b: any) => b.name);
        expect(branchNames).toEqual(expect.arrayContaining(['feat-e2e', 'main']));

        step(11, 'fetch app detail → versionId/envId/pageId + env-versions check');
        // 11. Fetch app details to discover the editing version + its env +
        //     home page id (used for the env-versions check below and the
        //     component-add call afterwards).
        const appDetail = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${appId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', featBranchId)
          .expect(200);
        const editingVersion =
          appDetail.body?.editing_version || appDetail.body?.editingVersion || appDetail.body?.app?.editing_version;
        expect(editingVersion).toBeDefined();
        const versionId: string = editingVersion.id;
        const envId: string = editingVersion.current_environment_id || editingVersion.currentEnvironmentId;
        expect(envId).toBeDefined();
        const pageId: string =
          editingVersion.home_page_id ||
          editingVersion.homePageId ||
          editingVersion.pages?.[0]?.id ||
          appDetail.body?.pages?.[0]?.id;
        expect(pageId).toBeDefined();

        // List versions for this app on the editing env — there should be
        // exactly one draft version backing the feature branch.
        const versionsResp = await request
          .agent(app.getHttpServer())
          .get(`/api/app-environments/${envId}/versions`)
          .query({ app_id: appId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', featBranchId)
          .expect(200);
        expect(versionsResp.body.appVersions).toHaveLength(1);
        const [version] = versionsResp.body.appVersions;
        expect(version.versionType).toBe('branch');
        expect(version.status).toBe('DRAFT');
        expect(version.branchId).toBe(featBranchId);
        expect(version.appId).toBe(appId);
        expect(version.id).toBe(versionId);
        // Branch-created app versions must carry a random UUID name, not the
        // branch name (server fix in apps/util.service.ts).
        expect(version.name).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

        step(12, 'add Button component to draft version');
        // 13. Add a Button component to the page on the draft version.
        const { randomUUID } = await import('crypto');
        const newComponentId = randomUUID();
        const componentDiff = {
          [newComponentId]: {
            name: 'button1',
            layouts: {
              desktop: { top: 80, left: 15, width: 4, height: 40 },
              mobile: { top: 80, left: 15, width: 4, height: 40 },
            },
            type: 'Button',
            general: {},
            generalStyles: {},
            others: {
              showOnDesktop: { value: '{{true}}' },
              showOnMobile: { value: '{{false}}' },
            },
            properties: {
              text: { value: 'Button' },
              visibility: { value: '{{true}}' },
              collapseWhenHidden: { value: '{{false}}' },
              disabledState: { value: '{{false}}' },
              loadingState: { value: '{{false}}' },
              tooltip: { value: '' },
            },
            styles: {
              textSize: { value: '{{14}}' },
              fontWeight: { value: 'normal' },
              textColor: { value: '#FFFFFF' },
              borderColor: { value: 'var(--cc-primary-brand)' },
              loaderColor: { value: 'var(--cc-surface1-surface)' },
              contentAlignment: { value: 'center' },
              borderRadius: { value: '{{6}}' },
              backgroundColor: { value: 'var(--cc-primary-brand)' },
              hoverBackgroundMode: { value: 'auto' },
              hoverBackgroundColor: { value: 'var(--cc-primary-brand)' },
              iconColor: { value: 'var(--cc-default-icon)' },
              direction: { value: 'left' },
              padding: { value: 'default' },
              boxShadow: { value: '0px 0px 0px 0px #00000090' },
              icon: { value: 'IconAlignBoxBottomLeft' },
              iconVisibility: { value: false },
              type: { value: 'primary' },
            },
            parent: null,
          },
        };
        const componentResp = await request
          .agent(app.getHttpServer())
          .post(`/api/v2/apps/${appId}/versions/${versionId}/components`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', featBranchId)
          .send({
            is_user_switched_version: false,
            pageId,
            diff: componentDiff,
          });
        if (componentResp.status !== 201) {
          throw new Error(`POST components failed: ${componentResp.status} ${JSON.stringify(componentResp.body)}`);
        }

        step(13, 'gitpush commit feat-e2e');
        // 14. Commit + push the change to the feat-e2e branch.
        await request
          .agent(app.getHttpServer())
          .post(`/api/app-git/gitpush/${appId}/${versionId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', featBranchId)
          .send({
            gitAppName: 'testing-app-1',
            versionId,
            lastCommitMessage: 'test-commit',
            gitVersionName: 'feat-e2e',
            sourceBranch: 'feat-e2e',
          })
          .expect(201);

        step(14, 'merge feat-e2e → main on Gitea');
        // 15. Server-side merge feat-e2e → main on the Gitea host (test
        //     simulator endpoint, not a ToolJet API).
        const mergeResp = await fetch(MERGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: JSON.stringify({
            owner: GIT_REPO_OWNER,
            repo: `${GIT_REPO_NAME}.git`,
            source: 'feat-e2e',
            target: 'main',
            message: 'Land feat-e2e',
          }),
        });
        const mergeBody = await mergeResp.json().catch(() => ({}));
        expect(mergeBody.ok).toBe(true);

        step(15, 'pull main (picks up merged commit)');
        // 16. Pull main into the workspace — picks up the merged commit.
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(201);

        step(16, 'GET apps on main → stub version visible');
        // 17. GET apps on main → the testing-app-1 from feature branch is
        //     now visible on main as a stub version.
        const appsOnMain = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(appsOnMain.body.meta.total_count).toBe(1);
        expect(appsOnMain.body.apps).toHaveLength(1);
        const [mainApp] = appsOnMain.body.apps;
        expect(mainApp).toMatchObject({
          name: 'testing-app-1',
          organization_id: orgId,
          is_stub: true,
        });
        expect(mainApp.app_versions).toHaveLength(1);
        const [mainVersion] = mainApp.app_versions;
        expect(mainVersion).toMatchObject({
          version_type: 'version',
          status: 'DRAFT',
          branch_id: mainBranchId,
          is_stub: true,
          app_id: mainApp.id,
        });

        step(17, 'hydrate stub via GET /apps/:id');
        // 18. Hydrate the stub app by fetching its details — server-side this
        //     materialises the pulled snapshot from git into a full version
        //     (definition, pages, settings) and flips is_stub to false.
        //     Because the version is still a stub (git content available to pull
        //     in), hydration is attempted on this open: is_hydration_tried=true
        //     and hydration_status='success'.
        const hydrateResp = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${mainApp.id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(hydrateResp.body.is_hydration_tried).toBe(true);
        expect(hydrateResp.body.hydration_status).toBe('success');
        expect(hydrateResp.body.not_hydrated_reason).toBeUndefined();

        // Second open — the stub is now hydrated and nothing newer exists on the
        // remote, so hydration is skipped: is_hydration_tried=false and
        // not_hydrated_reason explains why (already-up-to-date).
        const reopenResp = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${mainApp.id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(reopenResp.body.is_hydration_tried).toBe(false);
        expect(reopenResp.body.not_hydrated_reason).toBe('already-up-to-date');

        step(18, 're-list apps on main → hydrated (is_stub:false)');
        // 19. Re-list apps on main — same app, now hydrated. is_stub is false
        //     at both app and version level; the version carries a name, a
        //     home_page_id and an editing_version block.
        const appsAfterHydrate = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(appsAfterHydrate.body.meta.total_count).toBe(1);
        expect(appsAfterHydrate.body.apps).toHaveLength(1);
        const [hydratedApp] = appsAfterHydrate.body.apps;
        expect(hydratedApp).toMatchObject({
          id: mainApp.id,
          name: 'testing-app-1',
          is_stub: false,
          icon: 'home',
        });
        expect(hydratedApp.app_versions).toHaveLength(1);
        const [hydratedVersion] = hydratedApp.app_versions;
        expect(hydratedVersion).toMatchObject({
          app_id: hydratedApp.id,
          branch_id: mainBranchId,
          version_type: 'version',
          status: 'DRAFT',
          is_stub: false,
        });
        expect(hydratedVersion.name).toBeTruthy();
        expect(hydratedVersion.home_page_id).toBeTruthy();
        expect(hydratedApp.editing_version).toMatchObject({
          id: hydratedVersion.id,
          is_stub: false,
          branch_id: mainBranchId,
        });

        step(19, 'env-versions on main → 1 version after hydrate');
        // 20. env-versions endpoint on main — after hydration the pulled
        //     version has its currentEnvironmentId populated, so the lookup
        //     by env returns exactly one row with versionType=version (not
        //     branch), status DRAFT, and branchId matching main.
        const mainEnvId: string =
          hydratedApp.editing_version.current_environment_id || hydratedApp.editing_version.currentEnvironmentId;
        expect(mainEnvId).toBeDefined();
        const mainVersionsResp = await request
          .agent(app.getHttpServer())
          .get(`/api/app-environments/${mainEnvId}/versions`)
          .query({ app_id: hydratedApp.id })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        // env-versions returns all versions on this env (workspace-scoped),
        // so we'll see both the feat-branch branch-version and the new main
        // version-version. Pick the one for the main branch.
        const mainAppVersion = mainVersionsResp.body.appVersions.find((v: any) => v.branchId === mainBranchId);
        expect(mainAppVersion).toBeDefined();
        expect(mainAppVersion).toMatchObject({
          versionType: 'version',
          status: 'DRAFT',
          branchId: mainBranchId,
          appId: hydratedApp.id,
        });

        step(20, 'save v1: check-tag → PUT version PUBLISHED → POST tag');
        // 21. Save the v1 version: check no remote tag exists, publish the
        //     draft (PUT version with status PUBLISHED), then create the git
        //     tag. The check-tag endpoint constructs the tag name from the
        //     app's co_relation_id and the version name being published.
        const checkTagResp = await request
          .agent(app.getHttpServer())
          .get(`/api/app-git/${hydratedApp.id}/check-tag`)
          .query({ versionName: 'v1' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(checkTagResp.body.exists).toBe(false);
        expect(checkTagResp.body.tagName).toBe(`${hydratedApp.co_relation_id}/v1`);

        await request
          .agent(app.getHttpServer())
          .put(`/api/v2/apps/${hydratedApp.id}/versions/${hydratedVersion.id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({
            is_user_switched_version: false,
            name: 'v1',
            description: 'saving draft 1',
            status: 'PUBLISHED',
          })
          .expect(200);

        await request
          .agent(app.getHttpServer())
          .post(`/api/app-git/${hydratedApp.id}/versions/${hydratedVersion.id}/tag`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ message: 'saving draft 1' })
          .expect(201);

        step(21, 'env-versions after publish → 3 versions (UUID draft on main)');
        // 22. After publish, the env-versions endpoint should list three
        //     versions for this app:
        //       - the feat-branch BRANCH-type DRAFT (still there)
        //       - the published 'v1' VERSION-type row on main
        //       - a fresh DRAFT seeded on main by handleDefaultBranchPublish,
        //         whose name must be a random UUID (server fix in
        //         versions/util.service.ts).
        const versionsAfterPublish = await request
          .agent(app.getHttpServer())
          .get(`/api/app-environments/${mainEnvId}/versions`)
          .query({ app_id: hydratedApp.id })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(versionsAfterPublish.body.appVersions).toHaveLength(3);

        const publishedV1 = versionsAfterPublish.body.appVersions.find((v: any) => v.name === 'v1');
        expect(publishedV1).toBeDefined();
        expect(publishedV1).toMatchObject({
          status: 'PUBLISHED',
          versionType: 'version',
        });

        // The newly-seeded draft on the main branch — not the published v1
        // (which now has branchId=null after publish detaches it from main).
        const newMainDraft = versionsAfterPublish.body.appVersions.find(
          (v: any) => v.branchId === mainBranchId && v.versionType === 'version' && v.status === 'DRAFT'
        );
        expect(newMainDraft).toBeDefined();
        expect(newMainDraft.name).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        const publishedV1Id: string = hydratedVersion.id;

        step(22, 'create feat-e2e-2 branch off main');
        // 22. Spin up another feature branch off main. This branch is where
        //     we'll rename the app and change its slug.
        const createBranch2Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e-2', sourceBranchId: mainBranchId })
          .expect(201);
        const feat2BranchId: string = createBranch2Resp.body.id;

        // Fetch the app on feat-e2e-2 to get its editing version id (a fresh
        // branch-type draft pulled in from the source branch).
        const appOnFeat2 = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${hydratedApp.id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat2BranchId)
          .expect(200);
        const feat2EditingVersion = appOnFeat2.body?.editing_version || appOnFeat2.body?.editingVersion;
        expect(feat2EditingVersion).toBeDefined();
        const feat2VersionId: string = feat2EditingVersion.id;

        step(23, 'rename app to testing-app-2 on feat-e2e-2');
        await request
          .agent(app.getHttpServer())
          .put(`/api/apps/${hydratedApp.id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat2BranchId)
          .send({
            app: {
              name: 'testing-app-2',
              editingVersionId: feat2VersionId,
              branch_id: feat2BranchId,
            },
          })
          .expect(200);

        step(24, 'change slug to testing-app-2-slug on feat-e2e-2');
        await request
          .agent(app.getHttpServer())
          .put(`/api/apps/${hydratedApp.id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat2BranchId)
          .send({
            app: {
              slug: 'testing-app-2-slug',
              branch_id: feat2BranchId,
            },
          })
          .expect(200);

        step(24, 'change icon to sentfast on feat-e2e-2');
        await request
          .agent(app.getHttpServer())
          .put(`/api/apps/${hydratedApp.id}/icons`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat2BranchId)
          .send({ icon: 'sentfast', branch_id: feat2BranchId })
          .expect(200);

        step(24, 'flip is_public=true on feat-e2e-2');
        await request
          .agent(app.getHttpServer())
          .put(`/api/apps/${hydratedApp.id}/public`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat2BranchId)
          .send({ app: { is_public: true, branch_id: feat2BranchId } })
          .expect(200);

        step(25, 'gitpush commit feat-e2e-2 (name + slug + icon + is_public)');
        await request
          .agent(app.getHttpServer())
          .post(`/api/app-git/gitpush/${hydratedApp.id}/${feat2VersionId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat2BranchId)
          .send({
            gitAppName: 'testing-app-2',
            versionId: feat2VersionId,
            lastCommitMessage: 'changed name, slug, icon, is_public',
            gitVersionName: 'feat-e2e-2',
            sourceBranch: 'feat-e2e-2',
          })
          .expect(201);

        step(26, 'merge feat-e2e-2 → main on Gitea');
        const merge2Resp = await fetch(MERGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: JSON.stringify({
            owner: GIT_REPO_OWNER,
            repo: `${GIT_REPO_NAME}.git`,
            source: 'feat-e2e-2',
            target: 'main',
            message: 'Land feat-e2e-2',
          }),
        });
        const merge2Body = await merge2Resp.json().catch(() => ({}));
        expect(merge2Body.ok).toBe(true);

        step(27, 'switch to main & list apps → still pre-pull name testing-app-1');
        // 27. Before pulling, main's local snapshot still reflects the
        //     previous merge (name=testing-app-1).
        const appsBeforePull = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(appsBeforePull.body.apps).toHaveLength(1);
        expect(appsBeforePull.body.apps[0].name).toBe('testing-app-1');

        step(28, 'check-updates on main → hasUpdates true (merge commit ahead)');
        const checkUpdatesAfterMerge = await request
          .agent(app.getHttpServer())
          .get('/api/workspace-branches/check-updates')
          .query({ branch: 'main' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(checkUpdatesAfterMerge.body.hasUpdates).toBe(true);
        expect(checkUpdatesAfterMerge.body.latestCommit.sha).toEqual(expect.any(String));

        step(29, 'pull main');
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(201);

        step(30, 'list apps on main → name testing-app-2 (slug still stub uuid)');
        const appsAfterPull = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(appsAfterPull.body.apps).toHaveLength(1);
        const renamedApp = appsAfterPull.body.apps[0];
        expect(renamedApp.name).toBe('testing-app-2');

        step(31, 'pull-from-builder + ensure-draft → new draft version id');
        const builderPull = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(201);
        expect(builderPull.body?.success ?? true).toBeTruthy();

        const ensureDraftResp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/ensure-draft')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ appId: hydratedApp.id, branchId: mainBranchId })
          .expect(201);
        const draftVersionId: string = ensureDraftResp.body.draftVersionId;
        expect(draftVersionId).toBeDefined();

        step(32, 'GET draft version → name + slug + icon + is_public propagated');
        const draftDetail = await request
          .agent(app.getHttpServer())
          .get(`/api/v2/apps/${hydratedApp.id}/versions/${draftVersionId}`)
          .query({ mode: 'edit' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(draftDetail.body.name).toBe('testing-app-2');
        expect(draftDetail.body.slug).toBe('testing-app-2-slug');
        expect(draftDetail.body.icon).toBe('sentfast');
        expect(draftDetail.body.isPublic).toBe(true);

        step(33, 'GET published v1 → editing_version PUBLISHED + inherits main draft name/slug');
        // 33. Hitting the saved (PUBLISHED) v1 should still resolve as
        //     published, but the app-level name+slug come from the latest
        //     main-branch draft — both versions on the same branch share
        //     metadata.
        const savedDetail = await request
          .agent(app.getHttpServer())
          .get(`/api/v2/apps/${hydratedApp.id}/versions/${publishedV1Id}`)
          .query({ mode: 'edit' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        const savedEditingVersion = savedDetail.body.editing_version || savedDetail.body.editingVersion;
        expect(savedEditingVersion).toMatchObject({
          status: 'PUBLISHED',
          versionType: 'version',
        });
        expect(savedDetail.body.name).toBe('testing-app-2');
        expect(savedDetail.body.slug).toBe('testing-app-2-slug');
        expect(savedDetail.body.icon).toBe('sentfast');
        expect(savedDetail.body.isPublic).toBe(true);

        // 33a. NEGATIVE — app is public but not yet released. Anonymous
        //      callers (no cookie, no workspace header) must be rejected on
        //      both the released-access validator and the slug lookup.
        await request
          .agent(app.getHttpServer())
          .get('/api/apps/validate-released-app-access/testing-app-2-slug')
          .expect((res) => {
            if (res.status < 400) {
              throw new Error(`Expected 4xx without auth before release, got ${res.status}`);
            }
          });
        await request
          .agent(app.getHttpServer())
          .get('/api/apps/slugs/testing-app-2-slug')
          .expect((res) => {
            if (res.status < 400) {
              throw new Error(`Expected 4xx without auth before release, got ${res.status}`);
            }
          });

        step(34, 'promote v1 through envs (dev → staging → production) + release');
        // 34. Promote the saved v1 through each environment. The promote body
        //     carries the CURRENT env — the server moves the version to the
        //     next env in priority order. Two promotes cover dev → staging →
        //     production. Final release call marks the version as the live
        //     release.
        const envListResp = await request
          .agent(app.getHttpServer())
          .get('/api/app-environments')
          .query({ app_id: hydratedApp.id })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        const envs = (envListResp.body.environments as any[]).sort((a, b) => a.priority - b.priority);
        expect(envs.length).toBeGreaterThanOrEqual(3);
        const [devEnv, stagingEnv, prodEnv] = envs;

        await request
          .agent(app.getHttpServer())
          .put(`/api/v2/apps/${hydratedApp.id}/versions/${publishedV1Id}/promote`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ currentEnvironmentId: devEnv.id })
          .expect(200);

        await request
          .agent(app.getHttpServer())
          .put(`/api/v2/apps/${hydratedApp.id}/versions/${publishedV1Id}/promote`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ currentEnvironmentId: stagingEnv.id })
          .expect(200);

        await request
          .agent(app.getHttpServer())
          .put(`/api/apps/${hydratedApp.id}/release`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ versionToBeReleased: publishedV1Id })
          .expect(200);

        step(35, 'released-app access + slug lookup + default env (production)');
        const validateAccess = await request
          .agent(app.getHttpServer())
          .get('/api/apps/validate-released-app-access/testing-app-2-slug')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(validateAccess.body).toMatchObject({
          id: hydratedApp.id,
          slug: 'testing-app-2-slug',
        });

        await request
          .agent(app.getHttpServer())
          .get('/api/apps/slugs/testing-app-2-slug')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);

        const defaultEnvResp = await request
          .agent(app.getHttpServer())
          .get('/api/app-environments/default')
          .query({ slug: 'testing-app-2-slug' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(defaultEnvResp.body.environment).toMatchObject({
          name: 'production',
          is_default: true,
          organization_id: orgId,
        });
        expect(defaultEnvResp.body.environment.id).toBe(prodEnv.id);

        // 35a. Public + released apps must be reachable without an auth
        //      cookie. Use a fresh supertest agent so no session leaks in.
        const anonValidate = await request
          .agent(app.getHttpServer())
          .get('/api/apps/validate-released-app-access/testing-app-2-slug')
          .expect(200);
        expect(anonValidate.body).toMatchObject({
          id: hydratedApp.id,
          slug: 'testing-app-2-slug',
        });

        await request.agent(app.getHttpServer()).get('/api/apps/slugs/testing-app-2-slug').expect(200);

        step(36, 'feat-e2e-3: duplicate app name (testing-app-2) → 400');
        // 36. Create another feature branch. Posting an app with a name that
        //     already exists in the workspace must be rejected.
        const createBranch3Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e-3', sourceBranchId: mainBranchId })
          .expect(201);
        const feat3BranchId: string = createBranch3Resp.body.id;

        await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat3BranchId)
          .send({
            icon: 'home',
            name: 'testing-app-2',
            type: 'front-end',
            branchId: feat3BranchId,
          })
          .expect(400);

        step(37, 'feat-e2e-3: unique name OK; duplicate slug 4xx; unique slug OK');
        // 37. Same branch, fresh name → create succeeds. PUTting the existing
        //     slug must fail; a unique slug must succeed.
        const createApp3Resp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat3BranchId)
          .send({
            icon: 'home',
            name: 'testing-app-3',
            type: 'front-end',
            branchId: feat3BranchId,
          })
          .expect(201);
        const app3Id: string = createApp3Resp.body.id;

        const app3Detail = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${app3Id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat3BranchId)
          .expect(200);
        const app3EditingVersion = app3Detail.body?.editing_version || app3Detail.body?.editingVersion;
        const app3VersionId: string = app3EditingVersion.id;

        await request
          .agent(app.getHttpServer())
          .put(`/api/apps/${app3Id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat3BranchId)
          .send({ app: { slug: 'testing-app-2-slug', branch_id: feat3BranchId } })
          .expect(400);

        await request
          .agent(app.getHttpServer())
          .put(`/api/apps/${app3Id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat3BranchId)
          .send({ app: { slug: 'testing-app-3-slug', branch_id: feat3BranchId } })
          .expect(200);

        step(38, 'commit + merge feat-e2e-3 → main, verify name + slug');
        // 38. Push the third feature branch, merge into main, pull, and
        //     confirm both testing-app-2 and testing-app-3 surface with
        //     their slugs after a builder-pull + ensure-draft.
        await request
          .agent(app.getHttpServer())
          .post(`/api/app-git/gitpush/${app3Id}/${app3VersionId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat3BranchId)
          .send({
            gitAppName: 'testing-app-3',
            versionId: app3VersionId,
            lastCommitMessage: 'added testing-app-3',
            gitVersionName: 'feat-e2e-3',
            sourceBranch: 'feat-e2e-3',
          })
          .expect(201);

        const merge3Resp = await fetch(MERGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: JSON.stringify({
            owner: GIT_REPO_OWNER,
            repo: `${GIT_REPO_NAME}.git`,
            source: 'feat-e2e-3',
            target: 'main',
            message: 'Land feat-e2e-3',
          }),
        });
        const merge3Body = await merge3Resp.json().catch(() => ({}));
        expect(merge3Body.ok).toBe(true);

        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(201);

        const appsAfterFeat3Merge = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(appsAfterFeat3Merge.body.apps).toHaveLength(2);

        const app2OnMain = appsAfterFeat3Merge.body.apps.find((a: any) => a.name === 'testing-app-2');
        const app3OnMain = appsAfterFeat3Merge.body.apps.find((a: any) => a.name === 'testing-app-3');
        expect(app2OnMain).toBeDefined();
        expect(app3OnMain).toBeDefined();

        // Hydrate the new app3 stub via ensure-draft so its slug is materialised
        // (stubs carry the app id as slug until a real draft is created).
        const ensureApp3Draft = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/ensure-draft')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ appId: app3OnMain.id, branchId: mainBranchId })
          .expect(201);
        const app3DraftVersionId: string = ensureApp3Draft.body.draftVersionId;

        const app3DraftDetail = await request
          .agent(app.getHttpServer())
          .get(`/api/v2/apps/${app3OnMain.id}/versions/${app3DraftVersionId}`)
          .query({ mode: 'edit' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(app3DraftDetail.body.name).toBe('testing-app-3');
        expect(app3DraftDetail.body.slug).toBe('testing-app-3-slug');

        step(39, 'create feat-e2e-4 branch off main; create testing-app-4 & testing-app-5');
        // 39. Fresh feature branch + two apps to exercise folder membership.
        const createBranch4Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e-4', sourceBranchId: mainBranchId })
          .expect(201);
        const feat4BranchId: string = createBranch4Resp.body.id;
        expect(feat4BranchId).toBeDefined();

        const createApp4Resp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat4BranchId)
          .send({ icon: 'home', name: 'testing-app-4', type: 'front-end', branchId: feat4BranchId })
          .expect(201);
        const app4Id: string = createApp4Resp.body.id;
        expect(app4Id).toBeDefined();

        const createApp5Resp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat4BranchId)
          .send({ icon: 'home', name: 'testing-app-5', type: 'front-end', branchId: feat4BranchId })
          .expect(201);
        const app5Id: string = createApp5Resp.body.id;
        expect(app5Id).toBeDefined();

        step(40, 'create folder test-folder-1');
        // 40. Folders are org-scoped (not branch-scoped) — no x-branch-id needed.
        const createFolderResp = await request
          .agent(app.getHttpServer())
          .post('/api/folders')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ name: 'test-folder-1', type: 'front-end' })
          .expect(201);
        expect(createFolderResp.body).toMatchObject({
          name: 'test-folder-1',
          type: 'front-end',
          organization_id: orgId,
        });
        const folderId: string = createFolderResp.body.id;
        expect(folderId).toBeDefined();

        step(41, 'list folders on feat-e2e-4 → test-folder-1 present with 0 apps');
        // 41. The folder is visible on the branch but has no folder_apps rows yet.
        const foldersInitial = await request
          .agent(app.getHttpServer())
          .get('/api/folder-apps')
          .query({ searchKey: '', type: 'front-end' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat4BranchId)
          .expect(200);
        const newFolderInitial = foldersInitial.body.folders.find((f: any) => f.id === folderId);
        expect(newFolderInitial).toBeDefined();
        expect(newFolderInitial.count).toBe(0);
        expect(newFolderInitial.folder_apps).toEqual([]);

        step(42, 'add testing-app-4 to test-folder-1');
        // 42. Single-app add → folder_apps row scoped to feat-e2e-4.
        await request
          .agent(app.getHttpServer())
          .post('/api/folder-apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat4BranchId)
          .send({ folder_id: folderId, app_id: app4Id })
          .expect(201);

        step(43, 'list folders → test-folder-1 count = 1 (branch-scoped folder_app)');
        const foldersAfterAdd = await request
          .agent(app.getHttpServer())
          .get('/api/folder-apps')
          .query({ searchKey: '', type: 'front-end' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat4BranchId)
          .expect(200);
        const folderWithOne = foldersAfterAdd.body.folders.find((f: any) => f.id === folderId);
        expect(folderWithOne.count).toBe(1);
        expect(folderWithOne.folder_apps).toHaveLength(1);
        expect(folderWithOne.folder_apps[0]).toMatchObject({
          folder_id: folderId,
          app_id: app4Id,
          branch_id: feat4BranchId,
        });

        step(44, 'bulk add testing-app-4 & testing-app-5 to test-folder-1 (single request)');
        // 44. Bulk add — app4 already present (idempotent), app5 newly added.
        await request
          .agent(app.getHttpServer())
          .post('/api/folder-apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat4BranchId)
          .send({ app_ids: [app4Id, app5Id], folder_id: folderId })
          .expect(201);

        step(45, 'list folders → test-folder-1 count = 2');
        const foldersAfterBulk = await request
          .agent(app.getHttpServer())
          .get('/api/folder-apps')
          .query({ searchKey: '', type: 'front-end' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat4BranchId)
          .expect(200);
        const folderWithTwo = foldersAfterBulk.body.folders.find((f: any) => f.id === folderId);
        expect(folderWithTwo.count).toBe(2);
        expect(folderWithTwo.folder_apps).toHaveLength(2);
        const appIdsInFolder = folderWithTwo.folder_apps.map((fa: any) => fa.app_id).sort();
        expect(appIdsInFolder).toEqual([app4Id, app5Id].sort());
        folderWithTwo.folder_apps.forEach((fa: any) => expect(fa.branch_id).toBe(feat4BranchId));

        step(46, 'commit app4 & app5, merge feat-e2e-4 → main, pull, validate folder mapping on main');
        // 46. Folder membership rides through git: foldered apps serialize under
        //     apps/<folder>/<app>/, so after merge+pull the mapping is recreated
        //     on main (as NEW App rows sharing co_relation_id, scoped to main's branch_id).

        // Resolve each app's editing version id on feat-e2e-4 for the gitpush.
        const app4Detail = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${app4Id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat4BranchId)
          .expect(200);
        const app4VersionId: string = (app4Detail.body?.editing_version || app4Detail.body?.editingVersion).id;

        const app5Detail = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${app5Id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat4BranchId)
          .expect(200);
        const app5VersionId: string = (app5Detail.body?.editing_version || app5Detail.body?.editingVersion).id;

        // Commit both foldered apps to feat-e2e-4.
        await request
          .agent(app.getHttpServer())
          .post(`/api/app-git/gitpush/${app4Id}/${app4VersionId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat4BranchId)
          .send({
            gitAppName: 'testing-app-4',
            versionId: app4VersionId,
            lastCommitMessage: 'added testing-app-4 in test-folder-1',
            gitVersionName: 'feat-e2e-4',
            sourceBranch: 'feat-e2e-4',
          })
          .expect(201);

        await request
          .agent(app.getHttpServer())
          .post(`/api/app-git/gitpush/${app5Id}/${app5VersionId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat4BranchId)
          .send({
            gitAppName: 'testing-app-5',
            versionId: app5VersionId,
            lastCommitMessage: 'added testing-app-5 in test-folder-1',
            gitVersionName: 'feat-e2e-4',
            sourceBranch: 'feat-e2e-4',
          })
          .expect(201);

        // Merge feat-e2e-4 → main on Gitea.
        const merge4Resp = await fetch(MERGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: JSON.stringify({
            owner: GIT_REPO_OWNER,
            repo: `${GIT_REPO_NAME}.git`,
            source: 'feat-e2e-4',
            target: 'main',
            message: 'Land feat-e2e-4',
          }),
        });
        const merge4Body = await merge4Resp.json().catch(() => ({}));
        expect(merge4Body.ok).toBe(true);

        // Pull main → recreates the two apps (as stubs) and their folder mapping.
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(201);

        // Resolve the main-branch app ids by name (new App rows, different ids).
        const appsOnMainAfterFeat4 = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        const mainApp4 = appsOnMainAfterFeat4.body.apps.find((a: any) => a.name === 'testing-app-4');
        const mainApp5 = appsOnMainAfterFeat4.body.apps.find((a: any) => a.name === 'testing-app-5');
        expect(mainApp4).toBeDefined();
        expect(mainApp5).toBeDefined();

        // Folder mapping on main must now contain both apps, scoped to main's branch_id.
        const foldersOnMain = await request
          .agent(app.getHttpServer())
          .get('/api/folder-apps')
          .query({ searchKey: '', type: 'front-end' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        const folderOnMain = foldersOnMain.body.folders.find((f: any) => f.id === folderId);
        expect(folderOnMain).toBeDefined();
        expect(folderOnMain.count).toBe(2);
        expect(folderOnMain.folder_apps).toHaveLength(2);
        const mainFolderAppIds = folderOnMain.folder_apps.map((fa: any) => fa.app_id).sort();
        expect(mainFolderAppIds).toEqual([mainApp4.id, mainApp5.id].sort());
        folderOnMain.folder_apps.forEach((fa: any) => expect(fa.branch_id).toBe(mainBranchId));

        step(47, 'hydration failure: invalid repo URL surfaces hydration_error on GET /apps/:id');
        // 47. Force the lazy re-hydration path (a non-stub draft whose
        //     remote_updated_at is newer than pulled_at), repoint the workspace
        //     git config at a non-existent repo, and confirm GET /apps/:id stays
        //     200 while surfacing is_hydration_tried=true, hydration_status='failed'
        //     and a client-safe hydration_error. DB state is restored afterwards.
        //     NOTE: the invalid URL reuses the reachable test host with a bad repo
        //     path so the clone fails fast instead of hanging the 60s git timeout.
        const dataSource = app.get<DataSource>(getDataSourceToken('default'));

        // Hydrate testing-app-4 on main so it has a non-stub draft to re-hydrate.
        const app4HydrateResp = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${mainApp4.id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(app4HydrateResp.body.is_hydration_tried).toBe(true);
        expect(app4HydrateResp.body.hydration_status).toBe('success');

        // Trigger the lazy re-hydration check: remote_updated_at strictly after pulled_at.
        await dataSource.query(
          `UPDATE app_versions
             SET remote_updated_at = now() + interval '1 day'
           WHERE app_id = $1 AND branch_id = $2 AND is_stub = false`,
          [mainApp4.id, mainBranchId]
        );

        // Repoint the git config at a non-existent repo (reachable host, bad path).
        const INVALID_GIT_URL = `${GIT_BASE_URL}/invalid/repo.git`;
        const [{ https_url: originalHttpsUrl }] = await dataSource.query(
          `SELECT https_url FROM organization_git_https
           WHERE config_id IN (SELECT id FROM organization_git_sync WHERE organization_id = $1)`,
          [orgId]
        );
        await dataSource.query(
          `UPDATE organization_git_https
             SET https_url = $1
           WHERE config_id IN (SELECT id FROM organization_git_sync WHERE organization_id = $2)`,
          [INVALID_GIT_URL, orgId]
        );

        // GET the app — hydration is attempted and fails, but the existing non-stub
        // draft keeps the response a 200 carrying the failure diagnostics.
        const failResp = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${mainApp4.id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(failResp.body.is_hydration_tried).toBe(true);
        expect(failResp.body.hydration_status).toBe('failed');
        expect(failResp.body.hydration_error).toBeDefined();
        expect(failResp.body.hydration_error.code).toBe('github-error');
        expect(typeof failResp.body.hydration_error.message).toBe('string');
        expect(failResp.body.hydration_error.message.length).toBeGreaterThan(0);

        // Revert DB changes: restore the real repo URL and clear the forced timestamp.
        await dataSource.query(
          `UPDATE organization_git_https
             SET https_url = $1
           WHERE config_id IN (SELECT id FROM organization_git_sync WHERE organization_id = $2)`,
          [originalHttpsUrl, orgId]
        );
        await dataSource.query(
          `UPDATE app_versions
             SET remote_updated_at = NULL
           WHERE app_id = $1 AND branch_id = $2 AND is_stub = false`,
          [mainApp4.id, mainBranchId]
        );

        // Sanity: with state restored, the next open skips hydration cleanly.
        const healthyResp = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${mainApp4.id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(healthyResp.body.is_hydration_tried).toBe(false);
        expect(healthyResp.body.not_hydrated_reason).toBe('already-up-to-date');

        step(48, 'per-app pull via ensure-draft preserves folder mapping (sibling check to step 46)');
        // 48. Step 46 verified folder propagation through a workspace pull. Here we
        //     exercise the per-app pull endpoint (POST /api/workspace-branches/ensure-draft):
        //     push two more foldered apps from a new feature branch, merge, do the
        //     workspace pull (which seeds stubs + folder_apps on main), then call
        //     ensure-draft once per app. After each per-app pull the app is hydrated
        //     (is_stub flips to false) and the folder mapping stays intact.

        // Fresh feature branch off main.
        const createBranch5Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e-5', sourceBranchId: mainBranchId })
          .expect(201);
        const feat5BranchId: string = createBranch5Resp.body.id;
        expect(feat5BranchId).toBeDefined();

        // Two more apps on feat-e2e-5.
        const createApp6Resp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat5BranchId)
          .send({ icon: 'home', name: 'testing-app-6', type: 'front-end', branchId: feat5BranchId })
          .expect(201);
        const app6Id: string = createApp6Resp.body.id;

        const createApp7Resp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat5BranchId)
          .send({ icon: 'home', name: 'testing-app-7', type: 'front-end', branchId: feat5BranchId })
          .expect(201);
        const app7Id: string = createApp7Resp.body.id;

        // Bulk-add both to test-folder-1 on feat-e2e-5.
        await request
          .agent(app.getHttpServer())
          .post('/api/folder-apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat5BranchId)
          .send({ app_ids: [app6Id, app7Id], folder_id: folderId })
          .expect(201);

        // Resolve editing version ids on feat-e2e-5 for the gitpush.
        const app6Detail = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${app6Id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat5BranchId)
          .expect(200);
        const app6VersionId: string = (app6Detail.body?.editing_version || app6Detail.body?.editingVersion).id;

        const app7Detail = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${app7Id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat5BranchId)
          .expect(200);
        const app7VersionId: string = (app7Detail.body?.editing_version || app7Detail.body?.editingVersion).id;

        // Push both foldered apps.
        await request
          .agent(app.getHttpServer())
          .post(`/api/app-git/gitpush/${app6Id}/${app6VersionId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat5BranchId)
          .send({
            gitAppName: 'testing-app-6',
            versionId: app6VersionId,
            lastCommitMessage: 'added testing-app-6 in test-folder-1',
            gitVersionName: 'feat-e2e-5',
            sourceBranch: 'feat-e2e-5',
          })
          .expect(201);

        await request
          .agent(app.getHttpServer())
          .post(`/api/app-git/gitpush/${app7Id}/${app7VersionId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat5BranchId)
          .send({
            gitAppName: 'testing-app-7',
            versionId: app7VersionId,
            lastCommitMessage: 'added testing-app-7 in test-folder-1',
            gitVersionName: 'feat-e2e-5',
            sourceBranch: 'feat-e2e-5',
          })
          .expect(201);

        // Merge feat-e2e-5 → main on Gitea.
        const merge5Resp = await fetch(MERGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: JSON.stringify({
            owner: GIT_REPO_OWNER,
            repo: `${GIT_REPO_NAME}.git`,
            source: 'feat-e2e-5',
            target: 'main',
            message: 'Land feat-e2e-5',
          }),
        });
        const merge5Body = await merge5Resp.json().catch(() => ({}));
        expect(merge5Body.ok).toBe(true);

        // Workspace pull main — required prerequisite: ensure-draft expects the App
        // row to already exist on main. Pull seeds stubs and propagates folder mapping.
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(201);

        // Resolve the new main-branch App ids by name; both should still be stubs.
        const appsOnMainBeforeEnsure = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        const mainApp6 = appsOnMainBeforeEnsure.body.apps.find((a: any) => a.name === 'testing-app-6');
        const mainApp7 = appsOnMainBeforeEnsure.body.apps.find((a: any) => a.name === 'testing-app-7');
        expect(mainApp6).toBeDefined();
        expect(mainApp7).toBeDefined();
        expect(mainApp6.is_stub).toBe(true);
        expect(mainApp7.is_stub).toBe(true);

        // Folder count on main should now be 4: existing app4/app5 + new app6/app7 stubs.
        const expectedAllFolderAppIds = [mainApp4.id, mainApp5.id, mainApp6.id, mainApp7.id].sort();
        const foldersAfterPull = await request
          .agent(app.getHttpServer())
          .get('/api/folder-apps')
          .query({ searchKey: '', type: 'front-end' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        const folderAfterPull = foldersAfterPull.body.folders.find((f: any) => f.id === folderId);
        expect(folderAfterPull.count).toBe(4);
        expect(folderAfterPull.folder_apps).toHaveLength(4);
        expect(folderAfterPull.folder_apps.map((fa: any) => fa.app_id).sort()).toEqual(expectedAllFolderAppIds);
        folderAfterPull.folder_apps.forEach((fa: any) => expect(fa.branch_id).toBe(mainBranchId));

        // Per-app pull #1: ensure-draft for testing-app-6.
        const ensureApp6Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/ensure-draft')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ appId: mainApp6.id, branchId: mainBranchId })
          .expect(201);
        expect(ensureApp6Resp.body.draftVersionId).toBeDefined();

        // app6 hydrated, folder mapping intact.
        const appsAfterEnsure6 = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        const hydratedApp6 = appsAfterEnsure6.body.apps.find((a: any) => a.id === mainApp6.id);
        expect(hydratedApp6.is_stub).toBe(false);

        const foldersAfterEnsure6 = await request
          .agent(app.getHttpServer())
          .get('/api/folder-apps')
          .query({ searchKey: '', type: 'front-end' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        const folderAfterEnsure6 = foldersAfterEnsure6.body.folders.find((f: any) => f.id === folderId);
        expect(folderAfterEnsure6.count).toBe(4);
        expect(folderAfterEnsure6.folder_apps.map((fa: any) => fa.app_id).sort()).toEqual(expectedAllFolderAppIds);
        folderAfterEnsure6.folder_apps.forEach((fa: any) => expect(fa.branch_id).toBe(mainBranchId));

        // Per-app pull #2: ensure-draft for testing-app-7.
        const ensureApp7Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/ensure-draft')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ appId: mainApp7.id, branchId: mainBranchId })
          .expect(201);
        expect(ensureApp7Resp.body.draftVersionId).toBeDefined();

        const appsAfterEnsure7 = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        const hydratedApp7 = appsAfterEnsure7.body.apps.find((a: any) => a.id === mainApp7.id);
        expect(hydratedApp7.is_stub).toBe(false);

        const foldersAfterEnsure7 = await request
          .agent(app.getHttpServer())
          .get('/api/folder-apps')
          .query({ searchKey: '', type: 'front-end' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        const folderAfterEnsure7 = foldersAfterEnsure7.body.folders.find((f: any) => f.id === folderId);
        expect(folderAfterEnsure7.count).toBe(4);
        expect(folderAfterEnsure7.folder_apps.map((fa: any) => fa.app_id).sort()).toEqual(expectedAllFolderAppIds);
        folderAfterEnsure7.folder_apps.forEach((fa: any) => expect(fa.branch_id).toBe(mainBranchId));

        step(49, 'orphan delete on default branch: mutated app row gets removed on main pull');
        // 49. Workspace pull on the DEFAULT branch must remove "orphaned" apps —
        //     rows whose AppVersion lives on main but whose co_relation_id is
        //     absent from the incoming git appMeta. Setup: create a feature
        //     branch + app, then SQL-mutate the AppVersion to look like a
        //     regular main-branch version. Since the repo never saw this
        //     co_relation_id, main's pull should drop both the AppVersion and
        //     the App row (no other branch holds it).
        const createBranch6Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e-6', sourceBranchId: mainBranchId })
          .expect(201);
        const feat6BranchId: string = createBranch6Resp.body.id;
        expect(feat6BranchId).toBeDefined();

        const orphanAppResp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat6BranchId)
          .send({ icon: 'home', name: 'orphan-on-main', type: 'front-end', branchId: feat6BranchId })
          .expect(201);
        const orphanAppId: string = orphanAppResp.body.id;
        expect(orphanAppId).toBeDefined();

        // Move the AppVersion to main as a regular version. The co_relation_id
        // is unchanged and was never pushed, so it isn't in main's appMeta —
        // the orphan sweep should pick it up on pull.
        await dataSource.query(
          `UPDATE app_versions
             SET version_type = 'version', branch_id = $1
           WHERE app_id = $2`,
          [mainBranchId, orphanAppId]
        );

        // Sanity: row was moved to main, exactly one AppVersion exists.
        const orphanBeforePull = await dataSource.query(
          `SELECT branch_id, version_type FROM app_versions WHERE app_id = $1`,
          [orphanAppId]
        );
        expect(orphanBeforePull).toHaveLength(1);
        expect(orphanBeforePull[0].branch_id).toBe(mainBranchId);
        expect(orphanBeforePull[0].version_type).toBe('version');

        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(201);

        // Orphan AppVersion gone. App row gone too — main was the last (and only)
        // branch holding it after the mutation, so the cascade in
        // removeOrphanedResources drops the App entity as well.
        const orphanAvAfterPull = await dataSource.query(`SELECT id FROM app_versions WHERE app_id = $1`, [
          orphanAppId,
        ]);
        expect(orphanAvAfterPull).toHaveLength(0);

        const orphanAppAfterPull = await dataSource.query(`SELECT id FROM apps WHERE id = $1`, [orphanAppId]);
        expect(orphanAppAfterPull).toHaveLength(0);

        step(50, 'feature-branch pull preserves local-only app (orphan sweep gated to default)');
        // 50. The orphan sweep is gated to the default branch — pulling a
        //     feature branch must NOT delete a locally-created, never-pushed
        //     app. Otherwise a user's in-progress work on a feature branch
        //     would be silently destroyed on every sync.
        const createBranch7Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e-7', sourceBranchId: mainBranchId })
          .expect(201);
        const feat7BranchId: string = createBranch7Resp.body.id;
        expect(feat7BranchId).toBeDefined();

        const localOnlyAppResp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat7BranchId)
          .send({ icon: 'home', name: 'local-only-app', type: 'front-end', branchId: feat7BranchId })
          .expect(201);
        const localOnlyAppId: string = localOnlyAppResp.body.id;
        expect(localOnlyAppId).toBeDefined();

        // Sanity: app + branch-scoped version exist before the pull.
        const localBeforePull = await dataSource.query(
          `SELECT branch_id, version_type FROM app_versions WHERE app_id = $1`,
          [localOnlyAppId]
        );
        expect(localBeforePull).toHaveLength(1);
        expect(localBeforePull[0].branch_id).toBe(feat7BranchId);
        expect(localBeforePull[0].version_type).toBe('branch');

        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat7BranchId)
          .send({ branchId: feat7BranchId })
          .expect(201);

        // App + AppVersion must still be present after a feature-branch pull.
        const localAvAfterPull = await dataSource.query(
          `SELECT branch_id, version_type FROM app_versions WHERE app_id = $1`,
          [localOnlyAppId]
        );
        expect(localAvAfterPull).toHaveLength(1);
        expect(localAvAfterPull[0].branch_id).toBe(feat7BranchId);
        expect(localAvAfterPull[0].version_type).toBe('branch');

        const localAppAfterPull = await dataSource.query(`SELECT id FROM apps WHERE id = $1`, [localOnlyAppId]);
        expect(localAppAfterPull).toHaveLength(1);

        step(51, 'orphan delete frees name slot for incoming git app with same name');
        // 51. Exercises the delete-orphans-BEFORE-upsert ordering. Plant an orphan
        //     "collide-app" on main (corid1). Then create a different "collide-app"
        //     (corid2) on a separate feature branch, push it, and merge into main.
        //     Now main's git appMeta carries corid2 with name "collide-app" while
        //     the DB still has the corid1 orphan with the same name. Pull main:
        //     the orphan must be deleted first so the corid2 upsert doesn't trip
        //     the (branch_id, app_name) uniqueness check.
        const createBranch8Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e-8', sourceBranchId: mainBranchId })
          .expect(201);
        const feat8BranchId: string = createBranch8Resp.body.id;
        expect(feat8BranchId).toBeDefined();

        const orphanCollideResp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat8BranchId)
          .send({ icon: 'home', name: 'collide-app', type: 'front-end', branchId: feat8BranchId })
          .expect(201);
        const orphanCollideAppId: string = orphanCollideResp.body.id;
        expect(orphanCollideAppId).toBeDefined();

        // SQL-mutate the AppVersion onto main as a regular 'version' row so
        // the orphan sweep sees it (matches the step 49 setup).
        await dataSource.query(
          `UPDATE app_versions
             SET version_type = 'version', branch_id = $1
           WHERE app_id = $2`,
          [mainBranchId, orphanCollideAppId]
        );

        // Sanity: orphan now lives on main with the colliding name.
        const orphanCollideRows = await dataSource.query(
          `SELECT branch_id, version_type, app_name FROM app_versions WHERE app_id = $1`,
          [orphanCollideAppId]
        );
        expect(orphanCollideRows).toHaveLength(1);
        expect(orphanCollideRows[0].branch_id).toBe(mainBranchId);
        expect(orphanCollideRows[0].version_type).toBe('version');
        expect(orphanCollideRows[0].app_name).toBe('collide-app');

        // Create same-named app on a fresh feature branch — name check is scoped
        // per (branchId, version_type='branch'), so this is allowed.
        const createBranch9Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e-9', sourceBranchId: mainBranchId })
          .expect(201);
        const feat9BranchId: string = createBranch9Resp.body.id;
        expect(feat9BranchId).toBeDefined();

        const newCollideResp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat9BranchId)
          .send({ icon: 'home', name: 'collide-app', type: 'front-end', branchId: feat9BranchId })
          .expect(201);
        const newCollideAppId: string = newCollideResp.body.id;
        expect(newCollideAppId).toBeDefined();
        expect(newCollideAppId).not.toBe(orphanCollideAppId);

        // Fetch the editing version so we can push it.
        const newCollideDetail = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${newCollideAppId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat9BranchId)
          .expect(200);
        const newCollideEditingVersion =
          newCollideDetail.body?.editing_version ||
          newCollideDetail.body?.editingVersion ||
          newCollideDetail.body?.app?.editing_version;
        expect(newCollideEditingVersion).toBeDefined();
        const newCollideVersionId: string = newCollideEditingVersion.id;

        // Push corid2 to feat-e2e-9 so its appMeta carries collide-app.
        await request
          .agent(app.getHttpServer())
          .post(`/api/app-git/gitpush/${newCollideAppId}/${newCollideVersionId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat9BranchId)
          .send({
            gitAppName: 'collide-app',
            versionId: newCollideVersionId,
            lastCommitMessage: 'collide-app on feat-e2e-9',
            gitVersionName: 'feat-e2e-9',
            sourceBranch: 'feat-e2e-9',
          })
          .expect(201);

        // Server-side merge feat-e2e-9 → main so main's git appMeta picks up corid2.
        const collideMergeResp = await fetch(MERGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: JSON.stringify({
            owner: GIT_REPO_OWNER,
            repo: `${GIT_REPO_NAME}.git`,
            source: 'feat-e2e-9',
            target: 'main',
            message: 'Land collide-app',
          }),
        });
        const collideMergeBody = await collideMergeResp.json().catch(() => ({}));
        expect(collideMergeBody.ok).toBe(true);

        // Pull main → orphan corid1 must be deleted first so the corid2 stub
        // upsert can land without hitting the (branch_id, app_name) constraint.
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(201);

        // Orphan App row is gone (main was its only branch after the mutation).
        const orphanCollideAfterPull = await dataSource.query(`SELECT id FROM apps WHERE id = $1`, [
          orphanCollideAppId,
        ]);
        expect(orphanCollideAfterPull).toHaveLength(0);

        // Exactly one "collide-app" sits on main now, and it's NOT the orphan id.
        const collideOnMainAfterPull = await dataSource.query(
          `SELECT app.id
             FROM apps app
             INNER JOIN app_versions av ON av.app_id = app.id
            WHERE app.organization_id = $1
              AND app.type = 'front-end'
              AND av.branch_id = $2
              AND av.app_name = 'collide-app'`,
          [orgId, mainBranchId]
        );
        expect(collideOnMainAfterPull).toHaveLength(1);
        expect(collideOnMainAfterPull[0].id).not.toBe(orphanCollideAppId);

        step(52, 'data-source workspace push → merge → pull main: DS appears with per-env options');
        // 52. Data-source git-sync lifecycle: create a restapi DS on a feature
        //     branch, set distinct URLs per environment, workspace-push the
        //     branch, merge into main on Gitea, and pull main. After the pull
        //     the DS must be listed on main and its dev/staging/prod options
        //     must carry the URLs we set on the feature branch.
        const envListForDsResp = await request
          .agent(app.getHttpServer())
          .get('/api/app-environments')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        const dsEnvs = (envListForDsResp.body.environments as any[]).sort((a: any, b: any) => a.priority - b.priority);
        expect(dsEnvs.length).toBeGreaterThanOrEqual(3);
        const [dsDevEnv, dsStagingEnv, dsProdEnv] = dsEnvs;

        const createBranch10Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e-10', sourceBranchId: mainBranchId })
          .expect(201);
        const feat10BranchId: string = createBranch10Resp.body.id;
        expect(feat10BranchId).toBeDefined();

        // Minimal restapi options — same shape the UI sends, trimmed for the test.
        const restapiCreateOptions = [
          { key: 'url', value: '' },
          { key: 'auth_type', value: 'none' },
          { key: 'grant_type', value: 'authorization_code' },
          { key: 'add_token_to', value: 'header' },
          { key: 'header_prefix', value: 'Bearer ' },
          { key: 'access_token_url', value: '' },
          { key: 'client_id', value: '' },
          { key: 'client_secret', value: '', encrypted: true },
          { key: 'scopes', value: 'read, write' },
          { key: 'username', value: '', encrypted: false },
          { key: 'password', value: '', encrypted: true },
          { key: 'bearer_token', value: '', encrypted: true },
          { key: 'auth_url', value: '' },
          { key: 'client_auth', value: 'body' },
          { key: 'headers', value: [['', '']] },
          { key: 'custom_query_params', value: [['', '']], encrypted: false },
          { key: 'custom_auth_params', value: [['', '']] },
          { key: 'access_token_custom_headers', value: [['', '']], encrypted: false },
          { key: 'multiple_auth_enabled', value: false, encrypted: false },
          { key: 'ssl_certificate', value: 'none', encrypted: false },
          { key: 'retry_network_errors', value: true, encrypted: false },
        ];

        const createDsResp = await request
          .agent(app.getHttpServer())
          .post(`/api/data-sources?branch_id=${feat10BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat10BranchId)
          .send({
            name: 'restapi-e2e',
            kind: 'restapi',
            options: restapiCreateOptions,
            scope: 'global',
          })
          .expect(201);
        const newDsId: string = createDsResp.body.id;
        expect(newDsId).toBeDefined();
        expect(createDsResp.body).toMatchObject({ name: 'restapi-e2e', kind: 'restapi' });

        // Sanity: the DS is listed on the feature branch.
        const dsListOnFeatResp = await request
          .agent(app.getHttpServer())
          .get(`/api/data-sources/${orgId}?branch_id=${feat10BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat10BranchId)
          .expect(200);
        const featDsList = dsListOnFeatResp.body.data_sources || dsListOnFeatResp.body.dataSources || [];
        expect(featDsList.find((ds: any) => ds.id === newDsId)).toBeDefined();

        // Per-env updates — distinct URLs so we can later verify that pull
        // hydrated each env's DSVO from git separately.
        const buildUpdateOptions = (url: string) => [
          { key: 'url', value: url },
          { key: 'scopes', value: 'read, write' },
          { key: 'headers', value: [['', '']] },
          { key: 'audience', value: '' },
          { key: 'auth_url', value: '' },
          { key: 'username', value: '', encrypted: false },
          { key: 'auth_type', value: 'none' },
          { key: 'client_id', value: '' },
          { key: 'grant_type', value: 'authorization_code' },
          { key: 'client_auth', value: 'body' },
          { key: 'add_token_to', value: 'header' },
          { key: 'header_prefix', value: 'Bearer ' },
          { key: 'ssl_certificate', value: 'none', encrypted: false },
          { key: 'access_token_url', value: '' },
          { key: 'custom_auth_params', value: [['', '']] },
          { key: 'custom_query_params', value: [['', '']], encrypted: false },
          { key: 'retry_network_errors', value: true, encrypted: false },
          { key: 'multiple_auth_enabled', value: false, encrypted: false },
          { key: 'access_token_custom_headers', value: [['', '']], encrypted: false },
        ];

        const devUrl = 'http://dev.url.com';
        const stagingUrl = 'http://stage.url.com';
        const prodUrl = 'http://prod.url.com';

        await request
          .agent(app.getHttpServer())
          .put(`/api/data-sources/${newDsId}?environment_id=${dsDevEnv.id}&branch_id=${feat10BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat10BranchId)
          .send({ name: 'restapi-e2e', options: buildUpdateOptions(devUrl) })
          .expect(200);

        await request
          .agent(app.getHttpServer())
          .put(`/api/data-sources/${newDsId}?environment_id=${dsStagingEnv.id}&branch_id=${feat10BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat10BranchId)
          .send({ name: 'restapi-e2e', options: buildUpdateOptions(stagingUrl) })
          .expect(200);

        await request
          .agent(app.getHttpServer())
          .put(`/api/data-sources/${newDsId}?environment_id=${dsProdEnv.id}&branch_id=${feat10BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat10BranchId)
          .send({ name: 'restapi-e2e', options: buildUpdateOptions(prodUrl) })
          .expect(200);

        // Workspace push the feature branch — serializes DS + DSVOs into git.
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/push')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat10BranchId)
          .send({ commitMessage: 'data-source-commit', branchId: feat10BranchId })
          .expect(201);

        // Merge feat-e2e-10 → main on Gitea.
        const dsMergeResp = await fetch(MERGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: JSON.stringify({
            owner: GIT_REPO_OWNER,
            repo: `${GIT_REPO_NAME}.git`,
            source: 'feat-e2e-10',
            target: 'main',
            message: 'Land restapi-e2e DS',
          }),
        });
        const dsMergeBody = await dsMergeResp.json().catch(() => ({}));
        expect(dsMergeBody.ok).toBe(true);

        // Pull main → DS deserializer should create/refresh the DSV + DSVOs on main.
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(201);

        // DS appears in the main-branch listing.
        const dsListOnMainResp = await request
          .agent(app.getHttpServer())
          .get(`/api/data-sources/${orgId}?branch_id=${mainBranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        const mainDsList = dsListOnMainResp.body.data_sources || dsListOnMainResp.body.dataSources || [];
        const mainDs = mainDsList.find((ds: any) => ds.name === 'restapi-e2e');
        expect(mainDs).toBeDefined();
        expect(mainDs.kind).toBe('restapi');

        // Per-env URLs must match what we set on the feature branch.
        // PUT/POST send options as an array of {key, value}, but the GET response
        // stores them as an object keyed by option name: `{ url: { value: ... } }`.
        const extractUrl = (resp: any) => {
          const opts = resp.body?.options;
          if (!opts) return undefined;
          if (Array.isArray(opts)) return opts.find((o: any) => o.key === 'url')?.value;
          return opts.url?.value;
        };

        const dsOnDevResp = await request
          .agent(app.getHttpServer())
          .get(`/api/data-sources/${mainDs.id}/environment/${dsDevEnv.id}?branch_id=${mainBranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(extractUrl(dsOnDevResp)).toBe(devUrl);

        const dsOnStagingResp = await request
          .agent(app.getHttpServer())
          .get(`/api/data-sources/${mainDs.id}/environment/${dsStagingEnv.id}?branch_id=${mainBranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(extractUrl(dsOnStagingResp)).toBe(stagingUrl);

        const dsOnProdResp = await request
          .agent(app.getHttpServer())
          .get(`/api/data-sources/${mainDs.id}/environment/${dsProdEnv.id}?branch_id=${mainBranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(extractUrl(dsOnProdResp)).toBe(prodUrl);

        step(53, 'module + ModuleViewer linking: app GET surfaces module via co_relation_id');
        // 53. Create a module on a feature branch, push it to git, then create an
        //     app on the same branch that references the module via ModuleViewer.
        //     The app GET response must (a) include the module in its `modules`
        //     key and (b) carry the module's co_relation_id as
        //     editing_version.pages[].components[].properties.moduleAppId.value.
        const createBranch11Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e-11', sourceBranchId: mainBranchId })
          .expect(201);
        const feat11BranchId: string = createBranch11Resp.body.id;
        expect(feat11BranchId).toBeDefined();

        // Create module — endpoint reuses the same appsService.create path as apps.
        const createModuleResp = await request
          .agent(app.getHttpServer())
          .post('/api/modules')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat11BranchId)
          .send({ icon: 'folderupload', name: 'e2e-test-module', type: 'module', branchId: feat11BranchId })
          .expect(201);
        const moduleAppId: string = createModuleResp.body.id;
        expect(moduleAppId).toBeDefined();

        // Resolve module identifiers: versionId + pageId + the auto-created
        // ModuleContainer (Button must be parented to it, otherwise the
        // component subtree won't render inside the module).
        const moduleDetailResp = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${moduleAppId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat11BranchId)
          .expect(200);
        const moduleEditingVersion =
          moduleDetailResp.body?.editing_version ||
          moduleDetailResp.body?.editingVersion ||
          moduleDetailResp.body?.app?.editing_version;
        expect(moduleEditingVersion).toBeDefined();
        const moduleVersionId: string = moduleEditingVersion.id;
        const modulePageId: string =
          moduleEditingVersion.home_page_id ||
          moduleEditingVersion.homePageId ||
          moduleEditingVersion.pages?.[0]?.id ||
          moduleDetailResp.body?.pages?.[0]?.id;
        expect(moduleVersionId).toBeDefined();
        expect(modulePageId).toBeDefined();

        const modulePages = moduleEditingVersion.pages || moduleDetailResp.body?.pages || [];
        const moduleHomePage = modulePages.find((p: any) => p.id === modulePageId) || modulePages[0];
        // The GET response normalizes each page's components into a record
        // keyed by componentId; type lives at component.component (see
        // createComponentWithLayout in component.service.ts).
        const moduleComponents: Record<string, any> = moduleHomePage?.components || {};
        const moduleContainerId: string | undefined = Object.keys(moduleComponents).find(
          (id) => moduleComponents[id]?.component?.component === 'ModuleContainer'
        );
        expect(moduleContainerId).toBeDefined();

        // Add a Button inside the ModuleContainer.
        const moduleButtonId = randomUUID();
        const moduleButtonDiff = {
          [moduleButtonId]: {
            name: 'button1',
            layouts: {
              desktop: { top: 40, left: 15, width: 5, height: 40 },
              mobile: { top: 40, left: 15, width: 5, height: 40 },
            },
            type: 'Button',
            general: {},
            generalStyles: {},
            others: {
              showOnDesktop: { value: '{{true}}' },
              showOnMobile: { value: '{{false}}' },
            },
            properties: {
              text: { value: 'Button' },
              visibility: { value: '{{true}}' },
              collapseWhenHidden: { value: '{{false}}' },
              disabledState: { value: '{{false}}' },
              loadingState: { value: '{{false}}' },
              tooltip: { value: '' },
            },
            styles: {
              textSize: { value: '{{14}}' },
              fontWeight: { value: 'normal' },
              textColor: { value: '#FFFFFF' },
              borderColor: { value: 'var(--cc-primary-brand)' },
              loaderColor: { value: 'var(--cc-surface1-surface)' },
              contentAlignment: { value: 'center' },
              borderRadius: { value: '{{6}}' },
              backgroundColor: { value: 'var(--cc-primary-brand)' },
              hoverBackgroundMode: { value: 'auto' },
              hoverBackgroundColor: { value: 'var(--cc-primary-brand)' },
              iconColor: { value: 'var(--cc-default-icon)' },
              direction: { value: 'left' },
              padding: { value: 'default' },
              boxShadow: { value: '0px 0px 0px 0px #00000090' },
              icon: { value: 'IconAlignBoxBottomLeft' },
              iconVisibility: { value: false },
              type: { value: 'primary' },
            },
            parent: moduleContainerId,
          },
        };
        const moduleButtonResp = await request
          .agent(app.getHttpServer())
          .post(`/api/v2/apps/${moduleAppId}/versions/${moduleVersionId}/components`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat11BranchId)
          .send({
            is_user_switched_version: false,
            pageId: modulePageId,
            diff: moduleButtonDiff,
          });
        if (moduleButtonResp.status !== 201) {
          throw new Error(
            `POST module components failed: ${moduleButtonResp.status} ${JSON.stringify(moduleButtonResp.body)}`
          );
        }

        // gitpush the module to feat-e2e-11.
        await request
          .agent(app.getHttpServer())
          .post(`/api/app-git/gitpush/${moduleAppId}/${moduleVersionId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat11BranchId)
          .send({
            gitAppName: 'e2e-test-module',
            versionId: moduleVersionId,
            lastCommitMessage: 'commit-module',
            gitVersionName: 'feat-e2e-11',
            sourceBranch: 'feat-e2e-11',
          })
          .expect(201);

        // Create a host app on the same feature branch.
        const hostAppResp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat11BranchId)
          .send({ icon: 'home', name: 'e2e-app-with-module', type: 'front-end', branchId: feat11BranchId })
          .expect(201);
        const hostAppId: string = hostAppResp.body.id;
        expect(hostAppId).toBeDefined();

        // List modules on the feature branch — capture the module's co_relation_id
        // (this is the value the ModuleViewer's moduleAppId.value must carry).
        const moduleListResp = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'module', branch_id: feat11BranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat11BranchId)
          .expect(200);
        const moduleInList = (moduleListResp.body.apps || []).find((m: any) => m.id === moduleAppId);
        expect(moduleInList).toBeDefined();
        const moduleCoRelationId: string = moduleInList.co_relation_id || moduleInList.coRelationId;
        expect(moduleCoRelationId).toBeDefined();

        // Resolve host app's editing version + home page.
        const hostAppDetail = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${hostAppId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat11BranchId)
          .expect(200);
        const hostEditingVersion =
          hostAppDetail.body?.editing_version ||
          hostAppDetail.body?.editingVersion ||
          hostAppDetail.body?.app?.editing_version;
        expect(hostEditingVersion).toBeDefined();
        const hostVersionId: string = hostEditingVersion.id;
        const hostPageId: string =
          hostEditingVersion.home_page_id ||
          hostEditingVersion.homePageId ||
          hostEditingVersion.pages?.[0]?.id ||
          hostAppDetail.body?.pages?.[0]?.id;
        expect(hostPageId).toBeDefined();

        // Add ModuleViewer component on host app — moduleAppId.value = module's co_relation_id.
        const moduleViewerId = randomUUID();
        const moduleViewerDiff = {
          [moduleViewerId]: {
            name: 'moduleviewer1',
            layouts: {
              desktop: { top: 70, left: 5, width: 38, height: 400 },
              mobile: { top: 70, left: 5, width: 38, height: 400 },
            },
            type: 'ModuleViewer',
            general: {},
            generalStyles: { boxShadow: { value: '0px 0px 0px 0px #00000040' } },
            others: {
              showOnDesktop: { value: '{{true}}' },
              showOnMobile: { value: '{{false}}' },
            },
            properties: {
              moduleAppId: { value: moduleCoRelationId },
              moduleVersionId: { value: '' },
              visibility: { value: true },
            },
            styles: {
              backgroundColor: { value: '#fff' },
              padding: { value: 'default' },
            },
            parent: null,
          },
        };
        const moduleViewerResp = await request
          .agent(app.getHttpServer())
          .post(`/api/v2/apps/${hostAppId}/versions/${hostVersionId}/components`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat11BranchId)
          .send({
            is_user_switched_version: false,
            pageId: hostPageId,
            diff: moduleViewerDiff,
          });
        if (moduleViewerResp.status !== 201) {
          throw new Error(
            `POST host components failed: ${moduleViewerResp.status} ${JSON.stringify(moduleViewerResp.body)}`
          );
        }

        // GET host app → response.modules must include the referenced module,
        // and the ModuleViewer component must carry the module's co_relation_id.
        const hostAfterLinkResp = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${hostAppId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat11BranchId)
          .expect(200);

        const linkedModules = hostAfterLinkResp.body?.modules || [];
        const linkedModule = linkedModules.find(
          (m: any) => (m.co_relation_id || m.coRelationId) === moduleCoRelationId
        );
        expect(linkedModule).toBeDefined();
        expect(linkedModule.id).toBe(moduleAppId);

        const hostEditingAfterLink =
          hostAfterLinkResp.body?.editing_version ||
          hostAfterLinkResp.body?.editingVersion ||
          hostAfterLinkResp.body?.app?.editing_version;
        const hostPagesAfterLink = hostEditingAfterLink?.pages || hostAfterLinkResp.body?.pages || [];
        // Components is a record keyed by componentId, not an array.
        let moduleViewerEntry: any = null;
        for (const page of hostPagesAfterLink) {
          const comps: Record<string, any> = page.components || {};
          for (const id of Object.keys(comps)) {
            if (comps[id]?.component?.component === 'ModuleViewer') {
              moduleViewerEntry = comps[id];
              break;
            }
          }
          if (moduleViewerEntry) break;
        }
        expect(moduleViewerEntry).toBeDefined();
        expect(moduleViewerEntry.component?.definition?.properties?.moduleAppId?.value).toBe(moduleCoRelationId);

        step(54, 'merge feat-e2e-11 → main, pull, hydrate host app → module cascades hydrated');
        // 54. Push the host app (so main has both the module AND the host with
        //     ModuleViewer wired), merge feat-e2e-11 → main, pull main, then
        //     verify the dependency-cascade hydration: opening the host app
        //     materialises its referenced module too, so a subsequent direct
        //     GET on the module is a no-op (`already-up-to-date`).

        // gitpush the host app — main needs the ModuleViewer in git to recreate
        // the link after the merge.
        await request
          .agent(app.getHttpServer())
          .post(`/api/app-git/gitpush/${hostAppId}/${hostVersionId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat11BranchId)
          .send({
            gitAppName: 'e2e-app-with-module',
            versionId: hostVersionId,
            lastCommitMessage: 'commit-host-app',
            gitVersionName: 'feat-e2e-11',
            sourceBranch: 'feat-e2e-11',
          })
          .expect(201);

        // Server-side merge feat-e2e-11 → main on Gitea.
        const moduleMergeResp = await fetch(MERGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: JSON.stringify({
            owner: GIT_REPO_OWNER,
            repo: `${GIT_REPO_NAME}.git`,
            source: 'feat-e2e-11',
            target: 'main',
            message: 'Land module + host app',
          }),
        });
        const moduleMergeBody = await moduleMergeResp.json().catch(() => ({}));
        expect(moduleMergeBody.ok).toBe(true);

        // Pull main → stubs for both the module and the host app land here.
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(201);

        // App list on main → host app is there as a stub.
        const appsOnMainAfterModulePull = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        const mainHostApp = (appsOnMainAfterModulePull.body.apps || []).find(
          (a: any) => a.name === 'e2e-app-with-module'
        );
        expect(mainHostApp).toBeDefined();
        expect(mainHostApp.is_stub).toBe(true);

        // Module list on main → module is there as a stub.
        const modulesOnMainAfterPull = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'module', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        const mainModule = (modulesOnMainAfterPull.body.apps || []).find((m: any) => m.name === 'e2e-test-module');
        expect(mainModule).toBeDefined();
        expect(mainModule.is_stub).toBe(true);
        const mainModuleCoRel: string = mainModule.co_relation_id || mainModule.coRelationId;
        expect(mainModuleCoRel).toBe(moduleCoRelationId);

        // Hydrate host app via GET — server materializes the pulled snapshot
        // AND cascades hydration to the referenced module.
        const hydrateHostResp = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${mainHostApp.id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(hydrateHostResp.body.is_hydration_tried).toBe(true);
        expect(hydrateHostResp.body.hydration_status).toBe('success');
        expect(hydrateHostResp.body.not_hydrated_reason).toBeUndefined();

        // The hydrated host app exposes the module in its `modules` key.
        const hydratedModules = hydrateHostResp.body?.modules || [];
        const hydratedLinkedModule = hydratedModules.find(
          (m: any) => (m.co_relation_id || m.coRelationId) === moduleCoRelationId
        );
        expect(hydratedLinkedModule).toBeDefined();
        expect(hydratedLinkedModule.id).toBe(mainModule.id);

        // Direct GET on the module — it was cascade-hydrated during the host
        // app's open, so this call is a no-op: is_hydration_tried=false and
        // not_hydrated_reason='already-up-to-date'.
        const moduleAfterCascadeResp = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${mainModule.id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(moduleAfterCascadeResp.body.is_hydration_tried).toBe(false);
        expect(moduleAfterCascadeResp.body.not_hydrated_reason).toBe('already-up-to-date');

        // Sanity: module list on main now reports the module as hydrated too.
        const modulesAfterHydrationResp = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'module', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        const hydratedMainModule = (modulesAfterHydrationResp.body.apps || []).find((m: any) => m.id === mainModule.id);
        expect(hydratedMainModule).toBeDefined();
        expect(hydratedMainModule.is_stub).toBe(false);

        // ─── Helpers for steps 55-60 ──────────────────────────────────────
        // Capture-then-mutate-then-restore pattern: we manipulate main's meta
        // files via the Gitea admin endpoint to drive detectAndThrowConflicts
        // through specific scenarios, restoring each file after the assertion
        // so the repo isn't corrupted for subsequent steps.
        const FILES_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/files`;

        const captureGitMeta = async (metaFileName: string): Promise<string> => {
          // The Gitea simulator at this host doesn't serve raw/contents APIs,
          // so we shallow-clone main and read the file off disk.
          const simpleGit = (await import('simple-git')).default;
          const fs = await import('fs');
          const path = await import('path');
          const os = await import('os');
          const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tj-meta-capture-'));
          try {
            const git = simpleGit({
              baseDir: tmpDir,
              timeout: { block: 30000 },
              unsafe: { allowUnsafeCredentialHelper: true },
            });
            await git.clone(`${GIT_BASE_URL}/${GIT_REPO_PATH}.git`, '.', [
              '--branch',
              'main',
              '--depth',
              '1',
              '--single-branch',
            ]);
            return fs.readFileSync(path.join(tmpDir, '.meta', metaFileName), 'utf-8');
          } finally {
            await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
          }
        };

        const writeGitMeta = async (metaFileName: string, content: string, message: string): Promise<void> => {
          const resp = await fetch(FILES_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: BASIC },
            body: JSON.stringify({
              ref: 'main',
              path: `.meta/${metaFileName}`,
              content,
              message,
            }),
          });
          if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            throw new Error(`writeGitMeta(${metaFileName}) ${resp.status} ${text}`);
          }
        };

        const parseConflictGroups = (body: any): any[] | null => {
          if (typeof body?.message !== 'string') return null;
          try {
            const parsed = JSON.parse(body.message);
            return Array.isArray(parsed?.conflictGroups) ? parsed.conflictGroups : null;
          } catch {
            return null;
          }
        };

        step(55, 'pull main with conflicting appMeta (intra-incoming same name) → 409 with conflict details');
        // 55. Inject a fake corid that shares an appPath with an existing entry.
        //     detectAndThrowConflicts must raise a 409 with the colliding
        //     entries enumerated under conflictGroups.
        const originalAppMeta = await captureGitMeta('appMeta.json');
        const appMetaObj = JSON.parse(originalAppMeta);
        // Skip non-entry keys (e.g. lastUpdatedAt) by requiring an
        // `appPath` field on the entry itself.
        const realAppKeys = Object.keys(appMetaObj).filter(
          (k) => appMetaObj[k] && typeof appMetaObj[k] === 'object' && (appMetaObj[k] as any).appPath
        );
        expect(realAppKeys.length).toBeGreaterThan(0);
        const sampleAppEntry = appMetaObj[realAppKeys[0]];

        const { randomUUID: randomUUIDForMeta } = await import('crypto');
        const fakeAppCorid = randomUUIDForMeta();
        const conflictAppMeta = {
          ...appMetaObj,
          [fakeAppCorid]: {
            appPath: sampleAppEntry.appPath,
            updatedAt: new Date().toISOString(),
          },
        };
        await writeGitMeta('appMeta.json', JSON.stringify(conflictAppMeta, null, 2), 'inject app meta conflict');

        const appConflictPullResp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(409);
        const appConflictGroups = parseConflictGroups(appConflictPullResp.body);
        expect(appConflictGroups).not.toBeNull();
        const appConflictGroup = appConflictGroups!.find((g: any) => g.type === 'app');
        expect(appConflictGroup).toBeDefined();
        expect(appConflictGroup.conflictField).toBe('name');
        expect(appConflictGroup.conflicts.length).toBeGreaterThanOrEqual(2);
        expect(appConflictGroup.conflicts.map((c: any) => c.coRelationId)).toContain(fakeAppCorid);

        await writeGitMeta('appMeta.json', originalAppMeta, 'restore app meta');

        step(56, 'pull main with appMeta same name in different folders → 409 with conflict details');
        // 56. Cross-folder variant of step 55. App names are unique per
        //     (branch, type) regardless of folder, so an incoming entry whose
        //     appPath places an app with the SAME final name under a DIFFERENT
        //     folder still collides. The injected appPath differs from every
        //     existing entry, but the derived name (last path segment) matches,
        //     so detectAndThrowConflicts must still raise a 409.
        const originalAppMetaFolder = await captureGitMeta('appMeta.json');
        const appMetaFolderObj = JSON.parse(originalAppMetaFolder);
        const realAppFolderKeys = Object.keys(appMetaFolderObj).filter(
          (k) => appMetaFolderObj[k] && typeof appMetaFolderObj[k] === 'object' && (appMetaFolderObj[k] as any).appPath
        );
        expect(realAppFolderKeys.length).toBeGreaterThan(0);
        const sampleAppFolderEntry = appMetaFolderObj[realAppFolderKeys[0]];
        const sampleAppFolderSegments = sampleAppFolderEntry.appPath.split('/').filter(Boolean);
        const sampleAppFolderName = sampleAppFolderSegments[sampleAppFolderSegments.length - 1];
        expect(sampleAppFolderName).toBeTruthy();

        const fakeAppFolderCorid = randomUUIDForMeta();
        // Same final segment (name), nested under a different folder → distinct appPath.
        const folderedAppPath = `${sampleAppFolderSegments[0]}/e2e-conflict-folder/${sampleAppFolderName}`;
        expect(folderedAppPath).not.toBe(sampleAppFolderEntry.appPath);
        const folderConflictAppMeta = {
          ...appMetaFolderObj,
          [fakeAppFolderCorid]: {
            appPath: folderedAppPath,
            updatedAt: new Date().toISOString(),
          },
        };
        await writeGitMeta(
          'appMeta.json',
          JSON.stringify(folderConflictAppMeta, null, 2),
          'inject cross-folder app name conflict'
        );

        const appFolderConflictPullResp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(409);
        const appFolderConflictGroups = parseConflictGroups(appFolderConflictPullResp.body);
        expect(appFolderConflictGroups).not.toBeNull();
        const appFolderConflictGroup = appFolderConflictGroups!.find((g: any) => g.type === 'app');
        expect(appFolderConflictGroup).toBeDefined();
        expect(appFolderConflictGroup.conflictField).toBe('name');
        expect(appFolderConflictGroup.conflicts.length).toBeGreaterThanOrEqual(2);
        expect(appFolderConflictGroup.conflicts.map((c: any) => c.coRelationId)).toContain(fakeAppFolderCorid);

        await writeGitMeta('appMeta.json', originalAppMetaFolder, 'restore app meta');

        step(57, 'pull main with conflicting moduleMeta (intra-incoming same name) → 409 with conflict details');
        // 57. Same shape as step 55 for modules.
        const originalModuleMeta = await captureGitMeta('moduleMeta.json');
        const moduleMetaObj = JSON.parse(originalModuleMeta);
        const realModuleKeys = Object.keys(moduleMetaObj).filter(
          (k) => moduleMetaObj[k] && typeof moduleMetaObj[k] === 'object' && (moduleMetaObj[k] as any).appPath
        );
        expect(realModuleKeys.length).toBeGreaterThan(0);
        const sampleModuleEntry = moduleMetaObj[realModuleKeys[0]];

        const fakeModuleCorid = randomUUIDForMeta();
        const conflictModuleMeta = {
          ...moduleMetaObj,
          [fakeModuleCorid]: {
            appPath: sampleModuleEntry.appPath,
            updatedAt: new Date().toISOString(),
          },
        };
        await writeGitMeta(
          'moduleMeta.json',
          JSON.stringify(conflictModuleMeta, null, 2),
          'inject module meta conflict'
        );

        const moduleConflictPullResp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(409);
        const moduleConflictGroups = parseConflictGroups(moduleConflictPullResp.body);
        expect(moduleConflictGroups).not.toBeNull();
        const moduleConflictGroup = moduleConflictGroups!.find((g: any) => g.type === 'module');
        expect(moduleConflictGroup).toBeDefined();
        expect(moduleConflictGroup.conflictField).toBe('name');
        expect(moduleConflictGroup.conflicts.length).toBeGreaterThanOrEqual(2);
        expect(moduleConflictGroup.conflicts.map((c: any) => c.coRelationId)).toContain(fakeModuleCorid);

        await writeGitMeta('moduleMeta.json', originalModuleMeta, 'restore module meta');

        step(58, 'pull main with moduleMeta same name in different folders → 409 with conflict details');
        // 58. Cross-folder variant of step 57 for modules — same final name
        //     under a different folder still collides on the (branch, type)
        //     name uniqueness, so the pull must raise a 409.
        const originalModuleMetaFolder = await captureGitMeta('moduleMeta.json');
        const moduleMetaFolderObj = JSON.parse(originalModuleMetaFolder);
        const realModuleFolderKeys = Object.keys(moduleMetaFolderObj).filter(
          (k) =>
            moduleMetaFolderObj[k] && typeof moduleMetaFolderObj[k] === 'object' && (moduleMetaFolderObj[k] as any).appPath
        );
        expect(realModuleFolderKeys.length).toBeGreaterThan(0);
        const sampleModuleFolderEntry = moduleMetaFolderObj[realModuleFolderKeys[0]];
        const sampleModuleFolderSegments = sampleModuleFolderEntry.appPath.split('/').filter(Boolean);
        const sampleModuleFolderName = sampleModuleFolderSegments[sampleModuleFolderSegments.length - 1];
        expect(sampleModuleFolderName).toBeTruthy();

        const fakeModuleFolderCorid = randomUUIDForMeta();
        const folderedModulePath = `${sampleModuleFolderSegments[0]}/e2e-conflict-folder/${sampleModuleFolderName}`;
        expect(folderedModulePath).not.toBe(sampleModuleFolderEntry.appPath);
        const folderConflictModuleMeta = {
          ...moduleMetaFolderObj,
          [fakeModuleFolderCorid]: {
            appPath: folderedModulePath,
            updatedAt: new Date().toISOString(),
          },
        };
        await writeGitMeta(
          'moduleMeta.json',
          JSON.stringify(folderConflictModuleMeta, null, 2),
          'inject cross-folder module name conflict'
        );

        const moduleFolderConflictPullResp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(409);
        const moduleFolderConflictGroups = parseConflictGroups(moduleFolderConflictPullResp.body);
        expect(moduleFolderConflictGroups).not.toBeNull();
        const moduleFolderConflictGroup = moduleFolderConflictGroups!.find((g: any) => g.type === 'module');
        expect(moduleFolderConflictGroup).toBeDefined();
        expect(moduleFolderConflictGroup.conflictField).toBe('name');
        expect(moduleFolderConflictGroup.conflicts.length).toBeGreaterThanOrEqual(2);
        expect(moduleFolderConflictGroup.conflicts.map((c: any) => c.coRelationId)).toContain(fakeModuleFolderCorid);

        await writeGitMeta('moduleMeta.json', originalModuleMetaFolder, 'restore module meta');

        step(59, 'pull main with conflicting dataSourceMeta (intra-incoming same name) → 409 with conflict details');
        // 59. Same shape as step 55 for data sources. The DS conflict
        //     detector keys on the `name` field of the meta entry.
        const originalDsMeta = await captureGitMeta('dataSourceMeta.json');
        const dsMetaObj = JSON.parse(originalDsMeta);
        const realDsKeys = Object.keys(dsMetaObj).filter(
          (k) => dsMetaObj[k] && typeof dsMetaObj[k] === 'object' && (dsMetaObj[k] as any).name
        );
        expect(realDsKeys.length).toBeGreaterThan(0);
        const sampleDsEntry = dsMetaObj[realDsKeys[0]];

        const fakeDsCorid = randomUUIDForMeta();
        const conflictDsMeta = {
          ...dsMetaObj,
          [fakeDsCorid]: {
            ...sampleDsEntry,
            name: sampleDsEntry.name,
          },
        };
        await writeGitMeta('dataSourceMeta.json', JSON.stringify(conflictDsMeta, null, 2), 'inject ds meta conflict');

        const dsConflictPullResp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(409);
        const dsConflictGroups = parseConflictGroups(dsConflictPullResp.body);
        expect(dsConflictGroups).not.toBeNull();
        const dsConflictGroup = dsConflictGroups!.find((g: any) => g.type === 'datasource');
        expect(dsConflictGroup).toBeDefined();
        expect(dsConflictGroup.conflictField).toBe('name');
        expect(dsConflictGroup.conflicts.length).toBeGreaterThanOrEqual(2);
        expect(dsConflictGroup.conflicts.map((c: any) => c.coRelationId)).toContain(fakeDsCorid);

        await writeGitMeta('dataSourceMeta.json', originalDsMeta, 'restore ds meta');

        step(60, 'orphan module + same-name incoming on default → pull succeeds (orphan filter)');
        // 60. Module variant of step 51: a local orphan module on main shares
        //     its name with an incoming git module (different corid). The
        //     orphan-aware conflict detector must exclude the orphan from the
        //     scan so the pull does not raise 409, after which the orphan
        //     sweep deletes the orphan and the incoming module is imported.
        const createBranch12Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e-12', sourceBranchId: mainBranchId })
          .expect(201);
        const feat12BranchId: string = createBranch12Resp.body.id;

        // Orphan module: create on feat-e2e-12, then SQL-mutate its AppVersion
        // onto main as a 'version' row (mirrors the pattern from steps 49/51).
        const orphanModResp = await request
          .agent(app.getHttpServer())
          .post('/api/modules')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat12BranchId)
          .send({ icon: 'folderupload', name: 'orphan-mod-collide', type: 'module', branchId: feat12BranchId })
          .expect(201);
        const orphanModId: string = orphanModResp.body.id;
        await dataSource.query(`UPDATE app_versions SET version_type = 'version', branch_id = $1 WHERE app_id = $2`, [
          mainBranchId,
          orphanModId,
        ]);

        // Same-named module on a separate feature branch, push + merge to main.
        const createBranch13Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e-13', sourceBranchId: mainBranchId })
          .expect(201);
        const feat13BranchId: string = createBranch13Resp.body.id;

        const newModResp = await request
          .agent(app.getHttpServer())
          .post('/api/modules')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat13BranchId)
          .send({ icon: 'folderupload', name: 'orphan-mod-collide', type: 'module', branchId: feat13BranchId })
          .expect(201);
        const newModId: string = newModResp.body.id;
        const newModDetail = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${newModId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat13BranchId)
          .expect(200);
        const newModEditing =
          newModDetail.body?.editing_version ||
          newModDetail.body?.editingVersion ||
          newModDetail.body?.app?.editing_version;
        const newModVersionId: string = newModEditing.id;

        await request
          .agent(app.getHttpServer())
          .post(`/api/app-git/gitpush/${newModId}/${newModVersionId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat13BranchId)
          .send({
            gitAppName: 'orphan-mod-collide',
            versionId: newModVersionId,
            lastCommitMessage: 'collide-mod on feat-e2e-13',
            gitVersionName: 'feat-e2e-13',
            sourceBranch: 'feat-e2e-13',
          })
          .expect(201);

        const orphanModMergeResp = await fetch(MERGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: JSON.stringify({
            owner: GIT_REPO_OWNER,
            repo: `${GIT_REPO_NAME}.git`,
            source: 'feat-e2e-13',
            target: 'main',
            message: 'Land orphan-mod-collide module',
          }),
        });
        expect((await orphanModMergeResp.json().catch(() => ({}))).ok).toBe(true);

        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(201);

        // Orphan App row gone (main was its only branch after mutation).
        const orphanModAfterPull = await dataSource.query(`SELECT id FROM apps WHERE id = $1`, [orphanModId]);
        expect(orphanModAfterPull).toHaveLength(0);

        // Exactly one 'orphan-mod-collide' module sits on main now.
        const modOnMainAfterPull = await dataSource.query(
          `SELECT app.id
             FROM apps app
             INNER JOIN app_versions av ON av.app_id = app.id
            WHERE app.organization_id = $1
              AND app.type = $2
              AND av.branch_id = $3
              AND av.app_name = 'orphan-mod-collide'`,
          [orgId, 'module', mainBranchId]
        );
        expect(modOnMainAfterPull).toHaveLength(1);
        expect(modOnMainAfterPull[0].id).not.toBe(orphanModId);

        step(61, 'orphan data source + same-name incoming on default → pull succeeds (orphan filter)');
        // 61. Data-source variant: create a DS on a feature branch, SQL-move
        //     its DSV onto main as an "orphan" (no matching file in main's
        //     data-sources/), then create+push a same-named DS on another
        //     feature branch and merge to main. The orphan-aware detector
        //     must exclude the orphan DS so the pull succeeds.
        //
        // Note on branch ordering: feat15 must be created BEFORE the orphan is
        // moved onto main. cloneDataSourceVersions runs at branch-create time
        // and clones every active main-branch DSV into the new branch — if the
        // orphan already lived on main, feat15 would inherit a DSV for it, the
        // push from feat15 would re-serialize the orphan into git, and after
        // merge main would no longer treat it as an orphan. Creating feat15
        // first keeps the orphan exclusive to main.
        const createBranch14Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e-14', sourceBranchId: mainBranchId })
          .expect(201);
        const feat14BranchId: string = createBranch14Resp.body.id;

        const createBranch15Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e-15', sourceBranchId: mainBranchId })
          .expect(201);
        const feat15BranchId: string = createBranch15Resp.body.id;

        const orphanDsResp = await request
          .agent(app.getHttpServer())
          .post(`/api/data-sources?branch_id=${feat14BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat14BranchId)
          .send({
            name: 'orphan-ds-collide',
            kind: 'restapi',
            options: restapiCreateOptions,
            scope: 'global',
          })
          .expect(201);
        const orphanDsId: string = orphanDsResp.body.id;

        // Move the orphan DSV onto main. feat15 doesn't yet have a DSV for
        // this DS (we created feat15 before the orphan existed), so feat15's
        // workspace push won't re-serialize the orphan into git — main will
        // see no matching file in data-sources/ after the merge.
        await dataSource.query(`UPDATE data_source_versions SET branch_id = $1 WHERE data_source_id = $2`, [
          mainBranchId,
          orphanDsId,
        ]);

        const newDsResp_orphan = await request
          .agent(app.getHttpServer())
          .post(`/api/data-sources?branch_id=${feat15BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat15BranchId)
          .send({
            name: 'orphan-ds-collide',
            kind: 'restapi',
            options: restapiCreateOptions,
            scope: 'global',
          })
          .expect(201);
        const newDsForOrphanTestId: string = newDsResp_orphan.body.id;
        expect(newDsForOrphanTestId).not.toBe(orphanDsId);

        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/push')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat15BranchId)
          .send({ commitMessage: 'collide-ds on feat-e2e-15', branchId: feat15BranchId })
          .expect(201);

        const orphanDsMergeResp = await fetch(MERGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: JSON.stringify({
            owner: GIT_REPO_OWNER,
            repo: `${GIT_REPO_NAME}.git`,
            source: 'feat-e2e-15',
            target: 'main',
            message: 'Land orphan-ds-collide',
          }),
        });
        expect((await orphanDsMergeResp.json().catch(() => ({}))).ok).toBe(true);

        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(201);

        // Orphan DSV on main is deactivated by the deserialize sweep — its
        // corid is absent from main's data-sources/ after the merge.
        const orphanDsvAfterPull = await dataSource.query(
          `SELECT is_active FROM data_source_versions
            WHERE data_source_id = $1 AND branch_id = $2`,
          [orphanDsId, mainBranchId]
        );
        expect(orphanDsvAfterPull).toHaveLength(1);
        expect(orphanDsvAfterPull[0].is_active).toBe(false);

        // The new DS pushed from feat15 has its own active DSV on main.
        // The DS API auto-renames on collision (generateUniqueName), so the
        // new DS landed with a suffixed name like 'orphan-ds-collide_N'; the
        // assertion just checks an additional active DSV exists.
        const newDsvOnMain = await dataSource.query(
          `SELECT dsv.id, ds.name
             FROM data_source_versions dsv
             INNER JOIN data_sources ds ON ds.id = dsv.data_source_id
            WHERE ds.organization_id = $1
              AND ds.name LIKE 'orphan-ds-collide%'
              AND ds.id <> $2
              AND dsv.branch_id = $3
              AND dsv.is_active = true`,
          [orgId, orphanDsId, mainBranchId]
        );
        expect(newDsvOnMain.length).toBeGreaterThanOrEqual(1);

        step(62, 'matched data source renamed into an orphan\'s active name → pull succeeds (orphan branch DSV renamed)');
        // 62. Regression for the matched-rename branch-DSV collision. A data
        //     source already on main (matched by co_relation_id, present in git)
        //     is renamed in git to a name an *orphan* DSV on main still holds.
        //     The orphan rename in deserialize used to run only for brand-new
        //     data sources (the `!ds` path), so a matched-and-renamed DS tripped
        //     idx_unique_active_name_branch. The shared guard must now rename the
        //     orphan branch DSV first so the matched DS can take the name; the
        //     default-DSV sync must likewise dodge
        //     data_source_version_default_name_organization_id_unique.
        //
        // Branch ordering mirrors step 61: feat-e2e-18 (where we rename) is
        // created BEFORE the orphan is moved onto main, so the rename branch
        // never inherits the orphan name via cloneDataSourceVersions.

        // (a) Land a normal DS on main → becomes a matched DS (corid in git).
        const createBranch16Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e-16', sourceBranchId: mainBranchId })
          .expect(201);
        const feat16BranchId: string = createBranch16Resp.body.id;

        const matchedSrcDsResp = await request
          .agent(app.getHttpServer())
          .post(`/api/data-sources?branch_id=${feat16BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat16BranchId)
          .send({ name: 'matched-rename-src', kind: 'restapi', options: restapiCreateOptions, scope: 'global' })
          .expect(201);
        const matchedSrcDsId: string = matchedSrcDsResp.body.id;

        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/push')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat16BranchId)
          .send({ commitMessage: 'land matched-rename-src', branchId: feat16BranchId })
          .expect(201);

        const matchedSrcMergeResp = await fetch(MERGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner: GIT_REPO_OWNER,
            repo: `${GIT_REPO_NAME}.git`,
            source: 'feat-e2e-16',
            target: 'main',
            message: 'Land matched-rename-src',
          }),
        });
        expect((await matchedSrcMergeResp.json().catch(() => ({}))).ok).toBe(true);

        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(201);

        // (b) Create the rename branch NOW — clones the matched DS, but main has
        //     no orphan yet, so feat-e2e-18 stays free of the orphan name.
        const createBranch18Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e-18', sourceBranchId: mainBranchId })
          .expect(201);
        const feat18BranchId: string = createBranch18Resp.body.id;

        // (c) Create an orphan DS named 'matched-rename-dst' and SQL-move its DSV
        //     onto main (corid never pushed → absent from main's data-sources/).
        const createBranch17Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e-17', sourceBranchId: mainBranchId })
          .expect(201);
        const feat17BranchId: string = createBranch17Resp.body.id;

        const orphanDstDsResp = await request
          .agent(app.getHttpServer())
          .post(`/api/data-sources?branch_id=${feat17BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat17BranchId)
          .send({ name: 'matched-rename-dst', kind: 'restapi', options: restapiCreateOptions, scope: 'global' })
          .expect(201);
        const orphanDstDsId: string = orphanDstDsResp.body.id;
        expect(orphanDstDsId).not.toBe(matchedSrcDsId);

        await dataSource.query(`UPDATE data_source_versions SET branch_id = $1 WHERE data_source_id = $2`, [
          mainBranchId,
          orphanDstDsId,
        ]);

        // (d) Rename the matched DS to the orphan's name on feat-e2e-18, push.
        await request
          .agent(app.getHttpServer())
          .put(`/api/data-sources/${matchedSrcDsId}?environment_id=${dsDevEnv.id}&branch_id=${feat18BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat18BranchId)
          .send({ name: 'matched-rename-dst', options: buildUpdateOptions('http://renamed.url.com') })
          .expect(200);

        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/push')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat18BranchId)
          .send({ commitMessage: 'rename matched-rename-src → matched-rename-dst', branchId: feat18BranchId })
          .expect(201);

        const renameMergeResp = await fetch(MERGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner: GIT_REPO_OWNER,
            repo: `${GIT_REPO_NAME}.git`,
            source: 'feat-e2e-18',
            target: 'main',
            message: 'Land matched-rename-dst rename',
          }),
        });
        expect((await renameMergeResp.json().catch(() => ({}))).ok).toBe(true);

        // Pull main — previously 500 (idx_unique_active_name_branch); now 201.
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(201);

        // (e) Matched DS now carries the orphan's old name on main, active.
        const matchedSrcAfter = await dataSource.query(
          `SELECT name, is_active FROM data_source_versions
            WHERE data_source_id = $1 AND branch_id = $2`,
          [matchedSrcDsId, mainBranchId]
        );
        expect(matchedSrcAfter).toHaveLength(1);
        expect(matchedSrcAfter[0].is_active).toBe(true);
        expect(matchedSrcAfter[0].name).toBe('matched-rename-dst');

        // (f) Orphan branch DSV was renamed out of the way and/or deactivated by
        //     the sweep — either way it no longer holds the active name.
        const orphanDstAfter = await dataSource.query(
          `SELECT name, is_active FROM data_source_versions
            WHERE data_source_id = $1 AND branch_id = $2`,
          [orphanDstDsId, mainBranchId]
        );
        expect(orphanDstAfter).toHaveLength(1);
        const orphanFreedTheName =
          orphanDstAfter[0].name !== 'matched-rename-dst' || orphanDstAfter[0].is_active === false;
        expect(orphanFreedTheName).toBe(true);

        // (g) Exactly one ACTIVE non-default DSV named 'matched-rename-dst' on
        //     main → idx_unique_active_name_branch satisfied; it's the matched DS.
        const activeBranchDst = await dataSource.query(
          `SELECT dsv.id, dsv.data_source_id FROM data_source_versions dsv
             INNER JOIN data_sources ds ON ds.id = dsv.data_source_id
            WHERE ds.organization_id = $1 AND dsv.branch_id = $2
              AND LOWER(dsv.name) = LOWER('matched-rename-dst')
              AND dsv.is_active = true AND dsv.is_default = false`,
          [orgId, mainBranchId]
        );
        expect(activeBranchDst).toHaveLength(1);
        expect(activeBranchDst[0].data_source_id).toBe(matchedSrcDsId);

        // (h) Exactly one ACTIVE default DSV named 'matched-rename-dst' in the org
        //     → data_source_version_default_name_organization_id_unique satisfied.
        const activeDefaultDst = await dataSource.query(
          `SELECT dsv.id FROM data_source_versions dsv
             INNER JOIN data_sources ds ON ds.id = dsv.data_source_id
            WHERE ds.organization_id = $1
              AND LOWER(dsv.name) = LOWER('matched-rename-dst')
              AND dsv.is_active = true AND dsv.is_default = true`,
          [orgId]
        );
        expect(activeDefaultDst).toHaveLength(1);

        step(63, 'delete data source A on a branch, then rename B → A → succeeds (branch-aware name check)');
        // 63. Regression for the CRUD rename check. Deleting a global DS on a
        //     feature branch only soft-deletes its branch DSV (is_active=false);
        //     the data_sources row survives. The rename validation used to query
        //     data_sources, so renaming another DS into the freed name was
        //     wrongly rejected as "already exists". The branch-aware check now
        //     looks at active branch DSVs, so the rename succeeds.
        const createBranch19Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e-19', sourceBranchId: mainBranchId })
          .expect(201);
        const feat19BranchId: string = createBranch19Resp.body.id;

        const delRenameAResp = await request
          .agent(app.getHttpServer())
          .post(`/api/data-sources?branch_id=${feat19BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat19BranchId)
          .send({ name: 'del-rename-a', kind: 'restapi', options: restapiCreateOptions, scope: 'global' })
          .expect(201);
        const delRenameAId: string = delRenameAResp.body.id;

        const delRenameBResp = await request
          .agent(app.getHttpServer())
          .post(`/api/data-sources?branch_id=${feat19BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat19BranchId)
          .send({ name: 'del-rename-b', kind: 'restapi', options: restapiCreateOptions, scope: 'global' })
          .expect(201);
        const delRenameBId: string = delRenameBResp.body.id;

        // Delete A on the branch → soft-deletes its branch DSV.
        await request
          .agent(app.getHttpServer())
          .delete(`/api/data-sources/${delRenameAId}?branch_id=${feat19BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat19BranchId)
          .expect(200);

        // Rename B → A. Previously 400 ("already exists"); now 200.
        await request
          .agent(app.getHttpServer())
          .put(`/api/data-sources/${delRenameBId}?environment_id=${dsDevEnv.id}&branch_id=${feat19BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat19BranchId)
          .send({ name: 'del-rename-a', options: buildUpdateOptions('http://b-renamed.url.com') })
          .expect(200);

        // B's active branch DSV now carries the freed name.
        const bAfterRename = await dataSource.query(
          `SELECT name FROM data_source_versions
            WHERE data_source_id = $1 AND branch_id = $2 AND is_active = true`,
          [delRenameBId, feat19BranchId]
        );
        expect(bAfterRename).toHaveLength(1);
        expect(bAfterRename[0].name).toBe('del-rename-a');

        // A's branch DSV stays soft-deleted.
        const aAfterDelete = await dataSource.query(
          `SELECT is_active FROM data_source_versions
            WHERE data_source_id = $1 AND branch_id = $2`,
          [delRenameAId, feat19BranchId]
        );
        expect(aAfterDelete).toHaveLength(1);
        expect(aAfterDelete[0].is_active).toBe(false);
      }, 540000);
    });
  });
});
