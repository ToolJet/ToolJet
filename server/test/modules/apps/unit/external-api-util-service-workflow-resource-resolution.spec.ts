import { Test } from '@nestjs/testing';
import { ExternalApiUtilService } from '@ee/external-apis/util.service';
import { RolesUtilService } from '@ee/roles/util.service';
import { RolesRepository } from '@modules/roles/repository';
import { AppsUtilService } from '@ee/apps/util.service';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { SessionUtilService } from '@ee/session/util.service';
import { GranularPermissionsUtilService } from '@ee/group-permissions/util-services/granular-permissions.util.service';
import { LicenseUserService } from '@ee/licensing/services/user.service';
import { UserDetailsService } from '@ee/organization-users/services/user-details.service';
import { GranularPermissionResourceType } from '@modules/external-apis/dto';
import { AppBase } from '@entities/app_base.entity';

describe('ExternalApiUtilService.validateResourcesExist — workflow name resolution', () => {
  let service: ExternalApiUtilService;
  let mockManager: any;

  beforeEach(async () => {
    mockManager = {
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ id: 'workflow-1', name: 'My Workflow' }]),
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        ExternalApiUtilService,
        { provide: RolesUtilService, useValue: {} },
        { provide: RolesRepository, useValue: {} },
        { provide: AppsUtilService, useValue: {} },
        { provide: GroupPermissionsRepository, useValue: {} },
        { provide: SessionUtilService, useValue: {} },
        { provide: GranularPermissionsUtilService, useValue: {} },
        { provide: LicenseUserService, useValue: {} },
        { provide: UserDetailsService, useValue: {} },
      ],
    }).compile();

    service = module.get(ExternalApiUtilService);
  });

  it('should resolve a workflow by name via a JOIN on app_versions, not raw apps.name', async () => {
    const result = await service.validateResourcesExist(
      'workspace-1',
      ['My Workflow'],
      GranularPermissionResourceType.WORKFLOW,
      mockManager
    );

    expect(result).toEqual(['workflow-1']);
    // The name-lookup path must JOIN app_versions -- a plain manager.find({name: In([...])})
    // against AppBase can never match since apps.name is always null for workflows.
    expect(mockManager.createQueryBuilder).toHaveBeenCalledWith(AppBase, 'app');
  });
});
