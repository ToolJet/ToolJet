import { FolderAppsService } from 'src/modules/folder-apps/service';
import { MODULES } from 'src/modules/app/constants/modules';
import { APP_TYPES } from 'src/modules/apps/constants';
import { User } from 'src/entities/user.entity';
import { Folder } from 'src/entities/folder.entity';

// ---------------------------------------------------------------------------
// Regression coverage for the reported bug: a builder with ZERO module and
// module-folder granular permissions could still see every module folder
// (e.g. "mf1") in the folders tab.
//
// Root causes fixed in FolderAppsService.getFolders():
//  1. Folder-permission lookup was hardcoded to MODULES.FOLDER instead of
//     resolving MODULES.MODULE_FOLDER for module-type folders.
//  2. A stale `isModuleBuilderAccess` bypass forced isAllEditable=true on the
//     module app-permission object for ANY builder, unconditionally.
// ---------------------------------------------------------------------------

jest.mock('@helpers/database.helper', () => ({
  getConnectionInstance: () => ({ manager: {} }),
  dbTransactionWrap: (fn: any) => fn({}),
}));

function makeFolder(id: string, createdBy = 'other-user'): Folder {
  const folder = new Folder();
  (folder as any).id = id;
  (folder as any).createdBy = createdBy;
  return folder;
}

describe('FolderAppsService.getFolders — module folder permission gating', () => {
  const user = { id: 'builder-1', organizationId: 'org-1', roleGroup: undefined } as User;

  function buildService(userPermissions: any, folderApps: any[] = []) {
    const resourceActionsPermission = jest.fn().mockResolvedValue(userPermissions);
    const allFolders = jest.fn().mockResolvedValue([makeFolder('mf1')]);
    const findFolderAppsForFolders = jest.fn().mockResolvedValue(folderApps);
    const getDetails = jest.fn().mockResolvedValue({
      isEnabled: false,
      isMultiBranchingEnabled: false,
      options: { defaultBranch: { id: 'branch-1' } },
    });

    const service = new FolderAppsService(
      { resourceActionsPermission } as any,
      { allFolders } as any,
      { findFolderAppsForFolders } as any,
      { getDetails } as any
    );

    return { service, resourceActionsPermission, allFolders, findFolderAppsForFolders };
  }

  it('requests MODULE_FOLDER permissions (not the generic FOLDER bucket) for type=module', async () => {
    const { service, resourceActionsPermission } = buildService({
      isAdmin: false,
      isBuilder: true,
      [MODULES.MODULES]: { isAllEditable: false, editableAppsId: [], isAllViewable: false, viewableAppsId: [] },
      [MODULES.MODULE_FOLDER]: {
        isAllEditable: false,
        editableFoldersId: [],
        isAllViewable: false,
        viewableFoldersId: [],
        isAllEditApps: false,
        editAppsInFoldersId: [],
      },
    });

    await service.getFolders(user, { type: APP_TYPES.MODULE });

    const requestedResources = resourceActionsPermission.mock.calls[0][1].resources.map((r: any) => r.resource);
    expect(requestedResources).toContain(MODULES.MODULE_FOLDER);
    expect(requestedResources).not.toContain(MODULES.FOLDER);
  });

  it('does NOT force isAllEditable on the module app-permission object for a plain builder', async () => {
    const { service, findFolderAppsForFolders } = buildService({
      isAdmin: false,
      isBuilder: true,
      [MODULES.MODULES]: { isAllEditable: false, editableAppsId: [], isAllViewable: false, viewableAppsId: [] },
      [MODULES.MODULE_FOLDER]: {
        isAllEditable: false,
        editableFoldersId: [],
        isAllViewable: false,
        viewableFoldersId: [],
        isAllEditApps: false,
        editAppsInFoldersId: [],
      },
    });

    await service.getFolders(user, { type: APP_TYPES.MODULE });

    const passedAppPermissions = findFolderAppsForFolders.mock.calls[0][1];
    expect(passedAppPermissions.isAllEditable).toBe(false);
  });

  it('builder with zero module/module-folder permissions sees NO module folders', async () => {
    // findFolderAppsForFolders reflects real DB filtering: with no editable/viewable
    // module app permissions, it returns no rows, so the folder ends up empty.
    const { service } = buildService(
      {
        isAdmin: false,
        isBuilder: true,
        [MODULES.MODULES]: { isAllEditable: false, editableAppsId: [], isAllViewable: false, viewableAppsId: [] },
        [MODULES.MODULE_FOLDER]: {
          isAllEditable: false,
          editableFoldersId: [],
          isAllViewable: false,
          viewableFoldersId: [],
          isAllEditApps: false,
          editAppsInFoldersId: [],
        },
      },
      []
    );

    const result = await service.getFolders(user, { type: APP_TYPES.MODULE });

    expect(result.folders).toHaveLength(0);
  });

  it('admin still sees the module folder regardless of granular permissions', async () => {
    const { service } = buildService({
      isAdmin: true,
      isBuilder: false,
      [MODULES.MODULES]: { isAllEditable: false, editableAppsId: [], isAllViewable: false, viewableAppsId: [] },
      [MODULES.MODULE_FOLDER]: undefined,
    });

    const result = await service.getFolders(user, { type: APP_TYPES.MODULE });

    expect(result.folders).toHaveLength(1);
  });
});
