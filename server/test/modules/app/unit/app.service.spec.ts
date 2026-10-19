// server/test/modules/app/unit/app.service.spec.ts
import { HttpException, HttpStatus } from '@nestjs/common';
import { AppsService } from '@modules/apps/service';
import { FEATURE_KEY } from '@modules/apps/constants';
import { App } from '@entities/app.entity';
import { resetAppDataRevisionCache } from '@modules/apps/app-data-revision';

jest.mock('@modules/group-permissions/repository', () => ({
  findUserGroupsWithAppAccess: jest.fn().mockResolvedValue([]),
}));

/** @group platform */
describe('AppsService.getBySlug', () => {
  const getBySlug = AppsService.prototype.getBySlug;

  const makeApp = (overrides: Partial<App> = {}): App =>
    ({ id: 'app-uuid-1', slug: 'my-app', currentVersionId: null, isPublic: true, ...overrides }) as App;

  it('throws 501 HttpException when unauthenticated user accesses app with no released version', async () => {
    expect.assertions(3);
    const app = makeApp({ currentVersionId: null });

    try {
      await getBySlug.call(null, app, null);
    } catch (e: any) {
      expect(e).toBeInstanceOf(HttpException);
      expect(e.getStatus()).toBe(HttpStatus.NOT_IMPLEMENTED);
      expect(e.getResponse()).toMatchObject({
        statusCode: HttpStatus.NOT_IMPLEMENTED,
        error: 'App is not released yet',
      });
    }
  });
});

/** @group platform */
describe('AppsService.validateReleasedApp', () => {
  // A real instance (no Nest DI): only appRepository.manager.query and the license lookup are touched.
  const getLicenseTerms = jest.fn().mockResolvedValue({ valid: true });
  const makeService = (query: jest.Mock): AppsService => {
    const service = Object.create(AppsService.prototype) as AppsService;
    Object.assign(service, { appRepository: { manager: { query } }, licenseTermsService: { getLicenseTerms } });
    return service;
  };
  // Answers the migration read and the change-stamp read.
  const revisionQuery = () =>
    jest.fn((sql: string) =>
      Promise.resolve(sql.includes('FROM migrations') ? [{ revision: '1787800000000' }] : [{ stamp: null }])
    );

  const makeApp = (overrides: Partial<App> = {}): App =>
    ({ id: 'app-uuid-1', slug: 'my-app', currentVersionId: 'ver-uuid-1', name: 'Orders', ...overrides }) as App;

  const makeAbility = (canUpdate = false) => ({
    can: jest.fn().mockReturnValue(canUpdate),
  });

  beforeEach(() => resetAppDataRevisionCache());

  it('returns id, slug, the released version id and the app data revision', async () => {
    const query = revisionQuery();
    const ability = makeAbility();

    const result = await makeService(query).validateReleasedApp(ability as never, makeApp(), {
      id: 'user-1',
    } as never);

    expect(result).toEqual({
      id: 'app-uuid-1',
      slug: 'my-app',
      currentVersionId: 'ver-uuid-1',
      appDataRevision: expect.stringMatching(/^1787800000000\./),
    });
    expect(ability.can).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledWith(expect.stringContaining('app_viewer_cache_stamps'), ['app-uuid-1']);
  });

  it('throws 501 HttpException when app has no released version', async () => {
    const query = jest.fn();
    const ability = makeAbility(false);

    const caught = await makeService(query)
      .validateReleasedApp(ability as never, makeApp({ currentVersionId: null }))
      .catch((e: HttpException) => e);

    expect(caught).toBeInstanceOf(HttpException);
    expect((caught as HttpException).getStatus()).toBe(HttpStatus.NOT_IMPLEMENTED);
    expect((caught as HttpException).getResponse()).toMatchObject({
      statusCode: HttpStatus.NOT_IMPLEMENTED,
      error: 'App is not released yet',
      message: { error: 'App is not released yet', editPermission: false },
    });
    expect(query).not.toHaveBeenCalled();
  });

  it('includes editPermission=true in 501 response when user has UPDATE ability', async () => {
    const ability = makeAbility(true);

    const caught = await makeService(jest.fn())
      .validateReleasedApp(ability as never, makeApp({ currentVersionId: null }))
      .catch((e: HttpException) => e);

    expect(
      ((caught as HttpException).getResponse() as { message: { editPermission: boolean } }).message.editPermission
    ).toBe(true);
    expect(ability.can).toHaveBeenCalledWith(FEATURE_KEY.UPDATE, App, 'app-uuid-1');
  });
});
