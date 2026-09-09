import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { App } from '@entities/app.entity';
import { AppVersion } from '@entities/app_version.entity';
import { Page } from '@entities/page.entity';
import { Component } from '@entities/component.entity';
import { AppGitService } from '@ee/app-git/service';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createApplication,
  createApplicationVersion,
  updateEntity,
  saveEntity,
  findEntityOrFail,
  createWorkflowDataSource,
  createWorkflowDataQuery,
  getDefaultDataSource,
} from 'test-helper';

/**
 * `validatePush` is the pre-push gate. It must refuse an app whose *module* references a workflow
 * that isn't ready, not just one the app references directly.
 *
 * The reference graph is app → module → workflow, and each hop's queries live on that resource's
 * own `app_versions` row. `resolveAllWorkflowRefsForVersion` is scoped to a single version
 * (`WHERE dq.app_version_id = $1`), so scanning only the app's version finds nothing and the push
 * proceeded — committing a module whose query pointed at a workflow absent from the repo (fixes.md
 * #30). A push that fails loudly is recoverable; one that silently writes a dangling reference into
 * the default branch is not, which is why this half is worth pinning even though the write cascade
 * itself needs a real git remote.
 *
 * "Ready" means exactly one default-branch (VERSION-type) non-stub DRAFT — that is the row the push
 * commits.
 *
 * @group gitsync
 */
