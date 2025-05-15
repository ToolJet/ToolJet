import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { App } from '@entities/app.entity';
import { MODULES } from '@modules/app/constants/modules';

type Subjects = InferSubjects<typeof App> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return App;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<FeatureAbility>['can'],
    UserAllPermissions: UserAllPermissions,
    extractedMetadata: { moduleName: string; features: string[] },
    request?: any
  ): void {
    const appId = request?.tj_resource_id;
    const { superAdmin, isAdmin, userPermission } = UserAllPermissions;

    const userAppPermissions = userPermission?.[MODULES.APP];
    const isAllAppsEditable = !!userAppPermissions?.isAllEditable;
    const isAllAppsViewable = !!userAppPermissions?.isAllViewable;

    if (isAdmin || superAdmin) {
      // Admin or super admin and do all operations
      can(
        [
          FEATURE_KEY.FETCH_USERS,
          FEATURE_KEY.FETCH_USER_GROUPS,
          FEATURE_KEY.FETCH_PAGE_PERMISSIONS,
          FEATURE_KEY.CREATE_PAGE_PERMISSIONS,
          FEATURE_KEY.UPDATE_PAGE_PERMISSIONS,
          FEATURE_KEY.DELETE_PAGE_PERMISSIONS,
        ],
        App
      );
      return;
    }

    if (
      isAllAppsEditable ||
      (userAppPermissions?.editableAppsId?.length && appId && userAppPermissions.editableAppsId.includes(appId))
    ) {
      can(
        [
          FEATURE_KEY.FETCH_USERS,
          FEATURE_KEY.FETCH_USER_GROUPS,
          FEATURE_KEY.FETCH_PAGE_PERMISSIONS,
          FEATURE_KEY.CREATE_PAGE_PERMISSIONS,
          FEATURE_KEY.UPDATE_PAGE_PERMISSIONS,
          FEATURE_KEY.DELETE_PAGE_PERMISSIONS,
        ],
        App
      );
      return;
    }

    if (
      isAllAppsViewable ||
      (userAppPermissions?.viewableAppsId?.length && appId && userAppPermissions.viewableAppsId.includes(appId))
    ) {
      can([FEATURE_KEY.FETCH_USERS, FEATURE_KEY.FETCH_USER_GROUPS, FEATURE_KEY.FETCH_PAGE_PERMISSIONS], App);
    }
  }
}
