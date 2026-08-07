import { Test } from '@nestjs/testing';
import { AppsUtilService } from '@modules/apps/util.service';
import { AppsRepository } from '@modules/apps/repository';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { VersionRepository } from '@modules/versions/repository';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { OrganizationRepository } from '@modules/organizations/repository';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import { App } from '@entities/app.entity';
import { AppVersion } from '@entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';

describe('AppsUtilService.update — versionParams/appParams construction', () => {
  let service: AppsUtilService;
  let mockManager: any;

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn().mockImplementation((entity) => {
        // No default branch (git-sync off) -> isGitEnabled = false throughout.
        if (entity === WorkspaceBranch) return Promise.resolve(null);
        return Promise.resolve(null);
      }),
      createQueryBuilder: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        AppsUtilService,
        { provide: AppsRepository, useValue: {} },
        { provide: AppEnvironmentUtilService, useValue: {} },
        { provide: VersionRepository, useValue: {} },
        { provide: LicenseTermsService, useValue: {} },
        { provide: OrganizationRepository, useValue: {} },
        { provide: AbilityService, useValue: {} },
        // Not part of the brief's original provider list -- AppsUtilService's constructor
        // also takes GitSyncConfigsUtilService, and the fixed `update` unconditionally
        // calls getDetails() once versionParams is non-empty for every app type. Without
        // this provider, module.compile() fails DI resolution before the test body runs.
        // Mocked as git-sync-off with a resolved default branch, matching the "no default
        // branch" comment above (findOne(WorkspaceBranch) is bypassed here since this
        // service is mocked directly rather than exercising the real one).
        {
          provide: GitSyncConfigsUtilService,
          useValue: {
            getDetails: jest.fn().mockResolvedValue({
              isEnabled: false,
              options: { defaultBranch: { id: 'default-branch-1', name: 'main' } },
            }),
          },
        },
      ],
    }).compile();

    service = module.get(AppsUtilService);
  });

  it('should write slug/appName/icon/isPublic to app_versions (not apps) for a workflow update', async () => {
    const workflowApp = {
      id: 'app-1',
      type: 'workflow',
      currentVersionId: null,
    } as App;

    await service.update(
      workflowApp,
      { slug: 'new-slug', name: 'New Name', icon: 'new-icon.svg', is_public: true } as any,
      'org-1',
      mockManager
    );

    const appVersionUpdateCall = mockManager.update.mock.calls.find((call: any[]) => call[0] === AppVersion);
    expect(appVersionUpdateCall).toBeDefined();
    expect(appVersionUpdateCall[2]).toMatchObject({
      slug: 'new-slug',
      appName: 'New Name',
      icon: 'new-icon.svg',
      isPublic: true,
    });

    const appUpdateCall = mockManager.update.mock.calls.find((call: any[]) => call[0] === App);
    // appParams should be empty (only isMaintenanceOn/currentVersionId/appBuilderMode,
    // all undefined here) -- cleanObject strips them, so no App update fires.
    expect(appUpdateCall).toBeUndefined();
  });
});
