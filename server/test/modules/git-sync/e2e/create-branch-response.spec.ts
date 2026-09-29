import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import {
  createUser,
  initTestApp,
  login,
  logout,
  closeTestApp,
  ensureAppEnvironments,
  createApplication,
  createApplicationVersion,
} from 'test-helper';
import { BACKGROUND_JOB_THRESHOLDS } from '@ee/background-jobs/thresholds';

/**
 * Standalone response-shape coverage for the create-branch inline path (tj-ee#5486). Deliberately
 * NOT folded into the giant `GitSyncController` lifecycle `it` in ./git-sync.spec.ts — that block
 * already exercises the full clone/push/pull machinery; this spec only asserts the wire shape the
 * frontend now has to branch on: `{ enqueued, isImport, branch? }`.
 *
 * Same live-simulator fixture as git-sync.spec.ts (Gitea / GitHub Enterprise). See its header
 * comment for the env vars this requires.
 *
 * @group gitsync
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const GIT_BASE_URL = requireEnv('TEST_GIT_BASE_URL').replace(/\/$/, '');
const GIT_REPO_PATH = (process.env.TEST_GIT_REPO_PATH || `run-ci/${randomUUID()}`).replace(/^\/|\/$/g, '');

const GITHUB_HTTPS_PAYLOAD = {
  gitUrl: `${GIT_BASE_URL}/${GIT_REPO_PATH}`,
  branchName: process.env.TEST_GIT_HTTPS_BRANCH || 'main',
  githubEnterpriseUrl: GIT_BASE_URL,
  githubEnterpriseApiUrl: `${GIT_BASE_URL}/api/v3`,
  githubAppId: requireEnv('TOOLJET_GITHUB_APP_ID'),
  githubAppInstallationId: requireEnv('TOOLJET_GITHUB_INSTALLATION_ID'),
  githubAppPrivateKey: requireEnv('TOOLJET_GITHUB_APP_PRIVATE_KEY').replace(/\\n/g, '\n'),
  gitType: 'github_https',
};

requireEnv('TOOLJET_GIT_ADMIN_USER');
requireEnv('TOOLJET_GIT_ADMIN_PASSWORD');
const BASIC =
  'Basic ' +
  Buffer.from(`${process.env.TOOLJET_GIT_ADMIN_USER}:${process.env.TOOLJET_GIT_ADMIN_PASSWORD}`).toString('base64');

describe('POST /api/workspace-branches — inline create response shape', () => {
  let app: INestApplication;
  let tokenCookie: string;
  let orgId: string;
  let mainBranchId: string;
  const ORIGINAL_APPS_THRESHOLD = BACKGROUND_JOB_THRESHOLDS.branch.apps;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    const { organization, user } = await createUser(app, {
      email: 'bgjob-e2e-admin@tooljet.io',
      firstName: 'bgjob',
      lastName: 'e2e',
    });
    orgId = organization.id;
    const { tokenCookie: tc } = await login(app, 'bgjob-e2e-admin@tooljet.io');
    tokenCookie = tc;

    await ensureAppEnvironments(app, orgId);

    // Reset the shared simulator repo — same admin endpoint git-sync.spec.ts uses.
    await fetch(`${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: BASIC },
      body: '{}',
    });

    await request
      .agent(app.getHttpServer())
      .post('/api/git-sync/configs')
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', orgId)
      .send({ ...GITHUB_HTTPS_PAYLOAD, useEnvConfig: false })
      .expect(201);

    const orgGitId: string = (
      await request
        .agent(app.getHttpServer())
        .get(`/api/git-sync/${orgId}`)
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId)
        .expect(200)
    ).body.organization_git.id;

    // Multi-branch is opt-in (#17425) — a freshly-saved config defaults to single-branch mode.
    await request
      .agent(app.getHttpServer())
      .put(`/api/git-sync/${orgGitId}/is-branching-enabled`)
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', orgId)
      .send({ isBranchingEnabled: true })
      .expect(200);

    const branchesResp = await request
      .agent(app.getHttpServer())
      .get('/api/workspace-branches')
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', orgId)
      .expect(200);
    mainBranchId = branchesResp.body.activeBranchId;

    // "Small workspace" per the background-job threshold: a single app on main.
    const application = await createApplication(app, { name: 'bgjob-e2e-app', user });
    await createApplicationVersion(app, application as any);
  });

  afterEach(() => {
    BACKGROUND_JOB_THRESHOLDS.branch.apps = ORIGINAL_APPS_THRESHOLD;
  });

  afterAll(async () => {
    await logout(app, tokenCookie, orgId).catch(() => {});
    await closeTestApp(app);
  }, 60000);

  it('below threshold → creates the branch inline and returns { enqueued: false, branch }', async () => {
    const res = await request
      .agent(app.getHttpServer())
      .post('/api/workspace-branches')
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', orgId)
      .query({ branch_id: mainBranchId })
      .send({ name: 'feat-small', sourceBranchId: mainBranchId })
      .expect(201);

    expect(res.body).toMatchObject({
      enqueued: false,
      isImport: false,
      branch: { id: expect.any(String), name: 'feat-small' },
    });
    // Strict DTO — no extra fields leak onto the branch summary.
    expect(Object.keys(res.body.branch).sort()).toEqual(['id', 'name']);
  });

  it('over threshold → enqueues instead, with no branch in the response', async () => {
    BACKGROUND_JOB_THRESHOLDS.branch.apps = 0;

    const res = await request
      .agent(app.getHttpServer())
      .post('/api/workspace-branches')
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', orgId)
      .query({ branch_id: mainBranchId })
      .send({ name: 'feat-large', sourceBranchId: mainBranchId })
      .expect(201);

    expect(res.body).toMatchObject({ enqueued: true, isImport: false });
    expect(res.body.branch).toBeUndefined();
  });

  it('replays the first response for a repeated Idempotency-Key and creates the branch once', async () => {
    const idempotencyKey = randomUUID();
    const body = { name: 'feat-idem', sourceBranchId: mainBranchId };

    const first = await request
      .agent(app.getHttpServer())
      .post('/api/workspace-branches')
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', orgId)
      .set('Idempotency-Key', idempotencyKey)
      .query({ branch_id: mainBranchId })
      .send(body)
      .expect(201);

    const second = await request
      .agent(app.getHttpServer())
      .post('/api/workspace-branches')
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', orgId)
      .set('Idempotency-Key', idempotencyKey)
      .query({ branch_id: mainBranchId })
      .send(body)
      .expect(201);

    expect(second.body).toEqual(first.body);

    const branches = await request
      .agent(app.getHttpServer())
      .get('/api/workspace-branches')
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', orgId)
      .query({ branch_id: mainBranchId })
      .expect(200);
    expect(branches.body.branches.filter((b: any) => b.name === 'feat-idem')).toHaveLength(1);
  });
});
