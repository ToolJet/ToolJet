import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppVersion } from '@entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import {
  createUser,
  login,
  logout,
  initTestApp,
  closeTestApp,
  ensureAppEnvironments,
  findEntityOrFail,
  saveEntity,
  createWorkflowDataSource,
  createWorkflowDataQuery,
  buildWorkflowDefinition,
} from 'test-helper';

// Workflows (App type='workflow') always resolve app_versions.branch_id to the
// org's default WorkspaceBranch, regardless of the caller's active branch or any
// branchId supplied in the request body (see workflow-create-branch-id.e2e-spec.ts,
// commit b61ccf667d). None of app-git/git-sync/workspace-branches source has a single
// reference to "workflow" -- there is no workflow-specific push/pull. So git-sync
// being configured, enabled, and branching-on should be a complete no-op for every
// workflow lifecycle operation. This suite proves that by running the identical
// operation sequence once against a plain org and once against an org configured for
// git-sync exactly the way test/modules/git-sync/e2e/git-sync.spec.ts configures it
// (real Gitea/GitHub-Enterprise test server -- same required env vars).
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const GIT_BASE_URL = requireEnv('TEST_GIT_BASE_URL').replace(/\/$/, '');
const GIT_REPO_PATH = (process.env.TEST_GIT_REPO_PATH || 'gsmithun4/e2e').replace(/^\/|\/$/g, '');

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
const RESET_URL = `${GIT_BASE_URL}/admin/repos/${GIT_REPO_PATH}.git/reset`;

// Raw entity-creation test helpers (createUser) don't go through
// SetupOrganizationsUtilService.create, the production org-creation path that seeds a
// default WorkspaceBranch for every new org -- ensure one exists so workflow creation
// (which requires a resolvable default branch) has somewhere to land.
async function ensureDefaultBranch(organizationId: string): Promise<WorkspaceBranch> {
  return await saveEntity(WorkspaceBranch, { organizationId, name: 'main', isDefault: true });
}

interface LifecycleCtx {
  app: INestApplication;
  tokenCookie: string[];
  orgId: string;
  userId: string;
  defaultBranchId: string;
}

interface LifecycleResult {
  createStatus: number;
  createdBranchId: string;
  definitionUpdateStatus: number;
  executeStatus: number;
  executed: boolean;
  statusPollStatus: number;
  detailsStatus: number;
  renameStatus: number;
  slugChangeStatus: number;
  publishStatus: number;
  publishedStatusValue: string;
  listStatus: number;
  listContainsRenamed: boolean;
  deleteStatus: number;
  listAfterDeleteContainsIt: boolean;
}

/**
 * Runs the same workflow CRUD + execution lifecycle regardless of the org's
 * git-sync configuration. Both describe blocks below call this with an
 * otherwise-identical org and assert the same outcomes.
 */
