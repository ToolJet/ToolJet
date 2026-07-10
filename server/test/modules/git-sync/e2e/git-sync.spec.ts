import { INestApplication } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  createUser,
  initTestApp,
  logout,
  login,
  closeTestApp,
  ensureAppEnvironments,
  setTestLicenseTerms,
  restoreLicensePlan,
} from 'test-helper';
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
      // Session teardown is best-effort. The full-lifecycle test mutates a lot of
      // workspace/git state, which can make the ability-guard precheck on /session/logout
      // return 403 by the time this cleanup runs — that must not fail the test, whose own
      // assertions have already run. The lighter tests in this block log out cleanly.
      try {
        await logout(app, tokenCookie, orgId);
      } catch {
        /* ignore — cleanup only */
      }
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

        // The org is shared across the tests in this block (top-level beforeAll) and
        // afterEach does not prune branches, so other tests' feature branches may also be
        // present depending on run order/retries. Assert the invariant that actually
        // matters here: saving the provider config seeds exactly ONE default branch — the
        // configured branch (main) — and surfaces it as activeBranchId.
        const defaultBranches = branchesResp.body.branches.filter((b: any) => b.isDefault);
        expect(defaultBranches).toHaveLength(1);
        const [mainBranch] = defaultBranches;
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
          .query({ branch_id: mainBranchId })
          .expect(200);
        // listRemoteBranches now returns { branches: [{ id, name, isDefault, ... }] }.
        expect(remoteAfterReset.body.branches.map((b: any) => b.name)).toEqual(['main']);

        step(3, 'check-updates on main → hasUpdates');
        // 3. Check for updates on main — initial commit is fresher than the
        //    seeded workspace state, so hasUpdates is true with commit info.
        const checkUpdatesResp = await request
          .agent(app.getHttpServer())
          .get('/api/workspace-branches/check-updates')
          .query({ branch: 'main' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
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
          .query({ branch_id: mainBranchId })
          .send({ branchId: mainBranchId })
          .expect(201);

        step(5, 'create feat-e2e branch off main');
        // 5. Create a feature branch off main.
        const createBranchResp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
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
        // 6. List branches → main + feat-e2e. Creating a branch switches the creator onto it
        //    (persisted as OrganizationUser.lastBranchId), so the active branch is now feat-e2e.
        const twoBranchesResp = await request
          .agent(app.getHttpServer())
          .get('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .expect(200);
        expect(twoBranchesResp.body.branches).toHaveLength(2);
        expect(twoBranchesResp.body.activeBranchId).toBe(featBranchId);
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
          .query({ branch_id: featBranchId })
          .expect(200);
        // `/remote` is now backed by the GitHub GraphQL API + a Redis cache that is warmed
        // asynchronously (invalidateAndWarm, fire-and-forget) after branch mutations, so its
        // contents aren't deterministic immediately after creating a branch in this e2e. The
        // authoritative "main + feat-e2e exist" assertion is step 6 above (DB-backed
        // /api/workspace-branches). Here we only smoke-test the { branches: [...] } response shape.
        expect(Array.isArray(remoteAfterCreate.body.branches)).toBe(true);

        step(9, 'create app on feat-e2e (and reject create on main)');
        // 9a. Negative case: creating an app directly on the default branch
        //     must be rejected — branching enabled means apps are only
        //     authored on feature branches.
        await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ icon: 'home', name: 'testing-app-1', type: 'front-end', branchId: mainBranchId })
          .expect(400);

        // 9b. Happy path on the feature branch.

        const createAppResp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: featBranchId })
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
          .query({ branch_id: featBranchId })
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
          .query({ branch_id: featBranchId })
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
          .query({ branch_id: featBranchId })
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
          .query({ branch_id: featBranchId })
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
          .query({ branch_id: featBranchId })
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
          .query({ branch_id: mainBranchId })
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
          .query({ branch_id: mainBranchId })
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
          .query({ branch_id: mainBranchId })
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
          .query({ branch_id: mainBranchId })
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
          .query({ branch_id: mainBranchId })
          .expect(200);
        expect(checkTagResp.body.exists).toBe(false);
        expect(checkTagResp.body.tagName).toBe(`${hydratedApp.co_relation_id}/v1`);

        await request
          .agent(app.getHttpServer())
          .put(`/api/v2/apps/${hydratedApp.id}/versions/${hydratedVersion.id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
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
          .query({ branch_id: mainBranchId })
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
          .query({ branch_id: mainBranchId })
          .expect(200);
        expect(versionsAfterPublish.body.appVersions).toHaveLength(3);

        const publishedV1 = versionsAfterPublish.body.appVersions.find((v: any) => v.name === 'v1');
        expect(publishedV1).toBeDefined();
        expect(publishedV1).toMatchObject({
          status: 'PUBLISHED',
          versionType: 'version',
        });

        // The newly-seeded DRAFT on the main branch — not the published v1 (which stays on
        // the default branch as a PUBLISHED row; publish no longer detaches branch_id).
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
          .query({ branch_id: mainBranchId })
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
          .query({ branch_id: feat2BranchId })
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
          .query({ branch_id: feat2BranchId })
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
          .query({ branch_id: feat2BranchId })
          .send({
            app: {
              slug: 'testing-app-2-slug',
              branch_id: feat2BranchId,
            },
          })
          .expect(200);

        step(25, 'change icon to sentfast on feat-e2e-2');
        await request
          .agent(app.getHttpServer())
          .put(`/api/apps/${hydratedApp.id}/icons`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat2BranchId })
          .send({ icon: 'sentfast', branch_id: feat2BranchId })
          .expect(200);

        step(26, 'flip is_public=true on feat-e2e-2');
        await request
          .agent(app.getHttpServer())
          .put(`/api/apps/${hydratedApp.id}/public`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat2BranchId })
          .send({ app: { is_public: true, branch_id: feat2BranchId } })
          .expect(200);

        step(27, 'gitpush commit feat-e2e-2 (name + slug + icon + is_public)');
        await request
          .agent(app.getHttpServer())
          .post(`/api/app-git/gitpush/${hydratedApp.id}/${feat2VersionId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat2BranchId })
          .send({
            gitAppName: 'testing-app-2',
            versionId: feat2VersionId,
            lastCommitMessage: 'changed name, slug, icon, is_public',
            gitVersionName: 'feat-e2e-2',
            sourceBranch: 'feat-e2e-2',
          })
          .expect(201);

        step(28, 'merge feat-e2e-2 → main on Gitea');
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

        step(29, 'switch to main & list apps → still pre-pull name testing-app-1');
        // 27. Before pulling, main's local snapshot still reflects the
        //     previous merge (name=testing-app-1).
        const appsBeforePull = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        expect(appsBeforePull.body.apps).toHaveLength(1);
        expect(appsBeforePull.body.apps[0].name).toBe('testing-app-1');

        step(30, 'check-updates on main → hasUpdates true (merge commit ahead)');
        const checkUpdatesAfterMerge = await request
          .agent(app.getHttpServer())
          .get('/api/workspace-branches/check-updates')
          .query({ branch: 'main' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .expect(200);
        expect(checkUpdatesAfterMerge.body.hasUpdates).toBe(true);
        expect(checkUpdatesAfterMerge.body.latestCommit.sha).toEqual(expect.any(String));

        step(31, 'pull main');
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ branchId: mainBranchId })
          .expect(201);

        step(32, 'list apps on main → name testing-app-2 (slug still stub uuid)');
        const appsAfterPull = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        expect(appsAfterPull.body.apps).toHaveLength(1);
        const renamedApp = appsAfterPull.body.apps[0];
        expect(renamedApp.name).toBe('testing-app-2');

        step(33, 'pull-from-builder + ensure-draft → new draft version id');
        const builderPull = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ branchId: mainBranchId })
          .expect(201);
        expect(builderPull.body?.success ?? true).toBeTruthy();

        const ensureDraftResp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/ensure-draft')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ appId: hydratedApp.id, branchId: mainBranchId })
          .expect(201);
        const draftVersionId: string = ensureDraftResp.body.draftVersionId;
        expect(draftVersionId).toBeDefined();

        step(34, 'GET draft version → name + slug + icon + is_public propagated');
        const draftDetail = await request
          .agent(app.getHttpServer())
          .get(`/api/v2/apps/${hydratedApp.id}/versions/${draftVersionId}`)
          .query({ mode: 'edit' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .expect(200);
        expect(draftDetail.body.name).toBe('testing-app-2');
        expect(draftDetail.body.slug).toBe('testing-app-2-slug');
        expect(draftDetail.body.icon).toBe('sentfast');
        expect(draftDetail.body.isPublic).toBe(true);

        step(35, 'GET published v1 → editing_version PUBLISHED + inherits main draft name/slug');
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
          .query({ branch_id: mainBranchId })
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

        step(36, 'promote v1 through envs (dev → staging → production) + release');
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
          .query({ branch_id: mainBranchId })
          .expect(200);
        const envs = (envListResp.body.environments as any[]).sort((a, b) => a.priority - b.priority);
        expect(envs.length).toBeGreaterThanOrEqual(3);
        const [devEnv, stagingEnv, prodEnv] = envs;

        await request
          .agent(app.getHttpServer())
          .put(`/api/v2/apps/${hydratedApp.id}/versions/${publishedV1Id}/promote`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ currentEnvironmentId: devEnv.id })
          .expect(200);

        await request
          .agent(app.getHttpServer())
          .put(`/api/v2/apps/${hydratedApp.id}/versions/${publishedV1Id}/promote`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ currentEnvironmentId: stagingEnv.id })
          .expect(200);

        await request
          .agent(app.getHttpServer())
          .put(`/api/apps/${hydratedApp.id}/release`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ versionToBeReleased: publishedV1Id })
          .expect(200);

        step(37, 'released-app access + slug lookup + default env (production)');
        const validateAccess = await request
          .agent(app.getHttpServer())
          .get('/api/apps/validate-released-app-access/testing-app-2-slug')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
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
          .query({ branch_id: mainBranchId })
          .expect(200);

        const defaultEnvResp = await request
          .agent(app.getHttpServer())
          .get('/api/app-environments/default')
          .query({ slug: 'testing-app-2-slug' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
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

        step(38, 'feat-e2e-3: duplicate app name (testing-app-2) → 400');
        // 36. Create another feature branch. Posting an app with a name that
        //     already exists in the workspace must be rejected.
        const createBranch3Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-e2e-3', sourceBranchId: mainBranchId })
          .expect(201);
        const feat3BranchId: string = createBranch3Resp.body.id;

        await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat3BranchId })
          .send({
            icon: 'home',
            name: 'testing-app-2',
            type: 'front-end',
            branchId: feat3BranchId,
          })
          .expect(400);

        step(39, 'feat-e2e-3: unique name OK; duplicate slug 4xx; unique slug OK');
        // 37. Same branch, fresh name → create succeeds. PUTting the existing
        //     slug must fail; a unique slug must succeed.
        const createApp3Resp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat3BranchId })
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
          .query({ branch_id: feat3BranchId })
          .expect(200);
        const app3EditingVersion = app3Detail.body?.editing_version || app3Detail.body?.editingVersion;
        const app3VersionId: string = app3EditingVersion.id;

        await request
          .agent(app.getHttpServer())
          .put(`/api/apps/${app3Id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat3BranchId })
          .send({ app: { slug: 'testing-app-2-slug', branch_id: feat3BranchId } })
          .expect(400);

        await request
          .agent(app.getHttpServer())
          .put(`/api/apps/${app3Id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat3BranchId })
          .send({ app: { slug: 'testing-app-3-slug', branch_id: feat3BranchId } })
          .expect(200);

        step(40, 'commit + merge feat-e2e-3 → main, verify name + slug');
        // 38. Push the third feature branch, merge into main, pull, and
        //     confirm both testing-app-2 and testing-app-3 surface with
        //     their slugs after a builder-pull + ensure-draft.
        await request
          .agent(app.getHttpServer())
          .post(`/api/app-git/gitpush/${app3Id}/${app3VersionId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat3BranchId })
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
          .query({ branch_id: mainBranchId })
          .send({ branchId: mainBranchId })
          .expect(201);

        const appsAfterFeat3Merge = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
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
          .query({ branch_id: mainBranchId })
          .send({ appId: app3OnMain.id, branchId: mainBranchId })
          .expect(201);
        const app3DraftVersionId: string = ensureApp3Draft.body.draftVersionId;

        const app3DraftDetail = await request
          .agent(app.getHttpServer())
          .get(`/api/v2/apps/${app3OnMain.id}/versions/${app3DraftVersionId}`)
          .query({ mode: 'edit' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .expect(200);
        expect(app3DraftDetail.body.name).toBe('testing-app-3');
        expect(app3DraftDetail.body.slug).toBe('testing-app-3-slug');

        step(41, 'create feat-e2e-4 branch off main; create testing-app-4 & testing-app-5');
        // 39. Fresh feature branch + two apps to exercise folder membership.
        const createBranch4Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-e2e-4', sourceBranchId: mainBranchId })
          .expect(201);
        const feat4BranchId: string = createBranch4Resp.body.id;
        expect(feat4BranchId).toBeDefined();

        const createApp4Resp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat4BranchId })
          .send({ icon: 'home', name: 'testing-app-4', type: 'front-end', branchId: feat4BranchId })
          .expect(201);
        const app4Id: string = createApp4Resp.body.id;
        expect(app4Id).toBeDefined();

        const createApp5Resp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat4BranchId })
          .send({ icon: 'home', name: 'testing-app-5', type: 'front-end', branchId: feat4BranchId })
          .expect(201);
        const app5Id: string = createApp5Resp.body.id;
        expect(app5Id).toBeDefined();

        step(42, 'create folder test-folder-1');
        // 40. Folders are org-scoped (not branch-scoped) — no branch_id needed.
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

        step(43, 'list folders on feat-e2e-4 → test-folder-1 present with 0 apps');
        // 41. The folder is visible on the branch but has no folder_apps rows yet.
        const foldersInitial = await request
          .agent(app.getHttpServer())
          .get('/api/folder-apps')
          .query({ searchKey: '', type: 'front-end' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat4BranchId })
          .expect(200);
        const newFolderInitial = foldersInitial.body.folders.find((f: any) => f.id === folderId);
        expect(newFolderInitial).toBeDefined();
        expect(newFolderInitial.count).toBe(0);
        expect(newFolderInitial.folder_apps).toEqual([]);

        step(44, 'add testing-app-4 to test-folder-1');
        // 42. Single-app add → folder_apps row scoped to feat-e2e-4.
        await request
          .agent(app.getHttpServer())
          .post('/api/folder-apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat4BranchId })
          .send({ folder_id: folderId, app_id: app4Id })
          .expect(201);

        step(45, 'list folders → test-folder-1 count = 1 (branch-scoped folder_app)');
        const foldersAfterAdd = await request
          .agent(app.getHttpServer())
          .get('/api/folder-apps')
          .query({ searchKey: '', type: 'front-end' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat4BranchId })
          .expect(200);
        const folderWithOne = foldersAfterAdd.body.folders.find((f: any) => f.id === folderId);
        expect(folderWithOne.count).toBe(1);
        expect(folderWithOne.folder_apps).toHaveLength(1);
        expect(folderWithOne.folder_apps[0]).toMatchObject({
          folder_id: folderId,
          app_id: app4Id,
          branch_id: feat4BranchId,
        });

        step(46, 'bulk add testing-app-4 & testing-app-5 to test-folder-1 (single request)');
        // 44. Bulk add — app4 already present (idempotent), app5 newly added.
        await request
          .agent(app.getHttpServer())
          .post('/api/folder-apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat4BranchId })
          .send({ app_ids: [app4Id, app5Id], folder_id: folderId })
          .expect(201);

        step(47, 'list folders → test-folder-1 count = 2');
        const foldersAfterBulk = await request
          .agent(app.getHttpServer())
          .get('/api/folder-apps')
          .query({ searchKey: '', type: 'front-end' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat4BranchId })
          .expect(200);
        const folderWithTwo = foldersAfterBulk.body.folders.find((f: any) => f.id === folderId);
        expect(folderWithTwo.count).toBe(2);
        expect(folderWithTwo.folder_apps).toHaveLength(2);
        const appIdsInFolder = folderWithTwo.folder_apps.map((fa: any) => fa.app_id).sort();
        expect(appIdsInFolder).toEqual([app4Id, app5Id].sort());
        folderWithTwo.folder_apps.forEach((fa: any) => expect(fa.branch_id).toBe(feat4BranchId));

        step(48, 'commit app4 & app5, merge feat-e2e-4 → main, pull, validate folder mapping on main');
        // 46. Folder membership rides through git: foldered apps serialize under
        //     apps/<folder>/<app>/, so after merge+pull the mapping is recreated
        //     on main (as NEW App rows sharing co_relation_id, scoped to main's branch_id).

        // Resolve each app's editing version id on feat-e2e-4 for the gitpush.
        const app4Detail = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${app4Id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat4BranchId })
          .expect(200);
        const app4VersionId: string = (app4Detail.body?.editing_version || app4Detail.body?.editingVersion).id;

        const app5Detail = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${app5Id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat4BranchId })
          .expect(200);
        const app5VersionId: string = (app5Detail.body?.editing_version || app5Detail.body?.editingVersion).id;

        // Commit both foldered apps to feat-e2e-4.
        await request
          .agent(app.getHttpServer())
          .post(`/api/app-git/gitpush/${app4Id}/${app4VersionId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat4BranchId })
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
          .query({ branch_id: feat4BranchId })
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
          .query({ branch_id: mainBranchId })
          .send({ branchId: mainBranchId })
          .expect(201);

        // Resolve the main-branch app ids by name (new App rows, different ids).
        const appsOnMainAfterFeat4 = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
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
          .query({ branch_id: mainBranchId })
          .expect(200);
        const folderOnMain = foldersOnMain.body.folders.find((f: any) => f.id === folderId);
        expect(folderOnMain).toBeDefined();
        expect(folderOnMain.count).toBe(2);
        expect(folderOnMain.folder_apps).toHaveLength(2);
        const mainFolderAppIds = folderOnMain.folder_apps.map((fa: any) => fa.app_id).sort();
        expect(mainFolderAppIds).toEqual([mainApp4.id, mainApp5.id].sort());
        folderOnMain.folder_apps.forEach((fa: any) => expect(fa.branch_id).toBe(mainBranchId));

        step(49, 'hydration failure: invalid repo URL surfaces hydration_error on GET /apps/:id');
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
          .query({ branch_id: mainBranchId })
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
          .query({ branch_id: mainBranchId })
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
          .query({ branch_id: mainBranchId })
          .expect(200);
        expect(healthyResp.body.is_hydration_tried).toBe(false);
        expect(healthyResp.body.not_hydrated_reason).toBe('already-up-to-date');

        step(50, 'per-app pull via ensure-draft preserves folder mapping (sibling check to step 48)');
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
          .query({ branch_id: mainBranchId })
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
          .query({ branch_id: feat5BranchId })
          .send({ icon: 'home', name: 'testing-app-6', type: 'front-end', branchId: feat5BranchId })
          .expect(201);
        const app6Id: string = createApp6Resp.body.id;

        const createApp7Resp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat5BranchId })
          .send({ icon: 'home', name: 'testing-app-7', type: 'front-end', branchId: feat5BranchId })
          .expect(201);
        const app7Id: string = createApp7Resp.body.id;

        // Bulk-add both to test-folder-1 on feat-e2e-5.
        await request
          .agent(app.getHttpServer())
          .post('/api/folder-apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat5BranchId })
          .send({ app_ids: [app6Id, app7Id], folder_id: folderId })
          .expect(201);

        // Resolve editing version ids on feat-e2e-5 for the gitpush.
        const app6Detail = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${app6Id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat5BranchId })
          .expect(200);
        const app6VersionId: string = (app6Detail.body?.editing_version || app6Detail.body?.editingVersion).id;

        const app7Detail = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${app7Id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat5BranchId })
          .expect(200);
        const app7VersionId: string = (app7Detail.body?.editing_version || app7Detail.body?.editingVersion).id;

        // Push both foldered apps.
        await request
          .agent(app.getHttpServer())
          .post(`/api/app-git/gitpush/${app6Id}/${app6VersionId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat5BranchId })
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
          .query({ branch_id: feat5BranchId })
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
          .query({ branch_id: mainBranchId })
          .send({ branchId: mainBranchId })
          .expect(201);

        // Resolve the new main-branch App ids by name; both should still be stubs.
        const appsOnMainBeforeEnsure = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
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
          .query({ branch_id: mainBranchId })
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
          .query({ branch_id: mainBranchId })
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
          .expect(200);
        const hydratedApp6 = appsAfterEnsure6.body.apps.find((a: any) => a.id === mainApp6.id);
        expect(hydratedApp6.is_stub).toBe(false);

        const foldersAfterEnsure6 = await request
          .agent(app.getHttpServer())
          .get('/api/folder-apps')
          .query({ searchKey: '', type: 'front-end' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
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
          .query({ branch_id: mainBranchId })
          .send({ appId: mainApp7.id, branchId: mainBranchId })
          .expect(201);
        expect(ensureApp7Resp.body.draftVersionId).toBeDefined();

        const appsAfterEnsure7 = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        const hydratedApp7 = appsAfterEnsure7.body.apps.find((a: any) => a.id === mainApp7.id);
        expect(hydratedApp7.is_stub).toBe(false);

        const foldersAfterEnsure7 = await request
          .agent(app.getHttpServer())
          .get('/api/folder-apps')
          .query({ searchKey: '', type: 'front-end' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .expect(200);
        const folderAfterEnsure7 = foldersAfterEnsure7.body.folders.find((f: any) => f.id === folderId);
        expect(folderAfterEnsure7.count).toBe(4);
        expect(folderAfterEnsure7.folder_apps.map((fa: any) => fa.app_id).sort()).toEqual(expectedAllFolderAppIds);
        folderAfterEnsure7.folder_apps.forEach((fa: any) => expect(fa.branch_id).toBe(mainBranchId));

        step(51, 'feature-branch pull preserves local-only app');
        // 50. Pulling a feature branch must NOT delete a locally-created,
        //     never-pushed app. Orphan resources are no longer removed on pull
        //     (they are marked is_synced=false), so in-progress work on a feature
        //     branch is never silently destroyed on sync.
        const createBranch7Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-e2e-7', sourceBranchId: mainBranchId })
          .expect(201);
        const feat7BranchId: string = createBranch7Resp.body.id;
        expect(feat7BranchId).toBeDefined();

        const localOnlyAppResp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat7BranchId })
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
          .query({ branch_id: feat7BranchId })
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
          .query({ branch_id: mainBranchId })
          .expect(200);
        const dsEnvs = (envListForDsResp.body.environments as any[]).sort((a: any, b: any) => a.priority - b.priority);
        expect(dsEnvs.length).toBeGreaterThanOrEqual(3);
        const [dsDevEnv, dsStagingEnv, dsProdEnv] = dsEnvs;

        const createBranch10Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
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
          .send({ name: 'restapi-e2e', options: buildUpdateOptions(devUrl) })
          .expect(200);

        await request
          .agent(app.getHttpServer())
          .put(`/api/data-sources/${newDsId}?environment_id=${dsStagingEnv.id}&branch_id=${feat10BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ name: 'restapi-e2e', options: buildUpdateOptions(stagingUrl) })
          .expect(200);

        await request
          .agent(app.getHttpServer())
          .put(`/api/data-sources/${newDsId}?environment_id=${dsProdEnv.id}&branch_id=${feat10BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ name: 'restapi-e2e', options: buildUpdateOptions(prodUrl) })
          .expect(200);

        // Workspace push the feature branch — serializes DS + DSVOs into git.
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/push')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat10BranchId })
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
          .query({ branch_id: mainBranchId })
          .send({ branchId: mainBranchId })
          .expect(201);

        // DS appears in the main-branch listing.
        const dsListOnMainResp = await request
          .agent(app.getHttpServer())
          .get(`/api/data-sources/${orgId}?branch_id=${mainBranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
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
          .expect(200);
        expect(extractUrl(dsOnDevResp)).toBe(devUrl);

        const dsOnStagingResp = await request
          .agent(app.getHttpServer())
          .get(`/api/data-sources/${mainDs.id}/environment/${dsStagingEnv.id}?branch_id=${mainBranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        expect(extractUrl(dsOnStagingResp)).toBe(stagingUrl);

        const dsOnProdResp = await request
          .agent(app.getHttpServer())
          .get(`/api/data-sources/${mainDs.id}/environment/${dsProdEnv.id}?branch_id=${mainBranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
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
          .query({ branch_id: mainBranchId })
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
          .query({ branch_id: feat11BranchId })
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
          .query({ branch_id: feat11BranchId })
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
          .query({ branch_id: feat11BranchId })
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
          .query({ branch_id: feat11BranchId })
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
          .query({ branch_id: feat11BranchId })
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
          .query({ branch_id: feat11BranchId })
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
          .query({ branch_id: feat11BranchId })
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
          .query({ branch_id: feat11BranchId })
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
          .query({ branch_id: feat11BranchId })
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
          .query({ branch_id: mainBranchId })
          .send({ branchId: mainBranchId })
          .expect(201);

        // App list on main → host app is there as a stub.
        const appsOnMainAfterModulePull = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
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
          .query({ branch_id: mainBranchId })
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
          .query({ branch_id: mainBranchId })
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
          .query({ branch_id: mainBranchId })
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
          .query({ branch_id: mainBranchId })
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
          .query({ branch_id: mainBranchId })
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
            moduleMetaFolderObj[k] &&
            typeof moduleMetaFolderObj[k] === 'object' &&
            (moduleMetaFolderObj[k] as any).appPath
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
          .query({ branch_id: mainBranchId })
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
          .query({ branch_id: mainBranchId })
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

        step(60, 'delete data source A on a branch, then rename B → A → succeeds (branch-aware name check)');
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
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-e2e-19', sourceBranchId: mainBranchId })
          .expect(201);
        const feat19BranchId: string = createBranch19Resp.body.id;

        const delRenameAResp = await request
          .agent(app.getHttpServer())
          .post(`/api/data-sources?branch_id=${feat19BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ name: 'del-rename-a', kind: 'restapi', options: restapiCreateOptions, scope: 'global' })
          .expect(201);
        const delRenameAId: string = delRenameAResp.body.id;

        const delRenameBResp = await request
          .agent(app.getHttpServer())
          .post(`/api/data-sources?branch_id=${feat19BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ name: 'del-rename-b', kind: 'restapi', options: restapiCreateOptions, scope: 'global' })
          .expect(201);
        const delRenameBId: string = delRenameBResp.body.id;

        // Delete A on the branch → soft-deletes its branch DSV.
        await request
          .agent(app.getHttpServer())
          .delete(`/api/data-sources/${delRenameAId}?branch_id=${feat19BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);

        // Rename B → A. Previously 400 ("already exists"); now 200.
        await request
          .agent(app.getHttpServer())
          .put(`/api/data-sources/${delRenameBId}?environment_id=${dsDevEnv.id}&branch_id=${feat19BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
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

        step(61, 'orphan APP on default branch: pull marks is_synced=false (not deleted), GET reflects it');
        // 64. New orphan flow. An app row that lives on the default branch but is
        //     absent from git is NOT removed on pull — it is marked is_synced=false
        //     so it behaves like a never-synced (pre-git) app. Setup mirrors the old
        //     orphan steps: create on a feature branch, SQL-move the version onto main
        //     as a synced (is_synced=true) default-branch row. Pull main: the orphan
        //     sweep flips is_synced→false, the row survives, and GET /api/apps/:id
        //     reflects is_synced=false on the editing version.
        const orphanAppBranchResp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-orphan-app', sourceBranchId: mainBranchId })
          .expect(201);
        const orphanAppBranchId: string = orphanAppBranchResp.body.id;

        const orphanSyncedAppResp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: orphanAppBranchId })
          .send({ icon: 'home', name: 'orphan-synced-app', type: 'front-end', branchId: orphanAppBranchId })
          .expect(201);
        const orphanSyncedAppId: string = orphanSyncedAppResp.body.id;

        // Move the version onto main as a previously-pulled, synced default-branch row
        // (is_synced=true + pulled_at set — the orphan sweep only considers rows that
        // were actually pulled from git). It was never pushed, so its co_relation_id is
        // absent from main's appMeta → an orphan.
        await dataSource.query(
          `UPDATE app_versions SET version_type = 'version', branch_id = $1, is_synced = true, pulled_at = now() WHERE app_id = $2`,
          [mainBranchId, orphanSyncedAppId]
        );
        const orphanAppBefore = await dataSource.query(
          `SELECT is_synced FROM app_versions WHERE app_id = $1 AND branch_id = $2`,
          [orphanSyncedAppId, mainBranchId]
        );
        expect(orphanAppBefore).toHaveLength(1);
        expect(orphanAppBefore[0].is_synced).toBe(true);

        // App-object level: the list endpoint stamps is_app_synced = true when the app
        // has any is_synced=true version on the branch. Before the orphan sweep it does.
        const orphanListBefore = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        const orphanAppInListBefore = orphanListBefore.body.apps.find((a: any) => a.id === orphanSyncedAppId);
        expect(orphanAppInListBefore).toBeDefined();
        expect(orphanAppInListBefore.is_app_synced ?? orphanAppInListBefore.isAppSynced).toBe(true);

        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ branchId: mainBranchId })
          .expect(201);

        // Row survives (not deleted) and is now unsynced.
        const orphanAppAfter = await dataSource.query(
          `SELECT is_synced FROM app_versions WHERE app_id = $1 AND branch_id = $2`,
          [orphanSyncedAppId, mainBranchId]
        );
        expect(orphanAppAfter).toHaveLength(1);
        expect(orphanAppAfter[0].is_synced).toBe(false);

        const orphanAppDetail = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${orphanSyncedAppId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .expect(200);
        const orphanAppEditing =
          orphanAppDetail.body?.editing_version ||
          orphanAppDetail.body?.editingVersion ||
          orphanAppDetail.body?.app?.editing_version;
        expect(orphanAppEditing).toBeDefined();
        expect(orphanAppEditing.is_synced ?? orphanAppEditing.isSynced).toBe(false);

        // App-object level: after the orphan sweep flips the version is_synced=false, the
        // app has no synced version on the branch → is_app_synced must be false too (the
        // app survives in the list, just unsynced).
        const orphanListAfter = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        const orphanAppInListAfter = orphanListAfter.body.apps.find((a: any) => a.id === orphanSyncedAppId);
        expect(orphanAppInListAfter).toBeDefined();
        expect(orphanAppInListAfter.is_app_synced ?? orphanAppInListAfter.isAppSynced).toBe(false);

        step(62, 'orphan MODULE on default branch: pull marks is_synced=false (not deleted), GET reflects it');
        // 65. Module variant of step 64. Modules are App rows (type='module') and use
        //     the same GET /api/apps/:id surface, so the assertions match.
        const orphanModBranchResp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-orphan-mod', sourceBranchId: mainBranchId })
          .expect(201);
        const orphanModBranchId: string = orphanModBranchResp.body.id;

        const orphanSyncedModResp = await request
          .agent(app.getHttpServer())
          .post('/api/modules')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: orphanModBranchId })
          .send({ icon: 'folderupload', name: 'orphan-synced-mod', type: 'module', branchId: orphanModBranchId })
          .expect(201);
        const orphanSyncedModId: string = orphanSyncedModResp.body.id;

        await dataSource.query(
          `UPDATE app_versions SET version_type = 'version', branch_id = $1, is_synced = true, pulled_at = now() WHERE app_id = $2`,
          [mainBranchId, orphanSyncedModId]
        );

        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ branchId: mainBranchId })
          .expect(201);

        const orphanModAfter = await dataSource.query(
          `SELECT is_synced FROM app_versions WHERE app_id = $1 AND branch_id = $2`,
          [orphanSyncedModId, mainBranchId]
        );
        expect(orphanModAfter).toHaveLength(1);
        expect(orphanModAfter[0].is_synced).toBe(false);

        const orphanModDetail = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${orphanSyncedModId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .expect(200);
        const orphanModEditing =
          orphanModDetail.body?.editing_version ||
          orphanModDetail.body?.editingVersion ||
          orphanModDetail.body?.app?.editing_version;
        expect(orphanModEditing).toBeDefined();
        expect(orphanModEditing.is_synced ?? orphanModEditing.isSynced).toBe(false);

        step(63, 'orphan DATA SOURCE on default branch: pull marks is_synced=false (not deleted), GET reflects it');
        // 66. Data-source variant. Create a DS on a feature branch, SQL-move its DSV
        //     onto main as synced; pull main flips is_synced→false (the DSV is kept,
        //     not deactivated/deleted) and GET /api/data-sources reflects it.
        const orphanDsBranchResp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-orphan-ds', sourceBranchId: mainBranchId })
          .expect(201);
        const orphanDsBranchId: string = orphanDsBranchResp.body.id;

        const orphanSyncedDsResp = await request
          .agent(app.getHttpServer())
          .post(`/api/data-sources?branch_id=${orphanDsBranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ name: 'orphan-synced-ds', kind: 'restapi', options: restapiCreateOptions, scope: 'global' })
          .expect(201);
        const orphanSyncedDsId: string = orphanSyncedDsResp.body.id;

        await dataSource.query(
          `UPDATE data_source_versions SET branch_id = $1, is_synced = true WHERE data_source_id = $2`,
          [mainBranchId, orphanSyncedDsId]
        );

        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ branchId: mainBranchId })
          .expect(201);

        const orphanDsAfter = await dataSource.query(
          `SELECT is_synced FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`,
          [orphanSyncedDsId, mainBranchId]
        );
        expect(orphanDsAfter).toHaveLength(1);
        expect(orphanDsAfter[0].is_synced).toBe(false);

        const orphanDsListResp = await request
          .agent(app.getHttpServer())
          .get(`/api/data-sources/${orgId}?branch_id=${mainBranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        const orphanDsList = orphanDsListResp.body.data_sources || orphanDsListResp.body.dataSources || [];
        const orphanDsRow = orphanDsList.find((ds: any) => ds.id === orphanSyncedDsId);
        expect(orphanDsRow).toBeDefined();
        expect(orphanDsRow.is_synced ?? orphanDsRow.isSynced).toBe(false);

        // ------------------------------------------------------------------
        // App-meta propagation across all default-branch versions
        // ------------------------------------------------------------------
        // Verifies the DB trigger that copies app identity (app_name / slug /
        // icon) onto EVERY app_versions row on the branch whose draft was just
        // updated — and, crucially, that editing metadata on a *different*
        // feature branch leaves the default-branch rows untouched (branch
        // isolation) until the change is committed and pulled back.
        //
        // Flow: create app on a feature branch → push → merge → single-app
        // pull onto main (NOT a workspace pull) → save (publish) → assert the
        // default branch holds one PUBLISHED + one DRAFT row sharing meta →
        // rename/reslug/re-icon on a second feature branch → assert the main
        // rows are unchanged → push + merge + single-app pull → assert the new
        // meta has propagated to BOTH main rows.

        const metaAppName = 'meta-prop-app';

        step(64, 'meta-prop: create app on feat-meta-prop-1 & push');
        const metaBranch1Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-meta-prop-1', sourceBranchId: mainBranchId })
          .expect(201);
        const metaBranch1Id: string = metaBranch1Resp.body.id;

        const metaCreateResp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: metaBranch1Id })
          .send({ icon: 'home', name: metaAppName, type: 'front-end', branchId: metaBranch1Id })
          .expect(201);
        const metaAppId: string = metaCreateResp.body.id;

        // Reads all default-branch (main) version rows for the meta-prop app.
        const metaRowsOnMain = (): Promise<
          Array<{ status: string; version_type: string; app_name: string; slug: string; icon: string }>
        > =>
          dataSource.query(
            `SELECT status, version_type, app_name, slug, icon
               FROM app_versions
              WHERE app_id = $1 AND branch_id = $2
              ORDER BY status`,
            [metaAppId, mainBranchId]
          );

        const metaAppOnBranch1 = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${metaAppId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: metaBranch1Id })
          .expect(200);
        const metaBranch1Version = metaAppOnBranch1.body?.editing_version || metaAppOnBranch1.body?.editingVersion;
        const metaBranch1VersionId: string = metaBranch1Version.id;

        // Snapshot feat-meta-prop-1's own row meta. Nothing after this edits or
        // pulls into this branch, so it must stay byte-for-byte identical — the
        // negative counterpart to the default-branch propagation checks below.
        const branch1MetaAtCreate = (
          await dataSource.query(`SELECT app_name, slug, icon FROM app_versions WHERE app_id = $1 AND branch_id = $2`, [
            metaAppId,
            metaBranch1Id,
          ])
        )[0];
        expect(branch1MetaAtCreate).toMatchObject({ app_name: metaAppName, icon: 'home' });

        await request
          .agent(app.getHttpServer())
          .post(`/api/app-git/gitpush/${metaAppId}/${metaBranch1VersionId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: metaBranch1Id })
          .send({
            gitAppName: metaAppName,
            versionId: metaBranch1VersionId,
            lastCommitMessage: 'meta-prop: initial',
            gitVersionName: 'feat-meta-prop-1',
            sourceBranch: 'feat-meta-prop-1',
          })
          .expect(201);

        step(65, 'meta-prop: merge feat-meta-prop-1 → main, then SINGLE-APP pull onto main');
        const metaMerge1 = await fetch(MERGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: JSON.stringify({
            owner: GIT_REPO_OWNER,
            repo: `${GIT_REPO_NAME}.git`,
            source: 'feat-meta-prop-1',
            target: 'main',
            message: 'Land feat-meta-prop-1',
          }),
        });
        expect((await metaMerge1.json().catch(() => ({}))).ok).toBe(true);

        // Single-app pull (NOT the workspace pull): hydrates just this app onto
        // main and returns the draft version the editor would open.
        const metaPull1 = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull-app')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ appId: metaAppId, branchId: mainBranchId })
          .expect(201);
        expect(metaPull1.body.success).toBe(true);

        // Resolve the freshly-hydrated main draft version.
        const metaAppOnMain = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${metaAppId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .expect(200);
        const metaMainDraft = metaAppOnMain.body?.editing_version || metaAppOnMain.body?.editingVersion;
        const metaMainDraftId: string = metaMainDraft.id;
        expect(metaMainDraftId).toBeDefined();

        step(66, 'meta-prop: save the version (publish v1) → main holds 1 PUBLISHED + 1 DRAFT sharing meta');
        // "Save" == publish the draft to v1 and cut the git tag (mirrors the
        // editor's save flow). handleDefaultBranchPublish keeps the published
        // row on the default branch AND seeds a fresh DRAFT — so main now has
        // exactly two version rows for this app.
        const metaCheckTag = await request
          .agent(app.getHttpServer())
          .get(`/api/app-git/${metaAppId}/check-tag`)
          .query({ versionName: 'v1' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .expect(200);
        expect(metaCheckTag.body.exists).toBe(false);

        await request
          .agent(app.getHttpServer())
          .put(`/api/v2/apps/${metaAppId}/versions/${metaMainDraftId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ is_user_switched_version: false, name: 'v1', description: 'meta-prop save', status: 'PUBLISHED' })
          .expect(200);

        await request
          .agent(app.getHttpServer())
          .post(`/api/app-git/${metaAppId}/versions/${metaMainDraftId}/tag`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ message: 'meta-prop save' })
          .expect(201);

        // On save there must be two default-branch rows: one PUBLISHED, one
        // DRAFT — and both carry identical app_name / slug / icon.
        const rowsAfterSave = await metaRowsOnMain();
        expect(rowsAfterSave).toHaveLength(2);
        const publishedRow = rowsAfterSave.find((r) => r.status === 'PUBLISHED');
        const draftRow = rowsAfterSave.find((r) => r.status === 'DRAFT');
        expect(publishedRow).toBeDefined();
        expect(draftRow).toBeDefined();
        expect(publishedRow.version_type).toBe('version');
        expect(draftRow.version_type).toBe('version');
        // Capture the canonical meta the default branch settled on.
        const originalMeta = { app_name: publishedRow.app_name, slug: publishedRow.slug, icon: publishedRow.icon };
        expect(originalMeta.app_name).toBe(metaAppName);
        expect(originalMeta.icon).toBe('home');
        // Both rows share the same meta.
        expect(draftRow.app_name).toBe(originalMeta.app_name);
        expect(draftRow.slug).toBe(originalMeta.slug);
        expect(draftRow.icon).toBe(originalMeta.icon);

        step(67, 'meta-prop: edit name/slug/icon on feat-meta-prop-2 → default-branch meta MUST NOT change');
        const metaBranch2Resp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-meta-prop-2', sourceBranchId: mainBranchId })
          .expect(201);
        const metaBranch2Id: string = metaBranch2Resp.body.id;

        const metaAppOnBranch2 = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${metaAppId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: metaBranch2Id })
          .expect(200);
        const metaBranch2Version = metaAppOnBranch2.body?.editing_version || metaAppOnBranch2.body?.editingVersion;
        const metaBranch2VersionId: string = metaBranch2Version.id;

        // Rename + reslug + re-icon on the feature branch only.
        await request
          .agent(app.getHttpServer())
          .put(`/api/apps/${metaAppId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: metaBranch2Id })
          .send({ app: { name: 'meta-prop-app-v2', editingVersionId: metaBranch2VersionId, branch_id: metaBranch2Id } })
          .expect(200);
        await request
          .agent(app.getHttpServer())
          .put(`/api/apps/${metaAppId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: metaBranch2Id })
          .send({ app: { slug: 'meta-prop-slug-v2', branch_id: metaBranch2Id } })
          .expect(200);
        await request
          .agent(app.getHttpServer())
          .put(`/api/apps/${metaAppId}/icons`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: metaBranch2Id })
          .send({ icon: 'sentfast', branch_id: metaBranch2Id })
          .expect(200);

        // The feature-branch row reflects the new meta …
        const branch2Rows = await dataSource.query(
          `SELECT app_name, slug, icon FROM app_versions WHERE app_id = $1 AND branch_id = $2`,
          [metaAppId, metaBranch2Id]
        );
        expect(branch2Rows).toHaveLength(1);
        expect(branch2Rows[0]).toMatchObject({ app_name: 'meta-prop-app-v2', slug: 'meta-prop-slug-v2', icon: 'sentfast' });

        // … but the DEFAULT-branch rows are untouched — editing a feature
        // branch must not mutate the default branch's identity.
        const rowsAfterBranchEdit = await metaRowsOnMain();
        expect(rowsAfterBranchEdit).toHaveLength(2);
        rowsAfterBranchEdit.forEach((r) => {
          expect(r.app_name).toBe(originalMeta.app_name);
          expect(r.slug).toBe(originalMeta.slug);
          expect(r.icon).toBe(originalMeta.icon);
        });

        step(68, 'meta-prop: push + merge feat-meta-prop-2, single-app pull → new meta on ALL default-branch rows');
        await request
          .agent(app.getHttpServer())
          .post(`/api/app-git/gitpush/${metaAppId}/${metaBranch2VersionId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: metaBranch2Id })
          .send({
            gitAppName: 'meta-prop-app-v2',
            versionId: metaBranch2VersionId,
            lastCommitMessage: 'meta-prop: rename + reslug + re-icon',
            gitVersionName: 'feat-meta-prop-2',
            sourceBranch: 'feat-meta-prop-2',
          })
          .expect(201);

        const metaMerge2 = await fetch(MERGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: JSON.stringify({
            owner: GIT_REPO_OWNER,
            repo: `${GIT_REPO_NAME}.git`,
            source: 'feat-meta-prop-2',
            target: 'main',
            message: 'Land feat-meta-prop-2',
          }),
        });
        expect((await metaMerge2.json().catch(() => ({}))).ok).toBe(true);

        // Single-app pull again: updates main's draft with the merged content,
        // and the propagation trigger fans the new meta out to every row on the
        // default branch (both the PUBLISHED and the DRAFT).
        const metaPull2 = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull-app')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ appId: metaAppId, branchId: mainBranchId })
          .expect(201);
        expect(metaPull2.body.success).toBe(true);

        const rowsAfterPull = await metaRowsOnMain();
        expect(rowsAfterPull).toHaveLength(2);
        // ALL default-branch rows now carry the updated identity.
        rowsAfterPull.forEach((r) => {
          expect(r.app_name).toBe('meta-prop-app-v2');
          expect(r.slug).toBe('meta-prop-slug-v2');
          expect(r.icon).toBe('sentfast');
        });
        // Still exactly one PUBLISHED + one DRAFT.
        expect(rowsAfterPull.filter((r) => r.status === 'PUBLISHED')).toHaveLength(1);
        expect(rowsAfterPull.filter((r) => r.status === 'DRAFT')).toHaveLength(1);

        // Negative: feat-meta-prop-1 was never edited nor pulled into. Its row
        // meta must be exactly what it was at creation — propagation on the
        // default branch (and on feat-meta-prop-2) must not leak across into an
        // unrelated branch's rows.
        const branch1RowsFinal = await dataSource.query(
          `SELECT app_name, slug, icon FROM app_versions WHERE app_id = $1 AND branch_id = $2`,
          [metaAppId, metaBranch1Id]
        );
        expect(branch1RowsFinal).toHaveLength(1);
        expect(branch1RowsFinal[0]).toMatchObject(branch1MetaAtCreate);
        // And explicitly NOT the v2 identity that landed on the default branch.
        expect(branch1RowsFinal[0].app_name).not.toBe('meta-prop-app-v2');
        expect(branch1RowsFinal[0].slug).not.toBe('meta-prop-slug-v2');
        expect(branch1RowsFinal[0].icon).not.toBe('sentfast');

        step(69, 'unsynced-app: create feat-unsynced branch + app, relocate its version onto the default branch');
        // Branching is enabled, so an app can only be authored on a feature branch. Create a
        // fresh branch + app, then relocate the app's single version onto the DEFAULT branch as
        // a real (non-stub), unsynced version — simulating an app that lives on main but was
        // never pushed to git.
        const unsyncedBranchResp = await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-unsynced', sourceBranchId: mainBranchId })
          .expect(201);
        const unsyncedFeatBranchId: string = unsyncedBranchResp.body.id;

        const unsyncedAppResp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: unsyncedFeatBranchId })
          .send({ icon: 'home', name: 'unsynced-app', type: 'front-end', branchId: unsyncedFeatBranchId })
          .expect(201);
        const unsyncedAppId: string = unsyncedAppResp.body.id;

        await dataSource.query(
          `UPDATE app_versions
              SET branch_id = $1, version_type = 'version', is_synced = false, is_stub = false
            WHERE app_id = $2`,
          [mainBranchId, unsyncedAppId]
        );

        // Invariant validate-push relies on: exactly one non-stub DRAFT, on the default branch,
        // marked unsynced.
        const unsyncedRows = await dataSource.query(
          `SELECT id, branch_id, status, is_stub, is_synced FROM app_versions WHERE app_id = $1`,
          [unsyncedAppId]
        );
        expect(unsyncedRows).toHaveLength(1);
        expect(unsyncedRows[0]).toMatchObject({
          branch_id: mainBranchId,
          status: 'DRAFT',
          is_stub: false,
          is_synced: false,
        });
        const unsyncedVersionId: string = unsyncedRows[0].id;

        step(70, 'unsynced-app: absent on its feature branch, present on the default branch');
        const unsyncedFeatListing = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: unsyncedFeatBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        expect(unsyncedFeatListing.body.apps.find((a: any) => a.id === unsyncedAppId)).toBeUndefined();

        const unsyncedMainListing = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        expect(unsyncedMainListing.body.apps.find((a: any) => a.id === unsyncedAppId)).toBeDefined();

        step(71, 'unsynced-app: validate-push → valid (single non-stub draft)');
        const validatePushValid = await request
          .agent(app.getHttpServer())
          .get(`/api/app-git/validate-push/${unsyncedAppId}`)
          .query({ resourceType: 'app' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        expect(validatePushValid.body).toEqual({ valid: true });

        step(72, 'unsynced-app: a second non-stub draft (copy, different name) → validate-push fails MULTIPLE_DRAFTS');
        // Copy the version row under a different name → two non-stub drafts for the app, the
        // ambiguous state the push gate must reject. version_type is 'version' here, so the
        // branch-scoped partial unique indexes (WHERE version_type='branch') don't apply; only
        // the (name, branch_id) unique does — hence the '-copy' suffix on name.
        const [copyVersion] = await dataSource.query(
          `INSERT INTO app_versions (
             name, definition, global_settings, page_settings, show_viewer_navigation,
             version_type, app_id, current_environment_id, status, is_stub, is_synced,
             branch_id, slug, app_name, icon, is_public
           )
           SELECT
             name || '-copy', definition, global_settings, page_settings, show_viewer_navigation,
             version_type, app_id, current_environment_id, status, is_stub, is_synced,
             branch_id, slug, app_name, icon, is_public
           FROM app_versions WHERE app_id = $1 LIMIT 1
           RETURNING id`,
          [unsyncedAppId]
        );
        const copyVersionId: string = copyVersion.id;

        const validatePushInvalid = await request
          .agent(app.getHttpServer())
          .get(`/api/app-git/validate-push/${unsyncedAppId}`)
          .query({ resourceType: 'app' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        expect(validatePushInvalid.body.valid).toBe(false);
        expect(validatePushInvalid.body.errorType).toBe('MULTIPLE_DRAFTS');

        step(73, 'unsynced-app: remove the duplicate draft → back to a single pushable draft');
        // Drop the copy created above so the app has one non-stub draft again, ready to push.
        await dataSource.query(`DELETE FROM app_versions WHERE id = $1`, [copyVersionId]);
        const revalidate = await request
          .agent(app.getHttpServer())
          .get(`/api/app-git/validate-push/${unsyncedAppId}`)
          .query({ resourceType: 'app' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        expect(revalidate.body).toEqual({ valid: true });

        step(74, 'unsynced-app: gitpush the default-branch version onto the feat-unsynced branch');
        // Push the app's default-branch version to the feature branch created in step 69 —
        // syncing the previously-unsynced app onto that branch in git.
        await request
          .agent(app.getHttpServer())
          .post(`/api/app-git/gitpush/${unsyncedAppId}/${unsyncedVersionId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({
            gitAppName: 'unsynced-app',
            versionId: unsyncedVersionId,
            lastCommitMessage: 'Committed unsynced-app',
            gitVersionName: 'feat-unsynced',
            sourceBranch: 'feat-unsynced',
            targetBranch: 'feat-unsynced',
          })
          .expect(201);

        step(75, 'unsynced-app: pull feat-unsynced → the app is now listed on the feature branch');
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: unsyncedFeatBranchId })
          .send({ branchId: unsyncedFeatBranchId })
          .expect(201);

        const featAfterPull = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: unsyncedFeatBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        expect(featAfterPull.body.apps.find((a: any) => a.id === unsyncedAppId)).toBeDefined();

        step(76, 'unsynced-app: merge feat-unsynced → main on Gitea');
        // The app was committed to feat-unsynced (step 74). Land that branch on main so the
        // app now exists in git on the default branch too.
        const unsyncedMerge = await fetch(MERGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: JSON.stringify({
            owner: GIT_REPO_OWNER,
            repo: `${GIT_REPO_NAME}.git`,
            source: 'feat-unsynced',
            target: 'main',
            message: 'Land feat-unsynced',
          }),
        });
        expect((await unsyncedMerge.json().catch(() => ({}))).ok).toBe(true);

        step(77, 'unsynced-app: pull main → the default-branch version is now synced (is_synced = true)');
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ branchId: mainBranchId })
          .expect(201);

        // The previously-unsynced default-branch version(s) now match git and must be synced.
        const mainVersionsSyncState = await dataSource.query(
          `SELECT is_synced FROM app_versions WHERE app_id = $1 AND branch_id = $2 AND is_stub = false`,
          [unsyncedAppId, mainBranchId]
        );
        expect(mainVersionsSyncState.length).toBeGreaterThan(0);
        expect(mainVersionsSyncState.every((r: any) => r.is_synced === true)).toBe(true);

        // ────────────────────────────────────────────────────────────────────
        // Active-branch resolution: last created/switched branch loads next time;
        // an invalid/stale active branch or branching-off falls back to the default.
        // ────────────────────────────────────────────────────────────────────
        const getActiveBranch = async () =>
          (
            await request
              .agent(app.getHttpServer())
              .get('/api/workspace-branches')
              .set('Cookie', tokenCookie)
              .set('tj-workspace-id', orgId)
              .expect(200)
          ).body;

        step(78, 'active-branch: switching persists → the switched branch loads on next list');
        // Switch to the default branch, then to a feature branch; each list reflects the last switch.
        await request
          .agent(app.getHttpServer())
          .put(`/api/workspace-branches/${mainBranchId}/activate`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({})
          .expect(200);
        expect((await getActiveBranch()).activeBranchId).toBe(mainBranchId);

        await request
          .agent(app.getHttpServer())
          .put(`/api/workspace-branches/${featBranchId}/activate`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({})
          .expect(200);
        expect((await getActiveBranch()).activeBranchId).toBe(featBranchId);

        step(79, 'active-branch: no valid active branch (removed / cleared) → default loads');
        // A dangling last_branch_id can't exist — FK_organization_users_last_branch_id references
        // organization_git_sync_branches with ON DELETE SET NULL, so deleting the active branch
        // leaves last_branch_id NULL (not a stale id). Simulate that post-delete state directly
        // (NULL is FK-safe and deterministic — the real DELETE endpoint clears it via a background
        // job) and assert the list falls back to the default branch.
        await dataSource.query(`UPDATE organization_users SET last_branch_id = NULL WHERE organization_id = $1`, [orgId]);
        expect((await getActiveBranch()).activeBranchId).toBe(mainBranchId);

        step(80, 'active-branch: branching OFF → only the default branch is exposed');
        const gitConfigForBranching = await request
          .agent(app.getHttpServer())
          .get(`/api/git-sync/${orgId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        const orgGitIdForBranching: string = gitConfigForBranching.body.organization_git.id;

        // Re-activate a feature branch first so the fallback below is attributable to branching-off,
        // not to the stale id set in step 79.
        await request
          .agent(app.getHttpServer())
          .put(`/api/workspace-branches/${featBranchId}/activate`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({})
          .expect(200);

        await request
          .agent(app.getHttpServer())
          .put(`/api/git-sync/${orgGitIdForBranching}/is-branching-enabled`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ isBranchingEnabled: false })
          .expect(200);

        const singleBranchList = await getActiveBranch();
        expect(singleBranchList.isMultiBranchingEnabled).toBe(false);
        expect(singleBranchList.branches.every((b: any) => b.isDefault)).toBe(true);
        expect(singleBranchList.activeBranchId).toBe(mainBranchId);

        // Restore multi-branch so the shared org is left in its default (branching-on) state.
        await request
          .agent(app.getHttpServer())
          .put(`/api/git-sync/${orgGitIdForBranching}/is-branching-enabled`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ isBranchingEnabled: true })
          .expect(200);

        // ────────────────────────────────────────────────────────────────────
        // Single-branch (branching disabled) unsynced-resource flow:
        //   - app / module / data source can be created directly on the DEFAULT branch
        //     (multi-branch rejects create-on-default; single-branch allows it),
        //   - the unsynced app/module/data-source sit on the default branch and are
        //     push-eligible (the DS is linked to the app via a query, so it would ride along
        //     in the app's push commit).
        // The actual git transport (direct push to the default branch) can't be exercised here:
        // the shared test Gitea blocks direct pushes to the default branch (pre-receive hook), so
        // every other step lands on it via feature-branch + admin merge. We validate at the
        // app/authorization layer instead.
        // ────────────────────────────────────────────────────────────────────
        const sbRestapiOptions = [
          { key: 'url', value: '' },
          { key: 'auth_type', value: 'none' },
          { key: 'headers', value: [['', '']] },
          { key: 'ssl_certificate', value: 'none', encrypted: false },
        ];

        step(81, 'single-branch: disable branching, create app + module + data source on the DEFAULT branch');
        await request
          .agent(app.getHttpServer())
          .put(`/api/git-sync/${orgGitIdForBranching}/is-branching-enabled`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ isBranchingEnabled: false })
          .expect(200);

        // App on the default branch — rejected under multi-branch (step 9a), allowed in single-branch.
        const sbAppResp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ icon: 'home', name: 'single-branch-app', type: 'front-end', branchId: mainBranchId })
          .expect(201);
        const sbAppId: string = sbAppResp.body.id;

        const sbModuleResp = await request
          .agent(app.getHttpServer())
          .post('/api/modules')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ icon: 'folderupload', name: 'single-branch-module', type: 'module', branchId: mainBranchId })
          .expect(201);
        const sbModuleId: string = sbModuleResp.body.id;

        const sbDsResp = await request
          .agent(app.getHttpServer())
          .post(`/api/data-sources?branch_id=${mainBranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ name: 'single-branch-ds', kind: 'restapi', options: sbRestapiOptions, scope: 'global' })
          .expect(201);
        const sbDsId: string = sbDsResp.body.id;

        // Resolve the app's editing version, then link the data source via a query so the push
        // carries the DS (serializeLinkedDataSourcesForApp finds DSes through queries on the version).
        const sbAppDetail = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${sbAppId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .expect(200);
        const sbAppVersionId: string = (sbAppDetail.body?.editing_version || sbAppDetail.body?.editingVersion).id;
        expect(sbAppVersionId).toBeTruthy();

        await request
          .agent(app.getHttpServer())
          .post(`/api/data-queries/data-sources/${sbDsId}/versions/${sbAppVersionId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ kind: 'restapi', name: 'sb_q1', options: { method: 'get', url: '', headers: [], url_params: [], body: [] } })
          .expect(201);

        const sbModuleDetail = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${sbModuleId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .expect(200);
        const sbModuleVersionId: string = (sbModuleDetail.body?.editing_version || sbModuleDetail.body?.editingVersion).id;
        expect(sbModuleVersionId).toBeTruthy();

        // NOTE on git transport: the shared test Gitea blocks DIRECT pushes to the default branch
        // ("Direct pushes to 'main' are blocked by the simulator … land changes via the merge UI").
        // The whole suite therefore lands changes on the default branch via feature-branch + admin
        // merge. Single-branch pushes go STRAIGHT to the default branch, so the actual git transport
        // (and thus git-file validation) can't be exercised against this repo. We assert the
        // single-branch behaviour at the app/authorization layer instead: create-on-default is
        // allowed (step 81), and the unsynced app/module/data-source sit on the default branch,
        // unsynced, and are push-eligible.
        step(82, 'single-branch: unsynced app on the default branch is push-eligible (validate-push)');
        const sbValidatePush = await request
          .agent(app.getHttpServer())
          .get(`/api/app-git/validate-push/${sbAppId}`)
          .query({ resourceType: 'app' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        expect(sbValidatePush.body).toEqual({ valid: true });

        step(83, 'single-branch: app/module/data-source live on the DEFAULT branch, unsynced, with the DS linked');
        // App + module versions: default branch, DRAFT, unsynced (never pushed).
        const sbVersionRows = await dataSource.query(
          `SELECT id, branch_id, status, is_synced FROM app_versions WHERE id = ANY($1)`,
          [[sbAppVersionId, sbModuleVersionId]]
        );
        expect(sbVersionRows).toHaveLength(2);
        expect(sbVersionRows.every((r: any) => r.branch_id === mainBranchId)).toBe(true);
        expect(sbVersionRows.every((r: any) => r.status === 'DRAFT')).toBe(true);
        expect(sbVersionRows.every((r: any) => r.is_synced === false)).toBe(true);

        // Data source: an unsynced DSV on the default branch, linked to the app via a query
        // (this is what serializeLinkedDataSourcesForApp would carry into the app's push commit).
        const [sbDsvRow] = await dataSource.query(
          `SELECT is_synced FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`,
          [sbDsId, mainBranchId]
        );
        expect(sbDsvRow?.is_synced).toBe(false);
        const [sbQueryLink] = await dataSource.query(
          `SELECT 1 AS linked FROM data_queries WHERE data_source_id = $1 AND app_version_id = $2`,
          [sbDsId, sbAppVersionId]
        );
        expect(sbQueryLink?.linked).toBe(1);

        // Restore multi-branch so the shared org is left in its default (branching-on) state.
        await request
          .agent(app.getHttpServer())
          .put(`/api/git-sync/${orgGitIdForBranching}/is-branching-enabled`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ isBranchingEnabled: true })
          .expect(200);
      }, 540000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Edit restrictions across git off / on and branching states.
    //
    // Exercises the git-sync edit guards end-to-end on a dedicated org (isolated from
    // the shared lifecycle org above so its published/synced state can't bleed in):
    //   1. Git OFF          → apps/modules/data-sources fully editable; a *saved*
    //                          (published) version can no longer be edited.
    //   2. Git ON (multi)   → resources created git-off are UNSYNCED, so still editable
    //                          on the default branch.
    //   3. After sync (push feature → merge main → pull) the default-branch draft is
    //                          SYNCED → editing on the default branch is blocked.
    //   4. Branching OFF    → feature-branch edits blocked; default-branch edits allowed.
    // ────────────────────────────────────────────────────────────────────────────
    describe('git/non git edit restrictions', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;
      const MERGE_URL = `${GIT_BASE_URL}/admin/merge`;

      let editOrgId: string;
      let editCookie: string[];
      let dataSource: DataSource;

      beforeAll(async () => {
        // Fresh org so this suite's git config / publish / sync state is fully isolated
        // from the lifecycle test's shared org.
        const { organization } = await createUser(app, {
          email: 'git-edit-restrictions@tooljet.io',
          firstName: 'git',
          lastName: 'restrictions',
        });
        editOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-edit-restrictions@tooljet.io');
        editCookie = tokenCookie;
        await ensureAppEnvironments(app, editOrgId);
        dataSource = app.get<DataSource>(getDataSourceToken('default'));
        // createUser doesn't run the production org-onboarding that seeds the default
        // WorkspaceBranch (nor the backfill migration), so seed it here — otherwise the first
        // getDetails() call self-heals it with a noisy "No default branch found" error log.
        await dataSource.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, 'main', true)
           ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [editOrgId]
        );
      });

      it('enforces edit rules across git-off, git-on (unsynced/synced) and branching-off states', async () => {
        const { randomUUID } = await import('crypto');
        const step = (n: number, label: string) => {
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        };

        // ── local helpers ──────────────────────────────────────────────────────
        const agent = () => request.agent(app.getHttpServer());
        const auth = (r: request.Test) => r.set('Cookie', editCookie).set('tj-workspace-id', editOrgId);

        const makeButtonDiff = (parent: string | null = null) => {
          const id = randomUUID();
          return {
            id,
            diff: {
              [id]: {
                name: `button_${id.slice(0, 6)}`,
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
                  loadingState: { value: '{{false}}' },
                },
                styles: { backgroundColor: { value: 'var(--cc-primary-brand)' } },
                parent,
              },
            },
          };
        };

        // GET app detail → { versionId, envId, pageId } for the given branch.
        const getEditingContext = async (appId: string, branchId?: string) => {
          const detail = await auth(agent().get(`/api/apps/${appId}`))
            .query(branchId ? { branch_id: branchId } : {})
            .expect(200);
          const ev = detail.body?.editing_version || detail.body?.editingVersion || detail.body?.app?.editing_version;
          expect(ev).toBeDefined();
          const pageId =
            ev.home_page_id || ev.homePageId || ev.pages?.[0]?.id || detail.body?.pages?.[0]?.id;
          const envId = ev.current_environment_id || ev.currentEnvironmentId;
          return { versionId: ev.id as string, envId: envId as string, pageId: pageId as string, ev };
        };

        // Add a component to a version (returns the supertest response for status assertions).
        const addComponent = (appId: string, versionId: string, pageId: string, branchId?: string, parent: string | null = null) => {
          const { diff } = makeButtonDiff(parent);
          return auth(agent().post(`/api/v2/apps/${appId}/versions/${versionId}/components`))
            .query(branchId ? { branch_id: branchId } : {})
            .send({ is_user_switched_version: false, pageId, diff });
        };

        // Add a restapi query to a version against the given (global) data source.
        const restApiQueryOptions = {
          method: 'get',
          url: '',
          url_params: [],
          headers: [],
          body: [],
          json_body: null,
          body_toggle: false,
        };
        const addQuery = (dsId: string, versionId: string, name: string, branchId?: string) =>
          auth(agent().post(`/api/data-queries/data-sources/${dsId}/versions/${versionId}`))
            .query(branchId ? { branch_id: branchId } : {})
            .send({ kind: 'restapi', name, options: restApiQueryOptions });

        const restapiDsOptions = [
          { key: 'url', value: '' },
          { key: 'auth_type', value: 'none' },
          { key: 'grant_type', value: 'authorization_code' },
          { key: 'add_token_to', value: 'header' },
          { key: 'header_prefix', value: 'Bearer ' },
          { key: 'headers', value: [['', '']] },
          { key: 'ssl_certificate', value: 'none', encrypted: false },
        ];

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 1 — GIT OFF: everything editable; a saved version becomes read-only.
        // ══════════════════════════════════════════════════════════════════════
        step(1, 'git-off: create app + module + data source');
        const appResp = await auth(agent().post('/api/apps'))
          .send({ icon: 'home', name: 'edit-rules-app', type: 'front-end' })
          .expect(201);
        const appId: string = appResp.body.id;

        const moduleResp = await auth(agent().post('/api/modules'))
          .send({ icon: 'folderupload', name: 'edit-rules-module', type: 'module' })
          .expect(201);
        const moduleId: string = moduleResp.body.id;

        const dsResp = await auth(agent().post('/api/data-sources'))
          .send({ name: 'edit-rules-ds', kind: 'restapi', options: restapiDsOptions, scope: 'global' })
          .expect(201);
        const dsId: string = dsResp.body.id;

        step(2, 'git-off: add component + query to the app and the module (all allowed)');
        const appCtx = await getEditingContext(appId);
        const moduleCtx = await getEditingContext(moduleId);
        // module home page carries an auto-created ModuleContainer; parent the button to it.
        const moduleContainerId: string | undefined = Object.keys(moduleCtx.ev.pages?.[0]?.components || {}).find(
          (id) => (moduleCtx.ev.pages?.[0]?.components || {})[id]?.component?.component === 'ModuleContainer'
        );

        await addComponent(appId, appCtx.versionId, appCtx.pageId).expect(201);
        await addQuery(dsId, appCtx.versionId, 'app_q1').expect(201);
        await addComponent(moduleId, moduleCtx.versionId, moduleCtx.pageId, undefined, moduleContainerId ?? null).expect(201);
        await addQuery(dsId, moduleCtx.versionId, 'mod_q1').expect(201);

        step(3, 'git-off: add another data source, edit it, rename app + module, add more component/query');
        const ds2Resp = await auth(agent().post('/api/data-sources'))
          .send({ name: 'edit-rules-ds-2', kind: 'restapi', options: restapiDsOptions, scope: 'global' })
          .expect(201);
        const ds2Id: string = ds2Resp.body.id;

        // Edit a data source (dev env). Git off → GitSyncDataSourceEditGuard is a no-op.
        const devEnv = (
          await auth(agent().get('/api/app-environments')).expect(200)
        ).body.environments.sort((a: any, b: any) => a.priority - b.priority)[0];
        await auth(agent().put(`/api/data-sources/${dsId}?environment_id=${devEnv.id}`))
          .send({ name: 'edit-rules-ds', options: restapiDsOptions })
          .expect(200);

        await auth(agent().put(`/api/apps/${appId}`))
          .send({ app: { name: 'edit-rules-app-renamed', editingVersionId: appCtx.versionId } })
          .expect(200);
        await auth(agent().put(`/api/apps/${moduleId}`))
          .send({ app: { name: 'edit-rules-module-renamed', editingVersionId: moduleCtx.versionId } })
          .expect(200);

        await addComponent(appId, appCtx.versionId, appCtx.pageId).expect(201);
        await addQuery(dsId, appCtx.versionId, 'app_q2').expect(201);

        step(4, 'git-off: save (publish) the app + module version → no draft remains');
        await auth(agent().put(`/api/v2/apps/${appId}/versions/${appCtx.versionId}`))
          .send({ is_user_switched_version: false, name: 'v1', description: 'saved', status: 'PUBLISHED' })
          .expect(200);
        await auth(agent().put(`/api/v2/apps/${moduleId}/versions/${moduleCtx.versionId}`))
          .send({ is_user_switched_version: false, name: 'v1', description: 'saved', status: 'PUBLISHED' })
          .expect(200);

        // Git off + unsynced → publish does not seed a continuity draft: no DRAFT rows remain.
        const appDraftCount = await dataSource.query(
          `SELECT COUNT(*)::int AS c FROM app_versions WHERE app_id = $1 AND status = 'DRAFT'`,
          [appId]
        );
        expect(appDraftCount[0].c).toBe(0);

        step(5, 'git-off: editing the SAVED (published) version is rejected');
        await addComponent(appId, appCtx.versionId, appCtx.pageId).expect(400);
        await addQuery(dsId, appCtx.versionId, 'app_q_blocked').expect(400);
        await addComponent(moduleId, moduleCtx.versionId, moduleCtx.pageId, undefined, moduleContainerId ?? null).expect(400);

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 2 — CONFIGURE GIT + BRANCHING ON: unsynced resources stay editable.
        // ══════════════════════════════════════════════════════════════════════
        step(6, 'configure git sync (reset repo + save provider configs), enable branching');
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITHUB_HTTPS_PAYLOAD, useEnvConfig: false })
          .expect(201);

        const gitConfig = await auth(agent().get(`/api/git-sync/${editOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: true })
          .expect(200);

        const branchesResp = await auth(agent().get('/api/workspace-branches')).expect(200);
        const mainBranchId: string = branchesResp.body.activeBranchId;
        expect(mainBranchId).toBeDefined();

        // Pull main so the workspace is level with the freshly-reset repo.
        await auth(agent().post('/api/workspace-branches/pull'))
          .query({ branch_id: mainBranchId })
          .send({ branchId: mainBranchId })
          .expect(201);

        step(7, 'git-on (multi-branch): unsynced app is still editable on the default branch');
        // Publish left no draft; create a fresh DRAFT to edit. The app was authored git-off so it
        // is unsynced (is_synced=false) → the guard exempts it from the "synced default branch" rule.
        const newDraftResp = await auth(agent().post(`/api/apps/${appId}/versions`))
          .query({ branch_id: mainBranchId })
          .send({
            versionName: 'draft-2',
            versionFromId: appCtx.versionId,
            environmentId: appCtx.envId,
            versionType: 'version',
          })
          .expect(201);
        const unsyncedDraftId: string = newDraftResp.body.id;
        // The default branch now holds the published v1 + this new draft; the app-detail editing
        // resolver may surface a different row, so target the draft we created directly and use ITS
        // own home page (a page from another version wouldn't belong to this version).
        const [draftPageRow] = await dataSource.query(
          `SELECT COALESCE(av.home_page_id, (SELECT id FROM pages WHERE app_version_id = av.id LIMIT 1)) AS page_id,
                  av.is_synced AS is_synced
             FROM app_versions av WHERE av.id = $1`,
          [unsyncedDraftId]
        );
        const unsyncedDraftPageId: string = draftPageRow.page_id;
        expect(unsyncedDraftPageId).toBeTruthy();

        // is_synced must be false on this default-branch draft (authored git-off).
        expect(draftPageRow.is_synced).toBe(false);

        // Editing the unsynced default-branch draft is allowed.
        await addComponent(appId, unsyncedDraftId, unsyncedDraftPageId, mainBranchId).expect(201);
        await addQuery(dsId, unsyncedDraftId, 'unsynced_q1', mainBranchId).expect(201);

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 3 — SYNC the app to main (push feature → merge → pull) → default draft synced.
        // ══════════════════════════════════════════════════════════════════════
        step(8, 'sync app: create feature branch, push default-branch draft onto it');
        const featResp = await auth(agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-edit-rules', sourceBranchId: mainBranchId })
          .expect(201);
        const featBranchId: string = featResp.body.id;

        await auth(agent().post(`/api/app-git/gitpush/${appId}/${unsyncedDraftId}`))
          .query({ branch_id: mainBranchId })
          .send({
            gitAppName: 'edit-rules-app-renamed',
            versionId: unsyncedDraftId,
            lastCommitMessage: 'sync app',
            gitVersionName: 'feat-edit-rules',
            sourceBranch: 'feat-edit-rules',
            targetBranch: 'feat-edit-rules',
          })
          .expect(201);

        step(9, 'sync app: pull feature, capture its branch version, merge feature → main, pull main');
        await auth(agent().post('/api/workspace-branches/pull'))
          .query({ branch_id: featBranchId })
          .send({ branchId: featBranchId })
          .expect(201);
        // Capture the feature-branch version id now (used later for the branching-off block check).
        const featCtx = await getEditingContext(appId, featBranchId);
        const featVersionId = featCtx.versionId;

        const appMerge = await fetch(MERGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: JSON.stringify({
            owner: GIT_REPO_OWNER,
            repo: `${GIT_REPO_NAME}.git`,
            source: 'feat-edit-rules',
            target: 'main',
            message: 'Land feat-edit-rules',
          }),
        });
        expect((await appMerge.json().catch(() => ({}))).ok).toBe(true);

        await auth(agent().post('/api/workspace-branches/pull'))
          .query({ branch_id: mainBranchId })
          .send({ branchId: mainBranchId })
          .expect(201);

        // The default-branch draft is now synced. Resolve it deterministically (the app-detail
        // editing resolver can surface the published v1 instead of the draft) and reuse for the
        // blocked/allowed edit checks below.
        const [mainDraftRow] = await dataSource.query(
          `SELECT av.id AS id,
                  COALESCE(av.home_page_id, (SELECT id FROM pages WHERE app_version_id = av.id LIMIT 1)) AS page_id,
                  av.is_synced AS is_synced
             FROM app_versions av
            WHERE av.app_id = $1 AND av.branch_id = $2 AND av.status = 'DRAFT' AND av.is_stub = false
            ORDER BY av.updated_at DESC
            LIMIT 1`,
          [appId, mainBranchId]
        );
        expect(mainDraftRow?.id).toBeTruthy();
        expect(mainDraftRow.is_synced).toBe(true);
        const mainDraftId: string = mainDraftRow.id;
        const mainDraftPageId: string = mainDraftRow.page_id;

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 4 — SYNCED (multi-branch): default-branch edits blocked.
        // ══════════════════════════════════════════════════════════════════════
        step(10, 'git-on (multi-branch): editing the SYNCED default-branch draft is blocked');
        await addComponent(appId, mainDraftId, mainDraftPageId, mainBranchId).expect(403);
        await addQuery(dsId, mainDraftId, 'blocked_default_q', mainBranchId).expect(403);

        step(11, 'git-on (multi-branch): editing on the feature branch is allowed');
        await addComponent(appId, featVersionId, featCtx.pageId, featBranchId).expect(201);

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 5 — BRANCHING OFF (single-branch): feature blocked, default allowed.
        // ══════════════════════════════════════════════════════════════════════
        step(12, 'branching OFF: feature-branch edits blocked, default-branch edits allowed');
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: false })
          .expect(200);

        // Feature-branch operations are rejected when branching is disabled.
        await addComponent(appId, featVersionId, featCtx.pageId, featBranchId).expect(403);

        // The default branch is the single working branch → edits allowed again (even though synced).
        await addComponent(appId, mainDraftId, mainDraftPageId, mainBranchId).expect(201);
        await addQuery(dsId, mainDraftId, 'single_branch_q', mainBranchId).expect(201);

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 6 — LICENSE LOCK: git configured + license expired → every edit blocked.
        // ══════════════════════════════════════════════════════════════════════
        step(13, 'git configured + license expired: all edits blocked until git is turned off');
        try {
          // Simulate an expired plan at runtime (no restart): git is still configured, but the
          // license no longer covers it, so the whole workspace is edit-locked.
          setTestLicenseTerms(app, { features: { gitSync: true, gitSyncMultiBranch: true } } as any, { expired: true });

          // Target the (DRAFT) default-branch version so the status guard passes and the
          // license-lock (403) is what rejects the edit — not the saved-version guard (400).
          await addComponent(appId, mainDraftId, mainDraftPageId, mainBranchId).expect(403);
          await addQuery(dsId, mainDraftId, 'license_locked_q', mainBranchId).expect(403);
        } finally {
          // Always restore the enterprise plan so later suites/teardown aren't affected.
          restoreLicensePlan(app, 'enterprise');
        }
      }, 600000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Create-draft & patch flow (git enabled, branching OFF / single-branch).
    //
    // Git single-branch keeps one draft on the default branch. Creating a draft from a SAVED
    // (published) version REPLACES the current draft — any uncommitted edits on it are discarded and
    // the new draft is a clean copy of the chosen saved version. This exercises the atomic
    // replaceDraftVersion path (POST /apps/:id/versions with `replace: true`). No git transport is
    // involved (pure version create/publish/replace), so it runs fine against the protected-main repo.
    // ────────────────────────────────────────────────────────────────────────────
    describe('create draft & patch flow', () => {
      let patchOrgId: string;
      let patchCookie: string[];
      let patchDataSource: DataSource;

      beforeAll(async () => {
        const { organization } = await createUser(app, {
          email: 'git-patch-flow@tooljet.io',
          firstName: 'git',
          lastName: 'patch',
        });
        patchOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-patch-flow@tooljet.io');
        patchCookie = tokenCookie;
        await ensureAppEnvironments(app, patchOrgId);
        patchDataSource = app.get<DataSource>(getDataSourceToken('default'));
        // Seed the default branch (createUser doesn't) so getDetails() resolves it without the
        // "No default branch found" fallback log.
        await patchDataSource.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [patchOrgId]
        );
      });

      it('replaces the draft when creating from a saved version, discarding uncommitted edits', async () => {
        const { randomUUID } = await import('crypto');
        const agent = () => request.agent(app.getHttpServer());
        const auth = (r: request.Test) => r.set('Cookie', patchCookie).set('tj-workspace-id', patchOrgId);

        const buttonDiff = (name: string) => {
          const id = randomUUID();
          return {
            diff: {
              [id]: {
                name,
                layouts: {
                  desktop: { top: 80, left: 15, width: 4, height: 40 },
                  mobile: { top: 80, left: 15, width: 4, height: 40 },
                },
                type: 'Button',
                general: {},
                generalStyles: {},
                others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
                properties: { text: { value: 'Button' }, visibility: { value: '{{true}}' } },
                styles: { backgroundColor: { value: 'var(--cc-primary-brand)' } },
                parent: null,
              },
            },
          };
        };

        // GET app detail → the current editing (draft) version id + home page id.
        const getEditing = async (appId: string) => {
          const detail = await auth(agent().get(`/api/apps/${appId}`)).query({ branch_id: mainBranchId }).expect(200);
          const ev = detail.body?.editing_version || detail.body?.editingVersion;
          const pageId = ev.home_page_id || ev.homePageId || ev.pages?.[0]?.id;
          return { versionId: ev.id as string, envId: (ev.current_environment_id || ev.currentEnvironmentId) as string, pageId };
        };
        // Component + query names on a version (deterministic DB reads, keyed by the version id).
        const componentNames = async (versionId: string): Promise<string[]> =>
          (
            await patchDataSource.query(
              `SELECT c.name FROM components c JOIN pages p ON p.id = c.page_id
                WHERE p.app_version_id = $1 ORDER BY c.name`,
              [versionId]
            )
          ).map((r: any) => r.name);
        const queryNames = async (versionId: string): Promise<string[]> =>
          (
            await patchDataSource.query(`SELECT name FROM data_queries WHERE app_version_id = $1 ORDER BY name`, [
              versionId,
            ])
          ).map((r: any) => r.name);
        const addComponent = (appId: string, versionId: string, pageId: string, name: string) =>
          auth(agent().post(`/api/v2/apps/${appId}/versions/${versionId}/components`))
            .query({ branch_id: mainBranchId })
            .send({ is_user_switched_version: false, pageId, diff: buttonDiff(name).diff })
            .expect(201);
        const addQuery = (dsId: string, versionId: string, name: string) =>
          auth(agent().post(`/api/data-queries/data-sources/${dsId}/versions/${versionId}`))
            .query({ branch_id: mainBranchId })
            .send({ kind: 'restapi', name, options: { method: 'get', url: '', headers: [], url_params: [], body: [] } })
            .expect(201);
        const publish = (appId: string, versionId: string, name: string) =>
          auth(agent().put(`/api/v2/apps/${appId}/versions/${versionId}`))
            .query({ branch_id: mainBranchId })
            .send({ is_user_switched_version: false, name, status: 'PUBLISHED' })
            .expect(200);
        // Create a draft from a saved version. replace=true → atomic swap of the current draft.
        const createDraftFrom = (appId: string, versionFromId: string, envId: string, replace: boolean) =>
          auth(agent().post(`/api/apps/${appId}/versions`))
            .query({ branch_id: mainBranchId })
            .send({ versionName: 'main', versionFromId, environmentId: envId, versionType: 'version', replace })
            .expect(201);

        const restapiDsOptions = [
          { key: 'url', value: '' },
          { key: 'auth_type', value: 'none' },
          { key: 'headers', value: [['', '']] },
        ];

        // ── Configure git + branching OFF (single-branch) ────────────────────
        await auth(agent().post('/api/git-sync/configs')).send({ ...GITHUB_HTTPS_PAYLOAD, useEnvConfig: false }).expect(201);
        const gitConfig = await auth(agent().get(`/api/git-sync/${patchOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`)).send({ isBranchingEnabled: false }).expect(200);
        const branchesResp = await auth(agent().get('/api/workspace-branches')).expect(200);
        const mainBranchId: string = branchesResp.body.activeBranchId;
        expect(mainBranchId).toBeDefined();

        // ── Setup: app + module + data source + query + components on the default branch ──
        const appResp = await auth(agent().post('/api/apps'))
          .send({ icon: 'home', name: 'patch-flow-app', type: 'front-end' })
          .expect(201);
        const appId: string = appResp.body.id;
        const moduleResp = await auth(agent().post('/api/modules'))
          .send({ icon: 'folderupload', name: 'patch-flow-module', type: 'module' })
          .expect(201);
        const moduleId: string = moduleResp.body.id;
        const dsResp = await auth(agent().post('/api/data-sources'))
          .send({ name: 'patch-flow-ds', kind: 'restapi', options: restapiDsOptions, scope: 'global' })
          .expect(201);
        const dsId: string = dsResp.body.id;

        const v1Ctx = await getEditing(appId);
        await addComponent(appId, v1Ctx.versionId, v1Ctx.pageId, 'comp_A');
        await addQuery(dsId, v1Ctx.versionId, 'query_A');
        // Module gets its own query (setup coverage; the patch flow is asserted on the app).
        const modCtx = await getEditing(moduleId);
        await addQuery(dsId, modCtx.versionId, 'mod_query_A');

        // ── Save the version (publish v1) ────────────────────────────────────
        const v1Id = v1Ctx.versionId;
        await publish(appId, v1Id, 'v1');
        expect(await componentNames(v1Id)).toEqual(['comp_A']);
        expect(await queryNames(v1Id)).toEqual(['query_A']);

        // Resolve a draft's home page from the DB. The app-detail editing-version resolver can
        // surface the just-published version instead of the new draft once several versions exist,
        // so we target draft ids (from the create responses) directly rather than via GET /apps/:id.
        const draftPageId = async (versionId: string): Promise<string> =>
          (
            await patchDataSource.query(
              `SELECT COALESCE(av.home_page_id, (SELECT id FROM pages WHERE app_version_id = av.id LIMIT 1)) AS page_id
                 FROM app_versions av WHERE av.id = $1`,
              [versionId]
            )
          )[0]?.page_id;

        // ── New draft from v1, then add 1 more component + query ─────────────
        const d2Resp = await createDraftFrom(appId, v1Id, v1Ctx.envId, false);
        const d2Id: string = d2Resp.body.id;
        expect(await componentNames(d2Id)).toEqual(['comp_A']); // clean copy of v1
        expect(await queryNames(d2Id)).toEqual(['query_A']);
        await addComponent(appId, d2Id, await draftPageId(d2Id), 'comp_B');
        await addQuery(dsId, d2Id, 'query_B');
        expect(await componentNames(d2Id)).toEqual(['comp_A', 'comp_B']);
        expect(await queryNames(d2Id)).toEqual(['query_A', 'query_B']);

        // ── Create draft from the saved version (replace) → discards comp_B/query_B ──
        const d3Resp = await createDraftFrom(appId, v1Id, v1Ctx.envId, true);
        const d3Id: string = d3Resp.body.id;
        expect(d3Id).not.toBe(d2Id);
        // d2 is gone (replaced) — exactly one non-branch DRAFT remains on the default branch, and it's d3.
        const d2After = await patchDataSource.query(`SELECT id FROM app_versions WHERE id = $1`, [d2Id]);
        expect(d2After).toHaveLength(0);
        const draftsAfterReplace = await patchDataSource.query(
          `SELECT id FROM app_versions WHERE app_id = $1 AND status = 'DRAFT' AND version_type = 'version'`,
          [appId]
        );
        expect(draftsAfterReplace).toHaveLength(1);
        expect(draftsAfterReplace[0].id).toBe(d3Id);
        // The new draft is a clean copy of v1 — uncommitted edits (comp_B/query_B) discarded.
        expect(await componentNames(d3Id)).toEqual(['comp_A']);
        expect(await queryNames(d3Id)).toEqual(['query_A']);

        // ── Edit + save the new draft as v2 ──────────────────────────────────
        await addComponent(appId, d3Id, await draftPageId(d3Id), 'comp_C');
        await addQuery(dsId, d3Id, 'query_C');
        await publish(appId, d3Id, 'v2');
        expect(await componentNames(d3Id)).toEqual(['comp_A', 'comp_C']);

        // ── Create draft from the FIRST saved version (v1) again → clean v1 copy ──
        const d4Resp = await createDraftFrom(appId, v1Id, v1Ctx.envId, true);
        const d4Id: string = d4Resp.body.id;
        // d4 mirrors v1 (comp_A/query_A) — NOT v2 (no comp_C/query_C).
        expect(await componentNames(d4Id)).toEqual(['comp_A']);
        expect(await queryNames(d4Id)).toEqual(['query_A']);
      }, 300000);
    });
  });
});
