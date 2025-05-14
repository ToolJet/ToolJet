import { AbilityBuilder } from '@casl/ability';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../../constants';
import { App } from '@entities/app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureAbility } from './index';

export function defineDataQueryWorkflowAbility(
  can: AbilityBuilder<FeatureAbility>['can'],
  UserAllPermissions: UserAllPermissions,
  workflowId?: string
): void {
  const { superAdmin, isAdmin, userPermission } = UserAllPermissions;
  const resourcePermissions = userPermission?.[MODULES.WORKFLOWS];
  const isAllEditable = !!resourcePermissions?.isAllEditable;
  const isCanCreate = userPermission.workflowCreate;
  const isCanDelete = userPermission.workflowDelete;
  const isAllExecutable = !!resourcePermissions?.isAllExecutable;

  // Always grant RUN_EDITOR and RUN_VIEWER permissions
  can([FEATURE_KEY.RUN_EDITOR, FEATURE_KEY.RUN_VIEWER], App);

  if (isAdmin || superAdmin) {
    can(
      [
        FEATURE_KEY.CREATE,
        FEATURE_KEY.GET,
        FEATURE_KEY.UPDATE,
        FEATURE_KEY.DELETE,
        FEATURE_KEY.UPDATE_DATA_SOURCE,
        FEATURE_KEY.UPDATE_ONE,
        FEATURE_KEY.RUN_EDITOR,
        FEATURE_KEY.RUN_VIEWER,
        FEATURE_KEY.PREVIEW,
      ],
      App
    );
    return;
  }

  if (isAllEditable || isCanCreate || isCanDelete) {
    can(
      [
        FEATURE_KEY.GET,
        FEATURE_KEY.UPDATE,
        FEATURE_KEY.UPDATE_ONE,
        FEATURE_KEY.RUN_EDITOR,
        FEATURE_KEY.RUN_VIEWER,
        FEATURE_KEY.PREVIEW,
        FEATURE_KEY.DELETE,
        FEATURE_KEY.CREATE,
      ],
      App
    );
    return;
  }

  if (
    resourcePermissions?.editableWorkflowsId?.length &&
    workflowId &&
    resourcePermissions?.editableWorkflowsId?.includes(workflowId)
  ) {
    can(
      [
        FEATURE_KEY.GET,
        FEATURE_KEY.UPDATE,
        FEATURE_KEY.UPDATE_ONE,
        FEATURE_KEY.RUN_EDITOR,
        FEATURE_KEY.RUN_VIEWER,
        FEATURE_KEY.PREVIEW,
        FEATURE_KEY.DELETE,
        FEATURE_KEY.CREATE,
      ],
      App
    );
    return;
  }

  if (isAllExecutable) {
    can([FEATURE_KEY.GET, FEATURE_KEY.PREVIEW, FEATURE_KEY.RUN_VIEWER, FEATURE_KEY.RUN_EDITOR], App);
    return;
  }

  if (
    resourcePermissions?.executableWorkflowsId?.length &&
    workflowId &&
    resourcePermissions?.executableWorkflowsId?.includes(workflowId)
  ) {
    can([FEATURE_KEY.GET, FEATURE_KEY.PREVIEW, FEATURE_KEY.RUN_VIEWER, FEATURE_KEY.RUN_EDITOR], App);
    return;
  }
}
