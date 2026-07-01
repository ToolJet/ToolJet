// server/test/modules/app/unit/private-app-auth.guard.spec.ts
import { NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { PrivateAppAuthGuard } from '@modules/apps/guards/private-app-auth.guard';
import { WORKSPACE_STATUS } from '@modules/users/constants/lifecycle';

/** @group platform */
describe('PrivateAppAuthGuard', () => {
  let guard: PrivateAppAuthGuard;
  let mockAppRepository: {
    findBySlug: jest.Mock;
    findAppBySlug: jest.Mock;
    findByAppId: jest.Mock;
  };
  let mockOrgRepository: { findOne: jest.Mock };
  let mockAppUtilService: object;

  const makeContext = (
    slug: string,
    headers: Record<string, string> = {}
  ): ExecutionContext => {
    const request: Record<string, any> = { params: { slug }, headers: { ...headers } };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  };

  const makeApp = (overrides = {}) => ({
    id: 'app-uuid-1',
    slug: 'my-app',
    isPublic: false,
    organizationId: 'org-uuid-1',
    ...overrides,
  });

  const makeOrg = (overrides = {}) => ({
    id: 'org-uuid-1',
    status: WORKSPACE_STATUS.ACTIVE,
    ...overrides,
  });

  beforeEach(() => {
    mockAppRepository = {
      findBySlug: jest.fn(),
      findAppBySlug: jest.fn(),
      findByAppId: jest.fn(),
    };
    mockOrgRepository = { findOne: jest.fn() };
    mockAppUtilService = {};
    guard = new PrivateAppAuthGuard(
      mockAppUtilService as any,
      mockOrgRepository as any,
      mockAppRepository as any
    );
    // Default: JWT passes
    jest
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
      .mockResolvedValue(true);
  });

  afterEach(() => jest.clearAllMocks());

  describe('slug missing', () => {
    it('throws NotFoundException before any repo call', async () => {
      const ctx = makeContext('');
      await expect(guard.canActivate(ctx)).rejects.toThrow(NotFoundException);
      expect(mockAppRepository.findBySlug).not.toHaveBeenCalled();
      expect(mockAppRepository.findAppBySlug).not.toHaveBeenCalled();
    });
  });

  describe('workspace-scoped lookup (tj-workspace-id present)', () => {
    it('resolves via findBySlug and skips findAppBySlug entirely', async () => {
      const app = makeApp();
      mockAppRepository.findBySlug.mockResolvedValue(app);
      mockOrgRepository.findOne.mockResolvedValue(makeOrg());

      const ctx = makeContext('my-app', { 'tj-workspace-id': 'org-uuid-1' });
      await guard.canActivate(ctx);

      expect(mockAppRepository.findBySlug).toHaveBeenCalledWith('my-app', 'org-uuid-1', undefined, undefined);
      expect(mockAppRepository.findAppBySlug).not.toHaveBeenCalled();
    });

    it('forwards x-branch-id to findBySlug when present', async () => {
      const app = makeApp();
      mockAppRepository.findBySlug.mockResolvedValue(app);
      mockOrgRepository.findOne.mockResolvedValue(makeOrg());

      const ctx = makeContext('my-app', {
        'tj-workspace-id': 'org-uuid-1',
        'x-branch-id': 'branch-uuid-1',
      });
      await guard.canActivate(ctx);

      expect(mockAppRepository.findBySlug).toHaveBeenCalledWith('my-app', 'org-uuid-1', undefined, 'branch-uuid-1');
      expect(mockAppRepository.findAppBySlug).not.toHaveBeenCalled();
    });

    // Security: when the workspace-scoped lookup misses (slug exists only on a
    // feature branch but no branchId was sent, or slug doesn't exist in this org),
    // the guard must NOT fall through to the cross-org findAppBySlug. Doing so
    // could return a different org's app and overwrite the workspace header with a
    // foreign org ID before JWT validation.
    it('does NOT call findAppBySlug when workspaceId is present but scoped lookup returns null', async () => {
      mockAppRepository.findBySlug.mockResolvedValue(null);
      mockAppRepository.findByAppId.mockResolvedValue(null);

      const ctx = makeContext('my-app', { 'tj-workspace-id': 'org-uuid-1' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(NotFoundException);

      expect(mockAppRepository.findAppBySlug).not.toHaveBeenCalled();
    });

    it('falls through to findByAppId (UUID path) when scoped slug lookup misses', async () => {
      const app = makeApp();
      mockAppRepository.findBySlug.mockResolvedValue(null);
      mockAppRepository.findByAppId.mockResolvedValue(app);
      mockOrgRepository.findOne.mockResolvedValue(makeOrg());

      const ctx = makeContext('app-uuid-1', { 'tj-workspace-id': 'org-uuid-1' });
      await guard.canActivate(ctx);

      expect(mockAppRepository.findByAppId).toHaveBeenCalledWith('app-uuid-1');
    });
  });

  describe('cross-workspace lookup (tj-workspace-id absent)', () => {
    it('skips findBySlug and calls findAppBySlug directly', async () => {
      const app = makeApp();
      mockAppRepository.findAppBySlug.mockResolvedValue(app);
      mockOrgRepository.findOne.mockResolvedValue(makeOrg());

      const ctx = makeContext('my-app');
      await guard.canActivate(ctx);

      expect(mockAppRepository.findBySlug).not.toHaveBeenCalled();
      expect(mockAppRepository.findAppBySlug).toHaveBeenCalledWith('my-app');
    });

    it('falls through to findByAppId when findAppBySlug also misses', async () => {
      const app = makeApp();
      mockAppRepository.findAppBySlug.mockResolvedValue(null);
      mockAppRepository.findByAppId.mockResolvedValue(app);
      mockOrgRepository.findOne.mockResolvedValue(makeOrg());

      const ctx = makeContext('app-uuid-1');
      await guard.canActivate(ctx);

      expect(mockAppRepository.findByAppId).toHaveBeenCalledWith('app-uuid-1');
    });

    it('throws NotFoundException when all three lookups miss', async () => {
      mockAppRepository.findAppBySlug.mockResolvedValue(null);
      mockAppRepository.findByAppId.mockResolvedValue(null);

      const ctx = makeContext('unknown');
      await expect(guard.canActivate(ctx)).rejects.toThrow(NotFoundException);
    });
  });

  describe('post-resolution behaviour', () => {
    it('overwrites tj-workspace-id header with the resolved app orgId before JWT validation', async () => {
      const app = makeApp({ organizationId: 'real-org-uuid' });
      mockAppRepository.findAppBySlug.mockResolvedValue(app);
      mockOrgRepository.findOne.mockResolvedValue(makeOrg({ id: 'real-org-uuid' }));

      const req: Record<string, any> = { params: { slug: 'my-app' }, headers: {} };
      const ctx = {
        switchToHttp: () => ({ getRequest: () => req }),
      } as unknown as ExecutionContext;

      await guard.canActivate(ctx);

      expect(req.headers['tj-workspace-id']).toBe('real-org-uuid');
    });

    it('throws BadRequestException when resolved org is archived', async () => {
      mockAppRepository.findAppBySlug.mockResolvedValue(makeApp());
      mockOrgRepository.findOne.mockResolvedValue(makeOrg({ status: WORKSPACE_STATUS.ARCHIVED }));

      await expect(guard.canActivate(makeContext('my-app'))).rejects.toThrow(BadRequestException);
    });

    it('throws UnauthorizedException when JWT validation fails', async () => {
      mockAppRepository.findAppBySlug.mockResolvedValue(makeApp());
      mockOrgRepository.findOne.mockResolvedValue(makeOrg());
      jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
        .mockRejectedValue(new UnauthorizedException());

      await expect(guard.canActivate(makeContext('my-app'))).rejects.toThrow(UnauthorizedException);
    });
  });
});
