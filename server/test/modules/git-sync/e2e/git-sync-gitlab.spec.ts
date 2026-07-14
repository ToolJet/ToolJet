import { INestApplication } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { createUser, initTestApp, login, closeTestApp, ensureAppEnvironments } from 'test-helper';
import * as request from 'supertest';

// GitLab e2e against the SAME git-http-simulator used by the GitHub suite (its /api/v4 router +
// oauth2 git transport). One host, both providers. Point TEST_GIT_BASE_URL at the simulator and set
// EXPECTED_GITLAB_TOKEN on the simulator to the SAME value as TEST_GITLAB_TOKEN here — the repo is not
// public, so the token must match on both sides.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const GIT_BASE_URL = requireEnv('TEST_GIT_BASE_URL').replace(/\/$/, '');
// A GitLab-specific repo path so it doesn't collide with the GitHub e2e repo on the shared simulator.
const GITLAB_REPO_PATH = (process.env.TEST_GITLAB_REPO_PATH || 'gsmithun4/gitlab-e2e').replace(/^\/|\/$/g, '');
const [GITLAB_REPO_OWNER, GITLAB_REPO_NAME] = GITLAB_REPO_PATH.split('/');
// Must equal the simulator's EXPECTED_GITLAB_TOKEN.
const GITLAB_TOKEN = requireEnv('TEST_GITLAB_TOKEN');

// Config-save payload — mirrors what the Git Sync UI sends for the GitLab provider.
//   gitUrl              → clone URL (no .git; the provider adds it for transport)
//   gitLabEnterpriseUrl → self-hosted host; the API base becomes <host>/api/v4
//   gitLabProjectId     → URL-encoded `owner/repo` resolves to the simulator's bare repo
//   gitLabProjectAccessToken → PRIVATE-TOKEN for /api/v4 + oauth2:<token> for git transport
const GITLAB_PAYLOAD = {
  gitUrl: `${GIT_BASE_URL}/${GITLAB_REPO_PATH}`,
  branchName: process.env.TEST_GITLAB_BRANCH || 'main',
  gitLabEnterpriseUrl: GIT_BASE_URL,
  gitLabProjectId: GITLAB_REPO_PATH,
  gitLabProjectAccessToken: GITLAB_TOKEN,
  gitType: 'gitlab',
};

// Simulator admin endpoints (reset / merge) are provider-agnostic (git-level) — shared with GitHub.
requireEnv('TOOLJET_GIT_ADMIN_USER');
requireEnv('TOOLJET_GIT_ADMIN_PASSWORD');
const BASIC =
  'Basic ' +
  Buffer.from(`${process.env.TOOLJET_GIT_ADMIN_USER}:${process.env.TOOLJET_GIT_ADMIN_PASSWORD}`).toString('base64');

/**
 * @group platform
 */
