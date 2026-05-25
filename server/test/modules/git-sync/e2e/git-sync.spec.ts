import { INestApplication } from '@nestjs/common';
import { createUser, initTestApp, logout, login, closeTestApp, ensureAppEnvironments } from 'test-helper';
import * as request from 'supertest';

// Real configuration pointing at a local Gitea / GitHub Enterprise instance.
// Tests in the save+retrieve block and the App git life cycle hit this
// server for real (no stubs). All URLs are derived from TEST_GIT_BASE_URL +
// TEST_GIT_REPO_PATH so changing the host needs only one override.
const PEM = [
  '-----BEGIN RSA PRIVATE KEY-----',
  'MIIEowIBAAKCAQEArNG4ySWpCgq05Fncep8gu7bUYFxdag83y1B4nCyzxKFJ9RxK',
  'u7ix+lksqnTaZI6wUYHoGGX7gSnft1/85TyByEcdR9nn8ZTQ/yeuQ0DOoXhWzY8m',
  'hX+P6BqioYuKOxOAPYHbyRYp7o1cAKv3KdVW9Ro9dgWbeEAb19EJV0FDIvUUX8MZ',
  'VIA+UqiyISYIbXrHlbboSkAJb1mLZr4oFsBJwfZZ69B/szTV7YAntb+N13E8cRzp',
  'JchAPKhXhQZg+e7iEE2KcYLCm/U9qm7/2oys8JKgb+xSeKTG13kns9muYHIpMYeN',
  '4mCjJMg9L0mA2MFIwm9aG+Ohnq+Hh8AktVvijQIDAQABAoIBAQCXQmRa4fSHDoHv',
  'T9uTE84hnk9aG93DI5ixAjjecJ3TX1wNBfs/PNPCC+T1OJuh4eXfITWUjUZJce4W',
  'YRRHS+NH+T5ekhHZt2gJu6BhyspQN7S57C5KMDEzdISdojWVqWbX7t4Arb57xgwd',
  'pmYJnmmi05mxwAyofmwgRBzJ2xw47hnGEVPlFY+DJ2nXF0Df27UQg10Xx5bzAWOf',
  'EixicsQGvBn+cdr0vbSjc2ohklzC9HY8gJ12EvM9XU3vEXlNtsRTjVoMjQlXUKQ/',
  'uzfhA0AwqT9FuGnECcV1dNjpJJaubr7l+CiuUjRz9tr59TmVrN00SEno4CW+fwJ7',
  '8DzpyFPhAoGBAOQDDymmTzTppu4qI+IoHAAoKY0uTvjVx3WJVfo1MP5JiDx4cwva',
  'PYY4d93dHeU2W1DWhr0uqO3+Td8axzxwJmllghOl03vKljSvxdjnARhdgfstuf6J',
  'uj2jtAemJau+YaoDGu6tTF4qGoUQFzfrYb8Zi5vbLDc2zerwYBev2R6VAoGBAMII',
  'T/B0hOSmaJ5zkJbt1eZ5zRRv/56piaE4BPctAEE2WddMotmNIyrNXmGBIynZM7Eg',
  'NVftSL2ZRmB0yCm249Md2fUCN5yYLInhmDwb9hRCnkBNUvxT5/jULlDLKH1sJmLb',
  'L3H20kSIO8REM9FVa7MpAFBvuFrE52eaUCVBXM4ZAoGAE8EoGSWtixoLOmswPLHY',
  '6zKPlwnCEdEDvO0vI8RkAEQCp6qP3SEFX5GY4QH9SxSQiMptVgqq3CPCP2gkhtn4',
  'mf0PbgBZ+EmvBdWMwKQS9jdzwX1Otfzcw+Zg/KCqdtzBvWcTeEZPbYEcVxbzzAZ6',
  'q4HdFJ3CkO4QnSBCUwsLNpkCgYB5ujNEfCUfOVLrDT9JoL4P0JwbVUQ9qskATp+2',
  '3hGJ1+o3Cwojh8rnQF4Ut6pyx6QJXFZ66g83e2BOhRVKLkXxnYmujwyKfmF6wv/5',
  'veT8wup7FseYK5+dWKgR4dJuFRpj7HRwf9NcUUeFkvAbRQbDKFbdH6m9sEgolAPx',
  'y3bIiQKBgB82i38Aeafhd5PAJDOKtsrKUvrRaJt8cGtAPPzDU2JxGGE7lbBOS5Nq',
  'qyY4jTRZ3NQLZ6rRlLCOZlPEo2g1NaR+QZKv+rGh+9e46GX7ie+WhK2yQ0jTli64',
  'inCyrm0sxrsJlHKyjDKmP7gT16gxmMPZaUiwZxNzQ4VHXnuxd88E',
  '-----END RSA PRIVATE KEY-----',
].join('\n');

