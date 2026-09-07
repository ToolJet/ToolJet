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
  createApplication,
  createApplicationVersion,
  createFolder,
} from 'test-helper';
import * as request from 'supertest';
import { randomUUID as genRepoUUID } from 'crypto';
import { WorkspaceBranchService } from '@ee/workspace-branches/service';
import { GitSyncQueueService } from '@ee/workspace-branches/git-sync-queue.service';

// Real configuration pointing at a local Gitea / GitHub Enterprise instance.
// Tests in the save+retrieve block and the App git life cycle hit this
// server for real (no stubs). All URLs are derived from TEST_GIT_BASE_URL +
// TEST_GIT_REPO_PATH so changing the host needs only one override.
//
// This suite is NOT quarantined by the jest config. Instead it self-guards: the
// required GitLab env is checked below, and when any of it is missing the WHOLE
// suite is skipped at runtime (`describeGitLab = describe.skip`) rather than throwing
// at import. A top-level throw would fail the entire e2e shard — not just this file —
// which is exactly why it used to be quarantined. Skipping keeps a GitLab-less
// `npm run test:e2e` green while running the suite for real wherever the GitLab
// simulator env is configured.
const REQUIRED_ENV = ['TEST_GIT_BASE_URL', 'TEST_GITLAB_TOKEN', 'TOOLJET_GIT_ADMIN_USER', 'TOOLJET_GIT_ADMIN_PASSWORD'];
const MISSING_ENV = REQUIRED_ENV.filter((name) => !process.env[name]);
const GITLAB_E2E_ENABLED = MISSING_ENV.length === 0;
if (!GITLAB_E2E_ENABLED) {
  console.warn(
    `[git-sync-gitlab] SKIPPED — set ${MISSING_ENV.join(', ')} (plus a GitLab-shaped simulator) to run this suite.`
  );
}
const describeGitLab = GITLAB_E2E_ENABLED ? describe : describe.skip;

// Single source of truth for the Gitea / GitHub Enterprise test server.
// Set TEST_GIT_BASE_URL to point at the host; everything else (repo URL,
// enterprise URL, API URL, reset/merge admin endpoints, the {owner, repo}
// pair used in admin merges) is derived from these two values. These reads
// tolerate undefined (fall back to empty/placeholder) because when the env is
// missing the suite is skipped before any of these values are used.
const GIT_BASE_URL = (process.env.TEST_GIT_BASE_URL || '').replace(/\/$/, '');
// Default to a throwaway, per-run ephemeral repo under the simulator's `run-ci`
// owner (URL shape `run-ci/<uuid>`), regenerated on every run. The random name
// guarantees it never collides with the GitHub e2e repo (or a parallel GitLab
// run) on the shared simulator; the simulator auto-creates it on first git
// access (AUTO_INIT) and reaps it via the CI cleaner. Override with
// TEST_GITLAB_REPO_PATH to pin a specific pre-provisioned project instead.
const GIT_REPO_PATH = (process.env.TEST_GITLAB_REPO_PATH || `run-ci/${genRepoUUID()}`).replace(/^\/|\/$/g, '');
const [GIT_REPO_OWNER, GIT_REPO_NAME] = GIT_REPO_PATH.split('/');
// Must equal the simulator's EXPECTED_GITLAB_TOKEN.
const GITLAB_TOKEN = process.env.TEST_GITLAB_TOKEN || '';

// GitLab provider config — mirrors what the Git Sync UI sends for GitLab.
//   gitLabEnterpriseUrl → self-hosted host; the API base becomes <host>/api/v4
//   gitLabProjectId     → `owner/repo`; the provider URL-encodes it to resolve the bare repo
//   gitLabProjectAccessToken → PRIVATE-TOKEN for /api/v4 + oauth2:<token> for git transport
const GITLAB_PAYLOAD = {
  gitUrl: `${GIT_BASE_URL}/${GIT_REPO_PATH}`,
  branchName: process.env.TEST_GITLAB_BRANCH || 'main',
  gitLabEnterpriseUrl: GIT_BASE_URL,
  gitLabProjectId: GIT_REPO_PATH,
  gitLabProjectAccessToken: GITLAB_TOKEN,
  gitType: 'gitlab',
};

// Basic-auth header for the Gitea simulator admin endpoints (reset / merge /
// files). Credentials come from env (guaranteed present when the suite runs;
// see GITLAB_E2E_ENABLED — the suite is skipped otherwise).
const BASIC =
  'Basic ' +
  Buffer.from(`${process.env.TOOLJET_GIT_ADMIN_USER}:${process.env.TOOLJET_GIT_ADMIN_PASSWORD}`).toString('base64');

/**
 * @group gitsync
 */
describeGitLab('GitSyncController — GitLab', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let tokenCookie: string;
    let orgId: string;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      const { organization } = await createUser(app, {
        email: 'admin.gl@tooljet.io',
        firstName: 'user',
        lastName: 'name',
      });
      orgId = organization.id;
      const { tokenCookie: tokenCookieData } = await login(app, 'admin.gl@tooljet.io');
      tokenCookie = tokenCookieData;
    });

    // Run each git-sync job inline at enqueue time so requests resolve only once
    // the worker body finished — keeps these tests deterministic. resetAllMocks
    // wipes the spies, hence beforeEach.
    beforeEach(() => {
      const branchSvc = app.get(WorkspaceBranchService, { strict: false });
      // Spy the class PROTOTYPE, not an app.get() instance. WorkspaceBranchesModule is a
      // cached SubModule registered several times (per configs / isMainImport), so there are
      // multiple GitSyncQueueService instances; app.get() may hand back a different one than
      // the WorkspaceBranchService actually injects, leaving the real queue.add un-mocked.
      // With WORKER=true the live GitSyncQueueProcessor then drains those jobs asynchronously
      // and the specs race the worker (create/pull land after the assertions). Prototyping the
      // spy intercepts enqueue on every instance, so jobs always run inline at enqueue time.
      jest
        .spyOn(GitSyncQueueService.prototype, 'enqueueCreateBranch')
        .mockImplementation((p) => branchSvc.executeCreateBranch(p));
      jest
        .spyOn(GitSyncQueueService.prototype, 'enqueuePullBranch')
        .mockImplementation((p) => branchSvc.executePullBranch(p));
      jest
        .spyOn(GitSyncQueueService.prototype, 'enqueueDeleteBranch')
        .mockImplementation((p) => branchSvc.executeDeleteBranch(p));
      jest
        .spyOn(GitSyncQueueService.prototype, 'enqueuePushAppDeletion')
        .mockImplementation((p) => branchSvc.executePushAppDeletion(p));
    });

    // Create returns an enqueue ack, not the branch row — resolve ids from the list endpoint.
    const branchIdByName = async (name: string, xBranchId: string): Promise<string> => {
      const res = await request
        .agent(app.getHttpServer())
        .get('/api/workspace-branches')
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId)
        .set('x-branch-id', xBranchId)
        .expect(200);
      return res.body.branches.find((b: any) => b.name === name)?.id;
    };

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
          email: 'admin2.gl@tooljet.io',
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
          .send({ gitType: 'gitlab' })
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

      it('should create an organization git record for gitlab', async () => {
        await request
          .agent(app.getHttpServer())
          .post('/api/git-sync')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ gitType: 'gitlab' })
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
          .send({ isEnabled: true, gitType: 'gitlab' })
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
          .send({ useEnvConfig: true, provider: 'gitlab' })
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

    describe('GitLab save + retrieve flow', () => {
      // No stubs. test-connection + saveProviderConfig hit the real Git server
      // configured by GITLAB_PAYLOAD (Gitea / GitHub Enterprise). The
      // server must be reachable and the App credentials must be valid for
      // these tests to pass.

      it('POST /api/git-sync/test-connection | should return 401 when unauthenticated', async () => {
        await request
          .agent(app.getHttpServer())
          .post('/api/git-sync/test-connection')
          .set('tj-workspace-id', orgId)
          .send({
            ...GITLAB_PAYLOAD,
            useEnvConfig: false,
            hasStoredConfig: false,
          })
          .expect(401);
      });

      it('POST /api/git-sync/test-connection | should pass for a valid payload', async () => {
        const res = await request
          .agent(app.getHttpServer())
          .post('/api/git-sync/test-connection')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({
            ...GITLAB_PAYLOAD,
            useEnvConfig: false,
            hasStoredConfig: false,
          });
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
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(401);
      });

      it('POST /api/git-sync/configs then GET /api/git-sync/:id | should persist the config and not expose the private key', async () => {
        await request
          .agent(app.getHttpServer())
          .post('/api/git-sync/configs')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);

        // GitLab config-save doesn't auto-seed the workspace default branch (HTTPS does), so seed
        // it here — same pattern the other describe blocks in this suite use.
        await app.get<DataSource>(getDataSourceToken('default')).query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
             VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [orgId]
        );

        const response = await request
          .agent(app.getHttpServer())
          .get(`/api/git-sync/${orgId}`)
          .query({ gitType: 'gitlab' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);

        const organizationGit = response.body?.organization_git;
        expect(organizationGit).toBeDefined();
        expect(organizationGit.git_type).toBe('gitlab');
        expect(organizationGit.organization_id).toBe(orgId);

        const gitLab = organizationGit.git_lab;
        expect(gitLab).toBeDefined();
        expect(gitLab.gitlab_url).toBe(GITLAB_PAYLOAD.gitUrl);
        expect(gitLab.gitlab_branch).toBe(GITLAB_PAYLOAD.branchName);
        expect(gitLab.gitlab_project_id).toBe(GITLAB_PAYLOAD.gitLabProjectId);
        expect(gitLab.gitlab_enterprise_url).toBe(GITLAB_PAYLOAD.gitLabEnterpriseUrl);
        expect(gitLab.is_enabled).toBe(true);
        expect(gitLab.is_finalized).toBe(true);

        // Security: the project access token must not be returned to the client.
        expect(gitLab.gitlab_project_access_token).toBeUndefined();
        expect(JSON.stringify(response.body)).not.toContain(GITLAB_PAYLOAD.gitLabProjectAccessToken);

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
        expect(mainBranch.name).toBe(GITLAB_PAYLOAD.branchName);
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
        // Freshly-saved config defaults to single-branch mode (#17425); multi-branch is opt-in.
        expect(statusResp.body.is_branching_enabled).toBe(false);
        expect(statusResp.body.id).toBe(organizationGit.id);
        expect(statusResp.body.active_branch_id).toBeNull();
        expect(statusResp.body.active_branch_name).toBeNull();
        expect(statusResp.body.default_git_branch).toBe(GITLAB_PAYLOAD.branchName);
        expect(statusResp.body.repo_url).toBe(GITLAB_PAYLOAD.gitUrl);
        expect(statusResp.body.git_type).toBe('gitlab');

        // Fresh workspace — no apps yet on the main branch. The list endpoint
        // should return an empty apps array and zero-valued meta counts.
        const appsResp = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({
            page: 1,
            folder: '',
            searchKey: '',
            type: 'front-end',
            branch_id: mainBranchId,
          })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);

        expect(appsResp.body.apps).toEqual([]);
        expect(appsResp.body.meta.total_count).toBe(0);
        expect(appsResp.body.meta.folder_count).toBe(0);
      });
    });

    // ---------------------------------------------------------------------------
    // Regression: folder-app relations created while Git Sync is OFF must survive
    // enabling Git Sync. Before branch_id was made mandatory on folder_apps, adding
    // an app/module to a folder with git off wrote branch_id = NULL; turning git on
    // then filtered listings by the (default) branch id, so the NULL rows vanished and
    // the folder looked empty ("relation lost"). The add now resolves the org's default
    // branch up front, so the same default-branch listing keeps them after git is on.
    // ---------------------------------------------------------------------------
    describe('Folder-app relations added while Git Sync is OFF survive enabling Git Sync', () => {
      it('keeps app and module folder memberships on the default branch after git sync is enabled', async () => {
        // Brand-new workspace — Git Sync is OFF (no provider configured yet). createUser
        // seeds the default 'main' branch at org creation, mirroring prod.
        const email = 'gitsync-gitlab-folder-preserve@tooljet.io';
        const { organization: org, user } = await createUser(app, {
          email,
          firstName: 'folder',
          lastName: 'preserve',
        });
        const { tokenCookie: cookie } = await login(app, email, 'password', org.id);
        const agent = () => request.agent(app.getHttpServer());

        const branchesBefore = await agent()
          .get('/api/workspace-branches')
          .set('Cookie', cookie)
          .set('tj-workspace-id', org.id)
          .expect(200);
        const mainBranchId = branchesBefore.body.branches.find((b: any) => b.isDefault)?.id;
        expect(mainBranchId).toBeDefined();

        // A front-end app and a module, each with a version on the default branch.
        const frontApp = await createApplication(app, { user, name: 'off-git-app', type: 'front-end' }, true);
        await createApplicationVersion(app, frontApp as any, { name: 'v1' });
        const moduleApp = await createApplication(app, { user, name: 'off-git-module', type: 'module' }, true);
        await createApplicationVersion(app, moduleApp as any, { name: 'v1' });

        // Folders are org-scoped (not branch-scoped).
        const frontFolder = await createFolder(app, {
          name: 'off-git-front-folder',
          type: 'front-end',
          organizationId: org.id,
        });
        const moduleFolder = await createFolder(app, {
          name: 'off-git-module-folder',
          type: 'module',
          organizationId: org.id,
        });

        // Add app -> front folder and module -> module folder while Git Sync is OFF.
        // No branch_id param — the service resolves the org's default branch, so the rows
        // are written with branch_id = mainBranchId (never NULL).
        await agent()
          .post('/api/folder-apps')
          .set('Cookie', cookie)
          .set('tj-workspace-id', org.id)
          .send({ folder_id: frontFolder.id, app_id: frontApp.id })
          .expect(201);
        await agent()
          .post('/api/folder-apps')
          .set('Cookie', cookie)
          .set('tj-workspace-id', org.id)
          .send({ folder_id: moduleFolder.id, app_id: moduleApp.id })
          .expect(201);

        // While still OFF the folder already lists the app on the default branch, and the
        // row carries branch_id = mainBranchId (the bug would have stored NULL here).
        const frontListOff = await agent()
          .get('/api/folder-apps')
          .query({ searchKey: '', type: 'front-end' })
          .set('Cookie', cookie)
          .set('tj-workspace-id', org.id)
          .expect(200);
        const frontFolderOff = frontListOff.body.folders.find((f: any) => f.id === frontFolder.id);
        expect(frontFolderOff.count).toBe(1);
        expect(frontFolderOff.folder_apps[0]).toMatchObject({
          folder_id: frontFolder.id,
          app_id: frontApp.id,
          branch_id: mainBranchId,
        });

        // Enable Git Sync for this workspace.
        await agent()
          .post('/api/git-sync/configs')
          .set('Cookie', cookie)
          .set('tj-workspace-id', org.id)
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);

        // Enabling git sync reuses the pre-existing default branch (same id) — the folder
        // relations must remain visible on it, not vanish.
        const branchesAfter = await agent()
          .get('/api/workspace-branches')
          .set('Cookie', cookie)
          .set('tj-workspace-id', org.id)
          .expect(200);
        expect(branchesAfter.body.branches.find((b: any) => b.isDefault)?.id).toBe(mainBranchId);

        // Front-end folder still holds the app on the default branch.
        const frontListOn = await agent()
          .get('/api/folder-apps')
          .query({ searchKey: '', type: 'front-end' })
          .set('Cookie', cookie)
          .set('tj-workspace-id', org.id)
          .query({ branch_id: mainBranchId })
          .expect(200);
        const frontFolderOn = frontListOn.body.folders.find((f: any) => f.id === frontFolder.id);
        expect(frontFolderOn).toBeDefined();
        expect(frontFolderOn.count).toBe(1);
        expect(frontFolderOn.folder_apps.map((fa: any) => fa.app_id)).toEqual([frontApp.id]);

        // Module folder still holds the module on the default branch.
        const moduleListOn = await agent()
          .get('/api/folder-apps')
          .query({ searchKey: '', type: 'module' })
          .set('Cookie', cookie)
          .set('tj-workspace-id', org.id)
          .query({ branch_id: mainBranchId })
          .expect(200);
        const moduleFolderOn = moduleListOn.body.folders.find((f: any) => f.id === moduleFolder.id);
        expect(moduleFolderOn).toBeDefined();
        expect(moduleFolderOn.count).toBe(1);
        expect(moduleFolderOn.folder_apps.map((fa: any) => fa.app_id)).toEqual([moduleApp.id]);

        // The dashboard apps-in-folder listing also still returns the app on the default branch.
        const appsInFolder = await agent()
          .get('/api/apps')
          .query({ page: 1, folder: frontFolder.id, searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', cookie)
          .set('tj-workspace-id', org.id)
          .expect(200);
        expect(appsInFolder.body.apps.map((a: any) => a.id)).toContain(frontApp.id);
        expect(appsInFolder.body.meta.folder_count).toBe(1);

        await logout(app, cookie, org.id).catch(() => undefined);
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
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);

        // Multi-branch is opt-in — a freshly-saved config defaults to single-branch mode (#17425).
        // Enable branching so the feature-branch steps below work.
        const lifecycleOrgGitId: string = (
          await request
            .agent(app.getHttpServer())
            .get(`/api/git-sync/${orgId}`)
            .set('Cookie', tokenCookie)
            .set('tj-workspace-id', orgId)
            .expect(200)
        ).body.organization_git.id;
        await request
          .agent(app.getHttpServer())
          .put(`/api/git-sync/${lifecycleOrgGitId}/is-branching-enabled`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ isBranchingEnabled: true })
          .expect(200);

        // GitLab config-save doesn't auto-seed the workspace default branch (HTTPS does), so seed
        // it here — same pattern the other describe blocks in this suite use.
        await app.get<DataSource>(getDataSourceToken('default')).query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
             VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [orgId]
        );

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
          .send({ name: 'feat-e2e', sourceBranchId: mainBranchId });
        if (createBranchResp.status !== 201) {
          throw new Error(
            `create feat-e2e -> ${createBranchResp.status}: ${createBranchResp.text || JSON.stringify(createBranchResp.body)}`
          );
        }
        // create-branch is async — the response is an enqueue ack, not the branch row.
        expect(createBranchResp.body).toMatchObject({ enqueued: true });
        const featBranchId: string = await branchIdByName('feat-e2e', mainBranchId);
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
        expect(featInList).toMatchObject({
          name: 'feat-e2e',
          isDefault: false,
          sourceBranchId: mainBranchId,
        });

        step(7, 'GET apps on feat-e2e → empty');
        // 7. GET apps on the brand-new feature branch → still empty.
        const appsOnFeat = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({
            page: 1,
            folder: '',
            searchKey: '',
            type: 'front-end',
            branch_id: featBranchId,
          })
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
          .send({
            icon: 'home',
            name: 'testing-app-1',
            type: 'front-end',
            branchId: mainBranchId,
          })
          .expect(400);

        // 9b. Happy path on the feature branch.

        const createAppResp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: featBranchId })
          .send({
            icon: 'home',
            name: 'testing-app-1',
            type: 'front-end',
            branchId: featBranchId,
          })
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
          .query({
            page: 1,
            folder: '',
            searchKey: '',
            type: 'front-end',
            branch_id: mainBranchId,
          })
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
          .query({
            page: 1,
            folder: '',
            searchKey: '',
            type: 'front-end',
            branch_id: mainBranchId,
          })
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
          .put(`/api/app-git/${hydratedApp.id}/versions/${hydratedVersion.id}`)
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

        // Publishing the version (above) auto-creates the git tag server-side (backend-owned
        // tagging) — no separate tag call. The standalone POST .../tag endpoint has been removed.

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
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-e2e-2', sourceBranchId: mainBranchId })
          .expect(201);
        const feat2BranchId: string = await branchIdByName('feat-e2e-2', mainBranchId);

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
          .query({
            page: 1,
            folder: '',
            searchKey: '',
            type: 'front-end',
            branch_id: mainBranchId,
          })
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

        step(32, 'list apps on main → name/slug/icon/is_public ALL refreshed by the pull');
        const appsAfterPull = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({
            page: 1,
            folder: '',
            searchKey: '',
            type: 'front-end',
            branch_id: mainBranchId,
          })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        expect(appsAfterPull.body.apps).toHaveLength(1);
        const renamedApp = appsAfterPull.body.apps[0];
        // The workspace pull now refreshes ALL user-facing metadata onto the branch version
        // (name, slug, icon, is_public) — previously only app_name was updated on pull, so the
        // slug used to stay the stub UUID until a later ensure-draft/edit. Assert all four land
        // straight from the pull. (Dashboard list is decamelized → is_public.)
        expect(renamedApp.name).toBe('testing-app-2');
        expect(renamedApp.slug).toBe('testing-app-2-slug');
        expect(renamedApp.icon).toBe('sentfast');
        expect(renamedApp.is_public).toBe(true);

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
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-e2e-3', sourceBranchId: mainBranchId })
          .expect(201);
        const feat3BranchId: string = await branchIdByName('feat-e2e-3', mainBranchId);

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
          .send({
            app: { slug: 'testing-app-2-slug', branch_id: feat3BranchId },
          })
          .expect(400);

        await request
          .agent(app.getHttpServer())
          .put(`/api/apps/${app3Id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat3BranchId })
          .send({
            app: { slug: 'testing-app-3-slug', branch_id: feat3BranchId },
          })
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
          .query({
            page: 1,
            folder: '',
            searchKey: '',
            type: 'front-end',
            branch_id: mainBranchId,
          })
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
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-e2e-4', sourceBranchId: mainBranchId })
          .expect(201);
        const feat4BranchId: string = await branchIdByName('feat-e2e-4', mainBranchId);
        expect(feat4BranchId).toBeDefined();

        const createApp4Resp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat4BranchId })
          .send({
            icon: 'home',
            name: 'testing-app-4',
            type: 'front-end',
            branchId: feat4BranchId,
          })
          .expect(201);
        const app4Id: string = createApp4Resp.body.id;
        expect(app4Id).toBeDefined();

        const createApp5Resp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat4BranchId })
          .send({
            icon: 'home',
            name: 'testing-app-5',
            type: 'front-end',
            branchId: feat4BranchId,
          })
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
          .query({
            page: 1,
            folder: '',
            searchKey: '',
            type: 'front-end',
            branch_id: mainBranchId,
          })
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
        // 47. Force the re-hydration path (a non-stub draft whose stored
        //     git_tree_sha no longer matches git's current tree SHA), repoint the workspace
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

        // Capture the materialized tree SHA so we can restore it after the failure test.
        const [{ git_tree_sha: app4OriginalTreeSha }] = await dataSource.query(
          `SELECT git_tree_sha FROM app_versions
           WHERE app_id = $1 AND branch_id = $2 AND is_stub = false`,
          [mainApp4.id, mainBranchId]
        );

        // Trigger the re-hydration check: force git_tree_sha to a value that can't match
        // git's current tree SHA, so the open path re-clones and re-imports.
        await dataSource.query(
          `UPDATE app_versions
             SET git_tree_sha = 'force-rehydrate-0000000000000000000000000000000000'
           WHERE app_id = $1 AND branch_id = $2 AND is_stub = false`,
          [mainApp4.id, mainBranchId]
        );

        // Repoint the git config at a non-existent repo (reachable host, bad path).
        const INVALID_GIT_URL = `${GIT_BASE_URL}/invalid/repo.git`;
        const [{ gitlab_url: originalGitUrl }] = await dataSource.query(
          `SELECT gitlab_url FROM organization_gitlab
           WHERE config_id IN (SELECT id FROM organization_git_sync WHERE organization_id = $1)`,
          [orgId]
        );
        await dataSource.query(
          `UPDATE organization_gitlab
             SET gitlab_url = $1
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
          `UPDATE organization_gitlab
             SET gitlab_url = $1
           WHERE config_id IN (SELECT id FROM organization_git_sync WHERE organization_id = $2)`,
          [originalGitUrl, orgId]
        );
        await dataSource.query(
          `UPDATE app_versions
             SET git_tree_sha = $3
           WHERE app_id = $1 AND branch_id = $2 AND is_stub = false`,
          [mainApp4.id, mainBranchId, app4OriginalTreeSha]
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
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-e2e-5', sourceBranchId: mainBranchId })
          .expect(201);
        const feat5BranchId: string = await branchIdByName('feat-e2e-5', mainBranchId);
        expect(feat5BranchId).toBeDefined();

        // Two more apps on feat-e2e-5.
        const createApp6Resp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat5BranchId })
          .send({
            icon: 'home',
            name: 'testing-app-6',
            type: 'front-end',
            branchId: feat5BranchId,
          })
          .expect(201);
        const app6Id: string = createApp6Resp.body.id;

        const createApp7Resp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat5BranchId })
          .send({
            icon: 'home',
            name: 'testing-app-7',
            type: 'front-end',
            branchId: feat5BranchId,
          })
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
          .query({
            page: 1,
            folder: '',
            searchKey: '',
            type: 'front-end',
            branch_id: mainBranchId,
          })
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
          .query({
            page: 1,
            folder: '',
            searchKey: '',
            type: 'front-end',
            branch_id: mainBranchId,
          })
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
          .query({
            page: 1,
            folder: '',
            searchKey: '',
            type: 'front-end',
            branch_id: mainBranchId,
          })
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
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-e2e-7', sourceBranchId: mainBranchId })
          .expect(201);
        const feat7BranchId: string = await branchIdByName('feat-e2e-7', mainBranchId);
        expect(feat7BranchId).toBeDefined();

        const localOnlyAppResp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat7BranchId })
          .send({
            icon: 'home',
            name: 'local-only-app',
            type: 'front-end',
            branchId: feat7BranchId,
          })
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

        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-e2e-10', sourceBranchId: mainBranchId })
          .expect(201);
        const feat10BranchId: string = await branchIdByName('feat-e2e-10', mainBranchId);
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
          {
            key: 'access_token_custom_headers',
            value: [['', '']],
            encrypted: false,
          },
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
        expect(createDsResp.body).toMatchObject({
          name: 'restapi-e2e',
          kind: 'restapi',
        });

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
          {
            key: 'access_token_custom_headers',
            value: [['', '']],
            encrypted: false,
          },
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
          .send({
            name: 'restapi-e2e',
            options: buildUpdateOptions(stagingUrl),
          })
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
          .send({
            commitMessage: 'data-source-commit',
            branchId: feat10BranchId,
          })
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
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-e2e-11', sourceBranchId: mainBranchId })
          .expect(201);
        const feat11BranchId: string = await branchIdByName('feat-e2e-11', mainBranchId);
        expect(feat11BranchId).toBeDefined();

        // Create module — endpoint reuses the same appsService.create path as apps.
        const createModuleResp = await request
          .agent(app.getHttpServer())
          .post('/api/modules')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: feat11BranchId })
          .send({
            icon: 'folderupload',
            name: 'e2e-test-module',
            type: 'module',
            branchId: feat11BranchId,
          })
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
          .send({
            icon: 'home',
            name: 'e2e-app-with-module',
            type: 'front-end',
            branchId: feat11BranchId,
          })
          .expect(201);
        const hostAppId: string = hostAppResp.body.id;
        expect(hostAppId).toBeDefined();

        // List modules on the feature branch — capture the module's co_relation_id
        // (this is the value the ModuleViewer's moduleAppId.value must carry).
        const moduleListResp = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({
            page: 1,
            folder: '',
            searchKey: '',
            type: 'module',
            branch_id: feat11BranchId,
          })
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
            generalStyles: {
              boxShadow: { value: '0px 0px 0px 0px #00000040' },
            },
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
          .query({
            page: 1,
            folder: '',
            searchKey: '',
            type: 'front-end',
            branch_id: mainBranchId,
          })
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
          .query({
            page: 1,
            folder: '',
            searchKey: '',
            type: 'module',
            branch_id: mainBranchId,
          })
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
          .query({
            page: 1,
            folder: '',
            searchKey: '',
            type: 'module',
            branch_id: mainBranchId,
          })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        const hydratedMainModule = (modulesAfterHydrationResp.body.apps || []).find((m: any) => m.id === mainModule.id);
        expect(hydratedMainModule).toBeDefined();
        expect(hydratedMainModule.is_stub).toBe(false);

        // ─── Helpers for steps 55-60 ──────────────────────────────────────
        // Meta files are gone; conflict detection enumerates apps/, modules/, and
        // data-sources/ directly. To drive the pull-conflict scenarios we write a
        // single resource file whose name collides with an existing resource (but
        // carries a fresh co_relation_id) via the simulator's /files endpoint —
        // which lands directly on the protected `main` (git push to main is blocked).
        // To "restore" we overwrite that file with `{}`: listGitResources /
        // readDataSourceEntries skip json without an `id`, so the stray directory
        // becomes invisible to enumeration (no leftover conflict, no import).
        const FILES_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/files`;
        const CONFLICT_CLONE_URL = `${GIT_BASE_URL}/${GIT_REPO_PATH}.git`;
        const { randomUUID: randomUUIDForMeta } = await import('crypto');
        const cfFs = await import('fs');
        const cfPath = await import('path');
        const cfOs = await import('os');
        const cfSimpleGit = (await import('simple-git')).default;

        // Write a single file onto main via the admin /files endpoint (bypasses the
        // protected-branch push block). `content` is JSON-stringified.
        const writeGitFile = async (repoRelPath: string, content: any, message: string): Promise<void> => {
          const resp = await fetch(FILES_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: BASIC,
            },
            body: JSON.stringify({
              ref: 'main',
              path: repoRelPath,
              content: JSON.stringify(content, null, 2),
              message,
            }),
          });
          if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            throw new Error(`writeGitFile(${repoRelPath}) ${resp.status} ${text}`);
          }
        };

        // Clone main (read-only) and scan the working tree.
        const scanMain = async <T>(fn: (dir: string) => T): Promise<T> => {
          const dir = await cfFs.promises.mkdtemp(cfPath.join(cfOs.tmpdir(), 'tj-scan-'));
          try {
            const git = cfSimpleGit({
              baseDir: dir,
              timeout: { block: 30000 },
              unsafe: { allowUnsafeCredentialHelper: true },
            });
            await git.clone(CONFLICT_CLONE_URL, '.', ['--branch', 'main', '--depth', '1', '--single-branch']);
            return fn(dir);
          } finally {
            await cfFs.promises.rm(dir, { recursive: true, force: true }).catch(() => {});
          }
        };

        // Return the first app/module resource name under a resource folder.
        const firstResourceName = (resourceFolder: string): Promise<string> =>
          scanMain((dir) => {
            const base = cfPath.join(dir, resourceFolder);
            for (const e of cfFs.readdirSync(base, { withFileTypes: true })) {
              if (!e.isDirectory()) continue;
              if (cfFs.existsSync(cfPath.join(base, e.name, 'app', 'app.json'))) return e.name;
              for (const s of cfFs.readdirSync(cfPath.join(base, e.name), {
                withFileTypes: true,
              })) {
                if (s.isDirectory() && cfFs.existsSync(cfPath.join(base, e.name, s.name, 'app', 'app.json'))) {
                  return s.name;
                }
              }
            }
            throw new Error(`no resource found under ${resourceFolder}`);
          });

        // Return the first datasource's name (data-sources/<dir>/data-source.json → content.name).
        const firstDataSourceName = (): Promise<string> =>
          scanMain((dir) => {
            const base = cfPath.join(dir, 'data-sources');
            for (const e of cfFs.readdirSync(base, { withFileTypes: true })) {
              if (!e.isDirectory()) continue;
              const f = cfPath.join(base, e.name, 'data-source.json');
              // Name is the DIRECTORY, not content.name (no longer pushed to git).
              if (cfFs.existsSync(f)) return e.name;
            }
            throw new Error('no datasource found under data-sources/');
          });

        // app/app.json path for an injected conflict resource (fresh co_relation_id,
        // colliding name under a dedicated conflict folder).
        const conflictAppJsonPath = (resourceFolder: string, conflictFolder: string, name: string): string =>
          `${resourceFolder}/${conflictFolder}/${name}/app/app.json`;

        const pullMainExpect409 = async (): Promise<any[]> => {
          const resp = await request
            .agent(app.getHttpServer())
            .post('/api/workspace-branches/pull')
            .set('Cookie', tokenCookie)
            .set('tj-workspace-id', orgId)
            .query({ branch_id: mainBranchId })
            .send({ branchId: mainBranchId })
            .expect(409);
          const groups = parseConflictGroups(resp.body);
          expect(groups).not.toBeNull();
          return groups!;
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

        step(55, 'pull main with a git app whose name collides with an existing app → 409 with conflict details');
        // 55. Inject an extra app dir (fresh co_relation_id) whose name matches an
        //     existing app. Conflict detection enumerates apps/ and must raise a
        //     409 listing both co_relation_ids under conflictGroups.
        const existingAppName = await firstResourceName('apps');
        const fakeAppCorid = randomUUIDForMeta();
        const appConflictPath = conflictAppJsonPath('apps', 'e2e-conflict-app', existingAppName);
        await writeGitFile(
          appConflictPath,
          {
            id: fakeAppCorid,
            name: existingAppName,
            type: 'front-end',
            slug: `e2e-conflict-${fakeAppCorid.slice(0, 8)}`,
            updatedAt: new Date().toISOString(),
          },
          'inject app name conflict'
        );

        const appConflictGroups = await pullMainExpect409();
        const appConflictGroup = appConflictGroups.find((g: any) => g.type === 'app');
        expect(appConflictGroup).toBeDefined();
        expect(appConflictGroup.conflictField).toBe('name');
        expect(appConflictGroup.conflicts.length).toBeGreaterThanOrEqual(2);
        expect(appConflictGroup.conflicts.map((c: any) => c.coRelationId)).toContain(fakeAppCorid);

        await writeGitFile(appConflictPath, {}, 'restore: neutralize injected app conflict');

        step(56, 'pull main with app same name in a different folder → 409 with conflict details');
        // 56. Cross-folder variant of step 55. App names are unique per
        //     (branch, type) regardless of folder, so an injected app with the
        //     SAME name under a DIFFERENT folder still collides → 409.
        const fakeAppFolderCorid = randomUUIDForMeta();
        const appFolderConflictPath = conflictAppJsonPath('apps', 'e2e-conflict-app-folder', existingAppName);
        await writeGitFile(
          appFolderConflictPath,
          {
            id: fakeAppFolderCorid,
            name: existingAppName,
            type: 'front-end',
            slug: `e2e-conflict-${fakeAppFolderCorid.slice(0, 8)}`,
            updatedAt: new Date().toISOString(),
          },
          'inject cross-folder app name conflict'
        );

        const appFolderConflictGroups = await pullMainExpect409();
        const appFolderConflictGroup = appFolderConflictGroups.find((g: any) => g.type === 'app');
        expect(appFolderConflictGroup).toBeDefined();
        expect(appFolderConflictGroup.conflictField).toBe('name');
        expect(appFolderConflictGroup.conflicts.length).toBeGreaterThanOrEqual(2);
        expect(appFolderConflictGroup.conflicts.map((c: any) => c.coRelationId)).toContain(fakeAppFolderCorid);

        await writeGitFile(appFolderConflictPath, {}, 'restore: neutralize injected cross-folder app conflict');

        step(57, 'pull main with a git module whose name collides with an existing module → 409');
        // 57. Same shape as step 55 for modules (enumerated from modules/).
        const existingModuleName = await firstResourceName('modules');
        const fakeModuleCorid = randomUUIDForMeta();
        const moduleConflictPath = conflictAppJsonPath('modules', 'e2e-conflict-module', existingModuleName);
        await writeGitFile(
          moduleConflictPath,
          {
            id: fakeModuleCorid,
            name: existingModuleName,
            type: 'module',
            slug: `e2e-conflict-${fakeModuleCorid.slice(0, 8)}`,
            updatedAt: new Date().toISOString(),
          },
          'inject module name conflict'
        );

        const moduleConflictGroups = await pullMainExpect409();
        const moduleConflictGroup = moduleConflictGroups.find((g: any) => g.type === 'module');
        expect(moduleConflictGroup).toBeDefined();
        expect(moduleConflictGroup.conflictField).toBe('name');
        expect(moduleConflictGroup.conflicts.length).toBeGreaterThanOrEqual(2);
        expect(moduleConflictGroup.conflicts.map((c: any) => c.coRelationId)).toContain(fakeModuleCorid);

        await writeGitFile(moduleConflictPath, {}, 'restore: neutralize injected module conflict');

        step(58, 'pull main with module same name in a different folder → 409 with conflict details');
        // 58. Cross-folder variant of step 57 for modules — same name under a
        //     different folder still collides on (branch, type) uniqueness → 409.
        const fakeModuleFolderCorid = randomUUIDForMeta();
        const moduleFolderConflictPath = conflictAppJsonPath(
          'modules',
          'e2e-conflict-module-folder',
          existingModuleName
        );
        await writeGitFile(
          moduleFolderConflictPath,
          {
            id: fakeModuleFolderCorid,
            name: existingModuleName,
            type: 'module',
            slug: `e2e-conflict-${fakeModuleFolderCorid.slice(0, 8)}`,
            updatedAt: new Date().toISOString(),
          },
          'inject cross-folder module name conflict'
        );

        const moduleFolderConflictGroups = await pullMainExpect409();
        const moduleFolderConflictGroup = moduleFolderConflictGroups.find((g: any) => g.type === 'module');
        expect(moduleFolderConflictGroup).toBeDefined();
        expect(moduleFolderConflictGroup.conflictField).toBe('name');
        expect(moduleFolderConflictGroup.conflicts.length).toBeGreaterThanOrEqual(2);
        expect(moduleFolderConflictGroup.conflicts.map((c: any) => c.coRelationId)).toContain(fakeModuleFolderCorid);

        await writeGitFile(moduleFolderConflictPath, {}, 'restore: neutralize injected cross-folder module conflict');

        step(59, 'pull main with a git datasource whose name collides with an existing DS → 409');
        // 59. Same shape as step 55 for data sources. Conflict detection derives a
        //     datasource's NAME from its DIRECTORY (data-sources/<name>/data-source.json),
        //     not from content.name (no longer pushed) — so to collide we must write into
        //     the existing DS's own directory with a DIFFERENT co_relation_id (git side
        //     only; the 409 blocks the pull, so the DB DS keeps its real id → same name,
        //     different identity → conflict), then restore. (Writing a NEW directory like
        //     e2e-conflict-ds with content.name set does NOT collide — the name is the dir.)
        const existingDsName = await firstDataSourceName();
        const dsConflictPath = `data-sources/${existingDsName}/data-source.json`;
        const originalDsContent = await scanMain((dir) =>
          JSON.parse(cfFs.readFileSync(cfPath.join(dir, dsConflictPath), 'utf8'))
        );
        const fakeDsCorid = randomUUIDForMeta();
        await writeGitFile(dsConflictPath, { ...originalDsContent, id: fakeDsCorid }, 'inject ds name conflict');

        const dsConflictGroups = await pullMainExpect409();
        const dsConflictGroup = dsConflictGroups.find((g: any) => g.type === 'datasource');
        expect(dsConflictGroup).toBeDefined();
        expect(dsConflictGroup.conflictField).toBe('name');
        expect(dsConflictGroup.conflicts.length).toBeGreaterThanOrEqual(2);
        expect(dsConflictGroup.conflicts.map((c: any) => c.coRelationId)).toContain(fakeDsCorid);

        // Restore the real DS file exactly so later steps see clean git.
        await writeGitFile(dsConflictPath, originalDsContent, 'restore: revert injected ds conflict');

        step(60, 'delete data source A on a branch, then rename B → A → succeeds (branch-aware name check)');
        // 63. Regression for the CRUD rename check. Deleting a global DS on a
        //     feature branch only soft-deletes its branch DSV (is_active=false);
        //     the data_sources row survives. The rename validation used to query
        //     data_sources, so renaming another DS into the freed name was
        //     wrongly rejected as "already exists". The branch-aware check now
        //     looks at active branch DSVs, so the rename succeeds.
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-e2e-19', sourceBranchId: mainBranchId })
          .expect(201);
        const feat19BranchId: string = await branchIdByName('feat-e2e-19', mainBranchId);

        const delRenameAResp = await request
          .agent(app.getHttpServer())
          .post(`/api/data-sources?branch_id=${feat19BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({
            name: 'del-rename-a',
            kind: 'restapi',
            options: restapiCreateOptions,
            scope: 'global',
          })
          .expect(201);
        const delRenameAId: string = delRenameAResp.body.id;

        const delRenameBResp = await request
          .agent(app.getHttpServer())
          .post(`/api/data-sources?branch_id=${feat19BranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({
            name: 'del-rename-b',
            kind: 'restapi',
            options: restapiCreateOptions,
            scope: 'global',
          })
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
          .send({
            name: 'del-rename-a',
            options: buildUpdateOptions('http://b-renamed.url.com'),
          })
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

        step(61, 'orphan APP on default branch: pull DELETES the synced orphan branch versions (apps row kept)');
        // 64. Orphan delete flow. A SYNCED app version that lives on the default branch
        //     but is absent from git is DELETED on pull (removeOrphanedResources): the
        //     branch's app_versions rows are removed (children cascade); the parent apps
        //     row is deliberately kept. Setup: create on a feature branch, SQL-move the
        //     version onto main as a synced (is_synced=true) default-branch row. Pull
        //     main → the branch versions are gone, the apps row survives.
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-orphan-app', sourceBranchId: mainBranchId })
          .expect(201);
        const orphanAppBranchId: string = await branchIdByName('feat-orphan-app', mainBranchId);

        const orphanSyncedAppResp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: orphanAppBranchId })
          .send({
            icon: 'home',
            name: 'orphan-synced-app',
            type: 'front-end',
            branchId: orphanAppBranchId,
          })
          .expect(201);
        const orphanSyncedAppId: string = orphanSyncedAppResp.body.id;

        // Move the version onto main as a previously-pulled, synced default-branch row
        // (is_synced=true + git_tree_sha set — the orphan sweep only considers rows that
        // came from git). It was never pushed, so its co_relation_id is
        // absent from main's appMeta → an orphan.
        await dataSource.query(
          `UPDATE app_versions SET version_type = 'version', branch_id = $1, is_synced = true, git_tree_sha = 'orphan-synced-tree-sha-000000000000000000000000' WHERE app_id = $2`,
          [mainBranchId, orphanSyncedAppId]
        );
        // Faked orphan (git HEAD unchanged) — clear this branch's git-sync skip
        // tokens so the pull below fully re-examines git and runs the orphan sweep.
        await dataSource.query(
          `UPDATE organization_git_sync_branches
           SET last_synced_commit = NULL, apps_git_tree_sha = NULL, modules_git_tree_sha = NULL, data_sources_git_tree_sha = NULL
           WHERE id = $1`,
          [mainBranchId]
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
          .query({
            page: 1,
            folder: '',
            searchKey: '',
            type: 'front-end',
            branch_id: mainBranchId,
          })
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

        // The branch's app_versions rows are DELETED (children cascade); the apps row is kept.
        const orphanAppAfter = await dataSource.query(
          `SELECT is_synced FROM app_versions WHERE app_id = $1 AND branch_id = $2`,
          [orphanSyncedAppId, mainBranchId]
        );
        expect(orphanAppAfter).toHaveLength(0);
        const orphanAppRowAfter = await dataSource.query(`SELECT id FROM apps WHERE id = $1`, [orphanSyncedAppId]);
        expect(orphanAppRowAfter).toHaveLength(1);

        step(62, 'orphan MODULE on default branch: pull DELETES the synced orphan branch versions (apps row kept)');
        // 65. Module variant of step 64. Modules are App rows (type='module') and go
        //     through the same removeOrphanedResources delete path.
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-orphan-mod', sourceBranchId: mainBranchId })
          .expect(201);
        const orphanModBranchId: string = await branchIdByName('feat-orphan-mod', mainBranchId);

        const orphanSyncedModResp = await request
          .agent(app.getHttpServer())
          .post('/api/modules')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: orphanModBranchId })
          .send({
            icon: 'folderupload',
            name: 'orphan-synced-mod',
            type: 'module',
            branchId: orphanModBranchId,
          })
          .expect(201);
        const orphanSyncedModId: string = orphanSyncedModResp.body.id;

        await dataSource.query(
          `UPDATE app_versions SET version_type = 'version', branch_id = $1, is_synced = true, git_tree_sha = 'orphan-synced-tree-sha-000000000000000000000000' WHERE app_id = $2`,
          [mainBranchId, orphanSyncedModId]
        );

        // Faked orphan (git HEAD unchanged) — clear this branch's git-sync skip
        // tokens so the pull below fully re-examines git and runs the orphan sweep.
        await dataSource.query(
          `UPDATE organization_git_sync_branches
           SET last_synced_commit = NULL, apps_git_tree_sha = NULL, modules_git_tree_sha = NULL, data_sources_git_tree_sha = NULL
           WHERE id = $1`,
          [mainBranchId]
        );

        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ branchId: mainBranchId })
          .expect(201);

        // Module branch versions DELETED (cascade); the apps row (type='module') is kept.
        const orphanModAfter = await dataSource.query(
          `SELECT is_synced FROM app_versions WHERE app_id = $1 AND branch_id = $2`,
          [orphanSyncedModId, mainBranchId]
        );
        expect(orphanModAfter).toHaveLength(0);
        const orphanModRowAfter = await dataSource.query(`SELECT id FROM apps WHERE id = $1`, [orphanSyncedModId]);
        expect(orphanModRowAfter).toHaveLength(1);

        step(63, 'orphan DATA SOURCE on default branch: pull DEACTIVATES the synced orphan DSV (is_active=false)');
        // 66. Data-source variant. Create a DS on a feature branch, SQL-move its DSV
        //     onto main as synced; pull main runs the deserialize orphan sweep, which
        //     DEACTIVATES the DSV (is_active=false, row kept) rather than deleting it.
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-orphan-ds', sourceBranchId: mainBranchId })
          .expect(201);
        const orphanDsBranchId: string = await branchIdByName('feat-orphan-ds', mainBranchId);

        const orphanSyncedDsResp = await request
          .agent(app.getHttpServer())
          .post(`/api/data-sources?branch_id=${orphanDsBranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({
            name: 'orphan-synced-ds',
            kind: 'restapi',
            options: restapiCreateOptions,
            scope: 'global',
          })
          .expect(201);
        const orphanSyncedDsId: string = orphanSyncedDsResp.body.id;

        await dataSource.query(
          `UPDATE data_source_versions SET branch_id = $1, is_synced = true WHERE data_source_id = $2`,
          [mainBranchId, orphanSyncedDsId]
        );

        // Faked orphan (git HEAD unchanged) — clear this branch's git-sync skip
        // tokens so the pull below fully re-examines git and runs the orphan sweep.
        await dataSource.query(
          `UPDATE organization_git_sync_branches
           SET last_synced_commit = NULL, apps_git_tree_sha = NULL, modules_git_tree_sha = NULL, data_sources_git_tree_sha = NULL
           WHERE id = $1`,
          [mainBranchId]
        );

        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches/pull')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ branchId: mainBranchId })
          .expect(201);

        // The orphan DSV is DEACTIVATED by the deserialize orphan sweep (is_active=false); the
        // row is kept and its is_synced flag is left untouched. The data_sources row survives.
        const orphanDsAfter = await dataSource.query(
          `SELECT is_active FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`,
          [orphanSyncedDsId, mainBranchId]
        );
        expect(orphanDsAfter).toHaveLength(1);
        expect(orphanDsAfter[0].is_active).toBe(false);
        const orphanDsRowAfter = await dataSource.query(`SELECT id FROM data_sources WHERE id = $1`, [
          orphanSyncedDsId,
        ]);
        expect(orphanDsRowAfter).toHaveLength(1);

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
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-meta-prop-1', sourceBranchId: mainBranchId })
          .expect(201);
        const metaBranch1Id: string = await branchIdByName('feat-meta-prop-1', mainBranchId);

        const metaCreateResp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: metaBranch1Id })
          .send({
            icon: 'home',
            name: metaAppName,
            type: 'front-end',
            branchId: metaBranch1Id,
          })
          .expect(201);
        const metaAppId: string = metaCreateResp.body.id;

        // Reads all default-branch (main) version rows for the meta-prop app.
        const metaRowsOnMain = (): Promise<
          Array<{
            status: string;
            version_type: string;
            app_name: string;
            slug: string;
            icon: string;
          }>
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
        expect(branch1MetaAtCreate).toMatchObject({
          app_name: metaAppName,
          icon: 'home',
        });

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
          .put(`/api/app-git/${metaAppId}/versions/${metaMainDraftId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({
            is_user_switched_version: false,
            name: 'v1',
            description: 'meta-prop save',
            status: 'PUBLISHED',
          })
          .expect(200);

        // Publishing (above) auto-creates the git tag server-side (backend-owned tagging).

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
        const originalMeta = {
          app_name: publishedRow.app_name,
          slug: publishedRow.slug,
          icon: publishedRow.icon,
        };
        expect(originalMeta.app_name).toBe(metaAppName);
        expect(originalMeta.icon).toBe('home');
        // Both rows share the same meta.
        expect(draftRow.app_name).toBe(originalMeta.app_name);
        expect(draftRow.slug).toBe(originalMeta.slug);
        expect(draftRow.icon).toBe(originalMeta.icon);

        step(67, 'meta-prop: edit name/slug/icon on feat-meta-prop-2 → default-branch meta MUST NOT change');
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-meta-prop-2', sourceBranchId: mainBranchId })
          .expect(201);
        const metaBranch2Id: string = await branchIdByName('feat-meta-prop-2', mainBranchId);

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
          .send({
            app: {
              name: 'meta-prop-app-v2',
              editingVersionId: metaBranch2VersionId,
              branch_id: metaBranch2Id,
            },
          })
          .expect(200);
        await request
          .agent(app.getHttpServer())
          .put(`/api/apps/${metaAppId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: metaBranch2Id })
          .send({
            app: { slug: 'meta-prop-slug-v2', branch_id: metaBranch2Id },
          })
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
        expect(branch2Rows[0]).toMatchObject({
          app_name: 'meta-prop-app-v2',
          slug: 'meta-prop-slug-v2',
          icon: 'sentfast',
        });

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
        await request
          .agent(app.getHttpServer())
          .post('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-unsynced', sourceBranchId: mainBranchId })
          .expect(201);
        const unsyncedFeatBranchId: string = await branchIdByName('feat-unsynced', mainBranchId);

        const unsyncedAppResp = await request
          .agent(app.getHttpServer())
          .post('/api/apps')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: unsyncedFeatBranchId })
          .send({
            icon: 'home',
            name: 'unsynced-app',
            type: 'front-end',
            branchId: unsyncedFeatBranchId,
          })
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
          .query({
            page: 1,
            folder: '',
            searchKey: '',
            type: 'front-end',
            branch_id: unsyncedFeatBranchId,
          })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        expect(unsyncedFeatListing.body.apps.find((a: any) => a.id === unsyncedAppId)).toBeUndefined();

        const unsyncedMainListing = await request
          .agent(app.getHttpServer())
          .get('/api/apps')
          .query({
            page: 1,
            folder: '',
            searchKey: '',
            type: 'front-end',
            branch_id: mainBranchId,
          })
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
          .query({
            page: 1,
            folder: '',
            searchKey: '',
            type: 'front-end',
            branch_id: unsyncedFeatBranchId,
          })
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
        await dataSource.query(`UPDATE organization_users SET last_branch_id = NULL WHERE organization_id = $1`, [
          orgId,
        ]);
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
        // Single-branch (branching disabled) default-branch resource flow:
        //   - app / module / data source can be created directly on the DEFAULT branch
        //     (multi-branch rejects create-on-default; single-branch allows it),
        //   - freshly created resources are is_synced=FALSE on create (in every mode) and are
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
          .send({
            icon: 'home',
            name: 'single-branch-app',
            type: 'front-end',
            branchId: mainBranchId,
          })
          .expect(201);
        const sbAppId: string = sbAppResp.body.id;

        const sbModuleResp = await request
          .agent(app.getHttpServer())
          .post('/api/modules')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .send({
            icon: 'folderupload',
            name: 'single-branch-module',
            type: 'module',
            branchId: mainBranchId,
          })
          .expect(201);
        const sbModuleId: string = sbModuleResp.body.id;

        const sbDsResp = await request
          .agent(app.getHttpServer())
          .post(`/api/data-sources?branch_id=${mainBranchId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({
            name: 'single-branch-ds',
            kind: 'restapi',
            options: sbRestapiOptions,
            scope: 'global',
          })
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
          .send({
            kind: 'restapi',
            name: 'sb_q1',
            options: { method: 'get', url: '', headers: [], url_params: [], body: [] },
          })
          .expect(201);

        const sbModuleDetail = await request
          .agent(app.getHttpServer())
          .get(`/api/apps/${sbModuleId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .expect(200);
        const sbModuleVersionId: string = (sbModuleDetail.body?.editing_version || sbModuleDetail.body?.editingVersion)
          .id;
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

        step(83, 'single-branch: app/module/data-source live on the DEFAULT branch, UNSYNCED, with the DS linked');
        // App + module versions: default branch, DRAFT, and is_synced=FALSE. A brand-new resource
        // has never been committed, so it starts unsynced on create in EVERY mode — git-off,
        // multi-branch feature, and single-branch default alike (AppsService.create /
        // DataSourcesUtilService.create keep it is_synced=false regardless of git being enabled).
        // Only a push (or a pull that materializes it) flips is_synced=true.
        const sbVersionRows = await dataSource.query(
          `SELECT id, branch_id, status, is_synced FROM app_versions WHERE id = ANY($1)`,
          [[sbAppVersionId, sbModuleVersionId]]
        );
        expect(sbVersionRows).toHaveLength(2);
        expect(sbVersionRows.every((r: any) => r.branch_id === mainBranchId)).toBe(true);
        expect(sbVersionRows.every((r: any) => r.status === 'DRAFT')).toBe(true);
        expect(sbVersionRows.every((r: any) => r.is_synced === false)).toBe(true);

        // Data source: an UNSYNCED DSV on the default branch, linked to the app via a query
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

        // ────────────────────────────────────────────────────────────────────
        // Single-branch deletion auto-push: deleting a git-synced app on the
        // DEFAULT branch must enqueue a git deletion push, giving single-branch
        // parity with the feature-branch deletes that auto-commit in multi-branch
        // mode. The shared Gitea blocks direct pushes to the default branch (see the
        // transport note above), so the real push (executePushAppDeletion →
        // pushWorkspace(main)) can't be exercised here — we assert at the enqueue
        // layer instead: swap the inline-exec spy for a recorder and verify the
        // enqueued payload targets the default branch.
        // ────────────────────────────────────────────────────────────────────
        step(84, 'single-branch: deleting a synced app on the DEFAULT branch enqueues a git deletion push');
        const sbDeletionPushSpy = jest
          .spyOn(GitSyncQueueService.prototype, 'enqueuePushAppDeletion')
          .mockImplementation(async () => undefined);
        // Zero out any deletion pushes from earlier steps in this long-running test.
        sbDeletionPushSpy.mockClear();

        await request
          .agent(app.getHttpServer())
          .delete(`/api/apps/${sbAppId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .expect(200);

        // The app's default-branch versions are gone from the DB …
        const sbAppVersionsAfter = await dataSource.query(`SELECT id FROM app_versions WHERE app_id = $1`, [sbAppId]);
        expect(sbAppVersionsAfter).toHaveLength(0);

        // … and a deletion push was enqueued for the DEFAULT branch (the single-branch fix).
        // The @OnEvent('app.deletion.push-to-git') listener runs async, so poll briefly
        // for the enqueue to land before asserting.
        const waitForCall = async (spy: jest.SpyInstance, timeoutMs = 8000) => {
          const start = Date.now();
          while (spy.mock.calls.length === 0 && Date.now() - start < timeoutMs) {
            await new Promise((r) => setTimeout(r, 50));
          }
        };
        await waitForCall(sbDeletionPushSpy);
        expect(sbDeletionPushSpy).toHaveBeenCalledTimes(1);
        expect(sbDeletionPushSpy).toHaveBeenCalledWith(
          expect.objectContaining({ organizationId: orgId, branchId: mainBranchId })
        );

        step(85, 'single-branch: deleting a synced module on the DEFAULT branch also enqueues a git deletion push');
        sbDeletionPushSpy.mockClear();

        await request
          .agent(app.getHttpServer())
          .delete(`/api/apps/${sbModuleId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .query({ branch_id: mainBranchId })
          .expect(200);

        const sbModuleVersionsAfter = await dataSource.query(`SELECT id FROM app_versions WHERE app_id = $1`, [
          sbModuleId,
        ]);
        expect(sbModuleVersionsAfter).toHaveLength(0);

        await waitForCall(sbDeletionPushSpy);
        expect(sbDeletionPushSpy).toHaveBeenCalledTimes(1);
        expect(sbDeletionPushSpy).toHaveBeenCalledWith(
          expect.objectContaining({ organizationId: orgId, branchId: mainBranchId })
        );

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
    // App-import version behavior across git off / on.
    //
    // setupImportedAppAssociations() decides how many versions of an imported app to
    // create based on whether git sync is ENABLED for the target workspace:
    //   - Git OFF → import ALL versions (full version history is preserved).
    //   - Git ON  → import ONLY the latest version (one-version-per-branch git contract).
    // Regression guard: previously a truthy resolved branchId (always the org default
    // branch) forced the "keep only latest" path even for non-git workspaces, so a
    // multi-version file import collapsed to a single version.
    // ────────────────────────────────────────────────────────────────────────────
    describe('POST /api/v2/resources/import | multi-version import respects git sync', () => {
      let importDataSource: DataSource;
      // A real export payload carrying 3 VERSION-type versions, reused by both tests.
      let multiVersionPayload: { app: any[]; tooljet_version: string };

      const authReq = (r: request.Test, cookie: string[], org: string) =>
        r.set('Cookie', cookie).set('tj-workspace-id', org);

      const versionCount = async (appId: string): Promise<number> => {
        const rows = await importDataSource.query(`SELECT COUNT(*)::int AS c FROM app_versions WHERE app_id = $1`, [
          appId,
        ]);
        return rows[0].c;
      };

      beforeAll(async () => {
        importDataSource = app.get<DataSource>(getDataSourceToken('default'));

        // Source workspace is git-OFF; seed an app with 3 versions and export it so we
        // have a definition whose appV2.appVersions holds all three.
        const { user, organization } = await createUser(app, {
          email: 'import-versions-src.gl@tooljet.io',
          firstName: 'import',
          lastName: 'source',
        });
        const { tokenCookie: srcCookie } = await login(app, 'import-versions-src.gl@tooljet.io');
        await ensureAppEnvironments(app, organization.id);

        const sourceApp = await createApplication(app, {
          name: `multi-version-source-${Date.now()}`,
          user: user as any,
        });
        await createApplicationVersion(app, sourceApp as any, { name: 'v1' });
        await createApplicationVersion(app, sourceApp as any, { name: 'v2' });
        await createApplicationVersion(app, sourceApp as any, { name: 'v3' });

        const exportResp = await authReq(
          request.agent(app.getHttpServer()).post('/api/v2/resources/export'),
          srcCookie,
          organization.id
        )
          .send({ app: [{ id: sourceApp.id }], organization_id: organization.id })
          .expect(201);

        // Sanity check the payload really carries all three versions before we import it.
        expect(exportResp.body.app[0].definition.appV2.appVersions).toHaveLength(3);

        multiVersionPayload = {
          app: exportResp.body.app,
          tooljet_version: exportResp.body.tooljet_version,
        };
      });

      it('imports ALL versions when git sync is disabled', async () => {
        const { organization } = await createUser(app, {
          email: 'import-versions-gitoff.gl@tooljet.io',
          firstName: 'import',
          lastName: 'gitoff',
        });
        const { tokenCookie: cookie } = await login(app, 'import-versions-gitoff.gl@tooljet.io');
        await ensureAppEnvironments(app, organization.id);

        const importResp = await authReq(
          request.agent(app.getHttpServer()).post('/api/v2/resources/import'),
          cookie,
          organization.id
        )
          .send({
            organization_id: organization.id,
            tooljet_version: multiVersionPayload.tooljet_version,
            app: [{ appName: 'imported-git-off', definition: multiVersionPayload.app[0].definition }],
          })
          .expect(201);

        expect(importResp.body.success).toBe(true);
        const importedAppId: string = importResp.body.imports.app[0].id;

        // Git OFF → all three versions are recreated.
        expect(await versionCount(importedAppId)).toBe(3);
      });

      it('imports ONLY the latest version when git sync is enabled', async () => {
        const { organization } = await createUser(app, {
          email: 'import-versions-giton.gl@tooljet.io',
          firstName: 'import',
          lastName: 'giton',
        });
        const { tokenCookie: cookie } = await login(app, 'import-versions-giton.gl@tooljet.io');
        await ensureAppEnvironments(app, organization.id);

        // Enable git sync for this workspace — flips getDetails().isEnabled to true
        // (hits the real GitLab/Gitea simulator, same as the rest of this suite).
        await authReq(request.agent(app.getHttpServer()).post('/api/git-sync/configs'), cookie, organization.id)
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);

        const importResp = await authReq(
          request.agent(app.getHttpServer()).post('/api/v2/resources/import'),
          cookie,
          organization.id
        )
          .send({
            organization_id: organization.id,
            tooljet_version: multiVersionPayload.tooljet_version,
            app: [{ appName: 'imported-git-on', definition: multiVersionPayload.app[0].definition }],
          })
          .expect(201);

        expect(importResp.body.success).toBe(true);
        const importedAppId: string = importResp.body.imports.app[0].id;

        // Git ON → only the latest version is imported (one editable version per branch).
        expect(await versionCount(importedAppId)).toBe(1);
      }, 180000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Pull re-marks resources synced after their is_synced was reset out-of-band.
    //
    // Repro of the "git disable → re-enable → pull leaves resources unsynced" bug:
    // disabling git flips is_synced=false on every default-branch app/module version
    // and data source version (git-sync-configs service), WITHOUT changing git content
    // or the branch's cached category tree SHAs. On the next pull the category-level
    // skip (git tree unchanged) used to return before anything re-flagged those rows,
    // so they stayed unsynced forever. The fix reconciles is_synced=true on the skip
    // path for every resource still present in git (matched by co_relation_id).
    //
    // The real disable endpoint only resets the DEFAULT branch, but the shared Gitea
    // blocks direct default-branch pushes — so this test pushes resources to a FEATURE
    // branch and reproduces the disable's effect with the same UPDATE it runs (a raw
    // is_synced=false flip). The reconcile under test is branch-agnostic, so a feature
    // branch exercises the exact code path. Runs against the real Gitea (@group gitsync).
    // ────────────────────────────────────────────────────────────────────────────
    describe('pull re-marks resources synced after is_synced reset (git disable→enable)', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;

      let syncOrgId: string;
      let syncCookie: string[];
      let syncDs: DataSource;

      beforeAll(async () => {
        const { organization } = await createUser(app, {
          email: 'git-resync.gl@tooljet.io',
          firstName: 'git',
          lastName: 'resync',
        });
        syncOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-resync.gl@tooljet.io');
        syncCookie = tokenCookie;
        await ensureAppEnvironments(app, syncOrgId);
        syncDs = app.get<DataSource>(getDataSourceToken('default'));
        await syncDs.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [syncOrgId]
        );
      });

      it('restores is_synced=true on the next pull for data source, app and module still in git', async () => {
        const { randomUUID } = await import('crypto');
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const agent = () => request.agent(app.getHttpServer());
        const auth = (r: request.Test) => r.set('Cookie', syncCookie).set('tj-workspace-id', syncOrgId);

        const pull = (branchId: string) =>
          auth(agent().post('/api/workspace-branches/pull')).query({ branch_id: branchId }).send({ branchId });
        const pushWorkspace = (branchId: string, commitMessage: string) =>
          auth(agent().post('/api/workspace-branches/push'))
            .query({ branch_id: branchId })
            .send({ commitMessage, branchId });
        const branchIdByName = async (name: string, xBranchId: string): Promise<string> =>
          (
            await auth(agent().get('/api/workspace-branches')).set('x-branch-id', xBranchId).expect(200)
          ).body.branches.find((b: any) => b.name === name)?.id;

        const dsvSynced = async (dsId: string, branchId: string): Promise<boolean> =>
          (
            await syncDs.query(
              `SELECT is_synced FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`,
              [dsId, branchId]
            )
          )[0]?.is_synced;
        const versionSynced = async (versionId: string): Promise<boolean> =>
          (await syncDs.query(`SELECT is_synced FROM app_versions WHERE id = $1`, [versionId]))[0]?.is_synced;

        const editingVersionOf = async (appId: string, branchId: string) => {
          const d = await auth(agent().get(`/api/apps/${appId}`))
            .query({ branch_id: branchId })
            .expect(200);
          const ev = d.body?.editing_version || d.body?.editingVersion || d.body?.app?.editing_version;
          const pageId = ev.home_page_id || ev.homePageId || ev.pages?.[0]?.id || d.body?.pages?.[0]?.id;
          return { versionId: ev.id as string, pageId: pageId as string };
        };

        const gitpush = (appId: string, versionId: string, gitAppName: string, branchName: string, branchId: string) =>
          auth(agent().post(`/api/app-git/gitpush/${appId}/${versionId}`))
            .query({ branch_id: branchId })
            .send({
              gitAppName,
              versionId,
              lastCommitMessage: 'commit-resync',
              gitVersionName: branchName,
              sourceBranch: branchName,
            });

        // ── 1. reset gitea, enable git + branching, pull main ─────────────────────
        step(1, 'reset gitea, configure git + branching, pull main');
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);
        const gitConfig = await auth(agent().get(`/api/git-sync/${syncOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: true })
          .expect(200);
        const mainBranchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body
          .activeBranchId;
        await pull(mainBranchId).expect(201);

        // ── 2. feature branch to author + push on (main pushes are blocked) ───────
        step(2, 'create feat-resync branch');
        await auth(agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-resync', sourceBranchId: mainBranchId })
          .expect(201);
        const featBranchId: string = await branchIdByName('feat-resync', mainBranchId);
        expect(featBranchId).toBeDefined();

        // ── 3. data source → workspace push ───────────────────────────────────────
        step(3, 'create global data source, push it to git');
        const dsId: string = (
          await auth(agent().post(`/api/data-sources?branch_id=${featBranchId}`))
            .send({
              name: 'resync-ds',
              kind: 'restapi',
              options: [
                { key: 'url', value: 'http://resync.example.com' },
                { key: 'auth_type', value: 'none' },
                { key: 'headers', value: [['', '']] },
                { key: 'ssl_certificate', value: 'none', encrypted: false },
              ],
              scope: 'global',
            })
            .expect(201)
        ).body.id;
        await pushWorkspace(featBranchId, 'push resync data source').expect(201);

        // ── 4. app (+ a component) → app-git push ─────────────────────────────────
        step(4, 'create app, add a component, gitpush it');
        const appId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'home', name: 'resync-app', type: 'front-end', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const appCtx = await editingVersionOf(appId, featBranchId);
        const btnId = randomUUID();
        await auth(agent().post(`/api/v2/apps/${appId}/versions/${appCtx.versionId}/components`))
          .query({ branch_id: featBranchId })
          .send({
            is_user_switched_version: false,
            pageId: appCtx.pageId,
            diff: {
              [btnId]: {
                name: `button_${btnId.slice(0, 6)}`,
                layouts: {
                  desktop: { top: 80, left: 15, width: 4, height: 40 },
                  mobile: { top: 80, left: 15, width: 4, height: 40 },
                },
                type: 'Button',
                general: {},
                generalStyles: {},
                others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
                properties: { text: { value: 'Button' } },
                styles: {},
              },
            },
          })
          .expect(201);
        await gitpush(appId, appCtx.versionId, 'resync-app', 'feat-resync', featBranchId).expect(201);

        // ── 5. module → app-git push ──────────────────────────────────────────────
        step(5, 'create module, gitpush it');
        const moduleId: string = (
          await auth(agent().post('/api/modules'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'folderupload', name: 'resync-module', type: 'module', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const modCtx = await editingVersionOf(moduleId, featBranchId);
        await gitpush(moduleId, modCtx.versionId, 'resync-module', 'feat-resync', featBranchId).expect(201);

        // ── 6. pull feat-resync → stamps the category tree SHAs and marks synced ──
        step(6, 'pull feat-resync (stamps category tree SHAs, marks resources synced)');
        await pull(featBranchId).expect(201);
        // Re-resolve editing versions — a pull may re-parent / re-hydrate the rows.
        const appAfterPull = await editingVersionOf(appId, featBranchId);
        const modAfterPull = await editingVersionOf(moduleId, featBranchId);

        step(7, 'sanity: data source, app and module are is_synced=true');
        expect(await dsvSynced(dsId, featBranchId)).toBe(true);
        expect(await versionSynced(appAfterPull.versionId)).toBe(true);
        expect(await versionSynced(modAfterPull.versionId)).toBe(true);

        // ── 8. reproduce the git-disable reset (same writes the service runs) ─────
        // The git-disable flow flips is_synced=false on the default branch AND clears the
        // branch's last_synced_commit so the next pull isn't whole-pull-skipped on an
        // unchanged remote HEAD. Mirror both here (feature branch stands in for default —
        // the reconcile is branch-agnostic). Category tree SHAs are left intact so the pull
        // takes the cheap category-skip + reconcile path.
        step(8, 'flip is_synced=false + clear last_synced_commit (mirrors the git-disable reset)');
        await syncDs.query(`UPDATE data_source_versions SET is_synced = false WHERE branch_id = $1`, [featBranchId]);
        await syncDs.query(
          `UPDATE app_versions SET is_synced = false
             WHERE branch_id = $1 AND app_id IN (SELECT id FROM apps WHERE organization_id = $2)`,
          [featBranchId, syncOrgId]
        );
        await syncDs.query(`UPDATE organization_git_sync_branches SET last_synced_commit = NULL WHERE id = $1`, [
          featBranchId,
        ]);
        expect(await dsvSynced(dsId, featBranchId)).toBe(false);
        expect(await versionSynced(appAfterPull.versionId)).toBe(false);
        expect(await versionSynced(modAfterPull.versionId)).toBe(false);

        // ── 9. pull again — whole-pull runs (HEAD token cleared); git content unchanged
        //      so each category takes the category-skip path → reconcile re-marks synced.
        step(9, 're-enable/pull: reconcile restores is_synced=true');
        await pull(featBranchId).expect(201);

        step(10, 'assert every resource still in git is is_synced=true again');
        expect(await dsvSynced(dsId, featBranchId)).toBe(true);
        expect(await versionSynced(appAfterPull.versionId)).toBe(true);
        expect(await versionSynced(modAfterPull.versionId)).toBe(true);
      }, 300000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Locally-deleted data source is RESTORED on the next workspace pull (#783).
    //
    // A local-only DB delete never changes git content, so all three pull skip layers
    // (whole-pull HEAD token → data-sources/ category tree SHA → per-DSV tree SHA) would
    // otherwise say "nothing changed" and the DS would stay gone. The delete() now clears
    // the relevant skip tokens so the reconcile/deserialize path runs and re-adds the DS.
    // The delete SHAPE — and thus the restore PATH — differs by branch mode:
    //   • FEATURE branch (multi-branch): soft-delete (DSV is_active=false, row kept) →
    //     pull's category-skip fast path (reconcileSyncedDataSourceVersions) reactivates
    //     the SAME DSV row.
    //   • DEFAULT branch (single-branch): hard-delete (DSV row removed; data_sources row
    //     kept) → pull runs the full deserialize, which re-INSERTs a fresh DSV row.
    // Flow per case: enable git → push apps + data sources → pull (baseline) → delete a
    // data source → pull → the data source is back. Single-branch uses an UNPROTECTED
    // default branch name so a real push works (the simulator only blocks direct pushes to
    // `main`). Each `it` uses a FRESH org and resets the shared repo. Against the GitLab
    // simulator (@group gitsync).
    // ────────────────────────────────────────────────────────────────────────────
    describe('locally-deleted data source is restored on pull (#783)', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;

      let restDs: DataSource;
      beforeAll(() => {
        restDs = app.get<DataSource>(getDataSourceToken('default'));
      });

      const step = (n: number, label: string) =>
        process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);

      const dsOptions = (url: string) => [
        { key: 'url', value: url },
        { key: 'auth_type', value: 'none' },
        { key: 'headers', value: [['', '']] },
        { key: 'ssl_certificate', value: 'none', encrypted: false },
      ];

      const makeCtx = async (email: string) => {
        const { organization } = await createUser(app, { email, firstName: 'del', lastName: 'restore' });
        const orgId = organization.id;
        const { tokenCookie } = await login(app, email);
        const cookie = tokenCookie;
        await ensureAppEnvironments(app, orgId);

        const agent = () => request.agent(app.getHttpServer());
        const auth = (r: request.Test) => r.set('Cookie', cookie).set('tj-workspace-id', orgId);

        const pull = (branchId: string) =>
          auth(agent().post('/api/workspace-branches/pull')).query({ branch_id: branchId }).send({ branchId });
        const pushWorkspace = (branchId: string, commitMessage: string) =>
          auth(agent().post('/api/workspace-branches/push'))
            .query({ branch_id: branchId })
            .send({ commitMessage, branchId });
        const branchIdByName = async (name: string, xBranchId: string): Promise<string> =>
          (
            await auth(agent().get('/api/workspace-branches')).set('x-branch-id', xBranchId).expect(200)
          ).body.branches.find((b: any) => b.name === name)?.id;

        // Configure git, seed the default branch row under `branchName`, set branching, pull.
        const configureGit = async (branchName: string, branching: boolean): Promise<string> => {
          await fetch(RESET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: BASIC },
            body: '{}',
          });
          await restDs.query(
            `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
             VALUES ($1, $2, true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
            [orgId, branchName]
          );
          await auth(agent().post('/api/git-sync/configs'))
            .send({ ...GITLAB_PAYLOAD, branchName, useEnvConfig: false })
            .expect(201);
          const orgGitId: string = (await auth(agent().get(`/api/git-sync/${orgId}`)).expect(200)).body.organization_git
            .id;
          await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
            .send({ isBranchingEnabled: branching })
            .expect(200);
          const defaultBranchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body
            .activeBranchId;
          await pull(defaultBranchId).expect(201);
          return defaultBranchId;
        };

        const createApp = async (name: string, branchId: string): Promise<string> =>
          (
            await auth(agent().post('/api/apps'))
              .query({ branch_id: branchId })
              .send({ icon: 'home', name, type: 'front-end', branchId })
              .expect(201)
          ).body.id;
        // Standalone global data source (no linked query → API delete is allowed).
        const createDataSource = async (name: string, branchId: string): Promise<string> =>
          (
            await auth(agent().post(`/api/data-sources?branch_id=${branchId}`))
              .send({ name, kind: 'restapi', options: dsOptions(`http://${name}.example.com`), scope: 'global' })
              .expect(201)
          ).body.id;
        const deleteDataSource = (dsId: string, branchId: string) =>
          auth(agent().delete(`/api/data-sources/${dsId}`).query({ branch_id: branchId }));

        // DB reads — the source of truth for restore.
        const dsvRowCount = async (dsId: string, branchId: string): Promise<number> =>
          (
            await restDs.query(
              `SELECT COUNT(*)::int AS c FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`,
              [dsId, branchId]
            )
          )[0].c;
        const dsvActiveCount = async (dsId: string, branchId: string): Promise<number> =>
          (
            await restDs.query(
              `SELECT COUNT(*)::int AS c FROM data_source_versions
                 WHERE data_source_id = $1 AND branch_id = $2 AND is_active = true`,
              [dsId, branchId]
            )
          )[0].c;
        const dsvSynced = async (dsId: string, branchId: string): Promise<boolean> =>
          (
            await restDs.query(
              `SELECT bool_and(is_synced) AS synced FROM data_source_versions
                 WHERE data_source_id = $1 AND branch_id = $2 AND is_active = true`,
              [dsId, branchId]
            )
          )[0]?.synced;
        // User-facing view: is the DS listed on the branch?
        const dsInList = async (dsId: string, branchId: string): Promise<boolean> => {
          const resp = await auth(agent().get(`/api/data-sources/${orgId}?branch_id=${branchId}`)).expect(200);
          const list = resp.body.data_sources || resp.body.dataSources || [];
          return list.some((d: any) => d.id === dsId);
        };

        return {
          orgId,
          auth,
          agent,
          pull,
          pushWorkspace,
          branchIdByName,
          configureGit,
          createApp,
          createDataSource,
          deleteDataSource,
          dsvRowCount,
          dsvActiveCount,
          dsvSynced,
          dsInList,
        };
      };

      // MULTI-BRANCH — soft-delete on a feature branch, then pull reactivates the same DSV row.
      it('multi-branch: a data source deleted on a feature branch is restored (reactivated) on pull', async () => {
        const ctx = await makeCtx('del-restore-mb-gl@tooljet.io');

        step(1, 'configure git + branching, create a feature branch');
        const mainBranchId = await ctx.configureGit('main', true);
        await ctx
          .auth(ctx.agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-del-restore', sourceBranchId: mainBranchId })
          .expect(201);
        const featBranchId = await ctx.branchIdByName('feat-del-restore', mainBranchId);
        expect(featBranchId).toBeDefined();

        step(2, 'create an app + a global data source on the feature branch');
        await ctx.createApp('del-mb-app', featBranchId);
        const dsId = await ctx.createDataSource('del-mb-ds', featBranchId);

        step(3, 'workspace push (apps + data sources) to the feature branch, then pull to settle');
        await ctx.pushWorkspace(featBranchId, 'push apps + data sources').expect(201);
        await ctx.pull(featBranchId).expect(201);

        step(4, 'baseline: the data source is active, synced, and listed');
        expect(await ctx.dsvActiveCount(dsId, featBranchId)).toBe(1);
        expect(await ctx.dsvSynced(dsId, featBranchId)).toBe(true);
        expect(await ctx.dsInList(dsId, featBranchId)).toBe(true);

        step(5, 'delete the data source on the feature branch → soft-delete (row kept, is_active=false)');
        await ctx.deleteDataSource(dsId, featBranchId).expect(200);
        expect(await ctx.dsvActiveCount(dsId, featBranchId)).toBe(0);
        expect(await ctx.dsvRowCount(dsId, featBranchId)).toBe(1); // row kept — soft delete
        expect(await ctx.dsInList(dsId, featBranchId)).toBe(false);

        step(6, 'workspace pull → the data source is restored (same DSV row reactivated)');
        await ctx.pull(featBranchId).expect(201);
        expect(await ctx.dsvActiveCount(dsId, featBranchId)).toBe(1);
        expect(await ctx.dsvRowCount(dsId, featBranchId)).toBe(1); // still the same single row
        expect(await ctx.dsvSynced(dsId, featBranchId)).toBe(true);
        expect(await ctx.dsInList(dsId, featBranchId)).toBe(true);
      }, 300000);

      // SINGLE-BRANCH — hard-delete on the (unprotected) default branch, then pull re-creates the DSV.
      it('single-branch: a data source deleted on the default branch is restored (re-created) on pull', async () => {
        const ctx = await makeCtx('del-restore-sb-gl@tooljet.io');

        step(1, 'configure git (single-branch, unprotected default) — branching OFF');
        const defaultBranchId = await ctx.configureGit('single-branch-main', false);

        step(2, 'create an app + a global data source on the default branch');
        await ctx.createApp('del-sb-app', defaultBranchId);
        const dsId = await ctx.createDataSource('del-sb-ds', defaultBranchId);

        step(3, 'workspace push (apps + data sources) to the default branch, then pull to settle');
        await ctx.pushWorkspace(defaultBranchId, 'push apps + data sources').expect(201);
        await ctx.pull(defaultBranchId).expect(201);

        step(4, 'baseline: the data source is active, synced, and listed');
        expect(await ctx.dsvActiveCount(dsId, defaultBranchId)).toBe(1);
        expect(await ctx.dsvSynced(dsId, defaultBranchId)).toBe(true);
        expect(await ctx.dsInList(dsId, defaultBranchId)).toBe(true);

        step(5, 'delete the data source on the default branch → hard-delete (DSV row removed)');
        await ctx.deleteDataSource(dsId, defaultBranchId).expect(200);
        expect(await ctx.dsvRowCount(dsId, defaultBranchId)).toBe(0); // hard delete — row gone
        expect(await ctx.dsInList(dsId, defaultBranchId)).toBe(false);

        step(6, 'workspace pull → the data source is restored (a fresh DSV row is re-created)');
        await ctx.pull(defaultBranchId).expect(201);
        expect(await ctx.dsvActiveCount(dsId, defaultBranchId)).toBe(1);
        expect(await ctx.dsvSynced(dsId, defaultBranchId)).toBe(true);
        expect(await ctx.dsInList(dsId, defaultBranchId)).toBe(true);
      }, 300000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Changing the repo URL resets the default branch's sync state.
    //
    // Pointing the workspace at a different remote invalidates the local "synced to
    // commit X" bookkeeping, so saveProviderConfig runs the same reset as disabling git:
    // is_synced=false on the default branch's app/module versions + data source versions,
    // and last_synced_commit cleared. Runs in single-branch mode so the resources live on
    // the default branch (which the reset targets). Against the real Gitea (@group gitsync).
    // ────────────────────────────────────────────────────────────────────────────
    describe('changing the repo URL resets the default branch sync state', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;
      // A second repo on the same simulator to switch to. Reset (auto-init) gives it a
      // clean 'main' so the config re-finalize (testBranchExistence) passes.
      const NEW_REPO_PATH = `${GIT_REPO_PATH}-urlchange`;
      const NEW_REPO_URL = `${GIT_BASE_URL}/${NEW_REPO_PATH}`;
      const NEW_RESET_URL = `${GIT_BASE_URL}/admin/repos/${NEW_REPO_PATH}.git/reset`;

      let urlOrgId: string;
      let urlCookie: string[];
      let urlDs: DataSource;

      beforeAll(async () => {
        const { organization } = await createUser(app, {
          email: 'git-url-change.gl@tooljet.io',
          firstName: 'git',
          lastName: 'urlchange',
        });
        urlOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-url-change.gl@tooljet.io');
        urlCookie = tokenCookie;
        await ensureAppEnvironments(app, urlOrgId);
        urlDs = app.get<DataSource>(getDataSourceToken('default'));
        await urlDs.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [urlOrgId]
        );
      });

      it('flips is_synced=false and clears last_synced_commit on the default branch when the git URL changes', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const agent = () => request.agent(app.getHttpServer());
        const auth = (r: request.Test) => r.set('Cookie', urlCookie).set('tj-workspace-id', urlOrgId);

        const versionSynced = async (versionId: string): Promise<boolean> =>
          (await urlDs.query(`SELECT is_synced FROM app_versions WHERE id = $1`, [versionId]))[0]?.is_synced;
        const dsvSynced = async (dsId: string, branchId: string): Promise<boolean> =>
          (
            await urlDs.query(
              `SELECT is_synced FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`,
              [dsId, branchId]
            )
          )[0]?.is_synced;
        const lastSyncedCommit = async (branchId: string): Promise<string | null> =>
          (
            await urlDs.query(`SELECT last_synced_commit FROM organization_git_sync_branches WHERE id = $1`, [branchId])
          )[0]?.last_synced_commit;
        const editingVersionId = async (appId: string, branchId: string): Promise<string> => {
          const d = await auth(agent().get(`/api/apps/${appId}`))
            .query({ branch_id: branchId })
            .expect(200);
          const ev = d.body?.editing_version || d.body?.editingVersion || d.body?.app?.editing_version;
          return ev.id;
        };

        // ── 1. reset repo, enable git, switch to single-branch so resources land on main ──
        step(1, 'reset gitea, configure git, disable branching (single-branch)');
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);
        const gitConfig = await auth(agent().get(`/api/git-sync/${urlOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: false })
          .expect(200);
        const mainBranchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body
          .activeBranchId;

        // ── 2. create app + module + data source on the default (single) branch ──────────
        step(2, 'create app + module + data source on the default branch');
        const appId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: mainBranchId })
            .send({ icon: 'home', name: 'url-change-app', type: 'front-end', branchId: mainBranchId })
            .expect(201)
        ).body.id;
        const moduleId: string = (
          await auth(agent().post('/api/modules'))
            .query({ branch_id: mainBranchId })
            .send({ icon: 'folderupload', name: 'url-change-module', type: 'module', branchId: mainBranchId })
            .expect(201)
        ).body.id;
        const dsId: string = (
          await auth(agent().post(`/api/data-sources?branch_id=${mainBranchId}`))
            .send({
              name: 'url-change-ds',
              kind: 'restapi',
              options: [
                { key: 'url', value: 'http://url-change.example.com' },
                { key: 'auth_type', value: 'none' },
                { key: 'headers', value: [['', '']] },
                { key: 'ssl_certificate', value: 'none', encrypted: false },
              ],
              scope: 'global',
            })
            .expect(201)
        ).body.id;
        const appVersionId = await editingVersionId(appId, mainBranchId);
        const moduleVersionId = await editingVersionId(moduleId, mainBranchId);

        // ── 3. force a known "synced" baseline (is_synced=true + a commit hash) ──────────
        step(3, 'seed synced baseline: is_synced=true + a last_synced_commit');
        await urlDs.query(
          `UPDATE app_versions SET is_synced = true
             WHERE branch_id = $1 AND app_id IN (SELECT id FROM apps WHERE organization_id = $2)`,
          [mainBranchId, urlOrgId]
        );
        await urlDs.query(`UPDATE data_source_versions SET is_synced = true WHERE branch_id = $1`, [mainBranchId]);
        await urlDs.query(
          `UPDATE organization_git_sync_branches SET last_synced_commit = '0123456789abcdef0123456789abcdef01234567' WHERE id = $1`,
          [mainBranchId]
        );
        expect(await versionSynced(appVersionId)).toBe(true);
        expect(await versionSynced(moduleVersionId)).toBe(true);
        expect(await dsvSynced(dsId, mainBranchId)).toBe(true);
        expect(await lastSyncedCommit(mainBranchId)).toBeTruthy();

        // ── 4. change the repo (URL + project id) → point at a different, freshly-reset repo
        step(4, 'reset the new repo, then save configs with a different gitUrl + gitLabProjectId');
        await fetch(NEW_RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, gitUrl: NEW_REPO_URL, gitLabProjectId: NEW_REPO_PATH, useEnvConfig: false })
          .expect(201);

        // ── 5. assert the reset fired on the default branch ──────────────────────────────
        step(5, 'assert is_synced=false everywhere on the default branch and commit hash cleared');
        expect(await versionSynced(appVersionId)).toBe(false);
        expect(await versionSynced(moduleVersionId)).toBe(false);
        expect(await dsvSynced(dsId, mainBranchId)).toBe(false);
        expect(await lastSyncedCommit(mainBranchId)).toBeNull();
      }, 300000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Regression: a feature-branch datasource push must NOT sync the default branch.
    //
    // A DataSource is one org row (shared co_relation_id) with a DataSourceVersion per
    // branch. serializeDataSources' scope='datasource' fallback used to look up an
    // unsynced DSV by data_source_id only (no branch filter), so pushing a feature branch
    // could grab the DEFAULT branch's unsynced DSV, put it in serializedDsvIds, and have
    // pushWorkspace flip it to is_synced=true — without any pull. Fixed by scoping the
    // fallback to the branch being pushed. Against the real Gitea (@group gitsync).
    // ────────────────────────────────────────────────────────────────────────────
    describe('feature-branch datasource push does not sync the default branch (regression)', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;

      let dsxOrgId: string;
      let dsxCookie: string[];
      let dsxDs: DataSource;

      beforeAll(async () => {
        const { organization } = await createUser(app, {
          email: 'git-ds-crossbranch.gl@tooljet.io',
          firstName: 'git',
          lastName: 'dscross',
        });
        dsxOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-ds-crossbranch.gl@tooljet.io');
        dsxCookie = tokenCookie;
        await ensureAppEnvironments(app, dsxOrgId);
        dsxDs = app.get<DataSource>(getDataSourceToken('default'));
        await dsxDs.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [dsxOrgId]
        );
      });

      it('leaves the default-branch data source is_synced=false after a scope=datasource push from a feature branch', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const agent = () => request.agent(app.getHttpServer());
        const auth = (r: request.Test) => r.set('Cookie', dsxCookie).set('tj-workspace-id', dsxOrgId);

        const dsvSyncedOnBranch = async (dsId: string, branchId: string): Promise<boolean> =>
          (
            await dsxDs.query(
              `SELECT is_synced FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`,
              [dsId, branchId]
            )
          )[0]?.is_synced;
        const branchIdByName = async (name: string, xBranchId: string): Promise<string> =>
          (
            await auth(agent().get('/api/workspace-branches')).set('x-branch-id', xBranchId).expect(200)
          ).body.branches.find((b: any) => b.name === name)?.id;

        // ── 0. resolve the seeded default branch id (git still off) ──────────────────────
        const [{ id: defaultBranchId }] = await dsxDs.query(
          `SELECT id FROM organization_git_sync_branches WHERE organization_id = $1 AND is_default = true`,
          [dsxOrgId]
        );

        // ── 1. GIT OFF: create an unsynced data source → lands on the default branch ─────
        step(1, 'git-off: create an unsynced global data source on the default branch');
        const dsId: string = (
          await auth(agent().post(`/api/data-sources?branch_id=${defaultBranchId}`))
            .send({
              name: 'crossbranch-ds',
              kind: 'restapi',
              options: [
                { key: 'url', value: 'http://crossbranch.example.com' },
                { key: 'auth_type', value: 'none' },
                { key: 'headers', value: [['', '']] },
                { key: 'ssl_certificate', value: 'none', encrypted: false },
              ],
              scope: 'global',
            })
            .expect(201)
        ).body.id;
        // Ensure the baseline is unsynced (git-off create already is; force it deterministically).
        await dsxDs.query(`UPDATE data_source_versions SET is_synced = false WHERE data_source_id = $1`, [dsId]);

        // ── 2. enable git + multi-branch, pull main ──────────────────────────────────────
        step(2, 'enable git + branching (multi-branch), pull main');
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);
        const gitConfig = await auth(agent().get(`/api/git-sync/${dsxOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: true })
          .expect(200);
        const mainBranchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body
          .activeBranchId;
        await auth(agent().post('/api/workspace-branches/pull'))
          .query({ branch_id: mainBranchId })
          .send({ branchId: mainBranchId })
          .expect(201);

        // The unsynced git-off DS is still unsynced on the default branch (never pushed).
        expect(await dsvSyncedOnBranch(dsId, mainBranchId)).toBe(false);

        // ── 3. create a feature branch — the unsynced DS is not in git, so it gets no DSV here
        step(3, 'create feature branch (unsynced DS is not copied onto it)');
        await auth(agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-ds-cross', sourceBranchId: mainBranchId })
          .expect(201);
        const featBranchId: string = await branchIdByName('feat-ds-cross', mainBranchId);
        expect(featBranchId).toBeDefined();
        const featDsvCount = (
          await dsxDs.query(
            `SELECT COUNT(*)::int AS c FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`,
            [dsId, featBranchId]
          )
        )[0].c;
        expect(featDsvCount).toBe(0);

        // ── 4. push scope=datasource FROM the feature branch ─────────────────────────────
        step(4, "scope='datasource' push from the feature branch");
        await auth(agent().post('/api/workspace-branches/push'))
          .query({ branch_id: featBranchId })
          .send({ commitMessage: 'push feature datasources', branchId: featBranchId, scope: 'datasource' })
          .expect(201);

        // ── 5. the default-branch DS must remain unsynced (pre-fix it flipped to true) ───
        step(5, 'assert the default-branch data source is still is_synced=false');
        expect(await dsvSyncedOnBranch(dsId, mainBranchId)).toBe(false);
      }, 300000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Deleted data sources must not be committed / must be removed on push.
    //
    // Two related gaps, both about a data source DELETED on a feature branch (soft-delete
    // flips its DSV is_active=false; the data_sources row stays):
    //   1) An APP push co-commits its linked global data sources via
    //      serializeLinkedDataSourcesForApp. Its DSV lookup missed the is_active filter, so a
    //      deleted-but-still-referenced data source was written into the app's commit.
    //   2) A scope='datasource' partial push skips ensureCleanDir, and had no explicit
    //      deleted-file removal, so a data source deleted AFTER being pushed lingered in git.
    // Both are fixed in workspace-git-sync-adapter.ts. Against the real Gitea (@group gitsync).
    // ────────────────────────────────────────────────────────────────────────────
    describe('deleted data sources are not committed / are removed on push (regression)', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;

      let ddOrgId: string;
      let ddCookie: string[];
      let ddDs: DataSource;

      const agent = () => request.agent(app.getHttpServer());
      const auth = (r: request.Test) => r.set('Cookie', ddCookie).set('tj-workspace-id', ddOrgId);

      const pull = (branchId: string) =>
        auth(agent().post('/api/workspace-branches/pull')).query({ branch_id: branchId }).send({ branchId });
      const pushWorkspace = (branchId: string, commitMessage: string, scope?: string, onlyUnsynced?: boolean) =>
        auth(agent().post('/api/workspace-branches/push'))
          .query({ branch_id: branchId })
          .send({
            commitMessage,
            branchId,
            ...(scope && { scope }),
            ...(onlyUnsynced && { onlyUnsyncedDatasources: true }),
          });
      const branchIdByName = async (name: string, xBranchId: string): Promise<string> =>
        (
          await auth(agent().get('/api/workspace-branches')).set('x-branch-id', xBranchId).expect(200)
        ).body.branches.find((b: any) => b.name === name)?.id;
      const editingVersionId = async (appId: string, branchId: string): Promise<string> => {
        const d = await auth(agent().get(`/api/apps/${appId}`))
          .query({ branch_id: branchId })
          .expect(200);
        const ev = d.body?.editing_version || d.body?.editingVersion || d.body?.app?.editing_version;
        return ev.id;
      };
      const dsvName = async (dsId: string, branchId: string): Promise<string> =>
        (
          await ddDs.query(`SELECT name FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`, [
            dsId,
            branchId,
          ])
        )[0]?.name;
      const dsvActive = async (dsId: string, branchId: string): Promise<boolean> =>
        (
          await ddDs.query(`SELECT is_active FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`, [
            dsId,
            branchId,
          ])
        )[0]?.is_active;

      // Shallow-clone a branch and check whether a repo-relative file exists.
      const readGitFile = async (branch: string, relPath: string): Promise<string | null> => {
        const simpleGit = (await import('simple-git')).default;
        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');
        const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tj-ds-del-'));
        try {
          const git = simpleGit({
            baseDir: tmpDir,
            timeout: { block: 30000 },
            unsafe: { allowUnsafeCredentialHelper: true },
          });
          await git.clone(`${GIT_BASE_URL}/${GIT_REPO_PATH}.git`, '.', [
            '--branch',
            branch,
            '--depth',
            '1',
            '--single-branch',
          ]);
          const filePath = path.join(tmpDir, relPath);
          return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;
        } finally {
          await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        }
      };

      const dsOptions = (url: string) => [
        { key: 'url', value: url },
        { key: 'auth_type', value: 'none' },
        { key: 'headers', value: [['', '']] },
        { key: 'ssl_certificate', value: 'none', encrypted: false },
      ];

      const enableGitAndFeatureBranch = async (
        featName: string
      ): Promise<{ mainBranchId: string; featBranchId: string }> => {
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);
        const gitConfig = await auth(agent().get(`/api/git-sync/${ddOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: true })
          .expect(200);
        const mainBranchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body
          .activeBranchId;
        await pull(mainBranchId).expect(201);
        await auth(agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({ name: featName, sourceBranchId: mainBranchId })
          .expect(201);
        const featBranchId = await branchIdByName(featName, mainBranchId);
        expect(featBranchId).toBeDefined();
        return { mainBranchId, featBranchId };
      };

      beforeAll(async () => {
        const { organization } = await createUser(app, {
          email: 'git-ds-delete.gl@tooljet.io',
          firstName: 'git',
          lastName: 'dsdelete',
        });
        ddOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-ds-delete.gl@tooljet.io');
        ddCookie = tokenCookie;
        await ensureAppEnvironments(app, ddOrgId);
        ddDs = app.get<DataSource>(getDataSourceToken('default'));
        await ddDs.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [ddOrgId]
        );
      });

      it('app push does NOT commit a data source that was deleted on the branch (serializeLinkedDataSourcesForApp)', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const FEAT = 'feat-linked-del';

        step(1, 'enable git + branching, create feature branch');
        const { featBranchId } = await enableGitAndFeatureBranch(FEAT);

        step(2, 'create app + global data source, link the DS to the app via a query');
        const appId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'home', name: 'linked-del-app', type: 'front-end', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const versionId = await editingVersionId(appId, featBranchId);
        const dsId: string = (
          await auth(agent().post(`/api/data-sources?branch_id=${featBranchId}`))
            .send({
              name: 'linked-del-ds',
              kind: 'restapi',
              options: dsOptions('http://linked-del.example.com'),
              scope: 'global',
            })
            .expect(201)
        ).body.id;
        await auth(agent().post(`/api/data-queries/data-sources/${dsId}/versions/${versionId}`))
          .query({ branch_id: featBranchId })
          .send({
            kind: 'restapi',
            name: 'q_linked_del',
            options: { method: 'get', url: '', url_params: [], headers: [], body: [] },
          })
          .expect(201);
        const dsName = await dsvName(dsId, featBranchId);

        step(3, 'soft-delete the data source on the branch (is_active=false)');
        await ddDs.query(
          `UPDATE data_source_versions SET is_active = false WHERE data_source_id = $1 AND branch_id = $2`,
          [dsId, featBranchId]
        );
        expect(await dsvActive(dsId, featBranchId)).toBe(false);

        step(4, 'gitpush the (unsynced, front-end) app — its linked-DS serialization runs');
        await auth(agent().post(`/api/app-git/gitpush/${appId}/${versionId}`))
          .query({ branch_id: featBranchId })
          .send({
            gitAppName: 'linked-del-app',
            versionId,
            lastCommitMessage: 'push app with deleted linked ds',
            gitVersionName: FEAT,
            sourceBranch: FEAT,
          })
          .expect(201);

        step(5, 'the deleted data source must NOT be present in git');
        expect(await readGitFile(FEAT, `data-sources/${dsName}/data-source.json`)).toBeNull();
      }, 300000);

      it('a scope=datasource push REMOVES the file of a data source deleted after being pushed', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const FEAT = 'feat-ds-stale';

        step(1, 'enable git + branching, create feature branch');
        const { featBranchId } = await enableGitAndFeatureBranch(FEAT);

        step(2, 'create a global data source on the feature branch');
        const dsId: string = (
          await auth(agent().post(`/api/data-sources?branch_id=${featBranchId}`))
            .send({
              name: 'stale-ds',
              kind: 'restapi',
              options: dsOptions('http://stale.example.com'),
              scope: 'global',
            })
            .expect(201)
        ).body.id;
        const dsName = await dsvName(dsId, featBranchId);
        const dsPath = `data-sources/${dsName}/data-source.json`;

        step(3, "scope='datasource' push → the DS file is committed");
        await pushWorkspace(featBranchId, 'add stale ds', 'datasource', true).expect(201);
        expect(await readGitFile(FEAT, dsPath)).not.toBeNull();

        step(4, 'delete the data source on the feature branch (no linked query → API delete allowed)');
        await auth(agent().delete(`/api/data-sources/${dsId}`).query({ branch_id: featBranchId }));
        expect(await dsvActive(dsId, featBranchId)).toBe(false);

        step(5, "scope='datasource' push again → the deleted DS's file is removed from git");
        await pushWorkspace(featBranchId, 'remove stale ds', 'datasource').expect(201);
        expect(await readGitFile(FEAT, dsPath)).toBeNull();
      }, 300000);

      // Single-branch delete SHAPE: on the default branch, service.delete HARD-deletes the DSV
      // row (vs the feature-branch soft-delete above), leaving the DS with no DSV on the branch.
      // A genuine single-branch push targets the protected `main`, which the shared Gitea blocks,
      // so we reproduce the identical "no active DSV on this branch" state on a feature branch by
      // hard-deleting the DSV row, then assert the orphan sweep still removes the file.
      it('a scope=datasource push removes a data source whose DSV was hard-deleted (single-branch delete shape)', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const FEAT = 'feat-ds-harddel';

        step(1, 'enable git + branching, create feature branch');
        const { featBranchId } = await enableGitAndFeatureBranch(FEAT);

        step(2, 'create a global data source, push it');
        const dsId: string = (
          await auth(agent().post(`/api/data-sources?branch_id=${featBranchId}`))
            .send({
              name: 'harddel-ds',
              kind: 'restapi',
              options: dsOptions('http://harddel.example.com'),
              scope: 'global',
            })
            .expect(201)
        ).body.id;
        const dsName = await dsvName(dsId, featBranchId);
        const dsPath = `data-sources/${dsName}/data-source.json`;
        await pushWorkspace(featBranchId, 'add harddel ds', 'datasource', true).expect(201);
        expect(await readGitFile(FEAT, dsPath)).not.toBeNull();

        step(3, 'hard-delete the DSV row (mirrors a single-branch default-branch delete)');
        await ddDs.query(`DELETE FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`, [
          dsId,
          featBranchId,
        ]);
        const remaining = (
          await ddDs.query(
            `SELECT COUNT(*)::int AS c FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`,
            [dsId, featBranchId]
          )
        )[0].c;
        expect(remaining).toBe(0);

        step(4, "scope='datasource' push → orphan sweep removes the file even with no DSV row");
        await pushWorkspace(featBranchId, 'remove harddel ds', 'datasource').expect(201);
        expect(await readGitFile(FEAT, dsPath)).toBeNull();
      }, 300000);

      // Product-path push: the app builder's "push data sources" sends scope='datasource' with
      // NO onlyUnsyncedDatasources flag. A freshly created (still-unsynced) data source must be
      // committed by that push — regressed when serializeDataSources narrowed the no-flag case to
      // isSynced=true (synced-only), silently dropping new data sources so they never reached git.
      it('a scope=datasource push with no onlyUnsynced flag (product default) commits a newly created data source', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const FEAT = 'feat-ds-default-push';

        step(1, 'enable git + branching, create feature branch');
        const { featBranchId } = await enableGitAndFeatureBranch(FEAT);

        step(2, 'create a global data source on the feature branch (multi-branch ⇒ starts unsynced)');
        const dsId: string = (
          await auth(agent().post(`/api/data-sources?branch_id=${featBranchId}`))
            .send({
              name: 'default-push-ds',
              kind: 'restapi',
              options: dsOptions('http://default-push.example.com'),
              scope: 'global',
            })
            .expect(201)
        ).body.id;
        const dsName = await dsvName(dsId, featBranchId);
        expect(await dsvActive(dsId, featBranchId)).toBe(true);

        step(3, "scope='datasource' push WITHOUT onlyUnsynced (mirrors the app builder) → the new DS is committed");
        await pushWorkspace(featBranchId, 'commit new ds via default push', 'datasource').expect(201);
        expect(await readGitFile(FEAT, `data-sources/${dsName}/data-source.json`)).not.toBeNull();
      }, 300000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Cross-branch app sync carries its dependencies (connected data sources + modules),
    // and opening the app fresh on the target branch re-hydrates them from git.
    //
    // The reported flow: multi-branching on, push an app to a selected feature branch, then
    // open it fresh on that branch. Two gaps this covers:
    //   1) DATA SOURCES — an app push now co-commits every connected global data source that
    //      isn't already on the target branch (serializeLinkedDataSourcesForApp, no longer
    //      gated on is_synced; falls back to the default-branch DSV for a DS the feature
    //      branch never got a version of). On open, deserializeWorkspaceResources recreates
    //      the branch DSV from that file instead of leaving an "Undefined data source" dummy.
    //   2) MODULES — hydrateStubApp now sparse-checks out modules/ for a front-end app, so a
    //      referenced module with no App row yet is stubbed from git during the app's open
    //      (hydrateReferencedModuleStubs → pullModules reads modules/ off disk).
    // Against the real Gitea (@group gitsync).
    // ────────────────────────────────────────────────────────────────────────────
    describe('cross-branch app push carries connected data sources and modules (regression)', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;

      let depOrgId: string;
      let depCookie: string[];
      let depDs: DataSource;

      const agent = () => request.agent(app.getHttpServer());
      const auth = (r: request.Test) => r.set('Cookie', depCookie).set('tj-workspace-id', depOrgId);

      const pull = (branchId: string) =>
        auth(agent().post('/api/workspace-branches/pull')).query({ branch_id: branchId }).send({ branchId });
      const branchIdByName = async (name: string, xBranchId: string): Promise<string> =>
        (
          await auth(agent().get('/api/workspace-branches')).set('x-branch-id', xBranchId).expect(200)
        ).body.branches.find((b: any) => b.name === name)?.id;
      const editingVersionId = async (appId: string, branchId: string): Promise<string> => {
        const d = await auth(agent().get(`/api/apps/${appId}`))
          .query({ branch_id: branchId })
          .expect(200);
        const ev = d.body?.editing_version || d.body?.editingVersion || d.body?.app?.editing_version;
        return ev.id;
      };
      const gitpushApp = (appId: string, versionId: string, gitAppName: string, featName: string, branchId: string) =>
        auth(agent().post(`/api/app-git/gitpush/${appId}/${versionId}`))
          .query({ branch_id: branchId })
          .send({
            gitAppName,
            versionId,
            lastCommitMessage: `push ${gitAppName}`,
            gitVersionName: featName,
            sourceBranch: featName,
          });
      const dsvName = async (dsId: string, branchId: string): Promise<string> =>
        (
          await depDs.query(`SELECT name FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`, [
            dsId,
            branchId,
          ])
        )[0]?.name;
      const dsvCount = async (dsId: string, branchId: string): Promise<number> =>
        (
          await depDs.query(
            `SELECT COUNT(*)::int AS c FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`,
            [dsId, branchId]
          )
        )[0].c;
      const dsCoRelId = async (dsId: string): Promise<string> =>
        (await depDs.query(`SELECT co_relation_id FROM data_sources WHERE id = $1`, [dsId]))[0]?.co_relation_id;

      const dsOptions = (url: string) => [
        { key: 'url', value: url },
        { key: 'auth_type', value: 'none' },
        { key: 'headers', value: [['', '']] },
        { key: 'ssl_certificate', value: 'none', encrypted: false },
      ];

      // Shallow-clone a branch and read a repo-relative file (null if absent).
      const readGitFile = async (branch: string, relPath: string): Promise<string | null> => {
        const simpleGit = (await import('simple-git')).default;
        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');
        const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tj-dep-file-'));
        try {
          const git = simpleGit({
            baseDir: tmpDir,
            timeout: { block: 30000 },
            unsafe: { allowUnsafeCredentialHelper: true },
          });
          await git.clone(`${GIT_BASE_URL}/${GIT_REPO_PATH}.git`, '.', [
            '--branch',
            branch,
            '--depth',
            '1',
            '--single-branch',
          ]);
          const filePath = path.join(tmpDir, relPath);
          return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;
        } finally {
          await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        }
      };

      // Shallow-clone a branch and check whether any <resourceFolder>/**/app/app.json carries
      // the given co_relation_id — robust to the folder-name layout (apps/<name>/…, modules/<name>/…).
      const gitResourceHasCoRel = async (branch: string, resourceFolder: string, coRel: string): Promise<boolean> => {
        const simpleGit = (await import('simple-git')).default;
        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');
        const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tj-dep-res-'));
        try {
          const git = simpleGit({
            baseDir: tmpDir,
            timeout: { block: 30000 },
            unsafe: { allowUnsafeCredentialHelper: true },
          });
          await git.clone(`${GIT_BASE_URL}/${GIT_REPO_PATH}.git`, '.', [
            '--branch',
            branch,
            '--depth',
            '1',
            '--single-branch',
          ]);
          const root = path.join(tmpDir, resourceFolder);
          if (!fs.existsSync(root)) return false;
          const stack = [root];
          while (stack.length) {
            const dir = stack.pop() as string;
            for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
              const full = path.join(dir, ent.name);
              if (ent.isDirectory()) {
                stack.push(full);
              } else if (ent.name === 'app.json') {
                try {
                  const j = JSON.parse(fs.readFileSync(full, 'utf-8'));
                  if (j?.id === coRel) return true;
                } catch {
                  /* skip malformed */
                }
              }
            }
          }
          return false;
        } finally {
          await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        }
      };

      const enableGitAndFeatureBranch = async (
        featName: string
      ): Promise<{ mainBranchId: string; featBranchId: string }> => {
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);
        const gitConfig = await auth(agent().get(`/api/git-sync/${depOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: true })
          .expect(200);
        const mainBranchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body
          .activeBranchId;
        await pull(mainBranchId).expect(201);
        await auth(agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({ name: featName, sourceBranchId: mainBranchId })
          .expect(201);
        const featBranchId = await branchIdByName(featName, mainBranchId);
        expect(featBranchId).toBeDefined();
        return { mainBranchId, featBranchId };
      };

      beforeAll(async () => {
        const { organization } = await createUser(app, {
          email: 'git-dep-carry-gl@tooljet.io',
          firstName: 'git',
          lastName: 'depcarry',
        });
        depOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-dep-carry-gl@tooljet.io');
        depCookie = tokenCookie;
        await ensureAppEnvironments(app, depOrgId);
        depDs = app.get<DataSource>(getDataSourceToken('default'));
        await depDs.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [depOrgId]
        );
      });

      it('carries a connected global data source into the feature branch on app push, and re-hydrates it on open', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const FEAT = 'feat-dep-ds';

        step(1, 'enable git + branching, create feature branch');
        const { featBranchId } = await enableGitAndFeatureBranch(FEAT);

        step(2, 'create front-end app + global data source on the feature branch, link the DS via a query');
        const appId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'home', name: 'dep-ds-app', type: 'front-end', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const versionId = await editingVersionId(appId, featBranchId);
        const dsId: string = (
          await auth(agent().post(`/api/data-sources?branch_id=${featBranchId}`))
            .send({
              name: 'dep-carry-ds',
              kind: 'restapi',
              options: dsOptions('http://dep-carry.example.com'),
              scope: 'global',
            })
            .expect(201)
        ).body.id;
        await auth(agent().post(`/api/data-queries/data-sources/${dsId}/versions/${versionId}`))
          .query({ branch_id: featBranchId })
          .send({
            kind: 'restapi',
            name: 'q_dep_carry',
            options: { method: 'get', url: '', url_params: [], headers: [], body: [] },
          })
          .expect(201);
        const dsName = await dsvName(dsId, featBranchId);

        step(3, 'gitpush the app to the feature branch → its connected DS rides into the same commit');
        await gitpushApp(appId, versionId, 'dep-ds-app', FEAT, featBranchId).expect(201);

        step(4, 'the connected data source is present in git on the feature branch');
        const dsFile = await readGitFile(FEAT, `data-sources/${dsName}/data-source.json`);
        expect(dsFile).not.toBeNull();
        const dsJson = JSON.parse(dsFile as string);
        expect(dsJson.id).toBe(await dsCoRelId(dsId));
        expect(dsJson.kind).toBe('restapi');
        // The name lives in the directory (data-sources/<name>/), never in the file.
        expect(dsJson.name).toBeUndefined();

        step(5, 'drop the branch DSV, then force a fresh open → hydrate re-creates it from git (no dummy)');
        // Simulate the target-branch state where the DS row isn't populated yet. Deleting the
        // DSV (+ its options) mirrors "connected DS missing on the branch"; the open must
        // repopulate it from the committed data-source.json rather than substituting a dummy.
        await depDs.query(
          `DELETE FROM data_source_version_options
             WHERE data_source_version_id IN (
               SELECT id FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2)`,
          [dsId, featBranchId]
        );
        await depDs.query(`DELETE FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`, [
          dsId,
          featBranchId,
        ]);
        expect(await dsvCount(dsId, featBranchId)).toBe(0);

        // Force the open-path re-hydrate: a git_tree_sha mismatch makes GET /apps/:id re-import.
        await depDs.query(
          `UPDATE app_versions SET git_tree_sha = 'force-rehydrate-0000000000000000000000000000000000'
             WHERE app_id = $1 AND branch_id = $2`,
          [appId, featBranchId]
        );

        const hydrateResp = await auth(agent().get(`/api/apps/${appId}`))
          .query({ branch_id: featBranchId })
          .expect(200);
        expect(hydrateResp.body.is_hydration_tried).toBe(true);
        expect(hydrateResp.body.hydration_status).toBe('success');

        step(6, 'the branch DSV is back — the connected data source populated on open');
        expect(await dsvCount(dsId, featBranchId)).toBeGreaterThan(0);
      }, 300000);

      it('carries a referenced module into the feature branch on app push, and re-creates its stub from git on host open', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const { randomUUID } = await import('crypto');
        const FEAT = 'feat-dep-mod';

        step(1, 'enable git + branching, create feature branch');
        const { featBranchId } = await enableGitAndFeatureBranch(FEAT);

        step(2, 'create a module on the feature branch and push it');
        const moduleAppId: string = (
          await auth(agent().post('/api/modules'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'folderupload', name: 'dep-carry-module', type: 'module', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const moduleVersionId = await editingVersionId(moduleAppId, featBranchId);
        await gitpushApp(moduleAppId, moduleVersionId, 'dep-carry-module', FEAT, featBranchId).expect(201);

        step(3, "capture the module's co_relation_id (set on push) — the ModuleViewer ref");
        const moduleInList = (
          await auth(agent().get('/api/apps'))
            .query({ page: 1, folder: '', searchKey: '', type: 'module', branch_id: featBranchId })
            .expect(200)
        ).body.apps.find((m: any) => m.name === 'dep-carry-module');
        expect(moduleInList).toBeDefined();
        const moduleCoRel: string = moduleInList.co_relation_id || moduleInList.coRelationId;
        expect(moduleCoRel).toBeTruthy();

        step(4, 'create a host front-end app on the feature branch that references the module');
        const hostAppId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'home', name: 'dep-host-app', type: 'front-end', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const hostDetail = await auth(agent().get(`/api/apps/${hostAppId}`))
          .query({ branch_id: featBranchId })
          .expect(200);
        const hostEv =
          hostDetail.body?.editing_version || hostDetail.body?.editingVersion || hostDetail.body?.app?.editing_version;
        const hostVersionId: string = hostEv.id;
        const hostPageId: string =
          hostEv.home_page_id || hostEv.homePageId || hostEv.pages?.[0]?.id || hostDetail.body?.pages?.[0]?.id;
        expect(hostPageId).toBeDefined();

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
            others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
            properties: {
              moduleAppId: { value: moduleCoRel },
              moduleVersionId: { value: '' },
              visibility: { value: true },
            },
            styles: { backgroundColor: { value: '#fff' }, padding: { value: 'default' } },
            parent: null,
          },
        };
        const mvResp = await auth(agent().post(`/api/v2/apps/${hostAppId}/versions/${hostVersionId}/components`))
          .query({ branch_id: featBranchId })
          .send({ is_user_switched_version: false, pageId: hostPageId, diff: moduleViewerDiff });
        if (mvResp.status !== 201) {
          throw new Error(`POST host components failed: ${mvResp.status} ${JSON.stringify(mvResp.body)}`);
        }

        step(5, 'gitpush the host app → the referenced module rides into modules/ on the feature branch');
        await gitpushApp(hostAppId, hostVersionId, 'dep-host-app', FEAT, featBranchId).expect(201);
        expect(await gitResourceHasCoRel(FEAT, 'modules', moduleCoRel)).toBe(true);

        step(6, "hard-delete the module's DB rows so the host ref resolves to nothing, then force host re-hydrate");
        // Full delete (cascades to app_versions + children) via SQL — the API delete is blocked
        // while the module is referenced by the host. This makes the module genuinely absent, so
        // the host's open must re-stub it from git via hydrateReferencedModuleStubs → pullModules,
        // which only works because hydrateStubApp now sparse-checks out modules/ for a front-end
        // app. Pre-fix, modules/ was absent from the hydrate clone and the stub was never created,
        // leaving the ModuleViewer empty. A full delete (vs re-keying co_relation_id) avoids an
        // app_name-on-branch collision between the stale row and the re-created stub.
        await depDs.query(`DELETE FROM apps WHERE id = $1`, [moduleAppId]);
        await depDs.query(
          `UPDATE app_versions SET git_tree_sha = 'force-rehydrate-0000000000000000000000000000000000'
             WHERE app_id = $1 AND branch_id = $2`,
          [hostAppId, featBranchId]
        );

        const hostHydrateResp = await auth(agent().get(`/api/apps/${hostAppId}`))
          .query({ branch_id: featBranchId })
          .expect(200);
        expect(hostHydrateResp.body.is_hydration_tried).toBe(true);
        expect(hostHydrateResp.body.hydration_status).toBe('success');

        step(7, 'the module stub was re-created from git and the host exposes it in `modules`');
        const [recreatedModule] = await depDs.query(
          `SELECT id FROM apps WHERE co_relation_id = $1 AND type = 'module' AND organization_id = $2`,
          [moduleCoRel, depOrgId]
        );
        expect(recreatedModule?.id).toBeTruthy();

        const hostModules = hostHydrateResp.body?.modules || [];
        const linked = hostModules.find((m: any) => (m.co_relation_id || m.coRelationId) === moduleCoRel);
        expect(linked).toBeDefined();
      }, 300000);

      it('carries a connected global data source into the feature branch on module push, and re-hydrates it on open', async () => {
        // Regression for the module counterpart of the front-end-app case above: pushing a
        // MODULE directly used to skip serializeLinkedDataSourcesForApp entirely (it was gated
        // to APP_TYPES.FRONT_END only), so a global DS connected solely via a module's query
        // never rode into the commit and was left permanently unsynced on other branches.
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const FEAT = 'feat-dep-ds-module';

        step(1, 'enable git + branching, create feature branch');
        const { featBranchId } = await enableGitAndFeatureBranch(FEAT);

        step(2, 'create a module + global data source on the feature branch, link the DS via a query');
        const moduleAppId: string = (
          await auth(agent().post('/api/modules'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'folderupload', name: 'dep-ds-module', type: 'module', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const versionId = await editingVersionId(moduleAppId, featBranchId);
        const dsId: string = (
          await auth(agent().post(`/api/data-sources?branch_id=${featBranchId}`))
            .send({
              name: 'dep-carry-module-ds',
              kind: 'restapi',
              options: dsOptions('http://dep-carry-module.example.com'),
              scope: 'global',
            })
            .expect(201)
        ).body.id;
        await auth(agent().post(`/api/data-queries/data-sources/${dsId}/versions/${versionId}`))
          .query({ branch_id: featBranchId })
          .send({
            kind: 'restapi',
            name: 'q_dep_carry_module',
            options: { method: 'get', url: '', url_params: [], headers: [], body: [] },
          })
          .expect(201);
        const dsName = await dsvName(dsId, featBranchId);

        step(3, 'gitpush the module to the feature branch → its connected DS rides into the same commit');
        await gitpushApp(moduleAppId, versionId, 'dep-ds-module', FEAT, featBranchId).expect(201);

        step(4, 'the connected data source is present in git on the feature branch');
        const dsFile = await readGitFile(FEAT, `data-sources/${dsName}/data-source.json`);
        expect(dsFile).not.toBeNull();
        const dsJson = JSON.parse(dsFile as string);
        expect(dsJson.id).toBe(await dsCoRelId(dsId));
        expect(dsJson.kind).toBe('restapi');
        // The name lives in the directory (data-sources/<name>/), never in the file.
        expect(dsJson.name).toBeUndefined();

        step(5, 'drop the branch DSV, then force a fresh open → hydrate re-creates it from git (no dummy)');
        await depDs.query(
          `DELETE FROM data_source_version_options
             WHERE data_source_version_id IN (
               SELECT id FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2)`,
          [dsId, featBranchId]
        );
        await depDs.query(`DELETE FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`, [
          dsId,
          featBranchId,
        ]);
        expect(await dsvCount(dsId, featBranchId)).toBe(0);

        // Force the open-path re-hydrate: a git_tree_sha mismatch makes GET /apps/:id re-import.
        await depDs.query(
          `UPDATE app_versions SET git_tree_sha = 'force-rehydrate-0000000000000000000000000000000000'
             WHERE app_id = $1 AND branch_id = $2`,
          [moduleAppId, featBranchId]
        );

        const hydrateResp = await auth(agent().get(`/api/apps/${moduleAppId}`))
          .query({ branch_id: featBranchId })
          .expect(200);
        expect(hydrateResp.body.is_hydration_tried).toBe(true);
        expect(hydrateResp.body.hydration_status).toBe('success');

        step(6, 'the branch DSV is back — the connected data source populated on open');
        expect(await dsvCount(dsId, featBranchId)).toBeGreaterThan(0);
      }, 300000);

      it('pushes app, module and data source with NO `name` field — the directory name is the sole source of truth', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const FEAT = 'feat-no-name-files';

        step(1, 'enable git + branching, create feature branch');
        const { featBranchId } = await enableGitAndFeatureBranch(FEAT);

        step(2, 'create a front-end app, a module, and a global data source linked via a query');
        const appId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'home', name: 'no-name-app', type: 'front-end', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const appVersionId = await editingVersionId(appId, featBranchId);
        const moduleAppId: string = (
          await auth(agent().post('/api/modules'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'folderupload', name: 'no-name-module', type: 'module', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const moduleVersionId = await editingVersionId(moduleAppId, featBranchId);
        const dsId: string = (
          await auth(agent().post(`/api/data-sources?branch_id=${featBranchId}`))
            .send({
              name: 'no-name-ds',
              kind: 'restapi',
              options: dsOptions('http://no-name.example.com'),
              scope: 'global',
            })
            .expect(201)
        ).body.id;
        await auth(agent().post(`/api/data-queries/data-sources/${dsId}/versions/${appVersionId}`))
          .query({ branch_id: featBranchId })
          .send({
            kind: 'restapi',
            name: 'q_no_name',
            options: { method: 'get', url: '', url_params: [], headers: [], body: [] },
          })
          .expect(201);
        const dsName = await dsvName(dsId, featBranchId);

        step(3, 'push the app (carries the DS) and the module to the feature branch');
        await gitpushApp(appId, appVersionId, 'no-name-app', FEAT, featBranchId).expect(201);
        await gitpushApp(moduleAppId, moduleVersionId, 'no-name-module', FEAT, featBranchId).expect(201);

        step(4, 'no pushed resource file carries a `name` key — identity is `id`, the name is the directory');
        // App: apps/<name>/app/app.json exists AT the directory named for the app, with no `name` key.
        const appFile = await readGitFile(FEAT, 'apps/no-name-app/app/app.json');
        expect(appFile).not.toBeNull();
        const appJson = JSON.parse(appFile as string);
        expect(appJson.name).toBeUndefined();
        expect(appJson.id).toBeTruthy(); // co_relation_id — identity still present

        // Module: modules/<name>/app/app.json — same shape.
        const moduleFile = await readGitFile(FEAT, 'modules/no-name-module/app/app.json');
        expect(moduleFile).not.toBeNull();
        expect(JSON.parse(moduleFile as string).name).toBeUndefined();

        // Data source: data-sources/<name>/data-source.json — no `name`; the directory carries it.
        expect(dsName).toBe('no-name-ds');
        const dsFile = await readGitFile(FEAT, `data-sources/${dsName}/data-source.json`);
        expect(dsFile).not.toBeNull();
        const dsJson = JSON.parse(dsFile as string);
        expect(dsJson.name).toBeUndefined();
        expect(dsJson.id).toBe(await dsCoRelId(dsId));
      }, 300000);

      // Resource names are used as filesystem path segments on push (apps/<name>/,
      // modules/<name>/, data-sources/<name>/), so a '/' in a name splits into nested
      // folders and silently vanishes on pull. Such names are only possible for content
      // that predates name validation; the push must reject them so they're fixed first.
      // Apps and modules are pushed individually (app-git gitpush); data sources are pushed
      // via a workspace push — this covers both entry points.
      it("rejects a push when a resource name contains '/' (app + module via app push, data source via workspace push)", async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const FEAT = 'feat-invalid-name-push-gl';

        step(1, 'enable git + branching, create feature branch');
        const { featBranchId } = await enableGitAndFeatureBranch(FEAT);

        step(2, 'create a front-end app, a module, and a global data source on the feature branch');
        const appId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'home', name: 'invalid-name-app', type: 'front-end', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const appVersionId = await editingVersionId(appId, featBranchId);
        const moduleAppId: string = (
          await auth(agent().post('/api/modules'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'folderupload', name: 'invalid-name-module', type: 'module', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const moduleVersionId = await editingVersionId(moduleAppId, featBranchId);
        const dsId: string = (
          await auth(agent().post(`/api/data-sources?branch_id=${featBranchId}`))
            .send({
              name: 'invalid-name-ds',
              kind: 'restapi',
              options: dsOptions('http://invalid-name.example.com'),
              scope: 'global',
            })
            .expect(201)
        ).body.id;

        step(3, "app push whose git name contains '/' → 409 invalid_name");
        const appPush = await gitpushApp(appId, appVersionId, 'invalid/app-name', FEAT, featBranchId);
        expect(appPush.status).toBe(409);
        expect(JSON.stringify(appPush.body)).toContain('invalid_name');

        step(4, "module push whose git name contains '/' → 409 invalid_name");
        const modulePush = await gitpushApp(moduleAppId, moduleVersionId, 'invalid/module-name', FEAT, featBranchId);
        expect(modulePush.status).toBe(409);
        expect(JSON.stringify(modulePush.body)).toContain('invalid_name');

        step(5, "corrupt the data source name to contain '/' (the API rejects it, so set it directly)");
        // Mirrors a legacy name pushed before validation existed. Both the data_sources row and
        // its branch DSV carry the name, so update both.
        await depDs.query(`UPDATE data_sources SET name = 'invalid/ds-name' WHERE id = $1`, [dsId]);
        await depDs.query(
          `UPDATE data_source_versions SET name = 'invalid/ds-name' WHERE data_source_id = $1 AND branch_id = $2`,
          [dsId, featBranchId]
        );

        step(6, "workspace push (scope=datasource) with the '/' data source name → 409 invalid_name");
        const dsPush = await auth(agent().post('/api/workspace-branches/push'))
          .query({ branch_id: featBranchId })
          .send({ commitMessage: 'push invalid ds name', branchId: featBranchId, scope: 'datasource' });
        expect(dsPush.status).toBe(409);
        expect(JSON.stringify(dsPush.body)).toContain('invalid_name');
      }, 300000);

      // An app push carries its referenced modules into the same commit, bootstrapping each
      // never-synced module from its default-branch draft (writeReferencedModules). If such a
      // module has MULTIPLE drafts, an arbitrary one would be committed silently. The push must
      // instead fail with the same class of error the app itself raises for multiple drafts —
      // MODULES_NOT_READY, naming the offending module — so the user resolves it first. The
      // sibling "carries a referenced module" test above (single-draft module → 201) is the
      // positive control proving this guard doesn't over-fire.
      it('blocks an app push when a connected (unsynced) module has multiple drafts → MODULES_NOT_READY', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const { randomUUID } = await import('crypto');
        const FEAT = 'feat-mod-multidraft';

        step(1, 'enable git + branching, create feature branch');
        const { mainBranchId, featBranchId } = await enableGitAndFeatureBranch(FEAT);

        step(2, 'create an (unsynced) module on the feature branch, capture its co_relation_id');
        const moduleAppId: string = (
          await auth(agent().post('/api/modules'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'folderupload', name: 'multidraft-module', type: 'module', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const moduleCoRel: string = (
          await depDs.query(`SELECT co_relation_id FROM apps WHERE id = $1`, [moduleAppId])
        )[0]?.co_relation_id;
        expect(moduleCoRel).toBeTruthy();

        step(3, 'give the module TWO default-branch drafts — the ambiguous state a bootstrap cannot resolve');
        // Inject two VERSION-type (default-branch) non-stub, unsynced drafts by copying an
        // existing module version row (satisfies NOT NULL columns). VERSION-type allows multiple
        // drafts per branch (only name/slug/app_name uniqueness applies) — same technique the app
        // MULTIPLE_DRAFTS test uses. Distinct name/slug/app_name avoid the uniqueness constraints.
        for (const sfx of ['md1', 'md2']) {
          await depDs.query(
            `INSERT INTO app_versions (
               name, definition, global_settings, page_settings, show_viewer_navigation,
               version_type, app_id, current_environment_id, status, is_stub, is_synced,
               branch_id, slug, app_name, icon, is_public
             )
             SELECT
               name || '-' || $2, definition, global_settings, page_settings, show_viewer_navigation,
               'version', app_id, current_environment_id, 'DRAFT', false, false,
               $3, COALESCE(slug, '') || '-' || $2, 'multidraft-module-' || $2, icon, is_public
             FROM app_versions WHERE app_id = $1 LIMIT 1`,
            [moduleAppId, sfx, mainBranchId]
          );
        }
        const modDraftCount: number = (
          await depDs.query(
            `SELECT COUNT(*)::int AS c FROM app_versions
               WHERE app_id = $1 AND branch_id = $2 AND status = 'DRAFT' AND is_stub = false`,
            [moduleAppId, mainBranchId]
          )
        )[0].c;
        expect(modDraftCount).toBeGreaterThan(1);

        step(4, 'create a host app that references the module via a ModuleViewer');
        const hostAppId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'home', name: 'multidraft-host', type: 'front-end', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const hostVersionId = await editingVersionId(hostAppId, featBranchId);
        const hostDetail = await auth(agent().get(`/api/apps/${hostAppId}`))
          .query({ branch_id: featBranchId })
          .expect(200);
        const hostEv =
          hostDetail.body?.editing_version || hostDetail.body?.editingVersion || hostDetail.body?.app?.editing_version;
        const hostPageId: string =
          hostEv.home_page_id || hostEv.homePageId || hostEv.pages?.[0]?.id || hostDetail.body?.pages?.[0]?.id;
        expect(hostPageId).toBeDefined();

        const moduleViewerId = randomUUID();
        const mvResp = await auth(agent().post(`/api/v2/apps/${hostAppId}/versions/${hostVersionId}/components`))
          .query({ branch_id: featBranchId })
          .send({
            is_user_switched_version: false,
            pageId: hostPageId,
            diff: {
              [moduleViewerId]: {
                name: 'mv_multidraft',
                layouts: {
                  desktop: { top: 70, left: 5, width: 38, height: 400 },
                  mobile: { top: 70, left: 5, width: 38, height: 400 },
                },
                type: 'ModuleViewer',
                general: {},
                generalStyles: { boxShadow: { value: '0px 0px 0px 0px #00000040' } },
                others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
                properties: {
                  moduleAppId: { value: moduleCoRel },
                  moduleVersionId: { value: '' },
                  visibility: { value: true },
                },
                styles: { backgroundColor: { value: '#fff' }, padding: { value: 'default' } },
                parent: null,
              },
            },
          });
        if (mvResp.status !== 201) {
          throw new Error(`POST host components failed: ${mvResp.status} ${JSON.stringify(mvResp.body)}`);
        }

        step(5, 'push the host app → blocked because the connected module has multiple drafts');
        // The push carries the connected module, bootstrapping it from its (multiple) default-branch
        // drafts — an ambiguous state. The server guard blocks it with a 400. AllExceptionsFilter
        // forwards only `message` (errorType/affectedResources are dropped there — same as the app's
        // own MULTIPLE_DRAFTS push), so the offending module names ride in the message; assert that.
        const pushResp = await gitpushApp(hostAppId, hostVersionId, 'multidraft-host', FEAT, featBranchId);
        expect(pushResp.status).toBe(400);
        expect(pushResp.body.message).toMatch(/not ready to sync/i);
        expect(pushResp.body.message).toContain('multidraft-module');
      }, 300000);

      // Counterpart to the module case above, for the APP's own drafts: git allows exactly one
      // draft (the tip of the default branch), so a push of an app carrying multiple non-stub
      // drafts on the pushed branch is rejected with the app-level MULTIPLE_DRAFTS guard
      // (AppGitService.gitPushApp). validate-push already covers the pre-flight advisory (step 72);
      // this exercises the server-side push guard itself, which nothing else does.
      it('blocks an app push when the app itself has multiple drafts → 400', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const FEAT = 'feat-app-multidraft';

        step(1, 'enable git + branching, create feature branch');
        const { featBranchId } = await enableGitAndFeatureBranch(FEAT);

        step(2, 'create an app on the feature branch (one draft)');
        const appId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'home', name: 'app-multidraft', type: 'front-end', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const versionId = await editingVersionId(appId, featBranchId);

        step(3, 'inject a second non-stub draft on the same branch — the state the push must reject');
        // Copy the pushed version row into a second non-stub DRAFT on the same branch. version_type
        // is forced to 'version' so the branch-scoped partial unique indexes (WHERE version_type=
        // 'branch') don't apply — only (name, branch_id) / (app_name, branch_id, type) uniqueness
        // does, hence the '-copy' suffixes. The push guard counts drafts by branch_id + status,
        // regardless of version_type, so this lands as a second draft on the pushed branch.
        await depDs.query(
          `INSERT INTO app_versions (
             name, definition, global_settings, page_settings, show_viewer_navigation,
             version_type, app_id, current_environment_id, status, is_stub, is_synced,
             branch_id, slug, app_name, icon, is_public
           )
           SELECT
             name || '-copy', definition, global_settings, page_settings, show_viewer_navigation,
             'version', app_id, current_environment_id, 'DRAFT', false, false,
             branch_id, COALESCE(slug, '') || '-copy', COALESCE(app_name, 'app-multidraft') || '-copy', icon, is_public
           FROM app_versions WHERE id = $1`,
          [versionId]
        );
        const appDraftCount: number = (
          await depDs.query(
            `SELECT COUNT(*)::int AS c FROM app_versions
               WHERE app_id = $1 AND branch_id = $2 AND status = 'DRAFT' AND is_stub = false`,
            [appId, featBranchId]
          )
        )[0].c;
        expect(appDraftCount).toBeGreaterThan(1);

        step(4, 'push the app → blocked by the app-level multiple-drafts guard');
        // AllExceptionsFilter forwards only `message`, so assert on it (same as the module case).
        const pushResp = await gitpushApp(appId, versionId, 'app-multidraft', FEAT, featBranchId);
        expect(pushResp.status).toBe(400);
        expect(pushResp.body.message).toMatch(/multiple drafts/i);
      }, 300000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Slug-update branch rules under git sync (regression). Complements the git-off
    // slug matrix in apps/e2e/slug-update.e2e-spec.ts by covering the two git-enabled
    // gates in AppsService.update / AppsUtilService.update:
    //   - SINGLE branch: the default branch IS the working branch → slug edits allowed.
    //   - MULTI branch: slug edits on the default branch are blocked for synced apps
    //     (must be done on a feature branch); feature-branch edits are allowed and still
    //     subject to the instance-wide, per-apps.type, case-insensitive uniqueness rule.
    // No git push is involved in a slug rename, so these don't touch the protected `main`
    // branch on the simulator. Against the real Gitea (@group gitsync).
    // ────────────────────────────────────────────────────────────────────────────
    describe('slug update — git-sync branch rules (regression)', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;

      let sgOrgId: string;
      let sgCookie: string[];
      let sgDs: DataSource;

      const agent = () => request.agent(app.getHttpServer());
      const auth = (r: request.Test) => r.set('Cookie', sgCookie).set('tj-workspace-id', sgOrgId);

      const pull = (branchId: string) =>
        auth(agent().post('/api/workspace-branches/pull')).query({ branch_id: branchId }).send({ branchId });
      const branchIdByName = async (name: string, xBranchId: string): Promise<string> =>
        (
          await auth(agent().get('/api/workspace-branches')).set('x-branch-id', xBranchId).expect(200)
        ).body.branches.find((b: any) => b.name === name)?.id;

      // Configure git for this org and set the branching mode. Resets the repo so each test
      // starts clean. Returns the (default) main branch id.
      const configureGit = async (multiBranch: boolean): Promise<string> => {
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);
        const gitConfig = await auth(agent().get(`/api/git-sync/${sgOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        // Set branching explicitly (both directions) — the org is reused across tests.
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: multiBranch })
          .expect(200);
        const mainBranchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body
          .activeBranchId;
        await pull(mainBranchId).expect(201);
        return mainBranchId;
      };

      const createFeatureBranch = async (name: string, mainBranchId: string): Promise<string> => {
        await auth(agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({ name, sourceBranchId: mainBranchId })
          .expect(201);
        const featBranchId = await branchIdByName(name, mainBranchId);
        expect(featBranchId).toBeDefined();
        return featBranchId;
      };

      const createApp = async (name: string, branchId: string): Promise<string> =>
        (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: branchId })
            .send({ icon: 'home', name, type: 'front-end', branchId })
            .expect(201)
        ).body.id;

      const putSlug = (appId: string, slug: string, branchId: string) =>
        auth(agent().put(`/api/apps/${appId}`)).send({ app: { slug, branch_id: branchId } });

      const appVersionSlug = async (appId: string, branchId: string): Promise<string> =>
        (await sgDs.query(`SELECT slug FROM app_versions WHERE app_id = $1 AND branch_id = $2`, [appId, branchId]))[0]
          ?.slug;

      beforeAll(async () => {
        const { organization } = await createUser(app, {
          email: 'git-slug-rules-gl@tooljet.io',
          firstName: 'git',
          lastName: 'slugrules',
        });
        sgOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-slug-rules-gl@tooljet.io');
        sgCookie = tokenCookie;
        await ensureAppEnvironments(app, sgOrgId);
        sgDs = app.get<DataSource>(getDataSourceToken('default'));
        await sgDs.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [sgOrgId]
        );
      });

      it('single-branch: allows a slug edit on the default (working) branch', async () => {
        const mainBranchId = await configureGit(false);
        const appId = await createApp('sb-slug-app', mainBranchId);

        await putSlug(appId, 'sb-custom-slug', mainBranchId).expect(200);
        expect(await appVersionSlug(appId, mainBranchId)).toBe('sb-custom-slug');
      }, 300000);

      it('multi-branch: blocks a slug edit targeting the default branch', async () => {
        const mainBranchId = await configureGit(true);
        // Under multi-branching apps are created on a feature branch (creating on the
        // default branch is itself blocked). Editing metadata against the default branch
        // must then be rejected — it has to be done on the feature branch and merged.
        const featBranchId = await createFeatureBranch('feat-slug-block', mainBranchId);
        const appId = await createApp('mb-block-app', featBranchId);

        const res = await putSlug(appId, 'mb-block-slug', mainBranchId);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/feature branch/i);
      }, 300000);

      it('multi-branch: allows a slug edit on a feature branch and persists it', async () => {
        const mainBranchId = await configureGit(true);
        const featBranchId = await createFeatureBranch('feat-slug-edit', mainBranchId);
        const appId = await createApp('mb-feat-app', featBranchId);

        await putSlug(appId, 'mb-feat-slug', featBranchId).expect(200);
        expect(await appVersionSlug(appId, featBranchId)).toBe('mb-feat-slug');
      }, 300000);

      it('multi-branch: rejects a feature-branch slug already taken by another app of the same type', async () => {
        const mainBranchId = await configureGit(true);
        const featBranchId = await createFeatureBranch('feat-slug-dup', mainBranchId);

        const app1 = await createApp('mb-dup-holder', featBranchId);
        await putSlug(app1, 'mb-dup-slug', featBranchId).expect(200);

        const app2 = await createApp('mb-dup-taker', featBranchId);
        const res = await putSlug(app2, 'mb-dup-slug', featBranchId);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/already taken/i);
      }, 300000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Single-branch lifecycle: real push/pull of apps, modules, data sources.
    //
    // The shared Gitea only protects the branch named `main`, so single-branch pushes to a
    // default branch named `main` are blocked (see §2 note). Configuring git with a NON-`main`
    // default branch name (`single-branch-main`) sidesteps the protection — the simulator
    // auto-creates the branch on the test-connection branch check and accepts direct pushes to
    // it — letting us exercise a genuine single-branch push/pull lifecycle directly on the
    // (unprotected) default branch. Against the real Gitea (@group gitsync).
    // ────────────────────────────────────────────────────────────────────────────
    describe('single-branch lifecycle: push/pull apps, modules, data sources on the default branch', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;
      // Non-`main` → unprotected on the simulator → direct single-branch pushes are allowed.
      const SB_BRANCH = 'single-branch-main';

      let sbOrgId: string;
      let sbCookie: string[];
      let sbDs: DataSource;

      const agent = () => request.agent(app.getHttpServer());
      const auth = (r: request.Test) => r.set('Cookie', sbCookie).set('tj-workspace-id', sbOrgId);

      const pull = (branchId: string) =>
        auth(agent().post('/api/workspace-branches/pull')).query({ branch_id: branchId }).send({ branchId });
      const pushWorkspace = (branchId: string, commitMessage: string, scope?: string, onlyUnsynced?: boolean) =>
        auth(agent().post('/api/workspace-branches/push'))
          .query({ branch_id: branchId })
          .send({
            commitMessage,
            branchId,
            ...(scope && { scope }),
            ...(onlyUnsynced && { onlyUnsyncedDatasources: true }),
          });
      const gitpush = (appId: string, versionId: string, gitAppName: string, branchId: string) =>
        auth(agent().post(`/api/app-git/gitpush/${appId}/${versionId}`))
          .query({ branch_id: branchId })
          .send({
            gitAppName,
            versionId,
            lastCommitMessage: `push ${gitAppName}`,
            gitVersionName: SB_BRANCH,
            sourceBranch: SB_BRANCH,
          });
      const editingVersionOf = async (appId: string, branchId: string) => {
        const d = await auth(agent().get(`/api/apps/${appId}`))
          .query({ branch_id: branchId })
          .expect(200);
        const ev = d.body?.editing_version || d.body?.editingVersion || d.body?.app?.editing_version;
        const pageId = ev.home_page_id || ev.homePageId || ev.pages?.[0]?.id || d.body?.pages?.[0]?.id;
        return { versionId: ev.id as string, pageId: pageId as string };
      };
      const dsvName = async (dsId: string, branchId: string): Promise<string> =>
        (
          await sbDs.query(`SELECT name FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`, [
            dsId,
            branchId,
          ])
        )[0]?.name;
      const dsvSynced = async (dsId: string, branchId: string): Promise<boolean> =>
        (
          await sbDs.query(`SELECT is_synced FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`, [
            dsId,
            branchId,
          ])
        )[0]?.is_synced;
      const dsOptions = (url: string) => [
        { key: 'url', value: url },
        { key: 'auth_type', value: 'none' },
        { key: 'headers', value: [['', '']] },
        { key: 'ssl_certificate', value: 'none', encrypted: false },
      ];

      // Clone a branch once and inspect its tree: file existence + "directory has any file".
      const inspectBranch = async (branch: string) => {
        const simpleGit = (await import('simple-git')).default;
        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');
        const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tj-sb-'));
        const git = simpleGit({
          baseDir: tmpDir,
          timeout: { block: 30000 },
          unsafe: { allowUnsafeCredentialHelper: true },
        });
        await git.clone(`${GIT_BASE_URL}/${GIT_REPO_PATH}.git`, '.', [
          '--branch',
          branch,
          '--depth',
          '1',
          '--single-branch',
        ]);
        const hasFile = (rel: string) => fs.existsSync(path.join(tmpDir, rel));
        const dirHasFiles = (sub: string) => {
          const root = path.join(tmpDir, sub);
          if (!fs.existsSync(root)) return false;
          let found = false;
          const walk = (d: string) => {
            for (const e of fs.readdirSync(d, { withFileTypes: true })) {
              const full = path.join(d, e.name);
              if (e.isDirectory()) walk(full);
              else found = true;
            }
          };
          walk(root);
          return found;
        };
        const cleanup = () => fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        return { hasFile, dirHasFiles, cleanup };
      };

      beforeAll(async () => {
        const { organization } = await createUser(app, {
          email: 'git-single-branch.gl@tooljet.io',
          firstName: 'git',
          lastName: 'singlebranch',
        });
        sbOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-single-branch.gl@tooljet.io');
        sbCookie = tokenCookie;
        await ensureAppEnvironments(app, sbOrgId);
        sbDs = app.get<DataSource>(getDataSourceToken('default'));
        await sbDs.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, $2, true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [sbOrgId, SB_BRANCH]
        );
      });

      it('pushes and pulls apps, modules, and data sources directly on the (unprotected) single-branch default', async () => {
        const { randomUUID } = await import('crypto');
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);

        // ── 1. configure git with a non-main default branch, single-branch mode ──────────
        step(1, 'reset gitea, configure git with default branch single-branch-main, disable branching');
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, branchName: SB_BRANCH, useEnvConfig: false })
          .expect(201);
        const gitConfig = await auth(agent().get(`/api/git-sync/${sbOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: false })
          .expect(200);
        const defaultBranchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body
          .activeBranchId;
        await pull(defaultBranchId).expect(201);

        // ── 2. create app (+component) + module + data source on the default branch ──────
        step(2, 'create app + module + data source on the default branch');
        const appId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: defaultBranchId })
            .send({ icon: 'home', name: 'sb-app', type: 'front-end', branchId: defaultBranchId })
            .expect(201)
        ).body.id;
        const appCtx = await editingVersionOf(appId, defaultBranchId);
        const btnId = randomUUID();
        await auth(agent().post(`/api/v2/apps/${appId}/versions/${appCtx.versionId}/components`))
          .query({ branch_id: defaultBranchId })
          .send({
            is_user_switched_version: false,
            pageId: appCtx.pageId,
            diff: {
              [btnId]: {
                name: `button_${btnId.slice(0, 6)}`,
                layouts: {
                  desktop: { top: 80, left: 15, width: 4, height: 40 },
                  mobile: { top: 80, left: 15, width: 4, height: 40 },
                },
                type: 'Button',
                general: {},
                generalStyles: {},
                others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
                properties: { text: { value: 'Button' } },
                styles: {},
              },
            },
          })
          .expect(201);
        const moduleId: string = (
          await auth(agent().post('/api/modules'))
            .query({ branch_id: defaultBranchId })
            .send({ icon: 'folderupload', name: 'sb-module', type: 'module', branchId: defaultBranchId })
            .expect(201)
        ).body.id;
        const moduleCtx = await editingVersionOf(moduleId, defaultBranchId);
        const dsId: string = (
          await auth(agent().post(`/api/data-sources?branch_id=${defaultBranchId}`))
            .send({ name: 'sb-ds', kind: 'restapi', options: dsOptions('http://sb-ds.example.com'), scope: 'global' })
            .expect(201)
        ).body.id;
        const dsName = await dsvName(dsId, defaultBranchId);
        const dsPath = `data-sources/${dsName}/data-source.json`;

        // ── 3. push all three DIRECTLY to the unprotected default branch ─────────────────
        step(3, 'gitpush app + module, workspace-push the data source (all to the default branch)');
        await gitpush(appId, appCtx.versionId, 'sb-app', defaultBranchId).expect(201);
        await gitpush(moduleId, moduleCtx.versionId, 'sb-module', defaultBranchId).expect(201);
        // A newly-created DS is is_synced=false (unsynced on create in every mode). The no-flag
        // scope='datasource' push serializes EVERY active DSV on the branch (not just the unsynced
        // set), so it commits this DS — mirrors the delete push below.
        await pushWorkspace(defaultBranchId, 'push sb data source', 'datasource').expect(201);

        // ── 4. assert all three resources landed in git on the default branch ────────────
        step(4, 'clone the default branch → apps/, modules/, and the DS file are present');
        const afterPush = await inspectBranch(SB_BRANCH);
        try {
          expect(afterPush.dirHasFiles('apps')).toBe(true);
          expect(afterPush.dirHasFiles('modules')).toBe(true);
          expect(afterPush.hasFile(dsPath)).toBe(true);
        } finally {
          await afterPush.cleanup();
        }

        // ── 5. pull the default branch → round-trips cleanly, DS stays synced ────────────
        step(5, 'pull the default branch (round-trip); the data source is is_synced=true');
        await pull(defaultBranchId).expect(201);
        expect(await dsvSynced(dsId, defaultBranchId)).toBe(true);

        // ── 6. delete the data source (single-branch default → hard-delete DSV) + push ───
        step(6, 'delete the data source, then push → its file is removed from git');
        await auth(agent().delete(`/api/data-sources/${dsId}`).query({ branch_id: defaultBranchId }));
        await pushWorkspace(defaultBranchId, 'remove sb data source', 'datasource').expect(201);
        const afterDelete = await inspectBranch(SB_BRANCH);
        try {
          expect(afterDelete.hasFile(dsPath)).toBe(false);
          expect(afterDelete.dirHasFiles('apps')).toBe(true);
          expect(afterDelete.dirHasFiles('modules')).toBe(true);
        } finally {
          await afterDelete.cleanup();
        }
      }, 300000);
    });

    // GitLab mirror of git-sync.spec.ts "per-app import from git (createGitApp)". SRC workspace
    // pushes an app to the single-branch default; a separate DST workspace pointed at the same
    // GitLab repo imports it via POST /api/app-git/gitpull/app. Exercises the GitLab provider's
    // createGitApp path. Against the real Gitea (@group gitsync).
    describe('per-app import from git (createGitApp)', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;
      const IMP_BRANCH = 'single-branch-main';

      let srcOrgId: string;
      let srcCookie: string[];
      let dstOrgId: string;
      let dstCookie: string[];
      let impDs: DataSource;

      const agent = () => request.agent(app.getHttpServer());
      const authAs = (cookie: string[], org: string) => (r: request.Test) =>
        r.set('Cookie', cookie).set('tj-workspace-id', org);

      const editingVersionOf = async (auth: (r: request.Test) => request.Test, appId: string, branchId: string) => {
        const d = await auth(agent().get(`/api/apps/${appId}`))
          .query({ branch_id: branchId })
          .expect(200);
        const ev = d.body?.editing_version || d.body?.editingVersion || d.body?.app?.editing_version;
        const pageId = ev.home_page_id || ev.homePageId || ev.pages?.[0]?.id || d.body?.pages?.[0]?.id;
        return { versionId: ev.id as string, pageId: pageId as string };
      };

      const seedDefaultBranch = async (org: string) =>
        impDs.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, $2, true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [org, IMP_BRANCH]
        );

      beforeAll(async () => {
        const src = await createUser(app, { email: 'gl-import-src@tooljet.io', firstName: 'imp', lastName: 'src' });
        srcOrgId = src.organization.id;
        srcCookie = (await login(app, 'gl-import-src@tooljet.io')).tokenCookie;
        await ensureAppEnvironments(app, srcOrgId);

        const dst = await createUser(app, { email: 'gl-import-dst@tooljet.io', firstName: 'imp', lastName: 'dst' });
        dstOrgId = dst.organization.id;
        dstCookie = (await login(app, 'gl-import-dst@tooljet.io')).tokenCookie;
        await ensureAppEnvironments(app, dstOrgId);

        impDs = app.get<DataSource>(getDataSourceToken('default'));
        await seedDefaultBranch(srcOrgId);
        await seedDefaultBranch(dstOrgId);
      });

      it('imports an app pushed to git into a separate workspace via /app-git/gitpull/app', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const { randomUUID } = await import('crypto');
        const authSrc = authAs(srcCookie, srcOrgId);
        const authDst = authAs(dstCookie, dstOrgId);

        const configureGit = (auth: (r: request.Test) => request.Test, org: string) =>
          (async () => {
            await auth(agent().post('/api/git-sync/configs'))
              .send({ ...GITLAB_PAYLOAD, branchName: IMP_BRANCH, useEnvConfig: false })
              .expect(201);
            const cfg = await auth(agent().get(`/api/git-sync/${org}`)).expect(200);
            const orgGitId: string = cfg.body.organization_git.id;
            await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
              .send({ isBranchingEnabled: false })
              .expect(200);
            return (await auth(agent().get('/api/workspace-branches')).expect(200)).body.activeBranchId as string;
          })();

        step(1, 'reset gitea; SRC workspace configures git + pushes an app');
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        const srcBranchId = await configureGit(authSrc, srcOrgId);
        await authSrc(agent().post('/api/workspace-branches/pull'))
          .query({ branch_id: srcBranchId })
          .send({ branchId: srcBranchId })
          .expect(201);

        const appId: string = (
          await authSrc(agent().post('/api/apps'))
            .query({ branch_id: srcBranchId })
            .send({ icon: 'home', name: 'importable-app', type: 'front-end', branchId: srcBranchId })
            .expect(201)
        ).body.id;
        const appCtx = await editingVersionOf(authSrc, appId, srcBranchId);
        const btnId = randomUUID();
        await authSrc(agent().post(`/api/v2/apps/${appId}/versions/${appCtx.versionId}/components`))
          .query({ branch_id: srcBranchId })
          .send({
            is_user_switched_version: false,
            pageId: appCtx.pageId,
            diff: {
              [btnId]: {
                name: `button_${btnId.slice(0, 6)}`,
                layouts: {
                  desktop: { top: 80, left: 15, width: 4, height: 40 },
                  mobile: { top: 80, left: 15, width: 4, height: 40 },
                },
                type: 'Button',
                general: {},
                generalStyles: {},
                others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
                properties: { text: { value: 'Button' } },
                styles: {},
              },
            },
          })
          .expect(201);
        await authSrc(agent().post(`/api/app-git/gitpush/${appId}/${appCtx.versionId}`))
          .query({ branch_id: srcBranchId })
          .send({
            gitAppName: 'importable-app',
            versionId: appCtx.versionId,
            lastCommitMessage: 'push importable-app',
            gitVersionName: IMP_BRANCH,
            sourceBranch: IMP_BRANCH,
          })
          .expect(201);

        step(2, 'DST workspace configures git (same repo) and imports the app');
        const dstBranchId = await configureGit(authDst, dstOrgId);

        step(3, 'POST /api/app-git/gitpull/app → createGitApp creates the app in DST');
        const importRes = await authDst(agent().post('/api/app-git/gitpull/app')).send({
          gitAppName: 'importable-app',
          gitBranchName: IMP_BRANCH,
          workspaceBranchId: dstBranchId,
        });
        if (importRes.status !== 201 && importRes.status !== 200) {
          throw new Error(`createGitApp import failed: ${importRes.status} ${JSON.stringify(importRes.body)}`);
        }

        step(4, 'the imported app exists in the DST workspace');
        const importedApps = await impDs.query(`SELECT id, organization_id FROM apps WHERE organization_id = $1`, [
          dstOrgId,
        ]);
        expect(importedApps.length).toBeGreaterThan(0);
        expect(importedApps[0].organization_id).toBe(dstOrgId);
        const versions = await impDs.query(
          `SELECT av.id FROM app_versions av WHERE av.app_id = $1 AND av.is_stub = false`,
          [importedApps[0].id]
        );
        expect(versions.length).toBeGreaterThan(0);
      }, 300000);

      it('imports a published tag version into a separate workspace (createGitApp tag path)', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const { randomUUID } = await import('crypto');
        const authSrc = authAs(srcCookie, srcOrgId);
        const authDst = authAs(dstCookie, dstOrgId);

        const configureGit = (auth: (r: request.Test) => request.Test, org: string) =>
          (async () => {
            await auth(agent().post('/api/git-sync/configs'))
              .send({ ...GITLAB_PAYLOAD, branchName: IMP_BRANCH, useEnvConfig: false })
              .expect(201);
            const cfg = await auth(agent().get(`/api/git-sync/${org}`)).expect(200);
            const orgGitId: string = cfg.body.organization_git.id;
            await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
              .send({ isBranchingEnabled: false })
              .expect(200);
            return (await auth(agent().get('/api/workspace-branches')).expect(200)).body.activeBranchId as string;
          })();

        const resolveTagSha = async (tagName: string): Promise<string> => {
          const simpleGit = (await import('simple-git')).default;
          const fs = await import('fs');
          const path = await import('path');
          const os = await import('os');
          const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tj-gl-tag-'));
          try {
            const git = simpleGit({
              baseDir: tmpDir,
              timeout: { block: 30000 },
              unsafe: { allowUnsafeCredentialHelper: true },
            });
            await git.clone(`${GIT_BASE_URL}/${GIT_REPO_PATH}.git`, '.', ['--branch', IMP_BRANCH, '--single-branch']);
            await git.raw(['fetch', 'origin', 'refs/tags/*:refs/tags/*']);
            return (await git.raw(['rev-parse', `refs/tags/${tagName}^{commit}`])).trim();
          } finally {
            await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
          }
        };

        step(1, 'reset gitea; SRC pushes an app, publishes v1, and tags it');
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        const srcBranchId = await configureGit(authSrc, srcOrgId);
        await authSrc(agent().post('/api/workspace-branches/pull'))
          .query({ branch_id: srcBranchId })
          .send({ branchId: srcBranchId })
          .expect(201);

        const appId: string = (
          await authSrc(agent().post('/api/apps'))
            .query({ branch_id: srcBranchId })
            .send({ icon: 'home', name: 'tag-app', type: 'front-end', branchId: srcBranchId })
            .expect(201)
        ).body.id;
        const appCtx = await editingVersionOf(authSrc, appId, srcBranchId);
        const btnId = randomUUID();
        await authSrc(agent().post(`/api/v2/apps/${appId}/versions/${appCtx.versionId}/components`))
          .query({ branch_id: srcBranchId })
          .send({
            is_user_switched_version: false,
            pageId: appCtx.pageId,
            diff: {
              [btnId]: {
                name: `button_${btnId.slice(0, 6)}`,
                layouts: {
                  desktop: { top: 80, left: 15, width: 4, height: 40 },
                  mobile: { top: 80, left: 15, width: 4, height: 40 },
                },
                type: 'Button',
                general: {},
                generalStyles: {},
                others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
                properties: { text: { value: 'Button' } },
                styles: {},
              },
            },
          })
          .expect(201);
        await authSrc(agent().post(`/api/app-git/gitpush/${appId}/${appCtx.versionId}`))
          .query({ branch_id: srcBranchId })
          .send({
            gitAppName: 'tag-app',
            versionId: appCtx.versionId,
            lastCommitMessage: 'push tag-app',
            gitVersionName: IMP_BRANCH,
            sourceBranch: IMP_BRANCH,
          })
          .expect(201);

        // publish v1 — the save auto-creates the git tag <co_relation_id>/v1 server-side.
        await authSrc(agent().put(`/api/app-git/${appId}/versions/${appCtx.versionId}`))
          .query({ branch_id: srcBranchId })
          .send({ is_user_switched_version: false, name: 'v1', description: 'v1', status: 'PUBLISHED' })
          .expect(200);

        const srcCoRel: string = (await impDs.query(`SELECT co_relation_id FROM apps WHERE id = $1`, [appId]))[0]
          .co_relation_id;
        const tagSha = await resolveTagSha(`${srcCoRel}/v1`);
        expect(tagSha).toMatch(/^[0-9a-f]{40}$/);

        step(2, 'DST imports the tagged version via /app-git/gitpull/app');
        const dstBranchId = await configureGit(authDst, dstOrgId);
        const dstAppIdsBefore: string[] = (
          await impDs.query(`SELECT id FROM apps WHERE organization_id = $1`, [dstOrgId])
        ).map((r: any) => r.id);

        const importRes = await authDst(agent().post('/api/app-git/gitpull/app')).send({
          gitAppId: srcCoRel,
          gitAppName: 'tag-app',
          gitVersionName: 'v1',
          commitHash: tagSha,
          gitBranchName: IMP_BRANCH,
          workspaceBranchId: dstBranchId,
        });
        if (importRes.status !== 201 && importRes.status !== 200) {
          throw new Error(`tag import failed: ${importRes.status} ${JSON.stringify(importRes.body)}`);
        }

        step(3, 'DST gained a new app carrying a published (tag) version');
        const dstAppsAfter = await impDs.query(`SELECT id FROM apps WHERE organization_id = $1`, [dstOrgId]);
        const newAppIds = dstAppsAfter.map((r: any) => r.id).filter((id: string) => !dstAppIdsBefore.includes(id));
        expect(newAppIds.length).toBeGreaterThan(0);
        const published = await impDs.query(`SELECT id FROM app_versions WHERE app_id = ANY($1) AND is_stub = false`, [
          newAppIds,
        ]);
        expect(published.length).toBeGreaterThan(0);
      }, 300000);

      // Per-app import (createGitApp) has NO slug pre-flight (unlike workspace pull, §6). But slug
      // uniqueness is instance-wide, so SRC — a different workspace on the SAME repo — already owns
      // the git app's slug on its default branch. Importing into DST must therefore SWAP the slug to
      // a fresh UUID placeholder and STILL SUCCEED (no 409/500), leaving the user to rename later.
      it('imports an app whose slug is already taken by another workspace → slug swapped to a fresh UUID (no conflict)', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const { randomUUID } = await import('crypto');
        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        // Fresh, isolated SRC/DST orgs so the imports in the two tests above don't pollute this one.
        const src = await createUser(app, { email: 'gl-slug-src@tooljet.io', firstName: 'slug', lastName: 'src' });
        const dst = await createUser(app, { email: 'gl-slug-dst@tooljet.io', firstName: 'slug', lastName: 'dst' });
        const srcOrg = src.organization.id;
        const dstOrg = dst.organization.id;
        const srcCk = (await login(app, 'gl-slug-src@tooljet.io')).tokenCookie;
        const dstCk = (await login(app, 'gl-slug-dst@tooljet.io')).tokenCookie;
        await ensureAppEnvironments(app, srcOrg);
        await ensureAppEnvironments(app, dstOrg);
        await seedDefaultBranch(srcOrg);
        await seedDefaultBranch(dstOrg);
        const authSrc = authAs(srcCk, srcOrg);
        const authDst = authAs(dstCk, dstOrg);

        const configureGit = (a: (r: request.Test) => request.Test, org: string) =>
          (async () => {
            await a(agent().post('/api/git-sync/configs'))
              .send({ ...GITLAB_PAYLOAD, branchName: IMP_BRANCH, useEnvConfig: false })
              .expect(201);
            const orgGitId: string = (await a(agent().get(`/api/git-sync/${org}`)).expect(200)).body.organization_git
              .id;
            await a(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
              .send({ isBranchingEnabled: false })
              .expect(200);
            return (await a(agent().get('/api/workspace-branches')).expect(200)).body.activeBranchId as string;
          })();

        // ── 1. SRC configures git + pushes an app to the (unprotected) single-branch default ──
        step(1, 'reset gitea; SRC pushes an app (its slug lands in git)');
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        const srcBranchId = await configureGit(authSrc, srcOrg);
        await authSrc(agent().post('/api/workspace-branches/pull'))
          .query({ branch_id: srcBranchId })
          .send({ branchId: srcBranchId })
          .expect(201);
        const srcAppId: string = (
          await authSrc(agent().post('/api/apps'))
            .query({ branch_id: srcBranchId })
            .send({ icon: 'home', name: 'slug-clash-app', type: 'front-end', branchId: srcBranchId })
            .expect(201)
        ).body.id;
        const srcCtx = await editingVersionOf(authSrc, srcAppId, srcBranchId);
        const btnId = randomUUID();
        await authSrc(agent().post(`/api/v2/apps/${srcAppId}/versions/${srcCtx.versionId}/components`))
          .query({ branch_id: srcBranchId })
          .send({
            is_user_switched_version: false,
            pageId: srcCtx.pageId,
            diff: {
              [btnId]: {
                name: `button_${btnId.slice(0, 6)}`,
                layouts: {
                  desktop: { top: 80, left: 15, width: 4, height: 40 },
                  mobile: { top: 80, left: 15, width: 4, height: 40 },
                },
                type: 'Button',
                general: {},
                generalStyles: {},
                others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
                properties: { text: { value: 'Button' } },
                styles: {},
              },
            },
          })
          .expect(201);
        await authSrc(agent().post(`/api/app-git/gitpush/${srcAppId}/${srcCtx.versionId}`))
          .query({ branch_id: srcBranchId })
          .send({
            gitAppName: 'slug-clash-app',
            versionId: srcCtx.versionId,
            lastCommitMessage: 'push slug-clash-app',
            gitVersionName: IMP_BRANCH,
            sourceBranch: IMP_BRANCH,
          })
          .expect(201);

        // The slug SRC wrote to git — the value DST's import would otherwise collide on.
        const [{ slug: srcSlug }] = await impDs.query(
          `SELECT slug FROM app_versions WHERE app_id = $1 AND is_stub = false LIMIT 1`,
          [srcAppId]
        );
        expect(srcSlug).toBeTruthy();

        // ── 2. DST (separate workspace, SAME repo) imports the app by name — no gitAppId, so
        //       createGitApp's "already exists" guard is skipped and the import runs ──
        step(2, 'DST configures git (same repo) and imports the app via /gitpull/app');
        const dstBranchId = await configureGit(authDst, dstOrg);
        const importRes = await authDst(agent().post('/api/app-git/gitpull/app')).send({
          gitAppName: 'slug-clash-app',
          gitBranchName: IMP_BRANCH,
          workspaceBranchId: dstBranchId,
        });
        // The crux: a taken slug must NOT fail the per-app import — it swaps to a UUID and succeeds.
        if (importRes.status !== 201 && importRes.status !== 200) {
          throw new Error(
            `slug-collision import should succeed, got ${importRes.status} ${JSON.stringify(importRes.body)}`
          );
        }

        // ── 3. DST's imported version carries a fresh UUID slug — NOT SRC's (taken) slug ──
        step(3, 'imported version slug is a fresh UUID, not the taken git slug');
        const imported = (
          await impDs.query(
            `SELECT av.slug AS slug
             FROM apps a JOIN app_versions av ON av.app_id = a.id AND av.is_stub = false
             WHERE a.organization_id = $1`,
            [dstOrg]
          )
        )[0];
        expect(imported).toBeDefined();
        expect(imported.slug).not.toBe(srcSlug); // swapped away from the taken slug
        expect(imported.slug).toMatch(UUID_RE); // to a fresh UUID placeholder
      }, 300000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Branch create — slug conflict pre-check (GitLab mirror). createBranch runs a SYNCHRONOUS
    // pre-check (preCheckCreateBranchConflicts → detectPullConflicts with branchId=null →
    // intra-incoming collisions) and re-throws a 409. Two apps on the source branch that share a
    // slug (different co_relation_ids) must surface a 409 with a `slug` conflict group — the same
    // slug guard the workspace pull enforces (§6), through the branch-create entry point.
    // ────────────────────────────────────────────────────────────────────────────
    describe('branch create — slug conflict pre-check', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;
      const FILES_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/files`;
      const BR = 'main';
      const agent = () => request.agent(app.getHttpServer());

      let bcOrgId: string;
      let bcCookie: string[];
      let bcDs: DataSource;

      const auth = (r: request.Test) => r.set('Cookie', bcCookie).set('tj-workspace-id', bcOrgId);

      // Write a single file onto `main` via the admin /files endpoint (same mechanism as §55-59).
      const writeGitFile = async (repoRelPath: string, content: any, message: string): Promise<void> => {
        const resp = await fetch(FILES_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: JSON.stringify({ ref: BR, path: repoRelPath, content: JSON.stringify(content, null, 2), message }),
        });
        if (!resp.ok)
          throw new Error(`writeGitFile(${repoRelPath}) ${resp.status} ${await resp.text().catch(() => '')}`);
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

      beforeAll(async () => {
        const u = await createUser(app, { email: 'gl-branch-slug@tooljet.io', firstName: 'branch', lastName: 'slug' });
        bcOrgId = u.organization.id;
        bcCookie = (await login(app, 'gl-branch-slug@tooljet.io')).tokenCookie;
        await ensureAppEnvironments(app, bcOrgId);
        bcDs = app.get<DataSource>(getDataSourceToken('default'));
        await bcDs.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, $2, true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [bcOrgId, BR]
        );
      });

      it('surfaces a 409 slug conflict when the source branch has two apps sharing a slug', async () => {
        const { randomUUID } = await import('crypto');

        // reset + configure git (multi-branch so createBranch is a normal op). Configuring first
        // makes `main` exist on the remote (auto-created on the test-connection existence check),
        // so the /files writes below land on it.
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, branchName: BR, useEnvConfig: false })
          .expect(201);
        const orgGitId: string = (await auth(agent().get(`/api/git-sync/${bcOrgId}`)).expect(200)).body.organization_git
          .id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: true })
          .expect(200);

        // Inject two apps onto `main`: DIFFERENT names + co_relation_ids, SAME slug → a pure slug
        // collision (different names avoid a name conflict masking it).
        const sharedSlug = `branch-shared-slug-${randomUUID().slice(0, 8)}`;
        const coA = randomUUID();
        const coB = randomUUID();
        const pathA = 'apps/e2e-bc-a/branch-slug-a/app/app.json';
        const pathB = 'apps/e2e-bc-b/branch-slug-b/app/app.json';
        await writeGitFile(
          pathA,
          { id: coA, name: 'branch-slug-a', type: 'front-end', slug: sharedSlug, updatedAt: new Date().toISOString() },
          'inject branch-slug-a'
        );
        await writeGitFile(
          pathB,
          { id: coB, name: 'branch-slug-b', type: 'front-end', slug: sharedSlug, updatedAt: new Date().toISOString() },
          'inject branch-slug-b'
        );

        try {
          // Create a branch off `main` → the sync pre-check clones `main`, sees two apps sharing a
          // slug, and re-throws a 409 with the conflict groups.
          const resp = await auth(agent().post('/api/workspace-branches'))
            .send({ name: `feat-branch-slug-${randomUUID().slice(0, 6)}` })
            .expect(409);
          const groups = parseConflictGroups(resp.body);
          expect(groups).not.toBeNull();
          const slugGroup = groups!.find((g: any) => g.type === 'app' && g.conflictField === 'slug');
          expect(slugGroup).toBeDefined();
          const ids = slugGroup.conflicts.map((c: any) => c.coRelationId);
          expect(ids).toEqual(expect.arrayContaining([coA, coB]));
        } finally {
          // Neutralize the injected files so the shared repo is left clean for later specs.
          await writeGitFile(pathA, {}, 'restore: neutralize branch-slug-a');
          await writeGitFile(pathB, {}, 'restore: neutralize branch-slug-b');
        }
      }, 300000);
    });

    // GitLab mirror of git-sync.spec.ts "saving a version creates a git tag" — single-branch,
    // multi-branch, and git-off. Exercises the GitLab provider's createGitTag / checkTagExists.
    // Against the real Gitea (@group gitsync).
    describe('saving a version creates a git tag', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;
      const MERGE_URL = `${GIT_BASE_URL}/admin/merge`;
      const TAG_BRANCH = 'single-branch-main';
      const UUID_TAG_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/v1$/;

      let tagDs: DataSource;
      const agent = () => request.agent(app.getHttpServer());

      const editingVersionOf = async (auth: (r: request.Test) => request.Test, appId: string, branchId?: string) => {
        let req = auth(agent().get(`/api/apps/${appId}`));
        if (branchId) req = req.query({ branch_id: branchId });
        const d = await req.expect(200);
        const ev = d.body?.editing_version || d.body?.editingVersion || d.body?.app?.editing_version;
        const pageId = ev.home_page_id || ev.homePageId || ev.pages?.[0]?.id || d.body?.pages?.[0]?.id;
        return { versionId: ev.id as string, pageId: pageId as string };
      };

      const resolveTagSha = async (tagName: string): Promise<string | null> => {
        const simpleGit = (await import('simple-git')).default;
        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');
        const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tj-gl-tagcreate-'));
        try {
          const git = simpleGit({
            baseDir: tmpDir,
            timeout: { block: 30000 },
            unsafe: { allowUnsafeCredentialHelper: true },
          });
          await git.clone(`${GIT_BASE_URL}/${GIT_REPO_PATH}.git`, '.', ['--branch', TAG_BRANCH, '--single-branch']);
          await git.raw(['fetch', 'origin', 'refs/tags/*:refs/tags/*']).catch(() => undefined);
          return (await git.raw(['rev-parse', `refs/tags/${tagName}^{commit}`]).catch(() => '')).trim() || null;
        } finally {
          await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        }
      };

      const addComponent = (
        auth: (r: request.Test) => request.Test,
        appId: string,
        versionId: string,
        pageId: string,
        branchId: string,
        btnId: string
      ) =>
        auth(agent().post(`/api/v2/apps/${appId}/versions/${versionId}/components`))
          .query({ branch_id: branchId })
          .send({
            is_user_switched_version: false,
            pageId,
            diff: {
              [btnId]: {
                name: `button_${btnId.slice(0, 6)}`,
                layouts: {
                  desktop: { top: 80, left: 15, width: 4, height: 40 },
                  mobile: { top: 80, left: 15, width: 4, height: 40 },
                },
                type: 'Button',
                general: {},
                generalStyles: {},
                others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
                properties: { text: { value: 'Button' } },
                styles: {},
              },
            },
          })
          .expect(201);

      beforeAll(() => {
        tagDs = app.get<DataSource>(getDataSourceToken('default'));
      });

      const setup = async (email: string) => {
        const { organization } = await createUser(app, { email, firstName: 'tag', lastName: 'gl' });
        const org = organization.id;
        const { tokenCookie } = await login(app, email);
        await ensureAppEnvironments(app, org);
        const auth = (r: request.Test) => r.set('Cookie', tokenCookie).set('tj-workspace-id', org);
        await tagDs.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, $2, true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [org, TAG_BRANCH]
        );
        return { org, auth };
      };

      const configureGit = async (auth: (r: request.Test) => request.Test, org: string, multiBranch: boolean) => {
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, branchName: TAG_BRANCH, useEnvConfig: false })
          .expect(201);
        const orgGitId: string = (await auth(agent().get(`/api/git-sync/${org}`)).expect(200)).body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: multiBranch })
          .expect(200);
        const defaultBranchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body
          .activeBranchId;
        await auth(agent().post('/api/workspace-branches/pull'))
          .query({ branch_id: defaultBranchId })
          .send({ branchId: defaultBranchId })
          .expect(201);
        return defaultBranchId;
      };

      const assertTag = async (
        auth: (r: request.Test) => request.Test,
        appId: string,
        versionId: string,
        branchId: string,
        coRel: string
      ) => {
        const preCheck = await auth(agent().get(`/api/app-git/${appId}/check-tag`))
          .query({ versionName: 'v1', branch_id: branchId })
          .expect(200);
        expect(preCheck.body.exists).toBe(false);
        expect(preCheck.body.tagName).toBe(`${coRel}/v1`);
        expect(preCheck.body.tagName).toMatch(UUID_TAG_RE);
        // Publishing auto-creates the git tag server-side (backend-owned tagging) — no separate call.
        await auth(agent().put(`/api/app-git/${appId}/versions/${versionId}`))
          .query({ branch_id: branchId })
          .send({ is_user_switched_version: false, name: 'v1', description: 'v1', status: 'PUBLISHED' })
          .expect(200);
        const postCheck = await auth(agent().get(`/api/app-git/${appId}/check-tag`))
          .query({ versionName: 'v1', branch_id: branchId })
          .expect(200);
        expect(postCheck.body.exists).toBe(true);
        expect(await resolveTagSha(`${coRel}/v1`)).toMatch(/^[0-9a-f]{40}$/);
      };

      it('single-branch: saving a version creates a properly-formatted tag on git', async () => {
        const { randomUUID } = await import('crypto');
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        const { org, auth } = await setup('gl-tag-single@tooljet.io');
        const defaultBranchId = await configureGit(auth, org, false);

        const appId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: defaultBranchId })
            .send({ icon: 'home', name: 'gl-tag-single', type: 'front-end', branchId: defaultBranchId })
            .expect(201)
        ).body.id;
        const ctx = await editingVersionOf(auth, appId, defaultBranchId);
        await addComponent(auth, appId, ctx.versionId, ctx.pageId, defaultBranchId, randomUUID());
        await auth(agent().post(`/api/app-git/gitpush/${appId}/${ctx.versionId}`))
          .query({ branch_id: defaultBranchId })
          .send({
            gitAppName: 'gl-tag-single',
            versionId: ctx.versionId,
            lastCommitMessage: 'push',
            gitVersionName: TAG_BRANCH,
            sourceBranch: TAG_BRANCH,
          })
          .expect(201);
        const coRel: string = (await tagDs.query(`SELECT co_relation_id FROM apps WHERE id = $1`, [appId]))[0]
          .co_relation_id;
        await assertTag(auth, appId, ctx.versionId, defaultBranchId, coRel);
      }, 300000);

      it('multi-branch: saving a version creates a properly-formatted tag on git', async () => {
        const { randomUUID } = await import('crypto');
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        const { org, auth } = await setup('gl-tag-multi@tooljet.io');
        const defaultBranchId = await configureGit(auth, org, true);

        // multi-branch: work on a feature branch, merge to default, then publish + tag on default
        await auth(agent().post('/api/workspace-branches'))
          .query({ branch_id: defaultBranchId })
          .send({ name: 'tag-feat', sourceBranchId: defaultBranchId })
          .expect(201);
        const featBranchId: string = (
          await auth(agent().get('/api/workspace-branches')).set('x-branch-id', defaultBranchId).expect(200)
        ).body.branches.find((b: any) => b.name === 'tag-feat')?.id;
        expect(featBranchId).toBeDefined();

        const appId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'home', name: 'gl-tag-multi', type: 'front-end', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const featCtx = await editingVersionOf(auth, appId, featBranchId);
        await addComponent(auth, appId, featCtx.versionId, featCtx.pageId, featBranchId, randomUUID());
        await auth(agent().post(`/api/app-git/gitpush/${appId}/${featCtx.versionId}`))
          .query({ branch_id: featBranchId })
          .send({
            gitAppName: 'gl-tag-multi',
            versionId: featCtx.versionId,
            lastCommitMessage: 'push feat',
            gitVersionName: 'tag-feat',
            sourceBranch: 'tag-feat',
          })
          .expect(201);

        const mergeResp = await fetch(MERGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: JSON.stringify({
            owner: GIT_REPO_OWNER,
            repo: GIT_REPO_NAME,
            source: 'tag-feat',
            target: TAG_BRANCH,
            message: 'land tag-feat',
          }),
        });
        expect(mergeResp.ok).toBe(true);
        await auth(agent().post('/api/workspace-branches/pull'))
          .query({ branch_id: defaultBranchId })
          .send({ branchId: defaultBranchId })
          .expect(201);

        await auth(agent().get(`/api/apps/${appId}`))
          .query({ branch_id: defaultBranchId })
          .expect(200);
        const defCtx = await editingVersionOf(auth, appId, defaultBranchId);
        const coRel: string = (await tagDs.query(`SELECT co_relation_id FROM apps WHERE id = $1`, [appId]))[0]
          .co_relation_id;
        await assertTag(auth, appId, defCtx.versionId, defaultBranchId, coRel);
      }, 300000);

      it('git off: saving a version does NOT create a git tag', async () => {
        const { organization } = await createUser(app, {
          email: 'gl-tag-gitoff@tooljet.io',
          firstName: 'tag',
          lastName: 'off',
        });
        const org = organization.id;
        const { tokenCookie } = await login(app, 'gl-tag-gitoff@tooljet.io');
        await ensureAppEnvironments(app, org);
        const auth = (r: request.Test) => r.set('Cookie', tokenCookie).set('tj-workspace-id', org);

        const appId: string = (
          await auth(agent().post('/api/apps'))
            .send({ icon: 'home', name: 'gl-tag-off', type: 'front-end' })
            .expect(201)
        ).body.id;
        const ctx = await editingVersionOf(auth, appId);
        await auth(agent().put(`/api/v2/apps/${appId}/versions/${ctx.versionId}`))
          .send({ is_user_switched_version: false, name: 'v1', description: 'v1', status: 'PUBLISHED' })
          .expect(200);
        // No git configured → the backend save flow creates no tag; is_synced staying false is the
        // observable proof that no tag/push side-effect occurred on save.
        const synced = (await tagDs.query(`SELECT is_synced FROM app_versions WHERE id = $1`, [ctx.versionId]))[0]
          ?.is_synced;
        expect(synced).toBe(false);
      }, 120000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Hydration syncs an app's connected resources.
    //
    // When an app is pulled from git it lands as a STUB; opening it hydrates the content
    // (hydrateStubApp → deserializeWorkspaceResources for its connected global data sources,
    // hydrateReferencedModuleStubs for connected modules). Resources brought in from git this
    // way must be is_synced=true. This test covers the connected DATA SOURCE (a data source
    // that rides into git via a query on the app, serializeLinkedDataSourcesForApp): after the
    // app is merged to main, pulled (→ stub) and hydrated, the DS's default-branch DSV is
    // is_synced=true. Against the real Gitea (@group gitsync).
    // ────────────────────────────────────────────────────────────────────────────
    describe("hydration marks an app's connected data source is_synced=true", () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;
      const MERGE_URL = `${GIT_BASE_URL}/admin/merge`;

      let hyOrgId: string;
      let hyCookie: string[];
      let hyDs: DataSource;

      const agent = () => request.agent(app.getHttpServer());
      const auth = (r: request.Test) => r.set('Cookie', hyCookie).set('tj-workspace-id', hyOrgId);
      const pull = (branchId: string) =>
        auth(agent().post('/api/workspace-branches/pull')).query({ branch_id: branchId }).send({ branchId });
      const branchIdByName = async (name: string, xBranchId: string): Promise<string> =>
        (
          await auth(agent().get('/api/workspace-branches')).set('x-branch-id', xBranchId).expect(200)
        ).body.branches.find((b: any) => b.name === name)?.id;
      const editingVersionOf = async (appId: string, branchId: string) => {
        const d = await auth(agent().get(`/api/apps/${appId}`))
          .query({ branch_id: branchId })
          .expect(200);
        const ev = d.body?.editing_version || d.body?.editingVersion || d.body?.app?.editing_version;
        const pageId = ev.home_page_id || ev.homePageId || ev.pages?.[0]?.id || d.body?.pages?.[0]?.id;
        return { versionId: ev.id as string, pageId: pageId as string };
      };
      const mergeToMain = async (sourceBranch: string) => {
        const resp = await fetch(MERGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: JSON.stringify({
            owner: GIT_REPO_OWNER,
            repo: `${GIT_REPO_NAME}.git`,
            source: sourceBranch,
            target: 'main',
            message: `Land ${sourceBranch}`,
          }),
        });
        expect((await resp.json().catch(() => ({}))).ok).toBe(true);
      };
      const dsvSynced = async (dsId: string, branchId: string): Promise<boolean> =>
        (
          await hyDs.query(`SELECT is_synced FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`, [
            dsId,
            branchId,
          ])
        )[0]?.is_synced;

      beforeAll(async () => {
        const { organization } = await createUser(app, {
          email: 'git-hydrate-conn.gl@tooljet.io',
          firstName: 'git',
          lastName: 'hydrateconn',
        });
        hyOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-hydrate-conn.gl@tooljet.io');
        hyCookie = tokenCookie;
        await ensureAppEnvironments(app, hyOrgId);
        hyDs = app.get<DataSource>(getDataSourceToken('default'));
        await hyDs.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [hyOrgId]
        );
      });

      it('an app pulled from git and hydrated has its connected data source is_synced=true on the default branch', async () => {
        const { randomUUID } = await import('crypto');
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const FEAT = 'feat-hydrate-conn';

        // ── 1. enable git + branching, pull main, create feature branch ──────────────────
        step(1, 'configure git + branching, pull main, create feature branch');
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);
        const gitConfig = await auth(agent().get(`/api/git-sync/${hyOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: true })
          .expect(200);
        const mainBranchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body
          .activeBranchId;
        await pull(mainBranchId).expect(201);
        await auth(agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({ name: FEAT, sourceBranchId: mainBranchId })
          .expect(201);
        const featBranchId = await branchIdByName(FEAT, mainBranchId);
        expect(featBranchId).toBeDefined();

        // ── 2. app + component + a global DS linked via a query (so the push carries the DS)
        step(2, 'create app + component, create DS, link the DS to the app via a query');
        const appId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'home', name: 'hydrate-conn-app', type: 'front-end', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const appCtx = await editingVersionOf(appId, featBranchId);
        const btnId = randomUUID();
        await auth(agent().post(`/api/v2/apps/${appId}/versions/${appCtx.versionId}/components`))
          .query({ branch_id: featBranchId })
          .send({
            is_user_switched_version: false,
            pageId: appCtx.pageId,
            diff: {
              [btnId]: {
                name: `button_${btnId.slice(0, 6)}`,
                layouts: {
                  desktop: { top: 80, left: 15, width: 4, height: 40 },
                  mobile: { top: 80, left: 15, width: 4, height: 40 },
                },
                type: 'Button',
                general: {},
                generalStyles: {},
                others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
                properties: { text: { value: 'Button' } },
                styles: {},
              },
            },
          })
          .expect(201);
        const dsId: string = (
          await auth(agent().post(`/api/data-sources?branch_id=${featBranchId}`))
            .send({
              name: 'hydrate-conn-ds',
              kind: 'restapi',
              options: [
                { key: 'url', value: 'http://hydrate-conn.example.com' },
                { key: 'auth_type', value: 'none' },
                { key: 'headers', value: [['', '']] },
                { key: 'ssl_certificate', value: 'none', encrypted: false },
              ],
              scope: 'global',
            })
            .expect(201)
        ).body.id;
        await auth(agent().post(`/api/data-queries/data-sources/${dsId}/versions/${appCtx.versionId}`))
          .query({ branch_id: featBranchId })
          .send({
            kind: 'restapi',
            name: 'q_conn',
            options: { method: 'get', url: '', url_params: [], headers: [], body: [] },
          })
          .expect(201);

        // ── 3. gitpush the app (unsynced FRONT_END → its linked DS rides into git) ────────
        step(3, 'gitpush the app (its linked data source rides into the commit)');
        await auth(agent().post(`/api/app-git/gitpush/${appId}/${appCtx.versionId}`))
          .query({ branch_id: featBranchId })
          .send({
            gitAppName: 'hydrate-conn-app',
            versionId: appCtx.versionId,
            lastCommitMessage: 'push app + linked ds',
            gitVersionName: FEAT,
            sourceBranch: FEAT,
          })
          .expect(201);

        // ── 4. merge feature → main, pull main → the app lands as a stub on main ─────────
        step(4, 'merge feature → main, pull main (app becomes a stub on main)');
        await mergeToMain(FEAT);
        await pull(mainBranchId).expect(201);

        // ── 5. hydrate the app on main (open it) ─────────────────────────────────────────
        step(5, 'hydrate the app on main via GET /apps/:id');
        const hydrateResp = await auth(agent().get(`/api/apps/${appId}`))
          .query({ branch_id: mainBranchId })
          .expect(200);
        expect(hydrateResp.body.hydration_status).toBe('success');

        // ── 6. the connected data source is synced on the default branch ─────────────────
        step(6, 'assert the connected data source is is_synced=true on the default branch');
        expect(await dsvSynced(dsId, mainBranchId)).toBe(true);
      }, 300000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Hydration cascade: opening a host app hydrates + syncs its referenced MODULE.
    //
    // A host app referencing a module via a ModuleViewer (moduleAppId.value = module
    // co_relation_id) is pushed alongside the module and merged to main. Pulling main lands
    // BOTH as stubs. Opening the host app cascade-hydrates the referenced module
    // (hydrateReferencedModuleStubs → hydrateStubApp on the module). The cascade-hydrated
    // module's version must be is_synced=true (content pulled from git). Complements §19 (the
    // connected data-source case). Against the real Gitea (@group gitsync).
    // ────────────────────────────────────────────────────────────────────────────
    describe('hydration cascade marks a referenced module is_synced=true', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;
      const MERGE_URL = `${GIT_BASE_URL}/admin/merge`;

      let mcOrgId: string;
      let mcCookie: string[];
      let mcDs: DataSource;

      const agent = () => request.agent(app.getHttpServer());
      const auth = (r: request.Test) => r.set('Cookie', mcCookie).set('tj-workspace-id', mcOrgId);
      const pull = (branchId: string) =>
        auth(agent().post('/api/workspace-branches/pull')).query({ branch_id: branchId }).send({ branchId });
      const branchIdByName = async (name: string, xBranchId: string): Promise<string> =>
        (
          await auth(agent().get('/api/workspace-branches')).set('x-branch-id', xBranchId).expect(200)
        ).body.branches.find((b: any) => b.name === name)?.id;
      const editingVersionOf = async (appId: string, branchId: string) => {
        const d = await auth(agent().get(`/api/apps/${appId}`))
          .query({ branch_id: branchId })
          .expect(200);
        const ev = d.body?.editing_version || d.body?.editingVersion || d.body?.app?.editing_version;
        const pageId = ev.home_page_id || ev.homePageId || ev.pages?.[0]?.id || d.body?.pages?.[0]?.id;
        return { versionId: ev.id as string, pageId: pageId as string };
      };
      const gitpush = (appId: string, versionId: string, gitAppName: string, branchName: string, branchId: string) =>
        auth(agent().post(`/api/app-git/gitpush/${appId}/${versionId}`))
          .query({ branch_id: branchId })
          .send({
            gitAppName,
            versionId,
            lastCommitMessage: `push ${gitAppName}`,
            gitVersionName: branchName,
            sourceBranch: branchName,
          });
      const mergeToMain = async (sourceBranch: string) => {
        const resp = await fetch(MERGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: JSON.stringify({
            owner: GIT_REPO_OWNER,
            repo: `${GIT_REPO_NAME}.git`,
            source: sourceBranch,
            target: 'main',
            message: `Land ${sourceBranch}`,
          }),
        });
        expect((await resp.json().catch(() => ({}))).ok).toBe(true);
      };
      const nonStubVersionSynced = async (appId: string, branchId: string): Promise<boolean | undefined> =>
        (
          await mcDs.query(
            `SELECT is_synced FROM app_versions WHERE app_id = $1 AND branch_id = $2 AND is_stub = false ORDER BY created_at DESC LIMIT 1`,
            [appId, branchId]
          )
        )[0]?.is_synced;
      const listByType = async (type: string, branchId: string) =>
        (
          await auth(agent().get('/api/apps'))
            .query({ page: 1, folder: '', searchKey: '', type, branch_id: branchId })
            .expect(200)
        ).body.apps || [];

      beforeAll(async () => {
        const { organization } = await createUser(app, {
          email: 'git-mod-cascade.gl@tooljet.io',
          firstName: 'git',
          lastName: 'modcascade',
        });
        mcOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-mod-cascade.gl@tooljet.io');
        mcCookie = tokenCookie;
        await ensureAppEnvironments(app, mcOrgId);
        mcDs = app.get<DataSource>(getDataSourceToken('default'));
        await mcDs.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [mcOrgId]
        );
      });

      it('opening a host app cascade-hydrates its referenced module and marks the module is_synced=true', async () => {
        const { randomUUID } = await import('crypto');
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const FEAT = 'feat-mod-cascade';

        // ── 1. enable git + branching, pull main, create feature branch ──────────────────
        step(1, 'configure git + branching, pull main, create feature branch');
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);
        const gitConfig = await auth(agent().get(`/api/git-sync/${mcOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: true })
          .expect(200);
        const mainBranchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body
          .activeBranchId;
        await pull(mainBranchId).expect(201);
        await auth(agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({ name: FEAT, sourceBranchId: mainBranchId })
          .expect(201);
        const featBranchId = await branchIdByName(FEAT, mainBranchId);
        expect(featBranchId).toBeDefined();

        // ── 2. create a module + a host app that references it via a ModuleViewer ─────────
        step(2, 'create module + host app; wire a ModuleViewer on the host → module co_relation_id');
        const moduleId: string = (
          await auth(agent().post('/api/modules'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'folderupload', name: 'mc-module', type: 'module', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const moduleCtx = await editingVersionOf(moduleId, featBranchId);
        const moduleInList = (await listByType('module', featBranchId)).find((m: any) => m.id === moduleId);
        const moduleCoRel: string = moduleInList?.co_relation_id || moduleInList?.coRelationId;
        expect(moduleCoRel).toBeDefined();

        const hostAppId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'home', name: 'mc-host-app', type: 'front-end', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const hostCtx = await editingVersionOf(hostAppId, featBranchId);
        const moduleViewerId = randomUUID();
        await auth(agent().post(`/api/v2/apps/${hostAppId}/versions/${hostCtx.versionId}/components`))
          .query({ branch_id: featBranchId })
          .send({
            is_user_switched_version: false,
            pageId: hostCtx.pageId,
            diff: {
              [moduleViewerId]: {
                name: 'moduleviewer1',
                layouts: {
                  desktop: { top: 70, left: 5, width: 38, height: 400 },
                  mobile: { top: 70, left: 5, width: 38, height: 400 },
                },
                type: 'ModuleViewer',
                general: {},
                generalStyles: { boxShadow: { value: '0px 0px 0px 0px #00000040' } },
                others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
                properties: {
                  moduleAppId: { value: moduleCoRel },
                  moduleVersionId: { value: '' },
                  visibility: { value: true },
                },
                styles: { backgroundColor: { value: '#fff' }, padding: { value: 'default' } },
                parent: null,
              },
            },
          })
          .expect(201);

        // ── 3. gitpush module + host app to the feature branch ───────────────────────────
        step(3, 'gitpush the module and the host app');
        await gitpush(moduleId, moduleCtx.versionId, 'mc-module', FEAT, featBranchId).expect(201);
        await gitpush(hostAppId, hostCtx.versionId, 'mc-host-app', FEAT, featBranchId).expect(201);

        // ── 4. merge feature → main, pull main → host + module land as stubs ─────────────
        step(4, 'merge feature → main, pull main (host + module become stubs)');
        await mergeToMain(FEAT);
        await pull(mainBranchId).expect(201);
        const mainHost = (await listByType('front-end', mainBranchId)).find((a: any) => a.name === 'mc-host-app');
        const mainModule = (await listByType('module', mainBranchId)).find((m: any) => m.name === 'mc-module');
        expect(mainHost).toBeDefined();
        expect(mainModule).toBeDefined();
        expect(mainHost.is_stub).toBe(true);
        expect(mainModule.is_stub).toBe(true);

        // ── 5. open (hydrate) the host app → cascade-hydrates the referenced module ───────
        step(5, 'hydrate the host app on main → module cascade-hydrates');
        const hostHydrate = await auth(agent().get(`/api/apps/${mainHost.id}`))
          .query({ branch_id: mainBranchId })
          .expect(200);
        expect(hostHydrate.body.hydration_status).toBe('success');
        const moduleAfter = await auth(agent().get(`/api/apps/${mainModule.id}`))
          .query({ branch_id: mainBranchId })
          .expect(200);
        expect(moduleAfter.body.not_hydrated_reason).toBe('already-up-to-date');

        // ── 6. the cascade-hydrated module's version is is_synced=true ────────────────────
        step(6, 'assert the referenced module is is_synced=true on the default branch');
        expect(await nonStubVersionSynced(mainModule.id, mainBranchId)).toBe(true);
        expect(await nonStubVersionSynced(mainHost.id, mainBranchId)).toBe(true);
      }, 300000);
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
          email: 'git-edit-restrictions.gl@tooljet.io',
          firstName: 'git',
          lastName: 'restrictions',
        });
        editOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-edit-restrictions.gl@tooljet.io');
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
                styles: {
                  backgroundColor: { value: 'var(--cc-primary-brand)' },
                },
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
          const pageId = ev.home_page_id || ev.homePageId || ev.pages?.[0]?.id || detail.body?.pages?.[0]?.id;
          const envId = ev.current_environment_id || ev.currentEnvironmentId;
          return {
            versionId: ev.id as string,
            envId: envId as string,
            pageId: pageId as string,
            ev,
          };
        };

        // Add a component to a version (returns the supertest response for status assertions).
        const addComponent = (
          appId: string,
          versionId: string,
          pageId: string,
          branchId?: string,
          parent: string | null = null
        ) => {
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

        // Other guarded mutation routes — the guard/inline check rejects before the body is
        // processed, so the exact payload only needs to route (bodies are otherwise valid-shaped).
        const updateComponent = (appId: string, versionId: string, pageId: string, branchId?: string) =>
          auth(agent().put(`/api/v2/apps/${appId}/versions/${versionId}/components`))
            .query(branchId ? { branch_id: branchId } : {})
            .send({
              is_user_switched_version: false,
              pageId,
              diff: makeButtonDiff(null).diff,
            });
        const deleteComponents = (appId: string, versionId: string, pageId: string, branchId?: string) =>
          auth(agent().delete(`/api/v2/apps/${appId}/versions/${versionId}/components`))
            .query(branchId ? { branch_id: branchId } : {})
            .send({
              is_user_switched_version: false,
              pageId,
              diff: [randomUUID()],
            });
        const createPage = (appId: string, versionId: string, branchId?: string) => {
          const rid = randomUUID();
          return auth(agent().post(`/api/v2/apps/${appId}/versions/${versionId}/pages`))
            .query(branchId ? { branch_id: branchId } : {})
            .send({
              id: rid,
              name: `Page ${rid.slice(0, 4)}`,
              handle: `page-${rid.slice(0, 4)}`,
              index: 5,
            });
        };
        // Version content edit (globalSettings) — a content edit, so subject to the same rules.
        const editVersionContent = (appId: string, versionId: string, branchId?: string) =>
          auth(agent().put(`/api/v2/apps/${appId}/versions/${versionId}`))
            .query(branchId ? { branch_id: branchId } : {})
            .send({
              is_user_switched_version: false,
              globalSettings: { appMode: 'dark' },
            });
        const editDataSource = (dsIdToEdit: string, environmentId: string, branchId?: string) =>
          auth(agent().put(`/api/data-sources/${dsIdToEdit}`))
            .query({
              environment_id: environmentId,
              ...(branchId ? { branch_id: branchId } : {}),
            })
            .send({ name: 'edit-rules-ds', options: restapiDsOptions });

        // Folder membership (folder_apps) is branch-scoped, so add-to-folder / remove-from-folder follow
        // the SAME branch-lock as content edits: blocked on the synced default branch under multi-branch,
        // allowed on feature branches and on the single-branch default branch, no-op when git is off.
        // (Folders themselves are org-scoped; only the membership row carries the branch.)
        const createFolder = (name: string) => auth(agent().post('/api/folders')).send({ name, type: 'front-end' });
        const addToFolder = (fId: string, targetAppId: string, branchId?: string) =>
          auth(agent().post('/api/folder-apps'))
            .query(branchId ? { branch_id: branchId } : {})
            .send({ folder_id: fId, app_id: targetAppId });
        const removeFromFolder = (fId: string, targetAppId: string, branchId?: string) =>
          auth(agent().put(`/api/folder-apps/${fId}`))
            .query(branchId ? { branch_id: branchId } : {})
            .send({ app_id: targetAppId });

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 1 — GIT OFF: everything editable; a saved version becomes read-only.
        // ══════════════════════════════════════════════════════════════════════
        step(1, 'git-off: create app + module + data source');
        const appResp = await auth(agent().post('/api/apps'))
          .send({ icon: 'home', name: 'edit-rules-app', type: 'front-end' })
          .expect(201);
        const appId: string = appResp.body.id;

        const moduleResp = await auth(agent().post('/api/modules'))
          .send({
            icon: 'folderupload',
            name: 'edit-rules-module',
            type: 'module',
          })
          .expect(201);
        const moduleId: string = moduleResp.body.id;

        const dsResp = await auth(agent().post('/api/data-sources'))
          .send({
            name: 'edit-rules-ds',
            kind: 'restapi',
            options: restapiDsOptions,
            scope: 'global',
          })
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
        await addComponent(
          moduleId,
          moduleCtx.versionId,
          moduleCtx.pageId,
          undefined,
          moduleContainerId ?? null
        ).expect(201);
        await addQuery(dsId, moduleCtx.versionId, 'mod_q1').expect(201);

        step(3, 'git-off: add another data source, edit it, rename app + module, add more component/query');
        await auth(agent().post('/api/data-sources'))
          .send({ name: 'edit-rules-ds-2', kind: 'restapi', options: restapiDsOptions, scope: 'global' })
          .expect(201);

        // Edit a data source (dev env). Git off → GitSyncDataSourceEditGuard is a no-op.
        const devEnv = (await auth(agent().get('/api/app-environments')).expect(200)).body.environments.sort(
          (a: any, b: any) => a.priority - b.priority
        )[0];
        await auth(agent().put(`/api/data-sources/${dsId}?environment_id=${devEnv.id}`))
          .send({ name: 'edit-rules-ds', options: restapiDsOptions })
          .expect(200);

        await auth(agent().put(`/api/apps/${appId}`))
          .send({
            app: {
              name: 'edit-rules-app-renamed',
              editingVersionId: appCtx.versionId,
            },
          })
          .expect(200);
        await auth(agent().put(`/api/apps/${moduleId}`))
          .send({
            app: {
              name: 'edit-rules-module-renamed',
              editingVersionId: moduleCtx.versionId,
            },
          })
          .expect(200);

        await addComponent(appId, appCtx.versionId, appCtx.pageId).expect(201);
        await addQuery(dsId, appCtx.versionId, 'app_q2').expect(201);

        step(4, 'git-off: save (publish) the app + module version → no draft remains');
        await auth(agent().put(`/api/v2/apps/${appId}/versions/${appCtx.versionId}`))
          .send({
            is_user_switched_version: false,
            name: 'v1',
            description: 'saved',
            status: 'PUBLISHED',
          })
          .expect(200);
        await auth(agent().put(`/api/v2/apps/${moduleId}/versions/${moduleCtx.versionId}`))
          .send({
            is_user_switched_version: false,
            name: 'v1',
            description: 'saved',
            status: 'PUBLISHED',
          })
          .expect(200);

        // Git off + unsynced → publish does not seed a continuity draft: no DRAFT rows remain.
        const appDraftCount = await dataSource.query(
          `SELECT COUNT(*)::int AS c FROM app_versions WHERE app_id = $1 AND status = 'DRAFT'`,
          [appId]
        );
        expect(appDraftCount[0].c).toBe(0);

        step(5, 'git-off: editing the SAVED (published) version is rejected across all mutation routes');
        // Component create/update/delete, query create, page create, and version content edit are all
        // blocked (400) on a saved version — regardless of git — via assertVersionEditable.
        await addComponent(appId, appCtx.versionId, appCtx.pageId).expect(400);
        await updateComponent(appId, appCtx.versionId, appCtx.pageId).expect(400);
        await deleteComponents(appId, appCtx.versionId, appCtx.pageId).expect(400);
        await addQuery(dsId, appCtx.versionId, 'app_q_blocked').expect(400);
        await createPage(appId, appCtx.versionId).expect(400);
        await editVersionContent(appId, appCtx.versionId).expect(400);
        await addComponent(
          moduleId,
          moduleCtx.versionId,
          moduleCtx.pageId,
          undefined,
          moduleContainerId ?? null
        ).expect(400);

        step(6, 'git-off: folder create + add-to-folder + remove-from-folder are all allowed');
        // Git off → the folder-apps branch-lock is a no-op; membership changes succeed freely.
        const folderResp = await createFolder('edit-rules-folder').expect(201);
        const folderId: string = folderResp.body.id;
        await addToFolder(folderId, appId).expect(201);
        await removeFromFolder(folderId, appId).expect(200);

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 2 — CONFIGURE GIT + BRANCHING ON: unsynced resources stay editable.
        // ══════════════════════════════════════════════════════════════════════
        step(7, 'configure git sync (reset repo + save provider configs), enable branching');
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        const cfgSaveRes = await auth(agent().post('/api/git-sync/configs')).send({
          ...GITLAB_PAYLOAD,
          useEnvConfig: false,
        });
        if (cfgSaveRes.status !== 201) {
          throw new Error(
            `config save -> ${cfgSaveRes.status}: ${cfgSaveRes.text || JSON.stringify(cfgSaveRes.body)} | token.len=${GITLAB_PAYLOAD.gitLabProjectAccessToken.length} projectId=${GITLAB_PAYLOAD.gitLabProjectId} base=${GITLAB_PAYLOAD.gitLabEnterpriseUrl}`
          );
        }

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

        step(8, 'git-on (multi-branch): unsynced app is still editable on the default branch');
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
        step(9, 'sync app: create feature branch, push default-branch draft onto it');
        await auth(agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-edit-rules', sourceBranchId: mainBranchId })
          .expect(201);
        // create-branch is async (returns { enqueued }); resolve the row id from the list endpoint.
        const featBranchId: string = (
          await auth(agent().get('/api/workspace-branches')).set('x-branch-id', mainBranchId).expect(200)
        ).body.branches.find((b: any) => b.name === 'feat-edit-rules')?.id;

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

        step(10, 'sync app: pull feature, capture its branch version, merge feature → main, pull main');
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
        step(11, 'git-on (multi-branch): editing the SYNCED default-branch draft is blocked across all routes');
        // Component create/update/delete, query create, page create, and version content edit are all
        // blocked (403) on the synced default-branch draft under multi-branch.
        await addComponent(appId, mainDraftId, mainDraftPageId, mainBranchId).expect(403);
        await updateComponent(appId, mainDraftId, mainDraftPageId, mainBranchId).expect(403);
        await deleteComponents(appId, mainDraftId, mainDraftPageId, mainBranchId).expect(403);
        await addQuery(dsId, mainDraftId, 'blocked_default_q', mainBranchId).expect(403);
        await createPage(appId, mainDraftId, mainBranchId).expect(403);
        await editVersionContent(appId, mainDraftId, mainBranchId).expect(403);

        // Data source edit: mark the DS's default-branch version synced, then editing it on the
        // default branch (multi-branch) is blocked (403). An unsynced DS would stay editable.
        await dataSource.query(
          `UPDATE data_source_versions SET is_synced = true WHERE data_source_id = $1 AND branch_id = $2`,
          [dsId, mainBranchId]
        );
        await editDataSource(dsId, devEnv.id, mainBranchId).expect(403);

        // Folder membership on the synced default branch (multi-branch) is blocked too — both
        // add-to-folder and remove-from-folder (403). Changes must be made on a feature branch.
        await addToFolder(folderId, appId, mainBranchId).expect(403);
        await removeFromFolder(folderId, appId, mainBranchId).expect(403);

        step(12, 'git-on (multi-branch): editing on the feature branch is allowed');
        await addComponent(appId, featVersionId, featCtx.pageId, featBranchId).expect(201);
        // Folder membership on a feature branch is allowed (add then remove).
        await addToFolder(folderId, appId, featBranchId).expect(201);
        await removeFromFolder(folderId, appId, featBranchId).expect(200);

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 5 — BRANCHING OFF (single-branch): feature blocked, default allowed.
        // ══════════════════════════════════════════════════════════════════════
        step(13, 'branching OFF: feature-branch edits blocked, default-branch edits allowed');
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: false })
          .expect(200);

        // Feature-branch operations are rejected when branching is disabled.
        await addComponent(appId, featVersionId, featCtx.pageId, featBranchId).expect(403);
        // Folder membership on a feature branch is likewise rejected in single-branch mode.
        await addToFolder(folderId, appId, featBranchId).expect(403);

        // The default branch is the single working branch → edits allowed again (even though synced).
        await addComponent(appId, mainDraftId, mainDraftPageId, mainBranchId).expect(201);
        await addQuery(dsId, mainDraftId, 'single_branch_q', mainBranchId).expect(201);
        // Folder membership on the single-branch default branch is allowed (add then remove).
        await addToFolder(folderId, appId, mainBranchId).expect(201);
        await removeFromFolder(folderId, appId, mainBranchId).expect(200);

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 6 — LICENSE LOCK: git configured + license expired → every edit blocked.
        // ══════════════════════════════════════════════════════════════════════
        step(14, 'git configured + license expired: all edits blocked until git is turned off');
        try {
          // Simulate an expired plan at runtime (no restart): git is still configured, but the
          // license no longer covers it, so the whole workspace is edit-locked.
          setTestLicenseTerms(app, { features: { gitSync: true, gitSyncMultiBranch: true } } as any, { expired: true });

          // Target the (DRAFT) default-branch version so the status guard passes and the
          // license-lock (403) is what rejects the edit — not the saved-version guard (400).
          await addComponent(appId, mainDraftId, mainDraftPageId, mainBranchId).expect(403);
          await addQuery(dsId, mainDraftId, 'license_locked_q', mainBranchId).expect(403);
          // Folder membership is blocked by the license lock too (independent of branch).
          await addToFolder(folderId, appId, mainBranchId).expect(403);
          await removeFromFolder(folderId, appId, mainBranchId).expect(403);
        } finally {
          // Always restore the enterprise plan so later suites/teardown aren't affected.
          restoreLicensePlan(app, 'enterprise');
        }
      }, 600000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Git-OFF metadata update when the app has NO draft version (regression).
    //
    // A git-off app can end up with only saved (PUBLISHED) version rows and no DRAFT —
    // create → publish flips the draft to PUBLISHED and, because the app is unsynced,
    // no continuity draft is seeded. The metadata write (PUT /api/apps/:id for
    // name/slug/icon/is_public) used to be scoped to the DRAFT row only, so with no draft
    // it silently matched zero rows and dropped the edit — leaving the app reachable
    // only under its old slug (validate-released-app-access/<new-slug> then 404s).
    // The write now falls back to the saved version rows when no draft exists.
    // ────────────────────────────────────────────────────────────────────────────
    describe('git-off metadata update with no draft version (regression)', () => {
      let regOrgId: string;
      let regCookie: string[];
      let regDataSource: DataSource;

      beforeAll(async () => {
        // Fresh org, git never configured → stays git-off for the whole test.
        const { organization } = await createUser(app, {
          email: 'git-off-nodraft-gitlab@tooljet.io',
          firstName: 'git',
          lastName: 'nodraft',
        });
        regOrgId = organization.id;
        const { tokenCookie: cookie } = await login(app, 'git-off-nodraft-gitlab@tooljet.io');
        regCookie = cookie;
        await ensureAppEnvironments(app, regOrgId);
        regDataSource = app.get<DataSource>(getDataSourceToken('default'));
        // Seed the default WorkspaceBranch (createUser skips the onboarding that creates it),
        // otherwise getDetails() self-heals with a noisy "No default branch found" log.
        await regDataSource.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, 'main', true)
           ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [regOrgId]
        );
      });

      it('persists name/slug/icon/is_public and keeps the app resolvable by its new slug', async () => {
        const { randomUUID } = await import('crypto');
        const agent = () => request.agent(app.getHttpServer());
        const auth = (r: request.Test) => r.set('Cookie', regCookie).set('tj-workspace-id', regOrgId);

        // 1. Create app (git off) → one DRAFT version on the default branch.
        const appResp = await auth(agent().post('/api/apps'))
          .send({ icon: 'home', name: 'nodraft-app', type: 'front-end' })
          .expect(201);
        const appId: string = appResp.body.id;

        const detail = await auth(agent().get(`/api/apps/${appId}`)).expect(200);
        const ev = detail.body?.editing_version || detail.body?.editingVersion;
        expect(ev).toBeDefined();
        const versionId: string = ev.id;

        // 2. Publish the version. Git off + unsynced → no continuity draft is seeded, so the
        //    app is left with only the PUBLISHED version_type='version' row (no DRAFT).
        await auth(agent().put(`/api/v2/apps/${appId}/versions/${versionId}`))
          .send({ is_user_switched_version: false, name: 'v1', description: 'saved', status: 'PUBLISHED' })
          .expect(200);
        const draftCount = await regDataSource.query(
          `SELECT COUNT(*)::int AS c FROM app_versions WHERE app_id = $1 AND status = 'DRAFT'`,
          [appId]
        );
        expect(draftCount[0].c).toBe(0);

        // 3. Update metadata via PUT /api/apps/:id. With no draft this used to be a silent
        //    no-op; it must now land on the saved (PUBLISHED) version row.
        const newSlug = `nodraft-slug-${randomUUID().slice(0, 8)}`;
        await auth(agent().put(`/api/apps/${appId}`))
          .send({ app: { name: 'nodraft-app-renamed', slug: newSlug, icon: 'settings', is_public: true } })
          .expect(200);

        // 4a. The change persisted to every non-stub default-branch version row (only the
        //     PUBLISHED one here) — proving the edit was not dropped.
        const rows = await regDataSource.query(
          `SELECT app_name, slug, icon, is_public FROM app_versions
             WHERE app_id = $1 AND version_type = 'version' AND is_stub = false`,
          [appId]
        );
        expect(rows.length).toBeGreaterThan(0);
        for (const row of rows) {
          expect(row).toMatchObject({
            app_name: 'nodraft-app-renamed',
            slug: newSlug,
            icon: 'settings',
            is_public: true,
          });
        }

        // 4b. And the API reads the new metadata back off the saved version.
        const savedDetail = await auth(agent().get(`/api/v2/apps/${appId}/versions/${versionId}`))
          .query({ mode: 'edit' })
          .expect(200);
        expect(savedDetail.body.name).toBe('nodraft-app-renamed');
        expect(savedDetail.body.slug).toBe(newSlug);
        expect(savedDetail.body.icon).toBe('settings');
        expect(savedDetail.body.isPublic).toBe(true);

        // 5. Promote dev → staging → production and release, then the released app must
        //    resolve by its NEW slug (the user's exact failing call).
        const envs = (await auth(agent().get('/api/app-environments')).expect(200)).body.environments.sort(
          (a: any, b: any) => a.priority - b.priority
        );
        expect(envs.length).toBeGreaterThanOrEqual(3);
        await auth(agent().put(`/api/v2/apps/${appId}/versions/${versionId}/promote`))
          .send({ currentEnvironmentId: envs[0].id })
          .expect(200);
        await auth(agent().put(`/api/v2/apps/${appId}/versions/${versionId}/promote`))
          .send({ currentEnvironmentId: envs[1].id })
          .expect(200);
        await auth(agent().put(`/api/apps/${appId}/release`))
          .send({ versionToBeReleased: versionId })
          .expect(200);

        const validate = await auth(agent().get(`/api/apps/validate-released-app-access/${newSlug}`)).expect(200);
        expect(validate.body).toMatchObject({ id: appId, slug: newSlug });
      });
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
          email: 'git-patch-flow.gl@tooljet.io',
          firstName: 'git',
          lastName: 'patch',
        });
        patchOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-patch-flow.gl@tooljet.io');
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
                others: {
                  showOnDesktop: { value: '{{true}}' },
                  showOnMobile: { value: '{{false}}' },
                },
                properties: {
                  text: { value: 'Button' },
                  visibility: { value: '{{true}}' },
                },
                styles: {
                  backgroundColor: { value: 'var(--cc-primary-brand)' },
                },
                parent: null,
              },
            },
          };
        };

        // GET app detail → the current editing (draft) version id + home page id.
        const getEditing = async (appId: string) => {
          const detail = await auth(agent().get(`/api/apps/${appId}`))
            .query({ branch_id: mainBranchId })
            .expect(200);
          const ev = detail.body?.editing_version || detail.body?.editingVersion;
          const pageId = ev.home_page_id || ev.homePageId || ev.pages?.[0]?.id;
          return {
            versionId: ev.id as string,
            envId: (ev.current_environment_id || ev.currentEnvironmentId) as string,
            pageId,
          };
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
            .send({
              is_user_switched_version: false,
              pageId,
              diff: buttonDiff(name).diff,
            })
            .expect(201);
        const addQuery = (dsId: string, versionId: string, name: string) =>
          auth(agent().post(`/api/data-queries/data-sources/${dsId}/versions/${versionId}`))
            .query({ branch_id: mainBranchId })
            .send({
              kind: 'restapi',
              name,
              options: {
                method: 'get',
                url: '',
                headers: [],
                url_params: [],
                body: [],
              },
            })
            .expect(201);
        const publish = (appId: string, versionId: string, name: string) =>
          auth(agent().put(`/api/v2/apps/${appId}/versions/${versionId}`))
            .query({ branch_id: mainBranchId })
            .send({
              is_user_switched_version: false,
              name,
              status: 'PUBLISHED',
            })
            .expect(200);
        // Create a draft from a saved version. replace=true → atomic swap of the current draft.
        const createDraftFrom = (appId: string, versionFromId: string, envId: string, replace: boolean) =>
          auth(agent().post(`/api/apps/${appId}/versions`))
            .query({ branch_id: mainBranchId })
            .send({
              versionName: 'main',
              versionFromId,
              environmentId: envId,
              versionType: 'version',
              replace,
            })
            .expect(201);

        const restapiDsOptions = [
          { key: 'url', value: '' },
          { key: 'auth_type', value: 'none' },
          { key: 'headers', value: [['', '']] },
        ];

        // ── Configure git + branching OFF (single-branch) ────────────────────
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);
        const gitConfig = await auth(agent().get(`/api/git-sync/${patchOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: false })
          .expect(200);
        const branchesResp = await auth(agent().get('/api/workspace-branches')).expect(200);
        const mainBranchId: string = branchesResp.body.activeBranchId;
        expect(mainBranchId).toBeDefined();

        // ── Setup: app + module + data source + query + components on the default branch ──
        const appResp = await auth(agent().post('/api/apps'))
          .send({ icon: 'home', name: 'patch-flow-app', type: 'front-end' })
          .expect(201);
        const appId: string = appResp.body.id;
        const moduleResp = await auth(agent().post('/api/modules'))
          .send({
            icon: 'folderupload',
            name: 'patch-flow-module',
            type: 'module',
          })
          .expect(201);
        const moduleId: string = moduleResp.body.id;
        const dsResp = await auth(agent().post('/api/data-sources'))
          .send({
            name: 'patch-flow-ds',
            kind: 'restapi',
            options: restapiDsOptions,
            scope: 'global',
          })
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

        // ── Draft from v1 (replace), then add 1 more component + query ───────
        // The app is unsynced-on-create (in every mode), so publishing v1 seeds NO continuity draft
        // (handleDefaultBranchPublish returns early for is_synced=false). This test exercises the
        // atomic replace path (replace:true) end-to-end regardless — the meaningful replace happens
        // at the later d2 → d3 patch step, where the uncommitted comp_B/query_B are discarded.
        const d2Resp = await createDraftFrom(appId, v1Id, v1Ctx.envId, true);
        const d2Id: string = d2Resp.body.id;
        expect(await componentNames(d2Id)).toEqual(['comp_A']); // clean copy of v1
        expect(await queryNames(d2Id)).toEqual(['query_A']);
        await addComponent(appId, d2Id, await draftPageId(d2Id), 'comp_B');
        await addQuery(dsId, d2Id, 'query_B');
        expect(await componentNames(d2Id)).toEqual(['comp_A', 'comp_B']);
        expect(await queryNames(d2Id)).toEqual(['query_A', 'query_B']);

        // Stamp a non-null git_tree_sha on BOTH the draft being replaced (d2) and the source
        // saved version (v1). The replaced draft must come out never-pulled (git_tree_sha = NULL)
        // so both a later `pull latest` and the next app open treat it as outdated and refresh it:
        // change detection compares git_tree_sha against git's tree SHA, so a stale non-null value
        // inherited from the replaced draft or the source version would make pull/open wrongly skip.
        await patchDataSource.query(
          `UPDATE app_versions SET git_tree_sha = 'inherited-tree-sha-0000000000000000000000000000' WHERE id = ANY($1)`,
          [[d2Id, v1Id]]
        );

        // ── Create draft from the saved version (replace) → discards comp_B/query_B ──
        const d3Resp = await createDraftFrom(appId, v1Id, v1Ctx.envId, true);
        const d3Id: string = d3Resp.body.id;
        expect(d3Id).not.toBe(d2Id);
        // The replaced draft is never-pulled: git_tree_sha is NULL so `pull latest` / the next open
        // will refresh it rather than skip.
        const d3Staleness = await patchDataSource.query(`SELECT git_tree_sha FROM app_versions WHERE id = $1`, [d3Id]);
        expect(d3Staleness[0].git_tree_sha).toBeNull();
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

    // ────────────────────────────────────────────────────────────────────────────
    // Unsynced app → multiple drafts allowed in EVERY git/branching combination.
    //
    // The single-draft rule only applies to SYNCED versions (createVersion in versions/util.service.ts
    // exempts isSynced === false). So an app that was never pushed to git behaves like a non-git
    // workspace and can hold any number of drafts — regardless of git off/on or branching on/off.
    // The app is created git-off and stays unsynced (never pushed) throughout; only the workspace's
    // git/branching state is toggled between the checks.
    // ────────────────────────────────────────────────────────────────────────────
    describe('unsynced app — multiple drafts across git/branching states', () => {
      let unsyncOrgId: string;
      let unsyncCookie: string[];
      let unsyncDataSource: DataSource;
      let unsyncBranchId: string;

      beforeAll(async () => {
        const { organization } = await createUser(app, {
          email: 'git-unsynced-multidraft.gl@tooljet.io',
          firstName: 'git',
          lastName: 'multidraft',
        });
        unsyncOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-unsynced-multidraft.gl@tooljet.io');
        unsyncCookie = tokenCookie;
        await ensureAppEnvironments(app, unsyncOrgId);
        unsyncDataSource = app.get<DataSource>(getDataSourceToken('default'));
        await unsyncDataSource.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [unsyncOrgId]
        );
        const [branch] = await unsyncDataSource.query(
          `SELECT id FROM organization_git_sync_branches WHERE organization_id = $1 AND is_default = true`,
          [unsyncOrgId]
        );
        unsyncBranchId = branch.id;
      });

      it('allows unlimited draft versions for an unsynced app (git off/on, branching on/off)', async () => {
        const agent = () => request.agent(app.getHttpServer());
        const auth = (r: request.Test) => r.set('Cookie', unsyncCookie).set('tj-workspace-id', unsyncOrgId);

        // Count non-branch DRAFT versions for the app.
        const draftCount = async (appId: string): Promise<number> =>
          (
            await unsyncDataSource.query(
              `SELECT COUNT(*)::int AS c FROM app_versions
                WHERE app_id = $1 AND status = 'DRAFT' AND version_type = 'version'`,
              [appId]
            )
          )[0].c;
        // Every non-stub version of the app must remain unsynced (never pushed to git).
        const isFullyUnsynced = async (appId: string): Promise<boolean> =>
          (
            await unsyncDataSource.query(
              `SELECT bool_and(is_synced = false) AS unsynced FROM app_versions WHERE app_id = $1 AND is_stub = false`,
              [appId]
            )
          )[0].unsynced;
        const createDraft = (appId: string, versionFromId: string, name: string, envId: string) =>
          auth(agent().post(`/api/apps/${appId}/versions`))
            .query({ branch_id: unsyncBranchId })
            .send({
              versionName: name,
              versionFromId,
              environmentId: envId,
              versionType: 'version',
            });

        // ── GIT OFF: create the (unsynced) app + two extra drafts ────────────
        const appResp = await auth(agent().post('/api/apps'))
          .send({
            icon: 'home',
            name: 'unsynced-multidraft-app',
            type: 'front-end',
          })
          .expect(201);
        const appId: string = appResp.body.id;
        const detail = await auth(agent().get(`/api/apps/${appId}`))
          .query({ branch_id: unsyncBranchId })
          .expect(200);
        const ev = detail.body?.editing_version || detail.body?.editingVersion;
        const v0Id: string = ev.id;
        const envId: string = ev.current_environment_id || ev.currentEnvironmentId;

        await createDraft(appId, v0Id, 'draft_off_1', envId).expect(201);
        await createDraft(appId, v0Id, 'draft_off_2', envId).expect(201);
        expect(await draftCount(appId)).toBe(3); // v0 + 2
        expect(await isFullyUnsynced(appId)).toBe(true);

        // ── GIT ON + branching ON (multi-branch) ─────────────────────────────
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);
        const gitConfig = await auth(agent().get(`/api/git-sync/${unsyncOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: true })
          .expect(200);

        await createDraft(appId, v0Id, 'draft_multi_1', envId).expect(201);
        await createDraft(appId, v0Id, 'draft_multi_2', envId).expect(201);
        expect(await draftCount(appId)).toBe(5);
        expect(await isFullyUnsynced(appId)).toBe(true); // configuring git must NOT flip existing versions

        // ── GIT ON + branching OFF (single-branch) ───────────────────────────
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: false })
          .expect(200);

        await createDraft(appId, v0Id, 'draft_single_1', envId).expect(201);
        await createDraft(appId, v0Id, 'draft_single_2', envId).expect(201);
        expect(await draftCount(appId)).toBe(7);
        expect(await isFullyUnsynced(appId)).toBe(true);
      }, 180000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Part 4 — Resolve conflicts during workspace pull.
    //
    // A workspace pull that brings in a git resource whose NAME matches a local resource but whose
    // correlation id DIFFERS raises a 409 with structured conflict details (never a silent duplicate).
    // Same-name conflicts are resolved three ways, each leading to a clean pull:
    //   (1) relink — POST /workspace-branches/resolve-conflicts adopts the remote correlation id on the
    //                local row (and marks it git-synced), so the next pull matches + updates in place;
    //   (2) rename — rename the local resource so names no longer collide (remote imported fresh);
    //   (3) delete — delete the local resource (remote imported fresh).
    // Setup mirrors the proven "sync unsynced app" flow (steps 69-77): author resources git-off, enable
    // git + branching, gitpush them onto ONE feature branch, merge → main. Local correlation ids are then
    // diverged to manufacture the conflicts. A data source rides into git via a query on a carrier app
    // (serializeLinkedDataSourcesForApp). Modules push through the same gitpush route as apps. The
    // conflict response is asserted to SHRINK after each resolution until the final pull succeeds.
    // Runs against the real Gitea simulator (@group gitsync).
    // ────────────────────────────────────────────────────────────────────────────
    describe('resolve conflicts during workspace pull', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;
      const MERGE_URL = `${GIT_BASE_URL}/admin/merge`;

      let cfOrgId: string;
      let cfCookie: string[];
      let cfDataSource: DataSource;

      beforeAll(async () => {
        const { organization } = await createUser(app, {
          email: 'git-conflict-resolve.gl@tooljet.io',
          firstName: 'git',
          lastName: 'conflicts',
        });
        cfOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-conflict-resolve.gl@tooljet.io');
        cfCookie = tokenCookie;
        await ensureAppEnvironments(app, cfOrgId);
        cfDataSource = app.get<DataSource>(getDataSourceToken('default'));
        await cfDataSource.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [cfOrgId]
        );
      });

      it('surfaces same-name pull conflicts and resolves them via relink / rename / delete', async () => {
        const { randomUUID } = await import('crypto');
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const agent = () => request.agent(app.getHttpServer());
        const auth = (r: request.Test) => r.set('Cookie', cfCookie).set('tj-workspace-id', cfOrgId);

        const restapiDsOptions = [
          { key: 'url', value: '' },
          { key: 'auth_type', value: 'none' },
          { key: 'headers', value: [['', '']] },
          { key: 'ssl_certificate', value: 'none', encrypted: false },
        ];
        const buttonDiff = () => {
          const id = randomUUID();
          return {
            [id]: {
              name: `btn_${id.slice(0, 6)}`,
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
              },
              styles: { backgroundColor: { value: 'var(--cc-primary-brand)' } },
              parent: null,
            },
          };
        };

        // ── helpers ──────────────────────────────────────────────────────────
        const createApp = async (name: string) =>
          (await auth(agent().post('/api/apps')).send({ icon: 'home', name, type: 'front-end' }).expect(201)).body
            .id as string;
        const createModule = async (name: string) =>
          (await auth(agent().post('/api/modules')).send({ icon: 'folderupload', name, type: 'module' }).expect(201))
            .body.id as string;
        const createDataSource = async (name: string) =>
          (
            await auth(agent().post('/api/data-sources'))
              .send({
                name,
                kind: 'restapi',
                options: restapiDsOptions,
                scope: 'global',
              })
              .expect(201)
          ).body.id as string;
        const editingVersion = async (resourceId: string, branchId?: string) => {
          const detail = await auth(agent().get(`/api/apps/${resourceId}`))
            .query(branchId ? { branch_id: branchId } : {})
            .expect(200);
          const ev = detail.body?.editing_version || detail.body?.editingVersion;
          const pageId = ev.home_page_id || ev.homePageId || ev.pages?.[0]?.id;
          return { versionId: ev.id as string, pageId: pageId as string };
        };
        const addComponent = (resourceId: string, versionId: string, pageId: string, branchId?: string) =>
          auth(agent().post(`/api/v2/apps/${resourceId}/versions/${versionId}/components`))
            .query(branchId ? { branch_id: branchId } : {})
            .send({
              is_user_switched_version: false,
              pageId,
              diff: buttonDiff(),
            })
            .expect(201);
        const addQuery = (dsId: string, versionId: string, name: string, branchId?: string) =>
          auth(agent().post(`/api/data-queries/data-sources/${dsId}/versions/${versionId}`))
            .query(branchId ? { branch_id: branchId } : {})
            .send({
              kind: 'restapi',
              name,
              options: {
                method: 'get',
                url: '',
                headers: [],
                url_params: [],
                body: [],
              },
            })
            .expect(201);
        const gitpush = (
          resourceId: string,
          versionId: string,
          gitName: string,
          branchName: string,
          branchId: string
        ) =>
          auth(agent().post(`/api/app-git/gitpush/${resourceId}/${versionId}`))
            .query({ branch_id: branchId })
            .send({
              gitAppName: gitName,
              versionId,
              lastCommitMessage: `commit ${gitName}`,
              gitVersionName: branchName,
              sourceBranch: branchName,
              targetBranch: branchName,
            })
            .expect(201);
        const pull = (branchId: string) =>
          auth(agent().post('/api/workspace-branches/pull')).query({ branch_id: branchId }).send({ branchId });
        const mergeToMain = async (sourceBranch: string) => {
          const resp = await fetch(MERGE_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: BASIC,
            },
            body: JSON.stringify({
              owner: GIT_REPO_OWNER,
              repo: `${GIT_REPO_NAME}.git`,
              source: sourceBranch,
              target: 'main',
              message: `Land ${sourceBranch}`,
            }),
          });
          expect((await resp.json().catch(() => ({}))).ok).toBe(true);
        };
        const appCorrId = async (resourceId: string) =>
          (await cfDataSource.query(`SELECT co_relation_id FROM apps WHERE id = $1`, [resourceId]))[0]
            ?.co_relation_id as string;
        const dsCorrId = async (dsId: string) =>
          (await cfDataSource.query(`SELECT co_relation_id FROM data_sources WHERE id = $1`, [dsId]))[0]
            ?.co_relation_id as string;
        const setAppCorrId = (resourceId: string, corrId: string) =>
          cfDataSource.query(`UPDATE apps SET co_relation_id = $1 WHERE id = $2`, [corrId, resourceId]);
        const setDsCorrId = (dsId: string, corrId: string) =>
          cfDataSource.query(`UPDATE data_sources SET co_relation_id = $1 WHERE id = $2`, [corrId, dsId]);
        // 409 body: the AllExceptionsFilter forwards only `message`, so the structured conflict payload
        // is a JSON string in body.message → parse it out (mirrors the lifecycle suite's parseConflictGroups).
        const parseConflicts = (body: any): any[] => {
          if (typeof body?.message !== 'string') return [];
          try {
            const parsed = JSON.parse(body.message);
            return Array.isArray(parsed?.conflictGroups) ? parsed.conflictGroups : [];
          } catch {
            return [];
          }
        };
        const corrOf = (grp: any, status: 'incoming' | 'existing') =>
          grp.conflicts.find((c: any) => c.status === status)?.coRelationId as string;

        // ══════════════════════════════════════════════════════════════════════
        // SETUP (git off): author apps + module + data source on the default branch.
        // ══════════════════════════════════════════════════════════════════════
        step(1, 'git-off: create apps (relink/rename/delete/carrier) + module + data source with content');
        const appRelinkId = await createApp('cf-app-relink');
        const appRenameId = await createApp('cf-app-rename');
        const appDeleteId = await createApp('cf-app-delete');
        const appCarrierId = await createApp('cf-app-carrier'); // control — carries the DS; corr-id never diverged
        const modRelinkId = await createModule('cf-mod-relink');
        const dsRelinkId = await createDataSource('cf-ds-relink');

        for (const id of [appRelinkId, appRenameId, appDeleteId, appCarrierId]) {
          const { versionId, pageId } = await editingVersion(id);
          await addComponent(id, versionId, pageId);
        }
        // Link the data source to the carrier app via a query so it serializes into the app's push commit.
        const carrier = await editingVersion(appCarrierId);
        await addQuery(dsRelinkId, carrier.versionId, 'cf_carrier_q');

        // Capture the original correlation ids — these are what git will hold after the push.
        const origRelink = await appCorrId(appRelinkId);
        const origMod = await appCorrId(modRelinkId);
        const origDs = await dsCorrId(dsRelinkId);
        const origCarrier = await appCorrId(appCarrierId); // never diverged → the matched-in-place control

        // ══════════════════════════════════════════════════════════════════════
        // SYNC to git: enable git + branching, push everything onto one feature branch, merge → main.
        // ══════════════════════════════════════════════════════════════════════
        step(2, 'configure git + enable branching');
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);
        const gitConfig = await auth(agent().get(`/api/git-sync/${cfOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: true })
          .expect(200);
        const branchesResp = await auth(agent().get('/api/workspace-branches')).expect(200);
        const mainBranchId: string = branchesResp.body.activeBranchId;
        expect(mainBranchId).toBeDefined();
        await pull(mainBranchId).expect(201);

        // Normalize the git-off-authored versions onto the resolved default branch as unsynced, non-stub
        // 'version' rows (mirrors the sync-unsynced relocation in step 69) so they push cleanly.
        await cfDataSource.query(
          `UPDATE app_versions SET branch_id = $1, version_type = 'version', is_synced = false, is_stub = false
             WHERE app_id = ANY($2)`,
          [mainBranchId, [appRelinkId, appRenameId, appDeleteId, appCarrierId, modRelinkId]]
        );
        await cfDataSource.query(
          `UPDATE data_source_versions SET branch_id = $1, is_synced = false WHERE data_source_id = $2 AND branch_id <> $1`,
          [mainBranchId, dsRelinkId]
        );

        step(3, 'create feat-conflicts branch, gitpush every resource onto it');
        await auth(agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-conflicts', sourceBranchId: mainBranchId })
          .expect(201);
        // create-branch is async (returns { enqueued }); resolve the row id from the list endpoint.
        const featBranchId: string = (
          await auth(agent().get('/api/workspace-branches')).set('x-branch-id', mainBranchId).expect(200)
        ).body.branches.find((b: any) => b.name === 'feat-conflicts')?.id;

        for (const [id, name] of [
          [appRelinkId, 'cf-app-relink'],
          [appRenameId, 'cf-app-rename'],
          [appDeleteId, 'cf-app-delete'],
          [appCarrierId, 'cf-app-carrier'],
        ] as const) {
          const { versionId } = await editingVersion(id, mainBranchId);
          await gitpush(id, versionId, name, 'feat-conflicts', mainBranchId);
        }
        const modVersion = await editingVersion(modRelinkId, mainBranchId);
        await gitpush(modRelinkId, modVersion.versionId, 'cf-mod-relink', 'feat-conflicts', mainBranchId);

        await pull(featBranchId).expect(201);

        // ══════════════════════════════════════════════════════════════════════
        // DIVERGE local correlation ids → manufacture same-name conflicts (carrier untouched).
        // ══════════════════════════════════════════════════════════════════════
        step(4, 'diverge local corr-ids for relink/rename/delete apps + module + data source');
        // Capture the diverged (local) corr-ids so assertions + resolve-conflicts key off values we
        // control, rather than parsing conflict-group keys (a resource collides on BOTH name and slug,
        // producing multiple groups per resource, so conflictKey-based lookups are unreliable).
        const divRelink = randomUUID();
        const divRename = randomUUID();
        const divDelete = randomUUID();
        const divMod = randomUUID();
        const divDs = randomUUID();
        await setAppCorrId(appRelinkId, divRelink);
        await setAppCorrId(appRenameId, divRename);
        await setAppCorrId(appDeleteId, divDelete);
        await setAppCorrId(modRelinkId, divMod);
        await setDsCorrId(dsRelinkId, divDs);
        // A resource is "still conflicting" iff some group lists its diverged corr-id on the EXISTING side.
        const conflictsFor = (groups: any[], existingCorrId: string) =>
          groups.filter((g) =>
            (g.conflicts || []).some((c: any) => c.status === 'existing' && c.coRelationId === existingCorrId)
          );

        step(5, 'merge feat-conflicts → main');
        await mergeToMain('feat-conflicts');

        const logGroups = (label: string, groups: any[]) => {
          const summary = groups
            .map(
              (g) =>
                `${g.type}:${g.conflictKey}[in=${(corrOf(g, 'incoming') || '').slice(0, 8)} ex=${(corrOf(g, 'existing') || '').slice(0, 8)}]`
            )
            .join(', ');
          process.stdout.write(`    ⓘ ${label}: ${groups.length} group(s) → ${summary || '(none)'}\n`);
        };
        const multiDraftsOf = (body: any): any[] => {
          if (typeof body?.message !== 'string') return [];
          try {
            const parsed = JSON.parse(body.message);
            return Array.isArray(parsed?.multiDraftResources) ? parsed.multiDraftResources : [];
          } catch {
            return [];
          }
        };
        // Full DB snapshot for diagnosing an unexpected conflict: apps (name / type / corr-id / non-stub
        // version count) + data sources (name / corr-id). Surfaces duplicates, lingering stubs, and
        // multi-draft situations that would block a pull. Returned as a string so it can be embedded in
        // the failure message (jest may capture stdout, but assertion messages always survive).
        const dumpState = async (): Promise<string> => {
          const apps = await cfDataSource.query(
            `SELECT a.name, a.type, a.co_relation_id,
                    count(*) FILTER (WHERE av.is_stub = false) AS non_stub, count(*) AS total
               FROM apps a JOIN app_versions av ON av.app_id = a.id
              WHERE a.organization_id = $1
              GROUP BY a.id, a.name, a.type, a.co_relation_id ORDER BY a.name`,
            [cfOrgId]
          );
          const ds = await cfDataSource.query(
            `SELECT name, co_relation_id FROM data_sources WHERE organization_id = $1 AND is_dummy = false ORDER BY name`,
            [cfOrgId]
          );
          return (
            'apps:\n' +
            apps
              .map(
                (r: any) =>
                  `  ${r.name} type=${r.type ?? 'app'} corr=${(r.co_relation_id || '').slice(0, 8)} nonStub=${r.non_stub} total=${r.total}`
              )
              .join('\n') +
            '\ndata_sources:\n' +
            ds.map((r: any) => `  ${r.name} corr=${(r.co_relation_id || '').slice(0, 8)}`).join('\n')
          );
        };

        // ══════════════════════════════════════════════════════════════════════
        // PULL #1 → 409 with 5 conflicts (3 apps + 1 module + 1 data source); carrier absent.
        // ══════════════════════════════════════════════════════════════════════
        step(6, 'pull main → 409, conflict details enumerate all diverged resources');
        const pull1 = await pull(mainBranchId).expect(409);
        const groups1 = parseConflicts(pull1.body);
        logGroups('pull#1', groups1);
        // Every diverged resource is flagged (keyed off the diverged corr-id we set, so name/slug
        // duplication doesn't matter); the carrier (corr-id matched git) is NOT flagged.
        expect(conflictsFor(groups1, divRelink).length).toBeGreaterThan(0);
        expect(conflictsFor(groups1, divRename).length).toBeGreaterThan(0);
        expect(conflictsFor(groups1, divDelete).length).toBeGreaterThan(0);
        expect(conflictsFor(groups1, divMod).length).toBeGreaterThan(0);
        expect(conflictsFor(groups1, divDs).length).toBeGreaterThan(0);
        expect(conflictsFor(groups1, origCarrier).length).toBe(0);
        // The incoming side of the relink app's group carries the git (original) corr-id.
        expect(conflictsFor(groups1, divRelink).some((g) => corrOf(g, 'incoming') === origRelink)).toBe(true);

        // Resolution ORDER note: relink is applied LAST. resolve-conflicts marks the relinked
        // app/module version is_stub=true and relies on the very next pull to hydrate it, so it must run
        // immediately before the final (successful) pull. rename/delete clear a conflict without leaving
        // a stub, so they go first while the other conflicts still block the pull — which also lets us
        // watch the conflict response shrink toward zero.

        // ── RESOLUTION 1 — rename: change BOTH name AND slug so neither collides with the incoming git
        // resource. The conflict detector flags name AND slug independently (git-off apps get a UUID
        // slug that still matches git after a name-only rename), so the slug must be renamed too. ──
        step(7, 'resolve via RENAME: rename local cf-app-rename (name + slug) → pull shrinks by one');
        const renameV = await editingVersion(appRenameId, mainBranchId);
        await auth(agent().put(`/api/apps/${appRenameId}`))
          .query({ branch_id: mainBranchId })
          .send({
            app: { name: 'cf-app-rename-local', slug: 'cf-app-rename-local', editingVersionId: renameV.versionId },
          })
          .expect(200);
        const pull2 = await pull(mainBranchId).expect(409);
        const groups2 = parseConflicts(pull2.body);
        logGroups('pull#2 (after rename)', groups2);
        expect(conflictsFor(groups2, divRename).length).toBe(0); // rename (name + slug) resolved
        expect(conflictsFor(groups2, divDelete).length).toBeGreaterThan(0); // delete still pending

        // ── RESOLUTION 2 — delete: local row removed, so the incoming git resource imports fresh. ──
        step(8, 'resolve via DELETE: delete local cf-app-delete → pull shrinks by one more');
        await auth(agent().delete(`/api/apps/${appDeleteId}`))
          .query({ branch_id: mainBranchId })
          .expect(200);
        const pull3 = await pull(mainBranchId).expect(409);
        const groups3 = parseConflicts(pull3.body);
        logGroups('pull#3 (after delete)', groups3);
        expect(conflictsFor(groups3, divDelete).length).toBe(0); // delete resolved
        // Only the relink-targeted resources (app + module + data source) remain unresolved now.
        expect(conflictsFor(groups3, divRelink).length).toBeGreaterThan(0);
        expect(conflictsFor(groups3, divMod).length).toBeGreaterThan(0);
        expect(conflictsFor(groups3, divDs).length).toBeGreaterThan(0);

        // ── RESOLUTION 3 — relink: local rows adopt the remote corr-id + are marked synced. Built from
        // the corr-ids we control (diverged → original), independent of the name/slug group shapes. ──
        step(9, 'resolve via RELINK: resolve-conflicts for app + module + data source (adopt remote corr-id)');
        await auth(agent().post('/api/workspace-branches/resolve-conflicts'))
          .send({
            branchId: mainBranchId,
            resolutions: [
              {
                type: 'app',
                existingCoRelationId: divRelink,
                incomingCoRelationId: origRelink,
              },
              {
                type: 'module',
                existingCoRelationId: divMod,
                incomingCoRelationId: origMod,
              },
              {
                type: 'datasource',
                existingCoRelationId: divDs,
                incomingCoRelationId: origDs,
              },
            ],
          })
          .expect(201);
        // Local rows now carry the remote correlation id (linked to the git resource, not duplicated).
        expect(await appCorrId(appRelinkId)).toBe(origRelink);
        expect(await appCorrId(modRelinkId)).toBe(origMod);
        expect(await dsCorrId(dsRelinkId)).toBe(origDs);

        step(10, 'pull main → 201, all conflicts resolved');
        const finalPull = await pull(mainBranchId);
        if (finalPull.status !== 201) {
          const cg = parseConflicts(finalPull.body);
          logGroups('final pull (unexpected 409) conflictGroups', cg);
          const diag = [
            `Final pull expected 201, got ${finalPull.status}.`,
            `conflictGroups (${cg.length}): ${JSON.stringify(cg)}`,
            `multiDraftResources: ${JSON.stringify(multiDraftsOf(finalPull.body))}`,
            `rawMessage: ${String(finalPull.body?.message).slice(0, 2000)}`,
            `DB state:\n${await dumpState()}`,
          ].join('\n');
          process.stdout.write(`\n${diag}\n`);
          throw new Error(diag);
        }
        expect(finalPull.status).toBe(201);
      }, 600000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Part 5 — Create a feature branch from a saved (or released) version.
    //
    // POST /api/workspace-branches accepts { appId, versionId } to branch FROM a specific saved version:
    // the service gitPushApp()s that version's content onto the new remote branch before stubbing it.
    // Flow: author git-off (publish v1 + a draft) → enable git → sync the draft to main → the git-off
    // saved version stays is_synced=false, the synced draft publishes as a synced version → branch from
    // that saved version → edit + save a version on the feature branch → merge → the new version appears
    // in main's version list. It must be is_synced=true there (git holds its content). The final
    // assertion carries a full diagnostic dump so any is_synced gap is pinpointed on the first run.
    // Runs against the real Gitea simulator (@group gitsync).
    // ────────────────────────────────────────────────────────────────────────────
    describe('create feature branch from a saved version', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;
      const MERGE_URL = `${GIT_BASE_URL}/admin/merge`;

      let bvOrgId: string;
      let bvCookie: string[];
      let bvDataSource: DataSource;

      beforeAll(async () => {
        const { organization } = await createUser(app, {
          email: 'git-branch-from-version.gl@tooljet.io',
          firstName: 'git',
          lastName: 'branchfromversion',
        });
        bvOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-branch-from-version.gl@tooljet.io');
        bvCookie = tokenCookie;
        await ensureAppEnvironments(app, bvOrgId);
        bvDataSource = app.get<DataSource>(getDataSourceToken('default'));
        await bvDataSource.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [bvOrgId]
        );
      });

      it('branches from a saved version, saves a version on it, and surfaces it synced on main', async () => {
        const { randomUUID } = await import('crypto');
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const agent = () => request.agent(app.getHttpServer());
        const auth = (r: request.Test) => r.set('Cookie', bvCookie).set('tj-workspace-id', bvOrgId);

        const buttonDiff = () => {
          const id = randomUUID();
          return {
            [id]: {
              name: `btn_${id.slice(0, 6)}`,
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
              },
              styles: { backgroundColor: { value: 'var(--cc-primary-brand)' } },
              parent: null,
            },
          };
        };
        const editingVersion = async (appId: string, branchId?: string) => {
          const detail = await auth(agent().get(`/api/apps/${appId}`))
            .query(branchId ? { branch_id: branchId } : {})
            .expect(200);
          const ev = detail.body?.editing_version || detail.body?.editingVersion;
          const pageId = ev.home_page_id || ev.homePageId || ev.pages?.[0]?.id;
          return { versionId: ev.id as string, pageId: pageId as string };
        };
        const addComponent = (appId: string, versionId: string, pageId: string, branchId?: string) =>
          auth(agent().post(`/api/v2/apps/${appId}/versions/${versionId}/components`))
            .query(branchId ? { branch_id: branchId } : {})
            .send({
              is_user_switched_version: false,
              pageId,
              diff: buttonDiff(),
            });
        const publishVersion = (appId: string, versionId: string, name: string, branchId?: string) =>
          auth(agent().put(`/api/app-git/${appId}/versions/${versionId}`))
            .query(branchId ? { branch_id: branchId } : {})
            .send({ is_user_switched_version: false, name, description: `save ${name}`, status: 'PUBLISHED' });
        const createDraftFrom = (
          appId: string,
          versionFromId: string,
          name: string,
          envId: string,
          branchId?: string
        ) =>
          auth(agent().post(`/api/apps/${appId}/versions`))
            .query(branchId ? { branch_id: branchId } : {})
            .send({
              versionName: name,
              versionFromId,
              environmentId: envId,
              versionType: 'version',
            });
        const gitpush = (appId: string, versionId: string, gitName: string, branchName: string, branchId: string) =>
          auth(agent().post(`/api/app-git/gitpush/${appId}/${versionId}`))
            .query({ branch_id: branchId })
            .send({
              gitAppName: gitName,
              versionId,
              lastCommitMessage: `commit ${gitName}`,
              gitVersionName: branchName,
              sourceBranch: branchName,
              targetBranch: branchName,
            });
        const pull = (branchId: string) =>
          auth(agent().post('/api/workspace-branches/pull')).query({ branch_id: branchId }).send({ branchId });
        const mergeToMain = async (sourceBranch: string) => {
          const resp = await fetch(MERGE_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: BASIC,
            },
            body: JSON.stringify({
              owner: GIT_REPO_OWNER,
              repo: `${GIT_REPO_NAME}.git`,
              source: sourceBranch,
              target: 'main',
              message: `Land ${sourceBranch}`,
            }),
          });
          expect((await resp.json().catch(() => ({}))).ok).toBe(true);
        };
        // Save a version = check no remote tag yet → publish the draft. Publishing auto-creates the
        // git tag server-side (backend-owned tagging) and marks the version synced — no separate
        // tag call (the standalone tag endpoint was removed).
        const saveVersion = async (appId: string, versionId: string, name: string, branchId: string) => {
          await auth(agent().get(`/api/app-git/${appId}/check-tag`))
            .query({ versionName: name, branch_id: branchId })
            .expect(200);
          const pubResp = await publishVersion(appId, versionId, name, branchId);
          if (pubResp.status !== 200) {
            const diag = `publish ${name} (branch ${branchId}) got ${pubResp.status}: ${JSON.stringify(pubResp.body)}\nDB versions:\n${await dumpVersions()}`;
            process.stdout.write(`\n${diag}\n`);
            throw new Error(diag);
          }
        };
        const versionSynced = async (versionId: string) =>
          (await bvDataSource.query(`SELECT is_synced FROM app_versions WHERE id = $1`, [versionId]))[0]?.is_synced;
        const listVersions = async (appId: string, branchId: string) =>
          (
            await auth(agent().get(`/api/apps/${appId}/versions`))
              .query({ branch_id: branchId })
              .expect(200)
          ).body.versions as any[];
        const dumpVersions = async (): Promise<string> => {
          const rows = await bvDataSource.query(
            `SELECT av.name, av.status, av.version_type, av.is_stub, av.is_synced, w.branch_name
               FROM app_versions av LEFT JOIN organization_git_sync_branches w ON w.id = av.branch_id
              WHERE av.app_id = $1 ORDER BY w.branch_name, av.created_at`,
            [appIdRef]
          );
          return rows
            .map(
              (r: any) =>
                `  [${r.branch_name}] ${r.name} status=${r.status} type=${r.version_type} stub=${r.is_stub} synced=${r.is_synced}`
            )
            .join('\n');
        };
        let appIdRef = '';

        // ══════════════════════════════════════════════════════════════════════
        // SETUP (git off): create app, save v1, create a draft.
        // ══════════════════════════════════════════════════════════════════════
        step(1, 'git-off: create app + component, publish v1, create a draft');
        const appId: string = (
          await auth(agent().post('/api/apps'))
            .send({ icon: 'home', name: 'branch-from-version-app', type: 'front-end' })
            .expect(201)
        ).body.id;
        appIdRef = appId;
        const devEnv = (await auth(agent().get('/api/app-environments')).expect(200)).body.environments.sort(
          (a: any, b: any) => a.priority - b.priority
        )[0];

        const v0 = await editingVersion(appId);
        await addComponent(appId, v0.versionId, v0.pageId).expect(201);
        const v1Id = v0.versionId;
        await publishVersion(appId, v1Id, 'v1').expect(200); // git-off saved version (never pushed)
        // git-off publish seeds no continuity draft → create one explicitly from v1.
        const draftResp = await createDraftFrom(appId, v1Id, 'draft-1', devEnv.id).expect(201);
        const draftId: string = draftResp.body.id;

        // ══════════════════════════════════════════════════════════════════════
        // ENABLE GIT + SYNC the draft to main (feature branch → merge → pull main).
        // ══════════════════════════════════════════════════════════════════════
        step(2, 'configure git + branching, normalize versions onto the default branch');
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);
        const gitConfig = await auth(agent().get(`/api/git-sync/${bvOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: true })
          .expect(200);
        const mainBranchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body
          .activeBranchId;
        await pull(mainBranchId).expect(201);
        await bvDataSource.query(
          `UPDATE app_versions SET branch_id = $1, version_type = 'version', is_synced = false, is_stub = false
             WHERE app_id = $2`,
          [mainBranchId, appId]
        );

        step(3, 'sync the draft to main: branch feat-sync, gitpush the draft, pull, merge → main, pull main');
        const featSyncId: string = (
          await auth(agent().post('/api/workspace-branches'))
            .query({ branch_id: mainBranchId })
            .send({ name: 'feat-sync', sourceBranchId: mainBranchId })
            .expect(201)
        ).body.id;
        await gitpush(appId, draftId, 'branch-from-version-app', 'feat-sync', mainBranchId).expect(201);
        await pull(featSyncId).expect(201);
        await mergeToMain('feat-sync');
        await pull(mainBranchId).expect(201);

        // ══════════════════════════════════════════════════════════════════════
        // ASSERT sync state: git-off saved version stays unsynced; the synced draft publishes as synced.
        // ══════════════════════════════════════════════════════════════════════
        step(4, 'git-off saved version v1 stays is_synced=false; publish the synced draft → v2 is_synced=true');
        expect(await versionSynced(v1Id)).toBe(false);
        expect(await versionSynced(draftId)).toBe(true); // draft became synced via the pull

        await saveVersion(appId, draftId, 'v2', mainBranchId); // publish + tag → v2 (synced)
        const v2Id = draftId;
        expect(await versionSynced(v2Id)).toBe(true);

        // ══════════════════════════════════════════════════════════════════════
        // BRANCH FROM the saved version v2, edit, and save a version on the feature branch.
        // ══════════════════════════════════════════════════════════════════════
        step(5, 'create a feature branch FROM saved version v2 (POST /workspace-branches { appId, versionId })');
        const featFromResp = await auth(agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({
            name: 'feat-from-v2',
            sourceBranchId: mainBranchId,
            appId,
            versionId: v2Id,
          });
        if (featFromResp.status !== 201) {
          const diag = `create-branch-from-version got ${featFromResp.status}: ${JSON.stringify(featFromResp.body)}\nDB versions:\n${await dumpVersions()}`;
          process.stdout.write(`\n${diag}\n`);
          throw new Error(diag);
        }
        // create-branch is async (returns { enqueued }); resolve the row id from the list endpoint.
        const featFromId: string = (
          await auth(agent().get('/api/workspace-branches')).set('x-branch-id', mainBranchId).expect(200)
        ).body.branches.find((b: any) => b.name === 'feat-from-v2')?.id;
        expect(featFromId).toBeDefined();

        step(6, 'pull feat-from-v2 → the app is present; edit it on the feature branch');
        await pull(featFromId).expect(201);
        const featApps = await auth(agent().get('/api/apps'))
          .query({
            page: 1,
            folder: '',
            searchKey: '',
            type: 'front-end',
            branch_id: featFromId,
          })
          .expect(200);
        expect(featApps.body.apps.find((a: any) => a.id === appId)).toBeDefined();
        const featCtx = await editingVersion(appId, featFromId);
        await addComponent(appId, featCtx.versionId, featCtx.pageId, featFromId).expect(201);

        step(7, 'save version v44 on the feature branch (check-tag → publish → tag)');
        await saveVersion(appId, featCtx.versionId, 'v44', featFromId);

        step(8, 'merge feat-from-v2 → main, pull main');
        await mergeToMain('feat-from-v2');
        await pull(mainBranchId).expect(201);

        // ══════════════════════════════════════════════════════════════════════
        // ASSERT: the version saved on the feature branch is visible on main AND is_synced=true.
        // ══════════════════════════════════════════════════════════════════════
        step(9, 'main version list includes v44 with is_synced=true (git holds its content)');
        const mainVersions = await listVersions(appId, mainBranchId);
        const v44 = mainVersions.find((v: any) => v.name === 'v44');
        if (!v44 || (v44.is_synced ?? v44.isSynced) !== true) {
          const diag = [
            `v44 on main: ${JSON.stringify(v44)}`,
            `all main versions: ${JSON.stringify(mainVersions.map((v: any) => ({ name: v.name, status: v.status, is_synced: v.is_synced ?? v.isSynced })))}`,
            `DB versions:\n${await dumpVersions()}`,
          ].join('\n');
          process.stdout.write(`\n${diag}\n`);
          throw new Error(`Expected v44 visible on main with is_synced=true.\n${diag}`);
        }
        expect(v44.is_synced ?? v44.isSynced).toBe(true);
      }, 600000);
    });

    // GitLab mirror of git-sync.spec.ts §8 "push unsynced datasources only". Verifies
    // scope='datasource' pushes only unsynced DSVs and leaves already-synced files
    // byte-identical in git — same assertions as the GitHub suite, GitLab provider config.
    describe('push unsynced datasources only (scope: datasource)', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;

      let dsScopeOrgId: string;
      let dsScopeCookie: string[];
      let dsScopeDataSource: DataSource;

      beforeAll(async () => {
        const { organization } = await createUser(app, {
          email: 'gitlab-ds-scope@tooljet.io',
          firstName: 'gitlab',
          lastName: 'dsscope',
        });
        dsScopeOrgId = organization.id;
        const { tokenCookie } = await login(app, 'gitlab-ds-scope@tooljet.io');
        dsScopeCookie = tokenCookie;
        await ensureAppEnvironments(app, dsScopeOrgId);
        dsScopeDataSource = app.get<DataSource>(getDataSourceToken('default'));
        await dsScopeDataSource.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [dsScopeOrgId]
        );
      });

      it('pushes only unsynced datasources, leaving already-synced ones untouched in git', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const agent = () => request.agent(app.getHttpServer());
        const auth = (r: request.Test) => r.set('Cookie', dsScopeCookie).set('tj-workspace-id', dsScopeOrgId);

        const restapiOptions = (url: string) => [
          { key: 'url', value: url },
          { key: 'auth_type', value: 'none' },
          { key: 'headers', value: [['', '']] },
          { key: 'ssl_certificate', value: 'none', encrypted: false },
        ];

        const createDataSource = (name: string, branchId: string, url: string) =>
          auth(agent().post(`/api/data-sources?branch_id=${branchId}`))
            .send({
              name,
              kind: 'restapi',
              options: restapiOptions(url),
              scope: 'global',
            })
            .expect(201);

        const pushWorkspace = (branchId: string, commitMessage: string, scope?: string, onlyUnsynced?: boolean) =>
          auth(agent().post('/api/workspace-branches/push'))
            .query({ branch_id: branchId })
            .send({
              commitMessage,
              branchId,
              ...(scope && { scope }),
              ...(onlyUnsynced && { onlyUnsyncedDatasources: true }),
            });

        const pull = (branchId: string) =>
          auth(agent().post('/api/workspace-branches/pull')).query({ branch_id: branchId }).send({ branchId });

        // Shallow-clone a branch and read a file's raw content off disk — the Gitea
        // simulator at this host doesn't serve a raw/contents API.
        const readGitFile = async (branch: string, relPath: string): Promise<string | null> => {
          const simpleGit = (await import('simple-git')).default;
          const fs = await import('fs');
          const path = await import('path');
          const os = await import('os');
          const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tj-gl-ds-scope-'));
          try {
            const git = simpleGit({
              baseDir: tmpDir,
              timeout: { block: 30000 },
              unsafe: { allowUnsafeCredentialHelper: true },
            });
            await git.clone(`${GIT_BASE_URL}/${GIT_REPO_PATH}.git`, '.', [
              '--branch',
              branch,
              '--depth',
              '1',
              '--single-branch',
            ]);
            const filePath = path.join(tmpDir, relPath);
            return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;
          } finally {
            await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
          }
        };

        const isSyncedOnBranch = async (dsId: string, branchId: string) =>
          (
            await dsScopeDataSource.query(
              `SELECT is_synced FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`,
              [dsId, branchId]
            )
          )[0]?.is_synced;

        // Everything below stays on a single feature branch — the shared test Gitea
        // blocks direct pushes to the protected default branch (see test-env note in
        // lifecycle-cases.md), and serializeDataSources doesn't care which branch it's
        // serializing for, so a feature branch exercises the same code path.
        step(1, 'reset gitea repo, configure git + branching, pull main');
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);
        const gitConfig = await auth(agent().get(`/api/git-sync/${dsScopeOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: true })
          .expect(200);
        const mainBranchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body
          .activeBranchId;
        await pull(mainBranchId).expect(201);

        step(2, 'create feat-ds-scope; create ds-scope-synced + ds-scope-unsynced on it');
        await auth(agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-ds-scope', sourceBranchId: mainBranchId })
          .expect(201);
        // create-branch is async (returns { enqueued }); resolve the row id from the list endpoint.
        const featBranchId: string = (
          await auth(agent().get('/api/workspace-branches')).set('x-branch-id', mainBranchId).expect(200)
        ).body.branches.find((b: any) => b.name === 'feat-ds-scope')?.id;

        const syncedDsId: string = (
          await createDataSource('ds-scope-synced', featBranchId, 'http://synced.example.com')
        ).body.id;
        const unsyncedDsId: string = (
          await createDataSource('ds-scope-unsynced', featBranchId, 'http://unsynced-v1.example.com')
        ).body.id;

        step(3, 'full push (both DS) → both files committed and marked is_synced=true on feat-ds-scope');
        const push1 = await pushWorkspace(featBranchId, 'commit both datasources');
        if (push1.status !== 201) {
          throw new Error(`initial push failed: ${push1.status} ${JSON.stringify(push1.body)}`);
        }

        // Layout is folder-per-datasource: data-sources/<ds-name>/data-source.json.
        // The folder name is the branch DSV name; resolve it from the DB so the
        // path stays correct even if name-resolution logic changes.
        const dsGitPath = async (dsId: string) => {
          const name = (
            await dsScopeDataSource.query(
              `SELECT name FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`,
              [dsId, featBranchId]
            )
          )[0].name;
          return `data-sources/${name}/data-source.json`;
        };
        const syncedDsPath = await dsGitPath(syncedDsId);
        const unsyncedDsPath = await dsGitPath(unsyncedDsId);

        expect(await isSyncedOnBranch(syncedDsId, featBranchId)).toBe(true);
        expect(await isSyncedOnBranch(unsyncedDsId, featBranchId)).toBe(true);

        // Capture the exact committed content for the DS that will stay synced —
        // it must be byte-identical after the unsynced-only push below.
        const syncedFileBefore = await readGitFile('feat-ds-scope', syncedDsPath);
        expect(syncedFileBefore).not.toBeNull();

        step(4, 'edit ds-scope-unsynced (real content change) and flip it back to unsynced');
        // A raw is_synced=false flip alone isn't representative: the serialized JSON would be
        // byte-identical to what's already committed, so pushWorkspace's `status.files.length === 0`
        // early-return would fire before it ever reaches the isSynced=true marking step. Give it a
        // genuine content change too, matching a real "locally edited but not yet pushed" DS.
        const unsyncedDsvId = (
          await dsScopeDataSource.query(
            `SELECT id FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`,
            [unsyncedDsId, featBranchId]
          )
        )[0].id;
        await dsScopeDataSource.query(
          `UPDATE data_source_version_options
             SET options = REPLACE(options::text, 'unsynced-v1', 'unsynced-v2-edited')::jsonb
             WHERE data_source_version_id = $1`,
          [unsyncedDsvId]
        );
        await dsScopeDataSource.query(
          `UPDATE data_source_versions SET is_synced = false WHERE data_source_id = $1 AND branch_id = $2`,
          [unsyncedDsId, featBranchId]
        );
        expect(await isSyncedOnBranch(syncedDsId, featBranchId)).toBe(true);
        expect(await isSyncedOnBranch(unsyncedDsId, featBranchId)).toBe(false);

        step(5, "push scope='datasource' → only ds-scope-unsynced should be (re)committed");
        const push2 = await pushWorkspace(featBranchId, 'sync unsynced datasources', 'datasource', true);
        if (push2.status !== 201) {
          throw new Error(`scoped push failed: ${push2.status} ${JSON.stringify(push2.body)}`);
        }

        step(6, 'ds-scope-synced file in git is byte-identical (untouched) and NOT deleted');
        const syncedFileAfter = await readGitFile('feat-ds-scope', syncedDsPath);
        expect(syncedFileAfter).not.toBeNull();
        expect(syncedFileAfter).toBe(syncedFileBefore);

        step(7, 'ds-scope-unsynced file exists in git, reflects the edit, and its DSV is marked synced again');
        const unsyncedFileAfter = await readGitFile('feat-ds-scope', unsyncedDsPath);
        expect(unsyncedFileAfter).not.toBeNull();
        expect(unsyncedFileAfter).toContain('unsynced-v2-edited');
        expect(unsyncedFileAfter).not.toBe(syncedFileBefore); // sanity: not comparing against the wrong file
        expect(await isSyncedOnBranch(unsyncedDsId, featBranchId)).toBe(true);

        step(8, 'ds-scope-synced remains synced in the DB too — untouched by the unsynced-only push');
        expect(await isSyncedOnBranch(syncedDsId, featBranchId)).toBe(true);
      }, 300000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Part 7 — Pull-skip via git tree SHAs (change detection).
    //
    // Pull is short-circuited at three granularities using git's own tree SHAs as
    // content hashes (a tree object's SHA changes iff something beneath it changed):
    //   - whole pull   : remote branch HEAD (ls-remote) vs organization_git_sync_branches.last_synced_commit
    //   - category     : tree SHA of apps/ · modules/ · data-sources/ vs *_git_tree_sha on the branch row
    //   - per-resource : tree SHA of apps/<app>/ · data-sources/<ds>/ vs app_versions/data_source_versions.git_tree_sha
    //
    // All tokens are READ from git and STORED on PULL only (push never stamps them).
    // The observable effect of a skip is that the pull's orphan sweep — which marks
    // is_synced=false any default-branch DB resource absent from git — does NOT run
    // for the skipped scope, so a manufactured orphan survives as is_synced=true.
    // The orphan sweep is gated to the DEFAULT branch, so these tests operate on main
    // (content lands on main via the admin /merge, mirroring the conflict suite).
    // Runs against the real Gitea simulator (@group gitsync).
    // ────────────────────────────────────────────────────────────────────────────
    describe('pull skip — token storage + whole-pull skip (git tree SHAs)', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;
      const MERGE_URL = `${GIT_BASE_URL}/admin/merge`;

      let psOrgId: string;
      let psCookie: string[];
      let psDataSource: DataSource;

      beforeAll(async () => {
        const { organization } = await createUser(app, {
          email: 'git-pull-skip-gl@tooljet.io',
          firstName: 'git',
          lastName: 'pullskip',
        });
        psOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-pull-skip-gl@tooljet.io');
        psCookie = tokenCookie;
        await ensureAppEnvironments(app, psOrgId);
        psDataSource = app.get<DataSource>(getDataSourceToken('default'));
        await psDataSource.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [psOrgId]
        );
      });

      it('stores tree-SHA tokens on pull and skips the whole pull when the remote HEAD is unchanged', async () => {
        const { randomUUID } = await import('crypto');
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const agent = () => request.agent(app.getHttpServer());
        const auth = (r: request.Test) => r.set('Cookie', psCookie).set('tj-workspace-id', psOrgId);

        const restapiDsOptions = [
          { key: 'url', value: 'http://ps.example.com' },
          { key: 'auth_type', value: 'none' },
          { key: 'headers', value: [['', '']] },
          { key: 'ssl_certificate', value: 'none', encrypted: false },
        ];
        const buttonDiff = () => {
          const id = randomUUID();
          return {
            [id]: {
              name: `btn_${id.slice(0, 6)}`,
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
              },
              styles: { backgroundColor: { value: 'var(--cc-primary-brand)' } },
              parent: null,
            },
          };
        };

        // ── helpers (mirror the conflict / branch-from-version suites) ─────────
        // With branching enabled the app-create endpoint needs branchId in the BODY too (and the
        // branch must be a feature branch). Git-off authoring (no branchId) is used for the app that
        // gets normalized onto main + gitpushed, matching the branch-from-version suite.
        const createApp = async (name: string, branchId?: string) =>
          (
            await auth(agent().post('/api/apps'))
              .query(branchId ? { branch_id: branchId } : {})
              .send({
                icon: 'home',
                name,
                type: 'front-end',
                ...(branchId ? { branchId } : {}),
              })
              .expect(201)
          ).body.id as string;
        const createDataSource = async (name: string, branchId: string) =>
          (
            await auth(agent().post(`/api/data-sources?branch_id=${branchId}`))
              .send({
                name,
                kind: 'restapi',
                options: restapiDsOptions,
                scope: 'global',
              })
              .expect(201)
          ).body.id as string;
        const editingVersion = async (resourceId: string, branchId?: string) => {
          const detail = await auth(agent().get(`/api/apps/${resourceId}`))
            .query(branchId ? { branch_id: branchId } : {})
            .expect(200);
          const ev = detail.body?.editing_version || detail.body?.editingVersion;
          const pageId = ev.home_page_id || ev.homePageId || ev.pages?.[0]?.id;
          return { versionId: ev.id as string, pageId: pageId as string };
        };
        const addComponent = (resourceId: string, versionId: string, pageId: string, branchId?: string) =>
          auth(agent().post(`/api/v2/apps/${resourceId}/versions/${versionId}/components`))
            .query(branchId ? { branch_id: branchId } : {})
            .send({
              is_user_switched_version: false,
              pageId,
              diff: buttonDiff(),
            })
            .expect(201);
        const gitpush = (
          resourceId: string,
          versionId: string,
          gitName: string,
          branchName: string,
          branchId: string
        ) =>
          auth(agent().post(`/api/app-git/gitpush/${resourceId}/${versionId}`))
            .query({ branch_id: branchId })
            .send({
              gitAppName: gitName,
              versionId,
              lastCommitMessage: `commit ${gitName}`,
              gitVersionName: branchName,
              sourceBranch: branchName,
              targetBranch: branchName,
            })
            .expect(201);
        const pushDataSources = (branchId: string, commitMessage: string, onlyUnsynced?: boolean) =>
          auth(agent().post('/api/workspace-branches/push'))
            .query({ branch_id: branchId })
            .send({
              commitMessage,
              branchId,
              scope: 'datasource',
              ...(onlyUnsynced && { onlyUnsyncedDatasources: true }),
            });
        const pull = (branchId: string) =>
          auth(agent().post('/api/workspace-branches/pull')).query({ branch_id: branchId }).send({ branchId });
        const mergeToMain = async (sourceBranch: string) => {
          const resp = await fetch(MERGE_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: BASIC,
            },
            body: JSON.stringify({
              owner: GIT_REPO_OWNER,
              repo: `${GIT_REPO_NAME}.git`,
              source: sourceBranch,
              target: 'main',
              message: `Land ${sourceBranch}`,
            }),
          });
          expect((await resp.json().catch(() => ({}))).ok).toBe(true);
        };
        const branchIdByName = async (name: string, xBranchId: string): Promise<string> =>
          (
            await auth(agent().get('/api/workspace-branches')).set('x-branch-id', xBranchId).expect(200)
          ).body.branches.find((b: any) => b.name === name)?.id;
        const branchTokens = async (branchId: string) =>
          (
            await psDataSource.query(
              `SELECT last_synced_commit, apps_git_tree_sha, data_sources_git_tree_sha
                 FROM organization_git_sync_branches WHERE id = $1`,
              [branchId]
            )
          )[0];

        // ══════════════════════════════════════════════════════════════════════
        step(1, 'git-off: author an app + component (normalized onto main below)');
        const skipAppId = await createApp('ps-skip-app'); // git off → no branch_id
        const v0 = await editingVersion(skipAppId);
        await addComponent(skipAppId, v0.versionId, v0.pageId);
        const appVersionId = v0.versionId;

        step(2, 'reset gitea repo, configure git + branching, resolve main branch, pull main');
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);
        const gitConfig = await auth(agent().get(`/api/git-sync/${psOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: true })
          .expect(200);
        const mainBranchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body
          .activeBranchId;
        expect(mainBranchId).toBeDefined();
        await pull(mainBranchId).expect(201);

        // Normalize the git-off version onto the resolved default branch as an unsynced, non-stub
        // 'version' row so gitpush accepts it (mirrors the branch-from-version suite).
        await psDataSource.query(
          `UPDATE app_versions SET branch_id = $1, version_type = 'version', is_synced = false, is_stub = false
             WHERE app_id = $2`,
          [mainBranchId, skipAppId]
        );

        step(3, 'create feat-skip branch, gitpush the app + push a datasource onto it, merge → main');
        await auth(agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-skip', sourceBranchId: mainBranchId })
          .expect(201);
        const featBranchId = await branchIdByName('feat-skip', mainBranchId);
        expect(featBranchId).toBeDefined();

        await gitpush(skipAppId, appVersionId, 'ps-skip-app', 'feat-skip', mainBranchId);

        const skipDsId = await createDataSource('ps-skip-ds', featBranchId);
        const push = await pushDataSources(featBranchId, 'commit ps-skip-ds', true);
        expect(push.status).toBe(201);

        await mergeToMain('feat-skip');

        step(4, 'pull main → full pull (imports the app + datasource); expect 201');
        await pull(mainBranchId).expect(201);

        // ══════════════════════════════════════════════════════════════════════
        step(5, 'tokens stored on pull: branch commit + category tree SHAs + per-resource tree SHAs are non-null');
        const tokens = await branchTokens(mainBranchId);
        expect(tokens.last_synced_commit).toBeTruthy();
        expect(tokens.apps_git_tree_sha).toBeTruthy();
        expect(tokens.data_sources_git_tree_sha).toBeTruthy();

        // Per-app tree SHA is stamped on MATERIALIZATION, not on the pull that merely flags an
        // app 'outdated'. skipAppId was normalized onto main as a stale non-stub, so the pull
        // leaves its git_tree_sha null (the "needs re-hydration" signal); opening the app hydrates
        // it from git and stamps the app-folder tree SHA. Open it, then assert.
        await auth(agent().get(`/api/apps/${skipAppId}`))
          .query({ branch_id: mainBranchId })
          .expect(200);
        const appVersionSha = await psDataSource.query(
          `SELECT git_tree_sha FROM app_versions WHERE app_id = $1 AND branch_id = $2 AND git_tree_sha IS NOT NULL`,
          [skipAppId, mainBranchId]
        );
        expect(appVersionSha.length).toBeGreaterThan(0);

        // Per-datasource: the DSV on main carries the data-source-folder tree SHA.
        const dsVersionSha = await psDataSource.query(
          `SELECT git_tree_sha FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2 AND git_tree_sha IS NOT NULL`,
          [skipDsId, mainBranchId]
        );
        expect(dsVersionSha.length).toBeGreaterThan(0);

        // ══════════════════════════════════════════════════════════════════════
        // WHOLE-PULL SKIP — remote HEAD == last_synced_commit ⇒ no clone, no sweep.
        // ══════════════════════════════════════════════════════════════════════
        step(6, 'manufacture an orphan app on main (DB-only, git HEAD unchanged), then pull → whole-pull skip');
        // Create the app on a throwaway feature branch, then SQL-move its version onto main as a
        // previously-pulled, synced default-branch row that is absent from git → an orphan. Because
        // git HEAD hasn't moved since step 4's full pull, the whole-pull skip must fire and the orphan
        // sweep must NOT run — the row stays is_synced=true.
        await auth(agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-skip-orphan', sourceBranchId: mainBranchId })
          .expect(201);
        const orphanBranchId = await branchIdByName('feat-skip-orphan', mainBranchId);
        const orphanAppId = await createApp('ps-orphan-app', orphanBranchId);
        await psDataSource.query(
          `UPDATE app_versions SET version_type = 'version', branch_id = $1, is_synced = true, git_tree_sha = 'orphan-synced-tree-sha-000000000000000000000000' WHERE app_id = $2`,
          [mainBranchId, orphanAppId]
        );

        // Sanity: HEAD really is unchanged, so the skip is what we're exercising.
        const beforeSkip = await branchTokens(mainBranchId);
        expect(beforeSkip.last_synced_commit).toBe(tokens.last_synced_commit);

        await pull(mainBranchId).expect(201);

        const orphanAfterSkip = await psDataSource.query(
          `SELECT is_synced FROM app_versions WHERE app_id = $1 AND branch_id = $2`,
          [orphanAppId, mainBranchId]
        );
        expect(orphanAfterSkip).toHaveLength(1);
        // Skip fired → orphan survives untouched.
        expect(orphanAfterSkip[0].is_synced).toBe(true);
        // Tokens are unchanged by a skipped pull.
        const afterSkip = await branchTokens(mainBranchId);
        expect(afterSkip.last_synced_commit).toBe(tokens.last_synced_commit);
        expect(afterSkip.apps_git_tree_sha).toBe(tokens.apps_git_tree_sha);

        // ══════════════════════════════════════════════════════════════════════
        // CONTROL — clearing the tokens forces a full pull, which DOES sweep the
        // orphan. This isolates the skip as the sole reason it survived above.
        // ══════════════════════════════════════════════════════════════════════
        step(7, 'clear skip tokens on main → pull runs in full → the synced orphan is now deleted');
        await psDataSource.query(
          `UPDATE organization_git_sync_branches
             SET last_synced_commit = NULL, apps_git_tree_sha = NULL, modules_git_tree_sha = NULL, data_sources_git_tree_sha = NULL
           WHERE id = $1`,
          [mainBranchId]
        );
        await pull(mainBranchId).expect(201);
        // Full pull ran the orphan sweep: a synced default-branch app absent from git has its
        // branch versions DELETED (removeOrphanedResources; the apps row itself is kept).
        const orphanAfterFull = await psDataSource.query(
          `SELECT is_synced FROM app_versions WHERE app_id = $1 AND branch_id = $2`,
          [orphanAppId, mainBranchId]
        );
        expect(orphanAfterFull).toHaveLength(0);
        const orphanAppRowAfterFull = await psDataSource.query(`SELECT id FROM apps WHERE id = $1`, [orphanAppId]);
        expect(orphanAppRowAfterFull).toHaveLength(1);

        // And the full pull re-stamped the branch tokens (skipping resumes next time).
        const restamped = await branchTokens(mainBranchId);
        expect(restamped.last_synced_commit).toBeTruthy();
        expect(restamped.apps_git_tree_sha).toBeTruthy();
        expect(restamped.data_sources_git_tree_sha).toBeTruthy();
      }, 600000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Part 8 — Category-level skip: a commit that leaves a category's tree SHA
    // unchanged skips that whole category (all datasources here), even though the
    // whole-pull skip does NOT fire because the branch HEAD moved. We move HEAD with
    // an admin /files write of a top-level file (touches neither apps/ nor
    // data-sources/), so data-sources/'s tree SHA is byte-identical → pullDataSources
    // returns early → the datasource orphan sweep is skipped → a manufactured DS
    // orphan survives. Clearing only the DS token then forces the sweep, isolating
    // the category skip as the reason. Runs against the real Gitea simulator.
    // ────────────────────────────────────────────────────────────────────────────
    describe('pull skip — category-level skip leaves that category unreconciled (git tree SHAs)', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;
      const MERGE_URL = `${GIT_BASE_URL}/admin/merge`;
      const FILES_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/files`;

      let catOrgId: string;
      let catCookie: string[];
      let catDataSource: DataSource;

      beforeAll(async () => {
        const { organization } = await createUser(app, {
          email: 'git-pull-skip-cat-gl@tooljet.io',
          firstName: 'git',
          lastName: 'pullskipcat',
        });
        catOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-pull-skip-cat-gl@tooljet.io');
        catCookie = tokenCookie;
        await ensureAppEnvironments(app, catOrgId);
        catDataSource = app.get<DataSource>(getDataSourceToken('default'));
        await catDataSource.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [catOrgId]
        );
      });

      it('skips the datasource category when data-sources/ tree SHA is unchanged despite a moved HEAD', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const agent = () => request.agent(app.getHttpServer());
        const auth = (r: request.Test) => r.set('Cookie', catCookie).set('tj-workspace-id', catOrgId);

        const restapiDsOptions = [
          { key: 'url', value: 'http://cat.example.com' },
          { key: 'auth_type', value: 'none' },
          { key: 'headers', value: [['', '']] },
          { key: 'ssl_certificate', value: 'none', encrypted: false },
        ];

        const createDataSource = async (name: string, branchId: string) =>
          (
            await auth(agent().post(`/api/data-sources?branch_id=${branchId}`))
              .send({
                name,
                kind: 'restapi',
                options: restapiDsOptions,
                scope: 'global',
              })
              .expect(201)
          ).body.id as string;
        const pushDataSources = (branchId: string, commitMessage: string, onlyUnsynced?: boolean) =>
          auth(agent().post('/api/workspace-branches/push'))
            .query({ branch_id: branchId })
            .send({
              commitMessage,
              branchId,
              scope: 'datasource',
              ...(onlyUnsynced && { onlyUnsyncedDatasources: true }),
            });
        const pull = (branchId: string) =>
          auth(agent().post('/api/workspace-branches/pull')).query({ branch_id: branchId }).send({ branchId });
        const mergeToMain = async (sourceBranch: string) => {
          const resp = await fetch(MERGE_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: BASIC,
            },
            body: JSON.stringify({
              owner: GIT_REPO_OWNER,
              repo: `${GIT_REPO_NAME}.git`,
              source: sourceBranch,
              target: 'main',
              message: `Land ${sourceBranch}`,
            }),
          });
          expect((await resp.json().catch(() => ({}))).ok).toBe(true);
        };
        // Move HEAD on main WITHOUT touching apps/ or data-sources/ — a top-level file only.
        // The admin /files endpoint writes via update-ref directly, so it bypasses main's push
        // protection. data-sources/'s tree SHA is therefore byte-identical afterwards.
        const writeTopLevelFile = async (path: string, content: string) => {
          const resp = await fetch(FILES_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: BASIC,
            },
            body: JSON.stringify({
              ref: 'main',
              path,
              content,
              message: `chore: ${path}`,
            }),
          });
          const body = await resp.json().catch(() => ({}));
          expect(body.ok).toBe(true);
          expect(body.sha).toBeTruthy();
          return body.sha as string;
        };
        const branchIdByName = async (name: string, xBranchId: string): Promise<string> =>
          (
            await auth(agent().get('/api/workspace-branches')).set('x-branch-id', xBranchId).expect(200)
          ).body.branches.find((b: any) => b.name === name)?.id;
        const branchTokens = async (branchId: string) =>
          (
            await catDataSource.query(
              `SELECT last_synced_commit, data_sources_git_tree_sha
                 FROM organization_git_sync_branches WHERE id = $1`,
              [branchId]
            )
          )[0];
        const dsSynced = async (dsId: string, branchId: string) =>
          (
            await catDataSource.query(
              `SELECT is_synced FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`,
              [dsId, branchId]
            )
          )[0]?.is_synced;
        // The DS orphan sweep deactivates the branch DSV (is_active=false); is_synced is left as-is.
        const dsActive = async (dsId: string, branchId: string) =>
          (
            await catDataSource.query(
              `SELECT is_active FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`,
              [dsId, branchId]
            )
          )[0]?.is_active;

        // ══════════════════════════════════════════════════════════════════════
        step(1, 'reset gitea repo, configure git + branching, resolve main branch, pull main');
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);
        const gitConfig = await auth(agent().get(`/api/git-sync/${catOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: true })
          .expect(200);
        const mainBranchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body
          .activeBranchId;
        expect(mainBranchId).toBeDefined();
        await pull(mainBranchId).expect(201);

        step(2, 'create feat-cat branch, push a real datasource onto it, merge → main, pull main (tokens stored)');
        await auth(agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-cat', sourceBranchId: mainBranchId })
          .expect(201);
        const featBranchId = await branchIdByName('feat-cat', mainBranchId);
        expect(featBranchId).toBeDefined();
        const realDsId = await createDataSource('cat-real-ds', featBranchId);
        expect((await pushDataSources(featBranchId, 'commit cat-real-ds', true)).status).toBe(201);
        await mergeToMain('feat-cat');
        await pull(mainBranchId).expect(201);

        step(3, 'capture baseline tokens: last_synced_commit (C0) + data_sources_git_tree_sha (T_ds)');
        const baseline = await branchTokens(mainBranchId);
        expect(baseline.last_synced_commit).toBeTruthy();
        expect(baseline.data_sources_git_tree_sha).toBeTruthy();

        step(4, 'manufacture a datasource orphan on main (DB-only, absent from git, is_synced=true)');
        await auth(agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-cat-orphan', sourceBranchId: mainBranchId })
          .expect(201);
        const orphanBranchId = await branchIdByName('feat-cat-orphan', mainBranchId);
        const orphanDsId = await createDataSource('cat-orphan-ds', orphanBranchId);
        await catDataSource.query(
          `UPDATE data_source_versions SET branch_id = $1, is_synced = true WHERE data_source_id = $2`,
          [mainBranchId, orphanDsId]
        );
        expect(await dsSynced(orphanDsId, mainBranchId)).toBe(true);

        step(5, 'move main HEAD via a top-level file write (leaves apps/ and data-sources/ trees untouched)');
        await writeTopLevelFile('SKIP_MARKER.md', `pull-skip category test marker\n`);

        step(6, 'pull main → whole-pull runs (HEAD moved) but the datasource category is skipped (tree unchanged)');
        await pull(mainBranchId).expect(201);

        // HEAD advanced (whole-pull did NOT skip) …
        const afterCategorySkip = await branchTokens(mainBranchId);
        expect(afterCategorySkip.last_synced_commit).toBeTruthy();
        expect(afterCategorySkip.last_synced_commit).not.toBe(baseline.last_synced_commit);
        // … but the data-sources/ tree SHA is unchanged, so the category was skipped …
        expect(afterCategorySkip.data_sources_git_tree_sha).toBe(baseline.data_sources_git_tree_sha);
        // … therefore the DS orphan sweep never ran and the orphan survives.
        expect(await dsSynced(orphanDsId, mainBranchId)).toBe(true);
        // The real (in-git) datasource is untouched too.
        expect(await dsSynced(realDsId, mainBranchId)).toBe(true);

        step(7, 'clear the datasource token + last_synced_commit → pull reconciles the category → orphan swept');
        await catDataSource.query(
          `UPDATE organization_git_sync_branches
             SET last_synced_commit = NULL, data_sources_git_tree_sha = NULL
           WHERE id = $1`,
          [mainBranchId]
        );
        await pull(mainBranchId).expect(201);
        // Now the category ran: the orphan (absent from git) is DEACTIVATED by the deserialize
        // orphan sweep (is_active=false, row kept); the real in-git DS stays active + synced.
        expect(await dsActive(orphanDsId, mainBranchId)).toBe(false);
        expect(await dsActive(realDsId, mainBranchId)).toBe(true);
        expect(await dsSynced(realDsId, mainBranchId)).toBe(true);
      }, 600000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Part 9 — Push serialization must not leak DB timestamps into git.
    //
    // The pull-side tree-SHA skip only works if a resource's serialized bytes are
    // stable across no-op pushes. DB-internal fields (created_at / updated_at change on
    // every save; git_tree_sha is itself the change token) would flip the app's git tree
    // SHA on an otherwise-unchanged push if written into the pushed files, so the skip
    // would never fire. This test pushes an app and asserts none of its committed version
    // files carry those fields. Runs against the real Gitea simulator.
    // ────────────────────────────────────────────────────────────────────────────
    describe('push serialization — no DB timestamps in pushed resource files (git tree SHAs)', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;

      let tsOrgId: string;
      let tsCookie: string[];
      let tsDataSource: DataSource;

      beforeAll(async () => {
        const { organization } = await createUser(app, {
          email: 'git-push-no-ts-gl@tooljet.io',
          firstName: 'git',
          lastName: 'pushnots',
        });
        tsOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-push-no-ts-gl@tooljet.io');
        tsCookie = tokenCookie;
        await ensureAppEnvironments(app, tsOrgId);
        tsDataSource = app.get<DataSource>(getDataSourceToken('default'));
        await tsDataSource.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [tsOrgId]
        );
      });

      it('omits created_at / updated_at / git_tree_sha from pushed app version files', async () => {
        const { randomUUID } = await import('crypto');
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const agent = () => request.agent(app.getHttpServer());
        const auth = (r: request.Test) => r.set('Cookie', tsCookie).set('tj-workspace-id', tsOrgId);

        const buttonDiff = () => {
          const id = randomUUID();
          return {
            [id]: {
              name: `btn_${id.slice(0, 6)}`,
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
              },
              styles: { backgroundColor: { value: 'var(--cc-primary-brand)' } },
              parent: null,
            },
          };
        };
        const createApp = async (name: string) =>
          (await auth(agent().post('/api/apps')).send({ icon: 'home', name, type: 'front-end' }).expect(201)).body
            .id as string;
        const editingVersion = async (resourceId: string, branchId?: string) => {
          const detail = await auth(agent().get(`/api/apps/${resourceId}`))
            .query(branchId ? { branch_id: branchId } : {})
            .expect(200);
          const ev = detail.body?.editing_version || detail.body?.editingVersion;
          const pageId = ev.home_page_id || ev.homePageId || ev.pages?.[0]?.id;
          return { versionId: ev.id as string, pageId: pageId as string };
        };
        const addComponent = (resourceId: string, versionId: string, pageId: string, branchId?: string) =>
          auth(agent().post(`/api/v2/apps/${resourceId}/versions/${versionId}/components`))
            .query(branchId ? { branch_id: branchId } : {})
            .send({
              is_user_switched_version: false,
              pageId,
              diff: buttonDiff(),
            })
            .expect(201);
        const gitpush = (
          resourceId: string,
          versionId: string,
          gitName: string,
          branchName: string,
          branchId: string
        ) =>
          auth(agent().post(`/api/app-git/gitpush/${resourceId}/${versionId}`))
            .query({ branch_id: branchId })
            .send({
              gitAppName: gitName,
              versionId,
              lastCommitMessage: `commit ${gitName}`,
              gitVersionName: branchName,
              sourceBranch: branchName,
              targetBranch: branchName,
            })
            .expect(201);
        const pull = (branchId: string) =>
          auth(agent().post('/api/workspace-branches/pull')).query({ branch_id: branchId }).send({ branchId });
        const branchIdByName = async (name: string, xBranchId: string): Promise<string> =>
          (
            await auth(agent().get('/api/workspace-branches')).set('x-branch-id', xBranchId).expect(200)
          ).body.branches.find((b: any) => b.name === name)?.id;

        // Shallow-clone a branch and return every JSON file living under a `versions/`
        // folder anywhere beneath apps/ — the per-version serialized rows.
        const readVersionFiles = async (branch: string): Promise<{ path: string; text: string }[]> => {
          const simpleGit = (await import('simple-git')).default;
          const fs = await import('fs');
          const path = await import('path');
          const os = await import('os');
          const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tj-push-nots-gl-'));
          try {
            const git = simpleGit({
              baseDir: tmpDir,
              timeout: { block: 30000 },
              unsafe: { allowUnsafeCredentialHelper: true },
            });
            await git.clone(`${GIT_BASE_URL}/${GIT_REPO_PATH}.git`, '.', [
              '--branch',
              branch,
              '--depth',
              '1',
              '--single-branch',
            ]);
            const out: { path: string; text: string }[] = [];
            const walk = (dir: string) => {
              for (const entry of fs.readdirSync(dir, {
                withFileTypes: true,
              })) {
                if (entry.name === '.git') continue;
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) walk(full);
                else if (entry.isFile() && path.basename(path.dirname(full)) === 'versions' && full.endsWith('.json')) {
                  out.push({
                    path: path.relative(tmpDir, full),
                    text: fs.readFileSync(full, 'utf-8'),
                  });
                }
              }
            };
            const appsDir = path.join(tmpDir, 'apps');
            if (fs.existsSync(appsDir)) walk(appsDir);
            return out;
          } finally {
            await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
          }
        };

        // ══════════════════════════════════════════════════════════════════════
        step(1, 'git-off: author an app + component');
        const appId = await createApp('push-no-ts-app');
        const v0 = await editingVersion(appId);
        await addComponent(appId, v0.versionId, v0.pageId);
        const versionId = v0.versionId;

        step(2, 'reset gitea repo, configure git + branching, pull main, normalize app onto main');
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);
        const gitConfig = await auth(agent().get(`/api/git-sync/${tsOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: true })
          .expect(200);
        const mainBranchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body
          .activeBranchId;
        expect(mainBranchId).toBeDefined();
        await pull(mainBranchId).expect(201);
        await tsDataSource.query(
          `UPDATE app_versions SET branch_id = $1, version_type = 'version', is_synced = false, is_stub = false
             WHERE app_id = $2`,
          [mainBranchId, appId]
        );

        step(3, 'create feat-no-ts branch and gitpush the app onto it');
        await auth(agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-no-ts', sourceBranchId: mainBranchId })
          .expect(201);
        const featBranchId = await branchIdByName('feat-no-ts', mainBranchId);
        expect(featBranchId).toBeDefined();
        await gitpush(appId, versionId, 'push-no-ts-app', 'feat-no-ts', mainBranchId);

        step(4, 'clone feat-no-ts and assert version files carry no DB timestamps');
        const versionFiles = await readVersionFiles('feat-no-ts');
        // Sanity: the push actually wrote at least one version file to inspect.
        expect(versionFiles.length).toBeGreaterThan(0);

        for (const { path: relPath, text } of versionFiles) {
          const json = JSON.parse(text);
          const forbidden = ['createdAt', 'updatedAt', 'gitTreeSha', 'created_at', 'updated_at', 'git_tree_sha'];
          for (const key of forbidden) {
            expect({ file: relPath, key, present: key in json }).toEqual({
              file: relPath,
              key,
              present: false,
            });
          }
          // Belt-and-suspenders: the raw bytes don't mention the snake_case columns either.
          expect(text).not.toContain('git_tree_sha');
          expect(text).not.toContain('updated_at');
        }
      }, 600000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // is_synced lifecycle invariant — "a resource is is_synced=true IFF it is in git".
    // Consolidates the sync-flag contract across every git/branching state into one
    // place. is_synced tracks git PRESENCE (was pushed), not byte-for-byte parity:
    //   • git-off create → is_synced=false (nothing is in git)
    //   • push → is_synced=true; merge+pull keep it true
    //   • edit a synced resource → is_synced STAYS true (no flip-on-edit by design)
    //   • a synced app carries every connected resource (data source + module) into git
    // Each `it` uses a FRESH isolated org (config mode differs per case) and resets the
    // shared repo, mirroring §14/§18. Against the real Gitea (@group gitsync).
    // ────────────────────────────────────────────────────────────────────────────
    describe('is_synced lifecycle invariant (in git ⇔ is_synced=true)', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;
      const MERGE_URL = `${GIT_BASE_URL}/admin/merge`;

      let invDs: DataSource;

      beforeAll(() => {
        invDs = app.get<DataSource>(getDataSourceToken('default'));
      });

      const dsOptions = (url: string) => [
        { key: 'url', value: url },
        { key: 'auth_type', value: 'none' },
        { key: 'headers', value: [['', '']] },
        { key: 'ssl_certificate', value: 'none', encrypted: false },
      ];

      // Build a fresh isolated workspace + its helper set. `branchName`/`branching`
      // control how git is configured; `configureGit` resets the shared repo, seeds the
      // default branch row under `branchName`, saves the provider config, sets branching,
      // and pulls — returning the default branch id.
      const makeCtx = async (email: string) => {
        const { organization } = await createUser(app, { email, firstName: 'inv', lastName: 'sync' });
        const orgId = organization.id;
        const { tokenCookie } = await login(app, email);
        const cookie = tokenCookie;
        await ensureAppEnvironments(app, orgId);

        const agent = () => request.agent(app.getHttpServer());
        const auth = (r: request.Test) => r.set('Cookie', cookie).set('tj-workspace-id', orgId);

        const pull = (branchId: string) =>
          auth(agent().post('/api/workspace-branches/pull')).query({ branch_id: branchId }).send({ branchId });
        const pushWorkspace = (branchId: string, commitMessage: string, scope?: string) =>
          auth(agent().post('/api/workspace-branches/push'))
            .query({ branch_id: branchId })
            .send({ commitMessage, branchId, ...(scope && { scope }) });
        const branchIdByName = async (name: string, xBranchId: string): Promise<string> =>
          (
            await auth(agent().get('/api/workspace-branches')).set('x-branch-id', xBranchId).expect(200)
          ).body.branches.find((b: any) => b.name === name)?.id;
        const editingVersionOf = async (appId: string, branchId: string) => {
          const d = await auth(agent().get(`/api/apps/${appId}`))
            .query({ branch_id: branchId })
            .expect(200);
          const ev = d.body?.editing_version || d.body?.editingVersion || d.body?.app?.editing_version;
          const pageId = ev.home_page_id || ev.homePageId || ev.pages?.[0]?.id || d.body?.pages?.[0]?.id;
          return { versionId: ev.id as string, pageId: pageId as string };
        };
        const gitpush = (
          appId: string,
          versionId: string,
          gitAppName: string,
          gitBranchName: string,
          xBranchId: string
        ) =>
          auth(agent().post(`/api/app-git/gitpush/${appId}/${versionId}`))
            .query({ branch_id: xBranchId })
            .send({
              gitAppName,
              versionId,
              lastCommitMessage: `push ${gitAppName}`,
              gitVersionName: gitBranchName,
              sourceBranch: gitBranchName,
            });
        // Adds a Button component and asserts the 201 internally (returns Promise<void>),
        // so callers `await ctx.addButton(...)` without chaining `.expect`.
        const addButton = async (appId: string, versionId: string, pageId: string, xBranchId: string) => {
          const { randomUUID } = await import('crypto');
          const btnId = randomUUID();
          await auth(agent().post(`/api/v2/apps/${appId}/versions/${versionId}/components`))
            .query({ branch_id: xBranchId })
            .send({
              is_user_switched_version: false,
              pageId,
              diff: {
                [btnId]: {
                  name: `button_${btnId.slice(0, 6)}`,
                  layouts: {
                    desktop: { top: 80, left: 15, width: 4, height: 40 },
                    mobile: { top: 80, left: 15, width: 4, height: 40 },
                  },
                  type: 'Button',
                  general: {},
                  generalStyles: {},
                  others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
                  properties: { text: { value: 'Button' } },
                  styles: {},
                },
              },
            })
            .expect(201);
        };
        const merge = async (source: string, target: string) => {
          const resp = await fetch(MERGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: BASIC },
            body: JSON.stringify({
              owner: GIT_REPO_OWNER,
              repo: `${GIT_REPO_NAME}.git`,
              source,
              target,
              message: `Land ${source}`,
            }),
          });
          const body = await resp.json().catch(() => ({}));
          expect(body.ok).toBe(true);
        };

        // DB reads for the sync flag (the source of truth the indicator is derived from).
        const versionSynced = async (versionId: string): Promise<boolean> =>
          (await invDs.query(`SELECT is_synced FROM app_versions WHERE id = $1`, [versionId]))[0]?.is_synced;
        const appSyncedByAppId = async (appId: string, branchId?: string): Promise<boolean> =>
          (
            await invDs.query(
              `SELECT bool_and(is_synced) AS synced FROM app_versions WHERE app_id = $1${
                branchId ? ' AND branch_id = $2' : ''
              }`,
              branchId ? [appId, branchId] : [appId]
            )
          )[0]?.synced;
        const dsvSynced = async (dsId: string, branchId?: string): Promise<boolean> =>
          (
            await invDs.query(
              `SELECT bool_and(is_synced) AS synced FROM data_source_versions WHERE data_source_id = $1${
                branchId ? ' AND branch_id = $2' : ''
              }`,
              branchId ? [dsId, branchId] : [dsId]
            )
          )[0]?.synced;

        const configureGit = async (branchName: string, branching: boolean) => {
          await fetch(RESET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: BASIC },
            body: '{}',
          });
          await invDs.query(
            `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
             VALUES ($1, $2, true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
            [orgId, branchName]
          );
          await auth(agent().post('/api/git-sync/configs'))
            .send({ ...GITLAB_PAYLOAD, branchName, useEnvConfig: false })
            .expect(201);
          const orgGitId: string = (await auth(agent().get(`/api/git-sync/${orgId}`)).expect(200)).body.organization_git
            .id;
          await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
            .send({ isBranchingEnabled: branching })
            .expect(200);
          const defaultBranchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body
            .activeBranchId;
          await pull(defaultBranchId).expect(201);
          return defaultBranchId;
        };

        return {
          orgId,
          agent,
          auth,
          pull,
          pushWorkspace,
          branchIdByName,
          editingVersionOf,
          gitpush,
          addButton,
          merge,
          versionSynced,
          appSyncedByAppId,
          dsvSynced,
          configureGit,
        };
      };

      const step = (n: number, label: string) =>
        process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);

      // CASE 1 (GREEN) — nothing is in git, so create leaves every resource unsynced.
      it('git-off: a created app, module and data source are is_synced=false', async () => {
        const ctx = await makeCtx('inv-gitoff-gl@tooljet.io');
        step(1, 'git-off: create app + module + data source (no git configured)');
        const appId: string = (
          await ctx
            .auth(ctx.agent().post('/api/apps'))
            .send({ icon: 'home', name: 'inv-off-app', type: 'front-end' })
            .expect(201)
        ).body.id;
        const moduleId: string = (
          await ctx
            .auth(ctx.agent().post('/api/modules'))
            .send({ icon: 'folderupload', name: 'inv-off-module', type: 'module' })
            .expect(201)
        ).body.id;
        const dsId: string = (
          await ctx
            .auth(ctx.agent().post('/api/data-sources'))
            .send({
              name: 'inv-off-ds',
              kind: 'restapi',
              options: dsOptions('http://inv-off.example.com'),
              scope: 'global',
            })
            .expect(201)
        ).body.id;

        step(2, 'assert all three are is_synced=false');
        expect(await ctx.appSyncedByAppId(appId)).toBe(false);
        expect(await ctx.appSyncedByAppId(moduleId)).toBe(false);
        expect(await ctx.dsvSynced(dsId)).toBe(false);
      }, 300000);

      // CASE 2 (GREEN) — multi-branch: unsynced on create, synced after push, and the
      // flag survives a merge into main + a main pull.
      it('multi-branch: a feature-branch resource is unsynced on create, synced after push, and stays synced after merge+pull', async () => {
        const ctx = await makeCtx('inv-mb-gl@tooljet.io');
        step(1, 'configure git (default main) + branching ON, pull main');
        const mainBranchId = await ctx.configureGit('main', true);

        step(2, 'create a feature branch and an app on it → app is unsynced');
        await ctx
          .auth(ctx.agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-inv-mb', sourceBranchId: mainBranchId })
          .expect(201);
        const featBranchId = await ctx.branchIdByName('feat-inv-mb', mainBranchId);
        const appId: string = (
          await ctx
            .auth(ctx.agent().post('/api/apps'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'home', name: 'inv-mb-app', type: 'front-end', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const featCtx = await ctx.editingVersionOf(appId, featBranchId);
        await ctx.addButton(appId, featCtx.versionId, featCtx.pageId, featBranchId);
        expect(await ctx.versionSynced(featCtx.versionId)).toBe(false);

        step(3, 'gitpush the app onto the feature branch → is_synced=true');
        await ctx.gitpush(appId, featCtx.versionId, 'inv-mb-app', 'feat-inv-mb', featBranchId).expect(201);
        expect(await ctx.versionSynced(featCtx.versionId)).toBe(true);

        step(4, 'merge feat-inv-mb → main, pull main → the default-branch version is synced');
        await ctx.merge('feat-inv-mb', 'main');
        await ctx.pull(mainBranchId).expect(201);
        expect(await ctx.appSyncedByAppId(appId, mainBranchId)).toBe(true);
      }, 300000);

      // CASE 3 (GREEN) — single-branch: git-off-style unsynced on create, synced after a
      // direct push to the (unprotected, non-main) default branch.
      it('single-branch: a resource is unsynced on create and is_synced=true after a push to the default branch', async () => {
        const ctx = await makeCtx('inv-sb-gl@tooljet.io');
        step(1, 'configure git (default single-branch-main) + branching OFF, pull');
        const defaultBranchId = await ctx.configureGit('single-branch-main', false);

        step(2, 'create app (+component) on the default branch → unsynced');
        const appId: string = (
          await ctx
            .auth(ctx.agent().post('/api/apps'))
            .query({ branch_id: defaultBranchId })
            .send({ icon: 'home', name: 'inv-sb-app', type: 'front-end', branchId: defaultBranchId })
            .expect(201)
        ).body.id;
        const appCtx = await ctx.editingVersionOf(appId, defaultBranchId);
        await ctx.addButton(appId, appCtx.versionId, appCtx.pageId, defaultBranchId);
        expect(await ctx.versionSynced(appCtx.versionId)).toBe(false);

        step(3, 'gitpush directly to the default branch → is_synced=true');
        await ctx.gitpush(appId, appCtx.versionId, 'inv-sb-app', 'single-branch-main', defaultBranchId).expect(201);
        expect(await ctx.versionSynced(appCtx.versionId)).toBe(true);
      }, 300000);

      // CASE 4 — editing a synced resource does NOT flip is_synced. `is_synced` tracks
      // whether the resource exists in git (was pushed), not whether the local content
      // still matches git byte-for-byte, so a local edit leaves it is_synced=true. (There
      // is deliberately no flip-on-edit hook.)
      it('single-branch: editing a synced resource does NOT flip is_synced (stays true)', async () => {
        const ctx = await makeCtx('inv-sb-noflip-gl@tooljet.io');
        step(1, 'configure git (single-branch), create + push an app → synced');
        const defaultBranchId = await ctx.configureGit('single-branch-main', false);
        const appId: string = (
          await ctx
            .auth(ctx.agent().post('/api/apps'))
            .query({ branch_id: defaultBranchId })
            .send({ icon: 'home', name: 'inv-sbf-app', type: 'front-end', branchId: defaultBranchId })
            .expect(201)
        ).body.id;
        const appCtx = await ctx.editingVersionOf(appId, defaultBranchId);
        await ctx.addButton(appId, appCtx.versionId, appCtx.pageId, defaultBranchId);
        await ctx.gitpush(appId, appCtx.versionId, 'inv-sbf-app', 'single-branch-main', defaultBranchId).expect(201);
        expect(await ctx.versionSynced(appCtx.versionId)).toBe(true);

        step(2, 'edit the synced resource (add a component) → is_synced stays true (no flip on edit)');
        await ctx.addButton(appId, appCtx.versionId, appCtx.pageId, defaultBranchId);
        expect(await ctx.versionSynced(appCtx.versionId)).toBe(true);
      }, 300000);

      // CASE 5 (GREEN) — a synced app carries EVERY connected resource into git: a linked
      // global data source (via a query) and a referenced module (via a ModuleViewer)
      // ride into the push, so both read is_synced=true afterwards.
      it('a synced app carries its connected data source and module into git (all become is_synced=true)', async () => {
        const { randomUUID } = await import('crypto');
        const ctx = await makeCtx('inv-connected-gl@tooljet.io');
        step(1, 'configure git + branching, create a feature branch');
        const mainBranchId = await ctx.configureGit('main', true);
        await ctx
          .auth(ctx.agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({ name: 'feat-inv-conn', sourceBranchId: mainBranchId })
          .expect(201);
        const featBranchId = await ctx.branchIdByName('feat-inv-conn', mainBranchId);

        step(2, 'create a module, a global data source, and a host app referencing both');
        const moduleId: string = (
          await ctx
            .auth(ctx.agent().post('/api/modules'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'folderupload', name: 'inv-conn-module', type: 'module', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const moduleCoRel: string = (await invDs.query(`SELECT co_relation_id FROM apps WHERE id = $1`, [moduleId]))[0]
          ?.co_relation_id;
        expect(moduleCoRel).toBeTruthy();
        const dsId: string = (
          await ctx
            .auth(ctx.agent().post(`/api/data-sources?branch_id=${featBranchId}`))
            .send({
              name: 'inv-conn-ds',
              kind: 'restapi',
              options: dsOptions('http://inv-conn.example.com'),
              scope: 'global',
            })
            .expect(201)
        ).body.id;
        const appId: string = (
          await ctx
            .auth(ctx.agent().post('/api/apps'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'home', name: 'inv-conn-host', type: 'front-end', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const appCtx = await ctx.editingVersionOf(appId, featBranchId);

        step(3, 'link the data source to the host via a query and wire a ModuleViewer to the module');
        await ctx
          .auth(ctx.agent().post(`/api/data-queries/data-sources/${dsId}/versions/${appCtx.versionId}`))
          .query({ branch_id: featBranchId })
          .send({
            kind: 'restapi',
            name: 'q_inv_conn',
            options: { method: 'get', url: '', url_params: [], headers: [], body: [] },
          })
          .expect(201);
        const moduleViewerId = randomUUID();
        await ctx
          .auth(ctx.agent().post(`/api/v2/apps/${appId}/versions/${appCtx.versionId}/components`))
          .query({ branch_id: featBranchId })
          .send({
            is_user_switched_version: false,
            pageId: appCtx.pageId,
            diff: {
              [moduleViewerId]: {
                name: 'moduleviewer_conn',
                layouts: {
                  desktop: { top: 70, left: 5, width: 38, height: 400 },
                  mobile: { top: 70, left: 5, width: 38, height: 400 },
                },
                type: 'ModuleViewer',
                general: {},
                generalStyles: { boxShadow: { value: '0px 0px 0px 0px #00000040' } },
                others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
                properties: {
                  moduleAppId: { value: moduleCoRel },
                  moduleVersionId: { value: '' },
                  visibility: { value: true },
                },
                styles: { backgroundColor: { value: '#fff' }, padding: { value: 'default' } },
                parent: null,
              },
            },
          })
          .expect(201);

        step(4, 'gitpush the host app + module → the connected resources ride into git');
        const moduleCtx = await ctx.editingVersionOf(moduleId, featBranchId);
        await ctx.gitpush(moduleId, moduleCtx.versionId, 'inv-conn-module', 'feat-inv-conn', featBranchId).expect(201);
        await ctx.gitpush(appId, appCtx.versionId, 'inv-conn-host', 'feat-inv-conn', featBranchId).expect(201);
        // The push commits the linked data source's file, but its DSV is_synced flag is only
        // reconciled on a pull (reconcileSyncedDataSourceVersions) — push flips the pushed
        // app/module versions synced, not the carried DS. Pull the feature branch to settle it.
        await ctx.pull(featBranchId).expect(201);

        step(5, 'assert the host, its linked data source and its referenced module are all is_synced=true');
        expect(await ctx.versionSynced(appCtx.versionId)).toBe(true);
        expect(await ctx.versionSynced(moduleCtx.versionId)).toBe(true);
        expect(await ctx.dsvSynced(dsId, featBranchId)).toBe(true);
      }, 300000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Delete-on-pull + in_use conflict guard (implemented behavior).
    //
    // A synced default-branch resource absent from git is reconciled on pull, gated to
    // is_synced=true rows (unsynced local work is kept). The delete shape differs by type:
    //   • APP / MODULE — branch AppVersion rows are DELETED (children cascade); the
    //     parent apps row is KEPT (removeOrphanedResources).
    //   • DATA SOURCE — the branch DSV is DEACTIVATED (is_active=false, row kept) by the
    //     deserializeDataSources orphan sweep.
    //   • an UNSYNCED, never-pushed local resource absent from git is KEPT untouched.
    //   • if a resource that would be reconciled is still referenced/connected by another
    //     app or module, the whole pull ABORTS with a 409 in_use conflict and nothing
    //     changes; once the reference is removed a re-pull succeeds.
    //
    // Orphans are manufactured with the §61 SQL technique (create on a feature branch,
    // move the version/DSV onto the default branch as is_synced=true + a fake
    // git_tree_sha, then clear the branch skip tokens) so the resource is a synced
    // default-branch row absent from git's (empty, post-reset) meta. Each `it` uses a
    // FRESH org. Against the real Gitea (@group gitsync).
    // ────────────────────────────────────────────────────────────────────────────
    describe('pull deletes synced resources removed from git (with in_use guard)', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;
      const FAKE_TREE_SHA = 'delete-on-pull-tree-sha-000000000000000000000000';

      let delDs: DataSource;
      beforeAll(() => {
        delDs = app.get<DataSource>(getDataSourceToken('default'));
      });

      const step = (n: number, label: string) =>
        process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);

      const makeCtx = async (email: string) => {
        const { organization } = await createUser(app, { email, firstName: 'del', lastName: 'pull' });
        const orgId = organization.id;
        const { tokenCookie } = await login(app, email);
        const cookie = tokenCookie;
        await ensureAppEnvironments(app, orgId);

        const agent = () => request.agent(app.getHttpServer());
        const auth = (r: request.Test) => r.set('Cookie', cookie).set('tj-workspace-id', orgId);
        const pull = (branchId: string) =>
          auth(agent().post('/api/workspace-branches/pull')).query({ branch_id: branchId }).send({ branchId });
        const branchIdByName = async (name: string, xBranchId: string): Promise<string> =>
          (
            await auth(agent().get('/api/workspace-branches')).set('x-branch-id', xBranchId).expect(200)
          ).body.branches.find((b: any) => b.name === name)?.id;
        const editingVersionOf = async (appId: string, branchId: string) => {
          const d = await auth(agent().get(`/api/apps/${appId}`))
            .query({ branch_id: branchId })
            .expect(200);
          const ev = d.body?.editing_version || d.body?.editingVersion || d.body?.app?.editing_version;
          const pageId = ev.home_page_id || ev.homePageId || ev.pages?.[0]?.id || d.body?.pages?.[0]?.id;
          return { versionId: ev.id as string, pageId: pageId as string };
        };

        const configureGitMultiBranch = async () => {
          await fetch(RESET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: BASIC },
            body: '{}',
          });
          await delDs.query(
            `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
             VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
            [orgId]
          );
          await auth(agent().post('/api/git-sync/configs'))
            .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
            .expect(201);
          const orgGitId: string = (await auth(agent().get(`/api/git-sync/${orgId}`)).expect(200)).body.organization_git
            .id;
          await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
            .send({ isBranchingEnabled: true })
            .expect(200);
          const mainBranchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body
            .activeBranchId;
          await pull(mainBranchId).expect(201);
          return mainBranchId;
        };

        const createFeatureBranch = async (name: string, mainBranchId: string) => {
          await auth(agent().post('/api/workspace-branches'))
            .query({ branch_id: mainBranchId })
            .send({ name, sourceBranchId: mainBranchId })
            .expect(201);
          return branchIdByName(name, mainBranchId);
        };

        const createApp = async (name: string, type: 'front-end' | 'module', branchId: string): Promise<string> =>
          (
            await auth(agent().post(type === 'module' ? '/api/modules' : '/api/apps'))
              .query({ branch_id: branchId })
              .send({ icon: 'home', name, type, branchId })
              .expect(201)
          ).body.id;

        const coRelOf = async (appId: string): Promise<string> =>
          (await delDs.query(`SELECT co_relation_id FROM apps WHERE id = $1`, [appId]))[0]?.co_relation_id;

        // Move an app/module version onto the default branch as a synced default-branch
        // row (is_synced=true + a git_tree_sha), so it looks pulled-from-git but its
        // co_relation_id is absent from the (empty) git meta → a synced orphan.
        const makeSyncedOrphanApp = async (name: string, type: 'front-end' | 'module', mainBranchId: string) => {
          const featBranchId = await createFeatureBranch(`feat-${name}`, mainBranchId);
          const appId = await createApp(name, type, featBranchId);
          await delDs.query(
            `UPDATE app_versions SET version_type = 'version', branch_id = $1, is_synced = true, git_tree_sha = $2
               WHERE app_id = $3`,
            [mainBranchId, FAKE_TREE_SHA, appId]
          );
          return { appId, coRel: await coRelOf(appId) };
        };

        // Same shape but is_synced=false + no git_tree_sha → a never-pushed local row
        // (not a git orphan). Must be KEPT by the pull.
        const makeUnsyncedLocalApp = async (name: string, mainBranchId: string) => {
          const featBranchId = await createFeatureBranch(`feat-${name}`, mainBranchId);
          const appId = await createApp(name, 'front-end', featBranchId);
          await delDs.query(
            `UPDATE app_versions SET version_type = 'version', branch_id = $1, is_synced = false, git_tree_sha = NULL
               WHERE app_id = $2`,
            [mainBranchId, appId]
          );
          return appId;
        };

        const makeSyncedOrphanDataSource = async (name: string, mainBranchId: string) => {
          const featBranchId = await createFeatureBranch(`feat-${name}`, mainBranchId);
          const dsId: string = (
            await auth(agent().post(`/api/data-sources?branch_id=${featBranchId}`))
              .send({
                name,
                kind: 'restapi',
                options: [
                  { key: 'url', value: `http://${name}.example.com` },
                  { key: 'auth_type', value: 'none' },
                  { key: 'headers', value: [['', '']] },
                  { key: 'ssl_certificate', value: 'none', encrypted: false },
                ],
                scope: 'global',
              })
              .expect(201)
          ).body.id;
          await delDs.query(
            `UPDATE data_source_versions SET branch_id = $1, is_synced = true, git_tree_sha = $2
               WHERE data_source_id = $3`,
            [mainBranchId, FAKE_TREE_SHA, dsId]
          );
          return dsId;
        };

        // Clear the branch's pull-skip tokens so the next pull fully re-examines git
        // (the fake orphan left the remote HEAD unchanged).
        const clearSkipTokens = (mainBranchId: string) =>
          delDs.query(
            `UPDATE organization_git_sync_branches
               SET last_synced_commit = NULL, apps_git_tree_sha = NULL, modules_git_tree_sha = NULL, data_sources_git_tree_sha = NULL
             WHERE id = $1`,
            [mainBranchId]
          );

        const appVersionRows = (appId: string, branchId?: string): Promise<any[]> =>
          delDs.query(
            `SELECT id, is_synced FROM app_versions WHERE app_id = $1${branchId ? ' AND branch_id = $2' : ''}`,
            branchId ? [appId, branchId] : [appId]
          );
        const appRowCount = async (appId: string): Promise<number> =>
          Number((await delDs.query(`SELECT count(*)::int AS c FROM apps WHERE id = $1`, [appId]))[0]?.c);
        const dataSourceRowCount = async (dsId: string): Promise<number> =>
          Number((await delDs.query(`SELECT count(*)::int AS c FROM data_sources WHERE id = $1`, [dsId]))[0]?.c);
        // DS orphan handling deactivates the branch DSV (is_active=false) rather than deleting
        // the row — see workspace-git-sync-adapter deserializeDataSources orphan sweep.
        const dsvActive = async (dsId: string, branchId: string): Promise<boolean | undefined> =>
          (
            await delDs.query(
              `SELECT is_active FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`,
              [dsId, branchId]
            )
          )[0]?.is_active;

        return {
          orgId,
          agent,
          auth,
          pull,
          editingVersionOf,
          configureGitMultiBranch,
          createFeatureBranch,
          createApp,
          coRelOf,
          makeSyncedOrphanApp,
          makeUnsyncedLocalApp,
          makeSyncedOrphanDataSource,
          clearSkipTokens,
          appVersionRows,
          appRowCount,
          dataSourceRowCount,
          dsvActive,
        };
      };

      // CASE 1 — a synced app removed from git has its default-branch VERSION rows deleted on pull.
      // The parent `apps` row is deliberately kept (removeOrphanedResources deletes AppVersion only).
      it('deletes the default-branch versions of a synced app that was removed from git after a merge to main', async () => {
        const ctx = await makeCtx('del-app-gl@tooljet.io');
        step(1, 'configure git + branching, pull main');
        const mainBranchId = await ctx.configureGitMultiBranch();

        step(2, 'manufacture a synced app orphan on main (absent from git), clear skip tokens');
        const { appId } = await ctx.makeSyncedOrphanApp('del-synced-app', 'front-end', mainBranchId);
        await ctx.clearSkipTokens(mainBranchId);
        expect(await ctx.appVersionRows(appId, mainBranchId)).toHaveLength(1);

        step(3, "pull main → the synced-but-removed-from-git app's branch versions are DELETED (apps row kept)");
        await ctx.pull(mainBranchId).expect(201);
        // The branch's AppVersion rows are gone (cascades handle children); the apps row survives.
        expect(await ctx.appVersionRows(appId, mainBranchId)).toHaveLength(0);
        expect(await ctx.appRowCount(appId)).toBe(1);
      }, 300000);

      // CASE 2 — a synced module removed from git has its branch versions deleted (apps row kept),
      // exactly like an app (removeOrphanedResources runs for the module kind too).
      // NOTE: data-source orphan DEACTIVATION (is_active=false) is covered by §11 (category-skip
      // control) — that path needs a real `data-sources/` tree in git so `deserializeDataSources`
      // runs its sweep; a from-empty-repo pull early-returns before the sweep, so it's not
      // exercised here.
      it('deletes the branch versions of a synced module removed from git (apps row kept)', async () => {
        const ctx = await makeCtx('del-mod-gl@tooljet.io');
        step(1, 'configure git + branching, pull main');
        const mainBranchId = await ctx.configureGitMultiBranch();

        step(2, 'manufacture a synced module orphan on main, clear skip tokens');
        const { appId: moduleId } = await ctx.makeSyncedOrphanApp('del-synced-mod', 'module', mainBranchId);
        await ctx.clearSkipTokens(mainBranchId);
        expect(await ctx.appVersionRows(moduleId, mainBranchId)).toHaveLength(1);

        step(3, 'pull main → module branch versions DELETED (apps row kept)');
        await ctx.pull(mainBranchId).expect(201);
        expect(await ctx.appVersionRows(moduleId, mainBranchId)).toHaveLength(0);
        expect(await ctx.appRowCount(moduleId)).toBe(1);
      }, 300000);

      // CASE 3 (GREEN) — an unsynced, never-pushed local resource absent from git is KEPT.
      it('keeps an unsynced (never-pushed) local resource that is absent from git', async () => {
        const ctx = await makeCtx('del-keep-local-gl@tooljet.io');
        step(1, 'configure git + branching, pull main');
        const mainBranchId = await ctx.configureGitMultiBranch();

        step(2, 'manufacture an UNSYNCED local app on main (is_synced=false, no git_tree_sha), clear skip tokens');
        const appId = await ctx.makeUnsyncedLocalApp('del-local-app', mainBranchId);
        await ctx.clearSkipTokens(mainBranchId);

        step(3, 'pull main → the local app survives (delete applies only to is_synced=true rows)');
        await ctx.pull(mainBranchId).expect(201);
        expect(await ctx.appRowCount(appId)).toBe(1);
        const rows = await ctx.appVersionRows(appId);
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.every((r: any) => r.is_synced === false)).toBe(true);
      }, 300000);

      // CASE 4 — a synced module removed from git but still referenced by another
      // app's ModuleViewer → pull ABORTS with a 409 in_use conflict; nothing is deleted.
      it('blocks the pull with a 409 in_use conflict when a to-be-deleted module is still referenced by an app', async () => {
        const { randomUUID } = await import('crypto');
        const ctx = await makeCtx('del-mod-inuse-gl@tooljet.io');
        step(1, 'configure git + branching, pull main');
        const mainBranchId = await ctx.configureGitMultiBranch();

        step(2, 'manufacture a synced module orphan');
        const { appId: moduleId, coRel: moduleCoRel } = await ctx.makeSyncedOrphanApp(
          'inuse-module',
          'module',
          mainBranchId
        );
        expect(moduleCoRel).toBeTruthy();

        step(
          3,
          'create a consumer app that references the module via a ModuleViewer, keep it as a local (kept) row on main'
        );
        const consumerFeat = await ctx.createFeatureBranch('feat-inuse-consumer', mainBranchId);
        const consumerId = await ctx.createApp('inuse-consumer', 'front-end', consumerFeat);
        const consumerCtx = await ctx.editingVersionOf(consumerId, consumerFeat);
        const mvId = randomUUID();
        await ctx
          .auth(ctx.agent().post(`/api/v2/apps/${consumerId}/versions/${consumerCtx.versionId}/components`))
          .query({ branch_id: consumerFeat })
          .send({
            is_user_switched_version: false,
            pageId: consumerCtx.pageId,
            diff: {
              [mvId]: {
                name: 'moduleviewer_inuse',
                layouts: {
                  desktop: { top: 70, left: 5, width: 38, height: 400 },
                  mobile: { top: 70, left: 5, width: 38, height: 400 },
                },
                type: 'ModuleViewer',
                general: {},
                generalStyles: { boxShadow: { value: '0px 0px 0px 0px #00000040' } },
                others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
                properties: {
                  moduleAppId: { value: moduleCoRel },
                  moduleVersionId: { value: '' },
                  visibility: { value: true },
                },
                styles: { backgroundColor: { value: '#fff' }, padding: { value: 'default' } },
                parent: null,
              },
            },
          })
          .expect(201);
        // Keep the consumer on main as a local (never-pushed) row so it survives the pull and
        // its reference to the module stays live.
        await delDs.query(
          `UPDATE app_versions SET version_type = 'version', branch_id = $1, is_synced = false, git_tree_sha = NULL
             WHERE app_id = $2`,
          [mainBranchId, consumerId]
        );
        await ctx.clearSkipTokens(mainBranchId);

        step(4, 'pull main → 409 in_use (module still referenced); the module is NOT deleted');
        const pullResp = await ctx.pull(mainBranchId).expect(409);
        const payload = JSON.parse(pullResp.body.message);
        expect(payload.conflictGroups).toEqual(
          expect.arrayContaining([expect.objectContaining({ type: 'module', conflictField: 'in_use' })])
        );
        // The module survives because the whole pull aborted before any deletion.
        expect(await ctx.appRowCount(moduleId)).toBe(1);
      }, 300000);

      // CASE 5 — a synced data source removed from git but still connected to an
      // app via a query → pull ABORTS with a 409 in_use conflict (type datasource).
      it('blocks the pull with a 409 in_use conflict when a to-be-deleted data source is still connected to an app', async () => {
        const ctx = await makeCtx('del-ds-inuse-gl@tooljet.io');
        step(1, 'configure git + branching, pull main');
        const mainBranchId = await ctx.configureGitMultiBranch();

        step(2, 'create a consumer app + a global data source, link them via a query, on one feature branch');
        const featBranchId = await ctx.createFeatureBranch('feat-ds-inuse', mainBranchId);
        const dsId: string = (
          await ctx
            .auth(ctx.agent().post(`/api/data-sources?branch_id=${featBranchId}`))
            .send({
              name: 'inuse-ds',
              kind: 'restapi',
              options: [
                { key: 'url', value: 'http://inuse-ds.example.com' },
                { key: 'auth_type', value: 'none' },
                { key: 'headers', value: [['', '']] },
                { key: 'ssl_certificate', value: 'none', encrypted: false },
              ],
              scope: 'global',
            })
            .expect(201)
        ).body.id;
        const consumerId = await ctx.createApp('inuse-ds-consumer', 'front-end', featBranchId);
        const consumerCtx = await ctx.editingVersionOf(consumerId, featBranchId);
        await ctx
          .auth(ctx.agent().post(`/api/data-queries/data-sources/${dsId}/versions/${consumerCtx.versionId}`))
          .query({ branch_id: featBranchId })
          .send({
            kind: 'restapi',
            name: 'q_inuse_ds',
            options: { method: 'get', url: '', url_params: [], headers: [], body: [] },
          })
          .expect(201);

        step(3, 'move the data source onto main as a synced orphan; keep the consumer as a local (kept) row');
        await delDs.query(
          `UPDATE data_source_versions SET branch_id = $1, is_synced = true, git_tree_sha = $2 WHERE data_source_id = $3`,
          [mainBranchId, FAKE_TREE_SHA, dsId]
        );
        await delDs.query(
          `UPDATE app_versions SET version_type = 'version', branch_id = $1, is_synced = false, git_tree_sha = NULL WHERE app_id = $2`,
          [mainBranchId, consumerId]
        );
        await ctx.clearSkipTokens(mainBranchId);

        step(4, 'pull main → 409 in_use (data source still connected); the data source is NOT deleted');
        const pullResp = await ctx.pull(mainBranchId).expect(409);
        const payload = JSON.parse(pullResp.body.message);
        expect(payload.conflictGroups).toEqual(
          expect.arrayContaining([expect.objectContaining({ type: 'datasource', conflictField: 'in_use' })])
        );
        expect(await ctx.dataSourceRowCount(dsId)).toBe(1);
      }, 300000);

      // CASE 6 — after the blocking reference is removed, a re-pull succeeds and
      // deletes the now-unreferenced module.
      it('deletes the module on a re-pull once the referencing app is removed', async () => {
        const { randomUUID } = await import('crypto');
        const ctx = await makeCtx('del-repull-gl@tooljet.io');
        step(1, 'configure git + branching, pull main');
        const mainBranchId = await ctx.configureGitMultiBranch();

        step(2, 'synced module orphan + a consumer app referencing it (kept local on main)');
        const { appId: moduleId, coRel: moduleCoRel } = await ctx.makeSyncedOrphanApp(
          'repull-module',
          'module',
          mainBranchId
        );
        const consumerFeat = await ctx.createFeatureBranch('feat-repull-consumer', mainBranchId);
        const consumerId = await ctx.createApp('repull-consumer', 'front-end', consumerFeat);
        const consumerCtx = await ctx.editingVersionOf(consumerId, consumerFeat);
        const mvId = randomUUID();
        await ctx
          .auth(ctx.agent().post(`/api/v2/apps/${consumerId}/versions/${consumerCtx.versionId}/components`))
          .query({ branch_id: consumerFeat })
          .send({
            is_user_switched_version: false,
            pageId: consumerCtx.pageId,
            diff: {
              [mvId]: {
                name: 'moduleviewer_repull',
                layouts: {
                  desktop: { top: 70, left: 5, width: 38, height: 400 },
                  mobile: { top: 70, left: 5, width: 38, height: 400 },
                },
                type: 'ModuleViewer',
                general: {},
                generalStyles: {},
                others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
                properties: {
                  moduleAppId: { value: moduleCoRel },
                  moduleVersionId: { value: '' },
                  visibility: { value: true },
                },
                styles: {},
                parent: null,
              },
            },
          })
          .expect(201);
        await delDs.query(
          `UPDATE app_versions SET version_type = 'version', branch_id = $1, is_synced = false, git_tree_sha = NULL WHERE app_id = $2`,
          [mainBranchId, consumerId]
        );
        await ctx.clearSkipTokens(mainBranchId);

        step(3, 'first pull → 409 in_use (module still referenced); the module version survives');
        await ctx.pull(mainBranchId).expect(409);
        expect(await ctx.appVersionRows(moduleId, mainBranchId)).toHaveLength(1);

        step(4, 'remove the referencing consumer app, clear skip tokens, re-pull → module branch versions deleted');
        await ctx.auth(ctx.agent().delete(`/api/apps/${consumerId}`).query({ branch_id: mainBranchId }));
        await ctx.clearSkipTokens(mainBranchId);
        await ctx.pull(mainBranchId).expect(201);
        // Branch versions gone (apps row kept), matching removeOrphanedResources.
        expect(await ctx.appVersionRows(moduleId, mainBranchId)).toHaveLength(0);
        expect(await ctx.appRowCount(moduleId)).toBe(1);
      }, 300000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // App commit cascades ALL connected resources (SINGLE branch). GitLab mirror of §32.
    //
    // Graph under test:
    //   app A ──(query)──▶ data source dsA
    //   app A ──(ModuleViewer)──▶ module M ──(query)──▶ data source dsB
    // dsB is linked ONLY inside module M (never directly to A). A single `gitpush` of app A
    // onto the (unprotected) single-branch default must commit EVERY connected resource in
    // one shot — A, dsA, M, AND dsB — where dsB rides in via
    // writeReferencedModules → serializeLinkedDataSourcesForApp(M.version) (EE #794). A
    // round-trip pull then reconciles the whole graph to is_synced=true. Against the real
    // GitLab-shaped simulator (@group gitsync).
    // ────────────────────────────────────────────────────────────────────────────
    describe('app commit cascades all connected resources (single-branch)', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;
      // Non-`main` → unprotected on the simulator → direct single-branch pushes are allowed.
      const SB_BRANCH = 'single-branch-main';

      let ccOrgId: string;
      let ccCookie: string[];
      let ccDs: DataSource;

      const agent = () => request.agent(app.getHttpServer());
      const auth = (r: request.Test) => r.set('Cookie', ccCookie).set('tj-workspace-id', ccOrgId);
      const pull = (branchId: string) =>
        auth(agent().post('/api/workspace-branches/pull')).query({ branch_id: branchId }).send({ branchId });
      const gitpush = (appId: string, versionId: string, gitAppName: string, branchId: string) =>
        auth(agent().post(`/api/app-git/gitpush/${appId}/${versionId}`))
          .query({ branch_id: branchId })
          .send({
            gitAppName,
            versionId,
            lastCommitMessage: `push ${gitAppName}`,
            gitVersionName: SB_BRANCH,
            sourceBranch: SB_BRANCH,
          });
      const editingVersionOf = async (appId: string, branchId: string) => {
        const d = await auth(agent().get(`/api/apps/${appId}`))
          .query({ branch_id: branchId })
          .expect(200);
        const ev = d.body?.editing_version || d.body?.editingVersion || d.body?.app?.editing_version;
        const pageId = ev.home_page_id || ev.homePageId || ev.pages?.[0]?.id || d.body?.pages?.[0]?.id;
        return { versionId: ev.id as string, pageId: pageId as string };
      };
      const dsvName = async (dsId: string, branchId: string): Promise<string> =>
        (
          await ccDs.query(`SELECT name FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`, [
            dsId,
            branchId,
          ])
        )[0]?.name;
      const dsvSynced = async (dsId: string, branchId: string): Promise<boolean> =>
        (
          await ccDs.query(`SELECT is_synced FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`, [
            dsId,
            branchId,
          ])
        )[0]?.is_synced;
      const dsCoRelId = async (dsId: string): Promise<string> =>
        (await ccDs.query(`SELECT co_relation_id FROM data_sources WHERE id = $1`, [dsId]))[0]?.co_relation_id;
      const appCoRelId = async (appId: string): Promise<string> =>
        (await ccDs.query(`SELECT co_relation_id FROM apps WHERE id = $1`, [appId]))[0]?.co_relation_id;
      // is_synced of the branch's non-stub (materialized) version for an app/module.
      const nonStubVersionSynced = async (appId: string, branchId: string): Promise<boolean | undefined> =>
        (
          await ccDs.query(
            `SELECT is_synced FROM app_versions WHERE app_id = $1 AND branch_id = $2 AND is_stub = false ORDER BY created_at DESC LIMIT 1`,
            [appId, branchId]
          )
        )[0]?.is_synced;
      const dsOptions = (url: string) => [
        { key: 'url', value: url },
        { key: 'auth_type', value: 'none' },
        { key: 'headers', value: [['', '']] },
        { key: 'ssl_certificate', value: 'none', encrypted: false },
      ];
      const linkDsViaQuery = (dsId: string, versionId: string, branchId: string, name: string) =>
        auth(agent().post(`/api/data-queries/data-sources/${dsId}/versions/${versionId}`))
          .query({ branch_id: branchId })
          .send({
            kind: 'restapi',
            name,
            options: { method: 'get', url: '', url_params: [], headers: [], body: [] },
          });
      const wireModuleViewer = (
        appId: string,
        versionId: string,
        pageId: string,
        moduleCoRel: string,
        branchId: string
      ) =>
        auth(agent().post(`/api/v2/apps/${appId}/versions/${versionId}/components`))
          .query({ branch_id: branchId })
          .send({
            is_user_switched_version: false,
            pageId,
            diff: {
              [genRepoUUID()]: {
                name: 'moduleviewer1',
                layouts: {
                  desktop: { top: 70, left: 5, width: 38, height: 400 },
                  mobile: { top: 70, left: 5, width: 38, height: 400 },
                },
                type: 'ModuleViewer',
                general: {},
                generalStyles: { boxShadow: { value: '0px 0px 0px 0px #00000040' } },
                others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
                properties: {
                  moduleAppId: { value: moduleCoRel },
                  moduleVersionId: { value: '' },
                  visibility: { value: true },
                },
                styles: { backgroundColor: { value: '#fff' }, padding: { value: 'default' } },
                parent: null,
              },
            },
          });

      // Clone a branch once and expose file-existence, JSON-read, and identity probes over its tree.
      const inspectBranch = async (branch: string) => {
        const simpleGit = (await import('simple-git')).default;
        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');
        const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tj-cc-gl-'));
        const git = simpleGit({
          baseDir: tmpDir,
          timeout: { block: 30000 },
          unsafe: { allowUnsafeCredentialHelper: true },
        });
        await git.clone(`${GIT_BASE_URL}/${GIT_REPO_PATH}.git`, '.', [
          '--branch',
          branch,
          '--depth',
          '1',
          '--single-branch',
        ]);
        const readJson = (rel: string) => {
          const full = path.join(tmpDir, rel);
          return fs.existsSync(full) ? JSON.parse(fs.readFileSync(full, 'utf-8')) : null;
        };
        // Robust to the folder-name layout: scan <folder>/**/app/app.json for the co_relation_id.
        const resourceHasCoRel = (folder: string, coRel: string): boolean => {
          const root = path.join(tmpDir, folder);
          if (!fs.existsSync(root)) return false;
          const stack = [root];
          while (stack.length) {
            const dir = stack.pop() as string;
            for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
              const full = path.join(dir, ent.name);
              if (ent.isDirectory()) {
                stack.push(full);
              } else if (ent.name === 'app.json') {
                try {
                  if (JSON.parse(fs.readFileSync(full, 'utf-8'))?.id === coRel) return true;
                } catch {
                  /* skip malformed */
                }
              }
            }
          }
          return false;
        };
        const cleanup = () => fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        return { readJson, resourceHasCoRel, cleanup };
      };

      // Reset the repo + configure single-branch git (unprotected non-`main` default) and pull it.
      const enableSingleBranchGit = async (): Promise<string> => {
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, branchName: SB_BRANCH, useEnvConfig: false })
          .expect(201);
        const gitConfig = await auth(agent().get(`/api/git-sync/${ccOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: false })
          .expect(200);
        const branchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body.activeBranchId;
        await pull(branchId).expect(201);
        return branchId;
      };

      // Add a second default-branch (VERSION-type) non-stub, unsynced draft to a module by copying
      // an existing version row — the ambiguous "which draft do I commit?" state writeReferencedModules
      // cannot resolve, so an app push carrying the module must block (MODULES_NOT_READY). VERSION-type
      // allows multiple drafts per branch (only name/slug/app_name uniqueness applies), hence the
      // distinct suffixes. Mirrors the injection in the §27 cross-branch multidraft case.
      const addExtraModuleDraft = async (moduleId: string, branchId: string, suffix: string) => {
        await ccDs.query(
          `INSERT INTO app_versions (
             name, definition, global_settings, page_settings, show_viewer_navigation,
             version_type, app_id, current_environment_id, status, is_stub, is_synced,
             branch_id, slug, app_name, icon, is_public
           )
           SELECT
             name || '-' || $2, definition, global_settings, page_settings, show_viewer_navigation,
             'version', app_id, current_environment_id, 'DRAFT', false, false,
             $3, COALESCE(slug, '') || '-' || $2, COALESCE(app_name, name) || '-' || $2, icon, is_public
           FROM app_versions WHERE app_id = $1 LIMIT 1`,
          [moduleId, suffix, branchId]
        );
      };

      beforeAll(async () => {
        const { organization } = await createUser(app, {
          email: 'git-commit-cascade-gl@tooljet.io',
          firstName: 'git',
          lastName: 'commitcascade',
        });
        ccOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-commit-cascade-gl@tooljet.io');
        ccCookie = tokenCookie;
        await ensureAppEnvironments(app, ccOrgId);
        ccDs = app.get<DataSource>(getDataSourceToken('default'));
        // Seed the workspace default branch already named `single-branch-main` so the git config
        // finalize keeps it (rather than renaming a `main` default) — mirrors §18.
        await ccDs.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, $2, true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [ccOrgId, SB_BRANCH]
        );
      });

      it('commits the app, its data source, the connected module and the data source used only inside that module — in one push', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);

        // ── 1. single-branch git on the (unprotected) non-main default ───────────────────
        step(1, 'reset gitea, configure git (default single-branch-main), disable branching, pull default');
        const branchId = await enableSingleBranchGit();

        // ── 2. build the resource graph on the default branch ────────────────────────────
        step(2, 'create app A + module M + dsA (linked to A) + dsB (linked to M); wire A ModuleViewer → M');
        const appId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: branchId })
            .send({ icon: 'home', name: 'cc-app', type: 'front-end', branchId })
            .expect(201)
        ).body.id;
        const appCtx = await editingVersionOf(appId, branchId);
        const moduleId: string = (
          await auth(agent().post('/api/modules'))
            .query({ branch_id: branchId })
            .send({ icon: 'folderupload', name: 'cc-module', type: 'module', branchId })
            .expect(201)
        ).body.id;
        const moduleCtx = await editingVersionOf(moduleId, branchId);
        const moduleCoRel = await appCoRelId(moduleId);
        expect(moduleCoRel).toBeTruthy();

        // dsA is linked to app A; dsB is linked ONLY to module M (never directly to A).
        const dsAId: string = (
          await auth(agent().post(`/api/data-sources?branch_id=${branchId}`))
            .send({
              name: 'cc-ds-app',
              kind: 'restapi',
              options: dsOptions('http://cc-ds-app.example.com'),
              scope: 'global',
            })
            .expect(201)
        ).body.id;
        await linkDsViaQuery(dsAId, appCtx.versionId, branchId, 'q_cc_app').expect(201);
        const dsBId: string = (
          await auth(agent().post(`/api/data-sources?branch_id=${branchId}`))
            .send({
              name: 'cc-ds-module',
              kind: 'restapi',
              options: dsOptions('http://cc-ds-module.example.com'),
              scope: 'global',
            })
            .expect(201)
        ).body.id;
        await linkDsViaQuery(dsBId, moduleCtx.versionId, branchId, 'q_cc_module').expect(201);

        await wireModuleViewer(appId, appCtx.versionId, appCtx.pageId, moduleCoRel, branchId).expect(201);
        const dsAName = await dsvName(dsAId, branchId);
        const dsBName = await dsvName(dsBId, branchId);

        // ── 3. ONE app push carries the whole graph ──────────────────────────────────────
        step(3, 'gitpush app A once → the cascade carries dsA, module M and M-only dsB');
        await gitpush(appId, appCtx.versionId, 'cc-app', branchId).expect(201);

        // ── 4. every connected resource is committed on the default branch ───────────────
        step(4, 'clone the default branch → app, module, dsA and dsB all present in git');
        const tree = await inspectBranch(SB_BRANCH);
        try {
          expect(tree.resourceHasCoRel('apps', await appCoRelId(appId))).toBe(true);
          expect(tree.resourceHasCoRel('modules', moduleCoRel)).toBe(true);
          expect(tree.readJson(`data-sources/${dsAName}/data-source.json`)?.id).toBe(await dsCoRelId(dsAId));
          // The key assertion: dsB — linked only inside module M — rode into A's push (EE #794).
          expect(tree.readJson(`data-sources/${dsBName}/data-source.json`)?.id).toBe(await dsCoRelId(dsBId));
        } finally {
          await tree.cleanup();
        }

        // ── 5. a round-trip pull reconciles the whole graph to is_synced=true ────────────
        step(5, 'pull the default branch → app, module, dsA and dsB all is_synced=true');
        await pull(branchId).expect(201);
        expect(await nonStubVersionSynced(appId, branchId)).toBe(true);
        expect(await nonStubVersionSynced(moduleId, branchId)).toBe(true);
        expect(await dsvSynced(dsAId, branchId)).toBe(true);
        expect(await dsvSynced(dsBId, branchId)).toBe(true);
      }, 300000);

      // A connected module is bootstrapped into the app's commit from its single default-branch
      // draft (writeReferencedModules). If the module has MULTIPLE drafts, an arbitrary one would
      // be committed silently, so the push must fail — MODULES_NOT_READY, naming the module — the
      // same class of error the app raises for its own multiple drafts. This is the single-branch
      // counterpart of the §27 (multi-branch) multidraft guard; nothing else covers single-branch.
      it('blocks the commit when the connected module has multiple draft versions', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);

        step(1, 'single-branch git on the default branch');
        const branchId = await enableSingleBranchGit();

        step(2, 'create app A + module M on the default branch; wire A ModuleViewer → M');
        const appId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: branchId })
            .send({ icon: 'home', name: 'cc-multidraft-app', type: 'front-end', branchId })
            .expect(201)
        ).body.id;
        const appCtx = await editingVersionOf(appId, branchId);
        const moduleId: string = (
          await auth(agent().post('/api/modules'))
            .query({ branch_id: branchId })
            .send({ icon: 'folderupload', name: 'cc-multidraft-module', type: 'module', branchId })
            .expect(201)
        ).body.id;
        const moduleCoRel = await appCoRelId(moduleId);
        expect(moduleCoRel).toBeTruthy();
        await wireModuleViewer(appId, appCtx.versionId, appCtx.pageId, moduleCoRel, branchId).expect(201);

        step(3, 'give module M a SECOND default-branch draft — the ambiguous state a bootstrap cannot resolve');
        await addExtraModuleDraft(moduleId, branchId, 'md2');
        const modDraftCount: number = (
          await ccDs.query(
            `SELECT COUNT(*)::int AS c FROM app_versions
               WHERE app_id = $1 AND branch_id = $2 AND status = 'DRAFT' AND is_stub = false`,
            [moduleId, branchId]
          )
        )[0].c;
        expect(modDraftCount).toBeGreaterThan(1);

        step(4, 'gitpush app A → blocked: the connected module has multiple drafts (MODULES_NOT_READY)');
        // AllExceptionsFilter forwards only `message`, so the offending module name rides in it.
        const pushResp = await gitpush(appId, appCtx.versionId, 'cc-multidraft-app', branchId);
        expect(pushResp.status).toBe(400);
        expect(pushResp.body.message).toMatch(/not ready to sync/i);
        expect(pushResp.body.message).toContain('cc-multidraft-module');
      }, 300000);
    });

    // ────────────────────────────────────────────────────────────────────────────
    // App sync cascades ALL connected resources onto the feature branch (MULTI branch).
    // GitLab mirror of §33.
    //
    // Same graph as the single-branch case above (app A ──▶ dsA + module M; module M ──▶ dsB),
    // but with branching ON: syncing app A to a feature branch must ADD every connected
    // resource to that branch in one push — A, dsA, M, and dsB (the data source used only
    // inside M). Against the real GitLab-shaped simulator (@group gitsync).
    // ────────────────────────────────────────────────────────────────────────────
    describe('app sync cascades all connected resources onto the feature branch (multi-branch)', () => {
      const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;

      let scOrgId: string;
      let scCookie: string[];
      let scDs: DataSource;

      const agent = () => request.agent(app.getHttpServer());
      const auth = (r: request.Test) => r.set('Cookie', scCookie).set('tj-workspace-id', scOrgId);
      const pull = (branchId: string) =>
        auth(agent().post('/api/workspace-branches/pull')).query({ branch_id: branchId }).send({ branchId });
      const branchIdByName = async (name: string, xBranchId: string): Promise<string> =>
        (
          await auth(agent().get('/api/workspace-branches')).set('x-branch-id', xBranchId).expect(200)
        ).body.branches.find((b: any) => b.name === name)?.id;
      const editingVersionOf = async (appId: string, branchId: string) => {
        const d = await auth(agent().get(`/api/apps/${appId}`))
          .query({ branch_id: branchId })
          .expect(200);
        const ev = d.body?.editing_version || d.body?.editingVersion || d.body?.app?.editing_version;
        const pageId = ev.home_page_id || ev.homePageId || ev.pages?.[0]?.id || d.body?.pages?.[0]?.id;
        return { versionId: ev.id as string, pageId: pageId as string };
      };
      const gitpush = (appId: string, versionId: string, gitAppName: string, branchName: string, branchId: string) =>
        auth(agent().post(`/api/app-git/gitpush/${appId}/${versionId}`))
          .query({ branch_id: branchId })
          .send({
            gitAppName,
            versionId,
            lastCommitMessage: `push ${gitAppName}`,
            gitVersionName: branchName,
            sourceBranch: branchName,
          });
      const dsvName = async (dsId: string, branchId: string): Promise<string> =>
        (
          await scDs.query(`SELECT name FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`, [
            dsId,
            branchId,
          ])
        )[0]?.name;
      const dsCoRelId = async (dsId: string): Promise<string> =>
        (await scDs.query(`SELECT co_relation_id FROM data_sources WHERE id = $1`, [dsId]))[0]?.co_relation_id;
      const appCoRelId = async (appId: string): Promise<string> =>
        (await scDs.query(`SELECT co_relation_id FROM apps WHERE id = $1`, [appId]))[0]?.co_relation_id;
      const nonStubVersionSynced = async (appId: string, branchId: string): Promise<boolean | undefined> =>
        (
          await scDs.query(
            `SELECT is_synced FROM app_versions WHERE app_id = $1 AND branch_id = $2 AND is_stub = false ORDER BY created_at DESC LIMIT 1`,
            [appId, branchId]
          )
        )[0]?.is_synced;
      const dsOptions = (url: string) => [
        { key: 'url', value: url },
        { key: 'auth_type', value: 'none' },
        { key: 'headers', value: [['', '']] },
        { key: 'ssl_certificate', value: 'none', encrypted: false },
      ];
      const linkDsViaQuery = (dsId: string, versionId: string, branchId: string, name: string) =>
        auth(agent().post(`/api/data-queries/data-sources/${dsId}/versions/${versionId}`))
          .query({ branch_id: branchId })
          .send({
            kind: 'restapi',
            name,
            options: { method: 'get', url: '', url_params: [], headers: [], body: [] },
          });
      const wireModuleViewer = (
        appId: string,
        versionId: string,
        pageId: string,
        moduleCoRel: string,
        branchId: string
      ) =>
        auth(agent().post(`/api/v2/apps/${appId}/versions/${versionId}/components`))
          .query({ branch_id: branchId })
          .send({
            is_user_switched_version: false,
            pageId,
            diff: {
              [genRepoUUID()]: {
                name: 'moduleviewer1',
                layouts: {
                  desktop: { top: 70, left: 5, width: 38, height: 400 },
                  mobile: { top: 70, left: 5, width: 38, height: 400 },
                },
                type: 'ModuleViewer',
                general: {},
                generalStyles: { boxShadow: { value: '0px 0px 0px 0px #00000040' } },
                others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
                properties: {
                  moduleAppId: { value: moduleCoRel },
                  moduleVersionId: { value: '' },
                  visibility: { value: true },
                },
                styles: { backgroundColor: { value: '#fff' }, padding: { value: 'default' } },
                parent: null,
              },
            },
          });

      // Clone a branch once and expose JSON-read + identity probes over its tree.
      const inspectBranch = async (branch: string) => {
        const simpleGit = (await import('simple-git')).default;
        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');
        const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tj-sc-gl-'));
        const git = simpleGit({
          baseDir: tmpDir,
          timeout: { block: 30000 },
          unsafe: { allowUnsafeCredentialHelper: true },
        });
        await git.clone(`${GIT_BASE_URL}/${GIT_REPO_PATH}.git`, '.', [
          '--branch',
          branch,
          '--depth',
          '1',
          '--single-branch',
        ]);
        const readJson = (rel: string) => {
          const full = path.join(tmpDir, rel);
          return fs.existsSync(full) ? JSON.parse(fs.readFileSync(full, 'utf-8')) : null;
        };
        const resourceHasCoRel = (folder: string, coRel: string): boolean => {
          const root = path.join(tmpDir, folder);
          if (!fs.existsSync(root)) return false;
          const stack = [root];
          while (stack.length) {
            const dir = stack.pop() as string;
            for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
              const full = path.join(dir, ent.name);
              if (ent.isDirectory()) {
                stack.push(full);
              } else if (ent.name === 'app.json') {
                try {
                  if (JSON.parse(fs.readFileSync(full, 'utf-8'))?.id === coRel) return true;
                } catch {
                  /* skip malformed */
                }
              }
            }
          }
          return false;
        };
        const cleanup = () => fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        return { readJson, resourceHasCoRel, cleanup };
      };

      const enableGitAndFeatureBranch = async (
        featName: string
      ): Promise<{ mainBranchId: string; featBranchId: string }> => {
        await fetch(RESET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BASIC },
          body: '{}',
        });
        await auth(agent().post('/api/git-sync/configs'))
          .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
          .expect(201);
        const gitConfig = await auth(agent().get(`/api/git-sync/${scOrgId}`)).expect(200);
        const orgGitId: string = gitConfig.body.organization_git.id;
        await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
          .send({ isBranchingEnabled: true })
          .expect(200);
        const mainBranchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body
          .activeBranchId;
        await pull(mainBranchId).expect(201);
        await auth(agent().post('/api/workspace-branches'))
          .query({ branch_id: mainBranchId })
          .send({ name: featName, sourceBranchId: mainBranchId })
          .expect(201);
        const featBranchId = await branchIdByName(featName, mainBranchId);
        expect(featBranchId).toBeDefined();
        return { mainBranchId, featBranchId };
      };

      // Add a default-branch (VERSION-type) non-stub, unsynced draft to a module by copying an
      // existing version row. writeReferencedModules bootstraps a never-synced module from its
      // default-branch draft, so >1 such draft is the ambiguous state that must block the app push
      // (MODULES_NOT_READY). Mirrors the injection in the §27 cross-branch multidraft case.
      const addExtraModuleDraft = async (moduleId: string, branchId: string, suffix: string) => {
        await scDs.query(
          `INSERT INTO app_versions (
             name, definition, global_settings, page_settings, show_viewer_navigation,
             version_type, app_id, current_environment_id, status, is_stub, is_synced,
             branch_id, slug, app_name, icon, is_public
           )
           SELECT
             name || '-' || $2, definition, global_settings, page_settings, show_viewer_navigation,
             'version', app_id, current_environment_id, 'DRAFT', false, false,
             $3, COALESCE(slug, '') || '-' || $2, COALESCE(app_name, name) || '-' || $2, icon, is_public
           FROM app_versions WHERE app_id = $1 LIMIT 1`,
          [moduleId, suffix, branchId]
        );
      };

      beforeAll(async () => {
        const { organization } = await createUser(app, {
          email: 'git-sync-cascade-gl@tooljet.io',
          firstName: 'git',
          lastName: 'synccascade',
        });
        scOrgId = organization.id;
        const { tokenCookie } = await login(app, 'git-sync-cascade-gl@tooljet.io');
        scCookie = tokenCookie;
        await ensureAppEnvironments(app, scOrgId);
        scDs = app.get<DataSource>(getDataSourceToken('default'));
        await scDs.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [scOrgId]
        );
      });

      it('adds the app, its data source, the connected module and the module-only data source to the branch in one push', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const FEAT = 'feat-sync-cascade';

        // ── 1. enable git + branching, create a feature branch ───────────────────────────
        step(1, 'enable git + branching, create feature branch');
        const { featBranchId } = await enableGitAndFeatureBranch(FEAT);

        // ── 2. build the resource graph on the feature branch ────────────────────────────
        step(
          2,
          'create app A + module M + dsA (linked to A) + dsB (linked to M) on the feature branch; wire A ModuleViewer → M'
        );
        const appId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'home', name: 'sc-app', type: 'front-end', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const appCtx = await editingVersionOf(appId, featBranchId);
        const moduleId: string = (
          await auth(agent().post('/api/modules'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'folderupload', name: 'sc-module', type: 'module', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const moduleCtx = await editingVersionOf(moduleId, featBranchId);
        const moduleCoRel = await appCoRelId(moduleId);
        expect(moduleCoRel).toBeTruthy();

        const dsAId: string = (
          await auth(agent().post(`/api/data-sources?branch_id=${featBranchId}`))
            .send({
              name: 'sc-ds-app',
              kind: 'restapi',
              options: dsOptions('http://sc-ds-app.example.com'),
              scope: 'global',
            })
            .expect(201)
        ).body.id;
        await linkDsViaQuery(dsAId, appCtx.versionId, featBranchId, 'q_sc_app').expect(201);
        const dsBId: string = (
          await auth(agent().post(`/api/data-sources?branch_id=${featBranchId}`))
            .send({
              name: 'sc-ds-module',
              kind: 'restapi',
              options: dsOptions('http://sc-ds-module.example.com'),
              scope: 'global',
            })
            .expect(201)
        ).body.id;
        await linkDsViaQuery(dsBId, moduleCtx.versionId, featBranchId, 'q_sc_module').expect(201);

        await wireModuleViewer(appId, appCtx.versionId, appCtx.pageId, moduleCoRel, featBranchId).expect(201);
        const dsAName = await dsvName(dsAId, featBranchId);
        const dsBName = await dsvName(dsBId, featBranchId);

        // ── 3. ONE app push adds the whole graph to the feature branch ───────────────────
        step(3, 'gitpush app A once → the cascade adds dsA, module M and M-only dsB to the feature branch');
        await gitpush(appId, appCtx.versionId, 'sc-app', FEAT, featBranchId).expect(201);

        // ── 4. every connected resource is present on the feature branch ─────────────────
        step(4, 'clone the feature branch → app, module, dsA and dsB all present in git');
        const tree = await inspectBranch(FEAT);
        try {
          expect(tree.resourceHasCoRel('apps', await appCoRelId(appId))).toBe(true);
          expect(tree.resourceHasCoRel('modules', moduleCoRel)).toBe(true);
          expect(tree.readJson(`data-sources/${dsAName}/data-source.json`)?.id).toBe(await dsCoRelId(dsAId));
          // The key assertion: dsB — linked only inside module M — rode into A's push (EE #794).
          expect(tree.readJson(`data-sources/${dsBName}/data-source.json`)?.id).toBe(await dsCoRelId(dsBId));
        } finally {
          await tree.cleanup();
        }

        // ── 5. the pushed app version is synced on the feature branch ────────────────────
        step(5, 'the pushed app version is is_synced=true on the feature branch');
        expect(await nonStubVersionSynced(appId, featBranchId)).toBe(true);
      }, 300000);

      // Multi-branch counterpart of the single-branch multidraft guard above (and of §27's
      // standalone case), inside this cascade suite: syncing the host app must fail when the
      // connected module carries multiple default-branch drafts. The module draft count is
      // measured on the DEFAULT branch (getConnectedModulesBlockingPush), so the extra drafts
      // are injected there even though the module lives on the feature branch.
      it('blocks the sync when the connected module has multiple draft versions', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const FEAT = 'feat-sync-cascade-multidraft';

        step(1, 'enable git + branching, create feature branch');
        const { mainBranchId, featBranchId } = await enableGitAndFeatureBranch(FEAT);

        step(2, 'create module M on the feature branch; give it TWO default-branch drafts');
        const moduleId: string = (
          await auth(agent().post('/api/modules'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'folderupload', name: 'sc-multidraft-module', type: 'module', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const moduleCoRel = await appCoRelId(moduleId);
        expect(moduleCoRel).toBeTruthy();
        await addExtraModuleDraft(moduleId, mainBranchId, 'md1');
        await addExtraModuleDraft(moduleId, mainBranchId, 'md2');
        const modDraftCount: number = (
          await scDs.query(
            `SELECT COUNT(*)::int AS c FROM app_versions
               WHERE app_id = $1 AND branch_id = $2 AND status = 'DRAFT' AND is_stub = false`,
            [moduleId, mainBranchId]
          )
        )[0].c;
        expect(modDraftCount).toBeGreaterThan(1);

        step(3, 'create host app A on the feature branch referencing M via a ModuleViewer');
        const appId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: featBranchId })
            .send({ icon: 'home', name: 'sc-multidraft-host', type: 'front-end', branchId: featBranchId })
            .expect(201)
        ).body.id;
        const appCtx = await editingVersionOf(appId, featBranchId);
        await wireModuleViewer(appId, appCtx.versionId, appCtx.pageId, moduleCoRel, featBranchId).expect(201);

        step(4, 'gitpush host app A → blocked: the connected module has multiple drafts (MODULES_NOT_READY)');
        const pushResp = await gitpush(appId, appCtx.versionId, 'sc-multidraft-host', FEAT, featBranchId);
        expect(pushResp.status).toBe(400);
        expect(pushResp.body.message).toMatch(/not ready to sync/i);
        expect(pushResp.body.message).toContain('sc-multidraft-module');
      }, 300000);
    });
  });
});