describe('GitSyncController — GitLab', () => {
  let app: INestApplication;
  let orgId: string;
  let cookie: string[];
  let ds: DataSource;

  const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GITLAB_REPO_PATH}.git/reset`;
  const MERGE_URL = `${GIT_BASE_URL}/admin/merge`;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    const { organization } = await createUser(app, {
      email: 'git-gitlab@tooljet.io',
      firstName: 'git',
      lastName: 'gitlab',
    });
    orgId = organization.id;
    ({ tokenCookie: cookie } = await login(app, 'git-gitlab@tooljet.io'));
    await ensureAppEnvironments(app, orgId);
    ds = app.get<DataSource>(getDataSourceToken('default'));
    await ds.query(
      `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
       VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
      [orgId]
    );
    // Clean simulator repo so each run starts from an empty bare repo.
    await fetch(RESET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: BASIC },
      body: '{}',
    });
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  const agent = () => request.agent(app.getHttpServer());
  const auth = (r: request.Test) => r.set('Cookie', cookie).set('tj-workspace-id', orgId);
  const restapiDsOptions = [
    { key: 'url', value: '' },
    { key: 'auth_type', value: 'none' },
    { key: 'headers', value: [['', '']] },
    { key: 'ssl_certificate', value: 'none', encrypted: false },
  ];
  const mergeToMain = async (source: string) => {
    const resp = await fetch(MERGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: BASIC },
      body: JSON.stringify({
        owner: GITLAB_REPO_OWNER,
        repo: `${GITLAB_REPO_NAME}.git`,
        source,
        target: 'main',
        message: `Land ${source}`,
      }),
    });
    expect((await resp.json().catch(() => ({}))).ok).toBe(true);
  };

  it('config: saves + retrieves the GitLab provider and connects to the simulator', async () => {
    // Save config → the backend also test-connects against the simulator's /api/v4
    // (personal_access_tokens/self, projects/:id, repository/branches/main).
    await auth(agent().post('/api/git-sync/configs'))
      .send({ ...GITLAB_PAYLOAD, useEnvConfig: false })
      .expect(201);

    const cfg = await auth(agent().get(`/api/git-sync/${orgId}`)).expect(200);
    const orgGit = cfg.body.organization_git;
    expect(orgGit.git_lab).toBeDefined();
    expect(orgGit.git_lab.is_enabled).toBe(true);
    // Secret is redacted on read.
    expect(orgGit.git_lab.gitlab_project_access_token).toBeUndefined();

    const orgGitId: string = orgGit.id;
    await auth(agent().put(`/api/git-sync/${orgGitId}/is-branching-enabled`))
      .send({ isBranchingEnabled: true })
      .expect(200);

    const branches = await auth(agent().get('/api/workspace-branches')).expect(200);
    expect(branches.body.activeBranchId).toBeDefined();
    expect(branches.body.isMultiBranchingEnabled).toBe(true);
  }, 120000);

  it('lifecycle: create app git-off, sync to main via feature branch + merge, then save a version (tag)', async () => {
    const { randomUUID } = await import('crypto');
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
          others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
          properties: { text: { value: 'Button' }, visibility: { value: '{{true}}' } },
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

    const mainBranchId: string = (await auth(agent().get('/api/workspace-branches')).expect(200)).body.activeBranchId;

    // App is created here git-on (config already saved in the previous test); normalize it onto the
    // default branch as an unsynced version so it can be pushed (mirrors the GitHub unsynced-sync flow).
    const appId: string = (
      await auth(agent().post('/api/apps')).send({ icon: 'home', name: 'gitlab-e2e-app', type: 'front-end' }).expect(201)
    ).body.id;
    const v0 = await editingVersion(appId);
    await auth(agent().post(`/api/v2/apps/${appId}/versions/${v0.versionId}/components`))
      .send({ is_user_switched_version: false, pageId: v0.pageId, diff: buttonDiff() })
      .expect(201);
    await ds.query(
      `UPDATE app_versions SET branch_id = $1, version_type = 'version', is_synced = false, is_stub = false
         WHERE app_id = $2`,
      [mainBranchId, appId]
    );

    // Sync: feature branch → gitpush → pull feature → merge → pull main.
    const featBranchId: string = (
      await auth(agent().post('/api/workspace-branches'))
        .query({ branch_id: mainBranchId })
        .send({ name: 'feat-gitlab', sourceBranchId: mainBranchId })
        .expect(201)
    ).body.id;
    const draftId = (await ds.query(`SELECT id FROM app_versions WHERE app_id = $1 LIMIT 1`, [appId]))[0].id;
    await auth(agent().post(`/api/app-git/gitpush/${appId}/${draftId}`))
      .query({ branch_id: mainBranchId })
      .send({
        gitAppName: 'gitlab-e2e-app',
        versionId: draftId,
        lastCommitMessage: 'sync gitlab-e2e-app',
        gitVersionName: 'feat-gitlab',
        sourceBranch: 'feat-gitlab',
        targetBranch: 'feat-gitlab',
      })
      .expect(201);
    await auth(agent().post('/api/workspace-branches/pull')).query({ branch_id: featBranchId }).send({ branchId: featBranchId }).expect(201);
    await mergeToMain('feat-gitlab');
    await auth(agent().post('/api/workspace-branches/pull')).query({ branch_id: mainBranchId }).send({ branchId: mainBranchId }).expect(201);

    // The default-branch version is now synced (matches git).
    const syncState = await ds.query(
      `SELECT is_synced FROM app_versions WHERE app_id = $1 AND branch_id = $2 AND is_stub = false`,
      [appId, mainBranchId]
    );
    expect(syncState.length).toBeGreaterThan(0);
    expect(syncState.every((r: any) => r.is_synced === true)).toBe(true);

    // Save a version → check-tag (GET /api/v4/.../tags/:name) then create the tag
    // (POST /api/v4/.../tags) on the simulator.
    const mainDraft = (
      await ds.query(
        `SELECT id FROM app_versions WHERE app_id = $1 AND branch_id = $2 AND status = 'DRAFT' AND is_stub = false ORDER BY updated_at DESC LIMIT 1`,
        [appId, mainBranchId]
      )
    )[0];
    const ct = await auth(agent().get(`/api/app-git/${appId}/check-tag`))
      .query({ versionName: 'v1', branch_id: mainBranchId })
      .expect(200);
    expect(ct.body.exists).toBe(false);
    await auth(agent().put(`/api/v2/apps/${appId}/versions/${mainDraft.id}`))
      .query({ branch_id: mainBranchId })
      .send({ is_user_switched_version: false, name: 'v1', description: 'saved', status: 'PUBLISHED' })
      .expect(200);
    await auth(agent().post(`/api/app-git/${appId}/versions/${mainDraft.id}/tag`))
      .query({ branch_id: mainBranchId })
      .send({ message: 'saving v1' })
      .expect(201);

    // The tag now exists on the simulator — check-tag reports it.
    const ct2 = await auth(agent().get(`/api/app-git/${appId}/check-tag`))
      .query({ versionName: 'v1', branch_id: mainBranchId })
      .expect(200);
    expect(ct2.body.exists).toBe(true);
  }, 600000);

  it('branch ops: list remote branches includes the default + feature branch', async () => {
    const list = await auth(agent().get('/api/workspace-branches')).expect(200);
    const names = list.body.branches.map((b: any) => b.name);
    expect(names).toContain('main');
    expect(names).toContain('feat-gitlab');
  }, 120000);
});
