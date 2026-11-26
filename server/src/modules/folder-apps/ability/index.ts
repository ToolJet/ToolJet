import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { FolderApp } from '@entities/folder_app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';
type Subjects = InferSubjects<typeof FolderApp> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

// Folder-flavor → the UserPermissions bucket holding its resolved folder access.
// Add an entry here (not another ternary arm) when a new folder-owning resource type is introduced.
// Exported so FolderAppsService.getFolders resolves the same bucket the ability check uses.
export const FOLDER_RESOURCE_TYPE_BY_APP_TYPE: Partial<Record<APP_TYPES, MODULES>> = {
  [APP_TYPES.WORKFLOW]: MODULES.WORKFLOW_FOLDER,
  [APP_TYPES.MODULE]: MODULES.MODULE_FOLDER,
};

// True when, before the folder add changes anything, the caller already owns or can edit every app.
// Unknown folder types fall back to the front-end app bucket.
function canEditEveryApp(
  userPermission: UserAllPermissions['userPermission'],
  folderType: APP_TYPES,
  appIds: string[],
  ownedAppIds: string[] = []
) {
  const notOwned = appIds.filter((id) => !ownedAppIds.includes(id));
  if (!notOwned.length) return true;
  if (folderType === APP_TYPES.WORKFLOW) {
    const workflows = userPermission?.[MODULES.WORKFLOWS];
    return (
      !!workflows && (workflows.isAllEditable || notOwned.every((id) => workflows.editableWorkflowsId?.includes(id)))
    );
  }
  const apps = userPermission?.[folderType === APP_TYPES.MODULE ? MODULES.MODULES : MODULES.APP];
  return !!apps && (apps.isAllEditable || notOwned.every((id) => apps.editableAppsId?.includes(id)));
}

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return FolderApp;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<FeatureAbility>['can'],
    UserAllPermissions: UserAllPermissions,
    extractedMetadata: { moduleName: string; features: string[] },
    request?: any
  ): void {
    if (request?.tj_folder_app_type_mismatch) {
      return;
    }

    const { superAdmin, userPermission, isAdmin } = UserAllPermissions;
    const folderCreate = userPermission.folderCreate;
    const folderResourceType = FOLDER_RESOURCE_TYPE_BY_APP_TYPE[request?.tj_folder_type as APP_TYPES] ?? MODULES.FOLDER;
    const folderPermissions = userPermission[folderResourceType];
    const addAppIds: string[] | undefined = request?.tj_folder_add_app_ids;
    const canEditAppsBeingAdded =
      !addAppIds ||
      canEditEveryApp(userPermission, request?.tj_folder_type, addAppIds, request?.tj_folder_add_owned_app_ids);
    const ownerCanCreateFolderApp =
      request?.tj_allow_owner_folder_app_create && extractedMetadata.features?.includes(FEATURE_KEY.CREATE_FOLDER_APP);
    const ownerCanDeleteFolderApp =
      request?.tj_allow_owner_folder_app_delete && extractedMetadata.features?.includes(FEATURE_KEY.DELETE_FOLDER_APP);

    if (superAdmin || isAdmin) {
      can([FEATURE_KEY.CREATE_FOLDER_APP, FEATURE_KEY.DELETE_FOLDER_APP], FolderApp);
    } else {
      // Folder access (owner, granular or the coarse flag) says who may organise a folder. Adding an app also
      // needs edit access on that app, since folder access makes the app editable once it is inside.
      const folderAppKeys = canEditAppsBeingAdded
        ? [FEATURE_KEY.CREATE_FOLDER_APP, FEATURE_KEY.DELETE_FOLDER_APP]
        : [FEATURE_KEY.DELETE_FOLDER_APP];

      if (ownerCanCreateFolderApp && canEditAppsBeingAdded) {
        can(FEATURE_KEY.CREATE_FOLDER_APP, FolderApp);
      }

      if (ownerCanDeleteFolderApp) {
        can(FEATURE_KEY.DELETE_FOLDER_APP, FolderApp);
      }

      if (folderPermissions) {
        if (folderPermissions.isAllEditable) {
          // User can edit ALL folders
          can(folderAppKeys, FolderApp);
        } else if (folderPermissions.editableFoldersId?.length > 0) {
          const folderId = request?.tj_resource_id;
          if (folderId && folderPermissions.editableFoldersId.includes(folderId)) {
            can(folderAppKeys, FolderApp);
          }
        }
      } else if (folderCreate) {
        can(folderAppKeys, FolderApp);
      }
    }

    can([FEATURE_KEY.GET_FOLDERS], FolderApp); // No permission required
  }
}
