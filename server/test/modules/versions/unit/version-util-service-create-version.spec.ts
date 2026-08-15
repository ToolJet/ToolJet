import { Test } from '@nestjs/testing';
import { VersionUtilService } from '@modules/versions/util.service';
import { VersionRepository } from '@modules/versions/repository';
import { VersionsCreateService } from '@modules/versions/services/create.service';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { AppHistoryUtilService } from '@modules/app-history/util.service';
import { OrganizationGitSyncRepository } from '@modules/git-sync/repository';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import { AppVersion } from '@entities/app_version.entity';
import { App } from '@entities/app.entity';

describe('VersionUtilService.createVersion — workflow metadata forwarding', () => {
  let service: VersionUtilService;
  let mockManager: any;
  let savedAppVersion: any;

  beforeEach(async () => {
    savedAppVersion = null;
    mockManager = {
      findOneOrFail: jest.fn().mockResolvedValue({
        id: 'version-from-1',
        appId: 'app-1',
        slug: 'my-workflow',
        appName: 'My Workflow',
        icon: 'icon.svg',
        isPublic: true,
        definition: {},
      }),
      save: jest.fn().mockImplementation((_entity, data) => {
        savedAppVersion = data;
        return Promise.resolve(data);
      }),
      create: jest.fn().mockImplementation((_entity, data) => data),
      query: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        VersionUtilService,
        { provide: VersionRepository, useValue: { findOne: jest.fn().mockResolvedValue(null) } },
        {
          provide: VersionsCreateService,
          useValue: { setupNewVersion: jest.fn().mockResolvedValue(undefined) },
        },
        { provide: AppEnvironmentUtilService, useValue: { get: jest.fn().mockResolvedValue({ id: 'env-1' }) } },
        {
          provide: OrganizationGitSyncRepository,
          useValue: { findOrgGitByOrganizationId: jest.fn().mockResolvedValue(null) },
        },
        { provide: AppHistoryUtilService, useValue: {} },
        { provide: GitSyncConfigsUtilService, useValue: {} },
      ],
    }).compile();

    service = module.get(VersionUtilService);
  });

  it('should forward slug/appName/icon/isPublic from versionFrom onto the new workflow version', async () => {
    const workflowApp = { id: 'app-1', type: 'workflow', co_relation_id: null } as App;
    const user = { id: 'user-1', organizationId: 'org-1' } as any;

    // dbTransactionWrap calls the operation with the manager directly when one isn't
    // passed through here -- pass mockManager as the 4th arg to skip the real wrapper.
    await service.createVersion(
      workflowApp,
      user,
      { versionName: 'v2', versionFromId: 'version-from-1', versionDescription: null, versionType: undefined } as any,
      mockManager
    );

    expect(savedAppVersion).toMatchObject({
      slug: 'my-workflow',
      appName: 'My Workflow',
      icon: 'icon.svg',
      isPublic: true,
    });
  });
});
