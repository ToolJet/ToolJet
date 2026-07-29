import { Test } from '@nestjs/testing';
import { PlatformGitPullService } from '@ee/platform-git-sync/pull.service';
import { GitSyncAdapter } from '@ee/git-sync/git-sync-adapter';
import { WorkspaceGitSyncAdapter } from '@ee/git-sync/workspace-git-sync-adapter';
import { ImportExportResourcesService } from '@ee/import-export-resources/service';
import { HTTPSGitSyncUtilityService } from '@ee/git-sync/providers/github-https/util.service';
import { OrganizationGitSyncRepository } from '@modules/git-sync/repository';
import { GitObjectCacheService } from '@ee/git-sync-configs/services/git-object-cache.service';
import { FoldersUtilService } from '@ee/folders/util.service';
import { FolderAppsUtilService } from '@ee/folder-apps/util.service';
import { AppsUtilService } from '@ee/apps/util.service';
import { GitOperationsUtil } from '@ee/app-git/shared/git-operations.util';
import { TransactionLogger } from '@modules/logging/service';
import { GitSyncConfigsUtilService } from '@ee/git-sync-configs/util.service';
import { App } from '@entities/app.entity';
import { AppVersion } from '@entities/app_version.entity';

describe('PlatformGitPullService.applyGitMetadataToStubApp — workflow support', () => {
  let service: PlatformGitPullService;
  let mockManager: any;

  beforeEach(async () => {
    mockManager = {
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
        PlatformGitPullService,
        { provide: GitSyncAdapter, useValue: {} },
        { provide: WorkspaceGitSyncAdapter, useValue: {} },
        { provide: ImportExportResourcesService, useValue: {} },
        { provide: HTTPSGitSyncUtilityService, useValue: {} },
        { provide: OrganizationGitSyncRepository, useValue: {} },
        { provide: FoldersUtilService, useValue: {} },
        { provide: FolderAppsUtilService, useValue: {} },
        { provide: GitOperationsUtil, useValue: {} },
        { provide: TransactionLogger, useValue: {} },
        { provide: AppsUtilService, useValue: {} },
        { provide: GitSyncConfigsUtilService, useValue: {} },
        { provide: GitObjectCacheService, useValue: {} },
      ],
    }).compile();

    service = module.get(PlatformGitPullService);
  });

  it('should write name/slug/icon/isPublic to app_versions (not apps) for a workflow stub', async () => {
    const stubApp = { id: 'app-1', type: 'workflow' } as App;
    const gitAppData = { name: 'Git Workflow Name', slug: 'git-workflow-slug', icon: 'git-icon.svg', isPublic: true };

    await (service as any).applyGitMetadataToStubApp(mockManager, stubApp, gitAppData, 'draft-version-1');

    const versionUpdateCall = mockManager.update.mock.calls.find((call: any[]) => call[0] === AppVersion);
    expect(versionUpdateCall).toBeDefined();
    expect(versionUpdateCall[1]).toEqual({ id: 'draft-version-1' });
    expect(versionUpdateCall[2]).toMatchObject({
      appName: 'Git Workflow Name',
      slug: 'git-workflow-slug',
      icon: 'git-icon.svg',
      isPublic: true,
    });

    const appUpdateCall = mockManager.update.mock.calls.find((call: any[]) => call[0] === App);
    expect(appUpdateCall).toBeDefined();
    // Only isMaintenanceOn/type ever go to apps.* — no name/slug/icon/isPublic leak through.
    expect(appUpdateCall[2]).not.toHaveProperty('icon');
    expect(appUpdateCall[2]).not.toHaveProperty('isPublic');
    expect(appUpdateCall[2]).not.toHaveProperty('slug');
    expect(appUpdateCall[2]).not.toHaveProperty('name');
  });
});
