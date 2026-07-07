import { INestApplication } from '@nestjs/common';
// The test app boots with edition: 'ee', so the DI container registers the EE
// subclass (server/ee/apps/util.service.ts) as the AppsUtilService provider —
// a different class reference than the CE base class. app.get() matches by
// class-reference identity, so we must import the same class reference the
// container actually instantiated. findAppWithIdOrSlug is defined on this EE
// subclass, not the CE base class.
import { AppsUtilService } from '@ee/apps/util.service';
import { AppVersion } from '@entities/app_version.entity';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, createApplication, createApplicationVersion } from 'test-helper';
import { updateEntity } from 'test-helper';
import { v4 as uuidv4 } from 'uuid';

/** @group platform */
describe('AppsUtilService.findAppWithIdOrSlug — workflow slug resolution (post-migration)', () => {
  let app: INestApplication;
  let appsUtilService: AppsUtilService;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    appsUtilService = app.get(AppsUtilService);
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('resolves a workflow by slug via app_versions.slug, with version-sourced metadata', async () => {
    const admin = await createAdmin(app, 'find-app-with-id-or-slug-admin@tooljet.io');
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;

    const workflow = await createApplication(app, { name: 'IdOrSlug Workflow', user: orgUser, type: 'workflow' });
    const version = await createApplicationVersion(app, workflow as any);
    // NOTE: the slug is deliberately a UUID-formatted string (not e.g. 'my-workflow'),
    // and distinct from workflow.id. This is a workaround for a pre-existing, unrelated
    // bug: findAppWithIdOrSlug's step 1 unconditionally calls
    // this.appRepository.findById(slug, ...) with NO isUUID(slug) guard (the CE base
    // class findAppWithIdOrSlug DOES guard this at util.service.ts:440). Passing a
    // human-readable slug there throws a Postgres "invalid input syntax for type uuid"
    // error on the `id = $1` predicate; the try/catch swallows it at the JS level, but
    // under this repo's e2e harness (one real Postgres transaction shared per spec file,
    // see test/helpers/setup.ts) the failed statement poisons the whole suite
    // transaction and every later query in the test fails with "current transaction is
    // aborted". Using a UUID-shaped-but-unmatched slug lets step 1's findById run a
    // valid (if unmatched) query, fall through cleanly, and exercise the intended
    // app_versions.slug resolution in step 3 — see task-6-report.md for the full finding.
    const slug = uuidv4();
    await updateEntity(AppVersion, version.id, {
      slug,
      appName: 'IdOrSlug Workflow Version Name',
      icon: 'id-or-slug-icon.svg',
      isPublic: true,
    });

    const resolved = await appsUtilService.findAppWithIdOrSlug(slug, admin.workspace.id);

    expect(resolved.id).toBe(workflow.id);
    expect(resolved).toMatchObject({
      name: 'IdOrSlug Workflow Version Name',
      slug,
      icon: 'id-or-slug-icon.svg',
      isPublic: true,
    });
  });
});
