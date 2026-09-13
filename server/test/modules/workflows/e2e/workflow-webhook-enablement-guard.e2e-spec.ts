/**
 * @group workflows
 *
 * GATE 8, Step 8.4 (phase-8-implementation.md "## Verification — GATE 8", Step 8.4 Tests
 * section): "The guard: 403 when disabled, 200 when enabled, and 404 (not 403) for an unknown
 * version name while the flag is true." Direct-call coverage of `WebhookGuard.canActivate`
 * (`src/modules/licensing/guards/webhook.guard.ts`) reading branch-scoped
 * `app_versions.workflow_enabled` — the migration this file exercises moved enablement off
 * `apps.workflow_enabled`, so the old `enableWebhookForWorkflows` test helper (writes to the App
 * entity) no longer has any effect on this guard.
 *
 * NOT an HTTP-level test, by necessity, not preference: every workflow controller — including
 * this guard's own route — is unregistered in the Jest e2e test app. `AppModule.register()`
 * (`src/modules/app/module.ts:192-195`, landed 2026-09-01 PR #17751) only imports `WorkflowsModule`
 * when `!configs.IS_GET_CONTEXT`, and `test/helpers/setup.ts`'s `initTestApp()` hardcodes
 * `IS_GET_CONTEXT: true` for every test app. Confirmed live: booting a test app and enumerating
 * `app.getHttpAdapter().getInstance().router.stack` shows zero `/webhooks/workflows/*` or any
 * other workflows-controller route — this is also why `workflow-executions.spec.ts` and this
 * module's own `workflow-webhook.spec.ts` are BOTH `describe.skip('[QUARANTINED] ...')` already;
 * this is a pre-existing, repo-wide gap this file works around rather than silently deepens. Not
 * this session's fix to make — flagged separately, not patched here, since loosening
 * `IS_GET_CONTEXT` for all tests is a much wider change than one gate's coverage warrants.
 *
 * This instantiates `WebhookGuard` directly against the real test database (same pattern as
 * `workflow-webhooks-blocked-fields.spec.ts`), with a hand-built fake `ExecutionContext` — the
 * guard reads only `request.headers`, `request.params`, `request.route.path`, and `request.query`
 * (verified by reading `canActivate` in full), so a plain object satisfies it without a real HTTP
 * round trip. `AppsRepository`, `LicenseTermsService`, and `EntityManager` are resolved from the
 * real (workflows-module-less) test app / test datasource — nothing about them is workflows-
 * specific. `tooljet-qa-suite`'s `gate-8/04` Playwright spec proves the same guard end-to-end over
 * a real push/merge/pull, including real execution; this is the unit/service-level coverage
 * `docs/server-specs.md` (tooljet-qa-suite repo) tracks as missing.
 *
 * Mechanism, read directly from webhook.guard.ts before writing any assertion:
 *   - `:60-67` — only routes ending `/trigger` or `/trigger-async` read `?version=`.
 *   - `:60-64` — a NAMED version resolves `enablementRow` by `{ appId, name }`; unknown name
 *     leaves it `null` (:65-66, deliberately not a 403 here).
 *   - `:69-76` — falls back to `workflowApp.currentVersionId`'s own row when no name matched.
 *   - `:78-80` — 403 `"Webhook endpoint disabled or doesn't exists"` when the resolved row's
 *     `workflowEnabled` is falsy.
 *   - An unknown name with the released version enabled therefore PASSES the guard (falls back to
 *     the released row, which is enabled) and then 404s downstream, inside
 *     `WorkflowWebhooksService.resolveVersionId` (`ee/workflows/services/workflow-webhooks
 *     .service.ts:247-268`), which throws `Version "<name>" not found for workflow "<name>"` —
 *     this is the 404-not-403 case, exercised directly on the service below.
 */
import { ExecutionContext, INestApplication } from '@nestjs/common';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createApplication,
  createApplicationVersion,
  updateEntity,
  getDefaultDataSource,
} from 'test-helper';
import { App } from 'src/entities/app.entity';
import { AppVersion, AppVersionStatus, AppVersionType } from 'src/entities/app_version.entity';
import { WebhookGuard } from 'src/modules/licensing/guards/webhook.guard';
import { AppsRepository } from '@modules/apps/repository';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { WorkflowWebhooksService } from '@ee/workflows/services/workflow-webhooks.service';
import { v4 as uuidv4 } from 'uuid';

jest.setTimeout(60_000);