async function runWorkflowLifecycle(ctx: LifecycleCtx): Promise<LifecycleResult> {
  const { app, tokenCookie, orgId, userId, defaultBranchId } = ctx;

  // 1. Create the workflow via the dedicated endpoint.
  const createResp = await request
    .agent(app.getHttpServer())
    .post('/api/workflows')
    .set('Cookie', tokenCookie)
    .set('tj-workspace-id', orgId)
    .send({ name: 'Lifecycle Workflow', type: 'workflow' });
  const appId: string = createResp.body?.id;

  const createdVersion = await findEntityOrFail(AppVersion, { appId });
  const versionId = createdVersion.id;
  const environmentId = createdVersion.currentEnvironmentId;

  // 2. Wire a RunJS query onto the draft and push it through the definition.
  const dataSource = await createWorkflowDataSource(app, orgId, versionId, 'runjs', environmentId, {
    type: 'static',
    scope: 'global',
  });
  const dataQuery = await createWorkflowDataQuery(app, createdVersion, dataSource, {
    name: 'sumNumbers',
    options: {
      code: `
        const numbers = [1, 2, 3, 4, 5];
        return { sum: numbers.reduce((acc, val) => acc + val, 0) };
      `,
      parameters: [],
    },
  });

  const definition = buildWorkflowDefinition({
    nodes: [
      { id: 'start-1', type: 'input', data: { nodeType: 'start' }, position: { x: 100, y: 250 } },
      {
        id: 'runjs-1',
        type: 'query',
        data: { idOnDefinition: 'query-runjs-1', kind: 'runjs', options: {} },
        position: { x: 350, y: 250 },
      },
      {
        id: 'response-1',
        type: 'output',
        data: { nodeType: 'response', code: 'return { result: runjs1.data }', nodeName: 'response1' },
        position: { x: 600, y: 250 },
      },
    ],
    edges: [
      { id: 'edge-1', source: 'start-1', target: 'runjs-1', type: 'workflow' },
      { id: 'edge-2', source: 'runjs-1', target: 'response-1', type: 'workflow' },
    ],
    queries: [{ idOnDefinition: 'query-runjs-1', id: dataQuery.id }],
  });

  const definitionUpdateResp = await request
    .agent(app.getHttpServer())
    .put(`/api/v2/apps/${appId}/versions/${versionId}`)
    .set('Cookie', tokenCookie)
    .set('tj-workspace-id', orgId)
    .send({ definition, is_user_switched_version: false });

  // 3. Execute the workflow.
  const executeResp = await request
    .agent(app.getHttpServer())
    .post('/api/workflow_executions')
    .set('Cookie', tokenCookie)
    .set('tj-workspace-id', orgId)
    .send({ appId, executeUsing: 'app', userId, environmentId });
  const executionId: string = executeResp.body?.workflowExecution?.id;

  // 4. Poll status.
  const statusPollResp = await request
    .agent(app.getHttpServer())
    .get(`/api/workflow_executions/${executionId}/status`)
    .set('Cookie', tokenCookie)
    .set('tj-workspace-id', orgId);

  // 5. Fetch execution details.
  const detailsResp = await request
    .agent(app.getHttpServer())
    .get(`/api/workflow_executions/${executionId}`)
    .set('Cookie', tokenCookie)
    .set('tj-workspace-id', orgId);

  // 6. Rename.
  const renameResp = await request
    .agent(app.getHttpServer())
    .put(`/api/apps/${appId}`)
    .set('Cookie', tokenCookie)
    .set('tj-workspace-id', orgId)
    .send({ app: { name: 'Renamed Lifecycle Workflow', editingVersionId: versionId } });

  // 7. Slug change.
  const slugChangeResp = await request
    .agent(app.getHttpServer())
    .put(`/api/apps/${appId}`)
    .set('Cookie', tokenCookie)
    .set('tj-workspace-id', orgId)
    .send({ app: { slug: 'renamed-lifecycle-workflow', editingVersionId: versionId } });

  // 8. Publish.
  const publishResp = await request
    .agent(app.getHttpServer())
    .put(`/api/v2/apps/${appId}/versions/${versionId}`)
    .set('Cookie', tokenCookie)
    .set('tj-workspace-id', orgId)
    .send({ name: 'v1', description: 'lifecycle publish', status: 'PUBLISHED' });

  const publishedVersion = await findEntityOrFail(AppVersion, { id: versionId });

  // 9. List.
  const listResp = await request
    .agent(app.getHttpServer())
    .get('/api/apps')
    .query({ page: 1, folder: '', searchKey: '', type: 'workflow' })
    .set('Cookie', tokenCookie)
    .set('tj-workspace-id', orgId);
  const listContainsRenamed = (listResp.body?.apps || []).some(
    (a: any) => a.id === appId && a.name === 'Renamed Lifecycle Workflow'
  );

  // 10. Delete.
  const deleteResp = await request
    .agent(app.getHttpServer())
    .delete(`/api/apps/${appId}`)
    .set('Cookie', tokenCookie)
    .set('tj-workspace-id', orgId);

  const listAfterDeleteResp = await request
    .agent(app.getHttpServer())
    .get('/api/apps')
    .query({ page: 1, folder: '', searchKey: '', type: 'workflow' })
    .set('Cookie', tokenCookie)
    .set('tj-workspace-id', orgId);
  const listAfterDeleteContainsIt = (listAfterDeleteResp.body?.apps || []).some((a: any) => a.id === appId);

  return {
    createStatus: createResp.status,
    createdBranchId: createdVersion.branchId,
    definitionUpdateStatus: definitionUpdateResp.status,
    executeStatus: executeResp.status,
    executed: !!detailsResp.body?.executed || !!detailsResp.body?.execution?.executed,
    statusPollStatus: statusPollResp.status,
    detailsStatus: detailsResp.status,
    renameStatus: renameResp.status,
    slugChangeStatus: slugChangeResp.status,
    publishStatus: publishResp.status,
    publishedStatusValue: publishedVersion.status,
    listStatus: listResp.status,
    listContainsRenamed,
    deleteStatus: deleteResp.status,
    listAfterDeleteContainsIt,
  };

  // `defaultBranchId` is accepted on the ctx for callers to assert the branch-carveout
  // (createdBranchId === defaultBranchId) themselves -- kept out of the shared assertions
  // below since it's the one thing that legitimately differs in *how* it's derived
  // (auto-seeded by git-sync configs vs. seeded manually) even though the value invariant
  // (workflow always lands on the default branch) holds in both legs.
  void defaultBranchId;
}

