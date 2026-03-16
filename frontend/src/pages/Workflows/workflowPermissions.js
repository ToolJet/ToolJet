import { authenticationService } from '@/_services/authentication.service';

/**
 * Checks whether the current user can perform a given action on a workflow.
 *
 * @param {'create'|'read'|'update'|'delete'|'view'} action
 * @param {{ id: string }} [app] - the workflow app object (required for update/read/view checks)
 * @returns {boolean}
 */
export function canUserPerformWorkflowAction(action, app) {
  const { user_permissions, workflow_group_permissions, super_admin, admin } =
    authenticationService.currentSessionValue;

  if (super_admin)
    return {
      hasCreatePermission: true,
      hasUpdatePermission: true,
      hasDeletePermission: true,
      hasReadPermission: true,
      hasViewPermission: true,
    };

  const canCreate = admin || user_permissions?.workflow_create;
  const canUpdate =
    workflow_group_permissions?.is_all_editable || workflow_group_permissions?.editable_workflows_id?.includes(app?.id);
  const canExecute =
    canUpdate ||
    workflow_group_permissions?.is_all_executable ||
    workflow_group_permissions?.executable_workflows_id?.includes(app?.id);
  const canDelete = user_permissions?.workflow_delete || admin;

  return {
    hasCreatePermission: canCreate,
    hasUpdatePermission: canUpdate,
    hasDeletePermission: canDelete,
    hasReadPermission: canCreate || canUpdate || canDelete || canExecute,
    hasViewPermission:
      canCreate ||
      canUpdate ||
      canDelete ||
      canExecute ||
      workflow_group_permissions?.editable_workflows_id?.length > 0 ||
      workflow_group_permissions?.executable_workflows_id?.length > 0,
  };

  // switch (action) {
  //   case 'create':
  //     return canCreate;
  //   case 'read':
  //     return canCreate || canUpdate || canDelete || canExecute;
  //   case 'update':
  //     return canUpdate;
  //   case 'delete':
  //     return canDelete;
  //   case 'view':
  //     return (
  //       canCreate ||
  //       canUpdate ||
  //       canDelete ||
  //       canExecute ||
  //       workflow_group_permissions?.editable_workflows_id?.length > 0 ||
  //       workflow_group_permissions?.executable_workflows_id?.length > 0
  //     );
  //   default:
  //     return false;
  // }
}
