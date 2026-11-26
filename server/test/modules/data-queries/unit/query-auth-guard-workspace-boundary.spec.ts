import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { QueryAuthGuard } from '@modules/data-queries/guards/query-auth.guard';
import { APP_TYPES } from '@modules/apps/constants';
import { WORKSPACE_STATUS } from '@modules/users/constants/lifecycle';

/**
 * A signed-in user may only run queries of an app in their own workspace, public app or not.
 * Pure unit test; repositories and the passport JWT path are mocked.
 *
 * @group security
 */
describe('QueryAuthGuard: workspace boundary', () => {
  const APP_WORKSPACE = 'workspace-b';
  const OTHER_WORKSPACE = 'workspace-a';

  let guard: QueryAuthGuard;
  let appRepository: { findByDataQuery: jest.Mock };
  let dataQueryRepository: { isQueryInVersion: jest.Mock; findPublicParentAppForModuleQuery: jest.Mock };

  const signedIn = (organizationId: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ params: { id: 'query-1' }, user: { id: 'user-1', organizationId } }),
      }),
    }) as unknown as ExecutionContext;

  const app = (overrides: Record<string, unknown> = {}) => ({
    id: 'app-1',
    organizationId: APP_WORKSPACE,
    isPublic: false,
    type: APP_TYPES.FRONT_END,
    currentVersionId: 'released-version',
    ...overrides,
  });

  beforeEach(() => {
    appRepository = { findByDataQuery: jest.fn() };
    dataQueryRepository = { isQueryInVersion: jest.fn(), findPublicParentAppForModuleQuery: jest.fn() };
    guard = new QueryAuthGuard(
      {
        getSingleOrganizationWithId: jest.fn().mockResolvedValue({ status: WORKSPACE_STATUS.ACTIVE }),
        touchLastAccessedAt: jest.fn(),
      } as any,
      appRepository as any,
      dataQueryRepository as any,
      { log: jest.fn() } as any
    );
    // The session is valid: passport's JWT guard resolves.
    jest.spyOn(Object.getPrototypeOf(QueryAuthGuard.prototype), 'canActivate').mockResolvedValue(true);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('private app', () => {
    beforeEach(() => appRepository.findByDataQuery.mockResolvedValue(app()));

    it('refuses a user of another workspace', async () => {
      await expect(guard.canActivate(signedIn(OTHER_WORKSPACE))).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lets a user of the same workspace run the query', async () => {
      await expect(guard.canActivate(signedIn(APP_WORKSPACE))).resolves.toBe(true);
    });
  });

  describe('draft query of a public app (not in the released version)', () => {
    beforeEach(() => {
      appRepository.findByDataQuery.mockResolvedValue(app({ isPublic: true }));
      dataQueryRepository.isQueryInVersion.mockResolvedValue(false);
    });

    it('refuses a user of another workspace', async () => {
      await expect(guard.canActivate(signedIn(OTHER_WORKSPACE))).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lets a user of the same workspace preview it', async () => {
      await expect(guard.canActivate(signedIn(APP_WORKSPACE))).resolves.toBe(true);
    });
  });
});