/** @group workflows */
describe('Workflow lifecycle', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  describe('without git-sync', () => {
    let orgId: string;
    let userId: string;
    let tokenCookie: string[];
    let defaultBranchId: string;

    beforeAll(async () => {
      const { organization, user } = await createUser(app, {
        email: 'workflow-lifecycle-no-gitsync@tooljet.io',
        firstName: 'user',
        lastName: 'name',
      });
      orgId = organization.id;
      userId = user.id;
      await ensureAppEnvironments(app, orgId);
      const branch = await ensureDefaultBranch(orgId);
      defaultBranchId = branch.id;
      const { tokenCookie: cookie } = await login(app, 'workflow-lifecycle-no-gitsync@tooljet.io');
      tokenCookie = cookie;
    });

    afterAll(async () => {
      try {
        await logout(app, tokenCookie, orgId);
      } catch {
        /* ignore -- cleanup only */
      }
    });

    it('completes the full workflow CRUD + execution lifecycle', async () => {
      const result = await runWorkflowLifecycle({ app, tokenCookie, orgId, userId, defaultBranchId });

      expect(result.createStatus).toBe(201);
      expect(result.createdBranchId).toBe(defaultBranchId);
      expect(result.definitionUpdateStatus).toBe(200);
      expect(result.executeStatus).toBe(201);
      expect(result.executed).toBe(true);
      expect(result.statusPollStatus).toBe(200);
      expect(result.detailsStatus).toBe(200);
      expect(result.renameStatus).toBe(200);
      expect(result.slugChangeStatus).toBe(200);
      expect(result.publishStatus).toBe(200);
      expect(result.publishedStatusValue).toBe('PUBLISHED');
      expect(result.listStatus).toBe(200);
      expect(result.listContainsRenamed).toBe(true);
      expect(result.deleteStatus).toBeGreaterThanOrEqual(200);
      expect(result.deleteStatus).toBeLessThan(300);
      expect(result.listAfterDeleteContainsIt).toBe(false);
    });
  });

  describe('with git-sync (branching enabled)', () => {
    // Configures git-sync exactly the way git-sync.spec.ts's "App git life cycle" test
    // does (steps 0, 1, 5, 6): reset the real Gitea repo, save provider configs (which
    // auto-seeds the default branch), then create + switch to a feature branch. Every
    // workflow operation below then runs while a *non-default* branch is active.
    let orgId: string;
    let userId: string;
    let tokenCookie: string[];
    let defaultBranchId: string;
    let featureBranchId: string;

    beforeAll(async () => {
      const { organization, user } = await createUser(app, {
        email: 'workflow-lifecycle-gitsync@tooljet.io',
        firstName: 'user',
        lastName: 'name',
      });
      orgId = organization.id;
      userId = user.id;
      await ensureAppEnvironments(app, orgId);
      const { tokenCookie: cookie } = await login(app, 'workflow-lifecycle-gitsync@tooljet.io');
      tokenCookie = cookie;

      await fetch(RESET_URL, {
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

      const branchesResp = await request
        .agent(app.getHttpServer())
        .get('/api/workspace-branches')
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId)
        .expect(200);
      defaultBranchId = branchesResp.body.activeBranchId;

      const createBranchResp = await request
        .agent(app.getHttpServer())
        .post('/api/workspace-branches')
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId)
        .query({ branch_id: defaultBranchId })
        .send({ name: 'feat-workflow-lifecycle', sourceBranchId: defaultBranchId })
        .expect(201);
      featureBranchId = createBranchResp.body.id;

      const activeAfterCreate = await request
        .agent(app.getHttpServer())
        .get('/api/workspace-branches')
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId)
        .expect(200);
      expect(activeAfterCreate.body.activeBranchId).toBe(featureBranchId);
    }, 60000);

    afterAll(async () => {
      try {
        await logout(app, tokenCookie, orgId);
      } catch {
        /* ignore -- cleanup only */
      }
    });

    it('completes the full workflow CRUD + execution lifecycle identically to the no-git-sync leg', async () => {
      const result = await runWorkflowLifecycle({ app, tokenCookie, orgId, userId, defaultBranchId });

      // Same assertions as the "without git-sync" leg -- the point of this test is that
      // git-sync + branching (active branch = a feature branch, not the default) changes
      // nothing about workflow behavior. `createdBranchId` in particular must still equal
      // the org's DEFAULT branch, not the active feature branch.
      expect(result.createStatus).toBe(201);
      expect(result.createdBranchId).toBe(defaultBranchId);
      expect(result.createdBranchId).not.toBe(featureBranchId);
      expect(result.definitionUpdateStatus).toBe(200);
      expect(result.executeStatus).toBe(201);
      expect(result.executed).toBe(true);
      expect(result.statusPollStatus).toBe(200);
      expect(result.detailsStatus).toBe(200);
      expect(result.renameStatus).toBe(200);
      expect(result.slugChangeStatus).toBe(200);
      expect(result.publishStatus).toBe(200);
      expect(result.publishedStatusValue).toBe('PUBLISHED');
      expect(result.listStatus).toBe(200);
      expect(result.listContainsRenamed).toBe(true);
      expect(result.deleteStatus).toBeGreaterThanOrEqual(200);
      expect(result.deleteStatus).toBeLessThan(300);
      expect(result.listAfterDeleteContainsIt).toBe(false);
    });
  });
});
