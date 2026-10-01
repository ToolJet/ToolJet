import { INestApplication } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { createUser, initTestApp, logout, login, closeTestApp, ensureAppEnvironments } from 'test-helper';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { WorkspaceBranchService } from '@ee/workspace-branches/service';
import { GitSyncQueueService } from '@ee/workspace-branches/git-sync-queue.service';

// Bitbucket mirror of git-sync-gitlab.spec.ts — against REAL Bitbucket Cloud.
//
// The GitHub/GitLab suites hit the Gitea simulator through each provider's enterprise-URL field.
// The Bitbucket provider is Cloud-only (api.bitbucket.org / bitbucket.org are hard-coded), so this
// suite runs against a real Bitbucket Cloud repository whose coordinates come from .env.test:
//
//   TEST_BITBUCKET_WORKSPACE     workspace id (the `<workspace>` in bitbucket.org/<workspace>/<repo>)
//   TEST_BITBUCKET_REPO_SLUG     repository slug — a DEDICATED test repo; the suite writes to it
//   TEST_BITBUCKET_TOKEN         repository access token: Repositories read+write, Pull requests read
//   TEST_BITBUCKET_BASE_BRANCH   optional (default `main`) — must already exist with at least one commit
//
// Like the GitLab suite it self-guards: with any required var missing the WHOLE suite is skipped at
// runtime (never a top-level throw, which would fail the entire e2e shard).
//
// Isolation: there is no simulator reset endpoint on bitbucket.org, so the suite never touches the
// base branch. Each describe block works on its own run-scoped branch (`tj-e2e-<runId>-<block>`)
// created from the base branch head, and afterAll deletes every branch and tag the run created.
const REQUIRED_ENV = ['TEST_BITBUCKET_WORKSPACE', 'TEST_BITBUCKET_REPO_SLUG', 'TEST_BITBUCKET_TOKEN'];
const MISSING_ENV = REQUIRED_ENV.filter((name) => !process.env[name]);
const BITBUCKET_E2E_ENABLED = MISSING_ENV.length === 0;
if (!BITBUCKET_E2E_ENABLED) {
  console.warn(
    `[git-sync-bitbucket] SKIPPED — set ${MISSING_ENV.join(', ')} in .env.test (a real Bitbucket Cloud test repo) to run this suite.`
  );
}
const describeBitbucket = BITBUCKET_E2E_ENABLED ? describe : describe.skip;

// These reads tolerate undefined because when the env is missing the suite is skipped before use.
const BB_WORKSPACE = process.env.TEST_BITBUCKET_WORKSPACE || '';
const BB_REPO_SLUG = process.env.TEST_BITBUCKET_REPO_SLUG || '';
const BB_TOKEN = process.env.TEST_BITBUCKET_TOKEN || '';
const BB_BASE_BRANCH = process.env.TEST_BITBUCKET_BASE_BRANCH || 'main';
const BB_API = `https://api.bitbucket.org/2.0/repositories/${encodeURIComponent(BB_WORKSPACE)}/${encodeURIComponent(
  BB_REPO_SLUG
)}`;
const BB_WEB_URL = `https://bitbucket.org/${BB_WORKSPACE}/${BB_REPO_SLUG}`;
const BB_CLONE_URL = `https://x-token-auth:${BB_TOKEN}@bitbucket.org/${BB_WORKSPACE}/${BB_REPO_SLUG}.git`;

// One id per run so parallel/rerun executions never share branches on the shared test repo.
const RUN_ID = randomUUID().slice(0, 8);
const runBranch = (block: string) => `tj-e2e-${RUN_ID}-${block}`;

// Bitbucket provider config — mirrors what BitbucketModal.jsx sends.
const bitbucketPayload = (branchName: string) => ({
  gitType: 'bitbucket',
  gitUrl: BB_WEB_URL,
  branchName,
  bitbucketWorkspace: BB_WORKSPACE,
  bitbucketRepoSlug: BB_REPO_SLUG,
  bitbucketAccessToken: BB_TOKEN,
});