function ctxFor(request: Record<string, unknown>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

function triggerRequest(orgId: string, workflowId: string, token: string, version?: string) {
  return {
    headers: { 'tj-workspace-id': orgId, authorization: `Bearer ${token}` },
    params: { idOrName: workflowId },
    route: { path: '/api/v2/webhooks/workflows/:idOrName/trigger' },
    query: version ? { version } : {},
  };
}

describe('WebhookGuard branch-scoped enablement (GATE 8, Step 8.4)', () => {
  let nestApp: INestApplication;
  let guard: WebhookGuard;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    const ds = getDefaultDataSource();
    guard = new WebhookGuard(
      ds.manager,
      nestApp.get(AppsRepository),
      nestApp.get(LicenseTermsService),
      {} as never // ConfigService — only reached by the external-API-token fallback, unused here
    );
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60000);

  async function seedReleasedWorkflow(namePrefix: string) {
    const admin = await createAdmin(nestApp, `${namePrefix}-${Date.now()}@tooljet.io`);
    const orgId = admin.user.organizationId;
    const workflow = await createApplication(nestApp, { name: namePrefix, user: admin.user, type: 'workflow' });
    const version = await createApplicationVersion(nestApp, workflow as App & { organizationId: string });
    await updateEntity(AppVersion, version.id, {
      status: AppVersionStatus.PUBLISHED,
      versionType: AppVersionType.VERSION,
      isStub: false,
      workflowEnabled: false,
    });
    const token = uuidv4();
    // isMaintenanceOn is the guard's FIRST check (webhook.guard.ts:44) — createApplication leaves
    // it at its column default; createWorkflowForUser sets it true, but that helper needs
    // WorkflowsModule routes this file deliberately avoids (see header).
    await updateEntity(App, workflow.id, {
      workflowApiToken: token,
      currentVersionId: version.id,
      isMaintenanceOn: true,
    });
    return { orgId, workflow, version, token };
  }

  it('403s with the exact message when the released version is disabled', async () => {
    const { orgId, workflow, token } = await seedReleasedWorkflow('g8-guard-disabled');

    await expect(guard.canActivate(ctxFor(triggerRequest(orgId, workflow.id, token)))).rejects.toThrow(
      `Webhook endpoint disabled or doesn't exists`
    );
  });

  it('passes (does not throw) when the released version is enabled', async () => {
    const { orgId, workflow, version, token } = await seedReleasedWorkflow('g8-guard-enabled');
    await updateEntity(AppVersion, version.id, { workflowEnabled: true });

    await expect(guard.canActivate(ctxFor(triggerRequest(orgId, workflow.id, token)))).resolves.toBe(true);
  });

  it('passes for an OLD published version by name — proves the propagate trigger, not just the DB column', async () => {
    const { orgId, workflow, token } = await seedReleasedWorkflow('g8-guard-old-published');

    // A draft, enabled — the propagate trigger fans this onto the sibling PUBLISHED "old" row.
    const draft = await createApplicationVersion(nestApp, workflow as App & { organizationId: string });
    await updateEntity(AppVersion, draft.id, {
      status: AppVersionStatus.DRAFT,
      versionType: AppVersionType.VERSION,
      isStub: false,
      workflowEnabled: false,
    });

    const oldPublished = await createApplicationVersion(nestApp, workflow as App & { organizationId: string });
    await updateEntity(AppVersion, oldPublished.id, {
      status: AppVersionStatus.PUBLISHED,
      versionType: AppVersionType.VERSION,
      isStub: false,
      workflowEnabled: false,
    });

    // Flip the DRAFT — fans to BOTH published rows (the current one from seedReleasedWorkflow
    // and this "old" one), never to itself needing a direct write.
    await updateEntity(AppVersion, draft.id, { workflowEnabled: true });

    await expect(guard.canActivate(ctxFor(triggerRequest(orgId, workflow.id, token, oldPublished.name)))).resolves.toBe(
      true
    );
  });

  it('404s naming the version for an unknown ?version=, even though the released version is enabled (not 403)', async () => {
    const { orgId, workflow, version, token } = await seedReleasedWorkflow('g8-guard-unknown-version');
    await updateEntity(AppVersion, version.id, { workflowEnabled: true });

    // The guard itself must NOT throw — it falls back to the enabled released row.
    await expect(
      guard.canActivate(ctxFor(triggerRequest(orgId, workflow.id, token, 'does-not-exist-version-xyz')))
    ).resolves.toBe(true);

    // The 404 comes from the service, downstream of the guard — same call the controller makes.
    const ds = getDefaultDataSource();
    const service = new WorkflowWebhooksService(
      ds.manager,
      {} as never,
      {} as never, // unreached: resolveVersionId throws before validateVersionEnvironmentCompatibility
      ds,
      {} as never,
      {} as never,
      {} as never
    );
    const workflowApp = await ds.manager.findOneOrFail(App, { where: { id: workflow.id } });
    await expect(
      service.resolveVersionId(workflowApp, 'does-not-exist-version-xyz', 'irrelevant-env-id')
    ).rejects.toThrow('not found');
  });
});
