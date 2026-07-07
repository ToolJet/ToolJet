import { INestApplication } from '@nestjs/common';
import { VersionRepository } from '@modules/versions/repository';
import { VersionUtilService } from '@ee/versions/util.service';
import { AppVersion } from '@entities/app_version.entity';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, createApplication, createApplicationVersion } from 'test-helper';
import { updateEntity } from 'test-helper';

/** @group platform */
describe('VersionRepository — workflow metadata overlay (post-migration)', () => {
  let app: INestApplication;
  let versionRepository: VersionRepository;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    // NOTE: plain `app.get(VersionRepository)` resolves to a broken, unrelated plain
    // TypeORM `Repository` instance (no custom methods) instead of the real
    // `VersionRepository` singleton -- root cause is a pre-existing, unrelated bug in
    // `apps/module.ts`: its `TypeOrmModule.forFeature([...])` call mistakenly includes
    // `VersionRepository` in the entities list. `@nestjs/typeorm`'s `getRepositoryToken`
    // returns the class itself as the token for any class whose prototype is already a
    // `Repository` subclass, so this creates and *exports* a second, malformed provider
    // under the exact same DI token (`VersionRepository`) as the correct one -- which wins
    // a global, non-strict `app.get()` lookup (`app.select(VersionModule)` doesn't help
    // either -- Nest can't select this dynamically-registered module by class reference
    // from outside its own registration graph). Instead, resolve the correct instance via
    // `VersionUtilService`, which is declared directly inside `VersionModule` (unaffected
    // by the apps/module.ts collision) and constructor-injects the real `VersionRepository`
    // as `protected readonly versionRepository` -- accessible at runtime via bracket
    // notation since `protected` is compile-time-only in TS.
    // Not fixed here: out of this task's scope, pre-existing, and unrelated to the overlay
    // guard removal below -- flagged for the controller/human as a real, separate bug.
    versionRepository = (app.get(VersionUtilService) as any).versionRepository;
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('findAppFromVersion should overlay version metadata onto a workflow app', async () => {
    const admin = await createAdmin(app, 'version-repo-overlay-1@tooljet.io');
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;
    const workflow = await createApplication(app, { name: 'Version Repo Overlay', user: orgUser, type: 'workflow' });
    const version = await createApplicationVersion(app, workflow as any);
    await updateEntity(AppVersion, version.id, { slug: 'version-repo-overlay-slug', appName: 'Overlay Name' });

    const resolvedApp = await versionRepository.findAppFromVersion(version.id, admin.workspace.id);
    expect(resolvedApp).toMatchObject({ slug: 'version-repo-overlay-slug', name: 'Overlay Name' });
  });

  it('getAppVersionById should overlay version metadata onto a workflow app', async () => {
    const admin = await createAdmin(app, 'version-repo-overlay-2@tooljet.io');
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;
    const workflow = await createApplication(app, { name: 'Version Repo Overlay 2', user: orgUser, type: 'workflow' });
    const version = await createApplicationVersion(app, workflow as any);
    await updateEntity(AppVersion, version.id, { slug: 'get-app-version-by-id-slug', appName: 'Overlay Name 2' });

    const result = await versionRepository.getAppVersionById(version.id);
    expect(result.app).toMatchObject({ slug: 'get-app-version-by-id-slug', name: 'Overlay Name 2' });
  });
});
