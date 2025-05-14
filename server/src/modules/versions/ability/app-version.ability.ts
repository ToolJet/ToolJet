import { AbilityBuilder } from '@casl/ability';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { App } from '@entities/app.entity';
import { FeatureAbility } from './index';

export function defineAppVersionAbility(
  can: AbilityBuilder<FeatureAbility>['can'],
  UserAllPermissions: UserAllPermissions,
  resourceId?: string
): void {
  const { superAdmin, isAdmin, userPermission, resource } = UserAllPermissions;
  const userAppPermissions = userPermission?.[resource[0].resourceType];

  if (isAdmin || superAdmin) {
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

  const isAllEditable = !!userAppPermissions?.isAllEditable;
  const isAllViewable = !!userAppPermissions?.isAllViewable;

  if (isAllEditable) {
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
  } else if (
    userAppPermissions?.editableAppsId?.length &&
    resourceId &&
    userAppPermissions.editableAppsId.includes(resourceId)
  ) {
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

  if (isAllViewable) {
    can([FEATURE_KEY.GET_EVENTS], App);
  } else if (
    userAppPermissions?.viewableAppsId?.length &&
    resourceId &&
    userAppPermissions.viewableAppsId.includes(resourceId)
  ) {
    can([FEATURE_KEY.GET_EVENTS], App);
  }
}
