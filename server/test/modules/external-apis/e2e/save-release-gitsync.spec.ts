import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { randomUUID as genRepoUUID } from 'crypto';
import { createUser, initTestApp, login, closeTestApp, ensureAppEnvironments } from 'test-helper';
import { WorkspaceBranchService } from '@ee/workspace-branches/service';
import { GitSyncQueueService } from '@ee/workspace-branches/git-sync-queue.service';

/**
 * External API — POST /ext/apps/:appIdOrSlug/versions/save and
 * POST /ext/apps/:appIdOrSlug/git-sync/release against a REAL git host.
 *
 * Every other External API spec in this suite stubs `SourceControlProviderService`
 * at the boundary (per testing.md's mock-only-boundaries-you-don't-own rule) — correct
 * for exercising the DB-side publish/promote logic deterministically, but it means the
 * actual GitHub App auth → Octokit tag creation → tag lookup wiring behind `saveAppVersion`
 * and `autoDeployApp`'s "latest tag" auto mode has never run end-to-end (see
 * git-sync-e2e-test-architecture memory, open threads #1/#2).
 *
 * This file closes that gap: real git config, a real feature-branch push + merge (mirrors
 * git-sync.spec.ts §2 steps 1-19), then the External API — not the internal `/api/*`
 * endpoints — drives save (real tag created on the simulator) and release-with-no-body
 * (real tag discovered via Octokit and promoted to production).
 *
 * Self-guards like git-sync-gitlab.spec.ts: skips the whole suite at runtime when the
 * simulator env is absent, so a plain `npm run test:e2e` stays green without it. Uses its
 * own repo path (GitHub suite's `TEST_GIT_REPO_PATH` + `-ext-api`) so it can't collide with
 * git-sync.spec.ts's shared, stateful 64-step fixture.
 */
const REQUIRED_ENV = [
  'TEST_GIT_BASE_URL',
  'TOOLJET_GIT_ADMIN_USER',
  'TOOLJET_GIT_ADMIN_PASSWORD',
  'TOOLJET_GITHUB_APP_ID',
  'TOOLJET_GITHUB_INSTALLATION_ID',
  'TOOLJET_GITHUB_APP_PRIVATE_KEY',
];
const MISSING_ENV = REQUIRED_ENV.filter((name) => !process.env[name]);
const GITSYNC_E2E_ENABLED = MISSING_ENV.length === 0;
if (!GITSYNC_E2E_ENABLED) {
  console.warn(
    `[save-release-gitsync] SKIPPED — set ${MISSING_ENV.join(', ')} (plus a GitHub-Enterprise-shaped simulator) to run this suite.`
  );
}
const describeGitsync = GITSYNC_E2E_ENABLED ? describe : describe.skip;

const GIT_BASE_URL = (process.env.TEST_GIT_BASE_URL || '').replace(/\/$/, '');
// Own repo, distinct from git-sync.spec.ts's `TEST_GIT_REPO_PATH` — same base,
// `-ext-api` suffix, so a shared per-run TEST_GIT_REPO_PATH (minted by
// scripts/run-e2e.sh) still yields a private repo here. The fallback (direct spec
// runs) is a throwaway `run-ci/<uuid>` the simulator auto-creates on first access.
const GIT_REPO_PATH = `${(process.env.TEST_GIT_REPO_PATH || `run-ci/${genRepoUUID()}`).replace(/^\/|\/$/g, '')}-ext-api`;
const [GIT_REPO_OWNER, GIT_REPO_NAME] = GIT_REPO_PATH.split('/');

