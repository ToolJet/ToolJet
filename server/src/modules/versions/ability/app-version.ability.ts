import { AbilityBuilder } from '@casl/ability';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { App } from '@entities/app.entity';
import { FeatureAbility } from './index';
import { MODULES } from '@modules/app/constants/modules';

export function defineAppVersionAbility(
  can: AbilityBuilder<FeatureAbility>['can'],
  UserAllPermissions: UserAllPermissions,
  resourceId?: string
): void {
  const { superAdmin, isAdmin, userPermission, isBuilder } = UserAllPermissions;
  const resourceType = UserAllPermissions?.resource[0]?.resourceType;
  const permissionKey = resourceType === MODULES.MODULES ? MODULES.APP : resourceType;
  const userAppPermissions = userPermission?.[permissionKey];

  // For MODULE type apps every authenticated user can read the version --> modules are
  // fetched as dependencies during app preview and cannot be added to permission groups
  // (the app_type DB enum has no 'module' value), so the normal viewableAppsId path
  // can never grant access to them.
  if (resourceType === MODULES.MODULES && !isAdmin && !superAdmin && !isBuilder) {
    can([FEATURE_KEY.GET, FEATURE_KEY.GET_ONE, FEATURE_KEY.GET_EVENTS], App);
    return;
  }

  if (isAdmin || superAdmin || (resourceType === MODULES.MODULES && isBuilder)) {
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
        FEATURE_KEY.CLONE_GROUP,
        FEATURE_KEY.CLONE_PAGES,
        FEATURE_KEY.CLONE_GROUP,
        FEATURE_KEY.UPDATE_PAGES,
        FEATURE_KEY.DELETE_PAGE,
        FEATURE_KEY.REORDER_PAGES,
        FEATURE_KEY.GET_EVENTS,
        FEATURE_KEY.CREATE_EVENT,
        FEATURE_KEY.UPDATE_EVENT,
        FEATURE_KEY.DELETE_EVENT,
        FEATURE_KEY.APP_VERSION_CREATE,
        FEATURE_KEY.APP_VERSION_DELETE,
        FEATURE_KEY.APP_VERSION_UPDATE,
        FEATURE_KEY.APP_DRAFT_VERSION_CREATE,
      ],
      App
    );
    return;
  }

  const isAllEditable = !!userAppPermissions?.isAllEditable;
  const isAllViewable = !!userAppPermissions?.isAllViewable;
  if (userPermission.appPromote) {
    can([FEATURE_KEY.PROMOTE], App);
  }

  if (isAllEditable) {
    can(
      [
        FEATURE_KEY.GET,
        FEATURE_KEY.DELETE,
        FEATURE_KEY.CREATE,
        FEATURE_KEY.GET_ONE,
        FEATURE_KEY.UPDATE,
        FEATURE_KEY.UPDATE_SETTINGS,
        FEATURE_KEY.CREATE_COMPONENTS,
        FEATURE_KEY.UPDATE_COMPONENTS,
        FEATURE_KEY.UPDATE_COMPONENT_LAYOUT,
        FEATURE_KEY.DELETE_COMPONENTS,
        FEATURE_KEY.CREATE_PAGES,
        FEATURE_KEY.CLONE_PAGES,
        FEATURE_KEY.CLONE_GROUP,
        FEATURE_KEY.UPDATE_PAGES,
        FEATURE_KEY.DELETE_PAGE,
        FEATURE_KEY.REORDER_PAGES,
        FEATURE_KEY.GET_EVENTS,
        FEATURE_KEY.CREATE_EVENT,
        FEATURE_KEY.UPDATE_EVENT,
        FEATURE_KEY.DELETE_EVENT,
        FEATURE_KEY.APP_VERSION_CREATE,
        FEATURE_KEY.APP_VERSION_DELETE,
        FEATURE_KEY.APP_VERSION_UPDATE,
        FEATURE_KEY.APP_DRAFT_VERSION_CREATE,
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
        FEATURE_KEY.CREATE_COMPONENTS,
        FEATURE_KEY.UPDATE_COMPONENTS,
        FEATURE_KEY.UPDATE_COMPONENT_LAYOUT,
        FEATURE_KEY.DELETE_COMPONENTS,
        FEATURE_KEY.CREATE_PAGES,
        FEATURE_KEY.CLONE_PAGES,
        FEATURE_KEY.CLONE_GROUP,
        FEATURE_KEY.UPDATE_PAGES,
        FEATURE_KEY.DELETE_PAGE,
        FEATURE_KEY.REORDER_PAGES,
        FEATURE_KEY.GET_EVENTS,
        FEATURE_KEY.CREATE_EVENT,
        FEATURE_KEY.UPDATE_EVENT,
        FEATURE_KEY.DELETE_EVENT,
        FEATURE_KEY.APP_VERSION_CREATE,
        FEATURE_KEY.APP_VERSION_DELETE,
        FEATURE_KEY.APP_VERSION_UPDATE,
        FEATURE_KEY.APP_DRAFT_VERSION_CREATE,
      ],
      App
    );
  }

  if (isAllViewable) {
    can([FEATURE_KEY.GET_EVENTS, FEATURE_KEY.GET_ONE, FEATURE_KEY.GET], App);
  } else if (
    userAppPermissions?.viewableAppsId?.length &&
    resourceId &&
    userAppPermissions.viewableAppsId.includes(resourceId)
  ) {
    can([FEATURE_KEY.GET_EVENTS, FEATURE_KEY.GET_ONE, FEATURE_KEY.GET], App);
  }
}
