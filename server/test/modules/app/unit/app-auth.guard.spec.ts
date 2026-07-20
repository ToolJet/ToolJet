// server/test/modules/app/unit/app-auth.guard.spec.ts
import { NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { AppAuthGuard } from '@modules/apps/guards/app-auth.guard';
import { WORKSPACE_STATUS } from '@modules/users/constants/lifecycle';

/** @group platform */
describe('AppAuthGuard', () => {
  let guard: AppAuthGuard;
  let mockAppRepository: { findAppBySlug: jest.Mock };
  let mockOrgRepository: { findOne: jest.Mock; touchLastAccessedAt: jest.Mock };
  let mockAppUtilService: { getAppOrganizationDetails: jest.Mock };

  const makeContext = (slug: string): ExecutionContext => {
    const request: Record<string, any> = { params: { slug }, headers: {} };
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
    mockAppRepository = { findAppBySlug: jest.fn() };
    mockOrgRepository = { findOne: jest.fn(), touchLastAccessedAt: jest.fn() };
    mockAppUtilService = { getAppOrganizationDetails: jest.fn() };
    guard = new AppAuthGuard(
      mockAppUtilService as any,
      mockOrgRepository as any,
      mockAppRepository as any
    );
  });

  afterEach(() => jest.clearAllMocks());

  describe('when slug is missing', () => {
    it('throws NotFoundException', async () => {
      const ctx = makeContext('');
      // override: empty slug → guard throws before repo call
      await expect(guard.canActivate(ctx)).rejects.toThrow(NotFoundException);
    });
  });

  describe('when app is not found', () => {
    it('throws NotFoundException', async () => {
      mockAppRepository.findAppBySlug.mockResolvedValue(null);

      await expect(guard.canActivate(makeContext('unknown-slug'))).rejects.toThrow(NotFoundException);
    });
  });

  describe('when workspace is archived', () => {
    it('throws BadRequestException', async () => {
      mockAppRepository.findAppBySlug.mockResolvedValue(makeApp());
      mockOrgRepository.findOne.mockResolvedValue(makeOrg({ status: WORKSPACE_STATUS.ARCHIVED }));

      await expect(guard.canActivate(makeContext('my-app'))).rejects.toThrow(BadRequestException);
    });
  });

  describe('when app.isPublic is true', () => {
    it('returns true without invoking JWT auth', async () => {
      const app = makeApp({ isPublic: true });
      mockAppRepository.findAppBySlug.mockResolvedValue(app);
      mockOrgRepository.findOne.mockResolvedValue(makeOrg());
      const parentSpy = jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
        .mockResolvedValue(true);

      const result = await guard.canActivate(makeContext('my-app'));

      expect(result).toBe(true);
      expect(parentSpy).not.toHaveBeenCalled();
    });

    it('calls touchLastAccessedAt on the org', async () => {
      const app = makeApp({ isPublic: true });
      mockAppRepository.findAppBySlug.mockResolvedValue(app);
      mockOrgRepository.findOne.mockResolvedValue(makeOrg());

      await guard.canActivate(makeContext('my-app'));

      expect(mockOrgRepository.touchLastAccessedAt).toHaveBeenCalledWith('org-uuid-1');
    });

  });

  describe('when app.isPublic is false', () => {
    it('does NOT call touchLastAccessedAt', async () => {
      mockAppRepository.findAppBySlug.mockResolvedValue(makeApp({ isPublic: false }));
      mockOrgRepository.findOne.mockResolvedValue(makeOrg());
      jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
        .mockResolvedValue(true);

      await guard.canActivate(makeContext('my-app'));

      expect(mockOrgRepository.touchLastAccessedAt).not.toHaveBeenCalled();
    });
  });

  describe('when app.isPublic is false and JWT auth fails', () => {
    it('throws UnauthorizedException with organizationId in message', async () => {
      mockAppRepository.findAppBySlug.mockResolvedValue(makeApp({ isPublic: false }));
      mockOrgRepository.findOne.mockResolvedValue(makeOrg());
      mockAppUtilService.getAppOrganizationDetails.mockResolvedValue({ slug: 'my-workspace' });
      jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
        .mockRejectedValue(new UnauthorizedException());

      let caught: UnauthorizedException | undefined;
      try {
        await guard.canActivate(makeContext('my-app'));
      } catch (e: any) {
        caught = e;
      }

      expect(caught).toBeInstanceOf(UnauthorizedException);
      const parsed = JSON.parse((caught as any).message);
      expect(parsed.organizationId).toBe('my-workspace');
    });
  });
});
