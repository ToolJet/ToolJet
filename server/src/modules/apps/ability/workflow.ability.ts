import { AbilityBuilder } from '@casl/ability';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { App } from '@entities/app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureAbility } from './index';

export function defineWorkflowAbility(
  can: AbilityBuilder<FeatureAbility>['can'],
  UserAllPermissions: UserAllPermissions,
  workflowId?: string
): void {
  const { superAdmin, isAdmin, userPermission } = UserAllPermissions;
  const userWorkflowPermissions = userPermission?.[MODULES.WORKFLOWS];
  const isAllWorkflowsEditable = !!userWorkflowPermissions?.isAllEditable;
  const isAllWorkflowsCreatable = !!userPermission?.workflowCreate;
  const isAllWorkflowsDeletable = !!userPermission?.workflowDelete;
  const isAllWorkflowsExecutable = !!userWorkflowPermissions?.isAllExecutable;

  // Workflow listing is available to all
  can(FEATURE_KEY.GET, App);

  if (isAdmin || superAdmin) {
    // Admin or super admin can do all operations
    can(
      [
        FEATURE_KEY.CREATE,
        FEATURE_KEY.UPDATE,
        FEATURE_KEY.DELETE,
        FEATURE_KEY.GET_ONE,
        FEATURE_KEY.GET_BY_SLUG,
        FEATURE_KEY.RELEASE,
        FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS,
        FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS,
      ],
      App
    );
    return;
  }

  if (isAllWorkflowsCreatable) {
    can(FEATURE_KEY.CREATE, App);
  }

  if (
    isAllWorkflowsEditable ||
    (userWorkflowPermissions?.editableWorkflowsId?.length &&
      workflowId &&
      userWorkflowPermissions.editableWorkflowsId.includes(workflowId))
  ) {
    can(
      [
        FEATURE_KEY.UPDATE,
        FEATURE_KEY.GET_ONE,
        FEATURE_KEY.GET_BY_SLUG,
        FEATURE_KEY.RELEASE,
        FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS,
        FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS,
      ],
      App
    );
    if (isAllWorkflowsDeletable) {
      // Gives delete permission only for editable workflows
      can(FEATURE_KEY.DELETE, App);
    }
    return;
  }

  if (
    isAllWorkflowsExecutable ||
    (userWorkflowPermissions?.executableWorkflowsId?.length &&
      workflowId &&
      userWorkflowPermissions.executableWorkflowsId.includes(workflowId))
  ) {
    // add view permissions for all workflows or specific workflow
    can([FEATURE_KEY.GET_ONE, FEATURE_KEY.GET_BY_SLUG, FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS], App);
  }
}