describe('AppGitService.validatePush — workflows referenced through a module', () => {
  let nestApp: INestApplication;
  let appGitService: AppGitService;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    appGitService = nestApp.get(AppGitService);
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  /** Point a ModuleViewer on the consumer's home page at a module, by co_relation_id. */
  async function embedModuleInApp(consumerVersionId: string, moduleCoRelationId: string) {
    const homePage = await findEntityOrFail(Page, { appVersionId: consumerVersionId } as any);
    await saveEntity(Component, {
      name: 'moduleviewer1',
      type: 'ModuleViewer',
      pageId: homePage.id,
      properties: {
        moduleAppId: { value: moduleCoRelationId },
        moduleVersionId: { value: '' },
      },
      general: {},
      styles: {},
      generalStyles: {},
      validation: {},
    } as any);
  }

  /** A workflow-kind query on `version`, pinned at `workflowCoRelationId`. */
  async function addWorkflowQuery(version: AppVersion, organizationId: string, workflowCoRelationId: string) {
    const environment = await getDefaultDataSource().query(
      `SELECT id FROM app_environments WHERE organization_id = $1 ORDER BY priority ASC LIMIT 1`,
      [organizationId]
    );
    const dataSource = await createWorkflowDataSource(
      nestApp,
      organizationId,
      version.id,
      'workflows',
      environment[0]?.id,
      { name: `workflows-${randomUUID().slice(0, 8)}` }
    );
    await createWorkflowDataQuery(nestApp, version, dataSource, {
      name: 'workflows1',
      options: { workflowId: workflowCoRelationId, workflowVersionId: '__current_branch__' },
    });
  }

  /**
   * `app_versions.status` is nullable with no default (see the entity's own "need to review"
   * note), so a seeded version is NULL rather than DRAFT — and every readiness count filters on
   * DRAFT. Set it explicitly instead of relying on the factory.
   */
  async function asDraft(version: AppVersion): Promise<AppVersion> {
    await updateEntity(AppVersion, version.id, { status: 'DRAFT' } as any);
    return version;
  }

  /**
   * app (1 draft) → module (1 draft) → workflow. `workflowDrafts` controls readiness: 1 is ready,
   * 0 is not. Returns the app id plus the workflow's name for the assertion.
   */
  async function seedGraph(emailPrefix: string, workflowDrafts: 0 | 1 | 2) {
    const admin = await createAdmin(nestApp, `${emailPrefix}@tooljet.io`);
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;
    const organizationId = admin.workspace.id;

    const workflowName = `WF-${emailPrefix}`;
    const workflow = await createApplication(nestApp, { name: workflowName, user: orgUser, type: 'workflow' });
    const workflowCoRel = randomUUID();
    await updateEntity(App, workflow.id, { co_relation_id: workflowCoRel } as any);
    for (let i = 0; i < workflowDrafts; i++) {
      await asDraft(await createApplicationVersion(nestApp, workflow as any, { name: `wfv${i}` }));
    }

    const moduleApp = await createApplication(nestApp, { name: `M-${emailPrefix}`, user: orgUser, type: 'module' });
    const moduleCoRel = randomUUID();
    await updateEntity(App, moduleApp.id, { co_relation_id: moduleCoRel } as any);
    const moduleVersion = await asDraft(await createApplicationVersion(nestApp, moduleApp as any));
    // The reference that the app's own version cannot see.
    await addWorkflowQuery(moduleVersion, organizationId, workflowCoRel);

    const consumerApp = await createApplication(nestApp, { name: `A-${emailPrefix}`, user: orgUser });
    const consumerVersion = await asDraft(await createApplicationVersion(nestApp, consumerApp as any));
    await embedModuleInApp(consumerVersion.id, moduleCoRel);

    return { appId: consumerApp.id, workflowName, workflowId: workflow.id, organizationId };
  }

  it('blocks the push when the module references a workflow with no draft', async () => {
    const { appId, workflowName } = await seedGraph('vpnw-nodraft', 0);

    const result = await appGitService.validatePush(appId, 'app');

    expect(result).toMatchObject({
      valid: false,
      errorType: 'WORKFLOWS_NOT_READY',
      affectedResources: [workflowName],
    });
  });

  it('blocks the push when the module references a workflow with multiple drafts', async () => {
    const { appId, workflowName } = await seedGraph('vpnw-multidraft', 2);

    const result = await appGitService.validatePush(appId, 'app');

    expect(result).toMatchObject({
      valid: false,
      errorType: 'WORKFLOWS_NOT_READY',
      affectedResources: [workflowName],
    });
  });

  it('allows the push when the module references a workflow with exactly one draft', async () => {
    const { appId } = await seedGraph('vpnw-ready', 1);

    const result = await appGitService.validatePush(appId, 'app');

    expect(result).toEqual({ valid: true });
  });

  // The app and its module can name the same workflow; the readiness loop dedupes by app id so the
  // user sees one entry, not one per referencing resource.
  it('reports a workflow referenced by both the app and its module only once', async () => {
    const { appId, workflowName, organizationId } = await seedGraph('vpnw-dupe', 0);

    const appVersion = await findEntityOrFail(AppVersion, { appId } as any);
    const workflowApp = await findEntityOrFail(App, { name: workflowName } as any);
    await addWorkflowQuery(appVersion, organizationId, workflowApp.co_relation_id);

    const result = await appGitService.validatePush(appId, 'app');

    expect(result.errorType).toBe('WORKFLOWS_NOT_READY');
    expect(result.affectedResources).toEqual([workflowName]);
  });

  // Guards the module hop specifically: with no ModuleViewer the graph is app → (nothing), so a
  // workflow reachable only through the module must not be reported. Without this, a bug that
  // scanned every workflow in the org would still pass the tests above.
  it('does not report a workflow that nothing in the app reaches', async () => {
    const admin = await createAdmin(nestApp, 'vpnw-unrelated@tooljet.io');
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;

    // Draftless workflow in the same org, referenced by nobody.
    const orphan = await createApplication(nestApp, { name: 'WF-orphan', user: orgUser, type: 'workflow' });
    await updateEntity(App, orphan.id, { co_relation_id: randomUUID() } as any);

    const consumerApp = await createApplication(nestApp, { name: 'A-unrelated', user: orgUser });
    await asDraft(await createApplicationVersion(nestApp, consumerApp as any));

    const result = await appGitService.validatePush(consumerApp.id, 'app');

    expect(result).toEqual({ valid: true });
  });
});
