import { AbilityBuilder } from '@casl/ability';
import { UserAllPermissions } from '@modules/app/types';
import { APP_TYPES, FEATURE_KEY } from '../constants';
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
  const isAllModulesCreatable = !!userPermission?.moduleCreate;
  const isAllModulesDeletable = !!userPermission?.moduleDelete;
  const isAllAppsViewable = !!userAppPermissions?.isAllViewable;
  const resourceType = UserAllPermissions?.resource[0]?.resourceType;
  const isCreatingModule = request?.body?.type === APP_TYPES.MODULE;

  // Check if user is the owner of the app
  const app = request?.tj_app;
  const currentUserId = UserAllPermissions?.user?.id;
  const isAppOwner = app && currentUserId && app.userId === currentUserId;

  const isModuleApp = app?.type === APP_TYPES.MODULE;

  if ((resourceType === MODULES.MODULES || isModuleApp) && !isAdmin && !superAdmin && !isBuilder) {
    can([FEATURE_KEY.GET, FEATURE_KEY.GET_ONE, FEATURE_KEY.GET_BY_SLUG, FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS], App);
    return;
  }

  // Helper function to check if user can access released environment for an app
  const canAccessReleasedEnv = (appId: string): boolean => {
    if (!userAppPermissions) {
      return false;
    }

    // Merge app-specific and default permissions (UNION logic)
    const appSpecificReleased = userAppPermissions.appSpecificEnvironmentAccess?.[appId]?.released ?? false;
    const defaultReleased = userAppPermissions.environmentAccess?.released ?? false;

    return appSpecificReleased || defaultReleased;
  };

  // App listing is available to all
  can(FEATURE_KEY.GET, App);

  if ((resourceType === MODULES.MODULES || isModuleApp) && !isAdmin && !superAdmin) {
    // Per-module edit/view grants for non-admin builders (Edit vs Build-with)
    const userModulePermissions = userPermission?.[MODULES.MODULES];
    const isAllModulesEditable = !!userModulePermissions?.isAllEditable;
    const isAllModulesViewable = !!userModulePermissions?.isAllViewable;
    const isEditable =
      isAllModulesEditable ||
      !!(
        userModulePermissions?.editableAppsId?.length &&
        appId &&
        userModulePermissions.editableAppsId.includes(appId)
      );
    const isViewable =
      isAllModulesViewable ||
      !!(
        userModulePermissions?.viewableAppsId?.length &&
        appId &&
        userModulePermissions.viewableAppsId.includes(appId)
      );

    if (isEditable) {
      can(
        [
          FEATURE_KEY.UPDATE,
          FEATURE_KEY.GET_ONE,
          FEATURE_KEY.GET_BY_SLUG,
          FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS,
          FEATURE_KEY.UPDATE_ICON,
          FEATURE_KEY.RELEASE,
        ],
        App
      );
      if (isAllModulesDeletable || isAppOwner) {
        can(FEATURE_KEY.DELETE, App);
      }
      return;
    }
    if (isViewable) {
      // Build-with: can open module builder read-only; UPDATE intentionally excluded
      can([FEATURE_KEY.GET_ONE, FEATURE_KEY.GET_BY_SLUG, FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS], App);
      return;
    }
    // No permissions: only basic listing (GET already granted above)
    return;
  }

  if (isAdmin || superAdmin) {
    // Admin or super admin: full permissions
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

  if (isAllAppsCreatable || (isCreatingModule && isAllModulesCreatable)) {
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

    // Check if user has access to any non-released environment (merge app-specific and default)
    const appSpecific = userAppPermissions.appSpecificEnvironmentAccess?.[appId];
    const defaultAccess = userAppPermissions.environmentAccess;

    const hasNonReleasedAccess =
      appSpecific?.development ||
      defaultAccess?.development ||
      appSpecific?.staging ||
      defaultAccess?.staging ||
      appSpecific?.production ||
      defaultAccess?.production;

    // Both builders and end-users with non-released environment access need VALIDATE_PRIVATE_APP_ACCESS
    // This allows end-users in paid plans to access staging/development/production environments
    if (appId && hasNonReleasedAccess) {
      permissions.push(FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS);
    }

    // Grant released access based on explicit permissions or end-user defaults
    if (isBuilder) {
      // Builders: Only grant released access if they have explicit released environment permission
      if (appId && canAccessReleasedEnv(appId)) {
        permissions.push(FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS);
      }
    } else {
      // End-users: Always grant released access if they have viewable app permission (already checked above)
      permissions.push(FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS);
    }

    can(permissions, App);
  }
}