const GITHUB_HTTPS_PAYLOAD = {
  gitUrl: `${GIT_BASE_URL}/${GIT_REPO_PATH}`,
  branchName: process.env.TEST_GIT_HTTPS_BRANCH || 'main',
  githubEnterpriseUrl: GIT_BASE_URL,
  githubEnterpriseApiUrl: `${GIT_BASE_URL}/api/v3`,
  githubAppId: process.env.TOOLJET_GITHUB_APP_ID,
  githubAppInstallationId: process.env.TOOLJET_GITHUB_INSTALLATION_ID,
  // PEM keys in .env carry literal "\n" escapes (dotenv doesn't unescape them) — restore
  // real newlines or forge.pki.privateKeyFromPem fails with a 400.
  githubAppPrivateKey: (process.env.TOOLJET_GITHUB_APP_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  gitType: 'github_https',
};

const BASIC =
  'Basic ' +
  Buffer.from(`${process.env.TOOLJET_GIT_ADMIN_USER}:${process.env.TOOLJET_GIT_ADMIN_PASSWORD}`).toString('base64');
const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;
const MERGE_URL = `${GIT_BASE_URL}/admin/merge`;

/**
 * @group gitsync
 */
describeGitsync('External API — save & release against a real git host', () => {
  describe('EE (plan: enterprise)', () => {
    let nestApp: INestApplication;
    let AUTH_HEADER: string;
    let tokenCookie: string;
    let orgId: string;

    beforeAll(async () => {
      process.env.ENABLE_EXTERNAL_API = 'true';
      ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));

      const configService = nestApp.get<ConfigService>(ConfigService);
      AUTH_HEADER = `Basic ${configService.get('EXTERNAL_API_ACCESS_TOKEN')}`;

      const email = `admin+${Date.now()}@tooljet.io`;
      const { organization } = await createUser(nestApp, { email });
      orgId = organization.id;
      ({ tokenCookie } = await login(nestApp, email));

      // Same reasoning as git-sync.spec.ts: prototype-spy the queue so branch
      // create/pull run inline at enqueue time instead of racing an async worker.
      const branchSvc = nestApp.get(WorkspaceBranchService, { strict: false });
      jest
        .spyOn(GitSyncQueueService.prototype, 'enqueueCreateBranch')
        .mockImplementation((p) => branchSvc.executeCreateBranch(p));
      jest
        .spyOn(GitSyncQueueService.prototype, 'enqueuePullBranch')
        .mockImplementation((p) => branchSvc.executePullBranch(p));
    });

    afterAll(async () => {
      await closeTestApp(nestApp);
    }, 60_000);

    it('saves a version through the External API (real git tag) then releases it by auto-discovering that tag', async () => {
      const step = (n: number, label: string) => process.stdout.write(`    ↳ step ${n}: ${label}\n`);

      await ensureAppEnvironments(nestApp, orgId);

      step(0, 'reset repo to a clean state');
      await fetch(RESET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: BASIC },
        body: '{}',
      });

      step(1, 'configure git + enable branching, load main');
      await request
        .agent(nestApp.getHttpServer())
        .post('/api/git-sync/configs')
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId)
        .send({ ...GITHUB_HTTPS_PAYLOAD, useEnvConfig: false })
        .expect(201);

      const orgGitId: string = (
        await request
          .agent(nestApp.getHttpServer())
          .get(`/api/git-sync/${orgId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200)
      ).body.organization_git.id;
      await request
        .agent(nestApp.getHttpServer())
        .put(`/api/git-sync/${orgGitId}/is-branching-enabled`)
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId)
        .send({ isBranchingEnabled: true })
        .expect(200);

      const mainBranchId: string = (
        await request
          .agent(nestApp.getHttpServer())
          .get('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200)
      ).body.activeBranchId;
      expect(mainBranchId).toBeDefined();

      step(2, 'create feature branch off main');
      await request
        .agent(nestApp.getHttpServer())
        .post('/api/workspace-branches')
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId)
        .query({ branch_id: mainBranchId })
        .send({ name: 'feat-ext-api', sourceBranchId: mainBranchId })
        .expect(201);
      const branchesResp = await request
        .agent(nestApp.getHttpServer())
        .get('/api/workspace-branches')
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId)
        .query({ branch_id: mainBranchId })
        .expect(200);
      const featBranchId: string = branchesResp.body.branches.find((b: any) => b.name === 'feat-ext-api')?.id;
      expect(featBranchId).toBeDefined();

      step(3, 'create app on the feature branch');
      const createAppResp = await request
        .agent(nestApp.getHttpServer())
        .post('/api/apps')
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId)
        .query({ branch_id: featBranchId })
        .send({ icon: 'home', name: 'ext-api-save-release', type: 'front-end', branchId: featBranchId })
        .expect(201);
      const appId: string = createAppResp.body.id;

      const appDetail = await request
        .agent(nestApp.getHttpServer())
        .get(`/api/apps/${appId}`)
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId)
        .query({ branch_id: featBranchId })
        .expect(200);
      const versionId: string = appDetail.body.editing_version.id;

      step(4, 'push the feature branch, merge to main, pull main (hydrates as a stub)');
      await request
        .agent(nestApp.getHttpServer())
        .post(`/api/app-git/gitpush/${appId}/${versionId}`)
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId)
        .query({ branch_id: featBranchId })
        .send({
          gitAppName: 'ext-api-save-release',
          versionId,
          lastCommitMessage: 'initial push',
          gitVersionName: 'feat-ext-api',
          sourceBranch: 'feat-ext-api',
        })
        .expect(201);

      const mergeResp = await fetch(MERGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: BASIC },
        body: JSON.stringify({
          owner: GIT_REPO_OWNER,
          repo: `${GIT_REPO_NAME}.git`,
          source: 'feat-ext-api',
          target: 'main',
          message: 'Land feat-ext-api',
        }),
      });
      expect((await mergeResp.json().catch(() => ({}))).ok).toBe(true);

      await request
        .agent(nestApp.getHttpServer())
        .post('/api/workspace-branches/pull')
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId)
        .query({ branch_id: mainBranchId })
        .send({ branchId: mainBranchId })
        .expect(201);

      step(5, 'hydrate the stub on main');
      const hydratedApp = (
        await request
          .agent(nestApp.getHttpServer())
          .get('/api/apps')
          .query({ page: 1, folder: '', searchKey: '', type: 'front-end', branch_id: mainBranchId })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200)
      ).body.apps[0];
      await request
        .agent(nestApp.getHttpServer())
        .get(`/api/apps/${hydratedApp.id}`)
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId)
        .query({ branch_id: mainBranchId })
        .expect(200);

      step(6, 'External API: save v1 — must create a REAL git tag on the simulator');
      const saveResp = await request
        .agent(nestApp.getHttpServer())
        .post(`/api/ext/apps/${hydratedApp.id}/versions/save`)
        .set('Authorization', AUTH_HEADER)
        .send({ name: 'v1' })
        .expect(201);
      expect(saveResp.body).toMatchObject({ name: 'v1', status: 'PUBLISHED' });

      step(7, 'External API: release with no body — must auto-discover that tag via a real Octokit call');
      const releaseResp = await request
        .agent(nestApp.getHttpServer())
        .post(`/api/ext/apps/${hydratedApp.id}/git-sync/release`)
        .set('Authorization', AUTH_HEADER)
        .send({})
        .expect(201);
      // A broken tag lookup (the wiring this test exists to catch) surfaces as a
      // BadRequestException — asserting 201 IS the assertion that Octokit found the
      // real tag `saveResp` just created. currentVersionId confirms it promoted the
      // right (v1) version, not some other row.
      expect(releaseResp.body.currentVersionId).toBe(saveResp.body.id);
    }, 120_000);
  });
});
