/**
 * QueryAuthGuard on the viewer run route (POST /data-queries/:id/run).
 *
 * A public app skips authentication, but only for its released version — the same rule
 * AppsService.getBySlug applies to the app definition. A query that exists only in a draft
 * version must fall through to JWT authentication, so an unauthenticated caller who knows
 * its id cannot run it.
 */
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { App } from '@entities/app.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { QueryAuthGuard } from '@modules/data-queries/guards/query-auth.guard';

describe('QueryAuthGuard', () => {
  const jwtCanActivate = jest.spyOn(AuthGuard('jwt').prototype, 'canActivate');
  const existsBy = jest.fn();
  const findByDataQuery = jest.fn();

  const guard = new QueryAuthGuard(
    {
      getSingleOrganizationWithId: jest.fn().mockResolvedValue(null),
      touchLastAccessedAt: jest.fn(),
    } as unknown as ConstructorParameters<typeof QueryAuthGuard>[0],
    { findByDataQuery } as unknown as ConstructorParameters<typeof QueryAuthGuard>[1],
    { existsBy } as unknown as ConstructorParameters<typeof QueryAuthGuard>[2],
    { log: jest.fn() } as unknown as ConstructorParameters<typeof QueryAuthGuard>[3]
  );

  const contextFor = (queryId: string) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ params: { id: queryId } }) }),
    }) as unknown as ExecutionContext;

  const publicApp = (overrides: Partial<App> = {}) =>
    ({
      id: 'app1',
      organizationId: 'org1',
      type: APP_TYPES.FRONT_END,
      isPublic: true,
      currentVersionId: 'released-version',
      ...overrides,
    }) as App;

  beforeEach(() => {
    jest.clearAllMocks();
    // No session: the JWT strategy rejects the request.
    jwtCanActivate.mockRejectedValue(new UnauthorizedException());
  });

  afterAll(() => jwtCanActivate.mockRestore());

  describe('POST /data-queries/:id/run | public front-end app', () => {
    it('should allow an unauthenticated run of a query in the released version', async () => {
      findByDataQuery.mockResolvedValue(publicApp());
      existsBy.mockResolvedValue(true);

      await expect(guard.canActivate(contextFor('released-query'))).resolves.toBe(true);
      expect(existsBy).toHaveBeenCalledWith({ id: 'released-query', appVersionId: 'released-version' });
      expect(jwtCanActivate).not.toHaveBeenCalled();
    });

    it('should require authentication for a query that exists only in a draft version', async () => {
      findByDataQuery.mockResolvedValue(publicApp());
      existsBy.mockResolvedValue(false);

      await expect(guard.canActivate(contextFor('draft-query'))).rejects.toBeInstanceOf(UnauthorizedException);
      expect(jwtCanActivate).toHaveBeenCalled();
    });

    it('should let a signed-in user run a draft query through normal authentication', async () => {
      findByDataQuery.mockResolvedValue(publicApp());
      existsBy.mockResolvedValue(false);
      jwtCanActivate.mockResolvedValue(true);

      await expect(guard.canActivate(contextFor('draft-query'))).resolves.toBe(true);
    });

    it('should require authentication when the app has never been released', async () => {
      findByDataQuery.mockResolvedValue(publicApp({ currentVersionId: null }));

      await expect(guard.canActivate(contextFor('draft-query'))).rejects.toBeInstanceOf(UnauthorizedException);
      expect(existsBy).not.toHaveBeenCalled();
    });
  });

  describe('POST /data-queries/:id/run | public workflow', () => {
    it('should keep allowing unauthenticated runs without a released-version check', async () => {
      findByDataQuery.mockResolvedValue(publicApp({ type: APP_TYPES.WORKFLOW, currentVersionId: null }));

      await expect(guard.canActivate(contextFor('workflow-query'))).resolves.toBe(true);
      expect(existsBy).not.toHaveBeenCalled();
    });
  });
});
