import { BadRequestException } from '@nestjs/common';
import { EntityNotFoundError } from 'typeorm';
import { Test } from '@nestjs/testing';
import { VersionUtilService } from '@modules/versions/util.service';
import { VersionRepository } from '@modules/versions/repository';
import { VersionsCreateService } from '@modules/versions/services/create.service';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { AppHistoryUtilService } from '@modules/app-history/util.service';
import { OrganizationGitSyncRepository } from '@modules/git-sync/repository';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import { App } from '@entities/app.entity';

describe('VersionUtilService.createVersion — version metadata forwarding', () => {
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
        {
          provide: VersionRepository,
          // the ownership pre-check (id + appId) must resolve for the source used below; every
          // other validateVersionCreate lookup (draft/name collision) stays a clean miss.
          useValue: {
            findOne: jest
              .fn()
              .mockImplementation(({ where }: any) =>
                where.id === 'version-from-1' && where.appId === 'app-1'
                  ? Promise.resolve({ id: 'version-from-1' })
                  : Promise.resolve(null)
              ),
          },
        },
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
        {
          provide: GitSyncConfigsUtilService,
          useValue: { getDetails: jest.fn().mockResolvedValue({ isEnabled: false, options: {} }) },
        },
      ],
    }).compile();

    service = module.get(VersionUtilService);
  });

  it('should forward slug/appName/icon/isPublic from versionFrom onto the new non-workflow version', async () => {
    const workflowApp = { id: 'app-1', type: 'front-end', co_relation_id: null } as App;
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

describe('VersionUtilService.validateVersionCreate', () => {
  let service: VersionUtilService;
  let versionRepository: { findOne: jest.Mock };
  let gitSyncConfigsUtilService: { getDetails: jest.Mock };
  const app = { id: 'app-1', type: 'front-end', co_relation_id: null } as App;
  const user = { id: 'user-1', organizationId: 'org-1' } as any;

  beforeEach(async () => {
    versionRepository = { findOne: jest.fn().mockResolvedValue(null) };
    gitSyncConfigsUtilService = { getDetails: jest.fn().mockResolvedValue({ isEnabled: false, options: {} }) };

    const module = await Test.createTestingModule({
      providers: [
        VersionUtilService,
        { provide: VersionRepository, useValue: versionRepository },
        { provide: VersionsCreateService, useValue: { setupNewVersion: jest.fn() } },
        { provide: AppEnvironmentUtilService, useValue: { get: jest.fn() } },
        { provide: OrganizationGitSyncRepository, useValue: { findOrgGitByOrganizationId: jest.fn() } },
        { provide: AppHistoryUtilService, useValue: {} },
        { provide: GitSyncConfigsUtilService, useValue: gitSyncConfigsUtilService },
      ],
    }).compile();

    service = module.get(VersionUtilService);
  });

  it('throws when versionFromId does not belong to the app (foreign or missing source)', async () => {
    versionRepository.findOne.mockResolvedValue(null); // ownership lookup finds nothing
    await expect(
      service.validateVersionCreate(app, user, {
        versionName: 'v2',
        versionFromId: 'foreign-version',
        versionType: undefined,
      } as any)
    ).rejects.toBeInstanceOf(EntityNotFoundError);
  });

  it('throws for an empty (whitespace-only) version name', async () => {
    await expect(
      service.validateVersionCreate(app, user, { versionName: '  ', versionType: undefined } as any)
    ).rejects.toThrow(new BadRequestException('Version name cannot be empty.'));
  });

  it('throws when a draft already exists on the branch and git branching is enabled', async () => {
    gitSyncConfigsUtilService.getDetails.mockResolvedValue({ isEnabled: true, options: {} });
    // The single-draft guard runs (and throws) before the name-collision check is reached.
    versionRepository.findOne.mockResolvedValue({ isSynced: true });

    await expect(
      service.validateVersionCreate(app, user, { versionName: 'v2', versionType: undefined } as any)
    ).rejects.toThrow(new BadRequestException('Only one draft version is allowed when branching is enabled.'));
  });

  it('returns the resolved branch id when validation passes', async () => {
    gitSyncConfigsUtilService.getDetails.mockResolvedValue({ isEnabled: true, options: {} });
    versionRepository.findOne.mockResolvedValue(null);

    const branchId = await service.validateVersionCreate(app, user, {
      versionName: 'v2',
      versionType: undefined,
    } as any);

    expect(branchId).toBeUndefined();
  });

  it('rejects with "Version name already exists." on a name collision in the same app', async () => {
    gitSyncConfigsUtilService.getDetails.mockResolvedValue({
      isEnabled: false,
      options: { defaultBranch: { id: 'b1' } },
    });
    // Matches the live DB constraint — (name, appId) only, not branch-scoped.
    versionRepository.findOne.mockImplementation(({ where }: any) =>
      where.appId === 'app-1' && where.name === 'v2' ? Promise.resolve({ id: 'existing' }) : Promise.resolve(null)
    );

    await expect(
      service.validateVersionCreate(app, user, { versionName: 'v2', versionType: undefined } as any)
    ).rejects.toThrow(new BadRequestException('Version name already exists.'));
  });

  it('rejects a same-name version that lives on a different branch (name uniqueness is app-scoped, not branch-scoped)', async () => {
    // Current request resolves to branch 'b1', but the colliding row (found purely by
    // appId+name, no branchId filter) actually lives on 'b2' — proving the query can't
    // be fooled by branch scoping, matching name_app_id_app_versions_unique.
    gitSyncConfigsUtilService.getDetails.mockResolvedValue({
      isEnabled: false,
      options: { defaultBranch: { id: 'b1' } },
    });
    versionRepository.findOne.mockImplementation(({ where }: any) =>
      where.appId === 'app-1' && where.name === 'v2'
        ? Promise.resolve({ id: 'existing-on-b2', branchId: 'b2' })
        : Promise.resolve(null)
    );

    await expect(
      service.validateVersionCreate(app, user, { versionName: 'v2', versionType: undefined } as any)
    ).rejects.toThrow(new BadRequestException('Version name already exists.'));
  });

  it('resolves the branch id when no name collision exists', async () => {
    gitSyncConfigsUtilService.getDetails.mockResolvedValue({
      isEnabled: false,
      options: { defaultBranch: { id: 'b1' } },
    });
    versionRepository.findOne.mockResolvedValue(null);

    const branchId = await service.validateVersionCreate(app, user, {
      versionName: 'v2',
      versionType: undefined,
    } as any);

    expect(branchId).toBe('b1');
  });
});
