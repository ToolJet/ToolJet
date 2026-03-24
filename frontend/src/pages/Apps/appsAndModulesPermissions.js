import { authenticationService } from '@/_services/authentication.service';

/**
 * Checks whether the current user can perform actions on a front-end app or module.
 *
 * @param {'front-end'|'module'} appType
 * @param {{ id: string, user_id: string }} [app] - the app object (required for update/read/delete checks)
 * @returns {{ hasCreatePermission, hasReadPermission, hasUpdatePermission, hasDeletePermission }}
 */
export function canUserPerformAppAction(appType, app) {
  const currentSession = authenticationService.currentSessionValue;
  const { user_permissions, app_group_permissions, super_admin, admin, role, current_user } = currentSession;

  if (super_admin)
    return {
      hasCreatePermission: true,
      hasReadPermission: true,
      hasUpdatePermission: true,
      hasDeletePermission: true,
      hasViewPermission: true,
    };

  switch (appType) {
    case 'front-end': {
      const isOwner = current_user?.id == app?.user_id;

      const canUpdate =
        app_group_permissions &&
        (app_group_permissions.is_all_editable || app_group_permissions.editable_apps_id?.includes(app?.id));
      const canRead =
        (app_group_permissions && canUpdate) ||
        app_group_permissions?.is_all_viewable ||
        app_group_permissions?.viewable_apps_id?.includes(app?.id);

      const hasReadPermission = isOwner || canRead;
      const hasUpdatePermission = isOwner || canUpdate;

      return {
        hasCreatePermission: user_permissions?.app_create,
        hasReadPermission,
        hasUpdatePermission,
        hasDeletePermission: isOwner || user_permissions?.app_delete,
        hasViewPermission: hasReadPermission && !hasUpdatePermission,
      };
    }
    case 'module': {
      const hasPermission = role?.name === 'builder' || admin;

      return {
        hasCreatePermission: hasPermission,
        hasReadPermission: hasPermission,
        hasUpdatePermission: hasPermission,
        hasDeletePermission: hasPermission,
        hasViewPermission: hasPermission,
      };
    }
    default:
      return {
        hasCreatePermission: false,
        hasReadPermission: false,
        hasUpdatePermission: false,
        hasDeletePermission: false,
        hasViewPermission: false,
      };
  }
}
