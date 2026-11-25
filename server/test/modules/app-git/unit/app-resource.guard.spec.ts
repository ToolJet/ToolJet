import 'reflect-metadata';
import { ExecutionContext, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { AppsRepository } from '@modules/apps/repository';
import { VersionRepository } from '@modules/versions/repository';
import { AppResourceGuard } from '@modules/app-git/guards/app-resource.guard';

// Tenant isolation: the guard must refuse any app-git request whose target workspace,
// version or app does not belong to the caller's active workspace (user.organizationId).

const CALLER_ORG = 'org-caller';
const FOREIGN_ORG = 'org-foreign';
const APP_ID = 'app-1';
const VERSION_ID = 'version-1';

function makeContext(params: Record<string, string>): ExecutionContext {
  const user = Object.assign(new User(), { organizationId: CALLER_ORG });
  const request: Record<string, unknown> = { params, user };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function makeGuard(overrides: { findById?: jest.Mock; getAppVersionById?: jest.Mock }): AppResourceGuard {
  const appRepository = { findById: overrides.findById ?? jest.fn() } as unknown as AppsRepository;
  const versionRepository = {
    getAppVersionById: overrides.getAppVersionById ?? jest.fn(),
  } as unknown as VersionRepository;
  return new AppResourceGuard(appRepository, versionRepository);
}

function appOwnedBy(organizationId: string): App {
  return Object.assign(new App(), { id: APP_ID, organizationId });
}

describe('AppResourceGuard | tenant isolation', () => {
  it('should reject with 400 when neither appId nor versionId is provided', async () => {
    const guard = makeGuard({});
    await expect(guard.canActivate(makeContext({}))).rejects.toThrow(BadRequestException);
  });

  describe('route :organizationId (configs / branches / pull-requests routes)', () => {
    it("should forbid a route organizationId that is not the caller's workspace, before loading git settings", async () => {
      // The caller passes their OWN version id but a FOREIGN workspace in the route —
      // the exact shape that leaked another workspace's git config in the field report.
      const getAppVersionById = jest.fn().mockResolvedValue({ app: appOwnedBy(CALLER_ORG) });
      const guard = makeGuard({ getAppVersionById });

      await expect(
        guard.canActivate(makeContext({ organizationId: FOREIGN_ORG, versionId: VERSION_ID }))
      ).rejects.toThrow(ForbiddenException);
      // The git settings for the route workspace must never be reached.
      expect(getAppVersionById).not.toHaveBeenCalled();
    });

    it("should allow a route organizationId equal to the caller's workspace", async () => {
      const getAppVersionById = jest.fn().mockResolvedValue({ app: appOwnedBy(CALLER_ORG) });
      const guard = makeGuard({ getAppVersionById });

      await expect(guard.canActivate(makeContext({ organizationId: CALLER_ORG, versionId: VERSION_ID }))).resolves.toBe(
        true
      );
    });
  });

  describe(':versionId path (loads by id with no workspace filter)', () => {
    it('should reject a version whose app belongs to another workspace', async () => {
      const getAppVersionById = jest.fn().mockResolvedValue({ app: appOwnedBy(FOREIGN_ORG) });
      const guard = makeGuard({ getAppVersionById });

      await expect(guard.canActivate(makeContext({ versionId: VERSION_ID }))).rejects.toThrow(NotFoundException);
    });

    it("should accept a version whose app belongs to the caller's workspace", async () => {
      const getAppVersionById = jest.fn().mockResolvedValue({ app: appOwnedBy(CALLER_ORG) });
      const guard = makeGuard({ getAppVersionById });

      await expect(guard.canActivate(makeContext({ versionId: VERSION_ID }))).resolves.toBe(true);
    });
  });

  describe(':appId path (validate-push / check-tag / app routes)', () => {
    it('should reject when the workspace-scoped lookup finds no app', async () => {
      // findById filters by user.organizationId, so a foreign app resolves to null.
      const findById = jest.fn().mockResolvedValue(null);
      const guard = makeGuard({ findById });

      await expect(guard.canActivate(makeContext({ appId: APP_ID }))).rejects.toThrow(NotFoundException);
      expect(findById).toHaveBeenCalledWith(APP_ID, CALLER_ORG, undefined, undefined);
    });

    it("should accept an app in the caller's workspace", async () => {
      const findById = jest.fn().mockResolvedValue(appOwnedBy(CALLER_ORG));
      const guard = makeGuard({ findById });

      await expect(guard.canActivate(makeContext({ appId: APP_ID }))).resolves.toBe(true);
    });
  });
});
