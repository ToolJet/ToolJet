import { AbilityBuilder } from '@casl/ability';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { App } from '@entities/app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureAbility } from './index';

export function defineAppAbility(
  can: AbilityBuilder<FeatureAbility>['can'],
  UserAllPermissions: UserAllPermissions,
  appId?: string
): void {
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
        FEATURE_KEY.APP_PUBLIC_UPDATE,
      ],
      App
    );
    return;
  }

  if (isAllAppsCreatable) {
    can(FEATURE_KEY.CREATE, App);
  }
  if (userPermission.appRelease) {
    can([FEATURE_KEY.RELEASE], App);
  }
  if (
    isAllAppsEditable ||
    (userAppPermissions?.editableAppsId?.length && appId && userAppPermissions.editableAppsId.includes(appId))
  ) {
    can(
      [
        FEATURE_KEY.UPDATE,
        FEATURE_KEY.GET_ASSOCIATED_TABLES,
        FEATURE_KEY.GET_ONE,
        FEATURE_KEY.GET_BY_SLUG,
        FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS,
        FEATURE_KEY.UPDATE_ICON,
        FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS,
        FEATURE_KEY.APP_PUBLIC_UPDATE,
      ],
      App
    );
    if (isAllAppsDeletable) {
      // Gives delete permission only for editable apps
      can(FEATURE_KEY.DELETE, App);
    }
    return;
  }

  if (
    isAllAppsViewable ||
    (userAppPermissions?.viewableAppsId?.length && appId && userAppPermissions.viewableAppsId.includes(appId))
  ) {
    // add view permissions for all apps or specific app
    can([FEATURE_KEY.GET_ONE, FEATURE_KEY.GET_BY_SLUG, FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS], App);
  }
}
