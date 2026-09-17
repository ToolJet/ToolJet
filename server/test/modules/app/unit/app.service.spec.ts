// server/test/modules/app/unit/app.service.spec.ts
import { HttpException, HttpStatus } from '@nestjs/common';
import { AppsService } from '@modules/apps/service';
import { FEATURE_KEY } from '@modules/apps/constants';
import { App } from '@entities/app.entity';

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
  const validateReleasedApp = AppsService.prototype.validateReleasedApp;

  const makeApp = (overrides: Partial<App> = {}): App =>
    ({ id: 'app-uuid-1', slug: 'my-app', currentVersionId: 'ver-uuid-1', ...overrides }) as App;

  const makeAbility = (canUpdate = false) => ({
    can: jest.fn().mockReturnValue(canUpdate),
  });

  it('returns id and slug when app has a released version', () => {
    const app = makeApp({ currentVersionId: 'ver-uuid-1' });
    const ability = makeAbility();

    const result = validateReleasedApp.call(null, ability, app);

    expect(result).toEqual({ id: 'app-uuid-1', slug: 'my-app' });
    expect(ability.can).not.toHaveBeenCalled();
  });

  it('throws 501 HttpException when app has no released version', () => {
    const app = makeApp({ currentVersionId: null });
    const ability = makeAbility(false);

    let caught: HttpException | undefined;
    try {
      validateReleasedApp.call(null, ability, app);
    } catch (e: any) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(HttpException);
    expect(caught!.getStatus()).toBe(HttpStatus.NOT_IMPLEMENTED);
    expect(caught!.getResponse()).toMatchObject({
      statusCode: HttpStatus.NOT_IMPLEMENTED,
      error: 'App is not released yet',
      message: { error: 'App is not released yet', editPermission: false },
    });
  });

  it('includes editPermission=true in 501 response when user has UPDATE ability', () => {
    expect.assertions(2);
    const app = makeApp({ currentVersionId: null });
    const ability = makeAbility(true);

    try {
      validateReleasedApp.call(null, ability, app);
    } catch (e: any) {
      expect(e.getResponse().message.editPermission).toBe(true);
      expect(ability.can).toHaveBeenCalledWith(FEATURE_KEY.UPDATE, App, 'app-uuid-1');
    }
  });
});
