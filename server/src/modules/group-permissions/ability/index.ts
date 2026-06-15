import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY, GROUP_PERMISSIONS_TYPE } from '../constants';
import { GroupPermissions } from '@entities/group_permissions.entity';

type Subjects = InferSubjects<typeof GroupPermissions> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return GroupPermissions;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<FeatureAbility>['can'],
    userAllPermissions: UserAllPermissions,
    _extractedMetadata?: { moduleName: string; features: string[] },
    request?: any
  ): void {
    const { superAdmin, isAdmin, isBuilder } = userAllPermissions;

    if (superAdmin || isAdmin) {
      can(
        [
          FEATURE_KEY.ADD_GROUP_USER,
          FEATURE_KEY.CREATE,
          FEATURE_KEY.DELETE,
          FEATURE_KEY.DELETE_GROUP_USER,
          FEATURE_KEY.DUPLICATE,
          FEATURE_KEY.GET_ADDABLE_USERS,
          FEATURE_KEY.GET_ONE,
          FEATURE_KEY.GET_ALL,
          FEATURE_KEY.UPDATE,
          FEATURE_KEY.GET_ALL_GROUP_USER,
          FEATURE_KEY.DELETE_GRANULAR_APP_PERMISSIONS,
          FEATURE_KEY.DELETE_GRANULAR_DATA_PERMISSIONS,
          FEATURE_KEY.CREATE_GRANULAR_APP_PERMISSIONS,
          FEATURE_KEY.CREATE_GRANULAR_DATA_PERMISSIONS,
          FEATURE_KEY.GET_ALL_GRANULAR_PERMISSIONS,
          FEATURE_KEY.GET_ADDABLE_APPS,
          FEATURE_KEY.UPDATE_GRANULAR_APP_PERMISSIONS,
          FEATURE_KEY.UPDATE_GRANULAR_DATA_PERMISSIONS,
          FEATURE_KEY.GET_ADDABLE_DS,
          FEATURE_KEY.USER_ROLE_CHANGE,
          FEATURE_KEY.CREATE_GRANULAR_FOLDER_PERMISSIONS,
          FEATURE_KEY.UPDATE_GRANULAR_FOLDER_PERMISSIONS,
          FEATURE_KEY.DELETE_GRANULAR_FOLDER_PERMISSIONS,
          FEATURE_KEY.GET_ADDABLE_FOLDERS,
          FEATURE_KEY.ASSIGN_GROUP_ADMIN,
          FEATURE_KEY.REVOKE_GROUP_ADMIN,
          FEATURE_KEY.GET_GROUP_ADMINS,
          FEATURE_KEY.GET_ADDABLE_ADMINS,
          FEATURE_KEY.GET_USER_ADMIN_GROUPS,
        ],
        GroupPermissions
      );
      return;
    }

    if (!isBuilder) return;

    // tj_admin_groups is populated by EE GroupExistenceGuard only; always [] in CE
    const adminGroups: GroupPermissions[] = request?.tj_admin_groups || [];
    if (adminGroups.length === 0) return;

    can(
      [
        FEATURE_KEY.GET_ALL,
        FEATURE_KEY.GET_ADDABLE_APPS,
        FEATURE_KEY.GET_ADDABLE_DS,
        FEATURE_KEY.GET_ADDABLE_FOLDERS,
        FEATURE_KEY.GET_USER_ADMIN_GROUPS,
      ],
      GroupPermissions
    );

    const requestedGroup: GroupPermissions | undefined = request?.tj_group;
    const requestedGroupId: string | undefined = request?.tj_resource_id || requestedGroup?.id;

    if (!requestedGroupId) return;

    if (adminGroups.some((g) => g.id === requestedGroupId)) {
      can(
        [
          FEATURE_KEY.GET_ONE,
          FEATURE_KEY.ADD_GROUP_USER,
          FEATURE_KEY.DELETE_GROUP_USER,
          FEATURE_KEY.GET_ADDABLE_USERS,
          FEATURE_KEY.GET_ALL_GROUP_USER,
          FEATURE_KEY.GET_GROUP_ADMINS,
          FEATURE_KEY.GET_ALL_GRANULAR_PERMISSIONS,
        ],
        GroupPermissions
      );
    } else if (requestedGroup?.type === GROUP_PERMISSIONS_TYPE.DEFAULT) {
      can(
        [FEATURE_KEY.GET_ONE, FEATURE_KEY.GET_ALL_GROUP_USER, FEATURE_KEY.GET_ALL_GRANULAR_PERMISSIONS],
        GroupPermissions
      );
    }
    // Builders never get: ASSIGN_GROUP_ADMIN, REVOKE_GROUP_ADMIN, GET_ADDABLE_ADMINS
  }
}
