import { Test } from '@nestjs/testing';
import { GranularPermissionsService } from '@modules/group-permissions/services/granular-permissions.service';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { GranularPermissionsUtilService } from '@modules/group-permissions/util-services/granular-permissions.util.service';
import { LicenseUserService } from '@modules/licensing/services/user.service';
import { GroupPermissionLicenseUtilService } from '@modules/group-permissions/util-services/license.util.service';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';

describe('GranularPermissionsService.overlayGranularPermissionAppMetadata — workflow support', () => {
  let service: GranularPermissionsService;
  let mockManager: any;

  beforeEach(async () => {
    mockManager = {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            app_id: 'workflow-1',
            app_name: 'Real Workflow Name',
            slug: 'real-workflow-slug',
            icon: 'real-icon.svg',
            is_public: true,
          },
        ]),
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        GranularPermissionsService,
        { provide: GroupPermissionsRepository, useValue: {} },
        { provide: GranularPermissionsUtilService, useValue: {} },
        { provide: LicenseUserService, useValue: {} },
        { provide: GroupPermissionLicenseUtilService, useValue: {} },
        {
          provide: GitSyncConfigsUtilService,
          useValue: { getDetails: jest.fn().mockResolvedValue({ options: { defaultBranch: null } }) },
        },
      ],
    }).compile();

    service = module.get(GranularPermissionsService);
  });

  it('should overlay real name/slug/icon/isPublic onto a workflow app nested under a granular permission', async () => {
    const workflowApp: any = { id: 'workflow-1', type: 'workflow', name: null, slug: 'workflow-1', icon: null, isPublic: false };
    const permissions: any[] = [{ appsGroupPermissions: { groupApps: [{ app: workflowApp }] } }];

    await (service as any).overlayGranularPermissionAppMetadata(mockManager, permissions, 'org-1');

    expect(workflowApp.name).toBe('Real Workflow Name');
    expect(workflowApp.slug).toBe('real-workflow-slug');
    expect(workflowApp.icon).toBe('real-icon.svg');
    expect(workflowApp.isPublic).toBe(true);
  });
});
