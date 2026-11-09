// server/test/modules/folder-apps/unit/folder-apps-ability-guard.spec.ts
import { FeatureAbilityGuard } from '@modules/folder-apps/ability/guard';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { FolderApp } from '@entities/folder_app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '@modules/folder-apps/constants';
import { APP_TYPES } from '@modules/apps/constants';
import { makeExecutionContext } from 'test-helper';

/** @group platform */
describe('folder-apps FeatureAbilityGuard', () => {
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
    reflect(FEATURE_KEY.CREATE_FOLDER_APP);
  });

  afterEach(() => jest.restoreAllMocks());

  it('getSubjectType returns FolderApp', () => {
    expect((guard as any).getSubjectType()).toBe(FolderApp);
  });

  it('getResource lists FOLDER, WORKFLOW_FOLDER and MODULE_FOLDER', () => {
    expect((guard as any).getResource()).toEqual([
      { resourceType: MODULES.FOLDER },
      { resourceType: MODULES.WORKFLOW_FOLDER },
      { resourceType: MODULES.MODULE_FOLDER },
    ]);
  });

  it('resolves tj_resource_id from params.folderId, falling back to body.folder_id', async () => {
    const viaParams: any = { params: { folderId: 'f-1' }, body: {}, user: { id: 'u1', organizationId: 'org-1' } };
    await guard.canActivate(makeExecutionContext({ request: viaParams }));
    expect(viaParams.tj_resource_id).toBe('f-1');

    const viaBody: any = { params: {}, body: { folder_id: 'f-2' }, user: { id: 'u1', organizationId: 'org-1' } };
    await guard.canActivate(makeExecutionContext({ request: viaBody }));
    expect(viaBody.tj_resource_id).toBe('f-2');
  });

  it('scopes folder and app lookups to the requesting org for the single-app path', async () => {
    const folder = { id: 'f-1', createdBy: 'u1', type: APP_TYPES.FRONT_END };
    const app = { id: 'app-1', userId: 'u1', type: APP_TYPES.FRONT_END };
    dataSource.manager.findOne.mockResolvedValueOnce(folder).mockResolvedValueOnce(app);
    const request: any = {
      params: { folderId: 'f-1' },
      body: { app_id: 'app-1' },
      user: { id: 'u1', organizationId: 'org-1' },
    };

    await guard.canActivate(makeExecutionContext({ request }));

    expect(dataSource.manager.findOne).toHaveBeenNthCalledWith(1, expect.anything(), {
      where: { id: 'f-1', organizationId: 'org-1' },
      select: ['id', 'createdBy', 'type'],
    });
    expect(dataSource.manager.findOne).toHaveBeenNthCalledWith(2, expect.anything(), {
      where: { id: 'app-1', organizationId: 'org-1' },
      select: ['id', 'userId', 'type'],
    });
    expect(request.tj_allow_owner_folder_app_create).toBe(true);
    expect(request.tj_allow_owner_folder_app_delete).toBe(true);
    expect(request.tj_folder_app_type_mismatch).toBe(false);
  });

  it('denies create (but allows delete) when the folder is owned by the user but the app is not', async () => {
    dataSource.manager.findOne
      .mockResolvedValueOnce({ id: 'f-1', createdBy: 'u1', type: APP_TYPES.FRONT_END })
      .mockResolvedValueOnce({ id: 'app-1', userId: 'someone-else', type: APP_TYPES.FRONT_END });
    const request: any = {
      params: { folderId: 'f-1' },
      body: { app_id: 'app-1' },
      user: { id: 'u1', organizationId: 'org-1' },
    };

    await guard.canActivate(makeExecutionContext({ request }));

    expect(request.tj_allow_owner_folder_app_create).toBe(false);
    expect(request.tj_allow_owner_folder_app_delete).toBe(true);
  });

  it('flags a type mismatch between the folder and the app', async () => {
    dataSource.manager.findOne
      .mockResolvedValueOnce({ id: 'f-1', createdBy: 'u1', type: APP_TYPES.FRONT_END })
      .mockResolvedValueOnce({ id: 'app-1', userId: 'u1', type: APP_TYPES.MODULE });
    const request: any = {
      params: { folderId: 'f-1' },
      body: { app_id: 'app-1' },
      user: { id: 'u1', organizationId: 'org-1' },
    };

    await guard.canActivate(makeExecutionContext({ request }));

    expect(request.tj_folder_app_type_mismatch).toBe(true);
  });

  it('does not scope create/delete to a specific app on the bulk app_ids path — folder ownership alone is sufficient', async () => {
    dataSource.manager.findOne.mockResolvedValueOnce({ id: 'f-1', createdBy: 'u1', type: APP_TYPES.MODULE });
    const request: any = {
      params: { folderId: 'f-1' },
      body: { app_ids: ['app-1', 'app-2'] },
      user: { id: 'u1', organizationId: 'org-1' },
    };

    await guard.canActivate(makeExecutionContext({ request }));

    expect(dataSource.manager.findOne).toHaveBeenCalledTimes(1);
    expect(request.tj_allow_owner_folder_app_create).toBe(true);
  });

  it('does not flag ownership when the folder is not found in the requesting org (cross-tenant)', async () => {
    dataSource.manager.findOne.mockResolvedValueOnce(null);
    const request: any = {
      params: { folderId: 'other-org-folder' },
      body: { app_ids: ['app-1'] },
      user: { id: 'u1', organizationId: 'org-1' },
    };

    await guard.canActivate(makeExecutionContext({ request }));

    expect(request.tj_allow_owner_folder_app_create).toBe(false);
  });

  it('skips all DB lookups for a non-mutating feature', async () => {
    reflect(FEATURE_KEY.GET_FOLDERS);
    const request: any = {
      params: { folderId: 'f-1' },
      body: { app_id: 'app-1' },
      user: { id: 'u1', organizationId: 'org-1' },
    };

    await guard.canActivate(makeExecutionContext({ request }));

    expect(dataSource.manager.findOne).not.toHaveBeenCalled();
  });

  it('skips all DB lookups when there is no user', async () => {
    const request: any = { params: { folderId: 'f-1' }, body: { app_id: 'app-1' }, user: undefined };

    await guard.canActivate(makeExecutionContext({ request }));

    expect(dataSource.manager.findOne).not.toHaveBeenCalled();
  });

  it('always delegates the actual authorization decision to the base guard', async () => {
    const request: any = { params: { folderId: 'f-1' }, body: {}, user: { id: 'u1', organizationId: 'org-1' } };
    const ctx = makeExecutionContext({ request });

    const result = await guard.canActivate(ctx);

    expect(superCanActivate).toHaveBeenCalledWith(ctx);
    expect(result).toBe(true);
  });
});