// Single source of truth for the Gitea / GitHub Enterprise test server.
// Override TEST_GIT_BASE_URL to point at a different host; everything else
// (repo URL, enterprise URL, API URL, reset/merge admin endpoints, the
// {owner, repo} pair used in admin merges) is derived from these two values.
const GIT_BASE_URL = (process.env.TEST_GIT_BASE_URL || 'http://130.131.160.149:3004').replace(/\/$/, '');
const GIT_REPO_PATH = (process.env.TEST_GIT_REPO_PATH || 'gsmithun4/e2e').replace(/^\/|\/$/g, '');
const [GIT_REPO_OWNER, GIT_REPO_NAME] = GIT_REPO_PATH.split('/');

const GITHUB_HTTPS_PAYLOAD = {
  gitUrl: `${GIT_BASE_URL}/${GIT_REPO_PATH}`,
  branchName: process.env.TEST_GIT_HTTPS_BRANCH || 'main',
  githubEnterpriseUrl: GIT_BASE_URL,
  githubEnterpriseApiUrl: `${GIT_BASE_URL}/api/v3`,
  githubAppId: process.env.TEST_GIT_HTTPS_APP_ID || '111',
  githubAppInstallationId: process.env.TEST_GIT_HTTPS_INSTALLATION_ID || '1111',
  githubAppPrivateKey: process.env.TEST_GIT_HTTPS_PRIVATE_KEY || PEM,
  gitType: 'github_https',
};

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
        await request(app.getHttpServer())
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
        await request(app.getHttpServer())
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
        await request(app.getHttpServer())
          .post('/api/git-sync')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({})
          .expect(400);
      });

      it('should create an organization git record for github_https', async () => {
        await request(app.getHttpServer())
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
        await request(app.getHttpServer())
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
        await request(app.getHttpServer())
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
        await request(app.getHttpServer())
          .post('/api/git-sync/test-connection')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ ...GITHUB_HTTPS_PAYLOAD, useEnvConfig: false, hasStoredConfig: false })
          .expect(201);
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
        await request(app.getHttpServer())
          .post('/api/git-sync/configs')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ ...GITHUB_HTTPS_PAYLOAD, useEnvConfig: false })
          .expect(201);

        const response = await request(app.getHttpServer())
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
        const branchesResp = await request(app.getHttpServer())
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
        const statusResp = await request(app.getHttpServer())
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
        const appsResp = await request(app.getHttpServer())
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
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        });

        step(1, 'save provider configs & load main branch');
        // 1. Save provider configs — bootstraps the org_git_sync row and
        //    auto-seeds the main branch.
        await request(app.getHttpServer())
          .post('/api/git-sync/configs')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ ...GITHUB_HTTPS_PAYLOAD, useEnvConfig: false })
          .expect(201);

        const initialBranches = await request(app.getHttpServer())
          .get('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        const mainBranchId: string = initialBranches.body.activeBranchId;
        expect(mainBranchId).toBeDefined();

        step(2, 'list remote branches → only main exists');
        // 2. List remote branches → only main exists after reset.
        const remoteAfterReset = await request(app.getHttpServer())
          .get('/api/workspace-branches/remote')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(remoteAfterReset.body).toEqual([{ name: 'main' }]);

        step(3, 'check-updates on main → hasUpdates');
        // 3. Check for updates on main — initial commit is fresher than the
        //    seeded workspace state, so hasUpdates is true with commit info.
        const checkUpdatesResp = await request(app.getHttpServer())
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
        await request(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(201);

        step(5, 'create feat-e2e branch off main');
        // 5. Create a feature branch off main.
        const createBranchResp = await request(app.getHttpServer())
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
        const twoBranchesResp = await request(app.getHttpServer())
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
        const appsOnFeat = await request(app.getHttpServer())
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
        const remoteAfterCreate = await request(app.getHttpServer())
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
        await request(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ icon: 'home', name: 'testing-app-1', type: 'front-end', branchId: mainBranchId })
          .expect(400);

        // 9b. Happy path on the feature branch.

        const createAppResp = await request(app.getHttpServer())
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
        const appGitBranchesResp = await request(app.getHttpServer())
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
        const appDetail = await request(app.getHttpServer())
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
        const versionsResp = await request(app.getHttpServer())
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
        const componentResp = await request(app.getHttpServer())
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
        await request(app.getHttpServer())
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
          headers: { 'Content-Type': 'application/json' },
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
        await request(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(201);

        step(16, 'GET apps on main → stub version visible');
        // 17. GET apps on main → the testing-app-1 from feature branch is
        //     now visible on main as a stub version.
        const appsOnMain = await request(app.getHttpServer())
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
        await request(app.getHttpServer())
          .get(`/api/apps/${mainApp.id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);

        step(18, 're-list apps on main → hydrated (is_stub:false)');
        // 19. Re-list apps on main — same app, now hydrated. is_stub is false
        //     at both app and version level; the version carries a name, a
        //     home_page_id and an editing_version block.
        const appsAfterHydrate = await request(app.getHttpServer())
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
        const mainVersionsResp = await request(app.getHttpServer())
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
        const checkTagResp = await request(app.getHttpServer())
          .get(`/api/app-git/${hydratedApp.id}/check-tag`)
          .query({ versionName: 'v1' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(checkTagResp.body.exists).toBe(false);
        expect(checkTagResp.body.tagName).toBe(`${hydratedApp.co_relation_id}/v1`);

        await request(app.getHttpServer())
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

        await request(app.getHttpServer())
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
        const versionsAfterPublish = await request(app.getHttpServer())
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
        const createBranch2Resp = await request(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e-2', sourceBranchId: mainBranchId })
          .expect(201);
        const feat2BranchId: string = createBranch2Resp.body.id;

        // Fetch the app on feat-e2e-2 to get its editing version id (a fresh
        // branch-type draft pulled in from the source branch).
        const appOnFeat2 = await request(app.getHttpServer())
          .get(`/api/apps/${hydratedApp.id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat2BranchId)
          .expect(200);
        const feat2EditingVersion = appOnFeat2.body?.editing_version || appOnFeat2.body?.editingVersion;
        expect(feat2EditingVersion).toBeDefined();
        const feat2VersionId: string = feat2EditingVersion.id;

        step(23, 'rename app to testing-app-2 on feat-e2e-2');
        await request(app.getHttpServer())
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
        await request(app.getHttpServer())
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
        await request(app.getHttpServer())
          .put(`/api/apps/${hydratedApp.id}/icons`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat2BranchId)
          .send({ icon: 'sentfast', branch_id: feat2BranchId })
          .expect(200);

        step(24, 'flip is_public=true on feat-e2e-2');
        await request(app.getHttpServer())
          .put(`/api/apps/${hydratedApp.id}/public`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat2BranchId)
          .send({ app: { is_public: true, branch_id: feat2BranchId } })
          .expect(200);

        step(25, 'gitpush commit feat-e2e-2 (name + slug + icon + is_public)');
        await request(app.getHttpServer())
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
          headers: { 'Content-Type': 'application/json' },
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
        const appsBeforePull = await request(app.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(appsBeforePull.body.apps).toHaveLength(1);
        expect(appsBeforePull.body.apps[0].name).toBe('testing-app-1');

        step(28, 'check-updates on main → hasUpdates true (merge commit ahead)');
        const checkUpdatesAfterMerge = await request(app.getHttpServer())
          .get('/api/workspace-branches/check-updates')
          .query({ branch: 'main' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(checkUpdatesAfterMerge.body.hasUpdates).toBe(true);
        expect(checkUpdatesAfterMerge.body.latestCommit.sha).toEqual(expect.any(String));

        step(29, 'pull main');
        await request(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(201);

        step(30, 'list apps on main → name testing-app-2 (slug still stub uuid)');
        const appsAfterPull = await request(app.getHttpServer())
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
        const builderPull = await request(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(201);
        expect(builderPull.body?.success ?? true).toBeTruthy();

        const ensureDraftResp = await request(app.getHttpServer())
          .post('/api/workspace-branches/ensure-draft')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ appId: hydratedApp.id, branchId: mainBranchId })
          .expect(201);
        const draftVersionId: string = ensureDraftResp.body.draftVersionId;
        expect(draftVersionId).toBeDefined();

        step(32, 'GET draft version → name + slug + icon + is_public propagated');
        const draftDetail = await request(app.getHttpServer())
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
        const savedDetail = await request(app.getHttpServer())
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
        const envListResp = await request(app.getHttpServer())
          .get('/api/app-environments')
          .query({ app_id: hydratedApp.id })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        const envs = (envListResp.body.environments as any[]).sort((a, b) => a.priority - b.priority);
        expect(envs.length).toBeGreaterThanOrEqual(3);
        const [devEnv, stagingEnv, prodEnv] = envs;

        await request(app.getHttpServer())
          .put(`/api/v2/apps/${hydratedApp.id}/versions/${publishedV1Id}/promote`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ currentEnvironmentId: devEnv.id })
          .expect(200);

        await request(app.getHttpServer())
          .put(`/api/v2/apps/${hydratedApp.id}/versions/${publishedV1Id}/promote`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ currentEnvironmentId: stagingEnv.id })
          .expect(200);

        await request(app.getHttpServer())
          .put(`/api/apps/${hydratedApp.id}/release`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ versionToBeReleased: publishedV1Id })
          .expect(200);

        step(35, 'released-app access + slug lookup + default env (production)');
        const validateAccess = await request(app.getHttpServer())
          .get('/api/apps/validate-released-app-access/testing-app-2-slug')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(validateAccess.body).toMatchObject({
          id: hydratedApp.id,
          slug: 'testing-app-2-slug',
        });

        await request(app.getHttpServer())
          .get('/api/apps/slugs/testing-app-2-slug')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);

        const defaultEnvResp = await request(app.getHttpServer())
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

        await request
          .agent(app.getHttpServer())
          .get('/api/apps/slugs/testing-app-2-slug')
          .expect(200);

        step(36, 'feat-e2e-3: duplicate app name (testing-app-2) → 400');
        // 36. Create another feature branch. Posting an app with a name that
        //     already exists in the workspace must be rejected.
        const createBranch3Resp = await request(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ name: 'feat-e2e-3', sourceBranchId: mainBranchId })
          .expect(201);
        const feat3BranchId: string = createBranch3Resp.body.id;

        await request(app.getHttpServer())
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
        const createApp3Resp = await request(app.getHttpServer())
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

        const app3Detail = await request(app.getHttpServer())
          .get(`/api/apps/${app3Id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat3BranchId)
          .expect(200);
        const app3EditingVersion = app3Detail.body?.editing_version || app3Detail.body?.editingVersion;
        const app3VersionId: string = app3EditingVersion.id;

        await request(app.getHttpServer())
          .put(`/api/apps/${app3Id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', feat3BranchId)
          .send({ app: { slug: 'testing-app-2-slug', branch_id: feat3BranchId } })
          .expect(400);

        await request(app.getHttpServer())
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
        await request(app.getHttpServer())
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
          headers: { 'Content-Type': 'application/json' },
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

        await request(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ branchId: mainBranchId })
          .expect(201);

        const appsAfterFeat3Merge = await request(app.getHttpServer())
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
        const ensureApp3Draft = await request(app.getHttpServer())
          .post('/api/workspace-branches/ensure-draft')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .send({ appId: app3OnMain.id, branchId: mainBranchId })
          .expect(201);
        const app3DraftVersionId: string = ensureApp3Draft.body.draftVersionId;

        const app3DraftDetail = await request(app.getHttpServer())
          .get(`/api/v2/apps/${app3OnMain.id}/versions/${app3DraftVersionId}`)
          .query({ mode: 'edit' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .set('x-branch-id', mainBranchId)
          .expect(200);
        expect(app3DraftDetail.body.name).toBe('testing-app-3');
        expect(app3DraftDetail.body.slug).toBe('testing-app-3-slug');
      });
    });
  });
});
