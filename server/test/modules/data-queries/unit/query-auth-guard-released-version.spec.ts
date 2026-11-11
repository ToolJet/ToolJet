import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { QueryAuthGuard } from '@modules/data-queries/guards/query-auth.guard';
import { APP_TYPES } from '@modules/apps/constants';
import { WORKSPACE_STATUS } from '@modules/users/constants/lifecycle';

/**
 * Regression: anonymous POST /api/data-queries/:id/run must be confined to a public app's RELEASED
 * version — draft queries require auth. Pure unit test; repositories and the passport JWT path are mocked.
 *
 * @group security
 */
describe('QueryAuthGuard — public app released-version boundary', () => {
  const ORG_ID = 'org-1';
  const APP_ID = 'app-1';
  const RELEASED_VERSION_ID = 'version-released';
  const QUERY_ID = 'query-1';

  let guard: QueryAuthGuard;
  let appRepository: { findByDataQuery: jest.Mock };
  let organizationRepository: { getSingleOrganizationWithId: jest.Mock; touchLastAccessedAt: jest.Mock };
  let dataQueryRepository: { isQueryInVersion: jest.Mock; findPublicParentAppForModuleQuery: jest.Mock };
  let transactionLogger: { log: jest.Mock };
  // super.canActivate() is passport's JWT guard; spied to simulate anonymous (rejects) vs authed (resolves).
  let jwtCanActivate: jest.SpyInstance;

  const contextFor = (user?: unknown, params: Record<string, string> = { id: QUERY_ID }): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ params, user }) }),
    }) as unknown as ExecutionContext;

  const publicApp = (overrides: Record<string, unknown> = {}) => ({
    id: APP_ID,
    organizationId: ORG_ID,
    isPublic: true,
    type: APP_TYPES.FRONT_END,
    currentVersionId: RELEASED_VERSION_ID,
    ...overrides,
  });

  beforeEach(() => {
    appRepository = { findByDataQuery: jest.fn() };
    organizationRepository = {
      getSingleOrganizationWithId: jest.fn().mockResolvedValue({ status: WORKSPACE_STATUS.ACTIVE }),
      touchLastAccessedAt: jest.fn(),
    };
    dataQueryRepository = { isQueryInVersion: jest.fn(), findPublicParentAppForModuleQuery: jest.fn() };
    transactionLogger = { log: jest.fn() };
    guard = new QueryAuthGuard(
      organizationRepository as any,
      appRepository as any,
      dataQueryRepository as any,
      transactionLogger as any
    );
    jwtCanActivate = jest
      .spyOn(Object.getPrototypeOf(QueryAuthGuard.prototype), 'canActivate')
      .mockRejectedValue(new UnauthorizedException());
  });

  afterEach(() => jest.restoreAllMocks());

  it('allows an anonymous run of a query that belongs to the released version', async () => {
    appRepository.findByDataQuery.mockResolvedValue(publicApp());
    dataQueryRepository.isQueryInVersion.mockResolvedValue(true);

    await expect(guard.canActivate(contextFor(/* anonymous */))).resolves.toBe(true);
    expect(dataQueryRepository.isQueryInVersion).toHaveBeenCalledWith(QUERY_ID, RELEASED_VERSION_ID);
    expect(organizationRepository.touchLastAccessedAt).toHaveBeenCalledWith(ORG_ID);
    expect(jwtCanActivate).not.toHaveBeenCalled();
  });

  it('rejects an anonymous run of a DRAFT query on a public app that has a different released version', async () => {
    appRepository.findByDataQuery.mockResolvedValue(publicApp());
    dataQueryRepository.isQueryInVersion.mockResolvedValue(false); // query not in current_version_id

    await expect(guard.canActivate(contextFor(/* anonymous */))).rejects.toMatchObject({
      response: { message: expect.stringContaining('App is not released yet') },
    });
    expect(organizationRepository.touchLastAccessedAt).not.toHaveBeenCalled();
  });

  it('rejects an anonymous run when the public app has no released version at all', async () => {
    appRepository.findByDataQuery.mockResolvedValue(publicApp({ currentVersionId: null }));

    await expect(guard.canActivate(contextFor(/* anonymous */))).rejects.toBeInstanceOf(UnauthorizedException);
    // Short-circuits on the null pointer; never needs the per-query lookup.
    expect(dataQueryRepository.isQueryInVersion).not.toHaveBeenCalled();
  });

  it('still allows an AUTHENTICATED builder to run a draft query (preview is preserved)', async () => {
    appRepository.findByDataQuery.mockResolvedValue(publicApp({ currentVersionId: null }));
    jwtCanActivate.mockResolvedValue(true); // valid session

    await expect(guard.canActivate(contextFor({ id: 'builder-user' }))).resolves.toBe(true);
    expect(jwtCanActivate).toHaveBeenCalled();
  });
});
