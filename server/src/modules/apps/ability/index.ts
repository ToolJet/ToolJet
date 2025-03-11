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

  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], UserAllPermissions: UserAllPermissions): void {
    const { superAdmin, isAdmin, userPermission } = UserAllPermissions;

    const userAppPermissions = userPermission?.[MODULES.APP];
    const isAllAppsEditable = !!userAppPermissions?.isAllEditable;
    const isAllAppsCreatable = !!userPermission?.appCreate;
    const isAllAppsDeletable = !!userPermission?.appDelete;
    const isAllAppsViewable = !!userAppPermissions?.isAllViewable;

    // App listing is available to all
    can(FEATURE_KEY.GET, App);

    if (isAdmin || superAdmin) {
      // Admin or super admin and do all operations
      can(
        [
          FEATURE_KEY.CREATE,
          FEATURE_KEY.UPDATE,
          FEATURE_KEY.DELETE,
          FEATURE_KEY.GET_ASSOCIATED_TABLES,
          FEATURE_KEY.GET_ONE,
          FEATURE_KEY.GET_BY_SLUG,
          FEATURE_KEY.RELEASE,
          FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS,
          FEATURE_KEY.UPDATE_ICON,
          FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS,
        ],
        App
      );
      return;
    }

    if (isAllAppsCreatable) {
      can(FEATURE_KEY.CREATE, App);
    }

    if (isAllAppsEditable) {
      can(
        [
          FEATURE_KEY.UPDATE,
          FEATURE_KEY.GET_ASSOCIATED_TABLES,
          FEATURE_KEY.GET_ONE,
          FEATURE_KEY.GET_BY_SLUG,
          FEATURE_KEY.RELEASE,
          FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS,
          FEATURE_KEY.UPDATE_ICON,
          FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS,
        ],
        App
      );
      if (isAllAppsDeletable) {
        // Gives delete permission only for editable apps
        can(FEATURE_KEY.DELETE, App);
      }
      return;
    } else if (userAppPermissions?.editableAppsId?.length) {
      can(
        [
          FEATURE_KEY.DELETE,
          FEATURE_KEY.UPDATE_ICON,
          FEATURE_KEY.GET_ONE,
          FEATURE_KEY.GET_BY_SLUG,
          FEATURE_KEY.RELEASE,
          FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS,
          FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS,
          FEATURE_KEY.UPDATE,
          FEATURE_KEY.GET_ASSOCIATED_TABLES,
        ],
        App,
        { id: { $in: userAppPermissions.editableAppsId } }
      );
      if (isAllAppsDeletable) {
        // Gives delete permission only for editable apps
        can(FEATURE_KEY.DELETE, App, { id: { $in: userAppPermissions.editableAppsId } });
      }
    }

    if (isAllAppsViewable) {
      // add view permissions for all apps
      can(
        [
          FEATURE_KEY.GET_ONE,
          FEATURE_KEY.GET_BY_SLUG,
          FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS,
          FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS,
        ],
        App
      );
    } else if (userAppPermissions?.viewableAppsId?.length) {
      can(
        [
          FEATURE_KEY.GET_ONE,
          FEATURE_KEY.GET_BY_SLUG,
          FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS,
          FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS,
        ],
        App,
        { id: { $in: userAppPermissions.viewableAppsId } }
      );
    }
  }
}
