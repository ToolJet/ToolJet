import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { MODULES } from '@modules/app/constants/modules';
import { App } from '@entities/app.entity';

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

    if (isAdmin || superAdmin || isAllAppsEditable) {
      // Admin or super admin and do all operations
      can(
        [
          FEATURE_KEY.GET,
          FEATURE_KEY.DELETE,
          FEATURE_KEY.CREATE,
          FEATURE_KEY.GET_ONE,
          FEATURE_KEY.UPDATE,
          FEATURE_KEY.UPDATE_SETTINGS,
          FEATURE_KEY.PROMOTE,
          FEATURE_KEY.CREATE_COMPONENTS,
          FEATURE_KEY.UPDATE_COMPONENTS,
          FEATURE_KEY.UPDATE_COMPONENT_LAYOUT,
          FEATURE_KEY.DELETE_COMPONENTS,
          FEATURE_KEY.CREATE_PAGES,
          FEATURE_KEY.CLONE_PAGES,
          FEATURE_KEY.UPDATE_PAGES,
          FEATURE_KEY.DELETE_PAGE,
          FEATURE_KEY.REORDER_PAGES,
          FEATURE_KEY.GET_EVENTS,
          FEATURE_KEY.CREATE_EVENT,
          FEATURE_KEY.UPDATE_EVENT,
          FEATURE_KEY.DELETE_EVENT,
        ],
        App
      );
      return;
    }

    if (userAppPermissions?.editableAppsId?.length && appId && userAppPermissions.editableAppsId.includes(appId)) {
      can(
        [
          FEATURE_KEY.GET,
          FEATURE_KEY.DELETE,
          FEATURE_KEY.CREATE,
          FEATURE_KEY.GET_ONE,
          FEATURE_KEY.UPDATE,
          FEATURE_KEY.UPDATE_SETTINGS,
          FEATURE_KEY.PROMOTE,
          FEATURE_KEY.CREATE_COMPONENTS,
          FEATURE_KEY.UPDATE_COMPONENTS,
          FEATURE_KEY.UPDATE_COMPONENT_LAYOUT,
          FEATURE_KEY.DELETE_COMPONENTS,
          FEATURE_KEY.CREATE_PAGES,
          FEATURE_KEY.CLONE_PAGES,
          FEATURE_KEY.UPDATE_PAGES,
          FEATURE_KEY.DELETE_PAGE,
          FEATURE_KEY.REORDER_PAGES,
          FEATURE_KEY.GET_EVENTS,
          FEATURE_KEY.CREATE_EVENT,
          FEATURE_KEY.UPDATE_EVENT,
          FEATURE_KEY.DELETE_EVENT,
        ],
        App
      );
    }

    if (isAllAppsViewable) {
      // add view permissions for all apps
      can([FEATURE_KEY.GET_EVENTS], App);
    } else if (
      userAppPermissions?.viewableAppsId?.length &&
      appId &&
      userAppPermissions.viewableAppsId.includes(appId)
    ) {
      can([FEATURE_KEY.GET_EVENTS], App);
    }
  }
}
