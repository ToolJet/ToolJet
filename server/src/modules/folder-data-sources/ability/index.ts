import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { FolderDataSource } from '@entities/folder_data_source.entity';
import { MODULES } from '@modules/app/constants/modules';

type Subjects = InferSubjects<typeof FolderDataSource> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return FolderDataSource;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<FeatureAbility>['can'],
    UserAllPermissions: UserAllPermissions,
    extractedMetadata: { moduleName: string; features: string[] },
    request?: any
  ): void {
    const { superAdmin, userPermission, isAdmin } = UserAllPermissions;
    // The data-source-folder coarse create flag — NOT the app-folder folderCreate — so an
    // app-folder grant can never fall through to authorize data-source-folder mutations.
    const dataSourceFolderCreate = userPermission.dataSourceFolderCreate;
    // Data-source folders have their own granular-permission resource (ResourceType.DATA_SOURCE_FOLDER),
    // resolved into its own MODULES.DATA_SOURCE_FOLDER bucket — isolated from app/workflow/module
    // folder grants, matching how workflow and module folders each own their bucket.
    const folderPermissions = userPermission[MODULES.DATA_SOURCE_FOLDER];
    const ownerCanCreate =
      request?.tj_folder_owned_by_user && extractedMetadata.features?.includes(FEATURE_KEY.CREATE_FOLDER_DATA_SOURCE);
    const ownerCanDelete =
      request?.tj_folder_owned_by_user && extractedMetadata.features?.includes(FEATURE_KEY.DELETE_FOLDER_DATA_SOURCE);

    if (superAdmin || isAdmin) {
      can([FEATURE_KEY.CREATE_FOLDER_DATA_SOURCE, FEATURE_KEY.DELETE_FOLDER_DATA_SOURCE], FolderDataSource);
    } else {
      if (ownerCanCreate) can(FEATURE_KEY.CREATE_FOLDER_DATA_SOURCE, FolderDataSource);
      if (ownerCanDelete) can(FEATURE_KEY.DELETE_FOLDER_DATA_SOURCE, FolderDataSource);

      // The coarse flag and a granular per-folder grant are independent, additive routes to the
      // same permission — NOT "granular if present, else coarse". A user with dataSourceFolderCreate
      // but no granular DATA_SOURCE_FOLDER grant at all (folderPermissions still resolves to an
      // object with every id-list empty, not undefined) must keep authorizing on the coarse flag
      // alone, same as before granular per-folder DATA_SOURCE_FOLDER permissions existed.
      const folderId = request?.tj_resource_id;
      const hasGranularGrant =
        folderPermissions?.isAllEditable || (folderId && folderPermissions?.editableFoldersId?.includes(folderId));
      if (hasGranularGrant || dataSourceFolderCreate) {
        can([FEATURE_KEY.CREATE_FOLDER_DATA_SOURCE, FEATURE_KEY.DELETE_FOLDER_DATA_SOURCE], FolderDataSource);
      }
    }

    can([FEATURE_KEY.GET_FOLDERS], FolderDataSource); // No permission required
  }
}
