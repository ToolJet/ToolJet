import { AbilityBuilder } from '@casl/ability';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { App } from '@entities/app.entity';
import { FeatureAbility } from './index';

export function defineWorkflowVersionAbility(
  can: AbilityBuilder<FeatureAbility>['can'],
  UserAllPermissions: UserAllPermissions,
  resourceId?: string
): void {
  const { superAdmin, isAdmin, userPermission, resource } = UserAllPermissions;
  const userWorkflowPermissions = userPermission?.[resource[0].resourceType];

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
      ],
      App
    );
    return;
  }

  const isAllEditable = !!userWorkflowPermissions?.isAllEditable;
  const isAllExecutable = !!userWorkflowPermissions?.isAllExecutable;

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
      ],
      App
    );
  } else if (
    userWorkflowPermissions?.editableWorkflowsId?.length &&
    resourceId &&
    userWorkflowPermissions.editableWorkflowsId.includes(resourceId)
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
      ],
      App
    );
  }

  if (isAllExecutable) {
    can([FEATURE_KEY.GET_EVENTS], App);
  } else if (
    userWorkflowPermissions?.executableWorkflowsId?.length &&
    resourceId &&
    userWorkflowPermissions.executableWorkflowsId.includes(resourceId)
  ) {
    can([FEATURE_KEY.GET_EVENTS], App);
  }
}