// ── Direct Bitbucket REST access, for arranging state and asserting on what ToolJet wrote ────────
// Everything created here (or by ToolJet during the run) is recorded and removed in afterAll.
const createdBranches = new Set<string>();
const createdTags = new Set<string>();

const bbFetch = (path: string, init: RequestInit = {}) =>
  fetch(`${BB_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${BB_TOKEN}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });

const remoteBranchExists = async (name: string) =>
  (await bbFetch(`/refs/branches/${encodeURIComponent(name)}`)).status === 200;

const remoteTagHash = async (name: string): Promise<string | null> => {
  const res = await bbFetch(`/refs/tags/${encodeURIComponent(name)}`);
  if (res.status !== 200) return null;
  const body = (await res.json()) as { target?: { hash?: string } };
  return body.target?.hash ?? null;
};

/** Creates `name` on Bitbucket at the base branch head — the run-scoped branch a block writes to. */
const createRunBranch = async (name: string) => {
  const base = await bbFetch(`/refs/branches/${encodeURIComponent(BB_BASE_BRANCH)}`);
  if (base.status !== 200) {
    throw new Error(
      `[git-sync-bitbucket] base branch "${BB_BASE_BRANCH}" not found in ${BB_WEB_URL} (HTTP ${base.status}) — ` +
        'set TEST_BITBUCKET_BASE_BRANCH to an existing branch with at least one commit.'
    );
  }
  const { target } = (await base.json()) as { target: { hash: string } };
  const res = await bbFetch('/refs/branches', {
    method: 'POST',
    body: JSON.stringify({ name, target: { hash: target.hash } }),
  });
  if (res.status !== 201) throw new Error(`could not create branch ${name}: HTTP ${res.status} ${await res.text()}`);
  createdBranches.add(name);
};

const cleanupRemote = async () => {
  for (const tag of createdTags) await bbFetch(`/refs/tags/${encodeURIComponent(tag)}`, { method: 'DELETE' });
  for (const branch of createdBranches) {
    await bbFetch(`/refs/branches/${encodeURIComponent(branch)}`, { method: 'DELETE' });
  }
};

/** Shallow-clones one branch and exposes file checks on its tree. */
const inspectBranch = async (branch: string) => {
  const simpleGit = (await import('simple-git')).default;
  const fs = await import('fs');
  const path = await import('path');
  const os = await import('os');
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tj-bb-'));
  const git = simpleGit({ baseDir: tmpDir, timeout: { block: 60000 }, unsafe: { allowUnsafeCredentialHelper: true } });
  await git.clone(BB_CLONE_URL, '.', ['--branch', branch, '--depth', '1', '--single-branch']);
  const hasFile = (rel: string) => fs.existsSync(path.join(tmpDir, rel));
  const dirHasFiles = (sub: string) => {
    const root = path.join(tmpDir, sub);
    if (!fs.existsSync(root)) return false;
    let found = false;
    const walk = (d: string) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (e.isDirectory()) walk(path.join(d, e.name));
        else found = true;
      }
    };
    walk(root);
    return found;
  };
  const cleanup = () => fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  return { hasFile, dirHasFiles, cleanup };
};

type WorkspaceBranchRow = { id: string; name: string; isDefault: boolean; organizationId: string };

/**
 * @group gitsync
 */
describeBitbucket('GitSyncController — Bitbucket', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let tokenCookie: string[];
    let orgId: string;

    const agent = () => request.agent(app.getHttpServer());

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      const { organization } = await createUser(app, {
        email: 'admin.bb@tooljet.io',
        firstName: 'user',
        lastName: 'name',
      });
      orgId = organization.id;
      ({ tokenCookie } = await login(app, 'admin.bb@tooljet.io'));
    });

    // Run each git-sync job inline at enqueue time so requests resolve only once the worker body
    // finished — same prototype-spy rationale as git-sync-gitlab.spec.ts.
    beforeEach(() => {
      const branchSvc = app.get(WorkspaceBranchService, { strict: false });
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

    afterEach(async () => {
      try {
        await logout(app, tokenCookie, orgId);
      } catch {
        /* ignore — cleanup only */
      }
      jest.resetAllMocks();
    });

    afterAll(async () => {
      await cleanupRemote();
      await closeTestApp(app);
    }, 120000);

    /** A fresh workspace + logged-in admin, with app environments ready. */
    const newWorkspace = async (email: string) => {
      const { organization } = await createUser(app, { email, firstName: 'bb', lastName: 'user' });
      const { tokenCookie: cookie } = await login(app, email);
      await ensureAppEnvironments(app, organization.id);
      const auth = (r: request.Test) => r.set('Cookie', cookie).set('tj-workspace-id', organization.id);
      return { org: organization.id, auth };
    };

    /** Saves the Bitbucket config on `branch`, sets the branching mode, pulls the default branch. */
    const configureGit = async (
      auth: (r: request.Test) => request.Test,
      org: string,
      branch: string,
      multiBranch: boolean
    ) => {
      await auth(agent().post('/api/git-sync/configs'))
        .send({ ...bitbucketPayload(branch), useEnvConfig: false })
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

    const editingVersionOf = async (auth: (r: request.Test) => request.Test, appId: string, branchId: string) => {
      const d = await auth(agent().get(`/api/apps/${appId}`))
        .query({ branch_id: branchId })
        .expect(200);
      const ev = d.body?.editing_version || d.body?.editingVersion || d.body?.app?.editing_version;
      const pageId = ev.home_page_id || ev.homePageId || ev.pages?.[0]?.id || d.body?.pages?.[0]?.id;
      return { versionId: ev.id as string, pageId: pageId as string };
    };

    const addButton = (
      auth: (r: request.Test) => request.Test,
      appId: string,
      ctx: { versionId: string; pageId: string },
      branchId: string
    ) => {
      const btnId = randomUUID();
      return auth(agent().post(`/api/v2/apps/${appId}/versions/${ctx.versionId}/components`))
        .query({ branch_id: branchId })
        .send({
          is_user_switched_version: false,
          pageId: ctx.pageId,
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

    const gitpush = (
      auth: (r: request.Test) => request.Test,
      appId: string,
      versionId: string,
      gitAppName: string,
      branchId: string,
      branchName: string
    ) =>
      auth(agent().post(`/api/app-git/gitpush/${appId}/${versionId}`))
        .query({ branch_id: branchId })
        .send({
          gitAppName,
          versionId,
          lastCommitMessage: `push ${gitAppName}`,
          gitVersionName: branchName,
          sourceBranch: branchName,
        });

    describe('GET /api/git-sync/:id | Get organization git config', () => {
      it('should return 401 if the auth token is missing', async () => {
        await agent().get(`/api/git-sync/${orgId}`).set('tj-workspace-id', orgId).expect(401);
      });

      it('should return 401 if the user is not in the specific organization', async () => {
        const { organization } = await createUser(app, {
          email: 'admin2.bb@tooljet.io',
          firstName: 'user',
          lastName: 'name',
        });
        await agent()
          .get(`/api/git-sync/${organization.id}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', organization.id)
          .expect(401);
      });

      it('should return the organization git config for a valid session', async () => {
        await agent()
          .get(`/api/git-sync/${orgId}`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
      });
    });

    describe('POST /api/git-sync | Create organization git', () => {
      it('should return 401 if the auth token is missing', async () => {
        await agent().post('/api/git-sync').set('tj-workspace-id', orgId).send({ gitType: 'bitbucket' }).expect(401);
      });

      it('should create an organization git record for bitbucket', async () => {
        await agent()
          .post('/api/git-sync')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ gitType: 'bitbucket' })
          .expect(201);
      });
    });

    describe('PUT /api/git-sync/status/:id | Change organization git status', () => {
      it('should return 401 if the auth token is missing', async () => {
        await agent()
          .put(`/api/git-sync/status/${orgId}`)
          .set('tj-workspace-id', orgId)
          .send({ isEnabled: true, gitType: 'bitbucket' })
          .expect(401);
      });
    });

    describe('PATCH /api/git-sync/env-configs | Toggle env provider config', () => {
      it('should return 401 if the auth token is missing', async () => {
        await agent()
          .patch('/api/git-sync/env-configs')
          .set('tj-workspace-id', orgId)
          .send({ useEnvConfig: true, provider: 'bitbucket' })
          .expect(401);
      });
    });

    describe('POST /api/git-sync/test-connection | Bitbucket connection check (real Bitbucket Cloud)', () => {
      const testConnection = (payload: Record<string, unknown>) =>
        agent()
          .post('/api/git-sync/test-connection')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ ...payload, useEnvConfig: false, hasStoredConfig: false });

      it('should return 401 when unauthenticated', async () => {
        await agent()
          .post('/api/git-sync/test-connection')
          .set('tj-workspace-id', orgId)
          .send({ ...bitbucketPayload(BB_BASE_BRANCH), useEnvConfig: false, hasStoredConfig: false })
          .expect(401);
      });

      it('should pass for a valid workspace, repo, branch and token', async () => {
        const res = await testConnection(bitbucketPayload(BB_BASE_BRANCH));
        if (res.status !== 201) {
          // Surface Bitbucket's reason (bad token scope, wrong slug, …) instead of a bare status mismatch.
          process.stdout.write(`    test-connection failed: ${res.status} ${JSON.stringify(res.body)}\n`);
        }
        expect(res.status).toBe(201);
      });

      it('should fail with the authentication message for an invalid token', async () => {
        const res = await testConnection({
          ...bitbucketPayload(BB_BASE_BRANCH),
          bitbucketAccessToken: 'invalid-token',
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Bitbucket authentication failed. Check the access token.');
      });

      it('should fail with the branch-not-found message for a branch that does not exist', async () => {
        const res = await testConnection(bitbucketPayload(`tj-e2e-${RUN_ID}-does-not-exist`));
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('The configured branch does not exist in this Bitbucket repository.');
      });

      it('should fail for a repository the token cannot see', async () => {
        const res = await testConnection({
          ...bitbucketPayload(BB_BASE_BRANCH),
          bitbucketRepoSlug: `no-repo-${RUN_ID}`,
        });
        expect(res.status).toBe(400);
        // A repository access token gets 404 (not found) or 403 (no access) for other repos.
        expect(res.body.message).toMatch(/Bitbucket (repository not found|authentication failed)/);
      });
    });

    describe('Bitbucket save + retrieve flow', () => {
      const SAVE_BRANCH = runBranch('save');

      beforeAll(async () => {
        await createRunBranch(SAVE_BRANCH);
      });

      it('POST /api/git-sync/configs | should return 401 when unauthenticated', async () => {
        await agent()
          .post('/api/git-sync/configs')
          .set('tj-workspace-id', orgId)
          .send({ ...bitbucketPayload(SAVE_BRANCH), useEnvConfig: false })
          .expect(401);
      });

      it('POST /api/git-sync/configs then GET /api/git-sync/:id | should persist the config, seed the default branch and not expose the token', async () => {
        await agent()
          .post('/api/git-sync/configs')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ ...bitbucketPayload(SAVE_BRANCH), useEnvConfig: false })
          .expect(201);

        const response = await agent()
          .get(`/api/git-sync/${orgId}`)
          .query({ gitType: 'bitbucket' })
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);

        const organizationGit = response.body?.organization_git;
        expect(organizationGit).toBeDefined();
        expect(organizationGit.git_type).toBe('bitbucket');
        expect(organizationGit.organization_id).toBe(orgId);
        expect(organizationGit.git_bitbucket).toMatchObject({
          bitbucket_workspace: BB_WORKSPACE,
          bitbucket_repo_slug: BB_REPO_SLUG,
          bitbucket_branch: SAVE_BRANCH,
          is_enabled: true,
          is_finalized: true,
        });

        // Security: the access token must never reach the client.
        expect(organizationGit.git_bitbucket.bitbucket_access_token).toBeUndefined();
        expect(JSON.stringify(response.body)).not.toContain(BB_TOKEN);

        // Unlike the GitLab suite (which seeds the branch row by hand), Bitbucket's saveProviderConfig
        // reconciles the default branch itself (seedWorkspaceBranches): exactly one default, named
        // after the configured branch, and the repo's other remote branches seeded alongside it.
        const branchesResp = await agent()
          .get('/api/workspace-branches')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        const branches: WorkspaceBranchRow[] = branchesResp.body.branches;
        const defaults = branches.filter((b) => b.isDefault);
        expect(defaults).toHaveLength(1);
        expect(defaults[0]).toMatchObject({ name: SAVE_BRANCH, organizationId: orgId });
        expect(branchesResp.body.activeBranchId).toBe(defaults[0].id);
        const seededNames: string[] = (
          await app
            .get<DataSource>(getDataSourceToken('default'))
            .query(`SELECT branch_name FROM organization_git_sync_branches WHERE organization_id = $1`, [orgId])
        ).map((r: { branch_name: string }) => r.branch_name);
        expect(seededNames).toEqual(expect.arrayContaining([SAVE_BRANCH, BB_BASE_BRANCH]));

        const statusResp = await agent()
          .get(`/api/git-sync/${orgId}/status`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
        expect(statusResp.body).toMatchObject({
          is_enabled: true,
          is_finalized: true,
          // Freshly-saved config defaults to single-branch mode; multi-branch is opt-in.
          is_branching_enabled: false,
          id: organizationGit.id,
          default_git_branch: SAVE_BRANCH,
          repo_url: BB_WEB_URL,
          git_type: 'bitbucket',
        });
      }, 120000);
    });

    describe('single-branch lifecycle: push/pull apps, modules, data sources on the default branch', () => {
      const SB_BRANCH = runBranch('single');

      const dsOptions = (url: string) => [
        { key: 'url', value: url },
        { key: 'auth_type', value: 'none' },
        { key: 'headers', value: [['', '']] },
        { key: 'ssl_certificate', value: 'none', encrypted: false },
      ];

      beforeAll(async () => {
        await createRunBranch(SB_BRANCH);
      });

      it('pushes and pulls apps, modules, and data sources directly on the single-branch default', async () => {
        const step = (n: number, label: string) =>
          process.stdout.write(`    ↳ step ${String(n).padStart(2, '0')}: ${label}\n`);
        const { org, auth } = await newWorkspace('git-single-branch.bb@tooljet.io');
        const sbDs = app.get<DataSource>(getDataSourceToken('default'));
        const dsvRow = async (dsId: string, branchId: string) =>
          (
            await sbDs.query(
              `SELECT name, is_synced FROM data_source_versions WHERE data_source_id = $1 AND branch_id = $2`,
              [dsId, branchId]
            )
          )[0] as { name: string; is_synced: boolean } | undefined;

        step(1, `configure Bitbucket with default branch ${SB_BRANCH}, single-branch mode, pull`);
        const defaultBranchId = await configureGit(auth, org, SB_BRANCH, false);

        step(2, 'create app (+component) + module + data source on the default branch');
        const appId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: defaultBranchId })
            .send({ icon: 'home', name: 'bb-sb-app', type: 'front-end', branchId: defaultBranchId })
            .expect(201)
        ).body.id;
        const appCtx = await editingVersionOf(auth, appId, defaultBranchId);
        await addButton(auth, appId, appCtx, defaultBranchId);
        const moduleId: string = (
          await auth(agent().post('/api/modules'))
            .query({ branch_id: defaultBranchId })
            .send({ icon: 'folderupload', name: 'bb-sb-module', type: 'module', branchId: defaultBranchId })
            .expect(201)
        ).body.id;
        const moduleCtx = await editingVersionOf(auth, moduleId, defaultBranchId);
        const dsId: string = (
          await auth(agent().post(`/api/data-sources?branch_id=${defaultBranchId}`))
            .send({
              name: 'bb-sb-ds',
              kind: 'restapi',
              options: dsOptions('http://bb-ds.example.com'),
              scope: 'global',
            })
            .expect(201)
        ).body.id;
        const dsPath = `data-sources/${(await dsvRow(dsId, defaultBranchId))?.name}/data-source.json`;

        step(3, 'gitpush app + module, workspace-push the data source (all to the default branch)');
        await gitpush(auth, appId, appCtx.versionId, 'bb-sb-app', defaultBranchId, SB_BRANCH).expect(201);
        await gitpush(auth, moduleId, moduleCtx.versionId, 'bb-sb-module', defaultBranchId, SB_BRANCH).expect(201);
        await auth(agent().post('/api/workspace-branches/push'))
          .query({ branch_id: defaultBranchId })
          .send({ commitMessage: 'push bb data source', branchId: defaultBranchId, scope: 'datasource' })
          .expect(201);

        step(4, 'clone the branch from bitbucket.org → apps/, modules/, and the data source file are present');
        const afterPush = await inspectBranch(SB_BRANCH);
        try {
          expect(afterPush.dirHasFiles('apps')).toBe(true);
          expect(afterPush.dirHasFiles('modules')).toBe(true);
          expect(afterPush.hasFile(dsPath)).toBe(true);
        } finally {
          await afterPush.cleanup();
        }

        step(5, 'pull the default branch (round-trip); the data source is is_synced=true');
        await auth(agent().post('/api/workspace-branches/pull'))
          .query({ branch_id: defaultBranchId })
          .send({ branchId: defaultBranchId })
          .expect(201);
        expect((await dsvRow(dsId, defaultBranchId))?.is_synced).toBe(true);

        step(6, 'delete the data source, then push → its file is removed from the Bitbucket branch');
        await auth(agent().delete(`/api/data-sources/${dsId}`).query({ branch_id: defaultBranchId }));
        await auth(agent().post('/api/workspace-branches/push'))
          .query({ branch_id: defaultBranchId })
          .send({ commitMessage: 'remove bb data source', branchId: defaultBranchId, scope: 'datasource' })
          .expect(201);
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

    describe('saving a version creates a git tag', () => {
      const TAG_BRANCH = runBranch('tag');
      const UUID_TAG_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/v1$/;

      beforeAll(async () => {
        await createRunBranch(TAG_BRANCH);
      });

      it('single-branch: publishing a version creates a properly-formatted tag on Bitbucket', async () => {
        const { org, auth } = await newWorkspace('bb-tag-single@tooljet.io');
        const defaultBranchId = await configureGit(auth, org, TAG_BRANCH, false);

        const appId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: defaultBranchId })
            .send({ icon: 'home', name: 'bb-tag-single', type: 'front-end', branchId: defaultBranchId })
            .expect(201)
        ).body.id;
        const ctx = await editingVersionOf(auth, appId, defaultBranchId);
        await addButton(auth, appId, ctx, defaultBranchId);
        await gitpush(auth, appId, ctx.versionId, 'bb-tag-single', defaultBranchId, TAG_BRANCH).expect(201);

        const tagDs = app.get<DataSource>(getDataSourceToken('default'));
        const coRel: string = (await tagDs.query(`SELECT co_relation_id FROM apps WHERE id = $1`, [appId]))[0]
          .co_relation_id;
        const tagName = `${coRel}/v1`;
        createdTags.add(tagName);

        const preCheck = await auth(agent().get(`/api/app-git/${appId}/check-tag`))
          .query({ versionName: 'v1', branch_id: defaultBranchId })
          .expect(200);
        expect(preCheck.body).toMatchObject({ exists: false, tagName });
        expect(preCheck.body.tagName).toMatch(UUID_TAG_RE);

        // Publishing auto-creates the tag server-side (backend-owned tagging) — no separate call.
        await auth(agent().put(`/api/app-git/${appId}/versions/${ctx.versionId}`))
          .query({ branch_id: defaultBranchId })
          .send({ is_user_switched_version: false, name: 'v1', description: 'v1', status: 'PUBLISHED' })
          .expect(200);

        const postCheck = await auth(agent().get(`/api/app-git/${appId}/check-tag`))
          .query({ versionName: 'v1', branch_id: defaultBranchId })
          .expect(200);
        expect(postCheck.body.exists).toBe(true);
        expect(await remoteTagHash(tagName)).toMatch(/^[0-9a-f]{40}$/);
      }, 300000);
    });

    describe('multi-branch: feature branches are created and deleted on Bitbucket', () => {
      const MB_BRANCH = runBranch('multi');
      const FEATURE_BRANCH = runBranch('feat');

      beforeAll(async () => {
        await createRunBranch(MB_BRANCH);
        createdBranches.add(FEATURE_BRANCH); // created by ToolJet below; cleaned up even if the test fails
      });

      it('creates the feature branch remotely, lists it, and deletes it remotely', async () => {
        const { org, auth } = await newWorkspace('bb-multi-branch@tooljet.io');
        const defaultBranchId = await configureGit(auth, org, MB_BRANCH, true);

        await auth(agent().post('/api/workspace-branches'))
          .query({ branch_id: defaultBranchId })
          .send({ name: FEATURE_BRANCH, sourceBranchId: defaultBranchId })
          .expect(201);
        expect(await remoteBranchExists(FEATURE_BRANCH)).toBe(true);

        const branches: WorkspaceBranchRow[] = (
          await auth(agent().get('/api/workspace-branches')).query({ branch_id: defaultBranchId }).expect(200)
        ).body.branches;
        const feature = branches.find((b) => b.name === FEATURE_BRANCH);
        expect(feature).toMatchObject({ isDefault: false });

        const remote = await auth(agent().get('/api/workspace-branches/remote'))
          .query({ branch_id: defaultBranchId })
          .expect(200);
        expect(remote.body.branches.map((b: { name: string }) => b.name)).toEqual(
          expect.arrayContaining([MB_BRANCH, FEATURE_BRANCH])
        );

        await auth(agent().delete(`/api/workspace-branches/${feature?.id}`))
          .query({ branch_id: defaultBranchId })
          .expect(200);
        expect(await remoteBranchExists(FEATURE_BRANCH)).toBe(false);
      }, 300000);
    });

    describe('GET /api/app-git/:organizationId/app/:appId/pull-requests | Bitbucket pull requests', () => {
      const PR_BRANCH = runBranch('prs');

      beforeAll(async () => {
        await createRunBranch(PR_BRANCH);
      });

      it("lists the repository's pull requests in the provider-agnostic shape", async () => {
        const { org, auth } = await newWorkspace('bb-prs@tooljet.io');
        const defaultBranchId = await configureGit(auth, org, PR_BRANCH, false);
        const appId: string = (
          await auth(agent().post('/api/apps'))
            .query({ branch_id: defaultBranchId })
            .send({ icon: 'home', name: 'bb-prs-app', type: 'front-end', branchId: defaultBranchId })
            .expect(201)
        ).body.id;

        const res = await auth(agent().get(`/api/app-git/${org}/app/${appId}/pull-requests`))
          .query({ branch_id: defaultBranchId })
          .expect(200);

        expect(Array.isArray(res.body.pull_requests)).toBe(true);
        for (const pr of res.body.pull_requests) {
          expect(pr).toMatchObject({
            number: expect.any(String),
            title: expect.any(String),
            status: expect.any(String),
          });
        }
      }, 120000);
    });
  });
});
