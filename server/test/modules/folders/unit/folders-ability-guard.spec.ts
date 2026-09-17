// server/test/modules/folders/unit/folders-ability-guard.spec.ts
import { FeatureAbilityGuard } from '@modules/folders/ability/guard';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { Folder } from '@entities/folder.entity';
import { FEATURE_KEY } from '@modules/folders/constants';
import { makeExecutionContext } from 'test-helper';

/** @group platform */
describe('folders FeatureAbilityGuard', () => {
  let guard: FeatureAbilityGuard;
  let reflector: { get: jest.Mock };
  let dataSource: { manager: { findOne: jest.Mock } };
  let superCanActivate: jest.SpyInstance;

  const reflect = (features: string | string[]) => reflector.get.mockReturnValue(features);

  beforeEach(() => {
    reflector = { get: jest.fn() };
    dataSource = { manager: { findOne: jest.fn().mockResolvedValue(null) } };
    guard = new FeatureAbilityGuard(reflector as any, null as any, null as any, null as any, dataSource as any);
    superCanActivate = jest.spyOn(AbilityGuard.prototype, 'canActivate').mockResolvedValue(true);
  });

  afterEach(() => jest.restoreAllMocks());

  it('getSubjectType returns Folder', () => {
    expect((guard as any).getSubjectType()).toBe(Folder);
  });

  it('sets tj_folder_type from the request body on create', async () => {
    reflect(FEATURE_KEY.CREATE_FOLDER);
    const request: any = { params: {}, body: { type: 'workflow-folder' }, user: { id: 'u1', organizationId: 'org-1' } };

    await guard.canActivate(makeExecutionContext({ request }));

    expect(request.tj_folder_type).toBe('workflow-folder');
    expect(dataSource.manager.findOne).not.toHaveBeenCalled();
  });

  it('scopes the folder lookup to the requesting org and flags owner-managed folders on update', async () => {
    const folder = { id: 'folder-1', createdBy: 'u1', type: 'default' };
    dataSource.manager.findOne.mockResolvedValue(folder);
    reflect(FEATURE_KEY.UPDATE_FOLDER);
    const request: any = { params: { id: 'folder-1' }, user: { id: 'u1', organizationId: 'org-1' } };

    await guard.canActivate(makeExecutionContext({ request }));

    expect(dataSource.manager.findOne).toHaveBeenCalledWith(Folder, {
      where: { id: 'folder-1', organizationId: 'org-1' },
      select: ['id', 'createdBy', 'type'],
    });
    expect(request.tj_resource_id).toBe('folder-1');
    expect(request.tj_allow_owner_folder_manage).toBe(true);
    expect(request.tj_folder_type).toBe('default');
  });

  it('does not flag owner-managed when the folder belongs to a different user', async () => {
    dataSource.manager.findOne.mockResolvedValue({ id: 'folder-1', createdBy: 'someone-else', type: 'default' });
    reflect(FEATURE_KEY.DELETE_FOLDER);
    const request: any = { params: { id: 'folder-1' }, user: { id: 'u1', organizationId: 'org-1' } };

    await guard.canActivate(makeExecutionContext({ request }));

    expect(request.tj_allow_owner_folder_manage).toBe(false);
  });

  it('does not flag owner-managed when the folder is not found in the requesting org (cross-tenant)', async () => {
    // findOne is scoped to organizationId — a folder id belonging to another org never matches.
    dataSource.manager.findOne.mockResolvedValue(null);
    reflect(FEATURE_KEY.UPDATE_FOLDER);
    const request: any = { params: { id: 'other-org-folder' }, user: { id: 'u1', organizationId: 'org-1' } };

    await guard.canActivate(makeExecutionContext({ request }));

    expect(request.tj_allow_owner_folder_manage).toBe(false);
    expect(request.tj_folder_type).toBeUndefined();
  });

  it('skips the ownership lookup entirely when there is no user', async () => {
    reflect(FEATURE_KEY.UPDATE_FOLDER);
    const request: any = { params: { id: 'folder-1' }, user: undefined };

    await guard.canActivate(makeExecutionContext({ request }));

    expect(dataSource.manager.findOne).not.toHaveBeenCalled();
    expect(request.tj_resource_id).toBeUndefined();
  });

  it('always delegates the actual authorization decision to the base guard', async () => {
    reflect(FEATURE_KEY.UPDATE_FOLDER);
    const request: any = { params: { id: 'folder-1' }, user: { id: 'u1', organizationId: 'org-1' } };
    const ctx = makeExecutionContext({ request });

    const result = await guard.canActivate(ctx);

    expect(superCanActivate).toHaveBeenCalledWith(ctx);
    expect(result).toBe(true);
  });
});
