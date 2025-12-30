import { AbilityBuilder } from '@casl/ability';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { App } from '@entities/app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureAbility } from './index';

export function defineAppAbility(
  can: AbilityBuilder<FeatureAbility>['can'],
  UserAllPermissions: UserAllPermissions,
  appId?: string,
  request?: any
): void {
  const { superAdmin, isAdmin, userPermission, isBuilder } = UserAllPermissions;
  const userAppPermissions = userPermission?.[MODULES.APP];
  const isAllAppsEditable = !!userAppPermissions?.isAllEditable;
  const isAllAppsCreatable = !!userPermission?.appCreate;
  const isAllAppsDeletable = !!userPermission?.appDelete;
  const isAllAppsViewable = !!userAppPermissions?.isAllViewable;
  const resourceType = UserAllPermissions?.resource[0]?.resourceType;

  // Check if user is the owner of the app
  const app = request?.tj_app;
  const currentUserId = UserAllPermissions?.user?.id;
  const isAppOwner = app && currentUserId && app.userId === currentUserId;

  // Helper function to check if user can access released environment for an app
  const canAccessReleasedEnv = (appId: string): boolean => {
    if (!userAppPermissions) {
      return false;
    }

    // Check app-specific override first
    if (userAppPermissions.appSpecificEnvironmentAccess?.[appId]) {
      const hasAccess = userAppPermissions.appSpecificEnvironmentAccess[appId].released;
      return hasAccess;
    }

    // Fall back to default environment access
    const hasAccess = userAppPermissions.environmentAccess?.released ?? false;
    return hasAccess;
  };

  // App listing is available to all
  can(FEATURE_KEY.GET, App);

  if (isAdmin || superAdmin || (resourceType === MODULES.MODULES && isBuilder)) {
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
    const permissions = [
      FEATURE_KEY.UPDATE,
      FEATURE_KEY.GET_ASSOCIATED_TABLES,
      FEATURE_KEY.GET_ONE,
      FEATURE_KEY.GET_BY_SLUG,
      FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS,
      FEATURE_KEY.UPDATE_ICON,
      FEATURE_KEY.APP_PUBLIC_UPDATE,
    ];

    // Only grant released app access if user has canAccessReleased permission
    if (appId && canAccessReleasedEnv(appId)) {
      permissions.push(FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS);
    }

    can(permissions, App);
    if (isAllAppsDeletable || isAppOwner) {
      // Gives delete permission for editable apps if user has delete permission OR is the app owner
      can(FEATURE_KEY.DELETE, App);
    }
    return;
  }

  if (
    isAllAppsViewable ||
    (userAppPermissions?.viewableAppsId?.length && appId && userAppPermissions.viewableAppsId.includes(appId))
  ) {
    // Viewers (both builders and end-users with view-only permission) can access apps
    const permissions = [FEATURE_KEY.GET_ONE, FEATURE_KEY.GET_BY_SLUG];

    // Builders with view permission need VALIDATE_PRIVATE_APP_ACCESS to preview non-released environments
    // End-users should NOT get this permission as they can only access released apps
    if (isBuilder && appId) {
      // Check if builder has access to any non-released environment
      const hasNonReleasedAccess =
        userAppPermissions.appSpecificEnvironmentAccess?.[appId]?.development ||
        userAppPermissions.appSpecificEnvironmentAccess?.[appId]?.staging ||
        userAppPermissions.appSpecificEnvironmentAccess?.[appId]?.production ||
        (!userAppPermissions.appSpecificEnvironmentAccess?.[appId] &&
          (userAppPermissions.environmentAccess?.development ||
            userAppPermissions.environmentAccess?.staging ||
            userAppPermissions.environmentAccess?.production));

      if (hasNonReleasedAccess) {
        permissions.push(FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS);
      }
    }

    // Grant released access for end-users OR builders with released permission
    if (!isBuilder || (appId && canAccessReleasedEnv(appId))) {
      permissions.push(FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS);
    }

    can(permissions, App);
  }
}
